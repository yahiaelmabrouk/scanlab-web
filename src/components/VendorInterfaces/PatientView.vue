<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="main-sidebar">
    <v-card class="main-2">
      <v-toolbar
        class="main-2-header-container"
        color="rgb(85 79 79)"
        height="35px"
        density="compact"
        style="padding-right: 0px !important; font-family: 'Arial', sans-serif"
      >
        <v-toolbar-title class="title-text">Patient View</v-toolbar-title>
        <v-spacer></v-spacer>
        <!-- Spacing for proper alignment -->

        <!-- Updated icons with proper size and spacing -->
        <span class="iso-text">ISO</span>
        <img src="@/assets/siemens_img/hidesource.png" class="icon-image" />
        <img src="@/assets/siemens_img/syringe.png" class="icon-image2" />
        <v-icon class="custom-icon1">mdi-play-pause</v-icon>
        <img src="@/assets/siemens_img/arrow_drop_down.png" class="icon-image1" />
        <v-icon class="custom-icon">mdi-plus</v-icon>
      </v-toolbar>

      <v-list v-model="selectedStackQuestionIndexVisual">
        <!-- #1 Localizer -->
        <v-list-item class="scanned-ques">
          #1 localizer

          <img src="@/assets/siemens_img/scannedicon.png" class="img-size" />
          <v-btn
            v-if="(isCTLab && isEditingQuestion && !isReconstructionQuestion) || (!isCTLab && !isAddLocalizerMode)"
            tile
            outlined
            class="add-btn"
            color="buttonBlue"
            :disabled="hasAnsweredAllStackQuestions || (isTakingTest && hasAddedLocalizer)"
            @click="setIsAddLocalizerMode(true)"
          >
            <v-icon small>mdi-plus</v-icon>
            {{ $t('MRI.add_localizer', languageCode) }}
          </v-btn>
          <v-btn
            tile
            outlined
            class="add-btn"
            color="error"
            v-if="isAddLocalizerMode && !isReconstructionQuestion"
            :disabled="hasAnsweredAllStackQuestions"
            @click="setIsAddLocalizerMode(false)"
          >
            {{ $t('MRI.add_localizer_cancel', languageCode) }}
          </v-btn>
        </v-list-item>
        <!-- <v-list-item v-if="stackQuestions.length == 0" class="current-ques" @click="handleClick(idx)">
          <div class="arrow-right"></div>
          #2
          <v-tooltip bottom content-class="custom-tooltip-offset">
            <template v-slot:activator="{ on, props }">
              <p class="mx-4 tooltip-option" v-bind="props" v-on="on">
                Prescribe a Scan
              </p>
            </template>
            <p class="tooltip-text">BRAIN: Prescribe a sagittal slice group for coverage through the entire brain with in-plane spatial resolution between 0.7-0.8 mm. an .</p>
          </v-tooltip>
        </v-list-item> -->
        <v-list-item v-if="stackQuestions.length == 0" class="current-ques" @click="handleClick(idx)">
          <div class="arrow-right"></div>
          #2 Prescribe a Scan
        </v-list-item>

        <!-- #2, #3, etc., for stack questions -->
        <v-list-item
          v-for="(stackQuestion, idx) of stackQuestions"
          :key="`${idx + 2}-step`"
          @click="handleClick(idx)"
          :class="{
            'current-ques': isCurrentQuestion === idx && !scanSubmittedByStackQuestionId[stackQuestion.id],
            'scanned-ques': scanSubmittedByStackQuestionId[stackQuestion.id],
            'after-go': sharedData && isActive === idx && !isCurrentQuestion,
          }"
        >
          <div
            v-if="isCurrentQuestion === idx && !scanSubmittedByStackQuestionId[stackQuestion.id]"
            class="arrow-right"
          ></div>
          #{{ idx + 2 }}
          <v-tooltip bottom>
            <template #activator="{ on, props }">
              <p class="mx-4 tooltip-option" v-bind="props" v-on="on">
                {{
                  stackQuestion.title
                    ? stackQuestion.title
                    : stackQuestion.questionText.split(' ').slice(0, 3).join(' ')
                }}
              </p>
            </template>
            <p class="tooltip-text">{{ stackQuestion.questionText }}</p>
          </v-tooltip>

          <div class="flex-container" v-if="scanSubmittedByStackQuestionId[stackQuestion.id]">
            <img src="@/assets/siemens_img/scannedicon.png" class="img-size" />
          </div>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import EventBus from '../../lib/event-bus'
import { ScanButtonMixin } from '../Mixins/ScanButtonMixin'
import { MriMixin } from '@/components/Mixins/MriMixin'

export default {
  mixins: [ScanButtonMixin, MriMixin],
  data() {
    return {
      previewScoreGroupIndex: 0,
      isCurrentQuestion: 0,
      sharedData: '',
      isActive: 0,
      shouldFade: false,
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

    imageStyle() {
      return this.shouldFade
        ? {
            filter: 'brightness(50%)', // Darkens the image
            opacity: '0.5', // Fades the image
            transition: 'opacity 0.3s ease', // Smooth fade transition
          }
        : {}
    },
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
    updateValueInMixin() {
      // Call the mixin method to update the data in the mixin
      this.openSubmitModal('newValue')
    },
    // CurrentQuestion(idx) {
    //   if (idx) {
    //     this.isCurrentQuestion = true
    //   }
    // },
    handleClick(idx) {
      this.isCurrentQuestion = idx
      this.isActive = idx
      this.jumpToStackQuestion(idx + 1)
    },
    ...mapActions('questionService', ['jumpToQuestion']),

    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),
  },
}
</script>

<style scoped>
.main-2 {
  height: 100%;
  background-color: black !important;
  border: 1px solid rgb(136, 136, 136) !important;
  border-width: thin;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}
.main-2 .main-2-header-container {
  position: sticky;
  top: 0;
  z-index: 1;
}
::v-deep .v-toolbar__content,
.v-toolbar__extension {
  padding-right: 0px !important;
}
::v-deep .v-list .v-list-item--active {
  background-color: white !important;
}
.icon-image {
  width: 16px;
  height: 16px;
  margin-bottom: 2px;
  margin-right: 2%;
  transform: rotate(-45deg);
  transition: transform 0.5s;
}
.icon-image2 {
  width: 18px;
  height: 18px;
  margin-bottom: 2px;
  margin-right: 2%;
  transform: rotate(85deg);
  transition: transform 0.5s;
}
.icon-image1 {
  width: 45px;
  height: 45px;
  margin-bottom: 2px;
}

.custom-tooltip-offset {
  transform: translateX(-70px);
}

.add-btn {
  height: 17px !important;
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
  text-align: left;
}

.main-sidebar {
  padding: 1rem;
  height: 51.5%;
  padding-right: 0.5rem !important;
  /* border-bottom: 2px solid white; */
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

::v-deep .v-toolbar {
  border-bottom: 2px solid black !important;
  color: white !important;
  padding-right: 16px;
}

::v-deep .v-sheet.v-card {
  border-radius: 0px;
}

.flex-container {
  display: flex;
  justify-content: flex-end;
  width: 52%;
}

::v-deep .v-list {
  padding: 0px 0;
}

::v-deep .v-list-item {
  background: rgb(74, 74, 74);
  border-bottom: 1px solid black;
  font-size: 12px;
  min-height: 20px;
  color: white !important;
}

.title-text {
  color: white; /* Adjusts the title color */
  font-size: 16px; /* Adjusted size for the title */
  font-weight: bold; /* Bold for title */
}

.custom-icon {
  color: white; /* Ensures icons are white */
  font-size: 25px; /* Adjusted size for better visibility */
  margin-right: 12px; /* Spacing between icons */
}
.custom-icon1 {
  color: white; /* Ensures icons are white */
  font-size: 20px; /* Adjusted size for better visibility */
}

.iso-text {
  color: white; /* Ensures the text is white */
  font-size: 19px; /* Adjusted size for visibility */
  margin-right: 4px; /* Spacing between ISO text and other icons */
}

.theme--light.v-btn.v-btn--has-bg {
  background-color: transparent !important;
}

.faded {
  opacity: 0.5; /* Adjust the opacity for fading */
  filter: brightness(50%); /* Darken the image */
  transition: all 0.3s ease; /* Smooth transition */
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .add-btn {
    height: 20px; /* Increase button height for better touch targets */
    font-size: 12px; /* Adjust font size for readability */
    min-width: 30px; /* Increase minimum width for better usability */
    padding: 0 10px; /* Adjust padding for larger touch targets */
  }

  .tooltip-text {
    width: 250px !important; /* Adjust width for medium screens */
  }

  .flex-container {
    width: 60%; /* Adjust width for better fit */
  }
}

@media (max-width: 768px) {
  .add-btn {
    height: 22px; /* Increase button height for better touch targets */
    font-size: 14px; /* Adjust font size for readability */
    min-width: 35px; /* Increase minimum width for better usability */
    padding: 0 12px; /* Adjust padding for larger touch targets */
  }

  .tooltip-text {
    width: 200px !important; /* Adjust width for smaller screens */
  }

  .main-sidebar {
    padding: 0.5rem; /* Reduce padding for smaller screens */
  }

  .flex-container {
    width: 70%; /* Adjust width for better fit */
  }
}

@media (max-width: 576px) {
  .add-btn {
    height: 24px; /* Increase button height for better touch targets */
    font-size: 16px; /* Adjust font size for readability */
    min-width: 40px; /* Increase minimum width for better usability */
    padding: 0 15px; /* Adjust padding for larger touch targets */
  }

  .tooltip-text {
    width: 150px !important; /* Adjust width for very small screens */
  }

  .flex-container {
    width: 80%; /* Adjust width for very small screens */
  }
}
</style>
