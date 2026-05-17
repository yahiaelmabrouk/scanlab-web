<template>
  <div>
    <v-chip
      small
      dark
      :color="item.examSettingsConfigured ? 'success' : 'error'"
      class="mr-2 my-1"
      :to="routeToTab('exam-list')"
      @click.native.stop
    >
      {{ $t('global.exam_list') }}
    </v-chip>
    <v-chip
      small
      dark
      :color="item.ctQuestionsConfigured ? 'success' : 'error'"
      class="my-1"
      :to="routeToTab('critical-thinking')"
      @click.native.stop
    >
      {{ $t('global.critical_thinking') }}
    </v-chip>
  </div>
</template>

<script>
export default {
  name: 'StudentIndividualSettingsCell',
  props: {
    // a row from StudentManager's `students.data` (expects examSettingsConfigured, ctQuestionsConfigured, cohortStudentId)
    item: {
      type: Object,
      required: true,
    },
    cohort: {
      type: Object,
      default: null,
    },
  },
  methods: {
    routeToTab(tab) {
      if (!(this.cohort?.adminSettings?.isIndividualSettingsEnabled && this.item.cohortStudentId)) {
        return undefined
      }
      return {
        name: 'cohorts/student',
        params: { cohortId: this.cohort.id, studentId: this.item.cohortStudentId },
        query: { tab },
      }
    },
  },
}
</script>
