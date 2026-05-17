// @ is an alias to /src
import {
  SCAN_STATUS,
  EXTRA_SCAN_BASE_NAME,
  BREATHING_INSTRUCTION,
  ROI_STATUS,
  HU_TRIGGER_TYPE,
  NUM_OF_LOCALIZER_SLICES_OF_CT,
  INJECTOR_SPEED,
} from '../../constants'
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import _ from 'lodash'
import Vue from 'vue'
import { greatestAxisAbsXYZ } from '@/lib/math-util'
import EventBus from '@/lib/event-bus'
import config from '@/config'
import { selectionConfigToAnswerData } from '@/lib/misc-util'
import gsap from 'gsap'
import { getInjectionRunningSpeedTimes } from '../../util/utils'
import { stopMriLoop, startMriLoop, startMriLoading, stopMriLoading } from '../../lib/mri-audio'

export const ScanButtonMixin = {
  name: 'ScanButtonMixin',
  components: {},
  data() {
    return {
      newName: null,
      scanSubmitting: false,
      skippingQuestion: false,
      showReferenceLinesPrevious: false,
      SCAN_STATUS: SCAN_STATUS,
      isCTLab: config.isCTLab,
      extraScanBaseName: EXTRA_SCAN_BASE_NAME,
      interval: null,
      BREATHING_INSTRUCTION,
      mrScanIdentType: 'min',
      keyStates: {},
      currentMusicAnimation: null,
      currentCountDownAnimation: null,
      currentTimingDecisionCountDownAnimation: null,
      currentPreCountDownAnimation: null,
      isPlayedBreathingHoldMusicWhenCountDown: false,
      timeout: null,
      isAutoScan: false,
      ROI_STATUS: ROI_STATUS,
      HU_TRIGGER_TYPE: HU_TRIGGER_TYPE,
      NUM_OF_LOCALIZER_SLICES_OF_CT,
    }
  },
  computed: {
    ...mapState('selectionConfig', [
      'isAddLocalizerMode',
      'showReferenceLines',
      'selectionConfigsByIdent',
      'delayTimeByQuestion',
    ]),
    ...mapGetters('selectionConfig', ['breathingInstruction']),
    ...mapState('stackService', [
      'stackConfigs',
      'isMriMachineScanComplete',
      'sliceIndexOfFirstSliceView',
      'sliceViewIndexWillShowResult',
      'scanDurationOfConfig',
    ]),
    ...mapState('interactableService', ['interactableStateByIdent']),
    ...mapGetters('stackService', ['stackConfigsIncludeNonLocalizer', 'lastStackConfigOfAcq', 'currentZDirectionBias']),
    ...mapGetters('questionService', [
      'scanSubmitted',
      'stackQuestions',
      'answerDataCurrent',
      'isAcquisitionQuestion',
      'isNextStackQuestionIsReconstruction',
      'isQuestionSetNoReconQuestion',
      'isReconstructionQuestion',
      'isPostContrastQuestion',
      'isLocalizerQuestion',
      'isTimingDecisionQuestion',
      'scanSubmittedByStackQuestionId',
      'isPrevStackQuestionIsSubmitted',
      'stackQuestion',
      'isNextStackQuestionIsAcqisition',
      'nextStackQuestion',
      'prevStackQuestion',
      'isPrevStackQuestionIsTimingDecision',
      'isPrevStackQuestionsHasTimingDecisionQuestion',
      'isFromTimingDecisionToCurrentIsAllAcq',
      'firstTimingDecisionQuestionIndex',
      'firstTimingDecisionQuestion',
      'isAnsweredCurrentQuestion',
    ]),
    ...mapGetters('testRunService', ['isTakingTest']),
    ...mapState('questionService', [
      'hasAnsweredAllStackQuestions',
      'isEditingQuestion',
      'isPlayingTheSlices',
      'isLoadingPlayingTheSlices',
      'scanStatus',
      'selectedStackQuestionIndex',
      'canGoToNextStep',
      'questionSet',
      'isLoadingDataToPlaySlice',
      'isMovingMRIMachine',
      'isMoveMRIMachineEnabled',
      'isMRIMachineMoved',
      'isSubmittingAnswer',
      'scanDelay',
      'isPlayingMusic',
      'injectionRunningSpeed',
      'isStartCountDownProcess',
      'stackQuestionScanDelayInfos',
      'roiStatus',
      'timingDecisionTriggerType',
      'timingDecisionScanDelay',
      'isConfirmedLocalizerQuestion',
      'userAnswers',
      'timingDecisionStartTime',
    ]),
    ...mapState('injectorService', [
      'isStartedContrastProcess',
      'isStartedSalineProcess',
      'isStartedTestContrastProcess',
      'isStartedContrast1Process',
      'isStartedContrast2Process',
      'injectorWaitingTime',
    ]),
    ...mapState('timingDecisionService', [
      'isMovingMRIMachineToConfirmedPosition',
      'isCountDownTimingDecisionQuestion',
      'isMovedMRIPositionToCorrectZone',
    ]),
    ...mapGetters('timingDecisionService', [
      'shouldAutoMoveToNextAfterTimingDecision',
      'isSelectedTestBolusTimingDecision',
      'isSelectedBolusTrackingTimingDecision',
      'preloadPercent',
      'isSelectedSetDelayTimingDecision',
    ]),
    scanDelayTime: {
      get() {
        return this.scanDelay
      },
      set(val) {
        this.setScanDelay(val)
      },
    },
    isHighlightStartButton() {
      return !this.isDisableStartButton && !this.isPlayingTheSlices
    },
    isHighlightTimingDecisionStartButton() {
      return !this.isDisableStartButtonForTimingDecisionQuestion && this.roiStatus != this.ROI_STATUS.SCANNING
    },
    isDisableMRScanButton() {
      return this.isAnsweredCurrentQuestion
    },
    isDisableStartButtonForTimingDecisionQuestion() {
      return (
        this.scanStatus !== this.SCAN_STATUS.SCANNED ||
        !this.canConfirmQuestion ||
        this.isSubmittingAnswer ||
        this.isMovingMRIMachineToConfirmedPosition ||
        this.isCountDownTimingDecisionQuestion
      )
    },
    isDisableScanButtonForTimingDecisionQuestion() {
      return (
        this.isPlayingTheSlices ||
        this.isLoadingPlayingTheSlices ||
        // disabled cancel after start
        this.canGoToNextStep ||
        this.isSubmittingAnswer ||
        !this.canConfirmQuestion ||
        this.roiStatus == ROI_STATUS.RUNNING ||
        this.isCountDownTimingDecisionQuestion ||
        this.isSelectedSetDelayTimingDecision
      )
    },
    isDisableSkipButton() {
      return (this.isCTLab && !this.canConfirmQuestion) || (!this.isCTLab && this.skippingQuestion)
    },
    isDisableStartButton() {
      return (
        (((!this.isModelMoved && this.scanStatus == this.SCAN_STATUS.SCANNED && this.isMoveEnabled) ||
          !(this.scanStatus == this.SCAN_STATUS.SCANNED) ||
          this.isMovingMRIMachine ||
          (this.isAcquisitionQuestion && this.isMoveEnabled) ||
          (this.isLocalizerQuestion && this.isMoveEnabled) ||
          (this.canGoToNextStep &&
            this.questionSet &&
            this.selectedStackQuestionIndex >= this.stackQuestions.length - 1 &&
            (this.stackQuestions.length > 1 || (this.stackQuestions.length == 1 && !this.isLocalizerQuestion)))) &&
          !this.isEditingQuestion) ||
        (this.isEditingQuestion &&
          (this.scanStatus !== SCAN_STATUS.SCANNED ||
            (this.canGoToNextStep &&
              this.questionSet &&
              this.selectedStackQuestionIndex >= this.stackQuestions.length - 1))) ||
        this.isSubmittingAnswer
      )
    },
    isDisableMoveButton() {
      // In Localizer question, we can press move or cancel before press start (move or cancel)
      // In Acquisition question, we can press move after press start (only move)
      return (
        (this.isAcquisitionQuestion && !this.isMoveEnabled) ||
        (this.isLocalizerQuestion && (this.isPlayingTheSlices || this.isMriMachineScanComplete)) ||
        this.isMovingMRIMachine ||
        this.scanStatus != this.SCAN_STATUS.SCANNED
      )
    },
    isComplete() {
      return this.hasAnsweredAllStackQuestions
    },
    isModelMoved: {
      get() {
        return this.isMRIMachineMoved
      },
      set(val) {
        this.setIsMRIMachineMoved(val)
      },
    },
    isMoveEnabled: {
      get() {
        return this.isMoveMRIMachineEnabled
      },
      set(val) {
        this.setIsMoveMRIMachineEnabled(val)
      },
    },
    testToggles() {
      return Object.keys(this.selectionConfigsByIdent).reduce((newTestToggles, toggleName) => {
        const [groupName] = toggleName.trim().split('_')
        if (!newTestToggles[groupName]) newTestToggles[groupName] = []

        newTestToggles[groupName].push({
          toggleName,
          visible: this.selectionConfigsByIdent[toggleName].visible,
        })

        return newTestToggles
      }, {})
    },
    canConfirmQuestion() {
      if (this.isCTLab) {
        if (this.stackQuestion && _.has(this.stackQuestion, ['id'])) {
          return !this.scanSubmittedByStackQuestionId[this.stackQuestion.id]
        }
      }

      return true
    },
    isPressNextButtonFromThisAnswer() {
      if (this.isCTLab) {
        if (this.stackQuestion && _.has(this.stackQuestion, ['id'])) {
          return _.get(this.stackQuestion, ['isPressedNext'], false)
        }
      }

      return true
    },
  },
  watch: {
    injectionRunningSpeed() {
      if (this.currentCountDownAnimation) {
        this.onCountDown()
      }
    },
    async selectedStackQuestionIndex() {
      // Handle for only one instance
      this.onSelectedStackQuestionIndexChange()
    },
    async scanDelayTime() {
      const confirmedStackConfig = await this.$store.dispatch(
        'stackService/getConfirmedStackConfig',
        this.selectedStackQuestionIndex
      )
      if (this.canConfirmQuestion && !confirmedStackConfig) {
        this.setSelectedScanDelayOfThisQuestion(this.scanDelayTime)
      }
    },
  },
  methods: {
    ...mapActions('selectionConfig', [
      'setIsAddLocalizerMode',
      'setHasAddedLocalizer',
      'setSelectedScanDelayOfThisQuestion',
    ]),
    ...mapActions('questionService', [
      'proceedToTakingPostQuestions',
      'setIsPlaying',
      'setIsLoadingPlayingTheSlices',
      'setScanStatus',
      'setIsNextStep',
      'selectNextQuestion',
      'jumpToQuestion',
      'setIsLoadingDataToPlaySlice',
      'setIsMovingMRIMachine',
      'setIsMoveMRIMachineEnabled',
      'setIsMRIMachineMoved',
      'setIsSubmittingAnswer',
      'setScanDelay',
      'setIsPlayingMusic',
      'setIsStartCountDownProcess',
      'setRoiStatus',
      'setTimingDecisionBrightnessData',
      'setTimingDecisionInfoToStackQuestion',
      'setTimingDecisionScanDelay',
      'handlePressedNextButton',
      'checkPressStartButtonOnTimeForTimingDecision',
      'setIsConfirmedLocalizerQuestion',
      'setInjectionRunningSpeed',
      'captureDelayTimeFromTimingDecisionStart',
    ]),
    ...mapActions('stackService', ['setIsMriMachineScanComplete', 'hiddenExtraStackConfigOfOtherStackQuestion']),
    ...mapMutations('selectionConfig', ['setHotKeysEnabledCT']),
    ...mapActions('injectorService', [
      'takeScreenShotPowerInjector',
      'setInjectedSecondsBeforeStartViewTimingDecision',
    ]),
    ...mapActions('timingDecisionService', [
      'setIsPressInjectBeforePressScanButton',
      'setStartTimingDecisionTime',
      'setIsCountDownTimingDecisionQuestion',
    ]),
    waitForPowerInjectorFlowReady(timeout = 5000, retries = 1) {
      return new Promise((resolve) => {
        if (this.$store.state.injectorService.isPowerInjectorFlowReady) {
          resolve()
          return
        }
        const handler = () => {
          EventBus.$off('powerInjectorFlowReady', handler)
          clearTimeout(timer)
          resolve()
        }
        EventBus.$on('powerInjectorFlowReady', handler)
        const timer = setTimeout(() => {
          EventBus.$off('powerInjectorFlowReady', handler)
          // Re-check store — event may have fired before listener was attached
          if (this.$store.state.injectorService.isPowerInjectorFlowReady) {
            resolve()
            return
          }
          if (retries > 0) {
            this.waitForPowerInjectorFlowReady(timeout, retries - 1).then(resolve)
          } else {
            resolve()
          }
        }, timeout)
      })
    },
    onMoveMriModelToBodyBoxEnd() {
      if (
        this.shouldHandleHotKey &&
        this.isCTLab &&
        // If count down auto scan mode is true
        this.isAutoScan &&
        // If take a test or view a test
        !this.isEditingQuestion &&
        // Not start by human
        !this.isPlayingTheSlices &&
        this.isAcquisitionQuestion
      ) {
        if (!this.currentMusicAnimation && !this.currentCountDownAnimation) {
          this.onTogglePlayScan()
        }
        // Acq after timing decision, auto scan
        else if (
          !this.currentCountDownAnimation &&
          this.isAutoScan &&
          this.isPrevStackQuestionIsTimingDecision &&
          this.isAcquisitionQuestion
        ) {
          this.onTogglePlayScan()
        }
      }
    },
    // Handle auto move and start in here
    async onSelectedStackQuestionIndexChange() {
      this.isPlayedBreathingHoldMusicWhenCountDown = false
      this.isAutoScan = false
      if (this.shouldHandleHotKey && this.isCTLab && !this.isEditingQuestion) {
        const confirmedStackConfig = await this.$store.dispatch(
          'stackService/getConfirmedStackConfig',
          this.selectedStackQuestionIndex
        )

        if (
          this.isCTLab &&
          confirmedStackConfig &&
          this.isAcquisitionQuestion &&
          this.isPrevStackQuestionIsTimingDecision &&
          this.shouldAutoMoveToNextAfterTimingDecision
        ) {
          // No action
        }
        // Auto pause count down process when move to the unconfirmed question or scan delay = 0
        else if (
          this.isCTLab &&
          (!this.isAcquisitionQuestion || !confirmedStackConfig || _.get(this.stackQuestion, ['scanDelay'], 0) == 0) &&
          this.isStartCountDownProcess
        ) {
          this.setIsStartCountDownProcess(false)
        } else if (
          this.isCTLab &&
          this.isPrevStackQuestionIsTimingDecision &&
          !this.shouldAutoMoveToNextAfterTimingDecision
        ) {
          this.setIsStartCountDownProcess(false)
          return
        }

        // User confirm and not start
        // Start count down process is running
        if (
          // Confirmed
          confirmedStackConfig &&
          // Not submitted
          !this.scanSubmittedByStackQuestionId[this.stackQuestion.id] &&
          // Count down was started
          this.isStartCountDownProcess &&
          // This candelay is set on the first time set up.
          this.stackQuestionScanDelayInfos.find((el) => el.questionId == this.stackQuestion.id) &&
          // Scan delay > 0
          _.get(this.stackQuestion, ['scanDelay'], 0) > 0 &&
          this.isAcquisitionQuestion
        ) {
          // Start pre countdown
          this.onPreCountDownProcess()

          // Auto move and start scan
          if (!this.isDisableMoveButton && this.isMoveEnabled) {
            if (this.isPrevStackQuestionIsTimingDecision && this.isPrevStackQuestionIsSubmitted) {
              this.isPlayedBreathingHoldMusicWhenCountDown = true
              this.onPlayMusicBeforeScan().then(() => {
                this.onTogglePlayScan()
              })
            }
            this.onMoveModel(true)
          }
        } else if (
          // Confirmed
          confirmedStackConfig &&
          // Scan delay > 0
          _.get(this.stackQuestion, ['scanDelay'], 0) == 0 &&
          this.isAcquisitionQuestion &&
          this.isPrevStackQuestionIsTimingDecision &&
          // Not submitted
          !this.scanSubmittedByStackQuestionId[this.stackQuestion.id] &&
          this.isPrevStackQuestionIsSubmitted
        ) {
          this.isMoveEnabled = true

          // Check this variable to ignore speak double time
          this.isPlayedBreathingHoldMusicWhenCountDown = true
          this.onPlayMusicBeforeScan().then(() => {
            if (!this.isDisableStartButton) {
              this.isPlayedBreathingHoldMusicWhenCountDown = false
              this.onStartOrReconNow()
              EventBus.$emit('onSetDelayTime')
            }
          })

          // Wait SliceView component init
          if (!this.isDisableMoveButton && this.isMoveEnabled) {
            this.onMoveModel(true)
          } else {
            this.onTogglePlayScan()
          }
        }
      }
    },
    async skipQuestion() {
      // Prevent multiple skip calls while already submitting
      if (this.skippingQuestion) {
        return
      }

      if (this.isCTLab) {
        this.setIsSubmittingAnswer(true)
        await this.$store.dispatch('questionService/addAnswerInCTLabModeWhenMoveToNext', { skipped: true })
        await this.$store.dispatch('questionService/selectNextQuestion')
        this.setIsSubmittingAnswer(false)
      } else {
        this.skippingQuestion = true
        try {
          await this.$store.dispatch('questionService/submitScan', { skipped: true })
        } finally {
          this.skippingQuestion = false
        }
      }
    },
    onRestartScan() {
      if (this.isPlayingTheSlices) {
        this.setIsPlaying(false)
      }
    },
    async onCancelAnswerForEdittingMode() {
      // Cancel
      this.setScanStatus(this.SCAN_STATUS.NO_SCAN)
      // Turn on display slices
      this.toggleDisplaySlice(true)
      // // Turn off ref lines
      // this.$store.dispatch('selectionConfig/setShowReferenceLines', false)
    },
    async handleChangeStatusForTimingDecisionQuestion() {
      if (this.scanStatus == this.SCAN_STATUS.SCANNED && this.roiStatus == this.ROI_STATUS.CONFIRMED) {
        // Check if next question is acq
        let shouldShowROI = true
        if (this.isNextStackQuestionIsAcqisition) {
          const confirmedStackConfigOfNextQuestion = await this.$store.dispatch(
            'stackService/getConfirmedStackConfig',
            this.selectedStackQuestionIndex + 1
          )
          const answerOfNextQuestion = _.find(
            this.userAnswers,
            (el) => el.stackQuestionId == _.get(this.nextStackQuestion, ['id'], null)
          )
          if (
            this.isTimingDecisionQuestion &&
            this.isSelectedBolusTrackingTimingDecision &&
            confirmedStackConfigOfNextQuestion &&
            !answerOfNextQuestion
          ) {
            shouldShowROI = false
          }
        }
        if (shouldShowROI) {
          return this.setRoiStatus(this.ROI_STATUS.SHOW_ROI)
        }
      }
      if (this.scanStatus == this.SCAN_STATUS.SCANNED) {
        // Cancel
        this.setScanStatus(this.SCAN_STATUS.NO_SCAN)
        this.setRoiStatus(this.ROI_STATUS.NO_CONFIRM)
        // Clear scan delay
        await this.$store.dispatch('questionService/deleteScanInfoOfCurrentStackQuestion', {})
        // Clear last stack
        await this.$store.dispatch('stackService/deleteMergeStackConfigOfSelectedStackQuestion', {})
        // Turn on display slices
        this.toggleDisplaySlice(true)
        // // Turn off ref lines
        // this.$store.dispatch('selectionConfig/setShowReferenceLines', false)
        EventBus.$emit('OnDeleteLastStack')
      } else if (this.scanStatus == this.SCAN_STATUS.NO_SCAN) {
        if (this.isCTLab) {
          this.setScanStatus(this.SCAN_STATUS.SCANNED)
          this.setIsNextStep(false)
          this.setRoiStatus(this.ROI_STATUS.NO_CONFIRM)
        }
      }
    },
    async handleChangeStatus() {
      if (this.isLocalizerQuestion && !this.isMriMachineScanComplete && !this.isEditingQuestion) {
        this.setScanStatus(this.SCAN_STATUS.SCANNED)
        this.toggleDisplaySlice(false)
        this.setIsNextStep(false)
        this.isMoveEnabled = true
      } else {
        if (this.scanStatus == this.SCAN_STATUS.SCANNED) {
          // Cancel
          this.setScanStatus(this.SCAN_STATUS.NO_SCAN)
          // Clear scan delay
          await this.$store.dispatch('questionService/deleteScanInfoOfCurrentStackQuestion', {})
          // Clear last stack
          await this.$store.dispatch('stackService/deleteMergeStackConfigOfSelectedStackQuestion', {})
          // Turn on display slices
          this.toggleDisplaySlice(true)
          // // Turn off ref lines
          // this.$store.dispatch('selectionConfig/setShowReferenceLines', false)
          EventBus.$emit('OnDeleteLastStack')
        } else if (this.scanStatus == this.SCAN_STATUS.NO_SCAN) {
          this.openSubmitModal()
        }
      }
    },
    async onStartMriMachine() {
      this.setIsLoadingPlayingTheSlices(true)
      this.isPlayedBreathingHoldMusicWhenCountDown = true
      this.onPlayMusicBeforeScan().then(() => {
        this.onRunMriMachine()
      })
    },
    onRunMriMachine() {
      this.setIsLoadingPlayingTheSlices(false)
      this.setIsPlaying(true)
      const stepCount = 40
      let stepIndex = 0
      if (this.interval) {
        clearInterval(this.interval)
      }
      this.interval = setInterval(() => {
        if (stepIndex == 0) {
          this.setIsLoadingPlayingTheSlices(false)
        }
        if (stepIndex <= stepCount) {
          EventBus.$emit('onIndexSliceChange', stepIndex, stepCount)
        } else {
          this.onStopMriMachine()
        }
        stepIndex++
      }, 200)
    },
    async onStopMriMachine(shouleMoveToNextQuestion = true) {
      this.setIsPlaying(false)
      this.setIsMriMachineScanComplete(true)
      this.setIsNextStep(true)

      if (this.interval) {
        clearInterval(this.interval)
      }

      this.setIsSubmittingAnswer(true)
      await this.onPlayMusicAfterScan()

      // Submit localizer answer
      this.handleSubmitAnswerForCurrentQuestion(shouleMoveToNextQuestion)
    },
    toggleDisplaySlice(visible) {
      if (this.isEditingQuestion) {
        return
      }
      const toggle = this.testToggles[0] ? this.testToggles[0][0] : {}
      if (toggle && toggle.toggleName) {
        this.$store.dispatch('selectionConfig/setSelectionConfig', {
          ident: toggle.toggleName,
          skipSyncingOtherGroups: true,
          selectionConfig: { visible: visible },
        })
      }
    },
    openSubmitModal() {
      if (this.isPlayingTheSlices) {
        this.setIsPlaying(false)
        return
      }
      this.setScanStatus(this.SCAN_STATUS.NO_SCAN)

      this.$refs.submitModal.show()
      this.setHotKeysEnabledCT(false)

      // Save Reference Line setting then turn off so it doesn't appear on the screenshot image we are persisting for the TestResult
      this.showReferenceLinesPrevious = this.showReferenceLines
      if (!this.isCTLab) {
        this.$store.dispatch('selectionConfig/setShowReferenceLines', false)
      }
    },
    async onAutoRunEnd() {
      if ((!this.canGoToNextStep || !this.questionSet) && this.isPlayingTheSlices) {
        await this.handleStopScan()
      }
    },
    onMoveModel(isAutoCall = false) {
      if (!isAutoCall && this.isLocalizerQuestion) {
        if (!this.isConfirmedLocalizerQuestion) {
          this.setIsConfirmedLocalizerQuestion(true)
          this.isMoveEnabled = true
          EventBus.$emit('onCheckNeedToMoveMriUpDownToLandmarkPoint')
          return
        }
        if (this.isMoveEnabled) {
          this.isAutoScan = isAutoCall
          this.setIsMovingMRIMachine(true)
          EventBus.$emit('onMoveMriModelToBodyBox')
        } else {
          if (this.isConfirmedLocalizerQuestion) {
            this.setIsConfirmedLocalizerQuestion(false)
            this.isMoveEnabled = true
          } else {
            this.isMoveEnabled = true
          }
        }
      } else {
        if (this.isMoveEnabled) {
          this.isAutoScan = isAutoCall
          this.setIsMovingMRIMachine(true)
          EventBus.$emit('onMoveMriModelToBodyBox')
        } else {
          this.isMoveEnabled = true
        }
      }
    },
    onClickHotKey(keyCode) {
      if (this.shouldHandleHotKey) {
        this.keyStates = {
          ...this.keyStates,
          [keyCode]: this.keyStates[keyCode] ? false : true,
        }

        // Handle move MRI table
        if (this.keyStates['Move']) {
          this.setIsMovingMRIMachine(true)
          EventBus.$emit('onMoveMriModelToBodyBox')
        } else {
          EventBus.$emit('onCancelMoveMriModelToBodyBox')
        }

        if (!this.isDisableStartButton) {
          if (this.keyStates['Start'] && !(this.canGoToNextStep && this.questionSet) && !this.isPlayingTheSlices) {
            this.onTogglePlayScan()
          }
        }

        if (
          this.keyStates['StartROI'] &&
          !this.isDisableStartButtonForTimingDecisionQuestion &&
          !(this.scanStatus == this.SCAN_STATUS.SCANNED && !this.isMovedMRIPositionToCorrectZone) &&
          (this.roiStatus == this.ROI_STATUS.CONFIRMED || this.roiStatus == this.ROI_STATUS.RUNNING)
        ) {
          this.onTogglePlayScanForTimingDecisionQuestion()
        }
      }
    },
    async onTimingDecisionRunDone() {
      // IMPORTANT: Make sure this function run only one time
      if (this.shouldHandleHotKey && this.roiStatus == this.ROI_STATUS.DONE) {
        this.$store.dispatch('injectorService/setInjectorTimerPausedForTransition', true)
        this.setIsStartCountDownProcess(this.shouldAutoMoveToNextAfterTimingDecision)
        this.setIsSubmittingAnswer(true)
        this.onStopMriMachine(this.shouldAutoMoveToNextAfterTimingDecision)
      }
    },
    async onSetDelayTimingDecisionConfirmedMoveToNextQuestion() {
      // If adjacent acq question after timing decision question is not confirmed
      // Move to this question
      if (this.shouldHandleHotKey) {
        // Answer the question
        this.setRoiStatus(this.ROI_STATUS.DONE)
        this.setIsStartCountDownProcess(false)
        await this.takeScreenShotPowerInjector()
        this.onStopMriMachine(true)
      }
    },
    async onTogglePlayScanForTimingDecisionQuestion() {
      if (this.scanStatus == SCAN_STATUS.SCANNED && !this.isMovedMRIPositionToCorrectZone) {
        EventBus.$emit('onMoveMriUpDownToTimingDecisionStep')
        return
      }
      if (this.roiStatus == this.ROI_STATUS.NO_CONFIRM) {
        this.setRoiStatus(this.ROI_STATUS.SHOW_ROI)
      } else if (this.roiStatus == this.ROI_STATUS.SHOW_ROI) {
        this.setRoiStatus(this.ROI_STATUS.CONFIRMED)
        EventBus.$emit('onConfirmROI')
        this.setTimingDecisionInfoToStackQuestion()

        // If user select bolus tracking mode
        // We should auto move to the next acq question if it's not answered or confirmed
        if (this.isNextStackQuestionIsAcqisition) {
          const confirmedStackConfigOfNextQuestion = await this.$store.dispatch(
            'stackService/getConfirmedStackConfig',
            this.selectedStackQuestionIndex + 1
          )
          const answerOfNextQuestion = _.find(
            this.userAnswers,
            (el) => el.stackQuestionId == _.get(this.nextStackQuestion, ['id'], null)
          )
          if (
            this.isTimingDecisionQuestion &&
            this.isSelectedBolusTrackingTimingDecision &&
            !confirmedStackConfigOfNextQuestion &&
            !answerOfNextQuestion
          ) {
            this.jumpToQuestion(this.selectedStackQuestionIndex + 1)
          }
        }
      } else if (this.roiStatus == this.ROI_STATUS.CONFIRMED) {
        this.checkPressStartButtonOnTimeForTimingDecision()
        this.setTimingDecisionBrightnessData([])
        if (this.isStartedContrastProcess || this.isStartedTestContrastProcess || this.isStartedSalineProcess) {
          this.setIsPressInjectBeforePressScanButton(true)
        }
        this.setStartTimingDecisionTime(Date.now())
        this.setInjectedSecondsBeforeStartViewTimingDecision()
        await this.onCountDownTimingDecision()
        this.setRoiStatus(this.ROI_STATUS.RUNNING)
      } else if (this.roiStatus == this.ROI_STATUS.RUNNING) {
        this.$store.dispatch('injectorService/setInjectorTimerPausedForTransition', true)
        this.setIsSubmittingAnswer(true)
        this.setRoiStatus(this.ROI_STATUS.DONE)
        this.setIsStartCountDownProcess(this.shouldAutoMoveToNextAfterTimingDecision)
        this.onStopMriMachine(this.shouldAutoMoveToNextAfterTimingDecision)
      } else if (this.roiStatus == this.ROI_STATUS.DONE) {
        this.handlePressedNextButton()
        this.handleNextStep()
      }
    },
    killCurrentTimingDecisionCountDownAnimation() {
      if (this.currentTimingDecisionCountDownAnimation) {
        this.currentTimingDecisionCountDownAnimation.kill()
      }
      this.currentTimingDecisionCountDownAnimation = null
      this.setIsCountDownTimingDecisionQuestion(false)
    },
    onCountDownTimingDecision() {
      return new Promise((resolve) => {
        this.killCurrentTimingDecisionCountDownAnimation()
        const countDownSpeed = getInjectionRunningSpeedTimes(this.injectionRunningSpeed)
        const playVariable = { x: this.timingDecisionScanDelay }
        this.setIsCountDownTimingDecisionQuestion(true)
        // Start count down ACQ
        this.setIsStartCountDownProcess(this.shouldAutoMoveToNextAfterTimingDecision)
        this.currentTimingDecisionCountDownAnimation = gsap.to(playVariable, {
          x: 0,
          // Duration in setInterval auto play slice in SliceView
          duration: this.timingDecisionScanDelay / countDownSpeed,
          ease: 'none',
          onUpdate: () => {
            this.setTimingDecisionScanDelay(Math.round(playVariable.x))
          },
          onComplete: () => {
            this.currentTimingDecisionCountDownAnimation = null
            this.setIsCountDownTimingDecisionQuestion(false)
            resolve()
          },
        })
      })
    },
    async onTogglePlayScan() {
      // CMT
      if (this.canGoToNextStep && this.questionSet) {
        // Only handle for localizer question
        await this.handleNextStep()
      } else {
        if (this.isLocalizerQuestion && !this.isMriMachineScanComplete && !this.isEditingQuestion) {
          if (this.isPlayingTheSlices) {
            this.onStopMriMachine()
          } else {
            this.$store.dispatch('questionService/setScanInfoToStackQuestion')
            await this.onStartMriMachine()
          }
        } else {
          if (this.isPlayingTheSlices) {
            await this.handleStopScan(true)
          } else {
            // Start countdown process on here
            if (this.isCTLab && this.isAcquisitionQuestion && _.get(this.stackQuestion, ['scanDelay'], 0) > 0) {
              this.setIsStartCountDownProcess(true)
            }
            this.setIsLoadingDataToPlaySlice(true)
            this.createExtraView()
            await this.onStartScan()
          }
        }
      }
    },
    async handleNextStep() {
      if (!this.isCTLab) {
        return
      }

      if (this.selectedStackQuestionIndex + 1 >= this.stackQuestions.length) {
        return
      }

      if (this.isLocalizerQuestion && !this.isEditingQuestion) {
        this.selectNextQuestion()
        this.setScanStatus(this.SCAN_STATUS.NO_SCAN)
        this.setRoiStatus(this.ROI_STATUS.NO_CONFIRM)
        this.setIsNextStep(false)
        this.toggleDisplaySlice(true)
        return
      }
      this.selectNextQuestion()
      this.toggleDisplaySlice(true)
    },
    onPlayMusicAfterScan() {
      return new Promise((resolve, reject) => {
        if (
          !this.isEditingQuestion &&
          (this.isAcquisitionQuestion || this.isLocalizerQuestion) &&
          (this.breathingInstruction == this.BREATHING_INSTRUCTION.INSPIRATION ||
            this.breathingInstruction == this.BREATHING_INSTRUCTION.EXPIRATION)
        ) {
          if (this.$refs.soundResumeBreath) {
            this.setIsLoadingPlayingTheSlices(true)
            this.setIsPlayingMusic(true)
            this.$refs.soundResumeBreath
              .play()
              .then(() => {
                Vue.notify({ text: 'Resume breathing normally' })
                setTimeout(() => {
                  this.setIsLoadingPlayingTheSlices(false)
                  this.setIsPlayingMusic(false)
                  resolve()
                }, 1608)
              })
              .catch((err) => {
                this.setIsLoadingPlayingTheSlices(false)
                this.setIsPlayingMusic(false)
                reject(err)
              })
          } else {
            resolve()
          }
        } else {
          resolve()
        }
      })
    },
    async handleStopScan(shouldCutSlice = false) {
      this.setIsSubmittingAnswer(true)
      if (this.isAcquisitionQuestion) {
        if (this.timingDecisionStartTime) {
          this.captureDelayTimeFromTimingDecisionStart({
            questionIndex: this.selectedStackQuestionIndex,
            end: _.round((Date.now() - this.timingDecisionStartTime) / 1000 - this.injectorWaitingTime, 1),
          })
        }
      }
      this.setIsPlaying(false)

      // Don't move to next on dicom play ground mode
      if (this.questionSet && this.stackQuestion) {
        this.setIsNextStep(true)
      }
      await this.onPlayMusicAfterScan()
      // Handle cut slices when user click stop
      if (shouldCutSlice) {
        await this.$store.dispatch('stackService/cutSlicesOfStackConfigAndExtraConfigs', {
          endSliceIndex: this.sliceIndexOfFirstSliceView,
        })
      }
      this.toggleDisplaySlice(true)
      if (this.stackQuestion) {
        const shouldAutoMoveToNextQuestion =
          this.isAcquisitionQuestion &&
          this.isPrevStackQuestionIsTimingDecision &&
          this.isNextStackQuestionIsReconstruction
            ? false
            : true
        this.handleSubmitAnswerForCurrentQuestion(shouldAutoMoveToNextQuestion)
      } else {
        this.setIsSubmittingAnswer(false)
        this.setScanStatus(this.SCAN_STATUS.NO_SCAN)
      }
    },
    async handleSubmitAnswerForCurrentQuestion(shouleMoveToNextQuestion = true) {
      this.setIsSubmittingAnswer(true)
      setTimeout(async () => {
        try {
          await this.$store.dispatch('questionService/addAnswerInCTLabModeWhenMoveToNext', { skipped: false })
          if (shouleMoveToNextQuestion) {
            this.handleNextStep()
          }
        } catch (error) {
          console.error('Failed to submit CT lab answer:', error)
        } finally {
          this.setIsSubmittingAnswer(false)
        }
      }, 100)
    },
    killCurrentCountDownAnimation() {
      if (this.currentCountDownAnimation) {
        this.currentCountDownAnimation.kill()
      }
      this.currentCountDownAnimation = null
    },
    killCurrentPreCountDownAnimation() {
      if (this.currentPreCountDownAnimation) {
        this.currentPreCountDownAnimation.kill()
      }
      this.currentPreCountDownAnimation = null
    },
    onPreCountDownProcess() {
      this.killCurrentPreCountDownAnimation()
      const countDownSpeed = getInjectionRunningSpeedTimes(this.injectionRunningSpeed)
      const playVariable = { x: this.scanDelayTime }
      this.currentPreCountDownAnimation = gsap.to(playVariable, {
        x: 0,
        // Duration in setInterval auto play slice in SliceView
        duration: this.scanDelayTime / countDownSpeed,
        ease: 'none',
        onUpdate: () => {
          if (countDownSpeed > 1 && this.scanDelayTime > 5 && playVariable.x <= 5) {
            this.setInjectionRunningSpeed(INJECTOR_SPEED.NONE)
          }
          this.scanDelayTime = playVariable.x
        },
        onComplete: () => {
          this.currentPreCountDownAnimation = null
        },
      })
    },
    onCountDown() {
      return new Promise((resolve) => {
        const musicDuration = this.getBreathingHoldMusicDuration()
        this.killCurrentCountDownAnimation()
        const countDownSpeed = getInjectionRunningSpeedTimes(this.injectionRunningSpeed)
        const playVariable = { x: this.scanDelayTime }
        this.currentCountDownAnimation = gsap.to(playVariable, {
          x: 0,
          // Duration in setInterval auto play slice in SliceView
          duration: this.scanDelayTime / countDownSpeed,
          ease: 'none',
          onUpdate: () => {
            if (countDownSpeed > 1 && this.scanDelayTime > 5 && playVariable.x <= 5) {
              this.setInjectionRunningSpeed(INJECTOR_SPEED.NONE)
            }
            this.scanDelayTime = playVariable.x
            if (
              playVariable.x < musicDuration / 1000 &&
              !this.isPlayedBreathingHoldMusicWhenCountDown &&
              this.breathingInstruction != this.BREATHING_INSTRUCTION.OFF
            ) {
              this.isPlayedBreathingHoldMusicWhenCountDown = true
              this.onPlayMusicBeforeScan().then(() => {
                this.onStartOrReconNow()
              })
            }
          },
          onComplete: () => {
            this.currentCountDownAnimation = null
            this.onStartOrReconNow()
            resolve()
          },
        })
      })
    },
    killCurrentMusicAnimation() {
      this.setIsPlayingMusic(false)
      if (this.currentMusicAnimation) {
        this.currentMusicAnimation.kill()
      }
      this.currentMusicAnimation = null
    },
    onSoundBreathInLoaded(e) {
      const playbackRate = e.target.duration / 3.888
      e.target.playbackRate = playbackRate
    },
    onSoundBreathOutLoaded(e) {
      const playbackRate = e.target.duration / 4.056
      e.target.playbackRate = playbackRate
    },
    getBreathingHoldMusicDuration() {
      if (this.breathingInstruction == this.BREATHING_INSTRUCTION.INSPIRATION) {
        return 3888
      } else if (this.breathingInstruction == this.BREATHING_INSTRUCTION.EXPIRATION) {
        return 4056
      } else {
        return 0
      }
    },
    onPlayMusicBeforeScan() {
      return new Promise((resolve) => {
        this.killCurrentMusicAnimation()
        this.setIsPlayingMusic(true)
        // Resume the injector timer — the breath-hold instruction is real
        // scan time that should be reflected in the timer display.
        this.$store.dispatch('injectorService/setInjectorTimerPausedForTransition', false)
        if (this.breathingInstruction == this.BREATHING_INSTRUCTION.INSPIRATION && this.$refs.soundBreathIn) {
          this.$refs.soundBreathIn.play()
          const playVariable = { x: 0 }
          this.currentMusicAnimation = gsap.to(playVariable, {
            x: this.getBreathingHoldMusicDuration(),
            // Duration in setInterval auto play slice in SliceView
            duration: this.getBreathingHoldMusicDuration() / 1000,
            ease: 'none',
            onComplete: () => {
              this.setIsPlayingMusic(false)
              this.currentMusicAnimation = null
              resolve()
            },
          })
        } else if (this.breathingInstruction == this.BREATHING_INSTRUCTION.EXPIRATION && this.$refs.soundBreathOut) {
          this.$refs.soundBreathOut.play()
          const playVariable = { x: 0 }
          this.currentMusicAnimation = gsap.to(playVariable, {
            x: this.getBreathingHoldMusicDuration(),
            // Duration in setInterval auto play slice in SliceView
            duration: this.getBreathingHoldMusicDuration() / 1000,
            ease: 'none',
            onComplete: () => {
              this.setIsPlayingMusic(false)
              this.currentMusicAnimation = null
              resolve()
            },
          })
        } else {
          this.setIsPlayingMusic(false)
          resolve()
        }
      })
    },
    async onStartScan() {
      if (this.isPlayingTheSlices) {
        this.killCurrentPreCountDownAnimation()
        this.killCurrentCountDownAnimation()
        this.killCurrentMusicAnimation()
        return
      }

      //Kill pre countdown if exist
      this.killCurrentPreCountDownAnimation()

      // Clear bSignalAverages at the start of any scan to ensure clean slate
      this.$store.dispatch('selectionConfig/setBSignalAverages', { bSignalAverages: [] })

      // Handle press space
      if (this.currentMusicAnimation || this.currentCountDownAnimation) {
        this.killCurrentCountDownAnimation()
        if (
          !this.isPlayedBreathingHoldMusicWhenCountDown &&
          this.breathingInstruction != this.BREATHING_INSTRUCTION.OFF
        ) {
          this.onPlayMusicBeforeScan().then(() => {
            this.onStartOrReconNow()
            EventBus.$emit('onSetDelayTime')
          })
        } else {
          this.onStartOrReconNow()
          EventBus.$emit('onSetDelayTime')
        }

        return
      }

      // Show the main stack config of this question
      this.$store.dispatch('stackService/showMergeStackConfigOfCurrentQuestion')

      // Play music
      if (!this.isEditingQuestion && this.isAcquisitionQuestion) {
        this.setIsLoadingPlayingTheSlices(true)
        this.setSelectedScanDelayOfThisQuestion(this.scanDelayTime)
        await this.countDownAndPlayMusicBeforeScan(this.onStartOrReconNow)
      } else {
        this.killCurrentCountDownAnimation()
        this.killCurrentMusicAnimation()
        this.onStartOrReconNow()
      }
    },
    async onStartOrReconNow() {
      if (this.currentCountDownAnimation) {
        return
      }
      if (this.currentMusicAnimation) {
        return
      }
      // Set injector delay time
      if (this.isAcquisitionQuestion) {
        if (this.timingDecisionStartTime) {
          this.captureDelayTimeFromTimingDecisionStart({
            questionIndex: this.selectedStackQuestionIndex,
            start: _.round((Date.now() - this.timingDecisionStartTime) / 1000 - this.injectorWaitingTime, 1),
          })
          this.$store.dispatch('globalOptions/setAppLoading', true)
          // Clear transition pause flag — isAppLoading now keeps the timer
          // frozen for the screenshot (handles paths with no breath hold).
          this.$store.dispatch('injectorService/setInjectorTimerPausedForTransition', false)
          await this.waitForPowerInjectorFlowReady()
          await this.takeScreenShotPowerInjector()
          this.$store.dispatch('globalOptions/setAppLoading', false)
        }
        if (this.isPostContrastQuestion) {
          EventBus.$emit('onSetDelayTime')
        }
      }

      this.setIsLoadingPlayingTheSlices(false)
      this.setIsPlaying(true)
      this.toggleDisplaySlice(false)
    },
    async countDownAndPlayMusicBeforeScan(callback) {
      // Check if jump from timing decision to acq or acq to acq
      // If we speak breathing hold music when move
      // Don't need to speak again
      // Auto scan must be checked in here
      if (this.isAcquisitionQuestion && this.isAutoScan && this.isPlayedBreathingHoldMusicWhenCountDown) {
        if (this.scanDelayTime == 0) {
          if (callback) {
            callback()
          }
        } else {
          // Don't speak here
          this.isPlayedBreathingHoldMusicWhenCountDown = true
          this.onCountDown().then(() => {
            // Call back of countDown alway is this.onStartOrReconNow
          })
        }

        return
      }

      if (this.scanDelayTime > 0 && this.getBreathingHoldMusicDuration() / 1000 >= this.scanDelayTime) {
        this.isPlayedBreathingHoldMusicWhenCountDown = true
        this.onCountDown().then(() => {
          // Call back of countDown alway is this.onStartOrReconNow
        })
        if (this.breathingInstruction != this.BREATHING_INSTRUCTION.OFF) {
          this.onPlayMusicBeforeScan().then(() => {
            if (callback) {
              callback()
            }
          })
        }
      } else if (this.scanDelayTime > 0) {
        // No breathing on here
        this.isPlayedBreathingHoldMusicWhenCountDown = false
        this.onCountDown().then(() => {
          // Call back of countDown alway is this.onStartOrReconNow
        })
      } else if (this.breathingInstruction != this.BREATHING_INSTRUCTION.OFF) {
        this.isPlayedBreathingHoldMusicWhenCountDown = true
        this.onPlayMusicBeforeScan().then(() => {
          if (callback) {
            callback()
          }
        })
      } else {
        if (callback) {
          callback()
        }
      }
    },
    onCancelSubmit() {
      if (this.timeout) {
        clearTimeout(this.timeout)
      }
      this.setScanStatus(this.SCAN_STATUS.NO_SCAN)
    },
    async createExtraView() {
      if (this.isCTLab && !this.isQuestionSetNoReconQuestion && !this.isEditingQuestion) {
        // Acq -> Recon: Create extra
        // Acq -> Acq: Not create extra
        // Recon -> Recon: Create extra
        // Recon -> Acq: Create extra
        if (
          !(this.isAcquisitionQuestion && this.isNextStackQuestionIsReconstruction) &&
          !(this.isReconstructionQuestion && this.isNextStackQuestionIsReconstruction) &&
          !(this.isReconstructionQuestion && this.isNextStackQuestionIsAcqisition)
        ) {
          return
        }
        const isContrastLab = this.$store.getters['dicomService/isContrastLab']
        let identType = this.isEditingQuestion ? 'min' : 'proposed'
        // Add one StackConfig per group (the proposed of each group)
        let groups = this.$store.getters['selectionConfig/selectionConfigsGroups']
        let selectionConfigs = _.map(groups, (group) => {
          // use type 'min' when in QuestionEdit mode (like Admin editing a question)
          // use type 'proposed' when not in QuestionEdit mode (like Students)
          let ident = `${group.id}_${identType}`
          let selectionConfig = this.$store.state.selectionConfig.selectionConfigsByIdent[ident]
          if (!selectionConfig) {
            console.warn('selectionConfigsByIdent missing ident: ', ident)
          }
          return selectionConfig
        })
        let {
          xDirection3,
          yDirection3,
          zDirection3,
          center3,
          dimensions3,
          numberOfSlices,
          thickness,
          echoTime,
          repetitionTime,
          inversionTime,
          flipAngle,
          sequenceType,
          fatSuppression,
          inversionRecovery,
          fieldStrength,
          echoSpacing,
          echoTrainLength,
          enableTSEBlur,
          echoOrdering,
          sliceSelection,
          phaseVoxelSize,
          frequencyVoxelSize,
          frequencyMatrix,
          phaseMatrix,
          windowWidth,
          windowLevel,
        } = selectionConfigs[0]

        if (this.isReconstructionQuestion && this.lastStackConfigOfAcq && this.isCTLab) {
          const data = _.pick(this.lastStackConfigOfAcq, [
            'xDirection3',
            'yDirection3',
            'zDirection3',
            'center3',
            'dimensions3',
            'windowWidth',
            'windowLevel',
          ])

          if (data.xDirection3) {
            xDirection3 = data.xDirection3
          }
          if (data.yDirection3) {
            yDirection3 = data.yDirection3
          }
          if (data.zDirection3) {
            zDirection3 = data.zDirection3
          }
          if (data.center3) {
            center3 = data.center3
          }
          if (data.dimensions3) {
            dimensions3 = data.dimensions3
          }
          if (_.has(data, ['windowWidth'])) {
            windowWidth = data.windowWidth
          }
          if (_.has(data, ['windowLevel'])) {
            windowLevel = data.windowLevel
          }
        }

        const dir3ToDirName = (dir3) => {
          let axisName = greatestAxisAbsXYZ(dir3.x, dir3.y, dir3.z)
          return { x: 'Sagittal', y: 'Coronal', z: 'Axial' }[axisName]
        }

        const questionIndex = this.selectedStackQuestionIndex
        const mergedStackConfig = _.get(
          _.reverse(_.cloneDeep(this.stackConfigs)).find(
            (el) =>
              !el.name.includes(this.extraScanBaseName) &&
              el.isConfigOfCTLabMode &&
              _.get(el, ['questionIndex'], -1) == questionIndex
          ),
          'name',
          ''
        )

        if (!mergedStackConfig) {
          return
        }

        let baseName = `${this.extraScanBaseName}`

        const extraStackDirectionConfigs = {
          x: {
            xDirection3: yDirection3,
            yDirection3: zDirection3,
            zDirection3: xDirection3,
            extendedLimitXDir: 'y',
            extendedLimitYDir: 'z',
            extendedLimitZDir: 'x',
          },
          y: {
            xDirection3: zDirection3,
            yDirection3: xDirection3,
            zDirection3: yDirection3,
            extendedLimitXDir: 'z',
            extendedLimitYDir: 'x',
            extendedLimitZDir: 'y',
          },
          z: {
            xDirection3,
            yDirection3,
            zDirection3,
          },
        }

        const findSuitableDirectionConfig = (axisName) => {
          let config = extraStackDirectionConfigs.x
          _.entries(extraStackDirectionConfigs).forEach(([, value]) => {
            if (greatestAxisAbsXYZ(value.zDirection3.x, value.zDirection3.y, value.zDirection3.z) == axisName) {
              config = value
            }
          })

          return config
        }

        let firstExtraStackName = `${baseName} ${dir3ToDirName(yDirection3)} from ${mergedStackConfig}`
        let firstExtraStackDirectionConfig = extraStackDirectionConfigs.x
        let secondExtraStackName = `${baseName} ${dir3ToDirName(xDirection3)} from ${mergedStackConfig}`
        let secondExtraStackDirectionConfig = extraStackDirectionConfigs.y
        if (this.sliceViewIndexWillShowResult == -1 || this.sliceViewIndexWillShowResult == 0) {
          // 1
          firstExtraStackName = `${baseName} Coronal from ${mergedStackConfig}`
          firstExtraStackDirectionConfig = findSuitableDirectionConfig('y')
          // 2
          secondExtraStackName = `${baseName} Sagittal from ${mergedStackConfig}`
          secondExtraStackDirectionConfig = findSuitableDirectionConfig('x')
        } else if (this.sliceViewIndexWillShowResult == 1) {
          // 0
          firstExtraStackName = `${baseName} Axial from ${mergedStackConfig}`
          firstExtraStackDirectionConfig = findSuitableDirectionConfig('z')
          // 2
          secondExtraStackName = `${baseName} Sagittal from ${mergedStackConfig}`
          secondExtraStackDirectionConfig = findSuitableDirectionConfig('x')
        } else {
          // 0
          firstExtraStackName = `${baseName} Axial from ${mergedStackConfig}`
          firstExtraStackDirectionConfig = findSuitableDirectionConfig('z')
          // 1
          secondExtraStackName = `${baseName} Coronal from ${mergedStackConfig}`
          secondExtraStackDirectionConfig = findSuitableDirectionConfig('y')
        }

        // This creates 2 different Extra scan, one in each direction, so we swap the x/y/zDir3s

        // X
        // If it was Axial, it will be Sag: (x<-y,y<-z,z<-x)
        await this.$store.dispatch('stackService/addStackConfig', {
          name: firstExtraStackName,
          dimensions3,
          center3,
          desiredStackHeight: dimensions3.x,
          contrastParameters: {
            echoTime,
            repetitionTime,
            inversionTime,
            flipAngle,
            fatSuppression,
            inversionRecovery,
            fieldStrength,
            echoSpacing,
            echoTrainLength,
            enableTSEBlur,
            echoOrdering,
            sliceSelection,
          },
          sequenceType: !isContrastLab ? null : sequenceType,
          numberOfSlices,
          thickness,
          spacing: (dimensions3.x - (numberOfSlices - 1) * thickness) / (numberOfSlices - 1),
          isLimited: true,
          phaseVoxelSize,
          frequencyVoxelSize,
          frequencyMatrix,
          phaseMatrix,
          windowWidth,
          windowLevel,
          hidden: false,
          zDirectionBias: this.currentZDirectionBias,
          ...firstExtraStackDirectionConfig,
          answerData: {
            ...selectionConfigToAnswerData({ ...selectionConfigs[0] }),
          },
        })
        // Y
        // If it was Axial, it will be Cor: (x<-z,y<-x,z<-y)
        await this.$store.dispatch('stackService/addStackConfig', {
          name: secondExtraStackName,
          dimensions3,
          center3,
          desiredStackHeight: dimensions3.y,
          contrastParameters: {
            echoTime,
            repetitionTime,
            inversionTime,
            flipAngle,
            fatSuppression,
            inversionRecovery,
            fieldStrength,
            echoSpacing,
            echoTrainLength,
            enableTSEBlur,
            echoOrdering,
            sliceSelection,
          },
          sequenceType: !isContrastLab ? null : sequenceType,
          numberOfSlices,
          thickness,
          spacing: (dimensions3.y - (numberOfSlices - 1) * thickness) / (numberOfSlices - 1),
          isLimited: true,
          phaseVoxelSize,
          frequencyVoxelSize,
          frequencyMatrix,
          phaseMatrix,
          windowWidth,
          windowLevel,
          hidden: false,
          zDirectionBias: this.currentZDirectionBias,
          ...secondExtraStackDirectionConfig,
          answerData: {
            ...selectionConfigToAnswerData({ ...selectionConfigs[0] }),
          },
        })

        this.hiddenExtraStackConfigOfOtherStackQuestion()
      }
    },
    async submitScan(skipped = false) {
      if (this.scanSubmitting) {
        Vue.notify({ type: 'warning', text: 'Scan in progress...' })
        return
      }
      if (this.scanSubmitted) {
        throw Error('Scan already submitted for this Question')
      }

      try {
        this.scanSubmitting = true

        if (!this.isCTLab) {
          stopMriLoop()
          startMriLoading()
        }

        if (this.isCTLab) {
          this.setSelectedScanDelayOfThisQuestion(this.scanDelayTime)
          this.setScanStatus(this.SCAN_STATUS.SCANNING)
          this.setIsNextStep(false)
          if (this.isAcquisitionQuestion) {
            this.isMoveEnabled = true
          }
        }

        // Matthew always wants the scan to be based on the Min when in QuestionEdit mode, but otherwise there is only `proposed`
        let identType = 'proposed'
        if (this.isEditingQuestion) {
          identType = this.mrScanIdentType
        }

        // Add one StackConfig per group (the proposed of each group)
        let groups = this.$store.getters['selectionConfig/selectionConfigsGroups']
        // these are basically selectionConfigs with some extra params needed for making a stackConfig
        let selectionConfigs = _.map(groups, (group) => {
          // use type 'min' when in QuestionEdit mode (like Admin editing a question)
          // use type 'proposed' when not in QuestionEdit mode (like Students)
          let ident = `${group.id}_${identType}`
          let selectionConfig = this.$store.state.selectionConfig.selectionConfigsByIdent[ident]
          if (!selectionConfig) {
            console.warn('selectionConfigsByIdent missing ident: ', ident)
          }
          selectionConfig = _.cloneDeep(selectionConfig)

          if (this.isCTLab && this.isAcquisitionQuestion) {
            selectionConfig.scanDuration = this.scanDurationOfConfig
          }
          if (this.isCTLab) {
            selectionConfig.zDirectionBias = this.currentZDirectionBias
          }

          if (!this.isCTLab) {
            // Add sat band to stack config
            const userSatBands = this.interactableStateByIdent
            const satBands = []
            for (const [, value] of Object.entries(userSatBands)) {
              satBands.push(_.cloneDeep(value))
            }
            selectionConfig.satBands = satBands
          }

          // COMMENT: Show cut view in the main view
          // if (this.isReconstructionQuestion && this.lastStackConfigOfAcq && this.isCTLab) {
          //   const data = _.pick(this.lastStackConfigOfAcq, [
          //     'xDirection3',
          //     'yDirection3',
          //     'zDirection3',
          //     'center3',
          //     'dimensions3',
          //   ])

          //   if (data.xDirection3) {
          //     selectionConfig.xDirection3 = data.xDirection3
          //   }
          //   if (data.yDirection3) {
          //     selectionConfig.yDirection3 = data.yDirection3
          //   }
          //   if (data.zDirection3) {
          //     selectionConfig.zDirection3 = data.zDirection3
          //   }
          //   if (data.center3) {
          //     selectionConfig.center3 = data.center3
          //   }
          //   if (data.dimensions3) {
          //     selectionConfig.dimensions3 = data.dimensions3
          //   }
          // }

          return selectionConfig
        })
        let isConfigOfCTLabMode = this.isCTLab
        let shouldLimitCTModel = this.isCTLab && this.isAcquisitionQuestion && this.isNextStackQuestionIsReconstruction

        // hide on enter
        this.$root.$emit('bv::hide::modal', 'modal-submit-scan')

        const timeOutSeconds = this.isCTLab ? 2000 : 0
        this.timeout = setTimeout(async () => {
          try {
            if (
              selectionConfigs[0].sequenceType === 'DIFF' &&
              selectionConfigs[0].bValues &&
              selectionConfigs[0].bValues.length > 0
            ) {
              // For DIFF sequence type, loop through bValues
              // Show loading overlay once for the entire DIFF batch
              EventBus.$emit('LOADING', {
                name: 'ADD_STACK',
                title: this.isCTLab ? 'Loading...' : 'Scanning...',
                isLoading: true,
              })

              const hasDiffusionADC = selectionConfigs[0].diffusionADC
              try {
                for (let i = 0; i < selectionConfigs[0].bValues.length; i++) {
                  const diffSelectionConfigs = selectionConfigs.map((config) => ({
                    ...config,
                    bValue: selectionConfigs[0].bValues[i],
                    noiseFactor: _.get(selectionConfigs, [0, 'bNoiseFactors', i], 0),
                  }))

                  await this.$store.dispatch('stackService/addMergedStackConfig', {
                    selectionConfigs: diffSelectionConfigs,
                    isConfigOfCTLabMode,
                    nameNew: this.newName,
                    shouldLimitCTModel,
                    isUserAnsweredStackConfig: true,
                    skipGlobalLoading: true,
                  })
                }

                // Check if diffusionADC is true and generate ADC map
                if (hasDiffusionADC) {
                  const adcSelectionConfigs = selectionConfigs.map((config) => ({
                    ...config,
                    isADCMap: true,
                    bValue: undefined, // Clear bValue for ADC map
                  }))

                  await this.$store.dispatch('stackService/addMergedStackConfig', {
                    selectionConfigs: adcSelectionConfigs,
                    isConfigOfCTLabMode,
                    nameNew: this.newName,
                    shouldLimitCTModel,
                    isUserAnsweredStackConfig: true,
                    skipGlobalLoading: true,
                  })
                }
              } finally {
                // Dismiss loading overlay and transition audio after all DIFF iterations complete
                EventBus.$emit('LOADING', { name: 'ADD_STACK', isLoading: false })
                if (!this.isCTLab) {
                  stopMriLoading()
                  if (this.$store.state.stackService.isOnMriView && !this.$store.state.questionService.testResult) {
                    startMriLoop()
                  }
                }
              }
            } else {
              // Original behavior for non-DIFF sequence types
              await this.$store.dispatch('stackService/addMergedStackConfig', {
                selectionConfigs,
                isConfigOfCTLabMode,
                nameNew: this.newName,
                shouldLimitCTModel,
                isUserAnsweredStackConfig: true,
              })
            }

            this.$store.dispatch('questionService/setScanInfoToStackQuestion')

            this.newName = ''
            await this.$store.dispatch('questionService/submitScan', { skipped })

            this.setScanStatus(this.SCAN_STATUS.SCANNED)

            // If prev question is timing decision, and it's not answered
            // The selected mode is bolus tracking
            // We must auto go back to the timing decision to continue
            if (
              this.isCTLab &&
              this.isPrevStackQuestionsHasTimingDecisionQuestion &&
              this.isSelectedBolusTrackingTimingDecision &&
              this.isAcquisitionQuestion
            ) {
              const timingDecisionQuestionAnswer = _.find(
                this.userAnswers,
                (el) => el.stackQuestionId == _.get(this.firstTimingDecisionQuestion, ['id'], null)
              )
              if (this.isFromTimingDecisionToCurrentIsAllAcq && !timingDecisionQuestionAnswer) {
                if (this.isNextStackQuestionIsAcqisition) {
                  const confirmedStackConfigOfNextQuestion = await this.$store.dispatch(
                    'stackService/getConfirmedStackConfig',
                    this.selectedStackQuestionIndex + 1
                  )
                  const answerOfNextQuestion = _.find(
                    this.userAnswers,
                    (el) => el.stackQuestionId == _.get(this.nextStackQuestion, ['id'], null)
                  )
                  if (
                    (this.isSelectedBolusTrackingTimingDecision || this.isSelectedSetDelayTimingDecision) &&
                    !confirmedStackConfigOfNextQuestion &&
                    !answerOfNextQuestion
                  ) {
                    this.jumpToQuestion(this.selectedStackQuestionIndex + 1)
                  }
                } else {
                  this.jumpToQuestion(this.firstTimingDecisionQuestionIndex)
                }
              }
            }
          } catch (error) {
            console.error('submitScan failed:', error)
          }
        }, timeOutSeconds)
      } finally {
        this.scanSubmitting = false
      }
    },

    restoreReferenceLines() {
      // Restore what showReferenceLines was before we scanned
      if (!this.isCTLab) {
        this.$store.dispatch('selectionConfig/setShowReferenceLines', this.showReferenceLinesPrevious)
      }
      if (this.scanStatus === this.SCAN_STATUS.NO_SCAN) {
        this.setHotKeysEnabledCT(true)
      }
    },

    submitAddLocalizer() {
      if (this.scanSubmitting) {
        Vue.notify({ type: 'warning', text: 'Scan in progress...' })
        return
      }
      // In CTLab mode, allow user create localizer with any stack
      if (!this.isCTLab) {
        if (!this.stackConfigsIncludeNonLocalizer) {
          Vue.notify({ type: 'error', text: 'Insufficient Dicom data to add a localizer' })
          return
        }
      }

      try {
        this.scanSubmitting = true

        // let stackConfigOfFirstLocalizer = this.$store.getters['stackService/stackConfigOfFirstLocalizer']
        let { center3, spacing, zDirection3, yDirection3, xDirection3, dimensions3 } = this.$store.getters[
          'selectionConfig/selectionConfigCurrent'
        ]

        const dir3ToDirName = (dir3) => {
          let axisName = greatestAxisAbsXYZ(dir3.x, dir3.y, dir3.z)
          return { x: 'Sagittal', y: 'Coronal', z: 'Axial' }[axisName]
        }

        // Localizer's StackHeight is based on 3 Slices (one in center, one at each extreme, np thickness, so just spacing between them)
        let desiredStackHeight = spacing * 2
        // In CTLAB Mode, we create 50 slice
        if (this.isCTLab) {
          desiredStackHeight = dimensions3.z
        }
        let idForName = _.uniqueId()
        let baseName = 'Added Localizer ' + idForName

        // This creates 3 different Localizer, one in each direction, so we swap the x/y/zDir3s

        // Z / as-is
        // If it was Axial, it will stay axial: (x<-x,y<-y,z<-z)
        this.$store.dispatch('stackService/addStackConfig', {
          name: baseName + ' ' + dir3ToDirName(zDirection3),
          xDirection3,
          yDirection3, // x/y are for the rotation of the slices (matters when cutting/trimming to just desired selection)
          zDirection3, // the direction of the stack
          dimensions3,
          center3,
          desiredStackHeight,
          isLimited: false,
          isLocalizer: true,
        })
        // Y
        // If it was Axial, it will be Cor: (x<-z,y<-x,z<-y)
        this.$store.dispatch('stackService/addStackConfig', {
          name: baseName + ' ' + dir3ToDirName(yDirection3),
          xDirection3: zDirection3,
          yDirection3: xDirection3,
          zDirection3: yDirection3, // This is intentionally diff to get Localizers in all 3 directions!
          dimensions3,
          center3,
          desiredStackHeight,
          isLimited: false,
          isLocalizer: true,
        })
        // X
        // If it was Axial, it will be Sag: (x<-y,y<-z,z<-x)
        this.$store.dispatch('stackService/addStackConfig', {
          name: baseName + ' ' + dir3ToDirName(xDirection3),
          xDirection3: yDirection3,
          yDirection3: zDirection3,
          zDirection3: xDirection3,
          dimensions3,
          center3,
          desiredStackHeight,
          isLimited: false,
          isLocalizer: true,
        })

        this.setIsAddLocalizerMode(false)
        this.setHasAddedLocalizer(true)
      } finally {
        this.scanSubmitting = false
      }
    },

    modalFocusInput() {
      let input = this.$refs.refNewNameInput
      if (input) {
        input.focus()
      }
    },
  },
}
