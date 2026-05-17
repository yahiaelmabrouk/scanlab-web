<template>
  <div class="side-1" style="height: 100%">
    <div class="sidebar" style="height: 100%">
      <GERightPatientView style="height: 47%" />
      <GEPosterior style="height: 53%" />
      <!-- <PatientDetails @action-selected="handleActionSelected"/> -->
      <!-- <PatientTestDetails/> -->
      <!-- <FooterOptions /> -->
    </div>
  </div>
</template>

<script>
import GERightPatientView from './GERightPatientView'
import GEPosterior from './GEPosterior.vue'

export default {
  components: {
    GERightPatientView,
    GEPosterior,
  },
  methods: {
    handleActionSelected(action) {
      this.$emit('action-selected', action)
    },
  },
}
</script>

<style scoped>
.sidebar {
  height: 100%;
  overflow-y: hidden !important;
  background-color: #6875a2 !important;
}

.side-1 {
  /* height: 100%; */
}
</style>
