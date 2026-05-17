<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-container>
    <v-row>
      <v-col>
        <TitleAndAside title="Intervention Rules" />
        <PageSection>
          <v-tabs v-model="tab">
            <v-tab key="clinical">Clinical Skills</v-tab>
            <v-tab key="didactic">Didactic Skills</v-tab>
            <v-tab key="consistency">Consistency</v-tab>
          </v-tabs>

          <v-tabs-items v-model="tab">
            <v-tab-item key="clinical" :transition="false" :reverse-transition="false">
              <ClinicalSkillsPanel />
            </v-tab-item>
            <v-tab-item key="didactic" :transition="false" :reverse-transition="false">
              <DidacticSkillsPanel />
            </v-tab-item>
            <v-tab-item key="consistency" :transition="false" :reverse-transition="false">
              <ConsistencyPanel />
            </v-tab-item>
          </v-tabs-items>
        </PageSection>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import TitleAndAside from '../../components/Headers/TitleAndAside.vue'
import PageSection from '../../components/PageSection.vue'
import ClinicalSkillsPanel from './InterventionRules/ClinicalSkillsPanel.vue'
import DidacticSkillsPanel from './InterventionRules/DidacticSkillsPanel.vue'
import ConsistencyPanel from './InterventionRules/ConsistencyPanel.vue'

const TAB_ARRAY = ['clinical', 'didactic', 'consistency']

export default {
  name: 'InterventionRules',
  components: { TitleAndAside, PageSection, ClinicalSkillsPanel, DidacticSkillsPanel, ConsistencyPanel },
  computed: {
    tab: {
      get() {
        const idx = TAB_ARRAY.indexOf(this.$route.query.tab)
        return idx === -1 ? 0 : idx
      },
      set(newValue) {
        this.$router.replace({ query: { tab: TAB_ARRAY[newValue] } })
      },
    },
  },
}
</script>

<style scoped lang="scss"></style>
