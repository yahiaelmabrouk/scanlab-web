<template>
  <div class="d-flex justify-content-center">
    <v-skeleton-loader
      v-if="!loaded && !error"
      :height="image.dimensions.height"
      :max-width="image.dimensions.width"
      type="image"
    ></v-skeleton-loader>
    <div
      v-if="error"
      class="image-error-state d-flex flex-column align-center justify-center"
      :style="{
        height: image.dimensions.height + 'px',
        maxWidth: image.dimensions.width + 'px',
      }"
    >
      <v-icon large color="error" class="mb-2">mdi-image-broken-variant</v-icon>
      <p class="mb-2">{{ $t('global.image_load_failed') }}</p>
      <v-btn small outlined color="primary" @click="retry">
        <v-icon small left>mdi-refresh</v-icon>
        {{ $t('global.retry') }}
      </v-btn>
    </div>
    <img
      ref="img"
      v-show="loaded"
      @load="doneLoading"
      @error="onLoadError"
      :src="imageSrc"
      :alt="image.alt"
      :max-height="image.dimensions.height"
      :max-width="image.dimensions.width"
      @click="handleClick"
    />
  </div>
</template>

<script>
import EventBus from '@/lib/event-bus'

const LOAD_TIMEOUT_MS = 30000

export default {
  name: 'ImageMedia',
  props: {
    image: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loaded: false,
      error: false,
      retryCount: 0,
      loadTimeoutId: null,
    }
  },
  computed: {
    imageSrc() {
      const src = this.image.src
      if (!this.retryCount || src.startsWith('data:')) return src
      const separator = src.includes('?') ? '&' : '?'
      return `${src}${separator}_retry=${this.retryCount}`
    },
  },
  watch: {
    'image.src'() {
      this.loaded = false
      this.error = false
      this.retryCount = 0
      this.$nextTick(() => {
        const img = this.$refs.img
        if (img && img.complete && img.naturalWidth > 0) {
          this.doneLoading()
        } else {
          this.startLoadTimeout()
        }
      })
    },
  },
  mounted() {
    const img = this.$refs.img
    if (img && img.complete && img.naturalWidth > 0) {
      this.doneLoading()
    } else {
      this.startLoadTimeout()
    }
  },
  beforeDestroy() {
    this.clearLoadTimeout()
  },
  methods: {
    doneLoading() {
      this.clearLoadTimeout()
      this.error = false
      this.loaded = true
      this.$emit('loaded')
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
    handleClick(event) {
      const selection = { x: event.clientX, y: event.clientY, z: null, t: null }
      EventBus.$emit('pointSelectClick', {
        media: this.$props.image,
        selection,
        selections: [selection],
        hide: false,
        event,
      })
    },
  },
}
</script>

<style scoped>
.image-error-state {
  border: 1px dashed #ccc;
  border-radius: 4px;
  background-color: #fafafa;
  width: 100%;
}
</style>
