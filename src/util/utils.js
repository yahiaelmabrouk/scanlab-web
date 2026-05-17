import _ from 'lodash'
import config from '../config'
import EventBus from '@/lib/event-bus'
import { BAD_BEATS, INJECTOR_SPEED } from '../constants'

let scanIdCounter = 0
export function scanUniqueId(prefix = '') {
  const id = ++scanIdCounter
  return _.toString(prefix) + id
}

export function calculateBodyPartIdFromBaseAndType(options, base, type) {
  if (!base) {
    return null
  } else {
    const id =
      _.get(
        _.find(
          options,
          (el) => (_.get(el, ['baseId'], '') == base || el.id == base) && _.get(el, ['contrastTypes', type], false)
        ),
        ['id']
      ) || base

    return id
  }
}

export function onRenderMiddleSliceOfResultSliceView() {
  return new Promise((resolve) => {
    if (config.isCTLab) {
      EventBus.$emit('onMoveToMiddleSlice')
      setTimeout(() => {
        resolve()
      }, 200)
    } else {
      resolve()
    }
  })
}

export function getHeadholderText() {
  return config.isCTLab ? 'Head holder' : 'Leg pillow'
}

export function getHeadholderTranslateKeyText() {
  return config.isCTLab ? 'global.head_holder' : 'global.leg_pillow'
}

export function getInjectionRunningSpeedTimes(injectionRunningSpeed) {
  if (injectionRunningSpeed == INJECTOR_SPEED.NONE) {
    return 1
  } else if (injectionRunningSpeed == INJECTOR_SPEED.TWO_TIMES) {
    return 2
  } else if (injectionRunningSpeed == INJECTOR_SPEED.FOURTH_TIMES) {
    return 4
  } else if (injectionRunningSpeed == INJECTOR_SPEED.EIGHTH_TIMES) {
    return 8
  }

  return 1
}

export function getInjectionRunningSpeedDuration(injectionRunningSpeed) {
  if (injectionRunningSpeed == INJECTOR_SPEED.NONE) {
    return 1000
  } else if (injectionRunningSpeed == INJECTOR_SPEED.TWO_TIMES) {
    return 500
  } else if (injectionRunningSpeed == INJECTOR_SPEED.FOURTH_TIMES) {
    return 250
  } else if (injectionRunningSpeed == INJECTOR_SPEED.EIGHTH_TIMES) {
    return 125
  }

  return 1000
}

export function getWaveDurationByProps(
  waveNo,
  waveWidth,
  badBeats,
  cardiacCycleDuration,
  cardiacCycleDeviation,
  randomWaveBadbeatsArray,
  badBeatsDuration = {
    isRange: false,
    min: 400,
    max: 400,
  }
) {
  let randomAlias = 1 - Math.random() * 2

  if (badBeats == BAD_BEATS.NONE) {
    return Math.max(cardiacCycleDuration + cardiacCycleDeviation * randomAlias, waveWidth)
  } else if (
    badBeats == BAD_BEATS.RANDOM_ONE_FOURTH ||
    badBeats == BAD_BEATS.RANDOM_ONE_EIGHTH ||
    badBeats == BAD_BEATS.RANDOM_ONE_SIXTEENTH
  ) {
    const isBadBeatWave =
      randomWaveBadbeatsArray.length > 0 && randomWaveBadbeatsArray[waveNo % randomWaveBadbeatsArray.length]
    if (isBadBeatWave) {
      if (badBeatsDuration.isRange) {
        let randomBadBeatsAlias = Math.random()
        return badBeatsDuration.min + (badBeatsDuration.max - badBeatsDuration.min) * randomBadBeatsAlias
      } else {
        return badBeatsDuration.min
      }
    } else {
      return Math.max(cardiacCycleDuration + cardiacCycleDeviation * randomAlias, waveWidth)
    }
  } else {
    let waveHasBadBeats = 1
    let totalWave = 2
    if (badBeats == BAD_BEATS.RANDOM) {
      waveHasBadBeats = [1, 2, 3][Math.floor(Math.random() * 3)] == 1 ? 0 : 10000
      totalWave = 1
    } else if (badBeats == BAD_BEATS.ONE_IN_TWO) {
      waveHasBadBeats = 1
      totalWave = 2
    } else if (badBeats == BAD_BEATS.ONE_IN_FOUR) {
      waveHasBadBeats = 3
      totalWave = 4
    } else if (badBeats == BAD_BEATS.ONE_IN_EIGHT) {
      waveHasBadBeats = 7
      totalWave = 8
    } else {
      waveHasBadBeats = 15
      totalWave = 16
    }

    const isBadBeatWave = waveNo % totalWave == waveHasBadBeats
    if (isBadBeatWave) {
      if (badBeatsDuration.isRange) {
        let randomBadBeatsAlias = Math.random()
        return badBeatsDuration.min + (badBeatsDuration.max - badBeatsDuration.min) * randomBadBeatsAlias
      } else {
        return badBeatsDuration.min
      }
    } else {
      return Math.max(cardiacCycleDuration + cardiacCycleDeviation * randomAlias, waveWidth)
    }
  }
}
export function shouldShowMainScreen(softwareVendorPreference, softwareVersionPreference) {
  const allowedCombinations = {
    siemens: ['xa', 'b19', 'scanlab'],
    ge: ['lx', 'scanlab'],
    philips: ['r57', 'scanlab'],
  }

  const isAllowed = _.includes(allowedCombinations[softwareVendorPreference], softwareVersionPreference)
  return {
    isAllowed,
    softwareVendorPreference,
    softwareVersionPreference,
  }
}

export function sortKeysByArrayOrder(jsonObj, orderArray) {
  const sortedJson = {}
  const keys = Object.keys(jsonObj)

  // Sort keys based on the order array
  keys.sort((a, b) => {
    const indexA = orderArray.findIndex((element) => a.includes(element))
    const indexB = orderArray.findIndex((element) => b.includes(element))

    // If both keys are in the order array, sort by their order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }

    // If only one key is in the order array, it comes first
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1

    // If neither key is in the order array, sort alphabetically
    return a.localeCompare(b)
  })

  // Construct the sorted JSON object
  keys.forEach((key) => {
    sortedJson[key] = jsonObj[key]
  })

  return sortedJson
}
