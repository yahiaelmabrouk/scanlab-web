<template>
  <div
    class="timing-decision-container"
    ref="container"
    @mouseover="isHover = true"
    @mouseout="isHover = false"
    @mousewheel="onMousewheel"
    style="background-color: #000000; height: calc(40vh + 95px)"
  >
    <canvas ref="canvas" id="timingDecisionConfirmCanvas"></canvas>
    <div
      class="overlay-chart-wrapper"
      v-if="roiStatus != this.ROI_STATUS.NO_CONFIRM && roiStatus != this.ROI_STATUS.SHOW_ROI"
    >
      <!-- <img src="@/assets/img/timing-decision-example-chart.png" alt="" /> -->
      <TimingDecisionChartView />
    </div>
  </div>
</template>
<script>
import { fabric } from 'fabric'
import { mapActions, mapState } from 'vuex'
import { NUM_OF_BODY_MAP_IMAGES, ROI_STATUS, SCAN_STATUS } from '../constants'
import bodyMapPositions from '@/assets/jsons/bodyMapPosition.json'
import digitalBodyMapViewPositions from '@/assets/jsons/digitalBodyMapViewPosition.json'
import _ from 'lodash'
import TimingDecisionChartView from './TimingDecisionChartView.vue'
import EventBus from '@/lib/event-bus'

export default {
  name: 'TimingDecisionConfirmView',
  components: {
    TimingDecisionChartView,
  },
  data() {
    return {
      canvas: null,
      canvasRealWidth: null,
      canvasRealHeight: null,
      isHover: false,
      images: [],
      SCAN_STATUS: SCAN_STATUS,
      NUM_OF_BODY_MAP_IMAGES: NUM_OF_BODY_MAP_IMAGES,
      isPressingMouse: false,
      lastMovedPointer: null,
      scanLine: null,
      backgroundImage: null,
      bodyMapPositions,
      digitalBodyMapViewPositions,
      isDragging: false,
      isZooming: false,
      lastPosX: null,
      lastPosY: null,
      ROI_STATUS: ROI_STATUS,
    }
  },
  computed: {
    ...mapState('questionService', ['timingDecisionStep', 'scanStatus', 'roiStatus']),
    ...mapState('timingDecisionService', ['digitalLocalizerMinStep', 'digitalLocalizerMaxStep']),
    imageUrl() {
      return `/img/body-maps/bodyMap.origin.png`
    },
    isDisableWheel() {
      return this.scanStatus != this.SCAN_STATUS.NO_SCAN
    },
  },
  watch: {
    imageUrl: 'drawCanvasBackground',
    timingDecisionStep: 'drawScanLine',
    roiStatus: 'onRoiStatusChanged',
  },
  mounted() {
    this.onInitCanvas()
    this.drawCanvasBackground()
    this.drawScanLine()

    this.images = []

    window.addEventListener('resize', this.onWindowSizeChanged)
    this.$refs.container.addEventListener('contextmenu', this.onContextMenu)
    EventBus.$on('onConfirmROI', this.takeConfirmedScreenShot)
  },
  beforeDestroy() {
    EventBus.$off('onConfirmROI', this.takeConfirmedScreenShot)
    window.removeEventListener('resize', this.onWindowSizeChanged)
    this.$refs.container.removeEventListener('contextmenu', this.onContextMenu)
  },
  methods: {
    ...mapActions('questionService', [
      'adjustTimingDecisionStep',
      'setTimingDecisionStep',
      'setTimingDecisionConfirmScreenshot',
    ]),
    onRoiStatusChanged() {},
    takeConfirmedScreenShot() {
      if (this.canvas) {
        const imgData = this.$refs.canvas.toDataURL('image/png', 0.5)
        this.setTimingDecisionConfirmScreenshot(imgData)
      }
    },
    onWindowSizeChanged() {
      this.onInitCanvas()
      this.drawCanvasBackground()
      this.drawScanLine()
    },
    onInitCanvas() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      let c = this.$refs.canvas
      c.width = boundingRec.width
      c.height = boundingRec.height
      this.canvasRealWidth = boundingRec.width
      this.canvasRealHeight = boundingRec.height

      if (!this.canvas) {
        this.canvas = new fabric.Canvas('timingDecisionConfirmCanvas', {
          selection: false,
          fireRightClick: true,
          width: boundingRec.width,
          height: boundingRec.height,
        })
      }

      this.canvas.setDimensions({
        width: boundingRec.width,
        height: boundingRec.height,
      })

      this.canvas.on({
        'mouse:down': this.onMouseDown,
        'mouse:move': this.onMouseMove,
        'mouse:up': this.onMouseUp,
      })
    },
    onContextMenu(e) {
      e.preventDefault()
    },
    onMouseDown(e) {
      e.e.preventDefault()
      // No selection
      if (!e.target) {
        if (e.e.ctrlKey) {
          this.isDragging = true
        } else if (e.button != 3) {
          this.isPressingMouse = true
        } else {
          this.isZooming = true
        }

        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
      }
    },
    onMouseUp() {
      this.isPressingMouse = false
      this.canvas.setViewportTransform(this.canvas.viewportTransform)
      this.isDragging = false
      this.isZooming = false
    },
    onMouseMove(e) {
      if (this.isDragging) {
        const vpt = this.canvas.viewportTransform
        vpt[4] += e.e.clientX - this.lastPosX
        vpt[5] += e.e.clientY - this.lastPosY
        this.canvas.requestRenderAll()
        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
      } else if (this.isZooming) {
        let delta = e.e.clientY - this.lastPosY
        let zoom = this.canvas.getZoom()
        zoom *= 0.99 ** delta
        if (zoom > 20) zoom = 20
        if (zoom < 0.01) zoom = 0.01
        this.canvas.zoomToPoint({ x: this.canvasRealWidth / 2, y: this.canvasRealHeight / 2 }, zoom)

        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
      }

      if (this.isDisableWheel) {
        return
      }

      if (this.isPressingMouse && e.absolutePointer.y > this.backgroundImage.top) {
        const cursorOnImageY = (e.absolutePointer.y - this.backgroundImage.top) / this.backgroundImage.scaleY
        const stepInfo = this.bodyMapPositions.find((el) => el.y > cursorOnImageY)
        if (stepInfo) {
          this.setTimingDecisionStep(stepInfo.index)
        } else {
          this.setTimingDecisionStep(this.NUM_OF_BODY_MAP_IMAGES)
        }
      }
    },
    formatNumber(input) {
      const hundreds = parseInt(input / 100)
      const dozens = parseInt((input - hundreds * 100) / 10)
      const units = input - hundreds * 100 - dozens * 10

      return `${hundreds}${dozens}${units}`
    },
    onMousewheel(e) {
      e.preventDefault()
      if (this.isDisableWheel) {
        return
      }
      if (e.deltaY > 0) {
        this.adjustTimingDecisionStep(2)
      } else {
        this.adjustTimingDecisionStep(-2)
      }
    },
    drawScanLine() {
      if (!this.canvas) {
        return
      }

      if (!this.backgroundImage) {
        return
      }

      const leftCoord = this.canvasRealWidth / 2 - (this.backgroundImage.width * this.backgroundImage.scaleX) / 2
      const rightCoord = this.canvasRealWidth / 2 + (this.backgroundImage.width * this.backgroundImage.scaleX) / 2

      let scanLineTop = _.get(
        this.bodyMapPositions.find((el) => el.index == this.timingDecisionStep),
        ['y'],
        0
      )
      scanLineTop = scanLineTop * this.backgroundImage.scaleY + this.backgroundImage.top
      if (this.scanLine) {
        this.scanLine.top = scanLineTop
        this.canvas.requestRenderAll()
      } else {
        this.scanLine = new fabric.Line([leftCoord, scanLineTop, rightCoord, scanLineTop], {
          strokeWidth: 6,
          stroke: '#FBCD18',
          selectable: false,
          evented: false,
          globalCompositeOperation: 'source-atop',
        })

        this.canvas.add(this.scanLine)
      }
    },
    drawCanvasBackground() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      this.canvasRealWidth = boundingRec.width
      this.canvasRealHeight = boundingRec.height
      fabric.Image.fromURL(this.imageUrl, (img) => {
        if (this.backgroundImage) {
          this.canvas.remove(this.backgroundImage)
        }
        this.backgroundImage = img
        const stepMinInfo = this.digitalBodyMapViewPositions.find((el) => el.index >= this.digitalLocalizerMinStep)
        const stepMaxInfo = this.digitalBodyMapViewPositions.find((el) => el.index >= this.digitalLocalizerMaxStep)
        let imageScale = 1
        let imageTop = 0
        if (stepMinInfo && stepMaxInfo) {
          const height = stepMaxInfo.y - stepMinInfo.y
          const centerY = (stepMaxInfo.y + stepMinInfo.y) / 2
          imageScale = Math.min(this.canvasRealHeight / height, this.canvasRealWidth / img.width)
          imageTop = this.canvasRealHeight / 2 - centerY * imageScale
        }
        img
          .set({
            left: this.canvasRealWidth / 2 - (img.width * imageScale) / 2,
            top: imageTop,
          })
          .scale(imageScale)
        img.evented = false
        img.selectable = false
        this.canvas.add(img)
        this.canvas.moveTo(img, 0)

        this.drawScanLine()
      })
    },
  },
}
</script>
<style lang="scss" scoped>
.timing-decision-container {
  display: flex;
  justify-content: center;
  align-items: center;
  border: solid 2px #ffffff;
  overflow: hidden;
  position: relative;

  .overlay-chart-wrapper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: #000000;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}
</style>
