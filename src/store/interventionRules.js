import Vue from 'vue'
import uuidv4 from 'uuid/v4'
import { apiGet, apiPost, apiPut, apiDelete } from '../util/api'
import {
  CONSISTENCY_METRICS,
  DEFAULT_COVERAGE_AGGREGATION,
  DEFAULT_CONSISTENCY_SCOPE,
} from '../constants/interventionRules'

const EMPTY_RULES = Object.freeze([])

// Flatten API didactic shape { [categoryId]: { [level]: Rule[] } } into the
// store's flat-per-category shape, preserving level as a field on each rule.
// Server rules don't include `_localId`. Stamp every hydrated rule with one
// so v-for keys stay stable across the transition from "new (unsaved)" to
// "saved" — otherwise the post-save bucket swap remounts the RuleCard
// mid-promise.
const stampLocalId = (rule) => ({ ...rule, _localId: rule._localId || uuidv4() })

const flattenDidactic = (didactic = {}) => {
  const out = {}
  for (const [categoryId, levels] of Object.entries(didactic)) {
    const flat = []
    for (const lvl of ['overall', 'level1', 'level2', 'level3', 'level4', 'level5']) {
      if (Array.isArray(levels[lvl])) flat.push(...levels[lvl].map(stampLocalId))
    }
    out[String(categoryId)] = flat
  }
  return out
}

const normalizeClinical = (clinical = {}) => {
  const out = {}
  for (const [skillId, rules] of Object.entries(clinical)) {
    out[String(skillId)] = Array.isArray(rules) ? rules.map(stampLocalId) : []
  }
  return out
}

// Consistency rules are flat per metric (no level/skill nesting). Same shape
// hydration as clinical: `{ [metric]: Rule[] }` with stamped _localIds.
const normalizeConsistency = (consistency = {}) => {
  const out = {}
  for (const [metric, rules] of Object.entries(consistency)) {
    out[String(metric)] = Array.isArray(rules) ? rules.map(stampLocalId) : []
  }
  return out
}

const ensureBucket = (state, domain, key) => {
  if (!state[domain][key]) Vue.set(state[domain], key, [])
}

const findRuleIndex = (bucket, ruleKey) => bucket.findIndex((r) => r.id === ruleKey || r._localId === ruleKey)

const toCreatePayload = (rule, domain, parentKey) => {
  const base = {
    domain,
    from: Number(rule.from),
    to: Number(rule.to),
    interventions: rule.interventions.map((i) => ({ text: i.text.trim() })),
  }
  if (domain === 'clinical') {
    base.skillId = parentKey
  } else if (domain === 'didactic') {
    base.categoryId = Number(parentKey)
    base.level = rule.level
  } else if (domain === 'consistency') {
    base.metric = parentKey
    base.scope = rule.scope
    if (rule.aggregation) base.aggregation = rule.aggregation
  }
  return base
}

const toUpdatePayload = (rule, domain) => {
  const base = {
    from: Number(rule.from),
    to: Number(rule.to),
    interventions: rule.interventions.map((i) => {
      const out = { text: i.text.trim() }
      if (i.id) out.id = i.id
      return out
    }),
  }
  if (domain === 'didactic') base.level = rule.level
  if (domain === 'consistency') {
    // `scope` is immutable post-create. The contract permits sending it as long
    // as it matches the stored value, but the current BE rejects its presence
    // outright with `scope is immutable and cannot be updated`. Omitting it is
    // explicitly supported and keeps the stored value, so just leave it off.
    if (rule.aggregation) base.aggregation = rule.aggregation
  }
  return base
}

// Module-scoped — kept out of Vuex state so devtools snapshots stay
// serializable. Only the `hydrate` action reads/writes it.
let hydratePromise = null

const interventionRules = {
  namespaced: true,
  state: {
    clinical: {},
    didactic: {},
    consistency: {},
    loaded: false,
    hydrating: false,
    pending: {},
  },
  mutations: {
    setAll(state, { clinical, didactic, consistency }) {
      state.clinical = clinical
      state.didactic = didactic
      state.consistency = consistency || {}
    },
    setLoaded(state, value) {
      state.loaded = value
    },
    setHydrating(state, value) {
      state.hydrating = value
    },
    setPending(state, { key, value }) {
      if (!key) return
      if (value) Vue.set(state.pending, key, true)
      else Vue.delete(state.pending, key)
    },
    addRule(state, { domain, key, rule }) {
      ensureBucket(state, domain, key)
      state[domain][key].push(rule)
    },
    replaceRule(state, { domain, key, oldRuleKey, rule }) {
      ensureBucket(state, domain, key)
      const bucket = state[domain][key]
      const idx = findRuleIndex(bucket, oldRuleKey)
      const existing = idx !== -1 ? bucket[idx] : null
      // Preserve client-only `_localId`s (rule + intervention items) across the
      // server response so v-for keys stay stable and any downstream code can
      // track item identity through edit/save cycles.
      const interventions = (rule.interventions || []).map((i) => {
        const prior = existing && (existing.interventions || []).find((p) => p.id && p.id === i.id)
        return { ...i, _localId: (prior && prior._localId) || i._localId || uuidv4() }
      })
      const merged = {
        ...rule,
        _localId: (existing && existing._localId) || rule._localId || uuidv4(),
        interventions,
      }
      if (idx === -1) bucket.push(merged)
      else Vue.set(bucket, idx, merged)
    },
    removeRule(state, { domain, key, ruleKey }) {
      const bucket = state[domain][key]
      if (!bucket) return
      const idx = findRuleIndex(bucket, ruleKey)
      if (idx !== -1) bucket.splice(idx, 1)
    },
  },
  actions: {
    hydrate({ dispatch }) {
      return dispatch('_loadRules', { path: 'admin/intervention-rules' })
    },

    // Viewer-route loader for non-admin consumers (cohort managers) and the
    // Phase 3 read-only recommendations view. Same response shape as the admin
    // route, so it commits through the same path. Either action populates the
    // shared `loaded` flag — whichever fires first wins, the other no-ops.
    fetchRules({ dispatch }) {
      return dispatch('_loadRules', { path: 'intervention-rules' })
    },

    _loadRules({ commit, state, rootState }, { path }) {
      if (state.loaded) return Promise.resolve({ ok: true })
      if (hydratePromise) return hydratePromise
      hydratePromise = (async () => {
        commit('setHydrating', true)
        try {
          const response = await apiGet(path, rootState.authentication.accessToken)
          const data = response.data || {}
          commit('setAll', {
            clinical: normalizeClinical(data.clinical),
            didactic: flattenDidactic(data.didactic),
            consistency: normalizeConsistency(data.consistency),
          })
          commit('setLoaded', true)
          return { ok: true }
        } catch (err) {
          console.error('[interventionRules] load failed', err)
          const message =
            (err && err.response && err.response.data && err.response.data.error) ||
            (err && err.message) ||
            'Failed to load rules'
          return { ok: false, error: message }
        } finally {
          commit('setHydrating', false)
          hydratePromise = null
        }
      })()
      return hydratePromise
    },

    addClinicalRule({ commit }, { skillId }) {
      const rule = {
        _localId: uuidv4(),
        skillId,
        from: 0,
        to: 100,
        interventions: [{ _localId: uuidv4(), text: '' }],
      }
      commit('addRule', { domain: 'clinical', key: String(skillId), rule })
    },
    addDidacticRule({ commit }, { categoryId }) {
      const rule = {
        _localId: uuidv4(),
        categoryId,
        level: 'overall',
        from: 0,
        to: 100,
        interventions: [{ _localId: uuidv4(), text: '' }],
      }
      commit('addRule', { domain: 'didactic', key: String(categoryId), rule })
    },
    addConsistencyRule({ commit }, { metric }) {
      const m = CONSISTENCY_METRICS.find((x) => x.key === metric)
      const rule = {
        _localId: uuidv4(),
        metric,
        scope: DEFAULT_CONSISTENCY_SCOPE,
        from: 0,
        to: m ? m.softMax : 0,
        interventions: [{ _localId: uuidv4(), text: '' }],
      }
      if (m && m.hasAggregation) rule.aggregation = DEFAULT_COVERAGE_AGGREGATION
      commit('addRule', { domain: 'consistency', key: String(metric), rule })
    },

    async saveRule({ commit, state, rootState }, { rule, domain, parentKey }) {
      const dispatchKey = rule.id || rule._localId
      if (state.pending[dispatchKey]) throw new Error('save-in-flight')
      commit('setPending', { key: dispatchKey, value: true })
      try {
        const token = rootState.authentication.accessToken
        let saved
        try {
          if (rule.id) {
            // `undefined` = no query params (apiPut signature: path, params, data, token)
            const res = await apiPut(
              `admin/intervention-rules/${rule.id}`,
              undefined,
              toUpdatePayload(rule, domain),
              token
            )
            saved = res.data && res.data.rule
          } else {
            const res = await apiPost('admin/intervention-rules', toCreatePayload(rule, domain, parentKey), token)
            saved = res.data && res.data.rule
          }
        } catch (err) {
          console.error('[interventionRules] saveRule failed', err)
          throw err
        }
        if (!saved || !saved.id) {
          const err = new Error('Unexpected save response from server')
          console.error('[interventionRules] saveRule: malformed response', err)
          throw err
        }
        commit('replaceRule', { domain, key: String(parentKey), oldRuleKey: dispatchKey, rule: saved })
        // Return the merged store copy (carries the preserved `_localId`s),
        // not the raw server payload — keeps callers' working drafts in sync
        // with the bucket so v-for keys and any local-id-keyed UI don't drift.
        const bucket = state[domain][String(parentKey)] || []
        return bucket.find((r) => r.id === saved.id) || saved
      } finally {
        commit('setPending', { key: dispatchKey, value: false })
      }
    },

    async deleteRulePersisted({ commit, state, rootState }, { rule, domain, parentKey }) {
      const dispatchKey = rule.id || rule._localId
      if (state.pending[dispatchKey]) throw new Error('delete-in-flight')
      commit('setPending', { key: dispatchKey, value: true })
      try {
        if (rule.id) {
          try {
            await apiDelete(`admin/intervention-rules/${rule.id}`, rootState.authentication.accessToken)
          } catch (err) {
            console.error('[interventionRules] deleteRule failed', err)
            throw err
          }
        }
        commit('removeRule', { domain, key: String(parentKey), ruleKey: dispatchKey })
      } finally {
        commit('setPending', { key: dispatchKey, value: false })
      }
    },
  },
  getters: {
    rulesFor: (state) => (domain, key) => (key && state[domain][String(key)]) || EMPTY_RULES,
    isHydrating: (state) => state.hydrating,
    isLoaded: (state) => state.loaded,
  },
}

export default interventionRules
export { toCreatePayload, toUpdatePayload }
