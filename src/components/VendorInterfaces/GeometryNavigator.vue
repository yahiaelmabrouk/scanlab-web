<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <div class="text-1">
        <label class="label-size inactive-label">Navigator</label>
        <div class="text-input">
          <DropDownText
            @input="changeNavigator"
            :value="navigator"
            :type="'number'"
            v-model.number="navigator"
            :step="1"
            :min="1"
            :max="300"
            :typeofcomponent="'true'"
            :disabled="true"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import SpinButton from './SpinButton.vue'
import DropDownText from './DropDownText.vue'
import { MriMixin } from '../Mixins/MriMixin.js'

export default {
  mixins: [MriMixin, SelectionConfigMixin],
  name: 'GeometryNavigator',
  components: { SpinButton, DropDownText },
  data() {
    return {
      navigator: 0,
    }
  },

  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    ...mapActions('dataToParent', ['updateScanTime']),
    changeNavigator(value) {
      this.navigator = value
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
::v-deep .v-text-field {
  width: 250px !important;
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
label {
  font-size: 70%;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}
::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 2rem !important;
  border-bottom: none;
  border-radius: 0px !important;
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
.text-2 {
  display: flex;
}
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
  font-size: 17px !important;
  height: 30px !important;
}
.v-input {
  max-width: 45%;
}
::v-deep .v-text-field input {
  padding: 0px;
}
.btn-2 {
  width: 20px !important;
  height: 15px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #423c3c !important;
  margin: 0.15rem;
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
::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
}
/* ::v-deep .theme--light.v-input,
.theme--light.v-input input,
.theme--light.v-input textarea {
  color: #ffffff !important;
} */
::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}
.text-input {
  max-width: 38%;
  width: 19%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 2rem !important;
  border-bottom: none;
}

.active-label {
  color: white; /* White color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}
</style>
