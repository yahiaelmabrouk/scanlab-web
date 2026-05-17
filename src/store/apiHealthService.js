import _ from 'lodash'
import config from '../config'

let apiHealthInterval = null
const apiHealthService = {
  namespaced: true,
  state: {
    apiHealth: true,
    cruncherHealth: true,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  actions: {
    startCheckHealth({ commit }) {
      const checkHealth = async () => {
        if (!navigator.onLine) {
          commit('set', { apiHealth: false, cruncherHealth: false })
          return
        }
        try {
          // Avoid hanging fetches and add a small timeout wrapper here
          const response = await Promise.race([
            fetch('https://cruncher.api.scanlabmr.com', { cache: 'no-store' }),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500)),
          ])
          if (response.ok) {
            commit('set', { cruncherHealth: true })
          } else {
            commit('set', { cruncherHealth: false })
          }
        } catch (error) {
          // Expected signal for UI; do not escalate to Sentry
          console.warn('[health] cruncher ping failed:', error?.message || error)
          commit('set', { cruncherHealth: false })
        }

        try {
          const response = await fetch(config.apiRoot + '/health')
          if (response.ok) {
            commit('set', { apiHealth: true })
          } else {
            commit('set', { apiHealth: false })
          }
        } catch (error) {
          console.warn('[health] api ping failed:', error?.message || error)
          commit('set', { apiHealth: false })
        }
      }
      if (apiHealthInterval) {
        clearInterval(apiHealthInterval)
      }
      checkHealth()

      apiHealthInterval = setInterval(checkHealth, 30000)
    },
  },
}

export default apiHealthService
