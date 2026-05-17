<template>
  <article id="critical-thinking-quiz" v-if="currentQuestion">
    <h1 v-if="showIfTimedExam">
      <span class="pr-8">
        {{ $t('global.question', languageCode) }}: {{ criticalThinkingQuestionIndex + 1 }} /
        {{ criticalThinkingQuestionsPostQuestionsCount }}
      </span>
      {{ $t('CriticalThinkingPrompt.time_remaining', languageCode) }}
      <span :class="{ 'red-color-text': redIfShortOnTime(timeRemaining) }">{{ toCountdownTimer(timeRemaining) }}</span>
    </h1>
    <v-row justify="space-around" cols="12">
      <v-col>
        <v-card class="pt-3 pb-3 scan-view-options test-question pa-5">
          <v-row align="center" justify="space-between">
            <v-card-title class="flex justify-space-between align-center">
              <h5 class="mb-0">
                {{ $t('global.critical_thinking_question', languageCode) }}
              </h5>
            </v-card-title>
          </v-row>
          <v-card-text v-if="currentQuestion.type === 'TR'">
            <TranslatedContent
              type="multipleChoiceQuestion"
              :record="currentQuestion"
              :lookup="{ type: 'nestedKey', path: 'questionText' }"
            />
            <v-row class="pt-5">
              <span class="instructions">{{ $t('CriticalThinkingPrompt.video_instructions_0', languageCode) }}</span>
            </v-row>
            <v-row>
              <span class="instructions">{{ $t('CriticalThinkingPrompt.video_instructions_1', languageCode) }}</span>
            </v-row>
            <v-row>
              <span class="instructions">{{ $t('CriticalThinkingPrompt.video_instructions_2', languageCode) }}</span>
            </v-row>
          </v-card-text>
          <v-card-text align="start" class="pt-0 pl-0" v-else>
            <TranslatedContent
              type="multipleChoiceQuestion"
              :record="currentQuestion"
              :lookup="{ type: 'nestedKey', path: 'questionText' }"
            />
            <div v-if="currentQuestion.type === 'TR'">
              <v-row class="instructions">
                <span>{{ $t('CriticalThinkingPrompt.video_instructions_0', languageCode) }}</span>
              </v-row>
              <v-row class="instructions">
                <span>{{ $t('CriticalThinkingPrompt.video_instructions_1', languageCode) }}</span>
              </v-row>
              <v-row class="instructions">
                <span>{{ $t('CriticalThinkingPrompt.video_instructions_2', languageCode) }}</span>
              </v-row>
            </div>
            <div v-if="currentQuestion.type === 'PS'">
              <v-row class="instructions">
                <span>{{ $t('CriticalThinkingPrompt.point_select_instructions_0', languageCode) }}</span>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
        <v-card align="center" v-if="showBaseMedia" class="mt-7 pt-3 pb-3 scan-view-options test-question pa-5">
          <div class="pa-1">
            <BaseMedia :full-video-control="false" :media="currentQuestion.media" />
          </div>
        </v-card>
        <v-card
          align="center"
          v-else-if="currentQuestion.type === 'SF'"
          class="mt-7 pt-3 pb-3 scan-view-options test-question pa-5"
        >
          <div class="pa-1">
            <ScreeningForm :editor="false" :critical-thinking-question="currentQuestion" />
          </div>
        </v-card>
      </v-col>
      <!-- <v-col align="end">
        <v-card class="pt-3 pb-3 scan-view-options test-question pa-5">
          <v-row
            align="center"
            justify="space-between"
            v-if="currentQuestion.type === 'MC' || currentQuestion.type === 'SF'"
          >
            <v-card-title class="flex justify-space-between align-center">
              <h5 class="mb-0">
                {{ $t('global.answers', languageCode) }}
              </h5>
            </v-card-title>
          </v-row>
          <v-row v-if="currentQuestion.type === 'TR'">
            <v-card raised class="mx-auto pa-1">
              <div>
                <VideoMedia
                  @loaded="videoLoaded = true"
                  :paused.sync="videoPaused"
                  :time.sync="videoTime"
                  :allow-full-video-control="false"
                  :video="currentQuestion.media"
                  fill-height
                >
                </VideoMedia>
              </div>
              <v-btn color="green" :disabled="this.videoTime > 0 || !videoLoaded" width="50%" @click="startVideo">
                {{ $t('CriticalThinkingPrompt.start_video', languageCode) }}
              </v-btn>
              <v-btn color="red" :disabled="this.videoPaused" width="50%" @click="stopVideo">
                {{ $t('CriticalThinkingPrompt.pause', languageCode) }}
              </v-btn>
            </v-card>
          </v-row>
          <v-row v-if="currentQuestion.type === 'PS'">
            <v-col>
              <div class="media-box pa-1">
                <BaseMedia :full-video-control="true" :media="currentQuestion.media" />
              </div>
            </v-col>
          </v-row>
          <v-row cols="12" v-else>
            <v-list flat align="start">
              <v-list-item-group :key="currentQuestion.id" v-model="selectedAnswer" color="primary">
                <v-list-item
                  :ripple="false"
                  :selectable="false"
                  v-for="choice in choices"
                  :key="choice.id"
                  :id="choice.id"
                  :value="choice.id"
                >
                  <v-row cols="12" class="mb-2 ml-1" v-if="currentQuestion.isMultiSelect">
                    <v-checkbox class="mt-0" v-model="selectedAnswers" :value="choice.id">
                      <template #label>
                        <div class="bordered">
                          <TranslatedContent
                            type="multipleChoiceQuestion"
                            :record="currentQuestion"
                            :lookup="{
                              type: 'objectInArray',
                              arrayPath: 'choices',
                              identityKey: 'id',
                              identityValue: choice.id,
                              objectKey: 'text',
                            }"
                          />
                        </div>
                      </template>
                    </v-checkbox>
                  </v-row>
                  <v-row cols="12" align="center" class="mb-2 ml-1" v-else>
                    <v-list-item-icon>
                      <v-icon v-if="selectedAnswer === choice.id">radio_button_checked</v-icon>
                      <v-icon v-else>radio_button_unchecked</v-icon>
                    </v-list-item-icon>
                    <div class="bordered">
                      <TranslatedContent
                        type="multipleChoiceQuestion"
                        :record="currentQuestion"
                        :lookup="{
                          type: 'objectInArray',
                          arrayPath: 'choices',
                          identityKey: 'id',
                          identityValue: choice.id,
                          objectKey: 'text',
                        }"
                      />
                    </div>
                  </v-row>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-row>
        </v-card>
        <div style="display: flex">
          <v-btn v-if="currentQuestion.type === 'PS'" class="mt-7 wide-button no-transform" @click="noAnswer">
            {{ $t('CriticalThinkingPrompt.no_pathology', languageCode) }}
            <v-checkbox :value="selectedAnswer && selectedAnswer.noSelections"></v-checkbox>
          </v-btn>
          <v-spacer />
          <v-btn
            tile
            class="mt-7 no-transform wide-button bold"
            color="buttonBlue text-white"
            :loading="isSavingCriticalThinkingAnswer"
            :disabled="isSubmitDisabled"
            @click="submitAnswer"
          >
            {{ $t('global.submit_answer', languageCode) }}
          </v-btn>
        </div>
      </v-col> -->
    </v-row>
  </article>
</template>

<script>
import { get, shuffle, sortBy, isNil } from 'lodash'
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import TranslatedContent from '@/components/TranslatedContent'
import BaseMedia from '@/components/CriticalThinking/Media/BaseMedia'
// import VideoMedia from '@/components/CriticalThinking/Media/VideoMedia'
// import ClickableOverlay from '@/components/ClickableOverlay'
import ScreeningForm from '@/components/ScreeningForm'

const PATIENT_SCREENING_CATEGORY_ID = 3
const ANATOMY_CATEGORY_ID = 6

const shuffleExemptCategories = [PATIENT_SCREENING_CATEGORY_ID, ANATOMY_CATEGORY_ID]

export default {
  name: 'CriticalThinkingQuizPreviewForm',
  props: {
    input: {
      type: Number,
      default: null,
    },
    value: {
      type: String,
      default: '',
    },
  },
  components: {
    TranslatedContent,
    BaseMedia,
    // VideoMedia,
    // ClickableOverlay,
    ScreeningForm,
  },
  data() {
    return {
      selectedAnswer: null,
      selectedAnswers: [],
      videoPaused: true,
      videoTime: 0,
      selectedTime: null,
      videoLoaded: false,
      timeRemaining: null,
      timer: null,
    }
  },
  watch: {
    videoPaused(isPaused) {
      if (isPaused && !this.selectedTime) {
        this.selectedTime = -1
      }
    },
    selectedTime(newTime) {
      this.$emit('input', newTime)
    },
    serializedAnswers(newVal) {
      this.$emit('input', newVal)
    },
    currentQuestion() {
      this.initializeQuestion()
    },
    currentSelection: {
      handler: function () {
        if (this.currentSelection) {
          this.selectedAnswer = { noSelections: this.noSelections, selection: this.currentSelection }
        }
      },
    },
  },
  mounted() {
    this.initializeQuestion()
  },
  beforeDestroy() {
    this.hidePointSelect()
    this.unload()
    clearInterval(this.timer)
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapState('pointSelectService', ['noSelections', 'selections', 'currentSelection']),
    ...mapState('cohortService', ['myCohort']),
    ...mapState('questionService', [
      'criticalThinkingQuestionsPreview',
      'criticalThinkingAnswers',
      'criticalThinkingQuestionIndex',
      'isSavingCriticalThinkingAnswer',
    ]),
    ...mapGetters('questionService', ['criticalThinkingQuestionsPostQuestionsCount']),
    currentQuestion() {
      const { preQuestion } = this.criticalThinkingQuestionsPreview || {}

      if (preQuestion) return preQuestion

      return null
    },
    choices() {
      // Matthew wanted choices shuffled to keep people on their toes
      // Unless the category is "Anatomy" or "Patient Screening"
      if (shuffleExemptCategories.includes(this.currentQuestion?.categoryId)) {
        return this.currentQuestion?.choices || []
      }

      return shuffle(this.currentQuestion?.choices || [])
    },
    serializedAnswers() {
      if (!get(this.currentQuestion, ['isMultiSelect'])) return this.selectedAnswer

      return sortBy(this.selectedAnswers).join(',')
    },
    isSubmitDisabled() {
      // for video/point select, any answer must be selected
      if (this.currentQuestion?.type === 'TR') {
        return isNil(this.selectedAnswer)
      }

      const selectedAnswer = this.currentQuestion?.isMultiSelect ? this.serializedAnswers : this.selectedAnswer
      if (!selectedAnswer) {
        return true
      }
      return false
    },
    showIfTimedExam() {
      return this.timeRemaining && get(this.myCohort, 'adminSettings.isChallengeModeEnabled')
    },
    showBaseMedia() {
      const { type, media } = this.currentQuestion
      return media && type !== 'TR' && type !== 'SF' && type !== 'PS'
    },
  },
  methods: {
    ...mapMutations('pointSelectService', [
      'unload',
      'setSingleSelection',
      'showPointSelect',
      'hidePointSelect',
      'enableSelection',
    ]),
    ...mapActions('questionService', ['saveCriticalThinkingAnswer', 'submitTestRun']),
    // async submitAnswer(answer) {
    //   const selectedAnswer = this.currentQuestion?.isMultiSelect ? this.serializedAnswers : this.selectedAnswer
    //   this.saveCriticalThinkingAnswer({
    //     question: this.currentQuestion,
    //     selectedAnswer: selectedAnswer ?? answer,
    //   })
    // },
    initializeQuestion() {
      // When Question changes, the picked answers should reset
      this.selectedTime = null
      this.selectedAnswer = null
      this.selectedAnswers = []

      if (get(this.currentQuestion, ['isMultiSelect']) && this.value) {
        return (this.selectedAnswers = this.value)
      }

      if (this.currentQuestion?.type === 'PS') {
        this.unload()
        this.showPointSelect()
        this.enableSelection()
        this.setSingleSelection(true)
      }
    },
    startVideo() {
      this.videoPaused = false
    },
    stopVideo() {
      this.selectedTime = this.videoTime
      this.selectedAnswer = this.selectedTime
      this.videoPaused = true
    },
    checkIfTimeIsUp() {
      const timesUp = this.timeRemaining <= 0
      if (timesUp) {
        this.submitTestRun()
        clearInterval(this.timer)
      }
    },
    noAnswer() {
      if (this.currentQuestion?.type === 'PS') {
        this.unload()
      }
    },
    toCountdownTimer(secs) {
      let sec_num = parseInt(secs, 10)
      let hours = Math.floor(sec_num / 3600)
      let minutes = Math.floor((sec_num - hours * 3600) / 60)
      let seconds = sec_num - hours * 3600 - minutes * 60

      if (hours < 10) {
        hours = '0' + hours
      }
      if (minutes < 10) {
        minutes = '0' + minutes
      }
      if (seconds < 10) {
        seconds = '0' + seconds
      }
      if (hours > 0) return hours + ':' + minutes + ':' + seconds
      return minutes + ':' + seconds
    },
    redIfShortOnTime(secs) {
      return secs <= 60
    },
  },
}
</script>

<style scoped lang="scss">
.bordered {
  border: 2px solid $gray-four;
  border-radius: 10px;
  padding: 10px;
  width: 480px !important;
}

.bold {
  font-weight: bold !important;
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

.v-list-item__icon {
  margin-right: 12px !important;
}
.red-color-text {
  color: red;
}

.instructions {
  flex-direction: row-reverse;
  font-size: 0.8em;
  padding-top: 20px;
}
</style>
