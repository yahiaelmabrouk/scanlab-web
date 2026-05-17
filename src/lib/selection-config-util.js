import _ from 'lodash'

// min - min selectionConfig that's valid for answer
// max - max selectionConfig that's valid for answer
// proposed - currently proposed selectionConfig, starts off from stackQuestion.initialSelection
const SELECTION_IDENT_TYPES = ['min', 'max', 'proposed']

function isIdent(ident) {
  return _.includes(SELECTION_IDENT_TYPES, identToIdentType(ident))
}

function identToIdentType(ident) {
  return _.last(_.split(ident, '_'))
}
function identToGroupId(ident) {
  return _.parseInt(_.first(_.split(ident, '_')))
}

function getGroupsFromIdentsArray(identsArray) {
  let groupsById = {}
  _.each(identsArray, function (propKey) {
    // it's one of the valid identTypes (and not like answer id/name), there will be multiple per group
    if (
      _.some(SELECTION_IDENT_TYPES, (identType) => propKey.endsWith(identType) && propKey.length > identType.length)
    ) {
      let groupId = identToGroupId(propKey)
      groupsById[groupId] = identToGroupId(propKey)
    }
  })

  let index = -1
  let groups = _.map(groupsById, function (groupId) {
    // Group Name is based on index (not groupId), because we show the user a nice 1...N, whereas groupIDs may fragment over time ([5, 6, 9] can happen, etc)
    index++
    return { id: groupId, index, name: index + 1 + '' }
  })
  return _.sortBy(groups, 'id')
}

function trimNonIdentsFromAnswer(answer) {
  return _.pickBy(answer, function (unused, ident) {
    return _.includes(SELECTION_IDENT_TYPES, identToIdentType(ident))
  })
}

function trimIdentsFromAnswer(answer) {
  return _.omitBy(answer, function (unused, ident) {
    return _.includes(SELECTION_IDENT_TYPES, identToIdentType(ident))
  })
}

export {
  SELECTION_IDENT_TYPES,
  identToIdentType,
  identToGroupId,
  getGroupsFromIdentsArray,
  trimNonIdentsFromAnswer,
  trimIdentsFromAnswer,
  isIdent,
}
