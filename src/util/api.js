import axios from 'axios'
import config from '../config'

const { apiRoot, analysisApiRoot } = config

// --- timeouts (defaults; can be overridden per call) ---
const DEFAULT_REQUEST_TIMEOUT_MS = 600000 // 10 minutes (increased for slow staging environment)
const QUICK_PING_TIMEOUT_MS = 1500

// --- in-flight tracking (for route-change aborts) ---
const inflight = new Set()
function track(ctrl) {
  inflight.add(ctrl)
  ctrl.signal.addEventListener('abort', () => inflight.delete(ctrl))
  return ctrl
}
function cancelAllInflight() {
  for (const c of Array.from(inflight)) c.abort()
  inflight.clear()
}

// --- tiny internet check (works with CORS off) ---
async function hasInternet(timeout = QUICK_PING_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeout)
  try {
    await fetch('https://www.gstatic.com/generate_204', { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(id)
  }
}

// --- ping backend (/health) quickly ---
async function pingBackend(baseURL, timeout = QUICK_PING_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(`${baseURL.replace(/\/$/, '')}/health`)
    clearTimeout(id)
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(id)
  }
}

// --- build axios clients with timeout + classifier ---
function buildClient(baseURL) {
  const http = axios.create({ baseURL, timeout: DEFAULT_REQUEST_TIMEOUT_MS })

  // request interceptor: allow per-call overrides & AbortController
  http.interceptors.request.use((cfg) => {
    // cfg.__meta used for Sentry context
    cfg.__ts = typeof performance !== 'undefined' ? performance.now() : Date.now()
    cfg.timeout = cfg.timeout ?? DEFAULT_REQUEST_TIMEOUT_MS

    // Prefer AbortController (axios v1) if caller didn’t pass one
    if (!cfg.signal) {
      const ctrl = track(new AbortController())
      cfg.signal = ctrl.signal
      cfg.__autoAbortCtrl = ctrl // so we can drop it from the set on response
    }
    return cfg
  })

  // response interceptor: enrich errors; classify; minimal retry for GET timeouts
  http.interceptors.response.use(
    (res) => {
      if (res.config.__autoAbortCtrl) inflight.delete(res.config.__autoAbortCtrl)
      return res
    },
    async (error) => {
      const cfg = error.config || {}
      if (cfg.__autoAbortCtrl) inflight.delete(cfg.__autoAbortCtrl)

      const httpStatus = error.response?.status
      const timedOut = error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')
      const aborted = error.name === 'CanceledError' || error.code === 'ERR_CANCELED'

      // Only probe network/backend if we got NO HTTP response
      let offlineLikely = false,
        backendUp = true
      if (!httpStatus && !aborted) {
        try {
          offlineLikely = (typeof navigator !== 'undefined' && navigator.onLine === false) || !(await hasInternet())
          backendUp = await pingBackend(baseURL)
        } catch {
          /* ignore */
        }
      }
      const serverNoReply = !httpStatus && !offlineLikely && !aborted && !backendUp

      // Attach meta for Sentry
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      error.meta = {
        url: cfg.baseURL ? `${cfg.baseURL}${cfg.url}` : cfg.url,
        method: (cfg.method || 'get').toUpperCase(),
        httpStatus,
        timedOut,
        aborted,
        offlineLikely,
        backendUp,
        serverNoReply,
        timeoutMs: cfg.timeout,
        elapsedMs: cfg.__ts ? Math.round(now - cfg.__ts) : undefined,
      }

      // One safe retry for idempotent GET on client-timeout/aborted DNS/connect phase
      const allowRetry = !cfg.__retried && (cfg.method || 'get').toLowerCase() === 'get' && (timedOut || serverNoReply)
      if (allowRetry) {
        cfg.__retried = true
        // Backoff a tiny bit to avoid hammering
        await new Promise((r) => setTimeout(r, 300))
        return http(cfg)
      }
      return Promise.reject(error)
    }
  )
  return http
}

const http = buildClient(apiRoot)
const httpAnalysis = buildClient(analysisApiRoot)

// --- helpers ---
function getHeaders(accessToken) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

// Each helper accepts an optional `opts` { params, timeout, signal, headers }
function apiGet(path, accessToken, params = {}, opts = {}) {
  return http.get(path, {
    params,
    headers: { ...getHeaders(accessToken), ...(opts.headers || {}) },
    timeout: opts.timeout,
    signal: opts.signal,
  })
}
function apiAnalysis(path, accessToken, params = {}, opts = {}) {
  return httpAnalysis.get(path, {
    params,
    headers: { ...getHeaders(accessToken), ...(opts.headers || {}) },
    timeout: opts.timeout,
    signal: opts.signal,
  })
}
function apiPost(path, data, accessToken, opts = {}) {
  return http.post(path, data, {
    headers: { ...getHeaders(accessToken), ...(opts.headers || {}) },
    timeout: opts.timeout,
    signal: opts.signal,
  })
}
function apiPut(path, params, data, accessToken, opts = {}) {
  return http.put(path, data, {
    params,
    headers: { ...getHeaders(accessToken), ...(opts.headers || {}) },
    timeout: opts.timeout,
    signal: opts.signal,
  })
}
function apiPatch(path, data, accessToken, opts = {}) {
  return http.patch(path, data, {
    headers: { ...getHeaders(accessToken), ...(opts.headers || {}) },
    timeout: opts.timeout,
    signal: opts.signal,
  })
}
function apiDelete(path, accessToken, opts = {}) {
  return http.delete(path, {
    headers: { ...getHeaders(accessToken), ...(opts.headers || {}) },
    timeout: opts.timeout,
    signal: opts.signal,
  })
}

export { apiGet, apiPost, apiPut, apiPatch, apiDelete, getHeaders, apiAnalysis, cancelAllInflight }
