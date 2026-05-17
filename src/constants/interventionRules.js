import uuidv4 from 'uuid/v4'

export const LEVEL_OPTIONS = [
  { text: 'Overall', value: 'overall' },
  { text: 'Level 1', value: 'level1' },
  { text: 'Level 2', value: 'level2' },
  { text: 'Level 3', value: 'level3' },
  { text: 'Level 4', value: 'level4' },
  { text: 'Level 5', value: 'level5' },
]

export const SCORE_MIN = 0
export const SCORE_MAX = 100

export const clampScore = (n) => Math.max(SCORE_MIN, Math.min(SCORE_MAX, n))

export const CONSISTENCY_METRICS = [
  {
    key: 'angulation',
    label: 'Angulation Deviation',
    unit: '°',
    min: 0,
    softMax: 30,
    step: 0.5,
    hasAggregation: false,
    modalities: ['MR', 'CT'],
  },
  {
    key: 'wastedSlices',
    label: 'Wasted Slices',
    unit: 'slc',
    min: 0,
    softMax: 50,
    step: 1,
    hasAggregation: true,
    modalities: ['MR'],
  },
  {
    key: 'wastedCoverage',
    label: 'Wasted Coverage',
    unit: 'mm',
    min: 0,
    softMax: 200,
    step: 1,
    hasAggregation: true,
    modalities: ['CT'],
  },
]

export const COVERAGE_AGGREGATIONS = [
  {
    value: 'absoluteTotal',
    label: 'Absolute Total',
    description: (metric) => `Sum of all ${metric} deviations per exam (ignoring direction - all positive values)`,
  },
  {
    value: 'total',
    label: 'Total',
    description: (metric) => `Sum of all ${metric} deviations per exam (positive and negative values combined)`,
  },
  {
    value: 'absoluteMean',
    label: 'Absolute Avg.',
    description: (metric) => `Average ${metric} deviation per question (ignoring direction - all positive values)`,
  },
]
export const DEFAULT_COVERAGE_AGGREGATION = 'absoluteTotal'

export const CONSISTENCY_SCOPES = [
  { value: 'perExam', label: 'Per Exam' },
  { value: 'perQuestion', label: 'Per Question' },
]
export const DEFAULT_CONSISTENCY_SCOPE = 'perExam'

// Per-metric input bounds for consistency RuleCard. `total` aggregation allows
// negative deviation; everything else is clamped to a non-negative floor.
export const metricBounds = (metricKey, aggregation) => {
  const m = CONSISTENCY_METRICS.find((x) => x.key === metricKey)
  if (!m) return { min: 0, softMax: 100, step: 1, unit: '', hasAggregation: false }
  if (m.hasAggregation && aggregation === 'total') {
    return { min: -m.softMax, softMax: m.softMax, step: m.step, unit: m.unit, hasAggregation: m.hasAggregation }
  }
  return { min: m.min, softMax: m.softMax, step: m.step, unit: m.unit, hasAggregation: m.hasAggregation }
}

// Deep clone a rule for a RuleCard's local working copy. Ensures every
// intervention has a stable `_localId` for v-for keys, so newly added rows
// (which lack a server-assigned `id`) still render reliably.
export const cloneRule = (rule) => {
  const cloned = JSON.parse(JSON.stringify(rule || {}))
  if (!cloned._localId) cloned._localId = uuidv4()
  cloned.interventions = (cloned.interventions || []).map((i) => ({
    ...i,
    _localId: i._localId || uuidv4(),
  }))
  return cloned
}

// Normalize a rule for dirty-tracking comparisons: drop client-only fields
// and coerce range values to numbers so a "50" string draft doesn't read
// dirty against a numeric 50 from the server.
export const normalizeForCompare = (rule) => {
  if (!rule) return null
  const out = {
    from: rule.from === '' || rule.from == null ? null : Number(rule.from),
    to: rule.to === '' || rule.to == null ? null : Number(rule.to),
    level: rule.level || null,
    interventions: (rule.interventions || []).map((i) => ({
      id: i.id || null,
      text: (i.text || '').trim(),
    })),
  }
  if (rule.aggregation) out.aggregation = rule.aggregation
  if (rule.scope) out.scope = rule.scope
  return out
}
