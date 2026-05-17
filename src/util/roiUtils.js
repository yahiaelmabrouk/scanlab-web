import _ from 'lodash'
import { MAXIMUM_ROI_STEP, MIN_CONTRAST_DURATION_TIME } from '../constants'

export const getROIPresentationImageNo = (
  input = {
    presentStep: 0,
    currentTestContrastDuration: 0,
    timingDecisionFlouroFrameRate: 1,
    duationRate: 1,
    currentContrast1Duration: 0,
    currentContrast2Duration: 0,
    currentContrastDuration: 0,
    isHasTestContrast: false,
    isHasTwoPeriodContrast: true,
    timingDecisionTestProcessInjectedStep: 0,
    presentationPeriods: [
      {
        start: 2, // Must start from 2, because 1 is the initial step
        end: Math.min(2, MAXIMUM_ROI_STEP),
      },
      {
        start: 2,
        end: Math.min(2, MAXIMUM_ROI_STEP),
      },
      {
        start: 2,
        end: Math.min(2, MAXIMUM_ROI_STEP),
      },
    ],
    timingDecisionTestProcessDoneStep: 0,
    injectedSecondsBeforeStartViewTimingDecision: 0,
    timingDecisionScanDelay: 0,
    delayTimeToShowRoi: 0,
    timingDecisionContrast1ProcessDoneStep: 0,
    timingDecisionContrast2ProcessDoneStep: 0,
    timingDecisionInjectedStep: 0,
    timingDecisionContrastProcessDoneStep: 0,
    timingDecisionContrast1InjectedStep: 0,
    timingDecisionContrast2InjectedStep: 0,
    endingPeriod: { start: 1, end: MAXIMUM_ROI_STEP },
  }
) => {
  const testContrastDuration =
    input.currentTestContrastDuration == 0
      ? 0
      : Math.max(
          MIN_CONTRAST_DURATION_TIME * input.timingDecisionFlouroFrameRate,
          input.currentTestContrastDuration * input.duationRate
        )
  const contrast1Duration =
    input.currentContrast1Duration == 0
      ? 0
      : Math.max(
          MIN_CONTRAST_DURATION_TIME * input.timingDecisionFlouroFrameRate,
          input.currentContrast1Duration * input.duationRate
        )
  const contrast2Duration =
    input.currentContrast2Duration == 0
      ? 0
      : Math.max(
          MIN_CONTRAST_DURATION_TIME * input.timingDecisionFlouroFrameRate,
          input.currentContrast2Duration * input.duationRate
        )
  const contrastDuration =
    input.currentContrastDuration == 0
      ? 0
      : Math.max(
          MIN_CONTRAST_DURATION_TIME * input.timingDecisionFlouroFrameRate,
          input.currentContrastDuration * input.duationRate
        )

  const endingPeriod = input.endingPeriod
  const endingPeriodCycle = {
    start: Math.max(endingPeriod.start, endingPeriod.end),
    end: endingPeriod.end,
  }
  const endingPeriodCycleStepTotal = endingPeriodCycle.end - endingPeriodCycle.start + 1
  if (input.isHasTestContrast) {
    if (input.isHasTwoPeriodContrast) {
      // TEST CONTRAST AND TWO CONTRASTS
      if (input.presentStep < input.timingDecisionTestProcessInjectedStep || testContrastDuration <= 0) {
        const period = _.get(input.presentationPeriods, [0], { start: 0, end: 0 })
        return (input.presentStep % (period.start - 1)) + 1
      } else if (input.presentStep <= input.timingDecisionTestProcessDoneStep) {
        // TEST PROCESS
        const periodNumber = 0
        const period = _.get(input.presentationPeriods, [periodNumber], { start: 0, end: 0 })
        // ONLY CHANGED LOGIC IN HERE
        const currentSeconds =
          (input.presentStep - input.timingDecisionTestProcessInjectedStep) * input.timingDecisionFlouroFrameRate +
          input.injectedSecondsBeforeStartViewTimingDecision +
          input.timingDecisionScanDelay // _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0)

        let presentationImageIndex = 0
        const duration = testContrastDuration
        // NO CHANGED
        if (currentSeconds < input.delayTimeToShowRoi) {
          const presentationJumpStep = period.start / input.delayTimeToShowRoi
          const step = Math.round(currentSeconds * presentationJumpStep)
          presentationImageIndex = Math.min(period.start, step)
        } else {
          const presentationJumpStep = (period.end - period.start) / duration
          const step = Math.round(period.start + (currentSeconds - input.delayTimeToShowRoi) * presentationJumpStep)
          presentationImageIndex = Math.min(period.end, step)
        }
        return presentationImageIndex
        // NO CHANGED
      } else if (input.presentStep <= input.timingDecisionContrast1ProcessDoneStep) {
        // CONTRAST1 PROCESS
        const periodNumber = 1
        const period = _.get(input.presentationPeriods, [periodNumber], { start: 0, end: 0 })
        // MAIN PROCESS
        const startMainStep = Math.max(
          input.timingDecisionTestProcessDoneStep,
          input.timingDecisionContrast1InjectedStep
        )
        if (input.presentStep < startMainStep || contrast1Duration <= 0) {
          const endingStep = input.presentStep - input.timingDecisionTestProcessDoneStep - 1
          if (endingPeriod.start + endingStep <= endingPeriod.end) {
            return endingPeriod.start + endingStep
          } else {
            const step = (endingPeriod.start + endingStep - endingPeriod.end) % endingPeriodCycleStepTotal
            return endingPeriodCycle.start + step
          }
        } else {
          // ONLY CHANGED LOGIC IN HERE
          const currentSeconds =
            (input.presentStep - startMainStep) * input.timingDecisionFlouroFrameRate +
            input.injectedSecondsBeforeStartViewTimingDecision +
            input.timingDecisionScanDelay // _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0)
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
        const period = _.get(input.presentationPeriods, [periodNumber], { start: 0, end: 0 })
        // MAIN PROCESS
        const startMainStep = Math.max(
          input.timingDecisionContrast1ProcessDoneStep,
          input.timingDecisionContrast2InjectedStep
        )
        if (input.presentStep < startMainStep || contrast2Duration <= 0) {
          const endImageIndex = _.get(input.presentationPeriods, [periodNumber - 1, 'end'], 0)
          return endImageIndex
        } else if (input.presentStep <= input.timingDecisionContrast2ProcessDoneStep) {
          // ONLY CHANGED LOGIC IN HERE
          const currentSeconds =
            (input.presentStep - startMainStep) * input.timingDecisionFlouroFrameRate +
            input.injectedSecondsBeforeStartViewTimingDecision +
            input.timingDecisionScanDelay // _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0)
          let presentationImageIndex = 0
          const duration = contrast2Duration
          // NO CHANGED
          const presentationJumpStep = (period.end - period.start) / duration
          const step = Math.round(period.start + currentSeconds * presentationJumpStep)
          presentationImageIndex = Math.min(period.end, step)
          return presentationImageIndex
        } else {
          const endingStep = input.presentStep - input.timingDecisionContrast2ProcessDoneStep - 1
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
      if (input.presentStep < input.timingDecisionTestProcessInjectedStep || testContrastDuration <= 0) {
        const period = _.get(input.presentationPeriods, [0], { start: 0, end: 0 })
        return (input.presentStep % (period.start - 1)) + 1
      } else if (input.presentStep <= input.timingDecisionTestProcessDoneStep) {
        // TEST PROCESS
        const periodNumber = 0
        const period = _.get(input.presentationPeriods, [periodNumber], { start: 0, end: 0 })
        // ONLY CHANGED LOGIC IN HERE
        const currentSeconds =
          (input.presentStep - input.timingDecisionTestProcessInjectedStep) * input.timingDecisionFlouroFrameRate +
          input.injectedSecondsBeforeStartViewTimingDecision +
          input.timingDecisionScanDelay // _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0)

        let presentationImageIndex = 0
        const duration = testContrastDuration
        // NO CHANGED
        if (currentSeconds < input.delayTimeToShowRoi) {
          const presentationJumpStep = period.start / input.delayTimeToShowRoi
          const step = Math.round(currentSeconds * presentationJumpStep)
          presentationImageIndex = Math.min(period.start, step)
        } else {
          const presentationJumpStep = (period.end - period.start) / duration
          const step = Math.round(period.start + (currentSeconds - input.delayTimeToShowRoi) * presentationJumpStep)
          presentationImageIndex = Math.min(period.end, step)
        }
        return presentationImageIndex
        // NO CHANGED
      } else {
        // CONTRAST PROCESS
        const periodNumber = 1
        const period = _.get(input.presentationPeriods, [periodNumber], { start: 0, end: 0 })
        // MAIN PROCESS
        const startMainStep = Math.max(input.timingDecisionTestProcessDoneStep, input.timingDecisionInjectedStep)
        if (input.presentStep < startMainStep || contrastDuration <= 0) {
          const endingStep = input.presentStep - input.timingDecisionTestProcessDoneStep - 1
          if (endingPeriod.start + endingStep <= endingPeriod.end) {
            return endingPeriod.start + endingStep
          } else {
            const step = (endingPeriod.start + endingStep - endingPeriod.end) % endingPeriodCycleStepTotal
            return endingPeriodCycle.start + step
          }
        } else if (input.presentStep <= input.timingDecisionContrastProcessDoneStep) {
          // ONLY CHANGED LOGIC IN HERE
          const currentSeconds =
            (input.presentStep - startMainStep) * input.timingDecisionFlouroFrameRate +
            input.injectedSecondsBeforeStartViewTimingDecision +
            input.timingDecisionScanDelay // _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0)
          let presentationImageIndex = 0
          const duration = contrastDuration
          // NO CHANGED
          if (currentSeconds < input.delayTimeToShowRoi) {
            presentationImageIndex = 0
          } else {
            const presentationJumpStep = (period.end - period.start) / duration
            const step = Math.round(period.start + (currentSeconds - input.delayTimeToShowRoi) * presentationJumpStep)
            presentationImageIndex = Math.min(period.end, step)
          }
          return presentationImageIndex
          // NO CHANGED
        } else {
          const endingStep = input.presentStep - input.timingDecisionContrastProcessDoneStep - 1
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
    if (input.isHasTwoPeriodContrast) {
      // TWO CONTRASTS
      if (input.presentStep < input.timingDecisionContrast1InjectedStep || contrast1Duration <= 0) {
        const period = _.get(input.presentationPeriods, [0], { start: 0, end: 0 })
        return (input.presentStep % (period.start - 1)) + 1
      } else if (input.presentStep <= input.timingDecisionContrast1ProcessDoneStep) {
        // CONTRAST1 PROCESS
        const periodNumber = 0
        const period = _.get(input.presentationPeriods, [periodNumber], { start: 0, end: 0 })
        // MAIN PROCESS
        const startMainStep = input.timingDecisionContrast1InjectedStep
        const currentSeconds =
          (input.presentStep - startMainStep) * input.timingDecisionFlouroFrameRate +
          input.injectedSecondsBeforeStartViewTimingDecision +
          input.timingDecisionScanDelay // _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0)
        let presentationImageIndex = 0
        const duration = contrast1Duration
        // NO CHANGED
        if (currentSeconds < input.delayTimeToShowRoi) {
          const presentationJumpStep = period.start / input.delayTimeToShowRoi
          const step = Math.round(currentSeconds * presentationJumpStep)
          presentationImageIndex = Math.min(period.start, step)
        } else {
          const presentationJumpStep = (period.end - period.start) / duration
          const step = Math.round(period.start + (currentSeconds - input.delayTimeToShowRoi) * presentationJumpStep)
          presentationImageIndex = Math.min(period.end, step)
        }
        return presentationImageIndex
      } else {
        // CONTRAST2 PROCESS
        const periodNumber = 1
        const period = _.get(input.presentationPeriods, [periodNumber], { start: 0, end: 0 })
        // MAIN PROCESS
        const startMainStep = Math.max(
          input.timingDecisionContrast1ProcessDoneStep,
          input.timingDecisionContrast2InjectedStep
        )
        if (input.presentStep < startMainStep || contrast2Duration <= 0) {
          const endImageIndex = _.get(input.presentationPeriods, [periodNumber - 1, 'end'], 0)
          return endImageIndex
        } else if (input.presentStep <= input.timingDecisionContrast2ProcessDoneStep) {
          // ONLY CHANGED LOGIC IN HERE
          const currentSeconds =
            (input.presentStep - startMainStep) * input.timingDecisionFlouroFrameRate +
            input.injectedSecondsBeforeStartViewTimingDecision +
            input.timingDecisionScanDelay // _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0)
          let presentationImageIndex = 0
          const duration = contrast2Duration
          // NO CHANGED
          const presentationJumpStep = (period.end - period.start) / duration
          const step = Math.round(period.start + currentSeconds * presentationJumpStep)
          presentationImageIndex = Math.min(period.end, step)
          return presentationImageIndex
        } else {
          const endingStep = input.presentStep - input.timingDecisionContrast2ProcessDoneStep - 1
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
      if (input.presentStep < input.timingDecisionInjectedStep || contrastDuration <= 0) {
        const period = _.get(input.presentationPeriods, [0], { start: 0, end: 0 })
        return (input.presentStep % (period.start - 1)) + 1
      } else {
        // CONTRAST PROCESS
        const periodNumber = 0
        const period = _.get(input.presentationPeriods, [periodNumber], { start: 0, end: 0 })
        // MAIN PROCESS
        const startMainStep = input.timingDecisionInjectedStep
        const currentSeconds =
          (input.presentStep - startMainStep) * input.timingDecisionFlouroFrameRate +
          input.injectedSecondsBeforeStartViewTimingDecision +
          input.timingDecisionScanDelay // _.get(this.stackQuestion, ['timingDecisionScanDelay'], 0)
        let presentationImageIndex = 0
        const duration = contrastDuration
        // NO CHANGED
        if (currentSeconds < input.delayTimeToShowRoi) {
          const presentationJumpStep = period.start / input.delayTimeToShowRoi
          const step = Math.round(currentSeconds * presentationJumpStep)
          presentationImageIndex = Math.min(period.start, step)
        } else if (input.presentStep <= input.timingDecisionContrastProcessDoneStep) {
          const presentationJumpStep = (period.end - period.start) / duration
          const step = Math.round(period.start + (currentSeconds - input.delayTimeToShowRoi) * presentationJumpStep)
          presentationImageIndex = Math.min(period.end, step)
        } else {
          const endingStep = input.presentStep - input.timingDecisionContrastProcessDoneStep - 1
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
}
