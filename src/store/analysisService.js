import { apiAnalysis } from '../util/api'
import _ from 'lodash'

const analysisService = {
  namespaced: true,
  state: {
    isCohortGraphsLoaded: false,
    isCohortGraphsLoading: false,
    cohortId: null,
    isCohortGraphsError: false,
    isPersonGraphsLoaded: false,
    isPersonGraphsLoading: false,
    personId: null,
    isPersonGraphsError: false,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
    setCohortGraphsLoading(state) {
      state.isCohortGraphsLoaded = false
      state.isCohortGraphsLoading = true
      state.isCohortGraphsError = false
    },
    setCohortGraphsLoaded(state) {
      state.isCohortGraphsLoading = false
      state.isCohortGraphsLoaded = true
    },
    setCohortId(state, payload) {
      state.cohortId = payload.cohortId
    },
    setCohortGraphsError(state) {
      state.isCohortGraphsError = true
    },
    setPersonGraphsLoading(state) {
      state.isPersonGraphsLoaded = false
      state.isPersonGraphsLoading = true
      state.isPersonGraphsError = false
    },
    setPersonGraphsLoaded(state) {
      state.isPersonGraphsLoading = false
      state.isPersonGraphsLoaded = true
    },
    setPersonId(state, payload) {
      state.personId = payload.personId
    },
    setPersonGraphsError(state) {
      state.isPersonGraphsError = true
    },
  },
  actions: {
    async generateCohortGraphs({ rootState, commit }, { cohortId } = {}) {
      commit('setCohortId', { cohortId })
      commit('setCohortGraphsLoading')

      if (cohortId) {
        const response = await apiAnalysis(`analysis_cohort`, rootState.authentication.accessToken, {
          cohortId,
        })

        if (!response.data.success) commit('setCohortGraphsError')

        commit('setCohortGraphsLoaded')
      }
    },
    async generatePersonGraphs({ rootState, commit }, { personId }) {
      commit('setPersonId', { personId })
      commit('setPersonGraphsLoading')

      if (personId) {
        const response = await apiAnalysis(`analysis_person`, rootState.authentication.accessToken, {
          personId,
        })

        if (!response.data.success) commit('setPersonGraphsError')

        commit('setPersonGraphsLoaded')
      }
    },
  },
  getters: {},
}

export default analysisService
