import _ from 'lodash'
import config from '../config'

export function isOnlyShowRightOrWrong(keyName) {
  const excepts = config.isCTLab
    ? [
        'kernel',
        'windowLevel',
        'windowWidth',
        'windowLevelAndWindowWitdh',
        'fieldOfView',
        'fieldOfViewCoverage',
        'breathingInstruction',
      ]
    : []

  return excepts.includes(keyName)
}

export function combinedResultAnalysis(analysis, isReconstruction) {
  let mergeAnalysis = []
  mergeAnalysis.push(
    {
      factorName: 'windowLevelAndWindowWitdh',
      key: 'window_level_and_window_width',
      mergeFactorNames: ['windowLevel', 'windowWidth'],
    },
    {
      factorName: 'fieldOfViewCoverage',
      key: 'field_of_view_coverage',
      mergeFactorNames: ['coverageX', 'coverageY'],
    }
  )

  if (!isReconstruction) {
    mergeAnalysis.push({
      factorName: 'fieldOfView',
      key: 'field_of_view',
      mergeFactorNames: ['dimensionX', 'dimensionY'],
    })
  }

  //const mergeAnalysis = [
  //  {
  //    factorName: 'windowLevelAndWindowWitdh',
  //    key: 'window_level_and_window_width',
  //    mergeFactorNames: ['windowLevel', 'windowWidth'],
  //  },
  //  {
  //    factorName: 'fieldOfView',
  //    key: 'field_of_view',
  //    mergeFactorNames: ['dimensionX', 'dimensionY'],
  //  },
  //  {
  //    factorName: 'fieldOfViewCoverage',
  //    key: 'field_of_view_coverage',
  //    mergeFactorNames: ['coverageX', 'coverageY'],
  //  },
  //]

  let merges = _.cloneDeep(analysis)

  _.forEach(mergeAnalysis, (el) => {
    if (
      _.filter(analysis, (ana) => el.mergeFactorNames.includes(ana.factorName)).length == el.mergeFactorNames.length
    ) {
      const newAnalysis = {
        color: 'green',
        factorName: el.factorName,
        isBad: false,
        key: `TestResults.${el.key}_correct`,
        keyName: el.key,
        scoreLoss: 0,
        unit: '',
        value: 0,
      }

      if (_.some(analysis, (ana) => el.mergeFactorNames.includes(ana.factorName) && ana.isBad)) {
        newAnalysis.isBad = true
        newAnalysis.key = `TestResults.${el.key}_wrong`
        newAnalysis.color = `red`

        newAnalysis.value = parseScores(analysis, mergeAnalysis, el.factorName)
        console.log('newAnalysis.value', newAnalysis)
      }

      merges = merges.filter((o) => !el.mergeFactorNames.includes(o.factorName))

      const index = _.findIndex(analysis, (ana) => el.mergeFactorNames.includes(ana.factorName))

      if (index == -1) {
        merges.push(newAnalysis)
      } else {
        merges.splice(index, 0, newAnalysis)
      }
    }
  })

  return merges
}

function parseScores(originalAnalysis, mergeAnalysis, factorName) {
  //console.log('ready to parse scores')
  //console.log('originalAnalysis', originalAnalysis)
  //console.log('newAnalysis', mergeAnalysis)
  //console.log('factorName', factorName)

  let mergeScoreValue = 0
  const currentAnalysis = mergeAnalysis.find((el) => el.factorName == factorName)

  console.log('currentAnalysis', currentAnalysis.mergeFactorNames)
  if (factorName == 'fieldOfView') {
    console.log('fieldOfView')
    for (let factor of currentAnalysis.mergeFactorNames) {
      let factorAnalysis = originalAnalysis.find((el) => el.factorName == factor)
      console.log('factor', factor)
      console.log('factorAnalysis', factorAnalysis)
      mergeScoreValue = factorAnalysis.value
      break // only need one value so no need to continue
    }
  }

  if (factorName == 'fieldOfViewCoverage') {
    console.log('fieldOfViewCoverage')
    for (let factor of currentAnalysis.mergeFactorNames) {
      let factorAnalysis = originalAnalysis.find((el) => el.factorName == factor)
      console.log('factor', factor)
      console.log('factorAnalysis', factorAnalysis)
      mergeScoreValue += factorAnalysis.value
    }
  }
  return mergeScoreValue
}
