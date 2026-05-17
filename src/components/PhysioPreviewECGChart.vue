<template>
  <div>
    <div v-if="isShowPhysioCanvas">
      <PhysioCanvas
        :is-preview="isPreview"
        :duration="duration"
        :continuousecg-data="continuousecgData"
        :cardiac-cycle-duration="cardiacCycleDuration"
        :cardiac-cycle-deviation="cardiacCycleDeviation"
        :bad-beats="badBeats"
        :wave-no="waveNo"
        :bad-beats-duration="badBeatsDuration"
        :wave-duration="waveDuration"
        :next-wave-duration="nextWaveDuration"
      />
    </div>
    <div
      :class="{ 'mt-2': isShowPhysioCanvas }"
      :style="`${!isCardiacAcquisitionQuestion && 'min-height: 300px;'} width: 100%; position: relative`"
    >
      <span style="position: absolute; top: 12px; left: 12px; color: #ffff00; z-index: 2" v-if="averageWaveDuration">
        {{ averageWaveDuration }}
      </span>
      <div
        ref="container"
        :style="height ? { backgroundColor: '#000', height } : { backgroundColor: '#000', aspectRatio: 5 / 3 }"
      >
        <canvas :ref="canvasId" :id="canvasId"></canvas>
      </div>
      <div class="d-flex mt-2 pb-4">
        <div class="d-flex flex-grow-1">
          <v-slider
            :label="$t('Injector.duration')"
            v-model.number="currentTotalTime"
            :min="2"
            :step="1"
            :max="10"
            ticks
            class="duration-slider"
          ></v-slider>
          <span>{{ currentTotalTime }}</span>
        </div>
        <div v-if="isCardiacAcquisitionQuestion" class="w-40 cardiac-form-field">
          <div class="slice-form slice-form-ct">
            <div class="label-with-unit">
              <label>{{ $t('global.scan_duration') }}</label>
            </div>
            <v-text-field :type="'text'" outlined dense rounded class="mt-1" v-model="scanTimeCT" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import _ from 'lodash'
import PhysioCanvas from '../components/PhysioCanvas.vue'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import ChartAnnotation from 'chartjs-plugin-annotation'
import { Chart as ChartJS, registerables } from 'chart.js'
import { BAD_BEATS, ECG_DISTANCE_RATE, ECGChartConfig, PHYSIO_UNIT } from '../constants'
import { mapState } from 'vuex/dist/vuex.common.js'
import { getWaveDurationByProps } from '../util/utils'
import { SplineCurve, Vector2 } from 'three'
import { mapGetters } from 'vuex'

ChartJS.register(...registerables, ChartAnnotation, ChartDataLabels)

const delayTime = 1
export default {
  name: 'PhysioPreviewECGChart',
  components: {
    PhysioCanvas,
  },
  props: {
    canvasId: {
      type: String,
      default: 'physioPreviewECGChartContainer',
    },
    isShowPhysioCanvas: {
      type: Boolean,
      default: true,
    },
    height: {
      type: String,
      default: '280px',
    },
    maxY: {
      type: Number,
      default: 180,
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
    isPreview: {
      type: Boolean,
      default: false,
    },
    unit: {
      type: Number,
      default: PHYSIO_UNIT.MS,
    },
    badBeatsDuration: {
      type: Object,
      default: () => ({
        isRange: false,
        min: 400,
        max: 400,
      }),
    },
  },
  computed: {
    ...mapState('physioService', ['isSlow', 'isPause']),
    ...mapGetters('questionService', ['isCardiacAcquisitionQuestion']),
    displayTimePerSecond() {
      if (this.isSlow) {
        return 0.1
      } else {
        return 1
      }
    },
    dataLength() {
      return _.round(this.currentTotalTime * 1000)
    },
    chartLabel() {
      return new Array(this.dataLength).fill('0')
    },
    currentDistanceFromSToT() {
      return this.getDistanceFromSToT(this.waveDuration)
    },
    distanceFromTwoWave() {
      return this.getDistanceFromTwoWave(this.waveDuration)
    },
    fromStartToEndS() {
      return (
        ECGChartConfig.PTriangle.width * ECG_DISTANCE_RATE +
        this.continuousecgData.distanceFromPToQ +
        ECGChartConfig.QTriangle.width * ECG_DISTANCE_RATE +
        _.get(this.continuousecgData, 'distanceFromQToR', 0) +
        ECGChartConfig.RTriangle.width * ECG_DISTANCE_RATE +
        _.get(this.continuousecgData, 'distanceFromRToS', 0) +
        ECGChartConfig.STriangle.width * ECG_DISTANCE_RATE
      )
    },
    currentWaveWidth() {
      if (this.waveDuration != this.cardiacCycleDuration) {
        const TWidth = ECGChartConfig.TTriangle.width * ECG_DISTANCE_RATE

        return _.round(this.fromStartToEndS + this.currentDistanceFromSToT + TWidth)
      } else {
        return this.continuousecgData.waveWidth
      }
    },
    continuousecgDataValues() {
      return _.map(this.generateECGContinuousGroupData(), (el) => el.value)
    },
    averageWaveDuration() {
      return this.waveDurationDataLabelInfos.length > 0
        ? this.convertByCurrentUnit(_.round(_.meanBy(this.waveDurationDataLabelInfos, 'duration')))
        : null
    },
    waveCardiacCycleIndexAndWidth() {
      const data = []
      if (this.waveCardiacCycleInfos.length > 1) {
        for (let i = 0; i < this.waveCardiacCycleInfos.length - 1; i++) {
          const currentIndex = this.waveCardiacCycleInfos[i]
          const nextIndex = this.waveCardiacCycleInfos[i + 1]
          const distance = (nextIndex - currentIndex) / 20

          for (let j = 0; j < 20; j++) {
            data.push({
              index: _.round(currentIndex + (j + 0.5) * distance),
              width: Math.max(10, distance - 10),
            })
          }
        }
      }
      return data.filter((el) => el.index > 0)
    },
    isPauseAnimation() {
      return this.isPause || !this.isCurrentTabActive
    },
  },
  watch: {
    dataLength() {
      this.onUpdateChartDataLength()
    },
    chartLabel() {
      this.onUpdateChartLabel()
    },
    isPreview() {
      this.onUpdateChartData()
    },
    isPauseAnimation() {
      this.lastUpdate = Date.now()
      this.destroyAnimationFrame()
      if (!this.isPauseAnimation && this.isPreview) {
        this.playAnimation()
      }
    },
    // continuousecgDataValues() {
    //   this.onUpdateChartData()
    // },
  },
  data() {
    return {
      lastUpdate: null,
      timeOutStartAnimation: null,
      requestAnimationId: null,
      continuousECGDataIndex: 0,
      waveNo: 0,
      currentTotalTime: 3,
      duration: 0,
      nextWaveDuration: 0,
      waveDurations: [],
      waveDurationDataLabelInfos: [],
      // Save position of R
      waveCardiacCycleInfos: [],
      waveDuration: 1000,
      scanTimeCT: 10,
      isCurrentTabActive: true,
    }
  },
  mounted() {
    const ctxChart = this.$refs[this.canvasId].getContext('2d')
    const boundingRec = this.$refs.container.getBoundingClientRect()

    this.physioPreviewECGChart = new ChartJS(ctxChart, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Value',
            data: [],
            fill: false,
            borderColor: '#ffffff',
            backgroundColor: '#ffffff',
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        aspectRatio: boundingRec.width / boundingRec.height,
        animation: {
          duration: 0,
        },
        scales: {
          y: {
            display: true,
            min: -50,
            max: this.maxY,
            border: {
              display: false,
              color: '#4472c4',
            },
            ticks: {
              display: false,
            },
          },
          x: {
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
          datalabels: {
            formatter: (value, context) => {
              const waveDurationDataLabelInfo = this.waveDurationDataLabelInfos.find(
                (el) => el.index == context.dataIndex
              )
              if (context.dataset.label == 'Value' && waveDurationDataLabelInfo) {
                // Magic to move this label to viewport
                // Can't adjust with any property of datalabels
                return `${this.convertByCurrentUnit(waveDurationDataLabelInfo.duration)}`
              }
              return null
            },
            textStrokeWidth: 0.1,
            borderWidth: 0.1,
            color: '#00ff00',
            align: 'bottom',
            anchor: 'center',
            offset: 1,
            font: {
              size: 16,
              style: 'normal',
              weight: 'normal',
            },
          },
          annotation: {
            annotations: {},
          },
        },
      },
      plugins: [ChartDataLabels],
    })

    this.physioPreviewECGChart.resize()

    const previousY = (ctx) => {
      return ctx.index === 0
        ? ctx.chart.scales.y.getPixelForValue(100)
        : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1]?.getProps(['y'], true)?.y || 0
    }
    const animation = {
      x: {
        type: 'number',
        easing: 'linear',
        duration: delayTime,
        from: NaN, // the point is initially skipped
        delay(ctx) {
          if (ctx.type !== 'data' || ctx.xStarted) {
            return 0
          }
          ctx.xStarted = true
          return ctx.index * delayTime
        },
      },
      y: {
        type: 'number',
        easing: 'linear',
        duration: delayTime,
        from: previousY,
        delay(ctx) {
          if (ctx.type !== 'data' || ctx.yStarted) {
            return 0
          }
          ctx.yStarted = true
          return ctx.index * delayTime
        },
      },
    }
    this.physioPreviewECGChart.options.animation = animation

    document.addEventListener('visibilitychange', this.onVisibleChange)
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    this.destroyAnimationFrame()
    this.destroyTimeOutStartAnimation()
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onVisibleChange)
  },
  methods: {
    onResize() {
      if (this.physioPreviewECGChart) {
        const boundingRec = this.$refs.container.getBoundingClientRect()
        this.physioPreviewECGChart.options.aspectRatio = boundingRec.width / boundingRec.height
        this.physioPreviewECGChart.resize(boundingRec.width, boundingRec.height)
      }
    },
    onVisibleChange() {
      this.isCurrentTabActive = !document.hidden
    },
    generateECGGroupData(initialMilliseconds = 0) {
      let data = []
      // P process
      data.push(
        {
          label: 0,
          value: 0,
        },
        {
          label: (ECGChartConfig.PTriangle.width / 2) * ECG_DISTANCE_RATE,
          value: ECGChartConfig.PTriangle.height,
        },
        {
          label: ECGChartConfig.PTriangle.width * ECG_DISTANCE_RATE,
          value: 0,
        }
      )

      // QRS process
      const startOfQProcessMilliseconds =
        ECGChartConfig.PTriangle.width * ECG_DISTANCE_RATE + this.continuousecgData.distanceFromPToQ
      const startOfRProcessMilliseconds =
        ECGChartConfig.PTriangle.width * ECG_DISTANCE_RATE +
        this.continuousecgData.distanceFromPToQ +
        ECGChartConfig.QTriangle.width * ECG_DISTANCE_RATE +
        _.get(this.continuousecgData, 'distanceFromQToR', 0)
      const startOfSProcessMilliseconds =
        ECGChartConfig.PTriangle.width * ECG_DISTANCE_RATE +
        this.continuousecgData.distanceFromPToQ +
        ECGChartConfig.QTriangle.width * ECG_DISTANCE_RATE +
        _.get(this.continuousecgData, 'distanceFromQToR', 0) +
        ECGChartConfig.RTriangle.width * ECG_DISTANCE_RATE +
        _.get(this.continuousecgData, 'distanceFromRToS', 0)
      data.push(
        {
          label: startOfQProcessMilliseconds,
          value: 0,
        },
        {
          label: (ECGChartConfig.QTriangle.width / 2) * ECG_DISTANCE_RATE + startOfQProcessMilliseconds,
          value: -ECGChartConfig.QTriangle.height,
        },
        {
          label: ECGChartConfig.QTriangle.width * ECG_DISTANCE_RATE + startOfQProcessMilliseconds,
          value: 0,
        },
        {
          label: startOfRProcessMilliseconds,
          value: 0,
        },
        {
          label: (ECGChartConfig.RTriangle.width / 2) * ECG_DISTANCE_RATE + startOfRProcessMilliseconds,
          value: ECGChartConfig.RTriangle.height,
        },
        {
          label: ECGChartConfig.RTriangle.width * ECG_DISTANCE_RATE + startOfRProcessMilliseconds,
          value: 0,
        },
        {
          label: startOfSProcessMilliseconds,
          value: 0,
        },
        {
          label: (ECGChartConfig.STriangle.width / 2) * ECG_DISTANCE_RATE + startOfSProcessMilliseconds,
          value: -ECGChartConfig.STriangle.height,
        },
        {
          label: ECGChartConfig.STriangle.width * ECG_DISTANCE_RATE + startOfSProcessMilliseconds,
          value: 0,
        }
      )

      const curve = new SplineCurve([
        new Vector2(0, 0),
        new Vector2(
          (ECGChartConfig.TTriangle.width / 4) * ECG_DISTANCE_RATE,
          (ECGChartConfig.TTriangle.height * 4) / 5
        ),
        new Vector2((ECGChartConfig.TTriangle.width / 2) * ECG_DISTANCE_RATE, ECGChartConfig.TTriangle.height),
        new Vector2(
          ((ECGChartConfig.TTriangle.width * 3) / 4) * ECG_DISTANCE_RATE,
          (ECGChartConfig.TTriangle.height * 4) / 5
        ),
        new Vector2(ECGChartConfig.TTriangle.width * ECG_DISTANCE_RATE, 0),
      ])
      const tPoints = curve.getPoints(ECGChartConfig.TTriangle.width * ECG_DISTANCE_RATE)

      // T process
      const startOfTProcessMilliseconds =
        ECGChartConfig.PTriangle.width * ECG_DISTANCE_RATE +
        this.continuousecgData.distanceFromPToQ +
        ECGChartConfig.QTriangle.width * ECG_DISTANCE_RATE +
        _.get(this.continuousecgData, 'distanceFromQToR', 0) +
        ECGChartConfig.RTriangle.width * ECG_DISTANCE_RATE +
        _.get(this.continuousecgData, 'distanceFromRToS', 0) +
        ECGChartConfig.STriangle.width * ECG_DISTANCE_RATE +
        this.currentDistanceFromSToT
      for (const point of tPoints) {
        data.push({
          label: point.x + startOfTProcessMilliseconds,
          value: point.y,
        })
      }

      data = data.map((el) => {
        el.label = _.round(el.label + initialMilliseconds)
        return el
      })

      data = this.fillDataToECGData(data)
      return data
    },
    fillDataToECGData(initialData = []) {
      let cloneData = _.sortBy(initialData, 'label')
      let revertCloneData = _.reverse(_.sortBy(initialData, 'label'))
      const minTimeline = _.minBy(cloneData, 'label')
      const maxTimeline = _.maxBy(cloneData, 'label')

      let data = []
      for (let i = minTimeline.label; i <= maxTimeline.label; i++) {
        const prevValue = revertCloneData.find((el) => el.label <= i)
        const nextValue = cloneData.find((el) => el.label >= i)
        if (prevValue && nextValue && nextValue.label - prevValue.label > 0) {
          const step = (nextValue.value - prevValue.value) / (nextValue.label - prevValue.label)
          data.push({
            label: i,
            value: prevValue.value + step * (i - prevValue.label),
          })
        } else if (prevValue) {
          data.push(prevValue)
        } else if (nextValue) {
          data.push(prevValue)
        }
      }

      return data
    },
    generateECGContinuousGroupData() {
      let firstWaveData = this.generateECGGroupData(0)
      firstWaveData = this.fillDataToECGData(firstWaveData)

      return firstWaveData
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
    convertByCurrentUnit(value) {
      if (this.unit == PHYSIO_UNIT.BPM) {
        return this.msToBpm(value)
      }
      return value
    },
    msToBpm(value) {
      return 60 + _.round((1000 - value) / 20)
    },
    bmpToMs(value) {
      return _.round(1000 - (value - 60) * 20, 0)
    },
    destroyTimeOutStartAnimation() {
      if (this.timeOutStartAnimation) {
        clearTimeout(this.timeOutStartAnimation)
      }
    },
    destroyAnimationFrame() {
      if (this.requestAnimationId) {
        const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
        cancelAnimationFrame(this.requestAnimationId)
        this.requestAnimationId = null
      }
    },
    onUpdateChartDataLength() {
      if (!this.physioPreviewECGChart) {
        return
      }
      if (!this.isPreview) {
        return
      }

      const dataset = this.physioPreviewECGChart.data.datasets.find((el) => el.label == 'Value')
      if (dataset && dataset.data.length > this.dataLength) {
        this.increaseWaveDurationDataLabelInfosStep(dataset.data.length - this.dataLength)
        dataset.data = dataset.data.slice(dataset.data.length - this.dataLength, dataset.data.length)
        this.physioPreviewECGChart.update('none')
      }
    },
    onUpdateChartLabel() {
      if (!this.physioPreviewECGChart) {
        return
      }
      if (!this.isPreview) {
        return
      }

      this.physioPreviewECGChart.data.labels = this.chartLabel
      this.physioPreviewECGChart.update('none')
    },
    onUpdateChartData() {
      this.destroyAnimationFrame()
      this.destroyTimeOutStartAnimation()

      if (!this.physioPreviewECGChart) {
        return
      }
      if (!this.isPreview) {
        return
      }
      const dataset = this.physioPreviewECGChart.data.datasets.find((el) => el.label == 'Value')

      this.physioPreviewECGChart.data.labels = []
      if (dataset) {
        dataset.data = []
        this.physioPreviewECGChart.update('none')
      }

      this.physioPreviewECGChart.data.labels = this.chartLabel
      if (dataset) {
        dataset.data = []
        this.physioPreviewECGChart.update()

        this.timeOutStartAnimation = setTimeout(() => {
          this.lastUpdate = Date.now()
          this.continuousECGDataIndex = 0
          this.waveNo = 0
          this.duration = 0
          this.waveDurations = []
          this.waveDurationDataLabelInfos = []
          this.waveCardiacCycleInfos = []
          this.waveDuration = this.getWaveDuration(this.waveNo)
          this.nextWaveDuration = this.getWaveDuration(this.waveNo + 1)
          this.waveDurations = [...this.waveDurations, _.round(this.waveDuration)]

          const rWaveIndex = _.round(this.distanceFromTwoWave + this.continuousecgData.startPToCenterR)
          this.waveCardiacCycleInfos = [rWaveIndex]

          this.playAnimation()
        }, 0)
      }
    },
    getWaveDuration(waveNo) {
      return getWaveDurationByProps(
        waveNo,
        this.continuousecgData.waveWidth,
        this.badBeats,
        this.cardiacCycleDuration,
        this.cardiacCycleDeviation,
        this.continuousecgData.randomWaveBadbeatsArray,
        this.badBeatsDuration
      )
    },
    updateDeltaTime() {
      const now = Date.now()
      const delta = now - this.lastUpdate
      return delta
    },
    increaseWaveDurationDataLabelInfosStep(numOfStep) {
      this.waveDurationDataLabelInfos = this.waveDurationDataLabelInfos
        .map((el) => {
          return {
            index: el.index - numOfStep,
            duration: el.duration,
          }
        })
        .filter((el) => el.index >= 0)

      this.waveCardiacCycleInfos = this.waveCardiacCycleInfos.map((el) => el - numOfStep)
      const lastIndexWaveInChart = this.waveCardiacCycleInfos.findIndex(
        (el, index) =>
          el < 0 && _.has(this.waveCardiacCycleInfos, [index + 1]) && this.waveCardiacCycleInfos[index + 1] > 0
      )
      this.waveCardiacCycleInfos = this.waveCardiacCycleInfos.filter((el, index) => index >= lastIndexWaveInChart)
    },
    playAnimation() {
      const now = Date.now()
      const delta = this.updateDeltaTime()
      const step = _.round(delta * this.displayTimePerSecond)
      if (step > 0 && !this.isPauseAnimation) {
        this.duration = this.duration + step
        let data = [...new Array(this.distanceFromTwoWave).fill(0), ...this.continuousecgDataValues]
        if (step < data.length && data.length > 0) {
          // Update chart
          if (!this.physioPreviewECGChart) {
            this.lastUpdate = now
            return
          }
          const dataset = this.physioPreviewECGChart.data.datasets.find((el) => el.label == 'Value')
          // const ecgRectangleLabelDataset = this.physioPreviewECGChart.data.datasets.find((el) => el.label == 'Ecg')
          const centerWave = _.round(this.distanceFromTwoWave / 2)
          const rWaveIndex = _.round(this.distanceFromTwoWave + this.continuousecgData.startPToCenterR)

          if (dataset) {
            const startIndex = this.continuousECGDataIndex
            const endIndex = (this.continuousECGDataIndex + step) % data.length
            if (endIndex > startIndex) {
              const cutData = data.slice(startIndex, endIndex)
              if (dataset.data.length + cutData.length > this.dataLength) {
                dataset.data = dataset.data.slice(step, dataset.data.length).concat(cutData)
                this.increaseWaveDurationDataLabelInfosStep(step)
              } else {
                dataset.data = dataset.data.concat(cutData)
              }

              if (startIndex <= centerWave && endIndex >= centerWave) {
                for (let i = startIndex; i <= endIndex; i++) {
                  if (
                    i == centerWave &&
                    !this.waveDurationDataLabelInfos.find((el) => el.index == dataset.data.length - 1 - (endIndex - i))
                  ) {
                    this.waveDurationDataLabelInfos = [
                      ...this.waveDurationDataLabelInfos,
                      {
                        index: dataset.data.length - 1 - (endIndex - i),
                        duration: _.round(_.get(this.waveDurations, [this.waveDurations.length - 1], 0)),
                      },
                    ]
                  }
                }
              }

              if (startIndex <= rWaveIndex && endIndex >= rWaveIndex) {
                for (let i = startIndex; i <= endIndex; i++) {
                  if (i == rWaveIndex) {
                    const nextDistanceFromTwoWave = this.getDistanceFromTwoWave(this.nextWaveDuration)
                    const nextCardiacCycleWidth = _.round(
                      nextDistanceFromTwoWave +
                        this.fromStartToEndS +
                        this.currentDistanceFromSToT +
                        ECGChartConfig.TTriangle.width * ECG_DISTANCE_RATE
                    )
                    this.waveCardiacCycleInfos = [
                      ...this.waveCardiacCycleInfos,
                      dataset.data.length - 1 - (endIndex - i) + nextCardiacCycleWidth,
                    ]
                  }
                }
              }

              this.continuousECGDataIndex = (this.continuousECGDataIndex + step) % data.length
            } else {
              let cutDataBack = data.slice(startIndex, data.length)
              this.continuousECGDataIndex = (this.continuousECGDataIndex + step) % data.length

              this.waveNo = this.waveNo + 1
              this.waveDuration = this.nextWaveDuration
              this.nextWaveDuration = this.getWaveDuration(this.waveNo + 1)
              this.waveDurations = [...this.waveDurations, _.round(this.waveDuration)]
              data = [...new Array(this.distanceFromTwoWave).fill(0), ...this.continuousecgDataValues]
              let cutDataFront = data.slice(0, endIndex)

              if (dataset.data.length + cutDataBack.length + cutDataFront.length > this.dataLength) {
                dataset.data = dataset.data.slice(step, dataset.data.length).concat(cutDataBack).concat(cutDataFront)
                this.increaseWaveDurationDataLabelInfosStep(step)
              } else {
                dataset.data = dataset.data.concat(cutDataBack).concat(cutDataFront)
              }

              const centerWave = _.round(this.distanceFromTwoWave / 2)

              if (0 <= centerWave && endIndex >= centerWave) {
                for (let i = 0; i <= endIndex; i++) {
                  if (
                    i == centerWave &&
                    !this.waveDurationDataLabelInfos.find((el) => el.index == dataset.data.length - 1 - (endIndex - i))
                  ) {
                    this.waveDurationDataLabelInfos = [
                      ...this.waveDurationDataLabelInfos,
                      {
                        index: dataset.data.length - 1 - (endIndex - i),
                        duration: _.round(_.get(this.waveDurations, [this.waveDurations.length - 1], 0)),
                      },
                    ]
                  }
                }
              }
            }

            // Draw annotation
            const cardiacCycleAnnotationInfos = this.waveCardiacCycleIndexAndWidth.filter(
              (el) => el.index > 0 && el.index < dataset.data.length
            )

            this.physioPreviewECGChart.options.plugins.annotation.annotations = {}
            cardiacCycleAnnotationInfos.forEach((el, index) => {
              this.physioPreviewECGChart.options.plugins.annotation.annotations[`box${index}`] = {
                type: 'box',
                xMin: Math.max(0, _.round(el.index - el.width / 2)),
                xMax: Math.min(this.dataLength - 1, _.round(el.index + el.width / 2)),
                yMin: 145,
                yMax: 155,
                backgroundColor: '#4472C4',
                borderWidth: 0,
              }
            })

            this.physioPreviewECGChart.update('none')
          }

          this.lastUpdate = now
        } else {
          this.lastUpdate = now
          return
        }
      } else {
        this.lastUpdate = now
      }
      this.requestAnimationId = window.requestAnimationFrame(this.playAnimation)
    },
  },
}
</script>
<style lang="scss">
.duration-slider {
  .v-input__control {
    .v-messages {
      display: none;
    }
    .v-input__slot {
      margin-bottom: 0;
      label {
        margin-bottom: 0;
      }
    }
  }
}
</style>
