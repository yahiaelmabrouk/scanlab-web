<template>
  <v-card color="rgb(46, 44, 44)" width="100%" height="100%">
    <v-card-text>
      <div class="main-1" style="margin-top: 1%">
        <!-- Left Column -->
        <div class="main-2">
          <div class="text-3">
            <label class="label-size">Diffusion Mode</label>
            <v-select
              v-model="diffusionMode"
              :items="diffusionModeItems"
              color="#423c3c"
              dense
              outlined
              class="ml-2"
            ></v-select>
          </div>

          <div class="text-3">
            <label class="label-size">Diff. Directions</label>
            <v-select
              type="number"
              v-model.number="diffusionDirections"
              :items="diffusionDirectionItems"
              color="#423c3c"
              dense
              outlined
              class="ml-2"
            ></v-select>
          </div>

          <div class="text-3">
            <label class="label-size inactive-label">Diffusion Scheme</label>
            <v-select
              v-model="diffusionScheme"
              :items="diffusionSchemes"
              color="#423c3c"
              dense
              outlined
              class="ml-2"
            ></v-select>
          </div>

          <div class="text-3">
            <label class="label-size">Diff. Weightings</label>
            <div class="text-input">
              <SpinButton
                :type="'number'"
                :step="1"
                :min="1"
                :max="4"
                :value="numBValues"
                @input="changeSpin($event, 'numBValues')"
              />
            </div>
          </div>

          <div style="min-height: 165px">
            <v-simple-table class="custom-table" :dense="true">
              <template #default>
                <thead>
                  <tr>
                    <th class="text-center">b-value</th>
                    <th class="text-center">Averages</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(_, index) in numBValues" :key="index">
                    <td>
                      <SpinButton
                        :step="1"
                        :min="index === 0 ? (numBValues === 1 ? 50 : 0) : (index === numBValues - 1 ? Math.max(50, bValues[index - 1] + 1) : bValues[index - 1] + 1)"
                        :max="5000"
                        :value="bValues[index]"
                        @input="(value) => changeBValueSpin(value, index)"
                      />
                    </td>
                    <td>
                      <SpinButton
                        :step="1"
                        :min="1"
                        :max="20"
                        :value="bAverages[index]"
                        @input="(value) => changeBAveragesSpin(value, index)"
                      />
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </div>

          <div class="text-2">
            <label class="label-size inactive-label">Invert Gray Scale</label>
            <v-checkbox v-model="invertGrayScale" />
          </div>
        </div>

        <!-- Right Column -->
        <div class="main-2">
          <div class="text-2">
            <label class="label-size inactive-label">Diff. Weighted Images</label>
            <v-checkbox v-model="diffWeightedImages" />
          </div>

          <div class="text-2">
            <label class="label-size inactive-label">Trace Weighted Images</label>
            <v-checkbox v-model="traceWeightedImages" />
          </div>
          <div class="text-2" style="margin-top: 20%">
            <label class="label-size">ADC Maps</label>
            <v-checkbox v-model="diffusionADC" :disabled="adcDisabled" />
          </div>

          <div class="text-2">
            <label class="label-size inactive-label">Exponential ADC Maps</label>
            <v-checkbox v-model="expAdcMaps" />
          </div>

          <div class="text-3">
            <label class="label-size inactive-label">b-Value >=</label>
            <div class="text-input">
              <SpinButton :type="'number'" :step="10" :min="0" :max="2500" v-model.number="bValueGreaterOrEqual" />
            </div>
            <span class="mx-3">s/mm²</span>
          </div>

          <div class="text-3">
            <label class="label-size inactive-label">ADC Noise Threshold</label>
            <div class="text-input">
              <SpinButton :type="'number'" :step="10" :min="10" :max="100" v-model.number="adcNoiseThreshold" />
            </div>
          </div>

          <div class="text-2">
            <label class="label-size inactive-label">Noise Masking</label>
            <v-checkbox v-model="noiseMasking" />
          </div>
          <!-- Calculated b-Value -->
          <div class="text-3">
            <label class="label-size inactive-label">Calculate b-Value</label>
            <v-checkbox v-model="calculatedBValue" />
          </div>

          <div v-if="calculatedBValue" class="text-3">
            <label class="label-size inactive-label">Calculated b-Value</label>
            <div class="text-input">
              <SpinButton :type="'number'" :step="10" :min="0" :max="2500" v-model.number="calculatedBValueInput" />
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { SelectionConfigMixin } from '@/components/Mixins/SelectionConfigMixin'
import SpinButton from './SpinButton.vue'
import { mapState, mapActions, mapGetters } from 'vuex'

export default {
  mixins: [SelectionConfigMixin],
  name: 'DiffusionTab',
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
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      diffusionSchemes: ['Monopolar', 'Bipolar'],
      diffDirectionsDisabled: false,
    }
  },
  methods: {
    //...mapActions('dataToParent', ['updateScanTime']),
    ...mapActions('xaAllValuesSelection', [
      'setDiffusionMode',
      'setDiffusionScheme',
      'setInvertGrayScale',
      'setDiffWeightedImages',
      'setTraceWeightedImages',
      'setExpAdcMaps',
      'setBValueGreaterOrEqual',
      'setAdcNoiseThreshold',
      'setNoiseMasking',
      'setCalculatedBValue',
      'setCalculatedBValueInput',
    ]),
  },
  computed: {
    ...mapGetters('xaAllValuesSelection', [
      'getDiffusionMode',
      'getDiffusionScheme',
      'getInvertGrayScale',
      'getDiffWeightedImages',
      'getTraceWeightedImages',
      'getExpAdcMaps',
      'getBValueGreaterOrEqual',
      'getAdcNoiseThreshold',
      'getNoiseMasking',
      'getCalculatedBValue',
      'getCalculatedBValueInput',
    ]),
    diffusionMode: {
      get() {
        return this.getDiffusionMode
      },
      set(value) {
        this.setDiffusionMode(value)
      },
    },
    diffusionScheme: {
      get() {
        return this.getDiffusionScheme
      },
      set(value) {
        this.setDiffusionScheme(value)
      },
    },
    invertGrayScale: {
      get() {
        return this.getInvertGrayScale
      },
      set(value) {
        this.setInvertGrayScale(value)
      },
    },
    diffWeightedImages: {
      get() {
        return this.getDiffWeightedImages
      },
      set(value) {
        this.setDiffWeightedImages(value)
      },
    },
    traceWeightedImages: {
      get() {
        return this.getTraceWeightedImages
      },
      set(value) {
        this.setTraceWeightedImages(value)
      },
    },
    expAdcMaps: {
      get() {
        return this.getExpAdcMaps
      },
      set(value) {
        this.setExpAdcMaps(value)
      },
    },
    bValueGreaterOrEqual: {
      get() {
        return this.getBValueGreaterOrEqual
      },
      set(value) {
        this.setBValueGreaterOrEqual(value)
      },
    },
    adcNoiseThreshold: {
      get() {
        return this.getAdcNoiseThreshold
      },
      set(value) {
        this.setAdcNoiseThreshold(value)
      },
    },
    noiseMasking: {
      get() {
        return this.getNoiseMasking
      },
      set(value) {
        this.setNoiseMasking(value)
      },
    },
    calculatedBValue: {
      get() {
        return this.getCalculatedBValue
      },
      set(value) {
        this.setCalculatedBValue(value)
      },
    },
    calculatedBValueInput: {
      get() {
        return this.getCalculatedBValueInput
      },
      set(value) {
        this.setCalculatedBValueInput(value)
      },
    },
  },
  mounted() {},
  watch: {
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
    */
  },
}
</script>
<style scoped>
.spin-btn-grp {
  width: 100% !important;
}
.spin-input {
  width: 80%;
  height: 100%;
  background-color: #383535;
  border: none;
  color: white;
  text-align: center;
  font-size: 14px;
  -webkit-appearance: none;
  -moz-appearance: textfield;
}

.spin-input::-webkit-inner-spin-button,
.spin-input::-webkit-outer-spin-button {
  margin: 0;
  appearance: auto;
}

.spin-input:focus {
  outline: none;
}
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
}
.TRTEwidth {
  width: 38%;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

.text-input {
  max-width: 28%;
  width: 28%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
}

::v-deep .v-icon.v-icon {
  font-size: 17px;
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
::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}
.v-input--is-focused {
  display: block !important;
}

.text-1 {
  display: flex;
  color: white !important;
  justify-content: space-evenly;
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

.main-1 {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.main-2 {
  width: 100%;
  color: white !important;
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

.disabled-div {
  background-color: #444; /* Background color to make it look disabled */
  padding: 2% 5% 2% 0%;
  border: 1px solid #555; /* Subtle border */
  border-radius: 5px;
  margin: auto;
  opacity: 0.5; /* Makes it look disabled */
  width: 100%;
}

.input-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.input-group label {
  color: #ccc;
  font-size: 14px;
  flex: 1;
}

.input-group input {
  background-color: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 5px;
  flex: 1;
  text-align: right;
  max-width: 100px;
}

input[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}

.custom-table {
  background-color: transparent !important;
  border: 1px solid white !important;
  width: 200px;
  margin: auto;
  border-radius: 0 !important;
}

.custom-table ::v-deep table {
  border-collapse: separate;
  border-radius: 0 !important;
}

.custom-table ::v-deep th,
.custom-table ::v-deep td {
  background-color: #383535 !important;
  border: none !important;
  color: white !important;
  font-size: 0.9rem !important;
  padding: 0 !important;
  border-radius: 0 !important;
}

.custom-table ::v-deep thead tr th {
  border-bottom: 1px solid white !important;
}

.custom-table ::v-deep tbody tr:not(:last-child) td {
  border-bottom: 1px solid white !important;
}

.custom-table ::v-deep th:not(:last-child),
.custom-table ::v-deep td:not(:last-child) {
  border-right: 1px solid white !important;
}

/* Remove hover effect */
.custom-table ::v-deep tbody tr:hover {
  background-color: transparent !important;
}

/* Adjust SpinButton styling if needed */
.custom-table ::v-deep .v-input {
  margin-bottom: 0;
}

/* Responsive design */
@media (max-width: 500px) {
  .disabled-div {
    padding: 10px;
    max-width: 100%;
  }

  .input-group {
    flex-direction: column;
  }

  .input-group input {
    max-width: 100%;
  }
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}
</style>
