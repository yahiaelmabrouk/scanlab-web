<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="main-sidebar">
    <v-card class="main-2" style="padding: 1rem 1rem">
      <div class="p-detail-sidebar">
        <div>
          <span>Test</span>
        </div>
        <div style="display: flex; flex-direction: row; justify-content: end">
          <v-icon>mdi-human-male</v-icon>
          <v-icon>mdi-human-male</v-icon>
        </div>
      </div>
      <div class="p-detail-sidebar">
        <table style="text-align: left">
          <tr>
            <td>Registration ID:</td>
            <td><b>Test</b></td>
          </tr>
          <tr>
            <td>Date of Birth:</td>
            <td><b>01 Jan 1970</b></td>
          </tr>
          <tr>
            <td>Gender:</td>
            <td><b>Male</b></td>
          </tr>
        </table>
        <div style="display: flex; flex-direction: column; justify-content: center">
          <v-btn
            block
            outlined
            class="add-btn mb-2"
            dark
            :class="{ active: selectedAction === 'play', inactive: selectedAction !== 'play' }"
            @click="showPlay"
          >
            Play
            <v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
          <v-btn
            block
            outlined
            class="add-btn"
            :class="{ active: selectedAction === 'review', inactive: selectedAction !== 'review' }"
            @click="showReview"
          >
            Review
            <v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'

export default {
  mixins: [ScanButtonMixin],
  data() {
    return {
      previewScoreGroupIndex: 0,
      isCurrentQuestion: null,
      sharedData: '',
      isActive: null,
      selectedAction: 'play',
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
    // CurrentQuestion(idx) {
    //   if (idx) {
    //     this.isCurrentQuestion = true
    //   }
    // },
    showPlay() {
      this.selectedAction = 'play'
      this.$emit('action-selected', 'play')
    },
    showReview() {
      this.selectedAction = 'review'
      this.$emit('action-selected', 'review')
    },
    ...mapActions('questionService', ['jumpToQuestion']),

    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),
  },
}
</script>

<style scoped>
.main-2 {
  height: 35%;
  background-color: #d5d7d7 !important;
  border: 1px solid rgb(136, 136, 136) !important;
  border-width: thin;
}

td {
  padding-right: 10px;
}

.p-detail-sidebar {
  display: flex;
  justify-content: space-between;
}

.v-list .v-list-item--active {
  background-color: white !important;
}
.add-btn {
  height: 25px !important;
  align-content: right !important;
  font-size: 10px !important;
  min-width: 25px !important;
  padding: 0 8px !important;
  background: white;
  margin-left: auto;
}

.after-go {
  background: green !important;
  color: white !important;
}
.scanned-ques {
  background: rgb(37, 37, 37) !important;
  color: white !important;
}
.img-size {
  margin-left: auto;
  height: 1.25rem;
}
.tooltip-text {
  margin-bottom: 0px !important;
  font-size: 12px;
  width: 300px !important;
  color: white;
}
.tooltip-option {
  font-size: 12px;
  display: flex;
  width: 100%;
  margin-bottom: 0px !important;
}

.main-sidebar {
  /* padding: 1rem; */
  /* height: 51.5%; */
  padding-right: 0.5rem !important;
  padding-top: 6px;
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
  border-bottom: 2px solid black !important;
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
  background: rgb(74, 74, 74);
  border-bottom: 1px solid black;
  font-size: 12px;
  min-height: 20px;
  color: white !important;
}

@media only screen and (min-width: 600px) {
  .main-2 {
    height: auto;
  }
  .p-detail-sidebar {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .add-btn {
    width: 100%;
    margin-top: 8px;
  }
}

@media only screen and (min-width: 1200px) {
  .p-detail-sidebar {
    flex-direction: row;
    justify-content: space-between;
  }
  .add-btn {
    width: 48%;
    margin-top: 0;
  }
}
.active {
  background: #0485ff;
  width: 100%;
  color: #fff !important;
}
.inactive {
  background-color: #d5d7d7;
  width: 100%;
  color: black !important;
}
</style>
