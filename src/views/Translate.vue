<template>
  <v-container>
    <v-row>
      <v-col>
        <TitleAndAside :title="$t('global.translate', languageCode)" />
        <PageSection>
          <div class="d-flex flex-column m-auto link-container">
            <v-btn x-large outlined class="mb-2" to="/translate/regions">
              {{ $t('global.translate_regions', languageCode) }}
            </v-btn>
            <v-btn x-large outlined class="mb-2" to="/translate/body-parts">
              {{ $t('global.translate_body_parts', languageCode) }}
            </v-btn>
            <v-btn x-large outlined class="mb-2" to="/translate/critical-thinking">
              {{ $t('global.translate_critical_thinking_questions', languageCode) }}
            </v-btn>
            <v-btn x-large outlined class="mb-2" to="/translate/mri-tests">
              {{ $t('global.translate_mri_tests', languageCode) }}
            </v-btn>
            <v-btn x-large outlined to="/translate/word-phrase">
              {{ $t('global.translate_word_phrase', languageCode) }}
            </v-btn>
          </div>
        </PageSection>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex'
import TitleAndAside from '../components/Headers/TitleAndAside.vue'
import PageSection from '../components/PageSection.vue'

export default {
  name: 'Translate',
  components: { TitleAndAside, PageSection },
  computed: {
    ...mapGetters('user', ['languageCode']),
  },
}
</script>

<style scoped>
.link-container {
  max-width: 500px;
}
</style>
