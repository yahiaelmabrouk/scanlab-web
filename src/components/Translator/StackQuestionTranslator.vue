<template>
  <v-container class="fluid">
    <v-row>
      <v-col v-if="loading">
        <LoadingBeaker />
      </v-col>
      <v-col v-else>
        <div class="d-flex flex-grow-1">
          <v-textarea
            outlined
            readonly
            hide-details
            v-model="stackQuestion.questionText"
            :label="`${$t('global.question')} (en)`"
            class="mr-2"
          />
          <v-textarea
            outlined
            readonly
            hide-details
            v-model="translatedContentRecord.content.questionText"
            :label="`${$t('global.question')} (${languageCode})`"
          />
        </div>
        <div class="d-flex flex-grow-1 mt-3" v-if="!isCTLab">
          <v-textarea
            outlined
            readonly
            hide-details
            v-model="stackQuestion.title"
            :label="`${$t('StackQuestionEdit.title')} (en)`"
            class="mr-2"
          />
          <v-textarea
            outlined
            readonly
            hide-details
            v-model="translatedContentRecord.content.title"
            :label="`${$t('global.question')} (${languageCode})`"
          />
        </div>
        <div>
          <EditTranslation
            class="mt-2"
            :lookup="{ type: 'nestedKey', path: 'questionText' }"
            :translatedContent="translatedContentRecord"
          />
        </div>

        <v-card v-for="answer in stackQuestion.answers" :key="`stackQuestionAnswer-${answer.id}`" class="mt-7">
          <v-card-title>{{ $t('global.answer') }} #{{ answer.id }}</v-card-title>
          <v-card-text>
            <div class="d-flex flex-grow-1">
              <v-textarea
                outlined
                readonly
                hide-details
                v-model="answer.name"
                :label="`${$t('global.name')} (en)`"
                class="mr-2"
              />
              <v-textarea
                outlined
                readonly
                hide-details
                :value="findAnswer(translatedContentRecord.content.answers, answer.id).name"
                :label="`${$t('global.name')} (${languageCode})`"
              />
            </div>
            <div>
              <EditTranslation
                class="mt-2"
                :lookup="{
                  type: 'objectInArray',
                  arrayPath: 'answers',
                  identityKey: 'id',
                  identityValue: answer.id,
                  objectKey: 'name',
                }"
                :translatedContent="translatedContentRecord"
              />
            </div>

            <div class="d-flex flex-grow-1 mt-7">
              <v-textarea
                outlined
                readonly
                hide-details
                v-model="answer.criteria"
                :label="`${$t('global.answer_criteria')} (en)`"
                class="mr-2"
              />
              <v-textarea
                outlined
                readonly
                hide-details
                :value="findAnswer(translatedContentRecord.content.answers, answer.id).criteria"
                :label="`${$t('global.answer_criteria')} (${languageCode})`"
              />
            </div>
            <div>
              <EditTranslation
                class="mt-2"
                :lookup="{
                  type: 'objectInArray',
                  arrayPath: 'answers',
                  identityKey: 'id',
                  identityValue: answer.id,
                  objectKey: 'criteria',
                }"
                :translatedContent="translatedContentRecord"
              />
            </div>

            <div class="d-flex flex-grow-1 mt-7">
              <v-textarea
                outlined
                readonly
                hide-details
                v-model="answer.citation"
                :label="`${$t('global.answer_citation')} (en)`"
                class="mr-2"
              />
              <v-textarea
                outlined
                readonly
                hide-details
                :value="findAnswer(translatedContentRecord.content.answers, answer.id).citation"
                :label="`${$t('global.answer_citation')} (${languageCode})`"
              />
            </div>
            <div>
              <EditTranslation
                class="mt-2"
                :lookup="{
                  type: 'objectInArray',
                  arrayPath: 'answers',
                  identityKey: 'id',
                  identityValue: answer.id,
                  objectKey: 'citation',
                }"
                :translatedContent="translatedContentRecord"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import EditTranslation from '@/components/EditTranslation.vue'
import LoadingBeaker from '@/components/LoadingBeaker.vue'
import _ from 'lodash'
import config from '@/config'

export default {
  name: 'StackQuestionTranslator',
  components: {
    EditTranslation,
    LoadingBeaker,
  },
  props: {
    stackQuestion: {
      type: Object,
      required: true,
    },
    languageCode: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      type: 'stackQuestion',
      isCTLab: config.isCTLab,
    }
  },
  async mounted() {
    await this.translateThisRecord({
      type: this.type,
      record: this.stackQuestion,
      lang: this.languageCode,
    })
    this.loading = false
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('translatedContent', ['translatedContentRecords']),
    translationKey() {
      return `${this.type}|${this.stackQuestion.id}|${this.languageCode}`
    },
    translatedContentRecord() {
      return this.translatedContentRecords[this.translationKey]
    },
  },
  methods: {
    ...mapActions('translatedContent', ['translateThisRecord']),
    findAnswer(answers, id) {
      return _.find(answers, ['id', id])
    },
  },
}
</script>

<style lang="scss" scoped>
.fluid {
  max-width: 100% !important;
}
</style>
