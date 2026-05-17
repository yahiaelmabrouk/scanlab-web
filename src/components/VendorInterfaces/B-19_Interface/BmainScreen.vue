<template>
  <v-app>
    <div v-if="isLoadedAndReady && !isViewingCriticalThinkingQuestion && !testResultAugmented" class="main-section">
      <ScorePreviewUltraLab
        v-if="isUltraLab"
        :is-admin="isAdmin"
        :is-sandbox="isSandbox"
        :is-manager="isManager"
        :is-freebie="isFreebie"
      />
      <ScorePreviewContrast
        v-else-if="isContrastLab"
        :is-admin="isAdmin"
        :is-sandbox="isSandbox"
        :is-answered-current-question="isAnsweredCurrentQuestionOrStartScan"
        :is-manager="isManager"
        :is-freebie="isFreebie"
      />
      <ScorePreviewResolution
        v-else-if="isResolutionLab"
        :is-admin="isAdmin"
        :is-sandbox="isSandbox"
        :is-resolution-lab="isResolutionLab"
        :is-answered-current-question="isAnsweredCurrentQuestionOrStartScan"
        :is-manager="isManager"
        :is-freebie="isFreebie"
      />
      <ScorePreviewMRBasic
        v-else-if="!isCTLab && !isUltraLab && !isContrastLab && !isResolutionLab"
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
      <BnavBar />
      <div class="main-3">
        <div class="main-2">
          <div class="section-1">
            <SliceView class="slice-img" view-orientation="z" reference-line-id="a" :am-fullscreen="false" />
            <SliceView class="slice-img" view-orientation="y" reference-line-id="b" :am-fullscreen="false" />
            <SliceView class="slice-img" view-orientation="x" reference-line-id="c" :am-fullscreen="false" />
          </div>
          <div class="section-2">
            <BsliceImages />
            <BsliceImages />
            <BsliceImages />
            <BsliceImages />
            <BsliceImages />
            <BsliceImages />
            <BsliceImages />
            <BsliceImages />
            <BsliceImages />
            <BsliceImages />
            <BsliceImages />
            <BsliceImages />
          </div>
          <div class="section-3">
            <BsliceInformation
              :child-data="childData"
              :child-concom="ChildConCom"
              :field-strengths-data="availableFieldStrengths"
              :scan-time="scanTime"
              :selection-ident="selectionConfigCurrentIdent"
              :is-ultra-lab="isUltraLab"
              :sequence-type="sequenceType"
            />
          </div>
          <div class="section-4">
            <div class="sub-section-1">
              <BquestionArea :freebie="stackQuestion && stackQuestion.freebie" />
            </div>
            <div class="sub-section-2">
              <BprogramSequence
                :selection-ident="selectionConfigCurrentIdent"
                :sequence-type="sequenceType"
                :is-ultra-lab="isUltraLab"
                :should-pause-popup="shouldPausePopup"
                :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults"
                @update-data="handleUpdateData"
                @updateConCom-data="handleUpdateConComData"
                @update-sequence-data="updateSequenceType"
                @scan-time-generated-up="handleScanTimeGeneratedUp"
              />
            </div>
            <div class="section-5">
              <BsliceButtons />
            </div>
          </div>
        </div>
        <div class="right-side-bar">
          <BsideBar />
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
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import BnavBar from './BnavBar.vue'
import BsliceView from './BsliceView.vue'
import BsliceImages from './BsliceImages.vue'
import BsliceInformation from './BsliceInformation.vue'
import BquestionArea from './BquestionArea.vue'
import BprogramSequence from './BprogramSequence.vue'
import BsliceButtons from './BsliceButtons.vue'
import BsideBar from './BsideBar.vue'
import SliceView from '../../SliceView.vue'
import CombinedTestResults from '../../CombinedTestResults.vue'
import LoadingBeaker from '../../LoadingBeaker.vue'
import CriticalThinkingQuiz from '../../CriticalThinkingQuiz.vue'
import $ from 'jquery'
import _ from 'lodash'
import EventBus from '@/lib/event-bus'
import ScorePreviewUltraLab from '../../ScorePreviewUltraLab.vue'
import ScorePreviewContrast from '../../ScorePreviewContrast.vue'
import ScorePreviewResolution from '../../ScorePreviewResolution.vue'
import ScorePreviewMRBasic from '../../ScorePreviewMRBasic.vue'
// eslint-disable-next-line no-unused-vars
import CloseCircleIcon from 'icons/CloseCircle'
// eslint-disable-next-line no-unused-vars
import CheckboxMarkedCircleIcon from 'icons/CheckboxMarkedCircle'
// eslint-disable-next-line no-unused-vars
import AlertCircleIcon from 'icons/AlertCircle'
import { isOnlyShowRightOrWrong, combinedResultAnalysis } from '../../../util/resultAnalysis'
export default {
  mixins: [MriMixin, ScanButtonMixin],
  name: 'BmainScreen',
  components: {
    BnavBar,
    // eslint-disable-next-line vue/no-unused-components
    BsliceView,
    BsliceImages,
    BsliceInformation,
    BquestionArea,
    BprogramSequence,
    BsliceButtons,
    BsideBar,
    SliceView,
    CombinedTestResults,
    LoadingBeaker,
    CriticalThinkingQuiz,
    ScorePreviewUltraLab,
    ScorePreviewContrast,
    ScorePreviewResolution,
    ScorePreviewMRBasic,
  },
  data() {
    return {
      childData: {},
      ChildConCom: {},
      scanTime: null,
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
      shouldPausePopup: true,
    }
  },
  methods: {
    handleScanTimeGeneratedUp(scanTime) {
      this.scanTime = scanTime // Emit se scanTime store karenge
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
  },
  computed: {
    ...mapState('questionService', ['isLoadingScreeningFormPatientInfo']),
    ...mapState('dicomService', ['isLoaded', 'progressTotal']),
    ...mapGetters('testRunService', ['isTakingTest']),
    ...mapGetters('dicomService', ['availableFieldStrengths']),
    ...mapGetters('selectionConfig', ['selectionConfigCurrent']),
    ...mapGetters('scanTimeConfig', [
      'getAutoAlignOptions',
      'getSelectedAutoAlign',
      'getLocalSoftwareVersionPreference',
    ]),
    isLoadedAndReady() {
      return this.isLoaded && this.$store.state.selectionConfig.ready && this.$store.state.threeJSSVGProvider.hasLoaded
    },
    isSandbox() {
      return this.test ? this.test.isSandbox : false
    },
    sequenceType() {
      console.log('selection config current', this.selectionConfigCurrent)
      return this.selectionConfigCurrent.sequenceType
    },

    localSoftwareVersionPreference() {
      return this.getLocalSoftwareVersionPreference
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
  async mounted() {
    // Ensure myCohort is loaded before revertInitialSelections reads isScientificModeEnabled
    await this.$store.dispatch('cohortService/loadUserCohorts')

    console.log('localSoftwareVersionPreference==========', this.localSoftwareVersionPreference)
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
    console.log()
    console.log('this.isUltraLab', this.isUltraLab)

    this.$store.dispatch('questionService/setIsEditingQuestion', { isEditingQuestion: this.isEditingQuestion }) // this makes isTakingTest accurate
    this.$store.dispatch('selectionConfig/init')
    await this.$store.dispatch('threeJSSVGProvider/init')
    if (questionSetId) {
      await this.$store.dispatch('questionService/loadQuestionSet', { elProgressBar: el, questionSetId, dicomFileSetId })
    } else if (testId && this.test) {
      this.showSandboxModeDialog = this.test.isSandbox === true
      this.$store.dispatch('questionService/loadCriticalThinkingQuestionsFromTest', { test: this.test })
      const questionSetId = _.find(this.test.questions, { type: 'QUESTIONSET' }).id
      await this.$store.dispatch('questionService/loadQuestionSet', { questionSetId })
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
.admin-only-score-preview-content {
  height: 280px;
  overflow-y: scroll;
}

.score-preview-holder {
  position: fixed;
  opacity: 0;
  top: 65px;
  right: 0;
  z-index: 10;
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

::v-deep .v-application--wrap {
  min-height: auto;
}
.main-section {
  /* height: 1110px; */
  width: 100%;
}
.main-section-2 {
  display: flex;
}
.section-1 {
  display: flex !important;
  justify-content: space-evenly;
  /* height: 50% !important; */
  width: 100% !important;
  background: black;
}
.slice-img {
  border: 2px solid gray !important;
  border-right: 0px !important;
  border-bottom: 0px !important;
}
.section-2 {
  display: flex !important;
  height: 10% !important;
  width: 100% !important;
}
.section-3 {
  height: 5% !important;
  width: 100% !important;
}
.section-4 {
  display: flex !important;
  height: 445px !important;
  width: 100% !important;
}
.sub-section-1 {
  max-width: 35% !important;
  width: 35% !important;
}

.sub-section-2 {
  max-width: 60% !important;
  width: 60% !important;
  height: 100%;
}
.section-5 {
  max-width: 5% !important;
  width: 5% !important;
}
.sub-section-3 {
  display: flex;
  height: 100% !important;
}
.main-2 {
  height: 100% !important;
  width: 98% !important;
}
.main-3 {
  display: flex !important;
  /* height: 100% !important; */
  width: 100% !important;
}

.right-side-bar {
  width: 2% !important;
  background: black !important;
  height: 100%;
  /* background: #2A2A62  !important; */
  color: #000;
}
::v-deep .theme--light.v-select .v-select__selections {
  color: #000000de !important;
  min-height: 10px !important;
}
::v-deep .v-application .primary--text {
  color: #000 !important;
  caret-color: #000 !important;
}
</style>
