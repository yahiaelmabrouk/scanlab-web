<template>
  <div>
    <v-checkbox
      v-if="student"
      hide-details
      :label="$t('CohortManager.overwrite_cohort_student_settings')"
      v-model="student.settingsFromManager.overwriteCriticalThinkingCategories"
      @change="updateSettings()"
    />

    <v-btn
      v-if="student && student.settingsFromManager.overwriteCriticalThinkingCategories"
      class="mt-2"
      small
      text
      color="buttonBlue"
      @click="resetToCohortSettings()"
    >
      {{ $t('CohortManager.reset_to_cohort_settings') }}
    </v-btn>

    <v-simple-table v-if="!student || student.settingsFromManager.overwriteCriticalThinkingCategories">
      <thead>
        <tr>
          <th>{{ $t('global.category') }}</th>
          <th>{{ $t('global.maximum_difficulty_level') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="category in categoryList">
          <CohortExamTableCategory :category="category" :key="category.id" @update="updateSettings" />
        </template>
      </tbody>
    </v-simple-table>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import CohortExamTableCategory from '@/components/CohortExamTableCategory'
import { apiPatch } from '@/util/api'
import _ from 'lodash'
import config from '../config'
export default {
  name: 'CohortCriticalThinkingQuestionList',
  components: {
    CohortExamTableCategory,
  },
  props: {
    cohort: {
      type: Object,
      required: true,
    },
    student: {
      type: Object,
      required: false,
    },
    isAdminScreen: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      categories: [],
      ignoreCategories: config.isCTLab
        ? ['Safety', 'Encoding', 'Contrast Bolus', 'Cardiac', 'Advanced Neuro', 'Demo']
        : [],
    }
  },
  async mounted() {
    let categories = await this.getCategories()
    if (!this.showAdminScreen) {
      categories = categories.filter(
        ({ id }) => !_.some(this.cohort.adminSettings.criticalThinkingCategories, { id, locked: true })
      )
    }
    this.categories = categories
  },
  computed: {
    ...mapState('user', ['isAdmin']),
    ...mapState('authentication', ['accessToken']),
    showAdminScreen() {
      return this.isAdmin && this.isAdminScreen
    },
    categoryList() {
      const filteredCat = this.categories.filter((c) => !_.some(this.ignoreCategories, (ig) => c.name.includes(ig)))
      return filteredCat.map((category) => {
        return {
          id: category.id,
          name: category.name,
          locked: this.isCategoryLocked(category),
          maxDifficulty: this.getMaxDifficulty(category),
          minDifficulty: this.getMinDifficulty(category),
        }
      })
    },
    settings() {
      if (this.student) {
        return this.student.settingsFromManager
      } else {
        const setting = this.showAdminScreen ? 'adminSettings' : 'settings'
        return this.cohort[setting]
      }
    },
  },
  methods: {
    ...mapActions('bodyService', ['getCategories']),
    isCategoryLocked(category) {
      return _.some(this.settings.criticalThinkingCategories, { id: category.id, locked: true })
    },
    getMaxDifficulty(category) {
      let categories = this.settings.criticalThinkingCategories || []

      const existingCat = categories.find((c) => c.id === category.id)
      if (existingCat && existingCat.maxDifficulty) {
        return existingCat.maxDifficulty
      } else {
        return 5
      }
    },
    getMinDifficulty(category) {
      let categories = this.settings.criticalThinkingCategories || []

      const existingCat = categories.find((c) => c.id === category.id)
      if (existingCat && existingCat.minDifficulty) {
        return existingCat.minDifficulty
      } else {
        return 1
      }
    },
    async resetToCohortSettings() {
      // Keep the override enabled so the manager can continue customizing from the cohort defaults.
      const settings = {
        overwriteCriticalThinkingCategories: true,
        criticalThinkingCategories: _.cloneDeep(this.cohort.settings.criticalThinkingCategories || []),
      }

      const response = await apiPatch(
        `cohortStudents/${this.student.id}`,
        { settingsFromManager: settings },
        this.accessToken
      )

      if (response.data && response.data.success) {
        Object.assign(this.settings, settings)
        this.$notify({ type: 'success', text: 'Updated!' })
      } else {
        this.$notify({ type: 'error', text: 'Failed' })
      }
    },
    async updateSettings(category) {
      if (!this.settings.criticalThinkingCategories) {
        this.settings.criticalThinkingCategories = []
      }

      const newSettings = {}

      if (category) {
        const criticalThinkingCategories = this.settings.criticalThinkingCategories.filter((c) => c.id !== category.id)
        criticalThinkingCategories.push(_.pick(category, ['id', 'maxDifficulty', 'locked', 'minDifficulty']))
        newSettings.criticalThinkingCategories = criticalThinkingCategories
      }

      let response
      if (this.student) {
        const isEnablingOverride = !!this.student.settingsFromManager.overwriteCriticalThinkingCategories
        newSettings.overwriteCriticalThinkingCategories = isEnablingOverride

        // When enabling override (checkbox clicked, no category passed), include current categories
        // (already populated in memory by Student.vue from cohort settings)
        if (isEnablingOverride && !category) {
          newSettings.criticalThinkingCategories = this.student.settingsFromManager.criticalThinkingCategories || []
        }

        response = await apiPatch(
          `cohortStudents/${this.student.id}`,
          { settingsFromManager: newSettings },
          this.accessToken
        )
      } else {
        const setting = this.showAdminScreen ? 'adminSettings' : 'settings'
        response = await apiPatch(`cohorts/${this.cohort.id}`, { [setting]: newSettings }, this.accessToken)
      }

      if (response.data && response.data.success) {
        Object.assign(this.settings, newSettings)
        this.$notify({ type: 'success', text: 'Updated!' })
      } else {
        this.$notify({ type: 'error', text: 'Failed' })
      }
    },
  },
}
</script>

<style scoped lang="scss"></style>
