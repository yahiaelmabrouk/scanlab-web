<template>
  <div>
    <DicomPreview
      :key="dicomFileSetId"
      view-orientation="z"
      :dicom-file-set-id="dicomFileSetId"
      :is-show-point-selection-answer-area="isShowPointSelectionAnswerArea"
      :is-preview-critical-thinking-question="isPreviewCriticalThinkingQuestion"
      :is-in-critical-thinking-question="isInCriticalThinkingQuestion"
      :is-show-critical-question-result="isShowCriticalQuestionResult"
    />
  </div>
</template>

<script>
import DicomPreview from '../../DicomPreview'

export default {
  name: 'DicomMedia',
  components: { DicomPreview },
  props: {
    dicomFileSetId: {
      type: Number,
      required: true,
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

<style></style>
