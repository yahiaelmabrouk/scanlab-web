<template>
  <div class="main-sidebar">
    <v-card class="main-2" style="padding: 0; height: 100%">
      <v-list v-if="gridView === 0">
        <v-list-item>
          <div class="expand"></div>
        </v-list-item>
      </v-list>
      <GETaskTable />
    </v-card>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import GETaskTable from './GETasksTable.vue'

export default {
  mixins: [ScanButtonMixin],
  components: {
    GETaskTable,
  },
  data() {
    return {
      previewScoreGroupIndex: 0,
      isCurrentQuestion: null,
      sharedData: '',
      isActive: null,
      selectedExaminationDatesValue: 'Examination 4 Jan 2024',
      gridView: 1,
    }
  },
  mounted() {
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
    })
  },
  computed: {
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'selectedStackQuestionIndexVisual',
      'scanSubmittedByStackQuestionId',
      'scanSubmitted',
    ]),
    ...mapGetters('user', ['vendorStylePreferenceOptions', 'languageCode']),
    ...mapState('selectionConfig', ['isAddLocalizerMode']),
  },
  watch: {
    stackQuestion() {
      this.previewScoreGroupIndex = 0
    },
  },
  methods: {
    jumpToStackQuestion(idx) {
      this.$store.dispatch('questionService/jumpToQuestion', idx - 1)
    },
    updateValueInMixin() {
      // Call the mixin method to update the data in the mixin
      this.openSubmitModal('newValue')
    },

    switchToGridView() {
      this.gridView = 1
    },
    switchToListView() {
      this.gridView = 0
    },
    switchToListViewOption2() {
      // Implement logic for list view option 2
    },
    resetSelectionEx(date) {
      this.selectedExaminationDatesValue = date
      console.log(this.selectedDate)
    },
    ...mapActions('questionService', ['jumpToQuestion']),

    ...mapActions('selectionConfig', [
      'setIsAddLocalizerMode',
      'resetSelection',
      ,
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
  },
}
</script>

<style scoped>
.main-2 {
  height: auto;
  background-color: #7a7bbf !important;
  /* border: 1px solid rgb(136, 136, 136) !important; */
  border-width: thin;
}

.v-list .v-list-item--active {
  /* background-color: white !important; */
}

.add-btn {
  height: 1.5rem !important;
  align-content: left !important;
  font-size: 10px !important;
  min-width: 25px !important;
  padding: 0 8px !important;
  background: #7a7bbf;
  margin-left: auto;
  width: 100%;
  margin-top: 8px;
}
::v-deep .v-btn {
  justify-content: flex-start !important;
}
.after-go {
  /* background: green !important; */
  /* color: white !important; */
}

.scanned-ques {
  background: #7a7bbf !important;
  color: black !important;
}

.img-size {
  margin-left: auto;
  height: 1.25rem;
}

.tooltip-text {
  margin-bottom: 0px !important;
  font-size: 12px;
  width: 300px !important;
  /* color: black; */
}

/* .tooltip-option {
  font-size: 12px;
  display: flex;
  width: 100%;
  margin-bottom: 0px !important;
} */
.tooltip-option {
  /* border: 2px solid transparent;
    border-radius: 4px; */
  padding: 4px 8px;
  transition: border-color 0.3s ease-in-out;
  margin-bottom: 0px !important;
}
.tooltip-option:hover {
  /* border-color: rgb(136, 136, 136); */
}
.v-list-item--active .tooltip-option {
  /* border-color: blue; */
}
.main-sidebar {
  /* padding: 1rem; */
  height: 55%;
  padding-right: 0.2rem !important;
  padding-left: 0.2rem !important;
}

.current-ques {
  /* background: rgb(136, 136, 136) !important; */
}

.arrow-right {
  width: 0;
  height: 18px;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  /* border-left: 9px solid rgb(136, 136, 136) !important; */
  margin-left: 10;
  position: absolute;
  right: -9px;
}

.v-toolbar {
  border-bottom: 2px solid #7a7bbf !important;
  color: #7a7bbf !important;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}
.v-sheet.v-card {
  border-radius: 0px;
}

.flex-container {
  display: flex;
  justify-content: flex-end;
  width: 52%;
}

.v-list {
  padding: 0px 0;
}

.sidebar_tabs {
  background: #7a7bbf;
  /* border-bottom: 1px solid #d5d7d7; */
  font-size: 12px;
  min-height: 20px;
  color: black !important;
  cursor: pointer;
  position: relative;
  /* border: 2px solid #3ec3e7; */
  margin-left: 8px;
  margin-right: 8px;
  margin-bottom: 0.4rem;
}

.button-container {
  display: flex;
  align-items: center;
}

.view-btn {
  margin-bottom: 8px;
  height: 27px !important;
  min-width: 35px !important;
  padding: 0px 0px 0px 10px !important;
  /* Adjust spacing between buttons */
}

.spacer {
  flex: 1;
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
::v-deep .v-toolbar__content {
  width: 100% !important;
}
@media only screen and (min-width: 600px) {
  .button-container {
    flex-direction: row;
    align-items: center;
  }
  .toolbar-right {
    margin-left: auto;
  }
}

@media only screen and (min-width: 1200px) {
  .button-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .toolbar-right {
    margin-left: auto;
  }
}
@media only screen and (min-width: 1241px) {
  .button-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .toolbar-right {
    margin-left: auto;
  }
  .btn-4 {
    margin-bottom: 7px;
    height: 24px;
  }
}
.expand {
  /* height: 100%; */
  background: black !important;
  border: 2px solid #5a5252;
  border-width: thin;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 22rem;
  height: 15rem;
  border-radius: 2px;
}
.current-ques {
  /* border-color: blue; */
}
.v-list-item:not(:last-child) {
  margin-right: 8px;
}
.theme--light.v-list {
  background: #7a7bbf;
  /* color: rgba(0, 0, 0, 0.87); */
}
.v-sheet.v-toolbar:not(.v-sheet--outlined) {
  box-shadow: none !important;
}

::v-deep .v-menu__content {
  background: #7a7bbf;
}
::v-deep .theme--light.v-toolbar.v-sheet {
  background-color: #7a7bbf;
}
::v-deep .v-sheet.v-card:not(.v-sheet--outlined) {
  box-shadow: none !important;
}
</style>
