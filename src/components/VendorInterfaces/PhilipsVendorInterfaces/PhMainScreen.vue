<template>
  <v-app class="final">
    <div
      v-if="isLoadedAndReady && !isViewingCriticalThinkingQuestion && !testResultAugmented"
      class=""
      style="height: 100% !important"
    >
      <NavBar />
      <div class="main-page">
        <ScorePreviewUltraLab
          v-if="test"
          :is-admin="isAdmin"
          :is-sandbox="test.isSandbox"
          :is-ultra-lab="isUltraLab"
          :is-answered-current-question="isAnsweredCurrentQuestion"
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
            (isManager || isAdmin || test.isSandbox)
          "
          :class="`score-preview-holder${
            // Show preview only when expanded, or always show it if you're a manager or student (sandbox mode)
            (!isAdmin && !test.isSandbox) || trafficLightsPreviewPanel === 0 ? ' force-visible' : ''
          }`"
        >
          <v-expansion-panels v-model="trafficLightsPreviewPanel" accordion>
            <v-expansion-panel style="background-color: #fffef9">
              <!-- eslint-disable vue-i18n/no-raw-text -->
              <v-expansion-panel-header>
                {{ $t('global.score_preview', languageCode) }}
                {{
                  (isAdmin || test.isSandbox) &&
                  previewScore &&
                  previewScore.score >= 0 &&
                  trafficLightsPreviewPanel === 0
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
          <MainSidebar @action-selected="handleActionSelected" />
        </div>

        <div class="section-1">
          <div class="main-toolbar">
            <SiemensToolbar />
          </div>
          <div class="section-2" v-if="selectedAction === 'play'">
            <SliceView class="slice-img" view-orientation="z" reference-line-id="a" :am-fullscreen="false" />
            <SliceView class="slice-img" view-orientation="y" reference-line-id="b" :am-fullscreen="false" />
            <SliceView class="slice-img" view-orientation="x" reference-line-id="c" :am-fullscreen="false" />
          </div>

          <div class="section-3" v-if="selectedAction === 'play'">
            <SiemensScanInfo />
            <ResponseInformation />
            <!-- <ExpansionBar /> -->
          </div>
          <div class="section-5" v-if="selectedAction === 'play'">
            <RoutineSequence :selection-ident="selectionConfigCurrentIdent" />
            <FourthCom />
          </div>
          <div v-if="selectedAction === 'review'" class="grid-container">
            <div class="grid-item"></div>
            <div class="grid-item"></div>
            <div class="grid-item"></div>
            <div class="grid-item"></div>
          </div>
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
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import MainSidebar from './PhMainSidebar'
import SiemensToolbar from './PhSiemensToolbar'
import SiemensScanInfo from './PhSiemensScanInfo.vue'
import ResponseInformation from './PhResponseInformation'
import RoutineSequence from './PhRoutineSequence'
import RightSidebar from './PhRightSidebar'
import ExpansionBar from './PhExpansionBar'
import FourthCom from './PhFourthCom.vue'
import SliceView from '../../SliceView.vue'
import LoadingBeaker from '../../LoadingBeaker.vue'
import CriticalThinkingQuiz from '../../CriticalThinkingQuiz.vue'
import CombinedTestResults from '../../CombinedTestResults.vue'
import navBar from './PhnavBar.vue'
import NavBar from './PhnavBar.vue'
import $ from 'jquery'
import _ from 'lodash'
import EventBus from '@/lib/event-bus'
import ScorePreviewUltraLab from '../../ScorePreviewUltraLab.vue'
import CloseCircleIcon from 'icons/CloseCircle'
import CheckboxMarkedCircleIcon from 'icons/CheckboxMarkedCircle'
import AlertCircleIcon from 'icons/AlertCircle'
import { isOnlyShowRightOrWrong, combinedResultAnalysis } from '../../../util/resultAnalysis'
export default {
  mixins: [MriMixin, SelectionConfigMixin],
  components: {
    MainSidebar,
    SiemensToolbar,
    SiemensScanInfo,
    ResponseInformation,
    RoutineSequence,
    // eslint-disable-next-line vue/no-unused-components
    RightSidebar,
    // eslint-disable-next-line vue/no-unused-components
    ExpansionBar,
    FourthCom,
    SliceView,
    LoadingBeaker,
    CriticalThinkingQuiz,
    CombinedTestResults,
    navBar,
    NavBar,
    ScorePreviewUltraLab,
    CloseCircleIcon,
    CheckboxMarkedCircleIcon,
    AlertCircleIcon,
  },
  data() {
    return {
      selectedAction: 'play',
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
    }
  },

  computed: {
    ...mapState('dicomService', ['isLoaded', 'progressTotal']),
    ...mapState('questionService', ['isLoadingScreeningFormPatientInfo']),
    ...mapGetters('testRunService', ['isTakingTest']),
    isLoadedAndReady() {
      return this.isLoaded && this.$store.state.selectionConfig.ready && this.$store.state.threeJSSVGProvider.hasLoaded
    },
    valueText() {
      return this.isLoadedAndReady ? 'Loaded and Ready' : 'Not Loaded'
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
  watch: {
    isResolutionLab(newVal) {
      if (newVal) {
        this.$store.dispatch('selectionConfig/applyScientificModePreferences')
      }
    },
  },
  methods: {
    handleActionSelected(action) {
      this.selectedAction = action
    },
  },
  async mounted() {
    EventBus.$emit('mainScreenVisible', true) // Emit event when MainScreen is mounted
    // Has to be bound regardless, because we don't know if we're taking a test until later
    window.addEventListener('beforeunload', this.beforeUnload)

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

      await this.$store.dispatch('selectionConfig/addSelectionConfigGroup', { groupId: 0 })
      await this.$store.dispatch('dicomService/loadDicomGroup', { dicomFileSetId })
      this.$store.dispatch('selectionConfig/applyScientificModePreferences')
    }
    this.$store.dispatch('questionService/getListPatientModel')
    // await this.$store.dispatch('selectionConfig/selectTool', { tool: 'pan' })
    this.configAngioExams()
  },
  async beforeDestroy() {
    window.removeEventListener('beforeunload', this.beforeUnload)
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

<style scoped>
.main-page {
  display: flex;
  height: 100%;
  width: 100%;
}

.main-toolbar {
  height: 4.2% !important;
}

::v-deep .v-card__text {
  font-size: 0.7rem !important;
}

.slice-img {
  border: 2px solid gray !important;
  border-right: 0px !important;
  border-bottom: 0px !important;
}

.main-section {
  width: 100%;
  height: 100%;
  /* padding: 0px !important; */
  padding-bottom: 0.4rem;
  padding-right: 0px !important;
  padding-left: 0px !important;
}

.side-section {
  width: 20%;
  height: 100%;
  background: #d5d7d7;
}

.section-1 {
  display: flex;
  flex-direction: column;
  width: 80%;
  height: 100%;
}

.section-2 {
  display: flex;
  flex-direction: row;
  /* height: 100%; */
  justify-content: space-evenly;
  width: 100%;
  background: #d5d7d7;
  padding: 0 10px 0px 0px;
}

.section-3 {
  display: flex;
  width: 100%;
  background-color: #676866;
}

.section-4 {
  width: 5%;
  height: 100%;
}

.section-5 {
  display: flex;
  flex-grow: 1;
  /* min-height: 45%; */
  background-color: #676866 !important;
  overflow: auto;
}

.section-5 > div {
  flex: 1;
  height: auto;
}

@media screen and (max-width: 1680px) and (max-height: 1050px) {
  .section-5 {
    display: flex;
    min-height: 51.8% !important;
    background-color: #676866 !important;
  }
}

@media screen and (max-width: 1600px) and (max-height: 900px) {
  .section-5 {
    display: flex;
    min-height: 56.6% !important;
    background-color: #676866 !important;
  }
}

.final {
  height: 100%;
}

::v-deep .theme--light.v-select .v-select__selections {
  color: rgb(0, 0, 0) !important;
}

@media only screen and (max-width: 768px) {
  /* Adjust styles for smaller screens */
  .side-section {
    width: 100%;
  }

  .section-1 {
    width: 100%;
  }

  /* Add more adjustments as needed */
}

@media only screen and (max-width: 1240px) {
  .section-3 {
    display: flex;
    font-size: 12px;
  }

  .TR {
    padding-right: 1.5rem;
  }

  .voxel {
    width: 7.3rem;
  }
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
}

.grid-item {
  background-color: black;
  height: 388px;
}

@media screen and (max-width: 1600px) and (max-height: 900px) {
  ::v-deep .v-expansion-panel-header {
    padding: 0px 10px 0px 15px !important;
    min-height: 40px !important;
  }
}
</style>
