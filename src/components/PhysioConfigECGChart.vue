<template>
  <div ref="container" class="physio-ecg-chart-wrapper" @contextmenu.prevent="">
    <canvas ref="canvas" id="physioECGChart"></canvas>
    <div class="group-bottom-left-buttons">
      <v-btn :color="isSlow ? 'primary' : ''" @click="setIsSlow(!isSlow)">{{ $t('global.slow') }}</v-btn>
      <v-btn class="ml-2" :color="isPause ? 'primary' : ''" @click="setIsPause(!isPause)">
        {{ isPause ? $t('global.play') : $t('global.pause') }}
      </v-btn>
    </div>
    <v-btn class="btn-preview" color="primary" @click="onPreviewECGChart(!isPreview)">{{
      isPreview ? $t('global.stop') : $t('global.preview')
    }}</v-btn>
  </div>
</template>
<script>
import { fabric } from 'fabric'
import _ from 'lodash'
import { PHYSIO_ECG_GROUP_NAME, ECG_DISTANCE_RATE, BAD_BEATS, ECGChartConfig } from '../constants'
import { mapState } from 'vuex'
import { mapActions } from 'vuex/dist/vuex.common.js'

export default {
  name: 'PhysioConfigECGChart',
  props: {
    cardiacCycleDuration: {
      type: Number,
      default: 900,
    },
    cardiacCycleDeviation: {
      type: Number,
      default: 0,
    },
    badBeats: {
      type: Number,
      default: BAD_BEATS.NONE,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    initialContinuousecgData: {
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
  },
  data() {
    return {
      isDragging: false,
      isZooming: false,
      lastPosX: null,
      lastPosY: null,
      centerY: 200,
      canvasRealWidth: 0,
      canvasRealHeight: 0,

      firstPGroup: null,
      firstQGroup: null,
      firstRGroup: null,
      firstSGroup: null,
      firstTGroup: null,

      secondPGroup: null,
      secondQGroup: null,
      secondRGroup: null,
      secondSGroup: null,
      secondTGroup: null,

      movingCoordLeft: 0,
      allECGGroupNames: Object.values(PHYSIO_ECG_GROUP_NAME),

      previewECGData: [],
      randomWaveBadbeatsArray: [],
    }
  },
  computed: {
    ...mapState('physioService', ['isSlow', 'isPause']),
    cycleDurationDistance() {
      return this.cardiacCycleDuration / ECG_DISTANCE_RATE
    },
    distanceFromSToT() {
      return (this.firstTGroup?.left - this.firstSGroup?.aCoords?.br?.x) * ECG_DISTANCE_RATE
    },
    distanceFromQToR() {
      return (this.firstRGroup?.left - this.firstQGroup?.aCoords?.br?.x) * ECG_DISTANCE_RATE
    },
    distanceFromRToS() {
      return (this.firstSGroup?.left - this.firstRGroup?.aCoords?.br?.x) * ECG_DISTANCE_RATE
    },
    distanceFromPToQ() {
      return (this.firstQGroup?.left - this.firstPGroup?.aCoords?.br?.x) * ECG_DISTANCE_RATE
    },
  },
  watch: {
    cycleDurationDistance: 'onDurationDistanceChanged',
    disabled: 'drawComponents',
    initialContinuousecgData: {
      handler: 'drawComponents',
      immediate: true,
    },
  },
  mounted() {
    this.onInitCanvas()
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    this.setIsSlow(false)
    this.setIsPause(false)
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    ...mapActions('physioService', ['setIsSlow', 'setIsPause']),
    async onResize() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      if (this.canvas) {
        this.canvas.setDimensions({
          width: boundingRec.width,
          height: boundingRec.height,
        })
        this.drawComponents()
      }

      this.canvasRealWidth = boundingRec.width
      this.canvasRealHeight = boundingRec.height

      let c = this.$refs.canvas
      c.width = boundingRec.width
      c.height = boundingRec.height
    },
    onInitCanvas() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      let c = this.$refs.canvas
      c.width = boundingRec.width
      c.height = boundingRec.height
      this.canvasRealWidth = boundingRec.width
      this.canvasRealHeight = boundingRec.height

      if (!this.canvas) {
        this.canvas = new fabric.Canvas('physioECGChart', {
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
        'object:moving': this.onMoving,
        'object:modified': this.onModified,
        'mouse:wheel': this.onMouseWheel,
      })

      this.drawComponents()
    },
    drawComponents() {
      if (!this.canvas) {
        return
      }

      this.canvas.clear()

      this.drawXAxis()
      this.drawFirstPGroup()
      this.drawFirstQGroup()
      this.drawFirstRGroup()
      this.drawFirstSGroup()
      this.drawFirstTGroup()

      this.drawSecondPGroup()
      this.drawSecondQGroup()
      this.drawSecondRGroup()
      this.drawSecondSGroup()
      this.drawSecondTGroup()
    },
    checkIsValidPosition(target) {
      if (
        !this.canvas ||
        !this.firstPGroup ||
        !this.firstQGroup ||
        !this.firstRGroup ||
        !this.firstSGroup ||
        !this.firstTGroup ||
        !this.secondPGroup ||
        !this.secondQGroup ||
        !this.secondRGroup ||
        !this.secondSGroup ||
        !this.secondTGroup
      ) {
        return false
      }
      let isIntersect = false
      this.canvas.forEachObject((obj) => {
        if (obj?.name === target?.name) return
        if (obj.name && this.allECGGroupNames.includes(obj.name) && target.intersectsWithObject(obj)) {
          isIntersect = true
        }
      })

      if (!isIntersect) {
        let isValidPosition = false
        switch (target.name) {
          case PHYSIO_ECG_GROUP_NAME.FIRST_P:
            if (
              target.aCoords.br.x <= this.firstQGroup.aCoords.bl.x &&
              target.aCoords.bl.x + this.cycleDurationDistance >= this.firstTGroup.aCoords.br.x
            ) {
              isValidPosition = true
            }
            break
          case PHYSIO_ECG_GROUP_NAME.FIRST_Q:
            if (
              target.aCoords.bl.x >= this.firstPGroup.aCoords.br.x &&
              target.aCoords.br.x <= this.firstRGroup.aCoords.bl.x
            ) {
              isValidPosition = true
            }
            break
          case PHYSIO_ECG_GROUP_NAME.FIRST_R:
            if (
              target.aCoords.bl.x >= this.firstQGroup.aCoords.br.x &&
              target.aCoords.br.x <= this.firstSGroup.aCoords.bl.x
            ) {
              isValidPosition = true
            }
            break
          case PHYSIO_ECG_GROUP_NAME.FIRST_S:
            if (
              target.aCoords.bl.x >= this.firstRGroup.aCoords.br.x &&
              target.aCoords.br.x <= this.firstTGroup.aCoords.bl.x
            ) {
              isValidPosition = true
            }
            break
          case PHYSIO_ECG_GROUP_NAME.FIRST_T:
            if (
              target.aCoords.bl.x >= this.firstSGroup.aCoords.br.x &&
              target.aCoords.br.x <= this.secondPGroup.aCoords.bl.x
            ) {
              isValidPosition = true
            }
            break
          case PHYSIO_ECG_GROUP_NAME.SECOND_P:
            if (
              target.aCoords.bl.x >= this.firstTGroup.aCoords.br.x &&
              target.aCoords.br.x <= this.secondQGroup.aCoords.bl.x
            ) {
              isValidPosition = true
            }
            break
          case PHYSIO_ECG_GROUP_NAME.SECOND_Q:
            if (
              target.aCoords.bl.x >= this.secondPGroup.aCoords.br.x &&
              target.aCoords.br.x <= this.secondRGroup.aCoords.bl.x
            ) {
              isValidPosition = true
            }
            break
          case PHYSIO_ECG_GROUP_NAME.SECOND_R:
            if (
              target.aCoords.bl.x >= this.secondQGroup.aCoords.br.x &&
              target.aCoords.br.x <= this.secondSGroup.aCoords.bl.x
            ) {
              isValidPosition = true
            }
            break
          case PHYSIO_ECG_GROUP_NAME.SECOND_S:
            if (
              target.aCoords.bl.x >= this.secondRGroup.aCoords.br.x &&
              target.aCoords.br.x <= this.secondTGroup.aCoords.bl.x
            ) {
              isValidPosition = true
            }
            break
          case PHYSIO_ECG_GROUP_NAME.SECOND_T:
            if (
              target.aCoords.bl.x >= this.secondSGroup.aCoords.br.x &&
              target.aCoords.br.x - this.cycleDurationDistance <= this.secondPGroup.aCoords.bl.x
            ) {
              isValidPosition = true
            }
            break
          default:
            break
        }

        if (isValidPosition) {
          return true
        }
      }
      return false
    },
    onMoving(e) {
      if (e.target.name && this.allECGGroupNames.includes(e.target.name)) {
        e.target.setCoords()
        let isValid = this.checkIsValidPosition(e.target)

        if (!isValid) {
          e.target.left = this.movingCoordLeft
        } else {
          this.movingCoordLeft = e.target.left
        }

        switch (e.target.name) {
          case PHYSIO_ECG_GROUP_NAME.FIRST_P:
            if (this.secondPGroup) {
              this.secondPGroup.left = this.movingCoordLeft + this.cycleDurationDistance
              this.secondPGroup.setCoords()
              this.canvas.requestRenderAll()
            }
            break
          case PHYSIO_ECG_GROUP_NAME.FIRST_Q:
            if (this.secondQGroup) {
              this.secondQGroup.left = this.movingCoordLeft + this.cycleDurationDistance
              this.secondQGroup.setCoords()
              this.canvas.requestRenderAll()
            }
            break
          case PHYSIO_ECG_GROUP_NAME.FIRST_R:
            if (this.secondRGroup) {
              this.secondRGroup.left = this.movingCoordLeft + this.cycleDurationDistance
              this.secondRGroup.setCoords()
              this.canvas.requestRenderAll()
            }
            break
          case PHYSIO_ECG_GROUP_NAME.FIRST_S:
            if (this.secondSGroup) {
              this.secondSGroup.left = this.movingCoordLeft + this.cycleDurationDistance
              this.secondSGroup.setCoords()
              this.canvas.requestRenderAll()
            }
            break
          case PHYSIO_ECG_GROUP_NAME.FIRST_T:
            if (this.secondTGroup) {
              this.secondTGroup.left = this.movingCoordLeft + this.cycleDurationDistance
              this.secondTGroup.setCoords()
              this.canvas.requestRenderAll()
            }
            break
          case PHYSIO_ECG_GROUP_NAME.SECOND_P:
            if (this.firstPGroup) {
              this.firstPGroup.left = this.movingCoordLeft - this.cycleDurationDistance
              this.firstPGroup.setCoords()
              this.canvas.requestRenderAll()
            }
            break
          case PHYSIO_ECG_GROUP_NAME.SECOND_Q:
            if (this.firstQGroup) {
              this.firstQGroup.left = this.movingCoordLeft - this.cycleDurationDistance
              this.firstQGroup.setCoords()
              this.canvas.requestRenderAll()
            }
            break
          case PHYSIO_ECG_GROUP_NAME.SECOND_R:
            if (this.firstRGroup) {
              this.firstRGroup.left = this.movingCoordLeft - this.cycleDurationDistance
              this.firstRGroup.setCoords()
              this.canvas.requestRenderAll()
            }
            break
          case PHYSIO_ECG_GROUP_NAME.SECOND_S:
            if (this.firstSGroup) {
              this.firstSGroup.left = this.movingCoordLeft - this.cycleDurationDistance
              this.firstSGroup.setCoords()
              this.canvas.requestRenderAll()
            }
            break
          case PHYSIO_ECG_GROUP_NAME.SECOND_T:
            if (this.firstTGroup) {
              this.firstTGroup.left = this.movingCoordLeft - this.cycleDurationDistance
              this.firstTGroup.setCoords()
              this.canvas.requestRenderAll()
            }
            break
          default:
            break
        }
      }
    },
    onModified() {
      this.isPreview = false
      this.onPreviewECGChart(this.isPreview)
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
    onMouseUp() {
      this.canvas.setViewportTransform(this.canvas.viewportTransform)
      this.isDragging = false
      this.isZooming = false
    },
    onMouseDown(e) {
      e.e.preventDefault()

      if (e.target && e.target.name && this.allECGGroupNames.includes(e.target.name)) {
        this.movingCoordLeft = e.target.left
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
        // vpt[5] += e.e.clientY - this.lastPosY
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
    drawXAxis() {
      if (!this.canvas) {
        return
      }

      const line = new fabric.Line([-10000, this.centerY, 10000, this.centerY], {
        stroke: 'red',
        selectable: false,
        evented: false,
      })
      this.canvas.add(line)
    },
    hiddenSelectionControls(object) {
      object.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        bl: false,
        br: false,
        tl: false,
        tr: false,
        mtr: false,
      })
    },
    onDurationDistanceChanged() {
      if (this.secondPGroup && this.firstPGroup) {
        this.secondPGroup.left = this.firstPGroup.left + this.cycleDurationDistance
        this.secondPGroup.setCoords()
      }
      if (this.secondQGroup && this.firstQGroup) {
        this.secondQGroup.left = this.firstQGroup.left + this.cycleDurationDistance
        this.secondQGroup.setCoords()
      }
      if (this.secondRGroup && this.firstRGroup) {
        this.secondRGroup.left = this.firstRGroup.left + this.cycleDurationDistance
        this.secondRGroup.setCoords()
      }
      if (this.secondSGroup && this.firstSGroup) {
        this.secondSGroup.left = this.firstSGroup.left + this.cycleDurationDistance
        this.secondSGroup.setCoords()
      }
      if (this.secondTGroup && this.firstTGroup) {
        this.secondTGroup.left = this.firstTGroup.left + this.cycleDurationDistance
        this.secondTGroup.setCoords()
      }
      if (this.canvas) {
        this.canvas.requestRenderAll()
      }
    },
    drawFirstPGroup() {
      const triangleP = this.drawTriangle(ECGChartConfig.PTriangle)
      const text = this.drawText('P', { top: 0, originY: 'bottom' })
      this.firstPGroup = new fabric.Group([triangleP, text], {
        name: PHYSIO_ECG_GROUP_NAME.FIRST_P,
        top: 200,
        left: 0,
        lockMovementY: true,
        selectable: !this.disabled,
      })
      this.hiddenSelectionControls(this.firstPGroup)
      this.firstPGroup.top = this.centerY - this.firstPGroup.height
      this.canvas.add(this.firstPGroup)
    },
    drawSecondPGroup() {
      const triangleP = this.drawTriangle(ECGChartConfig.PTriangle)
      const text = this.drawText('P', { top: 0, originY: 'bottom' })
      this.secondPGroup = new fabric.Group([triangleP, text], {
        name: PHYSIO_ECG_GROUP_NAME.SECOND_P,
        top: 200,
        left: 0,
        lockMovementY: true,
        selectable: !this.disabled,
      })
      this.hiddenSelectionControls(this.secondPGroup)
      this.secondPGroup.top = this.centerY - this.secondPGroup.height
      this.secondPGroup.left = this.firstPGroup.left + this.cycleDurationDistance
      this.canvas.add(this.secondPGroup)
    },
    drawFirstQGroup() {
      const triangleP = this.drawTriangle(ECGChartConfig.QTriangle)
      const text = this.drawText('Q', { top: 0, originY: 'top' })
      this.firstQGroup = new fabric.Group([triangleP, text], {
        name: PHYSIO_ECG_GROUP_NAME.FIRST_Q,
        top: 200,
        left: 0,
        lockMovementY: true,
        selectable: !this.disabled,
      })
      this.hiddenSelectionControls(this.firstQGroup)
      this.firstQGroup.top = this.centerY
      this.firstQGroup.left =
        this.firstPGroup.left +
        this.firstPGroup.width +
        _.get(this.initialContinuousecgData, ['distanceFromPToQ'], 0) / ECG_DISTANCE_RATE
      this.canvas.add(this.firstQGroup)
    },
    drawSecondQGroup() {
      const triangleP = this.drawTriangle(ECGChartConfig.QTriangle)
      const text = this.drawText('Q', { top: 0, originY: 'top' })
      this.secondQGroup = new fabric.Group([triangleP, text], {
        name: PHYSIO_ECG_GROUP_NAME.SECOND_Q,
        top: 200,
        left: 0,
        lockMovementY: true,
        selectable: !this.disabled,
      })
      this.hiddenSelectionControls(this.secondQGroup)
      this.secondQGroup.top = this.centerY
      this.secondQGroup.left = this.firstQGroup.left + this.cycleDurationDistance
      this.canvas.add(this.secondQGroup)
    },
    drawFirstRGroup() {
      const triangleP = this.drawTriangle(ECGChartConfig.RTriangle)
      const text = this.drawText('R', { top: 0, originY: 'bottom' })
      this.firstRGroup = new fabric.Group([triangleP, text], {
        name: PHYSIO_ECG_GROUP_NAME.FIRST_R,
        top: 200,
        left: 0,
        lockMovementY: true,
        selectable: !this.disabled,
      })
      this.hiddenSelectionControls(this.firstRGroup)
      this.firstRGroup.top = this.centerY - this.firstRGroup.height
      this.firstRGroup.left =
        this.firstQGroup.left +
        this.firstQGroup.width +
        _.get(this.initialContinuousecgData, ['distanceFromQToR'], 0) / ECG_DISTANCE_RATE
      this.canvas.add(this.firstRGroup)
    },
    drawSecondRGroup() {
      const triangleP = this.drawTriangle(ECGChartConfig.RTriangle)
      const text = this.drawText('R', { top: 0, originY: 'bottom' })
      this.secondRGroup = new fabric.Group([triangleP, text], {
        name: PHYSIO_ECG_GROUP_NAME.SECOND_R,
        top: 200,
        left: 0,
        lockMovementY: true,
        selectable: !this.disabled,
      })
      this.hiddenSelectionControls(this.secondRGroup)
      this.secondRGroup.top = this.centerY - this.secondRGroup.height
      this.secondRGroup.left = this.firstRGroup.left + this.cycleDurationDistance
      this.canvas.add(this.secondRGroup)
    },
    drawFirstSGroup() {
      const triangleP = this.drawTriangle(ECGChartConfig.STriangle)
      const text = this.drawText('S', { top: 0, originY: 'top' })
      this.firstSGroup = new fabric.Group([triangleP, text], {
        name: PHYSIO_ECG_GROUP_NAME.FIRST_S,
        top: 200,
        left: 0,
        lockMovementY: true,
        selectable: !this.disabled,
      })
      this.hiddenSelectionControls(this.firstSGroup)
      this.firstSGroup.top = this.centerY
      this.firstSGroup.left =
        this.firstRGroup.left +
        this.firstRGroup.width +
        _.get(this.initialContinuousecgData, ['distanceFromRToS'], 0) / ECG_DISTANCE_RATE
      this.canvas.add(this.firstSGroup)
    },
    drawSecondSGroup() {
      const triangleP = this.drawTriangle(ECGChartConfig.STriangle)
      const text = this.drawText('S', { top: 0, originY: 'top' })
      this.secondSGroup = new fabric.Group([triangleP, text], {
        name: PHYSIO_ECG_GROUP_NAME.SECOND_S,
        top: 200,
        left: 0,
        lockMovementY: true,
        selectable: !this.disabled,
      })
      this.hiddenSelectionControls(this.secondSGroup)
      this.secondSGroup.top = this.centerY
      this.secondSGroup.left = this.firstSGroup.left + this.cycleDurationDistance
      this.canvas.add(this.secondSGroup)
    },
    drawFirstTGroup() {
      const triangleT = this.drawTriangle(ECGChartConfig.TTriangle)
      const text = this.drawText('T', { top: 0, originY: 'bottom' })
      this.firstTGroup = new fabric.Group([triangleT, text], {
        name: PHYSIO_ECG_GROUP_NAME.FIRST_T,
        top: 200,
        left: 0,
        lockMovementY: true,
        selectable: !this.disabled,
      })
      this.hiddenSelectionControls(this.firstTGroup)
      this.firstTGroup.top = this.centerY - this.firstTGroup.height
      this.firstTGroup.left =
        this.firstSGroup.left +
        this.firstSGroup.width +
        _.get(this.initialContinuousecgData, ['distanceFromSToT'], 50 * ECG_DISTANCE_RATE) / ECG_DISTANCE_RATE
      this.canvas.add(this.firstTGroup)
    },
    drawSecondTGroup() {
      const triangleT = this.drawTriangle(ECGChartConfig.TTriangle)
      const text = this.drawText('T', { top: 0, originY: 'bottom' })
      this.secondTGroup = new fabric.Group([triangleT, text], {
        name: PHYSIO_ECG_GROUP_NAME.SECOND_T,
        top: 200,
        left: 0,
        lockMovementY: true,
        selectable: !this.disabled,
      })
      this.hiddenSelectionControls(this.secondTGroup)
      this.secondTGroup.top = this.centerY - this.secondTGroup.height
      this.secondTGroup.left = this.firstTGroup.left + this.cycleDurationDistance
      this.canvas.add(this.secondTGroup)
    },
    drawTriangle(triangleInfo) {
      const triangle = new fabric.Triangle({
        ...triangleInfo,
        originX: 'center',
        centeredRotation: true,
        strokeWidth: 1,
        stroke: '#000000',
      })

      return triangle
    },
    drawText(text = '', textParams = {}) {
      const triangle = new fabric.Text(text, {
        ...textParams,
        originX: 'center',
        fontSize: 20,
      })

      return triangle
    },
    getWaveWidth() {
      return _.round(
        Math.abs(
          _.get(this.firstTGroup, ['left'], 0) +
            _.get(this.firstTGroup, ['width'], 0) -
            _.get(this.firstPGroup, ['left'], 0)
        ) * ECG_DISTANCE_RATE
      )
    },
    getExtraWaveInfo() {
      return {
        centerRToCenterT:
          (_.get(this.firstTGroup, ['left'], 0) +
            _.get(this.firstTGroup, ['width'], 0) / 2 -
            (_.get(this.firstRGroup, ['left'], 0) + _.get(this.firstRGroup, ['width'], 0) / 2)) *
          ECG_DISTANCE_RATE,
        startPToCenterR:
          (_.get(this.firstRGroup, ['left'], 0) +
            _.get(this.firstRGroup, ['width'], 0) / 2 -
            _.get(this.firstPGroup, ['left'], 0)) *
          ECG_DISTANCE_RATE,
        centerTToEnd: (_.get(this.firstTGroup, ['width'], 0) / 2) * ECG_DISTANCE_RATE,
      }
    },
    generateRandomBadBeatsArray() {
      if (
        this.badBeats == BAD_BEATS.RANDOM_ONE_FOURTH ||
        this.badBeats == BAD_BEATS.RANDOM_ONE_EIGHTH ||
        this.badBeats == BAD_BEATS.RANDOM_ONE_SIXTEENTH
      ) {
        let numOfWaveHasBadBeats = 4
        if (this.badBeats == BAD_BEATS.RANDOM_ONE_FOURTH) {
          numOfWaveHasBadBeats = 4
        } else if (this.badBeats == BAD_BEATS.RANDOM_ONE_EIGHTH) {
          numOfWaveHasBadBeats = 8
        } else if (this.badBeats == BAD_BEATS.RANDOM_ONE_SIXTEENTH) {
          numOfWaveHasBadBeats = 16
        }
        this.randomWaveBadbeatsArray = []
        for (let i = 0; i < 2000; i++) {
          let randomList = new Array(numOfWaveHasBadBeats).fill(null).map((el, index) => index)
          const randomValue = randomList[Math.floor(Math.random() * numOfWaveHasBadBeats)]
          randomList = randomList.map((el) => Boolean(el == randomValue))
          this.randomWaveBadbeatsArray = [...this.randomWaveBadbeatsArray, ...randomList]
        }
      } else {
        this.randomWaveBadbeatsArray = []
      }
    },
    onPreviewECGChart(isPreview) {
      const waveWidth = this.getWaveWidth()
      this.generateRandomBadBeatsArray()

      if (this.isPreview != isPreview) {
        this.setIsPause(false)
      }

      // const continuousECGData = this.generateECGContinuousGroupData()

      this.$emit('ecgDataChange', isPreview, {
        // data: continuousECGData,
        waveWidth: waveWidth,
        randomWaveBadbeatsArray: this.randomWaveBadbeatsArray,
        distanceFromSToT: this.distanceFromSToT,
        distanceFromPToQ: this.distanceFromPToQ,
        distanceFromQToR: this.distanceFromQToR,
        distanceFromRToS: this.distanceFromRToS,
        ...this.getExtraWaveInfo(),
      })
    },
    getECGData() {
      const waveWidth = this.getWaveWidth()
      this.generateRandomBadBeatsArray()

      // const continuousECGData = this.generateECGContinuousGroupData()

      return {
        // data: continuousECGData,
        waveWidth: waveWidth,
        randomWaveBadbeatsArray: this.randomWaveBadbeatsArray,
        distanceFromSToT: this.distanceFromSToT,
        distanceFromPToQ: this.distanceFromPToQ,
        distanceFromQToR: this.distanceFromQToR,
        distanceFromRToS: this.distanceFromRToS,
        ...this.getExtraWaveInfo(),
      }
    },
  },
}
</script>
<style lang="scss" scoped>
.physio-ecg-chart-wrapper {
  background: #ffffff;
  height: 400px;
  position: relative;
  border-radius: 8px;
  border: solid 1px #000;
  .btn-preview {
    position: absolute;
    z-index: 1;
    right: 20px;
    bottom: 20px;
  }

  .group-bottom-left-buttons {
    position: absolute;
    z-index: 1;
    left: 20px;
    bottom: 20px;
  }
}
</style>
