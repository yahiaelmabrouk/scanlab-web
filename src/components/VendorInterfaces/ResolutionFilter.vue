<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <div class="main-1 mt-4">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Raw Filter</label>

            <v-checkbox />
          </div>

          <div class="text-1">
            <label class="label-size inactive-label">Elliptical Filter</label>
            <v-checkbox />
          </div>
          <div class="text-2">
            <label class="label-size inactive-label">Distortion Correction</label>
            <div class="text-2">
              <v-select
                color="#423c3c"
                v-model="distortionCorrection"
                :items="distortionCorrectionOptions"
                dense
                outlined
                style="width: 9vw; max-width: 68%; margin-left: 3%"
              ></v-select>
              <div>
                <v-btn class="btn-2">...</v-btn>
              </div>
            </div>
          </div>
        </div>

        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Normalize</label>
            <div class="text-3">
              <v-select
                color="#423c3c"
                v-model="normalize"
                :items="normalizeOptions"
                dense
                outlined
                style="width: 200px; max-width: 68%; margin-left: 7%"
              ></v-select>
              <div>
                <v-btn class="btn-2">...</v-btn>
              </div>
            </div>
          </div>
          <div class="text-1 my-5">
            <label class="checkbox-size inactive-label">Image Filter</label>
            <v-checkbox />
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import SpinButton from './SpinButton.vue'
import { MriMixin } from '../Mixins/MriMixin.js'

export default {
  mixins: [MriMixin, SelectionConfigMixin],

  data() {
    return {
      distortionCorrection: '2D',
      distortionCorrectionOptions: ['Off', '2D', '3D'],
      normalize: 'Off',
      normalizeOptions: ['Off', 'Image Based', 'Prescan Norm', 'B1'],
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
    ...mapState('selectionConfig', ['isAddLocalizerMode']),
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
  },
  components: { SpinButton },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
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
::v-deep .main-1 .main-2 .text-2 label {
  width: 135px;
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
}

::v-deep .v-icon.v-icon {
  font-size: 17px;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}
.checkbox-size {
  display: flex;
  justify-content: left;
  width: 21%;
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
label {
  font-size: 70%;
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
::v-deep .v-input__icon {
  height: 10px !important;
}
.text-2 {
  display: flex;
}
.text-3 {
  display: flex;
  justify-content: flex-start;
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
::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 1rem;
  border-bottom: none;
  border-radius: 4px;
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
  width: 25px !important;
  height: 18px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #423c3c !important;
  margin: 0.35rem 0.15rem 0.15rem 0.15rem;
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
}

.main-2 {
  display: flex;
  flex-direction: column;
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
