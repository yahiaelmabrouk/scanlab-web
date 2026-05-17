import log from 'loglevel'
import _ from 'lodash'
import EventBus from '@/lib/event-bus'
import { greatestAxisAbsXYZ, getClosestSignedAxis3 } from '@/lib/math-util'
import { stopMriLoading, startMriLoop } from '@/lib/mri-audio'
import * as THREE from 'three'
import configs from '../config'
import { EXTRA_SCAN_BASE_NAME, PATIENT_POSITION_TEXT } from '../constants'
import { vector3ToData, isVector3Equal, selectionConfigToAnswerData } from '@/lib/misc-util'
import { scanUniqueId } from '../util/utils'

let stackConfigs = [
  {
    name: 'Default - Axial', // Z
    // stackIdent
    slices: [
      {
        originX: null,
        originY: null,
        originZ: null,
        zDirectionX: 0,
        zDirectionY: 0,
        zDirectionZ: 1,
        thickness: 0,
        spacing: 1,
      },
      // { // Maybe get rid of these second default slices, since they are for one specific DICOM
      //   originX: -6.42,
      //   originY: -25.92,
      //   originZ: 8,
      //   zDirectionX: 0,
      //   zDirectionY: 0,
      //   zDirectionZ: 1,
      //   thickness: 0,
      //   spacing: 1
      // }
    ],
  },
  {
    name: 'Default - Coronal', // Y
    slices: [
      {
        originX: null,
        originY: null,
        originZ: null,
        zDirectionX: 0,
        zDirectionY: 1,
        zDirectionZ: 0,
        thickness: 0,
        spacing: 1,
      },
      // {
      //   originX: -6.42,
      //   originY: -85,
      //   originZ: 33.58,
      //   zDirectionX: 0,
      //   zDirectionY: 1,
      //   zDirectionZ: 0,
      //   thickness: 0,
      //   spacing: 1
      // }
    ],
  },
  {
    name: 'Default - Sagittal', // X
    slices: [
      {
        originX: null,
        originY: null,
        originZ: null,
        zDirectionX: 1,
        zDirectionY: 0,
        zDirectionZ: 0,
        thickness: 0,
        spacing: 1,
      },
      // {
      //   originX: -33.42,
      //   originY: -7.92,
      //   originZ: 33.58,
      //   zDirectionX: 1,
      //   zDirectionY: 0,
      //   zDirectionZ: 0,
      //   thickness: 0,
      //   spacing: 1
      // }
    ],
  },
]

// function validateSlice(box3, slicePoint, sliceNormal){
//   return box3.intersectsPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(sliceNormal, slicePoint))
// }

function createSlice(origin3, xDirection3, yDirection3, zDirection3, thickness, spacing) {
  // All these go into the SliceView.vue component state directly when this slice is later picked for viewing later there
  return {
    originX: origin3.x,
    originY: origin3.y,
    originZ: origin3.z,
    xDirectionX: xDirection3.x,
    xDirectionY: xDirection3.y,
    xDirectionZ: xDirection3.z,
    yDirectionX: yDirection3.x,
    yDirectionY: yDirection3.y,
    yDirectionZ: yDirection3.z,
    zDirectionX: zDirection3.x,
    zDirectionY: zDirection3.y,
    zDirectionZ: zDirection3.z,
    thickness, // 0: of slice
    spacing, // 1: between slices, considering that slice is as thick as it is; not sure what AMI does with this per slice, but it looks different
  }
}

const stackService = {
  namespaced: true,
  exportState: ['stackConfigs'],
  serializers: {
    stackConfigs: {
      get(value) {
        // serialize
        return _.map(value, function (stackConfig) {
          return _.mapValues(stackConfig, function (val, key) {
            if (key === 'limitedSquare') {
              // limitedSquare is an array of size 4, each of which is a Vector3 with more things stuffed into it
              return _.map(val, function (corners) {
                return _.map(corners, function (corner) {
                  let mainVec3Data = corner.toArray()
                  return [mainVec3Data, corner.direction.toArray(), corner.xy, corner.angle]
                })
              })
            }
            return val
          })
        })
      },
      set(value) {
        // deserialize
        return _.map(value, function (stackConfig) {
          return _.mapValues(stackConfig, function (val, key) {
            if (key === 'limitedSquare') {
              // limitedSquare is an array of size 4, each of which is a Vector3 with more things stuffed into it
              return _.map(val, function (corners) {
                return _.map(corners, function (corner) {
                  let [mainVec3Data, directionData, xy, angle] = corner
                  let mainVec3 = new THREE.Vector3()
                  let direction3 = new THREE.Vector3()
                  mainVec3.fromArray(mainVec3Data)
                  direction3.fromArray(directionData)
                  mainVec3.direction = direction3
                  mainVec3.xy = xy
                  mainVec3.angle = angle
                  return mainVec3
                })
              })
            }
            return val
          })
        })
      },
    },
  },
  state: {
    stackConfigs,
    sliceViewIndexWillShowResult: -1,
    isOnMriView: false,
    scanPercentStartOfLandmark: 0,
    scanPercentStartOfMRIMachine: 0,
    scanPercentOfMRIMachine: 0,
    isMriMachineScanComplete: false,
    mriModelBbox: {
      center: new THREE.Vector3(0, 0, 0),
      dimensions: new THREE.Vector3(0, 0, 0),
    },
    configNameOfFirstSliceView: '', // name of slice view has isPlaySlice = true
    sliceIndexOfFirstSliceView: 0, // sliceIndex of slice view has isPlaySlice = true
    scanDurationOfConfig: 1,
    ctSliceBoxAnswer: {},
    landmarked3dPoint: new THREE.Vector3(0, 0, 0),
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  watchGetters: {
    currentZDirectionBias: 'onZDirectionBiasChange',
  },
  actions: {
    onZDirectionBiasChange({ dispatch, rootGetters }) {
      const isAcquisitionQuestion = rootGetters['questionService/isAcquisitionQuestion']
      if (isAcquisitionQuestion && configs.isCTLab) {
        dispatch('selectionConfig/update', {}, { root: true })
      }
    },
    // only creates and returns a stackConfig - does not add it to stackConfigs
    // May create a new stackConfig from frames as a new source as a side-effect
    async createStackConfig(
      { getters, dispatch, rootGetters, state, rootState },
      {
        name,
        stackIdent,
        xDirection3,
        yDirection3,
        zDirection3,
        center3,
        desiredStackHeight,
        dimensions3,
        numberOfSlices,
        thickness,
        spacing,
        isLimited,
        contrastParameters,
        resolutionParameters,
        basicLabParameters,
        sequenceType,
        isLocalizer,
        phaseVoxelSize,
        frequencyVoxelSize,
        frequencyMatrix,
        phaseMatrix,
        windowWidth,
        windowLevel,
        extendedLimitXDir,
        extendedLimitYDir,
        extendedLimitZDir,
        isConfigOfCTLabMode,
        shouldLimitCTModel,
        isUserAnsweredStackConfig,
        hidden,
        // Only use it variable for dicom preview
        selectedHdBranchId,
        scanDuration,
        zDirectionBias,
        answerData,
        satBands,
        skipGlobalLoading,
      }
    ) {
      if (!skipGlobalLoading) {
        EventBus.$emit('LOADING', {
          name: 'ADD_STACK',
          title: configs.isCTLab ? 'Loading...' : 'Scanning...',
          isLoading: true,
        })
      }
      log.debug(
        'Creating stack dir/center/dim',
        zDirection3,
        center3,
        desiredStackHeight,
        numberOfSlices,
        getters.configNumberOfSlices
      )

      // No matter which way the user flips the Selection Z direction (the direction into the "Stack of Paper"), the output / reformatted slice result needs to always stay flipped the same way the initial world axis are facing
      //  (So if you were to flip the Selection upside down, and Scan, it should have the same result as if you hadn't flipped the selection around first)
      if (!configs.isCTLab) {
        let closestSignedWorldAxis3 = getClosestSignedAxis3(zDirection3)
        if (closestSignedWorldAxis3.z === -1 || closestSignedWorldAxis3.y === -1 || closestSignedWorldAxis3.x === -1) {
          zDirection3 = zDirection3.clone().negate()
        }
      } else {
        if (_.isNil(zDirectionBias)) {
          zDirectionBias = 1
        }
        let closestSignedWorldAxis3 = getClosestSignedAxis3(zDirection3)
        // Flip Coronal and Sagittal
        if (closestSignedWorldAxis3.y === -1 || closestSignedWorldAxis3.x === -1) {
          zDirection3 = zDirection3.clone().negate()
        }
        // Rotate zDirection if it has closestSignedWorldAxis3.z != 0
        if (Math.abs(closestSignedWorldAxis3.z) === 1) {
          // zDirectionBias: 1 - Top to bottom
          // closestSignedWorldAxis3.z: -1 - Top to bottom
          // closestSignedWorldAxis3.z / zDirectionBias == 1 when reverse direction
          if (closestSignedWorldAxis3.z / zDirectionBias == 1) {
            zDirection3 = zDirection3.clone().negate()
          }
        }
      }
      let shouldFlipCamera = false
      // Flip Sagittal View
      if (configs.isCTLab && (name.includes('Added Localizer') || !name.includes('Localizer'))) {
        let noHiddenStackConfigs = _.reject(state.stackConfigs, 'hidden')
        noHiddenStackConfigs = _.filter(
          noHiddenStackConfigs,
          (el) => el.name.includes('Localizer') && !el.name.includes('Added Localizer')
        )
        let localizerHasSameDirectionWithZDirection = _.some(noHiddenStackConfigs, (el) => {
          let defaultOrientation = greatestAxisAbsXYZ(
            el.slices[0].zDirectionX,
            el.slices[0].zDirectionY,
            el.slices[0].zDirectionZ
          )
          let newConfigOrientation = greatestAxisAbsXYZ(zDirection3.x, zDirection3.y, zDirection3.z)

          let closestSignedWorldAxis3 = getClosestSignedAxis3(zDirection3)
          let closestDefaultWorldAxis3 = getClosestSignedAxis3(
            new THREE.Vector3(el.slices[0].zDirectionX, el.slices[0].zDirectionY, el.slices[0].zDirectionZ)
          )

          return (
            closestSignedWorldAxis3[defaultOrientation] == closestDefaultWorldAxis3[defaultOrientation] &&
            newConfigOrientation == defaultOrientation &&
            el.isFromFrames
          )
        })
        if (localizerHasSameDirectionWithZDirection) {
          // Fix when Sagittal not flip like the localizer
          shouldFlipCamera = true
        } else {
          shouldFlipCamera = false
        }
      }

      // default to current selectionConfig's values if none supplied
      numberOfSlices = _.isFinite(numberOfSlices) ? numberOfSlices : getters.configNumberOfSlices
      thickness = _.isFinite(thickness) ? thickness : getters.configThickness
      spacing = _.isFinite(spacing) ? spacing : getters.configSpacing

      log.debug('SLICES', numberOfSlices)

      let slices = []
      // distance from center of one slice to the next, which starts at one side of stack and ends at the other side
      let sliceToSliceDist = desiredStackHeight / (numberOfSlices - 1) // to go 0...1x of desiredStackHeight (often dimensions3.z)
      let dimensionZHalf = desiredStackHeight * 0.5
      // with 3: -0.5, 0, 0.5

      for (let i = 0; i < numberOfSlices; i++) {
        log.debug('making slice', i, i * sliceToSliceDist)
        let sliceOrigin3 = center3.clone()
        // For Single Slice, the center3 of the slice is the same as the center3 of the whole stack, so no need to adjust it
        //    dimensionZ should maybe conceptionally be 0 for Single Slice, which would make the below math work, but since it isn't, and we know we don't need to adjust the per slice center3, let's just not
        if (numberOfSlices > 1) {
          sliceOrigin3.add(zDirection3.clone().multiplyScalar(i * sliceToSliceDist - dimensionZHalf))
        }

        let selectionCorners
        if (isLimited) {
          // Set the extend of corner to correct dir
          // When create extra view has limited corner
          extendedLimitXDir = extendedLimitXDir ?? 'x'
          extendedLimitYDir = extendedLimitYDir ?? 'y'
          // 4 Corners of current slice
          // This could be moved onto each slice, vs living on the StackConfig (as it does now), but it works either way (see comment above)
          // selectionCorners: array of 4 points in space for the corners that will be used to trim/limit the visual background slice
          // Due to vector onto plane projection, the Z axis3 doesn't matter as long as it's locally axis-aligned (can be projected onto plane losslessly), which all of the slices will be - so just one set of corners per stack technically works fine for all slices
          selectionCorners = _.flatMap([true, false], function (isAddingX) {
            return _.map([true, false], function (isAddingY) {
              let corner = sliceOrigin3.clone()
              corner[isAddingX ? 'add' : 'sub'](
                xDirection3.clone().multiplyScalar(dimensions3[extendedLimitXDir] * 0.5)
              )
              corner[isAddingY ? 'add' : 'sub'](
                yDirection3.clone().multiplyScalar(dimensions3[extendedLimitYDir] * 0.5)
              )
              return corner
            })
          })
        }

        let slice = createSlice(sliceOrigin3, xDirection3, yDirection3, zDirection3, thickness, spacing)
        slice.isLimited = isLimited
        slice.selectionCorners = selectionCorners
        slices.push(slice)
      }

      const questionIndex = rootState.questionService.selectedStackQuestionIndex

      let stackConfig = {
        name,
        slices,
        stackIdent,
        contrastParameters, // Assuming this is fine to have to be the same between groups of a one scan
        resolutionParameters,
        basicLabParameters,
        sequenceType, // Assuming this is fine to have to be the same between groups of a one scan
        phaseVoxelSize,
        frequencyVoxelSize,
        frequencyMatrix,
        phaseMatrix,
        isLocalizer,
        windowWidth,
        windowLevel,

        xDirection3,
        yDirection3,
        zDirection3,
        center3,
        dimensions3,
        numberOfSlices,
        thickness,
        spacing,
        extendedLimitXDir,
        extendedLimitYDir,
        extendedLimitZDir,

        isConfigOfCTLabMode,
        shouldLimitCTModel,
        isUserAnsweredStackConfig,
        shouldFlipCamera,
        hidden,
        questionIndex,
        answerData,
        skipGlobalLoading,
      }

      if (!configs.isCTLab) {
        stackConfig.satBands = satBands
      }

      if (!_.isNil(scanDuration)) {
        stackConfig.scanDuration = scanDuration
      }

      if (!stackIdent) {
        const hasDeferredHdUrls = rootGetters['dicomService/hasDeferredHdUrls']

        // return
        if (!isLocalizer && stackConfig.sequenceType) {
          // If trying to make a stack config for a special sequence type (contrast lab only, for now), go sythesize a cool new stack to use
          stackConfig.stackIdent = await dispatch(
            'dicomService/createCompositeStackFromStackConfig',
            { stackConfig },
            { root: true }
          )
        } else if (
          !isLocalizer &&
          hasDeferredHdUrls &&
          stackConfig.resolutionParameters?.enableCruncherResolution &&
          rootGetters['dicomService/isResolutionLab']
        ) {
          // Resolution lab → cruncher path
          stackConfig.stackIdent = await dispatch(
            'dicomService/createResolutionStackFromCruncher',
            { stackConfig },
            { root: true }
          )
        } else if (
          !isLocalizer &&
          !stackConfig.sequenceType &&
          !configs.isCTLab &&
          stackConfig.basicLabParameters?.enableCruncherBasicLab
        ) {
          // Basic lab → cruncher path
          stackConfig.stackIdent = await dispatch(
            'dicomService/createBasicStackFromCruncher',
            { stackConfig },
            { root: true }
          )
        } else if (isLocalizer && !hasDeferredHdUrls) {
          const hasDeferredLocalizerUrls = rootGetters['dicomService/hasDeferredLocalizerUrls']
          if (hasDeferredLocalizerUrls) {
            stackConfig.stackIdent = await dispatch(
              'dicomService/loadStackFromDeferredDicomUrls',
              { stackConfig, selectedHdBranchId },
              { root: true }
            )
          } else {
            const localizerConfig = getters.stackConfigOfFirstLocalizer
            if (localizerConfig && localizerConfig.slices.length < 100) {
              // You want a localizer, but we only have HD stuff
              stackConfig.stackIdent = getters.stackIdentOfFirstNonLocalizer
            }
          }
        } else if (hasDeferredHdUrls) {
          stackConfig.stackIdent = await dispatch(
            'dicomService/loadStackFromDeferredDicomUrls',
            { stackConfig, selectedHdBranchId },
            { root: true }
          )
        } else {
          stackConfig.stackIdent = stackIdent || getters.stackIdentOfFirstNonLocalizer
        }
      }

      if (stackConfig.stackIdent && configs.isCTLab) {
        EventBus.$emit('OnPrepareStackHelperForIdent', { stackIdent: stackConfig.stackIdent })
      }

      return stackConfig
    },

    // desiredStackHeight (often dimensions3.z, but not necessarily when in AddLocalizerMode)
    // either pass in a stackConfig to just add that as-is, or pass the params to create a new one and add that

    async addStackConfig(
      { state, commit, dispatch, rootGetters, rootState },
      {
        stackConfig,
        name,
        stackIdent,
        xDirection3,
        yDirection3,
        zDirection3,
        center3,
        desiredStackHeight,
        dimensions3,
        numberOfSlices,
        thickness,
        spacing,
        isLimited,
        contrastParameters,
        resolutionParameters,
        basicLabParameters,
        sequenceType,
        isLocalizer,
        phaseVoxelSize,
        frequencyVoxelSize,
        frequencyMatrix,
        phaseMatrix,
        extendedLimitXDir,
        extendedLimitYDir,
        extendedLimitZDir,
        hidden,
        windowLevel,
        windowWidth,
        answerData,
        isFromMergeStackConfig,
        skipGlobalLoading,
      }
    ) {
      if (configs.isCTLab && name && name.includes(EXTRA_SCAN_BASE_NAME) && _.find(state.stackConfigs, { name })) {
        return
      }
      if (!stackConfig) {
        stackConfig = await dispatch('createStackConfig', {
          name,
          stackIdent,
          xDirection3,
          yDirection3,
          zDirection3,
          center3,
          desiredStackHeight,
          dimensions3,
          numberOfSlices,
          thickness,
          spacing,
          isLimited,
          contrastParameters,
          resolutionParameters,
          basicLabParameters,
          sequenceType,
          isLocalizer,
          phaseVoxelSize,
          frequencyVoxelSize,
          frequencyMatrix,
          phaseMatrix,
          extendedLimitXDir,
          extendedLimitYDir,
          extendedLimitZDir,
          hidden,
          windowLevel,
          windowWidth,
          answerData,
          skipGlobalLoading,
        })
      }

      let stackConfigs = [...state.stackConfigs]
      const questionIndex = rootState.questionService.selectedStackQuestionIndex
      if (isFromMergeStackConfig && configs.isCTLab) {
        let minIndexOfStackHasGreaterQuestionIndex = _.findIndex(
          stackConfigs,
          (el) => el.isConfigOfCTLabMode && _.get(el, ['questionIndex'], -1) > questionIndex
        )
        if (minIndexOfStackHasGreaterQuestionIndex == -1) {
          minIndexOfStackHasGreaterQuestionIndex = stackConfigs.length
        }
        // Auto hidden when user confirm, only visible after user pressed start
        // If user is on Playground mode, don't hidden
        if (rootGetters['questionService/stackQuestion']) {
          stackConfig.hidden = true
        } else {
          stackConfig.hidden = false
        }
        stackConfigs.splice(minIndexOfStackHasGreaterQuestionIndex, 0, stackConfig)
      } else {
        stackConfigs.push(stackConfig)
      }

      if (!stackConfig.name.includes(EXTRA_SCAN_BASE_NAME)) {
        commit('set', { stackConfigs, sliceViewIndexWillShowResult: -1 })
      } else {
        commit('set', { stackConfigs })
      }

      let firstSlice = stackConfig.slices[0]

      // Auto select this new stackConfig in the SliceView dropdown for the appropriate orientation
      const isReconstructionQuestion = rootGetters['questionService/isReconstructionQuestion']
      if (configs.isCTLab) {
        if (!stackConfig.name.includes(EXTRA_SCAN_BASE_NAME)) {
          if (isReconstructionQuestion && state.isOnMriView) {
            EventBus.$emit('SliceView_setStackConfig_forReconOrientation', {
              stackConfig,
            })
          } else {
            EventBus.$emit('SliceView_setStackConfig_forOrientation', {
              stackConfig,
              viewOrientation: greatestAxisAbsXYZ(
                firstSlice.zDirectionX,
                firstSlice.zDirectionY,
                firstSlice.zDirectionZ
              ),
            })
          }
        }
      } else {
        EventBus.$emit('SliceView_setStackConfig_forOrientation', {
          stackConfig,
          viewOrientation: greatestAxisAbsXYZ(firstSlice.zDirectionX, firstSlice.zDirectionY, firstSlice.zDirectionZ),
        })
      }
      if (!skipGlobalLoading && !(stackConfig && stackConfig.skipGlobalLoading)) {
        EventBus.$emit('LOADING', { name: 'ADD_STACK', isLoading: false })
      }

      return stackConfig
    },
    getConfirmedStackConfig({ state }, questionIndex) {
      return _.find(state.stackConfigs, { questionIndex, isUserAnsweredStackConfig: true })
    },
    async presetConfirmedStackConfigToSliceView({ dispatch, state, rootGetters }, questionIndex) {
      if (!configs.isCTLab) {
        return
      }
      const confirmedStackConfig = await dispatch('getConfirmedStackConfig', questionIndex)
      let firstSlice = confirmedStackConfig.slices[0]
      if (confirmedStackConfig) {
        const isReconstructionQuestion = rootGetters['questionService/isReconstructionQuestion']
        if (isReconstructionQuestion && state.isOnMriView) {
          EventBus.$emit('SliceView_setStackConfig_forReconOrientation', {
            stackConfig: confirmedStackConfig,
          })
        } else {
          EventBus.$emit('SliceView_setStackConfig_forOrientation', {
            stackConfig: confirmedStackConfig,
            viewOrientation: greatestAxisAbsXYZ(firstSlice.zDirectionX, firstSlice.zDirectionY, firstSlice.zDirectionZ),
          })
        }
      }
    },
    // Create+add one stackConfig out of the configs for 1+ groups
    // So when Scanning with multiple initial/proposed selectionConfigs, pass array of values into this, and end up with one stackConfig with the slices merged in a sorted order
    // shouldCalculateZDir3 - ignore supplied Zdir3, and crunch it from from XDir3 cross YDir3 again
    async addMergedStackConfig(
      { dispatch, rootGetters, rootState },
      {
        selectionConfigs,
        nameNew,
        shouldCalculateZDir3,
        stackIdent,
        isConfigOfCTLabMode,
        shouldLimitCTModel,
        // This variable is used to define the main stack be created from confirm button
        isUserAnsweredStackConfig,
        selectedHdBranchId,
        skipGlobalLoading,
      }
    ) {
      const isContrastLab = rootGetters['dicomService/isContrastLab']
      const isUltraLab = rootState.selectionConfig.isUltraLab
      const isResolutionLab = rootGetters['dicomService/isResolutionLab']

      // extendedSelectionConfigs - array of objects, each of which featuring the params used by createStackConfig
      let extendedSelectionConfigs = _.map(selectionConfigs, (selectionConfig) => {
        console.log('SCAN group', selectionConfig)
        if (!selectionConfig) {
          console.warn('selectionConfigsByIdent missing')
        } else {
          let {
            xDirection3,
            yDirection3,
            zDirection3,
            center3,
            dimensions3,
            numberOfSlices,
            thickness,
            spacing,
            echoTime,
            repetitionTime,
            inversionTime,
            flipAngle,
            sequenceType,
            fatSuppression,
            inversionRecovery,
            fieldStrength,
            phaseVoxelSize,
            frequencyVoxelSize,
            frequencyMatrix,
            phaseMatrix,
            pixelShift,
            noiseFactor,
            snr,
            flatFactor,
            falloffFactor,
            bValues,
            bValue,
            isADCMap,
            echoSpacing,
            echoTrainLength,
            enableTSEBlur,
            enableResolution,
            enableCompactMode,
            enableCruncherResolution,
            enableCruncherBasicLab,
            enableBitDepth8,
            enableFovWrap,
            oversampling,
            swapPhase,
            echoOrdering,
            sliceSelection,
            windowWidth,
            windowLevel,
            zDirectionBias,
            satBands,
          } = selectionConfig
          let name = nameNew || `Scan ${scanUniqueId()}`

          console.log('scanning selection Config', selectionConfig)

          // Append bValue to the name if it's a DIFF sequence and not an ADC map
          if (sequenceType === 'DIFF' && bValue !== undefined && !isADCMap) {
            name = `${name}_b${bValue}`
          } else if (sequenceType === 'DIFF' && isADCMap) {
            name = `${name}_ADC`
          }

          if (!isContrastLab) {
            sequenceType = null
          }

          const phaseEncodingAxis = swapPhase ? 1 : 0

          // TODO The reason we need to do this is that we seem to be persisting the wrong ZDir3 in StackQuestionResults - maybe we forgot to do a .clone() before manipulating it somewhere when crunching score in backend or something?
          if (shouldCalculateZDir3) {
            zDirection3 = xDirection3.clone().cross(yDirection3)
          }

          // In CT lab mode, if zDir null, calc zDir from xDir and yDir
          // Check equal apply for config has zDir = yDir
          if (configs.isCTLab && (!zDirection3 || isVector3Equal(zDirection3, yDirection3))) {
            zDirection3 = xDirection3.clone().cross(yDirection3)
          }

          const extendedConfig = {
            name,
            stackIdent,
            zDirection3, // direction of stack's slices / camera
            yDirection3, // x/y are for the rotation of the slices (matters when cutting/trimming to just desired selection)
            xDirection3,
            center3,
            dimensions3,
            contrastParameters: {
              echoTime,
              repetitionTime,
              inversionTime,
              flipAngle,
              fatSuppression,
              inversionRecovery,
              fieldStrength,
              echoSpacing,
              echoTrainLength,
              enableTSEBlur,
              enableResolution: isUltraLab || isResolutionLab ? enableResolution : false,
              enableCompactMode,
              enableFovWrap,
              swapPhase,
              frequencyMatrix,
              phaseMatrix,
              oversampling,
              phaseEncodingAxis,
              echoOrdering,
              sliceSelection,
              pixelShift,
              noiseFactor,
              snr,
              flatFactor,
              falloffFactor,
              isADCMap,
              bValues,
              bValue,
            },
            resolutionParameters: {
              enableCruncherResolution,
              frequencyMatrix,
              phaseMatrix,
              oversampling,
              phaseEncodingAxis,
              enableFovWrap,
              enableCompactMode,
              swapPhase,
            },
            basicLabParameters: {
              enableCruncherBasicLab,
              enableBitDepth8,
              frequencyMatrix,
              phaseMatrix,
              oversampling,
              phaseEncodingAxis,
              enableFovWrap,
              swapPhase,
            },
            sequenceType,
            numberOfSlices,
            thickness,
            spacing,
            desiredStackHeight: dimensions3.z,
            isLimited: true,
            phaseVoxelSize,
            frequencyVoxelSize,
            frequencyMatrix,
            phaseMatrix,
            windowWidth,
            windowLevel,
            isConfigOfCTLabMode,
            shouldLimitCTModel,
            isUserAnsweredStackConfig,
            selectedHdBranchId,
            zDirectionBias,
            satBands,
            skipGlobalLoading,
            answerData: selectionConfigToAnswerData(selectionConfig),
          }

          if (_.has(selectionConfig, ['scanDuration']) && configs.isCTLab) {
            extendedConfig.scanDuration = selectionConfig.scanDuration
          }

          return extendedConfig
        }
      })

      let createdStackConfigs = []
      const isMultiGroup = extendedSelectionConfigs.length > 1
      if (isMultiGroup && !skipGlobalLoading) {
        EventBus.$emit('LOADING', {
          name: 'ADD_STACK',
          title: configs.isCTLab ? 'Loading...' : 'Scanning...',
          isLoading: true,
        })
      }
      try {
        for (let extendedSelectionConfig of extendedSelectionConfigs) {
          if (isMultiGroup) {
            extendedSelectionConfig.skipGlobalLoading = true
          }
          createdStackConfigs.push(await dispatch('createStackConfig', extendedSelectionConfig))
        }
      } finally {
        if (isMultiGroup && !skipGlobalLoading) {
          EventBus.$emit('LOADING', { name: 'ADD_STACK', isLoading: false })
          if (!configs.isCTLab) {
            stopMriLoading()
            if (rootState.stackService.isOnMriView && !rootState.questionService.testResult) {
              startMriLoop()
            }
          }
        }
      }

      let stackConfig = createdStackConfigs[0]

      // Merge multiple into one, by sorting the slices
      if (createdStackConfigs.length > 1) {
        // Tag each slice with its source volume for multi-group rendering
        for (let config of createdStackConfigs) {
          for (let slice of config.slices) {
            slice.sourceStackIdent = config.stackIdent
          }
        }

        // one list of all the slices across the created stacks
        let slices = _.flatMap(createdStackConfigs, 'slices')
        let meanDirX = _.meanBy(slices, 'zDirectionX')
        let meanDirY = _.meanBy(slices, 'zDirectionY')
        let meanDirZ = _.meanBy(slices, 'zDirectionZ')
        // Figure out which direction/axis the slices are most alligned with, on average
        let greatestAxis = greatestAxisAbsXYZ(meanDirX, meanDirY, meanDirZ)

        // if axial, top to bottom
        if (greatestAxis === 'z') {
          stackConfig.slices = _.orderBy(slices, ['originZ'], ['desc'])
        } else if (greatestAxis === 'y') {
          stackConfig.slices = _.orderBy(slices, ['originY'], ['asc'])
        } else if (greatestAxis === 'x') {
          stackConfig.slices = _.orderBy(slices, ['originX'], ['asc'])
        }
      }
      return await dispatch('addStackConfig', {
        stackConfig,
        isFromMergeStackConfig: true,
        skipGlobalLoading: skipGlobalLoading || isMultiGroup,
      })
    },

    addStackConfigFromFrames({ state, commit }, { stack, frames, name, stackIdent, renameIdent, isLocalizer }) {
      // If these are out of order, maybe look at frame.index / frame.instanceNumber
      // Make a slice config for each frame, so we can view them nicely from a new stack for that purpose stack
      let slices = _.map(frames, function (frame) {
        // frames also have windowCenter / windowWidth on them
        // console.log(i, frame.url, frame)
        // console.log(frame.cosines())
        // console.log(frame.imageOrientation)
        // let yDir3 = frame.cosines()[0] // Not sure, might be backwards?
        // let xDir3 = frame.cosines()[1]
        let zDir3 = frame.cosines()[2]
        let imagePosition = frame.imagePosition
        log.debug(frame.imagePosition) // this is what the X/Y/Z position should get set to... then the camera is just not looking there, but ought to
        log.debug('dir', zDir3) // set dir as this
        return {
          // imagePosition 's X/Y seems to make it center over the bottom-left corner of the viewport
          //    * -1 those makes it be the top-right
          // 0 makes it be the center, but that doesn't seem right either. It makes random frames of the default DICOM be out of bounds (even without that there's one that doesn't show up for that one)
          originX: imagePosition[0], // * -1,
          originY: imagePosition[1], // * -1,
          originZ: imagePosition[2], // * -1,
          // TODO Add xDirection* / yDirection* if needed ~ usually just needed if we want to trim the data down more than what we actually have, when manually Scanning/AddingLocalizers ...
          zDirectionX: zDir3.x,
          zDirectionY: zDir3.y,
          zDirectionZ: zDir3.z, // sometimes these come in as 0,0,-1 etc, and that makes them flipped, which we don't want. How did I fix this in SliceVue?
          thickness: 0,
          spacing: 1,
        }
      })

      if (isLocalizer) {
        // Localizer series show their original seriesDescription from the file in the dropdown so user can know which is which when there are multiple Localizer series
        name = name || 'Localizer'
      } else {
        name = 'Frames'
      }

      let stackConfig = {
        name: `${name} ${stackIdent}`,
        stackIdent,
        renameIdent,
        hidden: !isLocalizer,
        isLocalizer,
        isFromFrames: true,
        slices,
        sequenceType: stack.type,
      }
      let stackConfigs = [...state.stackConfigs, stackConfig]

      // Remove the default stackConfigs if we have a Localizer
      if (isLocalizer) {
        stackConfigs = _.filter(stackConfigs, 'stackIdent')
      }
      commit('set', { stackConfigs })
    },

    /**
     * Use a 3D localizer (sequence type 'LOC') to create some basic localizer slices. This is used when basic localizer data is not available
     */
    createLocalizersFromLocalizerVolume({ dispatch, rootGetters }, { stackIdent }) {
      const currentSelection = _.cloneDeep(rootGetters['selectionConfig/getPreset'])

      currentSelection.dimensions3.set(150, 150, 150)
      currentSelection.numberOfSlices = 3
      currentSelection.thickness = 0
      currentSelection.spacing = 10

      let { center3, spacing, zDirection3, yDirection3, xDirection3, dimensions3, numberOfSlices } = currentSelection

      function dir3ToDirName(dir3) {
        let axisName = greatestAxisAbsXYZ(dir3.x, dir3.y, dir3.z)
        return { x: 'Sagittal', y: 'Coronal', z: 'Axial' }[axisName]
      }

      // Localizer's StackHeight is based on 3 Slices (one in center, one at each extreme, np thickness, so just spacing between them)
      let desiredStackHeight = spacing * 2
      let baseName = 'Localizer'

      // This creates 3 different Localizer, one in each direction, so we swap the x/y/zDir3s

      // Z / as-is
      // If it was Axial, it will stay axial: (x<-x,y<-y,z<-z)
      dispatch('addStackConfig', {
        name: baseName + ' ' + dir3ToDirName(zDirection3),
        hidden: false,
        xDirection3,
        yDirection3, // x/y are for the rotation of the slices (matters when cutting/trimming to just desired selection)
        zDirection3, // the direction of the stack
        dimensions3,
        center3,
        desiredStackHeight,
        isLimited: false,
        isLocalizer: true,
        numberOfSlices,
        stackIdent,
      })
      // Y
      // If it was Axial, it will be Cor: (x<-z,y<-x,z<-y)
      dispatch('addStackConfig', {
        name: baseName + ' ' + dir3ToDirName(yDirection3),
        hidden: false,
        xDirection3: zDirection3,
        yDirection3: xDirection3,
        zDirection3: yDirection3, // This is intentionally diff to get Localizers in all 3 directions!
        dimensions3,
        center3,
        desiredStackHeight,
        isLimited: false,
        isLocalizer: true,
        numberOfSlices,
        stackIdent,
      })
      // X
      // If it was Axial, it will be Sag: (x<-y,y<-z,z<-x)
      dispatch('addStackConfig', {
        name: baseName + ' ' + dir3ToDirName(xDirection3),
        hidden: false,
        xDirection3: yDirection3,
        yDirection3: zDirection3,
        zDirection3: xDirection3,
        dimensions3,
        center3,
        desiredStackHeight,
        isLimited: false,
        isLocalizer: true,
        numberOfSlices,
        stackIdent,
      })
    },

    // Handle cut slices
    cutSlicesOfStackConfigAndExtraConfigs({ state, commit, rootGetters }, { endSliceIndex }) {
      if (!configs.isCTLab) {
        return
      }
      const configName = state.configNameOfFirstSliceView

      let stackConfigs = [...state.stackConfigs]

      const currentSelection = _.cloneDeep(rootGetters['selectionConfig/selectionConfigCurrent'])
      let ctAnswerCenter3 = currentSelection.center3
      let ctAnswerDimensions3 = currentSelection.dimensions3
      stackConfigs.forEach((el) => {
        if (el.name === configName || el.name.includes(`${EXTRA_SCAN_BASE_NAME} ${configName} `)) {
          ctAnswerCenter3 = new THREE.Vector3(
            _.get(el.center3, ['x'], 0),
            _.get(el.center3, ['y'], 0),
            _.get(el.center3, ['z'], 0)
          )
          ctAnswerDimensions3 = new THREE.Vector3(
            _.get(el.dimensions3, ['x'], 0),
            _.get(el.dimensions3, ['y'], 0),
            _.get(el.dimensions3, ['z'], 0)
          )
          if (el.slices && el.slices.length > 0) {
            el.slices = el.slices.slice(0, endSliceIndex + 1)

            ctAnswerCenter3 = new THREE.Vector3(
              _.get(el.slices, [0, 'originX'], 0),
              _.get(el.slices, [0, 'originY'], 0),
              _.get(el.slices, [0, 'originZ'], 0)
            )
              .add(
                new THREE.Vector3(
                  _.get(el.slices, [el.slices.length - 1, 'originX'], 0),
                  _.get(el.slices, [el.slices.length - 1, 'originY'], 0),
                  _.get(el.slices, [el.slices.length - 1, 'originZ'], 0)
                )
              )
              .multiplyScalar(0.5)

            ctAnswerDimensions3 = ctAnswerDimensions3.clone()
            ctAnswerDimensions3.z = new THREE.Vector3(
              _.get(el.slices, [0, 'originX'], 0),
              _.get(el.slices, [0, 'originY'], 0),
              _.get(el.slices, [0, 'originZ'], 0)
            ).distanceTo(
              new THREE.Vector3(
                _.get(el.slices, [el.slices.length - 1, 'originX'], 0),
                _.get(el.slices, [el.slices.length - 1, 'originY'], 0),
                _.get(el.slices, [el.slices.length - 1, 'originZ'], 0)
              )
            )
          }
        }
      })

      let ctSliceBoxAnswer = _.cloneDeep(state.ctSliceBoxAnswer)
      const stackQuestion = rootGetters['questionService/stackQuestion']
      if (stackQuestion && _.has(stackQuestion, ['id'])) {
        ctSliceBoxAnswer[stackQuestion.id] = {
          ctAnswerCenterX: ctAnswerCenter3.x,
          ctAnswerCenterY: ctAnswerCenter3.y,
          ctAnswerCenterZ: ctAnswerCenter3.z,
          ctAnswerDimensionX: ctAnswerDimensions3.x,
          ctAnswerDimensionY: ctAnswerDimensions3.y,
          ctAnswerDimensionZ: ctAnswerDimensions3.z,
        }
      }

      commit('set', { stackConfigs, ctSliceBoxAnswer })
    },

    resetStackConfigs({ commit }) {
      commit('set', { stackConfigs: [], ctSliceBoxAnswer: {} })
    },

    deleteMergeStackConfigOfSelectedStackQuestion({ state, commit, rootState }) {
      const questionIndex = rootState.questionService.selectedStackQuestionIndex
      const mergedStackConfigName = _.get(
        _.reverse(_.cloneDeep(state.stackConfigs)).find(
          (el) =>
            !el.name.includes(EXTRA_SCAN_BASE_NAME) &&
            el.isConfigOfCTLabMode &&
            _.get(el, ['questionIndex'], -1) == questionIndex
        ),
        'name',
        ''
      )
      let stackConfigs = [...state.stackConfigs]
      stackConfigs = [...stackConfigs.filter((el) => el.name != mergedStackConfigName)]
      stackConfigs = [
        ...stackConfigs.filter(
          (el) => !el.name || !(el.name.includes(EXTRA_SCAN_BASE_NAME) && el.name.includes(mergedStackConfigName))
        ),
      ]

      // After delete last merged stack config, show extra config of last merged config
      let lastMergedStackConfigIndex = _.reverse(_.cloneDeep(stackConfigs)).findIndex(
        (el) => !el.name.includes(EXTRA_SCAN_BASE_NAME) && el.isConfigOfCTLabMode
      )
      if (lastMergedStackConfigIndex > -1) {
        lastMergedStackConfigIndex = stackConfigs.length - 1 - lastMergedStackConfigIndex

        stackConfigs.forEach((el, index) => {
          if (el.name.includes(EXTRA_SCAN_BASE_NAME) && index >= lastMergedStackConfigIndex) {
            el.hidden = false
          }
        })
      }

      commit('set', { stackConfigs })
    },
    hiddenExtraStackConfigOfOtherStackQuestion({ state, commit, rootState }) {
      const questionIndex = rootState.questionService.selectedStackQuestionIndex
      let stackConfigs = [...state.stackConfigs]
      stackConfigs.forEach((el) => {
        if (el.name.includes(EXTRA_SCAN_BASE_NAME) && _.get(el, ['questionIndex'], -1) != questionIndex) {
          el.hidden = true
        }
      })
      commit('set', { stackConfigs })
    },
    showMergeStackConfigOfCurrentQuestion({ state, rootState, commit }) {
      const questionIndex = rootState.questionService.selectedStackQuestionIndex
      let stackConfigs = [...state.stackConfigs]
      const mergedStackConfig = stackConfigs.find(
        (el) =>
          !el.name.includes(EXTRA_SCAN_BASE_NAME) &&
          el.isConfigOfCTLabMode &&
          _.get(el, ['questionIndex'], -1) == questionIndex
      )

      if (mergedStackConfig) {
        mergedStackConfig.hidden = false

        commit('set', { stackConfigs })
      }
    },
    setSliceViewIndexWillShowResult({ commit }, payload) {
      commit('set', { sliceViewIndexWillShowResult: payload })
    },
    setIsOnMriView({ commit }, payload) {
      commit('set', { isOnMriView: payload })
    },
    async setScanPercentOfMRIMachine({ commit }, payload) {
      commit('set', { scanPercentOfMRIMachine: payload })
    },
    async setScanPercentStartOfLandmark({ commit }, payload) {
      commit('set', { scanPercentStartOfLandmark: payload })
    },
    async setScanPercentStartOfMRIMachine({ commit }, payload) {
      commit('set', { scanPercentStartOfMRIMachine: payload })
    },
    async setIsMriMachineScanComplete({ commit }, payload) {
      commit('set', { isMriMachineScanComplete: payload })
    },
    async setMriModelBbox({ commit, state }, { center, dimensions }) {
      if (dimensions && center) {
        commit('set', {
          mriModelBbox: {
            ...state.mriModelBbox,
            center,
            dimensions: new THREE.Vector3(
              Math.max(dimensions.x, state.mriModelBbox.dimensions.x),
              Math.max(dimensions.y, state.mriModelBbox.dimensions.y),
              Math.max(dimensions.z, state.mriModelBbox.dimensions.z)
            ),
          },
        })
      }
    },
    async resetMriModelBbox({ commit }) {
      commit('set', {
        mriModelBbox: {
          center: new THREE.Vector3(0, 0, 0),
          dimensions: new THREE.Vector3(0, 0, 0),
        },
      })
    },
    async setConfigNameOfFirstSliceView({ commit }, payload) {
      commit('set', { configNameOfFirstSliceView: payload })
    },
    async setSliceIndexOfFirstSliceView({ commit }, payload) {
      commit('set', { sliceIndexOfFirstSliceView: payload })
    },
    async setScanDurationOfConfig({ commit }, payload) {
      commit('set', { scanDurationOfConfig: payload })
    },
    async setLandmarked3dPoint({ commit }, payload) {
      commit('set', { landmarked3dPoint: payload })
    },
    async resetLocalizerPercentScanned({ commit }) {
      commit('set', { isMriMachineScanComplete: false, scanPercentStartOfMRIMachine: 0, scanPercentOfMRIMachine: 0 })
    },
  },

  getters: {
    configNameOfFirstSliceViewIndex(state) {
      return _.findIndex(state.stackConfigs, (el) => el.name == state.configNameOfFirstSliceView)
    },
    lastStackConfigOfAcq(state) {
      let configIndex = _.reverse(_.cloneDeep(state.stackConfigs)).findIndex(
        (el) => !el.name.includes(EXTRA_SCAN_BASE_NAME) && el.isConfigOfCTLabMode && el.shouldLimitCTModel
      )
      if (configIndex > -1) {
        configIndex = state.stackConfigs.length - 1 - configIndex
      }
      if (configIndex == -1) {
        return null
      } else {
        return _.cloneDeep(state.stackConfigs[configIndex])
      }
    },
    filterLastConfigOfEachQuestion(state) {
      // Only acq appear in here
      // Only acq has the next question is recon has limit plane
      return _.filter(state.stackConfigs, (config, index) => {
        const shouldLimitConfig =
          config.isConfigOfCTLabMode &&
          config.shouldLimitCTModel &&
          config.xDirection3 &&
          config.yDirection3 &&
          config.zDirection3 &&
          config.center3 &&
          config.dimensions3
        return (
          shouldLimitConfig &&
          !state.stackConfigs.slice(index + 1, state.stackConfigs.length).find((el) => {
            const shouldLimit =
              el.isConfigOfCTLabMode &&
              el.shouldLimitCTModel &&
              el.xDirection3 &&
              el.yDirection3 &&
              el.zDirection3 &&
              el.center3 &&
              el.dimensions3
            return shouldLimit && el.questionIndex == config.questionIndex
          })
        )
      })
    },
    limitedCTModelPlanesOfStackConfigs(state, getters) {
      const filterLastConfigOfEachQuestion = getters.filterLastConfigOfEachQuestion
      return _.flatMap(filterLastConfigOfEachQuestion, function (config) {
        if (
          config.isConfigOfCTLabMode &&
          config.shouldLimitCTModel &&
          config.xDirection3 &&
          config.yDirection3 &&
          config.zDirection3 &&
          config.center3 &&
          config.dimensions3
        ) {
          const extendedLimitXDir = config.extendedLimitXDir ?? 'x'
          const extendedLimitYDir = config.extendedLimitYDir ?? 'y'
          const extendedLimitZDir = config.extendedLimitZDir ?? 'z'

          const px1 = config.center3
            .clone()
            .add(config.xDirection3.clone().multiplyScalar(-config.dimensions3[extendedLimitXDir] / 2))
          const nx1 = config.xDirection3.clone()
          const planeX1 = new THREE.Plane().setFromNormalAndCoplanarPoint(nx1, px1)

          const px2 = config.center3
            .clone()
            .add(config.xDirection3.clone().multiplyScalar(config.dimensions3[extendedLimitXDir] / 2))
          const nx2 = config.xDirection3.clone().negate()
          const planeX2 = new THREE.Plane().setFromNormalAndCoplanarPoint(nx2, px2)

          const py1 = config.center3
            .clone()
            .add(config.yDirection3.clone().multiplyScalar(-config.dimensions3[extendedLimitYDir] / 2))
          const ny1 = config.yDirection3.clone()
          const planeY1 = new THREE.Plane().setFromNormalAndCoplanarPoint(ny1, py1)

          const py2 = config.center3
            .clone()
            .add(config.yDirection3.clone().multiplyScalar(config.dimensions3[extendedLimitYDir] / 2))
          const ny2 = config.yDirection3.clone().negate()
          const planeY2 = new THREE.Plane().setFromNormalAndCoplanarPoint(ny2, py2)

          const pz1 = config.center3
            .clone()
            .add(config.zDirection3.clone().multiplyScalar(-config.dimensions3[extendedLimitZDir] / 2))
          const nz1 = config.zDirection3.clone()
          const planeZ1 = new THREE.Plane().setFromNormalAndCoplanarPoint(nz1, pz1)

          const pz2 = config.center3
            .clone()
            .add(config.zDirection3.clone().multiplyScalar(config.dimensions3[extendedLimitZDir] / 2))
          const nz2 = config.zDirection3.clone().negate()
          const planeZ2 = new THREE.Plane().setFromNormalAndCoplanarPoint(nz2, pz2)

          return [
            { questionIndex: config.questionIndex, plane: planeX1 },
            { questionIndex: config.questionIndex, plane: planeX2 },
            { questionIndex: config.questionIndex, plane: planeY1 },
            { questionIndex: config.questionIndex, plane: planeY2 },
            { questionIndex: config.questionIndex, plane: planeZ1 },
            { questionIndex: config.questionIndex, plane: planeZ2 },
          ]
        } else {
          return []
        }
      })
    },
    limitedCTModelPlanesOfStackConfigsToAnswerData(state, getters) {
      let filterLastConfigOfEachQuestion = getters.filterLastConfigOfEachQuestion
      // We must sort configs list
      filterLastConfigOfEachQuestion = _.orderBy(filterLastConfigOfEachQuestion, ['questionIndex'])

      // Return the last limit of acq
      if (filterLastConfigOfEachQuestion.length > 0) {
        filterLastConfigOfEachQuestion = [filterLastConfigOfEachQuestion[filterLastConfigOfEachQuestion.length - 1]]
      } else {
        filterLastConfigOfEachQuestion = []
      }
      return _.flatMap(filterLastConfigOfEachQuestion, function (config) {
        if (
          config.isConfigOfCTLabMode &&
          config.shouldLimitCTModel &&
          config.xDirection3 &&
          config.yDirection3 &&
          config.zDirection3 &&
          config.center3 &&
          config.dimensions3
        ) {
          const extendedLimitXDir = config.extendedLimitXDir ?? 'x'
          const extendedLimitYDir = config.extendedLimitYDir ?? 'y'
          const extendedLimitZDir = config.extendedLimitZDir ?? 'z'

          const px1 = config.center3
            .clone()
            .add(config.xDirection3.clone().multiplyScalar(-config.dimensions3[extendedLimitXDir] / 2))
          const nx1 = config.xDirection3.clone()

          const px2 = config.center3
            .clone()
            .add(config.xDirection3.clone().multiplyScalar(config.dimensions3[extendedLimitXDir] / 2))
          const nx2 = config.xDirection3.clone().negate()

          const py1 = config.center3
            .clone()
            .add(config.yDirection3.clone().multiplyScalar(-config.dimensions3[extendedLimitYDir] / 2))
          const ny1 = config.yDirection3.clone()

          const py2 = config.center3
            .clone()
            .add(config.yDirection3.clone().multiplyScalar(config.dimensions3[extendedLimitYDir] / 2))
          const ny2 = config.yDirection3.clone().negate()

          const pz1 = config.center3
            .clone()
            .add(config.zDirection3.clone().multiplyScalar(-config.dimensions3[extendedLimitZDir] / 2))
          const nz1 = config.zDirection3.clone()

          const pz2 = config.center3
            .clone()
            .add(config.zDirection3.clone().multiplyScalar(config.dimensions3[extendedLimitZDir] / 2))
          const nz2 = config.zDirection3.clone().negate()

          return [
            { questionIndex: config.questionIndex, n: vector3ToData(nx1), p: vector3ToData(px1) },
            { questionIndex: config.questionIndex, n: vector3ToData(nx2), p: vector3ToData(px2) },
            { questionIndex: config.questionIndex, n: vector3ToData(ny1), p: vector3ToData(py1) },
            { questionIndex: config.questionIndex, n: vector3ToData(ny2), p: vector3ToData(py2) },
            { questionIndex: config.questionIndex, n: vector3ToData(nz1), p: vector3ToData(pz1) },
            { questionIndex: config.questionIndex, n: vector3ToData(nz2), p: vector3ToData(pz2) },
          ]
        } else {
          return []
        }
      })
    },
    // Direction of current stack config has closestSignedWorldAxis3.z = 1 or -1
    // If bias = 1, should change closestSignedWorldAxis3 to 1
    // If bias = -1, should change closestSignedWorldAxis3 to -1
    currentZDirectionBias(state, getters, rootState) {
      // const patientDirectionSide1 = rootState.questionService.patientDirectionSide1
      // const patientDirectionSide2 = rootState.questionService.patientDirectionSide2
      // const patientDirectionSide3 = rootState.questionService.patientDirectionSide3
      // const listPatientPositionsAndBodyBox = rootGetters['questionService/listPatientPositionsAndBodyBox']

      // const currentSavedPatientPosition = _.find(
      //   listPatientPositionsAndBodyBox,
      //   (el) =>
      //     el.value.includes(patientDirectionSide1) &&
      //     el.value.includes(patientDirectionSide2) &&
      //     el.value.includes(patientDirectionSide3)
      // )

      // const bodyBoxDirection = _.get(currentSavedPatientPosition, ['bodyBox', 'bodyBoxDirection'], 1)
      // const selectedMRIScanDirection = rootState.selectionConfig.selectedMRIScanDirection

      // let bias = 1
      // if (bodyBoxDirection == selectedMRIScanDirection) {
      //   bias = 1
      // } else {
      //   bias = -1
      // }

      // bias = patientDirectionSide1 == PATIENT_POSITION_TEXT.HEAD_FIRST ? bias : -bias

      const selectedMRIScanDirection = rootState.selectionConfig.selectedMRIScanDirection
      const bias = selectedMRIScanDirection == 1 ? 1 : -1

      // Bias = 1: The model is scan from top to bottom
      // Bias = -1: The model is scan from bottom to top
      return bias
    },
    isBodyBoxSameDirWithCtScan(state, getters, rootState, rootGetters) {
      const listPatientPositionsAndBodyBox = rootGetters['questionService/listPatientPositionsAndBodyBox']
      const currentSavedPatientPosition = listPatientPositionsAndBodyBox.find(
        (el) =>
          el.value.includes(rootState.questionService.patientDirectionSide1) &&
          el.value.includes(rootState.questionService.patientDirectionSide2) &&
          el.value.includes(rootState.questionService.patientDirectionSide3) &&
          el.isShowHeadHolder == rootState.selectionConfig.isMRIShowHeadHolder
      )
      const info = currentSavedPatientPosition
      let isBodyBoxSameDirWithCtScan = true
      // 1: bed move in, 2: bed move out
      if (info && info.bodyBox) {
        const bodyBoxDirection = _.get(info, ['bodyBox', 'bodyBoxDirection'], 1)
        if (rootState.questionService.patientDirectionSide1 == PATIENT_POSITION_TEXT.HEAD_FIRST) {
          // ctScanDirection has same dir with bodyBoxDirection
          if (rootState.selectionConfig.selectedMRIScanDirection != bodyBoxDirection) {
            isBodyBoxSameDirWithCtScan = false
          }
        } else {
          // opposite
          if (rootState.selectionConfig.selectedMRIScanDirection == bodyBoxDirection) {
            isBodyBoxSameDirWithCtScan = false
          }
        }
      }
      return isBodyBoxSameDirWithCtScan
    },
    // percent > 0 when bottom of max config is above bottom of 3d model
    distancePercentFromMaxConfigBoxTo3dModelBox(state, getters, rootState, rootGetters) {
      // Orientation x or y
      let limitDirText = 'z'
      // Get direction of default stackConfig to calculate the axis of limit scan
      // The initial scaned stackconfigs is stackConfigs[0]
      if (state.stackConfigs.length > 0) {
        let defaultStackConfig = state.stackConfigs[0]
        const noHiddenStackConfigs = _.reject(state.stackConfigs, 'hidden')
        if (noHiddenStackConfigs.length > 0) {
          defaultStackConfig = noHiddenStackConfigs[0]
        }
        let orientation = greatestAxisAbsXYZ(
          defaultStackConfig.slices[0].zDirectionX,
          defaultStackConfig.slices[0].zDirectionY,
          defaultStackConfig.slices[0].zDirectionZ
        )
        // Calculate dir
        // Follow function updateGeometries() in SliceView.vue
        // With orientation is x or y, z is the direction of MRI scan
        // Set limit direction for z orientation
        if (orientation == 'z') {
          limitDirText = 'y'
        }
      }
      // Get box from localizer question
      const stackQuestions = rootGetters['questionService/stackQuestions']
      const localizerQuestion = stackQuestions.find((el) => el.questionType == 3)
      const maxConfig = _.get(localizerQuestion, ['answers', 0, '0_max'], null)

      let percent = 0
      if (maxConfig) {
        let mriBoxExpand = 0
        const arrs = ['x', 'y', 'z']
        arrs.forEach((text) => {
          if (
            _.has(maxConfig, [`${text}DirectionX`]) &&
            _.has(maxConfig, [`${text}DirectionY`]) &&
            _.has(maxConfig, [`${text}DirectionZ`]) &&
            greatestAxisAbsXYZ(
              _.get(maxConfig, [`${text}DirectionX`]),
              _.get(maxConfig, [`${text}DirectionY`]),
              _.get(maxConfig, [`${text}DirectionZ`])
            ) == limitDirText
          ) {
            mriBoxExpand = _.get(maxConfig, [`dimension${text.toLocaleUpperCase()}`])
          }
        })
        // Box in max config
        let center = new THREE.Vector3(
          _.get(maxConfig, ['centerX'], 0),
          _.get(maxConfig, ['centerY'], 0),
          _.get(maxConfig, ['centerZ'], 0)
        )

        // The loaded model bouding box 3d
        const stackModelExpand = _.get(state.mriModelBbox, ['dimensions', limitDirText])
        const stackModelCenter = new THREE.Vector3(
          _.get(state.mriModelBbox, ['center', 'x']),
          _.get(state.mriModelBbox, ['center', 'y']),
          _.get(state.mriModelBbox, ['center', 'z'])
        )

        const bottomOfMriBoxExpand = center[limitDirText] - mriBoxExpand / 2
        const bottomOfModelExpand = stackModelCenter[limitDirText] - stackModelExpand / 2

        if (bottomOfModelExpand < bottomOfMriBoxExpand) {
          const distance = Math.abs(bottomOfMriBoxExpand - bottomOfModelExpand)
          percent = (distance / mriBoxExpand) * 100
        }
      }

      return percent
    },
    // limitedCTModelPlanesOfScanPercent(state, getters, rootState, rootGetters) {
    //   // Only used for the first localizer
    //   const selectedMRIScanDirectionOfLocalizer = rootState.selectionConfig.selectedMRIScanDirectionOfLocalizer

    //   // let bias = 1
    //   // if (bodyBoxDirection == selectedMRIScanDirectionOfLocalizer) {
    //   //   bias = 1
    //   // } else {
    //   //   bias = -1
    //   // }

    //   // bias = patientDirectionSide1 == PATIENT_POSITION_TEXT.HEAD_FIRST ? bias : -bias

    //   let bias = 1
    //   // Head to foot bias = 1
    //   if (selectedMRIScanDirectionOfLocalizer == 1) {
    //     bias = 1
    //   } else {
    //     bias = -1
    //   }

    //   // Orientation x or y
    //   let limitDirection = new THREE.Vector3(0, 0, 1)
    //   let limitDirText = 'z'
    //   // Get direction of default stackConfig to calculate the axis of limit scan
    //   // The initial scaned stackconfigs is stackConfigs[0]
    //   if (state.stackConfigs.length > 0) {
    //     let defaultStackConfig = state.stackConfigs[0]
    //     const noHiddenStackConfigs = _.reject(state.stackConfigs, 'hidden')
    //     if (noHiddenStackConfigs.length > 0) {
    //       defaultStackConfig = noHiddenStackConfigs[0]
    //     }
    //     let orientation = greatestAxisAbsXYZ(
    //       defaultStackConfig.slices[0].zDirectionX,
    //       defaultStackConfig.slices[0].zDirectionY,
    //       defaultStackConfig.slices[0].zDirectionZ
    //     )
    //     // Calculate dir
    //     // Follow function updateGeometries() in SliceView.vue
    //     // With orientation is x or y, z is the direction of MRI scan
    //     // Set limit direction for z orientation
    //     if (orientation == 'z') {
    //       limitDirection = new THREE.Vector3(0, -1, 0)
    //       limitDirText = 'y'
    //     }
    //   }

    //   // Get box from localizer question
    //   const stackQuestions = rootGetters['questionService/stackQuestions']
    //   const localizerQuestion = stackQuestions.find((el) => el.questionType == 3)
    //   const maxConfig = _.get(localizerQuestion, ['answers', 0, '0_max'], null)
    //   const planes = []
    //   if (maxConfig) {
    //     let mriBoxExpand = 0
    //     const arrs = ['x', 'y', 'z']
    //     arrs.forEach((text) => {
    //       if (
    //         _.has(maxConfig, [`${text}DirectionX`]) &&
    //         _.has(maxConfig, [`${text}DirectionY`]) &&
    //         _.has(maxConfig, [`${text}DirectionZ`]) &&
    //         greatestAxisAbsXYZ(
    //           _.get(maxConfig, [`${text}DirectionX`]),
    //           _.get(maxConfig, [`${text}DirectionY`]),
    //           _.get(maxConfig, [`${text}DirectionZ`])
    //         ) == limitDirText
    //       ) {
    //         mriBoxExpand = _.get(maxConfig, [`dimension${text.toLocaleUpperCase()}`])
    //       }
    //     })
    //     // Box in max config
    //     let center = new THREE.Vector3(
    //       _.get(maxConfig, ['centerX'], 0),
    //       _.get(maxConfig, ['centerY'], 0),
    //       _.get(maxConfig, ['centerZ'], 0)
    //     )

    //     let originMriBoxExpand = mriBoxExpand
    //     if (getters.distancePercentFromMaxConfigBoxTo3dModelBox > 0) {
    //       const distance = (getters.distancePercentFromMaxConfigBoxTo3dModelBox / 100) * originMriBoxExpand
    //       // Expand to end of model 3d
    //       mriBoxExpand += distance
    //       // Adjust center of config
    //       center[limitDirText] = center[limitDirText] - distance / 2
    //     }

    //     if (state.scanPercentStartOfLandmark != 0) {
    //       // scanPercentStartOfLandmark < 0
    //       // start point is far from center
    //       // scanPercentStartOfLandmark > 0 start point near center
    //       const distance = (state.scanPercentStartOfLandmark / 100) * originMriBoxExpand

    //       // Expand to end of model 3d
    //       mriBoxExpand -= distance
    //       // Adjust center of config
    //       center[limitDirText] = center[limitDirText] - distance / 2
    //     }

    //     if (mriBoxExpand != 0) {
    //       // Limit top
    //       const planes = []
    //       const p1 = center.clone().add(
    //         limitDirection
    //           .clone()
    //           .multiplyScalar(bias)
    //           .multiplyScalar(mriBoxExpand / 2 - (mriBoxExpand * state.scanPercentStartOfMRIMachine) / 100)
    //       )
    //       const n1 = bias == 1 ? limitDirection.clone().negate() : limitDirection.clone()
    //       const plane1 = new THREE.Plane().setFromNormalAndCoplanarPoint(n1, p1)
    //       planes.push(plane1)

    //       // Limit bottom
    //       const p2 = center.clone().add(
    //         limitDirection
    //           .clone()
    //           .multiplyScalar(bias)
    //           .multiplyScalar(mriBoxExpand / 2 - (mriBoxExpand * state.scanPercentOfMRIMachine) / 100)
    //       )
    //       const n2 = bias == 1 ? limitDirection.clone() : limitDirection.clone().negate()
    //       const plane2 = new THREE.Plane().setFromNormalAndCoplanarPoint(n2, p2)
    //       planes.push(plane2)
    //       return planes
    //     } else {
    //       return []
    //     }
    //   }

    //   return planes
    // },
    // limitedCTModelPlanesOfLandmark(state, getters, rootState, rootGetters) {
    //   // Only used for the first localizer
    //   const selectedMRIScanDirectionOfLocalizer = rootState.selectionConfig.selectedMRIScanDirectionOfLocalizer

    //   let bias = 1
    //   // Head to foot bias = 1
    //   if (selectedMRIScanDirectionOfLocalizer == 1) {
    //     bias = 1
    //   } else {
    //     bias = -1
    //   }

    //   // Orientation x or y
    //   let limitDirection = new THREE.Vector3(0, 0, 1)
    //   let limitDirText = 'z'
    //   // Get direction of default stackConfig to calculate the axis of limit scan
    //   // The initial scaned stackconfigs is stackConfigs[0]
    //   if (state.stackConfigs.length > 0) {
    //     let defaultStackConfig = state.stackConfigs[0]
    //     const noHiddenStackConfigs = _.reject(state.stackConfigs, 'hidden')
    //     if (noHiddenStackConfigs.length > 0) {
    //       defaultStackConfig = noHiddenStackConfigs[0]
    //     }
    //     let orientation = greatestAxisAbsXYZ(
    //       defaultStackConfig.slices[0].zDirectionX,
    //       defaultStackConfig.slices[0].zDirectionY,
    //       defaultStackConfig.slices[0].zDirectionZ
    //     )
    //     // Calculate dir
    //     // Follow function updateGeometries() in SliceView.vue
    //     // With orientation is x or y, z is the direction of MRI scan
    //     // Set limit direction for z orientation
    //     if (orientation == 'z') {
    //       limitDirection = new THREE.Vector3(0, -1, 0)
    //       limitDirText = 'y'
    //     }
    //   }

    //   // Get box from localizer question
    //   const stackQuestions = rootGetters['questionService/stackQuestions']
    //   const localizerQuestion = stackQuestions.find((el) => el.questionType == 3)
    //   const maxConfig = _.get(localizerQuestion, ['answers', 0, '0_max'], null)
    //   const planes = []
    //   if (maxConfig) {
    //     let mriBoxExpand = 0
    //     const arrs = ['x', 'y', 'z']
    //     arrs.forEach((text) => {
    //       if (
    //         _.has(maxConfig, [`${text}DirectionX`]) &&
    //         _.has(maxConfig, [`${text}DirectionY`]) &&
    //         _.has(maxConfig, [`${text}DirectionZ`]) &&
    //         greatestAxisAbsXYZ(
    //           _.get(maxConfig, [`${text}DirectionX`]),
    //           _.get(maxConfig, [`${text}DirectionY`]),
    //           _.get(maxConfig, [`${text}DirectionZ`])
    //         ) == limitDirText
    //       ) {
    //         mriBoxExpand = _.get(maxConfig, [`dimension${text.toLocaleUpperCase()}`])
    //       }
    //     })
    //     const center = new THREE.Vector3(
    //       _.get(maxConfig, ['centerX'], 0),
    //       _.get(maxConfig, ['centerY'], 0),
    //       _.get(maxConfig, ['centerZ'], 0)
    //     )

    //     if (mriBoxExpand != 0) {
    //       // Limit top
    //       if (state.scanPercentStartOfLandmark != 0) {
    //         const p = center.clone().add(
    //           limitDirection
    //             .clone()
    //             .multiplyScalar(bias)
    //             .multiplyScalar(mriBoxExpand / 2 - (mriBoxExpand * state.scanPercentStartOfLandmark) / 100)
    //         )
    //         const n = bias == 1 ? limitDirection.clone().negate() : limitDirection.clone()
    //         const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, p)
    //         planes.push(plane)
    //       }
    //       return planes
    //     } else {
    //       return []
    //     }
    //   }

    //   return planes
    // },
    stackConfigsByOrientation(state) {
      // Only default to stackConfigs with an ident (so discovered ones, never the "Default" ones
      let stackConfigs = _.filter(state.stackConfigs, 'stackIdent')

      let stackConfigMaps = _.map(stackConfigs, function (stackConfig) {
        let orientation = greatestAxisAbsXYZ(
          stackConfig.slices[0].zDirectionX,
          stackConfig.slices[0].zDirectionY,
          stackConfig.slices[0].zDirectionZ
        )
        return { stackConfig, orientation }
      })

      let grouped = _.groupBy(stackConfigMaps, 'orientation')

      return _.mapValues(grouped, function (items) {
        let stackConfigs = _.map(items, 'stackConfig')
        // Sort them to be localizer first, so that the default dropdown option used prefers those over the HD stack
        return _.orderBy(stackConfigs, ['isLocalizer'], ['desc'])
      })
    },
    stackConfigsIncludeNonLocalizer(state) {
      // TODO rename this for what it's actually used for in the one place it's used (to prevent scan when it won't work)
      // Cruncher handles scan results for all MRI lab types — volume files are not loaded,
      // so non-localizer stacks won't exist, but scans still work via cruncher
      if (!configs.isCTLab) {
        return true
      } else {
        return _.some(state.stackConfigs, { isLocalizer: false })
      }
    },
    stackIdentOfFirstNonLocalizer(state) {
      let stackConfig = _.find(state.stackConfigs, { isLocalizer: false })
      return _.get(stackConfig, 'stackIdent')
    },
    stackConfigOfFirstNonLocalizer(state) {
      return _.find(state.stackConfigs, { isLocalizer: false })
    },
    stackConfigOfFirstLocalizer(state) {
      return _.find(state.stackConfigs, { isLocalizer: true })
    },
    configNumberOfSlices(state, getters, rootState, rootGetters) {
      // This should always come from the primary/proposed config
      // return rootGetters['selectionConfig/selectionConfigProposed'].numberOfSlices
      const currentSelection = rootGetters['selectionConfig/selectionConfigCurrent']
      if (currentSelection) {
        return currentSelection.numberOfSlices
      } else {
        return null
      }
    },
    configThickness(state, getters, rootState, rootGetters) {
      // This should always come from the primary/proposed config
      // return rootGetters['selectionConfig/selectionConfigProposed'].thickness
      const currentSelection = rootGetters['selectionConfig/selectionConfigCurrent']
      if (currentSelection) {
        return currentSelection.thickness
      } else {
        return null
      }
    },
    configSpacing(state, getters, rootState, rootGetters) {
      // This should always come from the primary/proposed config
      // return rootGetters['selectionConfig/selectionConfigProposed'].spacing
      const currentSelection = rootGetters['selectionConfig/selectionConfigCurrent']
      if (currentSelection) {
        return currentSelection.spacing
      } else {
        return null
      }
    },
  },
}

export default stackService
