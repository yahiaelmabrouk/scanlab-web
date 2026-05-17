<template>
  <div class="sp-btn-grp">
    <v-text-field
      :size="size"
      :value="selectedInteractableIdent !== null ? selectedInteractableIdent : ''"
      :type="number"
      :min="0"
      number
      hide-details
      :disabled="true"
      class="gray-background"
      append-icon="mdi-menu-down"
    />
    <div class="sp-btn-updown ml-2">
      <v-icon class="btn-2" :disabled="disabled" @click="createSatBand">mdi-plus</v-icon>
      <v-icon
        :disabled="disabled"
        class="btn-2"
        v-shortkey="['del']"
        @shortkey="deleteSelectedInteractable"
        @click="deleteSelectedInteractable"
        >mdi-minus</v-icon
      >
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState, mapGetters, mapActions } from 'vuex'
import EventBus from '../../lib/event-bus'
import { ScanButtonMixin } from '../Mixins/ScanButtonMixin'
import { MriMixin } from '@/components/Mixins/MriMixin'
export default {
  mixins: [ScanButtonMixin, MriMixin],
  name: 'DropDownText',

  props: {
    size: {
      type: String,
      required: false,
      default: 'md',
      validator: function (value) {
        return ['sm', 'md', 'lg'].includes(value)
      },
    },

    value: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
    step: {
      type: Number,
      required: true,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  mounted() {
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
    })
  },
  computed: {
    ...mapState('selectionConfig', ['isAddLocalizerMode']),
    ...mapState({
      selectedInteractableIdent: (state) => state.interactableService.selectedInteractableIdent,
      isFullscreen: (state) => state.selectionConfig.isFullscreen,
      isAddLocalizerMode: (state) => state.selectionConfig.isAddLocalizerMode,
      toolSelected: (state) => state.selectionConfig.toolSelected,
      toolSelectedConfig: (state) => state.selectionConfig.toolSelectedConfig,
      showReferenceLines: (state) => state.selectionConfig.showReferenceLines,
      referenceSliceCornersBySliceViewId: (state) => state.selectionConfig.referenceSliceCornersBySliceViewId,
      hasAddedLocalizer: (state) => state.selectionConfig.hasAddedLocalizer,
    }),
    ...mapGetters('interactableService', [
      'selectedInteractableState',
      'isSatBandSelected',
      'indexOfSelectedSatBand',
      'satBands',
    ]),
    ...mapGetters('testRunService', ['isTakingTest']),
    ...mapGetters('user', ['languageCode', 'softwareVendorPreference', 'softwareVersionPreference']),
    ...mapState('questionService', ['hasAnsweredAllStackQuestions']),
    // ...mapGetters('selectionConfig', ['dotScaleValues']),
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
  },
  methods: {
    ...mapActions('interactableService', ['deleteSelectedInteractable']),
    ...mapActions('questionService', ['jumpToQuestion']),
    ...mapActions('dataToParent', ['updateScanTime']),
    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),
    increaseValue() {
      const newValue = this.value + this.step
      this.valueChange(newValue)
    },
    decreaseValue() {
      const newValue = this.value - this.step
      this.valueChange(newValue)
    },
    valueChange(newValue) {
      if (newValue <= this.min) {
        this.$emit('input', this.min)
      } else if (newValue >= this.max) {
        this.$emit('input', this.max)
      } else {
        this.$emit('input', _.round(newValue / this.step) * this.step)
      }
    },
  },
  watch: {
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
  },
}
</script>

<style scoped>
.sp-btn-grp {
  display: flex;
  width: 100%;
}

.sp-btn-updown {
  display: flex;
  flex-direction: row;
}

::v-deep .v-input__slot:before {
  border: none !important;
}
::v-deep .gray-background .v-input__control .v-input__slot {
  background-color: #b8b8b8 !important; /* Gray background */
  border: 1px solid #000000 !important; /* Black border */
  height: 31px;
}
.gray-background {
  background-color: #c0c0c0;
}
::v-deep .v-text-field > .v-input__control > .v-input__slot > .v-text-field__slot {
  left: 0.5rem;
  width: 150px;
  border-radius: 0px;
  background-color: transparent;
  border: none !important;
  box-shadow: none !important;
  color: black;
  padding: 0;
}
::v-deep .v-input__slot:after {
  border: none !important;
}
.btn-2 {
  width: 20px !important;
  height: 28px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #c0c0c0 !important;
  border-radius: 0px;
  color: black !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}
.v-icon.v-icon {
  color: black !important;
  font-size: 17px !important;
  height: 8px;
}

[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}

.v-text-field {
  font-weight: lighter;
  padding-top: 0px;
  display: flex;
  align-items: center;
  color: white !important;
}
::v-deep .v-input__append-inner {
  margin: 6px 0px 0px -14px;
}
/* Responsive Styles */
@media (max-width: 2048px) {
  /* .sp-btn-grp {
    width: 100%;
  } */
  ::v-deep .v-input__append-inner {
    margin: 6px 0px 0px -14px;
  }
}

@media (max-width: 2304px) {
  /* .sp-btn-grp {
    width: 50%;
  } */
  ::v-deep .v-input__append-inner {
    margin: 6px 0px 0px -14px;
  }
  ::v-deep .v-text-field > .v-input__control > .v-input__slot > .v-text-field__slot {
    left: 0;
  }
}
@media (max-width: 1920px) {
  /* .sp-btn-grp {
    width: 41%;
  } */
  ::v-deep .v-input__append-inner {
    margin: 6px 0px 0px -14px;
  }
}
@media (max-width: 1706.67px) {
  /* .sp-btn-grp {
    width: 33%;
  } */
  ::v-deep .v-input__append-inner {
    margin: 6px 0px 0px -14px;
  }
}
@media (max-width: 1536px) {
  /* .sp-btn-grp {
    width: 25%;
  } */
  ::v-deep .v-input__append-inner {
    margin: 6px 0px 0px -14px;
  }
}

@media (max-width: 1396.36px) {
  /* .sp-btn-grp {
    width: 41%;
  } */
  ::v-deep .v-input__append-inner {
    margin: 6px 0px 0px -14px;
  }
}
@media (max-width: 1228.8px) {
  /* .sp-btn-grp {
    width: 41%;
  } */
  ::v-deep .v-input__append-inner {
    margin: 6px 0px 0px -14px;
  }
}

@media (max-width: 1200px) {
  /* .sp-btn-grp {
    width: 41%;
  } */
  ::v-deep .v-input__append-inner {
    margin: 6px 0px 0px -14px;
  }
}
@media (max-width: 768px) {
  /* .sp-btn-grp {
    width: 41%;
  } */
  ::v-deep .v-input__append-inner {
    margin: 6px 0px 0px -14px;
  }
}

@media (max-width: 480px) {
  /* .sp-btn-grp {
    width: 41%;
  } */
  ::v-deep .v-input__append-inner {
    margin: 6px 0px 0px -14px;
  }
}
</style>
