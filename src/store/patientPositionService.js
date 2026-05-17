import _ from 'lodash'
import { apiGet } from '../util/api'
import Vue from 'vue'

const patientPositionService = {
  namespaced: true,
  state: {
    patientPositionVariants: [],
    patientPositionSets: [],
    bodyPartId: null,
    isLoading: false,
    selectedPositionSetId: null,
    previewCopyPatientPosition: {
      from: null,
      to: null,
      enable: false,
      data: null,
    },
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  watchGetters: {
    currentBodyPartId: 'updatePatientPositionsByBodyPartId',
  },
  actions: {
    async resetPreviewCopyPatientPosition({ commit }) {
      commit('set', {
        previewCopyPatientPosition: {
          from: null,
          to: null,
          enable: false,
          data: null,
        },
      })
    },
    async setPreviewCopyPatientPosition({ commit }, payload) {
      commit('set', {
        previewCopyPatientPosition: {
          enable: true,
          ...payload,
        },
      })
    },
    updatePreviewCopyPatientPosition({ commit, state }, { bodyPartId, patientPositions }) {
      const data = _.cloneDeep(state.previewCopyPatientPosition)
      if (data?.data[bodyPartId]) {
        const removeIndexes = []
        _.cloneDeep(data.data[bodyPartId]).forEach((el, index) => {
          const foundedItem = patientPositions.find((o) => o.id == el.id)
          if (foundedItem) {
            if (foundedItem.bodyBox) {
              data.data[bodyPartId][index].bodyBoxes = [foundedItem.bodyBox]
            } else {
              data.data[bodyPartId][index].bodyBoxes = []
            }
          } else {
            removeIndexes.push(index)
          }
        })
        data.data[bodyPartId] = data.data[bodyPartId].filter((el, index) => !removeIndexes.includes(index))
        patientPositions.forEach((el) => {
          const foundedItem = data.data[bodyPartId].find((o) => o.id == el.id)
          if (!foundedItem) {
            const newItem = _.cloneDeep(el)
            if (el.bodyBox) {
              newItem.bodyBoxes = [el.bodyBox]
            } else {
              newItem.bodyBoxes = []
            }
            delete newItem.bodyBox
            data.data[bodyPartId].push(newItem)
          }
        })

        commit('set', {
          previewCopyPatientPosition: data,
        })
      }
    },
    async addPatientPositionVariant({ commit, state }, payload) {
      commit('set', { patientPositionVariants: [...state.patientPositionVariants, payload] })
    },
    async deletePatientPositionVariant({ commit, state }, payload) {
      commit('set', { patientPositionVariants: state.patientPositionVariants.filter((el) => el.id != payload) })
    },
    async setPatientPositionVariants({ commit }, payload) {
      commit('set', { patientPositionVariants: payload })
    },
    async setPatientPositionSets({ commit }, payload) {
      commit('set', { patientPositionSets: payload })
    },
    async setBodyPartId({ commit }, payload) {
      commit('set', { bodyPartId: payload })
    },
    async setSelectedPositionSetId({ commit }, payload) {
      commit('set', { selectedPositionSetId: payload })
    },
    async setPositionIsLoading({ commit }, payload) {
      commit('set', { isLoading: payload })
    },
    // Used in manage exam positions, no need modelId when get patientPositions
    async updatePatientPositionsByBodyPartId({ dispatch, state, commit }) {
      if (!state.bodyPartId) {
        commit('set', { patientPositionVariants: [], patientPositionSets: [] })
      } else {
        commit('set', { isLoading: true })
        let patientPositions = await dispatch('getPatientPositionsByBodyPartId', { bodyPartId: state.bodyPartId })
        let sets = await dispatch('getPatientPositionSetsByBodyPartId', { bodyPartId: state.bodyPartId })
        commit('set', {
          patientPositionVariants: patientPositions,
          patientPositionSets: sets,
          selectedPositionSetId: _.get(sets, [0, 'id'], null),
          isLoading: false,
        })
      }
      Vue.notify({ text: 'Get successfully!' })
    },
    // Default modelId : 1
    async getPatientPositionsByBodyPartId({ rootState, state }, { bodyPartId, modelId }) {
      const query = { bodyPartId, modelId }
      Object.keys(query).forEach((key) => query[key] === undefined && delete query[key])
      const queryParams = new URLSearchParams(query)
      if (state.previewCopyPatientPosition.enable && state.previewCopyPatientPosition.to == modelId) {
        return _.cloneDeep(_.get(state.previewCopyPatientPosition, ['data', bodyPartId], []))
      } else {
        let response = await apiGet(`/patientPositions?${queryParams.toString()}`, rootState.authentication.accessToken)
        return response.data.patientPositions
      }
    },
    async getAllPatientPositionsByModelId({ rootState }, { modelId }) {
      const query = { modelId }
      Object.keys(query).forEach((key) => query[key] === undefined && delete query[key])
      const queryParams = new URLSearchParams(query)
      let response = await apiGet(
        `/patientPositions/getAllByModelId?${queryParams.toString()}`,
        rootState.authentication.accessToken
      )
      return response.data.patientPositions
    },
    async getPatientPositionSetsByBodyPartId({ rootState }, { bodyPartId }) {
      const query = { bodyPartId }
      Object.keys(query).forEach((key) => query[key] === undefined && delete query[key])
      const queryParams = new URLSearchParams(query)
      let response = await apiGet(`/patientPositionSet?${queryParams.toString()}`, rootState.authentication.accessToken)
      return response.data.data
    },
  },
  getters: {
    currentBodyPartId(state) {
      return state.bodyPartId
    },
    patientPositionVariantsOfSelectedSet(state) {
      return state.patientPositionVariants.filter((el) => el.positionSetId == state.selectedPositionSetId)
    },
  },
}
export default patientPositionService
