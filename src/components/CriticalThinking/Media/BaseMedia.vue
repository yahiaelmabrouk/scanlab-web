<template>
  <div v-if="media">
    <DicomMedia
      v-if="media.dicomFileSetId"
      :dicom-file-set-id="media.dicomFileSetId"
      :is-show-point-selection-answer-area="isShowPointSelectionAnswerArea"
      :is-preview-critical-thinking-question="isPreviewCriticalThinkingQuestion"
      :is-in-critical-thinking-question="isInCriticalThinkingQuestion"
      :is-show-critical-question-result="isShowCriticalQuestionResult"
    />
    <ImageMedia
      v-else-if="media.type && media.type.startsWith('image')"
      :image="media"
      @loaded="$emit('media-loaded')"
      @error="$emit('media-error')"
      @loading="$emit('media-loading')"
    />
    <VideoMedia
      v-else-if="media.type && media.type.startsWith('video')"
      :allow-full-video-control="fullVideoControl"
      :video="media"
      :start-time="startTime"
      @loaded="$emit('media-loaded')"
      @error="$emit('media-error')"
      @loading="$emit('media-loading')"
    />
  </div>
</template>

<script>
import ImageMedia from '../Media/ImageMedia'
import VideoMedia from '../Media/VideoMedia'
import DicomMedia from '../Media/DicomMedia'

export default {
  name: 'BaseMedia',
  components: {
    ImageMedia,
    VideoMedia,
    DicomMedia,
  },
  props: {
    media: {
      type: Object,
      required: true,
    },
    fullVideoControl: {
      type: Boolean,
      required: true,
    },
    startTime: {
      type: Number,
      default: 0,
    },
    isShowPointSelectionAnswerArea: {
      type: Boolean,
      required: false,
      default: false,
    },
    isPreviewCriticalThinkingQuestion: {
      type: Boolean,
      required: false,
      default: false,
    },
    isInCriticalThinkingQuestion: {
      type: Boolean,
      required: false,
      default: false,
    },
    isShowCriticalQuestionResult: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
}
</script>
