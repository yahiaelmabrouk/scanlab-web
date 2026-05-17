<template>
  <v-stepper v-model="step" vertical class="flex-auto question-menu-vertical-stepper" :key="questionsVerticalMenuKey">
    <v-stepper-step
      v-for="(stackQuestion, idx) of stackQuestions"
      :key="`${idx + 1}-${languageCode}`"
      :step="idx + 1"
      @click="jumpToStackQuestion(idx + 1)"
      :class="`${disableJumb ? 'disable-jump' : 'cursor-pointer'} ${getQuestionColorClass(
        stackQuestion
      )} p-3 question-menu-vertical-step`"
      :complete="scanSubmittedByStackQuestionId[stackQuestion.id]"
    >
      <div
        class="question-item-wrapper"
        :class="{ 'grid-two-col': !isEditingQuestion && isAnyStackQuestionIconVisible }"
      >
        <div class="d-flex justify-content-between question-item p-1">
          <v-tooltip top content-class="question-menu-vertical-tooltip">
            <template #activator="{ on, attrs }">
              <p v-bind="attrs" v-on="on" class="text-only-one-row">
                <TranslatedContent
                  type="stackQuestion"
                  :record="stackQuestion"
                  :lookup="{ type: 'nestedKey', path: 'questionText' }"
                />
              </p>
            </template>
            <TranslatedContent
              type="stackQuestion"
              :record="stackQuestion"
              :lookup="{ type: 'nestedKey', path: 'questionText' }"
            />
          </v-tooltip>
          <v-tooltip
            top
            content-class="question-menu-vertical-tooltip"
            v-if="
              step != idx + 1 &&
              !isQuestionIsLocalizer(stackQuestion) &&
              !isQuestionIsChangePatientPosition(stackQuestion) &&
              !isQuestionIsTimingDecision(stackQuestion) &&
              !isEditingQuestion
            "
          >
            <template #activator="{ on, attrs }">
              <v-icon
                color="primary"
                v-bind="attrs"
                v-on="on"
                @click="onShowModalCopyQuestion($event, idx)"
                size="20"
                class="copy-answer-icon"
                >mdi-content-copy</v-icon
              >
            </template>
            <p>{{ $t('global.copy', languageCode) }}</p>
          </v-tooltip>
        </div>
        <div v-if="!isEditingQuestion && isAnyStackQuestionIconVisible" class="p-1 question-item-icons">
          <div class="icon-wrapper" v-if="stackQuestionIcons[idx].breathing.visible">
            <v-icon color="black" size="20">mdi-account-tie-voice</v-icon>
          </div>
          <div class="icon-wrapper icon-link" v-if="stackQuestionIcons[idx].copyFrom.visible">
            <v-icon color="black" size="20">mdi-link-variant</v-icon>
            <span>{{ stackQuestionIcons[idx].copyFrom.value }}</span>
          </div>
          <div class="icon-wrapper icon-timer" v-if="stackQuestionIcons[idx].scanDelay.visible">
            <v-icon color="black" size="20">mdi-clock-outline</v-icon>
            <span>{{ stackQuestionIcons[idx].scanDelay.value }}</span>
          </div>
        </div>
      </div>
      <!-- </div> -->
    </v-stepper-step>
    <b-modal
      id="modal-copy-answer"
      centered
      hide-header
      ok-variant="success"
      cancel-variant="danger"
      @ok="onConfirmCopyAnswer"
    >
      <div class="p-2">
        <div class="mb-3">{{ $t('global.what_do_you_want_to_copy') }}</div>
        <b-card>
          <v-radio-group v-model="copyQuestionType" class="copy-answer-radio-group">
            <v-radio
              v-for="item in copyQuestionTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></v-radio>
          </v-radio-group>
        </b-card>
      </div>
    </b-modal>
  </v-stepper>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import _ from 'lodash'
import { COPY_QUESTION_TYPES, SCAN_STATUS, BREATHING_INSTRUCTION } from '../constants'
import TranslatedContent from '@/components/TranslatedContent'
export default {
  name: 'QuestionMenuVertical',
  components: {
    TranslatedContent,
  },
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
    ...mapGetters('user', ['languageCode']),
    ...mapState('timingDecisionService', ['isCountDownTimingDecisionQuestion']),
    isAnyStackQuestionIconVisible() {
      return _.some(
        this.stackQuestionIcons,
        (el) => el.breathing.visible || el.copyFrom.visible || el.scanDelay.visible
      )
    },
    stackQuestionIcons() {
      return this.stackQuestions.map((el) => {
        return {
          key: this.questionsVerticalMenuKey,
          breathing: {
            visible:
              (_.get(el, ['questionType']) == 1 || _.get(el, ['questionType']) == 3) &&
              _.get(el, ['breathingInstruction'], this.BREATHING_INSTRUCTION.OFF) != this.BREATHING_INSTRUCTION.OFF,
          },
          copyFrom: {
            visible: _.has(el, ['copyFromQuestionIndex']),
            value: _.get(el, ['copyFromQuestionIndex'], 0) + 1,
          },
          scanDelay: {
            visible: _.has(el, ['scanDelay']) && _.get(el, ['scanDelay'], 0) > 0,
            value: _.get(el, ['scanDelay']),
          },
        }
      })
    },
    disableJumb: {
      get() {
        if (this.isEditingQuestion) {
          return false
        } else {
          if (this.isLocalizerQuestion && !this.isAnsweredCurrentQuestion) {
            return true
          } else if (
            this.isPlayingTheSlices ||
            this.isMovingMRIMachine ||
            this.isSubmittingAnswer ||
            // Disable jumb when user press confirm
            this.scanStatus == this.SCAN_STATUS.SCANNING
          ) {
            return true
          }
          // Timing decision question, press start to count down
          else if (this.isCountDownTimingDecisionQuestion) {
            return true
          } else {
            return false
          }
        }
      },
    },
    copyQuestionTypes: {
      get() {
        const selectedQuestionIndex = this.step - 1

        const thisQuestion = _.get(this.stackQuestions, selectedQuestionIndex, null)
        const copyQuestion = _.get(this.stackQuestions, this.selectedQuestionIndexToCopy, null)

        // Acq to Acq
        if (_.get(thisQuestion, ['questionType']) == 1 && _.get(copyQuestion, ['questionType']) == 1) {
          return [
            {
              label: 'Everything',
              value: this.COPY_QUESTION_TYPES.EVERY_THINGS,
            },
            {
              label: 'Slice Position and Coverage',
              value: this.COPY_QUESTION_TYPES.SLICE_POSITION_AND_COVERAGE,
            },
            {
              label: 'Parameters',
              value: this.COPY_QUESTION_TYPES.PARAMETERS,
            },
          ]
        }
        // Recon to recon
        else if (_.get(thisQuestion, ['questionType']) == 2 && _.get(copyQuestion, ['questionType']) == 2) {
          return [
            {
              label: 'Everything',
              value: this.COPY_QUESTION_TYPES.EVERY_THINGS,
            },
            {
              label: 'Slice Position and Coverage',
              value: this.COPY_QUESTION_TYPES.SLICE_POSITION_AND_COVERAGE,
            },
            {
              label: 'Parameters',
              value: this.COPY_QUESTION_TYPES.PARAMETERS,
            },
            {
              label: 'Field Of View',
              value: this.COPY_QUESTION_TYPES.FOV,
            },
          ]
        }
        // Acq to Recon
        else if (_.get(copyQuestion, ['questionType']) == 1 && _.get(thisQuestion, ['questionType']) == 2) {
          return [
            {
              label: 'Slice Thickness, Window, and Kernel',
              value: this.COPY_QUESTION_TYPES.SLICE_THICKNESS_AND_WINDOW_AND_KERNEL,
            },
            {
              label: 'Slice Thickness',
              value: this.COPY_QUESTION_TYPES.SLICE_THICKNESS,
            },
            {
              label: 'Window and Kernel',
              value: this.COPY_QUESTION_TYPES.WINDOW_AND_KERNEL,
            },
            {
              label: 'Field Of View',
              value: this.COPY_QUESTION_TYPES.FOV,
            },
          ]
        }
        // Recon to Acq
        else if (_.get(copyQuestion, ['questionType']) == 2 && _.get(thisQuestion, ['questionType']) == 1) {
          return [
            {
              label: 'Slice Thickness, Window, and Kernel',
              value: this.COPY_QUESTION_TYPES.SLICE_THICKNESS_AND_WINDOW_AND_KERNEL,
            },
            {
              label: 'Slice Thickness',
              value: this.COPY_QUESTION_TYPES.SLICE_THICKNESS,
            },
            {
              label: 'Window and Kernel',
              value: this.COPY_QUESTION_TYPES.WINDOW_AND_KERNEL,
            },
            {
              label: 'Parameters',
              value: this.COPY_QUESTION_TYPES.PARAMETERS,
            },
          ]
        }

        return []
      },
      set() {},
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
    onShowModalCopyQuestion(e, questionIndex) {
      e.stopPropagation()

      this.selectedQuestionIndexToCopy = questionIndex
      this.copyQuestionType = _.get(this.copyQuestionTypes, [0, 'value'], null)

      this.$root.$emit('bv::show::modal', 'modal-copy-answer')
    },
    onConfirmCopyAnswer() {
      this.$root.$emit('bv::hide::modal', 'modal-copy-answer')

      this.onCopySelection()
    },
    onCopySelection() {
      const questionIndex = this.selectedQuestionIndexToCopy
      const stackQuestion = _.get(this.stackQuestions, this.selectedQuestionIndexToCopy, null)
      if (stackQuestion) {
        const answers = _.get(stackQuestion, ['answers'])
        let answer = _.find(answers, { id: _.get(stackQuestion, ['answerSelectionId']) })
        if (!answer) {
          answer = _.get(answers, [0])
        }
        let answerConfig = null
        if (answer) {
          const keys = Object.keys(answer)
          keys.forEach((key) => {
            if (key.endsWith('proposed')) {
              answerConfig = answer[key]
            }
          })
        }
        if (answerConfig) {
          this.$store.dispatch('questionService/copySelectionConfigFromQuestionIndexAnswer', {
            questionIndex,
            stackConfig: {
              answerData: answerConfig,
            },
            copyQuestionType: this.copyQuestionType,
          })
        }
      }
    },
    isAnsweredQuestion(stackQuestion) {
      return (
        !stackQuestion || (this.userAnswers && this.userAnswers.find((el) => el.stackQuestionId === stackQuestion.id))
      )
    },
    isQuestionIsLocalizer(stackQuestion) {
      return _.get(stackQuestion, ['questionType']) == 3
    },
    isQuestionIsChangePatientPosition(stackQuestion) {
      return _.get(stackQuestion, ['questionType']) == 4
    },
    isQuestionIsTimingDecision(stackQuestion) {
      return _.get(stackQuestion, ['questionType']) == 5
    },
    saveCurrentAnswer() {
      this.$store.dispatch('questionService/saveCurrentAnswer')
    },
    getQuestionColorClass(stackQuestion) {
      if (_.get(stackQuestion, ['questionType'], 0) == 1) {
        return 'step-green'
      } else if (_.get(stackQuestion, ['questionType'], 0) == 2) {
        return 'step-orange'
      } else if (_.get(stackQuestion, ['questionType'], 0) == 5) {
        return 'step-yellow'
      } else if (_.get(stackQuestion, ['questionType']) == 3 || _.get(stackQuestion, ['questionType']) == 4) {
        return this.isEditingQuestion ? '' : 'disable-jump'
      }

      return ''
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
.question-menu-vertical-tooltip {
  max-width: 300px;
}
.question-item-icons {
  display: flex;
  gap: 2px;
  flex-wrap: nowrap;
  .icon-wrapper {
    position: relative;
    &.icon-link {
      span {
        position: absolute;
        font-size: 8px;
        bottom: 0;
        right: 0;
        color: #000000;
        background: #ffffff;
      }
    }
    &.icon-timer {
      span {
        position: absolute;
        font-size: 8px;
        bottom: 0;
        right: 0;
        color: #000000;
        background: #ffffff;
      }
    }
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
.copy-answer-radio-group {
  .v-radio {
    .v-label {
      margin-bottom: 0;
      margin-left: 12px;
    }
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

.text-only-one-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.question-menu-vertical-stepper {
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
  }
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
