<template>
  <v-card elevation="2">
    <div class="config-items">
      <div class="config-item">
        <label>{{ $t('global.number_of_slices') }}:</label>
        {{ configItems.numberOfSlices }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.slice_thickness_mm') }}:</label>
        {{ round(configItems.thickness, 1) }}
      </div>
      <div class="config-item">
        <label
          >{{ configItems.vendorStyle ? labels.gap[configItems.vendorStyle.trim()] : $t('global.slice_gap') }}:</label
        >
        {{
          configItems.vendorStyle
            ? convertSpacing(configItems.spacing, configItems.vendorStyle, configItems.thickness)
            : round(configItems.spacing, 1)
        }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.phase_mm') }}:</label>
        {{
          configItems.vendorStyle
            ? convertDimensionX(configItems.dimensionX, configItems.vendorStyle, configItems.dimensionY)
            : round(configItems.dimensionX, 1)
        }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.frequency_mm') }}:</label>
        {{
          configItems.vendorStyle
            ? convertDimensionY(configItems.dimensionY, configItems.vendorStyle)
            : round(configItems.dimensionY, 1)
        }}
      </div>

      <div class="config-item">
        <label>{{ $t('SelectionConfigForm.sequence') }}:</label>
        {{ sequenceType }}
      </div>
      <div class="config-item">
        <label>{{ $t('SelectionConfigForm.field_strength') }}:</label>
        <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
        {{ configItems.fieldStrength }} T
      </div>
      <div class="config-item">
        <label>{{ $t('SelectionConfigForm.repetition_time') }}:</label>
        {{ round(configItems.repetitionTime, 1) + 'ms' }}
      </div>
      <div class="config-item">
        <label>{{ $t('SelectionConfigForm.echo_time') }}:</label>
        {{ round(configItems.echoTime, 1) + 'ms' }}
      </div>
      <div class="config-item" v-if="configItems.inversionRecovery">
        <label>{{ $t('SelectionConfigForm.inversion_time') }}:</label>
        {{ round(configItems.inversionTime, 1) }}
      </div>
      <div class="config-item" v-if="configItems.sequenceType === 'GRE'">
        <label>{{ $t('SelectionConfigForm.flip_angle') }}:</label>
        {{ round(configItems.flipAngle, 1) }}
      </div>
      <div class="config-item">
        <label
          >{{
            configItems.vendorStyle
              ? labels.wrapPrevent[configItems.vendorStyle.trim()]
              : $t('SelectionConfigForm.oversampling')
          }}:</label
        >
        {{ round(configItems.oversampling, 2) * 100 }}%
      </div>
      <div class="config-item">
        <b-form-checkbox v-model="configItems.fatSuppression" :disabled="true">
          {{ $t('SelectionConfigForm.fat_suppression') }}
        </b-form-checkbox>
      </div>
      <div class="config-item">
        <b-form-checkbox v-model="configItems.inversionRecovery" :disabled="true">
          {{ $t('SelectionConfigForm.inversion_recovery') }}
        </b-form-checkbox>
      </div>
    </div>
  </v-card>
</template>

<script>
import _ from 'lodash'
import {
  createLabels,
  convertSpacing,
  convertDimensionY,
  convertDimensionX,
  convertReceiverBandwidth,
} from '@/lib/vendor-label-value.util.js'

export default {
  name: 'TestResultsConfigItemsContrast',
  props: {
    configItems: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {}
  },
  methods: {
    round: _.round,
    convertSecondsToMinutesAndSeconds(seconds) {
      const min = _.round(seconds / 60, 0)
      const sec = _.round(seconds % 60, 0)
      return `${min}:${sec}`
    },
    convertSequenceType(sequenceType) {
      return sequenceType === 'TE' ? 'FSE' : sequenceType
    },
    convertFrequencyMatrixLabel(vendorStyle) {
      return vendorStyle === 'siemens' ? 'global.base_matrix' : 'global.frequency_matrix'
    },
    convertSpacing,
    convertDimensionY,
    convertDimensionX,
    convertReceiverBandwidth,
  },
  computed: {
    scanTime() {
      return this.convertSecondsToMinutesAndSeconds(this.configItems.scanTime)
    },
    sequenceType() {
      return this.configItems.vendorStyle
        ? this.labels.sequenceTypeLabel[this.configItems.vendorStyle][this.configItems.sequenceType]
        : this.convertSequenceType(this.configItems.sequenceType)
    },
    frequencyMatrixLabel() {
      return this.convertFrequencyMatrixLabel(this.configItems.vendorStyle)
    },
    labels() {
      return createLabels(this.$t.bind(this))
    },
  },
}
</script>

<style scoped lang="scss">
.config-items {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;

  .config-item {
    padding: 5px 20px;

    label {
      font-weight: bold;
    }
  }
}
</style>
