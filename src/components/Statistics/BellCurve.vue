<template>
  <div>
    <highcharts v-if="!loading" class="hc" :options="options" ref="chart"></highcharts>
    <v-progress-circular v-else indeterminate size="60"></v-progress-circular>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import _ from 'lodash'

export default {
  name: 'BellCurve',
  components: {},
  props: {
    height: {
      type: String,
      default: '500',
    },
    whom: {
      type: String,
      default: 'everyone',
    },
    title: {
      type: String,
      default: '',
    },
    filter: {
      type: Function,
      default: () => true,
    },
  },
  data() {
    return {
      loading: true,
      rawData: null,
      options: {
        credits: {
          enabled: false,
        },
        noData: {
          text: 'No MRI Scores Available',
          style: {
            color: '#000000',
          },
        },

        title: {
          text: this.$t('BellCurve.score_distribution'),
        },

        allowPointSelect: false,
        enableMouseTracking: false,
        label: {
          enabled: false,
        },
        marker: {
          enabled: false,
        },
        tooltip: { enabled: false },

        legend: {
          enabled: false,
        },

        xAxis: [
          {
            title: {
              text: 'Data',
            },
            visible: false,
          },
          {
            title: {
              text: this.$t('BellCurve.scanlab_score'),
            },
            labels: {
              formatter: function () {
                return this.value + '%'
              },
            },
            // min: 0,
            // max: 100,
            visible: true,
          },
        ],

        yAxis: [
          {
            title: {
              text: 'Data',
            },
            visible: false,
          },
          {
            title: {
              text: 'Bell curve',
            },
            visible: false,
          },
        ],
      },
    }
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapState('translatedContent', ['languagesTranslations']),
    noData() {
      return _.isEmpty(this.rawData)
    },
  },
  async mounted() {
    await this.fetchData()
    this.updateChartTitle()
  },
  watch: {
    filter() {
      this.updateGraph()
    },
    languageCode() {
      this.updateChartTitle()
    },
    languagesTranslations() {
      this.updateChartTitle()
    },
  },
  methods: {
    ...mapActions('statisticsService', ['getScanlabScoresOnly', 'getMyAverageScanlabScore']),
    updateChartTitle() {
      this.options.title.text = this.$t('BellCurve.score_distribution', this.languageCode)
      this.options.xAxis[1].title.text = this.$t('BellCurve.scanlab_score', this.languageCode)
    },
    async fetchData() {
      this.rawData = await this.getScanlabScoresOnly({ whom: this.$props.whom })
      this.myRawData = await this.getMyAverageScanlabScore()
      this.updateGraph()
    },

    updateGraph() {
      if (!this.noData) {
        this.loading = true
        const myAverage = _.mean(this.myRawData.data)
        const globalAverage = _.mean(this.rawData.data)

        let series = [
          {
            name: 'Bell curve',
            type: 'bellcurve',
            xAxis: 1,
            yAxis: 1,
            pointsInInterval: 5,
            intervals: 4,
            baseSeries: 1,
            zIndex: -1,
            states: {
              hover: {
                enabled: false,
              },
            },
          },
          {
            type: 'scatter',
            data: this.rawData.data,
            visible: false,
          },
        ]
        this.options = {
          ...this.options,
          series,
        }

        this.options.xAxis[1].plotLines = [
          {
            color: 'blue',
            width: 1,
            value: globalAverage,
            zIndex: 5,
            label: {
              text: `${_.round(globalAverage)}%`,
              rotation: 0,
            },
          },
        ]

        if (!this.$props.whom.startsWith('cohort')) {
          this.options.xAxis[1].plotLines.push({
            color: '#FF0000',
            width: 1,
            value: myAverage,
            zIndex: 5,
            label: {
              text: `${_.round(myAverage)}%`,
              rotation: 0,
            },
          })
        }
      }

      this.loading = false
    },
  },
}
</script>

<style scoped lang="scss"></style>
