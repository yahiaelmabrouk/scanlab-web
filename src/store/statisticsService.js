import { apiGet } from '../util/api'
import _ from 'lodash'

const statisticsService = {
  namespaced: true,
  state: {
    loading: true,
    isLoadedScore: false,
    isLoadedRawScore: false,
    angulationProcessing: false,
    coverageProcessing: false,
    activeBodyParts: [],
    activeBodyPartDetails: [],
    rawData: {},
    examDateRange: null,
    curveDateRange: null,
    sandboxMode: 'non-sandbox',
    rawMriData: {},
    visibleGraphs: [],
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
    startLoading(state) {
      state.loading = true
    },
    endLoading(state, data) {
      _.extend(state, data)
      state.loading = false
    },
    setLoadedScore(state) {
      state.isLoadedScore = true
    },
    setLoadedRawScore(state) {
      state.isLoadedRawScore = true
    },
    setProcessing(state, data) {
      if (data.type === 'angulation') {
        state.angulationProcessing = data.processing
      } else if (data.type === 'coverage') {
        state.coverageProcessing = data.processing
      }
    },
    setActiveBodyParts(state, data) {
      state.activeBodyParts = data
    },
    setActiveBodyPartDetails(state, data) {
      state.activeBodyPartDetails = data
    },
    setSandboxMode(state, sandboxMode) {
      state.sandboxMode = sandboxMode
    },
    setExamDateRange(state, range) {
      state.examDateRange = range
    },
    setCurveDateRange(state, range) {
      state.curveDateRange = range
    },
    setRawData(state, rawData) {
      state.rawData = { ...rawData }
    },
    setRawMriData(state, rawMriData) {
      state.rawMriData = { ...rawMriData }
    },
    setCriticalThinkingScoresData(state, criticalThinkingScoresData) {
      state.criticalThinkingScoresData = { ...state.criticalThinkingScoresData, ...criticalThinkingScoresData }
    },
    setVisibleGraphs(state, visibleGraph) {
      if (!state.visibleGraphs.find((graph) => graph.userId === visibleGraph.userId))
        state.visibleGraphs = [...state.visibleGraphs, visibleGraph]
    },
    resetVisibleGraphs(state) {
      state.visibleGraphs = []
    },
    resetLoadedStatus(state) {
      state.isLoadedScore = false
      state.isLoadedRawScore = false
    },
  },
  actions: {
    async getScanlabScores({ commit, state, rootState }, { whom, isAlwaysLoad }) {
      const includeChallengeModeScores = rootState.user.isAdmin || rootState.user.isManager

      if (!state.isLoadedScore) commit('startLoading')

      // const filteredWhom = Array.isArray(whom)
      //   ? whom.filter((userId) => !Object.keys(state.rawData).includes(userId))
      //   : typeof whom === 'string' && (!Object.keys(state.rawData).includes(whom) || isAlwaysLoad)
      //   ? whom
      //   : null
      let filteredWhom = Array.isArray(whom)
        ? whom
        : typeof whom === 'string' && (!Object.keys(state.rawData).includes(whom) || isAlwaysLoad)
        ? whom
        : null

      if ((typeof filteredWhom === 'string' && filteredWhom) || (Array.isArray(filteredWhom) && filteredWhom.length)) {
        const response = await apiGet(
          `statistics/tests/whom?include_challenge_mode_scores=${includeChallengeModeScores}&whom=${filteredWhom}`,
          rootState.authentication.accessToken
        )

        commit('setRawData', _.get(response, ['data', 'data'], {}))
      }

      if (state.loading) commit('endLoading')
      commit('setLoadedScore')
    },
    async getScanlabScoresOnly({ rootState }, { whom }) {
      const response = await apiGet(`statistics/tests/${whom}/scores`, rootState.authentication.accessToken)
      return _.get(response, 'data', [])
    },
    async getMyAverageScanlabScore({ rootState }) {
      const response = await apiGet(
        `statistics/tests/user_${rootState.authentication.userId}/scores`,
        rootState.authentication.accessToken
      )
      return _.get(response, 'data', [])
    },
    async getFactorScores_Angle({ rootState }, { whom, mean, points }) {
      const meanQueryParam = `mean=${!!mean}`
      const pointsQueryParam = `points=${!!points}`
      // if (whom.startsWith('cohort_')) {
      //   return { mean: 1.1, points: [] }
      // }
      // data shape: {mean: number, points: [{x: unix timestamp, y: angleOff}]}
      const response = await apiGet(
        `statistics/factors/angle?${meanQueryParam}&${pointsQueryParam}&whom=${whom}`,
        rootState.authentication.accessToken
      )
      return _.get(response, 'data.data')
    },
    async getWastedSlices({ rootState }, { whom, mean, points }) {
      const meanQueryParam = `mean=${!!mean}`
      const pointsQueryParam = `points=${!!points}`

      // if (whom.startsWith('cohort_')) {
      //   return { success: true, data: {} }
      // }

      const response = await apiGet(
        `statistics/derived/wastedSlices?${meanQueryParam}&${pointsQueryParam}&whom=${whom}`,
        rootState.authentication.accessToken
      )
      return _.get(response, 'data.data')
    },
    async getRawMRIScores({ commit, state, rootState }, { whom }) {
      const includeChallengeModeScores = rootState.user.isAdmin || rootState.user.isManager

      if (!state.isLoadedRawScore) commit('startLoading')

      const response = await apiGet(
        `statistics?include_challenge_mode_scores=${includeChallengeModeScores}&whom=${whom}`,
        rootState.authentication.accessToken
      )

      commit('setRawMriData', response.data.data)

      if (state.loading) commit('endLoading')
      commit('setLoadedRawScore')
    },

    async getRawCriticalThinkingScores({ rootState }, { whom }) {
      const includeChallengeModeScores = rootState.user.isAdmin || rootState.user.isManager
      let response = await apiGet(
        `statistics/mc/${whom}?include_challenge_mode_scores=${includeChallengeModeScores}`,
        rootState.authentication.accessToken
      )

      return response.data.data
    },
  },
  getters: {
    activeBodyPartGroupName(state, getters, rootState, rootGetters) {
      const languageCode = rootGetters['user/languageCode']
      const translatedContent = rootState.translatedContent.translatedContent
      const defaultGroupName = state.activeBodyParts.join(', ')
      const isExistTranslated = !_.some(state.activeBodyPartDetails, (part) => {
        return !translatedContent[`bodyPart|${part.id}|${languageCode}`]
      })
      if (isExistTranslated) {
        return state.activeBodyPartDetails
          .map((part) => translatedContent[`bodyPart|${part.id}|${languageCode}`].name)
          .join(', ')
      } else {
        return defaultGroupName
      }
    },
  },
}

export default statisticsService
