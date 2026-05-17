import _ from 'lodash'

/**
 * helper function that calculates the minimum sequece TR value for the given params
 * @param {slices, echoSpacing, echoTrainLength, echoTime, inversionTime, inversionRecovery, concatenations, sequenceType, fatSuppression, satBands}
 * @returns {number}
 */

function calculateMinSeqTR(params) {
  let output = 0
  const echoSpacingTimesTrainLengthPlus5 =
    params.echoSpacing * (params.echoTrainLength ? params.echoTrainLength : 1) + 5
  const echoTimePlus1 = params.echoTime + 1
  if (params.inversionRecovery) {
    switch (params.sequenceType) {
      case 'TE':
        output =
          _.round(echoSpacingTimesTrainLengthPlus5 * params.slices) + params.inversionTime * params.concatenations
        break
      case 'SE':
        output = _.round(echoTimePlus1 * params.slices) + params.inversionTime * params.concatenations
        break
      case 'GRE':
        output = _.round(echoTimePlus1 * params.slices) + params.inversionTime * params.concatenations
        break
      default:
        output = 0
    }
  } else {
    switch (params.sequenceType) {
      case 'DIFF':
        //  (40+1.0*ES*TR.Needed*PFp/Pat) Nsl
        output =
          (160 +
            (0.02 * params.bMax +
              params.echoSpacing * params.trNeeded * (1 + params.oversampling) * params.partialFourierAsDecimal) /
              params.iPat) *
          params.slices
        output = Math.round(output)
        //output = _.round(echoSpacingTimesTrainLengthPlus5 * params.slices)
        break
      case 'TE':
        output = _.round(echoSpacingTimesTrainLengthPlus5 * params.slices)
        break
      case 'SE':
        output = _.round(echoTimePlus1 * params.slices + 5)
        break
      case 'GRE':
        output = _.round(echoTimePlus1 * params.slices + 1)
        break
      default:
        output = 1
    }
  }

  if (params.fatSuppression) {
    output += params.slices * 15
  }

  if (params.satBands?.length > 0) {
    output += params.slices * 10 * params.satBands.length
  }

  return output
}

export { calculateMinSeqTR }
