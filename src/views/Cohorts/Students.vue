<template>
  <div>
    <div v-if="cohortLoading">
      <v-progress-linear striped indeterminate color="buttonBlue" height="20" />
    </div>
    <v-container v-else>
      <v-row>
        <v-col>
          <CohortHeader :cohort="cohort" />

          <router-link :to="`/cohorts/${cohort.id}`"
            >&laquo; {{ $t('CohortsStudents.back_to_new', languageCode) }}</router-link
          >

          <StudentManager :cohort="cohort" :whom="`cohort_${cohort.id}`" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import StudentManager from '@/components/StudentManager'
import CohortHeader from '@/components/Headers/CohortHeader'

export default {
  name: 'CohortsStudents',
  components: {
    StudentManager,
    CohortHeader,
  },
  data() {
    return {}
  },
  computed: {
    ...mapState('cohortService', ['cohort', 'cohortLoading']),
    ...mapGetters('user', ['languageCode']),
  },
  beforeMount() {
    this.loadCohort(this.$route.params.cohortId)
  },
  methods: {
    ...mapActions('cohortService', ['loadCohort']),
  },
}
</script>

<style scoped lang="scss"></style>
