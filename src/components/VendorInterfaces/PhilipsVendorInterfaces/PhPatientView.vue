<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="main-sidebar">
    <v-card class="main-2" style="padding: 0 0 1rem 0">
      <div class="button-container">
        <!-- Button with Grid View Icon -->
        <v-btn tile outlined class="view-btn" color="primary" @click="switchToGridView" style="margin-right: 0px">
          <v-icon left>mdi-view-list</v-icon>
        </v-btn>
        <v-btn tile outlined class="view-btn" color="primary" @click="switchToListView" style="margin-left: 0px">
          <v-icon left>mdi-view-grid</v-icon>
        </v-btn>
        <div class="text-2">
          <v-menu offset-y>
            <template #activator="{ on }">
              <v-btn :disabled="isAddLocalizerMode" class="btn-4" v-on="on" dense outlined style="margin-left: 8px">
                {{ selectedExaminationDatesValue }}
                <v-icon small>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list style="max-height: 200px; overflow-y: auto; min-width: 200px">
              <v-list-item v-for="(date, index) in examinationDates" :key="index" @click="resetSelectionEx(date)">
                <v-list-item-title>{{ `Examination ${date}` }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
        <div class="spacer"></div>
        <v-btn tile outlined class="edit-btn view-btn" color="primary" style="margin-bottom: 8px !important">
          <v-icon left>mdi-pencil</v-icon>
        </v-btn>
      </div>
      <v-toolbar color="#D5d7d7" height="35px" dense class="justify-space-between">
        <div class="toolbar-left">
          <v-icon left v-if="gridView !== 0">mdi-view-list</v-icon>
          <v-icon left v-else>mdi-view-grid</v-icon>
          <v-toolbar-title style="color: black; flex: 1">Brain</v-toolbar-title>
        </div>
        <div class="toolbar-right">
          <v-icon>mdi-av-timer</v-icon>
          <b style="margin-left: 4px" v-if="getIsUltraLab">{{ scanTime }}</b>
        </div>
      </v-toolbar>
      <v-list v-if="gridView === 0">
        <v-list-item>
          <div class="expand"></div>
        </v-list-item>
      </v-list>
      <v-list v-model="selectedStackQuestionIndexVisual" style="height: 310px" v-else>
        <v-list-item
          :class="{
            'current-ques': isCurrentQuestion === idx && !scanSubmittedByStackQuestionId[stackQuestion.id],
            'scanned-ques': scanSubmittedByStackQuestionId[stackQuestion.id],
            'after-go': sharedData && isActive === idx && !isCurrentQuestion,
          }"
          @click="
            jumpToStackQuestion(idx + 1)
            isCurrentQuestion = idx
            isActive = idx
            tabChange()
          "
          v-for="(stackQuestion, idx) of stackQuestions"
          :step="idx + 1"
          :key="`${idx}-step`"
          class="sidebar_tabs"
        >
          <div
            v-if="isCurrentQuestion === idx && !scanSubmittedByStackQuestionId[stackQuestion.id]"
            class="arrow-right"
          ></div>
          {{ idx + 1 }}

          <v-tooltip bottom>
            <template #activator="{ on, props }">
              <p class="tooltip-option" v-bind="props" v-on="on">
                {{ stackQuestion.questionText.split(' ').slice(0, 3).join(' ') }}
              </p>
            </template>
            <p class="tooltip-text">{{ stackQuestion.questionText }}</p>
          </v-tooltip>
          <div class="flex-container">
            <img
              v-if="scanSubmittedByStackQuestionId[stackQuestion.id]"
              src="@/assets/philips_img/scannedicon.png"
              class="img-size"
            />
          </div>
        </v-list-item>
        <v-list-item>
          <v-btn
            tile
            outlined
            class="add-btn"
            color="buttonBlue"
            @click="setIsAddLocalizerMode(true)"
            style="margin-left: 0px"
          >
            <v-icon small>mdi-plus</v-icon>
            <b>Add new scan item..</b>
          </v-btn>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import { MriMixin } from '@/components/Mixins/MriMixin'
export default {
  mixins: [ScanButtonMixin, MriMixin],
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
    ...mapGetters('scanTimeConfig', [
      'getAccelFactorPE',
      'getParallelFactor',
      'getAcquiredResolutionHeader',
      'getIsUltraLab',
      'getTrueResolutionHeaderUltra',
      'getTrueResolutionHeader',
    ]),
    ...mapGetters('user', ['vendorStylePreferenceOptions', 'languageCode']),
    ...mapState('selectionConfig', ['isAddLocalizerMode']),
    ...mapState('dataToParent', ['sequenceType']),
    // ...mapState('scanTimeConfig', ['scanTime']),

    ...mapGetters('scanTimeConfig', ['getAccelFactorPE', 'getParallelFactor']),
    ...mapGetters('dataToParent', ['getscanTime']),
    // Importtant One

    scanTime() {
      return this.getscanTime
    },
  },
  watch: {
    stackQuestion() {
      this.previewScoreGroupIndex = 0
    },
  },
  methods: {
    ...mapActions('scanTimeConfig', ['tabChange']),
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
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
  },
}
</script>

<style scoped>
.main-2 {
  height: auto;
  background-color: #d5d7d7 !important;
  border: 1px solid rgb(136, 136, 136) !important;
  border-width: thin;
}

::v-deep .v-toolbar__content {
  padding: 4px 6px !important;
}
.v-list .v-list-item--active {
  background-color: white !important;
}

.add-btn {
  height: 1.5rem !important;
  align-content: left !important;
  font-size: 10px !important;
  min-width: 25px !important;
  padding: 0 8px !important;
  background: #d5d7d7;
  margin-left: auto;
  width: 100%;
  margin-top: 8px;
}
.view-btn {
  margin-bottom: 8px;
  height: 27px !important;
  min-width: 35px !important;
  padding: 0px 0px 0px 10px !important;
  /* Adjust spacing between buttons */
}
::v-deep .v-btn {
  justify-content: flex-start !important;
}
.after-go {
  background: green !important;
  color: white !important;
}

.scanned-ques {
  background: #d5d7d7 !important;
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
  color: black;
  background: rgb(255 255 255) !important;
}

.tooltip-option {
  padding: 4px 8px;
  transition: border-color 0.3s ease-in-out;
  margin-bottom: 0px !important;
}
.tooltip-option:hover {
  border-color: rgb(136, 136, 136);
}
.v-list-item--active .tooltip-option {
  border-color: blue;
}
.main-sidebar {
  height: 51.5%;
  padding-right: 0.5rem !important;
}

.current-ques {
  background: rgb(136, 136, 136) !important;
}

.arrow-right {
  width: 0;
  height: 18px;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 9px solid rgb(136, 136, 136) !important;
  margin-left: 10;
  position: absolute;
  right: -9px;
}

.v-toolbar {
  border-bottom: 2px solid #d5d7d7 !important;
  color: white !important;
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
  width: 35%;
}

.v-list {
  padding: 0px 0;
}

.sidebar_tabs {
  background: #d5d7d7;
  /* border-bottom: 1px solid #d5d7d7; */
  font-size: 12px;
  min-height: 20px;
  color: black !important;
  cursor: pointer;
  position: relative;
  border: 2px solid #3ec3e7;
  margin-left: 8px;
  margin-right: 8px;
  margin-bottom: 0.4rem;
}

.spacer {
  flex: 1;
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
    justify-content: flex-start;
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
  border-color: blue;
}
.v-list-item:not(:last-child) {
  margin-right: 8px;
}
.theme--light.v-list {
  background: #d5d7d7;
  color: rgba(0, 0, 0, 0.87);
}
.v-sheet.v-toolbar:not(.v-sheet--outlined) {
  box-shadow: none;
}

::v-deep .v-menu__content {
  background: #d5d7d7;
}

/* new style */

.button-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.view-btn {
  margin: 8px 8px 0px 8px;
  min-width: 40px;
  font-size: 1rem;
}
.text-2 .btn-4 {
  margin: 4px;
  font-size: 1rem;
}
.v-list {
  max-height: 800px;
  overflow-y: auto;
  min-width: 200px;
}
@media (max-width: 768px) {
  .button-container {
    flex-direction: column;
    align-items: flex-start;
  }
  .view-btn {
    width: 100%;
    font-size: 0.875rem;
  }
  .text-2 .btn-4 {
    width: 100%;
    font-size: 0.875rem;
  }
  .v-list {
    min-width: 150px;
    max-height: 150px;
  }
}

@media screen and (max-width: 1440px) and (max-height: 900px) {
  .flex-container {
    display: flex;
    justify-content: flex-end;
    width: 15%;
  }
}
@media (max-width: 480px) {
  .button-container {
    flex-direction: column;
    align-items: stretch;
  }
  .view-btn {
    width: 100%;
    font-size: 0.75rem;
  }
  .text-2 .btn-4 {
    width: 100%;
    font-size: 0.75rem;
  }
  .v-list {
    min-width: 120px;
    max-height: 120px;
  }
}

.v-tooltip__content {
  background: rgb(255 255 255) !important;
}
@media screen and (max-width: 1440px) and (max-height: 900px) {
  ::v-deep .text-2 .v-btn {
    padding: 0 7px;
  }

  .sidebar_tabs {
    font-size: 11px !important;
  }
}
</style>
