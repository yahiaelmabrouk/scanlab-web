import * as AMI from '@froilan-miranda/ami.js'
import _ from 'lodash'
import log from 'loglevel'
import Vue from 'vue'
import config from '../config'
import EventBus from '../lib/event-bus'
import { apiGet } from '../util/api'
import { getErrorMessage } from '../lib/error-util'
import { classifyFilesByHeader } from '../util/dicomHeaderClassifier'
import { stopMriLoading, startMriLoop } from '../lib/mri-audio'

// See `branchingRenamer.txt` for how to upload the Dicom files with branching. These instructions are written for non-developers to accompany the .bat in the same folder
// The first 3 params are for Resolution Lab, to declare the voxel size that this file is in
// The 4th param is Optional, and is the Internal Dicom BranchID (can be any alphanumeric string, unique per branch)
// Some DicomFileSets contain different HD / LD files that should be conditionally used for scans(aka. reformats). Question definitions can specify which Dicom BranchID to use for the reformat when answering that question
// The 5th param is a description and is not looked at
// './HD_1-2_1-2_1-2_.nii?params' => ['1-2', '1-2', '1-2', undefined, '']
// './HD_1-2_1-2_1-2_desc.nii?params' => ['1-2', '1-2', '1-2', undefined, 'desc']
// './HD_1-2_1-2_1-2_BreathIn_desc.nii?params' => ['1-2', '1-2', '1-2', '_BreathIn', 'desc']
// './HD_1-0_1-0_1-0_AXSPACE_42338644?params' => ['1-0', '1-0', '1-0', '_AXSPACE', '42338644']
// eslint-disable-next-line no-useless-escape
const hdFileRegex = /^.+\/HD_([0-9\-\.]+)_([0-9\-\.]+)_([0-9\-\.]+)(_[a-zA-Z0-9]+)?_(\S*).*$/
const hdPrefix = '/HD_'
// eslint-disable-next-line no-useless-escape
const localizerVolumeFileRegex = /^.+\/LD_([0-9\-\.]+)_([0-9\-\.]+)_([0-9\-\.]+)(_[a-zA-Z0-9]+)?_(\S*).*$/
const localizerVolumePrefix = '/LD_'

// Bump this whenever the classifier logic changes, so stale sessionStorage entries
// from previous deploys are ignored instead of being trusted.
const DICOM_CLASSIFY_CACHE_VERSION = 'v2'
const dicomClassifyCacheKey = (id) => `dicom_classify_${DICOM_CLASSIFY_CACHE_VERSION}_${id}`

function getFileUrlsDefaultAdi() {
  let t2 = [
    '36444280',
    '36444294',
    '36444308',
    '36444322',
    '36444336',
    '36444350',
    '36444364',
    '36444378',
    '36444392',
    '36444406',
    '36748256',
    '36444434',
    '36444448',
    '36444462',
    '36444476',
    '36444490',
    '36444504',
    '36444518',
    '36444532',
    '36746856',
    '36746870',
    '36746884',
    '36746898',
    '36746912',
    '36746926',
    '36746940',
    '36746954',
    '36746968',
    '36746982',
    '36746996',
    '36747010',
    '36747024',
    '36748200',
    '36748214',
    '36748228',
    '36748270',
    '36748284',
    '36748298',
    '36748312',
    '36748326',
    '36748340',
    '36748354',
    '36748368',
    '36748382',
    '36748396',
    '36748410',
    '36748424',
    '36748438',
    '36748452',
    '36748466',
    '36748480',
    '36748494',
    '36748508',
    '36748522',
    '36748242',
  ]
  return t2.map(function (v) {
    return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + v
  })
}

function seriesIsLocalizer(series) {
  let seriesDescription = _.toLower(series.seriesDescription)
  // Starts with 'loc' or 'localizer'
  // this seems to be the convention I've run into with the presumably user entered description
  // Like 'localizer_sag+cor+tra'
  if (_.startsWith(seriesDescription, 'localizer') || _.startsWith(seriesDescription, 'loc ')) {
    return true
  }

  // Contains 'loc' or 'localizer' as a token when splitting by space
  // Like 'REG LOC (NON BREATH HOLD)' / 'BREATHOLD LOCALIZER' for ABDOMEN
  let seriesDescriptionSplit = _.split(seriesDescription, ' ')
  if (_.includes(seriesDescriptionSplit, 'loc') || _.includes(seriesDescriptionSplit, 'localizer')) {
    return true
  }

  let framesCount = _.sumBy(series.stack, function (stack) {
    return stack.frame.length
  })
  if (framesCount === 1) {
    // If there is only one frame, it's probably a Localizer
    return true
  }

  return false
}

const dicomService = {
  namespaced: true,
  state: {
    loadedDicomFileSets: [],
    stack: null,
    isLoaded: false,
    hasLoadedPreviously: false, // Has a DICOM ever been loaded into memory since the last page refresh?
    progressFetch: 0,
    progressParse: 0,
    progressTotal: 0,
    stackByStackIdent: null,
    dicomFileSet: null,
    dicomCount: 0,
    dicomMap: {},
    isManageDicomBox: false,
    isSyncDicomBox: true,
    allowPageReloadWithoutConfirmation: false,
    deferredStackIdentByUrlProperties: {}, // For Deferred loading of Dicom files, so we don't keep reloading the same stack/ file urls that we've already deferred loaded before this DicomFileSet
    classifiedLocalizerUrlsByFileSetId: {}, // Cache of header classification results per DicomFileSet, so Range requests only happen once
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  actions: {
    setIsManageDicomBox({ commit }, payload) {
      commit('set', { isManageDicomBox: payload })
    },
    setIsSyncDicomBox({ commit }, payload) {
      commit('set', { isSyncDicomBox: payload })
    },
    async loadFiles(
      { state, dispatch, commit, rootState },
      { urls, type, baseStackIdent, isCruncherService, skipAudioControl }
    ) {
      if (_.size(urls) === 0) {
        return
      }
      let progressByFile = {}
      const crunchProgress = function () {
        if (state.dicomFileSet === null) {
          /**
           * page has been unloaded, so we don't need to continue updating.
           * This typically happens when the user navigates away from
           * the page and/or abandons an exam while still loading.
           */
          console.warn('DICOM loader interrupted')
          return
        }
        const totalDicoms = state.dicomFileSet.linkedDicoms ? _.size(state.dicomFileSet.linkedDicoms) : 1
        // sum of all the fetch ratios (0...1 per file), so goes smoothly from 0 to NumberOfFiles
        let fetchTotal = _.sumBy(_.map(progressByFile), 'fetch') || 0
        let progressFetch = _.round((fetchTotal * 100) / urls.length + state.dicomCount * 100, 0)

        let parseTotal = _.sumBy(_.map(progressByFile), 'parse') || 0
        let progressParse = _.round((parseTotal * 100) / urls.length + state.dicomCount * 100, 0)

        let progressTotal = _.round((progressFetch + progressParse) / (totalDicoms * 2), 0)

        // Don't shown that we're at 100%, since that implies to user that we shouldn't be seeing a loading screen
        progressTotal = Math.min(progressTotal, 99)
        commit('set', { progressFetch, progressParse, progressTotal })
      }
      let isLocalizerBySeriesIndex = null
      let serieses = null
      const loadedDicomFileSet = _.find(
        state.loadedDicomFileSets,
        (el) => el.urls.length == urls.length && !_.some(urls, (url) => !el.urls.find((o) => o == url))
      )
      if (loadedDicomFileSet) {
        commit('set', { progressFetch: 100, progressParse: 100, progressTotal: 100 })
        serieses = loadedDicomFileSet.serieses
        isLocalizerBySeriesIndex = _.map(serieses, function (series) {
          // If this is a denoted Localizer for Contrast Lab, or if the seriesDescription sounds like a Localizer (usually starts with LOC)
          return seriesIsLocalizer(series)
        })
      } else {
        let retries = 0
        let maxRetries = 10000 // Keep retrying until successful
        let delay = 2000 // Initial delay in milliseconds
        let success = false

        while (!success && retries < maxRetries) {
          let loader = null
          try {
            loader = new AMI.VolumeLoader()
            loader.on('fetch-progress', ({ file, loaded, total }) => {
              _.set(progressByFile, [file, 'fetch'], loaded / total)
              crunchProgress()
            })
            loader.on('parsing', ({ file, parsed, total }) => {
              _.set(progressByFile, [file, 'parse'], parsed / total)
              crunchProgress()
            })

            loader.on('error', (error) => {
              console.error('Error during loading:', error)
            })

            // For cruncher service, intercept XMLHttpRequest to capture x-signal-average header
            if (isCruncherService && urls.length === 1) {
              const originalXHROpen = XMLHttpRequest.prototype.open
              const originalXHRSend = XMLHttpRequest.prototype.send
              let headersCaptured = false

              XMLHttpRequest.prototype.open = function (method, url, ...args) {
                this._url = url
                // Strip query params from blob URLs so the browser can resolve them
                // (the query is only there as a hint for AMI's parser selection)
                const fetchUrl = url.startsWith('blob:') ? url.split('?')[0] : url
                return originalXHROpen.apply(this, [method, fetchUrl, ...args])
              }

              XMLHttpRequest.prototype.send = function (...args) {
                const xhr = this
                if (xhr._url && (xhr._url.includes('/contrast/') || xhr._url.includes('/contrast-compact/'))) {
                  xhr.addEventListener('load', function () {
                    if (!headersCaptured) {
                      headersCaptured = true
                      try {
                        const signalAverageHeader = xhr.getResponseHeader('x-signal-average')
                        const signalAverageHalfTRHeader = xhr.getResponseHeader('x-signal-average-half-tr')

                        if (signalAverageHeader && signalAverageHalfTRHeader) {
                          const signalAverage = Math.round(parseFloat(signalAverageHeader) * 100) / 100
                          const signalAverageHalfTR = Math.round(parseFloat(signalAverageHalfTRHeader) * 100) / 100
                          const isDiffSequence = xhr._url?.includes('/diff.')

                          if (isDiffSequence) {
                            const currentIdent = rootState.selectionConfig.selectionConfigCurrentIdent
                            const currentConfig = rootState.selectionConfig.selectionConfigsByIdent[currentIdent]
                            const currentBSignalAverages = [...(currentConfig?.bSignalAverages || [])]

                            currentBSignalAverages.push({ signalAverage, signalAverageHalfTR })
                            dispatch(
                              'selectionConfig/setBSignalAverages',
                              { bSignalAverages: currentBSignalAverages },
                              { root: true }
                            )
                            dispatch(
                              'selectionConfig/setSignalAverage',
                              { signalAverage: currentBSignalAverages[0] },
                              { root: true }
                            )
                          } else {
                            dispatch('selectionConfig/setSignalAverage', { signalAverage }, { root: true })
                            dispatch('selectionConfig/setSignalAverageHalfTR', { signalAverageHalfTR }, { root: true })
                            dispatch('selectionConfig/setBSignalAverages', { bSignalAverages: [] }, { root: true })
                          }

                          // Trigger SNR calculation
                          setTimeout(() => {
                            EventBus.$emit(isDiffSequence ? 'calculate-bsnrs-after-scan' : 'calculate-snr-after-scan')
                          }, 100)
                        } else {
                          console.warn('Missing signal headers from scan response')
                        }
                      } catch (error) {
                        console.warn(
                          'Cannot access x-signal-average header. Server needs to include it in Access-Control-Expose-Headers'
                        )
                      }
                    }
                  })
                }
                return originalXHRSend.apply(this, args)
              }

              try {
                await loader.load(urls)
              } finally {
                // Restore original methods
                XMLHttpRequest.prototype.open = originalXHROpen
                XMLHttpRequest.prototype.send = originalXHRSend
              }
            } else {
              await loader.load(urls)
            }

            // if (retries < 2) loader.data = undefined

            // Check if loader has valid data
            if (loader.data && loader.data.length > 0) {
              // Stop the animation
              EventBus.$emit('HIDE_LOADING')

              // Process the data
              serieses = loader.data[0].mergeSeries(loader.data)
              serieses = _.orderBy(serieses, '_seriesInstanceUID')

              if (!_.isNil(urls)) {
                commit('set', {
                  loadedDicomFileSets: [...state.loadedDicomFileSets, { urls, serieses }],
                })
              }

              isLocalizerBySeriesIndex = _.map(serieses, (series) => seriesIsLocalizer(series))
              success = true

              if (loader) {
                loader.free()
                loader = null
              }
              // return { serieses, isLocalizerBySeriesIndex }; // Return the loaded data
            } else {
              console.error('Error in Loader loading')

              if (loader) {
                loader.free()
                loader = null
              }

              // Start the 3-dots animation
              EventBus.$emit('SHOW_LOADING', { message: 'Reloading Loader' })

              const errorMessage = getErrorMessage(
                { message: 'Network Error' },
                '',
                '. Please check your network connection.'
              ) // Get meaningful error message
              Vue.notify({ type: 'error', text: errorMessage })

              console.error(`Retry ${retries + 1} failed:`)

              // Increment retries and increase delay (exponential backoff)
              retries++
              await new Promise((resolve) => setTimeout(resolve, delay))
              delay = Math.min(8000, delay * 2) // Max delay: 8 seconds
            }
          } catch (error) {
            if (loader) {
              loader.free()
              loader = null
            }

            // Start the 3-dots animation
            EventBus.$emit('SHOW_LOADING', { message: 'Reloading Loader' })

            const errorMessage = getErrorMessage(error, '', '. Please check your network connection.') // Get meaningful error message
            Vue.notify({ type: 'error', text: errorMessage })

            console.error(`Retry ${retries + 1} failed:`, error)

            // Increment retries and increase delay (exponential backoff)
            retries++
            await new Promise((resolve) => setTimeout(resolve, delay))
            delay = Math.min(8000, delay * 2) // Max delay: 8 seconds
          }
        }
      }

      let isLocalizerVolume = type === 'LOC' // || (type !== 'HD' && type !== 'CONTRAST' && urls.length === 1)
      let isLocalizerByMinStackLength = true

      let minFrameLength = 0
      let isThreeFrameLocalizer = true
      // If there is no type (so this is not Contrast Lab), we should have a Localizer now, but if we don't try to determine further which series is the localizer
      if (!isLocalizerVolume && !_.some(isLocalizerBySeriesIndex)) {
        // A localizer should ideally have 3 stacks, one per direction
        let localizerSeries = _.find(serieses, function (series) {
          return series.stack.length === 3
        })
        minFrameLength = localizerSeries ? 3 : 0
        if (!localizerSeries) {
          // localizer is the series with the least amount of pictures/frames (in series.stack[].frames[])
          localizerSeries = _.minBy(serieses, function (series) {
            return _.sumBy(series.stack, function (stack) {
              return stack.frame.length
            })
          })

          minFrameLength = _.min(_.flatMap(serieses, (series) => _.map(series.stack, (stack) => stack.frame.length)))
          isThreeFrameLocalizer = false
        }

        if (localizerSeries) {
          let localizerSeriesIndex = _.indexOf(serieses, localizerSeries)
          isLocalizerBySeriesIndex[localizerSeriesIndex] = true
        } else {
          console.warn('Could not determine which series is the Localizer')
        }

        isLocalizerByMinStackLength = false
      }
      let stackByStackIdent = state.stackByStackIdent || {}
      const loadedStacks = []

      let createdLocalizerConfigs = false
      log.info('loaded serieses', serieses.length)
      _.each(serieses, function (series, seriesIndex) {
        let isLocalizer =
          !isLocalizerVolume &&
          isLocalizerBySeriesIndex[seriesIndex] &&
          type !== 'HD' &&
          type !== 'CONTRAST' &&
          type !== 'RESOLUTION'
        log.info('seriesDescription', series.seriesDescription, isLocalizer, createdLocalizerConfigs)
        log.info(
          ' has stacks:',
          series.stack.length,
          ',total frames:',
          _.sumBy(series.stack, (stack) => stack.frame.length)
        )

        // Sort the stacks by instance number to fit the order of the stack ident
        series.stack = _.orderBy(series.stack, (el) => _.min(_.map(el.frame, 'instanceNumber')), 'asc')
        _.each(series.stack, function (stack, stackIndex) {
          let stackIdent = `${baseStackIdent}_${seriesIndex}_${stackIndex}`
          let renameIdent = `${baseStackIdent}_${series.seriesDescription}_${stack.zCosine.x}_${stack.zCosine.y}_${stack.zCosine.z}`
          loadedStacks.push(stackIdent)
          stackByStackIdent[stackIdent] = stack
          if (!stack.prepared) {
            stack.frame = _.sortBy(stack.frame, ['instanceNumber'])
          }
          stack.type = type

          // Prepare the stacks ahead of time, mostly to get the bounding box but also because why not
          // Check prepared to prevent reprepare if stack is prepared, prepared two times make the model black
          if (!stack.prepared) {
            stack.prepare()
          }

          // For localizer volumes, create an extra stack config for each direction
          if (!isLocalizer && isLocalizerVolume) {
            if (!createdLocalizerConfigs) {
              // Not working?
              dispatch('stackService/createLocalizersFromLocalizerVolume', { stackIdent }, { root: true })
              // prevent the creation of too many localizers
              createdLocalizerConfigs = true
            }
          } else if (type !== 'CONTRAST' && type !== 'RESOLUTION' && type !== 'BASIC') {
            // Skip addStackConfigFromFrames for cruncher types — their scan result
            // entry is created separately via addStackConfig in the mergeStackConfig flow.
            // The stack data is still available in stackByStackIdent for rendering.
            const isStackIsLocalizer =
              isLocalizer ||
              (!isLocalizerByMinStackLength &&
                !isThreeFrameLocalizer &&
                stack.frame.length == minFrameLength &&
                !config.isCTLab &&
                type !== 'HD')
            dispatch(
              'stackService/addStackConfigFromFrames',
              {
                stack,
                frames: stack.frame,
                name: series.seriesDescription,
                stackIdent,
                renameIdent,
                isLocalizer: isStackIsLocalizer,
              },
              { root: true }
            )
          }
        })
      })
      commit('set', { stackByStackIdent })

      if (isCruncherService && !skipAudioControl) {
        stopMriLoading()
        if (!config.isCTLab && rootState.stackService.isOnMriView && !rootState.questionService.testResult) {
          startMriLoop()
        }
      }

      return loadedStacks
    },

    // Load a stack based on getting the best matching Nii file url based on its voxel size
    // Used by Resolution Lab scans to use seperate Dicom like `HD_1-2_1-2_1-2_.nii`, and for any Dicom that has extra localizer Nii files that look like `LD_1-6_1-6_1-6_.nii`
    async loadStackFromDeferredDicomUrls({ state, dispatch, getters }, { stackConfig, selectedHdBranchId }) {
      const { phaseVoxelSize } = stackConfig
      let { deferredStackIdentByUrlProperties } = state
      let fileUrls = _.map(state.dicomFileSet.uploads, 'url')

      // Is there branching in this DicomFileSet?
      if (getters.curHdBranchId) {
        // hdBranchId is for clicking Scan for an HD reformat
        // ldBranchId is for clicking Add Localizer for an LD reformat
        // There must be an hdBranchId (if this is branching - but there might not be an ldBranchId), so default to using hd
        let branchId = getters.curHdBranchId
        let type = 'HD'

        // Only use it for dicom preview
        if (selectedHdBranchId) {
          branchId = selectedHdBranchId

          // If we want a new localizer and we have a ldBranchId, use that instead
        } else if (stackConfig.isLocalizer && getters.curLdBranchId) {
          type = 'LD'
          branchId = getters.curLdBranchId
        }
        // console.log('loadStackFromDeferredDicomUrls', branchId, stackConfig)

        fileUrls = getters.dicomHdUrlsByBranchId[branchId]
        if (stackConfig.isLocalizer && getters.dicomLdUrlsByBranchId[branchId]) {
          fileUrls = getters.dicomLdUrlsByBranchId[branchId]
        }

        let baseStackIdent = `HD_RECONSTRUCTION_${type}_${0}~${0}~${0}~${branchId}`
        // Cache the stackIdent, just so we don't keep loading additional Stacks for the same Dicom files that are already in memory
        if (!deferredStackIdentByUrlProperties[baseStackIdent]) {
          // We want to store the promise immediately without awaiting it, because when creating a deferred localizer, this code is called 3 times at once, and we'd like to just load the same files once
          let loadedStacksPromise = dispatch('loadFiles', { urls: fileUrls, type: 'HD', baseStackIdent })
          deferredStackIdentByUrlProperties[baseStackIdent] = loadedStacksPromise
        }
        const loadedStackIdent = (await deferredStackIdentByUrlProperties[baseStackIdent])[0]
        return loadedStackIdent
      }

      // Resolution Lab - determine which single Nii file to load, depending on the voxel size (code below doesn't yet support multiple dicom files for a single stack - so have to be converted to Nii before uploading)

      // Out of just the LD_/HD_ deferred files
      fileUrls = fileUrls.filter((url) => url.includes(hdPrefix) || url.includes(localizerVolumePrefix))
      if (stackConfig.isLocalizer && getters.hasDeferredLocalizerUrls) {
        // We want LD, and we have those, so filter to just them
        fileUrls = fileUrls.filter((url) => url.includes(localizerVolumePrefix))
      } else if (!stackConfig.isLocalizer && getters.hasDeferredLocalizerUrls) {
        // We want HD, and there are LD, so remove the LD
        fileUrls = fileUrls.filter((url) => !url.includes(localizerVolumePrefix))
      }

      const phaseVoxels = []
      for (const url of fileUrls) {
        let isLocalizer = url.includes(localizerVolumePrefix)
        const match = url.replace(/-/g, '.').match(isLocalizer ? localizerVolumeFileRegex : hdFileRegex)
        if (match) {
          phaseVoxels.push({
            url,
            isLocalizer,
            size: { phase: parseFloat(match[1]), frequency: parseFloat(match[2]), slice: parseFloat(match[3]) },
          })
        }
      }

      const selectedReconstruction = !stackConfig.isLocalizer
        ? phaseVoxels.reduce(function (prev, curr) {
            return Math.abs(curr.size.phase - phaseVoxelSize) < Math.abs(prev.size.phase - phaseVoxelSize) ? curr : prev
          })
        : _.maxBy(phaseVoxels, (v) => v.size.phase)

      const url = selectedReconstruction.url
      let baseStackIdent = `HD_RECONSTRUCTION_${selectedReconstruction.isLocalizer ? 'LD' : 'HD'}_${
        selectedReconstruction.size.phase
      }~${selectedReconstruction.size.frequency}~${selectedReconstruction.size.slice}`
      // Cache the stackIdent, just so we don't keep loading additional Stacks for the same Dicom files that are already in memory
      if (!deferredStackIdentByUrlProperties[baseStackIdent]) {
        let loadedStacksPromise = dispatch('loadFiles', { urls: [url], type: 'HD', baseStackIdent })
        // While it is possible for loadFiles to generate multiple stacks,
        // The use case here should not (a single .nii with a single stack should be loaded)
        deferredStackIdentByUrlProperties[baseStackIdent] = loadedStacksPromise
      }
      const loadedResStackIdent = (await deferredStackIdentByUrlProperties[baseStackIdent])[0]
      return loadedResStackIdent
    },
    /**
     * Uses given stack config to create a modified version of the original stacks
     */
    async createCompositeStackFromStackConfig({ state, dispatch }, { stackConfig }) {
      const params = new URLSearchParams()
      for (const type in state.dicomMap) {
        params.append(type, state.dicomMap[type])
      }

      // When swapPhase is true, vectors and dimensions have been modified for UI display
      // Backend needs original unswapped values, so undo the changes
      const swapPhase = stackConfig.contrastParameters?.swapPhase || false

      // Undo direction vector rotation (90° rotation includes sign flip)
      const xDirToSend = swapPhase ? stackConfig.yDirection3 : stackConfig.xDirection3
      const yDirToSend = swapPhase
        ? { x: -stackConfig.xDirection3.x, y: -stackConfig.xDirection3.y, z: -stackConfig.xDirection3.z }
        : stackConfig.yDirection3

      // Undo dimension swap
      const dimXToSend = swapPhase ? stackConfig.dimensions3.y : stackConfig.dimensions3.x
      const dimYToSend = swapPhase ? stackConfig.dimensions3.x : stackConfig.dimensions3.y

      const inputParamMap = {
        TE: stackConfig.contrastParameters.echoTime,
        TR: stackConfig.contrastParameters.repetitionTime,
        TI: stackConfig.contrastParameters.inversionTime,
        FA: stackConfig.contrastParameters.flipAngle,
        FS: stackConfig.contrastParameters.fatSuppression,
        ADC: stackConfig.contrastParameters.isADCMap,
        BVAL: stackConfig.contrastParameters.bValue,
        fieldStrength: stackConfig.contrastParameters.fieldStrength,
        SNRFactor: stackConfig.contrastParameters.noiseFactor,
        flatFactor: stackConfig.contrastParameters.flatFactor,
        falloffFactor: stackConfig.contrastParameters.falloffFactor,
        // Fast Spin Echo / Turbo Echo specific parameters
        echoSpacing: stackConfig.contrastParameters.echoSpacing,
        echoTrainLength: stackConfig.contrastParameters.echoTrainLength,
        enableTSEBlur: stackConfig.contrastParameters.enableTSEBlur,
        enableResolution: stackConfig.contrastParameters.enableResolution,
        enableCompactMode: stackConfig.contrastParameters.enableCompactMode,
        enableFovWrap: stackConfig.contrastParameters.enableFovWrap,
        // When compact mode is enabled, set debug_output to true
        debug_output: stackConfig.contrastParameters.enableCompactMode ? true : undefined,
        // Resolution processing parameters
        baseMatrix: stackConfig.contrastParameters.frequencyMatrix,
        phaseMatrix: stackConfig.contrastParameters.phaseMatrix,
        oversamplingPercent: stackConfig.contrastParameters.oversampling,
        phaseEncodingAxis: stackConfig.contrastParameters.phaseEncodingAxis,
        echoOrdering: stackConfig.contrastParameters.echoOrdering,
        // Slice selection parameters
        sliceSelection:
          stackConfig.contrastParameters.sliceSelection !== undefined
            ? stackConfig.contrastParameters.sliceSelection
            : true,
        centerX: stackConfig.center3.x,
        centerY: stackConfig.center3.y,
        centerZ: stackConfig.center3.z,
        dimensionsX: dimXToSend,
        dimensionsY: dimYToSend,
        dimensionsZ: stackConfig.dimensions3.z,
        xDirectionX: xDirToSend.x,
        xDirectionY: xDirToSend.y,
        xDirectionZ: xDirToSend.z,
        yDirectionX: yDirToSend.x,
        yDirectionY: yDirToSend.y,
        yDirectionZ: yDirToSend.z,
        zDirectionX: stackConfig.zDirection3.x,
        zDirectionY: stackConfig.zDirection3.y,
        zDirectionZ: stackConfig.zDirection3.z,
        // Slice generation parameters
        numberOfSlices: stackConfig.numberOfSlices,
        thickness: stackConfig.thickness,
        spacing: stackConfig.spacing,
      }

      for (const param in inputParamMap) {
        params.append(param, inputParamMap[param])
      }

      let urlSequence = stackConfig.sequenceType.toLowerCase()
      // turbo echo should be treated as spin echo
      // urlSequence = urlSequence === 'te' ? 'se' : urlSequence

      // Handle inversion recovery sequences
      if (stackConfig.contrastParameters.inversionRecovery) {
        if (urlSequence === 'te') {
          // Turbo Echo with Inversion Recovery
          urlSequence = 'teir'
        } else {
          // Standard Inversion Recovery (for SE, GRE, etc.)
          urlSequence = 'ir'
        }
      }

      // Choose endpoint based on compact mode
      const endpoint = stackConfig.contrastParameters.enableCompactMode ? 'contrast-compact' : 'contrast'
      const url = `${config.cruncherRoot}${endpoint}/${urlSequence}.nii.gz?${params.toString()}`

      // count down with a static 30 seconds
      // contrast lab takes a lot of extra time
      let interval = null
      if (!stackConfig.skipGlobalLoading) {
        let secondCounter = 30
        interval = setInterval(function () {
          EventBus.$emit('LOADING', { name: 'ADD_STACK', subtitle: `${secondCounter} seconds remaining` })
          secondCounter--
          if (secondCounter < 0) {
            EventBus.$emit('LOADING', { name: 'ADD_STACK', subtitle: '' })
            clearInterval(interval)
          }
        }, 1000)
      }

      const loadedStacks = await dispatch('loadFiles', {
        urls: [url],
        type: 'CONTRAST',
        baseStackIdent: `${_.uniqueId()}_CONTRAST`,
        isCruncherService: true, // Flag to indicate this is from cruncher service
        skipAudioControl: stackConfig.skipGlobalLoading,
      })
      clearInterval(interval)

      // While it is possible for loadFiles to generate multiple stacks,
      // The use case here should not (a single .nii with a single stack should be loaded)
      return loadedStacks[0]
    },

    async createResolutionStackFromCruncher({ getters, dispatch }, { stackConfig }) {
      const resParams = stackConfig.resolutionParameters

      // Get the highest-resolution HD file URL and extract S3 path
      const hdUrl = getters.highestResolutionHdUrl
      if (!hdUrl) {
        console.error('No HD URL found for resolution cruncher')
        if (!stackConfig.skipGlobalLoading) {
          EventBus.$emit('LOADING', { name: 'ADD_STACK', isLoading: false })
        }
        return null
      }
      const source = new URL(hdUrl).pathname.substring(1)

      // swapPhase un-swap logic (same as createCompositeStackFromStackConfig)
      const swapPhase = resParams.swapPhase || false
      const xDirToSend = swapPhase ? stackConfig.yDirection3 : stackConfig.xDirection3
      const yDirToSend = swapPhase
        ? { x: -stackConfig.xDirection3.x, y: -stackConfig.xDirection3.y, z: -stackConfig.xDirection3.z }
        : stackConfig.yDirection3
      const dimXToSend = swapPhase ? stackConfig.dimensions3.y : stackConfig.dimensions3.x
      const dimYToSend = swapPhase ? stackConfig.dimensions3.x : stackConfig.dimensions3.y

      const requestBody = {
        source,
        sliceSelection: {
          centerX: stackConfig.center3.x,
          centerY: stackConfig.center3.y,
          centerZ: stackConfig.center3.z,
          dimensionsX: dimXToSend,
          dimensionsY: dimYToSend,
          dimensionsZ: stackConfig.dimensions3.z,
          xDirectionX: xDirToSend.x,
          xDirectionY: xDirToSend.y,
          xDirectionZ: xDirToSend.z,
          yDirectionX: yDirToSend.x,
          yDirectionY: yDirToSend.y,
          yDirectionZ: yDirToSend.z,
          zDirectionX: stackConfig.zDirection3.x,
          zDirectionY: stackConfig.zDirection3.y,
          zDirectionZ: stackConfig.zDirection3.z,
          numberOfSlices: stackConfig.numberOfSlices,
          thickness: stackConfig.thickness,
          spacing: stackConfig.spacing,
        },
        resolution: {
          enabled: stackConfig.contrastParameters.enableResolution,
          baseMatrix: resParams.frequencyMatrix,
          phaseMatrix: resParams.phaseMatrix,
          oversamplingPercent: resParams.oversampling,
          phaseEncodingAxis: resParams.phaseEncodingAxis,
        },
        fovWrap: {
          enabled: resParams.enableFovWrap,
          baseMatrix: resParams.frequencyMatrix,
          phaseMatrix: resParams.phaseMatrix,
          oversamplingPercent: resParams.oversampling,
          phaseEncodingAxis: resParams.phaseEncodingAxis,
        },
      }

      const endpoint = 'resolution'
      const url = `${config.cruncherRoot}${endpoint}/`

      console.log('=== Resolution Cruncher Request ===')
      console.log('POST URL:', url)
      console.log('Request Body:', JSON.stringify(requestBody, null, 2))
      console.log('==================================')

      let interval = null
      if (!stackConfig.skipGlobalLoading) {
        let secondCounter = 15
        interval = setInterval(function () {
          EventBus.$emit('LOADING', { name: 'ADD_STACK', subtitle: `${secondCounter} seconds remaining` })
          secondCounter--
          if (secondCounter < 0) {
            EventBus.$emit('LOADING', { name: 'ADD_STACK', subtitle: '' })
            clearInterval(interval)
          }
        }, 1000)
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
        clearInterval(interval)

        if (!response.ok) {
          console.error('Resolution cruncher request failed:', response.status)
          if (!stackConfig.skipGlobalLoading) {
            EventBus.$emit('LOADING', { name: 'ADD_STACK', isLoading: false })
          }
          return null
        }

        // Convert binary response to blob URL for AMI loader
        // Append ?filename=resolution.nii so AMI's parseUrl selects the NIfTI parser
        // (the query param is stripped from the blob URL before XHR fetch in loadFiles)
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)

        const loadedStacks = await dispatch('loadFiles', {
          urls: [`${blobUrl}?filename=resolution.nii.gz`],
          type: 'RESOLUTION',
          baseStackIdent: `${_.uniqueId()}_RESOLUTION`,
          isCruncherService: true,
          skipAudioControl: stackConfig.skipGlobalLoading,
        })

        URL.revokeObjectURL(blobUrl)
        return loadedStacks[0]
      } catch (err) {
        clearInterval(interval)
        console.error('Resolution cruncher request failed:', err)
        if (!stackConfig.skipGlobalLoading) {
          EventBus.$emit('LOADING', { name: 'ADD_STACK', isLoading: false })
        }
        return null
      }
    },

    async createBasicStackFromCruncher({ getters, dispatch }, { stackConfig }) {
      const basicLabParams = stackConfig.basicLabParameters

      // Get source: try all HD URLs for the current branch first, then fall back to .IMA file paths
      let source = null
      const branchId = getters.curHdBranchId
      const hdUrls = branchId ? getters.dicomHdUrlsByBranchId[branchId] : null
      if (hdUrls && hdUrls.length > 0) {
        source = hdUrls.map((url) => new URL(url).pathname.substring(1))
      } else {
        source = getters.primaryDicomSourcePaths
      }

      if (!source || source.length === 0) {
        console.error('No source found for basic lab cruncher')
        if (!stackConfig.skipGlobalLoading) {
          EventBus.$emit('LOADING', { name: 'ADD_STACK', isLoading: false })
        }
        return null
      }

      // swapPhase un-swap logic (same as resolution lab)
      const swapPhase = basicLabParams.swapPhase || false
      const xDirToSend = swapPhase ? stackConfig.yDirection3 : stackConfig.xDirection3
      const yDirToSend = swapPhase
        ? { x: -stackConfig.xDirection3.x, y: -stackConfig.xDirection3.y, z: -stackConfig.xDirection3.z }
        : stackConfig.yDirection3
      const dimXToSend = swapPhase ? stackConfig.dimensions3.y : stackConfig.dimensions3.x
      const dimYToSend = swapPhase ? stackConfig.dimensions3.x : stackConfig.dimensions3.y

      const requestBody = {
        source,
        sliceSelection: {
          centerX: stackConfig.center3.x,
          centerY: stackConfig.center3.y,
          centerZ: stackConfig.center3.z,
          dimensionsX: dimXToSend,
          dimensionsY: dimYToSend,
          dimensionsZ: stackConfig.dimensions3.z,
          xDirectionX: xDirToSend.x,
          xDirectionY: xDirToSend.y,
          xDirectionZ: xDirToSend.z,
          yDirectionX: yDirToSend.x,
          yDirectionY: yDirToSend.y,
          yDirectionZ: yDirToSend.z,
          zDirectionX: stackConfig.zDirection3.x,
          zDirectionY: stackConfig.zDirection3.y,
          zDirectionZ: stackConfig.zDirection3.z,
          numberOfSlices: stackConfig.numberOfSlices,
          thickness: stackConfig.thickness,
          spacing: stackConfig.spacing,
        },
      }

      // Only include fovWrap when enabled
      if (basicLabParams.enableFovWrap) {
        requestBody.fovWrap = {
          enabled: true,
          baseMatrix: basicLabParams.frequencyMatrix,
          phaseMatrix: basicLabParams.phaseMatrix,
          oversamplingPercent: basicLabParams.oversampling,
          phaseEncodingAxis: basicLabParams.phaseEncodingAxis,
        }
      }

      if (basicLabParams.enableBitDepth8) {
        requestBody.bitDepth = 8
      }

      const url = `${config.cruncherRoot}basic-lab/`

      console.log('=== Basic Lab Cruncher Request ===')
      console.log('POST URL:', url)
      console.log('Request Body:', JSON.stringify(requestBody, null, 2))
      console.log('==================================')

      let interval = null
      if (!stackConfig.skipGlobalLoading) {
        let secondCounter = 15
        interval = setInterval(function () {
          EventBus.$emit('LOADING', { name: 'ADD_STACK', subtitle: `${secondCounter} seconds remaining` })
          secondCounter--
          if (secondCounter < 0) {
            EventBus.$emit('LOADING', { name: 'ADD_STACK', subtitle: '' })
            clearInterval(interval)
          }
        }, 1000)
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
        clearInterval(interval)

        if (!response.ok) {
          console.error('Basic lab cruncher request failed:', response.status)
          if (!stackConfig.skipGlobalLoading) {
            EventBus.$emit('LOADING', { name: 'ADD_STACK', isLoading: false })
          }
          return null
        }

        // Convert binary response to blob URL for AMI loader
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)

        const loadedStacks = await dispatch('loadFiles', {
          urls: [`${blobUrl}?filename=basic-lab.nii.gz`],
          type: 'BASIC',
          baseStackIdent: `${_.uniqueId()}_BASIC`,
          isCruncherService: true,
          skipAudioControl: stackConfig.skipGlobalLoading,
        })

        URL.revokeObjectURL(blobUrl)
        return loadedStacks[0]
      } catch (err) {
        clearInterval(interval)
        console.error('Basic lab cruncher request failed:', err)
        if (!stackConfig.skipGlobalLoading) {
          EventBus.$emit('LOADING', { name: 'ADD_STACK', isLoading: false })
        }
        return null
      }
    },

    async fetchSignalAverageOnly({ state }, { selectionConfig }) {
      const phaseEncodingAxis = selectionConfig.swapPhase ? 1 : 0

      // For DIFF sequences with multiple b-values, fetch signal average for each b-value
      if (selectionConfig.sequenceType === 'DIFF' && selectionConfig.bValues && selectionConfig.bValues.length > 0) {
        const signalAverages = []

        for (const bValue of selectionConfig.bValues) {
          const params = new URLSearchParams()

          // Add DICOM file paths
          for (const type in state.dicomMap) {
            params.append(type, state.dicomMap[type])
          }

          // Add scan parameters
          params.append('TE', selectionConfig.echoTime)
          params.append('TR', selectionConfig.repetitionTime)
          params.append('TI', selectionConfig.inversionTime)
          params.append('FA', selectionConfig.flipAngle)
          params.append('FS', selectionConfig.fatSuppression)
          params.append('fieldStrength', selectionConfig.fieldStrength)
          params.append('BVAL', bValue)
          params.append('SNRFactor', 1) // Default SNR factor

          // Add slice selection parameters
          params.append(
            'sliceSelection',
            selectionConfig.sliceSelection !== undefined ? selectionConfig.sliceSelection : true
          )
          params.append('centerX', selectionConfig.center3?.x || 0)
          params.append('centerY', selectionConfig.center3?.y || 0)
          params.append('centerZ', selectionConfig.center3?.z || 0)
          params.append('dimensionsX', selectionConfig.dimensions3?.x || 0)
          params.append('dimensionsY', selectionConfig.dimensions3?.y || 0)
          params.append('dimensionsZ', selectionConfig.dimensions3?.z || 0)
          params.append('xDirectionX', selectionConfig.xDirection3?.x || 1)
          params.append('xDirectionY', selectionConfig.xDirection3?.y || 0)
          params.append('xDirectionZ', selectionConfig.xDirection3?.z || 0)
          params.append('yDirectionX', selectionConfig.yDirection3?.x || 0)
          params.append('yDirectionY', selectionConfig.yDirection3?.y || 1)
          params.append('yDirectionZ', selectionConfig.yDirection3?.z || 0)
          params.append('zDirectionX', selectionConfig.zDirection3?.x || 0)
          params.append('zDirectionY', selectionConfig.zDirection3?.y || 0)
          params.append('zDirectionZ', selectionConfig.zDirection3?.z || 1)
          params.append('numberOfSlices', selectionConfig.numberOfSlices || 20)
          params.append('thickness', selectionConfig.thickness || 5)
          params.append('spacing', selectionConfig.spacing || 0)

          // Add Fast Spin Echo / Turbo Echo specific parameters
          params.append('echoSpacing', selectionConfig.echoSpacing || 10)
          params.append('echoTrainLength', selectionConfig.echoTrainLength || 3)
          params.append(
            'enableTSEBlur',
            selectionConfig.enableTSEBlur !== undefined ? selectionConfig.enableTSEBlur : false
          )
          params.append(
            'enableResolution',
            selectionConfig.enableResolution !== undefined ? selectionConfig.enableResolution : false
          )
          params.append(
            'enableFovWrap',
            selectionConfig.enableFovWrap !== undefined ? selectionConfig.enableFovWrap : false
          )
          // Resolution processing parameters
          params.append('baseMatrix', selectionConfig.frequencyMatrix || 320)
          params.append('phaseMatrix', selectionConfig.phaseMatrix || 256)
          params.append('oversamplingPercent', selectionConfig.oversampling || 0.1)
          params.append('phaseEncodingAxis', phaseEncodingAxis)
          params.append('echoOrdering', selectionConfig.echoOrdering || 'linear')

          const endpoint = selectionConfig.enableCompactMode ? 'signal-average-compact' : 'signal-average'
          const url = `${config.cruncherRoot}${endpoint}/diff?${params.toString()}`

          try {
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data = await response.json()
            const signalAverage = Math.round(data.signalAverage * 100) / 100
            const signalAverageHalfTR = Math.round(data.signalAverageHalfTR * 100) / 100
            signalAverages.push({ signalAverage, signalAverageHalfTR })
          } catch (error) {
            console.error(`Error fetching signal average for b-value ${bValue}:`, error)
            signalAverages.push(null)
          }
        }

        return signalAverages
      } else {
        // Original behavior for non-DIFF sequences
        const params = new URLSearchParams()

        // Add DICOM file paths
        for (const type in state.dicomMap) {
          params.append(type, state.dicomMap[type])
        }

        // Add scan parameters
        params.append('TE', selectionConfig.echoTime)
        params.append('TR', selectionConfig.repetitionTime)
        params.append('TI', selectionConfig.inversionTime)
        params.append('FA', selectionConfig.flipAngle)
        params.append('FS', selectionConfig.fatSuppression)
        params.append('fieldStrength', selectionConfig.fieldStrength)
        params.append('SNRFactor', 1) // Default SNR factor

        // Add slice selection parameters
        params.append(
          'sliceSelection',
          selectionConfig.sliceSelection !== undefined ? selectionConfig.sliceSelection : true
        )
        params.append('centerX', selectionConfig.center3?.x || 0)
        params.append('centerY', selectionConfig.center3?.y || 0)
        params.append('centerZ', selectionConfig.center3?.z || 0)
        params.append('dimensionsX', selectionConfig.dimensions3?.x || 0)
        params.append('dimensionsY', selectionConfig.dimensions3?.y || 0)
        params.append('dimensionsZ', selectionConfig.dimensions3?.z || 0)
        params.append('xDirectionX', selectionConfig.xDirection3?.x || 1)
        params.append('xDirectionY', selectionConfig.xDirection3?.y || 0)
        params.append('xDirectionZ', selectionConfig.xDirection3?.z || 0)
        params.append('yDirectionX', selectionConfig.yDirection3?.x || 0)
        params.append('yDirectionY', selectionConfig.yDirection3?.y || 1)
        params.append('yDirectionZ', selectionConfig.yDirection3?.z || 0)
        params.append('zDirectionX', selectionConfig.zDirection3?.x || 0)
        params.append('zDirectionY', selectionConfig.zDirection3?.y || 0)
        params.append('zDirectionZ', selectionConfig.zDirection3?.z || 1)
        params.append('numberOfSlices', selectionConfig.numberOfSlices || 20)
        params.append('thickness', selectionConfig.thickness || 5)
        params.append('spacing', selectionConfig.spacing || 0)

        // Add Fast Spin Echo / Turbo Echo specific parameters
        params.append('echoSpacing', selectionConfig.echoSpacing || 10)
        params.append('echoTrainLength', selectionConfig.echoTrainLength || 3)
        params.append(
          'enableTSEBlur',
          selectionConfig.enableTSEBlur !== undefined ? selectionConfig.enableTSEBlur : false
        )
        params.append(
          'enableResolution',
          selectionConfig.enableResolution !== undefined ? selectionConfig.enableResolution : false
        )
        params.append(
          'enableFovWrap',
          selectionConfig.enableFovWrap !== undefined ? selectionConfig.enableFovWrap : false
        )
        // Resolution processing parameters
        params.append('baseMatrix', selectionConfig.frequencyMatrix || 320)
        params.append('phaseMatrix', selectionConfig.phaseMatrix || 256)
        params.append('oversamplingPercent', selectionConfig.oversampling || 0.1)
        params.append('phaseEncodingAxis', phaseEncodingAxis)
        params.append('echoOrdering', selectionConfig.echoOrdering || 'linear')

        // Determine sequence type
        let urlSequence = selectionConfig.sequenceType.toLowerCase()

        // Handle inversion recovery sequences
        if (selectionConfig.inversionRecovery) {
          if (urlSequence === 'te') {
            // Turbo Echo with Inversion Recovery
            urlSequence = 'teir'
          } else {
            // Standard Inversion Recovery (for SE, GRE, etc.)
            urlSequence = 'ir'
          }
        }

        const endpoint = selectionConfig.enableCompactMode ? 'signal-average-compact' : 'signal-average'
        const url = `${config.cruncherRoot}${endpoint}/${urlSequence}?${params.toString()}`

        try {
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()
          const signalAverage = Math.round(data.signalAverage * 100) / 100
          const signalAverageHalfTR = Math.round(data.signalAverageHalfTR * 100) / 100
          return { signalAverage, signalAverageHalfTR }
        } catch (error) {
          console.error('Error fetching signal average:', error)
          throw error
        }
      }
    },

    async fetchAllDicoms({ rootState }) {
      const response = await apiGet('dicomFileSets', rootState.authentication.accessToken)
      return response.data
    },

    async loadDicomGroup({ state, commit, dispatch, rootState }, { dicomFileSetId, reset, skipClassification }) {
      if (reset) {
        await dispatch('reset', { isResetLoadedDicomFileSets: false })
      }

      commit('set', { dicomCount: 0 })

      if (state.isLoaded && _.get(state, 'dicomFileSet.id') !== dicomFileSetId) {
        // Hard Refreshing to make sure everything gets unloaded and ready for a different Dicom for now
        // CAREFUL: A different Dicom may be loaded during a TestRun for a CTQ after the MRI questions (and should not cause a refresh unless we support mid-test refreshes)
        commit('set', { allowPageReloadWithoutConfirmation: true })
        location.reload()
        return
      } else if (dicomFileSetId === 'adi') {
        commit('set', {
          dicomFileSet: {
            id: 'adi',
            name: 'ADI',
            uploads: _.map(getFileUrlsDefaultAdi(), (u) => {
              return { url: u }
            }),
          },
        })
      } else if (dicomFileSetId) {
        let response = await apiGet(`dicomFileSets/${dicomFileSetId}`, rootState.authentication.accessToken)
        let dicomFileSet = response.data
        log.debug('loading dicom ', dicomFileSet)
        commit('set', { dicomFileSet })
      } else {
        log.error('Missing DICOM File Set ID')
        return
      }

      if (state.dicomFileSet.linkedDicoms) {
        for (const dicomFileSetId of state.dicomFileSet.linkedDicoms) {
          let response = await apiGet(`dicomFileSets/${dicomFileSetId}`, rootState.authentication.accessToken)
          let dicomFileSet = response.data
          await dispatch('loadStack', { dicomFileSet, skipClassification })
        }
      }

      if (_.size(state.dicomFileSet.uploads) > 0) {
        await dispatch('loadStack', { dicomFileSet: state.dicomFileSet, skipClassification })
      }

      commit('set', { isLoaded: true, hasLoadedPreviously: true })
    },

    // returns user in callback, triggering a db fetch if new, otherwise returning cache
    // Each Dicom Fileset contains all the files/frames to make up all needed Dicom Data for Question (Question Chain?). So usually 3 Localizer Stacks (per direction), and one HD Stack
    async loadStack({ state, commit, dispatch, getters }, { dicomFileSet, skipClassification }) {
      const dicomFileSetId = dicomFileSet.id
      let type = dicomFileSet.type

      if (type && type !== 'LOC') {
        let fileUrls = _.map(dicomFileSet.uploads, (u) => {
          const url = new URL(u.url)
          return url.pathname.substring(1)
        }).join(',')
        state.dicomMap[type] = fileUrls
        commit('set', { dicomCount: state.dicomCount + 1 })
        return
      }

      if (state.isLoaded) {
        log.debug('Already loaded')
        if (_.get(state, 'dicomFileSet.id') !== dicomFileSetId) {
          // Hard Refreshing to make sure everything gets unloaded and ready for a different Dicom for now
          // CAREFUL: A different Dicom may be loaded during a TestRun for a CTQ after the MRI questions (and should not cause a refresh unless we support mid-test refreshes)
          // commit('set', {stack: null})
          commit('set', { allowPageReloadWithoutConfirmation: true })
          location.reload()
        }
      } else {
        let fileUrls = _.map(dicomFileSet.uploads, 'url')

        /**
         * Do not load all DICOMs for resolution labs / any dicom urls that start with HD_ or LD_
         * They're big and should only be loaded AFTER user has identified
         * which resolution reconstruction they want
         */
        if (getters.hasDeferredHdUrls || getters.hasDeferredLocalizerUrls) {
          fileUrls = fileUrls.filter((url) => !url.includes(hdPrefix) && !url.includes(localizerVolumePrefix))
        }

        // Classify DICOM files by reading headers (Range requests ~16KB each)
        // Only fully download localizer files; volume files are handled by cruncher
        // Skip classification for Critical Thinking questions — they need all volume files
        // Skip classification for CT labs — they don't use cruncher and need all files preloaded
        if (!skipClassification && !config.isCTLab) {
          const niiUrls = fileUrls.filter((url) => url.endsWith('.nii') || url.endsWith('.nii.gz'))
          const dicomUrls = fileUrls.filter((url) => !url.endsWith('.nii') && !url.endsWith('.nii.gz'))

          if (dicomUrls.length > 0) {
            // Check Vuex cache first, then sessionStorage, before running classification
            let cachedLocalizerUrls = state.classifiedLocalizerUrlsByFileSetId[dicomFileSetId]

            if (!cachedLocalizerUrls) {
              // Check sessionStorage for persisted classification (survives page refresh)
              try {
                const stored = sessionStorage.getItem(dicomClassifyCacheKey(dicomFileSetId))
                if (stored) {
                  const localizerPaths = JSON.parse(stored)
                  // Match stored pathnames against fresh URLs (signatures may differ)
                  cachedLocalizerUrls = dicomUrls.filter((url) => {
                    const pathname = new URL(url).pathname
                    return localizerPaths.includes(pathname)
                  })
                  if (cachedLocalizerUrls.length > 0) {
                    log.info(`DICOM classification restored from sessionStorage for fileSet ${dicomFileSetId}`)
                  } else {
                    cachedLocalizerUrls = null // paths didn't match, re-classify
                  }
                }
              } catch {
                /* sessionStorage unavailable */
              }
            }

            if (cachedLocalizerUrls) {
              fileUrls = [...cachedLocalizerUrls, ...niiUrls]
              log.info(
                `[LOC-DEBUG] Classification CACHE HIT for fileSet ${dicomFileSetId}: ${
                  cachedLocalizerUrls.length
                } cached localizer URLs, ${dicomUrls.length} total DICOM URLs, ${
                  dicomUrls.length - cachedLocalizerUrls.length
                } filtered out as volume`
              )
            } else {
              try {
                EventBus.$emit('LOADING', { name: 'CLASSIFY_DICOMS', subtitle: 'Classifying files...' })

                log.info(
                  `[LOC-DEBUG] Starting header classification for fileSet ${dicomFileSetId}: ${dicomUrls.length} DICOM URLs, ${niiUrls.length} NIfTI URLs`
                )

                const classification = await classifyFilesByHeader(dicomUrls, (completed, total) => {
                  const pct = Math.round((completed / total) * 50)
                  commit('set', { progressFetch: pct })
                })

                log.info(
                  `[LOC-DEBUG] Classifier returned: localizer=${classification.localizerUrls.length}, volume=${classification.volumeUrls.length}, unclassified=${classification.unclassifiedUrls.length}`
                )

                // Unclassified files are loaded as a safety fallback
                const localizerAndUnclassified = [...classification.localizerUrls, ...classification.unclassifiedUrls]
                fileUrls = [...localizerAndUnclassified, ...niiUrls]

                // Cache in Vuex (survives navigation) and sessionStorage (survives refresh)
                commit('set', {
                  classifiedLocalizerUrlsByFileSetId: {
                    ...state.classifiedLocalizerUrlsByFileSetId,
                    [dicomFileSetId]: localizerAndUnclassified,
                  },
                })
                try {
                  const localizerPaths = localizerAndUnclassified.map((url) => new URL(url).pathname)
                  sessionStorage.setItem(dicomClassifyCacheKey(dicomFileSetId), JSON.stringify(localizerPaths))
                } catch {
                  /* sessionStorage unavailable */
                }

                log.info(
                  `DICOM classification: ${classification.localizerUrls.length} localizer, ${classification.volumeUrls.length} volume, ${classification.unclassifiedUrls.length} unclassified`
                )
              } catch (err) {
                log.warn('DICOM header classification failed, loading all files', err)
                // fileUrls remains unchanged — loads everything as before
              }
            }
          }
        }

        await dispatch('loadFiles', { urls: fileUrls, type, baseStackIdent: dicomFileSetId.toString() })
      }

      if (config.isCTLab && getters.hasDeferredHdUrls) {
        await dispatch('loadStackFromDeferredDicomUrls', { stackConfig: {} })
      }
    },

    reset({ commit, state }, { isResetLoadedDicomFileSets = true }) {
      commit('set', {
        stack: null,
        isLoaded: false,
        progressFetch: 0,
        progressParse: 0,
        progressTotal: 0,
        stackByStackIdent: null,
        dicomFileSet: null,
        dicomMap: {},
        deferredStackIdentByUrlProperties: {},
        classifiedLocalizerUrlsByFileSetId: isResetLoadedDicomFileSets ? {} : state.classifiedLocalizerUrlsByFileSetId,
        loadedDicomFileSets: isResetLoadedDicomFileSets ? [] : state.loadedDicomFileSets,
      })
    },
  },
  getters: {
    stackIdentFirst(state) {
      return _.first(_.keys(state.stackByStackIdent))
    },
    dicomFileSet(state) {
      // TODO change this once multiple DICOM file sets can be loaded in at once / not needed now that one file set has everything a question needs
      // if(_.get(state, 'stackQuestion.dicomInitialId') === _.get(state, 'dicomFileSet.id') ){
      return state.dicomFileSet || null
    },
    isContrastLab(state) {
      return state.dicomFileSet?.type === 'CONTRAST'
    },
    isResolutionLab(state) {
      // For actual Resolution Lab, the DicomFileSet.bodyPart is set and has '(Resolution Lab)' in the name
      // VS for only Branching, the DicomFileSet.bodyPart isn't set or does not include "(Resolution Lab)" in the name
      // The backend does this check
      return state.dicomFileSet?.isResolutionLab
    },
    hasDeferredHdUrls(state) {
      return _.some(state.dicomFileSet.uploads, (upload) => upload.url.includes(hdPrefix))
    },
    hasDeferredLocalizerUrls(state) {
      return _.some(
        state.dicomFileSet.uploads,
        (upload) =>
          upload.url.includes(localizerVolumePrefix) && upload.url.replace(/-/g, '.').match(localizerVolumeFileRegex)
      )
    },
    primaryDicomSourcePaths(state) {
      if (!state.dicomFileSet?.uploads) return []
      return state.dicomFileSet.uploads
        .filter((u) => !u.url.includes(hdPrefix) && !u.url.includes(localizerVolumePrefix))
        .map((u) => {
          try {
            return new URL(u.url).pathname.substring(1)
          } catch (e) {
            return null
          }
        })
        .filter(Boolean)
    },
    hdBranchIds(state, getters) {
      if (!getters.hasDeferredHdUrls) return []
      return _.keys(getters.dicomHdUrlsByBranchId)
    },
    ldBranchIds(state, getters) {
      if (!getters.hasDeferredLocalizerUrls) return []
      return _.keys(getters.dicomLdUrlsByBranchId)
    },
    curHdBranchId(state, getters, rootState, rootGetters) {
      let stackQuestion = rootGetters['questionService/stackQuestion']
      return stackQuestion?.hdBranchId || _.first(getters.hdBranchIds)
    },
    curLdBranchId(state, getters, rootState, rootGetters) {
      let stackQuestion = rootGetters['questionService/stackQuestion']
      // Default to HD Branch, since there might not be an LD Branch (I think they should always be the same?)
      return stackQuestion?.ldBranchId || getters.curHdBranchId
    },
    highestResolutionHdUrl(state, getters) {
      let fileUrls
      if (getters.curHdBranchId) {
        fileUrls = getters.dicomHdUrlsByBranchId[getters.curHdBranchId] || []
      } else {
        fileUrls = _.map(state.dicomFileSet.uploads, 'url').filter((url) => url.includes(hdPrefix))
      }

      const phaseVoxels = []
      for (const url of fileUrls) {
        const match = url.replace(/-/g, '.').match(hdFileRegex)
        if (match) {
          phaseVoxels.push({
            url,
            size: { phase: parseFloat(match[1]), frequency: parseFloat(match[2]), slice: parseFloat(match[3]) },
          })
        }
      }

      if (phaseVoxels.length === 0) return null
      return _.minBy(phaseVoxels, (v) => v.size.phase).url
    },
    dicomUploadsWithFileNameInfo(state) {
      return _.map(state.dicomFileSet.uploads, (upload) => {
        let output = { ...upload, fileNameInfo: {} }
        let matchHd = upload.url.match(hdFileRegex)
        let matchLd = upload.url.match(localizerVolumeFileRegex)
        if (matchHd || matchLd) {
          let match = matchHd || matchLd
          let phase = parseFloat(match[1])
          let frequency = parseFloat(match[2])
          let slice = parseFloat(match[3])
          output.fileNameInfo = {
            ld: !!matchLd,
            hd: !!matchHd,
            phase,
            frequency,
            slice,
            // phaseFrequencySlice: `${phase}_${frequency}_${slice}`,
            branchId: match[4],
          }
        }

        return output
      })
    },
    dicomHdUrlsByBranchId(state, getters) {
      let uploads = _.filter(
        getters.dicomUploadsWithFileNameInfo,
        (upload) => upload.fileNameInfo.hd && upload.fileNameInfo.branchId
      )
      return _.mapValues(
        _.groupBy(uploads, (upload) => upload.fileNameInfo.branchId),
        (uploads) => _.map(uploads, 'url')
      )
    },
    dicomLdUrlsByBranchId(state, getters) {
      let uploads = _.filter(
        getters.dicomUploadsWithFileNameInfo,
        (upload) => upload.fileNameInfo.ld && upload.fileNameInfo.branchId
      )
      return _.mapValues(
        _.groupBy(uploads, (upload) => upload.fileNameInfo.branchId),
        (uploads) => _.map(uploads, 'url')
      )
    },
    availableSequenceTypes() {
      // const stacks = _.values(state.stackByStackIdent)
      // const types = _.map(stacks, 'type')
      const availableTypes = ['SE', 'GRE']

      // if (types.includes('T1') && types.includes('T2') && types.includes('PD')) {
      //   if ((types.includes('WOD') && types.includes('FOD')) || types.includes('WF')) {
      //     availableTypes.push({ text: 'GRE', value: 'GRE' })
      //   }
      // }
      return availableTypes
    },
    availableSequenceTypesXA() {
      const availableTypesXA = [
        { text: 'TSE', value: 'TE' },
        { text: 'GRE', value: 'GRE' },
        { text: 'SE', value: 'SE' },
        { text: 'Diffusion', value: 'DIFF' },
      ]
      return availableTypesXA
    },
    availableSequenceTypesPhilips() {
      const availableTypesPH = [
        { text: 'TSE', value: 'TE' },
        { text: 'FFE', value: 'FFE' },
        { text: 'SE', value: 'SE' },
      ]
      return availableTypesPH
    },
    availableFieldStrengths() {
      const availableTypes = ['1.5', '3.0']
      return availableTypes
    },
    isFatSatAvailable(state) {
      const stacks = _.values(state.stackByStackIdent)
      const types = _.map(stacks, 'type')
      return (types.includes('WOD') && types.includes('FOD')) || types.includes('WF')
    },
  },
}

export default dicomService
