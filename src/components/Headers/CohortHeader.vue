<template>
  <TitleAndAside :title="cohort.name">
    <template #aside>
      <!-- TODO: translate the aside when we have count support in i18n-cloud-translator -->
      <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
      {{ cohort.studentsCount }} {{ $t('global.student_s', languageCode) }}
      <export-student-data-link :cohort="cohort" :text="$t('global.export_cohort_excel')" format="xlsx" />
      <export-student-data-link :cohort="cohort" :text="$t('global.export_cohort_csv')" format="csv" />
    </template>
  </TitleAndAside>
</template>

<script>
import { mapGetters } from 'vuex/dist/vuex.common.js'
import TitleAndAside from './TitleAndAside'
import ExportStudentDataLink from '@/components/ExportStudentDataLink'

export default {
  name: 'CohortHeader',
  components: { TitleAndAside, ExportStudentDataLink },
  props: {
    cohort: {
      type: Object,
      required: true,
    },
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
  },
}
</script>

<style scoped lang="scss"></style>
