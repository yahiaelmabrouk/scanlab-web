<template>
  <div class="side-1">
    <div class="sidebar">
      <GEPatientDetails @action-selected="handleActionSelected" />
      <GEPatientView />
      <GELeftSideOptions />
      <!-- <GEFooterOptions /> -->
    </div>
  </div>
</template>

<script>
import GEPatientDetails from './GEPatientDetails.vue'
import GEPatientView from './GEPatientView'
// import IconsGroup from './IconsGroup'
import GEFooterOptions from './GEFooterOptions'
import GELeftSideOptions from './GELeftSideOptions.vue'
// import PatientTestDetails from './PatientTestDetails.vue'
export default {
  components: {
    GEPatientDetails,
    GEPatientView,
    // IconsGroup,
    GEFooterOptions,
    GELeftSideOptions,
    // PatientTestDetails,
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
  height: 100%;
}
</style>
