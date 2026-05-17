import _ from 'lodash'
import { apiGet } from '../util/api'

const globalOptions = {
  namespaced: true,
  state: {
    questionSets: [],
    isAppLoading: false,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  // TODO de/serialize sat bands/etc - put into result.answer?
  actions: {
    async fetchQuestionSetOptions({ commit, rootState }) {
      const response = await apiGet(`questionSets/options`, rootState.authentication.accessToken)
      commit('set', {
        questionSets: response.data.questionSets,
      })
    },
    setAppLoading({ commit }, isAppLoading) {
      commit('set', { isAppLoading })
    },
  },
}

export default globalOptions
