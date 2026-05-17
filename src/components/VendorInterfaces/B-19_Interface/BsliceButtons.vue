<template>
  <div class="sliceBtns">
    <div class="btn-1">
      <v-btn @click="toggleDialog" :style="dialogButtonStyle"
        ><img src="@/assets/B19_icons/toolbar.png" height="40px"
      /></v-btn>
      <v-btn @click="toggleProg" :style="progButtonStyle"
        ><img src="@/assets/B19_icons/brain.png" height="40px"
      /></v-btn>
      <v-btn @click="toggleTablePosition"><img src="@/assets/B19_icons/mritable.png" height="45px" /></v-btn>
      <v-btn @click="toggleRespirationWaveform"><img src="@/assets/B19_icons/pulse.png" height="40px" /></v-btn>
      <v-btn @click="toggleExamExplorer"><img src="@/assets/B19_icons/exam.png" height="40px" /></v-btn>
      <v-btn @click="toggleSarInformation"><img src="@/assets/B19_icons/sar.png" height="40px" /></v-btn>
    </div>

    <PositionToolbar v-if="dialogVisible" @close="closeDialog"> </PositionToolbar>

    <ProgStep v-if="progVisible" @close="closeProg"> </ProgStep>

    <TablePositioning v-if="tablePositionVisible" @close="closeTablePosition"> </TablePositioning>
    <SarInformation v-if="SarInformationVisible" @close="closeSAR"> </SarInformation>
    <RespirationWaveform v-if="RespirationWaveformVisible" @close="closeSAR"> </RespirationWaveform>
    <ExamExplorer v-if="ExamExplorerVisible" @close="closeExEx"></ExamExplorer>
  </div>
</template>

<script>
import ProgStep from './ProgStep.vue'
import PositionToolbar from './positionToolbar.vue'
import TablePositioning from './TablePositioningToolbar.vue'
import SarInformation from './BsarInformation.vue'
import RespirationWaveform from './RespirationWaveform.vue'
import ExamExplorer from './ExamExplorer.vue'

export default {
  components: {
    PositionToolbar,
    ProgStep,
    TablePositioning,
    SarInformation,
    RespirationWaveform,
    ExamExplorer,
  },
  data() {
    return {
      dialogVisible: true,
      progVisible: false,
      tablePositionVisible: false,
      SarInformationVisible: false,
      RespirationWaveformVisible: false,
      ExamExplorerVisible: false,
    }
  },
  computed: {
    dialogButtonStyle() {
      return this.dialogVisible ? 'background: #fff9f9 !important;' : 'background: #c0c0c0 !important;'
    },
    progButtonStyle() {
      return this.progVisible ? 'background: #fff9f9 !important;' : 'background: #c0c0c0 !important;'
    },
  },
  methods: {
    openDialog() {
      this.dialogVisible = true
    },
    closeDialog() {
      this.dialogVisible = false
    },
    toggleDialog() {
      this.dialogVisible = !this.dialogVisible
    },
    toggleProg() {
      this.progVisible = !this.progVisible
    },
    toggleTablePosition() {
      this.tablePositionVisible = !this.tablePositionVisible
    },
    toggleSarInformation() {
      this.SarInformationVisible = !this.SarInformationVisible
    },
    toggleExamExplorer() {
      this.ExamExplorerVisible = !this.ExamExplorerVisible
    },
    toggleRespirationWaveform() {
      this.RespirationWaveformVisible = !this.RespirationWaveformVisible
    },

    openProg() {
      this.progVisible = true
    },
    closeProg() {
      this.progVisible = false
    },
    openTablePosition() {
      this.tablePositionVisible = true
    },
    closeTablePosition() {
      this.tablePositionVisible = false
    },
    openSAR() {
      this.SarInformationVisible = true
    },
    closeSAR() {
      this.SarInformationVisible = false
    },
    openRes() {
      this.RespirationWaveformVisible = true
    },
    closeRes() {
      this.RespirationWaveformVisible = false
    },
    openExEx() {
      this.ExamExplorerVisible = true
    },
    closeExEx() {
      this.ExamExplorerVisible = false
    },
  },
}
</script>

<style scoped>
.v-btn {
  background: #c0c0c0 !important;
  margin-bottom: 0.25rem !important;
  margin-left: 0.1rem !important;
  border-radius: 0px !important;
  padding: 0px 5px !important;
  height: 15.2% !important;
  min-width: 53px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 3px solid white !important;
  border-left: 2px solid white !important;
  border-width: thin !important;
}

.btn-1 {
  height: 100% !important;
  width: 100% !important;
  background: black !important;
  display: flex !important;
  flex-direction: column !important;
  max-width: 100% !important;
}

/* Responsive design */

@media (min-width: 480px) and (max-width: 2572px) {
  .sliceBtns {
    height: 100%;
  }
}
</style>
