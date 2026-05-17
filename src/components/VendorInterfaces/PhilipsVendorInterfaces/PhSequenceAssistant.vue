<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <div class="text-1">
        <label class="label-size">SAR Assistant</label>
        <v-select
          color="#423c3c"
          v-model="selectedSARAssistant"
          :items="sarAssistantOptions"
          dense
          outlined
          style="width: 11.5vw; max-width: 20%; margin-left: 2%"
        ></v-select>
      </div>
      <div class="text-1" v-if="selectedSARAssistant === 'Flip Angle' || selectedSARAssistant === 'TR Then Flip Angle'">
        <label class="label-size">Min. Allowed Flip Angle</label>
        <div class="text-input">
          <SpinButton :type="'number'" v-model.number="flipAngle" :step="1" :min="1" :max="2000" />
        </div>
      </div>
      <div class="text-1" v-if="selectedSARAssistant === 'TR' || selectedSARAssistant === 'TR Then Flip Angle'">
        <label class="label-size">Max. Allowed TR</label>
        <div class="text-input">
          <SpinButton :type="'number'" v-model.number="repetitionTime" :step="1" :min="1" :max="20000" />
        </div>
      </div>
      <div class="text-1">
        <label class="label-size">Allowed Delay</label>

        <v-text-field
          v-model="allowedDelay"
          type="number"
          variant="outlined"
          density="compact"
          style="max-width: 19%; margin-left: 2%"
        ></v-text-field
        ><span class="mx-2">s</span>
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

  data() {
    return {
      selectedSARAssistant: '',
      repetitionTime: 2500,
      flipAngle: 130,
      allowedDelay: 60,
      sarAssistantOptions: ['TR', 'Flip Angle', 'TR Then Flip Angle', 'Flip Angle Then TR'],
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
  components: { SpinButton },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
}
</script>

<style scoped>
/* Component style */
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

.text-3 {
  display: flex;
}

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}

::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

.label-size {
  width: 20%;
  display: flex;
  justify-content: right;
}

.text-input {
  max-width: 38%;
  width: 38%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 25px !important;
  border-bottom: none;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

::v-deep .v-text-field__details {
  display: none;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

label,
span {
  font-size: 70%;
}

.v-input--is-focused {
  display: block !important;
}

.text-1 {
  display: flex;
  color: white;
}

/* ::v-deep .v-input--dense>.v-input__control>.v-input__slot {
    margin-bottom: 0px;
} */

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
  font-size: 17px;
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
  color: white !important;
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

/* Parent style */
.btn-3 {
  width: 50px !important;
  height: 20px !important;
  background: #423c3c !important;
  border-radius: 0px;
}

.btn-4 {
  display: flex;
  justify-content: flex-end;
  background: #383535 !important;
  padding: 0px 4px !important;
  width: 80px !important;
  height: 16px !important;
  box-shadow: none;
  border-radius: 0px;
  border: none !important;
  font-size: 10px !important;
  font-weight: inherit !important;
  text-transform: inherit !important;
}
</style>
