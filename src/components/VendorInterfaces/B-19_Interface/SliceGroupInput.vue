<template>
  <div class="sp-btn-updown">
    <div class="sp-btn-grp">
      <v-text-field
        v-model="currentValue"
        :size="size"
        :value="null"
        type="number"
        :min="0"
        class="text-left"
        number
        hide-details
        append-icon="mdi-menu-down"
        :disabled="disabled"
        style="border: none; color: #fff"
      />

      <div class="ml-1 mb-2">
        <v-btn class="btn-1" @click="increaseValue"> <v-icon>mdi-plus</v-icon></v-btn>
        <v-btn class="btn-1" @click="decreaseValue"><v-icon>mdi-minus</v-icon></v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState, mapGetters, mapActions } from 'vuex'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
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
  data() {
    return {
      currentValue: this.value, // Create a local copy of the value prop
    }
  },
  watch: {
    currentValue(newValue) {
      this.$emit('input', newValue)
    },
    value(newValue) {
      this.currentValue = newValue
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

    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),

    increaseValue() {
      const newValue = this.currentValue + this.step
      this.currentValue = Math.min(newValue, this.max) // Ensure it doesn't exceed max
    },
    decreaseValue() {
      const newValue = this.currentValue - this.step
      this.currentValue = Math.max(newValue, this.min) // Ensure it doesn't go below min
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
}
</script>

<style scoped>
.sp-btn {
  display: flex;
  flex-direction: column;
  /* padding-left: 5px; */
}

.sp-btn-grp {
  display: flex;
  align-items: baseline;
  width: 74%;
  margin-left: 3px !important;
}

.sp-btn-updown {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  width: 35%;
}

::v-deep .v-input__slot:before {
  border: none !important;
}
::v-deep .v-input__slot:after {
  border: none !important;
}
.v-icon.v-icon {
  color: black !important;
  font-size: 15px !important;
}

[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}

.v-text-field {
  /* font-weight: lighter;
  padding-top: 0px;
  display: flex;
  align-items: center;
  color: white !important;
  background: white;
  height: 17px;
  width: 70px; */

  border: none !important;
  font-weight: lighter;
  padding-top: 0px;
  display: flex;
  align-items: center;
  background: white;
  width: 35%;
}

.btn-1 {
  height: 20px !important;
  min-width: 22px !important;
  padding: 0px 10px !important;
  width: 22px !important;
  background: #c0c0c0 !important;
  border-radius: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
  border-width: thin !important;
}
::v-deep .v-text-field .v-input__append-inner,
.v-text-field .v-input__prepend-inner {
  margin-top: 0px !important;
}
</style>
