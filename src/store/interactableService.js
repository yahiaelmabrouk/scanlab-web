import _ from 'lodash'
import Interactable from '@/lib/interactable'
import * as THREE from 'three'
import { checkIntersectOfSatBandWithSatBandMarkZone } from '../lib/satband-util'
import { MAXIMUM_SAT_BAND } from '../constants'

// interactableStateSerialized
// ident: '2f393aa0-cbbf-4902-af20-c999da47f961'
// type: 'satband'
// centerX: -6.42
// centerY: 7.926153846153824
// centerZ: 45.11846153846149
// dimensionX: 120
// dimensionY: 144
// dimensionZ: 114
// xDirectionX: 1
// xDirectionY: 0
// xDirectionZ: 0
// yDirectionX: 0
// yDirectionY: 1
// yDirectionZ: 0
// zDirectionX: 0
// zDirectionY: 1
// zDirectionZ: 0

let calcSatbandOverlapTimeOut = null

// For maintaining interactable 3D objects that exist somewhere in space, and are rendered in all SliceViews (but not SelectionConfigs)
// First for SatBands, and maybe later for Coils
const interactableService = {
  namespaced: true,
  state: {
    // which one is selected, so we know which to move on dragging around with movement tool, etc
    // should be null if the selectionConfigCurrent should be prioritized
    selectedInteractableIdent: null,
    interactableStateByIdent: {}, // non-serialized, so {ident: {center: Vector3, ...}}
    registeredSliceViewsById: {}, // {sliceViewId: {interactableClassInstances, onAddedInteractable, onRemovedInteractable},...}
    previewSatbandOverlapDistance: [],
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  // TODO de/serialize sat bands/etc - put into result.answer?
  actions: {
    // this is called when unloading the MRI/main vue
    reset({ commit }) {
      commit('set', {
        selectedInteractableIdent: null,
        interactableStateByIdent: {},
        previewSatbandOverlapDistance: [],
      })
    },
    // add SelectionClassInstance to each SliceView, and call its callback
    addInteractableInstanceToSliceViewsAsNeeded({ state, commit }, { ident }) {
      let registeredSliceViewsById = state.registeredSliceViewsById
      let interactableState = state.interactableStateByIdent[ident]
      _.each(
        registeredSliceViewsById,
        function ({ backgroundSlice, scene, camera, $store, interactableInstances, onAddedInteractable }) {
          let alreadyExists = _.some(interactableInstances, { ident })
          if (alreadyExists) {
            return false // exit loop
          }
          // add instance
          let instance = new Interactable(
            ident,
            interactableState,
            interactableState.center3,
            interactableState.dimensions3,
            interactableState.xDirection3,
            interactableState.yDirection3,
            interactableState.zDirection3,
            backgroundSlice,
            scene,
            camera,
            $store,
            interactableState.type
          )
          interactableInstances.push(instance)
          onAddedInteractable(instance)
        }
      )

      commit('set', { registeredSliceViewsById })
    },
    // this is for the purpose of keeping track of all the Interactables per SliceView (there will be one instance per  per SpiceView)
    // based on func of same name in selectionService
    registerSliceView(
      { state, commit },
      { $store, sliceViewId, backgroundSlice, scene, camera, onAddedInteractable, onRemovedInteractable }
    ) {
      // Make a Interactable for every ident we already have for this SliceView
      let interactableInstances = _.map(state.interactableStateByIdent, function (interactableState, ident) {
        return new Interactable(
          ident,
          interactableState,
          interactableState.center3,
          interactableState.dimensions3,
          interactableState.xDirection3,
          interactableState.yDirection3,
          interactableState.zDirection3,
          backgroundSlice,
          scene,
          camera,
          $store,
          interactableState.type
        )
      })
      _.each(interactableInstances, function (instance) {
        onAddedInteractable(instance)
      })

      let registeredSliceViewsById = {
        ...state.registeredSliceViewsById,
        [sliceViewId]: {
          interactableInstances,
          onAddedInteractable,
          onRemovedInteractable,
          backgroundSlice,
          scene,
          camera,
          $store,
        },
      }

      commit('set', { registeredSliceViewsById })
    },
    unregisterSliceView({ state, commit }, { sliceViewId }) {
      let registeredSliceViewsById = state.registeredSliceViewsById
      delete registeredSliceViewsById[sliceViewId]
      commit('set', { registeredSliceViewsById })
    },

    // Remove any instances that no longer have a corresponding interactableStateByIdent
    cleanupUnusedInstances({ state, commit }) {
      // remove any interactableInstances that are not for any current selectionConfig
      let { registeredSliceViewsById } = state
      _.each(registeredSliceViewsById, function (sliceViewData) {
        let removedSomething = false

        sliceViewData.interactableInstances = _.reject(sliceViewData.interactableInstances, function (instance) {
          let remove = !state.interactableStateByIdent[instance.ident]
          if (remove) {
            // Run cleanup before destroying instance
            instance.beforeDestroy()
            removedSomething = true
          }
          return remove
        })

        if (removedSomething) {
          sliceViewData.onRemovedInteractable(sliceViewData.interactableInstances)
        }
      })

      commit('set', { registeredSliceViewsById })
    },
    cleanupAllInstances({ state, commit }) {
      // remove any interactableInstances that are not for any current selectionConfig
      let { registeredSliceViewsById } = state
      _.each(registeredSliceViewsById, function (sliceViewData) {
        sliceViewData.interactableInstances.forEach((instance) => {
          // Run cleanup before destroying instance
          instance.beforeDestroy()
        })
        sliceViewData.interactableInstances = []
        sliceViewData.onRemovedInteractable(sliceViewData.interactableInstances)
      })

      commit('set', { registeredSliceViewsById })
    },
    hideAll({ dispatch }) {
      dispatch('satBandService/setVisibleSatBandRect', false, { root: true })
    },
    createSatBand({ state, commit, dispatch, rootGetters }) {
      let selectionConfigCenter3 = rootGetters['selectionConfig/center3']
      if (!selectionConfigCenter3) {
        selectionConfigCenter3 = new THREE.Vector3(0, 0, 0)
      } else {
        selectionConfigCenter3 = selectionConfigCenter3.clone()
      }
      // Shallow clone necessary to detect changes by getters
      let interactableStateByIdent = _.clone(state.interactableStateByIdent)
      let ident = _.uniqueId()
      while (interactableStateByIdent[ident]) {
        ident = _.uniqueId()
      }
      interactableStateByIdent[ident] = {
        type: 'satband', // later also 'coil'
        center3: selectionConfigCenter3,
        dimensions3: new THREE.Vector3(550, 550, 60),
        xDirection3: new THREE.Vector3(1, 0, 0),
        yDirection3: new THREE.Vector3(0, 1, 0),
        zDirection3: new THREE.Vector3(0, 0, 1),
      }

      commit('set', { interactableStateByIdent })
      dispatch('addInteractableInstanceToSliceViewsAsNeeded', { ident })
      dispatch('setSelectedInteractableIdent', ident)
      dispatch('update')
      dispatch('selectionConfig/update', {}, { root: true })
    },
    setSatbandsFromAnswerDataCurrent({ commit, dispatch }, payload) {
      dispatch('cleanupAllInstances')

      const data = _.cloneDeep(payload)
      Object.values(data).forEach((value) => {
        value.center3 = new THREE.Vector3(
          _.get(value, ['center3', 'x'], 0),
          _.get(value, ['center3', 'y'], 0),
          _.get(value, ['center3', 'z'], 0)
        )
        value.dimensions3 = new THREE.Vector3(
          _.get(value, ['dimensions3', 'x'], 0),
          _.get(value, ['dimensions3', 'y'], 0),
          _.get(value, ['dimensions3', 'z'], 0)
        )
        value.xDirection3 = new THREE.Vector3(
          _.get(value, ['xDirection3', 'x'], 0),
          _.get(value, ['xDirection3', 'y'], 0),
          _.get(value, ['xDirection3', 'z'], 0)
        )
        value.yDirection3 = new THREE.Vector3(
          _.get(value, ['yDirection3', 'x'], 0),
          _.get(value, ['yDirection3', 'y'], 0),
          _.get(value, ['yDirection3', 'z'], 0)
        )
        value.zDirection3 = new THREE.Vector3(
          _.get(value, ['zDirection3', 'x'], 0),
          _.get(value, ['zDirection3', 'y'], 0),
          _.get(value, ['zDirection3', 'z'], 0)
        )
      })

      commit('set', { interactableStateByIdent: data })
      dispatch('setSelectedInteractableIdent', null)

      let hasSatBand = false
      for (let i = 0; i < Object.keys(data).length; i++) {
        const ident = Object.keys(data)[i]
        dispatch('addInteractableInstanceToSliceViewsAsNeeded', { ident })
        dispatch('setSelectedInteractableIdent', ident)
        hasSatBand = ident !== null && ident !== undefined
      }

      if (hasSatBand) {
        commit('set', { interactableFormVisible: true })
      }

      dispatch('update')
      dispatch('selectionConfig/update', {}, { root: true })
    },
    setSelectedInteractableIdent({ commit }, selectedInteractableIdent) {
      commit('set', { selectedInteractableIdent })
    },
    setSelectedInteractableIdentByIndex({ commit, state }, identIndex) {
      const ident = _.get(Object.keys(state.interactableStateByIdent), [identIndex])
      commit('set', { selectedInteractableIdent: ident })
    },
    deleteSelectedInteractable({ state, commit, dispatch }) {
      let ident = state.selectedInteractableIdent
      let interactableStateByIdent = _.clone(state.interactableStateByIdent)
      interactableStateByIdent = _.omit(interactableStateByIdent, [ident])
      if (Object.keys(interactableStateByIdent).length > 0) {
        dispatch('setSelectedInteractableIdent', Object.keys(interactableStateByIdent)[0])
      } else {
        dispatch('setSelectedInteractableIdent', null)
      }
      commit('set', { interactableStateByIdent })
      dispatch('cleanupUnusedInstances')
      dispatch('update')
      dispatch('selectionConfig/update', {}, { root: true })
    },
    resetDirection({ getters, dispatch }, { index }) {
      let { selectedInteractableState } = getters
      if (selectedInteractableState) {
        if (index === 0) {
          // These directions corresponds to selectionConfig#resetSelection
          selectedInteractableState.xDirection3.set(1, 0, 0)
          selectedInteractableState.yDirection3.set(0, 1, 0)
          selectedInteractableState.zDirection3.set(0, 0, 1)
        } else if (index === 1) {
          selectedInteractableState.xDirection3.set(0, 0, 1)
          selectedInteractableState.yDirection3.set(1, 0, 0)
          selectedInteractableState.zDirection3.set(0, 1, 0)
        } else {
          selectedInteractableState.xDirection3.set(0, 1, 0)
          selectedInteractableState.yDirection3.set(0, 0, 1)
          selectedInteractableState.zDirection3.set(1, 0, 0)
        }
        dispatch('update')
        dispatch('selectionConfig/afterSelectionUserModified', {}, { root: true })
      }
    },
    onCurStackQuestionChanged({ dispatch }) {
      // Don't clear interactables, both user mode or admin mode, we always load the admin satbands to default
      // if (!rootState.questionService.isEditingQuestion) {
      //   dispatch('reset')
      // }
      dispatch('cleanupUnusedInstances')
      dispatch('update')
      dispatch('selectionConfig/update', {}, { root: true })
    },
    update({ state, dispatch }) {
      _.each(state.registeredSliceViewsById, function ({ interactableInstances }) {
        _.each(interactableInstances, function (instance) {
          instance.updateGeometries()
        })
      })

      dispatch('calcPreviewSatbandOverlap')
    },
    calcPreviewSatbandOverlap({ state, commit, rootState }) {
      // Calc preview satband intersect
      if (calcSatbandOverlapTimeOut) {
        clearTimeout(calcSatbandOverlapTimeOut)
      }

      if (rootState.questionService.isEditingQuestion) {
        calcSatbandOverlapTimeOut = setTimeout(() => {
          const satBands = []
          for (const [, value] of Object.entries(state.interactableStateByIdent)) {
            satBands.push(_.cloneDeep(value))
          }
          const satBandSelections = rootState.satBandService.satBandSelections
          const results = []
          _.forEach(satBands, (satBand) => {
            let intersectSatbandZoneDistance = 0
            const check = checkIntersectOfSatBandWithSatBandMarkZone(satBand, satBandSelections)
            if (check.isIntersect) {
              intersectSatbandZoneDistance += check.intersectDistance
            }
            results.push(_.round(intersectSatbandZoneDistance, 0))
          })

          commit('set', { previewSatbandOverlapDistance: results })
        }, 500)
      }
    },
  },
  getters: {
    interactableFormVisible(state) {
      return state.interactableStateByIdent != null && Object.keys(state.interactableStateByIdent).length > 0
    },
    selectedInteractableState(state) {
      // return current selected interactable, if any, else return this.$store.getters['selectionConfig/selectionConfigCurrent']
      return _.get(state.interactableStateByIdent, state.selectedInteractableIdent, null)
    },
    firstInteractableConfig(state) {
      return _.first(_.values(state.interactableStateByIdent))
    },
    isSatBandSelected(state) {
      return !_.isNil(state.selectedInteractableIdent)
    },
    satBands(state) {
      return _.filter(state.interactableStateByIdent, { type: 'satband' })
    },
    indexOfSelectedSatBand(state, getters) {
      if (!getters.isSatBandSelected) {
        return null
      }
      return _.indexOf(getters.satBands, getters.selectedInteractableState)
    },
    mayAddSatBand(state, getters) {
      return _.size(getters.satBands) < MAXIMUM_SAT_BAND
    },
  },
}

export default interactableService
