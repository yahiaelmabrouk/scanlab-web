import _ from 'lodash'
import { apiGet, apiPost, apiPut } from '../util/api'
import Vue from 'vue'

const resourceService = {
  namespaced: true,
  state: {
    resourceCategories: [],
    loadingCategories: false,
  },
  watchStates: {},
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  getters: {},
  actions: {
    async loadAllResourceCategories({ commit, rootState }) {
      commit('set', { loadingCategories: true })
      // Load all resource categories
      const response = await apiGet(`/resourceCategories/all`, rootState.authentication.accessToken)
      commit('set', { resourceCategories: _.get(response, ['data', 'data'], []), loadingCategories: false })
    },
    async updateResourceCategory({ rootState, dispatch }, { id, name }) {
      // Update a resource category
      await apiPut(
        `/resourceCategories/${id}`,
        {},
        {
          name: name,
        },
        rootState.authentication.accessToken
      )
      Vue.notify({ type: 'success', text: 'Saved!' })
      dispatch('loadAllResourceCategories')
    },
    async createResourceCategory({ rootState, dispatch }, { name }) {
      // Create a resource category
      await apiPost(`/resourceCategories`, { name }, rootState.authentication.accessToken)
      Vue.notify({ type: 'success', text: 'Saved!' })
      dispatch('loadAllResourceCategories')
    },
  },
}

export default resourceService
