<template>
  <div style="width: 100%; background-color: #6875a2; height: 100%">
    <div class="tab-list" style="height: 5%">
      <div
        v-for="(tab, index) in tabs"
        :key="index"
        v-if="index !== 1 || (index === 1 && sequenceType === 'DIFF')"
        :class="{ active: activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
        class="tab-item"
      >
        <p :href="`#${tab.id}`" style="color: white">{{ tab.label }}</p>
      </div>
    </div>

    <div class="tab-content" style="height: 96%">
      <div
        v-for="(tab, index) in tabs"
        :key="index"
        :id="tab.id"
        :class="{ active: activeTab === tab.id }"
        class="tab-pane"
        style="height: 100%"
      >
        <v-card style="height: 100%">
          <v-card-text :style="{ height: activeTab !== 'details' ? '27rem' : '' }" style="height: 100%">
            <v-row v-if="activeTab === 'details'" justify="space-between" style="width: 100%; margin: 0px">
              <div
                class="main-2"
                style="
                  height: 100%;
                  display: flex;
                  align-items: start;
                  flex-direction: column;
                  justify-content: space-between;
                "
              >
                <div v-if="!isCanvasActiveFlag" class="text-1">
                  <label class="label-size">TE:</label>
                  <div class="text-2">
                    <v-select
                      :disabled="isAddLocalizerMode"
                      color="#423c3c"
                      dense
                      outlined
                      style="width: 100%; margin-left: 3%"
                      items="Minimum"
                      value="Minimum"
                    />
                  </div>
                </div>
                <div v-else style="width: 100%; display: flex; justify-content: end; flex-direction: column">
                  <div class="text-1">
                    <label class="label-size"># of TE(s) per scan:</label>
                    <div class="text-2">
                      <GESelectionButtonWithInput
                        v-model.number="TENumbers"
                        :type="'number'"
                        :step="1"
                        :min="1"
                        :max="500"
                        :hasIncreaseButton="true"
                        :hasSelectionButton="false"
                        :disabled="complete || isAddLocalizerMode"
                      />
                    </div>
                  </div>

                  <div class="text-1">
                    <label class="label-size">TE:</label>
                    <div class="text-2">
                      <GESelectionButtonWithInput
                        v-if="
                          selectionConfig &&
                          (selectionConfig.sequenceType === 'TE' || selectionConfig.sequenceType === 'DIFF')
                        "
                        :step="Number(echoSpacing)"
                        :min="minTEOptionsForTEandDIFF"
                        :max="
                          selectionConfig.sequenceType === 'DIFF'
                            ? minTEOptionsForTEandDIFF * 2
                            : echoSpacing * echoTrainLength
                        "
                        @input="(val) => changeEchoTime(val === 'Min Full' ? minSeqTe : val)"
                        v-model="echoTime"
                        :options="['Min Full', 42.0, 68.0, 85.0, 102.0]"
                        :hasIncreaseButton="true"
                        :disabled="complete || isAddLocalizerMode"
                      />
                      <GESelectionButtonWithInput
                        v-if="selectionConfig && selectionConfig.sequenceType === 'SE'"
                        :step="1"
                        :min="6"
                        :max="maxTEOptionsForSE"
                        @input="(val) => changeEchoTime(val === 'Min Full' ? minSeqTe : val)"
                        v-model="echoTime"
                        :options="['Min Full', 42.0, 68.0, 85.0, 102.0]"
                        :hasIncreaseButton="true"
                        :disabled="complete || isAddLocalizerMode"
                      />
                      <GESelectionButtonWithInput
                        v-if="selectionConfig && selectionConfig.sequenceType === 'GRE'"
                        :step="1"
                        :min="1"
                        :max="maxTEOptionsForGRE"
                        @input="(val) => changeEchoTime(val === 'Min Full' ? minSeqTe : val)"
                        v-model="echoTime"
                        :options="['Min Full', 42.0, 68.0, 85.0, 102.0]"
                        :hasIncreaseButton="true"
                        :disabled="complete || isAddLocalizerMode"
                      />
                    </div>
                  </div>

                  <div class="text-1">
                    <label class="label-size">Refocus flip Angle:</label>
                    <div class="text-2">
                      <GESelectionButtonWithInput
                        v-model="flipAngle"
                        :options="[110]"
                        @input="(val) => changeSpin(val, 'flipAngle')"
                        :step="1"
                        :min="1"
                        :max="2000"
                        :hasIncreaseButton="true"
                        :disabled="complete || isAddLocalizerMode"
                      />
                    </div>
                  </div>

                  <div class="text-1">
                    <label class="label-size">Echo Train Length:</label>
                    <div class="text-2">
                      <GESelectionButtonWithInput
                        :options="[2, 3, 4, 16, 24]"
                        v-model="echoTrainLength"
                        :type="'number'"
                        :step="1"
                        :min="1"
                        :max="512"
                        :hasIncreaseButton="true"
                        @input="changeSpin($event, 'echoTrainLength')"
                        :disabled="complete || isAddLocalizerMode"
                      />
                    </div>
                  </div>

                  <div v-if="inversionRecovery" class="text-1">
                    <label class="label-size">Inv. Time:</label>
                    <div class="text-2">
                      <GESelectionButtonWithInput
                        v-model.number="inversionTime"
                        :type="'number'"
                        :step="1"
                        :min="0"
                        :max="2000"
                        :hasIncreaseButton="true"
                        :hasSelectionButton="false"
                        :disabled="complete || isAddLocalizerMode"
                      />
                    </div>
                  </div>

                  <div class="text-1">
                    <label class="label-size">Recom DL Strength:</label>
                    <div class="text-2">
                      <v-select
                        color="#423c3c"
                        dense
                        outlined
                        style="width: 100%; margin-left: 3%"
                        :items="recomDlStrengthOptions"
                        item-text="text"
                        item-value="value"
                        item-disabled="disabled"
                        v-model="recomDlStrength"
                      />
                    </div>
                  </div>
                  <div class="text-1">
                    <label class="label-size">Intensity Correction:</label>
                    <div class="text-2">
                      <v-select
                        v-model="intensityCorrection"
                        :items="intensityCorrectionOptions"
                        item-text="text"
                        item-value="value"
                        item-disabled="disabled"
                        color="#423c3c"
                        dense
                        outlined
                        style="width: 100%; margin-left: 3%"
                      />
                    </div>
                  </div>
                  <div class="text-1">
                    <label class="label-size">Calibration In Prescan:</label>
                    <div class="text-2">
                      <v-select
                        :disabled="isAddLocalizerMode"
                        v-model="calibrationInPrescan"
                        :items="calibrationInPrescanOptions"
                        item-text="text"
                        item-value="value"
                        item-disabled="disabled"
                        color="#423c3c"
                        dense
                        outlined
                        style="width: 100%; margin-left: 3%"
                      />
                    </div>
                  </div>
                  <div class="text-1">
                    <label class="label-size">Intensity Filter:</label>
                    <div class="text-2">
                      <v-select
                        v-model="intensityFilter"
                        :items="intensityFilterOptions"
                        item-text="text"
                        item-value="value"
                        item-disabled="disabled"
                        color="#423c3c"
                        dense
                        outlined
                        style="width: 100%; margin-left: 3%"
                      />
                    </div>
                  </div>
                  <div class="text-1">
                    <label class="label-size"> Save Original: </label>
                    <div class="text-2">
                      <input type="checkbox" id="gap" class="checkboxInner" />
                    </div>
                  </div>

                  <div class="text-1">
                    <label class="label-size"> 3D Geometry Correction: </label>
                    <div class="text-2">
                      <input type="checkbox" id="gap" class="checkboxInner" />
                    </div>
                  </div>
                </div>
                <div style="width: 100%; padding-left: 10px">
                  <div class="text-1 te-range-content">
                    <label class="label-size">Minimum TE: 8</label>
                    <label class="label-size">Maximum TE: 32.1</label>
                  </div>
                </div>
              </div>
              <div class="main-2" style="display: flex; justify-content: start; flex-direction: column">
                <div class="text-1">
                  <label class="label-size" style="width: 50%; display: flex; align-items: center">Frequency:</label>
                  <div class="text-2" style="width: 50%; margin-left: 2%">
                    <GESelectionButtonWithInput
                      :options="[192, 256, 320, 384, 512]"
                      @input="changeSpin($event, 'frequencyMatrix')"
                      v-model="frequencyMatrix"
                      :disabled="complete || isAddLocalizerMode"
                    />
                  </div>
                </div>

                <div class="text-1">
                  <label class="label-size">Phase:</label>
                  <div class="text-2">
                    <GESelectionButtonWithInput
                      :options="[160, 192, 224, 256, 512]"
                      v-model.number="phaseMatrix"
                      @input="changeSpin($event, 'phaseMatrix')"
                      :disabled="complete || isAddLocalizerMode"
                    />
                  </div>
                </div>

                <div v-if="isCanvasActiveFlag" class="text-1">
                  <label class="label-size">Nex:</label>
                  <div class="text-2">
                    <GESelectionButtonWithInput
                      :options="[1, 2, 3, 4, 5, 6, 7, 8]"
                      @input="setAverages"
                      v-model="averages"
                      :disabled="complete || isAddLocalizerMode"
                    />
                  </div>
                </div>
                <div class="text-1">
                  <label class="label-size">Bandwidth:</label>
                  <div class="text-2">
                    <GESelectionButtonWithInput
                      :options="[10.42, 12.5, 15.63, 20.83, 31.25]"
                      @input="onBandwidthChangedByUser"
                      v-model.number="bandWidth"
                      :disabled="complete || isAddLocalizerMode"
                    />
                  </div>
                </div>
                <div class="text-1">
                  <label class="label-size">Excitation Mode:</label>
                  <div class="text-2">
                    <v-select
                      item-text="text"
                      item-value="value"
                      item-disabled="disabled"
                      v-model="ExcitationMode"
                      :items="ExcitationModeOptions"
                      color="#423c3c"
                      dense
                      outlined
                    />
                  </div>
                </div>
                <div class="text-1">
                  <label class="label-size">Shim:</label>
                  <div class="text-2">
                    <v-select
                      color="#423c3c"
                      dense
                      outlined
                      item-text="text"
                      item-value="value"
                      item-disabled="disabled"
                      :items="shimOptions"
                      v-model="selectedShim"
                    />
                  </div>
                </div>
                <div class="text-1">
                  <label class="label-size">RF Drive Mode:</label>
                  <div class="text-2">
                    <v-select
                      :disabled="isAddLocalizerMode"
                      color="#423c3c"
                      dense
                      outlined
                      :items="RfDriveModeOptions"
                      item-text="text"
                      item-value="value"
                      item-disabled="disabled"
                      v-model="selectedRfDriveMode"
                    />
                  </div>
                </div>
                <div v-if="isCanvasActiveFlag" class="text-1">
                  <label class="label-size">Flow Comp Direction:</label>
                  <div class="text-2">
                    <v-select
                      :disabled="isAddLocalizerMode"
                      color="#423c3c"
                      dense
                      outlined
                      :items="flowCompDirectionOptions"
                      item-text="text"
                      item-value="value"
                      item-disabled="disabled"
                      v-model="flowCompDirection"
                    />
                  </div>
                </div>

                <div v-if="isCanvasActiveFlag" class="autotr-content">
                  <div>
                    <p>
                      <b>TR Range for Auto TR</b>
                    </p>
                    <div class="autotr-text">
                      <label>Minimum TR</label>
                      <input v-model.number="minConcatAcqPackage" disabled />
                    </div>
                    <div class="autotr-text">
                      <label>Maximum TR</label>
                      <input v-model.number="minSeqTr" disabled />
                    </div>
                  </div>
                </div>
              </div>
            </v-row>
            <div v-else-if="activeTab === 'diffusion'" class="diffusion-tab">
              <div style="display: flex">
                <div style="width: 60%; padding-right: 40px; padding-top: 10px">
                  <div class="text-1">
                    <label class="label-size"># b-values:</label>
                    <div class="text-2">
                      <GESelectionButtonWithInput
                        :step="1"
                        :min="1"
                        :max="4"
                        :value="numBValues"
                        @input="changeSpin($event, 'numBValues')"
                        :hasIncreaseButton="true"
                      />
                    </div>
                  </div>

                  <div class="text-1">
                    <label class="label-size">NEX for T2:</label>
                    <div class="text-2">
                      <GESelectionButtonWithInput :hasIncreaseButton="true" disabled />
                    </div>
                  </div>

                  <div class="text-1">
                    <label class="label-size">Diffusion Direction:</label>
                    <div class="text-2">
                      <v-select
                        color="#423c3c"
                        dense
                        outlined
                        value="ALL"
                        :items="diffusionDirectionOptions"
                        item-text="text"
                        item-value="value"
                        item-disabled="disabled"
                      />
                    </div>
                  </div>

                  <div class="text-1">
                    <label class="label-size"># of Diffusion Directions:</label>
                    <div class="text-2">
                      <GESelectionButtonWithInput
                        v-model="diffusionDirections"
                        :options="diffusionDirectionItems"
                        :step="1"
                        :min="1"
                        :max="5"
                        :hasIncreaseButton="true"
                      />
                    </div>
                  </div>

                  <div class="text-1">
                    <label class="label-size"># of T2 Images:</label>
                    <div class="text-2">
                      <GESelectionButtonWithInput :hasIncreaseButton="true" disabled />
                    </div>
                  </div>

                  <div class="text-1">
                    <label class="label-size">Echo Spacing(ms):</label>
                    <div class="text-2">
                      <input class="input-normal" v-model.number="echoSpacing" disabled />
                    </div>
                  </div>
                </div>
                <div class="diffusion-table">
                  <v-table>
                    <thead>
                      <tr>
                        <th width="50px">#</th>
                        <th width="110px">b-value</th>
                        <th width="140px">NEX</th>
                      </tr>
                    </thead>
                    <div class="series-body">
                      <tbody>
                        <tr v-for="(_, index) in numBValues" :key="index">
                          <td width="70px">{{ index + 1 }}</td>
                          <td width="130px">
                            <GESelectionButtonWithInput
                              :step="1"
                              :min="index === 0 ? (numBValues === 1 ? 50 : 0) : (index === numBValues - 1 ? Math.max(50, bValues[index - 1] + 1) : bValues[index - 1] + 1)"
                              :max="5000"
                              v-model.number="bValues[index]"
                              @input="(value) => changeBValueSpin(value, index)"
                              :hasIncreaseButton="true"
                              :hasSelectionButton="false"
                            />
                          </td>
                          <td width="120px">
                            <GESelectionButtonWithInput
                              :step="1"
                              :min="1"
                              :max="20"
                              v-model.number="bAverages[index]"
                              @input="(value) => changeBAveragesSpin(value, index)"
                              :hasIncreaseButton="true"
                              :hasSelectionButton="false"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </div>
                  </v-table>
                </div>
              </div>
              <div class="diffusion-middle">
                <div v-if="isAdmin && isUltraLab">
                  <ul class="text-body-2 text-right mb-0">
                    <li>SNR Factor: {{ Number.parseFloat(noiseFactor).toFixed(2) }}</li>
                  </ul>
                </div>
              </div>
              <div class="diffusion-bottom">
                <div class="text-1">
                  <label class="label-size"> ADC: </label>
                  <div class="text-2">
                    <input type="checkbox" v-model="diffusionADC" class="p-2" :disabled="adcDisabled" />
                  </div>
                </div>
                <div class="text-1">
                  <label class="label-size"> Optimize TE: </label>
                  <div class="text-2">
                    <input type="checkbox" id="gap" class="checkboxInner" checked disabled />
                  </div>
                </div>
                <div class="text-1">
                  <label class="label-size"> Dual Spin Echo: </label>
                  <div class="text-2">
                    <input type="checkbox" id="gap" class="checkboxInner" disabled />
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="activeTab === 'acceleration'" class="acceleration-tab">
              <div class="text-3">
                <label class="label-size">Phase</label>
                <div class="text-2">
                  <GESelectionButtonWithInput
                    :options="[1.0, 1.5, 2.0, 2.5, 3.0]"
                    v-model="parallelFactorValue"
                    :type="'number'"
                    :step="isArcChecked ? 0.01 : 0.05"
                    :min="1"
                    :max="10"
                    :hasIncreaseButton="true"
                    :disabled="!isArcChecked && !isAssetChecked"
                  />
                </div>
              </div>
              <div class="text-3">
                <label class="label-size">Slice</label>
                <div class="text-2">
                  <GESelectionButtonWithInput
                    :options="[1.0, 1.5, 2.0, 2.5, 3.0]"
                    value="1.0"
                    :type="'number'"
                    :step="0.01"
                    :min="1"
                    :max="10"
                    :hasIncreaseButton="true"
                    disabled
                  />
                </div>
              </div>
            </div>
            <v-row v-else-if="activeTab === 'advanced'" style="width: 100%; display: flex; flex-direction: column">
              <div v-if="!isCanvasActiveFlag">
                <div>
                  <div>
                    <p style="color: black">
                      <b>User Control Variable</b>
                    </p>
                  </div>
                  <div style="display: flex; justify-content: center; flex-direction: row">
                    <div style="width: 80%"></div>
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >Min</label
                    >
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >Max</label
                    >
                  </div>
                  <div style="display: flex; justify-content: center; flex-direction: row">
                    <label
                      class="label-size"
                      style="width: 20%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >CV1</label
                    >
                    <label
                      class="label-size"
                      style="
                        width: 40%;
                        display: flex;
                        align-items: center;
                        padding-right: 1%;
                        justify-content: center;
                        font-weight: bold;
                      "
                      >Collect All Variable Echoes(0:OFF, 1:ON)</label
                    >
                    <!-- <v-select
                  label="CVI Collect All Available Echoes:"
                  v-model="settings.cviCollectAllEchos"
                  :items="cviEchoOptions"
                /> -->
                    <v-select
                      v-model="settings.cviCollectAllEchos"
                      color="#423c3c"
                      :items="cviEchoOptions"
                      dense
                      outlined
                      style="width: 20%"
                    />
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >0.0</label
                    >
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >1.0</label
                    >
                  </div>
                </div>
              </div>

              <div v-else>
                <div style="margin-bottom: 10px">
                  <div>
                    <p style="color: black">
                      <b>User Control Variable</b>
                    </p>
                  </div>
                  <div style="display: flex; justify-content: center; flex-direction: row">
                    <div style="width: 80%"></div>
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >Min</label
                    >
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >Max</label
                    >
                  </div>
                  <div style="display: flex; justify-content: center; flex-direction: row">
                    <label
                      class="label-size"
                      style="width: 20%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >CV6</label
                    >
                    <label
                      class="label-size"
                      style="
                        text-align: end;
                        width: 40%;
                        display: flex;
                        align-items: center;
                        padding-right: 1%;
                        justify-content: end;
                        font-weight: bold;
                        line-height: 1.2;
                        margin-bottom: 0px;
                      "
                    >
                      Acq Order: Interleaved=0,<br />
                      Sequeantial Group=1:
                    </label>

                    <!-- <v-select
                  label="CVI Collect All Available Echoes:"
                  v-model="settings.cviCollectAllEchos"
                  :items="cviEchoOptions"
                /> -->
                    <input
                      value="0.00"
                      style="background-color: white; color: black; width: 20%; padding-left: 10px"
                      disabled
                    />
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >0.0</label
                    >
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >1.0</label
                    >
                  </div>
                </div>

                <div style="margin-bottom: 10px">
                  <div style="display: flex; justify-content: center; flex-direction: row">
                    <label
                      class="label-size"
                      style="width: 20%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >CV15</label
                    >
                    <label
                      class="label-size"
                      style="
                        text-align: end;
                        width: 40%;
                        display: flex;
                        align-items: center;
                        padding-right: 1%;
                        justify-content: end;
                        font-weight: bold;
                        line-height: 1.2;
                        margin-bottom: 0px;
                      "
                    >
                      Spatial Sat Type:0-Light,<br />
                      1=Medium, 2=Strong:
                    </label>
                    <!-- <v-select
                  label="CVI Collect All Available Echoes:"
                  v-model="settings.cviCollectAllEchos"
                  :items="cviEchoOptions"
                /> -->
                    <input
                      value="2.00"
                      style="background-color: white; color: black; width: 20%; padding-left: 10px"
                      disabled
                    />
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >0.0</label
                    >
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >2.0</label
                    >
                  </div>
                </div>

                <div style="margin-bottom: 10px">
                  <div style="display: flex; justify-content: center; flex-direction: row">
                    <label
                      class="label-size"
                      style="width: 20%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >CV16</label
                    >
                    <label
                      class="label-size"
                      style="
                        text-align: end;
                        width: 40%;
                        display: flex;
                        align-items: center;
                        padding-right: 1%;
                        justify-content: end;
                        font-weight: bold;
                      "
                      >FSE T1 optimization(0:OFF, 1:ON)</label
                    >
                    <!-- <v-select
                  label="CVI Collect All Available Echoes:"
                  v-model="settings.cviCollectAllEchos"
                  :items="cviEchoOptions"
                /> -->
                    <input
                      value="2.00"
                      style="background-color: white; color: black; width: 20%; padding-left: 10px"
                      disabled
                    />
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >0.0</label
                    >
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >1.0</label
                    >
                  </div>
                </div>

                <div style="margin-bottom: 10px">
                  <div style="display: flex; justify-content: center; flex-direction: row">
                    <label
                      class="label-size"
                      style="width: 20%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >CV18</label
                    >
                    <label
                      class="label-size"
                      style="
                        text-align: end;
                        width: 40%;
                        display: flex;
                        align-items: center;
                        padding-right: 1%;
                        justify-content: end;
                        font-weight: bold;
                        line-height: 1.2;
                        margin-bottom: 0px;
                      "
                    >
                      Motion Sensitivity Reduction:<br />
                      0=Off, 1=On:
                    </label>
                    <!-- <v-select
                  label="CVI Collect All Available Echoes:"
                  v-model="settings.cviCollectAllEchos"
                  :items="cviEchoOptions"
                /> -->
                    <input
                      value="1.00"
                      style="background-color: white; color: black; width: 20%; padding-left: 10px"
                      disabled
                    />
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >0.0</label
                    >
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >1.0</label
                    >
                  </div>
                </div>

                <div style="margin-bottom: 10px">
                  <div style="display: flex; justify-content: center; flex-direction: row">
                    <label
                      class="label-size"
                      style="width: 20%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >CV21</label
                    >
                    <label
                      class="label-size"
                      style="
                        text-align: end;
                        width: 40%;
                        display: flex;
                        align-items: center;
                        padding-right: 1%;
                        justify-content: end;
                        font-weight: bold;
                        line-height: 1.2;
                        margin-bottom: 0px;
                      "
                    >
                      Enhanced Fine Line Suppression,<br />
                      (0:off, 1:on):
                    </label>
                    <!-- <v-select
                  label="CVI Collect All Available Echoes:"
                  v-model="settings.cviCollectAllEchos"
                  :items="cviEchoOptions"
                /> -->
                    <input
                      value="1.00"
                      style="background-color: white; color: black; width: 20%; padding-left: 10px"
                      disabled
                    />
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >0.0</label
                    >
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >1.0</label
                    >
                  </div>
                </div>

                <div style="margin-bottom: 10px">
                  <div style="display: flex; justify-content: center; flex-direction: row">
                    <label
                      class="label-size"
                      style="width: 20%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >CV29</label
                    >
                    <label
                      class="label-size"
                      style="
                        text-align: end;
                        width: 40%;
                        display: flex;
                        align-items: center;
                        padding-right: 1%;
                        justify-content: end;
                        font-weight: bold;
                      "
                      >SAR Optimization: 0=OFF, 1=ON</label
                    >
                    <!-- <v-select
                  label="CVI Collect All Available Echoes:"
                  v-model="settings.cviCollectAllEchos"
                  :items="cviEchoOptions"
                /> -->
                    <input
                      value="1.00"
                      style="background-color: white; color: black; width: 20%; padding-left: 10px"
                      disabled
                    />
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >0.0</label
                    >
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >1.0</label
                    >
                  </div>
                </div>

                <div style="margin-bottom: 10px">
                  <div style="display: flex; justify-content: center; flex-direction: row">
                    <label
                      class="label-size"
                      style="width: 20%; display: flex; align-items: center; justify-content: center; font-weight: bold"
                      >CV40</label
                    >
                    <label
                      class="label-size"
                      style="
                        text-align: end;
                        width: 40%;
                        display: flex;
                        align-items: center;
                        padding-right: 1%;
                        justify-content: end;
                        font-weight: bold;
                      "
                      >PURE compensation:</label
                    >
                    <!-- <v-select
                  label="CVI Collect All Available Echoes:"
                  v-model="settings.cviCollectAllEchos"
                  :items="cviEchoOptions"
                /> -->
                    <input
                      value="0.00"
                      style="background-color: white; color: black; width: 20%; padding-left: 10px"
                      disabled
                    />
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >-100.0</label
                    >
                    <label
                      class="label-size"
                      style="width: 10%; display: flex; align-items: center; justify-content: center"
                      >100.0</label
                    >
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; align-items: center">
                  <div style="width: 60%">
                    <div class="autotr-content">
                      <p>
                        <b>TR Range for Auto TR</b>
                      </p>
                      <div class="autotr-text">
                        <label>Minimum TR</label>
                        <input v-model.number="minConcatAcqPackage" disabled />
                      </div>
                      <div class="autotr-text">
                        <label>Maximum TR</label>
                        <input v-model.number="minSeqTr" disabled />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script>
import GESelectionButtonWithInput from './GESelectionButtonWithInput.vue'
import { mapGetters, mapActions, mapState } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import _ from 'lodash'
import TranslatedContent from '@/components/TranslatedContent'

export default {
  mixins: [SelectionConfigMixin],
  name: 'GEThreePlainLocBeSideBarTabs',
  components: {
    TranslatedContent,
    GESelectionButtonWithInput,
  },
  data() {
    return {
      activeTab: 'details', // Default active tab
      tabs: [
        { id: 'details', label: 'Details', content: 'Content for Tab 1' },
        { id: 'diffusion', label: 'Diffusion', content: 'Content for Tab 2' },
        { id: 'acceleration', label: 'Acceleration', content: 'Content for Tab 3' },
        { id: 'advanced', label: 'Advanced', content: 'Content for Tab 4' },
      ],
      settings: {
        cviCollectAllEchos: '',
        minValue: 1.0, // Assuming a default value from the image
        maxValue: 1.0, // Assuming a default value from the image
      },
      cviEchoOptions: ['OFF', 'ON'],
      selectedShim: 'Auto',
      shimOptions: [
        { text: 'Auto', value: 'Auto', disabled: false },
        { text: 'On', value: 'On', disabled: true },
        { text: 'Off', value: 'Off', disabled: true },
      ],
      selectedRfDriveMode: 'Quadrature (CP)',
      RfDriveModeOptions: [
        { text: 'Quadrature (CP)', value: 'Quadrature (CP)', disabled: false },
        { text: 'Preset', value: 'Preset', disabled: true },
        { text: 'Optimized', value: 'Optimized', disabled: true },
      ],
      ExcitationMode: 'Selective',
      ExcitationModeOptions: [
        { text: 'Selective', value: 'Selective', disabled: false },
        { text: 'Focus', value: 'Focus', disabled: true },
      ],
      intensityFilter: 'None',
      intensityFilterOptions: [
        { text: 'None', value: 'None', disabled: false },
        { text: 'A - Little sharpening,some smoothing', value: 'A - Little sharpening,some smoothing', disabled: true },
        { text: 'B - High sharpening,some smoothing', value: 'B - High sharpening,some smoothing', disabled: true },
        { text: 'C - Little sharpening,high smoothing', value: 'C - Little sharpening,high smoothing', disabled: true },
        { text: 'D - High sharpening,high smoothing', value: 'D - High sharpening,high smoothing', disabled: true },
        { text: 'E - MR Angio filter', value: 'E - MR Angio filter', disabled: true },
        { text: 'F - some sharpening,noise reduction', value: 'F - some sharpening,noise reduction', disabled: true },
        { text: 'G - Noise reduction', value: 'G - Noise reduction', disabled: true },
      ],
      recomDlStrength: 'Off',
      recomDlStrengthOptions: [
        { text: 'Off', value: 'Off', disabled: false },
        { text: 'Low', value: 'Low', disabled: true },
        { text: 'Medium', value: 'Medium', disabled: true },
        { text: 'High', value: 'High', disabled: true },
      ],
      TENumbers: 1,
      bandWidth: 90.91,
      diffusionDirectionOptions: [
        { text: 'ALL', value: 'ALL', disabled: false },
        { text: 'SLICE', value: 'SLICE', disabled: true },
        { text: '3in1', value: '3in1', disabled: true },
        { text: 'TETRA', value: 'TETRA', disabled: true },
        { text: 'TENSOR', value: 'TENSOR', disabled: true },
      ],
      intensityCorrection: 'None',
      intensityCorrectionOptions: [
        { text: 'None', value: 'None', disabled: false },
        { text: 'PURE', value: 'PURE', disabled: true },
        { text: 'SCENIC', value: 'SCENIC', disabled: true },
      ],
      flowCompDirection: 'Frequency',
      flowCompDirectionOptions: [
        { text: 'Frequency', value: 'Frequency', disabled: false },
        { text: 'Slice', value: 'Slice', disabled: true },
      ],
      calibrationInPrescan: 'On',
      calibrationInPrescanOptions: [
        { text: 'On', value: 'On', disabled: false },
        { text: 'Off', value: 'Off', disabled: true },
      ],
    }
  },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
    sequenceType: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapGetters('cohortService', ['isChallengeModeEnabledForMe']),
    ...mapGetters('testRunService', ['isTakingTest']),
    ...mapGetters('selectionConfig', ['selectionConfigsIdentTypeNames', 'isSingleSliceMode']),
    ...mapGetters('dicomService', [
      'isContrastLab',
      'availableSequenceTypes',
      'availableFieldStrengths',
      'isFatSatAvailable',
      'isResolutionLab',
    ]),
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'answersSelections',
      'stackQuestionsLength',
      'selectedStackQuestionIndexVisual',
      'scanSubmitted',
      'testResultAugmented',
      'answerCurrent',
      'scanSubmittedByStackQuestionId',
    ]),
    ...mapState('selectionConfig', ['selectionConfigsByIdent', 'selectionConfigCurrentIdent', 'isAddLocalizerMode']),
    ...mapState('questionService', [
      'questionSet',
      'isSelectedTab',
      'answerSelectionId',
      'hasAnsweredAllStackQuestions',
      'isEditingQuestion',
    ]),
    ...mapState('dicomService', [
      'dicomFileSet',
      'isLoaded',
      'progressFetch',
      'progressParse',
      'progressTotal',
      'allowPageReloadWithoutConfirmation',
    ]),
    ...mapGetters('user', ['languageCode']),
    selectionConfig() {
      return this.selectionConfigsByIdent[this.selectionConfigCurrentIdent]
    },
    parallelFactorValue: {
      get() {
        return this.parallelFactor === 'Off' ? 2.0 : this.parallelFactor
      },
      set(val) {
        this.parallelFactor = val
      },
    },
  },
  methods: {
    ...mapActions('selectionConfig', [
      'setSelectionConfigCurrentIdent',
      'copyCurMinSelectionConfigIntoProposed',
      'smartRotateSelectionConfigDir',
    ]),
    ...mapActions('questionService', [
      'selectNextQuestion',
      'setAnswerSelectionId',
      'selectPrevQuestion',
      'proceedToTakingPostQuestions',
      'questionTabOpen',
    ]),
    setActiveTab(tabId) {
      this.activeTab = tabId
    },
  },
  watch: {
    sequenceType: {
      immediate: true,
      handler(newVal, oldVal) {
        if (this.activeTab === 'diffusion' && oldVal === 'DIFF') {
          this.activeTab = 'details'
        }
        this.flowCompDirectionOptions = this.flowCompDirectionOptions.map((opt) => {
          return { ...opt, disabled: newVal !== 'TE' && opt.value === 'Slice' }
        })
      },
    },
  },
}
</script>
<style scoped>
.v-application .primary--text {
  color: #247ba0 !important;
  caret-color: #247ba0 !important;
}
.tabs {
  display: flex;
  border: 1px solid #ddd;
  margin-bottom: 20px;
}

.tab-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  background: #101d4a;
}

.tab-item {
  padding: 10px 15px;
  /* border-bottom: 1px solid #ddd; */
  cursor: pointer;
  border: 1px solid;
  border-radius: 8px;
  border-top-right-radius: 30px;
  font-size: 10px;
  background-color: #2f3d6c;
  font-family: sans-serif;
  padding: 6px 6px 4px 9px;
}

.tab-item.active {
  border-bottom-color: transparent;
  color: black;
  background: #6875a2;
}

.tab-item a {
  text-decoration: none;
  color: #fff;
}

.tab-content {
  /* border: 1px solid #ddd; */
  padding: 1px;
}

.tab-pane {
  display: none; /* Hide all content panes by default */
}

.tab-pane.active {
  display: block; /* Show the active content pane */
}
.row {
  flex-wrap: nowrap !important;
}
::v-deep .v-btn:not(.v-btn--round).v-size--default {
  height: 70px !important;
}
::v-deep .theme--light.v-card {
  background-color: #6875a2 !important;
}

/* additional css */
.v-btn {
  font-size: 11px !important;
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
}

::v-deep .theme--light.v-select .v-select__selections {
  font-size: small;
  margin: 3px 2px 0px 8px;
}
::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin-top: 1px !important;
}
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}

.text-input {
  max-width: 38%;
  width: 38%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
}

.label-size {
  width: 50%;
  display: flex;
  justify-content: right;
  margin: 0;
}

::v-deep .v-text-field__details {
  display: none;
}

[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

.v-input--is-focused {
  display: block !important;
}

label,
span {
  font-size: 70%;
}

.text-2 {
  display: flex;
  justify-content: flex-start;
  width: 50%;
  margin-left: 2%;
}

.text-1 {
  display: flex;
  justify-content: end;
  align-items: center;
  margin-bottom: 10px;
}

.input-normal {
  width: 100%;
  border-radius: 5px;
  background-color: white;
  color: black;
  padding: 5px 0px 5px 10px;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}

.text-3 {
  display: flex;
  justify-content: end;
  align-items: flex-start;
}

::v-deep .v-input__icon {
  height: 10px !important;
}

::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
  padding: 0px !important;
}

::v-deep.v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-text-field.v-text-field--enclosed .v-text-field__details {
  margin-bottom: 0px;
}

::v-deep .v-text-field {
  padding-top: 0px !important;
  margin-top: 0px !important;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0px;
  width: 100% !important;
  height: 30px;
}

::v-deep .v-icon.v-icon {
  color: white !important;
  font-size: 17px;
}

.v-input {
  border-radius: 0px;
}

::v-deep .v-text-field input {
  padding: 0px;
}

.btn-2 {
  width: 20px !important;
  height: 15px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #423c3c !important;
  margin: 0.15rem;
  border-radius: 0px;
}

.btn-3 {
  width: 35px !important;
  height: 20px !important;
  background: #423c3c !important;
  border-radius: 0px;
}

.btn-4 {
  display: flex;
  justify-content: flex-end;
  background: #383535 !important;
  padding: 0px 4px !important;
  width: 80px !important;
  height: 16px !important;
  box-shadow: none;
  border-radius: 0px;
  border: none !important;
  font-size: 10px !important;
  font-weight: inherit !important;
  text-transform: inherit !important;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: 0px !important;
}

.main-1 {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.main-2 {
  width: 50%;
  color: black !important;
}

.btn-1 {
  display: flex;
  width: 66.75%;
  justify-content: space-between;
}

.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
}

.v-sheet.v-card {
  border-radius: 0px;
}

.acceleration-tab {
  display: flex;
  width: 100%;
  margin: 0px;
}

.diffusion-tab {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0px;
}

::v-deep .v-input__slot fieldset {
  background: #cacbec;
  border-color: #cacbec !important;

  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

::v-deep .v-text-field__slot {
  background: #cacbec;
  border-color: #cacbec;
  border-radius: 0px;
  border: 1px solid #cacbec !important;
  height: 25px !important;
  border-bottom: none;
  border-radius: 4px;
}

::v-deep .text-input {
  max-width: 38%;
  width: 38%;
  margin-left: 2%;
  background: #cacbec;
  border-radius: 0px !important;
  border: 1px solid #cacbec !important;
  height: 1.11rem !important;
  border-bottom: none;
}
::v-deep .v-icon.v-icon {
  color: rgb(66, 60, 60) !important;
  font-size: 22px;
}
::v-deep .v-card__text {
  display: flex;
}
.custom-table table {
  width: 100%;
  border-collapse: collapse;
}
.custom-table tbody {
  font-size: 11px;
  text-align: right;
}
.custom-table th,
.custom-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
::v-deep .theme--light.v-input input {
  color: black !important;
  text-align: start !important;
}

.custom-table th {
  background-color: #f2f2f2;
}
.equal-grid-row {
  width: 11rem;
}
.theme--light.v-label {
  color: black !important;
}

::v-deep .v-input__append-inner {
  margin-top: 12px !important;
}

.autotr-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  p {
    color: black;
    margin: 0px;
    font-size: 12px;
  }

  .autotr-text {
    display: flex;
    justify-content: flex-end;
    flex-direction: row;
    padding-bottom: 5px;

    label {
      display: flex;
      align-items: center;
      padding-right: 1%;
      justify-content: end;
      font-weight: bold;
      margin: 0px 10px 0px 0px;
      font-size: 11px;
    }

    input {
      width: 32%;
      border-radius: 5px;
      background-color: white;
      color: black;
      padding: 5px 0px 5px 10px;
    }
  }
}

.diffusion-table {
  z-index: 1;
  padding: 17px 4px 10px 4px;
  width: 40%;

  thead {
    display: flex;

    th {
      font-weight: 500;
      padding: 1px 0px 1px 0px;
      box-shadow: inset 1px 1px 2px #070729, /* light top-left bevel */ inset -1px -1px 2px #ffffff; /* dark bottom-right bevel */
    }
  }

  .series-body {
    box-shadow: inset 1px 1px 2px #070729, /* light top-left bevel */ inset -1px -1px 2px #ffffff; /* dark bottom-right bevel */
    max-height: 150px;
    min-height: 150px;
    overflow-y: scroll;
    background-color: #c7cee1;

    tr {
      cursor: default;
    }

    td {
      padding-top: 3px;
    }
  }

  .series-buttons {
    button {
      background-color: #8b96bd;
      box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #070729; /* dark bottom-right bevel */
      padding: 4px 10px 4px 10px;
      margin: 8px 3px 0px 3px;
      border-radius: 5px;
    }
  }
}

.diffusion-middle {
  height: 20%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 10px;
}

.diffusion-bottom {
  display: flex;
  justify-content: center;

  label {
    width: 82px;
  }

  .text-2 {
    width: 13px;
  }
}

@media (min-width: 1559px) {
  .te-range-content {
    width: 50%;
    display: flex;
    align-items: start;
    flex-direction: column;
    margin: 0px;

    label {
      width: 100%;
    }
  }
}

@media (max-width: 1558px) and (min-width: 1500px) {
  .te-range-content {
    display: flex;
    justify-content: space-between;
    margin: 0px;

    label {
      width: auto;
    }
  }
}
</style>
