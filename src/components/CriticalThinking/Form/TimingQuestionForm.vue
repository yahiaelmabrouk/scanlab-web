<template>
  <div>
    <v-row>
      <strong class="mx-auto">
        <TranslatedContent
          type="multipleChoiceQuestion"
          :record="question"
          :lookup="{ type: 'nestedKey', path: 'questionText' }"
        />
      </strong>
    </v-row>
    <v-row>
      <span class="instructions">{{ $t('CriticalThinkingPrompt.video_instructions_0') }}</span>
    </v-row>
    <v-row>
      <span class="instructions">{{ $t('CriticalThinkingPrompt.video_instructions_1') }}</span>
    </v-row>
    <v-row>
      <span class="instructions">{{ $t('CriticalThinkingPrompt.video_instructions_2') }}</span>
    </v-row>
    <v-row>
      <v-card raised class="pa-1 mx-auto">
        <div>
          <VideoMedia
            @loaded="videoLoaded = true"
            :paused.sync="videoPaused"
            :time.sync="videoTime"
            :allow-full-video-control="false"
            :video="question.media"
            fill-height
          ></VideoMedia>
        </div>
        <v-btn color="green" :disabled="this.videoTime > 0 || !videoLoaded" width="50%" @click="startVideo">{{
          $t('CriticalThinkingPrompt.start_video')
        }}</v-btn>
        <v-btn color="red" :disabled="this.videoPaused" width="50%" @click="stopVideo">{{
          $t('CriticalThinkingPrompt.pause')
        }}</v-btn>
      </v-card>
    </v-row>
  </div>
</template>

<script>
import TranslatedContent from '@/components/TranslatedContent'
import VideoMedia from '../Media/VideoMedia'

export default {
  name: 'MultipleChoiceForm',
  components: {
    VideoMedia,
    TranslatedContent,
  },
  props: {
    question: {
      type: Object,
      required: true,
    },
    input: {
      type: Number,
      default: null,
    },
  },
  computed: {},
  data() {
    return {
      videoPaused: true,
      videoTime: 0,
      selectedTime: null,
      videoLoaded: false,
    }
  },
  watch: {
    videoPaused(isPaused) {
      if (isPaused && !this.selectedTime) {
        // user let the video play without selecting anything
        this.selectedTime = -1
      }
    },
    selectedTime(newTime) {
      this.$emit('input', newTime)
    },
  },
  methods: {
    startVideo() {
      this.videoPaused = false
    },
    stopVideo() {
      this.selectedTime = this.videoTime
      this.videoPaused = true
    },
  },
}
</script>

<style scoped lang="scss">
.instructions {
  font-size: 0.8em;
  font-style: italic;
  margin: auto;
}
</style>
