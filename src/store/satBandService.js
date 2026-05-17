import _ from 'lodash'
import { POINT_SELECT_MODES } from '../constants'

const satBandService = {
  namespaced: true,
  state: {
    selectedSatBandStackConfigName: '',
    selectedSatBandViewOrientation: '',
    satBandSelections: {},
    currentSatBandSelection: {},
    newSatBandRadius: 21,
    isStartDrawSatBandZone: false,
    satBandMode: null,
    tmpSatBandSelectedPolygonPoints: [],
    satBandEditMode: false,
    newSatBandRectangleWidth: 21,
    newSatBandRectangleHeight: 21,
    cornerSatBandDotSize: 1,
    visibleSatBand: true,
    visibleSatBandRect: true,
  },
  watchStates: {
    isStartDrawSatBandZone: 'onIsStartDrawSatBandZoneChange',
    satBandEditMode: 'onSatBandEditModeChange',
    satBandSelections: 'onSatBandSelectionsChange',
    currentSatBandSelection: 'onSatBandSelectionsChange',
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
    setVisibleSatBand(state, payload) {
      state.visibleSatBand = payload
    },
    setSelectedSatBandStackConfigName(state, payload) {
      state.selectedSatBandStackConfigName = payload
    },
    setNewSatBandRectangleWidth(state, payload) {
      state.newSatBandRectangleWidth = payload
    },
    setSelectedSatBandViewOrientation(state, payload) {
      state.selectedSatBandViewOrientation = payload
    },
    setNewSatBandRectangleHeight(state, payload) {
      state.newSatBandRectangleHeight = payload
    },
    setSatBandEditMode(state, payload) {
      state.satBandEditMode = payload
    },
    setTmpSatBandSelectedPolygonPoints(state, payload) {
      state.tmpSatBandSelectedPolygonPoints = payload
    },
    setSatBandMode(state, payload) {
      state.satBandMode = payload
    },
    setIsStartDrawSatBandZone(state, payload) {
      state.isStartDrawSatBandZone = payload
    },
    addSatBandSelection(state, payload) {
      state.satBandSelections = {
        ...state.satBandSelections,
        [payload.id]: { ...payload },
      }
    },
    removeAllSatBandSelection(state) {
      state.satBandSelections = {}
    },
    removeSatBandSelection(state, payload) {
      const data = _.cloneDeep(state.satBandSelections)
      if (_.has(data, [payload])) {
        delete data[payload]
      }

      state.satBandSelections = data
    },
    adjustPointOfSatBandPolygon(state, payload) {
      const { id, index, position } = payload
      if (
        _.has(state.satBandSelections, [id]) &&
        _.get(state.satBandSelections, [id, 'mode']) == POINT_SELECT_MODES.POLYGON &&
        _.has(state.satBandSelections, [id, 'points', index])
      ) {
        const clone = _.cloneDeep(state.satBandSelections)
        clone[id].points[index] = position
        state.satBandSelections = clone
      }
    },
    adjustPositionOfSatBand(state, payload) {
      const { id, position } = payload
      if (
        _.has(state.satBandSelections, [id]) &&
        (_.get(state.satBandSelections, [id, 'mode'], POINT_SELECT_MODES.CIRCLE) == POINT_SELECT_MODES.CIRCLE ||
          _.get(state.satBandSelections, [id, 'mode'], POINT_SELECT_MODES.CIRCLE) == POINT_SELECT_MODES.RECTANGLE)
      ) {
        const clone = _.cloneDeep(state.satBandSelections)
        clone[id] = {
          ...clone[id],
          ...position,
        }
        state.satBandSelections = clone
        state.currentSatBandSelection = clone[id]
      } else if (
        _.has(state.satBandSelections, [id]) &&
        _.get(state.satBandSelections, [id, 'mode'], POINT_SELECT_MODES.CIRCLE) == POINT_SELECT_MODES.POLYGON
      ) {
        const clone = _.cloneDeep(state.satBandSelections)
        const oldPoints = clone[id].points
        const averageX = _.mean(oldPoints.map((el) => el.x))
        const averageY = _.mean(oldPoints.map((el) => el.y))
        const averageZ = _.mean(oldPoints.map((el) => el.z))

        const adjust = {
          x: position.x - averageX,
          y: position.y - averageY,
          z: position.z - averageZ,
        }
        clone[id].points = clone[id].points.map((vec3) => {
          return {
            x: vec3.x + adjust.x,
            y: vec3.y + adjust.y,
            z: vec3.z + adjust.z,
          }
        })

        state.satBandSelections = clone
      }
    },
    setCurrentSatBandSelection(state, payload) {
      const sel = state.satBandSelections[payload]
      if (sel) {
        state.currentSatBandSelection = sel
      } else {
        state.currentSatBandSelection = null
      }
    },
    setCurrentRadius(state, payload) {
      if (state.currentSatBandSelection) {
        state.currentSatBandSelection.radius = payload
      }
    },
    setCurrentHeight(state, payload) {
      if (state.currentSatBandSelection) {
        state.currentSatBandSelection.height = payload
      }
    },
    setCurrentWidth(state, payload) {
      if (state.currentSatBandSelection) {
        state.currentSatBandSelection.width = payload
      }
    },
    setNewSatBandRadius(state, payload) {
      state.newSatBandRadius = payload
    },
    setCornerSatBandDotSize(state, payload) {
      state.cornerSatBandDotSize = payload
    },
    load(state, payload) {
      _.extend(state, payload)

      if (_.size(payload.satBandSelections) > 0) {
        let cloneSelections = _.cloneDeep(payload.satBandSelections)
        Object.entries(cloneSelections).forEach(([key, value]) => {
          if (!_.has(value, ['indexSlice']) && !_.isNaN(+key)) {
            value.indexSlice = +key
          }
        })
        state.satBandSelections = cloneSelections
        state.currentSatBandSelection = null
      } else {
        state.satBandSelections = {}
      }
    },
    unload(state) {
      state.satBandSelections = {}
      state.currentSatBandSelection = {}
      state.newSatBandRadius = 20
      state.satBandMode = null
      state.tmpSatBandSelectedPolygonPoints = []
      state.satBandEditMode = false
      state.cornerSatBandDotSize = 1
      state.selectedSatBandViewOrientation = ''
      state.selectedSatBandStackConfigName = ''
    },
  },
  getters: {
    currentSatBandSelection(state) {
      return state.currentSatBandSelection
    },
  },
  actions: {
    onSatBandSelectionsChange({ dispatch }) {
      dispatch('interactableService/calcPreviewSatbandOverlap', {}, { root: true })
    },
    loadFromAnswerDataCurrent({ commit }, payload) {
      commit('load', {
        satBandSelections: payload,
      })
    },
    onIsStartDrawSatBandZoneChange({ commit, state }) {
      if (state.isStartDrawSatBandZone) {
        commit('set', {
          satBandEditMode: false,
        })
      }
    },
    onSatBandEditModeChange({ commit, state }) {
      if (!state.satBandEditMode) {
        commit('set', {
          currentSatBandSelection: null,
        })
      }
    },
    setVisibleSatBandRect({ commit, dispatch }, payload) {
      commit('set', {
        visibleSatBandRect: payload,
      })
      dispatch('interactableService/update', {}, { root: true })
      dispatch('selectionConfig/update', {}, { root: true })
    },
  },
}

export default satBandService
