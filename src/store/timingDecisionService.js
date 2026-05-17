import _ from 'lodash'
import {
  INJECTOR_PROTOCOLS,
  MAXIMUM_BLOOTH_TUBE_STEP,
  NUM_OF_BODY_MAP_IMAGES,
  RANDOM_COLORS,
  TIMING_DECISION_MAX_PRESENTATION_STEP,
} from '../constants'
import * as JSZip from 'jszip'
import * as JSZipUtils from 'jszip-utils'
import uuidv4 from 'uuid/v4'
import Papa from 'papaparse'
import { fabric } from 'fabric'
import { FABRIC_IMAGES_CACHE } from '../util/loaderManager'

function getBreathingPhaseFromKey(key) {
  // key examples:
  //   "b00/baseLayer.00143.png"
  //   "b03/143/143_sv40ml_2s_10ml.json"
  const parts = key.split('/')
  const first = parts[0] || ''
  const match = first.match(/^b(\d{2})$/i)
  if (match) {
    return parseInt(match[1], 10) // 0..3
  }
  // old data (no subfolder) -> treat as phase 0
  return 0
}

let timeOutLoadCsv = null
let timeOutLoadBrightnessMapping = null
const timingDecisionService = {
  namespaced: true,
  state: {
    isSetDefaultActiveTab: false,
    isConfirmedSetDelay: false,
    isPressInjectBeforePressScanButton: false,
    startTimingDecisionTime: null,
    isMovingMRIMachineToConfirmedPosition: false,
    isCountDownTimingDecisionQuestion: false,
    isMovedMRIPositionToCorrectZone: false,
    timingDecisionActiveTab: 1,
    timingDecisionTestProcessInjectedStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
    timingDecisionInjectedStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
    timingDecisionContrast1InjectedStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
    timingDecisionContrast2InjectedStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
    timingDecisionTestProcessDoneStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
    timingDecisionContrast1ProcessDoneStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
    timingDecisionContrast2ProcessDoneStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
    // Used this variable when test has only one contrast process
    timingDecisionContrastProcessDoneStep: TIMING_DECISION_MAX_PRESENTATION_STEP,

    delayTimeFromStartTimingDecisionTimeToPressInjectButton: 0,

    preloadProcesses: [],
    preloadCatScanImages: [],
    preloadDyeImages: [],
    preloadHeartImages: [],
    preloadHeartDyeImages: [],
    multipleLayerImagePath: '',

    brightnessMappingData: [],
    probeData: [],

    multipleLayerImages: [],
    preloadVascularImages: [],
    preloadHeartLayerImages: [],
    preloadLiverLayerImages: [],
    loadedFolder: [],

    sliceDyesData: [],

    bloothTubeStep: 0,
    digitalLocalizerMinStep: 0,
    digitalLocalizerMaxStep: NUM_OF_BODY_MAP_IMAGES - 1,

    previewContrast: 0.2,
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  actions: {
    setDigitalLocalizerStep({ commit }, payload) {
      commit('set', { digitalLocalizerMinStep: payload.min, digitalLocalizerMaxStep: payload.max })
    },
    setBloothTubeStep({ commit }, payload) {
      commit('set', { bloothTubeStep: payload < MAXIMUM_BLOOTH_TUBE_STEP ? payload : MAXIMUM_BLOOTH_TUBE_STEP })
    },
    loadSliceDyesData({ commit }) {
      if (timeOutLoadCsv) {
        clearTimeout(timeOutLoadCsv)
      }
      timeOutLoadCsv = setTimeout(async () => {
        try {
          const listData = []
          for (let i = 1; i <= 5; i++) {
            const filePath = `/img/slice-data/dye_300ml_${i}.csv`
            try {
              const response = await this.dispatch('timingDecisionService/loadCsvData', filePath)
              listData.push(response)
            } catch (error) {
              console.error('Error loading CSV file:', error)
            }
          }
          listData.forEach((el) => {
            el.forEach((item) => {
              item.ml = parseFloat(item.ml)
              item.sec = parseFloat(item.sec)
            })
          })
          commit('set', {
            sliceDyesData: listData,
          })
        } catch (error) {
          console.error('Error preparing slice dye data:', error)
        }
      }, [500])
    },
    loadBrightnessMappingData(_, payload) {
      if (timeOutLoadBrightnessMapping) {
        clearTimeout(timeOutLoadBrightnessMapping)
      }
      timeOutLoadBrightnessMapping = setTimeout(async () => {
        try {
          await this.dispatch('timingDecisionService/loadBrightnessMappingJsonData', payload)
        } catch (error) {
          console.error('Error loading brightness mapping data:', error)
        }
      }, [500])
    },
    loadSliceVascularData(_, payload) {
      this.dispatch('timingDecisionService/loadSliceVascularImages', payload)
    },
    async loadSliceVascularImages({ state, commit, dispatch }, { zipPath, albumNo }) {
      if (!zipPath || !albumNo) {
        return
      }

      const albumNoNum = Number(albumNo)

      if (!state.loadedFolder.includes(zipPath)) {
        const processId = uuidv4()
        const process = {
          id: processId,
          name: 'Preload Slice Images',
          percent: 0,
        }

        commit('set', {
          loadedFolder: [...state.loadedFolder, zipPath],
          preloadProcesses: [...state.preloadProcesses, process],
        })

        JSZipUtils.getBinaryContent(zipPath, {
          progress: (e) => {
            const percent = _.round((e.loaded / e.total) * 80)
            dispatch('updateProcessPercent', { processId, percent })
          },
          callback: function (err, data) {
            if (err) {
              dispatch('updateProcessPercent', { processId, percent: 100 })
              console.error('Failed to load vascular zip content:', err)
              return
            }

            JSZip.loadAsync(data)
              .then(async function (data) {
                // New structure: keys like "b00/arteries_pulmonary_L_00.png"
                const allFileKeys = Object.keys(data.files).filter((el) => el.includes('.png'))

                for (const key of allFileKeys) {
                  const file = data.file(key)
                  const str = await file.async('base64')
                  const b64 = 'data:image/png;base64,' + str

                  const breathingPhase = getBreathingPhaseFromKey(key) // 0..3 from "b00", "b01" ...

                  const parts = key.split('/') // ["b00", "arteries_pulmonary_L_00.png"]
                  const folderName = parts[0] || '' // "b00"
                  const fileName = parts[parts.length - 1] // "arteries_pulmonary_L_00.png"

                  // Virtual path (for cache lookup), matching the pattern used elsewhere:
                  // /img/timing-decision-album-multiple-layer/143/b00/arteries_pulmonary_L_00.png
                  const path = `/img/timing-decision-album-multiple-layer/${albumNoNum}/${folderName}/${fileName}`

                  const timingDecisionStep = albumNoNum

                  if (
                    !_.find(
                      state.preloadVascularImages,
                      (el) =>
                        el.path === path &&
                        el.breathingPhase === breathingPhase &&
                        el.timingDecisionStep === timingDecisionStep
                    )
                  ) {
                    commit('set', {
                      preloadVascularImages: [
                        ...state.preloadVascularImages,
                        {
                          breathingPhase,
                          albumNo: albumNoNum,
                          timingDecisionStep,
                          fileName,
                          path,
                          zipPath,
                          img: b64,
                        },
                      ],
                    })

                    await new Promise((resolve) => {
                      fabric.Image.fromURL(b64, (img) => {
                        FABRIC_IMAGES_CACHE.push({
                          fileName,
                          img,
                          path,
                          zipPath,
                          albumNo: albumNoNum,
                          timingDecisionStep,
                          breathingPhase,
                        })
                        resolve()
                      })
                    })
                  }
                }

                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
              .catch((error) => {
                console.error('Failed to unzip vascular images:', error)
                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
          },
        })
      }
    },
    loadSliceHeartLayerData(_, payload) {
      this.dispatch('timingDecisionService/loadSliceHeartLayerImages', payload)
    },
    loadSliceLiverLayerData(_, payload) {
      this.dispatch('timingDecisionService/loadSliceLiverLayerImages', payload)
    },
    async loadSliceHeartLayerImages({ state, commit, dispatch }, { zipPath, albumNo }) {
      // hear_BG
      if (!zipPath || !albumNo) {
        return
      }
      console.log('***********************************************')
      console.log('albumNo=', albumNo)
      console.log('***********************************************')
      if (!state.loadedFolder.includes(zipPath)) {
        const processId = uuidv4()
        const process = {
          id: processId,
          name: 'Preload Slice Images',
          percent: 0,
        }
        commit('set', {
          loadedFolder: [...state.loadedFolder, zipPath],
          preloadProcesses: [...state.preloadProcesses, process],
        })
        try {
          JSZipUtils.getBinaryContent(zipPath, {
            progress: (e) => {
              const percent = _.round((e.loaded / e.total) * 80)
              dispatch('updateProcessPercent', { processId, percent })
            },
            callback: function (err, data) {
              if (err) {
                dispatch('updateProcessPercent', { processId, percent: 100 })
                console.error('Failed to load heart layer zip content:', err)
                return
              }
              JSZip.loadAsync(data)
                .then(async function (data) {
                  const allFileKeys = Object.keys(data.files).filter((el) => el.includes('.png'))

                  for (const key of allFileKeys) {
                    const file = data.file(key)
                    const str = await file.async('base64')
                    const b64 = 'data:image/png;base64,' + str
                    const breathingPhase = getBreathingPhaseFromKey(key)
                    const fileName = key.split('/').pop()
                    const folderName = key.split('/')[0]
                    const path = `/${folderName}/${fileName}`

                    if (
                      !_.find(
                        state.preloadHeartLayerImages,
                        (el) => el.path == path && el.breathingPhase === breathingPhase
                      )
                    ) {
                      commit('set', {
                        preloadHeartLayerImages: [
                          ...state.preloadHeartLayerImages,
                          { breathingPhase, albumNo, fileName, path, zipPath, img: b64 },
                        ],
                      })

                      await new Promise((resolve) => {
                        fabric.Image.fromURL(b64, (img) => {
                          FABRIC_IMAGES_CACHE.push({
                            fileName,
                            img,
                            path,
                            zipPath,
                            albumNo,
                            breathingPhase,
                          })
                          resolve()
                        })
                      })
                    }
                  }
                  dispatch('updateProcessPercent', { processId, percent: 100 })
                })
                .catch((error) => {
                  console.error('Failed to unzip heart layer images:', error)
                  dispatch('updateProcessPercent', { processId, percent: 100 })
                })
            },
          })
        } catch (err) {
          console.error(err)
          dispatch('updateProcessPercent', { processId, percent: 100 })
        }
      }
    },
    async loadSliceLiverLayerImages({ state, commit, dispatch }, { zipPath, albumNo }) {
      if (!zipPath || !albumNo) {
        return
      }

      if (!state.loadedFolder.includes(zipPath)) {
        const processId = uuidv4()
        const process = {
          id: processId,
          name: 'Preload Slice Images',
          percent: 0,
        }

        commit('set', {
          loadedFolder: [...state.loadedFolder, zipPath],
          preloadProcesses: [...state.preloadProcesses, process],
        })

        JSZipUtils.getBinaryContent(zipPath, {
          progress: (e) => {
            const percent = _.round((e.loaded / e.total) * 80)
            dispatch('updateProcessPercent', { processId, percent })
          },
          callback: function (err, data) {
            if (err) {
              dispatch('updateProcessPercent', { processId, percent: 100 })
              console.error('Failed to load liver layer zip content:', err)
              return
            }

            JSZip.loadAsync(data)
              .then(async function (zip) {
                const allFileKeys = Object.keys(zip.files).filter((el) => el.includes('.png'))

                for (const key of allFileKeys) {
                  const file = zip.file(key)
                  const str = await file.async('base64')
                  const b64 = 'data:image/png;base64,' + str

                  // key is like "liver.001.png" (no b00/b01 folders)
                  const fileName = key.split('/').pop() // liver.001.png

                  // Map liver.001–004 to breathingPhase 0–3
                  let breathingPhase = 0
                  const m = fileName.match(/liver\.(\d+)\.png$/i)
                  if (m) {
                    const idx = parseInt(m[1], 10) // 1..4
                    breathingPhase = (idx - 1) % 4 // 0..3
                  } else {
                    // fallback if structure ever changes
                    breathingPhase = getBreathingPhaseFromKey(key)
                  }

                  // We can fake a logical path; just keep it consistent with FABRIC_IMAGES_CACHE
                  const path = `/img/timing-decision-album-multiple-layer/${albumNo}/liver/${fileName}`

                  if (
                    !_.find(
                      state.preloadLiverLayerImages,
                      (el) => el.path === path && el.breathingPhase === breathingPhase && el.albumNo === albumNo
                    )
                  ) {
                    commit('set', {
                      preloadLiverLayerImages: [
                        ...state.preloadLiverLayerImages,
                        { breathingPhase, albumNo, fileName, path, zipPath, img: b64 },
                      ],
                    })

                    await new Promise((resolve) => {
                      fabric.Image.fromURL(b64, (img) => {
                        FABRIC_IMAGES_CACHE.push({
                          fileName,
                          img,
                          path,
                          zipPath,
                          albumNo,
                          breathingPhase,
                        })
                        resolve()
                      })
                    })
                  }
                }

                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
              .catch((error) => {
                console.error('Failed to unzip liver layer images:', error)
                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
          },
        })
      }
    },
    async loadCsvData(_, filePath) {
      return new Promise((resolve, reject) => {
        Papa.parse(filePath, {
          download: true, // Enables downloading the file from the given path
          header: true, // Parses the CSV into an array of objects with headers as keys
          skipEmptyLines: true, // Skips empty lines in the CSV
          complete: (result) => {
            resolve(result.data) // Resolves with the parsed data
          },
          error: (error) => {
            reject(error) // Rejects on error
          },
        })
      })
    },
    async loadBrightnessMappingJsonData({ state, commit, dispatch }, zipPath) {
      if (!zipPath) return

      // Prevent re-loading same zip
      if (!state.loadedFolder.includes(zipPath)) {
        const processId = uuidv4()
        const process = {
          id: processId,
          name: 'Preload Brightness Mapping JSON',
          percent: 0,
        }

        commit('set', {
          loadedFolder: [...state.loadedFolder, zipPath],
          preloadProcesses: [...state.preloadProcesses, process],
        })

        JSZipUtils.getBinaryContent(zipPath, {
          progress: (e) => {
            const percent = _.round((e.loaded / e.total) * 80)
            dispatch('updateProcessPercent', { processId, percent })
          },
          callback: function (err, data) {
            if (err) {
              dispatch('updateProcessPercent', { processId, percent: 100 })
              console.error('Failed to load brightness mapping zip content:', err)
              return
            }

            JSZip.loadAsync(data)
              .then(async function (zipData) {
                const allFileKeys = Object.keys(zipData.files).filter((el) => el.toLowerCase().endsWith('.json'))

                for (const key of allFileKeys) {
                  const file = zipData.file(key)
                  if (!file) continue

                  const response = await file.async('string')
                  const json = JSON.parse(response)

                  // Example key: "sv40ml_2s_10ml_volume.json"
                  const parts = key.split('/')
                  const fileNameOnly = parts[parts.length - 1] // "sv40ml_2s_10ml_volume.json"
                  const baseName = fileNameOnly.replace(/\.json$/i, '')
                  const segments = baseName.split('_')

                  let strokeVolume = null
                  let durationSec = null

                  // Robust parsing:
                  // - strokeVolume from something like "sv40ml"
                  // - durationSec from something like "2s" or "2.5s"
                  for (const seg of segments) {
                    if (strokeVolume == null) {
                      const mSv = seg.match(/^sv(\d+)ml$/i)
                      if (mSv) {
                        strokeVolume = parseInt(mSv[1], 10)
                        continue
                      }
                    }

                    if (durationSec == null) {
                      const mDur = seg.match(/^(\d+(?:\.\d*)?)s$/i)
                      if (mDur) {
                        durationSec = parseFloat(mDur[1])
                        continue
                      }
                    }
                  }

                  const newEntry = {
                    zipPath,
                    fileName: key, // keep full key for debugging / display
                    strokeVolume: strokeVolume != null ? strokeVolume : null,
                    duration: durationSec != null ? durationSec : null,
                    data: json, // actual brightness map: { [brightnessKey]: number[] }
                  }

                  commit('set', {
                    brightnessMappingData: [...state.brightnessMappingData, newEntry],
                  })
                }

                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
              .catch((error) => {
                console.error('Failed to unzip brightness mapping data:', error)
                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
          },
        })
      }
    },
    async loadProbeJsonData({ state, commit, dispatch }, zipPath) {
      if (!state.loadedFolder.includes(zipPath)) {
        const processId = uuidv4()
        const process = {
          id: processId,
          name: 'Preload Slice Images',
          percent: 0,
        }
        commit('set', {
          loadedFolder: [...state.loadedFolder, zipPath],
          preloadProcesses: [...state.preloadProcesses, process],
        })
        JSZipUtils.getBinaryContent(zipPath, {
          progress: (e) => {
            const percent = _.round((e.loaded / e.total) * 80)
            dispatch('updateProcessPercent', { processId, percent })
          },
          callback: function (err, data) {
            if (err) {
              dispatch('updateProcessPercent', { processId, percent: 100 })
              console.error('Failed to load probe zip content:', err)
              return
            }
            JSZip.loadAsync(data)
              .then(async function (data) {
                const allFileKeys = Object.keys(data.files).filter((el) => el.includes('.json'))

                let probeData = state.probeData
                for (let i = 0; i < allFileKeys.length; i++) {
                  const key = allFileKeys[i]
                  const file = data.file(key)
                  // Read file as json
                  const response = await file.async('string')
                  const fileName = key.split('.')[0]
                  let label = fileName
                    .split('_')
                    .map((el) => el.charAt(0).toUpperCase() + el.slice(1))
                    .join(' ')
                  if (label.startsWith('Arterial ')) {
                    label = label.replace('Arterial ', '')
                  }
                  if (label.startsWith('Venous ')) {
                    label = label.replace('Venous ', '')
                  }
                  const jsonData = JSON.parse(response)
                  // Random color for each probe

                  const color = RANDOM_COLORS[i % RANDOM_COLORS.length]
                  const mappingData = Object.entries(jsonData).map(([key, value]) => {
                    const keySplits = key.split('_')
                    const sv = keySplits[0].replace('sv', '').replace('ml', '')
                    const sec = keySplits[1].replace('s', '')
                    const ml = keySplits[2].replace('ml', '')
                    return {
                      strokeVolume: +sv,
                      duration: +sec,
                      ml: +ml,
                      values: value,
                    }
                  })
                  if (!probeData.find((el) => el.fileName == fileName)) {
                    probeData.push({ zipPath: zipPath, data: jsonData, color, label, mappingData, fileName })
                  }
                  probeData = _.orderBy(probeData, 'fileName', 'asc')
                }
                commit('set', {
                  probeData: probeData,
                })
                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
              .catch((error) => {
                console.error('Failed to unzip probe data:', error)
                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
          },
        })
      }
    },
    resetPreloadImages({ commit, state }) {
      // Collect all paths from state arrays being reset so we can remove
      // matching entries from the module-level FABRIC_IMAGES_CACHE
      const pathsToRemove = new Set()
      const arrays = [
        state.preloadCatScanImages,
        state.preloadDyeImages,
        state.preloadHeartImages,
        state.preloadHeartDyeImages,
        state.multipleLayerImages,
        state.preloadVascularImages,
        state.preloadHeartLayerImages,
        state.preloadLiverLayerImages,
      ]
      for (const arr of arrays) {
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (item && item.path) pathsToRemove.add(item.path)
          }
        }
      }

      // Remove matching entries from FABRIC_IMAGES_CACHE (splice in reverse)
      for (let i = FABRIC_IMAGES_CACHE.length - 1; i >= 0; i--) {
        if (pathsToRemove.has(FABRIC_IMAGES_CACHE[i].path)) {
          FABRIC_IMAGES_CACHE.splice(i, 1)
        }
      }
      commit('set', {
        preloadProcesses: [],
        preloadCatScanImages: [],
        preloadDyeImages: [],
        preloadHeartImages: [],
        preloadHeartDyeImages: [],
        loadedFolder: [],
        multipleLayerImages: [],
        preloadVascularImages: [],
        preloadHeartLayerImages: [],
        preloadLiverLayerImages: [],
      })
    },
    updateProcessPercent({ commit, state }, { processId, percent }) {
      const process = state.preloadProcesses.find((el) => el.id == processId)
      if (process) {
        process.percent = percent
      }
      commit('set', { preloadProcesses: [...state.preloadProcesses] })
    },
    onPreloadCatScanImages({ commit, state, dispatch }) {
      const folderPath = `/img/cat-scans`
      const zipPath = `/img/cat-scans.zip`
      if (!state.loadedFolder.includes(zipPath)) {
        const processId = uuidv4()
        const process = {
          id: processId,
          name: 'Preload Cat Scan Images',
          percent: 0,
        }
        commit('set', {
          preloadProcesses: [...state.preloadProcesses, process],
        })
        JSZipUtils.getBinaryContent(zipPath, {
          progress: (e) => {
            const percent = _.round((e.loaded / e.total) * 80)
            dispatch('updateProcessPercent', { processId, percent })
          },
          callback: function (err, data) {
            if (err) {
              dispatch('updateProcessPercent', { processId, percent: 100 })
              console.error('Failed to load cat scan zip content:', err)
              return
            }
            JSZip.loadAsync(data)
              .then(async function (data) {
                const allFileKeys = Object.keys(data.files).filter((el) => el.includes('.png'))
                for (const key of allFileKeys) {
                  const file = data.file(key)
                  const str = await file.async('base64')
                  const b64 = 'data:image/png;base64,' + str
                  const fileName = key.split('/').pop()
                  const path = `${folderPath}/${fileName}`

                  if (!_.find(state.preloadCatScanImages, (el) => el.path == path)) {
                    commit('set', {
                      preloadCatScanImages: [...state.preloadCatScanImages, { path, img: b64 }],
                    })
                  }
                }
                dispatch('updateProcessPercent', { processId, percent: 100 })
                commit('set', {
                  loadedFolder: [...state.loadedFolder, zipPath],
                })
              })
              .catch((error) => {
                console.error('Failed to unzip cat scan images:', error)
                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
          },
        })
      }
    },
    loadSlicesZipFile({ commit, state, dispatch }, { zipPath, folderPath }) {
      console.log('zipPath', zipPath)
      if (!state.loadedFolder.includes(zipPath)) {
        const processId = uuidv4()
        const process = {
          id: processId,
          name: 'Preload Slice Images',
          percent: 0,
        }
        commit('set', {
          loadedFolder: [...state.loadedFolder, zipPath],
          preloadProcesses: [...state.preloadProcesses, process],
        })
        JSZipUtils.getBinaryContent(zipPath, {
          progress: (e) => {
            const percent = _.round((e.loaded / e.total) * 80)
            dispatch('updateProcessPercent', { processId, percent })
          },
          callback: function (err, data) {
            if (err) {
              dispatch('updateProcessPercent', { processId, percent: 100 })
              console.error('Failed to load slices zip content:', err)
              return
            }
            JSZip.loadAsync(data)
              .then(async function (data) {
                const allFileKeys = Object.keys(data.files).filter((el) => el.includes('.png'))

                for (const key of allFileKeys) {
                  const file = data.file(key)
                  const str = await file.async('base64')
                  const b64 = 'data:image/png;base64,' + str
                  const fileName = key.split('/').pop()
                  const folderName = key.split('/')[0]
                  const path = `${folderPath}/${folderName}/${fileName}`

                  if (fileName.includes('HeartDye')) {
                    if (!_.find(state.preloadHeartDyeImages, (el) => el.path == path)) {
                      commit('set', {
                        preloadHeartDyeImages: [...state.preloadHeartDyeImages, { path, img: b64 }],
                      })
                    }
                  } else if (fileName.includes('Heart')) {
                    if (!_.find(state.preloadHeartImages, (el) => el.path == path)) {
                      commit('set', {
                        preloadHeartImages: [...state.preloadHeartImages, { path, img: b64 }],
                      })
                    }
                  } else {
                    if (!_.find(state.preloadDyeImages, (el) => el.path == path)) {
                      commit('set', {
                        preloadDyeImages: [...state.preloadDyeImages, { path, img: b64 }],
                      })
                    }
                  }
                }
                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
              .catch((error) => {
                console.error('Failed to unzip slice images:', error)
                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
          },
        })
      }
    },
    loadMultipleLayerSlicesZipFile({ commit, state, dispatch }, { zipPath, folderPath }) {
      // heart.zip
      commit('set', { multipleLayerImagePath: zipPath })
      if (!state.loadedFolder.includes(zipPath)) {
        const processId = uuidv4()
        const process = {
          id: processId,
          name: 'Preload Slice Images',
          percent: 0,
        }
        commit('set', {
          loadedFolder: [...state.loadedFolder, zipPath],
          preloadProcesses: [...state.preloadProcesses, process],
        })
        JSZipUtils.getBinaryContent(zipPath, {
          progress: (e) => {
            const percent = _.round((e.loaded / e.total) * 80)
            dispatch('updateProcessPercent', { processId, percent })
          },
          callback: function (err, data) {
            if (err) {
              dispatch('updateProcessPercent', { processId, percent: 100 })
              console.error('Failed to load multiple layer zip content:', err)
              return
            }
            JSZip.loadAsync(data)
              .then(async function (data) {
                const allFileKeys = Object.keys(data.files).filter((el) => el.includes('.png'))

                for (const key of allFileKeys) {
                  const file = data.file(key)
                  const str = await file.async('base64')
                  const b64 = 'data:image/png;base64,' + str
                  const breathingPhase = getBreathingPhaseFromKey(key)
                  const fileName = key.split('/').pop()
                  const folderName = key.split('/')[0]
                  const path = `${folderPath}/${folderName}/${fileName}`

                  if (
                    !_.find(state.multipleLayerImages, (el) => el.path == path && el.breathingPhase === breathingPhase)
                  ) {
                    commit('set', {
                      multipleLayerImages: [
                        ...state.multipleLayerImages,
                        { breathingPhase, fileName, path, zipPath, img: b64 },
                      ],
                    })

                    await new Promise((resolve) => {
                      fabric.Image.fromURL(b64, (img) => {
                        FABRIC_IMAGES_CACHE.push({
                          fileName,
                          img,
                          path,
                          zipPath,
                          breathingPhase,
                        })
                        resolve()
                      })
                    })
                  }
                }
                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
              .catch((error) => {
                console.error('Failed to unzip multiple layer images:', error)
                dispatch('updateProcessPercent', { processId, percent: 100 })
              })
          },
        })
      }
    },
    resetTimingDecisionState({ commit }) {
      commit('set', {
        isSetDefaultActiveTab: false,
        isConfirmedSetDelay: false,
        isPressInjectBeforePressScanButton: false,
        startTimingDecisionTime: null,
        isMovingMRIMachineToConfirmedPosition: false,
        isCountDownTimingDecisionQuestion: false,
        isMovedMRIPositionToCorrectZone: false,
        timingDecisionTestProcessInjectedStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
        timingDecisionContrast1InjectedStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
        timingDecisionContrast2InjectedStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
        timingDecisionInjectedStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
        timingDecisionActiveTab: 1,
        timingDecisionTestProcessDoneStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
        timingDecisionContrast1ProcessDoneStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
        timingDecisionContrast2ProcessDoneStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
        timingDecisionContrastProcessDoneStep: TIMING_DECISION_MAX_PRESENTATION_STEP,
        delayTimeFromStartTimingDecisionTimeToPressInjectButton: 0,
        digitalLocalizerMinStep: 0,
        digitalLocalizerMaxStep: NUM_OF_BODY_MAP_IMAGES - 1,
        previewContrast: 0.2,
      })
    },
    setDelayTimeFromStartTimingDecisionTimeToPressInjectButton({ commit, state }) {
      if (
        !_.isNil(state.startTimingDecisionTime) &&
        state.delayTimeFromStartTimingDecisionTimeToPressInjectButton == 0
      ) {
        const delayTime = (Date.now() - state.startTimingDecisionTime) / 1000
        commit('set', { delayTimeFromStartTimingDecisionTimeToPressInjectButton: _.round(delayTime) })
      }
    },
    setIsSetDefaultActiveTab({ commit }, payload) {
      commit('set', { isSetDefaultActiveTab: payload })
    },
    setTimingDecisionContrast2ProcessDoneStep({ commit }, payload) {
      commit('set', { timingDecisionContrast2ProcessDoneStep: payload })
    },
    setTimingDecisionContrastProcessDoneStep({ commit }, payload) {
      commit('set', { timingDecisionContrastProcessDoneStep: payload })
    },
    setTimingDecisionContrast1ProcessDoneStep({ commit }, payload) {
      commit('set', { timingDecisionContrast1ProcessDoneStep: payload })
    },
    setTimingDecisionContrast2InjectedStep({ commit }, payload) {
      commit('set', { timingDecisionContrast2InjectedStep: payload })
    },
    setTimingDecisionContrast1InjectedStep({ commit }, payload) {
      commit('set', { timingDecisionContrast1InjectedStep: payload })
    },
    setTimingDecisionTestProcessInjectedStep({ commit }, payload) {
      commit('set', { timingDecisionTestProcessInjectedStep: payload })
    },
    setTimingDecisionInjectedStep({ commit }, payload) {
      commit('set', { timingDecisionInjectedStep: payload })
    },
    setTimingDecisionTestProcessDoneStep({ commit }, payload) {
      commit('set', { timingDecisionTestProcessDoneStep: payload })
    },
    setIsConfirmedSetDelay({ commit }, payload) {
      commit('set', { isConfirmedSetDelay: payload })
    },
    setTimingDecisionActiveTab({ commit }, payload) {
      commit('set', { timingDecisionActiveTab: payload })
    },
    setIsPressInjectBeforePressScanButton({ commit }, payload) {
      commit('set', { isPressInjectBeforePressScanButton: payload })
    },
    setIsMovingMRIMachineToConfirmedPosition({ commit }, payload) {
      commit('set', { isMovingMRIMachineToConfirmedPosition: payload })
    },
    setIsCountDownTimingDecisionQuestion({ commit }, payload) {
      commit('set', { isCountDownTimingDecisionQuestion: payload })
    },
    setIsMovedMRIPositionToCorrectZone({ commit }, payload) {
      commit('set', { isMovedMRIPositionToCorrectZone: payload })
    },
    setStartTimingDecisionTime({ commit, state }, payload) {
      if (_.isNil(state.startTimingDecisionTime)) {
        commit('set', { startTimingDecisionTime: payload })
      }
    },
    setPreviewContrast({ commit }, payload) {
      commit('set', { previewContrast: payload })
    },
  },
  getters: {
    maximumDyeZone(state) {
      const getMaximumZone = (sliceDyesData) => {
        const maxDye = _.maxBy(sliceDyesData, (el) => el.ml)
        const maxDyeZone = _.filter(sliceDyesData, (el) => el.ml >= maxDye.ml * 0.9)
        const minSec = _.minBy(maxDyeZone, (el) => el.sec)
        const maxSec = _.maxBy(maxDyeZone, (el) => el.sec)
        return [minSec.sec, maxSec.sec]
      }
      const sliceDyesData = state.sliceDyesData
      const maximumZone = []
      sliceDyesData.forEach((el) => {
        maximumZone.push(getMaximumZone(el))
      })

      if (maximumZone.length == 0) {
        return [0, 0]
      }
      const minSec = _.maxBy(maximumZone, (el) => el[0])
      const maxSec = _.minBy(maximumZone, (el) => el[1])

      if (!minSec || !maxSec) {
        return [0, 0]
      }
      if (minSec[0] > maxSec[1]) {
        return [0, 0]
      }

      return [minSec[0], maxSec[1]]
    },
    preloadPercent(state) {
      if (state.preloadProcesses.length == 0) {
        return 100
      }
      const total = state.preloadProcesses.length * 100
      const loaded = state.preloadProcesses.reduce((acc, el) => acc + el.percent, 0)
      return _.round((loaded / total) * 100)
    },
    shouldAutoMoveToNextAfterTimingDecision(state, getters) {
      return getters.isSelectedBolusTrackingTimingDecision
    },
    isSelectedTestBolusTimingDecision(state, getters, rootState, rootGetters) {
      const isHideSetDelay = rootGetters['questionService/isHideSetDelay']
      return (
        (isHideSetDelay && state.timingDecisionActiveTab == 1) ||
        (!isHideSetDelay && state.timingDecisionActiveTab == 2)
      )
    },
    isSelectedBolusTrackingTimingDecision(state, getters, rootState, rootGetters) {
      const isHideSetDelay = rootGetters['questionService/isHideSetDelay']
      return (
        (isHideSetDelay && state.timingDecisionActiveTab == 0) ||
        (!isHideSetDelay && state.timingDecisionActiveTab == 1)
      )
    },
    isSelectedSetDelayTimingDecision(state, getters, rootState, rootGetters) {
      const isHideSetDelay = rootGetters['questionService/isHideSetDelay']
      return !isHideSetDelay && state.timingDecisionActiveTab == 0
    },
    isHasTestContrast(state, getters, rootState) {
      const testInjectorProtocol = rootState.questionService.testInjectorProtocol
      return (
        testInjectorProtocol == INJECTOR_PROTOCOLS.TEST_BOLUS_AND_TTP ||
        testInjectorProtocol == INJECTOR_PROTOCOLS.TEST_BOLUS_AND_TTP_BI_PHASIC
      )
    },
    isHasTwoPeriodContrast(state, getters, rootState) {
      const testInjectorProtocol = rootState.questionService.testInjectorProtocol
      return (
        testInjectorProtocol == INJECTOR_PROTOCOLS.BOLUS_BI_PHASIC ||
        testInjectorProtocol == INJECTOR_PROTOCOLS.TEST_AND_BOLUS_BI_PHASIC ||
        testInjectorProtocol == INJECTOR_PROTOCOLS.TEST_BOLUS_AND_TTP_BI_PHASIC
      )
    },
    multipleLayerImageGroupedByFolder(state) {
      const filteredImages = state.multipleLayerImages.filter((el) => el.zipPath == state.multipleLayerImagePath)
      return _.groupBy(filteredImages, (el) => el.fileName.split('.')[0])
    },
  },
}
export default timingDecisionService
