<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="toolbar-cls">
    <!-- Any Icon -->
    <span class="TR">
      <span>T2_TRA</span>
      <span style="display: flex">
        <span v-if="getIsUltraLab">{{ scanTime }}</span>
        <span><v-icon>mdi-arrow-up</v-icon></span>
      </span>
    </span>

    <span style="text-align: justify; padding-left: 1rem">
      <span class="voxel">
        <span style="display: flex"> <span>Voxel</span><v-spacer style="flex: 0.1"></v-spacer><span>Tra</span> </span>
        <span style="text-align: justify" class="text-white">
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <p class="" v-bind="attrs" v-on="on" v-if="isResolutionLab" style="margin: 0 5px">
                {{ trueResolutionHeaderUltra }}
              </p>
              <p
                class=""
                v-bind="attrs"
                v-on="on"
                v-else-if="getIsUltraLab"
                style="margin: 0 5px; display: flex; align-items: center"
              >
                <CubeOutlineIcon /> {{ trueResolutionHeaderUltra }}
              </p>
              <p class="" v-bind="attrs" v-on="on" v-else style="margin: 0 5px">
                {{ trueResolutionHeaderUltra }}
              </p>
            </template>
            <p class="resolution-tooltip">{{ $t('SelectionConfigForm.reconstructed-resolution') }}</p>
            <p class="resolution-tooltip">{{ trueResolutionHeaderUltra }}</p>
          </v-tooltip>
        </span>
      </span>
    </span>

    <span class="snr">
      <span> Rel.SNR</span>
      <span style="display: flex">
        <span> 0.88 </span>
        <span>
          <v-icon>mdi-arrow-down</v-icon>
        </span>
      </span>
    </span>

    <div class="TE">
      <span class="TEpad">
        <span style="display: flex; flex-direction: column">
          <span><b>TE</b></span>
          <span>{{ getTESync }}</span>
        </span>
      </span>
      &MediumSpace;&MediumSpace;
      <span class="TEpad">
        <span style="display: flex; flex-direction: column">
          <span><b>TR</b></span>
          <span style="display: flex; padding-left: 1rem">
            <span>{{ getTRSync }}</span>
            <span>
              <v-icon>mdi-arrow-up</v-icon>
            </span>
          </span>
        </span>
      </span>
    </div>

    <!-- 'Display' Icon and Additional Icons -->
    <v-btn width="15px" height="20px" style="min-width: 15px">
      <v-icon style="font-size: 14px">mdi-undo-variant</v-icon>
    </v-btn>
    <v-btn width="15px" height="20px" style="min-width: 15px">
      <v-icon style="font-size: 14px">mdi-redo-variant</v-icon>
    </v-btn>

    <v-btn
      block
      outlined
      class="add-btn"
      style="background: #d5d7d7; width: 5rem; border-right: 1px solid white; margin-left: 2px"
      @click="acceptChanges"
    >
      Accept
      <v-icon right>mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      dropdownOptions: ['Option 1', 'Option 2', 'Option 3'],
    }
  },
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
  methods: {
    ...mapActions('scanTimeConfig', ['acceptChanges']),
    handleIconClick(iconName) {
      // Implement functionality for each icon click
      console.log(`Clicked on icon: ${iconName}`)
    },
    handleDropdownOptionClick(option) {
      // Implement functionality for dropdown option click
      console.log(`Selected dropdown option: ${option}`)
    },
  },
}
</script>

<style scoped>
/* Add your styling for the toolbar, icons,   and separators here */
.grow,
.spacer {
  flex-grow: 0.8 !important;
}
.toolbar-cls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #676866;
  /* padding: 1.5rem 1rem 1.5rem 1rem; */
  color: white;
  /* height: 39px; */
  width: 100%;
}
.TR {
  display: flex;
  flex-direction: column;
  border-right: 1px solid white;
  padding-right: 3.5rem;
}
.voxel {
  display: flex;
  justify-content: start;
  flex-direction: column;
  width: 11.3rem;
}
.snr {
  display: flex;
  flex-direction: column;
  border-right: 1px solid white;
  padding-right: 1rem;
}
.TE {
  display: flex;
  justify-content: start;
  border-right: 1px solid white;
  padding: 0 1rem 0px 1rem;
}
.TEpad {
  padding-top: 0.4rem;
}
.icon-btn {
  margin-right: 0.5rem;
}

.icon-size {
  height: 12px;
  font-size: 17px;
}

.separator {
  margin: 0 0.5rem;
  color: white;
}

.dropdown {
  width: 100px;
  /* Adjust the width as needed */
}

.add-btn {
  height: 17px !important;
  align-content: right !important;
  font-size: 9px !important;
  min-width: 25px !important;
  padding: 0 8px !important;
  background: white;
  margin-left: auto;
}
@media (min-width: 1200px) and (max-width: 1240px) {
  .toolbar-cls {
    /* flex-direction: column; */
    align-items: stretch;
    height: 48px;
    padding: 0.3rem;
  }

  .TR,
  .snr {
    border-right: none;
    padding-right: 0;
    margin-bottom: 1rem;
  }

  .TE {
    border-right: none;
    padding: 0;
    margin-bottom: 1rem;
    margin-left: 11px;
  }
  .TEpad {
    padding-top: 0rem;
  }
  .add-btn {
    width: 100%; /* Take up full width on small screens */
    margin-left: 0; /* Remove left margin on small screens */
  }
  .voxel {
    display: flex;
    justify-content: start;
    flex-direction: column;
    width: 10rem;
  }
}
@media (min-width: 1241px) and (max-width: 1600px) {
  .toolbar-cls {
    /* flex-direction: column; */
    align-items: stretch;
    height: 48px;
    padding: 0.3rem;
    font-size: 12px;
  }

  .TR {
    display: flex;
    flex-direction: column;
    border-right: 1px solid white;
    padding-right: 5rem;
    align-items: baseline;
  }

  .TE {
    border-right: none;
    padding: 0;
    margin-bottom: 1rem;
    margin-left: 11px;
  }
  .TEpad {
    padding-top: 0rem;
  }
  .add-btn {
    width: 100%; /* Take up full width on small screens */
    margin-left: 0; /* Remove left margin on small screens */
  }
  .voxel {
    display: flex;
    justify-content: start;
    flex-direction: column;
    width: 8.3rem;
  }
}
@media (min-width: 1601px) and (max-width: 2490px) {
  .toolbar-cls {
    /* flex-direction: column; */
    align-items: stretch;
    height: 56px;
    padding: 0.3rem;
    font-size: 12px;
  }

  .TR {
    display: flex;
    flex-direction: column;
    border-right: 1px solid white;
    padding-right: 7rem;
    align-items: baseline;
  }

  .TE {
    border-right: none;
    padding: 0;
    margin-bottom: 1rem;
    margin-left: 11px;
  }
  .TEpad {
    padding-top: 0rem;
  }
  .add-btn {
    width: 100%; /* Take up full width on small screens */
    margin-left: 0; /* Remove left margin on small screens */
  }
  .voxel {
    display: flex;
    justify-content: start;
    flex-direction: column;
    width: 8.3rem;
  }
}
</style>
