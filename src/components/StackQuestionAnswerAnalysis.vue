<template>
  <div v-if="userAnswers">
    <v-tabs v-model="tab">
      <v-tab key="prescription">
        {{ $t('global.prescription', languageCode) }}
      </v-tab>
      <v-tab key="dicom">
        {{ $t('global.resulting_images', languageCode) }}
      </v-tab>
      <v-tab key="chosenCriteria" v-if="!isTimingDecisionSetDelay">
        {{
          localStackQuestionResult.stackQuestion && localStackQuestionResult.stackQuestion.questionType == 5
            ? $t('global.enhancement_graph', languageCode)
            : $t('global.chosen_criteria', languageCode)
        }}
      </v-tab>
      <v-tab
        key="skillScores"
        v-if="stackQuestionResult.skillScores && stackQuestionResult.stackQuestion.questionType != 5"
      >
        {{ $t('global.skill_scores', languageCode) }}
      </v-tab>
      <v-tab
        key="injectionSetting"
        v-if="
          isCTLab &&
          ((localStackQuestionResult.stackQuestion.questionType == 1 &&
            localStackQuestionResult.stackQuestion.postContrast) ||
            localStackQuestionResult.stackQuestion.questionType == 5)
        "
      >
        {{ $t('global.injection_setting') }}
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item key="prescription">
        <!-- the screenshots of the Selections -->
        <v-row
          v-if="
            isCTLab &&
            localStackQuestionResult.stackQuestion &&
            localStackQuestionResult.stackQuestion.questionType == 5 &&
            !timingDecisionSelectedSetDelay
          "
          class="h-450px images-container m-0"
        >
          <v-col v-if="timingDecisionConfirmScreenshot" cols="6" class="pr-1 h-100 d-flex justify-content-center">
            <img :src="timingDecisionConfirmScreenshot" style="background-color: #000000" />
          </v-col>
          <v-col v-if="timingDecisitonROIScreenshot" cols="6" class="pl-1 h-100 d-flex justify-content-center">
            <img :src="timingDecisitonROIScreenshot" style="background-color: #000000" />
          </v-col>
        </v-row>
        <v-row
          v-else-if="localStackQuestionResult.sliceViews && !localStackQuestionResult.skipped"
          class="h-450px images-container m-0"
        >
          <v-col
            v-for="sliceView in (() => {
              const views = [...localStackQuestionResult.sliceViews]
              if (views.length === 0) return []

              if (views.length === 4) {
                // Find the index of the scanned item with the smallest height
                let minIndex = 0
                for (let i = 1; i < views.length; i++) {
                  if (views[i].height < views[minIndex].height) {
                    minIndex = i
                  }
                }

                // Remove that one item
                views.splice(minIndex, 1)
              }

              return views
            })()"
            :key="sliceView.id"
            class="d-flex justify-content-center"
          >
            <img :src="sliceView.src" />
          </v-col>
        </v-row>
      </v-tab-item>

      <v-tab-item key="dicom">
        <div
          v-if="
            isCTLab &&
            localStackQuestionResult.stackQuestion &&
            localStackQuestionResult.stackQuestion.questionType == 5 &&
            !timingDecisionSelectedSetDelay
          "
          class="h-450px"
        >
          <TimingDecisionROIPreviewResultView ref="timingDecisionPreview" :stack-question-result="localStackQuestionResult" />
        </div>
        <DicomPreview
          v-else
          class="h-450px"
          ref="dicomPreviewContainer"
          view-orientation="z"
          :selected-stack-question="localStackQuestionResult.stackQuestion"
          :dicom-file-set-id="dicomFileSetId"
          :add-stack-configs-from-selection-configs="selectionConfigsFromAnswers"
          :allow-using-already-loaded-dicom="true"
        />
      </v-tab-item>

      <v-tab-item key="chosenCriteria" v-if="!isTimingDecisionSetDelay">
        <v-row
          v-if="
            isCTLab &&
            localStackQuestionResult.stackQuestion &&
            localStackQuestionResult.stackQuestion.questionType == 5
          "
          class="justify-content-center my-0 h-450px"
        >
          <v-col
            v-if="timingDecisionChartInfo"
            class="py-0 d-flex align-items-center"
            style="background-color: #000000; height: 450px"
            cols="12"
          >
            <TimingDecisionChartView
              ref="timingDecisionChart"
              :height="'400px'"
              :is-preview="true"
              :preview-data="timingDecisionChartInfo"
              :stack-question-result="localStackQuestionResult"
            />
          </v-col>
          <v-col v-else-if="timingDecisionChartScreenshot" cols="12" class="p-2 d-flex justify-content-center">
            <div class="w-100">
              <img :src="timingDecisionChartScreenshot" style="background-color: #000000; width: 100%" />
            </div>
          </v-col>
        </v-row>
        <div v-else-if="chosenAnswer" class="pb-8 h-450px">
          <h4>
            {{ $t('global.answer_criteria', languageCode) }}:
            <TranslatedContent
              type="stackQuestion"
              :record="localStackQuestionResult.stackQuestion"
              :lookup="{
                type: 'objectInArray',
                arrayPath: 'answers',
                identityKey: 'id',
                identityValue: this.attemptedAnswerIdentifier,
                objectKey: 'name',
                defaultText: chosenAnswer.name,
              }"
            />
          </h4>
          <p class="pb-2">
            <TranslatedContent
              type="stackQuestion"
              :record="localStackQuestionResult.stackQuestion"
              :lookup="{
                type: 'objectInArray',
                arrayPath: 'answers',
                identityKey: 'id',
                identityValue: this.attemptedAnswerIdentifier,
                objectKey: 'criteria',
                defaultText: chosenAnswer.criteria,
              }"
            />
          </p>
          <p>
            <b
              ><TranslatedContent
                type="stackQuestion"
                :record="localStackQuestionResult.stackQuestion"
                :lookup="{
                  type: 'objectInArray',
                  arrayPath: 'answers',
                  identityKey: 'id',
                  identityValue: this.attemptedAnswerIdentifier,
                  objectKey: 'citation',
                  defaultText: chosenAnswer.citation,
                }"
            /></b>
          </p>
        </div>
      </v-tab-item>
      <v-tab-item v-if="stackQuestionResult.skillScores && stackQuestionResult.stackQuestion.questionType != 5">
        <div class="h-450px d-flex justify-content-center align-center">
          <SkillScoresBarChart :skill-scores="stackQuestionResult.skillScores" />
        </div>
      </v-tab-item>
      <v-tab-item
        key="injectionSetting"
        v-if="
          isCTLab &&
          ((localStackQuestionResult.stackQuestion.questionType == 1 &&
            localStackQuestionResult.stackQuestion.postContrast) ||
            localStackQuestionResult.stackQuestion.questionType == 5)
        "
      >
        <div class="d-flex justify-content-center h-450px images-container">
          <img :src="injectorScreenshotAnswer" v-if="injectorScreenshotAnswer" />
        </div>
      </v-tab-item>
    </v-tabs-items>

    <div v-if="sortedGroupBundles.length > 1">
      <!-- Only show this if there are multiple groups -->
      <b-tabs content-class="mt-3">
        <b-tab
          v-for="groupVars in sortedGroupBundles"
          :key="groupVars.userAnswerConfigIndex"
          :title="groupVars.userAnswerConfigIndex + 1 + ''"
          :active="groupVars.userAnswerConfigIndex === pickedBundleIndex"
          :class="'bold'"
          @click="pickedBundleIndex = groupVars.userAnswerConfigIndex"
        ></b-tab>
      </b-tabs>
    </div>

    <div v-if="selectedGroupUserAnswer">
      <TestResultsConfigItemsContrast v-if="isContrastLab" :config-items="selectedGroupUserAnswer" />
      <TestResultsConfigItemsResolution v-if="isResolutionLab" :config-items="selectedGroupUserAnswer" />
      <TestResultsConfigItemsMRBasic
        v-if="!isCTLab && !isUltraLab && !isResolutionLab && !isContrastLab"
        :config-items="selectedGroupUserAnswer"
        :is-single-slice="chosenAnswer && chosenAnswer.isSingleSlice"
      />
      <TestResultsTimingDecisionConfigItemsCT
        v-if="
          isCTLab && localStackQuestionResult.stackQuestion && localStackQuestionResult.stackQuestion.questionType == 5
        "
        :config-items="selectedGroupUserAnswer"
        :stack-question="localStackQuestionResult.stackQuestion"
      />
      <TestResultsConfigItemsCT
        v-if="isCTLab && !isUltraLab"
        :config-items="selectedGroupUserAnswer"
        :stack-question="localStackQuestionResult.stackQuestion"
      />
      <TestResultsConfigItemsUltraLab v-if="isUltraLab" :config-items="selectedGroupUserAnswer" />
    </div>

    <!-- Score for this group (only needs to be shown if this is multi, since we have the full question score elsewhere) -->
    <div class="mt-2" v-if="sortedGroupBundles.length > 1">
      {{ $t('global.score') }}: {{ selectedGroupBundle.combinedScore || selectedGroupBundle.score }}%
    </div>
    <v-row v-if="localStackQuestionResult.stackQuestion.questionType != 5">
      <v-col cols="6">
        <template v-if="localStackQuestionResult.sliceQuantScores && isCTLab">
          <v-list-item v-for="detail in selectedGroupBundleAnalysisSliceQuantCT" :key="detail.key">
            <v-list-item-content>
              <strong :class="`text-start text-none ${feedbackColor(detail.color)}`">{{ detail.fullText }}</strong>
            </v-list-item-content>
          </v-list-item>
        </template>
        <template v-else-if="localStackQuestionResult.sliceQuantScores && isUltraLab">
          <b-tabs v-model="tabIndex" content-class="mt-3" nav-wrapper-class="sticky-top bg-white">
            <b-tab title="Prescription" :title-link-class="linkClass(0)" key="slicePrescription"></b-tab>
            <b-tab title="Parameters" :title-link-class="linkClass(1)" key="parameters"></b-tab>
            <b-tab title="Image Result" :title-link-class="linkClass(2)" key="imageResult"></b-tab>
            <v-list-item v-for="detail in selectedGroupBundleAnalysisSliceQuantUltraLab" :key="detail.key">
              <v-list-item-content>
                <strong :class="`text-start text-none ${feedbackColor(detail.color)}`">{{ detail.fullText }}</strong>
              </v-list-item-content>
            </v-list-item>
          </b-tabs>
        </template>
        <template v-else>
          <v-list-item v-for="detail in selectedGroupBundleAnalysis" :key="detail.key">
            <v-list-item-content>
              <strong :class="`text-start text-none ${feedbackColor(detail.color)}`">{{ detail.fullText }}</strong>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-col>
      <v-col cols="6">
        <div class="text-left pt-3" v-for="comment in stackQuestionResultComments" :key="comment.id">
          <template v-if="editCommentId == comment.id">
            <v-textarea
              :rules="[(v) => countLetter(v || '') <= 200 || 'Description must be 200 characters or less']"
              v-model="comment.comment"
              outlined
              :label="$t('global.comment', languageCode)"
            >
            </v-textarea>
            <v-btn class="text-white buttonBlue" :disabled="isSubmittingComment" @click="onSubmitComment(comment)">
              <v-progress-circular indeterminate v-if="isSubmittingComment"></v-progress-circular>
              <span v-else>
                {{ $t('global.submit') }}
              </span>
            </v-btn>
          </template>
          <template v-else>
            <label>{{
              isAdminComment(comment)
                ? `${$t('global.comment', languageCode)}:`
                : `${$t('global.reply', languageCode)}:`
            }}</label>
            <div :class="{ 'text-comment': isAdminComment(comment), 'text-reply': !isAdminComment(comment) }">
              {{ comment.comment }}
            </div>
            <div class="text-author">
              {{ getCommentAuthor(comment) }}
              <div v-if="comment.seen" class="mt-2">
                <div class="text-author">
                  {{ getCommentSeen(comment) }}
                </div>
              </div>
            </div>
            <div v-if="shouldEditComment(comment)" class="mt-2">
              <v-btn class="text-white buttonBlue" @click="editCommentId = comment.id">
                {{ $t('global.edit') }}
              </v-btn>
            </div>
          </template>
        </div>
        <div class="text-left pt-3" v-if="!editCommentId && canCreateNewComment">
          <v-textarea
            :rules="[(v) => countLetter(v || '') <= 200 || 'Description must be 200 characters or less']"
            v-model="newComment"
            outlined
            :label="isUserView ? $t('global.reply', languageCode) : $t('global.comment', languageCode)"
          >
          </v-textarea>
          <v-btn class="text-white buttonBlue" :disabled="isSubmittingComment" @click="onSubmitComment(null)">
            <v-progress-circular indeterminate v-if="isSubmittingComment"></v-progress-circular>
            <span v-else>
              {{ $t('global.submit') }}
            </span>
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import _ from 'lodash'
import i18n from '../i18n'
import { answerDataToSelectionConfig } from '@/lib/misc-util'
import DicomPreview from '../components/DicomPreview'
import { mapGetters, mapState } from 'vuex'
import config from '../config'
import { combinedResultAnalysis } from '../util/resultAnalysis'
import TestResultsConfigItemsUltraLab from '../components/TestResultsConfigItemsUltraLab'
import TestResultsConfigItemsCT from '../components/TestResultsConfigItemsCT'
import TestResultsConfigItemsMRBasic from '../components/TestResultsConfigItemsMRBasic'
import TestResultsConfigItemsResolution from '../components/TestResultsConfigItemsResolution'
import TestResultsConfigItemsContrast from '../components/TestResultsConfigItemsContrast'
import TestResultsTimingDecisionConfigItemsCT from '../components/TestResultsTimingDecisionConfigItemsCT'
import TimingDecisionROIPreviewResultView from '../components/TimingDecisionROIPreviewResultView'
import TimingDecisionChartView from '../components/TimingDecisionChartView.vue'
import { ANSWER_VIEWS_IMAGE_ID, DEFAULT_ROI_RADIUS, DEFAULT_ROI_STROKE_WIDTH } from '../constants'
import SkillScoresBarChart from '../components/Statistics/SkillScoresBarChart.vue'
import { apiPost, apiPut } from '../util/api'
import moment from 'moment'
import TranslatedContent from '@/components/TranslatedContent'

export default {
  name: 'StackQuestionAnswerAnalysis',
  components: {
    DicomPreview,
    TestResultsConfigItemsUltraLab,
    TestResultsConfigItemsCT,
    TestResultsConfigItemsMRBasic,
    TestResultsConfigItemsResolution,
    TestResultsConfigItemsContrast,
    TestResultsTimingDecisionConfigItemsCT,
    TimingDecisionROIPreviewResultView,
    SkillScoresBarChart,
    TranslatedContent,
    TimingDecisionChartView,
  },
  props: {
    groupScoreVariables: {
      type: Array,
      required: true,
    },
    userAnswers: {
      type: Array,
      required: false,
      default: () => [],
    },
    isContrastLab: {
      type: Boolean,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      default: false,
    },
    isResolutionLab: {
      type: Boolean,
      required: false,
    },
    // eslint-disable-next-line vue/require-prop-types
    questionScore: {
      // type: String|Number, // API seems to sometimes returns this as String and sometimes as Number
      required: true,
    },
    dicomFileSetId: {
      type: Number,
      required: true,
    },
    stackQuestionResult: {
      type: Object,
      required: true,
    },
    attemptedAnswerIdentifier: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      tab: 0,
      pickedBundleIndex: 0,
      isCTLab: config.isCTLab,
      combinedResultAnalysis,
      tabIndex: 0,
      DEFAULT_ROI_RADIUS: DEFAULT_ROI_RADIUS,
      DEFAULT_ROI_STROKE_WIDTH: DEFAULT_ROI_STROKE_WIDTH,
      isSubmittingComment: false,
      localStackQuestionResult: _.cloneDeep(this.stackQuestionResult),
      editCommentId: null,
      newComment: '',
    }
  },
  watch: {
    tab() {
      if (this.isCTLab && this.tab == 1) {
        if (this.$refs.dicomPreviewContainer) {
          this.$refs.dicomPreviewContainer.requireResetRenderer()
        }
        if (this.$refs.timingDecisionPreview) {
          this.$refs.timingDecisionPreview.refreshCanvas()
        }
      }
      if (this.isCTLab && this.tab == 2) {
        if (this.$refs.timingDecisionChart) {
          this.$refs.timingDecisionChart.refreshChart()
        }
      }
    },
    stackQuestionResult() {
      this.localStackQuestionResult = _.cloneDeep(this.stackQuestionResult)
      this.onExpandStackQuestionAnalysis()
      this.editCommentId = null
      this.newComment = ''
    },
    editCommentId() {
      this.newComment = ''
    },
  },
  computed: {
    ...mapGetters('user', ['languageCode', 'isAdmin']),
    ...mapState('user', ['isManager', 'legalName']),
    ...mapState('authentication', ['userId', 'accessToken']),
    safePickedIndex() {
      const lenFromSliceGroups = (
        _.get(this.stackQuestionResult, ['sliceQuantScores', 'slicePrescription', 'sliceGroups'], []) || []
      ).length
      const lenFromProp = Array.isArray(this.groupScoreVariables) ? this.groupScoreVariables.length : 0
      const maxLen = Math.max(lenFromSliceGroups, lenFromProp)
      if (maxLen === 0) return 0
      return Math.min(this.pickedBundleIndex, maxLen - 1)
    },
    isTimingDecisionSetDelay() {
      return (
        this.localStackQuestionResult.stackQuestion &&
        this.localStackQuestionResult.stackQuestion.questionType == 5 &&
        this.timingDecisionSelectedSetDelay
      )
    },
    isUserView() {
      return this.userId == this.localStackQuestionResult?.userId
    },
    canCreateNewComment() {
      const isLastCommentIsAdminComment =
        this.stackQuestionResultComments.length > 0 &&
        this.isAdminComment(this.stackQuestionResultComments[this.stackQuestionResultComments.length - 1])
      return (
        this.stackQuestionResultComments.length < 4 &&
        ((!this.isUserView && this.stackQuestionResultComments.length == 0) ||
          (this.isUserView && isLastCommentIsAdminComment) ||
          (!this.isUserView && !isLastCommentIsAdminComment))
      )
    },
    selectionConfigsFromAnswers() {
      return _.map(this.userAnswers, answerDataToSelectionConfig)
    },
    sortedGroupBundles() {
      // Sort By userAnswerConfigIndex to get user's order of groups
      // or Sort By groupId to get admin(correct answer)'s order of groups
      return this.groupScoreVariables
    },
    selectedGroupBundle() {
      const sliceGroups = _.get(this.stackQuestionResult, ['sliceQuantScores', 'slicePrescription', 'sliceGroups'], [])
      const idx = this.safePickedIndex
      if (Array.isArray(sliceGroups) && sliceGroups.length > 0) {
        return sliceGroups[idx] || {}
      }
      const fromProp = Array.isArray(this.groupScoreVariables) ? this.groupScoreVariables : []
      return fromProp[idx] || {}
    },
    selectedGroupBundleSliceQuantCT() {
      const idx = this.safePickedIndex
      const pArr =
        _.get(this.localStackQuestionResult, ['sliceQuantScores', 'parameterScore', 'groupScoreVariables'], []) || []
      const prArr =
        _.get(
          this.localStackQuestionResult,
          ['sliceQuantScores', 'slicePrescriptionScore', 'groupScoreVariables'],
          []
        ) || []
      const parameterScore = pArr[idx] || { analysis: [] }
      const prescriptionScore = prArr[idx] || { analysis: [] }
      return { analysis: [...(parameterScore.analysis || []), ...(prescriptionScore.analysis || [])] }
    },
    selectedGroupBundleSliceQuantUltraLab() {
      const arr = _.get(this.activePreviewGrades, ['groupScoreVariables'], [])
      return (Array.isArray(arr) ? arr[this.safePickedIndex] : null) || { analysis: [] }
    },
    activePreviewGrades() {
      let output
      switch (this.tabIndex) {
        case 0:
          output = this.localStackQuestionResult.sliceQuantScores.slicePrescriptionScore
          break
        case 1:
          output = this.localStackQuestionResult.sliceQuantScores.parameterScore
          break
        case 2:
          output = this.localStackQuestionResult.sliceQuantScores.imageResultScore
          break
        default:
          console.warn('unknown tab index')
      }
      return output
    },
    selectedGroupUserAnswer() {
      return _.get(this.userAnswers, this.pickedBundleIndex)
    },
    exceptAnalysisFactorNames() {
      return [
        'landmarkDistanceRatio',
        'landmarkDistanceAP',
        'landmarkDistanceSI',
        'isScanPositionRight',
        'injectionContrastValue',
        'injectionSalineValue',
      ]
    },
    selectedGroupBundleAnalysisSliceQuantCT() {
      let filteredBundle = this.combinedResultAnalysis(
        this.selectedGroupBundleSliceQuantCT.analysis,
        this.stackQuestion.questionType == 2
      )

      filteredBundle = _.filter(filteredBundle, (el) => {
        const factorName = _.get(el, 'factorName', '')
        if (this.exceptAnalysisFactorNames.includes(factorName)) {
          return false
        }
        return true
      })
      filteredBundle = _.uniqBy(filteredBundle, 'key')

      return _.map(filteredBundle, (analysisItem) => {
        let { key, value, factorName } = analysisItem
        return {
          ...analysisItem,
          fullText: i18n.t(key, {
            scanlab: this.isCTLab ? 'ScanLabCT' : 'ScanLab™',
            scanlabValue: factorName == 'delayTime' ? this.timerFormatted(value) : value,
          }),
        }
      })
    },
    selectedGroupBundleAnalysisSliceQuantUltraLab() {
      let filteredBundle = this.selectedGroupBundleSliceQuantUltraLab.analysis || []
      filteredBundle = _.filter(filteredBundle, (el) => {
        const factorName = _.get(el, 'factorName', '')
        if (this.exceptAnalysisFactorNames.includes(factorName)) {
          return false
        }

        return true
      })

      return _.map(filteredBundle, (analysisItem) => {
        let { key, value, factorName } = analysisItem
        console.log(key, value, factorName)
        return {
          ...analysisItem,
          fullText: i18n.t(key, {
            scanlab: this.isCTLab ? 'ScanLabCT' : 'ScanLab™',
            scanlabValue: factorName == 'delayTime' || factorName == 'scanTime' ? this.timerFormatted(value) : value,
          }),
        }
      })
    },
    selectedGroupBundleAnalysis() {
      /*
      let filteredBundle = this.isCTLab
        ? this.combinedResultAnalysis(this.selectedGroupBundle.analysis)
        : this.selectedGroupBundle.analysis
      */

      let filteredBundle = []
      if (this.isCTLab) {
        const base = _.get(this.selectedGroupBundle, 'analysis', [])
        filteredBundle = this.combinedResultAnalysis(base)
      } else {
        const sliceGroups = _.get(
          this.stackQuestionResult,
          ['sliceQuantScores', 'slicePrescription', 'sliceGroups'],
          []
        )
        if (Array.isArray(sliceGroups) && sliceGroups.length > 0) {
          const analysis = _.get(sliceGroups, [this.safePickedIndex, 'groupScoreVariables', 'analysis'], [])
          filteredBundle = Array.isArray(analysis) ? analysis : []
        } else {
          filteredBundle = _.get(this.selectedGroupBundle, 'analysis', [])
        }
      }

      filteredBundle = _.filter(filteredBundle, (el) => {
        const factorName = _.get(el, 'factorName', '')
        if (this.exceptAnalysisFactorNames.includes(factorName)) {
          return false
        }

        return true
      })

      return _.map(filteredBundle, (analysisItem) => {
        let { key, value, factorName } = analysisItem
        return {
          ...analysisItem,
          fullText: i18n.t(key, {
            scanlab: this.isCTLab ? 'ScanLabCT' : 'ScanLab™',
            scanlabValue: factorName == 'delayTime' ? this.timerFormatted(value) : value,
          }),
        }
      })
    },
    stackQuestion() {
      return _.get(this.localStackQuestionResult, 'stackQuestion')
    },
    chosenAnswer() {
      return _.find(_.get(this.stackQuestion, 'answers'), { id: this.attemptedAnswerIdentifier })
    },
    injectorScreenshotAnswer() {
      let value = ''
      const answer = _.get(this.localStackQuestionResult, 'answerViews', []).find((o) => o.id == 'injectorScreenshot')
      if (answer) {
        value = answer.src
      }

      return value
    },
    timingDecisionConfirmScreenshot() {
      let value = ''
      const answer = _.find(
        _.get(this.localStackQuestionResult, ['answerViews'], []),
        (el) => el.id == ANSWER_VIEWS_IMAGE_ID.TIMING_DECISION_CONFIRM_SCREENSHOT
      )
      if (answer) {
        value = answer.src
      }

      return value
    },
    timingDecisionSelectedSetDelay() {
      return _.get(
        this.localStackQuestionResult,
        ['userAnswers', 0, 'timingDecisionInfo', 'isSelectedSetDelayTimingDecision'],
        false
      )
    },
    timingDecisitonROIScreenshot() {
      let value = ''
      const answer = _.find(
        _.get(this.localStackQuestionResult, ['answerViews'], []),
        (el) => el.id == ANSWER_VIEWS_IMAGE_ID.TIMING_DECISION_ROI_SCREENSHOT
      )
      if (answer) {
        value = answer.src
      }

      return value
    },
    timingDecisionChartScreenshot() {
      let value = ''
      const answer = _.find(
        _.get(this.localStackQuestionResult, ['answerViews'], []),
        (el) => el.id == ANSWER_VIEWS_IMAGE_ID.TIMING_DECISION_CHART_SCREENSHOT
      )
      if (answer) {
        value = answer.src
      }

      return value
    },
    timingDecisionChartInfo() {
      return _.get(this.localStackQuestionResult, ['userAnswers', 0, 'timingDecisionInfo'], null)
    },
    stackQuestionResultComments() {
      return _.get(this.localStackQuestionResult, 'stackQuestionResultComments', [])
    },
  },
  mounted() {
    this.editCommentId = null
    this.newComment = ''
    this.onExpandStackQuestionAnalysis()
    document.addEventListener('visibilitychange', this.onVisibilityChange)
  },
  beforeDestroy() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
  },
  methods: {
    round: _.round,
    onVisibilityChange() {
      if (document.hidden) return
      if (this.tab == 1) {
        if (this.$refs.dicomPreviewContainer) {
          this.$refs.dicomPreviewContainer.requireResetRenderer()
        }
        if (this.$refs.timingDecisionPreview) {
          this.$refs.timingDecisionPreview.refreshCanvas()
        }
      }
      if (this.tab == 2) {
        if (this.$refs.timingDecisionChart) {
          this.$refs.timingDecisionChart.refreshChart()
        }
      }
    },
    async onExpandStackQuestionAnalysis() {
      const isAnyCommentNotViewed = (this.localStackQuestionResult.stackQuestionResultComments || []).some(
        (el) => !el.seen
      )
      if (this.stackQuestionResult.stackQuestionResultId && isAnyCommentNotViewed) {
        const response = await apiPost(
          `/stackQuestionResultComment/viewComment?testRunUserId=${_.get(this.localStackQuestionResult, ['userId'])}`,
          {
            stackQuestionResultId: this.localStackQuestionResult.stackQuestionResultId,
            studentId: _.get(this.localStackQuestionResult, ['userId']),
          },
          this.accessToken
        )

        if (response.data && response.data.success) {
          this.localStackQuestionResult = {
            ...this.localStackQuestionResult,
            stackQuestionResultComments: response.data.data,
          }
          this.stackQuestionResult.stackQuestionResultComments = response.data.data
        }
      }
    },
    shouldEditComment(comment) {
      const isCommentOwner = comment.commentedUserId == this.userId
      const isLastComment =
        this.stackQuestionResultComments.findIndex((el) => el.id == comment.id) ==
        this.stackQuestionResultComments.length - 1
      return isCommentOwner && isLastComment
    },
    isAdminComment(comment) {
      return comment.commentedUserId != _.get(this.localStackQuestionResult, ['userId'])
    },
    getCommentAuthor(comment) {
      return `Created on ${moment(comment.lastedUpdatedAt).format('MM/DD/YY')} at ${moment(
        comment.lastedUpdatedAt
      ).format('HH:mm:ss')} by ${_.get(comment.commentedUser, ['legalName'], 'Admin')}.`
    },
    getCommentSeen(comment) {
      return `Seen on ${moment(comment.seenAt).format('MM/DD/YY')} at ${moment(comment.seenAt).format(
        'HH:mm:ss'
      )} by ${_.get(comment.viewedUser, ['legalName'], 'User')}.`
    },
    async onSubmitComment(comment) {
      if (this.localStackQuestionResult.stackQuestionResultId) {
        this.isSubmittingComment = true

        if (!comment) {
          // Create new comment
          const response = await apiPost(
            `stackQuestionResultComment?testRunUserId=${_.get(this.localStackQuestionResult, ['userId'])}`,
            {
              stackQuestionResultId: this.localStackQuestionResult.stackQuestionResultId,
              comment: this.newComment,
            },
            this.accessToken
          )
          this.isSubmittingComment = false
          this.newComment = ''
          if (response.data && response.data.success) {
            this.localStackQuestionResult = {
              ...this.localStackQuestionResult,
              stackQuestionResultComments: [
                ...this.localStackQuestionResult.stackQuestionResultComments,
                response.data.data,
              ],
            }
            this.stackQuestionResult.stackQuestionResultComments = [
              ...this.localStackQuestionResult.stackQuestionResultComments,
            ]
            this.$notify({ type: 'success', text: 'Saved!' })
          } else {
            this.$notify({ type: 'error', text: 'Failed' })
          }
        } else {
          // Edit existing comment
          const response = await apiPut(
            `stackQuestionResultComment/${comment.id}?testRunUserId=${_.get(this.localStackQuestionResult, [
              'userId',
            ])}`,
            {},
            {
              comment: comment.comment,
            },
            this.accessToken
          )
          this.isSubmittingComment = false
          this.newComment = ''
          this.editCommentId = null
          if (response.data && response.data.success) {
            this.localStackQuestionResult = {
              ...this.localStackQuestionResult,
              stackQuestionResultComments: this.localStackQuestionResult.stackQuestionResultComments.map((el) => {
                if (el.id == comment.id) {
                  return response.data.data
                }
                return el
              }),
            }
            this.stackQuestionResult.stackQuestionResultComments = this.stackQuestionResult.stackQuestionResultComments.map(
              (el) => {
                if (el.id == comment.id) {
                  return response.data.data
                }
                return el
              }
            )
            this.$notify({ type: 'success', text: 'Saved!' })
          } else {
            this.$notify({ type: 'error', text: 'Failed' })
          }
        }
      }
    },
    countLetter(text) {
      if (!text) {
        return 0
      }
      return text.split(' ').length
    },
    linkClass(idx) {
      if (this.tabIndex === idx) {
        return ['font-weight-bold']
      } else {
        return ['text-muted']
      }
    },
    timerFormatted(s) {
      const duration = [parseInt((s / 60) % 60), parseInt(s % 60)].join(':').replace(/\b(\d)\b/g, '0$1')
      return duration
    },
    feedbackColor(color) {
      switch (color) {
        case 'green':
          return 'score_very_good'
        case 'yellow':
          return 'score_ok'
        case 'red':
          return 'score_bad'
      }
    },
  },
}
</script>

<style scoped lang="scss">
.h-450px {
  height: 450px;
}
.images-container {
  img {
    max-height: 100%;
    object-fit: contain;
  }
}
.text-comment {
  font-size: 1rem;
  color: #ff0000;
  font-weight: normal;
}
.text-reply {
  font-size: 1rem;
  color: #006f00;
  font-weight: normal;
}
.text-author {
  font-size: 0.8rem;
  color: #757575;
  font-style: italic;
}
.score_very_good {
  color: #006f00;
}

.score_ok {
  color: orange;
}

.score_bad {
  color: #b60000;
}

.config-items {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;

  .config-item {
    padding: 5px 20px;

    label {
      font-weight: bold;
    }
  }
}
</style>
