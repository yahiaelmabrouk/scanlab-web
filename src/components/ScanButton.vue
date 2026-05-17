<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div>
    <!-- Scan Buttons Section -->
    <div
      v-if="!isComplete"
      :class="isCTLab ? 'd-flex flex-wrap g-0' : localSoftwareVersionPreference !== 'b19' ? 'buttons' : 'buttons-b19'"
      class="scan-buttons-container"
    >
      <template v-if="!isCTLab">
        <template v-if="!isEditingQuestion">
          <!-- Button for non-CTLab, based on software version -->
          <v-btn
            tile
            v-if="
              !isAddLocalizerMode &&
              ((localSoftwareVersionPreference !== 'xa' &&
                localSoftwareVersionPreference !== 'b19' &&
                localSoftwareVersionPreference !== 'r57') ||
                (localSoftwareVersionPreference === 'xa' && isTestParameterValid === false) ||
                (localSoftwareVersionPreference === 'b19' && isTestParameterValid === false) ||
                (localSoftwareVersionPreference === 'r57' && isTestParameterValid === false))
            "
            :disabled="isDisableMRScanButton"
            :class="[
              'no-transform',
              'bold',
              'flex-grow-1',
              small ? 'pt-0 pb-0' : '',
              localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
            ]"
            :color="freebie ? 'text-white secondary' : 'text-white buttonBlue'"
            @click="openSubmitModal"
          >
            {{ $t('global.scan') }}
          </v-btn>
          <!-- Button for B19 version -->
          <v-btn
            tile
            class="btn-scan-b19"
            v-if="!isAddLocalizerMode && localSoftwareVersionPreference === 'b19' && isTestParameterValid === true"
            @click="openSubmitModal"
          >
            {{ $t('global.apply') }}
          </v-btn>
          <v-btn
            tile
            class="no-transform bold flex-grow-1"
            :color="freebie ? 'text-white secondary' : 'text-white buttonBlue'"
            v-if="!isAddLocalizerMode && localSoftwareVersionPreference === 'r57' && isTestParameterValid === true"
            @click="openSubmitModal"
            style="border-radius: 3px"
          >
            SCAN START
          </v-btn>

          <!-- Button for XA version -->
          <v-btn
            class="xa-btn"
            v-if="!isAddLocalizerMode && isTestParameterValid === true && localSoftwareVersionPreference === 'xa'"
            color="#FF6600"
            size="x-small"
            rounded
            @click="openSubmitModal"
          >
            Go
          </v-btn>
        </template>
        <template v-else>
          <!-- Scan Max/Min Buttons -->
          <v-btn
            tile
            v-if="!isAddLocalizerMode"
            :class="[
              'no-transform',
              'bold',
              'flex-grow-1',
              small ? 'pt-0 pb-0' : '',
              localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
            ]"
            :color="freebie ? 'text-white secondary' : 'text-white buttonBlue'"
            @click="
              mrScanIdentType = 'max'
              openSubmitModal()
            "
          >
            {{ $t('global.scan_max') }}
          </v-btn>
          <v-btn
            tile
            v-if="!isAddLocalizerMode"
            :class="[
              'no-transform',
              'bold',
              'flex-grow-1',
              small ? 'pt-0 pb-0' : '',
              localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
            ]"
            :color="freebie ? 'text-white secondary' : 'text-white buttonBlue'"
            @click="
              mrScanIdentType = 'min'
              openSubmitModal()
            "
          >
            {{ $t('global.scan_min') }}
          </v-btn>
        </template>
      </template>
      <template v-if="isCTLab">
        <template v-if="isEditingQuestion">
          <!-- CT Lab Editing Mode -->
          <div class="w-100">
            <v-btn
              tile
              :class="[
                'no-transform',
                'bold',
                'flex-grow-1',
                'w-50',
                small ? 'pt-0 pb-0' : '',
                localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
              ]"
              :color="freebie ? 'text-white secondary' : 'text-white buttonBlue'"
              :disabled="scanStatus === SCAN_STATUS.SCANNING"
              @click="
                mrScanIdentType = 'max'
                openSubmitModal()
              "
            >
              <v-progress-circular indeterminate v-if="scanStatus === SCAN_STATUS.SCANNING"></v-progress-circular>
              <span v-else>{{ $t('global.scan_max') }}</span>
            </v-btn>
            <v-btn
              tile
              :class="[
                'no-transform',
                'bold',
                'flex-grow-1',
                'w-50',
                small ? 'pt-0 pb-0' : '',
                localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
              ]"
              :color="freebie ? 'text-white secondary' : 'text-white buttonBlue'"
              :disabled="scanStatus === SCAN_STATUS.SCANNING"
              @click="
                mrScanIdentType = 'min'
                openSubmitModal()
              "
            >
              <v-progress-circular indeterminate v-if="scanStatus === SCAN_STATUS.SCANNING"></v-progress-circular>
              <span v-else>{{ $t('global.scan_min') }}</span>
            </v-btn>
          </div>
          <v-btn
            :class="[
              'no-transform',
              'bold',
              'flex-grow-1',
              'text-white',
              'buttonBlue',
              'px-1',
              localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
            ]"
            @click="onCancelAnswerForEdittingMode"
            :disabled="scanStatus !== SCAN_STATUS.SCANNED"
          >
            {{ $t('global.cancel') }}
          </v-btn>
        </template>
        <template v-else>
          <template>
            <v-btn
              v-if="!isAddLocalizerMode && !isLocalizerQuestion && isTimingDecisionQuestion"
              :class="[
                'no-transform',
                'bold',
                'flex-grow-1',
                small ? 'pt-0 pb-0' : '',
                localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
                {
                  'btn-color-red': scanStatus == SCAN_STATUS.SCANNED, // Cancel
                  'btn-color-green': scanStatus == SCAN_STATUS.NO_SCAN, // Confirm
                  'btn-color-blue': scanStatus == SCAN_STATUS.SCANNING, // Scanning
                  'btn-glowing':
                    scanStatus == SCAN_STATUS.NO_SCAN && !isDisableScanButtonForTimingDecisionQuestion,
                },
              ]"
              :color="freebie ? 'text-white secondary' : ''"
              @click="handleChangeStatusForTimingDecisionQuestion"
              :disabled="isDisableScanButtonForTimingDecisionQuestion"
            >
              <span v-if="scanStatus == SCAN_STATUS.NO_SCAN">{{
                this.isSelectedSetDelayTimingDecision ? $t('global.confirm') : $t('global.confirm_slice')
              }}</span>
              <span v-if="scanStatus == SCAN_STATUS.SCANNED">{{ $t('global.cancel') }}</span>
              <v-progress-circular indeterminate v-if="scanStatus == SCAN_STATUS.SCANNING"></v-progress-circular>
            </v-btn>
            <v-btn
              tile
              v-if="!isAddLocalizerMode && !isLocalizerQuestion && !isTimingDecisionQuestion"
              :class="[
                'no-transform',
                'bold',
                'flex-grow-1',
                small ? 'pt-0 pb-0' : '',
                localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
                {
                  'btn-color-red': scanStatus == SCAN_STATUS.SCANNED, // Cancel
                  'btn-color-green': scanStatus == SCAN_STATUS.NO_SCAN, // Confirm
                  'btn-color-blue': scanStatus == SCAN_STATUS.SCANNING, // Scanning
                  'btn-glowing': scanStatus == SCAN_STATUS.NO_SCAN && canConfirmQuestion,
                },
              ]"
              :color="freebie ? 'text-white secondary' : ''"
              @click="handleChangeStatus"
              :disabled="
                isPlayingTheSlices ||
                isLoadingPlayingTheSlices ||
                (isLocalizerQuestion && !isMriMachineScanComplete && scanStatus == SCAN_STATUS.SCANNED) ||
                // disabled cancel after start
                canGoToNextStep ||
                isSubmittingAnswer ||
                (!canConfirmQuestion && scanStatus == SCAN_STATUS.NO_SCAN)
              "
            >
              <span v-if="scanStatus == SCAN_STATUS.NO_SCAN">{{ $t('global.confirm') }}</span>
              <span v-if="scanStatus == SCAN_STATUS.SCANNED">{{ $t('global.cancel') }}</span>
              <v-progress-circular indeterminate v-if="scanStatus == SCAN_STATUS.SCANNING"></v-progress-circular>
            </v-btn>
          </template>
          <v-tooltip top :disabled="!showMoveTooltip" v-if="isAcquisitionQuestion || isLocalizerQuestion">
            <template #activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                :class="[
                  'no-transform',
                  'bold',
                  'flex-grow-1',
                  {
                    'btn-glowing': !isDisableMoveButton,
                    'btn-color-yellow':
                      !(!isConfirmedLocalizerQuestion && isLocalizerQuestion) &&
                      (isMoveEnabled || isAcquisitionQuestion), // Move
                    'btn-color-red':
                      !(!isConfirmedLocalizerQuestion && isLocalizerQuestion) &&
                      !(isMoveEnabled || isAcquisitionQuestion), // Cancel
                    'btn-color-green': !isConfirmedLocalizerQuestion && isLocalizerQuestion, // Confirm
                  },
                  localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
                ]"
                v-shortkey.push="['m']"
                @shortkey="onClickHotKey('Move')"
                @click="onMoveModel(false)"
                :disabled="isDisableMoveButton"
              >
                <!-- Only for localizer question, user can change breathing when model not moved -->
                <span>{{
                  !isConfirmedLocalizerQuestion && isLocalizerQuestion
                    ? $t('global.confirm')
                    : isMoveEnabled || isAcquisitionQuestion
                    ? $t('global.move')
                    : $t('global.cancel')
                }}</span>
              </v-btn>
            </template>
            <span v-if="showMoveTooltip">{{ $t('ScanButton.tooltip_move_shortcut') }}</span>
          </v-tooltip>
        </template>
        <template>
          <v-tooltip top :disabled="!showStartTimingTooltip" v-if="!isAddLocalizerMode && isTimingDecisionQuestion">
            <template #activator="{ on, attrs }">
              <v-btn
                tile
                v-bind="attrs"
                v-on="on"
                :class="[
                  'no-transform',
                  'bold',
                  'flex-grow-1',
                  {
                    'pt-0 pb-0': small,
                    'btn-glowing-secondary': isHighlightTimingDecisionStartButton && !isSelectedSetDelayTimingDecision,
                    'px-1': isEditingQuestion,
                  },
                  localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
                ]"
                :color="
                  freebie
                    ? 'text-white secondary'
                    : roiStatus == ROI_STATUS.RUNNING && isSelectedTestBolusTimingDecision
                    ? 'text-white accent'
                    : 'text-white buttonBlue'
                "
                :disabled="
                  isSubmittingAnswer ||
                  isSelectedSetDelayTimingDecision ||
                  preloadPercent != 100 ||
                  isMovingMRIMachineToConfirmedPosition ||
                  isCountDownTimingDecisionQuestion ||
                  ((scanStatus !== SCAN_STATUS.SCANNED || !canConfirmQuestion) &&
                    !(
                      isSelectedTestBolusTimingDecision &&
                      roiStatus == ROI_STATUS.DONE &&
                      !isPressNextButtonFromThisAnswer
                    ))
                "
                v-shortkey.push="['space']"
                @shortkey="onClickHotKey('StartROI')"
                @click="onTogglePlayScanForTimingDecisionQuestion"
              >
                <v-progress-circular
                  indeterminate
                  v-if="
                    preloadPercent != 100 ||
                    isSubmittingAnswer ||
                    isMovingMRIMachineToConfirmedPosition ||
                    isCountDownTimingDecisionQuestion
                  "
                ></v-progress-circular>
                <span v-else-if="scanStatus == SCAN_STATUS.SCANNED && !isMovedMRIPositionToCorrectZone">
                  {{ $t('global.move') }}
                </span>
                <span v-else-if="roiStatus == ROI_STATUS.NO_CONFIRM">
                  {{ $t('global.start') }}
                </span>
                <span v-else-if="roiStatus == ROI_STATUS.SHOW_ROI">
                  {{ $t('global.confirm_roi') }}
                </span>
                <span v-else-if="roiStatus == ROI_STATUS.CONFIRMED">
                  {{ $t('global.start') }}
                </span>
                <span v-else-if="roiStatus == ROI_STATUS.RUNNING">
                  {{ isSelectedTestBolusTimingDecision ? $t('global.stop') : $t('global.continue') }}
                </span>
                <span v-else-if="roiStatus == ROI_STATUS.DONE">
                  {{ $t('global.next') }}
                </span>
              </v-btn>
            </template>
            <span v-if="showStartTimingTooltip">{{ $t('ScanButton.tooltip_start_shortcut') }}</span>
          </v-tooltip>
          <v-tooltip top :disabled="!showStartTooltip" v-if="!isAddLocalizerMode && !isTimingDecisionQuestion">
            <template #activator="{ on, attrs }">
              <v-btn
                tile
                v-bind="attrs"
                v-on="on"
                :class="[
                  'no-transform',
                  'bold',
                  'flex-grow-1',
                  { 'pt-0 pb-0': small, 'btn-glowing-secondary': isHighlightStartButton, 'px-1': isEditingQuestion },
                  localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
                ]"
                :color="freebie ? 'text-white secondary' : 'text-white buttonBlue'"
                :disabled="isDisableStartButton"
                v-shortkey.push="['space']"
                @shortkey="onClickHotKey('Start')"
                @click="onTogglePlayScan"
              >
                <v-progress-circular
                  indeterminate
                  v-if="isLoadingPlayingTheSlices || isSubmittingAnswer"
                ></v-progress-circular>
                <span
                  v-else-if="
                    canGoToNextStep &&
                    questionSet &&
                    selectedStackQuestionIndex >= stackQuestions.length - 1 &&
                    (stackQuestions.length > 1 || (stackQuestions.length == 1 && !isLocalizerQuestion))
                  "
                >
                  <span>
                    {{
                      isReconstructionQuestion
                        ? !isEditingQuestion
                          ? $t('global.reconstruct')
                          : $t('global.reconstruct_break_line')
                        : $t('global.start')
                    }}
                  </span>
                </span>
                <span style="white-space: break-spaces" v-else>{{
                  canGoToNextStep && questionSet
                    ? $t('global.next')
                    : isPlayingTheSlices
                    ? $t('global.stop')
                    : isReconstructionQuestion
                    ? !isEditingQuestion
                      ? $t('global.reconstruct')
                      : $t('global.reconstruct_break_line')
                    : $t('global.start')
                }}</span>
              </v-btn>
            </template>
            <span v-if="showStartTooltip">{{ $t('ScanButton.tooltip_start_shortcut') }}</span>
          </v-tooltip>
        </template>
      </template>
      <!-- Skip Question Button -->
      <v-btn
        v-if="freebie && !isEditingQuestion && isTestParameterValid === true && localSoftwareVersionPreference === 'xa'"
        class="xa-btn"
        color="accent"
        :class="small ? 'pt-0 pb-0' : ''"
        @click="skipQuestion()"
        size="x-small"
        rounded
      >
        {{ $t('MRI.skip') }}
      </v-btn>
      <v-btn
        v-else-if="freebie && !isEditingQuestion"
        color="accent"
        :class="[
          'no-transform',
          'bold',
          small ? 'pt-0 pb-0' : '',
          localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
          localSoftwareVersionPreference === 'r57' ? 'button-r57-skip' : '',
          'flex-grow-1',
        ]"
        :disabled="isDisableSkipButton"
        @click="skipQuestion()"
      >
        {{ $t('MRI.skip') }}
      </v-btn>
      <v-btn
        v-if="
          !isAddLocalizerMode && !freebie && isTestParameterValid === true && localSoftwareVersionPreference === 'xa'
        "
        class="xa-btn"
        :class="small ? 'pt-0 pb-0' : ''"
        color="#4f545c"
        size="x-small"
        rounded
        @click="handleCancel"
      >
        {{ $t('global.cancel') }}
      </v-btn>
    </div>

    <!-- Add Localizer Button -->
    <v-btn
      block
      tile
      v-if="isAddLocalizerMode"
      :style="buttonStyle"
      :class="[
        'mt-3',
        'no-transform',
        'bold',
        'pop',
        localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
        localSoftwareVersionPreference === 'r57' ? 'button-r57' : '',
        small || localSoftwareVersionPreference === 'xa' ? 'pt-0 pb-0 xa-btn-confirm' : '',
      ]"
      @click="submitAddLocalizer()"
    >
      {{ $t('global.confirm_localizer') }}
    </v-btn>

    <!-- Complete Button -->
    <v-btn
      v-if="isComplete"
      block
      tile
      :class="[
        'no-transform',
        'bold',
        small || localSoftwareVersionPreference === 'xa' ? 'pt-0 pb-0 xa-btn-proceed rounded' : '',
        localSoftwareVersionPreference === 'r57' ? 'button-proceed' : '',
        localSoftwareVersionPreference !== 'b19' ? 'button' : 'button-b19',
        showAttention ? 'attention-glow' : '',
      ]"
      color="buttonSecondary text-white"
      @click="handleClick"
    >
      {{ $t('global.proceed') }}
    </v-btn>

    <!-- Modal Component -->
    <b-modal
      id="modal-submit-scan"
      ref="submitModal"
      :title="$t('ScanButton.enter_a_name')"
      ok-variant="success"
      cancel-variant="danger"
      @ok="submitScan(false)"
      @hidden="restoreReferenceLines"
      @shown="modalFocusInput"
    >
      <template #modal-ok>{{ $t('global.okay') }}</template>
      <template #modal-cancel>{{ $t('global.cancel') }}</template>
      <v-form @submit.stop.prevent="submitScan(false)">
        <v-text-field v-model="newName" :label="$t('global.name')" ref="refNewNameInput"></v-text-field>
      </v-form>
    </b-modal>
    <audio ref="soundBreathIn" :src="breathInUrl" controls :volume="1" hidden @canplay="onSoundBreathInLoaded" />
    <audio ref="soundBreathOut" :src="breathOutUrl" controls :volume="1" hidden @canplay="onSoundBreathOutLoaded" />
    <audio ref="soundResumeBreath" :src="resumeBreathingUrl" controls :volume="1" hidden />
  </div>
</template>

<script>
// @ is an alias to /src
import { ScanButtonMixin } from '@/components/Mixins/ScanButtonMixin'
// eslint-disable-next-line no-unused-vars
import { SCAN_STATUS } from '../constants'
import { mapGetters } from 'vuex'
import { shouldShowMainScreen } from '../util/utils.js'
// eslint-disable-next-line no-unused-vars
import _ from 'lodash'
import EventBus from '@/lib/event-bus'
import { stopMriLoop } from '@/lib/mri-audio'

export default {
  name: 'ScanButton',
  mixins: [ScanButtonMixin],
  components: {},
  props: {
    freebie: Boolean,
    small: Boolean,
    shouldHandleHotKey: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      availableSoundCode: ['es', 'pt', 'de', 'fr'],
      showAttention: true,
    }
  },
  computed: {
    ...mapGetters('user', ['softwareVendorPreference', 'softwareVersionPreference', 'languageCode']),
    ...mapGetters('scanTimeConfig', ['getLocalSoftwareVersionPreference']),

    localSoftwareVersionPreference() {
      return this.getLocalSoftwareVersionPreference
    },
    showMoveTooltip() {
      return (
        !(!this.isConfirmedLocalizerQuestion && this.isLocalizerQuestion) &&
        (this.isMoveEnabled || this.isAcquisitionQuestion)
      )
    },
    showStartTooltip() {
      if (this.isLoadingPlayingTheSlices || this.isSubmittingAnswer) return false
      if (this.isPlayingTheSlices) return false
      if (this.canGoToNextStep && this.questionSet) return false
      if (this.isReconstructionQuestion) return false
      return true
    },
    showStartTimingTooltip() {
      if (
        this.preloadPercent != 100 ||
        this.isSubmittingAnswer ||
        this.isMovingMRIMachineToConfirmedPosition ||
        this.isCountDownTimingDecisionQuestion
      ) {
        return false
      }
      if (this.scanStatus == this.SCAN_STATUS.SCANNED && !this.isMovedMRIPositionToCorrectZone) return false
      return this.roiStatus == this.ROI_STATUS.NO_CONFIRM || this.roiStatus == this.ROI_STATUS.CONFIRMED
    },
    mainScreenInfo() {
      return shouldShowMainScreen(this.softwareVendorPreference, this.softwareVersionPreference)
    },
    breathInUrl() {
      if (this.availableSoundCode.includes(this.languageCode)) {
        return `/sounds/breath-in-${this.languageCode}.mp3`
      }
      return `/sounds/breath-in.mp3`
    },
    breathOutUrl() {
      if (this.availableSoundCode.includes(this.languageCode)) {
        return `/sounds/breath-out-${this.languageCode}.mp3`
      }
      return `/sounds/breath-out.mp3`
    },
    resumeBreathingUrl() {
      if (this.availableSoundCode.includes(this.languageCode)) {
        return `/sounds/resume-breathing-${this.languageCode}.mp3`
      }
      return `/sounds/resume-breathing.mp3`
    },
  },
  methods: {
    handleCancel() {},
    handleClick() {
      this.showAttention = false
      stopMriLoop()
      this.proceedToTakingPostQuestions()
    },
  },
  created() {
    const urlParams = new URLSearchParams(window.location.search)
    const allParams = {}

    // Get all parameters
    urlParams.forEach((value, key) => {
      allParams[key] = value
    })
    if (Object.prototype.hasOwnProperty.call(allParams, 'test')) {
      const testParam = urlParams.get('test')
      if (testParam !== null && testParam !== '') {
        this.isTestParameterValid = true
      } else {
        this.isTestParameterValid = false
      }
    } else if (Object.prototype.hasOwnProperty.call(allParams, 'dicom')) {
      if (Object.prototype.hasOwnProperty.call(allParams, 'ignoreVendorUI')) {
        const dicomParam = allParams['dicom']
        const ignoreVendor = allParams['ignoreVendorUI']

        if (dicomParam !== null && dicomParam !== '' && ignoreVendor == 'false') {
          this.isTestParameterValid = true
        } else {
          this.isTestParameterValid = false
        }
      } else {
        this.isTestParameterValid = false
      }
    } else {
      this.isTestParameterValid = false
    }
  },
  async mounted() {
    EventBus.$on('EndAutoRunSlices', this.onAutoRunEnd)
    // Reset status of scan
    if (this.isCTLab) {
      if (!this.isTimingDecisionQuestion) {
        this.setScanStatus(this.SCAN_STATUS.NO_SCAN)
      }
      // Hidden Confirm button in Localizer First, call function handleChangeStatus
      // Only call when first question is localizer question
      if (
        !this.isAddLocalizerMode &&
        !this.isEditingQuestion &&
        this.isLocalizerQuestion &&
        !this.isMriMachineScanComplete
      ) {
        this.handleChangeStatus()
      }
    }

    if (this.isCTLab) {
      // In CTLab mode, reference line is off by default. If user turn on, they will stay on until the user turns them off.
      this.$store.dispatch('selectionConfig/setShowReferenceLines', false)
    }

    // Timing decision and another question use different ScanButton
    // Need to call this function when init component
    this.onSelectedStackQuestionIndexChange()

    EventBus.$on('onMoveMriModelToBodyBoxEnd', this.onMoveMriModelToBodyBoxEnd)
    EventBus.$on('onTimingDecisionRunDone', this.onTimingDecisionRunDone)
    EventBus.$on(
      'onSetDelayTimingDecisionConfirmedMoveToNextQuestion',
      this.onSetDelayTimingDecisionConfirmedMoveToNextQuestion
    )
  },
  beforeDestroy() {
    EventBus.$off('onTimingDecisionRunDone', this.onTimingDecisionRunDone)
    EventBus.$off('EndAutoRunSlices', this.onAutoRunEnd)
    EventBus.$off('onMoveMriModelToBodyBoxEnd', this.onMoveMriModelToBodyBoxEnd)
    EventBus.$off(
      'onSetDelayTimingDecisionConfirmedMoveToNextQuestion',
      this.onSetDelayTimingDecisionConfirmedMoveToNextQuestion
    )
    this.killCurrentTimingDecisionCountDownAnimation()
    if (this.interval) {
      clearInterval(this.interval)
    }
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  },
}
</script>

<style lang="scss" scoped>
.attention-glow {
  animation: pulse-glow 1.5s infinite ease-in-out;
  outline: 4px solid rgba(255, 165, 0, 1) !important;
  outline-offset: -4px;
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.5); /* Orange color */
  }
  50% {
    box-shadow: 0 0 10px 4px rgba(255, 165, 0, 1); /* Stronger orange glow */
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.5); /* Back to faint orange */
  }
}

.scan-buttons-container {
  position: relative;
  z-index: 2;
}

@keyframes glowing {
  0% {
    box-shadow: 0 0 3px #f0bd17;
  }

  50% {
    box-shadow: 0 0 40px #f08b17;
  }

  100% {
    box-shadow: 0 0 3px #f0bd17;
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

.btn-color-yellow {
  background-color: #ffc107 !important;
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
.btn-color-blue {
  background-color: #1692ae !important;
  color: white !important;
}

@keyframes glowing-secondary {
  0% {
    background-color: #1692ae;
    box-shadow: 0 0 3px #1ecdf5;
  }

  50% {
    background-color: #1692ae;
    box-shadow: 0 0 40px #1ecdf5;
  }

  100% {
    background-color: #1692ae;
    box-shadow: 0 0 3px #1ecdf5;
  }
}

.btn-glowing-secondary {
  -webkit-animation: glowing-secondary 1500ms infinite;
  -moz-animation: glowing-secondary 1500ms infinite;
  -o-animation: glowing-secondary 1500ms infinite;
  animation: glowing-secondary 1500ms infinite;
  outline: 4px solid #1ecdf5 !important;
  outline-offset: -4px;
}

u {
  font-weight: bold;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .button:not(.w-full) {
    flex-basis: calc(50% - 55px);
  }

  .button.w-full {
    flex-basis: 100%;
  }
}

.buttons-b19 {
  display: flex;
  // flex-wrap: wrap;
  gap: 2px;

  .button:not(.w-full) {
    flex-basis: calc(50% - 55px);
  }

  .button.w-full {
    flex-basis: 100%;
  }
}

.button {
  flex: 1;
  font-size: 18px !important;
  text-transform: uppercase !important;
  padding: 35px 25px !important;
}

.button-proceed {
  flex: 1;
  font-size: 14px !important;
  text-transform: uppercase !important;
  margin-top: 0px !important;
  border-radius: 4px;
  padding: 0px 0px !important;
}

.button-r57 {
  flex: 1;
  font-size: 14px !important;
  text-transform: uppercase !important;
  margin-top: 0px !important;
  border-radius: 4px;
  padding: 0px 0px !important;
}

.button-r57-skip {
  flex: 1;
  font-size: 14px !important;
  text-transform: uppercase !important;
  margin-bottom: 12px !important;
  border-radius: 4px;
  padding: 0px 0px !important;
}

.v-application .mt-3 {
  margin-top: 0px !important;
}

.button-b19 {
  // flex: 1;
  font-size: 11px !important;
  text-transform: uppercase !important;
  padding: 10.4px 27px !important;
  height: 20px !important;
  border-radius: 0px;
  margin-top: 0.6rem;
  margin-right: 0.6rem;
}

.v-btn.no-transform {
  text-transform: none;
  letter-spacing: 0;
}

.pop {
  color: $white !important;
  background-color: $green !important;
}
.xa-btn {
  margin: 0.2rem;
  color: white !important;
  height: 22px !important;
  min-width: 50%;
  width: 20px;
  padding: 0 12px;
  font-size: 0.5rem !important;
  margin-right: 0.25rem !important;
}
.xa-btn-confirm {
  margin: 0.2rem;
  color: white !important;
  height: 22px !important;
  min-width: 50%;
  width: 75px;
  padding: 0 12px;
  font-size: 0.5rem !important;
  margin-right: 0.25rem !important;
}

.xa-btn-proceed {
  margin: 0.2rem;
  color: white !important;
  height: 35px !important;
  min-width: 50%;
  width: 100px;
  padding: 0 12px;
  font-size: 1rem !important;
  margin-right: 0.25rem !important;
}
.btn-scan-b19 {
  background: #9a9a9a !important;
  margin-top: 0.65rem;
  text-transform: capitalize !important;
  // margin-right: 0.25rem !important;
  border-radius: 0 !important;
  height: 20px !important;
  min-width: 100px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
  border-width: thin !important;
  font-size: 0.7rem !important;
}
</style>
