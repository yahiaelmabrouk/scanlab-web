<template>
  <StatisticsContainer>
    <template #title>
      <h5>{{ title }}</h5>
      <div class="mri-config-container d-flex flex-column flex-md-row">
        <v-radio-group v-if="isAdmin || isManager" v-model="sandboxFilter" row>
          <v-radio :label="$t('MRI.standard_mode')" value="non-sandbox"></v-radio>
          <v-radio :label="$t('MRI.sandbox_mode')" value="sandbox"></v-radio>
        </v-radio-group>
        <span v-if="hasScoreSorting" class="mr-5 ml-md-16 ml-5 d-flex"
          >{{ $t('global.y_sorting') }}: {{ $t('global.display') }}
          <v-text-field
            class="cohort-score-input"
            v-model="scoreFilterValue"
            type="number"
            :min="0"
            :max="99"
            :error="isScoreValueError"
          ></v-text-field>
          {{ $t('global.to') }} 100%</span
        >
        <v-expansion-panels
          v-if="isGroupStats && mriVisibleGraphs.length > 0"
          class="students-panel"
          v-model="studentsPanel"
        >
          <v-expansion-panel>
            <v-expansion-panel-header>{{ $t('global.students') }}</v-expansion-panel-header>
            <v-expansion-panel-content>
              <div
                v-for="graph in mriVisibleGraphs"
                :key="graph.userId"
                class="d-flex align-center"
                :style="{ textAlign: 'left' }"
              >
                <span class="line-color" :style="{ background: graph.color }"></span>
                <span class="line-name" :style="{ color: graph.color }">{{ graph.name }}</span>
              </div>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </template>
    <TestResults
      @close="onCloseTestResults()"
      v-if="testResults"
      :closable="true"
      :test-results="testResults"
    ></TestResults>
    <div>
      <highcharts v-if="!loading" class="hc" :options="options" ref="chart"></highcharts>
      <v-progress-circular v-else indeterminate size="60"></v-progress-circular>
    </div>
    <p v-if="!loading" class="ml-6 text-left">{{ $t('global.total') + ': ' + total }}</p>
  </StatisticsContainer>
</template>

<script>
import { mapState, mapActions, mapMutations, mapGetters } from 'vuex'
import moment from 'moment-timezone'
import _ from 'lodash'
import EventBus from '@/lib/event-bus'
import StatisticsContainer from './StatisticsContainer'
import TestResults from '../TestResults'
import { PRIME_COLORS, MR_PRACTICE_EXAM_ID, CT_PRACTICE_EXAM_ID } from '../../constants'
import config from '../../config'
import testResultsModalMixin from '../../mixins/testResultsModalMixin'

export default {
  name: 'MRIScoreLine',
  mixins: [testResultsModalMixin],
  components: {
    StatisticsContainer,
    TestResults,
  },
  props: {
    height: {
      type: String,
      default: '500',
    },
    whom: {
      type: [String, Array],
      default: 'everyone',
    },
    group: {
      type: String,
      default: 'userId',
    },
    groupLabel: {
      type: String,
      default: 'legalName',
    },
    title: {
      type: String,
      default: '',
    },
    filter: {
      type: Function,
      default: () => true,
    },
    exact: {
      type: Boolean,
      default: false,
    },
    visibleByDefault: {
      type: Boolean,
      default: false,
    },
    isGroupStats: {
      type: Boolean,
      default: false,
    },
    hasScoreSorting: {
      type: Boolean,
      default: true,
    },
    visibleStudents: {
      type: Array,
    },
    cohort: {
      type: Object,
    },
  },
  data() {
    return {
      isProcessing: true,
      // rawData: null, // TestRuns
      // rawMRIData: null, // QuestionSets
      currentCharts: [],
      studentsPanel: [],
      scoreFilterValue: 0,
      scoreFilterType: 'all',
      isScoreValueError: false,
      total: 0,
      mriVisibleGraphs: [],
      options: {
        series: [],
        credits: {
          enabled: false,
        },
        chart: {
          // type: 'spline',
          zoomType: 'x',
          events: {
            selection: (event) => {
              if (event.resetSelection) {
                this.$nextTick(() => {
                  //console.log(event.target.xAxis[0].min, event.target.xAxis[0].max)
                  this.setExamDateRange(null)
                  this.updateGraph()
                })
              } else {
                //console.log(event.xAxis[0].min, event.xAxis[0].max)
                this.setExamDateRange([event.xAxis[0].min, event.xAxis[0].max])
                this.updateGraph()
              }
            },
          },
        },
        noData: {
          text: 'No MRI Scores Available',
          style: {
            color: '#000000',
          },
        },
        title: {
          text: null,
          align: 'left',
        },
        colors: [
          '#e6194b',
          '#3cb44b',
          '#ffe119',
          '#4363d8',
          '#f58231',
          '#911eb4',
          '#46f0f0',
          '#f032e6',
          '#bcf60c',
          '#fabebe',
          '#008080',
          '#e6beff',
          '#9a6324',
          '#fffac8',
          '#800000',
          '#aaffc3',
          '#808000',
          '#ffd8b1',
          '#000075',
          '#808080',
          '#ffffff',
          '#000000',
        ],
        tooltip: {
          crosshairs: true,
          shared: true,
          valueSuffix: '%',
          xDateFormat: '%Y-%m-%d',
          headerFormat: '<span style="font-size: 14px; font-weight: 500; color: #8995a0;">{point.key}</span><br/>',
          pointFormatter: function () {
            const studentName = this.series.userOptions.studentName
            let html = ''
            if (studentName) {
              html += `<span style="font-weight: 600; color:${this.series.color}">${studentName}</span><br/>`
            }
            html += `<span style="color:${this.series.color}">${this.series.name}</span>: <b>${this.y}%</b><br/>`

            // Add "Prepared Exam" text for prepared exam points
            if (this.isPrepared) {
              html += `<span style="font-weight: bold; color: #3cb44b;">Prepared Exam</span><br/>`
            }

            return html
          },
          useHTML: true,
        },
        xAxis: {
          type: 'datetime',
        },
        time: {
          useUTC: false,
          timezone: moment.tz.guess(),
        },
        yAxis: {
          title: {
            text: this.$t('MRIScoreLine.default_title'),
          },
          min: 0,
          max: 100,
          plotBands: [
            {
              from: 0,
              to: 50,
              color: 'rgba(211, 18, 70, 0.05)',
            },
            {
              from: 50,
              to: 80,
              color: 'rgba(255, 205, 60, 0.05)',
            },
            {
              from: 80,
              to: 100,
              color: 'rgba(58, 153, 137, 0.05)',
            },
          ],
        },
        legend: {
          title: {
            text: this.$t('MRIScoreLine.select_items_here'),
          },
          enabled: true,
        },
        plotOptions: {
          series: {
            pointIntervalUnit: 'day',
            lineWidth: 4,
            states: {
              hover: {
                lineWidth: 5,
              },
            },
            visible: this.$props.visibleByDefault,
            marker: {
              enabled: true,
            },
            point: {
              events: {
                click: this.handleDataPointClick,
              },
            },
          },
        },
      },
      preparedExamStyle: {
        borderWidth: 3,
        //borderColor: 'black',
        fillColor: '#ffffff',
        radius: 6, // slightly larger marker
      },
    }
  },
  computed: {
    ...mapState('statisticsService', [
      'sandboxMode',
      'rawData',
      'rawMriData',
      'criticalThinkingScoresData',
      'activeBodyParts',
      'visibleGraphs',
      'loading',
      'examDateRange',
    ]),
    ...mapState('user', ['isAdmin', 'isManager']),
    ...mapState('authentication', ['accessToken', 'userId']),
    ...mapGetters('user', ['languageCode']),
    ...mapState('translatedContent', ['languagesTranslations']),
    filteredRawData() {
      let currentUsersRawData

      if (this.rawData && Array.isArray(this.rawData)) {
        currentUsersRawData = _.filter(this.rawData, this.$props.filter)
      } else {
        currentUsersRawData = {}
        Object.entries(this.rawData).forEach(([userId, data]) => {
          if (
            (typeof this.$props.whom === 'string' && this.$props.whom.startsWith('cohort_')) ||
            this.$props.whom.includes(userId)
          ) {
            currentUsersRawData[userId] = _.filter(data, this.$props.filter)
          }
        })
      }

      return currentUsersRawData
    },
    filteredRawMRIData() {
      let currentUsersMriRawData

      if (this.rawMriData && Array.isArray(this.rawMriData)) {
        currentUsersMriRawData = _.filter(this.rawMriData, this.$props.filter)
      } else {
        currentUsersMriRawData = {}
        // filterRawData = Object.entries(this.rawData).filter(([key, data]) => this.$props.whom.includes(key))
        Object.keys(this.rawMriData).length &&
          Object.entries(this.rawMriData).forEach(([userId, data]) => {
            if (
              (typeof this.$props.whom === 'string' && this.$props.whom.startsWith('cohort_')) ||
              this.$props.whom.includes(userId)
            ) {
              currentUsersMriRawData[userId] = _.filter(data, this.$props.filter)
            }
          })
      }

      return currentUsersMriRawData
    },

    combinedRawData() {
      if (Array.isArray(this.rawData) && Array.isArray(this.rawMriData)) {
        let output = _.clone(this.filteredRawData)

        _.each(this.filteredRawMRIData, (questionSetOnlyDataItem) => {
          let { questionSetResultId } = questionSetOnlyDataItem
          let noNewDataForThis = !_.some(this.filteredRawData, { questionSetResultId })
          if (
            noNewDataForThis &&
            (this.scoreFilterType === 'all' || this.scoreFilterType === 'mri') &&
            !output.find((dataItem) => dataItem.timestamp === questionSetOnlyDataItem.timestamp)
          ) {
            output.push(questionSetOnlyDataItem)
          }
        })
        // if it's not ordered by time, the graph connects the dots in the order they are, which looks broken
        output = _.orderBy(output, ['timestamp'], ['asc'])

        return output
      } else {
        let mappedCombindRawData = {}

        Object.keys(this.filteredRawData).length &&
          Object.entries(this.filteredRawData).forEach(([userId, data]) => {
            let output = _.clone(data)

            this.filteredRawMRIData?.[userId] &&
              _.each(this.filteredRawMRIData[userId], (questionSetOnlyDataItem) => {
                let { questionSetResultId } = questionSetOnlyDataItem
                let noNewDataForThis = !_.some(this.filteredRawData, { questionSetResultId })
                if (
                  noNewDataForThis &&
                  (this.scoreFilterType === 'all' || this.scoreFilterType === 'mri') &&
                  !output.find((dataItem) => dataItem.timestamp === questionSetOnlyDataItem.timestamp)
                ) {
                  output.push(questionSetOnlyDataItem)
                }
              })

            // if it's not ordered by time, the graph connects the dots in the order they are, which looks broken
            output = _.orderBy(output, ['timestamp'], ['asc'])

            mappedCombindRawData[userId] = output
          })

        return mappedCombindRawData
      }
    },

    noData() {
      return typeof this.$props.whom === 'string' && _.isEmpty(this.combinedRawData)
    },

    sandboxFilter: {
      get() {
        return this.sandboxMode
      },
      set(value) {
        this.setSandboxMode(value)
      },
    },
    selectedStudents() {
      return this.$props.whom
    },
  },
  async mounted() {
    EventBus.$on('TestRunDeleted', this.fetchData)
    this.updateChartTitle()
    // await this.fetchData() // Commented to avoid uuplicated fetching
  },
  beforeDestroy() {
    EventBus.$off('TestRunDeleted', this.fetchData)
    this.setExamDateRange([])
    this.setActiveBodyParts([])
    this.setActiveBodyPartDetails([])
    this.resetLoadedStatus()
  },
  watch: {
    filter() {
      this.updateGraph()
    },
    sandboxFilter() {
      this.setActiveBodyParts([])
      this.setActiveBodyPartDetails([])
      this.updateGraph()
    },
    selectedStudents: {
      immediate: true,
      async handler(newStudents) {
        this.resetScoreFilterValue()
        this.setActiveBodyParts([])
        this.setActiveBodyPartDetails([])

        if (Array.isArray(newStudents) && this.isGroupStats) {
          this.options.legend.symbolWidth = 0
          this.options.legend.useHTML = true
          this.options.plotOptions.series.marker.enabled = false
        } else {
          this.options.legend.symbolWidth = undefined
          this.options.legend.useHTML = undefined
          this.options.plotOptions.series.marker.enabled = true
        }

        await this.fetchData()
      },
    },
    rawData() {
      this.updateGraph()
    },
    activeBodyParts() {
      this.updateGraph()
    },
    rawMriData() {
      this.updateGraph()
    },
    cohort: {
      immediate: true,
      handler(newCohort) {
        if (newCohort) {
          this.scoreFilterValue = newCohort.settings?.showScore?.value ?? 0
          this.scoreFilterType = newCohort.settings?.showScore?.type ?? 'all'

          this.updateGraph()
        }
      },
    },
    scoreFilterValue(newValue) {
      const value = Number(newValue)

      if (value) {
        this.options.yAxis.min = value
        this.options.yAxis.startOnTick = false
        this.options.yAxis.endOnTick = false
        this.options.yAxis.alignTicks = false
      } else {
        this.options.yAxis.min = 0
        this.options.yAxis.startOnTick = true
        this.options.yAxis.endOnTick = true
        this.options.yAxis.alignTicks = true
      }

      if (value >= 0 && value <= 99) {
        this.isScoreValueError = false
        this.updateGraph()
      } else {
        this.isScoreValueError = true
      }
    },
    languageCode() {
      this.updateChartTitle()
    },
    languagesTranslations() {
      this.updateChartTitle()
    },
  },
  methods: {
    ...mapActions('statisticsService', ['getScanlabScores', 'getRawMRIScores']),
    ...mapMutations('statisticsService', [
      'setActiveBodyParts',
      'setActiveBodyPartDetails',
      'setExamDateRange',
      'setSandboxMode',
      'setVisibleGraphs',
      'resetVisibleGraphs',
      'resetLoadedStatus',
      'resetLoadedStatus',
    ]),
    ...mapActions('translatedContent', ['translateThisRecord']),
    updateChartTitle() {
      this.options.yAxis.title.text = this.$t('MRIScoreLine.default_title')
      this.updateGraph()
    },
    // Safely get the Highcharts instance
    getChart() {
      return this.$refs && this.$refs.chart && this.$refs.chart.chart ? this.$refs.chart.chart : null
    },
    async onCloseTestResults() {
      this.testResults = null
      this.resetLoadedStatus()
      await this.fetchData(true)
      this.updateGraph()
    },
    setMriVisibleGraphs(graph) {
      if (!this.mriVisibleGraphs.find((visibleGraph) => graph.userId === visibleGraph.userId))
        this.mriVisibleGraphs = [...this.mriVisibleGraphs, graph]
    },

    resetScoreFilterValue() {
      this.scoreFilterValue = this.cohort?.settings?.showScore?.value ?? 0
    },

    async handleDataPointClick(event) {
      if (!this.$props.exact) return
      await this.openTestResultsForPoint(event)
    },

    async fetchData(isAlwaysLoad = false) {
      await this.getScanlabScores({ whom: this.$props.whom, isAlwaysLoad: isAlwaysLoad })
      await this.getRawMRIScores({ whom: this.$props.whom, isAlwaysLoad })
    },

    updateGraph() {
      if (!this.noData) {
        if (this.$props.exact) {
          this.processExactData()
        } else {
          this.processPerDayData()
        }
      }
    },

    // x-axis will show the exact times that the scores were given
    processExactData() {
      const vmRef = this
      let baseUsersGroup = {}
      let total = 0
      const yAxisSortValue = Number(this.scoreFilterValue)

      this.resetVisibleGraphs()

      Object.entries(this.combinedRawData).forEach(([userId, data]) => {
        baseUsersGroup[userId] = _.groupBy(data, this.$props.group)
      })

      let serieses = []
      let allGroups = []
      const isSandboxView = this.sandboxFilter === 'sandbox'

      Object.entries(baseUsersGroup).forEach(([userId, baseGroup], i) => {
        for (const baseGroupKey in baseGroup) {
          const userScoreSet = baseGroup[baseGroupKey]
          const filteredData = []

          userScoreSet.forEach((scoreData) => {
            const multipleChoiceQuestionResults = scoreData.multipleChoiceQuestionResults?.map(
              (multipleChoiceQuestionResult) => {
                return {
                  ...multipleChoiceQuestionResult,
                  questionId: multipleChoiceQuestionResult.multipleChoiceQuestion.id,
                }
              }
            )

            const parseScore = (result) => Number(_.get(result, ['score'], 0))
            const criticalThinkingResults = _.uniqBy(multipleChoiceQuestionResults, 'questionId') || []
            const criticalThinkingOverallScore = _.meanBy(criticalThinkingResults, parseScore).toFixed(2)

            const score =
              this.scoreFilterType === 'all'
                ? scoreData.score
                : this.scoreFilterType === 'mri'
                ? scoreData.questionSetResultScore
                : criticalThinkingOverallScore

            // Skip prepared exams for students (only admins/managers can see them)
            const isPreparedExam = scoreData.preparedExamId !== null
            const canSeePreparedExams = this.isAdmin || this.isManager
            if (isPreparedExam && !canSeePreparedExams) {
              return
            }
            const practiceExamId = config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
            if (scoreData.preparedExamId === practiceExamId) {
              return
            }

            if (
              !!scoreData.isSandbox === isSandboxView &&
              Number(score) >= yAxisSortValue &&
              (_.isEmpty(this.examDateRange) ||
                (!_.isEmpty(this.examDateRange) &&
                  new Date(scoreData.timestamp).getTime() >= this.examDateRange[0] &&
                  new Date(scoreData.timestamp).getTime() <= this.examDateRange[1]))
            ) {
              filteredData.push({ ...scoreData, score, criticalThinkingOverallScore })
            }
          })

          const data = _.map(filteredData, (scoreData) => {
            const isPreparedPoint = scoreData.preparedExamId !== null

            const element = {
              x: new Date(scoreData.timestamp),
              y: _.toNumber(scoreData.score),
              questionSetResultId: scoreData.questionSetResultId,
              isViewedAdminComment: scoreData.isViewedAdminComment,
              isViewedUserReply: scoreData.isViewedUserReply,
              isSandbox: !!scoreData.isSandbox,
              overall: scoreData.questionSetResultScore,
              score: scoreData.score,
              criticalThinkingOverallScore: scoreData.criticalThinkingOverallScore,
              userId: userId.replace('user_', ''),
              isPrepared: isPreparedPoint,
            }

            const seriesColor = this.isGroupStats
              ? PRIME_COLORS[i]
              : this.options.colors[i % this.options.colors.length]

            if (isPreparedPoint) {
              element.marker = {
                lineWidth: this.preparedExamStyle.borderWidth,
                lineColor: seriesColor,
                fillColor: this.preparedExamStyle.fillColor,
                radius: this.preparedExamStyle.radius,
              }
            }

            const studentUserId = userId.replace('user_', '')
            const isStudentView = this.userId == studentUserId

            if (!scoreData.isViewedUserReply && scoreData.isHasReply && !isStudentView) {
              element.color = '#fcd000'
              element.marker = {
                symbol: 'url(/img/warning.png)',
              }
            } else if (!scoreData.isViewedAdminComment && scoreData.isHasComment && isStudentView) {
              element.color = '#fcd000'
              element.marker = {
                symbol: 'url(/img/warning.png)',
              }
            } else if (scoreData.isHasReply) {
              element.color = '#006f00'
              element.marker = {
                symbol: 'url(/img/reply-warning.png)',
              }
            } else if (scoreData.isHasComment) {
              element.color = '#0000ff'
              element.marker = {
                symbol: 'url(/img/viewed.png)',
              }
            }
            return element
          })

          // if (!data.length) return

          total += data.length

          const isVisible =
            this.activeBodyParts.includes(baseGroupKey) &&
            ((typeof this.$props.whom === 'string' && this.$props.whom === userId) ||
              (Array.isArray(this.$props.whom) && this.$props.whom.includes(userId)))

          let prefix = userScoreSet[0][this.$props.groupLabel]
          if (this.$props.groupLabel == 'bodyPart') {
            this.translateThisRecord({
              type: 'bodyPart',
              record: { id: userScoreSet[0].bodyPartId, name: userScoreSet[0].bodyPart },
              lang: this.languageCode,
            })

            const key = `bodyPart|${userScoreSet[0].bodyPartId}|${this.languageCode}`
            const translatedContent = this.$store.state.translatedContent.translatedContent
            if (translatedContent[key]) {
              prefix = translatedContent[key].name || prefix
            }
          }
          const visibleStudent = this.isGroupStats
            ? this.$props.visibleStudents?.find((student) => `user_${student.userId}` === userId)
            : null
          serieses.push({
            name: `${prefix} ${this.$props.isGroupStats ? `` : `(${data.length})`}`,
            data,
            zoneAxis: 'x',
            // yAxis: i,
            userId,
            studentName: visibleStudent?.name,
            zones: data.map((element) => ({ value: element.x })),
            [`${this.$props.group}`]: baseGroupKey,
            visible: isVisible,
            color: this.isGroupStats && PRIME_COLORS[i],
            showInLegend: !allGroups.includes(baseGroupKey) && data.length,
            bodyPartId: userScoreSet[0].bodyPartId,
            bodyPart: userScoreSet[0].bodyPart,
            events: {
              legendItemClick: function () {
                const vm = vmRef          
                const chart = this.chart    // Highcharts series -> chart
                vm.$nextTick(() => {
                  if (vm.$props.isGroupStats) {
                    if (vm.$props.groupLabel === 'bodyPart') {
                      vm.setActiveBodyParts([baseGroupKey])
                    }
                    vm.setActiveBodyPartDetails([{ id: userScoreSet[0].bodyPartId, name: userScoreSet[0].bodyPart }])
                  } else {
                    if (vm.$props.groupLabel === 'bodyPart') {
                      const details = chart
                        ? chart.series.filter(s => s.visible).map(s => ({
                            id: s.userOptions.bodyPartId,
                            name: s.userOptions.bodyPart,
                          }))
                        : []
                      vm.setActiveBodyPartDetails(details)
                    }
                    const active = chart
                      ? chart.series.filter(s => s.visible).map(s => s.userOptions[`${vm.$props.group}`])
                      : []
                    vm.setActiveBodyParts(active)
                  }
                })
                // return void to keep default toggle behavior
              },
            },
          })

          serieses.sort((a, b) => a.name.localeCompare(b.name))

          if (!allGroups.includes(baseGroupKey)) allGroups.push(baseGroupKey)

          if (this.isGroupStats) {
            if (isVisible) {
              this.setMriVisibleGraphs({
                userId,
                color: PRIME_COLORS[i],
                name: visibleStudent.name,
              })
            }

            this.setVisibleGraphs({
              userId,
              color: PRIME_COLORS[i],
              name: visibleStudent.name,
            })
          }
        }
      })

      if (!this.angulationProcessing && !this.loading && !this.coverageProcessing) {
        this.options.legend.enabled = true
      }

      this.total = total

      if (this.examDateRange) {
        this.$nextTick(() => {
          const chart = this.getChart()
          if (chart && typeof chart.showResetZoom === 'function') chart.showResetZoom()
        })
      }

      this.options = { ...this.options, series: serieses }
    },

    // x-axis will show the averages of scores over each day
    processPerDayData() {
      const vmRef = this
      // find the first day to use as our starting point
      const yAxisSortValue = Number(this.scoreFilterValue)
      const isSandboxView = this.sandboxFilter === 'sandbox'
      let total = 0
      let serieses = []

      for (const baseGroupKey in this.combinedRawData) {
        // const baseGroupCounts = _.mapValues(baseGroup, _.size)
        const baseGroupScoreSet = this.combinedRawData[baseGroupKey]
        const filteredData = []

        baseGroupScoreSet.forEach((scoreData) => {
          const multipleChoiceQuestionResults = scoreData.multipleChoiceQuestionResults?.map(
            (multipleChoiceQuestionResult) => {
              return {
                ...multipleChoiceQuestionResult,
                questionId: multipleChoiceQuestionResult.multipleChoiceQuestion.id,
              }
            }
          )
          const parseScore = (result) => Number(_.get(result, ['score'], 0))
          const criticalThinkingResults = _.uniqBy(multipleChoiceQuestionResults, 'questionId') || []
          const criticalThinkingOverallScore = _.meanBy(criticalThinkingResults, parseScore).toFixed(2)

          const score =
            this.scoreFilterType === 'all'
              ? scoreData.score
              : this.scoreFilterType === 'mri'
              ? scoreData.questionSetResultScore
              : criticalThinkingOverallScore

          // Skip prepared exams for students (only admins/managers can see them)
          const isPreparedExam = scoreData.preparedExamId !== null
          const canSeePreparedExams = this.isAdmin || this.isManager
          if (isPreparedExam && !canSeePreparedExams) {
            return
          }
          const practiceExamId = config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
          if (scoreData.preparedExamId === practiceExamId) {
            return
          }

          if (
            !!scoreData.isSandbox === isSandboxView &&
            Number(score) >= yAxisSortValue &&
            (_.isEmpty(this.examDateRange) ||
              (!_.isEmpty(this.examDateRange) &&
                new Date(scoreData.timestamp).getTime() >= this.examDateRange[0] &&
                new Date(scoreData.timestamp).getTime() <= this.examDateRange[1]))
          ) {
            const isPreparedPoint = scoreData.preparedExamId !== null

            const element = {
              x: new Date(scoreData.timestamp),
              y: Number(score),
              questionSetResultId: scoreData.questionSetResultId,
              userId: baseGroupKey.replace('user_', ''),
              isViewedAdminComment: scoreData.isViewedAdminComment,
              isViewedUserReply: scoreData.isViewedUserReply,
              score,
              criticalThinkingOverallScore,
              isPrepared: isPreparedPoint,
            }

            if (isPreparedPoint) {
              element.marker = {
                lineWidth: this.preparedExamStyle.borderWidth,
                lineColor: this.preparedExamStyle.borderColor,
                fillColor: this.preparedExamStyle.fillColor,
                radius: this.preparedExamStyle.radius,
              }
            }

            filteredData.push(element)
          }
        })

        total += filteredData.length

        let prefix = baseGroupScoreSet[0][this.$props.groupLabel]
        if (this.$props.groupLabel == 'bodyPart') {
          this.translateThisRecord({
            type: 'bodyPart',
            record: { id: baseGroupScoreSet[0].bodyPartId, name: baseGroupScoreSet[0].bodyPart },
            lang: this.languageCode,
          })

          const key = `bodyPart|${baseGroupScoreSet[0].bodyPartId}|${this.languageCode}`
          const translatedContent = this.$store.state.translatedContent.translatedContent
          if (translatedContent[key]) {
            prefix = translatedContent[key].name || prefix
          }
        }
        const perDayStudentName = this.isGroupStats
          ? this.$props.visibleStudents?.find((student) => `user_${student.userId}` === baseGroupKey)?.name
          : undefined
        serieses.push({
          name: `${prefix} (${filteredData.length})`,
          data: filteredData,
          [`${this.$props.group}`]: baseGroupKey,
          studentName: perDayStudentName,
          bodyPartId: baseGroupScoreSet[0].bodyPartId,
          bodyPart: baseGroupScoreSet[0].bodyPart,
          events: {
            legendItemClick: function () {
              const vm = vmRef    
              const chart = this.chart
              vm.$nextTick(() => {
                vm.resetScoreFilterValue()
                if (vm.$props.groupLabel === 'bodyPart') {
                  const details = chart
                    ? chart.series.filter(s => s.visible).map(s => ({
                        id: s.userOptions.bodyPartId,
                        name: s.userOptions.bodyPart,
                      }))
                    : []
                  vm.setActiveBodyPartDetails(details)
                }
                const active = chart
                  ? chart.series.filter(s => s.visible).map(s => s.userOptions[`${vm.$props.group}`])
                  : []
                vm.setActiveBodyParts(active)
              })
            },
          },
        })
        // }
      }

      this.total = total

      serieses.sort((a, b) => a.name.localeCompare(b.name))

      if (this.examDateRange) {
        this.$nextTick(() => {
          const chart = this.getChart()
          if (chart && typeof chart.showResetZoom === 'function') chart.showResetZoom()
        })
      }
      this.options = { ...this.options, series: serieses }
    },
  },
}
</script>

<style scoped lang="scss">
.v-input--selection-controls {
  margin-top: 0;
}

.mri-config-container {
  position: relative;
  width: 100%;

  & .students-panel {
    position: absolute;
    right: 10px;
    max-width: 150px;

    & .v-expansion-panel-header {
      font-size: 14px;
      padding: 5px 10px;
    }

    ::v-deep .v-expansion-panel-content__wrap {
      padding: 5px 10px;
      font-size: 14px;
    }
  }
}

.line-color {
  margin-right: 6px;
  height: 3px;
  width: 15px;
}

.line-name {
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 30px;
}
</style>
