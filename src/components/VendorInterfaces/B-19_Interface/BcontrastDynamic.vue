<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <v-row class="main-1 m-0">
        <v-col class="main-2">
          <div class="main-3">
            <div class="text-1 my-2" v-if="selectionConfig.sequenceType !== 'DIFF'">
              <label
                class="label-size"
                :class="{ 'active-label': activeInputs.averages, 'inactive-label': !activeInputs.averages }"
              >
                Averages
              </label>
              <BspinButton
                @input="changeAverages"
                :type="'number'"
                :value="averages"
                :step="1"
                :min="1"
                :max="10"
                :disabled="complete"
                class="input-lock"
              />
            </div>

            <div class="text-1">
              <label class="label-size inactive-label">Averaging Mode</label>
              <v-select
                v-model="selectedAveragingMode"
                :items="averagingModeOptions"
                color="#423c3c"
                dense
                outlined
                style="width: 14vw; max-width: 38%; margin-left: 2%"
              ></v-select>
            </div>
          </div>

          <div class="text-1 mb-16">
            <label class="label-size inactive-label">Reconstruction</label>
            <v-select
              :items="reconstructionOptions"
              v-model="selectedReconstruction"
              color="#423c3c"
              dense
              outlined
              style="width: 14vw; max-width: 38%; margin-left: 2%"
            ></v-select>
          </div>
        </v-col>

        <v-col class="main-2">
          <div class="text-1" style="margin-top: 3rem">
            <label class="label-size inactive-label">Measurements</label>
            <BspinButton
              @input="changeMeasurement"
              :type="'number'"
              :value="measurement"
              :step="1"
              :min="1"
              :max="10"
              :disabled="complete"
              class="input-lock"
            />
          </div>
          <div class="text-1 mb-16">
            <label class="label-size inactive-label">Multiple series</label>
            <v-select
              :items="seriesOptions"
              v-model="selectedSeries"
              color="#423c3c"
              dense
              outlined
              style="width: 14vw; max-width: 38%; margin-left: 2%"
            ></v-select>
          </div>
        </v-col>
      </v-row>
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
import { mapState, mapActions, mapGetters } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from './BspinButton.vue'
import EventBus from '@/lib/event-bus'
import _ from 'lodash'
import { activeLabelUtil } from '@/components/VendorInterfaces/activeLabelUtil.js'

export default {
  mixins: [SelectionConfigMixin, MriMixin],
  components: { BspinButton },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
    /*
    isFreebie: {
      type: Boolean,
      required: false,
      default: false,
    },
    isManager: {
      type: Boolean,
      required: false,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      required: false,
      default: false,
    },
    isSandbox: {
      type: Boolean,
      required: false,
      default: false,
    },
    trafficLightsPreviewPanel: {
      type: Boolean,
      required: false,
      default: false,
    },
    */
    paramHints: {
      type: Array,
      required: false,
      default: () => [],
    },
    useInitialUltraLabDefaults: {
      type: Boolean,
      required: false,
      default: true,
    },
    sequenceType: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      measurement: 1,
      averagingModeOptions: ['None', 'Short Term', 'Long Term'],
      reconstructionOptions: ['None', 'Magnitude'],
      selectedAveragingMode: 'None',
      selectedReconstruction: 'None',
      selectedSeries: 'Series A',
      seriesOptions: ['Series A', 'Series B'],
    }
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    //...mapActions('dataToParent', ['updateScanTime']),
    changeAverages(value) {
      this.averages = value
    },
    changeMeasurement(value) {
      this.measurement = value
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
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
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

  mounted() {
    EventBus.$on('onSliceViewWindowChange', this.onSliceViewWindowChange)
    if (this.minConcatAcqPackage > this.repetitionTime) {
      if (this.selectionConfig?.sequenceType === 'TE') {
        this.concatenations = _.round(
          ((this.echoSpacing + 5) * (this.echoTrainLength ? this.echoTrainLength : 1) * this.numberOfSlices) /
            this.repetitionTime
        )
      } else if (this.selectionConfig?.sequenceType === 'SE') {
        this.concatenations = _.round(((this.echoSpacing + 5) * this.numberOfSlices) / this.repetitionTime)
        if (this.concatenations <= 1) {
          this.concatenations = 2
        }
      }
    }
  },
  watch: {
    /*
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        // console.log('scan time in Routine Tab=====', newVal)
        this.updateScanTime(newVal)
      }
    },
    */
  },
}
</script>

<style scoped>
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 27%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 8%;
  border: 2px solid black;
}
.v-input--is-focused {
  display: block !important;
}

label,
span {
  font-size: 80%;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
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
.text-1 {
  display: flex;
  justify-content: flex-start;
  color: black !important;
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
.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.5rem;
  width: 35%;
  margin-left: 2%;
}
::v-deep .v-input__slot fieldset {
  background: white;
  border-color: white !important;
  border-radius: 0px;
}
::v-deep .v-input__icon {
  height: 18px !important;
  border: 1px solid#C0C0C0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
}
::v-deep .v-icon.v-icon {
  color: black;
}
::v-deep .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__append-inner {
  margin-top: 3px !important;
}
::v-deep .v-input__append-inner {
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}
.v-input {
  max-width: 40%;
}
.v-text-field > .v-input__control > .v-input__slot:before {
  border: 0px !important;
}
::v-deep .v-text-field input {
  padding: 0px;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 35px;
}
::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: -2px !important;
}
.main-1 {
  display: flex;
  height: 27vh;
  justify-content: space-around;
}
.main-2 {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2px;
}
.main-3 {
  display: flex;
  flex-direction: column;
}

.v-sheet.v-card {
  border-radius: 0px;
}
::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}
::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin: 0px 4px 10px 0px !important;
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
    margin-top: 12%;
  }
}
</style>
