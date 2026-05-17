<template>
  <div ref="container" class="scanlab-range-slider" :class="{ disabled: disabled }">
    <div class="track-container">
      <div ref="trackBackgroundLeft" class="track-background"></div>
      <div ref="trackFill" class="track-fill"></div>
      <div ref="trackBackgroundRight" class="track-background"></div>
    </div>
    <div
      ref="thumbLeft"
      class="thumb-container"
      :class="{ active: activeThumb == 'min' }"
      aria-orientation="horizontal"
      @mousedown="
        movingThumb = 'min'
        activeThumb = 'min'
      "
    >
      <div class="thumb"></div>
    </div>
    <div
      ref="thumbRight"
      class="thumb-container"
      :class="{ active: activeThumb == 'max' }"
      aria-orientation="horizontal"
      @mousedown="
        movingThumb = 'max'
        activeThumb = 'max'
      "
    >
      <div class="thumb"></div>
    </div>
  </div>
</template>
<script>
import _ from 'lodash'
export default {
  props: {
    value: {
      type: Array,
      required: true,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      movingThumb: null,
      activeThumb: null,
      localMin: 0,
      localMax: 0,
    }
  },
  computed: {
    inputMinValue() {
      return Math.min(...this.value) || this.min
    },
    inputMaxValue() {
      return Math.max(...this.value) || this.max
    },
    minPercent() {
      return ((this.localMin - this.min) / (this.max - this.min)) * 100
    },
    maxPercent() {
      return ((this.localMax - this.min) / (this.max - this.min)) * 100
    },
  },
  watch: {
    value: {
      immediate: true,
      handler() {
        this.updateLocalValue()
        this.updateTrack()
      },
    },
    localMin() {
      this.updateTrack()
    },
    localMax() {
      this.updateTrack()
    },
    min() {
      this.updateTrack()
    },
    max() {
      this.updateTrack()
    },
  },
  mounted() {
    this.updateLocalValue()
    this.updateTrack()
    document.addEventListener('pointermove', this.onDrag)
    document.addEventListener('pointerup', this.onPointerUp)
  },
  beforeDestroy() {
    document.removeEventListener('pointermove', this.onDrag)
    document.removeEventListener('pointerup', this.onPointerUp)
  },
  methods: {
    updateLocalValue() {
      if (this.movingThumb) return
      this.localMin = Math.min(...this.value) || this.min
      this.localMax = Math.max(...this.value) || this.max
    },
    updateTrack() {
      const trackBackgroundLeft = this.$refs.trackBackgroundLeft
      const trackFill = this.$refs.trackFill
      const trackBackgroundRight = this.$refs.trackBackgroundRight
      const thumbLeft = this.$refs.thumbLeft
      const thumbRight = this.$refs.thumbRight

      if (trackBackgroundLeft) {
        trackBackgroundLeft.style.width = `${this.minPercent}%`
        trackBackgroundLeft.style.left = `0%`
      }
      if (trackFill) {
        trackFill.style.width = `${this.maxPercent - this.minPercent}%`
        trackFill.style.left = `${this.minPercent}%`
      }
      if (trackBackgroundRight) {
        trackBackgroundRight.style.width = `${100 - this.maxPercent}%`
        trackBackgroundRight.style.left = `${this.maxPercent}%`
      }
      if (thumbLeft) {
        thumbLeft.style.left = `${this.minPercent}%`
      }
      if (thumbRight) {
        thumbRight.style.left = `${this.maxPercent}%`
      }
    },
    onPointerUp() {
      if (!this.movingThumb) return
      this.movingThumb = null
      this.activeThumb = null
      const newValue = _.orderBy([this.localMin, this.localMax], [(v) => v], ['asc'])
      const isChange = _.some(newValue, (v, index) => v !== this.value[index])
      isChange && this.$emit('change', newValue)
    },
    onDrag(event) {
      if (this.disabled || !this.movingThumb) return
      const container = this.$refs.container
      const rect = container.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      const percent = Math.min(Math.max(offsetX / rect.width, 0), 1)
      const value = Math.round(this.min + percent * (this.max - this.min))

      if (this.movingThumb === 'min') {
        const newValue = _.orderBy([value, this.inputMaxValue], [(v) => v], ['asc'])
        this.localMin = newValue[0]
        this.localMax = newValue[1]
        if (value > this.inputMaxValue) {
          this.activeThumb = 'max'
        } else {
          this.activeThumb = 'min'
        }
      } else {
        const newValue = _.orderBy([this.inputMinValue, value], [(v) => v], ['asc'])
        this.localMin = newValue[0]
        this.localMax = newValue[1]
        if (value < this.inputMinValue) {
          this.activeThumb = 'min'
        } else {
          this.activeThumb = 'max'
        }
      }
    },
  },
}
</script>
<style lang="scss">
.scanlab-range-slider {
  position: relative;
  min-height: 32px;
  margin: 0 8px;
  user-select: none;
  &.disabled {
    pointer-events: none;
    .track-container {
      .track-background {
        background-color: rgba(0, 0, 0, 0.26);
      }
      .track-fill {
        background-color: rgba(0, 0, 0, 0.26);
      }
    }
    .thumb-container {
      .thumb {
        background-color: rgba(0, 0, 0, 0.26);
        &::before {
          background-color: rgba(0, 0, 0, 0.26);
          transform: scale(1);
        }
      }
    }
  }
  .track-container {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    transform: translateY(-50%);
    .track-background {
      position: absolute;
      height: 100%;
      background-color: #81cbf3;
      transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    }
    .track-fill {
      position: absolute;
      height: 100%;
      background-color: #247ba0;
      transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    }
  }
  .thumb-container {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 100%;
    transform: translateY(-50%);
    user-select: none;
    width: 0px;
    .thumb {
      position: absolute;
      width: 12px;
      height: 12px;
      background-color: #247ba0;
      border-radius: 50%;
      top: 50%;
      cursor: pointer;
      transform: translate(-50%, -50%);
      transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
      &::before {
        content: '';
        position: absolute;
        width: 36px;
        height: 36px;
        background-color: #247ba0;
        border-radius: 50%;
        opacity: 0.3;
        top: -12px;
        left: -12px;
        transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
        transform: scale(0.1);
        pointer-events: none;
      }
      &:hover {
        &::before {
          transform: scale(1);
        }
      }
    }
    &.active {
      .thumb {
        transition: 0s !important;
        &::before {
          transform: scale(1);
          transition: 0s !important;
        }
      }
    }
  }
}
</style>
