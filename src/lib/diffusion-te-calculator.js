// No external dependencies needed - using analytical cubic solver

/**
 * Physical constants for MRI diffusion calculations
 */
const CONSTANTS = {
  GAMMA: 42.566, // Hz/µT - gyromagnetic ratio for hydrogen
  GMAX: 38, // mT/m - maximum gradient amplitude (typical clinical scanner)
  GRADIENT_SLEW_RATES: {
    fast: 200, // T/m/s - fast gradient slew rate
    med: 100, // T/m/s - normal gradient slew rate
    slow: 50, // T/m/s - whisper gradient slew rate
  },
}

/**
 * Get gradient ramp time based on gradient mode and sequence type
 * @param {string} gradientRamp - 'fast', 'med', or 'slow'
 * @param {string} sequenceType - Sequence type (e.g., 'DIFF')
 * @returns {number} Gradient ramp time in milliseconds
 */
function getGradientRampTime(gradientRamp, sequenceType) {
  const normalized = (gradientRamp || 'fast').toLowerCase()
  if (sequenceType === 'DIFF') {
    switch (normalized) {
      case 'fast':
        return 0.04
      case 'med':
        return 0.06
      case 'slow':
        return 1.0
      default:
        return 0.04
    }
  }
  return 0.04
}

/**
 * Get gradient slew rate value based on gradient mode
 * This value can be used to calculate gradient ramp times dynamically
 * across different sequence types and gradient applications.
 *
 * @param {string} gradientRamp - 'fast', 'med', or 'slow'
 * @returns {number} Gradient slew rate in T/m/s
 */
export function getGradientSlewValue(gradientRamp) {
  const normalized = (gradientRamp || 'fast').toLowerCase()
  return CONSTANTS.GRADIENT_SLEW_RATES[normalized] || CONSTANTS.GRADIENT_SLEW_RATES.fast
}

/**
 * Get RF pulse duration based on SAR setting
 * @param {string} rfPulsing - 'fast', 'mid', or 'low_sar'
 * @returns {number} RF pulse duration in milliseconds
 */
function getRFPulseDuration(rfPulsing) {
  const normalized = (rfPulsing || 'fast').toLowerCase().replace(' ', '_')
  switch (normalized) {
    case 'fast':
      return 2.8
    case 'mid':
      return 5.1
    case 'low_sar':
      return 7.2
    default:
      return 2.8
  }
}

/**
 * Calculate TD1: Time after 90° excitation
 * @param {number} echoSpacing - Echo spacing in ms
 * @param {string} gradientRamp - Gradient ramp mode
 * @param {string} rfPulsing - RF pulsing mode ('fast', 'mid', 'low_sar')
 * @returns {number} TD1 in milliseconds
 */
function calculateTD1(echoSpacing, gradientRamp, rfPulsing) {
  const gradRampTime = getGradientRampTime(gradientRamp, 'DIFF')
  const rfPulseTime = getRFPulseDuration(rfPulsing)
  return 4 * echoSpacing + gradRampTime + rfPulseTime / 2
}

/**
 * Calculate TD2: Time before 180° refocusing
 *
 * Includes RF pulse duration and gradient ramp time, following the same pattern as TD1/TD4.
 * Respects both user's RF pulsing setting (SAR level) and gradient ramp setting (performance).
 *
 * @param {string} rfPulsing - RF pulsing mode ('fast', 'mid', 'low_sar')
 * @param {string} gradientRamp - Gradient ramp mode ('fast', 'med', 'slow')
 * @returns {number} TD2 in milliseconds
 */
function calculateTD2(rfPulsing, gradientRamp) {
  const rfPulseTime = getRFPulseDuration(rfPulsing)
  const gradRampTime = getGradientRampTime(gradientRamp, 'DIFF')
  return rfPulseTime / 2 + gradRampTime
}

/**
 * Calculate TD3: Time after 180° refocusing
 * Same as TD2 - symmetric timing buffer around 180° pulse.
 *
 * @param {string} rfPulsing - RF pulsing mode
 * @param {string} gradientRamp - Gradient ramp mode
 * @returns {number} TD3 in milliseconds
 */
function calculateTD3(rfPulsing, gradientRamp) {
  return calculateTD2(rfPulsing, gradientRamp)
}

/**
 * Calculate TD4: Time before readout
 * @param {string} gradientRamp - Gradient ramp mode
 * @returns {number} TD4 in milliseconds
 */
function calculateTD4(gradientRamp) {
  const gradRampTime = getGradientRampTime(gradientRamp, 'DIFF')
  return gradRampTime
}

/**
 * Solve cubic equation: a*x³ + b*x² + c*x + d = 0
 * Uses analytical Cardano's formula for cubic equations
 * @param {number} a - Coefficient of x³
 * @param {number} b - Coefficient of x²
 * @param {number} c - Coefficient of x
 * @param {number} d - Constant term
 * @returns {number|null} Maximum positive real root, or null if no valid roots
 */
function solveCubicEquation(a, b, c, d) {
  try {
    // Normalize to monic form: x³ + px² + qx + r = 0
    const p = b / a
    const q = c / a
    const r = d / a

    // Use Cardano's formula
    // Convert to depressed cubic: t³ + At + B = 0 via substitution x = t - p/3
    const A = q - (p * p) / 3
    const B = (2 * p * p * p) / 27 - (p * q) / 3 + r

    // Calculate discriminant
    const discriminant = -(4 * A * A * A + 27 * B * B)

    const roots = []

    if (discriminant > 0) {
      // Three distinct real roots (trigonometric solution)
      const m = 2 * Math.sqrt(-A / 3)
      const theta = Math.acos((3 * B) / (A * m)) / 3

      roots.push(m * Math.cos(theta) - p / 3)
      roots.push(m * Math.cos(theta - (2 * Math.PI) / 3) - p / 3)
      roots.push(m * Math.cos(theta - (4 * Math.PI) / 3) - p / 3)
    } else if (discriminant === 0) {
      // Multiple root
      const u = Math.cbrt(-B / 2)
      roots.push(2 * u - p / 3)
      roots.push(-u - p / 3)
    } else {
      // One real root (Cardano's formula)
      const sqrtDisc = Math.sqrt(-discriminant / 27)
      const u = Math.cbrt((-B + sqrtDisc) / 2)
      const v = Math.cbrt((-B - sqrtDisc) / 2)
      roots.push(u + v - p / 3)
    }

    // Filter for positive real roots
    const validRoots = roots.filter((root) => !isNaN(root) && root > 0)

    if (validRoots.length === 0) {
      console.warn('No valid positive real roots found')
      return null
    }

    // Return maximum valid root per MATLAB spec
    return Math.max(...validRoots)
  } catch (error) {
    console.error('Error solving cubic equation:', error)
    return null
  }
}

/**
 * Calculate minimum TE using physics-based cubic equation approach
 * Based on Stejskal-Tanner diffusion model and gradient timing constraints
 *
 * @param {Object} params - Calculation parameters
 * @param {number} params.bValue - Maximum b-value in s/mm²
 * @param {number} params.frequencyMatrix - Base matrix size (frequency encoding)
 * @param {number} params.phaseResolution - Phase resolution (0-1)
 * @param {number} params.phaseFOV - Phase FOV ratio (0-1)
 * @param {number} params.partialFourier - Partial Fourier as decimal (e.g., 0.625)
 * @param {number} params.oversampling - Oversampling as decimal (e.g., 0.1 for 10%)
 * @param {number} params.parallelFactor - Parallel imaging factor (1 for off, 2-4 for acceleration)
 * @param {number} params.echoSpacing - Echo spacing in ms
 * @param {string} params.gradientRamp - Gradient ramp mode ('fast'/'med'/'slow')
 * @param {string} params.rfPulsing - RF pulsing mode ('fast'/'mid'/'low_sar')
 * @returns {number|null} Minimum TE in milliseconds, or null if calculation fails
 */
export function calculateMinTECubic(params) {
  const {
    bValue,
    frequencyMatrix,
    phaseResolution,
    phaseFOV,
    partialFourier,
    oversampling,
    parallelFactor,
    echoSpacing,
    gradientRamp,
    rfPulsing,
  } = params

  // Debug: Log input parameters
  console.log('Cubic TE Input Parameters:', {
    bValue,
    frequencyMatrix,
    phaseResolution: phaseResolution.toFixed(3),
    phaseFOV: phaseFOV.toFixed(3),
    partialFourier: partialFourier.toFixed(3),
    oversampling: oversampling.toFixed(3),
    parallelFactor,
    echoSpacing,
    gradientRamp,
    rfPulsing,
  })

  // Validate minimum b-value for cubic equation solver
  if (bValue > 0 && bValue < 50) {
    console.error('b-value must be at least 50 for cubic equation solver (got:', bValue, ')')
    console.warn('This constraint ensures the K constant is large enough for valid gradient timing')
    return null
  }

  // Validate b-value (only reject negative values)
  if (bValue < 0) {
    console.error('b-value cannot be negative')
    return null
  }

  console.log('b-value:', bValue, 's/mm²')

  // Step 1: Calculate dMA (phase encoding lines to k-space center)
  const MAph = (frequencyMatrix * phaseResolution * (1 + oversampling) * phaseFOV) / parallelFactor
  const dMA = (partialFourier - 0.5) * MAph

  // Step 2: Calculate K constant (diffusion requirement)
  // K = (b * 1000) / (γ² * (2π)² * Gmax²)
  const K = (((bValue * 1000) / CONSTANTS.GAMMA ** 2 / (2 * Math.PI) ** 2) * 1000 ** 2) / CONSTANTS.GMAX ** 2

  console.log('K constant (diffusion requirement):', K.toFixed(6))
  // Sanity check: K should never be negative since bValue >= 0
  // This is mathematically redundant but serves as defensive programming
  if (K < 0) {
    console.error('K constant is negative - invalid physics (should be impossible)')
    return null
  }

  // Step 3: Calculate timing constants
  const TD1 = calculateTD1(echoSpacing, gradientRamp, rfPulsing)
  const TD3 = calculateTD3(rfPulsing, gradientRamp)
  const TD4 = calculateTD4(gradientRamp)

  console.log('Timing constants:', {
    TD1: TD1.toFixed(3),
    TD3: TD3.toFixed(3),
    TD4: TD4.toFixed(3),
  })

  // Step 4: Calculate A and B terms
  const A = dMA * echoSpacing + TD3 + TD4
  const B = dMA * echoSpacing - 3 * TD1 + 4 * TD3 + TD4

  // Step 5: Cubic equation coefficients
  // TE³ + b*TE² + c*TE + d = 0
  const a = 1
  const b = B - 4 * A
  const c = 4 * A * A - 4 * A * B
  const d = 4 * A * A * B - 12 * K

  // Step 6: Solve cubic equation
  const minTE = solveCubicEquation(a, b, c, d)

  if (minTE === null || isNaN(minTE) || minTE <= 0) {
    console.warn('Invalid cubic result, using fallback')
    return null
  }

  // Step 7: Calculate gradient timing (for validation and debugging)
  const bigDelta = minTE / 2 - TD1 + TD3
  const littleDelta = minTE / 2 - dMA * echoSpacing - TD3 - TD4

  // Validate gradient timing
  if (bigDelta <= 0 || littleDelta <= 0) {
    console.warn('Invalid gradient timing - scan parameters are too constrained:', {
      bigDelta: bigDelta.toFixed(6),
      littleDelta: littleDelta.toFixed(6),
      minTE: minTE.toFixed(2),
      dMA: dMA.toFixed(2),
      echoSpacing,
      bValue,
      suggestion: 'Try: increasing echo spacing, reducing b-value, or enabling parallel imaging',
    })
    return null
  }

  console.log('Cubic TE Results:', {
    minTE: minTE.toFixed(2),
    bigDelta: bigDelta.toFixed(2),
    littleDelta: littleDelta.toFixed(2),
    K: K.toFixed(2),
    dMA: dMA.toFixed(2),
  })

  return minTE
}

/**
 * Calculate minimum TE using simplified linear approximation formula
 * This is the existing formula for backward compatibility
 *
 * @param {Object} params - Calculation parameters
 * @param {number} params.bValue - Maximum b-value in s/mm²
 * @param {number} params.echoSpacing - Echo spacing in ms
 * @param {number} params.trNeeded - TR needed (phase encoding lines)
 * @param {number} params.parallelFactor - Parallel imaging factor (1 for off)
 * @param {number} params.oversampling - Oversampling as decimal (e.g., 0.1 for 10%)
 * @param {number} params.partialFourier - Partial Fourier as decimal (e.g., 0.625)
 * @returns {number} Minimum TE in milliseconds
 */
export function calculateMinTESimplified(params) {
  const { bValue, echoSpacing, trNeeded, parallelFactor, oversampling, partialFourier } = params

  return 20 + (0.02 * bValue + echoSpacing * trNeeded * (1 + oversampling * (partialFourier - 0.5))) / parallelFactor
}
