<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
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
      <div>
        <div class="main-1">
          <div class="TRTEwidth" style="width: 340px !important">
            <div class="text-3 mt-1" style="margin-left: 10px">
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
              <span class="mx-3">ms</span>
            </div>

            <div class="text-3 mt-1" style="margin-left: 10px">
              <label
                class="label-size"
                :class="{ 'active-label': activeInputs.echoTime, 'inactive-label': !activeInputs.echoTime }"
              >
                TE
              </label>
              <div class="text-input">
                <SpinButton
                  v-if="selectionConfig && selectionConfig.sequenceType === 'DIFF'"
                  :step="echoSpacing"
                  :min="minTEOptionsForTEandDIFF"
                  :max="minTEOptionsForTEandDIFF * 2"
                  :value="echoTime"
                  @input="changeEchoTime"
                />
                <SpinButton
                  v-if="selectionConfig.sequenceType === 'TE'"
                  :step="echoSpacing"
                  :min="echoSpacing"
                  :max="echoSpacing * echoTrainLength"
                  :value="echoTime"
                  @input="changeEchoTime"
                />
                <SpinButton
                  v-if="selectionConfig.sequenceType === 'SE'"
                  :step="1"
                  :min="6"
                  :max="maxTEOptionsForSE"
                  :value="echoTime"
                  @input="changeEchoTime"
                />
                <SpinButton
                  v-if="selectionConfig.sequenceType === 'GRE'"
                  :step="1"
                  :min="1"
                  :max="maxTEOptionsForGRE"
                  :value="echoTime"
                  @input="changeEchoTime"
                />
              </div>
              <span class="mx-3">ms</span>
            </div>
          </div>

          <div class="text-1 fat-water-contrast" style="margin-right: 35px; display: flex; align-items: center; justify-content: center;">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.fatSuppression, 'inactive-label': !activeInputs.fatSuppression }"
            >
              Fat-Water Contrast
            </label>
            <v-select
              :items="fatOptions"
              :value="selectedFatOptions"
              color="#423c3c"
              dense
              outlined
              style="width: 235px"
              @change="updateFatOptions"
            ></v-select>
          </div>
        </div>

        <div class="main-1" style="margin-right: 2.5rem">
          <div style="width: 340px !important">
            <div class="text-2" style="margin-left: 0.5rem">
              <label class="label-size inactive-label">MTC</label>
              <v-checkbox />
            </div>
            <div class="main-3">
              <div class="text-1">
                <label
                  class="label-size"
                  :class="{
                    'active-label': activeInputs.magnPreparation,
                    'inactive-label': !activeInputs.magnPreparation,
                  }"
                >
                  Magn. Preparation
                </label>
                <v-select v-model="selectedMagnItems" :items="getMagnItems" color="#423c3c" dense outlined></v-select>
              </div>
              <div v-if="(selectedMagnItems || '').trim() !== 'Off'" class="text-1" style="margin-right: 2px">
                <label
                  class="label-size"
                  :class="{ 'active-label': activeInputs.inversionTime, 'inactive-label': !activeInputs.inversionTime }"
                >
                  TI
                </label>
                <div class="text-input">
                  <SpinButton
                    :type="'number'"
                    :value="inversionTime"
                    v-model.number="inversionTime"
                    :step="1"
                    :min="0"
                    :max="15000"
                    :disabled="complete"
                  />
                </div>
                <span class="mx-3">ms</span>
              </div>
              <div class="text-1 mb-4 mt-1">
                <label
                  class="label-size"
                  :class="{ 'active-label': activeInputs.flipAngle, 'inactive-label': !activeInputs.flipAngle }"
                >
                  Flip Angle
                </label>
                <div class="text-input">
                  <SpinButton
                    :type="'number'"
                    :step="1"
                    :min="0"
                    :max="2000"
                    v-model.number="flipAngle"
                    :disabled="isDisabledParameter"
                  />
                </div>
                <span class="mx-3">deg</span>
              </div>
            </div>
          </div>
          <div class="main-2" style="width: 320px !important">
            <div class="text-2">
              <label class="label-size inactive-label">Dark Blood</label>
              <v-checkbox />
            </div>
            <div>
              <div class="text-1">
                <label class="label-size inactive-label">Contrasts</label>
                <v-select
                  v-model="selectedContrast"
                  :items="contrast"
                  color="#423c3c"
                  dense
                  outlined
                  style="width: 150px"
                ></v-select>
              </div>
              <div class="text-1">
                <label class="label-size inactive-label">Wrap-up Magn.</label>
                <v-select
                  v-model="selectedWrapUp"
                  :items="wrapUp"
                  color="#423c3c"
                  dense
                  outlined
                  style="width: 150px"
                ></v-select>
              </div>
              <div class="text-1">
                <label class="label-size inactive-label">Reconstruction</label>
                <v-select
                  v-model="selectedReconstruction"
                  :items="reconstruction"
                  color="#423c3c"
                  dense
                  outlined
                  style="width: 150px"
                ></v-select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="d-flex justify-end mt-2" v-if="!isTakingTest">
        <!-- <v-col cols="3">
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
        <v-col cols="3">
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
        <v-col class="disabled-div" v-if="isUltraLab || isContrastLab" style="margin-left: auto; margin-right: 20px">
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
          <div v-if="selectionConfig.sequenceType === 'DIFF'" class="text-3 minTeCon mt-0 input-group">
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
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import { mapState, mapActions, mapGetters } from 'vuex'
import _ from 'lodash'
import { MriMixin } from '../Mixins/MriMixin.js'
import SpinButton from './SpinButton.vue'
import EventBus from '@/lib/event-bus'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  mixins: [SelectionConfigMixin],
  name: 'ContrastCommon',
  components: { SpinButton },
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
      contrast: [1, 2],
      //selectedMagnItems: 'Off',
      wrapUp: [
        { text: 'On', value: 'on' },
        { text: 'Off', value: 'off' },
      ],
      reconstruction: [
        { text: 'Magnitude', value: 'magnitude' },
        { text: 'Mag/Phase', value: 'mag/phase' },
        { text: 'Phase', value: 'phase' },
      ],

      selectedContrast: 1,
      selectedWrapUp: 'off',
      selectedReconstruction: 'magnitude',
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
    // ...mapGetters('scanTimeConfig', ['getOversampling']),
    /*
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    */
    //...mapState('scanTimeConfig', ['selectedMagnItems', 'selectedFetOptions', 'Fetoptions']),
    ...mapState('scanTimeConfig', ['selectedFatOptions', 'fatOptions']),

    ...mapGetters('scanTimeConfig', ['getselectedMagnItems', 'getMagnItems']),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    selectedMagnItems: {
      get() {
        let output = 'Off'
        if (this.inversionRecovery === true) {
          output = '<Non-sel. IR>'
        }
        //return this.$store.getters['selectionConfig/inversionRecovery']
        console.log('mag item (get): ', output)
        return output
      },
      set(value) {
        if ((value || '').trim() === 'Off') {
          this.inversionTime = 0
          this.inversionRecovery = false
        } else {
          this.inversionRecovery = true
          this.inversionTime = 100
        }
        console.log('mag item (set): ', value)
        console.log('mag item (set): ', this.inversionRecovery)
        //this.$store.dispatch('selectionConfig/updateInversionRecovery', value)
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
      let ouput = activeLabelUtil(labType)
      console.log('ouput', ouput)
      return ouput
    },
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
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
      'updateConcatenations',
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
      'updateSelectedFatOptions',
    ]),
    //...mapActions('dataToParent', ['updateScanTime']),
    updateFatOptions(value) {
      if (value === 'Standard') {
        this.fatSuppression = false
      } else {
        this.fatSuppression = true
      }
      this.updateSelectedFatOptions(value)
    },
    /*
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
  },
  watch: {
    shouldPausePopup: {
      immediate: true,
      handler(newVal) {
        this.isInitialLoadingPhase = newVal
      },
    },
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
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
  },
  mounted() {
    // console.log('--- Calculation State Log Start routine ---')
    // console.log('Oversampling:', this.oversampling)
    // console.log('Phase Matrix:', this.phaseMatrix)
    // console.log('Frequency Matrix:', this.frequencyMatrix)
    // console.log('Dimensions 3X:', this.dimensions3x)
    // console.log('Dimensions 3Y:', this.dimensions3y)
    // console.log('Partial Fourier:', this.partialFourier)
    // console.log('Averages:', this.averages)
    // console.log('Concatenations:', this.concatenations)
    // console.log('Repetition Time:', this.repetitionTime)
    // console.log('Echo Train Length:', this.echoTrainLength)
    // console.log('Parallel Factor:', this.parallelFactor)
    // console.log('Vendor Style Preference:', this.vendorStylePreference)
    // console.log('Sequence Type:', this.sequenceType)
    // console.log('trueResolutionHeaderUltra', this.trueResolutionHeaderUltra)
    // console.log('trueResolutionHeader', this.trueResolutionHeader)
    // console.log('acquiredResolutionHeader', this.acquiredResolutionHeader)
    // console.log('scanTime ', this.scanTime)
    // console.log('--- Calculation State Log End routine ---')

    this.updateRepetitionTime(this.repetitionTime)
    this.updateEchoTime(this.echoTime)
    EventBus.$on('onSliceViewWindowChange', this.onSliceViewWindowChange)
    if (this.minConcatAcqPackage > this.repetitionTime) {
      if (this.selectionConfig?.sequenceType === 'TE') {
        this.concatenations = _.round(
          ((this.echoSpacing + 5) * (this.echoTrainLength ? this.echoTrainLength : 1) * this.numberOfSlices) /
            this.repetitionTime
        )
      } else if (this.selectionConfig?.sequenceType === 'SE') {
        this.concatenations = _.round(((this.echoSpacing + 5) * this.numberOfSlices) / this.repetitionTime)
        if (this.concatenations <= 1) {
          this.concatenations = 2
        }
      }
    }
  },
}
</script>
<style scoped>
::v-deep .v-card__text {
  top: 0px !important;
}

::v-deep .v-dialog > .v-card > .v-card__actions {
  padding: 12px 16px;
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

/* dropdown background style */

.v-btn {
  font-size: 11px !important;
  /* background: black !important; */
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
  border-color: black !important;
}
.TRTEwidth {
  width: 38%;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

.text-input {
  max-width: 38%;
  width: 38%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 2rem !important;
  border-bottom: none;
}

::v-deep .text-input .spin-btn button {
  height: 1rem;
  font-size: 20px;
}

::v-deep .v-icon.v-icon {
  font-size: 17px;
}

/*
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
*/

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0%;
}

label,
span {
  font-size: 70%;
}
::v-deep .v-text-field--outlined fieldset {
  width: 90%;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

::v-deep .v-input__slot fieldset {
  width: 125px !important;
}

::v-deep .v-input__slot .v-input__append-inner {
  margin-right: 27px !important;
}
::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 2rem !important;
  border-bottom: none;
  border-radius: 4px;
}

.v-input--is-focused {
  display: block !important;
}

.text-1 {
  display: flex;
  color: white !important;
  justify-content: normal;
  margin-left: 9px;
}

.text-2 {
  display: flex;
}
.text-3 {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 10px;
}

::v-deep .v-input--dense > .v-input__control {
  width: 165px !important;
}
::v-deep .v-input--dense > .v-input__control button {
  width: 165px !important;
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

::v-deep .v-text-field {
  padding-top: 0px;
  margin-top: 0px !important;
  margin-left: 6px;
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

/*
::v-deep .v-icon.v-icon {
  color: black !important;
}
*/

::v-deep .v-input__icon {
  height: 10px !important;
}

::v-deep .v-text-field__details {
  display: none;
}

.v-input {
  max-width: 51%;
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
}

.main-2 {
  display: flex;
  flex-direction: column;
}

.main-3 {
  height: 70%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
    max-width: 100%;
  }
  .main-1 {
    flex-direction: column;
  }
  .text-1 {
    justify-content: space-between;
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

[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}
.minTeCon {
  margin-top: 5%;
  justify-content: flex-end;
  margin-right: 20%;
}

.spin-btn-grp {
  height: 1.9rem;
}
.input-group {
  display: flex;
  justify-content: space-between;
}

.input-group label {
  color: #ccc;
  font-size: 14px;
  flex: 1;
}

input[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}

.active-label {
  color: white; /* White color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

/* Responsive design */
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
/* Extra Large Screens */
@media (min-width: 1400px) and (max-width: 2490px) {
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

@media (min-height: 1081px) {
  .minTeCon {
    margin-top: 2%;
  }
  .disabled-div {
    padding: 0 15px 0px 0px;
    max-width: 28%;
    height: 25%;
    margin-top: 20px;
  }
  ::v-deep .theme--light.v-input input {
    font-size:18px !important;
  }
  ::v-deep .text-input {
    height: 2rem !important;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  ::v-deep .sp-btn-updown {
    width: 134%;
  }
  ::v-deep .sp-btn-updown .sp-btn-grp {
    width: 100%;
  }
  label, span {
    font-size: 110%;
    margin-bottom: 0 !important;
  }
  .text-3 {
    margin-bottom: 6px;
  }
  ::v-deep .v-input__slot fieldset {
    height: 2.5rem !important;
    width: 130px !important;
  }
  ::v-deep .v-select__selections {
    min-width: 80%;
    font-size: 18px !important;
  }
  ::v-deep .fat-water-contrast .v-select__selections {
    min-width: 66% !important;
  }
  .text-1 {
    margin-bottom: 6px;
  }
}

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #F2A14A !important;
}
</style>
