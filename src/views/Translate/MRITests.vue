<template>
  <v-card>
    <v-card-title>{{ $t('global.mri_tests', languageCode) }}</v-card-title>
    <v-card-text>
      <v-row class="p-3">
        <v-col cols="3">
          <v-row class="scolly-vh-75">
            <v-list width="100%">
              <v-list-item-group v-model="currentMriTest">
                <template v-for="(mriTest, index) in allMriTests">
                  <v-list-item :key="`mriTest-${mriTest.id}`" :value="mriTest">
                    <v-list-item-content>
                      <v-list-item-title
                        class="text-wrap"
                        v-text="mriTest.name || (mriTest.stackQuestions && mriTest.stackQuestions.length > 0
                          ? mriTest.stackQuestions[0].questionText
                          : '')"
                      ></v-list-item-title>
                      <v-list-item-subtitle v-text="mriTest.bodyPart ? mriTest.bodyPart.name : ''"></v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                  <v-divider :key="index" />
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
          <h3 v-else-if="!currentMriTest">
            {{ $t('Translate.MRITests.click_a_test_to_get_started_translating', languageCode) }}
          </h3>
          <div v-else>
            <v-card v-for="question in currentMriTest.stackQuestions" :key="question.id" class="mt-7">
              <v-card-title>{{ $t('global.question') }} #{{ question.id }}</v-card-title>
              <v-card-text>
                <StackQuestionTranslator
                  :key="`${question.id}|${selectedLanguageCode}`"
                  :stack-question="question"
                  :language-code="selectedLanguageCode"
                ></StackQuestionTranslator>
              </v-card-text>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import StackQuestionTranslator from '@/components/Translator/StackQuestionTranslator'
import { languagesWithoutEnglish } from '@/util/languages'
import { apiGet } from '@/util/api'
import { mapState, mapGetters, mapActions } from 'vuex'
import _ from 'lodash'

export default {
  name: 'MRITests',
  components: {
    StackQuestionTranslator,
  },
  data() {
    return {
      allMriTests: [],
      currentMriTest: null,
      languages: languagesWithoutEnglish,
      selectedLanguageCode: null,
    }
  },

  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapState('authentication', ['accessToken']),
  },

  async mounted() {
    this.allMriTests = await this.fetchStackQuestions()
  },

  methods: {
    async fetchStackQuestions() {
      let response = await apiGet(`questionSets`, this.accessToken)
      return response.data.questionSets
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
