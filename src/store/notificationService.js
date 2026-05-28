import _ from 'lodash'
import { apiGet, apiPatch, apiPost, apiPut } from '../util/api'

const notificationService = {
  namespaced: true,
  state: {
    unreadCount: 0,
    notifications: [],
    total: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    preferences: [],
    preferencesLoading: false,
    phoneStatus: { phoneNumber: null, countryCode: null },
    _pollIntervalId: null,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
    setUnreadCount(state, count) {
      state.unreadCount = count
    },
    setNotifications(state, { notifications, total, page, pages }) {
      state.notifications = notifications
      state.total = total
      state.currentPage = page
      state.totalPages = pages
    },
    appendNotifications(state, { notifications, total, page, pages }) {
      state.notifications = [...state.notifications, ...notifications]
      state.total = total
      state.currentPage = page
      state.totalPages = pages
    },
    markOneRead(state, id) {
      const item = state.notifications.find((n) => n.id === id)
      if (item && !item.isRead) {
        item.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllRead(state) {
      state.notifications.forEach((n) => {
        n.isRead = true
      })
      state.unreadCount = 0
    },
    setPreferences(state, preferences) {
      state.preferences = preferences
    },
    setPhoneStatus(state, phone) {
      state.phoneStatus = phone
    },
    storePollId(state, id) {
      state._pollIntervalId = id
    },
    clearPollId(state) {
      state._pollIntervalId = null
    },
  },
  actions: {
    async fetchUnreadCount({ commit, rootState }) {
      try {
        const token = rootState.authentication.accessToken
        if (!token) return
        const res = await apiGet('notifications/unread-count', token)
        commit('setUnreadCount', res.data.count ?? 0)
      } catch {
        // silently fail — this is a background poll
      }
    },

    async fetchNotifications({ commit, rootState }, { page = 1, limit = 20 } = {}) {
      const token = rootState.authentication.accessToken
      if (!token) return
      commit('set', { loading: true })
      try {
        const res = await apiGet('notifications', token, { page, limit })
        const { notifications, total, pages } = res.data
        if (page === 1) {
          commit('setNotifications', { notifications, total, page, pages })
        } else {
          commit('appendNotifications', { notifications, total, page, pages })
        }
      } finally {
        commit('set', { loading: false })
      }
    },

    async markAsRead({ commit, rootState }, id) {
      const token = rootState.authentication.accessToken
      if (!token) return
      try {
        await apiPatch(`notifications/${id}/read`, {}, token)
        commit('markOneRead', id)
      } catch {
        // ignore
      }
    },

    async markAllAsRead({ commit, rootState }) {
      const token = rootState.authentication.accessToken
      if (!token) return
      try {
        await apiPatch('notifications/read-all', {}, token)
        commit('markAllRead')
      } catch {
        // ignore
      }
    },

    async fetchPreferences({ commit, rootState }) {
      const token = rootState.authentication.accessToken
      if (!token) return
      commit('set', { preferencesLoading: true })
      try {
        const res = await apiGet('notification-preferences', token)
        commit('setPreferences', res.data.preferences ?? [])
      } finally {
        commit('set', { preferencesLoading: false })
      }
    },

    async savePreferences({ commit, rootState }, { preferences }) {
      const token = rootState.authentication.accessToken
      if (!token) return
      const res = await apiPut('notification-preferences', {}, { preferences }, token)
      commit('setPreferences', res.data.preferences ?? [])
    },

    async fetchPhoneStatus({ commit, rootState }) {
      const token = rootState.authentication.accessToken
      if (!token) return
      const res = await apiGet('phone/status', token)
      commit('setPhoneStatus', res.data.phone)
    },

    async setPhoneNumber({ commit, rootState }, { phoneNumber, countryCode }) {
      const token = rootState.authentication.accessToken
      if (!token) return
      const res = await apiPost('phone/set', { phoneNumber, countryCode }, token)
      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to save phone number')
      }
      commit('setPhoneStatus', { phoneNumber, countryCode })
    },

    async announceNewFeature({ rootState }, { featureName }) {
      const token = rootState.authentication.accessToken
      if (!token) return
      const res = await apiPost('announcements/new-feature', { featureName }, token)
      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to send announcement')
      }
    },

    async announceKnownBug({ rootState }, { bugDescription }) {
      const token = rootState.authentication.accessToken
      if (!token) return
      const res = await apiPost('announcements/known-bug', { bugDescription }, token)
      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to send announcement')
      }
    },

    async fetchAccountExpirySetting({ rootState }) {
      const token = rootState.authentication.accessToken
      if (!token) return null
      const res = await apiGet('announcements/account-expiry-setting', token)
      return res.data.days
    },

    async saveAccountExpirySetting({ rootState }, { days }) {
      const token = rootState.authentication.accessToken
      if (!token) return
      const res = await apiPut('announcements/account-expiry-setting', {}, { days }, token)
      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to save setting')
      }
      return res.data.days
    },

    startPolling({ dispatch, state, commit }) {
      if (state._pollIntervalId) return
      dispatch('fetchUnreadCount')
      const id = setInterval(() => {
        dispatch('fetchUnreadCount')
      }, 30000)
      commit('storePollId', id)
    },

    stopPolling({ state, commit }) {
      if (state._pollIntervalId) {
        clearInterval(state._pollIntervalId)
        commit('clearPollId')
      }
    },
  },
  getters: {
    hasUnread: (state) => state.unreadCount > 0,
    canLoadMore: (state) => state.currentPage < state.totalPages,
  },
}

export default notificationService
