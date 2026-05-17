<template>
  <v-card>
    <v-card-title>{{ $t('global.regions', languageCode) }}</v-card-title>
    <v-card-text>
      <v-row class="p-3">
        <v-col cols="3">
          <v-row class="scolly-vh-75">
            <v-list width="100%">
              <v-list-item-group v-model="currentRegion">
                <template v-for="(region, index) in allRegions">
                  <v-list-item :key="region.name" :value="region">
                    <v-list-item-content>
                      <v-list-item-title class="text-wrap" v-text="region.name"></v-list-item-title>
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
          <h3 v-else-if="!currentRegion">
            {{ $t('Translate.Regions.click_a_region_to_get_started_translating', languageCode) }}
          </h3>
          <RegionTranslator
            :key="`${currentRegion.id}|${selectedLanguageCode}`"
            :region="currentRegion"
            :language-code="selectedLanguageCode"
            v-else
          ></RegionTranslator>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import RegionTranslator from '@/components/Translator/RegionTranslator'
import { languagesWithoutEnglish } from '@/util/languages'
import { mapState, mapGetters, mapActions } from 'vuex'
import _ from 'lodash'

export default {
  name: 'Regions',
  components: {
    RegionTranslator,
  },
  data() {
    return {
      allRegions: [],
      currentRegion: null,
      languages: languagesWithoutEnglish,
      selectedLanguageCode: null,
    }
  },

  computed: {
    ...mapGetters('user', ['languageCode']),
  },

  async mounted() {
    this.allRegions = await this.getAllRegions()
  },
  methods: {
    ...mapActions('bodyService', ['getCategories', 'getAllRegions']),
  },
}
</script>

<style scoped lang="scss">
.scolly-vh-75 {
  overflow-y: auto;
  max-height: 75vh;
}
</style>
