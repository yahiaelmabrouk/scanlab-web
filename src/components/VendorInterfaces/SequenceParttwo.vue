<template>
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
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Introduction</label>
            <v-checkbox></v-checkbox>
          </div>

          <div class="text-1">
            <label class="label-size inactive-label">Phase Correction</label>
            <v-select
              color="#423c3c"
              v-model="phaseCorrectionValue"
              :items="phaseCorrectionOptions"
              dense
              outlined
              style="width: 11.5vw; max-width: 35%; margin-left: 5px"
            ></v-select>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Compensate T2 Decay</label>
            <v-checkbox />
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Fast Mode</label>
            <v-checkbox />
          </div>
        </div>

        <div class="main-2">
          <div class="text-1" v-if="softwareVersionPreference === 'xa'">
            <label class="label-size inactive-label">WARP</label>
            <v-checkbox v-model="isCheckboxChecked"></v-checkbox>
          </div>
          <div class="text-1" v-if="isCheckboxChecked && softwareVersionPreference === 'xa'">
            <label class="label-size inactive-label">VAT</label>
            <v-text-field
              type="number"
              variant="outlined"
              density="compact"
              value="40"
              style="max-width: 28%; margin-left: 5px"
            ></v-text-field>
            <label
              class="label-size inactive-label"
              style="justify-content: start !important; margin-top: 0px !important; margin-left: 5px; width: 20%"
              >%</label
            >
          </div>
          <div class="text-1" v-if="isCheckboxChecked && softwareVersionPreference === 'xa'">
            <label class="label-size inactive-label">SEMAC</label>
            <v-text-field
              type="number"
              value="0"
              variant="outlined"
              density="compact"
              style="max-width: 28%; margin-left: 5px"
            ></v-text-field>
            <label
              class="label-size inactive-label"
              style="justify-content: start !important; margin-top: 0px !important; margin-left: 5px; width: 20%"
              >%</label
            >
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Red.EC Senstivity</label>
            <v-checkbox />
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Acoustic Noise Reduction</label>
            <v-select
              v-model="selectedAcousticNoiseReduction"
              :items="acousticNoiseReduction"
              color="#423c3c"
              dense
              outlined
              style="width: 11.5vw; max-width: 30%; margin-left: 5px"
            ></v-select>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label"> Reduce Motion Sens.</label>
            <v-checkbox />
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Motion Correction</label>
            <v-select
              v-model="selectedMotionCrr"
              :items="MotionCrr"
              color="#423c3c"
              dense
              outlined
              style="width: 11.5vw; max-width: 30%; margin-left: 5px"
            ></v-select>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin'
import { MriMixin } from '../Mixins/MriMixin.js'
import SpinButton from './SpinButton.vue'
import _ from 'lodash'
export default {
  mixins: [MriMixin, SelectionConfigMixin],
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
  },
  data() {
    return {
      isCheckboxChecked: false,
      phaseCorrectionValue: 'Automatic',
      phaseCorrectionOptions: ['Automatic', 'Off', 'On'],
      selectedAcousticNoiseReduction: 'Off',
      acousticNoiseReduction: ['Off', 'On'],
      selectedMotionCrr: 'Off',
      MotionCrr: ['Off', 'On'],
    }
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    ...mapActions('scanTimeConfig', [
      'updateEchoTrainLength',
      'updateCheckboxChecked',
      'updatePhaseCorrectionValue',
      'updateAcousticNoiseReduction',
      'updateMotionCorrection',
    ]),
    ...mapActions('dataToParent', ['updateScanTime']),
  },
  computed: {
    ...mapGetters('user', ['softwareVendorPreference', 'softwareVersionPreference']),
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
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    /*
    ...mapGetters('scanTimeConfig', [
      'isCheckboxChecked',
      'phaseCorrectionValue',
      'selectedAcousticNoiseReduction',
      'selectedMotionCrr',
    ]),
    */
  },
  mounted() {},
  watch: {
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
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

::v-deep .v-icon.v-icon {
  font-size: 17px;
}

.label-size {
  width: 44%;
  display: flex;
  justify-content: right;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
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

::v-deep .v-text-field__details {
  display: none;
}

label {
  font-size: 90%;
  margin-bottom: 0px !important;
  margin-top: 5px !important;
}

.v-input--is-focused {
  display: block !important;
}

.text-1 {
  display: flex;
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

::v-deep .v-text-field__slot {
  background: #383535;
  border-color: #383535;
  border-radius: 0px;
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
  max-width: 45%;
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

::v-deep .v-input__icon {
  height: 10px !important;
}

.main-1 {
  display: flex;
  justify-content: space-around;
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
}

.v-sheet.v-card {
  border-radius: 0px;
}

::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}

::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}

.active-label {
  color: white; /* White color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

/* UPDATED BY ME*/
::v-deep .v-input--selection-controls .v-input__slot {
  margin-bottom: 5px !important;
  margin-top: 5px !important;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot > .v-text-field__slot {
  height: 25px !important;
}
/* END */

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #F2A14A !important;
}
</style>
