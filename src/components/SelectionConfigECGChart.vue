<template>
  <div style="position: relative">
    <PhysioPreviewECGChart
      :is-show-physio-canvas="false"
      :is-preview="isPreview"
      :continuousecg-data="data.cardiacLevel.continuousECGData"
      :cardiac-cycle-duration="data.cardiacLevel.cardiacCycleDuration"
      :cardiac-cycle-deviation="data.cardiacLevel.cardiacCycleDeviation"
      :bad-beats="data.cardiacLevel.badBeats"
      :unit="unit"
      :bad-beats-duration="data.cardiacLevel.badBeatsDuration"
      :canvas-id="`selectionConfigEcgChart-${selectionIdent}`"
      :max-y="220"
      :height="isCardiacAcquisitionQuestion ? '' : '300px'"
    />
    <div class="group-actions-selection-config-chart">
      <v-select
        :class="isCardiacAcquisitionQuestion ? 'rounded-sm' : ''"
        v-model="unit"
        :items="PHYSIO_UNIT_OPTIONS"
        :disabled="disabledForm"
      ></v-select>
      <v-btn color="primary" @click="isPreview = !isPreview">{{
        isPreview ? $t('global.stop') : $t('global.preview')
      }}</v-btn>
    </div>
  </div>
</template>
<script>
import PhysioPreviewECGChart from './PhysioPreviewECGChart.vue'
import {
  BAD_BEATS,
  CARDIAC_LEVEL,
  DEFAULT_CARDIAC_CYCLE_DURATION,
  PHYSIO_UNIT,
  PHYSIO_UNIT_OPTIONS,
} from '../constants'
import { mapState } from 'vuex'
import { mapGetters } from 'vuex/dist/vuex.common.js'
import _ from 'lodash'

const initialContinuousECGData = {
  waveWidth: 282,
  centerTToEnd: 45.75,
  startPToCenterR: 80.25,
  centerRToCenterT: 156,
  distanceFromPToQ: 0,
  distanceFromSToT: 75,
  distanceFromQToR: 0,
  distanceFromRToS: 0,
  randomWaveBadbeatsArray: [],
}

const initialValue = {
  name: '',
  age: 20,
  respiratoryCycleDuration: 500,
  strokeVol: 40,
  difficulty: 1,
  breathHoldDuration: 0,
  unit: PHYSIO_UNIT.MS,
  cardiacLevel: {
    levelType: CARDIAC_LEVEL.INITIAL,
    cardiacCycleDuration: DEFAULT_CARDIAC_CYCLE_DURATION,
    cardiacCycleDeviation: 0,
    badBeats: BAD_BEATS.NONE,
    badBeatsDuration: {
      isRange: false,
      min: 400,
      max: 400,
    },
    continuousECGData: _.cloneDeep(initialContinuousECGData),
  },
}

export default {
  name: 'SelectionConfigECGChart',
  components: {
    PhysioPreviewECGChart,
  },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapState('questionService', ['patientPhysioInfo']),
    ...mapGetters('questionService', ['isCardiacAcquisitionQuestion']),
    disabledForm() {
      return false
    },
  },
  watch: {
    patientPhysioInfo: function () {
      if (this.patientPhysioInfo) {
        this.data = {
          ...this.data,
          ...this.patientPhysioInfo,
        }
      }
    },
  },
  data() {
    return {
      isPreview: false,
      data: initialValue,
      unit: PHYSIO_UNIT.BPM,
      PHYSIO_UNIT_OPTIONS,
    }
  },
  mounted() {
    if (this.patientPhysioInfo) {
      this.data = {
        ...this.data,
        ...this.patientPhysioInfo,
      }
    }
  },
}
</script>

<style lang="scss">
.group-actions-selection-config-chart {
  position: absolute;
  z-index: 1;
  right: 10px;
  top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  .v-select {
    background: #fff;
    border-radius: 8px;
    width: 80px;
    .v-input__control {
      .v-input__slot {
        padding: 0 5px;
        margin-bottom: 0;
      }
      .v-text-field__details {
        display: none;
      }
    }
  }
}
</style>
