<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-dialog v-model="showConfirmDialog" persistent width="700px">
      <v-card class="change-dialog full-height-dialog">
        <div class="dialog-content">
          <v-card-title class="headline">
            {{ $t('global.notification', languageCode) }}
          </v-card-title>

          <v-card-text>
            <div class="mb-4">{{ $t('SelectionConfigForm.your_last_change', languageCode) }}</div>

            <!-- Changes grouped by source parameter -->
            <div class="changes-container">
              <div v-for="(group, sourceParam) in groupedChanges" :key="sourceParam" class="change-group">
                <div class="change-group-title">{{ sourceParam }}</div>

                <!-- Source parameter change -->
                <div v-if="group.sourceChange.oldValue !== group.sourceChange.newValue" class="change-row">
                  <span class="old-value">{{ formatValue(group.sourceChange.oldValue) }}</span>
                  <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                  <span class="new-value">{{ formatValue(group.sourceChange.newValue) }}</span>
                </div>

                <!-- Affected parameter changes -->
                <div v-for="(affected, idx) in group.affectedChanges" :key="idx" class="affected-change">
                  <div class="affected-label">Will update {{ affected.label }}:</div>
                  <div class="change-row">
                    <span class="old-value">{{ formatValue(affected.oldValue) }}</span>
                    <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                    <span class="new-value">{{ formatValue(affected.newValue) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </div>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="cancelChange">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="success" @click="confirmChange" :class="{ 'active-confirm-button': isDialogKeyboardReady }">
            {{ $t('global.okay', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-card-text>
      <div class="main-1 my-2">
        <v-container>
          <v-row>
            <v-col cols="4">
              <v-row>
                <v-col cols="6" class="pr-1 text-right">
                  <label>{{ 'Diffusion mode' }}</label>
                </v-col>
                <v-col cols="6" class="pl-0 pr-7">
                  <v-select v-model="diffusionMode" :items="diffusionModeItems" dense outlined></v-select>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="6" class="pr-1 text-right">
                  <label>{{ 'Diff weightings' }}</label>
                </v-col>
                <v-col cols="6" class="pl-0 pr-7">
                  <div class="bg-white" style="margin-right: 10px; padding: 0px 1px 1px 0px">
                    <BspinButton
                      :step="1"
                      :min="1"
                      :max="4"
                      :value="numBValues"
                      @input="changeSpin($event, 'numBValues')"
                      class="ps-2"
                    />
                  </div>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="5" class="text-left">
                  <label>{{ 'b-values' }}</label>
                </v-col>
                <v-col cols="2">
                  <label>{{ 'Averages' }}</label>
                </v-col>
                <v-col cols="4">
                  <!-- Empty column for alignment -->
                </v-col>
              </v-row>
              <v-container class="p-0 m-0" :style="{ display: 'grid', gap: '2px' }">
                <v-row v-for="(_, index) in numBValues" class="py-0 pr-7 my-0" :key="index">
                  <v-col cols="6" class="py-0 pr-0 my-0">
                    <div class="bg-white pl-2" style="margin-right: 2px">
                      <BspinButton
                        :step="1"
                        :min="
                          index === 0
                            ? (numBValues === 1 ? 50 : 0)
                            : index === numBValues - 1
                            ? Math.max(50, bValues[index - 1] + 1)
                            : bValues[index - 1] + 1
                        "
                        :max="5000"
                        :value="bValues[index]"
                        @input="(value) => changeBValueSpin(value, index)"
                      />
                    </div>
                  </v-col>
                  <v-col cols="6" class="py-0 px-0 my-0">
                    <div class="bg-white pl-2" style="margin-right: 10px">
                      <BspinButton
                        :step="1"
                        :min="1"
                        :max="20"
                        :value="bAverages[index]"
                        @input="(value) => changeBAveragesSpin(value, index)"
                      />
                    </div>
                  </v-col>
                </v-row>
              </v-container>
            </v-col>
            <v-col cols="3">
              <!-- Empty column for alignment -->
            </v-col>
            <v-col cols="5">
              <v-row>
                <v-col cols="6" class="text-right p-0 pt-2">
                  <label class="inactive-label">Diff. weighted images</label>
                </v-col>
                <v-col cols="2" class="p-0 pt-2">
                  <div class="d-flex justify-end">
                    <checkbox v-model="diffWeightedImages" label="Diff. weighted images" />
                  </div>
                </v-col>
                <v-col cols="4">
                  <!-- Empty column for alignment -->
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="6" class="text-right p-0">
                  <label class="inactive-label">Trace weighted images</label>
                </v-col>
                <v-col cols="2" class="p-0">
                  <div class="d-flex justify-end">
                    <checkbox v-model="traceWeightedImages" label="Trace weighted images" />
                  </div>
                </v-col>
                <v-col cols="4">
                  <!-- Empty column for alignment -->
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="6" class="text-right p-0">
                  <label>Average ADC maps</label>
                </v-col>
                <v-col cols="2" class="p-0">
                  <div class="d-flex justify-end">
                    <checkbox :value="diffusionADC" :disabled="adcDisabled" @input="changeDiffusionADC" />
                  </div>
                </v-col>
                <v-col cols="4">
                  <!-- Empty column for alignment -->
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="6" class="text-right p-0">
                  <label class="inactive-label">Individual ADC maps</label>
                </v-col>
                <v-col cols="2" class="p-0">
                  <div class="d-flex justify-end">
                    <checkbox v-model="individualADCMaps" label="Individual ADC maps" />
                  </div>
                </v-col>
                <v-col cols="4">
                  <!-- Empty column for alignment -->
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="6" class="text-right pr-0">
                  <label class="inactive-label">Mosaic</label>
                </v-col>
                <v-col cols="2" class="px-0">
                  <div class="d-flex justify-end">
                    <checkbox v-model="mosaic" label="Mosaic" />
                  </div>
                </v-col>
                <v-col cols="4">
                  <!-- Empty column for alignment -->
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="5" class="text-right">
                  <label class="inactive-label">{{ 'Noise level' }}</label>
                </v-col>
                <v-col cols="3" class="px-0">
                  <div class="bg-white" style="margin-right: 10px; padding: 0px 1px 1px 0px">
                    <BspinButton
                      :step="1"
                      :min="1"
                      :max="100"
                      :value="noiseLevel"
                      class="ps-2"
                      @input="changeNoiseLevel"
                    />
                  </div>
                </v-col>
                <v-col cols="4">
                  <!-- Empty column for alignment -->
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="5" class="text-right">
                  <label>{{ 'Diff. Directions' }}</label>
                </v-col>
                <v-col cols="3" class="px-0">
                  <v-select
                    v-model="diffusionDirections"
                    :items="diffusionDirectionItems"
                    dense
                    outlined
                    class="position"
                  ></v-select>
                </v-col>
                <v-col cols="4">
                  <!-- Empty column for alignment -->
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-container>

        <!--
        <ul class="text-body-2 text-right mb-0">
          <li>SNR Factor: {{ Number.parseFloat(noiseFactor).toFixed(2) }}</li>
          <li>gradientRampTime: {{ Number.parseFloat(gradientRampTime).toFixed(2) }}</li>
          <li>rfPulseDuration: {{ Number.parseFloat(rfPulseDuration).toFixed(2) }}</li>
          <li>EchoSpacing: {{ Number.parseFloat(echoSpacing).toFixed(1) }}</li>
          <li>echoTrainLength: {{ Number.parseFloat(echoTrainLength).toFixed(2) }}</li>
          <li>minTE: {{ Number.parseFloat(minTEOptionsForTEandDIFF).toFixed(2) }}</li>
       </ul> -->
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from './BspinButton.vue'
import checkbox from './CustomCheckbox.vue'
//import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  mixins: [SelectionConfigMixin],
  name: 'BdiffusionCommon',
  components: { BspinButton, checkbox },
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
    return {}
  },
  methods: {
    ...mapActions('b19AllValuesSelection', [
      'updateDiffusionMode',
      'updateDiffWeightedImages',
      'updateTraceWeightedImages',
      'updateIndividualADCMaps',
      'updateMosaic',
      'updateNoiseLevel',
    ]),
    changeDiffusionADC(value) {
      this.diffusionADC = value
    },
    changeNoiseLevel(value) {
      this.noiseLevel = value
    },
    /*
    ...mapActions('selectionConfig', ['resetSelection']),
    ...mapActions('dataToParent', ['updateScanTime']),
    */
    /*
    increment() {
      this.number++
    },
    decrement() {
      if (this.number > 0) {
        this.number--
      }
    },

    changeTurboFactor(value) {
      this.turboFactor = value
    },
    changeEchoTrainsPerSlice(value) {
      this.echoTrainsPerSlice = value
    },
    */
  },
  computed: {
    ...mapGetters('b19AllValuesSelection', [
      'getDiffusionMode',
      'getDiffWeightedImages',
      'getTraceWeightedImages',
      'getIndividualADCMaps',
      'getMosaic',
      'getNoiseLevel',
    ]),
    diffusionMode: {
      get() {
        return this.getDiffusionMode
      },
      set(value) {
        this.updateDiffusionMode(value)
      },
    },
    diffWeightedImages: {
      get() {
        return this.getDiffWeightedImages
      },
      set(value) {
        this.updateDiffWeightedImages(value)
      },
    },
    traceWeightedImages: {
      get() {
        return this.getTraceWeightedImages
      },
      set(value) {
        this.updateTraceWeightedImages(value)
      },
    },
    individualADCMaps: {
      get() {
        return this.getIndividualADCMaps
      },
      set(value) {
        this.updateIndividualADCMaps(value)
      },
    },
    mosaic: {
      get() {
        return this.getMosaic
      },
      set(value) {
        this.updateMosaic(value)
      },
    },
    noiseLevel: {
      get() {
        return this.getNoiseLevel
      },
      set(value) {
        this.updateNoiseLevel(value)
      },
    },

    /*
    ...mapState('selectionConfig', 'isAddLocalizerMode'),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    */
    /*
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    */
    /*
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
    */
  },
  watch: {
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
    */
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
.MaxRecommFactorPE {
  width: 27%;
}
.disabled-div {
  background-color: #b5b1b1;
  padding: 3px;
  border: 1px solid #555;
  border-radius: 5px;
  max-width: 200px;
  margin: auto;
  opacity: 0.5;
  margin-right: 31%;
  margin-top: 4%;
  width: 100%;
}
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 36%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 1%;
  border: 2px solid black;
}
.v-btn {
  font-size: 11px !important;
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
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

.label-size-1 {
  width: 65%;
  display: flex;
  justify-content: right;
}

::v-deep .v-text-field__details {
  display: none;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

.v-input--is-focused {
  display: block !important;
}

label,
span {
  color: black;
  font-size: 80%;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}

.text-3 {
  display: flex;
  justify-content: flex-start;
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

::v-deep .v-input__append-inner {
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}

::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
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

.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.05rem;
  width: 27%;
  margin-left: 2%;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  font-size: 17px;
}

.v-input {
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
  width: 100%;
}

.main-2 {
  width: 50%;
  color: white !important;
}

.main-3 {
  display: flex;

  flex-direction: column;
  justify-content: space-between;
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
    left: 35%;
    margin-top: 3% !important;
  }
  .disabled-div {
    margin-top: 12%;
  }
}
/* popup styles */
.selection-config-form .showConfirmDialog {
  background-color: white !important;
}
.full-height-dialog {
  display: flex;
  flex-direction: column;
  height: auto !important;
  max-height: none !important;
}

.full-height-dialog .dialog-content {
  flex: 1 1 auto;
  overflow-y: auto;
}

.full-height-dialog .v-card__actions {
  flex: 0 0 auto;
  padding: 16px;
}

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #f2a14a !important;
}
</style>
