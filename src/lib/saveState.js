import _ from 'lodash'

function saveState(moduleName, keysToSave, stateAll) {
  let state = _.pick(stateAll, keysToSave)
  localStorage.setItem(moduleName, JSON.stringify(state))
}

export default saveState
