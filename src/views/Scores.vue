<template>
  <div class="score-selection">
    <v-container>
      <PageTitleCard
        :img-file="cardImg"
        :title="$t('Scores.my_scores', languageCode)"
        border-color="blue-border"
        :body="$t('Scores.my_scores_description', languageCode)"
      >
      </PageTitleCard>
      <div class="my-10 score-cards">
        <div class="row justify-content-center flex-wrap">
          <ScoreCard
            v-for="region in testableRegions"
            :key="region.name"
            :title="region.name"
            :img-file="regionImages[region.name]"
            :border-color="regionColors[region.name].borderColor"
            :img-bkgrd-color="regionColors[region.name].imgBkgrdColor"
            :number-of-tests-taken="region.numberOfTestsTaken"
            :number-of-total-tests="region.numberOfTotalTests"
          >
            <template #card-bottom>
              <br />
              <v-btn block tile dark class="mb-2 mt-2" :color="regionColors[region.name].buttonColor">
                {{ $t('Scores.review_scores', languageCode) }}
              </v-btn>
            </template>
          </ScoreCard>
        </div>
      </div>
    </v-container>
  </div>
</template>

<style lang="scss"></style>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import { apiGet } from '@/util/api'
import { get } from 'lodash'
import ScoreCard from '../components/ScoreCard'
import PageTitleCard from '../components/PageTitleCard'
import { REGION_IMAGES, REGION_COLORS } from '@/constants'

export default {
  name: 'Scores',
  data() {
    return {
      cardImg: require('../assets/svg/my-scores.svg'),
      regionImages: REGION_IMAGES,
      regionColors: REGION_COLORS,
      testableRegions: [],
    }
  },
  components: {
    PageTitleCard,
    ScoreCard,
  },
  mounted() {
    this.fetchTestableRegions()
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('translatedContent', ['translatedContent']),
    ...mapGetters('user', ['languageCode']),
  },
  methods: {
    ...mapActions('bodyService', ['getTestableRegions']),
    async fetchTestableRegions() {
      let [response, regions] = await Promise.all([
        apiGet('cohorts', this.accessToken, { mine: 'true' }),
        this.getTestableRegions(),
      ])

      const cohorts = get(response, ['data', 'cohorts'], [])

      if (!cohorts.length) {
        return (this.testableRegions = regions)
      }

      const { lockedRegions = [], lockedBodyParts = [] } = get(cohorts, ['0', 'settings'], {})

      const testableRegions = regions.reduce((newTestableRegions, { id, bodyParts = [], ...restOfRegion }) => {
        if (lockedRegions.includes(id)) {
          const testableRegion = { id, ...restOfRegion }
          testableRegion.bodyParts = bodyParts.filter((bodyPart) => !lockedBodyParts.includes(bodyPart.id))
          newTestableRegions.push(testableRegion)
        }

        return newTestableRegions
      }, [])

      this.testableRegions = testableRegions
    },
  },
}
</script>
