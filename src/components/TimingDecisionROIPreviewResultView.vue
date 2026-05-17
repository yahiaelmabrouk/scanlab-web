<template>
  <div>
    <div class="timing-decision-roi-container" ref="container" style="background-color: #000000; height: 400px">
      <canvas ref="canvas" id="timingDecisionROIPreviewCanvas"></canvas>
      <div class="preview-current-seconds">
        <span>{{ `${desplayCurrentSeconds}s` }}</span>
      </div>
      <div class="loading-overlay" :class="{ show: preloadPercent != 100 }">
        <v-progress-circular indeterminate></v-progress-circular>
      </div>
      <!-- <div class="zoom-action-control-board">
        <span class="text-brightness">{{ $t('global.brightness') }}: {{ round(currentBrightness, 2) }}</span>
        <button @click="increaseBrightness()">{{ `+` }}</button>
        <button @click="decreaseBrightness()">{{ `-` }}</button>
      </div> -->
    </div>
    <div class="box-controls">
      <v-row justify="space-around">
        <v-col class="text-center pr0" cols="2">
          <!-- eslint-disable-next-line -->
          <span>1</span>
        </v-col>
        <v-col cols="8" class="align-self-center">
          <v-slider
            v-model.number="sliceIndex"
            min="1"
            :max="numOfSteps"
            :disabled="numOfSteps <= 1"
            thumb-label
            ticks
            hide-details="true"
          >
          </v-slider>
        </v-col>
        <v-col class="text-center pl0" cols="2">
          <span>{{ numOfSteps }}</span>
        </v-col>
      </v-row>
    </div>
  </div>
</template>
<script>
import { fabric } from 'fabric'
import _ from 'lodash'
import {
  DEFAULT_ROI_STROKE_WIDTH,
  DEFAULT_ROI_RADIUS,
  INJECTOR_PROTOCOLS,
  MIN_CONTRAST_DURATION_TIME,
  DEFAULT_CARDIAC_CYCLE_DURATION,
  MAXIMUM_ROI_STEP,
} from '../constants'
import { mapActions, mapGetters, mapState } from 'vuex'
import { FABRIC_IMAGES_CACHE } from '../util/loaderManager'

export default {
  name: 'TimingDecisionROIPreviewResultView',
  props: {
    stackQuestionResult: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      canvas: null,
      canvasRealWidth: 0,
      canvasRealHeight: 0,
      backgroundImage: null,
      circleObject: null,
      isDragging: false,
      isZooming: false,
      lastPosX: null,
      lastPosY: null,
      DEFAULT_ROI_RADIUS,
      DEFAULT_ROI_STROKE_WIDTH,
      MIN_CONTRAST_DURATION_TIME,
      INJECTOR_PROTOCOLS,
      sliceIndex: 1,
      heartLayerImage: null,
      liverLayerImage: null,
      baseLayerImage: null,
      vascularLayerImage: null,
      heartDyeLayerImage: null,
      currentBrightness: 0,
      round: _.round,
      previewImageScale: 1,
    }
  },
  computed: {
    ...mapState('timingDecisionService', [
      'preloadHeartImages',
      'preloadHeartDyeImages',
      'preloadDyeImages',
      'timingDecisionTestProcessDoneStep',
      'timingDecisionContrast1ProcessDoneStep',
      'timingDecisionContrast2ProcessDoneStep',
      'timingDecisionContrastProcessDoneStep',
      'timingDecisionInjectedStep',
      'timingDecisionContrast1InjectedStep',
      'timingDecisionContrast2InjectedStep',
      'timingDecisionTestProcessInjectedStep',
      'preloadCatScanImages',
      'previewContrast',
      'brightnessMappingData',
      'preloadVascularImages',
      'preloadHeartLayerImages',
      'preloadLiverLayerImages',
      'probeData',
    ]),
    ...mapGetters('timingDecisionService', [
      'preloadPercent',
      'shouldAutoMoveToNextAfterTimingDecision',
      'isHasTestContrast',
      'isHasTwoPeriodContrast',
      'isSelectedTestBolusTimingDecision',
      'multipleLayerImageGroupedByFolder',
    ]),
    timingDecisionContrastAlbum() {
      if (this.answerTimingDecisionStep >= 0 && this.answerTimingDecisionStep < 340) {
        return (this.answerTimingDecisionStep + 1).toString()
      }
      return '143'
    },
    desplayCurrentSeconds() {
      return this.sliceIndex * this.frameRate + this.answerTimingDecisionScanDelay
    },
    delayTimeToShowRoi() {
      // 1 -> 10 <=> 14 -> 2
      let standardDelayTime = 5.29
      const offset = ((this.answerTimingDecisionStep - 143) / 143) * standardDelayTime
      standardDelayTime = standardDelayTime + offset
      const step = 2 / 3
      // const step = 1 / 3

      return Math.max(2, _.round(5 + (5 - this.currentContrastFlowRate) * step))
    },
    isAnswerHasTestContrast() {
      return (
        this.answerTestInjectorProtocol == this.INJECTOR_PROTOCOLS.TEST_BOLUS_AND_TTP ||
        this.answerTestInjectorProtocol == this.INJECTOR_PROTOCOLS.TEST_BOLUS_AND_TTP_BI_PHASIC
      )
    },
    isAnswerHasTwoPeriodContrast() {
      return (
        this.answerTestInjectorProtocol == this.INJECTOR_PROTOCOLS.BOLUS_BI_PHASIC ||
        this.answerTestInjectorProtocol == this.INJECTOR_PROTOCOLS.TEST_AND_BOLUS_BI_PHASIC ||
        this.answerTestInjectorProtocol == this.INJECTOR_PROTOCOLS.TEST_BOLUS_AND_TTP_BI_PHASIC
      )
    },
    presentationPeriods() {
      return [
        {
          start: 2, // Must start from 2, because 1 is the initial step
          end: Math.min(Math.round(this.trackingDuration) + 2, MAXIMUM_ROI_STEP),
        },
        {
          start: 2,
          end: Math.min(Math.round(this.trackingDuration) + 2, MAXIMUM_ROI_STEP),
        },
        {
          start: 2,
          end: Math.min(Math.round(this.trackingDuration) + 2, MAXIMUM_ROI_STEP),
        },
      ]
    },
    endingPeriod() {
      const endPoints = Math.max(...this.presentationPeriods.map((item) => item.end))

      return { start: endPoints + 1, end: MAXIMUM_ROI_STEP }
    },
    multipleLayerBrightnessMappingData() {
      if (!Array.isArray(this.brightnessMappingData) || this.brightnessMappingData.length === 0) {
        return {}
      }

      const sv = this.answerPatientPhysioInfoStrokeVolume
      let candidates = this.brightnessMappingData

      if (sv != null) {
        const exact = candidates.filter((item) => item.strokeVolume === sv)
        if (exact.length > 0) {
          candidates = exact
        }
      }

      const duration = this.trackingDuration || 0

      const nearest = _.minBy(candidates, (item) => {
        const d = item.duration != null ? item.duration : 0
        return Math.abs(d - duration)
      })

      return nearest ? nearest.data || {} : {}
    },
    currentContrastFlowRate() {
      const presentStep = this.sliceIndex
      if (this.isAnswerHasTestContrast) {
        if (this.isAnswerHasTwoPeriodContrast) {
          const startMainStep = Math.max(
            this.answerTimingDecisionTestProcessDoneStep,
            this.answerTimingDecisionContrast1InjectedStep
          )
          if (presentStep <= this.answerTimingDecisionTestProcessDoneStep || presentStep < startMainStep) {
            return this.answerTestContrastFlowRate
          } else if (presentStep <= this.answerTimingDecisionContrast1ProcessDoneStep) {
            return this.answerContrast1FlowRate
          } else {
            return this.answerContrast2FlowRate
          }
        } else {
          const startMainStep = Math.max(this.answerTimingDecisionTestProcessDoneStep, this.injectedStep)
          if (presentStep <= this.answerTimingDecisionTestProcessDoneStep || presentStep < startMainStep) {
            return this.answerTestContrastFlowRate
          } else {
            return this.answerContrastFlowRate
          }
        }
      } else {
        if (this.isAnswerHasTwoPeriodContrast) {
          if (presentStep <= this.answerTimingDecisionContrast1ProcessDoneStep) {
            return this.answerContrast1FlowRate
          } else {
            return this.answerContrast2FlowRate
          }
        } else {
          return this.answerContrastFlowRate
        }
      }
    },
    presentationImageNo() {
      const presentStep = this.sliceIndex
      const testContrastDuration =
        this.answerTestContrastDuration == 0
          ? 0
          : Math.max(
              this.MIN_CONTRAST_DURATION_TIME * this.frameRate,
              this.answerTestContrastDuration * this.duationRate
            )
      const contrast1Duration =
        this.answerContrast1Duration == 0
          ? 0
          : Math.max(this.MIN_CONTRAST_DURATION_TIME * this.frameRate, this.answerContrast1Duration * this.duationRate)
      const contrast2Duration =
        this.answerContrast2Duration == 0
          ? 0
          : Math.max(this.MIN_CONTRAST_DURATION_TIME * this.frameRate, this.answerContrast2Duration * this.duationRate)
      const contrastDuration =
        this.answerContrastDuration == 0
          ? 0
          : Math.max(this.MIN_CONTRAST_DURATION_TIME * this.frameRate, this.answerContrastDuration * this.duationRate)
      const endingPeriod = this.endingPeriod
      const endingPeriodCycle = {
        start: Math.max(endingPeriod.start, endingPeriod.end - 4),
        end: endingPeriod.end,
      }
      const endingPeriodCycleStepTotal = endingPeriodCycle.end - endingPeriodCycle.start + 1
      if (this.isAnswerHasTestContrast) {
        if (this.isAnswerHasTwoPeriodContrast) {
          // TEST CONTRAST AND TWO CONTRASTS
          if (presentStep < this.answerTimingDecisionTestProcessInjectedStep || testContrastDuration <= 0) {
            const period = _.get(this.presentationPeriods, [0], { start: 0, end: 0 })
            return (presentStep % (period.start - 1)) + 1
          } else if (presentStep <= this.answerTimingDecisionTestProcessDoneStep) {
            // TEST PROCESS
            const periodNumber = 0
            const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
            // ONLY CHANGED LOGIC IN HERE
            const currentSeconds =
              (presentStep - this.answerTimingDecisionTestProcessInjectedStep) * this.frameRate +
              this.answerInjectedSecondsBeforeStartViewTimingDecision +
              this.answerTimingDecisionScanDelay

            let presentationImageIndex = 0
            const duration = testContrastDuration
            // NO CHANGED
            if (currentSeconds < this.delayTimeToShowRoi) {
              const presentationJumpStep = period.start / this.delayTimeToShowRoi
              const step = Math.round(currentSeconds * presentationJumpStep)
              presentationImageIndex = Math.min(period.start, step)
            } else {
              const presentationJumpStep = (period.end - period.start) / duration
              const step = Math.round(period.start + (currentSeconds - this.delayTimeToShowRoi) * presentationJumpStep)
              presentationImageIndex = Math.min(period.end, step)
            }
            return presentationImageIndex
            // NO CHANGED
          } else if (presentStep <= this.answerTimingDecisionContrast1ProcessDoneStep) {
            // CONTRAST1 PROCESS
            const periodNumber = 1
            const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
            // MAIN PROCESS
            const startMainStep = Math.max(
              this.answerTimingDecisionTestProcessDoneStep,
              this.answerTimingDecisionContrast1InjectedStep
            )
            if (presentStep < startMainStep || contrast1Duration <= 0) {
              const endingStep = presentStep - this.answerTimingDecisionTestProcessDoneStep - 1
              if (endingPeriod.start + endingStep <= endingPeriod.end) {
                return endingPeriod.start + endingStep
              } else {
                const step = (endingPeriod.start + endingStep - endingPeriod.end) % endingPeriodCycleStepTotal
                return endingPeriodCycle.start + step
              }
            } else {
              // ONLY CHANGED LOGIC IN HERE
              const currentSeconds =
                (presentStep - startMainStep) * this.frameRate +
                this.answerInjectedSecondsBeforeStartViewTimingDecision +
                this.answerTimingDecisionScanDelay
              let presentationImageIndex = 0
              const duration = contrast1Duration
              // NO CHANGED
              const presentationJumpStep = (period.end - period.start) / duration
              const step = Math.round(period.start + currentSeconds * presentationJumpStep)
              presentationImageIndex = Math.min(period.end, step)
              return presentationImageIndex
              // NO CHANGED
            }
          } else {
            // CONTRAST2 PROCESS
            const periodNumber = 2
            const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
            // MAIN PROCESS
            const startMainStep = Math.max(
              this.answerTimingDecisionContrast1ProcessDoneStep,
              this.answerTimingDecisionContrast2InjectedStep
            )
            if (presentStep < startMainStep || contrast2Duration <= 0) {
              const endImageIndex = _.get(this.presentationPeriods, [periodNumber - 1, 'end'], 0)
              return endImageIndex
            } else if (presentStep <= this.answerTimingDecisionContrast2ProcessDoneStep) {
              // ONLY CHANGED LOGIC IN HERE
              const currentSeconds =
                (presentStep - startMainStep) * this.frameRate +
                this.answerInjectedSecondsBeforeStartViewTimingDecision +
                this.answerTimingDecisionScanDelay
              let presentationImageIndex = 0
              const duration = contrast2Duration
              // NO CHANGED
              const presentationJumpStep = (period.end - period.start) / duration
              const step = Math.round(period.start + currentSeconds * presentationJumpStep)
              presentationImageIndex = Math.min(period.end, step)
              return presentationImageIndex
            } else {
              const endingStep = presentStep - this.answerTimingDecisionContrast2ProcessDoneStep - 1
              if (endingPeriod.start + endingStep <= endingPeriod.end) {
                return endingPeriod.start + endingStep
              } else {
                const step = (endingPeriod.start + endingStep - endingPeriod.end) % endingPeriodCycleStepTotal
                return endingPeriodCycle.start + step
              }
            }
          }
        } else {
          // TEST CONTRAST AND ONE CONTRAST
          if (presentStep < this.answerTimingDecisionTestProcessInjectedStep || testContrastDuration <= 0) {
            const period = _.get(this.presentationPeriods, [0], { start: 0, end: 0 })
            return (presentStep % (period.start - 1)) + 1
          } else if (presentStep <= this.answerTimingDecisionTestProcessDoneStep) {
            // TEST PROCESS
            const periodNumber = 0
            const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
            // ONLY CHANGED LOGIC IN HERE
            const currentSeconds =
              (presentStep - this.answerTimingDecisionTestProcessInjectedStep) * this.frameRate +
              this.answerInjectedSecondsBeforeStartViewTimingDecision +
              this.answerTimingDecisionScanDelay

            let presentationImageIndex = 0
            const duration = testContrastDuration
            // NO CHANGED
            if (currentSeconds < this.delayTimeToShowRoi) {
              const presentationJumpStep = period.start / this.delayTimeToShowRoi
              const step = Math.round(currentSeconds * presentationJumpStep)
              presentationImageIndex = Math.min(period.start, step)
            } else {
              const presentationJumpStep = (period.end - period.start) / duration
              const step = Math.round(period.start + (currentSeconds - this.delayTimeToShowRoi) * presentationJumpStep)
              presentationImageIndex = Math.min(period.end, step)
            }
            return presentationImageIndex
            // NO CHANGED
          } else {
            // CONTRAST PROCESS
            const periodNumber = 1
            const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
            // MAIN PROCESS
            const startMainStep = Math.max(this.answerTimingDecisionTestProcessDoneStep, this.injectedStep)
            if (presentStep < startMainStep || contrastDuration <= 0) {
              const endingStep = presentStep - this.answerTimingDecisionTestProcessDoneStep - 1
              if (endingPeriod.start + endingStep <= endingPeriod.end) {
                return endingPeriod.start + endingStep
              } else {
                const step = (endingPeriod.start + endingStep - endingPeriod.end) % endingPeriodCycleStepTotal
                return endingPeriodCycle.start + step
              }
            } else if (presentStep <= this.answerTimingDecisionContrastProcessDoneStep) {
              // ONLY CHANGED LOGIC IN HERE
              const currentSeconds =
                (presentStep - startMainStep) * this.frameRate +
                this.answerInjectedSecondsBeforeStartViewTimingDecision +
                this.answerTimingDecisionScanDelay
              let presentationImageIndex = 0
              const duration = contrastDuration
              // NO CHANGED
              if (currentSeconds < this.delayTimeToShowRoi) {
                presentationImageIndex = 0
              } else {
                const presentationJumpStep = (period.end - period.start) / duration
                const step = Math.round(
                  period.start + (currentSeconds - this.delayTimeToShowRoi) * presentationJumpStep
                )
                presentationImageIndex = Math.min(period.end, step)
              }
              return presentationImageIndex
              // NO CHANGED
            } else {
              const endingStep = presentStep - this.answerTimingDecisionContrastProcessDoneStep - 1
              if (endingPeriod.start + endingStep <= endingPeriod.end) {
                return endingPeriod.start + endingStep
              } else {
                const step = (endingPeriod.start + endingStep - endingPeriod.end) % endingPeriodCycleStepTotal
                return endingPeriodCycle.start + step
              }
            }
          }
        }
      } else {
        if (this.isAnswerHasTwoPeriodContrast) {
          // TWO CONTRASTS
          if (presentStep < this.answerTimingDecisionContrast1InjectedStep || contrast1Duration <= 0) {
            const period = _.get(this.presentationPeriods, [0], { start: 0, end: 0 })
            return (presentStep % (period.start - 1)) + 1
          } else if (presentStep <= this.answerTimingDecisionContrast1ProcessDoneStep) {
            // CONTRAST1 PROCESS
            const periodNumber = 0
            const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
            // MAIN PROCESS
            const startMainStep = this.answerTimingDecisionContrast1InjectedStep
            const currentSeconds =
              (presentStep - startMainStep) * this.frameRate +
              this.answerInjectedSecondsBeforeStartViewTimingDecision +
              this.answerTimingDecisionScanDelay
            let presentationImageIndex = 0
            const duration = contrast1Duration
            // NO CHANGED
            if (currentSeconds < this.delayTimeToShowRoi) {
              const presentationJumpStep = period.start / this.delayTimeToShowRoi
              const step = Math.round(currentSeconds * presentationJumpStep)
              presentationImageIndex = Math.min(period.start, step)
            } else {
              const presentationJumpStep = (period.end - period.start) / duration
              const step = Math.round(period.start + (currentSeconds - this.delayTimeToShowRoi) * presentationJumpStep)
              presentationImageIndex = Math.min(period.end, step)
            }
            return presentationImageIndex
          } else {
            // CONTRAST2 PROCESS
            const periodNumber = 1
            const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
            // MAIN PROCESS
            const startMainStep = Math.max(
              this.answerTimingDecisionContrast1ProcessDoneStep,
              this.answerTimingDecisionContrast2InjectedStep
            )
            if (presentStep < startMainStep || contrast2Duration <= 0) {
              const endImageIndex = _.get(this.presentationPeriods, [periodNumber - 1, 'end'], 0)
              return endImageIndex
            } else if (presentStep <= this.answerTimingDecisionContrast2ProcessDoneStep) {
              // ONLY CHANGED LOGIC IN HERE
              const currentSeconds =
                (presentStep - startMainStep) * this.frameRate +
                this.answerInjectedSecondsBeforeStartViewTimingDecision +
                this.answerTimingDecisionScanDelay
              let presentationImageIndex = 0
              const duration = contrast2Duration
              // NO CHANGED
              const presentationJumpStep = (period.end - period.start) / duration
              const step = Math.round(period.start + currentSeconds * presentationJumpStep)
              presentationImageIndex = Math.min(period.end, step)
              return presentationImageIndex
            } else {
              const endingStep = presentStep - this.answerTimingDecisionContrast2ProcessDoneStep - 1
              if (endingPeriod.start + endingStep <= endingPeriod.end) {
                return endingPeriod.start + endingStep
              } else {
                const step = (endingPeriod.start + endingStep - endingPeriod.end) % endingPeriodCycleStepTotal
                return endingPeriodCycle.start + step
              }
            }
          }
        } else {
          // ONE CONTRAST
          if (presentStep < this.injectedStep || contrastDuration <= 0) {
            const period = _.get(this.presentationPeriods, [0], { start: 0, end: 0 })
            return (presentStep % (period.start - 1)) + 1
          } else {
            // CONTRAST PROCESS
            const periodNumber = 0
            const period = _.get(this.presentationPeriods, [periodNumber], { start: 0, end: 0 })
            // MAIN PROCESS
            const startMainStep = this.injectedStep
            const currentSeconds =
              (presentStep - startMainStep) * this.frameRate +
              this.answerInjectedSecondsBeforeStartViewTimingDecision +
              this.answerTimingDecisionScanDelay
            let presentationImageIndex = 0
            const duration = contrastDuration
            // NO CHANGED
            if (currentSeconds < this.delayTimeToShowRoi) {
              const presentationJumpStep = period.start / this.delayTimeToShowRoi
              const step = Math.round(currentSeconds * presentationJumpStep)
              presentationImageIndex = Math.min(period.start, step)
            } else if (presentStep <= this.answerTimingDecisionContrastProcessDoneStep) {
              const presentationJumpStep = (period.end - period.start) / duration
              const step = Math.round(period.start + (currentSeconds - this.delayTimeToShowRoi) * presentationJumpStep)
              presentationImageIndex = Math.min(period.end, step)
            } else {
              const endingStep = presentStep - this.answerTimingDecisionContrastProcessDoneStep - 1
              if (endingPeriod.start + endingStep <= endingPeriod.end) {
                presentationImageIndex = endingPeriod.start + endingStep
              } else {
                const step = (endingPeriod.start + endingStep - endingPeriod.end) % endingPeriodCycleStepTotal
                presentationImageIndex = endingPeriodCycle.start + step
              }
            }
            return presentationImageIndex
          }
        }
      }
    },
    duationRate() {
      return this.awswerPatientPhysioInfoCardiacCycleDuration / DEFAULT_CARDIAC_CYCLE_DURATION
    },
    testDuration() {
      const testContrastDuration =
        this.answerTestContrastDuration == 0
          ? 0
          : Math.max(
              this.MIN_CONTRAST_DURATION_TIME * this.frameRate,
              this.answerTestContrastDuration * this.duationRate
            )
      return testContrastDuration
    },
    bolusTrackingDurationDuration() {
      const contrastDuration =
        this.answerContrastDuration == 0
          ? 0
          : Math.max(this.MIN_CONTRAST_DURATION_TIME * this.frameRate, this.answerContrastDuration * this.duationRate)
      return contrastDuration
    },
    trackingDuration() {
      let startMainStep = Math.max(this.answerTimingDecisionTestProcessDoneStep, this.injectedStep)
      if (this.isHasTwoPeriodContrast) {
        startMainStep = Math.max(
          this.answerTimingDecisionTestProcessDoneStep,
          this.answerTimingDecisionContrast1InjectedStep
        )
      }
      let presentStep = this.sliceIndex
      if (this.answerIsTimingDecisionUseTestBolus && this.isAnswerHasTestContrast && presentStep <= startMainStep) {
        return this.testDuration
      } else {
        return this.bolusTrackingDurationDuration
      }
    },
    brightnessOfPresentationImage() {
      if (this.currentContrastFlowRate <= 1) {
        // 50
        return -0.55
      } else if (this.currentContrastFlowRate <= 1.5) {
        // 100
        return -0.48
      } else if (this.currentContrastFlowRate <= 2) {
        // 150
        return -0.41
      } else if (this.currentContrastFlowRate <= 2.5) {
        // 200
        return -0.35
      } else if (this.currentContrastFlowRate <= 3) {
        // 250
        return -0.27
      } else if (this.currentContrastFlowRate <= 3.5) {
        // 300
        return -0.2
      } else if (this.currentContrastFlowRate <= 4) {
        // 350
        return -0.13
      } else if (this.currentContrastFlowRate <= 4.5) {
        // 400
        return -0.06
      } else {
        // 450
        return 0
      }
    },
    contrastOfPresentationImage() {
      return this.answerPreviewContrast
    },
    pointer: {
      get() {
        return {
          x: _.get(this.initPointer, ['x'], 0),
          y: _.get(this.initPointer, ['y'], 0),
          radius: _.get(this.initPointer, ['radius'], this.DEFAULT_ROI_RADIUS),
          scaleX: _.get(this.initPointer, ['scaleX'], 1),
          scaleY: _.get(this.initPointer, ['scaleY'], 1),
          strokeWidth: _.get(this.initPointer, ['strokeWidth'], this.DEFAULT_ROI_STROKE_WIDTH),
          imageScale: _.get(this.initPointer, ['imageScale'], this.previewImageScale || 1),
        }
      },
      set() {},
    },
    numOfSteps() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.presentationTimingDecisionStep)
      return _.get(answer, ['presentationTimingDecisionStep'], 0)
    },
    initPointer() {
      const userAnswers = _.get(this.stackQuestionResult, ['userAnswers'], [])
      const pointerFromAnswerRaw = userAnswers.find((o) => o.timingDecisionPointer)?.timingDecisionPointer
      const pointerFromInfoRaw = _.get(userAnswers, [0, 'timingDecisionInfo', 'timingDecisionPointer'])

      const normalizePointer = (pointer) =>
        pointer
          ? {
              x: _.get(pointer, 'x', 0),
              y: _.get(pointer, 'y', 0),
              radius: _.get(pointer, 'radius', this.DEFAULT_ROI_RADIUS),
              scaleX: _.get(pointer, 'scaleX', 1),
              scaleY: _.get(pointer, 'scaleY', 1),
              strokeWidth: _.get(pointer, 'strokeWidth', this.DEFAULT_ROI_STROKE_WIDTH),
              imageScale: _.get(pointer, 'imageScale', this.previewImageScale || 1),
            }
          : null

      const pointerFromAnswer = normalizePointer(pointerFromAnswerRaw)
      const pointerFromInfo = normalizePointer(pointerFromInfoRaw)

      return pointerFromAnswer || pointerFromInfo || {
        x: 0,
        y: 0,
        radius: this.DEFAULT_ROI_RADIUS,
        scaleX: 1,
        scaleY: 1,
        strokeWidth: this.DEFAULT_ROI_STROKE_WIDTH,
        imageScale: 1,
      }
    },
    frameRate() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.timingDecisionFlouroFrameRate)
      return _.get(answer, ['timingDecisionFlouroFrameRate'], 2)
    },
    injectedStep() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['timingDecisionInjectedStep'])
      )
      return _.get(answer, ['timingDecisionInjectedStep'], 0)
    },
    answerTimingDecisionContrast1InjectedStep() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['timingDecisionContrast1InjectedStep'])
      )
      return _.get(answer, ['timingDecisionContrast1InjectedStep'], 0)
    },
    answerTimingDecisionContrast2InjectedStep() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['timingDecisionContrast2InjectedStep'])
      )
      return _.get(answer, ['timingDecisionContrast2InjectedStep'], 0)
    },
    answerTimingDecisionContrast1ProcessDoneStep() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['timingDecisionContrast1ProcessDoneStep'])
      )
      return _.get(answer, ['timingDecisionContrast1ProcessDoneStep'], 0)
    },
    answerTimingDecisionContrast2ProcessDoneStep() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['timingDecisionContrast2ProcessDoneStep'])
      )
      return _.get(answer, ['timingDecisionContrast2ProcessDoneStep'], 0)
    },
    answerTimingDecisionContrastProcessDoneStep() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['timingDecisionContrastProcessDoneStep'])
      )
      return _.get(answer, ['timingDecisionContrastProcessDoneStep'], 0)
    },
    answerContrastDuration() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['currentContrastDuration'])
      )
      return _.get(answer, ['currentContrastDuration'], 0)
    },
    answerContrast1Duration() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['currentContrast1Duration'])
      )
      return _.get(answer, ['currentContrast1Duration'], 0)
    },
    answerContrast2Duration() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['currentContrast2Duration'])
      )
      return _.get(answer, ['currentContrast2Duration'], 0)
    },
    answerTestContrastDuration() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['currentTestContrastDuration'])
      )
      return _.get(answer, ['currentTestContrastDuration'], 0)
    },
    answerContrastFlowRate() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.contrastFlowRate)
      return _.get(answer, ['contrastFlowRate'], 1)
    },
    answerContrast1FlowRate() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.contrast1FlowRate)
      return _.get(answer, ['contrast1FlowRate'], 1)
    },
    answerContrast2FlowRate() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.contrast2FlowRate)
      return _.get(answer, ['contrast2FlowRate'], 1)
    },
    answerTestContrastFlowRate() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.testContrastFlowRate)
      return _.get(answer, ['testContrastFlowRate'], 1)
    },
    answerInjectedSecondsBeforeStartViewTimingDecision() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find(
        (o) => o.injectedSecondsBeforeStartViewTimingDecision
      )
      return _.get(answer, ['injectedSecondsBeforeStartViewTimingDecision'], 0)
    },
    answerTimingDecisionScanDelay() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.timingDecisionScanDelay)
      return _.get(answer, ['timingDecisionScanDelay'], 0)
    },
    answerTimingDecisionStep() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.timingDecisionStep)
      return _.get(answer, ['timingDecisionStep'], 134)
    },
    answerTestInjectorProtocol() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.testInjectorProtocol)
      return _.get(answer, ['testInjectorProtocol'], 1)
    },
    answerPreviewContrast() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => _.has(o, ['previewContrast']))
      return _.get(answer, ['previewContrast'], false)
    },
    answerTimingDecisionTestProcessInjectedStep() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) =>
        _.has(o, ['timingDecisionTestProcessInjectedStep'])
      )
      return _.get(answer, ['timingDecisionTestProcessInjectedStep'], 10000)
    },
    answerTimingDecisionTestProcessDoneStep() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find(
        (o) => o.timingDecisionTestProcessDoneStep
      )
      return _.get(answer, ['timingDecisionTestProcessDoneStep'], 0)
    },
    answerIsTimingDecisionUseTestBolus() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.isTimingDecisionUseTestBolus)
      return _.get(answer, ['isTimingDecisionUseTestBolus'], false)
    },
    awswerPatientPhysioInfoCardiacCycleDuration() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find(
        (o) => o.patientPhysioInfoCardiacCycleDuration
      )
      return _.get(answer, ['patientPhysioInfoCardiacCycleDuration'], DEFAULT_CARDIAC_CYCLE_DURATION)
    },
    answerPatientPhysioInfoStrokeVolume() {
      const answer = _.get(this.stackQuestionResult, ['userAnswers'], []).find((o) => o.patientPhysioInfoStrokeVolume)
      return _.get(answer, ['patientPhysioInfoStrokeVolume'], 40)
    },
  },
  watch: {
    pointer: {
      deep: true,
      handler: function () {
        this.drawCanvasBackground()
      },
    },
    sliceIndex: 'drawCanvasBackground',
    imageUrl: 'drawCanvasBackground',
    currentBrightness: 'drawCanvasBackground',
    contrastOfPresentationImage: 'drawCanvasBackground',
    preloadPercent: function () {
      if (!this.canvas) {
        return
      }
      if (this.preloadPercent != 100) {
        return
      }
      this.drawCanvasBackground()
    },
    currentTestContrastDuration: 'onPredownLoadPresentationImages',
    currentContrastDuration: 'onPredownLoadPresentationImages',
    delayTimeToShowRoi: 'onPredownLoadPresentationImages',
    timingDecisionContrastAlbum: 'onPredownLoadPresentationImages',
    brightnessOfPresentationImage: function () {
      this.currentBrightness = this.brightnessOfPresentationImage
    },
  },
  mounted() {
    this.currentBrightness = this.brightnessOfPresentationImage
    this.resetPreloadImages()
    this.onInitCanvas()

    this.loadProbeJsonData('/img/probeData.zip')

    this.drawCanvasBackground()
    this.onPredownLoadPresentationImages()

    window.addEventListener('resize', this.onWindowSizeChanged)
    this.$refs.container.addEventListener('contextmenu', this.onContextMenu)
  },
  beforeDestroy() {
    if (this.canvas) {
      this.canvas.clear()
      this.canvas = null
    }
    this.resetPreloadImages()
    window.removeEventListener('resize', this.onWindowSizeChanged)
    this.$refs.container.removeEventListener('contextmenu', this.onContextMenu)
  },
  methods: {
    ...mapActions('timingDecisionService', [
      'resetPreloadImages',
      'loadBrightnessMappingData',
      'loadSliceVascularData',
      'loadSliceHeartLayerData',
      'loadSliceLiverLayerData',
      'loadMultipleLayerSlicesZipFile',
      'setPreviewContrast',
      'loadProbeJsonData',
    ]),
    refreshCanvas(retries) {
      retries = retries || 0
      this.$nextTick(() => {
        if (this._isBeingDestroyed || this._isDestroyed) return
        if (!this.$refs.container) return
        const rect = this.$refs.container.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          // Container not visible yet (e.g. Vuetify tab transition in progress)
          if (retries < 10) {
            setTimeout(() => this.refreshCanvas(retries + 1), 50)
          }
          return
        }
        this.onInitCanvas()
        this.drawCanvasBackground()
      })
    },
    increaseBrightness() {
      this.currentBrightness += 0.1
      if (this.currentBrightness > 1) {
        this.currentBrightness = 1
      }
    },
    decreaseBrightness() {
      this.currentBrightness -= 0.1
      if (this.currentBrightness < -1) {
        this.currentBrightness = -1
      }
    },
    getFitScale(imgWidth, imgHeight) {
      const scaleX = this.canvasRealWidth / imgWidth
      const scaleY = this.canvasRealHeight / imgHeight

      return Math.min(scaleX, scaleY)
    },
    getCurrentBreathingPhaseIndex() {
      const BREATHING_PHASE_COUNT = 4
      const index =
        Math.round(this.sliceIndex / this.frameRate) %
        BREATHING_PHASE_COUNT

      return index
    },
    onWindowSizeChanged() {
      this.onInitCanvas()
      this.drawCanvasBackground()
    },
    getBrightnessMappingPath() {
      if (!this.answerPatientPhysioInfoStrokeVolume || !this.trackingDuration || !this.frameRate) {
        return null
      }

      const availableStrokeVolumes = [40, 70, 100]
      const nearestStrokeVolume = _.minBy(
        availableStrokeVolumes,
        (sv) => Math.abs(sv - this.answerPatientPhysioInfoStrokeVolume)
      )

      const mappingConfigs = [
        { duration: 2, volume: 10 },
        { duration: 3, volume: 15 },
        { duration: 4, volume: 20 },
        { duration: 5, volume: 25 },
        { duration: 6, volume: 30 },
        { duration: 7, volume: 35 },
        { duration: 8, volume: 40 },
        { duration: 9, volume: 45 },
        { duration: 10, volume: 50 },
        { duration: 12, volume: 60 },
        { duration: 15, volume: 75 },
        { duration: 17, volume: 85 },
        { duration: 19, volume: 95 },
        { duration: 21, volume: 105 },
        { duration: 23, volume: 115 },
        { duration: 24, volume: 120 },
        { duration: 30, volume: 150 },
        { duration: 33, volume: 165 },
        { duration: 36, volume: 180 },
        { duration: 40, volume: 200 },
      ]

      const durationSec = this.trackingDuration / this.frameRate
      const nearestConfig = _.minBy(mappingConfigs, (item) => Math.abs(item.duration - durationSec))
      if (!nearestConfig) {
        return null
      }

      const { duration, volume } = nearestConfig
      return `/img/timing-decision-album-multiple-layer/contrastMappings/sv${nearestStrokeVolume}ml_${duration}s_${volume}ml_volume.zip`
    },
    getSliceVascularPath() {
      return `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/vascular.zip`
    },
    getSliceHeartLayerPath() {
      return `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/heart_BG.zip`
    },
    getSliceLiverLayerPath() {
      return `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/liver.zip`
    },
    getMultipleLayerFolderZipPath() {
      return {
        folderPath: `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}`,
        zipPath: `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/heart.zip`,
      }
    },
    onPredownLoadAllPresentationImagesOfCurrentAlbum() {
      const brightnessPath = this.getBrightnessMappingPath()
      if (brightnessPath) {
        this.loadBrightnessMappingData(brightnessPath)
      }
      this.loadSliceVascularData({
        zipPath: this.getSliceVascularPath(),
        albumNo: this.timingDecisionContrastAlbum,
      })
      if (this.timingDecisionContrastAlbum != 75) {
        this.loadSliceHeartLayerData({
          zipPath: this.getSliceHeartLayerPath(),
          albumNo: this.timingDecisionContrastAlbum,
        })
        this.loadSliceLiverLayerData({
          zipPath: this.getSliceLiverLayerPath(),
          albumNo: this.timingDecisionContrastAlbum,
        })
      }
      const multipleLayerFolder = this.getMultipleLayerFolderZipPath()
      this.loadMultipleLayerSlicesZipFile(multipleLayerFolder)
    },
    onPredownLoadPresentationImages() {
      const durations = [
        this.answerContrastDuration,
        this.answerContrast1Duration,
        this.answerContrast2Duration,
        this.answerTestContrastDuration,
      ]
      const hasAnyDuration = durations.some((val) => Number(val) > 0)
      if (!hasAnyDuration) {
        return
      }
      this.onPredownLoadAllPresentationImagesOfCurrentAlbum()
    },
    onInitCanvas() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      if (!this.canvas) {
        let c = this.$refs.canvas
        c.width = boundingRec.width
        c.height = boundingRec.height
        this.canvas = new fabric.Canvas('timingDecisionROIPreviewCanvas', {
          width: boundingRec.width,
          height: boundingRec.height,
          fireRightClick: true,
        })

        this.canvas.on({
          'mouse:down': this.onMouseDown,
          'mouse:move': this.onMouseMove,
          'mouse:up': this.onMouseUp,
        })
      }

      // Only resize if container has valid dimensions — avoids zeroing out
      // the canvas when called before the container is visible
      if (boundingRec.width > 0 && boundingRec.height > 0) {
        this.canvas.setDimensions({
          width: boundingRec.width,
          height: boundingRec.height,
        })
      }
    },
    onContextMenu(e) {
      e.preventDefault()
    },
    formatNumber(input) {
      const thousands = parseInt(input / 1000)
      const hundreds = parseInt((input - thousands * 1000) / 100)
      const dozens = parseInt((input - thousands * 1000 - hundreds * 100) / 10)
      const units = input - thousands * 1000 - hundreds * 100 - dozens * 10

      return `${thousands}${hundreds}${dozens}${units}`
    },
    async drawCanvasBackground() {
      if (!this.canvas) return
      if (this.$refs.container) {
        const boundingRec = this.$refs.container.getBoundingClientRect()
        if (boundingRec.width > 0 && boundingRec.height > 0) {
          // Only call setDimensions when size actually changed — avoids
          // clearing the HTML canvas bitmap on every watcher trigger
          if (this.canvasRealWidth !== boundingRec.width || this.canvasRealHeight !== boundingRec.height) {
            this.canvas.setDimensions({
              width: boundingRec.width,
              height: boundingRec.height,
            })
          }
          this.canvasRealWidth = boundingRec.width
          this.canvasRealHeight = boundingRec.height
        }
      }
      await this.drawBaseLayerImage()
      await this.drawVascularImage()
      await this.drawLiverLayerImage()
      await this.drawHeartLayerImage()
      this.drawMultipleLayerImages()
    },
    drawMultipleLayerImages() {
      if (this.backgroundImage) {
        this.canvas.remove(this.backgroundImage)
      }

      const imageNo = this.presentationImageNo
      const layers = Object.entries(this.multipleLayerImageGroupedByFolder)
      const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()
      for (const [folderName, images] of layers) {
        const brightnessKey = (folderName || '').split('/').pop()

        let mappedBrightness =
          this.multipleLayerBrightnessMappingData[brightnessKey] ||
          this.multipleLayerBrightnessMappingData[`${brightnessKey}.png`]

        let brightness = 0
        if (mappedBrightness && mappedBrightness.length) {
          brightness = mappedBrightness[imageNo % mappedBrightness.length]
        }

        let maximumDyeConcentration = _.max(mappedBrightness || [])
        maximumDyeConcentration = Math.max(0.0001, maximumDyeConcentration || 0.0001)
        let opacity = brightness / maximumDyeConcentration
        opacity = Math.min(Math.max(opacity, 0), 1)

        let candidateImages = images
        const hasBreathingPhase = images.some((img) => typeof img.breathingPhase === 'number')
        if (hasBreathingPhase) {
          const phaseImages = images.filter((img) => (img.breathingPhase || 0) === breathingPhaseIndex)
          if (phaseImages.length > 0) {
            candidateImages = phaseImages
          }
        }

        const image = candidateImages[imageNo % candidateImages.length]
        if (!image) continue

        const canvasObjects = this.canvas.getObjects()
        const existingImage = canvasObjects.find((obj) => obj.layerImage && obj.fileName === image.fileName)
        const cacheImage = FABRIC_IMAGES_CACHE.find((el) => el.fileName == image.fileName && el.path == image.path)

        if (existingImage) {
          existingImage.filters = []
          existingImage.set({ opacity })

          let filter = new fabric.Image.filters.Brightness({
            brightness: this.brightnessOfPresentationImage,
          })
          existingImage.filters.push(filter)
          filter = this.getContrastFilter()
          existingImage.filters.push(filter)
          existingImage.applyFilters()
          continue
        }

        const existingFolderImage = canvasObjects.find((obj) => obj.layerImage && obj.folderName === folderName)
        if (existingFolderImage) {
          this.canvas.remove(existingFolderImage)
        }

        if (cacheImage && cacheImage.img) {
          const standardWidth = 1024
          const standardHeight = 778
          const baseScale = this.getFitScale(standardWidth, standardHeight)
          const scaleX = (standardWidth / cacheImage.img.width) * baseScale
          const scaleY = (standardHeight / cacheImage.img.height) * baseScale
          this.previewImageScale = scaleX

          cacheImage.img.crossOrigin = 'anonymous'
          cacheImage.img.set({
            left: this.canvasRealWidth / 2 - (cacheImage.img.width * scaleX) / 2,
            top: this.canvasRealHeight / 2 - (cacheImage.img.height * scaleY) / 2,
          })
          cacheImage.img.scaleX = scaleX
          cacheImage.img.scaleY = scaleY
          cacheImage.img.set({ opacity })
          cacheImage.img.evented = false
          cacheImage.img.selectable = false
          cacheImage.img.fileName = image.fileName
          cacheImage.img.layerImage = true
          cacheImage.img.folderName = folderName
          cacheImage.img.filters = []

          let filter = new fabric.Image.filters.Brightness({
            brightness: this.brightnessOfPresentationImage,
          })
          cacheImage.img.filters.push(filter)
          filter = this.getContrastFilter()
          cacheImage.img.filters.push(filter)
          cacheImage.img.applyFilters()

          this.canvas.add(cacheImage.img)

          this.drawCircle(cacheImage.img.scaleX)
        }
      }

      this.canvas.renderAll()
    },
    async drawHeartLayerImage() {
      const allImages = (this.preloadHeartLayerImages || []).filter(
        (el) => String(el.albumNo) === String(this.timingDecisionContrastAlbum)
      )

      const canvasObjects = this.canvas.getObjects()
      const existingHeartLayerImage = canvasObjects.find((obj) => obj.heartLayerImage)

      if (!allImages.length) {
        if (existingHeartLayerImage) {
          this.canvas.remove(existingHeartLayerImage)
        }
        return
      }

      const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()
      let imagesForPhase = allImages
      const hasBreathingPhase = allImages.some((img) => typeof img.breathingPhase === 'number')
      if (hasBreathingPhase) {
        const phaseImages = allImages.filter((img) => (img.breathingPhase || 0) === breathingPhaseIndex)
        if (phaseImages.length > 0) {
          imagesForPhase = phaseImages
        }
      }

      const imageNo = this.presentationImageNo
      const image = imagesForPhase[imageNo % imagesForPhase.length]

      if (!image) {
        if (existingHeartLayerImage) {
          this.canvas.remove(existingHeartLayerImage)
        }
        return
      }

      const cacheImage = FABRIC_IMAGES_CACHE.find((el) => el.fileName == image.fileName && el.path == image.path)
      if (!cacheImage || !cacheImage.img) {
        if (existingHeartLayerImage) {
          this.canvas.remove(existingHeartLayerImage)
        }
        return
      }

      if (existingHeartLayerImage) {
        this.canvas.remove(existingHeartLayerImage)
      }

      const standardWidth = 1024
      const standardHeight = 778
      const baseScale = this.getFitScale(standardWidth, standardHeight)
      const scaleX = (standardWidth / cacheImage.img.width) * baseScale
      const scaleY = (standardHeight / cacheImage.img.height) * baseScale

      cacheImage.img.crossOrigin = 'anonymous'
      cacheImage.img.set({
        left: this.canvasRealWidth / 2 - (cacheImage.img.width * scaleX) / 2,
        top: this.canvasRealHeight / 2 - (cacheImage.img.height * scaleY) / 2,
      })
      cacheImage.img.scaleX = scaleX
      cacheImage.img.scaleY = scaleY
      cacheImage.img.evented = false
      cacheImage.img.selectable = false
      cacheImage.img.fileName = image.fileName
      cacheImage.img.heartLayerImage = true
      cacheImage.img.filters = []

      let filter = this.getContrastFilter()
      cacheImage.img.filters.push(filter)
      cacheImage.img.applyFilters()

      this.canvas.add(cacheImage.img)
      this.canvas.moveTo(cacheImage.img, 2)
    },
    async drawLiverLayerImage() {
      if (!this.canvas) return

      const allImages = (this.preloadLiverLayerImages || []).filter(
        (el) => String(el.albumNo) === String(this.timingDecisionContrastAlbum)
      )

      const canvasObjects = this.canvas.getObjects()
      const existingLiverLayerImage = canvasObjects.find((obj) => obj.liverLayerImage)

      if (!allImages.length) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.canvas.renderAll()
        }
        return
      }

      const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()
      let imagesForPhase = allImages
      const hasBreathingPhase = allImages.some((img) => typeof img.breathingPhase === 'number')
      if (hasBreathingPhase) {
        const phaseImages = allImages.filter((img) => (img.breathingPhase || 0) === breathingPhaseIndex)
        if (phaseImages.length > 0) {
          imagesForPhase = phaseImages
        }
      }

      const imageNo = this.presentationImageNo
      const image = imagesForPhase[imageNo % imagesForPhase.length]

      if (!image) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.canvas.renderAll()
        }
        return
      }

      const brightnessKey = (image.fileName || '').replace(/\\.png$/i, '')
      let mappedBrightness =
        this.multipleLayerBrightnessMappingData[brightnessKey] ||
        this.multipleLayerBrightnessMappingData[`${brightnessKey}.png`]
      if (!mappedBrightness || !mappedBrightness.length) {
        mappedBrightness =
          this.multipleLayerBrightnessMappingData['liver'] ||
          this.multipleLayerBrightnessMappingData['liver.png']
      }
      let brightness = 0
      if (mappedBrightness && mappedBrightness.length) {
        brightness = mappedBrightness[imageNo % mappedBrightness.length]
      }
      let maximumDyeConcentration = _.max(mappedBrightness || [])
      maximumDyeConcentration = Math.max(0.0001, maximumDyeConcentration || 0.0001)
      let opacity = brightness / maximumDyeConcentration
      opacity = Math.min(Math.max(opacity, 0), 1)

      const cacheImage = FABRIC_IMAGES_CACHE.find((el) => el.fileName == image.fileName && el.path == image.path)
      if (!cacheImage || !cacheImage.img) {
        if (existingLiverLayerImage) {
          this.canvas.remove(existingLiverLayerImage)
          this.canvas.renderAll()
        }
        return
      }

      if (existingLiverLayerImage) {
        this.canvas.remove(existingLiverLayerImage)
      }

      const standardWidth = 1024
      const standardHeight = 778
      const baseScale = this.getFitScale(standardWidth, standardHeight)
      const scaleX = (standardWidth / cacheImage.img.width) * baseScale
      const scaleY = (standardHeight / cacheImage.img.height) * baseScale

      cacheImage.img.crossOrigin = 'anonymous'
      cacheImage.img.set({
        left: this.canvasRealWidth / 2 - (cacheImage.img.width * scaleX) / 2,
        top: this.canvasRealHeight / 2 - (cacheImage.img.height * scaleY) / 2,
        opacity,
      })
      cacheImage.img.scaleX = scaleX
      cacheImage.img.scaleY = scaleY
      cacheImage.img.evented = false
      cacheImage.img.selectable = false
      cacheImage.img.fileName = image.fileName
      cacheImage.img.path = image.path
      cacheImage.img.liverLayerImage = true
      cacheImage.img.breathingPhase = breathingPhaseIndex
      cacheImage.img.filters = []

      let filter = this.getContrastFilter()
      cacheImage.img.filters.push(filter)
      cacheImage.img.applyFilters()

      this.canvas.add(cacheImage.img)
      this.canvas.moveTo(cacheImage.img, 1)
      this.canvas.renderAll()
    },
    async drawBaseLayerImage() {
      return new Promise((resolve) => {
        try {
          const boundingRec = this.$refs.container.getBoundingClientRect()
          if (boundingRec.width > 0 && boundingRec.height > 0) {
            this.canvasRealWidth = boundingRec.width
            this.canvasRealHeight = boundingRec.height
          }
          const breathingImageNo = this.getCurrentBreathingPhaseIndex() + 1
          const imgUrl = `/img/timing-decision-album-multiple-layer/${this.timingDecisionContrastAlbum}/baseLayer/baseLayer.0000${breathingImageNo}.jpg`
          fabric.Image.fromURL(imgUrl, (img) => {
            if (this.baseLayerImage) {
              this.canvas.remove(this.baseLayerImage)
            }
            this.baseLayerImage = img

            const standardWidth = 1024
            const standardHeight = 778
            const baseScale = this.getFitScale(standardWidth, standardHeight)
            const scaleX = (standardWidth / img.width) * baseScale
            const scaleY = (standardHeight / img.height) * baseScale
            this.previewImageScale = scaleX

            img.crossOrigin = 'anonymous'
            img.set({
              left: this.canvasRealWidth / 2 - (img.width * scaleX) / 2,
              top: this.canvasRealHeight / 2 - (img.height * scaleY) / 2,
            })
            img.scaleX = scaleX
            img.scaleY = scaleY
            img.evented = false
            img.selectable = false
            img.filters = []

            let filter = this.getContrastFilter()
            img.filters.push(filter)
            img.applyFilters()

            this.canvas.add(this.baseLayerImage)
            this.canvas.moveTo(img, 0)

            resolve()
          })
        } catch (err) {
          resolve()
        }
      })
    },
    async drawVascularImage() {
      if (!this.canvas) return

      const allImages = (this.preloadVascularImages || []).filter(
        (img) => String(img.albumNo) === String(this.timingDecisionContrastAlbum)
      )

      if (!allImages.length) {
        const canvasObjects = this.canvas.getObjects()
        canvasObjects
          .filter((obj) => obj.vascularImage)
          .forEach((obj) => this.canvas.remove(obj))
        this.vascularLayerImage = null
        return
      }

      const breathingPhaseIndex = this.getCurrentBreathingPhaseIndex()
      const imageNo = this.presentationImageNo

      const canvasObjects = this.canvas.getObjects()
      const imagesByBrightnessKey = _.groupBy(allImages, (img) => {
        const fileName = img.fileName || ''
        const dotIndex = fileName.lastIndexOf('.')
        return dotIndex >= 0 ? fileName.substring(0, dotIndex) : fileName
      })

      for (const [brightnessKey, images] of Object.entries(imagesByBrightnessKey)) {
        if (!brightnessKey) continue

        let mappedBrightness =
          this.multipleLayerBrightnessMappingData[brightnessKey] ||
          this.multipleLayerBrightnessMappingData[`${brightnessKey}.png`]

        const existingImageForKey = canvasObjects.find(
          (obj) => obj.vascularImage && obj.vascularKey === brightnessKey
        )

        if (!mappedBrightness || !mappedBrightness.length) {
          if (existingImageForKey) {
            this.canvas.remove(existingImageForKey)
          }
          continue
        }

        let brightness = mappedBrightness[imageNo % mappedBrightness.length]
        let maximumDyeConcentration = _.max(mappedBrightness || [])
        maximumDyeConcentration = Math.max(0.0001, maximumDyeConcentration || 0.0001)

        let opacity = brightness / maximumDyeConcentration
        opacity = Math.min(Math.max(opacity, 0), 1)

        if (opacity <= 0.001) {
          if (existingImageForKey) {
            this.canvas.remove(existingImageForKey)
          }
          continue
        }

        let candidateImages = images
        const hasBreathingPhase = images.some((img) => typeof img.breathingPhase === 'number')
        if (hasBreathingPhase) {
          const phaseImages = images.filter((img) => (img.breathingPhase || 0) === breathingPhaseIndex)
          if (phaseImages.length > 0) {
            candidateImages = phaseImages
          }
        }

        const image = candidateImages[imageNo % candidateImages.length]
        if (!image) {
          if (existingImageForKey) {
            this.canvas.remove(existingImageForKey)
          }
          continue
        }

        const cacheImage = FABRIC_IMAGES_CACHE.find(
          (el) => el.fileName == image.fileName && el.path == image.path && el.timingDecisionStep == image.timingDecisionStep
        )

        if (!cacheImage || !cacheImage.img) {
          if (existingImageForKey) {
            this.canvas.remove(existingImageForKey)
          }
          continue
        }

        const standardWidth = 1024
        const standardHeight = 778
        const baseScale = this.getFitScale(standardWidth, standardHeight)
        const scaleX = (standardWidth / cacheImage.img.width) * baseScale
        const scaleY = (standardHeight / cacheImage.img.height) * baseScale

        if (existingImageForKey) {
          existingImageForKey.set({
            opacity,
          })
          existingImageForKey.filters = []
          let filter = new fabric.Image.filters.Brightness({
            brightness: this.brightnessOfPresentationImage,
          })
          existingImageForKey.filters.push(filter)
          filter = this.getContrastFilter()
          existingImageForKey.filters.push(filter)
          existingImageForKey.applyFilters()
          this.canvas.moveTo(existingImageForKey, 2)
          continue
        }

        const img = cacheImage.img

        img.crossOrigin = 'anonymous'
        img.set({
          left: this.canvasRealWidth / 2 - (img.width * scaleX) / 2,
          top: this.canvasRealHeight / 2 - (img.height * scaleY) / 2,
          opacity,
        })
        img.scaleX = scaleX
        img.scaleY = scaleY
        img.evented = false
        img.selectable = false
        img.fileName = image.fileName
        img.vascularImage = true
        img.vascularKey = brightnessKey
        img.filters = []

        let filter = new fabric.Image.filters.Brightness({
          brightness: this.brightnessOfPresentationImage,
        })
        img.filters.push(filter)
        filter = this.getContrastFilter()
        img.filters.push(filter)
        img.applyFilters()

        this.canvas.add(img)
        this.vascularLayerImage = img
        this.canvas.moveTo(img, 2)
      }

      this.canvas.renderAll()
    },
    getContrastFilter() {
      return new fabric.Image.filters.BlendColor({
        color: `rgba(255, 255, 255, 255)`,
        mode: 'add',
        alpha: this.contrastOfPresentationImage,
      })
    },
    drawCircle(currentImageScale = 1) {
      if (!this.canvas) {
        return
      }

      if (this.circleObject) {
        this.canvas.remove(this.circleObject)
      }

      if (_.isNil(this.pointer, ['x']) || _.isNil(this.pointer, ['y'])) {
        return
      }

      const boundingRec = this.$refs.container.getBoundingClientRect()

      const ratio = currentImageScale / this.pointer.imageScale

      this.circleObject = new fabric.Circle({
        radius: this.pointer.radius,
        fill: 'transparent',
        left: this.pointer.x * ratio - this.pointer.radius + boundingRec.width / 2,
        top: this.pointer.y * ratio - this.pointer.radius + boundingRec.height / 2,
        stroke: 'red',
        strokeWidth: DEFAULT_ROI_STROKE_WIDTH / this.canvas.getZoom(),
        strokeUniform: true,
        name: 'CIRCLE',
        scaleX: this.pointer.scaleX * ratio,
        scaleY: this.pointer.scaleY * ratio,
      })
      this.circleObject.setControlsVisibility({
        mt: false,
        mb: false,
        ml: false,
        mr: false,
        bl: true,
        br: true,
        tl: true,
        tr: true,
        mtr: false,
      })
      this.updateCircleSelectedEvent()

      this.canvas.add(this.circleObject)
      const canvasObjects = this.canvas.getObjects()
      this.canvas.moveTo(this.circleObject, canvasObjects.length + 1)
    },
    updateCircleSelectedEvent() {
      this.circleObject.selectable = false
      this.circleObject.evented = false
    },
    onMouseDown(e) {
      e.e.preventDefault()
      // No selection
      if (!e.target) {
        if (e.button != 3) {
          this.isDragging = true
        } else {
          this.isZooming = true
        }
        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
      }
    },
    onMouseMove(e) {
      if (this.isDragging) {
        const vpt = this.canvas.viewportTransform
        vpt[4] += e.e.clientX - this.lastPosX
        vpt[5] += e.e.clientY - this.lastPosY
        this.canvas.requestRenderAll()
        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
      } else if (this.isZooming) {
        let delta = e.e.clientY - this.lastPosY
        let zoom = this.canvas.getZoom()
        zoom *= 0.99 ** delta
        if (zoom > 20) zoom = 20
        if (zoom < 0.01) zoom = 0.01
        this.canvas.zoomToPoint({ x: this.canvasRealWidth / 2, y: this.canvasRealHeight / 2 }, zoom)
        this.pointer = {
          ...this.pointer,
          strokeWidth: DEFAULT_ROI_STROKE_WIDTH / zoom,
        }

        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
      }
    },
    onMouseUp() {
      this.canvas.setViewportTransform(this.canvas.viewportTransform)
      this.isDragging = false
      this.isZooming = false
    },
  },
}
</script>
<style lang="scss" scoped>
.box-controls {
  font-size: 30px;
  background: $white;
  padding: 5px 10px;
  box-shadow: 0px 0px 10px rgba(11, 49, 51, 0.25);
}
.timing-decision-roi-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: solid 2px #ffffff;
  overflow: hidden;
  position: relative;
  .preview-current-seconds {
    position: absolute;
    bottom: 24px;
    right: 24px;
    z-index: 10;
    padding: 10px;
    background: #b8b8b8;
    width: 80px;
    border-radius: 8px;
    text-align: center;
    span {
      text-align: center;
      font-size: 20px;
      color: #000000;
    }
  }
  .overlay.show {
    position: absolute;
    z-index: 1;
    inset: 0;
    width: 100%;
    height: 100%;
    background: #000000;
  }
  .loading-overlay {
    display: none;
  }
  .loading-overlay.show {
    position: absolute;
    z-index: 2;
    inset: 0;
    width: 100%;
    height: 100%;
    background: rgba($color: #ffffff, $alpha: 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
.zoom-action-control-board {
  position: absolute;
  left: 24px;
  top: 12px;
  z-index: 2;

  display: flex;
  flex-direction: column;
  gap: 4px;

  .text-brightness {
    background: #b8b8b8;
    color: #000000;
    padding: 6px 12px;
    border-radius: 8px;
  }
  button {
    width: 36px;
    background: #ffffff;
  }
}
</style>
