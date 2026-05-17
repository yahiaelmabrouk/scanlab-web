<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="90%" width="100%">
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
                  <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                  <span class="new-value">{{ formatValue(group.sourceChange.newValue) }}</span>
                </div>

                <!-- Affected parameter changes -->
                <div v-for="(affected, idx) in group.affectedChanges" :key="idx" class="affected-change">
                  <div class="affected-label">Will update {{ affected.label }}:</div>
                  <div class="change-row">
                    <span class="old-value">{{ formatValue(affected.oldValue) }}</span>
                    <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                    <span class="new-value">{{ formatValue(affected.newValue) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </div>

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
        <div class="main-2 my-2">
          <div class="text-1">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.dimensions3y, 'inactive-label': !activeInputs.dimensions3y }"
            >
              FoV Read
            </label>
            <BspinButton
              class="input-lock"
              @input="submitDimensions3y"
              :type="'number'"
              v-model.number="dimensions3y"
              :step="1"
              :min="1"
              :max="500"
              :disabled="complete || isAddLocalizerMode"
            />
            <span class="mx-2">mm</span>
          </div>

          <div class="text-1">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.dimensions3x, 'inactive-label': !activeInputs.dimensions3x }"
            >
              FoV Phase
            </label>
            <BspinButton
              class="input-lock"
              @input="submitDimensions3x"
              :type="'number'"
              v-model.number="dimensions3x"
              :step="1"
              :min="1"
              :max="500"
              :disabled="complete || isAddLocalizerMode"
            />
            <span class="mx-2">%</span>
          </div>
          <div class="text-1">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.thickness, 'inactive-label': !activeInputs.thickness }"
            >
              Slice Thickess
            </label>
            <BspinButton
              class="input-lock"
              @input="submitThickness"
              :type="'number'"
              :value="thickness"
              v-model.number="thickness"
              :step="0.5"
              :min="0"
              :max="50"
              :disabled="complete"
            />
            <span class="mx-2">mm</span>
          </div>

          <div class="text-1">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.frequencyMatrix, 'inactive-label': !activeInputs.frequencyMatrix }"
            >
              Base Resolution
            </label>
            <BspinButton
              class="input-lock"
              :step="32"
              :min="64"
              :max="512"
              :value="frequencyMatrix"
              @input="changeSpin($event, 'frequencyMatrix')"
              :disabled="complete"
            />
          </div>
          <div class="text-1">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.phaseMatrix, 'inactive-label': !activeInputs.phaseMatrix }"
            >
              Phase Resolution
            </label>
            <BspinButton
              class="input-lock"
              :step="stepForPhaseMatrix"
              :min="0"
              :max="maxPhaseMatrix"
              :value="phaseMatrix"
              :id="'phase_tooltip' + selectionIdent"
              @input="changeSpin($event, 'phaseMatrix')"
            />
            <b-tooltip :target="'phase_tooltip' + selectionIdent" triggers="hover"> {{ phaseMatrixTooltip }}</b-tooltip>
            <span class="mx-2">%</span>
          </div>
          <div class="text-1 mt-10">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.partialFourier, 'inactive-label': !activeInputs.partialFourier }"
            >
              Phase Partial Fourier
            </label>
            <div class="text-2">
              <v-select
                color="#423c3c"
                :items="phasePartialFourierOptions"
                v-model="selectionConfig.partialFourier"
                dense
                outlined
                style="width: 16.5vw; max-width: 45%; margin-left: 4%"
              ></v-select>
            </div>
          </div>
        </div>
        <div class="main-3">
          <div class="text-1">
            <div class="text-1" style="margin: 52% 0% 0% 67%">
              <label class="label-size inactive-label">Interpolation</label>
              <checkbox />
            </div>
          </div>
        </div>
      </div>
      <!-- <v-row class="justify-end mt-2" v-if="!isTakingTest">
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
      <!-- <div class="main-1">
        <div class="bottom-card"></div>
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
import _ from 'lodash'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  name: 'BresolutionCommon',
  mixins: [SelectionConfigMixin],
  components: { BspinButton, checkbox },
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
    paramHints: {
      type: Array,
      required: false,
      default: () => [],
    },
    useInitialUltraLabDefaults: {
      type: Boolean,
      required: false,
      default: true,
    },
    sequenceType: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      //baseResolution: 0,
      phasePartialFourierOptions: ['Off', '6/8', '7/8'],
      Interpolation: false,
    }
  },
  methods: {
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
    //...mapActions('dataToParent', ['updateScanTime']),
    /*
    increaseNumber() {
      this.baseResolution++
    },
    decreaseNumber() {
      if (this.baseResolution > 0) {
        this.baseResolution--
      }
    },
    */

    /*
    handleDimensions3y(event) {
      this.submitDimensions3y(event)
      this.updateDimensions3y(event)
    },
    handleDimensions3x(event) {
      this.submitDimensions3x(event)
      this.updateDimensions3x(event)
    },
    // Method to update phase matrix
    updatePhaseMatrix(value) {
      this.$store.dispatch('scanTimeConfig/updatePhaseMatrix', value)
    },

    // Method to update frequency matrix
    updateFrequencyMatrix(value) {
      this.$store.dispatch('scanTimeConfig/updateFrequencyMatrix', value)
    },

    // Method to update dimensions 3x
    updateDimensions3x(value) {
      this.$store.dispatch('scanTimeConfig/updateDimensions3x', value)
    },

    // Method to update dimensions 3y
    updateDimensions3y(value) {
      this.$store.dispatch('scanTimeConfig/updateDimensions3y', value)
    },
    // Method to update echo train length
    updateEchoTrainLength(value) {
      this.$store.dispatch('scanTimeConfig/updateEchoTrainLength', value)
    },

    // Method to update vendor style preference
    updateVendorStylePreference(value) {
      this.$store.dispatch('scanTimeConfig/updateVendorStylePreference', value)
    },

    // Method to update is UltraLab
    updateIsUltraLab(value) {
      this.$store.dispatch('scanTimeConfig/updateIsUltraLab', value)
    },

    // Method to update selection ident
    updateSelectionIdent(value) {
      this.$store.dispatch('scanTimeConfig/updateSelectionIdent', value)
    },
    */
    updateTrueResolutionHeaderUltra(value) {
      this.$store.dispatch('scanTimeConfig/updateTrueResolutionHeaderUltra', value)
    },
    updateTrueResolutionHeader(value) {
      this.$store.dispatch('scanTimeConfig/updateTrueResolutionHeader', value)
    },
    updateAcquiredResolutionHeader(value) {
      this.$store.dispatch('scanTimeConfig/updateAcquiredResolutionHeader', value)
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
    /*
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
  */
    // Override mixin to always show phase matrix as percentage (consistent with ResolutionCommon.vue)
    stepForPhaseMatrix() {
      return 1
    },
    maxPhaseMatrix() {
      return 100
    },
    phaseVoxelSize() {
      // Use raw stored matrix value (like Siemens in the mixin)
      const phaseMatrix = _.get(this.selectionConfig, 'phaseMatrix')
      if (!phaseMatrix) return 0
      let val = this.dimensions3x / phaseMatrix
      val = _.round((val / 100) * this.dimensions3y, 2)
      return _.round(val, 2)
    },
    phaseMatrixTooltip() {
      // Use raw stored matrix value for tooltip display
      const phaseMatrix = _.get(this.selectionConfig, 'phaseMatrix')
      return this.frequencyMatrix + ' x ' + phaseMatrix
    },
    frequencyMatrix: {
      get() {
        return _.get(this.selectionConfig, 'frequencyMatrix')
      },
      set(frequencyMatrix) {
        const frequencyVoxelSize = this.dimensions3y / frequencyMatrix
        const prevPhaseMatrix = this.phaseMatrix // save this value to apply later
        this.selectionConfig.frequencyVoxelSize = this.isEditingQuestion
          ? this.forcedFrequencyVoxelSize
          : frequencyVoxelSize
        this.selectionConfig.frequencyMatrix = frequencyMatrix

        // readjust phase matrix to have the same % value as freq. matrix changes
        this.phaseMatrix = prevPhaseMatrix
      },
    },
    phaseMatrix: {
      get() {
        let output = _.get(this.selectionConfig, 'phaseMatrix')
        // convert to % from matrix units
        // Phase matrix % is relative to (frequencyMatrix × phaseFoV%)
        const dimensions3x = _.get(this.selectionConfig, 'dimensions3.x')
        const dimensions3y = _.get(this.selectionConfig, 'dimensions3.y')
        const phaseFovPercent = dimensions3x / dimensions3y
        const baseMatrix = this.frequencyMatrix * phaseFovPercent
        // Round to nearest whole number (0 decimal places) for percentage display
        output = output !== 0 && baseMatrix !== 0 ? _.round((output / baseMatrix) * 100, 0) : 0
        // Cap at 100% - phase matrix cannot exceed base matrix
        return Math.min(output, 100)
      },
      set(phaseMatrix) {
        // Store the intended percentage BEFORE conversion to preserve user intent
        this.selectionConfig.intendedPhaseMatrixPercent = phaseMatrix

        // convert from % to matrix units
        // Calculate base matrix from Phase FoV: baseMatrix = frequencyMatrix × (phaseFoV%)
        const dimensions3x = _.get(this.selectionConfig, 'dimensions3.x')
        const dimensions3y = _.get(this.selectionConfig, 'dimensions3.y')
        const phaseFovPercent = dimensions3x / dimensions3y
        const baseMatrix = this.frequencyMatrix * phaseFovPercent
        const input = Math.floor(baseMatrix * (phaseMatrix / 100))
        this.selectionConfig.phaseMatrix = input
      },
    },
    /*
    oversampling: {
      // 0.0 - 1.0, where 1.0 means each side of oversampling is as wide as 0.5*Phase(aka Dim3.x), so both sides added together would be as wide as Phase
      get() {
        return _.get(this.selectionConfig, 'oversampling')
      },
      set(oversampling) {
        this.oversamplingLocal = oversampling
      },
    },
    spacing: {
      get() {
        let output = _.get(this.selectionConfig, 'spacing')
        if (this.isUltraLab && this.vendorStylePreference === 'siemens' && !this.isAddLocalizerMode) {
          // convert mm to %
          output = output !== 0 ? _.round((output / this.thickness) * 100) : 0
        }
        return output
      },
      set(spacing) {
        let input = spacing
        if (this.isUltraLab && this.vendorStylePreference === 'siemens' && !this.isAddLocalizerMode) {
          // convert % to mm
          input = _.round((this.thickness / 100) * input, 2)
        }
        this.spacingLocal = input
      },
    },
    thickness: {
      get() {
        const val = _.get(this.selectionConfig, 'thickness')
        return val
      },
      set(thickness) {
        this.thicknessLocal = thickness
      },
    },
    */
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
    // Auto-adjust phase matrix when Phase FoV changes (consistent with ResolutionCommon.vue)
    'selectionConfig.dimensions3.x': {
      handler(newDimensions3x, oldDimensions3x) {
        // Auto-adjust phase matrix to maintain displayed percentage when Phase FoV changes
        if (
          !this.selectionConfig ||
          !oldDimensions3x ||
          newDimensions3x === oldDimensions3x
        ) {
          return
        }

        const dimensions3y = _.get(this.selectionConfig, 'dimensions3.y')
        const storedPhaseMatrix = _.get(this.selectionConfig, 'phaseMatrix')

        // Use stored intended percentage if available, otherwise calculate from stored value
        let currentPhaseMatrixPercent = _.get(this.selectionConfig, 'intendedPhaseMatrixPercent')
        if (!currentPhaseMatrixPercent) {
          // Fallback: calculate from current stored value
          const oldPhaseFovPercent = oldDimensions3x / dimensions3y
          const oldBaseMatrix = this.frequencyMatrix * oldPhaseFovPercent
          currentPhaseMatrixPercent =
            storedPhaseMatrix !== 0 && oldBaseMatrix !== 0 ? (storedPhaseMatrix / oldBaseMatrix) * 100 : 0
        }

        // Calculate new stored value using intended percentage
        const newPhaseFovPercent = newDimensions3x / dimensions3y
        const newBaseMatrix = this.frequencyMatrix * newPhaseFovPercent
        let newStoredValue = Math.floor(newBaseMatrix * (currentPhaseMatrixPercent / 100))

        // Cap at baseMatrix (100%)
        newStoredValue = Math.min(newStoredValue, newBaseMatrix)

        // Update stored value AND preserve intended percentage
        this.selectionConfig.phaseMatrix = newStoredValue
        this.selectionConfig.intendedPhaseMatrixPercent = currentPhaseMatrixPercent
      },
      immediate: false,
    },
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },

    numberOfSlices(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateSlices(newVal)
        // this.emitData()
      }
    },
    oversamplingPercentage(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateOversampling(newVal)
        // this.emitData()
      }
    },
    repetitionTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateRepetition(newVal)
        // this.emitData()
      }
    },
    echoTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateEchoTime(newVal)
        // this.emitData()
      }
    },
    dimensions3x(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateDimensions3x(newVal)
        // this.emitData()
      }
    },
    dimensions3y(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateDimensions3y(newVal)
        // this.emitData()
      }
    },
    averages(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateAverages(newVal)
        // this.emitData()
      }
    },
    echoTrainLength(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateEchoTrainLength(newVal)
        // this.emitData()
      }
    },
    concatenations(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateConcatenations(newVal)
        // this.emitData()
      }
    },
    partialFourier(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updatePartialFourier(newVal)
        // this.emitData()
      }
    },
    frequencyMatrix(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateFrequencyMatrix(newVal)
        // this.emitData()
      }
    },
    phaseMatrix(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updatePhaseMatrix(newVal)
        // this.emitData()
      }
    },
    parallelFactor(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateParallelFactor(newVal)
        // this.emitData()
      }
    },
    phaseEncodingLines(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updatePhaseEncodingLines(newVal)
        // this.emitData()
      }
    },
    flipAngle(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateFlipAngle(newVal)
        // this.emitData()
      }
    },
    */
    trueResolutionHeaderUltra(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateTrueResolutionHeaderUltra(newVal)
      }
    },
    trueResolutionHeader(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateTrueResolutionHeader(newVal)
      }
    },
    acquiredResolutionHeader(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateAcquiredResolutionHeader(newVal)
      }
    },
  },
  mounted() {
    console.log('oversampling', this.oversampling)

    /*
    this.updateRepetitionTime(this.repetitionTime)
    this.updateEchoTime(this.echoTime)
    this.updateFlipAngle(this.flipAngle)
    this.updateSlices(this.numberOfSlices)
    this.updatePhaseEncodingLines(this.phaseEncodingLines)
    // this.updateParallelFactor(this.parallelFactor)
    this.updateOversampling(this.oversamplingPercentage)
    this.updatePhaseMatrix(this.phaseMatrix)
    this.updateFrequencyMatrix(this.frequencyMatrix)
    this.updateDimensions3x(this.dimensions3x)
    this.updateDimensions3y(this.dimensions3y)
    this.updatePartialFourier(this.echoTime)
    this.updateAverages(this.averages)
    this.updateConcatenations(this.concatenations)
    this.updateEchoTrainLength(this.echoTrainLength)
    this.updateVendorStylePreference(this.vendorStylePreference)
    this.updateIsUltraLab(this.isUltraLab)
    this.updateSelectionIdent(this.selectionIdent)

    console.log('trueResolutionHeaderUltra====', this.trueResolutionHeaderUltra)
    console.log('trueResolutionHeader====', this.trueResolutionHeader)
    console.log('acquiredResolutionHeader====', this.acquiredResolutionHeader)

    // Replace direct function calls with method calls from the component
    this.updateTrueResolutionHeaderUltra(this.trueResolutionHeaderUltra)
    this.updateTrueResolutionHeader(this.trueResolutionHeader)
    this.updateAcquiredResolutionHeader(this.acquiredResolutionHeader)
    */

    // this.emitData()
  },
}
</script>

<style scoped>
.bottom-card {
  position: relative;
  bottom: 4px;
  left: 34%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  border: 2px solid black;
  margin-top: 7%;
}
.v-input--is-focused {
  display: block !important;
}
.label-size {
  width: 25%;
  display: flex;
  justify-content: right;
}
::v-deep .v-icon.v-icon {
  font-size: 17px;
}
label,
span {
  font-size: 80%;
}
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.35rem;
  width: 25%;
  margin-left: 2%;
}
.text-1 {
  display: flex;
  color: black;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

label {
  font-size: 80%;
}
::v-deep .v-text-field__details {
  display: none;
}
.text-2 {
  display: flex;
}
::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
}
::v-deep.v-input__slot {
  margin-bottom: 0px;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px !important;
}
::v-deep .v-input__icon {
  height: 20px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
}
::v-deep.v-text-field.v-text-field--enclosed .v-text-field__details {
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

::v-deep .v-icon.v-icon {
  color: black !important;
}
.v-input {
  max-width: 30%;
  margin-left: 1rem;
}
::v-deep .v-text-field input {
  padding: 0px;
}
.main-1 {
  display: flex;
  justify-content: space-around;
}
.main-2 {
  color: white !important;
  width: 60%;
}
.main-3 {
  color: white !important;
  width: 40%;
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

/* routine css  */
.text-input {
  max-width: 100%;
  width: 38%;
  margin-left: 2%;
  border-radius: 0px !important;
  height: 1rem !important;
  border-bottom: none;
}

::v-deep .theme--light.v-select .v-select__selections {
  font-size: 12px !important;
}
.v-select.v-input--dense .v-select__selection--comma {
  margin: 0px 1px 4px 0;
}

::v-deep.v-btn:not(.v-btn--round).v-size--default {
  min-width: 162px;
}
label,
span {
  color: black;
  font-size: 80%;
}

::v-deep .v-input__icon {
  height: 20px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
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
  background: white !important;
  border-color: white !important;
  border-radius: 0px;
}

::v-deep .v-input__slot fieldset {
  background: white;
  border-color: white !important;
  border-radius: 0px;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  font-size: 17px;
}

.v-input {
  max-width: 30%;
  border-radius: 0px;
}

::v-deep .v-text-field input {
  padding: 0px;
}
::v-deep .v-text-field--outlined fieldset {
  bottom: 5px !important;
  right: 10px;
  top: 0px !important;
}

.main-1 {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.main-2 {
  width: 50%;
  color: white !important;
}

.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
  height: 86%;
}

.v-sheet.v-card {
  border-radius: 0px;
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
.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
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
@media (max-width: 1800px) {
  .bottom-card {
    left: 35%;

    margin-top: 15%;
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

.full-height-dialog .v-card__actions {
  flex: 0 0 auto;
  padding: 16px;
}

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #F2A14A !important;
}
</style>
