<template>
  <div class="angulation-curve-container" :style="{ display: !isGroupStats || (isGroupStats && activeBodyParts.length > 0) ? 'block' : 'none' }">
    <TestResults
      v-if="testResults"
      @close="onCloseTestResults()"
      :closable="true"
      :test-results="testResults"
    ></TestResults>
    <highcharts v-if="!loading && !angulationProcessing && temp" class="hc" :options="options" ref="chart"></highcharts>
    <div v-if="!loading && !angulationProcessing" class="curve-legends-container">
      <span
        v-for="(graph, i) in currentGraphs"
        :key="i"
        :style="{
          color: graph.color,
          cursor: 'pointer',
          marginLeft: i > 0 && '10px',
          fontSize:
            hoveringUserId === graph.userId || selectedStudent === graph.userId || hoveringUserIdLegend === graph.userId
              ? '16px'
              : '14px',
          fontWeight:
            hoveringUserId === graph.userId || selectedStudent === graph.userId || hoveringUserIdLegend === graph.userId
              ? 600
              : 400,
          opacity:
            hoveringUserId === graph.userId || selectedStudent === graph.userId || hoveringUserIdLegend === graph.userId
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
</template>

<script>
import { mapActions, mapState, mapMutations, mapGetters } from 'vuex'
import _ from 'lodash'
import EventBus from '@/lib/event-bus'
import { ZERO_LINE_COLOR } from './chartConstants'
import TestResults from '../TestResults'
import testResultsModalMixin from '../../mixins/testResultsModalMixin'
import { MR_PRACTICE_EXAM_ID, CT_PRACTICE_EXAM_ID } from '../../constants'
import config from '../../config'

export default {
  name: 'AngulationCurve',
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
      cohortData: null,
      globalData: null,
      selectedStudent: null,
      hoveringUserId: null,
      hoveringUserIdLegend: null,
      options: {
        credits: {
          enabled: false,
        },
        chart: {
          // type: 'spline',
          zoomType: 'xy',
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
            const angle = Math.round(this.y * 10) / 10
            const bodyPart = this.point.bodyPart || 'N/A'
            const individualAngles = this.point.individualAngles || []

            let anglesHtml = ''
            if (individualAngles.length > 0) {
              const anglesList = individualAngles
                .map((a) => Math.round(a * 10) / 10 + '°')
                .join(', ')
              anglesHtml = `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                  <div style="font-size: 11px; color: #666; margin-bottom: 4px;">
                    Individual Angles (${individualAngles.length}):
                  </div>
                  <div style="font-size: 12px; color: #333; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">
                    ${anglesList}
                  </div>
                </div>
              `
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
                  <span style="color: #666;">Avg. Angle Deviation:</span>
                  <strong>${angle}°</strong>
                </div>
                ${anglesHtml}
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
          text: this.$t('AngulationCurve.default_title'),
        },

        yAxis: {
          reversed: true,
          title: {
            text: this.$t('AngulationCurve.yAxisTitle'),
          },
          startOnTick: false,
          endOnTick: false,
          min: -2,
          softMax: 15,
          plotBands: [
            {
              from: 10,
              to: 180,
              color: 'rgba(211, 18, 70, 0.05)',
            },
            {
              from: 5,
              to: 10,
              color: 'rgba(255, 205, 60, 0.05)',
            },
            {
              from: 0,
              to: 5,
              color: 'rgba(58, 153, 137, 0.05)',
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
      currentGraphs: [],
      temp: true,
    }
  },
  computed: {
    ...mapState('statisticsService', [
      'activeBodyParts',
      'examDateRange',
      'loading',
      'visibleGraphs',
      'curveDateRange',
      'angulationProcessing',
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
    noData() {
      return typeof this.$props.whom === 'string' && _.isEmpty(this.rawData[this.$props.whom].points)
    },
    selectedStudents() {
      return this.$props.whom
    },
  },
  async mounted() {
    EventBus.$on('TestRunDeleted', this.fetchData)
    await Promise.all([this.fetchData(), this.fetchCohortData()])
  },
  beforeDestroy() {
    EventBus.$off('TestRunDeleted', this.fetchData)
    this.setCurveDateRange([])
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
    rawData() {
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
    selectedStudent(userId) {
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

      if (data && this.$props.showCohortAverage) {
        plotLines.push({
          color: 'blue',
          width: 0.5,
          value: data.mean,
          zIndex: 4,
          label: {
            text: this.$t('global.cohort_avg') + `: ${_.round(data.mean)}°`,
          },
        })

        this.options.yAxis.plotLines = plotLines
        this.options = { ...this.options }
      }
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
  },
  methods: {
    ...mapActions('statisticsService', ['getFactorScores_Angle']),
    ...mapMutations('statisticsService', ['setCurveDateRange', 'setProcessing']),

    async fetchData() {
      if (Object.keys(this.rawData).length === 0) this.setProcessing({ type: 'angulation', processing: true })

      try {
        this.rawData = await this.getFactorScores_Angle({
          whom: this.$props.whom,
          mean: false,
          points: true,
        })

        this.updateGraph()
      } catch (error) {
        console.error('Error fetching angulation data:', error)
      } finally {
        if (this.angulationProcessing) this.setProcessing({ type: 'angulation', processing: false })
      }
    },

    async fetchCohortData() {
      if (!this.$props.showCohortAverage) return

      try {
        this.cohortData = await this.getFactorScores_Angle({
          whom: `cohort_${this.$props.showCohortAverage}`,
          mean: true,
          points: false,
        })
      } catch (error) {
        console.error('Error fetching cohort angulation data:', error)
      }
    },

    setCurrentGraphs(graph) {
      if (!this.currentGraphs.includes((currentGraph) => currentGraph.userId === graph.userId))
        this.currentGraphs = [...this.currentGraphs, graph]
    },

    updateGraph() {
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

      Object.entries(this.rawData).forEach(([userId, data], i) => {
        let points = data.points

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
        const currentGraph = this.visibleGraphs.find((graph) => graph.userId === userId)

        if (this.activeBodyParts.length > 0) {
          points = points.filter((d) => this.activeBodyParts.length === 0 || this.activeBodyParts.includes(d.bodyPart))

          this.options.title.text = `${this.$t('AngulationCurve.title_prefix')} (${this.activeBodyPartGroupName})`
        } else {
          this.options.title.text = this.$t('AngulationCurve.default_title')
        }
        this.options.yAxis.title.text = this.$t('AngulationCurve.yAxisTitle')

        if (!points.length) return

        const isVisible = this.hoveringUserIdLegend
          ? userId === this.hoveringUserIdLegend
          : !this.selectedStudent ||
            (this.selectedStudent && userId === this.selectedStudent) ||
            userId === this.hoveringUserIdLegend

        const seriesName = this.visibleStudents.find((student) => `user_${student.userId}` === userId)?.name || this.nickName || this.legalName || 'Student'

        series.push({
          type: 'line',
          turboThreshold: 2000,
          color: currentGraph?.color,
          name: seriesName,
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
          // yAxis: i,
          xAxis: i,
          data: _.orderBy(points, 'x'),
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

      this.options.yAxis = {
        ...this.options.yAxis,
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

      if (this.cohortData && this.$props.showCohortAverage) {
        plotLines.push({
          color: 'blue',
          width: 0.5,
          value: this.cohortData.mean,
          zIndex: 4,
          label: {
            text: this.$t('global.cohort_avg') + `: ${_.round(this.cohortData.mean)}°`,
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

<style scoped lang="scss">
.angulation-curve-container {
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  padding: 20px 0;
}
</style>
