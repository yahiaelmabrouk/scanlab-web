<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div>
    <v-card color="rgb(46 44 44)" width="100%">
      <v-card-text>
        <div class="main-1" style="margin-right: 40px">
          <div class="main-2">
            <div class="text-3">
              <label class="label-size inactive-label">Slice group</label>
              <div :class="isCurrent ? 'text-input' : 'text-input'">
                <DropDownText
                  @input="changeSliceGroup"
                  :value="sliceGroup"
                  :type="'number'"
                  v-model.number="sliceGroup"
                  :step="1"
                  :min="1"
                  :max="300"
                  :disabled="complete || isAddLocalizerMode"
                />
              </div>
            </div>
            <div class="text-1 mt-1" style="justify-content: flex-start !important">
              <label class="label-size inactive-label">Position</label>
              <div class="text-2">
                <v-select
                  color="#423c3c"
                  dense
                  outlined
                  style="width: 200px; max-width: 75%"
                  :items="positionOptions"
                  v-model="selectedPosition"
                ></v-select>
                <div>
                  <v-btn class="btn-2">...</v-btn>
                </div>
              </div>
            </div>
            <div class="text-2">
              <label class="label-size active-label">Orientation</label>
              <div class="text-2">
                <v-menu>
                  <template #activator="{ on }">
                    <v-btn
                      :disabled="isAddLocalizerMode"
                      class="btn-4"
                      v-on="on"
                      dense
                      outlined
                      style="margin-left: 0.5rem"
                    >
                      {{ selectedValue }}
                      <v-icon small style="margin-left: 98px !important">mdi-menu-down</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      @click="
                        resetSelection({ index: 0, dirOnly: true })
                        selectedValue = 'axial'
                      "
                    >
                      <v-list-item-title>{{ $t('global.axial', languageCode) }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      @click="
                        resetSelection({ index: 1, dirOnly: true })
                        selectedValue = 'coronal'
                      "
                    >
                      <v-list-item-title>{{ $t('global.coronal', languageCode) }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      @click="
                        resetSelection({ index: 2, dirOnly: true })
                        selectedValue = 'saggital'
                      "
                    >
                      <v-list-item-title>{{ $t('global.sagittal', languageCode) }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <!-- <div>
                  <v-btn class="btn-2">...</v-btn>
                </div> -->
              </div>
            </div>
            <div class="text-2 mt-2">
              <label
                class="label-size"
                :class="{ 'active-label': activeInputs.phaseEncoding, 'inactive-label': !activeInputs.phaseEncoding }"
              >
                Phase Encoding Dir.
              </label>
              <div class="text-2">
                <v-btn class="btn-3 mx-2" @click="smartRotateSelectionConfigDir">Swap</v-btn>
                <!-- <div>
                  <v-btn class="btn-2">...</v-btn>
                </div> -->
              </div>
            </div>
            <div class="text-1">
              <label class="label-size inactive-label">AutoAlign.</label>
              <div class="text-2">
                <v-select
                  :disabled="isAddLocalizerMode"
                  color="#423c3c"
                  dense
                  outlined
                  :items="getAutoAlignOptions"
                  v-model="getSelectedAutoAlign"
                  @change="updateAutoalign"
                  style="width: 200px; max-width: 75%"
                ></v-select>
                <div>
                  <v-btn class="btn-2">...</v-btn>
                </div>
              </div>
            </div>
          </div>

          <div class="main-2">
            <div class="text-2">
              <label class="label-size inactive-label">Initial Position</label>
              <v-select
                color="#423c3c"
                v-model="initialPosition"
                :items="initialPositionOptions"
                dense
                outlined
                style="width: 14vw; max-width: 60%"
              ></v-select>
            </div>
            <div class="text-3">
              <label class="label-size inactive-label">L</label>
              <div class="text-input">
                <SpinButton
                  v-model="lValue"
                  :value="lValue"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :max="999"
                />
              </div>
              <span class="mx-2">mm</span>
            </div>
            <div class="text-3 mt-2">
              <label class="label-size inactive-label">A</label>
              <div class="text-input">
                <SpinButton
                  v-model="aValue"
                  :value="aValue"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :max="999"
                />
              </div>
              <span class="mx-2">mm</span>
            </div>
            <div class="text-3 mt-2">
              <label class="label-size inactive-label">H</label>
              <div class="text-input">
                <SpinButton
                  v-model="hValue"
                  :value="hValue"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :max="999"
                />
              </div>
              <span class="mx-2">mm</span>
            </div>

            <div class="text-2 mt-2">
              <label class="label-size inactive-label">Initial Orientation</label>
              <v-select
                color="#423c3c"
                v-model="initialOrientation"
                :items="initialOrientationOptions"
                dense
                outlined
                style="width: 14vw; max-width: 49%"
              ></v-select>
            </div>

            <div class="text-3 mt-2">
              <label class="label-size inactive-label">T C</label>
              <div class="text-input">
                <SpinButton
                  v-model="tcValue"
                  :value="tcValue"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :max="999"
                />
              </div>
            </div>

            <div class="text-3 mt-2">
              <label class="label-size inactive-label">S</label>
              <div class="text-input">
                <SpinButton
                  v-model="sValue"
                  :value="sValue"
                  type="number"
                  variant="outlined"
                  density="compact"
                  :max="999"
                />
              </div>
            </div>
            <div class="text-3 mt-2">
              <label class="label-size inactive-label">Initial Rotation</label>
              <div class="text-input">
                <SpinButton :value="0" type="number" variant="outlined" density="compact" :max="999" />
              </div>
              <span class="mx-2">deg</span>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import SpinButton from './SpinButton.vue'
import DropDownText from './DropDownText.vue'
import { MriMixin } from '../Mixins/MriMixin.js'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  mixins: [MriMixin, SelectionConfigMixin],
  name: 'GeometryAutoalign',
  // eslint-disable-next-line vue/no-unused-components
  components: { SpinButton, DropDownText },
  data() {
    return {
      selectedValue: 'Sagittal',
      sliceGroup: 1,

      initialPositionOptions: [
        'Auto',
        'Head First',
        'Feet First',
        'Left Lateral',
        'Right Lateral',
        'Prone',
        'Supine',
        'Trendelenburg',
        'Reverse Trendelenburg',
        'Custom',
      ],
      selectedPosition: 'L65.5 P125.8 H0.0',
      positionOptions: ['Isocenter', 'L65.5 P125.8 H0.0'],
      initialPosition: null,
      lValue: 0,
      aValue: 0,
      hValue: 0,
      tcValue: 0,
      sValue: 0,
      initialOrientationOptions: ['Axial', 'Coronal', 'Sagittal', 'Oblique', 'Custom'],
      initialOrientation: null,
    }
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    updateAutoalign(value) {
      this.$store.dispatch('scanTimeConfig/updateAutoalign', value)
    },
    changeSliceGroup(value) {
      this.sliceGroup = value
    },
    roundValue(val) {
      return Number.parseFloat(val).toFixed(2)
    },
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
    ...mapState('scanTimeConfig', ['selectedAutoAlign']),

    ...mapGetters('scanTimeConfig', ['getAutoAlignOptions', 'getSelectedAutoAlign']),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    activeInputs() {
      let labType = 'basic'
      if (this.isUltraLab) {
        labType = 'ultra'
      } else if (this.isContrastLab) {
        labType = 'contrast'
      } else if (this.isResolutionLab) {
        labType = 'resolution'
      }

      console.log('this lab type', labType)
      return activeLabelUtil(labType)
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
    lValue(val) {
      this.lValue = parseFloat(this.roundValue(val))
    },
    aValue(val) {
      this.aValue = parseFloat(this.roundValue(val))
    },
    hValue(val) {
      this.hValue = parseFloat(this.roundValue(val))
    },
    tcValue(val) {
      this.tcValue = parseFloat(this.roundValue(val))
    },
    sValue(val) {
      this.sValue = parseFloat(this.roundValue(val))
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

.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

.btn-3 {
  width: 160px !important;
  height: 20px !important;
  background: #423c3c !important;
  border-radius: 0px;
}

.btn-4 {
  display: flex;
  justify-content: flex-start;
  background: #383535 !important;
  padding: 0px 4px !important;
  width: 160px !important;
  height: 25px !important;
  box-shadow: none;
  border-radius: 0px;
  border: none !important;
  font-size: 10px !important;
  font-weight: inherit !important;
  text-transform: inherit !important;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 40px;
}

::v-deep .v-input__control fieldset {
  width: 160px !important;
}

::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
  border-radius: 0px !important;
}

label,
span {
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
  justify-content: flex-start;
}

.text-2 {
  display: flex;
  justify-content: flex-start;
}

.text-3 {
  display: flex;
}

::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
  width: 184px;
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
  font-size: 17px;
  height: 15px !important;
}

.v-input {
  max-width: 45%;
}

::v-deep .v-text-field input {
  padding: 0px;
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

::v-deep .v-text-field--outlined fieldset {
  bottom: 6px;
  left: 0.5rem;
  right: 10px;
}

.btn-2 {
  width: 20px !important;
  height: 20px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #423c3c !important;
  border-radius: 0px;
  margin-left: 0.25rem;
  margin-top: 5px;
}

.main-2 {
  color: white !important;
  width: 50%;
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

.text-input {
  max-width: 58%;
  width: 40%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1.8rem !important;
  border-bottom: none;
}

.active-label {
  color: white;
  /* White color for active state */
}

.inactive-label {
  color: grey;
  /* Grey color for inactive state */
}
</style>
