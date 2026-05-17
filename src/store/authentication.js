import log from 'loglevel'
import _ from 'lodash'
import { apiPost } from '../util/api'
import saveState from '../lib/saveState'
import Vue from 'vue'
import jwtDecode from 'jwt-decode'
import router from '@/router'
import LogRocket from 'logrocket'
import config from '../config'
const { isVetMR, isCTLab } = config

const LOCAL_STATE_PREFIX = 'authentication'
const LOCAL_STATE_TO_SAVE = ['userId', 'accessToken']

const authentication = {
  namespaced: true,
  saveState: LOCAL_STATE_TO_SAVE,
  state: {
    userId: null,
    accessToken: null,
    forceLogout: false,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
      saveState(LOCAL_STATE_PREFIX, LOCAL_STATE_TO_SAVE, state)
    },
    setForceLogout(state, payload) {
      state.forceLogout = payload
    },
    setAccessToken(state, token) {
      state.accessToken = token
      saveState(LOCAL_STATE_PREFIX, LOCAL_STATE_TO_SAVE, state)
    },
    setUserId(state, payload) {
      state.userId = payload
      saveState(LOCAL_STATE_PREFIX, LOCAL_STATE_TO_SAVE, state)
    },
  },
  watchStates: {
    userId: 'fetchUser',
  },
  actions: {
    setAccessToken({ commit }, payload) {
      commit('set', { accessToken: payload })
    },
    setUserId({ commit }, payload) {
      commit('set', { userId: payload })
    },
    setRedirectAfterLogin({ commit }, { redirectAfterLogin }) {
      commit('set', {
        redirectAfterLogin: _.pick(redirectAfterLogin, ['path', 'query']),
      })
    },

    async register(context, { email, legalName, nickName, password, registrationCode }) {
      const newEmail = email.toLowerCase().trim()
      let response = await apiPost('user/create', { email: newEmail, password, nickName, legalName, registrationCode })
      if (response.data.success) {
        Vue.notify({
          text: `Created ${newEmail}`,
        })
        router.push({ path: '/login' })

        LogRocket.track('Registered')
      } else {
        Vue.notify({
          text: response.data.error_description || `Error registering ${newEmail}`,
          type: 'error',
        })
      }
    },

    // Maybe use https://github.com/dgrubelic/vue-authenticate ?
    async login({ state, commit }, { email, password }) {
      const formattedEmail = email ? email.toLowerCase().trim() : null

      try {
        let response = await apiPost('login', { email: formattedEmail, password })
        let access_token = response.data.access_token
        let decoded = jwtDecode(access_token)
        let userId = _.get(decoded, 'user.id')
        log.debug({ decoded })
        commit('set', { userId, accessToken: access_token })
        Vue.notify({
          text: 'Logged in',
        })
        if (state.redirectAfterLogin) {
          router.replace(state.redirectAfterLogin)
          commit('set', { redirectAfterLogin: null })
        } else {
          router.replace({ path: '/' })
        }
      } catch (e) {
        commit('set', { userId: null, accessToken: null })
        log.debug('ERROR logging in', e)
        Vue.notify({
          // title: 'Important message!',
          type: 'error',
          text: _.get(e, 'response.data.error_description') || 'Login failed',
        })
      }
    },

    fetchUser({ dispatch }) {
      dispatch('user/fetchUser', {}, { root: true })
    },

    async logout({ commit }) {
      commit('set', { forceLogout: true })
      router.push({ path: '/login' })
    },

    async resetPassword({ state }, { token, password }) {
      const result = await apiPost(`recievePasswordReset/${token}`, { password }, state.accessToken)

      if (result.data.success) {
        Vue.notify({
          text: `Successfully reset password`,
        })

        router.push({ path: '/login' })
      } else {
        Vue.notify({
          type: 'error',
          text: `Unable to reset password`,
        })
      }
    },

    async sendPasswordReset({ state }, { email }) {
      const result = await apiPost(`sendPasswordReset`, { email, isCTLab }, state.accessToken)

      if (result.data.success) {
        Vue.notify({
          text: `Password reset sent to ${email}`,
        })
        return true
      } else {
        Vue.notify({
          type: 'error',
          text: `Unable to send password reset email to ${email}`,
        })
        return false
      }
    },
  },
  getters: {
    isLoggedIn(state) {
      return !!state.userId
    },
    userId(state) {
      return state.userId
    },
    appName() {
      return isVetMR ? 'ScanLabVet' : isCTLab ? 'ScanLabCT' : 'ScanLab'
    },
  },
}

export default authentication
