/**
 * MRI Parameter Utilities
 * Shared utility functions for MRI parameter conversions
 */

/**
 * Conversion map for partial Fourier string values to decimal multipliers
 * @type {Object.<string, number>}
 */
const PARTIAL_FOURIER_CONVERSIONS = {
  Off: 1.0,
  On: 0.5,
  Allowed: 0.5, // Siemens TSE terminology
  '5/8': 0.625,
  '6/8': 0.75,
  '7/8': 0.875,
}

/**
 * Converts partial Fourier setting string to decimal multiplier
 * @param {string} partialFourier - 'Off', 'On', 'Allowed', '5/8', '6/8', '7/8'
 * @returns {number} Decimal multiplier (0.5 to 1.0)
 */
function partialFourierToDecimal(partialFourier) {
  if (partialFourier in PARTIAL_FOURIER_CONVERSIONS) {
    return PARTIAL_FOURIER_CONVERSIONS[partialFourier]
  }
  console.warn(`Unknown partial Fourier value: "${partialFourier}", defaulting to 1.0`)
  return 1.0
}

export { partialFourierToDecimal, PARTIAL_FOURIER_CONVERSIONS }
