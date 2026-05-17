<template>
  <div>
    <div v-if="!wasAnswered">
      {{ $t('global.not_answered', languageCode) }}
    </div>
    <div v-else>
      <table v-if="showTable" class="table table-sm">
        <thead>
          <tr>
            <th scope="col" class="table-header-title">
              {{ $t('global.picked_answer', languageCode) }}
            </th>
            <th scope="col" class="table-header-title">
              {{ $t('global.correct_answer', languageCode) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td v-if="hasMCAnswer">
              <div v-for="answer in pickedAnswers" :key="answer.id">
                <TranslatedContent
                  type="multipleChoiceQuestion"
                  :record="objectWithIdOfQuestion"
                  :lookup="{
                    type: 'objectInArray',
                    arrayPath: 'choices',
                    identityKey: 'id',
                    identityValue: answer.id,
                    objectKey: 'text',
                  }"
                />
              </div>
            </td>
            <td v-else>
              <div v-for="answer in pickedAnswers" :key="answer">
                {{ answer }}
              </div>
            </td>
            <td v-if="hasMCAnswer">
              <div v-for="answer in correctAnswers" :key="answer.id">
                <TranslatedContent
                  type="multipleChoiceQuestion"
                  :record="objectWithIdOfQuestion"
                  :lookup="{
                    type: 'objectInArray',
                    arrayPath: 'choices',
                    identityKey: 'id',
                    identityValue: answer.id,
                    objectKey: 'text',
                  }"
                />
              </div>
            </td>
            <td v-else>
              <div v-for="answer in correctAnswers" :key="answer">
                {{ answer }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <strong v-if="pointSelectionData && pointSelectionData.noSelections">
        {{ $t('global.picked_answer', languageCode) }}:
        {{ $t('CriticalThinkingPrompt.no_pathology', languageCode) }}
      </strong>
      <div class="pb-1">{{ $t('global.explanation', languageCode) }}:</div>
      <strong>
        <TranslatedContent
          :record="objectWithIdOfQuestion"
          type="multipleChoiceQuestion"
          :lookup="{ type: 'nestedKey', path: 'answerExplanation' }"
        />
      </strong>
      <div class="mt-2 screening-form-container" v-if="isScreeningForm">
        <ScreeningForm :editor="false" :critical-thinking-question="criticalThinkingResult" />
      </div>
      <div class="mt-2" v-else-if="showMedia">
        <BaseMedia
          :full-video-control="true"
          :media="criticalThinkingResult.media"
          :start-time="criticalThinkingResult.type === 'TR' ? Number(criticalThinkingResult.selectedAnswer) : 0"
          :is-show-point-selection-answer-area="false"
          :is-preview-critical-thinking-question="true"
          :is-show-critical-question-result="true"
        />
      </div>
      <div v-if="pointSelectionData && shouldShowNoPathologyButton" class="d-flex justify-content-start">
        <v-btn class="mt-7 wide-button no-transform" disabled>
          {{ $t('CriticalThinkingPrompt.no_pathology', languageCode) }}
          <v-checkbox disabled v-model="currentNopathologyValue" class="ml-2"></v-checkbox>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import BaseMedia from './Media/BaseMedia'
import _ from 'lodash'

import ScreeningForm from '../ScreeningForm.vue'
import TranslatedContent from '@/components/TranslatedContent'

export default {
  name: 'CriticalThinkingQuestionResultDetail',
  components: {
    BaseMedia,
    ScreeningForm,
    TranslatedContent,
  },
  props: {
    criticalThinkingResult: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      pointSelectionData: null,
    }
  },
  mounted() {
    this.onInitQuestionDetail()
  },
  beforeDestroy() {
    if (this.isPointSelect) {
      this.unload()
      this.hidePointSelect()
    }
  },
  watch: {
    criticalThinkingResult() {
      this.onInitQuestionDetail()
    },
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    shouldShowNoPathologyButton() {
      if (_.toLower(_.get(this.criticalThinkingResult, ['category', 'name'])) == 'pathology') {
        return true
      } else {
        return false
      }
    },
    currentNopathologyValue: {
      get() {
        if (this.pointSelectionData && this.pointSelectionData.noSelections) {
          return true
        } else {
          return false
        }
      },
      set() {},
    },
    showMedia() {
      return !!this.criticalThinkingResult.media
    },
    showTable() {
      return _.size(this.pickedAnswers) > 0 || _.size(this.correctAnswers) > 0
    },
    // Did the user even answer this question? Maybe abandoned, and then we probably don't want to show much here
    wasAnswered() {
      return this.criticalThinkingResult.selectedAnswer
    },
    correctAnswers() {
      if (this.criticalThinkingResult.type === 'MC' || this.criticalThinkingResult.type === 'SF') {
        return _.filter(this.criticalThinkingResult.choices, 'isCorrect')
      } else if (this.criticalThinkingResult.type === 'TR') {
        let [from, to] = this.criticalThinkingResult.range
        return [`Between ${from} and ${to}`]
      } else {
        return []
      }
    },
    pickedAnswers() {
      if (this.criticalThinkingResult.type === 'MC' || this.criticalThinkingResult.type === 'SF') {
        let pickedAnswerIds = _.split(this.criticalThinkingResult.selectedAnswer, ',')

        // Sort the user answers in the same order as the correct answers, with any wrong answers sorted last
        pickedAnswerIds = _.sortBy(pickedAnswerIds, (pickedAnswerId) => {
          let choiceIndex = _.findIndex(this.criticalThinkingResult.choices, { id: pickedAnswerId })
          if (choiceIndex >= 0) {
            let choice = this.criticalThinkingResult.choices[choiceIndex]
            return choice.isCorrect ? choiceIndex : Infinity
          } else {
            return Infinity
          }
        })

        return _.map(pickedAnswerIds, (answerId) => {
          return _.find(this.criticalThinkingResult.choices, { id: answerId })
        })
      } else if (this.criticalThinkingResult.type === 'TR') {
        const selectedAnswer = this.criticalThinkingResult.selectedAnswer
        const numericAnswer = Number(selectedAnswer)
        const roundedAnswer = !isNaN(numericAnswer) ? numericAnswer.toFixed(2) : selectedAnswer
        return [roundedAnswer]
      }

      return []
    },
    hasMCAnswer() {
      return this.criticalThinkingResult.type === 'MC' || this.criticalThinkingResult.type === 'SF'
    },
    isScreeningForm() {
      return this.criticalThinkingResult.type === 'SF'
    },
    isPointSelect() {
      return this.criticalThinkingResult.type === 'PS'
    },
    objectWithIdOfQuestion() {
      return {
        ...this.criticalThinkingResult,
        id: this.criticalThinkingResult.id || this.criticalThinkingResult.questionId,
      }
    },
  },
  methods: {
    ...mapMutations('pointSelectService', [
      'load',
      'disableSelection',
      'showPointSelect',
      'hidePointSelect',
      'unload',
      'addPreviewChosenSelection',
      'resetPreviewChosenSelection',
    ]),
    onInitQuestionDetail() {
      if (this.isPointSelect) {
        this.pointSelectionData = this.criticalThinkingResult.selectedAnswer
        if (typeof this.pointSelectionData === 'string') {
          this.pointSelectionData = JSON.parse(this.pointSelectionData)
        }
        this.load({
          selections: _.get(this.criticalThinkingResult, ['range', 'selections'], {}),
        })
        if (this.pointSelectionData) {
          const position = _.get(this.pointSelectionData, ['selectedPointInfo', 'position'])
          const indexSlice = _.get(this.pointSelectionData, ['selectedPointInfo', 'indexSlice'])
          const selectionId = _.get(this.pointSelectionData, ['selection', 'id'])
          if (!_.isNil(position) && !_.isNil(indexSlice)) {
            this.addPreviewChosenSelection({
              position: position,
              selectionId: selectionId,
              userPointSelectAnswerDotSize: _.get(this.pointSelectionData, ['userPointSelectAnswerDotSize'], 1),
              id: indexSlice,
            })
          } else {
            this.resetPreviewChosenSelection()
          }
          this.disableSelection()
          this.showPointSelect()
        }
      }
    },
  },
}
</script>

<style scoped lang="scss">
.table-header-title {
  text-align: center !important;
}
.screening-form-container {
  height: 50vh;
  overflow-y: scroll;
}
</style>
