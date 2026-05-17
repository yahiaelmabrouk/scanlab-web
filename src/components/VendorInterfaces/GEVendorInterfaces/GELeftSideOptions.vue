<template>
  <div
    style="
      box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
      width: auto;
      height: 40%;
    "
  >
    <v-card style="height: 100%">
      <v-card-text style="height: 100%">
        <v-row style="height: 100%">
          <v-col class="d-flex flex-column align-center justify-between" style="height: 100%">
            <v-row class="d-flex align-center justify-center" style="height: 20%">
              <v-btn
                v-if="!isComplete"
                @click="emitSaveRx"
                style="background: none; border: 1px solid"
                :disabled="isSavedRxActiveFlag"
                >Save Rx</v-btn
              >
              <v-btn
                v-if="isComplete"
                @click="handleClick"
                :class="showAttention ? 'attention-glow' : ''"
                style="background: none; border: 1px solid"
                >{{ $t('global.proceed') }}</v-btn
              >
              <v-btn
                v-if="stackQuestion && stackQuestion.freebie && !isEditingQuestion"
                @click="skipQuestion()"
                class="button-skip"
                :disabled="isDisableSkipButton"
                >Skip</v-btn
              >
            </v-row>

            <v-row class="d-flex align-center justify-center" style="height: 25%">
              <v-col
                v-if="[1, 100, 141, 148].includes(currentBodyPartId) || [32, 134, 206, 160].includes(dicomFileSetId)"
                class="d-flex flex-column align-center justify-between"
              >
                <img src="@/assets/ge_img/man_laying_head_first.png" alt="" style="width: 28%" />
                <p class="text-center">Head First, Spine</p>
              </v-col>
              <v-col v-else class="d-flex flex-column align-center justify-between">
                <img src="@/assets/ge_img/man_laying_feet_first.png" alt="" style="width: 80%" />
                <p class="text-center">Feet First, Spine</p>
              </v-col>
            </v-row>

            <v-row class="d-flex align-center justify-center col" style="height: 30%">
              <v-col class="d-flex flex-column align-center justify-between">
                <v-btn style="background: none; border: 1px solid" @click="openImagingOption()"
                  >Imaging Options...</v-btn
                >
                <p class="text-center">{{ selectedImagingOptions.selectedMode }} {{ familyOptionLabel }}</p>
                <p class="" style="margin-bottom: 0px !important">
                  {{ imagingOptionLabel }}
                </p>

                <!-- <p class="text-center">Seq, EDR, TRF, Fast, SS, ARC</p> -->
              </v-col>

              <!-- <v-list class="text-center">
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>2D Spin Echo</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>Seq, EDR, TRF, Fast, SS, ARC</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list> -->
            </v-row>

            <v-row class="d-flex align-center justify-center" style="height: 25%">
              <v-col class="d-flex flex-column align-center justify-between">
                <v-btn style="background: none; border: 1px solid">Anatomical Regions...</v-btn>
                <p class="text-center">Brain</p>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import { ScanButtonMixin } from '@/components/Mixins/ScanButtonMixin'
import { stopMriLoop } from '@/lib/mri-audio'

export default {
  mixins: [SelectionConfigMixin, MriMixin, ScanButtonMixin],
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
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
    ...mapGetters('questionService', ['currentBodyPartId']),
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

    familyOptionLabel() {
      let temp = this.selectedImagingOptions.pulseOption
      switch (temp) {
        case 'fse':
          temp = 'FSE'
          break
        case 'ir':
          temp = 'IR'
          break
        case 'spinEcho':
          temp = 'Spin Echo'
          break
        case 'dwEpi':
          temp = 'Spin Echo'
          break
        case 'gre':
          temp = 'Gradient Echo'
          break
        default:
          break
      }
      return temp
    },
    imagingOptionLabel() {
      let temp = [...this.selectedImagingOptions.imagingOptions]

      if (temp.includes('None')) {
        return 'None'
      }
      switch (this.selectedImagingOptions.familyOption) {
        case 'fastSpinEcho':
          temp.unshift('Fast')
          break
        case 'echoPlanarImaging':
          temp.unshift('EPI', 'DIFF')
          break
        case 'gradientEcho':
          break
        default:
          break
      }
      if (temp.length === 0) {
        temp[0] = 'None'
      }

      return temp.join(', ')
    },
  },
  name: 'GEPosterior',
  data() {
    return {
      activeTab: 'coil', // Default active tab
      tabs: [
        { id: 'coil', label: 'Coil', content: 'Content for Tab 1' },
        { id: 'protocolNotes', label: 'Protocol Notes', content: 'Content for Tab 2' },
        { id: 'waveForms', label: 'Wave Forms', content: 'Content for Tab 3' },
      ],
      showAttention: true,
      dicomFileSetId: null,
    }
  },
  methods: {
    ...mapActions('scanTimeConfig', ['acceptChanges']),
    setActiveTab(tabId) {
      this.activeTab = tabId
    },
    openImagingOption() {
      this.forcedIsImagingOptionActive = true
    },
    emitSaveRx() {
      this.forcedIsSavedRxActive = true
    },
    handleClick() {
      this.showAttention = false
      stopMriLoop()
      this.proceedToTakingPostQuestions()
    },
  },
  mounted() {
    this.dicomFileSetId = Number(this.$route.query.dicom)
  },
}
</script>
<style scoped>
.row {
  flex-wrap: nowrap !important;
}
.text-center {
  margin-bottom: 0px !important;
}
::v-deep .v-btn:not(.v-btn--round).v-size--default {
  height: 48px;
}
::v-deep .theme--light.v-card {
  background-color: transparent !important;
  height: 100%;
}
::v-deep .theme--light.v-list {
  background-color: transparent !important;
}
::v-deep .v-sheet.v-card:not(.v-sheet--outlined) {
  box-shadow: none;
}
::v-deep .v-list-item {
  min-height: 28px !important;
}
.v-btn {
  background: #8c98be !important;
  /* color: white !important; */
  /* font-size: 10px !important; */
  /* text-transform: inherit !important; */

  border-radius: 4px; /* Rounded edges */
  box-shadow: inset 1px 1px 2px rgba(255, 255, 255, 0.3), /* Light upper-left */ inset -1px -1px 2px rgba(0, 0, 0, 0.6); /* Dark lower-right */
  border: 1px solid rgba(255, 255, 255, 0.2); /* Subtle border */
  font-weight: 500;
  /* min-width: 50px; */
}
.button-skip {
  position: absolute;
  right: 5px;
  border: 1px solid;
  height: 30px !important;
  width: 75px !important;
}
.attention-glow {
  animation: pulse-glow 1.5s infinite ease-in-out;
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.5); /* Orange color */
  }
  50% {
    box-shadow: 0 0 10px 4px rgba(255, 165, 0, 1); /* Stronger orange glow */
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.5); /* Back to faint orange */
  }
}
</style>
