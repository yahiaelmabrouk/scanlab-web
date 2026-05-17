<template>
  <div class="main-sidebar">
    <v-card class="main-2" style="padding: 0 0 0 0; background: content-box; height: 100% !important">
      <div class="button-container" style="width: 100%; height: 10%">
        <!-- Button with Grid View Icon -->
        <div v-if="isCanvasActiveFlag" style="width: 100%; height: 100%">
          <div style="height: 50%; display: flex; flex-direction: row; justify-content: start; width: 100%">
            <p class="canvas-p">SAR: First</p>
            <p class="canvas-p">Exam 2, Series 1 - scanned</p>
          </div>
          <div style="height: 50%; width: 100%">
            <p class="canvas-p">db/dt: First, 100%</p>
          </div>
        </div>

        <div class="spacer"></div>
      </div>

      <v-list style="height: 82%">
        <v-list-item style="height: 100%">
          <div class="expand">
            <GESliceView
              v-if="isCanvasActiveFlag"
              class="slice-img"
              view-orientation="x"
              reference-line-id="c"
              :am-fullscreen="false"
              :for-scanning="true"
              :isAutoWLChecked="isAutoWLChecked"
            />
          </div>
        </v-list-item>
      </v-list>
      <div class="d-flex flex-row justify-content-between" style="padding-left: 1rem; padding-right: 1rem; height: 3%">
        <v-checkbox v-model="autoView" label="AutoView"></v-checkbox>
        <v-checkbox v-model="reportCursor" label="ReportCursor"></v-checkbox>
        <v-checkbox v-model="isAutoWLChecked" label="Auto W/L" @change="handleAutoWLChange"></v-checkbox>
      </div>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin.js'
import GESliceView from './GESliceView.vue'

export default {
  mixins: [ScanButtonMixin, MriMixin, SelectionConfigMixin],
  components: {
    GESliceView,
  },
  data() {
    return {
      previewScoreGroupIndex: 0,
      isCurrentQuestion: null,
      sharedData: '',
      isActive: null,
      selectedExaminationDatesValue: 'Examination 4 Jan 2024',
      gridView: 1,
      examinationDates: [
        'Examination 4 Jan 2024',
        'Examination 5 Jan 2024',
        'Examination 6 Jan 2024',
        'Examination 7 Jan 2024',
        'Examination 8 Jan 2024',
      ],
      isAutoWLChecked: false,
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
    handleAutoWLChange() {
      if (this.isAutoWLChecked) {
        setTimeout(() => {
          this.isAutoWLChecked = false
        }, 500)
      }
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
  background-color: #6875a2 !important;
  /* border: 1px solid rgb(136, 136, 136) !important; */
  border-width: thin;
}

.canvas-p {
  margin-bottom: 0px;
  width: 30%;
  font-size: 12px;
  color: white;
  text-align: start;
  margin-left: 10px;
}

.add-btn {
  height: 1.5rem !important;
  align-content: left !important;
  font-size: 10px !important;
  min-width: 25px !important;
  padding: 0 8px !important;
  background: #6875a2;
  margin-left: auto;
  width: 100%;
  margin-top: 8px;
}

::v-deep .v-btn {
  justify-content: flex-start !important;
}

.scanned-ques {
  background: #6875a2 !important;
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

.main-sidebar {
  /* padding: 1rem; */
  height: 100%;
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
  border-bottom: 2px solid #6875a2 !important;
  color: #6875a2 !important;
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
  background: #6875a2;
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
  height: 100%;
  width: 100%;
  background: black !important;
  border: 2px solid #6875a2;
  border-width: thin;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.v-list-item:not(:last-child) {
  margin-right: 8px;
}

.theme--light.v-list {
  background: #6875a2;
  /* color: rgba(0, 0, 0, 0.87); */
}

.v-sheet.v-toolbar:not(.v-sheet--outlined) {
  box-shadow: none;
}

::v-deep .v-menu__content {
  background: #6875a2;
}

::v-deep .theme--light.v-toolbar.v-sheet {
  background-color: #6875a2;
}
.cont1 {
  display: flex;
  justify-content: space-between;
}
.cont-col {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-start;
}
::v-deep .v-input--selection-controls__input {
  background-color: black;
  width: 15px;
  height: 15px;
  border: 1px solid white;
}

::v-deep .v-input--selection-controls__input:checked::before {
  background-color: white;
}

::v-deep .v-label {
  font-family: Arial, sans-serif;
  font-size: 12px;
  margin-left: 0px;
}
.v-application .primary--text {
  color: black !important;
  caret-color: black !important;
}
::v-deep .v-input--selection-controls {
  margin-top: 4px !important;
}
::v-deep .v-label {
  margin-bottom: 0rem;
}
</style>
