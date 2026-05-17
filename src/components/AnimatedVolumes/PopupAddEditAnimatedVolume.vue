<template>
  <v-dialog persistent v-model="show" max-width="800px">
    <v-card>
      <v-card-title class="headline">
        {{ isAddMode ? $t('global.add_animated_volume') : $t('global.edit_animated_volume') }}
      </v-card-title>

      <v-stepper v-model="currentStep" vertical>
        <!-- Step 1: Basic Information -->
        <v-stepper-step :complete="currentStep > 1" step="1"> Basic Information </v-stepper-step>
        <v-stepper-content step="1">
          <v-form v-model="step1Valid" ref="step1Form">
            <v-row class="m-0">
              <v-col cols="12">
                <v-text-field
                  :rules="rules.required"
                  outlined
                  v-model="animatedVolume.name"
                  :label="$t('global.name')"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea outlined v-model="animatedVolume.description" :label="$t('global.description')" rows="3" />
              </v-col>
              <v-col cols="12">
                <v-select
                  :rules="rules.required"
                  outlined
                  v-model="animatedVolume.bodyPartId"
                  :items="bodyParts"
                  item-text="name"
                  item-value="id"
                  :label="$t('global.select_body_part')"
                  required
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  :rules="rules.positiveNumber"
                  outlined
                  v-model.number="animatedVolume.frameCount"
                  :label="$t('global.frame_count')"
                  type="number"
                  min="1"
                  required
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  :rules="rules.positiveNumber"
                  outlined
                  v-model.number="animatedVolume.frameRate"
                  :label="$t('global.frame_rate')"
                  type="number"
                  min="1"
                  step="0.1"
                />
              </v-col>
            </v-row>
            <v-card-actions>
              <v-btn text @click="closeDialog">{{ $t('global.cancel') }}</v-btn>
              <v-spacer></v-spacer>
              <v-btn color="primary" :disabled="!step1Valid" @click="currentStep = 2">
                {{ $t('global.next') }}
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-stepper-content>

        <!-- Step 2: Tissue Types -->
        <v-stepper-step :complete="currentStep > 2" step="2">
          {{ $t('global.configure_tissue_types') }}
        </v-stepper-step>
        <v-stepper-content step="2">
          <v-row class="m-0">
            <v-col cols="12">
              <h4>{{ $t('global.tissue_types') }}</h4>
              <p class="text-caption">Select the tissue types for this animated volume:</p>
            </v-col>
            <v-col cols="12">
              <v-chip-group v-model="selectedTissueTypes" multiple mandatory column>
                <v-chip
                  v-for="tissueType in availableTissueTypes"
                  :key="tissueType.value"
                  :value="tissueType.value"
                  filter
                  outlined
                >
                  {{ tissueType.text }}
                </v-chip>
              </v-chip-group>
            </v-col>
            <v-col cols="12" v-if="selectedTissueTypes.length === 0">
              <v-alert type="warning" dense> Please select at least one tissue type to continue. </v-alert>
            </v-col>
          </v-row>
          <v-card-actions>
            <v-btn text @click="currentStep = 1">{{ $t('global.back') }}</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="selectedTissueTypes.length === 0" @click="currentStep = 3">
              {{ $t('global.next') }}
            </v-btn>
          </v-card-actions>
        </v-stepper-content>

        <!-- Step 3: Upload Volume Files -->
        <v-stepper-step :complete="currentStep > 3" step="3">
          {{ $t('global.upload_volume_frames') }}
        </v-stepper-step>
        <v-stepper-content step="3">
          <v-row class="m-0">
            <v-col cols="12">
              <h4>{{ $t('global.upload_volume_frames') }}</h4>
              <p class="text-caption">
                Upload {{ animatedVolume.frameCount }} volume files for each selected tissue type.
              </p>
            </v-col>
            <v-col cols="12" v-for="tissueType in selectedTissueTypes" :key="tissueType">
              <v-card outlined class="mb-4">
                <v-card-title class="subtitle-1 d-flex align-center">
                  {{ getTissueTypeName(tissueType) }}
                  <v-spacer></v-spacer>
                  <v-chip :color="getFileStatusColor(tissueType)" small outlined>
                    {{ getFileStatusText(tissueType) }}
                  </v-chip>
                </v-card-title>
                <v-card-text>
                  <VolumeFrameUploader
                    :tissue-type="tissueType"
                    :expected-frame-count="animatedVolume.frameCount"
                    :existing-files="originalUploadedFiles[tissueType]"
                    @files-changed="onFilesChanged"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-card-actions>
            <v-btn text @click="currentStep = 2">{{ $t('global.back') }}</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" :disabled="!allFilesReady" @click="currentStep = 4">
              {{ $t('global.next') }}
            </v-btn>
          </v-card-actions>
        </v-stepper-content>

        <!-- Step 4: Review and Save -->
        <v-stepper-step step="4"> Review & Save </v-stepper-step>
        <v-stepper-content step="4">
          <v-row class="m-0">
            <v-col cols="12">
              <h4>Review Configuration</h4>
            </v-col>
            <v-col cols="12">
              <v-simple-table dense>
                <tbody>
                  <tr>
                    <td><strong>Name:</strong></td>
                    <td>{{ animatedVolume.name }}</td>
                  </tr>
                  <tr>
                    <td><strong>Description:</strong></td>
                    <td>{{ animatedVolume.description || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td><strong>Body Part:</strong></td>
                    <td>{{ getBodyPartName(animatedVolume.bodyPartId) }}</td>
                  </tr>
                  <tr>
                    <td><strong>Frame Count:</strong></td>
                    <td>{{ animatedVolume.frameCount }}</td>
                  </tr>
                  <tr>
                    <td><strong>Frame Rate:</strong></td>
                    <td>{{ animatedVolume.frameRate }} FPS</td>
                  </tr>
                  <tr>
                    <td><strong>Tissue Types:</strong></td>
                    <td>
                      <v-chip v-for="tissueType in selectedTissueTypes" :key="tissueType" class="ma-1" small>
                        {{ getTissueTypeName(tissueType) }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-col>
          </v-row>

          <!-- Save Progress -->
          <v-row v-if="loading">
            <v-col cols="12">
              <v-card outlined color="blue lighten-5">
                <v-card-text>
                  <div class="d-flex align-center">
                    <v-progress-circular
                      :value="saveProgress"
                      :color="saveProgress === 100 ? 'success' : 'primary'"
                      size="40"
                      class="mr-3"
                    >
                      {{ Math.round(saveProgress) }}%
                    </v-progress-circular>
                    <div>
                      <div class="subtitle-2">{{ saveStep }}</div>
                      <div class="caption text--secondary">Please wait while we save your animated volume...</div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-card-actions>
            <v-btn text :disabled="loading" @click="currentStep = 3">{{ $t('global.back') }}</v-btn>
            <v-btn text :disabled="loading" @click="closeDialog">{{ $t('global.cancel') }}</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="success" :loading="loading" :disabled="loading" @click="save">
              {{ loading ? 'Saving...' : 'Save & Upload' }}
            </v-btn>
          </v-card-actions>
        </v-stepper-content>
      </v-stepper>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex'
import VolumeFrameUploader from './VolumeFrameUploader.vue'

export default {
  name: 'PopupAddEditAnimatedVolume',
  components: {
    VolumeFrameUploader,
  },
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    volumeId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      saveProgress: 0,
      saveStep: '',
      currentStep: 1,
      step1Valid: false,
      animatedVolume: {
        name: '',
        description: '',
        bodyPartId: null,
        frameCount: 30,
        frameRate: 10,
        hasWm: false,
        hasSkin: false,
        hasPd: false,
        hasMuscles: false,
        hasMarrow: false,
        hasGm: false,
        hasFat2: false,
        hasFat: false,
        hasDura: false,
        hasCsf: false,
      },
      selectedTissueTypes: [],
      uploadedFiles: {},
      originalUploadedFiles: {}, // Store original frames data for passing to child components
      tissueTypeValidation: {}, // Track validation status for each tissue type
      bodyParts: [],
      availableTissueTypes: [
        { text: this.$t('global.tissue_type_wm'), value: 'WM' },
        { text: this.$t('global.tissue_type_skin'), value: 'SKIN' },
        { text: this.$t('global.tissue_type_pd'), value: 'PD' },
        { text: this.$t('global.tissue_type_muscles'), value: 'MUSCLES' },
        { text: this.$t('global.tissue_type_marrow'), value: 'MARROW' },
        { text: this.$t('global.tissue_type_gm'), value: 'GM' },
        { text: this.$t('global.tissue_type_fat2'), value: 'FAT2' },
        { text: this.$t('global.tissue_type_fat'), value: 'FAT' },
        { text: this.$t('global.tissue_type_dura'), value: 'DURA' },
        { text: this.$t('global.tissue_type_csf'), value: 'CSF' },
      ],
      rules: {
        required: [(value) => !!value || 'This field is required.'],
        positiveNumber: [
          (value) => !!value || 'This field is required.',
          (value) => value > 0 || 'Must be a positive number.',
        ],
      },
    }
  },
  computed: {
    isAddMode() {
      return !this.volumeId
    },
    allFilesReady() {
      // Must have at least one tissue type selected
      if (this.selectedTissueTypes.length === 0) {
        return false
      }

      // Check that all selected tissue types have valid files
      return this.selectedTissueTypes.every((tissueType) => {
        const files = this.uploadedFiles[tissueType]
        const isValid = this.tissueTypeValidation[tissueType]

        // Handle new object structure with allFrames property
        if (files && files.allFrames) {
          return (
            Array.isArray(files.allFrames) &&
            files.allFrames.length === this.animatedVolume.frameCount &&
            isValid === true
          )
        }

        // Backward compatibility: handle old array structure
        return Array.isArray(files) && files.length === this.animatedVolume.frameCount && isValid === true
      })
    },
  },
  beforeDestroy() {
    // Cleanup file references when component is destroyed
    this.cleanupFileReferences()
  },
  watch: {
    show(val) {
      if (val) {
        this.resetForm()
        this.loadBodyParts()
        if (this.volumeId) {
          this.loadAnimatedVolume()
        }
      }
    },
    selectedTissueTypes: {
      handler(newTypes, oldTypes) {
        // Sync selectedTissueTypes array back to boolean flags
        this.animatedVolume.hasWm = newTypes.includes('WM')
        this.animatedVolume.hasSkin = newTypes.includes('SKIN')
        this.animatedVolume.hasPd = newTypes.includes('PD')
        this.animatedVolume.hasMuscles = newTypes.includes('MUSCLES')
        this.animatedVolume.hasMarrow = newTypes.includes('MARROW')
        this.animatedVolume.hasGm = newTypes.includes('GM')
        this.animatedVolume.hasFat2 = newTypes.includes('FAT2')
        this.animatedVolume.hasFat = newTypes.includes('FAT')
        this.animatedVolume.hasDura = newTypes.includes('DURA')
        this.animatedVolume.hasCsf = newTypes.includes('CSF')

        // Initialize uploadedFiles and validation for new tissue types
        newTypes.forEach((tissueType) => {
          if (!this.uploadedFiles[tissueType]) {
            this.$set(this.uploadedFiles, tissueType, [])
          }
          if (this.tissueTypeValidation[tissueType] === undefined) {
            this.$set(this.tissueTypeValidation, tissueType, false)
          }
        })

        // Clean up removed tissue types
        if (oldTypes) {
          oldTypes.forEach((tissueType) => {
            if (!newTypes.includes(tissueType)) {
              this.$delete(this.uploadedFiles, tissueType)
              this.$delete(this.tissueTypeValidation, tissueType)
            }
          })
        }
      },
      deep: true,
    },
  },
  methods: {
    ...mapActions('bodyService', ['getBodyParts']),
    ...mapActions('animatedVolumeService', ['getAnimatedVolume', 'createAnimatedVolume', 'updateAnimatedVolume']),

    resetForm() {
      this.currentStep = 1
      this.step1Valid = false
      this.animatedVolume = {
        name: '',
        description: '',
        bodyPartId: null,
        frameCount: 30,
        frameRate: 10,
        hasWm: false,
        hasSkin: false,
        hasPd: false,
        hasMuscles: false,
        hasMarrow: false,
        hasGm: false,
        hasFat2: false,
        hasFat: false,
        hasDura: false,
        hasCsf: false,
      }
      this.selectedTissueTypes = []
      this.uploadedFiles = {}
      this.tissueTypeValidation = {}
    },

    async loadBodyParts() {
      try {
        this.bodyParts = await this.getBodyParts()
      } catch (error) {
        console.error('Error loading body parts:', error)
        this.$notify({ type: 'error', text: 'Error loading body parts' })
      }
    },

    async loadAnimatedVolume() {
      try {
        this.loading = true
        const volume = await this.getAnimatedVolume(this.volumeId)

        if (!volume) {
          throw new Error(`Animated volume with ID ${this.volumeId} not found`)
        }

        this.animatedVolume = {
          name: volume.name || '',
          description: volume.description || '',
          bodyPartId: volume.bodyPartId || null,
          frameCount: volume.frameCount || 1,
          frameRate: volume.frameRate || 30,
          hasWm: volume.hasWm || false,
          hasSkin: volume.hasSkin || false,
          hasPd: volume.hasPd || false,
          hasMuscles: volume.hasMuscles || false,
          hasMarrow: volume.hasMarrow || false,
          hasGm: volume.hasGm || false,
          hasFat2: volume.hasFat2 || false,
          hasFat: volume.hasFat || false,
          hasDura: volume.hasDura || false,
          hasCsf: volume.hasCsf || false,
        }

        // Convert boolean flags to selectedTissueTypes array for UI
        this.selectedTissueTypes = []
        if (volume.hasWm) this.selectedTissueTypes.push('WM')
        if (volume.hasSkin) this.selectedTissueTypes.push('SKIN')
        if (volume.hasPd) this.selectedTissueTypes.push('PD')
        if (volume.hasMuscles) this.selectedTissueTypes.push('MUSCLES')
        if (volume.hasMarrow) this.selectedTissueTypes.push('MARROW')
        if (volume.hasGm) this.selectedTissueTypes.push('GM')
        if (volume.hasFat2) this.selectedTissueTypes.push('FAT2')
        if (volume.hasFat) this.selectedTissueTypes.push('FAT')
        if (volume.hasDura) this.selectedTissueTypes.push('DURA')
        if (volume.hasCsf) this.selectedTissueTypes.push('CSF')

        // Load existing frames data
        this.uploadedFiles = {}
        this.originalUploadedFiles = {}
        if (volume.frames) {
          Object.keys(volume.frames).forEach((tissueType) => {
            if (volume.frames[tissueType] && Array.isArray(volume.frames[tissueType])) {
              const frameFiles = volume.frames[tissueType].map((frame) => ({
                id: frame.id,
                name: frame.name || frame.fileName, // Handle both name and fileName
                size: frame.size || frame.fileSize, // Handle both size and fileSize
                type: frame.type || frame.fileType, // Handle both type and fileType
                frameIndex: frame.frameIndex,
                s3Url: frame.s3Url,
                uploadStatus: frame.uploadStatus,
                isExisting: true, // Flag to indicate this is an existing file
              }))

              // Store original frames for passing to child components
              this.$set(this.originalUploadedFiles, tissueType, frameFiles)

              // Initialize uploadedFiles with empty structure for new system
              this.$set(this.uploadedFiles, tissueType, {
                newFrames: [],
                removedFrameIds: [],
                allFrames: frameFiles, // Start with existing frames
              })
            }
          })
        }
      } catch (error) {
        console.error('Error loading animated volume:', error)
        this.$notify({ type: 'error', text: 'Error loading animated volume' })
      } finally {
        this.loading = false
      }
    },

    onFilesChanged({ tissueType, newFrames, removedFrameIds, isValid, allFrames }) {
      // Store the new data structure
      this.$set(this.uploadedFiles, tissueType, {
        newFrames: newFrames || [], // Files that need to be uploaded
        removedFrameIds: removedFrameIds || [], // IDs of existing frames to delete
        allFrames: allFrames || [], // All frames for display
      })
      this.$set(this.tissueTypeValidation, tissueType, isValid)
    },

    getBodyPartName(bodyPartId) {
      const bodyPart = this.bodyParts.find((bp) => bp.id === bodyPartId)
      return bodyPart ? bodyPart.name : 'Unknown'
    },

    getTissueTypeName(tissueType) {
      const typeMap = {
        WM: this.$t('global.tissue_type_wm'),
        SKIN: this.$t('global.tissue_type_skin'),
        PD: this.$t('global.tissue_type_pd'),
        MUSCLES: this.$t('global.tissue_type_muscles'),
        MARROW: this.$t('global.tissue_type_marrow'),
        GM: this.$t('global.tissue_type_gm'),
        FAT2: this.$t('global.tissue_type_fat2'),
        FAT: this.$t('global.tissue_type_fat'),
        DURA: this.$t('global.tissue_type_dura'),
        CSF: this.$t('global.tissue_type_csf'),
      }
      return typeMap[tissueType] || tissueType
    },

    getFileStatusText(tissueType) {
      const data = this.uploadedFiles[tissueType]
      const expected = this.animatedVolume.frameCount

      if (!data || (!data.allFrames?.length && !data.length)) {
        return 'No files'
      }

      // Handle both new and old data structures for compatibility
      if (data.allFrames) {
        // New structure
        const totalCount = data.allFrames.length
        const newCount = data.newFrames?.length || 0
        const existingCount = totalCount - newCount
        const removedCount = data.removedFrameIds?.length || 0

        let status = `${totalCount}/${expected}`
        let details = []
        if (existingCount > 0) details.push(`${existingCount} existing`)
        if (newCount > 0) details.push(`${newCount} new`)
        if (removedCount > 0) details.push(`${removedCount} to delete`)

        if (details.length > 0) {
          status += ` (${details.join(', ')})`
        }
        return status
      } else {
        // Old structure (for backward compatibility)
        const fileCount = data.length || 0
        return `${fileCount}/${expected} files`
      }
    },

    getFileStatusColor(tissueType) {
      const files = this.uploadedFiles[tissueType]
      let fileCount = 0

      // Handle new object structure with allFrames property
      if (files && files.allFrames) {
        fileCount = files.allFrames.length
      } else if (Array.isArray(files)) {
        // Backward compatibility: handle old array structure
        fileCount = files.length
      }

      const expected = this.animatedVolume.frameCount
      const isValid = this.tissueTypeValidation[tissueType]

      if (fileCount === 0) {
        return 'grey'
      } else if (fileCount === expected && isValid) {
        return 'success'
      } else if (fileCount === expected && !isValid) {
        return 'warning'
      } else {
        return 'error'
      }
    },

    async save() {
      // Pre-save validation
      if (this.selectedTissueTypes.length === 0) {
        this.$notify({ type: 'error', text: 'Please select at least one tissue type' })
        return
      }

      let createdVolumeId = null

      try {
        this.loading = true
        this.saveProgress = 0
        this.saveStep = 'Creating animated volume...'

        // Step 1: Create or update the animated volume
        let animatedVolume
        const volumeData = {
          name: this.animatedVolume.name,
          description: this.animatedVolume.description,
          bodyPartId: this.animatedVolume.bodyPartId,
          frameCount: this.animatedVolume.frameCount,
          frameRate: this.animatedVolume.frameRate,
          hasWm: this.animatedVolume.hasWm,
          hasSkin: this.animatedVolume.hasSkin,
          hasPd: this.animatedVolume.hasPd,
          hasMuscles: this.animatedVolume.hasMuscles,
          hasMarrow: this.animatedVolume.hasMarrow,
          hasGm: this.animatedVolume.hasGm,
          hasFat2: this.animatedVolume.hasFat2,
          hasFat: this.animatedVolume.hasFat,
          hasDura: this.animatedVolume.hasDura,
          hasCsf: this.animatedVolume.hasCsf,
        }

        if (this.isAddMode) {
          animatedVolume = await this.createAnimatedVolume(volumeData)
          createdVolumeId = animatedVolume.id // Track for potential rollback
        } else {
          animatedVolume = await this.updateAnimatedVolume({ volumeId: this.volumeId, volumeData })
        }

        this.saveProgress = 20
        this.saveStep = 'Preparing file upload...'

        // Step 2: Process frame changes - only upload new files and delete removed frames
        const newFramesToUpload = {}
        const framesToDelete = []
        let totalNewFiles = 0

        this.selectedTissueTypes.forEach((tissueType) => {
          const data = this.uploadedFiles[tissueType]
          if (data) {
            // Collect new frames that need to be uploaded
            if (data.newFrames && data.newFrames.length > 0) {
              newFramesToUpload[tissueType] = data.newFrames
              totalNewFiles += data.newFrames.length
            }

            // Collect existing frames that need to be deleted
            if (data.removedFrameIds && data.removedFrameIds.length > 0) {
              framesToDelete.push(...data.removedFrameIds)
            }
          }
        })

        let currentProgress = 40

        // Step 3a: Delete removed frames first
        if (framesToDelete.length > 0) {
          this.saveStep = `Deleting ${framesToDelete.length} removed frames...`
          for (const frameId of framesToDelete) {
            await this.$store.dispatch('animatedVolumeService/deleteVolumeFrame', frameId)
          }
          currentProgress = 50
          this.saveProgress = currentProgress
        }

        // Step 3b: Upload new frames only
        if (totalNewFiles > 0) {
          this.saveStep = `Uploading ${totalNewFiles} new frames to S3...`
          await this.$store.dispatch('animatedVolumeService/uploadVolumeFrames', {
            animatedVolumeId: animatedVolume.id,
            frameFilesByTissueType: newFramesToUpload,
            onProgress: (uploadProgress) => {
              // Map upload progress (0-100) to remaining progress range
              this.saveProgress = currentProgress + Math.round(uploadProgress * (40 / 100))
            },
          })
          currentProgress = 90
        } else {
          // No new files to upload
          currentProgress = 90
        }

        this.saveProgress = currentProgress
        this.saveStep = 'Finalizing...'

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 500))

        this.saveProgress = 100
        this.saveStep = 'Complete!'

        // Create success message based on what actually happened
        let successMessage
        if (this.isAddMode) {
          successMessage = `Animated volume created successfully`
          if (totalNewFiles > 0) successMessage += ` with ${totalNewFiles} frames`
        } else {
          const changes = []
          if (totalNewFiles > 0) changes.push(`${totalNewFiles} new frames uploaded`)
          if (framesToDelete.length > 0) changes.push(`${framesToDelete.length} frames removed`)

          if (changes.length > 0) {
            successMessage = `Animated volume updated successfully: ${changes.join(', ')}`
          } else {
            successMessage = `Animated volume updated successfully (metadata only)`
          }
        }

        this.$notify({
          type: 'success',
          text: successMessage,
        })

        this.$emit('refresh')
        this.closeDialog()
      } catch (error) {
        console.error('Error saving animated volume:', error)

        // Rollback: If we created a new volume but upload failed, delete it
        if (createdVolumeId && this.isAddMode) {
          try {
            this.saveStep = 'Rolling back changes...'
            await this.$store.dispatch('animatedVolumeService/deleteAnimatedVolume', createdVolumeId)
          } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError)
          }
        }

        const errorMessage = error.message || 'Error saving animated volume'
        this.$notify({ type: 'error', text: errorMessage })

        // Reset progress on error
        this.saveProgress = 0
        this.saveStep = ''
      } finally {
        this.loading = false
      }
    },

    closeDialog() {
      this.cleanupFileReferences()
      this.$emit('close')
    },

    cleanupFileReferences() {
      // Clear file references to prevent memory leaks
      Object.keys(this.uploadedFiles).forEach((tissueType) => {
        const data = this.uploadedFiles[tissueType]
        if (data) {
          // Clear file references in newFrames (actual File objects)
          if (data.newFrames && Array.isArray(data.newFrames)) {
            data.newFrames.forEach((file) => {
              // File objects are cleared by setting to null
              if (file && typeof file === 'object') {
                // Clear any file reference if it exists
                if (file.file) file.file = null
              }
            })
          }

          // Clear any file references in allFrames if needed (unlikely but safe)
          if (data.allFrames && Array.isArray(data.allFrames)) {
            data.allFrames.forEach((fileObj) => {
              if (fileObj && fileObj.file) {
                fileObj.file = null
              }
            })
          }
        }
      })

      // Reset data structures
      this.uploadedFiles = {}
      this.originalUploadedFiles = {}
      this.tissueTypeValidation = {}
    },
  },
}
</script>

<style scoped>
.v-stepper--vertical .v-stepper__content {
  width: 100%;
}
</style>
