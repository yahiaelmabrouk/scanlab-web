import log from 'loglevel'
import _ from 'lodash'
import { apiGet, apiPut } from '../util/api'
import i18n from '../i18n'

const loadedLocales = import.meta.globEager('../locales/*.json')

const translatedContent = {
  namespaced: true,
  state: {
    translatedContent: {},
    translatedContentRecords: {},
    activeRequests: {},
    languagesTranslations: [],
    localTranslateContent: {},
    languageOptions: [],
  },
  mutations: {
    set(state, stuff) {
      let shouldMutated = false

      // Check if key and value has been changed
      for (const each of Object.keys(stuff)) {
        if (!_.isEqual(state[each], stuff[each])) {
          shouldMutated = true
          break
        }
      }

      if (shouldMutated) {
        _.extend(state, stuff)
      }
    },
    updateContent(state, payload) {
      state.translatedContent = {
        ...state.translatedContent,
        [payload.key]: payload.content,
      }
      if (payload.record) {
        state.translatedContentRecords = {
          ...state.translatedContentRecords,
          [payload.key]: payload.record,
        }
      }
    },
    addRequest(state, payload) {
      state.activeRequests = {
        ...state.activeRequests,
        [payload.key]: true,
      }
    },
    removeRequest(state, payload) {
      state.activeRequests = _.omit(state.activeRequests, [payload.key])
    },
  },
  actions: {
    updateLanguageOptions({ rootGetters, commit, state }) {
      const defaultLanguageCode = rootGetters['user/defaultLanguageCode']
      let currentLanguageOptions = _.cloneDeep(state.languageOptions)
      currentLanguageOptions = _.orderBy(currentLanguageOptions, ['name'], ['asc'])
      const defaultLanguage = _.find(currentLanguageOptions, { code: defaultLanguageCode })
      if (defaultLanguage) {
        currentLanguageOptions = _.remove(currentLanguageOptions, (lang) => lang.code !== defaultLanguageCode)
        currentLanguageOptions.unshift(defaultLanguage)
      }
      commit('set', {
        languageOptions: currentLanguageOptions,
      })
    },
    updateFlagOfLanguageOptions({ commit, state }, { id, flag }) {
      commit('set', {
        languageOptions: _.map(state.languageOptions, (lang) => {
          if (lang.id === id) {
            lang.flag = flag
          }
          return lang
        }),
      })
    },
    loadLocalTranslateContent({ commit }) {
      const messages = {}
      Object.entries(loadedLocales).forEach(([key, value]) => {
        messages[key.slice(11).slice(0, -5)] = value
      })

      commit('set', {
        localTranslateContent: messages,
      })
    },
    async getAllLanguageOptions({ commit, rootGetters }) {
      const rs = await apiGet('/languages/options')
      const defaultLanguageCode = rootGetters['user/defaultLanguageCode']
      let languages = rs.data.data
      languages = _.orderBy(languages, ['name'], ['asc'])
      const defaultLanguage = _.find(languages, { code: defaultLanguageCode })
      if (defaultLanguage) {
        languages = _.remove(languages, (lang) => lang.code !== defaultLanguageCode)
        languages.unshift(defaultLanguage)
      }
      commit('set', { languageOptions: languages })
    },
    async getAllLanguages({ commit, rootState, state }) {
      const rs = await apiGet('/languages/all')
      const languages = rs.data.data
      const messages = {}
      commit('set', {
        languagesTranslations: languages.map((language) => {
          return {
            ...language,
            content: language.content,
          }
        }),
      })

      Object.entries(loadedLocales).forEach(([key, value]) => {
        messages[key.slice(11).slice(0, -5)] = value
        delete messages.default
      })
      const getAllKeys = (obj, parent) => {
        return Object.keys(obj).reduce((acc, key) => {
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            return acc.concat(getAllKeys(obj[key], `${parent ? `${parent}.` : ''}${key}`))
          }
          return acc.concat(`${parent ? `${parent}.` : ''}${key}`)
        }, [])
      }
      const englishLanguage = _.find(languages, { code: 'en' })
      if (englishLanguage) {
        const localKeys = getAllKeys(_.omit(_.get(messages, ['en'], {}), ['default']), null)
        const dbKeys = getAllKeys(englishLanguage.content, null)
        const newContent = _.cloneDeep(englishLanguage.content)
        const newKeys = localKeys.filter((key) => !dbKeys.includes(key))
        if (newKeys.length > 0) {
          newKeys.forEach((key) => {
            _.set(newContent, key, _.get(messages, ['en', ...key.split('.')], ''))
          })

          apiPut(
            `/languages/${englishLanguage.id}`,
            {},
            { content: newContent },
            rootState.authentication.accessToken
          ).then((rs) => {
            if (rs.data && rs.data.data) {
              commit('set', {
                languagesTranslations: state.languagesTranslations.map((lang) => {
                  if (lang.id === englishLanguage.id) {
                    return {
                      ...lang,
                      content: newContent,
                    }
                  }
                  return lang
                }),
              })
            }
          })
        }
      }
    },
    async updateI18nMessages({ state, rootGetters, commit }, { lang }) {
      const rs = await apiGet(`/languages?code=${lang ? lang : rootGetters['user/languageCode']}`)
      const language = rs.data.data
      i18n.setLocaleMessage(
        language.code,
        _.merge({}, _.get(state.localTranslateContent, [language.code], {}), language.content)
      )
      i18n.locale = language.code
      if (state.languagesTranslations.find((lang) => lang.code === language.code)) {
        commit('set', {
          languagesTranslations: state.languagesTranslations.map((lang) => {
            if (lang.code === language.code) {
              return language
            }
            return lang
          }),
        })
      } else {
        commit('set', {
          languagesTranslations: [...state.languagesTranslations, language],
        })
      }
    },
    async translateThisRecord({ state, commit, rootState }, { type, record, lang }) {
      if (!record || !record.id) {
        log.warn('translateThisRecord called with invalid record:', record)
        return
      }
      let key = `${type}|${record.id}|${lang}`

      if (state.translatedContent[key]) {
        // We already have that content in the store. Nothing to do.
      } else if (state.activeRequests[key]) {
        // We are already requesting that record! Nothing to do but wait.
      } else if (lang === 'en') {
        commit('updateContent', { key, content: record })
      } else {
        commit('addRequest', { key })
        try {
          let response = await apiGet(`translatedContent/${key}`, rootState.authentication.accessToken)

          if (response.data && response.data.success) {
            commit('updateContent', {
              key,
              record: response.data.record,
              content: response.data.record.content,
            })
          } else {
            // TODO: reflect loading errors in the state
            log.debug(`Failed to translate content: ${key}`)
          }
        } finally {
          commit('removeRequest', { key })
        }
      }
    },
  },
}

export default translatedContent
