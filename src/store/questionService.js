import log from 'loglevel'
import Vue from 'vue'
import { apiGet, apiPost } from '../util/api'
import uuidv4 from 'uuid/v4'
import _ from 'lodash'
import { trimNonIdentsFromAnswer, isIdent, identToIdentType } from '@/lib/selection-config-util'
import { getRandomPatientName, getRandomPatientFamilyMemberName } from '@/lib/question-util'
import Timer from '@/lib/timer.util'
import LogRocket from 'logrocket'
import config from '../config'
import {
  SCAN_STATUS,
  DEFAULT_PATIENT_GENDER,
  DEFAULT_PATIENT_MODEL_ID,
  DEFAULT_POSITION,
  SCREENING_FORM_GENDER,
  INJECTION_MODE,
  COPY_QUESTION_TYPES,
  INJECTOR_PROTOCOLS,
  BREATHING_INSTRUCTION,
  ROI_STATUS,
  NUM_OF_BODY_MAP_IMAGES,
  HU_TRIGGER_TYPE,
  DEFAULT_ROI_RADIUS,
  DEFAULT_ROI_STROKE_WIDTH,
  ANSWER_VIEWS_IMAGE_ID,
  TIMING_DECISION_MAX_PRESENTATION_STEP,
  DEFAULT_PATIENT_AGE,
  DEFAULT_CARDIAC_CYCLE_DURATION,
  INJECT_CONDITION,
  ADMIN_COPY_QUESTION_TYPES,
  ADMIN_COPY_TYPE,
  CARDIAC_LEVEL_OPTIONS,
  BODY_PART_TYPES,
} from '../constants'
import { getInjectionRunningSpeedDuration, onRenderMiddleSliceOfResultSliceView } from '../util/utils'

let countDownProcessRequestAnimationId = null
let lastCountDownUpdate = null
let countDownInterval = null
let isResetNextDeltaTime = false
const timer = new Timer()

function generateStackQuestionAnswer() {
  return {
    id: uuidv4(),
    name: '',
    criteria: '',
    citation: '',
    isSingleSlice: false,
    variants: [],
    // xDirectionX: null,
    // xDirectionY: null,
    // xDirectionZ: null,
    // yDirectionX: null,
    // yDirectionY: null,
    // yDirectionZ: null,
    // // zDir is just the cross product of xDir & yDir, so no need to store it
    // centerX: null,
    // centerY: null,
    // centerZ: null,
    // dimensionX: null,
    // dimensionY: null,
    // dimensionZ: null,
    // numberOfSlices: null,
    // thickness: null,
    // spacing: null
  }
}

function generateDisplayVariant() {
  return {
    id: uuidv4(),
    name: '',
  }
}

function generateStackQuestion(isFirstQuestion = false) {
  if (config.isCTLab && isFirstQuestion) {
    return {
      id: null,
      questionText: '',
      order: null,
      questionType: 3, // 1: acquisition question, 2: reconstruction question, 3: localizer question
      answers: [generateStackQuestionAnswer()],
      isCTLab: config.isCTLab,
    }
  } else {
    return {
      id: null,
      questionText: '',
      order: null,
      answers: [generateStackQuestionAnswer()],
      isCTLab: config.isCTLab,
    }
  }
}

const questionService = {
  namespaced: true,
  state: {
    refresh_test_button: false,
    activeTab: 0,
    isSelectedTab: true,
    questionSet: null,
    criticalThinkingQuestions: {
      preQuestion: null,
      postQuestions: [],
    },
    criticalThinkingQuestionsPreview: {
      preQuestion: null,
      postQuestions: [],
    },
    selectedStackQuestionIndex: 0,
    criticalThinkingQuestionIndex: 0,
    answerSelectionId: null,
    answerVariantSelectionId: null,
    displayVariantSelectionId: null,
    userAnswers: [],
    criticalThinkingAnswers: [],
    testResult: null,
    hasAnsweredAllStackQuestions: false,
    isViewingCriticalThinkingQuestion: false,
    shouldReloadDicomFileSet: false,
    isSavingQuestionSet: false,
    isEditingQuestion: false,
    isSubmitted: false,
    lastPreviewResult: null,
    lastScorePreviewAnswer: null,
    lastScorePreviewRubric: null,
    criticalThinkingQuestionTypes: [
      { text: 'All', value: '' },
      { text: 'Multiple Choice', value: 'MC' },
      { text: 'Timed Response', value: 'TR' },
      { text: 'Screening Form', value: 'SF' },
      { text: 'Point Select', value: 'PS' },
    ],
    dicomFileSetId: null, // which dicomFileSetId was loaded as part of the QuestionSet (can be different than currently loaded Dicom, with PointSelect/etc questions maybe loading other Dicom mid-QuestionSet)
    isSavingCriticalThinkingAnswer: false,
    isPlayingTheSlices: false,
    isLoadingPlayingTheSlices: false,
    scanStatus: SCAN_STATUS.NO_SCAN,
    canGoToNextStep: false,
    isSkippedAnswer: false,
    isLoadingDataToPlaySlice: false,
    isMovingMRIMachine: false,
    isConfirmedLocalizerQuestion: false,

    isMoveMRIMachineEnabled: false,
    isMRIMachineMoved: false,

    listPatientPositionsByBodyPartId: [],
    patientDirectionSide1: DEFAULT_POSITION[0],
    patientDirectionSide2: DEFAULT_POSITION[1],
    patientDirectionSide3: DEFAULT_POSITION[2],
    firstSelectedPatientPosition: null,
    submittedPatientPosition: null,
    //Position landmarked
    mriMachineLanmarkedPosition: {
      mriUpDownPositionY: 0,
      mriInOutPositionZ: 0,
    },
    //Binding current position of machine
    mriMachineCurrentPosition: {
      mriUpDownPositionY: 0,
      mriInOutPositionZ: 0,
    },

    injectionAttribute: null,

    // Confirm patient position screen shot
    positionScreenshot: null,
    // Screen shot of injector
    injectorScreenshot: null,
    injectorDoseScreenshot: null,
    isSubmittingAnswer: false,
    testPatientGender: DEFAULT_PATIENT_GENDER,
    testPatientModelId: DEFAULT_PATIENT_MODEL_ID,
    screeningFormWeightMetric: 0,
    testPatientName: '',
    testPatientFamilyMemberSignature: '',
    isLoadingScreeningFormPatientInfo: false,
    screeningFormConfigGender: null,
    screeningFormConfigAge: null,

    //List patient models
    listModels: [],
    testInjectionMode: INJECTION_MODE.CONTRAST_AND_SALINE,
    testInjectCondition: INJECT_CONDITION.SET_VOLUME,
    testInjectorProtocol: INJECTOR_PROTOCOLS.BOLUS,

    // List patient position sets
    testPatientPositionSets: [],

    // Delay time to start play slideshow
    scanDelay: 0,

    // Is playing music
    isPlayingMusic: false,
    injectionRunningSpeed: 0,

    stackQuestionScanDelayInfos: [],
    isStartCountDownProcess: false,

    questionsVerticalMenuKey: 1,

    roiStatus: ROI_STATUS.NO_CONFIRM,
    timingDecisionStartTime: null,
    delayTimeFromTimingDecisionStartByQuestion: {},
    timingDecisionStep: 0,
    presentationTimingDecisionStep: 0,
    presentationPreviewTimingDecisionStep: 0,
    timingDecisionScanDelay: 0,
    timingDecisionFlouroFrameRate: 1,
    timingDecisionHUTriggerThreshold: 150,
    timingDecisionTriggerType: HU_TRIGGER_TYPE.AUTOMATIC,
    timingDecisionBrightnessData: [],
    timingDecisionPointer: {
      x: 0,
      y: 0,
      radius: DEFAULT_ROI_RADIUS,
      scaleX: 1,
      scaleY: 1,
      strokeWidth: DEFAULT_ROI_STROKE_WIDTH,
      imageScale: 1,
    },

    currentCriticalThinkingQuestionSelectedAnswer: null,

    // Timing decision question screen shot
    timingDecisionConfirmScreenshot: null,
    timingDecisionROIScreenshot: null,

    // tracks if a user has seen a questions params previously
    // on order to tell if highlighting should occur
    hasQuestionParamsBeenSeen: [],

    // Patient physio of this question set
    patientPhysioInfo: null,

    timeDifferenceFromCorrectTime: 0,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
    setFirstSelectedPatientPosition(state, payload) {
      state.firstSelectedPatientPosition = payload
    },
    setSubmittedPatientPosition(state, payload) {
      console.log('setting submitted patient position', payload)
      state.submittedPatientPosition = payload
    },
    clearStackQuestions(state) {
      state.stackQuestions = [] // Clear unused questions
    },
  },
  watchGetters: {
    answers: 'onAnswersChanged',
    screeningFormConfigGender: 'updateInjectionAttributeByBodyPartId',
    answerCurrent: 'onAnswerCurrentChanged',
    answerCurrentIsSingleSlice: 'onAnswerCurrentIsSingleSliceChanged',
    currentBodyPartId: 'onBodyPartIdChanged',
    listModels: 'updatePatientPositionsByBodyPartId',
    stackQuestion: 'onStackQuestionChanged',
  },
  watchStates: {
    answerSelectionId: 'onAnswerSelectionIdChanged',
    answerVariantSelectionId: 'onAnswerVariantSelectionIdChanged',
    displayVariantSelectionId: 'onDisplayVariantSelectionIdChanged',
    isStartCountDownProcess: 'onCountDownOnAllStackQuestions',
    injectionRunningSpeed: 'onCountDownOnAllStackQuestions',
  },
  actions: {
    checkPressStartButtonOnTimeForTimingDecision({ commit, rootState, rootGetters }) {
      const powerInjectorCurrentDuration = rootState.selectionConfig.powerInjectorCurrentDuration
      const maximumDyeZone = rootGetters['timingDecisionService/maximumDyeZone']

      if (maximumDyeZone[0] == 0 && maximumDyeZone[1] == 0) {
        commit('set', {
          timeDifferenceFromCorrectTime: 0,
        })
      } else if (
        powerInjectorCurrentDuration <= maximumDyeZone[1] &&
        powerInjectorCurrentDuration >= maximumDyeZone[0]
      ) {
        commit('set', {
          timeDifferenceFromCorrectTime: 0,
        })
      } else if (powerInjectorCurrentDuration < maximumDyeZone[0]) {
        commit('set', {
          timeDifferenceFromCorrectTime: powerInjectorCurrentDuration - maximumDyeZone[0],
        })
      } else if (powerInjectorCurrentDuration > maximumDyeZone[1]) {
        commit('set', {
          timeDifferenceFromCorrectTime: powerInjectorCurrentDuration - maximumDyeZone[1],
        })
      }
    },
    // When user press start
    onCountDownOnAllStackQuestions({ state, getters, commit, rootState }) {
      const cancelCountDownProcess = () => {
        if (countDownProcessRequestAnimationId) {
          const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
          cancelAnimationFrame(countDownProcessRequestAnimationId)
          countDownProcessRequestAnimationId = null
        }
      }
      const updateDeltaTime = () => {
        if (state.isSubmittingAnswer || rootState.globalOptions.isAppLoading) {
          lastCountDownUpdate = Date.now()
          isResetNextDeltaTime = true
          return 0
        }
        if (isResetNextDeltaTime) {
          lastCountDownUpdate = Date.now()
          isResetNextDeltaTime = false
          return 0
        }
        const duration = getInjectionRunningSpeedDuration(state.injectionRunningSpeed)
        const now = Date.now()
        const delta = (now - lastCountDownUpdate) / duration
        lastCountDownUpdate = now
        return delta
      }
      if (state.isStartCountDownProcess && !state.isEditingQuestion) {
        lastCountDownUpdate = Date.now()
        const handleCountDown = () => {
          // Only count down only apply for some questions are consecutive
          let stackQuestionScanDelayInfos = _.cloneDeep(state.stackQuestionScanDelayInfos)
          const listConsecutiveQuestionId = [_.get(getters.stackQuestion, ['id'], null)]
          for (let i = 0; i < state.selectedStackQuestionIndex; i++) {
            if (
              !_.some(
                _.cloneDeep(getters.stackQuestions).slice(i, state.selectedStackQuestionIndex),
                (el) => _.get(el, 'questionType') != 1 || _.get(el, 'scanDelay', 0) == 0
              )
            ) {
              listConsecutiveQuestionId.push(_.get(getters.stackQuestions, [i, 'id']))
            }
          }
          for (let i = state.selectedStackQuestionIndex + 1; i < getters.stackQuestions.length; i++) {
            if (
              !_.some(
                _.cloneDeep(getters.stackQuestions).slice(state.selectedStackQuestionIndex + 1, i + 1),
                (el) =>
                  _.get(el, 'questionType') != 1 ||
                  (_.get(el, 'scanDelay', 0) == 0 && !getters.firstTimingDecisionQuestion)
              )
            ) {
              listConsecutiveQuestionId.push(_.get(getters.stackQuestions, [i, 'id']))
            }
          }
          const delta = updateDeltaTime()
          stackQuestionScanDelayInfos.forEach((el) => {
            if (_.get(el, ['scanDelay'], 0) - 1 >= 0 && listConsecutiveQuestionId.includes(_.get(el, ['questionId']))) {
              el.scanDelay = el.scanDelay - delta
            }
          })
          commit('set', {
            stackQuestionScanDelayInfos: stackQuestionScanDelayInfos,
          })
          countDownProcessRequestAnimationId = window.requestAnimationFrame(handleCountDown)

          if (
            !_.some(
              stackQuestionScanDelayInfos,
              (el) => listConsecutiveQuestionId.includes(_.get(el, ['questionId'])) && el.scanDelay > 0
            )
          ) {
            cancelCountDownProcess()
          }
        }
        countDownProcessRequestAnimationId = window.requestAnimationFrame(handleCountDown)
      } else {
        cancelCountDownProcess()
      }
    },
    onAnswerVariantSelectionIdChanged({ state, getters, dispatch }) {
      if (getters.answerCurrent) {
        getters.answerCurrent.variantSelectionId = state.answerVariantSelectionId
      }

      // set sat band selections from answer data current
      if (getters.answerDataCurrent) {
        dispatch(
          'satBandService/loadFromAnswerDataCurrent',
          _.get(getters.answerDataCurrent, ['satBandMarkZone'], {}),
          { root: true }
        )
        dispatch(
          'interactableService/setSatbandsFromAnswerDataCurrent',
          _.get(getters.answerDataCurrent, ['satBands'], {}),
          { root: true }
        )
      }
    },
    onDisplayVariantSelectionIdChanged({ state, getters }) {
      if (getters.stackQuestion) {
        getters.stackQuestion.displayVariantSelectionId = state.displayVariantSelectionId
      }
    },
    onAnswerSelectionIdChanged({ commit, state, getters, dispatch }) {
      // sync answer selection id to stack question
      if (_.get(getters.stackQuestion, ['answerSelectionId']) != state.answerSelectionId) {
        Object.assign(getters.stackQuestion, {
          answerSelectionId: state.answerSelectionId,
        })
        if (getters.answerCurrent) {
          commit('set', { answerVariantSelectionId: _.get(getters.answerCurrent, ['variantSelectionId']) })
        }
        commit('set', {
          selectedStackQuestionIndex: state.selectedStackQuestionIndex,
        })
      }

      // set sat band selections from answer data current
      if (getters.answerDataCurrent) {
        dispatch(
          'satBandService/loadFromAnswerDataCurrent',
          _.get(getters.answerDataCurrent, ['satBandMarkZone'], {}),
          { root: true }
        )
        dispatch(
          'interactableService/setSatbandsFromAnswerDataCurrent',
          _.get(getters.answerDataCurrent, ['satBands'], {}),
          { root: true }
        )
      }
    },
    async getListPatientModel({ commit, rootState }) {
      let response = await apiGet(`/model`, rootState.authentication.accessToken)
      const datas = _.get(response, ['data', 'data'], [])
      commit('set', { listModels: datas })
    },
    onBodyPartIdChanged({ dispatch }) {
      dispatch('updatePatientPositionsByBodyPartId')
      dispatch('updateInjectionAttributeByBodyPartId')
      dispatch('getTestPatientPositionSetsByBodyPartId')
      dispatch('getPatientPhysio')
    },
    selectPatientPosition({ commit, state }, payload) {
      let listPatientPositionsByBodyPartId = _.cloneDeep(state.listPatientPositionsByBodyPartId)
      listPatientPositionsByBodyPartId = listPatientPositionsByBodyPartId.map((e) => {
        e.selected = e.id != payload.id ? false : true

        return e
      })

      commit('set', { listPatientPositionsByBodyPartId })
    },
    async getPatientPhysio({ state, rootState, rootGetters, commit }) {
      const isTakingTest = rootGetters['testRunService/isTakingTest']
      const hasBundledPhysio = !!_.get(state, ['patientPhysioInfo', 'id'])
      if (isTakingTest && hasBundledPhysio) {
        return
      }
      const response = await apiGet(`/patientPhysio/random`, rootState.authentication.accessToken)
      commit('set', { patientPhysioInfo: _.get(response, ['data', 'data']) })
    },
    async updatePatientPositionsByBodyPartId({ dispatch, getters, commit, state, rootGetters, rootState }) {
      if (!getters.currentBodyPartId) {
        commit('set', { listPatientPositionsByBodyPartId: [] })
      } else {
        const isTakingTest = rootGetters['testRunService/isTakingTest']
        let patientPositions = []
        if (isTakingTest) {
          //Get model id by filtering listModels
          let gender = state.screeningFormConfigGender
          let age = state.screeningFormConfigAge

          let url = `/patientPositions/getPatinetPositionsHaveBodyBoxes?bodyPartId=${getters.currentBodyPartId}`
          if (gender && gender != SCREENING_FORM_GENDER.EITHER) {
            url += `&gender=${gender}`
          }
          if (age != null) {
            url += `&age=${age}`
          }

          const response = await apiGet(url, rootState.authentication.accessToken)
          const datas = _.get(response, ['data', 'patientPositions'], [])
          const modelId = _.get(response, ['data', 'model', 'id'], DEFAULT_PATIENT_MODEL_ID)
          if (modelId) {
            commit('set', {
              testPatientGender: gender,
              testPatientModelId: modelId,
              screeningFormWeightMetric: _.get(response, ['data', 'model', 'weightMetric'], 0),
            })
            const modelAttributes = _.get(response, ['data', 'model', 'attributes'], [])
            const testModel = _.get(response, ['data', 'model'], null)
            let { name, lastName } = getRandomPatientName(modelAttributes, testModel)
            let { name: familyMemberName } = getRandomPatientFamilyMemberName(
              modelAttributes,
              testModel,
              name,
              lastName
            )

            commit('set', {
              testPatientName: name,
              testPatientFamilyMemberSignature: familyMemberName,
              isLoadingScreeningFormPatientInfo: false,
            })
          }
          if (_.some(datas, (el) => _.get(el, ['bodyBoxes', 'length'], 0) > 0)) {
            patientPositions = datas
            // Change gender
          } else {
            commit('set', { isLoadingScreeningFormPatientInfo: false })
            console.log('starting test without available model')
          }
        } else {
          const response = await apiGet(
            `/patientPositions/getPatinetPositionsHaveBodyBoxes?bodyPartId=${getters.currentBodyPartId}`,
            rootState.authentication.accessToken
          )
          patientPositions = _.get(response, ['data', 'patientPositions'], [])
          let modelGender = _.get(response, ['data', 'model', 'gender'], DEFAULT_PATIENT_GENDER)
          let modelId = _.get(response, ['data', 'model', 'id'], DEFAULT_PATIENT_GENDER)
          commit('set', {
            testPatientGender: modelGender,
            testPatientModelId: modelId,
            screeningFormWeightMetric: _.get(response, ['data', 'model', 'weightMetric'], 0),
          })

          const modelAttributes = _.get(response, ['data', 'model', 'attributes'], [])
          const testModel = _.get(response, ['data', 'model'], null)
          let { name, lastName } = getRandomPatientName(modelAttributes, testModel)
          let { name: familyMemberName } = getRandomPatientFamilyMemberName(modelAttributes, testModel, name, lastName)
          commit('set', { testPatientName: name, testPatientFamilyMemberSignature: familyMemberName })
        }
        commit('set', { listPatientPositionsByBodyPartId: patientPositions })
        if (patientPositions.length > 0) {
          dispatch('selectPatientPosition', patientPositions[0])
        }
      }
    },
    async getTestPatientPositionSetsByBodyPartId({ dispatch, getters, commit }) {
      if (!getters.currentBodyPartId) {
        commit('set', { testPatientPositionSets: null })
      } else {
        let result = await dispatch(
          'patientPositionService/getPatientPositionSetsByBodyPartId',
          {
            bodyPartId: getters.currentBodyPartId,
          },
          { root: true }
        )
        commit('set', { testPatientPositionSets: result ? result : null })
      }
    },
    async updateInjectionAttributeByBodyPartId({ dispatch, getters, commit }) {
      if (!getters.currentBodyPartId) {
        commit('set', { injectionAttribute: null })
      } else {
        let result = await dispatch('getInjectionAttributeByBodyPartId', {
          bodyPartId: getters.currentBodyPartId,
        })
        commit('set', { injectionAttribute: result ? result : null })
      }
    },
    async getInjectionAttributeByBodyPartId({ rootState }, { bodyPartId }) {
      let response = await apiGet(
        `/injection/injectionAttributes?bodyPartId=${bodyPartId}`,
        rootState.authentication.accessToken
      )
      return response.data.result
    },
    questionTabOpen({ commit }) {
      commit('set', {
        isSelectedTab: false,
      })
    },

    setIsEditingQuestion({ commit }, { isEditingQuestion }) {
      commit('set', { isEditingQuestion })
    },
    async loadQuestionSet({ commit, dispatch, rootState, state }, { elProgressBar, questionSetId, dicomFileSetId }) {
      dicomFileSetId = parseInt(dicomFileSetId)
      if (questionSetId === 'new') {
        let stackQuestion = generateStackQuestion(true)

        // default NEW question set
        let questionSet = {
          id: null,
          name: '',
          dicomFileSet: dicomFileSetId,
          stackQuestions: [stackQuestion],
          isAvailable: true,
          isPreparedExamOnly: false,
        }

        commit('set', { questionSet, hasAnsweredAllStackQuestions: false, dicomFileSetId })
        dispatch('dicomService/loadDicomGroup', { elProgressBar, dicomFileSetId }, { root: true })
      } else {
        // Load Stack Question
        log.debug('loading stackQuestion ', questionSetId)
        let response = await apiGet(
          `questionSets/${questionSetId}?isCTLab=${config.isCTLab ? 1 : 0}`,
          rootState.authentication.accessToken
        )
        let questionSet = response.data.questionSet

        // add emptry variant array if not present
        questionSet.stackQuestions.forEach((q) => {
          q.answers.forEach((a) => {
            if (!a.variants) {
              a.variants = []
            }
          })
          // displayVariants is used in editing mode to show the different display options
          // for a question. Get random display variant and apply it to the proposed config
          if (!q.displayVariants) {
            q.displayVariants = []
          }
          if (!state.isEditingQuestion && q.displayVariants.length > 0) {
            q.displayVariantSelectionId = ''

            const randomDisplayVariantSelectionId = _.sample([..._.map(q.displayVariants, 'id')])
            if (randomDisplayVariantSelectionId != '') {
              const selectedDisplayVariant = _.find(q.displayVariants, { id: randomDisplayVariantSelectionId })
              let displayConfig = null
              _.each(selectedDisplayVariant, (value, key) => {
                if (isIdent(key) && identToIdentType(key) == 'proposed') {
                  displayConfig = value
                }
              })
              if (displayConfig) {
                q.answers.forEach((a) => {
                  _.each(a, (value, key) => {
                    if (isIdent(key) && identToIdentType(key) == 'proposed') {
                      a[key] = _.cloneDeep(displayConfig)
                    }
                    a.variants.forEach((v) => {
                      _.each(v, (value, ident) => {
                        if (isIdent(ident) && identToIdentType(ident) == 'proposed') {
                          v[ident] = _.cloneDeep(displayConfig)
                        }
                      })
                    })
                  })
                })
              }
            }
          }
        })

        if (rootState.user.isAdmin) {
          for (const stackQuestion of questionSet.stackQuestions) {
            // load up the rubric for each question
            let rubricResponse = await apiGet(
              `/results/rubric/${stackQuestion.id}?isCTLab=${config.isCTLab ? 1 : 0}`,
              rootState.authentication.accessToken
            )
            stackQuestion.rubric = rubricResponse.data.rubric
          }
        }

        let dicomFileSetId = questionSet.dicomFileSet
        let digitalLocalizerMinStep = _.get(questionSet, ['bodyPart', 'digitalLocalizers', 0, 'minStep'], 0)
        if (questionSet?.bodyPart?.base) {
          digitalLocalizerMinStep = _.get(questionSet, ['bodyPart', 'base', 'digitalLocalizers', 0, 'minStep'], 0)
        }
        let digitalLocalizerMaxStep = _.get(
          questionSet,
          ['bodyPart', 'digitalLocalizers', 0, 'maxStep'],
          NUM_OF_BODY_MAP_IMAGES - 1
        )
        if (questionSet?.bodyPart?.base) {
          digitalLocalizerMaxStep = _.get(
            questionSet,
            ['bodyPart', 'base', 'digitalLocalizers', 0, 'maxStep'],
            NUM_OF_BODY_MAP_IMAGES - 1
          )
        }
        dispatch(
          'timingDecisionService/setDigitalLocalizerStep',
          { min: digitalLocalizerMinStep, max: digitalLocalizerMaxStep },
          { root: true }
        )
        const timingDecisionStep = Math.floor((digitalLocalizerMaxStep + digitalLocalizerMinStep) / 2)
        commit('set', { questionSet, hasAnsweredAllStackQuestions: false, dicomFileSetId, timingDecisionStep })
        dispatch('presetScanStatusWhenMoveToAnotherQuestion', state.selectedStackQuestionIndex)

        dispatch('dicomService/loadDicomGroup', { elProgressBar, dicomFileSetId }, { root: true })
      }
    },
    // swapDisplayVariantSelectionId({ commit, getters, state }) {
    //   if (getters.displayVariantSelections.length == 0) {
    //     return
    //   }
    //   let currentSelectionIndex = _.findIndex(getters.displayVariantSelections, {
    //     value: state.displayVariantSelectionId,
    //   })
    //   if (currentSelectionIndex < 0) {
    //     currentSelectionIndex = 0
    //   }

    //   const nextSelectionIndex = (currentSelectionIndex + 1) % getters.displayVariantSelections.length
    //   commit('set', { displayVariantSelectionId: getters.displayVariantSelections[nextSelectionIndex].value })
    // },
    // saveANewCopy - don't Edit current QuestionSet; instead save as a new QuestionSet
    async saveQuestionSet({ state, getters, commit, rootState, dispatch }, { saveANewCopy }) {
      LogRocket.track('SaveQuestionSet')

      commit('set', { isSavingQuestionSet: true })
      let { questionSet } = state

      // take the sorted stackQuestions that have been augmented with their proper `order` and persist that
      questionSet.stackQuestions = getters.stackQuestions
      commit('set', { questionSet })

      if (saveANewCopy) {
        // Clone question without IDs, fresh answer ids (those are just blobs, not in the db)
        questionSet = _.cloneDeep(questionSet)
        questionSet.id = null
        _.each(questionSet.stackQuestions, function (stackQuestion) {
          stackQuestion.id = null
          _.each(stackQuestion.answers, function (answer) {
            answer.id = uuidv4()
            if (answer.variants) {
              _.each(answer.variants, (variant) => {
                variant.id = uuidv4()
              })
            }
          })
        })
      }

      // Remove proposed identTypes from answers
      questionSet = _.cloneDeep(questionSet)
      console.log('questionSet', questionSet)

      try {
        let stackQuestionIdUrl = questionSet.id ? `/${questionSet.id}` : ''
        let response = await apiPost(
          `questionSets${stackQuestionIdUrl}`,
          questionSet,
          rootState.authentication.accessToken
        )
        if (!response.data.success) {
          Vue.notify({ type: 'error', text: _.get(response, 'data.error') || 'Failed to save' })
        } else {
          if (saveANewCopy) {
            Vue.notify({ text: 'Saved an additional copy of this Test!' })
          } else {
            // Fill in the various IDs at various levels that the backend probably did now so we can keep track and not keep deleting and re-creating StackQuestions
            // If you didn't do this, you'd A) Create an additional new QuestionSet every time you click save on a new QuestionSet + B) Recreate every recently new question on a QuestionSet
            questionSet = response.data.questionSet
            commit('set', { questionSet })
            Vue.notify({ text: 'Saved' })
          }
        }
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Failed to save!' })
        throw e
      }

      commit('set', { isSavingQuestionSet: false })
      dispatch('resetScanStatus')
    },

    clearMemory({ commit }) {
      if (countDownInterval) {
        clearInterval(countDownInterval)
      }
      commit('clearStackQuestions')
    },

    async loadCriticalThinkingQuestionsFromTest({ commit, rootState }, { test }) {
      let preQuestion, postQuestions

      const preQuestionId = _.find(test.questions, { type: 'PREQUESTION' })
      //const postQuestionIds = _.filter(test.questions, { type: 'POSTQUESTION' })
      const postQuestionIds = _.filter(
        test.questions,
        (question) => question.type === 'POSTQUESTION' || question.type === 'BETAQUESTION'
      )

      if (preQuestionId) {
        let response = await apiGet(`multipleChoiceQuestions/${preQuestionId.id}`, rootState.authentication.accessToken)
        preQuestion = response.data.multipleChoiceQuestion
      }

      postQuestions = await Promise.all(
        postQuestionIds.map(async (postQ) => {
          let response = await apiGet(`multipleChoiceQuestions/${postQ.id}`, rootState.authentication.accessToken)
          return response.data.multipleChoiceQuestion
        })
      )

      // Set test patient gender if test has critical thinking question
      let gender = null
      let age = null
      if (preQuestion) {
        gender = _.get(preQuestion, ['screeningForm', 'gender'], DEFAULT_PATIENT_GENDER)
        age = _.get(preQuestion, ['screeningForm', 'age'], DEFAULT_PATIENT_AGE)
      }
      commit('set', {
        criticalThinkingQuestions: { preQuestion, postQuestions },
        criticalThinkingQuestionsPreview: { preQuestion, postQuestions },
        testPatientGender: gender,
        screeningFormConfigGender: gender,
        screeningFormConfigAge: age,
      })

      if (!config.isCTLab) {
        // In MR, screeningFormWeightMetric = screeningForm.weightMetric
        // In CT, screeningFormWeightMetric = testModel.weightMetric
        commit('set', {
          screeningFormWeightMetric: _.get(preQuestion, ['screeningForm', 'weightMetric'], 0),
        })
      }

      if (preQuestion) {
        commit('set', { isViewingCriticalThinkingQuestion: true })
      }
    },

    async saveCriticalThinkingAnswer({ commit, dispatch, state }, answer) {
      // This might fail, in which case we'd not want to do anything below
      state.isSavingCriticalThinkingAnswer = true
      await dispatch(
        'testRunService/addAnswer',
        { answer: { questionId: answer.question.id, selectedAnswer: answer.selectedAnswer } },
        { root: true }
      )
      state.criticalThinkingAnswers.push(answer)

      if (state.criticalThinkingQuestions.preQuestion) {
        if (answer.question.type == 'PS') {
          commit('set', { isViewingCriticalThinkingQuestion: false, shouldReloadDicomFileSet: true })
        } else {
          dispatch('startTimer')
          commit('set', { isViewingCriticalThinkingQuestion: false, shouldReloadDicomFileSet: false })
        }

        // Reset preQuestion and change to next question
        state.criticalThinkingQuestions.preQuestion = null
      } else {
        let nextIndex = -1
        let isUsedPostQuestion = -1

        for (
          nextIndex = state.criticalThinkingQuestionIndex + 1;
          nextIndex < state.criticalThinkingQuestions.postQuestions.length;
          nextIndex++
        ) {
          // Check if next postQuestion was already used
          isUsedPostQuestion = state.criticalThinkingAnswers.findIndex(
            (each) =>
              each.question.id == state.criticalThinkingQuestions.postQuestions[nextIndex].id &&
              each.question.questionText == state.criticalThinkingQuestions.postQuestions[nextIndex].questionText
          )

          if (isUsedPostQuestion < 0) {
            break
          }
        }
        if (nextIndex >= state.criticalThinkingQuestions.postQuestions.length) {
          await dispatch('submitTestRun')
        } else {
          commit('set', { criticalThinkingQuestionIndex: nextIndex })
        }
      }

      state.isSavingCriticalThinkingAnswer = false
    },
    deleteScanInfoOfCurrentStackQuestion({ getters, state, commit }) {
      if (!config.isCTLab) {
        return
      }

      let { stackQuestion } = getters
      let stackQuestionScanDelayInfos = _.cloneDeep(state.stackQuestionScanDelayInfos).filter(
        (el) => el.questionId != _.get(stackQuestion, ['id'])
      )

      delete stackQuestion.scanDelay
      delete stackQuestion.scanDuration
      delete stackQuestion.breathingInstruction

      commit('set', {
        stackQuestionScanDelayInfos: stackQuestionScanDelayInfos,
        questionsVerticalMenuKey: state.questionsVerticalMenuKey + 1,
      })
    },
    setTimingDecisionInfoToStackQuestion({ state, getters, commit }) {
      if (!config.isCTLab || state.isEditingQuestion) {
        return
      }

      let { stackQuestion } = getters
      if (_.get(stackQuestion, ['questionType']) == 5) {
        stackQuestion.timingDecisionScanDelay = state.timingDecisionScanDelay
        commit('set', { questionsVerticalMenuKey: state.questionsVerticalMenuKey + 1 })
      }
    },
    handlePressedNextButton({ commit, state, getters }) {
      if (getters.stackQuestion) {
        getters.stackQuestion.isPressedNext = true
        commit('set', { questionsVerticalMenuKey: state.questionsVerticalMenuKey + 1 })
      }
    },
    // Only set when press confirm
    setScanInfoToStackQuestion({ commit, getters, state, rootState, rootGetters }) {
      if (!config.isCTLab || state.isEditingQuestion) {
        return
      }
      let stackQuestionScanDelayInfos = _.cloneDeep(state.stackQuestionScanDelayInfos)
      let { stackQuestion } = getters
      const breathingInstruction = _.get(
        rootGetters['selectionConfig/selectionConfigCurrent'],
        'breathingInstruction',
        BREATHING_INSTRUCTION.OFF
      )

      // Only handle scan delay for acqisition
      if (_.get(stackQuestion, ['questionType']) == 1) {
        stackQuestion.breathingInstruction = breathingInstruction
        // Origin scan delay when user confirm
        stackQuestion.scanDelay = state.scanDelay
        stackQuestion.scanDuration = rootState.stackService.scanDurationOfConfig
        commit('set', { questionsVerticalMenuKey: state.questionsVerticalMenuKey + 1 })
        // Scan delay auto count down
        if (!state.isStartCountDownProcess) {
          const scanDelayInfo = _.find(
            stackQuestionScanDelayInfos,
            (el) => el.questionId == _.get(stackQuestion, ['id'])
          )
          if (scanDelayInfo) {
            scanDelayInfo.scanDelay = state.scanDelay
          } else {
            stackQuestionScanDelayInfos.push({
              questionId: _.get(stackQuestion, ['id']),
              scanDelay: state.scanDelay,
            })
          }
          commit('set', {
            stackQuestionScanDelayInfos: stackQuestionScanDelayInfos,
          })
        }
      } else if (_.get(stackQuestion, ['questionType']) == 3) {
        stackQuestion.breathingInstruction = breathingInstruction
        commit('set', { questionsVerticalMenuKey: state.questionsVerticalMenuKey + 1 })
      }
    },
    async autoSetStackQuestionAnswerFromSelectionsIfModified({ getters, dispatch }, { isFromJumpToQuestion } = {}) {
      if (getters.answerCurrentHasBeenModified || isFromJumpToQuestion) {
        await dispatch('setStackQuestionAnswerFromSelectionsAndRefresh', {
          answer: getters.answerDataCurrent,
        })
      }
      // - All places that call this method used to have this below code instead; just preventing the action until the user manually clicked set - instead we now auto-set
      // if (getters.answerCurrentHasBeenModified) {
      //   Vue.notify({ type: 'warn', text: 'Please revert your modified answer first!' })
      //   return
      // }
    },

    async setStackQuestionAnswerFromSelectionsAndRefresh({ state, commit, dispatch, rootState }, { answer }) {
      //
      dispatch('selectionConfig/setStackQuestionAnswerFromSelections', { answer }, { root: true })
      if (!config.isCTLab) {
        Object.assign(answer, {
          satBandMarkZone: rootState.satBandService.satBandSelections,
          satBands: rootState.interactableService.interactableStateByIdent,
        })
      }
      // This is needed to refresh the Save Test button on StackQuestionEdit
      // stackQuestion.answers = [...stackQuestion.answers]
      state.refresh_test_button = !state.refresh_test_button
      commit('set', {
        selectedStackQuestionIndex: state.selectedStackQuestionIndex,
      })
    },

    async setAnswerIdAsDefault({ getters }, { answerId }) {
      let { stackQuestion } = getters
      stackQuestion.answers = _.map(stackQuestion.answers, function (answer) {
        if (answer.id === answerId) {
          answer.default = true
        } else {
          delete answer.default
        }
        return answer
      })
    },

    async resetScanStatus({ commit }) {
      commit('set', {
        scanStatus: SCAN_STATUS.NO_SCAN,
        roiStatus: ROI_STATUS.NO_CONFIRM,
        isPlayingTheSlices: false,
        isLoadingPlayingTheSlices: false,
        canGoToNextStep: false,
      })
    },
    async setScanStatusForAnsweredQuestion({ commit }) {
      commit('set', {
        scanStatus: SCAN_STATUS.SCANNED,
        isMoveMRIMachineEnabled: true,
        isPlayingTheSlices: false,
        isLoadingPlayingTheSlices: false,
        canGoToNextStep: false,
      })
    },
    async addAnswerVariant({ state, commit, getters, dispatch }) {
      await dispatch('autoSetStackQuestionAnswerFromSelectionsIfModified')
      dispatch('resetScanStatus')

      if (!getters.answerCurrent.variants) {
        getters.answerCurrent.variants = []
      }

      let answer = generateStackQuestionAnswer()
      answer.name = null
      answer.isVariant = true
      answer.variants = null

      getters.answerCurrent.variants = [...getters.answerCurrent.variants, answer]
      getters.stackQuestion.answers = [...getters.stackQuestion.answers]

      commit('set', {
        selectedStackQuestionIndex: state.selectedStackQuestionIndex, // update what makes the stackQuestion-based stuff refresh
        answerVariantSelectionId: answer.id,
      })

      await dispatch('selectionConfig/setStackQuestionAnswerFromSelections', { answer }, { root: true })
    },
    async addDisplayVariant({ state, commit, getters, dispatch }) {
      await dispatch('autoSetStackQuestionAnswerFromSelectionsIfModified')
      dispatch('resetScanStatus')

      if (!getters.stackQuestion.displayVariants) {
        getters.stackQuestion.displayVariants = []
      }

      let displayVariant = generateDisplayVariant()
      displayVariant.name = null
      displayVariant.isVariant = true

      getters.stackQuestion.displayVariants = [...getters.displayVariants, displayVariant]

      commit('set', {
        selectedStackQuestionIndex: state.selectedStackQuestionIndex, // update what makes the stackQuestion-based stuff refresh
        displayVariantSelectionId: displayVariant.id,
      })

      await dispatch(
        'selectionConfig/setStackQuestionAnswerFromSelections',
        { answer: getters.answerDataCurrent },
        { root: true }
      )
    },
    updateDisplayVariantName({ commit, getters }, { name }) {
      if (getters.displayVariantCurrent) {
        getters.displayVariantCurrent.name = name
      }
      commit('set', {
        displayVariantSelectionId: getters.displayVariantCurrent.id,
      })
    },
    removeAnswerVariant({ commit, getters }) {
      getters.answerCurrent.variants = _.without(getters.answerCurrent.variants, getters.answerVariantCurrent)
      // go back to defaul variant
      commit('set', {
        answerVariantSelectionId: null,
      })
    },
    removeDisplayVariant({ commit, getters }) {
      getters.stackQuestion.displayVariants = _.without(
        getters.stackQuestion.displayVariants,
        getters.displayVariantCurrent
      )
      // go back to defaul variant
      commit('set', {
        displayVariantSelectionId: null,
      })
    },
    async addAnswerToStackQuestion({ state, commit, getters, dispatch }) {
      await dispatch('autoSetStackQuestionAnswerFromSelectionsIfModified')
      dispatch('resetScanStatus')

      let { stackQuestion } = getters
      let answer = generateStackQuestionAnswer()
      stackQuestion.answers = [...stackQuestion.answers, answer]
      // stackQuestion.answers.push(answer)
      log.debug('add ANSWERS', answer.id, stackQuestion.answers)
      // Needs to be set to detect changes, like to check if there is an answer picked for the score preview?
      commit('set', {
        selectedStackQuestionIndex: state.selectedStackQuestionIndex, // update what makes the stackQuestion-based stuff refresh
        answerSelectionId: answer.id,
      })
      dispatch('selectionConfig/setStackQuestionAnswerFromSelections', { answer }, { root: true })
    },
    async removeAnswerFromStackQuestion({ state, commit, getters }, { answer }) {
      let removingCurrent = answer.id === state.answerSelectionId
      let { stackQuestion } = getters
      stackQuestion.answers = _.without(stackQuestion.answers, answer)
      if (removingCurrent) {
        // needs to set current selection to something else
        commit('set', {
          answerSelectionId: _.get(getters.answers, [0, 'id']),
        })
      }
    },
    async addQuestion({ state, commit, getters, dispatch }) {
      await dispatch('autoSetStackQuestionAnswerFromSelectionsIfModified')
      dispatch('resetScanStatus')

      let { questionSet } = state
      questionSet.stackQuestions = [...getters.stackQuestions, generateStackQuestion()]
      commit('set', { questionSet })
    },
    async copyQuestion({ state, commit, getters, dispatch }) {
      await dispatch('autoSetStackQuestionAnswerFromSelectionsIfModified')
      dispatch('resetScanStatus')

      let { questionSet, selectedStackQuestionIndex } = state

      const clonedQuestion = _.cloneDeep(getters.stackQuestion)
      clonedQuestion.id = null
      clonedQuestion.order = _.last(getters.stackQuestions).order + 1
      _.each(clonedQuestion.answers, (answer) => {
        answer.id = uuidv4()
        if (answer.variants) {
          _.each(answer.variants, (variant) => {
            variant.id = uuidv4()
          })
        }
      })

      questionSet.stackQuestions = [...getters.stackQuestions, clonedQuestion]
      selectedStackQuestionIndex = questionSet.stackQuestions.length - 1
      commit('set', { questionSet, selectedStackQuestionIndex })
    },
    async removeQuestion({ state, commit, getters }) {
      let { questionSet, selectedStackQuestionIndex } = state
      if (questionSet.stackQuestions.length > 1) {
        questionSet.stackQuestions = _.without(getters.stackQuestions, getters.stackQuestion)
        // move selectedStackQuestionIndex left one, but not below 0
        selectedStackQuestionIndex = Math.max(0, selectedStackQuestionIndex - 1)
        commit('set', { questionSet, selectedStackQuestionIndex })
      }
    },

    // Move a question's order forward or backwards
    async reorderQuestion({ state, commit, getters }, { dir }) {
      let { questionSet } = state
      let stackQuestions = _.clone(getters.stackQuestions)
      let curIndex = state.selectedStackQuestionIndex
      let otherIndex = curIndex + dir
      if (otherIndex < 0 || otherIndex >= _.size(stackQuestions)) {
        return false
      }

      let curStackQuestion = stackQuestions[curIndex]
      let otherStackQuestion = stackQuestions[otherIndex]
      let curOrder = curStackQuestion.order
      let otherOrder = otherStackQuestion.order
      curStackQuestion.order = otherOrder
      otherStackQuestion.order = curOrder

      // take the sorted stackQuestions that have been augmented with their proper `order` and persist that
      questionSet.stackQuestions = stackQuestions
      commit('set', { questionSet, selectedStackQuestionIndex: otherIndex })
    },
    async selectNextQuestion({ state, commit, getters, dispatch }) {
      await dispatch('autoSetStackQuestionAnswerFromSelectionsIfModified', { isFromJumpToQuestion: true })
      dispatch('resetScanStatus')
      if (config.isCTLab && !state.isEditingQuestion && !getters.isLocalizerQuestion) {
        await dispatch('saveCurrentAnswer')
      }

      let { selectedStackQuestionIndex } = state
      selectedStackQuestionIndex++
      if (selectedStackQuestionIndex > getters.stackQuestions.length - 1) {
        selectedStackQuestionIndex = 0
      }
      commit('set', { selectedStackQuestionIndex })
      dispatch('presetScanStatusWhenMoveToAnotherQuestion', selectedStackQuestionIndex)
    },

    async resetMRIState({ commit, dispatch }) {
      commit('set', {
        selectedStackQuestionIndex: 0,
        scanDelay: 0,
        injectionRunningSpeed: 0,
        isPlayingMusic: false,
        isPlayingTheSlices: false,
        isLoadingPlayingTheSlices: false,
        scanStatus: SCAN_STATUS.NO_SCAN,
        roiStatus: ROI_STATUS.NO_CONFIRM,
        timingDecisionStartTime: null,
        delayTimeFromTimingDecisionStartByQuestion: {},
        canGoToNextStep: false,
        isLoadingScreeningFormPatientInfo: false,
        isStartCountDownProcess: false,
        stackQuestionScanDelayInfos: [],

        isConfirmedLocalizerQuestion: false,

        timingDecisionStep: 213,
        presentationTimingDecisionStep: 0,
        presentationPreviewTimingDecisionStep: 0,
        timingDecisionScanDelay: 0,
        timingDecisionFlouroFrameRate: 1,
        timingDecisionHUTriggerThreshold: 150,
        timingDecisionTriggerType: HU_TRIGGER_TYPE.AUTOMATIC,
        timingDecisionBrightnessData: [],
        timingDecisionPointer: {
          x: 0,
          y: 0,
          radius: DEFAULT_ROI_RADIUS,
          scaleX: 1,
          scaleY: 1,
          strokeWidth: DEFAULT_ROI_STROKE_WIDTH,
          imageScale: 1,
        },
        timingDecisionConfirmScreenshot: null,
        timingDecisionROIScreenshot: null,

        timeDifferenceFromCorrectTime: 0,
      })

      // Lock thickness change when user change slice box
      // Set default to ignore this case
      if (config.isCTLab) {
        dispatch('selectionConfig/setHeightChangeTarget', 'numberOfSlices', { root: true })
      }
    },
    async selectPrevQuestion({ state, commit, getters, dispatch }) {
      await dispatch('autoSetStackQuestionAnswerFromSelectionsIfModified', { isFromJumpToQuestion: true })
      dispatch('resetScanStatus')
      let { selectedStackQuestionIndex } = state
      selectedStackQuestionIndex--
      if (selectedStackQuestionIndex < 0) {
        selectedStackQuestionIndex = getters.stackQuestions.length - 1
      }
      commit('set', { selectedStackQuestionIndex })
      dispatch('presetScanStatusWhenMoveToAnotherQuestion', selectedStackQuestionIndex)
    },
    // This question will be handled when user click on step bar
    async jumpToQuestion({ commit, dispatch, state, getters }, idx) {
      if (config.isCTLab && !state.isEditingQuestion) {
        // Check can jumb to this question
        let lastLocalizerQuestionBeforeJumpQuestion = _.reverse(_.cloneDeep(getters.stackQuestions.slice(0, idx))).find(
          (el) => _.get(el, ['questionType'], -1) == 3
        )
        let lastChangePatientPositionQuestionBeforeJumpQuestion = _.reverse(
          _.cloneDeep(getters.stackQuestions.slice(0, idx))
        ).find((el) => _.get(el, ['questionType'], -1) == 4)

        const jumpStackQuestion = _.get(getters.stackQuestions, [idx])
        const jumpStackQuestionAnswer = _.find(
          state.userAnswers,
          (el) => el.stackQuestionId == _.get(jumpStackQuestion, ['id'], null)
        )

        // If jump to change patient position question and it is answered
        if (
          (_.get(jumpStackQuestion, ['questionType']) == 3 || _.get(jumpStackQuestion, ['questionType']) == 4) &&
          jumpStackQuestionAnswer
        ) {
          return
        } else if (lastChangePatientPositionQuestionBeforeJumpQuestion) {
          const answerOfQuestion = _.find(
            state.userAnswers,
            (el) => el.stackQuestionId == _.get(lastChangePatientPositionQuestionBeforeJumpQuestion, ['id'], null)
          )

          if (!answerOfQuestion) {
            // Notify the change patient position question isn't answered
            // Vue.notify({
            //   type: 'warning',
            //   text: 'Unable to jump to this question before answer the last change position question above it.',
            // })
            return
          }
        } else if (lastLocalizerQuestionBeforeJumpQuestion) {
          const answerOfQuestion = _.find(
            state.userAnswers,
            (el) => el.stackQuestionId == _.get(lastLocalizerQuestionBeforeJumpQuestion, ['id'], null)
          )

          if (!answerOfQuestion) {
            // Notify the localizer question isn't answered
            // Vue.notify({
            //   type: 'warning',
            //   text: 'Unable to jump to this question before answer the last localizer question above it.',
            // })
            return
          }
        }
      }

      if (getters.isAnsweredCurrentQuestion) {
        dispatch('handlePressedNextButton')
      }
      await dispatch('autoSetStackQuestionAnswerFromSelectionsIfModified', { isFromJumpToQuestion: true })
      if (config.isCTLab && !state.isEditingQuestion && !getters.isLocalizerQuestion) {
        await dispatch('saveCurrentAnswer')
      }
      commit('set', { selectedStackQuestionIndex: idx })

      const jumpStackQuestion = _.get(getters.stackQuestions, [idx])

      await dispatch('presetScanStatusWhenMoveToAnotherQuestion', idx)

      if (config.isCTLab && !state.isEditingQuestion) {
        const isJumpStackQuestionIsTimingDecision = jumpStackQuestion?.questionType == 5

        if (isJumpStackQuestionIsTimingDecision) {
          _.each(getters.answerDataCurrent, function (answerData, ident) {
            // since there are also name/id as keys in the answer, only do this for the idents
            let identType = _.last(_.split(ident, '_'))

            if (identType === 'proposed') {
              commit('set', {
                timingDecisionStep: _.get(answerData, ['timingDecisionStep'], 0),
                presentationTimingDecisionStep: _.get(answerData, ['presentationTimingDecisionStep'], 0),
                presentationPreviewTimingDecisionStep: _.get(answerData, ['presentationTimingDecisionStep'], 0),
                timingDecisionScanDelay: _.get(jumpStackQuestion, ['timingDecisionScanDelay'], 0),
                timingDecisionFlouroFrameRate: _.get(answerData, ['timingDecisionFlouroFrameRate'], 2),
                timingDecisionHUTriggerThreshold: _.get(answerData, ['timingDecisionHUTriggerThreshold'], 150),
                timingDecisionTriggerType: _.get(answerData, ['timingDecisionTriggerType'], HU_TRIGGER_TYPE.AUTOMATIC),
                roiStatus: _.get(answerData, ['roiStatus'], ROI_STATUS.NO_CONFIRM),
                scanStatus: _.get(answerData, ['scanStatus'], SCAN_STATUS.NO_SCAN),
                timingDecisionPointer: _.get(answerData, ['timingDecisionPointer'], {
                  x: 0,
                  y: 0,
                  radius: DEFAULT_ROI_RADIUS,
                  scaleX: 1,
                  scaleY: 1,
                  strokeWidth: DEFAULT_ROI_STROKE_WIDTH,
                  imageScale: 1,
                }),
              })
            }
          })
        }
      }
      if (!config.isCTLab && !state.isEditingQuestion) {
        commit('set', {
          activeTab: 0,
          isSelectedTab: !state.hasQuestionParamsBeenSeen[getters.stackQuestion.order],
        })
      }
    },
    async presetScanStatusWhenMoveToAnotherQuestion({ dispatch, state, getters, commit }, questionIndex) {
      // If we have confirmed stack config, set this config and continue
      if (config.isCTLab) {
        const confirmedStackConfig = await dispatch('stackService/getConfirmedStackConfig', questionIndex, {
          root: true,
        })
        const question = _.get(getters.stackQuestions, [questionIndex])
        // When jumb to acqisition question
        // Set scan delay time
        if (_.get(question, ['questionType']) == 1) {
          const savedScanDelayInfo = _.find(state.stackQuestionScanDelayInfos, (el) => el.questionId == question.id)
          // If already answered, show the saved/original scan delay instead of remaining countdown time
          if (getters.scanSubmittedByStackQuestionId[question.id]) {
            if (_.has(question, ['scanDelay'])) {
              commit('set', {
                scanDelay: _.get(question, ['scanDelay']),
              })
            } else if (savedScanDelayInfo) {
              commit('set', {
                scanDelay: _.get(savedScanDelayInfo, ['scanDelay'], 0),
              })
            } else {
              commit('set', {
                scanDelay: 0,
              })
            }
          }
          // If confirmed on first time, when isStartCountDownProcess = false
          else if (savedScanDelayInfo) {
            commit('set', {
              scanDelay: _.get(savedScanDelayInfo, ['scanDelay']),
            })
          }
          // If confirmed on second time, set in here
          else if (_.has(question, ['scanDelay'])) {
            commit('set', {
              scanDelay: _.get(question, ['scanDelay']),
            })
          } else {
            commit('set', {
              scanDelay: 0,
            })
          }
        }
        // Check if we have comfirmed stack config and not submit
        if (
          confirmedStackConfig &&
          question &&
          !state.isEditingQuestion &&
          !getters.scanSubmittedByStackQuestionId[question?.id]
        ) {
          dispatch('stackService/setConfigNameOfFirstSliceView', _.get(confirmedStackConfig, ['name'], ''), {
            root: true,
          })
          dispatch('stackService/presetConfirmedStackConfigToSliceView', questionIndex, { root: true })
          dispatch('setScanStatusForAnsweredQuestion')
        } else {
          dispatch('resetScanStatus')
        }

        // if question is localizer, set selected tab to parameter
        if (_.get(question, ['questionType']) == 3) {
          commit('set', {
            activeTab: 1,
          })
        } else if (confirmedStackConfig && question) {
          // Set selection config active tab to parameter tab
          commit('set', {
            activeTab: 1,
          })
        } else {
          // Set selection config active tab to Question criteria
          commit('set', {
            activeTab: 0,
            //isSelectedTab: true,
            isSelectedTab: !state.hasQuestionParamsBeenSeen[getters.stackQuestion.order],
          })
        }
      }
    },
    async saveCurrentAnswer({ commit, dispatch, getters, state }) {
      if (!config.isCTLab) {
        return
      }
      await dispatch(
        'selectionConfig/saveStackQuestionAnswerFromSelections',
        { answer: getters.answerDataCurrent },
        { root: true }
      )
      // This is needed to refresh the Save Test button on StackQuestionEdit
      // stackQuestion.answers = [...stackQuestion.answers]
      state.refresh_test_button = !state.refresh_test_button
      commit('set', {
        selectedStackQuestionIndex: state.selectedStackQuestionIndex,
      })
    },
    async copySelectionConfigForAdmin(
      { dispatch, getters, rootGetters, commit },
      { selectedCopyType, targetAnswer, targetStackQuestion, copyQuestionType }
    ) {
      if (copyQuestionType == ADMIN_COPY_QUESTION_TYPES.QUESTION_TEXT) {
        if (getters.stackQuestion) {
          getters.stackQuestion.questionText = targetStackQuestion.questionText
        }

        return
      } else if (copyQuestionType == ADMIN_COPY_QUESTION_TYPES.DEFAULT_VARIANTS) {
        if (getters.stackQuestion) {
          getters.stackQuestion.displayVariants = targetStackQuestion.displayVariants
          commit('set', { displayVariantSelectionId: null })
        }

        return
      } else if (copyQuestionType == ADMIN_COPY_QUESTION_TYPES.ANSWERS) {
        if (getters.stackQuestion) {
          getters.stackQuestion.answers = targetStackQuestion.answers
          commit('set', { answerSelectionId: null, answerVariantSelectionId: null })
        }

        return
      } else if (copyQuestionType == ADMIN_COPY_QUESTION_TYPES.EVERY_THINGS) {
        if (selectedCopyType == ADMIN_COPY_TYPE.QUESTION) {
          _.each(getters.stackQuestion, (value, key) => {
            if (key != 'id' && _.has(targetStackQuestion, [key])) {
              getters.stackQuestion[key] = targetStackQuestion[key]
            }
          })
          commit('set', { answerSelectionId: null, answerVariantSelectionId: null, displayVariantSelectionId: null })
        } else {
          _.each(getters.answerCurrent, (value, key) => {
            if (key != 'id' && _.has(targetAnswer, [key])) {
              getters.answerCurrent[key] = targetAnswer[key]
            }
          })
          dispatch(
            'selectionConfig/setSelectionsFromStackQuestionAnswer',
            { answer: getters.answerCurrent },
            { root: true }
          )
        }

        return
      }
      const currentConfigDatas = rootGetters['selectionConfig/selectionConfigsAsAnswerData']

      _.entries(currentConfigDatas).forEach(([key, currentConfigData]) => {
        const targetConfig = targetAnswer[key]
        if (!targetConfig) {
          return
        }
        if (copyQuestionType == ADMIN_COPY_QUESTION_TYPES.DEFAULTS) {
          if (key.endsWith('min') || key.endsWith('max')) {
            return
          }
        }

        if (copyQuestionType == ADMIN_COPY_QUESTION_TYPES.DEFAULTS) {
          dispatch(
            'selectionConfig/setSelectionFromAnswerData',
            {
              ident: key,
              answerData: targetConfig,
              invisible: false,
              overwriteSpacingThickness: true,
              overwriteFieldStrength: true,
            },
            { root: true }
          )
        } else if (copyQuestionType == ADMIN_COPY_QUESTION_TYPES.COVERAGE) {
          let configToCopy = _.pick(targetConfig, [
            'centerX',
            'centerY',
            'centerZ',
            'xDirectionX',
            'xDirectionY',
            'xDirectionZ',
            'yDirectionX',
            'yDirectionY',
            'yDirectionZ',
            'zDirectionX',
            'zDirectionY',
            'zDirectionZ',
            'dimensionX',
            'dimensionZ',
            'dimensionY',
            'thickness',
            'numberOfSlices',
            'spacing',
          ])
          configToCopy = {
            ...currentConfigData,
            ...configToCopy,
          }
          dispatch(
            'selectionConfig/setSelectionFromAnswerData',
            {
              ident: key,
              answerData: configToCopy,
              invisible: false,
              overwriteSpacingThickness: {
                thickness: configToCopy.thickness,
                spacing: configToCopy.spacing,
              },
              overwriteFieldStrength: true,
            },
            { root: true }
          )
        } else if (copyQuestionType == ADMIN_COPY_QUESTION_TYPES.ANGLE) {
          let configToCopy = _.pick(targetConfig, [
            'xDirectionX',
            'xDirectionY',
            'xDirectionZ',
            'yDirectionX',
            'yDirectionY',
            'yDirectionZ',
            'zDirectionX',
            'zDirectionY',
            'zDirectionZ',
          ])
          configToCopy = {
            ...currentConfigData,
            ...configToCopy,
          }
          dispatch(
            'selectionConfig/setSelectionFromAnswerData',
            {
              ident: key,
              answerData: configToCopy,
              invisible: false,
              overwriteSpacingThickness: false,
              overwriteFieldStrength: true,
            },
            { root: true }
          )
        } else if (copyQuestionType == ADMIN_COPY_QUESTION_TYPES.PARAMETERS) {
          let configToCopy = _.cloneDeep(targetConfig)
          const keys = [
            'centerX',
            'centerY',
            'centerZ',
            'xDirectionX',
            'xDirectionY',
            'xDirectionZ',
            'yDirectionX',
            'yDirectionY',
            'yDirectionZ',
            'zDirectionX',
            'zDirectionY',
            'zDirectionZ',
            'dimensionX',
            'dimensionZ',
            'dimensionY',
            'thickness',
            'numberOfSlices',
            'spacing',
          ]
          keys.forEach((key) => {
            _.unset(configToCopy, [key])
          })
          configToCopy = {
            ...currentConfigData,
            ...configToCopy,
          }
          dispatch(
            'selectionConfig/setSelectionFromAnswerData',
            {
              ident: key,
              answerData: configToCopy,
              invisible: false,
              overwriteSpacingThickness: false,
              overwriteFieldStrength: true,
            },
            { root: true }
          )
        }
      })

      dispatch('selectionConfig/update', null, { root: true })
    },
    async copySelectionConfigFromQuestionIndexAnswer(
      { getters, dispatch, rootState, rootGetters, commit, state },
      { questionIndex, stackConfig, copyQuestionType }
    ) {
      if (!config.isCTLab) {
        return
      }
      const questionToCopy = _.get(getters.stackQuestions, [questionIndex])
      if (_.isEqual(_.get(questionToCopy, ['id']), _.get(getters.stackQuestion, ['id']))) {
        return
      }

      // Acq question
      const configData = _.get(stackConfig, ['answerData'])
      if (!configData) {
        return
      }

      const ident = rootState.selectionConfig.selectionConfigCurrentIdent
      const currentConfigDatas = rootGetters['selectionConfig/selectionConfigsProposedAsAnswerData']
      const currentConfigData = _.get(currentConfigDatas, [ident])
      if (!currentConfigData) {
        return
      }

      // Set copy from to stackQuestion
      let { stackQuestion } = getters
      stackQuestion.copyFromQuestionIndex = questionIndex

      commit('set', {
        selectedStackQuestionIndex: state.selectedStackQuestionIndex,
        questionsVerticalMenuKey: state.questionsVerticalMenuKey + 1,
      })

      if (copyQuestionType == COPY_QUESTION_TYPES.EVERY_THINGS) {
        dispatch(
          'selectionConfig/setSelectionFromAnswerData',
          {
            ident: ident,
            answerData: configData,
            invisible: false,
            overwriteSpacingThickness: true,
            overwriteFieldStrength: true,
          },
          { root: true }
        )

        const sourceScanDelayValue = _.get(questionToCopy, ['scanDelay'], 0)
        if (sourceScanDelayValue == 0) {
          commit('set', { scanDelay: 0 })
        } else {
          commit('set', { scanDelay: Math.max(getters.minScanDelayOfCurrentStackQuestion, sourceScanDelayValue) })
        }
      } else if (copyQuestionType == COPY_QUESTION_TYPES.SLICE_THICKNESS) {
        if (_.has(configData, ['thickness'])) {
          dispatch('selectionConfig/adjustThickness', { thickness: _.get(configData, ['thickness']) }, { root: true })
        }
      } else if (copyQuestionType == COPY_QUESTION_TYPES.SLICE_THICKNESS_AND_WINDOW_AND_KERNEL) {
        let configToCopy = _.pick(configData, [
          'windowWidth',
          'windowLevel',
          'kernel',
          'thickness',
          'spacing',
          'dimensionZ',
        ])
        configToCopy = {
          ...currentConfigData,
          ...configToCopy,
        }
        dispatch(
          'selectionConfig/setSelectionFromAnswerData',
          {
            ident: ident,
            answerData: configToCopy,
            invisible: false,
            overwriteSpacingThickness: {
              thickness: configToCopy.thickness,
              spacing: configToCopy.spacing,
            },
            overwriteFieldStrength: true,
          },
          { root: true }
        )
      } else if (copyQuestionType == COPY_QUESTION_TYPES.SLICE_POSITION_AND_COVERAGE) {
        let configToCopy = _.pick(configData, [
          'centerX',
          'centerY',
          'centerZ',
          'xDirectionX',
          'xDirectionY',
          'xDirectionZ',
          'yDirectionX',
          'yDirectionY',
          'yDirectionZ',
          'zDirectionX',
          'zDirectionY',
          'zDirectionZ',
          'dimensionX',
          'dimensionZ',
          'dimensionY',
          'thickness',
          'numberOfSlices',
          'spacing',
        ])
        configToCopy = {
          ...currentConfigData,
          ...configToCopy,
        }
        dispatch(
          'selectionConfig/setSelectionFromAnswerData',
          {
            ident: rootState.selectionConfig.selectionConfigCurrentIdent,
            answerData: configToCopy,
            invisible: false,
            overwriteSpacingThickness: {
              thickness: configToCopy.thickness,
              spacing: configToCopy.spacing,
            },
            overwriteFieldStrength: true,
          },
          { root: true }
        )
      } else if (copyQuestionType == COPY_QUESTION_TYPES.PARAMETERS) {
        let configToCopy = _.cloneDeep(configData)
        const keys = [
          'centerX',
          'centerY',
          'centerZ',
          'xDirectionX',
          'xDirectionY',
          'xDirectionZ',
          'yDirectionX',
          'yDirectionY',
          'yDirectionZ',
          'zDirectionX',
          'zDirectionY',
          'zDirectionZ',
        ]
        keys.forEach((key) => {
          _.unset(configToCopy, [key])
        })
        configToCopy = {
          ...currentConfigData,
          ...configToCopy,
        }
        dispatch(
          'selectionConfig/setSelectionFromAnswerData',
          {
            ident: rootState.selectionConfig.selectionConfigCurrentIdent,
            answerData: configToCopy,
            invisible: false,
            overwriteSpacingThickness: false,
            overwriteFieldStrength: true,
          },
          { root: true }
        )
      } else if (copyQuestionType == COPY_QUESTION_TYPES.WINDOW_AND_KERNEL) {
        let configToCopy = _.pick(configData, ['windowWidth', 'windowLevel', 'kernel'])
        configToCopy = {
          ...currentConfigData,
          ...configToCopy,
        }
        dispatch(
          'selectionConfig/setSelectionFromAnswerData',
          {
            ident: ident,
            answerData: configToCopy,
            invisible: false,
            overwriteSpacingThickness: false,
            overwriteFieldStrength: true,
          },
          { root: true }
        )
      } else if (copyQuestionType == COPY_QUESTION_TYPES.FOV) {
        if (_.has(configData, ['dimensionY'])) {
          dispatch(
            'selectionConfig/adjustDimensions3XYByUser',
            { y: _.get(configData, ['dimensionY']) },
            { root: true }
          )
        }
      }
    },
    setAnswerSelectionId({ commit }, { answerSelectionId, answerVariantSelectionId }) {
      commit('set', { answerSelectionId, answerVariantSelectionId })
    },
    setDisplaySelectionId({ commit }, payload) {
      commit('set', { displayVariantSelectionId: payload })
    },
    onAnswersChanged({ state, getters, commit, rootState }) {
      log.debug('onAnswersChanged')
      // When no answer selection, or the selected answer is not one of the choices
      if (!state.answerSelectionId || !_.some(getters.answers, { id: state.answerSelectionId })) {
        let answer

        // Try to pick the user's preferred answer criteria for this StackQuestion
        let { preferredAnswerCriteriaByStackQuestionId } = rootState.testRunService
        let preferredAnswerCriteriaId = preferredAnswerCriteriaByStackQuestionId[getters.stackQuestion?.id]
        if (preferredAnswerCriteriaId) {
          answer = _.find(getters.answers, { id: preferredAnswerCriteriaId })
        }

        log.debug('current answer gone; restoring to preferred / default answer')
        if (!answer) {
          answer = _.find(getters.answers, 'default') || _.first(getters.answers)
        }
        commit('set', {
          answerSelectionId: _.get(answer, ['id']),
        })
      }
    },
    // Called in both Test Taking (View) and Admin (Edit) mode
    onAnswerCurrentChanged({ state, getters, dispatch }) {
      console.log('onAnswerCurrentChanged')
      if (getters.stackQuestion && getters.answerCurrent) {
        let { alterVolumeView, alterSpacingThickness } = getters.stackQuestion

        // true/false set it; null no-ops
        if (_.isBoolean(alterVolumeView)) {
          dispatch('selectionConfig/setIsVolumeViewMode', alterVolumeView, { root: true })
        }

        // Set all the proposed selections to their default initial values
        dispatch(
          'selectionConfig/revertInitialSelections',
          {
            // we want to try to keep Spacing+Thickness close to what they currently are when swapping answers/questions in non-edit (#520)
            // This is technically also called when initially loading into TestRun/etc, but it won't keep what's not there, so it's fine

            // Only keep in MR mode
            keepCurSpacingThickness: !state.isEditingQuestion && !alterSpacingThickness && !config.isCTLab,
          },
          { root: true }
        )
      }
    },
    // Called in both Test Taking (View) and Admin (Edit) mode
    onAnswerCurrentIsSingleSliceChanged({ getters, dispatch }) {
      if (getters.stackQuestion && getters.answerCurrentIsSingleSlice) {
        dispatch('selectionConfig/onSingleSliceModeActivated', {}, { root: true })
      } else {
        dispatch('selectionConfig/onSingleSliceModeDeActivated', {}, { root: true })
      }
    },
    onStackQuestionChanged({ getters, dispatch }) {
      if (getters.stackQuestion) {
        console.log('onStackQuestionChanged')
        dispatch('startTimer')
        dispatch('interactableService/onCurStackQuestionChanged', {}, { root: true })
        dispatch('setDisplaySelectionId', _.get(getters.stackQuestion, ['displayVariantSelectionId']))
      }
    },
    startTimer() {
      timer.reset()
      timer.start()
    },
    stopTimer() {
      timer.pause()
      return timer.getElapsedTimeISO()
    },
    // Store Scan answer for current QuestionSet being taken
    async submitScan({ commit, state, dispatch, getters, rootGetters }, { skipped }) {
      // User is not taking any test/questionSet right now, so no-op

      if (!state.questionSet) {
        return
      }

      const elapsedTime = await dispatch('stopTimer')
      await dispatch('selectionConfig/adjustElapsedTime', { elapsedTime }, { root: true })

      const sliceViews = await dispatch('selectionConfig/getCurrentSliceViewsAsImages', {}, { root: true })
      const answerConfigs = rootGetters['selectionConfig/selectionConfigsProposedList']

      if (config.isCTLab) {
        state.isSkippedAnswer = skipped
      }

      // Don't record when editing a question or if there is no score/etc
      if (!config.isCTLab && !state.isEditingQuestion && _.size(answerConfigs) >= 1) {
        const answer = {
          stackQuestionId: getters.stackQuestion.id,
          answerSelectionId: state.answerSelectionId,
          questionSetId: state.questionSet.id,
          sliceViews,
          // Persist the specifics of what the user answered, in the same format as the correct answer is in
          variables: answerConfigs,
          skipped,
        }
        _.remove(state.userAnswers, (a) => a.stackQuestionId === getters.stackQuestion.id)
        state.userAnswers.push(answer)

        await dispatch('testRunService/addAnswer', { answer, retryUntilSuccess: true }, { root: true })
        if (state.userAnswers.length < getters.stackQuestions.length) {
          commit('set', {
            activeTab: 3,
            isSelectedTab: true,
          })
          if (!config.isCTLab) {
            commit('set', {
              activeTab: 0,
              isSelectedTab: !state.hasQuestionParamsBeenSeen[getters.stackQuestion.order],
            })
          }
        }
        if (state.userAnswers.length >= getters.stackQuestions.length) {
          // Completed the QuestionSet portion of the test
          commit('set', { hasAnsweredAllStackQuestions: true })
          dispatch('selectionConfig/hideAll', {}, { root: true })
          dispatch('interactableService/hideAll', {}, { root: true })
        } else {
          if (!config.isCTLab) {
            dispatch('selectNextQuestion')
          }
        }
      }
    },
    async addAnswerInCTLabModeWhenMoveToNext({ getters, dispatch, commit, state, rootGetters }, { skipped }) {
      const answerConfigs = rootGetters['selectionConfig/selectionConfigsProposedList']

      if (config.isCTLab && !state.isEditingQuestion && _.size(answerConfigs) >= 1) {
        await onRenderMiddleSliceOfResultSliceView()
        const sliceViews = await dispatch('selectionConfig/getCurrentSliceViewsAsImages', {}, { root: true })

        if (config.isCTLab) {
          state.isSkippedAnswer = skipped
        }

        const answerViews = []
        // Only save position screen shot image in first stack question answer or change patient position answer
        if (state.selectedStackQuestionIndex == 0 || getters.isChangePatientPositionQuestion) {
          if (state.positionScreenshot) {
            answerViews.push({
              id: ANSWER_VIEWS_IMAGE_ID.POSITION_SCREENSHOT,
              src: state.positionScreenshot,
              width: '400px',
              height: '400px',
            })
          }
          if (state.injectorDoseScreenshot) {
            answerViews.push({
              id: ANSWER_VIEWS_IMAGE_ID.INJECTOR_DOSE_SCREENSHOT,
              src: state.injectorDoseScreenshot,
              width: '400px',
              height: '400px',
            })
          }
        }
        if (
          getters.isTimingDecisionQuestion &&
          !rootGetters['timingDecisionService/isSelectedSetDelayTimingDecision']
        ) {
          if (state.timingDecisionConfirmScreenshot) {
            answerViews.push({
              id: ANSWER_VIEWS_IMAGE_ID.TIMING_DECISION_CONFIRM_SCREENSHOT,
              src: state.timingDecisionConfirmScreenshot,
              width: '400px',
              height: '400px',
            })
          }
          if (state.timingDecisionROIScreenshot) {
            answerViews.push({
              id: ANSWER_VIEWS_IMAGE_ID.TIMING_DECISION_ROI_SCREENSHOT,
              src: state.timingDecisionROIScreenshot,
              width: '400px',
              height: '400px',
            })
          }

          const timingDecisionChartView = await dispatch(
            'selectionConfig/getCurrentTimingDecisionChartViewAsImage',
            {},
            { root: true }
          )

          if (timingDecisionChartView) {
            answerViews.push({
              id: ANSWER_VIEWS_IMAGE_ID.TIMING_DECISION_CHART_SCREENSHOT,
              src: timingDecisionChartView,
              width: '400px',
              height: '400px',
            })
          }
        }
        if (state.injectorScreenshot) {
          answerViews.push({
            id: ANSWER_VIEWS_IMAGE_ID.INJECTOR_SCREENSHOT,
            src: state.injectorScreenshot,
            width: '400px',
            height: '400px',
          })
        }

        // CTLab answer
        // Add images of patient position
        const answer = {
          stackQuestionId: getters.stackQuestion.id,
          answerSelectionId: state.answerSelectionId,
          questionSetId: state.questionSet.id,
          sliceViews,
          // Persist the specifics of what the user answered, in the same format as the correct answer is in
          variables: answerConfigs,
          skipped: state.isSkippedAnswer,
          answerViews,
        }

        _.remove(state.userAnswers, (a) => a.stackQuestionId === getters.stackQuestion.id)
        state.userAnswers.push(answer)

        // If user submit answer very fast, answer can be missed
        // if (state.userAnswers.length >= getters.stackQuestions.length) {
        //   await dispatch('testRunService/addAnswer', { answer, retryUntilSuccess: true }, { root: true })
        // } else {
        //   dispatch('testRunService/addAnswer', { answer, retryUntilSuccess: true }, { root: true })
        // }

        // We submit all answer after answer all questions
        if (state.userAnswers.length >= getters.stackQuestions.length) {
          const userAnswers = state.userAnswers
          // Asign timing decision data before submit
          try {
            userAnswers.forEach((el) => {
              const stackQuestion = getters.stackQuestions.find((q) => q.id == el.stackQuestionId)
              const isTimingDecision = stackQuestion && stackQuestion.questionType == 5
              if (isTimingDecision && el?.variables.length > 0) {
                // Asign data
                const timingDecisionBrightnessData = _.cloneDeep(state.timingDecisionBrightnessData)
                // timingDecisionBrightnessData.forEach((el) => {
                //   el.probeValues = []
                // })
                const isSelectedSetDelay = rootGetters['timingDecisionService/isSelectedSetDelayTimingDecision']
                const isSelectedTestBolus = rootGetters['timingDecisionService/isSelectedTestBolusTimingDecision']
                el.variables[0].timingDecisionInfo = {
                  timingDecisionHUTriggerThreshold: state.timingDecisionHUTriggerThreshold,
                  timingDecisionBrightnessData: timingDecisionBrightnessData,
                  timingDecisionFlouroFrameRate: state.timingDecisionFlouroFrameRate,
                  delayTimeFromTimingDecisionStartByQuestion: state.delayTimeFromTimingDecisionStartByQuestion,
                  visibleProbeNames: getters.visibleProbeNames,
                  isSelectedTestBolusTimingDecision: isSelectedTestBolus,
                  isSelectedBolusTrackingTimingDecision:
                    rootGetters['timingDecisionService/isSelectedBolusTrackingTimingDecision'],
                  isSelectedSetDelayTimingDecision: isSelectedSetDelay,
                  timingDecisionScanDelay: _.get(getters.firstTimingDecisionQuestion, ['timingDecisionScanDelay'], 0),
                  patientPhysioInfoStrokeVolume: getters.patientPhysioInfoStrokeVolume,
                  timingDecisionPointer: state.timingDecisionPointer,
                }

                // Set at top level of answer for backend to persist as user preference
                el.selectedTimingMethod = isSelectedSetDelay
                  ? 'SET_DELAY'
                  : isSelectedTestBolus
                  ? 'TEST_BOLUS'
                  : 'BOLUS_TRACKING'
              }

              // Retroactively add/replace injector screenshot for timing decision answers
              // with the screenshot captured at acquisition start (after breathing, before slices)
              if (isTimingDecision && state.injectorScreenshot) {
                if (!el.answerViews) el.answerViews = []
                const existingIdx = el.answerViews.findIndex((v) => v.id === ANSWER_VIEWS_IMAGE_ID.INJECTOR_SCREENSHOT)
                const screenshotEntry = {
                  id: ANSWER_VIEWS_IMAGE_ID.INJECTOR_SCREENSHOT,
                  src: state.injectorScreenshot,
                  width: '400px',
                  height: '400px',
                }
                if (existingIdx >= 0) {
                  el.answerViews[existingIdx] = screenshotEntry
                } else {
                  el.answerViews.push(screenshotEntry)
                }
              }
            })
          } catch (err) {
            console.log('err', err)
          }
          await dispatch(
            'testRunService/addMultiAnswers',
            { answers: userAnswers, retryUntilSuccess: true },
            { root: true }
          )
        }

        if (state.userAnswers.length < getters.stackQuestions.length) {
          commit('set', {
            activeTab: 3,
            isSelectedTab: true,
          })
        }
        if (state.userAnswers.length >= getters.stackQuestions.length) {
          // Completed the QuestionSet portion of the test
          commit('set', { hasAnsweredAllStackQuestions: true })
          dispatch('selectionConfig/hideAll', {}, { root: true })
        }
      }
    },
    proceedToTakingPostQuestions({ commit, state, dispatch, rootState }) {
      // Turn off reference lines, so they aren't still enabled on Test Results screen
      dispatch('selectionConfig/setShowReferenceLines', false, { root: true })

      // Exit fullscreen mode so the proceed transition is visible
      if (rootState.selectionConfig.isFullscreen) {
        dispatch('selectionConfig/exitFullscreen', { componentConfig: {} }, { root: true })
      }

      if (state.hasAnsweredAllStackQuestions) {
        // Are there any Post CTQs?
        if (_.size(state.criticalThinkingQuestions.postQuestions) === 0) {
          dispatch('submitTestRun')
        } else {
          // proceed to Post CTQs
          commit('set', { isViewingCriticalThinkingQuestion: true })
        }
      }
    },
    async submitTestRun({ commit, dispatch }) {
      commit('set', { isSubmitted: true })

      const testResult = await dispatch('testRunService/submitTest', {}, { root: true })

      LogRocket.track('TestResultSubmitted')

      commit('set', {
        testResult,
        isViewingCriticalThinkingQuestion: false,
        hasQuestionParamsBeenSeen: [],
      })
    },
    async resetTest({ commit }) {
      commit('set', {
        questionSet: null,
        selectedStackQuestionIndex: 0,
        answerSelectionId: null,
        userAnswers: [],
        testResult: null,
        criticalThinkingQuestions: {
          preQuestion: null,
          postQuestions: [],
        },
        criticalThinkingQuestionsPreview: {
          preQuestion: null,
          postQuestions: [],
        },
        criticalThinkingAnswers: [],
        isSubmitted: false,
        criticalThinkingQuestionIndex: 0,
        isSavingCriticalThinkingAnswer: false,
        testPatientGender: DEFAULT_PATIENT_GENDER,
        screeningFormConfigGender: null,
        screeningFormWeightMetric: 0,
        screeningFormConfigAge: null,
        shouldReloadDicomFileSet: false,
        hasQuestionParamsBeenSeen: [],
      })
    },
    async getScorePreview({ state, getters, rootState, rootGetters, commit }) {
      const isAnsweredCurrentQuestion = getters.isAnsweredCurrentQuestion
      let answerConfigs = rootGetters['selectionConfig/selectionConfigsProposedList']
      if (isAnsweredCurrentQuestion && config.isCTLab) {
        const currentAnswer = _.find(state.userAnswers, { stackQuestionId: getters.stackQuestion.id })
        if (currentAnswer && _.has(currentAnswer, ['variables'])) {
          answerConfigs = currentAnswer.variables
        }
      }
      const currentTest = rootGetters['testRunService/currentTest']

      if (!_.isEmpty(answerConfigs)) {
        // Caching when user's answerConfigs didn't change
        if (
          _.isEqual(answerConfigs, state.lastScorePreviewAnswer) &&
          _.isEqual(getters.stackQuestion.rubric, state.lastScorePreviewRubric)
        ) {
          return state.lastPreviewResult
        }

        if (config.isCTLab) {
          // need to ignore patient prep factors for ct stack quetions
          let ignoreFactors = [
            'injectionContrastValue',
            'injectionSalineValue',
            'isScanPositionRight',
            'landmarkDistanceRatio',
            'landmarkDistanceAP',
            'landmarkDistanceSI',
          ]

          if (state.testInjectionMode == INJECTION_MODE.CONTRAST_ONLY) {
            ignoreFactors.push('salineFlow')
          }

          ignoreFactors.forEach((factorName) => {
            if (_.has(getters.stackQuestion, ['rubric', 'factors', factorName])) {
              getters.stackQuestion.rubric.factors[factorName].ignore = true
            }
          })
        }

        const answer = {
          stackQuestionId: getters.stackQuestion.id,
          answerSelectionId: state.answerSelectionId,
          questionSetId: state.questionSet.id,
          variables: answerConfigs,
          rubric: getters.stackQuestion.rubric,
          testId: currentTest.id,
        }
        console.log('getting score preview', answer)

        // Store values before making network call to prevent making an additional network call until user makes a further change (even with slow internet)
        commit('set', {
          lastScorePreviewAnswer: _.cloneDeep(answerConfigs),
          lastScorePreviewRubric: _.cloneDeep(getters.stackQuestion.rubric),
        })

        let response = await apiPost(
          `/results/preview?isCTLab=${config.isCTLab ? 1 : 0}`,
          answer,
          rootState.authentication.accessToken
        )

        commit('set', {
          lastPreviewResult: response.data,
        })

        return response.data
      }
    },

    async getQuestionSetResultReview({ rootState }, { questionSetResultId, userId }) {
      const response = await apiGet(
        `results/review/questionSet/${questionSetResultId}?userId=${userId}`,
        rootState.authentication.accessToken
      )
      const out = response.data

      out.overall = out.questionSetResult.score
      out.questionSetResultId = questionSetResultId
      return out
    },

    async reportCriticalThinkingQuestion({ rootState }, { id, feedback, isCTLab }) {
      const response = await apiPost(
        `multipleChoiceQuestions/${id}/report`,
        { feedback, isCTLab },
        rootState.authentication.accessToken
      )
      const { success } = response.data

      if (success) {
        Vue.notify({ type: 'success', text: 'Sent your report successfully' })
      } else {
        Vue.notify({ type: 'error', text: 'Unable to send report for question' })
      }
    },
    async setIsPlaying({ commit }, payload) {
      commit('set', { isPlayingTheSlices: payload })
    },
    async setIsLoadingPlayingTheSlices({ commit }, payload) {
      commit('set', { isLoadingPlayingTheSlices: payload })
    },
    async setScanStatus({ commit }, payload) {
      commit('set', { scanStatus: payload })
    },
    async setIsNextStep({ commit }, payload) {
      commit('set', { canGoToNextStep: payload })
    },
    async setIsLoadingDataToPlaySlice({ commit }, payload) {
      commit('set', { isLoadingDataToPlaySlice: payload })
    },
    async setPatientDirectionSide1({ commit }, payload) {
      commit('set', { patientDirectionSide1: payload })
    },
    async setPatientDirectionSide2({ commit }, payload) {
      commit('set', { patientDirectionSide2: payload })
    },
    async setPatientDirectionSide3({ commit }, payload) {
      commit('set', { patientDirectionSide3: payload })
    },
    async setPositionScreenshot({ commit }, payload) {
      commit('set', { positionScreenshot: payload })
    },
    setInjectorDoseScreenshot({ commit }, payload) {
      commit('set', { injectorDoseScreenshot: payload })
    },
    async setMriMachineLanmarkedPosition({ commit }, { mriUpDownPositionY, mriInOutPositionZ }) {
      commit('set', { mriMachineLanmarkedPosition: { mriUpDownPositionY, mriInOutPositionZ } })
    },
    setMriMachineCurrentPosition({ commit }, { mriUpDownPositionY, mriInOutPositionZ }) {
      commit('set', { mriMachineCurrentPosition: { mriUpDownPositionY, mriInOutPositionZ } })
    },
    setInjectorScreenshot({ commit }, payload) {
      commit('set', { injectorScreenshot: payload })
    },
    setTimingDecisionConfirmScreenshot({ commit }, payload) {
      commit('set', { timingDecisionConfirmScreenshot: payload })
    },
    setTimingDecisionROIScreenshot({ commit }, payload) {
      commit('set', { timingDecisionROIScreenshot: payload })
    },
    setIsMovingMRIMachine({ commit }, payload) {
      commit('set', { isMovingMRIMachine: payload })
    },
    setIsMoveMRIMachineEnabled({ commit }, payload) {
      commit('set', { isMoveMRIMachineEnabled: payload })
    },
    setIsSubmittingAnswer({ commit }, payload) {
      commit('set', { isSubmittingAnswer: payload })
    },
    setIsMRIMachineMoved({ commit }, payload) {
      commit('set', { isMRIMachineMoved: payload })
    },
    // Used this action when preview test in profile
    setTestPatientModelId({ commit }, payload) {
      commit('set', { testPatientModelId: payload })
    },
    // Used this action when preview test in profile
    setTestPatientName({ commit }, payload) {
      commit('set', { testPatientName: payload })
    },
    // Used this action when preview test in profile
    setTestPatientFamilyMemberSignature({ commit }, payload) {
      commit('set', { testPatientFamilyMemberSignature: payload })
    },
    setIsLoadingScreeningFormPatientInfo({ commit }, payload) {
      commit('set', { isLoadingScreeningFormPatientInfo: payload })
    },
    setTestInjectorProtocol({ commit }, payload) {
      commit('set', { testInjectorProtocol: payload })
    },
    setTestInjectionMode({ commit, rootGetters }, payload) {
      commit('set', { testInjectionMode: payload })
      if (payload == INJECTION_MODE.CONTRAST_ONLY) {
        commit('set', { testInjectorProtocol: rootGetters['user/defaultContrastOnlyProtocol'] })
      } else {
        commit('set', { testInjectorProtocol: rootGetters['user/defaultContrastAndSalineProtocol'] })
      }
    },
    setTestInjectCondition({ commit }, payload) {
      commit('set', { testInjectCondition: payload })
    },
    setScanDelay({ commit }, payload) {
      commit('set', { scanDelay: payload })
    },
    setIsPlayingMusic({ commit }, payload) {
      commit('set', { isPlayingMusic: payload })
    },
    setActiveTab({ commit, getters, state }, payload) {
      if (payload == 1) {
        state.hasQuestionParamsBeenSeen[getters.stackQuestion.order] = true
      }
      commit('set', { activeTab: payload })
    },
    setInjectionRunningSpeed({ commit }, payload) {
      commit('set', { injectionRunningSpeed: payload })
    },
    setIsStartCountDownProcess({ commit }, payload) {
      commit('set', { isStartCountDownProcess: payload })
    },
    setRoiStatus({ commit }, payload) {
      commit('set', { roiStatus: payload })
      if (payload == ROI_STATUS.RUNNING) {
        commit('set', { timingDecisionStartTime: Date.now() })
      }
    },
    setTimingDecisionStartTime({ commit }) {
      commit('set', { timingDecisionStartTime: Date.now() })
    },
    captureDelayTimeFromTimingDecisionStart({ commit, state, rootState }, payload) {
      const questionIndex = payload.questionIndex
      if (_.isNil(questionIndex)) {
        return
      }

      const existing = state.delayTimeFromTimingDecisionStartByQuestion[questionIndex] || {}
      const merged = { ...existing, ...payload }

      if (existing.start != null && payload.start != null) {
        merged.start = Math.min(existing.start, payload.start)
      }
      if (existing.end != null && payload.end != null) {
        merged.end = Math.max(existing.end, payload.end)
      }

      const scanDurationCandidate =
        payload.scanDuration ??
        existing.scanDuration ??
        _.get(rootState, ['stackService', 'scanDurationOfConfig'], null) ??
        _.get(rootState, ['selectionConfig', 'scanDuration'], null)
      const parsedScanDuration = parseFloat(scanDurationCandidate)
      if (Number.isFinite(parsedScanDuration) && parsedScanDuration > 0) {
        merged.scanDuration = parsedScanDuration
      }

      const delayTimeFromTimingDecisionStartByQuestion = {
        ...state.delayTimeFromTimingDecisionStartByQuestion,
        [questionIndex]: merged,
      }

      commit('set', { delayTimeFromTimingDecisionStartByQuestion })
    },
    adjustTimingDecisionStep({ commit, state }, payload) {
      let value = state.timingDecisionStep + payload
      if (value > NUM_OF_BODY_MAP_IMAGES - 1) {
        value = NUM_OF_BODY_MAP_IMAGES - 1
      } else if (value < 0) {
        value = 0
      }
      commit('set', {
        timingDecisionStep: value,
        presentationTimingDecisionStep: 0,
        presentationPreviewTimingDecisionStep: 0,
      })
    },
    setTimingDecisionStep({ commit }, payload) {
      let value = payload
      if (value > NUM_OF_BODY_MAP_IMAGES - 1) {
        value = NUM_OF_BODY_MAP_IMAGES - 1
      } else if (value < 0) {
        value = 0
      }
      commit('set', {
        timingDecisionStep: value,
        presentationTimingDecisionStep: 0,
        presentationPreviewTimingDecisionStep: 0,
      })
    },
    setPresentationTimingDecisionStep({ commit }, payload) {
      let value = payload
      if (value > TIMING_DECISION_MAX_PRESENTATION_STEP - 1) {
        value = TIMING_DECISION_MAX_PRESENTATION_STEP - 1
      } else if (value < 0) {
        value = 0
      }
      commit('set', { presentationTimingDecisionStep: value, presentationPreviewTimingDecisionStep: value })
    },
    setPresentationPreviewTimingDecisionStep({ commit, state }, payload) {
      let value = payload
      if (value > state.presentationTimingDecisionStep) {
        value = state.presentationTimingDecisionStep
      } else if (value < 0) {
        value = 0
      }
      commit('set', { presentationPreviewTimingDecisionStep: value })
    },
    setTimingDecisionScanDelay({ commit }, payload) {
      commit('set', { timingDecisionScanDelay: payload })
    },
    setTimingDecisionFlouroFrameRate({ commit }, payload) {
      commit('set', { timingDecisionFlouroFrameRate: payload })
    },
    setTimingDecisionHUTriggerThreshold({ commit }, payload) {
      commit('set', { timingDecisionHUTriggerThreshold: payload })
    },
    setTimingDecisionTriggerType({ commit }, payload) {
      commit('set', { timingDecisionTriggerType: payload })
    },
    setTimingDecisionBrightnessData({ commit }, payload) {
      commit('set', { timingDecisionBrightnessData: payload })
    },
    addTimingDecisionBrightnessData({ commit, state }, payload) {
      const clone = _.cloneDeep(state.timingDecisionBrightnessData)
      const data = clone.find((el) => el.label == payload.label)
      if (data) {
        data.value = payload.value
        data.probeValues = payload.probeValues || []
      } else {
        clone.push({
          label: payload.label,
          value: payload.value,
          order: +payload.label,
          probeValues: payload.probeValues || [],
        })
      }
      _.orderBy(clone, ['order'])
      commit('set', { timingDecisionBrightnessData: clone })
    },
    addMultitpleTimingDecisionBrightnessData({ commit, state }, payload) {
      const clone = _.cloneDeep(state.timingDecisionBrightnessData)
      payload.forEach((el) => {
        const data = clone.find((o) => o.label == el.label)
        if (!data) {
          clone.push({
            label: el.label,
            value: el.value,
            order: +el.label,
            probeValues: el.probeValues || [],
          })
        }
      })
      _.orderBy(clone, ['order'])
      commit('set', { timingDecisionBrightnessData: clone })
    },
    setCurrentCriticalThinkingQuestionSelectedAnswer({ commit }, payload) {
      commit('set', { currentCriticalThinkingQuestionSelectedAnswer: payload })
    },
    setTimingDecisionPointer({ commit, state }, payload) {
      const existing = state.timingDecisionPointer || {}
      const safePointer = {
        x: _.get(payload, 'x', existing.x || 0),
        y: _.get(payload, 'y', existing.y || 0),
        radius: _.get(payload, 'radius', existing.radius || DEFAULT_ROI_RADIUS),
        scaleX: _.get(payload, 'scaleX', existing.scaleX || 1),
        scaleY: _.get(payload, 'scaleY', existing.scaleY || 1),
        strokeWidth: _.get(payload, 'strokeWidth', existing.strokeWidth || DEFAULT_ROI_STROKE_WIDTH),
        imageScale: _.get(payload, 'imageScale', existing.imageScale || 1),
      }
      commit('set', { timingDecisionPointer: safePointer })
    },
    setIsConfirmedLocalizerQuestion({ commit }, payload) {
      commit('set', { isConfirmedLocalizerQuestion: payload })
    },
  },
  getters: {
    minScanDelayOfCurrentStackQuestion(state, getters) {
      if (getters.lastAcquisitionQuestionStackQuestionId) {
        const question = getters.stackQuestions.find((el) => el.id == getters.lastAcquisitionQuestionStackQuestionId)

        return Math.round((_.get(question, ['scanDelay'], 0) + _.get(question, ['scanDuration'], 0)) * 10) / 10
      }

      return 0
    },
    questionSetBodyPartName(state) {
      return _.get(state.questionSet, ['bodyPart', 'name'], '')
    },
    questionSetBodyPartTypeId(state) {
      let typeId = null
      const bodyPart = _.get(state.questionSet, ['bodyPart'], {})
      const typeItem = _.find(BODY_PART_TYPES, (el) => _.get(bodyPart, ['contrastTypes', el.id]))
      if (typeItem) {
        typeId = typeItem.id
      }

      return typeId
    },
    questionSetBodyPartTypeName(state) {
      let type = ''
      const bodyPart = _.get(state.questionSet, ['bodyPart'], {})
      const typeItem = _.find(BODY_PART_TYPES, (el) => _.get(bodyPart, ['contrastTypes', el.id]))
      if (typeItem) {
        type = typeItem.name
      }

      return type
    },
    questionSetBodyPartId(state) {
      return _.get(state.questionSet, ['bodyPart', 'id'], null)
    },
    firstPatientPositionSet(state, getters) {
      const group = _.groupBy(getters.listPatientPositionsMapBodyBox, 'positionSetId')
      const keys = Object.keys(group)

      if (keys.length > 0) {
        return group[keys[0]]
      } else {
        return []
      }
    },
    listPatientPositionsMapBodyBox(state) {
      return _.cloneDeep(state.listPatientPositionsByBodyPartId).map((el) => {
        el.bodyBox = el.bodyBoxes[0] ?? null
        delete el.bodyBoxes
        return el
      })
    },
    listPatientPositionsAndBodyBox(state, getters, rootState) {
      const availablePositionOfDicomFileSet = _.get(rootState.dicomService.dicomFileSet, ['availablePositions'], null)
      const fileterPositions = (positions) => {
        return positions.filter(
          (el) =>
            !availablePositionOfDicomFileSet ||
            _.some(
              availablePositionOfDicomFileSet,
              (pos) =>
                pos.value.includes(el.value[0]) &&
                pos.value.includes(el.value[1]) &&
                pos.value.includes(el.value[2]) &&
                !!pos.isShowHeadHolder == !!el.isShowHeadHolder
            )
        )
      }
      if (getters.lastChangePatientPositionQuestion) {
        const positionSetId = _.get(getters.lastChangePatientPositionQuestion, ['positionSetId'], null)
        if (_.isNil(positionSetId)) {
          return fileterPositions(getters.firstPatientPositionSet)
        } else {
          return fileterPositions(
            getters.listPatientPositionsMapBodyBox.filter((el) => el.positionSetId == positionSetId)
          )
        }
      } else {
        return fileterPositions(getters.firstPatientPositionSet)
      }
    },
    patientPositionsHaveAnyBodyBoxes(state, getters) {
      return (
        getters.listPatientPositionsAndBodyBox.length > 0 &&
        _.some(getters.listPatientPositionsAndBodyBox, (el) => el.bodyBox != null)
      )
    },
    currentBodyPartId(state) {
      return state.questionSet?.bodyPartId || null
    },
    // StackQuestions sorted by order
    stackQuestions(state) {
      let stackQuestions = _.get(state.questionSet, ['stackQuestions']) || []
      // first sort them by the order they wish to be in
      stackQuestions = _.sortBy(stackQuestions, 'order')
      // then on the effective list of stackQuestions, have their order be their index in the array
      // this has the benefit of keeping the order proper 0 ... N -1
      return _.map(stackQuestions, function (stackQuestion, index) {
        // DANGER - must modify the existing object instead of creating a new one, else the following will break:
        //  1) AnswerModified will always return true for an Added Question, making saving impossible
        //  2) Adding Answers won't work (won't actually add the answer)
        return Object.assign(stackQuestion, {
          order: index,
        })
      })
    },
    hasLocalizerQuestion(state, getters) {
      let output = false
      for (let q of getters.stackQuestions) {
        if (q.questionType == 3) {
          output = true
          break
        }
      }
      return output
    },
    lastChangePatientPositionQuestion(state, getters) {
      if (state.selectedStackQuestionIndex > 0) {
        return _.reverse(_.cloneDeep(getters.stackQuestions.slice(0, state.selectedStackQuestionIndex + 1))).find(
          (el) => _.get(el, 'questionType') === 4
        )
      } else {
        return null
      }
    },
    lastAcquisitionQuestionStackQuestionId(state, getters) {
      if (state.selectedStackQuestionIndex > 0) {
        return _.get(
          _.reverse(_.cloneDeep(getters.stackQuestions.slice(0, state.selectedStackQuestionIndex))).find(
            (el) => _.get(el, 'questionType') === 1
          ),
          'id',
          null
        )
      } else {
        return null
      }
    },
    isFirstPostContrastQuestion(state, getters) {
      if (state.selectedStackQuestionIndex > 0) {
        const index = _.cloneDeep(getters.stackQuestions.slice(0, state.selectedStackQuestionIndex)).findIndex(
          (el) => _.get(el, 'questionType') === 1 && _.get(el, 'postContrast')
        )
        return (index < 0 || index === state.selectedStackQuestionIndex) && getters.isPostContrastQuestion
      } else {
        return true
      }
    },
    lastAcquisitionQuestionUserAnswer(state, getters) {
      return _.find(state.userAnswers, (el) => el.stackQuestionId == getters.lastAcquisitionQuestionStackQuestionId)
    },
    isAnsweredCurrentQuestion(state, getters) {
      return (
        _.get(getters.stackQuestion, ['id'], null) &&
        !!_.find(state.userAnswers, (el) => el.stackQuestionId == _.get(getters.stackQuestion, ['id'], null))
      )
    },
    prevStackQuestion(state, getters) {
      if (state.selectedStackQuestionIndex > 0) {
        return _.get(getters.stackQuestions, [state.selectedStackQuestionIndex - 1])
      } else {
        return null
      }
    },
    nextStackQuestion(state, getters) {
      if (state.selectedStackQuestionIndex < getters.stackQuestions.length - 1) {
        return _.get(getters.stackQuestions, [state.selectedStackQuestionIndex + 1])
      } else {
        return null
      }
    },
    isHideSetDelay(state, getters) {
      const timingQuestion = getters.stackQuestions.find((el) => _.get(el, ['questionType'], -1) == 5)
      if (timingQuestion) {
        return _.get(timingQuestion, 'hideSetDelay', false)
      } else {
        return false
      }
    },
    isNextStackQuestionIsAcqisition(state, getters) {
      return _.get(getters.nextStackQuestion, 'questionType') === 1
    },
    isNextStackQuestionIsReconstruction(state, getters) {
      return _.get(getters.nextStackQuestion, 'questionType') === 2
    },
    isPrevStackQuestionIsTimingDecision(state, getters) {
      return _.get(getters.prevStackQuestion, 'questionType') === 5
    },
    firstTimingDecisionQuestionIndex(state, getters) {
      return getters.stackQuestions.findIndex((el) => _.get(el, ['questionType'], -1) == 5)
    },
    isPrevStackQuestionsHasTimingDecisionQuestion(state, getters) {
      const timingQuestionIndex = getters.stackQuestions.findIndex((el) => _.get(el, ['questionType'], -1) == 5)
      return timingQuestionIndex != -1 && timingQuestionIndex < state.selectedStackQuestionIndex
    },
    isFromTimingDecisionToCurrentIsAllAcq(state, getters) {
      const timingQuestionIndex = getters.stackQuestions.findIndex((el) => _.get(el, ['questionType'], -1) == 5)
      if (timingQuestionIndex == -1 || state.selectedStackQuestionIndex <= timingQuestionIndex) {
        return false
      } else {
        const questions = _.filter(
          getters.stackQuestions,
          (el, index) => index > timingQuestionIndex && index < state.selectedStackQuestionIndex
        )
        return !_.some(questions, (el) => el?.questionType != 1)
      }
    },
    isPrevStackQuestionIsSubmitted(state, getters) {
      return !getters.prevStackQuestion || getters.scanSubmittedByStackQuestionId[getters.prevStackQuestion.id]
    },
    isQuestionSetNoReconQuestion(state, getters) {
      return !_.some(getters.stackQuestions, (el) => _.get(el, ['questionType']) === 2)
    },
    isQuestionSetHasTimingDecisionQuestion(state, getters) {
      return _.some(getters.stackQuestions, (el) => _.get(el, ['questionType']) === 5)
    },
    canBeChosenReconstructionQuestion(state, getters) {
      if (!getters.prevStackQuestion) {
        return false
      } else if (getters.prevStackQuestion && getters.prevStackQuestion.questionType == 3) {
        return false
      } else {
        return true
      }
    },
    canBeChosenAcquisitionQuestion(state, getters) {
      console.warn(state) //bypass no-use-var lint issue
      if (getters.prevStackQuestion) {
        return true
      } else {
        return false
      }
    },
    canBeChosenLocalizerQuestion(state, getters) {
      console.warn(state, getters) //bypass no-use-var lint issue
      // if (!getters.prevStackQuestion) {
      //   return true
      // } else {
      //   return false
      // }
      return true
    },
    canBeChosenChangePatientPositionQuestion(state) {
      if (state.selectedStackQuestionIndex > 0) {
        return true
      } else {
        return false
      }
    },
    stackQuestion(state, getters) {
      return _.get(getters.stackQuestions, [state.selectedStackQuestionIndex])
    },
    firstTimingDecisionQuestion(state, getters) {
      return getters.stackQuestions.find((el) => el.questionType == 5)
    },
    sameKindAnsweredQuestionWithStackQuestion(state, getters) {
      return _.filter(
        getters.stackQuestions,
        (el) =>
          _.get(getters.stackQuestion, ['questionType']) == _.get(el, ['questionType']) &&
          _.find(state.userAnswers, (a) => a.stackQuestionId === el.id)
      )
    },
    isAcquisitionQuestion(state, getters) {
      return _.get(getters.stackQuestion, 'questionType') === 1
    },
    isReconstructionQuestion(state, getters) {
      return _.get(getters.stackQuestion, 'questionType') === 2
    },
    isLocalizerQuestion(state, getters) {
      return _.get(getters.stackQuestion, 'questionType') === 3
    },
    isChangePatientPositionQuestion(state, getters) {
      return _.get(getters.stackQuestion, 'questionType') === 4
    },
    isTimingDecisionQuestion(state, getters) {
      return _.get(getters.stackQuestion, 'questionType') === 5
    },
    isCardiacAcquisitionQuestion(state, getters) {
      return _.get(getters.stackQuestion, 'questionType') === 6
    },
    isPostContrastQuestion(state, getters) {
      return getters.isAcquisitionQuestion && _.get(getters.stackQuestion, 'postContrast') === true
    },
    selectedStackQuestionIndexVisual(state) {
      return state.selectedStackQuestionIndex + 1
    },
    stackQuestionsLength(state, getters) {
      return getters.stackQuestions.length
    },
    answerVariantSelections(state, getters) {
      const defaultVariantList = [
        {
          text: 'Default',
          value: null,
        },
      ]

      const variants = _.map(getters.answerVariants, (variant, i) => {
        return {
          text: variant.name || `Variant ${i + 1}`,
          value: variant.id,
        }
      })

      return [...defaultVariantList, ...variants]
    },
    displayVariantCurrent(state, getters) {
      let variants = getters.displayVariants
      return _.find(variants, { id: state.displayVariantSelectionId })
    },
    // Proposed answer data in here
    displayDataCurrent(state, getters) {
      return getters.displayVariantCurrent || getters.answerDataCurrent
    },
    displayVariants(state, getters) {
      return _.get(getters.stackQuestion, 'displayVariants', [])
    },
    displayVariantSelections(state, getters) {
      const defaultVariantList = [
        {
          text: 'Default',
          value: null,
        },
      ]

      const variants = _.map(getters.displayVariants, (variant, i) => {
        return {
          text: variant.name || `Variant ${i + 1}`,
          value: variant.id,
        }
      })

      return state.isEditingQuestion ? [...defaultVariantList, ...variants] : [...variants]
    },
    answerVariants(state, getters) {
      console.log('answerVariants', getters.answerCurrent)
      if (getters.answerCurrent) {
        if (!getters.answerCurrent.variants) {
          getters.answerCurrent.variants = []
        }
        return getters.answerCurrent.variants
      } else {
        return []
      }
    },
    answerVariantCurrent(state, getters) {
      console.log('answerVariantCurrent')
      let variants = _.get(getters.answerCurrent, 'variants')
      return _.find(variants, { id: state.answerVariantSelectionId })
    },
    answerDataCurrent(state, getters) {
      return getters.answerVariantCurrent || getters.answerCurrent
    },
    answerDataCurrentHasSelectionConfigData(state, getters) {
      if (!getters.answerDataCurrent) {
        return true
      } else {
        const keys = Object.keys(getters.answerDataCurrent)

        return _.some(keys, (key) => key.includes('_max') || key.includes('_min') || key.includes('proposed'))
      }
    },
    answersSelections(state, getters) {
      return _.map(getters.stackQuestion.answers, function (answer, i) {
        return {
          value: answer.id,
          text: answer.name || `Answer ${i + 1}`,
        }
      })
    },
    answers(state, getters) {
      return _.get(getters.stackQuestion, 'answers')
    },
    refreshTestButton(state) {
      return state.refresh_test_button
    },
    answerCurrent(state, getters) {
      let answers = _.get(getters.stackQuestion, 'answers')
      console.log('answerCurrent', answers)
      let answer = _.find(answers, { id: state.answerSelectionId })
      log.debug('answerCurrent refresh', state.answerSelectionId, answer)
      if (answer) {
        return answer
      } else {
        if (getters.stackQuestion) {
          console.warn(
            'getters.stackQuestion.answers / answerSelectionId mismatch',
            getters.stackQuestion,
            state.answerSelectionId
          )
        }
        return _.first(answers)
      }
    },
    answerCurrentIsSingleSlice(state, getters) {
      return _.get(getters.answerCurrent, 'isSingleSlice')
    },
    // check if min/max/proposed on answer has been changed (maybe name, too?)
    answerCurrentHasBeenModified(state, getters, rootState, rootGetters) {
      if (!state.isEditingQuestion) {
        // if taking a test, this is irrelevant
        return false
      }

      let selectionConfigsAsAnswerData = rootGetters['selectionConfig/selectionConfigsAsAnswerData']
      // Rename name/id properties from this so we can ensure they have the same amount of keys/idents/groups
      let answerCurrent = trimNonIdentsFromAnswer(getters.answerDataCurrent)
      if (getters.displayVariantCurrent) {
        answerCurrent = trimNonIdentsFromAnswer({ ...getters.answerDataCurrent, ...getters.displayDataCurrent })
      }
      // Different amount of idents/groups (added, or removed)
      if (_.size(answerCurrent) !== _.size(selectionConfigsAsAnswerData)) {
        return true
      }

      const invalidKeys = ['selectionConfigToAnswerData']
      // we don't care about the zDirection
      const ignoreIdentKeys = ['isCTLab', 'lostWindowFocus', 'zDirectionX', 'zDirectionY', 'zDirectionZ']
      if (!config.isCTLab) {
        ignoreIdentKeys.push('zDirectionX', 'zDirectionY', 'zDirectionZ')
      }
      const removeIgnoredKeys = (obj, keys) => {
        const newObj = {}
        for (const key in obj) {
          // eslint-disable-next-line no-prototype-builtins
          if (obj.hasOwnProperty(key) && !keys.includes(key)) {
            newObj[key] = obj[key]
          }
        }
        return newObj
      }
      return _.some(_.keys(answerCurrent), function (ident) {
        invalidKeys.forEach((invalidKey) => {
          delete selectionConfigsAsAnswerData[ident][invalidKey]
          delete answerCurrent[ident][invalidKey]
        })
        const filteredObj1 = removeIgnoredKeys(selectionConfigsAsAnswerData[ident], ignoreIdentKeys)
        const filteredObj2 = removeIgnoredKeys(answerCurrent[ident], ignoreIdentKeys)
        const differentKeys = []
        const allKeys = new Set([...Object.keys(filteredObj1), ...Object.keys(filteredObj2)])
        // Lodash isEqual don't return the right result for nested objects
        allKeys.forEach((key) => {
          if (!_.isEqual(filteredObj1[key], filteredObj2[key]) && !ignoreIdentKeys.includes(key)) {
            differentKeys.push(key)
          }
        })
        return differentKeys.length > 0
      })
    },

    // which StackQuestions were already answered by the user as part of the current testRun
    scanSubmittedByStackQuestionId(state) {
      let output = {}
      _.each(state.userAnswers, function ({ stackQuestionId }) {
        output[stackQuestionId] = true
      })
      return output
    },
    scanSubmitted(getters) {
      if (getters.stackQuestion) {
        return getters.scanSubmittedByStackQuestionId[getters.stackQuestion.id]
      } else {
        // Not taking an exam, scan will never be submitted
        return false
      }
    },

    isTestComplete(state) {
      return !!state.testResult
    },
    // Structure example:
    // {questionSetResult: {score: "0.00"}, stackQuestionResults: [{
    //  "attemptedAnswerIdentifier": "3d89425d-7f76-446a-b648-8c7285c652b2",
    //  "score": "0.00",
    //  "stackQuestionId": 29
    //  stackQuestion: {questionText: ...}
    //  correctAnswer: {name: "AnswerName", min: {xDirectionX,...}, max: {...}}
    //  givenAnswer: {name: "AnswerName", min: {xDirectionX,...}, max: {...}}
    // }]}
    testResultAugmented(state, getters) {
      if (!getters.isTestComplete) {
        return null
      }
      let out = Object.assign({}, state.testResult, {
        bodyPartId: state.questionSet?.bodyPartId || 1,
      })
      out.stackQuestionResults = _.map(state.testResult.stackQuestionResults, function (stackQuestionResult) {
        let stackQuestion = _.find(getters.stackQuestions, { id: stackQuestionResult.stackQuestionId })
        let correctAnswer = _.find(stackQuestion?.answers || [], { id: stackQuestionResult.attemptedAnswerIdentifier })
        let givenAnswer = _.find(state.userAnswers, {
          answerSelectionId: stackQuestionResult.attemptedAnswerIdentifier,
        })

        return {
          ...stackQuestionResult,
          stackQuestion,
          correctAnswer,
          givenAnswer,
        }
      })
      out.overall = _.round(
        _.meanBy(out.stackQuestionResults, (val) => new Number(val.score)),
        2
      )
      return out
    },

    difficultyChoices() {
      return _.map(_.range(1, 6), function (val) {
        return { val, name: val }
      })
    },
    criticalThinkingQuestionsPostQuestionsCount(state) {
      return _.size(_.get(state.criticalThinkingQuestions, 'postQuestions'))
    },
    testModel(state) {
      return _.find(state.listModels, (e) => e.id == state.testPatientModelId)
    },
    testModelFileName(state) {
      //return state.testPatientGender == 'male' ? 'Man.glb' : 'Woman.glb'
      return _.get(
        _.find(state.listModels, (e) => e.id == state.testPatientModelId),
        ['fileName'],
        ''
      )
    },
    timingDecisionSecondsWithMaxBrightness(state, getters, rootState) {
      const timingQuestion = getters.stackQuestions.find((el) => _.get(el, ['questionType'], -1) == 5)
      if (!timingQuestion) {
        return 10000
      } else {
        if (getters.scanSubmittedByStackQuestionId[timingQuestion.id]) {
          const delayTimeFromStartTimingDecisionTimeToPressInjectButton =
            rootState.timingDecisionService.delayTimeFromStartTimingDecisionTimeToPressInjectButton
          const maxBrightnessInfo = _.maxBy(state.timingDecisionBrightnessData, 'value')
          return Math.max(
            +_.get(maxBrightnessInfo, ['label'], 0) - delayTimeFromStartTimingDecisionTimeToPressInjectButton,
            0
          )
        } else {
          return 10000
        }
      }
    },
    patientPhysioInfo(state) {
      return _.get(state, ['patientPhysioInfo'], {})
    },
    patientPhysioInfoProfileName(state) {
      return _.get(state, ['patientPhysioInfo', 'name'], '')
    },
    patientPhysioInfoRespiratoryCycleDuration(state) {
      return _.get(state, ['patientPhysioInfo', 'respiratoryCycleDuration'], 4000)
    },
    patientPhysioInfoCardiacCycleDuration(state) {
      return _.get(state, ['patientPhysioInfo', 'cardiacLevel', 'cardiacCycleDuration'], DEFAULT_CARDIAC_CYCLE_DURATION)
    },
    patientPhysioInfoCardiacLevelName(state) {
      const cardiacLevelName = CARDIAC_LEVEL_OPTIONS.find(
        (e) => e.value == _.get(state, ['patientPhysioInfo', 'cardiacLevel', 'levelType'], '')
      )?.text
      return cardiacLevelName || ''
    },
    patientPhysioInfoStrokeVolume(state) {
      return _.get(state, ['patientPhysioInfo', 'strokeVol'], 40)
    },
    visibleProbeNames(state, getters, rootState) {
      const selectedMRIScanDirection = rootState.selectionConfig.selectedMRIScanDirection
      let selectedQuestionProbe = _.find(
        _.get(state, ['questionSet', 'bodyPart', 'questionProbes'], []),
        (el) => el.scanDirection == selectedMRIScanDirection
      )
      if (!selectedQuestionProbe) {
        selectedQuestionProbe = _.find(
          _.get(state, ['questionSet', 'bodyPart', 'base', 'questionProbes'], []),
          (el) => el.scanDirection == selectedMRIScanDirection
        )
      }
      return _.get(selectedQuestionProbe, ['visibleProbes'], [])
        .filter((el) => el.visible)
        .map((el) => el.name)
    },
    isCTAQuestionSet(state) {
      const bodyPartname = _.get(state, ['questionSet', 'bodyPart', 'name'], '').toLowerCase()
      return bodyPartname.includes('cta')
    },
    bodyPartPhantom(state) {
      const regionName = _.get(state, ['questionSet', 'bodyPart', 'region', 'name'], '').toLowerCase()
      // const isAbdomenOrPelvisOrChest =
      //   regionName.includes('abdomen') ||
      //   regionName.includes('pelvis') ||
      //   regionName.includes('thorax') ||
      //   regionName.includes('cardiac') ||
      //   regionName.includes('body combined') ||
      //   regionName.includes('chest')

      // const isThighs = false

      // const isHeadOrLowerLegOrArms =
      //   regionName.includes('head') ||
      //   regionName.includes('upper extremities') ||
      //   regionName.includes('lower extremities')

      // const isNeck =
      //   regionName.includes('neck') ||
      //   regionName.includes('spine') ||
      //   regionName.includes('angiography') ||
      //   regionName.includes('special') ||
      //   regionName.includes('congenital')

      // if (isAbdomenOrPelvisOrChest) return 32
      // if (isThighs) return 24
      // if (isHeadOrLowerLegOrArms) return 16
      // if (isNeck) return 8

      // return 16

      const isHead = regionName.includes('head')
      return isHead ? 16 : 32
    },
  },
}

export default questionService
