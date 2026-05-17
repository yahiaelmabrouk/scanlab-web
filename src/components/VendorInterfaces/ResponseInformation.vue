<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="information">
    <div
      v-if="isUltraLab || isContrastLab || isResolutionLab"
      class="row justify-end"
      style="height: 100%; margin: 0px !important"
    >
      <div class="col-12">
        <v-card class="scan">
          <div class="scantime-row">
            <div v-if="!isResolutionLab">
              <div class="scantime-item fieldStraingth">
                <v-btn-toggle
                  v-model="fieldStrengthPreference"
                  class="contrast-lab-buttons"
                  v-if="!isAddLocalizerMode && !isUltraLab"
                  group
                  dense
                  mandatory
                >
                  <v-btn
                    :title="$t('SelectionConfigForm.field_strength')"
                    outlined
                    v-for="fieldStrength in fieldStrengthsData"
                    :key="fieldStrength"
                    :value="fieldStrength"
                  >
                    <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                    {{ fieldStrength }} T
                  </v-btn>
                </v-btn-toggle>
                <v-btn-toggle
                  v-model="fieldStrengthPreference"
                  class="contrast-lab-buttons"
                  v-if="isUltraLab"
                  group
                  dense
                  mandatory
                >
                  <v-btn
                    :title="$t('SelectionConfigForm.field_strength')"
                    outlined
                    v-for="fieldStrength in fieldStrengthsData"
                    :key="fieldStrength"
                    :value="fieldStrength"
                  >
                    <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                    {{ fieldStrength }} T
                  </v-btn>
                </v-btn-toggle>
              </div>
            </div>
            <div v-if="isUltraLab || isResolutionLab" class="scantime-row-right">
              <div v-if="!isResolutionLab" class="scantime-item">
                <AlarmIcon />
                <p class="time">{{ scanTime }}</p>
              </div>
              <div v-if="!isResolutionLab" class="scantime-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <rect x="12" y="10" width="3" height="7" rx="1" fill="#fff" />
                  <rect x="18" y="5" width="3" height="7" rx="1" fill="#fff" />
                  <rect x="18" y="14" width="3" height="7" rx="1" fill="#fff" />
                </svg>
                <p class="time">Auto</p>
                <!-- <pre class="time">{{ repetitionTime }}</pre>  -->
              </div>

              <div v-if="!isResolutionLab" class="scantime-item mt-2">
                <!-- <FileIcon /> -->
                <v-icon>mdi-speedometer</v-icon>
                <p class="time mb-1">{{ getParallelFactor === 1 ? 'Off' : getParallelFactor }}</p>
              </div>

              <div class="scantime-item">
                <!-- <CubeOutlineIcon /> -->
                <v-tooltip top>
                  <template #activator="{ on, attrs }">
                    <p v-if="isResolutionLab" class="resolution-label" v-bind="attrs" v-on="on">
                      {{ trueResolutionHeader }}
                    </p>
                    <p v-else-if="isUltraLab" class="resolution-label" v-bind="attrs" v-on="on"><CubeOutlineIcon />{{ trueResolutionHeaderUltra }}</p>
                    <p v-else class="resolution-label" v-bind="attrs" v-on="on"><CubeOutlineIcon />{{ trueResolutionHeaderUltra }}</p>
                  </template>
                  <!--- Tooltip shows reconstructed resolution label and acquired resolution value -->
                  <p class="resolution-tooltip">{{ $t('SelectionConfigForm.reconstructed-resolution') }}</p>
                  <p class="resolution-tooltip">{{ acquiredResolutionHeader }}</p>
                </v-tooltip>
              </div>
              <div v-if="!isResolutionLab" class="scantime-item">
                <v-icon>mdi-wifi</v-icon>
                <p class="time">{{ snrDifference !== null ? snrDifference.toFixed(2) : '1.00' }}</p>
              </div>
            </div>
          </div>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { MriMixin } from '../Mixins/MriMixin'
import { mapState, mapActions, mapGetters } from 'vuex'
import AlarmIcon from 'icons/Alarm'
import ArrowRightBoldIcon from 'icons/ArrowRightBold'
import CubeOutlineIcon from 'icons/CubeOutline'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
// import FileIcon from 'icons/FileIcon'
export default {
  name: 'ResponseInformation',
  //mixins: [SelectionConfigMixin],
  data() {
    return {}
  },
  components: {
    AlarmIcon,
    ArrowRightBoldIcon,
    CubeOutlineIcon,
    // FileIcon,
  },
  props: {
    fieldStrengthsData: {
      type: Array,
      required: true,
    },
    /*
    childConCom: {
      type: Object,
      required: true,
    },
    */
    selectionIdent: {
      type: String,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
    paramHints: {
      type: Array,
      required: false,
      default: () => [],
    },
    /*
    useInitialUltraLabDefaults: {
      type: Boolean,
      required: false,
      default: true,
    },
    */
    /*
    sequenceType: {
      type: String,
      required: true,
    },
  */
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

    ...mapGetters('scanTimeConfig', [
      'getAccelFactorPE',
      'getParallelFactor',
      'getSelectedAcceleration',
      'getTrueResolutionHeaderUltra',
      'getTrueResolutionHeader',
      'getAcquiredResolutionHeader',
      'getIsUltraLab',
      'getScanTime',
    ]),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    //...mapGetters('dataToParent', ['getscanTime']),
    // Importtant One

    scanTime() {
      return this.getScanTime
    },

    // Importtant One
    accelFactorPE() {
      return this.getAccelFactorPE
    },
    snrDifference() {
      const snr = this.selectionConfig?.snr
      const savedSnr = this.selectionConfig?.savedSnr
      if (savedSnr === null || snr === null) {
        return null
      }
      return snr / savedSnr
    },
    selectionConfig() {
      return this.selectionConfigsByIdent[this.selectionIdent] || {}
    },

    fieldStrengthPreference: {
      get: function () {
        if (!this.selectionConfig) {
          console.warn('selectionConfig is undefined. Returning default fieldStrength.')
          return this.$store.getters['user/fieldStrengthPreference'] || '3.0'
        }
        let fieldStrength = this.selectionConfig.fieldStrength
        if (!fieldStrength) {
          fieldStrength = this.$store.getters['user/fieldStrengthPreference']
          this.selectionConfig.fieldStrength = fieldStrength
        }
        return fieldStrength
      },
      set: function (newValue) {
        if (this.selectionConfig) {
          this.selectionConfig.fieldStrength = newValue
        }
      },
    },

    trueResolutionHeader: {
      get() {
        //return this.$store.getters['scanTimeConfig/getTrueResolutionHeader']
        return this.getTrueResolutionHeader
      },
    },
    trueResolutionHeaderUltra: {
      get() {
        //return this.$store.getters['scanTimeConfig/getTrueResolutionHeaderUltra']
        return this.getTrueResolutionHeaderUltra
      },
    },
    acquiredResolutionHeader: {
      get() {
        //return this.$store.getters['scanTimeConfig/getAcquiredResolutionHeader']
        return this.getAcquiredResolutionHeader
      },
    },
    /*
     */

    // repetitionTime: {
    //   get() {
    //     return this.$store.getters['scanTimeConfig/getRepetitionTime']
    //   },
    // },
    /*
    echoTime: {
      get() {
        return this.$store.getters['scanTimeConfig/getEchoTime']
      },
    },
    flipAngle: {
      get() {
        return this.$store.getters['scanTimeConfig/getFlipAngle']
      },
    },
    slices: {
      get() {
        return this.$store.getters['scanTimeConfig/getSlices']
      },
    },
    phaseEncodingLines: {
      get() {
        return this.$store.getters['scanTimeConfig/getPhaseEncodingLines']
      },
    },
    parallelFactor: {
      get() {
        return this.$store.getters['scanTimeConfig/getParallelFactor']
      },
    },

    oversampling: {
      get() {
        return this.$store.getters['scanTimeConfig/getOversampling']
      },
    },
    phaseMatrix: {
      get() {
        return this.$store.getters['scanTimeConfig/getPhaseMatrix']
      },
    },
    */
    /*
    frequencyMatrix: {
      get() {
        return this.$store.getters['scanTimeConfig/getFrequencyMatrix']
      },
    },
    */
    /*
    dimensions3x: {
      get() {
        return this.$store.getters['scanTimeConfig/getDimensions3x']
      },
    },
    dimensions3y: {
      get() {
        return this.$store.getters['scanTimeConfig/getDimensions3y']
      },
    },
    partialFourier: {
      get() {
        return this.$store.getters['scanTimeConfig/getPartialFourier']
      },
    },
    averages: {
      get() {
        return this.$store.getters['scanTimeConfig/getAverages']
      },
    },
    concatenations: {
      get() {
        return this.$store.getters['scanTimeConfig/getConcatenations']
      },
    },
    echoTrainLength: {
      get() {
        return this.$store.getters['scanTimeConfig/getEchoTrainLength']
      },
    },
    */
    // isUltraLab: {
    //   get() {
    //     return this.$store.getters['scanTimeConfig/getIsUltraLab']
    //   },
    // },
    /*
    selectionIdent: {
      get() {
        return this.$store.getters['scanTimeConfig/getSelectionIdent']
      },
    },
    */
    /*
    selectionConfig: {
      get() {
        return this.$store.getters['scanTimeConfig/getSelectionConfig']
      },
    },
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
  */
  },
  watch: {
    getSelectedAcceleration(newValue) {
      if (newValue === 'Off') {
        this.$store.dispatch('scanTimeConfig/updateAccelerationFactor', 1)
      } else if (newValue === 'GRAPPA') {
        this.$store.dispatch('scanTimeConfig/updateAccelerationFactor', 2)
      }
    },
    scanTime(newValue) {
      console.log('scanTime watch ---------', newValue)
    },
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
  },
  mounted() {
    console.log('getTrueResolutionHeaderUltra=====', this.getTrueResolutionHeaderUltra)
    console.log('scanTime=====', this.getScanTime)
  },
}
</script>
<style scoped>
/* Base styles (existing styles) */
.fieldStraingth {
  margin-right: 40%;
}
.information {
  width: 150%;
  background: black !important;
  border: 1px solid #5a5252;
  border-width: thin;
}

.scan {
  gap: 10px;
  width: 100%;
  background: black !important;
  border-right: none !important;
  border-bottom: none !important;
  border-top: none !important;
}
.scantime-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.scantime-item {
  display: flex;
  align-items: center;
  margin-right: 15px; /* Space between items */
}
.scantime-row-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}
.time {
  color: white;
  margin-left: 5px; /* Space between icon and text */
}
.v-sheet.v-card {
  border-radius: 0px;
}

.text-3 {
  display: flex;
  justify-content: flex-start;
}

.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

.material-design-icon {
  color: white;
}

.scantime,
.resolution-info {
  display: flex;
  align-items: baseline;
  justify-content: left;
}

.time {
  color: white;
  margin: 4px 0px 0px 4px;
}

.scanTimeLabel {
  color: white;
  margin: 4px 10px 0px 5px;
}

.resolution-info {
  justify-content: center;
}

.resolution-label {
  margin-bottom: 0px !important;
  font-size: 15px;
  color: white;
  margin-top: 2%;
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

::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

::v-deep .theme--light.v-input input {
  color: white !important;
  font-size: small !important;
  text-align: right !important;
}

.text-input {
  max-width: 38%;
  width: 38%;
  margin-left: 2%;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
}

.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
  margin-right: 5px;
}

::v-deep .v-text-field__details {
  display: none;
}

[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

.v-input--is-focused {
  display: block !important;
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
  padding: 6px;
}

::v-deep .v-input__icon {
  height: 10px !important;
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

::v-deep .v-text-field {
  padding-top: 0px !important;
  margin-top: 0px !important;
}

::v-deep .v-text-field__slot {
  background: #383535;
  border-color: #383535;
  border-radius: 0px;
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
  border-radius: 4px;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0px;
}

::v-deep .v-icon.v-icon {
  color: white !important;
  font-size: 17px;
}

.v-input {
  max-width: 30%;
  border-radius: 0px;
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
  justify-content: space-around;
  width: 100%;
}

.main-2 {
  width: 70%;
  color: white !important;
  margin-top: 4%;
}

/* Responsive Styles */
/* @media (min-width: 1396.36px) {
  .fieldStraingth {
    margin-right: 2%;
  }
}
@media (min-width: 1280.80px) {
  .fieldStraingth {
    margin-right: 0%;
  }
} */
/* @media (max-width: 1536px) {
  .fieldStraingth {
    margin-right: 27%;
  }

  .information {
    width: 150%;
  }

  .scan {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .text-input {
    width: 50%;
  }

  .label-size {
    width: 50%;
  }

  .v-btn {
    font-size: 10px !important;
  }

  .main-2 {
    width: 90%;
    margin-top: 2%;
  }
}
@media (min-width: 1706.67px) {
  .fieldStraingth {
    margin-right: 35%;
  }

} */
/* @media (min-width: 1920px) {
  .fieldStraingth {
    margin-right: 42%;
  }

}
@media (min-width: 2048px) {
  .fieldStraingth {
    margin-right: 40%;
  }

}
@media (min-width: 2304px) {
  .fieldStraingth {
    margin-right: 52%;
  }

} */
/* @media (max-width: 1200px) {
  .information {
    width: 150%;
  }

  .scan {
    grid-template-columns: 1fr;
    padding: 2px 11px 15px 0px;
  }

  .text-input {
    width: 50%;
  }

  .label-size {
    width: 50%;
  }

  .v-btn {
    font-size: 10px !important;
  }

  .main-2 {
    width: 90%;
    margin-top: 2%;
  }
} */
/*
@media (max-width: 768px) {
  .information {
    width: 100%;
  }

  .scan {
    grid-template-columns: 1fr;
  }

  .text-input {
    width: 60%;
  }

  .label-size {
    width: 60%;
  }

  .v-btn {
    font-size: 9px !important;
  }

  .main-2 {
    width: 100%;
    margin-top: 1%;
  }

  .scantime-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .scantime-item {
    margin-bottom: 10px;
  }
} */
/*
@media (max-width: 480px) {
  .information {
    width: 100%;
    border: 1px solid #5a5252;
  }

  .scan {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .text-input {
    width: 80%;
  }

  .label-size {
    width: 80%;
  }

  .v-btn {
    font-size: 8px !important;
  }

  .main-2 {
    width: 100%;
    margin-top: 0%;
  }
} */

/* Large desktops */

@media (min-width: 1800px) and (max-width: 1920px) {
  .information {
    width: 150%;
  }

  .scan {
    grid-template-columns: 1fr;
    padding: 2px 11px 15px 0px;
  }

  .text-input {
    width: 50%;
  }

  .label-size {
    width: 50%;
  }

  .v-btn {
    font-size: 10px !important;
  }

  .main-2 {
    width: 90%;
    margin-top: 2%;
  }
}

/* Regular desktops */
@media (min-width: 1200px) and (max-width: 1800px) {
  .information {
    width: 150%;
  }

  .scan {
    grid-template-columns: 1fr;
    padding: 2px 11px 15px 0px;
  }

  .text-input {
    width: 50%;
  }

  .label-size {
    width: 50%;
  }

  .v-btn {
    font-size: 10px !important;
  }

  .main-2 {
    width: 90%;
    margin-top: 2%;
  }
}
@media (min-width: 1024px) and (max-width: 1199px) {
  .information {
    width: 150%;
  }

  .scan {
    grid-template-columns: 1fr;
    padding: 2px 11px 15px 0px;
  }

  .text-input {
    width: 50%;
  }

  .label-size {
    width: 50%;
  }

  .v-btn {
    font-size: 10px !important;
  }

  .main-2 {
    width: 90%;
    margin-top: 2%;
  }
}

/* Tablets (landscape) */
@media (min-width: 768px) and (max-width: 1023px) {
  .information {
    width: 150%;
  }

  .scan {
    grid-template-columns: 1fr;
    padding: 2px 11px 15px 0px;
  }

  .text-input {
    width: 50%;
  }

  .label-size {
    width: 50%;
  }

  .v-btn {
    font-size: 10px !important;
  }

  .main-2 {
    width: 90%;
    margin-top: 2%;
  }
}

/* Tablets (portrait) */
@media (min-width: 481px) and (max-width: 767px) {
  .information {
    width: 150%;
  }

  .scan {
    grid-template-columns: 1fr;
    padding: 2px 11px 15px 0px;
  }

  .text-input {
    width: 50%;
  }

  .label-size {
    width: 50%;
  }

  .v-btn {
    font-size: 10px !important;
  }

  .main-2 {
    width: 90%;
    margin-top: 2%;
  }
}

/* Mobile devices */
@media (min-width: 320px) and (max-width: 480px) {
  .information {
    width: 150%;
  }

  .scan {
    grid-template-columns: 1fr;
    padding: 2px 11px 15px 0px;
  }

  .text-input {
    width: 50%;
  }

  .label-size {
    width: 50%;
  }

  .v-btn {
    font-size: 10px !important;
  }

  .main-2 {
    width: 90%;
    margin-top: 2%;
  }
}
</style>
