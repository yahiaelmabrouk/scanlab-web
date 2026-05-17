<template>
  <div class="home">
    <div class="home-content-container">
      <v-dialog v-model="showExpirationReminderDialog" persistent width="50%">
        <v-card>
          <v-card-title class="headline">
            {{ $t('global.expiry_alert_title', languageCode) }}
          </v-card-title>

          <v-card-text>
            {{
              $t('global.expiry_alert_text', languageCode, {
                daysValue: daysUntilExpiration,
              })
            }}
          </v-card-text>

          <v-card-actions>
            <v-spacer class="w-100"></v-spacer>

            <v-btn color="success" @click="saveExpirationReminderState({ showExpirationReminder: false })">{{
              $t('global.okay', languageCode)
            }}</v-btn>
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <div class="home-card-container justify-content-center" v-if="isLoggedIn && cohortIsActive">
        <HomeCard
          border-color="green-border"
          v-if="shouldSeeTestByRegionOption"
          :img-file="testByRegion"
          :title="$t(isCTLab ? 'Home.test_by_exam' : 'Home.test_by_region', languageCode)"
        >
          <template #card-bottom>
            <v-btn class="card-button begin-btn" tile large depressed color="success" @click="selectRegion()">{{
              $t('Home.select_region_short', languageCode)
            }}</v-btn>
          </template>
        </HomeCard>
        <HomeCard
          border-color="blue-border"
          :img-file="randomTest"
          v-if="shouldSeeRandomExamOption"
          :title="$t('Home.random_test', languageCode)"
        >
          <template #card-bottom>
            <v-btn
              class="card-button begin-btn"
              tile
              large
              depressed
              color="buttonBlue"
              :disabled="isLoadingStartTest || isStartingRandomTest"
              @click="startRandomTest()"
              >{{ $t('Home.begin', languageCode) }}</v-btn
            >
          </template>
        </HomeCard>
        <HomeCard
          v-if="isEnableEPLabs"
          border-color="green-border"
          :img-file="iconEPLab"
          :title="$t('global.eplab', languageCode)"
        >
          <template #card-bottom>
            <v-btn class="card-button begin-btn" tile large depressed dark color="buttonBlue" @click="viewEPLab()">
              {{ $t('Home.begin', languageCode) }}
            </v-btn>
          </template>
        </HomeCard>
        <HomeCard
          v-if="shouldSeePreparedExamsForSkills"
          border-color="blue-border"
          :img-file="skillAssessment"
          :title="$t('Home.skill_assessment', languageCode)"
        >
          <template #card-bottom>
            <v-btn
              class="card-button begin-btn"
              tile
              large
              depressed
              color="buttonBlue"
              @click="selectPreparedExams('skill')"
            >
              {{ $t('Home.begin', languageCode) }}
            </v-btn>
          </template>
        </HomeCard>
        <HomeCard
          v-if="shouldSeeDicomPlayground"
          border-color="green-border"
          :img-file="dicomPlayground"
          :title="$t('Home.view_dicom', languageCode)"
        >
          <template #card-bottom>
            <div class="card-line"></div>
            <v-overflow-btn
              class="mx-4"
              item-value="id"
              :items="sortedDicomSets"
              v-model="selectedDicomSetId"
              item-text="bodyPartNameDeduped"
              :label="$t('Home.select_dicom', languageCode)"
            >
              <template #item="{ item }">
                <TranslatedContent
                  type="bodyPart"
                  :record="item.bodyPart"
                  :lookup="{ type: 'nestedKey', path: 'name' }"
                >
                  <template #default="{ translation }">
                    {{ formatDicomLabel(item, translation) }}
                  </template>
                </TranslatedContent>
              </template>
            </v-overflow-btn>
            <v-btn
              class="card-button begin-btn"
              tile
              large
              depressed
              :disabled="!selectedDicomSetId"
              color="success"
              @click="viewDicom(selectedDicomSetId)"
            >
              {{ $t('global.view', languageCode) }}
            </v-btn>
          </template>
        </HomeCard>
        <HomeCard
          v-if="shouldSeeUltraLabPlayground"
          border-color="blue-border"
          :img-file="ultraLabImg"
          :title="$t('Home.ultra_lab', languageCode)"
        >
          <template #card-bottom>
            <div class="card-line"></div>
            <v-overflow-btn
              class="mx-4"
              item-value="id"
              :items="sortedUltraSets"
              v-model="selectedUltraId"
              item-text="bodyPartNameDeduped"
              :label="$t('Home.select_dicom', languageCode)"
            >
              <template #item="{ item }">
                <TranslatedContent
                  type="bodyPart"
                  :record="item.bodyPart"
                  :lookup="{ type: 'nestedKey', path: 'name' }"
                >
                  <template #default="{ translation }">
                    {{ stripTrailingParenthetical(translation) }}
                  </template>
                </TranslatedContent>
              </template>
            </v-overflow-btn>
            <v-btn
              class="card-button begin-btn"
              tile
              large
              depressed
              :disabled="!selectedUltraId"
              color="success"
              @click="viewDicom(selectedUltraId, true)"
            >
              {{ $t('global.view', languageCode) }}
            </v-btn>
          </template>
        </HomeCard>
        <HomeCard
          v-if="shouldSeePreparedExamsForHiring"
          border-color="blue-border"
          :img-file="skillAssessment"
          :title="$t('Home.hiring_assessment', languageCode)"
        >
          <template #card-bottom>
            <v-btn
              class="card-button begin-btn"
              tile
              large
              depressed
              color="buttonBlue"
              @click="selectPreparedExams('hiring')"
            >
              {{ $t('Home.begin', languageCode) }}
            </v-btn>
          </template>
        </HomeCard>
      </div>
      <div v-else>
        <div class="coming-soon">
          <img src="../assets/svg/scanlab-logo.svg" alt="ScanLab MR" />
        </div>
      </div>
    </div>
    <WebGLSupportCheckModal></WebGLSupportCheckModal>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import _ from 'lodash'
import { get } from 'lodash'
import { apiGet } from '../util/api'

import HomeCard from '../components/HomeCard'
import TestByRegion from '@/assets/svg/test-by-region.svg'
import TestByRegionCT from '@/assets/svg/CT_icons-06.png'
import SkillAssessment from '@/assets/svg/skill-assessment.svg'
import RandomTestMR from '@/assets/svg/icon_randomTest.svg'
import RandomTestCT from '@/assets/svg/icon_randomTest_CT.svg'
import DicomPlaygroundMR from '@/assets/svg/icon_DICOM.svg'
import DicomPlaygroundCT from '@/assets/svg/icon_DICOM_CT.svg'
import IconEPLabMR from '@/assets/svg/icon-eplab-mr.svg'
import IconEPLabCT from '@/assets/svg/icon-eplab-ct.svg'
import UltraLabImg from '@/assets/svg/ultra-lab.svg'
import TranslatedContent from '@/components/TranslatedContent'
import WebGLSupportCheckModal from '../components/WebGLSupportCheckModal.vue'
import config from '../config'

export default {
  name: 'Home',
  components: {
    HomeCard,
    WebGLSupportCheckModal,
    TranslatedContent,
  },
  data() {
    return {
      isCTLab: config.isCTLab,
      testByRegion: config.isCTLab ? TestByRegionCT : TestByRegion,
      randomTest: config.isCTLab ? RandomTestCT : RandomTestMR,
      skillAssessment: SkillAssessment,
      dicomPlayground: config.isCTLab ? DicomPlaygroundCT : DicomPlaygroundMR,
      iconEPLab: config.isCTLab ? IconEPLabCT : IconEPLabMR,
      ultraLabImg: UltraLabImg,
      mode: null,
      optionsMode: [
        { value: null, text: '' },
        { value: 'random', text: 'Random' },
        { value: 'region', text: 'Region' },
        { value: 'test', text: 'Test' },
      ],
      region: null,
      optionsRegion: [
        { value: null, text: '' },
        { value: 'head', text: 'Head' },
        { value: 'spine', text: 'Spine' },
        { value: 'abdomen', text: 'Abdomen' },
        { value: 'extremities', text: 'Extremities' },
      ],
      exam: null, // sub-region of Head
      optionsExam: [
        { value: null, text: '' },
        { value: 'brain', text: 'Brain' },
        { value: 'pituitary', text: 'Pituitary' },
        { value: 'iac', text: 'IAC' },
        { value: 'orbits', text: 'Orbits' },
      ],
      sandboxedBodyParts: [],
      dicomFileSets: [],
      selectedDicomSetId: null,
      selectedUltraId: null,
      preparedExams: [],
      isStartingRandomTest: false,
    }
  },
  computed: {
    ...mapState('user', ['isAdmin', 'showExpirationReminder']),
    ...mapState('authentication', ['accessToken']),
    ...mapState('cohortService', ['myCohort']),
    ...mapGetters('cohortService', ['isEnableEPLabs']),
    ...mapState('dicomService', ['hasLoadedPreviously']),
    ...mapGetters('user', ['languageCode', 'daysUntilExpiration']),
    ...mapGetters('authentication', ['isLoggedIn']),
    ...mapState('testRunService', ['isLoadingStartTest']),
    sortedDicomSets() {
      const ultraSets = this.renameUltraSets(this.ultraLabSets, ' (UltraLab)')
      const combinedSet = [...ultraSets, ...this.dicomFileSets].map((set) => {
        return {
          ...set,
          bodyPart: {
            id: set.bodyPartId,
            name: set.bodyPartName,
          },
        }
      })
      return _.sortBy(combinedSet, 'bodyPartNameDeduped')
    },
    shouldSeeDicomPlayground() {
      const hasDicoms = this.sortedDicomSets.length > 0
      const isEnabledByAdmin = _.get(this.myCohort, 'adminSettings.isPlaygroundEnabled')
      return hasDicoms && (this.isAdmin || isEnabledByAdmin)
    },
    ultraLabSets() {
      return this.dicomFileSets.filter((ultra) => ultra.isUltraLab)
    },
    sortedUltraSets() {
      let ultraSets = this.renameUltraSets(this.ultraLabSets)
      ultraSets = ultraSets.map((set) => {
        return {
          ...set,
          bodyPart: {
            id: set.bodyPartId,
            name: set.bodyPartName,
          },
        }
      })
      return _.sortBy(ultraSets, 'bodyPartNameDeduped')
    },
    shouldSeeUltraLabPlayground() {
      const hasDicoms = this.sortedUltraSets.length > 0
      const isEnabledByAdmin = _.get(this.myCohort, 'adminSettings.isUltraLabEnabled')
      return hasDicoms && (this.isAdmin || isEnabledByAdmin)
    },
    shouldSeePreparedExamsForSkills() {
      return this.preparedExams.filter((exam) => exam.isSkill).length > 0
    },
    shouldSeePreparedExamsForHiring() {
      return this.preparedExams.filter((exam) => exam.isHiring).length > 0
    },
    shouldSeeRandomExamOption: function () {
      // Some users don't have a Cohort, and for them, everything should be enabled
      if (!this.myCohort) {
        return true
      }
      return _.get(this.myCohort, 'adminSettings.isRandomModeEnabled')
    },
    shouldSeeTestByRegionOption: function () {
      // Some users don't have a Cohort, and for them, everything should be enabled
      if (!this.myCohort) {
        return true
      }
      return _.get(this.myCohort, 'adminSettings.isTestByRegionEnabled')
    },
    cohortIsActive: function () {
      if (!this.myCohort) {
        return true
      }
      return _.get(this.myCohort, 'adminSettings.isActive')
    },
    showExpirationReminderDialog() {
      return this.daysUntilExpiration <= 30 && this.showExpirationReminder
    },
  },
  async mounted() {
    if (this.hasLoadedPreviously) {
      location.reload()
      return
    }

    await this.loadUserCohorts()
    await this.getCohortsPreparedExams()
    let response = await apiGet(`dicomFileSets?userViewOnlyAllowed=true`, this.accessToken)
    let dicomFileSets = response.data

    // these are shown by the Region Name that they are from. If we have multiple of each, we want to append 1, 2, etc
    let dicomFileSetsByRegionName = _.groupBy(response.data, 'bodyPartName')
    _.each(dicomFileSetsByRegionName, function (curDicomFileSets) {
      _.each(curDicomFileSets, function (curDicomFileSet, i) {
        let name = curDicomFileSet.bodyPartName || ''
        if (curDicomFileSets.length === 1) {
          curDicomFileSet.bodyPartNameDeduped = name
        } else {
          curDicomFileSet.bodyPartNameDeduped = name + ' ' + (i + 1)
        }
      })
    })
    this.dicomFileSets = dicomFileSets
  },
  methods: {
    ...mapActions('user', ['saveExpirationReminderState']),
    ...mapActions('bodyService', ['getTestableRegions']),
    ...mapActions('testRunService', ['startTest']),
    ...mapActions('cohortService', ['loadUserCohorts']),
    stripTrailingParenthetical(text) {
      if (!text) return text
      return text.replace(/\s*\([^)]*\)\s*$/, '')
    },
    formatDicomLabel(item, translation) {
      const baseName = this.stripTrailingParenthetical(translation)
      const suffixMatch = item.bodyPartName ? item.bodyPartName.match(/(\s*\([^)]*\))\s*$/) : null
      return suffixMatch ? baseName + suffixMatch[1] : baseName
    },
    renameUltraSets(sets, appendText = '') {
      return sets.map((ultra) => {
        let newBodyPartName = ultra.bodyPartName.replace(/\s*\([^)]*\)\s*$/, '') + appendText
        let newBodyPartNameDuped = ultra.bodyPartNameDeduped.replace(/\s*\([^)]*\)\s*$/, '') + appendText
        return {
          ...ultra,
          bodyPartName: newBodyPartName,
          bodyPartNameDeduped: newBodyPartNameDuped,
          id: `ultra_${ultra.id}`,
        }
      })
    },
    viewEPLab() {
      this.$router.push({
        path: 'preview-patient-physio',
      })
    },
    async getCohortsPreparedExams() {
      if (this.myCohort) {
        let response = await apiGet(`prepared-exams/${this.myCohort.id}`, this.accessToken)
        if (response.status === 200) {
          this.preparedExams = response.data.exams
        }
      }
    },
    selectRegion() {
      this.$router.push({
        name: 'region-selection',
        params: {},
      })
    },
    selectPreparedExams(type) {
      this.$router.push({
        name: 'preparedExamSelection',
        params: { type },
      })
    },
    viewDicom(selectedDicomSetId, ignoreVendorUI = false) {
      let isUltraLab = false
      let actualId = selectedDicomSetId

      if (typeof selectedDicomSetId === 'string' && selectedDicomSetId.startsWith('ultra_')) {
        isUltraLab = true
        actualId = selectedDicomSetId.slice(6)
      }

      this.$router.push({
        name: 'mri',
        query: { dicom: actualId, isUltraLab, ignoreVendorUI },
      })
    },
    async startRandomTest() {
      if (this.isStartingRandomTest) return
      this.isStartingRandomTest = true
      try {
        const testableRegions = await this.fetchTestableRegions()

        const allBodyParts = testableRegions
          .map((r) => r.bodyParts)
          .flat()
          .filter((b) => !this.sandboxedBodyParts.includes(b.id))

        if (allBodyParts.length === 0) {
          this.$notify({
            type: 'warn',
            text: this.$t('Home.no_testable_body_parts', this.languageCode),
          })
          return
        }

        const selectedBodyPart = _.sample(allBodyParts)

        const startedTest = await this.startTest({ bodyPartId: selectedBodyPart.id })
        if (!startedTest) return

        this.$router.push({
          path: 'mri',
          query: {
            test: startedTest.id,
          },
        })
      } catch (error) {
        console.error('There was an error starting a random test: ', error)
      } finally {
        this.isStartingRandomTest = false
      }
    },
    // TODO: This is the third copy of this function. This should be move into the store.
    async fetchTestableRegions() {
      let [response, regions] = await Promise.all([
        apiGet('cohorts', this.accessToken, { mine: 'true' }),
        this.getTestableRegions(),
      ])

      const cohorts = get(response, ['data', 'cohorts'], [])

      if (!cohorts.length) {
        return (this.testableRegions = regions)
      }

      let cohort = _.first(cohorts)

      // Overwrite Cohort settings with Individual Settings
      let settings = get(cohort, ['settings'], {})
      if (
        _.get(cohort, 'adminSettings.isIndividualSettingsEnabled') &&
        _.get(cohort, 'userSettingsFromManager.overwriteBodyPartSettings')
      ) {
        settings = cohort.userSettingsFromManager
      }

      const { lockedRegions = [], lockedBodyParts = [], sandboxedBodyParts = [] } = settings

      const { lockedRegions: adminLockedRegions = [], lockedBodyParts: adminLockedBodyParts = [] } = get(
        cohorts,
        ['0', 'adminSettings'],
        {}
      )

      this.sandboxedBodyParts = sandboxedBodyParts

      return regions.reduce((newTestableRegions, { id, bodyParts = [], ...restOfRegion }) => {
        const regionUnlocked = (!adminLockedRegions.includes(id) && !lockedRegions.includes(id)) || this.isCTLab
        if (regionUnlocked) {
          const testableRegion = { id, ...restOfRegion }
          testableRegion.bodyParts = bodyParts.filter((bodyPart) => {
            const bodyPartUnlocked =
              !adminLockedBodyParts.includes(bodyPart.id) && !lockedBodyParts.includes(bodyPart.id)
            return bodyPartUnlocked
          })
          newTestableRegions.push(testableRegion)
        }

        return newTestableRegions
      }, [])
    },
  },
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap');
$border: 3px;

article {
  flex-grow: 1;
  margin: $spacing-jumbo $spacing-small;
  position: relative;

  &.cc-blue {
    @include gradient-border($border, $half-blue);
  }

  &.cc-green {
    @include gradient-border($border, $half-green);
  }
}

.headline {
  text-align: left;
}

.card-body {
  h4,
  p {
    text-align: left;
  }
  [class$='-line'] {
    margin-bottom: 15px;
    &[class^='blue'] {
      border-bottom: 1px solid $blue;
    }
    &[class^='green'] {
      border-bottom: 1px solid $ocean;
    }
  }
}

.coming-soon {
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin-top: 20%;
}

.card-button {
  margin-top: 1.5rem;
}

.begin-btn {
  .v-btn__content {
    padding: 0 3rem;
  }
  color: #ffffff !important;
  width: 100%;
}
.theme--light.v-card .v-card__subtitle,
.theme--light.v-card > .v-card__text {
  color: $black !important;
}

.home-card-container {
  // display: grid;
  // grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  display: flex;
  flex-wrap: wrap;
  column-gap: 1rem;
  margin: 0 auto;
}

.home-content-container {
  margin: 0px 5rem;
}
</style>
