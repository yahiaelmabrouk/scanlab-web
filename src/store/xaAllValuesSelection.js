const state = {
  diffusionMode: '3-Scan Trace',
  diffusionScheme: 'Monopolar',
  invertGrayScale: false,
  diffWeightedImages: false,
  traceWeightedImages: false,
  expAdcMaps: false,
  bValueGreaterOrEqual: 0,
  adcNoiseThreshold: 50,
  noiseMasking: false,
  calculatedBValue: false,
  calculatedBValueInput: 1500,
}

const mutations = {
  SET_DIFFUSION_MODE(state, diffusionMode) {
    state.diffusionMode = diffusionMode
  },
  SET_DIFFUSION_SCHEME(state, diffusionScheme) {
    state.diffusionScheme = diffusionScheme
  },
  SET_INVERT_GRAYSCALE(state, invertGrayScale) {
    state.invertGrayScale = invertGrayScale
  },
  SET_DIFF_WEIGHTED_IMAGES(state, diffWeightedImages) {
    state.diffWeightedImages = diffWeightedImages
  },
  SET_TRACE_WEIGHTED_IMAGES(state, traceWeightedImages) {
    state.traceWeightedImages = traceWeightedImages
  },
  SET_EXP_ADC_MAPS(state, expAdcMaps) {
    state.expAdcMaps = expAdcMaps
  },
  SET_B_VALUE_GREATER_OR_EQUAL(state, bValueGreaterOrEqual) {
    state.bValueGreaterOrEqual = bValueGreaterOrEqual
  },
  SET_ADC_NOISE_THRESHOLD(state, adcNoiseThreshold) {
    state.adcNoiseThreshold = adcNoiseThreshold
  },
  SET_NOISE_MASKING(state, noiseMasking) {
    state.noiseMasking = noiseMasking
  },
  SET_CALCULATED_B_VALUE(state, calculatedBValue) {
    state.calculatedBValue = calculatedBValue
  },
  SET_CALCULATED_B_VALUE_INPUT(state, calculatedBValueInput) {
    state.calculatedBValueInput = calculatedBValueInput
  },
}

const actions = {
  setDiffusionMode({ commit }, diffusionMode) {
    commit('SET_DIFFUSION_MODE', diffusionMode)
  },
  setDiffusionScheme({ commit }, diffusionScheme) {
    commit('SET_DIFFUSION_SCHEME', diffusionScheme)
  },
  setInvertGrayScale({ commit }, invertGrayScale) {
    commit('SET_INVERT_GRAYSCALE', invertGrayScale)
  },
  setDiffWeightedImages({ commit }, diffWeightedImages) {
    commit('SET_DIFF_WEIGHTED_IMAGES', diffWeightedImages)
  },
  setTraceWeightedImages({ commit }, traceWeightedImages) {
    commit('SET_TRACE_WEIGHTED_IMAGES', traceWeightedImages)
  },
  setExpAdcMaps({ commit }, expAdcMaps) {
    commit('SET_EXP_ADC_MAPS', expAdcMaps)
  },
  setBValueGreaterOrEqual({ commit }, bValueGreaterOrEqual) {
    commit('SET_B_VALUE_GREATER_OR_EQUAL', bValueGreaterOrEqual)
  },
  setAdcNoiseThreshold({ commit }, adcNoiseThreshold) {
    commit('SET_ADC_NOISE_THRESHOLD', adcNoiseThreshold)
  },
  setNoiseMasking({ commit }, noiseMasking) {
    commit('SET_NOISE_MASKING', noiseMasking)
  },
  setCalculatedBValue({ commit }, calculatedBValue) {
    commit('SET_CALCULATED_B_VALUE', calculatedBValue)
  },
  setCalculatedBValueInput({ commit }, calculatedBValueInput) {
    commit('SET_CALCULATED_B_VALUE_INPUT', calculatedBValueInput)
  },
}

const getters = {
  getDiffusionMode: (state) => state.diffusionMode,
  getDiffusionScheme: (state) => state.diffusionScheme,
  getInvertGrayScale: (state) => state.invertGrayScale,
  getDiffWeightedImages: (state) => state.diffWeightedImages,
  getTraceWeightedImages: (state) => state.traceWeightedImages,
  getExpAdcMaps: (state) => state.expAdcMaps,
  getBValueGreaterOrEqual: (state) => state.bValueGreaterOrEqual,
  getAdcNoiseThreshold: (state) => state.adcNoiseThreshold,
  getNoiseMasking: (state) => state.noiseMasking,
  getCalculatedBValue: (state) => state.calculatedBValue,
  getCalculatedBValueInput: (state) => state.calculatedBValueInput,
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}
