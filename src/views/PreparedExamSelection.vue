<template>
  <div class="home px-10">
    <v-container>
      <div v-if="showTutorialPage">
        <v-row>
          <v-col>
            <h2>{{ $t('prepared_exam.tutorial_title') }}</h2>
            <h4 class="sub-title">{{ $t('prepared_exam.how_it_works') }}</h4>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <div class="tutorial-step-circle">
              <span class="step-number">1.</span>
            </div>
            <div>
              <iframe
                width="560"
                height="315"
                :src="`https://www.youtube.com/embed/${assessmentVideoId}?cc_load_policy=0&cc_lang_pref=${languageCode}`"
                :title="assessmentVideoTitle"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </div>
          </v-col>
          <v-col>
            <!-- Vendor, Version, and Field Strength Selection Section -->
            <div class="tutorial-step-circle">
              <span class="step-number">2.</span>
            </div>
            <div>
              <v-card align="center" class="vendor-options pt-5">
                <h5 class="w-100 mb-0">{{ $t('prepared_exam.software_options') }}</h5>
                <v-container class="w-75 force-black-text">
                  <v-row class="mt-0">
                    <v-col>
                      <v-select
                        label="Software Vendor Setting"
                        :items="vendorItems"
                        v-model="softwareVendorPreference"
                        :hide-details="isCTLab"
                      ></v-select>
                    </v-col>
                  </v-row>
                  <v-row v-if="!isCTLab" class="mt-0">
                    <v-col>
                      <v-select
                        label="Software Version Setting"
                        :items="versionItems"
                        v-model="softwareVersionPreference"
                      ></v-select>
                    </v-col>
                  </v-row>
                  <v-row v-if="!isCTLab" class="mt-0">
                    <v-col>
                      <v-select
                        v-model="fieldStrengthPreference"
                        label="Field Strength"
                        :items="fieldStrengthPreferenceOptions()"
                      ></v-select>
                    </v-col>
                  </v-row>
                  <v-row v-if="isCTLab" class="mt-0">
                    <v-col>
                      <div class="text-left mb-1" style="font-weight: 500">
                        {{ $t('Profile.injection_settings', languageCode) }}
                      </div>
                      <div class="injection-mode-row">
                        <v-radio-group v-model="injectionMode" class="mt-0 injection-mode-radios" hide-details>
                          <v-radio
                            :label="$t('global.contrast_only', languageCode)"
                            :value="INJECTION_MODE.CONTRAST_ONLY"
                          ></v-radio>
                          <v-radio
                            :label="$t('global.contrast_and_saline', languageCode)"
                            :value="INJECTION_MODE.CONTRAST_AND_SALINE"
                          ></v-radio>
                        </v-radio-group>
                        <v-select
                          v-if="injectionMode == INJECTION_MODE.CONTRAST_ONLY"
                          v-model="defaultContrastOnlyProtocol"
                          :label="$t('Profile.default_injector_protocol_contrast_only', languageCode)"
                          :items="contrastOnlyProtocolOptions"
                          class="injection-mode-select"
                          hide-details
                        ></v-select>
                        <v-select
                          v-if="injectionMode == INJECTION_MODE.CONTRAST_AND_SALINE"
                          v-model="defaultContrastAndSalineProtocol"
                          :label="$t('Profile.default_injector_protocol_contrast_and_saline', languageCode)"
                          :items="contrastAndSalineProtocolOptions"
                          class="injection-mode-select"
                          hide-details
                        ></v-select>
                      </div>
                    </v-col>
                  </v-row>
                  <v-row v-if="isCTLab" class="mt-0">
                    <v-col>
                      <div class="text-left mb-1" style="font-weight: 500;">
                        {{ $t('Profile.contrast_dose_calculation_method', languageCode) }}
                      </div>
                      <v-radio-group v-model="injectCondition" class="mt-0" hide-details>
                        <v-radio
                          :label="$t('Profile.set_volume', languageCode)"
                          :value="INJECT_CONDITION.SET_VOLUME"
                        ></v-radio>
                        <v-radio
                          :label="$t('Profile.weight_based', languageCode)"
                          :value="INJECT_CONDITION.WEIGHT_BASED"
                        ></v-radio>
                      </v-radio-group>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card>
            </div>
          </v-col>
        </v-row>

        <!-- practice exam -->
        <v-row>
          <v-col class="practice-exam-column">
            <div class="tutorial-step-circle">
              <span class="step-number">3.</span>
            </div>
            <div class="d-flex align-center justify-center">
              <v-btn
                rounded
                color="primary"
                class="w-75 border-2 btn-exams"
                :key="practiceExam.id"
                @click="startPreparedExam(practiceExam)"
                v-if="getPracticeExam"
                :disabled="!canStartPracticeExam || isLoadingStartTest"
                >{{ practiceExam.title }}</v-btn
              >
            </div>
          </v-col>
          <v-col>
            <div class="tutorial-step-circle">
              <span class="step-number">4.</span>
            </div>
            <h3>{{ $t('prepared_exam.experience_lag') }}</h3>
            <div class="graphic-performance-container mt-1">
              <label class="graphic-performance-label">{{ $t('Profile.graphic_performance', languageCode) }}:</label>
              <v-select
                v-model="sliceFrameRate"
                :items="sliceFrameRates"
                class="force-black-text graphic-performance-select"
                hide-details
              ></v-select>
            </div>
            <p class="troubleshooting">
              {{ $t('prepared_exam.click') }}
              <a href="https://scanlabmr.com/reducing-lag/" target="_blank" rel="noopener noreferrer">
                {{ $t('prepared_exam.here') }}</a
              >
              {{ $t('prepared_exam.to_troubleshoot') }}
            </p>
          </v-col>
        </v-row>

        <!-- ScanLab Policies Section -->
        <v-row>
          <v-col>
            <v-card align="center" class="mt-7 pt-5 pa-5">
              <div class="tips-header-container">
                <div class="tutorial-step-circle tips-circle-left">
                  <span class="step-number">5.</span>
                </div>
              </div>
              <h4 class="pb-3">{{ policiesLinkText }}</h4>
              <p class="w-75 mx-auto">
                {{ $t('prepared_exam.review_policies', { policiesLink: policiesLinkText }) }}
              </p>
              <router-link to="/resources?category=1" target="_blank">
                {{ policiesLinkText }}
              </router-link>
            </v-card>
          </v-col>
        </v-row>

        <!-- Tips Section -->
        <v-row>
          <v-col>
            <v-card align="center" class="mt-7 pt-5 pa-5">
              <div class="tips-header-container">
                <div class="tutorial-step-circle tips-circle-left">
                  <span class="step-number">6.</span>
                </div>
              </div>
              <h4 class="pb-3">{{ $t('prepared_exam.tips') }}</h4>
              <div class="mt-3 w-75">
                <ol>
                  <li class="text-left pb-2">
                    <span class="pl-2">
                      {{ $t('prepared_exam.chrome_use_latest') }}
                      <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer">{{
                        $t('prepared_exam.here')
                      }}</a>
                    </span>
                  </li>
                  <li class="text-left pb-2">
                    <span class="pl-2">{{ $t('prepared_exam.close_other_tabs') }}</span>
                  </li>
                  <li class="text-left pb-2">
                    <span class="pl-2">
                      {{ $t('prepared_exam.stable_internet_recommended') }}
                      <a href="https://www.speedtest.net/" target="_blank" rel="noopener noreferrer">{{
                        $t('prepared_exam.here')
                      }}</a>
                    </span>
                  </li>
                  <li class="text-left pb-2">
                    <span class="pl-2">{{ $t('prepared_exam.mouse_recommended') }}</span>
                  </li>
                  <li class="text-left pb-2">
                    <span class="pl-2">
                      {{ $t('prepared_exam.review_policies_tip', { policiesLink: policiesLinkText }) }}
                    </span>
                  </li>
                </ol>
              </div>
              <div>
                <v-checkbox
                  class="mx-auto d-inline-block"
                  :label="$t('prepared_exam.understand_proceed')"
                  v-model="understoodTutorialCheckmark"
                />
              </div>
              <div class="proceed-button-container">
                <div class="tutorial-step-circle">
                  <span class="step-number">7.</span>
                </div>
                <div class="proceed-button-wrapper">
                  <v-btn color="primary" block rounded :disabled="!preExamValidation" @click="showTutorialPage = false">
                    {{ $t('global.proceed') }}
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Prepared Exams Section -->
      <div v-else>
        <h1 class="mt-5">{{ $t('PreparedExams.select_prepared_exam', languageCode) }}</h1>
        <v-btn
          rounded
          outlined
          elevation="2"
          class="ma-2 w-50 border-2 btn-exams"
          :key="exam.id"
          v-for="exam of preparedExams"
          @click="startPreparedExam(exam)"
          :disabled="preparedExamHasBeenTaken(exam) || isLoadingStartTest"
          >{{ exam.title }}{{ preparedExamHasBeenTaken(exam) ? ' - Completed' : '' }}</v-btn
        >
      </div>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { apiGet } from '../util/api'
import config from '../config'
import {
  INJECT_CONDITION,
  INJECTION_MODE,
  CONTRAST_ONLY_PROTOCOL_OPTIONS,
  CONTRAST_AND_SALINE_PROTOCOL_OPTIONS,
  MR_PRACTICE_EXAM_ID,
  CT_PRACTICE_EXAM_ID,
} from '../constants'

const frame_rates = ['High', 'Medium', 'Low', 'Budget']

export default {
  name: 'PreparedExamSelection',
  data() {
    return {
      preparedExams: [],
      takenPreparedExams: [],
      showTutorialPage: true,
      understoodTutorialCheckmark: false,
      fieldStrengthPreferenceLocal: null,
      softwareVendorPreferenceLocal: null,
      softwareVersionPreferenceLocal: null,
      sliceFrameRateLocal: null,
      injectConditionLocal: null,
      injectionModeLocal: null,
      defaultContrastOnlyProtocolLocal: null,
      defaultContrastAndSalineProtocolLocal: null,
      INJECT_CONDITION,
      INJECTION_MODE,
      contrastOnlyProtocolOptions: CONTRAST_ONLY_PROTOCOL_OPTIONS,
      contrastAndSalineProtocolOptions: CONTRAST_AND_SALINE_PROTOCOL_OPTIONS,
      practiceExam: null,
      assessmentVendorUIs: [
        {
          vendor: 'canon',
          label: 'Canon',
          ui: ['scanlab'],
        },
        {
          vendor: 'ge',
          label: 'GE',
          ui: ['scanlab'],
        },
        {
          vendor: 'hitachi',
          label: 'Hitachi',
          ui: ['scanlab'],
        },
        {
          vendor: 'philips',
          label: 'Philips',
          ui: ['scanlab'],
        },
        {
          vendor: 'siemens',
          label: 'Siemens',
          ui: ['b19', 'xa'],
        },
        {
          vendor: 'united',
          label: 'United',
          ui: ['scanlab'],
        },
      ],
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('cohortService', ['myCohort']),
    ...mapGetters('cohortService', ['vendorUIs']),
    ...mapGetters('user', ['languageCode', 'vendorStylePreference']),
    ...mapState('testRunService', ['isLoadingStartTest']),
    getPracticeExam() {
      return this.practiceExam
    },
    isCTLab() {
      return config.isCTLab
    },
    assessmentVideoId() {
      return this.isCTLab ? 'hTEr89HSvVE' : 'xBtGoUsFRXo'
    },
    assessmentVideoTitle() {
      return this.isCTLab
        ? this.$t('prepared_exam.ct_assessment_video_title')
        : this.$t('prepared_exam.mri_assessment_video_title')
    },
    policiesLinkText() {
      return this.isCTLab
        ? this.$t('prepared_exam.ct_policies_link')
        : this.$t('prepared_exam.mr_policies_link')
    },
    canStartPracticeExam() {
      if (this.isCTLab) {
        return !!this.assessmentVendorUIs.find((vendor) => vendor.vendor === this.softwareVendorPreference)
      }
      return (
        this.assessmentVendorUIs
          .find((vendor) => vendor.vendor === this.softwareVendorPreference)
          ?.ui.includes(this.softwareVersionPreference) ?? false
      )
    },
    fieldStrengthPreference: {
      get: function () {
        let output
        if (this.fieldStrengthPreferenceLocal !== null) {
          output = this.fieldStrengthPreferenceLocal
        } else {
          output = this.$store.getters['user/fieldStrengthPreference']
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.fieldStrengthPreferenceLocal = output
        }
        return output
      },
      set: function (newValue) {
        this.fieldStrengthPreferenceLocal = newValue
      },
    },
    softwareVendorPreference: {
      get() {
        let output
        if (this.softwareVendorPreferenceLocal !== null) {
          output = this.softwareVendorPreferenceLocal
        } else {
          output = this.$store.getters['user/softwareVendorPreference']
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.softwareVendorPreferenceLocal = output
        }
        return output
      },
      set(newValue) {
        this.softwareVendorPreferenceLocal = newValue
      },
    },
    softwareVersionPreference: {
      get: function () {
        let output
        if (this.softwareVersionPreferenceLocal !== null) {
          output = this.softwareVersionPreferenceLocal
        } else {
          output = this.$store.getters['user/softwareVersionPreference']
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.softwareVersionPreferenceLocal = output
        }
        return output
      },
      set: function (newValue) {
        this.softwareVersionPreferenceLocal = newValue
      },
    },
    injectCondition: {
      get() {
        return this.injectConditionLocal ?? this.$store.getters['user/injectCondition']
      },
      set(newValue) {
        this.injectConditionLocal = newValue
      },
    },
    injectionMode: {
      get() {
        return this.injectionModeLocal ?? this.$store.getters['user/injectionMode']
      },
      set(newValue) {
        this.injectionModeLocal = newValue
      },
    },
    defaultContrastOnlyProtocol: {
      get() {
        return this.defaultContrastOnlyProtocolLocal ?? this.$store.getters['user/defaultContrastOnlyProtocol']
      },
      set(newValue) {
        this.defaultContrastOnlyProtocolLocal = newValue
      },
    },
    defaultContrastAndSalineProtocol: {
      get() {
        return (
          this.defaultContrastAndSalineProtocolLocal ?? this.$store.getters['user/defaultContrastAndSalineProtocol']
        )
      },
      set(newValue) {
        this.defaultContrastAndSalineProtocolLocal = newValue
      },
    },
    sliceFrameRate: {
      get: function () {
        let output
        if (this.sliceFrameRateLocal !== null) {
          output = this.sliceFrameRateLocal
        } else {
          output = this.$store.getters['user/sliceFrameRate']
            ? this.$store.getters['user/sliceFrameRate']
            : 'High'
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.sliceFrameRateLocal = output
        }
        return output
      },
      set: function (newValue) {
        this.sliceFrameRateLocal = newValue
      },
    },
    skipSkillTutorial() {
      let skip = false
      if (this.$route.query.vendor && this.$route.query.version) {
        skip = true
      }
      return skip
    },
    vendorItems() {
      return this.assessmentVendorUIs.map((vendor) => {
        return { text: `${vendor.label}`, value: vendor.vendor }
      })
    },
    versionItems() {
      if (this.isCTLab) {
        return [{ text: 'ScanLab', value: 'scanlab' }]
      }
      return this.assessmentVendorUIs
        .find((vendor) => vendor.vendor == this.softwareVendorPreference)
        ?.ui.map((version) => {
          return { text: `${this.parseVersion(version).toUpperCase()}`, value: version }
        })
    },
    sliceFrameRates() {
      let items = []
      frame_rates.map((rate) => {
        items.push({ text: `${rate.toUpperCase()}`, value: `${rate}` })
      })
      return items
    },
    preExamValidation() {
      if (this.isCTLab) {
        let selectedVendor = this.assessmentVendorUIs.find((vendor) => vendor.vendor == this.softwareVendorPreference)
        return !!selectedVendor && this.understoodTutorialCheckmark
      }
      let output = false
      let selectedVendor = this.assessmentVendorUIs.find((vendor) => vendor.vendor == this.softwareVendorPreference)
      let selectedVersion = selectedVendor?.ui.find((version) => version == this.softwareVersionPreference)
      if (selectedVendor && selectedVersion && this.understoodTutorialCheckmark) {
        output = true
      }
      return output
    },
  },
  async mounted() {
    await this.loadUserCohorts()
    this.getCohortsPreparedExams()
    this.getTakenPreparedExams()
    document.body.classList.add('prep-bg')
    if (this.isCTLab) {
      this.softwareVersionPreference = 'scanlab'
    }
  },
  beforeDestroy() {
    document.body.classList.remove('prep-bg')
  },
  watch: {
    showTutorialPage(newValue) {
      if (!newValue) {
        this.savePreferences()
      }
    },
    skipSkillTutorial: {
      handler(newValue) {
        if (newValue) {
          this.softwareVendorPreference = this.$route.query.vendor
          this.softwareVersionPreference = this.$route.query.version
          this.showTutorialPage = false
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions('cohortService', ['loadUserCohorts']),
    ...mapActions('testRunService', ['startTest']),
    ...mapActions('user', ['saveUserPreferences', 'saveInjectCondition', 'saveInjectionMode']),
    ...mapGetters('user', ['fieldStrengthPreferenceOptions']),
    async getCohortsPreparedExams() {
      let response = await apiGet(`prepared-exams/${this.myCohort.id}`, this.accessToken, {
        type: this.$route.params.type,
      })
      if (response.status === 200) {
        this.preparedExams = response.data.exams
        const practiceExamId = this.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
        this.practiceExam = this.preparedExams.find((e) => e.id === practiceExamId)
        if (this.practiceExam) {
          this.preparedExams = this.preparedExams.filter((e) => e.id !== this.practiceExam.id)
        }
      }
    },
    async startPreparedExam(preparedExam) {
      await this.savePreferences()
      preparedExam.softwareVendor = this.softwareVendorPreference
      preparedExam.softwareVersion = this.softwareVersionPreference
      const test = await this.startTest({ preparedExam, skillTest: true })
      if (!test) return
      this.$router.push({ name: 'mri', query: { test: test.id } })
    },
    async getTakenPreparedExams() {
      let response = await apiGet(`prepared-exams/taken/${this.myCohort.id}`, this.accessToken)
      if (response.status === 200) {
        this.takenPreparedExams = response.data.takenExams
      }
    },
    preparedExamHasBeenTaken(exam) {
      return this.takenPreparedExams.includes(exam.id)
    },
    parseVersion(version) {
      switch (version) {
        case 'r57':
          version = 'R5.7'
          break
      }
      return version
    },
    async savePreferences() {
      // need to check if user has access to the selected version
      let confirmedVersion = this.confirmSoftwareVersionForSave(
        this.softwareVendorPreference,
        this.softwareVersionPreference
      )
      await this.saveUserPreferences({
        vendorStylePreference: this.vendorStylePreference,
        fieldStrengthPreference: this.fieldStrengthPreferenceLocal,
        softwareVendorPreference: this.softwareVendorPreferenceLocal,
        softwareVersionPreference: confirmedVersion,
        sliceFrameRate: this.sliceFrameRateLocal,
      })
      if (this.isCTLab && this.injectConditionLocal !== null) {
        this.saveInjectCondition({ injectCondition: this.injectConditionLocal })
      }
      if (
        this.isCTLab &&
        (this.injectionModeLocal !== null ||
          this.defaultContrastOnlyProtocolLocal !== null ||
          this.defaultContrastAndSalineProtocolLocal !== null)
      ) {
        this.saveInjectionMode({
          injectionMode: this.injectionMode,
          defaultContrastOnlyProtocol: this.defaultContrastOnlyProtocol,
          defaultContrastAndSalineProtocol: this.defaultContrastAndSalineProtocol,
        })
      }
    },
    confirmSoftwareVersionForSave(vendor, version) {
      //check if user has access to the selected version
      //otherwise default to scanlab
      let output = 'scanlab'
      if (this.vendorUIs[vendor] && this.vendorUIs[vendor][version] === true) {
        output = version
      }
      return output
    },
  },
}
</script>

<style scoped lang="scss">
.sub-title {
  color: rgb(177, 177, 177);
  font-size: 0.8em;
}
.vendor-options {
  min-height: 315px;
}
.injection-mode-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.injection-mode-radios {
  flex: 0 0 auto;
}
.injection-mode-select {
  flex: 1 1 auto;
  min-width: 0;
}
.troubleshooting {
  color: rgb(177, 177, 177);
  font-size: 1em;
}
.v-input--checkbox::v-deep {
  .v-label,
  .v-icon {
    color: #03b5aa;
  }
}
.btn-exams {
  background-color: white;
  border-color: #aaa;
  border-width: 1px;
}
.force-black-text {
  color: black !important;
}

.force-black-text ::v-deep .v-label {
  color: black !important;
}

.force-black-text ::v-deep .v-select__selection {
  color: black !important;
}

.graphic-performance-container {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 12px;
}

.graphic-performance-label {
  color: black;
  font-weight: 500;
  white-space: nowrap;
  margin-bottom: 0;
  line-height: 1.5;
}

.graphic-performance-select {
  max-width: 200px;
}

.graphic-performance-select.v-input {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.graphic-performance-select.v-text-field {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.tutorial-step-circle {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: 50% !important;
  background-color: #247ba0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 16px;
}

.step-number {
  color: white;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
}

.proceed-button-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: calc(25% + 32px + 12px);
  margin: 0 auto;
}

.proceed-button-container .tutorial-step-circle {
  margin-bottom: 0;
  flex-shrink: 0;
}

.proceed-button-wrapper {
  flex: 1;
  min-width: 0;
}

.tips-header-container {
  position: relative;
  width: 100%;
}

.tips-circle-left {
  position: absolute;
  left: 0;
  top: 0;
}
</style>
<style>
.prep-bg #app {
  background-image: url('../assets/img/bg-prep-exam-01.png'), url('../assets/img/bg-prep-exam-02.png');
  background-position: left 0% bottom 0%, right 10% top 20%;
  background-repeat: no-repeat, no-repeat;
}
</style>
