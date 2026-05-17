<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card class="left-section">
    <div class="left-sub-section-1">
      <div>
        <v-btn><img src="@/assets/B19_icons/injection.png" height="40px" /></v-btn>
      </div>

      <v-btn-toggle>
        <v-btn>Scan</v-btn>
        <ScanButton :freebie="stackQuestion && stackQuestion.freebie" class="mr-1" />
        <v-btn>Cancel</v-btn>
      </v-btn-toggle>
    </div>
    <div>
      <v-list v-model="selectedStackQuestionIndexVisual">
        <v-list-item class="scanned-ques"
          >localizer
          <img class="mx-5" src="@/assets/B19_icons/scannedb19.png" height="15px" />

          <v-btn
            v-if="!isAddLocalizerMode"
            tile
            outlined
            class="add-btn"
            color="buttonBlue"
            @click="setIsAddLocalizerMode(true)"
          >
            <v-icon small>mdi-plus</v-icon>
            {{ $t('MRI.add_localizer', languageCode) }}
          </v-btn>
          <v-btn tile outlined class="add-btn" color="error" v-else @click="setIsAddLocalizerMode(false)">
            {{ $t('MRI.add_localizer_cancel', languageCode) }}
          </v-btn>
        </v-list-item>
        <v-list-item class="current-ques" v-if="stackQuestions.length === 0" @click="">
          <div class="arrow-right"></div>
          <span class="index-cls">1</span>
          <img class="mx-3" src="@/assets/B19_icons/unscannedb19img.png" height="15px" />
          <p class="mx-4 tooltip-option">DICOM: Prescribe a Scan</p>
        </v-list-item>
        <v-list-item
          @change="jumpToStackQuestion(idx + 1)"
          :class="{
            'current-ques': isCurrentQuestion === idx && !scanSubmittedByStackQuestionId[stackQuestion.id],
            'scanned-ques': scanSubmittedByStackQuestionId[stackQuestion.id],
            'after-scan': sharedData && isActive === idx && !isCurrentQuestion,
          }"
          @click="
            isCurrentQuestion = idx
            isActive = idx
          "
          v-for="(stackQuestion, idx) of stackQuestions"
          :step="idx + 1"
          :key="`${idx}-step`"
        >
          <div
            v-if="isCurrentQuestion === idx && !scanSubmittedByStackQuestionId[stackQuestion.id]"
            class="arrow-right"
          ></div>

          <span
            :class="isCurrentQuestion === idx && !scanSubmittedByStackQuestionId[stackQuestion.id] ? 'index-cls' : ''"
            >{{ idx + 1 }}</span
          >
          <img
            v-if="!scanSubmittedByStackQuestionId[stackQuestion.id]"
            class="mx-3"
            src="@/assets/B19_icons/unscannedb19img.png"
            height="15px"
          />
          <v-tooltip bottom>
            <template v-slot:activator="{ on, props }">
              <p class="mx-4 tooltip-option" v-bind="props" v-on="on">
                {{ stackQuestion.questionText.split(' ').slice(0, 3).join(' ') }}
              </p>
            </template>
            <p class="tooltip-text">{{ stackQuestion.questionText }}</p>
          </v-tooltip>
          <div class="flex-container">
            <img
              class="mx-5"
              v-if="scanSubmittedByStackQuestionId[stackQuestion.id]"
              src="@/assets/B19_icons/scannedb19.png"
              height="15px"
            />
          </div>
        </v-list-item>
      </v-list>
    </div>
    <div class="left-sub-section-2">
      <div>
        <v-icon>mdi-delete</v-icon>
      </div>
      <v-btn-toggle>
        <v-btn>Stop</v-btn>
        <v-btn>Continue</v-btn>
        <v-btn
          :color="freebie && !isEditingQuestion ? 'accent' : ' #c0c0c0 '"
          :class="{
            'pt-0 pb-0': small,
            'btn-2 ': true,
          }"
          @click="skipQuestion()"
          >Skip
        </v-btn>
      </v-btn-toggle>
    </div>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import ScanButton from '../../ScanButton.vue'
export default {
  name: 'BquestionArea',
  mixins: [ScanButtonMixin],
  data() {
    return {
      previewScoreGroupIndex: 0,
      isCurrentQuestion: 0,
      sharedData: '',
      isActive: 0,
    }
  },
  components: { ScanButton },
  mounted() {
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
    })
  },
  props: {
    freebie: Boolean,
    small: Boolean,
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
    ...mapState('questionService', ['isViewingCriticalThinkingQuestion', 'isEditingQuestion', 'isSelectedTab']),
  },
  watch: {
    stackQuestion() {
      this.previewScoreGroupIndex = 0
    },
    selectedStackQuestionIndexVisual(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('newVal', newVal)
        this.isActive = newVal - 1
        this.isCurrentQuestion = newVal - 1
      }
    },
  },
  methods: {
    jumpToStackQuestion(idx) {
      this.$store.dispatch('questionService/jumpToQuestion', idx - 1)
    },
    ...mapActions('questionService', ['questionTabOpen']),
    updateValueInMixin() {
      // Call the mixin method to update the data in the mixin
      this.openSubmitModal('newValue')
    },

    ...mapActions('questionService', ['jumpToQuestion']),
    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),
    ...mapActions('questionService', ['proceedToTakingPostQuestions']),
  },
}
</script>

<style scoped>
.left-section {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2px;
  border-radius: 0px !important;
  background: black !important;
}
.current-ques {
  border: 1px solid white;
  border-left: 0px !important;
}
.btn-2 {
  background: #c0c0c0 !important;
  margin-bottom: 0.25rem;
  text-transform: capitalize !important;
  margin-right: 0.25rem !important;
  border-radius: 0px !important;
  height: 30px !important;
  min-width: 53px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
  border-width: thin !important;
}
.after-scan {
  background: white !important;
}
.index-cls {
  background: black !important;
  color: white;
  width: 5%;
  height: 40px;
  align-content: center;
}
.scanned-ques {
  background: rgb(128, 128, 128) !important;
}
.arrow-right {
  width: 0;
  height: 40px;
  border: 1px solid white !important;
  border-left: 23px solid rgb(192, 192, 192) !important;
  margin-left: 10;
  position: absolute;
  right: -17px;
}
.v-btn {
  background: #c0c0c0 !important;
  margin-bottom: 0.1rem;
  text-transform: capitalize !important;
  margin-right: 0.1rem !important;
  margin-top: 10px;
  margin-bottom: 0px;
  border-radius: 0px !important;
  height: 20px !important;
  min-width: 87px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
  border-width: thin !important;
  font-size: 0.7rem;
}
.add-btn {
  height: 20px !important;
  align-content: right !important;
  font-size: 10px !important;
  min-width: 25px !important;
  padding: 0 8px !important;
  background: white !important;
  margin-left: auto;
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
.v-list {
  padding: 0px 0;
  margin: 1rem;
  margin-top: 0rem;
  margin-right: 0.5rem;
}
.v-list-item {
  background: rgb(192, 192, 192);
  padding: 0 0px;
  font-size: 12px;
  min-height: 40px;
  color: black !important;
  text-transform: uppercase;
}
.v-btn-toggle:not(.v-btn-toggle--group) {
  background: black !important;
}
.v-icon.v-icon {
  color: white;
}

.left-sub-section-1 {
  display: flex;
  justify-content: space-between;
}
.left-sub-section-2 {
  display: flex;
  justify-content: space-between;
  height: 100%;
  align-items: flex-end;
}
::v-deep .theme--light.v-btn-toggle:not(.v-btn-toggle--group) .v-btn.v-btn {
  border-color: none !important;
}
/* Responsive design */
/* @media (max-width: 2048px) {
  .left-section {
  height: 122%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2px;
  border-radius: 0px !important;
  background: black !important;
}
}
@media (min-width:1921px) and (max-width: 2304px) {
  .left-section {
  height: 122%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2px;
  border-radius: 0px !important;
  background: black !important;
}
}
@media (max-width: 1920px) {
  .left-section {
    height: 126%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2px;
  border-radius: 0px !important;
  background: black !important;
}
}
@media (max-width: 1706.67px) {
  .left-section {
    height: 144%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2px;
  border-radius: 0px !important;
  background: black !important;
}
}
@media (max-width: 1536px) {
  .left-section {
    height: 140%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2px;
  border-radius: 0px !important;
  background: black !important;
}
}

@media (max-width: 1492px) {
  .left-section {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2px;
  border-radius: 0px !important;
  background: black !important;
}
} */
@media (min-width: 1400px) and (max-width: 1536px) {
  .left-section {
    height: 100%;
  }
}
@media (min-width: 1536px) and (max-width: 2490px) {
  .left-section {
    height: 100%;
  }
}

@media (max-width: 1228.8px) {
  .left-section {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 2px;
    border-radius: 0px !important;
    background: black !important;
  }
}

@media (max-width: 1200px) {
  .left-section {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 2px;
    border-radius: 0px !important;
    background: black !important;
  }
}
@media (max-width: 768px) {
  .left-section {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 2px;
    border-radius: 0px !important;
    background: black !important;
  }
}

@media (max-width: 480px) {
  .left-section {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 2px;
    border-radius: 0px !important;
    background: black !important;
  }
}
</style>
