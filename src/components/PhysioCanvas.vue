<template>
  <div>
    <div class="ecg-view-type-container">
      <v-btn
        :key="item.value"
        v-for="item in ECG_VIEW_TYPE_OPTIONS"
        :value="item.value"
        class="btn-toggle-ecg-view-type"
        :class="{ active: selectedViewType == item.value }"
        @click="selectedViewType = item.value"
      >
        <span>{{ item.text }}</span>
      </v-btn>
    </div>
    <div class="physio-canvas-container" ref="container" style="background-color: #000000; height: 400px">
      <canvas ref="canvas" id="physioCanvas"></canvas>
      <div class="loading-overlay" :class="{ show: isLoading }">
        <v-progress-circular indeterminate></v-progress-circular>
      </div>
    </div>
  </div>
</template>
<script>
import { fabric } from 'fabric'
import _ from 'lodash'
import { BAD_BEATS, ECG_DISTANCE_RATE, ECGChartConfig, ECG_VIEW_TYPE_OPTIONS, ECG_VIEW_TYPE } from '../constants'
import { getWaveDurationByProps } from '../util/utils'

// const imageFilter = new fabric.Image.filters.Brightness({
//   brightness: -0.67,
// })

export default {
  name: 'PhysioCanvas',
  props: {
    isPreview: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      default: 0,
    },
    waveNo: {
      type: Number,
      default: 0,
    },
    continuousecgData: {
      type: Object,
      default: () => ({
        waveWidth: 0,
        randomWaveBadbeatsArray: [],
        distanceFromSToT: 0,
        distanceFromQToR: 0,
        distanceFromRToS: 0,
        distanceFromPToQ: 0,
        centerRToCenterT: 0,
        startPToCenterR: 0,
        centerTToEnd: 0,
      }),
    },
    cardiacCycleDeviation: {
      type: Number,
      default: 0,
    },
    cardiacCycleDuration: {
      type: Number,
      default: 0,
    },
    badBeats: {
      type: Number,
      default: BAD_BEATS.NONE,
    },
    badBeatsDuration: {
      type: Object,
      default: () => ({
        isRange: false,
        min: 400,
        max: 400,
      }),
    },
    waveDuration: {
      type: Number,
      default: 1000,
    },
    nextWaveDuration: {
      type: Number,
      default: 1000,
    },
  },
  data() {
    return {
      canvas: null,
      preloadBgImg: null,
      preloadHeartImages: [],
      canvasRealWidth: 1,
      canvasRealHeight: 1,
      bgImg: null,
      startDuration: 0,

      squeezeProcess: {
        start: 1,
        end: 34,
      },
      relaxProcess: {
        start: 35,
        end: 100,
      },

      requestAnimationId: null,
      lastUrl: '',
      heartOuterImage: null,
      heartInnerImage: null,

      offsetTop: 0,
      offsetLeft: 0,

      isDragging: false,
      isZooming: false,
      lastPosX: null,
      lastPosY: null,

      isLoading: false,
      timeoutPreloadImages: null,
      ECG_VIEW_TYPE_OPTIONS,
      selectedViewType: ECG_VIEW_TYPE.VLA,
    }
  },
  computed: {
    currentDuration() {
      return this.duration - this.startDuration
    },
    imageNo() {
      if (this.waveNo == 0) {
        const relaxTime = this.getDistanceFromTwoWave(this.waveDuration) + this.continuousecgData.startPToCenterR
        if (this.currentDuration < relaxTime) {
          return this.squeezeProcess.start
        }
      } else {
        const relaxTimeStart = this.getDistanceFromTwoWave(this.waveDuration) / 2
        const relaxTime = this.getDistanceFromTwoWave(this.waveDuration) / 2 + this.continuousecgData.startPToCenterR
        if (this.currentDuration >= relaxTimeStart && this.currentDuration < relaxTimeStart + relaxTime) {
          return this.squeezeProcess.start
        }
      }
      const fromStartToCenterR = this.getDistanceFromTwoWave(this.waveDuration) + this.continuousecgData.startPToCenterR
      const centerRToCenterT =
        (ECGChartConfig.RTriangle.width * ECG_DISTANCE_RATE) / 2 +
        ECGChartConfig.STriangle.width * ECG_DISTANCE_RATE +
        this.getDistanceFromSToT(this.waveDuration) +
        (ECGChartConfig.TTriangle.width * ECG_DISTANCE_RATE) / 2
      const fromStartToCenterT =
        this.getDistanceFromTwoWave(this.waveDuration) + this.continuousecgData.startPToCenterR + centerRToCenterT

      if (this.currentDuration >= fromStartToCenterR && this.currentDuration < fromStartToCenterT) {
        const currentStep = _.round(
          ((this.currentDuration - fromStartToCenterR) / centerRToCenterT) *
            (this.squeezeProcess.end - this.squeezeProcess.start)
        )
        return Math.min(this.squeezeProcess.start + currentStep, this.squeezeProcess.end)
      } else {
        const halfRelaxOfNextWave = this.getDistanceFromTwoWave(this.nextWaveDuration) / 2
        const totalTimeToRelax = halfRelaxOfNextWave + this.continuousecgData.centerTToEnd
        if (this.currentDuration >= fromStartToCenterT) {
          const currentStep = _.round(
            ((this.currentDuration - fromStartToCenterT) / totalTimeToRelax) *
              (this.relaxProcess.end - this.relaxProcess.start)
          )
          return Math.min(this.relaxProcess.start + currentStep, this.relaxProcess.end)
        } else {
          const currentStep = _.round(
            ((this.currentDuration + this.continuousecgData.centerTToEnd) / totalTimeToRelax) *
              (this.relaxProcess.end - this.relaxProcess.start)
          )
          return Math.min(this.relaxProcess.start + currentStep, this.relaxProcess.end)
        }
      }
    },
    ECGViewValue() {
      switch (this.selectedViewType) {
        case ECG_VIEW_TYPE.VLA:
          return 2
        case ECG_VIEW_TYPE.SAX:
          return 1
        case ECG_VIEW_TYPE.HLA:
          return 4
        case ECG_VIEW_TYPE['3CH']:
          return 3
        default:
          return 2
      }
    },
    heartInnerFolder() {
      switch (this.ECGViewValue) {
        case 1:
          return 'shortAxisHeartbeatFlipped'
        case 2:
          return 'dualChamberHeartbeat'
        case 3:
          return 'triChamberHeartbeat'
        case 4:
          return 'quadChamberHeartbeatFlipped'
        default:
          return 'quadChamberHeartbeatFlipped'
      }
    },
    heartInnerFileNamePrefix() {
      switch (this.ECGViewValue) {
        case 1:
          return 'ShortAxisHeartbeatFlipped'
        case 2:
          return 'DualChamberHeartbeat'
        case 3:
          return 'TriChamberHeartbeat'
        case 4:
          return 'QuadChamberHeartbeatFlipped'
        default:
          return 'QuadChamberHeartbeatFlipped'
      }
    },
    backgroundUrl() {
      switch (this.ECGViewValue) {
        case 1:
          return '/img/heartbeatSlices/ShortAxisBGFlipped.00000.png'
        case 2:
          return '/img/heartbeatSlices/dualChamberBG.00000.png'
        case 3:
          return '/img/heartbeatSlices/triChamberBG.00000.png'
        case 4:
          return '/img/heartbeatSlices/quadChamberBGFlipped.00000.png'
        default:
          return '/img/heartbeatSlices/quadChamberBGFlipped.00000.png'
      }
    },
    heartInnerImageUrl() {
      return `/img/heartbeatSlices/${this.heartInnerFolder}/${this.heartInnerFileNamePrefix}.${this.formatNumber(
        this.imageNo
      )}.png`
    },
    heartOuterImageUrl() {
      return `/img/ecg/heart_outer_90fps/slice_${this.formatNumber(this.imageNo)}.png`
    },
  },
  watch: {
    waveNo() {
      this.startDuration = this.duration
    },
    isPreview() {
      if (!this.isPreview) {
        this.destroyAnimationFrame()
      } else {
        this.startAnimation()
      }
    },
    heartInnerFolder() {
      this.onECGTypeChange()
    },
  },
  mounted() {
    this.onInitCanvas()
    this.onPreloadImages()
    this.drawBackgroundLayer()
    this.startAnimation(false)
    this.$refs.container.addEventListener('contextmenu', this.onContextMenu)
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    this.$refs.container.removeEventListener('contextmenu', this.onContextMenu)
    window.removeEventListener('resize', this.onResize)
    if (this.timeoutPreloadImages) {
      clearTimeout(this.timeoutPreloadImages)
    }
  },
  methods: {
    async onECGTypeChange() {
      this.onPreloadImages()

      if (this.canvas) {
        this.canvas.forEachObject((obj) => {
          if (obj.ctype == 'heart') {
            obj.visible = false
          }
        })
      }

      this.drawBackgroundLayer()
      await this.drawHeartOuterImage()
      await this.drawHeartInnerImage()
    },
    async onResize() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      if (this.canvas) {
        this.canvas.setDimensions({
          width: boundingRec.width,
          height: boundingRec.height,
        })
        this.drawBackgroundLayer()
        await this.drawHeartOuterImage()
        await this.drawHeartInnerImage()
      }

      this.canvasRealWidth = boundingRec.width
      this.canvasRealHeight = boundingRec.height

      let c = this.$refs.canvas
      c.width = boundingRec.width
      c.height = boundingRec.height
    },
    getDistanceFromTwoWave(duration) {
      if (duration != this.cardiacCycleDuration) {
        const defaultDistanceFromSToT = this.continuousecgData.distanceFromSToT
        const defaultDistanceFromTwoWave = Math.max(
          _.round(_.round(this.cardiacCycleDuration) - this.continuousecgData.waveWidth),
          10
        )
        const changeValue = duration - this.cardiacCycleDuration

        const totalDistance = defaultDistanceFromSToT + defaultDistanceFromTwoWave
        const newDistance = totalDistance + changeValue
        const incresePercent = (newDistance - totalDistance) / totalDistance

        return Math.max(_.round(defaultDistanceFromTwoWave + _.round(defaultDistanceFromTwoWave * incresePercent)), 10)
      } else {
        return Math.max(_.round(_.round(duration) - this.continuousecgData.waveWidth), 10)
      }
    },
    getDistanceFromSToT(duration) {
      if (duration != this.cardiacCycleDuration) {
        const defaultDistanceFromSToT = this.continuousecgData.distanceFromSToT
        const defaultDistanceFromTwoWave = Math.max(
          _.round(_.round(this.cardiacCycleDuration) - this.continuousecgData.waveWidth),
          10
        )
        const changeValue = duration - this.cardiacCycleDuration

        const totalDistance = defaultDistanceFromSToT + defaultDistanceFromTwoWave
        const newDistance = totalDistance + changeValue
        const incresePercent = (newDistance - totalDistance) / totalDistance

        return Math.max(_.round(defaultDistanceFromSToT + _.round(defaultDistanceFromSToT * incresePercent)), 0)
      } else {
        return this.continuousecgData.distanceFromSToT
      }
    },
    onContextMenu(e) {
      e.preventDefault()
    },
    onInitCanvas() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      let c = this.$refs.canvas
      c.width = boundingRec.width
      c.height = boundingRec.height

      if (!this.canvas) {
        this.canvas = new fabric.Canvas('physioCanvas', {
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
    onMouseDown(e) {
      e.e.preventDefault()

      // No selection
      if (!e.target) {
        if (e.button != 3) {
          this.isDragging = true
        } else {
          this.isZooming = true
        }
        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
      }
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
    },
    onMouseUp() {
      this.canvas.setViewportTransform(this.canvas.viewportTransform)
      this.isDragging = false
      this.isZooming = false
    },
    onPreloadImages() {
      if (this.timeoutPreloadImages) {
        clearTimeout(this.timeoutPreloadImages)
      }
      const handle = () => {
        const img = new Image()
        img.src = this.backgroundUrl
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          this.preloadBgImg = img
        }

        this.isLoading = true
        const heartImagePaths = Array.from({ length: 100 }, (_, i) => {
          return `/img/heartbeatSlices/${this.heartInnerFolder}/${this.heartInnerFileNamePrefix}.${this.formatNumber(
            i + 1
          )}.png`
        })
        Promise.all(heartImagePaths.map((path) => this.onDownloadHeartImages(path)))
          .then(() => {
            this.isLoading = false
            this.canvas.forEachObject((obj) => {
              if (obj.ctype == 'heart') {
                obj.visible = false
              }
            })
            this.drawBackgroundLayer()
            this.drawHeartInnerImage()
          })
          .catch((err) => {
            console.error('Error preloading heart images:', err)
          })
      }

      this.timeoutPreloadImages = setTimeout(() => {
        handle()
      }, 200)
    },
    formatNumber(input) {
      const thousands = parseInt(input / 1000)
      const hundreds = parseInt((input - thousands * 1000) / 100)
      const dozens = parseInt((input - thousands * 1000 - hundreds * 100) / 10)
      const units = input - thousands * 1000 - hundreds * 100 - dozens * 10

      return `0${thousands}${hundreds}${dozens}${units}`
    },
    onDownloadHeartImages(path) {
      return new Promise((resolve) => {
        const img = new Image()
        img.src = path
        img.crossOrigin = 'anonymous'
        img.onerror = () => {
          console.error('Error loading image:', path)
          resolve()
        }

        if (_.find(this.preloadHeartImages, (el) => el.path == path)) {
          resolve()
          return
        }

        if (img.complete) {
          if (!_.find(this.preloadHeartImages, (el) => el.path == path)) {
            const fabricImg = new fabric.Image(img)
            fabricImg.visible = false
            fabricImg.ctype = 'heart'

            this.canvas.add(fabricImg)
            this.preloadHeartImages.push({
              path,
              img,
              fabricImg: fabricImg,
            })
            resolve()
          }
        } else {
          img.onload = () => {
            if (!_.find(this.preloadHeartImages, (el) => el.path == path)) {
              const fabricImg = new fabric.Image(img)
              fabricImg.visible = false
              fabricImg.ctype = 'heart'

              this.canvas.add(fabricImg)
              this.preloadHeartImages.push({
                path,
                img,
                fabricImg: fabricImg,
              })
              resolve()
            }
          }
        }
      })
    },
    drawBackgroundLayer() {
      return new Promise((resolve) => {
        try {
          const boundingRec = this.$refs.container.getBoundingClientRect()
          this.canvasRealWidth = boundingRec.width
          this.canvasRealHeight = boundingRec.height
          const imgUrl = this.backgroundUrl

          fabric.Image.fromURL(imgUrl, (img) => {
            if (this.bgImg) {
              this.canvas.remove(this.bgImg)
            }
            this.bgImg = img
            const scale = this.canvasRealWidth / img.width
            const imageScale = scale

            img.crossOrigin = 'anonymous'
            img
              .set({
                left: this.canvasRealWidth / 2 - (img.width * imageScale) / 2 + this.offsetLeft,
                top: this.canvasRealHeight / 2 - (img.height * imageScale) / 2 + this.offsetTop,
              })
              .scale(imageScale)
            img.evented = false
            img.selectable = false

            this.canvas.add(this.bgImg)
            this.canvas.moveTo(img, 0)

            resolve()
          })
        } catch (err) {
          resolve()
        }
      })
    },
    getWaveDuration(waveNo) {
      try {
        return getWaveDurationByProps(
          waveNo,
          this.continuousecgData.waveWidth,
          this.badBeats,
          this.cardiacCycleDuration,
          this.cardiacCycleDeviation,
          this.continuousecgData.randomWaveBadbeatsArray,
          this.badBeatsDuration
        )
      } catch (err) {
        return 500
      }
    },
    destroyAnimationFrame() {
      if (this.requestAnimationId) {
        const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
        cancelAnimationFrame(this.requestAnimationId)
        this.requestAnimationId = null
      }
    },
    async startAnimation(isHandleAnimation = true) {
      if (this.lastUrl == this.heartInnerImageUrl) {
        if (isHandleAnimation) {
          this.requestAnimationId = window.requestAnimationFrame(this.startAnimation)
        }
        return
      }

      try {
        this.lastUrl = this.heartInnerImageUrl

        this.canvas.forEachObject((obj) => {
          if (obj.ctype == 'heart') {
            obj.visible = false
          }
        })

        await this.drawHeartOuterImage()
        await this.drawHeartInnerImage()

        this.canvas.renderAll()

        if (isHandleAnimation) {
          this.requestAnimationId = window.requestAnimationFrame(this.startAnimation)
        }
      } catch (err) {
        if (isHandleAnimation) {
          this.requestAnimationId = window.requestAnimationFrame(this.startAnimation)
        }
        // No action
      }
    },
    drawHeartOuterImage() {
      return new Promise((resolve) => {
        resolve()
      })
      // return new Promise((resolve) => {
      //   try {
      //     let preloadImage = this.preloadHeartImages.find((el) => el.path == this.heartOuterImageUrl)
      //     this.preloadHeartImages.forEach((el) => {
      //       el.fabricImg.visible = false
      //     })
      //     if (this.heartOuterImage) {
      //       this.canvas.remove(this.heartOuterImage)
      //     }
      //     if (preloadImage && preloadImage.img) {
      //       const img = preloadImage.fabricImg
      //       img.filters = []
      //       img.filters.push(imageFilter)
      //       img.applyFilters()
      //       const scale = (this.canvasRealWidth / img.width) * 2.5
      //       img.crossOrigin = 'anonymous'
      //       img
      //         .set({
      //           left: this.canvasRealWidth / 2 - (img.width * scale) / 2 + this.offsetLeft,
      //           top: this.canvasRealHeight / 2 - (img.height * scale) / 2 + this.offsetTop,
      //         })
      //         .scale(scale)
      //       img.evented = false
      //       img.selectable = false
      //       img.visible = true
      //       this.canvas.moveTo(img, 1)
      //       resolve()
      //     } else {
      //       fabric.Image.fromURL(this.heartOuterImageUrl, (img) => {
      //         img.filters.push(imageFilter)
      //         img.applyFilters()
      //         this.heartOuterImage = img
      //         const scale = (this.canvasRealWidth / img.width) * 2.5
      //         img.crossOrigin = 'anonymous'
      //         img
      //           .set({
      //             left: this.canvasRealWidth / 2 - (img.width * scale) / 2 + this.offsetLeft,
      //             top: this.canvasRealHeight / 2 - (img.height * scale) / 2 + this.offsetTop,
      //           })
      //           .scale(scale)
      //         img.evented = false
      //         img.selectable = false
      //         img.ctype = 'heart'
      //         this.canvas.add(this.heartOuterImage)
      //         this.canvas.moveTo(img, 1)
      //         resolve()
      //       })
      //     }
      //   } catch (err) {
      //     // No action
      //     resolve()
      //   }
      // })
    },
    drawHeartInnerImage() {
      return new Promise((resolve) => {
        try {
          let preloadImage = this.preloadHeartImages.find((el) => el.path == this.heartInnerImageUrl)
          if (this.heartInnerImage) {
            this.canvas.remove(this.heartInnerImage)
          }
          if (preloadImage && preloadImage.img) {
            const img = preloadImage.fabricImg
            const scale = this.canvasRealWidth / img.width
            img.crossOrigin = 'anonymous'
            img
              .set({
                left: this.canvasRealWidth / 2 - (img.width * scale) / 2 + this.offsetLeft,
                top: this.canvasRealHeight / 2 - (img.height * scale) / 2 + this.offsetTop,
              })
              .scale(scale)
            img.evented = false
            img.selectable = false
            img.visible = true
            img.ctype = 'heart'

            // this.canvas.add(img)
            this.canvas.moveTo(img, 2)
            resolve()
          } else {
            resolve()
          }
        } catch (err) {
          // No action
          resolve()
        }
      })
    },
  },
}
</script>
<style lang="scss" scoped>
.ecg-view-type-container {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
}
.btn-toggle-ecg-view-type {
  padding: 10px 20px;
  border-radius: 0;
  box-shadow: none;
  border: 1px solid $border-gray;
  cursor: pointer;
  &.active {
    background-color: $primary;
    color: white;
  }
}
.physio-canvas-container {
  position: relative;
  .loading-overlay {
    display: none;
  }
  .loading-overlay.show {
    position: absolute;
    z-index: 2;
    inset: 0;
    width: 100%;
    height: 100%;
    background: rgba($color: #ffffff, $alpha: 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
