<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="toolbar-cls">
    <!-- Dropdown arrow (always visible) -->

    <!-- Toolbar Content (visible when showToolbar is true) -->
    <v-toolbar v-if="showToolbar" :style="{ height: showToolbar ? '5%' : '2%' }" color="#3a3636" height="43px">
      <!-- Toolbar icons -->
      <img src="@/assets/siemens_img/xo.png" />
      <img src="@/assets/siemens_img/triangle.png" />
      <img src="@/assets/siemens_img/cross-one.png" />
      <v-btn
        dense
        mandatory
        @click="createSatBand"
        :disabled="isButtonDisabled || !mayAddSatBand"
        v-shortkey="['del']"
        @shortkey="deleteSelectedInteractable"
        style="margin: 0%"
        :class="['satband-btn', { 'satband--active': isSatBandActive > 0 }]"
      >
        <img
          :src="
            isButtonDisabled || !mayAddSatBand
              ? require('@/assets/siemens_img/scan.png')
              : require('@/assets/siemens_img/setband_not_active.png')
          "
          :class="isSatBandActive > 0 ? 'img-selected' : 'img-size'"
        />
      </v-btn>

      <img src="@/assets/siemens_img/pin.png" />
      <img src="@/assets/siemens_img/up-one.png" />
      <img src="@/assets/siemens_img/arrow.png" />
      <img src="@/assets/siemens_img/up-two.png" />

      <!-- Toggle between List and Volume View -->
      <v-btn-toggle v-model="isVolumeViewMode" dense mandatory>
        <v-btn :value="false">
          <img :class="isVolumeViewMode ? 'img-size' : 'img-selected'" src="@/assets/siemens_img/list.png" />
        </v-btn>
        <v-btn :value="true">
          <img :class="isVolumeViewMode ? 'img-selected' : 'img-size'" src="@/assets/siemens_img/volumeview.png" />
        </v-btn>
      </v-btn-toggle>

      <!-- Other icons -->
      <img src="@/assets/siemens_img/box-one.png" />
      <img src="@/assets/siemens_img/person.png" />

      <v-btn :v-model="toggleReferenceLines" @click="toggleReferenceLines = !toggleReferenceLines" style="margin: 0%">
        <img
          :src="
            !showReferenceLines
              ? require('@/assets/siemens_img/person-two.png')
              : require('@/assets/siemens_img/reflines.png')
          "
          :class="isVolumeViewMode ? 'img-size' : 'img-selected'"
        />
      </v-btn>

      <img src="@/assets/siemens_img/person-one.png" />
      <img src="@/assets/siemens_img/lines.png" />
      <img src="@/assets/siemens_img/setting.png" />
      <img src="@/assets/siemens_img/magnify.png" @click="toggleToolbar" />

      <!-- Slider -->
      <div class="dot-size">
        <h6 class="mt-2 mx-1">Dot Size</h6>
        <v-slider v-model.number="dotScaleMultiplierIndex" :min="0" :max="dotScaleValues.length - 1" ticks />
      </div>
    </v-toolbar>
    <div class="expand-bar">
      <v-icon
        color="#ffffff"
        size="25"
        @click="toggleToolbar"
        :class="{ 'rotate-icon': showToolbar }"
        :style="{ 'margin-top': showToolbar ? '4.5%' : '0%' }"
      >
        mdi-menu-down
      </v-icon>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'
import _ from 'lodash'
import EventBus from '../../lib/event-bus'
import { ScanButtonMixin } from '../Mixins/ScanButtonMixin'
import { MriMixin } from '@/components/Mixins/MriMixin'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin'
export default {
  //mixins: [ScanButtonMixin, MriMixin, SelectionConfigMixin],
  //mixins: [SelectionConfigMixin],
  name: 'SiemensToolbar',
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showToolbar: false, // Controls toolbar visibility
    }
  },
  mounted() {
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
      console.log('this.getRepetitionTime', this.getRepetitionTime)
      console.log('this.getMinConcatAcqPackagefuture', this.getMinConcatAcqPackagefuture)
    })
  },
  computed: {
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'selectedStackQuestionIndexVisual',
      'scanSubmittedByStackQuestionId',
      'scanSubmitted',
    ]),
    ...mapGetters('user', ['vendorStylePreferenceOptions', 'languageCode']),
    ...mapState('selectionConfig', ['isAddLocalizerMode', 'showReferenceLines']),
    ...mapGetters('selectionConfig', ['dotScaleValues']),
    ...mapGetters('scanTimeConfig', [
      'getRepetitionTime',
      'getMinConcatAcqPackage',
      'getSlices',
      'getMinSeqTRfuture',
      'getMinConcatAcqPackagefuture',
    ]),
    ...mapGetters('interactableService', ['mayAddSatBand', 'selectedInteractableState']),
    toggleReferenceLines: {
      get() {
        return this.$store.state.selectionConfig.showReferenceLines
      },
      set(toggleReferenceLines) {
        this.$store.dispatch('selectionConfig/setShowReferenceLines', toggleReferenceLines)
      },
    },
    isVolumeViewMode: {
      get() {
        return this.$store.state.selectionConfig.isVolumeViewMode
      },
      set(isVolumeViewMode) {
        this.$store.dispatch('selectionConfig/setIsVolumeViewMode', isVolumeViewMode)
      },
    },
    dotScaleMultiplierIndex: {
      get() {
        return _.indexOf(this.dotScaleValues, this.dotScaleMultiplier)
      },
      set(index) {
        this.dotScaleMultiplier = this.dotScaleValues[index]
        if (!this.dotScaleMultiplier) {
          throw Error('set dotScaleMultiplier out of bounds')
        }
      },
    },
    dotScaleMultiplier: {
      get() {
        return this.$store.state.selectionConfig.dotScaleMultiplier
      },
      set(dotScaleMultiplier) {
        this.$store.dispatch('selectionConfig/setDotScaleMultiplier', dotScaleMultiplier)
      },
    },
    isButtonDisabled() {
      return this.getRepetitionTime < this.getMinConcatAcqPackagefuture
    },
  },
  methods: {
    ...mapActions('interactableService', ['deleteSelectedInteractable', 'createSatBand']),
    ...mapActions('questionService', ['jumpToQuestion']),

    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),
    toggleToolbar() {
      this.showToolbar = !this.showToolbar
      this.$emit('update:showToolbar', this.showToolbar)
    },
  },
}
</script>

<style scoped>
img {
  margin: 0.5%;
  height: 75%;
}

.img-size {
  margin: 1%;
  height: 25px;
}

.img-selected {
  margin: 1%;
  height: 25px;
  background: gray;
}

.toolbar-cls {
  height: 100% !important;
  background-color: rgb(58, 54, 54);
}

.v-btn,
.v-icon {
  background-color: rgb(58, 54, 54);
  margin-top: 3%;
}

.dot-size {
  background: white !important;
  height: 2rem;
  width: 30%;
  display: flex;
}

.expand-bar {
  background: #3a3636;
  width: 100%;
  display: flex;
  justify-content: center;
  height: 28px !important;
}

.rotate-icon {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

::v-deep .theme--light.v-btn.v-btn--has-bg {
  background-color: transparent !important;
}

.theme--light.v-btn-toggle:not(.v-btn-toggle--group) {
  background: transparent !important;
  color: rgba(0, 0, 0, 0.87);
}
/* .v-btn--active:before,
.v-btn--active:hover:before {
  opacity: 0.18;
} */
::v-deep .v-sheet.v-toolbar:not(.v-sheet--outlined) {
  box-shadow: none !important;
}

::v-deep.v-btn--is-elevated {
  box-shadow: none !important;
}
.satband-btn {
  background-color: transparent;
}

.satband--active:before,
.satband--active:hover:before {
  background-color: black;
  opacity: 0.18;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  img {
    height: 60%; /* Adjust image height for medium screens */
  }

  .dot-size {
    width: 40%; /* Increase dot size width on medium screens */
  }

  .expand-bar {
    height: 24px !important; /* Slightly reduce the expand bar height */
  }
}

@media (max-width: 768px) {
  img {
    height: 50%; /* Further reduce image height for smaller screens */
  }

  .img-size,
  .img-selected {
    height: 20px; /* Adjust image size for smaller screens */
  }

  .dot-size {
    width: 50%; /* Increase dot size width on smaller screens */
    height: 1.5rem; /* Adjust dot size height */
  }

  .expand-bar {
    height: 20px !important; /* Further reduce expand bar height */
  }

  .toolbar-cls {
    height: auto !important; /* Allow toolbar height to adjust */
  }
}

@media (max-width: 480px) {
  img {
    height: 40%; /* Reduce image height for very small screens */
  }

  .img-size,
  .img-selected {
    height: 18px; /* Adjust image size for very small screens */
  }

  .dot-size {
    width: 60%; /* Increase dot size width on very small screens */
    height: 1rem; /* Adjust dot size height */
  }

  .expand-bar {
    height: 16px !important; /* Reduce expand bar height */
  }
}
</style>
