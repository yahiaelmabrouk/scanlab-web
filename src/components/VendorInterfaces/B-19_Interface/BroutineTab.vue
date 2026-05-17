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
        </div>
      </v-card>
    </v-dialog>
    <v-card-text>
      <v-row class="main-1 m-0">
        <v-col class="main-2">
          <div class="text-3">
            <label class="label-size inactive-label"><i>Slice group</i></label>
            <SliceGroupInput v-model="sliceGroup" label="Slice group" :step="1" :min="1" :max="1000" class="ml-2" />
          </div>
          <div class="text-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.numberOfSlices, 'inactive-label': !activeInputs.numberOfSlices }"
            >
              <i>Slices</i>
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
              <i>Dist. factor</i>
            </label>
            <BspinButton
              class="input-lock"
              :step="!isAddLocalizerMode ? 1 : 0.1"
              :min="0"
              :max="!isAddLocalizerMode ? 100 : 50"
              v-model.number="spacing"
              @input="submitSpacing"
              :disabled="complete"
              :id="'tooltip-spacing' + selectionIdent"
              :allow-decimal="!isAddLocalizerMode ? false : true"
            />
            <b-tooltip :target="'tooltip-spacing' + selectionIdent" triggers="hover">
              {{ spacingTooltip + ' mm' }}
            </b-tooltip>
            <span class="mx-2">%</span>
          </div>

          <div class="text-3">
            <label class="label-size inactive-label"><i>Position</i></label>
            <v-select
              :items="getPositionOptions"
              v-model="getPositionSelectedValue"
              color="#423c3c"
              dense
              outlined
              class="position ml-2"
              @change="updatePositionSelectedValue"
            ></v-select>
            <v-btn class="btn-2 mt-1">...</v-btn>
          </div>
          <div class="text-3">
            <label class="label-size active-label"><i>Orientation</i></label>
            <!-- <v-menu>
              <template #activator="{ on }">
                <v-btn :disabled="isAddLocalizerMode" class="btn-4" v-on="on" dense outlined style="margin-left: 2%">
                  {{ selectedValue }}
                  <v-icon small>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  @click="
                    resetSelection({ index: 0, dirOnly: true })
                    selectedValue = 'axial'
                  "
                >
                  <v-list-item-title>{{ $t('global.axial', languageCode) }}</v-list-item-title>
                </v-list-item>
                <v-list-item
                  @click="
                    resetSelection({ index: 1, dirOnly: true })
                    selectedValue = 'coronal'
                  "
                >
                  <v-list-item-title>{{ $t('global.coronal', languageCode) }}</v-list-item-title>
                </v-list-item>
                <v-list-item
                  @click="
                    resetSelection({ index: 2, dirOnly: true })
                    selectedValue = 'saggital'
                  "
                >
                  <v-list-item-title>{{ $t('global.sagittal', languageCode) }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu> -->
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
          <div class="text-3 mb-2">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.phaseEncoding, 'inactive-label': !activeInputs.phaseEncoding }"
            >
              <i>Phase enc. dir.</i>
            </label>
            <v-btn class="btn-3 ml-2" @click="smartRotateSelectionConfigDir">Swap</v-btn>
            <v-btn class="btn-2 swapDot">...</v-btn>
          </div>
          <div class="text-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.oversampling, 'inactive-label': !activeInputs.oversampling }"
            >
              Phase oversampling
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
                  :disabled="true"
                  class="spin-btn-grp"
                />
              </div>
            </div>
            <div class="text-3 minTeCon input-group">
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
        </v-col>
        <v-col class="main-2">
          <div class="text-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.dimensions3y, 'inactive-label': !activeInputs.dimensions3y }"
            >
              FoV read
            </label>
            <BspinButton
              class="input-lock"
              @input="submitDimensions3y"
              :type="'number'"
              :value="dimensions3y"
              v-model.number="dimensions3y"
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
              FoV phase
            </label>
            <BspinButton
              class="input-lock"
              @input="submitDimensions3x"
              :type="'number'"
              :value="dimensions3x"
              v-model.number="dimensions3x"
              :step="1"
              :min="1"
              :max="500"
              :disabled="complete || isAddLocalizerMode"
              :id="'dimensions3x_tooltip' + selectionIdent"
            />
            <span class="mx-2">%</span>
          </div>
          <b-tooltip :target="'dimensions3x_tooltip' + selectionIdent" triggers="hover">
            {{ dimensions3xTooltip }}</b-tooltip
          >
          <div class="text-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.thickness, 'inactive-label': !activeInputs.thickness }"
            >
              <i>Slice thickess</i>
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

          <div class="text-3">
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
              class="input-lock"
              v-if="selectionConfig.sequenceType === 'TE'"
              :step="echoSpacing"
              :min="echoSpacing"
              :max="echoSpacing * echoTrainLength"
              :value="echoTime"
              @input="changeEchoTime"
            />
            <BspinButton
              class="input-lock"
              v-if="selectionConfig.sequenceType === 'SE'"
              :step="1"
              :min="6"
              :max="maxTEOptionsForSE"
              :value="echoTime"
              @input="changeEchoTime"
            />
            <BspinButton
              class="input-lock"
              v-if="selectionConfig.sequenceType === 'GRE'"
              :step="1"
              :min="1"
              :max="maxTEOptionsForGRE"
              :value="echoTime"
              @input="changeEchoTime"
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
              class="input-lock"
              @input="setAverages"
              :type="'number'"
              :value="averages"
              v-model.number="averages"
              :step="1"
              :min="1"
              :max="10"
              :disabled="complete || isAddLocalizerMode"
            />
          </div>

          <div class="text-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.concatenations, 'inactive-label': !activeInputs.concatenations }"
            >
              Concatenations
            </label>
            <BspinButton
              class="input-lock"
              @input="changeConcatenations"
              :type="'number'"
              :value="concatenations"
              :step="1"
              :min="1"
              :max="10"
              :disabled="complete || isAddLocalizerMode || selectionConfig.sequenceType === 'DIFF'"
            />
            <!-- :class="{ 'active-label': activeInputs.concatenations, 'inactive-label': !activeInputs.concatenations }" -->
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">Filter</label>
            <div class="text-2">
              <v-select
                :items="filter"
                v-model="selectedFilter"
                color="#c0c0c0"
                dense
                outlined
                style="width: 15.4vw; max-width: 52.9%; margin-left: 2.5%; margin-bottom: 2%"
                :disabled="true"
                class="disabledClass border border-dark"
              />
            </div>
          </div>
          <div class="text-3">
            <label class="label-size inactive-label"><i>Coil elements</i></label>
            <div
              class="coil-elements-display"
              style="width: 8.17vw; max-width: 28.3%; margin-left: 1.5%; background-color: #c0c0c0"
            >
              <p>{{ activeButtons.join(', ') }}</p>
            </div>
          </div>
          <!-- <v-row class="m-0 p-0 justify-end" v-if="!isTakingTest">
            <v-col cols="3">
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
            <v-col cols="3">
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
        </v-col>
      </v-row>
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
import _ from 'lodash'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import BspinButton from '../B-19_Interface/BspinButton.vue'
import EventBus from '@/lib/event-bus'
import SliceGroupInput from '../B-19_Interface/SliceGroupInput.vue'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  mixins: [SelectionConfigMixin, ScanButtonMixin],
  name: 'BroutineTab',
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
    */
    /*
    isManager: {
      type: Boolean,
      required: false,
      default: false,
    },
    */
    /*
    isAdmin: {
      type: Boolean,
      required: false,
      default: false,
    },
    */
    isSandbox: {
      type: Boolean,
      required: false,
      default: false,
    },
    /*
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
    /*
    sequenceType: {
      type: String,
      required: true,
    },
  */
    shouldPausePopup: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data() {
    return {
      selectedValue: 'axial',
      sliceGroup: 1,
      filter: [
        'Distortion Corr. (2D)',
        'High Pass filters',
        'Low Pass filters',
        'Edge Enhancement',
        'Noise Reduction',
        'Spatial Filtering',
      ],
      selectedFilter: 'Distortion Corr. (2D)',
      // selectedPosition: 'L65.5 P125.8 H0.0',
      // positionOptions: ['Isocenter', 'L65.5 P125.8 H0.0'],
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
    ]),
    // ...mapMutations('dataToParent', ['setOversampling']),
    //...mapActions('dataToParent', ['updateOversamplings', 'updateScanTime']),
    ...mapActions('b19AllValuesSelection', ['updatePositionSelectedValue']),
    getOrientationIndex(value) {
      const orientationMap = { axial: 0, coronal: 1, saggital: 2 }
      return orientationMap[value] || 0
    },
    /*
    saveOversampling() {
      this.updateOversampling(this.oversamplingValue)
      this.oversamplingValue = ''
    },
    updateAutoalign(value) {
      this.$store.dispatch('scanTimeConfig/updateAutoalign', value)
    },
    handleSlices(event) {
      // this.submitNumberOfSlices(event)
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
    */
    /*
    handleRepetitionTime(event) {
      this.updateRepetition(event)
      // this.changeRepetitionTime(event)
    },
    */
    /*
    handleEchoTime(event) {
      this.updateEchoTime(event)
      // this.changeEchoTime(event)
    },
    handleAverages(event) {
      this.updateAverages(event)
    },
    handleConcatenations(event) {
      this.updateConcatenations(event)
      // this.changeConcatenations(event)
    },
    updateRepetition(value) {
      // console.log('updateRepetition==', value)

      this.$store.dispatch('scanTimeConfig/updateRepetitionTime', value)
    },
    // Method to update echo time
    updateEchoTime(value) {
      // console.log('updateEchoTime==', value)

      this.$store.dispatch('scanTimeConfig/updateEchoTime', value)
    },

    // Method to update flip angle
    updateFlipAngle(value) {
      // console.log('updateFlipAngle==', value)

      this.$store.dispatch('scanTimeConfig/updateFlipAngle', value)
    },

    // Method to update slices
    updateSlices(value) {
      this.$store.dispatch('scanTimeConfig/updateSlices', value)
    },

    // Method to update phase encoding lines
    updatePhaseEncodingLines(value) {
      this.$store.dispatch('scanTimeConfig/updatePhaseEncodingLines', value)
    },

    // Method to update parallel factor
    updateParallelFactor(value) {
      this.$store.dispatch('scanTimeConfig/updateParallelFactor', value)
    },

    // Method to update oversampling
    updateOversampling(value) {
      this.$store.dispatch('scanTimeConfig/updateOversampling', value)
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

    // Method to update partial fourier
    updatePartialFourier(value) {
      this.$store.dispatch('scanTimeConfig/updatePartialFourier', value)
    },

    // Method to update averages
    updateAverages(value) {
      this.$store.dispatch('scanTimeConfig/updateAverages', value)
    },

    // Method to update concatenations
    updateConcatenations(value) {
      this.$store.dispatch('scanTimeConfig/updateConcatenations', value)
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
    submitOversampling() {
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustOversamplingByUser', { oversampling: this.oversamplingLocal })
    },
    /*
    increment() {
      this.sliceGroup++
    },
    decrement() {
      if (this.sliceGroup > 0) {
        this.sliceGroup--
      }
    },
    */
    ...mapActions('questionService', [
      'reportCriticalThinkingQuestion',
      'setTestPatientModelId',
      'setTestPatientName',
      'setTestPatientFamilyMemberSignature',
    ]),
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
    ...mapState('scanTimeConfig', ['selectedAutoAlign', 'activeButtons']),
    ...mapState('dataToParent', ['setOversampling']),
    ...mapGetters('scanTimeConfig', ['getAutoAlignOptions', 'getSelectedAutoAlign']),
    ...mapGetters('b19AllValuesSelection', ['getPositionSelectedValue', 'getPositionOptions']),
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
        if (this.isUltraLab && !this.isAddLocalizerMode) {
          // convert mm to %
          output = output !== 0 ? _.round((output / this.thickness) * 100) : 0
        }
        return output
      },
      set(spacing) {
        let input = spacing
        if (this.isUltraLab && !this.isAddLocalizerMode) {
          // convert % to mm
          input = _.round((this.thickness / 100) * input, 2)
        }
        this.spacingLocal = input
      },
    },
    spacingTooltip() {
      if (this.isUltraLab && !this.isAddLocalizerMode) {
        return _.round((this.thickness / 100) * this.spacing, 2)
      }
      return _.round(this.spacing, 2)
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

    dimensions3x: {
      get() {
        let output = _.get(this.selectionConfig, 'dimensions3.x')
        if (this.isUltraLab) {
          // convert mm to %
          output = output !== 0 ? _.round((output / this.dimensions3y) * 100) : 0
        }
        return _.round(output, 1)
      },
      set(dimensions3x) {
        let input = dimensions3x
        if (this.isUltraLab) {
          // convert % to mm
          input = (this.dimensions3y / 100) * input
        }
        this.dimensions3xLocal = _.round(input, 1)
      },
    },
    dimensions3xTooltip() {
      let dimensions3x = this.dimensions3x
      if (this.isUltraLab) {
        dimensions3x = _.round((dimensions3x * this.dimensions3y) / 100)
      }
      return dimensions3x + 'mm'
    },
    patientName() {
      return (
        this.$store.getters['selectionConfig/selectionConfigsProposedList']?.[0]?.testPatientName || 'Unknown Patient'
      )
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
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
    numberOfSlices(newVal, oldVal) {
      this.updateSeqValues()
      if (newVal !== oldVal) {
        this.handleSlices(newVal)
      }
    },
    oversamplingPercentage(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateOversampling(newVal)
      }
    },
    repetitionTime(newVal, oldVal) {
      this.updateSeqValues()
      if (newVal !== oldVal) {
        this.updateRepetition(newVal)
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
        this.updateSeqValues()
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

  beforeMount() {
    console.log('before mount Routine Tab=====', this.isUltraLab)
    this.fieldStrengthPreference = this.$store.getters['user/fieldStrengthPreference']
    console.log('fieldStrengthPreference=====', this.fieldStrengthPreference)
    if (this.isUltraLab) {
      console.log('this.isUltraLab=====', this.isUltraLab)
      if (!this.inversionRecovery) this.inversionTime = 0
      if (this.useInitialUltraLabDefaults) {
        this.setInitialUltraLabDefaults()
      }
    }
  },

  mounted() {
    console.log('spacing-------------------------', this.spacing)
    console.log('this.trueResolutionHeaderUltra', this.trueResolutionHeaderUltra)
    console.log('vendorStylePreference===', this.vendorStylePreference)
    console.log('isUltraLab===', this.isUltraLab)
    this.$emit('on-routine-tab-mounted', true)
    /*
    this.updateSeqValues()
    this.$emit('scan-time-generated', this.scanTime)
    this.$store.dispatch('scanTimeConfig/updateMinConcatAcqPackage', this.minConcatAcqPackage)

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
    */
    this.updateScanTime(this.scanTime)
    // Replace direct function calls with method calls from the component
    this.updateTrueResolutionHeaderUltra(this.trueResolutionHeaderUltra)
    this.updateTrueResolutionHeader(this.trueResolutionHeader)
    this.updateAcquiredResolutionHeader(this.acquiredResolutionHeader)

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
::v-deep .disabledClass .v-select__slot {
  background: #c0c0c0 !important;
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
.swapDot {
  margin-left: 2%;
}
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 35%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 1%;
  border: 2px solid black;
}
.coil-elements-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.coil-elements-display {
  border: 1px solid #727272; /* Black border */
  background-color: #f0f0f0; /* Light grey background */
  padding: 10px; /* Space inside the box */
  width: 100px; /* Adjust width as needed */
  text-align: center;
}

.coil-elements-display p {
  margin: 0;
  font-size: 14px;
  color: #000; /* Black text color */
}

.disabled-div {
  background-color: #b5b1b1; /* Background color to make it look disabled */
  border: 1px solid #555; /* Subtle border */
  border-radius: 5px;
  max-width: 240px;
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
.text-input {
  max-width: 100%;
  width: 48%;
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
}

::v-deep .theme--light.v-select .v-select__selections {
  font-size: 12px !important;
}
.v-select.v-input--dense .v-select__selection--comma {
  margin: 0px 1px 4px 0;
}
.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.5rem;
  width: 28%;
  margin-left: 1.5%;
  margin-bottom: 1.5%;
}
.input-disabled-lock {
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.05rem;
  width: 28%;
  margin-left: 2%;
}
::v-deep.v-btn:not(.v-btn--round).v-size--default {
  min-width: 208px;
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
  justify-content: space-between;
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

.v-text-field {
  padding-top: 0px;
  margin-top: 0px;
}

::v-deep .v-input__slot fieldset {
  background: white !important;
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
.btn-5 {
  width: 10% !important;
  /* height: 40px !important; */
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
  bottom: 9px !important;
  right: 11px;
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
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}
.sliceGroup {
  width: 14vw;
  max-width: 21%;
  margin-left: 2%;
}

.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

.MaxRecommFactorPE {
  width: 27%;
}
@media (min-width: 2305px) and (max-width: 2490px) {
  .disabled-div {
    margin-top: 5%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 28.5%;
  }
  /* .swapDot {
    margin-left: 1.5%;
  } */
}
/* Large desktops */
@media (min-width: 1920px) and (max-width: 2304px) {
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 28%;
  }
  /* .swapDot {
    margin-left: 1.5%;
  } */
}
@media (min-width: 1800px) and (max-width: 1919px) {
  .sliceGroup {
    width: 14vw;
    max-width: 20.7%;
    margin-left: 2%;
  }
  .position {
    width: 15.9vw;
    max-width: 30%;
    margin-left: 2%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 28%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 36px;
  }
  .swapDot {
    margin-left: 2%;
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
    max-width: 30%;
    margin-left: 2%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 28%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 36px;
  }
  .swapDot {
    margin-left: 2%;
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
    margin-left: 2%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 28%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 24px;
  }
  .swapDot {
    margin-left: 2%;
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
    margin-left: 2%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 28%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 24px;
  }
  .swapDot {
    margin-left: 2%;
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
    margin-left: 2%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 28%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 24px;
  }
  .swapDot {
    margin-left: 2%;
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
    margin-left: 2%;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    min-width: 28%;
  }
  .OrientationDotBtn {
    margin: -4px 0px 0px 24px;
  }
  .swapDot {
    margin-left: 2%;
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
