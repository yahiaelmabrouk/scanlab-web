import { apiGet } from '../util/api'
import _ from 'lodash'

const bodyService = {
  namespaced: true,
  state: {},
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  actions: {
    async getBodyParts({ rootState }, { regionId } = {}) {
      let url = 'bodyParts'
      if (regionId) {
        url += `?regionId=${regionId}`
      }
      let response = await apiGet(url, rootState.authentication.accessToken)
      return response.data.bodyParts
    },

    async getAllRegions({ rootState }) {
      let response = await apiGet('regions', rootState.authentication.accessToken)
      return response.data.regions
    },

    async getTestableRegions({ rootState }) {
      let response = await apiGet('regions/testable', rootState.authentication.accessToken)
      return response.data.regions
    },

    async getTestableBodyParts({ rootState }) {
      let response = await apiGet('bodyParts/testable', rootState.authentication.accessToken)
      return response.data.bodyParts
    },

    async getCategories({ rootState }) {
      let response = await apiGet('categories', rootState.authentication.accessToken)
      return response.data.categories
    },
  },
  getters: {},
}

export default bodyService
