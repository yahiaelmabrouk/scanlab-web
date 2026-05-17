<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="full-card">
    <v-tabs
      v-model="currentActiveTab"
      :show-arrows="false"
      v-if="softwareVersionPreference === 'xa' && !isSidebarExpanded"
      class="question-tab"
    >
      <header :class="`flex align-center ${isForCT ? '' : 'justify-content-between'}`">
        <h4 v-if="!isUltraLab || (isUltraLab && isTakingTest)" class="tab-1">
          <v-tab v-if="questionSet && !isEditingQuestion">{{ $t('global.question_criteria') }}</v-tab>
        </h4>
      </header>

      <v-tab-item v-if="questionSet && !isEditingQuestion && !isAddLocalizerMode" class="tab-1">
        <v-row cols="12" align="center" justify="space-between" class="criteria_area">
          <v-card
            class="small-card pt-2 pb-2 scan-view-options pa-3"
            :style="(isChallengeModeEnabledForMe || currentTestIsPreparedExam) ? { height: '70% !important' } : {}"
          >
            <v-card-title class="flex justify-space-between align-center">
              <h5 class="mb-0">
                {{ $t('global.question', languageCode) }}
                {{ selectedStackQuestionIndexVisual }}
                {{ $t('global.of', languageCode) }}
                {{ stackQuestionsLength }}
              </h5>
              <v-row justify="end" align="center" class="mr-1" v-if="stackQuestionsLength > 1">
                <div class="mr-2 cycle-question-button" @click="selectPrevQuestion">
                  <img
                    v-if="selectedStackQuestionIndexVisual <= 1"
                    src="@/assets/svg/back-button-disabled.svg"
                    class="icon-small"
                    alt="Previous"
                  />
                  <img v-else src="@/assets/svg/back-button.svg" class="icon-small" alt="Previous" />
                </div>
                <div class="cycle-question-button" @click="selectNextQuestion">
                  <img
                    v-if="selectedStackQuestionIndexVisual >= stackQuestionsLength"
                    src="@/assets/svg/forward-button-disabled.svg"
                    class="icon-small"
                    alt="Next"
                  />
                  <img v-else src="@/assets/svg/forward-button.svg" class="icon-small" alt="Next" />
                </div>
              </v-row>
            </v-card-title>

            <v-card-text
              class="pt-0 pl-0 question-content"
              :style="
                (isChallengeModeEnabledForMe || currentTestIsPreparedExam)
                  ? { minHeight: '80%', maxHeight: '80%' }
                  : {}
              "
            >
              <span v-if="stackQuestion.freebie" class="freebie">({{ $t('MRI.optional') }})</span>
              <TranslatedContent
                type="stackQuestion"
                :record="stackQuestion"
                :lookup="{ type: 'nestedKey', path: 'questionText' }"
              />
            </v-card-text>
          </v-card>

          <v-card class="small-card pt-2 pb-2 scan-view-options pa-3">
            <v-card-title>
              <h5 class="mb-0">{{ $t('global.answer_criteria') }}</h5>
            </v-card-title>

            <div class="d-flex flex-column align-start" style="height: 80%">
              <v-col class="flex">
                <v-select
                  outlined
                  hide-details
                  v-model="answerSelectionIdComputed"
                  :items="answersSelections"
                  :disabled="scanSubmitted"
                  :class="answerSelectionsHasUnseenChoice ? 'attention-outline' : ''"
                  @click="onLookedAtAnswerSelections()"
                >
                  <template #item="{ item }">
                    <TranslatedContent
                      type="stackQuestion"
                      :record="stackQuestion"
                      :lookup="{
                        type: 'objectInArray',
                        arrayPath: 'answers',
                        identityKey: 'id',
                        identityValue: item.value,
                        objectKey: 'name',
                      }"
                    />
                  </template>
                  <template #selection="{ item }">
                    <TranslatedContent
                      type="stackQuestion"
                      :record="stackQuestion"
                      :lookup="{
                        type: 'objectInArray',
                        arrayPath: 'answers',
                        identityKey: 'id',
                        identityValue: item.value,
                        objectKey: 'name',
                      }"
                    />
                  </template>
                </v-select>
              </v-col>

              <v-card-text class="pt-0 answer-content">
                <v-row class="pt-0 truncated-field pl-2 pr-2 pb-2">
                  <TranslatedContent
                    type="stackQuestion"
                    v-if="!(isChallengeModeEnabledForMe || currentTestIsPreparedExam)"
                    :record="stackQuestion"
                    :lookup="{
                      type: 'objectInArray',
                      arrayPath: 'answers',
                      identityKey: 'id',
                      identityValue: answerCurrent.id,
                      objectKey: 'criteria',
                    }"
                  />
                </v-row>
                <v-row
                  class="pt-0 truncated-strong d-flex flex-wrap pl-2 pr-2 pb-16"
                  v-if="answerCurrent.citation && answerCurrent.citation.length > 0"
                >
                  <strong class="mb-0 flex-grow-1">
                    <TranslatedContent
                      v-if="!(isChallengeModeEnabledForMe || currentTestIsPreparedExam)"
                      type="stackQuestion"
                      :record="stackQuestion"
                      :lookup="{
                        type: 'objectInArray',
                        arrayPath: 'answers',
                        identityKey: 'id',
                        identityValue: answerCurrent.id,
                        objectKey: 'citation',
                      }"
                    />
                  </strong>
                </v-row>
              </v-card-text>
            </div>
          </v-card>
        </v-row>
      </v-tab-item>
    </v-tabs>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import AlarmIcon from 'icons/Alarm'
import { mapState, mapActions, mapGetters } from 'vuex'
import { MriMixin } from '../Mixins/MriMixin'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin'
import SpinButton from './SpinButton.vue'
import TranslatedContent from '@/components/TranslatedContent'
import config from '../../config'

const { isCTLab } = config

export default {
  //mixins: [MriMixin, SelectionConfigMixin],
  mixins: [MriMixin],
  name: 'FourthCom',
  components: {
    // eslint-disable-next-line vue/no-unused-components
    AlarmIcon,
    // eslint-disable-next-line vue/no-unused-components
    SpinButton,
    TranslatedContent,
  },
  props: {
    /*
    childData: {
      type: Object,
      required: true,
    },
    */
    selectionIdent: {
      type: String,
      required: true,
    },
    /*
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
    */
    paramHints: {
      type: Array,
      required: false,
      default: () => [],
    },
    /*
    useInitialUltraLabDefaults: {
      type: Boolean,
      required: false,
      default: true,
    },
    */
    sequenceType: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isForCT: isCTLab,
    }
  },
  computed: {
    ...mapState('selectionConfig', [
      'selectionConfigsByIdent',
      'isFullscreen',
      'isAddLocalizerMode',
      'toolSelected',
      'toolSelectedConfig',
      'showReferenceLines',
      'referenceSliceCornersBySliceViewId',
      'hasAddedLocalizer',
    ]),
    ...mapState('questionService', ['activeTab']),
    ...mapGetters('user', ['softwareVendorPreference', 'softwareVersionPreference']),
    ...mapGetters('testRunService', ['currentTestIsPreparedExam']),
    currentActiveTab: {
      get() {
        return this.activeTab
      },
      set(val) {
        this.setActiveTab(val)
      },
    },
    isSidebarExpanded() {
      return this.$store.getters.isSidebarExpanded
    },
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
  },
  mounted() {
    //console.log('isChallengeModeEnabledForMe==', this.isChallengeModeEnabledForMe)
    //console.log('currentTestIsPreparedExam==', this.currentTestIsPreparedExam)
  },
}
</script>

<style scoped lang="scss">
.attention-outline {
  outline: #ff9d2f solid 3px;
}
::v-deep .v-application .primary--text,
::v-deep .v-list-item.primary--text {
  color: #ffffff !important;
}
.v-tab--active {
  color: white !important;
}
/* dropdown background style */
.theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}
.theme--light.v-list {
  background: #565656;
  color: rgb(0 0 0 / 87%);
}
.theme--light.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: rgb(255 255 255 / 87%);
}
.theme--light.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: rgb(255 255 255 / 87%);
}
::v-deep .v-application .primary--text {
  color: #ffffff !important;
  caret-color: #ffffff !important;
}
::v-deep .v-list-item__title {
  color: #ffffff !important;
}
::v-deep .v-list-item--link:before {
  background-color: lightgray !important;
}
.active-list-item {
  background-color: darkgray;
}

/* Parent div ko select karo jisme scrollbar hoga */
::v-deep .v-select .v-list {
  max-height: 150px; /* Yeh ensure karega ki scrollbar visible ho */
  overflow-y: auto; /* Scrollbar visible karne ke liye */
}

/* Scrollbar ke styling */
::v-deep .v-select .v-list::-webkit-scrollbar {
  width: 10px; /* Scrollbar width */
}

/* Scrollbar track background */
::v-deep .v-select .v-list::-webkit-scrollbar-track {
  background: #f1f1f1; /* Track ka color */
}

/* Scrollbar thumb styling (scrollable part) */
::v-deep .v-select .v-list::-webkit-scrollbar-thumb {
  background-color: #888; /* Thumb ka color */
  border-radius: 10px; /* Rounded edges for thumb */
}

/* Hover effect for scrollbar thumb */
::v-deep .v-select .v-list::-webkit-scrollbar-thumb:hover {
  background-color: #555; /* Thumb color on hover */
}
::v-deep .v-list-item {
  color: #ffffff !important; /* Saare list items ko white karne ke liye */
}

::v-deep .v-list-item--active {
  color: #ffffff !important; /* Active item ko bhi white karne ke liye */
}
/* dropdown background style */
.scan {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  background: black !important;
  border: 1px solid #5a5252 !important;
  border-right: none !important;
  border-bottom: none !important;
  border-top: none !important;
}

.theme--light.v-card .v-card__subtitle,
.theme--light.v-card > .v-card__text {
  color: #ffffff !important;
  position: relative !important;
  text-align: justify !important;
  padding: 2% 5%;
}
.full-card {
  width: 33.44%;
  background: #2e2c2c !important;
  border: 1px solid #5a5252 !important;
  border-right: none !important;
  border-bottom: none !important;
  border-top: none !important;
}
.question-tab {
  position: relative;
  top: -7.5%;
  height: 107.5%;
}
.v-sheet.v-card {
  border-radius: 0px;
}

.text-3 {
  display: flex;
  justify-content: flex-start;
}

.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

.material-design-icon {
  color: white;
}
.resolution-label {
  margin-bottom: 0px !important;
  font-size: 15px;
  color: white;
  margin-top: 2%;
}

/* Header styling */
.header-gradient-region {
  border: 0;
}

.scan-view-options {
  flex-grow: 1;

  header {
    font-weight: bold;
  }
}

/* Card styles for test questions */
.test-question-1 {
  width: 33%; /* Adjusted for small card layout */
  min-height: 170px;
  text-align: left;
  margin-right: 30px;

  &:first-child {
    width: 3%;
  }

  &:last-child {
    margin-right: 0;
  }
}

/* Area for criteria */
.criteria_area {
  margin-top: -5px;
}

/* Freebie styling */
.freebie {
  color: red;
  font-size: 1.2rem;
  font-weight: bold;
  margin-right: 0.2rem;
}

.cycle-question-button {
  cursor: pointer;
  font-size: 22px;
  user-select: none;
}
.v-btn {
  font-size: 11px !important;
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
}

::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
  text-align: justify !important;
  padding: 2% 5%;
}

::v-deep .theme--light.v-input input {
  color: white !important;
  font-size: small !important;
  text-align: right !important;
}

.text-input {
  max-width: 38%;
  width: 38%;
  margin-left: 2%;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
}

.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
  margin-right: 5px;
}

::v-deep .v-text-field__details {
  display: none;
}

[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

.v-input--is-focused {
  display: block !important;
}

.text-2 {
  display: flex;
  justify-content: flex-start;
}

.text-1 {
  display: flex;
  justify-content: space-between;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}

.text-3 {
  display: flex;
  justify-content: flex-start;
  padding: 6px;
}

::v-deep .v-input__icon {
  height: 10px !important;
}

::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-text-field.v-text-field--enclosed .v-text-field__details {
  margin-bottom: 0px;
}

::v-deep .v-text-field {
  padding-top: 0px !important;
  margin-top: 0px !important;
}

::v-deep .v-text-field__slot {
  background: #383535;
  border-color: #383535;
  border-radius: 0px;
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
  border-radius: 4px;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0px;
}

::v-deep .v-icon.v-icon {
  color: white !important;
  font-size: 17px;
}

::v-deep .v-input {
  max-width: 100%;
  border-radius: 0px;
}

::v-deep .v-text-field input {
  padding: 0px;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 5px !important;
  right: 3px;
  top: 0px !important;
  left: 3px;
}

.main-1 {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.main-2 {
  width: 70%;
  color: white !important;
  margin-top: 4%;
}

/* Responsive Styles */

/* Mobile Devices (Portrait and Landscape) */
@media (max-width: 767px) {
  .scan {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .text-input {
    max-width: 90%;
    width: 90%;
    margin-left: 0%;
    height: 1.2rem !important;
  }

  .label-size {
    width: 100%;
    justify-content: center;
    margin-right: 0;
  }

  .v-btn {
    font-size: 9px !important;
  }

  .main-1 {
    flex-direction: column;
  }

  .main-2 {
    width: 90%;
    margin-top: 2%;
  }

  .v-input {
    max-width: 90%;
  }

  .text-1,
  .text-2,
  .text-3 {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Tablets and Small Desktops */
@media (min-width: 768px) and (max-width: 1024px) {
  .scan {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .text-input {
    max-width: 45%;
    width: 45%;
    margin-left: 2%;
    height: 1.2rem !important;
  }

  .label-size {
    width: 45%;
    margin-right: 5px;
  }

  .v-btn {
    font-size: 10px !important;
  }

  .main-1 {
    flex-direction: row;
  }

  .main-2 {
    width: 80%;
    margin-top: 3%;
  }

  .v-input {
    max-width: 45%;
  }

  .text-1,
  .text-2,
  .text-3 {
    flex-direction: row;
  }
}

/* Large Desktops and Bigger Screens */
@media (min-width: 1025px) {
  .scan {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .text-input {
    max-width: 38%;
    width: 38%;
  }

  .label-size {
    width: 40%;
    margin-right: 5px;
  }

  .v-btn {
    font-size: 11px !important;
  }

  .main-1 {
    flex-direction: row;
  }

  .main-2 {
    width: 70%;
    margin-top: 4%;
  }

  ::v-deep .v-input {
    max-width: 100%;
  }
  ::v-deep .v-card__text {
    height: 100% !important;
    position: relative !important;
    top: 0px !important;
    bottom: 0 !important;
    text-align: justify !important;
    padding: 2% 5%;
  }

  .text-1,
  .text-2,
  .text-3 {
    flex-direction: row;
  }
}
@media (min-width: 1706.67px) {
  ::v-deep .v-card__text {
    padding: 0% 5%;
  }
}
test-question-1:first-child {
  width: 100%;
}
.icon-small {
  width: 20px; /* Adjust size as needed */
  height: 20px; /* Adjust size as needed */
}
.cycle-question-button {
  cursor: pointer;
}
.question-card,
.answer-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.question-card h5,
.answer-card h5 {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.question-card .question-nav,
.answer-card .question-nav {
  display: flex;
  justify-content: flex-end;
}

.question-card .freebie {
  font-size: 12px;
  color: #f4511e;
}

.v-card-title {
  font-size: 14px;
  font-weight: 500;
  padding: 0 8px;
}

.v-card-text {
  font-size: 13px;
  padding: 8px 8px 0;
  line-height: 1.4;
}
.pa-3 {
  padding: 7% !important;
}

.pb-16,
.pt-2,
.pb-2 {
  padding-top: 0px !important;
  padding-bottom: 0px !important;
}

.pt-1 {
  padding-top: 4px !important;
}

.mdi-chevron-left,
.mdi-chevron-right {
  font-size: 20px;
  cursor: pointer;
}

.cycle-question-button img {
  width: 20px;
  height: 20px;
}

.truncated-field {
  height: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0px;
  padding: 0px !important;
}

.truncated-strong {
  margin: 0px;
  padding: 0px !important;
}

.question-content {
  padding-right: 5px !important;
  min-height: 90px;
  max-height: 90px;
  overflow-y: auto;
}

.answer-content {
  padding-left: 0px;
  padding-right: 5px !important;
  overflow-y: auto;
  overflow-x: clip;
}

::v-deep .theme--light.v-tabs > .v-tabs-bar {
  background-color: #000000 !important;
  color: white !important;
  height: 6%;
}
::v-deep .theme--light.v-card {
  background-color: #2e2c2c;
  color: rgba(255, 255, 255, 0.87);
}

/* UPDATED BY ME*/
::v-deep .v-tabs {
  height: 100% !important;
}

::v-deep .theme--light.v-tabs-items {
  height: 100% !important;
}

::v-deep .v-window__container {
  height: 100%;
}

::v-deep .tab-1 {
  height: 100% !important;
}
::v-deep .theme--light.v-card:nth-of-type(1) {
  height: 40% !important;
}

::v-deep .theme--light.v-card:nth-of-type(2) {
  height: 60% !important;
}

::v-deep .theme--light.v-card:nth-of-type(2) .v-card__title {
  padding-bottom: 0px !important;
}
/* END */
</style>
