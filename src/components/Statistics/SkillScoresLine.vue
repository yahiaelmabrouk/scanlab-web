<template>
  <div><highcharts :options="chartOptions"></highcharts></div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { mapActions } from 'vuex/dist/vuex.common.js'
import _ from 'lodash'
export default {
  name: 'SkillScoresLine',
  components: {},
  props: {
    whom: {
      type: [String, Array],
      default: 'everyone',
    },
    showAllDataOnNoneSelected: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      chartOptions: {
        chart: {
          type: 'line',
          zoomType: 'x',
          panning: true,
          panKey: 'shift',
        },
        plotOptions: {
          series: {
            findNearestPointBy: 'x',
            minPointLength: 0,
            // Ensure all valid points are shown
            getExtremesFromAll: true,
          },
        },
        title: {
          align: 'left',
          text: this.$t('SkillScoresLine.default_title'),
        },
        xAxis: {
          type: 'datetime',
          ordinal: false, // Preserve time gaps
          minRange: 24 * 3600 * 1000, // Minimum 1 day zoom
          events: {
            afterSetExtremes: function (e) {
              if (!e.trigger) return // Skip initial load

              const chart = this.chart
              const allPoints = chart.series.reduce((points, series) => {
                return points.concat(series.points.filter((p) => p.y !== null))
              }, [])

              if (allPoints.length === 0) return

              // Find visible points
              const visiblePoints = allPoints.filter((p) => p.x >= e.min && p.x <= e.max)

              if (visiblePoints.length === 0) {
                // If no points visible, zoom to include nearest point
                const nearestPoint = allPoints.reduce(
                  (nearest, p) => {
                    const distToMin = Math.abs(p.x - e.min)
                    return distToMin < nearest.dist ? { point: p, dist: distToMin } : nearest
                  },
                  { dist: Infinity }
                ).point

                chart.xAxis[0].setExtremes(
                  nearestPoint.x - 86400000, // 1 day before
                  nearestPoint.x + 86400000 // 1 day after
                )
              }
            },
          },
        },
        yAxis: {
          title: {
            text: this.$t('SkillScoresLine.skill_score'),
          },
          max: 100,
        },
        tooltip: {
          formatter: function () {
            const date = new Date(this.x)
            const options = {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false, // 24-hour format
            }
            const formattedDate = date.toLocaleString(undefined, options) // Local time with 24-hour format
            const skillScore = this.y
            return `<b>${this.series.name}</b><br/>${formattedDate}<br/>Skill Score: ${skillScore}`
          },
        },
        series: [], // This will be filled with skill scores data
        credits: {
          enabled: false,
        },
      },
    }
  },
  computed: {
    ...mapState('statisticsService', ['rawMriData', 'activeBodyParts', 'activeBodyPartDetails', 'examDateRange']),
    ...mapState('statisticsService', { statsRawData: 'rawData' }),
    ...mapState('user', ['isAdmin', 'isManager']),
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
    ...mapState('translatedContent', ['translatedContent', 'languagesTranslations']),
    ...mapGetters('statisticsService', ['activeBodyPartGroupName']),
    nonSandboxMriData() {
      const canSeePreparedExams = this.isAdmin || this.isManager
      const bodyPartMap = this.bodyPartByQuestionSetResultId
      return Object.entries(this.rawMriData || {}).reduce((acc, [userId, exams]) => {
        acc[userId] = exams
          .filter((exam) => {
            // Filter out sandbox exams
            if (exam.isSandbox) return false
            // Filter out prepared exams for students (only admins/managers can see them)
            if (exam.preparedExamId !== null && !canSeePreparedExams) return false
            return true
          })
          .map((exam) => {
            const mapped = bodyPartMap.get(exam.questionSetResultId)
            return mapped ? { ...exam, bodyPart: mapped } : exam
          })
        return acc
      }, {})
    },
    formattedData() {
      let result = {}

      // Collect all timestamps and ensure they appear on the x-axis
      for (const userId in this.rawMriData) {
        this.nonSandboxMriData[userId].forEach((exam) => {
          // Check if the exam body part matches any of the activeBodyParts
          if (
            this.activeBodyParts.length === 0 || // Include all if no active body parts
            this.activeBodyParts.some((part) => exam.bodyPart.includes(part))
          ) {
            const timestamp = new Date(exam.timestamp).getTime() // Convert to UNIX timestamp for datetime axis

            if (!result[timestamp]) {
              result[timestamp] = {} // Initialize for each timestamp
            }

            // Handle overallSkillScores if present
            if (exam.overallSkillScores) {
              Object.keys(exam.overallSkillScores).forEach((skillKey) => {
                const skillName = exam.overallSkillScores[skillKey]?.skillName
                const skillScore = exam.overallSkillScores[skillKey]?.skillScore
                result[timestamp][skillName] = skillScore
              })
            } else {
              // Ensure a null entry for missing overallSkillScores
              result[timestamp] = null
            }
          }
        })
      }

      return result
    },
  },
  watch: {
    rawMriData: {
      immediate: true,
      handler() {
        this.updateChart()
      },
    },
    activeBodyParts: {
      handler() {
        this.updateChart() // Update chart when activeBodyParts change
      },
      deep: true, // Ensure deep watching of array changes
    },
    examDateRange: {
      immediate: true,
      handler(newRange) {
        this.updateXAxisRange(newRange)
        console.log(newRange)
      },
    },
    languageCode() {
      this.updateChart()
    },
    languagesTranslations() {
      this.updateChart()
    },
    activeBodyPartDetails() {
      this.activeBodyPartDetails.forEach((detail) => {
        this.translateThisRecord({ type: 'bodyPart', record: detail, lang: this.languageCode })
      })
    },
    activeBodyPartGroupName() {
      this.updateChartTitle()
    },
  },
  methods: {
    ...mapActions('translatedContent', ['translateThisRecord']),
    updateChartTitle() {
      this.chartOptions.title.text =
        this.activeBodyParts.length > 0
          ? `${this.$t('SkillScoresLine.title_prefix')} (${this.activeBodyPartGroupName})`
          : this.showAllDataOnNoneSelected
          ? this.$t('SkillScoresLine.default_title')
          : ''
      this.chartOptions.yAxis.title.text = this.$t('SkillScoresLine.skill_score')
    },

    updateChart() {
      this.updateChartTitle()
      const seriesData = {}

      const shouldShowData = this.activeBodyParts.length > 0 || this.showAllDataOnNoneSelected

      if (shouldShowData) {
        // Collect skill names
        const allSkillNames = new Set(
          Object.values(this.formattedData)
            .filter(Boolean)
            .flatMap((examData) => Object.keys(examData))
        )

        // Initialize series
        allSkillNames.forEach((skillName) => {
          const translatedSkillNameExist = this.$te(
            `SkillScores.${skillName ? skillName.replace('/', '_') : skillName}`,
            this.languageCode
          )
          seriesData[skillName] = {
            name: translatedSkillNameExist
              ? this.$t(`SkillScores.${skillName ? skillName.replace('/', '_') : skillName}`, this.languageCode)
              : skillName,
            data: [],
            lineWidth: 3,
            marker: { radius: 5 },
            connectNulls: true,
          }
        })

        // Sort timestamps and organize data
        const sortedTimestamps = Object.keys(this.formattedData)
          .map(Number)
          .sort((a, b) => a - b)

        sortedTimestamps.forEach((timestamp) => {
          allSkillNames.forEach((skillName) => {
            const skillScore = this.formattedData[timestamp]?.[skillName] ?? null
            seriesData[skillName].data.push([timestamp, skillScore])
          })
        })
      }

      this.chartOptions.series = Object.values(seriesData)

      // Auto-zoom to data range
      const timestamps = Object.keys(this.formattedData).map(Number)
      if (timestamps.length) {
        this.chartOptions.xAxis.min = Math.min(...timestamps)
        this.chartOptions.xAxis.max = Math.max(...timestamps)
      }
    },
    updateXAxisRange(newRange) {
      if (Array.isArray(newRange) && newRange.length === 2) {
        // Set min and max based on the provided range
        this.chartOptions.xAxis.min = newRange[0] // Set min to the first value of the range
        this.chartOptions.xAxis.max = newRange[1] // Set max to the second value of the range
      } else {
        // Reset to default (automatic range)
        this.chartOptions.xAxis.min = null
        this.chartOptions.xAxis.max = null
      }
    },
  },
}
</script>

<style lang="scss"></style>
