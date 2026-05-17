import log from 'loglevel'
import _ from 'lodash'
import { apiGet, apiPatch } from '../util/api'

const cohortService = {
  namespaced: true,
  state: {
    cohorts: null,
    myCohorts: null,
    cohort: null, // currently loaded Cohort for if looking at a page about a Cohort (like Cohort Manager)
    myCohort: null, // the current user's cohort (the one they are a student of - if we support multiple one day, we need a way to switch which one is currently being acted upon, which would be this one)
    cohortLoading: null,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
    loading(state) {
      state.cohortLoading = true
      state.cohort = null
    },
    loaded(state, payload) {
      state.cohort = payload.cohort
      state.cohortLoading = false
    },
    setCohorts(state, payload) {
      state.cohorts = payload.cohorts
    },
    setMyCohorts(state, payload) {
      state.myCohorts = payload.myCohorts
    },
    setCohort(state, payload) {
      state.cohort = payload.cohort
    },
    setMyCohort(state, payload) {
      state.myCohort = payload.myCohort
    },
  },
  getters: {
    // These are for Cohort, not MyCohort
    isChallengeModeEnabled(state) {
      return _.get(state.cohort, 'adminSettings.isChallengeModeEnabled', false)
    },
    isIndividualSettingsEnabled(state) {
      return _.get(state.cohort, 'adminSettings.isIndividualSettingsEnabled', false)
    },
    // These are for MyCohort
    isChallengeModeEnabledForMe(state) {
      return _.get(state.myCohort, 'adminSettings.isChallengeModeEnabled', false)
    },
    isTeachingModeActive(state) {
      if (_.get(state.myCohort, 'settings.isTeachingModeEnabled', false)) return true
      return _.some(state.myCohorts, (c) => _.get(c, 'settings.isTeachingModeEnabled', false))
    },
    vendorUIs(state) {
      return _.get(state.myCohort, 'adminSettings.vendorUIs', {})
    },
    isEnableEPLabs(state) {
      return _.get(state.myCohort, 'adminSettings.enableEPLab', false)
    },
    isScientificModeEnabled(state) {
      return _.get(state.myCohort, 'adminSettings.scientificMode.enabled', false)
    },
  },
  actions: {
    async loadCohorts({ commit, rootState }) {
      const response = await apiGet('cohorts', rootState.authentication.accessToken)

      if (response?.data?.success) {
        commit('setCohorts', {
          cohorts: response.data.cohorts,
        })
      } else {
        this.$notify({ type: 'error', text: 'Failed to Load Cohorts' })
        log.debug(`Failed to Load Cohorts`)
      }
    },
    async loadMyCohorts({ state, commit, rootState }) {
      if (!state.myCohorts) {
        const response = await apiGet('cohorts', rootState.authentication.accessToken, { managedByMe: 'true' })

        if (response?.data?.success) {
          commit('setMyCohorts', {
            myCohorts: response.data.cohorts,
          })
        } else {
          this.$notify({ type: 'error', text: 'Failed to Load My Cohorts' })
          log.debug(`Failed to Load My Cohorts`)
        }
      }
    },
    async updateCohort({ state, commit, rootState }, { settings, cohortId, adminSettings }) {
      let response = await apiPatch(
        `cohorts/${cohortId}`,
        {
          settings,
          adminSettings,
        },
        rootState.authentication.accessToken
      )
      commit('setCohort', {
        cohort: response.data.cohort,
      })

      if (state.cohorts && state.cohorts.find((_cohort) => _cohort.id === response.data.cohort.id)) {
        let newCohorts = state.cohorts
        const cohort = newCohorts.find((_cohort) => _cohort.id === response.data.cohort.id)

        Object.assign(cohort, response.data.cohort)

        commit('setCohorts', {
          cohorts: newCohorts,
        })
      }

      if (state.myCohorts && state.myCohorts.find((_cohort) => _cohort.id === response.data.cohort.id)) {
        let newMyCohorts = state.myCohorts
        const myCohort = newMyCohorts.find((_cohort) => _cohort.id === response.data.cohort.id)

        Object.assign(myCohort, response.data.cohort)

        commit('setMyCohorts', {
          myCohorts: newMyCohorts,
        })
      }

      return response.data.success
    },
    async loadUserCohorts({ commit, rootState }) {
      let response = await apiGet('cohorts?mine=true', rootState.authentication.accessToken)
      commit('setMyCohort', {
        myCohort: _.first(response.data.cohorts),
      })
    },
    async loadCohort({ state, commit, rootState }, cohortId) {
      cohortId = parseInt(cohortId)

      if (!state.cohort || (state.cohort && state.cohort.id !== cohortId)) {
        log.debug(`Loading cohort: ${cohortId}`)
        commit('loading')

        let response = await apiGet(`cohorts/${cohortId}`, rootState.authentication.accessToken)

        if (response.data && response.data.success) {
          log.debug(`Loaded cohort: ${cohortId}`)
          commit('loaded', {
            cohort: response.data.cohort,
          })
        } else {
          // TODO: reflect loading errors in the state
          log.debug(`Failed to Load Cohort: ${cohortId}`)
        }
      }
    },
    reset({ commit }) {
      commit('set', {
        cohort: null,
        cohortLoading: null,
      })
    },
  },
}

export default cohortService
