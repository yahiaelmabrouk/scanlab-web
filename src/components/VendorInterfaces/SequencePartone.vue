<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%" style="box-shadow: none">
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
        <div class="text-1">
          <label
            class="label-size"
            :class="{ 'active-label': activeInputs.sequenceType, 'inactive-label': !activeInputs.sequenceType }"
          >
            Sequence Name
          </label>
          <v-select
            v-model="selectionConfig.sequenceType"
            :items="availableSequenceTypesXA"
            color="#423c3c"
            dense
            outlined
            style="width: 11.5vw; margin-left: 2%"
            @change="changeSequenceType"
          ></v-select>
        </div>
        <div class="text-1">
          <label class="label-size inactive-label">Dimension</label>
          <v-select
            color="#423c3c"
            v-model="dimensionValue"
            :items="dimensionOptions"
            dense
            outlined
            style="width: 11.5vw; max-width: 45%; margin-left: 2%"
          ></v-select>
        </div>
        <div class="text-1">
          <label class="label-size inactive-label">Excitation</label>
          <v-select
            v-model="Excitation"
            :items="ExcitationOptions"
            dense
            outlined
            color="#423c3c"
            style="width: 11.5vw; max-width: 45%; margin-left: 2%"
          ></v-select>
        </div>
        <div class="text-1">
          <label class="label-size inactive-label">RF Pulse Type</label>
          <v-select
            color="#423c3c"
            v-model="rfPulsing"
            :items="rfPulsingItems"
            item-title="text"
            item-value="value"
            dense
            outlined
            style="width: 11.5vw; max-width: 45%; margin-left: 2%"
          ></v-select>
        </div>
        <div class="text-1">
          <label class="label-size inactive-label">Gradient Mode</label>
          <v-select
            color="#423c3c"
            v-model="gradientRamp"
            :items="gradientRampItems"
            dense
            outlined
            style="width: 11.5vw; max-width: 45%; margin-left: 2%"
          ></v-select>
        </div>
        <div class="text-1">
          <label class="label-size inactive-label">Flow Compensation</label>
          <v-select
            color="#423c3c"
            v-model="flowCompensationValue"
            :items="flowCompensationOptions"
            dense
            outlined
            style="width: 11.5vw; max-width: 45%; margin-left: 2%"
          ></v-select>
        </div>
      </div>

      <div class="main-2 mr-6">
        <div class="text-1">
          <label
            class="label-size"
            :class="{
              'active-label': activeInputs.receiverBandWidth,
              'inactive-label': !activeInputs.receiverBandWidth,
            }"
          >
            Bandwidth
          </label>
          <div :id="'tooltip-receiver-bandwidth' + selectionIdent" class="text-input">
            <SpinButton
              :type="'number'"
              :value="receiverBandWidth"
              :step="1"
              :min="vendorStylePreference === 'siemens' ? 100 : 1"
              :max="20000"
              :disabled="complete || isAddLocalizerMode"
              @input="onBandwidthChangedByUser"
            />
          </div>
          <b-tooltip
            v-if="isUltraLab && vendorStylePreference === 'siemens'"
            :target="'tooltip-receiver-bandwidth' + selectionIdent"
            triggers="hover"
          >
            {{ 'Fat/Water Shift ' + receiverBandwidthTooltip + ' pxl' }}
          </b-tooltip>
          <span class="mx-2">(Hz/px)</span>
        </div>

        <div v-if="selectionConfig.sequenceType !== 'DIFF' && selectionConfig.sequenceType !== 'GRE'" class="text-1">
          <label class="label-size inactive-label">Define</label>
          <v-select
            v-model="defineOption"
            :items="defineOptions"
            color="#423c3c"
            dense
            outlined
            style="width: 11.5vw; margin-left: 2%"
          ></v-select>
        </div>

        <div v-if="selectionConfig.sequenceType !== 'DIFF' && selectionConfig.sequenceType !== 'GRE'" class="text-1">
          <label class="label-size inactive-label">Echo Trains Per Slice</label>
          <div class="text-input">
            <SpinButton :type="'number'" :value="echoTrainsPerSlice" :step="1" :max="200" :min="1" :disabled="true" />
          </div>
        </div>
        <div class="text-1">
          <label class="label-size inactive-label">Asymmetric Echo</label>
          <v-select
            v-model="asymmetricEcho"
            :items="asymmetricEchoOptions"
            dense
            outlined
            color="#423c3c"
            style="width: 11.5vw; max-width: 45.2%; margin-left: 2%"
          ></v-select>
        </div>
        <div class="text-1">
          <label class="label-size inactive-label">Optimization</label>
          <v-select
            v-model="Optimization"
            :items="OptimizationOptions"
            dense
            outlined
            color="#423c3c"
            style="width: 11.5vw; max-width: 45.2%; margin-left: 2%"
          ></v-select>
        </div>
        <div v-if="selectionConfig.sequenceType !== 'DIFF' && selectionConfig.sequenceType !== 'GRE'" class="text-1">
          <label
            class="label-size"
            :class="{ 'active-label': activeInputs.echoTrainLength, 'inactive-label': !activeInputs.echoTrainLength }"
          >
            Turbo Factor
          </label>
          <div class="text-input">
            <SpinButton
              :step="1"
              :min="1"
              :max="512"
              :value="echoTrainLength"
              v-model.number="echoTrainLength"
              @input="changeSpin($event, 'echoTrainLength')"
            />
          </div>
        </div>
        <div v-if="selectionConfig.sequenceType !== 'GRE'" class="text-1">
          <label
            class="label-size"
            :class="{ 'active-label': activeInputs.echoSpacing, 'inactive-label': !activeInputs.echoSpacing }"
          >
            {{ labels.timeBetweenEchoes[vendorStylePreference.trim()] }}
          </label>
          <div class="text-input">
            <SpinButton
              :type="'number'"
              :value="echoSpacing"
              :label="labels.timeBetweenEchoes[vendorStylePreference.trim()] + '(ms)'"
              :max="1000"
              :min="0"
              dense
              solo
              disabled
            />
          </div>
        </div>
      </div>
    </div>
    <!--
    <div class="disabled-div">
      <div class="text-3 minTeCon input-group">
        <label class="label-size" style="color: white">Min.TR/Conc</label>
        <div class="text-input">
          <SpinButton
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
      <div class="text-3 minTeCon mt-0 input-group">
        <label class="label-size" style="color: white">Min. Seq. TR</label>
        <div class="text-input">
          <SpinButton :type="'number'" :step="1" :min="1" :max="500" :value="minSeqTr" disabled class="spin-btn-grp" />
        </div>
      </div>
      <div v-if="selectionConfig.sequenceType === 'DIFF'" class="text-3 minTeCon mt-0 input-group">
        <label class="label-size" style="color: white">{{ $t('SelectionConfigForm.min_seq_te') }}</label>
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
    </div>
    -->
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
      <v-col v-if="isUltraLab || isContrastLab" class="disabled-div" style="margin-left: auto; margin-right: 20px">
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
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import { MriMixin } from '../Mixins/MriMixin.js'
import SpinButton from './SpinButton.vue'
import { mapState, mapActions, mapGetters } from 'vuex'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  mixins: [MriMixin, SelectionConfigMixin],
  name: 'SequencePartone',
  components: { SpinButton },
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
    shouldPausePopup: {
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
  },
  data() {
    return {
      dimensionValue: '2D',
      dimensionOptions: ['2D', '3D'],

      RFpulsetypeValue: 'Fast',
      RFpulsetypeOptions: ['Fast', 'Normal', 'Low SAR'],

      gradientModeValue: 'Fast',
      gradientModeOptions: ['Fast', 'Normal', 'Whisper'],

      flowCompensationValue: 'Off',
      flowCompensationOptions: ['Off', 'Slice', 'Read'],
      //turboFactor: 1,
      bandwidth: 0,
      defineOptions: ['Turbo Factor', 'Echo Trains'],
      defineOption: 'Turbo Factor',
      asymmetricEcho: 'Off',
      asymmetricEchoOptions: ['Off', 'Allowed'],
      Optimization: 'None',
      OptimizationOptions: ['None', '<Min.TE>', 'In Phase', 'Opposed Phase', 'Equidistant'],
      Excitation: 'Non-sel.',
      ExcitationOptions: ['Slab-sel.', 'Slab-sel. PE', 'Non-sel.'],
      //echoTrainsPerSlice: 1,
    }
  },
  beforeMount() {},
  mounted() {
    //this.updateSequenceType(this.selectionConfig.sequenceType)
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    //...mapActions('dataToParent', ['updateScanTime', 'updateSequenceType']),
    ...mapActions('dataToParent', ['updateSequenceType']),
    /*
    handleSequenceType(event) {
      this.updateSequenceType(event)
      // this.submitActualSequenceType(event)
      this.changeSequenceType(event)
    },

    updateEchoTrainLength(value) {
      this.$store.dispatch('scanTimeConfig/updateEchoTrainLength', value)
    },

    // Method to update vendor style preference
    updateVendorStylePreference(value) {
      this.$store.dispatch('scanTimeConfig/updateVendorStylePreference', value)
    },
    */

    // Method to update selection ident
    // updateSequenceType(value) {
    //   this.$store.dispatch('scanTimeConfig/updateSequenceType', value)
    // },
  },
  watch: {
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
    'selectionConfig.sequenceType'(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('selectionConfig.sequenceType==========', newVal)

        this.changeSequenceType(newVal)
        this.updateSequenceType(newVal)
      }
    },

    echoTrainLength(newVal, oldVal) {
      if (newVal !== oldVal) {
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
    */
    echoTrainsPerSlice() {
      return Math.ceil(this.phaseEncodingLines / this.echoTrainLength)
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
  },
}
</script>

<style scoped>
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

.text-3 {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 3px;
}
/* dropdown background style */

.input-group {
  display: flex;
  justify-content: space-between;
}

.input-group label {
  color: #ccc;
  font-size: 14px;
  flex: 1;
}

.theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 2px 3px;
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
.text-input {
  max-width: 46%;
  width: 42.6%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1.8rem !important;
  border-bottom: none;
  margin-top: 5px !important;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
  border-radius: 4px;
}

label,
span {
  font-size: 90%;
  margin-bottom: 0px !important;
  margin-top: 8px !important;
}

::v-deep .v-text-field__details {
  display: none;
}

.v-input--is-focused {
  display: block !important;
}

::v-deep .v-input__icon {
  height: 10px !important;
}

.text-1 {
  display: flex;
  justify-content: flex-start;
}

::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
}

::v-deep .v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-text-field.v-text-field--enclosed .v-text-field__details {
  margin-bottom: 0px;
}

.v-text-field {
  padding-top: 0px;
  margin-top: 0px;
}

::v-deep .v-text-field__slot {
  background: #383535;
  border-color: #383535;
  border-radius: 0px;
}

::v-deep .v-card__title {
  padding: 0px;
  padding-left: 20px;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0px;
}

/*
::v-deep .v-icon.v-icon {
  color: white !important;
}
*/

.v-input {
  max-width: 45.2%;
}

::v-deep .v-text-field input {
  padding: 0px;
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

.main-1 {
  display: flex;
  justify-content: space-around;
  width: 100%;
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

::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 2px 3px;
}

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}

/* Disabled Div */
.disabled-div {
  background-color: #444; /* Background color to make it look disabled */
  padding: 15px;
  border: 1px solid #555; /* Subtle border */
  border-radius: 5px;
  max-width: 400px;
  margin: auto;
  height: 34%;
  opacity: 0.5; /* Makes it look disabled */
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

.active-label {
  color: white; /* White color for active state */
}
.minTeCon {
  margin-top: 10%;
  justify-content: flex-end;
  margin-right: 15%;
}
.inactive-label {
  color: grey; /* Grey color for inactive state */
}
@media (min-width: 1400px) and (max-width: 2490px) {
  .minTeCon {
    margin-top: 2%;
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
    justify-content: flex-end;
  }
  ::v-deep .sp-btn-updown {
    width: 134%;
  }
  ::v-deep .sp-btn-updown .sp-btn-grp {
    width: 100%;
  }
  label, span {
    font-size: 120%;
    margin-bottom: 0 !important;
  }
  .text-3 {
    margin-bottom: 6px;
  }
  ::v-deep .v-input__slot fieldset {
    height: 2.5rem !important;
    width: 180px !important;
  }
  ::v-deep .v-select__selections {
    min-width: 80%;
    font-size: 18px !important;
  }
  ::v-deep .fat-water-contrast .v-select__selections {
    min-width: 66% !important;
  }
  .text-1 {
    margin-bottom: 10px;
  }
}

/* UPDATED BY ME*/
::v-deep .v-input__slot fieldset {
  height: 35px !important;
}

::v-deep .spin-btn-grp {
  height: 28px !important;
}

::v-deep .spin-btn button {
  height: 12px !important;
}

::v-deep .spin-btn {
  margin-right: 4px;
}
/* END */

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #F2A14A !important;
}
</style>
