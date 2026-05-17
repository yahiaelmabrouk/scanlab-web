<template>
  <div class="main-sidebar">
    <v-card class="main-2" style="height: 100%">
      <div
        class="cont mt-1"
        style="background-color: #2f3d6e; margin-top: 0px !important; height: 50%; padding: 0px 10px"
      >
        <div class="toolbar-left">
          <p style="margin-bottom: 0px !important; color: white; display: flex; align-items: center; height: 100%">
            {{ this.questionSetBodyPartName }}
          </p>
        </div>
        <div class="toolbar-right">
          <b style="margin-left: 4px; color: white; display: flex; align-items: center; height: 100%">44:48</b>
        </div>
      </div>
      <div class="cont" style="height: 50%">
        <div class="cont">
          <button href="#" class="a-option">Exam</button>
          <button href="#" :class="['ml-6 a-option', { 'active-button': isEdit }]" @click="isEdit = !isEdit">
            Edit
          </button>
        </div>
        <div>
          <button href="#" class="a-option" style="height: 100%">End</button>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'

export default {
  mixins: [SelectionConfigMixin, ScanButtonMixin],
  data() {
    return {
      previewScoreGroupIndex: 0,
      isCurrentQuestion: 0,
      sharedData: '',
      isActive: 0,
      selectedAction: 'play',
      isEdit: false,
    }
  },
  computed: {
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'selectedStackQuestionIndexVisual',
      'scanSubmittedByStackQuestionId',
      'scanSubmitted',
      'currentBodyPartId',
      'questionSetBodyPartName',
    ]),
    ...mapGetters('user', ['vendorStylePreferenceOptions', 'languageCode']),
    ...mapState('selectionConfig', ['isAddLocalizerMode']),
  },
  watch: {
    stackQuestion() {
      this.previewScoreGroupIndex = 0
    },
    selectedStackQuestionIndexVisual(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.isActive = newVal - 1
        this.isCurrentQuestion = newVal - 1
      }
    },
  },
  methods: {
    ...mapActions('bodyService', ['getAllRegions']),
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
    moveTask(index) {
      let idx

      if (index === 1) {
        idx = this.isCurrentQuestion - 1
        this.isCurrentQuestion = idx
        this.isActive = idx
        this.$store.dispatch('questionService/jumpToQuestion', idx)
      } else {
        idx = this.isCurrentQuestion + 1
        this.isCurrentQuestion = idx
        this.isActive = idx
        this.$store.dispatch('questionService/jumpToQuestion', idx)
      }
    },
    ...mapActions('questionService', ['jumpToQuestion']),
    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),
    bodyParts() {
      return this.questionSetBodyPartName
    },
  },
  mounted() {
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
    })
  },
}
</script>

<style scoped>
.main-2 {
  height: 35%;
  background-color: #6875a2 !important;
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
  /* padding: 0.2rem !important; */
  height: 5%;
  /* padding-top: 6px; */
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
  color: #7a7bbf !important;
}
.v-sheet.v-card {
  border-radius: 0px;
  box-shadow: none !important;
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
.cont {
  display: flex;
  justify-content: space-between;
}
.a-option {
  color: black;
  padding: 0px 10px 0px 10px;
}
.active-button {
  color: white;
  background-color: #2f3d6e;
}
::v-deep .v-sheet.v-card:not(.v-sheet--outlined) {
  box-shadow: none !important;
}

.edit-part {
  display: flex;
  justify-content: flex-end;
  position: absolute;
  top: 53px;
  right: 232px;
  z-index: 1;

  .edit-content {
    background-color: #939ec7;
    width: 160px;
    box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #4b4b80; /* dark bottom-right bevel */
    font-size: 12px;
    color: #000;
    font-weight: bold;

    hr {
      margin: 0px;
      height: 2px;
      border: none;
      background: linear-gradient(to bottom, #333 50%, #ffffff 50%);
    }

    .edit-buttons {
      text-align: left;
      padding: 5px 0px 5px 0px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      .edit-button {
        margin: 5px 0px 5px 15px;
      }

      .edit-button:disabled {
        color: #525e8a;
        font-weight: normal;
        text-shadow: 0.5px 0.5px 0 #4b4b80, -1px -1px 0 #8f96c0;
      }
    }
  }
}
</style>
