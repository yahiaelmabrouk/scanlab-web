<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="panel">
    <div class="panel__header">
      <v-select
        v-model="selectedKey"
        :items="items"
        :item-text="itemText"
        :item-value="itemValue"
        :label="selectorLabel"
        :loading="loading"
        outlined
        dense
        clearable
        hide-details
        class="panel__select"
      />
      <v-btn color="success" :disabled="!selectedKey" @click="onAdd">Add rule</v-btn>
    </div>

    <div v-if="hydrating && !selectedKey" class="panel__hint">Loading rules…</div>

    <div v-if="hydrateError" class="panel__error">
      Failed to load rules: {{ hydrateError }}
      <v-btn text small color="primary" :disabled="hydrating" @click="loadRules">Retry</v-btn>
    </div>

    <div v-if="selectedKey" class="panel__rules">
      <RuleCard
        v-for="rule in rules"
        :key="rule._localId || rule.id"
        :rule="rule"
        :domain="domain"
        :parent-key="selectedKey"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import RuleCard from './RuleCard.vue'

export default {
  name: 'SkillsPanel',
  components: { RuleCard },
  props: {
    domain: { type: String, required: true },
    items: { type: Array, required: true },
    itemText: { type: String, default: 'name' },
    itemValue: { type: String, default: 'id' },
    selectorLabel: { type: String, required: true },
    loading: { type: Boolean, default: false },
  },
  data() {
    return { selectedKey: null, hydrateError: '' }
  },
  computed: {
    ...mapGetters('interventionRules', ['rulesFor', 'isHydrating']),
    rules() {
      return this.rulesFor(this.domain, this.selectedKey)
    },
    hydrating() {
      return this.isHydrating
    },
  },
  mounted() {
    this.loadRules()
  },
  methods: {
    async loadRules() {
      this.hydrateError = ''
      const result = await this.$store.dispatch('interventionRules/hydrate')
      if (result && !result.ok) this.hydrateError = result.error || 'Unknown error'
    },
    onAdd() {
      this.$emit('add-rule', this.selectedKey)
    },
  },
}
</script>

<style scoped lang="scss">
.panel {
  padding-top: 16px;
}
.panel__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.panel__select {
  flex: 1;
}
.panel__hint {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}
.panel__error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--v-error-base, #b00020);
  font-size: 0.875rem;
  margin-bottom: 12px;
}
</style>
