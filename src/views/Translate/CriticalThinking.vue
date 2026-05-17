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
          <v-row class="scolly-vh-75">
            <v-list width="100%">
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

        <v-col cols="9">
          <v-select
            outlined
            v-model="selectedLanguageCode"
            :items="languages"
            item-text="name"
            item-value="code"
            :label="$t('global.language')"
          />
          <v-divider></v-divider>

          <h3 v-if="!selectedLanguageCode">
            {{ $t('Translate.shared.choose_a_language_to_get_started_translating', languageCode) }}
          </h3>
          <h3 v-else-if="!currentQuestionData">
            {{ $t('Translate.CriticalThinking.click_a_question_to_get_started_translating', languageCode) }}
          </h3>
          <CriticalThinkingQuestionTranslator
            :key="`${currentQuestionData.id}|${selectedLanguageCode}`"
            :critical-thinking-question="currentQuestionData"
            :language-code="selectedLanguageCode"
            v-else
          ></CriticalThinkingQuestionTranslator>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import CriticalThinkingQuestionTranslator from '@/components/Translator/CriticalThinkingQuestionTranslator'
import { languagesWithoutEnglish } from '@/util/languages'
import { mapState, mapGetters, mapActions } from 'vuex'
import { apiGet, apiPost, apiDelete } from '@/util/api'
import _ from 'lodash'
import uuidv4 from 'uuid/v4'

export default {
  name: 'CriticalThinking',
  components: {
    CriticalThinkingQuestionTranslator,
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
      mcQuestionType: '',
      languages: languagesWithoutEnglish,
      selectedLanguageCode: null,
    }
  },
  watch: {
    currentQuestionData(newValue) {
      if (newValue && newValue.id) {
        this.currentQuestionId = newValue.id
      }
    },
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('questionService', ['criticalThinkingQuestionTypes']),
    ...mapGetters('user', ['languageCode']),
    ...mapGetters('questionService', ['difficultyChoices']),
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
    this.categories = await this.getCategories()
    this.bodyParts = await this.getBodyParts({})

    this.criticalThinkingQuestions = await this.getQuestions()
    if (this.currentQuestionId) {
      this.currentQuestion = _.find(this.criticalThinkingQuestions, {
        id: this.currentQuestionId,
      }).key
    }
  },
  methods: {
    ...mapActions('bodyService', ['getCategories', 'getBodyParts']),

    questionText(question) {
      return `${question.isNew || question.hasChanged ? '(*) ' : ''}${question.questionText}`
    },

    async getQuestions() {
      let response = await apiGet('multipleChoiceQuestions?type=all', this.accessToken)

      if (response.data && response.data.success) {
        let questions = response.data.multipleChoiceQuestions
        _.forEach(questions, (item) => (item.key = uuidv4()))
        return questions
      } else {
        this.$notify({ type: 'error', text: 'Failed to Load Questions' })
      }
    },

    getCategoryText(categoryId) {
      if (!categoryId) {
        return null
      }
      return _.find(this.categories, ['id', categoryId]).name
    },

    questionIsVisible(question) {
      const searchText = this.searchText
      const searchCategory = this.searchCategory
      const filterType = this.filterType
      const mcQuestionType = this.mcQuestionType
      const { questionText, categoryId, isNew, onlyForPreparedExams } = question

      if (isNew) {
        return true
      }
      if (searchCategory) {
        if (searchCategory !== categoryId) {
          return false
        }
      }
      if (searchText) {
        if (!questionText.match(new RegExp(searchText, 'gi'))) {
          return false
        }
      }

      if (filterType) {
        if (filterType === 'Prepared') return onlyForPreparedExams
        if (filterType === 'Not Prepared') return !onlyForPreparedExams
      }

      return mcQuestionType === '' || mcQuestionType === question.type
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
