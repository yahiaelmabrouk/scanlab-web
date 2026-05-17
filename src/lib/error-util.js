// Helper function to extract a meaningful error message
export function getErrorMessage(error, prefix = '', suffix = '') {
  const p = prefix ? `${prefix} ` : ''
  const s = suffix || ''
  const m = error?.meta
  if (m?.offlineLikely) return `${p}No internet connection detected${s}`
  if (m?.serverNoReply) return `${p}Cannot reach server (is it down?)${s}`
  if (m?.timedOut && !m?.backendUp) return `${p}Server didn’t respond in time${s}`
  if (error?.response) return `${p}${error.response.status} ${error.response.statusText}${s}`
  return `${p}${error?.message || 'Request failed'}${s}`
}
