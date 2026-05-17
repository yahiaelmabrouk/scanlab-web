<template>
  <div
    :style="{ height: height, width: '100%', position: 'relative' }"
    class="d-flex align-items-center justify-content-center"
    @mouseup="onMouseup"
    @mousedown="onMouseDown"
  >
    <div class="preview-current-seconds" v-if="shouldAddMovedLineAnnotation">
      <span>{{ `${desplayCurrentSeconds}s` }}</span>
    </div>
    <canvas ref="timingDecisionChartContainer" id="timingDecisionChartContainer"></canvas>
    <div class="loading-overlay" :class="{ show: isPreview ? isShowLoading : (isShowLoading || preloadPercent != 100) }">
      <v-progress-circular indeterminate></v-progress-circular>
    </div>
  </div>
</template>

<script>
import ChartDataLabels from 'chartjs-plugin-datalabels'
import ChartAnnotation from 'chartjs-plugin-annotation'
import { Chart as ChartJS, registerables } from 'chart.js'
import {
  NUM_OF_BODY_MAP_IMAGES,
  RANDOM_COLORS,
  ROI_STATUS,
  PHYSIOLOGICAL_DELAY_SECONDS,
  getPresentationBodyMapSteps,
} from '../constants'
import { mapActions, mapGetters, mapState } from 'vuex'
import EventBus from '@/lib/event-bus'
import _ from 'lodash'
let lastEvent
let lastMoveEvent

ChartJS.register(...registerables, ChartDataLabels, ChartAnnotation)
let element = null
let timingDecisionChart = null
export default {
  name: 'TimingDecisionChartView',
  props: {
    isPreview: {
      type: Boolean,
      default: false,
    },
    previewData: {
      type: Object,
      default: null,
    },
    height: {
      type: String,
      default: 'calc(40vh + 95px)',
    },
  },
  data() {
    return {
      NUM_OF_BODY_MAP_IMAGES,
      ROI_STATUS,
      // timingDecisionChart: null,
      totalStepOnChart: 30,
      getPresentationBodyMapSteps,
      isShowLoading: false,
      timeOutUpdateProbe: null,
    }
  },
  computed: {
    ...mapState('questionService', [
      'timingDecisionHUTriggerThreshold',
      'timingDecisionBrightnessData',
      'timingDecisionFlouroFrameRate',
      'presentationTimingDecisionStep',
      'presentationPreviewTimingDecisionStep',
      'roiStatus',
      'delayTimeFromTimingDecisionStartByQuestion',
      'userAnswers',
    ]),
    ...mapGetters('questionService', [
      'stackQuestion',
      'stackQuestions',
      'isAnsweredCurrentQuestion',
      'visibleProbeNames',
      'patientPhysioInfoStrokeVolume',
    ]),
    ...mapGetters('timingDecisionService', [
      'isSelectedTestBolusTimingDecision',
      'isSelectedBolusTrackingTimingDecision',
      'preloadPercent',
    ]),
    ...mapState('timingDecisionService', ['probeData']),
    ...mapState('stackService', ['scanDurationOfConfig']),
    ...mapState('user', ['isAdmin']),
    patientPhysioInfoStrokeVolumeValue() {
      if (this.isPreview) {
        return _.get(this.previewData, ['patientPhysioInfoStrokeVolume'], 70)
      } else {
        return this.patientPhysioInfoStrokeVolume
      }
    },
    delayTimeFromTimingDecisionStartByQuestionValue() {
      if (this.isPreview) {
        return _.get(this.previewData, ['delayTimeFromTimingDecisionStartByQuestion'], {})
      } else {
        return this.delayTimeFromTimingDecisionStartByQuestion
      }
    },
    isSelectedBolusTrackingTimingDecisionValue() {
      if (this.isPreview) {
        return _.get(this.previewData, ['isSelectedBolusTrackingTimingDecision'], false)
      } else {
        return this.isSelectedBolusTrackingTimingDecision
      }
    },
    isSelectedTestBolusTimingDecisionValue() {
      if (this.isPreview) {
        return _.get(this.previewData, ['isSelectedTestBolusTimingDecision'], false)
      } else {
        return this.isSelectedTestBolusTimingDecision
      }
    },
    timingDecisionBrightnessDataValue() {
      if (this.isPreview) {
        return _.get(this.previewData, ['timingDecisionBrightnessData'], [])
      } else {
        return this.timingDecisionBrightnessData.filter((el) => el.value != null)
      }
    },
    timingDecisionFlouroFrameRateValue() {
      if (this.isPreview) {
        return _.get(this.previewData, ['timingDecisionFlouroFrameRate'], 1)
      } else {
        return this.timingDecisionFlouroFrameRate
      }
    },
    timingDecisionHUTriggerThresholdValue() {
      if (this.isPreview) {
        return _.get(this.previewData, ['timingDecisionHUTriggerThreshold'], 1)
      } else {
        return this.timingDecisionHUTriggerThreshold
      }
    },
    visibleProbeNamesValue() {
      if (this.isPreview) {
        return _.get(this.previewData, ['visibleProbeNames'], [])
      } else {
        return this.visibleProbeNames
      }
    },
    acquisitionDurationSeconds() {
      const raw = this.isPreview
        ? _.get(this.previewData, ['scanDuration'], null) || _.get(this.previewData, ['scanDurationOfConfig'], null)
        : this.scanDurationOfConfig || _.get(this.stackQuestion, ['scanDuration'], null)
      const duration = parseFloat(raw)
      if (Number.isFinite(duration) && duration > 0) {
        return duration
      }

      const firstDelay = _.first(_.values(this.delayTimeFromTimingDecisionStartByQuestionValue))
      const delayScanDuration = parseFloat(_.get(firstDelay, 'scanDuration', null))
      if (Number.isFinite(delayScanDuration) && delayScanDuration > 0) {
        return delayScanDuration
      }
      if (firstDelay && _.isNumber(firstDelay.start) && _.isNumber(firstDelay.end) && firstDelay.end > firstDelay.start) {
        const derived = (firstDelay.end - firstDelay.start) / this.timingDecisionFlouroFrameRateValue
        return Number.isFinite(derived) && derived > 0 ? derived : null
      }

      return null
    },
    acquisitionScanTimeData() {
      const baseBrightnessSeries = [
        ...new Array(this.numOfIgnoreStep).fill(null),
        ...this.timingDecisionBrightnessDataValue.map((el) => el.value),
      ]
      const firstBrightnessIndex = _.findLastIndex(
        baseBrightnessSeries,
        (val) => val !== null && val !== undefined
      )
      const brightnessStartSeconds =
        firstBrightnessIndex >= 0
          ? firstBrightnessIndex * this.timingDecisionFlouroFrameRateValue + PHYSIOLOGICAL_DELAY_SECONDS
          : null

      const data = _.values(this.delayTimeFromTimingDecisionStartByQuestionValue)
        .map((el) => {
          const startSeconds =
            brightnessStartSeconds != null ? brightnessStartSeconds : el.start / this.timingDecisionFlouroFrameRateValue
          const duration = this.acquisitionDurationSeconds
          const fallbackEndSeconds = (el.end ?? el.start + 3) / this.timingDecisionFlouroFrameRateValue
          const endSeconds = _.isNumber(duration) ? startSeconds + duration : fallbackEndSeconds
          return {
            start: startSeconds,
            end: endSeconds,
          }
        })
        .filter((el) => el)

      const minEnd = _.minBy(data, 'end')
      return data.length > 0 ? [minEnd] : []
    },
    maximumAcqScanTime() {
      const minAcqEnd =
        this.acquisitionScanTimeData.length > 0 ? Math.min(...this.acquisitionScanTimeData.map((el) => el.end)) : 0
      return this.isPreview ? Math.max(0, minAcqEnd) + 15 : 0
    },
    startBrightnessDataIndexToShow() {
      return (
        parseInt(
          Math.ceil(
            Math.max(
              this.timingDecisionBrightnessDataValue.filter((el) => el.value != null).length - 1 + this.numOfIgnoreStep,
              this.maximumAcqScanTime
            ) / this.totalStepOnChart
          ).toString()
        ) * this.totalStepOnChart
      )
    },
    numOfIgnoreStep() {
      if (this.isPreview) {
        return Math.max(1, _.get(this.previewData, ['timingDecisionScanDelay'], 0) / this.timingDecisionFlouroFrameRateValue)
      } else {
        return Math.max(1, parseInt(
          _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0) / this.timingDecisionFlouroFrameRateValue
        ))
      }
    },
    chartLabel() {
      // Min is two label
      return new Array(this.getPresentationBodyMapSteps())
        .fill(null)
        .map((el, index) => `${index * this.timingDecisionFlouroFrameRateValue}`)
        .slice(0, Math.max(this.startBrightnessDataIndexToShow, this.totalStepOnChart))
        .filter((el, index) => index != 0)
    },
    brightnessData() {
      let _brightnessData = [
        ...new Array(this.numOfIgnoreStep).fill(null),
        ...this.timingDecisionBrightnessDataValue.map((el) => el.value),
        ...new Array(
          this.getPresentationBodyMapSteps() - this.timingDecisionBrightnessDataValue.length - this.numOfIgnoreStep
        ).fill(null),
      ]
        .slice(0, this.startBrightnessDataIndexToShow + this.totalStepOnChart)
        .filter((el, index) => index != 0)
      return _brightnessData
    },
    thresHoldData() {
      return new Array(this.getPresentationBodyMapSteps())
        .fill(this.timingDecisionHUTriggerThresholdValue)
        .slice(0, this.startBrightnessDataIndexToShow + this.totalStepOnChart)
        .filter((el, index) => index != 0)
    },
    shouldAddMovedLineAnnotation() {
      return (
        this.isSelectedTestBolusTimingDecisionValue &&
        !this.isPreview &&
        (this.roiStatus == this.ROI_STATUS.DONE || this.isAnsweredCurrentQuestion)
      )
    },
    desplayCurrentSeconds() {
      return this.presentationPreviewTimingDecisionStep * this.timingDecisionFlouroFrameRateValue
    },
  },
  watch: {
    thresHoldData() {
      this.onUpdateTimingDecisionHuTriggerThreshold()
    },
    brightnessData() {
      this.onUpdateTimingDecisionBrightnessData()
    },
    chartLabel() {
      this.onUpdateTimingDecisionChartLabel()
    },
    shouldAddMovedLineAnnotation() {
      this.addAnotations()
    },
    probeData() {
      if (this.isPreview) {
        if (this.timeOutUpdateProbe) {
          clearTimeout(this.timeOutUpdateProbe)
        }
        this.timeOutUpdateProbe = setTimeout(() => {
          this.onUpdateTimingDecisionBrightnessData()
        }, 50)
      }
    },
    roiStatus() {
      if (this.roiStatus == this.ROI_STATUS.DONE && !this.isPreview) {
        console.log('TIMING DECISION: PROBE DATA FROM JSON FILE', this.probeData)
        this.probeData.forEach((probe) => {
          if (this.visibleProbeNamesValue.includes(probe.fileName)) {
            console.log('TIMING DECISION: PROBE ITEM FROM FILE', probe.label, probe)

            if (timingDecisionChart) {
              const dataset = timingDecisionChart.data.datasets.find((el) => el.label == probe.label)
              if (dataset) {
                console.log('TIMING DECISION: PROBE CHART DATA: ', probe.label, dataset.data, 'Color: ', probe.color)
              }
            }
          }
        })
        console.log('TIMING DECISION: END: PROBE DATA FROM JSON FILE')

        console.log('TIMING DECISION: BRIGHTNESS MAPPING RESULT', this.timingDecisionBrightnessDataValue)
      }
    },
  },
  mounted() {
    const ctx = this.$refs.timingDecisionChartContainer.getContext('2d')

    const onDragHandler = this.handleDrag.bind(this)
    timingDecisionChart = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: this.chartLabel,
        datasets: this.getDatasets(),
      },
      options: {
        responsive: true,
        // maintainAspectRatio: false,
        animation: {
          duration: 0, // general animation time
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Hounsfield units',
              color: '#ffffff',
            },
            ticks: {
              color: '#ffffff',
            },
            border: {
              display: true,
              color: '#4472c4',
            },
            min: -20,
            max: 450,
          },
          x: {
            title: {
              display: true,
              text: 'Time (Seconds)',
              color: '#ffffff',
            },
            ticks: {
              display: true,
              color: '#ffffff',
              font: {
                size: 9, // 12 as normal!!!!
              },
            },
            border: {
              display: true,
              color: '#4472c4',
            },
          },
        },
        plugins: {
          legend: {
            display: this.isPreview,
            position: 'right',
            labels: {
              filter: (legendItem) => legendItem.text !== 'Hounsfield unit' && legendItem.text !== 'Threshold',
            },
            onClick: () => {},
          },
          tooltip: {
            enabled: !this.isPreview,
            callbacks: {
              title: () => {
                return null
              },
              footer: (tooltipItems) => {
                return `Time: ${tooltipItems[0].label} secs`
              },
            },
            displayColors: false,
            bodyFont: {
              size: 12,
              style: 'normal',
              weight: 'normal',
            },
            footerFont: {
              size: 12,
              style: 'normal',
              weight: 'normal',
            },
          },
          datalabels: {
            formatter: (value, context) => {
              if (context.dataset.label == 'Threshold' && context.dataIndex == context.dataset.data.length - 1) {
                // Magic to move this label to viewport
                // Can't adjust with any property of datalabels
                return `${value}      `
              }

              return null
            },
            textStrokeWidth: 0.1,
            borderWidth: 0.1,
            color: '#ffffff',
            align: 'top',
            anchor: 'end',
            offset: 1,
            font: {
              size: 16,
              style: 'normal',
              weight: 'normal',
            },
          },
        },
      },
      plugins: [
        ChartDataLabels,
        {
          id: 'dragger',
          beforeEvent(chart, args) {
            if (onDragHandler(args.event)) {
              args.changed = true
              return
            }
          },
        },
      ],
    })

    if (this.isPreview) {
      this.loadProbeJsonData('/img/probeData.zip')
    }
    this.addAnotations()
    EventBus.$on('onHiddenTimingDecisionChartTooltip', this.onHiddenTimingDecisionChartTooltip)
    EventBus.$on('onShowTimingDecisionChartProbeLine', this.onShowTimingDecisionChartProbeLine)
    EventBus.$on('onHideTimingDecisionChartProbeLine', this.onHideTimingDecisionChartProbeLine)
  },
  beforeDestroy() {
    if (this.timeOutUpdateProbe) {
      clearTimeout(this.timeOutUpdateProbe)
    }
    EventBus.$off('onHiddenTimingDecisionChartTooltip', this.onHiddenTimingDecisionChartTooltip)
    EventBus.$off('onShowTimingDecisionChartProbeLine', this.onShowTimingDecisionChartProbeLine)
    EventBus.$off('onHideTimingDecisionChartProbeLine', this.onHideTimingDecisionChartProbeLine)
    if (timingDecisionChart) {
      timingDecisionChart.destroy()
      timingDecisionChart = null
    }
  },
  methods: {
    ...mapActions('questionService', ['setPresentationPreviewTimingDecisionStep']),
    ...mapActions('timingDecisionService', ['loadProbeJsonData']),
    refreshChart() {
      if (timingDecisionChart) {
        timingDecisionChart.resize()
      }
    },
    async addAnotations() {
      if (!timingDecisionChart) {
        return
      }
      if (this.shouldAddMovedLineAnnotation) {
        const img = await this.getLeftRightIcon()
        const lineAnnotation = {
          type: 'line',
          borderColor: 'yellow',
          borderWidth: 3,
          scaleID: 'x',
          id: 'MovedLine',
          value: this.presentationTimingDecisionStep - 1,
          label: {
            display: true,
            content: img,
            strokeColor: 'black',
            backgroundColor: 'white',
            color: 'black',
            borderWidth: 3,
            width: '5%',
            height: '5%',
            position: 'start',
          },
        }

        timingDecisionChart.options.plugins.annotation = {
          enter(ctx) {
            element = ctx.element
          },
          leave() {},
          annotations: [lineAnnotation, ...this.getAcqTimeAnotation()],
        }
        timingDecisionChart.update()
      } else {
        timingDecisionChart.options.plugins.annotation = {
          enter(ctx) {
            element = ctx.element
          },
          leave() {},
          annotations: [...this.getAcqTimeAnotation()],
        }
        timingDecisionChart.update()
      }
    },
    getAcqTimeAnotation() {
      if (this.isSelectedTestBolusTimingDecisionValue || !this.isPreview) {
        return []
      } else {
        return this.acquisitionScanTimeData.map((el, index) => ({
          type: 'box',
          xMin: el.start - 1,
          xMax: el.end - 1,
          yMin: this.timingDecisionHUTriggerThresholdValue - 30,
          yMax: this.timingDecisionHUTriggerThresholdValue + 30,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          id: `AcqBox-${index + 1}`,
        }))
      }
    },
    async getLeftRightIcon() {
      return new Promise((resolve) => {
        const image = new Image()
        image.src = `/img/left-right.png`
        image.onload = () => {
          resolve(image)
        }
        if (image.complete) {
          resolve(image)
        }
      })
    },
    onMouseup() {
      lastEvent = undefined
    },
    onMouseDown() {
      lastEvent = lastMoveEvent
    },
    handleElementDragging(event) {
      if (!lastEvent || !element) {
        return
      }
      const chartArea = timingDecisionChart.chartArea
      const chartPixelPerStep = timingDecisionChart.chartArea.width / (this.chartLabel.length - 1)
      let moveX = event.x - element.x
      const moveY = 0
      element.x += moveX
      element.x2 += moveX

      let step = _.floor((element.x - chartArea.left) / chartPixelPerStep)
      step = Math.min(this.presentationTimingDecisionStep - 1, Math.max(0, step))

      moveX = moveX + (chartArea.left + step * chartPixelPerStep - element.x)
      element.x = chartArea.left + step * chartPixelPerStep
      element.x2 = chartArea.left + step * chartPixelPerStep
      // Preview step is step + 1
      this.setPresentationPreviewTimingDecisionStep(step + 1)

      if (element.elements && element.elements.length) {
        for (const subEl of element.elements) {
          subEl.x += moveX
          subEl.y += moveY
          subEl.x2 += moveX
          subEl.y2 += moveY
          subEl.centerX += moveX
          subEl.centerY += moveY
          subEl.bX += moveX
          subEl.bY += moveY
        }
      }
      lastEvent = event
      return true
    },
    handleDrag(event) {
      if (element) {
        if (element?.options?.id != 'MovedLine') {
          return
        }
        switch (event.type) {
          case 'mousemove':
            lastMoveEvent = event
            return this.handleElementDragging(event)
          case 'mouseout':
          case 'mouseup':
            lastEvent = undefined
            break
          case 'mousedown':
          case 'click':
            break
          default:
        }
      }
    },
    getDatasets() {
      if (this.isSelectedTestBolusTimingDecisionValue) {
        return [
          {
            label: 'Hounsfield unit',
            data: this.brightnessData,
            fill: false,
            borderColor: '#2196f3',
            backgroundColor: '#2196f3',
            borderWidth: 3,
            pointRadius: 2,
            legend: false,
          },
        ]
      } else {
        const datasets = [
          {
            label: 'Hounsfield unit',
            data: this.brightnessData, // blue timing dots
            fill: false,
            borderColor: '#2196f3',
            backgroundColor: '#2196f3',
            borderWidth: 3,
            pointRadius: 2,
            legend: false,
          },
          {
            label: 'Threshold',
            data: this.thresHoldData,
            fill: false,
            borderColor: '#FFFF00',
            backgroundColor: '#FFFF00',
            borderWidth: 2,
            pointRadius: 0,
            legend: false,
          },
        ]
        if (this.isSelectedBolusTrackingTimingDecisionValue) {
          this.visibleProbeNamesValue.forEach((visibleProbeName, index) => {
            const probe = this.probeData.find((el) => el.fileName == visibleProbeName)
            if (probe) {
              const color = RANDOM_COLORS[index % RANDOM_COLORS.length]
              const probeValues = this.timingDecisionBrightnessDataValue.map((el) => {
                const probeValue = el.probeValues.find((p) =>
                  p.fileName ? p.fileName == probe.fileName : p.label.endsWith(probe.label)
                )
                const chartValue = ((probeValue ? probeValue.value : 0) / (probeValue?.maxValue || 1)) * 450
                return Math.min(450, Math.max(0, chartValue))
              })
              const probeData = [
                ...new Array(this.numOfIgnoreStep).fill(null),
                ...probeValues,
                ...new Array(
                  this.getPresentationBodyMapSteps() -
                    this.timingDecisionBrightnessDataValue.length -
                    this.numOfIgnoreStep
                ).fill(probeValues.length > 0 && this.isPreview ? probeValues[probeValues.length - 1] : null),
              ]
                .slice(0, this.startBrightnessDataIndexToShow + this.totalStepOnChart)
                .filter((el, index) => index != 0)
              datasets.push({
                label: probe.label,
                data: probeData,
                fill: false,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2,
                pointRadius: 0,
                hidden: !this.isAdmin,
              })
            }
          })
        }
        return datasets
      }
    },
    onHiddenTimingDecisionChartTooltip() {
      try {
        timingDecisionChart.options.plugins.tooltip.enabled = false
        timingDecisionChart.update()
      } catch (err) {
        // No action
      }
    },
    onShowTimingDecisionChartProbeLine() {
      if (!timingDecisionChart || !this.isSelectedBolusTrackingTimingDecisionValue) {
        return
      }

      this.isShowLoading = true

      const allProbeLabels = this.probeData.map((p) => p.label)
      timingDecisionChart.data.datasets.forEach((dataset) => {
        if (dataset.label && allProbeLabels.includes(dataset.label)) {
          dataset.hidden = false
        }
      })

      timingDecisionChart.update()
    },
    onHideTimingDecisionChartProbeLine() {
      if (!timingDecisionChart) {
        return
      }

      this.isShowLoading = false

      timingDecisionChart.data.datasets.forEach((dataset) => {
        if (dataset.label && this.probeData.map((p) => p.label).includes(dataset.label)) {
          dataset.hidden = true
        }
      })

      timingDecisionChart.update()
    },
    onUpdateTimingDecisionHuTriggerThreshold() {
      if (!timingDecisionChart) {
        return
      }

      const thresHoldDataset = timingDecisionChart.data.datasets.find((el) => el.label == 'Threshold')
      if (thresHoldDataset) {
        thresHoldDataset.data = this.thresHoldData
        timingDecisionChart.update()
      }
    },
    onUpdateTimingDecisionBrightnessData() {
      if (!timingDecisionChart) {
        return
      }

      const brightnessDataset = timingDecisionChart.data.datasets.find((el) => el.label == 'Hounsfield unit')
      if (brightnessDataset) {
        brightnessDataset.data = this.brightnessData

        if (this.isSelectedBolusTrackingTimingDecisionValue) {
          this.visibleProbeNamesValue.forEach((visibleProbeName, index) => {
            const probe = this.probeData.find((el) => el.fileName == visibleProbeName)
            if (probe) {
              const color = RANDOM_COLORS[index % RANDOM_COLORS.length]
              const probeDataset = timingDecisionChart.data.datasets.find((el) => el.label == probe.label)
              const probeValues = this.timingDecisionBrightnessDataValue.map((el) => {
                const probeValue = el.probeValues.find((p) =>
                  p.fileName ? p.fileName == probe.fileName : probe.label.endsWith(p.label)
                )
                const chartValue = ((probeValue ? probeValue.value : 0) / (probeValue?.maxValue || 1)) * 450
                return Math.min(450, Math.max(0, chartValue))
              })
              const probeData = [
                ...new Array(this.numOfIgnoreStep).fill(null),
                ...probeValues,
                ...new Array(
                  this.getPresentationBodyMapSteps() -
                    this.timingDecisionBrightnessDataValue.length -
                    this.numOfIgnoreStep
                ).fill(probeValues.length > 0 && this.isPreview ? probeValues[probeValues.length - 1] : null),
              ]
                .slice(0, this.startBrightnessDataIndexToShow + this.totalStepOnChart)
                .filter((el, index) => index != 0)
              if (probeDataset) {
                probeDataset.data = probeData
              } else {
                timingDecisionChart.data.datasets.push({
                  label: probe.label,
                  data: probeData,
                  fill: false,
                  borderColor: color,
                  backgroundColor: color,
                  borderWidth: 2,
                  pointRadius: 0,
                  hidden: !this.isAdmin && !this.isPreview,
                })
              }
            }
          })
        }

        timingDecisionChart.update()
      }
    },
    onUpdateTimingDecisionChartLabel() {
      if (!timingDecisionChart) {
        return
      }

      timingDecisionChart.data.labels = this.chartLabel
      timingDecisionChart.update()
    },
  },
}
</script>
<style lang="scss" scoped>
.preview-current-seconds {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  padding: 10px;
  background: #b8b8b8;
  width: 80px;
  border-radius: 8px;
  text-align: center;
  span {
    text-align: center;
    font-size: 20px;
    color: #000000;
    user-select: none;
  }
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
  background: rgba($color: #ffffff, $alpha: 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
