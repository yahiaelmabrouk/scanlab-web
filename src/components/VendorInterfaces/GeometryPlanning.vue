<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <div class="main-1">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Set-n-Go Protocol</label>
            <v-checkbox />
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Table Position</label>
            <v-select
              color="#423c3c"
              dense
              outlined
              :items="tablePositionOptions"
              v-model="selectedTablePosition"
              class=""
              style="margin-left: 5px"
            ></v-select>
            <div class="text-input" style="margin-top: 5px; margin-left: 0">
              <SpinButton
                :type="'number'"
                v-model.number="tableNumbers"
                :value="tableNumbers"
                :step="1"
                :min="1"
                :max="100"
                :disabled="complete || isAddLocalizerMode"
              />
              <span class="unit-text">mm</span>
            </div>
          </div>
        </div>

        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Inline Composing</label>
            <v-checkbox />
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import SpinButton from './SpinButton.vue'
import { MriMixin } from '../Mixins/MriMixin.js'

export default {
  mixins: [MriMixin, SelectionConfigMixin],
  data() {
    return {
      selectedTablePosition: 'F',
      tablePositionOptions: ['F', 'H'],
      tableNumbers: 1,
    }
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
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
  /* color: rgb(0 0 0 / 87%); */
}

.theme--light.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: rgb(255 255 255 / 87%);
}
::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
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
}

.TRTEwidth {
  width: 38%;
}

.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
  font-size: 15px;
}

.theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

.text-input {
  max-width: 20%; /* Adjusted width */
  width: 20%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1.8rem !important;
  border-bottom: none;
  display: flex;
  align-items: center;
}

.unit-text {
  color: white;
  margin-left: 5px;
  font-size: 12px;
}

::v-deep .v-icon.v-icon {
  font-size: 17px;
  height: 13px;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0%;
}

label,
span {
  font-size: 70%;
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

.v-input--is-focused {
  display: block !important;
}
label {
  margin-top: 0.5rem !important;
}
.text-1 {
  display: flex;
  color: white !important;
  justify-content: flex-start;
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

::v-deep .v-input__slot {
  margin-bottom: 0px;
}

::v-deep .v-text-field.v-text-field--enclosed .v-text-field__details {
  margin-bottom: 0px;
}

::v-deep .v-text-field {
  padding-top: 0px;
  margin-top: 0px !important;
}
::v-deep .v-input--selection-controls__input {
  margin-top: 13px !important;
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

::v-deep .v-input__icon {
  height: 10px !important;
}

::v-deep .v-text-field__details {
  display: none;
}
::v-deep .v-select__selections {
  padding-top: 10px !important;
  color: #ffffff !important;
}
.v-input {
  max-width: 25%;
}
::v-deep .v-input fieldset {
  height: 34px;
}
::v-deep .v-text-field input {
  padding: 0px;
}

::v-deep .v-input__control .v-input__slot .v-select__slot .v-input__append-inner {
  margin-top: 15px !important;
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
  display: flex;
  flex-direction: column;
  color: white !important;
  width: 50%;
}

.main-3 {
  height: 70%;
  display: flex;
  flex-direction: column;
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
::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin: 0;
}
/* Responsive CSS */
@media (max-width: 1200px) {
  .text-input {
    max-width: 48%;
    width: 48%;
  }
  .label-size {
    width: 45%;
  }
  .v-input {
    max-width: 55%;
  }
  .main-1 {
    flex-direction: column;
    height: auto;
  }
  .main-2,
  .main-3 {
    width: 100%;
    justify-content: space-evenly;
  }
}

@media (max-width: 768px) {
  .text-input {
    max-width: 60%;
    width: 60%;
  }
  .label-size {
    width: 50%;
  }
  .v-input {
    max-width: 70%;
  }
  .main-1 {
    flex-direction: column;
  }
  .text-1 {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .text-input {
    max-width: 80%;
    width: 80%;
  }
  .label-size {
    width: 60%;
  }
  .v-input {
    max-width: 90%;
  }
  .text-1 {
    flex-direction: column;
    justify-content: center;
    text-align: left;
  }
  .main-1 {
    flex-direction: column;
    height: auto;
    justify-content: center;
  }
}

.active-label {
  color: white; /* White color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}
</style>
