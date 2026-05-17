<template>
  <div>
    <highcharts :options="chartOptions"></highcharts>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { mapState } from 'vuex/dist/vuex.common.js'
export default {
  name: 'SkillScoresBarChart',
  props: {
    skillScores: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      chartOptions: {
        chart: {
          type: 'column',
        },
        title: {
          text: null,
        },
        xAxis: {
          categories: [],
        },
        yAxis: {
          title: {
            text: 'Skill Score',
          },
          max: 100,
        },
        series: [
          {
            name: 'Scores',
            data: [],
            showInLegend: false,
          },
        ],
        credits: {
          enabled: false,
        },
      },
    }
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapState('translatedContent', ['languagesTranslations']),
  },
  watch: {
    skillScores: {
      immediate: true,
      handler(newScores) {
        this.updateChart(newScores)
      },
    },
    languageCode() {
      this.updateChartTitle()
    },
    languagesTranslations() {
      this.updateChartTitle()
    },
  },
  mounted() {
    this.updateChartTitle()
  },
  methods: {
    getColorForScore(score) {
      if (score <= 69) {
        return 'red' // Low Score
      } else if (score <= 85) {
        return 'orange' // Mediocre score
      } else {
        return 'green' // High score
      }
    },
    updateChartTitle() {
      this.chartOptions.yAxis.title.text = this.$t('SkillScoresLine.skill_score', this.languageCode)
      this.updateChart(this.skillScores)
    },
    updateChart(skillScores) {
      // Convert the object into an array and sort it alphabetically by skillName
      const sortedSkills = Object.values(skillScores).sort((a, b) => a.skillName.localeCompare(b.skillName))
      // Extract skill names and scores and add color based on the score
      let categories = sortedSkills.map((skill) => skill.skillName)
      const data = sortedSkills.map((skill) => ({
        y: parseFloat((skill?.skillScore || 0).toFixed(2)),
        color: this.getColorForScore(skill?.skillScore || 0),
      }))

      categories = categories.map((skillName) => {
        // Check if the translation exists for the skill name
        const translatedSkillNameExist = this.$te(
          `SkillScores.${skillName ? skillName.replace('/', '_') : skillName}`,
          this.languageCode
        )
        return translatedSkillNameExist
          ? this.$t(`SkillScores.${skillName ? skillName.replace('/', '_') : skillName}`, this.languageCode)
          : skillName
      })
      // Update chart options
      this.chartOptions.xAxis.categories = categories
      this.chartOptions.series[0].data = data
    },
  },
}
</script>

<style scoped>
/* Add styles if needed */
</style>
