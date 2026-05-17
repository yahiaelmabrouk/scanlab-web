import _ from 'lodash'
import { apiGet, apiPost } from '../util/api'
import saveState from '../lib/saveState'
import i18n from '../i18n'
import Vue from 'vue'
import LogRocket from 'logrocket'
import * as Sentry from '@sentry/vue'
import { INJECT_CONDITION, INJECTION_MODE, INJECTOR_PROTOCOLS, SLICE_EXPANSION_BEHAVIOR } from '../constants'

// isAdmin is persisted so we can route to admin-only pages immediately without waiting for an API call
//  backend gates admin-only features regardless
const LOCAL_STATE_PREFIX = 'user'
const LOCAL_STATE_TO_SAVE = ['nickName', 'isAdmin', 'isManager', 'codeExpiresDate']

const user = {
  namespaced: true,
  saveState: LOCAL_STATE_TO_SAVE,
  state: {
    nickName: null,
    legalName: null,
    email: null,
    isAdmin: null,
    isManager: null,
    softwareVendorPreference: null,
    softwareVersionPreference: null,
    sliceFrameRate: null,
    scientificMode: false,
    immersiveSound: true,
    vendorStylePreference: null, // siemens / ge
    defaultLanguageCode: 'en',
    fieldStrengthPreference: null,
    injectionMode: INJECTION_MODE.CONTRAST_AND_SALINE,
    injectCondition: INJECT_CONDITION.SET_VOLUME, // This is Contrast Dose Calculation Method
    sliceExpansionBehavior: SLICE_EXPANSION_BEHAVIOR.SINGLE_DIRECTION,
    defaultContrastOnlyProtocol: INJECTOR_PROTOCOLS.BOLUS,
    defaultContrastAndSalineProtocol: INJECTOR_PROTOCOLS.TEST_AND_BOLUS,
    activationDate: null,
    numOfDaysActive: null,
    showExpirationReminder: true,
    allowDebug: false, // to show Debug Buttons
    language: null, // en, es, de (and so on, matches src/locales)
    codeExpiresDate: null,
    roles: [], // ['translator', ...etc]
  },
  watchGetters: {
    languageCode: 'updateI18nMessages',
    defaultLanguageCode: 'updateLanguageOptions',
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
      saveState(LOCAL_STATE_PREFIX, LOCAL_STATE_TO_SAVE, state)
    },
    setEmail(state, payload) {
      state.email = payload
    },
    setIsAdmin(state, payload) {
      state.isAdmin = payload
    },
  },
  actions: {
    updateLanguageOptions({ dispatch }) {
      dispatch('translatedContent/updateLanguageOptions', {}, { root: true })
    },
    updateI18nMessages({ dispatch }) {
      dispatch('translatedContent/updateI18nMessages', {}, { root: true })
    },
    // Called after login / user retrieval
    async fetchUser({ commit, getters, dispatch, rootState }) {
      let userId = rootState.authentication.userId

      if (!userId) {
        return
      }
      try {
        let response = await apiGet(`users/${userId}`, rootState.authentication.accessToken)
        let user = response.data
        if (user.registrationExpired) {
          dispatch('authentication/logout', {}, { root: true })
          setTimeout(() => {
            Vue.notify({
              type: 'error',
              text: 'Registration Expired. Please renew your ScanLabMR to access our premium features again',
            })
          }, 1000)
        }
        if (user.status === 'disabled') {
          dispatch('authentication/logout', {}, { root: true })
          setTimeout(() => {
            Vue.notify({
              type: 'error',
              text: 'Your account has been disabled. Please renew your account.',
            })
          }, 1000)
        }
        commit('set', {
          nickName: user.nickName,
          email: user.email,
          legalName: user.legalName,
          isAdmin: user.isAdmin,
          isManager: user.isManager,
          softwareVendorPreference: user.softwareVendorPreference,
          softwareVersionPreference: user.softwareVersionPreference,
          sliceFrameRate: user.sliceFrameRate,
          scientificMode: _.get(user, ['scientificMode'], null),
          immersiveSound: _.get(user, ['settings', 'immersiveSound']) ?? true,
          vendorStylePreference: user.vendorStylePreference,
          defaultLanguageCode: user.defaultLanguageCode,
          fieldStrengthPreference: user.fieldStrengthPreference,
          language: user.language,
          codeExpiresDate: user.codeExpiresDate,
          activationDate: user.activationDate,
          numOfDaysActive: user.numOfDaysActive,
          roles: user.roles,
          injectionMode: _.get(user, ['injectionMode'], INJECTION_MODE.CONTRAST_AND_SALINE),
          injectCondition: _.get(user, ['injectCondition'], INJECT_CONDITION.SET_VOLUME),
          sliceExpansionBehavior: _.get(user, ['sliceExpansionBehavior'], SLICE_EXPANSION_BEHAVIOR.SINGLE_DIRECTION),
          defaultContrastOnlyProtocol: _.get(user, ['defaultContrastOnlyProtocol'], INJECTOR_PROTOCOLS.BOLUS),
          defaultContrastAndSalineProtocol: _.get(
            user,
            ['defaultContrastAndSalineProtocol'],
            INJECTOR_PROTOCOLS.TEST_AND_BOLUS
          ),
        })
        i18n.locale = getters.languageCode

        Sentry.setUser({ id: user.id, username: user.legalName, email: user.email })

        // Be able to associate this user with any errors that come up to help fix their issue
        LogRocket.identify(userId, {
          name: user.legalName,
          email: user.email,

          // Add your own custom user variables here, ie:
          isAdmin: user.isAdmin,
        })
        dispatch('saveExpirationReminderState', { showExpirationReminder: true })
      } catch (e) {
        dispatch('authentication/logout', {}, { root: true })
        Vue.notify({ type: 'error', text: 'Failed to retrieve user info' })
      }
    },
    async saveUser({ commit, rootState }, { nickName, email, legalName }) {
      try {
        let userId = rootState.authentication.userId

        await apiPost(
          `users/${userId}`,
          {
            nickName,
            email,
            legalName,
          },
          rootState.authentication.accessToken
        )

        commit('set', {
          nickName: nickName,
          email: email,
          legalName: legalName,
        })

        Vue.notify({ type: 'success', text: 'User information saved' })
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Failed to save user information' })
      }
    },
    async saveNewPassword({ rootState }, { currentPassword, newPassword }) {
      try {
        let userId = rootState.authentication.userId

        let result = await apiPost(
          `users/${userId}/password`,
          { currentPassword, newPassword },
          rootState.authentication.accessToken
        )

        if (result.data.success) {
          Vue.notify({ type: 'success', text: 'Password saved' })
        } else {
          Vue.notify({ type: 'error', text: 'Failed to save password' })
        }
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Failed to save password' })
      }
    },
    async saveVendorStylePreference({ commit, rootState }, { vendorStylePreference }) {
      try {
        await apiPost(
          'userPreferences',
          {
            vendorStylePreference,
          },
          rootState.authentication.accessToken
        )

        commit('set', {
          vendorStylePreference,
        })

        Vue.notify({ type: 'success', text: 'Saved user preferences' })
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Failed to save user preferences' })
      }
    },
    async saveDefaultLanguageCode({ commit, rootState }, { defaultLanguageCode }) {
      try {
        await apiPost(
          'userDefaultLanguageCode',
          {
            defaultLanguageCode,
          },
          rootState.authentication.accessToken
        )

        commit('set', {
          defaultLanguageCode,
        })

        Vue.notify({ type: 'success', text: 'Saved user default language' })
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Failed to save user default language' })
      }
    },
    async saveUserPreferences(
      { commit, rootState },
      {
        vendorStylePreference,
        fieldStrengthPreference,
        softwareVendorPreference,
        softwareVersionPreference,
        sliceFrameRate,
        scientificMode,
        immersiveSound,
        isConfig,
      }
    ) {
      try {
        const payload = isConfig
          ? { sliceFrameRate, scientificMode, immersiveSound }
          : { vendorStylePreference, fieldStrengthPreference, softwareVendorPreference, softwareVersionPreference }

        await apiPost('userPreferences', payload, rootState.authentication.accessToken)
        commit('set', payload)

        if (isConfig) {
          Vue.notify({ type: 'success', text: 'Saved software configurations' })
        } else {
          Vue.notify({ type: 'success', text: 'Saved user preferences' })
        }
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Failed to save user preferences' })
      }
    },
    async saveInjectionMode(
      { commit, rootState },
      { injectionMode, defaultContrastOnlyProtocol, defaultContrastAndSalineProtocol }
    ) {
      try {
        await apiPost(
          'userInjectionMode',
          {
            injectionMode,
            defaultContrastOnlyProtocol,
            defaultContrastAndSalineProtocol,
          },
          rootState.authentication.accessToken
        )

        commit('set', {
          injectionMode,
          defaultContrastOnlyProtocol,
          defaultContrastAndSalineProtocol,
        })

        Vue.notify({ type: 'success', text: 'Saved user injection mode' })
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Failed to save user injection mode' })
      }
    },
    // This is the Contrast Dose Calculation Method
    async saveInjectCondition({ commit, rootState }, { injectCondition }) {
      try {
        await apiPost(
          'userInjectCondition',
          {
            injectCondition,
          },
          rootState.authentication.accessToken
        )

        commit('set', {
          injectCondition,
        })

        Vue.notify({ type: 'success', text: 'Saved user inject condition' })
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Failed to save user inject condition' })
      }
    },
    async saveSliceExpansionBehavior({ commit, rootState }, { sliceExpansionBehavior }) {
      try {
        await apiPost(
          'userSliceExpansionBehavior',
          {
            sliceExpansionBehavior,
          },
          rootState.authentication.accessToken
        )

        commit('set', {
          sliceExpansionBehavior,
        })

        Vue.notify({ type: 'success', text: 'Saved user slice expansion behavior' })
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Failed to save user slice expansion behavior' })
      }
    },
    async saveLanguage({ commit, getters, rootState }, { language }) {
      try {
        // update the locale immediately, before doing async things
        // that way the user gets immediate feedback to their change
        commit('set', {
          language: language.code,
        })
        i18n.locale = getters.languageCode

        let userId = rootState.authentication.userId
        if (!userId) {
          return
        }

        let response = await apiPost(
          `users/${userId}`,
          {
            language: language.code,
          },
          rootState.authentication.accessToken
        )

        if (!response.data.success) {
          throw new Error('error saving user')
        }

        LogRocket.track('LanguageChanged')

        Vue.notify({ type: 'success', text: 'Language updated!' })
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Failed to update language' })
      }
    },
    saveExpirationReminderState({ commit }, { showExpirationReminder }) {
      commit('set', {
        showExpirationReminder: showExpirationReminder,
      })
    },
  },
  getters: {
    softwareVendorPreference(state) {
      return state.softwareVendorPreference
    },
    softwareVersionPreference(state) {
      return state.softwareVersionPreference
    },
    sliceFrameRate(state) {
      return state.sliceFrameRate
    },
    scientificMode(state) {
      return state.scientificMode
    },
    immersiveSound(state) {
      return state.immersiveSound ?? true
    },
    vendorStylePreference(state) {
      return state.vendorStylePreference || 'siemens'
    },
    defaultLanguageCode(state) {
      return state.defaultLanguageCode || 'en'
    },
    fieldStrengthPreference(state) {
      return state.fieldStrengthPreference || '3.0'
    },
    injectionMode(state) {
      return state.injectionMode || INJECTION_MODE.CONTRAST_AND_SALINE
    },
    injectCondition(state) {
      return state.injectCondition || INJECT_CONDITION.SET_VOLUME
    },
    sliceExpansionBehavior(state) {
      return state.sliceExpansionBehavior || SLICE_EXPANSION_BEHAVIOR.SINGLE_DIRECTION
    },
    defaultContrastOnlyProtocol(state) {
      return state.defaultContrastOnlyProtocol || INJECTOR_PROTOCOLS.BOLUS
    },
    defaultContrastAndSalineProtocol(state) {
      return state.defaultContrastAndSalineProtocol || INJECTOR_PROTOCOLS.TEST_AND_BOLUS
    },
    vendorStylePreferenceOptions() {
      // Each vendor style has a windowingDirection that translates to either "Left" or "Right" (1 or -1, not sure which is which)
      // GE is -1, Siemens is 1, Philips is 1,... everyone else is 1
      // GE behaves one way, everyone else is just like Siemens, apparently
      // windowingDirection just controls if the X / Y of mouse movement is inversed when using the Windowing Tool
      return [
        {
          text: 'Canon',
          value: 'canon',
          windowingDirection: 1,
        },
        {
          text: 'GE',
          value: 'ge',
          windowingDirection: -1,
        },
        {
          text: 'Hitachi',
          value: 'hitachi',
          windowingDirection: 1,
        },
        {
          text: 'Philips',
          value: 'philips',
          windowingDirection: 1,
        },
        {
          text: 'Siemens',
          value: 'siemens',
          windowingDirection: 1,
        },
        {
          text: 'United',
          value: 'united',
          windowingDirection: 1,
        },
      ]
    },
    fieldStrengthPreferenceOptions() {
      return [
        {
          text: '1.5 T',
          value: '1.5',
        },
        {
          text: '3.0 T',
          value: '3.0',
        },
      ]
    },
    pickedVendorStylePreferenceOption(state, getters) {
      return _.find(getters.vendorStylePreferenceOptions, { value: getters.vendorStylePreference })
    },
    windowingDirection(state, getters) {
      return _.get(getters.pickedVendorStylePreferenceOption, 'windowingDirection') || 1
    },
    languageCode(state) {
      // If the user doesn't have a language set yet, we'll default to english
      return state.language || 'en'
    },
    isTranslator(state) {
      return state.roles.includes('translator')
    },
    daysUntilExpiration(state) {
      if (!state.activationDate || !state.numOfDaysActive) return

      let activationDate = new Date(state.activationDate)
      let numOfDaysActive = state.numOfDaysActive
      let currentDate = new Date()

      let timeDiff = Math.abs(currentDate.getTime() - activationDate.getTime())
      let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
      return numOfDaysActive - diffDays
    },
    isAdmin(state) {
      return state.isAdmin
    },
  },
}

export default user
