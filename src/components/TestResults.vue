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
            ></v-textarea>
            <div class="d-flex justify-space-between">
              <v-btn :disabled="!feedbackFormValid" type="submit" color="primary">{{ $t('global.submit') }}</v-btn>
              <v-btn @click="showFeedback = false">{{ $t('global.close') }}</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="show" :persistent="!closable" width="90%">
      <v-card class="mx-auto">
        <v-card-title class="d-flex justify-space-between">
          <p>{{ $t('global.test_results') }}</p>
          <p v-if="(isManager || isAdmin) && testResults.questionSetResultId">
            <v-btn @click.native.stop="showDeleteModal = true" icon><v-icon color="error">delete</v-icon></v-btn>
          </p>
          <p v-if="hasScanlabScore">{{ testResults.overall }}%</p></v-card-title
        >
        <v-card-text>
          <v-tabs v-model="tab">
            <v-tab key="mri" v-if="testResults.stackQuestionResults && !isCTLab">{{ $t('global.mri') }}</v-tab>
            <v-tab key="screening" v-if="patientScreeningForm && isCTLab">{{ $t('global.screening') }}</v-tab>
            <v-tab key="patient_prep" v-if="testResults.stackQuestionResults && isCTLab">{{
              $t('global.patient_prep')
            }}</v-tab>
            <v-tab key="ct" v-if="testResults.stackQuestionResults && isCTLab">{{ $t('global.ct') }}</v-tab>
            <v-tab key="critical_thinking" v-if="criticalThinkingResultsFiltered.length > 0">{{
              $t('global.critical_thinking')
            }}</v-tab>
            <v-tab key="skillScores" v-if="testResults.overallSkillScores">
              {{ $t('global.skill_scores', languageCode) }}
            </v-tab>
            <v-tab key="admin" v-if="isAdmin">
              {{ $t('global.admin', languageCode) }}
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="tab">
            <v-tab-item key="mri" v-if="testResults.stackQuestionResults && !isCTLab">
              <v-row v-if="isUltraLab">
                <h5 class="text-left bold pa-5">
                  {{ $t('global.mri_score') }}: {{ testResults && testResults.sliceQuantScore ? testResults.sliceQuantScore : 0 }}%
                </h5>
              </v-row>
              <v-row v-else>
                <h5 class="text-left bold pa-5">
                  {{ $t('global.mri_score') }}: {{ displayedMriScore }}%
                </h5>
              </v-row>
              <v-expansion-panels accordion tile hover v-model="selectedStackQuestionResultIndex">
                <v-expansion-panel
                  v-for="(stackQuestionResult, index) in testResults.stackQuestionResults"
                  :key="stackQuestionResult.stackQuestionId"
                >
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col cols="10">
                        <TranslatedContent
                          v-if="stackQuestionResult.stackQuestion"
                          type="stackQuestion"
                          :record="stackQuestionResult.stackQuestion"
                          :lookup="{ type: 'nestedKey', path: 'questionText' }"
                        />
                        <span v-else>{{ $t('global.question') }}</span>
                      </v-col>
                      <v-col
                        cols="2"
                        v-if="stackQuestionResult.skipped"
                        class="correct"
                        :class="{
                          ...getTextGlowsClass(stackQuestionResult),
                        }"
                      >
                        {{ $t('global.skipped') }}
                      </v-col>
                      <v-col cols="2" v-else>
                        <div
                          v-if="stackQuestionResult.freebie"
                          class="correct"
                          :class="{
                            ...getTextGlowsClass(stackQuestionResult),
                          }"
                        >
                          {{ $t('global.scanned') }}
                        </div>
                        <div
                          v-else-if="stackQuestionResult.isUltraLab"
                          :class="{
                            correct: stackQuestionResult.sliceQuantScores.combinedScore > CUTOFF_SCORE,
                            incorrect: stackQuestionResult.sliceQuantScores.combinedScore <= CUTOFF_SCORE,
                            ...getTextGlowsClass(stackQuestionResult),
                          }"
                        >
                          {{ combinedScore(stackQuestionResult) }}%
                        </div>
                        <div
                          v-else
                          :class="{
                            correct: stackQuestionResult.score > CUTOFF_SCORE,
                            incorrect: stackQuestionResult.score <= CUTOFF_SCORE,
                            ...getTextGlowsClass(stackQuestionResult),
                          }"
                        >
                          {{ combinedScore(stackQuestionResult) }}%
                        </div>
                      </v-col>
                      <v-col cols="2" v-if="(isAdmin || isManager) && showTimeFocus(stackQuestionResult)">
                        <div v-if="stackQuestionResult.userAnswers[0].elapsedTime">
                          {{ `${$t('SkillScores.Time')}:` }} {{ getElapsedTime(stackQuestionResult) }}
                        </div>
                        <!--
                        <div v-if="stackQuestionResult.userAnswers[0].lostWindowFocus">
                          {{ `Left:` }} {{ stackQuestionResult.userAnswers[0].lostWindowFocus }}
                        </div>
                        -->
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-col v-if="stackQuestionResult.skipped">{{ $t('global.skipped') }}</v-col>

                    <!-- By default the content of v-expansion-panel-content does not get unloaded when you switch tabs... -->
                    <!-- but since we potentially load a DICOM viewer inside of it, it needs to get unrendered when we expand a different StackQuestion -->
                    <div v-if="selectedStackQuestionResultIndex === index">
                      <StackQuestionAnswerAnalysis
                        v-if="stackQuestionResult.groupScoreVariables && !stackQuestionResult.skipped"
                        :stack-question-result="stackQuestionResult"
                        :group-score-variables="stackQuestionResult.groupScoreVariables"
                        :user-answers="stackQuestionResult.userAnswers"
                        :is-contrast-lab="stackQuestionResult.isContrastLab"
                        :is-ultra-lab="stackQuestionResult.isUltraLab"
                        :question-score="stackQuestionResult.score"
                        :attempted-answer-identifier="stackQuestionResult.attemptedAnswerIdentifier"
                        :dicom-file-set-id="testResults.dicomFileSetId"
                      />
                    </div>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-tab-item>
            <v-tab-item key="screening" v-if="patientScreeningForm && isCTLab">
              <v-row>
                <h5 class="text-left bold pa-5">
                  {{ $t('global.patient_screening_score') }}: {{ patientScreeningForm.score }}%
                </h5>
              </v-row>
              <v-expansion-panels accordion tile hover>
                <v-expansion-panel>
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col cols="11">
                        {{ patientScreeningForm.text }}
                      </v-col>
                      <v-col cols="1">
                        <span :class="`${patientScreeningForm.score > CUTOFF_SCORE ? 'correct' : 'incorrect'}`">
                          {{ patientScreeningForm.score }}%
                        </span>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content
                    ><div>
                      <v-btn class="mt-1 mb-3 feedback-anchor" @click="selectQuestion(patientScreeningForm)">{{
                        $t('TestResults.report_question')
                      }}</v-btn>
                      <br />
                      <div class="result-container">
                        <CriticalThinkingQuestionResultDetail :critical-thinking-result="patientScreeningForm" />
                      </div>
                    </div>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-tab-item>
            <v-tab-item key="patient_prep" v-if="testResults.stackQuestionResults && isCTLab">
              <v-row>
                <h5 class="text-left bold pa-5">
                  {{ $t('global.patient_prep_score') }}: {{ testResults.patientPrepScore }}%
                </h5>
              </v-row>
              <div class="mt-2">
                <CombinedTestResultsOverviewTable :test-results="testResults" />
              </div>
            </v-tab-item>
            <v-tab-item key="ct" v-if="testResults.stackQuestionResults && isCTLab">
              <v-row>
                <h5 class="text-left bold pa-5">
                  {{ $t('global.ct_question_score') }}:
                  {{
                    testResults && testResults.sliceQuantScore
                      ? testResults.sliceQuantScore
                      : (testResults && testResults.questionSetResultScore) ? testResults.questionSetResultScore : 0
                  }}%
                </h5>
              </v-row>
              <div class="mt-2">
                <CombinedTestResultsTable :test-results="testResults" />
              </div>
            </v-tab-item>
            <v-tab-item key="critical_thinking" v-if="criticalThinkingResultsFiltered.length > 0">
              <v-row>
                <h5 class="text-left bold pa-5">
                  {{ $t('global.critical_thinking_score') }}: {{ testResults.criticalThinkingOverallScore }}%
                </h5>
              </v-row>
              <v-expansion-panels accordion tile hover v-model="selectedCriticalThinkingStackQuestionResultIndex">
                <v-expansion-panel
                  v-for="(criticalThinkingResult, index) in criticalThinkingResultsFiltered"
                  :key="criticalThinkingResult.questionId"
                >
                  <v-expansion-panel-header>
                    <v-row>
                      <v-col cols="11">
                        <TranslatedContent
                          type="multipleChoiceQuestion"
                          :record="criticalThinkingResult.multipleChoiceQuestion"
                          :lookup="{ type: 'nestedKey', path: 'questionText' }"
                        />
                      </v-col>
                      <v-col cols="1">
                        <span :class="`${criticalThinkingResult.score > CUTOFF_SCORE ? 'correct' : 'incorrect'}`">
                          {{ criticalThinkingResult.score }}%
                        </span>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-header>
                  <v-expansion-panel-content
                    ><div>
                      <div class="d-flex flex-column float-right">
                        <v-btn class="mt-1 mb-3 feedback-anchor" @click="selectQuestion(criticalThinkingResult)">{{
                          $t('TestResults.report_question')
                        }}</v-btn>
                        <v-btn
                          class="mt-1 mb-3 feedback-anchor"
                          v-if="isAdmin"
                          @click="goToQuestion(criticalThinkingResult)"
                          >{{ $t('global.go_to_question') }}</v-btn
                        >
                      </div>
                      <br />
                      <div class="result-container">
                        <CriticalThinkingQuestionResultDetail
                          :critical-thinking-result="criticalThinkingResult"
                          v-if="selectedCriticalThinkingStackQuestionResultIndex == index"
                        />
                      </div>
                    </div>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-tab-item>
            <v-tab-item key="skillScores" v-if="testResults.overallSkillScores">
              <SkillScoresBarChart :skill-scores="testResults.overallSkillScores" />
            </v-tab-item>
            <v-tab-item key="admin" v-if="isAdmin">
              <div class="mt-2">
                <AdminTestResult :test-results="testResults" />
              </div>
            </v-tab-item>
          </v-tabs-items>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn v-if="closable" outlined block @click="show = false">{{ $t('global.close') }}</v-btn>
          <v-btn v-else outlined block :to="{ path: '/' }">{{ $t('TestResults.return_to_test_selection') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteModal" width="80%" :persistent="isDeletingTestRun">
      <v-card outlined>
        <v-card-title>
          <span class="headline">
            {{ $t('TestResults.delete_test_run', languageCode) }}
          </span>
        </v-card-title>
        <v-progress-linear v-if="isDeletingTestRun" indeterminate color="primary" />

        <v-card-text class="dicom-name">
          {{ $t('TestResults.delete_test_run_description', languageCode) }}
          <div class="pt-2">
            <div v-if="isAdmin">
              {{ $t('TestResults.delete_test_run_description_admin', languageCode) }}
            </div>
            <div v-else>
              {{ $t('TestResults.delete_test_run_description_manager', languageCode) }}
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="right">
          <v-spacer></v-spacer>
          <v-btn outlined :disabled="isDeletingTestRun" @click="showDeleteModal = false">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="error" :loading="isDeletingTestRun" :disabled="isDeletingTestRun" @click="deleteTestRun()">
            {{ $t('global.delete', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import CriticalThinkingQuestionResultDetail from './CriticalThinking/CriticalThinkingQuestionResultDetail'
import StackQuestionAnswerAnalysis from './StackQuestionAnswerAnalysis'
import CombinedTestResultsTable from './CombinedTestResultsTable.vue'
import CombinedTestResultsOverviewTable from './CombinedTestResultsOverviewTable.vue'
import AdminTestResult from './AdminTestResult.vue'
import SkillScoresBarChart from '../components/Statistics/SkillScoresBarChart.vue'
import { mapActions, mapGetters, mapState } from 'vuex'
import { apiDelete } from '../util/api'
import EventBus from '@/lib/event-bus'
import _ from 'lodash'
import config from '../config'
import TranslatedContent from '@/components/TranslatedContent'

export default {
  name: 'TestResults',
  components: {
    CriticalThinkingQuestionResultDetail,
    StackQuestionAnswerAnalysis,
    CombinedTestResultsTable,
    CombinedTestResultsOverviewTable,
    SkillScoresBarChart,
    AdminTestResult,
    TranslatedContent,
  },
  props: {
    testResults: {
      type: Object,
      required: true,
    },
    closable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      tab: 0,
      CUTOFF_SCORE: 70,
      show: true,
      feedbackText: null,
      feedbackFormValid: null,
      selectedQuestion: null,
      showFeedback: null,
      showDeleteModal: null,
      isDeletingTestRun: false,
      selectedStackQuestionResultIndex: null,
      selectedCriticalThinkingStackQuestionResultIndex: null,
      isCTLab: config.isCTLab,
    }
  },
  watch: {
    show(newValue) {
      if (newValue === false) {
        this.$emit('close')
      } else {
        this.$emit('open')
      }
    },
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapState('user', ['isManager', 'isAdmin']),
    ...mapState('authentication', ['accessToken', 'userId']),
    isUserView() {
      return this.userId == this.testResults?.questionSetResult?.userId
    },
    isUltraLab() {
      return this.testResults.stackQuestionResults.reduce((acc, r) => acc || r.isUltraLab, false)
    },
    displayedMriScore() {
      if (!this.testResults) return 0
      const { sliceQuantScore, mriOverallScore } = this.testResults
      if (sliceQuantScore !== null && sliceQuantScore !== undefined) return sliceQuantScore
      if (mriOverallScore !== null && mriOverallScore !== undefined) return mriOverallScore
      return 0
    },
    hasScanlabScore() {
      return !_.isNil(_.get(this.testResults, 'overall'))
    },
    patientScreeningForm() {
      // There should only be one SF question, so filter and take whats left
      let screeningForm = this.testResults.criticalThinkingResults.find((r) => r.type === 'SF')
      return screeningForm
    },
    criticalThinkingResultsFiltered() {
      let filtered = this.testResults.criticalThinkingResults
      // ct screening form needs to be removed from the list, otherwise show all for mr
      if (this.isCTLab) {
        filtered = filtered.filter((r) => r.type !== 'SF')
      }
      return filtered
    },
    items() {
      const { stackQuestionResults, criticalThinkingResults } = this.testResults || {}

      const questionCounts = {
        numberOfCorrectQuestions: 0,
        numberOfQuestions: 0,
      }

      const stackQuestionItems = stackQuestionResults.map((stackQuestionResult) => {
        const {
          sliceViews,
          groupScoreVariables,
          score,
          skipped,
          freebie,
          userAnswers,
          isContrastLab,
          stackQuestionId,
          stackQuestionResultId,
          attemptedAnswerIdentifier,
          answerViews,
          stackQuestionResultComments,
          user,
        } = stackQuestionResult
        const result = Number(score)
        if (result > this.CUTOFF_SCORE) questionCounts.numberOfCorrectQuestions++
        const qText = _.get(stackQuestionResult, ['stackQuestion', 'questionText'], '')

        return {
          questionType: 'MRI',
          questionDescription: qText,
          questionText: qText,
          stackQuestion: stackQuestionResult.stackQuestion || { questionText: qText },
          result,
          sliceViews,
          groupScoreVariables,
          skipped,
          freebie,
          userAnswers,
          isContrastLab,
          id: stackQuestionId,
          attemptedAnswerIdentifier,
          answerViews,
          stackQuestionResultComments,
          user,
          stackQuestionResultId,
        }
      })

      const criticalThinkingItems = criticalThinkingResults.map(
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
      return stackAndCriticalThinkingQuestions
    },
    previewTestModelId() {
      let modelId = 1
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.testPatientModelId)
          if (answer) {
            modelId = answer.testPatientModelId
          }
        }
      )
      return modelId
    },
    previewTestPatientName() {
      let patientName = ''
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.testPatientName)
          if (answer) {
            patientName = answer.testPatientName
          }
        }
      )
      return patientName
    },
    previewTestPatientFamilyMemberSignature() {
      let patientName = ''
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.testPatientFamilyMemberSignature)
          if (answer) {
            patientName = answer.testPatientFamilyMemberSignature
          }
        }
      )
      return patientName
    },
  },
  mounted() {
    if (this.isCTLab) {
      if (this.previewTestModelId) {
        this.setTestPatientModelId(this.previewTestModelId)
      }
      if (this.previewTestPatientName) {
        this.setTestPatientName(this.previewTestPatientName)
      }
      this.setTestPatientFamilyMemberSignature(this.previewTestPatientFamilyMemberSignature)
    }
  },
  methods: {
    ...mapActions('questionService', [
      'reportCriticalThinkingQuestion',
      'setTestPatientModelId',
      'setTestPatientName',
      'setTestPatientFamilyMemberSignature',
    ]),
    round: _.round,
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
    selectQuestion(question) {
      this.selectedQuestion = question
      this.showFeedback = true
      if (this.$refs.feedbackForm) {
        this.$refs.feedbackForm.reset()
      }
    },
    goToQuestion(criticalThinkingResult) {
      const routeData = this.$router.resolve({
        path: `critical-thinking-manager?id=${criticalThinkingResult.questionId}`,
      })
      window.open(routeData.href, '_blank')
    },
    combinedScore(stackQuestionResult) {
      if (stackQuestionResult.sliceQuantScores) {
        return _.round(stackQuestionResult.sliceQuantScores.combinedScore, 2)
      } else {
        return stackQuestionResult.score
      }
    },
    showTimeFocus(stackQuestionResult) {
      let output = false
      if (stackQuestionResult.userAnswers) output = true
      return output
    },
    getElapsedTime(stackQuestionResult) {
      const [, minutes, seconds] = stackQuestionResult.userAnswers[0].elapsedTime.split(':')
      return minutes === '00'
        ? `${seconds} ${this.$t('Injector.sec', this.languageCode)}`
        : `${minutes} ${this.$t('Injector.min', this.languageCode)} ${seconds} ${this.$t(
            'Injector.sec',
            this.languageCode
          )}`
    },
    submitFeedback() {
      this.reportCriticalThinkingQuestion({
        id: this.selectedQuestion.questionId,
        feedback: this.feedbackText,
        isCTLab: this.isCTLab,
      })
      this.selectedQuestion = null
      this.showFeedback = false
    },

    async deleteTestRun() {
      if (this.isDeletingTestRun) {
        return
      }

      this.isDeletingTestRun = true

      try {
        const response = await apiDelete(
          `/results/review/questionSet/${this.testResults.questionSetResultId}?isCTLab=${this.isCTLab ? 1 : 0}&userId=${
            this.testResults?.questionSetResult?.userId
          }`,
          this.accessToken
        )

        if (response.data.success) {
          this.showDeleteModal = false
          EventBus.$emit('TestRunDeleted')
          this.show = false
          this.$notify({ text: 'Deleted successfully' })
        } else {
          this.$notify({ text: response.data.error, type: 'error' })
        }
      } catch (err) {
        this.$notify({ text: 'Delete failed', type: 'error' })
      } finally {
        this.isDeletingTestRun = false
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

.feedback-anchor {
  font-size: 0.8em;
  float: right;
}
.correct {
  font-weight: bold;
  color: #008000;
}

.incorrect {
  font-weight: bold;
  color: $red;
}
.result-container {
  width: 50vw;
  margin: auto;
}
</style>
