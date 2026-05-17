<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <div class="main-1 mr-10">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Coil Selection</label>
            <v-select
              color="#423c3c"
              v-model="coilSelectedValue"
              :items="coilSelectionOptions"
              dense
              outlined
              style="width: 11.5vw; max-width: 51%; margin-left: 2%"
            ></v-select>
            <div>
              <v-btn class="btn-2">...</v-btn>
            </div>
          </div>

          <div class="text-1">
            <label class="label-size inactive-label">Radial Sorting</label>
            <v-checkbox />
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">MSMA</label>
            <v-select
              color="#423c3c"
              v-model="MSMAVavlue"
              :items="MSMA"
              dense
              outlined
              style="width: 12.5vw; max-width: 51%; margin-left: 2%"
            ></v-select>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Sagittal</label>
            <v-select
              color="#423c3c"
              v-model="sagValue"
              :items="sag"
              dense
              outlined
              style="width: 12.5vw; max-width: 51%; margin-left: 2%"
            ></v-select>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Coronal</label>
            <v-select
              color="#423c3c"
              v-model="coronalValue"
              :items="coronal"
              dense
              outlined
              style="width: 12.5vw; max-width: 51%; margin-left: 2%"
            ></v-select>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Transversal</label>
            <v-select
              color="#423c3c"
              v-model="transversaValue"
              :items="transversa"
              dense
              outlined
              style="width: 12.5vw; max-width: 51%; margin-left: 2%"
            ></v-select>
          </div>
        </div>

        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Coil Combination</label>
            <v-select
              color="#423c3c"
              v-model="coilCombinationValue"
              :items="coilCombination"
              dense
              outlined
              style="width: 11.5vw; max-width: 51%; margin-left: 2%"
            ></v-select>
            <div>
              <v-btn class="btn-2">...</v-btn>
            </div>
          </div>
          <div class="text-1 my-5">
            <label class="label-size inactive-label">Matrix Optimization</label>
            <v-select
              color="#423c3c"
              v-model="matrixOptValue"
              :items="matrixOpt"
              dense
              outlined
              style="width: 12.5vw; max-width: 51%; margin-left: 2%"
            ></v-select>
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
      coilSelectedValue: 'Auto Coil Select',
      MSMAVavlue: 'S>T>C',
      sagValue: 'L>R',
      coronalValue: 'A>P',
      transversaValue: 'H>F',
      coilSelectionOptions: ['ACS Restricted', 'ACS All but spine', 'Auto Coil Select', 'Manual'],
      MSMA: ['S>T>C', 'T>S>C', 'C>T>S'],
      sag: ['R>L', 'L>R'],
      coronal: ['A>P', 'P>A'],
      transversa: ['H>F', 'F>H'],
      coilCombinationValue: 'Adaptive Combine',
      coilCombination: ['Adaptive Combine', 'Sum of Squares'],
      matrixOptValue: 'Off',
      matrixOpt: ['Off', 'Performance', 'Cardio'],
    }
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
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
::v-deep .v-input__slot .v-input--selection-controls__input {
  margin-left: 8px;
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

::v-deep .v-icon.v-icon {
  font-size: 17px;
}
label {
  font-size: 90%;
  margin-top: 0.2rem !important;
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
  border-radius: 0px !important;
}
::v-deep .v-text-field__details {
  display: none;
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
  align-items: end !important;
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
  margin-top: 6px;
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
  width: 45%;
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
