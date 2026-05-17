<template>
  <div>
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
            :lookup="{ type: 'nestedKey', path: 'questionText' }"
          />
        </span>
      </template>
      <template #[`item.result`]="{ item }">
        <span
          v-if="item.skipped"
          :class="{
            bold: true,
            correct: true,
            ...getTextGlowsClass(item),
          }"
        >
          {{ $t('global.skipped') }}
        </span>
        <span
          v-else-if="!item.freebie && isCTLab && item.sliceQuantScores"
          :class="{
            bold: true,
            correct: item.sliceQuantScores.combinedScore > CUTOFF_SCORE,
            incorrect: item.sliceQuantScores.combinedScore <= CUTOFF_SCORE,
            ...getTextGlowsClass(item),
          }"
        >
          {{ item.sliceQuantScores.combinedScore.toFixed(2) + '%' }}
        </span>
        <span
          v-else-if="!item.freebie"
          :class="{
            bold: true,
            correct: item.result > CUTOFF_SCORE,
            incorrect: item.result <= CUTOFF_SCORE,
            ...getTextGlowsClass(item),
          }"
        >
          {{ !isResultIsNull(item.result) ? item.result.toFixed(2) + '%' : `` }}
        </span>
        <span
          v-else
          :class="{
            bold: true,
            correct: true,
            ...getTextGlowsClass(item),
          }"
        >
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
              :is-ultra-lab="item.isUltraLab"
              :question-score="item.score"
              :dicom-file-set-id="testResults.dicomFileSetId"
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
  </div>
</template>
<script>
import PassedTest from '@/assets/svg/passed-test.svg'
import ClosePassedTest from '@/assets/svg/close-passed-test.svg'
import FailedTest from '@/assets/svg/failed-test.svg'
import StackQuestionAnswerAnalysis from './StackQuestionAnswerAnalysis'
import CriticalThinkingQuestionResultDetail from './CriticalThinking/CriticalThinkingQuestionResultDetail'
import { mapActions, mapGetters, mapState } from 'vuex'
import TranslatedContent from '@/components/TranslatedContent'
import config from '../config'
import _ from 'lodash'

export default {
  name: 'CombinedTestResultsTable',
  components: {
    StackQuestionAnswerAnalysis,
    CriticalThinkingQuestionResultDetail,
    TranslatedContent,
  },
  props: {
    testResults: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      expanded: [],
      borderColor: 'fail-border',
      selectedQuestion: null,
      showFeedback: false,
      feedbackFormValid: null,
      feedbackText: null,
      CUTOFF_SCORE: 70,
      isCTLab: config.isCTLab,
      defaultQuestionType: config.isCTLab ? 'CT' : 'MRI',
    }
  },
  computed: {
    ...mapState('authentication', ['userId']),
    ...mapGetters('user', ['languageCode']),
    isUserView() {
      return this.userId == this.testResults?.questionSetResult?.userId
    },
    tableHeaders() {
      return [
        { text: `${this.$t('CombinedTestResults.question_number')}`, value: 'questionNumber', width: '100px' },
        { text: `${this.$t('CombinedTestResults.question_type')}`, value: 'questionType', width: '150px' },
        {
          text: `${this.$t('CombinedTestResults.question_description')}`,
          value: 'questionDescription',
          width: '300px',
        },
        { text: `${this.$t('CombinedTestResults.result')}`, value: 'result', width: '300px' },
        { text: '', value: 'data-table-expand' },
      ]
    },
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
            isUltraLab,
            stackQuestionId,
            attemptedAnswerIdentifier,
            answerViews,
            sliceQuantScores,
            skillScores,
            stackQuestionResultComments,
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
            isUltraLab,
            id: stackQuestionId,
            attemptedAnswerIdentifier,
            answerViews,
            sliceQuantScores,
            skillScores,
            stackQuestionResultComments,
            user,
            stackQuestionResultId,
            userId: _.get(questionSetResult, ['userId']),
          }
        })

      let criticalThinkingItems = []
      if (!this.isCTLab) {
        criticalThinkingItems = criticalThinkingResults.map(
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
      }

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
    getTextGlowsClass(stackQuestionResult) {
      const allAdminComments = (stackQuestionResult.stackQuestionResultComments || []).filter(
        (comment) => comment.commentedUserId != this.testResults?.questionSetResult?.userId
      )
      const allUserReplies = (stackQuestionResult.stackQuestionResultComments || []).filter(
        (comment) => comment.commentedUserId == this.testResults?.questionSetResult?.userId
      )

      const isNotViewedReply =
        allUserReplies.length > 0 && allUserReplies.some((comment) => !comment.seen) && !this.isUserView
      const isNotViewedAdminComment =
        allAdminComments.length > 0 && allAdminComments.some((comment) => !comment.seen) && this.isUserView
      const isHasReply = allUserReplies.length > 0
      const isHasAdminComment = allAdminComments.length > 0

      if (isNotViewedAdminComment || isNotViewedReply) {
        return {
          'text-yellow-glowing': true,
        }
      } else if (isHasReply) {
        return {
          'text-green-glowing': true,
        }
      } else if (isHasAdminComment) {
        return {
          'text-blue-glowing': true,
        }
      } else {
        return {}
      }
    },
    isStackQuestion(questionType) {
      return questionType == this.defaultQuestionType || questionType == 'Tracking bolus'
    },
    selectQuestion(question) {
      this.selectedQuestion = question
      this.showFeedback = true
      if (this.$refs.feedbackForm) {
        this.$refs.feedbackForm.reset()
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
      const overallPercentage = parseFloat(this.testResults.overall)
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
<style lang="scss" scoped>
@keyframes text-yellow-glowing {
  from {
    text-shadow: 0 0 3px #fff, 0 0 5px #f08b17, 0 0 7px #f08b17, 0 0 8px #f08b17;
  }
  to {
    text-shadow: 0 0 6px #fff, 0 0 12px #f0bd17, 0 0 14px #f0bd17, 0 0 24px #f0bd17;
  }
}

.text-yellow-glowing {
  animation: text-yellow-glowing 1s ease-in-out infinite alternate;
}

@keyframes text-blue-glowing {
  from {
    text-shadow: 0 0 3px #fff, 0 0 5px #173ff0, 0 0 7px #173ff0, 0 0 8px #1751f0;
  }
  to {
    text-shadow: 0 0 6px #fff, 0 0 12px #177cf0, 0 0 14px #176ef0, 0 0 24px #1775f0;
  }
}

.text-blue-glowing {
  animation: text-blue-glowing 1s ease-in-out infinite alternate;
}

@keyframes text-green-glowing {
  from {
    text-shadow: 0 0 3px #fff, 0 0 5px #006f00, 0 0 7px #006f00, 0 0 8px #006f00;
  }
  to {
    text-shadow: 0 0 6px #fff, 0 0 12px #2ebe2e, 0 0 14px #2ebe2e, 0 0 24px #2ebe2e;
  }
}

.text-green-glowing {
  animation: text-green-glowing 1s ease-in-out infinite alternate;
}

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
