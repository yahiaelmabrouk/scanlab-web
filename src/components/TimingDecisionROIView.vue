<template>
  <div
    class="timing-decision-roi-container"
    ref="container"
    style="background-color: #000000; height: calc(40vh + 95px)"
  >
    <canvas ref="canvas" id="timingDecisionROICanvas"></canvas>
    <div class="overlay" :class="{ show: !isShowROI }"></div>
    <div class="loading-overlay" :class="{ show: preloadPercent != 100 }">
      <v-progress-circular indeterminate></v-progress-circular>
    </div>
    <div class="slider-container" v-if="isShowBaseImageBrightnessControl">
      <v-icon color="white" size="20">mdi-lightbulb-on-outline</v-icon>
      <v-slider
        :min="-1"
        :max="1"
        :step="0.1"
        v-model="localBaseImagePreviewContrast"
        class="vertical-slider"
        vertical
      />
    </div>
    <!-- <img
      ref="image"
      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvZr3ZgReTYWifTT4rRFIl4h506L_mViQRAQ&s"
      alt=""
      style="position: absolute; top: 0; right: 0; z-index: 2; width: 100px"
    /> -->
  </div>
</template>
<script>
import { fabric } from 'fabric'
import _ from 'lodash'
import { mapActions, mapGetters, mapState } from 'vuex'
import {
  ROI_STATUS,
  SCAN_STATUS,
  DEFAULT_ROI_STROKE_WIDTH,
  NUM_OF_BODY_MAP_IMAGES,
  HU_TRIGGER_TYPE,
  getNumOfPresentationBodyMapImages,
  PRESENTATION_IMAGE_INJECT_START,
  TIMING_DECISION_MAX_PRESENTATION_STEP,
  getPresentationBodyMapSteps,
  MIN_CONTRAST_DURATION_TIME,
  PRESENTATION143_FOLDER_MAP,
  PRESENTATION134_FOLDER_MAP,
  PRESENTATION170_FOLDER_MAP,
  PRESENTATION200_FOLDER_MAP,
  PRESENTATION75_FOLDER_MAP,
  DEFAULT_CARDIAC_CYCLE_DURATION,
  PRESENTATION210_FOLDER_MAP,
  MAXIMUM_ROI_STEP,
} from '../constants'
import EventBus from '@/lib/event-bus'
import { FABRIC_IMAGES_CACHE } from '../util/loaderManager'
import { getROIPresentationImageNo } from '../util/roiUtils'
let timeOutLogMappingData = null
export default {
  name: 'TimingDecisionROIView',
  data() {
    return {
      canvas: null,
      canvasContext2d: null,
      canvasRealWidth: 0,
      canvasRealHeight: 0,
      backgroundImage: null,
      // pointer: {
      //   x: 0,
      //   y: 0,
      //   radius: DEFAULT_ROI_RADIUS,
      //   scaleX: 1,
      //   scaleY: 1,
      //   strokeWidth: DEFAULT_ROI_STROKE_WIDTH,
      // },
      resizeObserver: null,
      circleObject: null,
      ROI_STATUS: ROI_STATUS,
      SCAN_STATUS,
      isDragging: false,
      isZooming: false,
      lastPosX: null,
      lastPosY: null,
      NUM_OF_BODY_MAP_IMAGES,
      getNumOfPresentationBodyMapImages,
      PRESENTATION_IMAGE_INJECT_START,
      TIMING_DECISION_MAX_PRESENTATION_STEP,
      MIN_CONTRAST_DURATION_TIME,
      getPresentationBodyMapSteps,
      interval: null,
      isCalcProbeData: false,
      HU_TRIGGER_TYPE: HU_TRIGGER_TYPE,
      heartLayerImage: null,
      liverLayerImage: null,
      heartDyeLayerImage: null,
      baseBrightness: 0,
      baseLayerImage: null,
      vascularLayerImage: null,
      timeoutUpdateImage: null,
      breathingAnimationInterval: null,
      preloadBeathingImages: [],
      localBaseImagePreviewContrast: 0.2,
      probePresentationTimingDecisionStep: 0,
      cacheVariable: {},
      breathingFrameIndex: 0,
      activeImageUrl: null,      // The URL we actually draw
      pendingImageUrl: null,     // Latest computed URL while dragging
      isMouseDownAnywhere: false // Track global left mouse state
    }
  },
  computed: {
    ...mapState('questionService', [
      'timingDecisionStep',
      'roiStatus',
      'scanStatus',
      'presentationTimingDecisionStep',
      'timingDecisionHUTriggerThreshold',
      'timingDecisionTriggerType',
      'timingDecisionBrightnessData',
      'timingDecisionPointer',
      'timingDecisionFlouroFrameRate',
      'presentationPreviewTimingDecisionStep',
    ]),
    ...mapGetters('questionService', [
      'isTimingDecisionQuestion',
      'isAnsweredCurrentQuestion',
      'stackQuestion',
      'firstTimingDecisionQuestion',
      'visibleProbeNames',
      'patientPhysioInfoRespiratoryCycleDuration',
      'patientPhysioInfoCardiacCycleDuration',
      'patientPhysioInfoStrokeVolume',
    ]),
    ...mapState('injectorService', [
      'isStartPowerInjectProcess',
      'isStartedContrastProcess',
      'isStartedContrast1Process',
      'isStartedContrast2Process',
      'isStartedTestContrastProcess',
      'currentContrastDuration',
      'currentContrast1Duration',
      'currentContrast2Duration',
      'currentTestContrastDuration',
      'injectedSecondsBeforeStartViewTimingDecision',
      'testContrastFlowRate',
      'contrast1FlowRate',
      'contrast2FlowRate',
      'contrastFlowRate',
    ]),
    ...mapState('timingDecisionService', [
      'timingDecisionTestProcessDoneStep',
      'timingDecisionContrast1ProcessDoneStep',
      'timingDecisionContrast2ProcessDoneStep',
      'timingDecisionContrastProcessDoneStep',
      'timingDecisionInjectedStep',
      'timingDecisionContrast1InjectedStep',
      'timingDecisionContrast2InjectedStep',
      'timingDecisionTestProcessInjectedStep',
      'preloadCatScanImages',
      'preloadHeartImages',
      'preloadHeartDyeImages',
      'preloadDyeImages',
      'previewContrast',
      'brightnessMappingData',
      'preloadVascularImages',
      'preloadHeartLayerImages',
      'preloadLiverLayerImages',
      'probeData',
    ]),
    ...mapGetters('timingDecisionService', [
      'shouldAutoMoveToNextAfterTimingDecision',
      'isHasTestContrast',
      'isHasTwoPeriodContrast',
      'isSelectedTestBolusTimingDecision',
      'preloadPercent',
      'multipleLayerImageGroupedByFolder',
    ]),
    baseImagePreviewContrast() {
      return this.previewContrast
    },
    isShowBaseImageBrightnessControl() {
      return (
        !this.isAnsweredCurrentQuestion &&
        (this.roiStatus == this.ROI_STATUS.SHOW_ROI || this.roiStatus == this.ROI_STATUS.CONFIRMED)
      )
    },
    timingDecisionContrastAlbum() {
      if (this.timingDecisionStep >= 0 && this.timingDecisionStep < 340) {
        return (this.timingDecisionStep + 1).toString()
      } else {
        return '143'
      }
    },
    delayTimeToShowRoi() {
      // 1 -> 10 <=> 14 -> 2
      let standardDelayTime = 5.29
      const offset = ((this.timingDecisionStep - 143) / 143) * standardDelayTime
      standardDelayTime = standardDelayTime + offset
      const step = 2 / 3
      // const step = 1 / 3

      return Math.max(2, _.round(5 + (5 - this.currentContrastFlowRate) * step))
    },
    presentationPeriods() {
      return [
        {
          start: 2, // Must start from 2, because 1 is the initial step
          end: Math.min(Math.round(this.trackingDuration) + 2, MAXIMUM_ROI_STEP),
        },
        {
          start: 2,
          end: Math.min(Math.round(this.trackingDuration) + 2, MAXIMUM_ROI_STEP),
        },
        {
          start: 2,
          end: Math.min(Math.round(this.trackingDuration) + 2, MAXIMUM_ROI_STEP),
        },
      ]
    },
    endingPeriod() {
      const endPoints = Math.max(...this.presentationPeriods.map((item) => item.end))

      return { start: endPoints + 1, end: MAXIMUM_ROI_STEP }
    },
    presentationImageNo() {
      let presentStep = this.presentationTimingDecisionStep
      if (
        this.isSelectedTestBolusTimingDecision &&
        (this.roiStatus == this.ROI_STATUS.DONE || this.isAnsweredCurrentQuestion)
      ) {
        presentStep = this.presentationPreviewTimingDecisionStep
      }

      return getROIPresentationImageNo({
        presentStep: presentStep,
        currentTestContrastDuration: this.currentTestContrastDuration,
        timingDecisionFlouroFrameRate: this.timingDecisionFlouroFrameRate,
        duationRate: this.duationRate,
        currentContrast1Duration: this.currentContrast1Duration,
        currentContrast2Duration: this.currentContrast2Duration,
        currentContrastDuration: this.currentContrastDuration,
        isHasTestContrast: this.isHasTestContrast,
        isHasTwoPeriodContrast: this.isHasTwoPeriodContrast,
        timingDecisionTestProcessInjectedStep: this.timingDecisionTestProcessInjectedStep,
        presentationPeriods: this.presentationPeriods,
        timingDecisionTestProcessDoneStep: this.timingDecisionTestProcessDoneStep,
        injectedSecondsBeforeStartViewTimingDecision: this.injectedSecondsBeforeStartViewTimingDecision,
        timingDecisionScanDelay: _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0),
        delayTimeToShowRoi: this.delayTimeToShowRoi,
        timingDecisionContrast1ProcessDoneStep: this.timingDecisionContrast1ProcessDoneStep,
        timingDecisionContrast2ProcessDoneStep: this.timingDecisionContrast2ProcessDoneStep,
        timingDecisionInjectedStep: this.timingDecisionInjectedStep,
        timingDecisionContrastProcessDoneStep: this.timingDecisionContrastProcessDoneStep,
        timingDecisionContrast1InjectedStep: this.timingDecisionContrast1InjectedStep,
        timingDecisionContrast2InjectedStep: this.timingDecisionContrast2InjectedStep,
        endingPeriod: this.endingPeriod,
      })
    },
    currentContrastFlowRate() {
      let presentStep = this.presentationTimingDecisionStep
      if (
        this.isSelectedTestBolusTimingDecision &&
        (this.roiStatus == this.ROI_STATUS.DONE || this.isAnsweredCurrentQuestion)
      ) {
        presentStep = this.presentationPreviewTimingDecisionStep
      }
      if (this.isHasTestContrast) {
        if (this.isHasTwoPeriodContrast) {
          const startMainStep = Math.max(
            this.timingDecisionTestProcessDoneStep,
            this.timingDecisionContrast1InjectedStep
          )
          if (presentStep <= this.timingDecisionTestProcessDoneStep || presentStep < startMainStep) {
            return this.testContrastFlowRate
          } else if (presentStep <= this.timingDecisionContrast1ProcessDoneStep) {
            return this.contrast1FlowRate
          } else {
            return this.contrast2FlowRate
          }
        } else {
          const startMainStep = Math.max(this.timingDecisionTestProcessDoneStep, this.timingDecisionInjectedStep)
          if (presentStep <= this.timingDecisionTestProcessDoneStep || presentStep < startMainStep) {
            return this.testContrastFlowRate
          } else {
            return this.contrastFlowRate
          }
        }
      } else {
        if (this.isHasTwoPeriodContrast) {
          if (presentStep <= this.timingDecisionContrast1ProcessDoneStep) {
            return this.contrast1FlowRate
          } else {
            return this.contrast2FlowRate
          }
        } else {
          return this.contrastFlowRate
        }
      }
    },
    duationRate() {
      return this.patientPhysioInfoCardiacCycleDuration / DEFAULT_CARDIAC_CYCLE_DURATION
    },
    testDuration() {
      const testContrastDuration =
        this.currentTestContrastDuration == 0
          ? 0
          : Math.max(
              this.MIN_CONTRAST_DURATION_TIME * this.timingDecisionFlouroFrameRate,
              this.currentTestContrastDuration * this.duationRate
            )
      return testContrastDuration
    },
    bolusTrackingDurationDuration() {
      const contrastDuration =
        this.currentContrastDuration == 0
          ? 0
          : Math.max(
              this.MIN_CONTRAST_DURATION_TIME * this.timingDecisionFlouroFrameRate,
              this.currentContrastDuration * this.duationRate
            )
      return contrastDuration
    },
    trackingDuration() {
      let startMainStep = Math.max(this.timingDecisionTestProcessDoneStep, this.timingDecisionInjectedStep)
      if (this.isHasTwoPeriodContrast) {
        startMainStep = Math.max(this.timingDecisionTestProcessDoneStep, this.timingDecisionContrast1InjectedStep)
      }
      let presentStep = this.presentationTimingDecisionStep
      if (
        this.isSelectedTestBolusTimingDecision &&
        (this.roiStatus == this.ROI_STATUS.DONE || this.isAnsweredCurrentQuestion)
      ) {
        presentStep = this.presentationPreviewTimingDecisionStep
      }
      if (this.isSelectedTestBolusTimingDecision && this.isHasTestContrast && presentStep <= startMainStep) {
        return this.testDuration
      } else {
        return this.bolusTrackingDurationDuration
      }
    },
    multipleLayerBrightnessMappingData() {
      // brightnessMappingData entries come only from efficient JSON:
      // {
      //   strokeVolume: number | null,
      //   duration: number | null,
      //   data: { [brightnessKey: string]: number[] }
      // }

      if (!Array.isArray(this.brightnessMappingData) || this.brightnessMappingData.length === 0) {
        return {}
      }

      const sv = this.patientPhysioInfoStrokeVolume
      let candidates = this.brightnessMappingData

      // 1) Prefer entries that match strokeVolume if available
      if (sv != null) {
        const exact = candidates.filter((item) => item.strokeVolume === sv)
        if (exact.length > 0) {
          candidates = exact
        }
      }

      // 2) Among remaining, pick the one whose duration is closest to trackingDuration
      const duration = this.trackingDuration || 0

      const nearest = _.minBy(candidates, (item) => {
        const d = item.duration != null ? item.duration : 0
        return Math.abs(d - duration)
      })

      return nearest ? nearest.data || {} : {}
    },
    multipleLayerBrightnessMappingDataFileInfo() {
      if (!Array.isArray(this.brightnessMappingData) || this.brightnessMappingData.length === 0) {
        return null
      }

      const sv = this.patientPhysioInfoStrokeVolume
      let candidates = this.brightnessMappingData

      // Prefer matching strokeVolume
      if (sv != null) {
        const exact = candidates.filter((item) => item.strokeVolume === sv)
        if (exact.length > 0) {
          candidates = exact
        }
      }

      const duration = this.trackingDuration || 0

      const nearest = _.minBy(candidates, (item) => {
        const d = item.duration != null ? item.duration : 0
        return Math.abs(d - duration)
      })

      return nearest || null
    },
    multipleLayerBrightnessMappingDataFileInfoKey() {
      const info = this.multipleLayerBrightnessMappingDataFileInfo
      return info ? info.fileName : null
    },

    imageUrl() {
      if (
        this.roiStatus == this.ROI_STATUS.RUNNING ||
        this.roiStatus == this.ROI_STATUS.DONE ||
        this.isAnsweredCurrentQuestion
      ) {
        return `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/heart/${this.formatNumber(this.presentationImageNo, false)}.png`
      } else {
        return `/img/cat-scans/CAT_Scan.0${this.formatNumber(+this.timingDecisionContrastAlbum, true)}.png`
      }
    },
    maximumBrightnessDataShouldShow() {
      // 450 max
      if (this.currentContrastFlowRate <= 1) {
        // 50
        return 50
      } else if (this.currentContrastFlowRate <= 1.5) {
        // 100
        return 100
      } else if (this.currentContrastFlowRate <= 2) {
        // 150
        return 150
      } else if (this.currentContrastFlowRate <= 2.5) {
        // 200
        return 200
      } else if (this.currentContrastFlowRate <= 3) {
        // 250
        return 250
      } else if (this.currentContrastFlowRate <= 3.5) {
        // 300
        return 300
      } else if (this.currentContrastFlowRate <= 4) {
        // 350
        return 350
      } else if (this.currentContrastFlowRate <= 4.5) {
        // 400
        return 400
      } else {
        // 450
        return 450
      }
    },
    realMaximumBrightnessData() {
      if (this.currentContrastFlowRate <= 1) {
        return 113
      } else if (this.currentContrastFlowRate <= 1.5) {
        return 145
      } else if (this.currentContrastFlowRate <= 2) {
        return 178
      } else if (this.currentContrastFlowRate <= 2.5) {
        return 196
      } else if (this.currentContrastFlowRate <= 3) {
        return 237
      } else if (this.currentContrastFlowRate <= 3.5) {
        return 255
      } else if (this.currentContrastFlowRate <= 4) {
        return 293
      } else if (this.currentContrastFlowRate <= 4.5) {
        return 311
      } else {
        return 335
      }
    },
    brightnessOfPresentationImage() {
      if (this.currentContrastFlowRate <= 1) {
        // 50
        return -0.55
      } else if (this.currentContrastFlowRate <= 1.5) {
        // 100
        return -0.48
      } else if (this.currentContrastFlowRate <= 2) {
        // 150
        return -0.41
      } else if (this.currentContrastFlowRate <= 2.5) {
        // 200
        return -0.35
      } else if (this.currentContrastFlowRate <= 3) {
        // 250
        return -0.27
      } else if (this.currentContrastFlowRate <= 3.5) {
        // 300
        return -0.2
      } else if (this.currentContrastFlowRate <= 4) {
        // 350
        return -0.13
      } else if (this.currentContrastFlowRate <= 4.5) {
        // 400
        return -0.06
      } else {
        // 450
        return 0
      }
    },
    isShowROI() {
      return (
        this.isTimingDecisionQuestion &&
        this.scanStatus != this.SCAN_STATUS.NO_SCAN &&
        (this.roiStatus == this.ROI_STATUS.SHOW_ROI ||
          this.roiStatus == this.ROI_STATUS.CONFIRMED ||
          this.roiStatus == this.ROI_STATUS.RUNNING ||
          this.roiStatus == this.ROI_STATUS.DONE ||
          this.isAnsweredCurrentQuestion)
      )
    },
    isDisableMoveROICircle() {
      return (
        this.roiStatus == this.ROI_STATUS.CONFIRMED ||
        this.roiStatus == this.ROI_STATUS.RUNNING ||
        this.roiStatus == this.ROI_STATUS.DONE ||
        this.isAnsweredCurrentQuestion
      )
    },
    pointer: {
      get() {
        return this.timingDecisionPointer
      },
      set(val) {
        this.setTimingDecisionPointer(val)
      },
    },
  },
  watch: {
    pointer: {
      deep: true,
      handler: function () {
        this.drawCircle()
      },
    },
    imageUrl: {
      immediate: true,
      handler(newVal) {
        // Always remember the latest computed URL
        this.pendingImageUrl = newVal

        // Are we in the CT selection phase (CAT scan images)?
        const isCatScanPhase =
          !(
            this.roiStatus == this.ROI_STATUS.RUNNING ||
            this.roiStatus == this.ROI_STATUS.DONE ||
            this.isAnsweredCurrentQuestion
          )

        // While left button is held during CT slice selection,
        // do NOT apply; just keep updating pendingImageUrl.
        if (isCatScanPhase && this.isMouseDownAnywhere) {
          return
        }

        // Otherwise (no drag, or during contrast playback), apply immediately
        this.commitPendingImageUrl()
      },
    },
    baseImagePreviewContrast: 'drawCanvasBackground',
    brightnessOfPresentationImage: 'drawCanvasBackground',
    presentationPreviewTimingDecisionStep: 'drawCanvasBackground',
    presentationTimingDecisionStep: function () {
      this.drawCanvasBackground()
    },
    isStartedContrastProcess: 'onIsStartedContrastProcessChanged',
    isStartedContrast1Process: 'onIsStartedContrast1ProcessChanged',
    isStartedContrast2Process: 'onIsStartedContrast2ProcessChanged',
    isStartedTestContrastProcess: 'onIsStartedTestContrastProcessChanged',
    roiStatus: function () {
      if (!this.canvas) {
        return
      }
      this.drawBreathingAnimation()
      this.drawCanvasBackground()
      this.onRoiStatusChange()
      this.onPredownLoadPresentationImages()
    },
    patientPhysioInfoRespiratoryCycleDuration: 'drawBreathingAnimation',
    currentTestContrastDuration: 'onPredownLoadPresentationImages',
    currentContrastDuration: 'onPredownLoadPresentationImages',
    delayTimeToShowRoi: 'onPredownLoadPresentationImages',
    timingDecisionContrastAlbum: function () {
      // this.onPreloadBeathingImages()
      this.onPredownLoadPresentationImages()
    },
    preloadPercent: function () {
      if (!this.canvas) {
        return
      }
      if (this.preloadPercent != 100) {
        return
      }
      this.drawCanvasBackground()
    },
    localBaseImagePreviewContrast: function () {
      this.setPreviewContrast(this.localBaseImagePreviewContrast)
    },
    multipleLayerBrightnessMappingDataFileInfoKey: function () {
      if (this.multipleLayerBrightnessMappingDataFileInfo) {
        if (timeOutLogMappingData) {
          clearTimeout(timeOutLogMappingData)
        }
        timeOutLogMappingData = setTimeout(() => {
          console.log(
            'TIMING DECISION: MAIN BRIGHTNESS DATA FROM FILE',
            this.multipleLayerBrightnessMappingDataFileInfo
          )
        }, 500)
      }
    },
    isTimingDecisionQuestion() {
      this.onInitCanvas()
      this.drawCanvasBackground()
      this.drawCircle()
    },
  },
  mounted() {
    this.onInitCanvas()

    this.drawCanvasBackground()
    this.drawCircle()

    this.onPreloadBeathingImages()

    this.loadProbeJsonData('/img/probeData.zip')

    this.onPredownLoadPresentationImages()

    this.loadSliceDyesData()

    this.localBaseImagePreviewContrast = this.previewContrast

    window.addEventListener('resize', this.onWindowSizeChanged)
    this.$refs.container.addEventListener('contextmenu', this.onContextMenu)
    EventBus.$on('onConfirmROI', this.takeROIScreenShot)

    this.resizeObserver = new ResizeObserver(() => {
      // container size changed, recompute canvas + redraw
      this.onInitCanvas()
      if (this.roiStatus !== this.ROI_STATUS.RUNNING) {
        this.drawCanvasBackground()
      }
      this.drawCircle()
    })
    this.resizeObserver.observe(this.$refs.container)

    this.activeImageUrl = this.imageUrl
    window.addEventListener('mousedown', this.onGlobalMouseDown)
    window.addEventListener('mouseup', this.onGlobalMouseUp)
  },
  beforeDestroy() {
    EventBus.$off('onConfirmROI', this.takeROIScreenShot)
    window.removeEventListener('resize', this.onWindowSizeChanged)
    this.$refs.container.removeEventListener('contextmenu', this.onContextMenu)

    if (this.interval) {
      clearInterval(this.interval)
    }
    if (this.breathingAnimationInterval) {
      clearInterval(this.breathingAnimationInterval)
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    window.removeEventListener('mousedown', this.onGlobalMouseDown)
    window.removeEventListener('mouseup', this.onGlobalMouseUp)
  },
  methods: {
    ...mapActions('questionService', [
      'setRoiStatus',
      'setTimingDecisionStep',
      'setPresentationTimingDecisionStep',
      'setIsStartCountDownProcess',
      'addTimingDecisionBrightnessData',
      'addMultitpleTimingDecisionBrightnessData',
      'setTimingDecisionPointer',
      'setTimingDecisionROIScreenshot',
      'setTimingDecisionStartTime',
    ]),
    ...mapActions('timingDecisionService', [
      'setTimingDecisionTestProcessDoneStep',
      'setTimingDecisionContrast1ProcessDoneStep',
      'setTimingDecisionContrast2ProcessDoneStep',
      'setTimingDecisionContrastProcessDoneStep',
      'setTimingDecisionInjectedStep',
      'setTimingDecisionContrast1InjectedStep',
      'setTimingDecisionContrast2InjectedStep',
      'setTimingDecisionTestProcessInjectedStep',
      'onPreloadCatScanImages',
      'resetPreloadImages',
      'loadSlicesZipFile',
      'loadMultipleLayerSlicesZipFile',
      'loadSliceDyesData',
      'loadBrightnessMappingData',
      'loadSliceVascularData',
      'loadSliceHeartLayerData',
      'loadSliceLiverLayerData',
      'setPreviewContrast',
      'loadProbeJsonData',
    ]),
    onGlobalMouseDown(e) {
      if (e.button === 0) {
        this.isMouseDownAnywhere = true
      }
    },

    onGlobalMouseUp(e) {
      if (e.button === 0) {
        this.isMouseDownAnywhere = false
        // When the user releases left click, apply the last CT slice
        this.commitPendingImageUrl()
      }
    },

    commitPendingImageUrl() {
      if (!this.pendingImageUrl || this.pendingImageUrl === this.activeImageUrl) {
        return
      }
      this.activeImageUrl = this.pendingImageUrl
      this.pendingImageUrl = null

      // Run existing logic (period detection + drawing)
      this.onImageUrlChanged()
    },
    getFitScale(imgWidth, imgHeight) {
      const scaleX = this.canvasRealWidth / imgWidth
      const scaleY = this.canvasRealHeight / imgHeight

      // Fit fully inside (no cropping)
      return Math.min(scaleX, scaleY)
    },
    applyCtPositionAndFilters(img) {
      const standardWidth = 1024
      const standardHeight = 778

      const baseScale = this.getFitScale(standardWidth, standardHeight)
      const scaleX = (standardWidth / img.width) * baseScale
      const scaleY = (standardHeight / img.height) * baseScale

      img.crossOrigin = 'anonymous'
      img.set({
        left: this.canvasRealWidth / 2 - (img.width * scaleX) / 2,
        top:  this.canvasRealHeight / 2 - (img.height * scaleY) / 2,
      })
      img.scaleX = scaleX
      img.scaleY = scaleY

      img.evented = false
      img.selectable = false
      img.filters = []

      if (
        this.roiStatus == this.ROI_STATUS.RUNNING ||
        this.roiStatus == this.ROI_STATUS.DONE ||
        this.isAnsweredCurrentQuestion
      ) {
        let filter = new fabric.Image.filters.Brightness({
          brightness: this.brightnessOfPresentationImage,
        })
        img.filters.push(filter)
        filter = this.getContrastFilter()
        img.filters.push(filter)
        img.applyFilters()
      } else if (
        !this.isAnsweredCurrentQuestion &&
        (this.roiStatus == this.ROI_STATUS.SHOW_ROI ||
          this.roiStatus == this.ROI_STATUS.CONFIRMED)
      ) {
        let filter = this.getContrastFilter()
        img.filters.push(filter)
        img.applyFilters()
      }

      this.canvas.add(img)

      if (this.heartLayerImage) {
        this.canvas.moveTo(img, 4)
      }

      if (this.roiStatus == this.ROI_STATUS.RUNNING) {
        this.pointer = {
          ...this.pointer,
          imageScale: scaleX, // or scaleY, they are almost same
        }
      } else {
        // Keep the last known image scale so previews can reconstruct accurately
        this.pointer = {
          ...this.pointer,
          imageScale: scaleX,
        }
      }

      this.drawCircle()
      this.canvas.renderAll()

      this.onCalcBrightness()
    },
    /**
    * Breathing phase index (0–3) used by vascular + heart + multi-layer images.
    * - When RUNNING: follow the breathing animation frame (breathingFrameIndex).
    * - Otherwise: derive from presentation step (same logic as drawBreathingLayerImage).
    */
    getCurrentBreathingPhaseIndex() {
      const BREATHING_PHASE_COUNT = 4
      // When animation is running, trust the animation state
      if (this.roiStatus === this.ROI_STATUS.RUNNING) {
        return this.breathingFrameIndex % BREATHING_PHASE_COUNT || 0
      }

      // When not running, sync with drawBreathingLayerImage
      let presentStep = this.presentationTimingDecisionStep

      if (
        this.isSelectedTestBolusTimingDecision &&
        (this.roiStatus == this.ROI_STATUS.DONE || this.isAnsweredCurrentQuestion)
      ) {
        presentStep = this.presentationPreviewTimingDecisionStep
      }

      // Breathing.00001–00004 -> indices 0–3
      const index =
        Math.round(presentStep / this.timingDecisionFlouroFrameRate) %
        BREATHING_PHASE_COUNT

      return index
    },
    getMultipleLayerFolderZipPath() {
      return {
        folderPath: `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}`,
        zipPath: `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/heart.zip`,
      }
    },
    getBrightnessMappingPath() {
      // We need both stroke volume and a non-zero tracking duration
      if (!this.patientPhysioInfoStrokeVolume || !this.trackingDuration || !this.timingDecisionFlouroFrameRate) {
        return null
      }

      // 1) Pick the nearest available stroke volume (40, 70, 100 ml)
      const availableStrokeVolumes = [40, 70, 100]
      const nearestStrokeVolume = _.minBy(
        availableStrokeVolumes,
        (sv) => Math.abs(sv - this.patientPhysioInfoStrokeVolume)
      )

      // 2) Predefined duration–>volume table (matches 60 JSON files)
      //    duration is in seconds; volume is in ml (the last "xxml" part)
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

      // 3) Convert trackingDuration (frames) to seconds
      const durationSec = this.trackingDuration / this.timingDecisionFlouroFrameRate

      // 4) Choose nearest duration row
      const nearestConfig = _.minBy(
        mappingConfigs,
        (item) => Math.abs(item.duration - durationSec)
      )

      if (!nearestConfig) {
        return null
      }

      // 5) Build the file name:
      //    sv{SV}ml_{duration}s_{volume}ml_volume.zip
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
    onImageUrlChanged() {
      if (this.roiStatus == this.ROI_STATUS.RUNNING) {
        if (this.isHasTestContrast) {
          if (this.isHasTwoPeriodContrast) {
            if (this.timingDecisionTestProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP) {
              const periodNumber = 0
              const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (this.presentationImageNo == endImageIndex) {
                this.setTimingDecisionTestProcessDoneStep(this.presentationTimingDecisionStep)
              }
            } else if (this.timingDecisionContrast1ProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP) {
              const periodNumber = 1
              const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (this.presentationImageNo == endImageIndex) {
                this.setTimingDecisionContrast1ProcessDoneStep(this.presentationTimingDecisionStep)
              }
            } else if (this.timingDecisionContrast2ProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP) {
              const periodNumber = 2
              const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (this.presentationImageNo == endImageIndex) {
                this.setTimingDecisionContrast2ProcessDoneStep(this.presentationTimingDecisionStep)
              }
            }
          } else {
            if (this.timingDecisionTestProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP) {
              const periodNumber = 0
              const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (this.presentationImageNo == endImageIndex) {
                this.setTimingDecisionTestProcessDoneStep(this.presentationTimingDecisionStep)
              }
            } else if (this.timingDecisionContrastProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP) {
              const periodNumber = 1
              const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (this.presentationImageNo == endImageIndex) {
                this.setTimingDecisionContrastProcessDoneStep(this.presentationTimingDecisionStep)
              }
            }
          }
        } else {
          if (this.isHasTwoPeriodContrast) {
            if (this.timingDecisionContrast1ProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP) {
              const periodNumber = 0
              const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (this.presentationImageNo == endImageIndex) {
                this.setTimingDecisionContrast1ProcessDoneStep(this.presentationTimingDecisionStep)
              }
            } else if (this.timingDecisionContrast2ProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP) {
              const periodNumber = 1
              const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (this.presentationImageNo == endImageIndex) {
                this.setTimingDecisionContrast2ProcessDoneStep(this.presentationTimingDecisionStep)
              }
            }
          } else {
            if (this.timingDecisionContrastProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP) {
              const periodNumber = 0
              const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (this.presentationImageNo == endImageIndex) {
                this.setTimingDecisionContrastProcessDoneStep(this.presentationTimingDecisionStep)
              }
            }
          }
        }
      }

      this.drawCanvasBackground()
    },
    getProbeDelayTimeToShowRoi() {
      // 1 -> 10 <=> 14 -> 2
      let standardDelayTime = 5.29
      const offset = ((this.timingDecisionStep - 143) / 143) * standardDelayTime
      standardDelayTime = standardDelayTime + offset
      const step = 2 / 3
      // const step = 1 / 3

      return Math.max(2, _.round(5 + (5 - this.getProbeContrastFlowRate()) * step))
    },
    getProbePresentationImageNo() {
      let presentStep = this.probePresentationTimingDecisionStep

      const step = getROIPresentationImageNo({
        presentStep: presentStep,
        currentTestContrastDuration: this.currentTestContrastDuration,
        timingDecisionFlouroFrameRate: this.timingDecisionFlouroFrameRate,
        duationRate: this.duationRate,
        currentContrast1Duration: this.currentContrast1Duration,
        currentContrast2Duration: this.currentContrast2Duration,
        currentContrastDuration: this.currentContrastDuration,
        isHasTestContrast: this.isHasTestContrast,
        isHasTwoPeriodContrast: this.isHasTwoPeriodContrast,
        timingDecisionTestProcessInjectedStep: this.timingDecisionTestProcessInjectedStep,
        presentationPeriods: this.getProbePresentationPeriods(),
        timingDecisionTestProcessDoneStep: this.cacheVariable.timingDecisionTestProcessDoneStep,
        injectedSecondsBeforeStartViewTimingDecision: this.injectedSecondsBeforeStartViewTimingDecision,
        timingDecisionScanDelay: _.get(this.firstTimingDecisionQuestion, ['timingDecisionScanDelay'], 0),
        delayTimeToShowRoi: this.getProbeDelayTimeToShowRoi(),
        timingDecisionContrast1ProcessDoneStep: this.cacheVariable.timingDecisionContrast1ProcessDoneStep,
        timingDecisionContrast2ProcessDoneStep: this.cacheVariable.timingDecisionContrast2ProcessDoneStep,
        timingDecisionInjectedStep: this.timingDecisionInjectedStep,
        timingDecisionContrastProcessDoneStep: this.cacheVariable.timingDecisionContrastProcessDoneStep,
        timingDecisionContrast1InjectedStep: this.timingDecisionContrast1InjectedStep,
        timingDecisionContrast2InjectedStep: this.timingDecisionContrast2InjectedStep,
        endingPeriod: this.getProbeEndingPeriod(),
      })

      return step
    },
    getProbeEndingPeriod() {
      const endPoints = Math.max(...this.getProbePresentationPeriods().map((item) => item.end))

      return { start: endPoints + 1, end: MAXIMUM_ROI_STEP }
    },
    getProbePresentationPeriods() {
      return [
        {
          start: 2, // Must start from 2, because 1 is the initial step
          end: Math.min(Math.round(this.getProbeTrackingDuration()) + 2, MAXIMUM_ROI_STEP),
        },
        {
          start: 2,
          end: Math.min(Math.round(this.getProbeTrackingDuration()) + 2, MAXIMUM_ROI_STEP),
        },
        {
          start: 2,
          end: Math.min(Math.round(this.getProbeTrackingDuration()) + 2, MAXIMUM_ROI_STEP),
        },
      ]
    },
    getProbeTrackingDuration() {
      let startMainStep = Math.max(
        this.cacheVariable.timingDecisionTestProcessDoneStep,
        this.timingDecisionInjectedStep
      )
      if (this.isHasTwoPeriodContrast) {
        startMainStep = Math.max(
          this.cacheVariable.timingDecisionTestProcessDoneStep,
          this.timingDecisionContrast1InjectedStep
        )
      }
      let presentStep = this.probePresentationTimingDecisionStep
      if (this.isSelectedTestBolusTimingDecision && this.isHasTestContrast && presentStep <= startMainStep) {
        return this.testDuration
      } else {
        return this.bolusTrackingDurationDuration
      }
    },
    getProbeContrastFlowRate() {
      let presentStep = this.probePresentationTimingDecisionStep
      if (this.isHasTestContrast) {
        if (this.isHasTwoPeriodContrast) {
          const startMainStep = Math.max(
            this.cacheVariable.timingDecisionTestProcessDoneStep,
            this.timingDecisionContrast1InjectedStep
          )
          if (presentStep <= this.cacheVariable.timingDecisionTestProcessDoneStep || presentStep < startMainStep) {
            return this.testContrastFlowRate
          } else if (presentStep <= this.cacheVariable.timingDecisionContrast1ProcessDoneStep) {
            return this.contrast1FlowRate
          } else {
            return this.contrast2FlowRate
          }
        } else {
          const startMainStep = Math.max(
            this.cacheVariable.timingDecisionTestProcessDoneStep,
            this.timingDecisionInjectedStep
          )
          if (presentStep <= this.cacheVariable.timingDecisionTestProcessDoneStep || presentStep < startMainStep) {
            return this.testContrastFlowRate
          } else {
            return this.contrastFlowRate
          }
        }
      } else {
        if (this.isHasTwoPeriodContrast) {
          if (presentStep <= this.cacheVariable.timingDecisionContrast1ProcessDoneStep) {
            return this.contrast1FlowRate
          } else {
            return this.contrast2FlowRate
          }
        } else {
          return this.contrastFlowRate
        }
      }
    },
    onCalcProbeData(fromStep) {
      this.cacheVariable = {
        timingDecisionTestProcessDoneStep: this.timingDecisionTestProcessDoneStep,
        timingDecisionContrast1ProcessDoneStep: this.timingDecisionContrast1ProcessDoneStep,
        timingDecisionContrast2ProcessDoneStep: this.timingDecisionContrast2ProcessDoneStep,
        timingDecisionContrastProcessDoneStep: this.timingDecisionContrastProcessDoneStep,
      }
      let brightnessData = []
      for (let i = fromStep; i < 600; i++) {
        this.probePresentationTimingDecisionStep = i
        const probePresentationImageNo = this.getProbePresentationImageNo()
        if (this.isHasTestContrast) {
          if (this.isHasTwoPeriodContrast) {
            if (this.cacheVariable.timingDecisionTestProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP) {
              const periodNumber = 0
              const period = _.get(this.getProbePresentationPeriods(), [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (probePresentationImageNo == endImageIndex) {
                this.cacheVariable.timingDecisionTestProcessDoneStep = this.probePresentationTimingDecisionStep
              }
            } else if (
              this.cacheVariable.timingDecisionContrast1ProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP
            ) {
              const periodNumber = 1
              const period = _.get(this.getProbePresentationPeriods(), [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (probePresentationImageNo == endImageIndex) {
                this.cacheVariable.timingDecisionContrast1ProcessDoneStep = this.probePresentationTimingDecisionStep
              }
            } else if (
              this.cacheVariable.timingDecisionContrast2ProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP
            ) {
              const periodNumber = 2
              const period = _.get(this.getProbePresentationPeriods(), [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (probePresentationImageNo == endImageIndex) {
                this.cacheVariable.timingDecisionContrast2ProcessDoneStep = this.probePresentationTimingDecisionStep
              }
            }
          } else {
            if (this.cacheVariable.timingDecisionTestProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP) {
              const periodNumber = 0
              const period = _.get(this.getProbePresentationPeriods(), [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (probePresentationImageNo == endImageIndex) {
                this.cacheVariable.timingDecisionTestProcessDoneStep = this.probePresentationTimingDecisionStep
              }
            } else if (
              this.cacheVariable.timingDecisionContrastProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP
            ) {
              const periodNumber = 1
              const period = _.get(this.getProbePresentationPeriods(), [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (probePresentationImageNo == endImageIndex) {
                this.cacheVariable.timingDecisionContrastProcessDoneStep = this.probePresentationTimingDecisionStep
              }
            }
          }
        } else {
          if (this.isHasTwoPeriodContrast) {
            if (
              this.cacheVariable.timingDecisionContrast1ProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP
            ) {
              const periodNumber = 0
              const period = _.get(this.getProbePresentationPeriods(), [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (probePresentationImageNo == endImageIndex) {
                this.cacheVariable.timingDecisionContrast1ProcessDoneStep = this.probePresentationTimingDecisionStep
              }
            } else if (
              this.cacheVariable.timingDecisionContrast2ProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP
            ) {
              const periodNumber = 1
              const period = _.get(this.getProbePresentationPeriods(), [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (probePresentationImageNo == endImageIndex) {
                this.cacheVariable.timingDecisionContrast2ProcessDoneStep = this.probePresentationTimingDecisionStep
              }
            }
          } else {
            if (
              this.cacheVariable.timingDecisionContrastProcessDoneStep == this.TIMING_DECISION_MAX_PRESENTATION_STEP
            ) {
              const periodNumber = 0
              const period = _.get(this.getProbePresentationPeriods(), [periodNumber], { start: 0, end: 0 })
              const endImageIndex = period.end
              if (probePresentationImageNo == endImageIndex) {
                this.cacheVariable.timingDecisionContrastProcessDoneStep = this.probePresentationTimingDecisionStep
              }
            }
          }
        }

        // Assign probe data
        const imageNo = probePresentationImageNo
        const currentSeconds =
          this.probePresentationTimingDecisionStep * this.timingDecisionFlouroFrameRate +
          _.get(this.firstTimingDecisionQuestion, ['timingDecisionScanDelay'], 0)
        const probeValues = []
        this.probeData.forEach((probe) => {
          if (!this.visibleProbeNames.includes(probe.fileName)) {
            return
          }
          const mappingData = probe.mappingData.filter((el) => el.strokeVolume == this.patientPhysioInfoStrokeVolume)
          const nearestSecData = _.minBy(mappingData, (el) => Math.abs(el.duration - this.getProbeTrackingDuration()))
          if (nearestSecData) {
            const value = nearestSecData.values[imageNo % nearestSecData.values.length]
            const maxValue = _.max(nearestSecData.values) || 1
            const label = probe.label
            probeValues.push({
              value: value,
              label: label,
              fileName: probe.fileName,
              maxValue: maxValue,
            })
          } else {
            probeValues.push({
              value: 0,
              label: probe.label,
              fileName: probe.fileName,
              maxValue: 1,
            })
          }
        })
        brightnessData.push({
          label: currentSeconds.toString(),
          value: null,
          probeValues: probeValues,
        })
      }
      const reverseArray = _.reverse(_.cloneDeep(brightnessData))
      const lastValueIndex = reverseArray.findIndex((el, index) => {
        if (index < brightnessData.length - 1) {
          const nextProbeValue = reverseArray[index + 1].probeValues
          const currentProbeValue = reverseArray[index].probeValues
          return _.some(currentProbeValue, (current) => {
            const nextProbe = nextProbeValue.find((next) => next.label == current.label)
            return nextProbe?.value != current.value
          })
        }
        return false
      })
      if (lastValueIndex != -1) {
        brightnessData = brightnessData.slice(0, brightnessData.length - lastValueIndex)
      }
      this.addMultitpleTimingDecisionBrightnessData(brightnessData)
    },
    async onPredownLoadAllPresentationImagesOfCurrentAlbum() {
      this.loadBrightnessMappingData(this.getBrightnessMappingPath())
      this.loadSliceVascularData({
        zipPath: this.getSliceVascularPath(),
        albumNo: this.timingDecisionContrastAlbum,
      })
      if (this.timingDecisionContrastAlbum != 75) {
        this.loadSliceHeartLayerData({
          zipPath: this.getSliceHeartLayerPath(),
          albumNo: this.timingDecisionContrastAlbum,
        })
        this.loadSliceLiverLayerData({
          zipPath: this.getSliceLiverLayerPath(),
          albumNo: this.timingDecisionContrastAlbum,
        })
      }

      const multipleLayerFolder = this.getMultipleLayerFolderZipPath()
      this.loadMultipleLayerSlicesZipFile(multipleLayerFolder)
    },
    onPredownLoadPresentationImages() {
      if (this.roiStatus == this.ROI_STATUS.NO_CONFIRM || this.roiStatus == this.ROI_STATUS.SHOW_ROI) {
        return
      }
      if (_.isNil(this.currentContrastDuration)) {
        return
      }
      if (this.currentContrastDuration == 0) {
        return
      }
      this.onPredownLoadAllPresentationImagesOfCurrentAlbum()
    },
    onWindowSizeChanged() {
      this.onInitCanvas()
      if (this.roiStatus !== this.ROI_STATUS.RUNNING) {
        this.drawCanvasBackground()
      }
      this.drawCircle()
    },
    onInitCanvas() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      let c = this.$refs.canvas
      c.width = boundingRec.width
      c.height = boundingRec.height
      this.canvasRealWidth = boundingRec.width
      this.canvasRealHeight = boundingRec.height

      this.canvasContext2d = this.$refs.canvas.getContext('2d')

      if (!this.canvas) {
        this.canvas = new fabric.Canvas('timingDecisionROICanvas', {
          width: boundingRec.width,
          height: boundingRec.height,
          fireRightClick: true,
        })
      }

      this.canvas.setDimensions({
        width: boundingRec.width,
        height: boundingRec.height,
      })

      this.canvas.on({
        'mouse:down': this.onMouseDown,
        'mouse:move': this.onMouseMove,
        'object:modified': this.onModified,
        'mouse:up': this.onMouseUp,
        // 'mouse:wheel': this.onMouseWheel,
      })
    },
    onRoiStatusChange() {
      if (this.roiStatus == this.ROI_STATUS.RUNNING) {
        if (
          this.presentationTimingDecisionStep <
          this.getPresentationBodyMapSteps(this.timingDecisionContrastAlbum) / this.timingDecisionFlouroFrameRate
        ) {
          if (this.interval) {
            clearInterval(this.interval)
          }

          let i = this.presentationTimingDecisionStep
          this.interval = setInterval(() => {
            if (i < this.getPresentationBodyMapSteps(this.timingDecisionContrastAlbum)) {
              i++
              this.setPresentationTimingDecisionStep(i)
            } else {
              this.onRunDone()
              clearInterval(this.interval)
            }
          }, Math.max(100, this.timingDecisionFlouroFrameRate * 1000))
        } else {
          if (this.interval) {
            clearInterval(this.interval)
          }
          this.onCalcBrightness()
          this.onRunDone()
        }
      } else if (this.roiStatus == this.ROI_STATUS.DONE) {
        if (this.interval) {
          clearInterval(this.interval)
        }
        // Flush brightness for the current step — the 100ms debounce timeout
        // from drawCanvasBackground may have been cancelled during the
        // RUNNING → DONE transition (e.g. manual scan trigger).
        if (this.presentationTimingDecisionStep > 0) {
          this.onCalcBrightness(false, { force: true })
        }
        if (!this.isCalcProbeData) {
          this.isCalcProbeData = true
          this.onCalcProbeData(this.presentationTimingDecisionStep)
        }
      }
      this.updateCircleSelectedEvent()
      if (this.roiStatus == this.ROI_STATUS.CONFIRMED) {
        if (this.isStartedContrastProcess) {
          this.setTimingDecisionInjectedStep(0)
        }
        if (this.isStartedTestContrastProcess) {
          this.setTimingDecisionTestProcessInjectedStep(0)
        }
        if (this.isStartedContrast1Process) {
          this.setTimingDecisionContrast1InjectedStep(0)
        }
        if (this.isStartedContrast2Process) {
          this.setTimingDecisionContrast2InjectedStep(0)
        }
      }
    },
    onIsStartedContrastProcessChanged() {
      if (this.isStartedContrastProcess) {
        this.setTimingDecisionInjectedStep(this.presentationTimingDecisionStep)
      }
    },
    onIsStartedContrast1ProcessChanged() {
      if (this.isStartedContrast1Process) {
        this.setTimingDecisionContrast1InjectedStep(this.presentationTimingDecisionStep)
      }
    },
    onIsStartedContrast2ProcessChanged() {
      if (this.isStartedContrast2Process) {
        this.setTimingDecisionContrast2InjectedStep(this.presentationTimingDecisionStep)
      }
    },
    onIsStartedTestContrastProcessChanged() {
      if (this.isStartedTestContrastProcess) {
        this.setTimingDecisionTestProcessInjectedStep(this.presentationTimingDecisionStep)
      }
    },
    takeROIScreenShot() {
      if (this.canvas) {
        const imgData = this.$refs.canvas.toDataURL('image/png', 0.5)
        this.setTimingDecisionROIScreenshot(imgData)
      }
    },
    onRunDone() {
      this.setRoiStatus(this.ROI_STATUS.DONE)
      this.setIsStartCountDownProcess(this.shouldAutoMoveToNextAfterTimingDecision)
      EventBus.$emit('onTimingDecisionRunDone')
    },
    onContextMenu(e) {
      e.preventDefault()
    },
    formatNumber(input, startIndex) {
      if (startIndex) input = parseInt(input) - 1
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
    drawBreathingAnimation() {
      const handle = () => {
        let currentFrame = 0
        const totalFrames = 4

        // existing timing logic
        const frameRate =
          this.patientPhysioInfoRespiratoryCycleDuration /
          this.timingDecisionFlouroFrameRate /
          totalFrames

        if (this.breathingAnimationInterval) {
          clearInterval(this.breathingAnimationInterval)
        }

        const renderImage = (frame) => {
          const phaseIndex = (frame - 1 + totalFrames) % totalFrames
          this.breathingFrameIndex = phaseIndex

          const imgUrl = `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/baseLayer/baseLayer.0000${frame}.jpg`
          const preloadImage = this.preloadBeathingImages.find((el) => el.path === imgUrl)

          if (preloadImage && preloadImage.img) {
            const img = new fabric.Image(preloadImage.img)

            if (this.baseLayerImage) {
              this.canvas.remove(this.baseLayerImage)
            }
            this.baseLayerImage = img

            const standardWidth = 1024
            const standardHeight = 778
            const baseScale = this.getFitScale(standardWidth, standardHeight)
            const scaleX = (standardWidth / img.width) * baseScale
            const scaleY = (standardHeight / img.height) * baseScale

            img.crossOrigin = 'anonymous'
            img.set({
              left: this.canvasRealWidth / 2 - (img.width * scaleX) / 2,
              top:  this.canvasRealHeight / 2 - (img.height * scaleY) / 2,
            })
            img.scaleX = scaleX
            img.scaleY = scaleY

            img.evented = false
            img.selectable = false
            img.filters = []

            if (
              this.roiStatus == this.ROI_STATUS.RUNNING ||
              this.roiStatus == this.ROI_STATUS.DONE ||
              this.isAnsweredCurrentQuestion
            ) {
              let filter = this.getContrastFilter()
              img.filters.push(filter)
              img.applyFilters()
            }

            this.canvas.add(this.baseLayerImage)
            this.canvas.moveTo(img, 0)

            // keep layers in sync
            if (
              this.roiStatus == this.ROI_STATUS.RUNNING ||
              this.roiStatus == this.ROI_STATUS.DONE ||
              this.isAnsweredCurrentQuestion
            ) {
              this.drawLiverLayerImage()
              this.drawVascularImage()
              this.drawHeartLayerImage()
              this.drawMultipleLayerImages(true)
            }

            this.canvas.renderAll()
          }
        }

        // initial frame
        renderImage(currentFrame + 1)
        currentFrame = (currentFrame + 1) % totalFrames

        this.breathingAnimationInterval = setInterval(() => {
          renderImage(currentFrame + 1)
          currentFrame = (currentFrame + 1) % totalFrames
        }, frameRate)
      }

      const removeAnimation = () => {
        if (this.breathingAnimationInterval) {
          clearInterval(this.breathingAnimationInterval)
          this.breathingAnimationInterval = null
        }
        // Reset phase when not animating
        this.breathingFrameIndex = 0
      }

      if (this.roiStatus == this.ROI_STATUS.RUNNING) {
        handle()
      } else {
        removeAnimation()
      }
    },
    drawCanvasBackground() {
      const drawProcess = async () => {
        // NEW: while RUNNING, don't redraw layers here.
        // Let drawBreathingAnimation/renderImage own all visual drawing.
        // We ONLY measure brightness for the HU curve.
        if (this.roiStatus === this.ROI_STATUS.RUNNING) {
          // First step -> establish baseline brightness
          if (this.presentationTimingDecisionStep === 0 && this.baseBrightness === 0) {
            const base = this.onCalcBrightness(true) // returns raw brightness without subtracting base
            this.baseBrightness = base
            this.setTimingDecisionStartTime()
          } else {
            this.onCalcBrightness() // normal logging: subtracts baseBrightness & writes to store
          }
          return
        }

        // OLD logic for DONE / answered / preview
        if (
          this.roiStatus === this.ROI_STATUS.DONE ||
          this.isAnsweredCurrentQuestion
        ) {
          // For DONE/preview, it's fine to use the old pipeline
          await this.drawBreathingLayerImage()
          await this.drawLiverLayerImage()
          await this.drawVascularImage()
          await this.drawHeartLayerImage()
          if (this.presentationTimingDecisionStep === 0) {
            this.drawMultipleLayerImagesToCalcFirstBrightness()
            this.setTimingDecisionStartTime()
          }
          this.drawMultipleLayerImages()
        } else {
          // Non-contrast / CAT scan path (NO_SCAN, SHOW_ROI, CONFIRMED)
          if (this.baseLayerImage) {
            this.canvas.remove(this.baseLayerImage)
            this.baseLayerImage = null
          }
          if (this.vascularLayerImage) {
            this.canvas.remove(this.vascularLayerImage)
            this.vascularLayerImage = null
          }
          if (this.heartLayerImage) {
            this.canvas.remove(this.heartLayerImage)
            this.heartLayerImage = null
          }
          if (this.heartDyeLayerImage) {
            this.canvas.remove(this.heartDyeLayerImage)
            this.heartDyeLayerImage = null
          }

          this.drawTopBackground()
        }
      }

      if (this.timeoutUpdateImage) {
        clearTimeout(this.timeoutUpdateImage)
      }

      this.timeoutUpdateImage = setTimeout(async () => {
        try {
          await drawProcess()
        } catch (error) {
          console.warn('Failed to draw timing decision ROI background:', error)
        }
      }, 100)
    },
    async drawHeartLayerImage() {
      // All heart layer images for the current album
      const allImages = this.preloadHeartLayerImages.filter(
        (el) => el.albumNo == this.timingDecisionContrastAlbum
      )

      const canvasObjects = this.canvas.getObjects()
      const existingHeartLayerImage = canvasObjects.find((obj) => obj.heartLayerImage)

      // If nothing preloaded, clear and bail
      if (allImages.length === 0) {
        if (existingHeartLayerImage) {
          this.canvas.remove(existingHeartLayerImage)
        }
        return
      }

      // Map current step -> breathing phase 0–3 (b00/b01/b02/b03)
      const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()

      // If preloading code added `breathingPhase` (0–3) to each image,
      // we filter by that. If not, we fall back to "all images".
      let imagesForPhase = allImages
      const hasBreathingPhase = allImages.some(
        (img) => typeof img.breathingPhase === 'number'
      )

      if (hasBreathingPhase) {
        const phaseImages = allImages.filter(
          (img) => (img.breathingPhase || 0) === breathingPhaseIndex
        )
        if (phaseImages.length > 0) {
          imagesForPhase = phaseImages
        }
      }

      // Keep previous behavior: use presentationImageNo to pick heart frame
      const imageNo = this.presentationImageNo
      const image = imagesForPhase[imageNo % imagesForPhase.length]

      if (!image) {
        if (existingHeartLayerImage) {
          this.canvas.remove(existingHeartLayerImage)
        }
        return
      }

      const cacheImage = FABRIC_IMAGES_CACHE.find(
        (el) => el.fileName == image.fileName && el.path == image.path
      )

      if (!cacheImage || !cacheImage.img) {
        if (existingHeartLayerImage) {
          this.canvas.remove(existingHeartLayerImage)
        }
        return
      }

      if (existingHeartLayerImage) {
        this.canvas.remove(existingHeartLayerImage)
      }

      const standardWidth = 1024
      const standardHeight = 778

      // Use standard size as logical CT size
      const baseScale = this.getFitScale(standardWidth, standardHeight)

      // Adjust from actual PNG size to standard CT size
      const scaleX = (standardWidth / cacheImage.img.width) * baseScale
      const scaleY = (standardHeight / cacheImage.img.height) * baseScale

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
      cacheImage.img.filters = []

      if (
        this.roiStatus == this.ROI_STATUS.RUNNING ||
        this.roiStatus == this.ROI_STATUS.DONE ||
        this.isAnsweredCurrentQuestion
      ) {
        let filter = this.getContrastFilter()
        cacheImage.img.filters.push(filter)
        cacheImage.img.applyFilters()
      }

      this.canvas.add(cacheImage.img)
      this.canvas.moveTo(cacheImage.img, 3)
    },
    async drawLiverLayerImage() {
      if (!this.canvas) return

      // All liver images for current album
      const allImages = (this.preloadLiverLayerImages || []).filter(
        (el) => String(el.albumNo) === String(this.timingDecisionContrastAlbum)
      )

      const canvasObjects = this.canvas.getObjects()
      const existingLiverLayerImage = canvasObjects.find((obj) => obj.liverLayerImage)

      // If there are no preloaded liver images, clear any existing one and bail
      if (!allImages.length) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.liverLayerImage = null
          this.canvas.renderAll()
        }
        return
      }

      // --- Drive liver visibility from contrast mapping ('liver' key) ---
      const imageNo = this.presentationImageNo
      let mappedBrightness =
        this.multipleLayerBrightnessMappingData['liver'] ||
        this.multipleLayerBrightnessMappingData['liver.png'] // fallback

      // If mapping data is missing, never show liver (until mapping is loaded)
      if (!mappedBrightness || !mappedBrightness.length) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.liverLayerImage = null
          this.canvas.renderAll()
        }
        return
      }

      let brightness = mappedBrightness[imageNo % mappedBrightness.length]
      let maximumDyeConcentration = _.max(mappedBrightness || [])
      maximumDyeConcentration = Math.max(0.0001, maximumDyeConcentration || 0.0001)

      let opacity = brightness / maximumDyeConcentration
      opacity = Math.min(Math.max(opacity, 0), 1)

      // When brightness is ~0 (before injection), hide liver completely
      if (opacity <= 0.001) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.liverLayerImage = null
          this.canvas.renderAll()
        }
        return
      }

      // --- Choose correct breathing phase image (0–3) ---
      const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()

      let imagesForPhase = allImages
      const hasBreathingPhase = allImages.some(
        (img) => typeof img.breathingPhase === 'number'
      )

      if (hasBreathingPhase) {
        const phaseImages = allImages.filter(
          (img) => (img.breathingPhase || 0) === breathingPhaseIndex
        )
        if (phaseImages.length > 0) {
          imagesForPhase = phaseImages
        }
      }

      // We only need one liver image for this phase
      const image = imagesForPhase[0]
      if (!image) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.liverLayerImage = null
          this.canvas.renderAll()
        }
        return
      }

      const cacheImage = FABRIC_IMAGES_CACHE.find(
        (el) => el.fileName === image.fileName && el.path === image.path
      )

      if (!cacheImage || !cacheImage.img) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.liverLayerImage = null
          this.canvas.renderAll()
        }
        return
      }

      // --- If we already have THIS phase/frame on canvas, just update opacity & filters ---
      if (
        existingLiverLayerImage &&
        existingLiverLayerImage.fileName === image.fileName &&
        existingLiverLayerImage.path === image.path
      ) {
        existingLiverLayerImage.filters = []
        existingLiverLayerImage.set({ opacity })

        if (
          this.roiStatus == this.ROI_STATUS.RUNNING ||
          this.roiStatus == this.ROI_STATUS.DONE ||
          this.isAnsweredCurrentQuestion
        ) {
          let filter = this.getContrastFilter()
          existingLiverLayerImage.filters.push(filter)
          existingLiverLayerImage.applyFilters()
        }

        this.canvas.renderAll()
        this.liverLayerImage = existingLiverLayerImage
        return
      }

      // --- Different phase/frame → remove old, add new image ---
      if (existingLiverLayerImage) {
        this.canvas.remove(existingLiverLayerImage)
      }

      const img = cacheImage.img

      const standardWidth = 1024
      const standardHeight = 778
      const baseScale = this.getFitScale(standardWidth, standardHeight)
      const scaleX = (standardWidth / img.width) * baseScale
      const scaleY = (standardHeight / img.height) * baseScale

      img.crossOrigin = 'anonymous'
      img.set({
        left: this.canvasRealWidth / 2 - (img.width * scaleX) / 2,
        top:  this.canvasRealHeight / 2 - (img.height * scaleY) / 2,
        opacity,
      })
      img.scaleX = scaleX
      img.scaleY = scaleY
      img.evented = false
      img.selectable = false
      img.fileName = image.fileName
      img.path = image.path
      img.liverLayerImage = true
      img.breathingPhase = breathingPhaseIndex
      img.filters = []

      if (
        this.roiStatus == this.ROI_STATUS.RUNNING ||
        this.roiStatus == this.ROI_STATUS.DONE ||
        this.isAnsweredCurrentQuestion
      ) {
        let filter = this.getContrastFilter()
        img.filters.push(filter)
        img.applyFilters()
      }

      this.canvas.add(img)
      this.liverLayerImage = img
      this.canvas.moveTo(img, 1) // base(0) < liver(1) < vascular(2) < heart(3)
      this.canvas.renderAll()
    },
    drawVascularImage() {
      if (!this.canvas) return

      // Vascular images still filtered by album (current contrast album),
      // but brightness mapping is slice-agnostic.
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

      const boundingRec = this.$refs.container.getBoundingClientRect()

      const canvasObjects = this.canvas.getObjects()

      // Group by base file name (no extension):
      // "arteries_abdomen_L_commonIliac_00.png" -> "arteries_abdomen_L_commonIliac_00"
      const imagesByBrightnessKey = _.groupBy(allImages, (img) => {
        const fileName = img.fileName || ''
        const dotIndex = fileName.lastIndexOf('.')
        return dotIndex >= 0 ? fileName.substring(0, dotIndex) : fileName
      })

      for (const [brightnessKey, images] of Object.entries(imagesByBrightnessKey)) {
        if (!brightnessKey) continue

        // ---- 1) Get brightness series from efficient JSON mapping ----
        let mappedBrightness =
          this.multipleLayerBrightnessMappingData[brightnessKey] ||
          this.multipleLayerBrightnessMappingData[`${brightnessKey}.png`] // fallback if JSON keys accidentally include ".png"

        const existingImageForKey = canvasObjects.find(
          (obj) => obj.vascularImage && obj.vascularKey === brightnessKey
        )

        // If no brightness data for this key: remove any existing image and continue
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

        // If nothing visible: remove any existing image for this key
        if (opacity <= 0.001) {
          if (existingImageForKey) {
            this.canvas.remove(existingImageForKey)
          }
          continue
        }

        // ---- 2) Choose the actual PNG for this structure (per breathing phase) ----
        let candidateImages = images
        const hasBreathingPhase = images.some(
          (img) => typeof img.breathingPhase === 'number'
        )

        if (hasBreathingPhase) {
          const phaseImages = images.filter(
            (img) => (img.breathingPhase || 0) === breathingPhaseIndex
          )
          if (phaseImages.length > 0) {
            candidateImages = phaseImages
          }
        }

        const image = candidateImages[0]
        if (!image) continue

        const cacheImage = FABRIC_IMAGES_CACHE.find(
          (el) => el.fileName === image.fileName && el.path === image.path
        )

        if (!cacheImage || !cacheImage.img) {
          if (existingImageForKey) {
            this.canvas.remove(existingImageForKey)
          }
          continue
        }

        // ---- 3) Reuse existing fabric Image if possible ----
        if (existingImageForKey) {
          existingImageForKey.filters = []
          existingImageForKey.set({ opacity })

          if (
            this.roiStatus == this.ROI_STATUS.RUNNING ||
            this.roiStatus == this.ROI_STATUS.DONE ||
            this.isAnsweredCurrentQuestion
          ) {
            let filter = new fabric.Image.filters.Brightness({
              brightness: this.brightnessOfPresentationImage,
            })
            existingImageForKey.filters.push(filter)
            filter = this.getContrastFilter()
            existingImageForKey.filters.push(filter)
            existingImageForKey.applyFilters()
          } else {
            existingImageForKey.applyFilters()
          }

          continue
        }

        // ---- 4) Create new fabric Image for this vascular structure key ----
        const standardWidth = 1024
        const standardHeight = 778
        const img = cacheImage.img

        const baseScale = this.getFitScale(standardWidth, standardHeight)
        const scaleX = (standardWidth / img.width) * baseScale
        const scaleY = (standardHeight / img.height) * baseScale

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
        img.filters = []

        if (
          this.roiStatus == this.ROI_STATUS.RUNNING ||
          this.roiStatus == this.ROI_STATUS.DONE ||
          this.isAnsweredCurrentQuestion
        ) {
          let filter = new fabric.Image.filters.Brightness({
            brightness: this.brightnessOfPresentationImage,
          })
          img.filters.push(filter)
          filter = this.getContrastFilter()
          img.filters.push(filter)
          img.applyFilters()
        }

        this.canvas.add(img)
        this.vascularLayerImage = img
        this.canvas.moveTo(img, 2)
      }

      this.canvas.renderAll()
    },
    drawMultipleLayerImages(skipBrightness = false) {
      if (this.backgroundImage) {
        this.canvas.remove(this.backgroundImage)
      }

      const imageNo = this.presentationImageNo
      const layers = Object.entries(this.multipleLayerImageGroupedByFolder)

      // Current breathing phase 0–3 (b00/b01/b02/b03)
      const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()

      for (const [folderName, images] of layers) {
        // Derive brightness key from last segment of folder name:
        // "arteries/arteries_abdomen_L_commonIliac_00" -> "arteries_abdomen_L_commonIliac_00"
        const brightnessKey = (folderName || '').split('/').pop()

        let mappedBrightness =
          this.multipleLayerBrightnessMappingData[brightnessKey] ||
          this.multipleLayerBrightnessMappingData[`${brightnessKey}.png`] // fallback if JSON accidentally includes ".png"

        let brightness = 0
        if (mappedBrightness && mappedBrightness.length) {
          brightness = mappedBrightness[imageNo % mappedBrightness.length]
        }

        let maximumDyeConcentration = _.max(mappedBrightness || [])
        maximumDyeConcentration = Math.max(0.0001, maximumDyeConcentration || 0.0001)
        let opacity = brightness / maximumDyeConcentration
        opacity = Math.min(Math.max(opacity, 0), 1)

        // When there is truly no brightness data, we can choose:
        // - Show nothing (opacity stays 0), OR
        // - Fallback to fully visible (uncomment next line)
        // if (!mappedBrightness) opacity = 1

        // Pick the image for the current breathing phase
        let candidateImages = images
        const hasBreathingPhase = images.some(
          (img) => typeof img.breathingPhase === 'number'
        )

        if (hasBreathingPhase) {
          const phaseImages = images.filter(
            (img) => (img.breathingPhase || 0) === breathingPhaseIndex
          )
          if (phaseImages.length > 0) {
            candidateImages = phaseImages
          }
        }

        const image = candidateImages[imageNo % candidateImages.length]
        if (!image) continue

        const canvasObjects = this.canvas.getObjects()
        const existingImage = canvasObjects.find(
          (obj) => obj.layerImage && obj.fileName === image.fileName
        )
        const cacheImage = FABRIC_IMAGES_CACHE.find(
          (el) => el.fileName == image.fileName && el.path == image.path
        )

        if (existingImage) {
          existingImage.filters = []
          existingImage.set({ opacity })
          if (
            this.roiStatus == this.ROI_STATUS.RUNNING ||
            this.roiStatus == this.ROI_STATUS.DONE ||
            this.isAnsweredCurrentQuestion
          ) {
            let filter = new fabric.Image.filters.Brightness({
              brightness: this.brightnessOfPresentationImage,
            })
            existingImage.filters.push(filter)
            filter = this.getContrastFilter()
            existingImage.filters.push(filter)
            existingImage.applyFilters()
          }
          continue
        }

        const existingFolderImage = canvasObjects.find(
          (obj) => obj.layerImage && obj.folderName === folderName
        )
        if (existingFolderImage) {
          this.canvas.remove(existingFolderImage)
        }

        if (cacheImage && cacheImage.img) {
          const standardWidth = 1024
          const standardHeight = 778

          const baseScale = this.getFitScale(standardWidth, standardHeight)
          const scaleX = (standardWidth / cacheImage.img.width) * baseScale
          const scaleY = (standardHeight / cacheImage.img.height) * baseScale

          cacheImage.img.crossOrigin = 'anonymous'
          cacheImage.img.set({
            left: this.canvasRealWidth / 2 - (cacheImage.img.width * scaleX) / 2,
            top: this.canvasRealHeight / 2 - (cacheImage.img.height * scaleY) / 2,
          })
          cacheImage.img.scaleX = scaleX
          cacheImage.img.scaleY = scaleY
          cacheImage.img.set({ opacity })
          cacheImage.img.evented = false
          cacheImage.img.selectable = false
          cacheImage.img.fileName = image.fileName
          cacheImage.img.layerImage = true
          cacheImage.img.folderName = folderName
          cacheImage.img.filters = []

          if (
            this.roiStatus == this.ROI_STATUS.RUNNING ||
            this.roiStatus == this.ROI_STATUS.DONE ||
            this.isAnsweredCurrentQuestion
          ) {
            let filter = new fabric.Image.filters.Brightness({
              brightness: this.brightnessOfPresentationImage,
            })
            cacheImage.img.filters.push(filter)
            filter = this.getContrastFilter()
            cacheImage.img.filters.push(filter)
            cacheImage.img.applyFilters()
          }

          this.canvas.add(cacheImage.img)
        }
      }

      this.drawCircle()
      this.canvas.renderAll()

      // Only calculate brightness on the "main" render, not on breathing-only updates.
      if (!skipBrightness) {
        this.onCalcBrightness()
      }
    },
    drawMultipleLayerImagesToCalcFirstBrightness() {
      if (this.backgroundImage) {
        this.canvas.remove(this.backgroundImage)
      }

      const imageNo = 0
      const layers = Object.entries(this.multipleLayerImageGroupedByFolder)

      // For baseline brightness we use breathing phase 0 (b00)
      const baselineBreathingPhaseIndex = 0

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
        let opacity = brightness / maximumDyeConcentration
        opacity = Math.min(Math.max(opacity, 0), 1)

        let candidateImages = images
        const hasBreathingPhase = images.some(
          (img) => typeof img.breathingPhase === 'number'
        )

        if (hasBreathingPhase) {
          const phaseImages = images.filter(
            (img) => (img.breathingPhase || 0) === baselineBreathingPhaseIndex
          )
          if (phaseImages.length > 0) {
            candidateImages = phaseImages
          }
        }

        const image = candidateImages[imageNo % candidateImages.length]
        if (!image) continue

        const canvasObjects = this.canvas.getObjects()
        const existingImage = canvasObjects.find(
          (obj) => obj.layerImage && obj.fileName === image.fileName
        )
        const cacheImage = FABRIC_IMAGES_CACHE.find(
          (el) => el.fileName == image.fileName && el.path == image.path
        )

        if (existingImage) {
          existingImage.filters = []
          existingImage.set({ opacity })
          continue
        }

        const existingFolderImage = canvasObjects.find(
          (obj) => obj.layerImage && obj.folderName === folderName
        )
        if (existingFolderImage) {
          this.canvas.remove(existingFolderImage)
        }

        if (cacheImage && cacheImage.img) {
          const standardWidth = 1024
          const standardHeight = 778

          const baseScale = this.getFitScale(standardWidth, standardHeight)
          const scaleX = (standardWidth / cacheImage.img.width) * baseScale
          const scaleY = (standardHeight / cacheImage.img.height) * baseScale

          cacheImage.img.crossOrigin = 'anonymous'
          cacheImage.img.set({
            left: this.canvasRealWidth / 2 - (cacheImage.img.width * scaleX) / 2,
            top: this.canvasRealHeight / 2 - (cacheImage.img.height * scaleY) / 2,
          })
          cacheImage.img.scaleX = scaleX
          cacheImage.img.scaleY = scaleY

          cacheImage.img.set({ opacity })
          cacheImage.img.evented = false
          cacheImage.img.selectable = false
          cacheImage.img.fileName = image.fileName
          cacheImage.img.layerImage = true
          cacheImage.img.folderName = folderName
          cacheImage.img.filters = []

          if (
            this.roiStatus == this.ROI_STATUS.RUNNING ||
            this.roiStatus == this.ROI_STATUS.DONE ||
            this.isAnsweredCurrentQuestion
          ) {
            let filter = new fabric.Image.filters.Brightness({
              brightness: this.brightnessOfPresentationImage,
            })
            cacheImage.img.filters.push(filter)
            filter = this.getContrastFilter()
            cacheImage.img.filters.push(filter)
            cacheImage.img.applyFilters()
          }

          if (this.roiStatus == this.ROI_STATUS.RUNNING) {
            this.pointer = {
              ...this.pointer,
              imageScale: cacheImage.img.scaleX,
            }
          }

          this.canvas.add(cacheImage.img)
        }
      }

      this.drawCircle()
      this.canvas.renderAll()

      const brightness = this.onCalcBrightness(true)
      this.baseBrightness = brightness
    },
    async drawBreathingLayerImage() {
      return new Promise((resolve) => {
        try {
          let presentStep = this.presentationTimingDecisionStep
          if (
            this.isSelectedTestBolusTimingDecision &&
            (this.roiStatus == this.ROI_STATUS.DONE || this.isAnsweredCurrentQuestion)
          ) {
            presentStep = this.presentationPreviewTimingDecisionStep
          }
          const breathingImageNo =
            (Math.round(presentStep / this.timingDecisionFlouroFrameRate) % 4) + 1
          const imgUrl = `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/baseLayer/baseLayer.0000${breathingImageNo}.jpg`

          fabric.Image.fromURL(imgUrl, (img) => {
            if (this.baseLayerImage) {
              this.canvas.remove(this.baseLayerImage)
            }
            this.baseLayerImage = img

            const standardWidth = 1024
            const standardHeight = 778
            const baseScale = this.getFitScale(standardWidth, standardHeight)
            const scaleX = (standardWidth / img.width) * baseScale
            const scaleY = (standardHeight / img.height) * baseScale
            this.baseLayerImage.initialScale = scaleX // or baseScale if want

            img.crossOrigin = 'anonymous'
            img.set({
              left: this.canvasRealWidth / 2 - (img.width * scaleX) / 2,
              top:  this.canvasRealHeight / 2 - (img.height * scaleY) / 2,
            })
            img.scaleX = scaleX
            img.scaleY = scaleY
            img.evented = false
            img.selectable = false
            img.filters = []

            if (
              this.roiStatus == this.ROI_STATUS.RUNNING ||
              this.roiStatus == this.ROI_STATUS.DONE ||
              this.isAnsweredCurrentQuestion
            ) {
              let filter = this.getContrastFilter()
              img.filters.push(filter)
              img.applyFilters()
            }

            this.canvas.add(this.baseLayerImage)
            this.canvas.moveTo(img, 0)

            resolve()
          })
        } catch (err) {
          resolve()
        }
      })
    },
    getContrastFilter() {
      return new fabric.Image.filters.BlendColor({
        color: `rgba(255, 255, 255, 255)`,
        mode: 'add',
        alpha: this.baseImagePreviewContrast,
      })
    },
    drawTopBackground() { 
      if (!this.$refs.container) {
        return
      }

      // Use the committed URL; fall back to computed if not yet initialised
      const url = this.activeImageUrl || this.imageUrl
      if (!url) return

      let preloadImage = this.preloadCatScanImages.find(
        (el) => el.path == url
      )
      if (
        this.roiStatus == this.ROI_STATUS.RUNNING ||
        this.roiStatus == this.ROI_STATUS.DONE ||
        this.isAnsweredCurrentQuestion
      ) {
        preloadImage = this.preloadHeartDyeImages.find(
          (el) => el.path == url
        )
      }

      if (preloadImage && preloadImage.img) {
        const srcImg = preloadImage.img
        fabric.Image.fromURL(srcImg, (img) => {
          if (this.backgroundImage) {
            this.canvas.remove(this.backgroundImage)
          }
          this.backgroundImage = img

          this.applyCtPositionAndFilters(img)
        })
      } else if (url.includes('cat-scans')) {
        const requestedUrl = url
        fabric.Image.fromURL(requestedUrl, (img) => {
          // Avoid race if another slice was committed later
          if (requestedUrl !== this.activeImageUrl) {
            return
          }
          if (this.backgroundImage) {
            this.canvas.remove(this.backgroundImage)
          }
          this.backgroundImage = img

          this.applyCtPositionAndFilters(img)
        })
        this.onPreloadBeathingImages()
      }
    },
    drawCircle() {
      if (!this.canvas) {
        return
      }

      if (this.circleObject) {
        this.canvas.remove(this.circleObject)
      }

      if (_.isNil(this.pointer, ['x']) || _.isNil(this.pointer, ['y'])) {
        return
      }

      const boundingRec = this.$refs.container.getBoundingClientRect()
      this.circleObject = new fabric.Circle({
        radius: this.pointer.radius,
        fill: 'transparent',
        left: this.pointer.x - this.pointer.radius + boundingRec.width / 2,
        top: this.pointer.y - this.pointer.radius + boundingRec.height / 2,
        stroke: 'red',
        strokeWidth: DEFAULT_ROI_STROKE_WIDTH / this.canvas.getZoom(),
        strokeUniform: true,
        name: 'CIRCLE',
        scaleX: this.pointer.scaleX,
        scaleY: this.pointer.scaleY,
      })
      this.circleObject.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        bl: true,
        br: true,
        tl: true,
        tr: true,
        mtr: false,
      })
      this.updateCircleSelectedEvent()

      this.canvas.add(this.circleObject)
      const canvasObjects = this.canvas.getObjects()
      this.canvas.moveTo(this.circleObject, canvasObjects.length)
    },
    updateCircleSelectedEvent() {
      if (this.circleObject) {
        if (this.isDisableMoveROICircle) {
          this.circleObject.selectable = false
          this.circleObject.evented = false
        } else {
          this.circleObject.selectable = true
          this.circleObject.evented = true
        }
      }
    },
    onMouseDown(e) {
      e.e.preventDefault()
      if (e.pointer && !this.pointer) {
        const boundingRec = this.$refs.container.getBoundingClientRect()
        this.pointer = {
          x: e.pointer.x - boundingRec.width / 2,
          y: e.pointer.y - boundingRec.height / 2,
          radius: e.target.radius,
          scaleX: e.target.scaleX,
          scaleY: e.target.scaleY,
          strokeWidth: this.pointer.strokeWidth,
          imageScale: this.pointer.imageScale,
        }
      }

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
        this.pointer = {
          ...this.pointer,
          strokeWidth: DEFAULT_ROI_STROKE_WIDTH / zoom,
        }

        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
      }
    },
    onMouseUp() {
      this.canvas.setViewportTransform(this.canvas.viewportTransform)
      this.isDragging = false
      this.isZooming = false
    },
    onMouseWheel(opt) {
      let delta = opt.e.deltaY
      let zoom = this.canvas.getZoom()
      zoom *= 0.999 ** delta
      if (zoom > 20) zoom = 20
      if (zoom < 0.01) zoom = 0.01
      this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    },
    onModified(e) {
      if (e.target && e.target.name == 'CIRCLE') {
        const boundingRec = this.$refs.container.getBoundingClientRect()
        this.pointer = {
          x: e.target.left + e.target.radius - boundingRec.width / 2,
          y: e.target.top + e.target.radius - boundingRec.height / 2,
          radius: e.target.radius,
          scaleX: e.target.scaleX,
          scaleY: e.target.scaleY,
          strokeWidth: this.pointer.strokeWidth,
          imageScale: this.pointer.imageScale,
        }
      }
    },
    onCalcBrightness(isOnlyCalcBrightness = false, { force = false } = {}) {
      if (!force && this.roiStatus != this.ROI_STATUS.RUNNING) {
        return
      }
      const boundingRec = this.$refs.container.getBoundingClientRect()
      const vpt = this.canvas.viewportTransform
      const realRadius = this.pointer.radius * this.canvas.getZoom() * this.pointer.scaleX
      const originLeft = this.pointer.x - this.pointer.radius + boundingRec.width / 2
      const originTop = this.pointer.y - this.pointer.radius + boundingRec.height / 2
      const centerX =
        (originLeft + vpt[4] / this.canvas.getZoom()) * this.canvas.getZoom() + this.pointer.strokeWidth / 2
      const centerY =
        (originTop + vpt[5] / this.canvas.getZoom()) * this.canvas.getZoom() + this.pointer.strokeWidth / 2

      const canvasAttrWidth = this.canvas.upperCanvasEl.getAttribute('width')
      const canvasAttrHeight = this.canvas.upperCanvasEl.getAttribute('height')

      let imageData = this.canvasContext2d.getImageData(
        (centerX / boundingRec.width) * canvasAttrWidth,
        (centerY / boundingRec.height) * canvasAttrHeight,
        ((realRadius * 2) / boundingRec.width) * canvasAttrWidth,
        ((realRadius * 2) / boundingRec.height) * canvasAttrHeight
      )

      const colors = []
      new Array(imageData.data.length / 4).fill(null).forEach((el, index) => {
        const indexXCenter = (imageData.width - 1) / 2
        const indexYCenter = (imageData.height - 1) / 2
        const strokeWidth = 0 //this.pointer.strokeWidth * this.canvas.getZoom()
        const holeZoneRadius = realRadius - strokeWidth

        const indexX = index % imageData.width
        const indexY = Math.floor(index / imageData.height)

        const radius = Math.sqrt(Math.pow(indexXCenter - indexX, 2) + Math.pow(indexYCenter - indexY, 2))
        const isRed =
          imageData.data[index * 4] > 120 && imageData.data[index * 4 + 1] < 120 && imageData.data[index * 4 + 2] < 120
        if (radius > holeZoneRadius || isRed) {
          imageData.data[index * 4] = 0
          imageData.data[index * 4 + 1] = 0
          imageData.data[index * 4 + 2] = 0
          imageData.data[index * 4 + 3] = 255
        } else {
          colors.push({
            r: imageData.data[index * 4],
            g: imageData.data[index * 4 + 1],
            b: imageData.data[index * 4 + 2],
            a: imageData.data[index * 4 + 3],
          })
        }
      })

      let brightness = (_.mean(colors.map((el) => el.r)) / 255) * 450

      if (isOnlyCalcBrightness) {
        return brightness
      }

      // Step 0 is baseline calibration — never record it as a brightness data point
      if (this.presentationTimingDecisionStep === 0) {
        return brightness
      }

      brightness -= this.baseBrightness
      brightness = (brightness / this.realMaximumBrightnessData) * this.maximumBrightnessDataShouldShow
      brightness = Math.max(brightness, 0)
      brightness = Math.min(450, brightness)

      const currentSeconds =
        this.presentationTimingDecisionStep * this.timingDecisionFlouroFrameRate +
        _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0)

      const imageNo = this.presentationImageNo
      // mappedBrightness[imageNo % mappedBrightness.length]
      const probeValues = []
      this.probeData.forEach((probe) => {
        if (!this.visibleProbeNames.includes(probe.fileName)) {
          return
        }
        const mappingData = probe.mappingData.filter((el) => el.strokeVolume == this.patientPhysioInfoStrokeVolume)
        const nearestSecData = _.minBy(mappingData, (el) => Math.abs(el.duration - this.trackingDuration))
        if (nearestSecData) {
          const value = nearestSecData.values[imageNo % nearestSecData.values.length]
          const maxValue = _.max(nearestSecData.values) || 1
          const label = probe.label
          probeValues.push({
            value: value,
            label: label,
            maxValue: maxValue,
            fileName: probe.fileName,
          })
        } else {
          probeValues.push({
            value: 0,
            label: probe.label,
            maxValue: 1,
            fileName: probe.fileName,
          })
        }
      })
      this.addTimingDecisionBrightnessData({
        label: currentSeconds.toString(),
        value: brightness,
        probeValues: probeValues,
      })

      const lastBrightnessInfo = this.timingDecisionBrightnessData[this.timingDecisionBrightnessData.length - 1]
      if (
        lastBrightnessInfo &&
        lastBrightnessInfo.value >= this.timingDecisionHUTriggerThreshold &&
        this.timingDecisionTriggerType == this.HU_TRIGGER_TYPE.AUTOMATIC &&
        this.roiStatus == this.ROI_STATUS.RUNNING
      ) {
        this.onRunDone()
      }

      return brightness
    },
  },
}
</script>
<style lang="scss" scoped>
.timing-decision-roi-container {
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
  .slider-container {
    position: absolute;
    top: 20px;
    left: 10px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: start;
    gap: 0px;
    height: calc(100% - 80px);
  }
}
</style>
