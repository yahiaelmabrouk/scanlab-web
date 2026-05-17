<template>
  <div>
    <v-dialog v-model="showConfirmDialog" persistent width="700px">
      <v-card class="change-dialog">
        <v-card-title class="headline">
          {{ $t('global.notification', languageCode) }}
        </v-card-title>

        <v-card-text>
          <div class="mb-4">{{ $t('SelectionConfigForm.your_last_change', languageCode) }}</div>

          <!-- Changes grouped by source parameter -->
          <div class="changes-container">
            <div v-for="(group, sourceParam) in groupedChanges" :key="sourceParam" class="change-group">
              <div class="change-group-title">{{ sourceParam }}</div>

              <!-- Source parameter change -->
              <div v-if="group.sourceChange.oldValue !== group.sourceChange.newValue" class="change-row">
                <span class="old-value">{{ formatValue(group.sourceChange.oldValue) }}</span>
                <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                <span class="new-value">{{ formatValue(group.sourceChange.newValue) }}</span>
              </div>

              <!-- Affected parameter changes -->
              <div v-for="(affected, idx) in group.affectedChanges" :key="idx" class="affected-change">
                <div class="affected-label">Will update {{ affected.label }}:</div>
                <div class="change-row">
                  <span class="old-value">{{ formatValue(affected.oldValue) }}</span>
                  <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                  <span class="new-value">{{ formatValue(affected.newValue) }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="cancelChange">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="success" @click="confirmChange" :class="{ 'active-confirm-button': isDialogKeyboardReady }">
            {{ $t('global.okay', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showConfirmDialog" persistent width="40%">
      <v-card class="initial-dialog">
        <v-card-title class="headline">
          {{ $t('global.notification', languageCode) }}
        </v-card-title>
        <v-card-text>
          <div>{{ $t('SelectionConfigForm.your_last_change', languageCode) }}</div>
          <div v-if="vendorStylePreference === 'philips'">
            <div class="mt-2" v-if="changeFromOldValue !== changeFromNewValue">
              <p>Packages</p>
              {{ `${changeFromOldValue}---->${changeFromNewValue}` }}
            </div>
          </div>
          <div v-else>
            <div class="mt-2" v-if="changeFromOldValue !== changeFromNewValue">
              <p>{{ changeFromLabel }}</p>
              {{ `${changeFromOldValue}---->${changeFromNewValue}` }}
            </div>
          </div>
          <div class="mt-2">
            {{ $t('SelectionConfigForm.adapt_parameters', languageCode) }}
          </div>
          <div class="mt-2" v-if="changeToOldValue !== changeToNewValue">
            <p>{{ changeToLabel }}</p>
            {{ `${changeToOldValue}---->${changeToNewValue}` }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="cancelChange">{{ $t('global.cancel', languageCode) }}</v-btn>
          <v-btn color="success" @click="confirmChange" :class="{ 'active-confirm-button': isDialogKeyboardReady }">{{ $t('global.okay', languageCode) }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-card color="#6875a2" width="100%" height="100%">
      <v-card-text v-if="!isCanvasActiveFlag">
        <div class="main-2">
          <div class="simba-row">
            <div class="simba-col"><label>Scan Plane:</label></div>
            <div class="simba-col">
              <v-select value="3-Plane" items="3-Plane" @change="handleResetSelection" color="#423c3c" dense outlined />
            </div>
          </div>
          <div class="simba-row">
            <div class="simba-col"><label>Freq.FoV:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model.number="dimensions3yFor3DPlane"
                :type="'number'"
                :step="1"
                :min="1"
                :max="500"
                @input="submitDimensions3y"
                :disabled="complete || isAddLocalizerMode"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>
          <div class="simba-row">
            <div class="simba-col"><label>Phase FOV:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model.number="dimensions3x"
                :type="'number'"
                :step="1"
                :min="1"
                :max="500"
                @input="submitDimensions3x"
                :disabled="complete || isAddLocalizerMode"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>
          <div class="simba-row">
            <div class="simba-col"><label>No Phase Wrap:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model.number="oversamplingPercentageFor3DPlane"
                :type="'number'"
                :step="1"
                :min="0"
                :max="100"
                @input="submitOversampling"
                :disabled="complete || isAddLocalizerMode"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>
          <div class="simba-row">
            <div class="simba-col"><label>Slice Thickness:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model.number="thicknessFor3DPlane"
                :type="'number'"
                :step="0.1"
                :min="0.6"
                :max="20"
                @input="submitThickness"
                :disabled="complete"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>

          <div class="text-3 equal-grid-row" style="height: 9%">
            <div style="margin-right: 2.5rem">
              <v-label class="label-size" style="margin-bottom: 1.5rem">&ThinSpace;&ThinSpace;&ThinSpace;</v-label>
            </div>
            <span class="equal-grid-item">S/I</span>
            <span class="equal-grid-item">R/L</span>
            <span class="equal-grid-item">A/P</span>
          </div>
          <div class="text-3 equal-grid-row" style="height: 9%">
            <div style="margin-right: 0.5rem; margin-left: 2rem">
              <v-label class="label-size" style="margin-bottom: 1.5rem">Center:</v-label>
            </div>
            <v-text-field
              type="number"
              v-model="SLCenter"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
            ></v-text-field>

            <v-text-field
              type="number"
              v-model="RLCenter"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
            ></v-text-field>

            <v-text-field
              type="number"
              v-model="APCenter"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
            ></v-text-field>
          </div>
          <div class="text-3 equal-grid-row" style="height: 9%">
            <div style="margin-right: 0.5rem; margin-left: 1.6rem">
              <v-label class="label-size" style="margin-bottom: 1.5rem">Spacing:</v-label>
            </div>
            <v-text-field
              type="number"
              v-model="SLSpacing"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
            ></v-text-field>

            <v-text-field
              type="number"
              v-model="RLSpacing"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
            ></v-text-field>

            <v-text-field
              type="number"
              v-model="APSpacing"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
            ></v-text-field>
          </div>
          <div class="text-3 equal-grid-row ml-4" style="height: 9%">
            <div style="margin-right: 0.5rem; margin-left: 0.8rem">
              <v-label class="label-size">#Slices:</v-label>
            </div>
            <v-text-field
              type="number"
              v-model="SLSlices"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
            ></v-text-field>

            <v-text-field
              type="number"
              v-model="RLSlices"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
            ></v-text-field>

            <v-text-field
              type="number"
              v-model="APSlices"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
            ></v-text-field>
          </div>

          <div class="simba-row">
            <div class="simba-col"><label>Chem SET:</label></div>
            <div class="simba-col">
              <v-select
                v-model="chemSet"
                :items="chemSetOptions"
                :disabled="isAddLocalizerMode"
                color="#423c3c"
                dense
                outlined
              />
            </div>
          </div>

          <div class="simba-row" style="width: 4rem; display: flex; align-items: end">
            <input type="checkbox" id="gap" class="checkboxInner" v-model="contrast" />
            <v-label>Contrast:</v-label>
          </div>
        </div>

        <div class="main-2">
          <div class="simba-row">
            <div class="simba-col"><label>Freq.Dir:</label></div>
            <div class="simba-col">
              <v-select
                v-model="freqDir"
                :items="freqDirOptions"
                :disabled="isAddLocalizerMode"
                color="#423c3c"
                dense
                outlined
              />
            </div>
          </div>

          <div class="simba-row">
            <div class="simba-col"><label>Locs Before</label><label>Pause:</label></div>
            <div class="simba-col">
              <v-select
                v-model="locsBeforePause"
                :items="locsBeforePauseOptions"
                :disabled="isAddLocalizerMode"
                color="#423c3c"
                dense
                outlined
              />
            </div>
          </div>

          <div class="simba-row">
            <div class="simba-col"><label class="label-size">TR:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model.number="TRFor3DPlane"
                :type="'number'"
                :step="0.5"
                :min="0"
                :max="50000"
                :disabled="complete"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>

          <div class="simba-row">
            <div class="simba-col"><label>Breath Hold:</label></div>
            <div class="simba-col">
              <v-select
                v-model="breathHold"
                :items="breathHoldOptions"
                :disabled="isAddLocalizerMode"
                color="#423c3c"
                dense
                outlined
              />
            </div>
          </div>

          <table style="width: 100%; height: 50%; margin-top: 15px; font-size: 12px">
            <tbody>
              <tr v-for="(header, index) in headers" :key="index">
                <th style="text-align: right">{{ header.text }}</th>
                <td style="text-align: right">{{ header.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
      <v-card-text v-else class="canvas-active">
        <div class="main-2">
          <div class="simba-row">
            <div class="simba-col"><label>Scan Plane:</label></div>
            <div class="simba-col">
              <v-select
                v-model="scanPlane"
                :items="scanPlaneOptions"
                @change="handleResetSelection"
                color="#423c3c"
                dense
                outlined
              />
            </div>
          </div>
          <div class="simba-row">
            <div class="simba-col"><label>Freq.FoV:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model="dimensions3y"
                :type="'number'"
                :step="1"
                :min="1"
                :max="500"
                @input="submitDimensions3y"
                :disabled="complete || isAddLocalizerMode"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>
          <div class="simba-row">
            <div class="simba-col"><label>Phase FOV:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model="dimensions3x"
                :type="'number'"
                :step="1"
                :min="1"
                :max="500"
                @input="submitDimensions3x"
                :disabled="complete || isAddLocalizerMode"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>
          <div class="simba-row">
            <div class="simba-col"><label>No Phase Wrap:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model="oversamplingPercentage"
                :type="'number'"
                :step="1"
                :min="0"
                :max="100"
                @input="submitOversampling"
                :disabled="complete || isAddLocalizerMode"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>
          <div class="simba-row">
            <div class="simba-col"><label>Slice Thickness:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model="thickness"
                :type="'number'"
                :step="0.1"
                :min="0.6"
                :max="20"
                @input="submitThickness"
                :disabled="complete"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>

          <div class="simba-row">
            <div class="simba-col"><label>Spacing:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model="spacing"
                :type="'number'"
                :step="0.1"
                :min="0"
                :max="50"
                @input="submitSpacing"
                :disabled="complete"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>

          <div class="text-3 equal-grid-row" style="height: 4.5%">
            <div style="margin-right: 2.5rem">
              <v-label class="label-size" style="margin-bottom: 1.5rem">&ThinSpace;&ThinSpace;&ThinSpace;</v-label>
            </div>
            <span class="equal-grid-item">R/L</span>
            <span class="equal-grid-item">A/P</span>
            <span class="equal-grid-item">S/I</span>
          </div>
          <div class="text-3 equal-grid-row" style="height: 9%">
            <div style="margin-right: 0.5rem; margin-left: 1.6rem">
              <v-label class="label-size" style="margin-bottom: 1.5rem">Start:</v-label>
            </div>
            <v-text-field
              type="text"
              v-model="RLSpacing1"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
              disabled
            ></v-text-field>

            <v-text-field
              type="text"
              v-model="APSpacing1"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
              disabled
            ></v-text-field>

            <v-text-field
              type="text"
              v-model="SLSpacing1"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
              disabled
            ></v-text-field>
          </div>
          <div class="text-3 equal-grid-row ml-4" style="height: 9%">
            <div style="margin-right: 0.5rem; margin-left: 0.8rem">
              <v-label class="label-size">End:</v-label>
            </div>
            <v-text-field
              type="text"
              v-model="RLSlices1"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
              disabled
            ></v-text-field>

            <v-text-field
              type="text"
              v-model="APSlices1"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
              disabled
            ></v-text-field>

            <v-text-field
              type="text"
              v-model="SLSlices1"
              class="textbox-input equal-grid-item"
              :style="{ color: textColorText }"
              disabled
            ></v-text-field>
          </div>

          <div class="simba-row">
            <div class="simba-col"><label>Chem SET:</label></div>
            <div class="simba-col">
              <v-select
                v-model="chemSet"
                :items="chemSetOptions"
                :disabled="isAddLocalizerMode"
                color="#423c3c"
                dense
                outlined
              />
            </div>
          </div>
          <div
            v-if="satConcats && satConcats.length && satConcats[0] !== ''"
            class="simba-row"
            style="height: 4.5% !important"
          >
            <div class="simba-col"><label>Sat:</label></div>
            <div class="simba-col">
              <label v-for="(sat, idx) in satConcats" :key="idx" style="margin-right: 0.5rem">
                {{ sat }}
              </label>
            </div>
          </div>

          <div class="simba-row" style="width: 4rem; display: flex; align-items: end">
            <input type="checkbox" id="gap" class="checkboxInner" v-model="contrast" />
            <v-label>Contrast:</v-label>
          </div>
        </div>

        <div class="main-2">
          <div class="simba-row">
            <div class="simba-col"><label>Freq.Dir:</label></div>
            <div class="simba-col">
              <v-select
                v-model="filteredFreqDir"
                :items="filteredFreqDirOptions"
                :disabled="isAddLocalizerMode"
                @change="onSwapPhase"
                color="#423c3c"
                dense
                outlined
              />
            </div>
          </div>
          <div class="simba-row">
            <div class="simba-col"><label>Fat Shift Dir:</label></div>
            <div class="simba-col">
              <v-select
                v-model="fatShift"
                :items="fatShiftOptions"
                item-text="text"
                item-value="value"
                item-disabled="disabled"
                color="#423c3c"
                dense
                outlined
              />
            </div>
          </div>
          <div class="simba-row">
            <div class="simba-col"><label>Auto TR:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                :value="repetitionTime"
                :type="'number'"
                :step="1"
                :min="1"
                :max="20000"
                @input="changeRepetitionTime"
                :disabled="complete || isAddLocalizerMode"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>

          <div class="simba-row">
            <div class="simba-col"><label># Slices:</label></div>
            <div class="simba-col">
              <GESelectionButtonWithInput
                v-model.number="numberOfSlices"
                :type="'number'"
                :step="1"
                :min="1"
                :max="300"
                @input="submitNumberOfSlices"
                :disabled="complete"
                :hasIncreaseButton="true"
                :hasSelectionButton="false"
              />
            </div>
          </div>

          <table style="width: 100%; height: 50%; margin-top: 15px; font-size: 12px">
            <tbody>
              <tr>
                <th style="text-align: right">Total # Slices</th>
                <td style="text-align: right">{{ 13 }}</td>
              </tr>
              <tr>
                <th style="text-align: right">Max # Slices</th>
                <td style="text-align: right">{{ 7 }}</td>
              </tr>
              <tr>
                <th style="text-align: right"># of Acqs</th>
                <td style="text-align: right">{{ concatenations }}</td>
              </tr>
              <tr>
                <th style="text-align: right">Rel. SNR(%)</th>
                <td style="text-align: right">{{ 100 }}</td>
              </tr>
              <tr>
                <th style="text-align: right">Acq Voxel Size</th>
                <td style="text-align: right">{{ trueResolutionHeaderUltra }}</td>
              </tr>
              <tr>
                <th style="text-align: right">BW/Pixel</th>
                <td style="text-align: right">{{ 438.6 }}</td>
              </tr>
              <tr>
                <th style="text-align: right">Echo Spacing</th>
                <td style="text-align: right">{{ echoSpacing }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin.js'
import { MriMixin } from '../../Mixins/MriMixin.js'
import GEDropDownText from './GEDropDownText.vue'
import GESelectionButtonWithInput from './GESelectionButtonWithInput.vue'

export default {
  mixins: [MriMixin, SelectionConfigMixin],
  components: { GEDropDownText, GESelectionButtonWithInput },
  data() {
    return {
      dimensions3yFor3DPlane: 50,
      oversamplingPercentageFor3DPlane: 1,
      thicknessFor3DPlane: 10,
      TRFor3DPlane: 1000,
      autoTR: 550,
      scanPlane: 'Oblique',
      scanPlaneOptions: [
        { text: 'Oblique', value: 'Oblique' },
        { text: 'Axial', value: 'Axial' },
        { text: 'Coronal', value: 'Coronal' },
        { text: 'Sagittal', value: 'Sagittal' },
      ],
      isScanPlaneChanged: false,
      fatShift: 'Normal (P)',
      fatShiftOptions: [
        { text: 'Normal (P)', value: 'Normal (P)' },
        { text: 'Reversed (A)', value: 'Reversed (A)', disabled: true },
      ],
      SLCenter: 0.0,
      RLCenter: 0.0,
      APCenter: 30.0,
      SLSpacing: 25.0,
      RLSpacing: 2.0,
      APSpacing: 5.0,
      SLSpacing1: 'S44.9',
      RLSpacing1: 'L32.4',
      APSpacing1: 'P60.1',
      SLSlices: 5,
      RLSlices: 8,
      APSlices: 8,
      SLSlices1: 'S44.9',
      RLSlices1: 'R20.4',
      APSlices1: 'P60.5',
      chemSet: 'None',
      chemSetOptions: [
        { text: 'None', value: 'None', disabled: false },
        { text: 'Fat', value: 'Fat', disabled: false },
        { text: 'Fat Classic', value: 'Fat Classic', disabled: false },
        { text: 'Water', value: 'Water', disabled: true },
      ],

      contrast: false,
      freqDir: 'A/P',
      freqDirOptions: ['A/P', 'R/L', 'S/I'],
      locsBeforePause: 5,
      locsBeforePauseOptions: [5, 10, 15],
      locsBeforePause1: 0,
      locsBeforePauseOptions1: [0, 10, 15],
      breathHold: 'None',
      breathHoldOptions: ['Yes', 'None'],
      breathHold1: 13,
      breathHoldOptions1: [13, 14],
      headers: [
        { text: 'Total # Slices', value: 21 },
        { text: 'Max # Slices', value: 512 },
        { text: '# of Acqs', value: 21 },
        { text: 'Rel. SNR(%)', value: 100 },
        { text: 'Acq Voxel Size', value: '1.6x2.8x10.0' },
        { text: 'BW/Pixel', value: 568.2 },
        { text: 'Echo Spacing', value: 3.8 },
      ],
      typeIndex: null,
      filteredFreqDir: 'A/P',
      filteredFreqDirOptions: ['A/P', 'R/L', 'S/I'],
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
    ...mapState('scanTimeConfig', [
      'APFOV',
      'RLFOV',
      'FHFOV',
      'APVoxel',
      'RLVoxel',
      'FHVoxel', // Need checking!!!!
      'APMatrix',
      'RLMatrix',
      'FHMatrix',
      'defaultTxt',
      'NSA',
      'isCheckedGap',
      'isCheckedFS',
      'textColorText',
    ]),
    ...mapGetters('user', ['languageCode']),
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
    handleResetSelection() {
      const idx = this.scanPlaneOptions.findIndex((opt) => opt.value === this.scanPlane)
      this.typeIndex = idx <= 1 ? 0 : idx - 1
      this.resetSelection({ index: this.typeIndex, dirOnly: true })
      this.isScanPlaneChanged = true
    },
  },
  watch: {
    chemSet1(newValue) {
      this.fatSuppression = newValue === 'Fat'
    },
    selectedStackQuestionIndexVisual: {
      handler(newValue) {
        let type = this.stackQuestions[newValue - 1].questionText?.split(' ')[2].toLowerCase()
        switch (type) {
          case 'axial':
            this.typeIndex = 0
            break
          case 'coronal':
            this.typeIndex = 1
            break
          case 'sag':
            this.typeIndex = 2
            break
          default:
            this.typeIndex = 0
            break
        }
        this.isScanPlaneChanged = false
      },
      immediate: true,
    },
    typeIndex: {
      handler(newValue) {
        this.filteredFreqDirOptions = this.freqDirOptions.filter((_, idx) => idx !== (newValue + 2) % 3)
        if (this.isScanPlaneChanged && newValue === 2) {
          this.filteredFreqDir = this.filteredFreqDirOptions[1]
        } else {
          this.filteredFreqDir = this.filteredFreqDirOptions[0]
        }
      },
      immediate: true,
    },
  },
  mounted() {
    if (this.minConcatAcqPackage > this.repetitionTime) {
      if (this.selectionConfig?.sequenceType === 'TE') {
        this.concatenations = _.round(
          ((this.echoSpacing + 5) * (this.echoTrainLength ? this.echoTrainLength : 1) * this.numberOfSlices) /
            this.repetitionTime
        )
      } else if (this.selectionConfig?.sequenceType === 'SE') {
        this.concatenations = _.round(((this.echoSpacing + 5) * this.numberOfSlices) / this.repetitionTime)
        if (this.concatenations <= 1) {
          this.concatenations = 2
        }
      }
    }

    const INITIAL_LOADING_DURATION = 7000 // 7 seconds, adjust as needed
    setTimeout(() => {
      console.log('initial loading phase over')
      this.isInitialLoadingPhase = false
    }, INITIAL_LOADING_DURATION)
  },
}
</script>

<style scoped>
.v-btn {
  font-size: 11px !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
}

::v-deep .theme--light.v-select .v-select__selections {
  color: black !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

::v-deep .v-card__text {
  padding: 10px;
  height: 100%;
}

::v-deep .theme--light.v-input input {
  color: black !important;
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
  width: 40%;
  display: flex;
  justify-content: right;
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
  padding: 0 0 0 8px;
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
}

.text-1 {
  display: flex;
  justify-content: space-between;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}

.text-3 {
  display: flex;
  justify-content: space-around;
}

::v-deep .v-input__icon {
  height: 10px !important;
}

::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
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

::v-deep .v-text-field__slot {
  background: #383535;
  border-color: #383535;
  border-radius: 0px;
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
  border-radius: 4px;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0px;
}

::v-deep .v-icon.v-icon {
  color: white !important;
  font-size: 17px;
}

.v-input {
  border-radius: 0px;
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
  bottom: 8px !important;
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
::v-deep .v-input__slot fieldset {
  background: #cacbec;
  border-color: #cacbec !important;

  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
::v-deep .v-text-field__slot {
  background: #cacbec !important;
  border-color: #cacbec !important;
  border-radius: 0px;
  border: 1px solid #cacbec !important;
  height: 1rem !important;
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
.canvas-active {
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

.custom-table th {
  background-color: #f2f2f2;
}
.equal-grid-row {
  /* width: 11rem; */
  gap: 0.2rem;
}
.theme--light.v-label {
  color: black !important;
  margin-bottom: 0rem !important;
  margin-left: 0.2rem;
}
.simba-row {
  display: flex;
  align-items: end; /* Ensures vertical alignment */
  justify-content: flex-end; /* Aligns items to the left */
  width: 100%;
  height: 9%;
}

.simba-col {
  display: flex;
  align-items: center;
}

.simba-col:first-child {
  width: 45%; /* Label takes 40% */
  justify-content: flex-end; /* Align text to the right */
  padding-right: 3px; /* Adjust spacing */
  height: 100%;
}

.simba-col:last-child {
  width: 55%; /* Select box takes 60% */
  height: 100%;
}

::v-deep .v-text-field input {
  line-height: 25px !important;
  padding: 0px;
  text-align: start !important;
}
::v-deep .v-text-field__slot {
  height: 100% !important;
  border-top-left-radius: 4px !important;
  border-bottom-left-radius: 0 !important;
  border-top-right-radius: 4px !important; /* Adjust radius as needed */
  border-bottom-right-radius: 0 !important; /* Adjust radius as needed */
}

::v-deep .v-input.textbox-input.v-input--is-disabled .v-text-field__slot {
  background-color: #6875a2 !important; /* light gray background */
  border-color: #2b3767 !important;
}

::v-deep .v-text-field[data-v-5588b264] input {
  margin-left: 10px;
}

::v-deep .v-input__append-inner {
  margin-top: 12px !important;
}

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #F2A14A !important;
}
</style>
