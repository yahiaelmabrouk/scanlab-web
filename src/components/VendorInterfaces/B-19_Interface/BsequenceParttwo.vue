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
        <div class="main-2">
          <div class="text-3" v-if="selectionConfig.sequenceType !== 'GRE'">
            <label class="label-size inactive-label">Define</label>
            <v-select
              :items="defineOptions"
              v-model="defineValue"
              color="#423c3c"
              dense
              outlined
              style="width: 15.5vw; max-width: 29%; margin-left: 2%"
            />
          </div>
          <div class="text-3" v-if="selectionConfig.sequenceType !== 'GRE'">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.echoTrainLength, 'inactive-label': !activeInputs.echoTrainLength }"
            >
              Turbo Factor
            </label>
            <BspinButton
              v-if="selectionConfig && selectionConfig.sequenceType !== 'DIFF'"
              :value="echoTrainLength"
              @input="changeSpin($event, 'echoTrainLength')"
              :type="'number'"
              :step="1"
              :min="1"
              :max="600"
              :disabled="complete"
              class="input-lock"
            />
            <BspinButton
              v-else
              :value="echoTrainLength"
              :type="'number'"
              :step="1"
              :min="1"
              :max="600"
              :disabled="true"
              class="input-lock"
            />
          </div>
          <div class="main-3">
            <div class="text-3 my-3">
              <label class="label-size inactive-label">Echo trains per slice</label>
              <BspinButton
                :type="'number'"
                v-model="echoTrainsPerSlice"
                :step="1"
                :min="1"
                :max="600"
                disabled
                class="spin-btn-grp ml-3 mb-2 MaxRecommFactorPE"
              />
            </div>
          </div>

          <div class="text-3" style="margin-top: 15%">
            <label class="label-size inactive-label">Phase correction</label>
            <v-select
              color="#423c3c"
              :items="phaseCorrctionOptions"
              v-model="phaseCorrctionValue"
              dense
              outlined
              style="width: 16.5vw; max-width: 29%; margin-left: 2%"
            />
          </div>
        </div>

        <div class="main-2">
          <div class="text-3">
            <label class="label-size inactive-label">RF pulse type </label>
            <v-select
              v-model="rfPulsing"
              :items="rfPulsingItems"
              item-title="text"
              item-value="value"
              color="#423c3c"
              dense
              outlined
              style="width: 15.5vw; max-width: 30%; margin-left: 2%"
            />
          </div>
          <div class="main-3">
            <div class="text-3">
              <label class="label-size inactive-label">Gradient mode</label>
              <v-select
                v-model="gradientRamp"
                :items="gradientRampItems"
                color="#423c3c"
                dense
                outlined
                style="width: 15.5vw; max-width: 30%; margin-left: 2%"
              />
            </div>
            <div class="text-3" style="margin-top: 25%">
              <label class="label-size-1 mr-2 inactive-label">Red. EC sensitivity</label>
              <checkbox v-model="RedECsensitivity" label="Custom Checkbox" />
            </div>
            <div class="text-3">
              <v-col>
                <div class="disabled-div">
                  <div class="text-3 minTeCon input-group">
                    <label class="label-size" style="color: dimgray">Min.TR/Conc</label>
                    <div class="text-input ml-2">
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
                    <div class="text-input ml-2">
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
              <!-- <v-col cols="3" class="mt-5" v-if="!isTakingTest">
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
              <v-col cols="3" class="mt-5" v-if="!isTakingTest">
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
              </v-col> -->
            </div>
          </div>
        </div>
      </div>
      <!-- <div class="main-1">
        <div class="bottom-card"></div>
      </div> -->
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from './BspinButton.vue'
import checkbox from './CustomCheckbox.vue'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  name: 'BsequenceParttwo',
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
      defineValue: 'Turbo factor',
      defineOptions: ['Turbo factor', 'Echo trains'],
      phaseCorrctionValue: 'Automatic',
      phaseCorrctionOptions: ['Automatic'],
      //RFpulsetypeValue: 'Fast',
      //RFpulsetypeOptions: ['Fast', 'Normal', 'Low SAR'],
      turboFactor: 1,
      echoTrainsPerSlice: 1,
      //gradientModeValue: 'Fast',
      //gradientModeOptions: ['Fast', 'Normal', 'Whisper'],
      RedECsensitivity: false,
    }
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    //...mapActions('dataToParent', ['updateScanTime']),
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
    changeTurboFactor(value) {
      this.turboFactor = value
    },
    changeEchoTrainsPerSlice(value) {
      this.echoTrainsPerSlice = value
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
.MaxRecommFactorPE {
  width: 27%;
}
.disabled-div {
  background-color: #b5b1b1; /* Background color to make it look disabled */
  border: 1px solid #555; /* Subtle border */
  border-radius: 5px;
  max-width: 240px;
  width: 100%;
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
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 36%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 1%;
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
  background: black !important;
  color: #ffffff !important;
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
  width: 40%;
  display: flex;
  justify-content: right;
}

.label-size-1 {
  width: 65%;
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
  height: 1.05rem;
  width: 27%;
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
  display: flex;

  flex-direction: column;
  justify-content: space-between;
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
.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}
@media (max-width: 1800px) {
  .bottom-card {
    left: 35%;
    margin-top: 3% !important;
  }
  .disabled-div {
    margin-top: 12%;
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
