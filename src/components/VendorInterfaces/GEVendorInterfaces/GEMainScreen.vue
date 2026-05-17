<template>
  <v-app class="final">
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
                                    scanlab: isCTLab ? 'ScanLabCT' : 'ScanLabƒ,›',
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
      <GENavBar
        style="width: 100%; border-radius: 0px !important; background-color: #2f3d6e !important"
        @show-patient-record="showPatientRecord"
        @show-medical-database="showMedicalDatabase"
        @show-protocol-manager="showProtocolManager"
        @show-initial-exam="showInitialExam"
        :style="{
          height:
            displayPatientRecord && displayMedicalDatabase && displayProtocolManager
              ? '4% !important'
              : '6% !important',
        }"
      />
      <div class="main-page">
        <GECanvasDisplay v-if="isToolbarActive" @close="handleCloseToolbar" />
        <GEAutoVoiceDisplay v-if="autoVoice" @close="autoVoice = false" />
        <GESelectRxWidget v-if="isSelectRxWidgetActiveFlag" />
        <GECopyRxWidget v-if="IsCopyRxWidgetActiveFlag" />
        <GEImagingOption
          :selection-ident="selectionConfigCurrentIdent"
          :is-ultra-lab="isUltraLab"
          :sequence-type="sequenceType"
        />
        <GESARDisplay v-if="showSAR" @close="handleClose" />

        <GEPatientRecord v-if="displayPatientRecord && !displayMedicalDatabase && !displayProtocolManager" />
        <GEMedicalDatabase v-if="displayMedicalDatabase && !displayPatientRecord && !displayProtocolManager" />
        <GEProtocolManager
          v-if="displayProtocolManager && !displayPatientRecord && !displayMedicalDatabase"
          style="width: 75%"
        />
        <div class="side-section" v-if="!displayPatientRecord && !displayMedicalDatabase && !displayProtocolManager">
          <GEMainSidebar
            @action-selected="handleActionSelected"
            v-if="!displayPatientRecord && !displayMedicalDatabase && !displayProtocolManager"
          />
        </div>

        <div
          class="section-1"
          style="background: #6875a2; height: 100%"
          v-if="!displayPatientRecord && !displayMedicalDatabase && !displayProtocolManager"
        >
          <div class="section-2" v-if="selectedAction === 'play'" style="height: 524px">
            <!-- <GESliceView class="slice-img" view-orientation="z" reference-line-id="a" :am-fullscreen="false" />
              <GESliceView class="slice-img" view-orientation="y" reference-line-id="b" :am-fullscreen="false" />
              <GESliceView class="slice-img" view-orientation="x" reference-line-id="c" :am-fullscreen="false" /> -->
            <div class="expand1" v-if="!isCanvasActiveFlag"></div>
            <div v-else style="display: flex; flex-direction: row; justify-content: space-between; width: 100%">
              <div class="expand1-column">
                <GESliceView class="slice-img" view-orientation="z" reference-line-id="a" :am-fullscreen="false" />
              </div>
              <div class="divider"></div>
              <div class="expand1-column">
                <GESliceView class="slice-img" view-orientation="y" reference-line-id="b" :am-fullscreen="false" />
              </div>
            </div>
          </div>
          <div class="section-2" style="height: 524px">
            <div class="section-11" style="height: 100%">
              <div style="height: 5%">
                <v-toolbar flat dense style="height: 100% !important; background-color: #101d4a !important">
                  <v-toolbar-title v-if="!isCanvasActiveFlag">3-Plane Localizer</v-toolbar-title>
                  <v-toolbar-title v-else>{{ toolbarTitle }}</v-toolbar-title>
                  <v-spacer />
                  <div
                    @click="toggleGrxToolbar"
                    style="
                      color: black;
                      background: #8894ba;
                      width: 40px;
                      cursor: pointer;
                      margin-right: 7px;
                      border-radius: 4px;
                      box-shadow: 1px 1px 1px rgba(120, 120, 120, 0.8);
                      border: 2px solid rgba(0, 0, 0, 0.5);
                    "
                  >
                    <img src="@/assets/ge_img/grx_btn.png" class="icon" />
                  </div>

                  <div
                    @click="toggleAutoVoiceDisplay"
                    style="
                      color: black;
                      background: #8894ba;
                      width: 40px;
                      cursor: pointer;
                      border-radius: 4px;
                      box-shadow: 1px 1px 1px rgba(120, 120, 120, 0.8);
                      border: 2px solid rgba(0, 0, 0, 0.5);
                    "
                  >
                    <img src="@/assets/ge_img/man_btn.png" class="icon" />
                  </div>
                  <v-spacer />
                  <span><AlarmIcon />{{ scanTime ? scanTime : '1:15' }}</span>
                  <span
                    @click="toggleExpand"
                    style="
                      font-size: 10px;
                      cursor: pointer;
                      color: black;
                      padding: 3px;
                      background-color: #8894ba;
                      border-radius: 4px;
                      box-shadow: 1px 1px 1px rgba(120, 120, 120, 0.8);
                      border: 2px solid rgba(0, 0, 0, 0.5);
                    "
                  >
                    {{ !isExpanded ? '◀' : '▶' }}
                  </span>
                </v-toolbar>
              </div>
              <GEThreePlaneLocalizer
                :selection-ident="selectionConfigCurrentIdent"
                :is-ultra-lab="isUltraLab"
                :sequence-type="sequenceType"
                style="height: 82%"
              />

              <textarea name="" id="" cols="30" rows="2">
                {{ !this.isCanvasActiveFlag ? 'Selected coil is not connected.' : '' }} </textarea
              >
              <div class="cont" style="height: 4%">
                <div class="toolbar-left">
                  <p v-if="!isCanvasActiveFlag" style="font-size: 14px">
                    WB-SAR:1.31 B<sub>1+</sub>RMS:1.57uT Mode:First
                  </p>
                  <p v-else style="font-size: 14px">WB-SAR:3.47 B<sub>1+</sub>RMS:2.01uT Mode:First</p>
                </div>
                <div class="toolbar-right">
                  <b style="margin-right: 4px; font-size: 14px">dB/dt:First</b>
                </div>
              </div>
            </div>
            <div class="expand2" v-if="isExpanded">
              <GESliceView
                v-if="isCanvasActiveFlag"
                class="slice-img"
                view-orientation="x"
                reference-line-id="c"
                :am-fullscreen="false"
              />
            </div>
            <!-- <plainBeside v-show="plainBesideShow"/> -->
            <GEThreePlainLocBeSideBarTabs
              :selection-ident="selectionConfigCurrentIdent"
              :is-ultra-lab="isUltraLab"
              :sequence-type="sequenceType"
              v-else
            />
          </div>
        </div>

        <div class="side-section">
          <GEMainRightSidebar @action-selected="handleActionSelected" />
        </div>
      </div>

      <GEFooterBar
        style="width: 100%; border-radius: 0px !important; background-color: #2f3d6e !important"
        @showSAR="toggleSARDisplay"
        :style="{
          height:
            displayPatientRecord && displayMedicalDatabase && displayProtocolManager
              ? '5% !important'
              : '6% !important',
        }"
      />
      <!-- <GESARDisplay v-if="showSAR"></GESARDisplay> -->
    </div>
    <CombinedTestResults v-if="testResultAugmented" :test-results="testResultAugmented" />
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
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin.js'
import GEMainSidebar from './GEMainSidebar'
import GEMainRightSidebar from './GEMainRightSidebar'
import GERightSidebar from './GERightSidebar'
import GESliceView from './GESliceView.vue'
import LoadingBeaker from '@/components/LoadingBeaker.vue'
import GENavBar from './GEnavBar.vue'
import GEThreePlaneLocalizer from './GEThreePlaneLocalizer.vue'
import CriticalThinkingQuiz from '@/components/CriticalThinkingQuiz.vue'
import CombinedTestResults from '../../CombinedTestResults.vue'
import GEFooterBar from './GEFooterBar.vue'
import GESARDisplay from './GESarDisplay.vue'
import GEThreePlainLocBeSideBarTabs from './GEThreePlainLocBeSideBarTabs.vue'
import GEPatientRecord from './GEPatientRecord.vue'
import GEProtocolManager from './GEProtocolManager.vue'
import GEMedicalDatabase from './GEMedicalDatabaseViewer.vue'
import GECanvasDisplay from './GECanvasDisplay.vue'
import GEAutoVoiceDisplay from './GEAutoVoiceDisplay.vue'
import GEImagingOption from './GEImagingOption.vue'
import GESelectRxWidget from './GESelectRxWidget.vue'
import GECopyRxWidget from './GECopyRxWidget.vue'
import AlarmIcon from 'icons/Alarm'
import ScorePreviewUltraLab from '../../ScorePreviewUltraLab.vue'
import ScorePreviewContrast from '../../ScorePreviewContrast.vue'
import ScorePreviewResolution from '../../ScorePreviewResolution.vue'
import ScorePreviewMRBasic from '../../ScorePreviewMRBasic.vue'
import CloseCircleIcon from 'icons/CloseCircle'
import CheckboxMarkedCircleIcon from 'icons/CheckboxMarkedCircle'
import AlertCircleIcon from 'icons/AlertCircle'

export default {
  mixins: [MriMixin, SelectionConfigMixin],
  components: {
    GEMainSidebar,
    GEMainRightSidebar,
    GEThreePlaneLocalizer,
    GERightSidebar,
    GESliceView,
    LoadingBeaker,
    GEFooterBar,
    GENavBar,
    CriticalThinkingQuiz,
    CombinedTestResults,
    GECanvasDisplay,
    GEAutoVoiceDisplay,
    GESARDisplay,
    GEThreePlainLocBeSideBarTabs,
    GEPatientRecord,
    GEProtocolManager,
    GEMedicalDatabase,
    GEImagingOption,
    GESelectRxWidget,
    GECopyRxWidget,
    AlarmIcon,
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
      selectedAction: 'play',
      showSAR: false,
      autoVoice: false,
      isExpanded: true,
      plainBesideShow: false,
      displayPatientRecord: false,
      displayProtocolManager: false,
      displayMedicalDatabase: false,
      hiddenFlag: false,
      isToolbarActive: true,
    }
  },

  computed: {
    ...mapState('dicomService', ['isLoaded', 'progressTotal']),
    ...mapGetters('selectionConfig', ['selectionConfigCurrent']),
    ...mapGetters('scanTimeConfig', ['getScanTime']),
    ...mapState('questionService', ['isLoadingScreeningFormPatientInfo']),
    ...mapGetters('testRunService', ['isTakingTest']),
    isLoadedAndReady() {
      return this.isLoaded && this.$store.state.selectionConfig.ready && this.$store.state.threeJSSVGProvider.hasLoaded
    },
    valueText() {
      return this.isLoadedAndReady ? 'Loaded and Ready' : 'Not Loaded'
    },
    activeTab() {
      return this.$store.getters['tabModule/activeTab']
    },
    sequenceType() {
      return this.selectionConfigCurrent.sequenceType
    },
    toolbarTitle() {
      const q = this.stackQuestions?.[this.selectedStackQuestionIndexVisual - 1]
      if (q && q.questionText) {
        // Search for either "Prescribe a" or "Prescribe an"
        const match = q.questionText.match(/Prescribe a[n]? ([^\s]+(?:\s[^\s]+)?)/i)
        if (match) {
          // match[1] contains the next one or two words after "Prescribe a"/"Prescribe an"
          let result = match[1].replace(/slice/i, '').trim()
          return result.toUpperCase()
        }
      }
      return 'Scan'
    },
    scanTime() {
      return this.getScanTime
    },
    isSandbox() {
      return this.test ? this.test.isSandbox : false
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
    handleActionSelected(action) {
      this.selectedAction = action
    },
    toggleSARDisplay() {
      console.log('toggleSARDisplay called')
      this.showSAR = !this.showSAR
      console.log('showSAR:', this.showSAR)
    },
    handleClose(value) {
      this.showSAR = value // Update the showSAR value
    },
    handleCloseToolbar() {
      this.isToolbarActive = !this.isToolbarActive
    },
    toggleGrxToolbar() {
      this.isToolbarActive = !this.isToolbarActive
    },
    toggleAutoVoiceDisplay() {
      this.autoVoice = !this.autoVoice
    },
    toggleExpand() {
      this.isExpanded = !this.isExpanded
      this.plainBesideShow = !this.plainBesideShow
      console.log('this.plainBesideShow=======' + this.plainBesideShow)
    },
    showPatientRecord() {
      this.displayPatientRecord = true
      this.displayProtocolManager = false
      this.displayMedicalDatabase = false
      this.isToolbarActive = false
    },
    showProtocolManager() {
      this.displayPatientRecord = false
      this.displayProtocolManager = true
      this.displayMedicalDatabase = false
      this.isToolbarActive = false
    },
    showMedicalDatabase() {
      this.displayPatientRecord = false
      this.displayProtocolManager = false
      this.displayMedicalDatabase = true
      this.isToolbarActive = false
    },
    showInitialExam() {
      this.displayPatientRecord = false
      this.displayProtocolManager = false
      this.displayMedicalDatabase = false
      this.isToolbarActive = true
    },
  },
  mounted() {
    this.$once('showSAR', () => {
      this.showSAR = true
    })
  },
}
</script>

<style scoped>
.main-page {
  display: flex;
  height: 1048px;
  width: 100%;
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
.main-toolbar {
  height: 5% !important;
  background-color: #d5d7d7;
}
.slice-img {
  border: 2px solid rgb(0, 0, 0) !important;
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
  width: 25%;
  height: 100%;
  background: #6875a2;
}
.section-1 {
  display: flex;
  flex-direction: column;
  width: 50%;
  margin-bottom: 2.94rem;
  height: 100%;
}
.section-11 {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.section-2 {
  display: flex;
  flex-direction: row;
  /* height: 100%; */
  justify-content: space-evenly;
  width: 100%;
  background: #6975a7;
}

.section-2 ::v-deep .v-input__slot fieldset {
  border-radius: 5px;
}

.section-3 {
  display: flex;
  width: 100%;
}

.section-4 {
  width: 5%;
  height: 100%;
}
.section-5 {
  display: flex;
  min-height: 60%;
  width: 99%;
}

.final {
  height: 100%;
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
.expand1 {
  height: 100%;
  background: black !important;
  border: 2px solid #5a5252;
  border-width: thin;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  border-radius: 2px;
}
.expand2 {
  height: 99%;
  background: black !important;
  border: 2px solid #5a5252;
  border-width: thin;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  border-radius: 2px;
}
::v-deep .v-toolbar__title {
  font-size: 0.9rem !important;
}
::v-deep .theme--light.v-toolbar.v-sheet {
  background: #6875a2 !important;
  color: #fff !important;
}
.cont {
  display: flex;
  justify-content: space-between;
  background: #6875a2;
}
.expand1-column {
  flex: 1;
}

.divider {
  width: 2px;
  background-color: white;
}

/* if activeTab !== 'coil' */
.expand1-column {
  background: black;
  border: 2px solid #5a5252;
  border-width: thin;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 50%;
  border-radius: 2px;
}

::v-deep .v-application--wrap {
  min-height: unset;
}

::v-deep .v-toolbar__content {
  height: 100% !important;
  padding: 4px 4px !important;
}

::v-deep .v-footer {
  flex-wrap: nowrap !important;
}

::v-deep .v-btn {
  text-transform: none !important;
}

textarea {
  height: 9%;
  background-color: #babdcc;
  text-align: center;
  padding-top: 12px;
  font-size: 13px;
  font-weight: bold;
}
</style>
