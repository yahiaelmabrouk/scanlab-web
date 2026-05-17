<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <article id="test-results">
    <v-dialog width="50%" v-model="showFeedback">
      <v-card>
        <v-card-title class="headline">{{ $t('TestResults.report_question') }}</v-card-title>
        <v-card-text>
          <v-form v-model="feedbackFormValid" ref="feedbackForm" @submit.stop.prevent="submitFeedback">
            <v-textarea
              :rules="[(v) => !!v || $t('TestResults.feedback_is_required')]"
              v-model="feedbackText"
              outlined
              :label="$t('TestResults.feedback')"
            >
            </v-textarea>
            <div class="d-flex justify-space-between">
              <v-btn :disabled="!feedbackFormValid" type="submit" color="primary">
                {{ $t('global.submit') }}
              </v-btn>
              <v-btn @click="showFeedback = false">{{ $t('global.close') }}</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    <div v-if="shouldHideExamResults">
      <v-card class="pt-16">
        <v-card-title class="headline justify-center">{{ $t('global.thank_you_for_submission') }}</v-card-title>
        <v-card-text> </v-card-text>
      </v-card>
    </div>
    <v-row v-if="!shouldHideExamResults">
      <PageTitleCard
        :img-file="testOverview.image"
        :title="$t('global.test_results', languageCode)"
        :border-color="borderColor"
      >
        <template #card-body>
          <div class="d-flex flex-column align-start">
            <p v-if="testOverview.overallPercentage != null">
              {{ $t('CombinedTestResults.summary1', languageCode) }}
              <span class="bold">
                <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                {{ testOverview.overallPercentageDisplay }}%.
              </span>
              {{ $t('CombinedTestResults.summary2', languageCode) }}
            </p>
          </div>
        </template>
      </PageTitleCard>
    </v-row>
    <v-row v-if="isCTLab && !shouldHideExamResults" class="title-card ma-0 mt-6 w-100" justify="center">
      <v-data-table
        :headers="tablePosition.header"
        :items="tablePosition.rows.filter((el) => !el.hidden)"
        :items-per-page="25"
        :single-expand="true"
        item-key="index"
        hide-default-footer
        hide-default-header
        disable-sort
        show-expand
        class="pa-0 elevation-0 w-100"
      >
        <template #header="{ props: { headers } }">
          <thead>
            <tr>
              <th v-for="header in headers" :key="header.value" :class="header.class" :style="{ width: header.width }">
                <span class="custom-header-text" v-if="header.text == 'Type'">
                  {{ $t('global.type', languageCode) }}
                </span>
                <span class="custom-header-text" v-else-if="header.text == 'Result'">
                  {{ $t('CombinedTestResults.result', languageCode) }}
                </span>
                <span class="custom-header-text" v-else>
                  {{ header.text }}
                </span>
              </th>
            </tr>
          </thead>
        </template>
        <template #[`item.index`]="{ item }">
          <span class="bold">{{ item.index }}</span>
        </template>
        <template #[`item.gradingType`]="{ item }">
          <span class="bold">{{ $t(`TestResults.${item.gradingType}`, languageCode) }}</span>
        </template>
        <template #[`item.value`]="{ item }">
          <span
            v-if="patientPrepResults"
            :class="{ bold: true, correct: item.value > CUTOFF_SCORE, incorrect: item.value <= CUTOFF_SCORE }"
          >
            {{ item.value + '%' }}
          </span>
          <span v-else :class="{ bold: true, correct: item.value, incorrect: !item.value }">
            {{ item.text !== undefined ? item.text : parseResultToText(item.value) }}
          </span>
        </template>
        <template #expanded-item="{ headers, item }">
          <td :colspan="headers.length">
            <v-row v-if="item.gradingType == 'Position'" class="text-left pt-2">
              <v-col cols="6">
                <div>
                  <b>{{ $t('TestResults.selected_position', languageCode) }}:</b>
                </div>
                {{ item.patientPosition }}
              </v-col>
              <v-col v-if="listPatientPositionsAndBodyBox && listPatientPositionsAndBodyBox.length > 0" cols="6">
                <span
                  ><b>{{ $t('TestResults.correct_positions', languageCode) }}:</b></span
                >
                <ol>
                  <li v-for="item in listPatientPositionsAndBodyBox" :key="item.id">
                    {{ `${item.value.join(', ')}${item.isShowHeadHolder ? `, ${getHeadholderText()}` : ''}` }}
                  </li>
                </ol>
              </v-col>
              <v-col v-else cols="6">
                <div class="pt-1">
                  <span> {{ $t('TestResults.correct_positions_not_set', languageCode) }} </span>
                </div>
              </v-col>
              <v-col cols="12">
                <img :src="item.patientPositionScreenshot" />
              </v-col>
            </v-row>
            <div v-else-if="item.gradingType == 'Landmark'">
              <div
                v-if="patientPrepResults"
                :class="`text-start text-none mt-1 font-weight-bold ${
                  item.scoreAP > CUTOFF_SCORE ? 'correct' : 'incorrect'
                }`"
              >
                {{ 'Landmark A/P: ' + item.distanceAP + 'cm' }}
                <span class="d-inline-block float-right">{{ item.scoreAP + '%' }}</span>
              </div>
              <div
                v-if="patientPrepResults"
                :class="`text-start text-none mt-1 font-weight-bold ${
                  item.scoreSI > CUTOFF_SCORE ? 'correct' : 'incorrect'
                }`"
              >
                {{ 'Landmark S/I: ' + item.distanceSI + 'cm' }}
                <span class="d-inline-block float-right">{{ item.scoreSI + '%' }}</span>
              </div>
              <div style="width: 100%">
                <MRIMachineView
                  v-if="isCTLab"
                  :is-preview="true"
                  :preview-position="item.mriMachinePosition"
                  :model-file-name="testModelFileName"
                />
                <MRMRIMachineView
                  v-else
                  :is-preview="true"
                  :preview-position="item.mriMachinePosition"
                  :model-file-name="testModelFileName"
                />
              </div>
            </div>
            <div v-else-if="item.gradingType == 'Injection'" class="pt-2 pb-4">
              <v-row>
                <v-col v-if="patientPrepResults" cols="6">
                  <div class="text-left">
                    <strong :class="`text-start text-none ${feedbackColor(!injectionContrastResult)}`">{{
                      injectionContrastResultText + ' ' + item.scoreContrast + '%'
                    }}</strong>
                  </div>
                  <div class="text-left">
                    <strong :class="`text-start text-none ${feedbackColor(!injectionSalineResult)}`">{{
                      injectionSalineResultText + ' ' + item.scoreSaline + '%'
                    }}</strong>
                  </div>
                </v-col>
                <v-col v-else cols="6">
                  <div class="text-left">
                    <strong :class="`text-start text-none ${feedbackColor(!injectionContrastResult)}`">{{
                      injectionContrastResultText
                    }}</strong>
                  </div>
                  <div class="text-left">
                    <strong :class="`text-start text-none ${feedbackColor(!injectionSalineResult)}`">{{
                      injectionSalineResultText
                    }}</strong>
                  </div>
                </v-col>
                <v-col>
                  <div v-if="injectorDoseScreenshot" class="d-flex justify-content-center">
                    <img :src="injectorDoseScreenshot" style="max-height: 400px" />
                  </div>
                </v-col>
              </v-row>
            </div>
            <!-- <div v-else-if="item.gradingType == 'Delay time'">
              <img :src="injectorScreenshot" />
            </div> -->
          </td>
        </template>
      </v-data-table>
    </v-row>
    <v-row v-if="!shouldHideExamResults" class="title-card ma-0 mt-6" justify="center">
      <v-col>
        <v-row>
          <v-tabs v-model="tab" fixed-tabs>
            <v-tab key="exam_results">{{ $t('global.test_results', languageCode) }}</v-tab>
            <v-tab
              key="skill_scores"
              v-if="testResults.questionSetResult && testResults.questionSetResult.overallSkillScores"
            >
              {{ $t('global.skill_scores', languageCode) }}
            </v-tab>
          </v-tabs>
        </v-row>
        <v-row justify="center">
          <v-tabs-items v-model="tab" class="w-100">
            <v-tab-item key="exam_results">
              <!-- single-expand is needed so that we unload the DicomViewer when going to a different StackQuestionResult with a different DicomPreview-->
              <v-data-table
                :headers="tableHeaders"
                :items="items"
                :items-per-page="25"
                :expanded.sync="expanded"
                :single-expand="true"
                item-key="questionNumber"
                hide-default-footer
                disable-sort
                show-expand
                class="pa-0 elevation-0"
              >
                <template #[`item.questionNumber`]="{ item }">
                  <span class="bold">{{ item.questionNumber }}</span>
                </template>
                <template #[`item.questionType`]="{ item }">
                  <span class="bold">{{ $t(`TestResults.${item.questionType}`, languageCode) }}</span>
                </template>
                <template #[`item.questionDescription`]="{ item }">
                  <span class="bold">
                    <TranslatedContent
                      :record="item"
                      :type="isStackQuestion(item.questionType) ? 'stackQuestion' : 'multipleChoiceQuestion'"
                      :lookup="{
                        type: 'nestedKey',
                        path: 'questionText',
                      }"
                    />
                  </span>
                </template>
                <template #[`item.result`]="{ item }">
                  <span v-if="item.skipped" :class="{ bold: true, correct: true }">
                    {{ $t('global.skipped') }}
                  </span>
                  <span
                    v-else-if="!item.freebie && item.sliceQuantScores"
                    :class="{
                      bold: true,
                      correct: item.sliceQuantScores.combinedScore > CUTOFF_SCORE,
                      incorrect: item.sliceQuantScores.combinedScore <= CUTOFF_SCORE,
                    }"
                  >
                    {{ item.sliceQuantScores.combinedScore.toFixed(2) + '%' }}
                  </span>
                  <span
                    v-else-if="!item.freebie"
                    :class="{ bold: true, correct: item.result > CUTOFF_SCORE, incorrect: item.result <= CUTOFF_SCORE }"
                  >
                    {{ !isResultIsNull(item.result) ? item.result.toFixed(2) + '%' : `` }}
                  </span>
                  <span v-else :class="{ bold: true, correct: true }">
                    {{ $t('global.scanned') }}
                  </span>
                </template>
                <template #expanded-item="{ headers, item }">
                  <td :colspan="headers.length">
                    <div class="pa-3" v-if="isStackQuestion(item.questionType)">
                      <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                      {{ item.skipped ? $t('global.skipped') : '' }}

                      <StackQuestionAnswerAnalysis
                        v-if="item.groupScoreVariables"
                        :stack-question-result="item"
                        :group-score-variables="item.groupScoreVariables"
                        :user-answers="item.userAnswers"
                        :is-contrast-lab="item.isContrastLab"
                        :is-ultra-lab="isUltraLab"
                        :is-resolution-lab="isResolutionLab"
                        :question-score="item.score"
                        :dicom-file-set-id="dicomFileSetId"
                        :attempted-answer-identifier="item.attemptedAnswerIdentifier"
                      />
                    </div>
                    <div class="pa-3" v-else>
                      <div class="report-button mb-1">
                        <v-btn class="m-3 feedback-anchor" @click="selectQuestion(item)">
                          {{ $t('TestResults.report_question') }}
                        </v-btn>
                      </div>
                      <CriticalThinkingQuestionResultDetail :critical-thinking-result="item" />
                    </div>
                  </td>
                </template>
              </v-data-table>
            </v-tab-item>
            <v-tab-item
              key="skill_scores"
              v-if="testResults.questionSetResult && testResults.questionSetResult.overallSkillScores"
            >
              <div class="d-flex justify-center">
                <SkillScoresBarChart :skill-scores="testResults.questionSetResult.overallSkillScores" class="mt-10" />
              </div>
            </v-tab-item>
          </v-tabs-items>
        </v-row>
      </v-col>
    </v-row>
    <v-row justify="end">
      <v-btn tile class="no-transform wide-button bold mt-4 mr-4" color="buttonBlue text-white" :to="getReturnToPath()">
        {{ $t('TestResults.return_to_test_selection') }}
      </v-btn>
    </v-row>
  </article>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import Vue from 'vue'
import PassedTest from '@/assets/svg/passed-test.svg'
import ClosePassedTest from '@/assets/svg/close-passed-test.svg'
import FailedTest from '@/assets/svg/failed-test.svg'
import PageTitleCard from '@/components/PageTitleCard'
import TranslatedContent from '@/components/TranslatedContent'
import StackQuestionAnswerAnalysis from './StackQuestionAnswerAnalysis'
import CriticalThinkingQuestionResultDetail from './CriticalThinking/CriticalThinkingQuestionResultDetail'
import SkillScoresBarChart from '../components/Statistics/SkillScoresBarChart.vue'
import _ from 'lodash'
import i18n from '../i18n'
import MRIMachineView from './MRIMachineView.vue'
import MRMRIMachineView from './MRMRIMachineView.vue'
import config from '../config'
import { INJECTION_MODE, MR_PRACTICE_EXAM_ID, CT_PRACTICE_EXAM_ID } from '../constants'
import { getHeadholderText } from '../util/utils'

export default {
  name: 'CombinedTestResults',
  components: {
    PageTitleCard,
    StackQuestionAnswerAnalysis,
    CriticalThinkingQuestionResultDetail,
    TranslatedContent,
    MRIMachineView,
    SkillScoresBarChart,
    MRMRIMachineView,
  },
  props: {
    testResults: {
      type: Object,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isCTLab: config.isCTLab,
      getHeadholderText,
      expanded: [],
      CUTOFF_SCORE: 70,
      testOverview: {},
      borderColor: 'fail-border',
      feedbackText: null,
      feedbackFormValid: null,
      showFeedback: null,
      tablePosition: {
        header: [
          { text: `#`, value: 'index', width: '200px' },
          { text: `Type`, value: 'gradingType', width: '200px' },
          { text: `Result`, value: 'value', width: '200px' },
          { text: '', value: 'data-table-expand' },
        ],
        rows: [
          { index: 1, gradingType: 'Position', value: false },
          { index: 2, gradingType: 'Landmark', value: false },
          { index: 3, gradingType: 'Injection', value: false },
        ],
      },
      defaultQuestionType: config.isCTLab ? 'CT' : 'MRI',
      INJECTION_MODE,
      tab: 0,
    }
  },
  computed: {
    ...mapState('cohortService', ['cohort']),
    ...mapState('questionService', [
      'dicomFileSetId',
      'positionScreenshot',
      'injectorScreenshot',
      'injectorDoseScreenshot',
      'patientDirectionSide1',
      'patientDirectionSide2',
      'patientDirectionSide3',
      'firstSelectedPatientPosition',
    ]),
    ...mapState('selectionConfig', ['isMRIShowHeadHolder']),
    ...mapGetters('user', ['languageCode']),
    ...mapGetters('testRunService', ['currentTest']),
    ...mapGetters('cohortService', ['isChallengeModeEnabledForMe']),
    ...mapGetters('questionService', ['listPatientPositionsAndBodyBox', 'testModelFileName']),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    patientPrepResults() {
      return this.testResults.testRun.patientPrepScores
    },
    shouldHideExamResults() {
      return this.currentTest.preparedExamId != null
    },
    tableHeaders() {
      return [
        { text: `${this.$t('CombinedTestResults.question_number')}`, value: 'questionNumber', width: '100px' },
        { text: `${this.$t('CombinedTestResults.question_type')}`, value: 'questionType', width: '150px' },
        {
          text: `${this.$t('CombinedTestResults.question_description')}`,
          value: 'questionDescription',
          width: '400px',
        },
        { text: `${this.$t('CombinedTestResults.result')}`, value: 'result', width: '100px' },
        // TODO: Add this when Score Review is done.
        /* { text: '', value: 'reviewLink' } */
        { text: '', value: 'data-table-expand' },
      ]
    },
    /*
    landmarkingSIScore() {
      return _.round(this.patientPrepResults.landmarking.si.score, 2)
    },
    landmarkingAPScore() {
      return _.round(this.patientPrepResults.landmarking.ap.score, 2)
    },
    */
    items() {
      const { stackQuestionResults, criticalThinkingResults, questionSetResult } = this.testResults || {}

      const questionCounts = {
        numberOfCorrectQuestions: 0,
        numberOfQuestions: 0,
      }

      const stackQuestionItems = stackQuestionResults
        .filter(
          (el) =>
            !this.isCTLab ||
            (this.isCTLab &&
              _.get(el, ['stackQuestion', 'questionType'], 0) != 3 &&
              _.get(el, ['stackQuestion', 'questionType'], 0) != 4 &&
              !this.shouldHideTrackingBolusEntry(el))
        )
        .map((stackQuestionResult) => {
          const {
            sliceViews,
            groupScoreVariables,
            score,
            skipped,
            freebie,
            userAnswers,
            isContrastLab,
            stackQuestionId,
            attemptedAnswerIdentifier,
            answerViews,
            sliceQuantScores,
            skillScores,
            user,
            stackQuestionResultId,
          } = stackQuestionResult
          const result = Number(score)
          if (result > this.CUTOFF_SCORE) questionCounts.numberOfCorrectQuestions++
          const qText = _.get(stackQuestionResult, ['stackQuestion', 'questionText'], '')

          const questionType =
            _.get(stackQuestionResult, ['stackQuestion', 'questionType'], -1) == 5
              ? 'Tracking bolus'
              : this.defaultQuestionType

          return {
            questionType: questionType,
            questionDescription: qText,
            questionText: qText,
            stackQuestion: stackQuestionResult.stackQuestion || { questionText: qText },
            result: questionType == 'Tracking bolus' ? null : result,
            sliceViews,
            groupScoreVariables,
            skipped,
            freebie,
            userAnswers,
            isContrastLab,
            id: stackQuestionId,
            attemptedAnswerIdentifier,
            answerViews,
            sliceQuantScores,
            skillScores,
            isUltraLab: this.isUltraLab,
            user,
            stackQuestionResultId,
            userId: _.get(questionSetResult, ['userId']),
          }
        })

      let criticalThinkingItems = criticalThinkingResults.map(
        ({
          multipleChoiceQuestionId,
          text,
          score,
          answerExplanation,
          media,
          selectedAnswer,
          selectedAnswerShown,
          type,
          range,
          choices,
          screeningForm,
          category,
        }) => {
          const result = Number(score)
          if (result > this.CUTOFF_SCORE) questionCounts.numberOfCorrectQuestions++

          return {
            multipleChoiceQuestionId,
            questionType: 'Critical Thinking',
            questionDescription: text,
            questionText: text,
            result,
            type,
            choices,
            range,
            media,
            answerExplanation,
            selectedAnswer,
            selectedAnswerShown,
            id: multipleChoiceQuestionId,
            screeningForm,
            category,
          }
        }
      )

      // To show Exam results in the same order they were taken in the test.
      const screeningQuestion = criticalThinkingItems.shift()
      const stackAndCriticalThinkingQuestions = stackQuestionItems.concat(criticalThinkingItems)
      if (screeningQuestion) {
        stackAndCriticalThinkingQuestions.unshift(screeningQuestion)
      }
      stackAndCriticalThinkingQuestions.map((q, idx) => (q.questionNumber = idx + 1))
      questionCounts.numberOfQuestions = stackAndCriticalThinkingQuestions.length
      this.generateTestOverview(questionCounts)
      return stackAndCriticalThinkingQuestions
    },
    patientPositionResult() {
      return !_.get(
        _.find(
          _.get(
            this.items.filter((el) => el.groupScoreVariables),
            [0, 'groupScoreVariables', 0, 'analysis']
          ),
          (el) => _.get(el, 'factorName', '') == 'isScanPositionRight'
        ),
        'isBad',
        true
      )
    },
    landmarkResult() {
      return !_.get(
        _.find(
          _.get(
            this.items.filter((el) => el.groupScoreVariables),
            [0, 'groupScoreVariables', 0, 'analysis']
          ),
          (el) => _.get(el, 'factorName', '') == 'landmarkDistanceRatio'
        ),
        'isBad',
        true
      )
    },
    landmarkResultScoreLoss() {
      return _.get(
        _.find(
          _.get(
            this.items.filter((el) => el.groupScoreVariables),
            [0, 'groupScoreVariables', 0, 'analysis']
          ),
          (el) => _.get(el, 'factorName', '') == 'landmarkDistanceRatio'
        ),
        'scoreLoss',
        0
      )
    },
    injectionContrastResult() {
      return !_.get(
        _.find(
          _.get(
            this.items.filter((el) => el.groupScoreVariables),
            [0, 'groupScoreVariables', 0, 'analysis']
          ),
          (el) => _.get(el, 'factorName', '') == 'injectionContrastValue'
        ),
        'isBad',
        true
      )
    },
    injectionContrastResultText() {
      return i18n.t(
        _.get(
          _.find(
            _.get(
              this.items.filter((el) => el.groupScoreVariables),
              [0, 'groupScoreVariables', 0, 'analysis']
            ),
            (el) => _.get(el, 'factorName', '') == 'injectionContrastValue'
          ),
          'key',
          ''
        ),
        {
          scanlab: this.isCTLab ? 'ScanLabCT' : 'ScanLab™',
          scanlabValue: _.get(
            _.find(
              _.get(
                this.items.filter((el) => el.groupScoreVariables),
                [0, 'groupScoreVariables', 0, 'analysis']
              ),
              (el) => _.get(el, 'factorName', '') == 'injectionContrastValue'
            ),
            'value',
            0
          ),
        }
      )
    },
    injectionSalineResult() {
      return !_.get(
        _.find(
          _.get(
            this.items.filter((el) => el.groupScoreVariables),
            [0, 'groupScoreVariables', 0, 'analysis']
          ),
          (el) => _.get(el, 'factorName', '') == 'injectionSalineValue'
        ),
        'isBad',
        true
      )
    },
    injectionSalineResultText() {
      return i18n.t(
        _.get(
          _.find(
            _.get(
              this.items.filter((el) => el.groupScoreVariables),
              [0, 'groupScoreVariables', 0, 'analysis']
            ),
            (el) => _.get(el, 'factorName', '') == 'injectionSalineValue'
          ),
          'key',
          ''
        ),
        {
          scanlab: this.isCTLab ? 'ScanLabCT' : 'ScanLab™',
          scanlabValue: _.get(
            _.find(
              _.get(
                this.items.filter((el) => el.groupScoreVariables),
                [0, 'groupScoreVariables', 0, 'analysis']
              ),
              (el) => _.get(el, 'factorName', '') == 'injectionSalineValue'
            ),
            'value',
            0
          ),
        }
      )
    },
    injectionSettingResult() {
      return _.some(
        _.get(
          this.items.filter((el) => el.groupScoreVariables),
          [0, 'groupScoreVariables'],
          []
        ),
        (el) => {
          return !_.get(
            _.find(_.get(el, 'analysis'), (el) => _.get(el, 'factorName', '') == 'delayTime'),
            'isBad',
            true
          )
        }
      )
    },
    /*
    mriMachinePositionAnswer() {
      let mriMachinePosition = {
        mriUpDownPositionY: 0,
        mriInOutPositionZ: 0,
      }
      let isMRIShowHeadHolder = false
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.mriMachinePosition)
          if (answer) {
            mriMachinePosition = answer.mriMachinePosition
          }

          const answerHasIsMRIShowHeadHolder = _.get(el, ['userAnswers'], []).find((o) =>
            _.has(o, ['isMRIShowHeadHolder'])
          )
          if (answerHasIsMRIShowHeadHolder) {
            isMRIShowHeadHolder = answer.isMRIShowHeadHolder
          }
        }
      )

      let patientPositions = []
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.patientPositions)
          if (answer) {
            patientPositions = answer.patientPositions
          }
        }
      )

      return {
        mriMachinePosition: mriMachinePosition,
        patientPositions: patientPositions,
        isMRIShowHeadHolder: isMRIShowHeadHolder,
      }
    },
    */
    injectionModeResult() {
      let mode = this.INJECTION_MODE.CONTRAST_AND_SALINE
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => _.has(o, ['testInjectionMode']))
          if (answer) {
            mode = answer.testInjectionMode
          }
        }
      )

      return mode
    },
  },
  async mounted() {
    let patientPrepRows
    if (this.patientPrepResults && this.patientPrepResults.scores) {
      patientPrepRows = []
      let indexCount = 1
      _.forEach(this.patientPrepResults.scores, (el) => {
        //console.log(el)
        patientPrepRows.push(
          {
            index: indexCount++,
            gradingType: 'Position',
            value: el.positioning.score,
            patientPosition: this.patientPositionAnswer(el),
            patientPositionScreenshot: this.patientPositionScreenshot(el),
          },
          {
            index: indexCount++,
            gradingType: 'Landmark',
            value: _.round(el.landmarking.combinedScore, 2),
            scoreAP: _.round(el?.landmarking?.ap?.score || 0, 2),
            scoreSI: _.round(el.landmarking.si.score, 2),
            distanceAP: this.landmarkingAPDistance(el),
            distanceSI: this.landmarkingSIDistance(el),
            mriMachinePosition: this.mriMachinePosition(el),
            //distanceAP: _.round(el.landmarking.ap.analysis[0].value, 2), //need to add +/- signs
            //distanceSI: _.round(el.landmarking.si.analysis[0].value, 2),
          },
          {
            index: indexCount++,
            gradingType: 'Injection',
            value: _.round(el.injectors.combinedScore, 2),
            scoreContrast: _.round(el.injectors.contrast.score, 2),
            scoreSaline: _.round(el.injectors.saline.score, 2),
            hidden: !el.injectors.combinedScore,
          }
        )
      })
    }

    // patientPrepResults has to be tested for backward compatibility
    this.tablePosition = {
      ...this.tablePosition,
      rows: patientPrepRows || [
        {
          index: 1,
          gradingType: 'Position',
          value: this.patientPrepResults ? this.patientPrepResults.positioning.score : this.patientPositionResult,
        },
        {
          index: 2,
          gradingType: 'Landmark',
          value: this.patientPrepResults
            ? _.round(this.patientPrepResults.landmarking.combinedScore, 2)
            : this.landmarkResult,
        },
        {
          index: 3,
          gradingType: 'Injection',
          value: this.patientPrepResults
            ? _.round(this.patientPrepResults.injectors.combinedScore, 2)
            : this.injectionModeResult == this.INJECTION_MODE.CONTRAST_AND_SALINE
            ? this.injectionContrastResult && this.injectionSalineResult
            : this.injectionContrastResult,
          hidden: !this.injectorDoseScreenshot,
        },
        // { index: 4, gradingType: 'Delay time', value: this.injectionSettingResult },
      ],
    }
  },
  methods: {
    ...mapActions('questionService', ['reportCriticalThinkingQuestion']),
    shouldHideTrackingBolusEntry(stackQuestionResult) {
      const isTimingDecisionQuestion = _.get(stackQuestionResult, ['stackQuestion', 'questionType'], -1) == 5
      if (!isTimingDecisionQuestion) {
        return false
      }

      const userAnswers = _.get(stackQuestionResult, ['userAnswers'], [])
      const isSetDelayByTimingDecisionInfo = _.some(userAnswers, (answer) =>
        _.get(answer, ['timingDecisionInfo', 'isSelectedSetDelayTimingDecision'], false)
      )
      const isSetDelayByLegacyFlag = _.some(userAnswers, (answer) =>
        _.get(answer, ['isTimingDecisionUseSetDelay'], false)
      )

      return isSetDelayByTimingDecisionInfo || isSetDelayByLegacyFlag
    },
    isResultIsNull(result) {
      return result === null || result === undefined
    },
    getReturnToPath() {
      let toPath = { path: '/' }

      // practice exam should redirect back to practice exam selection
      const practiceExamId = config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
      if (this.testResults.testRun.preparedExamId === practiceExamId) {
        toPath = { path: '/prepared-exam-selection/skill' }
      } else if (this.testResults.testRun.preparedExamId) {
        toPath = {
          path:
            '/prepared-exam-selection/skill?vendor=' +
            this.testResults.testRun.softwareVendor +
            '&version=' +
            this.testResults.testRun.softwareVersion,
        }
      }
      return toPath
    },
    isStackQuestion(questionType) {
      return questionType == this.defaultQuestionType || questionType == 'Tracking bolus'
    },
    landmarkingSIDistance(item) {
      let output = 0
      if (item.landmarking.si.analysis[0].isBad) {
        let direction = item.landmarking.si.analysis[0].key.includes('small') ? '-' : ''
        output = direction + _.round(item.landmarking.si.analysis[0].value, 2)
      }
      return output
    },
    landmarkingAPDistance(item) {
      let output = 0
      if (item?.landmarking?.ap?.analysis[0]?.isBad) {
        let direction = item?.landmarking?.ap?.analysis[0]?.key.includes('small') ? '-' : ''
        output = direction + _.round(item?.landmarking?.ap?.analysis[0]?.value || 0, 2)
      }
      return output
    },
    patientPositionScreenshot(item) {
      const questionId = item.answer.stackQuestionId
      const questionResult = this.testResults.stackQuestionResults.find((o) => o.stackQuestionId == questionId)
      const imgSrc = questionResult.givenAnswer.answerViews.find((o) => o.id == 'positionScreenshot')?.src
      return imgSrc
    },
    mriMachinePosition(item) {
      let mriMachinePosition = {
        mriUpDownPositionY: 0,
        mriInOutPositionZ: 0,
      }
      let isMRIShowHeadHolder = false
      let patientPositions = []
      if (item.answer.variables && item.answer.variables[0].mriMachinePosition) {
        const positionData = item.answer.variables[0].submittedPatientPosition
        patientPositions.push(positionData.side1)
        patientPositions.push(positionData.side2)
        patientPositions.push(positionData.side3)
        mriMachinePosition = item.answer.variables[0].mriMachinePosition
        isMRIShowHeadHolder = positionData.isShowHeadHolder
      }

      return {
        mriMachinePosition: mriMachinePosition,
        patientPositions: patientPositions,
        isMRIShowHeadHolder: isMRIShowHeadHolder,
      }
    },
    patientPositionAnswer(item) {
      let value = []
      let positionData = item.answer.variables[0].firstSelectedPatientPosition
      value.push(positionData.side1)
      value.push(positionData.side2)
      value.push(positionData.side3)
      return `${value.join(', ')}${positionData.headHolder ? `, ${this.getHeadholderText()}` : ''}`
    },
    parseResultToText(val) {
      if (val) {
        return this.$t('global.correct', this.languageCode)
      } else {
        return this.$t('global.incorrect', this.languageCode)
      }
    },
    feedbackColor(isBad) {
      if (isBad) {
        return 'score_ok'
      } else {
        return 'score_very_good'
      }
    },
    selectQuestion(question) {
      this.selectedQuestion = question

      // Check if this question has valid multipleChoiceQuestionId
      if (this.selectedQuestion.multipleChoiceQuestionId) {
        this.showFeedback = true
        if (this.$refs.feedbackForm) {
          this.$refs.feedbackForm.reset()
        }
      } else {
        Vue.notify({ type: 'error', text: 'Question ID is not valid' })
      }
    },
    submitFeedback() {
      this.reportCriticalThinkingQuestion({
        id: this.selectedQuestion.multipleChoiceQuestionId,
        feedback: this.feedbackText,
        isCTLab: this.isCTLab,
      })

      this.selectedQuestion = null
      this.showFeedback = false
    },
    generateTestOverview({ numberOfCorrectQuestions, numberOfQuestions }) {
      const overallPercentage = parseFloat(this.testResults.testRun.score)
      let testResultImage = FailedTest

      if (overallPercentage > 60 && overallPercentage < 80) {
        testResultImage = ClosePassedTest
        this.borderColor = 'danger-border'
      }

      if (overallPercentage >= 80) {
        testResultImage = PassedTest
        this.borderColor = 'pass-border'
      }

      this.testOverview = {
        image: testResultImage,
        numberOfCorrectQuestions,
        numberOfQuestions,
        overallPercentage,
        overallPercentageDisplay: overallPercentage.toFixed(2),
      }
    },
  },
}
</script>

<style scoped lang="scss">
.score_very_good {
  color: green;
}

.score_ok {
  color: orange;
}

.score_bad {
  color: red;
}
.bold {
  font-weight: bold;
}

.correct {
  color: #008000 !important;
}

.incorrect {
  color: $red !important;
}

.explanation {
  width: 80%;
  padding: 0 2rem;
}

.report-button {
  width: 20%;
  text-align: center;
  float: right;
}

.wide-button {
  font-size: 18px !important;
  min-width: 250px !important;
  padding: 35px 25px !important;
}

.no-transform {
  text-transform: none;
  letter-spacing: 0;
}

.title-card {
  border-radius: 0 1rem;
  padding: 1.25rem;
  width: 100%;
  background-color: $white;
  box-shadow: 0 0 0.5rem $gray-two;
  margin-top: 1rem;
}

.theme--light.v-data-table {
  background-color: $white;
}
</style>
