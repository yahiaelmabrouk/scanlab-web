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
            v-model="bodyPart.name"
            :label="`${$t('global.name')} (en)`"
            class="mr-2"
          />
          <v-textarea
            outlined
            readonly
            hide-details
            v-model="translatedContentRecord.content.name"
            :label="`${$t('global.name')} (${languageCode})`"
          />
        </div>
        <div>
          <EditTranslation
            class="mt-2"
            :lookup="{ type: 'nestedKey', path: 'name' }"
            :translatedContent="translatedContentRecord"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import EditTranslation from '@/components/EditTranslation.vue'
import LoadingBeaker from '@/components/LoadingBeaker.vue'

export default {
  name: 'BodyPartTranslator',
  components: {
    EditTranslation,
    LoadingBeaker,
  },
  props: {
    bodyPart: {
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
      type: 'bodyPart',
    }
  },
  async mounted() {
    await this.translateThisRecord({
      type: this.type,
      record: this.bodyPart,
      lang: this.languageCode,
    })
    this.loading = false
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('translatedContent', ['translatedContentRecords']),
    translationKey() {
      return `${this.type}|${this.bodyPart.id}|${this.languageCode}`
    },
    translatedContentRecord() {
      return this.translatedContentRecords[this.translationKey]
    },
  },
  methods: {
    ...mapActions('translatedContent', ['translateThisRecord']),
  },
}
</script>

<style lang="scss" scoped>
.fluid {
  max-width: 100% !important;
}
</style>
