<template>
  <div class="d-flex justify-content-start mt-3 mb-2 w-100">
    <v-btn color="primary" class="align-self-center" @click="showModalCopyConfig">{{
      $t('global.copy_config_from')
    }}</v-btn>

    <b-modal id="modal-copy-positions" :title="$t('global.copy_config_from')" size="lg" centered @ok="onCopyConfig()">
      <template #modal-ok>
        {{ $t('global.okay') }}
      </template>

      <template #modal-cancel>
        {{ $t('global.cancel') }}
      </template>

      <div>
        <div>
          <v-autocomplete
            v-model="selectedQuestionSetId"
            :items="questionSetOptions"
            item-text="text"
            item-value="value"
            :label="$t('global.question_set')"
            menu-props="auto"
          />
        </div>
        <div>
          <v-radio-group class="mt-1 stack-questions-radio-group-container" v-model="selectedCopyType" row>
            <v-radio
              v-for="item in ADMIN_COPY_TYPE_OPTIONS"
              :key="item.value"
              :label="item.text"
              :value="item.value"
            ></v-radio>
          </v-radio-group>
        </div>
        <div>
          <v-radio-group
            :label="$t('global.stack_questions')"
            class="mt-1 stack-questions-radio-group-container"
            v-model="selectedStackQuestionId"
          >
            <v-radio
              v-for="item in stackQuestionOptions"
              :key="item.value"
              :label="item.text"
              :value="item.value"
              :disabled="item.disabled"
            ></v-radio>
          </v-radio-group>
        </div>
        <div v-if="selectedCopyType === ADMIN_COPY_TYPE.ANSWER">
          <v-radio-group
            :label="$t('global.stack_question_answer')"
            class="mt-1 stack-questions-radio-group-container"
            v-model="selectedAnswerId"
          >
            <v-radio
              v-for="item in stackQuestionAnswerOptions"
              :key="item.value"
              :label="item.text"
              :value="item.value"
              :disabled="item.disabled"
            ></v-radio>
          </v-radio-group>
        </div>
        <div>
          <v-radio-group
            :label="$t('global.what_do_you_want_to_copy')"
            v-model="copyQuestionType"
            class="mt-1 stack-questions-radio-group-container"
          >
            <v-radio
              v-for="item in adminCopyQuestionTypeOptions"
              :key="item.value"
              :label="item.text"
              :value="item.value"
            ></v-radio>
          </v-radio-group>
        </div>
      </div>
    </b-modal>
  </div>
</template>
<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import { mapActions, mapGetters } from 'vuex/dist/vuex.common.js'
import {
  ADMIN_COPY_QUESTION_TYPE_OPTIONS,
  ADMIN_COPY_QUESTION_ANSWER_TYPE_OPTIONS,
  ADMIN_COPY_QUESTION_TYPES,
  ADMIN_COPY_TYPE,
  ADMIN_COPY_TYPE_OPTIONS,
} from '../constants'

export default {
  name: 'AdminCopySelectionConfig',
  data() {
    return {
      selectedCopyType: ADMIN_COPY_TYPE.QUESTION,
      selectedQuestionSetId: null,
      selectedStackQuestionId: null,
      selectedAnswerId: null,
      ADMIN_COPY_QUESTION_TYPE_OPTIONS,
      ADMIN_COPY_QUESTION_ANSWER_TYPE_OPTIONS,
      ADMIN_COPY_TYPE_OPTIONS,
      ADMIN_COPY_TYPE,
      copyQuestionType: ADMIN_COPY_QUESTION_TYPES.EVERY_THINGS,
    }
  },
  computed: {
    ...mapState('globalOptions', ['questionSets']),
    ...mapState('questionService', ['questionSet', 'selectedStackQuestionIndex', 'answerSelectionId']),
    ...mapGetters('questionService', ['stackQuestion', 'stackQuestions']),
    adminCopyQuestionTypeOptions() {
      if (this.selectedCopyType === ADMIN_COPY_TYPE.QUESTION) {
        return this.ADMIN_COPY_QUESTION_TYPE_OPTIONS
      } else {
        return this.ADMIN_COPY_QUESTION_ANSWER_TYPE_OPTIONS
      }
    },
    questionSetOptions() {
      if (this.questionSetId) {
        return this.questionSets.map((el) => ({
          text: el.id == this.questionSetId ? 'Current question set' : this.questionSetDisplayName(el),
          value: el.id,
        }))
      } else {
        return [
          {
            value: null,
            text: 'Current question set',
          },
          ...this.questionSets.map((el) => ({
            text: this.questionSetDisplayName(el),
            value: el.id,
          })),
        ]
      }
    },
    selectedQuestionSet() {
      if (this.selectedQuestionSetId == this.questionSetId) {
        return this.questionSet
      } else {
        return _.find(this.questionSets, (el) => el.id == this.selectedQuestionSetId)
      }
    },
    stackQuestionOptions() {
      let stackQuestions = _.get(this.selectedQuestionSet, ['stackQuestions'], [])
      stackQuestions = _.orderBy(stackQuestions, ['order'])
      const options = stackQuestions.map((el, index) => ({
        text: el.questionText,
        value: el.id != null ? el.id : index,
        disabled:
          this.selectedCopyType == ADMIN_COPY_TYPE.QUESTION
            ? this.stackQuestion?.id
              ? this.stackQuestion?.id == el.id
              : this.selectedStackQuestionIndex == index
            : false,
      }))
      return options
    },
    selectedStackQuestion() {
      if (!this.selectedStackQuestionId) {
        return null
      }
      let stackQuestions = _.get(this.selectedQuestionSet, ['stackQuestions'], [])
      let stackQuestion = stackQuestions.find((el) => el.id == this.selectedStackQuestionId)
      if (!stackQuestion) {
        stackQuestion = this.stackQuestions.find((el, index) => index == this.selectedStackQuestionId)
      }
      return stackQuestion
    },
    stackQuestionAnswerOptions() {
      return (this.selectedStackQuestion?.answers || []).map((el, index) => ({
        text: el.name || 'Answer ' + (index + 1),
        value: el.id,
        disabled: false,
      }))
    },
    selectedAnswer() {
      if (!this.selectedAnswerId || this.selectedCopyType === ADMIN_COPY_TYPE.QUESTION) {
        return this.selectedStackQuestion?.answers[0] || null
      }
      return (this.selectedStackQuestion?.answers || []).find((el) => el.id == this.selectedAnswerId)
    },
    questionSetId() {
      return _.get(this.questionSet, ['id'])
    },
  },
  watch: {
    questionSetId() {
      this.selectedQuestionSetId = this.questionSetId
    },
    stackQuestionOptions() {
      this.onAssignDefaultSelectedStackQuestion()
    },
    stackQuestionAnswerOptions() {
      this.onAssignDefaultSelectedStackQuestionAnswer()
    },
    selectedCopyType() {
      this.copyQuestionType = this.adminCopyQuestionTypeOptions[0].value
      this.onAssignDefaultSelectedStackQuestionAnswer()
    },
  },
  mounted() {
    this.selectedQuestionSetId = this.questionSetId
    this.onAssignDefaultSelectedStackQuestion()
    this.onAssignDefaultSelectedStackQuestionAnswer()
  },
  methods: {
    ...mapActions('questionService', ['copySelectionConfigForAdmin']),
    onAssignDefaultSelectedStackQuestionAnswer() {
      this.selectedAnswerId = _.get(this.stackQuestionAnswerOptions, [0, 'value'], null)
    },
    onAssignDefaultSelectedStackQuestion() {
      this.selectedStackQuestionId = _.get(this.stackQuestionOptions, [0, 'value'], null)
      if (this.selectedStackQuestionId == this.stackQuestion?.id) {
        this.selectedStackQuestionId = _.get(this.stackQuestionOptions, [1, 'value'], null)
      }
    },
    questionSetDisplayName(questionSet) {
      if (questionSet.name || questionSet.stackQuestions.length > 1) {
        return `${questionSet.id} - ${questionSet.stackQuestions[1].questionText}`
      } else if (questionSet.name || questionSet.stackQuestions.length == 1) {
        return `${questionSet.id} - ${questionSet.stackQuestions[0].questionText}`
      }
      return 'No questions available'
    },
    showModalCopyConfig() {
      this.$root.$emit('bv::show::modal', 'modal-copy-positions')
    },
    onCopyConfig() {
      if (
        (this.questionSet?.id != null && this.selectedQuestionSetId == null) ||
        this.selectedStackQuestionId == null
      ) {
        return
      }

      if (!this.selectedStackQuestion || (this.selectedCopyType === ADMIN_COPY_TYPE.ANSWER && !this.selectedAnswer)) {
        return
      }

      this.copySelectionConfigForAdmin({
        selectedCopyType: this.selectedCopyType,
        targetAnswer: this.selectedAnswer,
        targetStackQuestion: this.selectedStackQuestion,
        copyQuestionType: this.copyQuestionType,
      })
    },
  },
}
</script>
<style lang="scss">
.stack-questions-radio-group-container {
  .v-radio {
    .v-label {
      margin-bottom: 0;
      margin-left: 12px;
    }
  }
}
</style>
