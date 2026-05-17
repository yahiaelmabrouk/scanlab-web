import { apiPost } from '../util/api'
import { sleep } from '../lib/misc-util'
import { getErrorMessage } from '../lib/error-util'
import _ from 'lodash'
import TimeMe from 'timeme.js'
import Vue from 'vue'
import config from '../config'
import EventBus from '@/lib/event-bus'

const testRunService = {
  namespaced: true,
  state: {
    test: null,
    preferredAnswerCriteriaByStackQuestionId: {},
    preferredTimingMethod: null,
    isRetryingAnswerSubmission: false, // blocks UI while retrying an answer submission
    isLoadingStartTest: false,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  actions: {
    async startTest({ commit, rootState, state }, { bodyPartId, preparedExam, skillTest }) {
      if (state.isLoadingStartTest) return

      // Last resort prevent starting another test if there was already a Dicom loaded (so we don't accidentally try loading too many when this seems to cause some users memory issues)
      // To avoid actually doing this when the user clicks to start a test, we do this check/refresh automatically on the Home / Region Select screen
      if (rootState.dicomService.hasLoadedPreviously && !skillTest) {
        location.reload()
        return
      }

      commit('set', {
        isLoadingStartTest: true,
      })
      try {
        let response = await apiPost(
          `tests/start`,
          { bodyPartId, preparedExam, isCTLab: config.isCTLab },
          rootState.authentication.accessToken
        )
        commit('set', {
          test: response.data.testRun,
          preferredAnswerCriteriaByStackQuestionId: response.data.preferredAnswerCriteriaByStackQuestionId || {},
          preferredTimingMethod: response.data.preferredTimingMethod || null,
        })

        commit('questionService/set', { patientPhysioInfo: response.data.patientPhysio || null }, { root: true })

        TimeMe.startTimer(`testRun-${response.data.testRun.id}`)

        return response.data.testRun
      } catch (e) {
        commit('set', { isLoadingStartTest: false })
        throw e
      }
    },
    setIsLoadingStartTest({ commit }, payload) {
      commit('set', {
        isLoadingStartTest: payload,
      })
    },
    async addAnswer({ getters, rootState }, { answer, retryUntilSuccess = true }) {
      if (getters.currentTest) {
        let triedAtLeastOnce = false
        let succeeded = false
        let amountToWaitBeforeRetry = 3000

        // try once; unless retryUntilSuccess, then keep trying forever
        while (!succeeded && (!triedAtLeastOnce || retryUntilSuccess)) {
          try {
            await apiPost(`tests/${getters.currentTest.id}/addAnswer`, { answer }, rootState.authentication.accessToken)
            succeeded = true
            if (triedAtLeastOnce) {
              EventBus.$emit('HIDE_LOADING')
              Vue.notify({ type: 'success', text: 'Successfully submitted answer' })
            }
          } catch (e) {
            const errorMessage = getErrorMessage(e, '', '')
            Vue.notify({ type: 'error', text: errorMessage })
            if (retryUntilSuccess) {
              const meta = e?.meta || {}
              const reason = meta.offlineLikely
                ? 'You are offline'
                : meta.serverNoReply
                ? 'Server unreachable'
                : meta.timedOut
                ? 'Server timeout'
                : 'Reconnecting'
              EventBus.$emit('SHOW_LOADING', { message: reason })
              await sleep(amountToWaitBeforeRetry)
              amountToWaitBeforeRetry = Math.min(15000, amountToWaitBeforeRetry * 2)
            } else {
              throw e
            }
          }
          triedAtLeastOnce = true
        }

        // commit('set', { test: getters.currentTest, isRetryingAnswerSubmission: false })

        return getters.currentTest
      }
    },

    async addMultiAnswers({ getters, rootState }, { answers, retryUntilSuccess = true }) {
      if (getters.currentTest) {
        let triedAtLeastOnce = false
        let succeeded = false
        let amountToWaitBeforeRetry = 3000

        // try once; unless retryUntilSuccess, then keep trying forever
        while (!succeeded && (!triedAtLeastOnce || retryUntilSuccess)) {
          try {
            await apiPost(
              `tests/${getters.currentTest.id}/addMultiAnswers`,
              { answers },
              rootState.authentication.accessToken
            )
            succeeded = true
            if (triedAtLeastOnce) {
              EventBus.$emit('HIDE_LOADING')
              Vue.notify({ type: 'success', text: 'Successfully submitted answer' })
            }
          } catch (e) {
            const errorMessage = getErrorMessage(e, '', '')
            Vue.notify({ type: 'error', text: errorMessage })
            if (retryUntilSuccess) {
              const meta = e?.meta || {}
              const reason = meta.offlineLikely
                ? 'You are offline'
                : meta.serverNoReply
                ? 'Server unreachable'
                : meta.timedOut
                ? 'Server timeout'
                : 'Reconnecting'
              EventBus.$emit('SHOW_LOADING', { message: reason })
              await sleep(amountToWaitBeforeRetry)
              amountToWaitBeforeRetry = Math.min(15000, amountToWaitBeforeRetry * 2)
            } else {
              throw e
            }
          }
          triedAtLeastOnce = true
        }

        // commit('set', { test: getters.currentTest, isRetryingAnswerSubmission: false })

        return getters.currentTest
      }
    },

    async submitTest({ getters, commit, rootState, rootGetters }) {
      TimeMe.stopTimer(`testRun-${getters.currentTest.id}`)
      const isChallengeMode = rootGetters['cohortService/isChallengeModeEnabledForMe']
      let triedAtLeastOnce = false
      let succeeded = false
      let amountToWaitBeforeRetry = 3000
      let retryUntilSuccess = true
      let response = {}

      // try once; unless retryUntilSuccess, then keep trying forever
      while (!succeeded && (!triedAtLeastOnce || retryUntilSuccess)) {
        try {
          response = await apiPost(
            `tests/${getters.currentTest.id}/submit?isChallengeMode=${isChallengeMode}&isCTLab=${
              config.isCTLab ? 1 : 0
            }`,
            { secondsActive: Math.floor(TimeMe.getTimeOnPageInSeconds(`testRun-${getters.currentTest.id}`)) },
            rootState.authentication.accessToken
          )

          succeeded = true
          if (triedAtLeastOnce) {
            EventBus.$emit('HIDE_LOADING')
            Vue.notify({ type: 'success', text: 'Successfully submitted test' })
          }
        } catch (e) {
          const errorMessage = getErrorMessage(e, '', '')
          Vue.notify({ type: 'error', text: errorMessage })
          if (retryUntilSuccess) {
            const meta = e?.meta || {}
            const reason = meta.offlineLikely
              ? 'You are offline'
              : meta.serverNoReply
              ? 'Server unreachable'
              : meta.timedOut
              ? 'Server timeout'
              : 'Reconnecting'
            EventBus.$emit('SHOW_LOADING', { message: reason })
            await sleep(amountToWaitBeforeRetry)
            amountToWaitBeforeRetry = Math.min(15000, amountToWaitBeforeRetry * 2)
          } else {
            throw e
          }
        }
        triedAtLeastOnce = true
      }

      let { testRun } = response.data
      commit('set', { test: testRun })

      return { ...response.data.results, testRun }
    },

    async reset({ getters, commit }) {
      if (getters.currentTest) {
        TimeMe.stopTimer(`testRun-${getters.currentTest.id}`)

        commit('set', { test: null })
      }
    },
  },
  getters: {
    currentTest(state) {
      return state.test
    },
    currentTestIsPreparedExam(state) {
      return _.get(state.test, 'preparedExamId')
    },
    isTakingTest(state) {
      return !!state.test
    },
    isTestComplete(state) {
      return state.test && state.test.timeEnded
    },
  },
}

export default testRunService
