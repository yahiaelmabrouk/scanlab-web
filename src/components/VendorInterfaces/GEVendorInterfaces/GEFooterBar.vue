<template>
  <v-footer class="status-bar">
    <div class="time" style="width: 5%"><span>08:12</span><span>April 4</span></div>
    <div class="battery btr" style="width: 5%">
      <img src="@/assets/svg/regions/battery.png" class="icon" />
      <span class="level">50%</span>
    </div>
    <v-row class="icons" style="width: 20%; height: 100%">
      <v-col v-if="!isCanvasActiveFlag">
        <img src="@/assets/ge_img/footer_2.png" class="icon" />
      </v-col>
      <v-col
        v-else
        style="
          height: 100%;
          padding-top: 0px !important;
          padding-bottom: 0px !important;
          display: flex;
          flex-direction: column;
        "
      >
        <img src="@/assets/ge_img/footer_2.png" class="icon" style="height: 80%" />
        <label style="height: 10%; font-size: 10px; color: white">2/1/21</label>
        <label style="height: 10%; font-size: 10px; color: white">2/21</label>
      </v-col>
      <v-col>
        <img src="@/assets/ge_img/footer_3.png" class="icon" />
      </v-col>
      <v-col>
        <div style="cursor: pointer">
          <img src="@/assets/ge_img/footer_4.png" class="icon" />
        </div>
      </v-col>
      <v-col>
        <img src="@/assets/ge_img/footer_5.png" class="icon" />
      </v-col>
    </v-row>
    <v-col class="search-bar" cols="6" style="padding: 0px !important; width: 35%">
      <v-text-field placeholder="Search" solo-inverted hide-details></v-text-field>
    </v-col>
    <v-row class="icons" style="width: 35%">
      <v-col>
        <img src="@/assets/ge_img/footer_6.png" class="icon" />
      </v-col>
      <v-col>
        <img src="@/assets/ge_img/footer_7.png" class="icon" />
      </v-col>
      <v-col>
        <img src="@/assets/ge_img/footer_8.png" class="icon" />
      </v-col>
      <v-col>
        <img src="@/assets/ge_img/footer_9.png" class="icon" />
      </v-col>
      <v-col>
        <img src="@/assets/ge_img/footer_10.png" class="icon" />
      </v-col>
      <v-col>
        <div @click="toggleSARDisplay" style="cursor: pointer">
          <img src="@/assets/ge_img/footer_11.png" class="icon" />
        </div>
      </v-col>
      <v-col>
        <img src="@/assets/ge_img/footer_12.png" class="icon" />
      </v-col>
    </v-row>
    <GESarDisplay v-if="showSAR" @close="showSAR = false" />
  </v-footer>
</template>

<script>
import GESarDisplay from './GESarDisplay.vue'
import { mapState, mapGetters, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'

export default {
  mixins: [SelectionConfigMixin, MriMixin],
  computed: {
    ...mapGetters('selectionConfig', ['dotScaleValues']),
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
      'getIsUltraLab',
      'getTrueResolutionHeaderUltra',
      'getAPVoxel',
      'getTrueResolutionHeader',
      'getRepetitionTime',
      'getTRSync',
      'getTESync',
    ]),
    ...mapGetters('b19AllValuesSelection', ['getPATSelectedValue', 'getAccelerationFactor']),
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
    // eslint-disable-next-line vue/no-dupe-keys
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
    fieldStrengthPreference: {
      get: function () {
        let output
        if (this.fieldStrengthPreferenceLocal !== null) {
          output = this.fieldStrengthPreferenceLocal
        } else {
          output = this.$store.getters['user/fieldStrengthPreference']
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.fieldStrengthPreferenceLocal = output
        }
        return output
      },
      set: function (newValue) {
        this.fieldStrengthPreferenceLocal = newValue
      },
    },
    ...mapState('dataToParent', ['sequenceType']),
    // ...mapState('scanTimeConfig', ['scanTime']),

    ...mapGetters('scanTimeConfig', ['getAccelFactorPE', 'getParallelFactor']),
    ...mapGetters('dataToParent', ['getscanTime']),
    // Importtant One

    scanTime() {
      return this.getscanTime
    },

    // Importtant One

    accelFactorPE() {
      return this.getAccelFactorPE
    },
  },
  name: 'GEFooterBar',
  components: {
    GESarDisplay,
  },
  data() {
    return {
      showSAR: false,
    }
  },
  methods: {
    ...mapActions('scanTimeConfig', ['acceptChanges']),
    toggleSARDisplay() {
      this.showSAR = !this.showSAR
    },
  },
}
</script>

<style scoped>
.status-bar {
  justify-content: space-between;
  padding: 10px 15px;
  height: 40px;
  gap: 0.3rem;
}

.time {
  display: flex;
  flex-direction: column;
  color: white;
  font-weight: bold;
  flex-wrap: wrap;
  font-size: 12px;
}

.battery,
.icons,
.search-bar,
.up-icon,
.link,
.carrier {
  display: flex;
  align-items: center;
}

.battery {
  padding: 0 1rem 0 1rem;
}

.level,
.link a {
  margin-left: 5px;
}
.btr {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
}

.icon {
  width: 40px;
  height: 30px;
}

.search-bar {
  margin: 0 5px;
}

.level {
  text-align: center;
  margin-left: 0px !important;
  color: white;
  font-size: 12px;
}

.search-bar input {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.carrier {
  margin-left: 5px;
}
::v-deep .theme--light.v-text-field--solo-inverted > .v-input__control > .v-input__slot {
  background: white !important;
  color: black !important;
  min-height: 100% !important;
}

::v-deep .v-input__control {
  min-height: 100% !important;
}

::v-deep .v-input--is-focused .v-input__slot input {
  color: black !important;
}
</style>
