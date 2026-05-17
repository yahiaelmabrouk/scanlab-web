<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-dialog v-model="showConfirmDialog" persistent width="700px">
      <v-card class="change-dialog">
        <v-card-title class="headline">
          {{ $t('global.notification', languageCode) }}
        </v-card-title>

        <v-card-text>
          <div class="mb-4">{{ $t('SelectionConfigForm.your_last_change', languageCode) }}</div>

          <!-- Changes grouped by source parameter -->
          <div class="changes-container">
            <div v-for="(group, sourceParam) in groupedChanges" :key="sourceParam" class="change-group">
              <div class="change-group-title">{{ sourceParam }}</div>

              <!-- Source parameter change -->
              <div v-if="group.sourceChange.oldValue !== group.sourceChange.newValue" class="change-row">
                <span class="old-value">{{ formatValue(group.sourceChange.oldValue) }}</span>
                <v-icon small class="mx-2" color="black">mdi-arrow-right</v-icon>
                <span class="new-value">{{ formatValue(group.sourceChange.newValue) }}</span>
              </div>

              <!-- Affected parameter changes -->
              <div v-for="(affected, idx) in group.affectedChanges" :key="idx" class="affected-change">
                <div class="affected-label">Will update {{ affected.label }}:</div>
                <div class="change-row">
                  <span class="old-value">{{ formatValue(affected.oldValue) }}</span>
                  <v-icon small class="mx-2" color="black">mdi-arrow-right</v-icon>
                  <span class="new-value">{{ formatValue(affected.newValue) }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="cancelChange">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="success" @click="confirmChange" :class="{ 'active-confirm-button': isDialogKeyboardReady }">
            {{ $t('global.okay', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-card-text>
      <div class="main-1">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">1stSignal/Mode</label>
            <v-select
              v-model="signalMode"
              :items="signalModeOptions"
              color="#423c3c"
              dense
              outlined
              style="width: 50px; margin-left: 2%"
            ></v-select>
          </div>
          <div class="text-1">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.repetitionTime, 'inactive-label': !activeInputs.repetitionTime }"
            >
              TR
            </label>
            <div class="text-input">
              <SpinButton
                @input="changeRepetitionTime"
                :type="'number'"
                :value="repetitionTime"
                :step="1"
                :min="selectionConfig.sequenceType !== 'DIFF' ? 1 : minConcatAcqPackage"
                :max="20000"
                :disabled="complete || isAddLocalizerMode"
              />
            </div>
            <span class="mx-2">ms</span>
          </div>
        </div>

        <div class="main-2">
          <div class="text-1 con-m">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.concatenations, 'inactive-label': !activeInputs.concatenations }"
            >
              Concatenations
            </label>
            <div class="text-input">
              <SpinButton
                @input="changeConcatenations"
                :type="'number'"
                :value="concatenations"
                :step="1"
                :min="1"
                :max="10"
                :disabled="complete || selectionConfig.sequenceType === 'DIFF'"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="d-flex justify-end mt-2">
        <!-- <v-col cols="3" v-if="!isTakingTest">
          <div class="text-left text-white">
            <label>SNR Average</label>
            <div class="d-flex align-items-center">
              <b-form-input
                :type="'text'"
                :value="selectionConfig.snr !== null ? selectionConfig.snr.toFixed(2) : '---'"
                disabled
                class="input-number"
                style="flex: 1; min-width: 4em"
              />
              <div class="d-flex flex-column ml-2">
                <v-btn
                  icon
                  small
                  class="snr-icon-btn"
                  @click="fetchSignalAverage"
                  :disabled="isFetchingSignalAverage"
                  title="Refresh SNR average"
                >
                  <v-icon small color="white" style="color: white !important">{{
                    isFetchingSignalAverage ? 'mdi-loading mdi-spin' : 'mdi-refresh'
                  }}</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  class="snr-icon-btn"
                  @click="saveSNR"
                  :disabled="selectionConfig.snr === null"
                  title="Save current SNR for comparison"
                >
                  <v-icon small color="white" style="color: white !important">mdi-content-save</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-col>
        <v-col cols="3" v-if="!isTakingTest">
          <div class="text-left text-white mr-7">
            <label>Saved SNR</label>
            <div class="d-flex align-items-center mt-2">
              <b-form-input
                :type="'text'"
                :value="savedSnr !== null ? savedSnr.toFixed(2) : '---'"
                disabled
                class="input-number"
                style="flex: 1"
              />
            </div>
          </div>
        </v-col> -->
        <v-col class="disabled-div" style="margin-left: auto; margin-right: 20px">
          <div class="text-3 minTeCon input-group">
            <label class="label-size">Min.TR/Conc</label>
            <div class="text-input">
              <SpinButton
                :type="'number'"
                :step="1"
                :min="1"
                :max="500"
                :value="minConcatAcqPackage"
                v-model.number="minConcatAcqPackage"
                disabled
                class="spin-btn-grp"
              />
            </div>
          </div>
          <div class="text-3 minTeCon mt-0 input-group">
            <label class="label-size">Min. Seq. TR</label>
            <div class="text-input">
              <SpinButton
                :type="'number'"
                :step="1"
                :min="1"
                :max="500"
                :value="minSeqTr"
                disabled
                class="spin-btn-grp"
              />
            </div>
          </div>
          <div class="text-3 minTeCon mt-0 input-group">
            <label class="label-size">{{ $t('SelectionConfigForm.min_seq_te') }}</label>
            <div class="text-input">
              <SpinButton
                :type="'number'"
                :step="1"
                :min="1"
                :max="500"
                :value="minSeqTe"
                :disabled="true"
                class="spin-btn-grp"
              />
            </div>
          </div>
        </v-col>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import SpinButton from './SpinButton.vue'

import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import { MriMixin } from '../Mixins/MriMixin.js'
import { mapGetters, mapActions } from 'vuex'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  components: { SpinButton },
  mixins: [SelectionConfigMixin],

  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      signalModeOptions: ['Off', 'RESP', 'ECG', 'External'],
      signalMode: 'Off',
    }
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    //...mapActions('dataToParent', ['updateScanTime']),
    ...mapActions('scanTimeConfig', [
      'updateRepetitionTime',
      'updateEchoTime',
      'updateFlipAngle',
      'updateSlices',
      'updatePhaseEncodingLines',
      'updateParallelFactor',
      'updatePhaseMatrix',
      'updateFrequencyMatrix',
      'updateDimensions3x',
      'updateDimensions3y',
      'updatePartialFourier',
      'updateAverages',
      //'updateConcatenations',
      'updateEchoTrainLength',
      'updateVendorStylePreference',
      'updateIsUltraLab',
      'updateSelectionIdent',
      'updateOversampling',
      'updateOversamplingPercentage',
      'updateTrueResolutionHeaderUltra',
      'updateTrueResolutionHeader',
      'updateAcquiredResolutionHeader',
      'updateMinConcatAcqPackage',
    ]),
    /*
    changeConcatenations(value) {
      this.concatenations = value
    },
    */
    handleRepetitionTime(event) {
      this.updateRepetition(event)
    },
    /*
    handleConcatenations(event) {
      this.updateConcatenations(event)
    },
    */
  },
  computed: {
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    activeInputs() {
      let labType = 'basic'
      if (this.isUltraLab) {
        labType = 'ultra'
      } else if (this.isContrastLab) {
        labType = 'contrast'
      } else if (this.isResolutionLab) {
        labType = 'resolution'
      }

      console.log('this lab type', labType)
      return activeLabelUtil(labType)
    },
  },
  watch: {
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
    repetitionTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateRepetition(newVal)
        this.updateSeqValues()
      }
    },
    */
    /*
    concatenations(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateConcatenations(newVal)
        this.updateSeqValues()
      }
    },
    */
    shouldPausePopup: {
      immediate: true,
      handler(newVal) {
        this.isInitialLoadingPhase = newVal
      },
    },
  },
  mounted() {
    console.log('oversampling', this.oversampling)
    //this.updateRepetitionTime(this.repetitionTime)
    //this.updateConcatenations(this.concatenations)
  },
}
</script>

<style scoped>
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

::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin-top: 0px !important;
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

/* dropdown background style */
.v-btn {
  font-size: 11px !important;
  /* background: black !important; */
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
  width: 18.75%;
}
.v-input--is-focused {
  display: block !important;
}
label,
span {
  font-size: 90%;
}
.text-input {
  max-width: 38%;
  width: 38%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 25px !important;
  border-bottom: none;
}
::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}
/*
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
*/
::v-deep .v-text-field__details {
  display: none;
}
.text-1 {
  display: flex;
  justify-content: flex-start;
  color: white !important;
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
  padding-top: 0px;
  margin-top: 0px !important;
}
::v-deep .v-text-field__slot {
  background: #383535;
  border-color: #383535;
  border-radius: 0px;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0px;
}
::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 1rem;
  border-bottom: none;
  border-radius: 4px;
}
::v-deep .v-input__icon {
  height: 10px !important;
}

::v-deep .v-icon.v-icon {
  color: white !important;
  height: 11px !important;
}

.v-input {
  max-width: 40.5%;
}
::v-deep .v-text-field input {
  padding: 0px;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 15px !important;

  right: 10px;
  top: -2px !important;
}

/* .main-1 {
  display: flex;
  height: 33vh;
  justify-content: space-around;
}

.main-2 {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 35%;
}
.main-3 {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 50%;
} */
.main-1 {
  display: flex;
  justify-content: space-around;
}

.main-2 {
  color: white !important;
  width: 50%;
}
.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
}
.v-sheet.v-card {
  border-radius: 0px;
}

::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}
::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
}
::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}
::v-deep .v-input__slot fieldset {
  height: 30px;
}

/* Responsive CSS */
@media (max-width: 1200px) {
  .text-input {
    max-width: 48%;
    width: 48%;
  }
  .label-size {
    width: 45%;
  }
  .v-input {
    max-width: 55%;
  }
  .main-1 {
    flex-direction: column;
    height: auto;
  }
  .main-2,
  .main-3 {
    width: 100%;
    justify-content: space-evenly;
  }
}

@media (max-width: 768px) {
  .text-input {
    max-width: 60%;
    width: 60%;
  }
  .label-size {
    width: 50%;
  }
  .v-input {
    max-width: 70%;
  }
  .main-1 {
    flex-direction: column;
  }
  .text-1 {
    justify-content: space-between;
  }
}

[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}

input[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}

.snr-icon-btn {
  background: black !important;
  border: none !important;
  width: auto !important;
}

/* Disabled Div */
.disabled-div {
  background-color: #444; /* Background color to make it look disabled */
  padding: 15px;
  border: 1px solid #555; /* Subtle border */
  border-radius: 5px;
  max-width: 400px;
  margin: auto;
  height: 34%;
  opacity: 0.5; /* Makes it look disabled */
}

.input-group label {
  color: #ccc;
  font-size: 14px;
  flex: 1;
}

.active-label {
  color: white; /* White color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

/* Mobile Devices (Portrait and Landscape) */
@media (max-width: 500px) {
  .disabled-div {
    padding: 10px;
    max-width: 100%;
  }

  .input-group {
    flex-direction: column;
  }

  .input-group input {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .text-input {
    max-width: 80%;
    width: 80%;
  }
  .label-size {
    width: 60%;
  }
  .v-input {
    max-width: 90%;
  }
  .text-1 {
    flex-direction: column;
    justify-content: center;
    text-align: left;
  }
  .main-1 {
    flex-direction: column;
    height: auto;
    justify-content: center;
  }
}
@media (min-width: 1400px) and (max-width: 2490px) {
  .con-m {
    /* margin-top: 45%; */
  }
  .minTeCon {
    margin-top: 2%;
  }
  .disabled-div {
    padding: 0 15px 0px 0px;
    max-width: 25%;
    /*
    margin-left: 64%;
    */
    height: 25%;
  }
}

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #F2A14A !important;
}
</style>
