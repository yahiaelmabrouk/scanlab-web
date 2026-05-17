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
        <label>{{ $t('global.phase_voxel_size') }}:</label>
        {{ round(configItems.phaseVoxelSize, 2) + 'mm' }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.frequency_voxel_size') }}:</label>
        {{ round(configItems.frequencyVoxelSize, 2) + 'mm' }}
      </div>

      <div class="config-item" v-if="configItems.sequenceType === 'GRE'">
        <label>{{ $t('SelectionConfigForm.flip_angle') }}:</label>
        {{ round(configItems.flipAngle, 1) }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.phase_matrix') }}:</label>
        {{ round(configItems.phaseMatrix, 0) }}
        {{ '(' + round((configItems.phaseMatrix / configItems.frequencyMatrix) * 100) + '%' + ')' }}
      </div>
      <div class="config-item">
        <label
          >{{
            configItems.vendorStyle
              ? labels.frequencyMatrixLabel[configItems.vendorStyle.trim()]
              : $t(frequencyMatrixLabel)
          }}:</label
        >
        {{ round(configItems.frequencyMatrix, 0) }}
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
  name: 'TestResultsConfigItemsResolution',
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
    convertFrequencyMatrixLabel(vendorStyle) {
      return vendorStyle === 'siemens' ? 'global.base_matrix' : 'global.frequency_matrix'
    },
    convertSpacing,
    convertDimensionY,
    convertDimensionX,
    convertReceiverBandwidth,
  },
  computed: {
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
