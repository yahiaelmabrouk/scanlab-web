<template>
  <v-dialog v-model="showDialog" width="80%">
    <v-card outlined>
      <v-card-title>
        <span class="headline">{{ $t('global.critical_thinking_question') }}</span>
      </v-card-title>
      <v-container fluid v-if="question">
        <div v-if="question.type === 'TR'">
          <TimingQuestionForm v-model="selectedAnswer" :question="question" :key="question.id"></TimingQuestionForm>
        </div>
        <div v-if="question.type === 'MC'">
          <MultipleChoiceForm v-model="selectedAnswer" :question="question" :key="question.id"></MultipleChoiceForm>
        </div>
        <div v-if="question.type === 'PS'">
          <PointSelectForm
            v-model="selectedAnswer"
            :question="question"
            :key="question.id"
            :is-preview-critical-thinking-question="true"
          ></PointSelectForm>
        </div>
        <div v-if="question.type === 'SF'">
          <ScreeningForm :critical-thinking-question="question" :editor="false" :is-preview="true" />
        </div>
      </v-container>

      <v-card-actions>
        <v-btn block color="success" :disabled="!selectedAnswer" @click="submitAnswer">
          {{ $t('global.proceed') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import TimingQuestionForm from './Form/TimingQuestionForm'
import MultipleChoiceForm from './Form/MultipleChoiceForm'
import PointSelectForm from './Form/PointSelectForm'
import ScreeningForm from '../ScreeningForm.vue'

export default {
  name: 'CriticalThinkingPreview',
  components: { TimingQuestionForm, MultipleChoiceForm, PointSelectForm, ScreeningForm },
  data() {
    return {
      selectedAnswer: null,
      showDialog: this.$props.value,
    }
  },
  watch: {
    showDialog(newValue) {
      this.$emit('input', newValue)
    },
    value(newValue) {
      this.showDialog = newValue
    },
  },
  props: {
    question: {
      type: Object,
      required: true,
    },
    value: {
      type: Boolean,
      required: true,
    },
  },
  methods: {
    async submitAnswer() {
      this.$emit('input', false)
      this.showDialog = this.value
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
