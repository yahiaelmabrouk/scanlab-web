<template>
  <div class="timing-decision-config-form">
    <v-tabs v-model="activeTab" :show-arrows="false">
      <header :class="`flex align-center justify-content-between`">
        <div class="d-flex">
          <v-tab
            v-if="!isHideSetDelay"
            :disabled="isConfirmedSetDelay || isDisabledParameter"
            :key="TIMING_DECISION_CONFIG_TABS.SET_DELAY"
            >{{ $t('global.set_delay') }}</v-tab
          >
          <v-tab
            :disabled="isConfirmedSetDelay || isDisabledParameter"
            :key="TIMING_DECISION_CONFIG_TABS.BOLUS_TRACKING"
            >{{ $t('global.bolus_tracking') }}</v-tab
          >
          <v-tab :disabled="isConfirmedSetDelay || isDisabledParameter" :key="TIMING_DECISION_CONFIG_TABS.TEST_BOLUS">{{
            $t('global.test_bolus')
          }}</v-tab>
        </div>
        <div class="config-tabs-header-suffix-container">
          <div class="slice-scan-delay-form" v-if="isHideSetDelay || activeTab == 1 || activeTab == 2">
            <label class="label-with-unit">{{ $t('global.scan_delay') }}</label>
            <SpinButtonWithInput
              :type="'number'"
              v-model.number="scanDelay"
              :step="1"
              :min="0"
              :max="300"
              :disabled="isDisabledParameter"
            />
          </div>
        </div>
      </header>
    </v-tabs>
    <v-tabs-items v-model="activeTab">
      <v-tab-item class="tab-1" v-if="!isHideSetDelay" :key="TIMING_DECISION_CONFIG_TABS.SET_DELAY">
        <div class="tab-container">
          <div class="text-left mt-5">
            <span>
              {{ $t('global.set_scan_description') }}
            </span>
          </div>
          <div class="group-buttons">
            <v-btn
              v-if="isConfirmedSetDelay"
              :color="'text-white buttonBlue'"
              :disabled="isDisabledParameter"
              class="attention-glow"
              @click="onMoveToNextQuestion()"
              >{{ $t('global.next') }}</v-btn
            >
            <v-btn
              v-if="!isConfirmedSetDelay"
              class="btn-color-green"
              :disabled="isDisabledParameter"
              @click="setIsConfirmedSetDelay(true)"
              >{{ $t('global.confirm') }}</v-btn
            >
            <v-btn
              v-else
              class="btn-color-red"
              :disabled="isDisabledParameter"
              @click="setIsConfirmedSetDelay(false)"
              >{{ $t('global.cancel') }}</v-btn
            >
            <!-- <v-btn :disabled="isDisabledParameter">{{ $t('global.next') }}</v-btn> -->
          </div>
        </div>
      </v-tab-item>
      <v-tab-item class="tab-2" :key="TIMING_DECISION_CONFIG_TABS.BOLUS_TRACKING">
        <hr class="header-gradient-region" />
        <div class="tab-container">
          <v-row>
            <v-col cols="6">
              <div class="slice-form">
                <label>{{ $t('global.hu_trigger_threshold') }}</label>
                <div class="input-lock">
                  <SpinButtonWithInput
                    :type="'number'"
                    v-model.number="huTriggerTheshold"
                    :step="10"
                    :min="1"
                    :max="300"
                    :disabled="isDisabledParameter"
                  />
                </div>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="slice-form">
                <label>{{ $t('global.trigger_type') }}</label>
                <v-radio-group
                  v-model="huTriggerType"
                  row
                  class="hu-trigger-type-radio-group"
                  :disabled="isDisabledParameter"
                >
                  <v-radio :label="$t('global.automatic', languageCode)" :value="HU_TRIGGER_TYPE.AUTOMATIC"></v-radio>
                  <v-radio :label="$t('global.manual', languageCode)" :value="HU_TRIGGER_TYPE.MANUAL"></v-radio>
                </v-radio-group>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="slice-form">
                <label>{{ $t('global.flouro_frame_rate') }}</label>
                <v-select
                  v-model="flouroFrameRate"
                  :items="flouroFrameRateOptions"
                  item-value="value"
                  item-text="label"
                  :disabled="isDisabledParameter"
                ></v-select>
              </div>
            </v-col>
            <!-- <v-col cols="12">
              <div class="group-buttons">
                <v-btn color="primary">{{ $t('global.confirm') }}</v-btn>
              </div>
            </v-col> -->
          </v-row>
        </div>
      </v-tab-item>
      <v-tab-item class="tab-3" :key="TIMING_DECISION_CONFIG_TABS.TEST_BOLUS">
        <hr class="header-gradient-region" />
        <div class="tab-container">
          <v-row>
            <v-col cols="6">
              <div class="slice-form">
                <label>{{ $t('global.flouro_frame_rate') }}</label>
                <v-select
                  v-model="flouroFrameRate"
                  :items="flouroFrameRateOptions"
                  item-value="value"
                  item-text="label"
                  :disabled="isDisabledParameter"
                ></v-select>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>
<script>
import config from '../config'
import { mapActions, mapGetters, mapState } from 'vuex'
import { HU_TRIGGER_TYPE, ROI_STATUS, SCAN_STATUS, TIMING_DECISION_CONFIG_TABS } from '../constants'
import SpinButtonWithInput from './SpinButtonWithInput.vue'
import EventBus from '@/lib/event-bus'
export default {
  name: 'TimingDecisionConfigForm',
  components: {
    SpinButtonWithInput,
  },
  data() {
    return {
      // activeTab: 1,
      HU_TRIGGER_TYPE,
      TIMING_DECISION_CONFIG_TABS,
      isCTLab: config.isCTLab,
      SCAN_STATUS,
      ROI_STATUS,
    }
  },
  computed: {
    ...mapGetters('user', ['languageCode', 'isAdmin']),
    ...mapState('questionService', [
      'timingDecisionScanDelay',
      'timingDecisionHUTriggerThreshold',
      'timingDecisionTriggerType',
      'scanStatus',
      'roiStatus',
      'timingDecisionFlouroFrameRate',
      'isSubmittingAnswer',
    ]),
    ...mapGetters('questionService', ['isAnsweredCurrentQuestion', 'stackQuestion', 'isHideSetDelay']),
    ...mapState('testRunService', ['preferredTimingMethod']),
    ...mapState('timingDecisionService', ['isConfirmedSetDelay', 'timingDecisionActiveTab', 'isSetDefaultActiveTab']),
    ...mapGetters('timingDecisionService', ['isSelectedTestBolusTimingDecision']),
    flouroFrameRateOptions() {
      if (this.isSelectedTestBolusTimingDecision) {
        return [
          {
            label: '1',
            value: 1,
          },
        ]
      } else {
        return [
          {
            label: '1',
            value: 1,
          },
          {
            label: '2',
            value: 2,
          },
        ]
      }
    },
    activeTab: {
      get() {
        return this.timingDecisionActiveTab
      },
      set(val) {
        this.setTimingDecisionActiveTab(val)
      },
    },
    huTriggerTheshold: {
      get() {
        return this.timingDecisionHUTriggerThreshold
      },
      set(val) {
        this.setTimingDecisionHUTriggerThreshold(val)
      },
    },
    scanDelay: {
      get() {
        return this.timingDecisionScanDelay
      },
      set(val) {
        this.setTimingDecisionScanDelay(val)
      },
    },
    flouroFrameRate: {
      get() {
        return this.timingDecisionFlouroFrameRate
      },
      set(val) {
        this.setTimingDecisionFlouroFrameRate(val)
      },
    },
    huTriggerType: {
      get() {
        return this.timingDecisionTriggerType
      },
      set(val) {
        this.setTimingDecisionTriggerType(val)
      },
    },
    isDisabledParameter() {
      return (
        this.isCTLab &&
        ((this.scanStatus !== this.SCAN_STATUS.NO_SCAN &&
          (this.roiStatus == this.ROI_STATUS.CONFIRMED ||
            this.roiStatus == this.ROI_STATUS.RUNNING ||
            this.roiStatus == this.ROI_STATUS.DONE)) ||
          this.isAnsweredCurrentQuestion ||
          this.isSubmittingAnswer)
      )
    },
  },
  watch: {
    activeTab: 'onActiveTabChange',
  },
  mounted() {
    if (!this.isSetDefaultActiveTab) {
      this.activeTab = this.getInitialTab()
      this.setIsSetDefaultActiveTab(true)
    }
  },
  methods: {
    ...mapActions('questionService', [
      'setTimingDecisionScanDelay',
      'setTimingDecisionHUTriggerThreshold',
      'setTimingDecisionTriggerType',
      'setTimingDecisionFlouroFrameRate',
    ]),
    ...mapActions('timingDecisionService', [
      'setIsConfirmedSetDelay',
      'setTimingDecisionActiveTab',
      'setIsSetDefaultActiveTab',
    ]),
    getInitialTab() {
      const defaultTab = this.isHideSetDelay ? 0 : 1 // default to Bolus Tracking
      if (!this.preferredTimingMethod) return defaultTab

      if (this.isHideSetDelay) {
        // Tabs: 0=Bolus Tracking, 1=Test Bolus (Set Delay hidden)
        const tabMap = { BOLUS_TRACKING: 0, TEST_BOLUS: 1 }
        return tabMap[this.preferredTimingMethod] ?? defaultTab
      } else {
        // Tabs: 0=Set Delay, 1=Bolus Tracking, 2=Test Bolus
        const tabMap = { SET_DELAY: 0, BOLUS_TRACKING: 1, TEST_BOLUS: 2 }
        return tabMap[this.preferredTimingMethod] ?? defaultTab
      }
    },
    onActiveTabChange() {
      if (this.isSelectedTestBolusTimingDecision) {
        this.huTriggerType = this.HU_TRIGGER_TYPE.MANUAL
        this.flouroFrameRate = 1
      }
    },
    onMoveToNextQuestion() {
      EventBus.$emit('onSetDelayTimingDecisionConfirmedMoveToNextQuestion')
    },
  },
}
</script>
<style lang="scss">
.config-tabs-header-suffix-container {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 12px;
  margin-left: 20px;
}
.hu-trigger-type-radio-group {
  margin-top: 0;
  .v-input__control {
    .v-messages {
      display: none;
    }
    .v-radio {
      .v-label {
        margin-bottom: 0;
      }
    }
  }
}
</style>
<style lang="scss" scoped>
.timing-decision-config-form {
  background: $white;
  padding: $spacing-standard;
  box-shadow: 0px 0px 10px rgba(11, 49, 51, 0.25);
  flex-grow: 3;
  height: 100%;

  label {
    font-size: 13px;
  }
}
.tab-container {
  padding: 10px;
}
.header-gradient-region {
  background-image: $gradient-gray !important;
  border: 0;
}
.group-buttons {
  display: flex;
  justify-content: end;
  gap: 10px;
  align-items: center;
}
.slice-form .input-lock,
.slice-form .min-max-lock {
  width: 130px;
}
.slice-form {
  display: flex;
  padding: 0 24px;
  text-align: left;
  flex-direction: column;

  margin-bottom: 5px;

  input {
    border-radius: 1em;
  }

  .input-lock,
  .min-max-lock {
    display: flex;
    border: 1px solid $border-gray;
    border-radius: 1em;
    align-items: center;
    height: 35px;
    width: 150px;
    justify-content: space-between;

    input {
      border: none;
    }
  }
}
::v-deep .theme--light.v-select .v-select__selections {
  color: black !important;
}
.btn-color-red {
  background-color: #fd2243 !important;
  color: black !important;
}

.btn-color-green {
  background-color: #41b950 !important;
  color: black !important;
}

.attention-glow {
  animation: pulse-glow 1.5s infinite ease-in-out;
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 10px 4px rgba(255, 165, 0, 1);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.5);
  }
}
</style>
