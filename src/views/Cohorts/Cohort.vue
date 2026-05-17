<template>
  <div>
    <div v-if="cohortLoading || !cohort">
      <v-progress-linear striped indeterminate color="buttonBlue" height="20" />
    </div>
    <v-container v-else>
      <v-row>
        <v-col>
          <CohortHeader :cohort="cohort" />
          <div>
            <router-link :to="`/cohorts`"> &laquo; {{ $t('global.back_to_cohorts', languageCode) }} </router-link>
          </div>
          <PageSection>
            <v-tabs v-model="tab">
              <!-- <v-tab :to="`/cohorts/${cohort.id}/students`">
                {{ $t('global.students', languageCode)}}
                ({{ cohort.studentsCount }})
              </v-tab> -->
              <v-tab key="students">
                {{ $t('global.students', languageCode) }}
                ({{ cohort.studentsCount }})
              </v-tab>
              <v-tab key="exams">
                {{ $t('global.exam_list', languageCode) }}
              </v-tab>
              <v-tab key="critical-thinking-questions">
                {{ $t('global.critical_thinking_questions', languageCode) }}
              </v-tab>
              <v-tab key="codes">
                {{ $t('global.available_registration_codes', languageCode) }}
                ({{ cohort.availableRegistrationCodesCount }})
              </v-tab>
              <v-tab
                key="cohort-score-settings"
                v-if="isManager && cohort && cohort.adminSettings.isAdvancedMetricsEnabled"
              >
                {{ $t('global.score_settings', languageCode) }}
              </v-tab>
              <v-tab key="cohort-analysis" v-if="isManager && cohort && cohort.adminSettings.isAnalysisEnabled">
                {{ $t('global.analysis', languageCode) }}
              </v-tab>
              <v-tab key="api-keys" v-if="isManager">
                {{ $t('ApiKeys.api_keys', languageCode) }}
              </v-tab>
            </v-tabs>

            <v-tabs-items v-model="tab">
              <v-tab-item key="students">
                <router-link :to="`/cohorts/${cohort.id}/students`"
                  >{{ $t('Cohort.goto_legacy_students', languageCode) }} &raquo;</router-link
                >
                <CohortStudentsTable :cohort="cohort" />
              </v-tab-item>
              <v-tab-item key="exams">
                <CohortExamList :cohort="cohort" :is-admin-screen="false" />
              </v-tab-item>
              <v-tab-item key="critical-thinking-questions">
                <CohortCriticalThinkingQuestionList :cohort="cohort" :is-admin-screen="false" />
              </v-tab-item>
              <v-tab-item key="codes">
                <RegistrationCodesTable :registration-codes="registrationCodes" />
              </v-tab-item>
              <v-tab-item
                key="cohort-score-settings"
                v-if="isManager && cohort && cohort.adminSettings.isAdvancedMetricsEnabled"
              >
                <CohortScoreSettings :cohort="cohort" />
              </v-tab-item>
              <v-tab-item key="cohort-analysis" v-if="isManager && cohort && cohort.adminSettings.isAnalysisEnabled">
                <GlickoAnalysis from="cohort-manager" :cohort="cohort" />
              </v-tab-item>
              <v-tab-item key="api-keys" v-if="isManager">
                <ApiKeyManager :cohort-id="cohort.id" />

                <v-divider class="my-6"></v-divider>

                <div>
                  <h3>{{ $t('ApiEndpoints.accessible_endpoints', languageCode) }}</h3>
                  <p class="text--secondary mb-4">
                    {{ $t('ApiEndpoints.accessible_endpoints_description', languageCode) }}
                  </p>

                  <v-data-table
                    v-if="cohortEndpoints.length > 0"
                    :headers="endpointHeaders"
                    :items="cohortEndpoints"
                    class="elevation-1"
                    :items-per-page="10"
                    :loading="endpointsLoading"
                  >
                    <template v-slot:item.pathPattern="{ item }">
                      <code>{{ item.pathPattern }}</code>
                    </template>
                    <template v-slot:item.method="{ item }">
                      <v-chip :color="getMethodColor(item.method)" small>
                        {{ item.method }}
                      </v-chip>
                    </template>
                    <template v-slot:item.isActive="{ item }">
                      <v-chip color="success" small> Active </v-chip>
                    </template>
                  </v-data-table>

                  <v-alert v-else-if="!endpointsLoading" type="info" class="mt-4">
                    {{ $t('ApiEndpoints.no_accessible_endpoints', languageCode) }}
                  </v-alert>
                </div>
              </v-tab-item>
            </v-tabs-items>
          </PageSection>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { apiGet } from '../../util/api'
import CohortHeader from '@/components/Headers/CohortHeader'
import CohortExamList from '@/components/CohortExamList'
import RegistrationCodesTable from '@/components/RegistrationCodesTable'
import CohortCriticalThinkingQuestionList from '@/components/CohortCriticalThinkingQuestionList'
import CohortStudentsTable from '@/components/CohortStudentsTable'
import CohortScoreSettings from '@/components/CohortScoreSettings'
import PageSection from '@/components/PageSection'
import GlickoAnalysis from '@/components/Analysis/GlickoAnalysis'
import ApiKeyManager from '@/components/ApiKeyManager'

const TAB_ARRAY = [
  'students',
  'exams',
  'critical-thinking-questions',
  'codes',
  'cohort-score-settings',
  'cohort-analysis',
  'api-keys',
]

export default {
  name: 'CohortsCohort',
  components: {
    CohortHeader,
    CohortExamList,
    RegistrationCodesTable,
    CohortCriticalThinkingQuestionList,
    CohortStudentsTable,
    CohortScoreSettings,
    PageSection,
    GlickoAnalysis,
    ApiKeyManager,
  },
  data() {
    return {
      registrationCodes: [],
      tabArray: TAB_ARRAY,
      cohortEndpoints: [],
      endpointsLoading: false,
      endpointHeaders: [
        {
          text: 'Endpoint Name',
          value: 'name',
          align: 'start',
          sortable: true,
        },
        {
          text: 'Path Pattern',
          value: 'pathPattern',
          align: 'start',
          sortable: true,
        },
        {
          text: 'Method',
          value: 'method',
          align: 'center',
          sortable: true,
        },
        {
          text: 'Status',
          value: 'isActive',
          align: 'center',
          sortable: true,
        },
      ],
    }
  },
  computed: {
    ...mapState('user', ['isAdmin', 'isManager']),
    ...mapState('authentication', ['accessToken']),
    ...mapState('cohortService', ['cohort', 'cohortLoading']),
    ...mapGetters('authentication', ['isLoggedIn']),
    ...mapGetters('user', ['languageCode']),
    tab: {
      get: function () {
        let index = this.tabArray.indexOf(this.$route.query.tab)
        if (index === -1) {
          // default to available codes
          index = 0
        }
        return index
      },
      set: function (newValue) {
        this.$router.replace({ query: { tab: this.tabArray[newValue] } })
      },
    },
  },
  beforeMount() {
    this.loadCohort(this.$route.params.cohortId)
  },
  mounted() {
    this.loadRegistrationCodes()
    this.loadCohortEndpoints()
  },
  methods: {
    ...mapActions('cohortService', ['loadCohort']),
    async loadRegistrationCodes() {
      this.registrationCodes = await this.getRegistrationCodes()
    },
    async getRegistrationCodes() {
      let response = await apiGet(`registrationCodes`, this.accessToken, {
        cohortId: this.$route.params.cohortId,
        unused: 'true',
      })

      if (response.data && response.data.success) {
        return response.data.registrationCodes
      } else {
        this.$notify({ type: 'error', text: 'Failed to Load Registration Codes' })
      }
    },
    async loadCohortEndpoints() {
      this.endpointsLoading = true
      try {
        const response = await apiGet(`cohorts/${this.$route.params.cohortId}/accessible-endpoints`, this.accessToken)
        if (response.data) {
          const allEndpoints = response.data.data || response.data || []
          // Only show endpoints that the cohort has permission to access
          this.cohortEndpoints = allEndpoints.filter(
            (endpoint) => endpoint.hasPermission && endpoint.isAllowed && endpoint.isActive
          )
        } else {
          this.$notify({ type: 'error', text: 'Failed to load accessible endpoints' })
        }
      } catch (error) {
        this.$notify({
          type: 'error',
          text: error.response?.data?.message || 'Failed to load accessible endpoints',
        })
      } finally {
        this.endpointsLoading = false
      }
    },
    getMethodColor(method) {
      const colors = {
        GET: 'success',
        POST: 'primary',
        PUT: 'warning',
        DELETE: 'error',
        PATCH: 'info',
      }
      return colors[method] || 'default'
    },
  },
}
</script>

<style scoped lang="scss"></style>
