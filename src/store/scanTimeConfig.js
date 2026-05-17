/* eslint-disable no-prototype-builtins */
import _ from 'lodash'

const state = {
  localSoftwareVersionPreference: '',
  minSeqTRfuture: 0,
  minConcatAcqPackagefuture: 0,
  activeButtons: [],
  availableFieldStrengths: [],
  repetitionTime: 0,
  echoTime: 0,
  flipAngle: 0,
  slices: 0,
  phaseEncodingLines: 0,
  parallelFactor: 1,
  scanTime: null,
  oversampling: 0.1,
  oversamplingPercentage: 0,
  phaseMatrix: 0,
  frequencyMatrix: 0,
  dimensions3x: 0,
  dimensions3y: 0,
  partialFourier: 'Off',
  averages: 1,
  concatenations: 1,
  echoTrainLength: 1,
  vendorStylePreference: '',
  isUltraLab: false,
  selectionIdent: '',
  sequenceType: '',
  trueResolutionHeaderUltra: null,
  trueResolutionHeader: null,
  acquiredResolutionHeader: null,
  selectedAutoAlign: 'None',
  autoAlignOptions: [
    'None',
    'Head > Basis',
    'Head > Brain',
    'Head > IAC',
    'Head > Orbits',
    'Head > Optic Nerves',
    'Head > Optic Nerve L',
    'Head > Optic Nerve R',
    'Head > Temporal Lobe',
    'Spine > Cervical',
    'Spine > Thoracic',
    'Spine > Lumbar',
    'Shoulder > Para Sag',
    'Shoulder > Para Cor',
    'Shoulder > Para Tra',
    'Knee > Standard',
    'Knee > Meniscus',
    'Knee > Patella routine',
    'Knee > Patella Cartilage',
    'Knee > Femur Cartilage',
    'Knee > PCL',
    'Knee > ACL (S>C)',
    'Knee > ACL (S>T)',
    'Hip > Cor L+R',
    'Hip > Tra L+R',
    'Hip > Tra',
    'Hip > Para Tra',
    'Hip > Para Cor',
    'Hip > Para Sag',
    'Hip > Femur Neck',
    'Hip > Tra L',
    'Hip > Para Tra L',
    'Hip > Para Cor L',
    'Hip > Para Sag L',
    'Hip > Femur Neck L',
    'Hip > Tra R',
    'Hip > Para Tra R',
    'Hip > Para Cor R',
    'Hip > Para Sag R',
    'Hip > Femur Neck R',
  ],
  selectedFatOptions: 'Standard',
  fatOptions: ['Standard', 'Fat Saturation', 'SPAIR', 'Dixon', 'Q-Fat Sat'],
  //selectedMagnItems: 'Off',
  magnItems: ['Off', '<Non-sel. IR>'],
  isCheckboxChecked: false,
  phaseCorrectionValue: 'Automatic',
  phaseCorrectionOptions: ['Automatic', 'Off', 'On'],
  selectedAcousticNoiseReduction: 'Off',
  acousticNoiseReduction: ['Off', 'On'],
  selectedMotionCrr: 'Off',
  MotionCrr: ['Off', 'On'],
  selectedAcceleration: 'Off',
  referenceScans: 'TSE/Separate',
  accelFactor3D: 2,
  shift3D: 1,
  deepResolve: 'Off',
  phasePartialFourier: 'Off',
  slicePartialFourier: 'Off',
  readoutPartialFourier: 'Off',
  asymmetricEcho: 'Off',
  SMSFactor: 2,
  fovShift: 1,
  referenceLines: 24,
  mode: 'Axial',
  minConcatAcqPackage: 0,
  adjustmentStrategyValue: 'Standard',
  B0ShimValue: 'Standard',
  selectedTolerance: 'Auto(Maximum)',
  selectedFrequency: 'Never',

  // Static options
  adjustmentStrategyOptions: ['Standard', 'Fast View'],
  B0ShimOptions: [
    'Standard',
    'Standard Neck',
    'Advanced',
    'Cardiac',
    'Brain',
    'Breast',
    'Prostate',
    'Foot/Ankle',
    'Abdomen',
    'Absolute',
  ],
  toleranceOptions: ['Auto(Maximum)', 'None', 'Maximum'],
  frequencyOptions: ['Always', 'Never', 'When Changed'],

  // Philips Data store
  // Routine Tab
  APFOV: 240,
  RLFOV: 100,
  FHFOV: 60,
  APVoxel: 0.9,
  RLVoxel: 1.95,
  FHVoxel: 3,
  APMatrix: 308,
  RLMatrix: 126,
  FHMatrix: 3,
  defaultTxt: 10,
  TRSYNC: 1,
  TESYNC: 1,
  NSA: 1,
  isCheckedGap: false,
  isCheckedFS: false,
  textColorText: 'black',
  // Routine Tab
  // Geometry tab
  // Selected values
  selectedUniformity: 'Clear',
  selectedFoldOverSuppression: 'no',
  selectedSENSE: 'no',
  selectedCSSENSE: 'no',
  selecteddenoising: 'systemDefault',
  selectedktAcceleration: 'no',
  selectedtype: 'parallel',
  selectedsliceGap: 'userDefined',
  selectedSliceOrientation: 'transverse',
  selectedfoldOverDirection: 'RL',
  selectedfatShiftDirection: 'P',
  selectedSliceScanOrder: 'interleaved',
  selectedPlanAlign: 'no',
  selectedOMAR: 'no',
  selectedFreetype: 'free (parallel)',
  selectedOrientation: 'coronal (transvers)',
  selectedInteractivePositioning: 'no',

  // Numerical values
  // FOVAP: 230,
  // FOV_RL: 137,
  // FH: 230,
  ACQVoxelSizeAP: 0.599,
  ACQ_FH: 0.75,
  sliceThick: 5,
  ReconVoxelSizeAP: 0.399,
  ReconFH: 0.399,
  ReconstructionMatrix: 768,
  reduction: 2.15,
  stacks: 1,
  MinimumNoofpa: 1,
  RESTSlabs: 1,
  // thickness: 60,
  // numberOfSlices: 1,
  // spacing: 1,

  // Dropdown options
  uniformity: [
    { text: 'Clear', value: 'Clear' },
    { text: 'Body-tuned', value: 'BodyTuned' },
    { text: 'Synergy', value: 'synergy' },
    { text: 'Classic', value: 'classic' },
  ],
  FoldOverSuppression: [
    { text: 'No', value: 'no' },
    { text: 'Oversampling', value: 'oversampling' },
    { text: 'Rest', value: 'rest' },
    { text: 'Zoom', value: 'zoom' },
  ],
  SENSE: [
    { text: 'No', value: 'no' },
    { text: 'Yes', value: 'yes' },
  ],
  CSSENSE: [
    { text: 'No', value: 'no' },
    { text: 'Yes', value: 'yes' },
  ],
  denoising: [
    { text: 'No', value: 'no' },
    { text: 'Weak', value: 'weak' },
    { text: 'Medium', value: 'medium' },
    { text: 'Strong', value: 'strong' },
    { text: 'system default', value: 'systemDefault' },
    { text: 'User defined', value: 'userDefined' },
  ],
  ktAcceleration: [
    { text: 'No', value: 'no' },
    { text: 'k-t BLAST', value: 'ktBLAST' },
    { text: 'k-t SENSE', value: 'ktSENSE' },
  ],
  type: [
    { text: 'Parallel', value: 'parallel' },
    { text: 'Radial', value: 'radial' },
  ],
  sliceGap: [
    { text: 'User defined', value: 'userDefined' },
    { text: 'Default', value: 'default' },
  ],
  SliceOrientation: [
    { text: 'Transverse', value: 'transverse' },
    { text: 'Sagittal', value: 'sagittal' },
    { text: 'Coronal', value: 'coronal' },
  ],
  foldOverDirection: [
    { text: 'RL', value: 'RL' },
    { text: 'AP', value: 'AP' },
  ],
  fatShiftDirection: [
    { text: 'P', value: 'P' },
    { text: 'A', value: 'A' },
  ],
  SliceScanOrder: [
    { text: 'Default', value: 'default' },
    { text: 'FH', value: 'FH' },
    { text: 'HF', value: 'HF' },
    { text: 'Rev. Central', value: 'revCentral' },
    { text: 'Interleaved', value: 'interleaved' },
  ],
  OMAR: [
    { text: 'No', value: 'no' },
    { text: 'MARS+VAT', value: 'MARS+VAT' },
    { text: 'SEMAC+VAT', value: 'SEMAC+VAT' },
  ],
  distortionCorrection: [
    { text: 'Weak', value: 'weak' },
    { text: 'Medium', value: 'medium' },
    { text: 'Strong', value: 'strong' },
  ],
  PlanAlign: [
    { text: 'No', value: 'no' },
    { text: 'Yes', value: 'yes' },
  ],
  Freetype: [{ text: 'free (parallel)', value: 'free (parallel)' }],
  orientation: [
    { text: 'coronal (transvers)', value: 'coronal (transvers)' },
    { text: 'sagittal (transvers)', value: 'sagittal (transvers)' },
    { text: 'transvers', value: 'transvers' },
  ],
  InteractivePositioning: [
    { text: 'No', value: 'no' },
    { text: 'Yes', value: 'yes' },
  ],
  // Geometry tab
  // Philips Data store

  formData: {}, // Current form data
  originalData: {}, // Data to revert to on cancel
  isEditable: false, // Controls if form inputs are enabled
  isScrollableDisabled: false,
}

const mutations = {
  disableScrollable(state) {
    state.isScrollableDisabled = true
  },
  enableScrollable(state) {
    state.isScrollableDisabled = false
  },
  setFormData(state, payload) {
    state.formData = { ...payload }
    state.originalData = { ...payload } // Copy original data for revert
  },
  updateFormData(state, { key, value }) {
    state.formData[key] = value
  },
  setEditable(state, isEditable) {
    state.isEditable = isEditable
  },
  revertFormData(state) {
    state.formData = { ...state.originalData }
  },
  SET_LOCAL_SOFTWARE_VERSION_PREFERENCE(state, value) {
    state.localSoftwareVersionPreference = value
  },
  setMinSeqTRfuture(state, payload) {
    state.minSeqTRfuture = payload
  },
  setMinConcatAcqPackagefuture(state, payload) {
    // console.log("setMinConcatAcqPackagefuture=======",payload);

    state.minConcatAcqPackagefuture = payload
  },
  SET_ACTIVE_BUTTONS(state, activeButtons) {
    state.activeButtons = activeButtons
  },
  MinConcatAcqPackage(state, minConcatAcqPackage) {
    state.minConcatAcqPackage = minConcatAcqPackage
  },
  setAutoalign(state, payload) {
    state.selectedAutoAlign = payload // Array ko update karna
  },
  SET_SELECTED_FAT_OPTIONS(state, payload) {
    state.selectedFatOptions = payload
  },
  setMagnItems(state, payload) {
    state.selectedMagnItems = payload // Array ko update karna
  },
  setAvailableFieldStrengths(state, payload) {
    state.availableFieldStrengths = payload // Array ko update karna
  },
  setAccelFactorPE(state, payload) {
    state.accelFactorPE = payload // Array ko update karna
  },

  SET_SCAN_TIME(state, value) {
    console.log('SET_SCAN_TIME======', value)

    state.scanTime = value
  },
  SET_REPETITION_TIME(state, value) {
    state.repetitionTime = value
    // console.log(`SET_REPETITION_TIME: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_ECHO_TIME(state, value) {
    state.echoTime = value
    // console.log(`SET_ECHO_TIME: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_FLIP_ANGLE(state, value) {
    state.flipAngle = value
    // console.log(`SET_FLIP_ANGLE: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_SLICES(state, value) {
    state.slices = value
    // console.log(`SET_SLICES: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_PHASE_ENCODING_LINES(state, value) {
    state.phaseEncodingLines = value
    // console.log(`SET_PHASE_ENCODING_LINES: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_PARALLEL_FACTOR(state, value) {
    state.parallelFactor = value
    // console.log(`SET_PARALLEL_FACTOR: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_OVERSAMPLING(state, value) {
    state.oversampling = _.round(value * 100, 1)
    state.oversampling = state.oversampling / 1000
    state.oversamplingPercentage = _.round(value * 100, 1)
  },
  SET_OVERSAMPLING_PERCENTAGE(state, value) {
    state.oversamplingPercentage = value
    state.oversampling = value / 100
  },
  SET_PHASE_MATRIX(state, value) {
    state.phaseMatrix = value
    // console.log(`SET_PHASE_MATRIX: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_FREQUENCY_MATRIX(state, value) {
    state.frequencyMatrix = value
    // console.log(`SET_FREQUENCY_MATRIX: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_DIMENSIONS_3X(state, value) {
    state.dimensions3x = value
    // console.log(`SET_DIMENSIONS_3X: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_DIMENSIONS_3Y(state, value) {
    state.dimensions3y = value
    // console.log(`SET_DIMENSIONS_3Y: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_PARTIAL_FOURIER(state, value) {
    state.partialFourier = value
    // console.log(`SET_PARTIAL_FOURIER: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_AVERAGES(state, value) {
    state.averages = value
    // console.log(`SET_AVERAGES: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_CONCATENATIONS(state, value) {
    state.concatenations = value
    // console.log(`SET_CONCATENATIONS: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_ECHO_TRAIN_LENGTH(state, value) {
    state.echoTrainLength = value
    // console.log(`SET_ECHO_TRAIN_LENGTH: ${value}`)
    // console.log('state.echoTrainLength', state)
  },
  SET_VENDOR_STYLE_PREFERENCE(state, value) {
    state.vendorStylePreference = value
    // console.log(`SET_VENDOR_STYLE_PREFERENCE: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_IS_ULTRALAB(state, value) {
    state.isUltraLab = value
    // console.log(`SET_IS_ULTRALAB: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_SELECTION_IDENT(state, value) {
    state.selectionIdent = value
    // console.log(`SET_SELECTION_IDENT: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_SEQUENCE_TYPE(state, value) {
    state.sequenceType = value
    // console.log(`SET_SEQUENCE_TYPE: ${value}`)
    // console.log('Updated State:', state)
  },
  SET_TRUE_RESOLUTION_HEADER_ULTRA(state, newVal) {
    // console.log('SET_TRUE_RESOLUTION_HEADER_ULTRA',newVal);

    state.trueResolutionHeaderUltra = newVal
  },
  SET_TRUE_RESOLUTION_HEADER(state, newVal) {
    state.trueResolutionHeader = newVal
  },
  SET_ACQUIRED_RESOLUTION_HEADER(state, newVal) {
    state.acquiredResolutionHeader = newVal
  },
  SET_CHECKBOX_CHECKED(state, value) {
    state.isCheckboxChecked = value
  },
  SET_PHASE_CORRECTION_VALUE(state, value) {
    state.phaseCorrectionValue = value
  },
  SET_ACOUSTIC_NOISE_REDUCTION(state, value) {
    state.selectedAcousticNoiseReduction = value
  },
  SET_MOTION_CORRECTION(state, value) {
    state.selectedMotionCrr = value
  },
  SET_SELECTED_ACCELERATION(state, payload) {
    // console.log("SET_SELECTED_ACCELERATION=====",payload);

    state.selectedAcceleration = payload
    if (payload === 'Off') {
      state.accelFactorPE = 1
    } else if (payload === 'Grappa') {
      state.accelFactorPE = 2
    }
  },
  SET_REFERENCE_SCANS(state, payload) {
    state.referenceScans = payload
  },
  SET_ACCEL_FACTOR_PE(state, payload) {
    state.accelFactorPE = payload
  },
  SET_ACCEL_FACTOR_3D(state, payload) {
    state.accelFactor3D = payload
  },
  SET_SHIFT_3D(state, payload) {
    state.shift3D = payload
  },
  SET_DEEP_RESOLVE(state, payload) {
    state.deepResolve = payload
  },
  SET_PHASE_PARTIAL_FOURIER(state, payload) {
    state.phasePartialFourier = payload
  },
  SET_SLICE_PARTIAL_FOURIER(state, payload) {
    state.slicePartialFourier = payload
  },
  SET_READOUT_PARTIAL_FOURIER(state, payload) {
    state.readoutPartialFourier = payload
  },
  SET_ASYMMETRIC_ECHO(state, payload) {
    state.asymmetricEcho = payload
  },
  SET_SMS_FACTOR(state, payload) {
    state.SMSFactor = payload
  },
  SET_FOV_SHIFT(state, payload) {
    state.fovShift = payload
  },
  SET_REFERENCE_LINES(state, value) {
    state.referenceLines = value
  },
  SET_MODE(state, value) {
    state.mode = value
  },
  SET_ADJUSTMENT_STRATEGY(state, value) {
    state.adjustmentStrategyValue = value
  },
  SET_B0_SHIM(state, value) {
    state.B0ShimValue = value
  },
  SET_SELECTED_TOLERANCE(state, value) {
    state.selectedTolerance = value
  },
  SET_SELECTED_FREQUENCY(state, value) {
    state.selectedFrequency = value
  },

  // philips Mutation
  SET_APFOV(state, value) {
    state.APFOV = value
  },
  SET_RLFOV(state, value) {
    state.RLFOV = value
  },
  SET_FHFOV(state, value) {
    state.FHFOV = value
  },
  SET_APVOXEL(state, value) {
    state.APVoxel = value
  },
  SET_TRSYNC(state, value) {
    state.TRSYNC = value
  },
  SET_TESYNC(state, value) {
    state.TESYNC = value
  },
  SET_RLVOXEL(state, value) {
    state.RLVoxel = value
  },
  SET_FHVOXEL(state, value) {
    state.FHVoxel = value
  },
  SET_APMATRIX(state, value) {
    state.APMatrix = value
  },
  SET_RLMATRIX(state, value) {
    state.RLMatrix = value
  },
  SET_FHMATRIX(state, value) {
    state.FHMatrix = value
  },
  SET_DEFAULTTXT(state, value) {
    state.defaultTxt = value
  },
  SET_NSA(state, value) {
    state.NSA = value
  },
  SET_IS_CHECKED_GAP(state, value) {
    state.isCheckedGap = value
  },
  SET_IS_CHECKED_FS(state, value) {
    state.isCheckedFS = value
  },
  SET_TEXT_COLOR_TEXT(state, value) {
    state.textColorText = value
  },
  SET_SELECTED_UNIFORMITY(state, value) {
    state.selectedUniformity = value
  },
  SET_SELECTED_FOLD_OVER_SUPPRESSION(state, value) {
    state.selectedFoldOverSuppression = value
  },
  SET_SELECTED_SENSE(state, value) {
    state.selectedSENSE = value
  },
  SET_SELECTED_CSSENSE(state, value) {
    state.selectedCSSENSE = value
  },
  SET_SELECTED_DENOISING(state, value) {
    state.selecteddenoising = value
  },
  SET_SELECTED_KT_ACCELERATION(state, value) {
    state.selectedktAcceleration = value
  },
  SET_SELECTED_TYPE(state, value) {
    state.selectedtype = value
  },
  SET_SELECTED_SLICE_GAP(state, value) {
    state.selectedsliceGap = value
  },
  SET_SELECTED_SLICE_ORIENTATION(state, value) {
    state.selectedSliceOrientation = value
  },
  SET_SELECTED_FOLD_OVER_DIRECTION(state, value) {
    state.selectedfoldOverDirection = value
  },
  SET_SELECTED_FAT_SHIFT_DIRECTION(state, value) {
    state.selectedfatShiftDirection = value
  },
  SET_SELECTED_SLICE_SCAN_ORDER(state, value) {
    state.selectedSliceScanOrder = value
  },
  SET_SELECTED_PLAN_ALIGN(state, value) {
    state.selectedPlanAlign = value
  },
  SET_SELECTED_OMAR(state, value) {
    state.selectedOMAR = value
  },
  SET_SELECTED_FREETYPE(state, value) {
    state.selectedFreetype = value
  },
  SET_SELECTED_ORIENTATION(state, value) {
    state.selectedOrientation = value
  },
  SET_SELECTED_INTERACTIVE_POSITIONING(state, value) {
    state.selectedInteractivePositioning = value
  },
  SET_ACQ_VOXEL_SIZE_AP(state, value) {
    state.ACQVoxelSizeAP = value
  },
  SET_ACQ_FH(state, value) {
    state.ACQ_FH = value
  },
  SET_SLICE_THICK(state, value) {
    state.sliceThick = value
  },
  SET_RECON_VOXEL_SIZE_AP(state, value) {
    state.ReconVoxelSizeAP = value
  },
  SET_RECON_FH(state, value) {
    state.ReconFH = value
  },
  SET_RECONSTRUCTION_MATRIX(state, value) {
    state.ReconstructionMatrix = value
  },
  SET_REDUCTION(state, value) {
    state.reduction = value
  },
  SET_STACKS(state, value) {
    state.stacks = value
  },
  SET_MINIMUM_NO_OF_PA(state, value) {
    state.MinimumNoofpa = value
  },
  SET_REST_SLABS(state, value) {
    state.RESTSlabs = value
  },
  // philips Mutation
}
const actions = {
  initializeFormData({ commit }, data) {
    commit('setFormData', data)
  },
  updateField({ commit }, data) {
    commit('updateFormData', data)
  },
  toggleEditable({ commit }, flag) {
    commit('setEditable', flag)
  },
  acceptChanges({ commit }) {
    commit('setFormData', this.state.scanTimeConfig.formData) // Accept changes by setting originalData to current formData
    commit('setEditable', false)
    commit('disableScrollable')
  },
  cancelChanges({ commit }) {
    commit('revertFormData') // Revert to original data
    commit('setEditable', false)
    // commit('enableScrollable')
    commit('disableScrollable')
  },
  tabChange({ commit }) {
    commit('enableScrollable')
  },
  updateLocalSoftwareVersionPreference({ commit }, value) {
    commit('SET_LOCAL_SOFTWARE_VERSION_PREFERENCE', value)
  },
  updateActiveButtons({ commit }, buttons) {
    commit('SET_ACTIVE_BUTTONS', buttons)
  },
  updateMinConcatAcqPackage({ commit }, buttons) {
    commit('MinConcatAcqPackage', buttons)
  },
  updateAvailableFieldStrengths({ commit }, payload) {
    commit('setAvailableFieldStrengths', payload) // Mutation ko trigger karna
  },
  updateAccelFactorPE({ commit }, payload) {
    commit('setAccelFactorPE', payload) // Mutation ko trigger karna
  },
  updateAutoalign({ commit }, payload) {
    commit('setAutoalign', payload) // Mutation ko trigger karna
  },
  updateSelectedFatOptions({ commit }, value) {
    commit('SET_SELECTED_FAT_OPTIONS', value)
  },
  updateMagnItems({ commit }, payload) {
    commit('setMagnItems', payload) // Mutation ko trigger karna
  },
  updateScanTime({ commit }, value) {
    console.log('scanTime in scantime config-----', value)

    commit('SET_SCAN_TIME', value)
  },
  updateRepetitionTime({ commit }, value) {
    commit('SET_REPETITION_TIME', value)
    // commit('UPDATE_SCAN_TIME')
  },
  updateEchoTime({ commit }, value) {
    // console.log(`Action: updateEchoTime with value ${value}`)
    commit('SET_ECHO_TIME', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateFlipAngle({ commit }, value) {
    // console.log(`Action: updateFlipAngle with value ${value}`)
    commit('SET_FLIP_ANGLE', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateSlices({ commit }, value) {
    // console.log(`Action: updateSlices with value ${value}`)
    commit('SET_SLICES', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updatePhaseEncodingLines({ commit }, value) {
    // console.log(`Action: updatePhaseEncodingLines with value ${value}`)
    commit('SET_PHASE_ENCODING_LINES', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateParallelFactor({ commit }, value) {
    // console.log(`Action: updateParallelFactor with value ${value}`)
    commit('SET_PARALLEL_FACTOR', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateOversampling({ commit }, value) {
    // console.log(`Action: updateOversampling with value ${value}`)
    commit('SET_OVERSAMPLING', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updatePhaseMatrix({ commit }, value) {
    // console.log(`Action: updatePhaseMatrix with value ${value}`)
    commit('SET_PHASE_MATRIX', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateFrequencyMatrix({ commit }, value) {
    // console.log(`Action: updateFrequencyMatrix with value ${value}`)
    commit('SET_FREQUENCY_MATRIX', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateDimensions3x({ commit }, value) {
    // console.log(`Action: updateDimensions3x with value ${value}`)
    commit('SET_DIMENSIONS_3X', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateDimensions3y({ commit }, value) {
    // console.log(`Action: updateDimensions3y with value ${value}`)
    commit('SET_DIMENSIONS_3Y', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updatePartialFourier({ commit }, value) {
    // console.log(`Action: updatePartialFourier with value ${value}`)
    commit('SET_PARTIAL_FOURIER', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateAverages({ commit }, value) {
    // console.log(`Action: updateAverages with value ${value}`)
    commit('SET_AVERAGES', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateConcatenations({ commit }, value) {
    // console.log(`Action: updateConcatenations with value ${value}`)
    commit('SET_CONCATENATIONS', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateEchoTrainLength({ commit }, value) {
    // console.log(`Action: updateEchoTrainLength with value ${value}`)
    commit('SET_ECHO_TRAIN_LENGTH', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateVendorStylePreference({ commit }, value) {
    // console.log(`Action: updateVendorStylePreference with value ${value}`)
    commit('SET_VENDOR_STYLE_PREFERENCE', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateIsUltraLab({ commit }, value) {
    // console.log(`Action: updateIsUltraLab with value ${value}`)
    commit('SET_IS_ULTRALAB', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateSelectionIdent({ commit }, value) {
    // console.log(`Action: updateSelectionIdent with value ${value}`)
    commit('SET_SELECTION_IDENT', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateSequenceType({ commit }, value) {
    // console.log(`Action: updateSequenceType with value ${value}`)
    commit('SET_SEQUENCE_TYPE', value)
    //commit('UPDATE_SCAN_TIME')
  },
  updateTrueResolutionHeaderUltra({ commit }, newVal) {
    commit('SET_TRUE_RESOLUTION_HEADER_ULTRA', newVal)
  },
  updateTrueResolutionHeader({ commit }, newVal) {
    commit('SET_TRUE_RESOLUTION_HEADER', newVal)
  },
  updateAcquiredResolutionHeader({ commit }, newVal) {
    commit('SET_ACQUIRED_RESOLUTION_HEADER', newVal)
  },
  updateCheckboxChecked({ commit }, value) {
    commit('SET_CHECKBOX_CHECKED', value)
  },
  updatePhaseCorrectionValue({ commit }, value) {
    commit('SET_PHASE_CORRECTION_VALUE', value)
  },
  updateAcousticNoiseReduction({ commit }, value) {
    commit('SET_ACOUSTIC_NOISE_REDUCTION', value)
  },
  updateMotionCorrection({ commit }, value) {
    commit('SET_MOTION_CORRECTION', value)
  },
  updateSelectedAcceleration({ commit }, value) {
    commit('SET_SELECTED_ACCELERATION', value)
  },
  updateReferenceScans({ commit }, value) {
    commit('SET_REFERENCE_SCANS', value)
  },
  // eslint-disable-next-line no-dupe-keys
  updateAccelFactorPE({ commit }, value) {
    commit('SET_PARALLEL_FACTOR', value)
    commit('SET_ACCEL_FACTOR_PE', value)
  },
  updateAccelFactor3D({ commit }, value) {
    commit('SET_ACCEL_FACTOR_3D', value)
  },
  updateShift3D({ commit }, value) {
    commit('SET_SHIFT_3D', value)
  },
  updateDeepResolve({ commit }, value) {
    commit('SET_DEEP_RESOLVE', value)
  },
  updatePhasePartialFourier({ commit }, value) {
    commit('SET_PHASE_PARTIAL_FOURIER', value)
  },
  updateSlicePartialFourier({ commit }, value) {
    commit('SET_SLICE_PARTIAL_FOURIER', value)
  },
  updateReadoutPartialFourier({ commit }, value) {
    commit('SET_READOUT_PARTIAL_FOURIER', value)
  },
  updateAsymmetricEcho({ commit }, value) {
    commit('SET_ASYMMETRIC_ECHO', value)
  },
  updateSMSFactor({ commit }, value) {
    commit('SET_SMS_FACTOR', value)
  },
  updateFovShift({ commit }, value) {
    commit('SET_FOV_SHIFT', value)
  },
  updateReferenceLines({ commit }, value) {
    commit('SET_REFERENCE_LINES', value)
  },
  updateMode({ commit }, value) {
    commit('SET_MODE', value)
  },
  updateAdjustmentStrategy({ commit }, value) {
    commit('SET_ADJUSTMENT_STRATEGY', value)
  },
  updateB0Shim({ commit }, value) {
    commit('SET_B0_SHIM', value)
  },
  updateSelectedTolerance({ commit }, value) {
    commit('SET_SELECTED_TOLERANCE', value)
  },
  updateSelectedFrequency({ commit }, value) {
    commit('SET_SELECTED_FREQUENCY', value)
  },

  // Philips Actions
  updateAPFOV({ commit }, value) {
    commit('SET_APFOV', value)
  },
  updateRLFOV({ commit }, value) {
    commit('SET_RLFOV', value)
  },
  updateFHFOV({ commit }, value) {
    commit('SET_FHFOV', value)
  },
  updateAPVoxel({ commit }, value) {
    commit('SET_APVOXEL', value)
  },
  updateRLVoxel({ commit }, value) {
    commit('SET_RLVOXEL', value)
  },
  updateFHVoxel({ commit }, value) {
    commit('SET_FHVOXEL', value)
  },
  updateAPMatrix({ commit }, value) {
    commit('SET_APMATRIX', value)
  },
  updateRLMatrix({ commit }, value) {
    commit('SET_RLMATRIX', value)
  },
  updateFHMatrix({ commit }, value) {
    commit('SET_FHMATRIX', value)
  },
  updateDefaultTxt({ commit }, value) {
    commit('SET_DEFAULTTXT', value)
  },
  updateNSA({ commit }, value) {
    commit('SET_NSA', value)
  },
  updateIsCheckedGap({ commit }, value) {
    commit('SET_IS_CHECKED_GAP', value)
  },
  updateIsCheckedFS({ commit }, value) {
    commit('SET_IS_CHECKED_FS', value)
  },
  updateTextColorText({ commit }, value) {
    commit('SET_TEXT_COLOR_TEXT', value)
  },
  updateSelectedUniformity({ commit }, value) {
    commit('SET_SELECTED_UNIFORMITY', value)
  },
  updateSelectedFoldOverSuppression({ commit }, value) {
    commit('SET_SELECTED_FOLD_OVER_SUPPRESSION', value)
  },
  updateSelectedSENSE({ commit }, value) {
    commit('SET_SELECTED_SENSE', value)
  },
  updateSelectedCSSENSE({ commit }, value) {
    commit('SET_SELECTED_CSSENSE', value)
  },
  updateSelectedDenoising({ commit }, value) {
    commit('SET_SELECTED_DENOISING', value)
  },
  updateSelectedKTAcceleration({ commit }, value) {
    commit('SET_SELECTED_KT_ACCELERATION', value)
  },
  updateSelectedType({ commit }, value) {
    commit('SET_SELECTED_TYPE', value)
  },
  updateSelectedSliceGap({ commit }, value) {
    commit('SET_SELECTED_SLICE_GAP', value)
  },
  updateSelectedSliceOrientation({ commit }, value) {
    commit('SET_SELECTED_SLICE_ORIENTATION', value)
  },
  updateSelectedFoldOverDirection({ commit }, value) {
    commit('SET_SELECTED_FOLD_OVER_DIRECTION', value)
  },
  updateSelectedFatShiftDirection({ commit }, value) {
    commit('SET_SELECTED_FAT_SHIFT_DIRECTION', value)
  },
  updateSelectedSliceScanOrder({ commit }, value) {
    commit('SET_SELECTED_SLICE_SCAN_ORDER', value)
  },
  updateSelectedPlanAlign({ commit }, value) {
    commit('SET_SELECTED_PLAN_ALIGN', value)
  },
  updateSelectedOMAR({ commit }, value) {
    commit('SET_SELECTED_OMAR', value)
  },
  updateSelectedFreetype({ commit }, value) {
    commit('SET_SELECTED_FREETYPE', value)
  },
  updateSelectedOrientation({ commit }, value) {
    commit('SET_SELECTED_ORIENTATION', value)
  },
  updateSelectedInteractivePositioning({ commit }, value) {
    commit('SET_SELECTED_INTERACTIVE_POSITIONING', value)
  },
  updateACQVoxelSizeAP({ commit }, value) {
    commit('SET_ACQ_VOXEL_SIZE_AP', value)
  },
  updateACQFH({ commit }, value) {
    commit('SET_ACQ_FH', value)
  },
  updateSliceThick({ commit }, value) {
    commit('SET_SLICE_THICK', value)
  },
  updateReconVoxelSizeAP({ commit }, value) {
    commit('SET_RECON_VOXEL_SIZE_AP', value)
  },
  updateReconFH({ commit }, value) {
    commit('SET_RECON_FH', value)
  },
  updateReconstructionMatrix({ commit }, value) {
    commit('SET_RECONSTRUCTION_MATRIX', value)
  },
  updateReduction({ commit }, value) {
    commit('SET_REDUCTION', value)
  },
  updateStacks({ commit }, value) {
    commit('SET_STACKS', value)
  },
  updateMinimumNoofPA({ commit }, value) {
    commit('SET_MINIMUM_NO_OF_PA', value)
  },
  updateRESTSlabs({ commit }, value) {
    commit('SET_REST_SLABS', value)
  },
  // Philips Actions
}

const getters = {
  getAPVoxel: (state) => state.APVoxel + '×' + state.RLVoxel + '×' + state.FHVoxel + '(mm)',
  getTRSync: (state) => state.TRSYNC,
  getTESync: (state) => state.TESYNC,

  getLocalSoftwareVersionPreference: (state) => state.localSoftwareVersionPreference,
  getMinSeqTRfuture: (state) => state.minSeqTRfuture,
  getMinConcatAcqPackagefuture: (state) => state.minConcatAcqPackagefuture,
  activeButtons: (state) => state.activeButtons,
  getMinConcatAcqPackage: (state) => state.minConcatAcqPackage,
  getAvailableFieldStrengths: (state) => state.availableFieldStrengths,
  getAccelFactorPE: (state) => state.accelFactorPE,
  getScanTime: (state) => state.scanTime,
  getRepetitionTime: (state) => state.repetitionTime,
  getEchoTime: (state) => state.echoTime,
  getFlipAngle: (state) => state.flipAngle,
  getSlices: (state) => state.slices,
  getPhaseEncodingLines: (state) => state.phaseEncodingLines,
  getParallelFactor: (state) => state.parallelFactor,

  getSelectedAutoAlign: (state) => state.selectedAutoAlign,
  getAutoAlignOptions: (state) => state.autoAlignOptions,
  getSelectedFatOptions: (state) => state.selectedFatOptions,
  getselectedMagnItems: (state) => state.selectedMagnItems,
  getMagnItems: (state) => state.magnItems,

  getPhaseMatrix: (state) => state.phaseMatrix,
  getFrequencyMatrix: (state) => state.frequencyMatrix,
  getDimensions3x: (state) => state.dimensions3x,
  getDimensions3y: (state) => state.dimensions3y,
  getPartialFourier: (state) => state.partialFourier,
  getAverages: (state) => state.averages,
  getConcatenations: (state) => state.concatenations,
  getEchoTrainLength: (state) => state.echoTrainLength,
  getVendorStylePreference: (state) => state.vendorStylePreference,
  getIsUltraLab: (state) => state.isUltraLab,
  getSelectionIdent: (state) => state.selectionIdent,
  getSelectionConfig: (state) => state.selectionConfig,
  getTrueResolutionHeaderUltra: (state) => state.trueResolutionHeaderUltra,
  getTrueResolutionHeader: (state) => state.trueResolutionHeader,
  getAcquiredResolutionHeader: (state) => state.acquiredResolutionHeader,
  getOversampling: (state) => state.oversampling,
  oversamplingPercentage: (state) => state.oversamplingPercentage,
  isCheckboxChecked: (state) => state.isCheckboxChecked,
  phaseCorrectionValue: (state) => state.phaseCorrectionValue,
  selectedAcousticNoiseReduction: (state) => state.selectedAcousticNoiseReduction,
  selectedMotionCrr: (state) => state.selectedMotionCrr,
  getSelectedAcceleration: (state) => state.selectedAcceleration,
  referenceScans: (state) => state.referenceScans,
  accelFactorPE: (state) => state.accelFactorPE,
  accelFactor3D: (state) => state.accelFactor3D,
  shift3D: (state) => state.shift3D,
  deepResolve: (state) => state.deepResolve,
  phasePartialFourier: (state) => state.phasePartialFourier,
  slicePartialFourier: (state) => state.slicePartialFourier,
  readoutPartialFourier: (state) => state.readoutPartialFourier,
  asymmetricEcho: (state) => state.asymmetricEcho,
  SMSFactor: (state) => state.SMSFactor,
  fovShift: (state) => state.fovShift,
  referenceLines: (state) => state.referenceLines,
  mode: (state) => state.mode,
  adjustmentStrategyValue: (state) => state.adjustmentStrategyValue,
  B0ShimValue: (state) => state.B0ShimValue,
  selectedTolerance: (state) => state.selectedTolerance,
  selectedFrequency: (state) => state.selectedFrequency,

  // Static options getters
  adjustmentStrategyOptions: (state) => state.adjustmentStrategyOptions,
  B0ShimOptions: (state) => state.B0ShimOptions,
  toleranceOptions: (state) => state.toleranceOptions,
  frequencyOptions: (state) => state.frequencyOptions,

  // Philips Getters
  getField: (state) => (field) => {
    return state[field]
  },
  getParameter: (state) => (field) => {
    return state.hasOwnProperty(field) ? state[field] : null
  },
  getDropdownOptions: (state) => (field) => {
    return state.hasOwnProperty(field) ? state[field] : []
  },
  // Philips Getters
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}
