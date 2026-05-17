<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-card-text>
      <div class="main-1 my-2">
        <div class="text-3">
          <label class="label-size-1">TimCT mode</label>
          <v-select
            color="#423c3c"
            :items="options"
            v-model="TimCT"
            dense
            outlined
            style="width: 14vw; max-width: 25%; margin-left: 2%"
          />
        </div>
        <div class="text-3 my-5">
          <label class="label-size">Slices</label>
          <BspinButton
            class="input-lock"
            @input="submitNumberOfSlices"
            :type="'number'"
            v-model.number="numberOfSlices"
            :step="1"
            :min="1"
            :max="300"
            :disabled="complete || isAddLocalizerMode"
          />
        </div>
        <div class="text-3">
          <label class="label-size">Slice thickness</label>

          <BspinButton
            class="input-lock"
            @input="submitThickness"
            :type="'number'"
            v-model.number="thickness"
            :step="0.5"
            :min="0"
            :max="50"
            :disabled="complete"
          />
          <span class="mx-2">mm</span>
        </div>

        <div class="text-3">
          <label class="label-size">Dist.factor</label>

          <BspinButton
            class="input-lock"
            @input="submitSpacing"
            :type="'number'"
            v-model.number="spacing"
            :step="1"
            :min="1"
            :max="300"
            :disabled="complete"
          />
          <span class="mx-2">%</span>
        </div>
        <div class="text-3">
          <label class="label-size">FoV read</label>
          <BspinButton
            class="input-lock"
            @input="submitDimensions3y"
            :type="'number'"
            v-model.number="dimensions3y"
            :step="1"
            :min="1"
            :max="500"
            :disabled="complete || isAddLocalizerMode"
          />
          <span class="mx-2">mm</span>
        </div>
        <div class="text-3">
          <label class="label-size">FoV phase</label>
          <BspinButton
            class="input-lock"
            @input="submitDimensions3x"
            :type="'number'"
            v-model.number="dimensions3x"
            :step="1"
            :min="1"
            :max="500"
            :disabled="complete || isAddLocalizerMode"
          /><span class="mx-2">%</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from './BspinButton.vue'
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
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
      options: ['Off', 'IR', 'ADS', 'DECT', 'CD4D', 'TBDE', 'SAFIRE', 'ASIR'],
      TimCT: 'off',
    }
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    ...mapActions('dataToParent', ['updateScanTime']),
    submitOversampling() {
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustOversamplingByUser', { oversampling: this.oversamplingLocal })
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
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    oversamplingPercentage: {
      // 0.0 - 100.0
      get() {
        return _.round(this.oversampling * 100, 1)
      },
      set(oversamplingPercentage) {
        this.oversampling = oversamplingPercentage / 100
      },
    },
    oversampling: {
      // 0.0 - 1.0, where 1.0 means each side of oversampling is as wide as 0.5*Phase(aka Dim3.x), so both sides added together would be as wide as Phase
      get() {
        return _.get(this.selectionConfig, 'oversampling')
      },
      set(oversampling) {
        this.oversamplingLocal = oversampling
      },
    },
    spacing: {
      get() {
        let output = _.get(this.selectionConfig, 'spacing')
        if (this.isUltraLab && this.vendorStylePreference === 'siemens' && !this.isAddLocalizerMode) {
          // convert mm to %
          output = output !== 0 ? _.round((output / this.thickness) * 100) : 0
        }
        return output
      },
      set(spacing) {
        let input = spacing
        if (this.isUltraLab && this.vendorStylePreference === 'siemens' && !this.isAddLocalizerMode) {
          // convert % to mm
          input = _.round((this.thickness / 100) * input, 2)
        }
        this.spacingLocal = input
      },
    },
    thickness: {
      get() {
        const val = _.get(this.selectionConfig, 'thickness')
        return val
      },
      set(thickness) {
        this.thicknessLocal = thickness
      },
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
.v-btn {
  font-size: 11px !important;
  background: #c0c0c0 !important;
  color: #ffffff !important;
  border: 1px solid #c0c0c0;
  border-radius: none;
  color: white !important;
  border-top: none !important;
  border-right: none !important;
}
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}
.label-size-1 {
  width: 36%;
  display: flex;
  justify-content: right;
}
::v-deep .v-text-field__details {
  display: none;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}
.v-input--is-focused {
  display: block !important;
}
label,
span {
  color: black;
  font-size: 80%;
}
.text-2 {
  display: flex;
  /* justify-content: flex-start; */
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}
.text-3 {
  display: flex;
  justify-content: flex-start;
}
::v-deep .v-input__icon {
  height: 11px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
}
::v-deep .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__append-inner {
  margin-top: 5px !important;
}
::v-deep .v-input__append-inner {
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
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
::v-deep .v-input__slot fieldset {
  background: white !important;
  border-color: white !important;
  border-radius: 0px;
}
.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.05rem;
  width: 35%;
  margin-left: 2%;
}
::v-deep .v-input__slot fieldset {
  background: white;
  border-color: white !important;
  border-radius: 0px;
}
::v-deep .v-icon.v-icon {
  color: black !important;
  font-size: 17px;
}
.v-input {
  max-width: 30%;
  border-radius: 0px;
}
::v-deep .v-text-field input {
  padding: 0px;
}
.btn-2 {
  width: 20px !important;
  height: 15px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #c0c0c0 !important;
  border-radius: 0px;
}
::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: 0px !important;
}
.main-1 {
  width: 50%;
  display: flex;
  flex-direction: column;
  align-content: flex-start;
  justify-content: flex-start;
}

.btn-1 {
  display: flex;
  width: 66.75%;
  justify-content: space-between;
}
.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
  height: 86%;
}
.v-sheet.v-card {
  border-radius: 0px;
}
</style>
