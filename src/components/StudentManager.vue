<template>
  <v-card>
    <v-card-title>
      {{ $t('global.student_manager') }}
    </v-card-title>

    <BellCurve :whom="whom"> </BellCurve>

    <v-tabs v-model="tab">
      <v-tab>{{ $t('global.students') }}</v-tab>
      <v-tab>{{ isCTLab ? $t(`StudentManager.best_ct_scores`) : $t(`StudentManager.best_mri_scores`) }}</v-tab>
      <v-tab>{{ $t(`StudentManager.critical_thinking_averages`) }}</v-tab>
      <v-tab>{{
        isCTLab ? $t(`StudentManager.ct_scores_over_time`) : $t(`StudentManager.mri_scores_over_time`)
      }}</v-tab>
      <v-tab v-if="cohort && cohort.adminSettings.isGroupStatsEnabled">{{ $t(`StudentManager.group_stats`) }}</v-tab>
      <v-tab v-if="cohort && cohort.adminSettings.isAnalysisEnabled">{{ $t(`global.analysis`) }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item :key="tabArray[0]">
        <v-card>
          <v-card-title>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              :label="$t('StudentManager.find_student')"
              single-line
              hide-details
            ></v-text-field>
          </v-card-title>
          <v-data-table
            class="row-pointer"
            sort-by="id"
            :sort-desc="true"
            :headers="students.headers"
            :items="students.data"
            :loading="loading"
            :search="whom !== 'everyone' ? search : undefined"
            :server-items-length="whom === 'everyone' ? serverTotalItems : -1"
            :options="whom === 'everyone' ? serverOptions : undefined"
            @update:options="onServerOptionsUpdate"
            single-select
            @click:row="clickUser"
            :footer-props="{
              'items-per-page-text': $t('global.rows_per_page'),
              'items-per-page-options': [10, 25, 50, 100],
            }"
            :items-per-page="10"
          >
            <template #[`item.status`]="{ item }">
              <span class="bold">{{ $t(`global.${item.status}`, languageCode) }}</span>
            </template>
            <template #[`header.individualSettings`]="{ header }">
              {{ header.text }}
              <v-tooltip bottom max-width="300">
                <template #activator="{ on, attrs }">
                  <v-icon small v-bind="attrs" v-on="on">mdi-information-outline</v-icon>
                </template>
                <span>{{ $t('StudentManager.individual_settings_help') }}</span>
              </v-tooltip>
            </template>
            <template #[`item.individualSettings`]="{ item }">
              <StudentIndividualSettingsCell :item="item" :cohort="cohort" />
            </template>
          </v-data-table>
        </v-card>
      </v-tab-item>
      <v-tab-item :key="tabArray[1]">
        <v-card>
          <!-- Cohort view: keep search field -->
          <v-card-title v-if="whom !== 'everyone'">
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              :label="$t('StudentManager.find_student')"
              single-line
              hide-details
            ></v-text-field>
          </v-card-title>
          <!-- Admin view: empty-state message when no student selected -->
          <v-card-title v-if="whom === 'everyone' && !selectedStudent" class="justify-center">
            {{ $t('StudentManager.select_student_to_view_scores') }}
          </v-card-title>
          <v-data-table
            v-if="whom !== 'everyone' || selectedStudent"
            :class="{ 'row-pointer': whom !== 'everyone', 'mri-scores-table': true, 'my-4': whom === 'everyone' }"
            v-on="whom !== 'everyone' ? { 'click:row': clickUser } : {}"
            :sort-by="sortBy"
            :sort-desc="sortDesc"
            :headers="mri.headers"
            :items="mri.data"
            :loading="mriLoading"
            :search="whom !== 'everyone' ? search : undefined"
            hide-default-header
            :hide-default-footer="whom === 'everyone'"
            :footer-props="whom !== 'everyone' ? {
              'items-per-page-text': $t('global.rows_per_page')
            } : undefined"
          >
          <template #header="{ props }">
            <thead>
              <tr>
                <th
                  v-for="header in props.headers"
                  :key="header.value"
                  @click="toggleSort(header)"
                  :class="{
                    'sortable': header.sortable !== false,
                    'active': sortBy === header.value,
                    'desc': sortBy === header.value && sortDesc,
                    'asc': sortBy === header.value && !sortDesc,
                  }"
                  style="cursor: pointer;"
                >
                  <span v-if="header.defaultKey">{{ header.text }}</span>
                  <template v-else>
                    <TranslatedContent type="bodyPart" :record="header.bodyPart" :lookup="{ type: 'nestedKey', path: 'name' }" />
                    {{ ` (%)` }}
                  </template>
                  <span class="header-icon" v-if="header.sortable !== false">
                    <v-icon small>
                      {{ sortDesc ? `mdi-arrow-down` : `mdi-arrow-up` }}
                    </v-icon>
                  </span>
                </th>
              </tr>
            </thead>
          </template>
          <template #item.name="{ item }">
            <span class="bold">{{ item.name }}</span>
          </template>
          <template #item.average="{ item }">
            <span class="bold">{{ item.average }} %</span>
          </template>
          <template v-if="whom !== 'everyone'" #item.data-table-select="{ item }">
            <v-checkbox
              :value="selectedStudents.includes(item)"
              @change="(e) => clickUser(item)"
              :disabled="statsLoading || angulationProcessing || coverageProcessing"
            ></v-checkbox>
          </template>
          </v-data-table>
        </v-card>
      </v-tab-item>
      <v-tab-item :key="tabArray[2]">
        <v-card>
          <!-- Cohort view: keep search and difficulty filter -->
          <v-card-title v-if="whom !== 'everyone'">
            <v-container class="d-flex">
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                :label="$t('StudentManager.find_student')"
                hide-details
              ></v-text-field>
              <v-spacer></v-spacer>
              <v-select
                v-model="ct.selectedDifficulty"
                :items="ct.difficultyOptions"
                :label="$t('global.difficulty')"
                item-text="text"
                item-value="value"
                hide-details
              ></v-select>
            </v-container>
          </v-card-title>
          <!-- Admin view: difficulty filter only (no search, single student) -->
          <v-card-title v-else-if="selectedStudent">
            <v-select
              v-model="ct.selectedDifficulty"
              :items="ct.difficultyOptions"
              :label="$t('global.difficulty')"
              item-text="text"
              item-value="value"
              hide-details
            ></v-select>
          </v-card-title>
          <!-- Admin view: empty-state message when no student selected -->
          <v-card-title v-if="whom === 'everyone' && !selectedStudent" class="justify-center">
            {{ $t('StudentManager.select_student_to_view_scores') }}
          </v-card-title>
          <v-data-table
            v-if="whom !== 'everyone' || selectedStudent"
            :class="{ 'my-4': whom === 'everyone' }"
            show-group-by
            :group-by="whom !== 'everyone' ? 'name' : undefined"
            sort-by="score"
            :sort-desc="true"
            :headers="ct.headers"
            :items="filteredCriticalThinkingResults"
            :loading="ctqLoading"
            :search="whom !== 'everyone' ? search : undefined"
            :hide-default-footer="whom === 'everyone'"
            :footer-props="whom !== 'everyone' ? {
              'items-per-page-text': $t('global.rows_per_page'),
            } : undefined"
          >
            <template #[`item.category`]="{ item }">
              {{
                $te(`CriticalThinkingCategory.${item.category}`)
                  ? $t(`CriticalThinkingCategory.${item.category}`)
                  : item.category
              }}
            </template>
          </v-data-table>
        </v-card>
      </v-tab-item>
      <v-tab-item :key="tabArray[3]">
        <v-card>
          <v-card-title v-if="whom === 'everyone' && !selectedStudent" class="justify-center">
            {{ $t('StudentManager.select_student_to_view_scores') }}
          </v-card-title>
          <template v-if="whom !== 'everyone' || selectedStudent">
            <v-select
              :label="$t('global.select_body_part')"
              :items="bodyPartOptions"
              item-text="text"
              item-value="name"
              v-model="selectedBodyPart"
            ></v-select>
            <MRIScoreLine
              :title="isCTLab ? $t('global.all_ct_scores_over_time') : $t('global.all_mr_scores_over_time')"
              :whom="whom === 'everyone' ? 'user_' + selectedStudent.userId : whom"
              :filter="bodyPartFilter"
              :cohort="cohort"
            ></MRIScoreLine>
          </template>
        </v-card>
      </v-tab-item>
      <v-tab-item v-if="cohort && cohort.adminSettings.isGroupStatsEnabled" :key="tabArray[4]">
        <v-card>
          <v-card-title>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              :label="$t('StudentManager.find_student')"
              single-line
              hide-details
            ></v-text-field>
          </v-card-title>
          <div style="position: relative;">
            <v-overlay :value="statsLoading || angulationProcessing || coverageProcessing" absolute opacity="0.1">
              <v-progress-circular indeterminate size="64"></v-progress-circular>
            </v-overlay>
            <v-data-table
              v-model="selectedStudents"
              sort-by="id"
              :sort-desc="true"
              :single-select="false"
              :headers="students.headers"
              :items="students.data"
              item-key="userId"
              :loading="statsLoading"
              :search="search"
              show-select
              @toggle-select-all="(e) => selectAllStudents(e)"
              :footer-props="{
                'items-per-page-text': $t('global.rows_per_page'),
              }"
            >
              <template #[`item.status`]="{ item }">
                <span class="bold">{{ $t(`global.${item.status}`, languageCode) }}</span>
              </template>
              <template #[`header.individualSettings`]="{ header }">
                {{ header.text }}
                <v-tooltip bottom max-width="300">
                  <template #activator="{ on, attrs }">
                    <v-icon small v-bind="attrs" v-on="on">mdi-information-outline</v-icon>
                  </template>
                  <span>{{ $t('StudentManager.individual_settings_help') }}</span>
                </v-tooltip>
              </template>
              <template #[`item.individualSettings`]="{ item }">
                <StudentIndividualSettingsCell :item="item" :cohort="cohort" />
              </template>
              <template v-slot:header.data-table-select="{ on, props }">
                <v-simple-checkbox
                  v-bind="props"
                  v-on="on"
                  :disabled="statsLoading || angulationProcessing || coverageProcessing"
                ></v-simple-checkbox>
              </template>
              <template v-slot:item.data-table-select="{ isSelected, select }">
                <v-simple-checkbox
                  :value="isSelected"
                  @input="select($event)"
                  :disabled="statsLoading || angulationProcessing || coverageProcessing"
                ></v-simple-checkbox>
              </template>
            </v-data-table>
          </div>
        </v-card>
      </v-tab-item>
      <v-tab-item v-if="cohort && cohort.adminSettings.isAnalysisEnabled" :key="tabArray[5]">
        <GlickoAnalysis from="cohort-manager" :cohort="cohort" class="mb-4" />
      </v-tab-item>
    </v-tabs-items>
    <v-card v-if="isStatsShow">
      <div v-if="selectedStudent && tab !== 4">
        <h2>
          {{
            `Score Statistics ${
              selectedStudent ? `For ${selectedStudent.name}` : `For ${selectedStudents.length}` ? `All Students` : ``
            }`
          }}
        </h2>
        {{ $t('global.last_ip')}}:
        <span v-if="selectedStudent.lastIPs != null && selectedStudent.lastIPs.length > 0">
          <a
            v-for="(item, index) in selectedStudent.lastIPs"
            :key="item.ip"
            :href="`https://tools.keycdn.com/geo?host=${item.ip}`"
            target="_blank"
            rel="noopener noreferrer mr-1"
          >
            {{ index > 0 ? `, ` : `` }}{{ item.ip }} ({{ formatLastAccessDate(item.lastAccess) }})
          </a>
        </span>
        <span v-else-if="selectedStudent.lastIP">
          <a
            :href="`https://tools.keycdn.com/geo?host=${selectedStudent.lastIP}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ selectedStudent.lastIP }}
          </a>
        </span>
        <span v-else> n/a </span>
        <v-row justify="center" v-if="selectedStudent.registrationCode">
          <v-col md="1" cols="12">
            <v-checkbox
              :input-value="selectedStudent.status === 'active'"
              @change="toggleStatus"
              label="Active"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row v-if="selectedStudent.registrationCode" class="ma-0">
          <v-col md="4" cols="12" class="pt-space">
            <span>{{ $t('global.reg_code') }}: {{ selectedStudent.registrationCode.code }}</span>
          </v-col>
          <v-col md="6" cols="12" class="d-flex">
            <span class="number-label">{{ $t('global.number_of_days_active') }}:</span>
            <v-text-field
              v-model.number="selectedStudent.registrationCode.numOfDaysActive"
              rounded
              outlined
              dense
              type="number"
              hide-details
            />
          </v-col>
          <v-col md="2">
            <v-btn block class="blue white--text" @click="updateNumOfDaysActive">{{
              $t('global.save', languageCode)
            }}</v-btn>
          </v-col>
        </v-row>
        <v-row v-if="selectedStudent.registrationCode" class="ma-0">
          <v-col md="6" cols="12">
            <span>{{ $t('global.deactivation_date') }}: {{ deactivationDate }}</span>
          </v-col>
          <v-col md="6" cols="12">
            <span>{{ $t('global.activation_date') }}: {{ formatDate(selectedStudent.registrationCode.activationDate) }}</span>
          </v-col>
        </v-row>
      </div>
      <div v-if="(tab !== 4 && selectedStudent) || (tab === 4 && selectedStudents.length > 0)">
        <MRIScoreLine
          :exact="true"
          :title="isCTLab ? $t('global.ct') : $t('global.mri')"
          :key="`mri_line_user_${tab}`"
          :whom="whomFilter"
          group="bodyPart"
          group-label="bodyPart"
          :isGroupStats="tab === 4"
          :visibleStudents="tab === 4 ? selectedStudents : (selectedStudent ? [selectedStudent] : [])"
          :cohort="cohort"
        ></MRIScoreLine>
        <AngulationCurve
          v-if="isAngulationShow"
          :key="`angle_line_user_${tab}`"
          :whom="whomFilter"
          :show-cohort-average="cohortId"
          :visibleStudents="tab === 4 ? selectedStudents : (selectedStudent ? [selectedStudent] : [])"
          :isGroupStats="tab === 4"
        >
        </AngulationCurve>
        <CoverageCurve
          v-if="isAngulationShow"
          :key="`coverage_line_user_${tab}`"
          :whom="whomFilter"
          :show-cohort-average="cohortId"
          :visibleStudents="tab === 4 ? selectedStudents : (selectedStudent ? [selectedStudent] : [])"
          :isGroupStats="tab === 4"
        >
        </CoverageCurve>
        <div
          v-if="
            cohort &&
            cohort.adminSettings.isAnalysisEnabled &&
            !isPersonGraphsLoading &&
            isPersonGraphsLoaded &&
            tab !== 4 &&
            selectedStudent
          "
        >
          <StudentAnalysis />
        </div>
        <div v-if="cohort && cohort.adminSettings.isAnalysisEnabled && tab !== 4 && selectedStudent">
          <StatisticsTableContainer :analysis-data="studentAnalysisData" v-if="studentAnalysisData.length > 0" />
        </div>
        <!-- whomFilter is always a string here: isCriticalThinkingShow requires tabs 0/1 with a single selectedStudent -->
        <CriticalThinkingHeatMap
          v-if="isCriticalThinkingShow"
          :title="$t('global.critical_thinking_question_averages')"
          :key="`ct_heatmap_user_${tab}`"
          :whom="whomFilter"
        ></CriticalThinkingHeatMap>
        <InterventionRecommendations
          v-if="selectedStudent && tab !== 4"
          :key="`intervention_recommendations_user_${selectedStudent.userId}`"
          :whom="`user_${selectedStudent.userId}`"
          :student="selectedStudent"
        />
      </div>

      <v-btn
        v-if="isAdmin && isCriticalThinkingShow"
        block
        tile
        dark
        class="mb-2 mt-2"
        color="error"
        @click="showDeleteModal = true"
      >
        {{ $t('global.delete_user') }}
      </v-btn>
      <v-dialog v-if="isAdmin && selectedStudent" v-model="showDeleteModal" width="50%">
        <v-card>
          <v-card-title class="headline">
            {{ $t('global.delete_user') }} [id:{{ selectedStudent.userId }}] {{ selectedStudent.email }}
          </v-card-title>
          <v-card-text>
            <ol>
              <li>
                Delete everything reported about/by this user from Sentry in both projects:
                <ul>
                  <li>
                    <a
                      :href="`https://sentry.io/organizations/scanlab/issues/?project=5232262&query=user%3A%22id%3A${selectedStudent.userId}%22&statsPeriod=14d`"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Sentry scanlab-web
                    </a>
                  </li>
                  <li>
                    <a
                      :href="`https://sentry.io/organizations/scanlab/issues/?project=5232818&query=user%3A%22id%3A${selectedStudent.userId}%22&statsPeriod=14d`"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Sentry scanlab-api
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <a
                  :href="`https://app.logrocket.com/b8rwsz/scanlab/settings/gdpr`"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ask LogRocket to delete everything about this user via their email
                </a>
              </li>
            </ol>
            <p>
              <b>Ensure you've manually completed the steps above before proceeding!</b>
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="success" @click="showDeleteModal = false">{{ $t('global.cancel') }}</v-btn>
            <v-btn color="error" @click="deleteSelectedUser">{{ $t('global.delete_user') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-card>
</template>

<script>
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
import moment from 'moment'
import _ from 'lodash'
import { apiGet, apiPatch, apiDelete, apiAnalysis } from '../util/api'
import MRIScoreLine from './Statistics/MRIScoreLine'
import CriticalThinkingHeatMap from './Statistics/CriticalThinkingHeatMap'
import InterventionRecommendations from './InterventionRecommendations'
import AngulationCurve from '../components/Statistics/AngulationCurve'
import CoverageCurve from '../components/Statistics/CoverageCurve'
import BellCurve from '../components/Statistics/BellCurve'
import StudentAnalysis from '../components/Analysis/StudentAnalysis'
import StatisticsTableContainer from '../components/Statistics/StatisticsTableContainer'
import GlickoAnalysis from '@/components/Analysis/GlickoAnalysis'
import StudentIndividualSettingsCell from '@/components/StudentIndividualSettingsCell'
import config from '../config'
import TranslatedContent from '@/components/TranslatedContent'

const { analysisPublicRoot } = config

const TAB_ARRAY = [
  'students',
  'best_mri_scores',
  'critical_thinking_averages',
  'mri_scores_over_time',
  'group_stats',
  'analysis',
]

export default {
  name: 'StudentManager',
  components: {
    MRIScoreLine,
    CriticalThinkingHeatMap,
    InterventionRecommendations,
    AngulationCurve,
    CoverageCurve,
    BellCurve,
    StudentAnalysis,
    StatisticsTableContainer,
    GlickoAnalysis,
    StudentIndividualSettingsCell,
    TranslatedContent,
  },
  props: {
    whom: {
      type: String,
      default: 'everyone',
    },
    cohort: {
      type: Object,
    },
  },
  data() {
    return {
      tabArray: TAB_ARRAY,
      students: {
        headers: [],
        data: [],
      },
      mri: {
        headers: [],
        data: [],
      },
      ct: {
        headers: [],
        data: [],
        difficultyOptions: [],
        selectedDifficulty: 'All',
      },
      loading: true,
      statsLoading: true,
      mriLoading: false,
      ctqLoading: false,
      search: null,
      selectedStudent: null,
      bodyParts: [{ name: 'All', text: this.$t('global.all') }],
      selectedBodyPart: 'All',
      showDeleteModal: false,
      selectedStudents: [],
      publicRootPath: analysisPublicRoot,
      studentAnalysisData: [],
      isCTLab: config.isCTLab,
      sortBy: 'average',
      sortDesc: true,
      serverSearch: '',
      serverOptions: { page: 1, itemsPerPage: 10 },
      serverTotalItems: 0,
      debouncedFetchUsers: null,
    }
  },
  created() {
    this._initialLoadDone = false
    this.debouncedFetchUsers = _.debounce(async () => {
      this.loading = true
      await this.fetchUsers()
      this.loading = false
    }, 300)
  },
  computed: {
    ...mapState('user', ['isAdmin']),
    ...mapState('authentication', ['accessToken']),
    ...mapState('statisticsService', ['sandboxMode', 'angulationProcessing', 'coverageProcessing', 'activeBodyParts']),
    ...mapGetters('user', ['languageCode']),
    ...mapState('translatedContent', ['translatedContent']),
    ...mapState('analysisService', ['isPersonGraphsLoading', 'isPersonGraphsLoaded', 'isPersonGraphsError']),
    whomFilter() {
      return this.tab === 4 ? this.selectedStudents.map((student) => `user_${student.userId}`) : `user_${this.selectedStudent.userId}`
    },
    isSelectedAllStudents() {
      return this.selectedStudents.length === this.students.data.length
    },
    tab: {
      get: function () {
        return this.tabArray.indexOf(this.$route.query.tab)
      },
      set: function (newValue) {
        this.$router.replace({ query: { tab: this.tabArray[newValue] } })
      },
    },

    filteredCriticalThinkingResults() {
      if (this.ct.selectedDifficulty === 'All') {
        return this.ct.data
      } else {
        return _.filter(this.ct.data, { difficulty: this.ct.selectedDifficulty })
      }
    },

    bodyPartFilter() {
      let bodyPart = this.selectedBodyPart
      if (bodyPart && bodyPart !== 'All') {
        return (value) => value.bodyPart === bodyPart
      } else {
        return () => true
      }
    },

    cohortId() {
      if (this.whom == 'everyone') {
        return null
      } else {
        return new Number(this.whom.split('_')[1])
      }
    },

    deactivationDate() {
      if (!this.selectedStudent.registrationCode.activationDate) {
        return null
      }
      return this.formatDate(
        moment(this.selectedStudent.registrationCode.activationDate).add(
          this.selectedStudent.registrationCode.numOfDaysActive,
          'days'
        )
      )
    },

    isStatsShow() {
      const statsShowingTabs = [0, 1, 4]
      return (this.selectedStudent || this.selectedStudents.length) && statsShowingTabs.includes(this.tab)
    },
    isCriticalThinkingShow() {
      const criticalThinkingTabs = [0, 1]
      return this.selectedStudent && criticalThinkingTabs.includes(this.tab)
    },
    isAngulationShow() {
      return this.sandboxMode === 'non-sandbox'
    },
    bodyPartOptions() {
      return this.bodyParts.map((part) => {
        if(part.name === 'All') {
          return { text: this.$t('global.all'), name: 'All' }
        }

        let text = part.text || part.name
        const key = `bodyPart|${part.id}|${this.languageCode}`
        if (this.translatedContent[key]) {
          text = this.translatedContent[key].name
        }
        return {
          text,
          name: part.name,
        }
      })
    },
  },
  async mounted() {
    this.loading = true
    // await this.loadUserCohorts()
    await this.refreshList()
    this.loading = false
    this._initialLoadDone = true

    // Fire remaining data fetches in parallel — don't block the students table
    // Wrapped in try/catch so navigating away mid-flight doesn't throw
    try {
      const fetchPromises = [
        this.getBodyParts({}),
      ]
      if (this.whom !== 'everyone') {
        fetchPromises.unshift(this.fetchMRIData())
        fetchPromises.push(this.fetchMCData())
      }
      const results = await Promise.all(fetchPromises)
      const bodyPartsIndex = this.whom !== 'everyone' ? 1 : 0
      const bodyParts = results[bodyPartsIndex]
      bodyParts.forEach((part) => {
        this.translateThisRecord({type: 'bodyPart', record: part, lang: this.languageCode})
      })
      bodyParts.push({ name: 'All', text: this.$t('global.all') })

      this.bodyParts = _.sortBy(bodyParts, 'name')
      this.statsLoading = false
    } catch {
      // Component likely destroyed during navigation — safe to ignore
    }
  },
  watch: {
    selectedStudents() {
      // this.setActiveBodyParts([])
    },
    tab() {
      this.selectedStudents = []
    },
    async selectedStudent(newStudent) {
      if (this.whom === 'everyone') {
        if (newStudent) {
          this.fetchMRIData('user_' + newStudent.userId)
          this.fetchMCData('user_' + newStudent.userId)
        } else {
          this.mri.data = []
          this.mri.headers = []
          this.ct.data = []
          this.ct.headers = []
        }
      }

      if (newStudent && this.$props.cohort?.adminSettings?.isAnalysisEnabled) {
        // advanced graphs
        //this.generatePersonGraphs({ personId: newStudent.userId })

        // basic table
        this.fetchAnalysisTableData(newStudent.userId)
      }
    },
    //   cohort: {
    //     immediate: true,
    //     handler(newCohort) {
    //       if (newCohort && newCohort.adminSettings.isGroupStatsEnabled && !this.tabArray.includes('group_stats')) {
    //         this.tabArray.push('group_stats')
    //       } else {
    //         const indexOfGroupStats = this.tabArray.indexOf('group_stats')

    //         if (indexOfGroupStats > -1) this.tabArray.splice(indexOfGroupStats)
    //       }
    //     },
    //   },
    languageCode() {
      this.bodyParts.forEach((part) => {
        this.translateThisRecord({type: 'bodyPart', record: part, lang: this.languageCode})
      })
    },
    search(newVal) {
      if (this.whom === 'everyone') {
        this.serverSearch = newVal || ''
        this.serverOptions = { ...this.serverOptions, page: 1 }
        this.debouncedFetchUsers()
      }
    },
  },
  methods: {
    ...mapActions('bodyService', ['getBodyParts']),
    ...mapActions('analysisService', ['generatePersonGraphs']),
    ...mapMutations('statisticsService', ['setActiveBodyParts']),
    ...mapActions('translatedContent', ['translateThisRecord']),
    toggleSort(header) {
      if (this.sortBy === header.value) {
        if(!this.sortDesc) {
          this.sortBy = 'average'
          this.sortDesc = true
        } else {
          this.sortDesc = false
        }
      } else {
        this.sortBy = header.value
        this.sortDesc = true
      }
    },
    formatLastAccessDate(lastAccess) {
      return moment(lastAccess).format('MM/DD/YYYY').toString()
    },
    async fetchAnalysisTableData(id) {
      let response = await apiAnalysis('analysis_person_json', '', { personId: id }).then((response) => {
        return response.data.data
      })
      this.studentAnalysisData = response
    },
    async refreshList() {
      if (this.whom === 'everyone') {
        await this.fetchUsers()
      } else {
        await this.fetchCohortStudents()
      }
    },
    async toggleStatus() {
      const newStatus = this.selectedStudent.status === 'active' ? 'disabled' : 'active'

      let response = await apiPatch(
        `registrationCodes/${this.selectedStudent.registrationCode.id}`,
        {
          status: newStatus,
        },
        this.accessToken
      )

      if (response.data && response.data.success) {
        this.selectedStudent.status = newStatus
        await this.refreshList()
        this.$notify({ type: 'success', text: 'Status updated to ' + newStatus })
      } else {
        this.$notify({ type: 'error', text: 'Error updating status' })
      }
    },
    clickUser(value) {
      this.selectedStudent = _.pick(value, ['name', 'userId', 'status', 'registrationCode', 'lastIP', 'lastIPs', 'email'])
      console.log('this.selectedStudent', this.selectedStudent)
    },
    formatDate(date) {
      if (!date) return ''
      return moment(date).format('MMMM Do YYYY')
    },
    async updateNumOfDaysActive() {
      let response = await apiPatch(
        `registrationCodes/${this.selectedStudent.registrationCode.id}`,
        {
          numOfDaysActive: this.selectedStudent.registrationCode.numOfDaysActive,
        },
        this.accessToken
      )

      if (response.data && response.data.success) {
        this.$notify({ type: 'success', text: 'Number of active days saved' })
      } else {
        this.$notify({ type: 'error', text: 'Failed to change number of active days' })
      }
    },
    async fetchUsers() {
      const limit = this.serverOptions.itemsPerPage
      const offset = (this.serverOptions.page - 1) * limit
      const params = { limit, offset }
      if (this.serverSearch) {
        params.search = this.serverSearch
      }
      const sortBy = this.serverOptions.sortBy && this.serverOptions.sortBy[0]
      if (sortBy) {
        params.sortBy = sortBy
        params.sortDesc = this.serverOptions.sortDesc && this.serverOptions.sortDesc[0]
      }

      let response = await apiGet('/users', this.accessToken, params)

      this.students.data = _.map(response.data.users, (data) => {
        return {
          userId: data.id,
          name: data.legalName,
          email: data.email,
          registrationCode: data.registrationCode,
          status: data.registrationCode?.status,
          lastIP: data.lastIP,
          lastIPs: data.lastIPs,
          lastIPKnown: (data.lastIP || (data.lastIPs && data.lastIPs.length > 0)) ? 'Recorded' : 'n/a',
          belongsToCohort: _.get(data, ['cohortStudents', 0, 'cohort', 'name'], ''),
        }
      })

      if (response.data.pagination) {
        this.serverTotalItems = response.data.pagination.total
      }

      this.students.headers = [
        {
          text: this.$t('global.id'),
          value: 'userId',
        },
        {
          text: this.$t('global.name'),
          value: 'name',
        },
        {
          text: this.$t('global.email'),
          value: 'email',
        },
        {
          text: this.$t('global.cohort'),
          value: 'belongsToCohort',
        },
        {
          text: 'Last IP',
          value: 'lastIPKnown',
        },
      ]
    },
    onServerOptionsUpdate(options) {
      if (this.whom !== 'everyone' || !this._initialLoadDone) return
      const prev = this.serverOptions
      const changed = options.page !== prev.page
        || options.itemsPerPage !== prev.itemsPerPage
        || (options.sortBy && options.sortBy[0]) !== (prev.sortBy && prev.sortBy[0])
        || !!(options.sortDesc && options.sortDesc[0]) !== !!(prev.sortDesc && prev.sortDesc[0])
      this.serverOptions = options
      if (changed) {
        this.loading = true
        this.fetchUsers().finally(() => { this.loading = false })
      }
    },
    async fetchCohortStudents() {
      let cohortId = this.whom.split('_')[1]

      let response = await apiGet('/cohortStudents', this.accessToken, { cohortId })

      this.students.data = _.map(response.data.students, (data) => {
        const settings = data.settingsFromManager || {}
        return {
          status: data.registrationCode.status,
          registrationCode: data.registrationCode,
          cohortStudentId: data.id,
          userId: data.user.id,
          email: data.user.email,
          registrationDate: data.createdAt,
          name: data.user.legalName,
          lastIP: data.user.lastIP,
          lastIPs: data.user.lastIPs,
          examSettingsConfigured: !!settings.overwriteBodyPartSettings,
          ctQuestionsConfigured: !!settings.overwriteCriticalThinkingCategories,
        }
      })

      this.students.headers = [
        {
          text: this.$t('global.status'),
          value: 'status',
        },
        {
          text: this.$t('global.registration_code'),
          value: 'registrationCode.code',
        },
        {
          text: this.$t('global.name'),
          value: 'name',
        },
        // {
        //   text: this.$t('global.email'),
        //   value: 'email',
        // },
        {
          text: this.$t('global.registered_on'),
          value: 'registrationDate',
        },
        ...(this.cohort?.adminSettings?.isIndividualSettingsEnabled
          ? [
              {
                text: this.$t('StudentManager.individual_settings'),
                value: 'individualSettings',
                sortable: false,
              },
            ]
          : []),
      ]
    },
    async fetchMRIData(whom) {
      const target = whom || this.whom
      this.mriLoading = true
      try {
        let response = await apiGet(`statistics/${target}/best`, this.accessToken)

        this.mri.data = response.data.data

        _.forEach(this.mri.data, (value) => {
          value.average = _.mean(_.values(_.map(_.omit(value, ['userId', 'name']), (v) => Number(v)))).toFixed(2)
        })

        // Reset headers to avoid duplicates from repeated calls
        const headers = [
          {
            text: this.$t('global.student'),
            value: 'name',
            defaultKey: true,
          },
          ..._.map(response.data.availableBodyPartDetails, (value) => ({
            text: value.name + ' (%)',
            value: value.name,
            bodyPart: value,
            sortable: true,
          })),
          {
            text: this.$t('StudentManager.average_percent'),
            value: 'average',
            defaultKey: true,
          },
        ]
        this.mri.headers = headers
      } catch (e) {
        console.error('Failed to fetch MRI data', e)
      } finally {
        this.mriLoading = false
      }
    },

    async deleteSelectedUser() {
      try {
        await apiDelete(`users/${this.selectedStudent.userId}`, this.accessToken)
        this.showDeleteModal = false
        this.$notify({ type: 'success', text: 'Deleted!' })
        await this.fetchItems()
        this.selectedStudent = null
      } catch (e) {
        this.$notify({ type: 'error', text: 'Failed to delete user' })
      }
    },

    async fetchMCData(whom) {
      const target = whom || this.whom
      this.ctqLoading = true
      try {
        let response = await apiGet(`statistics/mc/${target}/average`, this.accessToken)

        this.ct.data = response.data.data
        this.ct.difficultyOptions = _.uniq(
          this.ct.data
            .map((it) => it.difficulty)
            .filter((it) => !!it)
            .sort().map((it) => { return { text: it, value: it } })
        )
        this.ct.difficultyOptions.unshift({ text: this.$t('global.all'), value: 'All' })

        this.ct.headers = [
          {
            text: this.$t('global.student'),
            value: 'name',
          },
          {
            text: this.$t('global.category'),
            value: 'category',
          },
          {
            text: `${this.$t('global.difficulty')} (1 - 5)`,
            value: 'difficulty',
          },
          {
            text: this.$t('StudentManager.average_percent'),
            value: 'score',
          },
        ]
      } catch (e) {
        console.error('Failed to fetch critical thinking data', e)
      } finally {
        this.ctqLoading = false
      }
    },

    selectAllStudents(e) {
      if (e.value) {
        this.selectedStudents = this.students.data
      } else {
        this.selectedStudents = []
      }
    },
    onSelectStudent(isSelected, student) {
      if (isSelected) {
        this.selectedStudents = [...this.selectedStudents, student]
      } else {
        this.selectedStudents = this.selectedStudents.filter((s) => s.userId !== student.userId)
      }
    },
  },
}
</script>

<style lang="scss">
.mri-scores-table {
  .header-icon {
    visibility: hidden;
    margin-left: 5px;
  }
  th:hover, th.active {
    .header-icon {
      visibility: visible;
    }
  }
}
.row-pointer {
  cursor: pointer;
}
.pt-space {
  padding-top: 20px;
}
.number-label {
  margin-top: 8px;
  margin-right: 10px;
}
</style>
