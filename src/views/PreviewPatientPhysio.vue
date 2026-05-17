<template>
  <div>
    <h2 class="mt-10 mb-10">{{ $t('global.eplab') }}</h2>
    <b-card class="mb-2 mx-2">
      <v-row>
        <v-col cols="12" md="4">
          <div class="mt-2">
            <PhysioPreviewECGChart
              :is-preview="isPreview"
              :continuousecg-data="continuousECGData"
              :cardiac-cycle-duration="patientPhysioForm.cardiacCycleDuration"
              :cardiac-cycle-deviation="patientPhysioForm.cardiacCycleDeviation"
              :bad-beats="patientPhysioForm.badBeats"
              :unit="patientPhysioForm.unit"
              :bad-beats-duration="patientPhysioForm.badBeatsDuration"
            />
          </div>
        </v-col>
        <v-col cols="12" md="8">
          <v-row>
            <v-col cols="12">
              <v-tabs v-model="activeTab" :show-arrows="false">
                <header
                  class="d-flex align-items-center justify-content-between w-100"
                  style="background-color: #fffef9"
                >
                  <div class="d-flex" style="background-color: #fffef9">
                    <v-tab key="cardiac" :hidden="true">{{ $t('global.cardiac') }}</v-tab>
                  </div>
                  <div class="mt-4 d-flex align-items-center gap-2">
                    <v-select
                      :label="$t('global.unit')"
                      v-model="patientPhysioForm.unit"
                      :items="PHYSIO_UNIT_OPTIONS"
                    ></v-select>
                  </div>
                </header>
              </v-tabs>
              <v-tabs-items v-model="activeTab" style="background-color: #fffef9">
                <hr class="header-gradient-region" />
                <v-tab-item class="tab-1" key="cardiac">
                  <div class="text-left mt-2">
                    <label>
                      {{ $t('global.patient_cardiac_cycle_duration') }}
                    </label>
                    <div class="slider-input-container">
                      <v-slider
                        v-model.number="currentCardiacCycleDuration"
                        :min="isMs ? convertByCurrentUnit(300) : convertByCurrentUnit(2000)"
                        :step="currentCardiacCycleDurationStep"
                        :max="isMs ? convertByCurrentUnit(2000) : convertByCurrentUnit(300)"
                        ticks
                        class="slider-input"
                      />
                      <SpinButtonWithInput
                        v-model.number="currentCardiacCycleDuration"
                        type="number"
                        :min="isMs ? convertByCurrentUnit(300) : convertByCurrentUnit(2000)"
                        :max="isMs ? convertByCurrentUnit(2000) : convertByCurrentUnit(300)"
                        :step="currentCardiacCycleDurationStep"
                        class="pt-0 text-input"
                      />
                      <span style="white-space: nowrap">{{ currentUnitText }}</span>
                    </div>
                  </div>
                  <div class="text-left">
                    <label>
                      {{ $t('global.cardiac_cycle_deviation') }}
                    </label>
                    <div class="slider-input-container">
                      <v-slider
                        v-model.number="currentCardiacCycleDeviation"
                        :min="0"
                        :step="currentCardiacCycleDeviationStep"
                        :max="isMs ? 400 : 20"
                        ticks
                        class="slider-input"
                      />
                      <SpinButtonWithInput
                        v-model.number="currentCardiacCycleDeviation"
                        type="number"
                        :min="0"
                        :step="currentCardiacCycleDeviationStep"
                        :max="isMs ? 400 : 20"
                        class="pt-0 text-input"
                      />
                      <span style="white-space: nowrap">{{ currentUnitText }}</span>
                    </div>
                  </div>
                  <v-row>
                    <v-col cols="5">
                      <div class="text-left">
                        <label>
                          {{ $t('global.bad_beats') }}
                        </label>
                        <div style="padding-left: 20px; padding-right: 20px">
                          <v-select
                            class="patient-physio-select"
                            v-model="patientPhysioForm.badBeats"
                            :items="badBeatOptions"
                            item-text="text"
                            item-value="value"
                          ></v-select>
                        </div>
                      </div>
                    </v-col>
                    <v-col cols="7">
                      <div class="text-left">
                        <div class="m-0 d-flex align-items-center" style="gap: 32px">
                          <div class="py-0">
                            <label>
                              {{ $t('global.bad_beat_duration') }}
                            </label>
                          </div>
                          <div class="py-0">
                            <v-checkbox
                              class="checkbox-range"
                              v-model="patientPhysioForm.badBeatsDuration.isRange"
                              :label="$t('global.range', this.languageCode)"
                            ></v-checkbox>
                          </div>
                        </div>
                        <v-row class="m-0" v-if="isMs">
                          <v-col class="py-0">
                            <div class="typed-input">
                              <SpinButtonWithInput
                                v-model.number="badBeatsDurationMin"
                                type="number"
                                :min="300"
                                :step="10"
                                :max="convertByCurrentUnit(patientPhysioForm.cardiacCycleDuration)"
                                class="pt-0 text-input"
                              />
                            </div>
                          </v-col>
                          <v-col class="py-0" v-if="patientPhysioForm.badBeatsDuration.isRange">
                            <div class="typed-input">
                              <SpinButtonWithInput
                                v-model.number="badBeatsDurationMax"
                                type="number"
                                :min="badBeatsDurationMin"
                                :step="10"
                                :max="convertByCurrentUnit(patientPhysioForm.cardiacCycleDuration)"
                                class="pt-0 text-input"
                              />
                            </div>
                          </v-col>
                        </v-row>
                        <v-row class="m-0" v-else>
                          <v-col class="py-0">
                            <div class="typed-input">
                              <SpinButtonWithInput
                                v-model.number="badBeatsDurationMin"
                                type="number"
                                :max="convertByCurrentUnit(300)"
                                :step="currentBadBeatsDurationStep"
                                :min="convertByCurrentUnit(patientPhysioForm.cardiacCycleDuration)"
                                class="pt-0 text-input"
                              />
                            </div>
                          </v-col>
                          <v-col class="py-0" v-if="patientPhysioForm.badBeatsDuration.isRange">
                            <div class="typed-input">
                              <SpinButtonWithInput
                                v-model.number="badBeatsDurationMax"
                                type="number"
                                :max="badBeatsDurationMin"
                                :step="currentBadBeatsDurationStep"
                                :min="convertByCurrentUnit(patientPhysioForm.cardiacCycleDuration)"
                                class="pt-0 text-input"
                              />
                            </div>
                          </v-col>
                        </v-row>
                      </div>
                    </v-col>
                  </v-row>

                  <div class="w-full">
                    <PhysioConfigECGChart
                      ref="physioConfigECGChart"
                      :cardiac-cycle-duration="patientPhysioForm.cardiacCycleDuration"
                      :cardiac-cycle-deviation="patientPhysioForm.cardiacCycleDeviation"
                      :bad-beats="patientPhysioForm.badBeats"
                      :is-preview="isPreview"
                      :initial-continuousecg-data="initialContinuousECGDataOfSelectedCardiacLevel"
                      @ecgDataChange="onEcgDataChange"
                    />
                  </div>
                </v-tab-item>
              </v-tabs-items>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </b-card>
  </div>
</template>
<script>
import {
  BAD_BEATS,
  BAD_BEATS_OPTIONS,
  CARDIAC_LEVEL,
  PHYSIO_UNIT,
  PHYSIO_UNIT_OPTIONS,
  CARDIAC_LEVEL_OPTIONS,
} from '../constants'
import SpinButtonWithInput from '../components/SpinButtonWithInput.vue'
import PhysioConfigECGChart from '../components/PhysioConfigECGChart.vue'
import PhysioPreviewECGChart from '../components/PhysioPreviewECGChart.vue'
import { mapGetters, mapState } from 'vuex'
import _ from 'lodash'
import config from '../config'

const initialValue = {
  name: '',
  age: 20,
  cardiacCycleDuration: 700,
  cardiacCycleDeviation: 0,
  badBeats: BAD_BEATS.NONE,
  respiratoryCycleDuration: 500,
  strokeVol: 40,
  difficulty: 1,
  breathHoldDuration: 0,
  unit: config.isCTLab ? PHYSIO_UNIT.BPM : PHYSIO_UNIT.MS,
  badBeatsDuration: {
    isRange: false,
    min: 400,
    max: 400,
  },
}

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

const initialPhysioProfile = {
  name: '',
  age: 20,
  respiratoryCycleDuration: 500,
  strokeVol: 40,
  difficulty: 1,
  breathHoldDuration: 0,
  unit: PHYSIO_UNIT.MS,
  cardiacLevels: [
    {
      levelType: CARDIAC_LEVEL.INITIAL,
      cardiacCycleDuration: 700,
      cardiacCycleDeviation: 0,
      badBeats: BAD_BEATS.NONE,
      badBeatsDuration: {
        isRange: false,
        min: 400,
        max: 400,
      },
      continuousECGData: _.cloneDeep(initialContinuousECGData),
    },
    {
      levelType: CARDIAC_LEVEL.BETA_BLOCKER,
      cardiacCycleDuration: 700,
      cardiacCycleDeviation: 0,
      badBeats: BAD_BEATS.NONE,
      badBeatsDuration: {
        isRange: false,
        min: 400,
        max: 400,
      },
      continuousECGData: _.cloneDeep(initialContinuousECGData),
    },
    {
      levelType: CARDIAC_LEVEL.NITRO,
      cardiacCycleDuration: 700,
      cardiacCycleDeviation: 0,
      badBeats: BAD_BEATS.NONE,
      badBeatsDuration: {
        isRange: false,
        min: 400,
        max: 400,
      },
      continuousECGData: _.cloneDeep(initialContinuousECGData),
    },
    {
      levelType: CARDIAC_LEVEL.NITRO_WITH_BB,
      cardiacCycleDuration: 700,
      cardiacCycleDeviation: 0,
      badBeats: BAD_BEATS.NONE,
      badBeatsDuration: {
        isRange: false,
        min: 400,
        max: 400,
      },
      continuousECGData: _.cloneDeep(initialContinuousECGData),
    },
    {
      levelType: CARDIAC_LEVEL.STRESS,
      cardiacCycleDuration: 700,
      cardiacCycleDeviation: 0,
      badBeats: BAD_BEATS.NONE,
      badBeatsDuration: {
        isRange: false,
        min: 400,
        max: 400,
      },
      continuousECGData: _.cloneDeep(initialContinuousECGData),
    },
  ],
}

export default {
  name: 'PreviewPatientPhysio',
  components: {
    SpinButtonWithInput,
    PhysioConfigECGChart,
    PhysioPreviewECGChart,
  },
  data() {
    return {
      BAD_BEATS,
      BAD_BEATS_OPTIONS,
      PHYSIO_UNIT,
      PHYSIO_UNIT_OPTIONS,
      CARDIAC_LEVEL_OPTIONS,
      patientPhysioObjects: initialPhysioProfile,
      patientPhysioForm: initialValue,
      activeTab: 0,
      isPreview: false,
      continuousECGData: {
        data: [],
        waveWidth: 0,
        distanceFromTwoWave: 0,
        centerRToCenterT: 0,
        startPToCenterR: 0,
        centerTToEnd: 0,
        distanceFromSToT: 0,
        distanceFromQToR: 0,
        distanceFromRToS: 0,
        distanceFromPToQ: 0,
      },
      cardiacLevelType: CARDIAC_LEVEL.INITIAL,
      isIgnoreResetPreview: false,
      timeoutIgnoreResetPreview: null,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapGetters('questionService', ['difficultyChoices']),
    ...mapGetters('user', ['languageCode']),
    badBeatOptions() {
      return BAD_BEATS_OPTIONS.map((el) => {
        return {
          text: this.$t(`BadBeatOptions.${el.text ? el.text.replace('/', '_') : el.text}`, this.languageCode),
          value: el.value,
        }
      })
    },
    selectedCardiacLevel() {
      return this.patientPhysioObjects?.cardiacLevels.find((el) => el.levelType == this.cardiacLevelType)
    },
    initialContinuousECGDataOfSelectedCardiacLevel() {
      return this.selectedCardiacLevel?.continuousECGData || _.cloneDeep(initialContinuousECGData)
    },
    otherCardiacLevelOptions() {
      return this.CARDIAC_LEVEL_OPTIONS.filter((el) => el.value != this.cardiacLevelType)
    },
    currentUnitText() {
      return this.patientPhysioForm.unit == PHYSIO_UNIT.BPM ? 'bpm' : 'ms'
    },
    currentCardiacCycleDurationStep() {
      return this.patientPhysioForm.unit == PHYSIO_UNIT.BPM ? 1 : 20
    },
    currentBadBeatsDurationStep() {
      return this.patientPhysioForm.unit == PHYSIO_UNIT.BPM ? 1 : 10
    },
    isMs() {
      return this.patientPhysioForm.unit == PHYSIO_UNIT.MS
    },
    badBeatsDurationMin: {
      get() {
        return this.convertByCurrentUnit(this.patientPhysioForm.badBeatsDuration.min)
      },
      set(value) {
        this.patientPhysioForm.badBeatsDuration.min = this.unConvertByCurrentUnit(value)
      },
    },
    badBeatsDurationMax: {
      get() {
        return this.convertByCurrentUnit(this.patientPhysioForm.badBeatsDuration.max)
      },
      set(value) {
        this.patientPhysioForm.badBeatsDuration.max = this.unConvertByCurrentUnit(value)
      },
    },
    currentCardiacCycleDuration: {
      get() {
        return this.convertByCurrentUnit(this.patientPhysioForm.cardiacCycleDuration)
      },
      set(value) {
        this.patientPhysioForm.cardiacCycleDuration = this.unConvertByCurrentUnit(value)
      },
    },
    currentCardiacCycleDeviationStep() {
      return this.patientPhysioForm.unit == PHYSIO_UNIT.BPM ? 1 : 5
    },
    currentCardiacCycleDeviation: {
      get() {
        return this.isMs
          ? this.patientPhysioForm.cardiacCycleDeviation
          : _.round(this.patientPhysioForm.cardiacCycleDeviation / 20)
      },
      set(value) {
        this.patientPhysioForm.cardiacCycleDeviation = this.isMs ? value : _.round(value * 20)
      },
    },
  },
  watch: {
    'patientPhysioForm.badBeatsDuration.min': function () {
      if (this.patientPhysioForm.badBeatsDuration.max < this.patientPhysioForm.badBeatsDuration.min) {
        this.patientPhysioForm.badBeatsDuration.max = this.patientPhysioForm.badBeatsDuration.min
      }

      this.resetPreview()
    },
    'patientPhysioForm.cardiacCycleDuration': function () {
      this.resetPreview()
    },
    'patientPhysioForm.cardiacCycleDeviation': function () {
      this.resetPreview()
    },
    'patientPhysioForm.badBeats': function () {
      this.resetPreview()
    },
    'patientPhysioForm.badBeatsDuration.max': function () {
      this.resetPreview()
    },
    'patientPhysioForm.badBeatsDuration.isRange': function () {
      this.resetPreview()
    },
  },
  mounted() {},
  methods: {
    resetPreview() {
      if (this.isIgnoreResetPreview) {
        return
      }
      this.isPreview = false
    },
    convertByCurrentUnit(value) {
      if (this.patientPhysioForm.unit == PHYSIO_UNIT.BPM) {
        return this.msToBpm(value)
      }
      return value
    },
    unConvertByCurrentUnit(value) {
      if (this.patientPhysioForm.unit == PHYSIO_UNIT.BPM) {
        return this.bmpToMs(value)
      }
      return value
    },
    msToBpm(value) {
      return 60 + _.round((1000 - value) / 20)
    },
    bmpToMs(value) {
      return _.round(1000 - (value - 60) * 20, 0)
    },
    onEcgDataChange(togglePreviewValue, continuousECGData) {
      this.isPreview = togglePreviewValue
      this.continuousECGData = continuousECGData
    },
    clearTimeoutIgnoreResetPreview() {
      if (this.timeoutIgnoreResetPreview) {
        clearTimeout(this.timeoutIgnoreResetPreview)
        this.isIgnoreResetPreview = false
      }
    },
  },
}
</script>
<style lang="scss">
.typed-input {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
  .spin-btn-grp {
    display: flex;
    border: 1px solid $border-gray !important;
    min-height: 40px;
    border-radius: 4px;
  }
}
.checkbox-range {
  margin-top: 0;
  margin-bottom: 0.5rem;
  .v-input__control {
    .v-input__slot {
      margin-bottom: 0;
      .v-label {
        margin-bottom: 0;
      }
    }
    .v-messages {
      display: none;
    }
  }
}
.slider-input-container {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 100px 30px;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
  .slider-input {
    .v-input__control {
      .v-input__slot {
        margin-bottom: 0;
      }
      .v-messages {
        display: none;
      }
    }
  }
  .spin-btn-grp {
    display: flex;
    border: 1px solid $border-gray !important;
    min-height: 40px;
    border-radius: 4px;
  }
}
</style>
<style lang="scss" scoped>
.gap-2 {
  gap: 0.5rem;
}
.header-gradient-region {
  background-image: $gradient-gray !important;
  border: 0;
}
.patient-physio-select {
  padding-top: 0;
  margin-top: 0;
  .v-input__control {
    .v-text-field__details {
      display: none;
    }
  }
}
</style>
