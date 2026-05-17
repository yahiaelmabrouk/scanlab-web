<!-- eslint-disable prettier/prettier -->
<!-- eslint-disable prettier/prettier -->
<template>
  <div class="sp-btn-updown">
    <div class="sp-btn-grp">
      <v-text-field
        :size="size"
        :value="selectedInteractableIdent !==null ? selectedInteractableIdent : ''"
        type="number"
        :min="0"
        class="text-left"
        number
        hide-details
        :disabled="disabled"
        style="
          border: none;
          padding-right: 4px;
          margin-top: 0px;
          width: 9.5vw;
          max-width: 55%;
          margin-left: 2%;
          color: #fff;
        "
      />
      <div class="sp-btn">
        <v-icon>mdi-menu-down</v-icon>
      </div>
      <div>
        <v-icon class="btn-2" :disabled="disabled" @click="createSatBand">mdi-plus</v-icon>
        <v-icon class="btn-2" :disabled="disabled"  v-shortkey="['del']"
        @shortkey="deleteSelectedInteractable" @click="deleteSelectedInteractable">mdi-minus</v-icon>
      </div>
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
.sp-btn {
  display: flex;
  flex-direction: column;
  padding-left: 5px;
}

.sp-btn-grp {
  display: flex;
}

.sp-btn-updown {
  display: flex;
  background: #383535;
}

::v-deep .v-input__slot:before {
  border: none !important;
}

::v-deep .v-input__slot:after {
  border: none !important;
}
.btn-2 {
  width: 20px !important;
  height: 15px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #423c3c !important;
  border-radius: 0px;
  margin: 0.15rem;
}
.v-icon.v-icon {
  color: white !important;
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

/* .v-btn {
    height: 8px !important;
    min-width: 22px !important;
    padding: 0px 10px !important;
    width: 22px !important;
    background:#C0C0C0 !important;
    border-radius: 0px !important;
    border-bottom: 1px solid black !important;
    border-right: 1px solid black !important;
    border-top: 2px solid white !important;
    border-left: 2px solid white !important;
    border-width: thin !important;
  } */
</style>
