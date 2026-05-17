<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-card-text>
      <div style="display: flex; flex-direction: column">
        <div class="main-1">
          <div class="main-2">
            <div class="text-1 mt-12">
              <label class="label-size inactive-label">Saturation Mode</label>
              <v-select
                v-model="selectedOption"
                :items="options"
                color="#423c3c"
                dense
                outlined
                style="width: 10.5vw; max-width: 55%"
                disabled
                class="disabledClass border border-dark ml-2"
              />
            </div>
            <div class="text-1">
              <label class="label-size-1 inactive-label">Sat. region</label>
              <div class="text-2 ml-2">
                <DropDownText
                  @input="changeSaturation"
                  :value="saturation"
                  type="number"
                  v-model.number="saturation"
                  :step="1"
                  :min="0"
                  :max="2"
                  :disabled="isButtonDisabled || !mayAddSatBand"
                  class="disabledClass"
                />
              </div>
            </div>
            <div class="main-1 pt-2 pr-20">
              <div class="text-1">
                <div>
                  <v-row v-if="selectedInteractableState || satBands.length > 0">
                    <InteractableForm class="mt-3 p-2" />
                  </v-row>
                  <v-row v-else-if="isEditingQuestion && !isAddLocalizerMode">
                    <SatBandAreaEditor v-if="visibleSatBand" />
                  </v-row>
                </div>
              </div>
            </div>
          </div>
          <div class="main-4">
            <div class="text-1 my-2 mt-12">
              <label
                class="label-size"
                :class="{ 'active-label': activeInputs.fatSuppression, 'inactive-label': !activeInputs.fatSuppression }"
              >
                Fat suppr.
              </label>
              <v-select
                :items="fatSuppressionOptions"
                v-model="selectedFatOption"
                color="#423c3c"
                dense
                outlined
                style="width: 150px; margin-left: 2%"
              ></v-select>
            </div>
            <div class="text-1">
              <label class="label-size inactive-label">Water suppr. </label>
              <v-select
                :items="waterSuppressionOptions"
                v-model="selectedWaterOption"
                color="#423c3c"
                dense
                outlined
                style="width: 150px; margin-left: 2%"
              ></v-select>
            </div>
            <div class="text-1" style="margin-top: 4rem">
              <label class="label-size inactive-label">Special sat. </label>
              <v-select
                color="#423c3c"
                :items="specialSatOptions"
                v-model="selectedSpecialOption"
                dense
                outlined
                style="width: 150px"
                disabled
                class="disabledClass border border-dark"
              ></v-select>
            </div>
          </div>
        </div>
      </div>
      <!-- <v-row class="justify-end" v-if="!isTakingTest">
        <v-col cols="2">
          <div class="text-left">
            <label>SNR Average</label>
            <div class="d-flex align-items-center">
              <b-form-input
                :type="'text'"
                :value="selectionConfig.snr !== null ? selectionConfig.snr.toFixed(2) : '---'"
                disabled
                class="input-number"
                style="flex: 1; min-width: 4em"
              />
              <div class="d-flex flex-column ml-0">
                <v-btn
                  icon
                  small
                  class="snr-icon-btn"
                  @click="fetchSignalAverage"
                  :disabled="isFetchingSignalAverage"
                  title="Refresh SNR average"
                >
                  <v-icon small>{{ isFetchingSignalAverage ? 'mdi-loading mdi-spin' : 'mdi-refresh' }}</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  class="snr-icon-btn"
                  @click="saveSNR"
                  :disabled="selectionConfig.snr === null"
                  title="Save current SNR for comparison"
                >
                  <v-icon small>mdi-content-save</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-col>
        <v-col cols="2">
          <div class="ms-auto me-7 text-left">
            <label>Saved SNR</label>
            <div class="d-flex align-items-center mt-2">
              <b-form-input
                :type="'text'"
                :value="savedSnr !== null ? savedSnr.toFixed(2) : '---'"
                disabled
                class="input-number"
                style="flex: 1"
              />
            </div>
          </div>
        </v-col>
      </v-row> -->
      <!-- <div class="main-1">
            <div class="bottom-card"></div>
          </div> -->
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from './BspinButton.vue'
import DropDownText from '../SatDrop-b19.vue'
import InteractableForm from '@/components/InteractableForm'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'
import EventBus from '@/lib/event-bus'
export default {
  name: 'BgeometrySaturation',
  mixins: [SelectionConfigMixin],
  // eslint-disable-next-line vue/no-unused-components
  components: { BspinButton, DropDownText, InteractableForm },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    sequenceType: {
      type: String,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
    shouldPausePopup: {
      type: Boolean,
      required: false,
      default: true,
    },
    useInitialUltraLabDefaults: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data() {
    return {
      number: 1,
      items: ['None', 'None-Sel IR'],
      options: ['Standard', 'Fat Suppression'],
      selectedOption: 'Standard',
      selectedFatOption: 'None',
      selectedWaterOption: 'None',
      fatSuppressionOptions: ['None', 'Fat Sat.', 'SPAIR'],
      waterSuppressionOptions: ['None', 'Water Sat.'],
      specialSatOptions: ['None'],
      selectedSpecialOption: 'None',
      saturation: 0,
    }
  },
  mounted() {
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
    }),
      // (this.selectedInteractableState = true)
      console.log('this.selectedInteractableState==============', this.selectedInteractableState)
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
      //'isAddLocalizerMode',
    ]),
    ...mapActions('interactableService', ['setSelectedInteractableIdent']),
    ...mapActions('dataToParent', ['updateScanTime']),
    updateSelectedInteractableIdent(ident) {
      this.setSelectedInteractableIdent(ident)
    },
    changeSaturation(value) {
      this.saturation = value
    },
  },
  computed: {
    ...mapState('selectionConfig', ['isAddLocalizerMode']),
    /*
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    */
    ...mapState({
      selectedInteractableIdent: (state) => state.interactableService.selectedInteractableIdent,
      isFullscreen: (state) => state.selectionConfig.isFullscreen,
      //isAddLocalizerMode: (state) => state.selectionConfig.isAddLocalizerMode,
      toolSelected: (state) => state.selectionConfig.toolSelected,
      toolSelectedConfig: (state) => state.selectionConfig.toolSelectedConfig,
      showReferenceLines: (state) => state.selectionConfig.showReferenceLines,
      referenceSliceCornersBySliceViewId: (state) => state.selectionConfig.referenceSliceCornersBySliceViewId,
      hasAddedLocalizer: (state) => state.selectionConfig.hasAddedLocalizer,
    }),
    ...mapGetters('interactableService', [
      'selectedInteractableState',
      'mayAddSatBand',
      'isSatBandSelected',
      'indexOfSelectedSatBand',
      'satBands',
    ]),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),

    isButtonDisabled() {
      return Math.abs(this.repetitionTime - this.minConcatAcqPackage) < 100
    },
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
  watch: {
    selectedInteractableIdent(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('selectedInteractableIdent changed:', newVal)
        console.log('this.selectedInteractableIdent:', this.selectedInteractableIdent)
        this.selectedInteractableIdent = newVal
        this.updateSelectedInteractableIdent(newVal) // Trigger the Vuex action to update the store
      }
    },
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
    */
    selectedFatOption(newVal) {
      if (newVal === 'Fat Sat.' || newVal === 'SPAIR') {
        this.fatSuppression = true
        this.inversionTime = 0
        this.inversionRecovery = false
      } else {
        this.fatSuppression = false
      }
    },
    shouldPausePopup: {
      immediate: true,
      handler(newVal) {
        this.isInitialLoadingPhase = newVal
      },
    },
  },
}
</script>

<style scoped>
::v-deep .disabledClass .v-select__slot {
  background: #b8b8b8 !important;
}
::v-deep .v-text-field.v-text-field--enclosed .v-text-field__details,
::v-deep .v-text-field.v-text-field--enclosed:not(.v-text-field--rounded) > .v-input__control > .v-input__slot {
  padding: 0 !important;
}
::v-deep .disabledClass .v-select__selection {
  color: #000000 !important;
}
.border {
  border: 2px solid #727272 !important;
}
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 38%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 10%;
  border: 2px solid black;
}
::v-deep .v-text-field > .v-input__control > .v-input__slot > .v-text-field__slot {
  left: 0.5rem;
  width: 150px;
  border-radius: 0px;
}

.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

.label-size-1 {
  width: 75%;
  display: flex;
  justify-content: right;
  margin: 3% 0px 0px 0px;
}

.btn-2 {
  width: 20px !important;
  height: 15px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #423c3c !important;
  border-radius: 0px;
}

.v-btn {
  font-size: 11px !important;
  background: #c0c0c0 !important;
  color: black !important;
  border: 1px solid #c0c0c0;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}

.snr-icon-btn {
  background: transparent !important;
  color: #000 !important;
  border: none !important;
}

.text-2 {
  display: flex;
  justify-content: flex-start;
}

::v-deep .v-input__append-inner {
  padding-left: 0px !important;
  margin-top: 1px;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}

::v-deep .v-icon.v-icon {
  font-size: 17px;
  color: black;
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
  font-size: 80%;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 2px;
}

.v-input--is-focused {
  display: block !important;
}

.text-1 {
  display: flex;
  color: black !important;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
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
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  border-radius: 0px;
  height: 1.05rem;
  border-bottom: none;
  border-radius: 0px;
  margin-top: 5px;
  height: 16px;
}

::v-deep .v-input__icon {
  height: 24px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
}

::v-deep .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__append-inner {
  margin-top: 1px !important;
}

::v-deep .v-text-field__details {
  display: none;
}

.v-input {
  max-width: 65%;
}

::v-deep .v-text-field input {
  padding: 0px;
}

/* ::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: 0px !important;
} */

.main-1 {
  display: flex;
  justify-content: space-around !important;
  color: white !important;
}

.main-2 {
  height: 25vh !important;
  display: flex;
  flex-direction: column;
  justify-content: space-between !important;
  align-items: flex-start;
}

.main-4 {
  height: 20vh;
  display: flex;
  flex-direction: column;
}

.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
  height: 86%;
}

.v-sheet.v-card {
  border-radius: 0px;
}

::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}
::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin: 0px 4px 4px 0px !important;
}
::v-deep .theme--light.v-text-field--solo > .v-input__control > .v-input__slot {
  background: white !important;
}

.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

@media (max-width: 1800px) {
  .bottom-card {
    margin-top: 14% !important;
  }
}
</style>
