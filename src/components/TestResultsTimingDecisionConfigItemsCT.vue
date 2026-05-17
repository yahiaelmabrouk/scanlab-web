<template>
  <v-card elevation="2">
    <div class="config-items">
      <div class="config-item">
        <label>{{ $t('global.hu_trigger_threshold') }}:</label>
        {{ timingDecisionHUTriggerThreshold }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.scan_delay') }}:</label>
        {{ timingDecisionScanDelay }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.trigger_type') }}:</label>
        {{ timingDecisionTriggerType == HU_TRIGGER_TYPE.AUTOMATIC ? $t('global.automatic') : $t('global.manual') }}
      </div>
      <div class="config-item">
        <label>{{ $t('global.flouro_frame_rate') }}:</label>
        {{ timingDecisionFlouroFrameRate }}
      </div>
    </div>
  </v-card>
</template>

<script>
import _ from 'lodash'
import { HU_TRIGGER_TYPE } from '../constants'

export default {
  name: 'TestResultsTimingDecisionConfigItemsCT',
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
    return {
      HU_TRIGGER_TYPE: HU_TRIGGER_TYPE,
    }
  },
  mounted() {
    console.log('this.configItems', this.configItems)
  },
  methods: {
    round: _.round,
  },
  computed: {
    timingDecisionHUTriggerThreshold() {
      return _.get(this.configItems, ['timingDecisionHUTriggerThreshold'], 150)
    },
    timingDecisionScanDelay() {
      return _.get(this.configItems, ['timingDecisionScanDelay'], 0)
    },
    timingDecisionTriggerType() {
      return _.get(this.configItems, ['timingDecisionTriggerType'], this.HU_TRIGGER_TYPE.AUTOMATIC)
    },
    timingDecisionFlouroFrameRate() {
      return _.get(this.configItems, ['timingDecisionFlouroFrameRate'], 2)
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
