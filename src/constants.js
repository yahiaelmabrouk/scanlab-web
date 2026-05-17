export const ABDOMEN = 'Abdomen'
export const ANGIOGRAPHY = 'Angiography'
export const CARDIAC = 'Cardiac'
export const HEAD = 'Head'
export const SPECIAL = 'Special'
export const PELVIS = 'Pelvis'
export const SPINE = 'Spine'
export const THORAX = 'Thorax'
export const UPPER_EXTREMITIES = 'Upper Extremities'
export const LOWER_EXTREMITIES = 'Lower Extremities'
export const NECK = 'Neck'
export const DEFAULT = 'Default'
// Allowance for normal breath-hold/table motion before scan actually starts
export const PHYSIOLOGICAL_DELAY_SECONDS = 4
export const MR_PRACTICE_EXAM_ID = 48
export const CT_PRACTICE_EXAM_ID = 7

export const CERVICAL = 'Cervical'
export const LUMBAR = 'Lumbar'
export const THORACIC = 'Thoracic'
export const LOWER_LEG = 'Lower leg'
export const HIPS = 'Hips'
export const ANKLE = 'Ankle'
export const SINUSES = 'Sinuses'

import config from '@/config.js'
import ABDOMEN_SVG from './assets/svg/regions/Abdomen.svg'
import ANGIOGRAPHY_SVG from './assets/svg/regions/Angiography.svg'
import HEAD_SVG from './assets/svg/regions/Head.svg'
import CARDIAC_SVG from './assets/svg/regions/Cardiac.svg'
import PELVIS_SVG from './assets/svg/regions/Pelvis.svg'
import SPINE_SVG from './assets/svg/regions/Spine.svg'
import THORAX_SVG from './assets/svg/regions/Thorax.svg'
import THORAX_SVG_CT from './assets/svg/regions/CT_icons-05.png'
import UPPER_EXTREMITIES_SVG from './assets/svg/regions/UpperExtremities.svg'
import LOWER_EXTREMITIES_SVG from './assets/svg/regions/LowerExtremities.svg'
import NECK_SVG from './assets/svg/regions/Neck.svg'
import SPECIAL_SVG from './assets/svg/regions/Special.svg'
import DEFAULT_SVG from './assets/svg/regions/UpperExtremities.svg'

import LUMBAR_SVG_CT from './assets/svg/regions/CT_icons-Lumbar.png'
import CERVICAL_SVG_CT from './assets/svg/regions/CT_icons-Cervical.png'
import THORACIC_SVG_CT from './assets/svg/regions/CT_icons-Thoracic.png'
import LOWER_LEG_SVG_CT from './assets/svg/regions/CT_icons_Lower_leg.png'
import SPINE_SVG_CT from './assets/svg/regions/CT_icons-Whole Spine.png'
import HEAD_SVG_CT from './assets/svg/regions/CT_icons-01.png'
import NECK_SVG_CT from './assets/svg/regions/CT_icons-03.png'
import UPPER_EXTREMITIES_SVG_CT from './assets/svg/regions/CT_icons-10.png'
import DEFAULT_SVG_CT from './assets/svg/regions/CT_icons-06.png'
import PELVIS_SVG_CT from './assets/svg/regions/CT_icons-Pelvis.png'
import HIPS_SVG_CT from './assets/svg/regions/CT_icons-01-18.png'
import ANKLE_SVG_CT from './assets/svg/regions/CT_icons-01-17.png'
import SINUSES_SVG_CT from './assets/svg/regions/CT_icons-01-16.png'

export const REGION_IMAGES = {
  [ABDOMEN]: ABDOMEN_SVG,
  [ANGIOGRAPHY]: ANGIOGRAPHY_SVG,
  [HEAD]: config.isCTLab ? HEAD_SVG_CT : HEAD_SVG,
  [CARDIAC]: CARDIAC_SVG,
  [PELVIS]: config.isCTLab ? PELVIS_SVG_CT : PELVIS_SVG,
  [SPINE]: config.isCTLab ? SPINE_SVG_CT : SPINE_SVG,
  [THORAX]: config.isCTLab ? THORAX_SVG_CT : THORAX_SVG,
  [UPPER_EXTREMITIES]: config.isCTLab ? UPPER_EXTREMITIES_SVG_CT : UPPER_EXTREMITIES_SVG,
  [LOWER_EXTREMITIES]: LOWER_EXTREMITIES_SVG,
  [NECK]: config.isCTLab ? NECK_SVG_CT : NECK_SVG,
  [SPECIAL]: SPECIAL_SVG,
  [DEFAULT]: config.isCTLab ? DEFAULT_SVG_CT : DEFAULT_SVG,
}

export const BODYPART_IMAGES = {
  [CERVICAL]: CERVICAL_SVG_CT,
  [LUMBAR]: LUMBAR_SVG_CT,
  [THORACIC]: THORACIC_SVG_CT,
  [LOWER_LEG]: LOWER_LEG_SVG_CT,
  [HIPS]: HIPS_SVG_CT,
  [ANKLE]: ANKLE_SVG_CT,
  [SINUSES]: SINUSES_SVG_CT,
}

export const REGION_COLORS = {
  [ABDOMEN]: {
    borderColor: 'green-border',
    imgBkgrdColor: 'green-background',
    buttonColor: 'secondary',
  },
  [CARDIAC]: {
    borderColor: 'dark-blue-border',
    imgBkgrdColor: 'blue-background',
    buttonColor: 'primary',
  },
  [HEAD]: {
    borderColor: 'dark-blue-border',
    imgBkgrdColor: 'blue-background',
    buttonColor: 'primary',
  },
  [PELVIS]: {
    borderColor: 'green-border',
    imgBkgrdColor: 'green-background',
    buttonColor: 'success',
  },
  [SPINE]: {
    borderColor: 'pink-border',
    imgBkgrdColor: 'pink-background',
    buttonColor: 'error',
  },
  [THORAX]: {
    borderColor: 'yellow-border',
    imgBkgrdColor: 'yellow-background',
    buttonColor: 'warning',
  },
  [UPPER_EXTREMITIES]: {
    borderColor: 'dark-blue-border',
    imgBkgrdColor: 'dark-blue-background',
    buttonColor: 'darkBlue',
  },
  [LOWER_EXTREMITIES]: {
    borderColor: 'dark-blue-border',
    imgBkgrdColor: 'dark-blue-background',
    buttonColor: 'darkBlue',
  },
  [NECK]: {
    borderColor: 'blue-border',
    imgBkgrdColor: 'blue-background',
    buttonColor: 'buttonBlue',
  },
  [SPECIAL]: {
    borderColor: 'dark-blue-border',
    imgBkgrdColor: 'blue-background',
    buttonColor: 'primary',
  },
  [DEFAULT]: {
    borderColor: 'blue-border',
    imgBkgrdColor: 'blue-background',
    buttonColor: 'buttonBlue',
  },
}

export const SCREENING_FORM_DEFAULTS = {
  areaToScan: '',
  bodyPiercing: false,
  boneOrJointPins: false,
  boneStimulator: false,
  brainAneurysmClips: false,
  breastFeeding: false,
  bulletsPelletsShrapnel: false,
  cardiacPacemaker: false,
  chanceOfPregnancy: false,
  conditionalPacemaker: false,
  currentlyTakingHormones: false,
  dateTimePatient: new Date(),
  dateTimeTechnologist: new Date(),
  dentures: false,
  diabetes: false,
  diaphragm: false,
  earImplants: false,
  electrodes: false,
  gender: 'Male',
  age: 45,
  harringtonRod: false,
  hearingAids: false,
  heartStent: false,
  heartValue: false,
  heightImperial: '',
  heightMetric: '',
  highBloodPressure: false,
  implantedDefibrillator: false,
  insulinPump: false,
  intravascularColisFilterStent: false,
  jointReplacement: false,
  kidneyDialysis: false,
  locationOfBoneOrJointPins: '',
  locationOfJointReplacement: '',
  locationOfMetalInBody: '',
  locationOfMetalRodsPlatesScrewsNails: '',
  locationOfProsthesisImplant: '',
  magneticBatteryOperatedDevice: false,
  medicationPatch: false,
  metalInBody: false,
  metalInEyes: false,
  metalMesh: false,
  metalRodsPlatesScrewsNails: false,
  neuroStimulator: false,
  ovariesRemoved: false,
  patientName: 'John Doe',
  patientOrFamilyMemberSignature: 'Ms. Graziano',
  penileImplant: false,
  previousCancerDiagnosis: false,
  previousHysterectomy: false,
  previousMRIContrast: false,
  prosthesisImplant: false,
  reactedToMRIContrast: false,
  reasonForMRI: '',
  recentColonoscopyEndoscopy: false,
  removableBodyPiercing: false,
  removableDentures: false,
  removableHearingAid: false,
  removableMedicationPatch: false,
  removableWig: false,
  residualPacerWires: false,
  shunts: false,
  skinStaples: false,
  surgeriesSinceBirth: '',
  swanGanzCatheter: false,
  technologistSignature: 'Technologist Tran',
  tissueExpander: false,
  vascularAccessPort: false,
  vascularClampsClips: false,
  venaCavaFilter: false,
  weightImperial: '',
  weightMetric: '',
  wigHairpiece: false,
  wireSutures: false,
  keepOrder: false,
  laboratory: {
    eGFR: 0,
    daysOld: 0,
    noAvailableLabs: true,
  },
  miscDocuments: {
    noAvailableDocuments: true,
  },
}

export const PRIME_COLORS = [
  '#e6194b',
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#46f0f0',
  '#f032e6',
  '#bcf60c',
  '#fabebe',
  '#008080',
  '#e6beff',
  '#9a6324',
  '#fffac8',
  '#800000',
  '#aaffc3',
  '#808000',
  '#ffd8b1',
  '#000075',
  '#808080',
  '#ffffff',
  '#000000',
  '#22d3ee',
  '#7c3aed',
  '#3b0764',
  '#f43f5e',
  '#155e75',
  '#713f12',
  '#38bdf8',
  '#eab308',
  '#450a0a',
  '#6ee7b7',
  '#38bdf8',
  '#2bbe72',
]

export const SCAN_STATUS = {
  NO_SCAN: 0,
  SCANNING: 1,
  SCANNED: 2,
}

export const ROI_STATUS = {
  NO_CONFIRM: 0,
  SHOW_ROI: 1,
  CONFIRMED: 2,
  RUNNING: 3,
  DONE: 4,
}

export const DEFAULT_PATIENT_GENDER = 'female'
export const DEFAULT_PATIENT_AGE = 40
export const DEFAULT_PATIENT_MODEL_ID = '1'

export const EXTRA_SCAN_BASE_NAME = 'Auto-Reformat'

// TODO: Get exact box of mri model
export const MRI_MODEL_DIMENSIONS = {
  x: 512,
  y: 512,
  z: 255,
}

export const PATIENT_POSITION_TEXT = {
  HEAD_FIRST: 'Head first',
  FEET_FIRST: 'Feet first',
  SUPINE: 'Supine',
  PRONE: 'Prone',
  ARMS_UP: 'Arms up',
  ARMS_DOWN: 'Arms down',
  SUPERMAN_POSITION: 'Superman position',
}

export const PATIENT_POSITION_MODEL_NAME = {
  [PATIENT_POSITION_TEXT.HEAD_FIRST]: 'headfirst',
  [PATIENT_POSITION_TEXT.FEET_FIRST]: 'feetfirst',
  [PATIENT_POSITION_TEXT.SUPINE]: 'supine',
  [PATIENT_POSITION_TEXT.PRONE]: 'prone',
  [PATIENT_POSITION_TEXT.ARMS_UP]: 'armsup',
  [PATIENT_POSITION_TEXT.ARMS_DOWN]: 'armsdown',
  [PATIENT_POSITION_TEXT.SUPERMAN_POSITION]: 'superman',
}

export const HINT_DIRECTION_TEXTS = {
  AP: 'AP',
  LATERAL: 'LATERAL',
}

export const AVAILABLE_POSITION_COMBINATION = [
  [PATIENT_POSITION_TEXT.HEAD_FIRST, PATIENT_POSITION_TEXT.SUPINE, PATIENT_POSITION_TEXT.ARMS_UP],
  [PATIENT_POSITION_TEXT.HEAD_FIRST, PATIENT_POSITION_TEXT.SUPINE, PATIENT_POSITION_TEXT.ARMS_DOWN],
  [PATIENT_POSITION_TEXT.HEAD_FIRST, PATIENT_POSITION_TEXT.PRONE, PATIENT_POSITION_TEXT.ARMS_UP],
  [PATIENT_POSITION_TEXT.HEAD_FIRST, PATIENT_POSITION_TEXT.PRONE, PATIENT_POSITION_TEXT.ARMS_DOWN],
  [PATIENT_POSITION_TEXT.FEET_FIRST, PATIENT_POSITION_TEXT.SUPINE, PATIENT_POSITION_TEXT.ARMS_UP],
  [PATIENT_POSITION_TEXT.FEET_FIRST, PATIENT_POSITION_TEXT.SUPINE, PATIENT_POSITION_TEXT.ARMS_DOWN],
  [PATIENT_POSITION_TEXT.FEET_FIRST, PATIENT_POSITION_TEXT.PRONE, PATIENT_POSITION_TEXT.ARMS_UP],
  [PATIENT_POSITION_TEXT.FEET_FIRST, PATIENT_POSITION_TEXT.PRONE, PATIENT_POSITION_TEXT.ARMS_DOWN],

  [PATIENT_POSITION_TEXT.FEET_FIRST, PATIENT_POSITION_TEXT.PRONE, PATIENT_POSITION_TEXT.SUPERMAN_POSITION],
  [PATIENT_POSITION_TEXT.FEET_FIRST, PATIENT_POSITION_TEXT.SUPINE, PATIENT_POSITION_TEXT.SUPERMAN_POSITION],
  [PATIENT_POSITION_TEXT.HEAD_FIRST, PATIENT_POSITION_TEXT.PRONE, PATIENT_POSITION_TEXT.SUPERMAN_POSITION],
  [PATIENT_POSITION_TEXT.HEAD_FIRST, PATIENT_POSITION_TEXT.SUPINE, PATIENT_POSITION_TEXT.SUPERMAN_POSITION],
]

export const AVAILABLE_POSITION_COMBINATION_HAS_HEAD_HOLDER = [
  [PATIENT_POSITION_TEXT.HEAD_FIRST, PATIENT_POSITION_TEXT.SUPINE, PATIENT_POSITION_TEXT.ARMS_DOWN],
]

export const DEFAULT_POSITION = [
  PATIENT_POSITION_TEXT.HEAD_FIRST,
  PATIENT_POSITION_TEXT.SUPINE,
  PATIENT_POSITION_TEXT.ARMS_DOWN,
]

export const SELECTION_CONFIG_FORM = {
  MIN_FOV_FOR_IDENT_MAX: 50,
  MIN_FOV_FOR_IDENT_MIN: 50,
}

export const BODY_PART_TYPE = {
  WITH_OUT: 'withOut',
  WITH_CONTRAST: 'withContrast',
}

export const BODY_PART_TYPES = [
  {
    id: 'withOut',
    name: 'Without',
  },
  {
    id: 'withOutWith',
    name: 'Without/ With',
  },
  {
    id: 'withOnly',
    name: 'With Only',
  },
  {
    id: 'threePhase',
    name: '3 Phases',
  },
  {
    id: 'lowDoseLungScreening',
    name: 'Low Dose Lung-Screening',
  },
  {
    id: 'highResolution',
    name: 'High Resolution',
  },
  {
    id: 'withContrast',
    name: 'With Contrast',
  },
]

export const MAXIMUM_ATTRIBUTE_OF_MODEL = 30

export const DEFAULT_VALUE_FOR_SELECTION_CONFIG = {
  rotationTime: 1.0,
  pitch: 0.8,
  beamSelected: { text: 'Narrow: 20mm', value: 20, dim: '36 x 0.6' },
}

export const SCREENING_FORM_GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  EITHER: 'either',
}

export const SCREENING_FORM_GENDER_OPTIONS = [
  { text: 'Male', value: SCREENING_FORM_GENDER.MALE },
  { text: 'Female', value: SCREENING_FORM_GENDER.FEMALE },
  { text: 'Either', value: SCREENING_FORM_GENDER.EITHER },
]

export const BREATHING_INSTRUCTION = {
  OFF: 'OFF',
  INSPIRATION: 'INSPIRATION',
  EXPIRATION: 'EXPIRATION',
}

export const CARDIAC_ACQUISITION_TYPE = {
  PROSPECTIVE: 'PROSPECTIVE',
}

export const INJECTION_MODE = {
  CONTRAST_ONLY: 1,
  CONTRAST_AND_SALINE: 2,
}

export const INJECT_CONDITION = {
  SET_VOLUME: 1,
  WEIGHT_BASED: 2,
}

export const SLICE_EXPANSION_BEHAVIOR = {
  SINGLE_DIRECTION: 1,
  BOTH_DIRECTIONS: 2,
}

export const INJECTOR_PROTOCOLS = {
  BOLUS: 1,
  BOLUS_BI_PHASIC: 2, // Contrast only
  TEST_AND_BOLUS: 3,
  TEST_AND_BOLUS_BI_PHASIC: 4,
  TEST_BOLUS_AND_TTP: 5,
  TEST_BOLUS_AND_TTP_BI_PHASIC: 6,
}

export const CONTRAST_ONLY_PROTOCOL_OPTIONS = [
  {
    text: 'Bolus Bi-Phasic',
    value: INJECTOR_PROTOCOLS.BOLUS_BI_PHASIC,
  },
  {
    text: 'Bolus',
    value: INJECTOR_PROTOCOLS.BOLUS,
  },
]

export const CONTRAST_AND_SALINE_PROTOCOL_OPTIONS = [
  {
    text: 'Bolus',
    value: INJECTOR_PROTOCOLS.BOLUS,
  },
  {
    text: 'Test + Bolus',
    value: INJECTOR_PROTOCOLS.TEST_AND_BOLUS,
  },
  {
    text: 'Test + Bolus Bi-Phasic',
    value: INJECTOR_PROTOCOLS.TEST_AND_BOLUS_BI_PHASIC,
  },
  {
    text: 'Test Bolus + TTP',
    value: INJECTOR_PROTOCOLS.TEST_BOLUS_AND_TTP,
  },
  {
    text: 'Test Bolus +TTP Biphasic',
    value: INJECTOR_PROTOCOLS.TEST_BOLUS_AND_TTP_BI_PHASIC,
  },
]

export const PHYSIO_UNIT = {
  MS: 1,
  BPM: 2,
}
export const PHYSIO_UNIT_OPTIONS = [
  {
    text: 'ms',
    value: PHYSIO_UNIT.MS,
  },
  {
    text: 'bpm',
    value: PHYSIO_UNIT.BPM,
  },
]
export const BAD_BEATS = {
  NONE: 1,
  ONE_IN_TWO: 2,
  ONE_IN_FOUR: 3,
  ONE_IN_EIGHT: 4,
  ONE_IN_SIXTEEN: 5,
  RANDOM: 6,
  RANDOM_ONE_FOURTH: 7,
  RANDOM_ONE_EIGHTH: 8,
  RANDOM_ONE_SIXTEENTH: 9,
}
export const BAD_BEATS_OPTIONS = [
  {
    text: 'None',
    value: BAD_BEATS.NONE,
  },
  {
    text: 'Severe',
    value: BAD_BEATS.RANDOM,
  },
  {
    text: '1 in 2',
    value: BAD_BEATS.ONE_IN_TWO,
  },
  {
    text: '1 in 4',
    value: BAD_BEATS.ONE_IN_FOUR,
  },
  {
    text: 'Random 1/4',
    value: BAD_BEATS.RANDOM_ONE_FOURTH,
  },
  {
    text: '1 in 8',
    value: BAD_BEATS.ONE_IN_EIGHT,
  },
  {
    text: 'Random 1/8',
    value: BAD_BEATS.RANDOM_ONE_EIGHTH,
  },
  {
    text: '1 in 16',
    value: BAD_BEATS.ONE_IN_SIXTEEN,
  },
  {
    text: 'Random 1/16',
    value: BAD_BEATS.RANDOM_ONE_SIXTEENTH,
  },
]

export const STROKE_VOL = {
  VOL_40: 40,
  VOL_70: 70,
  VOL_100: 100,
}

export const STROKE_VOL_OPTIONS = [
  {
    text: '40',
    value: STROKE_VOL.VOL_40,
  },
  {
    text: '70',
    value: STROKE_VOL.VOL_70,
  },
  {
    text: '100',
    value: STROKE_VOL.VOL_100,
  },
]

export const COPY_QUESTION_TYPES = {
  SLICE_POSITION_AND_COVERAGE: 'SLICE_POSITION_AND_COVERAGE',
  PARAMETERS: 'PARAMETERS',
  EVERY_THINGS: 'EVERY_THINGS',
  SLICE_THICKNESS: 'SLICE_THICKNESS',
  SLICE_THICKNESS_AND_WINDOW_AND_KERNEL: 'SLICE_THICKNESS_AND_WINDOW_AND_KERNEL',
  WINDOW_AND_KERNEL: 'WINDOW_AND_KERNEL',
  FOV: 'FOV',
}

export const ADMIN_COPY_QUESTION_TYPES = {
  EVERY_THINGS: 'EVERY_THINGS',
  DEFAULT_VARIANTS: 'DEFAULT_VARIANTS',
  ANSWERS: 'ANSWERS',
  QUESTION_TEXT: 'QUESTION_TEXT',
  ANGLE: 'ANGLE',
  COVERAGE: 'COVERAGE',
  DEFAULTS: 'DEFAULTS',
  PARAMETERS: 'PARAMETERS',
}

export const ADMIN_COPY_QUESTION_TYPE_OPTIONS = [
  { text: 'Everything', value: ADMIN_COPY_QUESTION_TYPES.EVERY_THINGS },
  { text: 'Default variants', value: ADMIN_COPY_QUESTION_TYPES.DEFAULT_VARIANTS },
  { text: 'Answers', value: ADMIN_COPY_QUESTION_TYPES.ANSWERS },
  { text: 'Question text', value: ADMIN_COPY_QUESTION_TYPES.QUESTION_TEXT },
  { text: 'Angle', value: ADMIN_COPY_QUESTION_TYPES.ANGLE },
  { text: 'Coverage', value: ADMIN_COPY_QUESTION_TYPES.COVERAGE },
  { text: 'Defaults', value: ADMIN_COPY_QUESTION_TYPES.DEFAULTS },
  { text: 'Parameters', value: ADMIN_COPY_QUESTION_TYPES.PARAMETERS },
]

export const ADMIN_COPY_QUESTION_ANSWER_TYPE_OPTIONS = [
  { text: 'Everything', value: ADMIN_COPY_QUESTION_TYPES.EVERY_THINGS },
  { text: 'Angle', value: ADMIN_COPY_QUESTION_TYPES.ANGLE },
  { text: 'Coverage', value: ADMIN_COPY_QUESTION_TYPES.COVERAGE },
  { text: 'Defaults', value: ADMIN_COPY_QUESTION_TYPES.DEFAULTS },
  { text: 'Parameters', value: ADMIN_COPY_QUESTION_TYPES.PARAMETERS },
]

export const ADMIN_COPY_TYPE = {
  QUESTION: 'QUESTION',
  ANSWER: 'ANSWER',
}

export const ADMIN_COPY_TYPE_OPTIONS = [
  { text: 'Question to Question', value: ADMIN_COPY_TYPE.QUESTION },
  { text: 'Answer to Answer', value: ADMIN_COPY_TYPE.ANSWER },
]

export const POINT_SELECT_MODES = {
  RECTANGLE: 'RECTANGLE',
  CIRCLE: 'CIRCLE',
  POLYGON: 'POLYGON',
}

export const DICOM_CATEGORY = {
  FOR_CTQ: 1,
  FOR_TEST: 0,
}

export const NUM_OF_BODY_MAP_IMAGES = 340

export const CTA_WATCH_TOWER_CHECK_VALUE = 200
export const NON_CTA_WATCH_TOWER_CHECK_VALUE = 100

export const NUM_OF_PRESENTATION_BODY_MAP_IMAGES = 601
export const getNumOfPresentationBodyMapImages = () => {
  return 122
}

export const getEndingPeriod = () => {
  return {
    start: 52,
    end: 121,
  }
}

export const PRESENTATION_IMAGE_INJECT_START = 0
export const PRESENTATION_IMAGE_INJECT_END = 600
export const NUM_OF_PRESENTATION_BODY_MAP_STEPS = 600
// Maximum step
export const getPresentationBodyMapSteps = () => {
  return 100000
}

export const PRESENTATION75_PERTIOD = [
  {
    start: 5,
    end: 51,
  },
  {
    start: 5,
    end: 51,
  },
  {
    start: 5,
    end: 51,
  },
]

export const PRESENTATION143_PERTIOD = [
  {
    start: 5,
    end: 51,
  },
  {
    start: 5,
    end: 51,
  },
  {
    start: 5,
    end: 51,
  },
]

export const PRESENTATION210_PERTIOD = [
  {
    start: 5,
    end: 51,
  },
  {
    start: 5,
    end: 51,
  },
  {
    start: 5,
    end: 51,
  },
]

export const PRESENTATION134_PERTIOD = [
  {
    start: 4,
    end: 51,
  },
  {
    start: 4,
    end: 51,
  },
  {
    start: 4,
    end: 51,
  },
]

export const PRESENTATION170_PERTIOD = [
  {
    start: 6,
    end: 51,
  },
  {
    start: 6,
    end: 51,
  },
  {
    start: 6,
    end: 51,
  },
]

export const PRESENTATION200_PERTIOD = [
  {
    start: 6,
    end: 51,
  },
  {
    start: 6,
    end: 51,
  },
  {
    start: 6,
    end: 51,
  },
]

export const PRESENTATION143_FOLDER_MAP = [
  {
    name: '200ml_40sec',
    duration: 40,
    periods: [
      {
        start: 5,
        end: 45,
      },
      {
        start: 5,
        end: 45,
      },
      {
        start: 5,
        end: 45,
      },
    ],
    ending: {
      start: 46,
      end: 121,
    },
  },
  {
    name: '180ml_36sec',
    duration: 36,
    periods: [
      {
        start: 5,
        end: 41,
      },
      {
        start: 5,
        end: 41,
      },
      {
        start: 5,
        end: 41,
      },
    ],
    ending: {
      start: 42,
      end: 121,
    },
  },
  {
    name: '165ml_33sec',
    duration: 33,
    periods: [
      {
        start: 5,
        end: 38,
      },
      {
        start: 5,
        end: 38,
      },
      {
        start: 5,
        end: 38,
      },
    ],
    ending: {
      start: 39,
      end: 121,
    },
  },
  {
    name: '150ml_30sec',
    duration: 30,
    periods: [
      {
        start: 5,
        end: 35,
      },
      {
        start: 5,
        end: 35,
      },
      {
        start: 5,
        end: 35,
      },
    ],
    ending: {
      start: 36,
      end: 121,
    },
  },
  {
    name: '125ml_25sec',
    duration: 25,
    periods: [
      {
        start: 5,
        end: 30,
      },
      {
        start: 5,
        end: 30,
      },
      {
        start: 5,
        end: 30,
      },
    ],
    ending: {
      start: 31,
      end: 121,
    },
  },
  {
    name: '115ml_23sec',
    duration: 23,
    periods: [
      {
        start: 5,
        end: 28,
      },
      {
        start: 5,
        end: 28,
      },
      {
        start: 5,
        end: 28,
      },
    ],
    ending: {
      start: 29,
      end: 121,
    },
  },
  {
    name: '105ml_21sec',
    duration: 21,
    periods: [
      {
        start: 5,
        end: 26,
      },
      {
        start: 5,
        end: 26,
      },
      {
        start: 5,
        end: 26,
      },
    ],
    ending: {
      start: 27,
      end: 121,
    },
  },
  {
    name: '95ml_19sec',
    duration: 19,
    periods: [
      {
        start: 5,
        end: 24,
      },
      {
        start: 5,
        end: 24,
      },
      {
        start: 5,
        end: 24,
      },
    ],
    ending: {
      start: 25,
      end: 121,
    },
  },
  {
    name: '85ml_17sec',
    duration: 17,
    periods: [
      {
        start: 5,
        end: 22,
      },
      {
        start: 5,
        end: 22,
      },
      {
        start: 5,
        end: 22,
      },
    ],
    ending: {
      start: 23,
      end: 121,
    },
  },
  {
    name: '75ml_15sec',
    duration: 15,
    periods: [
      {
        start: 5,
        end: 20,
      },
      {
        start: 5,
        end: 20,
      },
      {
        start: 5,
        end: 20,
      },
    ],
    ending: {
      start: 21,
      end: 121,
    },
  },
  {
    name: '50ml_10sec',
    duration: 10,
    periods: [
      {
        start: 5,
        end: 15,
      },
      {
        start: 5,
        end: 15,
      },
      {
        start: 5,
        end: 15,
      },
    ],
    ending: {
      start: 16,
      end: 121,
    },
  },
  {
    name: '45ml_09sec',
    duration: 9,
    periods: [
      {
        start: 5,
        end: 14,
      },
      {
        start: 5,
        end: 14,
      },
      {
        start: 5,
        end: 14,
      },
    ],
    ending: {
      start: 15,
      end: 121,
    },
  },
  {
    name: '40ml_08sec',
    duration: 8,
    periods: [
      {
        start: 5,
        end: 13,
      },
      {
        start: 5,
        end: 13,
      },
      {
        start: 5,
        end: 13,
      },
    ],
    ending: {
      start: 14,
      end: 121,
    },
  },
  {
    name: '35ml_07sec',
    duration: 7,
    periods: [
      {
        start: 5,
        end: 12,
      },
      {
        start: 5,
        end: 12,
      },
      {
        start: 5,
        end: 12,
      },
    ],
    ending: {
      start: 13,
      end: 121,
    },
  },
  {
    name: '30ml_06sec',
    duration: 6,
    periods: [
      {
        start: 5,
        end: 11,
      },
      {
        start: 5,
        end: 11,
      },
      {
        start: 5,
        end: 11,
      },
    ],
    ending: {
      start: 12,
      end: 121,
    },
  },
  {
    name: '25ml_05sec',
    duration: 5,
    periods: [
      {
        start: 5,
        end: 10,
      },
      {
        start: 5,
        end: 10,
      },
      {
        start: 5,
        end: 10,
      },
    ],
    ending: {
      start: 11,
      end: 121,
    },
  },
  {
    name: '20ml_04sec',
    duration: 4,
    periods: [
      {
        start: 5,
        end: 9,
      },
      {
        start: 5,
        end: 9,
      },
      {
        start: 5,
        end: 9,
      },
    ],
    ending: {
      start: 10,
      end: 121,
    },
  },
  {
    name: '15ml_03sec',
    duration: 3,
    periods: [
      {
        start: 5,
        end: 8,
      },
      {
        start: 5,
        end: 8,
      },
      {
        start: 5,
        end: 8,
      },
    ],
    ending: {
      start: 9,
      end: 121,
    },
  },
  {
    name: '10ml_02sec',
    duration: 2,
    periods: [
      {
        start: 5,
        end: 7,
      },
      {
        start: 5,
        end: 7,
      },
      {
        start: 5,
        end: 7,
      },
    ],
    ending: {
      start: 8,
      end: 121,
    },
  },
]

export const PRESENTATION75_FOLDER_MAP = [
  {
    name: '40sec',
    duration: 40,
    periods: [
      {
        start: 6,
        end: 46,
      },
      {
        start: 6,
        end: 46,
      },
      {
        start: 6,
        end: 46,
      },
    ],
    ending: {
      start: 47,
      end: 121,
    },
  },
  {
    name: '36sec',
    duration: 36,
    periods: [
      {
        start: 6,
        end: 42,
      },
      {
        start: 6,
        end: 42,
      },
      {
        start: 6,
        end: 42,
      },
    ],
    ending: {
      start: 43,
      end: 121,
    },
  },
  {
    name: '33sec',
    duration: 33,
    periods: [
      {
        start: 6,
        end: 39,
      },
      {
        start: 6,
        end: 39,
      },
      {
        start: 6,
        end: 39,
      },
    ],
    ending: {
      start: 40,
      end: 121,
    },
  },
  {
    name: '30sec',
    duration: 30,
    periods: [
      {
        start: 6,
        end: 36,
      },
      {
        start: 6,
        end: 36,
      },
      {
        start: 6,
        end: 36,
      },
    ],
    ending: {
      start: 37,
      end: 121,
    },
  },
  {
    name: '25sec',
    duration: 25,
    periods: [
      {
        start: 6,
        end: 31,
      },
      {
        start: 6,
        end: 31,
      },
      {
        start: 6,
        end: 31,
      },
    ],
    ending: {
      start: 32,
      end: 121,
    },
  },
  {
    name: '23sec',
    duration: 23,
    periods: [
      {
        start: 6,
        end: 29,
      },
      {
        start: 6,
        end: 29,
      },
      {
        start: 6,
        end: 29,
      },
    ],
    ending: {
      start: 30,
      end: 121,
    },
  },
  {
    name: '21sec',
    duration: 21,
    periods: [
      {
        start: 6,
        end: 27,
      },
      {
        start: 6,
        end: 27,
      },
      {
        start: 6,
        end: 27,
      },
    ],
    ending: {
      start: 28,
      end: 121,
    },
  },
  {
    name: '19sec',
    duration: 19,
    periods: [
      {
        start: 6,
        end: 25,
      },
      {
        start: 6,
        end: 25,
      },
      {
        start: 6,
        end: 25,
      },
    ],
    ending: {
      start: 26,
      end: 121,
    },
  },
  {
    name: '17sec',
    duration: 17,
    periods: [
      {
        start: 6,
        end: 23,
      },
      {
        start: 6,
        end: 23,
      },
      {
        start: 6,
        end: 23,
      },
    ],
    ending: {
      start: 24,
      end: 121,
    },
  },
  {
    name: '15sec',
    duration: 15,
    periods: [
      {
        start: 6,
        end: 21,
      },
      {
        start: 6,
        end: 21,
      },
      {
        start: 6,
        end: 21,
      },
    ],
    ending: {
      start: 22,
      end: 121,
    },
  },
  {
    name: '12sec',
    duration: 12,
    periods: [
      {
        start: 6,
        end: 19,
      },
      {
        start: 6,
        end: 19,
      },
      {
        start: 6,
        end: 19,
      },
    ],
    ending: {
      start: 20,
      end: 121,
    },
  },
  {
    name: '10sec',
    duration: 10,
    periods: [
      {
        start: 6,
        end: 16,
      },
      {
        start: 6,
        end: 16,
      },
      {
        start: 6,
        end: 16,
      },
    ],
    ending: {
      start: 17,
      end: 121,
    },
  },
  {
    name: '09sec',
    duration: 9,
    periods: [
      {
        start: 6,
        end: 15,
      },
      {
        start: 6,
        end: 15,
      },
      {
        start: 6,
        end: 15,
      },
    ],
    ending: {
      start: 16,
      end: 121,
    },
  },
  {
    name: '08sec',
    duration: 8,
    periods: [
      {
        start: 6,
        end: 14,
      },
      {
        start: 6,
        end: 14,
      },
      {
        start: 6,
        end: 14,
      },
    ],
    ending: {
      start: 15,
      end: 121,
    },
  },
  {
    name: '07sec',
    duration: 7,
    periods: [
      {
        start: 6,
        end: 13,
      },
      {
        start: 6,
        end: 13,
      },
      {
        start: 6,
        end: 13,
      },
    ],
    ending: {
      start: 14,
      end: 121,
    },
  },
  {
    name: '06sec',
    duration: 6,
    periods: [
      {
        start: 6,
        end: 12,
      },
      {
        start: 6,
        end: 12,
      },
      {
        start: 6,
        end: 12,
      },
    ],
    ending: {
      start: 13,
      end: 121,
    },
  },
  {
    name: '05sec',
    duration: 5,
    periods: [
      {
        start: 6,
        end: 11,
      },
      {
        start: 6,
        end: 11,
      },
      {
        start: 6,
        end: 11,
      },
    ],
    ending: {
      start: 12,
      end: 121,
    },
  },
  {
    name: '04sec',
    duration: 4,
    periods: [
      {
        start: 6,
        end: 10,
      },
      {
        start: 6,
        end: 10,
      },
      {
        start: 6,
        end: 10,
      },
    ],
    ending: {
      start: 11,
      end: 121,
    },
  },
  {
    name: '03sec',
    duration: 3,
    periods: [
      {
        start: 6,
        end: 9,
      },
      {
        start: 6,
        end: 9,
      },
      {
        start: 6,
        end: 9,
      },
    ],
    ending: {
      start: 10,
      end: 121,
    },
  },
  {
    name: '02sec',
    duration: 2,
    periods: [
      {
        start: 6,
        end: 8,
      },
      {
        start: 6,
        end: 8,
      },
      {
        start: 6,
        end: 8,
      },
    ],
    ending: {
      start: 9,
      end: 121,
    },
  },
]

export const PRESENTATION134_FOLDER_MAP = [
  {
    name: '40sec',
    duration: 40,
    periods: [
      {
        start: 4,
        end: 44,
      },
      {
        start: 4,
        end: 44,
      },
      {
        start: 4,
        end: 44,
      },
    ],
    ending: {
      start: 45,
      end: 121,
    },
  },
  {
    name: '36sec',
    duration: 36,
    periods: [
      {
        start: 4,
        end: 40,
      },
      {
        start: 4,
        end: 40,
      },
      {
        start: 4,
        end: 40,
      },
    ],
    ending: {
      start: 41,
      end: 121,
    },
  },
  {
    name: '33sec',
    duration: 33,
    periods: [
      {
        start: 4,
        end: 37,
      },
      {
        start: 4,
        end: 37,
      },
      {
        start: 4,
        end: 37,
      },
    ],
    ending: {
      start: 38,
      end: 121,
    },
  },
  {
    name: '30sec',
    duration: 30,
    periods: [
      {
        start: 4,
        end: 34,
      },
      {
        start: 4,
        end: 34,
      },
      {
        start: 4,
        end: 34,
      },
    ],
    ending: {
      start: 35,
      end: 121,
    },
  },
  {
    name: '25sec',
    duration: 25,
    periods: [
      {
        start: 4,
        end: 29,
      },
      {
        start: 4,
        end: 29,
      },
      {
        start: 4,
        end: 29,
      },
    ],
    ending: {
      start: 30,
      end: 121,
    },
  },
  {
    name: '23sec',
    duration: 23,
    periods: [
      {
        start: 4,
        end: 27,
      },
      {
        start: 4,
        end: 27,
      },
      {
        start: 4,
        end: 27,
      },
    ],
    ending: {
      start: 28,
      end: 121,
    },
  },
  {
    name: '21sec',
    duration: 21,
    periods: [
      {
        start: 4,
        end: 25,
      },
      {
        start: 4,
        end: 25,
      },
      {
        start: 4,
        end: 25,
      },
    ],
    ending: {
      start: 26,
      end: 121,
    },
  },
  {
    name: '19sec',
    duration: 19,
    periods: [
      {
        start: 4,
        end: 23,
      },
      {
        start: 4,
        end: 23,
      },
      {
        start: 4,
        end: 23,
      },
    ],
    ending: {
      start: 24,
      end: 121,
    },
  },
  {
    name: '17sec',
    duration: 17,
    periods: [
      {
        start: 4,
        end: 21,
      },
      {
        start: 4,
        end: 21,
      },
      {
        start: 4,
        end: 21,
      },
    ],
    ending: {
      start: 22,
      end: 121,
    },
  },
  {
    name: '15sec',
    duration: 15,
    periods: [
      {
        start: 4,
        end: 19,
      },
      {
        start: 4,
        end: 19,
      },
      {
        start: 4,
        end: 19,
      },
    ],
    ending: {
      start: 20,
      end: 121,
    },
  },
  {
    name: '12sec',
    duration: 12,
    periods: [
      {
        start: 4,
        end: 16,
      },
      {
        start: 4,
        end: 16,
      },
      {
        start: 4,
        end: 16,
      },
    ],
    ending: {
      start: 17,
      end: 121,
    },
  },
  {
    name: '10sec',
    duration: 10,
    periods: [
      {
        start: 4,
        end: 14,
      },
      {
        start: 4,
        end: 14,
      },
      {
        start: 4,
        end: 14,
      },
    ],
    ending: {
      start: 15,
      end: 121,
    },
  },
  {
    name: '09sec',
    duration: 9,
    periods: [
      {
        start: 4,
        end: 13,
      },
      {
        start: 4,
        end: 13,
      },
      {
        start: 4,
        end: 13,
      },
    ],
    ending: {
      start: 14,
      end: 121,
    },
  },
  {
    name: '08sec',
    duration: 8,
    periods: [
      {
        start: 4,
        end: 12,
      },
      {
        start: 4,
        end: 12,
      },
      {
        start: 4,
        end: 12,
      },
    ],
    ending: {
      start: 13,
      end: 121,
    },
  },
  {
    name: '07sec',
    duration: 7,
    periods: [
      {
        start: 4,
        end: 11,
      },
      {
        start: 4,
        end: 11,
      },
      {
        start: 4,
        end: 11,
      },
    ],
    ending: {
      start: 12,
      end: 121,
    },
  },
  {
    name: '06sec',
    duration: 6,
    periods: [
      {
        start: 4,
        end: 10,
      },
      {
        start: 4,
        end: 10,
      },
      {
        start: 4,
        end: 10,
      },
    ],
    ending: {
      start: 11,
      end: 121,
    },
  },
  {
    name: '05sec',
    duration: 5,
    periods: [
      {
        start: 4,
        end: 9,
      },
      {
        start: 4,
        end: 9,
      },
      {
        start: 4,
        end: 9,
      },
    ],
    ending: {
      start: 10,
      end: 121,
    },
  },
  {
    name: '04sec',
    duration: 4,
    periods: [
      {
        start: 4,
        end: 8,
      },
      {
        start: 4,
        end: 8,
      },
      {
        start: 4,
        end: 8,
      },
    ],
    ending: {
      start: 9,
      end: 121,
    },
  },
  {
    name: '03sec',
    duration: 3,
    periods: [
      {
        start: 4,
        end: 7,
      },
      {
        start: 4,
        end: 7,
      },
      {
        start: 4,
        end: 7,
      },
    ],
    ending: {
      start: 8,
      end: 121,
    },
  },
  {
    name: '02sec',
    duration: 2,
    periods: [
      {
        start: 4,
        end: 6,
      },
      {
        start: 4,
        end: 6,
      },
      {
        start: 4,
        end: 6,
      },
    ],
    ending: {
      start: 7,
      end: 121,
    },
  },
]

export const PRESENTATION170_FOLDER_MAP = [
  {
    name: '40sec',
    duration: 40,
    periods: [
      {
        start: 6,
        end: 46,
      },
      {
        start: 6,
        end: 46,
      },
      {
        start: 6,
        end: 46,
      },
    ],
    ending: {
      start: 47,
      end: 121,
    },
  },
  {
    name: '36sec',
    duration: 36,
    periods: [
      {
        start: 6,
        end: 42,
      },
      {
        start: 6,
        end: 42,
      },
      {
        start: 6,
        end: 42,
      },
    ],
    ending: {
      start: 43,
      end: 121,
    },
  },
  {
    name: '33sec',
    duration: 33,
    periods: [
      {
        start: 6,
        end: 39,
      },
      {
        start: 6,
        end: 39,
      },
      {
        start: 6,
        end: 39,
      },
    ],
    ending: {
      start: 40,
      end: 121,
    },
  },
  {
    name: '30sec',
    duration: 30,
    periods: [
      {
        start: 6,
        end: 36,
      },
      {
        start: 6,
        end: 36,
      },
      {
        start: 6,
        end: 36,
      },
    ],
    ending: {
      start: 37,
      end: 121,
    },
  },
  {
    name: '25sec',
    duration: 25,
    periods: [
      {
        start: 6,
        end: 31,
      },
      {
        start: 6,
        end: 31,
      },
      {
        start: 6,
        end: 31,
      },
    ],
    ending: {
      start: 32,
      end: 121,
    },
  },
  {
    name: '23sec',
    duration: 23,
    periods: [
      {
        start: 6,
        end: 29,
      },
      {
        start: 6,
        end: 29,
      },
      {
        start: 6,
        end: 29,
      },
    ],
    ending: {
      start: 30,
      end: 121,
    },
  },
  {
    name: '21sec',
    duration: 21,
    periods: [
      {
        start: 6,
        end: 27,
      },
      {
        start: 6,
        end: 27,
      },
      {
        start: 6,
        end: 27,
      },
    ],
    ending: {
      start: 28,
      end: 121,
    },
  },
  {
    name: '19sec',
    duration: 19,
    periods: [
      {
        start: 6,
        end: 25,
      },
      {
        start: 6,
        end: 25,
      },
      {
        start: 6,
        end: 25,
      },
    ],
    ending: {
      start: 26,
      end: 121,
    },
  },
  {
    name: '17sec',
    duration: 17,
    periods: [
      {
        start: 6,
        end: 23,
      },
      {
        start: 6,
        end: 23,
      },
      {
        start: 6,
        end: 23,
      },
    ],
    ending: {
      start: 24,
      end: 121,
    },
  },
  {
    name: '15sec',
    duration: 15,
    periods: [
      {
        start: 6,
        end: 21,
      },
      {
        start: 6,
        end: 21,
      },
      {
        start: 6,
        end: 21,
      },
    ],
    ending: {
      start: 22,
      end: 121,
    },
  },
  {
    name: '12sec',
    duration: 12,
    periods: [
      {
        start: 6,
        end: 19,
      },
      {
        start: 6,
        end: 19,
      },
      {
        start: 6,
        end: 19,
      },
    ],
    ending: {
      start: 20,
      end: 121,
    },
  },
  {
    name: '10sec',
    duration: 10,
    periods: [
      {
        start: 6,
        end: 16,
      },
      {
        start: 6,
        end: 16,
      },
      {
        start: 6,
        end: 16,
      },
    ],
    ending: {
      start: 17,
      end: 121,
    },
  },
  {
    name: '09sec',
    duration: 9,
    periods: [
      {
        start: 6,
        end: 15,
      },
      {
        start: 6,
        end: 15,
      },
      {
        start: 6,
        end: 15,
      },
    ],
    ending: {
      start: 16,
      end: 121,
    },
  },
  {
    name: '08sec',
    duration: 8,
    periods: [
      {
        start: 6,
        end: 14,
      },
      {
        start: 6,
        end: 14,
      },
      {
        start: 6,
        end: 14,
      },
    ],
    ending: {
      start: 15,
      end: 121,
    },
  },
  {
    name: '07sec',
    duration: 7,
    periods: [
      {
        start: 6,
        end: 13,
      },
      {
        start: 6,
        end: 13,
      },
      {
        start: 6,
        end: 13,
      },
    ],
    ending: {
      start: 14,
      end: 121,
    },
  },
  {
    name: '06sec',
    duration: 6,
    periods: [
      {
        start: 6,
        end: 12,
      },
      {
        start: 6,
        end: 12,
      },
      {
        start: 6,
        end: 12,
      },
    ],
    ending: {
      start: 13,
      end: 121,
    },
  },
  {
    name: '05sec',
    duration: 5,
    periods: [
      {
        start: 6,
        end: 11,
      },
      {
        start: 6,
        end: 11,
      },
      {
        start: 6,
        end: 11,
      },
    ],
    ending: {
      start: 12,
      end: 121,
    },
  },
  {
    name: '04sec',
    duration: 4,
    periods: [
      {
        start: 6,
        end: 10,
      },
      {
        start: 6,
        end: 10,
      },
      {
        start: 6,
        end: 10,
      },
    ],
    ending: {
      start: 11,
      end: 121,
    },
  },
  {
    name: '03sec',
    duration: 3,
    periods: [
      {
        start: 6,
        end: 9,
      },
      {
        start: 6,
        end: 9,
      },
      {
        start: 6,
        end: 9,
      },
    ],
    ending: {
      start: 10,
      end: 121,
    },
  },
  {
    name: '02sec',
    duration: 2,
    periods: [
      {
        start: 6,
        end: 8,
      },
      {
        start: 6,
        end: 8,
      },
      {
        start: 6,
        end: 8,
      },
    ],
    ending: {
      start: 9,
      end: 121,
    },
  },
]

export const PRESENTATION200_FOLDER_MAP = [
  {
    name: '40sec',
    duration: 40,
    periods: [
      {
        start: 6,
        end: 46,
      },
      {
        start: 6,
        end: 46,
      },
      {
        start: 6,
        end: 46,
      },
    ],
    ending: {
      start: 47,
      end: 121,
    },
  },
  {
    name: '36sec',
    duration: 36,
    periods: [
      {
        start: 6,
        end: 42,
      },
      {
        start: 6,
        end: 42,
      },
      {
        start: 6,
        end: 42,
      },
    ],
    ending: {
      start: 43,
      end: 121,
    },
  },
  {
    name: '33sec',
    duration: 33,
    periods: [
      {
        start: 6,
        end: 39,
      },
      {
        start: 6,
        end: 39,
      },
      {
        start: 6,
        end: 39,
      },
    ],
    ending: {
      start: 40,
      end: 121,
    },
  },
  {
    name: '30sec',
    duration: 30,
    periods: [
      {
        start: 6,
        end: 36,
      },
      {
        start: 6,
        end: 36,
      },
      {
        start: 6,
        end: 36,
      },
    ],
    ending: {
      start: 37,
      end: 121,
    },
  },
  {
    name: '25sec',
    duration: 25,
    periods: [
      {
        start: 6,
        end: 31,
      },
      {
        start: 6,
        end: 31,
      },
      {
        start: 6,
        end: 31,
      },
    ],
    ending: {
      start: 32,
      end: 121,
    },
  },
  {
    name: '23sec',
    duration: 23,
    periods: [
      {
        start: 6,
        end: 29,
      },
      {
        start: 6,
        end: 29,
      },
      {
        start: 6,
        end: 29,
      },
    ],
    ending: {
      start: 30,
      end: 121,
    },
  },
  {
    name: '21sec',
    duration: 21,
    periods: [
      {
        start: 6,
        end: 27,
      },
      {
        start: 6,
        end: 27,
      },
      {
        start: 6,
        end: 27,
      },
    ],
    ending: {
      start: 28,
      end: 121,
    },
  },
  {
    name: '19sec',
    duration: 19,
    periods: [
      {
        start: 6,
        end: 25,
      },
      {
        start: 6,
        end: 25,
      },
      {
        start: 6,
        end: 25,
      },
    ],
    ending: {
      start: 26,
      end: 121,
    },
  },
  {
    name: '17sec',
    duration: 17,
    periods: [
      {
        start: 6,
        end: 23,
      },
      {
        start: 6,
        end: 23,
      },
      {
        start: 6,
        end: 23,
      },
    ],
    ending: {
      start: 24,
      end: 121,
    },
  },
  {
    name: '15sec',
    duration: 15,
    periods: [
      {
        start: 6,
        end: 21,
      },
      {
        start: 6,
        end: 21,
      },
      {
        start: 6,
        end: 21,
      },
    ],
    ending: {
      start: 22,
      end: 121,
    },
  },
  {
    name: '12sec',
    duration: 12,
    periods: [
      {
        start: 6,
        end: 19,
      },
      {
        start: 6,
        end: 19,
      },
      {
        start: 6,
        end: 19,
      },
    ],
    ending: {
      start: 20,
      end: 121,
    },
  },
  {
    name: '10sec',
    duration: 10,
    periods: [
      {
        start: 6,
        end: 16,
      },
      {
        start: 6,
        end: 16,
      },
      {
        start: 6,
        end: 16,
      },
    ],
    ending: {
      start: 17,
      end: 121,
    },
  },
  {
    name: '09sec',
    duration: 9,
    periods: [
      {
        start: 6,
        end: 15,
      },
      {
        start: 6,
        end: 15,
      },
      {
        start: 6,
        end: 15,
      },
    ],
    ending: {
      start: 16,
      end: 121,
    },
  },
  {
    name: '08sec',
    duration: 8,
    periods: [
      {
        start: 6,
        end: 14,
      },
      {
        start: 6,
        end: 14,
      },
      {
        start: 6,
        end: 14,
      },
    ],
    ending: {
      start: 15,
      end: 121,
    },
  },
  {
    name: '07sec',
    duration: 7,
    periods: [
      {
        start: 6,
        end: 13,
      },
      {
        start: 6,
        end: 13,
      },
      {
        start: 6,
        end: 13,
      },
    ],
    ending: {
      start: 14,
      end: 121,
    },
  },
  {
    name: '06sec',
    duration: 6,
    periods: [
      {
        start: 6,
        end: 12,
      },
      {
        start: 6,
        end: 12,
      },
      {
        start: 6,
        end: 12,
      },
    ],
    ending: {
      start: 13,
      end: 121,
    },
  },
  {
    name: '05sec',
    duration: 5,
    periods: [
      {
        start: 6,
        end: 11,
      },
      {
        start: 6,
        end: 11,
      },
      {
        start: 6,
        end: 11,
      },
    ],
    ending: {
      start: 12,
      end: 121,
    },
  },
  {
    name: '04sec',
    duration: 4,
    periods: [
      {
        start: 6,
        end: 10,
      },
      {
        start: 6,
        end: 10,
      },
      {
        start: 6,
        end: 10,
      },
    ],
    ending: {
      start: 11,
      end: 121,
    },
  },
  {
    name: '03sec',
    duration: 3,
    periods: [
      {
        start: 6,
        end: 9,
      },
      {
        start: 6,
        end: 9,
      },
      {
        start: 6,
        end: 9,
      },
    ],
    ending: {
      start: 10,
      end: 121,
    },
  },
  {
    name: '02sec',
    duration: 2,
    periods: [
      {
        start: 6,
        end: 8,
      },
      {
        start: 6,
        end: 8,
      },
      {
        start: 6,
        end: 8,
      },
    ],
    ending: {
      start: 9,
      end: 121,
    },
  },
]

export const PRESENTATION210_FOLDER_MAP = [
  {
    name: '40sec',
    duration: 40,
    periods: [
      {
        start: 6,
        end: 46,
      },
      {
        start: 6,
        end: 46,
      },
      {
        start: 6,
        end: 46,
      },
    ],
    ending: {
      start: 47,
      end: 121,
    },
  },
  {
    name: '36sec',
    duration: 36,
    periods: [
      {
        start: 6,
        end: 42,
      },
      {
        start: 6,
        end: 42,
      },
      {
        start: 6,
        end: 42,
      },
    ],
    ending: {
      start: 43,
      end: 121,
    },
  },
  {
    name: '33sec',
    duration: 33,
    periods: [
      {
        start: 6,
        end: 39,
      },
      {
        start: 6,
        end: 39,
      },
      {
        start: 6,
        end: 39,
      },
    ],
    ending: {
      start: 40,
      end: 121,
    },
  },
  {
    name: '30sec',
    duration: 30,
    periods: [
      {
        start: 6,
        end: 36,
      },
      {
        start: 6,
        end: 36,
      },
      {
        start: 6,
        end: 36,
      },
    ],
    ending: {
      start: 37,
      end: 121,
    },
  },
  {
    name: '25sec',
    duration: 25,
    periods: [
      {
        start: 6,
        end: 31,
      },
      {
        start: 6,
        end: 31,
      },
      {
        start: 6,
        end: 31,
      },
    ],
    ending: {
      start: 32,
      end: 121,
    },
  },
  {
    name: '23sec',
    duration: 23,
    periods: [
      {
        start: 6,
        end: 29,
      },
      {
        start: 6,
        end: 29,
      },
      {
        start: 6,
        end: 29,
      },
    ],
    ending: {
      start: 30,
      end: 121,
    },
  },
  {
    name: '21sec',
    duration: 21,
    periods: [
      {
        start: 6,
        end: 27,
      },
      {
        start: 6,
        end: 27,
      },
      {
        start: 6,
        end: 27,
      },
    ],
    ending: {
      start: 28,
      end: 121,
    },
  },
  {
    name: '19sec',
    duration: 19,
    periods: [
      {
        start: 6,
        end: 25,
      },
      {
        start: 6,
        end: 25,
      },
      {
        start: 6,
        end: 25,
      },
    ],
    ending: {
      start: 26,
      end: 121,
    },
  },
  {
    name: '17sec',
    duration: 17,
    periods: [
      {
        start: 6,
        end: 23,
      },
      {
        start: 6,
        end: 23,
      },
      {
        start: 6,
        end: 23,
      },
    ],
    ending: {
      start: 24,
      end: 121,
    },
  },
  {
    name: '15sec',
    duration: 15,
    periods: [
      {
        start: 6,
        end: 21,
      },
      {
        start: 6,
        end: 21,
      },
      {
        start: 6,
        end: 21,
      },
    ],
    ending: {
      start: 22,
      end: 121,
    },
  },
  {
    name: '12sec',
    duration: 12,
    periods: [
      {
        start: 6,
        end: 19,
      },
      {
        start: 6,
        end: 19,
      },
      {
        start: 6,
        end: 19,
      },
    ],
    ending: {
      start: 20,
      end: 121,
    },
  },
  {
    name: '10sec',
    duration: 10,
    periods: [
      {
        start: 6,
        end: 16,
      },
      {
        start: 6,
        end: 16,
      },
      {
        start: 6,
        end: 16,
      },
    ],
    ending: {
      start: 17,
      end: 121,
    },
  },
  {
    name: '09sec',
    duration: 9,
    periods: [
      {
        start: 6,
        end: 15,
      },
      {
        start: 6,
        end: 15,
      },
      {
        start: 6,
        end: 15,
      },
    ],
    ending: {
      start: 16,
      end: 121,
    },
  },
  {
    name: '08sec',
    duration: 8,
    periods: [
      {
        start: 6,
        end: 14,
      },
      {
        start: 6,
        end: 14,
      },
      {
        start: 6,
        end: 14,
      },
    ],
    ending: {
      start: 15,
      end: 121,
    },
  },
  {
    name: '07sec',
    duration: 7,
    periods: [
      {
        start: 6,
        end: 13,
      },
      {
        start: 6,
        end: 13,
      },
      {
        start: 6,
        end: 13,
      },
    ],
    ending: {
      start: 14,
      end: 121,
    },
  },
  {
    name: '06sec',
    duration: 6,
    periods: [
      {
        start: 6,
        end: 12,
      },
      {
        start: 6,
        end: 12,
      },
      {
        start: 6,
        end: 12,
      },
    ],
    ending: {
      start: 13,
      end: 121,
    },
  },
  {
    name: '05sec',
    duration: 5,
    periods: [
      {
        start: 6,
        end: 11,
      },
      {
        start: 6,
        end: 11,
      },
      {
        start: 6,
        end: 11,
      },
    ],
    ending: {
      start: 12,
      end: 121,
    },
  },
  {
    name: '04sec',
    duration: 4,
    periods: [
      {
        start: 6,
        end: 10,
      },
      {
        start: 6,
        end: 10,
      },
      {
        start: 6,
        end: 10,
      },
    ],
    ending: {
      start: 11,
      end: 121,
    },
  },
  {
    name: '03sec',
    duration: 3,
    periods: [
      {
        start: 6,
        end: 9,
      },
      {
        start: 6,
        end: 9,
      },
      {
        start: 6,
        end: 9,
      },
    ],
    ending: {
      start: 10,
      end: 121,
    },
  },
  {
    name: '02sec',
    duration: 2,
    periods: [
      {
        start: 6,
        end: 8,
      },
      {
        start: 6,
        end: 8,
      },
      {
        start: 6,
        end: 8,
      },
    ],
    ending: {
      start: 9,
      end: 121,
    },
  },
]
// If duration is equal 0, contrast duration is 0
// If duration > 0, is must be greater than 2 or 2
export const MIN_CONTRAST_DURATION_TIME = 2

export const DEFAULT_ROI_RADIUS = 7
export const DEFAULT_ROI_STROKE_WIDTH = 3

export const HU_TRIGGER_TYPE = {
  AUTOMATIC: 1,
  MANUAL: 2,
}

export const MAXIMUM_DURATION_OF_MOVING_MRI_MACHINE = 2
export const ANSWER_VIEWS_IMAGE_ID = {
  POSITION_SCREENSHOT: 'positionScreenshot',
  INJECTOR_DOSE_SCREENSHOT: 'injectorDoseScreenshot',
  TIMING_DECISION_CONFIRM_SCREENSHOT: 'timingDecisionConfirmScreenshot',
  INJECTOR_SCREENSHOT: 'injectorScreenshot',
  TIMING_DECISION_ROI_SCREENSHOT: 'timingDecisionROIScreenshot',
  TIMING_DECISION_CHART_SCREENSHOT: 'timingDecisionChartScreenshot',
}

export const NUM_OF_LOCALIZER_SLICES_OF_CT = 50

export const TIMING_DECISION_MAX_PRESENTATION_STEP = 10000

export const TIMING_DECISION_CONFIG_TABS = {
  SET_DELAY: 'SET_DELAY',
  BOLUS_TRACKING: 'BOLUS_TRACKING',
  TEST_BOLUS: 'TEST_BOLUS',
}

export const INJECTOR_FLOW_TYPES = {
  TEST_SALINE: 'TEST_SALINE',
  TEST_CONTRAST: 'TEST_CONTRAST',
  CONTRAST: 'CONTRAST',
  SALINE: 'SALINE',
  CONTRAST1: 'CONTRAST1',
  CONTRAST2: 'CONTRAST2',
  SALINE_RATE: 'SALINE_RATE',
}

export const PHYSIO_ECG_GROUP_NAME = {
  FIRST_P: 'FIRST_P',
  FIRST_Q: 'FIRST_Q',
  FIRST_R: 'FIRST_R',
  FIRST_S: 'FIRST_S',
  // FIRST_QRS: 'FIRST_QRS',
  FIRST_T: 'FIRST_T',
  SECOND_P: 'SECOND_P',
  SECOND_Q: 'SECOND_Q',
  SECOND_R: 'SECOND_R',
  SECOND_S: 'SECOND_S',
  // SECOND_QRS: 'SECOND_QRS',
  SECOND_T: 'SECOND_T',
}

export const ECGChartConfig = {
  PTriangle: {
    width: 30,
    height: 15,
    angle: 0,
    fill: '#FFFF00',
  },
  QTriangle: {
    width: 15,
    height: 8,
    angle: 180,
    fill: '#FFC000',
  },
  RTriangle: {
    width: 15,
    height: 140,
    angle: 0,
    fill: '#4472C4',
  },
  STriangle: {
    width: 15,
    height: 30,
    angle: 180,
    fill: '#92D050',
  },
  TTriangle: {
    width: 60,
    height: 30,
    angle: 0,
    fill: '#7030A0',
  },
}

export const ECG_DISTANCE_RATE = 1.5
export const INJECTOR_SPEED = {
  NONE: 0,
  TWO_TIMES: 1,
  FOURTH_TIMES: 2,
  EIGHTH_TIMES: 3,
}

export const LOCALIZER_BOX_IDENT = 'localizer'
export const SCAN_BOX_IDENT = 'scan'

export const CARDIAC_LEVEL = {
  INITIAL: 1,
  BETA_BLOCKER: 2,
  NITRO: 3,
  STRESS: 4,
  NITRO_WITH_BB: 5,
}
export const CARDIAC_LEVEL_OPTIONS = [
  {
    text: 'Initial',
    value: CARDIAC_LEVEL.INITIAL,
  },
  {
    text: 'Beta Blocker',
    value: CARDIAC_LEVEL.BETA_BLOCKER,
  },
  {
    text: 'Nitro no BB',
    value: CARDIAC_LEVEL.NITRO,
  },
  {
    text: 'Nitro with BB',
    value: CARDIAC_LEVEL.NITRO_WITH_BB,
  },
  {
    text: 'Stress',
    value: CARDIAC_LEVEL.STRESS,
  },
]

export const RESOURCE_TYPES = {
  LINK: 1,
  FILE: 2,
  VIDEO: 3,
}

export const RESOURCE_TYPE_OPTIONS = [
  {
    text: 'Link',
    value: RESOURCE_TYPES.LINK,
  },
  {
    text: 'File',
    value: RESOURCE_TYPES.FILE,
  },
  {
    text: 'Video',
    value: RESOURCE_TYPES.VIDEO,
  },
]

export const DEFAULT_RESPIRATORY_CYLE_DURATION = 3000
export const DEFAULT_CARDIAC_CYCLE_DURATION = 700
export const MAXIMUM_SAT_BAND = 5

export const MAXIMUM_BLOOTH_TUBE_STEP = 121
export const MAXIMUM_ROI_STEP = 122
export const ECG_VIEW_TYPE = {
  VLA: 'VLA',
  SAX: 'SAX',
  HLA: 'HLA',
  '3CH': '3CH',
}
export const ECG_VIEW_TYPE_OPTIONS = [
  {
    text: '2CH/VLA',
    value: ECG_VIEW_TYPE.VLA,
  },
  {
    text: 'SAX',
    value: ECG_VIEW_TYPE.SAX,
  },
  {
    text: '4CH/HLA',
    value: ECG_VIEW_TYPE.HLA,
  },
  {
    text: '3CH',
    value: ECG_VIEW_TYPE['3CH'],
  },
]

export const SOFTWARE_VERSION = {
  LX: 'lx',
  NEWUI: 'newUI',
  R57: 'r57',
  B19: 'b19',
  XA: 'xa',
}

export const SELECTION_CONFIG_DISPLAY_MODE = {
  DEFAULT: 'default',
  CRITERIA_AND_PARAMETER: 'criteriaAndParameter',
  ULTRALAB_TAB: 'ultralabTab',
}

export const USER_AREA = {
  US_EAST: 'us_east',
  EU_WEST: 'eu_west',
}

export const USER_AREA_OPTIONS = [
  {
    text: 'US East',
    value: USER_AREA.US_EAST,
  },
  {
    text: 'EU West',
    value: USER_AREA.EU_WEST,
  },
]

export const SCAN_DIRECTION = {
  HEAD_TO_FOOT: 1,
  FOOT_TO_HEAD: 2,
}

export const DEFAULT_QUESTION_PROBE = {
  id: null,
  bodyPartId: null,
  scanDirection: SCAN_DIRECTION.HEAD_TO_FOOT,
  visibleProbes: [],
}

export const RANDOM_COLORS = [
  '#00FF00', // Green
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#89CFF0', // Baby blue
  '#2B53B8',
  '#8FA21F',
  '#31666C',
  '#FBF245',
  '#778339',
  '#33E29A',
  '#668581',
  '#9C92C7',
  '#A1B40F',
  '#07CB0E',
  '#FF7209',
  '#D88962',
  '#E3A5A7',
  '#795714',
  '#26509D',
  '#87CA5B',
  '#AA22F7',
  '#58A117',
  '#7B4311',
  '#33C7B3',
  '#890F4E',
  '#9819DA',
  '#6FBD5B',
  '#AC4CEE',
  '#6B5AFF',
  '#3E1542',
  '#93D3FE',
  '#88F20E',
  '#C3106A',
  '#BD4AAD',
  '#966A1A',
  '#FD338B',
  '#746787',
  '#3EC561',
  '#47BE8C',
  '#2E3899',
  '#D54DDD',
  '#3A0EE6',
  '#30705C',
  '#9E6B93',
  '#BB8332',
  '#B87C0F',
  '#0E292B',
  '#AD9A9E',
  '#3038E9',
  '#A3C1AD',
  '#DF8769',
  '#916C8C',
  '#70E0E2',
  '#AF68B6',
  '#D076DD',
  '#CAFB26',
  '#25CE44',
  '#1ED0DE',
  '#E20E0F',
  '#1423CB',
  '#D0D54C',
  '#1A1DC2',
  '#C21122',
  '#00331D',
  '#26B28A',
  '#8E1887',
  '#6BA47B',
  '#6B43B0',
  '#A97B5F',
  '#5A7723',
  '#A64A5B',
  '#3124C0',
  '#FE7574',
  '#01A15D',
  '#BE6827',
  '#62C597',
  '#F6A861',
  '#7FE8CB',
  '#C6BB45',
  '#F1F535',
  '#7DDD0C',
  '#940009',
  '#5694F3',
  '#5CD23F',
  '#5CD3E7',
  '#D5A9BB',
  '#CFC1D7',
  '#460490',
  '#C7817F',
  '#1EDEBD',
  '#73D215',
  '#1D1F79',
  '#754373',
  '#61FA31',
  '#E30DC4',
  '#7F4641',
  '#34A91A',
  '#779037',
  '#0293DD',
  '#7082B4',
  '#B98DB7',
  '#66F806',
  '#818B7A',
  '#CA565B',
]

export const TUBE_CONFIG = {
  MIN: 10,
  MAX: 800,
  DEFAULT: 200,
}
