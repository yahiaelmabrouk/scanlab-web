<template>
  <v-card>
    <v-card-title>{{ $t('global.critical_thinking_questions', languageCode) }}</v-card-title>
    <v-card-text>
      <v-row class="p-3">
        <v-col cols="3">
          <v-row>
            <v-text-field
              label="Question"
              v-model="searchText"
              clearable
              prepend-inner-icon="search"
              outlined
            ></v-text-field>
          </v-row>
          <v-row>
            <v-select
              outlined
              clearable
              item-value="id"
              item-text="name"
              v-model="filterType"
              label="Availability"
              :items="questionTypes"
              prepend-inner-icon="filter_list"
            ></v-select>
          </v-row>
          <v-row>
            <v-select
              prepend-inner-icon="filter_list"
              v-model="searchCategory"
              :items="categories"
              item-text="name"
              item-value="id"
              label="Category"
              outlined
              clearable
            ></v-select>
          </v-row>
          <v-row>
            <v-select
              outlined
              clearable
              label="Question Type"
              v-model="mcQuestionType"
              prepend-inner-icon="filter_list"
              :items="criticalThinkingQuestionTypes"
            ></v-select>
          </v-row>
          <v-row>
            <v-col :cols="isCTLab ? 6 : 12" :class="{ 'pl-0': true, 'pr-0': !isCTLab }">
              <v-select
                v-model="baseBodyPart"
                :items="(bodyPartOptions || []).filter((el) => !el.baseId)"
                item-text="name"
                item-value="id"
                :label="$t('global.body_part')"
                outlined
                menu-props="auto"
              />
            </v-col>
            <v-col cols="6" class="pr-0">
              <v-select
                v-if="isCTLab"
                v-model="bodyPartTypeValue"
                :items="filterBodyPartTypes"
                item-text="name"
                item-value="id"
                :label="`Type`"
                menu-props="auto"
                outlined
                :disabled="baseBodyPartId == 'All'"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-btn block @click="addQuestion()">
              <v-icon color="green">mdi-plus</v-icon>
              {{ $t('global.question', languageCode) }}
            </v-btn>
          </v-row>
          <v-row class="scolly-vh-75">
            <div class="d-flex justify-content-center align-items-center w-100 mt-4" v-if="isLoading">
              <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-list width="100%" v-if="!isLoading">
              <v-list-item-group v-model="currentQuestion">
                <template v-for="(question, index) in criticalThinkingQuestions">
                  <v-list-item v-show="questionIsVisible(question)" :key="question.key" :value="question.key">
                    <v-list-item-content>
                      <v-list-item-title class="text-wrap" v-text="questionText(question)"></v-list-item-title>
                      <v-list-item-subtitle v-text="getCategoryText(question.categoryId)"></v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                  <v-divider v-show="questionIsVisible(question)" :key="index" />
                </template>
              </v-list-item-group>
            </v-list>
          </v-row>
        </v-col>

        <v-col cols="9" v-if="currentQuestionData">
          <div v-if="isLoadingQuestion" class="d-flex justify-center align-center" style="height: 200px">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
          <CriticalThinkingQuestionEditor
            v-else
            @save="saveQuestion"
            @delete="deleteQuestion"
            @duplicate="duplicateQuestion"
            @changed="$forceUpdate()"
            :key="currentQuestionData.id"
            :critical-thinking-question="currentQuestionData"
            :categories="categories"
            :body-parts="bodyParts"
            :dicom-file-sets="dicomFileSets"
          ></CriticalThinkingQuestionEditor>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import CriticalThinkingQuestionEditor from '../components/CriticalThinking/Editor/CriticalThinkingQuestionEditor'

import { mapState, mapGetters, mapActions } from 'vuex'
import { apiGet, apiPost, apiDelete } from '../util/api'
import _ from 'lodash'
import uuidv4 from 'uuid/v4'
import config from '../config'
import { BODY_PART_TYPES } from '../constants'
import { calculateBodyPartIdFromBaseAndType } from '../util/utils'

export default {
  name: 'CriticalThinkingManager',
  components: {
    CriticalThinkingQuestionEditor,
  },
  data() {
    return {
      categories: [],
      bodyParts: [],
      currentQuestion: null,
      criticalThinkingQuestions: [],
      searchText: null,
      searchCategory: null,
      filterType: null,
      questionTypes: ['All', 'Prepared', 'Not Prepared'],
      dicomFileSets: null,
      mcQuestionType: '',
      isCTLab: config.isCTLab,
      bodyPartTypes: BODY_PART_TYPES,
      bodyPartTypeValue: BODY_PART_TYPES[0].id,
      baseBodyPartId: 'All',
      bodyPartId: null,
      isFilterGeneralQuestion: false,
      isLoading: false,
      isLoadingQuestion: false,
    }
  },
  watch: {
    currentQuestionData(newValue) {
      if (newValue && newValue.id) {
        this.currentQuestionId = newValue.id
      }
    },
    async currentQuestion(newVal) {
      if (newVal == null) return
      const question = this.criticalThinkingQuestions.find((q) => q.key === newVal)
      if (!question || question.isNew || question._fullLoaded) return

      this.isLoadingQuestion = true
      try {
        const fullData = await this.fetchFullQuestion(question.id)
        Object.assign(question, fullData, { key: question.key, _fullLoaded: true })
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to load question details' })
        console.error('Error fetching question:', error)
      }
      this.isLoadingQuestion = false
    },
    filterBodyPartTypes: function (newVal, prevVal) {
      if (_.get(newVal, ['length'], 0) > 0 && _.get(newVal, ['length'], 0) != _.get(prevVal, ['length'], 0)) {
        this.bodyPartTypeValue = _.get(newVal, ['0', 'id'], '')
      }
    },
    bodyPartTypeValue: function () {
      if (this.bodyPartTypeValue == 'general') {
        this.isFilterGeneralQuestion = true
      } else {
        this.isFilterGeneralQuestion = false
      }
      this.onBodyPartIdChange()
    },
    baseBodyPartId: function () {
      this.onBodyPartIdChange()
    },
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('questionService', ['criticalThinkingQuestionTypes']),
    ...mapGetters('user', ['languageCode']),
    ...mapGetters('questionService', ['difficultyChoices']),
    baseBodyPart: {
      get() {
        if (!this.isCTLab) {
          return this.selectedBodyPartId
        } else {
          if (!this.baseBodyPartId) {
            const bodyPart = _.find(this.bodyPartOptions, (el) => el.id == _.get(this.questionSet, ['bodyPartId']))
            return bodyPart?.baseId || bodyPart?.id
          } else {
            return this.baseBodyPartId
          }
        }
      },
      set(id) {
        if (!this.isCTLab) {
          this.selectedBodyPartId = id
        } else {
          this.baseBodyPartId = id
        }
      },
    },
    selectedBodyPartId: {
      get() {
        return this.bodyPartId || 'All'
      },
      set(id) {
        this.bodyPartId = id
      },
    },
    filterBodyPartTypes: {
      get() {
        return [
          {
            id: 'general',
            name: 'General',
          },
          ...this.bodyPartTypes.filter(
            (bpt) =>
              !!_.get(
                _.find(
                  _.filter(
                    this.bodyPartOptions,
                    (el) => el.id == this.baseBodyPartId || el.baseId == this.baseBodyPartId
                  ),
                  (el) => _.get(el, ['contrastTypes', bpt.id], false)
                ),
                ['id'],
                null
              )
          ),
        ]
      },
    },
    bodyPartOptions: {
      get() {
        return [
          {
            id: 'All',
            name: 'All',
          },
          ..._.orderBy(this.bodyParts, ['name']),
        ]
      },
    },
    currentQuestionData() {
      if (!this.criticalThinkingQuestions || this.currentQuestion === null) {
        return null
      } else {
        return _.find(this.criticalThinkingQuestions, {
          key: this.currentQuestion,
        })
      }
    },

    currentQuestionId: {
      get: function () {
        return parseInt(this.$route.query.id)
      },
      set: function (newValue) {
        if (parseInt(this.$route.query.id) !== newValue) {
          this.$router.replace({ query: { id: newValue } })
        }
      },
    },
  },

  async mounted() {
    this.isLoading = true
    const categoriesData = await this.getCategories()
    const questions = await this.getQuestions()

    this.isLoading = false
    if (this.isCTLab) {
      const ignoreCategories = ['Safety', 'Encoding', 'Contrast Bolus', 'Cardiac', 'Advanced Neuro']
      this.categories = categoriesData.filter(
        (category) => !_.some(ignoreCategories, (ig) => category.name.includes(ig))
      )

      this.criticalThinkingQuestions = questions.filter((q) => this.categories.find((c) => c.id === q.categoryId))
    } else {
      this.categories = categoriesData
      this.criticalThinkingQuestions = questions
    }
    this.bodyParts = await this.getBodyParts({})
    this.dicomFileSets = await this.fetchAllDicoms()

    if (this.currentQuestionId) {
      this.currentQuestion = _.find(this.criticalThinkingQuestions, {
        id: this.currentQuestionId,
      }).key
    }
  },
  methods: {
    ...mapActions('dicomService', ['fetchAllDicoms']),
    ...mapActions('bodyService', ['getCategories', 'getBodyParts']),
    onBodyPartIdChange() {
      if (!this.isCTLab) {
        return
      }
      if (this.baseBodyPartId == 'All') {
        this.selectedBodyPartId = 'All'
      }
      const baseTypeValue = this.isFilterGeneralQuestion ? 'withOut' : this.bodyPartTypeValue
      const id = calculateBodyPartIdFromBaseAndType(this.bodyPartOptions, this.baseBodyPartId, baseTypeValue)
      if (id) {
        this.selectedBodyPartId = id
      }
    },
    questionText(question) {
      return `${question.isNew || question.hasChanged ? '(*) ' : ''}${question.questionText}`
    },

    async fetchFullQuestion(id) {
      const response = await apiGet(`multipleChoiceQuestions/${id}`, this.accessToken)
      if (response.data?.success) {
        return response.data.multipleChoiceQuestion
      }
      throw new Error('Failed to load question details')
    },

    async getQuestions() {
      let response = await apiGet('multipleChoiceQuestions/list?type=all', this.accessToken)

      if (response.data && response.data.success) {
        let questions = response.data.multipleChoiceQuestions
        _.forEach(questions, (item) => (item.key = uuidv4()))
        return questions
      } else {
        this.$notify({ type: 'error', text: 'Failed to Load Questions' })
      }
    },

    addQuestion() {
      this.criticalThinkingQuestions.unshift({
        questionText: '',
        isNew: true,
        choices: [],
        globalQuestion: this.isCTLab,
        screeningForm: {},
        isBetaQuestion: false,
        onlyForPreparedExams: false,
        key: uuidv4(),
      })
    },
    getCategoryText(categoryId) {
      if (!categoryId) {
        return null
      }
      return _.find(this.categories, ['id', categoryId]).name
    },

    async deleteQuestion(question) {
      if (!question.isNew) {
        let result = await apiDelete(`multipleChoiceQuestions/${question.id}`, this.accessToken)
        if (result.data && result.data.success) {
          this.$notify({ text: 'Deleted Question' })
        } else {
          this.$notify({ type: 'error', text: 'Failed To Delete Question' })
          return
        }
      }
      this.criticalThinkingQuestions.splice(this.criticalThinkingQuestions.indexOf(question), 1)
    },

    async saveQuestion(question) {
      const rq = {
        ..._.omit(question, 'media'),
        media: _.omit(question.media, 'src'),
        questionMiscDocuments: _.map(_.get(question, ['questionMiscDocuments'], []), (doc) => {
          return { ..._.omit(doc, 'src') }
        }),
      }
      let result
      if (question.isNew) {
        result = await apiPost('multipleChoiceQuestions', rq, this.accessToken)
        if (result.data && result.data.success) {
          question.isNew = false
          question.id = result.data.id
          if (question.questionMiscDocuments) {
            question.questionMiscDocuments.forEach((doc) => {
              const newDoc = _.find(result.data.questionMiscDocuments, (el) => el.filename == doc.filename)

              doc.isNew = false
              doc.id = newDoc?.id
              doc.multipleChoiceQuestionId = newDoc?.multipleChoiceQuestionId
            })
          }
          this.$notify({ text: 'Saved New Question' })
        } else {
          this.$notify({ type: 'error', text: 'Failed to Save New Question' })
        }
      } else {
        result = await apiPost(`multipleChoiceQuestions/${question.id}`, rq, this.accessToken)
        if (result.data && result.data.success) {
          this.$notify({ text: 'Updated Question' })
        } else {
          this.$notify({ type: 'error', text: 'Failed To Update Question' })
        }
      }
      if (question.media && question.media.filename && result.data && result.data.mediaUploadData) {
        // upload file
        let formData = new FormData()
        _.forEach(_.keys(result.data.mediaUploadData.signature), (key) => {
          formData.append(key, result.data.mediaUploadData.signature[key])
        })
        await fetch(question.media.src)
          .then((res) => res.blob())
          .then(async (blob) => {
            const file = new File([blob], question.media.filename, { type: question.media.type })
            formData.append('file', file)

            await fetch(result.data.mediaUploadData.postEndpoint, {
              method: 'POST',
              body: formData,
            })

            // TODO: If this fails, gotta revert the changes
            question.media.isNew = false
          })
      }

      if (
        question.questionMiscDocuments &&
        question.questionMiscDocuments.filter((el) => el.isNew).length > 0 &&
        result.data &&
        result.data.miscDocumentsUploadData &&
        result.data.miscDocumentsUploadData.length > 0
      ) {
        for (let i = 0; i < question.questionMiscDocuments.length; i++) {
          const doc = question.questionMiscDocuments[i]
          if (doc.isNew) {
            let formData = new FormData()
            const uploadData = result.data.miscDocumentsUploadData.find((el) => el.filename == doc.filename)
            _.forEach(_.keys(uploadData.signature), (key) => {
              formData.append(key, uploadData.signature[key])
            })
            await fetch(doc.src)
              .then((res) => res.blob())
              .then(async (blob) => {
                const file = new File([blob], doc.filename, { type: doc.type })
                formData.append('file', file)

                await fetch(uploadData.postEndpoint, {
                  method: 'POST',
                  body: formData,
                })
              })
            doc.isNew = false
            doc.id = uploadData.id
          }
        }
      }

      this.$forceUpdate()
    },

    questionIsVisible(question) {
      const searchText = this.searchText
      const searchCategory = this.searchCategory
      const filterType = this.filterType
      const mcQuestionType = this.mcQuestionType
      const { questionText, categoryId, isNew, onlyForPreparedExams, id } = question

      if (isNew) {
        return true
      }
      if (searchCategory) {
        if (searchCategory !== categoryId) {
          return false
        }
      }
      if (searchText) {
        // Search in both question text and ID
        const searchPattern = new RegExp(searchText, 'gi')
        const idMatch = id && String(id).match(searchPattern)
        const textMatch = questionText.match(searchPattern)

        if (!idMatch && !textMatch) {
          return false
        }
      }

      if (filterType) {
        if (filterType === 'Prepared') return onlyForPreparedExams
        if (filterType === 'Not Prepared') return !onlyForPreparedExams
      }

      if (
        this.selectedBodyPartId &&
        this.selectedBodyPartId !== 'All' &&
        question.bodyPartId != this.selectedBodyPartId
      ) {
        return false
      }

      if (this.selectedBodyPartId !== 'All' && question.isGeneralQuestion != this.isFilterGeneralQuestion) {
        return false
      }

      return mcQuestionType === '' || mcQuestionType === question.type
    },

    duplicateQuestion(question) {
      let newQuestion = _.cloneDeep(question)
      _.extend(newQuestion, { isNew: true, key: uuidv4(), id: null, media: null })
      this.criticalThinkingQuestions.unshift(newQuestion)
      this.currentQuestion = newQuestion.key
    },
  },
}
</script>

<style scoped lang="scss">
.scolly-vh-75 {
  overflow-y: auto;
  max-height: 75vh;
}
</style>
