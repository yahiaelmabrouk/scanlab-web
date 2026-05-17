<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-dialog v-model="showConfirmDialog" persistent width="700px">
      <v-card class="change-dialog full-height-dialog">
        <div class="dialog-content">
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

          <v-card-actions class="notification-action">
            <v-spacer></v-spacer>
            <v-btn color="error" @click="cancelChange">
              {{ $t('global.cancel', languageCode) }}
            </v-btn>
            <v-btn color="success" @click="confirmChange" :class="{ 'active-confirm-button': isDialogKeyboardReady }">
              {{ $t('global.okay', languageCode) }}
            </v-btn>
          </v-card-actions>
        </div>
      </v-card>
    </v-dialog>

    <v-card-text class="">
      <v-row class="m-0">
        <v-col cols="6">
          <div class="text-1">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.repetitionTime, 'inactive-label': !activeInputs.repetitionTime }"
            >
              TR
            </label>

            <BspinButton
              @input="changeRepetitionTime"
              class="input-lock"
              :type="'number'"
              :value="repetitionTime"
              :step="1"
              :min="selectionConfig.sequenceType !== 'DIFF' ? 1 : minConcatAcqPackage"
              :max="20000"
              :disabled="complete || isAddLocalizerMode"
            />

            <span class="mx-3">ms</span>
          </div>
          <div class="text-1">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.echoTime, 'inactive-label': !activeInputs.echoTime }"
            >
              TE
            </label>
            <BspinButton
              class="input-lock"
              v-if="selectionConfig.sequenceType === 'DIFF'"
              :step="echoSpacing"
              :min="echoSpacing"
              :max="minTEOptionsForTEandDIFF * 2"
              :value="echoTime"
              @input="changeEchoTime"
            />
            <BspinButton
              v-if="selectionConfig.sequenceType === 'TE'"
              :step="echoSpacing"
              :min="echoSpacing"
              :max="echoSpacing * echoTrainLength"
              :value="echoTime"
              @input="changeEchoTime"
              class="input-lock"
            />
            <BspinButton
              v-if="selectionConfig.sequenceType === 'SE'"
              :step="1"
              :min="6"
              :max="maxTEOptionsForSE"
              :value="echoTime"
              @input="changeEchoTime"
              class="input-lock"
            />
            <BspinButton
              v-if="selectionConfig.sequenceType === 'GRE'"
              :step="1"
              :min="1"
              :max="maxTEOptionsForGRE"
              :value="echoTime"
              @input="changeEchoTime"
              class="input-lock"
            />
            <span class="mx-3">ms</span>
          </div>

          <div class="text-1">
            <label class="label-size inactive-label">TD</label>
            <BspinButton
              @input="changeTD"
              v-model.number="TD"
              class="input-lock"
              :type="'number'"
              :step="1"
              :min="1"
              :max="1000"
              :disabled="complete || isAddLocalizerMode"
            />
            <span class="mx-3">ms</span>
          </div>
          <div class="text-2">
            <label class="label-size-1 inactive-label">MTC</label>
            <checkbox v-model="isChecked" label="Custom Checkbox" />
          </div>

          <div class="main-3 mt-2">
            <div class="text-1">
              <label
                class="label-size-2"
                :class="{
                  'active-label': activeInputs.magnPreparation,
                  'inactive-label': !activeInputs.magnPreparation,
                }"
              >
                Magn. Preparation
              </label>
              <v-select
                v-model="selectedMagnItem"
                :items="getMagnItems"
                color="#423c3c"
                dense
                outlined
                style="width: 10.5vw; max-width: 34%; margin-left: 2%"
              />
            </div>
            <div v-if="(selectedMagnItem || '').trim() !== 'Off'" class="text-1">
              <label
                class="label-size"
                :class="{ 'active-label': activeInputs.inversionTime, 'inactive-label': !activeInputs.inversionTime }"
              >
                TI
              </label>
              <BspinButton
                class="input-lock"
                :type="'number'"
                :value="inversionTime"
                v-model.number="inversionTime"
                :step="1"
                :min="0"
                :max="15000"
                :disabled="complete"
              />
              <span class="mx-3">ms</span>
            </div>

            <div class="text-1">
              <label
                class="label-size"
                :class="{ 'active-label': activeInputs.flipAngle, 'inactive-label': !activeInputs.flipAngle }"
              >
                Flip Angle
              </label>
              <BspinButton
                class="input-lock"
                :type="'number'"
                v-model.number="flipAngle"
                :step="1"
                :min="1"
                :max="2000"
              />
              <span class="mx-3">deg</span>
            </div>
          </div>
        </v-col>
        <v-col cols="6" class="main-4">
          <div class="text-1">
            <div class="text-1">
              <label
                class="label-size"
                :class="{ 'active-label': activeInputs.fatSuppression, 'inactive-label': !activeInputs.fatSuppression }"
              >
                Fat suppr.
              </label>
              <v-select
                :items="fatSuppressionOptions"
                v-model="selectedFatOption"
                color="#423c3c"
                dense
                outlined
                style="width: 150px; margin-left: 2%"
                @change="updateFatOption"
              >
              </v-select>
            </div>
            <div class="text-1">
              <label class="label-size inactive-label">Water suppr. </label>
              <v-select
                :items="waterSuppressionOptions"
                v-model="selectedWaterOption"
                color="#423c3c"
                dense
                outlined
                style="width: 150px; margin-left: 2%"
                @change="updateWaterOption"
              >
              </v-select>
            </div>
            <div class="disabled-div">
              <div class="text-3 minTeCon input-group">
                <label class="label-size" style="color: dimgray">Min.TR/Conc</label>
                <div class="text-input">
                  <BspinButton
                    :type="'number'"
                    :step="1"
                    :min="1"
                    :max="500"
                    :value="minConcatAcqPackage"
                    v-model.number="minConcatAcqPackage"
                    :disabled="true"
                    class="spin-btn-grp"
                  />
                </div>
              </div>
              <div class="text-3 minTeCon mt-0 input-group">
                <label class="label-size" style="color: dimgray">Min. Seq. TR</label>
                <div class="text-input">
                  <BspinButton
                    :type="'number'"
                    :step="1"
                    :min="1"
                    :max="500"
                    :value="minSeqTr"
                    :disabled="true"
                    class="spin-btn-grp"
                  />
                </div>
              </div>
              <div v-if="selectionConfig.sequenceType === 'DIFF'" class="text-3 minTeCon mt-0 input-group">
                <label class="label-size" style="color: dimgray">{{ $t('SelectionConfigForm.min_seq_te') }}</label>
                <div class="text-input">
                  <BspinButton
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
            </div>
          </div>
        </v-col>
      </v-row>
      <!-- <v-row class="justify-end" v-if="!isTakingTest">
        <v-col cols="2">
          <div class="text-left">
            <label>SNR Average</label>
            <div class="d-flex align-items-center">
              <b-form-input
                :type="'text'"
                :value="selectionConfig.snr !== null ? selectionConfig.snr.toFixed(2) : '---'"
                disabled
                class="input-number"
                style="flex: 1; min-width: 4em"
              />
              <div class="d-flex flex-column ml-0">
                <v-btn
                  icon
                  small
                  class="snr-icon-btn"
                  @click="fetchSignalAverage"
                  :disabled="isFetchingSignalAverage"
                  title="Refresh SNR average"
                >
                  <v-icon small>{{ isFetchingSignalAverage ? 'mdi-loading mdi-spin' : 'mdi-refresh' }}</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  class="snr-icon-btn"
                  @click="saveSNR"
                  :disabled="selectionConfig.snr === null"
                  title="Save current SNR for comparison"
                >
                  <v-icon small>mdi-content-save</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-col>
        <v-col cols="2">
          <div class="ms-auto me-7 text-left">
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
        </v-col>
      </v-row> -->
      <!-- <div class="tr-graph-container">
          <label for="" style="color: black">TR</label>
          <div class="tr-labels">
            <span class="top-label">{{ trValue }}</span>
            <span class="bottom-label">12</span>
          </div>
          <div class="tr-bar">
            <div class="tr-bar-filled"></div>
            <div class="tr-values">
              <span></span>
              <span></span>
              <span>10000</span>
            </div>
          </div>
        </div> -->
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from './BspinButton.vue'
import checkbox from './CustomCheckbox.vue'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'
import EventBus from '@/lib/event-bus'

export default {
  name: 'BcontrastCommon',
  mixins: [SelectionConfigMixin],
  components: { BspinButton, checkbox },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    sequenceType: {
      type: String,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
    shouldPausePopup: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data() {
    return {
      //   items: ['None', 'None-Sel IR'],
      //   options: ['Standard', 'Fat Suppression'],
      //   selectedOption: null,
      //   selectedFatOption: 'None',
      //   selectedWaterOption: 'None',
      //   fatSuppressionOptions: ['None', 'Fat Sat.', 'SPAIR'],
      //   waterSuppressionOptions: ['None', 'Water Sat.'],
      //   TD: 1,
      trValue: 18,
      isChecked: false,
    }
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    //...mapActions('dataToParent', ['updateScanTime']),

    changeTD(newVal) {
      this.TD = newVal
    },
    /*
    changeTR(newVal) {
      this.repetitionTime = newVal
    },
    changeTE(newVal) {
      this.echoTime = newVal
    },
    changeTI(newVal) {
      this.inversionTime = newVal
    },
    changeFlipAngle(newVal) {
      this.flipAngle = newVal
    },
    ...mapActions('scanTimeConfig', [
      'updateRepetitionTime',
      'updateEchoTime',
      'updateFlipAngle',
      'updateSelectedFetOptions',
    ]),
    updateFetOptions(value) {
      if (value === 'Standard') {
        this.fatSuppression = false
      } else {
        this.fatSuppression = true
      }
      this.updateSelectedFetOptions(value)
    },
    updateMagnItems(value) {
      if (value === 'None') {
        this.inversionTime = 0
        this.inversionRecovery = false
      } else {
        this.inversionRecovery = true
      }
      this.$store.dispatch('scanTimeConfig/updateMagnItems', value)
    },
    */
    /*
    handleRepetitionTime(event) {
      this.updateRepetition(event)
    },
    handleEchoTime(event) {
      this.updateEchoTime(event)
      // this.changeEchoTime(event)
    },

    updateRepetition(value) {
      console.log('updateRepetition==', value)

      this.$store.dispatch('scanTimeConfig/updateRepetitionTime', value)
    },

    // Method to update echo time
    updateEchoTime(value) {
      console.log('updateEchoTime==', value)

      this.$store.dispatch('scanTimeConfig/updateEchoTime', value)
    },
    */
    updateFatOption(newVal) {
      this.$store.dispatch('b19AllValuesSelection/updateFatOption', newVal)
    },
    updateWaterOption(newVal) {
      this.$store.dispatch('b19AllValuesSelection/updateWaterOption', newVal)
    },
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

    /*
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
  */
    ...mapState('scanTimeConfig', ['selectedFetOptions', 'Fetoptions']),
    ...mapState('b19AllValuesSelection', ['fatSuppressionOptions', 'waterSuppressionOptions', 'TD']),

    ...mapGetters('scanTimeConfig', ['getselectedMagnItems', 'getMagnItems']),
    ...mapGetters('b19AllValuesSelection', [
      'getTD',
      'getSelectedFatOption',
      'getSelectedWaterOption',
      'getFatSuppressionOptions',
      'getWaterSuppressionOptions',
    ]),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    selectedMagnItem: {
      get() {
        let output
        if (this.selectionConfig && this.selectionConfig.inversionRecovery) {
          if (this.selectionConfig.inversionRecovery === true) {
            output = '<Non-sel. IR>'
          } else {
            output = 'Off'
          }
        } else {
          output = 'Off'
        }
        return output
      },
      set(newVal) {
        if ((newVal || '').trim() === 'Off') {
          this.inversionTime = 0
          this.inversionRecovery = false
        } else {
          this.inversionTime = 100
          this.inversionRecovery = true
        }
      },
    },
    TD: {
      get() {
        return this.$store.state.b19AllValuesSelection.TD
      },
      set(newVal) {
        this.$store.commit('b19AllValuesSelection/SET_TD', newVal)
      },
    },
    fatSuppressionOptions() {
      return this.$store.getters['b19AllValuesSelection/getFatSuppressionOptions']
    },
    selectedFatOption: {
      get() {
        return this.$store.getters['b19AllValuesSelection/getSelectedFatOption']
      },
      set(newVal) {
        this.$store.dispatch('b19AllValuesSelection/updateSelectedFatOption', newVal)
      },
    },
    waterSuppressionOptions() {
      return this.$store.getters['b19AllValuesSelection/getWaterSuppressionOptions']
    },
    selectedWaterOption: {
      get() {
        return this.$store.getters['b19AllValuesSelection/getSelectedWaterOption']
      },
      set(newVal) {
        this.$store.dispatch('b19AllValuesSelection/updateSelectedWaterOption', newVal)
      },
    },
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
        // console.log('scan time in Routine Tab=====', newVal)
        this.updateScanTime(newVal)
      }
    },
    repetitionTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateRepetition(newVal)
        // this.changeRepetitionTime(newVal)
      }
    },
    echoTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateEchoTime(newVal)
        this.updateSeqValues()
      }
    },
    minConcatAcqPackage(newVal, oldVal) {
      this.updateSeqValues()
      if (newVal !== oldVal) {
        this.$store.dispatch('scanTimeConfig/updateMinConcatAcqPackage', newVal)
      }
    },
    */
    selectedMagnItem(newVal) {
      console.log('newVal', newVal)
      if (newVal !== 'Off') {
        console.log('new value is not Off', newVal)
        this.fatSuppression = false
        this.updateFatOption('None')
      }
    },
    selectedFatOption(newVal) {
      if (newVal === 'Fat Sat.' || newVal === 'SPAIR') {
        this.fatSuppression = true
        this.inversionTime = 0
        this.inversionRecovery = false
      } else {
        this.fatSuppression = false
      }
    },
    shouldPausePopup: {
      immediate: true,
      handler(newVal) {
        this.isInitialLoadingPhase = newVal
      },
    },
  },
  mounted() {
    //this.updateRepetitionTime(this.repetitionTime)
    //this.updateEchoTime(this.echoTime)
    console.log('echoTrainLength====', this.echoTrainLength)
    console.log('this.concatenations con--------', this.concatenations)
    console.log('this.this.inversionRecovery con--------', this.inversionRecovery)
    console.log('this.this.inversionRecovery con--------', this.inversionRecovery)
    console.log('this.this.fatSuppression con--------', this.fatSuppression)

    EventBus.$on('onSliceViewWindowChange', this.onSliceViewWindowChange)
  },
}
</script>

<style scoped>
.tr-graph-container {
  display: flex;
  align-items: center;
  font-family: Arial, sans-serif;
  margin-left: 16%;
  width: 94%;
  margin-top: 5%;
}

.tr-labels {
  display: flex;
  flex-direction: column;
  margin-right: 0px;
  color: black;
}

.top-label {
  font-size: 12px;
  margin-bottom: 20px; /* Adjust to position it closer to the bar */
  color: black;
}

.bottom-label {
  font-size: 12px;
  color: black;
}
.text-input {
  max-width: 100%;
  width: 48%;
  margin-left: 2%;
  border-radius: 0px !important;
  height: 1rem !important;
  border-bottom: none;
}
.tr-bar {
  position: relative;
  width: 650px;
  height: 20px;
  background-color: lightgray;
  border: 1px solid #000;
  display: flex;
  align-items: center;
  margin-right: 13%;
}

.tr-bar-filled {
  height: 100%;
  width: 100%;
  background-color: green;
}

.tr-values {
  position: absolute;
  top: 20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 0 5px;
  color: black;
}
/* Make the checkbox background white */
.custom-checkbox .v-input--selection-controls__ripple {
  background-color: white !important;
  border: 2px solid black !important; /* Black outline */
}

/* Keep background white and set checkmark color to black when checked */
.custom-checkbox .v-input--selection-controls__input:checked + .v-input--selection-controls__ripple {
  background-color: white !important;
  border: 2px solid black !important; /* Outline stays black */
}

/* Style the checkmark to black */
.custom-checkbox .v-icon {
  color: black !important; /* Black checkmark */
}

.disabled-div {
  background-color: #b5b1b1; /* Background color to make it look disabled */
  border: 1px solid #555; /* Subtle border */
  border-radius: 5px;
  max-width: 240px;
  width: 100%;
  opacity: 0.5; /* Makes it look disabled */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px 16px 12px;
  gap: 10px;
  margin: auto;
  margin-right: 30%;
  margin-top: 1%;
}

.notification-action > .v-btn {
  min-width: 28%;
}

.v-btn {
  font-size: 11px !important;
  background: #111111 !important;
  color: #ffffff !important;
  border: 1px solid #c0c0c0;
  border-radius: none;
  color: white !important;
  border: none !important;
}

.snr-icon-btn {
  background: transparent !important;
  color: #000 !important;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot > .v-text-field__slot {
  left: 0.5rem;
  width: 35%;
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

.label-size-1 {
  width: 66%;
  display: flex;
  justify-content: right;
  color: #000;
}

.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.35rem;
  width: 30%;
  margin-left: 2%;
}

.label-size-2 {
  width: 40%;
  text-align: end;
}

::v-deep .v-icon.v-icon {
  font-size: 17px;
  color: black;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  border: none !important;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:before {
  border: none !important;
}

label,
span {
  font-size: 80%;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 32px;
}

.v-input--is-focused {
  display: block !important;
}

.text-1 {
  display: flex;
  color: black !important;
  justify-content: flex-start;
}

.text-2 {
  display: flex;
  margin-right: 20%;
  justify-content: space-evenly;
}

::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
}

::v-deep .v-input__slot {
  margin-bottom: 0px;
}

::v-deep .v-text-field.v-text-field--enclosed .v-text-field__details {
  margin-bottom: 0px;
}

.v-text-field {
  padding-top: 0px;
  margin-top: 0px;
}

::v-deep .v-input__slot fieldset {
  background: white;
  border-color: white !important;
  border-radius: 0px;
}

.v-checkbox {
  background: white !important;
}

::v-deep .v-text-field__slot {
  /* border: 1px solid white !important; */
  /* background: white;
  border-color: white !important; */
  border-radius: 0px;
  height: 1.05rem;
  border-bottom: none;
  border-radius: 0px;
}

::v-deep .v-input__icon {
  height: 11px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
}

::v-deep .v-text-field__details {
  display: none;
}

.v-input {
  max-width: 28%;
}

::v-deep .v-text-field input {
  padding: 0px;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: 0px !important;
}

.main-1 {
  display: flex;
  justify-content: space-around !important;
  color: white !important;
  gap: 4px;
}

.main-3 {
  height: 12vh !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.main-4 {
  height: 16vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 5%;
  width: 45%;
}

.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
  height: 86%;
}

.v-sheet.v-card {
  border-radius: 0px;
}

::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}

::v-deep .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__append-inner {
  margin-top: 5px !important;
}

::v-deep .v-input__append-inner {
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}
::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin: 0px 4px 4px 0px !important;
}

.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}
@media (min-width: 2305px) and (max-width: 2490px) {
  .disabled-div {
    margin-top: 20%;
  }
}
@media (max-width: 1800px) {
  .disabled-div {
    margin-top: 30%;
  }
  .tr-graph-container {
    margin-top: 10%;
  }
}
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
/* popup styles */
.selection-config-form .showConfirmDialog {
  background-color: white !important;
}
.full-height-dialog {
  display: flex;
  flex-direction: column;
  height: auto !important;
  max-height: none !important;
}

.full-height-dialog .dialog-content {
  flex: 1 1 auto;
  overflow-y: auto;
}
.full-height-dialog .v-card__title {
  display: block !important;
  text-align: center !important;
}
.full-height-dialog .v-card__text {
  position: relative !important;
}

.full-height-dialog .v-card__actions {
  /*flex: 0 0 auto;*/
  display: block !important;
  padding: 16px;
}

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #F2A14A !important;
}
</style>
