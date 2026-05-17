<!-- eslint-disable vue/no-unused-components -->
<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <div class="main-1">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Adjustment Strategy</label>
            <v-select
              color="#423c3c"
              v-model="adjustmentStrategyValue"
              :items="adjustmentStrategyOptions"
              dense
              outlined
              style="width: 150px; margin-left: 2%"
              @change="updateAdjustmentStrategy"
            ></v-select>
          </div>

          <div class="text-1">
            <label class="label-size inactive-label">B0 Shim</label>
            <v-select
              color="#423c3c"
              v-model="B0ShimValue"
              :items="B0ShimOptions"
              dense
              outlined
              style="width: 150px; margin-left: 2%"
              @change="updateB0Shim"
            ></v-select>
          </div>
        </div>

        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Adjustments Tolerance</label>
            <v-select
              color="#423c3c"
              v-model="selectedTolerance"
              :items="toleranceOptions"
              @change="updateSelectedTolerance"
              dense
              outlined
              style="width: 150px; margin-left: 2%"
            ></v-select>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Confirm Frequency</label>
            <v-select
              color="#423c3c"
              v-model="selectedFrequency"
              :items="frequencyOptions"
              @change="updateSelectedFrequency"
              dense
              outlined
              style="width: 150px; margin-left: 2%"
            ></v-select>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Assume Silicone</label>
            <v-checkbox />
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import { MriMixin } from '../Mixins/MriMixin.js'
import _ from 'lodash'
import SpinButton from './SpinButton.vue'
export default {
  mixins: [MriMixin, SelectionConfigMixin],
  components: { SpinButton },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {}
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    ...mapActions('scanTimeConfig', [
      'updateAdjustmentStrategy',
      'updateB0Shim',
      'updateSelectedTolerance',
      'updateSelectedFrequency',
    ]),
    ...mapActions('dataToParent', ['updateScanTime']),
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

    ...mapState('scanTimeConfig', ['adjustmentStrategyValue', 'B0ShimValue', 'selectedTolerance', 'selectedFrequency']),
    ...mapGetters('scanTimeConfig', [
      'adjustmentStrategyOptions',
      'B0ShimOptions',
      'toleranceOptions',
      'frequencyOptions',
    ]),
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
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
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
  width: 18.75%;
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

::v-deep .v-icon.v-icon {
  font-size: 17px;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}
::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
  border-radius: 0px !important;
}
::v-deep .v-text-field__details {
  display: none;
}
::v-deep .v-input--selection-controls .v-input__slot {
  margin-left: 4px;
}
label {
  margin-top: 0.2rem !important;
  font-size: 90%;
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

.active-label {
  color: white; /* White color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}
</style>
