<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
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
      <div class="main-1 mt-2">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">1stSignal/Mode</label>
            <v-select
              v-model="signalMode"
              :items="signalModeOptions"
              color="#423c3c"
              dense
              outlined
              style="width: 50px"
            ></v-select>
          </div>
          <div class="text-1">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.repetitionTime, 'inactive-label': !activeInputs.repetitionTime }"
              style="margin-right: 2%"
            >
              TR
            </label>
            <BspinButton
              @input="changeRepetitionTime"
              :type="'number'"
              :value="repetitionTime"
              :step="1"
              :min="selectionConfig.sequenceType !== 'DIFF' ? 1 : minConcatAcqPackage"
              :max="20000"
              :disabled="complete || isAddLocalizerMode"
              class="input-lock"
            />
            <span class="mx-2">ms</span>
          </div>
        </div>

        <div class="main-3">
          <div class="text-1">
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
              :disabled="complete || isAddLocalizerMode || selectionConfig.sequenceType === 'DIFF'"
              class="input-lock"
            />
          </div>
        </div>
      </div>
      <!-- <v-row class="justify-end m-0" v-if="!isTakingTest">
        <v-col cols="2" class="pt-0">
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
        <v-col cols="2" class="pt-0">
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
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from './BspinButton.vue'
import EventBus from '@/lib/event-bus'
import _ from 'lodash'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  mixins: [SelectionConfigMixin],
  components: { BspinButton },
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
  data() {
    return {
      signalModeOptions: ['Off', 'RESP', 'ECG', 'External'],
      signalMode: 'Off',
    }
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    //...mapActions('scanTimeConfig', ['updateRepetitionTime', 'updateConcatenations']),
    //...mapActions('dataToParent', ['updateScanTime']),
    /*
    changeConcatenations(value) {
      this.concatenations = value
    },
    increment() {
      this.number++
    },
    decrement() {
      if (this.number > 0) {
        this.number--
      }
    },
    */
    changeContrast(value) {
      this.contrast = value
    },
  },
  computed: {
    ...mapState('selectionConfig', 'isAddLocalizerMode'),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    /*
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
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
    repetitionTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateRepetition(newVal)
        this.updateSeqValues()
      }
    },
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
.v-input--is-focused {
  display: block !important;
}
label,
span {
  font-size: 80%;
  color: black;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
::v-deep .v-text-field__details {
  display: none;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 35px;
}
.text-1 {
  display: flex;
  justify-content: center;
  color: black !important;
  width: 100%;
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
.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.5rem;
  width: 46%;
  margin-left: 2%;
}
::v-deep .v-input__icon {
  height: 18px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
}
::v-deep .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__append-inner {
  margin-top: 3px !important;
}
::v-deep .v-input__append-inner {
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}
::v-deep .v-icon.v-icon {
  color: black !important;
}
.v-input {
  max-width: 45%;
}
::v-deep .v-text-field input {
  padding: 0px;
}
::v-deep .v-text-field--outlined fieldset {
  bottom: 10px !important;
  right: 10px;
  top: -2px !important;
  margin-left: 5px;
}
.main-1 {
  display: flex;
  height: 27vh;
  justify-content: space-around;
}
.main-2 {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 30%;
}
.item {
  margin: 0 10px;
}
.main-3 {
  height: 30vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 30%;
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
::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin: 0 0 9% 0 !important;
}

.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
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
