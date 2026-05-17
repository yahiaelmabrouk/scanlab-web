<template>
  <v-app class="final">
    <div v-if="isLoadedAndReady && !isViewingCriticalThinkingQuestion && !testResultAugmented" class="main-section">
      <div class="main-page">
        <ScorePreviewUltraLab
          v-if="isUltraLab && isTakingTest"
          :is-admin="isAdmin"
          :is-sandbox="isSandbox"
          :is-manager="isManager"
          :is-freebie="isFreebie"
        />
        <ScorePreviewContrast
          v-else-if="isContrastLab && isTakingTest"
          :is-admin="isAdmin"
          :is-sandbox="isSandbox"
          :is-answered-current-question="isAnsweredCurrentQuestionOrStartScan"
          :is-manager="isManager"
          :is-freebie="isFreebie"
        />
        <ScorePreviewResolution
          v-else-if="isResolutionLab && isTakingTest"
          :is-admin="isAdmin"
          :is-sandbox="isSandbox"
          :is-resolution-lab="isResolutionLab"
          :is-answered-current-question="isAnsweredCurrentQuestionOrStartScan"
          :is-manager="isManager"
          :is-freebie="isFreebie"
        />
        <ScorePreviewMRBasic
          v-else-if="!isCTLab && !isUltraLab && !isContrastLab && !isResolutionLab && isTakingTest"
          :is-admin="isAdmin"
          :is-sandbox="isSandbox"
          :is-answered-current-question="isAnsweredCurrentQuestionOrStartScan"
          :is-manager="isManager"
          :is-freebie="isFreebie"
        />
        <v-card
          v-if="
            !isCTLab &&
            !isUltraLab &&
            !isFreebie &&
            testRunState !== 'INJECTOR' &&
            testRunState !== 'POSITION' &&
            testRunState !== 'LANDMARK' &&
            (isManager || isAdmin || isSandbox)
          "
          :class="`score-preview-holder${
            // Show preview only when expanded, or always show it if you're a manager or student (sandbox mode)
            (!isAdmin && !isSandbox) || trafficLightsPreviewPanel === 0 ? ' force-visible' : ''
          }`"
        >
          <v-expansion-panels v-model="trafficLightsPreviewPanel" accordion>
            <v-expansion-panel style="background-color: #fffef9">
              <!-- eslint-disable vue-i18n/no-raw-text -->
              <v-expansion-panel-header>
                {{ $t('global.score_preview', languageCode) }}
                {{
                  (isAdmin || isSandbox) && previewScore && previewScore.score >= 0 && trafficLightsPreviewPanel === 0
                    ? isAnsweredCurrentQuestionOrStartScan
                      ? `(${previewScore.score}%)`
                      : `(${this.beforeAnswerPreviewScore}%)`
                    : ''
                }}
              </v-expansion-panel-header>

              <v-expansion-panel-content class="admin-only-score-preview-content">
                <div v-if="previewScore.groupScoreVariables">
                  <b-tabs content-class="mt-3" v-if="previewScore.groupScoreVariables.length > 1">
                    <b-tab
                      v-for="groupVars in previewScore.groupScoreVariables"
                      :key="groupVars.userAnswerConfigIndex"
                      :title="groupVars.userAnswerConfigIndex + 1 + ''"
                      :active="groupVars.userAnswerConfigIndex === previewScoreGroupIndex"
                      :class="'bold'"
                      @click="previewScoreGroupIndex = groupVars.userAnswerConfigIndex"
                    ></b-tab>
                  </b-tabs>

                  <table>
                    <tbody>
                      <tr v-for="analysis in previewScoreAnalysisComputed" :key="analysis.keyName">
                        <template v-if="!exceptPreviewFactorNames.includes(analysis.factorName)">
                          <!-- <td v-if="!isAnsweredCurrentQuestionOrStartScan" class="traffic-light-icon-holder">
                            <span style="color: #b60000" class="traffic-light-icon">
                              <CloseCircleIcon />
                            </span>
                          </td> -->
                          <td v-if="!isAdmin || !analysis.isBad" class="traffic-light-icon-holder">
                            <span
                              v-if="showAnalysisWrongWhenNoAnswerKeyNames.includes(analysis.factorName)"
                              style="color: #b60000"
                              class="traffic-light-icon"
                            >
                              <CloseCircleIcon />
                            </span>
                            <span
                              v-else-if="analysis.color === 'green'"
                              style="color: #006f00"
                              class="traffic-light-icon"
                            >
                              <CheckboxMarkedCircleIcon />
                            </span>
                            <span
                              v-else-if="analysis.color === 'yellow'"
                              style="color: #b4b400"
                              class="traffic-light-icon"
                            >
                              <AlertCircleIcon />
                            </span>
                            <span v-else style="color: #b60000" class="traffic-light-icon">
                              <CloseCircleIcon />
                            </span>
                          </td>
                          <td v-else class="traffic-light-icon-holder">
                            <span
                              style="color: #b60000"
                              class="traffic-light-icon"
                              v-if="
                                isOnlyShowRightOrWrong(analysis.factorName) ||
                                showAnalysisWrongWhenNoAnswerKeyNames.includes(analysis.factorName)
                              "
                            >
                              <CloseCircleIcon />
                            </span>
                            <span
                              class="traffic-light-icon"
                              :style="`background: black; color: ${analysis.color}`"
                              :title="`${analysis.value}${analysis.unit}`"
                              v-else
                            >
                              -{{ Math.round(analysis.scoreLoss) }}%</span
                            >
                          </td>
                          <td class="traffic-light-label-holder">
                            <span
                              :title="
                                isAdmin
                                  ? $t(analysis.key, languageCode, {
                                      scanlab: isCTLab ? 'ScanLabCT' : 'ScanLab™',
                                      scanlabValue: analysis.value,
                                    })
                                  : ''
                              "
                            >
                              {{ $t(`global.${analysis.keyName}`, languageCode) }}</span
                            >
                          </td>
                        </template>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
        <div class="side-section">
          <MainSidebar />
        </div>
        <div class="section-1" style="height: 100%">
          <div class="main-toolbar" :style="{ height: toolbarVisible ? '6%' : '4%' }">
            <SiemensToolbar
              :selection-ident="selectionConfigCurrentIdent"
              @update:showToolbar="handleToolbarVisibility"
            />
          </div>
          <div
            :style="{
              height: toolbarVisible ? '6%' : '4%',
              backgroundColor: 'rgb(58, 54, 54)'
            }"
          ></div>
          <div class="section-2">
            <SliceView :sliceViewIndex="0" class="slice-img" view-orientation="z" reference-line-id="a" :am-fullscreen="false" />
            <SliceView :sliceViewIndex="1" class="slice-img" view-orientation="y" reference-line-id="b" :am-fullscreen="false" />
            <SliceView :sliceViewIndex="2" class="slice-img" view-orientation="x" reference-line-id="c" :am-fullscreen="false"
              :key="isSidebarExpanded"
              :expanded="isSidebarExpanded"
            />
          </div>
          <div class="section-3" style="height: 6% !important">
            <ResponseInformation
              :child-data="childData"
              :child-concom="ChildConCom"
              :field-strengths-data="availableFieldStrengths"
              :selection-ident="selectionConfigCurrentIdent"
              :is-ultra-lab="isUltraLab"
            />
            <ExpansionBar @toggle-expand="toggleExpand" :style="computedStyle" />
          </div>
          <div class="section-5">
            <RoutineSequence
              :selection-ident="selectionConfigCurrentIdent"
              :sequence-type="sequenceType"
              :is-ultra-lab="isUltraLab"
              :should-pause-popup="shouldPausePopup"
              :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults"
              @update-data="handleUpdateData"
              @updateConCom-data="handleUpdateConComData"
              @update-sequence-data="updateSequenceType"
            />
            <FourthCom
              :selection-ident="selectionConfigCurrentIdent"
              :sequence-type="sequenceType"
              :is-ultra-lab="isUltraLab"
            />
          </div>
        </div>
        <div class="section-4">
          <RightSidebar />
        </div>
      </div>
    </div>
    <CombinedTestResults v-if="testResultAugmented" :test-results="testResultAugmented" :is-ultra-lab="isUltraLab" />
    <div v-if="!testResultAugmented">
      <LoadingBeaker
        v-if="(!isViewingCriticalThinkingQuestion && !isLoadedAndReady) || !isLoadedScreeningForm"
        :loading-percentage="progressTotal"
      />
      <CriticalThinkingQuiz v-if="!isEditingQuestion && isViewingCriticalThinkingQuestion && isLoadedScreeningForm" />
    </div>
  </v-app>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { MriMixin } from '../Mixins/MriMixin'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin'
import MainSidebar from './MainSidebar'
import SiemensToolbar from './SiemensToolbar'
import ResponseInformation from './ResponseInformation'
import RoutineSequence from './RoutineSequence'
import RightSidebar from './RightSidebar'
import ExpansionBar from './ExpansionBar'
import FourthCom from './FourthCom.vue'
import SliceView from '../SliceView.vue'
import $ from 'jquery'
import _ from 'lodash'
import LoadingBeaker from '../LoadingBeaker.vue'
import CriticalThinkingQuiz from '../CriticalThinkingQuiz.vue'
import CombinedTestResults from '../CombinedTestResults.vue'
import EventBus from '@/lib/event-bus'
import ScorePreviewUltraLab from '../ScorePreviewUltraLab.vue'
import ScorePreviewContrast from '../ScorePreviewContrast.vue'
import ScorePreviewResolution from '../ScorePreviewResolution.vue'
import ScorePreviewMRBasic from '../ScorePreviewMRBasic.vue'
import CloseCircleIcon from 'icons/CloseCircle'
import CheckboxMarkedCircleIcon from 'icons/CheckboxMarkedCircle'
import AlertCircleIcon from 'icons/AlertCircle'
import { isOnlyShowRightOrWrong, combinedResultAnalysis } from '../../util/resultAnalysis'
export default {
  mixins: [MriMixin],
  name: 'MainScreen',
  components: {
    MainSidebar,
    SiemensToolbar,
    ResponseInformation,
    RoutineSequence,
    RightSidebar,
    ExpansionBar,
    FourthCom,
    SliceView,
    LoadingBeaker,
    CriticalThinkingQuiz,
    CombinedTestResults,
    ScorePreviewUltraLab,
    ScorePreviewContrast,
    ScorePreviewResolution,
    ScorePreviewMRBasic,
    CloseCircleIcon,
    CheckboxMarkedCircleIcon,
    AlertCircleIcon,
  },
  data() {
    return {
      childData: {},
      ChildConCom: {},
      //scanTime: null,
      previewScore: {
        sliceQuantScore: {
          combinedScore: 0,
          slicePrescriptionScore: {
            combinedScore: 0,
          },
          parameterScore: {
            combinedScore: 0,
          },
        },
      },
      previewScorePoller: null,
      isOnlyShowRightOrWrong,
      tabIndex: 0,
      combinedResultAnalysis,
      previewScoreGroupIndex: 0,
      trafficLightsPreviewPanel: false,
      toolbarVisible: false,
      shouldPausePopup: true,
      expandedStyle: {
        top: '0px',
        position: 'relative',
      },
      windowHeight: window.innerHeight,
    }
  },
  computed: {
    ...mapState('dicomService', ['isLoaded', 'progressTotal']),
    ...mapState('questionService', ['isLoadingScreeningFormPatientInfo']),
    ...mapState('selectionConfig', ['selectionConfigCurrentIdent']),
    ...mapGetters('dicomService', ['availableFieldStrengths']),
    ...mapGetters('selectionConfig', ['selectionConfigCurrent']),
    ...mapGetters('testRunService', ['isTakingTest']),
    isLoadedAndReady() {
      return this.isLoaded && this.$store.state.selectionConfig.ready && this.$store.state.threeJSSVGProvider.hasLoaded
    },
    isSidebarExpanded() {
      return this.$store.getters.isSidebarExpanded
    },
    isSandbox() {
      return this.test ? this.test.isSandbox : false
    },
    selectionIdent() {
      return this.selectionConfigCurrentIdent
    },
    sequenceType() {
      console.log('selection config current', this.selectionConfigCurrent)
      return this.selectionConfigCurrent.sequenceType
    },
    computedStyle() {
      return {
        height: 'fit-content',
        top: this.isSidebarExpanded ? '46vh' : '0px',
        position: 'relative',
      }
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
  },
  methods: {
    handleToolbarVisibility(state) {
      this.toolbarVisible = state
    },
    /*
    handleScanTimeGeneratedUp(scanTime) {
      console.log('scanTime in Main Screen=====', scanTime)
      this.scanTime = scanTime // Emit se scanTime store karenge
    },
    */
    toggleExpand() {
      this.$store.commit('TOGGLE_SIDEBAR')
    },
    handleUpdateData(data) {
      this.childData = data
    },
    handleUpdateConComData(data) {
      this.ChildConCom = data
    },
    updateSequenceType(value) {
      this.sequenceType = value
      // console.log('selectedSequenceType main me =========', this.sequenceType)
    },
    updateHeight() {
      this.windowHeight = window.innerHeight
    },
  },
  // async mounted() {
  //   this.$store.dispatch('questionService/loadQuestionSet', { questionSetId })

  // },
  async mounted() {
    console.log('counting: main mounted')
    this.updateHeight()
    EventBus.$emit('mainScreenVisible', true) // Emit event when MainScreen is mounted
    // Has to be bound regardless, because we don't know if we're taking a test until later
    window.addEventListener('beforeunload', this.beforeUnload)
    window.addEventListener('resize', this.updateHeight)
    this.$store.dispatch('stackService/setIsOnMriView', true)
    this.$store.dispatch('stackService/resetMriModelBbox')

    await this.resetMRI()
    let elRoot = $(this.$el)
    let el = elRoot.find('.box-container')[0]
    // This is "mounted" after the SliceView ones are, except for waiting for selectionConfig.ready, meaning that the SliceView would add the instances of StackVolumeSlection of the old selectionsConfigs before the below sets them right
    let dicomFileSetId = this.$route.query.dicom
    let questionSetId = this.$route.query.questionSet
    let testId = this.$route.query.test

    if (this.isCTLab) {
      this.resetMRIScanState()
      this.resetInjectorState()

      // Set testInjectionMode default
      this.setTestInjectionMode(this.$store.getters['user/injectionMode'])
      this.setPowerInjectorCurrentDuration(0.0)
      this.setLastPowerInjectorCurrentDuration(0.0)
    }

    this.$store.state.selectionConfig.isUltraLab = this.isUltraLab

    if (this.isUltraLab) {
      console.log('+++++++++++++++++++++++ this is ultralab')
    }

    this.$store.dispatch('questionService/setIsEditingQuestion', { isEditingQuestion: this.isEditingQuestion }) // this makes isTakingTest accurate
    this.$store.dispatch('selectionConfig/init')
    await this.$store.dispatch('threeJSSVGProvider/init')
    if (questionSetId) {
      this.$store.dispatch('questionService/loadQuestionSet', { elProgressBar: el, questionSetId, dicomFileSetId })
    } else if (testId && this.test) {
      this.showSandboxModeDialog = this.test.isSandbox === true
      this.$store.dispatch('questionService/loadCriticalThinkingQuestionsFromTest', { test: this.test })
      const questionSetId = _.find(this.test.questions, { type: 'QUESTIONSET' }).id
      this.$store.dispatch('questionService/loadQuestionSet', { questionSetId })
      if (this.isCTLab) {
        this.setIsLoadingScreeningFormPatientInfo(true)
      }
    } else if (testId && !this.test) {
      // requesting a test but none loaded in session
      this.$router.push({ name: 'region-selection' })
    } else {
      // No initial selections available, add preset selection group

      this.$store.dispatch('selectionConfig/addSelectionConfigGroup', { groupId: 0 })
      this.$store.dispatch('dicomService/loadDicomGroup', { dicomFileSetId })
    }
    this.$store.dispatch('questionService/getListPatientModel')
    // await this.$store.dispatch('selectionConfig/selectTool', { tool: 'pan' })
    this.configAngioExams()

    const INITIAL_LOADING_DURATION = 7000 // 7 seconds, adjust as needed
    setTimeout(() => {
      console.log('initial loading phase over')
      this.shouldPausePopup = false
    }, INITIAL_LOADING_DURATION)
  },
  async beforeDestroy() {
    window.removeEventListener('beforeunload', this.beforeUnload)
    window.removeEventListener('resize', this.updateHeight)
    EventBus.$emit('mainScreenVisible', false) // Emit event when MainScreen is destroyed
    if (this.previewScorePoller) {
      clearInterval(this.previewScorePoller)
    }
    if (this.shouldAbandonTest) {
      // Chose to abandon the test
      await this.$store.dispatch('questionService/submitTestRun', {})
    }

    this.$store.dispatch('stackService/setIsOnMriView', false)

    await this.$store.dispatch('testRunService/reset', {})
    await this.$store.dispatch('questionService/resetTest', {})
    this.resetMRI()
  },
  beforeRouteLeave(to, from, next) {
    if (this.shouldAbandonTest) {
      this.nextRoute = next
      next(false)
      this.showAbandonDialog = true
    } else {
      next()
    }
  },
}
</script>

<style scoped lang="scss">
.main-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: #3a3636;
  transition: height 0.3s ease-in-out;
  z-index: 10;
  /* Ensures it stays on top */
}

.section-1 {
  position: relative;
  /* Ensures absolute child (`main-toolbar`) stays within bounds */
  height: 100vh;
  /* Set fixed height */
}

// .section-2 {
//   margin-top: 3%; /* Adjust based on toolbar's height */
// }

/* dropdown background style */
.theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

.theme--light.v-list {
  background: #565656;
  color: rgb(0 0 0 / 87%);
}

.theme--light.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: rgb(255 255 255 / 87%);
}

.theme--light.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: rgb(255 255 255 / 87%);
}

::v-deep .v-application .primary--text {
  color: #ffffff !important;
  caret-color: #ffffff !important;
}

::v-deep .v-list-item__title {
  color: #ffffff !important;
}

::v-deep .v-list-item--link:before {
  background-color: lightgray !important;
}

.active-list-item {
  background-color: darkgray;
}

::v-deep .v-select .v-list {
  max-height: 150px;
  overflow-y: auto;
}

::v-deep .v-select .v-list::-webkit-scrollbar {
  width: 10px;
}

::v-deep .v-select .v-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::v-deep .v-select .v-list::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 10px;
}

::v-deep .v-select .v-list::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}

/* dropdown background style */
.main-page {
  display: flex;
  height: 100%;
  width: 100%;
}

// .main-toolbar {
//   height: 6% !important;
// }

.slice-img {
  border: 2px solid gray !important;
  border-right: 0px !important;
  border-bottom: 0px !important;
}

.main-section {
  width: 100%;
  height: 100%;
  padding: 0px !important;
  padding-right: 0px !important;
  padding-left: 0px !important;
}

.side-section {
  width: 31%;
  height: 100%;
  background: black;
}

.section-1 {
  display: flex;
  flex-direction: column;
  width: 73%;
  height: 100%;
}

.section-2 {
  display: flex;
  flex-direction: row;
  height: 44%;
  justify-content: space-evenly;
  width: 100%;
  background: black;
}

.section-3 {
  display: flex;
  background: black;
}

.section-4 {
  width: 5%;
  height: 100%;
}

.section-5 {
  display: flex;
  height: 46%;
}

.final {
  height: 100%;
}

@media (max-width: 1200px) {
  .side-section {
    width: 100% !important;
    height: auto;
    background: black;
    /* Ensuring background color stays consistent */
  }

  .section-1 {
    width: 100%;
    height: auto;
    /* Adjusting height for smaller screens */
  }

  .section-2 {
    flex-direction: column;
    height: auto;
    /* Adjusting height for smaller screens */
  }

  .slice-img {
    width: 100%;
    margin-bottom: 15px;
    /* Ensuring images stack properly */
  }
}

@media (max-width: 768px) {
  .side-section {
    width: 100%;
    height: auto;
    background: black;
    /* Ensuring background color stays consistent */
  }

  .section-1 {
    width: 100%;
    height: auto;
    /* Adjusting height for smaller screens */
  }

  .section-2 {
    flex-direction: column;
    height: auto;
    /* Adjusting height for smaller screens */
  }

  .slice-img {
    width: 100%;
    margin-bottom: 10px;
    /* Ensuring images stack properly */
  }
}

@media (max-width: 480px) {
  .main-toolbar {
    height: auto;
    margin-bottom: 20px;
    /* Adjusting toolbar spacing */
  }

  .side-section {
    width: 100%;
    height: auto;
  }

  .section-1 {
    width: 100%;
    height: auto;
    /* Adjusting height for smaller screens */
  }

  .section-2 {
    flex-direction: column;
    justify-content: space-evenly;
    height: auto;
    /* Adjusting height for smaller screens */
  }

  .slice-img {
    width: 100%;
    margin-bottom: 10px;
    /* Ensuring images stack properly */
  }
}

.admin-only-score-preview-content {
  height: 280px;
  overflow-y: scroll;
}

.force-visible {
  opacity: 1 !important;
}

.score-preview-holder {
  position: fixed;
  opacity: 0;
  top: 65px;
  right: 0;
  z-index: 11;

  &:hover {
    opacity: 1;
  }

  .traffic-light-icon-holder {
    padding-right: 8px;

    .traffic-light-icon {
      font-size: 20px;
    }
  }

  .traffic-light-label-holder {
    text-align: left;
  }
}

::v-deep .scantime-row-right[data-v-0b0a1924] {
  height: 100%;
}

::v-deep .scantime-row[data-v-0b0a1924] {
  height: 100%;
}

::v-deep .scan[data-v-0b0a1924] {
  padding: 0px !important;
  height: 100%;
}

::v-deep .col-12 {
  padding-bottom: 0px !important;
  padding-top: 0px !important;
  height: 100%;
}
</style>
