<template>
  <div ref="container">
    <svg v-show="isVisible" ref="overlay" :style="{ left: origin.x, top: origin.y }" :viewBox="viewbox">
      <circle
        :cx="svgPosition.x"
        :cy="svgPosition.y"
        :r="renderRadius"
        :fill-opacity="isVisible ? 1.0 : 0.0"
        fill="green"
      />
    </svg>
  </div>
</template>

<script>
import EventBus from '@/lib/event-bus'

export default {
  name: 'ClickableOverlay',
  props: {
    dimensions: {
      type: Object,
      default: () => null,
      required: false,
    },
    value: {
      type: Object,
      default: () => {},
    },
  },
  computed: {
    viewbox() {
      if (this.dimensions && this.dimensions.width) {
        return `0 0 ${this.dimensions.width} ${this.dimensions.height}`
      } else {
        return `0 0 500 500`
      }
    },
    svgPosition() {
      const localPosition = this.renderPosition
      const svg = this.$refs.overlay
      if (!svg || !localPosition) {
        return { x: 0, y: 0 }
      }
      const pt = svg.createSVGPoint()
      pt.x = localPosition.x + this.origin.x
      pt.y = localPosition.y + this.origin.y

      // transform to SVG coordinates
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())

      if (svgP.x < 0 || svgP.y < 0 || !isFinite(svgP.x) || !isFinite(svgP.y)) {
        // TODO on initial load, the matrix above is incorrect
        // This only applies to admins loading up the question in the editor
        // These coordinates should be close but not quite right
        return { x: this.renderPosition.x, y: this.renderPosition.y }
      }

      return { x: svgP.x, y: svgP.y }
    },
  },
  data() {
    return {
      // origin of what is being overlayed, relative to this component
      origin: { x: 0, y: 0 },

      // true point, used as official answer/question data
      selection: { x: 0, y: 0, z: null, t: null, radius: 10 },

      // 2D point, relative to origin, to render selection
      renderPosition: { x: 0, y: 0 },
      renderRadius: 10,
      isVisible: false,
    }
  },
  mounted() {
    EventBus.$on('pointSelectClick', this.handleMediaClick)
    EventBus.$on('pointSelectUpdate', this.updateOverlay)
    EventBus.$on('pointSelectReady', this.initialUpdate)
  },
  beforeDestroy() {
    EventBus.$off('pointSelectClick', this.handleMediaClick)
    EventBus.$off('pointSelectUpdate', this.updateOverlay)
    EventBus.$off('pointSelectReady', this.initialUpdate)
  },
  methods: {
    globalToLocalPosition(position) {
      const boundingRect = this.$refs.container.getBoundingClientRect()
      const { x, y } = boundingRect
      return { x: position.x - x, y: position.y - y }
    },
    initialUpdate() {
      this.$nextTick(function () {
        if (this.value) {
          const radius = this.value.selection ? this.value.selection.radius : this.renderRadius
          EventBus.$emit('pointSelectUpdate', {
            selection: this.value.selection,
            selections: this.value.selections,
            renderPosition: {
              x: this.value.a,
              y: this.value.b,
            },
            hide: true,
            radius: radius,
            initial: true,
          })
        }
      })
    },
    updateOverlay(event) {
      if (event.renderPosition) {
        this.renderPosition = { ...event.renderPosition }
      }
      if (event.origin) {
        // assume it's relavent to the document
        this.origin = this.globalToLocalPosition(event.origin)
      }
      if (event.selection) {
        this.selection = { ...event.selection }
        this.renderRadius = this.selection.radius
      }
      if (event.radius) {
        this.renderRadius = event.radius
        this.selection.radius = event.radius
      }
      if (event.selections) {
        this.selections = event.selections
      }

      if (event.hide !== undefined) {
        this.isVisible = !event.hide
      }

      if (event.none !== undefined) {
        this.isVisible = !event.none
        this.none = event.none
      }
    },
    handleMediaClick(event) {
      if (!event.renderPosition) {
        event.renderPosition = { x: event.event.clientX, y: event.event.clientY }
      }

      if (!event.radius) {
        event.radius = this.renderRadius
      }

      EventBus.$emit('pointSelectUpdate', event)

      this.$emit('input', {
        selection: this.selection,
        selections: this.selections,
        a: this.renderPosition.x,
        b: this.renderPosition.y,
        none: false,
      })
    },
  },
}
</script>

<style scoped lang="scss">
* {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.8;
  z-index: 999;
}
</style>
