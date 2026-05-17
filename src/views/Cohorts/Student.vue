<template>
  <div>
    <div v-if="cohortLoading || studentLoading">
      <v-progress-linear striped indeterminate color="buttonBlue" height="20" />
    </div>
    <v-container v-else>
      <v-row>
        <v-col>
          <router-link :to="`/cohorts/${cohort.id}`" class="navigation-link">
            &laquo; {{ $t('global.go_back_to', languageCode) }} {{ cohort.name }}
          </router-link>

          <StudentHeader :user="student.user" />

          <PageSection>
            <v-tabs v-model="tab">
              <v-tab key="scores">{{ isCTLab ? $t('global.ct_scores') : $t('global.mri_scores') }}</v-tab>
              <v-tab key="individual_settings_regions" v-if="isIndividualSettingsEnabled">{{
                $t('global.exam_list')
              }}</v-tab>
              <v-tab key="individual_settings_categories" v-if="isIndividualSettingsEnabled">{{
                $t('global.critical_thinking_questions')
              }}</v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
              <v-tab-item key="scores">
                <template v-if="!criticalThinkingAveragesLoading">
                  <p v-if="rawMriData[`user_${student.user.id}`].length === 0">
                    {{
                      isCTLab ? $t('CohortsStudent.no_cts', languageCode) : $t('CohortsStudent.no_mris', languageCode)
                    }}
                  </p>
                  <StudentMRIScoresTable
                    :mri-results="rawMriData[`user_${student.user.id}`]"
                    :router-prepend="`/cohorts/${cohort.id}/students/${student.id}/mri/`"
                    v-else
                  />
                </template>
                <p v-else>{{ $t('global.loading_ellipsis', languageCode) }}</p>
              </v-tab-item>

              <v-tab-item key="individual_settings_regions">
                <CohortExamList :cohort="cohort" :student="student" :is-admin-screen="false" />
              </v-tab-item>

              <v-tab-item key="individual_settings_categories">
                <CohortCriticalThinkingQuestionList :cohort="cohort" :student="student" :is-admin-screen="false" />
              </v-tab-item>
            </v-tabs-items>
          </PageSection>

          <!-- show only on first tab; the value of `tab` is actually a 0-based index in tab order -->
          <PageSection :title="$t('global.critical_thinking_scores', languageCode)" v-if="tab === 0">
            <template v-if="!criticalThinkingAveragesLoading">
              <p v-if="this.criticalThinkingAveragesOverall.length === 0">
                {{ $t('CohortsStudent.no_critical_thinking', languageCode) }}
              </p>
              <StudentCriticalThinkingScoresTable
                :overall="criticalThinkingAveragesOverall"
                :per-difficulty="criticalThinkingAveragesPerDifficulty"
                v-else
              />
            </template>
            <p v-else>{{ $t('global.loading_ellipsis', languageCode) }}</p>
          </PageSection>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { apiGet } from '../../util/api'
import StudentHeader from '@/components/Headers/StudentHeader'
import PageSection from '@/components/PageSection'
import StudentMRIScoresTable from '@/components/StudentMRIScoresTable'
import StudentCriticalThinkingScoresTable from '@/components/StudentCriticalThinkingScoresTable'
import CohortExamList from '@/components/CohortExamList'
import CohortCriticalThinkingQuestionList from '@/components/CohortCriticalThinkingQuestionList'
import _ from 'lodash'
import config from '../../config'

export default {
  name: 'CohortsStudent',
  components: {
    StudentHeader,
    PageSection,
    StudentMRIScoresTable,
    StudentCriticalThinkingScoresTable,
    CohortExamList,
    CohortCriticalThinkingQuestionList,
  },
  data() {
    return {
      student: null,
      studentLoading: true,
      tabKeys: ['scores', 'exam-list', 'critical-thinking'],
      mriResults: null,
      mriResultsLoading: true,
      criticalThinkingAveragesOverall: null,
      criticalThinkingAveragesPerDifficulty: null,
      criticalThinkingAveragesLoading: true,
      isCTLab: config.isCTLab,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('cohortService', ['cohort', 'cohortLoading']),
    ...mapGetters('cohortService', ['isIndividualSettingsEnabled']),
    ...mapGetters('user', ['languageCode']),
    ...mapState('statisticsService', ['rawMriData']),
    tab: {
      get() {
        const index = this.tabKeys.indexOf(this.$route.query.tab)
        return index === -1 ? 0 : index
      },
      set(value) {
        const tab = this.tabKeys[value] || this.tabKeys[0]
        if (this.$route.query.tab !== tab) {
          this.$router.replace({ query: { ...this.$route.query, tab } })
        }
      },
    },
  },
  async mounted() {
    await this.loadCohort(this.$route.params.cohortId)
    this.student = await this.getStudent()
    this.studentLoading = false
    await this.getRawMRIScores({ whom: `user_${this.student.user.id}` })
    this.mriResultsLoading = false
    this.criticalThinkingAveragesOverall = await this.getCriticalThinkingAverageOverall()
    this.criticalThinkingAveragesPerDifficulty = await this.getCriticalThinkingAveragePerDifficulty()
    this.criticalThinkingAveragesLoading = false
  },
  methods: {
    ...mapActions('cohortService', ['loadCohort']),
    ...mapActions('statisticsService', ['getRawMRIScores']),
    async getStudent() {
      let response = await apiGet(`/cohortStudents/${this.$route.params.studentId}`, this.accessToken)

      let { student } = response.data
      // If not overwriting student's settings, default them to what the Cohort has set
      // Only copy cohort settings if student has no persisted categories yet
      if (!student.settingsFromManager?.overwriteCriticalThinkingCategories) {
        if (!('criticalThinkingCategories' in (student.settingsFromManager || {}))) {
          Object.assign(
            student.settingsFromManager,
            _.cloneDeep(_.pick(this.cohort.settings, ['criticalThinkingCategories']))
          )
        }
      }

      // Only copy cohort body part settings if student has no persisted settings yet
      if (!student.settingsFromManager?.overwriteBodyPartSettings) {
        const hasPersistedBodyPartSettings =
          'sandboxedBodyParts' in (student.settingsFromManager || {}) ||
          'lockedBodyParts' in (student.settingsFromManager || {}) ||
          'lockedRegions' in (student.settingsFromManager || {})

        if (!hasPersistedBodyPartSettings) {
          Object.assign(
            student.settingsFromManager,
            _.cloneDeep(_.pick(this.cohort.settings, ['lockedBodyParts', 'lockedRegions', 'sandboxedBodyParts']))
          )
        }
      }

      console.log('settings', student.settingsFromManager)

      return student
    },
    async getCriticalThinkingAverageOverall() {
      let response = await apiGet(`/statistics/mc/user_${this.student.user.id}/average_overall`, this.accessToken)

      return response.data.data
    },
    async getCriticalThinkingAveragePerDifficulty() {
      let response = await apiGet(`/statistics/mc/user_${this.student.user.id}/average`, this.accessToken)

      return response.data.data
    },
  },
}
</script>

<style scoped lang="scss"></style>
