<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="main-sidebar">
    <v-card class="main-2">
      <div class="button-container">
        <v-btn tile outlined class="add-btn" color="buttonBlue" @click="setIsAddLocalizerMode(true)">
          <b>Test</b>
        </v-btn>
        <div class="text-2" style="margin: 1.5rem 1rem 0 1.3rem">
          <v-select
            v-model="selectedValue"
            :items="language"
            :disabled="isAddLocalizerMode"
            dense
            outlined
            style="margin-left: 0.5rem"
            @change="handleSelectionChange"
          ></v-select>
        </div>
      </div>
      <div class="button-container">
        <textarea
          class="flex-item"
          placeholder="Type something..."
          style="border: 1px solid #ccc; margin-left: 0.6rem; width: 14rem"
        ></textarea>
        <v-btn
          class="view-btn"
          color="#D5d7d7"
          style="margin: 0.5rem 1rem 0 0.4rem; width: 7rem"
          @click="handleButtonClick"
          >AutoView</v-btn
        >
      </div>
      <div class="button-container" style="padding: 0 1rem 0 0.4rem">
        <div style="display: flex">
          <v-icon left>mdi-view-list</v-icon>
          <span>
            <b>BRAIN</b>
          </span>
        </div>
        <div>
          <v-icon>mdi-signal-cellular-2</v-icon>
        </div>
      </div>
      <div class="button-container">
        <div style="border: 1px solid #ccc; margin-left: 0.5rem; width: 60%">
          <input type="text" value="00:34:15" style="width: 100%" />
        </div>
        <span style="margin: 0.5rem 1rem 0 0">SED: 0.0 KJ/Kg</span>
      </div>

      <div class="button-container">
        <div style="border: 1px solid #ccc; margin-left: 0.5rem; width: 60%">
          <input type="text" style="width: 100%" />
        </div>
        <span style="margin: 0.5rem 1rem 0 0">
          SAR <br />
          PNS
        </span>
      </div>
      <div class="button-container2">
        <ScanButton
          :freebie="stackQuestion && stackQuestion.freebie"
          style="width: 100%; margin-left: 3%; margin-right: 3%"
        />
        <!-- <v-btn block color="error" style="min-width: 0% !important; display: flow-root !important"> Stop Scan </v-btn> -->
      </div>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import ScanButton from '../../ScanButton.vue'
export default {
  mixins: [ScanButtonMixin],
  components: { ScanButton },
  data() {
    return {
      previewScoreGroupIndex: 0,
      isCurrentQuestion: null,
      sharedData: '',
      isActive: null,
      selectedValue: 'English',
      language: ['English', 'Spenish'],
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
      // Implement logic to switch to grid view
    },
    switchToListViewOption1() {
      // Implement logic for list view option 1
    },
    switchToListViewOption2() {
      // Implement logic for list view option 2
    },
    handleClick() {
      // Implement the logic for handling the click event
      console.log('Button clicked!')
    },
    ...mapActions('questionService', ['jumpToQuestion']),

    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),

    handleSelectionChange(selectedOption) {
      this.selectedValue = selectedOption
    },
  },
}
</script>

<style scoped>
.main-2 {
  height: 100%;
  background-color: #d5d7d7 !important;
  border: 1px solid rgb(136, 136, 136) !important;
  border-width: thin;
}

.v-list .v-list-item--active {
  background-color: white !important;
}

@media screen and (max-width: 1600px) and (max-height: 900px) {
  .text-2 {
    margin: 1.5rem 1rem 0 0 !important; /* Example: Modify margins */
  }
  .add-btn {
    width: 45% !important;
  }
}

.add-btn {
  height: 1.85rem !important;
  align-content: left !important;
  font-size: 10px !important;
  min-width: 25px !important;
  padding: 0 8px !important;
  background: #d5d7d7;
  margin-left: 1rem;
  width: 52%;
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
}

.tooltip-option {
  font-size: 12px;
  display: flex;
  width: 100%;
  margin-bottom: 0px !important;
}

.main-sidebar {
  /* padding: 1rem; */
  height: 39.5%;
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

.v-list-item {
  background: #d5d7d7;
  border-bottom: 1px solid #d5d7d7;
  font-size: 12px;
  min-height: 20px;
  color: black !important;
}

.button-container {
  display: flex;
  flex-direction: column;
}
.button-container2 {
  display: flex;
  justify-content: space-around;
}

.view-btn {
  margin-right: 8px;
  height: 27px !important;
  min-width: 35px !important;
  padding: 0px 0px 0px 10px !important;
  /* Adjust spacing between buttons */
}

.spacer {
  flex: 1;
}
.flex-item {
  margin-right: 8px; /* Adjust spacing between textarea and button */
}
.lang {
  margin: 0.5rem 1rem 0 4rem;
}
@media only screen and (min-width: 600px) and (max-width: 1199px) {
  .button-container {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .text-2 {
    margin-left: 1rem;
    margin-top: 0;
  }
  .btn-4 {
    height: 20px !important;
  }
  .lang {
    margin: 0.5rem 1rem 0 0rem;
  }
}

@media only screen and (min-width: 1200px) {
  .button-container {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .text-2 {
    margin-left: 1rem;
    margin-top: 0;
  }
  .btn-4 {
    height: 30px !important;
  }
  .lang {
    margin: 0.5rem 1rem 0 0rem;
  }
}
::v-deep .v-btn__content {
  justify-content: center !important;
}
.v-btn {
  margin: 0 10px;
}
</style>
