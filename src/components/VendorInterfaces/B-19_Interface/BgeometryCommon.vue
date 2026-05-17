<!-- eslint-disable vue-i18n/no-raw-text -->
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
      <div class="main-1 my-2">
        <div class="main-2">
          <div class="text-3 mt-4">
            <label class="label-size inactive-label">Slice Group</label>
            <SliceGroupInput v-model="sliceGroup" label="Slice group" :step="1" :min="1" :max="1000" class="ml-2" />
          </div>
          <div class="text-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.numberOfSlices, 'inactive-label': !activeInputs.numberOfSlices }"
            >
              Slices
            </label>
            <BspinButton
              class="input-lock"
              @input="submitNumberOfSlices"
              :type="'number'"
              v-model.number="numberOfSlices"
              :step="1"
              :min="1"
              :max="300"
              :disabled="complete || isAddLocalizerMode"
            />
          </div>
          <div class="text-3" v-if="!isSingleSliceMode || isAddLocalizerMode || spacing < 0">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.spacing, 'inactive-label': !activeInputs.spacing }"
            >
              <!-- {{ labels.gap[vendorStylePreference.trim()] }} -->
              Slice Gap
            </label>
            <BspinButton
              class="input-lock"
              :step="vendorStylePreference === 'siemens' && !isAddLocalizerMode ? 1 : 0.1"
              :min="0"
              :max="vendorStylePreference === 'siemens' && !isAddLocalizerMode ? 100 : 50"
              v-model.number="spacing"
              @input="submitSpacing"
              :disabled="complete"
              :id="'tooltip-spacing' + selectionIdent"
            />
            <b-tooltip :target="'tooltip-spacing' + selectionIdent" triggers="hover">
              {{ spacingTooltip + ' mm' }}
            </b-tooltip>
            <span class="mx-2">%</span>
          </div>

          <div class="text-3">
            <label class="label-size inactive-label">Position</label>
            <v-select
              :items="positionOptions"
              v-model="selectedPosition"
              color="#423c3c"
              dense
              outlined
              class="position ml-2"
            ></v-select>
            <v-btn class="btn-2 mt-1">...</v-btn>
          </div>
          <div class="text-3">
            <label class="label-size active-label">Orientation</label>
            <v-select
              :items="[
                { text: $t('global.axial', languageCode), value: 'axial' },
                { text: $t('global.coronal', languageCode), value: 'coronal' },
                { text: $t('global.sagittal', languageCode), value: 'saggital' },
              ]"
              v-model="selectedValue"
              :disabled="isAddLocalizerMode"
              dense
              outlined
              class="position ml-2"
              @change="(value) => resetSelection({ index: getOrientationIndex(value), dirOnly: true })"
            />

            <v-btn class="btn-2 mt-1">...</v-btn>
          </div>
          <div class="text-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.phaseEncoding, 'inactive-label': !activeInputs.phaseEncoding }"
            >
              Phase Encoding Dir.
            </label>
            <v-btn class="btn-3 ml-2" @click="smartRotateSelectionConfigDir">Swap</v-btn>
            <v-btn class="btn-2 ml-2">...</v-btn>
          </div>
          <div class="text-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.oversampling, 'inactive-label': !activeInputs.oversampling }"
            >
              Phase Oversampling
            </label>
            <BspinButton
              class="input-lock adj-input"
              @input="submitOversampling"
              :type="'number'"
              v-model.number="oversamplingPercentage"
              :step="1"
              :min="0"
              :max="100"
              :disabled="complete || isAddLocalizerMode"
            />
            <span class="mx-2">%</span>
          </div>
        </div>
        <div class="main-2">
          <div class="text-3 mt-4">
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
              :value="dimensions3y"
              :step="1"
              :min="1"
              :max="500"
              :disabled="complete || isAddLocalizerMode"
            />
            <span class="mx-2">mm</span>
          </div>
          <div class="text-3">
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
              :value="dimensions3x"
              :step="1"
              :min="1"
              :max="500"
              :disabled="complete || isAddLocalizerMode"
            />
            <span class="mx-2">%</span>
          </div>
          <div class="text-3">
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
          <div class="text-3">
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
            <span class="mx-2">ms</span>
          </div>
          <div class="text-3" v-if="selectionConfig.sequenceType !== 'DIFF'">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.averages, 'inactive-label': !activeInputs.averages }"
            >
              Averages
            </label>
            <BspinButton
              @input="setAverages"
              :type="'number'"
              :value="averages"
              :step="1"
              :min="1"
              :max="10"
              class="input-lock"
              :disabled="complete || isAddLocalizerMode"
            />
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Multi-Slice Mode</label>
            <div class="text-2">
              <v-select
                color="#423c3c"
                dense
                outlined
                style="width: 16.4vw; max-width: 47%; margin-left: 2%"
                v-model="selectedMultislice"
                :items="multiSliceModeOptions"
                class="position ml-2"
              ></v-select>
            </div>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Series</label>
            <div class="text-2">
              <v-select
                color="#423c3c"
                dense
                outlined
                style="width: 16.4vw; max-width: 47%; margin-left: 2%"
                v-model="selectedSeries"
                :items="series"
                class="position ml-2"
              ></v-select>
            </div>
          </div>

          <div class="text-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.concatenations, 'inactive-label': !activeInputs.concatenations }"
            >
              Concatenations
            </label>
            <BspinButton
              @input="changeConcatenations"
              :type="'number'"
              :value="concatenations"
              :step="1"
              :min="1"
              :max="10"
              class="input-lock"
              :disabled="complete || isAddLocalizerMode || selectionConfig.sequenceType === 'DIFF'"
            />
          </div>
        </div>
      </div>
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
      <!-- <div class="main-1">
            <div class="bottom-card"></div>
          </div> -->
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import BspinButton from '../B-19_Interface/BspinButton.vue'
import EventBus from '@/lib/event-bus'
import SliceGroupInput from '../B-19_Interface/SliceGroupInput.vue'
import _ from 'lodash'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  name: 'BgeometryCommon',
  mixins: [SelectionConfigMixin],
  data() {
    return {
      selectedValue: 'axial',
      sliceGroup: 1,
      selectedPosition: 'L65.5 P125.8 H0.0',
      positionOptions: ['Isocenter', 'L65.5 P125.8 H0.0'],
      multiSliceModeOptions: ['Interleaved', 'Sequential'],
      selectedMultislice: 'Interleaved',
      series: ['Ascending', 'Descending', 'Interleaved'],
      selectedSeries: 'Ascending',
    }
  },
  components: { BspinButton, SliceGroupInput },
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
    /*
    isFreebie: {
      type: Boolean,
      required: false,
      default: false,
    },
    isManager: {
      type: Boolean,
      required: false,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      required: false,
      default: false,
    },
    isSandbox: {
      type: Boolean,
      required: false,
      default: false,
    },
    trafficLightsPreviewPanel: {
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
    useInitialUltraLabDefaults: {
      type: Boolean,
      required: false,
      default: true,
    },
    sequenceType: {
      type: String,
      required: true,
    },
    shouldPausePopup: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    //...mapActions('dataToParent', ['updateScanTime']),
    getOrientationIndex(value) {
      const orientationMap = { axial: 0, coronal: 1, saggital: 2 }
      return orientationMap[value] || 0
    },
    /*
    changeConcatenations(value) {
      this.concatenations = value
    },
    changeAverages(value) {
      this.averages = value
    },
    changeSliceGroup(value) {
      this.sliceGroup = value
    },
    increment() {
      this.sliceGroup++
    },
    decrement() {
      if (this.sliceGroup > 0) {
        this.sliceGroup--
      }
    },
    submitOversampling() {
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustOversamplingByUser', { oversampling: this.oversamplingLocal })
    },
    */
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
    /*
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
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
        const roundedInput = Math.round(input * 10) / 10
        this.spacingLocal = roundedInput
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

  mounted() {
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
  watch: {
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        // console.log('scan time in Routine Tab=====', newVal)
        this.updateScanTime(newVal)
      }
    },
    numberOfSlices(newVal, oldVal) {
      this.updateSeqValues()
      if (newVal !== oldVal) {
        this.handleSlices(newVal)
        // this.emitData()
      }
    },
    oversamplingPercentage(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateOversampling(newVal)
        // this.setOversampling(newVal)
      }
    },
    repetitionTime(newVal, oldVal) {
      this.updateSeqValues()
      if (newVal !== oldVal) {
        this.updateRepetition(newVal)
        // this.emitData()
      }
    },
    echoTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateEchoTime(newVal)
        this.updateSeqValues()
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
        this.updateSeqValues()
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
    /*
    minConcatAcqPackage(newVal, oldVal) {
      this.updateSeqValues()
      if (newVal !== oldVal) {
        this.$store.dispatch('scanTimeConfig/updateMinConcatAcqPackage', newVal)
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
}
</script>

<style scoped>
::v-deep .disabledClass .v-select__slot {
  background: #b8b8b8 !important;
}
.border {
  border: 2px solid #727272 !important;
}
::v-deep .disabledClass.v-text-field.v-text-field--enclosed .v-text-field__details,
::v-deep
  .disabledClass.v-text-field.v-text-field--enclosed:not(.v-text-field--rounded)
  > .v-input__control
  > .v-input__slot {
  padding: 0 !important;
}
::v-deep .disabledClass .v-select__selection {
  color: #000000 !important;
}
::v-deep .v-btn:not(.v-btn--round).v-size--default {
  min-width: 208px;
}
.text-input {
  max-width: 100%;
  width: 28%;
  margin-left: 2%;
  border-radius: 0px !important;
  height: 1rem !important;
  border-bottom: none;
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
  border: none !important;
}

::v-deep .theme--light.v-select .v-select__selections {
  font-size: 12px !important;
}

.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.35rem;
  width: 26%;
  margin-left: 2%;
}
.input-disabled-lock {
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.05rem;
  width: 26.2%;
  margin-left: 2%;
}
.btn-4 {
  display: flex;
  justify-content: flex-end;
  background: white !important;
  color: black !important;
  padding: 0px 4px !important;
  width: 80px !important;
  height: 16px !important;
  box-shadow: none;
  border-radius: 0px;
  border: none !important;
  font-size: 10px !important;
  font-weight: inherit !important;
  text-transform: inherit !important;
}

.btn-3 {
  width: 35px !important;
  height: 20px !important;
  color: black !important;
  background: #c0c0c0 !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
  border-radius: 0px;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

::v-deep .v-text-field__details {
  display: none;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

.v-input--is-focused {
  display: block !important;
}

label,
span {
  color: black;
  font-size: 80%;
}

.text-2 {
  display: flex;
}

.text-1 {
  display: flex;
  /* justify-content: space-between; */
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}

.text-3 {
  display: flex;
  justify-content: flex-start;
}

::v-deep .v-input__icon {
  height: 16px !important;
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

.v-input__slot {
  padding: 0 10px;
}

.v-select__selection {
  line-height: 20px;
}

.v-select__selection > input {
  height: 28px;
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
  max-width: 28%;
  border-radius: 0px;
  margin-left: 10px !important;
}

::v-deep .v-text-field input {
  padding: 0px;
}

.btn-2 {
  width: 20px !important;
  height: 15px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #c0c0c0 !important;
  border-radius: 0px;
  color: black !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
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

.btn-1 {
  display: flex;
  width: 66.75%;
  justify-content: space-between;
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
  transform: translateX(1px);
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 36%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 8%;
  border: 2px solid black;
}
.sliceGroup {
  width: 14vw;
  max-width: 21%;
  margin-left: 2%;
}
.dotBtn {
  margin: -4px 0px 0px 24px;
}
.dotBtn1 {
  margin: 3px 0px 0px 0px;
}

.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

@media (min-width: 2305px) and (max-width: 2490px) {
  .disabled-div {
    margin-top: 5%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 26.5%;
  }
}
/* Large desktops */
@media (min-width: 1920px) and (max-width: 2304px) {
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 26.5%;
  }
  .sliceGroup {
    width: 14vw;
    max-width: 20.7%;
    margin-left: 2%;
  }
  .position {
    width: 15.9vw;
    max-width: 28%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 36px;
  }
}

@media (min-width: 1800px) and (max-width: 1919px) {
  .sliceGroup {
    width: 14vw;
    max-width: 20.7%;
    margin-left: 2%;
  }
  .position {
    width: 15.9vw;
    max-width: 28%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 26.8%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 36px;
  }
}
@media (min-width: 1200px) and (max-width: 1800px) {
  .sliceGroup {
    width: 14vw;
    max-width: 20.7%;
    margin-left: 2%;
  }
  .position {
    width: 15.9vw;
    max-width: 28.4%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 26.8%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 36px;
  }
}

/* Regular desktops */
@media (min-width: 1024px) and (max-width: 1199px) {
  .sliceGroup {
    width: 14vw;
    max-width: 20.7%;
    margin-left: 2%;
  }
  .position {
    width: 15.9vw;
    max-width: 50.5%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 26.8%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 24px;
  }
}

/* Tablets (landscape) */
@media (min-width: 768px) and (max-width: 1023px) {
  .sliceGroup {
    width: 14vw;
    max-width: 20.7%;
    margin-left: 2%;
  }
  .position {
    width: 15.9vw;
    max-width: 50.5%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 26.8%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 24px;
  }
}

/* Tablets (portrait) */
@media (min-width: 481px) and (max-width: 767px) {
  .sliceGroup {
    width: 14vw;
    max-width: 20.7%;
    margin-left: 2%;
  }
  .position {
    width: 15.9vw;
    max-width: 50.5%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 26.8%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 24px;
  }
}

/* Mobile devices */
@media (min-width: 320px) and (max-width: 480px) {
  .sliceGroup {
    width: 14vw;
    max-width: 20.7%;
    margin-left: 2%;
  }
  .position {
    width: 15.9vw;
    max-width: 50.5%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 26.8%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 24px;
  }
}
.v-text-field.v-text-field--enclosed .v-text-field__details,
.v-text-field.v-text-field--enclosed:not(.v-text-field--rounded) > .v-input__control > .v-input__slot {
  padding: 0 10px;
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
