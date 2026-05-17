<template>
  <div
    style="
      box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
      height: 100%;
    "
  >
    <v-tabs v-model="currentTab" style="height: 8%">
      <v-tab :to="null" replace>Tasks</v-tab>
      <v-tab :to="null" replace>Series Data</v-tab>
    </v-tabs>
    <v-tabs-items v-model="currentTab" style="height: 82%">
      <v-tab-item style="height: 100% !important">
        <v-card>
          <div style="display: block; height: 75%">
            <div class="stripped-table">
              <table style="width: 100%">
                <thead>
                  <tr>
                    <th
                      v-for="(header, hIdx) in headers"
                      :key="'task-header-' + hIdx"
                      :style="{ width: header.width + '%' }"
                    >
                      {{ header.text }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="tr-disabled">
                    <td></td>
                    <td>Done</td>
                    <td></td>
                    <td>3-Plane Localizer</td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr
                    v-for="(stackQuestion, idx) of stackQuestions"
                    :step="idx + 1"
                    :key="idx"
                    :class="{
                      'active-task': isCurrentQuestion === idx,
                      'tr-disabled': stackQuestion.disabled, // Add this class if disabled
                    }"
                    @click="alertActivateColumn(idx)"
                    @contextmenu.prevent="!stackQuestion.disabled && showContextMenu($event)"
                  >
                    <td>{{ idx + 1 }}</td>
                    <td>
                      <div>
                        {{ stackQuestion.status }}
                      </div>
                    </td>
                    <td></td>
                    <td>
                      {{ stackQuestion.description }}
                    </td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="contextMenuVisible" :style="{ top: `${menuY}px`, left: `${menuX}px` }" class="edit-content">
              <div class="edit-buttons">
                <button class="edit-button" @click="copyAction">Copy</button>
              </div>
              <hr />
              <div class="edit-buttons">
                <button class="edit-button" @click="moveAction(1)" :disabled="isCurrentQuestion === 0">Move Up</button>
                <button
                  class="edit-button"
                  @click="moveAction(2)"
                  :disabled="isCurrentQuestion === stackQuestions.length - 1"
                >
                  Move Down
                </button>
              </div>
            </div>
          </div>
          <v-container fluid fill-height style="background: #6875a2; height: 25%">
            <v-row align="center" justify="space-between" style="height: 50%; position: relative">
              <v-col cols="4">
                <v-btn block class="v-btn-grp" disabled @click="setup">Setup</v-btn>
              </v-col>
              <v-col cols="4">
                <v-btn block class="v-btn-grp" disabled @click="run">Run</v-btn>
              </v-col>
              <v-col cols="4">
                <v-btn block class="v-btn-grp" disabled @click="view">View</v-btn>
              </v-col>
            </v-row>
            <v-row style="height: 50%; margin-top: 0px !important; display: flex; justify-content: center">
              <v-col cols="5">
                <v-btn
                  block
                  class="v-btn-grp"
                  v-if="
                    (isCTLab && isEditingQuestion && !isReconstructionQuestion) || (!isCTLab && !isAddLocalizerMode)
                  "
                  @click="setIsAddLocalizerMode(true)"
                  :disabled="hasAnsweredAllStackQuestions || (isTakingTest && hasAddedLocalizer)"
                >
                  {{ $t('MRI.add_localizer', languageCode) }}
                </v-btn>
                <v-btn
                  block
                  class="v-btn-grp-cancel"
                  v-if="isAddLocalizerMode && !isReconstructionQuestion"
                  @click="setIsAddLocalizerMode(false)"
                  >{{ $t('MRI.add_localizer_cancel', languageCode) }}</v-btn
                >
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-tab-item>
      <v-tab-item style="height: 100% !important">
        <v-card>
          <div style="display: block; height: 75%">
            <div class="stripped-table">
              <table style="width: 100%">
                <thead>
                  <tr>
                    <th
                      v-for="(header, hIdx) in headers_series"
                      :key="'series-header-' + hIdx"
                      :style="{ width: header.width + '%' }"
                      v-html="header.text"
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in items_series" :key="idx">
                    <td v-for="(value, index) in Object.values(item)" :key="idx + '-' + index">
                      <template v-if="index === 3">
                        <input type="checkbox" :checked="value === 1" />
                      </template>
                      <template v-else>
                        {{ value }}
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <v-container fluid fill-height style="background: #6875a2; height: 25%">
            <v-row align="center" justify="space-between" style="height: 50%">
              <v-col cols="4" class="p-1">
                <v-btn block class="v-btn-grp" disabled @click="setup">Setup</v-btn>
              </v-col>
              <v-col cols="4" class="p-1">
                <v-btn block class="v-btn-grp">Add Task ▶</v-btn>
              </v-col>
              <v-col cols="4" class="p-1">
                <v-btn block class="v-btn-grp" disabled @click="run">Run</v-btn>
              </v-col>
            </v-row>
            <v-row style="height: 50%; margin-top: 0px !important">
              <v-col cols="4" class="p-1">
                <v-btn block class="v-btn-grp" disabled @click="view">View</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
    <div class="cont" style="height: 10%; align-items: center">
      <div class="cont-2">
        <v-checkbox
          v-if="!isCanvasActiveFlag"
          v-model="autoStart"
          label="Auto Start"
          class="custom-checkbox"
          color="white"
          input-value="true"
        ></v-checkbox>
        <v-checkbox
          v-model="autoScan"
          label="Auto Scan"
          class="custom-checkbox"
          color="white"
          input-value="true"
        ></v-checkbox>
      </div>
      <div style="padding-right: 0.3em">
        <v-btn
          v-if="!isAddLocalizerMode"
          class="custom-button"
          style="background: #8c98be; border: 1px solid"
          :disabled="!isSavedRxActiveFlag || stackQuestions[isCurrentQuestion].status === 'Done'"
          @click="openSubmitModal"
        >
          Scan
        </v-btn>
        <v-btn
          v-if="isAddLocalizerMode"
          class="custom-button"
          style="background: #8c98be; border: 1px solid"
          @click="submitAddLocalizer()"
        >
          {{ $t('global.confirm_localizer') }}
        </v-btn>
      </div>
    </div>

    <b-modal
      id="modal-submit-scan"
      ref="submitModal"
      :title="$t('ScanButton.enter_a_name')"
      @ok="handleScanButton"
      @hidden="restoreReferenceLines"
      @shown="modalFocusInput"
    >
      <template #modal-ok>{{ $t('global.okay') }}</template>
      <template #modal-cancel>{{ $t('global.cancel') }}</template>
      <v-form @submit.stop.prevent="handleScanButton">
        <v-text-field v-model="newName" :label="$t('global.name')" ref="refNewNameInput"></v-text-field>
      </v-form>
    </b-modal>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'

export default {
  mixins: [SelectionConfigMixin, MriMixin, ScanButtonMixin],
  computed: {
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'selectedStackQuestionIndexVisual',
      'scanSubmittedByStackQuestionId',
      'scanSubmitted',
    ]),
    ...mapGetters('selectionConfig', ['dotScaleValues']),
    ...mapState('selectionConfig', [
      'selectionConfigsByIdent',
      'isFullscreen',
      'isAddLocalizerMode',
      'toolSelected',
      'toolSelectedConfig',
      'showReferenceLines',
      'referenceSliceCornersBySliceViewId',
      'hasAddedLocalizer',
    ]),
    ...mapGetters('scanTimeConfig', [
      'getAccelFactorPE',
      'getParallelFactor',
      'getAcquiredResolutionHeader',
      'getIsUltraLab',
      'getTrueResolutionHeaderUltra',
      'getAPVoxel',
      'getTrueResolutionHeader',
      'getRepetitionTime',
      'getTRSync',
      'getTESync',
    ]),
    ...mapGetters('b19AllValuesSelection', ['getPATSelectedValue', 'getAccelerationFactor']),
    echoTime: {
      get() {
        return this.$store.getters['scanTimeConfig/getEchoTime']
      },
    },
    flipAngle: {
      get() {
        return this.$store.getters['scanTimeConfig/getFlipAngle']
      },
    },
    slices: {
      get() {
        return this.$store.getters['scanTimeConfig/getSlices']
      },
    },
    phaseEncodingLines: {
      get() {
        return this.$store.getters['scanTimeConfig/getPhaseEncodingLines']
      },
    },
    parallelFactor: {
      get() {
        return this.$store.getters['scanTimeConfig/getParallelFactor']
      },
    },

    oversampling: {
      get() {
        return this.$store.getters['scanTimeConfig/getOversampling']
      },
    },
    phaseMatrix: {
      get() {
        return this.$store.getters['scanTimeConfig/getPhaseMatrix']
      },
    },
    frequencyMatrix: {
      get() {
        return this.$store.getters['scanTimeConfig/getFrequencyMatrix']
      },
    },
    dimensions3x: {
      get() {
        return this.$store.getters['scanTimeConfig/getDimensions3x']
      },
    },
    dimensions3y: {
      get() {
        return this.$store.getters['scanTimeConfig/getDimensions3y']
      },
    },
    partialFourier: {
      get() {
        return this.$store.getters['scanTimeConfig/getPartialFourier']
      },
    },
    averages: {
      get() {
        return this.$store.getters['scanTimeConfig/getAverages']
      },
    },
    concatenations: {
      get() {
        return this.$store.getters['scanTimeConfig/getConcatenations']
      },
    },
    echoTrainLength: {
      get() {
        return this.$store.getters['scanTimeConfig/getEchoTrainLength']
      },
    },
    // eslint-disable-next-line vue/no-dupe-keys
    selectionIdent: {
      get() {
        return this.$store.getters['scanTimeConfig/getSelectionIdent']
      },
    },
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
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
    ...mapState('dataToParent', ['sequenceType']),
    // ...mapState('scanTimeConfig', ['scanTime']),

    ...mapGetters('scanTimeConfig', ['getAccelFactorPE', 'getParallelFactor']),
    ...mapGetters('dataToParent', ['getscanTime']),
    // Importtant One

    scanTime() {
      return this.getscanTime
    },

    // Importtant One

    accelFactorPE() {
      return this.getAccelFactorPE
    },
  },
  watch: {
    stackQuestion() {
      this.previewScoreGroupIndex = 0
      if (this.stackQuestions[this.isCurrentQuestion].description === '3-Plane Localizer') {
        this.forcedIsCanvasActive = false
      } else {
        this.forcedIsCanvasActive = true
      }
    },
    selectedStackQuestionIndexVisual(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('newVal', newVal)
        this.alertActivateColumn(newVal - 1)
      }
    },
    isSavedRxActiveFlag(newVal, oldVal) {
      if (newVal) {
        this.stackQuestions[this.isCurrentQuestion].status = 'Rx'
      } else {
        this.stackQuestions[this.isCurrentQuestion].status = 'InRx'
      }
    },
  },
  name: 'GETaskTable',
  components: {
    ScanButton: () => import('@/components/ScanButton'),
  },
  data() {
    return {
      currentTab: 'Tasks', // Set the default active tab
      headers: [
        { text: '#', value: 'id', width: '10' },
        { text: 'Status', value: 'status', width: '15' },
        { text: '', value: '', width: '10' },
        { text: 'Description', value: 'description', width: '45' },
        { text: '', value: 'paperclip', width: '10' },
        { text: 'Time', value: 'time', width: '10' },
      ],
      scanItem: { status: 'InRx', description: 'Prescribe a Scan' },
      headers_series: [
        { text: '', value: 'id', width: '10' },
        { text: '#', value: 'num', width: '10' },
        { text: 'Series Description', value: 'sd', width: '70' },
        {
          text: `<img src="/src/assets/svg/regions/battery.png" alt="" style="width: 100%" />`,
          value: 'progress',
          width: '10',
        },
      ],
      items_series: [],
      autoStart: false,
      autoScan: false,
      previewScoreGroupIndex: 0,
      isCurrentQuestion: 0,
      sharedData: '',
      contextMenuVisible: false,
      menuX: 0,
      menuY: 0,
    }
  },
  methods: {
    ...mapActions('scanTimeConfig', ['acceptChanges']),
    ...mapActions('questionService', ['jumpToQuestion']),
    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),

    setup() {
      console.log('Setup button clicked!')
      // Implement your setup logic here
    },
    run() {
      console.log('Run button clicked!')
      // Implement your run logic here
    },
    view() {
      console.log('View button clicked!')
      // Implement your view logic here
    },
    alertActivateColumn(idx) {
      if (this.stackQuestions[idx].status !== 'Done') {
        this.stackQuestions[idx].status = 'InRx'
      }
      if (this.isCurrentQuestion !== idx && this.stackQuestions[this.isCurrentQuestion].status === 'InRx') {
        this.stackQuestions[this.isCurrentQuestion].status = ''
      }
      this.forcedIsSavedRxActive = false
      this.isCurrentQuestion = idx
      this.$store.dispatch('questionService/jumpToQuestion', idx)
    },
    showContextMenu(event) {
      this.menuX = event.clientX
      this.menuY = event.clientY - 233
      this.contextMenuVisible = true

      // Optional: hide on next click
      document.addEventListener('click', this.hideContextMenu)
    },
    hideContextMenu() {
      this.contextMenuVisible = false
      document.removeEventListener('click', this.hideContextMenu)
    },
    copyAction() {
      const originalItem = this.stackQuestions[this.isCurrentQuestion]
      const copiedItem = { ...originalItem }
      this.stackQuestions.splice(this.isCurrentQuestion + 1, 0, copiedItem)
      this.alertActivateColumn(this.isCurrentQuestion + 1)
    },
    moveAction(actionNumber) {
      if (actionNumber === 1) {
        const temp = this.stackQuestions[this.isCurrentQuestion]
        this.$set(this.stackQuestions, this.isCurrentQuestion, this.stackQuestions[this.isCurrentQuestion - 1])
        this.$set(this.stackQuestions, this.isCurrentQuestion - 1, temp)
        this.isCurrentQuestion = this.isCurrentQuestion - 1
      } else {
        const temp = this.stackQuestions[this.isCurrentQuestion]
        this.$set(this.stackQuestions, this.isCurrentQuestion, this.stackQuestions[this.isCurrentQuestion + 1])
        this.$set(this.stackQuestions, this.isCurrentQuestion + 1, temp)
        this.isCurrentQuestion = this.isCurrentQuestion + 1
      }
      this.hideContextMenu()
      this.alertActivateColumn(this.isCurrentQuestion)
    },
    handleScanButton() {
      this.submitScan(false)
      if (this.stackQuestions.length <= 1) {
        this.alertActivateColumn(0)
      } else {
        this.$set(this.stackQuestions[this.isCurrentQuestion], 'disabled', true)
        this.$set(this.stackQuestions[this.isCurrentQuestion], 'status', 'Done')
      }
    },
  },
  mounted() {
    this.stackQuestions = this.stackQuestions.map((item, index) => {
      if (item.questionText) {
        const words = item.questionText.split(' ')
        const lowerWords = words.map((w) => w.toLowerCase())
        const prescribeIdx = lowerWords.findIndex((w) => w === 'prescribe')
        if (prescribeIdx !== -1 && prescribeIdx < 3) {
          // Find "a" or "an" after "Prescribe"
          const aIdx = lowerWords.findIndex(
            (w, i) => (w === 'a' || w === 'an') && i > prescribeIdx && i <= prescribeIdx + 2
          )
          if (aIdx !== -1 && aIdx + 1 < words.length) {
            // Show from start to word after "a"/"an"
            // If next word after "a"/"an" is "T1", "T2", "T1*", or "T2*", include it as well
            const nextWord = words[aIdx + 2]
            if (nextWord && /^(T1\*?|T2\*?)$/i.test(nextWord)) {
              item.description = words.slice(0, aIdx + 3).join(' ')
            } else {
              item.description = words.slice(0, aIdx + 2).join(' ')
            }
          } else {
            // fallback: show up to 3 words
            item.description = words.slice(0, 3).join(' ')
          }
        } else {
          item.description = words.slice(0, 3).join(' ')
        }
      }
      item.disabled = false
    })
    if (this.stackQuestions.length <= 1) {
      this.stackQuestions[0] = this.scanItem
    } else {
      this.alertActivateColumn(0)
    }
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
    })
    // Add the icon for the paper clip
    this.headers[4].icon = 'mdi-paperclip' // Assuming you're using Material Design Icons
  },
}
</script>

<style scoped>
.v-card {
  width: 100%;
  height: 100%;
  margin: 0px auto;
}

.v-card-title {
  font-size: 1.2rem;
  color: #3f51b5;
}

.v-data-table {
  max-height: 400px;
  border-radius: 0;
}

.v-data-table > .thead > .th {
  background-color: #e0e0e0;
  font-weight: bold;
}

.text-xs {
  font-size: 0.8rem;
}

.v-btn.fab {
  width: 50px;
  height: 50px;
  background-color: #007bff;
  color: #fff;
}

.v-card-actions {
  padding: 10px;
}

.v-spacer {
  flex-grow: 2;
}

.v-switch {
  margin-right: 15px;
}

.v-btn.outlined {
  border: 1px solid #ddd;
}
.v-btn-grp {
  background: #8c98be !important;
}
.v-btn-grp-cancel {
  background: #8c98be !important;
  padding: 0 7px !important;
}
.btn-style {
  height: 30px !important;
  min-width: 50px !important;
}

::v-deep .v-application .secondary {
  font-size: 11px !important;
  font-family: sans-serif !important;
  font-style: normal !important;
  font-weight: 600 !important;
  color: black !important;
  background: #6875a2 !important;
  border-color: #6875a2 !important;
}
.stripped-table {
  border-collapse: collapse;
  height: 100%;
  overflow-y: auto;
  width: 100%; /* Adjust width as needed */
}

.active-task {
  background-color: #ffffdc !important;
}

.tr-disabled {
  background-color: lightgray !important;
  color: rgb(173, 173, 173);
}

/* Alternative using gradient (replace colors) */
/* .stripped-table {
  background-image: linear-gradient(to bottom, #color1, #color2);
} */

.stripped-table th,
.stripped-table td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
  cursor: pointer;
}

.stripped-table thead th {
  background-color: #6875a2;
  color: #fff;
}

.stripped-table tbody tr:nth-child(even) {
  background-color: #c7cee1;
}

.stripped-table tbody tr:nth-child(odd) {
  background-color: #bac1db;
}

::v-deep .theme--light.v-tabs > .v-tabs-bar {
  background-color: #6875a2 !important;
}

::v-deep .v-tabs > .v-tabs-bar .v-tab {
  color: black !important;
  border: 1px solid;
  border-radius: 8px;
  border-top-right-radius: 30px;
  font-size: 12px;
  background-color: #2f3d6e;
  font-family: sans-serif;
  padding: 6px 6px 4px 9px;
  font-weight: 700;
}

::v-deep .v-tabs > .v-tabs-bar .v-tab.v-tab--active {
  color: #fff !important;
  border: 1px solid;
  border-radius: 8px;
  border-top-right-radius: 30px;
  font-size: 12px;
  background-color: #6875a2;
  font-family: sans-serif;
  padding: 6px 6px 4px 9px;
  font-weight: 700;
}

::v-deep .v-tabs > .v-tabs-bar .v-tab.v-tabs-slider {
  background-color: #e0e0e0 !important;
}
::v-deep .v-slide-group__wrapper {
  background-color: #101d4a !important;
}
::v-deep .v-tabs > .v-tabs-bar .v-tab .v-tab:before {
  color: #fff !important;
}
::v-deep .v-window-item .v-window-item--active {
  background: #6875a2 !important;
  height: 100% !important;
}
.cont {
  display: flex;
  justify-content: space-between;
  background-color: #6875a2;
}
.cont-2 {
  display: flex;
  flex-direction: column;
}
.cont-2 .v-input--checkbox:first-child {
  margin-bottom: 0px;
  margin-top: 0px;
}

.cont-2 .v-input--checkbox:last-child {
  margin-bottom: 0px;
  margin-top: 0px;
}
::v-deep .v-window__container {
  background: #6875a2 !important;
  height: 100%;
}
.custom-checkbox input[type='checkbox'] {
  background-color: white !important;
  border: 2px solid black !important;
}

.custom-checkbox .v-input--selection-controls__input:checked ~ .v-input--selection-controls__ripple {
  border-color: black !important;
}

.custom-checkbox .v-input--selection-controls__ripple .v-input--selection-controls__ripple__mark {
  background-color: black !important;
}

::v-deep .v-input--selection-controls__input {
  height: 14px !important;
}

::v-deep .v-input--selection-controls__input .v-icon {
  font-size: 15px;
}

::v-deep .v-label {
  font-size: 12px;
  line-height: 15px;
  font-weight: bold;
  margin-bottom: 0px !important;
}

::v-deep .v-messages {
  min-height: 1px !important;
}

::v-deep .v-input__slot {
  margin-bottom: 0px !important;
}

.v-btn:not(.v-btn--round).v-size--default {
  margin: 0;
  height: 30px;
  border: none;
  color: black;
  border-right: 1px solid gray;
}

::v-deep .v-btn-grp span.v-btn__content {
  align-items: center;
  color: inherit;
  flex: 1 0 auto;
  display: block;
  line-height: normal;
  position: relative;
  transition: inherit;
  transition-property: opacity;
}

.edit-content {
  position: absolute;
  z-index: 2;
  background-color: #939ec7;
  width: 160px;
  box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #4b4b80; /* dark bottom-right bevel */
  font-size: 12px;
  color: #000;
  font-weight: bold;

  hr {
    margin: 0px;
    height: 2px;
    border: none;
    background: linear-gradient(to bottom, #333 50%, #ffffff 50%);
  }

  .edit-buttons {
    text-align: left;
    padding: 5px 0px 5px 0px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .edit-button {
      margin: 5px 0px 5px 15px;
    }

    .edit-button:disabled {
      color: #525e8a;
      font-weight: normal;
      text-shadow: 0.5px 0.5px 0 #4b4b80, -1px -1px 0 #8f96c0;
    }
  }
}
</style>
