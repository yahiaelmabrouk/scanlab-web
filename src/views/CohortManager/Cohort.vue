<template>
  <div>
    <div v-if="cohortLoading || !cohort">
      <v-progress-linear striped indeterminate color="buttonBlue" height="20" />
    </div>
    <v-container v-else>
      <v-row>
        <v-col>
          <CohortHeader :cohort="cohort" />
          <v-tabs :value="1">
            <v-tab :to="`/cohort-manager/${cohort.id}/students`">
              {{ $t('global.students', languageCode) }}
              ({{ cohort.studentsCount }})
            </v-tab>
            <v-tab>
              {{ $t('global.regions', languageCode) }}
            </v-tab>
            <v-tab>
              {{ $t('global.question_categories', languageCode) }}
            </v-tab>
            <v-tab>
              {{ $t('global.available_registration_codes', languageCode) }}
              ({{ cohort.availableRegistrationCodesCount }})
            </v-tab>
            <v-tab>
              {{ $t('global.managers', languageCode) }}
            </v-tab>
            <v-tab>
              {{ $t('global.prepared_exams', languageCode) }}
            </v-tab>
            <v-tab>
              {{ $t('global.settings', languageCode) }}
            </v-tab>
            <v-tab>
              {{ $t('ApiKeys.api_management', languageCode) }}
            </v-tab>
            <v-tab-item> </v-tab-item>
            <v-tab-item class="p-3">
              <CohortExamList :cohort="cohort" @update-settings="update" :is-admin-screen="true" />
            </v-tab-item>
            <v-tab-item class="p-3">
              <v-form @submit.prevent="saveCriticalThinkingQuestionSettings()" class="form">
                <v-container>
                  <v-col>
                    <v-row>
                      <v-col sm="12" md="6" cols="12">
                        <v-text-field
                          min="1"
                          step="1"
                          type="number"
                          v-model="amountOfCriticalThinkingQuestionsPerTestRun"
                          :label="$t('CohortManager.num_of_questions', languageCode)"
                        />
                      </v-col>
                      <v-btn type="submit" color="success" class="btn-block">
                        {{ $t('global.save', languageCode) }}
                      </v-btn>
                    </v-row>
                  </v-col>
                </v-container>
              </v-form>
              <CohortCriticalThinkingQuestionList :cohort="cohort || {}" :is-admin-screen="true" />
            </v-tab-item>
            <v-tab-item class="p-3">
              <v-col>
                <v-row>
                  <v-col>
                    <v-form @submit.prevent="createCodes()" class="form">
                      <v-text-field
                        min="1"
                        step="1"
                        class="mr-6"
                        type="number"
                        v-model="numCodesToCreate"
                        :label="$t('CohortManager.num_of_codes', languageCode)"
                      />
                      <v-btn type="submit" color="success" class="align-self-center">
                        {{ $t('global.create', languageCode) }}
                      </v-btn>
                    </v-form>
                  </v-col>
                  <v-col>
                    <v-form @submit.prevent="changeCohortExpirationDate()" class="form">
                      <v-text-field
                        min="1"
                        step="1"
                        class="mr-6"
                        type="number"
                        v-model="expirationDateLength"
                        :label="$t('CohortManager.active_days_length', languageCode)"
                      />
                      <v-btn type="submit" color="success" class="align-self-center">{{
                        $t('global.save', languageCode)
                      }}</v-btn>
                    </v-form>
                  </v-col>
                </v-row>
              </v-col>
              <RegistrationCodesTable :registration-codes="registrationCodes" />
            </v-tab-item>
            <v-tab-item class="p-3">
              <!-- Hack to prevent UX nightmare: https://github.com/imagingu/scanlab-web/pull/77#issuecomment-630821740   -->
              <template v-if="cohort.name !== 'Managers'">
                <h3>{{ $t('global.managers', languageCode) }}</h3>
                <v-form @submit.prevent="addManager()">
                  <h4>{{ $t('CohortManager.add_manager', languageCode) }}</h4>

                  <v-text-field v-model="potentialManagerEmail" type="text" :label="$t('global.email', languageCode)" />
                  <v-btn type="submit" color="success"> {{ $t('global.add', languageCode) }} </v-btn>
                </v-form>
                <div>
                  <v-row v-for="manager in cohortManagers" :key="manager.id" align="center" justify="center">
                    <v-col cols="5" class="font-weight-bold">{{ manager.user.legalName }}</v-col>
                    <v-col cols="5" class="text--primary">{{ manager.user.email }}</v-col>
                    <v-col cols="2">
                      <div>
                        <v-btn @click="deleteManager(manager)" icon><v-icon color="error">delete</v-icon></v-btn>
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </template>
              <p v-else class="py-5">
                {{ $t('CohortManager.special_managers_get_out', languageCode) }}
              </p>
            </v-tab-item>
            <v-tab-item class="p-3">
              <v-data-table
                dense
                show-select
                class="elevation-1"
                :items-per-page="10"
                :headers="examHeaders"
                v-model="selectedExams"
                :items="preparedExams"
              ></v-data-table>
              <v-btn type="submit" color="success" class="mt-5 align-self-center" @click="savePreparedExams()">{{
                $t('global.save', languageCode)
              }}</v-btn>
            </v-tab-item>
            <v-tab-item class="p-3">
              <v-row>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="Challenge"
                      v-model="isChallengeModeEnabled"
                      :input-value="cohort.adminSettings.isChallengeModeEnabled"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="Sandbox"
                      v-model="isSandboxEnabled"
                      :input-value="cohort.adminSettings.isSandboxEnabled"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      label="Active"
                      hide-details
                      v-model="isActive"
                      :input-value="cohort.adminSettings.isActive"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="Playground"
                      v-model="isPlaygroundEnabled"
                      :input-value="cohort.adminSettings.isPlaygroundEnabled"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="Random Exam"
                      v-model="isRandomModeEnabled"
                      :input-value="cohort.adminSettings.isRandomModeEnabled"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="Individual Settings"
                      v-model="isIndividualSettingsEnabled"
                      :input-value="cohort.adminSettings.isIndividualSettingsEnabled"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="Test By Region"
                      v-model="isTestByRegionEnabled"
                      :input-value="cohort.adminSettings.isTestByRegionEnabled"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="UltraLab"
                      v-model="isUltraLabEnabled"
                      :input-value="cohort.adminSettings.isUltraLabEnabled"
                    />
                  </div>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="Group Stats"
                      v-model="isGroupStatsEnabled"
                      :input-value="cohort.adminSettings.isGroupStatsEnabled"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="EPLab"
                      v-model="enableEPLab"
                      :input-value="cohort.adminSettings.enableEPLab"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="Advanced Metrics"
                      v-model="isAdvancedMetricsEnabled"
                      :input-value="cohort.adminSettings.isAdvancedMetricsEnabled"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="Analysis"
                      v-model="isAnalysisEnabled"
                      :input-value="cohort.adminSettings.isAnalysisEnabled"
                    />
                  </div>
                </v-col>
                <v-col>
                  <div class="options">
                    <v-checkbox
                      hide-details
                      label="Scientific Mode"
                      v-model="scientificMode.enabled"
                      :input-value="cohort.adminSettings.scientificMode && cohort.adminSettings.scientificMode.enabled"
                    />
                  </div>
                </v-col>
              </v-row>
              <v-row v-if="!isCTLab">
                <v-col>
                  <v-divider></v-divider>
                  <div class="text-start">
                    <fieldset>
                      <legend>{{ `Vendor UIs:` }}</legend>
                      <v-container>
                        <v-row>
                          <v-col>
                            <h5>{{ `Canon` }}</h5>
                            <v-checkbox hide-details label="New UI" v-model="vendorUIs.canon.newUI" />
                          </v-col>
                          <v-col>
                            <h5>{{ `GE` }}</h5>
                            <v-checkbox hide-details label="LX" v-model="vendorUIs.ge.lx" />
                            <v-checkbox hide-details label="New UI" v-model="vendorUIs.ge.newUI" />
                          </v-col>
                          <v-col>
                            <h5>{{ `Hitachi` }}</h5>
                            <v-checkbox hide-details label="New UI" v-model="vendorUIs.hitachi.newUI" />
                          </v-col>
                          <v-col>
                            <h5>{{ `Philips` }}</h5>
                            <v-checkbox hide-details label="R5.7" v-model="vendorUIs.philips.r57" />
                            <v-checkbox hide-details label="New UI" v-model="vendorUIs.philips.newUI" />
                          </v-col>
                          <v-col>
                            <h5>{{ `Siemens` }}</h5>
                            <v-checkbox hide-details label="B19" v-model="vendorUIs.siemens.b19" />
                            <v-checkbox hide-details label="XA" v-model="vendorUIs.siemens.xa" />
                            <v-checkbox hide-details label="New UI" v-model="vendorUIs.siemens.newUI" />
                          </v-col>
                          <v-col>
                            <h5>{{ `United` }}</h5>
                            <v-checkbox hide-details label="New UI" v-model="vendorUIs.united.newUI" />
                          </v-col>
                        </v-row>
                      </v-container>
                    </fieldset>
                  </div>
                  <v-divider></v-divider>
                </v-col>
              </v-row>
              <v-btn color="success" class="my-5" elevation="2" @click="save()">{{
                $t('global.save', languageCode)
              }}</v-btn>
            </v-tab-item>
            <v-tab-item class="p-3">
              <ApiKeyManager :cohort-id="cohortId" />
              <v-divider class="my-8"></v-divider>
              <EndpointPermissionsManager :cohort-id="cohortId" />
            </v-tab-item>
          </v-tabs>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState, mapGetters, mapActions } from 'vuex'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../util/api'
import CohortHeader from '@/components/Headers/CohortHeader'
import RegistrationCodesTable from '@/components/RegistrationCodesTable'
import CohortExamList from '@/components/CohortExamList'
import CohortCriticalThinkingQuestionList from '@/components/CohortCriticalThinkingQuestionList'
import ApiKeyManager from '@/components/ApiKeyManager'
import EndpointPermissionsManager from '@/components/EndpointPermissionsManager'
import config from '@/config'

export default {
  name: 'CohortManagerCohort',
  components: {
    CohortHeader,
    CohortExamList,
    RegistrationCodesTable,
    CohortCriticalThinkingQuestionList,
    ApiKeyManager,
    EndpointPermissionsManager,
  },
  data() {
    return {
      cohorts: [],
      settings: {},
      isActive: false,
      adminSettings: {},
      selectedExams: [],
      preparedExams: [],
      cohortManagers: [],
      numCodesToCreate: 1,
      registrationCodes: [],
      isSandboxEnabled: false,
      expirationDateLength: null,
      isPlaygroundEnabled: false,
      isRandomModeEnabled: false,
      isIndividualSettingsEnabled: false,
      potentialManagerEmail: null,
      isChallengeModeEnabled: false,
      isTestByRegionEnabled: true,
      isUltraLabEnabled: true,
      isGroupStatsEnabled: false,
      enableEPLab: false,
      isAdvancedMetricsEnabled: false,
      isAnalysisEnabled: false,
      amountOfCriticalThinkingQuestionsPerTestRun: null,
      isCTLab: config.isCTLab,
      examHeaders: [
        {
          text: 'Name',
          value: 'title',
          align: 'start',
          sortable: false,
        },
      ],
      vendorUIs: {
        ge: {
          lx: false,
          scanlab: true,
        },
        philips: {
          r57: false,
          scanlab: true,
        },
        siemens: {
          b19: false,
          xa: false,
          scanlab: true,
        },
        hitachi: {
          scanlab: true,
        },
        united: {
          scanlab: true,
        },
        canon: {
          scanlab: true,
        },
      },
      scientificMode: {
        enabled: false,
      },
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken', 'userId']),
    ...mapState('cohortService', ['cohort', 'cohortLoading']),
    ...mapState('user', ['isAdmin', 'isManager']),
    ...mapGetters('user', ['languageCode']),
    cohortId() {
      return this.$route.params.cohortId
    },
  },
  beforeMount() {
    this.loadCohort(this.cohortId)
  },
  mounted() {
    this.loadCohortManagers()
    this.loadRegistrationCodes()
    this.getAllPreparedExams()
  },
  beforeDestroy() {
    this.$store.dispatch('cohortService/reset', {})
  },
  watch: {
    cohort: {
      immediate: true,
      handler: function (newCohort) {
        if (newCohort && newCohort.adminSettings) {
          this.expirationDateLength = newCohort.expirationLength
          this.isActive = newCohort.adminSettings.isActive
          this.isSandboxEnabled = newCohort.adminSettings.isSandboxEnabled
          this.isPlaygroundEnabled = newCohort.adminSettings.isPlaygroundEnabled
          this.isChallengeModeEnabled = newCohort.adminSettings.isChallengeModeEnabled
          this.isRandomModeEnabled = newCohort.adminSettings.isRandomModeEnabled
          this.isTestByRegionEnabled = newCohort.adminSettings.isTestByRegionEnabled
          this.isUltraLabEnabled = newCohort.adminSettings.isUltraLabEnabled
          this.isGroupStatsEnabled = newCohort.adminSettings.isGroupStatsEnabled
          this.enableEPLab = newCohort.adminSettings.enableEPLab
          this.isAdvancedMetricsEnabled = newCohort.adminSettings.isAdvancedMetricsEnabled
          this.isAnalysisEnabled = newCohort.adminSettings.isAnalysisEnabled
          this.isIndividualSettingsEnabled = newCohort.adminSettings.isIndividualSettingsEnabled
          this.amountOfCriticalThinkingQuestionsPerTestRun =
            newCohort.adminSettings.amountOfCriticalThinkingQuestionsPerTestRun
          // Deep merge backend vendorUIs with defaults to ensure all vendors exist
          if (newCohort.adminSettings.vendorUIs) {
            this.vendorUIs = _.defaultsDeep({}, newCohort.adminSettings.vendorUIs, this.vendorUIs)
          }
          this.scientificMode = newCohort.adminSettings.scientificMode ?? this.scientificMode
        }
      },
    },
  },
  methods: {
    ...mapActions('cohortService', ['loadCohort', 'updateCohort']),
    async loadCohortManagers() {
      this.cohortManagers = await this.getCohortManagers()
    },
    async loadRegistrationCodes() {
      this.registrationCodes = await this.getRegistrationCodes()
    },
    async getCohortManagers() {
      let response = await apiGet('cohortManagers', this.accessToken, {
        cohortId: this.cohortId,
        userId: this.userId,
      })

      if (response.data && response.data.success) {
        return response.data.cohortManagers
      } else {
        this.$notify({ type: 'error', text: 'Failed to load cohort managers' })
      }
    },
    async getRegistrationCodes() {
      let response = await apiGet(`registrationCodes`, this.accessToken, {
        cohortId: this.cohortId,
        unused: 'true',
      })

      if (response.data && response.data.success) {
        return response.data.registrationCodes
      } else {
        this.$notify({ type: 'error', text: 'Failed to Load Registration Codes' })
      }
    },
    async findUser() {
      // If the user hasn't specified an email, immediately return null rather
      // than making a query
      if (!this.potentialManagerEmail || this.potentialManagerEmail.length === 0) {
        return null
      }

      let response = await apiGet('users', this.accessToken, {
        email: this.potentialManagerEmail,
      })

      if (response.data && response.data.success) {
        return response.data.users[0]
      } else {
        this.$notify({ type: 'error', text: 'Request to find user failed' })
      }
    },
    async addManager() {
      let user = await this.findUser()

      if (!user) {
        this.$notify({ type: 'error', text: this.$t('CohortManager.could_not_find_user') })
        return
      }

      let response = await apiPost(
        'cohortManagers',
        {
          cohortId: parseInt(this.cohortId),
          userId: user.id,
        },
        this.accessToken
      )

      if (response.data && response.data.success) {
        this.potentialManagerEmail = null
        this.loadCohortManagers()
      } else {
        this.$notify({ type: 'error', text: 'Failed to create manager' })
      }
    },
    async deleteManager(manager) {
      let result = await apiDelete(`cohortManagers/${manager.id}`, this.accessToken)
      if (result.data && result.data.success) {
        this.$notify({ text: 'Deleted Cohort Manager' })
      } else {
        this.$notify({ type: 'error', text: 'Failed To Delete Cohort Manager' })
        return
      }
      this.cohortManagers.splice(this.cohortManagers.indexOf(manager), 1)
    },
    async createCodes() {
      for (let i = 1; i <= this.numCodesToCreate; i++) {
        await apiPost('registrationCodes', { cohortId: parseInt(this.cohortId) }, this.accessToken)
      }

      this.$notify({ text: 'Created Registration Codes' })
      this.loadRegistrationCodes()
    },
    async changeCohortExpirationDate() {
      const isEmptyOrNegative = this.expirationDateLength === '' || parseInt(this.expirationDateLength) <= 0
      if (isEmptyOrNegative) {
        this.$notify({ type: 'error', text: 'Please select a positive expiration days length' })
        return
      }
      await apiPatch(
        `cohorts/${this.$route.params.cohortId}`,
        { expirationLength: this.expirationDateLength },
        this.accessToken
      )
      this.$notify({ type: 'success', text: 'Expiration days length updated' })
    },
    save() {
      this.adminSettings.isActive = this.isActive
      this.adminSettings.isSandboxEnabled = this.isSandboxEnabled
      this.adminSettings.isPlaygroundEnabled = this.isPlaygroundEnabled
      this.adminSettings.isChallengeModeEnabled = this.isChallengeModeEnabled
      this.adminSettings.isRandomModeEnabled = this.isRandomModeEnabled
      this.adminSettings.isTestByRegionEnabled = this.isTestByRegionEnabled
      this.adminSettings.isUltraLabEnabled = this.isUltraLabEnabled
      this.adminSettings.isGroupStatsEnabled = this.isGroupStatsEnabled
      this.adminSettings.enableEPLab = this.enableEPLab
      this.adminSettings.isAdvancedMetricsEnabled = this.isAdvancedMetricsEnabled
      this.adminSettings.isAnalysisEnabled = this.isAnalysisEnabled
      this.adminSettings.isIndividualSettingsEnabled = this.isIndividualSettingsEnabled
      this.adminSettings.vendorUIs = this.vendorUIs
      this.adminSettings.scientificMode = this.scientificMode

      this.updateCohortSettings()
    },
    update(settings) {
      this.adminSettings = settings
    },
    async updateCohortSettings() {
      const success = await this.updateCohort({
        settings: this.settings,
        cohortId: this.cohort.id,
        adminSettings: this.adminSettings,
      })
      if (success) {
        this.$notify({ type: 'success', text: 'Updated!' })
      } else {
        this.$notify({ type: 'error', text: 'Failed' })
      }
    },
    async saveCriticalThinkingQuestionSettings() {
      await this.updateNumberOfQuestions()
      this.updateCohortSettings()
    },
    async updateNumberOfQuestions() {
      const isEmptyOrNegative = this.amountOfCriticalThinkingQuestionsPerTestRun <= 0
      if (isEmptyOrNegative) {
        this.$notify({ type: 'error', text: 'Please enter positive number of questions' })
        return
      }
      this.adminSettings.amountOfCriticalThinkingQuestionsPerTestRun = parseInt(
        this.amountOfCriticalThinkingQuestionsPerTestRun
      )
    },
    async getAllPreparedExams() {
      let response = await apiGet('prepared-exams', this.accessToken)
      if (response.status === 200) {
        this.preparedExams = response.data.exams
        this.getCohortsPreparedExams()
      }
    },
    async getCohortsPreparedExams() {
      let response = await apiGet(`cohort-prepared-exams/${this.cohortId}`, this.accessToken)
      if (response.status === 200) {
        const currentPreparedExamIds = response.data.cohortPreparedExams.map((e) => e.examId)
        const previouslySelectedPreparedExams = this.preparedExams.filter((exam) =>
          currentPreparedExamIds.includes(exam.id)
        )
        this.selectedExams = previouslySelectedPreparedExams
      }
    },
    async savePreparedExams() {
      const ids = this.selectedExams.map((e) => e.id)
      let response = await apiPost('cohort-prepared-exams', { cohortId: this.cohortId, ids }, this.accessToken)
      if (response.status === 200) {
        this.$notify({ type: 'success', text: 'Successfully saved prepared exams.' })
        return
      }
    },
  },
}
</script>

<style scoped lang="scss">
.form {
  width: 100%;
}
</style>
