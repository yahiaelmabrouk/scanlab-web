<template>
  <div>
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
          <div class="main-3">
            <div class="text-1 mb-4">
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
                style="max-width: 40.5%"
                @change="updateFatOptions"
              ></v-select>
            </div>
            <div class="text-1 mb-4">
              <label
                class="label-size"
                :class="{
                  'active-label': activeInputs.magnPreparation,
                  'inactive-label': !activeInputs.magnPreparation,
                }"
              >
                Magn.Preparation
              </label>

              <v-select
                v-model="selectedMagnItems"
                :items="getMagnItems"
                color="#423c3c"
                dense
                outlined
                style="width: 12.5vw; max-width: 40.5%; margin-left: 2%"
              ></v-select>
            </div>
            <div v-if="selectedMagnItems !== 'Off'" class="text-1">
              <label
                class="label-size"
                :class="{ 'active-label': activeInputs.inversionTime, 'inactive-label': !activeInputs.inversionTime }"
              >
                TI
              </label>
              <div class="text-input">
                <SpinButton
                  :type="'number'"
                  v-model.number="inversionTime"
                  :step="1"
                  :min="1"
                  :max="15000"
                  :disabled="complete"
                />
              </div>
              <span class="mx-3">ms</span>
            </div>

            <div class="text-1 my-4">
              <label class="label-size inactive-label">Dark Blood</label>
              <v-checkbox />
            </div>
          </div>

          <div class="main-2">
            <div>
              <div class="text-1">
                <label
                  class="label-size"
                  :class="{ 'active-label': activeInputs.dimensions3y, 'inactive-label': !activeInputs.dimensions3y }"
                >
                  FoV Read
                </label>
                <div class="text-input">
                  <SpinButton
                    @input="submitDimensions3y"
                    :type="'number'"
                    v-model.number="dimensions3y"
                    :step="1"
                    :min="1"
                    :max="500"
                    :disabled="complete || isAddLocalizerMode"
                  />
                </div>
                <span class="mx-2">mm</span>
              </div>
              <div class="text-1">
                <label
                  class="label-size"
                  :class="{ 'active-label': activeInputs.dimensions3x, 'inactive-label': !activeInputs.dimensions3x }"
                >
                  FoV Phase
                </label>
                <div class="text-input">
                  <SpinButton
                    @input="submitDimensions3x"
                    :type="'number'"
                    v-model.number="dimensions3x"
                    :step="1"
                    :min="1"
                    :max="500"
                    :disabled="complete || isAddLocalizerMode"
                  />
                </div>
                <span class="mx-2">%</span>
              </div>

              <div class="text-1">
                <label
                  class="label-size"
                  :class="{ 'active-label': activeInputs.phaseMatrix, 'inactive-label': !activeInputs.phaseMatrix }"
                >
                  Phase Resolution
                </label>
                <!-- <v-text-field type="number" variant="outlined" density="compact" style="max-width: 30%; margin-left: 2%"
                  >></v-text-field
                > -->
                <div class="text-input">
                  <SpinButton
                    :step="stepForPhaseMatrix"
                    :min="0"
                    :max="maxPhaseMatrix"
                    :value="phaseMatrix"
                    :id="'phase_tooltip' + selectionIdent"
                    @input="changeSpin($event, 'phaseMatrix')"
                  />
                </div>
                <b-tooltip :target="'phase_tooltip' + selectionIdent" triggers="hover">{{ phaseMatrixTooltip }}</b-tooltip>
                <span class="mx-2">%</span>
              </div>
            </div>
            <div>
              <div class="text-1">
                <label class="label-size inactive-label">Motion Correction</label>

                <v-select
                  :items="motionCorrection"
                  v-model="selectedMotionCrr"
                  color="#423c3c"
                  dense
                  outlined
                  style="width: 12.5vw; max-width: 40%; margin-left: 2%"
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
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import { MriMixin } from '../Mixins/MriMixin.js'
import SpinButton from './SpinButton.vue'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'
import _ from 'lodash'

export default {
  mixins: [SelectionConfigMixin],
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
      selectedMotionCrr: 'Off',
      motionCorrection: [
        { text: 'Off', value: 'off' },
        { text: 'On', value: 'on' },
      ],
    }
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
      'updateOversampling',
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
      'updateSelectedFatOptions',
      'updateTrueResolutionHeaderUltra',
      'updateTrueResolutionHeader',
      'updateAcquiredResolutionHeader',
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
    updateMagnItems(value) {
      if (value === 'Off') {
        this.inversionTime = 0
        this.inversionRecovery = false
      } else {
        this.inversionRecovery = true
      }
      this.$store.dispatch('scanTimeConfig/updateMagnItems', value)
    },
    handleOversampling(event) {
      this.submitOversampling(event)
      // this.updateOversampling(event)
    },
    handleSlices(event) {
      this.submitNumberOfSlices(event)
      this.updateSlices(event)
    },
    handleDimensions3y(event) {
      this.submitDimensions3y(event)
      this.updateDimensions3y(event)
    },
    handleDimensions3x(event) {
      this.submitDimensions3x(event)
      this.updateDimensions3x(event)
    },
    handleRepetitionTime(event) {
      this.updateRepetition(event)
    },
    handleEchoTime(event) {
      this.updateEchoTime(event)
    },
    handleAverages(event) {
      this.updateAverages(event)
    },
    handleConcatenations(event) {
      this.updateConcatenations(event)
    },

    updateRepetition(value) {
      console.log('updateRepetition==', value)

      this.$store.dispatch('scanTimeConfig/updateRepetitionTime', value)
    },

    updateEchoTime(value) {
      console.log('updateEchoTime==', value)

      this.$store.dispatch('scanTimeConfig/updateEchoTime', value)
    },

    updateFlipAngle(value) {
      console.log('updateFlipAngle==', value)

      this.$store.dispatch('scanTimeConfig/updateFlipAngle', value)
    },

    updateSlices(value) {
      console.log('updateSlices==', value)

      this.$store.dispatch('scanTimeConfig/updateSlices', value)
    },

    updatePhaseEncodingLines(value) {
      this.$store.dispatch('scanTimeConfig/updatePhaseEncodingLines', value)
    },

    updateParallelFactor(value) {
      this.$store.dispatch('scanTimeConfig/updateParallelFactor', value)
    },

    updateOversampling(value) {
      this.$store.dispatch('scanTimeConfig/updateOversampling', value)
    },

    updatePhaseMatrix(value) {
      this.$store.dispatch('scanTimeConfig/updatePhaseMatrix', value)
    },

    updateFrequencyMatrix(value) {
      this.$store.dispatch('scanTimeConfig/updateFrequencyMatrix', value)
    },

    updateDimensions3x(value) {
      this.$store.dispatch('scanTimeConfig/updateDimensions3x', value)
    },

    updateDimensions3y(value) {
      this.$store.dispatch('scanTimeConfig/updateDimensions3y', value)
    },

    updatePartialFourier(value) {
      this.$store.dispatch('scanTimeConfig/updatePartialFourier', value)
    },

    updateAverages(value) {
      this.$store.dispatch('scanTimeConfig/updateAverages', value)
    },

    updateConcatenations(value) {
      this.$store.dispatch('scanTimeConfig/updateConcatenations', value)
    },

    updateEchoTrainLength(value) {
      this.$store.dispatch('scanTimeConfig/updateEchoTrainLength', value)
    },

    updateVendorStylePreference(value) {
      this.$store.dispatch('scanTimeConfig/updateVendorStylePreference', value)
    },

    updateIsUltraLab(value) {
      this.$store.dispatch('scanTimeConfig/updateIsUltraLab', value)
    },

    updateSelectionIdent(value) {
      this.$store.dispatch('scanTimeConfig/updateSelectionIdent', value)
    },
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
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    //...mapState('scanTimeConfig', ['selectedMagnItems', 'selectedFetOptions', 'Fetoptions']),
    ...mapState('scanTimeConfig', ['selectedFatOptions', 'fatOptions']),
    ...mapGetters('scanTimeConfig', ['getselectedMagnItems', 'getMagnItems']),
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
        if (value === 'Off') {
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
      return activeLabelUtil(labType)
    },
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
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
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
      }
    },
    oversamplingPercentage(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateOversampling(newVal)
      }
    },
    repetitionTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateRepetition(newVal)
      }
    },
    inversionTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateSeqValues()
      }
    },
    echoTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateEchoTime(newVal)
      }
    },
    dimensions3x(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateDimensions3x(newVal)
      }
    },
    dimensions3y(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateDimensions3y(newVal)
      }
    },
    averages(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateAverages(newVal)
      }
    },
    echoTrainLength(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateEchoTrainLength(newVal)
      }
    },
    concatenations(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateConcatenations(newVal)
      }
    },
    partialFourier(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updatePartialFourier(newVal)
      }
    },
    frequencyMatrix(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateFrequencyMatrix(newVal)
      }
    },
    phaseMatrix(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updatePhaseMatrix(newVal)
      }
    },
    parallelFactor(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateParallelFactor(newVal)
      }
    },
    phaseEncodingLines(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updatePhaseEncodingLines(newVal)
      }
    },
    flipAngle(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateFlipAngle(newVal)
      }
    },
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
    */
  },
  mounted() {
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

/* UPDATED BY ME */
::v-deep .v-input__slot fieldset {
  height: 35px;
}

::v-deep .spin-btn-grp {
  height: 30px;
}

::v-deep .spin-btn button {
  height: 13px !important;
}

::v-deep .v-input--selection-controls__input .v-icon {
  justify-content: start !important;
}
/* END */

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
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}

::v-deep .v-select.v-input--dense .v-select__selection--comma {
  color: white;
  font-size: small;
  text-align: right;
}
.text-input {
  max-width: 38%;
  width: 38%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1.9rem !important;
  margin-bottom: 10px;
  border-bottom: none;
}
::v-deep .v-icon.v-icon {
  font-size: 17px;
}

::v-deep .v-card__text {
  height: 100% !important;
  /* position: absolute !important; */
  top: 0px !important;
  bottom: 0 !important;
}
::v-deep .v-text-field__details {
  display: none;
}
.v-input--is-focused {
  display: block !important;
}
.text-1 {
  display: flex !important;
}
.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
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
}
.v-input {
  max-width: 45%;
  margin-left: 2%;
}
::v-deep .v-text-field input {
  padding: 0px !important;
}
label {
  font-size: 90%;
  margin-top: 5px !important;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

.btn-2 {
  width: 11% !important;
  height: 33px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #423c3c !important;
}
::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;

  right: 10px;
  top: 0px !important;
}
::v-deep .v-input__icon {
  height: 10px !important;
}

.main-1 {
  display: flex;
  justify-content: space-around;
  height: 25vh;
  color: white !important;
}

.main-2 {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 5px;
  width: 50%;
  height: 100%;
}
.main-3 {
  display: flex;
  justify-content: center;
  flex-direction: column;
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

.active-label {
  color: white; /* White color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #F2A14A !important;
}
</style>
