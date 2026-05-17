<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <div class="text-1">
        <label class="label-size inactive-label">Position</label>
        <v-select
          v-model="selectedPosition"
          :items="codes"
          color="#423c3c"
          dense
          outlined
          style="width: 11.5vw; max-width: 25.8%; margin-left: 2%"
        ></v-select>
        <div>
          <v-btn class="btn-2">...</v-btn>
        </div>
      </div>

      <div class="text-1">
        <label class="label-size active-label">Orientation</label>
        <v-select
          color="#423c3c"
          v-model="selectedValue"
          :items="selectableOptions"
          dense
          outlined
          style="width: 11.5vw; max-width: 25.8%; margin-left: 2%"
          @change="handleSelectionChange"
        ></v-select>
        <div>
          <v-btn class="btn-2">...</v-btn>
        </div>
      </div>
      <div class="text-1">
        <label class="label-size inactive-label">Rotation</label>
        <div class="text-input">
          <SpinButton v-model.number="rotationValue" :type="'number'" variant="outlined" density="compact" :max="999" />
        </div>
        <span class="mx-2">deg</span>
      </div>
      <div class="text-1">
        <label class="label-size inactive-label">A>>P</label>
        <div class="text-input">
          <SpinButton v-model.number="aToPValue" :type="'number'" variant="outlined" density="compact" :max="999" />
        </div>
        <span class="mx-2">mm</span>
      </div>
      <div class="text-1">
        <label class="label-size inactive-label">R>>L</label>
        <div class="text-input">
          <SpinButton v-model.number="rToLValue" :type="'number'" variant="outlined" density="compact" :max="999" />
        </div>
        <span class="mx-2">mm</span>
      </div>
      <div class="text-1">
        <label class="label-size inactive-label">F>>H</label>
        <div class="text-input">
          <SpinButton v-model.number="fToHValue" :type="'number'" variant="outlined" density="compact" :max="999" />
        </div>
        <span class="mx-2">mm</span>
      </div>
    </v-card-text>
  </v-card>
</template>
<script>
import { mapState, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import SpinButton from './SpinButton.vue'
// eslint-disable-next-line no-unused-vars
import _ from 'lodash'
import { MriMixin } from '../Mixins/MriMixin.js'
import DropDownText from './DropDownText.vue'

export default {
  mixins: [MriMixin, SelectionConfigMixin],
  // eslint-disable-next-line vue/no-unused-components
  components: { SpinButton, DropDownText },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      selectedValue: 'axial',
      rotationValue: 0.01,
      aToPValue: 220,
      rToLValue: 220,
      fToHValue: 161,
      selectableOptions: ['axial', 'coronal', 'sagittal'],
      selectedPosition: 'R00A00H00',
      codes: ['R00A00H00', 'R00A00H01', 'R00A00H02'],
    }
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    ...mapActions('dataToParent', ['updateScanTime']),
    handleSelectionChange(selectedOption) {
      // Call the resetSelection function with appropriate parameters
      this.resetSelection({ index: 0, dirOnly: true })
      // Set the selected value
      this.selectedValue = selectedOption
    },
    roundValue(val) {
      return Number.parseFloat(val).toFixed(2)
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
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
  },
  watch: {
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
    rotationValue(val) {
      this.rotationValue = parseFloat(this.roundValue(val))
    },
    aToPValue(val) {
      this.aToPValue = parseFloat(this.roundValue(val))
    },
    rToLValue(val) {
      this.rToLValue = parseFloat(this.roundValue(val))
    },
    fToHValue(val) {
      this.fToHValue = parseFloat(this.roundValue(val))
    },
  },
}
</script>

<style scoped>
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

/* dropdown background style */
.v-input--is-focused {
  display: block !important;
}

.label-size {
  width: 15%;
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
  height: 1.8rem !important;
  border-bottom: none;
  border-radius: 0px !important;
  margin-bottom: 10px;
}
label,
span {
  font-size: 90%;
}

label {
  margin-top: 5px;
}
::v-deep .v-text-field__details {
  display: none;
}
.text-input {
  margin-left: 2%;
  max-width: 35% !important;
  width: 27%;
}
/*
.text-input .spin-btn-grp {
  height: 30px;
} */
.text-1 {
  display: flex;
  color: white;
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
::v-deep .v-input__append-inner {
  margin-top: 15px !important;
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
::v-deep .v-input__control fieldset {
  height: 30px !important;
}
::v-deep .v-icon.v-icon {
  color: white !important;
  height: 16px !important;
}
.v-input {
  max-width: 45%;
}
::v-deep .v-text-field input {
  padding: 0px;
}

.btn-2 {
  width: 20px !important;
  height: 18px !important;
  padding: 0px !important;
  min-width: 16px !important;
  margin-top: 8px;
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
</style>
