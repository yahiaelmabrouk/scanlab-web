<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-card-text>
      <div class="main-1">
        <div class="main-2">
          <div class="text-3">
            <label class="label-size inactive-label">Image Filter</label>
            <checkbox v-model="ImageFilter" label="Custom Checkbox" />
          </div>
          <div>
            <div class="text-3">
              <label class="label-size inactive-label">Distortion Corr. </label>
              <checkbox v-model="Distortion" label="Custom Checkbox" />
            </div>
            <div class="text-2">
              <label class="label-size-1 inactive-label">Mode</label>
              <v-select
                v-model="modeSelectedValue"
                :items="modeOptions"
                color="#423c3c"
                dense
                outlined
                style="width: 15.5vw; max-width: 33%; margin-left: 2%"
              ></v-select>
            </div>

            <div class="text-3">
              <label class="label-size inactive-label">Unfiltered Images</label>
              <checkbox v-model="Unfiltered" label="Custom Checkbox" />
            </div>
          </div>
        </div>

        <div class="main-2">
          <div class="text-3">
            <label class="label-size inactive-label">Prescan Normalize</label>
            <checkbox v-model="Prescan" label="Custom Checkbox" />
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">Normalize</label>
            <checkbox v-model="Normalize" label="Custom Checkbox" />
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">B1 filter</label>
            <checkbox v-model="B1filter" label="Custom Checkbox" />
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">Raw filter</label>
            <checkbox v-model="Rawfilter" label="Custom Checkbox" />
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">Eliptical filter</label>
            <div class="text-2">
              <checkbox v-model="Elipticalfilter" label="Custom Checkbox" style="margin-left: 36%" />

              <v-btn class="btn-2">...</v-btn>
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
import BspinButton from './BspinButton.vue'
import { MriMixin } from '../../Mixins/MriMixin'
import checkbox from './CustomCheckbox.vue'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  components: { BspinButton, checkbox },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      modeSelectedValue: '2D',
      modeOptions: ['2D', '3D'],
      ImageFilter: false,
      Distortion: false,
      Unfiltered: false,
      Prescan: false,
      Normalize: false,
      B1filter: false,
      Rawfilter: false,
      Elipticalfilter: false,
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
  },
}
</script>
<style scoped>
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 39%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 10%;
  border: 2px solid black;
}
.custom-checkbox {
  .v-input--selection-controls__input {
    background-color: your_desired_background_color !important; /* Change this to your desired background color */
  }

  .v-input--selection-controls__input:checked {
    background-color: your_checked_background_color !important; /* Change this if you want a different checked background color */
  }

  .v-input--selection-controls__input:after {
    background-color: black !important; /* This changes the checkmark color to black */
  }
}
.v-btn {
  font-size: 11px !important;
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}
.label-size-1 {
  width: 47%;
  display: flex;
  justify-content: right;
}
::v-deep .v-text-field__details {
  display: none;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 32px;
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

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}
.text-3 {
  display: flex;
  justify-content: space-evenly;
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
  background: white;
  border-color: white !important;
  border-radius: 0px;
}
::v-deep .v-text-field__slot {
  border: 1px solidwhite !important;
  background: white;
  border-color: white;
  border-radius: 0px;
  height: 1rem;
  border-bottom: none;
  border-radius: 0px;
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
  background: #c0c0c0 !important;
  border-radius: 0px;
  margin-left: 0.25rem;
  color: black !important;
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
  height: 24vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  height: 86%;
}
.v-sheet.v-card {
  border-radius: 0px;
}
::v-deep .v-input__append-inner {
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
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
    left: 40%;
    margin-top: 15%;
  }
}
</style>
