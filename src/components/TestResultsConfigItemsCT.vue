<template>
  <v-card elevation="2">
    <div class="config-items">
      <template v-if="isAcqQuestion">
        <div class="config-item">
          <label>{{ $t('global.scan_direction') }}:</label>
          {{ scanDirection }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.scan_duration') }}:</label>
          {{ round(scanDuration, 2) }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.slice_thickness_mm') }}:</label>
          {{ round(configItems.thickness, 1) }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.mas') }}:</label>
          {{ `Auto` }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.kvp') }}:</label>
          {{ kvp }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.kernels') }}:</label>
          {{ kernels }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.rotation_time') }}:</label>
          {{ configItems.rotationTime }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.pitch') }}:</label>
          {{ configItems.pitch }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.window') }}:</label>
          {{ windowLevelWidth }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.beam_width') }}:</label>
          {{ beamWidth }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.images') }}:</label>
          {{ configItems.numberOfSlices }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.fov') }}:</label>
          {{ round(configItems.dimensionY, 1) }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.scan_length') }}:</label>
          {{ configItems.numberOfSlices * round(configItems.thickness, 1) }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.CTDI') }}:</label>
          {{ get(configItems, 'ctdi', 'N/A') }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.DLP') }}:</label>
          {{ get(configItems, 'dlp', 'N/A') }}
        </div>
      </template>
      <template v-if="isReconQuestion">
        <div class="config-item">
          <label>{{ $t('global.slice_thickness_mm') }}:</label>
          {{ round(configItems.thickness, 1) }}
        </div>
        <div class="config-item">
          <label>{{ this.$t('global.slice_interval') }}:</label>
          {{ round(configItems.spacing, 1) }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.kernels') }}:</label>
          {{ kernels }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.window') }}:</label>
          {{ windowLevelWidth }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.images') }}:</label>
          {{ configItems.numberOfSlices }}
        </div>
        <div class="config-item">
          <label>{{ $t('global.fov') }}:</label>
          {{ round(configItems.dimensionY, 1) + ' x ' + round(configItems.dimensionX, 1) }}
        </div>
      </template>
    </div>
  </v-card>
</template>

<script>
import _ from 'lodash'
import { convertWindowLevelWidth } from '@/lib/math-util'

export default {
  name: 'TestResultsConfigItemsCT',
  props: {
    configItems: {
      type: Object,
      required: true,
    },
    stackQuestion: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {}
  },
  methods: {
    round: _.round,
    get: _.get,
  },
  mounted() {
    console.log('this', this.configItems)
  },
  computed: {
    isAcqQuestion() {
      return _.get(this.stackQuestion, ['questionType']) == 1
    },
    isReconQuestion() {
      return _.get(this.stackQuestion, ['questionType']) == 2
    },
    scanDuration() {
      return _.get(this.configItems, ['scanDuration'], 1)
    },
    kvp() {
      return _.get(this.configItems, ['kvp'], 120)
    },
    kernels() {
      const kernelsList = [
        { text: 'Smooth', value: 'B10f' },
        { text: 'Medium', value: 'B30f' },
        { text: 'Sharp', value: 'B70f' },
      ]
      return _.get(
        _.find(kernelsList, (el) => el.value == this.configItems.kernels),
        ['text'],
        'Medium'
      )
    },
    windowLevelWidth() {
      const windowLevelWidthList = [
        {
          text: 'Soft tissue',
          value: 'soft',
          windowLevel: 40,
          windowWidth: 400,
        },
        {
          text: 'Lung',
          value: 'lung',
          windowLevel: -600,
          windowWidth: 1500,
        },
        {
          text: 'Bone',
          value: 'bone',
          windowLevel: 600,
          windowWidth: 3000,
        },
        {
          text: 'Brain',
          value: 'brain',
          windowLevel: 40,
          windowWidth: 80,
        },
        {
          text: 'Vascular',
          value: 'vascular',
          windowLevel: 100,
          windowWidth: 90,
        },
      ]

      const windowLevel = _.get(this.configItems, 'windowLevel')
      const windowWidth = _.get(this.configItems, 'windowWidth')
      const value = windowLevelWidthList.find(
        (_windowLevelWidth) => _windowLevelWidth.value === convertWindowLevelWidth(windowLevel, windowWidth)
      )

      return _.get(value, ['text'], 'Soft tissue')
    },
    beamWidth() {
      return _.get(this.configItems, ['beamSelected', 'text'], 'Narrow: 20mm')
    },
    scanDirection() {
      return _.get(this.configItems, ['selectedMRIScanDirection'], 1) == 1 ? 'Head to foot' : 'Foot to head'
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
