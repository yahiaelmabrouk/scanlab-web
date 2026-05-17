import _ from 'lodash'
import { POINT_SELECT_MODES } from '../constants'

const pointSelect = {
  namespaced: true,
  state: {
    show: false,
    allowSelection: false,
    noSelections: true,
    selections: {},
    previewChosenSelection: {},
    currentSelection: null,
    selectedPointInfo: null,
    singleSelection: false,
    newRadius: 20,
    isStartDrawPointSelectZone: false,
    pointSelectMode: null,
    tmpSelectedPolygonPoints: [],
    pointSelectEditMode: false,
    newRectangleWidth: 20,
    newRectangleHeight: 20,
    cornerDotSize: 1,
    userPointSelectAnswerDotSize: 4,
    hasDotSizeSliderBeenClicked: false,
  },
  watchStates: {
    isStartDrawPointSelectZone: 'onIsStartDrawPointSelectZoneChange',
    pointSelectEditMode: 'onPointSelectEditModeChange',
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
    setSelectedPointInfo(state, payload) {
      state.selectedPointInfo = payload
    },
    setNewRectangleWidth(state, payload) {
      state.newRectangleWidth = payload
    },
    setNewRectangleHeight(state, payload) {
      state.newRectangleHeight = payload
    },
    setPointSelectEditMode(state, payload) {
      state.pointSelectEditMode = payload
    },
    setTmpSelectedPolygonPoints(state, payload) {
      state.tmpSelectedPolygonPoints = payload
    },
    setPointSelectMode(state, payload) {
      state.pointSelectMode = payload
    },
    setIsStartDrawPointSelectZone(state, payload) {
      state.isStartDrawPointSelectZone = payload
    },
    showPointSelect(state) {
      state.showPointSelect = true
    },
    hidePointSelect(state) {
      state.showPointSelect = false
    },
    enableSelection(state) {
      state.allowSelection = true
    },
    disableSelection(state) {
      state.allowSelection = false
    },
    addPreviewChosenSelection(state, payload) {
      state.previewChosenSelection = {}
      // Only one choosen selection point can visible
      state.previewChosenSelection = {
        ...state.previewChosenSelection,
        [payload.id]: { ...payload },
      }
    },
    resetPreviewChosenSelection(state) {
      state.previewChosenSelection = {}
    },
    addSelection(state, payload) {
      if (state.singleSelection) {
        state.selections = {}
      }
      state.selections[payload.id] = { ...payload }
      state.noSelections = false
    },
    removeAllSelection(state) {
      state.selections = {}
      state.noSelections = false
    },
    removeSelection(state, payload) {
      if (state.singleSelection) {
        state.selections = {}
      } else {
        const data = _.cloneDeep(state.selections)
        if (_.has(data, [payload])) {
          delete data[payload]
        }

        state.selections = data
      }

      state.noSelections = false
    },
    adjustPointOfPolygon(state, payload) {
      const { id, index, position } = payload
      if (
        _.has(state.selections, [id]) &&
        _.get(state.selections, [id, 'mode']) == POINT_SELECT_MODES.POLYGON &&
        _.has(state.selections, [id, 'points', index])
      ) {
        const clone = _.cloneDeep(state.selections)
        clone[id].points[index] = position
        state.selections = clone
      }

      state.noSelections = false
    },
    adjustPositionOfPointSelect(state, payload) {
      const { id, position } = payload
      if (
        _.has(state.selections, [id]) &&
        (_.get(state.selections, [id, 'mode'], POINT_SELECT_MODES.CIRCLE) == POINT_SELECT_MODES.CIRCLE ||
          _.get(state.selections, [id, 'mode'], POINT_SELECT_MODES.CIRCLE) == POINT_SELECT_MODES.RECTANGLE)
      ) {
        const clone = _.cloneDeep(state.selections)
        clone[id] = {
          ...clone[id],
          ...position,
        }
        state.selections = clone
        state.currentSelection = clone[id]
      } else if (
        _.has(state.selections, [id]) &&
        _.get(state.selections, [id, 'mode'], POINT_SELECT_MODES.CIRCLE) == POINT_SELECT_MODES.POLYGON
      ) {
        const clone = _.cloneDeep(state.selections)
        const oldPoints = clone[id].points
        const averageX = _.mean(oldPoints.map((el) => el.x))
        const averageY = _.mean(oldPoints.map((el) => el.y))
        const averageZ = _.mean(oldPoints.map((el) => el.y))

        const adjust = {
          x: position.x - averageX,
          y: position.y - averageY,
          z: position.y - averageZ,
        }
        clone[id].points = clone[id].points.map((vec3) => {
          return {
            x: vec3.x + adjust.x,
            y: vec3.y + adjust.y,
            z: vec3.z + adjust.z,
          }
        })

        state.selections = clone
      }

      state.noSelections = false
    },
    setSingleSelection(state, payload) {
      state.singleSelection = payload
      state.radius = 2
    },
    setCurrentSelection(state, payload) {
      const sel = state.selections[payload]
      if (sel) {
        state.currentSelection = sel
      } else {
        state.currentSelection = null
      }
    },
    setCurrentRadius(state, payload) {
      if (state.currentSelection) {
        state.currentSelection.radius = payload
      }
    },
    setCurrentHeight(state, payload) {
      if (state.currentSelection) {
        state.currentSelection.height = payload
      }
    },
    setCurrentWidth(state, payload) {
      if (state.currentSelection) {
        state.currentSelection.width = payload
      }
    },
    setNewRadius(state, payload) {
      state.newRadius = payload
    },
    setCornerDotSize(state, payload) {
      state.cornerDotSize = payload
    },
    setUserPointSelectAnswerDotSize(state, payload) {
      state.userPointSelectAnswerDotSize = payload
    },
    setHasDotSizeSliderBeenClicked(state, payload) {
      state.hasDotSizeSliderBeenClicked = payload
    },
    load(state, payload) {
      _.extend(state, payload)

      if (_.size(payload.selections) > 0) {
        let cloneSelections = _.cloneDeep(payload.selections)
        Object.entries(cloneSelections).forEach(([key, value]) => {
          if (!_.has(value, ['indexSlice']) && !_.isNaN(+key)) {
            value.indexSlice = +key
          }
        })
        state.noSelections = false
        state.selections = cloneSelections
        state.currentSelection = _.first(Object.values(state.selections))
      } else {
        state.noSelections = true
        state.selections = {}
      }
      state.showPointSelect = true
    },
    unSelectAnswer(state) {
      state.selectedPointInfo = null
    },
    unload(state) {
      state.selections = {}
      state.currentSelection = null
      state.noSelections = true
      state.singleSelection = false
      state.newRadius = 20
      state.pointSelectMode = null
      state.tmpSelectedPolygonPoints = []
      state.pointSelectEditMode = false
      state.cornerDotSize = 1
      state.previewChosenSelection = {}
      state.selectedPointInfo = null
      state.hasDotSizeSliderBeenClicked = false
    },
  },
  getters: {
    currentSelection(state) {
      return state.currentSelection
    },
  },
  actions: {
    resetPointServiceState({ commit }) {
      commit('set', {
        userPointSelectAnswerDotSize: 4,
      })
    },
    onIsStartDrawPointSelectZoneChange({ commit, state }) {
      if (state.isStartDrawPointSelectZone) {
        commit('set', {
          pointSelectEditMode: false,
        })
      }
    },
    onPointSelectEditModeChange({ commit, state }) {
      if (!state.pointSelectEditMode) {
        commit('set', {
          currentSelection: null,
        })
      }
    },
  },
}

export default pointSelect
