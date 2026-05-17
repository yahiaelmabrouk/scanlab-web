<template>
  <v-card>
    <v-card-title>{{ $t('global.body_parts', languageCode) }}</v-card-title>
    <v-card-text>
      <v-row class="p-3">
        <v-col cols="3">
          <v-row class="scolly-vh-75">
            <v-list width="100%">
              <v-list-item-group v-model="currentBodyPart">
                <template v-for="(bodyPart, index) in allBodyParts">
                  <v-list-item :key="bodyPart.name" :value="bodyPart">
                    <v-list-item-content>
                      <v-list-item-title class="text-wrap" v-text="bodyPart.name"></v-list-item-title>
                      <v-list-item-subtitle v-text="bodyPart.region.name"></v-list-item-subtitle>
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
          <h3 v-else-if="!currentBodyPart">
            {{ $t('Translate.BodyParts.click_a_body_part_to_get_started_translating', languageCode) }}
          </h3>
          <BodyPartTranslator
            :key="`${currentBodyPart.id}|${selectedLanguageCode}`"
            :body-part="currentBodyPart"
            :language-code="selectedLanguageCode"
            v-else
          ></BodyPartTranslator>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import BodyPartTranslator from '@/components/Translator/BodyPartTranslator'
import { languagesWithoutEnglish } from '@/util/languages'
import { mapState, mapGetters, mapActions } from 'vuex'
import _ from 'lodash'

export default {
  name: 'BodyParts',
  components: {
    BodyPartTranslator,
  },
  data() {
    return {
      allBodyParts: [],
      currentBodyPart: null,
      languages: languagesWithoutEnglish,
      selectedLanguageCode: null,
    }
  },

  computed: {
    ...mapGetters('user', ['languageCode']),
  },

  async mounted() {
    this.allBodyParts = await this.getBodyParts()
  },
  methods: {
    ...mapActions('bodyService', ['getCategories', 'getBodyParts']),
  },
}
</script>

<style scoped lang="scss">
.scolly-vh-75 {
  overflow-y: auto;
  max-height: 75vh;
}
</style>
