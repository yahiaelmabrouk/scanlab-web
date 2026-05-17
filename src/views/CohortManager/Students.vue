<template>
  <div>
    <div v-if="cohortLoading">
      <v-progress-linear striped indeterminate color="buttonBlue" height="20" />
    </div>
    <v-container v-else-if="isCohortLoaded">
      <v-row>
        <v-col>
          <CohortHeader :cohort="cohort" />

          <StudentManager :cohort="cohort" :whom="`cohort_${cohort.id}`" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import StudentManager from '../../components/StudentManager'
import CohortHeader from '@/components/Headers/CohortHeader'

export default {
  name: 'CohortManagerStudents',
  components: {
    StudentManager,
    CohortHeader,
  },
  data() {
    return {
      isCohortLoaded: false,
    }
  },
  mounted() {
    this.loadCohort(this.$route.params.cohortId)
  },
  computed: {
    ...mapState('cohortService', ['cohort', 'cohortLoading']),
  },
  watch: {
    cohort(newCohort) {
      if (newCohort) {
        this.isCohortLoaded = true
      }
    },
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
