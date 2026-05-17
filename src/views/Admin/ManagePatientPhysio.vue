<template>
  <div>
    <div class="loading-overlay" v-if="isLoading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <h2 class="mt-10 mb-10">{{ $t('global.manage_patient_physio') }}</h2>
    <b-card class="mb-2 mx-2">
      <v-row>
        <v-col cols="12" md="4">
          <div>
            <v-btn color="primary" class="w-100" @click="addNewProfile()">{{ $t('global.new_profile') }}</v-btn>
          </div>
          <div class="mt-6">
            <v-select
              class="patient-physio-select"
              v-model="selectedPatientPhysioId"
              label="Profiles"
              item-value="id"
              item-text="name"
              :items="listPatientPhysios"
            ></v-select>
          </div>
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
          <div>
            <h2>{{ $t('global.profile') }}</h2>
          </div>
          <v-row>
            <v-col cols="12">
              <v-tabs v-model="activeTab" :show-arrows="false">
                <header
                  class="d-flex align-items-center justify-content-between w-100"
                  style="background-color: #fffef9"
                >
                  <div class="d-flex" style="background-color: #fffef9">
                    <v-tab key="general">{{ $t('global.general') }}</v-tab>
                    <v-tab key="cardiac">{{ $t('global.cardiac') }}</v-tab>
                  </div>
                  <div class="mt-4 d-flex align-items-center gap-2">
                    <v-select
                      v-model="patientPhysioForm.difficulty"
                      :items="difficultyChoices"
                      item-text="name"
                      item-value="val"
                      :disabled="disabledForm"
                      :label="$t('global.difficulty')"
                    />
                    <v-select
                      :label="$t('global.unit', this.languageCode)"
                      v-model="patientPhysioForm.unit"
                      :items="PHYSIO_UNIT_OPTIONS"
                      :disabled="disabledForm"
                    ></v-select>
                  </div>
                </header>
              </v-tabs>
              <v-tabs-items v-model="activeTab" style="background-color: #fffef9">
                <hr class="header-gradient-region" />
                <v-tab-item class="tab-1" key="general">
                  <div class="tab-container">
                    <div>
                      <v-row>
                        <v-col cols="6" class="text-left">
                          <label>
                            {{ $t('global.name') }}
                          </label>
                          <v-text-field
                            v-model="patientPhysioForm.name"
                            type="text"
                            class="pt-0"
                            :disabled="disabledForm"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="6" class="text-left">
                          <label>
                            {{ $t('global.age') }}
                          </label>
                          <v-text-field
                            v-model="patientPhysioForm.age"
                            type="number"
                            :min="1"
                            class="pt-0"
                            :disabled="disabledForm"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </div>
                  </div>
                  <div class="text-left">
                    <label>
                      {{ $t('global.respiratory_cycle_duration') }}
                    </label>
                    <div class="slider-input-container">
                      <v-slider
                        v-model.number="patientPhysioForm.respiratoryCycleDuration"
                        :min="500"
                        :step="100"
                        :max="8000"
                        ticks
                        class="slider-input"
                        :disabled="disabledForm"
                      />
                      <SpinButtonWithInput
                        v-model.number="patientPhysioForm.respiratoryCycleDuration"
                        type="number"
                        :min="500"
                        :step="100"
                        :max="8000"
                        class="pt-0 text-input"
                        :disabled="disabledForm"
                      />
                      <span>{{ `ms` }}</span>
                    </div>
                  </div>
                  <div class="text-left">
                    <label>
                      {{ $t('global.breath_hold_duration') }}
                    </label>
                    <div class="typed-input-container">
                      <SpinButtonWithInput
                        v-model.number="patientPhysioForm.breathHoldDuration"
                        type="number"
                        :min="0"
                        :step="1"
                        :max="35"
                        class="pt-0 text-input"
                        :disabled="disabledForm"
                      />
                      <span>{{ `seconds` }}</span>
                    </div>
                  </div>
                </v-tab-item>
                <v-tab-item class="tab-1" key="cardiac">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center justify-content-start">
                      <v-btn
                        :key="item.value"
                        v-for="item in CARDIAC_LEVEL_OPTIONS"
                        :value="item.value"
                        class="btn-toggle-cardiac-level"
                        :class="{ active: cardiacLevelType == item.value }"
                        @click="onConfirmCurrentCardiacLevelInfo(cardiacLevelType, item.value)"
                      >
                        <span>{{ item.text }}</span>
                      </v-btn>
                    </div>
                    <div class="d-flex align-items-center gap-10">
                      <div class="d-flex align-items-center gap-5">
                        <div>{{ $t('global.stroke_vol') }}</div>
                        <v-select
                          class="stroke-vol-select"
                          v-model="patientPhysioForm.strokeVol"
                          :items="STROKE_VOL_OPTIONS"
                          item-text="text"
                          item-value="value"
                          :disabled="disabledForm"
                        ></v-select>
                        <div>{{ $t('Injector.ml') }}</div>
                      </div>
                      <div class="d-flex align-items-center justify-content-end gap-2">
                        <v-btn color="primary" @click="onCopyCurrentCardiacInfo" :disabled="disabledForm">
                          <v-icon>mdi-content-copy</v-icon>
                        </v-btn>
                        <!-- <v-btn
                        color="warning"
                        v-if="copyData"
                        :disabled="disabledForm"
                        @click="onPatseCurrentCardiacInfo"
                      >
                        <v-icon>mdi-content-paste</v-icon>
                      </v-btn> -->
                      </div>
                    </div>
                  </div>
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
                        :disabled="disabledForm"
                      />
                      <SpinButtonWithInput
                        v-model.number="currentCardiacCycleDuration"
                        type="number"
                        :min="isMs ? convertByCurrentUnit(300) : convertByCurrentUnit(2000)"
                        :max="isMs ? convertByCurrentUnit(2000) : convertByCurrentUnit(300)"
                        :step="currentCardiacCycleDurationStep"
                        class="pt-0 text-input"
                        :disabled="disabledForm"
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
                        :disabled="disabledForm"
                      />
                      <SpinButtonWithInput
                        v-model.number="currentCardiacCycleDeviation"
                        type="number"
                        :min="0"
                        :step="currentCardiacCycleDeviationStep"
                        :max="isMs ? 400 : 20"
                        class="pt-0 text-input"
                        :disabled="disabledForm"
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
                            :disabled="disabledForm"
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
                                :disabled="disabledForm"
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
                                :disabled="disabledForm"
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
                                :disabled="disabledForm"
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
                                :disabled="disabledForm"
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
                      :disabled="disabledForm"
                      :is-preview="isPreview"
                      :initial-continuousecg-data="initialContinuousECGDataOfSelectedCardiacLevel"
                      @ecgDataChange="onEcgDataChange"
                    />
                  </div>
                </v-tab-item>
              </v-tabs-items>
            </v-col>
          </v-row>
          <div class="actions-group">
            <v-btn color="primary" @click="onSave()">{{
              selectedPatientPhysioId ? $t('global.save') : $t('global.add')
            }}</v-btn>
            <v-btn color="secondary" v-if="selectedPatientPhysioId && !isEdit" @click="onDuplicate()">{{
              $t('global.duplicate')
            }}</v-btn>
            <v-btn color="warning" v-if="selectedPatientPhysioId && !isEdit" @click="isEdit = true">{{
              $t('global.edit')
            }}</v-btn>
            <v-btn color="warning" v-if="selectedPatientPhysioId && isEdit" @click="onCancelEditProfile">{{
              $t('global.cancel')
            }}</v-btn>
            <v-btn color="error" v-if="selectedPatientPhysioId" @click="onDelete()">{{ $t('global.delete') }}</v-btn>
          </div>
        </v-col>
      </v-row>
    </b-card>
    <v-dialog v-model="isDeleteModalOpen" width="500">
      <template>
        <v-card>
          <v-card-title class="headline" primary-title>
            {{ $t('global.confirm') }}
          </v-card-title>
          <v-card-text>
            {{ $t('global.delete_this_profile') }}
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="isDeleteModalOpen = false">
              {{ $t('global.cancel') }}
            </v-btn>
            <v-btn color="red darken-1" text @click="onConfirmDelete">
              {{ $t('global.delete') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
    <v-dialog v-model="isConfirmCreateNewProfileModalOpen" width="500">
      <template>
        <v-card>
          <v-card-title class="headline" primary-title>
            {{ $t('global.confirm') }}
          </v-card-title>
          <v-card-text>
            {{ isDuplicate ? $t('global.duplicate_profile') : $t('global.create_new_profile') }}
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              text
              @click="
                isConfirmCreateNewProfileModalOpen = false
                isDuplicate = false
              "
            >
              {{ $t('global.cancel') }}
            </v-btn>
            <v-btn color="red darken-1" text @click="onConfirmCreateProfile">
              {{ $t('global.okay') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
    <b-modal id="modal-copy-cardiac-level" :title="`Copy from`" centered ok-only @ok="onCopyCardiacInfoFrom()">
      <template #modal-ok>
        {{ $t('global.okay') }}
      </template>

      <template #modal-cancel>
        {{ $t('global.cancel') }}
      </template>

      <div>
        <div>
          <v-select
            v-model="copyFromCardiacLevel"
            :items="otherCardiacLevelOptions"
            item-text="text"
            item-value="value"
            :label="`Cardiac level`"
            menu-props="auto"
          />
        </div>
      </div>
    </b-modal>
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
  DEFAULT_RESPIRATORY_CYLE_DURATION,
  DEFAULT_CARDIAC_CYCLE_DURATION,
  STROKE_VOL_OPTIONS,
} from '../../constants'
import SpinButtonWithInput from '../../components/SpinButtonWithInput.vue'
import PhysioConfigECGChart from '../../components/PhysioConfigECGChart.vue'
import PhysioPreviewECGChart from '../../components/PhysioPreviewECGChart.vue'
import { apiGet, apiPost, apiPut, apiDelete } from '@/util/api'
import { mapGetters, mapState } from 'vuex'
import _ from 'lodash'
import Vue from 'vue'
import config from '../../config'

const initialValue = {
  name: '',
  age: 20,
  cardiacCycleDuration: 700,
  cardiacCycleDeviation: 0,
  badBeats: BAD_BEATS.NONE,
  respiratoryCycleDuration: DEFAULT_RESPIRATORY_CYLE_DURATION,
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
  respiratoryCycleDuration: DEFAULT_RESPIRATORY_CYLE_DURATION,
  strokeVol: 40,
  difficulty: 1,
  breathHoldDuration: 0,
  unit: PHYSIO_UNIT.MS,
  cardiacLevels: [
    {
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
    {
      levelType: CARDIAC_LEVEL.BETA_BLOCKER,
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
    {
      levelType: CARDIAC_LEVEL.NITRO,
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
    {
      levelType: CARDIAC_LEVEL.NITRO_WITH_BB,
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
    {
      levelType: CARDIAC_LEVEL.STRESS,
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
  ],
}

export default {
  name: 'ManagePatientPhysio',
  components: {
    SpinButtonWithInput,
    PhysioConfigECGChart,
    PhysioPreviewECGChart,
  },
  data() {
    return {
      BAD_BEATS,
      BAD_BEATS_OPTIONS,
      STROKE_VOL_OPTIONS,
      PHYSIO_UNIT,
      PHYSIO_UNIT_OPTIONS,
      CARDIAC_LEVEL_OPTIONS,
      patientPhysioObjects: initialPhysioProfile,
      patientPhysioInitialObject: initialPhysioProfile,
      patientPhysioForm: initialValue,
      selectedPatientPhysioId: null,
      listPatientPhysios: [],
      isLoading: true,
      activeTab: 0,
      isEdit: false,
      isDeleteModalOpen: false,
      isConfirmCreateNewProfileModalOpen: false,
      isDuplicate: false,
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
      copyData: null,
      copyFromCardiacLevel: null,
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
    disabledForm() {
      return this.selectedPatientPhysioId && !this.isEdit
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
    selectedPatientPhysioId: 'onSelectedPatientPhysioIdChanged',
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
    cardiacLevelType: 'onSetPatientPhysioForm',
    patientPhysioObjects: 'onSetPatientPhysioForm',
  },
  mounted() {
    this.loadData()
  },
  methods: {
    onDuplicate() {
      this.isConfirmCreateNewProfileModalOpen = true
      this.isDuplicate = true
    },
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
    async loadData() {
      this.isLoading = true
      let response = await apiGet('/patientPhysio/all', this.accessToken)
      this.isLoading = false
      this.listPatientPhysios = _.get(response, ['data', 'data'])
    },
    async onSave() {
      this.onSaveCurrentPatientObject()
      if (this.selectedPatientPhysioId) {
        try {
          this.isLoading = true
          let response = await apiPut(
            `patientPhysio/${this.selectedPatientPhysioId}`,
            '',
            this.patientPhysioObjects,
            this.accessToken
          )
          if (response.data?.success) {
            this.$notify({
              text: `Updated successfully!`,
              type: 'success',
            })
            this.patientPhysioInitialObject = _.cloneDeep(response.data.data || initialValue)
          } else {
            this.$notify({
              text: _.get(response, ['data', 'message'], 'Save failed!'),
              type: 'error',
            })
          }
          this.isLoading = false
          this.loadData()
        } catch (err) {
          this.$notify({
            text: 'Save failed!',
            type: 'error',
          })
          this.isLoading = false
        }
      } else {
        try {
          if (!this.patientPhysioForm.name) {
            this.$notify({ type: 'warning', text: `Profile name can't be null!` })
            return
          }
          this.isLoading = true
          let response = await apiPost('patientPhysio', this.patientPhysioObjects, this.accessToken)
          if (response.data?.success) {
            this.$notify({
              text: `Created successfully!`,
              type: 'success',
            })
            this.patientPhysioInitialObject = _.cloneDeep(response.data.data || initialValue)
          } else {
            this.$notify({
              text: _.get(response, ['data', 'message'], 'Save failed!'),
              type: 'error',
            })
          }
          this.isLoading = false
          await this.loadData()
          this.selectedPatientPhysioId = _.get(response, ['data', 'data', 'id'])
        } catch (err) {
          this.$notify({
            text: 'Save failed!',
            type: 'error',
          })
          this.isLoading = false
        }
      }
    },
    async onConfirmDelete() {
      if (this.selectedPatientPhysioId) {
        this.isLoading = true
        let response = await apiDelete(`/patientPhysio/${this.selectedPatientPhysioId}`, this.accessToken)
        if (response.data?.success) {
          this.$notify({
            text: `Deleted successfully!`,
            type: 'success',
          })
          this.selectedPatientPhysioId = null
        } else {
          this.$notify({
            text: _.get(response, ['data', 'message'], 'Deleted fail!'),
            type: 'error',
          })
        }
        this.isLoading = false
        this.loadData()
      }
      this.isDeleteModalOpen = false
    },
    async onDelete() {
      this.isDeleteModalOpen = true
    },
    onCancelEditProfile() {
      // this.patientPhysioForm = {
      //   ...this.patientPhysioForm,
      //   ...this.patientPhysioInitialObject,
      // }
      this.patientPhysioObjects = _.cloneDeep(this.patientPhysioInitialObject)
      this.onFillLostCardiacLevelInfo()
      this.onSetPatientPhysioForm()
      this.onSetPatientPhysioGeneralForm()
      this.isEdit = false
    },
    addNewProfile() {
      this.isConfirmCreateNewProfileModalOpen = true
      this.isDuplicate = false
    },
    onConfirmCreateProfile() {
      this.selectedPatientPhysioId = null
      // this.patientPhysioForm = {
      //   ...this.patientPhysioForm,
      //   ...initialValue,
      // }
      if (this.isDuplicate) {
        this.patientPhysioObjects = {
          ..._.cloneDeep(this.patientPhysioObjects),
        }
        delete this.patientPhysioObjects.id
        for (const level of this.patientPhysioObjects.cardiacLevels) {
          delete level.id
        }
      } else {
        this.patientPhysioObjects = _.cloneDeep(initialPhysioProfile)
      }
      this.activeTab = 0
      this.isConfirmCreateNewProfileModalOpen = false
    },
    onSelectedPatientPhysioIdChanged() {
      this.clearTimeoutIgnoreResetPreview()
      this.cardiacLevelType = CARDIAC_LEVEL.INITIAL
      if (this.isDuplicate) {
        this.isDuplicate = false
        this.onFillLostCardiacLevelInfo()
        this.onSetPatientPhysioGeneralForm()
        return
      }
      if (!this.selectedPatientPhysioId) {
        this.patientPhysioObjects = initialPhysioProfile
        this.onFillLostCardiacLevelInfo()
        this.onSetPatientPhysioGeneralForm()
      } else {
        const data = this.listPatientPhysios.find((el) => el.id == this.selectedPatientPhysioId)
        this.isEdit = false
        this.patientPhysioInitialObject = _.cloneDeep(data || initialValue)
        this.patientPhysioObjects = _.cloneDeep(data || initialValue)
        this.onFillLostCardiacLevelInfo()
        this.onSetPatientPhysioGeneralForm()
      }
    },
    onFillLostCardiacLevelInfo() {
      if (!this.patientPhysioObjects.cardiacLevels) {
        this.patientPhysioObjects.cardiacLevels = []
      }

      this.patientPhysioObjects.cardiacLevels = [
        ...this.patientPhysioObjects.cardiacLevels,
        ...initialPhysioProfile.cardiacLevels.filter(
          (el) => !this.patientPhysioObjects.cardiacLevels.find((item) => item.levelType == el.levelType)
        ),
      ]
    },
    // Only set when patient physio object changed
    onSetPatientPhysioGeneralForm() {
      this.patientPhysioForm = {
        ...this.patientPhysioForm,
        ..._.pick(this.patientPhysioObjects, [
          'name',
          'age',
          'respiratoryCycleDuration',
          'strokeVol',
          'breathHoldDuration',
          'unit',
          'difficulty',
        ]),
      }
    },
    onSetPatientPhysioForm() {
      const selectedCardiacLevel = this.patientPhysioObjects.cardiacLevels.find(
        (el) => el.levelType == this.cardiacLevelType
      )

      this.patientPhysioForm = {
        ...this.patientPhysioForm,
        ..._.pick(selectedCardiacLevel, [
          'cardiacCycleDuration',
          'cardiacCycleDeviation',
          'badBeats',
          'badBeatsDuration',
          'continuousECGData',
        ]),
      }
    },
    onSaveCurrentCardiacInfo(cardiacType) {
      try {
        const continuousECGData = this.$refs.physioConfigECGChart.getECGData()
        this.patientPhysioObjects.cardiacLevels = this.patientPhysioObjects.cardiacLevels.map((el) => {
          if (el.levelType == cardiacType) {
            return {
              ...el,
              ..._.pick(this.patientPhysioForm, [
                'cardiacCycleDuration',
                'cardiacCycleDeviation',
                'badBeats',
                'badBeatsDuration',
              ]),
              continuousECGData,
            }
          }
          return el
        })
      } catch (err) {
        this.patientPhysioObjects.cardiacLevels = this.patientPhysioObjects.cardiacLevels.map((el) => {
          if (el.levelType == cardiacType) {
            return {
              ...el,
              ..._.pick(this.patientPhysioForm, [
                'cardiacCycleDuration',
                'cardiacCycleDeviation',
                'badBeats',
                'badBeatsDuration',
              ]),
            }
          }
          return el
        })
      }
    },
    onSaveCurrentPatientObject() {
      this.onSaveCurrentCardiacInfo(this.cardiacLevelType)

      this.patientPhysioObjects = {
        ...this.patientPhysioObjects,
        ..._.pick(this.patientPhysioForm, [
          'name',
          'age',
          'respiratoryCycleDuration',
          'strokeVol',
          'breathHoldDuration',
          'unit',
          'difficulty',
        ]),
      }
      this.onFillLostCardiacLevelInfo()
    },
    clearTimeoutIgnoreResetPreview() {
      if (this.timeoutIgnoreResetPreview) {
        clearTimeout(this.timeoutIgnoreResetPreview)
        this.isIgnoreResetPreview = false
      }
    },
    onConfirmCurrentCardiacLevelInfo(oldType, newType) {
      if (oldType != newType) {
        // Saved current cardiac level info
        this.onSaveCurrentCardiacInfo(oldType)

        this.cardiacLevelType = newType

        this.isIgnoreResetPreview = true

        this.timeoutIgnoreResetPreview = setTimeout(() => {
          this.isIgnoreResetPreview = false
        }, 300)
      }
    },
    onCopyCardiacInfoFrom() {
      const selectedCardiacLevel = this.patientPhysioObjects.cardiacLevels.find(
        (el) => el.levelType == this.copyFromCardiacLevel
      )
      if (selectedCardiacLevel) {
        this.copyData = _.cloneDeep(selectedCardiacLevel)
        this.patientPhysioObjects.cardiacLevels = this.patientPhysioObjects.cardiacLevels.map((el) => {
          if (el.levelType == this.cardiacLevelType) {
            return {
              ...el,
              ..._.pick(this.copyData, [
                'cardiacCycleDuration',
                'cardiacCycleDeviation',
                'badBeats',
                'badBeatsDuration',
                'continuousECGData',
              ]),
            }
          }
          return el
        })

        this.onSetPatientPhysioForm()

        Vue.notify({
          type: 'success',
          text: 'Copied successfully!',
        })
      } else {
        Vue.notify({
          type: 'warning',
          text: 'Cardiac level is invalid!',
        })
      }
    },
    onCopyCurrentCardiacInfo() {
      this.copyFromCardiacLevel = null
      this.$root.$emit('bv::show::modal', 'modal-copy-cardiac-level')
      // this.onSaveCurrentCardiacInfo(this.cardiacLevelType)
      // const selectedCardiacLevel = this.patientPhysioObjects.cardiacLevels.find(
      //   (el) => el.levelType == this.cardiacLevelType
      // )
      // this.copyData = _.cloneDeep(selectedCardiacLevel)
      // Vue.notify({
      //   type: 'success',
      //   text: 'Copied successfully!',
      // })
    },
    onPatseCurrentCardiacInfo() {
      if (this.copyData) {
        this.patientPhysioObjects.cardiacLevels = this.patientPhysioObjects.cardiacLevels.map((el) => {
          if (el.levelType == this.cardiacLevelType) {
            return {
              ...el,
              ..._.pick(this.copyData, [
                'cardiacCycleDuration',
                'cardiacCycleDeviation',
                'badBeats',
                'badBeatsDuration',
                'continuousECGData',
              ]),
            }
          }
          return el
        })

        this.onSetPatientPhysioForm()
        Vue.notify({
          type: 'success',
          text: 'Paste successfully!',
        })
      }
    },
  },
}
</script>
<style lang="scss">
.typed-input-container {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 80px;
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
.stroke-vol-select {
  padding-top: 0;
  margin-top: 0;
  width: 80px;
  .v-input__control {
    .v-text-field__details {
      display: none;
    }
  }
}
</style>
<style lang="scss" scoped>
.gap-10 {
  gap: 2.5rem;
}
.gap-5 {
  gap: 1.25rem;
}
.gap-2 {
  gap: 0.5rem;
}
.btn-toggle-cardiac-level {
  padding: 10px 20px;
  border-radius: 0;
  box-shadow: none;
  border: 1px solid $border-gray;
  cursor: pointer;
  &.active {
    background-color: $primary;
    color: white;
  }
}
.tab-container {
  padding: 10px;
}
.header-gradient-region {
  background-image: $gradient-gray !important;
  border: 0;
}
.actions-group {
  display: flex;
  margin-top: 20px;
  align-items: center;
  justify-content: end;
  gap: 20px;
  .v-btn {
    min-width: 150px;
    height: 45px;
  }
}
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba($color: #ffffff, $alpha: 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
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
