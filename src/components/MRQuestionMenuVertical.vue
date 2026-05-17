<template>
  <div class="mr-question-menu-vertical-container">
    <div class="menu-header">
      <div class="menu-header-title">{{ `Add localizer` }}</div>
    </div>
    <v-stepper
      v-model="step"
      vertical
      class="flex-auto mr-question-menu-vertical-stepper"
      :key="questionsVerticalMenuKey"
    >
      <v-stepper-step
        v-for="(stackQuestion, idx) of stackQuestions"
        :key="idx"
        :step="idx + 1"
        @click="jumpToStackQuestion(idx + 1)"
        :class="`${disableJumb ? 'disable-jump' : 'cursor-pointer'} ${getQuestionColorClass(
          stackQuestion
        )} p-3 question-menu-vertical-step ${step === idx + 1 ? 'step-active' : ''}`"
        :complete="scanSubmittedByStackQuestionId[stackQuestion.id]"
      >
        <div class="question-item-wrapper">
          <div class="d-flex justify-content-between question-item p-1">
            <v-tooltip top>
              <template #activator="{ on, attrs }">
                <p v-bind="attrs" v-on="on" class="text-two-rows">{{ stackQuestion.questionText }}</p>
              </template>
              <span class="question-text">{{ stackQuestion.questionText }}</span>
            </v-tooltip>
          </div>
        </div>
        <!-- </div> -->
      </v-stepper-step>
    </v-stepper>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { COPY_QUESTION_TYPES, SCAN_STATUS, BREATHING_INSTRUCTION } from '../constants'
export default {
  name: 'MRQuestionMenuVertical',
  props: {
    step: {
      type: Number,
      default: 1,
    },
  },
  computed: {
    ...mapState('questionService', [
      'isEditingQuestion',
      'isPlayingTheSlices',
      'isMovingMRIMachine',
      'isSubmittingAnswer',
      'userAnswers',
      'scanStatus',
      'questionsVerticalMenuKey',
    ]),
    ...mapGetters('questionService', [
      'isLocalizerQuestion',
      'isAnsweredCurrentQuestion',
      'scanSubmittedByStackQuestionId',
      'stackQuestions',
    ]),
    ...mapState('timingDecisionService', ['isCountDownTimingDecisionQuestion']),
    disableJumb: {
      get() {
        return false
      },
    },
  },
  data() {
    return {
      selectedQuestionIndexToCopy: 0,
      copyQuestionType: COPY_QUESTION_TYPES.EVERY_THINGS,
      COPY_QUESTION_TYPES,
      SCAN_STATUS,
      BREATHING_INSTRUCTION,
    }
  },
  mounted() {},
  methods: {
    isAnsweredQuestion(stackQuestion) {
      return (
        !stackQuestion || (this.userAnswers && this.userAnswers.find((el) => el.stackQuestionId === stackQuestion.id))
      )
    },
    getQuestionColorClass() {
      return 'step-primary'
    },
    jumpToStackQuestion(idx) {
      if (this.disableJumb) {
        return
      }
      this.$store.dispatch('questionService/jumpToQuestion', idx - 1)
    },
  },
}
</script>
<style lang="scss">
.mr-question-menu-vertical-container {
  border-radius: 1rem 1rem 0 0;
  overflow: hidden;
  border: solid 2px #c5c6c7;
  border-bottom: none;
  flex: auto;
  display: flex;
  flex-direction: column;
  .menu-header {
    background: #ecf7fa;
    padding: 1rem;
    font-size: 1.2rem;
    font-weight: bold;
    .menu-header-title {
      text-align: center;
    }
  }
}
.mr-question-menu-vertical-stepper {
  padding-bottom: 0 !important;
  height: 0px;
  overflow-y: auto;
  min-height: 200px;
  .v-stepper__label {
    flex: auto;
    overflow: hidden;
  }
  .question-menu-vertical-step {
    &.disable-jump {
      cursor: default;
      .v-stepper__label {
        color: rgba(0, 0, 0, 0.38) !important;
      }
    }
    &:not(.disable-jump) {
      .v-stepper__label {
        color: rgba(0, 0, 0, 0.87) !important;
      }
    }
    &.step-active {
      background: rgba(0, 0, 0, 0.12);
    }
    &:hover {
      background: rgba(0, 0, 0, 0.12);
    }
  }

  .question-item-wrapper {
    width: 100% !important;
    &.grid-two-col {
      display: grid;
      grid-template-columns: calc(100% - 70px) 70px;
      row-gap: 5px;
    }
  }

  .question-item {
    .copy-answer-icon {
      opacity: 0;
    }

    &:hover {
      .copy-answer-icon {
        opacity: 1;
      }
    }
  }

  .text-two-rows {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    line-height: 1.5rem;
  }
}
.theme--light.v-stepper
  .v-stepper__step.step-primary:not(.v-stepper__step--active):not(.v-stepper__step--complete):not(.v-stepper__step--error)
  .v-stepper__step__step {
  background: #247ba0;
}

.theme--light.v-stepper
  .v-stepper__step.step-green:not(.v-stepper__step--active):not(.v-stepper__step--complete):not(.v-stepper__step--error)
  .v-stepper__step__step {
  background: #0cb30c;
}

.theme--light.v-stepper
  .v-stepper__step.step-orange:not(.v-stepper__step--active):not(.v-stepper__step--complete):not(.v-stepper__step--error)
  .v-stepper__step__step {
  background: #ee8f58;
}

.theme--light.v-stepper
  .v-stepper__step.step-yellow:not(.v-stepper__step--active):not(.v-stepper__step--complete):not(.v-stepper__step--error)
  .v-stepper__step__step {
  background: #ffff00;
  color: #000000;
}

.theme--light .question-menu-vertical-stepper.v-stepper .v-stepper__step.v-stepper__step--active {
  background: rgba(0, 0, 0, 0.12);
  padding: 24px;
}
</style>
<style lang="scss" scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
