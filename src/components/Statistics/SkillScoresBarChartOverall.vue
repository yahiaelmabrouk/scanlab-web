<template>
  <div>
    <highcharts :options="chartOptions" ref="chartRef"></highcharts>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import _, { debounce } from 'lodash'

export default {
  name: 'SkillScoresBarChartOverall',
  props: {
    whom: {
      type: [String, Array],
      default: 'everyone',
    },
  },
  data() {
    return {
      chart: null,
      currentActiveBodyParts: [],
    }
  },
  computed: {
    ...mapState('statisticsService', ['rawMriData', 'activeBodyParts', 'activeBodyPartDetails', 'examDateRange']),
    ...mapState('statisticsService', { statsRawData: 'rawData' }),
    ...mapState('translatedContent', ['translatedContent', 'languagesTranslations']),
    ...mapGetters('statisticsService', ['activeBodyPartGroupName']),
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
    dateRange() {
      if (!Array.isArray(this.examDateRange) || this.examDateRange.length !== 2) {
        return [0, Infinity]
      }
      return [Number(this.examDateRange[0]) || 0, Number(this.examDateRange[1]) || Infinity]
    },
    filteredMriData() {
      const [startDate, endDate] = this.dateRange
      const bodyPartMap = this.bodyPartByQuestionSetResultId

      return Object.values(this.rawMriData || {})
        .flat()
        .map((entry) => {
          const mapped = bodyPartMap.get(entry?.questionSetResultId)
          return mapped ? { ...entry, bodyPart: mapped } : entry
        })
        .filter(
          (entry) =>
            entry &&
            entry.overallSkillScores &&
            entry.bodyPart &&
            this.activeBodyParts &&
            this.activeBodyParts.includes(entry.bodyPart) &&
            entry.timestamp &&
            new Date(entry.timestamp).getTime() >= startDate &&
            new Date(entry.timestamp).getTime() <= endDate &&
            entry.isSandbox !== true
        )
    },
    dateRangeText() {
      const [startDate, endDate] = this.dateRange
      const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      }
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    },
    chartTitle() {
      if (this.activeBodyParts.length === 0) {
        return this.$t('SkillScoresBarChartOverall.default_title')
      } else {
        return `${this.$t('SkillScoresLine.title_prefix')} (${this.activeBodyPartGroupName})`
      }
    },
    chartOptions() {
      try {
        const allMriData = this.filteredMriData

        if (allMriData.length === 0) {
          return this.getEmptyChartConfig()
        }

        // Extract unique skill names and initialize sum and count objects
        const skillSums = {}
        const skillCounts = {}

        // Calculate sums and counts for each skill
        allMriData.forEach((entry) => {
          Object.entries(entry.overallSkillScores).forEach(([skillKey, skillData]) => {
            if (!skillData || typeof skillData.skillScore !== 'number') return

            if (!skillSums[skillKey]) {
              skillSums[skillKey] = 0
              skillCounts[skillKey] = 0
            }
            skillSums[skillKey] += skillData.skillScore
            skillCounts[skillKey] += 1
          })
        })

        // Calculate averages and prepare data for the chart
        const skillAverages = Object.entries(skillSums)
          .filter(([_, sum]) => sum > 0)
          .map(([skillKey, sum]) => ({
            name: skillKey,
            y: Number((sum / skillCounts[skillKey]).toFixed(2)),
            examCount: skillCounts[skillKey],
            color: this.getColorForScore(Number((sum / skillCounts[skillKey]).toFixed(2))), // Add this line
          }))

        // Sort by average score descending
        skillAverages.sort((a, b) => b.y - a.y)

        let categories = skillAverages.map((skill) =>
          skill.name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim()
        )
        categories = categories.map((skillName) => {
          // Check if the translation exists for the skill name
          const translatedSkillNameExist = this.$te(
            `SkillScores.${skillName ? skillName.replace('/', '_') : skillName}`
          )
          return translatedSkillNameExist
            ? this.$t(`SkillScores.${skillName ? skillName.replace('/', '_') : skillName}`)
            : skillName
        })

        return {
          chart: {
            type: 'bar',
            animation: true,
            events: {
              load: function () {
                this.showLoading()
                setTimeout(() => this.hideLoading(), 10)
              },
            },
          },
          title: {
            //text: this.$t('SkillScoresLine.default_title'),
            text: this.chartTitle,
            align: 'left',
          },
          xAxis: {
            categories,
            title: {
              text: this.$t('global.skills'),
            },
          },
          yAxis: {
            title: {
              text: this.$t('global.average_score'),
            },
            min: 0,
            max: 100,
          },
          tooltip: {
            formatter: function () {
              const point = this.point
              const formattedName = categories[point.index]
              return (
                `<b>${formattedName}</b><br/>` +
                `Average Score: ${point.y}%<br/>` +
                `Number of Exams: ${point.examCount}`
              )
            },
          },
          series: [
            {
              name: this.$t('global.average_score'),
              data: skillAverages,
              colorByPoint: true, // Add this line to use individual colors for each bar
            },
          ],
          plotOptions: {
            bar: {
              dataLabels: {
                enabled: true,
                format: '{y}%',
              },
              animation: {
                duration: 500,
              },
            },
          },
          credits: {
            enabled: false,
          },
        }
      } catch (error) {
        console.error('Error generating chart options:', error)
        return this.getEmptyChartConfig()
      }
    },
  },
  methods: {
    getColorForScore(score) {
      if (score <= 85) {
        return '#FF4136' // Red for low scores
      } else if (score <= 95) {
        return '#FF851B' // Orange for medium scores
      } else {
        return '#2ECC40' // Green for high scores
      }
    },
    getEmptyChartConfig() {
      return {
        chart: {
          type: 'bar',
        },
        title: {
          text: 'No Skill Score Data Available',
          align: 'left',
        },
        xAxis: {
          categories: [],
        },
        yAxis: {
          title: {
            text: this.$t('global.average_score'),
          },
          min: 0,
          max: 100,
        },
        series: [
          {
            name: this.$t('global.average_score'),
            data: [],
          },
        ],
        credits: {
          enabled: false,
        },
      }
    },
  },
  watch: {
    examDateRange: {
      handler() {
        // The chart will automatically update due to reactive dependencies
      },
      deep: true,
    },
  },
  created() {},
  mounted() {
    if (this.$refs.chartRef) {
      this.chart = this.$refs.chartRef.chart
    }
  },
}
</script>
