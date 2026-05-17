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
      <div v-if="!isSingleSlice" class="config-item">
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
        <label>{{ $t('global.frequency_mm') }}:</label>
        {{
          configItems.vendorStyle
            ? convertDimensionY(configItems.dimensionY, configItems.vendorStyle)
            : round(configItems.dimensionY, 1)
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
    </div>
  </v-card>
</template>

<script>
import _ from 'lodash'
import { createLabels, convertSpacing, convertDimensionY, convertDimensionX } from '@/lib/vendor-label-value.util.js'

export default {
  name: 'TestResultsConfigItemsMRBasic',
  props: {
    configItems: {
      type: Object,
      required: true,
    },
    isSingleSlice: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {}
  },
  methods: {
    round: _.round,
    convertSpacing,
    convertDimensionY,
    convertDimensionX,
  },
  computed: {
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
