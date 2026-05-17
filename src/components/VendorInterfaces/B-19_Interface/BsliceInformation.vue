<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card class="slice-info">
    <div class="text-2">
      <div class="sub-section-1">
        <div class="text-2">
          <h5 style="color: rgb(232, 182, 120)">Hayes, Matthew L</h5>
          <h5 style="color: rgb(232, 182, 120)">07/10/1988</h5>
        </div>
      </div>
      <div class="scantime-item fieldStrength">
        <v-btn-toggle
          v-model="fieldStrengthPreference"
          class="contrast-lab-buttons"
          v-if="!isAddLocalizerMode && isContrastLab && !isUltraLab"
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
            active-class="active-field-strength"
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
            active-class="active-field-strength"
          >
            <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
            {{ fieldStrength }} T
          </v-btn>
        </v-btn-toggle>
      </div>
      <div class="sub-section-2">
        <div class="text-1">
          <h5 style="color: rgb(96 126 233); display: flex; flex-wrap: wrap; align-items: center">
            <span v-if="isUltraLab">TA: {{ scanTime }}</span> PM: ISO PAT:
            {{ getAccelerationFactor === 1 ? 'Off' : getAccelerationFactor }}
            <span v-if="isResolutionLab || isUltraLab" style="margin: 0 5px">Voxel size:</span>
            <v-tooltip v-if="isResolutionLab || isUltraLab" top>
              <template #activator="{ on, attrs }">
                <p class="resolution-label" v-bind="attrs" v-on="on" v-if="isResolutionLab" style="margin: 0 5px">
                  {{ getTrueResolutionHeader }}
                </p>
                <p
                  class="resolution-label"
                  v-bind="attrs"
                  v-on="on"
                  v-if="isUltraLab"
                  style="margin: 0 5px; display: flex; align-items: center"
                >
                  <!--<CubeOutlineIcon />-->
                  {{ getTrueResolutionHeaderUltra }}
                </p>
              </template>
              <p class="resolution-tooltip">{{ $t('SelectionConfigForm.reconstructed-resolution') }}</p>
              <p class="resolution-tooltip">{{ getAcquiredResolutionHeader }}</p>
            </v-tooltip>
            <span style="margin-left: 5px"
              >Rel. SNR:{{ snrDifference !== null ? snrDifference.toFixed(2) : '---' }} :
              {{ sequenceTypeDisplayed }}</span
            >
          </h5>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from '../B-19_Interface/BspinButton.vue'
import CubeOutlineIcon from 'icons/CubeOutline'

export default {
  mixins: [SelectionConfigMixin],
  name: 'BsliceInformation',
  // eslint-disable-next-line vue/no-unused-components
  components: { BspinButton, CubeOutlineIcon },
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
    sequenceType: {
      type: String,
      required: false,
      default: 'GRE',
    },
    fieldStrengthsData: {
      type: Array,
      required: true,
    },
  },

  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
  },
  watch: {
    getPATModeSelected(newValue) {
      if (newValue === 'Off') {
        this.$store.dispatch('b19AllValuesSelection/updateAccelerationFactor', 1)
      } else if (newValue === 'GRAPPA') {
        this.$store.dispatch('b19AllValuesSelection/updateAccelerationFactor', 2)
      }
    },
    parallelFactor(newValue) {
      this.$store.dispatch('b19AllValuesSelection/updateAccelerationFactor', newValue)
    },
    selectedStackQuestionIndexVisual(newValue) {},
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
      'getAcquiredResolutionHeader',
      'getTrueResolutionHeaderUltra',
      'getTrueResolutionHeader',
      //'getIsUltraLab',
      'getScanTime',
    ]),
    ...mapGetters('dicomService', ['isContrastLab', 'isResolutionLab']),
    ...mapGetters('b19AllValuesSelection', ['getPATModeSelected', 'getAccelerationFactor']),
    //...mapState('dataToParent', ['sequenceType']),
    // ...mapState('scanTimeConfig', ['scanTime']),

    //...mapGetters('scanTimeConfig', ['getAccelFactorPE', 'getParallelFactor']),
    //...mapGetters('dataToParent', ['getscanTime']),
    /*
    echoTime: {
      get() {
        return this.$store.getters['scanTimeConfig/getEchoTime']
      },
    },
    */
    scanTime() {
      return this.getScanTime
    },
    sequenceTypeDisplayed() {
      switch (this.sequenceType) {
        case 'TE':
          return 'tse'
        case 'SE':
          return 'se'
        case 'GRE':
          return 'gre'
        case 'DIFF':
          return 'epi'
        default:
          return 'n/a'
      }
    },
    /*
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
    frequencyMatrix: {
      get() {
        return this.$store.getters['scanTimeConfig/getFrequencyMatrix']
      },
    },
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
    // eslint-disable-next-line vue/no-dupe-keys
    /*
    selectionIdent: {
      get() {
        return this.$store.getters['scanTimeConfig/getSelectionIdent']
      },
    },
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
  */
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

    // Importtant One

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
  },
  mounted() {
    //console.log('this.scanTime-------------===', this.scanTime)
    //console.log('this.getscanTime-------------===', this.getscanTime)
  },
}
</script>

<style scoped>
.slice-info {
  width: 100%;
  height: 100%;
  background: black !important;
  border: 1px solid #5a5252 !important;
  border-radius: 0px !important;
}

.sub-section-1 {
  max-width: 50% !important;
  width: 50% !important;
}

.text-2 {
  display: flex;
  justify-content: space-around;
  padding-right: 1%;
  padding-top: 0.5%;
}

.text-1 {
  display: flex;
  color: black !important;
  justify-content: flex-start;
}
.sub-section-2 {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  width: 100%;
}

.text-1 h5 {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}

.resolution-label {
  color: rgb(96, 126, 233);
  font-size: 18px;
}

@media (max-width: 768px) {
  .text-1 h5 {
    font-size: 0.9em; /* Adjust font size on smaller screens */
  }
}
.scantime-item {
  display: flex;
  align-items: center;
  margin-left: 200px; /* Space between items */
}
.fieldStrength .contrast-lab-buttons .v-btn {
  color: #ffffff;
}
::v-deep .v-btn-toggle--group > .v-btn.v-btn.active-field-strength {
  background-color: rgba(36, 123, 160, 0.2) !important;
  color: #247ba0 !important;
}
</style>
