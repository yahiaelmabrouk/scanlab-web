<template>
  <v-dialog v-if="currentQuestion" v-model="isViewingCriticalThinkingQuestion" persistent width="80%">
    <v-card outlined>
      <v-card-title>
        <span class="headline">{{ $t('global.critical_thinking_question') }}</span>
      </v-card-title>
      <v-container fluid v-if="currentQuestion">
        <div v-if="currentQuestion.type === 'TR'">
          <TimingQuestionForm
            v-model="selectedAnswer"
            :question="currentQuestion"
            :key="currentQuestion.id"
          ></TimingQuestionForm>
        </div>
        <div v-if="currentQuestion.type === 'PS'">
          <PointSelectForm
            v-model="selectedAnswer"
            :question="currentQuestion"
            :key="currentQuestion.id"
          ></PointSelectForm>
        </div>
        <div v-else>
          <MultipleChoiceForm
            v-model="selectedAnswer"
            :question="currentQuestion"
            :key="currentQuestion.id"
          ></MultipleChoiceForm>
        </div>
      </v-container>

      <v-card-actions>
        <v-btn block color="success" :disabled="!selectedAnswer" @click="submitAnswer">{{
          $t('global.proceed')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import TimingQuestionForm from './CriticalThinking/Form/TimingQuestionForm'
import PointSelectForm from './CriticalThinking/Form/PointSelectForm'
import MultipleChoiceForm from './CriticalThinking/Form/MultipleChoiceForm'
import _ from 'lodash'

export default {
  name: 'CriticalThinkingPrompt',
  components: { TimingQuestionForm, MultipleChoiceForm, PointSelectForm },
  data() {
    return {
      selectedAnswer: null,
    }
  },
  computed: {
    ...mapState('questionService', [
      'criticalThinkingQuestions',
      'criticalThinkingAnswers',
      'isViewingCriticalThinkingQuestion',
      'criticalThinkingQuestionIndex',
    ]),
    currentQuestion() {
      if (!this.isViewingCriticalThinkingQuestion) {
        return null
      } else if (this.criticalThinkingQuestions.preQuestion) {
        return this.criticalThinkingQuestions.preQuestion
      } else if (this.criticalThinkingQuestions.postQuestions) {
        return this.criticalThinkingQuestions.postQuestions[this.criticalThinkingQuestionIndex]
      } else {
        return null
      }
    },

    choices() {
      // Matthew wanted choices shuffled to keep people on their toes
      // Unless the category is "Anatomy" or "Patient Screening"
      if (this.currentQuestion.categoryId === 6 || this.currentQuestion.categoryId === 3) {
        return this.currentQuestion.choices
      } else {
        return _.shuffle(this.currentQuestion.choices)
      }
    },
  },
  methods: {
    ...mapActions('questionService', ['saveCriticalThinkingAnswer']),

    async submitAnswer() {
      this.saveCriticalThinkingAnswer({
        question: this.currentQuestion,
        selectedAnswer: this.selectedAnswer,
      })

      this.selectedAnswer = null
    },
  },
}
</script>

<style scoped lang="scss">
.v-btn-toggle {
  flex-direction: column;
}

.v-btn__content {
  white-space: normal;
}
</style>
