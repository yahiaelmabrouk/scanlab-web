const state = {
  TD: 1,
  selectedFatOption: 'None',
  selectedWaterOption: 'None',
  selectedMagnItems: 'None',
  fatSuppressionOptions: ['None', 'Fat Sat.', 'SPAIR'],
  waterSuppressionOptions: ['None', 'Water Sat.'],

  accelerationFactor: 1,
  maxRecommFactor: 1,
  referenceLines: 24,
  PATSelectedValue: 'Off',
  PATModeOptions: ['Off', 'GRAPPA', 'mSENSE'],
  matrixCoilSelectedValue: 'Auto(CP)',
  matrixCoilModeOptions: ['Auto(CP)', 'CP', 'Dual', 'Triple'],
  referenceScanSelectedValue: 'Integrated',
  referenceScanModeOptions: ['Integrated', 'Single-shot', 'Segmented', 'GRE'],

  selectedPosition: 'L65.5 P125.8 H0.0',
  positionOptions: ['Isocenter', 'L65.5 P125.8 H0.0'],
  diffusionMode: '3-Scan Trace',
  diffWeightedImages: false,
  traceWeightedImages: false,
  individualADCMaps: false,
  mosaic: false,
  noiseLevel: 50,
}

const mutations = {
  SET_TD(state, newVal) {
    state.TD = newVal
  },
  SET_FAT_OPTION(state, newVal) {
    state.selectedFatOption = newVal
  },
  SET_WATER_OPTION(state, newVal) {
    state.selectedWaterOption = newVal
  },
  SET_MAGN_ITEMS(state, newVal) {
    state.selectedMagnItems = newVal
  },
  SET_ACCELERATION_FACTOR(state, value) {
    state.accelerationFactor = value
  },
  SET_MAX_RECOMM_FACTOR(state, value) {
    state.maxRecommFactor = value
  },
  SET_REFERENCE_LINES(state, value) {
    state.referenceLines = value
  },
  SET_PAT_SELECTED_VALUE(state, value) {
    state.PATSelectedValue = value
  },
  SET_MATRIX_COIL_SELECTED_VALUE(state, value) {
    state.matrixCoilSelectedValue = value
  },
  SET_REFERENCE_SCAN_SELECTED_VALUE(state, value) {
    state.referenceScanSelectedValue = value
  },
  SET_POSITION_SELECTED_VALUE(state, value) {
    state.selectedPosition = value
  },
  SET_DIFFUSION_MODE(state, value) {
    state.diffusionMode = value
  },
  SET_DIFF_WEIGHTED_IMAGES(state, value) {
    state.diffWeightedImages = value
  },
  SET_TRACE_WEIGHTED_IMAGES(state, value) {
    state.traceWeightedImages = value
  },
  SET_INDIVIDUAL_ADC_MAPS(state, value) {
    state.individualADCMaps = value
  },
  SET_MOSAIC(state, value) {
    state.mosaic = value
  },
  SET_NOISE_LEVEL(state, value) {
    state.noiseLevel = value
  },
}
const actions = {
  updateTD({ commit }, newVal) {
    commit('SET_TD', newVal)
  },
  updateFatOption({ commit }, newVal) {
    commit('SET_FAT_OPTION', newVal)
  },
  updateWaterOption({ commit }, newVal) {
    commit('SET_WATER_OPTION', newVal)
  },
  updateMagnItems({ commit }, newVal) {
    commit('SET_MAGN_ITEMS', newVal)
  },
  updateAccelerationFactor({ commit }, value) {
    commit('SET_ACCELERATION_FACTOR', value)
  },
  updateMaxRecommFactor({ commit }, value) {
    commit('SET_MAX_RECOMM_FACTOR', value)
  },
  updateReferenceLines({ commit }, value) {
    commit('SET_REFERENCE_LINES', value)
  },
  updatePATSelectedValue({ commit }, value) {
    commit('SET_PAT_SELECTED_VALUE', value)
  },
  updatePositionSelectedValue({ commit }, value) {
    commit('SET_POSITION_SELECTED_VALUE', value)
  },
  updateMatrixCoilSelectedValue({ commit }, value) {
    commit('SET_MATRIX_COIL_SELECTED_VALUE', value)
  },
  updateReferenceScanSelectedValue({ commit }, value) {
    commit('SET_REFERENCE_SCAN_SELECTED_VALUE', value)
  },
  updateDiffusionMode({ commit }, value) {
    commit('SET_DIFFUSION_MODE', value)
  },
  updateDiffWeightedImages({ commit }, value) {
    commit('SET_DIFF_WEIGHTED_IMAGES', value)
  },
  updateTraceWeightedImages({ commit }, value) {
    commit('SET_TRACE_WEIGHTED_IMAGES', value)
  },
  updateIndividualADCMaps({ commit }, value) {
    commit('SET_INDIVIDUAL_ADC_MAPS', value)
  },
  updateMosaic({ commit }, value) {
    commit('SET_MOSAIC', value)
  },
  updateNoiseLevel({ commit }, value) {
    commit('SET_NOISE_LEVEL', value)
  },
}

const getters = {
  getTD: (state) => state.TD,
  getSelectedFatOption: (state) => state.selectedFatOption,
  getSelectedWaterOption: (state) => state.selectedWaterOption,
  getSelectedMagnItems: (state) => state.selectedMagnItems,
  getFatSuppressionOptions: (state) => state.fatSuppressionOptions,
  getWaterSuppressionOptions: (state) => state.waterSuppressionOptions,
  getAccelerationFactor: (state) => state.accelerationFactor,
  getMaxRecommFactor: (state) => state.maxRecommFactor,
  getReferenceLines: (state) => state.referenceLines,
  getPATModeSelected: (state) => state.PATSelectedValue,
  getPositionSelectedValue: (state) => state.selectedPosition,

  getPositionOptions: (state) => state.positionOptions,
  getPATModeOptions: (state) => state.PATModeOptions,
  getMatrixCoilSelectedValue: (state) => state.matrixCoilSelectedValue,
  getMatrixCoilModeOptions: (state) => state.matrixCoilModeOptions,
  getReferenceScanSelectedValue: (state) => state.referenceScanSelectedValue,
  getReferenceScanModeOptions: (state) => state.referenceScanModeOptions,

  getDiffusionMode: (state) => state.diffusionMode,
  getDiffWeightedImages: (state) => state.diffWeightedImages,
  getTraceWeightedImages: (state) => state.traceWeightedImages,
  getIndividualADCMaps: (state) => state.individualADCMaps,
  getMosaic: (state) => state.mosaic,
  getNoiseLevel: (state) => state.noiseLevel,
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}
