import _ from 'lodash'

const VENDOR_STYLES = {
  HITACHI: 'hitachi',
  GE: 'ge',
  PHILIPS: 'philips',
  SIEMENS: 'siemens',
  UNITED: 'united',
  CANON: 'canon',
}

function createLabels(t, sequenceType = null) {
  return {
    swap: {
      siemens: t('MRI.swap_phase'),
      ge: t('MRI.swap_frequency'),
      philips: t('MRI.swap_phase'),
      hitachi: t('MRI.swap_phase'),
      united: t('MRI.swap_phase'),
      canon: t('MRI.swap_phase'),
    },
    gap: {
      siemens: t('global.distance_factor'),
      ge: t('global.slice_gap'),
      philips: t('global.slice_gap'),
      hitachi: t('global.slice_interval'),
      united: t('global.slice_gap'),
      canon: t('global.slice_gap'),
    },
    wrapPrevent: {
      siemens: t('SelectionConfigForm.oversampling'),
      ge: t('SelectionConfigForm.no_phase_wrap'),
      philips: t('SelectionConfigForm.fold_over_suppression'),
      hitachi: t('SelectionConfigForm.anti_wrap'),
      united: t('SelectionConfigForm.no_wrap'),
      canon: t('SelectionConfigForm.no_wrap'),
    },
    averageLabel: {
      siemens: t('SelectionConfigForm.averages'),
      ge: t('SelectionConfigForm.nex'),
      philips: t('SelectionConfigForm.nsa'),
      hitachi: t('SelectionConfigForm.nsa'),
      united: t('SelectionConfigForm.naq'),
      canon: t('SelectionConfigForm.naq'),
    },
    concatenationLabel: {
      siemens: t('SelectionConfigForm.concatenations'),
      ge: t('SelectionConfigForm.acquisitions'),
      philips: t('SelectionConfigForm.packages'),
      hitachi: t('SelectionConfigForm.acquisitions'),
      united: t('SelectionConfigForm.covers'),
      canon: t('SelectionConfigForm.covers'),
    },
    echoTrainLabel: {
      siemens:
        sequenceType === 'DIFF' ? t('SelectionConfigForm.phase_encoding_lines') : t('SelectionConfigForm.turbo_factor'),
      ge:
        sequenceType === 'DIFF'
          ? t('SelectionConfigForm.phase_encoding_lines')
          : t('SelectionConfigForm.echo_train_length'),
      philips:
        sequenceType === 'DIFF'
          ? t('SelectionConfigForm.phase_encoding_lines')
          : t('SelectionConfigForm.echo_train_length'),
      hitachi:
        sequenceType === 'DIFF' ? t('SelectionConfigForm.phase_encoding_lines') : t('SelectionConfigForm.echo_factor'),
      united:
        sequenceType === 'DIFF' ? t('SelectionConfigForm.phase_encoding_lines') : t('SelectionConfigForm.turbo_factor'),
      canon:
        sequenceType === 'DIFF' ? t('SelectionConfigForm.phase_encoding_lines') : t('SelectionConfigForm.echo_factor'),
    },
    partialFourier: {
      siemens: t('SelectionConfigForm.partial_fourier'),
      ge: t('SelectionConfigForm.half_nex'),
      philips: t('SelectionConfigForm.half_scan'),
      hitachi: t('SelectionConfigForm.half_scan'),
      united: t('SelectionConfigForm.afi'),
      canon: t('SelectionConfigForm.afi'),
    },
    parallelFactor: {
      siemens: t('SelectionConfigForm.i_pat_factor'),
      ge: t('SelectionConfigForm.asset_factor'),
      philips: t('SelectionConfigForm.sense_factor'),
      hitachi: t('SelectionConfigForm.k_rapid_factor'),
      united: t('SelectionConfigForm.speeder'),
      canon: t('SelectionConfigForm.speeder'),
    },
    timeBetweenEchoes: {
      siemens: t('SelectionConfigForm.echo_spacing'),
      ge: t('SelectionConfigForm.echo_spacing'),
      philips: t('SelectionConfigForm.echo_spacing'),
      hitachi: t('SelectionConfigForm.ite'),
      united: t('SelectionConfigForm.ets'),
      canon: t('SelectionConfigForm.ite'),
    },
    frequencyMatrixLabel: {
      siemens: t('global.base_matrix'),
      ge: t('global.frequency_matrix'),
      philips: t('global.frequency_matrix'),
      hitachi: t('global.frequency_matrix'),
      united: t('global.frequency_matrix'),
      canon: t('global.read_out_matrix'),
    },
    phaseMatrixLabel: {
      siemens: t('global.phase_matrix'),
      ge: t('global.phase_matrix'),
      philips: t('global.phase_matrix'),
      hitachi: t('global.phase_matrix'),
      united: t('global.phase_matrix'),
      canon: t('global.pe_matrix'),
    },
    flipAngleLabel: {
      siemens: t('global.flip_angle'),
      ge: t('global.flip_angle'),
      philips: t('global.flip_angle'),
      hitachi: t('global.flip_angle'),
      united: t('global.flip_angle'),
      canon: ['SE', 'TE', 'DIFF'].includes(sequenceType) ? t('global.flop_angle') : t('global.flip_angle'),
    },
    sequenceTypeLabel: {
      siemens: {
        SE: t('SelectionConfigForm.spin_echo'),
        GRE: t('SelectionConfigForm.gradient_echo'),
        TE: t('SelectionConfigForm.turbo_spin_echo'),
        DIFF: t('SelectionConfigForm.spin_echo_diffusion'),
      },
      united: {
        SE: t('SelectionConfigForm.spin_echo'),
        GRE: t('SelectionConfigForm.fast_field_echo'),
        TE: t('SelectionConfigForm.fast_spin_echo'),
        DIFF: t('SelectionConfigForm.spin_echo_diffusion'),
      },
      ge: {
        SE: t('SelectionConfigForm.spin_echo'),
        GRE: t('SelectionConfigForm.gradient_echo'),
        TE: t('SelectionConfigForm.fast_spin_echo'),
        DIFF: t('SelectionConfigForm.spin_echo_diffusion'),
      },
      philips: {
        SE: t('SelectionConfigForm.spin_echo'),
        GRE: t('SelectionConfigForm.fast_field_echo'),
        TE: t('SelectionConfigForm.turbo_spin_echo'),
        DIFF: t('SelectionConfigForm.spin_echo_diffusion'),
      },
      hitachi: {
        SE: t('SelectionConfigForm.spin_echo'),
        GRE: t('SelectionConfigForm.gradient_echo'),
        TE: t('SelectionConfigForm.fast_spin_echo'),
        DIFF: t('SelectionConfigForm.spin_echo_diffusion'),
      },
      canon: {
        SE: t('SelectionConfigForm.spin_echo'),
        GRE: t('SelectionConfigForm.fast_field_echo'),
        TE: t('SelectionConfigForm.fast_spin_echo'),
        DIFF: t('SelectionConfigForm.spin_echo_diffusion'),
      },
    },
    minTRLabel: {
      siemens: t('SelectionConfigForm.min_concat_acq_package_for_siemens'),
      ge: t('SelectionConfigForm.min_concat_acq_package_for_ge'),
      philips: t('SelectionConfigForm.min_concat_acq_package_for_philips'),
      hitachi: t('SelectionConfigForm.min_concat_acq_package_for_hitachi'),
      united: t('SelectionConfigForm.min_concat_acq_package_for_canon'),
      canon: t('SelectionConfigForm.min_concat_acq_package_for_hitachi'),
    },
    frequencyFovLabel: {
      siemens: t('global.frequency_mm'),
      ge: t('global.frequency_mm'),
      philips: t('global.frequency_mm'),
      hitachi: t('global.frequency_mm'),
      united: t('global.frequency_mm'),
      canon: t('global.read_out_fov'),
    },
    phaseFovLabel: {
      siemens: t('global.phase_mm'),
      ge: t('global.phase_mm'),
      philips: t('global.phase_mm'),
      hitachi: t('global.phase_mm'),
      united: t('global.phase_mm'),
      canon: t('global.pe_fov'),
    },
  }
}

function convertSpacing(spacing, vendorStyle = 'default', thickness = 0) {
  if (typeof spacing !== 'number' || isNaN(spacing)) {
    throw new Error('Spacing must be a number')
  }

  if (vendorStyle === VENDOR_STYLES.SIEMENS || vendorStyle === VENDOR_STYLES.UNITED) {
    const value = thickness !== 0 ? _.round((spacing / thickness) * 100) : 0
    return `${value}%`
  }

  return `${_.round(spacing, 1)}mm`
}

function convertDimensionY(dimensionY, vendorStyle = 'default') {
  if (vendorStyle === VENDOR_STYLES.GE || vendorStyle === VENDOR_STYLES.CANON) {
    return `${_.round(dimensionY / 10, 1)}cm`
  }

  return `${_.round(dimensionY, 1)}mm`
}

function convertDimensionX(dimensionX, vendorStyle = 'default', dimensionY = 0) {
  if (vendorStyle === VENDOR_STYLES.GE || vendorStyle === VENDOR_STYLES.CANON) {
    return `${_.round(dimensionX / 10, 1)}cm`
  } else if (vendorStyle === VENDOR_STYLES.SIEMENS || vendorStyle === VENDOR_STYLES.PHILIPS) {
    const value = dimensionY !== 0 ? _.round((dimensionX / dimensionY) * 100) : 0
    return `${value}%`
  }

  return `${_.round(dimensionX, 1)}mm`
}

function convertReceiverBandwidth(receiverBandwidth, vendorStyle = 'default', frequencyMatrix = 0, fieldStrength = 0) {
  // Bandwidth base units are px/hz, so some vendors may not need converstion
  let output = receiverBandwidth
  if (vendorStyle === 'ge') {
    output = convertBandWidthBaseTo('khz', receiverBandwidth, frequencyMatrix)
    output = `${_.round(output, 1)}khz`
  } else if (vendorStyle === 'philips') {
    let strength = fieldStrength === '1.5' ? 220 : 440
    output = convertBandWidthBaseTo('px', receiverBandwidth, null, strength)
    output = `${_.round(output, 1)}px`
  } else {
    output = `${_.round(receiverBandwidth, 1)}px/hz`
  }

  return output
}

function convertBandWidthBaseTo(unit, value, baseMatrix = null, strength = null) {
  // Bandwidth base units are px/hz
  // Use this to convert from base unit
  if (unit === 'khz') {
    return (value * baseMatrix) / 2000
  } else if (unit === 'px') {
    return value < 1 ? 1 : strength / value
  }
}

export { VENDOR_STYLES, createLabels, convertSpacing, convertDimensionY, convertDimensionX, convertReceiverBandwidth }
