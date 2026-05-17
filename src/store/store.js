import Vue from 'vue'
import Vuex from 'vuex'
import authentication from './authentication'
import dicomService from './dicomService'
import questionService from './questionService'
import patientPositionService from './patientPositionService'
import pointSelectService from './pointSelectService'
import selectionConfig from './selectionConfig'
import interactableService from './interactableService'
import stackService from './stackService'
import testRunService from './testRunService'
import bodyService from './bodyService'
import cohortService from './cohortService'
import statisticsService from './statisticsService'
import satBandService from './satBandService'
import resourceService from './resourceService'
import analysisService from './analysisService'
import injectorService from './injectorService'
import translatedContent from './translatedContent'
import threeJSSVGProvider from './threeJSSVGProvider'
import timingDecisionService from './timingDecisionService'
import physioService from './physioService'
import scanTimeConfig from './scanTimeConfig'
import b19AllValuesSelection from './b19AllValuesSelection'
import xaAllValuesSelection from './xaAllValuesSelection'
import apiHealthService from './apiHealthService'
import globalOptions from './globalOptions'
import animatedVolumeService from './animatedVolumeService'
import dataToParent from './dataToParent'
import interventionRules from './interventionRules'
import notificationService from './notificationService'
import user from './user'
import _ from 'lodash'
import * as Sentry from '@sentry/vue'
import { Vue as VueIntegration, RewriteFrames } from '@sentry/integrations'
import LogRocket from 'logrocket'
import LogrocketFuzzySanitizer from 'logrocket-fuzzy-search-sanitizer'
import config from '../config'

// LogRocket/Sentry
// Check if in production. This excludes local runs as well as deploy previews
if (config.env === 'production') {
  // LogRocket
  // Exclude any API attributes that should get stripped out of all network requests
  const { requestSanitizer, responseSanitizer } = LogrocketFuzzySanitizer.setup(['password'])
  LogRocket.init('b8rwsz/scanlab', {
    network: {
      requestSanitizer: (request) => {
        if (request.headers['Authorization']) {
          request.headers['Authorization'] = ''
        }

        return requestSanitizer(request)
      },
      responseSanitizer,
    },
  })

  // Sentry.io
  Sentry.init({
    Vue,
    dsn: 'https://855d33fcc5fa45a0bbc515e3eb54dfd8@o390253.ingest.sentry.io/5232262',
    environment: config.env,
    integrations: [new VueIntegration({ Vue, attachProps: true, logErrors: true }), new RewriteFrames()],

    // classify & enrich errors without dropping them
    beforeSend(event, hint) {
      const original = hint && (hint.originalException || hint.syntheticException)

      // ---- 1) Axios/network context enrichment ----
      if (original && original.isAxiosError) {
        const cfg = original.config || {}
        const meta = {
          url: cfg.url,
          method: cfg.method,
          baseURL: cfg.baseURL,
          httpStatus: original.response && original.response.status,
          timedOut: original.code === 'ECONNABORTED' || /timeout/i.test(original.message || ''),
          offlineLikely:
            original.meta && typeof original.meta.offlineLikely === 'boolean'
              ? original.meta.offlineLikely
              : typeof navigator !== 'undefined' && !navigator.onLine,
          backendUp: original.meta && original.meta.backendUp,
          serverNoReply: original.meta && original.meta.serverNoReply,
        }

        event.extra = { ...(event.extra || {}), axios: meta }
        event.tags = {
          ...(event.tags || {}),
          httpStatus: String(meta.httpStatus || 'none'),
          axiosTimeout: meta.timedOut ? 'yes' : 'no',
          serverNoReply: meta.serverNoReply ? 'yes' : 'no',
        }

        // Normalize a short-ish fingerprint so similar issues group together
        const pathOnly = String(meta.url || '').replace(String(meta.baseURL || ''), '')
        event.fingerprint = event.fingerprint || []
        event.fingerprint.push('axios', pathOnly || '[no-url]', String(meta.httpStatus || 'no-http'))

        // 1a) Health checks: keep, but lower severity & group
        const isHealth =
          /\/health(?:$|\?)/i.test(String(meta.url || '')) || /\/v1\/health(?:$|\?)/i.test(String(meta.url || ''))
        if (isHealth) {
          event.level = 'warning'
          event.fingerprint = [
            'health-check',
            String(meta.httpStatus || 'no-http'),
            meta.timedOut ? 'timeout' : 'other',
          ]
        }

        // 1b) 401/403 (expected auth failures): keep, mark as warning
        if (meta.httpStatus === 401 || meta.httpStatus === 403) {
          event.level = 'warning'
          event.tags.auth = 'failed'
          event.fingerprint = ['auth-failed', String(meta.httpStatus), pathOnly || '[no-url]']
        }

        // 1c) No HTTP response & offline-ish → info
        if (!meta.httpStatus && meta.offlineLikely) {
          event.level = 'info'
          event.fingerprint = ['offline-likely', meta.timedOut ? 'timeout' : 'other']
        }

        // 1d) No reply from server but network is up → keep as error, make it explicit
        if (!meta.httpStatus && meta.serverNoReply) {
          event.tags.serverNoReply = 'true'
          event.fingerprint = ['server-no-reply', pathOnly || '[no-url]']
        }
      }

      // ---- 2) Non-Error promise rejections (value: undefined, etc.) ----
      const nonErrorMsg = String(event.message || '')
      if (/Non-Error promise rejection/i.test(nonErrorMsg)) {
        event.level = event.level || 'warning'
        event.fingerprint = ['non-error-promise-rejection']
        event.extra = { ...(event.extra || {}), nonErrorRejectionValue: original }
      }

      // ---- 3) Light scrubbing of tokens in URLs ----
      if (event.request && event.request.url) {
        event.request.url = event.request.url.replace(/([?&](?:token|access_token)=)[^&]+/gi, '$1[redacted]')
      }

      return event
    },
  })

  // Every crash report will have a LogRocket session URL
  LogRocket.getSessionURL((sessionURL) => {
    Sentry.configureScope((scope) => {
      scope.setExtra('sessionURL', sessionURL)
    })
  })
}

Vue.use(Vuex)

let modules = {
  authentication,
  dicomService,
  questionService,
  selectionConfig,
  interactableService,
  stackService,
  bodyService,
  cohortService,
  pointSelectService,
  statisticsService,
  analysisService,
  translatedContent,
  user,
  scanTimeConfig,
  b19AllValuesSelection,
  xaAllValuesSelection,
  dataToParent,
  testRunService,
  threeJSSVGProvider,
  patientPositionService,
  satBandService,
  resourceService,
  injectorService,
  globalOptions,
  timingDecisionService,
  physioService,
  apiHealthService,
  animatedVolumeService,
  interventionRules,
  notificationService,
}

let store = new Vuex.Store({
  modules,
  // state: {},
  // mutations: {},
  state: {
    isSidebarExpanded: false,
  },
  mutations: {
    TOGGLE_SIDEBAR(state) {
      state.isSidebarExpanded = !state.isSidebarExpanded
    },
    SET_SIDEBAR(state, value) {
      state.isSidebarExpanded = value
    },
  },
  getters: {
    isSidebarExpanded: (state) => state.isSidebarExpanded,
  },
  actions: {
    // called from main.js
    // onCreated({}){ // after Vue is created
    onInit() {
      // before Vue is created
      _.each(modules, function (module, moduleName) {
        // Restore state from localStorage for each module, configured by: saveState: [keys...]
        // load the various states from localstorage
        if (module.saveState) {
          let state = JSON.parse(localStorage.getItem(moduleName))
          store.commit(`${moduleName}/set`, _.pick(state, module.saveState))
        }
      })
    },
  },
})

// Add in a way to define watchStates/watchGetters on stores
_.each(modules, function (module, moduleName) {
  _.each(module.watchStates, function (actionName, getterName) {
    store.watch(
      function () {
        return store.state[moduleName][getterName]
      },
      function (currentVal, previousVal) {
        store.dispatch(`${moduleName}/${actionName}`, { currentVal, previousVal })
      }
    )
  })
  _.each(module.watchGetters, function (actionName, getterName) {
    store.watch(
      function () {
        return store.getters[`${moduleName}/${getterName}`]
      },
      function (currentVal, previousVal) {
        store.dispatch(`${moduleName}/${actionName}`, { currentVal, previousVal })
      }
    )
  })
})

// dispatch action to module only if it's defined there
function dispatchMaybe(moduleName, actionName, params) {
  if (modules[moduleName].actions[actionName]) {
    return store.dispatch(`${moduleName}/${actionName}`, params)
  }
}

// For Exporting/Importing state
const StateManager = {
  // pass in extra meta to extend the meta data with that
  stateExport(extraMeta = {}) {
    let outByModule = {}
    _.each(modules, function (module, moduleName) {
      if (module.exportState) {
        let outCurModule = {}
        _.each(module.exportState, function (stateKey) {
          let value = store.state[moduleName][stateKey]
          let serializer = _.get(modules[moduleName].serializers, stateKey)
          if (serializer) {
            value = serializer.get(value)
          }
          outCurModule[stateKey] = value
        })
        outByModule[moduleName] = outCurModule
      }
    })
    // Add some meta (nothing smart happens with this, it's just so we have that info handy)
    outByModule.meta = Object.assign({}, extraMeta, {
      userId: store.state.authentication.userId,
      testRunId: _.get(store.state.testRunService.test, 'id'),
      dicomFileSetId: _.get(store.state.dicomService.dicomFileSet, 'id'),
    })
    return outByModule
  },

  stateImport(stateByModule) {
    _.each(stateByModule, function (stateOfModule, moduleName) {
      if (moduleName !== 'meta') {
        dispatchMaybe(moduleName, 'stateImportBefore')

        let stateDeserialized = _.mapValues(stateOfModule, function (stateValue, stateKey) {
          let value = stateValue
          let serializer = _.get(modules[moduleName].serializers, stateKey)
          if (serializer) {
            value = serializer.set(value)
          }
          return value
        })

        store.commit(`${moduleName}/set`, stateDeserialized)
        dispatchMaybe(moduleName, 'stateImportAfter')
      }
    })
  },
  store,
}
// For debugging
window.StateManager = StateManager

const globalInstanceVariable = {
  requestAnimationId: null,
}

export { store, StateManager, globalInstanceVariable }
