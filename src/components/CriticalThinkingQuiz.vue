<template>
  <article id="critical-thinking-quiz" v-if="currentQuestion" class="critical-thinking-quiz-container">
    <h1 v-if="showIfTimedExam">
      <span class="pr-8">
        {{ $t('global.question', languageCode) }}: {{ criticalThinkingQuestionIndex + 1 }} /
        {{ criticalThinkingQuestionsPostQuestionsCount }}
      </span>
      {{ $t('CriticalThinkingPrompt.time_remaining', languageCode) }}
      <span :class="{ 'red-color-text': redIfShortOnTime(timeRemaining) }">{{ toCountdownTimer(timeRemaining) }}</span>
      <v-tooltip bottom v-if="!mediaReady || isSavingCriticalThinkingAnswer">
        <template #activator="{ on }">
          <v-icon small class="ml-2" v-on="on">mdi-pause-circle</v-icon>
        </template>
        <span>{{ $t('CriticalThinkingPrompt.timer_paused', languageCode) }}</span>
      </v-tooltip>
    </h1>
    <v-row justify="space-around" cols="12">
      <v-col ref="leftColumnContainer">
        <v-card class="pt-3 pb-3 scan-view-options test-question pa-5">
          <v-row align="center" justify="space-between">
            <v-card-title class="flex justify-space-between align-center">
              <h5 class="mb-0">
                {{ $t('global.critical_thinking_question', languageCode) }}
              </h5>
            </v-card-title>
          </v-row>
          <v-card-text v-if="currentQuestion.type === 'TR'">
            <div class="ct-question-text">
              <TranslatedContent
                type="multipleChoiceQuestion"
                :record="currentQuestion"
                :lookup="{ type: 'nestedKey', path: 'questionText' }"
              />
            </div>
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
            <div class="ct-question-text">
              <TranslatedContent
                type="multipleChoiceQuestion"
                :record="currentQuestion"
                :lookup="{ type: 'nestedKey', path: 'questionText' }"
              />
            </div>
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
            <BaseMedia
              :full-video-control="false"
              :media="currentQuestion.media"
              :is-in-critical-thinking-question="true"
              @media-loaded="mediaReady = true"
              @media-error="mediaReady = false"
              @media-loading="mediaReady = false"
            />
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
      <v-col align="end" class="relative">
        <div ref="quizAnswersContainer" class="w-100 quiz-answers-container">
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
                    @loaded="
                      videoLoaded = true
                      mediaReady = true
                    "
                    @error="mediaReady = false"
                    @loading="mediaReady = false"
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
                  <!-- <ClickableOverlay v-model="selectedAnswer" :dimensions="currentQuestion.media.dimensions" /> -->
                  <BaseMedia
                    :full-video-control="true"
                    :media="currentQuestion.media"
                    :is-in-critical-thinking-question="true"
                    @media-loaded="mediaReady = true"
                    @media-error="mediaReady = false"
                    @media-loading="mediaReady = false"
                  />
                </div>
              </v-col>
            </v-row>
            <v-row cols="12" class="w-100" v-else>
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
                    <!-- This structure of a sudden checkbox seems to still be having the radio option select secretly, too, but it works for now -->
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
            <v-btn
              v-if="currentQuestion && currentQuestion.type === 'PS' && shouldShowNoPathologyButton"
              class="mt-7 wide-button no-transform"
              @click="noAnswer"
            >
              {{ $t('CriticalThinkingPrompt.no_pathology', languageCode) }}
              <v-checkbox v-model="currentNopathologyValue"></v-checkbox>
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
        </div>
      </v-col>
    </v-row>
  </article>
</template>

<script>
import { get, shuffle, sortBy, isNil } from 'lodash'
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import TranslatedContent from '@/components/TranslatedContent'
import BaseMedia from '@/components/CriticalThinking/Media/BaseMedia'
import VideoMedia from '@/components/CriticalThinking/Media/VideoMedia'
// import ClickableOverlay from '@/components/ClickableOverlay'
import ScreeningForm from '@/components/ScreeningForm'
import _ from 'lodash'
import EventBus from '@/lib/event-bus'
import config from '../config'

const PATIENT_SCREENING_CATEGORY_ID = 3
const ANATOMY_CATEGORY_ID = 6

const shuffleExemptCategories = [PATIENT_SCREENING_CATEGORY_ID, ANATOMY_CATEGORY_ID]

export default {
  name: 'CriticalThinkingQuiz',
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
    VideoMedia,
    // ClickableOverlay,
    ScreeningForm,
  },
  data() {
    return {
      isCTLab: config.isCTLab,
      selectedAnswers: [],
      videoPaused: true,
      videoTime: 0,
      selectedTime: null,
      videoLoaded: false,
      timeRemaining: null,
      timer: null,
      shouldUpdatePsAnswer: false,
      mediaReady: true,
    }
  },
  watch: {
    isLoaded(loaded) {
      if (this.currentQuestion?.media?.dicomFileSetId) {
        this.mediaReady = loaded
      }
    },
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
    userPointSelectAnswerDotSize: {
      handler: function () {
        if (this.allowSelection && this.isLoaded) {
          if (this.selectedPointInfo) {
            this.selectedAnswer = {
              noSelections: false,
              selection: this.currentSelection,
              selectedPointInfo: this.selectedPointInfo,
              userPointSelectAnswerDotSize: this.userPointSelectAnswerDotSize,
            }
          }
        }
      },
    },
    currentSelection: {
      handler: function () {
        if (this.allowSelection && this.isLoaded) {
          if (this.selectedPointInfo) {
            this.selectedAnswer = {
              noSelections: false,
              selection: this.currentSelection,
              selectedPointInfo: this.selectedPointInfo,
              userPointSelectAnswerDotSize: this.userPointSelectAnswerDotSize,
            }
          }
        }
      },
    },
    selectedPointInfo: {
      handler: function () {
        if (this.allowSelection && this.isLoaded) {
          if (this.selectedPointInfo) {
            this.shouldUpdatePsAnswer = true
          }
          if (this.shouldUpdatePsAnswer) {
            if (this.selectedPointInfo) {
              this.selectedAnswer = {
                noSelections: false,
                selection: this.currentSelection,
                selectedPointInfo: this.selectedPointInfo,
                userPointSelectAnswerDotSize: this.userPointSelectAnswerDotSize,
              }
            } else {
              this.selectedAnswer = {
                noSelections: true,
              }
            }
          }
          this.shouldUpdatePsAnswer = true
        }
      },
    },
  },
  mounted() {
    this.initializeQuestion()
    this.startTimedExams()

    EventBus.$on('onConfirmPointSelectQuestion', this.onConfirmPointSelectQuestion)
    EventBus.$on('onNoAnswerPointSelectQuestion', this.onNoAnswerPointSelectQuestion)
    window.addEventListener('scroll', this.handleQuizAnswersFixed)
    window.addEventListener('resize', this.handleQuizAnswersFixed)
  },
  beforeDestroy() {
    this.hidePointSelect()
    this.disableSelection()
    this.unload()
    clearInterval(this.timer)

    EventBus.$off('onConfirmPointSelectQuestion', this.onConfirmPointSelectQuestion)
    EventBus.$off('onNoAnswerPointSelectQuestion', this.onNoAnswerPointSelectQuestion)
    window.removeEventListener('scroll', this.handleQuizAnswersFixed)
    window.removeEventListener('resize', this.handleQuizAnswersFixed)
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapState('pointSelectService', [
      'noSelections',
      'selections',
      'currentSelection',
      'selectedPointInfo',
      'allowSelection',
      'userPointSelectAnswerDotSize',
    ]),
    ...mapState('cohortService', ['myCohort']),
    ...mapState('questionService', [
      'isViewingCriticalThinkingQuestion',
      'criticalThinkingQuestions',
      'criticalThinkingAnswers',
      'criticalThinkingQuestionIndex',
      'isSavingCriticalThinkingAnswer',
      'currentCriticalThinkingQuestionSelectedAnswer',
    ]),
    ...mapGetters('questionService', ['criticalThinkingQuestionsPostQuestionsCount']),
    ...mapState('dicomService', ['isLoaded']),
    ...mapGetters('testRunService', ['currentTestIsPreparedExam']),
    selectedAnswer: {
      get() {
        return this.currentCriticalThinkingQuestionSelectedAnswer
      },
      set(val) {
        this.setCurrentCriticalThinkingQuestionSelectedAnswer(val)
      },
    },
    currentNopathologyValue: {
      get() {
        if (this.selectedAnswer && this.selectedAnswer.noSelections) {
          return true
        } else {
          return false
        }
      },
      set() {},
    },
    currentQuestion() {
      const { preQuestion, postQuestions } = this.criticalThinkingQuestions || {}

      if (!this.isViewingCriticalThinkingQuestion) {
        return null
      }
      if (preQuestion) return preQuestion

      if (postQuestions) {
        return postQuestions[this.criticalThinkingQuestionIndex]
      }

      return null
    },
    selectedCategoryName() {
      return _.get(this.currentQuestion, ['category', 'name'], '')
    },
    shouldShowNoPathologyButton() {
      if (_.toLower(this.selectedCategoryName) == 'pathology') {
        return true
      } else {
        return false
      }
    },
    choices() {
      // Matthew wanted choices shuffled to keep people on their toes
      // Unless the category is "Anatomy" or "Patient Screening"
      if (shuffleExemptCategories.includes(this.currentQuestion?.categoryId) || this.currentQuestion?.keepOrder) {
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
      return this.timeRemaining && this.currentTestIsPreparedExam
    },
    showBaseMedia() {
      const { type, media } = this.currentQuestion
      return media && type !== 'TR' && type !== 'SF' && type !== 'PS'
    },
  },
  methods: {
    ...mapMutations('pointSelectService', [
      'unload',
      'unSelectAnswer',
      'load',
      'setSingleSelection',
      'showPointSelect',
      'hidePointSelect',
      'enableSelection',
      'disableSelection',
    ]),
    ...mapActions('questionService', [
      'saveCriticalThinkingAnswer',
      'submitTestRun',
      'setCurrentCriticalThinkingQuestionSelectedAnswer',
    ]),
    handleQuizAnswersFixed() {
      if (this.currentQuestion?.type !== 'SF') {
        return
      }
      const col = this.$refs.leftColumnContainer
      const el = this.$refs.quizAnswersContainer
      const rect1 = col.getBoundingClientRect()
      const rect2 = el.getBoundingClientRect()
      if (!el) return
      if (rect1.bottom < window.innerHeight && rect1.bottom - 15 - rect2.height < 0) {
        el.style.position = 'relative'
        el.style.top = `${rect1.height - 15 - rect2.height}px`
      } else if (rect1.top < 0) {
        el.style.position = 'relative'
        el.style.top = `${-rect1.top}px`
      } else {
        el.style.position = 'relative'
        el.style.top = `0px`
      }
    },
    onNoAnswerPointSelectQuestion() {
      this.noAnswer()
    },
    onConfirmPointSelectQuestion() {
      this.submitAnswer(null)
    },
    async submitAnswer(answer) {
      const selectedAnswer = this.currentQuestion?.isMultiSelect ? this.serializedAnswers : this.selectedAnswer
      this.saveCriticalThinkingAnswer({
        question: this.currentQuestion,
        selectedAnswer: selectedAnswer ?? answer,
      })
    },
    initializeQuestion() {
      // Determine if new question needs media to load
      const q = this.currentQuestion
      const hasMedia = q && q.media && q.type !== 'SF'
      this.mediaReady = !hasMedia

      // DICOM may already be cached in Vuex
      if (hasMedia && q.media.dicomFileSetId) {
        this.mediaReady = this.isLoaded
      }

      // When Question changes, the picked answers should reset
      this.selectedTime = null
      this.selectedAnswer = null
      this.selectedAnswers = []
      this.videoLoaded = false
      this.videoTime = 0
      this.videoPaused = true

      if (get(this.currentQuestion, ['isMultiSelect']) && this.value) {
        return (this.selectedAnswers = this.value)
      }

      if (this.currentQuestion?.type === 'PS') {
        this.shouldUpdatePsAnswer = false
        this.unload()
        this.load({
          selections: _.get(this.currentQuestion, ['range', 'selections'], {}),
        })
        this.showPointSelect()
        this.enableSelection()
        this.setSingleSelection(true)
      } else {
        this.hidePointSelect()
        this.disableSelection()
        this.unload()
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
    startTimedExams() {
      const isPostExamCTQ = isNil(this.criticalThinkingQuestions.preQuestion)
      const shouldStartTimedPortionOfExam = isPostExamCTQ && this.criticalThinkingQuestionIndex === 0
      const isTimedExam = this.currentTestIsPreparedExam && shouldStartTimedPortionOfExam

      if (isTimedExam && !this.timer) {
        let totalExamTimeInSeconds = 0
        for (let q of this.criticalThinkingQuestions.postQuestions) {
          totalExamTimeInSeconds += q.secondsToAnswer || 60
        }
        let secondsElapsed = 0
        this.timeRemaining = totalExamTimeInSeconds
        this.timer = setInterval(() => {
          if (this.mediaReady && !this.isSavingCriticalThinkingAnswer) {
            secondsElapsed++
            this.timeRemaining = totalExamTimeInSeconds - secondsElapsed
          }
          this.checkIfTimeIsUp()
        }, 1000)
      }
    },
    noAnswer() {
      if (this.currentQuestion?.type === 'PS') {
        if (this.selectedAnswer?.noSelections) {
          if (this.selectedPointInfo) {
            this.shouldUpdatePsAnswer = false
          } else {
            this.shouldUpdatePsAnswer = true
          }
          this.unSelectAnswer()
          this.selectedAnswer = null
        } else {
          this.shouldUpdatePsAnswer = false
          this.unSelectAnswer()
          this.selectedAnswer = {
            noSelections: true,
          }
        }
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
.quiz-answers-container {
  transition: all 0.2s ease-in;
}
.ct-question-text {
  font-size: 1.2rem;
}
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
