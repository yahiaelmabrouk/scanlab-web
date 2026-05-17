<template>
  <v-container>
    <v-row>
      <v-col>
        <TitleAndAside :title="$t('global.analysis', languageCode)" />
        <PageSection>
          <GlickoAnalysis />
        </PageSection>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import TitleAndAside from '../components/Headers/TitleAndAside.vue'
import PageSection from '../components/PageSection.vue'
import GlickoAnalysis from '../components/Analysis/GlickoAnalysis.vue'

export default {
  components: { TitleAndAside, PageSection, GlickoAnalysis },
  name: 'Analysis',
  data() {
    return {}
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapGetters('user', ['languageCode']),
  },
  methods: {},
}
</script>

<style scoped lang="scss"></style>
