<template>
  <v-card elevation="2" class="mb-3">
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
        <label>{{ labels.gap[configItems.vendorStyle.trim()] }}:</label>
        {{ convertSpacing(configItems.spacing, configItems.vendorStyle, configItems.thickness) }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.phase_mm') }}:</label>
        {{ convertDimensionX(configItems.dimensionX, configItems.vendorStyle, configItems.dimensionY) }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.frequency_mm') }}:</label>
        {{ convertDimensionY(configItems.dimensionY, configItems.vendorStyle) }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.scan_time') }}:</label>
        {{ scanTime }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.pixel_shift') }}:</label>
        {{ round(configItems.pixelShift, 2) + 'mm' }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.phase_voxel_size') }}:</label>
        {{ round(configItems.phaseVoxelSize, 2) + 'mm' }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.frequency_voxel_size') }}:</label>
        {{ round(configItems.frequencyVoxelSize, 2) + 'mm' }}
      </div>
      <div class="config-item" v-if="configItems.snr != null">
        <label>{{ $t('global.snr') }}:</label>
        {{ round(configItems.snr, 2) }}
      </div>
      <div class="config-item">
        <label>{{ labels.concatenationLabel[configItems.vendorStyle.trim()] }}:</label>
        {{ round(configItems.concatenations, 1) }}
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
        <label>{{ labels.minTRLabel[configItems.vendorStyle.trim()] }}:</label>
        {{ round(configItems.minConcatAcqPackage, 1) + 'ms' }}
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
        <label>{{ labels.averageLabel[configItems.vendorStyle.trim()] }}:</label>
        {{ round(configItems.averages, 1) }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.phase_matrix') }}:</label>
        {{ round(configItems.phaseMatrix, 0) }}
        {{ '(' + round((configItems.phaseMatrix / configItems.frequencyMatrix) * 100) + '%' + ')' }}
      </div>
      <div class="config-item">
        <label>{{ labels.frequencyMatrixLabel[configItems.vendorStyle.trim()] }}:</label>
        {{ round(configItems.frequencyMatrix, 0) }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.flip_angle') }}:</label>
        {{ round(configItems.flipAngle, 0) + '°' }}
      </div>
      <div class="config-item">
        <label>{{ labels.partialFourier[configItems.vendorStyle.trim()] }}:</label>
        {{ (configItems.partialFourier, 1) }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.receiver_bandwidth') }}:</label>
        {{
          convertReceiverBandwidth(
            configItems.receiverBandWidth,
            configItems.vendorStyle,
            configItems.frequencyMatrix,
            configItems.fieldStrength
          )
        }}
      </div>
      <div class="config-item">
        <label>{{ labels.parallelFactor[configItems.vendorStyle.trim()] }}:</label>
        {{ (configItems.parallelFactor, 1) }}
      </div>
      <div class="config-item">
        <label>{{ labels.wrapPrevent[configItems.vendorStyle.trim()] }}:</label>
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
import moment from 'moment'
import {
  createLabels,
  convertSpacing,
  convertDimensionY,
  convertDimensionX,
  convertReceiverBandwidth,
} from '@/lib/vendor-label-value.util.js'

export default {
  name: 'TestResultsConfigItemsUltraLab',
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
    convertSecondsToMinutesAndSeconds(scanTime) {
      const seconds = moment.duration(scanTime).seconds()
      let minutes = moment.duration(scanTime).minutes()
      const hours = moment.duration(scanTime).hours()
      minutes += hours * 60
      return minutes + ':' + (seconds > 9 ? seconds : '0' + seconds)
    },
    convertSequenceType(sequenceType) {
      return sequenceType === 'TE' ? 'FSE' : sequenceType
    },
    convertSpacing,
    convertDimensionY,
    convertDimensionX,
    convertReceiverBandwidth,
  },
  computed: {
    scanTime() {
      return this.convertSecondsToMinutesAndSeconds(this.configItems.scanTime * 1000)
    },
    sequenceType() {
      //return this.convertSequenceType(this.configItems.sequenceType)
      return this.labels.sequenceTypeLabel[this.configItems.vendorStyle][this.configItems.sequenceType]
    },
    labels() {
      return createLabels(this.$t.bind(this), this.configItems.sequenceType)
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
