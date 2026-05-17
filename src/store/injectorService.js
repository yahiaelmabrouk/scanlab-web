import _ from 'lodash'
import html2canvas from 'html2canvas'

const injectorService = {
  namespaced: true,
  state: {
    salineInjectedPercent: 0,
    contrastInjectedPercent: 0,
    testSalineProcess: {
      vol: 10,
      rate: 1,
      testInjectedPercent: 0,
      isFirstCountDownTest: true,
      isCountDownTest: false,
      imageScale: 1,
    },
    testContrastProcess: {
      vol: 10,
      rate: 1,
      testInjectedPercent: 0,
      isFirstCountDownTest: true,
      isCountDownTest: false,
      imageScale: 1,
    },
    contrast1Process: {
      vol: 0,
      rate: 1,
      injectedPercent: 0,
    },
    contrast2Process: {
      vol: 0,
      rate: 1,
      injectedPercent: 0,
    },
    salineProcess: {
      vol: 0,
      rate: 1,
      injectedPercent: 0,
    },
    isArmedInjector: false,
    // Check if user click inject button in PowerInjector, it will continue count down when user move to next question
    isStartPowerInjectProcess: false,
    ppsContrastValue: 0,
    ppsContrastForPeriodValue: 0,
    ppsSalineValue: 0,
    ppsTestSalineValue: 0,
    ppsTestContrastValue: 0,
    isInjectingValue: false,
    isFirstInjectValue: true,
    distanceValue: 0,
    currentYValue: -222,
    endYValue: 3,
    startYValue: -222,

    isStartedSalineProcess: false,
    isStartedContrastProcess: false,
    isStartedContrast1Process: false,
    isStartedContrast2Process: false,
    isStartedTestContrastProcess: false,

    currentContrastDuration: 0,
    currentContrast1Duration: 0,
    currentContrast2Duration: 0,
    currentTestContrastDuration: 0,
    isShowResumeButtonValue: false,
    lastUpdateValue: null,

    testContrastFlowRate: 0,
    contrast1FlowRate: 0,
    contrast2FlowRate: 0,
    contrastFlowRate: 0,

    injectedSecondsBeforeStartViewTimingDecision: 0,
    isCheckedStartTimingDecision: false,
    firstUpdatedFlow: '',
    shouldBindAllFlowToFirstChangedFlow: true,

    startAnyContrastProcessTime: null,

    injectorWaitingTime: 0,

    isPowerInjectorFlowReady: false,

    // True between scan trigger and breath-hold instruction start.
    // Pauses the injector timer during transition overhead so it only
    // advances during the actual breath-hold countdown.
    isInjectorTimerPausedForTransition: false,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  actions: {
    resetInjectorState({ commit }) {
      commit('set', {
        firstUpdatedFlow: '',
        shouldBindAllFlowToFirstChangedFlow: true,
        salineInjectedPercent: 0,
        contrastInjectedPercent: 0,
        testSalineProcess: {
          vol: 10,
          rate: 1,
          testInjectedPercent: 0,
          isFirstCountDownTest: true,
          isCountDownTest: false,
          imageScale: 1,
        },
        testContrastProcess: {
          vol: 10,
          rate: 1,
          testInjectedPercent: 0,
          isFirstCountDownTest: true,
          isCountDownTest: false,
          imageScale: 1,
        },
        contrast1Process: {
          vol: 0,
          rate: 1,
          injectedPercent: 0,
        },
        contrast2Process: {
          vol: 0,
          rate: 1,
          injectedPercent: 0,
        },
        salineProcess: {
          vol: 0,
          rate: 1,
          injectedPercent: 0,
        },
        isArmedInjector: false,
        isStartPowerInjectProcess: false,
        ppsContrastValue: 0,
        ppsContrastForPeriodValue: 0,
        ppsSalineValue: 0,
        ppsTestSalineValue: 0,
        ppsTestContrastValue: 0,
        isInjectingValue: false,
        isFirstInjectValue: true,
        distanceValue: 0,
        currentYValue: -222,
        endYValue: 3,
        startYValue: -222,

        isStartedSalineProcess: false,
        isStartedContrastProcess: false,
        isStartedContrast1Process: false,
        isStartedContrast2Process: false,
        isStartedTestContrastProcess: false,
        currentContrastDuration: 0,
        currentContrast1Duration: 0,
        currentContrast2Duration: 0,
        currentTestContrastDuration: 0,
        isShowResumeButtonValue: false,
        lastUpdateValue: null,

        testContrastFlowRate: 0,
        contrast1FlowRate: 0,
        contrast2FlowRate: 0,
        contrastFlowRate: 0,

        injectedSecondsBeforeStartViewTimingDecision: 0,
        isCheckedStartTimingDecision: false,

        startAnyContrastProcessTime: null,

        injectorWaitingTime: 0,

        isPowerInjectorFlowReady: false,
        isInjectorTimerPausedForTransition: false,
      })
    },
    addInjectorWaitingTime({ commit, state, rootState }, payload) {
      const isStartTimingDecision = rootState.timingDecisionService.startTimingDecisionTime
      if (isStartTimingDecision) {
        commit('set', { injectorWaitingTime: state.injectorWaitingTime + payload })
      }
    },
    setInjectorTimerPausedForTransition({ commit }, payload) {
      commit('set', { isInjectorTimerPausedForTransition: payload })
    },
    setStartAnyContrastProcessTime({ commit, state }, payload) {
      if (_.isNil(state.startAnyContrastProcessTime)) {
        commit('set', { startAnyContrastProcessTime: payload })
      }
    },
    setShouldBindAllFlowToFirstChangedFlow({ commit }, payload) {
      commit('set', { shouldBindAllFlowToFirstChangedFlow: payload })
    },
    setFirstUpdatedFlow({ commit }, payload) {
      commit('set', { firstUpdatedFlow: payload })
    },
    setSalineInjectedPercent({ commit }, payload) {
      commit('set', { salineInjectedPercent: payload })
    },
    setContrastInjectedPercent({ commit }, payload) {
      commit('set', { contrastInjectedPercent: payload })
    },
    setTestSalineProcess({ commit }, payload) {
      commit('set', { testSalineProcess: payload })
    },
    setTestContrastProcess({ commit }, payload) {
      commit('set', { testContrastProcess: payload })
    },
    setContrast1Process({ commit }, payload) {
      commit('set', { contrast1Process: payload })
    },
    setContrast2Process({ commit }, payload) {
      commit('set', { contrast2Process: payload })
    },
    setIsArmedInjector({ commit }, payload) {
      commit('set', { isArmedInjector: payload })
    },
    setIsStartPowerInjectProcess({ commit }, payload) {
      commit('set', { isStartPowerInjectProcess: payload })
    },
    setPpsContrastValue({ commit }, payload) {
      commit('set', { ppsContrastValue: payload })
    },
    setPpsContrastForPeriodValue({ commit }, payload) {
      commit('set', { ppsContrastForPeriodValue: payload })
    },
    setPpsSalineValue({ commit }, payload) {
      commit('set', { ppsSalineValue: payload })
    },
    setPpsTestSalineValue({ commit }, payload) {
      commit('set', { ppsTestSalineValue: payload })
    },
    setPpsTestContrastValue({ commit }, payload) {
      commit('set', { ppsTestContrastValue: payload })
    },
    setIsInjectingValue({ commit }, payload) {
      commit('set', { isInjectingValue: payload })
    },
    setIsFirstInjectValue({ commit }, payload) {
      commit('set', { isFirstInjectValue: payload })
    },
    setSalineProcess({ commit }, payload) {
      commit('set', { salineProcess: payload })
    },
    setDistanceValue({ commit }, payload) {
      commit('set', { distanceValue: payload })
    },
    setCurrentYValue({ commit }, payload) {
      commit('set', { currentYValue: payload })
    },
    setEndYValue({ commit }, payload) {
      commit('set', { endYValue: payload })
    },
    setStartYValue({ commit }, payload) {
      commit('set', { startYValue: payload })
    },
    setIsStartedSalineProcess({ commit, state, rootState, dispatch }, payload) {
      commit('set', { isStartedSalineProcess: payload })

      if (
        !_.isNil(rootState.timingDecisionService.startTimingDecisionTime) &&
        !state.isCheckedStartTimingDecision &&
        payload
      ) {
        commit('set', { isCheckedStartTimingDecision: true })
        dispatch('timingDecisionService/setDelayTimeFromStartTimingDecisionTimeToPressInjectButton', null, {
          root: true,
        })
        dispatch('timingDecisionService/setIsPressInjectBeforePressScanButton', true, { root: true })
      }
    },
    setIsStartedContrastProcess({ commit, state, rootState, dispatch }, payload) {
      commit('set', { isStartedContrastProcess: payload })

      if (
        !_.isNil(rootState.timingDecisionService.startTimingDecisionTime) &&
        !state.isCheckedStartTimingDecision &&
        payload
      ) {
        commit('set', { isCheckedStartTimingDecision: true })
        dispatch('timingDecisionService/setDelayTimeFromStartTimingDecisionTimeToPressInjectButton', null, {
          root: true,
        })
        dispatch('timingDecisionService/setIsPressInjectBeforePressScanButton', true, { root: true })
      }
    },
    setIsStartedTestContrastProcess({ commit, state, rootState, dispatch }, payload) {
      commit('set', { isStartedTestContrastProcess: payload })
      if (
        !_.isNil(rootState.timingDecisionService.startTimingDecisionTime) &&
        !state.isCheckedStartTimingDecision &&
        payload
      ) {
        commit('set', { isCheckedStartTimingDecision: true })
        dispatch('timingDecisionService/setDelayTimeFromStartTimingDecisionTimeToPressInjectButton', null, {
          root: true,
        })
        dispatch('timingDecisionService/setIsPressInjectBeforePressScanButton', true, { root: true })
      }
    },
    setIsStartedContrast1Process({ commit }, payload) {
      commit('set', { isStartedContrast1Process: payload })
    },
    setIsStartedContrast2Process({ commit }, payload) {
      commit('set', { isStartedContrast2Process: payload })
    },
    setCurrentContrastDuration({ commit }, payload) {
      commit('set', { currentContrastDuration: payload })
    },
    setCurrentContrast1Duration({ commit }, payload) {
      commit('set', { currentContrast1Duration: payload })
    },
    setCurrentContrast2Duration({ commit }, payload) {
      commit('set', { currentContrast2Duration: payload })
    },
    setCurrentTestContrastDuration({ commit }, payload) {
      commit('set', { currentTestContrastDuration: payload })
    },
    setIsShowResumeButtonValue({ commit }, payload) {
      commit('set', { isShowResumeButtonValue: payload })
    },
    setLastUpdateValue({ commit }, payload) {
      commit('set', { lastUpdateValue: payload })
    },
    setTestContrastFlowRate({ commit }, payload) {
      commit('set', { testContrastFlowRate: payload })
    },
    setContrast1FlowRate({ commit }, payload) {
      commit('set', { contrast1FlowRate: payload })
    },
    setContrast2FlowRate({ commit }, payload) {
      commit('set', { contrast2FlowRate: payload })
    },
    setContrastFlowRate({ commit }, payload) {
      commit('set', { contrastFlowRate: payload })
    },
    setInjectedSecondsBeforeStartViewTimingDecision({ commit, state }) {
      if (!_.isNil(state.startAnyContrastProcessTime)) {
        const delayTime = (Date.now() - state.startAnyContrastProcessTime) / 1000
        commit('set', {
          injectedSecondsBeforeStartViewTimingDecision: _.round(delayTime),
        })
      }
    },
    async takeScreenShotPowerInjector({ dispatch, rootState }) {
      return new Promise((resolve) => {
        try {
          dispatch('selectionConfig/setDelayTime', rootState.selectionConfig.powerInjectorCurrentDuration, {
            root: true,
          })
          const flowContainer = document.getElementById('flowContainer')
          if (flowContainer) {
            const style = document.createElement('style')
            document.head.appendChild(style)
            style.sheet?.insertRule('body > div:last-child img { display: inline-block; }')
            html2canvas(flowContainer, { useCORS: true, allowTaint: true })
              .then((canvas) => {
                dispatch('questionService/setInjectorScreenshot', canvas.toDataURL('image/jpeg'), { root: true })
                style.remove()
                resolve()
              })
              .catch(() => {
                style.remove()
                resolve()
              })
          } else {
            resolve()
          }
        } catch (err) {
          resolve()
        }
      })
    },
  },
  getters: {},
}
export default injectorService
