import {
  SCAN_STATUS,
  SELECTION_CONFIG_FORM,
  BREATHING_INSTRUCTION,
  SELECTION_CONFIG_DISPLAY_MODE,
  CARDIAC_ACQUISITION_TYPE,
  TUBE_CONFIG,
} from '../../constants'
import log from 'loglevel'
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import _ from 'lodash'
import config from '../../config'
import { convertWindowLevelWidth } from '@/lib/math-util'
import moment from 'moment'
import { calculateMinSeqTR } from '@/lib/sequence-time-util'
import { calculateMinTECubic, calculateMinTESimplified, getGradientSlewValue } from '@/lib/diffusion-te-calculator'
import { AsyncChangeHandlerMixin } from './AsyncChangeHandlerMixin'
import EventBus from '@/lib/event-bus'
import { partialFourierToDecimal } from '@/lib/mri-parameter-utils'
import Vue from 'vue'

const { isCTLab } = config

// Constants for TE rounding logic
const TE_ROUNDING_EPSILON = 0.001 // 1 microsecond tolerance for floating point errors

const sharedReactiveState = Vue.observable({
  isCanvasActive: true,
  isImagingOptionActive: false,
  isSavedRxActive: false,
  isSelectRxWidgetActive: false,
  IsCopyRxWidgetActive: false,
  emitCopyRxAction: false,
  indexOfSelectedViewOrientationActive: 'z',
  selectedReferenceLineIdActive: false,
  isArcCheckedValue: false,
  isAssetCheckedValue: false,
  satConcatsValue: '',
  selectedImagingOptionsValue: {},
})

export const SelectionConfigMixin = {
  name: 'SelectionConfigMixin',
  mixins: [AsyncChangeHandlerMixin],
  data() {
    return {
      SELECTION_CONFIG_DISPLAY_MODE,
      kvpLocal: null,
      beamSelectedLocal: null,
      numberOfSlicesLocal: null,
      thicknessLocal: null,
      spacingLocal: null,
      dimensions3xLocal: null,
      dimensions3yLocal: null,
      dimensions3zLocal: null,
      echoTimeLocal: null,
      repetitionTimeLocal: null,
      inversionTimeLocal: null,
      flipAngleLocal: null,
      inversionRecoveryLocal: false,
      fatSuppressionLocal: null,
      oversamplingLocal: null,
      hasLookedAtAnswersSelectionsByQuestionId: {},
      testId: this.$route.query.test ?? null,
      helicalMode: true,
      kernelLocal: null,
      cardiacAcquisitionTypeLocal: null,
      kernels: isCTLab
        ? [
            { text: 'Smooth', value: 'B10f' },
            { text: 'Medium', value: 'B30f' },
            { text: 'Sharp', value: 'B70f' },
          ]
        : ['B10f', 'B20f', 'B30f', 'B40f', 'B50f', 'B60f', 'B70f', 'B80f'],
      acquisitionTypes: [{ text: 'Prospective', value: CARDIAC_ACQUISITION_TYPE.PROSPECTIVE }],
      isForCT: isCTLab,
      isFetchingSignalAverage: false,
      breathingInstructionLocal: null,
      windowLevelLocal: null,
      windowWidthLocal: null,
      windowLevelWidthLocal: null,
      windowLevelWidths: [
        {
          text: 'Soft tissue',
          value: 'soft',
          windowLevel: 40,
          windowWidth: 400,
        },
        {
          text: 'Lung',
          value: 'lung',
          windowLevel: -600,
          windowWidth: 1500,
        },
        {
          text: 'Bone',
          value: 'bone',
          windowLevel: 600,
          windowWidth: 3000,
        },
        {
          text: 'Brain',
          value: 'brain',
          windowLevel: 40,
          windowWidth: 80,
        },
        {
          text: 'Vascular',
          value: 'vascular',
          windowLevel: 100,
          windowWidth: 90,
        },
      ],
      echoTrainLengthLocal: null,
      tubePotentialLocal: null,
      tubeCurrentLocal: null,
      displayWindowWidth: 0,
      displayWindowLevel: 0,
      SCAN_STATUS: SCAN_STATUS,
      beamSelectItems: [
        {
          text: 'Wide: 40mm',
          value: 40,
          dim: '64 x 0.6',
        },
        {
          text: 'Narrow: 20mm',
          value: 20,
          dim: '36 x 0.6',
        },
        {
          text: 'Single Slice: 5mm',
          value: 5,
          dim: '1 x 0.6',
        },
      ],
      SELECTION_CONFIG_FORM,
      selectedCopyQuestionId: null,
      parallelFactorLocal: null,
      parallelFactors: {
        siemens: ['Off', 2, 3],
        ge: ['Off', 2],
        philips: ['Off', 1, 1.5, 2],
        hitachi: ['Off', 2],
        united: ['Off', 2, 3],
        canon: ['Off', 2],
      },
      thicknessMethodItems: [
        { text: 'MIP (Maximum)', value: 0 },
        { text: 'Mean (Average)', value: 1 },
        { text: 'MinIP (Minimum)', value: 2 },
      ],
      gradientRampLocal: null,
      specialtyOptionItems: ['Diffusion', 'Cardiac', 'Angio', 'fMRI'],
      diffusionDirectionItems: [1, 3, 4],
      diffusionModeItems: [
        '1-Scan Trace',
        '3-Scan Trace',
        '4-Scan Trace',
        'Orthogonal',
        'Slice',
        'Read',
        'Phase',
        '3D Diagonal',
        'MDDW',
      ],
      vendorStylePreferenceLocal: null,
      echoSpacings: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      //showConfirmDialog: false,
      //changeQueue: [],
      latestChangeData: {},
      //currentChange: {},
      //changeFromLabel: '',
      //changeFromOldValue: null,
      //changeFromNewValue: null,
      //changeToLabel: '',
      //changeToOldValue: null,
      //changeToNewValue: null,
      //isChangeValueCanceled: false,
      isBandwidthUserUpdated: false,
      flatFactorLookup: {
        default: {
          1.5: 375, // 680
          3: 200, // 900
        },
      },
      falloffFactorLookup: {
        default: {
          1.5: 1.2, // 5.0
          3: 2.0, //  7.3
        },
      },
      isInitialLoadingPhase: true,
    }
  },
  watch: {
    showDiffusionSequenceOption(newVal, oldVal) {
      if (!newVal && oldVal && this.selectionConfig.sequenceType === 'DIFF') {
        this.selectionConfig.sequenceType = 'TE'
        this.echoTime = 50
        this.echoTrainLength = 10
        this.concatenations = 2
        this.parallelFactor = 'Off'
        this.repetitionTime = 2000
        this.selectionConfig.receiverBandWidth = this.selectionConfig?.fieldStrength === '1.5' ? 150 : 220
      }
    },
    trueResolutionHeaderUltra(newVal) {
      console.log('trueResolutionHeaderUltra changed')
      this.updateTrueResolutionHeaderUltra(newVal)
    },
    trueResolutionHeader(newVal) {
      console.log('trueResolutionHeader changed')
      this.updateTrueResolutionHeader(newVal)
    },
    acquiredResolutionHeader(newVal) {
      console.log('acquiredResolutionHeader changed')
      this.updateAcquiredResolutionHeader(newVal)
    },
    latestChangeData(newVal, oldVal) {
      console.log('latestChangeData changed')
      console.log(newVal)
      console.log(oldVal)
    },
    selectionConfig() {
      this.isInitialLoadingPhase = true
      const INITIAL_LOADING_DURATION = 7000 // 7 seconds, adjust as needed
      this.kvpLocal = _.get(this.selectionConfig, 'kvp', 120)
      this.beamSelectedLocal = _.get(this.selectionConfig, 'beamSelected', {
        text: 'Narrow: 20mm',
        value: 20,
        dim: '36 x 0.6',
      })
      this.rotationTimeLocal = _.get(this.selectionConfig, 'rotationTime', 1.0)
      this.tubeCurrentLocal = _.get(this.selectionConfig, 'tubeCurrent', TUBE_CONFIG.DEFAULT)
      setTimeout(() => {
        console.log('initial loading phase over')
        this.isInitialLoadingPhase = false
      }, INITIAL_LOADING_DURATION)
    },
    bValues: {
      handler(newBValues) {
        console.log('bValues changed')

        if (!this.selectionConfig) {
          return
        }

        if (newBValues.length > 0) {
          this.selectionConfig.bValueLower = Math.min(...newBValues)
          this.selectionConfig.bValueUpper = Math.max(...newBValues)
        } else {
          this.selectionConfig.bValueLower = 0
          this.selectionConfig.bValueUpper = 0
        }
        // Reset signal average when bValues change
        this.$store.dispatch('selectionConfig/setSignalAverage', { signalAverage: null, ident: this.selectionIdent })
        // Reset bSignalAverages for DIFF sequences
        if (this.selectionConfig.sequenceType === 'DIFF') {
          this.$store.dispatch('selectionConfig/setBSignalAverages', {
            bSignalAverages: [],
            ident: this.selectionIdent,
          })
        }
      },
      deep: true,
      immediate: true,
    },
    numBValues(newVal) {
      if (newVal <= 1) {
        this.diffusionADC = false
      }
    },
    diffusionMode(newVal, oldVal) {
      let diffDirections = 3
      if (newVal !== oldVal) {
        switch (newVal) {
          case '1-Scan Trace':
            diffDirections = 1
            break
          case '3-Scan Trace':
            diffDirections = 3
            break
          case '4-Scan Trace':
            diffDirections = 4
            break
          case 'Orthogonal':
            diffDirections = 3
            break
          case 'Slice':
            diffDirections = 1
            break
          case 'Read':
            diffDirections = 1
            break
          case 'Phase':
            diffDirections = 1
            break
          case '3D Diagonal':
            diffDirections = 3
            break
          case 'MDDW':
            diffDirections = 7
            break
        }
      }

      this.diffusionDirections = diffDirections
    },
    gradientRampItems() {
      if (this.selectionConfig?.sequenceType === 'DIFF' && this.selectionConfig?.gradientRamp === 'Whisper') {
        this.selectionConfig.gradientRamp = 'Normal'
      }
    },
    fourierItems() {
      if (this.selectionConfig?.partialFourier && !this.fourierItems.includes(this.selectionConfig.partialFourier)) {
        this.selectionConfig.partialFourier = 'Off'
      }
    },
    'selectionConfig.specialtyOption': {
      handler(newVal, oldVal) {
        console.log('specialty option changed', newVal)

        // Sync specialtyOption across all selection configs
        if (newVal !== oldVal && this.selectionConfig) {
          Object.keys(this.selectionConfigsByIdent).forEach((ident) => {
            if (ident !== this.selectionIdent && this.selectionConfigsByIdent[ident]) {
              this.selectionConfigsByIdent[ident].specialtyOption = newVal
            }
          })
        }

        if (
          newVal === 'Diffusion' &&
          this.selectionConfig?.sequenceType !== 'DIFF' &&
          this.isUltraLab &&
          (this.isTakingTest || this.isEditingQuestion)
        ) {
          this.selectionConfig.sequenceType = 'DIFF'
          this.changeSequenceType()
        }
      },
      immediate: true,
    },
    'stackQuestion.hasSpecialtyOptions': {
      handler(newVal) {
        console.log('hasSpecialtyOptions changed', newVal)
        if (newVal && this.selectionConfig && !this.selectionConfig.specialtyOption) {
          this.selectionConfig.specialtyOption = 'Diffusion'
        } else if (!newVal && this.selectionConfig) {
          this.selectionConfig.specialtyOption = ''
        }
      },
      immediate: true,
    },
    fieldStrengthPreference(newVal) {
      if (this.isUltraLab && !this.isTakingTest && !this.isEditingQuestion && !this.isBandwidthUserUpdated) {
        console.log('field streference changed', newVal)
        this.selectionConfig.receiverBandWidth = newVal === '1.5' ? 150 : 220
      }
    },
    isDisabledParameter(newVal) {
      this.enableCTHotkeys(!newVal)
    },
    receiverBandWidth(newVal, oldVal) {
      this.latestChangeData = {
        changeFromLabel: this.$t('SelectionConfigForm.receiver_bandwidth'),
        changeFromOldValue: oldVal,
        changeFromNewValue: newVal,
        changeToLabel: this.$t('SelectionConfigForm.repetition_time'),
        changeToOldValue: this.repetitionTime,
      }

      // Check and adjust echo time if echo spacing changed
      if (!this.isUltraLab) return

      const echoTimeOld = this.echoTime
      const maxEchoTime = this.maxEchoTime
      let echoTimeChanged = false

      if (this.echoTime > maxEchoTime) {
        console.log('echoTime > maxEchoTime')
        this.echoTime = maxEchoTime
        echoTimeChanged = true
      } else if (this.echoTime < this.minTEOptionsForTEandDIFF) {
        console.log('echoTime < minTEOptionsForTEandDIFF')
        this.echoTime = this.minTEOptionsForTEandDIFF
        echoTimeChanged = true
      } else {
        const result = this.roundEchoTimeToSpacing(this.echoTime)
        if (result.needsRounding) {
          this.echoTime = result.roundedValue
          echoTimeChanged = true
        }
      }

      if (echoTimeChanged) {
        if (this.shouldProcessParameterChange('echoTime')) {
          this.confirmReceiverBandwidthChangeEchoTime(newVal, oldVal, this.echoTime, echoTimeOld)
        }
      }
    },
    gradientRamp(newVal, oldVal) {
      console.log('gradient ramp changed', newVal, oldVal)
      if (!this.isUltraLab) return

      const echoTimeOld = this.echoTime
      const maxEchoTime = this.maxEchoTime
      let echoTimeChanged = false

      if (this.echoTime > maxEchoTime) {
        console.log('echoTime > maxEchoTime')
        this.echoTime = maxEchoTime
        echoTimeChanged = true
      } else if (this.echoTime < this.minTEOptionsForTEandDIFF) {
        console.log('echoTime < minTEOptionsForTEandDIFF')
        this.echoTime = this.minTEOptionsForTEandDIFF
        echoTimeChanged = true
      } else {
        const result = this.roundEchoTimeToSpacing(this.echoTime)
        if (result.needsRounding) {
          this.echoTime = result.roundedValue
          echoTimeChanged = true
        }
      }

      if (echoTimeChanged) {
        if (this.shouldProcessParameterChange('echoTime')) {
          this.confirmGradientRampChangeEchoTime(newVal, oldVal, this.echoTime, echoTimeOld)
        }
      }
    },
    rfPulsing(newVal, oldVal) {
      if (!this.isUltraLab) return

      const echoTimeOld = this.echoTime
      const maxEchoTime = this.maxEchoTime
      let echoTimeChanged = false

      if (this.echoTime < this.minTEOptionsForTEandDIFF) {
        console.log('echoTime < minTEOptionsForTEandDIFF')
        this.echoTime = this.minTEOptionsForTEandDIFF
        echoTimeChanged = true
      }

      if (this.echoTime > maxEchoTime) {
        console.log('echoTime > maxEchoTime')
        this.echoTime = maxEchoTime
        echoTimeChanged = true
      } else {
        const result = this.roundEchoTimeToSpacing(this.echoTime)
        if (result.needsRounding) {
          this.echoTime = result.roundedValue
          echoTimeChanged = true
        }
      }

      if (this.echoTime < maxEchoTime && this.echoTime == echoTimeOld) {
        echoTimeChanged = false
      }

      if (echoTimeChanged) {
        if (this.shouldProcessParameterChange('echoTime')) {
          this.confirmRFPulseChangeEchoTime(newVal, oldVal, this.echoTime, echoTimeOld)
        }
      }
    },
    'selectionConfig.sequenceType'(newVal, oldVal) {
      if (this.isUltraLab) {
        console.log('sequenceTypeChanged')
        this.latestChangeData = {
          changeFromLabel: this.$t('SelectionConfigForm.sequence_type'),
          // this is a hack to change the value from TSE to TE
          // should be refactored at some point
          changeFromOldValue: oldVal === 'TE' ? 'TSE' : oldVal,
          changeFromNewValue: newVal === 'TE' ? 'TSE' : newVal,
          changeToLabel: this.$t('SelectionConfigForm.repetition_time'),
          changeToOldValue: this.repetitionTime,
        }

        // move echotime to nearestmultiple of echoSpacing
        if (newVal === 'TE' || newVal === 'DIFF') {
          const result = this.roundEchoTimeToSpacing(this.echoTime, true)
          if (result.needsRounding) {
            this.echoTime = result.roundedValue
          }
        }
        if (newVal === 'DIFF' && this.selectionConfig) {
          this.selectionConfig.specialtyOption = 'Diffusion'
        }
        if (newVal === 'DIFF' || oldVal === 'DIFF') {
          this.setSequenceDefaults(newVal)
        }
      }
    },
    repetitionTime: {
      handler: function () {
        this.updateTREfficiency()
      },
      immediate: true,
    },
    bNoiseFactor: {
      handler(newVal) {
        if (this.selectionConfig.sequenceType !== 'DIFF') return
        this.selectionConfig.bNoiseFactors = newVal
        this.selectionConfig.noiseFactor = Math.max(...newVal)
        // Calculate flatFactor and falloffFactor for diffusion sequences
        let fieldStrength = Number(this.selectionConfig?.fieldStrength || 1)
        let flatFactor = this.flatFactorLookup['default'][fieldStrength] / (this.selectionConfig.noiseFactor || 1)
        let falloffFactor = this.falloffFactorLookup['default'][fieldStrength] / (this.selectionConfig.noiseFactor || 1)
        this.selectionConfig.flatFactor = flatFactor
        this.selectionConfig.falloffFactor = falloffFactor
        // Recalculate BSNRS with new noise factors if signal averages exist
        if (this.bSignalAverages && this.bSignalAverages.length > 0) {
          this.calculateAndSetBSNRs()
        } else {
          // Only invalidate if no signal averages exist
          this.$store.dispatch('selectionConfig/setSnr', { snr: null, ident: this.selectionIdent })
          this.$store.dispatch('selectionConfig/setBSnrs', { bSnrs: [], ident: this.selectionIdent })
        }
      },
      immediate: true,
    },
    noiseFactor(newVal) {
      if (this.selectionConfig.sequenceType === 'DIFF') return
      this.selectionConfig.noiseFactor = newVal
      let fieldStrength = Number(this.selectionConfig?.fieldStrength || 1)
      let flatFactor = this.flatFactorLookup['default'][fieldStrength] / (newVal || 1)
      let falloffFactor = this.falloffFactorLookup['default'][fieldStrength] / (newVal || 1)
      this.selectionConfig.flatFactor = flatFactor
      this.selectionConfig.falloffFactor = falloffFactor
      console.log({ flatFactor: flatFactor, falloffFactor: falloffFactor })
      // Recalculate SNR with new noise factor if signal average exists
      if (this.signalAverage !== null) {
        this.calculateAndSetSNR()
      } else {
        // Only invalidate if no signal average exists
        this.$store.dispatch('selectionConfig/setSnr', { snr: null, ident: this.selectionIdent })
      }
    },
    signalAverage: {
      handler() {
        if (this.selectionConfig.sequenceType === 'DIFF') return
        this.calculateAndSetSNR()
      },
    },
    bSignalAverages: {
      handler() {
        if (this.selectionConfig.sequenceType !== 'DIFF') return
        this.calculateAndSetBSNRs()
      },
      immediate: true,
      deep: true,
    },
    'selectionConfig.spacing': {
      handler() {
        // Spacing changes affect overlap calculation, so recalculate SNR if concatenations = 1
        if (this.selectionConfig.concatenations === 1) {
          if (this.selectionConfig.sequenceType === 'DIFF') {
            this.calculateAndSetBSNRs()
          } else {
            this.calculateAndSetSNR()
          }
        }
      },
    },
    'selectionConfig.thickness': {
      handler() {
        // Thickness changes affect overlap calculation, so recalculate SNR if concatenations = 1
        if (this.selectionConfig.concatenations === 1) {
          if (this.selectionConfig.sequenceType === 'DIFF') {
            this.calculateAndSetBSNRs()
          } else {
            this.calculateAndSetSNR()
          }
        }
      },
    },
    'selectionConfig.concatenations': {
      handler() {
        // Concatenations changes affect whether we use crosstalk or not, so recalculate SNR
        if (this.selectionConfig.sequenceType === 'DIFF') {
          this.calculateAndSetBSNRs()
        } else {
          this.calculateAndSetSNR()
        }
      },
    },
    'selectionConfig.fieldStrength': {
      handler(newVal, oldVal) {
        if (oldVal && newVal !== oldVal) {
          // Reset signal average when fieldStrength changes
          this.$store.dispatch('selectionConfig/setSignalAverage', { signalAverage: null, ident: this.selectionIdent })
          // Clear bSignalAverages for DIFF sequences only if not currently scanning
          if (this.selectionConfig.sequenceType === 'DIFF' && !this.isPlayingTheSlices) {
            this.$store.dispatch('selectionConfig/setBSignalAverages', {
              bSignalAverages: [],
              ident: this.selectionIdent,
            })
          }
        }
      },
    },
    echoTrainLength(newVal, oldVal) {
      if (!this.selectionConfig) {
        return
      }

      this.selectionConfig.echoTrainLength = newVal
      if (!this.isUltraLab) return

      this.latestChangeData = {
        changeFromLabel: this.labels.echoTrainLabel[this.vendorStylePreferenceLocal],
        changeFromOldValue: oldVal,
        changeFromNewValue: newVal,
        changeToLabel: this.$t('SelectionConfigForm.repetition_time'),
        changeToOldValue: this.repetitionTime,
      }

      // Use the computed maxEchoTime property
      const maxEchoTime = this.maxEchoTime

      if (this.echoTime > maxEchoTime) {
        this.echoTime = maxEchoTime
      }
    },
    vendorStylePreferenceLocal: {
      handler: function (newVal) {
        if (!this.selectionConfig) {
          return
        }

        this.selectionConfig.canDragAboveTR = newVal === 'siemens' ? false : true

        // When switching to a non-Philips vendor, round frequency matrix to nearest 32
        if (newVal !== 'philips') {
          this.adjustFrequencyMatrix()
        }

        // When switching to a 32-based vendor (not Siemens/Philips), round phase matrix
        // This applies in ALL contexts (not just UltraLab)
        const is32BasedVendor = !['siemens', 'philips'].includes(newVal)
        if (is32BasedVendor) {
          this.adjustPhaseMatrix()
        }

        this.selectionConfig.vendorStyle = newVal
        this.changeVendorStylePreference()
      },
      immediate: true,
    },
    numberOfSlices(newVal, oldVal) {
      if (this.isUltraLab) {
        // these need to be set and make available for the minConcatAcqPackage watcher & confirm dialog popup
        this.latestChangeData = {
          changeFromLabel: this.$t('global.number_of_slices'),
          changeFromOldValue: oldVal,
          changeFromNewValue: newVal,
          changeToLabel: this.$t('SelectionConfigForm.repetition_time'),
          changeToOldValue: this.repetitionTime,
        }
      }
    },
    forcedFrequencyVoxelSize(newVal) {
      if (!this.selectionConfig) {
        return
      }
      if (this.isEditingQuestion) {
        this.selectionConfig.frequencyVoxelSize = newVal
      }
    },
    forcedPhaseVoxelSize(newVal) {
      if (!this.selectionConfig) {
        return
      }

      if (this.isEditingQuestion) {
        this.selectionConfig.phaseVoxelSize = newVal
      }
    },
    phaseVoxelSize: {
      handler: function (newValue) {
        if (!this.selectionConfig) {
          return
        }

        if ((this.isUltraLab && this.selectionIdent === '0_proposed') || !this.isUltraLab) {
          const asNumber = new Number(newValue)
          this.selectionConfig.phaseVoxelSize = this.isEditingQuestion ? this.forcedPhaseVoxelSize : asNumber
        }
      },
      immediate: true,
    },
    frequencyVoxelSize: {
      handler: function (newValue) {
        if (!this.selectionConfig) {
          return
        }

        if ((this.isUltraLab && this.selectionIdent === '0_proposed') || !this.isUltraLab) {
          const asNumber = new Number(newValue)
          this.selectionConfig.frequencyVoxelSize = this.isEditingQuestion ? this.forcedFrequencyVoxelSize : asNumber
        }
      },
      immediate: true,
    },
    stackQuestion() {
      if (!this.selectionConfig) {
        return
      }

      // to handle AdminPreview looking at a group in one Question that doesn't exist in the next
      this.previewScoreGroupIndex = 0

      this.selectionConfig.canDragAboveTR = this.vendorStylePreference === 'siemens' ? false : true
      this.selectionConfig.vendorStyle = this.vendorStylePreference
    },
    windowLevel(_windowLevel) {
      this.windowLevelWidth = convertWindowLevelWidth(_windowLevel, this.windowWidth)
      this.displayWindowLevel = _windowLevel
    },
    windowWidth(_windowWidth) {
      this.windowLevelWidth = convertWindowLevelWidth(this.windowLevel, _windowWidth)
      this.displayWindowWidth = _windowWidth
    },
    scanTimeCT(_value) {
      this.setScanDurationOfConfig(_value)
    },
    minConcatAcqPackage(newValue) {
      console.log('min concat acq package', newValue)
      if (!this.shouldProcessParameterChange('repetitionTime')) {
        return
      }
      //if (!this.isChangeValueCanceled) {
      console.log('minConcatAcqPackage', newValue, this.isUltraLab)
      console.log('repetitionTime', this.repetitionTime)
      if (this.isUltraLab && newValue > this.repetitionTime) {
        console.log('sequenceType', this.selectionConfig?.sequenceType)
        if (['TE', 'SE', 'DIFF'].includes(this.selectionConfig?.sequenceType)) {
          // repetition time is below min tr and need to be increased
          this.repetitionTime = newValue
          if (!this.isInitialLoadingPhase) {
            this.queueChange({
              ...this.latestChangeData,
              changeToNewValue: this.repetitionTime,
            })
            console.log('queue change', {
              ...this.latestChangeData,
              changeToNewValue: this.repetitionTime,
            })
          }

          /*
            this.concatenations = _.round(
              ((this.echoSpacing + 5) * (this.echoTrainLength ? this.echoTrainLength : 1) * this.numberOfSlices) /
                this.repetitionTime
            )
            if (this.concatenations <= 1) {
              this.concatenations = 2
            }
            if (!this.inversionRecovery) {
              this.repetitionTime = _.round(
                (this.echoSpacing * this.echoTrainLength + 5) * Math.ceil(this.numberOfSlices / this.concatenations)
              )
            } else {
              this.repetitionTime =
                _.round(
                  (this.echoSpacing * this.echoTrainLength + 5) * Math.ceil(this.numberOfSlices / this.concatenations)
                ) + this.inversionTime
            }
            */
        }
        /*
        else if (this.selectionConfig?.sequenceType === 'SE') {
          console.log('minConcatAcqPackage - SE', newValue)
          console.log('echo spacing', this.echoSpacing)
          console.log('number of slices', this.numberOfSlices)
          console.log('repetition time', this.repetitionTime)
          this.concatenations = _.round(((this.echoSpacing + 5) * this.numberOfSlices) / this.repetitionTime)
          console.log('concatenations', this.concatenations)
          //console.log('minConcatAcqPackage', this.concatenations)
          if (this.concatenations <= 1) {
            this.concatenations = 2
          }
          if (!this.inversionRecovery) {
            this.repetitionTime = _.round((this.echoTime + 1) * Math.ceil(this.numberOfSlices / this.concatenations))
          } else {
            this.repetitionTime =
              _.round((this.echoTime + 1) * Math.ceil(this.numberOfSlices / this.concatenations)) + this.inversionTime
          }
        }
        */
      } else if (this.isUltraLab) {
        this.updateTREfficiency()
      }
      //}
    },
    scanTime(newVal, oldVal) {
      console.log('Setting scantime watcher', newVal, oldVal)
      if (_.isNil(newVal)) {
        console.warn('Invalid scanTime value, skipping update:', newVal)
        return
      }

      if (newVal !== oldVal) {
        // alert('changed')
        console.log('Setting scanTime to:', newVal)
        //this.setScanTime(newVal)
        this.updateScanTime(newVal)
        //this.SET_SCAN_TIME(newVal)
      }
    },
    minTEOptionsForTEandDIFF: {
      handler(newMinTE) {
        // Only validate echo time if we're not in initial loading phase to prevent
        // unwanted changes during component initialization
        if (this.isInitialLoadingPhase) {
          return
        }

        // Only apply minimum TE validation to TE, DIFF, and SSFP sequences
        // Other sequences (SE, GRE) should not be constrained by this minimum
        if (!['TE', 'DIFF', 'SSFP'].includes(this.selectionConfig?.sequenceType)) {
          return
        }

        // Validate echo time against the new minimum TE requirement
        if (this.echoTime < newMinTE) {
          this.echoTime = newMinTE
        }
      },
      immediate: false,
    },
    echoTime: {
      handler(newEchoTime, oldEchoTime) {
        // Only validate echo time if we're not in initial loading phase to prevent
        // unwanted changes during component initialization
        if (this.isInitialLoadingPhase || this.isUndoingChange) {
          return
        }

        // Only apply minimum TE validation to TE, DIFF, and SSFP sequences
        // Other sequences (SE, GRE) should not be constrained by this minimum
        if (['TE', 'DIFF', 'SSFP'].includes(this.selectionConfig?.sequenceType)) {
          // Validate that echo time is not below the current minimum TE requirement
          const minTE = this.minTEOptionsForTEandDIFF
          if (newEchoTime < minTE) {
            this.echoTime = minTE
          }
        }

        // Check if the new echo time causes minimum TR to exceed current TR (for UltraLab)
        if (this.isUltraLab && this.minConcatAcqPackage > this.repetitionTime) {
          console.log('Echo time change caused min TR to exceed current TR')
          console.log('Min concat acq package:', this.minConcatAcqPackage)
          console.log('Current repetition time:', this.repetitionTime)

          // Set the latestChangeData to track this change for confirmation popup
          this.latestChangeData = {
            changeFromLabel: this.$t('SelectionConfigForm.echo_time'),
            changeFromOldValue: oldEchoTime,
            changeFromNewValue: newEchoTime,
            changeToLabel: this.$t('SelectionConfigForm.repetition_time'),
            changeToOldValue: this.repetitionTime,
            changeToNewValue: this.minConcatAcqPackage,
          }

          // Update TR to the new minimum
          this.repetitionTime = this.minConcatAcqPackage

          // Queue the change for confirmation popup
          if (!this.isInitialLoadingPhase) {
            this.queueChange({
              ...this.latestChangeData,
              changeToNewValue: this.repetitionTime,
            })
            console.log('Queued TR change due to echo time increase')
          }
        }
      },
      immediate: false,
    },
    minSeqTe: {
      handler(newValue) {
        if (this.selectionConfig) {
          this.selectionConfig.minSeqTe = newValue
        }
      },
      immediate: true,
    },
    selectedStackQuestionIndex: function () {
      if (this.isIdentTypeProposed && !this.isEditingQuestion) {
        this.adjustDLP({ dlp: this.DLP })
        this.adjustCTDI({ ctdi: this.CTDI })
      }
    },
    CTDI: function (newValue) {
      if (this.isIdentTypeProposed && !this.isEditingQuestion) {
        this.adjustCTDI({ ctdi: newValue })
      }
    },
    DLP: function (newValue) {
      if (this.isIdentTypeProposed && !this.isEditingQuestion) {
        this.adjustDLP({ dlp: newValue })
      }
    },
    'selectionConfig.dimensions3.x': {
      handler(newDimensions3x, oldDimensions3x) {
        // Only for Siemens vendor - auto-adjust phase matrix to maintain displayed percentage
        // when Phase FoV changes
        if (
          this.vendorStylePreference !== 'siemens' ||
          !this.selectionConfig ||
          this.isInitialLoadingPhase ||
          !oldDimensions3x ||
          newDimensions3x === oldDimensions3x
        ) {
          return
        }

        const dimensions3y = _.get(this.selectionConfig, 'dimensions3.y')
        const storedPhaseMatrix = _.get(this.selectionConfig, 'phaseMatrix')

        // Use stored intended percentage if available, otherwise calculate from stored value
        // This prevents precision drift by always using the user's original intent
        let currentPhaseMatrixPercent = _.get(this.selectionConfig, 'intendedPhaseMatrixPercent')
        if (!currentPhaseMatrixPercent) {
          // Fallback: calculate from current stored value (for backward compatibility)
          const oldPhaseFovPercent = oldDimensions3x / dimensions3y
          const oldBaseMatrix = this.frequencyMatrix * oldPhaseFovPercent
          currentPhaseMatrixPercent =
            storedPhaseMatrix !== 0 && oldBaseMatrix !== 0 ? (storedPhaseMatrix / oldBaseMatrix) * 100 : 0
        }

        // Calculate new stored value using intended percentage
        const newPhaseFovPercent = newDimensions3x / dimensions3y
        const newBaseMatrix = this.frequencyMatrix * newPhaseFovPercent
        let newStoredValue = Math.floor(newBaseMatrix * (currentPhaseMatrixPercent / 100))

        // Apply maximum validation - cap at 100% (which equals baseMatrix)
        const maxValue = newBaseMatrix
        newStoredValue = Math.min(newStoredValue, maxValue)

        // Update stored value AND preserve intended percentage
        this.selectionConfig.phaseMatrix = newStoredValue
        this.selectionConfig.intendedPhaseMatrixPercent = currentPhaseMatrixPercent
      },
      immediate: false,
    },
  },
  computed: {
    ...mapGetters('user', ['vendorStylePreferenceOptions']),
    ...mapGetters('cohortService', ['isChallengeModeEnabledForMe']),
    ...mapGetters('testRunService', ['isTakingTest', 'currentTestIsPreparedExam']),
    ...mapGetters('selectionConfig', ['selectionConfigsIdentTypeNames', 'isSingleSliceMode']),
    ...mapGetters('interactableService', ['satBands', 'selectedInteractableState']),
    ...mapGetters('dicomService', [
      'isContrastLab',
      'availableSequenceTypes',
      'availableSequenceTypesXA',
      'availableSequenceTypesPhilips',
      'availableFieldStrengths',
      'isFatSatAvailable',
      'isResolutionLab',
    ]),
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'answersSelections',
      'stackQuestionsLength',
      'selectedStackQuestionIndexVisual',
      'scanSubmitted',
      'testResultAugmented',
      'answerCurrent',
      'scanSubmittedByStackQuestionId',
      'isAcquisitionQuestion',
      'isReconstructionQuestion',
      'isLocalizerQuestion',
      'sameKindAnsweredQuestionWithStackQuestion',
      'isAnsweredCurrentQuestion',
      'minScanDelayOfCurrentStackQuestion',
      'isCardiacAcquisitionQuestion',
      'bodyPartPhantom',
    ]),
    ...mapState('selectionConfig', [
      'selectionConfigsByIdent',
      'selectionConfigCurrentIdent',
      'isAddLocalizerMode',
      'selectedMRIScanDirection',
      'vendorStylePreference',
    ]),
    ...mapState('questionService', [
      'questionSet',
      'activeTab',
      'isSelectedTab',
      'answerSelectionId',
      'hasAnsweredAllStackQuestions',
      'isEditingQuestion',
      'scanStatus',
      'selectedStackQuestionIndex',
      'scanDelay',
      'isPlayingTheSlices',
      'isLoadingPlayingTheSlices',
      'isMovingMRIMachine',
      'isMoveMRIMachineEnabled',
      'isConfirmedLocalizerQuestion',
    ]),
    ...mapState('dicomService', [
      'dicomFileSet',
      'isLoaded',
      'progressFetch',
      'progressParse',
      'progressTotal',
      'allowPageReloadWithoutConfirmation',
    ]),
    ...mapState('stackService', ['scanDurationOfConfig']),
    ...mapGetters('user', ['languageCode', 'isAdmin', 'softwareVendorPreference', 'softwareVersionPreference']),
    ...mapState('dataToParent', {
      //repetitionTime: (state) => state.repetitionTime,
      //scanTime: (state) => state.scanTime,
    }),
    ...mapGetters('interactableService', ['interactableFormVisible']),
    breathingInstructionItems() {
      return [
        {
          value: BREATHING_INSTRUCTION.OFF,
          text: this.$t('global.off', this.languageCode),
        },
        {
          value: BREATHING_INSTRUCTION.INSPIRATION,
          text: this.$t('global.inspiration', this.languageCode),
        },
        {
          value: BREATHING_INSTRUCTION.EXPIRATION,
          text: this.$t('global.expiration', this.languageCode),
        },
      ]
    },
    availableFieldStrengthsOptions() {
      return this.availableFieldStrengths.map((fieldStrength) => {
        return {
          text: `${fieldStrength} T`,
          value: fieldStrength,
        }
      })
    },
    minTEOptionsForTEandDIFF() {
      console.log('minTEOptionsForTEandDIFF')
      console.log('this.echoSpacing: ', this.echoSpacing)
      console.log('this.selectionConfig.sequenceType: ', this.selectionConfig.sequenceType)

      let output = this.echoSpacing

      if (this.selectionConfig.sequenceType === 'DIFF') {
        // DIFFUSION SEQUENCES - Use physics-based cubic equation approach
        const params = {
          bValue: Math.max(...this.bValues),
          frequencyMatrix: this.selectionConfig.frequencyMatrix,
          phaseResolution: this.selectionConfig.phaseMatrix / this.selectionConfig.frequencyMatrix,
          phaseFOV: (this.selectionConfig?.dimensions3?.x || 1) / (this.selectionConfig?.dimensions3?.y || 1),
          partialFourier: this.partialFourierAsDecimal,
          oversampling: this.oversampling / 100,
          parallelFactor: this.parallelFactor === 'Off' ? 1 : parseInt(this.parallelFactor),
          echoSpacing: this.echoSpacing,
          gradientRamp: this.gradientRamp,
          rfPulsing: this.rfPulsing,
        }

        const cubicResult = calculateMinTECubic(params)

        if (cubicResult !== null) {
          output = cubicResult
          console.log('Using cubic equation formula:', output)
        } else {
          // Fallback to simplified if cubic fails (e.g., invalid gradient timing, equation solver issues)
          console.warn('Cubic solver failed, falling back to simplified')
          const simplifiedParams = {
            bValue: Math.max(...this.bValues),
            echoSpacing: this.echoSpacing,
            trNeeded: this.trNeeded(this.selectionConfig?.dimensions3?.x || 1, this.phaseVoxelSize),
            parallelFactor: this.parallelFactor === 'Off' ? 1 : parseInt(this.parallelFactor),
            oversampling: this.oversampling / 100,
            partialFourier: this.partialFourierAsDecimal,
          }
          output = calculateMinTESimplified(simplifiedParams)
        }
      }
      // ELSE: For TE and SSFP sequences, output remains as this.echoSpacing (UNCHANGED)

      output = Math.round(output * 10) / 10 // Round to 1 decimal place

      console.log('minTEOptionsForTEandDIFF output: ', output)
      return output
    },
    maxEchoTime() {
      if (this.selectionConfig?.sequenceType === 'DIFF') {
        // For DIFF sequences, max echo time is twice the minimum TE
        return this.minTEOptionsForTEandDIFF * 2
      } else {
        // For other sequences, max echo time is echo spacing * echo train length
        return this.echoSpacing * this.echoTrainLength
      }
    },
    fourierItems() {
      const sequence = this.selectionConfig.sequenceType
      const vendor = this.vendorStylePreference

      const fourierOptions = {
        SE: {
          siemens: ['5/8', '6/8', '7/8', 'Off'],
          ge: ['On', 'Off'],
          philips: ['On', 'Off'],
          hitachi: ['On', 'Off'],
          canon: ['On', 'Off'],
        },
        GRE: {
          siemens: ['5/8', '6/8', '7/8', 'Off'],
          ge: ['On', 'Off'],
          philips: ['On', 'Off'],
          hitachi: ['On', 'Off'],
          canon: ['On', 'Off'],
        },
        TE: {
          siemens: ['Allowed', 'Off'],
          ge: ['On', 'Off'],
          philips: ['On', 'Off'],
          hitachi: ['On', 'Off'],
          canon: ['On', 'Off'],
        },
        DIFF: {
          siemens: ['5/8', '6/8', '7/8', 'Off'],
          ge: ['5/8', '6/8', '7/8', 'Off'],
          philips: ['5/8', '6/8', '7/8', 'Off'],
          hitachi: ['5/8', '6/8', '7/8', 'Off'],
          canon: ['5/8', '6/8', '7/8', 'Off'],
        },
      }

      return fourierOptions[sequence]?.[vendor] || ['Off']
    },
    adcDisabled() {
      return this.numBValues <= 1 ? true : false
    },
    gradientRampItems() {
      const vendor = this.vendorStylePreference || 'siemens'

      // Define vendor-specific display text for each internal value
      const vendorGradientModes = {
        siemens: [
          { text: 'fast', value: 'fast' },
          { text: 'normal', value: 'med' },
          { text: 'whisper', value: 'slow' },
        ],
        ge: [
          { text: 'Fast', value: 'fast' },
          { text: 'Normal', value: 'med' },
          { text: 'Whisper', value: 'slow' },
        ],
        philips: [
          { text: 'Fast', value: 'fast' },
          { text: 'Normal', value: 'med' },
          { text: 'Whisper', value: 'slow' },
        ],
        hitachi: [
          { text: 'Fast', value: 'fast' },
          { text: 'Normal', value: 'med' },
          { text: 'Whisper', value: 'slow' },
        ],
        united: [
          { text: 'Fast', value: 'fast' },
          { text: 'Normal', value: 'med' },
          { text: 'Whisper', value: 'slow' },
        ],
        canon: [
          { text: 'Fast', value: 'fast' },
          { text: 'Normal', value: 'med' },
          { text: 'Silent', value: 'slow' },
        ],
      }

      // Canon has sequence-type specific gradient options
      if (vendor === 'canon') {
        const sequenceType = this.selectionConfig?.sequenceType
        if (sequenceType === 'TE') {
          return [
            { text: 'Silent', value: 'slow' },
            { text: 'Normal', value: 'med' },
            { text: 'Fine', value: 'fast' },
          ]
        }
        if (sequenceType === 'DIFF') {
          return [
            { text: 'Normal', value: 'slow' },
            { text: 'Fast', value: 'med' },
            { text: 'Fine', value: 'fast' },
          ]
        }
        // SE and GRE sequences: Fast, Normal, Silent
        return [
          { text: 'Fast', value: 'fast' },
          { text: 'Normal', value: 'med' },
          { text: 'Silent', value: 'slow' },
        ]
      }

      let options = [
        vendorGradientModes[vendor][0], // Fast
        vendorGradientModes[vendor][1], // Normal
      ]

      if (this.selectionConfig?.sequenceType === 'TE' || this.selectionConfig?.sequenceType === 'SSFP') {
        options.push(vendorGradientModes[vendor][2]) // Whisper
      }

      return options
    },
    rfPulsingItems() {
      const vendor = this.vendorStylePreference || 'siemens'

      // Define vendor-specific display text for each internal value
      const vendorRFModes = {
        siemens: [
          { text: 'fast', value: 'fast' },
          { text: 'normal', value: 'mid' },
          { text: 'lowSAR', value: 'low_sar' },
        ],
        ge: [
          { text: 'Fast', value: 'fast' },
          { text: 'Normal', value: 'mid' },
          { text: 'Low SAR', value: 'low_sar' },
        ],
        philips: [
          { text: 'Fast', value: 'fast' },
          { text: 'Normal', value: 'mid' },
          { text: 'Low SAR', value: 'low_sar' },
        ],
        hitachi: [
          { text: 'Fast', value: 'fast' },
          { text: 'Normal', value: 'mid' },
          { text: 'Low SAR', value: 'low_sar' },
        ],
        united: [
          { text: 'Fast', value: 'fast' },
          { text: 'Normal', value: 'mid' },
          { text: 'Low SAR', value: 'low_sar' },
        ],
      }

      // Canon has sequence-type specific RF options
      if (vendor === 'canon') {
        const sequenceType = this.selectionConfig?.sequenceType
        switch (sequenceType) {
          case 'SE':
            return [
              { text: 'Low SAR', value: 'low_sar' },
              { text: 'Normal', value: 'mid' },
              { text: 'Fast', value: 'fast' },
            ]
          case 'GRE':
            return [
              { text: 'Normal', value: 'low_sar' },
              { text: 'Fine', value: 'mid' },
              { text: 'Fast', value: 'fast' },
            ]
          case 'TE':
            return [
              { text: 'Low SAR', value: 'low_sar' },
              { text: 'Normal', value: 'mid' },
              { text: 'Fine', value: 'fast' },
            ]
          case 'DIFF':
            return [
              { text: 'Normal', value: 'mid' },
              { text: 'Fast', value: 'fast' },
            ]
          default:
            return [
              { text: 'Fast', value: 'fast' },
              { text: 'Normal', value: 'mid' },
              { text: 'Low SAR', value: 'low_sar' },
            ]
        }
      }

      return vendorRFModes[vendor] || vendorRFModes.siemens
    },
    gradientRampTime() {
      let output = 0
      const normalizedGradientRamp = this.gradientRamp.toLowerCase()
      switch (normalizedGradientRamp) {
        case 'fast':
          output =
            this.selectionConfig.sequenceType === 'TE' || this.selectionConfig.sequenceType === 'SSFP' ? 0.2 : 0.04
          break
        case 'med':
          output =
            this.selectionConfig.sequenceType === 'TE' || this.selectionConfig.sequenceType === 'SSFP' ? 0.4 : 0.06
          break
        case 'slow':
          output = 1.0
          break
        default:
          console.warn('Unknown value for gradientRamp:', this.gradientRamp)
      }

      console.log('gradientRampTime', output)
      return output
    },
    /**
     * Get the gradient slew rate value in T/m/s based on current gradient ramp mode.
     * This is used for calculating gradient timing across all sequence types.
     *
     * @returns {number} Gradient slew rate (200 for fast, 100 for med, 50 for slow)
     */
    gradientSlewValue() {
      const gradientRamp = this.selectionConfig?.gradientRamp || 'fast'
      return getGradientSlewValue(gradientRamp)
    },
    rfPulseDuration() {
      // =switch(RFMode){"fast"=2.8, "mid"=5.1, "low_sar"=7.2}
      let output = 0
      // Convert to lowercase and handle spaces for backward compatibility
      const rfMode = (this.rfPulsing || '').toLowerCase().replace(' ', '_')

      switch (rfMode) {
        case 'fast':
          output = 2.8
          break
        case 'mid':
          output = 5.1
          break
        case 'low_sar':
          output = 7.2
          break
        default:
          console.warn('Unknown value for rfPulsing:', this.rfPulsing)
      }

      console.log('rfPulseDuration', output)
      return output
    },
    showAverages() {
      let ouput = true
      if (
        (this.stackQuestion?.hasSpecialtyOptions && this.selectionConfig?.sequenceType === 'DIFF') ||
        (!this.isTakingTest && this.selectionConfig?.sequenceType == 'DIFF' && !this.isEditingQuestion)
      ) {
        ouput = false
      }
      return ouput
    },
    showSpecialtyTab() {
      let output = false
      if (
        this.stackQuestion?.hasSpecialtyOptions ||
        (!this.isTakingTest && this.selectionConfig?.sequenceType == 'DIFF' && !this.isEditingQuestion)
      ) {
        output = true
      }
      return output
    },
    showDiffusionSequenceOption() {
      let ouput = false
      if (
        ((this.isEditingQuestion || this.isTakingTest) &&
          this.stackQuestion?.hasSpecialtyOptions &&
          this.selectionConfig?.specialtyOption === 'Diffusion') ||
        (!this.isTakingTest && !this.isEditingQuestion)
      ) {
        ouput = true
      }
      return ouput
    },
    sequenceTypeLabel() {
      if (this.selectionConfig?.sequenceType) {
        return this.labels.sequenceTypeLabel[this.vendorStylePreference.trim()][this.selectionConfig.sequenceType]
      }
    },
    currentActiveTab: {
      get() {
        return this.activeTab
      },
      set(val) {
        this.setActiveTab(val)
      },
    },
    hideTabHeaderParams() {
      let output = false
      if (this.isTakingTest && this.currentActiveTab === 0 && !this.isEditingQuestion) {
        output = true
      }
      return output
    },
    displayScanDelayTime: {
      get() {
        return _.round(this.scanDelay)
      },
      set(val) {
        this.setScanDelay(val)
      },
    },
    scanDelayTime: {
      get() {
        return this.scanDelay
      },
      set(val) {
        this.setScanDelay(val)
      },
    },
    ctScanDirection: {
      get() {
        return this.selectedMRIScanDirection
      },
      set(val) {
        this.setSelectedMRIScanDirection(val)
      },
    },
    forcedIsCanvasActive: {
      get() {
        return sharedReactiveState.isCanvasActive
      },
      set(newVal) {
        sharedReactiveState.isCanvasActive = newVal
      },
    },
    isCanvasActiveFlag() {
      return this.forcedIsCanvasActive
    },
    satConcats: {
      get() {
        return sharedReactiveState.satConcatsValue
      },
      set(newVal) {
        sharedReactiveState.satConcatsValue = newVal
      },
    },
    isArcChecked: {
      get() {
        return sharedReactiveState.isArcCheckedValue
      },
      set(newVal) {
        sharedReactiveState.isArcCheckedValue = newVal
      },
    },
    isAssetChecked: {
      get() {
        return sharedReactiveState.isAssetCheckedValue
      },
      set(newVal) {
        sharedReactiveState.isAssetCheckedValue = newVal
      },
    },
    forcedIsImagingOptionActive: {
      get() {
        return sharedReactiveState.isImagingOptionActive
      },
      set(newVal) {
        sharedReactiveState.isImagingOptionActive = newVal
      },
    },
    isImagingOptionActiveFlag() {
      return this.forcedIsImagingOptionActive
    },
    selectedImagingOptions: {
      get() {
        return sharedReactiveState.selectedImagingOptionsValue
      },
      set(newVal) {
        sharedReactiveState.selectedImagingOptionsValue = newVal
      },
    },
    forcedIsSavedRxActive: {
      get() {
        return sharedReactiveState.isSavedRxActive
      },
      set(newVal) {
        sharedReactiveState.isSavedRxActive = newVal
      },
    },
    isSavedRxActiveFlag() {
      return this.forcedIsSavedRxActive
    },
    forcedIsSelectRxWidgetActive: {
      get() {
        return sharedReactiveState.isSelectRxWidgetActive
      },
      set(newVal) {
        sharedReactiveState.isSelectRxWidgetActive = newVal
      },
    },
    isSelectRxWidgetActiveFlag() {
      return this.forcedIsSelectRxWidgetActive
    },
    forcedIsCopyRxWidgetActive: {
      get() {
        return sharedReactiveState.IsCopyRxWidgetActive
      },
      set(newVal) {
        sharedReactiveState.IsCopyRxWidgetActive = newVal
      },
    },
    IsCopyRxWidgetActiveFlag() {
      return this.forcedIsCopyRxWidgetActive
    },
    emitCopyRxAction: {
      get() {
        return sharedReactiveState.emitCopyRxAction
      },
      set(newVal) {
        sharedReactiveState.emitCopyRxAction = newVal
      },
    },
    indexOfSelectedViewOrientation: {
      get() {
        return sharedReactiveState.indexOfSelectedViewOrientationActive
      },
      set(newVal) {
        sharedReactiveState.indexOfSelectedViewOrientationActive = newVal
      },
    },
    selectedReferenceLineId: {
      get() {
        return sharedReactiveState.selectedReferenceLineIdActive
      },
      set(newVal) {
        sharedReactiveState.selectedReferenceLineIdActive = newVal
      },
    },
    answerSelectionIdComputed: {
      get() {
        return this.answerSelectionId
      },
      set(answerSelectionId) {
        this.setAnswerSelectionId({ answerSelectionId })
      },
    },
    isEditingQuestion() {
      // This is checked before we have an ID (can't move this to a service because router there is not reactive)
      // If you want to know in a service, it's stored in questionService.isEditingQuestion
      return Boolean(this.$route.query.editing)
    },
    trueResolutionHeaderUltra() {
      return `${this.formatResolution(this.forcedPhaseVoxelSize)} x ${this.formatResolution(
        this.forcedFrequencyVoxelSize
      )} x ${this.formatResolution(this.thickness)}mm\u00B3`
    },
    trueResolutionHeader() {
      return `PH ${this.formatResolution(this.phaseVoxelSize)}mm | ƒ ${this.formatResolution(
        this.frequencyVoxelSize
      )}mm | SL ${this.formatResolution(this.thickness)}mm`
    },
    acquiredResolutionHeader() {
      if (this.frequencyVoxelSize && this.phaseVoxelSize && this.thickness)
        return `PH ${this.formatResolution(this.frequencyVoxelSize)}mm | ƒ ${this.formatResolution(
          this.frequencyVoxelSize
        )}mm | SL ${this.formatResolution(this.thickness)}mm`
      else return ''
    },
    forcedPhaseVoxelSize: {
      get() {
        const value = Number(_.get(this.selectionConfig, 'phaseVoxelSize'))
        return value % 1 !== 0 && value.toString().split('.')[1]?.length > 2 ? value.toFixed(2) : value
      },
      set(newValue) {
        if (!this.selectionConfig) {
          return
        }

        if (this.isEditingQuestion) {
          this.selectionConfig.phaseVoxelSize = newValue
        }
      },
    },
    forcedFrequencyVoxelSize: {
      get() {
        const value = Number(_.get(this.selectionConfig, 'frequencyVoxelSize'))
        return value % 1 !== 0 && value.toString().split('.')[1]?.length > 2 ? value.toFixed(2) : value
      },
      set(newValue) {
        if (!this.selectionConfig) {
          return
        }

        if (this.isEditingQuestion) {
          this.selectionConfig.frequencyVoxelSize = newValue
        }
      },
    },
    frequencyVoxelSize() {
      let frequencyMatrix = this.frequencyMatrix
      if (this.vendorStylePreference === 'philips') {
        // For Philips, use raw stored value (not the floored display value)
        frequencyMatrix = _.get(this.selectionConfig, 'frequencyMatrix')
      }
      let val = this.dimensions3y / frequencyMatrix
      if (['ge', 'canon'].includes(this.vendorStylePreference)) {
        val = _.round(val * 10, 2)
      } else {
        val = _.round(val, 2)
      }
      return val
    },
    phaseVoxelSize() {
      let phaseMatrix = this.phaseMatrix
      if (this.vendorStylePreference === 'siemens') {
        // For Siemens, use the raw stored matrix units value
        phaseMatrix = _.get(this.selectionConfig, 'phaseMatrix')
      } else if (this.vendorStylePreference === 'philips') {
        // For Philips, use raw stored value (not the floored display value)
        phaseMatrix = _.get(this.selectionConfig, 'phaseMatrix')
      }
      let val = this.dimensions3x / phaseMatrix
      if (['siemens', 'philips', 'united'].includes(this.vendorStylePreference)) {
        val = _.round((val / 100) * this.dimensions3y, 2)
      }
      if (['ge', 'canon'].includes(this.vendorStylePreference)) {
        val *= 10
      }
      return _.round(val, 2)
    },
    maxPhaseMatrix() {
      return this.vendorStylePreference === 'siemens' ? 200 : this.frequencyMatrix
    },
    minPhaseMatrix() {
      if (this.vendorStylePreference === 'siemens') {
        return 1 // Minimum 1% for Siemens
      }
      // 32-based vendors already enforce minimum 32 in the setter
      return 0
    },
    frequencyMatrix: {
      get() {
        let output = _.get(this.selectionConfig, 'frequencyMatrix')
        // Philips: floor to nearest 32 for DISPLAY only
        if (this.vendorStylePreference === 'philips') {
          output = Math.floor(output / 32) * 32
          // Enforce bounds: min 64, max 512
          output = Math.max(output, 64)
          output = Math.min(output, 512)
        }
        return output
      },
      set(frequencyMatrix) {
        let input = frequencyMatrix

        // For non-Philips vendors, round to nearest multiple of 32
        if (this.vendorStylePreference !== 'philips') {
          let difference = input % 32
          if (difference >= 16) {
            input = input + (32 - difference) // Round UP
          } else {
            input = input - difference // Round DOWN
          }
          // Enforce bounds: min 64, max 512
          input = Math.max(input, 64)
          input = Math.min(input, 512)
        }

        const dimensions3yMm = _.get(this.selectionConfig, 'dimensions3.y')
        const frequencyVoxelSize = dimensions3yMm / input
        const prevPhaseMatrix = this.phaseMatrix // save this value to apply later
        this.selectionConfig.frequencyVoxelSize = this.isEditingQuestion
          ? this.forcedFrequencyVoxelSize
          : frequencyVoxelSize
        this.selectionConfig.frequencyMatrix = input

        if (this.vendorStylePreference === 'siemens') {
          // readjust phase matrix to have the same % value as freq. matrix changes
          this.phaseMatrix = prevPhaseMatrix
        } else if (this.phaseMatrix > this.frequencyMatrix) {
          this.phaseMatrix = this.frequencyMatrix
        }
      },
    },
    phaseMatrix: {
      get() {
        let output = _.get(this.selectionConfig, 'phaseMatrix')
        if (this.vendorStylePreference === 'siemens') {
          // convert to % from matrix units
          // Phase matrix % is relative to (frequencyMatrix × phaseFoV%)
          const dimensions3x = _.get(this.selectionConfig, 'dimensions3.x')
          const dimensions3y = _.get(this.selectionConfig, 'dimensions3.y')
          const phaseFovPercent = dimensions3x / dimensions3y
          const baseMatrix = this.frequencyMatrix * phaseFovPercent
          // Round to nearest whole number (0 decimal places) for percentage display
          output = output !== 0 && baseMatrix !== 0 ? _.round((output / baseMatrix) * 100, 0) : 0
        } else if (this.vendorStylePreference === 'philips') {
          // Floor to nearest 32 for DISPLAY only
          output = Math.floor(output / 32) * 32
          // Enforce bounds: min 32, max frequencyMatrix
          output = Math.max(output, 32)
          output = Math.min(output, this.frequencyMatrix)
        }
        return output
      },
      set(phaseMatrix) {
        let input = phaseMatrix
        if (this.vendorStylePreference === 'siemens') {
          // Store the intended percentage BEFORE conversion to preserve user intent
          this.selectionConfig.intendedPhaseMatrixPercent = phaseMatrix

          // convert from % to matrix units
          // Calculate base matrix from Phase FoV: baseMatrix = frequencyMatrix × (phaseFoV%)
          const dimensions3x = _.get(this.selectionConfig, 'dimensions3.x')
          const dimensions3y = _.get(this.selectionConfig, 'dimensions3.y')
          const phaseFovPercent = dimensions3x / dimensions3y
          const baseMatrix = this.frequencyMatrix * phaseFovPercent
          input = Math.floor(baseMatrix * (phaseMatrix / 100))
          // Enforce minimum of 1% for Siemens
          const minMatrixUnits = Math.ceil(baseMatrix * 0.01)
          input = Math.max(input, minMatrixUnits)
        }
        // const phaseVoxelSize = this.dimensions3x / input
        // this.selectionConfig.phaseVoxelSize = this.isEditingQuestion ? this.forcedPhaseVoxelSize : phaseVoxelSize

        // For 32-based vendors, round to nearest multiple of 32
        const is32BasedVendor = !['siemens', 'philips'].includes(this.vendorStylePreference)
        if (is32BasedVendor) {
          let difference = input % 32
          if (difference >= 16) {
            input = input + (32 - difference)
          } else {
            input = input - difference
          }
          // Cap at frequencyMatrix
          input = Math.min(input, this.frequencyMatrix)
          // Ensure minimum of 32
          input = Math.max(input, 32)
        }
        this.selectionConfig.phaseMatrix = input
      },
    },
    complete() {
      // This requires that you are taking a TestRun. If you are just an admin viewing a QuestionSet, you can not submit that as a TestRun
      return this.hasAnsweredAllStackQuestions && this.isTakingTest
    },

    displayedSequenceType() {
      return this.selectionConfig?.sequenceType === 'IR' ? 'SE' : this.selectionConfig?.sequenceType
    },

    selectionConfig() {
      // Check null the selectionConfig, some time, the selectionIdent is not exist because the selection group isn't ready
      return this.selectionConfigsByIdent[this.selectionIdent] || {}
    },

    isCurrent() {
      return this.selectionIdent === this.selectionConfigCurrentIdent
    },

    isSelectionMin() {
      return this.selectionIdent.endsWith('min')
    },

    isSelectionMax() {
      return this.selectionIdent.endsWith('max')
    },

    isIdentTypeProposed() {
      return this.selectionIdent.endsWith('proposed')
    },

    isDisabledParameter() {
      return (
        (this.isForCT && (this.scanStatus !== this.SCAN_STATUS.NO_SCAN || this.isAnsweredCurrentQuestion)) ||
        (!this.isForCT && (this.hasAnsweredAllStackQuestions || this.isAnsweredCurrentQuestion))
      )
    },
    isDisabledBreathingHold() {
      return (
        this.isForCT &&
        ((this.isAcquisitionQuestion &&
          (this.scanStatus !== this.SCAN_STATUS.NO_SCAN || this.isAnsweredCurrentQuestion)) ||
          (this.isConfirmedLocalizerQuestion && this.isLocalizerQuestion) ||
          (this.isLocalizerQuestion &&
            (this.isPlayingTheSlices ||
              this.isAnsweredCurrentQuestion ||
              this.isLoadingPlayingTheSlices ||
              this.isMovingMRIMachine ||
              !this.isMoveMRIMachineEnabled)))
      )
    },
    selectionConfigCurrentInvisible: {
      get() {
        return !_.get(this.selectionConfig, 'visible')
      },
      set(invisible) {
        let visible = !invisible
        // The checkbox component seems to have a bug where it sends itself to be toggled to null after it has already been destroyed
        // So an old group that has already been deleted will set itself to visible: null, causing it to get partially re-created during set
        if (_.isBoolean(visible)) {
          this.setSelectionConfigVisible(visible, this.selectionIdent)
        } else {
          console.warn('set selectionConfigCurrentVisible tried to set visible', visible, 'for', this.selectionIdent)
        }
      },
    },
    numberOfSlices: {
      get() {
        return _.get(this.selectionConfig, 'numberOfSlices')
      },
      set(numberOfSlices) {
        this.numberOfSlicesLocal = numberOfSlices
      },
    },
    kvpValue: {
      get() {
        return _.get(this.selectionConfig, 'kvp', 120)
      },
      set(value) {
        this.selectionConfig.kvp = value
        this.kvpLocal = value
      },
    },
    thickness: {
      get() {
        const val = _.get(this.selectionConfig, 'thickness', 1)
        return _.toNumber(val)
      },
      set(thickness) {
        this.thicknessLocal = thickness
      },
    },
    rWaveDelay: {
      get() {
        const val = _.get(this.selectionConfig, 'rWaveDelay', 0)
        return val
      },
      set(rWaveDelay) {
        this.selectionConfig.rWaveDelay = rWaveDelay
      },
    },
    ignoreBadBeats: {
      get() {
        const val = _.get(this.selectionConfig, 'ignoreBadBeats', false)
        return val
      },
      set(ignoreBadBeats) {
        this.selectionConfig.ignoreBadBeats = ignoreBadBeats
      },
    },
    badBeatsTolerance: {
      get() {
        const val = _.get(this.selectionConfig, 'badBeatsTolerance', 0)
        return val
      },
      set(badBeatsTolerance) {
        this.selectionConfig.badBeatsTolerance = badBeatsTolerance
      },
    },
    spacing: {
      get() {
        let output = _.get(this.selectionConfig, 'spacing')
        if (
          //this.isUltraLab &&
          (this.vendorStylePreference === 'siemens' || this.vendorStylePreference === 'united') &&
          !this.isForCT &&
          !this.isAddLocalizerMode
        ) {
          // convert mm to %
          output = output !== 0 ? _.round((output / this.thickness) * 100) : 0
        }
        //console.log('output===get====spacing..', output)

        return output
      },
      set(spacing) {
        //console.log('setting spacing', spacing)
        let input = spacing
        if (
          (this.vendorStylePreference === 'siemens' || this.vendorStylePreference === 'united') &&
          !this.isForCT &&
          !this.isAddLocalizerMode
        ) {
          // convert % to mm
          input = _.round((this.thickness / 100) * input, 2)
          //console.log('converting spacing', input)
        }
        //console.log('spacingLocal=======spacing..', input)
        this.spacingLocal = input
      },
    },
    dimensions3x: {
      get() {
        let output = _.get(this.selectionConfig, 'dimensions3.x')
        if (['ge', 'canon'].includes(this.vendorStylePreference) && !this.isForCT) {
          // convert mm to cm
          output = _.get(this.selectionConfig, 'dimensions3.x') / 10
        } else if (!this.isForCT && ['siemens', 'united', 'philips'].includes(this.vendorStylePreference)) {
          // convert mm to %
          output = output !== 0 ? _.round((output / this.dimensions3y) * 100) : 0
        }
        return _.round(output, 1)
      },
      set(dimensions3x) {
        let input = dimensions3x
        if (['ge', 'canon'].includes(this.vendorStylePreference) && !this.isForCT) {
          // convert cm to mm
          input *= 10
        } else if (!this.isForCT && ['siemens', 'united', 'philips'].includes(this.vendorStylePreference)) {
          // convert % to mm
          input = (this.dimensions3y / 100) * input
        }

        this.dimensions3xLocal = _.round(input, 1)
      },
    },
    dimensions3y: {
      get() {
        let output = _.get(this.selectionConfig, 'dimensions3.y')
        if (!this.isForCT && ['ge', 'canon'].includes(this.vendorStylePreference)) {
          // convert mm to cm
          output = _.get(this.selectionConfig, 'dimensions3.y') / 10
        } else if (this.isForCT) {
          parseInt(_.get(this.selectionConfig, 'dimensions3.y', 0))
        }
        return _.round(output, 1)
      },
      set(dimensions3y) {
        let input = dimensions3y
        if (!this.isForCT && ['ge', 'canon'].includes(this.vendorStylePreference)) {
          // convert cm to mm
          input *= 10
        } else if (this.isForCT && this.selectionIdent.includes('min')) {
          input = Math.max(dimensions3y, this.SELECTION_CONFIG_FORM.MIN_FOV_FOR_IDENT_MIN)
        } else if (this.isForCT && this.selectionIdent.includes('max')) {
          input = Math.max(dimensions3y, this.SELECTION_CONFIG_FORM.MIN_FOV_FOR_IDENT_MAX)
        }
        this.dimensions3yLocal = _.round(input, 1)
      },
    },
    dimensions3z: {
      get() {
        return _.get(this.selectionConfig, 'dimensions3.z') || 0
      },
      set() {},
    },
    dimensions3zHalf: {
      // (Height half) for SingleSlice
      get() {
        let height = _.get(this.selectionConfig, 'dimensions3.z') || 0
        return height / 2
      },
      set(heightHalf) {
        this.$store.dispatch('selectionConfig/heightChanged', {
          currentVal: heightHalf * 2,
        })
        this.dimensions3zLocal = heightHalf * 2
      },
    },
    oversamplingPercentage: {
      // 0.0 - 100.0
      get() {
        return _.round(this.oversampling * 100, 1)
      },
      set(oversamplingPercentage) {
        this.oversampling = oversamplingPercentage / 100
      },
    },
    oversampling: {
      // 0.0 - 1.0, where 1.0 means each side of oversampling is as wide as 0.5*Phase(aka Dim3.x), so both sides added together would be as wide as Phase
      get() {
        return _.get(this.selectionConfig, 'oversampling')
      },
      set(oversampling) {
        this.oversamplingLocal = oversampling
      },
    },
    maxRotationOff: {
      get() {
        return _.get(this.selectionConfig, 'maxRotationOff')
      },
      set(maxRotationOff) {
        this.selectionConfig.maxRotationOff = maxRotationOff
      },
    },
    echoTime: {
      get() {
        return _.toNumber(_.get(this.selectionConfig, 'echoTime', 0))
      },
      set(echoTime) {
        this.selectionConfig.echoTime = Math.round(echoTime * 10) / 10 // round to nearest 10
        this.echoTimeLocal = Math.round(echoTime * 10) / 10 // round to nearest 10
        console.log('echoTimeLocal', this.echoTimeLocal)
        // Reset signal average when echoTime changes
        this.$store.dispatch('selectionConfig/setSignalAverage', { signalAverage: null, ident: this.selectionIdent })
        // Reset bSignalAverages for DIFF sequences
        if (this.selectionConfig.sequenceType === 'DIFF') {
          this.$store.dispatch('selectionConfig/setBSignalAverages', {
            bSignalAverages: [],
            ident: this.selectionIdent,
          })
        }
      },
    },
    repetitionTime: {
      get() {
        return _.get(this.selectionConfig, 'repetitionTime')
      },
      set(repetitionTime) {
        this.selectionConfig.repetitionTime = repetitionTime
        this.repetitionTimeLocal = repetitionTime
        // Reset signal average when repetitionTime changes
        this.$store.dispatch('selectionConfig/setSignalAverage', { signalAverage: null, ident: this.selectionIdent })
        // Reset bSignalAverages for DIFF sequences
        if (this.selectionConfig.sequenceType === 'DIFF') {
          this.$store.dispatch('selectionConfig/setBSignalAverages', {
            bSignalAverages: [],
            ident: this.selectionIdent,
          })
        }
      },
    },
    windowLevel: {
      get() {
        return _.get(this.selectionConfig, 'windowLevel')
      },
      set(windowLevel) {
        this.selectionConfig.windowLevel = windowLevel
        this.windowLevelLocal = windowLevel
      },
    },
    breathingInstruction: {
      get() {
        return _.get(this.selectionConfig, 'breathingInstruction')
      },
      set(value) {
        this.selectionConfig.breathingInstruction = value
        this.breathingInstructionLocal = value
        this.syncSelectionConfigToOtherIndent({
          selectionIdent: this.selectionIdent,
          keys: ['breathingInstruction'],
        })
      },
    },
    windowWidth: {
      get() {
        return _.get(this.selectionConfig, 'windowWidth')
      },
      set(windowWidth) {
        this.selectionConfig.windowWidth = windowWidth
        this.windowWidthLocal = windowWidth
      },
    },
    windowLevelWidth: {
      get() {
        const windowLevel = _.get(this.selectionConfig, 'windowLevel')
        const windowWidth = _.get(this.selectionConfig, 'windowWidth')
        const value = this.windowLevelWidths.find(
          (_windowLevelWidth) => _windowLevelWidth.value === convertWindowLevelWidth(windowLevel, windowWidth)
        )

        return value
      },
      set(windowLevelWidth) {
        if (windowLevelWidth?.value) {
          this.selectionConfig.windowWidth = windowLevelWidth.windowWidth
          this.selectionConfig.windowLevel = windowLevelWidth.windowLevel
          this.syncSelectionConfigToOtherIndent({
            selectionIdent: this.selectionIdent,
            keys: ['windowWidth', 'windowLevel'],
          })

          this.windowWidthLocal = windowLevelWidth.windowWidth
          this.windowLevelLocal = windowLevelWidth.windowLevel
          this.windowLevelWidthLocal = windowLevelWidth.value
        }
      },
    },
    kernel: {
      get() {
        return _.get(this.selectionConfig, 'kernel')
      },
      set(kernel) {
        this.selectionConfig.kernel = kernel
        this.syncSelectionConfigToOtherIndent({
          selectionIdent: this.selectionIdent,
          keys: ['kernel'],
        })

        this.kernelLocal = kernel
      },
    },
    cardiacAcquisitionType: {
      get() {
        return _.get(this.selectionConfig, 'cardiacAcquisitionType', CARDIAC_ACQUISITION_TYPE.PROSPECTIVE)
      },
      set(cardiacAcquisitionType) {
        this.selectionConfig.cardiacAcquisitionType = cardiacAcquisitionType

        this.cardiacAcquisitionTypeLocal = cardiacAcquisitionType
      },
    },
    tubePotential: {
      get() {
        return _.get(this.selectionConfig, 'tubePotential')
      },
      set(tubePotential) {
        this.selectionConfig.tubePotential = tubePotential
        this.tubePotentialLocal = tubePotential
      },
    },
    tubeCurrent: {
      get() {
        return _.get(this.selectionConfig, 'tubeCurrent')
      },
      set(tubeCurrent) {
        let newValue = tubeCurrent
        if (newValue < TUBE_CONFIG.MIN) {
          newValue = TUBE_CONFIG.MIN
        } else if (newValue > TUBE_CONFIG.MAX) {
          newValue = TUBE_CONFIG.MAX
        }
        this.selectionConfig.tubeCurrent = newValue
        this.tubeCurrentLocal = newValue
      },
    },
    rotationTime: {
      get() {
        return _.get(this.selectionConfig, 'rotationTime')
      },
      set(rotationTime) {
        this.selectionConfig.rotationTime = rotationTime
        this.rotationTimeLocal = rotationTime
      },
    },
    pitch: {
      get() {
        return _.get(this.selectionConfig, 'pitch', 0.8)
      },
      set(pitch) {
        this.selectionConfig.pitch = pitch
      },
    },
    beamSelected: {
      get() {
        return _.get(this.selectionConfig, 'beamSelected', { text: 'Narrow: 20mm', value: 20, dim: '36 x 0.6' })
      },
      set(beamSelected) {
        this.$store.dispatch('selectionConfig/setSelectionConfig', {
          ident: this.selectionIdent,
          selectionConfig: { beamSelected },
        })
        this.beamSelectedLocal = beamSelected
      },
    },
    inversionTime: {
      get() {
        return _.get(this.selectionConfig, 'inversionTime')
      },
      set(inversionTime) {
        // these need to be set and available to cancel operations
        this.latestChangeData = {
          changeFromLabel: this.$t('SelectionConfigForm.inversion_recovery'),
          changeFromOldValue: this.inversionTime,
          changeFromNewValue: inversionTime,
          changeToLabel: this.$t('SelectionConfigForm.repetition_time'),
          changeToOldValue: this.repetitionTime,
        }

        if (this.selectionConfig) this.selectionConfig.inversionTime = inversionTime
        this.inversionTimeLocal = inversionTime
        // Reset signal average when inversionTime changes
        this.$store.dispatch('selectionConfig/setSignalAverage', { signalAverage: null, ident: this.selectionIdent })
      },
    },
    flipAngle: {
      get() {
        return _.get(this.selectionConfig, 'flipAngle')
      },
      set(flipAngle) {
        this.selectionConfig.flipAngle = flipAngle
        this.flipAngleLocal = flipAngle
        // Reset signal average when flipAngle changes
        this.$store.dispatch('selectionConfig/setSignalAverage', { signalAverage: null, ident: this.selectionIdent })
        // Reset bSignalAverages for DIFF sequences
        if (this.selectionConfig.sequenceType === 'DIFF') {
          this.$store.dispatch('selectionConfig/setBSignalAverages', {
            bSignalAverages: [],
            ident: this.selectionIdent,
          })
        }
      },
    },
    fatSuppression: {
      get() {
        return _.get(this.selectionConfig, 'fatSuppression')
      },
      set(fatSuppression) {
        // these need to be set and available to cancel operations
        this.latestChangeData = {
          changeFromLabel: this.$t('SelectionConfigForm.fat_saturation'),
          changeFromOldValue: this.fatSuppression,
          changeFromNewValue: fatSuppression,
          changeToLabel: this.$t('SelectionConfigForm.repetition_time'),
          changeToOldValue: this.repetitionTime,
        }

        this.selectionConfig.fatSuppression = fatSuppression
        this.fatSuppressionLocal = fatSuppression
        // Reset signal average when fatSuppression changes
        this.$store.dispatch('selectionConfig/setSignalAverage', { signalAverage: null, ident: this.selectionIdent })
        // Reset bSignalAverages for DIFF sequences
        if (this.selectionConfig.sequenceType === 'DIFF') {
          this.$store.dispatch('selectionConfig/setBSignalAverages', {
            bSignalAverages: [],
            ident: this.selectionIdent,
          })
        }
      },
    },
    inversionRecovery: {
      get() {
        return _.get(this.selectionConfig, 'inversionRecovery')
      },
      set(inversionRecovery) {
        this.selectionConfig.inversionRecovery = inversionRecovery
        this.inversionRecoveryLocal = inversionRecovery
      },
    },
    heightChangeTarget: {
      get() {
        return this.$store.state.selectionConfig.heightChangeTarget
      },
      set(heightChangeTarget) {
        this.$store.commit('selectionConfig/set', { heightChangeTarget })
      },
    },
    answerSelectionsHasUnseenChoice() {
      return _.size(this.answersSelections) > 1 && !this.hasLookedAtAnswersSelectionsByQuestionId[this.stackQuestion.id]
    },
    scanLength() {
      // return this.thickness * this.numberOfSlices
      return this.dimensions3z
    },
    scanTimeCT() {
      const l = this.thickness * this.numberOfSlices // thickness x # of slices (mm)
      const w = this.beamSelected.value // beam width (mm)
      const p = this.pitch // pitch
      const r = this.rotationTime // rotation time (secs)

      return Math.max(0.5, _.round((r * l) / (w * p), 1))
    },
    vendorStylePreference: {
      get: function () {
        if (this.vendorStylePreferenceLocal === null) {
          this.vendorStylePreferenceLocal = this.$store.getters['user/softwareVendorPreference'] || 'siemens'
        }
        return this.vendorStylePreferenceLocal
      },
      set: function (newValue) {
        this.vendorStylePreferenceLocal = newValue
      },
    },
    fieldStrengthPreference: {
      get: function () {
        if (!this.selectionConfig) {
          console.warn('selectionConfig is undefined. Returning default fieldStrength.')
          return this.$store.getters['user/fieldStrengthPreference'] || '3.0'
        }
        let fieldStrength = this.selectionConfig.fieldStrength
        if (!fieldStrength) {
          fieldStrength = this.$store.getters['user/fieldStrengthPreference']
          this.selectionConfig.fieldStrength = fieldStrength
        }
        return fieldStrength
      },
      set: function (newValue) {
        if (this.selectionConfig) {
          this.selectionConfig.fieldStrength = newValue
          // Note: signalAverage reset is handled by the watcher above (lines 528-542)
        }
      },
    },
    concatenations: {
      get() {
        return _.get(this.selectionConfig, 'concatenations')
      },
      set(concatenations) {
        this.selectionConfig.concatenations = concatenations
        this.concatenationsLocal = concatenations
      },
    },
    averages: {
      get() {
        return _.get(this.selectionConfig, 'averages')
      },
      set(averages) {
        this.selectionConfig.averages = averages
        this.averagesLocal = averages
      },
    },
    parallelFactor: {
      get() {
        return _.get(this.selectionConfig, 'parallelFactor')
      },
      set(parallelFactor) {
        this.selectionConfig.parallelFactor = parallelFactor
        this.parallelFactorLocal = parallelFactor
      },
    },
    specialtyTabHeader() {
      if (this.isEditingQuestion) return this.$t('SelectionConfigForm.specialty')
      else return this.specialtyOption
    },
    rfPulsing: {
      get() {
        console.log('getting rfPulsing')
        const value = _.get(this.selectionConfig, 'rfPulsing') || 'fast'
        // Normalize old values to new internal format
        return this.normalizeRFPulsingValue(value)
      },
      set(rfPulsing) {
        console.log('setting rfPulsing')
        this.selectionConfig.rfPulsing = rfPulsing
      },
    },
    gradientRamp: {
      get() {
        const value = _.get(this.selectionConfig, 'gradientRamp') || 'fast'
        // Normalize old values to new internal format
        return this.normalizeGradientRampValue(value)
      },
      set(gradientRamp) {
        this.selectionConfig.gradientRamp = gradientRamp
        this.gradientRampLocal = gradientRamp
      },
    },
    slabThicknessMethod: {
      get() {
        return this.$store.getters['selectionConfig/slabThicknessMethod']
      },
      set(value) {
        this.$store.commit('selectionConfig/set', { slabThicknessMethod: value })
      },
    },
    specialtyOption: {
      get() {
        return _.get(this.selectionConfig, 'specialtyOption')
      },
      set(specialtyOption) {
        this.selectionConfig.specialtyOption = specialtyOption
      },
    },
    diffusionDirections: {
      get() {
        return _.get(this.selectionConfig, 'diffusionDirections')
      },
      set(diffusionDirections) {
        this.selectionConfig.diffusionDirections = diffusionDirections
      },
    },
    numBValues: {
      get() {
        return _.get(this.selectionConfig, 'numBValues', 2)
      },
      set(value) {
        const clampedValue = Math.max(1, Math.min(4, value))
        this.selectionConfig.numBValues = value

        let newBValues = [...this.bValues]
        let newBAverages = [...this.bAverages]

        if (newBValues.length === 0) {
          newBValues = [0, 1]
          newBAverages = [1, 1]
        }

        if (newBValues.length < clampedValue) {
          while (newBValues.length < clampedValue) {
            const lastValue = newBValues[newBValues.length - 1]
            const nextValue = lastValue + 1
            // If this will be the last b-value and it's < 50, set to 50
            const willBeLastValue = newBValues.length + 1 === clampedValue
            const newValue = willBeLastValue && nextValue < 50 ? 50 : nextValue
            newBValues.push(newValue) // Add value greater than the last
            newBAverages.push(1) //default bAverages value
          }
        } else if (newBValues.length > clampedValue) {
          newBValues = newBValues.slice(0, clampedValue) // Remove from the end
          newBAverages = newBAverages.slice(0, clampedValue)

          // After removing, ensure the new maximum b-value is at least 50
          if (newBValues.length > 0) {
            const lastIndex = newBValues.length - 1
            if (newBValues[lastIndex] < 50) {
              newBValues[lastIndex] = 50
            }
          }
        }

        this.bValues = newBValues
        this.bAverages = newBAverages
      },
    },
    bValues: {
      get() {
        return _.get(this.selectionConfig, 'bValues', [0])
      },
      set(bValues) {
        this.selectionConfig.bValues = bValues
      },
    },
    bAverages: {
      get() {
        return _.get(this.selectionConfig, 'bAverages', [1])
      },
      set(bAverages) {
        console.log('setting b averages', bAverages)
        this.selectionConfig.bAverages = bAverages
      },
    },
    diffusionADC: {
      get() {
        return _.get(this.selectionConfig, 'diffusionADC')
      },
      set(diffusionADC) {
        this.selectionConfig.diffusionADC = diffusionADC
      },
    },
    sumOfBAveragesWithZeroBValue() {
      console.log('here in sumOfBAveragesWithZeroBValue')
      return this.bValues.reduce((sum, bValue, index) => {
        if (bValue === 0) {
          return sum + this.bAverages[index]
        }
        return sum
      }, 0)
    },
    diffusionScanTime() {
      let output = 0

      //const nb = this.numBValues.length // number of b-values
      const nb0 = this.bValues.filter((value) => value === 0).length // number of b-values with value 0
      if (nb0 > 1) console.warn('diffusionScanTime nb0 > 1')
      const trConc = this.repetitionTime
      const nDir = this.diffusionDirections
      const sumOfAvgs = this.bAverages.reduce((a, b) => a + b, 0)
      const sumOfAvgsB0 = this.sumOfBAveragesWithZeroBValue

      console.log('nb0', nb0)
      console.log('nDir', nDir)
      console.log('trConc', trConc)
      console.log('sumOfAvgs', sumOfAvgs)
      console.log('sumOfAvgsB0', sumOfAvgsB0)
      // TR Conc (Ndir sum(avgvals[i],1<i<Nb)-((Ndir-1) Nb0 avgvals[b==0]))
      output = trConc * (nDir * sumOfAvgs - (nDir - 1) * nb0 * sumOfAvgsB0)
      return output
    },
    CTDIARef() {
      return 0.078
    },
    CTDICPhantom() {
      const phantomValue = this.bodyPartPhantom
      return Math.round(Math.log2(32 / phantomValue) + 1)
    },
    CTDICDetectorConfiguration() {
      const detectorConfiguration = _.get(this.beamSelectedLocal, ['value'], 40)
      if (detectorConfiguration === 40) {
        // 40mm beam
        return 1
      } else if (detectorConfiguration === 20) {
        // 20mm beam
        return 1.05
      } else {
        // 10mm beam
        return 1.1
      }
    },
    CTDIKV() {
      const kVp = this.kvpLocal || 120
      if (kVp == 80) return 0.44
      else if (kVp == 100) return 0.69
      else if (kVp == 120) return 1.0
      else return 1.36
    },
    CTDI() {
      if (!this.isAcquisitionQuestion) return 0
      const pitch = this.pitch || 1
      const mA = this.tubeCurrent || TUBE_CONFIG.DEFAULT
      const s = this.rotationTime || 1
      return _.round(
        this.CTDIARef * this.CTDIKV * this.CTDICPhantom * this.CTDICDetectorConfiguration * ((mA * s) / pitch),
        2
      )
    },
    DLP() {
      if (!this.isAcquisitionQuestion) return 0
      const ctdi = this.CTDI
      const scanLengthCm = this.scanLength / 10 // convert mm to cm
      return _.round(ctdi * scanLengthCm, 2)
    },
    scanTime() {
      console.log('Setting new scan time in config mixin')
      let scanTime = 0

      if (this.selectionConfig.sequenceType === 'DIFF') {
        scanTime = this.diffusionScanTime
      } else {
        const oversampling = 1 + this.oversampling
        const partialFourier = partialFourierToDecimal(this.partialFourier)
        let phaseMatrix = this.phaseMatrix
        if (this.vendorStylePreference === 'siemens') {
          // For Siemens, use the raw stored matrix units value
          phaseMatrix = _.get(this.selectionConfig, 'phaseMatrix')
        }

        let average = this.averages

        scanTime = this.concatenations * this.repetitionTime * average * partialFourier * oversampling * phaseMatrix

        let echoTrainLength = this.selectionConfig?.sequenceType === 'TE' ? this.echoTrainLength : 1
        scanTime = _.round(scanTime / echoTrainLength)

        scanTime = _.round(scanTime / (this.parallelFactor === 'Off' ? 1 : this.parallelFactor))
      }
      // store in selectionConfig for grading
      if (this.isUltraLab && this.selectionIdent === '0_proposed')
        this.selectionConfig.scanTime = _.round(scanTime / 1000)

      // need to do this to keep consistant with what is stored above
      // otherwise what is seen is not the same as what is graded
      scanTime = _.round(scanTime / 1000) * 1000
      const seconds = moment.duration(scanTime).seconds()
      let minutes = moment.duration(scanTime).minutes()
      const hours = moment.duration(scanTime).hours()
      minutes += hours * 60
      return minutes + ':' + (seconds > 9 ? seconds : '0' + seconds)
    },
    maxTEOptionsForSE() {
      return _.round((this.concatenations * this.repetitionTime) / this.numberOfSlices - 5)
    },
    maxTEOptionsForGRE() {
      return Math.max(1, _.round((this.concatenations * this.repetitionTime) / this.numberOfSlices - 1))
    },
    receiverBandwidthTooltip() {
      let bw = _.get(this.selectionConfig, 'receiverBandWidth')
      if (this.isUltraLab) {
        bw = this.convertToVendorBandwidth(
          'philips',
          bw,
          this.frequencyMatrix,
          this.selectionConfig?.fieldStrength || 1
        )
        const pixelShift = _.round(bw * this.frequencyVoxelSize, 2)
        console.log('pixelShift', pixelShift)
        if (this.selectionIdent === '0_proposed') this.selectionConfig.pixelShift = pixelShift
      }
      //return _.round(bw * this.frequencyVoxelSize, 2)
      return this.vendorStylePreference === 'philips'
        ? _.round(_.get(this.selectionConfig, 'receiverBandWidth'), 2)
        : _.round(bw, 2)
    },
    spacingTooltip() {
      if (
        //this.isUltraLab &&
        (this.vendorStylePreference === 'siemens' || this.vendorStylePreference === 'united') &&
        !this.isAddLocalizerMode
      ) {
        return _.round((this.thickness / 100) * this.spacing, 2)
      }
      return _.round(this.spacing, 2)
    },
    dimensions3xTooltip() {
      let dimensions3x = this.dimensions3x
      if (['siemens', 'philips', 'united'].includes(this.vendorStylePreference)) {
        dimensions3x = _.round((dimensions3x * this.dimensions3y) / 100)
      }
      if (['ge', 'canon'].includes(this.vendorStylePreference)) {
        dimensions3x *= 10
      }
      return dimensions3x + 'mm'
    },
    minConcatAcqPackage: {
      get() {
        // this code seems to be overcomplicated for the purpose.
        // it should be remove if there are no adverse recations to commenting it out (11.17.23)
        /*
        const slicesPerConcat = Math.ceil(this.numberOfSlices / this.concatenations)
        const echoTimePlus1 = this.echoTime + 1
        const echoSpacingTimesTrainLengthPlus5 = this.echoSpacing * this.echoTrainLength + 5
        if (!this.inversionRecovery) {
          if (this.selectionConfig?.sequenceType === 'TE') {
            return _.round(this.minSeqTr / this.concatenations)
          } else if (this.selectionConfig?.sequenceType === 'SE') {
            return _.round(echoTimePlus1 * slicesPerConcat) + this.inversionTime
          } else if (this.selectionConfig?.sequenceType === 'GRE') {
            return _.round(echoTimePlus1 * slicesPerConcat) + this.inversionTime
          }
        } else {
          let TRminNoInversion
          if (this.selectionConfig?.sequenceType === 'TE') {
            TRminNoInversion = _.round(this.minSeqTr / this.concatenations)
            return TRminNoInversion
          } else if (this.selectionConfig?.sequenceType === 'SE') {
            TRminNoInversion = _.round(echoTimePlus1 * slicesPerConcat) + this.inversionTime
            return TRminNoInversion
          } else if (this.selectionConfig?.sequenceType === 'GRE') {
            TRminNoInversion = _.round(echoTimePlus1 * slicesPerConcat) + this.inversionTime
            return TRminNoInversion
          }
        }
        return 0
        */
        if (!this.selectionConfig) {
          return
        }

        this.selectionConfig.minConcatAcqPackage = _.round(this.minSeqTr / this.concatenations)
        return _.round(this.minSeqTr / this.concatenations)
      },
    },
    minSeqTr: {
      get() {
        let params = {
          slices: this.numberOfSlices,
          echoSpacing: this.echoSpacing,
          echoTrainLength: this.echoTrainLength,
          echoTime: this.echoTime,
          inversionRecovery: this.inversionRecovery,
          inversionTime: this.inversionTime,
          sequenceType: this.selectionConfig?.sequenceType || 'TE',
          concatenations: this.concatenations,
          fatSuppression: this.fatSuppression,
          satBands: this.satBands,
          trNeeded: this.trNeeded(this.selectionConfig?.dimensions3?.x || 1, this.phaseVoxelSize),
          iPat: this.parallelFactor === 'Off' ? 1 : parseInt(this.parallelFactor),
          partialFourierAsDecimal: this.partialFourierAsDecimal,
          bMax: Math.max(...this.bValues) > 0,
          oversampling: this.oversampling,
        }
        return calculateMinSeqTR(params)
      },
    },
    minSeqTe() {
      switch (this.selectionConfig.sequenceType) {
        case 'TE':
          return this.minTEOptionsForTEandDIFF
        case 'DIFF':
          return this.minTEOptionsForTEandDIFF
        case 'SSFP':
          return this.minTEOptionsForTEandDIFF
        case 'SE':
          return 3
        case 'GRE':
          return 1
      }
    },
    stepForPhaseMatrix() {
      return this.vendorStylePreference === 'siemens' ? 1 : 32
    },
    phaseMatrixTooltip() {
      let phaseMatrix = this.phaseMatrix
      if (this.vendorStylePreference === 'siemens') {
        // For Siemens, display the raw stored matrix units value, not the percentage
        phaseMatrix = _.get(this.selectionConfig, 'phaseMatrix')
      }
      return this.frequencyMatrix + ' x ' + phaseMatrix
    },
    partialFourier: {
      get() {
        return _.get(this.selectionConfig, 'partialFourier')
      },
      set(partialFourier) {
        this.selectionConfig.partialFourier = partialFourier
        this.partialFourierLocal = partialFourier
      },
    },
    receiverBandWidth: {
      get() {
        let bw = _.get(this.selectionConfig, 'receiverBandWidth')
        if (this.isUltraLab) {
          bw = this.convertToVendorBandwidth(
            this.vendorStylePreference,
            bw,
            this.frequencyMatrix,
            this.selectionConfig?.fieldStrength || 1
          )
        }
        return _.round(bw, 2)
        //return _.get(this.selectionConfig, 'receiverBandWidth')
      },
      set(receiverBandWidth) {
        let convertedValue = receiverBandWidth
        if (this.isUltraLab) {
          convertedValue = this.convertFromVendorBandwidth(
            this.vendorStylePreference,
            receiverBandWidth,
            this.frequencyMatrix,
            this.selectionConfig?.fieldStrength || 1
          )
        }

        // Validate minimum value after conversion (in internal format)
        const minValue = this.vendorStylePreference === 'siemens' ? 100 : 1
        if (convertedValue < minValue) {
          convertedValue = minValue
        }

        this.selectionConfig.receiverBandWidth = convertedValue
        this.receiverBandWidthLocal = convertedValue
      },
    },
    echoSpacing() {
      console.log('echoSpacing')
      console.log('this.echoTime: ', this.echoTime)
      console.log('setting echoSpacing: ', this.selectionConfig?.sequenceType)
      let output = 0
      switch (this.selectionConfig?.sequenceType) {
        case 'DIFF':
          output = 1000 / this.selectionConfig.receiverBandWidth + this.gradientRampTime
          break
        case 'TE':
        case 'SSFP':
          output = 1000 / this.selectionConfig.receiverBandWidth + this.gradientRampTime + this.rfPulseDuration
          break
        default:
          output = 10
          break
      }

      output = Math.round(output * 10) / 10 // Round to 1 decimal place
      this.selectionConfig.echoSpacing = output
      return output
    },
    echoTrainLength: {
      get() {
        let output = _.get(this.selectionConfig, 'echoTrainLength')

        if (this.selectionConfig?.sequenceType == 'DIFF') {
          // TR.Needed * Partial Fourier * Oversampling / Parallel Factor
          let trNeeded = this.trNeeded(this.selectionConfig?.dimensions3?.x || 1, this.phaseVoxelSize)
          let iPat = this.parallelFactor === 'Off' ? 1 : parseInt(this.parallelFactor) // parrallel factor
          output = (trNeeded * this.partialFourierAsDecimal * (1 + this.oversampling)) / iPat
          output = Math.round(output)
        }
        return output
      },
      set(echoTrainLength) {
        if (this.selectionConfig) {
          this.selectionConfig.echoTrainLength = echoTrainLength
        }
        this.echoTrainLengthLocal = echoTrainLength
      },
    },
    partialFourierAsDecimal() {
      return partialFourierToDecimal(this.partialFourier)
    },
    phaseEncodingLines() {
      let baseMatrix = this.frequencyMatrix
      let phaseFov = (this.selectionConfig?.dimensions3?.x || 1) / (this.selectionConfig?.dimensions3?.y || 1)
      let phaseResolution = (this.selectionConfig?.phaseMatrix || 1) / (this.selectionConfig?.frequencyMatrix || 1)
      let oversampling = this.oversampling
      let partialFourier = this.partialFourierAsDecimal
      let iPat = this.parallelFactor === 'Off' ? 1 : parseInt(this.parallelFactor)
      let npe = (baseMatrix * phaseFov * phaseResolution * (1 + oversampling) * partialFourier) / iPat

      return npe
    },
    bNoiseFactor() {
      let bNoise = []
      for (let i = 0; i < this.bValues.length; i++) {
        let fieldStrength = Number(this.selectionConfig?.fieldStrength || '1.5')
        let k = this.kLookup('default', fieldStrength) // constant value to adjust the noise to match real data
        let signal = 1 // set to one as the signal values is applied in cruncher
        let readVoxelSize = this.frequencyVoxelSize
        let phaseVoxelSize = this.phaseVoxelSize
        let sliceThickness = this.thickness
        let phaseEncodingLines = this.phaseEncodingLines
        let averages = this.bAverages[i]
        let receiverBandwidth = this.selectionConfig?.receiverBandWidth || 100
        bNoise[i] =
          fieldStrength *
          k *
          signal *
          readVoxelSize *
          phaseVoxelSize *
          sliceThickness *
          Math.sqrt((phaseEncodingLines * averages) / receiverBandwidth)

        console.log({ k: k, bsnr: bNoise[i] })
      }

      return bNoise
    },
    noiseFactor() {
      if (!this.isUltraLab) return 150
      let fieldStrength = Number(this.selectionConfig?.fieldStrength || '1.5')
      let k = this.kLookup('default', fieldStrength) // constant value to adjust the noise to match real data
      let signal = 1 // set to one as the signal values is applied in cruncher
      let readVoxelSize = this.frequencyVoxelSize
      let phaseVoxelSize = this.phaseVoxelSize
      let sliceThickness = this.thickness
      let phaseEncodingLines = this.phaseEncodingLines
      let averages = this.selectionConfig?.sequenceType === 'DIFF' ? Math.max(...this.bAverages) : this.averages
      let receiverBandwidth = this.selectionConfig?.receiverBandWidth || 100
      let noise =
        fieldStrength *
        k *
        signal *
        readVoxelSize *
        phaseVoxelSize *
        sliceThickness *
        Math.sqrt((phaseEncodingLines * averages) / receiverBandwidth)

      console.log({ k: k, noise: noise })
      return noise
    },
    signalAverage() {
      return this.selectionConfig?.signalAverage || null
    },
    signalAverageHalfTR() {
      return this.selectionConfig?.signalAverageHalfTR || null
    },
    bSignalAverages() {
      return this.selectionConfig?.bSignalAverages || []
    },
    savedSnr() {
      return this.selectionConfig?.savedSnr || null
    },
    snrDifference() {
      if (this.savedSnr === null || this.selectionConfig?.snr === null) {
        return null
      }
      return this.selectionConfig.snr / this.savedSnr
    },
    labels() {
      return {
        swap: {
          siemens: this.$t('MRI.swap_phase'),
          ge: this.$t('MRI.swap_frequency'),
          philips: this.$t('MRI.swap_phase'),
          hitachi: this.$t('MRI.swap_phase'),
          united: this.$t('MRI.swap_phase'),
          canon: this.$t('MRI.swap_phase'),
        },
        gap: {
          siemens: this.$t('global.distance_factor'),
          ge: isCTLab ? this.$t('global.slice_interval') : this.$t('global.slice_gap'),
          philips: isCTLab ? this.$t('global.slice_interval') : this.$t('global.slice_gap'),
          hitachi: this.$t('global.slice_interval'),
          united: isCTLab ? this.$t('global.slice_interval') : this.$t('global.slice_gap'),
          canon: this.$t('global.slice_gap'),
        },
        wrapPrevent: {
          siemens: this.$t('SelectionConfigForm.oversampling'),
          ge: this.$t('SelectionConfigForm.no_phase_wrap'),
          philips: this.$t('SelectionConfigForm.fold_over_suppression'),
          hitachi: this.$t('SelectionConfigForm.anti_wrap'),
          united: this.$t('SelectionConfigForm.no_wrap'),
          canon: this.$t('SelectionConfigForm.no_wrap'),
        },
        averageLabel: {
          siemens: this.$t('SelectionConfigForm.averages'),
          ge: this.$t('SelectionConfigForm.nex'),
          philips: this.$t('SelectionConfigForm.nsa'),
          hitachi: this.$t('SelectionConfigForm.nsa'),
          united: this.$t('SelectionConfigForm.naq'),
          canon: this.$t('SelectionConfigForm.naq'),
        },
        concatenationLabel: {
          siemens: this.$t('SelectionConfigForm.concatenations'),
          ge: this.$t('SelectionConfigForm.acquisitions'),
          philips: this.$t('SelectionConfigForm.packages'),
          hitachi: this.$t('SelectionConfigForm.acquisitions'),
          united: this.$t('SelectionConfigForm.covers'),
          canon: this.$t('SelectionConfigForm.covers'),
        },
        echoTrainLabel: {
          siemens:
            this.selectionConfig?.sequenceType === 'DIFF'
              ? this.$t('SelectionConfigForm.phase_encoding_lines')
              : this.$t('SelectionConfigForm.turbo_factor'),
          ge:
            this.selectionConfig?.sequenceType === 'DIFF'
              ? this.$t('SelectionConfigForm.phase_encoding_lines')
              : this.$t('SelectionConfigForm.echo_train_length'),
          philips:
            this.selectionConfig?.sequenceType === 'DIFF'
              ? this.$t('SelectionConfigForm.phase_encoding_lines')
              : this.$t('SelectionConfigForm.echo_train_length_philips'),
          hitachi:
            this.selectionConfig?.sequenceType === 'DIFF'
              ? this.$t('SelectionConfigForm.phase_encoding_lines')
              : this.$t('SelectionConfigForm.echo_factor'),
          united:
            this.selectionConfig?.sequenceType === 'DIFF'
              ? this.$t('SelectionConfigForm.phase_encoding_lines')
              : this.$t('SelectionConfigForm.turbo_factor'),
          canon:
            this.selectionConfig?.sequenceType === 'DIFF'
              ? this.$t('SelectionConfigForm.phase_encoding_lines')
              : this.$t('SelectionConfigForm.echo_factor'),
        },
        resolutionPritial: {
          siemens: this.$t('SelectionConfigForm.partial_fourier'),
          ge: this.$t('SelectionConfigForm.half_nex'),
          philips: this.$t('SelectionConfigForm.half_scan'),
          hitachi: this.$t('SelectionConfigForm.half_scan'),
          united: this.$t('SelectionConfigForm.afi'),
          canon: this.$t('SelectionConfigForm.afi'),
        },
        parallelFactor: {
          siemens: this.$t('SelectionConfigForm.i_pat_factor'),
          ge: this.$t('SelectionConfigForm.asset_factor'),
          philips: this.$t('SelectionConfigForm.sense_factor'),
          hitachi: this.$t('SelectionConfigForm.k_rapid_factor'),
          united: this.$t('SelectionConfigForm.speeder'),
          canon: this.$t('SelectionConfigForm.speeder'),
        },
        timeBetweenEchoes: {
          siemens: this.$t('SelectionConfigForm.echo_spacing'),
          ge: this.$t('SelectionConfigForm.echo_spacing'),
          philips: this.$t('SelectionConfigForm.echo_spacing_philips'),
          hitachi: this.$t('SelectionConfigForm.ite'),
          united: this.$t('SelectionConfigForm.ets'),
          canon: this.$t('SelectionConfigForm.ite'),
        },
        flipAngleLabel: {
          siemens: this.$t('global.flip_angle'),
          ge: this.$t('global.flip_angle'),
          philips: this.$t('global.flip_angle'),
          hitachi: this.$t('global.flip_angle'),
          united: this.$t('global.flip_angle'),
          canon: ['SE', 'TE', 'DIFF'].includes(this.selectionConfig?.sequenceType)
            ? this.$t('global.flop_angle')
            : this.$t('global.flip_angle'),
        },
        frequencyMatrixLabel: {
          siemens: this.$t('global.base_matrix'),
          ge: this.$t('global.frequency_matrix'),
          philips: this.$t('global.frequency_matrix'),
          hitachi: this.$t('global.frequency_matrix'),
          united: this.$t('global.frequency_matrix'),
          canon: this.$t('global.read_out_matrix'),
        },
        phaseMatrixLabel: {
          siemens: this.$t('global.phase_matrix'),
          ge: this.$t('global.phase_matrix'),
          philips: this.$t('global.phase_matrix'),
          hitachi: this.$t('global.phase_matrix'),
          united: this.$t('global.phase_matrix'),
          canon: this.$t('global.pe_matrix'),
        },
        sequenceTypeLabel: {
          siemens: {
            SE: this.$t('SelectionConfigForm.spin_echo'),
            GRE: this.$t('SelectionConfigForm.gradient_echo'),
            TE: this.$t('SelectionConfigForm.turbo_spin_echo'),
            DIFF: this.$t('SelectionConfigForm.spin_echo_diffusion'),
            SSFP: this.$t('SelectionConfigForm.steady_state_free_precession'),
          },
          united: {
            SE: this.$t('SelectionConfigForm.spin_echo'),
            GRE: this.$t('SelectionConfigForm.fast_field_echo'),
            TE: this.$t('SelectionConfigForm.fast_spin_echo'),
            DIFF: this.$t('SelectionConfigForm.spin_echo_diffusion'),
            SSFP: this.$t('SelectionConfigForm.steady_state_free_precession'),
          },
          ge: {
            SE: this.$t('SelectionConfigForm.spin_echo'),
            GRE: this.$t('SelectionConfigForm.gradient_echo'),
            TE: this.$t('SelectionConfigForm.fast_spin_echo'),
            DIFF: this.$t('SelectionConfigForm.spin_echo_diffusion'),
            SSFP: this.$t('SelectionConfigForm.steady_state_free_precession'),
          },
          philips: {
            SE: this.$t('SelectionConfigForm.spin_echo'),
            GRE: this.$t('SelectionConfigForm.fast_field_echo'),
            TE: this.$t('SelectionConfigForm.turbo_spin_echo'),
            DIFF: this.$t('SelectionConfigForm.spin_echo_diffusion'),
            SSFP: this.$t('SelectionConfigForm.steady_state_free_precession'),
          },
          hitachi: {
            SE: this.$t('SelectionConfigForm.spin_echo'),
            GRE: this.$t('SelectionConfigForm.gradient_echo'),
            TE: this.$t('SelectionConfigForm.fast_spin_echo'),
            DIFF: this.$t('SelectionConfigForm.spin_echo_diffusion'),
            SSFP: this.$t('SelectionConfigForm.steady_state_free_precession'),
          },
          canon: {
            SE: this.$t('SelectionConfigForm.spin_echo'),
            GRE: this.$t('SelectionConfigForm.fast_field_echo'),
            TE: this.$t('SelectionConfigForm.fast_spin_echo'),
            DIFF: this.$t('SelectionConfigForm.spin_echo_diffusion'),
            SSFP: this.$t('SelectionConfigForm.steady_state_free_precession'),
          },
        },
        minTRLabel: {
          siemens: this.$t('SelectionConfigForm.min_concat_acq_package_for_siemens'),
          ge: this.$t('SelectionConfigForm.min_concat_acq_package_for_ge'),
          philips: this.$t('SelectionConfigForm.min_concat_acq_package_for_philips'),
          hitachi: this.$t('SelectionConfigForm.min_concat_acq_package_for_hitachi'),
          united: this.$t('SelectionConfigForm.min_concat_acq_package_for_canon'),
          canon: this.$t('SelectionConfigForm.min_concat_acq_package_for_hitachi'),
        },
        rfPulsing: {
          siemens: this.$t('SelectionConfigForm.rf_pulse_type'),
          ge: this.$t('SelectionConfigForm.rf_pulsing'),
          philips: this.$t('SelectionConfigForm.rf_pulsing'),
          hitachi: this.$t('SelectionConfigForm.rf_pulsing'),
          united: this.$t('SelectionConfigForm.rf_pulsing'),
          canon: this.$t('SelectionConfigForm.rf_pulsing'),
        },
        gradientRamp: {
          siemens: this.$t('SelectionConfigForm.gradient_mode'),
          ge: this.$t('SelectionConfigForm.gradient_ramp'),
          philips: this.$t('SelectionConfigForm.gradient_ramp'),
          hitachi: this.$t('SelectionConfigForm.gradient_ramp'),
          united: this.$t('SelectionConfigForm.gradient_ramp'),
          canon: this.$t('SelectionConfigForm.gradient_ramp'),
        },
        frequencyFovLabel: {
          siemens: this.$t('global.frequency_mm'),
          ge: this.$t('global.frequency_mm'),
          philips: this.$t('global.frequency_mm'),
          hitachi: this.$t('global.frequency_mm'),
          united: this.$t('global.frequency_mm'),
          canon: this.$t('global.read_out_fov'),
        },
        phaseFovLabel: {
          siemens: this.$t('global.phase_mm'),
          ge: this.$t('global.phase_mm'),
          philips: this.$t('global.phase_mm'),
          hitachi: this.$t('global.phase_mm'),
          united: this.$t('global.phase_mm'),
          canon: this.$t('global.pe_fov'),
        },
      }
    },
  },
  methods: {
    // Format number with min 1, max 2 decimal places for resolution display
    formatResolution(value) {
      const num = Number(value)
      const fixed2 = num.toFixed(2)
      // If ends in 0 (like 2.50), use 1 decimal; otherwise use 2
      return fixed2.endsWith('0') ? num.toFixed(1) : fixed2
    },
    roundEchoTimeToSpacing(echoTimeValue, forceMinimum = false) {
      // Validate echoSpacing
      if (!this.echoSpacing || this.echoSpacing <= 0) {
        console.warn('Invalid echoSpacing, skipping TE adjustment')
        return { needsRounding: false, roundedValue: echoTimeValue }
      }

      const remainder = echoTimeValue % this.echoSpacing
      const needsRounding =
        Math.abs(remainder) > TE_ROUNDING_EPSILON && Math.abs(remainder - this.echoSpacing) > TE_ROUNDING_EPSILON

      if (!needsRounding) {
        return { needsRounding: false, roundedValue: echoTimeValue }
      }

      let roundedValue

      // Special handling if value is less than echoSpacing and forceMinimum is true
      if (forceMinimum && echoTimeValue < this.echoSpacing) {
        roundedValue = this.echoSpacing
      } else {
        // Round to nearest multiple
        const roundUp = remainder >= this.echoSpacing / 2
        roundedValue = roundUp
          ? Math.ceil(echoTimeValue / this.echoSpacing) * this.echoSpacing
          : Math.floor(echoTimeValue / this.echoSpacing) * this.echoSpacing
      }

      return { needsRounding: true, roundedValue }
    },
    async fetchSignalAverage() {
      this.isFetchingSignalAverage = true
      try {
        const result = await this.$store.dispatch('dicomService/fetchSignalAverageOnly', {
          selectionConfig: this.selectionConfig,
        })

        if (this.selectionConfig.sequenceType === 'DIFF' && Array.isArray(result)) {
          // For DIFF sequences, store the array of signal averages
          this.$store.dispatch('selectionConfig/setBSignalAverages', {
            bSignalAverages: result,
            ident: this.selectionIdent,
          })
          // Also set the first value as the main signalAverage for backward compatibility
          this.$store.dispatch('selectionConfig/setSignalAverage', {
            signalAverage: result[0]?.signalAverage || null,
            ident: this.selectionIdent,
          })
          this.$store.dispatch('selectionConfig/setSignalAverageHalfTR', {
            signalAverageHalfTR: result[0]?.signalAverageHalfTR || null,
            ident: this.selectionIdent,
          })
        } else {
          // For non-DIFF sequences, store as single value
          this.$store.dispatch('selectionConfig/setSignalAverage', {
            signalAverage: result?.signalAverage || result,
            ident: this.selectionIdent,
          })
          this.$store.dispatch('selectionConfig/setSignalAverageHalfTR', {
            signalAverageHalfTR: result?.signalAverageHalfTR || null,
            ident: this.selectionIdent,
          })
          // Clear bSignalAverages array
          this.$store.dispatch('selectionConfig/setBSignalAverages', {
            bSignalAverages: [],
            ident: this.selectionIdent,
          })
        }
      } catch (error) {
        console.error('Error fetching signal average:', error)
        this.$notify({ type: 'error', text: 'Failed to fetch signal average' })
      } finally {
        this.isFetchingSignalAverage = false
      }
    },
    saveSNR() {
      if (this.selectionConfig.snr !== null) {
        this.$store.dispatch('selectionConfig/setSavedSnr', {
          savedSnr: this.selectionConfig.snr,
          ident: this.selectionIdent,
        })
        this.$notify({ type: 'success', text: 'SNR saved for comparison' })
      }
    },
    calculateOverlapPercentage() {
      // Calculate gap percentage: (spacing_mm / thickness_mm) * 100
      const gapPercentage = this.spacing !== 0 ? (this.spacingLocal / this.thickness) * 100 : 0

      // Calculate overlap: (gap * -0.5) + 50%
      const overlap = gapPercentage * -0.5 + 50
      const clampedOverlap = Math.max(0, Math.min(100, overlap))

      console.log('Overlap Calculation:', {
        spacingLocal: this.spacingLocal,
        thickness: this.thickness,
        gapPercentage: gapPercentage,
        rawOverlap: overlap,
        clampedOverlap: clampedOverlap,
      })

      return clampedOverlap // Clamp between 0-100%
    },
    calculateCrosstalkSignal() {
      const overlap = this.calculateOverlapPercentage()
      const overlapDecimal = overlap / 100 // Convert to decimal

      if (this.signalAverage === null || this.signalAverageHalfTR === null) {
        console.log('Crosstalk Calculation: Missing signal values', {
          signalAverage: this.signalAverage,
          signalAverageHalfTR: this.signalAverageHalfTR,
        })
        return null
      }

      // Crosstalk signal = (signalAverage × (100% - overlap)) + (signalAverageHalfTR × overlap)
      const crosstalkSignal = this.signalAverage * (1 - overlapDecimal) + this.signalAverageHalfTR * overlapDecimal

      console.log('Crosstalk Calculation:', {
        overlap: overlap,
        overlapDecimal: overlapDecimal,
        signalAverage: this.signalAverage,
        signalAverageHalfTR: this.signalAverageHalfTR,
        component1: this.signalAverage * (1 - overlapDecimal),
        component2: this.signalAverageHalfTR * overlapDecimal,
        crosstalkSignal: crosstalkSignal,
      })

      return crosstalkSignal
    },
    normalizeRFPulsingValue(value) {
      if (!value) return 'fast'

      // Convert to lowercase and handle spaces
      const normalized = value.toLowerCase().replace(' ', '_')

      // Validate against known values
      const validValues = ['fast', 'mid', 'low_sar']
      return validValues.includes(normalized) ? normalized : 'fast'
    },
    normalizeGradientRampValue(value) {
      if (!value) return 'fast'

      // Convert to lowercase and handle existing values
      const normalized = value.toLowerCase()

      // Map old values to new internal values for backward compatibility
      const validValues = ['fast', 'med', 'slow']
      return validValues.includes(normalized) ? normalized : 'fast'
    },
    getGradientRampDisplayText(internalValue) {
      if (!internalValue) return ''

      const vendor = this.vendorStylePreference || 'siemens'
      const vendorGradientModes = {
        siemens: {
          fast: 'fast',
          med: 'normal',
          slow: 'whisper',
        },
        ge: {
          fast: 'Fast',
          med: 'Normal',
          slow: 'Whisper',
        },
        philips: {
          fast: 'Fast',
          med: 'Normal',
          slow: 'Whisper',
        },
        hitachi: {
          fast: 'Fast',
          med: 'Normal',
          slow: 'Whisper',
        },
        united: {
          fast: 'Fast',
          med: 'Normal',
          slow: 'Whisper',
        },
      }

      // Canon has sequence-type specific gradient display text
      if (vendor === 'canon') {
        const sequenceType = this.selectionConfig?.sequenceType
        if (sequenceType === 'TE') {
          const canonTEModes = { fast: 'Fine', med: 'Normal', slow: 'Silent' }
          return canonTEModes[internalValue] || internalValue
        }
        if (sequenceType === 'DIFF') {
          const canonDIFFModes = { fast: 'Fine', med: 'Fast', slow: 'Normal' }
          return canonDIFFModes[internalValue] || internalValue
        }
        const canonModes = { fast: 'Fast', med: 'Normal', slow: 'Silent' }
        return canonModes[internalValue] || internalValue
      }

      return vendorGradientModes[vendor]?.[internalValue] || internalValue
    },
    getRFPulsingDisplayText(internalValue) {
      if (!internalValue) return ''

      const vendor = this.vendorStylePreference || 'siemens'
      const vendorRFModes = {
        siemens: {
          fast: 'fast',
          mid: 'normal',
          low_sar: 'lowSAR',
        },
        ge: {
          fast: 'Fast',
          mid: 'Normal',
          low_sar: 'Low SAR',
        },
        philips: {
          fast: 'Fast',
          mid: 'Normal',
          low_sar: 'Low SAR',
        },
        hitachi: {
          fast: 'Fast',
          mid: 'Normal',
          low_sar: 'Low SAR',
        },
        united: {
          fast: 'Fast',
          mid: 'Normal',
          low_sar: 'Low SAR',
        },
      }

      // Canon has sequence-type specific RF display text
      if (vendor === 'canon') {
        const sequenceType = this.selectionConfig?.sequenceType
        const normalizedValue = this.normalizeRFPulsingValue(internalValue)
        const canonRFModes = {
          SE: { fast: 'Fast', mid: 'Normal', low_sar: 'Low SAR' },
          GRE: { fast: 'Fast', mid: 'Fine', low_sar: 'Normal' },
          TE: { fast: 'Fine', mid: 'Normal', low_sar: 'Low SAR' },
          DIFF: { fast: 'Fast', mid: 'Normal', low_sar: 'Normal' },
        }
        return canonRFModes[sequenceType]?.[normalizedValue] || internalValue
      }

      // Normalize the value first (for backward compatibility)
      const normalizedValue = this.normalizeRFPulsingValue(internalValue)
      return vendorRFModes[vendor]?.[normalizedValue] || internalValue
    },
    convertRFPulsingDisplayTextToInternal(displayText) {
      if (!displayText) return 'fast'

      // Use existing rfPulsingItems array to find matching internal value
      const item = this.rfPulsingItems.find((item) => item.text === displayText)
      return item ? item.value : this.normalizeRFPulsingValue(displayText)
    },
    convertGradientRampDisplayTextToInternal(displayText) {
      if (!displayText) return 'fast'

      // Use existing gradientRampItems array to find matching internal value
      const item = this.gradientRampItems.find((item) => item.text === displayText)
      return item ? item.value : this.normalizeGradientRampValue(displayText)
    },
    calculateAndSetSNR() {
      console.log('=== calculateAndSetSNR START ===')
      console.log('Input values:', {
        signalAverage: this.signalAverage,
        signalAverageHalfTR: this.signalAverageHalfTR,
        concatenations: this.selectionConfig.concatenations,
        sequenceType: this.selectionConfig.sequenceType,
      })

      if (this.signalAverage === null) {
        console.log('signalAverage is null - setting SNR to null')
        this.$store.dispatch('selectionConfig/setSnr', { snr: null, ident: this.selectionIdent })
        return
      }

      const maxSignal = 18000
      const noiseFactor = this.noiseFactor || 1

      // Use crosstalk signal if there's 1 concatenation, otherwise use current signal
      let effectiveSignal
      if (this.selectionConfig.concatenations === 1) {
        console.log('Using crosstalk calculation (concatenations = 1)')
        effectiveSignal = this.calculateCrosstalkSignal()
        if (effectiveSignal === null) {
          console.log('Crosstalk calculation failed - falling back to regular signal')
          effectiveSignal = this.signalAverage || 0
        }
      } else {
        console.log('Using regular signal (concatenations ≠ 1)')
        effectiveSignal = this.signalAverage || 0
      }

      const snr = (effectiveSignal / maxSignal) * noiseFactor

      console.log('SNR Calculation Result:', {
        effectiveSignal: effectiveSignal,
        maxSignal: maxSignal,
        noiseFactor: noiseFactor,
        finalSNR: snr,
      })
      console.log('=== calculateAndSetSNR END ===')

      this.$store.dispatch('selectionConfig/setSnr', { snr, ident: this.selectionIdent })
    },
    calculateAndSetBSNRs() {
      console.log('=== calculateAndSetBSNRs START ===')
      console.log('DIFF sequence input:', {
        bSignalAverages: this.bSignalAverages,
        concatenations: this.selectionConfig.concatenations,
        sequenceType: this.selectionConfig.sequenceType,
      })

      if (!this.bSignalAverages || this.bSignalAverages.length === 0) {
        console.log('No bSignalAverages - setting SNRs to empty/null')
        this.$store.dispatch('selectionConfig/setBSnrs', { bSnrs: [], ident: this.selectionIdent })
        this.$store.dispatch('selectionConfig/setSnr', { snr: null, ident: this.selectionIdent })
        return
      }
      const maxSignal = 18000
      const bNoiseFactors = this.selectionConfig?.bNoiseFactors || []

      const bSnrs = this.bSignalAverages.map((signalAverageData, index) => {
        console.log(`Processing b-value ${index}:`, signalAverageData)

        if (signalAverageData === null) {
          console.log(`b-value ${index}: null data`)
          return null
        }

        // Handle both old format (just number) and new format (object with signalAverage and signalAverageHalfTR)
        let effectiveSignal
        if (typeof signalAverageData === 'object' && signalAverageData.signalAverage !== undefined) {
          console.log(`b-value ${index}: New object format detected`)
          // New format: object with signalAverage and signalAverageHalfTR
          if (this.selectionConfig.concatenations === 1 && signalAverageData.signalAverageHalfTR !== null) {
            console.log(`b-value ${index}: Using crosstalk calculation`)
            // Calculate crosstalk signal for this b-value
            const overlap = this.calculateOverlapPercentage()
            const overlapDecimal = overlap / 100
            effectiveSignal =
              signalAverageData.signalAverage * (1 - overlapDecimal) +
              signalAverageData.signalAverageHalfTR * overlapDecimal

            console.log(`b-value ${index} crosstalk:`, {
              signalAverage: signalAverageData.signalAverage,
              signalAverageHalfTR: signalAverageData.signalAverageHalfTR,
              overlap: overlap,
              component1: signalAverageData.signalAverage * (1 - overlapDecimal),
              component2: signalAverageData.signalAverageHalfTR * overlapDecimal,
              effectiveSignal: effectiveSignal,
            })
          } else {
            console.log(`b-value ${index}: Using standard signal (concatenations ≠ 1 or no halfTR)`)
            effectiveSignal = signalAverageData.signalAverage
          }
        } else {
          console.log(`b-value ${index}: Old number format detected`)
          // Old format: just a number
          effectiveSignal = signalAverageData
        }

        const noiseFactor = bNoiseFactors[index] || this.noiseFactor || 1
        const snr = (effectiveSignal / maxSignal) * noiseFactor

        console.log(`b-value ${index} final SNR:`, {
          effectiveSignal: effectiveSignal,
          noiseFactor: noiseFactor,
          snr: snr,
        })

        return snr
      })

      console.log('All calculated bSnrs:', bSnrs)
      this.$store.dispatch('selectionConfig/setBSnrs', { bSnrs, ident: this.selectionIdent })

      // Set the largest bSnrs value to selectionConfig.snr
      const validBSnrs = bSnrs.filter((snr) => snr !== null)
      const maxSNR = validBSnrs.length > 0 ? Math.max(...validBSnrs) : null

      console.log('DIFF sequence final result:', {
        validBSnrs: validBSnrs,
        maxSNR: maxSNR,
      })
      console.log('=== calculateAndSetBSNRs END ===')

      this.$store.dispatch('selectionConfig/setSnr', { snr: maxSNR, ident: this.selectionIdent })
    },
    ...mapActions('user', ['saveVendorStylePreference']),
    ...mapActions('selectionConfig', [
      'setSelectionConfigCurrentIdent',
      'copyCurMinSelectionConfigIntoProposed',
      'smartRotateSelectionConfigDir',
      'syncSelectionConfigToOtherIndent',
      'setSelectedMRIScanDirection',
      'copySelectionConfigFromAnswer',
      'syncSelectionConfigToMinMaxIndent',
      'adjustDLP',
      'adjustCTDI',
    ]),
    ...mapActions('questionService', [
      'selectNextQuestion',
      'setAnswerSelectionId',
      'selectPrevQuestion',
      'proceedToTakingPostQuestions',
      'questionTabOpen',
      'setScanDelay',
      'setActiveTab',
    ]),
    ...mapActions('stackService', ['setScanDurationOfConfig']),
    ...mapMutations('selectionConfig', ['setHotKeysEnabledCT']),
    ...mapMutations('dataToParent', ['setScanTime', 'setSequenceType']),
    ...mapMutations('scanTimeConfig', ['setMinSeqTRfuture', 'setMinConcatAcqPackagefuture']),
    ...mapActions('dataToParent', ['updateMixinValues']),
    ...mapActions('scanTimeConfig', [
      'updateTrueResolutionHeaderUltra',
      'updateTrueResolutionHeader',
      'updateAcquiredResolutionHeader',
      'updateScanTime',
    ]),
    trNeeded(phaseFov, phaseVoxelSize) {
      return Math.round((phaseFov / phaseVoxelSize) * 10) / 10
    },
    onSwapPhase() {
      if (this.isIdentTypeProposed) {
        this.smartRotateSelectionConfigDir({ identType: 'proposed' })
      } else if (this.isSelectionMin) {
        this.smartRotateSelectionConfigDir({ identType: 'min' })
      } else if (this.isSelectionMax) {
        this.smartRotateSelectionConfigDir({ identType: 'max' })
      } else {
        this.smartRotateSelectionConfigDir()
      }
    },
    updateSeqValues() {
      let modifiedSatBandsLength = this.satBands?.length

      if (this.satBands?.length === 0) {
        modifiedSatBandsLength = 1
      } else if (this.satBands?.length === 1) {
        modifiedSatBandsLength = 2
      }

      let params = {
        slices: this.numberOfSlices,
        echoSpacing: this.echoSpacing,
        echoTrainLength: this.echoTrainLength,
        echoTime: this.echoTime,
        inversionRecovery: this.inversionRecovery,
        inversionTime: this.inversionTime,
        sequenceType: this.selectionConfig.sequenceType,
        concatenations: this.concatenations,
        fatSuppression: this.fatSuppression,
        satBands: Array(modifiedSatBandsLength).fill(null),
        trNeeded: this.trNeeded(this.selectionConfig?.dimensions3?.x || 1, this.phaseVoxelSize),
        iPat: this.parallelFactor === 'Off' ? 1 : parseInt(this.parallelFactor),
        partialFourierAsDecimal: this.partialFourierAsDecimal,
      }

      // Calculate minSeqTR using modified params
      let minSeqTR = calculateMinSeqTR(params)
      let minConcatAcqPackage = _.round(minSeqTR / this.concatenations)
      console.log('Calculated minSeqTR with modified satBands:', minSeqTR)
      console.log('this.minConcatAcqPackages:', minConcatAcqPackage)
      this.setMinSeqTRfuture(minSeqTR)
      this.setMinConcatAcqPackagefuture(minConcatAcqPackage)
    },
    onBandwidthChangedByUser(value) {
      console.log('bandwidth changed with input: ', value)
      this.receiverBandWidth = value
      this.isBandwidthUserUpdated = true
    },
    onInputScanDelay(value) {
      this.scanDelayTime = value
      // If value < min scan delay + scanDuration of the prev acq question
      // Set value is min
      setTimeout(() => {
        if (value > 0 && value < this.minScanDelayOfCurrentStackQuestion) {
          this.scanDelayTime = this.minScanDelayOfCurrentStackQuestion
        }
      }, 100)
    },
    updateTREfficiency() {
      if (!this.selectionConfig) {
        return
      }

      console.log('repetitionTime Changed', this.repetitionTime)
      let trEfficiency = _.round((this.repetitionTime / this.minConcatAcqPackage) * 100, 2)
      if (this.selectionIdent === '0_proposed') {
        this.$store.dispatch('selectionConfig/adjustTREfficiency', { ident: this.selectionIdent, trEfficiency })
      }
    },
    onCopySelectionConfig() {
      if (
        this.selectedCopyQuestionId &&
        this.sameKindAnsweredQuestionWithStackQuestion.filter((el) => el.id == this.selectedCopyQuestionId)
      ) {
        this.copySelectionConfigFromAnswer({ questionId: this.selectedCopyQuestionId })
      }
    },
    showModalCopyConfig() {
      this.$root.$emit('bv::show::modal', 'modal-copy-selection-config')
    },
    enableCTHotkeys(enabled) {
      this.setHotKeysEnabledCT(enabled)
    },
    onSliceViewWindowChange({ windowLevel, windowWidth }) {
      this.displayWindowWidth = windowWidth
      this.displayWindowLevel = windowLevel
    },

    kLookup(bodyPart = 'default', fieldStrength = '1.5') {
      // This method acts as a lookup table for the k value to finetune noise based on body part and field strength
      let kLookup = {
        default: {
          1.5: 1,
          3: 1,
        },
      }
      return kLookup[bodyPart][fieldStrength]
    },
    convertBandWidthBaseTo(unit, value, baseMatrix = null, strength = null) {
      // Bandwidth base units are px/hz
      // Use this to convert from base unit
      if (unit === 'khz') {
        return (value * baseMatrix) / 2000
      } else if (unit === 'px') {
        return value < 1 ? 1 : strength / value
      }
    },
    convertBandWidthBaseFrom(unit, value, baseMatrix = null, strength = null) {
      // Bandwidth base units are px/hz
      // use this to convert back to base unit
      if (unit === 'khz') {
        return (value * 2000) / baseMatrix
      } else if (unit === 'px') {
        return value < 1 ? 1 : strength / value
      }
    },
    convertToVendorBandwidth(vender, value, baseMatrix = null, fieldStrength = null) {
      // Bandwidth base units are px/hz, so some vendors may not need converstion
      let output = value
      if (vender === 'ge') {
        output = this.convertBandWidthBaseTo('khz', value, baseMatrix)
      } else if (vender === 'philips') {
        let strength = fieldStrength === '1.5' ? 220 : 440
        output = this.convertBandWidthBaseTo('px', value, null, strength)
      }

      return output
    },
    convertFromVendorBandwidth(vender, value, baseMatrix = null, fieldStrength = null) {
      // Bandwidth base units are px/hz, so some vendors may not need converstion
      let output = value
      if (vender === 'ge') {
        output = this.convertBandWidthBaseFrom('khz', value, baseMatrix)
      } else if (vender === 'philips') {
        let strength = fieldStrength === '1.5' ? 220 : 440
        output = this.convertBandWidthBaseFrom('px', value, null, strength)
      }
      return output
    },
    adjustFrequencyMatrix() {
      let difference = this.frequencyMatrix % 32
      if (difference >= 32 / 2) this.frequencyMatrix += 32 - difference
      else this.frequencyMatrix -= difference
    },
    adjustPhaseMatrix() {
      const phaseMatrix = _.get(this.selectionConfig, 'phaseMatrix')
      if (!phaseMatrix) return

      let difference = phaseMatrix % 32
      let adjusted
      if (difference >= 32 / 2) {
        adjusted = phaseMatrix + (32 - difference)
      } else {
        adjusted = phaseMatrix - difference
      }

      // Cap at frequencyMatrix (phase matrix cannot exceed frequency matrix)
      adjusted = Math.min(adjusted, this.frequencyMatrix)

      // Ensure minimum of 32
      adjusted = Math.max(adjusted, 32)

      this.selectionConfig.phaseMatrix = adjusted
    },
    setInitialUltraLabDefaults() {
      if (this.selectionConfig) {
        this.selectionConfig.fieldStrength = this.fieldStrengthPreference
      }
      this.inversionTime = 0
      this.oversamplingPercentage = 10
      this.submitOversampling()
      this.dimensions3y = this.vendorStylePreference === 'ge' ? 22 : 220
      this.submitDimensions3y()
      let vendor = this.vendorStylePreference
      this.dimensions3x = ['siemens', 'philips', 'united'].includes(vendor) ? 100 : this.dimensions3y
      this.submitDimensions3x()
      this.thickness = 5
      this.submitThickness()
      this.setSequenceDefaults('TE')
      if (this.selectionConfig) {
        this.selectionConfig.receiverBandWidth = this.selectionConfig?.fieldStrength === '1.5' ? 150 : 220
      }
    },
    setSequenceDefaults(sequenceType) {
      console.log('setting sequence defaults')

      // if editing question, don't set defaults
      if (this.isEditingQuestion || this.isTakingTest) {
        if (this.selectionConfig.sequenceType === 'DIFF') {
          this.concatenations = 1
        }
        return
      }

      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustSequenceType', {
        sequenceType: sequenceType,
      })

      if (this.selectionConfig?.sequenceType !== 'GRE') {
        if (this.vendorStylePreference === 'siemens') {
          this.partialFourier = 'Off'
        }
      }

      if (this.selectionConfig.sequenceType === 'DIFF') {
        console.log('setting diff defaults')
        this.selectionConfig.receiverBandWidth = 2000
        this.frequencyMatrix = 192
        this.parallelFactor = 2
        this.repetitionTime = 5000
        this.concatenations = 1
        this.rfPulsing = 'mid'
        this.gradientRamp = 'Normal'
      } else if (this.selectionConfig?.sequenceType === 'SSFP') {
        this.flipAngle = 70
        this.repetitionTime = 3
        this.echoTime = 1.5
        if (this.selectionConfig?.fieldStrength === '1.5') {
          this.bandwidth = 190
        } else if (this.selectionConfig?.fieldStrength === '3.0') {
          this.bandwidth = 240
        }
        // Bandwidth can be 240 at 3T and 190 at 1.5
      } else if (this.selectionConfig?.sequenceType === 'TE') {
        console.log('setting te defaults')
        this.echoTime = 50
        //this.echoSpacing = 10
        this.frequencyMatrix = 256
        this.echoTrainLength = 10
        this.concatenations = 2
        this.parallelFactor = 'Off'
        this.repetitionTime = 1000
        this.spacing = this.isUltraLab && this.vendorStylePreference === 'siemens' ? 33 : (33 / 100) * this.thickness
        this.submitSpacing()
        if (this.selectionConfig?.fieldStrength === '1.5') {
          this.flipAngle = 180
        } else if (this.selectionConfig?.fieldStrength === '3.0') {
          this.flipAngle = 180
        }
        this.selectionConfig.receiverBandWidth = this.selectionConfig?.fieldStrength === '1.5' ? 150 : 220
      } else if (this.selectionConfig?.sequenceType === 'SE') {
        console.log('setting se defaults')
        this.echoTime = 3
        this.frequencyMatrix = 256
        this.concatenations = 2
        this.parallelFactor = 'Off'
        this.repetitionTime = 600
        this.spacing = this.isUltraLab && this.vendorStylePreference === 'siemens' ? 33 : (33 / 100) * this.thickness
        this.submitSpacing()
        if (this.selectionConfig?.fieldStrength === '1.5') {
          this.flipAngle = 180
        } else if (this.selectionConfig?.fieldStrength === '3.0') {
          this.flipAngle = 180
        }
        this.selectionConfig.receiverBandWidth = this.selectionConfig?.fieldStrength === '1.5' ? 150 : 220
      } else {
        console.log('setting se defaults')
        this.echoTime = 1
        this.concatenations = 1
        this.frequencyMatrix = 256
        this.parallelFactor = 'Off'
        this.repetitionTime = 41
        this.spacing = this.isUltraLab && this.vendorStylePreference === 'siemens' ? 33 : (33 / 100) * this.thickness
        this.submitSpacing()
        this.flipAngle = 45
        this.selectionConfig.receiverBandWidth = this.selectionConfig?.fieldStrength === '1.5' ? 150 : 220
      }
    },
    setSelectionConfigVisible(visible, ident) {
      this.$store.dispatch('selectionConfig/setSelectionConfig', {
        ident, // pass in to specify which one to alter, otherwise current
        selectionConfig: { visible },
      })
    },
    pressEnterKey(evt, type) {
      let value = evt.target.value
      // Clamp phaseMatrix to maxPhaseMatrix (100% for Siemens, frequencyMatrix for others)
      if (type === 'phaseMatrix' && this.maxPhaseMatrix) {
        value = Math.min(Number(value), this.maxPhaseMatrix)
      }
      this[type] = value
      // Force input to show corrected value if setter modified it
      this.$nextTick(() => {
        const correctedValue = this[type]
        if (correctedValue !== Number(evt.target.value)) {
          evt.target.value = correctedValue
        }
      })
    },
    changeSpin(value, type) {
      // Clamp phaseMatrix to maxPhaseMatrix (100% for Siemens, frequencyMatrix for others)
      if (type === 'phaseMatrix' && this.maxPhaseMatrix) {
        value = Math.min(Number(value), this.maxPhaseMatrix)
      }
      this[type] = value
    },
    changeBValueSpin(value, index) {
      const newBValues = [...this.bValues]
      const isLastBValue = index === newBValues.length - 1

      if (index === 0) {
        // When there's only one b-value (numBValues = 1), it must be >= 50 for the cubic equation solver
        // When there are multiple b-values, first value is always 0
        const minValue = isLastBValue ? 50 : 0
        newBValues[index] = Math.max(Math.floor(value), minValue)
      } else {
        // Ensure the new value is greater than the previous one
        const minValue = newBValues[index - 1] + 1
        let newValue = Math.max(Math.floor(value), minValue)

        // If this is the last b-value (maximum), enforce minimum of 50
        if (isLastBValue && newValue < 50) {
          newValue = 50
        }

        newBValues[index] = newValue
      }

      // Adjust subsequent values if necessary
      for (let i = index + 1; i < newBValues.length; i++) {
        newBValues[i] = Math.max(newBValues[i], newBValues[i - 1] + 1)
      }

      this.bValues = newBValues
    },
    changeBAveragesSpin(value, index) {
      console.log('change BAveragesSpin', value, index)
      const newBAverages = [...this.bAverages]
      newBAverages[index] = Math.max(1, Math.floor(value))
      this.bAverages = newBAverages
    },
    changeEchoTime(value) {
      if (this.selectionConfig.sequenceType === 'TE') {
        const result = this.roundEchoTimeToSpacing(value)
        if (result.needsRounding) {
          value = result.roundedValue
        }
      }
      this.echoTime = value
    },
    changeFrequencyVoxelSize(value) {
      let matrix = _.get(this.selectionConfig, 'dimensions3.y') / value

      if (this.vendorStylePreference === 'philips') {
        // Enforce bounds: min 64, max 512 (matching UI constraints)
        matrix = Math.max(matrix, 64)
        matrix = Math.min(matrix, 512)
        // Store fractional value directly (no rounding)
        this.selectionConfig.frequencyMatrix = matrix

        // Cap phaseMatrix if it exceeds displayed frequencyMatrix (floored to 32)
        const displayedFreqMatrix = Math.floor(matrix / 32) * 32
        if (this.selectionConfig.phaseMatrix > displayedFreqMatrix) {
          this.selectionConfig.phaseMatrix = displayedFreqMatrix
        }
      } else {
        this.frequencyMatrix = _.round(matrix)
      }
    },
    changePhaseVoxelSize(value) {
      const dimensions3x_mm = _.get(this.selectionConfig, 'dimensions3.x')
      let matrix = dimensions3x_mm / value

      if (this.vendorStylePreference === 'philips') {
        // Enforce bounds: min 32, max frequencyMatrix
        matrix = Math.max(matrix, 32)
        matrix = Math.min(matrix, this.frequencyMatrix)
        // Store fractional value directly (no rounding)
        this.selectionConfig.phaseMatrix = matrix
      } else {
        this.phaseMatrix = _.round(matrix)
      }
    },
    setAverages(value) {
      this.averages = value
    },
    changeVendorStylePreference() {
      //this.saveVendorStylePreference({
      //  vendorStylePreference: this.vendorStylePreferenceLocal,
      //})
      this.$store.dispatch('selectionConfig/adjustVendorStylePreference', {
        vendorStylePreference: this.vendorStylePreferenceLocal,
      })
      // if (
      //   (this.$store.getters["user/vendorStylePreference"].trim() !== "ge" &&
      //     this.vendorStylePreferenceLocal.trim() === "ge") ||
      //   (this.$store.getters["user/vendorStylePreference"].trim() === "ge" &&
      //     this.vendorStylePreferenceLocal.trim() !== "ge")
      // ) {
      //   this.smartRotateSelectionConfigDir();
      // }
    },
    submitNumberOfSlices() {
      let numberOfSlices = this.numberOfSlicesLocal
      log.debug('submitNumberOfSlices', numberOfSlices)

      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustNumberOfSlices', { numberOfSlices })
    },
    submitTubeCurrent(newValue) {
      this.tubeCurrent = newValue
    },
    submitThickness() {
      let thickness = this.thicknessLocal
      let prevSpacing = this.spacing // store this value to apply later
      log.debug('submitThickness', thickness)
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustThickness', { thickness })
      if (this.vendorStylePreference === 'siemens') {
        // make sure spacing percentage is the same as before
        this.spacing = prevSpacing
        this.submitSpacing()
      }
    },
    submitSpacing() {
      log.debug('submitSpacing', this.spacingLocal)
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustSpacing', { spacing: this.spacingLocal })
    },
    submitDimensions3x() {
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustDimensions3XYByUser', { x: this.dimensions3xLocal })
    },
    submitDimensions3y() {
      let prevDim3x = this.dimensions3x // store this value to apply later
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustDimensions3XYByUser', { y: this.dimensions3yLocal })
      // In CT, when the question is not reconstruction, we need to ensure that the dimensions3x equal the dimensions3y
      if (
        ['siemens', 'philips', 'united'].includes(this.vendorStylePreference) &&
        !(this.isForCT && this.questionSet && !this.isReconstructionQuestion)
      ) {
        // make sure spacing percentage is the same as before
        this.dimensions3x = prevDim3x
        this.submitDimensions3x()
      }
    },
    submitDimensions3z() {
      // Need checking!!!!
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustDimensions3XYByUser', { z: this.dimensions3zLocal })
    },
    submitOversampling() {
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustOversamplingByUser', { oversampling: this.oversamplingLocal })
    },
    submitActualSequenceType(sequenceType) {
      if (sequenceType !== 'SE') {
        this.inversionRecovery = false
      }

      this.selectionConfig.sequenceType = sequenceType
    },
    onLookedAtAnswerSelections() {
      // shallow copy so Vue notices the change for the computed
      this.hasLookedAtAnswersSelectionsByQuestionId = {
        ...this.hasLookedAtAnswersSelectionsByQuestionId,
        [this.stackQuestion.id]: true,
      }
    },
    /*
    debouncedShowConfirmDialog: debounce(function () {
      if (this.changeQueue.length > 0 && !this.showConfirmDialog) {
        // Process the most recent change
        this.currentChange = this.changeQueue.shift()
        this.applyChange(this.currentChange)
        this.showConfirmDialog = true
      }
    }, 250),
    */
    /*
    queueChange(changeData) {
      console.log('queueChange', changeData)
      this.changeQueue.push(changeData)
      console.log('length', this.changeQueue.length)

      this.debouncedShowConfirmDialog()
    },
    */
    shouldProcessParameterChange(paramName) {
      if (this.isUndoingChange) {
        return false
      }

      // Check if this parameter is being affected by a current change
      if (this.currentChangeGroup) {
        const isBeingChanged = this.currentChangeGroup.some((change) => change.affectedParams?.includes(paramName))
        if (isBeingChanged) return false
      }

      return true
    },
    applyChange(changeData) {
      // Set dialog variables based on the change
      this.changeFromLabel = changeData.changeFromLabel
      this.changeFromOldValue = changeData.changeFromOldValue
      this.changeFromNewValue = changeData.changeFromNewValue
      this.changeToLabel = changeData.changeToLabel
      this.changeToOldValue = changeData.changeToOldValue
      this.changeToNewValue = changeData.changeToNewValue
    },
    confirmReceiverBandwidthChangeEchoTime(newVal, oldVal, echoTimeNew, echoTimeOld) {
      if (this.isInitialLoadingPhase) {
        console.log('In initial loading phase, skipping popup')
        return
      }

      console.log('confirmReceiverBandwidthChangeEchoTime', newVal, oldVal, echoTimeNew, echoTimeOld)

      const hasEchoTimeChange = echoTimeNew !== echoTimeOld

      if (!hasEchoTimeChange) {
        console.log('No meaningful changes, skipping queue')
        return
      }

      if (hasEchoTimeChange) {
        this.queueChange({
          changeFromLabel: this.$t('SelectionConfigForm.receiver_bandwidth'),
          changeFromOldValue: oldVal,
          changeFromNewValue: newVal,
          changeToLabel: this.$t('SelectionConfigForm.echo_time'),
          changeToOldValue: echoTimeOld,
          changeToNewValue: echoTimeNew,
        })

        this.latestChangeData = {
          changeFromLabel: this.$t('SelectionConfigForm.receiver_bandwidth'),
          changeFromOldValue: oldVal,
          changeFromNewValue: newVal,
          changeToLabel: this.$t('SelectionConfigForm.echo_time'),
          changeToOldValue: echoTimeOld,
          changeToNewValue: echoTimeNew,
        }
      }
    },
    confirmGradientRampChangeEchoTime(newVal, oldVal, echoTimeNew, echoTimeOld) {
      if (this.isInitialLoadingPhase) {
        console.log('In initial loading phase, skipping popup')
        return
      }

      console.log('confirmGradientRampChangeEchoTime', newVal, oldVal, echoTimeNew, echoTimeOld)

      const hasEchoTimeChange = echoTimeNew !== echoTimeOld

      if (!hasEchoTimeChange) {
        console.log('No meaningful changes, skipping queue')
        return
      }

      if (hasEchoTimeChange) {
        this.queueChange({
          changeFromLabel: this.$t('SelectionConfigForm.gradient_ramp'),
          changeFromOldValue: this.getGradientRampDisplayText(oldVal),
          changeFromNewValue: this.getGradientRampDisplayText(newVal),
          changeToLabel: this.$t('SelectionConfigForm.echo_time'),
          changeToOldValue: echoTimeOld,
          changeToNewValue: echoTimeNew,
        })

        this.latestChangeData = {
          changeFromLabel: this.$t('SelectionConfigForm.gradient_ramp'),
          changeFromOldValue: this.getGradientRampDisplayText(oldVal),
          changeFromNewValue: this.getGradientRampDisplayText(newVal),
          changeToLabel: this.$t('SelectionConfigForm.repetition_time'),
          changeToOldValue: this.repetitionTime,
        }
      }
    },
    confirmRFPulseChangeEchoTime(newVal, oldVal, echoTimeNew, echoTimeOld) {
      if (this.isInitialLoadingPhase) {
        console.log('In initial loading phase, skipping popup')
        return
      }

      console.log('confirmRFPulseChangeEchoTime', newVal, oldVal, echoTimeNew, echoTimeOld)

      // Check if there are any meaningful changes
      const hasEchoTimeChange = echoTimeNew !== echoTimeOld

      if (!hasEchoTimeChange) {
        console.log('No meaningful changes, skipping queue')
        return
      }

      if (hasEchoTimeChange) {
        // Convert internal values to display text
        const oldDisplayValue = this.getRFPulsingDisplayText(oldVal)
        const newDisplayValue = this.getRFPulsingDisplayText(newVal)

        this.queueChange({
          changeFromLabel: this.$t('SelectionConfigForm.rf_pulsing'),
          changeFromOldValue: oldDisplayValue,
          changeFromNewValue: newDisplayValue,
          changeToLabel: this.$t('SelectionConfigForm.echo_time'),
          changeToOldValue: echoTimeOld,
          changeToNewValue: echoTimeNew,
          affectedParams: ['repetitionTime'],
        })

        this.latestChangeData = {
          changeFromLabel: this.$t('SelectionConfigForm.rf_pulsing'),
          changeFromOldValue: oldDisplayValue,
          changeFromNewValue: newDisplayValue,
          changeToLabel: this.$t('SelectionConfigForm.repetition_time'),
          changeToOldValue: this.repetitionTime,
          affectedParams: ['echoTime'],
        }
      }
    },
    changeConcatenations(concatenations) {
      console.log('changeConcatenations', concatenations)
      // these need to be set and available for the minConcatAcqPackage watcher
      this.latestChangeData = {
        changeFromLabel: this.$t('SelectionConfigForm.concatenations'),
        changeFromOldValue: this.concatenations,
        changeFromNewValue: concatenations,
        changeToLabel: this.$t('SelectionConfigForm.repetition_time'),
        changeToOldValue: this.repetitionTime,
      }

      this.concatenations = concatenations
    },
    changeRepetitionTime(repetitionTime) {
      console.log('changeRepetitionTime', repetitionTime)
      // if repitition time is below min tr and need to be increased
      console.log('before minConcatAcqPackage', this.minConcatAcqPackage, repetitionTime)
      let newRepetitionTime = repetitionTime

      if (repetitionTime < this.minConcatAcqPackage) {
        console.log('is less than', this.minConcatAcqPackage)
        if (this.selectionConfig.sequenceType === 'DIFF') {
          console.log('sequenceType', this.selectionConfig.sequenceType)
          newRepetitionTime = this.minConcatAcqPackage
        } else {
          // find how many concatinations are needed for this repetition time
          // minSeqTr / repetitionTime = concatenations
          let oldConcats = this.concatenations
          this.concatenations = _.ceil(this.minSeqTr / repetitionTime)
          console.log('this.isInitialLoadingPhase', this.isInitialLoadingPhase)
          if (!this.isInitialLoadingPhase) {
            console.log(
              'queue change',
              this.$t('SelectionConfigForm.repetition_time'),
              this.repetitionTime,
              this.$t('SelectionConfigForm.concatenations'),
              this.concatenations
            )
            this.queueChange({
              changeFromLabel: this.$t('SelectionConfigForm.repetition_time'),
              changeFromOldValue: this.repetitionTime,
              changeFromNewValue: repetitionTime,
              changeToLabel: this.$t('SelectionConfigForm.concatenations'),
              changeToOldValue: oldConcats,
              changeToNewValue: this.concatenations,
            })
          }
        }
      }
      /*
      let newConcat
      if (this.selectionConfig?.sequenceType === 'TE') {
        newConcat = _.round(
          ((this.echoSpacing + 5) * (this.echoTrainLength ? this.echoTrainLength : 1) * this.numberOfSlices) /
            repetitionTime
        )
        if (this.changeToOldValue !== this.changeToNewValue) {
          this.showConfirmDialog = true
        }
        if (newConcat <= 1) {
          newConcat = 2
        }
      } else if (this.selectionConfig?.sequenceType === 'SE') {
        newConcat = _.round(((this.echoSpacing + 5) * this.numberOfSlices) / repetitionTime)
        if (this.changeToOldValue !== this.changeToNewValue) {
          this.showConfirmDialog = true
        }
        if (newConcat <= 1) {
          newConcat = 2
        }
      }
      if (this.concatenations !== newConcat) {
        this.changeToNewValue = newConcat
        this.concatenations = newConcat
        this.showConfirmDialog = true
      } else {
        this.showConfirmDialog = false
      }
      this.repetitionTime = repetitionTime
      */
      this.repetitionTime = newRepetitionTime
    },
    /*
    confirmChange() {
      this.showConfirmDialog = false
      this.currentChange = null
      this.$nextTick(() => {
        this.debouncedShowConfirmDialog() // Check for more changes
      })
    },
    */
    /*
    cancelChange() {
      if (this.changeFromLabel === this.$t('SelectionConfigForm.concatenations')) {
        this.concatenations = this.changeFromOldValue
        this.repetitionTime = this.changeToOldValue
      } else if (this.changeFromLabel === this.$t('SelectionConfigForm.repetition_time')) {
        this.repetitionTime = this.changeFromOldValue
        this.concatenations = this.changeToOldValue
      } else if (this.changeFromLabel === this.$t('global.number_of_slices')) {
        this.repetitionTime = this.changeToOldValue
        this.numberOfSlices = this.changeFromOldValue
        this.submitNumberOfSlices()
      } else if (this.changeFromLabel === this.$t('SelectionConfigForm.inversion_recovery')) {
        this.repetitionTime = this.changeToOldValue
        this.inversionTime = this.changeFromOldValue
      } else if (this.changeFromLabel === this.$t('SelectionConfigForm.fat_saturation')) {
        this.repetitionTime = this.changeToOldValue
        this.fatSuppression = this.changeFromOldValue
      } else if (this.changeFromLabel === this.$t('SelectionConfigForm.sequence_type')) {
        this.repetitionTime = this.changeToOldValue
        this.selectionConfig.sequenceType = this.changeFromOldValue
        this.changeSequenceType()
      } else if (
        this.changeFromLabel == this.$t('SelectionConfigForm.gradient_ramp') &&
        this.changeToLabel == this.$t('SelectionConfigForm.repetition_time')
      ) {
        this.repetitionTime = this.changeToOldValue
        this.gradientRamp = this.changeFromOldValue
      } else if (
        this.changeFromLabel == this.$t('SelectionConfigForm.gradient_ramp') &&
        this.changeToLabel == this.$t('SelectionConfigForm.echo_time')
      ) {
        this.echoTime = this.changeToOldValue
        this.gradientRamp = this.changeFromOldValue
      } else if (
        this.changeFromLabel == this.$t('SelectionConfigForm.rf_pulsing') &&
        this.changeToLabel == this.$t('SelectionConfigForm.repetition_time')
      ) {
        this.repetitionTime = this.changeToOldValue
        this.rfPulsing = this.changeFromOldValue
      } else if (
        this.changeFromLabel == this.$t('SelectionConfigForm.rf_pulsing') &&
        this.changeToLabel == this.$t('SelectionConfigForm.echo_time')
      ) {
        this.echoTime = this.changeToOldValue
        this.rfPulsing = this.changeFromOldValue
      } else if (
        this.changeFromLabel == this.$t('SelectionConfigForm.echo_spacing') &&
        this.changeToLabel == this.$t('SelectionConfigForm.echo_time')
      ) {
        this.echoTime = this.changeToOldValue
        this.echoSpacing = this.changeFromOldValue
      } else if (
        this.changeFromLabel == this.$t('SelectionConfigForm.echo_spacing') &&
        this.changeToLabel == this.$t('SelectionConfigForm.repetition_time')
      ) {
        this.repetitionTime = this.changeToOldValue
        this.echoSpacing = this.changeFromOldValue
      } else if (
        this.changeFromLabel == this.$t('SelectionConfigForm.receiver_bandwidth') &&
        this.changeToLabel == this.$t('SelectionConfigForm.repetition_time')
      ) {
        this.repetitionTime = this.changeToOldValue
        this.receiverBandWidth = this.changeFromOldValue
      }

      this.isChangeValueCanceled = true
      this.showConfirmDialog = false
      this.currentChange = null
      this.$nextTick(() => {
        this.debouncedShowConfirmDialog() // Check for more changes
      })
    },
    */
    toggleInversionRecovery() {
      this.inversionTime = this.inversionRecovery ? 100 : 0
    },
    changeSequenceType() {
      console.log('show changeSequenceType')
      /*
      if (this.selectionConfig?.sequenceType === 'DIFF') {
        console.log('setting diff defaults')
        this.receiverBandWidth = 2000
        this.frequencyMatrix = 192
        this.parallelFactor = 2
        this.repetitionTime = 5000
        this.concatenations = 1
      } else if (this.selectionConfig?.sequenceType !== 'GRE') {
        if (this.vendorStylePreference === 'siemens') {
          this.partialFourier = 'Off'
        }
      }

      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustSequenceType', {
        sequenceType: this.selectionConfig.sequenceType,
      })
      console.log('setSequenceDefaults', this.selectionConfig.sequenceType)
      */
      this.setSequenceDefaults(this.selectionConfig.sequenceType)
    },
    // Event handlers for automatic SNR calculation after scan completion
    handleCalculateSnrAfterScan() {
      this.calculateAndSetSNR?.()
    },

    handleCalculateBsnrsAfterScan() {
      this.calculateAndSetBSNRs?.()
    },
  },

  // Lifecycle methods for event listeners
  mounted() {
    // Use EventBus for communication between modules since events are emitted from dicomService
    EventBus.$on('calculate-snr-after-scan', this.handleCalculateSnrAfterScan)
    EventBus.$on('calculate-bsnrs-after-scan', this.handleCalculateBsnrsAfterScan)
  },

  beforeDestroy() {
    // Remove event listeners to prevent memory leaks
    EventBus.$off('calculate-snr-after-scan', this.handleCalculateSnrAfterScan)
    EventBus.$off('calculate-bsnrs-after-scan', this.handleCalculateBsnrsAfterScan)
  },
}
