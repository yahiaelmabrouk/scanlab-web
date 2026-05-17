<template>
  <div>
    <v-container>
      <v-expansion-panels accordion>
        <v-expansion-panel>
          <v-expansion-panel-header>{{ $t('PreparedExams.new_exam', languageCode) }}</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-form @submit.prevent="onCreatePreparedExam">
              <v-text-field required :counter="20" v-model="name" label="Name" />
              <v-btn elevation="2" type="submit">{{ $t('global.create', languageCode) }}</v-btn>
            </v-form>
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header
            >({{ numberOfPreparedExams }}) {{ $t('PreparedExams.prepared', languageCode) }}
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-data-table
              :items="exams"
              :headers="headers"
              class="elevation-1"
              :items-per-page="10"
              @click:row="handleExamClick"
            >
              <template v-slot:item.preTestCount="{ item }">
                {{ item.isDynamic ? 1 : item.questions.preTestQuestions.length }}
              </template>
              <template v-slot:item.postTestCount="{ item }">
                {{ item.isDynamic ? item.postQuestionCount : item.questions.postTestQuestions.length }}
              </template>
            </v-data-table>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-card class="mt-5 p-3" v-if="focusedExam">
        <h1>{{ focusedExam.title }}</h1>
        <v-container fluid>
          <v-row key="align" justify="space-between">
            <v-col sm="4">
              <v-switch :input-value="focusedExam.published" @change="togglePublished">
                <template #label>{{ $t('PreparedExams.published', languageCode) }}</template>
              </v-switch>
            </v-col>
            <v-col sm="6">
              <div class="d-flex justify-space-between">
                <v-checkbox hide-details v-model="isSkill" :input-value="focusedExam.isSkill">
                  <template #label>{{ $t('PreparedExams.skill', languageCode) }}</template>
                </v-checkbox>
                <v-checkbox hide-details v-model="isHiring" :input-value="focusedExam.isHiring">
                  <template #label>{{ $t('PreparedExams.hiring', languageCode) }}</template>
                </v-checkbox>
                <v-switch v-model="isDynamic" :input-value="focusedExam.isDynamic" @change="toggleDynamic">
                  <template #label>{{ $t('PreparedExams.dynamic', languageCode) }}</template>
                </v-switch>
              </div>
            </v-col>
          </v-row>
          <v-row v-if="config.isCTLab">
            <v-col sm="6">
              <v-select
                v-model="patientPhysioId"
                :items="patientPhysioOptions"
                item-text="name"
                item-value="id"
                :label="$t('global.manage_patient_physio', languageCode)"
              ></v-select>
            </v-col>
          </v-row>
          <v-row v-if="isDynamic">
            <v-col>
              <v-select
                v-model="regionId"
                :items="regions"
                item-text="name"
                item-value="id"
                :label="$t('global.region', languageCode)"
              ></v-select>
            </v-col>
            <v-col>
              <v-select
                v-model="bodyPartId"
                :items="getBodyPartsForRegion(regionId)"
                item-text="name"
                item-value="id"
                :label="$t('global.body_part', languageCode)"
              ></v-select>
            </v-col>
            <v-col>
              <v-text-field
                type="number"
                min="1"
                v-model="postQuestionCount"
                :label="$t('PreparedExams.post_question_count', languageCode)"
                @input="updatePostQuestionCount"
              ></v-text-field>
            </v-col>
            <v-col>
              <v-text-field
                type="number"
                min="1"
                :max="postQuestionCount"
                v-model="postQuestionBodyPartCount"
                :label="$t('PreparedExams.post_question_body_part_count', languageCode)"
                @input="udpatePostQuestionBodyPartCount"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
        <v-expansion-panels accordion multiple>
          <v-expansion-panel v-if="!isDynamic">
            <v-expansion-panel-header
              >({{ numberOfScreeningQuestions }})
              {{ $t('PreparedExams.screening_questions', languageCode) }}</v-expansion-panel-header
            >
            <v-expansion-panel-content>
              <v-card-title>
                <v-text-field
                  single-line
                  hide-details
                  label="Search"
                  v-model="search"
                  append-icon="mdi-magnify"
                ></v-text-field>
              </v-card-title>
              <v-data-table
                dense
                show-select
                :search="search"
                class="elevation-1"
                :items-per-page="10"
                :headers="CTQHeaders"
                :items="screeningQuestions"
                v-model="selectedScreeningQuestions"
              >
                <template v-slot:item.bodyPartId="{ item }">
                  {{ getBodyPartName(item.bodyPartId) }}
                </template>
              </v-data-table>
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel v-if="isDynamic">
            <v-expansion-panel-header>Pre Test Question Groups (Screening Questions)</v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-combobox
                label="Pre Question Groups"
                :items="preQuestionGroups"
                v-model="selectedPreQuestionGroup"
                dense
              ></v-combobox>
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-header
              >({{ questionSets.length }}) {{ $t(config.isCTLab ? 'PreparedExams.ct' : 'PreparedExams.mri', languageCode) }}</v-expansion-panel-header
            >
            <v-expansion-panel-content>
              <v-data-table
                dense
                show-select
                item-key="id"
                class="elevation-1"
                :items-per-page="10"
                :items="questionSets"
                :single-select="true"
                v-model="selectedQuestionSet"
                :headers="questionSetHeaders"
              >
              </v-data-table>
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel v-if="!isDynamic">
            <v-expansion-panel-header
              >({{ numberOfCTQs }})
              {{ $t('PreparedExams.critical_thinking_questions', languageCode) }}</v-expansion-panel-header
            >
            <v-expansion-panel-content>
              <v-card-title>
                <v-text-field
                  single-line
                  hide-details
                  label="Search"
                  v-model="search"
                  append-icon="mdi-magnify"
                ></v-text-field>
              </v-card-title>
              <v-data-table
                dense
                show-select
                :search="search"
                class="elevation-1"
                :items-per-page="10"
                :headers="CTQHeaders"
                v-model="selectedCTQs"
                :items="criticalThinkingQuestions"
              >
                <template v-slot:item.bodyPartId="{ item }">
                  {{ getBodyPartName(item.bodyPartId) }}
                </template>
              </v-data-table>
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel v-if="isDynamic">
            <v-expansion-panel-header>Post Test Question Groups (Critical Thinking Questions)</v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-combobox
                label="Post Question Groups"
                :items="postQuestionGroups"
                v-model="selectedPostQuestionGroup"
                dense
              ></v-combobox>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-btn block class="mt-3 blue white--text" @click="save">{{ $t('global.save', languageCode) }}</v-btn>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState, mapGetters, mapActions } from 'vuex'
import { apiGet, apiPost, apiPatch } from '../util/api'

import uuidv4 from 'uuid/v4'
import config from '../config'

export default {
  name: 'PreparedExam',
  data() {
    return {
      config,
      name: '',
      exams: [],
      search: '',
      selectedCTQs: [],
      questionSets: [],
      focusedExam: null,
      isSkill: false,
      isHiring: false,
      isDynamic: false,
      regionId: null,
      bodyPartId: null,
      postQuestionCount: 1,
      postQuestionBodyPartCount: 1,
      regions: [],
      bodyParts: [],
      patientPhysios: [],
      patientPhysioId: null,
      screeningQuestions: [],
      selectedQuestionSet: [],
      selectedScreeningQuestions: [],
      preQuestionGroups: [],
      postQuestionGroups: [],
      selectedPreQuestionGroup: null,
      selectedPostQuestionGroup: null,
      criticalThinkingQuestions: [],
      focusedExamCriticalThinkingQuestions: [],
      CTQHeaders: [
        { text: 'ID', align: 'start', value: 'id' },
        { text: 'Question', align: 'start', value: 'questionText' },
        { text: 'Bodypart', align: 'center', value: 'bodyPartId' },
      ],
      questionSetHeaders: [
        { text: 'ID', align: 'start', value: 'id' },
        { text: 'Name', align: 'start', value: 'name' },
      ],
      headers: [
        {
          text: 'Name',
          value: 'title',
          align: 'start',
          sortable: false,
        },
        { text: '# of Screening Questions', align: 'center', value: 'preTestCount' },
        { text: 'Question Set ID', align: 'center', value: 'questions.questionSetId' },
        { text: '# of CTQ', align: 'center', value: 'postTestCount' },
      ],
    }
  },
  mounted() {
    this.getQuestions()
    this.getQuestionSets()
    this.getPreparedExams()
    this.fetchRegionsAndBodyParts()
    this.fetchQuestionGroups()
    if (config.isCTLab) {
      this.fetchPatientPhysios()
    }
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapState('authentication', ['accessToken']),
    numberOfPreparedExams() {
      return this.exams.length > 0 ? this.exams.length : 0
    },
    numberOfCTQs() {
      return this.criticalThinkingQuestions.length > 0
        ? this.criticalThinkingQuestions.filter(this.isNotScreeningQuestion).length
        : 0
    },
    patientPhysioOptions() {
      return [{ id: null, name: 'Random' }, ...this.patientPhysios]
    },
    numberOfScreeningQuestions() {
      return this.screeningQuestions.length > 0 ? this.screeningQuestions.filter(this.isScreeningQuestion).length : 0
    },
  },
  methods: {
    ...mapActions('authentication', ['login']),
    ...mapActions('bodyService', ['getBodyParts']),
    updateRegionId(regionId) {
      console.log('regionId', regionId)
    },
    updateBodyPartId(bodyPartId) {
      console.log('bodyPartId', bodyPartId)
    },
    updatePostQuestionCount(count) {
      //number of ctqs for the exam
      console.log('postQuestionCount', count)
      console.log('focusedExam', this.focusedExam)
      this.postQuestionCount = count
    },
    udpatePostQuestionBodyPartCount(count) {
      //number of body specific ctqs within the total number of ctqs for the exam
      console.log('postQuestionBodyPartCount', count)
      console.log('focusedExam', this.focusedExam)
      this.postQuestionBodyPartCount = count
    },
    async fetchRegionsAndBodyParts() {
      let response = await apiGet(`regions`, this.accessToken)
      this.regions = response.data.regions

      this.bodyParts = await this.getBodyParts({})
    },
    async fetchPatientPhysios() {
      try {
        const response = await apiGet('/patientPhysio/all', this.accessToken)
        this.patientPhysios = _.get(response, ['data', 'data'], [])
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to load patient physios' })
      }
    },
    async fetchQuestionGroups() {
      try {
        const response = await apiGet('questionGroups', this.accessToken)
        if (response.data?.success) {
          const allGroups = response.data.data.questionGroups.map((g) => ({
            text: g.name,
            value: g.id,
            type: g.type,
            questionIds: g.questionIds || [],
          }))
          this.preQuestionGroups = allGroups.filter((g) => g.type === 'pre')
          this.postQuestionGroups = allGroups.filter((g) => g.type === 'post')
        } else {
          throw new Error(response.data?.message || 'Failed to load question groups')
        }
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to load question groups' })
        console.error('Error fetching question groups:', error)
      }
    },
    getBodyPartName(bodyPartId) {
      if (!bodyPartId) return null
      const bodyPart = this.bodyParts.find((bp) => bp.id === bodyPartId)
      return bodyPart ? bodyPart.name : null
    },
    getBodyPartsForRegion(regionId) {
      return _.filter(this.bodyParts, ({ region }) => region.id === regionId)
    },
    isScreeningQuestion(q) {
      return q.categoryId === 3
    },
    isNotScreeningQuestion(q) {
      return !this.isScreeningQuestion(q)
    },
    togglePublished(val) {
      this.focusedExam.published = val
    },
    toggleDynamic(val) {
      this.isDynamic = val
    },
    async onCreatePreparedExam() {
      if (this.name.length < 1) return
      const response = await apiPost(
        'prepared-exams',
        {
          name: this.name,
        },
        this.accessToken
      )
      let newExams = [...this.exams, response.data.exam]
      this.exams = newExams
      this.name = ''
    },
    handleExamClick(val) {
      this.selectedScreeningQuestions = val.questions.preTestQuestions
      this.selectedCTQs = val.questions.postTestQuestions
      const questionSet = this.questionSets.find((set) => set.id === val.questions.questionSetId)
      this.selectedQuestionSet = [questionSet]
      this.focusedExam = val
      this.isSkill = val.isSkill
      this.isHiring = val.isHiring
      this.isDynamic = val.isDynamic
      this.regionId = val.regionId
      this.bodyPartId = val.bodyPartId
      this.postQuestionCount = val.postQuestionCount || 1
      this.postQuestionBodyPartCount = val.postQuestionBodyPartCount || 1
      this.patientPhysioId = val.patientPhysioId || null
      console.log(val)
      this.selectedPreQuestionGroup = this.preQuestionGroups.find((g) => g.value === val.preQuestionGroupId)
      this.selectedPostQuestionGroup = this.postQuestionGroups.find((g) => g.value === val.postQuestionGroupId)
    },
    async getPreparedExams() {
      let response = await apiGet('prepared-exams', this.accessToken)
      const newExams = response.data.exams
      this.exams = newExams
    },
    async getQuestionSets() {
      let response = await apiGet('questionSets', this.accessToken)
      let newQuestionSets = response.data.questionSets.filter((set) => set.isAvailable)
      _.forEach(
        newQuestionSets,
        (questionSet) => (questionSet.name = questionSet.name || questionSet.stackQuestions[0].questionText)
      )
      this.questionSets = newQuestionSets
    },
    async getQuestions() {
      let response = await apiGet('multipleChoiceQuestions/list?type=prepared', this.accessToken)

      if (response.data && response.data.success) {
        let questions = response.data.multipleChoiceQuestions
        _.forEach(questions, (item) => (item.key = uuidv4()))
        const screeningQuestions = questions.filter(this.isScreeningQuestion)
        const criticalThinkingQuestions = questions.filter(this.isNotScreeningQuestion)
        this.screeningQuestions = screeningQuestions
        this.criticalThinkingQuestions = criticalThinkingQuestions
        return questions
      } else {
        this.$notify({ type: 'error', text: 'Failed to Load Questions' })
      }
    },
    async save() {
      try {
        const postTestQuestions = this.selectedCTQs
        const preTestQuestions = this.selectedScreeningQuestions

        if (this.isDynamic) {
          if (!this.regionId) {
            this.$notify({ type: 'error', text: 'Select a Region' })
            return
          }

          if (!this.bodyPartId) {
            this.$notify({ type: 'error', text: 'Select a Body Part' })
            return
          }

          if (this.postQuestionCount < 1) {
            this.$notify({ type: 'error', text: 'Set at least 1 Critical Thinking Question' })
            return
          }

          if (this.postQuestionBodyPartCount < 1) {
            this.$notify({ type: 'error', text: 'Set at least 1 Body Specific Critical Thinking Question' })
            return
          }

          if (this.postQuestionCount < this.focusedExam.postQuestionBodyPartCount) {
            this.$notify({
              type: 'error',
              text: 'Body Part Specific Questions must be less than or equal to Critical Thinking Questions',
            })
            return
          }
          if (!this.selectedPreQuestionGroup.value) {
            this.$notify({ type: 'error', text: 'Select a Pre Exam Question Group' })
            return
          }
          if (!this.selectedPostQuestionGroup.value) {
            this.$notify({ type: 'error', text: 'Select a Post Exam Question Group' })
            return
          }
        }

        if (!this.isDynamic) {
          if (preTestQuestions.length < 1) {
            this.$notify({ type: 'error', text: 'Select at least 1 screening question' })
            return
          }

          if (postTestQuestions.length < 1) {
            this.$notify({ type: 'error', text: 'Select at least 1 critical thinking question' })
            return
          }
        }

        const questionSetId = this.selectedQuestionSet[0]?.id ? this.selectedQuestionSet[0].id : null

        if (!questionSetId) {
          this.$notify({ type: 'error', text: 'Please select an exam.' })
          return
        }
        const { published } = this.focusedExam
        const isSkill = this.isSkill
        const isHiring = this.isHiring
        const isDynamic = this.isDynamic
        const regionId = this.regionId
        const bodyPartId = this.bodyPartId
        const postQuestionCount = this.postQuestionCount
        const postQuestionBodyPartCount = this.postQuestionBodyPartCount
        const preQuestionGroupId = this.selectedPreQuestionGroup?.value ?? null
        const postQuestionGroupId = this.selectedPostQuestionGroup?.value ?? null
        const updatedExam = {
          preTestQuestions,
          postTestQuestions,
          questionSetId,
          published,
          isSkill,
          isHiring,
          isDynamic,
          regionId,
          bodyPartId,
          postQuestionCount,
          postQuestionBodyPartCount,
          preQuestionGroupId,
          postQuestionGroupId,
          patientPhysioId: config.isCTLab ? this.patientPhysioId : null,
        }
        const response = await apiPatch('prepared-exams/' + this.focusedExam.id, updatedExam, this.accessToken)
        const savedExam = response.data.exam
        const idx = this.exams.findIndex((e) => e.id === savedExam.id)
        const updatedExams = this.exams
        updatedExams[idx] = savedExam
        this.exams = [...updatedExams]
        this.focusedExam = savedExam
        this.$notify({ type: 'success', text: 'Saved!' })
      } catch (error) {
        console.log(error)
        this.$notify({ type: 'error', text: 'Error saving' })
      }
    },
  },
}
</script>
