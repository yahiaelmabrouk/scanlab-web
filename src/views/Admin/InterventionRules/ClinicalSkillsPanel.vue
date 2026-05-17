<template>
  <SkillsPanel
    domain="clinical"
    :items="items"
    item-text="label"
    selector-label="Select a clinical skill"
    @add-rule="onAddRule"
  />
</template>

<script>
import { CLINICAL_SKILLS } from '../../../constants/clinicalSkills'
import SkillsPanel from './SkillsPanel.vue'

export default {
  name: 'ClinicalSkillsPanel',
  components: { SkillsPanel },
  computed: {
    items() {
      return CLINICAL_SKILLS
    },
  },
  methods: {
    onAddRule(skillId) {
      this.$store.dispatch('interventionRules/addClinicalRule', { skillId })
    },
  },
}
</script>
