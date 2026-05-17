<template>
  <div class="region-selection">
    <v-container>
      <PageTitleCard
        :img-file="cardImg"
        :title="$t(isCTLab ? 'RegionSelection.select_exam' : 'RegionSelection.select_region', languageCode)"
        border-color="blue-border"
        :body="$t('RegionSelection.select_region_description', languageCode)"
      >
      </PageTitleCard>
      <div class="my-10">
        <div class="row justify-content-center d-flex flex-wrap" v-if="!isCTLab">
          <RegionCard v-for="region in testableRegions" :key="region.name" :region="region"></RegionCard>
        </div>
        <div class="row justify-content-center d-flex flex-wrap" v-else>
          <BodyPartCard v-for="bodyPart in testableBodyParts" :key="bodyPart.id" :body-part="bodyPart"></BodyPartCard>
        </div>
      </div>
    </v-container>
  </div>
</template>

<script>
import _, { get } from 'lodash'
import { mapActions, mapGetters, mapState } from 'vuex'
import { apiGet } from '@/util/api'
import RegionCard from '../components/RegionCard'
import BodyPartCard from '../components/BodyPartCard'
import PageTitleCard from '../components/PageTitleCard'
import TestByRegion from '../assets/svg/test-by-region.svg'
import TestByRegionCT from '@/assets/svg/CT_icons-06.png'
import config from '../config'

export default {
  name: 'RegionSelection',
  components: { PageTitleCard, RegionCard, BodyPartCard },
  data() {
    return {
      isCTLab: config.isCTLab,
      testableRegions: [],
      testableBodyParts: [],
      cardImg: config.isCTLab ? TestByRegionCT : TestByRegion,
    }
  },
  mounted() {
    if (this.hasLoadedPreviously) {
      location.reload()
      return
    }
    if (!this.isCTLab) {
      this.fetchTestableRegions()
    } else {
      this.fetchTestableBodyParts()
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('translatedContent', ['translatedContent']),
    ...mapState('dicomService', ['hasLoadedPreviously']),
    ...mapGetters('user', ['languageCode']),
  },
  methods: {
    ...mapActions('bodyService', ['getTestableRegions', 'getTestableBodyParts']),
    ...mapActions('translatedContent', ['translateThisRecord']),
    async fetchTestableBodyParts() {
      try {
        let response = await apiGet('cohorts', this.accessToken, { mine: 'true' })
        let bodyParts = await this.getTestableBodyParts()

        let foundBodyParts = []

        if (response.data.cohorts.length === 0) {
          foundBodyParts = bodyParts
        } else {
          let cohort = response.data.cohorts[0]
          let settings = cohort.settings

          // Overwrite Cohort settings with Individual Settings
          if (
            _.get(cohort, 'adminSettings.isIndividualSettingsEnabled') &&
            _.get(cohort, 'userSettingsFromManager.overwriteBodyPartSettings')
          ) {
            settings = cohort.userSettingsFromManager
          }

          let lockedBodyParts = settings.lockedBodyParts || []
          let adminLockedBodyParts = cohort.adminSettings.lockedBodyParts || []

          // In CT, don't check lockedRegion
          let filteredBodyParts = bodyParts.filter((bodyPart) => {
            return !lockedBodyParts.includes(bodyPart.id) && !adminLockedBodyParts.includes(bodyPart.id)
          })
          foundBodyParts = filteredBodyParts
        }

        this.testableBodyParts = _.sortBy(foundBodyParts, 'name')
        this.testableBodyParts = this.listBodyPartsToTree(this.testableBodyParts)
        this.testableBodyParts = _.sortBy(this.testableBodyParts, 'name')
      } catch (error) {
        console.error(
          'Promise rejection occurred in fetchTestableBodyParts function in RegionSelection Component:',
          error
        )
      }
    },
    listBodyPartsToTree(list) {
      const bases = []

      for (let i = 0; i < list.length; i++) {
        if (!list[i].baseId && !_.find(bases, (el) => el.id == list[i].id)) {
          bases.push(list[i])
        } else if (list[i].base && !_.find(bases, (el) => el.id == list[i].base.id)) {
          bases.push({ ...list[i], ...list[i].base })
        }
      }

      for (let i = 0; i < bases.length; i++) {
        bases[i].children = list
          .filter((el) => el.id == bases[i].id || el.baseId == bases[i].id)
          .map((el) => {
            return { contrastTypes: el.contrastTypes, id: el.id }
          })
      }

      return bases
    },
    async fetchTestableRegions() {
      try {
        let response = await apiGet('cohorts', this.accessToken, { mine: 'true' })
        let regions = await this.getTestableRegions()

        let foundRegions

        if (response.data.cohorts.length === 0) {
          foundRegions = regions
        } else {
          let cohort = response.data.cohorts[0]
          let settings = cohort.settings

          // Overwrite Cohort settings with Individual Settings
          if (
            _.get(cohort, 'adminSettings.isIndividualSettingsEnabled') &&
            _.get(cohort, 'userSettingsFromManager.overwriteBodyPartSettings')
          ) {
            settings = cohort.userSettingsFromManager
          }

          let lockedRegions = settings.lockedRegions || []
          let lockedBodyParts = settings.lockedBodyParts || []

          let adminLockedRegions = cohort.adminSettings.lockedRegions || []
          let adminLockedBodyParts = cohort.adminSettings.lockedBodyParts || []

          let filteredRegions = regions.filter((region) => !lockedRegions.includes(region.id))
          filteredRegions = filteredRegions.filter((region) => !adminLockedRegions.includes(region.id))
          filteredRegions.forEach((region) => {
            const filteredBodyParts = region.bodyParts.filter((bodyPart) => !lockedBodyParts.includes(bodyPart.id))
            const adminFilteredBodyParts = filteredBodyParts.filter(
              (bodyPart) => !adminLockedBodyParts.includes(bodyPart.id)
            )
            region.bodyParts = adminFilteredBodyParts
          })
          foundRegions = filteredRegions
        }

        this.testableRegions = _.sortBy(foundRegions, 'anatomicalOrder')
      } catch (error) {
        console.error(
          'Promise rejection occurred in fetchTestableRegions function in RegionSelection Component:',
          error
        )
      }
    },
  },
}
</script>

<style lang="scss">
.header-gradient-region {
  background-image: $gradient-blue;
  border: 0;
}

.card-header {
  max-width: 80vw;
  margin: 10vh auto;
}

.custom-card {
  .profile {
    // default
    background-color: $tangerine;
  }

  &:nth-of-type(2n + 2) {
    // every 2nd starting with the second
    .profile {
      background-color: $tangerine;
    }
  }

  &:nth-of-type(3n) {
    .profile {
      background-color: $pink;
    }
  }

  &:nth-of-type(3n + 1) {
    // every 3rd starting with the first
    .profile {
      background-color: $blue;
    }
  }
}

.custom-card,
.arrange-cards {
  .gradient-line {
    // default
    background-image: $gradient-yellow;
    border: 0;
  }

  &:nth-of-type(2n + 2) {
    // every 2nd starting with the second
    .gradient-line {
      background-image: $gradient-yellow;
      border: 0;
    }
  }

  &:nth-of-type(3n) {
    .gradient-line {
      background-image: $gradient-pink;
      border: 0;
    }
  }

  &:nth-of-type(3n + 1) {
    // every 3rd starting with the first
    .gradient-line {
      background-image: $gradient-pink;
      border: 0;
    }
  }
}

.v-label {
  margin: 0;
}
</style>
