<template>
  <div class="sidebar">
    <div class="upperSide">
      <PatientDetails @action-selected="handleActionSelected" />
      <PatientView />
    </div>
    <PatientTestDetails />
  </div>
</template>

<script>
import PatientDetails from './PhPatientDetails.vue'
import PatientView from './PhPatientView'
import IconsGroup from './PhIconsGroup'
import FooterOptions from './PhFooterOptions'
import PatientTestDetails from './PhPatientTestDetails.vue'
export default {
  components: {
    PatientDetails,
    PatientView,
    // eslint-disable-next-line vue/no-unused-components
    IconsGroup,
    // eslint-disable-next-line vue/no-unused-components
    FooterOptions,
    PatientTestDetails,
  },
  methods: {
    handleActionSelected(action) {
      this.$emit('action-selected', action)
    },
  },
}
</script>

<style scoped>
.v-application .mt-6 {
  margin-top: 24px !important;
}

.sidebar {
  height: 101%;
  overflow-y: hidden !important;
  background-color: #d5d7d7 !important;
  display: flex;
  flex-direction: column;
  /* justify-content: space-between; */
}

@media screen and (max-width: 1680px) and (max-height: 1050px) {
  .sidebar {
    height: 102.5%;
    overflow-y: hidden !important;
    background-color: #d5d7d7 !important;
    display: flex;
    flex-direction: column;
    /* justify-content: space-between; */
  }
}

.upperSide {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
</style>
