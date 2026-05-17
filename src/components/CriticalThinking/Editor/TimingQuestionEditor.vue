<template>
  <div>
    <VideoMedia fill-width allow-full-control :video="video" :time.sync="videoTime"></VideoMedia>
    <v-range-slider
      v-model="range"
      class="range-slider"
      dense
      step="0.25"
      ticks="always"
      color="green"
      track-color="red"
      :min="0"
      :max="roundedDuration"
    ></v-range-slider>
    {{ formattedRange }}
  </div>
</template>

<script>
import VideoMedia from '../Media/VideoMedia'

export default {
  name: 'TimingQuestionEditor',
  components: {
    VideoMedia,
  },
  props: {
    video: {
      type: Object,
      required: true,
    },
    value: {
      type: Array,
      required: true,
    },
  },
  watch: {
    range() {
      // Set the video's time to the last changed value
      if (this.lastMin !== this.range[0]) {
        this.lastMin = this.range[0]
        this.videoTime = this.lastMin
      } else if (this.lastMax !== this.range[1]) {
        this.lastMax = this.range[1]
        this.videoTime = this.lastMax
      }

      this.$emit('input', this.range)
    },
    value() {
      this.range = this.value
    },
  },
  methods: {},
  mounted() {
    this.lastMin = this.range[0]
    this.lastMax = this.range[1]
  },
  data() {
    return {
      lastMin: 0,
      lastMax: 0,
      videoTime: 0,
      range: this.value,
    }
  },
  computed: {
    roundedDuration() {
      return Math.round(this.video.dimensions.duration)
    },
    formattedRange() {
      return `${this.range[0]}s - ${this.range[1]}s`
    },
  },
}
</script>

<style scoped lang="scss">
div.range-slider {
  width: 98.5%;
  margin: auto;
}
</style>
