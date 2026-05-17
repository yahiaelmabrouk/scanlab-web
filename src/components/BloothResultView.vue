<template>
  <div class="blooth-tube-view-container" ref="container" style="background-color: #000000; height: 400px">
    <canvas ref="canvas" id="bloothTubeViewCanvas"></canvas>
    <div class="loading-overlay" :class="{ show: preloadPercent != 100 }">
      <v-progress-circular indeterminate></v-progress-circular>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import { fabric } from 'fabric'
import _ from 'lodash'
import { FABRIC_IMAGES_CACHE } from '../util/loaderManager'
export default {
  name: 'BloothResultView',
  props: {},
  data() {
    return {
      canvasContext2d: null,
      canvas: null,
      isDragging: false,
      isZooming: false,
      lastPosX: 0,
      lastPosY: 0,
      canvasRealWidth: 0,
      canvasRealHeight: 0,
      preloadBeathingImages: [],
      timeoutUpdateImage: null,
      vascularLayerImage: null,
      heartLayerImage: null,
      heartDyeLayerImage: null,
      backgroundImage: null,
      breathingAnimationInterval: null,
      baseLayerImage: null,
    }
  },
  computed: {
    ...mapState('timingDecisionService', [
      'bloothTubeStep',
      'preloadVascularImages',
      'preloadHeartLayerImages',
      'preloadLiverLayerImages',
      'brightnessMappingData',
    ]),
    ...mapGetters('timingDecisionService', ['preloadPercent', 'multipleLayerImageGroupedByFolder']),
    timingDecisionContrastAlbum() {
      return '143'
    },
    trackingDuration() {
      return 20
    },
    presentationImageNo() {
      return this.bloothTubeStep
    },
    multipleLayerBrightnessMappingData() {
      if (!Array.isArray(this.brightnessMappingData) || this.brightnessMappingData.length === 0) {
        return {}
      }
      const first = this.brightnessMappingData[0]
      return first ? first.data || {} : {}
    },
  },
  watch: {
    bloothTubeStep: 'drawCanvasBackground',
    preloadPercent(val) {
      if (val === 100) {
        this.drawCanvasBackground()
      }
    },
  },
  mounted() {
    this.onInitCanvas()
    this.onPreloadBeathingImages()

    const brightnessPath = this.getBrightnessMappingPath()
    if (brightnessPath) {
      this.loadBrightnessMappingData(brightnessPath)
    }
    this.loadSliceVascularData({
      zipPath: this.getSliceVascularPath(),
      albumNo: this.timingDecisionContrastAlbum,
    })
    this.loadSliceHeartLayerData({
      zipPath: this.getSliceHeartLayerPath(),
      albumNo: this.timingDecisionContrastAlbum,
    })
    this.loadSliceLiverLayerData({
      zipPath: this.getSliceLiverLayerPath(),
      albumNo: this.timingDecisionContrastAlbum,
    })
    const multipleLayerFolder = this.getMultipleLayerFolderZipPath()
    this.loadMultipleLayerSlicesZipFile(multipleLayerFolder)

    this.drawBreathingAnimation()
    this.drawCanvasBackground()
  },
  beforeDestroy() {
    if (this.breathingAnimationInterval) {
      clearInterval(this.breathingAnimationInterval)
    }
    if (this.timeoutUpdateImage) {
      clearTimeout(this.timeoutUpdateImage)
    }
  },
  methods: {
    ...mapActions('timingDecisionService', [
      'loadBrightnessMappingData',
      'loadSliceVascularData',
      'loadSliceHeartLayerData',
      'loadSliceLiverLayerData',
      'loadMultipleLayerSlicesZipFile',
    ]),
    drawBreathingAnimation() {
      const handle = () => {
        let currentFrame = 0
        const totalFrames = 4
        const frameRate = 3000 / 1 / totalFrames // Frame duration in milliseconds

        if (this.breathingAnimationInterval) {
          clearInterval(this.breathingAnimationInterval) // Clear any existing interval
        }

        const renderImage = (frame) => {
          const imgUrl = `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/baseLayer/baseLayer.0000${frame}.jpg`
          const preloadImage = this.preloadBeathingImages.find((el) => el.path == imgUrl)
          if (preloadImage && preloadImage.img) {
            const img = new fabric.Image(preloadImage.img)
            if (this.baseLayerImage) {
              this.canvas.remove(this.baseLayerImage)
            }
            this.baseLayerImage = img

            const boundingRec = this.$refs.container.getBoundingClientRect()
            this.canvasRealWidth = boundingRec.width
            this.canvasRealHeight = boundingRec.height

            const scale = this.getFitScale(img.width, img.height)
            img.crossOrigin = 'anonymous'
            img
              .set({
                left: this.canvasRealWidth / 2 - (img.width * scale) / 2,
                top: this.canvasRealHeight / 2 - (img.height * scale) / 2,
              })
              .scale(scale)
            img.evented = false
            img.selectable = false

            this.canvas.add(this.baseLayerImage)
            this.canvas.moveTo(img, 0)
          }
        }

        renderImage(currentFrame + 1)
        currentFrame = (currentFrame + 1) % totalFrames
        this.breathingAnimationInterval = setInterval(() => {
          renderImage(currentFrame + 1)
          // Update the frame number
          currentFrame = (currentFrame + 1) % totalFrames // Loop back to 1 after the last frame
        }, frameRate)
      }

      handle()
    },
    formatNumber(input) {
      const thousands = parseInt(input / 1000)
      const hundreds = parseInt((input - thousands * 1000) / 100)
      const dozens = parseInt((input - thousands * 1000 - hundreds * 100) / 10)
      const units = input - thousands * 1000 - hundreds * 100 - dozens * 10

      return `${thousands}${hundreds}${dozens}${units}`
    },
    onPreloadBeathingImages() {
      for (let i = 0; i < 4; i++) {
        const path = `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/baseLayer/baseLayer.0000${
          i + 1
        }.jpg`
        const img = new Image()
        img.src = path
        img.crossOrigin = 'anonymous'

        if (img.complete) {
          this.preloadBeathingImages.push({
            path,
            img,
          })
        } else {
          img.onload = () => {
            this.preloadBeathingImages.push({
              path,
              img,
            })
          }
        }
      }
    },
    onInitCanvas() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      let c = this.$refs.canvas
      c.width = boundingRec.width
      c.height = boundingRec.height

      this.canvasContext2d = this.$refs.canvas.getContext('2d')

      if (!this.canvas) {
        this.canvas = new fabric.Canvas('bloothTubeViewCanvas', {
          width: boundingRec.width,
          height: boundingRec.height,
          fireRightClick: true,
        })
      }

      this.canvas.setDimensions({
        width: boundingRec.width,
        height: boundingRec.height,
      })

      this.canvasRealWidth = boundingRec.width
      this.canvasRealHeight = boundingRec.height

      this.canvas.on({
        'mouse:down': this.onMouseDown,
        'mouse:move': this.onMouseMove,
        'object:modified': this.onModified,
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
    onModified() {},
    onMouseUp() {
      this.canvas.setViewportTransform(this.canvas.viewportTransform)
      this.isDragging = false
      this.isZooming = false
    },
    getFitScale(imgWidth, imgHeight) {
      const scaleX = this.canvasRealWidth / imgWidth
      const scaleY = this.canvasRealHeight / imgHeight
      return Math.min(scaleX, scaleY)
    },
    getCurrentBreathingPhaseIndex() {
      const BREATHING_PHASE_COUNT = 4
      return this.presentationImageNo % BREATHING_PHASE_COUNT
    },
    getBrightnessMappingPath() {
      const availableStrokeVolumes = [40, 70, 100]
      const nearestStrokeVolume = _.minBy(availableStrokeVolumes, (sv) => Math.abs(sv - 70))

      const mappingConfigs = [
        { duration: 2, volume: 10 },
        { duration: 3, volume: 15 },
        { duration: 4, volume: 20 },
        { duration: 5, volume: 25 },
        { duration: 6, volume: 30 },
        { duration: 7, volume: 35 },
        { duration: 8, volume: 40 },
        { duration: 9, volume: 45 },
        { duration: 10, volume: 50 },
        { duration: 12, volume: 60 },
        { duration: 15, volume: 75 },
        { duration: 17, volume: 85 },
        { duration: 19, volume: 95 },
        { duration: 21, volume: 105 },
        { duration: 23, volume: 115 },
        { duration: 24, volume: 120 },
        { duration: 30, volume: 150 },
        { duration: 33, volume: 165 },
        { duration: 36, volume: 180 },
        { duration: 40, volume: 200 },
      ]

      const durationSec = this.trackingDuration
      const nearestConfig = _.minBy(mappingConfigs, (item) => Math.abs(item.duration - durationSec))
      if (!nearestConfig) {
        return null
      }

      const { duration, volume } = nearestConfig
      return `/img/timing-decision-album-multiple-layer/contrastMappings/sv${nearestStrokeVolume}ml_${duration}s_${volume}ml_volume.zip`
    },
    getSliceVascularPath() {
      return `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/vascular.zip`
    },
    getSliceHeartLayerPath() {
      return `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/heart_BG.zip`
    },
    getSliceLiverLayerPath() {
      return `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/liver.zip`
    },
    getMultipleLayerFolderZipPath() {
      return {
        folderPath: `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}`,
        zipPath: `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/heart.zip`,
      }
    },
    drawCanvasBackground() {
      const drawProcess = async () => {
        await this.drawBaseLayerImage()
        await this.drawVascularLayerImage()
        await this.drawLiverLayerImage()
        await this.drawHeartLayerImage()
        this.drawMultipleLayerImages()
      }

      if (this.timeoutUpdateImage) {
        clearTimeout(this.timeoutUpdateImage)
      }

      this.timeoutUpdateImage = setTimeout(async () => {
        try {
          await drawProcess()
        } catch (error) {
          console.warn('Failed to draw timing decision background:', error)
        }
      }, 100)
    },
    async drawBaseLayerImage() {
      return new Promise((resolve) => {
        try {
          const boundingRec = this.$refs.container.getBoundingClientRect()
          this.canvasRealWidth = boundingRec.width
          this.canvasRealHeight = boundingRec.height

          const breathingImageNo = this.getCurrentBreathingPhaseIndex() + 1
          const imgUrl = `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/baseLayer/baseLayer.0000${breathingImageNo}.jpg`

          fabric.Image.fromURL(imgUrl, (img) => {
            if (this.baseLayerImage) {
              this.canvas.remove(this.baseLayerImage)
            }
            this.baseLayerImage = img

            const scale = this.getFitScale(img.width, img.height)
            img.crossOrigin = 'anonymous'
            img
              .set({
                left: this.canvasRealWidth / 2 - (img.width * scale) / 2,
                top: this.canvasRealHeight / 2 - (img.height * scale) / 2,
              })
              .scale(scale)
            img.evented = false
            img.selectable = false

            this.canvas.add(this.baseLayerImage)
            this.canvas.moveTo(img, 0)

            resolve()
          })
        } catch (err) {
          resolve()
        }
      })
    },
    drawMultipleLayerImages() {
      const imageNo = this.presentationImageNo
      const layers = Object.entries(this.multipleLayerImageGroupedByFolder)
      const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()

      for (const [folderName, images] of layers) {
        const brightnessKey = (folderName || '').split('/').pop()

        let mappedBrightness =
          this.multipleLayerBrightnessMappingData[brightnessKey] ||
          this.multipleLayerBrightnessMappingData[`${brightnessKey}.png`]

        let brightness = 0
        if (mappedBrightness && mappedBrightness.length) {
          brightness = mappedBrightness[imageNo % mappedBrightness.length]
        }

        let maximumDyeConcentration = _.max(mappedBrightness || [])
        maximumDyeConcentration = Math.max(0.0001, maximumDyeConcentration || 0.0001)
        let opacity = mappedBrightness ? brightness / maximumDyeConcentration : 1
        opacity = Math.min(Math.max(opacity, 0), 1)

        let candidateImages = images
        const hasBreathingPhase = images.some((img) => typeof img.breathingPhase === 'number')
        if (hasBreathingPhase) {
          const phaseImages = images.filter((img) => (img.breathingPhase || 0) === breathingPhaseIndex)
          if (phaseImages.length > 0) {
            candidateImages = phaseImages
          }
        }

        const image = candidateImages[imageNo % candidateImages.length]
        if (!image) continue

        const canvasObjects = this.canvas.getObjects()
        const existingImage = canvasObjects.find((obj) => obj.layerImage && obj.fileName === image.fileName)
        const cacheImage = FABRIC_IMAGES_CACHE.find((el) => el.fileName == image.fileName && el.path == image.path)

        if (existingImage) {
          existingImage.set({ opacity })
          continue
        }

        const existingFolderImage = canvasObjects.find((obj) => obj.layerImage && obj.folderName === folderName)
        if (existingFolderImage) {
          this.canvas.remove(existingFolderImage)
        }

        if (cacheImage && cacheImage.img) {
          const scale = this.getFitScale(cacheImage.img.width, cacheImage.img.height)
          cacheImage.img.crossOrigin = 'anonymous'
          cacheImage.img
            .set({
              left: this.canvasRealWidth / 2 - (cacheImage.img.width * scale) / 2,
              top: this.canvasRealHeight / 2 - (cacheImage.img.height * scale) / 2,
            })
            .scale(scale)
          cacheImage.img.set({ opacity })
          cacheImage.img.evented = false
          cacheImage.img.selectable = false
          cacheImage.img.fileName = image.fileName
          cacheImage.img.layerImage = true
          cacheImage.img.folderName = folderName

          this.canvas.add(cacheImage.img)
        }
      }

      this.canvas.renderAll()
    },
    async drawHeartLayerImage() {
      return new Promise((resolve) => {
        try {
          const boundingRec = this.$refs.container.getBoundingClientRect()
          this.canvasRealWidth = boundingRec.width
          this.canvasRealHeight = boundingRec.height

          const allImages = (this.preloadHeartLayerImages || []).filter(
            (el) => String(el.albumNo) === String(this.timingDecisionContrastAlbum)
          )

          const existingHeartLayerImage = this.canvas.getObjects().find((obj) => obj.heartLayerImage)

          if (!allImages.length) {
            if (existingHeartLayerImage) {
              this.canvas.remove(existingHeartLayerImage)
            }
            resolve()
            return
          }

          const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()
          let imagesForPhase = allImages
          const hasBreathingPhase = allImages.some((img) => typeof img.breathingPhase === 'number')
          if (hasBreathingPhase) {
            const phaseImages = allImages.filter((img) => (img.breathingPhase || 0) === breathingPhaseIndex)
            if (phaseImages.length > 0) {
              imagesForPhase = phaseImages
            }
          }

          const image = imagesForPhase[this.presentationImageNo % imagesForPhase.length]
          if (!image) {
            resolve()
            return
          }

          const cacheImage = FABRIC_IMAGES_CACHE.find((el) => el.fileName == image.fileName && el.path == image.path)

          if (!cacheImage || !cacheImage.img) {
            resolve()
            return
          }

          if (existingHeartLayerImage) {
            this.canvas.remove(existingHeartLayerImage)
          }

          const scale = this.getFitScale(1024, 778)
          const scaleX = (1024 / cacheImage.img.width) * scale
          const scaleY = (778 / cacheImage.img.height) * scale

          cacheImage.img.crossOrigin = 'anonymous'
          cacheImage.img.set({
            left: this.canvasRealWidth / 2 - (cacheImage.img.width * scaleX) / 2,
            top: this.canvasRealHeight / 2 - (cacheImage.img.height * scaleY) / 2,
          })
          cacheImage.img.scaleX = scaleX
          cacheImage.img.scaleY = scaleY
          cacheImage.img.evented = false
          cacheImage.img.selectable = false
          cacheImage.img.fileName = image.fileName
          cacheImage.img.heartLayerImage = true

          this.canvas.add(cacheImage.img)
          this.canvas.moveTo(cacheImage.img, 2)
          resolve()
        } catch (err) {
          resolve()
        }
      })
    },
    async drawLiverLayerImage() {
      const allImages = (this.preloadLiverLayerImages || []).filter(
        (el) => String(el.albumNo) === String(this.timingDecisionContrastAlbum)
      )

      const existingLiverLayerImage = this.canvas.getObjects().find((obj) => obj.liverLayerImage)

      if (!allImages.length) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.canvas.renderAll()
        }
        return
      }

      const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()
      let imagesForPhase = allImages
      const hasBreathingPhase = allImages.some((img) => typeof img.breathingPhase === 'number')
      if (hasBreathingPhase) {
        const phaseImages = allImages.filter((img) => (img.breathingPhase || 0) === breathingPhaseIndex)
        if (phaseImages.length > 0) {
          imagesForPhase = phaseImages
        }
      }

      const image = imagesForPhase[this.presentationImageNo % imagesForPhase.length]
      if (!image) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.canvas.renderAll()
        }
        return
      }

      const brightnessKey = (image.fileName || '').replace(/\\.png$/i, '')
      let mappedBrightness =
        this.multipleLayerBrightnessMappingData[brightnessKey] ||
        this.multipleLayerBrightnessMappingData[`${brightnessKey}.png`]
      let brightness = 0
      if (mappedBrightness && mappedBrightness.length) {
        brightness = mappedBrightness[this.presentationImageNo % mappedBrightness.length]
      }
      let maximumDyeConcentration = _.max(mappedBrightness || [])
      maximumDyeConcentration = Math.max(0.0001, maximumDyeConcentration || 0.0001)
      let opacity = mappedBrightness ? brightness / maximumDyeConcentration : 1
      opacity = Math.min(Math.max(opacity, 0), 1)

      const cacheImage = FABRIC_IMAGES_CACHE.find((el) => el.fileName == image.fileName && el.path == image.path)
      if (!cacheImage || !cacheImage.img) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.canvas.renderAll()
        }
        return
      }

      if (existingLiverLayerImage) {
        this.canvas.remove(existingLiverLayerImage)
      }

      const baseScale = this.getFitScale(1024, 778)
      const scaleX = (1024 / cacheImage.img.width) * baseScale
      const scaleY = (778 / cacheImage.img.height) * baseScale

      cacheImage.img.crossOrigin = 'anonymous'
      cacheImage.img.set({
        left: this.canvasRealWidth / 2 - (cacheImage.img.width * scaleX) / 2,
        top: this.canvasRealHeight / 2 - (cacheImage.img.height * scaleY) / 2,
        opacity,
      })
      cacheImage.img.scaleX = scaleX
      cacheImage.img.scaleY = scaleY
      cacheImage.img.evented = false
      cacheImage.img.selectable = false
      cacheImage.img.fileName = image.fileName
      cacheImage.img.path = image.path
      cacheImage.img.liverLayerImage = true

      this.canvas.add(cacheImage.img)
      this.canvas.moveTo(cacheImage.img, 1)
      this.canvas.renderAll()
    },
    async drawVascularLayerImage() {
      const allImages = (this.preloadVascularImages || []).filter(
        (img) => String(img.albumNo) === String(this.timingDecisionContrastAlbum)
      )

      if (!allImages.length) {
        const canvasObjects = this.canvas.getObjects()
        canvasObjects
          .filter((obj) => obj.vascularImage)
          .forEach((obj) => this.canvas.remove(obj))
        this.vascularLayerImage = null
        return
      }

      const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()
      const imageNo = this.presentationImageNo

      const canvasObjects = this.canvas.getObjects()
      const imagesByBrightnessKey = _.groupBy(allImages, (img) => {
        const fileName = img.fileName || ''
        const dotIndex = fileName.lastIndexOf('.')
        return dotIndex >= 0 ? fileName.substring(0, dotIndex) : fileName
      })

      for (const [brightnessKey, images] of Object.entries(imagesByBrightnessKey)) {
        if (!brightnessKey) continue

        let mappedBrightness =
          this.multipleLayerBrightnessMappingData[brightnessKey] ||
          this.multipleLayerBrightnessMappingData[`${brightnessKey}.png`]

        const existingImageForKey = canvasObjects.find(
          (obj) => obj.vascularImage && obj.vascularKey === brightnessKey
        )

        if (!mappedBrightness || !mappedBrightness.length) {
          if (existingImageForKey) {
            this.canvas.remove(existingImageForKey)
          }
          continue
        }

        let brightness = mappedBrightness[imageNo % mappedBrightness.length]
        let maximumDyeConcentration = _.max(mappedBrightness || [])
        maximumDyeConcentration = Math.max(0.0001, maximumDyeConcentration || 0.0001)

        let opacity = brightness / maximumDyeConcentration
        opacity = Math.min(Math.max(opacity, 0), 1)

        if (opacity <= 0.001) {
          if (existingImageForKey) {
            this.canvas.remove(existingImageForKey)
          }
          continue
        }

        let candidateImages = images
        const hasBreathingPhase = images.some((img) => typeof img.breathingPhase === 'number')
        if (hasBreathingPhase) {
          const phaseImages = images.filter((img) => (img.breathingPhase || 0) === breathingPhaseIndex)
          if (phaseImages.length > 0) {
            candidateImages = phaseImages
          }
        }

        const image = candidateImages[imageNo % candidateImages.length]
        if (!image) {
          if (existingImageForKey) {
            this.canvas.remove(existingImageForKey)
          }
          continue
        }

        const cacheImage = FABRIC_IMAGES_CACHE.find(
          (el) => el.fileName == image.fileName && el.path == image.path && el.timingDecisionStep == image.timingDecisionStep
        )

        if (!cacheImage || !cacheImage.img) {
          if (existingImageForKey) {
            this.canvas.remove(existingImageForKey)
          }
          continue
        }

        const baseScale = this.getFitScale(1024, 778)
        const scaleX = (1024 / cacheImage.img.width) * baseScale
        const scaleY = (778 / cacheImage.img.height) * baseScale

        if (existingImageForKey) {
          existingImageForKey.set({
            opacity,
          })
          this.canvas.moveTo(existingImageForKey, 1)
          continue
        }

        const img = cacheImage.img

        img.crossOrigin = 'anonymous'
        img.set({
          left: this.canvasRealWidth / 2 - (img.width * scaleX) / 2,
          top: this.canvasRealHeight / 2 - (img.height * scaleY) / 2,
          opacity,
        })
        img.scaleX = scaleX
        img.scaleY = scaleY
        img.evented = false
        img.selectable = false
        img.fileName = image.fileName
        img.vascularImage = true
        img.vascularKey = brightnessKey

        this.canvas.add(img)
        this.vascularLayerImage = img
        this.canvas.moveTo(img, 1)
      }

      this.canvas.renderAll()
    },
  },
}
</script>
<style lang="scss" scoped>
.blooth-tube-view-container {
  display: flex;
  justify-content: center;
  align-items: center;
  border: solid 2px #ffffff;
  overflow: hidden;
  position: relative;
  .overlay.show {
    position: absolute;
    z-index: 1;
    inset: 0;
    width: 100%;
    height: 100%;
    background: #000000;
  }
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
