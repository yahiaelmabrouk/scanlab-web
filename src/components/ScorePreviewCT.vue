<template>
  <v-card
    v-if="
      isCtLab &&
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
            scores && isAdmin && scores.combinedScore >= 0 && trafficLightsPreviewPanel === 0
              ? `(${overallScore}%)`
              : ''
          }}
        </v-expansion-panel-header>

        <v-expansion-panel-content class="admin-only-score-preview-content">
          <b-tabs v-model="tabIndex" content-class="mt-3">
            <b-tab title="Slices" :title-link-class="linkClass(0)" key="slices"></b-tab>
            <b-tab title="Parameters" :title-link-class="linkClass(1)" key="parameters"></b-tab>
            <div v-if="isAdmin && scores && scores.combinedScore >= 0 && trafficLightsPreviewPanel === 0">
              Score: {{ Math.round(activePreviewGrades.combinedScore) }}
            </div>
            <table>
              <tbody>
                <tr v-for="analysis in previewScoreAnalysisComputed" :key="analysis.keyName">
                  <td v-if="!isAdmin || !analysis.isBad" class="traffic-light-icon-holder">
                    <span
                      v-if="showAnalysisWrongWhenNoAnswerKeyNames.includes(analysis.factorName)"
                      style="color: #b60000"
                      class="traffic-light-icon"
                    >
                      <CloseCircleIcon />
                    </span>
                    <span v-else-if="analysis.color === 'green'" style="color: #006f00" class="traffic-light-icon">
                      <CheckboxMarkedCircleIcon />
                    </span>
                    <span v-else-if="analysis.color === 'yellow'" style="color: #b4b400" class="traffic-light-icon">
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
                              scanlab: isCtLab ? 'ScanLabCT' : 'ScanLab™',
                              scanlabValue: analysis.value,
                            })
                          : ''
                      "
                    >
                      {{ $t(`global.${analysis.keyName}`, languageCode) }}</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </b-tabs>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script>
import { _ } from 'lodash'
import { mapGetters, mapActions } from 'vuex'
import CloseCircleIcon from 'icons/CloseCircle'
import CheckboxMarkedCircleIcon from 'icons/CheckboxMarkedCircle'
import AlertCircleIcon from 'icons/AlertCircle'
import { isOnlyShowRightOrWrong, combinedResultAnalysis } from '../util/resultAnalysis'
export default {
  name: 'ScorePreviewCT',
  components: { CloseCircleIcon, CheckboxMarkedCircleIcon, AlertCircleIcon },
  props: {
    isAdmin: {
      type: Boolean,
      required: true,
    },
    isSandbox: {
      type: Boolean,
      required: true,
    },
    isCtLab: {
      type: Boolean,
      required: true,
    },
    isAnsweredCurrentQuestion: {
      required: true,
    },
    isManager: {
      type: Boolean,
      required: true,
    },
    testRunState: {
      type: String,
      required: true,
    },
    isAcquisition: {
      type: Boolean,
      required: true,
    },
    isReconstruction: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
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
  watch: {
    trafficLightsPreviewPanel: function () {
      this.startAdminPanelPollingAsNeeded()
    },
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    previewScoreAnalysisComputed() {
      let output = []
      if (this.isCtLab && this.activePreviewGrades?.groupScoreVariables) {
        output = combinedResultAnalysis(
          this.activePreviewGrades.groupScoreVariables[this.previewScoreGroupIndex].analysis,
          this.isReconstruction
        )
      }
      return output
    },
    scores() {
      return this.previewScore?.sliceQuantScore || null
    },
    overallScore: function () {
      return _.round(this.scores?.combinedScore || 0, 2)
    },
    showAnalysisWrongWhenNoAnswerKeyNames() {
      if (!this.isCtLab || this.isAnsweredCurrentQuestion) {
        return []
      } else {
        return ['delayTime']
      }
    },
    activePreviewGrades() {
      return this.tabIndex == 0 ? this.scores?.slicePrescriptionScore : this.scores?.parameterScore
    },
  },
  methods: {
    ...mapActions('questionService', ['getScorePreview']),
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
    async updatePreviewScore() {
      const data = await this.getScorePreview()

      if (data && data?.sliceQuantScore) {
        this.previewScore = data
      } else {
        console.warn('No valid score preview received', data)
        this.previewScore = null // or default value
      }
    },
    linkClass(idx) {
      if (this.tabIndex === idx) {
        return ['font-weight-bold']
      } else {
        return ['text-muted']
      }
    },
  },
  async beforeDestroy() {
    if (this.previewScorePoller) {
      clearInterval(this.previewScorePoller)
    }
  },
}
</script>

<style scoped lang="scss">
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
</style>
