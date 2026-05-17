<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card>
    <v-card-text class="grey lighten-4" style="height: 100% !important">
      <div class="row-container">
        <div class="column">
          <div class="sub-columns scrollable" style="background-color: #d5d7d7" @scroll="handleScroll">
            <div class="sub-column">
              <div class="subcolumn-key"><span>Scan type</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedScanType', 'ScanType')">
                <template v-if="editKey === 'selectedScanType'">
                  <v-select
                    v-model="selectedScanType"
                    :items="ScanType"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedScanType }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Scan mode</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedScanMode', 'ScanMode')">
                <template v-if="editKey === 'selectedScanMode'">
                  <v-select
                    v-model="selectedScanMode"
                    :items="ScanMode"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedScanMode }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">Technique</span></div>
              <div
                class="subcolumn-value"
                @click="startEdit('selectionConfig.sequenceType', 'availableSequenceTypesPhilips')"
              >
                <template v-if="editKey === 'selectionConfig.sequenceType'">
                  <v-select
                    v-model="selectionConfig.sequenceType"
                    :items="availableSequenceTypesPhilips"
                    hide-details
                    outlined
                    @input="endEdit"
                    @change="submitActualSequenceType(selectionConfig.sequenceType)"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectionConfig.sequenceType }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>Modified SE</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedModifiedSE', 'ModifiedSE')">
                <template v-if="editKey === 'selectedModifiedSE'">
                  <v-select
                    v-model="selectedModifiedSE"
                    :items="ModifiedSE"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedModifiedSE }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>Acquisition Mode</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedAcquisitionMode', 'AcquisitionMode')">
                <template v-if="editKey === 'selectedAcquisitionMode'">
                  <v-select
                    v-model="selectedAcquisitionMode"
                    :items="AcquisitionMode"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedAcquisitionMode }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>Fast Imaging Mode</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedFastImagingMode', 'FastImagingMode')">
                <template v-if="editKey === 'selectedFastImagingMode'">
                  <v-select
                    v-model="selectedFastImagingMode"
                    :items="FastImagingMode"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedFastImagingMode }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">Shot Mode</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedShotMode', 'ShotMode')">
                <template v-if="editKey === 'selectedShotMode'">
                  <v-select
                    v-model="selectedShotMode"
                    :items="ShotMode"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedShotMode }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span><b>TSE Factor</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('TSEFactor')">
                <template v-if="editKey === 'TSEFactor'">
                  <SpinButton
                    :step="1"
                    :min="1"
                    :max="512"
                    :value="echoTrainLength"
                    @input="changeSpin($event, 'echoTrainLength')"
                  />
                </template>
                <template v-else>
                  {{ TSEFactor }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">Startup Echoes</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('StartupEchoes')">
                <template v-if="editKey === 'StartupEchoes'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="StartupEchoes"
                    :value="StartupEchoes"
                    :step="1"
                    :min="1"
                    :max="1000"
                    @input="changeSpin($event, 'StartupEchoes')"
                  />
                </template>
                <template v-else>
                  {{ StartupEchoes }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">ProfileOrder</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedProfileOrder', 'ProfileOrder')">
                <template v-if="editKey === 'selectedProfileOrder'">
                  <v-select
                    v-model="selectedProfileOrder"
                    :items="ProfileOrder"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedProfileOrder }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">DRIVE</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedDrive', 'Drive')">
                <template v-if="editKey === 'selectedDrive'">
                  <v-select v-model="selectedDrive" :items="DRIVE" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ selectedDrive }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px"><b>Ultrashot</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('selectedUltrashot', 'Ultrashot')">
                <template v-if="editKey === 'selectedUltrashot'">
                  <v-select
                    v-model="selectedUltrashot"
                    :items="UltraShot"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedUltrashot }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">FidReduction</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedFidReduction', 'FidReduction')">
                <template v-if="editKey === 'selectedFidReduction'">
                  <v-select
                    v-model="selectedFidReduction"
                    :items="FidReduction"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedFidReduction }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span>Echoes</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('Echoes')">
                <template v-if="editKey === 'Echoes'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="Echoes"
                    :value="Echoes"
                    :step="1"
                    :min="1"
                    :max="1000"
                    @input="changeSpin($event, 'Echoes')"
                  />
                </template>
                <template v-else>
                  {{ Echoes }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">PartialEcho</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedPartialEcho', 'PartialEcho')">
                <template v-if="editKey === 'selectedPartialEcho'">
                  <v-select
                    v-model="selectedPartialEcho"
                    :items="PartialEcho"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedPartialEcho }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>TE</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedTE', 'TE')">
                <template v-if="editKey === 'selectedTE'">
                  <v-select v-model="selectedTE" :items="TE" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ selectedTE }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">(ms)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('TEms')">
                <template v-if="editKey === 'TEms'">
                  <SpinButton
                    v-model.number="selectedTEVal"
                    :step="1"
                    :min="10"
                    :max="10000"
                    :value="selectedTEVal"
                    @input="$store.commit('scanTimeConfig/SET_TESYNC', $event)"
                  />
                  <!-- <SpinButton
                    v-if="selectionConfig.sequenceType === 'SE'"
                    :step="1"
                    :min="6"
                    :max="maxTEOptionsForSE"
                    :value="echoTime"
                    @input="changeEchoTime"
                  />
                  <SpinButton
                    v-if="selectionConfig.sequenceType === 'GRE'"
                    :step="1"
                    :min="1"
                    :max="maxTEOptionsForGRE"
                    :value="echoTime"
                    @input="changeEchoTime"
                  /> -->
                </template>
                <template v-else>
                  {{ selectedTEVal }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span>Flip Angle</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('FlipAngle')">
                <template v-if="editKey === 'FlipAngle'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="flipAngle"
                    :value="flipAngle"
                    :step="1"
                    :min="1"
                    :max="1000"
                    @input="changeSpin($event, 'flipAngle')"
                  />
                </template>
                <template v-else>
                  {{ flipAngle }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Refocusing Control</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedRefocusingControl', 'RefocusingControl')">
                <template v-if="editKey === 'selectedRefocusingControl'">
                  <v-select
                    v-model="selectedRefocusingControl"
                    :items="RefocusingControl"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedRefocusingControl }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">Angle(deg)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('Angle')">
                <template v-if="editKey === 'Angle'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="Angle"
                    :value="Angle"
                    :step="1"
                    :min="1"
                    :max="20000"
                    @input="changeSpin($event, 'Angle')"
                  />
                </template>
                <template v-else>
                  {{ Angle }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span><b>TR</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('selectedTR', 'TR')">
                <template v-if="editKey === 'selectedTR'">
                  <v-select
                    v-model="selectedTR"
                    :items="TR"
                    hide-details
                    outlined
                    @input="endEdit"
                    @change="showRange"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedTR }}
                </template>
              </div>
            </div>
            <div class="sub-column" v-if="selectedTR == 'user defined' || selectedTR == 'shortest'">
              <div class="subcolumn-key"><span style="margin-left: 15px">(mm)</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedTRVal')">
                <template v-if="editKey === 'selectedTRVal'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="selectedTRVal"
                    :value="selectedTRVal"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="$store.commit('scanTimeConfig/SET_TRSYNC', $event)"
                  />
                </template>
                <template v-else>
                  {{ selectedTRVal }}
                </template>
              </div>
            </div>
            <div v-if="this.trShowFlag">
              <div class="sub-column">
                <div class="subcolumn-key"><span style="margin-left: 15px">minimum(ms)</span></div>
                <div class="subcolumn-value" @click="startEdit('minRange')">
                  <template v-if="editKey === 'minRange'">
                    <SpinButton
                      :type="'number'"
                      v-model.number="minRange"
                      :value="minRange"
                      :step="1"
                      :min="1"
                      :max="2000000"
                      @input="showRangeSeperately"
                    />
                  </template>
                  <template v-else>
                    {{ minRange }}
                  </template>
                </div>
              </div>
              <div class="sub-column">
                <div class="subcolumn-key"><span style="margin-left: 15px">maximum(ms)</span></div>
                <div class="subcolumn-value" @click="startEdit('maxRange')">
                  <template v-if="editKey === 'maxRange'">
                    <SpinButton
                      :type="'number'"
                      v-model.number="maxRange"
                      :value="maxRange"
                      :step="1"
                      :min="1"
                      :max="2000000"
                      @input="showRangeSeperately"
                    />
                  </template>
                  <template v-else>
                    {{ maxRange }}
                  </template>
                </div>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Halfscan</span></div>
              <div class="subcolumn-value" @click="startEdit('partialFourier', 'Halfscan')">
                <template v-if="editKey === 'partialFourier'">
                  <v-select
                    v-model="partialFourier"
                    :items="fourierItems[softwareVendorPreference]"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ partialFourier }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Water Fat Shift</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedWaterFatShift', 'WaterFatShift')">
                <template v-if="editKey === 'selectedWaterFatShift'">
                  <v-select
                    v-model="selectedWaterFatShift"
                    :items="WaterFatShift"
                    hide-details
                    outlined
                    @input="endEdit"
                    @change="selectWFS($event)"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedWaterFatShift }}
                </template>
              </div>
            </div>

            <div class="sub-column" v-if="showPixelFlag">
              <div class="subcolumn-key"><span style="margin-left: 15px">(pixels)</span></div>
              <div class="subcolumn-value" @click="startEdit('wfs_pixcels')">
                <template v-if="editKey === 'wfs_pixcels'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="wfs_pixcels"
                    :value="wfs_pixcels"
                    :step="0.1"
                    :min="0.1"
                    :max="1000"
                    @input="changeSpin($event, 'wfs_pixcels')"
                  />
                </template>
                <template v-else>
                  {{ wfs_pixcels }}
                </template>
              </div>
            </div>

            <div class="sub-column" v-if="selectedTechnique == 'IR'">
              <div class="subcolumn-key"><span>IR Delay (ms)</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedIRDelay')">
                <template v-if="editKey === 'selectedIRDelay'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="selectedIRDelay"
                    :value="selectedIRDelay"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'selectedIRDelay')"
                  />
                </template>
                <template v-else>
                  {{ selectedIRDelay }}
                </template>
              </div>
            </div>
            <div class="sub-column" v-if="selectedTechnique == 'IR'">
              <div class="subcolumn-key"><span>Acquire during delay </span></div>
              <div class="subcolumn-value" @click="startEdit('selectedAcquire', 'acquire')">
                <template v-if="editKey === 'selectedAcquire'">
                  <v-select
                    v-model="selectedAcquire"
                    :items="acquire"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedAcquire }}
                </template>
              </div>
            </div>
            <div class="sub-column" v-if="selectedTechnique == 'IR'">
              <div class="subcolumn-key"><span>Dual</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedDual', 'dual')">
                <template v-if="editKey === 'selectedDual'">
                  <v-select v-model="selectedDual" :items="dual" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ selectedDual }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Shim</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedShim', 'Shim')">
                <template v-if="editKey === 'selectedShim'">
                  <v-select v-model="selectedShim" :items="Shim" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ selectedShim }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>M-Dixon</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedMDixon', 'MDixon')">
                <template v-if="editKey === 'selectedMDixon'">
                  <v-select v-model="selectedMDixon" :items="mDIXON" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ selectedMDixon }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Fat Suppression</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedFatSuppression', 'FatSuppression')">
                <template v-if="editKey === 'selectedFatSuppression'">
                  <v-select
                    v-model="selectedFatSuppression"
                    :items="FatSuppression"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedFatSuppression }}
                </template>
              </div>
            </div>

            <div class="sub-column" v-if="selectedFatSuppression === 'SPIR'">
              <div class="subcolumn-key"><span>Strength</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedStrength', 'strength')">
                <template v-if="editKey === 'selectedStrength'">
                  <v-select
                    v-model="selectedStrength"
                    :items="strength"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedStrength }}
                </template>
              </div>
            </div>
            <div class="sub-column" v-if="selectedFatSuppression === 'SPIR' || selectedFatSuppression === 'SPAIR'">
              <div class="subcolumn-key"><span>Frequency Offset</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedFrequencyOffset', 'frequencyOffset')">
                <template v-if="editKey === 'selectedFrequencyOffset'">
                  <v-select
                    v-model="selectedFrequencyOffset"
                    :items="frequencyOffset"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedFrequencyOffset }}
                </template>
              </div>
            </div>

            <div class="sub-column" v-if="selectedFrequencyOffset == 'userDefined'">
              <div class="subcolumn-key"><span>Offset(Hz)</span></div>
              <div class="subcolumn-value" @click="startEdit('Offset')">
                <template v-if="editKey === 'Offset'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="Offset"
                    :value="Offset"
                    :step="1"
                    :min="1"
                    :max="20000"
                    @input="changeSpin($event, 'Offset')"
                  />
                </template>
                <template v-else>
                  {{ Offset }}
                </template>
              </div>
            </div>

            <div class="sub-column" v-if="selectedFatSuppression === 'SPAIR'">
              <div class="subcolumn-key"><span>Inversion delay</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedInversionDelay', 'inversionDelay')">
                <template v-if="editKey === 'selectedInversionDelay'">
                  <v-select
                    v-model="selectedInversionDelay"
                    :items="inversionDelay"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedInversionDelay }}
                </template>
              </div>
            </div>

            <div class="sub-column" v-if="selectedFatSuppression === 'SPAIR'">
              <div class="subcolumn-key"><span>Suppr.level</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedSupprLevel', 'supprLevel')">
                <template v-if="editKey === 'selectedSupprLevel'">
                  <v-select
                    v-model="selectedSupprLevel"
                    :items="supprLevel"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedSupprLevel }}
                </template>
              </div>
            </div>

            <div class="sub-column" v-if="selectedFatSuppression === 'SPAIR'">
              <div class="subcolumn-key"><span>Power</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedPower')">
                <template v-if="editKey === 'selectedPower'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="selectedPower"
                    :value="selectedPower"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'selectedPower')"
                  />
                </template>
                <template v-else>
                  {{ selectedPower }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Water Suppression</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedWaterSuppression', 'WaterSuppression')">
                <template v-if="editKey === 'selectedWaterSuppression'">
                  <v-select
                    v-model="selectedWaterSuppression"
                    :items="WaterSuppression"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedWaterSuppression }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>BB Pulse</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedBBPulse', 'BBPulse')">
                <template v-if="editKey === 'selectedBBPulse'">
                  <v-select
                    v-model="selectedBBPulse"
                    :items="BBPulse"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedBBPulse }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>MTC</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedMTC', 'MTC')">
                <template v-if="editKey === 'selectedMTC'">
                  <v-select v-model="selectedMTC" :items="MTC" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ selectedMTC }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>MDME</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedMDME', 'MDME')">
                <template v-if="editKey === 'selectedMDME'">
                  <v-select v-model="selectedMDME" :items="MDME" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ selectedMDME }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Diffusion Mode</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedDiffusionMode', 'DiffusionMode')">
                <template v-if="editKey === 'selectedDiffusionMode'">
                  <v-select
                    v-model="selectedDiffusionMode"
                    :items="DiffusionMode"
                    hide-details
                    outlined
                    @change="showHiddenTabs"
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedDiffusionMode }}
                </template>
              </div>
            </div>

            <div v-if="showFlag">
              <div v-for="(column, index) in subColumns" :key="index" class="sub-column">
                <div class="subcolumn-key">
                  <span :style="{ marginLeft: column.selectedValue === null ? '40px' : '15px' }">{{ column.key }}</span>
                </div>
                <div
                  class="subcolumn-value"
                  @click="
                    column.selectedValue !== null ? startEdit(column.editKey, column.items) : myFactors(column.editKey)
                  "
                >
                  <template v-if="editKey === column.editKey">
                    <v-select
                      v-if="column.items !== null"
                      v-model="column.selectedValue"
                      :items="column.items"
                      hide-details
                      outlined
                      @input="endEdit"
                    ></v-select>

                    <v-text-field
                      v-else-if="column.type === 1"
                      v-model="column.selectedValue"
                      hide-details
                      outline
                      @input="updateSelectedNobf(column.editKey, $event)"
                    ></v-text-field>

                    <SpinButton
                      v-else
                      :type="'number'"
                      v-model.number="column.selectedValue"
                      :value="column.selectedValue"
                      :step="1"
                      :min="1"
                      :max="2000"
                      @input="changeSpinFactors($event, column.editKey)"
                    />
                  </template>
                  <template v-else>
                    <template v-if="column.selectedValue !== null">
                      {{ column.selectedValue }}
                    </template>
                    <template v-else>
                      <v-icon>mdi-chevron-down</v-icon>
                    </template>
                  </template>
                </div>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>T1 Mapping</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedT1Mapping', 'T1Mapping')">
                <template v-if="editKey === 'selectedT1Mapping'">
                  <v-select
                    v-model="selectedT1Mapping"
                    :items="T1Mapping"
                    hide-details
                    outlined
                    @input="endEdit"
                    @click="alert"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedT1Mapping }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>SAR Mode</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedSARMode', 'SARMode')">
                <template v-if="editKey === 'selectedSARMode'">
                  <v-select
                    v-model="selectedSARMode"
                    :items="SARMode"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedSARMode }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>B1 Mode</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedB1Mode', 'B1Mode')">
                <template v-if="editKey === 'selectedB1Mode'">
                  <v-select v-model="selectedB1Mode" :items="B1Mode" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ selectedB1Mode }}
                </template>
              </div>
            </div>
            <div class="sub-column" v-if="selectedB1Mode == 'userDefined'">
              <div class="subcolumn-key"><span>Amplitude (uT)</span></div>
              <div class="subcolumn-value" @click="startEdit('amplitude')">
                <template v-if="editKey === 'amplitude'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="amplitude"
                    :value="amplitude"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'amplitude')"
                  />
                </template>
                <template v-else>
                  {{ amplitude }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>SAR Allow First Level</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedSARAllowFirstLevel', 'SARAllowFirstLevel')">
                <template v-if="editKey === 'selectedSARAllowFirstLevel'">
                  <v-select
                    v-model="selectedSARAllowFirstLevel"
                    :items="SARAllowFirstLevel"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedSARAllowFirstLevel }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>PNS Mode</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedPNSMode', 'PNSMode')">
                <template v-if="editKey === 'selectedPNSMode'">
                  <v-select
                    v-model="selectedPNSMode"
                    :items="PNSMode"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedPNSMode }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Gradient Mode</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedGradient', 'Gradient')">
                <template v-if="editKey === 'selectedGradient'">
                  <v-select
                    v-model="selectedGradient"
                    :items="Gradient"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedGradient }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>SoftTone Mode</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedSoftToneMode', 'SofToneMode')">
                <template v-if="editKey === 'selectedSoftToneMode'">
                  <v-select
                    v-model="selectedSoftToneMode"
                    :items="SofToneMode"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedSoftToneMode }}
                </template>
              </div>
            </div>

            <div class="sub-column" v-if="selectedSoftToneMode == 'userDefined'">
              <div class="subcolumn-key"><span>Factor</span></div>
              <div class="subcolumn-value" @click="startEdit('factor')">
                <template v-if="editKey === 'factor'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="factor"
                    :value="factor"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'factor')"
                  />
                </template>
                <template v-else>
                  {{ factor }}
                </template>
              </div>
            </div>
          </div>
        </div>
        <TabSidebar></TabSidebar>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import SpinButton from './PhSpinButton.vue'
import TabSidebar from './PhTabComponentSidebar.vue'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  components: { SpinButton, TabSidebar },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      selectedScanType: 'Imaging',
      selectedScanMode: 'MS',
      selectedTechnique: 'SE',
      selectedModifiedSE: 'no',
      selectedAcquisitionMode: 'cartisian',
      selectedFastImagingMode: 'TSE',
      selectedShotMode: 'multishot',
      selectedStartupEchoes: 0,
      selectedProfileOrder: 'linear',
      selectedDrive: 'no',
      selectedUltrashot: 'yes(no)',
      selectedFidReduction: 'default',
      selectedEchoes: 1,
      selectedPartialEcho: 'no',
      selectedTE: 'user defined',
      selectedTEms: 50,
      selectedFlipAngle: 90,
      selectedRefocusingControl: 'constant',
      selectedAngle: 120,
      selectedTR: 'user defined',
      selectedTRVal: 1,
      selectedTEVal: 10,
      selectedTRms: 9500,
      selectedHalfscan: 'no',
      selectedWaterFatShift: 'maximum',
      selectedShim: 'default',
      selectedMDixon: 'no',
      selectedFatSuppression: 'no',
      selectedWaterSuppression: 'no',
      selectedBBPulse: 'no',
      selectedMTC: 'no',
      selectedMDME: 'no',
      selectedDiffusionMode: 'no',
      selectedT1Mapping: 'no',
      selectedSARMode: 'high',
      selectedB1Mode: 'default',
      selectedSARAllowFirstLevel: 'yes',
      selectedPNSMode: 'low',
      selectedGradient: 'default',
      selectedSoftToneMode: 'no',
      selectedIRDelay: 400,
      selectedStrength: 'strong',
      selectedAcquire: 'No',
      selectedFrequencyOffset: 'default',
      selectedSupprLevel: 'strong',
      selectedPower: 1,
      minRange: 3000,
      maxRange: 6000,
      amplitude: 20,
      Offset: 100,
      factor: 2,
      wfs_pixcels: 2.582,
      selectedNobf: { nobf: '3 (2)' },
      selectedFactors: {},
      previousNobf_1: 1,
      previousNobf_2: 1,
      showPixelFlag: false,
      supprLevel: [
        { text: 'Strong', value: 'strong' },
        { text: 'Medium', value: 'medium' },
        { text: 'Weak', value: 'weak' },
      ],
      selectedInversionDelay: 'auto (user defined)',
      inversionDelay: [
        { text: 'User defined', value: 'userDefined' },
        { text: 'Auto', value: 'auto' },
      ],
      frequencyOffset: [
        { text: 'Default', value: 'default' },
        { text: 'User defined', value: 'userDefined' },
      ],
      strength: [
        { text: 'Weak', value: 'weak' },
        { text: 'Medium', value: 'medium' },
        { text: 'Strong', value: 'strong' },
      ],
      acquire: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      selectedDual: 'no',
      dual: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],

      ScanType: [
        { text: 'Imaging', value: 'Imaging' },
        { text: 'Spectroscopy', value: 'Spectroscopy' },
      ],
      ScanMode: [
        { text: '2D', value: '2D' },
        { text: '3D', value: '3D' },
        { text: 'MS', value: 'MS' },
        { text: 'M2D', value: 'M2D' },
      ],
      Technique: [
        { text: 'SE', value: 'SE' },
        { text: 'IR', value: 'IR' },
        { text: 'MIX', value: 'MIX' },
        { text: 'FFE', value: 'FFE' },
      ],
      ModifiedSE: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      AcquisitionMode: [
        { text: 'Cartisian', value: 'cartisian' },
        { text: 'Radial', value: 'radial' },
        { text: 'Spiral', value: 'spiral' },
        { text: 'MultiVane', value: 'multivane' },
      ],
      FastImagingMode: [
        { text: 'None', value: 'none' },
        { text: 'TSE', value: 'TSE' },
        { text: 'EPI', value: 'EPI' },
        { text: 'GreSE', value: 'GreSE' },
      ],
      ShotMode: [
        { text: 'multishot', value: 'multishot' },
        { text: 'single-shot', value: 'singleshot' },
      ],
      TSEFactor: 10,
      StartupEchoes: 0,
      ProfileOrder: [{ text: 'linear', value: 'linear' }],
      DRIVE: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      UltraShot: [{ text: 'yes(no)', value: 'yes(no)' }],
      FidReduction: [
        { text: 'Default', value: 'default' },
        { text: 'Strong', value: 'strong' },
        { text: 'Extrastrong', value: 'extrastrong' },
      ],
      Echoes: 1,
      PartialEcho: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      TE: [{ text: 'user defined', value: 'user defined' }],
      TEms: 100,
      FlipAngle: 90,
      RefocusingControl: [
        { text: 'no', value: 'no' },
        { text: 'constant', value: 'constant' },
        { text: 'T2-optimized', value: 'T2-optimized' },
        { text: 'T1-optimized', value: 'T1-optimized' },
      ],
      Angle: 120,
      TR: [
        { text: 'user defined', value: 'user defined' },
        { text: 'Shortest', value: 'shortest' },
        { text: 'Range', value: 'range' },
      ],
      TRms: 8500,
      Halfscan: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
        { text: 'Default', value: 'default' },
      ],
      WaterFatShift: [
        { text: 'maximum', value: 'maximum' },
        { text: 'user defined', value: 'user defined' },
        { text: 'minimum', value: 'minimum' },
      ],
      Shim: [
        { text: 'default', value: 'default' },
        { text: 'auto', value: 'auto' },
        { text: 'volume', value: 'volume' },
      ],
      mDIXON: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      FatSuppression: [
        { text: 'No', value: 'no' },
        { text: 'SPIR', value: 'SPIR' },
        { text: 'SPAIR', value: 'SPAIR' },
        { text: 'ProSet', value: 'ProSet' },
      ],
      WaterSuppression: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      BBPulse: [
        { text: 'No', value: 'no' },
        { text: 'MSDE', value: 'MSDE' },
      ],
      MTC: [
        { text: 'No', value: 'no' },
        { text: 'on resonance', value: 'onResonance' },
        { text: 'off resonance', value: 'offResonance' },
      ],
      MDME: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      DiffusionMode: [
        { text: 'No', value: 'no' },
        { text: 'DWI', value: 'DWI' },
        { text: 'DTI', value: 'DTI' },
      ],
      T1Mapping: [
        { text: 'No', value: 'no' },
        { text: 'cardiac native', value: 'cardiacNative' },
        { text: 'cardiac enhanced', value: 'cardiacEnhanced' },
        { text: 'cardiac user defined', value: 'cardiacUserDefined' },
        { text: 'MSK', value: 'MSK' },
      ],
      SARMode: [
        { text: 'high', value: 'high' },
        { text: 'Moderate', value: 'moderate' },
        { text: 'Low', value: 'low' },
        { text: 'Ultra low', value: 'ultraLow' },
        { text: 'User defined', value: 'userDefined' },
      ],
      B1Mode: [
        { text: 'default', value: 'default' },
        { text: 'User defined', value: 'userDefined' },
      ],
      SARAllowFirstLevel: [
        { text: 'yes', value: 'yes' },
        { text: 'No', value: 'no' },
      ],
      PNSMode: [
        { text: 'Low', value: 'low' },
        { text: 'Moderate', value: 'moderate' },
        { text: 'High', value: 'high' },
      ],
      Gradient: [
        { text: 'Ragular', value: 'ragular' },
        { text: 'default', value: 'default' },
        { text: 'User defined', value: 'userDefined' },
        { text: 'Full control', value: 'fullControl' },
        { text: 'Maximum', value: 'maximum' },
        { text: 'Enhanced', value: 'enhanced' },
      ],
      SofToneMode: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
        { text: 'User defined', value: 'userDefined' },
        { text: 'ComforTone', value: 'comforTone' },
      ],
      subColumns: [
        {
          key: 'gradient expert mode',
          value: 'gemType',
          editKey: 'gemType',
          items: ['yes', 'no'],
          selectedValue: 'no',
        },
        {
          key: 'gradient overplus',
          value: 'go',
          editKey: 'go',
          items: ['yes', 'no'],
          selectedValue: 'yes',
        },
        {
          key: 'nr of b-factors',
          value: 'nobf',
          editKey: 'nobf',
          items: null,
          selectedValue: '3 (2)',
          type: 1,
        },
        {
          key: 'b-factor order',
          value: 'bfo',
          editKey: 'bfo',
          items: ['ascending', 'user defined'],
          selectedValue: 'user defined',
        },
        {
          key: 'b-factors',
          value: 'bfs',
          editKey: 'bfs',
          items: [],
          selectedValue: null,
        },
        {
          key: 'average high b',
          value: 'ahb',
          editKey: 'ahb',
          items: ['no', 'yes', 'user defined'],
          selectedValue: 'user defined',
        },
        {
          key: 'b-factor averages',
          value: 'bfa',
          editKey: 'bfa',
          items: [],
          selectedValue: null,
        },
        // Existing sub-columns here
      ],
      showFlag: false,
      trShowFlag: false,
      bfsShowFlag: false,
      bfaShowFlag: false,
      previousState: null,
      editKey: null,
      menu: false,
      selectedDropdownItem: null,
    }
  },
  mounted() {
    console.log('fourierItems===', this.fourierItems)
    console.log('softwareVendorPreference===', this.softwareVendorPreference)
    this.updateSequenceType(this.selectionConfig.sequenceType)

    document.addEventListener('click', this.handleGlobalClick)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleGlobalClick)
  },
  computed: {
    ...mapGetters('user', ['softwareVendorPreference', 'softwareVersionPreference']),
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    ...mapActions('dataToParent', ['updateScanTime', 'updateSequenceType', 'updateWfsPixcels']),
    ...mapActions('scanTimeConfig', ['updateRepetitionTime']),
    startEdit(key) {
      this.editKey = key
    },
    endEdit() {
      this.editKey = null
    },
    changeSpin(value, type) {
      const decimalPart = value.toString().split('.')[1]
      if (decimalPart && decimalPart.length > 3) {
        value = Number(value).toFixed(1)
      }
      this[type] = Number(value) // store as number, not string
      if (type === 'wfs_pixcels') {
        this.updateWfsPixcels(Number(value))
      }
    },
    changeSpinFactors(value, key) {
      this.$set(this.selectedFactors, key, value)
    },
    handleScroll() {
      this.endEdit()
    },
    handleGlobalClick(event) {
      const clickedElement = event.target
      const isEditableArea = this.isEditableArea(clickedElement)
      if (!isEditableArea) {
        this.endEdit()
      }
    },
    updateSelectedNobf(key, value) {
      this.$set(this.selectedNobf, key, value) // Dynamically set key-value pair
    },
    showHiddenTabs() {
      console.log(this.subColumns.length)
      if (this.selectedDiffusionMode === 'DWI') this.showFlag = true
      else this.showFlag = false
    },
    showRange() {
      if (this.selectedTR === 'range') {
        this.trShowFlag = true
        this.$store.commit('scanTimeConfig/SET_TRSYNC', this.minRange + '~' + this.maxRange)
      } else {
        this.trShowFlag = false
        this.$store.commit('scanTimeConfig/SET_TRSYNC', this.selectedTRVal)
      }
    },
    showRangeSeperately() {
      this.$store.commit('scanTimeConfig/SET_TRSYNC', this.minRange + '~' + this.maxRange)
    },
    selectWFS(event) {
      if (event === 'user defined') {
        this.showPixelFlag = true
        this.$store.commit('dataToParent/updateWfsPixcels', 2.582)
      } else this.showPixelFlag = false
    },
    myFactors(key) {
      const selectedNumberNobf = +this.selectedNobf['nobf'].replace(/\s+/g, '').split('(')[0]
      const index = this.subColumns.findIndex((column) => column.editKey === key)
      let subShowFlag = false

      if (key === 'bfs') {
        this.bfsShowFlag = !this.bfsShowFlag
        subShowFlag = this.bfsShowFlag
      } else {
        this.bfaShowFlag = !this.bfaShowFlag
        subShowFlag = this.bfaShowFlag
      }

      let defaultSelections = [500, 800, 1400]
      let defaultSelectionsCof = [1, 4, 8]

      if (index !== -1) {
        if (subShowFlag) {
          let newColumns = []
          if (key === 'bfs') {
            // Manually define the new columns
            for (let i = 1; i <= selectedNumberNobf; i++) {
              let sfact = 0
              if (i <= defaultSelections.length) sfact = defaultSelections[i - 1]
              newColumns.push({
                key: i.toString(),
                selectedValue: this.selectedFactors[`factor_n_${i}`] ? this.selectedFactors[`factor_n_${i}`] : sfact,
                editKey: `factor_n_${i}`,
                items: null,
                type: 2,
              })
            }

            this.previousNobf_1 = selectedNumberNobf
          } else {
            for (let i = 1; i <= selectedNumberNobf + 1; i++) {
              let afact = 0
              let sfact = 0
              if (i <= defaultSelections.length) sfact = defaultSelections[i - 1]
              if (i <= defaultSelectionsCof.length) afact = defaultSelectionsCof[i - 1]
              newColumns.push({
                key: i.toString(),
                selectedValue: this.selectedFactors[`factor_n_${i}`]
                  ? '(' + this.selectedFactors[`factor_n_${i}`] + ')' + afact
                  : '(' + sfact + ')' + afact, // Default to 0 if undefined or null
                editKey: `factor_average_n_${i}`,
                items: null,
                type: 1,
              })

              // For the last iteration, set selectedValue to empty string
              if (i === selectedNumberNobf + 1) {
                newColumns[newColumns.length - 1].selectedValue = ''
              }
            }

            this.previousNobf_2 = selectedNumberNobf
          }
          this.subColumns.splice(index + 1, 0, ...newColumns)
        } else {
          // Remove the previously added 4 sub-columns
          if (key === 'bfs') this.subColumns.splice(index + 1, this.previousNobf_1)
          else this.subColumns.splice(index + 1, this.previousNobf_2 + 1)
        }
      }
    },
    isEditableArea(element) {
      let currentElement = element
      while (currentElement) {
        if (currentElement.classList.contains('subcolumn-value')) {
          return true
        }
        currentElement = currentElement.parentElement
      }
      return false
    },
  },
  watch: {
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
    repetitionTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateRepetitionTime(newVal)
      }
    },
    'selectionConfig.sequenceType'(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('selectionConfig.sequenceType==========', newVal)

        this.changeSequenceType(newVal)
        this.updateSequenceType(newVal)
      }
    },
  },
}
</script>

<style scoped>
.v-card__text {
  padding: 0px !important;
  position: static !important;
}

.row-container {
  display: flex;
  overflow-x: auto;
  height: 100%;
}

@media screen and (max-width: 1680px) and (max-height: 1050px) {
  .row-container {
    display: flex;
    overflow-x: auto;
    height: 100%;
  }

  .scrollable {
    overflow-y: scroll;
    max-height: 100% !important;
  }
}

.column {
  width: 50%;
  padding: 2px;
  box-sizing: border-box;
  background-color: #d5d7d7;
}

input[type='number'] {
  text-align: right;
}

.sub-columns {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sub-column {
  display: flex;
  justify-content: space-between;
  border: 1px solid;
  padding: 5px;
  height: 33px;
}

.sub-column .subcolumn-key {
  text-align: left !important;
}

.sub-column .subcolumn-value {
  text-align: right !important;
}

.subcolumn-key {
  /* font-weight: bold; */
  width: 80%;
}
::v-deep .v-input__append-inner {
  margin-top: 5px !important;
}
.subcolumn-value {
  width: 13rem;
  height: 34px;
}

.scrollable {
  overflow-y: scroll;
  max-height: 100%;
}
@media screen and (max-width: 1600px) and (max-height: 900px) {
  .row-container {
    display: flex;
    overflow-x: auto;
    height: 100%;
  }

  .scrollable {
    overflow-y: scroll;
    max-height: 100% !important;
  }
}
::v-deep .v-input__slot fieldset {
  background: white !important;
  border-color: white !important;
  border-radius: 4px !important;
  height: 2rem !important;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  margin-bottom: 12px !important;
  margin-left: 0px !important;
}

.v-input__control {
  height: 2rem !important;
}

/* ::v-deep .v-text-field--outlined.v-input--has-state fieldset,
.v-text-field--outlined.v-input--is-focused fieldset {
  border: 1px solid !important;
} */
::v-deep v-text-field__slot {
  background: #fffcfc !important;
}
::v-deep .v-text-field__slot {
  background: #ffffff !important;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 16px !important;
  right: 2px !important;
  top: -7px !important;
}
::v-deep .v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 25px !important;
  height: 25px !important;
}
::v-deep .v-text-field--outlined.v-input--has-state fieldset,
.v-text-field--outlined.v-input--is-focused fieldset {
  border: 1px solid !important;
}
::v-deep .v-select__selection--comma {
  margin: 0px 0px 0px 0px !important;
}
</style>
