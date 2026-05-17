<!-- eslint-disable no-unused-vars -->
<!-- eslint-disable vue/no-side-effects-in-computed-properties -->
<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-container fluid>
    <v-card>
      <v-card-title>
        <h2>{{ $t('global.profile_settings', languageCode) }}</h2>
      </v-card-title>
      <v-tabs v-model="tab">
        <v-tab :key="tabArray[0]">{{ $t('global.statistics', languageCode) }}</v-tab>
        <v-tab :key="tabArray[1]">{{ $t('global.account_information', languageCode) }}</v-tab>
        <v-tab :key="tabArray[2]">{{ $t('global.password', languageCode) }}</v-tab>
        <v-tab :key="tabArray[3]">{{ $t('global.preferences', languageCode) }}</v-tab>
        <v-tab :key="tabArray[4]">{{ $t('global.configurations', languageCode) }}</v-tab>
      </v-tabs>

      <v-tabs-items v-model="tab">
        <!-- Statistics Tab -->
        <v-tab-item :key="tabArray[0]">
          <v-card>
            <MRIScoreLine
              :exact="true"
              :title="$t('Profile.scanlab_scores_by_body_part', languageCode)"
              :whom="`user_${userId}`"
              group="bodyPart"
              group-label="bodyPart"
              :has-score-sorting="false"
            ></MRIScoreLine>
            <SkillScoresBarChartOverall
              v-if="activeBodyParts.length > 1"
              :whom="`user_${userId}`"
            ></SkillScoresBarChartOverall>
            <SkillScoresLine v-if="activeBodyParts.length === 1" :whom="`user_${userId}`"></SkillScoresLine>
            <AngulationCurve :whom="`user_${userId}`"></AngulationCurve>
            <CoverageCurve :whom="`user_${userId}`"></CoverageCurve>
            <CriticalThinkingHeatMap
              :title="$t('global.critical_thinking_question_averages', languageCode)"
              :whom="`user_${userId}`"
            ></CriticalThinkingHeatMap>
          </v-card>
        </v-tab-item>

        <!-- Account Information Tab -->
        <v-tab-item :key="tabArray[1]">
          <v-card>
            <v-form>
              <v-container grid-list-md text-xs-center>
                <v-layout row wrap>
                  <v-flex xs6>
                    <v-text-field v-model.trim="email" :label="$t('global.email', languageCode)" />
                    <v-text-field v-model.trim="legalName" :label="$t('global.legal_name', languageCode)" />
                    <v-text-field v-model.trim="nickName" :label="$t('global.nickname', languageCode)" />
                  </v-flex>
                  <v-flex xs6>
                    <v-btn
                      color="primary"
                      :disabled="!canChangeInformation"
                      @click="saveUser({ email, nickName, legalName })"
                      >{{ $t('global.save_information', languageCode) }}</v-btn
                    >
                  </v-flex>
                </v-layout>
              </v-container>
            </v-form>
          </v-card>
        </v-tab-item>

        <!-- Password Tab -->
        <v-tab-item :key="tabArray[2]">
          <v-card>
            <v-form>
              <v-container grid-list-md text-xs-center>
                <v-layout row wrap>
                  <v-flex xs6>
                    <v-text-field
                      v-model="passwordInfo.currentPassword"
                      type="password"
                      :label="$t('Profile.current_password', languageCode)"
                    />
                    <v-text-field
                      v-model="passwordInfo.newPassword"
                      type="password"
                      :label="$t('Profile.new_password', languageCode)"
                    />
                  </v-flex>
                  <v-flex xs6>
                    <v-btn color="primary" :disabled="!canChangePassword" @click="saveNewPassword(passwordInfo)">
                      {{ $t('Profile.save_password', languageCode) }}
                    </v-btn>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-form>
          </v-card>
        </v-tab-item>

        <!-- Preferences Tab -->
        <v-tab-item :key="tabArray[3]">
          <v-card>
            <v-form>
              <v-container grid-list-md text-xs-center>
                <v-layout row wrap>
                  <v-flex xs6>
                    <!--
                    <v-select
                      v-model="vendorStylePreference"
                      label="Vendor Settings"
                      :items="vendorStylePreferenceOptions"
                    ></v-select>
                    -->
                    <v-select
                      v-model="softwareVendorPreference"
                      :label="$t('Profile.software_vendor_setting', languageCode)"
                      :items="softwareVendorItems"
                    ></v-select>
                    <v-select
                      v-model="fieldStrengthPreference"
                      :label="$t('Profile.field_strength', languageCode)"
                      :items="fieldStrengthPreferenceOptions()"
                      v-if="!isCTLab"
                    ></v-select>
                    <fieldset>
                      <legend>{{ $t('Profile.software_options', languageCode) }}:</legend>
                      <v-select
                        v-if="!isCTLab"
                        v-model="softwareVersionPreference"
                        :label="$t('Profile.software_version_setting', languageCode)"
                        :items="softwareVersionItems"
                      ></v-select>
                    </fieldset>
                  </v-flex>
                  <v-flex xs6>
                    <v-btn color="primary" :disabled="!canChangePreferences" @click="savePreferences(false)">
                      {{ $t('Profile.save_preferences', languageCode) }}
                    </v-btn>
                  </v-flex>
                  <v-flex xs6 class="mb-4">
                    <v-select
                      v-model="defaultLanguageCode"
                      :label="$t('Profile.default_language', languageCode)"
                      item-text="name"
                      item-value="code"
                      dense
                      hide-details
                      :items="filteredLanguages"
                    ></v-select>
                  </v-flex>
                  <v-flex xs6 class="mb-4">
                    <v-btn color="primary" @click="saveDefaultLanguage">
                      {{ $t('Profile.save_default_language', languageCode) }}
                    </v-btn>
                  </v-flex>
                  <template v-if="isCTLab">
                    <v-flex xs6 class="injection-mode-radio-group">
                      <div class="text-injection-settings">{{ $t('Profile.injection_settings', languageCode) }}</div>
                      <div>
                        <v-radio-group v-model="injectionMode" col>
                          <div class="injection-setting-items">
                            <div>
                              <v-radio
                                class="injection-setting-item-ratio"
                                :label="$t('global.contrast_only', languageCode)"
                                :value="INJECTION_MODE.CONTRAST_ONLY"
                              ></v-radio>
                              <v-radio
                                class="injection-setting-item-ratio"
                                :label="$t('global.contrast_and_saline', languageCode)"
                                :value="INJECTION_MODE.CONTRAST_AND_SALINE"
                              ></v-radio>
                            </div>
                            <div>
                              <v-select
                                v-if="injectionMode == INJECTION_MODE.CONTRAST_ONLY"
                                class="injection-setting-item-select"
                                v-model="defaultContrastOnlyProtocol"
                                :label="$t('Profile.default_injector_protocol_contrast_only', languageCode)"
                                :items="contrastOnlyProtocolOptions"
                              ></v-select>
                              <v-select
                                v-if="injectionMode == INJECTION_MODE.CONTRAST_AND_SALINE"
                                class="injection-setting-item-select"
                                v-model="defaultContrastAndSalineProtocol"
                                :label="$t('Profile.default_injector_protocol_contrast_and_saline', languageCode)"
                                :items="contrastAndSalineProtocolOptions"
                              ></v-select>
                            </div>
                          </div>
                        </v-radio-group>
                      </div>
                    </v-flex>
                    <v-flex xs6>
                      <v-btn color="primary" :disabled="!canChangeInjectionMode" @click="saveInjectorSettings">{{
                        $t('Profile.save_injection_mode', languageCode)
                      }}</v-btn>
                    </v-flex>
                  </template>
                  <template v-if="isCTLab">
                    <v-flex xs6 class="injection-mode-radio-group">
                      <div class="text-injection-settings">
                        {{ $t('Profile.contrast_dose_calculation_method', languageCode) }}
                      </div>
                      <div>
                        <v-radio-group v-model="injectCondition" col>
                          <div class="injection-setting-items">
                            <div>
                              <v-radio
                                class="injection-setting-item-ratio"
                                :label="$t('Profile.set_volume', languageCode)"
                                :value="INJECT_CONDITION.SET_VOLUME"
                              ></v-radio>
                              <v-radio
                                class="injection-setting-item-ratio"
                                :label="$t('Profile.weight_based', languageCode)"
                                :value="INJECT_CONDITION.WEIGHT_BASED"
                              ></v-radio>
                            </div>
                          </div>
                        </v-radio-group>
                      </div>
                    </v-flex>
                    <v-flex xs6>
                      <v-btn
                        color="primary"
                        :disabled="!canChangeInjectCondition"
                        @click="saveInjectConditionSettings"
                        >{{ $t('Profile.save_contrast_dose_calculation_method', languageCode) }}</v-btn
                      >
                    </v-flex>
                  </template>

                  <template v-if="!isCTLab">
                    <v-flex xs6 class="injection-mode-radio-group">
                      <div class="text-injection-settings">
                        {{ $t('Profile.slice_expansion_behavior', languageCode) }}
                      </div>
                      <div>
                        <v-radio-group v-model="sliceExpansionBehavior" col>
                          <div class="injection-setting-items">
                            <div>
                              <v-radio
                                class="injection-setting-item-ratio"
                                :label="$t('Profile.single_direction', languageCode)"
                                :value="SLICE_EXPANSION_BEHAVIOR.SINGLE_DIRECTION"
                              ></v-radio>
                              <v-radio
                                class="injection-setting-item-ratio"
                                :label="$t('Profile.both_directions', languageCode)"
                                :value="SLICE_EXPANSION_BEHAVIOR.BOTH_DIRECTIONS"
                              ></v-radio>
                            </div>
                          </div>
                        </v-radio-group>
                      </div>
                    </v-flex>
                    <v-flex xs6>
                      <v-btn
                        color="primary"
                        :disabled="!canChangeSliceExpansionBehavior"
                        @click="saveSliceExpansionBehaviorSettings"
                        >{{ $t('Profile.save_slice_expansion_behavior', languageCode) }}</v-btn
                      >
                    </v-flex>
                  </template>
                </v-layout>
              </v-container>
            </v-form>
          </v-card>
        </v-tab-item>

        <!-- Software Config Tab -->
        <v-tab-item :key="tabArray[4]">
          <v-card>
            <v-form>
              <v-container grid-list-md text-xs-center>
                <v-layout row wrap>
                  <v-flex xs6>
                    <v-select
                      v-model="sliceFrameRate"
                      :label="$t('Profile.graphic_performance', languageCode)"
                      :items="sliceFrameRates"
                    ></v-select>
                  </v-flex>
                  <v-flex xs6>
                    <v-btn color="primary" :disabled="!canChangeConfigurations" @click="savePreferences(true)">
                      {{ $t('Profile.save_configurations', languageCode) }}
                    </v-btn>
                  </v-flex>
                  <v-flex xs12 v-if="!isCTLab">
                    <v-divider class="mt-3"></v-divider>
                    <div class="subheading mt-3 font-weight-bold" style="text-align: left; display: flex; align-items: center; gap: 8px;">
                      {{ $t('Profile.scientific_mode', languageCode) }}
                      <v-tooltip top>
                        <template #activator="{ on, attrs }">
                          <v-icon small v-bind="attrs" v-on="on">mdi-information-outline</v-icon>
                        </template>
                        <span>{{ $t('Profile.scientific_mode_tooltip', languageCode) }}</span>
                      </v-tooltip>
                    </div>
                  </v-flex>
                  <v-flex xs6 v-if="!isCTLab && isScientificModeEnabled" style="padding-left: 24px">
                    <v-switch v-model="scientificModeTseBlur" :label="$t('Profile.tse_blur', languageCode)"></v-switch>
                    <v-switch
                      v-model="scientificModeResolution"
                      :label="$t('Profile.resolution', languageCode)"
                    ></v-switch>
                  </v-flex>
                  <v-flex xs6 v-if="!isCTLab && !isScientificModeEnabled" style="padding-left: 24px">
                    <div class="text--secondary">{{ $t('Profile.scientific_mode_not_enabled', languageCode) }}</div>
                  </v-flex>
                  <v-flex xs12 v-if="!isCTLab">
                    <v-divider class="mt-3"></v-divider>
                    <div class="subheading mt-3 font-weight-bold" style="text-align: left">
                      {{ $t('Profile.immersive_sound', languageCode) }}
                    </div>
                  </v-flex>
                  <v-flex xs6 v-if="!isCTLab" style="padding-left: 24px">
                    <v-switch
                      v-model="immersiveSound"
                      :label="$t('Profile.immersive_sound_label', languageCode)"
                    ></v-switch>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-form>
          </v-card>
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </v-container>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'
import MRIScoreLine from '../components/Statistics/MRIScoreLine'
import SkillScoresLine from '../components/Statistics/SkillScoresLine'
import SkillScoresBarChartOverall from '../components/Statistics/SkillScoresBarChartOverall'
import AngulationCurve from '../components/Statistics/AngulationCurve'
import CriticalThinkingHeatMap from '../components/Statistics/CriticalThinkingHeatMap'
import CoverageCurve from '../components/Statistics/CoverageCurve.vue'
import {
  INJECTION_MODE,
  INJECT_CONDITION,
  SLICE_EXPANSION_BEHAVIOR,
  CONTRAST_ONLY_PROTOCOL_OPTIONS,
  CONTRAST_AND_SALINE_PROTOCOL_OPTIONS,
} from '../constants'
import config from '../config'
// eslint-disable-next-line no-unused-vars
import _, { slice } from 'lodash'

const TAB_ARRAY = ['statistics', 'general', 'password', 'preferences', 'configurations']
const frame_rates = ['High', 'Medium', 'Low', 'Budget']

export default {
  name: 'Profile',
  components: {
    MRIScoreLine,
    AngulationCurve,
    CriticalThinkingHeatMap,
    CoverageCurve,
    SkillScoresLine,
    SkillScoresBarChartOverall,
  },
  data() {
    return {
      tabArray: TAB_ARRAY,
      userInfo: {
        legalName: null,
        nickName: null,
        email: null,
      },
      passwordInfo: {
        currentPassword: null,
        newPassword: null,
      },
      vendorStylePreferenceLocal: null,
      fieldStrengthPreferenceLocal: null,
      defaultLanguageCodeLocal: null,
      softwareVendorPreferenceLocal: null,
      softwareVersionPreferenceLocal: null,
      sliceFrameRateLocal: null,
      scientificModeLocal: null,
      immersiveSoundLocal: null,
      INJECTION_MODE,
      INJECT_CONDITION,
      SLICE_EXPANSION_BEHAVIOR,
      injectionModeLocal: null,
      injectConditionLocal: null,
      sliceExpansionBehaviorLocal: null,
      isCTLab: config.isCTLab,
      contrastOnlyProtocolOptions: CONTRAST_ONLY_PROTOCOL_OPTIONS,
      contrastAndSalineProtocolOptions: CONTRAST_AND_SALINE_PROTOCOL_OPTIONS,
      defaultContrastOnlyProtocolLocal: null,
      defaultContrastAndSalineProtocolLocal: null,
      defaultVenorUIs: {
        siemens: {
          scanlab: true,
        },
        ge: {
          scanlab: true,
        },
        philips: {
          scanlab: true,
        },
        hitachi: {
          scanlab: true,
        },
        united: {
          scanlab: true,
        },
        canon: {
          scanlab: true,
        },
      },
    }
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapGetters('authentication', ['userId']),
    ...mapState('statisticsService', ['activeBodyParts']),
    ...mapGetters('cohortService', ['vendorUIs', 'isScientificModeEnabled']),
    ...mapState('translatedContent', ['languageOptions', 'languagesTranslations']),
    filteredLanguages() {
      return this.languageOptions.filter((language) => language.name)
    },
    legalName: {
      get() {
        return this.userInfo.legalName ?? this.$store.state.user.legalName
      },
      set(newValue) {
        this.userInfo.legalName = newValue
      },
    },
    nickName: {
      get() {
        return this.userInfo.nickName ?? this.$store.state.user.nickName
      },
      set(newValue) {
        this.userInfo.nickName = newValue
      },
    },
    email: {
      get() {
        return this.userInfo.email ?? this.$store.state.user.email
      },
      set(newValue) {
        this.userInfo.email = newValue
      },
    },
    // vendorStylePreference: {
    //   get() {
    //     return this.vendorStylePreferenceLocal ?? this.$store.getters['user/vendorStylePreference']
    //   },
    //   set(newValue) {
    //     this.vendorStylePreferenceLocal = newValue
    //   },
    // },
    vendorStylePreference: {
      get() {
        let output
        if (this.vendorStylePreferenceLocal !== null) {
          output = this.vendorStylePreferenceLocal
        } else {
          output = this.$store.getters['user/vendorStylePreference']
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.vendorStylePreferenceLocal = output
        }
        return output
      },
      set(newValue) {
        this.vendorStylePreferenceLocal = newValue
      },
    },

    fieldStrengthPreference: {
      get() {
        if (this.fieldStrengthPreferenceLocal == null) {
          this.fieldStrengthPreferenceLocal = this.$store.getters['user/fieldStrengthPreference']
        }
        return this.fieldStrengthPreferenceLocal
      },
      set(newValue) {
        this.fieldStrengthPreferenceLocal = newValue
      },
    },
    defaultLanguageCode: {
      get() {
        return this.defaultLanguageCodeLocal ?? this.$store.getters['user/defaultLanguageCode']
      },
      set(newValue) {
        this.defaultLanguageCodeLocal = newValue
      },
    },
    softwareVendorItems() {
      let items = []
      let vendors = !_.isEmpty(this.vendorUIs) ? this.vendorUIs : this.defaultVenorUIs
      for (let vendor in vendors) {
        for (let version in vendors[vendor]) {
          if (vendors[vendor][version] === true) {
            items.push({ text: `${vendor.toUpperCase()}`, value: `${vendor}` })
            break
          }
        }
      }
      return items
    },
    softwareVersionItems() {
      let items = []
      let vendors = !_.isEmpty(this.vendorUIs) ? this.vendorUIs : this.defaultVenorUIs
      for (let version in vendors[this.softwareVendorPreference]) {
        if (vendors[this.softwareVendorPreference][version] === true) {
          items.push({ text: `${this.parseVersion(version).toUpperCase()}`, value: `${version}` })
        }
      }

      return items
    },
    sliceFrameRates() {
      let items = []
      frame_rates.map((rate) => {
        items.push({ text: `${rate.toUpperCase()}`, value: `${rate}` })
      })
      return items
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
    sliceFrameRate: {
      get: function () {
        let output
        if (this.sliceFrameRateLocal !== null) {
          output = this.sliceFrameRateLocal
        } else {
          output = this.$store.getters['user/sliceFrameRate']
            ? this.$store.getters['user/sliceFrameRate']
            : this.sliceFrameRates[0].value
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.sliceFrameRateLocal = output
        }
        return output
      },
      set: function (newValue) {
        this.sliceFrameRateLocal = newValue
      },
    },
    scientificModeTseBlur: {
      get() {
        return this.scientificModeLocal?.tseBlur ?? this.$store.state.user.scientificMode?.tseBlur ?? false
      },
      set(value) {
        this.scientificModeLocal = { tseBlur: value, resolution: this.scientificModeResolution }
      },
    },
    scientificModeResolution: {
      get() {
        return this.scientificModeLocal?.resolution ?? this.$store.state.user.scientificMode?.resolution ?? false
      },
      set(value) {
        this.scientificModeLocal = { tseBlur: this.scientificModeTseBlur, resolution: value }
      },
    },
    immersiveSound: {
      get() {
        return this.immersiveSoundLocal ?? this.$store.getters['user/immersiveSound']
      },
      set(value) {
        this.immersiveSoundLocal = value
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
    injectCondition: {
      get() {
        return this.injectConditionLocal ?? this.$store.getters['user/injectCondition']
      },
      set(newValue) {
        this.injectConditionLocal = newValue
      },
    },
    sliceExpansionBehavior: {
      get() {
        return this.sliceExpansionBehaviorLocal ?? this.$store.getters['user/sliceExpansionBehavior']
      },
      set(newValue) {
        this.sliceExpansionBehaviorLocal = newValue
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
    canChangeInformation() {
      return (
        (this.legalName !== this.$store.state.user.legalName ||
          this.nickName !== this.$store.state.user.nickName ||
          this.email !== this.$store.state.user.email) &&
        this.email &&
        this.nickName &&
        this.legalName
      )
    },
    canChangePreferences() {
      return (
        this.vendorStylePreference !== this.$store.state.user.vendorStylePreference ||
        this.fieldStrengthPreference !== this.$store.state.user.fieldStrengthPreference ||
        this.softwareVendorPreference !== this.$store.state.user.softwareVendorPreference ||
        this.softwareVersionPreference !== this.$store.state.user.softwareVersionPreference
      )
    },
    canChangeConfigurations() {
      return (
        this.sliceFrameRate !== this.$store.state.user.sliceFrameRate ||
        this.scientificModeTseBlur !== (this.$store.state.user.scientificMode?.tseBlur ?? false) ||
        this.scientificModeResolution !== (this.$store.state.user.scientificMode?.resolution ?? false) ||
        this.immersiveSound !== this.$store.getters['user/immersiveSound']
      )
    },
    canChangeSoftwareVendor: function () {
      return this.softwareVendorPreference !== this.$store.state.user.softwareVendorPreference
    },
    canChangeSoftwareVersion: function () {
      return this.softwareVersionPreference !== this.$store.state.user.softwareVersionPreference
    },
    canChangeInjectionMode() {
      return (
        this.injectionMode !== this.$store.state.user.injectionMode ||
        this.defaultContrastOnlyProtocol !== this.$store.state.user.defaultContrastOnlyProtocol ||
        this.defaultContrastAndSalineProtocol !== this.$store.state.user.defaultContrastAndSalineProtocol
      )
    },
    canChangeInjectCondition() {
      return this.injectCondition !== this.$store.state.user.injectCondition
    },
    canChangeSliceExpansionBehavior() {
      return this.sliceExpansionBehavior !== this.$store.state.user.sliceExpansionBehavior
    },
    canChangePassword() {
      return (
        this.passwordInfo.newPassword &&
        this.passwordInfo.currentPassword &&
        this.passwordInfo.currentPassword !== this.passwordInfo.newPassword
      )
    },
    tab: {
      get() {
        return this.tabArray.indexOf(this.$route.query.tab)
      },
      set(newValue) {
        this.$router.replace({ query: { tab: this.tabArray[newValue] } })
      },
    },
  },
  mounted() {
    this.$store.dispatch('cohortService/loadUserCohorts')
    this.$store.dispatch('questionService/getListPatientModel')
  },
  methods: {
    ...mapGetters('user', [
      'vendorStylePreferenceOptions',
      'fieldStrengthPreferenceOptions',
      'softwareVendorOptions',
      'softwareVersionOptions',
    ]),
    ...mapActions('user', [
      'saveUser',
      'saveNewPassword',
      'saveUserPreferences',
      'saveDefaultLanguageCode',
      'saveFieldStrengthPreference',
      'saveVendorStylePreference',
      'saveInjectionMode',
      'saveLanguage',
      'saveInjectCondition',
      'saveSliceExpansionBehavior',
    ]),
    saveInjectorSettings() {
      this.saveInjectionMode({
        injectionMode: this.injectionMode,
        defaultContrastOnlyProtocol: this.defaultContrastOnlyProtocol,
        defaultContrastAndSalineProtocol: this.defaultContrastAndSalineProtocol,
      })
    },
    saveInjectConditionSettings() {
      this.saveInjectCondition({ injectCondition: this.injectCondition })
    },
    saveSliceExpansionBehaviorSettings() {
      this.saveSliceExpansionBehavior({ sliceExpansionBehavior: this.sliceExpansionBehavior })
    },
    async savePreferences(isConfig) {
      await this.saveUserPreferences({
        vendorStylePreference: this.vendorStylePreferenceLocal,
        fieldStrengthPreference: this.fieldStrengthPreferenceLocal,
        softwareVendorPreference: this.softwareVendorPreferenceLocal,
        softwareVersionPreference: this.softwareVersionPreferenceLocal,
        sliceFrameRate: this.sliceFrameRateLocal,
        scientificMode: this.scientificModeLocal ?? this.$store.state.user.scientificMode,
        immersiveSound: this.immersiveSoundLocal ?? this.$store.getters['user/immersiveSound'],
        isConfig: isConfig,
      }).then(() => {
        this.vendorStylePreferenceLocal = this.$store.getters['user/vendorStylePreference']
        this.fieldStrengthPreferenceLocal = this.$store.getters['user/fieldStrengthPreference']
        //this.softwareVendorPreferenceLocal = this.$store.getters['user/softwareVendorPreference']
        //this.softwareVersionPreferenceLocal = this.$store.getters['user/softwareVersionPreference']
      })
    },
    async saveDefaultLanguage() {
      // Change the language code of user to this.defaultLanguageCode
      this.saveLanguage({ language: { code: this.defaultLanguageCode } })
      await this.saveDefaultLanguageCode({ defaultLanguageCode: this.defaultLanguageCode }).then(() => {
        this.defaultLanguageCodeLocal = this.$store.getters['user/defaultLanguageCode']
      })
    },
    parseVersion(version) {
      switch (version) {
        case 'r57':
          version = 'R5.7'
          break
      }
      return version
    },
  },
  watch: {
    '$store.state.user.softwareVendorPreference': function () {
      this.softwareVendorPreferenceLocal = this.$store.state.user.softwareVendorPreference
    },
    '$store.state.user.softwareVersionPreference': function () {
      this.softwareVersionPreferenceLocal = this.$store.state.user.softwareVersionPreference
    },
    '$store.state.user.sliceFrameRate': function () {
      this.sliceFrameRateLocal = this.$store.state.user.sliceFrameRate
    },
  },
}
</script>

<style lang="scss" scoped>
.injection-setting-items {
  display: flex;
  gap: 24px;
  justify-content: center;
  width: 100%;
  flex-wrap: wrap;
  justify-content: start;
  .injection-setting-item-ratio {
    width: 170px;
  }
  .injection-setting-item-select {
    width: auto;
    max-width: 250px;
  }
}
.injection-mode-radio-group {
  .text-injection-settings {
    text-align: left;
  }
  .v-radio {
    .v-label {
      margin-bottom: 0;
    }
  }
}
::v-deep .theme--light.v-select .v-select__selections {
  color: black !important;
}
</style>
