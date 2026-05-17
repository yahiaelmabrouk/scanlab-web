<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-card-text>
      <div class="main-1 my-2">
        <div class="main-2">
          <div class="text-3">
            <label
              class="label-size"
              :class="{ 'active-label': activeInputs.parallelFactor, 'inactive-label': !activeInputs.parallelFactor }"
            >
              PAT mode
            </label>

            <div class="text-2">
              <v-select
                :items="getPATModeOptions"
                v-model="localPATSelected"
                color="#423c3c"
                dense
                outlined
                style="width: 16.5vw; max-width: 50%; margin-left: 4%"
                @change="updatePATSelectedValue"
              ></v-select>
            </div>
          </div>
          <div class="text-3">
            <label
              class="label-size"
              :class="{
                'active-label': activeInputs.accelerationMode,
                'inactive-label': !activeInputs.accelerationMode,
              }"
            >
              Accel. Factor PE
            </label>

            <BspinButton
              :type="'number'"
              :step="1"
              :min="1"
              :max="3"
              :disabled="localPATSelected === 'Off'"
              v-model.number="formattedParallelFactor"
              @input="updateAccelFactorPE"
              :class="localPATSelected === 'Off' ? 'spin-btn-grp ml-3 mb-2 MaxRecommFactorPE' : 'input-lock'"
            />
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">Max. recomm. factor PE</label>
            <BspinButton
              :type="'number'"
              :step="1"
              :min="1"
              :max="10"
              :disabled="true"
              v-model.number="maxRecommFactor"
              @input="changeMaxRecommFactor"
              class="spin-btn-grp ml-3 mb-2 MaxRecommFactorPE"
            />
          </div>

          <div class="text-3">
            <label class="label-size inactive-label">Ref. lines PE</label>

            <BspinButton
              :type="'number'"
              :step="1"
              :min="1"
              :max="100"
              :disabled="complete"
              v-model.number="localReferenceLines"
              class="input-lock"
            />
          </div>
        </div>

        <div class="main-2">
          <div class="text-3">
            <label class="label-size inactive-label">Matrix Coil Mode</label>
            <v-select
              color="#423c3c"
              :items="matrixCoilModeOptions"
              v-model="matrixCoilSelectedValue"
              dense
              outlined
              style="width: 15.5vw; max-width: 28%; margin-left: 2%"
              @change="updateMatrixCoilSelectedValue"
            >
            </v-select>
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">Reference scan mode</label>
            <v-select
              color="#423c3c"
              :items="referenceScanModeOptions"
              v-model="referenceScanSelectedValue"
              @change="updateReferenceScanSelectedValue"
              dense
              outlined
              style="width: 15.5vw; max-width: 28%; margin-left: 2%"
            >
            </v-select>
          </div>
        </div>
      </div>
      <!-- <v-row class="justify-end mt-10" v-if="!isTakingTest">
        <v-col cols="2" class="mt-10">
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
        <v-col cols="2" class="mt-10">
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
import { mapState, mapActions, mapGetters } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from './BspinButton.vue'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  name: 'BresolutionIpat',
  mixins: [SelectionConfigMixin],
  components: { BspinButton },
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
      // accelerationFactor: 2,
      //maxRecommFactor: 1,
      //referenceLines: 24,
      // PATSelectedValue: 'Off',
      // PATModeOptions: ['Off', 'GRAPPA', 'mSENSE'],

      matrixCoilSelectedValue: 'Auto(CP)',
      matrixCoilModeOptions: ['Auto(CP)', 'CP', 'Dual', 'Triple'],

      //referenceScanSelectedValue: 'Integrated',
      //referenceScanModeOptions: ['Integrated', 'Single-shot', 'Segmented', 'GRE'],
    }
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    ...mapActions('scanTimeConfig', ['updateParallelFactor']),
    //...mapActions('dataToParent', ['updateScanTime']),
    changeAccelerationFactor(value) {
      this.accelerationFactor = value
    },
    changeMaxRecommFactor(value) {
      this.maxRecommFactor = value
    },
    /*
    changeReferenceLines(value) {
      this.referenceLines = value
    },
    */
    ...mapActions('b19AllValuesSelection', [
      'updateAccelerationFactor',
      'updateMaxRecommFactor',
      'updateReferenceLines',
      'updatePATSelectedValue',
      'updateMatrixCoilSelectedValue',
      'updateReferenceScanSelectedValue',
    ]),
    updateAccelFactorPE(value) {
      this.updateAccelerationFactor(value)
      this.updateParallelFactor(value)
      this.parallelFactor = value === 1 ? 'Off' : value
    },
    changeAccelerationFactor(value) {
      this.updateAccelerationFactor(value)
    },
    changeMaxRecommFactor(value) {
      this.updateMaxRecommFactor(value)
    },
    changeReferenceLines(value) {
      this.updateReferenceLines(value)
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
    /*
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    */
    ...mapState('b19AllValuesSelection', {
      accelerationFactor: 'accelerationFactor',
      maxRecommFactor: 'maxRecommFactor',
      referenceLines: 'referenceLines',
      //PATSelectedValue: 'PATSelectedValue',
      PATModeOptions: 'PATModeOptions',
      matrixCoilSelectedValue: 'matrixCoilSelectedValue',
      matrixCoilModeOptions: 'matrixCoilModeOptions',
      referenceScanSelectedValue: 'referenceScanSelectedValue',
      referenceScanModeOptions: 'referenceScanModeOptions',
    }),
    ...mapGetters('b19AllValuesSelection', [
      'getAccelerationFactor',
      'getMaxRecommFactor',
      'getReferenceLines',
      'getPATModeSelected',
      'getPATModeOptions',
      'getMatrixCoilSelectedValue',
      'getMatrixCoilModeOptions',
      'getReferenceScanSelectedValue',
      'getReferenceScanModeOptions',
    ]),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    formattedParallelFactor: {
      get() {
        // Map 1 to 'Off' and keep other numbers as they are
        return this.parallelFactor === 'Off' ? 1 : this.parallelFactor
      },
      set(value) {
        // Map 1 back to 'Off' when updating
        this.parallelFactor = value === 1 ? 'Off' : value
      },
    },
    localReferenceLines: {
      get() {
        return this.getReferenceLines
      },
      set(value) {
        this.updateReferenceLines(value)
      },
    },
    localPATSelected: {
      get() {
        return this.getPATModeSelected
      },
      set(value) {
        this.updatePATSelectedValue(value)
      },
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
    parallelFactor: {
      handler(newValue) {
        if (newValue === 'Off') {
          this.updatePATSelectedValue('Off')
        }
      },
      immediate: true,
    },
    localPATSelected(newValue) {
      if (newValue === 'Off') {
        this.formattedParallelFactor = 1
      } else if (newValue === 'GRAPPA') {
        this.formattedParallelFactor = 2
      }
    },
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
::v-deep .disabledClass .v-text-field {
  background: darkgray;
  margin-left: -1px;
}
/* .disabledClass.input-lock {
  border: 1px solid rgb(0, 0, 0) !important;
  border-color: rgb(0, 0, 0) !important;
} */
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 36%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 13%;
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

.snr-icon-btn {
  background: transparent !important;
  color: #000 !important;
  border: none !important;
}

.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.5rem;
  width: 27%;
  margin-left: 2%;
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
::v-deep .v-input__append-inner {
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
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
.text-1 {
  display: flex;
  justify-content: space-between;
}
::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}
.text-3 {
  display: flex;
  justify-content: flex-start;
}
::v-deep .v-input__icon {
  height: 12px !important;
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
  background: #423c3c !important;
  margin: 0.15rem;
  border-radius: 0px;
}
::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 12px;
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
.MaxRecommFactorPE {
  width: 27%;
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
    margin-top: 24%;
  }
  .input-lock {
    width: 27.4% !important;
  }
}
</style>
