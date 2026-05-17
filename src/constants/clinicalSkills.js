import config from '../config'

const CT_SKILLS = [
  { id: 'patient-screening-safety', label: 'Patient Screening and Safety' },
  { id: 'contrast-injector-practices', label: 'Contrast and Injector Practices' },
  // { id: 'delay-time', label: 'Delay Time' },
  // { id: 'contrast-flow', label: 'Contrast Flow' },
  // { id: 'contrast-volume', label: 'Contrast Volume' },
  // { id: 'saline-flow', label: 'Saline Flow' },
  // { id: 'saline-volume', label: 'Saline Volume' },
  { id: 'patient-positioning-interactions', label: 'Patient Positioning and Interactions' },
  // { id: 'patient-positioning-selection', label: 'Patient Positioning Selection' },
  // { id: 'si-landmarking', label: 'S/I Landmarking' },
  // { id: 'ap-landmarking', label: 'A/P Landmarking' },
  { id: 'slice-prescription', label: 'Slice Prescription' },
  { id: 'parameter-manipulation', label: 'Parameter Manipulation' },
  { id: 'contrast-image-timing', label: 'Contrast and Image Timing' },
]

const MR_SKILLS = [
  { id: 'thickness-spacing', label: 'Thickness/ Spacing' },
  { id: 'phase-frequency-encoding', label: 'Phase/ Frequency Encoding' },
  { id: 'angulation', label: 'Angulation' },
  { id: 'coverage', label: 'Coverage' },
  { id: 'field-of-view', label: 'Field of View' },
  { id: 'spatial-resolution', label: 'Spatial Resolution' },
  { id: 'contrast-parameters', label: 'Contrast Parameters' },
  { id: 'snr-of-resulting-images', label: 'SNR of Resulting Images' },
  { id: 'time', label: 'Time' },
  { id: 'pixel-shift', label: 'Pixel Shift' },
  { id: 'tr-efficiency', label: 'TR Efficiency' },
]

export const CLINICAL_SKILLS = config.isCTLab ? CT_SKILLS : MR_SKILLS
