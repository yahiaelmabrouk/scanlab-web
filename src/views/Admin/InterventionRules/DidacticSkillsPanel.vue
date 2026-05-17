<template>
  <SkillsPanel
    domain="didactic"
    :items="categories"
    :loading="isLoading"
    selector-label="Select a critical thinking category"
    @add-rule="onAddRule"
  />
</template>

<script>
import config from '../../../config'
import SkillsPanel from './SkillsPanel.vue'

const CT_IGNORED_CATEGORIES = ['Safety', 'Encoding', 'Contrast Bolus', 'Cardiac', 'Advanced Neuro']

let categoriesCache = null

export default {
  name: 'DidacticSkillsPanel',
  components: { SkillsPanel },
  data() {
    return {
      categories: categoriesCache || [],
      isLoading: false,
    }
  },
  async mounted() {
    if (categoriesCache) return
    this.isLoading = true
    try {
      const categoriesData = await this.$store.dispatch('bodyService/getCategories')
      const filtered = config.isCTLab
        ? categoriesData.filter((c) => !CT_IGNORED_CATEGORIES.some((ig) => c.name.includes(ig)))
        : categoriesData
      categoriesCache = filtered
      this.categories = filtered
    } finally {
      this.isLoading = false
    }
  },
  methods: {
    onAddRule(categoryId) {
      this.$store.dispatch('interventionRules/addDidacticRule', { categoryId })
    },
  },
}
</script>
