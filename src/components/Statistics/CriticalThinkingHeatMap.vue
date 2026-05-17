<template>
  <StatisticsContainer>
    <template #title>
      <h5>{{ title }}</h5>
    </template>
    <v-radio-group v-if="canSeePreparedExams" v-model="examMode" row dense hide-details class="mt-0 mb-2">
      <v-radio :label="$t('global.standard_exams', languageCode)" value="standard"></v-radio>
      <v-radio :label="$t('global.prepared_exams', languageCode)" value="prepared"></v-radio>
    </v-radio-group>
    <highcharts v-if="!loading && !noData" :key="examMode" class="hc" :options="options" ref="chart"></highcharts>
    <div
      v-else-if="!loading"
      class="d-flex align-center justify-center text-center"
      :style="{ minHeight: `${height}px` }"
    >
      {{ emptyMessage }}
    </div>
    <v-progress-circular v-else indeterminate size="60"></v-progress-circular>
  </StatisticsContainer>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import _ from 'lodash'
import { CT_PRACTICE_EXAM_ID, MR_PRACTICE_EXAM_ID } from '../../constants'
import config from '../../config'
import StatisticsContainer from './StatisticsContainer.vue'

export default {
  name: 'CriticalThinkingHeatMap',
  components: {
    StatisticsContainer,
  },
  props: {
    height: {
      type: String,
      default: '300',
    },
    whom: {
      type: String,
      default: 'everyone',
    },
    title: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      loading: true,
      rawData: null,
      examMode: 'standard',
      options: {
        series: [],
        chart: {
          toolbar: {
            show: true,
          },
          type: 'heatmap',
        },
        noData: {
          text: 'No Critical Thinking Scores Available',
          style: {
            color: '#000000',
          },
        },
        colorAxis: {
          min: 0,
          max: 100,
          stops: [
            [0, '#d31246'],
            [0.8, '#ffcd3c'],
            [1, '#3b7e50'],
          ],
        },
        title: {
          text: null,
          align: 'left',
        },
        tooltip: {},
        plotOptions: {
          heatmap: {
            useFillColorAsStroke: true,
            dataLabels: {
              enabled: true,
              formatter: function () {
                return this.point.value !== null ? this.point.value + '%' : ''
              },
            },
            getExtremesFromAll: true,
          },
        },
      },
    }
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapState('user', ['isAdmin', 'isManager']),
    ...mapState('translatedContent', ['languagesTranslations']),
    canSeePreparedExams() {
      return this.isAdmin || this.isManager
    },
    filteredData() {
      const practiceExamId = config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
      // `answer == null` ⇒ the question was abandoned (score is 0 but unearned),
      // so drop it before counts/averages are computed.
      const data = _.filter(this.rawData, (d) => d.preparedExamId !== practiceExamId && d.answer != null)
      if (!this.canSeePreparedExams || this.examMode === 'standard') {
        return _.filter(data, (d) => d.preparedExamId == null)
      }
      return _.filter(data, (d) => d.preparedExamId != null)
    },
    noData() {
      return _.size(this.filteredData) === 0
    },
    emptyMessage() {
      const key = this.examMode === 'prepared' ? 'global.no_prepared_exam_data' : 'global.no_standard_exam_data'
      return this.$t(key, this.languageCode)
    },
  },
  watch: {
    async whom() {
      await this.fetchData()
      this.updateGraph()
    },
    examMode() {
      this.updateGraph()
    },
    languageCode() {
      this.updateGraph()
    },
    languagesTranslations() {
      this.updateGraph()
    },
  },
  async mounted() {
    await this.fetchData()

    this.updateGraph()
  },
  methods: {
    ...mapActions('statisticsService', ['getRawCriticalThinkingScores']),

    async fetchData() {
      this.loading = true
      try {
        this.rawData = await this.getRawCriticalThinkingScores({ whom: this.$props.whom })
      } catch (error) {
        console.error('Error fetching critical thinking data:', error)
        this.rawData = []
      }
    },

    updateGraph() {
      this.options.noData.text = this.$t('global.no_data', this.languageCode)

      const noneAnsweredText = this.$t('global.none_answered', this.languageCode)
      this.options.tooltip = {
        formatter: function () {
          if (this.point.value !== null) {
            return `${this.point.value}%`
          } else {
            return noneAnsweredText
          }
        },
      }

      if (this.noData) {
        this.loading = false
        return
      }

      this.loading = true

      const difficultyGroups = _.groupBy(this.filteredData, 'difficulty')
      const categoryGroups = _.groupBy(this.filteredData, 'category')

      const difficultyCounts = _.mapValues(difficultyGroups, _.size)
      const categoryCounts = _.mapValues(categoryGroups, _.size)

      const sortedDifficulties = _.keys(difficultyGroups).sort().reverse()
      const sortedCategories = _.keys(categoryGroups).sort()

      let xNames = sortedCategories.map((category) => {
        const translatedSkillNameExist = this.$te(`CriticalThinkingCategory.${category}`, this.languageCode)
        return translatedSkillNameExist
          ? `${this.$t(`CriticalThinkingCategory.${category}`, this.languageCode)} (${categoryCounts[category]})`
          : `${category} (${categoryCounts[category]})`
      })
      let yNames = []

      const averageRowName = `${this.$t('global.overall', this.languageCode)} (${_.size(this.filteredData)})`

      this.options.series = _.map(sortedDifficulties, (difficulty, dIndex) => {
        const userScoreSet = difficultyGroups[difficulty]
        const name = `${
          difficulty !== 'null' ? `${this.$t('global.level', this.languageCode)} ` + difficulty : this.$t('global.no_difficulty', this.languageCode)
        } (${difficultyCounts[difficulty]})`
        yNames.push(name)

        // for each category in each difficulty, average the user's scores
        const groupByCategory = _.groupBy(userScoreSet, 'category')
        const data = _.map(sortedCategories, (category, cIndex) => {
          const value = groupByCategory[category]
            ? _.round(
                _.meanBy(groupByCategory[category], (d) => _.toNumber(d.score)),
                2
              )
            : null

          return {
            x: cIndex,
            y: dIndex,
            value,
          }
        })

        return {
          name,
          data,
        }
      })

      const averageRowIndex = yNames.length
      yNames.push(averageRowName)

      const averageData = _.map(sortedCategories, (category, cIndex) => {
        const value = categoryGroups[category]
          ? _.round(
              _.meanBy(categoryGroups[category], (d) => _.toNumber(d.score)),
              2
            )
          : null

        return {
          x: cIndex,
          y: averageRowIndex,
          value,
        }
      })

      this.options.series.push({
        name: averageRowName,
        data: averageData,
      })

      this.options = {
        ...this.options,
        ...{
          xAxis: {
            categories: xNames,
            position: 'top',
          },
          yAxis: {
            categories: yNames,
            title: null,
            reversed: true,
          },
        },
      }

      this.loading = false
    },
  },
}
</script>

<style scoped lang="scss"></style>
