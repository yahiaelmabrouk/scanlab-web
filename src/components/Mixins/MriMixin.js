import _ from 'lodash'
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import config from '../../config'
import { isOnlyShowRightOrWrong, combinedResultAnalysis } from '../../util/resultAnalysis'
import { BODY_PART_TYPE, SELECTION_CONFIG_DISPLAY_MODE } from '../../constants'
import { identToGroupId } from '../../lib/selection-config-util'

export const MriMixin = {
  name: 'MriMixin',
  data() {
    return {
      SELECTION_CONFIG_DISPLAY_MODE,
      previewScore: {},
      nextRoute: null,
      nextPlace: null,
      showAbandonDialog: false,
      rubricPanel: null,
      trafficLightsPreviewPanel: false,
      previewScoreGroupIndex: 0,
      previewScorePoller: null,
      showSandboxModeDialog: false,
      hasLookedAtAnswersSelectionsByQuestionId: {}, // { stackQuestionId: true }
      testIds: this.$route.query.test,
      isCTLab: config.isCTLab,
      injector: {
        saline: {
          volume: 0,
          flow: 1,
        },
        contrast: {
          volume: 0,
          flow: 1,
        },
      },
      testRunState: 'QUESTIONS',
      positionConfirmed: false,
      landmarkConfirmed: false,
      exceptPreviewFactorNames: [
        // 'salineFlow',
        // 'contrastFlow',
        'isScanPositionRight',
        'landmarkDistanceRatio',
        'injectionContrastValue',
        'injectionSalineValue',
        // 'delayTime',
      ],
      isOnlyShowRightOrWrong,
      combinedResultAnalysis,
      showParamHints: [],
      selectedSliceviews: [],
      injectorAndPatientTab: 0,
      translatedBodyPartName: '',
    }
  },
  watch: {
    isUltraLab() {
      this.setIsUltraLab(this.isUltraLab)
    },
    rubricPanel: function () {
      this.startAdminPanelPollingAsNeeded()
    },
    trafficLightsPreviewPanel: function () {
      this.startAdminPanelPollingAsNeeded()
    },
    stackQuestion(newValue, oldValue) {
      this.previewScoreGroupIndex = 0
      const isOldQuestionIsTimingDecision = oldValue ? oldValue.questionType == 5 : false
      const isNewQuestionIsTimingDecision = newValue ? newValue.questionType == 5 : false

      if (isOldQuestionIsTimingDecision != isNewQuestionIsTimingDecision) {
        this.onClearSelectedSliceViews()
      }
    },
    userAnswers() {
      this.$forceUpdate()
    },
    stackQuestions() {
      if (this.hasContrast) {
        this.changeTestState('INJECTOR')
      } else {
        this.changeTestState('POSITION')
      }
      this.$forceUpdate()
    },
    selectedStackQuestionIndex() {
      // change test state when index change
      if (this.selectedStackQuestionIndex > 0) {
        if (this.isChangePatientPositionQuestion) {
          this.positionConfirmed = false
          this.landmarkConfirmed = false
          this.changeTestState('POSITION')
        }
        if (this.isLocalizerQuestion) {
          // Reset localizer scan state
          this.$store.dispatch('stackService/resetLocalizerPercentScanned')
        }
      }

      if ((this.isTimingDecisionQuestion || this.isLocalizerQuestion) && !this.isEditingQuestion) {
        this.toggleDisplaySlice(false)
      }
    },
    shouldReloadDicomFileSet() {
      if (this.shouldReloadDicomFileSet) {
        this.onInitMRIAfterAnswerPointSelectQuestion()
      }
    },
    questionSetBodyPartId(newValue) {
      if (newValue) {
        this.translateBodyPartName(newValue)
      }
    },
    languageCode() {
      this.translateBodyPartName(this.questionSetBodyPartId)
    },
  },
  computed: {
    ...mapState('satBandService', ['visibleSatBand', 'visibleSatBandRect']),
    ...mapState('testRunService', ['test', 'isRetryingAnswerSubmission']),
    ...mapGetters('testRunService', ['isTestComplete']),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    ...mapGetters('interactableService', ['mayAddSatBand', 'selectedInteractableState']),
    ...mapState('dicomService', [
      'dicomFileSet',
      'isLoaded',
      'progressFetch',
      'progressParse',
      'progressTotal',
      'allowPageReloadWithoutConfirmation',
    ]),
    ...mapState('questionService', [
      'questionSet',
      'answerSelectionId',
      'isViewingCriticalThinkingQuestion',
      'shouldReloadDicomFileSet',
      'isSubmitted',
      'hasAnsweredAllStackQuestions',
      'userAnswers',
      'injectionAttribute',
      'isLoadingScreeningFormPatientInfo',
      'isSubmittingAnswer',
      'selectedStackQuestionIndex',
    ]),
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'answersSelections',
      'stackQuestionsLength',
      'selectedStackQuestionIndexVisual',
      'scanSubmitted',
      'testResultAugmented',
      'answerCurrent',
      'scanSubmittedByStackQuestionId',
      'isAcquisitionQuestion',
      'isCardiacAcquisitionQuestion',
      'isReconstructionQuestion',
      'isPostContrastQuestion',
      'testModelFileName',
      'patientPositionsHaveAnyBodyBoxes',
      'isLocalizerQuestion',
      'questionSetBodyPartName',
      'questionSetBodyPartId',
      'isAnsweredCurrentQuestion',
      'isChangePatientPositionQuestion',
      'isTimingDecisionQuestion',
      'isQuestionSetHasTimingDecisionQuestion',
      'questionSetBodyPartTypeName',
      'questionSetBodyPartTypeId',
    ]),
    ...mapGetters('stackService', ['stackConfigsIncludeNonLocalizer']),
    ...mapState('selectionConfig', [
      'selectionConfigsByIdent',
      'selectionConfigCurrentIdent',
      'isFullscreen',
      'isAddLocalizerMode',
      'hasAddedLocalizer',
      'groupSelectionConfigs',
    ]),
    ...mapGetters('selectionConfig', [
      'spacing',
      'thickness',
      'selectionConfigsCurrentGroupId',
      'selectionConfigsIdentTypeNames',
      'selectionConfigCurrentIdentType',
      'selectionConfigsGroups',
      'isSingleSliceMode',
      'dotScaleValues',
      'isParameterDisabled',
    ]),
    ...mapState('user', ['isAdmin', 'isManager']),
    ...mapGetters('user', ['vendorStylePreferenceOptions', 'languageCode']),
    ...mapGetters('testRunService', ['isTakingTest']),
    ...mapGetters('cohortService', ['isChallengeModeEnabledForMe']),
    ...mapGetters('timingDecisionService', ['isSelectedSetDelayTimingDecision']),
    bodyPartTypeText() {
      const typeId = this.questionSetBodyPartTypeId
      if (typeId === BODY_PART_TYPE.WITH_OUT || typeId === BODY_PART_TYPE.WITH_CONTRAST) {
        return ` ${this.$t('ContrastTypes.' + typeId, this.languageCode)}`
      }
      return ''
    },
    selectedGroupIds() {
      return _.uniq(_.map(this.groupSelectionConfigs, (el) => identToGroupId(el)))
    },
    selectedSliceviewIds() {
      return this.selectedSliceviews.map((sliceview) => sliceview.sliceId)
    },
    isFreebie() {
      return this.stackQuestion?.freebie
    },
    useInitialUltraLabDefaults() {
      let output = true
      if (this.isEditingQuestion || this.isTakingTest) {
        output = false
      }
      return output
    },
    showAnalysisWrongWhenNoAnswerKeyNames() {
      if (!this.isCTLab || this.isAnsweredCurrentQuestion) {
        return []
      } else {
        return ['delayTime']
      }
    },
    isAnsweredCurrentQuestionOrStartScan() {
      if (!this.isCTLab) {
        return true
      } else {
        if (this.isAnsweredCurrentQuestion || this.isSubmittingAnswer) {
          return true
        } else {
          return false
        }
      }
    },
    beforeAnswerPreviewScore() {
      const delayTimeAnalysis = _.find(this.previewScoreAnalysisComputed, { factorName: 'delayTime' })
      if (delayTimeAnalysis) {
        return 0
      } else {
        return this.previewScore?.score || null
      }
    },
    confirmAndNextButtonText() {
      if (
        (this.testRunState === 'POSITION' && this.positionConfirmed) ||
        (this.testRunState === 'LANDMARK' && this.landmarkConfirmed)
      ) {
        return 'global.next'
      } else {
        return this.testRunState === 'POSITION' ? 'global.confirm_position' : 'global.confirm_landmark'
      }
    },
    patientPositionDirections() {
      return this.$t('global.patient_position_directions', {
        bodyPartName: `${this.translatedBodyPartName}${this.bodyPartTypeText}`,
      })
    },
    patientLandmarkingDirections() {
      return this.$t('global.patient_landmarking_directions', {
        bodyPartName: `${this.translatedBodyPartName}${this.bodyPartTypeText}`,
      })
    },
    isLoadedScreeningForm: {
      get() {
        if (this.isTakingTest && this.isLoadingScreeningFormPatientInfo) {
          return false
        } else {
          return true
        }
      },
    },
    answerSelectionIdComputed: {
      get() {
        return this.answerSelectionId
      },
      set(answerSelectionId) {
        this.setAnswerSelectionId({ answerSelectionId })
      },
    },
    selectionConfigsCurrentGroupIdComputed: {
      get() {
        return this.selectionConfigsCurrentGroupId
      },
      set(groupId) {
        groupId = _.parseInt(groupId)
        this.setSelectionConfigCurrentIdent({ groupId })
      },
    },
    isVolumeViewMode: {
      get() {
        return this.$store.state.selectionConfig.isVolumeViewMode
      },
      set(isVolumeViewMode) {
        this.$store.dispatch('selectionConfig/setIsVolumeViewMode', isVolumeViewMode)
      },
    },
    showReferenceLines: {
      get() {
        return this.$store.state.selectionConfig.showReferenceLines
      },
      set(showReferenceLines) {
        this.$store.dispatch('selectionConfig/setShowReferenceLines', showReferenceLines)
      },
    },
    dotScaleMultiplierIndex: {
      get() {
        return _.indexOf(this.dotScaleValues, this.dotScaleMultiplier)
      },
      set(index) {
        this.dotScaleMultiplier = this.dotScaleValues[index]
        if (!this.dotScaleMultiplier) {
          throw Error('set dotScaleMultiplier out of bounds')
        }
      },
    },
    dotScaleMultiplier: {
      get() {
        return this.$store.state.selectionConfig.dotScaleMultiplier
      },
      set(dotScaleMultiplier) {
        this.$store.dispatch('selectionConfig/setDotScaleMultiplier', dotScaleMultiplier)
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
    isUltraLab() {
      let isUltraLab = false

      if (
        _.isBoolean(this.$route.query.isUltraLab)
          ? this.$route.query.isUltraLab
          : this.$route.query.isUltraLab == 'true'
      ) {
        isUltraLab = true
      } else if (this.questionSet) {
        isUltraLab = this.questionSet.isUltraLab
      }
      return isUltraLab
    },
    isEditingQuestion() {
      // This is checked before we have an ID (can't move this to a service because router there is not reactive)
      // If you want to know in a service, it's stored in questionService.isEditingQuestion
      return Boolean(this.$route.query.editing)
    },
    disabledTools() {
      if (this.isCTLab) {
        if (this.isParameterDisabled) {
          return ['move', 'resize', 'rotate', 'oversampling']
        }
        if (this.isAcquisitionQuestion) {
          return ['rotate', 'oversampling']
        }
        if (this.isReconstructionQuestion) {
          return ['oversampling']
        }
        return ['oversampling']
      } else {
        return []
      }
    },
    isLoadedAndReady() {
      if (this.isViewingCriticalThinkingQuestion) {
        return false
      }
      return this.isLoaded && this.$store.state.selectionConfig.ready && this.$store.state.threeJSSVGProvider.hasLoaded
    },
    editModeSelectionTabs() {
      return _.reject(this.selectionConfigsIdentTypeNames, { identType: 'min' })
    },
    currentSelectionTab: {
      get() {
        let cur = this.selectionConfigCurrentIdentType
        return cur === 'min' ? 'max' : cur
      },
      set(identType) {
        this.setSelectionConfigCurrentIdent({ identType })
      },
    },
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    blurBackground() {
      return !this.isEditingQuestion && (this.isViewingCriticalThinkingQuestion || this.isSubmitted)
    },
    shouldAbandonTest() {
      return this.isTakingTest && !this.isSubmitted && !this.isTestComplete
    },
    answerSelectionsHasUnseenChoice() {
      return _.size(this.answersSelections) > 1 && !this.hasLookedAtAnswersSelectionsByQuestionId[this.stackQuestion.id]
    },
    hasContrast() {
      let output = false
      for (let q of this.stackQuestions) {
        if (q.postContrast && q.questionType == 1) {
          output = true
          break
        }
      }
      return output
    },
    previewScoreAnalysisComputed() {
      let output = []
      if (this.isCTLab) {
        output = combinedResultAnalysis(this.previewScore.groupScoreVariables[this.previewScoreGroupIndex].analysis)
      } else {
        output = this.previewScore.groupScoreVariables[this.previewScoreGroupIndex].analysis
      }
      return output
    },
  },
  methods: {
    ...mapMutations('satBandService', ['setVisibleSatBand']),
    ...mapActions('satBandService', ['setVisibleSatBandRect']),
    ...mapActions('interactableService', ['createSatBand']),
    ...mapActions('selectionConfig', [
      'resetSelection',
      'setSelectionConfigCurrentIdent',
      'clearGroupSelectionConfigs',
      'addSelectionConfigToGroup',
      'selectAllSelectionConfigs',
      'toggleSelectionConfigGroupToGroup',
      'setIsAddLocalizerMode',
      'addSelectionConfigGroup',
      'removeSelectionConfigGroup',
      'setHasAddedLocalizer',
      'setIsScanPositionRight',
      'setInjectionSalineValue',
      'setInjectionContrastValue',
      'setPowerInjectorCurrentDuration',
      'setLastPowerInjectorCurrentDuration',
      'setIsUltraLab',
      'updateKeyState',
    ]),
    ...mapActions('questionService', [
      'setAnswerSelectionId',
      'selectPrevQuestion',
      'selectNextQuestion',
      'getScorePreview',
      'jumpToQuestion',
      'selectPatientPosition',
      'resetMRIState',
      'setIsLoadingScreeningFormPatientInfo',
      'setTestInjectionMode',
      'setTestInjectCondition',
      'setIsSubmittingAnswer',
      'addQuestion',
    ]),
    ...mapActions('injectorService', ['resetInjectorState']),
    ...mapActions('timingDecisionService', ['resetTimingDecisionState', 'resetPreloadImages']),
    ...mapActions('translatedContent', ['translateThisRecord']),
    ...mapActions('globalOptions', ['fetchQuestionSetOptions']),
    ...mapActions('testRunService', ['setIsLoadingStartTest']),
    toggleDisplaySlice(visible) {
      const toggle = this.testToggles[0] ? this.testToggles[0][0] : {}
      if (toggle && toggle.toggleName) {
        this.$store.dispatch('selectionConfig/setSelectionConfig', {
          ident: toggle.toggleName,
          skipSyncingOtherGroups: true,
          selectionConfig: { visible: visible },
        })
      }
    },
    onToggleGroupSelection() {
      if (this.groupSelectionConfigs.length > 1) {
        // Deselect all
        this.clearGroupSelectionConfigs()
        this.addSelectionConfigToGroup({ ident: this.selectionConfigCurrentIdent })
      } else {
        // Select all
        this.selectAllSelectionConfigs()
      }
    },
    onClickGroup(event, { groupId }) {
      this.setSelectionConfigCurrentIdent({ groupId })
      if (event.ctrlKey) {
        this.toggleSelectionConfigGroupToGroup({ groupId })
      } else {
        this.clearGroupSelectionConfigs()
        this.toggleSelectionConfigGroupToGroup({ groupId })
      }
    },
    async translateBodyPartName(id) {
      this.translatedBodyPartName = this.questionSetBodyPartName || ''
      await this.translateThisRecord({
        type: 'bodyPart',
        record: { id: id, name: this.questionSetBodyPartName },
        lang: this.languageCode,
      })
      const translatedContent = this.$store.state.translatedContent.translatedContent
      let key = `bodyPart|${id}|${this.languageCode}`
      let name = this.questionSetBodyPartName || ''
      if (translatedContent[key]) {
        name = translatedContent[key].name || name
      }
      this.translatedBodyPartName = name
    },
    onSelectAllSelectionConfig() {
      this.selectAllSelectionConfigs()
      this.visible = false
    },
    isGroupIsSelected(groupId) {
      return this.selectedGroupIds.includes(groupId)
    },
    onKeyDown(e) {
      if (e.key == 'Control') {
        this.updateKeyState({ key: e.key, value: true })
      }
    },
    onKeyUp(e) {
      if (e.key == 'Control') {
        this.updateKeyState({ key: e.key, value: false })
      }
    },
    onClearSelectedSliceViews() {
      this.selectedSliceviews = []
    },
    onSliceViewConfigChanged(sliceViewConfig) {
      const isSliceIsSelected = this.selectedSliceviewIds.includes(sliceViewConfig.sliceId)
      if (!isSliceIsSelected) {
        return
      }
      const otherSlices = this.selectedSliceviews.filter((sliceview) => sliceview.sliceId !== sliceViewConfig.sliceId)
      if (sliceViewConfig.type == 'windowing') {
        const { windowWidth, windowCenter } = sliceViewConfig
        otherSlices.forEach((sliceview) => {
          if (_.has(sliceview, ['windowWidth'])) {
            sliceview.windowWidth = windowWidth
          }
          if (_.has(sliceview, ['windowCenter'])) {
            sliceview.windowCenter = windowCenter
          }
          if (_.has(sliceview, ['geometryMustUpdate'])) {
            sliceview.geometryMustUpdate = true
          }
        })
      } else if (sliceViewConfig.type == 'zoom') {
        const { zoom } = sliceViewConfig
        otherSlices.forEach((sliceview) => {
          if (_.has(sliceview, ['zoom'])) {
            sliceview.zoom = zoom
          }
          if (_.has(sliceview, ['geometryMustUpdate'])) {
            sliceview.geometryMustUpdate = true
          }
        })
      } else if (sliceViewConfig.type == 'reset-windowing') {
        otherSlices.forEach((sliceview) => {
          if (_.has(sliceview, ['resetWindowing'])) {
            sliceview.resetWindowing()
          }
        })
      } else if (sliceViewConfig.type == 'pan') {
        const { movement2 } = sliceViewConfig
        otherSlices.forEach((sliceview) => {
          if (movement2.x !== 0) {
            sliceview.geometryMustUpdate = true

            let flippedLR = sliceview.isCameraLeftRightFlipped ? -1 : 1
            sliceview.camera.left -= (movement2.x / sliceview.camera.zoom) * flippedLR
            sliceview.camera.right -= (movement2.x / sliceview.camera.zoom) * flippedLR
          }
          if (movement2.y !== 0) {
            sliceview.geometryMustUpdate = true

            sliceview.camera.top += movement2.y / sliceview.camera.zoom
            sliceview.camera.bottom += movement2.y / sliceview.camera.zoom
          }
        })
      } else if (sliceViewConfig.type == 'modify-slice-index') {
        const { delta } = sliceViewConfig
        otherSlices.forEach((sliceview) => {
          sliceview.indexSliceSlider = sliceview.indexSliceSlider + delta
        })
      }
    },
    onSliceViewSelectOnly(sliceViewRef) {
      this.selectedSliceviews = [sliceViewRef]
    },
    onSliceViewSelect(sliceViewRef) {
      if (this.selectedSliceviewIds.includes(sliceViewRef.sliceId)) {
        this.selectedSliceviews = this.selectedSliceviews.filter(
          (sliceview) => sliceview.sliceId !== sliceViewRef.sliceId
        )
      } else {
        this.selectedSliceviews = [...this.selectedSliceviews, sliceViewRef]
      }
    },
    async onInitMRIAfterAnswerPointSelectQuestion() {
      let testId = this.$route.query.test

      this.$store.dispatch('selectionConfig/init')

      if (testId && this.test) {
        this.$store.dispatch('selectionConfig/addSelectionConfigGroup', { groupId: 0 })
        this.$store.dispatch('dicomService/loadDicomGroup', {
          dicomFileSetId: this.questionSet.dicomFileSet,
          reset: true,
        })
      }
    },
    resetMRIScanState() {
      this.resetMRIState()
    },
    onInjectorSubmit() {
      const contrastValue = _.get(this.injector, ['contrast', 'volume'], 0)
      const salineValue = _.get(this.injector, ['saline', 'volume'], 0)

      this.setInjectionContrastValue(+contrastValue)
      this.setInjectionSalineValue(+salineValue)

      this.changeTestState('POSITION')
    },
    onCancelConfirm() {
      this.landmarkConfirmed = false
      this.$refs.mriViewer.isConfirmLandmark = false
    },
    async onNextTestState() {
      if (!this.$refs.mriViewer) {
        return
      }
      if (this.testRunState === 'POSITION') {
        if (!this.positionConfirmed) {
          this.$refs.mriViewer.onConfirmPosition()
        } else {
          this.changeTestState('LANDMARK')
          this.$refs.mriViewer.toggleLazer(null, true)
          this.$refs.mriViewer.moveCameraToLandmarkView()
          this.setIsScanPositionRight(this.$refs.mriViewer.isPositionRight)
        }
      } else if (this.testRunState === 'LANDMARK') {
        if (!this.landmarkConfirmed) {
          this.$refs.mriViewer.onConfirmLandmark()
        } else {
          if (this.selectedStackQuestionIndex == 0) {
            this.changeTestState('QUESTIONS')
            this.$refs.mriViewer.toggleLazer(null, false)
          } else {
            this.$refs.mriViewer.toggleLazer(null, false)
            this.setIsSubmittingAnswer(true)
            await this.$store.dispatch('questionService/addAnswerInCTLabModeWhenMoveToNext', { skipped: true })
            await this.$store.dispatch('questionService/selectNextQuestion')
            this.setIsSubmittingAnswer(false)
            this.changeTestState('QUESTIONS')
          }
        }
      }
    },
    isAnsweredPrevQuestion(questionIndex) {
      const prevQuestion = questionIndex > 0 ? this.stackQuestions[questionIndex - 1] : null

      return (
        !prevQuestion || (this.userAnswers && this.userAnswers.find((el) => el.stackQuestionId === prevQuestion.id))
      )
    },
    async configAngioExams() {
      const isAngioExam = _.get(this.test, 'angio')
      if (isAngioExam) {
        this.$store.dispatch('selectionConfig/setIsVolumeViewMode', true)
      }
    },
    startAdminPanelPollingAsNeeded() {
      if (this.previewScorePoller) {
        clearInterval(this.previewScorePoller)
      }

      // 0 means the panel is shown, undefined means it's hidden (this is some weird VueX state)
      if (this.rubricPanel === 0 || this.trafficLightsPreviewPanel === 0) {
        // score preview is open
        this.updatePreviewScore()
        this.previewScorePoller = setInterval(
          function () {
            this.updatePreviewScore()
          }.bind(this),
          500
        )
      }
    },
    jumpToStackQuestion(idx) {
      this.$store.dispatch('questionService/jumpToQuestion', idx - 1)
    },
    async resetMRI() {
      await this.$store.dispatch('interactableService/reset', {})
      await this.$store.dispatch('selectionConfig/reset', {})
      await this.$store.dispatch('stackService/resetStackConfigs', {})
      await this.$store.dispatch('dicomService/reset', {})
      await this.$store.dispatch('pointSelectService/resetPointServiceState', {})
    },
    getProperToggleName(selectionIdent) {
      const identType = selectionIdent.trim().split('_')[1]

      const properName = 'Lines'
      let properType = ''

      if (identType === 'min') properType = 'Minimum'
      if (identType === 'max') properType = 'Maximum'

      return properType ? `${properType} ${properName}` : `${this.$t('MRI.display_slices')}`
    },
    getProperGroupName(selectionIdent) {
      let [groupName] = selectionIdent.trim().split('_')
      let formattedGroupName = groupName

      if (!_.isNaN(Number(groupName))) {
        formattedGroupName = `Group ${Number(groupName) + 1}`
      }

      return `${formattedGroupName}`
    },
    onLookedAtAnswerSelections() {
      // shallow copy so Vue notices the change for the computed
      this.hasLookedAtAnswersSelectionsByQuestionId = {
        ...this.hasLookedAtAnswersSelectionsByQuestionId,
        [this.stackQuestion.id]: true,
      }
    },
    toggleSlider(toggleGroupName, index) {
      const { toggleName, visible } = this.testToggles[toggleGroupName][index]
      this.$store.dispatch('selectionConfig/setSelectionConfig', {
        ident: toggleName,
        skipSyncingOtherGroups: true,
        selectionConfig: { visible: !visible },
      })
    },
    resetDirection({ index }) {
      if (this.selectedInteractableState) {
        this.$store.dispatch('interactableService/resetDirection', { index })
      } else {
        this.resetSelection({ index, dirOnly: true })
      }
    },
    beforeUnload(event) {
      if (this.shouldAbandonTest) {
        event.preventDefault()
        event.returnValue = ''
        // Only show warning - don't submit here
        // The pageHide handler will submit if user actually leaves
      }
    },
    pageHide() {
      if (this.shouldAbandonTest) {
        // User is actually leaving the page - submit the test using sendBeacon
        // sendBeacon is reliable during page unload unlike async fetch/axios
        const testId = this.$store.getters['testRunService/currentTest']?.id
        if (testId) {
          const accessToken = this.$store.state.authentication.accessToken
          const isChallengeMode = this.$store.getters['cohortService/isChallengeModeEnabledForMe']
          const url = `${config.apiRoot}tests/${testId}/submit?isChallengeMode=${isChallengeMode}&isCTLab=${
            config.isCTLab ? 1 : 0
          }&access_token=${accessToken}`
          // Use text/plain to avoid CORS preflight - application/json triggers OPTIONS request
          // which doesn't complete before page closes
          const data = JSON.stringify({ secondsActive: 0 })
          navigator.sendBeacon(url, new Blob([data], { type: 'text/plain' }))
        }
      }
    },
    abandonExam() {
      this.showAbandonDialog = false
      this.nextRoute()
    },

    resumeExam() {
      this.showAbandonDialog = false
    },
    async updatePreviewScore() {
      this.previewScore = await this.getScorePreview()
    },
    changeTestState(state) {
      // Test run states are:
      // - INJECTOR
      // - POSITION
      // - LANDMARK
      // - QUESTIONS
      console.log('state', state)
      this.testRunState = state
    },
  },
}
