<template>
  <div>
    <v-skeleton-loader v-if="!loaded && !error" width="100%" height="100%" type="image"> </v-skeleton-loader>
    <div v-if="error" class="video-error-state d-flex flex-column align-center justify-center">
      <v-icon large color="error" class="mb-2">mdi-video-off</v-icon>
      <p class="mb-2">{{ $t('global.video_load_failed') }}</p>
      <v-btn small outlined color="primary" @click="retry">
        <v-icon small left>mdi-refresh</v-icon>
        {{ $t('global.retry') }}
      </v-btn>
    </div>
    <video
      ref="video"
      v-show="loaded"
      :class="{ 'enable-controls': !allowFullControl }"
      preload="auto"
      :height="fillHeight ? '100%' : ''"
      :width="fillWidth ? '100%' : ''"
      :src="videoSrc"
      @playing="updatePaused"
      @pause="updatePaused"
      @timeupdate="updateTime"
      @loadeddata="doneLoading"
      @error="onLoadError"
    />
  </div>
</template>

<script>
import EventBus from '@/lib/event-bus'
import _ from 'lodash'

const LOAD_TIMEOUT_MS = 30000

export default {
  name: 'VideoMedia',
  props: {
    video: {
      type: Object,
      required: true,
    },
    allowFullControl: {
      type: Boolean,
      default: false,
    },
    paused: {
      type: Boolean,
      default: null,
    },
    time: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Number,
      default: 0,
    },
    fillWidth: {
      type: Boolean,
      default: true,
    },
    fillHeight: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      internalTime: this.$props.time,
      loaded: false,
      error: false,
      retryCount: 0,
      loadTimeoutId: null,
    }
  },
  computed: {
    player() {
      return this.$refs.video
    },
    videoSrc() {
      const src = this.video.src
      const fragment = '#t=' + this.startTime
      if (!this.retryCount || src.startsWith('data:')) return src + fragment
      const separator = src.includes('?') ? '&' : '?'
      return `${src}${separator}_retry=${this.retryCount}${fragment}`
    },
  },
  watch: {
    loaded(isLoaded) {
      if (isLoaded) this.$emit('loaded')
    },
    paused(newPause) {
      if (newPause) {
        this.player.pause()
      } else {
        this.player.play()
      }
    },
    time(newTime) {
      if (_.isFinite(newTime) && newTime !== this.internalTime) {
        this.player.currentTime = newTime
      }
    },
    'video.src'() {
      this.loaded = false
      this.error = false
      this.retryCount = 0
      this.$nextTick(() => {
        const video = this.$refs.video
        if (video && video.readyState >= 2) {
          this.doneLoading()
        } else {
          this.startLoadTimeout()
        }
      })
    },
  },
  mounted() {
    const video = this.$refs.video
    if (video && video.readyState >= 2) {
      this.doneLoading()
    } else {
      this.startLoadTimeout()
    }
  },
  beforeDestroy() {
    this.clearLoadTimeout()
  },
  methods: {
    updatePaused() {
      this.$emit('update:paused', this.player.paused)
      this.updateTime()
    },
    updateTime() {
      this.internalTime = this.player.currentTime
      this.$emit('update:time', this.internalTime)
    },
    handleClick(event) {
      const selection = { x: event.clientX, y: event.clientY, z: null, t: this.time }
      EventBus.$emit('pointSelectClick', {
        media: this.$props.video,
        selection,
        selections: [selection],
        hide: false,
        event,
      })
    },
    doneLoading() {
      this.clearLoadTimeout()
      this.error = false
      this.loaded = true
      EventBus.$emit('pointSelectReady')
    },
    onLoadError() {
      this.clearLoadTimeout()
      this.loaded = false
      this.error = true
      this.$emit('error')
    },
    retry() {
      this.error = false
      this.loaded = false
      this.retryCount += 1
      this.$emit('loading')
      this.startLoadTimeout()
    },
    startLoadTimeout() {
      this.clearLoadTimeout()
      this.loadTimeoutId = setTimeout(() => {
        if (!this.loaded && !this.error) {
          this.onLoadError()
        }
      }, LOAD_TIMEOUT_MS)
    },
    clearLoadTimeout() {
      if (this.loadTimeoutId) {
        clearTimeout(this.loadTimeoutId)
        this.loadTimeoutId = null
      }
    },
  },
}
</script>

<style scoped lang="scss">
video.enable-controls {
  pointer-events: none !important;
}

.video-error-state {
  border: 1px dashed #ccc;
  border-radius: 4px;
  background-color: #fafafa;
  width: 100%;
  min-height: 200px;
}
</style>
