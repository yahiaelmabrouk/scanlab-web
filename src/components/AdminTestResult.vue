<template>
  <div class="ml-4">
    <div v-if="testResults">
      <!-- Existing Metadata -->
      <div class="mb-4">
        <p class="text-start">
          <strong>{{ `Model name:` }}</strong> {{ previewTestModelFileName }}
        </p>
        <p class="text-start">
          <strong>{{ `Physio profile selected:` }}</strong> {{ previewTestPatientPhysioName }}
        </p>
        <p class="text-start">
          <strong>{{ `Test ID:` }}</strong> {{ testId }}
        </p>
      </div>

      <v-divider class="my-4"></v-divider>

      <!-- Detailed Question Table -->
      <div class="mb-4">
        <h3 class="text-start mb-3">Critical Thinking Question Details</h3>
        <v-data-table
          :headers="questionHeaders"
          :items="detailedQuestionMetadata"
          :items-per-page="10"
          class="elevation-1"
          dense
        >
          <template v-slot:item.questionText="{ item }">
            <span class="text-truncate" style="max-width: 300px; display: inline-block;">{{ item.questionText }}</span>
          </template>
          <template v-slot:item.category="{ item }">
            <span v-if="item.category">{{ item.category }}</span>
            <span v-else class="grey--text">-</span>
          </template>
          <template v-slot:item.bodyPart="{ item }">
            <span v-if="item.bodyPart">{{ item.bodyPart }}</span>
            <span v-else class="grey--text">-</span>
          </template>
          <template v-slot:item.statusFlags="{ item }">
            <v-chip x-small color="warning" class="mr-1" v-if="item.isBeta">Beta</v-chip>
            <v-chip x-small color="primary" class="mr-1" v-if="item.isPreparedExamOnly">Prep Only</v-chip>
            <v-chip x-small color="info" class="mr-1" v-if="item.isGlobal">Global</v-chip>
            <v-chip x-small color="error" class="mr-1" v-if="item.isHidden">Hidden</v-chip>
          </template>
        </v-data-table>
      </div>
    </div>
    <div v-else>
      <p>{{ `No test result found.` }}</p>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { DEFAULT_PATIENT_MODEL_ID, CARDIAC_LEVEL_OPTIONS } from '../constants'
import { mapState, mapActions } from 'vuex'
export default {
  name: 'AdminTestResult',
  props: {
    testResults: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      defaultPatientModelId: DEFAULT_PATIENT_MODEL_ID,
      CUTOFF_SCORE: 70,
      bodyParts: [],
      questionHeaders: [
        { text: 'ID', value: 'questionId', align: 'start', sortable: true },
        { text: 'Type', value: 'type', align: 'start', sortable: true },
        { text: 'Question Text', value: 'questionText', align: 'start', sortable: false },
        { text: 'Category', value: 'category', align: 'start', sortable: true },
        { text: 'Body Part', value: 'bodyPart', align: 'start', sortable: true },
        { text: 'Status', value: 'statusFlags', align: 'start', sortable: false },
      ],
    }
  },
  computed: {
    ...mapState('questionService', ['listModels']),
    testId() {
      return _.get(this.testResults, ['questionSetResult', 'questionSetId'], '')
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
          attemptedAnswerIdentifier,
          answerViews,
          stackQuestionResultId,
        } = stackQuestionResult
        const result = Number(score)
        if (result > this.CUTOFF_SCORE) questionCounts.numberOfCorrectQuestions++
        const qText = _.get(stackQuestionResult, ['stackQuestion', 'questionText'], '')

        return {
          questionType: 'MRI',
          questionDescription: qText,
          questionText: qText,
          stackQuestion: stackQuestionResult.stackQuestion,
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
    previewTestModelFileName() {
      let modelId = this.defaultPatientModelId
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.testPatientModelId)
          if (answer) {
            modelId = answer.testPatientModelId
          }
        }
      )

      const fileName = _.get(
        _.find(this.listModels, (e) => e.id == modelId),
        ['fileName'],
        ''
      )
      return fileName.replace('.glb', '')
    },
    previewTestPatientPhysioName() {
      let profile = null
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.patientPhysioInfo)
          if (answer) {
            profile = answer.patientPhysioInfo
          }
        }
      )

      const cardiacLevelName = CARDIAC_LEVEL_OPTIONS.find(
        (e) => e.value == _.get(profile, ['cardiacLevel', 'levelType'], '')
      )?.text
      if (cardiacLevelName) {
        return `${_.get(profile, ['name'], '')} (${cardiacLevelName})`
      }
      return _.get(profile, ['name'], '')
    },
    detailedQuestionMetadata() {
      const { criticalThinkingResults, betaCriticalThinkingResults } = this.testResults || {}
      const details = []

      // Combine regular and beta critical thinking questions
      const allCriticalThinkingResults = [
        ...(criticalThinkingResults || []),
        ...(betaCriticalThinkingResults || []),
      ]

      // Process all critical thinking questions
      allCriticalThinkingResults.forEach((result, index) => {
        const question = result.multipleChoiceQuestion
        const typeMap = {
          MC: 'Multiple Choice',
          SF: 'Screening Form',
          TR: 'Time Range',
          PS: 'Point Select',
        }

        details.push({
          questionId: result.questionId || result.multipleChoiceQuestionId || (question ? question.id : null),
          type: typeMap[result.type] || result.type,
          questionText: result.text || '',
          category: _.get(result, ['category', 'name'], null),
          bodyPart: this.getBodyPartName(
            _.get(result, ['bodyPart', 'id'], null) || _.get(question, ['bodyPartId'], null)
          ),
          isBeta: question ? question.isBetaQuestion : false,
          isPreparedExamOnly: question ? question.onlyForPreparedExams : false,
          isGlobal: question ? question.globalQuestion : false,
          isHidden: question ? question.hideQuestion : false,
        })
      })

      return details
    },
  },
  async mounted() {
    try {
      this.bodyParts = await this.getBodyParts()
    } catch (error) {
      console.error('Failed to load body parts:', error)
    }
  },
  methods: {
    ...mapActions('bodyService', ['getBodyParts']),
    getBodyPartName(bodyPartId) {
      if (!bodyPartId) return null
      const bodyPart = this.bodyParts.find((bp) => bp.id === bodyPartId)
      return bodyPart ? bodyPart.name : null
    },
  },
}
</script>
