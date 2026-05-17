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
    <div class="main-1">
      <div class="main-2">
        <div class="text-3">
          <label class="label-size inactive-label">Slice group</label>
          <div :class="isCurrent ? 'text-input' : 'text-input'" style="display: flex; justify-content: flex-start !important;">
            <DropDownText
              type="'number'"
              :value="sliceGroup"
              :step="1"
              :min="1"
              :max="300"
              :disabled="complete || isAddLocalizerMode"
            />
          </div>
        </div>
        <div class="text-3">
          <label
            class="label-size"
            :class="{ 'active-label': activeInputs.numberOfSlices, 'inactive-label': !activeInputs.numberOfSlices }"
          >
            Slices
          </label>
          <div :class="isCurrent ? 'text-input' : 'text-input'">
            <SpinButton
              @input="submitNumberOfSlices"
              :type="'number'"
              v-model.number="numberOfSlices"
              :step="1"
              :min="1"
              :max="300"
              :disabled="complete || isDisabledParameter"
            />
          </div>
        </div>
        <div class="text-3" v-if="!isSingleSliceMode || isAddLocalizerMode || spacing < 0">
          <label
            class="label-size"
            :class="{ 'active-label': activeInputs.spacing, 'inactive-label': !activeInputs.spacing }"
          >
            <!-- {{ labels.gap[vendorStylePreference.trim()] }} -->
            Slice Gap
            <UnitCaption unit="(%)" v-if="vendorStylePreference === 'siemens' && !isAddLocalizerMode" />
            <UnitCaption unit="(mm)" v-else />
          </label>
          <div :id="'tooltip-spacing' + selectionIdent" class="text-input">
            <SpinButton
              :step="vendorStylePreference === 'siemens' && !isAddLocalizerMode ? 1 : 0.1"
              :min="0"
              :max="vendorStylePreference === 'siemens' && !isAddLocalizerMode ? 100 : 50"
              v-model.number="spacing"
              @input="submitSpacing"
              :disabled="complete"
              :allow-decimal="vendorStylePreference === 'siemens' && !isAddLocalizerMode ? false : true"
            />
          </div>
          <b-tooltip :target="'tooltip-spacing' + selectionIdent" triggers="hover">
            {{ spacingTooltip + ' mm' }}
          </b-tooltip>

          <span class="mx-2">%</span>
        </div>

        <div class="text-3">
          <label class="label-size inactive-label">Position</label>
          <div class="text-2">
            <v-select
              :disabled="isAddLocalizerMode"
              color="#423c3c"
              dense
              outlined
              :items="positionOptions"
              v-model="selectedPosition"
              style="width: 11vw; max-width: 73%"
            />
            <div>
              <v-btn class="btn-2">...</v-btn>
            </div>
          </div>
        </div>
        <div class="text-3">
          <label class="label-size active-label">Orientation</label>
          <div class="text-2 mb-3">
            <v-menu>
              <template #activator="{ on }">
                <v-btn
                  :disabled="isAddLocalizerMode"
                  class="btn-4"
                  v-on="on"
                  dense
                  outlined
                  style="width: 158px !important; height: 2rem !important"
                >
                  {{ selectedValue }}
                  <v-icon small>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  :class="{ 'active-list-item': selectedValue === 'Transversal' }"
                  @click="
                    resetSelection({ index: 0, dirOnly: true })
                    selectedValue = 'Transversal'
                  "
                >
                  <v-list-item-title>Transversal</v-list-item-title>
                </v-list-item>

                <v-list-item
                  :class="{ 'active-list-item': selectedValue === 'Coronal' }"
                  @click="
                    resetSelection({ index: 1, dirOnly: true })
                    selectedValue = 'Coronal'
                  "
                >
                  <v-list-item-title>Coronal</v-list-item-title>
                </v-list-item>

                <v-list-item
                  :class="{ 'active-list-item': selectedValue === 'Sagittal' }"
                  @click="
                    resetSelection({ index: 2, dirOnly: true })
                    selectedValue = 'Sagittal'
                  "
                >
                  <v-list-item-title>Sagittal</v-list-item-title>
                </v-list-item>

                <v-list-item
                  :class="{ 'active-list-item': selectedValue === 'S>C-7.7' }"
                  @click="
                    resetSelection({ index: 3, dirOnly: true })
                    selectedValue = 'S>C-7.7'
                  "
                >
                  <v-list-item-title>S > C-7.7</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>

        <div class="text-3 mt-2">
          <label
            class="label-size"
            :class="{ 'active-label': activeInputs.phaseEncoding, 'inactive-label': !activeInputs.phaseEncoding }"
          >
            Phase Encoding Dir.
          </label>

          <v-btn class="btn-3" @click="smartRotateSelectionConfigDir" style="width: 38% !important">Swap</v-btn>
        </div>

        <div class="text-3 mt-2">
          <label
            class="label-size"
            :class="{ 'active-label': activeInputs.oversampling, 'inactive-label': !activeInputs.oversampling }"
          >
            Phase Oversampling
          </label>
          <div class="text-input">
            <SpinButton
              @input="submitOversampling"
              class="adj-input"
              :type="'number'"
              v-model.number="oversamplingPercentage"
              :step="1"
              :min="0"
              :max="100"
              :disabled="complete || isAddLocalizerMode"
            />
          </div>
          <span class="mx-2">%</span>
        </div>

        <div class="text-3" hidden>
          <label class="label-size">Min. Seq. TR</label>
          <div class="text-input">
            <SpinButton
              :type="'number'"
              :step="1"
              :min="1"
              :max="500"
              :value="minSeqTr"
              v-model.number="minSeqTr"
              disabled
              class="spin-btn-grp"
            />
          </div>
        </div>
      </div>

      <div class="main-2">
        <div class="text-3">
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
        <div class="text-3">
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
              :id="'dimensions3x_tooltip' + selectionIdent"
            />
          </div>
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
            Slice Thickness
          </label>
          <div class="text-input">
            <SpinButton
              @input="submitThickness"
              :type="'number'"
              :value="thickness"
              v-model.number="thickness"
              :step="0.5"
              :min="0"
              :max="50"
              :disabled="complete"
            />
          </div>
          <span class="mx-2">mm</span>
        </div>
        <div class="text-3">
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

        <div class="text-3">
          <label
            class="label-size"
            :class="{ 'active-label': activeInputs.echoTime, 'inactive-label': !activeInputs.echoTime }"
          >
            TE
          </label>
          <div class="text-input">
            <!-- <SpinButton
                @input="changeEchoTime"
                :type="'number'"
                :value="echoTime"
                :step="1"
                :min="1"
                :max="100"
                :disabled="complete || isAddLocalizerMode"
              /> -->
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
              :min="minTEOptionsForTEandDIFF"
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
          <span class="mx-2">ms</span>
        </div>
        <div v-if="selectionConfig.sequenceType !== 'DIFF'" class="text-3">
          <label
            class="label-size"
            :class="{ 'active-label': activeInputs.averages, 'inactive-label': !activeInputs.averages }"
          >
            Averages
          </label>
          <div class="text-input">
            <SpinButton
              @input="setAverages"
              :type="'number'"
              :value="averages"
              v-model.number="averages"
              :step="1"
              :min="1"
              :max="10"
              :disabled="complete"
            />
          </div>
        </div>

        <div class="text-3">
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
        <div class="text-3">
          <label class="label-size inactive-label">AutoAlign</label>
          <div class="text-2">
            <v-select
              :disabled="isAddLocalizerMode"
              color="#423c3c"
              dense
              outlined
              :items="getAutoAlignOptions"
              v-model="getSelectedAutoAlign"
              @change="updateAutoalign"
              style="width: 11vw; max-width: 73%"
            />
            <div>
              <v-btn class="btn-2">...</v-btn>
            </div>
          </div>
        </div>

        <div class="text-22">
          <label class="label-size inactive-label">Coil Elements</label>

          <p>{{ activeButtons.join(', ') }}</p>
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
        <div class="text-3 minTeCon input-group">
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
  </v-card>
</template>

<script>
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import { MriMixin } from '../Mixins/MriMixin.js'
import _ from 'lodash'
import { ScanButtonMixin } from '../Mixins/ScanButtonMixin'
import SpinButton from './SpinButton.vue'
import DropDownText from './DropDownText.vue'
import EventBus from '@/lib/event-bus'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'
import UnitCaption from '@/components/UnitCaption.vue'

export default {
  mixins: [SelectionConfigMixin, ScanButtonMixin],
  name: 'RoutineTab',
  components: { SpinButton, DropDownText, UnitCaption },

  data() {
    return {
      oversamplingValue: '',
      selectedValue: 'S>C-7.7',
      sliceGroup: 1,
      selectedPosition: 'L65.5 P125.8 H0.0',
      positionOptions: ['Isocenter', 'L65.5 P125.8 H0.0'],
      selectedPhaseEncoding: null,
      phaseEncodingOptions: ['A>>P', 'P>>A', 'H>>F', 'F>>H'],
    }
  },
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
    isSandbox: {
      type: Boolean,
      required: false,
      default: false,
    },
    */
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
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    //...mapMutations('dataToParent', ['setScanTime', 'setSequenceType']),
    ...mapMutations('dataToParent', ['setSequenceType']),
    ...mapActions('scanTimeConfig', [
      'updateRepetitionTime',
      'updateEchoTime',
      'updateFlipAngle',
      'updateSlices',
      'updatePhaseEncodingLines',
      'updateParallelFactor',
      'updatePhaseMatrix',
      'updateFrequencyMatrix',
      //'updateDimensions3x',
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
    // ...mapMutations('dataToParent', ['setOversampling']),
    ...mapActions('dataToParent', ['updateScanTime', 'updateOversamplings']),
    saveOversampling() {
      this.updateOversampling(this.oversamplingValue)
      this.oversamplingValue = ''
    },
    */
    updateAutoalign(value) {
      this.$store.dispatch('scanTimeConfig/updateAutoalign', value)
    },
    /*
    handleSlices(event) {
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
      // this.changeRepetitionTime(event)
    },
    handleEchoTime(event) {
      this.updateEchoTime(event)
      // this.changeEchoTime(event)
    },
    handleAverages(event) {
      this.updateAverages(event)
    },
    */
    /*
    handleConcatenations(event) {
      this.updateConcatenations(event)
      // this.changeConcatenations(event)
    },
    */
    /*
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
    */
    /*
    // Method to update concatenations
    updateConcatenations(value) {
      this.$store.dispatch('scanTimeConfig/updateConcatenations', value)
    },
    */
    /*
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
    ...mapState('scanTimeConfig', ['selectedAutoAlign', 'activeButtons']),
    ...mapState('dataToParent', ['setOversampling']),

    ...mapGetters('scanTimeConfig', ['getAutoAlignOptions', 'getSelectedAutoAlign']),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    /*
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    */
    //spacing: {
    //  get() {
    //    let output = _.get(this.selectionConfig, 'spacing')
    //    if (this.isUltraLab && this.vendorStylePreference === 'siemens' && !this.isAddLocalizerMode) {
    //      // convert mm to %
    //      output = output !== 0 ? _.round((output / this.thickness) * 100) : 0
    //    }
    //    return output
    //  },
    //  set(spacing) {
    //    let input = spacing
    //    if (this.isUltraLab && this.vendorStylePreference === 'siemens' && !this.isAddLocalizerMode) {
    //      // convert % to mm
    //      input = _.round((this.thickness / 100) * input, 2)
    //    }
    //    this.spacingLocal = input
    //  },
    //},
    /*
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
    spacing(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('newVal=====Spacing==', newVal)
      }
    },
    numberOfSlices(newVal, oldVal) {
      // if(this.minConcatAcqPackage > this.repetitionTime){
      //    this.changeFromLabel = this.$t('global.number_of_slices')
      //    this.changeFromOldValue = oldVal
      //    this.changeFromNewValue = newVal

      //    this.showConfirmDialog = true
      //  }
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
    */
    /*
    concatenations(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateConcatenations(newVal)
        this.updateSeqValues()
      }
    },
    */
    /*
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
    console.log('counting: routineTab mounted')
    this.$emit('on-routine-tab-mounted', true)
    /*
    console.log('scanTime in routineTab===', this.scanTime)
    console.log('vendorStylePreference===', this.vendorStylePreference)
    console.log('isUltraLab===', this.isUltraLab)
    this.setScanTime(this.scanTime)
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
    //this.updateConcatenations(this.concatenations)
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
/* General Styles */
.v-btn {
  font-size: 11px !important;
  /* background: black !important; */
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
  /* border-color: black !important; */
}
::v-deep .v-dialog > .v-card > .v-card__actions {
  padding: 12px 16px;
}
.minTeCon {
  margin-top: 10%;
  justify-content: flex-end;
  margin-right: 15%;
}
/* dropdown background style */
::v-deep .theme--light.v-select .v-select__selections {
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
/* dropdown background style */

/*
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
*/

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}

.text-input {
  max-width: 100%;
  width: 100%;
  margin-left: 0%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1.5rem !important;
  border-bottom: none;
}

.label-size {
  width: 100%;
  display: flex;
  justify-content: flex-end;
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

label,
span {
  font-size: 70%;
}
.text-22 {
  display: flex;
  justify-content: start;
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
  margin-bottom: 3px;
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
  /*color: white !important;*/
  font-size: 17px;
  height: 12px !important;
}

.v-input {
  max-width: 100%;
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
  background: #423c3c !important;
  margin: 0.15rem;
  border-radius: 0px;
}

.btn-3 {
  width: 35px !important;
  height: 20px !important;
  background: #423c3c !important;
  border-radius: 0px;
}

.btn-4 {
  display: flex;
  justify-content: space-between;
  background: #383535 !important;
  padding: 0px 4px 0px 20px !important;
  width: 100% !important;
  height: 18px !important;
  box-shadow: none;
  border-radius: 0px;
  border: none !important;
  font-size: 10px !important;
  font-weight: inherit !important;
  text-transform: inherit !important;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: 0px !important;
}

.main-1 {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.main-2 {
  width: 100%;
  color: white !important;
}

.btn-1 {
  display: flex;
  width: 100%;
  justify-content: space-between;
}

.custom-container.col-md-9 {
  max-width: 100% !important;
  padding: 0 !important;
}

.v-sheet.v-card {
  border-radius: 0px;
}

label {
  margin-bottom: 0.35rem;
}

/* Disabled Div */
.disabled-div {
  background-color: #444; /* Background color to make it look disabled */
  padding: 8px;
  border: 1px solid #555; /* Subtle border */
  border-radius: 5px;
  max-width: 215px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  margin: auto;
  opacity: 0.5; /* Makes it look disabled */
}

/* Input Group */
.input-group {
  display: flex;
  justify-content: space-between;
}

.input-group label {
  color: #ccc;
  font-size: 14px;
  flex: 1;
}

.input-group input {
  background-color: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 5px;
  flex: 1;
  text-align: right;
  max-width: 100px;
}

input[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Label Styles */
.active-label {
  color: white; /* White color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

/* Responsive Styles */

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

@media (max-width: 767px) {
  .text-input {
    max-width: 100%;
    width: 100%;
    margin-left: 0%;
    height: 1.2rem !important;
  }

  .minTeCon {
    margin-top: 10%;
    justify-content: flex-end;
  }

  .label-size {
    width: 100%;
    justify-content: left;
    margin-right: 0;
  }

  .v-btn {
    font-size: 9px !important;
  }

  .main-1 {
    flex-direction: column;
  }

  .main-2 {
    width: 100%;
    margin-top: 2%;
  }

  .v-input {
    max-width: 100%;
  }

  .text-1,
  .text-2,
  .text-3 {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-1,
  .btn-2,
  .btn-3,
  .btn-4 {
    width: 100% !important;
    height: auto !important;
  }
}

/* Tablets and Small Desktops */
@media (min-width: 768px) and (max-width: 1024px) {
  .text-input {
    max-width: 45%;
    width: 45%;
    margin-left: 0%;
    height: 1.2rem !important;
  }

  .minTeCon {
    margin-top: 10%;
    justify-content: flex-end;
  }

  .label-size {
    width: 45%;
    margin-right: 5px;
  }

  .v-btn {
    font-size: 10px !important;
  }

  .main-1 {
    flex-direction: column;
  }

  .main-2 {
    width: 100%;
    margin-top: 3%;
  }

  .v-input {
    max-width: 45%;
  }

  .text-1,
  .text-2,
  .text-3 {
    flex-direction: column;
  }

  .btn-1,
  .btn-2,
  .btn-3,
  .btn-4 {
    width: auto !important;
    height: auto !important;
  }
}

/* Large Desktops and Bigger Screens */
@media (min-width: 1025px) {
  .text-input {
    max-width: 38%;
    width: 38%;
  }

  .minTeCon {
    margin-top: 10%;
    justify-content: flex-end;
  }

  .disabled-div {
    padding: 0 15px 0px 0px;
    max-width: 25%;
    /*
    margin-left: 64%;
    */
    height: 25%;
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
    width: 50%;
    margin-top: 1%;
  }

  .v-input {
    max-width: 30%;
  }

  .text-1,
  .text-2,
  .text-3 {
    flex-direction: row;
  }

  .btn-1,
  .btn-2,
  .btn-3,
  .btn-4 {
    width: auto !important;
    height: auto !important;
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
    height: 25%;
  }
  ::v-deep .sp-btn-updown {
    width: 135%;
  }
  ::v-deep .sp-btn-updown .sp-btn-grp {
    width: 100%;
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
    margin-bottom: 10px;
  }
  ::v-deep .v-input__slot fieldset {
    height: 2.5rem !important;
    width: 160px !important;
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
