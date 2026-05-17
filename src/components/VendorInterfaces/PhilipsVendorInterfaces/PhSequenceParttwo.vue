<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <div class="main-1">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size">Introduction</label>
            <v-checkbox></v-checkbox>
          </div>

          <div class="text-1">
            <label class="label-size">Phase Correction</label>
            <v-select
              color="#423c3c"
              v-model="phaseCorrectionValue"
              :items="phaseCorrectionOptions"
              dense
              outlined
              style="width: 11.5vw; max-width: 35%; margin-left: 2%"
            ></v-select>
          </div>
          <div class="text-1">
            <label class="label-size">Compensate T2 Decay</label>
            <v-checkbox />
          </div>
          <div class="text-1">
            <label class="label-size">Fast Mode</label>
            <v-checkbox />
          </div>
        </div>

        <div class="main-2">
          <div class="text-1" v-if="softwareStylePreference === 'xa'">
            <label class="label-size">WARP</label>
            <v-checkbox v-model="isCheckboxChecked"></v-checkbox>
          </div>
          <div class="text-1" v-if="isCheckboxChecked && softwareStylePreference === 'xa'">
            <label class="label-size">VAT</label>
            <v-text-field
              type="number"
              variant="outlined"
              density="compact"
              style="max-width: 25%; margin-left: 2%"
            ></v-text-field>
          </div>
          <div class="text-1" v-if="isCheckboxChecked && softwareStylePreference === 'xa'">
            <label class="label-size">SEMAC</label>
            <v-text-field
              type="number"
              variant="outlined"
              density="compact"
              style="max-width: 25%; margin-left: 2%"
            ></v-text-field>
          </div>
          <div class="text-1">
            <label class="label-size">Red.EC Senstivity</label>
            <v-checkbox />
          </div>
          <div class="text-1">
            <label class="label-size">Acoustic Noise Reduction</label>
            <v-select color="#423c3c" dense outlined style="width: 11.5vw; max-width: 30%; margin-left: 2%"></v-select>
          </div>
          <div class="text-1">
            <label class="label-size"> Reduce Motion Sens.</label>
            <v-checkbox />
          </div>
          <div class="text-1">
            <label class="label-size">Motion Correction</label>
            <v-text-field
              type="number"
              variant="outlined"
              density="compact"
              style="max-width: 25%; margin-left: 2%"
            ></v-text-field>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import SpinButton from './PhSpinButton.vue'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  // eslint-disable-next-line vue/no-unused-components
  components: { SpinButton },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isCheckboxChecked: false,
      phaseCorrectionValue: 'Automatic',
      phaseCorrectionOptions: ['Automatic', 'Off', 'On'],
    }
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
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
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
  },
}
</script>

<style scoped>
.v-btn {
  font-size: 11px !important;
  background: black !important;
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
  font-size: 70%;
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

::v-deep .v-icon.v-icon {
  color: white !important;
}

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
</style>
