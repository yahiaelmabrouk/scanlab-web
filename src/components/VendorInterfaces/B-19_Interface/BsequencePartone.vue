<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-dialog v-model="showConfirmDialog" persistent width="700px">
      <v-card class="change-dialog full-height-dialog">
        <div class="dialog-content">
          <v-card-title class="headline notification-title">
            {{ $t('global.notification', languageCode) }}
          </v-card-title>

          <v-card-text class="notification-text">
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

          <v-card-actions class="notification-action">
            <v-spacer></v-spacer>
            <v-btn @click="cancelChange">
              {{ $t('global.cancel', languageCode) }}
            </v-btn>
            <v-btn @click="confirmChange" :class="{ 'active-confirm-button': isDialogKeyboardReady }">
              {{ $t('global.okay', languageCode) }}
            </v-btn>
          </v-card-actions>
        </div>
      </v-card>
    </v-dialog>

    <v-card-text>
      <div class="main-1 my-2">
        <div class="main-3">
          <div>
            <div class="text-2" style="margin-left: 13%">
              <label class="label-size mr-2 inactive-label">Introduction</label>
              <checkbox v-model="Introduction" label="Custom Checkbox" />
            </div>
            <div class="text-3">
              <label class="label-size-1 inactive-label">Dimension</label>
              <v-select
                v-model="dimensionValue"
                :items="dimensionOptions"
                color="#423c3c"
                dense
                outlined
                style="width: 16.5vw; max-width: 35%; margin-left: 2%"
              ></v-select>
            </div>
            <div class="text-3">
              <label
                class="label-size-1"
                :class="{ 'active-label': activeInputs.sequenceType, 'inactive-label': !activeInputs.sequenceType }"
              >
                Sequence Name
              </label>

              <v-btn-toggle
                @change="changeSequenceType"
                v-model="selectionConfig.sequenceType"
                mandatory
                class="sequence ml-2"
              >
                <v-btn
                  tile
                  outlined
                  class="no-transform bold sq-left"
                  color="buttonBlue"
                  :value="'GRE'"
                  width="55"
                  height="33"
                  :style="selectionConfig.sequenceType == 'GRE' ? 'color:black' : ''"
                >
                  {{ 'gre' }}
                </v-btn>
                <v-btn
                  tile
                  outlined
                  class="ml-2 outline-btn no-transform bold"
                  color="buttonBlue"
                  :value="'SE'"
                  width="60"
                  height="33"
                  :style="selectionConfig.sequenceType == 'SE' ? 'color:black' : ''"
                >
                  se
                </v-btn>
                <v-btn
                  tile
                  outlined
                  class="ml-2 outline-btn no-transform bold"
                  color="buttonBlue"
                  :value="'TE'"
                  width="55"
                  height="33"
                  :style="selectionConfig.sequenceType == 'TE' ? 'color:black' : ''"
                >
                  {{ 'tse' }}
                </v-btn>
                <v-btn
                  v-if="showDiffusionSequenceOption"
                  tile
                  outlined
                  class="ml-2 outline-btn no-transform bold"
                  color="buttonBlue"
                  :value="'DIFF'"
                  width="55"
                  height="33"
                  :style="selectionConfig.sequenceType == 'DIFF' ? 'color:black' : ''"
                >
                  {{
                    vendorStylePreference === 'philips' || vendorStylePreference === 'siemens'
                      ? $t('SelectionConfigForm.spin_echo_diffusion')
                      : $t('SelectionConfigForm.spin_echo_diffusion')
                  }}
                </v-btn>
              </v-btn-toggle>
            </div>
          </div>
          <div>
            <div class="text-3" style="margin-left: 13%">
              <label class="label-size mr-2">Compensate T2 decay</label>
              <checkbox v-model="Compensate" label="Custom Checkbox" />
            </div>
            <div class="text-2">
              <label class="label-size-1 inactive-label">Averaging mode</label>
              <v-select
                :items="avgOptions"
                v-model="avgValue"
                color="#423c3c"
                dense
                outlined
                style="width: 16.5vw; max-width: 35%; margin-left: 2%"
              />
            </div>
            <div class="text-3">
              <label class="label-size-1 inactive-label">Multi-slice mode</label>
              <v-select
                :items="multiSliceModeOptions"
                v-model="multiSliceSelectedValue"
                color="#423c3c"
                dense
                outlined
                style="width: 15.5vw; max-width: 35%; margin-left: 2%"
              />
            </div>
            <div class="text-2" style="margin-left: 13%">
              <label class="label-size mr-2 inactive-label">Reduce Motion Sens.</label>
              <checkbox v-model="ReduceMotion" label="Custom Checkbox" />
            </div>
          </div>
        </div>

        <div class="main-3">
          <div>
            <div class="text-3">
              <label class="label-size inactive-label">Contrasts</label>
              <BspinButton
                @input="changeContrast"
                :type="'number'"
                :value="contrast"
                :step="1"
                :min="1"
                :max="10"
                :disabled="complete"
                class="input-lock"
              />
            </div>

            <div class="text-3">
              <label
                class="label-size"
                :class="{
                  'active-label': activeInputs.receiverBandWidth,
                  'inactive-label': !activeInputs.receiverBandWidth,
                }"
              >
                Bandwidth
              </label>
              <BspinButton
                :id="'tooltip-receiver-bandwidth' + selectionIdent"
                :type="'number'"
                v-model.number="receiverBandWidth"
                :step="1"
                :min="vendorStylePreference === 'siemens' ? 100 : 1"
                :max="20000"
                :disabled="complete || isAddLocalizerMode"
                @input="onBandwidthChangedByUser"
                class="input-lock"
              />
              <b-tooltip
                v-if="isUltraLab && vendorStylePreference === 'siemens'"
                :target="'tooltip-receiver-bandwidth' + selectionIdent"
                triggers="hover"
              >
                {{ 'Fat/Water Shift ' + receiverBandwidthTooltip + ' pxl' }}
              </b-tooltip>
              <span class="mx-2">Hz/Px</span>
            </div>
            <div class="text-3">
              <label class="label-size inactive-label">Flow comp.</label>
              <v-select
                :items="flowOptions"
                v-model="flowValue"
                color="#423c3c"
                dense
                outlined
                style="width: 15.5vw; max-width: 30%; margin-left: 2%"
              ></v-select>
            </div>
          </div>
          <div>
            <div class="text-3">
              <label class="label-size inactive-label">Allowed delay</label>
              <BspinButton
                @input="changeDelay"
                :type="'number'"
                :value="delay"
                :step="1"
                :min="1"
                :max="500"
                :disabled="complete"
                class="input-lock"
              />
              <span class="mx-2">s</span>
            </div>
            <div class="text-3 my-3" v-if="selectionConfig.sequenceType !== 'GRE'">
              <label
                class="label-size"
                :class="{ 'active-label': activeInputs.echoSpacing, 'inactive-label': !activeInputs.echoSpacing }"
              >
                Echo spacing
              </label>
              <BspinButton
                :type="'number'"
                :value="echoSpacing"
                :step="1"
                :min="1"
                :max="500"
                :disabled="true"
                class="input-lock"
              />
              <span class="mx-2">ms</span>
            </div>
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
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
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
    useInitialUltraLabDefaults: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data() {
    return {
      dimensionValue: '2D',
      dimensionOptions: ['2D', '3D'],
      avgValue: 'Long term',
      avgOptions: ['Long term', 'Short term'],
      flowValue: 'No',
      flowOptions: ['No', '<<Read>>', '<<Slice>>'],
      multiSliceModeOptions: ['Interleaved', 'Sequential'],
      multiSliceSelectedValue: 'Interleaved',
      contrast: 1,
      //bandwidth: 191,
      delay: 30,
      Introduction: false,
      Compensate: false,
      ReduceMotion: false,
    }
  },
  mounted() {
    console.log('vendorStylePreference', this.vendorStylePreference)

    //this.updateSequenceType(this.selectionConfig.sequenceType)
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    //...mapActions('dataToParent', ['updateScanTime', 'updateSequenceType']),
    /*
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
    /*
    changeBandwidth(value) {
      this.bandwidth = value
    },
    */
    changeDelay(value) {
      this.delay = value
    },
  },
  computed: {
    ...mapState('selectionConfig', 'isAddLocalizerMode'),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    ...mapGetters('scanTimeConfig', [
      'getAutoAlignOptions',
      'getSelectedAutoAlign',
      'getLocalSoftwareVersionPreference',
    ]),

    /*
    localSoftwareVersionPreference() {
      return this.getLocalSoftwareVersionPreference
    },
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
    'selectionConfig.sequenceType'(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateSequenceType(newVal)
      }
    },

    echoTrainLength(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateSeqValues()
      }
    },
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
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
.selected-btn {
  color: black !important;
  font-weight: bold;
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

.notification-title {
  display: block;
  text-align: center;
}

.notification-text {
  position: relative !important;
}

.notification-action {
  display: block;

  .v-btn {
    /* background: black !important; */
    color: white !important;
    min-width: 28%;
  }
}

.v-btn {
  font-size: 11px !important;
  background: white !important;
  color: black !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
}

.snr-icon-btn {
  background: transparent !important;
  color: #000 !important;
  border: none !important;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute;
  top: 0px !important;
  bottom: 0 !important;
}

.label-size {
  width: 55%;
  display: flex;
  justify-content: right;
}

.label-size-1 {
  width: 30%;
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
  font-size: 80%;
  color: black;
}

.text-2 {
  display: flex;
  justify-content: flex-start;
}

text-4 {
  display: flex;
  justify-content: space-around;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}

.text-3 {
  display: flex;
  justify-content: flex-start;
}

::v-deep .v-input__icon {
  height: 11px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
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

::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-input--selection-controls {
  margin-top: 0px;
  margin-bottom: -15px !important;
  padding-top: 0px;
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

.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.5rem;
  width: 28%;
  margin-left: 2%;
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
  background: #423c3c !important;
  margin: 0.15rem;
  border-radius: 0px;
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

.main-3 {
  height: 27vh;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
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
  height: 86%;
}

.v-sheet.v-card {
  border-radius: 0px;
}
::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin: 0px 4px 4px 0px !important;
}
::v-deep .theme--light.v-btn-toggle:not(.v-btn-toggle--group) {
  background: transparent !important;
  color: rgba(0, 0, 0, 0.87);
}
::v-deep .v-btn-toggle .v-btn--active {
  background-color: black !important; /* Change to your preferred color */
  color: white !important;
  border: 1px solid black !important; /* Adjust the border color for the active state */
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); /* Optional shadow for emphasis */
}

.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

@media (max-width: 1800px) {
  .sequence {
    padding-right: 34.6%;
  }
  .bottom-card {
    left: 35%;
    margin-top: 11% !important;
  }
}
@media (min-width: 1801px) and (max-width: 2490px) {
  .sq-left {
    /* margin-left: 28%; */
  }
  .bottom-card {
    left: 35%;
    margin-top: 11% !important;
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
