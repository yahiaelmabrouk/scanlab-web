<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <div class="main-1 mt-4">
        <div class="main-2">
          <div class="text-1">
            <label
              class="label-size"
              :class="{
                'active-label': activeInputs.accelerationMode,
                'inactive-label': !activeInputs.accelerationMode,
              }"
            >
              Acceleration Mode
            </label>
            <v-select
              :value="selectedAcceleration"
              :items="updatedAccelerationOptions"
              color="#423c3c"
              dense
              outlined
              style="max-width: 38%"
              @change="updateSelectedAcceleration"
            ></v-select>
          </div>
          <div class="text-1" v-if="selectedAcceleration !== 'Off'">
            <label class="label-size inactive-label">Reference Scans</label>
            <v-select
              v-model="referenceScans"
              :items="referenceScansOptions"
              color="#423c3c"
              dense
              outlined
              style="max-width: 38%"
              @change="updateReferenceScans"
            ></v-select>
          </div>
          <div class="text-1" v-if="selectedAcceleration !== 'Off'">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.parrallelFactor, 'inactive-label': !activeInputs.parallelFactor }"
            >
              Acceleration Factor PE
            </label>
            <div class="text-input">
              <SpinButton
                :type="'number'"
                v-model.number="formattedParallelFactor"
                :min="1"
                :max="3"
                :step="1"
                placeholder="Accel factor PE"
                color="#423c3c"
                @input="updateAccelFactorPE"
              />
            </div>
          </div>
          <div class="text-1" v-if="selectedAcceleration !== 'Off'">
            <label class="label-size inactive-label">Reference Lines PE </label>
            <div class="text-input">
              <SpinButton
                class="spinner"
                :type="'number'"
                :step="1"
                :min="1"
                :max="100"
                v-model.number="referenceLines"
                @input="changeReferenceLines"
                :disabled="complete"
              />
            </div>
          </div>

          <div v-if="selectedAcceleration !== 'Off'">
            <div class="text-1" v-if="selectedAcceleration === 'Caipi'">
              <label class="label-size inactive-label">Mode</label>

              <v-select
                v-model="mode"
                :items="caipiModeOptions"
                color="#423c3c"
                dense
                outlined
                style="max-width: 38%"
                @change="updateMode"
              ></v-select>
            </div>
            <div class="text-1" v-if="selectedAcceleration === 'Caipi'">
              <label class="label-size inactive-label">Acceleration Factor 3D</label>
              <div class="text-input">
                <SpinButton
                  :type="number"
                  v-model="accelFactor3D"
                  :min="2"
                  :max="4"
                  placeholder="Accel factor 3D"
                  color="#423c3c"
                  @input="updateAccelFactor3D"
                />
              </div>
            </div>
            <div class="text-1" v-if="selectedAcceleration === 'Caipi'">
              <label class="label-size inactive-label">3D Shift</label>
              <div class="text-input">
                <SpinButton
                  :type="number"
                  v-model="shift3D"
                  :min="0"
                  :max="2"
                  placeholder="3D Shift"
                  color="#423c3c"
                  @input="updateShift3D"
                />
              </div>
            </div>
          </div>
          <div class="text-1" v-if="selectedAcceleration === 'SMS'">
            <label class="label-size inactive-label">SMS Factor</label>
            <div class="text-input">
              <SpinButton
                :type="number"
                v-model="SMSFactor"
                :min="2"
                :max="4"
                placeholder="SMS factor"
                color="#423c3c"
                @input="updateSMSFactor"
              />
            </div>
          </div>
          <div class="text-1" v-if="selectedAcceleration === 'SMS'">
            <label class="label-size inactive-label">FOV Shift Factor</label>
            <div class="text-input">
              <SpinButton
                :type="number"
                v-model="fovShift"
                :min="1"
                :max="4"
                placeholder="FOV Shift"
                @input="updateFovShift"
              />
            </div>
          </div>
        </div>
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Deep Resolve</label>
            <v-select
              color="#423c3c"
              :items="deepResolveOptions"
              v-model="deepResolve"
              dense
              outlined
              style="max-width: 38%"
              @change="updateDeepResolve"
            ></v-select>
          </div>
          <div class="text-1 mt-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.partialFourier, 'inactive-label': !activeInputs.partialFourier }"
            >
              Phase Partial Fourier
            </label>
            <v-select
              color="#423c3c"
              :items="phasePartialFourierOptions"
              v-model="selectionConfig.partialFourier"
              dense
              outlined
              style="max-width: 38%"
            ></v-select>
          </div>
          <div v-if="phasePartialFourier !== 'Allowed'">
            <div class="text-1 mt-3" hidden>
              <label class="label-size inactive-label">Slice Partial Fourier</label>
              <v-select
                v-model="slicePartialFourier"
                :items="slicePartialFourierOptions"
                dense
                outlined
                color="#423c3c"
                style="max-width: 38%"
                @change="updateSlicePartialFourier"
              ></v-select>
            </div>
            <div class="text-1 mt-3" v-if="selectionConfig.sequenceType === 'GRE'">
              <label class="label-size inactive-label">Readout Partial Fourier</label>
              <v-select
                v-model="readoutPartialFourier"
                :items="readoutPartialFourierOptions"
                dense
                outlined
                color="#423c3c"
                style="max-width: 38%"
                @change="updateReadoutPartialFourier"
              ></v-select>
            </div>
            <div class="text-1 mt-3">
              <label class="label-size inactive-label">Asymmetric Echo</label>
              <v-select
                v-model="asymmetricEcho"
                :items="asymmetricEchoOptions"
                dense
                outlined
                color="#423c3c"
                style="max-width: 38%"
                @change="updateAsymmetricEcho"
              ></v-select>
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
        <v-col class="disabled-div hidden" style="margin-left: auto; margin-right: 20px">
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
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import SpinButton from './SpinButton.vue'
import { MriMixin } from '../Mixins/MriMixin.js'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  mixins: [MriMixin, SelectionConfigMixin],
  name: 'ResolutionAcceleration',
  components: { SpinButton },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      caipiModeOptions: ['Axial', 'Cor Body', 'Free'],
      referenceScansOptions: ['Integrated', 'TSE/Separate', 'GRE Separate'],
      acceleration: ['Off', 'Grappa', 'M-Sense', 'Caipi', 'SMS', 'CS'],
      deepResolveOptions: ['Off', 'On'],
      phasePartialFourierOptions: ['Off', '6/8', '7/8'],
      slicePartialFourierOptions: ['Off', '5/8', '6/8', '7/8'],
      readoutPartialFourierOptions: ['Off', 'Weak', 'Strong'],
      asymmetricEchoOptions: ['Off', 'Allowed'],
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
      'updateParallelFactor',
      'updateAccelFactorPE',
      'updateSelectedAcceleration',
      'updateReferenceScans',
      'updateAccelFactor3D',
      'updateShift3D',
      'updateDeepResolve',
      'updatePhasePartialFourier',
      'updateSlicePartialFourier',
      'updateReadoutPartialFourier',
      'updateAsymmetricEcho',
      'updateSMSFactor',
      'updateFovShift',
      'updateReferenceLines',
      'updateMode',
    ]),
    updateAccelFactorPE(value) {
      this.updateParallelFactor(value)
      this.parallelFactor = value === 1 ? 'Off' : value
    },
    changeAccelerationFactor(value) {
      this.accelerationFactor = value
    },
    // changeReferenceLines(value) {
    //   this.referenceLines = value
    // },
    changeReferenceLines(value) {
      this.updateReferenceLines(value)
    },
    onAccelerationChange() {
      this.referenceScans = ''
      this.accelFactor = 2
      this.mode = ''
      this.accelFactorPE = 2
      this.accelFactor3D = 2
      this.shift3D = 1
      this.deepResolve = 'Off'
      this.PhasePartialFourier = 'Off'

      if (this.selectedAcceleration === 'Grappa') {
        this.accelFactor = 2
      } else if (this.selectedAcceleration === 'Caipi') {
        this.mode = 'Axial'
        this.accelFactorPE = 2
        this.accelFactor3D = 2
        this.shift3D = 1
      }
    },
    initializeSelectedAcceleration() {
      if (this.selectionConfig?.parallelFactor === 2) {
        this.updateAccelFactorPE(2)
        this.updateSelectedAcceleration('Grappa')
      } else {
        this.updateAccelFactorPE(1)
        this.updateSelectedAcceleration('Off')
      }
    },
  },
  computed: {
    ...mapState('selectionConfig', ['isAddLocalizerMode']),

    updatedAccelerationOptions() {
      if (this.softwareVersionPreference === 'b19') {
        return ['Off', 'Grappa', 'M-Sense']
      } else {
        return ['Off', 'Grappa', 'M-Sense', 'Caipi', 'SMS', 'CS']
      }
    },
    formattedParallelFactor: {
      get() {
        return this.parallelFactor === 'Off' ? 1 : this.parallelFactor
      },
      set(value) {
        this.parallelFactor = value === 1 ? 'Off' : value
      },
    },
    ...mapState('scanTimeConfig', [
      'selectedAcceleration',
      'referenceScans',
      'accelFactorPE',
      'accelFactor3D',
      'shift3D',
      'deepResolve',
      'phasePartialFourier',
      'slicePartialFourier',
      'readoutPartialFourier',
      'asymmetricEcho',
      'SMSFactor',
      'fovShift',
      'referenceLines',
      'mode',
    ]),
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
  mounted() {
    this.initializeSelectedAcceleration()
  },
  watch: {
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
    */
    selectedAcceleration(newVal) {
      if (newVal === 'Off') {
        this.formattedParallelFactor = 1
      } else if (newVal === 'Grappa') {
        this.formattedParallelFactor = 2
      }
    },
    formattedParallelFactor(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.selectionConfig.parallelFactor = this.parallelFactor
        this.updateAccelFactorPE(newVal)
      }
    },
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
.text-input {
  max-width: 38%;
  width: 38%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1.6rem !important;
  border-bottom: none;
}

.text-2 {
  display: flex;
  flex-direction: column;
  justify-content: end;
  width: 50%;
}

.v-btn {
  font-size: 11px !important;
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
  width: 18.75%;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
  border-radius: 4px;
  background: #383535;
  border-color: #383535;
}

::v-deep .v-text-field__details {
  display: none;
}

label {
  font-size: 90%;
}

.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

.v-input--is-focused {
  display: block !important;
}

.text-1 {
  display: flex;
  justify-content: space-evenly;
  color: white;
  margin-bottom: 10px;
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

.v-text-field {
  padding-top: 0px;
  margin-top: 0px;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0px;
  width: 100% !important;
}

::v-deep .v-icon.v-icon {
  color: white !important;
  height: 12px !important;
}

.v-input {
  max-width: 37%;
}

::v-deep .v-text-field input {
  padding: 0px;
}

::v-deep .v-input__icon {
  height: 10px !important;
}

.btn-2 {
  width: 11% !important;
  height: 33px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #423c3c !important;
}

::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: 0px !important;
}

.main-1 {
  display: flex;
  justify-content: space-around;
  background-color: rgb(46, 44, 44) !important;
}

.main-2 {
  color: white !important;
  width: 50%;
}

.btn-1 {
  display: flex;
  width: 66.75%;
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

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}

.snr-icon-btn {
  background: black !important;
  border: none !important;
  width: auto !important;
}

[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}

input[disabled] {
  cursor: not-allowed;
  opacity: 0.6 !important;
}

.active-label {
  color: white; /* White color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}
</style>
