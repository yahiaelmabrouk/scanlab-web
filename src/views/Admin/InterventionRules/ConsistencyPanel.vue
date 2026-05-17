<template>
  <SkillsPanel
    domain="consistency"
    :items="items"
    item-text="label"
    selector-label="Select a metric"
    @add-rule="onAddRule"
  />
</template>

<script>
import config from '../../../config'
import { CONSISTENCY_METRICS } from '../../../constants/interventionRules'
import SkillsPanel from './SkillsPanel.vue'

export default {
  name: 'ConsistencyPanel',
  components: { SkillsPanel },
  computed: {
    items() {
      const modality = config.isCTLab ? 'CT' : 'MR'
      return CONSISTENCY_METRICS.filter((m) => m.modalities.includes(modality)).map((m) => ({
        id: m.key,
        label: m.label,
      }))
    },
  },
  methods: {
    onAddRule(metric) {
      this.$store.dispatch('interventionRules/addConsistencyRule', { metric })
    },
  },
}
</script>
