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
      <v-col v-if="question.media" cols="12">
        <div class="pa-1 media-box">
          <ClickableOverlay v-model="point" :dimensions="question.media.dimensions" />
          <BaseMedia
            :full-video-control="true"
            :media="question.media"
            :is-preview-critical-thinking-question="isPreviewCriticalThinkingQuestion"
          />
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import TranslatedContent from '@/components/TranslatedContent'
import BaseMedia from '../Media/BaseMedia'
import ClickableOverlay from '../../ClickableOverlay'

export default {
  name: 'PointSelectForm',
  components: {
    BaseMedia,
    ClickableOverlay,
    TranslatedContent,
  },
  props: {
    question: {
      type: Object,
      required: true,
    },
    value: {
      type: Object,
      default: () => {},
    },
    isPreviewCriticalThinkingQuestion: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      point: {},
    }
  },
  watch: {
    point(newPoint) {
      this.$emit('input', newPoint)
    },
  },
}
</script>

<style scoped lang="scss">
.media-box {
  position: relative;
}
</style>
