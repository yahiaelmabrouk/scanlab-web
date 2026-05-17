<template>
  <v-card v-if="mode === 'volume'" class="w-100 mt-3 pt-5">
    <div class="volume-wrapper">
      <v-row class="w-100">
        <v-col :cols="5">
          <div class="d-flex pt-5">
            <div class="font-weight-bold">{{ $t('global.directions') }}:</div>
            <div class="text-justify pl-2">
              <span v-html="injectorActivityDirections"></span>
            </div>
          </div>
          <v-expansion-panels accordion tile hover v-if="currentPreviewCriticalQuestion" class="mt-2">
            <v-expansion-panel>
              <v-expansion-panel-header>
                <v-row> {{ $t('global.patient_screening_form', languageCode) }}</v-row>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <div style="max-height: 350px; overflow-y: auto">
                  <CriticalThinkingQuizPreviewForm />
                </div>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col :cols="5">
          <div ref="volumeContainer">
            <v-row class="justify-content-center">
              <v-radio-group v-model="testInjectConditionLocal" row class="inject-condition-radio-group">
                <v-radio :label="$t('Profile.set_volume', languageCode)" :value="INJECT_CONDITION.SET_VOLUME"></v-radio>
                <v-radio
                  :label="$t('Profile.weight_based', languageCode)"
                  :value="INJECT_CONDITION.WEIGHT_BASED"
                ></v-radio>
              </v-radio-group>
            </v-row>
            <v-row class="justify-content-center">
              <canvas id="c" ref="extraCanvas" style="width: 380px; height: 480px; transform: rotate(180deg)"></canvas>
            </v-row>
            <v-row style="flex-wrap: nowrap">
              <v-col class="justify-content-end d-flex">
                <div class="d-flex align-items-center pl-8" style="width: 220px">
                  <div style="position: relative">
                    <div style="cursor: pointer" @click="changeContrast('up')" @mousedown="onPressUpContrastButton()">
                      <v-icon size="30">arrow_drop_up</v-icon>
                    </div>
                    <div
                      style="cursor: pointer"
                      @click="changeContrast('down')"
                      @mousedown="onPressDownContrastButton()"
                    >
                      <v-icon size="30">arrow_drop_down</v-icon>
                    </div>
                  </div>
                  <v-text-field
                    class="d-inline-block"
                    :label="$t('global.contrast_volume', languageCode)"
                    :key="inputKey"
                    v-model="displayContrastVolume"
                    type="number"
                    outlined
                    :step="volumnStep"
                    :max="maximumVolumn"
                    min="0"
                    hide-details
                  ></v-text-field>
                  {{ $t('Injector.ml', languageCode) }}
                </div>
              </v-col>
              <v-col>
                <div class="d-flex align-items-center pr-8" style="width: 220px">
                  <div style="position: relative">
                    <div
                      :class="{ 'arrow-button-disabled': testInjectionModeLocal == INJECTION_MODE.CONTRAST_ONLY }"
                      style="cursor: pointer"
                      @click="changeSaline('up')"
                      @mousedown="onPressUpSalineButton()"
                    >
                      <v-icon size="30">arrow_drop_up</v-icon>
                    </div>
                    <div
                      :class="{ 'arrow-button-disabled': testInjectionModeLocal == INJECTION_MODE.CONTRAST_ONLY }"
                      style="cursor: pointer"
                      @click="changeSaline('down')"
                      @mousedown="onPressDownSalineButton()"
                    >
                      <v-icon size="30">arrow_drop_down</v-icon>
                    </div>
                  </div>
                  <v-text-field
                    class="d-inline-block"
                    :label="$t('global.saline_volume', languageCode)"
                    :key="inputKey"
                    v-model="displaySalineVolume"
                    type="number"
                    outlined
                    :step="volumnStep"
                    :max="maximumVolumn"
                    min="0"
                    hide-details
                    :disabled="testInjectionModeLocal == INJECTION_MODE.CONTRAST_ONLY"
                  ></v-text-field>
                  {{ $t('Injector.ml', languageCode) }}
                </div>
              </v-col>
            </v-row>
          </div>
        </v-col>
        <v-col :cols="2">
          <v-radio-group v-model="testInjectionModeLocal" col class="inject-mode-radio-group">
            <v-radio :label="$t('global.contrast_only', languageCode)" :value="INJECTION_MODE.CONTRAST_ONLY"></v-radio>
            <v-radio
              :label="$t('global.contrast_and_saline', languageCode)"
              :value="INJECTION_MODE.CONTRAST_AND_SALINE"
            ></v-radio>
          </v-radio-group>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-btn class="btn-color-green" @click="onSubmit">{{ $t('global.confirm', languageCode) }}</v-btn>
        </v-col>
      </v-row>
    </div>
  </v-card>
  <v-card v-else-if="mode === 'flow'" class="m-0">
    <v-container class="flow-container" ref="flowContainer" id="flowContainer">
      <v-row class="m-0">
        <v-col>
          <v-container class="p-0">
            <v-row class="mt-8">
              <v-select
                class="injector-protocol-item-select"
                v-model="testInjectorProtocolValue"
                :label="$t('Injector.injector_protocol', languageCode)"
                :items="protocolOptions"
                :disabled="isArmed"
              ></v-select>
            </v-row>
            <v-row
              :align="'center'"
              class="mt-3"
              v-if="
                testInjectorProtocolValue == injectorProtocols.TEST_AND_BOLUS ||
                isTestAndBolusBiPhasic ||
                isTestBolusAndTTP ||
                isTestAndTTPBolusBiPhasic
              "
            >
              <v-col class="col-6 h-100">
                <v-sheet
                  class="flow-label saline-flow-label h-100"
                  :class="{ injected: testSaline.testInjectedPercent >= 100, 'btn-glowing': isOnTestSalineProcess }"
                  :rounded="'lg'"
                  >{{ $t('Injector.test', languageCode) }}</v-sheet
                >
              </v-col>
              <v-col class="col-6 px-0 py-1">
                <div
                  class="flow-rate-input"
                  :class="{
                    'small-input': isTestAndBolusBiPhasic || isTestBolusAndTTP || isTestAndTTPBolusBiPhasic,
                  }"
                >
                  <SpinButtonWithInput
                    :value="testSaline.vol"
                    :step="1"
                    :min="10"
                    :max="20"
                    :disabled="isArmed"
                    @input="updateTestSalineVol"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.vol_ml', languageCode) }}</span>
                </div>
                <div
                  class="flow-rate-input mt-1"
                  :class="{
                    'small-input': isTestAndBolusBiPhasic || isTestBolusAndTTP || isTestAndTTPBolusBiPhasic,
                  }"
                >
                  <SpinButtonWithInput
                    :value="testSaline.rate"
                    :step="0.5"
                    :min="0.5"
                    :max="10000"
                    :disabled="isArmed"
                    @input="updateTestSalineRate"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.ml_per_sec', languageCode) }}</span>
                </div>
              </v-col>
            </v-row>
            <v-row :align="'center'" class="mt-3" v-if="isTestBolusAndTTP || isTestAndTTPBolusBiPhasic">
              <v-col class="col-6 h-100">
                <v-sheet
                  class="flow-label contrast-flow-label h-100"
                  :class="{ injected: testContrast.testInjectedPercent >= 100, 'btn-glowing': isOnTestContrastProcess }"
                  :rounded="'lg'"
                  >{{ $t('Injector.test', languageCode) }}</v-sheet
                >
              </v-col>
              <v-col class="col-6 px-0 py-1">
                <div class="flow-rate-input small-input">
                  <SpinButtonWithInput
                    :value="testContrast.vol"
                    :step="1"
                    :min="10"
                    :max="20"
                    :disabled="isArmed"
                    @input="updateTestContrastVol"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.vol_ml', languageCode) }}</span>
                </div>
                <div class="flow-rate-input mt-1 small-input">
                  <SpinButtonWithInput
                    :value="testContrast.rate"
                    :step="0.5"
                    :min="0.5"
                    :max="10000"
                    :disabled="isArmed"
                    @input="updateTestContrastRate"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.ml_per_sec', languageCode) }}</span>
                </div>
              </v-col>
            </v-row>
            <v-row
              :align="'center'"
              class="mt-3"
              v-if="
                isTestAndBolusBiPhasic ||
                isTestAndTTPBolusBiPhasic ||
                testInjectorProtocolValue == injectorProtocols.BOLUS_BI_PHASIC
              "
            >
              <v-col class="col-6 h-100">
                <v-sheet
                  class="flow-label contrast-flow-label"
                  :class="{ injected: contrast1.injectedPercent >= 100, 'btn-glowing': isOnContrast1Process }"
                  :rounded="'lg'"
                  >{{ $t('Injector.contrast', languageCode) }}</v-sheet
                >
              </v-col>
              <v-col class="col-6 px-0 py-1">
                <div
                  class="flow-rate-input"
                  :class="{ 'small-input': testInjectorProtocolValue != injectorProtocols.BOLUS_BI_PHASIC }"
                >
                  <SpinButtonWithInput
                    :value="contrast1.vol"
                    :step="0.5"
                    :min="0.5"
                    :max="+value.contrast.volume"
                    :disabled="isArmed"
                    @input="updateContrast1Vol"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.vol_ml', languageCode) }}</span>
                </div>
                <div
                  class="flow-rate-input mt-1"
                  :class="{ 'small-input': testInjectorProtocolValue != injectorProtocols.BOLUS_BI_PHASIC }"
                >
                  <SpinButtonWithInput
                    :value="contrast1.rate"
                    :step="0.5"
                    :min="0.5"
                    :max="10000"
                    :disabled="isArmed"
                    @input="updateContrast1Rate($event)"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.ml_per_sec', languageCode) }}</span>
                </div>
              </v-col>
            </v-row>
            <v-row
              :align="'center'"
              class="mt-3"
              v-if="
                isTestAndBolusBiPhasic ||
                isTestAndTTPBolusBiPhasic ||
                testInjectorProtocolValue == injectorProtocols.BOLUS_BI_PHASIC
              "
            >
              <v-col class="col-6 h-100">
                <v-sheet
                  class="flow-label contrast-flow-label"
                  :class="{ injected: contrast2.injectedPercent >= 100, 'btn-glowing': isOnContrast2Process }"
                  :rounded="'lg'"
                  >{{ $t('Injector.contrast', languageCode) }}</v-sheet
                >
              </v-col>
              <v-col class="col-6 px-0 py-1">
                <div
                  class="flow-rate-input"
                  :class="{ 'small-input': testInjectorProtocolValue != injectorProtocols.BOLUS_BI_PHASIC }"
                >
                  <SpinButtonWithInput
                    :value="contrast2.vol"
                    :step="0.5"
                    :min="0.5"
                    :max="+value.contrast.volume"
                    :disabled="isArmed"
                    @input="updateContrast2Vol"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.vol_ml', languageCode) }}</span>
                </div>
                <div
                  class="flow-rate-input mt-1"
                  :class="{ 'small-input': testInjectorProtocolValue != injectorProtocols.BOLUS_BI_PHASIC }"
                >
                  <SpinButtonWithInput
                    :value="contrast2.rate"
                    :step="0.5"
                    :min="0.5"
                    :max="10000"
                    :disabled="isArmed"
                    @input="updateContrast2Rate($event)"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.ml_per_sec', languageCode) }}</span>
                </div>
              </v-col>
            </v-row>
            <v-row class="mt-3" :align="'center'" v-if="isTestAndBolusBiPhasic || isTestAndTTPBolusBiPhasic">
              <v-col class="col-6 h-100">
                <v-sheet
                  class="flow-label saline-flow-label"
                  :class="{ injected: salineInjectedPercentValue >= 100, 'btn-glowing': isOnSalineProcess }"
                  :rounded="'lg'"
                  >{{ $t('Injector.saline', languageCode) }}</v-sheet
                >
              </v-col>
              <v-col class="col-6 px-0 py-1">
                <div class="flow-rate-input small-input">
                  <SpinButtonWithInput
                    :value="+saline.vol"
                    :step="0.5"
                    :min="0.5"
                    :max="+value.saline.volume"
                    :disabled="isArmed"
                    @input="updateSalineVol"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.vol_ml', languageCode) }}</span>
                </div>
                <div class="flow-rate-input mt-1 small-input">
                  <SpinButtonWithInput
                    :value="value.saline.flow"
                    :step="0.5"
                    :min="0.5"
                    :max="100000"
                    :disabled="isArmed"
                    @input="updateSalineFlow($event)"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.ml_per_sec', languageCode) }}</span>
                </div>
              </v-col>
            </v-row>
            <v-row
              :align="'center'"
              class="mt-3"
              v-if="
                testInjectorProtocolValue == injectorProtocols.TEST_AND_BOLUS ||
                testInjectorProtocolValue == injectorProtocols.BOLUS ||
                isTestBolusAndTTP
              "
            >
              <v-col
                class="col-6"
                :class="{
                  'py-1': testInjectorProtocolValue !== injectorProtocols.BOLUS,
                }"
              >
                <v-sheet
                  class="flow-label contrast-flow-label"
                  :class="{ injected: contrastInjectedPercentValue >= 100, 'btn-glowing': isOnContrastProcess }"
                  :rounded="'lg'"
                  >{{ $t('Injector.contrast', languageCode) }}</v-sheet
                >
              </v-col>
              <v-col class="col-6 px-0" :class="{ 'py-1': testInjectorProtocolValue !== injectorProtocols.BOLUS }">
                <div class="flow-rate-input">
                  <SpinButtonWithInput
                    :value="value.contrast.flow"
                    :step="0.5"
                    :min="0.5"
                    :max="100000"
                    :disabled="isArmed"
                    @input="updateContrastFlow($event)"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.ml_per_sec', languageCode) }}</span>
                </div>
              </v-col>
            </v-row>
            <v-row
              :align="'center'"
              class="mt-3"
              v-if="
                testInjectorProtocolValue == injectorProtocols.TEST_AND_BOLUS ||
                (testInjectorProtocolValue == injectorProtocols.BOLUS && !isContrastOnly) ||
                isTestBolusAndTTP
              "
            >
              <v-col
                class="col-6"
                :class="{
                  'py-1': testInjectorProtocolValue !== injectorProtocols.BOLUS,
                }"
              >
                <v-sheet
                  class="flow-label saline-flow-label"
                  :class="{ injected: salineInjectedPercentValue >= 100, 'btn-glowing': isOnSalineProcess }"
                  :rounded="'lg'"
                  >{{ $t('Injector.saline', languageCode) }}</v-sheet
                >
              </v-col>
              <v-col class="col-6 px-0" :class="{ 'py-1': testInjectorProtocolValue !== injectorProtocols.BOLUS }">
                <div class="flow-rate-input">
                  <SpinButtonWithInput
                    :value="value.saline.flow"
                    :step="0.5"
                    :min="0.5"
                    :max="100000"
                    :disabled="isArmed"
                    @input="updateSalineFlow($event)"
                    @focus="onFocus"
                    @blur="onBlur"
                  />
                  <span>{{ $t('Injector.ml_per_sec', languageCode) }}</span>
                </div>
              </v-col>
            </v-row>
            <v-row class="mt-3">
              <v-col :class="{ 'py-1': testInjectorProtocolValue !== injectorProtocols.BOLUS }">
                <v-divider
                  color="darkgrey"
                  class="w-75 mx-auto"
                  :class="{ 'my-1': testInjectorProtocolValue !== injectorProtocols.BOLUS }"
                ></v-divider>
              </v-col>
            </v-row>
            <v-row :align="'center'" :class="{ 'mt-2': isTestAndBolusBiPhasic || isTestAndTTPBolusBiPhasic }">
              <v-col class="col-7" :class="{ 'py-1': isTestAndBolusBiPhasic || isTestAndTTPBolusBiPhasic }">
                <v-sheet
                  v-if="isTestAndBolusBiPhasic || isTestAndTTPBolusBiPhasic"
                  class="duration-label total-duration-label"
                  :rounded="'lg'"
                >
                  {{ $t('Injector.total_duration', languageCode) }}
                </v-sheet>
                <v-sheet v-else class="duration-label total-duration-label" :rounded="'lg'">
                  {{ $t('Injector.total', languageCode) }}<br />{{ $t('Injector.duration', languageCode) }}
                </v-sheet>
              </v-col>
              <v-col class="p-0">
                <v-text-field
                  class="d-inline-block w-60"
                  :value="totalDuration"
                  type="number"
                  outlined
                  disabled
                  dense
                  hide-details
                ></v-text-field>
                {{ $t('Injector.sec', languageCode) }}
              </v-col>
            </v-row>
            <v-row :align="'center'" :class="{ 'mt-2': isTestAndBolusBiPhasic || isTestAndTTPBolusBiPhasic }">
              <v-col class="col-7" :class="{ 'py-1': isTestAndBolusBiPhasic || isTestAndTTPBolusBiPhasic }">
                <v-sheet
                  v-if="isTestAndBolusBiPhasic || isTestAndTTPBolusBiPhasic"
                  class="duration-label contrast-duration-label"
                  :rounded="'lg'"
                >
                  {{ $t('Injector.contrast_duration', languageCode) }}
                </v-sheet>
                <v-sheet v-else class="duration-label contrast-duration-label" :rounded="'lg'">
                  {{ $t('Injector.contrast', languageCode) }}<br />{{ $t('Injector.duration', languageCode) }}
                </v-sheet>
              </v-col>
              <v-col class="p-0">
                <v-text-field
                  class="d-inline-block w-60"
                  :value="contrastDuration"
                  type="number"
                  outlined
                  disabled
                  dense
                  hide-details
                ></v-text-field>
                {{ $t('Injector.sec', languageCode) }}
              </v-col>
            </v-row>
            <v-row>
              <v-col class="pe-1 col-6">
                <button
                  v-if="!isArmed"
                  class="control-btn arm-control-btn flex-item"
                  :class="{
                    'small-button': isTestAndBolusBiPhasic || isTestAndTTPBolusBiPhasic,
                    'btn-glowing': !isDisableArm,
                  }"
                  @click="setArmed"
                  :disabled="isDisableArm"
                >
                  {{ $t('Injector.arm', languageCode) }}
                </button>
                <button
                  v-if="isArmed"
                  class="control-btn cancel-control-btn"
                  :class="{ 'small-button': isTestAndBolusBiPhasic || isTestAndTTPBolusBiPhasic }"
                  @click="setArmed"
                  :disabled="isDisableArm"
                >
                  {{ $t('global.cancel', languageCode) }}
                </button>
              </v-col>
              <v-col class="ps-1 col-6">
                <button
                  class="control-btn inject-control-btn"
                  :class="{
                    'small-button': isTestAndBolusBiPhasic || isTestAndTTPBolusBiPhasic,
                    'btn-glowing': !(!isArmed || isDisableInject) && !isInjecting && !isShowResumeButton,
                  }"
                  @click="inject"
                  :disabled="!isArmed || isDisableInject"
                >
                  {{
                    isInjecting
                      ? $t('Injector.stop', languageCode)
                      : isShowResumeButton
                      ? $t('Injector.resume', languageCode)
                      : $t('Injector.inject', languageCode)
                  }}
                </button>
              </v-col>
            </v-row>
          </v-container>
        </v-col>
        <v-col class="plunger-zone-col">
          <v-row>
            <v-col class="px-2">
              <div>
                <div class="text-left pl-4">
                  <strong>{{ $t('Injector.saline', languageCode) }}</strong>
                </div>
                <v-text-field
                  class="d-inline-block w-60"
                  :value="currentSalineVolumn"
                  type="number"
                  outlined
                  disabled
                  dense
                  hide-details
                ></v-text-field>
                {{ $t('Injector.ml', languageCode) }}
              </div>
            </v-col>
            <v-col class="px-2">
              <div>
                <div class="text-left pl-3">
                  <strong>{{ $t('Injector.contrast', languageCode) }}</strong>
                </div>
                <v-text-field
                  class="d-inline-block w-60"
                  :value="currentContrastVolumn"
                  type="number"
                  outlined
                  disabled
                  dense
                  hide-details
                ></v-text-field>
                {{ $t('Injector.ml', languageCode) }}
              </div>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="plunger-container-wrapper">
              <div
                class="plunger-container"
                ref="plungerContainer"
                :style="{
                  transform: `scale(${plungerContainerScale})`,
                  marginBottom: `-${Math.round((1 - plungerContainerScale) * 500)}px`,
                }"
              >
                <canvas id="c" ref="canvas"></canvas>
                <div class="timmer">
                  <div class="d-flex justify-content-center align-items-center">
                    <img class="timmer-icon ml-1" src="@/assets/icon-timer.png" />
                    <div class="clock ml-1">
                      {{ timerFormatted }}
                    </div>
                  </div>
                  <div class="mt-2 inject-speed-container">
                    <button
                      class="btn-increse-inject-speed"
                      :class="{ active: injectionRunningSpeedFactor == INJECTOR_SPEED.TWO_TIMES }"
                      @click="handleRunFaster(INJECTOR_SPEED.TWO_TIMES)"
                    >
                      <span class="text-times">{{ `2x` }}</span>
                      <img
                        v-if="injectionRunningSpeedFactor == INJECTOR_SPEED.TWO_TIMES"
                        src="@/assets/img/double-flash.jpg"
                      />
                      <v-icon v-else :color="'#000'" size="24">mdi-flash-off</v-icon>
                    </button>
                    <button
                      class="btn-increse-inject-speed"
                      :class="{ active: injectionRunningSpeedFactor == INJECTOR_SPEED.FOURTH_TIMES }"
                      @click="handleRunFaster(INJECTOR_SPEED.FOURTH_TIMES)"
                    >
                      <span class="text-times">{{ `4x` }}</span>
                      <img
                        v-if="injectionRunningSpeedFactor == INJECTOR_SPEED.FOURTH_TIMES"
                        src="@/assets/img/double-flash.jpg"
                      />
                      <v-icon v-else :color="'#000'" size="24">mdi-flash-off</v-icon>
                    </button>
                    <button
                      class="btn-increse-inject-speed"
                      :class="{ active: injectionRunningSpeedFactor == INJECTOR_SPEED.EIGHTH_TIMES }"
                      @click="handleRunFaster(INJECTOR_SPEED.EIGHTH_TIMES)"
                    >
                      <span class="text-times">{{ `8x` }}</span>
                      <img
                        v-if="injectionRunningSpeedFactor == INJECTOR_SPEED.EIGHTH_TIMES"
                        src="@/assets/img/double-flash.jpg"
                      />
                      <v-icon v-else :color="'#000'" size="24">mdi-flash-off</v-icon>
                    </button>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
import imgBg from '@/assets/bottles.png'
import imgExtraBg from '@/assets/extra-bottles.png'
import imgPlungerBlue from '@/assets/plunger-blue-full.png'
import imgPlungerGreen from '@/assets/plunger-green-full.png'
import imgTimerIcon from '@/assets/icon-timer.png'
import { mapActions, mapState, mapMutations, mapGetters } from 'vuex'
import _ from 'lodash'
import html2canvas from 'html2canvas'
import EventBus from '@/lib/event-bus'
import CriticalThinkingQuizPreviewForm from '@/components/CriticalThinkingQuizPreviewForm'
import {
  INJECTION_MODE,
  CONTRAST_ONLY_PROTOCOL_OPTIONS,
  CONTRAST_AND_SALINE_PROTOCOL_OPTIONS,
  INJECTOR_PROTOCOLS,
  INJECTOR_FLOW_TYPES,
  INJECTOR_SPEED,
  INJECT_CONDITION,
  BODY_PART_TYPE,
} from '../constants'
import SpinButtonWithInput from './SpinButtonWithInput.vue'
import Vue from 'vue'
import config from '../config'
import { getInjectionRunningSpeedDuration } from '../util/utils'

export default {
  components: {
    CriticalThinkingQuizPreviewForm,
    SpinButtonWithInput,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    mode: {
      type: String,
      required: true,
      validator(value) {
        return ['volume', 'flow'].includes(value)
      },
    },
    //emits: [update:value],
  },
  data() {
    return {
      INJECTOR_FLOW_TYPES,
      INJECT_CONDITION,
      INJECTOR_SPEED,
      vueCanvas: null,
      vueExtraCanvas: null,
      imageUrls: [
        {
          name: 'bg',
          src: imgBg,
        },
        {
          name: 'extraBg',
          src: imgExtraBg,
        },
        {
          name: 'plungerBlue',
          src: imgPlungerBlue,
        },
        {
          name: 'plungerGreen',
          src: imgPlungerGreen,
        },
        {
          name: 'timerIcon',
          src: imgTimerIcon,
        },
      ],
      images: {},
      // startY: -222,
      // endY: 3,
      // currentY: -222,
      // lastUpdate: null,
      // distance: 0,
      // ppsContrast: 0,
      // ppsContrastForPeriod: 0,
      // ppsSaline: 0,
      // ppsTestSaline: 0,
      // isInjecting: false,
      // isFirstInject: true,
      INJECTION_MODE,
      requestAnimationId: null,
      contrastOnlyProtocolOptions: CONTRAST_ONLY_PROTOCOL_OPTIONS,
      contrastAndSalineProtocolOptions: CONTRAST_AND_SALINE_PROTOCOL_OPTIONS,
      injectorProtocols: INJECTOR_PROTOCOLS,
      // saline: {
      //   vol: 0,
      //   rate: 1,
      //   injectedPercent: 0,
      // },
      isHighLightInjectButton: false,
      interval: null,
      isCTLab: config.isCTLab,
      plungerContainerScale: 1,
      inputKey: null,
      translatedBodyPartName: '',
      isResetNextDeltaTime: true,
    }
  },
  watch: {
    value: {
      deep: true,
      handler: 'updateExtraCanvas',
    },
    testInjectionModeLocal() {
      this.updateExtraCanvas()
    },
    testInjectorProtocolValue() {
      this.onSetDefaultValueForInjectPeriod()
    },
    contrastDuration: 'onContrastDurationChanged',
    contrast1Duration: 'onContrast1DurationChanged',
    contrast2Duration: 'onContrast2DurationChanged',
    testContrastDuration: 'onTestContrastDurationChanged',
    contrastFlowRate: 'onContrastFlowRateChanged',
    contrast1FlowRate: 'onContrast1FlowRateChanged',
    contrast2FlowRate: 'onContrast2FlowRateChanged',
    testContrastFlowRate: 'onTestContrastFlowRateChanged',
    'testContrast.vol': 'onSetDefaultValueForInjectPeriod',
    questionSetBodyPartId(newValue) {
      if (newValue) {
        this.translateBodyPartName(newValue)
      }
    },
    languageCode() {
      this.translateBodyPartName(this.questionSetBodyPartId)
    },
  },
  async mounted() {
    if (this.questionSetBodyPartId) {
      await this.translateBodyPartName(this.questionSetBodyPartId)
    }
    if (this.isTimingDecisionQuestion && this.isStartCountDownProcess && !this.delayStartTime) {
      this.delayStartTime = Date.now()
    }
    if (this.mode === 'volume') {
      this.images = await this.preloadImages(this.imageUrls).then((arr) =>
        arr.reduce((map, img) => {
          map[img.name] = img.element
          return map
        }, {})
      )
      let ec = this.$refs.extraCanvas
      ec.width = 245
      ec.height = 320
      let ctxEc = ec.getContext('2d')
      this.vueExtraCanvas = ctxEc

      this.updateExtraCanvas()
    }

    if (this.mode === 'flow') {
      const salineFlow = _.get(this.value, ['saline', 'flow'], 1)
      if (salineFlow) {
        this.setSalineFlow(+salineFlow)
      }
      const contrastFlow = _.get(this.value, ['contrast', 'flow'], 1)
      if (contrastFlow) {
        this.setContrastFlow(+contrastFlow)
      }

      this.images = await this.preloadImages(this.imageUrls).then((arr) =>
        arr.reduce((map, img) => {
          map[img.name] = img.element
          return map
        }, {})
      )

      let c = this.$refs.canvas
      c.width = 245
      c.height = 500
      let ctx = c.getContext('2d')
      this.vueCanvas = ctx

      this.initCanvas()
      this.initScaleOfPlungerContainer()
    }

    this.onSetDefaultValueForInjectPeriod()

    // When user move from timing decision question to next question -> Continue count down
    if (this.isStartPowerInjectProcess && this.mode === 'flow') {
      if (!this.lastUpdate) {
        this.lastUpdate = Date.now()
      }
      this.drawPlunger(
        (-222 * this.currentSalineVolumn) / this.maximumVolumn,
        (-222 * this.currentContrastVolumn) / this.maximumVolumn
      )
      if (this.contrastInjectedPercentValue < 100) {
        if (
          this.testInjectorProtocolValue == this.injectorProtocols.TEST_AND_BOLUS ||
          this.isTestAndBolusBiPhasic ||
          this.isTestBolusAndTTP ||
          this.isTestAndTTPBolusBiPhasic
        ) {
          if (this.testSaline.testInjectedPercent == 100 && this.isArmed && !this.isInjecting && this.isFirstInject) {
            if (this.isTestBolusAndTTP || this.isTestAndTTPBolusBiPhasic) {
              if (
                this.testContrast.testInjectedPercent == 100 &&
                this.isArmed &&
                !this.isInjecting &&
                this.isFirstInject
              ) {
                // No action
              } else {
                this.animateStep1()
              }
            } else {
              // No action
            }
          } else {
            this.animateStep1()
          }
        } else {
          this.animateStep1()
        }
      } else {
        this.animateStep2()
      }
    }

    this.onContrastDurationChanged()
    this.onContrast1DurationChanged()
    this.onContrast2DurationChanged()
    this.onTestContrastDurationChanged()
    this.onContrastFlowRateChanged()
    this.onContrast1FlowRateChanged()
    this.onContrast2FlowRateChanged()
    this.onTestContrastFlowRateChanged()

    if (this.mode === 'flow') {
      this.$store.commit('injectorService/set', { isPowerInjectorFlowReady: true })
      EventBus.$emit('powerInjectorFlowReady')
    }

    EventBus.$on('onSetDelayTime', this.onSetDelayTime)
    document.addEventListener('mouseup', this.onCancelInterval)
  },
  beforeDestroy() {
    this.$store.commit('injectorService/set', { isPowerInjectorFlowReady: false })
    EventBus.$off('onSetDelayTime', this.onSetDelayTime)
    document.removeEventListener('mouseup', this.onCancelInterval)

    const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
    cancelAnimationFrame(this.requestAnimationId)
    this.requestAnimationId = null

    if (this.interval) {
      clearInterval(this.interval)
    }
  },
  computed: {
    ...mapState('questionService', [
      'criticalThinkingQuestionsPreview',
      'testInjectionMode',
      'testInjectCondition',
      'injectionRunningSpeed',
      'scanDelay',
      'testInjectorProtocol',
      'selectedStackQuestionIndex',
      'isSubmittingAnswer',
      'isPlayingTheSlices',
    ]),
    ...mapGetters('questionService', [
      'questionSetBodyPartName',
      'questionSetBodyPartTypeName',
      'questionSetBodyPartTypeId',
      'questionSetBodyPartId',
    ]),
    ...mapGetters('user', ['languageCode']),
    ...mapState('selectionConfig', ['powerInjectorCurrentDuration']),
    ...mapState('injectorService', [
      'salineInjectedPercent',
      'contrastInjectedPercent',
      'testSalineProcess',
      'testContrastProcess',
      'contrast1Process',
      'contrast2Process',
      'isArmedInjector',
      'isStartPowerInjectProcess',
      'ppsContrastValue',
      'ppsContrastForPeriodValue',
      'ppsSalineValue',
      'ppsTestSalineValue',
      'ppsTestContrastValue',
      'isInjectingValue',
      'isFirstInjectValue',
      'salineProcess',
      'distanceValue',
      'currentYValue',
      'endYValue',
      'startYValue',
      'isShowResumeButtonValue',
      'lastUpdateValue',
      'firstUpdatedFlow',
      'shouldBindAllFlowToFirstChangedFlow',
      'isInjectorTimerPausedForTransition',
    ]),
    ...mapState('globalOptions', ['isAppLoading']),
    bodyPartTypeText() {
      const typeId = this.questionSetBodyPartTypeId
      if (typeId === BODY_PART_TYPE.WITH_OUT || typeId === BODY_PART_TYPE.WITH_CONTRAST) {
        return ` ${this.$t('ContrastTypes.' + typeId, this.languageCode)}`
      }
      return ''
    },
    maximumVolumn() {
      return this.isCTLab ? 200 : 20
    },
    displayContrastVolume: {
      get() {
        return Math.max(0, Math.min(_.get(this.value, ['contrast', 'volume'], 0), this.maximumVolumn))
      },
      set(val) {
        this.updateContrastVolume(val)
      },
    },
    displaySalineVolume: {
      get() {
        return Math.max(0, Math.min(_.get(this.value, ['saline', 'volume'], 0), this.maximumVolumn))
      },
      set(val) {
        this.updateSalineVolume(val)
      },
    },
    volumnStep() {
      return this.isCTLab ? 10 : 1
    },
    firstUpdatedFlowType: {
      get() {
        return this.firstUpdatedFlow
      },
      set(val) {
        this.setFirstUpdatedFlow(val)
      },
    },
    lastUpdate: {
      get() {
        return this.lastUpdateValue
      },
      set(val) {
        this.setLastUpdateValue(val)
      },
    },
    isShowResumeButton: {
      get() {
        return this.isShowResumeButtonValue
      },
      set(val) {
        this.setIsShowResumeButtonValue(val)
      },
    },
    startY: {
      get() {
        return this.startYValue
      },
      set(val) {
        this.setStartYValue(val)
      },
    },
    endY: {
      get() {
        return this.endYValue
      },
      set(val) {
        this.setEndYValue(val)
      },
    },
    currentY: {
      get() {
        return this.currentYValue
      },
      set(val) {
        this.setCurrentYValue(val)
      },
    },
    distance: {
      get() {
        return this.distanceValue
      },
      set(val) {
        this.setDistanceValue(val)
      },
    },
    saline: {
      get() {
        return this.salineProcess
      },
      set(val) {
        this.setSalineProcess(val)
      },
    },
    isFirstInject: {
      get() {
        return this.isFirstInjectValue
      },
      set(val) {
        this.setIsFirstInjectValue(val)
      },
    },
    isInjecting: {
      get() {
        return this.isInjectingValue
      },
      set(val) {
        this.setIsInjectingValue(val)
      },
    },
    ppsTestSaline: {
      get() {
        return this.ppsTestSalineValue
      },
      set(val) {
        this.setPpsTestSalineValue(val)
      },
    },
    ppsTestContrast: {
      get() {
        return this.ppsTestContrastValue
      },
      set(val) {
        this.setPpsTestContrastValue(val)
      },
    },
    ppsSaline: {
      get() {
        return this.ppsSalineValue
      },
      set(val) {
        this.setPpsSalineValue(val)
      },
    },
    ppsContrast: {
      get() {
        return this.ppsContrastValue
      },
      set(val) {
        this.setPpsContrastValue(val)
      },
    },
    ppsContrastForPeriod: {
      get() {
        return this.ppsContrastForPeriodValue
      },
      set(val) {
        this.setPpsContrastForPeriodValue(val)
      },
    },
    shouldShowHighlight() {
      return this.isInjecting || (this.isFirstInject && this.isHighLightInjectButton)
    },
    isOnTestSalineProcess() {
      return (
        (this.testInjectorProtocolValue == this.injectorProtocols.TEST_AND_BOLUS ||
          this.isTestAndBolusBiPhasic ||
          this.isTestBolusAndTTP ||
          this.isTestAndTTPBolusBiPhasic) &&
        this.isArmed &&
        this.testSaline.testInjectedPercent < 100
      )
    },
    isOnTestContrastProcess() {
      return (
        (this.isTestBolusAndTTP || this.isTestAndTTPBolusBiPhasic) &&
        this.isArmed &&
        !this.isOnTestSalineProcess &&
        this.testContrast.testInjectedPercent < 100
      )
    },
    isOnContrast1Process() {
      return (
        (this.isTestAndBolusBiPhasic ||
          this.isTestAndTTPBolusBiPhasic ||
          this.testInjectorProtocolValue == this.injectorProtocols.BOLUS_BI_PHASIC) &&
        this.isArmed &&
        !this.isOnTestSalineProcess &&
        !this.isOnTestContrastProcess &&
        this.contrast1.injectedPercent < 100 &&
        this.shouldShowHighlight
      )
    },
    isOnContrast2Process() {
      return (
        (this.isTestAndBolusBiPhasic ||
          this.isTestAndTTPBolusBiPhasic ||
          this.testInjectorProtocolValue == this.injectorProtocols.BOLUS_BI_PHASIC) &&
        this.isArmed &&
        !this.isOnTestSalineProcess &&
        !this.isOnTestContrastProcess &&
        !this.isOnContrast1Process &&
        this.contrast2.injectedPercent < 100 &&
        this.shouldShowHighlight
      )
    },
    isOnContrastProcess() {
      return (
        (this.testInjectorProtocolValue == this.injectorProtocols.TEST_AND_BOLUS ||
          this.isTestBolusAndTTP ||
          this.testInjectorProtocolValue == this.injectorProtocols.BOLUS) &&
        this.isArmed &&
        !this.isOnTestSalineProcess &&
        !this.isOnTestContrastProcess &&
        !this.isOnContrast1Process &&
        !this.isOnContrast2Process &&
        this.contrastInjectedPercentValue < 100 &&
        this.shouldShowHighlight
      )
    },
    isOnSalineProcess() {
      return (
        this.isArmed &&
        !this.isOnTestSalineProcess &&
        !this.isOnTestContrastProcess &&
        !this.isOnContrast1Process &&
        !this.isOnContrast2Process &&
        !this.isOnContrastProcess &&
        this.salineInjectedPercentValue < 100 &&
        this.shouldShowHighlight
      )
    },
    isArmed: {
      get() {
        return this.isArmedInjector
      },
      set(val) {
        this.setIsArmedInjector(val)
      },
    },
    salineInjectedPercentValue: {
      get() {
        return this.salineInjectedPercent
      },
      set(val) {
        this.setSalineInjectedPercent(val)
      },
    },
    contrastInjectedPercentValue: {
      get() {
        return this.contrastInjectedPercent
      },
      set(val) {
        this.setContrastInjectedPercent(val)
      },
    },
    testSaline: {
      get() {
        return this.testSalineProcess
      },
      set(val) {
        this.setTestSalineProcess(val)
      },
    },
    testContrast: {
      get() {
        return this.testContrastProcess
      },
      set(val) {
        this.setTestContrastProcess(val)
      },
    },
    contrast1: {
      get() {
        return this.contrast1Process
      },
      set(val) {
        this.setContrast1Process(val)
      },
    },
    contrast2: {
      get() {
        return this.contrast2Process
      },
      set(val) {
        this.setContrast2Process(val)
      },
    },
    isDisableInject() {
      return (
        (this.testSaline.isCountDownTest && this.isInjecting) ||
        (this.testContrast.isCountDownTest && this.isInjecting) ||
        (this.contrastInjectedPercentValue >= 100 && this.salineInjectedPercentValue >= 100)
      )
    },
    isDisableArm() {
      return this.contrastInjectedPercentValue >= 100 && this.salineInjectedPercentValue >= 100
    },
    isContrastOnly() {
      return this.testInjectionMode == this.INJECTION_MODE.CONTRAST_ONLY
    },
    protocolOptions() {
      if (this.testInjectionMode == this.INJECTION_MODE.CONTRAST_ONLY) {
        return this.contrastOnlyProtocolOptions
      } else {
        return this.contrastAndSalineProtocolOptions
      }
    },
    testInjectorProtocolValue: {
      get() {
        return this.testInjectorProtocol
      },
      set(val) {
        this.setTestInjectorProtocol(val)
      },
    },
    injectionRunningSpeedFactor: {
      get: function () {
        return this.injectionRunningSpeed
      },
      set: function (value) {
        this.setInjectionRunningSpeed(value)
      },
    },
    currentDuration: {
      get: function () {
        return this.powerInjectorCurrentDuration
      },
      set: function (value) {
        this.setPowerInjectorCurrentDuration(value)
      },
    },
    testInjectionModeLocal: {
      get: function () {
        return this.testInjectionMode
      },
      set: function (value) {
        if (value == this.INJECTION_MODE.CONTRAST_ONLY) {
          let output = { ...this.value }
          output.saline.volume = 0
          this.emitUpdate(output)
        }
        this.setTestInjectionMode(value)
      },
    },
    testInjectConditionLocal: {
      get: function () {
        return this.testInjectCondition
      },
      set: function (value) {
        this.setTestInjectCondition(value)
      },
    },
    injectorActivityDirections() {
      return this.$t('global.injector_activity_directions', {
        bodyPartName: `${this.translatedBodyPartName}${this.bodyPartTypeText}`,
      })
    },
    totalDuration() {
      return this.contrastDuration + this.salineDuration
    },
    isTestAndBolusBiPhasic() {
      return this.testInjectorProtocolValue == this.injectorProtocols.TEST_AND_BOLUS_BI_PHASIC
    },
    isTestAndTTPBolusBiPhasic() {
      return this.testInjectorProtocolValue == this.injectorProtocols.TEST_BOLUS_AND_TTP_BI_PHASIC
    },
    isTestBolusAndTTP() {
      return this.testInjectorProtocolValue == this.injectorProtocols.TEST_BOLUS_AND_TTP
    },
    testSalineDuration() {
      if (this.testSaline.vol > 0 && this.testSaline.rate > 0) {
        return this.testSaline.vol / this.testSaline.rate
      } else {
        return 0
      }
    },
    testContrastDuration() {
      if (this.testContrast.vol > 0 && this.testContrast.rate > 0) {
        return this.testContrast.vol / this.testContrast.rate
      } else {
        return 0
      }
    },
    salineVolAfterTestProcess() {
      if (
        this.testInjectorProtocolValue == this.injectorProtocols.TEST_AND_BOLUS ||
        this.isTestBolusAndTTP ||
        this.isTestAndBolusBiPhasic ||
        this.isTestAndTTPBolusBiPhasic
      ) {
        return Math.max(this.value.saline.volume - this.testSaline.vol, 0)
      } else {
        return this.value.saline.volume
      }
    },
    salineDuration() {
      return this.salineVolAfterTestProcess / this.value.saline.flow
    },
    contrastFlowRate() {
      return this.value.contrast.flow
    },
    contrast1FlowRate() {
      return this.contrast1.rate
    },
    contrast2FlowRate() {
      return this.contrast2.rate
    },
    testContrastFlowRate() {
      return this.testContrast.rate
    },
    contrastVolAfterTestProcess() {
      if (this.isTestBolusAndTTP || this.isTestAndTTPBolusBiPhasic) {
        return Math.max(this.value.contrast.volume - this.testContrast.vol, 0)
      } else {
        return this.value.contrast.volume
      }
    },
    contrastDuration() {
      let contrastVolume = this.contrastVolAfterTestProcess
      let contrastFlow = this.value.contrast.flow

      if (
        this.isTestAndBolusBiPhasic ||
        this.isTestAndTTPBolusBiPhasic ||
        this.testInjectorProtocolValue == this.injectorProtocols.BOLUS_BI_PHASIC
      ) {
        return this.contrast1Duration + this.contrast2Duration
      } else {
        return contrastVolume / contrastFlow
      }
    },
    contrast1Duration() {
      let contrastVolume = this.contrast1.vol
      let contrastFlow = this.contrast1.rate
      if (contrastFlow == 0) {
        return 0
      } else {
        return contrastVolume / contrastFlow
      }
    },
    contrast2Duration() {
      let contrastVolume = this.contrast2.vol
      let contrastFlow = this.contrast2.rate
      if (contrastFlow == 0) {
        return 0
      } else {
        return contrastVolume / contrastFlow
      }
    },
    timerFormatted() {
      //let duration = (new Date(this.currentDuration * 1000)).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0];
      const s = this.currentDuration
      const duration = [parseInt((s / 60) % 60), parseInt(s % 60)].join(':').replace(/\b(\d)\b/g, '0$1')
      return duration
    },
    currentPreviewCriticalQuestion() {
      const { preQuestion } = this.criticalThinkingQuestionsPreview || {}

      if (preQuestion) return preQuestion

      return null
    },
    currentContrastVolumn() {
      return Math.max(
        0,
        (
          _.get(this.value, ['contrast', 'volume']) -
          (this.contrastInjectedPercentValue / 100) * _.get(this.value, ['contrast', 'volume'])
        ).toFixed(1)
      )
    },
    currentSalineVolumn() {
      return Math.max(
        0,
        (
          _.get(this.value, ['saline', 'volume']) -
          (this.salineInjectedPercentValue / 100) * _.get(this.value, ['saline', 'volume'])
        ).toFixed(1)
      )
    },
    getInjectionRunningDuration() {
      return getInjectionRunningSpeedDuration(this.injectionRunningSpeedFactor)
    },
  },
  methods: {
    ...mapActions('selectionConfig', [
      'setSalineFlow',
      'setContrastFlow',
      'setDelayTime',
      'setDelayTimeByQuestion',
      'setPowerInjectorCurrentDuration',
    ]),
    ...mapMutations('selectionConfig', ['setHotKeysEnabledCT']),
    ...mapActions('questionService', [
      'setInjectorScreenshot',
      'setInjectorDoseScreenshot',
      'setTestInjectionMode',
      'setTestInjectCondition',
      'setInjectionRunningSpeed',
      'setTestInjectorProtocol',
    ]),
    ...mapActions('injectorService', [
      'setSalineInjectedPercent',
      'setContrastInjectedPercent',
      'setTestSalineProcess',
      'setTestContrastProcess',
      'setContrast1Process',
      'setContrast2Process',
      'setIsArmedInjector',
      'setIsStartPowerInjectProcess',
      'setIsStartedContrastProcess',
      'setIsStartedSalineProcess',
      'setIsStartedContrast1Process',
      'setIsStartedContrast2Process',
      'setIsStartedTestContrastProcess',
      'setPpsContrastValue',
      'setPpsContrastForPeriodValue',
      'setPpsSalineValue',
      'setPpsTestSalineValue',
      'setPpsTestContrastValue',
      'setIsInjectingValue',
      'setIsFirstInjectValue',
      'setSalineProcess',
      'setDistanceValue',
      'setCurrentYValue',
      'setEndYValue',
      'setStartYValue',
      'setCurrentContrastDuration',
      'setCurrentContrast1Duration',
      'setCurrentContrast2Duration',
      'setCurrentTestContrastDuration',
      'setIsShowResumeButtonValue',
      'setLastUpdateValue',
      'setFirstUpdatedFlow',
      'setTestContrastFlowRate',
      'setContrast1FlowRate',
      'setContrast2FlowRate',
      'setContrastFlowRate',
      'setShouldBindAllFlowToFirstChangedFlow',
      'setStartAnyContrastProcessTime',
      'addInjectorWaitingTime',
    ]),
    ...mapActions('translatedContent', ['translateThisRecord']),
    async translateBodyPartName(id) {
      this.translatedBodyPartName = this.questionSetBodyPartName || ''
      await this.translateThisRecord({
        type: 'bodyPart',
        record: { id: id, name: this.questionSetBodyPartName },
        lang: this.languageCode,
      })
      const translatedContent = this.$store.state.translatedContent.translatedContent
      let key = `bodyPart|${id}|${this.languageCode}`
      let name = this.questionSetBodyPartName || ''
      if (translatedContent[key]) {
        name = translatedContent[key].name || name
      }
      this.translatedBodyPartName = name
    },
    initScaleOfPlungerContainer() {
      if (this.$refs.plungerContainer) {
        const bbox = this.$refs.plungerContainer.getBoundingClientRect()
        const canvasWidth = 245
        this.plungerContainerScale = bbox.width / canvasWidth
      }
    },
    onContrastFlowRateChanged() {
      if (this.mode === 'flow') {
        this.setContrastFlowRate(this.contrastFlowRate)
      }
    },
    onContrast1FlowRateChanged() {
      if (this.mode === 'flow') {
        this.setContrast1FlowRate(this.contrast1FlowRate)
      }
    },
    onContrast2FlowRateChanged() {
      if (this.mode === 'flow') {
        this.setContrast2FlowRate(this.contrast2FlowRate)
      }
    },
    onTestContrastFlowRateChanged() {
      if (this.mode === 'flow') {
        this.setTestContrastFlowRate(this.testContrastFlowRate)
      }
    },
    onContrastDurationChanged() {
      if (this.mode === 'flow') {
        if (_.isNil(this.contrastDuration)) {
          this.setCurrentContrastDuration(0)
        } else {
          this.setCurrentContrastDuration(this.contrastDuration)
        }
      }
    },
    onContrast1DurationChanged() {
      if (this.mode === 'flow') {
        if (_.isNil(this.contrast1Duration)) {
          this.setCurrentContrast1Duration(0)
        } else {
          this.setCurrentContrast1Duration(this.contrast1Duration)
        }
      }
    },
    onContrast2DurationChanged() {
      if (this.mode === 'flow') {
        if (_.isNil(this.contrast2Duration)) {
          this.setCurrentContrast2Duration(0)
        } else {
          this.setCurrentContrast2Duration(this.contrast2Duration)
        }
      }
    },
    onTestContrastDurationChanged() {
      if (this.mode === 'flow') {
        if (_.isNil(this.testContrastDuration)) {
          this.setCurrentTestContrastDuration(0)
        } else {
          this.setCurrentTestContrastDuration(this.testContrastDuration)
        }
      }
    },
    onSetDefaultValueForInjectPeriod() {
      if (
        this.isTestAndBolusBiPhasic ||
        this.isTestAndTTPBolusBiPhasic ||
        this.testInjectorProtocolValue == this.injectorProtocols.BOLUS_BI_PHASIC
      ) {
        this.saline = {
          ...this.saline,
          vol: this.value.saline.volume,
        }
        this.contrast1 = {
          ...this.contrast1,
          vol: this.contrastVolAfterTestProcess / 2,
        }
        this.contrast2 = {
          ...this.contrast2,
          vol: this.contrastVolAfterTestProcess / 2,
        }
      }
    },
    onBlur() {
      this.setHotKeysEnabledCT(true)
    },
    onFocus() {
      this.setHotKeysEnabledCT(false)
    },
    async onSetDelayTime() {
      // this.currentDuration += this.scanDelay
      return new Promise((resolve) => {
        this.setDelayTime(this.currentDuration)
        this.setDelayTimeByQuestion({ questionIndex: this.selectedStackQuestionIndex, delayTime: this.currentDuration })
        this.takeScreenShot()
        resolve()
      })
    },
    takeScreenShot() {
      if (this.$refs.flowContainer) {
        const style = document.createElement('style')
        document.head.appendChild(style)
        style.sheet?.insertRule('body > div:last-child img { display: inline-block; }')
        html2canvas(this.$refs.flowContainer)
          .then((canvas) => {
            this.setInjectorScreenshot(canvas.toDataURL('image/jpeg'))
            style.remove()
          })
          .catch(() => {
            style.remove()
          })
      }
    },
    changeContrast(type) {
      if (type === 'down') {
        this.value.contrast.volume += this.volumnStep
        if (this.value.contrast.volume > this.maximumVolumn) {
          this.value.contrast.volume = this.maximumVolumn
          this.onCancelInterval()
        }
        this.emitUpdate(this.value)
      } else if (type === 'up') {
        this.value.contrast.volume -= this.volumnStep
        if (this.value.contrast.volume < 0) {
          this.value.contrast.volume = 0
          this.onCancelInterval()
        }
        this.emitUpdate(this.value)
      }
    },
    onCancelInterval() {
      if (this.interval) {
        clearInterval(this.interval)
      }
    },
    onPressUpSalineButton() {
      this.onCancelInterval()

      this.interval = setInterval(() => {
        this.changeSaline('up')
      }, 150)
    },
    onPressUpContrastButton() {
      this.onCancelInterval()

      this.interval = setInterval(() => {
        this.changeContrast('up')
      }, 150)
    },
    onPressDownSalineButton() {
      this.onCancelInterval()

      this.interval = setInterval(() => {
        this.changeSaline('down')
      }, 150)
    },
    onPressDownContrastButton() {
      this.onCancelInterval()

      this.interval = setInterval(() => {
        this.changeContrast('down')
      }, 150)
    },
    changeSaline(type) {
      if (type === 'down') {
        this.value.saline.volume += this.volumnStep
        if (this.value.saline.volume > this.maximumVolumn) {
          this.value.saline.volume = this.maximumVolumn
          this.onCancelInterval()
        }
        this.emitUpdate(this.value)
      } else if (type === 'up') {
        this.value.saline.volume -= this.volumnStep
        if (this.value.saline.volume < 0) {
          this.value.saline.volume = 0
          this.onCancelInterval()
        }
        this.emitUpdate(this.value)
      }
    },
    onSubmit() {
      if (this.$refs.volumeContainer) {
        const style = document.createElement('style')
        document.head.appendChild(style)
        style.sheet?.insertRule('body > div:last-child img { display: inline-block; }')
        html2canvas(this.$refs.volumeContainer)
          .then((canvas) => {
            this.setInjectorDoseScreenshot(canvas.toDataURL('image/jpeg'))
            style.remove()
          })
          .catch(() => {
            style.remove()
          })
      }
      this.$emit('volumeSubmit')
    },
    setArmed() {
      this.isArmed = !this.isArmed
      if (this.isArmed && !this.isInjecting) {
        this.isHighLightInjectButton = true
      }
    },
    updateContrastVolume(volume) {
      let output = { ...this.value }
      let newVolume = Math.max(0, Math.min(volume, this.maximumVolumn))
      output.contrast.volume = newVolume
      if (volume > this.maximumVolumn || volume < 0) {
        this.inputKey += 1
      }
      this.emitUpdate(output)
    },
    updateSalineVolume(volume) {
      let output = { ...this.value }
      let newVolume = Math.max(0, Math.min(volume, this.maximumVolumn))
      output.saline.volume = newVolume
      if (volume > this.maximumVolumn || volume < 0) {
        this.inputKey += 1
      }
      this.emitUpdate(output)
    },
    updateContrastFlow(flow, isCallAction = true) {
      let output = { ...this.value }
      output.contrast.flow = flow
      this.setContrastFlow(+flow)
      this.emitUpdate(output)

      if (isCallAction) {
        this.updateAllFlow(flow, this.INJECTOR_FLOW_TYPES.CONTRAST)
      }
    },
    updateSalineFlow(flow, isCallAction = true) {
      let output = { ...this.value }
      output.saline.flow = flow
      this.setSalineFlow(+flow)
      this.emitUpdate(output)

      if (isCallAction) {
        this.updateAllFlow(flow, this.INJECTOR_FLOW_TYPES.SALINE)
      }
    },
    updateContrast1Vol(val) {
      this.contrast1 = {
        ...this.contrast1,
        vol: val,
      }

      const contrastVol = _.get(this.value, ['contrast', 'volume'], 0)
      if (contrastVol) {
        this.contrast2 = {
          ...this.contrast2,
          vol:
            contrastVol -
            (this.isTestBolusAndTTP || this.isTestAndTTPBolusBiPhasic ? this.testContrast.vol : 0) -
            this.contrast1.vol,
        }
      }
    },
    updateContrast1Rate(val, isCallAction = true) {
      this.contrast1 = {
        ...this.contrast1,
        rate: val,
      }

      if (isCallAction) {
        this.updateAllFlow(val, this.INJECTOR_FLOW_TYPES.CONTRAST1)
      }
    },
    updateContrast2Vol(val) {
      this.contrast2 = {
        ...this.contrast2,
        vol: val,
      }

      const contrastVol = _.get(this.value, ['contrast', 'volume'], 0)
      if (contrastVol) {
        this.contrast1 = {
          ...this.contrast1,
          vol:
            contrastVol -
            (this.isTestBolusAndTTP || this.isTestAndTTPBolusBiPhasic ? this.testContrast.vol : 0) -
            this.contrast2.vol,
        }
      }
    },
    updateContrast2Rate(val, isCallAction = true) {
      this.contrast2 = {
        ...this.contrast2,
        rate: val,
      }

      if (isCallAction) {
        this.updateAllFlow(val, this.INJECTOR_FLOW_TYPES.CONTRAST2)
      }
    },
    updateSalineVol(val) {
      this.saline = {
        ...this.saline,
        vol: val,
      }
    },
    updateSalineRate(val, isCallAction = true) {
      this.saline = {
        ...this.saline,
        rate: val,
      }

      if (isCallAction) {
        this.updateAllFlow(val, this.INJECTOR_FLOW_TYPES.SALINE_RATE)
      }
    },
    updateTestContrastVol(val) {
      this.testContrast = {
        ...this.testContrast,
        vol: val,
      }
    },
    updateTestSalineVol(val) {
      this.testSaline = {
        ...this.testSaline,
        vol: val,
      }
    },
    updateTestSalineRate(val, isCallAction = true) {
      this.testSaline = {
        ...this.testSaline,
        rate: val,
      }

      if (isCallAction) {
        this.updateAllFlow(val, this.INJECTOR_FLOW_TYPES.TEST_SALINE)
      }
    },
    updateAllFlow(val, type) {
      if (!this.shouldBindAllFlowToFirstChangedFlow) {
        return
      }
      if (this.firstUpdatedFlowType && this.firstUpdatedFlowType != type) {
        this.setShouldBindAllFlowToFirstChangedFlow(false)
        return
      }
      if (this.shouldBindAllFlowToFirstChangedFlow) {
        this.firstUpdatedFlowType = type
        this.updateTestSalineRate(val, false)
        this.updateTestContrastRate(val, false)
        this.updateContrastFlow(val, false)
        this.updateSalineFlow(val, false)
        this.updateContrast1Rate(val, false)
        this.updateContrast2Rate(val, false)
        this.updateSalineRate(val, false)
      }
    },
    updateTestContrastRate(val, isCallAction = true) {
      this.testContrast = {
        ...this.testContrast,
        rate: val,
      }

      if (isCallAction) {
        this.updateAllFlow(val, this.INJECTOR_FLOW_TYPES.TEST_CONTRAST)
      }
    },
    emitUpdate(value) {
      this.$emit('input', value)
    },
    async preloadImages(sources) {
      const promises = sources.map((source) => {
        return new Promise((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve({ ...source, element: image })
          image.onerror = () => reject(`Image failed to load: ${source.src}`)
          image.src = source.src
        })
      })
      return Promise.all(promises)
    },
    updateExtraCanvas() {
      if (!this.vueExtraCanvas) {
        return
      }
      this.vueExtraCanvas.clearRect(0, 0, 245, 320)

      // draw extraBg
      this.drawImage(this.vueExtraCanvas, this.images.extraBg, 0, 0)
      this.vueExtraCanvas.save()

      // Saline
      //draw left clip path
      this.drawClipPath(this.vueExtraCanvas, 9, 11, 86, 250, 20)
      //draw left plunger
      let bluePlunger = this.images.plungerBlue
      this.vueExtraCanvas.drawImage(bluePlunger, 9, (-222 * this.value.saline.volume) / this.maximumVolumn)
      this.vueExtraCanvas.restore()

      this.vueExtraCanvas.save()

      // Contrast
      //draw right clip path
      this.drawClipPath(this.vueExtraCanvas, 148, 11, 86, 250, 20)
      //draw right plunger
      let greenPlunger = this.images.plungerGreen
      this.vueExtraCanvas.drawImage(greenPlunger, 148, (-222 * this.value.contrast.volume) / this.maximumVolumn)
      this.vueExtraCanvas.restore()

      if (this.testInjectionModeLocal == this.INJECTION_MODE.CONTRAST_ONLY) {
        // Draw overlay saline
        this.vueExtraCanvas.fillStyle = 'rgba(255, 255, 255, 0.4)'
        this.vueExtraCanvas.fillRect(0, 0, 122.5, 320)
      }
    },
    initCanvas() {
      this.drawPlunger(
        (-222 * this.currentSalineVolumn) / this.maximumVolumn,
        (-222 * this.currentContrastVolumn) / this.maximumVolumn
      )
      this.drawTimmer('00:00')
    },
    inject() {
      this.isHighLightInjectButton = false
      if (this.isArmed) {
        if (!this.isInjecting) {
          if (
            this.testInjectorProtocolValue == this.injectorProtocols.TEST_AND_BOLUS ||
            this.isTestAndBolusBiPhasic ||
            this.isTestBolusAndTTP ||
            this.isTestAndTTPBolusBiPhasic
          ) {
            if (this.testSaline.vol > this.value.saline.volume) {
              Vue.notify({ type: 'warning', text: `Test volume can't be greater than saline volume.` })
              return
            }
          }
          if (this.isTestBolusAndTTP || this.isTestAndTTPBolusBiPhasic) {
            if (this.testContrast.vol > this.value.contrast.volume) {
              Vue.notify({ type: 'warning', text: `Test volume can't be greater than contrast volume.` })
              return
            }
          }
          this.isInjecting = true
          if (this.isFirstInject) {
            this.lastUpdate = Date.now()

            let distance =
              this.endY - Math.max(this.startY, (-222 * this.contrastVolAfterTestProcess) / this.maximumVolumn)
            if (this.contrastDuration !== 0) {
              this.ppsContrast = distance / this.contrastDuration // pixels per second
            } else {
              let contrastVolume = this.contrastVolAfterTestProcess
              let contrastFlow = this.value.contrast.flow
              if (contrastFlow > 0 && contrastVolume > 0) {
                this.ppsContrast = distance / (contrastVolume / contrastFlow)
              } else {
                this.ppsContrast = 0
              }
            }

            this.ppsSaline =
              (this.endY - Math.max(this.startY, (-222 * this.salineVolAfterTestProcess) / this.maximumVolumn)) /
              this.salineDuration // pixels per second

            this.currentY = Math.max(this.startY, (-222 * this.currentContrastVolumn) / this.maximumVolumn)
            this.animateStep1()
            this.isFirstInject = false
          }
        } else {
          this.isInjecting = false
          this.isShowResumeButton = true
        }
      }
    },
    drawImage(ctx, image, x, y) {
      ctx.drawImage(image, x, y)
    },
    drawTimerBox() {
      // ctx.beginPath()
      // ctx.rect(x, y, w, h)
      // ctx.stroke()
    },
    drawClipPath(ctx, x, y, w, h, r) {
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, [r])
      ctx.clip()
      //ctx.stroke()
    },
    drawTimer() {
      // ctx.font = '30px Arial'
      // ctx.fillText(text, x, y)
    },
    updateDeltaTime() {
      const now = Date.now()
      const gap = now - this.lastUpdate
      if ((this.isSubmittingAnswer && this.isPlayingTheSlices) || this.isAppLoading || this.isInjectorTimerPausedForTransition) {
        // Pause timer during pre-scan transitions, app loading, or TD→ACQ transition.
        const delta = gap / 1000
        this.addInjectorWaitingTime(delta)
        this.lastUpdate = now
        this.isResetNextDeltaTime = true
        return 0
      }
      if (this.isResetNextDeltaTime) {
        // Case: App not responding when we init new stack ident
        const delta = gap / 1000
        this.addInjectorWaitingTime(delta)
        this.lastUpdate = now
        this.isResetNextDeltaTime = false
        return 0
      }
      // Guard against heavy main-thread blocks (e.g. html2canvas during screenshot).
      // Use a high threshold so normal rendering jitter doesn't steal time from the
      // timer — Guards 1 and 2 already handle intentional pauses.
      if (gap > 1000) {
        const waitDelta = gap / 1000
        this.addInjectorWaitingTime(waitDelta)
        this.lastUpdate = now
        return 0
      }
      const delta = gap / this.getInjectionRunningDuration
      this.lastUpdate = now
      return delta
    },
    drawTimmer(timmer) {
      this.vueCanvas.clearRect(65, 402, 105, 35)
      // draw timer box
      this.drawTimerBox(this.vueCanvas, 65, 402, 105, 35)
      // draw timer
      this.drawTimer(this.vueCanvas, 80, 430, timmer)
      // // draw timer icon
      // this.drawImage(this.vueCanvas, this.images.timerIcon, 38, 404)
      this.vueCanvas.save()
    },
    drawPlunger(saline, contrast) {
      this.vueCanvas.clearRect(0, 0, 245, 500)

      // draw bg
      this.drawImage(this.vueCanvas, this.images.bg, 0, 0)
      // draw timer box
      //this.drawTimerBox(this.vueCanvas, 65, 402, 105, 35)
      // // draw timer
      // this.drawTimer(this.vueCanvas, 80, 430, timmer)
      // // draw timer icon
      // this.drawImage(this.vueCanvas, this.images.timerIcon, 38, 404)

      this.vueCanvas.save()

      if (this.isContrastOnly) {
        // Draw overlay saline
        this.vueCanvas.fillStyle = 'rgba(255, 255, 255, 0.5)'
        this.vueCanvas.fillRect(0, 0, 105, 320)
      }

      //draw left clip path
      this.drawClipPath(this.vueCanvas, 9, 11, 86, 250, 20)
      //draw left plunger
      if (!this.isContrastOnly) {
        // Draw overlay saline
        this.vueCanvas.fillStyle = 'rgba(255, 255, 255, 0.5)'
        this.vueCanvas.fillRect(0, 0, 105, 320)
      }
      this.drawImage(this.vueCanvas, this.images.plungerBlue, 9, saline)

      if (this.isContrastOnly) {
        // Draw overlay saline
        this.vueCanvas.fillStyle = 'rgba(255, 255, 255, 0.5)'
        this.vueCanvas.fillRect(0, 0, 105, 320)
      }

      this.vueCanvas.restore()

      this.vueCanvas.save()

      //draw right clip path
      this.drawClipPath(this.vueCanvas, 148, 11, 86, 250, 20)
      //draw right plunger
      this.drawImage(this.vueCanvas, this.images.plungerGreen, 148, contrast)

      this.vueCanvas.restore()
    },
    injectSalineOnTestProcess(delta) {
      this.currentY = this.currentY + this.ppsTestSaline * delta
      if (this.currentY > this.endY) {
        this.currentY = this.endY
        this.salineInjectedPercentValue = 100
      } else {
        const maxSalineVal = Math.max(this.startY, (-222 * this.value.saline.volume) / this.maximumVolumn)
        const salineDiscante = this.currentY - maxSalineVal
        this.salineInjectedPercentValue = (salineDiscante / (this.endY - maxSalineVal)) * 100
      }

      this.drawPlunger(
        (-222 * this.currentSalineVolumn) / this.maximumVolumn,
        (-222 * this.currentContrastVolumn) / this.maximumVolumn
      )
      this.drawTimmer(this.timerFormatted)
    },
    injectContrastOnTestProcess(delta) {
      this.currentY = this.currentY + this.ppsTestContrast * delta
      if (this.currentY > this.endY) {
        this.currentY = this.endY
        this.contrastInjectedPercentValue = 100
      } else {
        const maxContrastVal = Math.max(this.startY, (-222 * this.value.contrast.volume) / this.maximumVolumn)
        const contrastDiscante = this.currentY - maxContrastVal
        this.contrastInjectedPercentValue = (contrastDiscante / (this.endY - maxContrastVal)) * 100
      }

      this.drawPlunger(
        (-222 * this.currentSalineVolumn) / this.maximumVolumn,
        (-222 * this.currentContrastVolumn) / this.maximumVolumn
      )
      this.drawTimmer(this.timerFormatted)
    },
    animateStep1() {
      this.setIsStartPowerInjectProcess(true)
      const delta = this.updateDeltaTime()

      // Don't increase timer when testSaline process is running
      if (
        (this.testInjectorProtocolValue == this.injectorProtocols.TEST_AND_BOLUS ||
          this.isTestAndBolusBiPhasic ||
          this.isTestBolusAndTTP ||
          this.isTestAndTTPBolusBiPhasic) &&
        (this.testSaline.testInjectedPercent < 100 || this.testSaline.isFirstCountDownTest) &&
        this.testSaline.vol > 0 &&
        this.testSaline.rate > 0
      ) {
        this.setIsStartedSalineProcess(true)
        if (this.testSaline.testInjectedPercent == 0) {
          // Move to max
          this.currentY = Math.max(this.startY, (-222 * this.value.saline.volume) / this.maximumVolumn)
          this.ppsTestSaline =
            (this.endY - Math.max(this.startY, (-222 * this.testSaline.vol) / this.maximumVolumn)) /
            this.testSalineDuration
        }
        if (this.testSaline.testInjectedPercent < 100) {
          this.testSaline = {
            ...this.testSaline,
            isCountDownTest: true,
          }
          this.injectSalineOnTestProcess(delta)

          const maxSalineVal = Math.max(this.startY, (-222 * this.value.saline.volume) / this.maximumVolumn)
          const salineDiscante = this.currentY - maxSalineVal
          this.testSaline = {
            ...this.testSaline,
            testInjectedPercent:
              (salineDiscante / ((this.endY - maxSalineVal) * (this.testSaline.vol / this.value.saline.volume))) * 100,
          }

          this.requestAnimationId = window.requestAnimationFrame(this.animateStep1)
          return
        } else if (this.testSaline.isFirstCountDownTest) {
          this.testSaline = {
            ...this.testSaline,
            testInjectedPercent: 100,
            isCountDownTest: false,
          }
          if (this.testSaline.isFirstCountDownTest) {
            this.salineInjectedPercentValue = Math.min((this.testSaline.vol / this.value.saline.volume) * 100, 100)
            this.testSaline = {
              ...this.testSaline,
              isFirstCountDownTest: false,
            }
            this.isArmed = true
            this.isInjecting = false
            this.isFirstInject = true
            this.isHighLightInjectButton = true
            this.isShowResumeButton = false

            const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
            cancelAnimationFrame(this.requestAnimationId)
            this.requestAnimationId = null

            return
          }
        }
      }

      // TEST CONTRAST
      if (
        (this.isTestBolusAndTTP || this.isTestAndTTPBolusBiPhasic) &&
        (this.testContrast.testInjectedPercent < 100 || this.testContrast.isFirstCountDownTest) &&
        this.testContrast.vol > 0 &&
        this.testContrast.rate > 0
      ) {
        this.setStartAnyContrastProcessTime(Date.now())
        this.setIsStartedTestContrastProcess(true)
        if (this.testContrast.testInjectedPercent == 0) {
          // Move to max
          this.currentY = Math.max(this.startY, (-222 * this.value.contrast.volume) / this.maximumVolumn)
          this.ppsTestContrast =
            (this.endY - Math.max(this.startY, (-222 * this.testContrast.vol) / this.maximumVolumn)) /
            this.testContrastDuration
        }
        if (this.testContrast.testInjectedPercent < 100) {
          this.testContrast = {
            ...this.testContrast,
            isCountDownTest: true,
          }
          this.injectContrastOnTestProcess(delta)

          const maxContrastVal = Math.max(this.startY, (-222 * this.value.contrast.volume) / this.maximumVolumn)
          const contrastDiscante = this.currentY - maxContrastVal
          this.testContrast = {
            ...this.testContrast,
            testInjectedPercent:
              (contrastDiscante /
                ((this.endY - maxContrastVal) * (this.testContrast.vol / this.value.contrast.volume))) *
              100,
          }

          this.requestAnimationId = window.requestAnimationFrame(this.animateStep1)
          return
        } else if (this.testContrast.isFirstCountDownTest) {
          this.testContrast = {
            ...this.testContrast,
            testInjectedPercent: 100,
            isCountDownTest: false,
          }
          if (this.testContrast.isFirstCountDownTest) {
            this.contrastInjectedPercentValue = Math.min(
              (this.testContrast.vol / this.value.contrast.volume) * 100,
              100
            )
            this.testContrast = {
              ...this.testContrast,
              isFirstCountDownTest: false,
            }
            this.isArmed = true
            this.isInjecting = false
            this.isFirstInject = true
            this.isHighLightInjectButton = true
            this.isShowResumeButton = false

            const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
            cancelAnimationFrame(this.requestAnimationId)
            this.requestAnimationId = null

            return
          }
        }
      }

      // Increase timer when testSaline process is done
      this.currentDuration += delta
      if (!this.isInjecting || !this.isArmed) {
        this.drawTimmer(this.timerFormatted)
        this.requestAnimationId = window.requestAnimationFrame(this.animateStep1)
        return
      }
      this.setIsStartedContrastProcess(true)
      this.setStartAnyContrastProcessTime(Date.now())
      this.drawTimmer(this.timerFormatted)

      const maxContrastVal = Math.max(this.startY, (-222 * this.value.contrast.volume) / this.maximumVolumn)
      const totalDistance = this.endY - maxContrastVal

      if (
        this.isTestAndBolusBiPhasic ||
        this.isTestAndTTPBolusBiPhasic ||
        this.testInjectorProtocolValue == this.injectorProtocols.BOLUS_BI_PHASIC
      ) {
        if (
          this.contrastDuration > 0 &&
          this.contrast1.vol > 0 &&
          this.contrast1.rate > 0 &&
          this.contrast1.injectedPercent < 100
        ) {
          this.setIsStartedContrast1Process(true)
          const contrast1Distance = (this.contrast1.vol / this.value.contrast.volume) * totalDistance
          this.ppsContrastForPeriod = contrast1Distance / this.contrast1Duration
        } else if (
          this.contrastDuration > 0 &&
          this.contrast2.vol > 0 &&
          this.contrast2.rate > 0 &&
          this.contrast2.injectedPercent < 100
        ) {
          this.setIsStartedContrast2Process(true)
          const contrast2Distance = (this.contrast2.vol / this.value.contrast.volume) * totalDistance
          this.ppsContrastForPeriod = contrast2Distance / this.contrast2Duration
        } else {
          this.ppsContrastForPeriod = this.ppsContrast
        }
      } else {
        this.ppsContrastForPeriod = this.ppsContrast
      }

      this.currentY = this.currentY + this.ppsContrastForPeriod * delta
      this.drawPlunger(
        (-222 * this.currentSalineVolumn) / this.maximumVolumn,
        (-222 * this.currentContrastVolumn) / this.maximumVolumn
      )

      const contrastDiscante = this.currentY - maxContrastVal
      this.contrastInjectedPercentValue = (contrastDiscante / (this.endY - maxContrastVal)) * 100
      // Handle two contrast processes
      if (
        (this.isTestAndBolusBiPhasic ||
          this.isTestAndTTPBolusBiPhasic ||
          this.testInjectorProtocolValue == this.injectorProtocols.BOLUS_BI_PHASIC) &&
        this.contrastDuration > 0 &&
        this.contrastVolAfterTestProcess > 0
      ) {
        const maxContrastValAfterTest = Math.max(
          this.startY,
          (-222 * this.contrastVolAfterTestProcess) / this.maximumVolumn
        )
        const contrastDiscanteAfterTest = this.currentY - maxContrastValAfterTest
        const totalDistanceAfterTest = this.endY - maxContrastValAfterTest
        if (totalDistanceAfterTest > 0) {
          const contrast1Distance = (this.contrast1.vol / this.value.contrast.volume) * totalDistance
          const contrast2Distance = (this.contrast2.vol / this.value.contrast.volume) * totalDistance

          this.contrast1 = {
            ...this.contrast1,
            injectedPercent:
              contrast1Distance == 0 || contrastDiscanteAfterTest >= contrast1Distance
                ? 100
                : (contrastDiscanteAfterTest / contrast1Distance) * 100,
          }
          this.contrast2 = {
            ...this.contrast2,
            injectedPercent:
              contrastDiscanteAfterTest >= totalDistanceAfterTest || contrast2Distance == 0
                ? 100
                : ((contrastDiscanteAfterTest - contrast1Distance) / contrast2Distance) * 100,
          }
        }
      } else {
        this.contrast1 = {
          ...this.contrast1,
          injectedPercent: 100,
        }
        this.contrast2 = {
          ...this.contrast2,
          injectedPercent: 100,
        }
      }
      if (this.currentY < this.endY) this.requestAnimationId = window.requestAnimationFrame(this.animateStep1)
      else {
        this.contrastInjectedPercentValue = 100
        this.salineInjectedPercentValue = 0
        //this.currentY = -222
        // Move to saline vol after testSaline process
        this.currentY = Math.max(this.startY, (-222 * this.salineVolAfterTestProcess) / this.maximumVolumn)
        this.animateStep2()
      }
    },
    animateStep2() {
      const delta = this.updateDeltaTime()
      this.currentDuration += delta

      if (!this.isInjecting) {
        this.drawTimmer(this.timerFormatted)
        this.requestAnimationId = window.requestAnimationFrame(this.animateStep2)
        if (this.salineInjectedPercentValue >= 100) {
          this.isInjecting = false
        }
        return
      }

      this.currentY = this.currentY + this.ppsSaline * delta

      if (this.currentY > this.endY) {
        this.currentY = this.endY
        this.salineInjectedPercentValue = 100
      } else {
        const maxSalineVal = Math.max(this.startY, (-222 * this.value.saline.volume) / this.maximumVolumn)
        const salineDiscante = this.currentY - maxSalineVal
        this.salineInjectedPercentValue = (salineDiscante / (this.endY - maxSalineVal)) * 100
      }

      this.drawPlunger(
        (-222 * this.currentSalineVolumn) / this.maximumVolumn,
        (-222 * this.currentContrastVolumn) / this.maximumVolumn
      )
      this.drawTimmer(this.timerFormatted)
      this.requestAnimationId = window.requestAnimationFrame(this.animateStep2)
      if (this.salineInjectedPercentValue >= 100) {
        this.isInjecting = false
      }
    },
    handleRunFaster(type) {
      if (this.injectionRunningSpeedFactor == type) {
        this.injectionRunningSpeedFactor = INJECTOR_SPEED.NONE
      } else {
        this.injectionRunningSpeedFactor = type
      }
    },
  },
}
</script>
<style lang="scss">
.injector-protocol-item-select {
  .v-input__control {
    .v-text-field__details {
      display: none;
    }
  }
}
</style>
<style lang="scss">
.inject-mode-radio-group {
  margin-top: 0;
  .v-radio {
    label {
      margin-bottom: 0 !important;
    }
  }
  .v-input__control {
    .v-messages {
      display: none;
    }
  }
}
.inject-condition-radio-group {
  margin-top: 0;
  .v-radio {
    label {
      margin-bottom: 0 !important;
    }
  }
  .v-input__control {
    .v-messages {
      display: none;
    }
    .v-input--radio-group__input {
      gap: 50px;
    }
  }
}
</style>
<style lang="scss" scoped>
@keyframes glowing {
  0% {
    background-color: #deffe2;
    box-shadow: 0 0 3px #deffe2;
  }

  50% {
    background-color: #deffe2;
    box-shadow: 0 0 40px #41b950;
  }

  100% {
    background-color: #deffe2;
    box-shadow: 0 0 3px #deffe2;
  }
}

.btn-glowing {
  -webkit-animation: glowing 1500ms infinite;
  -moz-animation: glowing 1500ms infinite;
  -o-animation: glowing 1500ms infinite;
  animation: glowing 1500ms infinite;
  outline: 4px solid #f08b17 !important;
  outline-offset: -4px;
}
@keyframes arm-glowing {
  0% {
    box-shadow: 0 0 3px #fdf0d8;
  }
  50% {
    box-shadow: 0 0 40px #f08b17;
  }
  100% {
    box-shadow: 0 0 3px #fdf0d8;
  }
}
.arm-control-btn.btn-glowing {
  -webkit-animation: arm-glowing 1500ms infinite;
  -moz-animation: arm-glowing 1500ms infinite;
  -o-animation: arm-glowing 1500ms infinite;
  animation: arm-glowing 1500ms infinite;
}
.w-60 {
  width: 60px;
}
.flow-rate-input {
  position: relative;
  min-height: 40px;
  display: flex;
  gap: 5px;
  align-items: center;
  .spin-btn-grp {
    display: flex;
    border: 1px solid rgba(0, 0, 0, 0.42) !important;
    min-height: 40px;
    border-radius: 4px;
    width: 76px;
    max-width: 76px;
  }
  &.small-input {
    min-height: 35px;
    .spin-btn-grp {
      min-height: 35px;
    }
  }
  span {
    font-size: 12px;
  }
}
.arrow-button-disabled {
  opacity: 0.5;
  pointer-events: none;
}
.volume-wrapper {
  padding: 24px 40px;
}
.volume-container {
  width: 500px;
}
.flow-container {
  width: 100%;
}
.flow-label {
  font-weight: bold;
  font-size: 14px;
  border-width: 5px;
  border-style: solid;
  padding: 5px;
  &.injected {
    opacity: 0.5;
  }
}
.saline-flow-label {
  background-color: #d7f9fd;
  border-color: #3ddeed;
}
.contrast-flow-label {
  background-color: #deffe2;
  border-color: #41b950;
}
.duration-label {
  font-weight: bold;
  font-size: 14px;
  border-width: 5px;
  border-style: solid;
  padding: 5px;
}
.total-duration-label {
  border-top-color: #41b950;
  border-right-color: #3ddeed;
  border-bottom-color: #3ddeed;
  border-left-color: #41b950;
  background: linear-gradient(155deg, #deffe2 50%, #d7f9fd 50%);
}
.contrast-duration-label {
  background-color: #deffe2;
  border-color: #41b950;
}
.control-btn {
  font-weight: bold;
  font-size: 14px;
  border-width: 5px;
  border-style: solid;
  width: 100%;
  height: 57px;
  border-radius: 10px;
  &.small-button {
    height: 36px;
  }
}
.control-btn:disabled {
  opacity: 0.3;
  pointer-events: none;
  user-select: none;
}
.arm-control-btn {
  background-color: #fdf0d8;
  border-color: #f7d652;
}
.cancel-control-btn {
  color: #852433;
  background-color: #fa647c;
  border-color: #852433;
}
.inject-control-btn {
  background-color: #deffe2;
  border-color: #41b950;
}
.plunger-zone-col {
  max-width: 40%;
}
.plunger-container-wrapper {
}
.plunger-container {
  position: relative;
  transform-origin: top left;
}
.timmer {
  position: absolute;
  left: 8px;
  bottom: 65px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.timmer .clock {
  padding: 0px 10px;
  border: 1px solid black;
  margin-left: 10px;
  font-size: 27px;
  font-weight: bold;
}
.inject-speed-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  .btn-increse-inject-speed {
    width: 40px;
    height: 24px;
    position: relative;
    img {
      height: 30px;
    }
    .text-times {
      position: absolute;
      top: 0px;
      right: -2px;
      z-index: 2;
      font-size: 12px;
    }
  }
}
::v-deep .theme--light.v-select .v-select__selections {
  color: black !important;
}
.btn-color-green {
  background-color: #41b950 !important;
  color: black !important;
}
</style>
