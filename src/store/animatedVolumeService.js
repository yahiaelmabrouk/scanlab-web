import { apiGet, apiPost, apiPut, apiDelete } from '../util/api'
import _ from 'lodash'

const animatedVolumeService = {
  namespaced: true,
  state: {
    animatedVolumes: [],
    loading: false,
    currentAnimatedVolume: null,
  },
  mutations: {
    set(state, payload) {
      _.extend(state, payload)
    },
    setAnimatedVolumes(state, animatedVolumes) {
      state.animatedVolumes = animatedVolumes
    },
    setCurrentAnimatedVolume(state, animatedVolume) {
      state.currentAnimatedVolume = animatedVolume
    },
    setLoading(state, loading) {
      state.loading = loading
    },
    addAnimatedVolume(state, animatedVolume) {
      if (animatedVolume && typeof animatedVolume === 'object') {
        state.animatedVolumes.push(animatedVolume)
      } else {
        console.error('Invalid animated volume data in addAnimatedVolume mutation:', animatedVolume)
      }
    },
    updateAnimatedVolume(state, updatedVolume) {
      if (updatedVolume && typeof updatedVolume === 'object' && updatedVolume.id) {
        const index = state.animatedVolumes.findIndex((volume) => volume.id === updatedVolume.id)
        if (index !== -1) {
          state.animatedVolumes.splice(index, 1, updatedVolume)
        }
      } else {
        console.error('Invalid animated volume data in updateAnimatedVolume mutation:', updatedVolume)
      }
    },
    removeAnimatedVolume(state, volumeId) {
      state.animatedVolumes = state.animatedVolumes.filter((volume) => volume.id !== volumeId)
    },
  },
  actions: {
    async loadAnimatedVolumes({ commit, rootState }) {
      commit('setLoading', true)
      try {
        const response = await apiGet('animated-volumes', rootState.authentication.accessToken)
        const volumes = response.data.data?.animatedVolumes || response.data.animatedVolumes || []
        commit('setAnimatedVolumes', volumes)
        return volumes
      } catch (error) {
        console.error('Error loading animated volumes:', error)
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async getAnimatedVolume({ commit, rootState }, volumeId) {
      commit('setLoading', true)
      try {
        const response = await apiGet(`animated-volumes/${volumeId}`, rootState.authentication.accessToken)
        const volume = response.data.data?.animatedVolume || response.data.animatedVolume
        commit('setCurrentAnimatedVolume', volume)
        return volume
      } catch (error) {
        console.error('Error getting animated volume:', error)
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async createAnimatedVolume({ commit, rootState }, volumeData) {
      commit('setLoading', true)
      try {
        const response = await apiPost('animated-volumes', volumeData, rootState.authentication.accessToken)
        const newVolume = response.data.data.animatedVolume
        if (!newVolume || !newVolume.id) {
          throw new Error('Invalid API response: missing animated volume data or ID')
        }
        commit('addAnimatedVolume', newVolume)
        return newVolume
      } catch (error) {
        console.error('Error creating animated volume:', error)
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async updateAnimatedVolume({ commit, rootState }, { volumeId, volumeData }) {
      commit('setLoading', true)
      try {
        const response = await apiPut(
          `animated-volumes/${volumeId}`,
          {},
          volumeData,
          rootState.authentication.accessToken
        )
        const updatedVolume = response.data.data?.animatedVolume || response.data.animatedVolume
        if (!updatedVolume) {
          throw new Error('Invalid API response: missing animated volume data')
        }
        commit('updateAnimatedVolume', updatedVolume)
        return updatedVolume
      } catch (error) {
        console.error('Error updating animated volume:', error)
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    async deleteAnimatedVolume({ commit, rootState }, volumeId) {
      commit('setLoading', true)
      try {
        await apiDelete(`animated-volumes/${volumeId}`, rootState.authentication.accessToken)
        commit('removeAnimatedVolume', volumeId)
        return true
      } catch (error) {
        console.error('Error deleting animated volume:', error)
        throw error
      } finally {
        commit('setLoading', false)
      }
    },

    // Get presigned URLs for S3 upload
    async getPresignedUploadUrl({ rootState }, { animatedVolumeId, filename, tissueType, frameIndex }) {
      try {
        const response = await apiPost(
          `animated-volumes/${animatedVolumeId}/frame-upload`,
          {
            tissueType,
            frameIndex,
            filename,
          },
          rootState.authentication.accessToken
        )
        return response.data.data || response.data
      } catch (error) {
        console.error('Error getting presigned URL:', error)
        throw error
      }
    },

    // Upload file directly to S3 using presigned URL
    async uploadFileToS3(context, { presignedData, file }) {
      try {
        const formData = new FormData()

        // Add all the fields from the presigned POST data
        Object.entries(presignedData.signature).forEach(([key, value]) => {
          formData.append(key, value)
        })

        // Add the file last
        formData.append('file', file)

        const response = await fetch(presignedData.postEndpoint, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`)
        }

        return {
          pathKey: presignedData.pathKey,
          success: true,
        }
      } catch (error) {
        console.error('Error uploading file to S3:', error)
        throw error
      }
    },

    // Notify backend that upload is complete
    async notifyUploadComplete(
      { rootState },
      { animatedVolumeId, pathKey, filename, tissueType, frameIndex, fileSize }
    ) {
      try {
        const response = await apiPost(
          `animated-volumes/${animatedVolumeId}/frame-upload-complete`,
          {
            pathKey,
            filename,
            tissueType,
            frameIndex,
            fileSize,
          },
          rootState.authentication.accessToken
        )
        return response.data.data || response.data.volumeFrame
      } catch (error) {
        console.error('Error notifying upload complete:', error)
        throw error
      }
    },

    async uploadVolumeFrames({ dispatch }, { animatedVolumeId, frameFilesByTissueType, onProgress }) {
      try {
        const allUploads = []
        let totalFiles = 0
        let completedFiles = 0

        // Count total files for progress tracking
        Object.values(frameFilesByTissueType).forEach((files) => {
          totalFiles += files.length
        })

        // Process each tissue type and its files
        for (const [tissueType, files] of Object.entries(frameFilesByTissueType)) {
          for (let frameIndex = 0; frameIndex < files.length; frameIndex++) {
            const file = files[frameIndex]

            try {
              // Step 1: Get presigned URL
              const presignedData = await dispatch('getPresignedUploadUrl', {
                animatedVolumeId,
                filename: file.name,
                tissueType,
                frameIndex,
              })

              // Step 2: Upload to S3
              const uploadResult = await dispatch('uploadFileToS3', {
                presignedData,
                file,
              })

              // Step 3: Notify backend
              const volumeFrame = await dispatch('notifyUploadComplete', {
                animatedVolumeId,
                pathKey: uploadResult.pathKey,
                filename: file.name,
                tissueType,
                frameIndex,
                fileSize: file.size,
              })

              allUploads.push(volumeFrame)
              completedFiles++

              // Update progress
              if (onProgress) {
                const progress = Math.round((completedFiles / totalFiles) * 100)
                onProgress(progress)
              }
            } catch (error) {
              console.error(`Failed to upload ${tissueType} frame ${frameIndex}:`, error)
              throw new Error(`Upload failed for ${tissueType} frame ${frameIndex}: ${error.message}`)
            }
          }
        }

        return allUploads
      } catch (error) {
        console.error('Error uploading volume frames:', error)
        throw error
      }
    },

    async getVolumeFrames({ rootState }, animatedVolumeId) {
      try {
        const response = await apiGet(
          `animated-volumes/${animatedVolumeId}/frames`,
          rootState.authentication.accessToken
        )
        return response.data.data?.volumeFrames || response.data.volumeFrames || {}
      } catch (error) {
        console.error('Error getting volume frames:', error)
        throw error
      }
    },

    async deleteVolumeFrame({ rootState }, frameId) {
      try {
        await apiDelete(`volume-frames/${frameId}`, rootState.authentication.accessToken)
        return true
      } catch (error) {
        console.error('Error deleting volume frame:', error)
        throw error
      }
    },
  },
  getters: {
    animatedVolumesByBodyPart: (state) => (bodyPartId) => {
      return state.animatedVolumes.filter((volume) => volume.bodyPartId === bodyPartId)
    },
    enabledTissueTypesForVolume: (state) => (volumeId) => {
      const volume = state.animatedVolumes.find((v) => v.id === volumeId)
      if (!volume) return []

      const enabledTypes = []
      if (volume.hasWm) enabledTypes.push('WM')
      if (volume.hasSkin) enabledTypes.push('SKIN')
      if (volume.hasPd) enabledTypes.push('PD')
      if (volume.hasMuscles) enabledTypes.push('MUSCLES')
      if (volume.hasMarrow) enabledTypes.push('MARROW')
      if (volume.hasGm) enabledTypes.push('GM')
      if (volume.hasFat2) enabledTypes.push('FAT2')
      if (volume.hasFat) enabledTypes.push('FAT')
      if (volume.hasDura) enabledTypes.push('DURA')
      if (volume.hasCsf) enabledTypes.push('CSF')
      return enabledTypes
    },
  },
}

export default animatedVolumeService
