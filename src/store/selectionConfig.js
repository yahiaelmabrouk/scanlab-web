import log from 'loglevel'
import * as THREE from 'three'
import StackVolumeSelection from '@/lib/stack-volume-selection'
import { getSelectionOutsideAmountByAxis, clamp } from '@/lib/math-util'
import { SELECTION_IDENT_TYPES, identToIdentType, isIdent, getGroupsFromIdentsArray } from '@/lib/selection-config-util'
import { selectionConfigToAnswerData } from '@/lib/misc-util'
import saveState from '../lib/saveState'
import _ from 'lodash'
import EventBus from '@/lib/event-bus'
import Vue from 'vue'
import { identToGroupId } from '../lib/selection-config-util'
import { RADIAN_180_DEG, RADIAN_90_DEG, getClosestSignedAxis3 } from '@/lib/math-util'
import configs from '../config'
import {
  BREATHING_INSTRUCTION,
  CARDIAC_ACQUISITION_TYPE,
  DEFAULT_VALUE_FOR_SELECTION_CONFIG,
  LOCALIZER_BOX_IDENT,
  NUM_OF_LOCALIZER_SLICES_OF_CT,
  PATIENT_POSITION_TEXT,
  SCAN_BOX_IDENT,
  SCAN_STATUS,
  SELECTION_CONFIG_FORM,
  CTA_WATCH_TOWER_CHECK_VALUE,
  NON_CTA_WATCH_TOWER_CHECK_VALUE,
  TUBE_CONFIG,
} from '../constants'
import config from '../config'
import { calculateMinSeqTR } from '@/lib/sequence-time-util'
import { partialFourierToDecimal } from '@/lib/mri-parameter-utils'
import { checkIntersectOfSatBandWithSatBandMarkZone } from '../lib/satband-util'
import { sortKeysByArrayOrder } from '../util/utils'

let updateSelectionInstanceTinmeout = null

const LOCAL_STATE_PREFIX = 'selectionConfig'
const LOCAL_STATE_TO_SAVE = ['dotScaleMultiplier', 'slabThicknessMethod']

// The Z Dim should add up with the formula of the parts that make it up
// dimensions3.z = (numberOfSlices - 1) * thickness + (numberOfSlices - 1) * spacing
// 133 = (20 - 1) * 5 + (20 - 1) * 2
// 133 = (20 - 1) * (5 + 2)
const selectionPresets = [
  {
    visible: true,
    center3: new THREE.Vector3(-6.42, -25.92, 33.58),
    dimensions3: new THREE.Vector3(configs.isCTLab ? 130 : 100, configs.isCTLab ? 130 : 120, 95),
    xDirection3: new THREE.Vector3(1, 0, 0),
    yDirection3: new THREE.Vector3(0, 1, 0),
    zDirection3: new THREE.Vector3(0, 0, 1),
    numberOfSlices: 20,
    thickness: 3,
    spacing: 2,
    maxRotationOff: 0,
    sequenceType: 'SE',
    fatSuppression: false,
    inversionRecovery: false,
    echoTime: 10,
    repetitionTime: 600,
    inversionTime: 0,
    flipAngle: 10,
    fieldStrength: '',
    phaseMatrix: 256,
    frequencyMatrix: 320,
    frequencyVoxelSize: 1,
    phaseVoxelSize: 1,
    oversampling: 0.1,
    swapPhase: false,
    // For Ultra Lab
    averages: 1,
    concatenations: 2,
    partialFourier: 'Off',
    parallelFactor: 'Off',
    echoSpacing: 10,
    receiverBandWidth: 100,
    echoTrainLength: 3,
    enableTSEBlur: false,
    enableResolution: false,
    enableCompactMode: true,
    enableFovWrap: true,
    enableCruncherResolution: true,
    enableCruncherBasicLab: true,
    enableBitDepth8: true,
    echoOrdering: 'linear',
    sliceSelection: true,
    canDragAboveTR: true,
    scanTime: 5,
    pixelShift: 0,
    noiseFactor: 150,
    flatFactor: 0,
    falloffFactor: 0,
    trEfficiency: 100,
    minConcatAcqPackage: 0,
    vendorStyle: '',
    elapsedTime: 0,
    lostWindowFocus: 0,
    rfPulsing: 'fast',
    gradientRamp: 'fast',
    specialtyOption: '',
    diffusionDirections: 3,
    numBValues: 2,
    bValues: [0, 800],
    bAverages: [1, 1],
    bValueLower: 0,
    bValueUpper: 0,
    diffusionADC: true,
    signalAverage: null,
    signalAverageHalfTR: null,
    bSignalAverages: [],
    bNoiseFactors: [],
    snr: null,
    bSnrs: [],
    savedSnr: null,

    // For CT Lab
    windowWidth: 400,
    windowLevel: 40,
    kernel: 'B10f',
    tubePotential: 10,
    tubeCurrent: 200,
    rotationTime: 1.0,
    pitch: configs.isCTLab ? 0.5 : 0.8,
    breathingInstruction: BREATHING_INSTRUCTION.OFF,
    cardiacAcquisitionType: CARDIAC_ACQUISITION_TYPE.PROSPECTIVE,
    rWaveDelay: 0,
    ignoreBadBeats: false,
    badBeatsTolerance: 0,
  },
  {
    visible: true,
    center3: new THREE.Vector3(-6.42, -25.92, 33.58),
    dimensions3: new THREE.Vector3(configs.isCTLab ? 130 : 100, configs.isCTLab ? 130 : 120, 95),
    xDirection3: new THREE.Vector3(0, 0, 1),
    yDirection3: new THREE.Vector3(1, 0, 0),
    numberOfSlices: 20,
    thickness: 3,
    spacing: 2,
    maxRotationOff: 0,
    sequenceType: 'SE',
    fatSuppression: false,
    inversionRecovery: false,
    echoTime: 10,
    repetitionTime: 600,
    inversionTime: 0,
    flipAngle: 10,
    fieldStrength: '',
    phaseMatrix: 256,
    frequencyMatrix: 320,
    frequencyVoxelSize: 1,
    phaseVoxelSize: 1,
    oversampling: 0.1,
    swapPhase: false,
    // For Ultra Lab
    averages: 1,
    concatenations: 2,
    partialFourier: 'Off',
    parallelFactor: 'Off',
    echoSpacing: 10,
    receiverBandWidth: 100,
    echoTrainLength: 3,
    enableTSEBlur: false,
    enableResolution: false,
    enableCompactMode: true,
    enableFovWrap: true,
    enableCruncherResolution: true,
    enableCruncherBasicLab: true,
    enableBitDepth8: true,
    echoOrdering: 'linear',
    sliceSelection: true,
    canDragAboveTR: true,
    scanTime: 10,
    pixelShift: 0,
    noiseFactor: 150,
    flatFactor: 0,
    falloffFactor: 0,
    trEfficiency: 100,
    minConcatAcqPackage: 0,
    vendorStyle: '',
    elapsedTime: 0,
    lostWindowFocus: 0,
    rfPulsing: 'fast',
    gradientRamp: 'fast',
    specialtyOption: '',
    diffusionDirections: 3,
    numBValues: 2,
    bValues: [0, 800],
    bAverages: [1, 1],
    bValueLower: 0,
    bValueUpper: 0,
    diffusionADC: true,

    // For CT Lab
    windowWidth: 400,
    windowLevel: 40,
    kernel: 'B10f',
    tubePotential: 10,
    tubeCurrent: 200,
    rotationTime: 1.0,
    pitch: configs.isCTLab ? 0.5 : 0.8,
    breathingInstruction: BREATHING_INSTRUCTION.OFF,
    cardiacAcquisitionType: CARDIAC_ACQUISITION_TYPE.PROSPECTIVE,
    rWaveDelay: 0,
    ignoreBadBeats: false,
    badBeatsTolerance: 0,
  },
  {
    visible: true,
    center3: new THREE.Vector3(-6.42, -25.92, 33.58),
    dimensions3: new THREE.Vector3(configs.isCTLab ? 130 : 100, configs.isCTLab ? 130 : 120, 95),
    xDirection3: new THREE.Vector3(0, 1, 0),
    yDirection3: new THREE.Vector3(0, 0, 1),
    numberOfSlices: 20,
    thickness: 3,
    spacing: 2,
    maxRotationOff: 0,
    sequenceType: 'SE',
    fatSuppression: false,
    inversionRecovery: false,
    echoTime: 10,
    repetitionTime: 600,
    inversionTime: 0,
    flipAngle: 10,
    fieldStrength: '',
    phaseMatrix: 256,
    frequencyMatrix: 320,
    frequencyVoxelSize: 1,
    phaseVoxelSize: 1,
    oversampling: 0.1,
    swapPhase: false,
    // For Ultra Lab
    averages: 1,
    concatenations: 2,
    partialFourier: 'Off',
    parallelFactor: 'Off',
    echoSpacing: 10,
    receiverBandWidth: 100,
    echoTrainLength: 3,
    enableTSEBlur: false,
    enableResolution: false,
    enableCompactMode: true,
    enableFovWrap: true,
    enableCruncherResolution: true,
    enableCruncherBasicLab: true,
    enableBitDepth8: true,
    echoOrdering: 'linear',
    sliceSelection: true,
    canDragAboveTR: true,
    scanTime: 15,
    pixelShift: 0,
    noiseFactor: 150,
    flatFactor: 0,
    falloffFactor: 0,
    trEfficiency: 100,
    minConcatAcqPackage: 0,
    vendorStyle: '',
    elapsedTime: 0,
    lostWindowFocus: 0,
    rfPulsing: 'fast',
    gradientRamp: 'fast',
    specialtyOption: '',
    diffusionDirections: 3,
    numBValues: 2,
    bValues: [0, 800],
    bAverages: [1, 1],
    bValueLower: 0,
    bValueUpper: 0,
    diffusionADC: true,

    // For CT Lab
    windowWidth: 400,
    windowLevel: 40,
    kernel: 'B10f',
    tubePotential: 10,
    tubeCurrent: 200,
    rotationTime: 1.0,
    pitch: configs.isCTLab ? 0.5 : 0.8,
    breathingInstruction: BREATHING_INSTRUCTION.OFF,
    cardiacAcquisitionType: CARDIAC_ACQUISITION_TYPE.PROSPECTIVE,
    rWaveDelay: 0,
    ignoreBadBeats: false,
    badBeatsTolerance: 0,
  },
]

// Shallow clone with support for cloning Vec3s
function cloneSelectionConfig(selectionConfig) {
  let out = {}
  _.each(selectionConfig, function (val, key) {
    out[key] = val instanceof THREE.Vector3 ? val.clone() : val
  })
  return out
}
// Shallow restore object, copy by value, or copy Vec3 from source into target
function restoreSelectionConfig(target, source) {
  _.each(source, function (val, key) {
    if (val instanceof THREE.Vector3) {
      target[key].copy(val)
    } else {
      target[key] = val
    }
  })
}

function getHeightFromNumberOfSlicesThicknessSpacing(numberOfSlices, thickness, spacing) {
  return (numberOfSlices - 1) * thickness + (numberOfSlices - 1) * spacing
}

// This is lossy, because NumberOfSlices must be an integer, but the actual value based on the rest may not be, so it may cause a slight change in ~height
function getNumberOfSlicesFromHeightThicknessSpacing(height, thickness, spacing) {
  return Math.round(height / (thickness + spacing) + 1)
}

// Ident = GroupID_IdentType
const IDENTTYPE_TO_NAME = {
  proposed: 'Initial',
  min: 'Min',
  max: 'Max',
}

const Z_DISPLACEMENT_AMOUNT_WHEN_CLONING = 15

function arrayToTruthMap(items) {
  return _.mapValues(_.zipObject(items), function () {
    return true
  })
}

// Unique value for dot scaling that makes (most of) the dots transparent
// Oversampling icon is bigger than small icon, make transparent icon equal to small icon
const DOT_SCALE_VALUE_TRANSPARENT = 0.99

// this drives the Dot Size values (1.5 is 150% as big) for Slider UI (first value is also fully transparent)
const DOT_SCALE_VALUES = [DOT_SCALE_VALUE_TRANSPARENT, 1, 1.5, 2, 3]
// Geometries for Dots, by their scale, ie: {1: THREE.SphereGeometry, ...}
const DOT_GEOMETRY_BY_SCALE = _.mapValues(arrayToTruthMap(DOT_SCALE_VALUES), function (unused, scale) {
  let segments = Math.ceil(8 * scale)
  let geometry = new THREE.SphereGeometry(4, segments, segments) //  * scale
  geometry.scale(scale, scale, scale)
  return geometry
})

// Manages what the Selection/FOV config is, and also the instances of the SliceView + if one of them is fullscreen
const selectionConfig = {
  namespaced: true,
  saveState: LOCAL_STATE_TO_SAVE,
  exportState: ['selectionConfigsByIdent', 'selectionConfigCurrentIdent'],
  serializers: {
    selectionConfigsByIdent: {
      get(value) {
        // serialize
        return _.mapValues(value, function (selectionConfig) {
          return _.mapValues(selectionConfig, function (val, key) {
            // Vector3
            return key.endsWith('3') ? val.toArray() : val
          })
        })
      },
      set(value) {
        // deserialize
        return _.mapValues(value, function (selectionConfig) {
          return _.mapValues(selectionConfig, function (val, key) {
            // Vector3
            if (key.endsWith('3')) {
              let vec3 = new THREE.Vector3()
              return vec3.fromArray(val)
            } else {
              return val
            }
          })
        })
      },
    },
  },
  state: {
    ready: false, // only true once init is called
    showOutline: false,
    // proposed - the selection that you've proposed (either for submitting your own attempt at an answer, or to take slice)
    // correctMin / correctMax - The correct answer Min or Max, between which the user submitted propsed answer should lay
    selectionConfigsByIdent: {}, // used to just be one, but now have either that, or maybe 2 for the bounding boxes + 1 for selection (uncheckable to hide in tabs?)
    selectionConfigCurrentIdent: '0_proposed',
    registeredSliceViewsById: {}, // {sliceViewId: {selectionClassInstances, onAddedStackVolumeSelection, onRemovedStackVolumeSelection},...}
    heightChangeTarget: 'numberOfSlices', // spacing / thickness / numberOfSlices: numberOfSlices is what should be default
    proposedSelectionConfigNonLocalizerBackup: null, // backup of the proposed selection config before entering AddLocalizerMode
    toolSelected: 'pan',
    toolSelectedConfig: {},
    isFullscreen: false,
    isAddLocalizerMode: false,
    hasAddedLocalizer: false,
    fullscreenSourceId: null,
    wasAnswerCurrentSingleSlice: null, // used to restore to when Reverting Answer
    dotScaleMultiplier: DOT_SCALE_VALUES[2],
    isVolumeViewMode: false,
    showReferenceLines: false,
    referenceSliceCornersBySliceViewId: {}, // {id: Array<Vector3>} with 4 corners of slice to use for ReferenceLine
    centerPlaneIntersectionDirBySliceViewId: {}, // {id: Vector3} with direction of center plane intersection
    previousKeepCurSpacingThickness: null, // boolean
    previousOverwriteSpacingThickness: null, // {},
    selectedMRIScanDirection: 1,
    isMRIShowHeadHolder: false,
    // The scandirection of localizer
    // It only is set one time when user start a test and landmark
    selectedMRIScanDirectionOfLocalizer: 1,
    isScanPositionRight: false,
    // Percent of landmark distance from top of bodybox to landmarked position
    // When value <= -1, it mean the landmark value is out of bodybox
    // When value > 3 it mean the landmark value is out of bodybox
    // One unit represents 33%
    landmarkDistanceRatio: -1,
    // Distance from top of bodyBox to landmarked position
    landmarkDistanceSI: -100,
    // Distance from lazer to landmark tolerance box (vertically)
    landmarkDistanceAP: -100,
    injectionSalineValue: 0,
    injectionContrastValue: 0,
    salineFlow: 1,
    contrastFlow: 1,
    delayTime: 0,
    delayTimeByQuestion: {},
    isHotkeysEnabledCT: true,
    isUltraLab: false,
    slabThicknessMethod: [1, 1, 1], // Per-slice-view array: 0=MIP, 1=Mean, 2=MinIP

    powerInjectorCurrentDuration: 0.0,
    lastPowerInjectorCurrentDuration: 0.0,

    selectedScanDelayOfThisQuestion: 0,
    groupSelectionConfigs: [], // selectionConfigsByIdent key
    keyStates: {},

    sliceViewComponentConfigs: [],
  },
  watchStates: {
    showOutline: 'update',
    selectionConfigsByIdent: 'onSelectionConfigsByIdentChanged',
  },
  mutations: {
    set(state, stuff) {
      let shouldMutated = false

      // Check if key and value has been changed
      for (const each of Object.keys(stuff)) {
        if (!_.isEqual(state[each], stuff[each])) {
          shouldMutated = true
          break
        }
      }

      if (stuff.numberOfSlices && stuff.numberOfSlices < 1) {
        stuff.numberOfSlices = 1
      }
      if (shouldMutated) {
        _.extend(state, stuff)

        saveState(LOCAL_STATE_PREFIX, LOCAL_STATE_TO_SAVE, state)
      }
    },
    setSlabThicknessMethodForSlice(state, { sliceIndex, method }) {
      Vue.set(state.slabThicknessMethod, sliceIndex, method)
      saveState(LOCAL_STATE_PREFIX, LOCAL_STATE_TO_SAVE, state)
    },
    setHotKeysEnabledCT(state, isHotkeysEnabledCT) {
      state.isHotkeysEnabledCT = isHotkeysEnabledCT
    },
  },
  actions: {
    // this is called when unloading the MRI/main vue
    reset({ commit }) {
      commit('set', {
        ready: false,
        isFullscreen: false,
        showReferenceLines: false,
        hasAddedLocalizer: false,
        selectionConfigsByIdent: {},
        referenceSliceCornersBySliceViewId: {},
        centerPlaneIntersectionDirBySliceViewId: {},
        isScanPositionRight: false,
        landmarkDistanceRatio: -1,
        landmarkDistanceSI: -100,
        landmarkDistanceAP: -100,
        injectionSalineValue: 0,
        injectionContrastValue: 0,
        salineFlow: 1,
        contrastFlow: 1,
        delayTime: 0,
        groupSelectionConfigs: [],
        sliceViewComponentConfigs: [],
      })
    },
    selectAllSelectionConfigs({ state, commit, dispatch }) {
      const allIdentKeys = []
      _.each(state.selectionConfigsByIdent, function (selectionConfig, ident) {
        if (isIdent(ident)) {
          allIdentKeys.push(ident)
        }
      })

      commit('set', { groupSelectionConfigs: allIdentKeys })
      dispatch('update')
    },
    updateKeyState({ state, commit }, { key, value }) {
      const keyStates = _.cloneDeep(state.keyStates)
      keyStates[key] = value
      commit('set', { keyStates })
    },
    addSelectionConfigToGroup({ state, commit, dispatch }, { ident }) {
      const groupSelectionConfigs = _.cloneDeep(state.groupSelectionConfigs)
      if (!_.includes(groupSelectionConfigs, ident)) {
        groupSelectionConfigs.push(ident)
        commit('set', { groupSelectionConfigs })
        dispatch('update')
      } else {
        dispatch('update')
      }
    },
    toggleSelectionConfigGroupToGroup({ state, commit, dispatch }, { groupId }) {
      let groupSelectionConfigs = state.groupSelectionConfigs
      const groupIds = _.uniq(groupSelectionConfigs.map((el) => identToGroupId(el)))
      if (!_.includes(groupIds, groupId)) {
        SELECTION_IDENT_TYPES.forEach((type) => {
          const ident = `${groupId}_${type}`
          if (_.has(state.selectionConfigsByIdent, ident)) {
            groupSelectionConfigs.push(ident)
          }
        })
        commit('set', { groupSelectionConfigs })
        dispatch('update')
      } else {
        SELECTION_IDENT_TYPES.forEach((type) => {
          const ident = `${groupId}_${type}`
          if (_.has(state.selectionConfigsByIdent, ident)) {
            groupSelectionConfigs = groupSelectionConfigs.filter((el) => el != ident)
          }
        })
        commit('set', { groupSelectionConfigs })
        dispatch('update')
      }
    },
    toggleSelectionConfigToGroup({ state, commit, dispatch }, { ident }) {
      const groupSelectionConfigs = state.groupSelectionConfigs
      if (!_.includes(groupSelectionConfigs, ident)) {
        groupSelectionConfigs.push(ident)
        commit('set', { groupSelectionConfigs })
        dispatch('update')
      } else {
        const index = groupSelectionConfigs.indexOf(ident)
        if (index > -1) {
          groupSelectionConfigs.splice(index, 1)
          commit('set', { groupSelectionConfigs })
          dispatch('update')
        }
      }
    },
    clearGroupSelectionConfigs({ commit, dispatch }) {
      commit('set', { groupSelectionConfigs: [] })
      dispatch('update')
    },
    stateImportBefore({ commit, dispatch }) {
      // We're about to overwrite the selectionConfigsByIdent fully; there isn't enough diffing to replacing the instances if they existed before and after this...
      // ... so just get rid of all the configs/instances
      commit('set', { selectionConfigsByIdent: {} })
      dispatch('cleanupUnusedInstances')
    },
    stateImportAfter({ dispatch }) {
      // Now that we have the selectionConfigsByIdent as we want it, trigger all the usual logic when these change by running a setSelectionConfig with NO-OP
      dispatch('setSelectionConfig', {})
    },
    setIsAddLocalizerMode({ state, commit, dispatch }, isAddLocalizerMode) {
      let { selectionConfigCurrentIdent, proposedSelectionConfigNonLocalizerBackup } = state
      // Turn on Localizer Mode
      if (isAddLocalizerMode && !state.isAddLocalizerMode) {
        // Store all groups' proposed
        let proposedSelectionConfigs = _.pickBy(state.selectionConfigsByIdent, function (unused, ident) {
          return ident.endsWith('proposed')
        })

        // make this proposed the current ident
        selectionConfigCurrentIdent = _.first(_.keys(proposedSelectionConfigs))

        // clone all proposed selection configs as a backup to restore later (the reason they go invisible is in stack-volume-selection.js)
        // We probably just need to backup the current proposed ident that we're using for Localizer Mode, but oh well
        proposedSelectionConfigNonLocalizerBackup = _.mapValues(proposedSelectionConfigs, function (config) {
          return cloneSelectionConfig(config)
        })

        state.selectionConfigsByIdent[selectionConfigCurrentIdent].visible = true
        state.selectionConfigsByIdent[selectionConfigCurrentIdent].dimensions3.set(150, 150, 150)
        if (!config.isCTLab) {
          state.selectionConfigsByIdent[selectionConfigCurrentIdent].numberOfSlices = 3
          state.selectionConfigsByIdent[selectionConfigCurrentIdent].thickness = 0
          state.selectionConfigsByIdent[selectionConfigCurrentIdent].spacing = 10
        } else {
          state.selectionConfigsByIdent[selectionConfigCurrentIdent].numberOfSlices = NUM_OF_LOCALIZER_SLICES_OF_CT
          state.selectionConfigsByIdent[selectionConfigCurrentIdent].thickness = 0
          state.selectionConfigsByIdent[selectionConfigCurrentIdent].spacing = 3
        }

        // Turn off Localizer Mode
      } else if (!isAddLocalizerMode && state.isAddLocalizerMode) {
        // restore all proposed selectionConfigs to how they were before
        _.each(proposedSelectionConfigNonLocalizerBackup, function (config, ident) {
          restoreSelectionConfig(state.selectionConfigsByIdent[ident], config)
        })
        proposedSelectionConfigNonLocalizerBackup = null
      }

      commit('set', { isAddLocalizerMode, selectionConfigCurrentIdent, proposedSelectionConfigNonLocalizerBackup })
      // Needed since visually of StackVolumeSelection change based on this
      dispatch('update')
      // Hide/deselect interactables
      dispatch('interactableService/setSelectedInteractableIdent', null, { root: true })
      dispatch('interactableService/update', {}, { root: true })
    },
    setIsUltraLab({ commit }, isUltraLab) {
      commit('set', { isUltraLab })
    },
    setHasAddedLocalizer({ commit, dispatch }, hasAddedLocalizer) {
      commit('set', { hasAddedLocalizer })
      // Needed since visually of StackVolumeSelection change based on this
      dispatch('update')
    },
    // This is called every time MRI.vue is mounted, so that can be multiple times , sometimes with Editing Questions, sometimes not
    // rootState.questionService.isEditingQuestion isn't ready in tim
    init({ commit, dispatch }) {
      dispatch('reset', {})
      commit('set', { ready: true })
    },

    // For the button that admins have during QuestionEdit to set the Initial to where Min currently is, etc
    // applyToAllGroups - if set, apply to all groups; else, just the current
    copyCurMinSelectionConfigIntoProposed({ state, getters, dispatch }, applyToAllGroups) {
      let groupIds = applyToAllGroups
        ? _.map(getters.selectionConfigsGroups, 'id')
        : [getters.selectionConfigsCurrentGroupId]
      _.each(groupIds, function (groupId) {
        dispatch('setSelectionConfig', {
          ident: `${groupId}_proposed`,
          selectionConfigCloneOverwrite: { visible: true }, // don't let Init be hidden by cloning because Min was hidden
          cloneFromIdent: `${groupId}_min`,
        })

        // Move it down a bit (bypassing setSelectionConfig means it won't fire the callbacks, but that's ok in this case, since proposed/initial doesn't sync with anything)
        let { center3 } = state.selectionConfigsByIdent[`${groupId}_proposed`]
        center3.z -= Z_DISPLACEMENT_AMOUNT_WHEN_CLONING
      })
      dispatch('update')

      Vue.notify({ type: 'success', text: 'Initial set to location/config of Min' })
    },

    // Add a group (with a specific index, or just the next highest available)
    addSelectionConfigGroup({ state, getters, dispatch, rootState }, { groupId }) {
      groupId = _.isFinite(groupId) ? groupId : getters.selectionConfigsHighestGroupId + 1

      // setup the answer-range selectionConfigs, if not already done (when loading a question in Edit)
      // Creates one group of the identType by default, which can then potentially be restored to their proper data right after?
      if (rootState.questionService.isEditingQuestion) {
        let selectionConfig = null

        // if not adding first/initial group, clone from current group
        let cloneFromGroupId = null
        let isCloningGroup = false
        if (getters.selectionConfigsGroups.length >= 1) {
          cloneFromGroupId = getters.selectionConfigsCurrentGroupId
          isCloningGroup = true
        }

        // Min
        dispatch('setSelectionConfig', {
          ident: `${groupId}_min`,
          setCurrent: false,
          cloneFromIdent: isCloningGroup ? `${cloneFromGroupId}_min` : null,
        })

        // Make non-height Dimension a bit larger (changing height has implications on spacing/thickness, so do below)
        // dimensions3.multiplyScalar(1.5);
        let { dimensions3: dimensions3Min } = state.selectionConfigsByIdent[`${groupId}_min`]

        if (isCloningGroup) {
          selectionConfig = null
        } else {
          let dimensions3 = dimensions3Min.clone()
          dimensions3.x *= 1.4
          dimensions3.y *= 1.4
          selectionConfig = { dimensions3 }
        }

        // Max
        dispatch('setSelectionConfig', {
          ident: `${groupId}_max`,
          setCurrent: true,
          selectionConfig,
          cloneFromIdent: isCloningGroup ? `${cloneFromGroupId}_max` : null,
        })

        // Change height of Max by increasing the spacing
        dispatch('adjustSpacing', { spacing: 4 })

        // Add proposed selection to try what the score would be
        if (isCloningGroup) {
          selectionConfig = null
        } else {
          // Make non-height Dimension a bit larger (changing height has implications on spacing/thickness, so do below)
          // dimensions3Proposed.multiplyScalar(1.5);
          let dimensions3Proposed = dimensions3Min.clone()
          dimensions3Proposed.x *= 1.2
          dimensions3Proposed.y *= 1.2
          selectionConfig = {
            visible: false,
            dimensions3: dimensions3Proposed,
          }
        }

        // Proposed/Initial
        dispatch('setSelectionConfig', {
          ident: `${groupId}_proposed`,
          setCurrent: true,
          selectionConfig,
          cloneFromIdent: isCloningGroup ? `${cloneFromGroupId}_proposed` : null,
        })

        // When cloning a group (by adding a new one), move the new group down a bit collectively so it doesn't 100% overlap the Selections of the previous
        if (isCloningGroup) {
          state.selectionConfigsByIdent[`${groupId}_min`].center3.z -= Z_DISPLACEMENT_AMOUNT_WHEN_CLONING
          state.selectionConfigsByIdent[`${groupId}_max`].center3.z -= Z_DISPLACEMENT_AMOUNT_WHEN_CLONING
          state.selectionConfigsByIdent[`${groupId}_proposed`].center3.z -= Z_DISPLACEMENT_AMOUNT_WHEN_CLONING
        }

        // Change height of Max by increasing the spacing
        dispatch('adjustSpacing', { spacing: 3 })
        dispatch('selectAllSelectionConfigs', { ident: `${groupId}_max` })
      } else {
        dispatch('setSelectionConfig', { ident: `${groupId}_proposed`, setCurrent: true })
      }
    },

    addManageDicomBoxesSelectionConfigGroup({ getters, dispatch }, { groupId }) {
      groupId = _.isFinite(groupId) ? groupId : getters.selectionConfigsHighestGroupId + 1

      let selectionConfig = null
      // Max
      dispatch('setSelectionConfig', {
        ident: `${groupId}_${SCAN_BOX_IDENT}`,
        setCurrent: true,
        selectionConfig,
        cloneFromIdent: null,
      })

      // Change height of Max by increasing the spacing
      dispatch('adjustSpacing', { spacing: 4 })

      // Proposed/Initial
      dispatch('setSelectionConfig', {
        ident: `${groupId}_${LOCALIZER_BOX_IDENT}`,
        setCurrent: true,
        selectionConfig,
        cloneFromIdent: null,
      })

      // Change height of Max by increasing the spacing
      dispatch('adjustSpacing', { spacing: 3 })

      dispatch('setSelectionConfigCurrentIdent', { ident: `${groupId}_${LOCALIZER_BOX_IDENT}` })
    },

    // Remove Selection Configs
    removeSelectionConfigs({ state, commit }, { idents, identTypes }) {
      let selectionConfigsByIdent = _.clone(state.selectionConfigsByIdent)
      if (idents) {
        selectionConfigsByIdent = _.omit(selectionConfigsByIdent, idents)
      }
      if (identTypes) {
        selectionConfigsByIdent = _.omitBy(selectionConfigsByIdent, function (selectionConfig, ident) {
          let identType = identToIdentType(ident)
          return _.includes(identTypes, identType)
        })
      }
      commit('set', { selectionConfigsByIdent })
    },
    // Set a selectionConfig by ident to what is supplied; can be partial; everything missing will be left as is, or filled in with a preset if still nil
    // setCurrent - bool - set passed in ident as the current
    // identType - optional, pass in to derive the ident based on this identType + currentGroupId
    // skipSyncingOtherGroups - whether to skip syncing values to other groups
    // cloneFromIdent - instead of defaulting to cloning from hardcoded preset, clone from this ident
    // ident - optional, (leave blank, but identType is set, uses currentGroupId_identType; if identType is not passed in either, assume current one is desired)
    //   ident = currentGroup_identType
    // selectionConfigCloneOverwrite; when clone, overwrite result of clone with these selectionConfig props
    setSelectionConfig(
      { state, getters, commit, dispatch },
      {
        ident,
        identType,
        setCurrent,
        skipSyncingOtherGroups,
        cloneFromIdent,
        selectionConfig = {},
        selectionConfigCloneOverwrite,
      }
    ) {
      if (identType) {
        ident = `${getters.selectionConfigsCurrentGroupId}_${identType}`
      } else if (!ident) {
        ident = state.selectionConfigCurrentIdent
      }

      // Shallow clone necessary to detect changes by getters
      let selectionConfigsByIdent = _.clone(state.selectionConfigsByIdent)
      let selectionConfigCurrent = selectionConfigsByIdent[ident] || {}

      // set anything into it that was passed in
      Object.assign(selectionConfigCurrent, selectionConfig)

      // set anything into it that is still missing, from the first preset
      let preset = cloneFromIdent ? state.selectionConfigsByIdent[cloneFromIdent] : selectionPresets[0]
      _.each(preset, function (val, key) {
        if (_.isNil(selectionConfigCurrent[key])) {
          // Clone vector3s in the preset (to avoid editing the preset itself), otherwise it's just a number that'll copy by value fine
          selectionConfigCurrent[key] = _.result(val, 'clone') || val

          // There is already a value for this key, but we want to clone into it
        } else if (cloneFromIdent) {
          if (selectionConfigCurrent[key].copy) {
            // vec3 way to copy value of source vec3 into it
            selectionConfigCurrent[key].copy(val)
          } else {
            selectionConfigCurrent[key] = val
          }
        }
      })

      // when clone, overwrite result of clone with these selectionConfig props
      if (cloneFromIdent && selectionConfigCloneOverwrite) {
        Object.assign(selectionConfigCurrent, selectionConfigCloneOverwrite)
      }

      // present doesn't explicitly contain zDirection3 (need to cross x y)
      if (_.isNil(selectionConfigCurrent.zDirection3)) {
        selectionConfigCurrent.zDirection3 = preset.xDirection3.clone()
        selectionConfigCurrent.zDirection3.cross(preset.yDirection3)
      }

      let selectionConfigCurrentIdent = setCurrent ? ident : state.selectionConfigCurrentIdent

      selectionConfigsByIdent[ident] = selectionConfigCurrent

      commit('set', {
        selectionConfigsByIdent: sortKeysByArrayOrder(selectionConfigsByIdent, ['proposed', 'min', 'max']),
        selectionConfigCurrentIdent,
      })
      dispatch('cleanupUnusedInstances')
      dispatch('addSelectionClassInstanceToSliceViewsAsNeeded', { ident })
      dispatch('update')

      // Whenever one is set, the other group's selectionConfigs of same identType should sync, but not recursively
      if (!skipSyncingOtherGroups) {
        dispatch('syncSelectionConfigToOtherGroups', { ident })
      }
    },
    adjustSelectionConfig({ state, dispatch }, { selectionConfig, ident }) {
      if (!ident) {
        ident = state.selectionConfigCurrentIdent
      }
      const config = state.selectionConfigsByIdent[ident]

      if (!config) {
        return
      }
      let { center3, dimensions3, xDirection3, yDirection3, zDirection3 } = config

      if (center3) {
        center3.copy(selectionConfig.center3)
      }
      if (dimensions3) {
        dimensions3.copy(selectionConfig.dimensions3)
      }
      if (xDirection3) {
        xDirection3.copy(selectionConfig.xDirection3)
      }
      if (yDirection3) {
        yDirection3.copy(selectionConfig.yDirection3)
      }
      if (zDirection3) {
        zDirection3.copy(selectionConfig.zDirection3)
      }

      // Reset signal average when selection geometry is adjusted (position/size/orientation changes affect slice selection)
      dispatch('setSignalAverage', { signalAverage: null, ident })
      // Reset bSignalAverages for DIFF sequences
      const currentConfig = state.selectionConfigsByIdent[ident]
      if (currentConfig && currentConfig.sequenceType === 'DIFF') {
        dispatch('setBSignalAverages', { bSignalAverages: [], ident })
      }

      dispatch('cleanupUnusedInstances')
      dispatch('addSelectionClassInstanceToSliceViewsAsNeeded', { ident })
      dispatch('update')
      dispatch('afterSelectionUserModified', {})
    },
    // After a selectionConfig has been changed, sync all other group's selectionConfigs of the same identType
    syncSelectionConfigToOtherGroups({ state, getters, dispatch }, { ident }) {
      // if there is > 1 group, sync all the current up with all groups' same identType
      let groups = getters.selectionConfigsGroups
      if (groups.length > 1) {
        let groupIdUserModified = identToGroupId(ident)
        let identType = identToIdentType(ident)

        let config = state.selectionConfigsByIdent[ident]

        _.each(groups, function (group) {
          if (group.id !== groupIdUserModified) {
            let identOther = `${group.id}_${identType}`
            let configOther = state.selectionConfigsByIdent[identOther]
            if (configOther) {
              let { spacing, thickness, visible, oversampling } = config
              // - Sync spacing/thickness while leaving numberOfSlices alone (which means height has to change)
              configOther.dimensions3.z = getHeightFromNumberOfSlicesThicknessSpacing(
                configOther.numberOfSlices,
                thickness,
                spacing
              )

              // sync Phase / Frequency
              configOther.dimensions3.x = config.dimensions3.x
              configOther.dimensions3.y = config.dimensions3.y

              dispatch('setSelectionConfig', {
                skipSyncingOtherGroups: true,
                ident: identOther,
                selectionConfig: {
                  dimensions3: configOther.dimensions3,
                  spacing,
                  thickness,
                  visible,
                  oversampling,
                },
              })
            }
          }
        })
      }
    },

    // Remove any instances that no longer have a corresponding selectionConfig
    cleanupUnusedInstances({ state, commit }) {
      // remove any selectionClassInstances that are not for any current selectionConfig
      let { registeredSliceViewsById } = state
      _.each(registeredSliceViewsById, function (sliceViewData) {
        let removedSomething = false

        sliceViewData.selectionClassInstances = _.reject(sliceViewData.selectionClassInstances, function (instance) {
          let remove = !state.selectionConfigsByIdent[instance.ident]
          if (remove) {
            // Run cleanup before destroying instance
            instance.beforeDestroy()
            instance.dispose()
            removedSomething = true
          }
          return remove
        })

        if (removedSomething) {
          sliceViewData.onRemovedStackVolumeSelection(sliceViewData.selectionClassInstances)
        }
      })

      commit('set', { registeredSliceViewsById })
    },

    // ident - switch to that ident
    // pass in identType or groupId instead to keep the other the same and switch to it
    setSelectionConfigCurrentIdent({ getters, commit, dispatch }, { ident, identType, groupId }) {
      if (identType) {
        ident = `${getters.selectionConfigsCurrentGroupId}_${identType}`
      } else if (_.isFinite(groupId)) {
        ident = `${groupId}_${getters.selectionConfigCurrentIdentType}`
      }
      commit('set', { selectionConfigCurrentIdent: ident })
      dispatch('update')
    },

    resetSelection({ getters, dispatch }, { index, dirOnly }) {
      log.debug('resetSelection', index, dirOnly)
      let preset = selectionPresets[index]
      let { center3, dimensions3, xDirection3, yDirection3, zDirection3 } = getters
      xDirection3.copy(preset.xDirection3)
      yDirection3.copy(preset.yDirection3)
      // zDirection3 is just x Cross y
      // xDirection3.clone().cross(yDirection3) //new THREE.Vector3(0, 0, 1)
      zDirection3.copy(preset.xDirection3)
      zDirection3.cross(yDirection3)
      log.debug('xyz dir', xDirection3, yDirection3, zDirection3)

      if (!dirOnly) {
        center3.copy(preset.center3)
        dimensions3.copy(preset.dimensions3)
        let { numberOfSlices, thickness, spacing } = preset
        dispatch('setSelectionConfig', {
          selectionConfig: {
            center3,
            dimensions3,
            xDirection3,
            yDirection3,
            zDirection3,
            numberOfSlices,
            thickness,
            spacing,
          },
        })
      } else {
        dispatch('setSelectionConfig', {
          selectionConfig: { xDirection3, yDirection3, zDirection3 },
        })
      }

      // Reset signal average when selection is reset (complete geometry change affects slice selection)
      dispatch('setSignalAverage', { signalAverage: null })
      // Reset bSignalAverages for DIFF sequences
      const currentConfig = getters.selectionConfigCurrent
      if (currentConfig && currentConfig.sequenceType === 'DIFF') {
        dispatch('setBSignalAverages', { bSignalAverages: [] })
      }

      // Needed to sync up Min/Max when one is rotated, etc
      dispatch('afterSelectionUserModified', {})
    },
    // "Copy Slice Position" action - sets Selection position to slice's midpoint, and changes orientation to be axis-aligned with slice plane
    setAllSelectionToSliceMidpoint(
      { getters, dispatch, state, commit },
      [sliceMidpoint3, yDirection3from, zDirection3from, cameraUp3, isPerpendicular]
    ) {
      if (!config.isCTLab || !getters.selectionConfigCurrent) {
        return
      }

      let { center3, xDirection3, yDirection3, zDirection3 } = getters
      if (!center3) {
        return
      }

      center3.copy(sliceMidpoint3)

      yDirection3.copy(yDirection3from)
      zDirection3.copy(zDirection3from)
      xDirection3.copy(zDirection3from)
      xDirection3.cross(yDirection3)

      if (isPerpendicular) {
        // Rotate 90deg (in radian) to the side, based on onlooker/camera
        xDirection3.applyAxisAngle(cameraUp3, RADIAN_90_DEG)
        yDirection3.applyAxisAngle(cameraUp3, RADIAN_90_DEG)
        zDirection3.applyAxisAngle(cameraUp3, RADIAN_90_DEG)
      }

      let groupId = getters.selectionConfigsCurrentGroupId
      let selectionConfigsByIdent = _.clone(state.selectionConfigsByIdent)
      _.each(SELECTION_IDENT_TYPES, function (identType) {
        let ident = `${groupId}_${identType}`
        if (selectionConfigsByIdent[ident]) {
          if (_.has(selectionConfigsByIdent[ident], ['center3'])) {
            selectionConfigsByIdent[ident].center3.copy(center3)
          }
          if (_.has(selectionConfigsByIdent[ident], ['xDirection3'])) {
            selectionConfigsByIdent[ident].xDirection3.copy(xDirection3)
          }
          if (_.has(selectionConfigsByIdent[ident], ['yDirection3'])) {
            selectionConfigsByIdent[ident].yDirection3.copy(yDirection3)
          }
          if (_.has(selectionConfigsByIdent[ident], ['zDirection3'])) {
            selectionConfigsByIdent[ident].zDirection3.copy(zDirection3)
          }
        }
      })
      commit('set', { selectionConfigsByIdent })

      // Reset signal average when position/orientation changes for all selections (geometry change affects slice selection)
      dispatch('setSignalAverage', { signalAverage: null })
      // Reset bSignalAverages for DIFF sequences
      const currentConfig = getters.selectionConfigCurrent
      if (currentConfig && currentConfig.sequenceType === 'DIFF') {
        dispatch('setBSignalAverages', { bSignalAverages: [] })
      }

      dispatch('update')
    },

    // "Copy Slice Position" action - sets Selection position to slice's midpoint, and changes orientation to be axis-aligned with slice plane
    setSelectionToSliceMidpoint(
      { getters, dispatch },
      [sliceMidpoint3, yDirection3from, zDirection3from, cameraUp3, isPerpendicular]
    ) {
      let { center3, xDirection3, yDirection3, zDirection3 } = getters
      center3.copy(sliceMidpoint3)

      yDirection3.copy(yDirection3from)
      zDirection3.copy(zDirection3from)
      xDirection3.copy(zDirection3from)
      xDirection3.cross(yDirection3)

      if (isPerpendicular) {
        // Rotate 90deg (in radian) to the side, based on onlooker/camera
        xDirection3.applyAxisAngle(cameraUp3, RADIAN_90_DEG)
        yDirection3.applyAxisAngle(cameraUp3, RADIAN_90_DEG)
        zDirection3.applyAxisAngle(cameraUp3, RADIAN_90_DEG)
      }

      dispatch('setSelectionConfig', {
        selectionConfig: { center3, xDirection3, yDirection3, zDirection3 },
      })

      // Reset signal average when position/orientation changes (geometry change affects slice selection)
      dispatch('setSignalAverage', { signalAverage: null })
      // Reset bSignalAverages for DIFF sequences
      const currentConfig = getters.selectionConfigCurrent
      if (currentConfig && currentConfig.sequenceType === 'DIFF') {
        dispatch('setBSignalAverages', { bSignalAverages: [] })
      }

      // Needed to sync up Min/Max when one is rotated, etc
      dispatch('afterSelectionUserModified', {})
    },

    smartRotateSelectionConfigDir({ state, getters, dispatch }, payload) {
      // We want to rotate all selectionConfigs
      _.each(state.selectionConfigsByIdent, function (config, ident) {
        if (!payload?.identType || payload.identType === identToIdentType(ident)) {
          let { xDirection3, yDirection3, zDirection3, dimensions3 } = config

          // Rotate 90deg (in radian) to the side
          xDirection3.applyAxisAngle(zDirection3, RADIAN_90_DEG)
          yDirection3.applyAxisAngle(zDirection3, RADIAN_90_DEG)
          zDirection3.applyAxisAngle(zDirection3, RADIAN_90_DEG)

          let closestPEDDirWorldAxis3 = getClosestSignedAxis3(xDirection3)

          // We only ever want to point at H or A or L, so if now pointing to F or P or R, rotate 180deg
          if (closestPEDDirWorldAxis3.z === -1 || closestPEDDirWorldAxis3.y === 1 || closestPEDDirWorldAxis3.x === -1) {
            // rotate 180deg
            xDirection3.applyAxisAngle(zDirection3, RADIAN_180_DEG)
            yDirection3.applyAxisAngle(zDirection3, RADIAN_180_DEG)
            zDirection3.applyAxisAngle(zDirection3, RADIAN_180_DEG)
          }

          xDirection3.normalize()
          zDirection3.normalize()
          yDirection3.normalize()

          // Swap Phase/Freq amount so visual shape stays the same even after rotating 90deg or 270deg
          // (Doing this on the cur ident will apply it to all groups of its identType)
          // Bug? This still doesn't work great with Min/Max, which might be because it's not doing the swap of those / other identTypes?
          let { x, y } = dimensions3
          dimensions3.x = y
          dimensions3.y = x

          // Toggle swapPhase to track phase encoding direction swap
          const swapPhase = !config.swapPhase

          dispatch('setSelectionConfig', {
            skipSyncingOtherGroups: true,
            ident,
            selectionConfig: { xDirection3, yDirection3, zDirection3, dimensions3, swapPhase },
          })
        }
      })

      // Reset signal average when orientation changes (rotation affects slice selection)
      dispatch('setSignalAverage', { signalAverage: null })
      // Reset bSignalAverages for DIFF sequences
      const currentConfig = getters.selectionConfigCurrent
      if (currentConfig && currentConfig.sequenceType === 'DIFF') {
        dispatch('setBSignalAverages', { bSignalAverages: [] })
      }

      dispatch('afterSelectionUserModified', {})
    },

    // Copy answerDataSelection into a selectionConfig
    // creates selectionConfig if necessary, leaves it as-is/default if no answerData supplied
    setSelectionFromAnswerData(
      { state, dispatch, rootGetters, rootState },
      { answerData, ident, invisible = false, overwriteSpacingThickness, overwriteFieldStrength }
    ) {
      let visible = !invisible
      // If this ident doesn't have a selectionConfig yet, make a default one for it first
      if (!state.selectionConfigsByIdent[ident]) {
        dispatch('setSelectionConfig', { ident, selectionConfig: { visible } })
      }

      let {
        center3,
        dimensions3,
        xDirection3,
        yDirection3,
        zDirection3,
        numberOfSlices,
        thickness,
        spacing,
        maxRotationOff,
        sequenceType,
        fatSuppression,
        inversionRecovery,
        echoTime,
        inversionTime,
        repetitionTime,
        flipAngle,
        fieldStrength,
        phaseMatrix,
        frequencyMatrix,
        phaseVoxelSize,
        frequencyVoxelSize,
        oversampling,
        windowLevel,
        windowWidth,
        kernel,
        averages,
        concatenations,
        partialFourier,
        parallelFactor,
        echoSpacing,
        receiverBandWidth,
        echoTrainLength,
        scanTime,
        elapsedTime,
        lostWindowFocus,
        pixelShift,
        noiseFactor,
        flatFactor,
        falloffFactor,
        trEfficiency,
        minConcatAcqPackage,
        vendorStyle,
        rotationTime,
        pitch,
        beamSelected,
        breathingInstruction,
        rfPulsing,
        gradientRamp,
        specialtyOption,
        diffusionDirections,
        numBValues,
        bValues,
        bAverages,
        bValueLower,
        bValueUpper,
        diffusionADC,
        kvp,
        tubeCurrent,
      } = state.selectionConfigsByIdent[ident]
      // selection as stored in answer
      let answerSelection = answerData

      // answerData is blank
      if (!_.isFinite(_.get(answerSelection, 'centerX'))) {
        dispatch('setSelectionConfig', { ident, selectionConfig: { visible } })
      } else {
        xDirection3.x = answerSelection.xDirectionX
        xDirection3.y = answerSelection.xDirectionY
        xDirection3.z = answerSelection.xDirectionZ

        yDirection3.x = answerSelection.yDirectionX
        yDirection3.y = answerSelection.yDirectionY
        yDirection3.z = answerSelection.yDirectionZ

        // zDirection3 is just x Cross y
        if (!configs.isCTLab) {
          zDirection3.copy(xDirection3)
          zDirection3.cross(yDirection3)
        } else {
          // Prevent answerCurrentHasBeenModified is false when set answerDataCurrent, set selectionConfig equal answerDataCurrent
          if (
            _.some([answerSelection.zDirectionX, answerSelection.zDirectionY, answerSelection.zDirectionZ], (el) =>
              _.isNil(el)
            ) ||
            (answerSelection.yDirectionX == answerSelection.zDirectionX &&
              answerSelection.yDirectionY == answerSelection.zDirectionY &&
              answerSelection.yDirectionZ == answerSelection.zDirectionZ)
          ) {
            zDirection3.copy(xDirection3)
            zDirection3.cross(yDirection3)
          } else {
            zDirection3.x = answerSelection.zDirectionX
            zDirection3.y = answerSelection.zDirectionY
            zDirection3.z = answerSelection.zDirectionZ
          }
        }

        center3.x = answerSelection.centerX
        center3.y = answerSelection.centerY
        center3.z = answerSelection.centerZ
        dimensions3.x = answerSelection.dimensionX
        dimensions3.y = answerSelection.dimensionY
        dimensions3.z = answerSelection.dimensionZ

        maxRotationOff = answerSelection.maxRotationOff
        oversampling = answerSelection.oversampling

        // overwrite spacing+thickness while keeping height roughly near what it would have been, thereby adjusting numberOfSlices to make that work
        // Bug: (without checking for the values at the end to have something:) Rarely, one of these will come back as NaN (related to SingleSlice sometimes? Or maybe Skip question?), which is falsey, so don't overwrite in this case
        // Single Slice Bugfix: Need to not do this for single slice, because otherwise it sometimes shows a single slice Q's initial selection as a full stack of multiple slices)
        if (
          answerData.numberOfSlices > 1 &&
          overwriteSpacingThickness &&
          overwriteSpacingThickness.thickness &&
          overwriteSpacingThickness.spacing
        ) {
          thickness = overwriteSpacingThickness.thickness
          spacing = overwriteSpacingThickness.spacing
          // set numberOfSlices to what it needs to be to get to height based on fixed thickness+space, and ensure it's at least 1
          numberOfSlices = Math.max(1, getNumberOfSlicesFromHeightThicknessSpacing(dimensions3.z, thickness, spacing))
          // Adjust to the potentially slightly different height that results from having to round numberOfSlices to the nearest integer
          dimensions3.z = getHeightFromNumberOfSlicesThicknessSpacing(numberOfSlices, thickness, spacing)
        } else {
          numberOfSlices = answerSelection.numberOfSlices
          thickness = answerSelection.thickness
          spacing = answerSelection.spacing
        }

        // Contrast Lab Parameters
        sequenceType = answerSelection.sequenceType
        fatSuppression = answerSelection.fatSuppression
        inversionRecovery = answerSelection.inversionRecovery
        echoTime = answerSelection.echoTime
        inversionTime = answerSelection.inversionTime
        flipAngle = answerSelection.flipAngle
        repetitionTime = answerSelection.repetitionTime
        fieldStrength = answerSelection.fieldStrength
        kernel = answerSelection.kernel

        if (overwriteFieldStrength) {
          fieldStrength = overwriteFieldStrength
        }

        // Resolution Lab Parameters
        phaseMatrix = answerSelection.phaseMatrix
        frequencyMatrix = answerSelection.frequencyMatrix
        phaseVoxelSize = answerSelection.phaseVoxelSize
        frequencyVoxelSize = answerSelection.frequencyVoxelSize

        if (!_.isNil(answerData.windowLevel) && configs.isCTLab) {
          windowLevel = answerData.windowLevel
        }
        if (!_.isNil(answerData.windowWidth) && configs.isCTLab) {
          windowWidth = answerData.windowWidth
        }
        if (configs.isCTLab && _.has(answerData, ['breathingInstruction'])) {
          breathingInstruction = answerData.breathingInstruction
        }

        // When this question isn't confirmed, then we set breathingInstruction = the last breathingInstruction
        if (configs.isCTLab && _.has(answerData, ['overwriteBreathingInstruction'])) {
          breathingInstruction = answerData.overwriteBreathingInstruction
        }

        // If this question is confirmed, get breathingInstruction value from stackQuestion
        if (
          configs.isCTLab &&
          !rootState.questionService.isEditingQuestion &&
          _.has(rootGetters['questionService/stackQuestion'], ['breathingInstruction'])
        ) {
          breathingInstruction = _.get(rootGetters['questionService/stackQuestion'], ['breathingInstruction'])
        }
        // Ultra Lab Parameters
        averages = answerSelection.averages
        concatenations = answerSelection.concatenations
        partialFourier = answerSelection.partialFourier
        parallelFactor = answerSelection.parallelFactor
        echoSpacing = answerSelection.echoSpacing
        receiverBandWidth = answerSelection.receiverBandWidth
        echoTrainLength = answerSelection.echoTrainLength
        scanTime = answerSelection.scanTime
        elapsedTime = answerSelection.elapsedTime
        lostWindowFocus = answerSelection.lostWindowFocus
        pixelShift = answerSelection.pixelShift
        noiseFactor = answerSelection.noiseFactor
        flatFactor = answerSelection.flatFactor
        falloffFactor = answerSelection.falloffFactor
        trEfficiency = answerSelection.trEfficiency
        minConcatAcqPackage = answerSelection.minConcatAcqPackage
        vendorStyle = answerSelection.vendorStyle
        rfPulsing = answerSelection.rfPulsing
        gradientRamp = answerSelection.gradientRamp
        specialtyOption = answerSelection.specialtyOption
        diffusionDirections = answerSelection.diffusionDirections
        numBValues = answerSelection.numBValues
        bValues = answerSelection.bValues
        bAverages = answerSelection.bAverages
        bValueLower = answerSelection.bValueLower
        bValueUpper = answerSelection.bValueUpper
        diffusionADC = answerSelection.diffusionADC
        kvp = answerSelection.kvp
        tubeCurrent = answerSelection.tubeCurrent || TUBE_CONFIG.DEFAULT
        rotationTime = _.get(answerSelection, ['rotationTime'], DEFAULT_VALUE_FOR_SELECTION_CONFIG.rotationTime)
        pitch = _.get(answerSelection, ['pitch'], DEFAULT_VALUE_FOR_SELECTION_CONFIG.pitch)
        beamSelected = _.get(answerSelection, ['beamSelected'], DEFAULT_VALUE_FOR_SELECTION_CONFIG.beamSelected)

        dispatch('setSelectionConfig', {
          ident,
          selectionConfig: {
            center3,
            dimensions3,
            xDirection3,
            yDirection3,
            zDirection3,
            numberOfSlices,
            thickness,
            spacing,
            maxRotationOff,
            visible,
            repetitionTime,
            sequenceType,
            fatSuppression,
            inversionRecovery,
            echoTime,
            inversionTime,
            flipAngle,
            fieldStrength,
            phaseMatrix,
            frequencyMatrix,
            phaseVoxelSize,
            frequencyVoxelSize,
            oversampling,
            windowLevel,
            windowWidth,
            kernel,
            averages,
            concatenations,
            partialFourier,
            parallelFactor,
            echoSpacing,
            receiverBandWidth,
            echoTrainLength,
            scanTime,
            elapsedTime,
            lostWindowFocus,
            pixelShift,
            noiseFactor,
            flatFactor,
            falloffFactor,
            trEfficiency,
            minConcatAcqPackage,
            vendorStyle,
            rfPulsing,
            gradientRamp,
            specialtyOption,
            diffusionDirections,
            numBValues,
            bValues,
            bAverages,
            bValueLower,
            bValueUpper,
            diffusionADC,
            rotationTime,
            pitch,
            beamSelected,
            breathingInstruction,
            kvp,
            tubeCurrent,
          },
        })
      }
    },

    async hideAll({ dispatch, state }) {
      for (const ident in state.selectionConfigsByIdent) {
        state.selectionConfigsByIdent[ident].visible = false
      }

      // force render to remove it from view
      await dispatch('update')
    },
    reversetInitialProposedSelections(
      { state, getters, commit, dispatch, rootGetters, rootState },
      { keepCurSpacingThickness } = {}
    ) {
      let selectionConfigFirstProposedPrevious = _.first(getters.selectionConfigsProposedList)
      let overWriteSpacingThicknessPotential = selectionConfigFirstProposedPrevious
        ? _.pick(selectionConfigFirstProposedPrevious, ['spacing', 'thickness'])
        : null
      let overwriteBreathingInstruction = _.get(selectionConfigFirstProposedPrevious, ['breathingInstruction'])

      // We always want to keep the FieldStrength as it was when the user goes between questions/answerCriteria
      let previousFieldStrength = _.get(selectionConfigFirstProposedPrevious, 'fieldStrength')

      // The user will mostly want to keep around keepCurSpacingThickness, but certain Questions can be set by the admin to overwrite spacing/thickness;
      // when we get back to a question that has keepCurSpacingThickness, restore back to what the user last entered for a keepCurSpacingThickness (ignoring what they answered into a !keepCurSpacingThickness)
      if (
        keepCurSpacingThickness &&
        !state.previousKeepCurSpacingThickness &&
        state.previousOverwriteSpacingThickness
      ) {
        overWriteSpacingThicknessPotential = state.previousOverwriteSpacingThickness
      }

      // clear out all selectionConfigs
      dispatch(
        'selectionConfig/removeSelectionConfigs',
        { identTypes: SELECTION_IDENT_TYPES.filter((el) => el == 'proposed') },
        { root: true }
      )
      // Have to also delete their corresponding instances, because otherwise the corresponding center3s etc will desync
      dispatch('cleanupUnusedInstances')

      // Comment 24/01/2025
      // let answer = rootGetters['questionService/answerDataCurrent']
      let answer = rootGetters['questionService/displayDataCurrent']

      let isEditingQuestion = rootState.questionService.isEditingQuestion

      let overwriteWindowInfo = null
      const isReconstructionQuestion = rootGetters['questionService/isReconstructionQuestion']
      if (config.isCTLab && !isEditingQuestion && isReconstructionQuestion) {
        const lastAcquisitionQuestionUserAnswer = rootGetters['questionService/lastAcquisitionQuestionUserAnswer']
        const answerConfig = _.get(lastAcquisitionQuestionUserAnswer, ['variables', '0'])
        if (answerConfig && _.has(answerConfig, ['windowLevel']) && _.has(answerConfig, ['windowWidth'])) {
          overwriteWindowInfo = {
            windowLevel: answerConfig.windowLevel,
            windowWidth: answerConfig.windowWidth,
          }
        }
      }

      _.each(answer, function (answerData, ident) {
        // since there are also name/id as keys in the answer, only do this for the idents
        let identType = _.last(_.split(ident, '_'))
        if (identType === 'proposed') {
          let overwriteSpacingThickness = null
          // pass in overwrites if we want to persist spacing/thickness (those are synced between all groups in Multi anyway, so it's fine to just set them all to the first previous proposed)
          if (keepCurSpacingThickness && selectionConfigFirstProposedPrevious) {
            overwriteSpacingThickness = overWriteSpacingThicknessPotential
          }

          if (config.isCTLab) {
            if (overwriteWindowInfo) {
              answerData = {
                ...answerData,
                ...overwriteWindowInfo,
              }
            }

            if (!isEditingQuestion) {
              answerData = {
                ...answerData,
                overwriteBreathingInstruction,
              }
            }
          }

          if (
            config.isCTLab &&
            _.has(answerData, ['selectedMRIScanDirection']) &&
            !_.isNil(answerData.selectedMRIScanDirection)
          ) {
            commit('set', { selectedMRIScanDirection: answerData.selectedMRIScanDirection })
          }

          // We set init proposed selection config in here, on admin edit page, the default visible is false
          dispatch('setSelectionFromAnswerData', {
            ident,
            answerData,
            invisible: isEditingQuestion,
            overwriteSpacingThickness,
            overwriteFieldStrength: previousFieldStrength,
          })

          // This fixes the dimensions3.z not being 0 when changing to a SingleSlice answer (dim3.z being >0 when it should be 0 shows up as the bug of Oversampling showing up as big as dim3.z is, vs a line/flat)
          if (answer.isSingleSlice) {
            dispatch('adjustNumberOfSlices', {
              numberOfSlices: 1,
            })
          }
        }
      })

      if (state.previousKeepCurSpacingThickness) {
        commit('set', { previousOverwriteSpacingThickness: overWriteSpacingThicknessPotential })
      }
      commit('set', { previousKeepCurSpacingThickness: keepCurSpacingThickness })
    },
    // initialSelections is an array of selectionAnswerData that needs to get fitted into the groupIds that exist
    // answer is the answer to restore (only passed in in EditMode) - if it's there, sync initialSelections Idents up with answer groupIds
    revertInitialSelections(
      { state, getters, commit, dispatch, rootGetters, rootState },
      { keepCurSpacingThickness } = {}
    ) {
      let selectionConfigFirstProposedPrevious = _.first(getters.selectionConfigsProposedList)
      let overWriteSpacingThicknessPotential = selectionConfigFirstProposedPrevious
        ? _.pick(selectionConfigFirstProposedPrevious, ['spacing', 'thickness'])
        : null
      let overwriteBreathingInstruction = _.get(selectionConfigFirstProposedPrevious, ['breathingInstruction'])

      // We always want to keep the FieldStrength as it was when the user goes between questions/answerCriteria
      let previousFieldStrength = _.get(selectionConfigFirstProposedPrevious, 'fieldStrength')

      // The user will mostly want to keep around keepCurSpacingThickness, but certain Questions can be set by the admin to overwrite spacing/thickness;
      // when we get back to a question that has keepCurSpacingThickness, restore back to what the user last entered for a keepCurSpacingThickness (ignoring what they answered into a !keepCurSpacingThickness)
      if (
        keepCurSpacingThickness &&
        !state.previousKeepCurSpacingThickness &&
        state.previousOverwriteSpacingThickness
      ) {
        overWriteSpacingThicknessPotential = state.previousOverwriteSpacingThickness
      }

      // clear out all selectionConfigs
      dispatch('selectionConfig/removeSelectionConfigs', { identTypes: SELECTION_IDENT_TYPES }, { root: true })
      // Have to also delete their corresponding instances, because otherwise the corresponding center3s etc will desync
      dispatch('cleanupUnusedInstances')

      // Comment 24/01/2025
      // let answer = rootGetters['questionService/answerDataCurrent']
      let answer = rootGetters['questionService/displayDataCurrent']

      let isEditingQuestion = rootState.questionService.isEditingQuestion

      let overwriteWindowInfo = null
      const isReconstructionQuestion = rootGetters['questionService/isReconstructionQuestion']
      if (config.isCTLab && !isEditingQuestion && isReconstructionQuestion) {
        const lastAcquisitionQuestionUserAnswer = rootGetters['questionService/lastAcquisitionQuestionUserAnswer']
        const answerConfig = _.get(lastAcquisitionQuestionUserAnswer, ['variables', '0'])
        if (answerConfig && _.has(answerConfig, ['windowLevel']) && _.has(answerConfig, ['windowWidth'])) {
          overwriteWindowInfo = {
            windowLevel: answerConfig.windowLevel,
            windowWidth: answerConfig.windowWidth,
          }
        }
      }

      _.each(answer, function (answerData, ident) {
        // since there are also name/id as keys in the answer, only do this for the idents
        let identType = _.last(_.split(ident, '_'))
        if (identType === 'proposed') {
          let overwriteSpacingThickness = null
          // pass in overwrites if we want to persist spacing/thickness (those are synced between all groups in Multi anyway, so it's fine to just set them all to the first previous proposed)
          if (keepCurSpacingThickness && selectionConfigFirstProposedPrevious) {
            overwriteSpacingThickness = overWriteSpacingThicknessPotential
          }

          if (config.isCTLab) {
            if (overwriteWindowInfo) {
              answerData = {
                ...answerData,
                ...overwriteWindowInfo,
              }
            }

            if (!isEditingQuestion) {
              answerData = {
                ...answerData,
                overwriteBreathingInstruction,
              }
            }
          }

          if (
            config.isCTLab &&
            _.has(answerData, ['selectedMRIScanDirection']) &&
            !_.isNil(answerData.selectedMRIScanDirection)
          ) {
            commit('set', { selectedMRIScanDirection: answerData.selectedMRIScanDirection })
          }

          // We set init proposed selection config in here, on admin edit page, the default visible is false
          dispatch('setSelectionFromAnswerData', {
            ident,
            answerData,
            invisible: isEditingQuestion,
            overwriteSpacingThickness,
            overwriteFieldStrength: previousFieldStrength,
          })

          // This fixes the dimensions3.z not being 0 when changing to a SingleSlice answer (dim3.z being >0 when it should be 0 shows up as the bug of Oversampling showing up as big as dim3.z is, vs a line/flat)
          if (answer.isSingleSlice) {
            dispatch('adjustNumberOfSlices', {
              numberOfSlices: 1,
            })
          }
        }
      })

      if (state.previousKeepCurSpacingThickness) {
        commit('set', { previousOverwriteSpacingThickness: overWriteSpacingThicknessPotential })
      }
      commit('set', { previousKeepCurSpacingThickness: keepCurSpacingThickness })

      // Apply user preferences for TSE blur (UltraLab) and resolution (UltraLab or Resolution Lab)
      dispatch('applyScientificModePreferences')

      // if we're in QuestionEdit view, setSelectionsFromStackQuestionAnswer is about to get called anyway to restore the answer Min/Max
    },

    applyScientificModePreferences({ state, rootGetters, rootState }) {
      const isUltraLab = state.isUltraLab || rootState?.questionService?.questionSet?.isUltraLab === true
      const isResolutionLab = rootGetters['dicomService/isResolutionLab'] === true

      if (!isUltraLab && !isResolutionLab) return

      const isScientificModeEnabled = rootGetters['cohortService/isScientificModeEnabled']
      if (!isScientificModeEnabled) return

      const scientificMode = rootGetters['user/scientificMode']

      Object.keys(state.selectionConfigsByIdent).forEach((ident) => {
        if (state.selectionConfigsByIdent[ident]) {
          // TSE Blur: UltraLab only
          if (isUltraLab) {
            state.selectionConfigsByIdent[ident].enableTSEBlur = scientificMode?.tseBlur === true
          }
          // Resolution: UltraLab or Resolution Lab
          if (isUltraLab || isResolutionLab) {
            state.selectionConfigsByIdent[ident].enableResolution = scientificMode?.resolution === true
          }
        }
      })
    },

    // This happens from StackQuestionEdit, when Question or Answer changed
    // Revert the answer (and initial selections)
    setSelectionsFromStackQuestionAnswer({ state, getters, commit, dispatch, rootGetters }, { clickedRevertAnswer }) {
      dispatch('revertInitialSelections', {})
      let answer = rootGetters['questionService/answerDataCurrent']

      if (clickedRevertAnswer) {
        // console.log('Restoring answer.isSingleSlice to what it was:', state.wasAnswerCurrentSingleSlice)
        answer.isSingleSlice = state.wasAnswerCurrentSingleSlice
      }

      // Restore each ident (max/min only) of this answer (we just restored proposed via revertInitialSelections)
      _.each(answer, function (answerData, ident) {
        // since there are also name/id as keys in the answer, only do this for the idents
        let identType = _.last(_.split(ident, '_'))
        if (_.includes(['min', 'max'], identType)) {
          dispatch('setSelectionFromAnswerData', { answerData, ident })
        }
      })

      // If the answer had no min/max idents causing us to make groups, add the first group now
      if (getters.selectionConfigsGroups.length === 0) {
        dispatch('addSelectionConfigGroup', { groupId: 0 })
        EventBus.$emit('moveAllSelectionConfigToCenter')
      }

      dispatch('update')
      // keep whether curAnswer was SingleSlice around, so that we can restore to that when Reverting Answer
      commit('set', { wasAnswerCurrentSingleSlice: getters.isSingleSliceMode })
      Vue.notify({ text: 'Restored answer' })
    },
    setProposedConfigFromDisplayVariant({ dispatch }) {
      dispatch('reversetInitialProposedSelections', {})
      dispatch('update')
    },
    // Set current Selections into answer
    setStackQuestionAnswerFromSelections({ getters, rootGetters }, { answer }) {
      if (rootGetters['questionService/displayVariantCurrent']) {
        const selectionConfigsAsAnswerData = _.cloneDeep(getters.selectionConfigsAsAnswerData)
        _.each(selectionConfigsAsAnswerData, function (data, ident) {
          if (isIdent(ident)) {
            const identType = identToIdentType(ident)
            if (identType === 'proposed') {
              // Not sure what the below line of code does, but it is blocking proposed
              // indent from being created when new answers are added
              //delete selectionConfigsAsAnswerData[ident]
            }
          }
        })
        // Copy new ident values into existing answer-object;
        Object.assign(answer, selectionConfigsAsAnswerData)

        // delete now unused idents, leave non-idents alone (like id/name)
        _.each(answer, function (data, ident) {
          if (isIdent(ident)) {
            if (!getters.selectionConfigsAsAnswerData[ident]) {
              delete answer[ident]
            }
          }
        })

        const displayVariantData = rootGetters['questionService/displayVariantCurrent']
        // Copy new ident values into existing display varient-object;
        Object.assign(displayVariantData, getters.selectionConfigsAsAnswerData)

        // delete now unused idents, leave non-idents alone (like id/name)
        _.each(displayVariantData, function (data, ident) {
          if (isIdent(ident)) {
            const identType = identToIdentType(ident)
            if (!getters.selectionConfigsAsAnswerData[ident] || identType != 'proposed') {
              delete displayVariantData[ident]
            }
          }
        })

        log.debug('set answer', answer)
        Vue.notify({ text: 'Answer set' })
      } else {
        // Copy new ident values into existing answer-object;
        Object.assign(answer, getters.selectionConfigsAsAnswerData)

        // delete now unused idents, leave non-idents alone (like id/name)
        _.each(answer, function (data, ident) {
          if (isIdent(ident)) {
            if (!getters.selectionConfigsAsAnswerData[ident]) {
              delete answer[ident]
            }
          }
        })

        log.debug('set answer', answer)
        Vue.notify({ text: 'Answer set' })
      }
    },
    // Set current proposed Selections into answer
    saveStackQuestionAnswerFromSelections({ getters }, { answer }) {
      // Copy new ident values into existing answer-object;
      Object.assign(answer, getters.selectionConfigsProposedAsAnswerData)
      Vue.notify({ text: 'Answer set' })
    },

    copySelectionConfigFromAnswer({ state, rootState, dispatch }, { questionId }) {
      const userAnswers = rootState.questionService.userAnswers
      const selectedAnswer = userAnswers.find((el) => el.stackQuestionId == questionId)
      if (selectedAnswer) {
        const proposedConfig = _.get(selectedAnswer, ['variables', '0'], null)

        if (proposedConfig) {
          const currentIdent = state.selectionConfigCurrentIdent

          dispatch('setSelectionConfig', {
            currentIdent,
            selectionConfig: proposedConfig,
          })

          Vue.notify({ text: 'Selection config set' })
        }
      }
    },

    // add SelectionClassInstance to each SliceView, and call its callback
    addSelectionClassInstanceToSliceViewsAsNeeded({ state, commit }, { ident }) {
      let registeredSliceViewsById = state.registeredSliceViewsById
      let selectionConfig = state.selectionConfigsByIdent[ident]
      _.each(
        registeredSliceViewsById,
        function ({ backgroundSlice, scene, camera, $store, selectionClassInstances, onAddedStackVolumeSelection }) {
          let alreadyExists = _.some(selectionClassInstances, { ident })
          if (alreadyExists) {
            return false // exit loop
          }
          // add instance
          let instance = new StackVolumeSelection(
            ident,
            selectionConfig,
            selectionConfig.center3,
            selectionConfig.dimensions3,
            selectionConfig.xDirection3,
            selectionConfig.yDirection3,
            selectionConfig.zDirection3,
            backgroundSlice,
            scene,
            camera,
            $store
          )
          selectionClassInstances.push(instance)
          onAddedStackVolumeSelection(instance)
        }
      )

      commit('set', { registeredSliceViewsById })
    },
    updateBackgroundSlice({ state, commit }, { sliceViewId, backgroundSlice }) {
      let registeredSliceViewsById = state.registeredSliceViewsById
      let registeredSliceView = registeredSliceViewsById[sliceViewId]
      if (registeredSliceView) {
        registeredSliceView.backgroundSlice = backgroundSlice
        commit('set', { registeredSliceViewsById })
      }
    },
    // this is for the purpose of keeping track of all the StackVolumeSelections per SliceView (there will be one instance per  per SpiceView)
    registerSliceView(
      { state, commit },
      {
        $store,
        sliceViewId,
        backgroundSlice,
        scene,
        camera,
        onAddedStackVolumeSelection,
        onRemovedStackVolumeSelection,
      }
    ) {
      // Make a StackVolumeSelection for every ident we already have for this SliceView
      let selectionClassInstances = _.map(state.selectionConfigsByIdent, function (selectionConfig, ident) {
        return new StackVolumeSelection(
          ident,
          selectionConfig,
          selectionConfig.center3,
          selectionConfig.dimensions3,
          selectionConfig.xDirection3,
          selectionConfig.yDirection3,
          selectionConfig.zDirection3,
          backgroundSlice,
          scene,
          camera,
          $store
        )
      })
      _.each(selectionClassInstances, function (instance) {
        onAddedStackVolumeSelection(instance)
      })

      let registeredSliceViewsById = {
        ...state.registeredSliceViewsById,
        [sliceViewId]: {
          selectionClassInstances,
          onAddedStackVolumeSelection,
          onRemovedStackVolumeSelection,
          backgroundSlice,
          scene,
          camera,
          $store,
        },
      }

      commit('set', { registeredSliceViewsById })
    },
    // Remove a group
    removeSelectionConfigGroup({ state, getters, commit, dispatch }, { groupId }) {
      // can't delete the last group
      if (getters.selectionConfigsGroups.length <= 1) {
        return
      }

      // Filter out of our local selectionConfigs of this group
      let selectionConfigsByIdent = _.omitBy(state.selectionConfigsByIdent, function (data, ident) {
        return ident.startsWith(groupId)
      })

      commit('set', { selectionConfigsByIdent })
      // Since current group was deleted, pick a different curIdent
      console.log('Deleted group', groupId, 'highest now', getters.selectionConfigsHighestGroupId)
      dispatch('setSelectionConfigCurrentIdent', { groupId: getters.selectionConfigsHighestGroupId })
      dispatch('cleanupUnusedInstances')
      dispatch('update')
    },
    unregisterSliceView({ state, commit }, { sliceViewId }) {
      let registeredSliceViewsById = state.registeredSliceViewsById
      delete registeredSliceViewsById[sliceViewId]
      commit('set', { registeredSliceViewsById })
    },
    selectTool({ commit }, { tool, toolSelectedConfig }) {
      commit('set', { toolSelected: tool, toolSelectedConfig: toolSelectedConfig || {} })
    },
    adjustVendorStylePreference({ commit, dispatch }, { vendorStylePreference }) {
      commit('set', { vendorStylePreference: vendorStylePreference })

      dispatch('update')
    },
    clearCachedSliceViewConfigsBeforeEnteringFullscreen({ commit }) {
      commit('set', { sliceViewComponentConfigs: [] })
    },
    cacheSliceViewConfigBeforeEnteringFullscreen({ commit, state }, { componentConfig }) {
      let sliceViewComponentConfigs = [...state.sliceViewComponentConfigs]
      if (sliceViewComponentConfigs.find((c) => c.sourceId === componentConfig.sourceId)) {
        sliceViewComponentConfigs = sliceViewComponentConfigs.filter((c) => c.sourceId !== componentConfig.sourceId)
      }
      sliceViewComponentConfigs.push(componentConfig)
      commit('set', { sliceViewComponentConfigs })
    },
    // Move to stackService?
    enterFullscreen({ commit }, { fullscreenSourceId, componentConfig }) {
      let isFullscreen = true
      // tell fullscreen SliceView what it's state should be / what it should show
      EventBus.$emit('fullscreenChange', {
        isFullscreen,
        componentConfig,
      })

      commit('set', {
        isFullscreen,
        fullscreenSourceId,
      })
    },
    setFullScreenSourceId({ commit }, payload) {
      commit('set', {
        fullscreenSourceId: payload,
      })
    },
    exitFullscreen({ state, commit }, { componentConfig }) {
      let isFullscreen = false
      // tell just the SliceView that started the fullscreen what its state should now be (transferred from fullscreen)
      EventBus.$emit('fullscreenChange', {
        isFullscreen,
        componentConfig,
        targetId: state.fullscreenSourceId,
      })

      commit('set', {
        isFullscreen,
        fullscreenSourceId: null,
      })
    },

    // after selectionConfigs changed
    onSelectionConfigsByIdentChanged({ state, getters, dispatch }) {
      // if current selection no longer exists, change to another
      if (!state.selectionConfigsByIdent[state.selectionConfigCurrentIdent]) {
        dispatch('setSelectionConfigCurrentIdent', { groupId: getters.selectionConfigsHighestGroupId })
      }
    },

    // the visual size of the dots (starts as 1 or 2 depending on screen size - tries to be bigger for small screens, but user may also toggle this
    setDotScaleMultiplier({ state, commit, dispatch }, dotScaleMultiplier) {
      commit('set', { dotScaleMultiplier })

      _.each(state.registeredSliceViewsById, function (sliceView) {
        _.each(sliceView.selectionClassInstances, function (selectionClassInstance) {
          selectionClassInstance.refreshDotSize()
        })
      })

      dispatch('update')
    },

    setIsVolumeViewMode({ commit, dispatch }, isVolumeViewMode) {
      commit('set', { isVolumeViewMode })
      dispatch('update')
    },

    setShowReferenceLines({ commit }, showReferenceLines) {
      commit('set', { showReferenceLines })
      // what needs to re-render is just in the SliceViews, not in the stack-volume-selections
      EventBus.$emit('sliceViewUpdateGeometries', {})
    },

    setSignalAverage({ state, dispatch }, { signalAverage, ident = null }) {
      const targetIdent = ident || state.selectionConfigCurrentIdent
      dispatch('setSelectionConfig', {
        ident: targetIdent,
        selectionConfig: { signalAverage },
      })
    },

    setSignalAverageHalfTR({ state, dispatch }, { signalAverageHalfTR, ident = null }) {
      const targetIdent = ident || state.selectionConfigCurrentIdent
      dispatch('setSelectionConfig', {
        ident: targetIdent,
        selectionConfig: { signalAverageHalfTR },
      })
    },

    setBSignalAverages({ state, dispatch }, { bSignalAverages, ident = null }) {
      const targetIdent = ident || state.selectionConfigCurrentIdent
      dispatch('setSelectionConfig', {
        ident: targetIdent,
        selectionConfig: { bSignalAverages },
      })
    },

    setSnr({ state, dispatch }, { snr, ident = null }) {
      const targetIdent = ident || state.selectionConfigCurrentIdent
      dispatch('setSelectionConfig', {
        ident: targetIdent,
        selectionConfig: { snr },
      })
    },

    setSavedSnr({ state, dispatch }, { savedSnr, ident = null }) {
      const targetIdent = ident || state.selectionConfigCurrentIdent
      dispatch('setSelectionConfig', {
        ident: targetIdent,
        selectionConfig: { savedSnr },
      })
    },

    setBSnrs({ state, dispatch }, { bSnrs, ident = null }) {
      const targetIdent = ident || state.selectionConfigCurrentIdent
      dispatch('setSelectionConfig', {
        ident: targetIdent,
        selectionConfig: { bSnrs },
      })
    },

    setReferenceSliceCornersForSliceViewId({ state, commit }, { sliceViewId, bgSliceCorners }) {
      let { referenceSliceCornersBySliceViewId } = state
      referenceSliceCornersBySliceViewId[sliceViewId] = bgSliceCorners
      commit('set', { referenceSliceCornersBySliceViewId })

      // what needs to re-render is just in the SliceViews, not in the stack-volume-selections
      EventBus.$emit('sliceViewUpdateGeometries', {})
    },

    setCenterPlaneIntersectionDirBySliceViewId({ state, commit }, { sliceViewId, dir }) {
      let { centerPlaneIntersectionDirBySliceViewId } = state
      centerPlaneIntersectionDirBySliceViewId[sliceViewId] = dir
      commit('set', { centerPlaneIntersectionDirBySliceViewId })

      // what needs to re-render is just in the SliceViews, not in the stack-volume-selections
      EventBus.$emit('sliceViewUpdateGeometries', {})
    },

    update({ state, commit }) {
      const handleUpdate = () => {
        commit('set', { selectionConfigsByIdent: state.selectionConfigsByIdent }) // hack to make spacing getting update for stackHeight change?

        _.each(state.registeredSliceViewsById, function ({ selectionClassInstances }) {
          _.each(selectionClassInstances, function (instance) {
            instance.updateGeometries()
          })
        })
      }
      EventBus.$emit('sliceViewCalcCenterPlaneIntersectionDir', {})
      if (updateSelectionInstanceTinmeout) {
        clearTimeout(updateSelectionInstanceTinmeout)
      }

      updateSelectionInstanceTinmeout = setTimeout(handleUpdate, 20)
    },
    adjustOversamplingByUser({ state, dispatch }, { ident, oversampling }) {
      ident = ident || state.selectionConfigCurrentIdent

      // Oversampling value goes from 0 to 1, where 1 means 0.5 * dimX
      oversampling = clamp(oversampling, 0, 2)

      dispatch('setSelectionConfig', {
        ident,
        selectionConfig: { oversampling },
      })

      dispatch('afterSelectionUserModified', { ident })
    },
    adjustSequenceType({ state, dispatch }, { ident, sequenceType }) {
      ident = ident || state.selectionConfigCurrentIdent

      dispatch('setSelectionConfig', {
        ident,
        selectionConfig: { sequenceType },
      })

      dispatch('afterSelectionUserModified', { ident })
    },
    // dimensions3.x/y change
    // Constrain resizing Min/Max Selections to take the other along with it
    adjustDimensions3XYByUser({ state, dispatch }, { ident, x, y }) {
      ident = ident || state.selectionConfigCurrentIdent

      dispatch('adjustDimensions3OnlyOne', { ident, x, y })

      // Reset signal average when dimensions3x/y change (geometry change affects slice selection)
      dispatch('setSignalAverage', { signalAverage: null, ident })
      // Reset bSignalAverages for DIFF sequences
      const currentConfig = state.selectionConfigsByIdent[ident]
      if (currentConfig && currentConfig.sequenceType === 'DIFF') {
        dispatch('setBSignalAverages', { bSignalAverages: [], ident })
      }

      dispatch('afterSelectionUserModified', { ident })
    },
    // Internal version, which doesn't constrain resizing Min/Max along with the other
    adjustDimensions3OnlyOne({ state, dispatch, rootGetters, rootState }, { ident, x, y }) {
      ident = ident || state.selectionConfigCurrentIdent

      let { dimensions3 } = state.selectionConfigsByIdent[ident]

      //if there is amount of moving in x axis (x > 0)
      if (x) {
        dimensions3.x = x
        //if there is no amount of moving in y axis (y is null or equal 0)
        // Only move two side on question mode, don't do it on dicom play ground
        if (
          !y &&
          config.isCTLab &&
          rootState.questionService.questionSet &&
          !rootGetters['questionService/isReconstructionQuestion']
        ) {
          y = x
          dimensions3.y = y
        }
      }

      //if there is amount of moving in y axis (y > 0)
      if (y) {
        dimensions3.y = y

        //if there is no amount of moving in x axis (x is null or equal 0)
        // Only move two side on question mode, don't do it on dicom play ground
        if (
          !x &&
          config.isCTLab &&
          rootState.questionService.questionSet &&
          !rootGetters['questionService/isReconstructionQuestion']
        ) {
          x = y
          dimensions3.x = x
        }
      }

      if (configs.isCTLab) {
        if (ident.includes('min')) {
          dimensions3.x = Math.max(SELECTION_CONFIG_FORM.MIN_FOV_FOR_IDENT_MIN, dimensions3.x)
          dimensions3.y = Math.max(SELECTION_CONFIG_FORM.MIN_FOV_FOR_IDENT_MIN, dimensions3.y)
        }
        if (ident.includes('max')) {
          dimensions3.x = Math.max(SELECTION_CONFIG_FORM.MIN_FOV_FOR_IDENT_MAX, dimensions3.x)
          dimensions3.y = Math.max(SELECTION_CONFIG_FORM.MIN_FOV_FOR_IDENT_MAX, dimensions3.y)
        }
      }

      dispatch('setSelectionConfig', {
        ident,
        selectionConfig: { dimensions3 },
      })
      // dispatch('update')
    },
    // called from UI by hitting enter on input
    adjustNumberOfSlices({ getters, dispatch }, { numberOfSlices }) {
      if (!_.isFinite(numberOfSlices) || numberOfSlices < 1) {
        numberOfSlices = 1
      }
      if (!getters.selectionConfigCurrent) {
        console.log('adjustNumberOfSlices: no selection config')
        return
      }
      let currentVal = numberOfSlices
      let previousVal = getters.numberOfSlices

      // if there is only 1 slice, then it's 0
      let heightNew = getHeightFromNumberOfSlicesThicknessSpacing(numberOfSlices, getters.thickness, getters.spacing)

      // shift center to keep centerish slice intersection where it is - only when odd to even nSlices
      // This is done so the slice lines stay where they are. If the center3 would remain
      if (previousVal % 2 !== currentVal % 2) {
        let offset
        // Not if previousVal was 1, since that'd be a divide by 0 the way we're doing the math here
        if (previousVal > 1) {
          // GAP here does not mean spacing. It means the full distance from the center of one slice line to the next, spacing and thinkness included
          let gapPrev = getters.dimensions3.z / (previousVal - 1) // this would divide by 0 for previousVal ===1
          offset = gapPrev * 0.5
        } else {
          let gapCur = heightNew / (currentVal - 1) // currentVal can't be 1, because that can't happen along with prevVal and them have different % 2
          offset = gapCur * 0.5
        }

        // alternate up/down, aka. adding/removing the slice lines above or below to keep center in ~center
        if (currentVal % 2 === 1) {
          offset *= -1
        }
        getters.center3.add(getters.zDirection3.clone().multiplyScalar(offset))
      }

      // Dim Z is how tall the slices are stacked on top of each other
      getters.dimensions3.z = heightNew

      dispatch('setSelectionConfig', {
        selectionConfig: { numberOfSlices },
      })

      // Reset signal average when numberOfSlices changes (geometry change affects slice selection)
      dispatch('setSignalAverage', { signalAverage: null })
      // Reset bSignalAverages for DIFF sequences
      const currentConfig = getters.selectionConfigCurrent
      if (currentConfig && currentConfig.sequenceType === 'DIFF') {
        dispatch('setBSignalAverages', { bSignalAverages: [] })
      }

      dispatch('afterSelectionUserModified', {})
    },
    // called from UI by hitting enter on input
    adjustSpacing({ state, getters, dispatch }, { spacing }) {
      if (!_.isFinite(spacing) || spacing < 0) {
        spacing = 0
      }

      // Changing the spacing in AddLocalizerMode does not change the dimensions of the selection cuboid
      if (!state.isAddLocalizerMode) {
        let spacingContributionToHeightPrev = (getters.numberOfSlices - 1) * getters.spacing
        let spacingContributionToHeightCur = (getters.numberOfSlices - 1) * spacing
        getters.dimensions3.z += spacingContributionToHeightCur - spacingContributionToHeightPrev
      }

      // commit('set', {spacing})
      dispatch('setSelectionConfig', {
        selectionConfig: { spacing },
      })

      // Reset signal average when spacing changes (geometry change affects slice selection)
      dispatch('setSignalAverage', { signalAverage: null })
      // Reset bSignalAverages for DIFF sequences
      const currentConfig = getters.selectionConfigCurrent
      if (currentConfig && currentConfig.sequenceType === 'DIFF') {
        dispatch('setBSignalAverages', { bSignalAverages: [] })
      }

      dispatch('afterSelectionUserModified', {})
    },
    // called from UI by hitting enter on input
    adjustThickness({ getters, dispatch }, { thickness }) {
      if (!_.isFinite(thickness) || thickness < 0) {
        thickness = 0
      }

      let thicknessContributionToHeightPrev = (getters.numberOfSlices - 1) * getters.thickness
      let thicknessContributionToHeightCur = (getters.numberOfSlices - 1) * thickness
      getters.dimensions3.z += thicknessContributionToHeightCur - thicknessContributionToHeightPrev
      // commit('set', {thickness})
      dispatch('setSelectionConfig', {
        selectionConfig: { thickness },
      })

      // Reset signal average when thickness changes (geometry change affects slice selection)
      dispatch('setSignalAverage', { signalAverage: null })
      // Reset bSignalAverages for DIFF sequences
      const currentConfig = getters.selectionConfigCurrent
      if (currentConfig && currentConfig.sequenceType === 'DIFF') {
        dispatch('setBSignalAverages', { bSignalAverages: [] })
      }

      dispatch('afterSelectionUserModified', {})
    },
    adjustTREfficiency({ dispatch }, { ident, trEfficiency }) {
      console.log('adjustTREfficiency', ident, trEfficiency)
      dispatch('setSelectionConfig', {
        selectionConfig: { trEfficiency },
      })
      dispatch('afterSelectionUserModified', { ident })
    },
    adjustNoiseFactor({ dispatch }, { value }) {
      let noiseFactor = Number(value)
      if (!_.isFinite(noiseFactor) || noiseFactor < 0) {
        noiseFactor = 0
      }
      dispatch('setSelectionConfig', {
        selectionConfig: { noiseFactor },
      })
      dispatch('afterSelectionUserModified', {})
    },
    adjustPixelShift({ dispatch }, { value }) {
      let pixelShift = Number(value)
      if (!_.isFinite(pixelShift) || pixelShift < 0) {
        pixelShift = 0
      }
      dispatch('setSelectionConfig', {
        selectionConfig: { pixelShift },
      })
      dispatch('afterSelectionUserModified', {})
    },
    adjustFreqVoxelSize({ dispatch }, { value }) {
      let frequencyVoxelSize = Number(value)
      if (!_.isFinite(frequencyVoxelSize) || frequencyVoxelSize < 0) {
        frequencyVoxelSize = 0
      }
      dispatch('setSelectionConfig', {
        selectionConfig: { frequencyVoxelSize },
      })
      dispatch('afterSelectionUserModified', {})
    },
    adjustPhaseVoxelSize({ dispatch }, { value }) {
      let phaseVoxelSize = Number(value)
      if (!_.isFinite(phaseVoxelSize) || phaseVoxelSize < 0) {
        phaseVoxelSize = 0
      }
      dispatch('setSelectionConfig', {
        selectionConfig: { phaseVoxelSize },
      })
      dispatch('afterSelectionUserModified', {})
    },
    adjustScanTime({ dispatch }, { value }) {
      let scanTime = Number(value)
      if (!_.isFinite(scanTime) || scanTime < 0) {
        scanTime = 0
      }
      dispatch('setSelectionConfig', {
        selectionConfig: { scanTime },
      })
      dispatch('afterSelectionUserModified', {})
    },
    adjustDLP({ dispatch }, { dlp }) {
      dispatch('setSelectionConfig', {
        selectionConfig: { dlp },
      })
      dispatch('afterSelectionUserModified', {})
    },
    adjustCTDI({ dispatch }, { ctdi }) {
      dispatch('setSelectionConfig', {
        selectionConfig: { ctdi },
      })
      dispatch('afterSelectionUserModified', {})
    },
    adjustElapsedTime({ dispatch }, { elapsedTime }) {
      dispatch('setSelectionConfig', {
        selectionConfig: { elapsedTime },
      })
      dispatch('afterSelectionUserModified', {})
    },
    adjustLostWindowFocus({ getters, dispatch }) {
      const lostWindowFocus = getters.lostWindowFocus + 1
      console.log('Window lost focus count', lostWindowFocus)
      dispatch('setSelectionConfig', {
        selectionConfig: { lostWindowFocus },
      })
      dispatch('afterSelectionUserModified', {})
    },

    // User just modified a Selection; make Min/Max conform to each other (Min must stay inside Max)
    // 1) align center3s, 2) check that Min/Max are inside each other, and adjust only the one that wasn't just user changed
    afterSelectionUserModified({ state, getters, dispatch }, { ident }) {
      ident = ident || state.selectionConfigCurrentIdent
      let identType = identToIdentType(ident)

      // if Min/Max just changed
      // only do for the current group
      if (_.includes(['min', 'max'], identType)) {
        let identTypeOther = identType === 'max' ? 'min' : 'max'

        // Align Center of other Selection to our Z axis3
        // take the other's X/Y with it (but Z is independent)
        let {
          xDirection3,
          yDirection3,
          zDirection3,
          center3,
          dimensions3,
        } = getters.selectionConfigsCurrentGroupByIdentTypes[identType]
        let {
          center3: center3Other,
          dimensions3: dimensions3Other,
          xDirection3: xDirection3Other,
          yDirection3: yDirection3Other,
          zDirection3: zDirection3Other,
        } = getters.selectionConfigsCurrentGroupByIdentTypes[identTypeOther]

        // Copy the x/y/z Directions from cur over to the other
        xDirection3Other.copy(xDirection3)
        yDirection3Other.copy(yDirection3)
        zDirection3Other.copy(zDirection3)

        // Constrain the other Dim X / Y / Z
        let dirByAxis = {
          x: xDirection3,
          y: yDirection3,
          z: zDirection3,
        }
        let { min, max } = getters.selectionConfigsCurrentGroupByIdentTypes
        let outsideAmountsByAxis = getSelectionOutsideAmountByAxis(
          dirByAxis,
          min.center3,
          min.dimensions3,
          max.center3,
          max.dimensions3
        )

        // Move Other's center to be on top of this Selection's (Requested by Matthew for dragging Min and moving along Max)
        // vice versa is also needed technically: If the Min is outside the Max, move Min's center to Max's
        // (if they only resize, but they aren't on top of each other, you can still resize the Max to be smaller than the Min)
        if (outsideAmountsByAxis.x > 0 || outsideAmountsByAxis.y > 0 || outsideAmountsByAxis.z > 0) {
          // setting center3s the same again in this case
          center3Other.copy(center3)
        }

        // SingleSlice: Keep center3 in sync, as well as height / dimensions3.z
        if (getters.isSingleSliceMode) {
          center3Other.copy(center3)
          dispatch('heightChangedOnlyOne', {
            ident: `${getters.selectionConfigsCurrentGroupId}_${identTypeOther}`,
            currentVal: dimensions3.z,
          })
        }

        // If min, resize max also if needed
        if (identType === 'min') {
          // Resize Max to make it as much bigger as the Min is currently outside of it (+ a bit since it seems to escape slightly otherwise)
          _.each(['x', 'y'], function (axis) {
            if (outsideAmountsByAxis[axis] > 0) {
              dispatch('adjustDimensions3OnlyOne', {
                ident: `${getters.selectionConfigsCurrentGroupId}_max`, // Same group as current, but flip between min vs max
                [axis]: dimensions3Other[axis] + outsideAmountsByAxis[axis] * 1.2,
              })
            }
          })

          // resize max also if Min's height is now greater than Max's (we already took care of syncing if it's SingleSlice)
          if (outsideAmountsByAxis.z > 0 && !getters.isSingleSliceMode) {
            dispatch('heightChangedOnlyOne', {
              ident: `${getters.selectionConfigsCurrentGroupId}_max`, // Same group as current, but flip between min vs max
              currentVal: dimensions3Other.z + outsideAmountsByAxis.z * 1,
              minHeight: dimensions3.z, // don't go below the current height of the other
            })
          }

          // vice versa with max (if it's made smaller than min, then make min smaller, also)
        } else if (identType === 'max') {
          // Resize Min to make it as much smaller as the Max is currently overlapping it (+ a bit since it seems to escape slightly otherwise)
          _.each(['x', 'y'], function (axis) {
            if (outsideAmountsByAxis[axis] > 0) {
              dispatch('adjustDimensions3OnlyOne', {
                ident: `${getters.selectionConfigsCurrentGroupId}_min`,
                // avoid going negative in size
                [axis]: Math.max(1, dimensions3Other[axis] - outsideAmountsByAxis[axis] * 1.2),
              })
            }
          })

          // Max should never be smaller than Min; if so, make equal (we already took care of syncing if it's SingleSlice)
          if (dimensions3.z < dimensions3Other.z && !getters.isSingleSliceMode) {
            dispatch('heightChangedOnlyOne', {
              ident: `${getters.selectionConfigsCurrentGroupId}_min`,
              currentVal: dimensions3.z,
              maxHeight: dimensions3.z,
            })
          }
        }
      }

      dispatch('update')
    },

    // dimensions3.z change
    // called manually from selection drag
    // restrains Min/Max when resizing one of them (moves the other along to keep them about right)
    // Edge case: Resizing on Number of Slices may have the Min slight bigger than the Max since they are based on whole number changes to themselves)
    //  Maybe compare resulting dimension.z of cur to dim.z of other after change? and only if onHeightChanged called by that?
    heightChanged({ state, dispatch }, { ident, currentVal, onHeightChanged, minHeight, maxHeight }) {
      ident = ident || state.selectionConfigCurrentIdent

      dispatch('heightChangedOnlyOne', {
        ident,
        currentVal,
        minHeight,
        maxHeight,
        onHeightChanged,
      })

      dispatch('afterSelectionUserModified', { ident })
    },

    // dimensions3.z change
    // called manually from selection drag
    heightChangedOnlyOne({ state, dispatch, rootState }, { ident, currentVal, minHeight, maxHeight, onHeightChanged }) {
      ident = ident || state.selectionConfigCurrentIdent
      let config = state.selectionConfigsByIdent[ident]
      const identType = identToIdentType(ident)

      // No need to snap to anything in isAddLocalizerMode, so just pass the desired height change right through
      if (state.isAddLocalizerMode) {
        config.dimensions3.z = currentVal
        if (onHeightChanged) {
          onHeightChanged(true)
        }
        dispatch('setSelectionConfig', {
          ident,
        })
        dispatch('update')

        // stackHeight = ((numberOfSlices - 1) * thickness) + ((numberOfSlices - 1) * gap)
      } else if (state.heightChangeTarget === 'spacing') {
        // stackHeight = ((numberOfSlices - 1) * thickness) + ((numberOfSlices - 1) * gap)
        let spacing = (currentVal - (config.numberOfSlices - 1) * config.thickness) / (config.numberOfSlices - 1)

        config.dimensions3.z = (config.numberOfSlices - 1) * config.thickness + (config.numberOfSlices - 1) * spacing
        if (onHeightChanged) {
          onHeightChanged(true)
        }
        dispatch('setSelectionConfig', {
          ident,
          selectionConfig: { spacing },
        })
        dispatch('update')
      } else if (state.heightChangeTarget === 'thickness') {
        let thickness = (currentVal - (config.numberOfSlices - 1) * config.spacing) / (config.numberOfSlices - 1)

        config.dimensions3.z = (config.numberOfSlices - 1) * thickness + (config.numberOfSlices - 1) * config.spacing
        if (onHeightChanged) {
          onHeightChanged(true)
        }
        dispatch('setSelectionConfig', {
          ident,
          selectionConfig: { thickness },
        })
        dispatch('update')
      } else if (state.heightChangeTarget === 'numberOfSlices') {
        log.debug(
          'nSlices hChange',
          currentVal,
          config.thickness + config.spacing,
          currentVal / (config.thickness + config.spacing) + 1
        )
        let numberOfSlices = Math.max(Math.round(currentVal / (config.thickness + config.spacing) + 1), 1)
        // must have changed by a full slice worth of distance in either direction
        if (numberOfSlices >= config.numberOfSlices + 1 || numberOfSlices <= config.numberOfSlices - 1) {
          log.debug('!height Changed!')

          numberOfSlices = Math.max(Math.round(numberOfSlices), 1)

          let newDimensions3Z = (numberOfSlices - 1) * config.thickness + (numberOfSlices - 1) * config.spacing
          while (identType === 'max' && minHeight && newDimensions3Z < minHeight) {
            numberOfSlices += 1
            newDimensions3Z = (numberOfSlices - 1) * config.thickness + (numberOfSlices - 1) * config.spacing
          }

          while (identType === 'min' && maxHeight && newDimensions3Z > maxHeight) {
            numberOfSlices -= 1
            newDimensions3Z = (numberOfSlices - 1) * config.thickness + (numberOfSlices - 1) * config.spacing
            if (numberOfSlices < 1) {
              numberOfSlices = 1
              break
            }
          }

          // certain vendors don't allow dragging above the allowed TR when adding slices
          // this will check if this is not allowed and exit if adding slices exceeds the TR need
          if (!config.canDragAboveTR) {
            // Helper function to calculate trNeeded
            const getTrNeeded = (phaseFov, phaseVoxelSize) => {
              return Math.round((phaseFov / phaseVoxelSize) * 10) / 10
            }

            // Get satBands from satBandService
            const satBands = rootState.satBandService?.satBandSelections
              ? Object.values(rootState.satBandService.satBandSelections).filter((sb) => sb.selectionIdent === ident)
              : []

            let params = {
              slices: numberOfSlices,
              echoSpacing: config.echoSpacing,
              echoTrainLength: config.echoTrainLength,
              echoTime: config.echoTime,
              inversionRecovery: config.inversionRecovery,
              inversionTime: config.inversionTime,
              sequenceType: config.sequenceType,
              concatenations: config.concatenations,
              // Add DIFF-specific parameters
              fatSuppression: config.fatSuppression,
              satBands: satBands,
              trNeeded: getTrNeeded(config.dimensions3?.x || 1, config.phaseVoxelSize),
              iPat: config.parallelFactor === 'Off' ? 1 : parseInt(config.parallelFactor),
              partialFourierAsDecimal: partialFourierToDecimal(config.partialFourier),
              bMax: Math.max(...(config.bValues || [0])),
              oversampling: config.oversampling,
            }
            if (calculateMinSeqTR(params) / config.concatenations > config.repetitionTime) {
              return
            }
          }

          config.dimensions3.z = (numberOfSlices - 1) * config.thickness + (numberOfSlices - 1) * config.spacing

          if (onHeightChanged) {
            onHeightChanged(true)
          }
          dispatch('setSelectionConfig', {
            ident,
            selectionConfig: { numberOfSlices },
          })
        }
        dispatch('update')
      }
    },
    onSingleSliceModeDeActivated({ commit }) {
      commit('set', { heightChangeTarget: 'numberOfSlices' })
    },
    // called in both Test Edit and View mode
    onSingleSliceModeActivated({ state, commit, getters, dispatch }) {
      commit('set', { heightChangeTarget: 'spacing' })

      // Convert the first group to be in Single Slice compliant
      let groupId = _.get(getters.selectionConfigsGroups, [0, 'id'])

      let identProposed = `${groupId}_proposed`
      let selectionConfigProposed = state.selectionConfigsByIdent[identProposed]
      let identMin = `${groupId}_min`
      let selectionConfigMin = state.selectionConfigsByIdent[identMin]
      let identMax = `${groupId}_max`
      let selectionConfigMax = state.selectionConfigsByIdent[identMax]

      // Set things up for Single Slice Mode
      selectionConfigProposed.numberOfSlices = 1
      selectionConfigProposed.thickness = 3
      selectionConfigProposed.spacing = 10

      if (selectionConfigMin && selectionConfigMax) {
        selectionConfigMax.maxRotationOff = 1
        selectionConfigMax.numberOfSlices = 2

        selectionConfigMin.numberOfSlices = 3
        selectionConfigMin.thickness = selectionConfigMax.thickness = 3
        selectionConfigMin.spacing = selectionConfigMax.spacing = 10

        selectionConfigMax.dimensions3.z = selectionConfigMin.dimensions3.z
        selectionConfigMax.center3.copy(selectionConfigMin.center3)

        selectionConfigMin.xDirection3.copy(selectionConfigProposed.xDirection3)
        selectionConfigMin.yDirection3.copy(selectionConfigProposed.yDirection3)
        selectionConfigMin.zDirection3.copy(selectionConfigProposed.zDirection3)
        selectionConfigMax.xDirection3.copy(selectionConfigProposed.xDirection3)
        selectionConfigMax.yDirection3.copy(selectionConfigProposed.yDirection3)
        selectionConfigMax.zDirection3.copy(selectionConfigProposed.zDirection3)
      }

      // Delete any group beyond the first
      _.each(_.tail(getters.selectionConfigsGroups), function ({ id: groupId }) {
        dispatch('removeSelectionConfigGroup', { groupId })
      })

      dispatch('update')
    },

    async getCurrentSliceViewsAsImages() {
      return new Promise((resolve) => {
        const canvases = Array.from(document.querySelectorAll(`[id^='sliceview-']`))
        canvases.sort((a, b) => (a.id < b.id ? 1 : -1)) // x, y, z

        if (canvases.length > 0) {
          let returnList = []
          canvases.forEach(async (el) => {
            let f = (blob) => {
              try {
                let reader = new FileReader()
                reader.readAsDataURL(blob)
                reader.onloadend = function () {
                  returnList.push({
                    id: el.id,
                    src: reader.result,
                    width: el.style.width,
                    height: el.style.height,
                  })
                  if (returnList.length == canvases.length) {
                    resolve(returnList)
                  }
                }
              } catch (err) {
                // No action
                returnList.push(null)
                if (returnList.length == canvases.length) {
                  resolve(returnList.filter((el) => !!el))
                }
              }
            }
            // needs more jpeg
            el.toBlob(f, 'image/jpeg', 0.8)
          })
        } else {
          resolve([])
        }
      })
    },
    async getCurrentTimingDecisionChartViewAsImage() {
      return new Promise((resolve) => {
        EventBus.$emit('onHiddenTimingDecisionChartTooltip')
        EventBus.$emit('onShowTimingDecisionChartProbeLine')

        setTimeout(() => {
          const canvas = document.getElementById('timingDecisionChartContainer')
          if (canvas) {
            let f = (blob) => {
              try {
                EventBus.$emit('onHideTimingDecisionChartProbeLine')
                let reader = new FileReader()
                reader.readAsDataURL(blob)
                reader.onloadend = function () {
                  resolve(reader.result)
                }
              } catch (err) {
                resolve(null)
              }
            }
            // needs more jpeg
            canvas.toBlob(f, 'image/jpeg', 0.8)
          } else {
            resolve(null)
          }
        }, 50)
      })
    },
    // After a selectionConfig has been changed, sync all other group's selectionConfigs of the same identType
    syncSelectionConfigToOtherIndent({ state, getters, commit }, { selectionIdent, keys }) {
      if (selectionIdent && (selectionIdent.includes('proposed') || selectionIdent.includes('max'))) {
        return
      }
      let selectionConfigsByIdent = _.clone(state.selectionConfigsByIdent)
      let groupId = getters.selectionConfigsCurrentGroupId
      _.each(
        SELECTION_IDENT_TYPES.filter((el) => el != 'proposed'),
        function (identType) {
          let ident = `${groupId}_${identType}`
          if (ident !== selectionIdent) {
            _.each(keys, function (key) {
              if (selectionConfigsByIdent[ident]) {
                selectionConfigsByIdent[ident][key] = selectionConfigsByIdent[selectionIdent][key]
              }
            })
          }
        }
      )
      commit('set', { selectionConfigsByIdent })
    },
    syncSelectionConfigToMinMaxIndent({ state, getters, commit }, { selectionIdent, keys }) {
      if (selectionIdent && selectionIdent.includes('proposed')) {
        return
      }
      let selectionConfigsByIdent = _.clone(state.selectionConfigsByIdent)
      let groupId = getters.selectionConfigsCurrentGroupId
      _.each(
        SELECTION_IDENT_TYPES.filter((el) => el != 'proposed'),
        function (identType) {
          let ident = `${groupId}_${identType}`
          if (ident !== selectionIdent) {
            _.each(keys, function (key) {
              if (selectionConfigsByIdent[ident]) {
                selectionConfigsByIdent[ident][key] = selectionConfigsByIdent[selectionIdent][key]
              }
            })
          }
        }
      )
      commit('set', { selectionConfigsByIdent })
    },
    assignValueToSelectionConfigs({ state, getters, commit }, { objects }) {
      let selectionConfigsByIdent = _.clone(state.selectionConfigsByIdent)
      let groupId = getters.selectionConfigsCurrentGroupId
      _.each(SELECTION_IDENT_TYPES, function (identType) {
        let ident = `${groupId}_${identType}`
        if (selectionConfigsByIdent[ident]) {
          _.assign(selectionConfigsByIdent[ident], objects)
        }
      })
      commit('set', { selectionConfigsByIdent })
    },
    setSelectedMRIScanDirection({ commit }, payload) {
      commit('set', { selectedMRIScanDirection: payload })
    },
    setIsMRIShowHeadHolder({ commit }, payload) {
      commit('set', { isMRIShowHeadHolder: payload })
    },
    setSelectedMRIScanDirectionOfLocalizer({ commit }, payload) {
      commit('set', { selectedMRIScanDirectionOfLocalizer: payload })
    },
    setIsScanPositionRight({ commit }, payload) {
      commit('set', { isScanPositionRight: payload })
    },
    setLandmarkDistanceRatio({ commit }, payload) {
      commit('set', { landmarkDistanceRatio: payload })
    },
    setLandmarkDistanceSI({ commit }, payload) {
      commit('set', { landmarkDistanceSI: payload })
    },
    setLandmarkDistanceAP({ commit }, payload) {
      commit('set', { landmarkDistanceAP: payload })
    },
    setInjectionSalineValue({ commit }, payload) {
      commit('set', { injectionSalineValue: payload })
    },
    setInjectionContrastValue({ commit }, payload) {
      commit('set', { injectionContrastValue: payload })
    },
    setSalineFlow({ commit }, payload) {
      commit('set', { salineFlow: payload })
    },
    setContrastFlow({ commit }, payload) {
      commit('set', { contrastFlow: payload })
    },
    setDelayTime({ commit }, payload) {
      commit('set', { delayTime: _.round(payload) })
    },
    setDelayTimeByQuestion({ commit, state }, payload) {
      const delayTimeByQuestion = state.delayTimeByQuestion
      delayTimeByQuestion[payload.questionIndex] = payload.delayTime
      commit('set', { delayTimeByQuestion })
    },
    setPowerInjectorCurrentDuration({ commit, state }, payload) {
      let lastPowerInjectorCurrentDuration = state.lastPowerInjectorCurrentDuration
      if (payload > lastPowerInjectorCurrentDuration) {
        lastPowerInjectorCurrentDuration = payload
      }
      commit('set', { powerInjectorCurrentDuration: payload, lastPowerInjectorCurrentDuration })
    },
    setLastPowerInjectorCurrentDuration({ commit }, payload) {
      commit('set', { lastPowerInjectorCurrentDuration: payload })
    },
    setSelectedScanDelayOfThisQuestion({ commit }, payload) {
      commit('set', { selectedScanDelayOfThisQuestion: payload })
    },
    setHeightChangeTarget({ commit }, payload) {
      commit('set', { heightChangeTarget: payload })
    },
  },

  getters: {
    getPreset() {
      return selectionPresets[0]
    },

    selectionConfigsIdentTypeNames(state, getters) {
      return _.map(getters.selectionConfigsCurrentGroupByIdentTypes, function (config, identType) {
        return {
          identType,
          name: IDENTTYPE_TO_NAME[identType] || identType,
        }
      })
    },

    selectionConfigCurrent(state) {
      let ident = state.selectionConfigCurrentIdent
      return state.selectionConfigsByIdent[ident]
    },
    otherSelectionConfigInGroups(state) {
      const otherIdents = state.groupSelectionConfigs.filter((el) => el != state.selectionConfigCurrentIdent)
      return otherIdents.map((ident) => state.selectionConfigsByIdent[ident])
    },
    // returns [{name, id}]
    // based on all the idents we have selectionConfigs for, what are the groups?
    // if we had '0_proposed','0_min','0_max','1_proposed'..., there'd be 2 groups: [{name: '0', id: 0},{name: '1', id: 1}]
    selectionConfigsGroups(state) {
      return getGroupsFromIdentsArray(_.keys(state.selectionConfigsByIdent))
    },

    selectionConfigsHighestGroupId(state, getters) {
      let highestGroup = _.last(getters.selectionConfigsGroups)
      if (!highestGroup) {
        return 0
      } else {
        return _.get(highestGroup, 'id')
      }
    },

    selectionConfigsCurrentGroupId(state) {
      let splitStr = _.split(state.selectionConfigCurrentIdent, '_')
      // valid idents must always be in the format of groupId_identType
      if (splitStr.length !== 2) {
        throw Error(`Current state.selectionConfigCurrentIdent is invalid: ${state.selectionConfigCurrentIdent}`)
      }
      let groupIdStr = _.first(splitStr)
      return _.parseInt(groupIdStr) || 0
    },

    selectionConfigCurrentIdentType(state) {
      return _.last(_.split(state.selectionConfigCurrentIdent, '_'))
    },

    // obj with just the selectionConfigs of the currentGroup by identType
    // {min: {}, max: {}, proposed: {}}
    selectionConfigsCurrentGroupByIdentTypes(state, getters) {
      let out = {}
      let groupId = getters.selectionConfigsCurrentGroupId
      _.each(SELECTION_IDENT_TYPES, function (identType) {
        let ident = `${groupId}_${identType}`
        if (state.selectionConfigsByIdent[ident]) {
          out[identType] = state.selectionConfigsByIdent[ident]
        }
      })
      return out
    },

    // get the min/max/proposed selection into the data format that a StackQuestion Correct Answer would be in
    selectionConfigsAsAnswerData(state, getters) {
      let answer = {}
      _.each(getters.selectionConfigsGroups, function (group) {
        _.each(['min', 'max', 'proposed'], function (identType) {
          let ident = `${group.id}_${identType}`
          let selectionConfig = state.selectionConfigsByIdent[ident]
          if (selectionConfig) {
            answer[ident] = selectionConfigToAnswerData(selectionConfig, {})
          } else {
            console.warn('state.selectionConfigsByIdent missing ident: ', ident)
          }
        })
      })
      return answer
    },
    // get the proposed selection into the data format that a StackQuestion Correct Answer would be in
    selectionConfigsProposedAsAnswerData(state, getters, rootState, rootGetters) {
      let answer = {}
      const selectedMRIScanDirection = state.selectedMRIScanDirection
      _.each(getters.selectionConfigsGroups, function (group) {
        _.each(['proposed'], function (identType) {
          let ident = `${group.id}_${identType}`
          let selectionConfig = state.selectionConfigsByIdent[ident]
          if (selectionConfig) {
            let extraConfigs = { selectedMRIScanDirection }
            if (configs.isCTLab && rootGetters['questionService/isTimingDecisionQuestion']) {
              extraConfigs = {
                ...extraConfigs,
                timingDecisionStep: rootState.questionService.timingDecisionStep,
                presentationTimingDecisionStep: rootState.questionService.presentationTimingDecisionStep,
                timingDecisionScanDelay: _.get(
                  rootGetters['questionService/stackQuestion'],
                  ['timingDecisionScanDelay'],
                  0
                ),
                timingDecisionFlouroFrameRate: rootState.questionService.timingDecisionFlouroFrameRate,
                timingDecisionHUTriggerThreshold: rootState.questionService.timingDecisionHUTriggerThreshold,
                timingDecisionTriggerType: rootState.questionService.timingDecisionTriggerType,
                timeDifferenceFromCorrectTime: rootState.questionService.timeDifferenceFromCorrectTime,
                roiStatus: rootState.questionService.roiStatus,
                scanStatus: rootState.questionService.scanStatus,
                timingDecisionPointer: rootState.questionService.timingDecisionPointer,
                timingDecisionInjectedStep: rootState.timingDecisionService.timingDecisionInjectedStep,
                testInjectorProtocol: rootState.questionService.testInjectorProtocol,
                currentContrastDuration: rootState.injectorService.currentContrastDuration,
                currentContrast1Duration: rootState.injectorService.currentContrast1Duration,
                currentContrast2Duration: rootState.injectorService.currentContrast2Duration,
                timingDecisionContrast1InjectedStep:
                  rootState.timingDecisionService.timingDecisionContrast1InjectedStep,
                timingDecisionContrast2InjectedStep:
                  rootState.timingDecisionService.timingDecisionContrast2InjectedStep,
                timingDecisionContrast1ProcessDoneStep:
                  rootState.timingDecisionService.timingDecisionContrast1ProcessDoneStep,
                timingDecisionContrast2ProcessDoneStep:
                  rootState.timingDecisionService.timingDecisionContrast2ProcessDoneStep,
                previewContrast: rootState.timingDecisionService.previewContrast,
                timingDecisionContrastProcessDoneStep:
                  rootState.timingDecisionService.timingDecisionContrastProcessDoneStep,
                currentTestContrastDuration: rootState.injectorService.currentTestContrastDuration,
                contrastFlowRate: rootState.injectorService.contrastFlowRate,
                contrast1FlowRate: rootState.injectorService.contrast1FlowRate,
                contrast2FlowRate: rootState.injectorService.contrast2FlowRate,
                testContrastFlowRate: rootState.injectorService.testContrastFlowRate,
                injectedSecondsBeforeStartViewTimingDecision:
                  rootState.injectorService.injectedSecondsBeforeStartViewTimingDecision,
                timingDecisionTestProcessInjectedStep:
                  rootState.timingDecisionService.timingDecisionTestProcessInjectedStep,
                timingDecisionTestProcessDoneStep: rootState.timingDecisionService.timingDecisionTestProcessDoneStep,
              }
            }
            answer[ident] = selectionConfigToAnswerData(selectionConfig, extraConfigs)
          } else {
            console.warn('state.selectionConfigsByIdent missing ident: ', ident)
          }
        })
      })
      return answer
    },

    selectionConfigsProposedList(state, getters, rootState, rootGetters) {
      let initialSelections = []
      const mriMachineLanmarkedPosition = rootState.questionService.mriMachineLanmarkedPosition
      const firstSelectedPatientPosition = rootState.questionService.firstSelectedPatientPosition
      const submittedPatientPosition = rootState.questionService.submittedPatientPosition
      const testPatientGender = rootState.questionService.testPatientGender
      const testPatientModelId = rootState.questionService.testPatientModelId
      const patientPhysioInfoRespiratoryCycleDuration =
        rootGetters['questionService/patientPhysioInfoRespiratoryCycleDuration']
      const patientPhysioInfo = rootGetters['questionService/patientPhysioInfo']
      const patientPhysioInfoCardiacCycleDuration = rootGetters['questionService/patientPhysioInfoCardiacCycleDuration']
      const patientPhysioInfoStrokeVolume = rootGetters['questionService/patientPhysioInfoStrokeVolume']
      const testPatientName = rootState.questionService.testPatientName
      const testInjectionMode = rootState.questionService.testInjectionMode
      const testInjectCondition = rootState.questionService.testInjectCondition
      const screeningFormWeightMetric = rootState.questionService.screeningFormWeightMetric
      const testPatientFamilyMemberSignature = rootState.questionService.testPatientFamilyMemberSignature
      const zDirectionBias = rootGetters['stackService/currentZDirectionBias']
      const listPatientPositionsAndBodyBox = rootGetters['questionService/listPatientPositionsAndBodyBox']
      const delayTimeFromTimingDecisionStartByQuestion =
        rootState.questionService.delayTimeFromTimingDecisionStartByQuestion
      const isSelectedBolusTrackingTimingDecision =
        rootGetters['timingDecisionService/isSelectedBolusTrackingTimingDecision']
      const visibleProbeNames = rootGetters['questionService/visibleProbeNames']
      const timingDecisionBrightnessData = rootState.questionService.timingDecisionBrightnessData
      const timingDecisionFlouroFrameRate = rootState.questionService.timingDecisionFlouroFrameRate
      const isQuestionSetHasTimingDecisionQuestion =
        rootGetters['questionService/isQuestionSetHasTimingDecisionQuestion']
      const isCTAQuestionSet = rootGetters['questionService/isCTAQuestionSet']
      _.each(getters.selectionConfigsGroups, function (group) {
        let ident = `${group.id}_proposed`
        let selectionConfig = state.selectionConfigsByIdent[ident]
        const isAcquisitionQuestion = rootGetters['questionService/isAcquisitionQuestion']
        if (selectionConfig) {
          let extraConfigs = {
            isScanPositionRight: state.isScanPositionRight,
            landmarkDistanceRatio: state.landmarkDistanceRatio,
            landmarkDistanceSI: state.landmarkDistanceSI,
            landmarkDistanceAP: state.landmarkDistanceAP,
            injectionContrastValue: state.injectionContrastValue,
            injectionSalineValue: state.injectionSalineValue,
            mriMachinePosition: mriMachineLanmarkedPosition,
            zDirectionBias: zDirectionBias,
            testPatientGender,
            testPatientModelId,
            patientPhysioInfo,
            patientPhysioInfoRespiratoryCycleDuration,
            patientPhysioInfoCardiacCycleDuration,
            patientPhysioInfoStrokeVolume,
            testPatientName,
            testPatientFamilyMemberSignature,
            listPatientPositionsAndBodyBox,
            testInjectionMode,
            testInjectCondition,
            screeningFormWeightMetric,
            firstSelectedPatientPosition,
            submittedPatientPosition,
            scanDuration: rootState.stackService.scanDurationOfConfig,
            selectedMRIScanDirection: state.selectedMRIScanDirection,
            scanDelay: isAcquisitionQuestion ? state.selectedScanDelayOfThisQuestion : 0,
            isAcquisitionQuestion: isAcquisitionQuestion,
          }

          // When user press "Stop" when the slices is presenting, the final box is changed, this update is saved in here
          if (config.isCTLab) {
            const ctSliceBoxAnswer = rootState.stackService.ctSliceBoxAnswer
            const stackQuestion = rootGetters['questionService/stackQuestion']
            if (stackQuestion && _.has(stackQuestion, ['id']) && ctSliceBoxAnswer[stackQuestion.id]) {
              extraConfigs = {
                ...extraConfigs,
                ...ctSliceBoxAnswer[stackQuestion.id],
              }
            }
            if (rootGetters['questionService/isTimingDecisionQuestion']) {
              extraConfigs = {
                ...extraConfigs,
                timingDecisionStep: rootState.questionService.timingDecisionStep,
                presentationTimingDecisionStep: rootState.questionService.presentationTimingDecisionStep,
                timingDecisionScanDelay: _.get(
                  rootGetters['questionService/stackQuestion'],
                  ['timingDecisionScanDelay'],
                  0
                ),
                timingDecisionFlouroFrameRate: rootState.questionService.timingDecisionFlouroFrameRate,
                timingDecisionHUTriggerThreshold: rootState.questionService.timingDecisionHUTriggerThreshold,
                timingDecisionTriggerType: rootState.questionService.timingDecisionTriggerType,
                timeDifferenceFromCorrectTime: rootState.questionService.timeDifferenceFromCorrectTime,
                roiStatus: rootState.questionService.roiStatus,
                scanStatus: rootState.questionService.scanStatus,
                timingDecisionPointer: rootState.questionService.timingDecisionPointer,
                timingDecisionInjectedStep: rootState.timingDecisionService.timingDecisionInjectedStep,
                testInjectorProtocol: rootState.questionService.testInjectorProtocol,
                currentContrastDuration: rootState.injectorService.currentContrastDuration,
                currentContrast1Duration: rootState.injectorService.currentContrast1Duration,
                currentContrast2Duration: rootState.injectorService.currentContrast2Duration,
                timingDecisionContrast1InjectedStep:
                  rootState.timingDecisionService.timingDecisionContrast1InjectedStep,
                timingDecisionContrast2InjectedStep:
                  rootState.timingDecisionService.timingDecisionContrast2InjectedStep,
                timingDecisionContrast1ProcessDoneStep:
                  rootState.timingDecisionService.timingDecisionContrast1ProcessDoneStep,
                timingDecisionContrast2ProcessDoneStep:
                  rootState.timingDecisionService.timingDecisionContrast2ProcessDoneStep,
                previewContrast: rootState.timingDecisionService.previewContrast,
                timingDecisionContrastProcessDoneStep:
                  rootState.timingDecisionService.timingDecisionContrastProcessDoneStep,
                currentTestContrastDuration: rootState.injectorService.currentTestContrastDuration,
                contrastFlowRate: rootState.injectorService.contrastFlowRate,
                contrast1FlowRate: rootState.injectorService.contrast1FlowRate,
                contrast2FlowRate: rootState.injectorService.contrast2FlowRate,
                testContrastFlowRate: rootState.injectorService.testContrastFlowRate,
                injectedSecondsBeforeStartViewTimingDecision:
                  rootState.injectorService.injectedSecondsBeforeStartViewTimingDecision,
                timingDecisionTestProcessInjectedStep:
                  rootState.timingDecisionService.timingDecisionTestProcessInjectedStep,
                timingDecisionTestProcessDoneStep: rootState.timingDecisionService.timingDecisionTestProcessDoneStep,
              }
            }
          }

          // This config only appear when question is acquisition
          if (isAcquisitionQuestion) {
            extraConfigs = {
              ...extraConfigs,
              salineFlow: state.salineFlow,
              contrastFlow: state.contrastFlow,
              // delayTime: state.delayTime,
              // Delay from click Arm and Inject
              delayTime: state.delayTimeByQuestion[rootState.questionService.selectedStackQuestionIndex] || 0,
              patientPositions: [
                _.get(
                  rootState.questionService.firstSelectedPatientPosition,
                  ['side1'],
                  PATIENT_POSITION_TEXT.HEAD_FIRST
                ),
                _.get(rootState.questionService.firstSelectedPatientPosition, ['side2'], PATIENT_POSITION_TEXT.SUPINE),
                _.get(
                  rootState.questionService.firstSelectedPatientPosition,
                  ['side3'],
                  PATIENT_POSITION_TEXT.ARMS_DOWN
                ),
              ],
              isMRIShowHeadHolder: _.get(rootState.questionService.firstSelectedPatientPosition, ['headHolder'], false),
              isPressInjectBeforePressScanButton: rootState.timingDecisionService.isPressInjectBeforePressScanButton,
              isPrevStackQuestionIsTimingDecision: rootGetters['questionService/isPrevStackQuestionIsTimingDecision'],
              isQuestionSetHasTimingDecisionQuestion:
                rootGetters['questionService/isPrevStackQuestionIsTimingDecision'],
              isTimingDecisionUseSetDelay: rootState.timingDecisionService.isConfirmedSetDelay,
              isTimingDecisionUseTestBolus: rootGetters['timingDecisionService/isSelectedTestBolusTimingDecision'],
              timingDecisionSecondsWithMaxBrightness:
                rootGetters['questionService/timingDecisionSecondsWithMaxBrightness'],
            }

            if (isQuestionSetHasTimingDecisionQuestion) {
              const currentContrastDuration = rootState.injectorService.currentContrastDuration
              const imageDuration = rootState.stackService.scanDurationOfConfig
              let imageDurationShorterThanContrastDurationPercent = 0
              if (imageDuration < currentContrastDuration) {
                imageDurationShorterThanContrastDurationPercent = _.round(
                  ((currentContrastDuration - imageDuration) / currentContrastDuration) * 100,
                  1
                )
              }
              extraConfigs = {
                ...extraConfigs,
                isContrastDurationGreaterThanScanDuration: currentContrastDuration >= imageDuration,
                isContrastDurationLongerThanScanDurationLessThanFiveSeconds:
                  currentContrastDuration >= imageDuration && currentContrastDuration <= imageDuration + 5,
              }
              const validTimeThreshold = 0.6 * currentContrastDuration
              if (isCTAQuestionSet) {
                extraConfigs = {
                  ...extraConfigs,
                  imageDurationShorterThanContrastDurationPercent,
                  imageDurationShorterThanContrastDurationSeconds: validTimeThreshold - imageDuration,
                }
              }
            }
          }

          // Only CTA
          if (
            isCTAQuestionSet &&
            isAcquisitionQuestion &&
            config.isCTLab &&
            isQuestionSetHasTimingDecisionQuestion &&
            isSelectedBolusTrackingTimingDecision &&
            visibleProbeNames.length > 0 &&
            timingDecisionBrightnessData.length > 0 &&
            _.values(delayTimeFromTimingDecisionStartByQuestion).length == 1 &&
            delayTimeFromTimingDecisionStartByQuestion[rootState.questionService.selectedStackQuestionIndex]
          ) {
            // Grade watchtower delay time
            const firstWatchTowerTrackingData = timingDecisionBrightnessData.map((el) => {
              const probeValues = _.get(el, ['probeValues'], [])
              const firstProbeValue = probeValues.find((p) => p.fileName == visibleProbeNames[0])
              return {
                label: el.label,
                value: firstProbeValue ? (firstProbeValue.value / (firstProbeValue.maxValue || 1)) * 450 : 0,
              }
            })
            const lastWatchTowerTrackingData = timingDecisionBrightnessData.map((el) => {
              const probeValues = _.get(el, ['probeValues'], [])
              const lastProbeValue = probeValues.find(
                (p) => p.fileName == visibleProbeNames[visibleProbeNames.length - 1]
              )
              return {
                label: el.label,
                value: lastProbeValue ? (lastProbeValue.value / (lastProbeValue.maxValue || 1)) * 450 : 0,
              }
            })
            const watchTowerValue = isCTAQuestionSet ? CTA_WATCH_TOWER_CHECK_VALUE : NON_CTA_WATCH_TOWER_CHECK_VALUE
            const firstTimeCross200 = firstWatchTowerTrackingData.find((el, index) => {
              return (
                el.value >= watchTowerValue &&
                firstWatchTowerTrackingData[index - 1] &&
                firstWatchTowerTrackingData[index - 1].value <= watchTowerValue
              )
            })
            const lastTimeCross200 = lastWatchTowerTrackingData.find((el, index) => {
              return (
                el.value >= watchTowerValue &&
                lastWatchTowerTrackingData[index + 1] &&
                lastWatchTowerTrackingData[index + 1].value <= watchTowerValue
              )
            })
            const rawTimingDecisionScanDelay =
              _.get(rootGetters['questionService/firstTimingDecisionQuestion'], ['timingDecisionScanDelay'], null) ??
              rootState.questionService.timingDecisionScanDelay ??
              _.get(rootGetters['questionService/stackQuestion'], ['timingDecisionScanDelay'], 0)
            const timingDecisionScanDelaySeconds = Number(rawTimingDecisionScanDelay) || 0
            const delayTimeFromTimingDecisionStart = _.first(_.values(delayTimeFromTimingDecisionStartByQuestion))
            const scanDurationOfConfig = Number(rootState.stackService.scanDurationOfConfig) || 0
            const acqStartLabelSeconds = delayTimeFromTimingDecisionStart.start * timingDecisionFlouroFrameRate
            const acqEndLabelSeconds =
              scanDurationOfConfig > 0
                ? acqStartLabelSeconds + scanDurationOfConfig
                : delayTimeFromTimingDecisionStart.end * timingDecisionFlouroFrameRate

            const firstCrossLabelSeconds = firstTimeCross200
              ? +firstTimeCross200.label - timingDecisionScanDelaySeconds
              : null
            const lastCrossLabelSeconds = lastTimeCross200
              ? +lastTimeCross200.label - timingDecisionScanDelaySeconds
              : null
            const startTooEarlySeconds =
              firstCrossLabelSeconds != null ? firstCrossLabelSeconds - acqStartLabelSeconds : 0
            const endTooLateSeconds = lastCrossLabelSeconds != null ? acqEndLabelSeconds - lastCrossLabelSeconds : 0
            extraConfigs = {
              ...extraConfigs,
              startTooEarlySeconds: startTooEarlySeconds > 0 ? startTooEarlySeconds : 0,
              endTooLateSeconds: endTooLateSeconds > 0 ? endTooLateSeconds : 0,
            }
          }

          //Save the limit plane when taking test to answer, use it in DicomPreview
          // Only used for User
          if (configs.isCTLab) {
            const questionIndex = rootState.questionService.selectedStackQuestionIndex
            const limitedCTModelPlanesOfStackConfigsToAnswerData =
              rootGetters['stackService/limitedCTModelPlanesOfStackConfigsToAnswerData']

            const limitedCTModelPlanes = limitedCTModelPlanesOfStackConfigsToAnswerData.filter(
              (el) => el.questionIndex < questionIndex
            )

            if (limitedCTModelPlanes) {
              extraConfigs.limitedCTModelPlanes = limitedCTModelPlanes
            }
          }

          if (!config.isCTLab) {
            // Add sat bands
            const userSatBands = rootState.interactableService.interactableStateByIdent
            const satBands = []
            for (const [, value] of Object.entries(userSatBands)) {
              satBands.push(_.cloneDeep(value))
            }
            extraConfigs.satBands = satBands

            // Check satband intersect with satBandMarkZone
            const satBandSelections = rootState.satBandService.satBandSelections
            let isSatBandIntersectWithSatBandMarkZone = false
            let intersectSatbandZoneDistance = 0
            _.forEach(satBands, (satBand) => {
              const check = checkIntersectOfSatBandWithSatBandMarkZone(satBand, satBandSelections)
              if (check.isIntersect) {
                isSatBandIntersectWithSatBandMarkZone = true
                intersectSatbandZoneDistance += check.intersectDistance
              }
            })

            if (satBands.length > 0) {
              extraConfigs.isSatBandIntersectWithSatBandMarkZone = isSatBandIntersectWithSatBandMarkZone
              extraConfigs.intersectSatbandZoneDistance = intersectSatbandZoneDistance
            } else {
              extraConfigs.isSatBandIntersectWithSatBandMarkZone = false
              extraConfigs.intersectSatbandZoneDistance = 0
            }
          }

          initialSelections.push(selectionConfigToAnswerData(selectionConfig, extraConfigs))
        } else {
          console.warn('state.selectionConfigsByIdent missing ident: ', ident)
        }
      })
      return initialSelections
    },
    currentSelectionConfigVisible(state, getters) {
      return getters.selectionConfigCurrent.visible
    },
    center3(state, getters) {
      return getters.selectionConfigCurrent.center3
    },
    dimensions3(state, getters) {
      return getters.selectionConfigCurrent.dimensions3
    },
    xDirection3(state, getters) {
      return getters.selectionConfigCurrent.xDirection3
    },
    yDirection3(state, getters) {
      return getters.selectionConfigCurrent.yDirection3
    },
    zDirection3(state, getters) {
      return getters.selectionConfigCurrent.zDirection3
    },
    numberOfSlices(state, getters) {
      return getters.selectionConfigCurrent.numberOfSlices
    },
    thickness(state, getters) {
      return getters.selectionConfigCurrent.thickness
    },
    spacing(state, getters) {
      return getters.selectionConfigCurrent.spacing
    },
    lostWindowFocus(state, getters) {
      return getters.selectionConfigCurrent.lostWindowFocus
    },
    isSingleSliceMode(state, getters, rootState, rootGetters) {
      return rootGetters['questionService/answerCurrentIsSingleSlice']
    },
    curDotGeometry(state) {
      // console.log('curDotGeometry', state.dotScaleMultiplier, DOT_GEOMETRY_BY_SCALE[state.dotScaleMultiplier])
      return DOT_GEOMETRY_BY_SCALE[state.dotScaleMultiplier]
    },
    dotsShouldBeTransparent(state) {
      return state.dotScaleMultiplier === DOT_SCALE_VALUE_TRANSPARENT
    },
    dotScaleValues() {
      return DOT_SCALE_VALUES
    },
    // for current selectionConfig
    breathingInstruction(state, getters) {
      return _.get(getters.selectionConfigCurrent, ['breathingInstruction'], BREATHING_INSTRUCTION.OFF)
    },
    isParameterDisabled(state, getters, rootState, rootGetters) {
      return (
        rootState.questionService.scanStatus !== SCAN_STATUS.NO_SCAN ||
        rootGetters['questionService/isAnsweredCurrentQuestion']
      )
    },
    orderedSliceViewComponentConfigs(state) {
      return _.orderBy(state.sliceViewComponentConfigs, ['componentSliceViewIndex'], ['asc'])
    },
    slabThicknessMethod(state) {
      return state.slabThicknessMethod // Returns array with per-slice-view values
    },
  },
}

export default selectionConfig
