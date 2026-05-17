/* eslint-disable no-unused-vars */
import _ from 'lodash'
import moment from 'moment'

const state = {
  repetitionTime: null,
  scanTime: null,
  oversampling: null,
  sequenceType: null,
  data: {
    'Total scan duration': '03:32.5',
    'Rel.SNR': 0.877,
    'Act TR (ms)': 8500,
    'Act TE (ms)': 100,
    'ACQ matrix M x P': '384 X 254',
    'ACQ voxel MPS (mm)': '0.6 / 0.73 / 5.0',
    'REC voxel MPS (mm)': '0.45 / 0.45 / 5.0',
    'Scan percentage (%)': 82.2,
    Packages: 1,
    'Min. slice gap (mm)': 0,
    'WFS (pix) / BW (Hz)': '2.582 / 84.1',
    'TSE es / shot (ms)': '18.2 / 182',
    'TEeff / TEequiv (ms)': '100 / 90',
    'Min. TR(ms)': 4572,
    'Local torso SAR': '<' + 19 + '%',
    'Whole body SAR / level': '<' + 0.5 + 'W/kg/normal',
    SED: '<' + 0.1 + 'kj/kg',
    'Max B1+rms': 1.87 + ' uT',
    'PNS/level': 55 + '% / normal',
    'dB/dt': 51.0 + 'T/s',
    'Sound Pressure Level (dB)': 5.2,
  },
}

const mutations = {
  setMixinValues(state, payload) {
    state.repetitionTime = payload
  },
  setScanTime(state, payload) {
    console.log('set time ', payload)

    state.scanTime = payload
  },
  setSequenceType(state, payload) {
    console.log('set sequenceType ', payload)
    state.sequenceType = payload
  },
  setOversampling(state, value) {
    state.oversampling = value // Set oversampling value
  },
  // ✅ NEW MUTATION TO UPDATE PIXEL VALUE
  updateWfsPixcels(state, newPixelValue) {
    const oldVal = state.data['WFS (pix) / BW (Hz)'] || '0 / 0'
    const bwHz = newPixelValue * 32.6
    const newValue = `${parseFloat(newPixelValue).toFixed(3)} / ${parseFloat(bwHz).toFixed(3)}`
    state.data['WFS (pix) / BW (Hz)'] = newValue
  },
}

const actions = {
  // Update Repetition Time
  updateRepetitionTime({ commit }, value) {
    commit('setMixinValues', value)
  },

  // Update Scan Time
  updateScanTime({ commit }, value) {
    // Need checking!!!!
    // When commented out, the initial scantime becomes 0:02
    // When removing commenting, first scantime is 03:20, but NaNs in spatial resolution
    // if (_.isNil(newVal) || isNaN(newVal)) {
    // // if (_.isNil(newVal)) {
    //   console.warn('Invalid scanTime value, skipping update scan time:', newVal)
    //   return
    // }
    console.log('set time action', value)
    commit('setScanTime', value)
  },

  // Update Sequence Type
  updateSequenceType({ commit }, value) {
    console.log('set SequenceType action', value)
    commit('setSequenceType', value)
  },

  // Update Oversampling
  updateOversampling({ commit }, value) {
    commit('setOversampling', value)
  },
  // ✅ NEW ACTION TO DISPATCH IF NEEDED
  updateWfsPixcels({ commit }, value) {
    commit('updateWfsPixcels', value)
  },
}

const getters = {
  getrepetitionTime: (state) => state.repetitionTime,
  getscanTime: (state) => state.scanTime,
  getOversampling: (state) => state.oversampling,
  getSequenceType: (state) => state.sequenceType,
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}
