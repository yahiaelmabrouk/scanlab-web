import _ from 'lodash'

const physioService = {
  namespaced: true,
  state: {
    isSlow: false,
    isPause: false,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  actions: {
    setIsSlow({ commit }, payload) {
      commit('set', {
        isSlow: payload,
      })
    },
    setIsPause({ commit }, payload) {
      commit('set', {
        isPause: payload,
      })
    },
  },
}

export default physioService
