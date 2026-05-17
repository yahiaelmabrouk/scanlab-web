<template>
  <div :style="{ display: !isGroupStats || (isGroupStats && activeBodyParts.length > 0) ? 'block' : 'none' }">
    <TestResults
      v-if="testResults"
      @close="onCloseTestResults()"
      :closable="true"
      :test-results="testResults"
    ></TestResults>
    <div>
      <highcharts v-if="!loading && !coverageProcessing && temp" class="hc" :options="options" ref="chart"></highcharts>
      <v-progress-circular v-else indeterminate size="60"></v-progress-circular>
      <div v-if="!loading && !coverageProcessing" class="curve-legends-container">
        <span
          v-for="(graph, i) in currentGraphs"
          :key="i"
          :style="{
            color: graph.color,
            cursor: 'pointer',
            marginLeft: i > 0 && '10px',
            fontSize:
              hoveringUserId === graph.userId ||
              selectedStudent === graph.userId ||
              hoveringUserIdLegend === graph.userId
                ? '16px'
                : '14px',
            fontWeight:
              hoveringUserId === graph.userId ||
              selectedStudent === graph.userId ||
              hoveringUserIdLegend === graph.userId
                ? 600
                : 400,
            opacity:
              hoveringUserId === graph.userId ||
              selectedStudent === graph.userId ||
              hoveringUserIdLegend === graph.userId
                ? 1
                : 0.4,
          }"
          @click="selectStudent(graph.userId === selectedStudent ? null : graph.userId)"
          @mouseover="hoveringUserIdLegend = graph.userId"
          @mouseleave="hoveringUserIdLegend = null"
        >
          {{ graph.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState, mapMutations, mapGetters } from 'vuex'
import _ from 'lodash'
import EventBus from '@/lib/event-bus'
import { ZERO_LINE_COLOR } from './chartConstants'
import TestResults from '../TestResults'
import testResultsModalMixin from '../../mixins/testResultsModalMixin'
import { MR_PRACTICE_EXAM_ID, CT_PRACTICE_EXAM_ID } from '../../constants'
import { COVERAGE_AGGREGATIONS } from '../../constants/interventionRules'
import config from '../../config'

export default {
  name: 'CoverageCurve',
  mixins: [testResultsModalMixin],
  components: { TestResults },
  props: {
    height: {
      type: String,
      default: '500',
    },
    whom: {
      type: [String, Array],
      default: 'everyone',
    },
    // cohortId to show
    showCohortAverage: {
      type: Number,
      default: undefined,
      required: false,
    },
    showGlobalAverage: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      default: '',
    },
    isGroupStats: {
      type: Boolean,
      default: false,
    },
    visibleStudents: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      isProcessing: true,
      rawData: {},
      hoveringUserId: null,
      hoveringUserIdLegend: null,
      cohortData: {},
      globalData: {},
      currentGraphs: [],
      selectedStudent: null,
      aggregationMode: 'absoluteTotal', // 'mean', 'absoluteMean', 'total', 'absoluteTotal'
      options: {
        credits: {
          enabled: false,
        },
        chart: {
          zoomType: 'xy',
          events: {
            load: function () {
              const chart = this
              const container = chart.container

              // Create toggle container
              const toggleDiv = document.createElement('div')
              toggleDiv.id = 'coverage-mean-toggle'
              toggleDiv.style.position = 'absolute'
              toggleDiv.style.top = '10px'
              toggleDiv.style.right = '20px'
              toggleDiv.style.zIndex = '1000'
              toggleDiv.style.display = 'flex'
              toggleDiv.style.gap = '16px'
              toggleDiv.style.alignItems = 'center'
              toggleDiv.style.fontSize = '13px'

              // Create radio buttons
              const metricWord = config.isCTLab ? 'coverage' : 'slice'
              const options = COVERAGE_AGGREGATIONS.map((agg) => ({
                value: agg.value,
                label: agg.label,
                tooltip: agg.description(metricWord),
              }))

              options.forEach((option, index) => {
                const radioWrapper = document.createElement('div')
                radioWrapper.style.position = 'relative'
                radioWrapper.style.display = 'flex'
                radioWrapper.style.alignItems = 'center'

                const radioLabel = document.createElement('label')
                radioLabel.style.cursor = 'pointer'
                radioLabel.style.display = 'flex'
                radioLabel.style.alignItems = 'center'
                radioLabel.style.lineHeight = '1'
                radioLabel.innerHTML = `
                  <input type="radio" name="meanToggle" value="${option.value}" ${index === 0 ? 'checked' : ''} style="margin: 0 4px 0 0;">
                  <span style="line-height: 1;">${option.label}</span>
                `

                // Create custom tooltip
                const tooltip = document.createElement('div')
                tooltip.style.position = 'absolute'
                tooltip.style.top = '100%'
                tooltip.style.left = '50%'
                tooltip.style.transform = 'translateX(-50%)'
                tooltip.style.marginTop = '8px'
                tooltip.style.padding = '8px 12px'
                tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.85)'
                tooltip.style.color = 'white'
                tooltip.style.fontSize = '12px'
                tooltip.style.borderRadius = '4px'
                tooltip.style.whiteSpace = 'nowrap'
                tooltip.style.pointerEvents = 'none'
                tooltip.style.opacity = '0'
                tooltip.style.transition = 'opacity 0.2s ease-in-out'
                tooltip.style.zIndex = '10000'
                tooltip.textContent = option.tooltip

                // Add arrow to tooltip
                const arrow = document.createElement('div')
                arrow.style.position = 'absolute'
                arrow.style.bottom = '100%'
                arrow.style.left = '50%'
                arrow.style.transform = 'translateX(-50%)'
                arrow.style.width = '0'
                arrow.style.height = '0'
                arrow.style.borderLeft = '6px solid transparent'
                arrow.style.borderRight = '6px solid transparent'
                arrow.style.borderBottom = '6px solid rgba(0, 0, 0, 0.85)'
                tooltip.appendChild(arrow)

                // Hover events
                radioWrapper.addEventListener('mouseenter', () => {
                  tooltip.style.opacity = '1'

                  // Check if tooltip goes off right edge
                  setTimeout(() => {
                    const tooltipRect = tooltip.getBoundingClientRect()
                    const containerRect = container.getBoundingClientRect()
                    const wrapperRect = radioWrapper.getBoundingClientRect()

                    if (tooltipRect.right > containerRect.right) {
                      // Align tooltip to the right edge instead of center
                      tooltip.style.left = 'auto'
                      tooltip.style.right = '0'
                      tooltip.style.transform = 'none'
                      // Position arrow to align with center of radio button
                      const wrapperCenter = wrapperRect.left + (wrapperRect.width / 2)
                      const tooltipLeft = wrapperRect.right
                      const arrowOffset = tooltipLeft - wrapperCenter
                      arrow.style.left = 'auto'
                      arrow.style.right = `${arrowOffset}px`
                      arrow.style.transform = 'none'
                    } else if (tooltipRect.left < containerRect.left) {
                      // Align tooltip to the left edge instead of center
                      tooltip.style.left = '0'
                      tooltip.style.right = 'auto'
                      tooltip.style.transform = 'none'
                      // Position arrow to align with center of radio button
                      const wrapperCenter = wrapperRect.left + (wrapperRect.width / 2)
                      const tooltipLeft = wrapperRect.left
                      const arrowOffset = wrapperCenter - tooltipLeft
                      arrow.style.left = `${arrowOffset}px`
                      arrow.style.right = 'auto'
                      arrow.style.transform = 'none'
                    }
                  }, 10)
                })
                radioWrapper.addEventListener('mouseleave', () => {
                  tooltip.style.opacity = '0'
                  // Reset positioning after fade-out transition completes
                  setTimeout(() => {
                    tooltip.style.left = '50%'
                    tooltip.style.right = 'auto'
                    tooltip.style.transform = 'translateX(-50%)'
                    arrow.style.left = '50%'
                    arrow.style.right = 'auto'
                    arrow.style.transform = 'translateX(-50%)'
                  }, 200) // Match the transition duration
                })

                radioWrapper.appendChild(radioLabel)
                radioWrapper.appendChild(tooltip)
                toggleDiv.appendChild(radioWrapper)
              })
              container.appendChild(toggleDiv)

              // Sync initial state with Vue component
              if (window.coverageCurveInstance) {
                const currentMode = window.coverageCurveInstance.aggregationMode
                const currentRadio = toggleDiv.querySelector(`input[value="${currentMode}"]`)
                if (currentRadio) {
                  currentRadio.checked = true
                }
              }

              // Add event listeners
              const radioButtons = toggleDiv.querySelectorAll('input[name="meanToggle"]')
              radioButtons.forEach((radio) => {
                radio.addEventListener('change', (e) => {
                  // Access Vue component instance through chart reference
                  if (window.coverageCurveInstance) {
                    window.coverageCurveInstance.aggregationMode = e.target.value
                  }
                })
              })
            },
          },
        },
        noData: {
          text: 'No MRI Scores Available',
          style: {
            color: '#000000',
          },
        },

        allowPointSelect: false,
        enableMouseTracking: true,
        label: {
          enabled: false,
        },
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 5,
              lineWidth: 2,
              lineColor: null,
            },
          },
        },
        tooltip: {
          enabled: true,
          crosshairs: true,
          shared: false,
          useHTML: true,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderWidth: 1,
          borderRadius: 8,
          shadow: true,
          style: {
            padding: '10px',
            fontSize: '13px',
          },
          formatter: function () {
            const date = new Date(this.x).toLocaleDateString()
            const mode = this.point.aggregationMode
            const values = this.point.values || {}
            const metricLabel = config.isCTLab ? 'Coverage' : 'Slice'
            const unitLabel = config.isCTLab ? 'mm' : 'slices'
            let value
            switch (mode) {
              case 'absoluteMean':
                value = Math.round((values.absoluteMean ?? Math.abs(this.y)) * 10) / 10
                break
              case 'total':
                value = Math.round((values.total ?? this.y) * 10) / 10
                break
              case 'absoluteTotal':
                value = Math.round((values.absoluteTotal ?? Math.abs(this.y)) * 10) / 10
                break
              default: // 'mean'
                value = Math.round((values.mean ?? this.y) * 10) / 10
            }
            const bodyPart = this.point.bodyPart || 'N/A'
            const individualWastedSlices = values.individual || []

            // Calculate totals
            let totalPositive = 0
            let totalNegative = 0
            if (individualWastedSlices.length > 0) {
              individualWastedSlices.forEach((sliceValue) => {
                if (sliceValue >= 0) {
                  totalPositive += sliceValue
                } else {
                  totalNegative += sliceValue
                }
              })
            }

            let barsHtml = ''
            if (individualWastedSlices.length > 0) {
              // Find max absolute value for scaling
              const maxAbsValue = Math.max(...individualWastedSlices.map((v) => Math.abs(v)))
              const maxBarWidth = 100 // pixels

              // Generate bars
              const bars = individualWastedSlices
                .map((sliceValue) => {
                  const absValue = Math.abs(sliceValue)
                  const barWidth = maxAbsValue > 0 ? (absValue / maxAbsValue) * maxBarWidth : 0
                  const roundedValue = Math.round(sliceValue * 10) / 10
                  const isPositive = sliceValue >= 0

                  if (isPositive) {
                    // Positive bar (blue, extends right)
                    return `
                      <div style="display: flex; align-items: center; margin: 2px 0; height: 10px;">
                        <div style="width: 100px; text-align: right; padding-right: 4px;"></div>
                        <div style="width: 1px; height: 12px; background: #999; flex-shrink: 0;"></div>
                        <div style="display: flex; align-items: center; padding-left: 4px;">
                          <div style="height: 10px; width: ${barWidth}px; background: #1976d2; border-radius: 2px;"></div>
                          <span style="margin-left: 4px; font-size: 11px; color: #333; white-space: nowrap;">${roundedValue}</span>
                        </div>
                      </div>
                    `
                  } else {
                    // Negative bar (red, extends left)
                    return `
                      <div style="display: flex; align-items: center; margin: 2px 0; height: 10px;">
                        <div style="width: 100px; text-align: right; padding-right: 4px; display: flex; align-items: center; justify-content: flex-end;">
                          <span style="margin-right: 4px; font-size: 11px; color: #333; white-space: nowrap;">${roundedValue}</span>
                          <div style="height: 10px; width: ${barWidth}px; background: #d31246; border-radius: 2px;"></div>
                        </div>
                        <div style="width: 1px; height: 12px; background: #999; flex-shrink: 0;"></div>
                        <div style="padding-left: 4px;"></div>
                      </div>
                    `
                  }
                })
                .join('')

              barsHtml = `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                  <div style="font-size: 11px; color: #666; margin-bottom: 6px;">
                    Individual ${metricLabel} Deviations (${individualWastedSlices.length}):
                  </div>
                  <div style="font-size: 12px;">
                    ${bars}
                  </div>
                </div>
              `
            }

            let meanLabel
            switch (mode) {
              case 'absoluteMean':
                meanLabel = `Absolute Avg. ${metricLabel} Deviation`
                break
              case 'total':
                meanLabel = `Total ${metricLabel} Deviation`
                break
              case 'absoluteTotal':
                meanLabel = `Absolute Total ${metricLabel} Deviation`
                break
              default: // 'mean'
                meanLabel = `Avg. ${metricLabel} Deviation`
            }

            return `
              <div style="min-width: 150px; max-width: 300px; overflow: hidden;">
                <div style="font-weight: 600; margin-bottom: 5px; color: ${this.series.color};">
                  ${this.series.name || 'Student'}
                </div>
                <div style="margin: 3px 0;">
                  <span style="color: #666;">Date:</span>
                  <strong>${date}</strong>
                </div>
                <div style="margin: 3px 0;">
                  <span style="color: #666;">Body Part:</span>
                  <strong>${bodyPart}</strong>
                </div>
                <div style="margin: 3px 0;">
                  <span style="color: #666;">${meanLabel}:</span>
                  <strong>${value} ${unitLabel}</strong>
                </div>
                <div style="margin: 3px 0;">
                  <span style="color: #666;">Total ${metricLabel} Deviations Positive:</span>
                  <strong>${Math.round(totalPositive * 10) / 10} ${unitLabel}</strong>
                </div>
                <div style="margin: 3px 0;">
                  <span style="color: #666;">Total ${metricLabel} Deviations Negative:</span>
                  <strong>${Math.round(totalNegative * 10) / 10} ${unitLabel}</strong>
                </div>
                ${barsHtml}
              </div>
            `
          },
        },

        legend: {
          enabled: false,
          symbolWidth: 0,
        },

        title: {
          align: 'left',
          text: this.$t('CoverageCurve.default_title'),
        },

        yAxis: {
          title: {
            text: this.$t('CoverageCurve.yAxisTitle'),
          },
          startOnTick: false,
          endOnTick: false,
          plotBands: [
            {
              from: 20,
              to: 999,
              color: 'rgba(211, 18, 70, 0.05)',
            },
            {
              from: -999,
              to: -20,
              color: 'rgba(211, 18, 70, 0.05)',
            },

            {
              from: 10,
              to: 20,
              color: 'rgba(255, 205, 60, 0.05)',
            },
            {
              from: -20,
              to: -10,
              color: 'rgba(255, 205, 60, 0.05)',
            },

            {
              from: -10,
              to: 10,
              color: 'rgba(58, 153, 137, 0.05)',
            },
          ],
          plotLines: [
            {
              color: ZERO_LINE_COLOR,
              width: 3,
              value: 0,
              zIndex: 5,
            },
          ],
        },

        plotOptions: {
          series: {
            events: {
              mouseOver: (event) => {
                this.hoveringUserId = event.target.options.userId
              },
              mouseOut: () => {
                this.hoveringUserId = null
              },
            },
            point: {
              events: {
                click: this.openTestResultsForPoint,
              },
            },
          },
        },
      },
      temp: true,
    }
  },
  computed: {
    ...mapState('statisticsService', [
      'activeBodyParts',
      'examDateRange',
      'visibleGraphs',
      'loading',
      'curveDateRange',
      'coverageProcessing',
    ]),
    ...mapState('statisticsService', { statsRawData: 'rawData' }),
    bodyPartByQuestionSetResultId() {
      const map = new Map()
      const entries = Array.isArray(this.statsRawData)
        ? this.statsRawData
        : Object.values(this.statsRawData || {}).flat()
      entries.forEach((entry) => {
        if (entry?.questionSetResultId != null && entry.bodyPart) {
          map.set(entry.questionSetResultId, entry.bodyPart)
        }
      })
      return map
    },
    ...mapGetters('user', ['languageCode']),
    ...mapState('user', ['nickName', 'legalName', 'isAdmin', 'isManager']),
    ...mapState('translatedContent', ['languagesTranslations']),
    ...mapGetters('statisticsService', ['activeBodyPartGroupName']),
    metricKey() {
      return config.isCTLab ? 'wastedCoverage' : 'wastedSlices'
    },
    noData() {
      return (
        typeof this.$props.whom === 'string' &&
        _.isEmpty(this.rawData[this.$props.whom]?.[this.metricKey]?.points)
      )
    },
    selectedStudents() {
      return this.$props.whom
    },
  },
  async mounted() {
    // Register component instance globally for chart toggle access
    window.coverageCurveInstance = this

    EventBus.$on('TestRunDeleted', this.fetchData)
    await Promise.all([this.fetchData(), this.fetchCohortData()])
  },
  beforeDestroy() {
    EventBus.$off('TestRunDeleted', this.fetchData)
    this.setCurveDateRange([])
    // Clean up global reference
    if (window.coverageCurveInstance === this) {
      delete window.coverageCurveInstance
    }
  },
  watch: {
    activeBodyParts() {
      this.selectedStudent = null
      this.updateGraph()
    },
    examDateRange() {
      this.updateGraph()
    },
    curveDateRange() {
      this.updateGraph()
    },
    selectedStudents: {
      immediate: false,
      async handler() {
        await this.fetchData()
      },
    },
    rawData(newRawData) {
      this.updateGraph()
    },
    statsRawData() {
      this.updateGraph()
    },
    visibleStudents() {
      this.updateGraph()
    },
    visibleGraphs() {
      this.updateGraph()
    },
    selectedStudent() {
      this.updateGraph()
    },
    cohortData(data) {
      const plotLines = [
        {
          color: ZERO_LINE_COLOR,
          width: 3,
          value: 0,
          zIndex: 5,
        },
      ]

      if (data) {
        plotLines.push({
          color: 'blue',
          width: 0.5,
          value: data.mean,
          zIndex: 4,
          label: {
            text: `Cohort Avg: ${_.round(data.mean)}`,
          },
        })
      }

      this.options.yAxis.plotLines = plotLines
      this.options = { ...this.options }
    },
    hoveringUserIdLegend() {
      this.updateGraph()
    },
    languageCode() {
      this.updateGraph()
    },
    languagesTranslations() {
      this.updateGraph()
    },
    activeBodyPartGroupName() {
      this.updateGraph()
    },
    aggregationMode() {
      this.updateGraph()
    },
  },
  methods: {
    ...mapActions('statisticsService', ['getWastedSlices', 'setCurveDateRange']),
    ...mapMutations('statisticsService', ['setCurveDateRange', 'setProcessing']),

    async fetchData() {
      if (Object.keys(this.rawData).length === 0) this.setProcessing({ type: 'coverage', processing: true })

      try {
        this.rawData = await this.getWastedSlices({
          whom: this.$props.whom,
          mean: false,
          points: true,
        })

        this.updateGraph()
      } catch (error) {
        console.error('Error fetching coverage data:', error)
      } finally {
        if (this.coverageProcessing) this.setProcessing({ type: 'coverage', processing: false })
      }
    },

    async fetchCohortData() {
      if (!this.$props.showCohortAverage) return

      try {
        const response = await this.getWastedSlices({
          whom: `cohort_${this.$props.showCohortAverage}`,
          mean: true,
          points: false,
        })
        this.cohortData = response?.[this.metricKey] || null
      } catch (error) {
        console.error('Error fetching cohort coverage data:', error)
      }
    },

    setCurrentGraphs(graph) {
      if (!this.currentGraphs.includes((currentGraph) => currentGraph.userId === graph.userId))
        this.currentGraphs = [...this.currentGraphs, graph]
    },

    updateGraph() {
      // if (typeof this.$props.whom === 'string' && !this.noData) return

      this.currentGraphs = []
      let series = []
      let seriesGroup = []
      let xAxis = []

      Object.keys(this.rawData).forEach((key, i) => {
        xAxis.push({
          type: 'datetime',
          visible: false,
          startOnTick: false,
          endOnTick: false,
        })
      })

      this.options.xAxis = xAxis

      Object.entries(this.rawData).forEach(([userId, userData], i) => {
        const data = userData?.[this.metricKey] || {}
        let points = data.points || []

        // Remap each point's bodyPart to the suffixed name (e.g. "Brain Without")
        // sourced from getScanlabScores rawData via questionSetResultId, so the
        // body-part filter and tooltip stay aligned with MRIScoreLine.
        points = points.map((point) => {
          const mapped = this.bodyPartByQuestionSetResultId.get(point.questionSetResultId)
          return mapped ? { ...point, bodyPart: mapped } : point
        })

        // Filter out prepared exams for students (only admins/managers can see them)
        const canSeePreparedExams = this.isAdmin || this.isManager
        if (!canSeePreparedExams) {
          points = points.filter((point) => point.preparedExamId === null)
        }
        const practiceExamId = config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
        points = points.filter((point) => point.preparedExamId !== practiceExamId)

        seriesGroup.push(points.map((point) => point.x))
        const currentGraph = this.visibleGraphs?.find((graph) => graph.userId === userId)

        if (this.activeBodyParts.length > 0) {
          points = points.filter((d) => this.activeBodyParts.length === 0 || this.activeBodyParts.includes(d.bodyPart))

          this.options.title.text = `${this.$t('CoverageCurve.title_prefix')} (${this.activeBodyPartGroupName})`
        } else {
          this.options.title.text = this.$t('CoverageCurve.default_title')
        }
        this.options.yAxis.title.text = config.isCTLab ? 'Coverage (mm)' : this.$t('CoverageCurve.yAxisTitle')

        if (!points.length) return

        const isVisible = this.hoveringUserIdLegend
          ? userId === this.hoveringUserIdLegend
          : !this.selectedStudent ||
            (this.selectedStudent && userId === this.selectedStudent) ||
            userId === this.hoveringUserIdLegend

        const seriesName = this.visibleStudents.find((student) => `user_${student.userId}` === userId)?.name || this.nickName || this.legalName || 'Student'

        // Transform points to include aggregationMode and calculate y-value
        const transformedPoints = _.orderBy(points, 'x').map((point) => {
          const values = point.values || {}
          let yValue
          switch (this.aggregationMode) {
            case 'absoluteMean':
              yValue = values.absoluteMean ?? 0
              break
            case 'total':
              yValue = values.total ?? 0
              break
            case 'absoluteTotal':
              yValue = values.absoluteTotal ?? 0
              break
            default: // 'mean'
              yValue = values.mean ?? 0
          }
          return {
            ...point,
            y: yValue,
            aggregationMode: this.aggregationMode,
          }
        })

        series.push({
          type: 'line',
          color: currentGraph?.color,
          name: seriesName,
          // TODO
          regression: points.length >= 2,
          regressionSettings: {
            hideInLegend: true,
            dashStyle: 'ShortDash',
            regressionSeriesOptions: {
              enableMouseTracking: false,
              states: {
                hover: {
                  enabled: false,
                },
              },
            },
            tooltip: {
              enabled: false,
            },
          },
          data: transformedPoints,
          states: {
            hover: {
              enabled: true,
              lineWidthPlus: 1,
              halo: {
                size: 8,
                opacity: 0.25,
              },
            },
          },
          userId,
          visible: isVisible,
          xAxis: i,
        })

        if (!_.isEmpty(this.examDateRange)) {
          this.options.xAxis[i].min = this.examDateRange[0]
          this.options.xAxis[i].max = this.examDateRange[1]
        } else {
          this.options.xAxis[i].min = undefined
          this.options.xAxis[i].max = undefined
        }

        if (this.isGroupStats) {
          const visibleStudent = this.visibleStudents.find((student) => `user_${student.userId}` === userId)

          this.setCurrentGraphs({
            userId,
            color: currentGraph?.color,
            name: visibleStudent?.name,
          })
        }
      })

      this.options = {
        ...this.options,
        series,
      }

      const isAbsoluteMode = this.aggregationMode === 'absoluteMean' || this.aggregationMode === 'absoluteTotal'

      this.options.yAxis = {
        ...this.options.yAxis,
        min: isAbsoluteMode ? 0 : null,
        startOnTick: isAbsoluteMode,
        plotLines: [
          {
            color: '#00FF00',
            width: 3,
            value: 0,
            zIndex: 5,
          },
        ],
      }

      const plotLines = [
        {
          color: ZERO_LINE_COLOR,
          width: 3,
          value: 0,
          zIndex: 5,
        },
      ]

      if (this.cohortData) {
        plotLines.push({
          color: 'blue',
          width: 0.5,
          value: this.cohortData.mean,
          zIndex: 4,
          label: {
            text: this.$t('global.cohort_avg') + `: ${_.round(this.cohortData.mean)}`,
          },
        })
      }

      this.options.yAxis.plotLines = plotLines

      this.options = { ...this.options }
    },

    selectStudent(userId) {
      this.selectedStudent = userId

      if (!userId) {
        this.hoveringUserIdLegend = null
      }
    },
  },
}
</script>

<style scoped lang="scss"></style>
