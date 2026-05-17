import { CLINICAL_SKILLS } from '../constants/clinicalSkills'

const DIDACTIC_LEVELS = ['overall', 'level1', 'level2', 'level3', 'level4', 'level5']

// Map clinical skill label (matches `overallSkillScores[].skillName`) → skillId (rule key).
// Built once per module load. CLINICAL_SKILLS is selected at runtime via config.isCTLab.
const labelToSkillId = CLINICAL_SKILLS.reduce((acc, s) => {
  acc[s.label] = s.id
  return acc
}, {})

/**
 * Pure matcher. Returns the deduped union of intervention texts for rules
 * whose [from, to] range covers the score (inclusive). Order: rule order
 * preserved, intervention order within each rule preserved.
 *
 * `rules` accepts the Vuex store shape:
 *   - clinical: { [skillId]: Rule[] }
 *   - didactic: { [categoryId]: Rule[] }   // flat; each rule carries `level`
 *
 * For didactic, callers pass the level they want filtered (e.g. 'level1', 'overall').
 */
export function matchInterventions({ rules, domain, key, level, score }) {
  if (!rules || !rules[domain]) return []
  if (typeof score !== 'number' || Number.isNaN(score)) return []
  const bucket = rules[domain][String(key)]
  if (!Array.isArray(bucket)) return []

  const matched = bucket.filter((r) => {
    if (domain === 'didactic') {
      if (!level || r.level !== level) return false
    }
    const from = Number(r.from)
    const to = Number(r.to)
    return from <= score && score <= to
  })

  const seen = new Set()
  const out = []
  for (const rule of matched) {
    for (const item of rule.interventions || []) {
      const text = (item && item.text) || ''
      if (!text || seen.has(text)) continue
      seen.add(text)
      out.push(text)
    }
  }
  return out
}

/**
 * Mean skillScore per skillName across the user's exam records. Skips
 * sandbox runs and entries without overallSkillScores. No body-part or
 * date filter — rules describe overall mastery.
 *
 * Returns: { [skillName]: number }
 *
 * Score is rounded to 2 decimals, matching the per-skill rounding
 * `SkillScoresBarChartOverall` applies before display.
 */
export function aggregateClinicalAverages(rawMriData) {
  const sums = {}
  const counts = {}
  Object.values(rawMriData || {})
    .flat()
    .forEach((entry) => {
      if (!entry || entry.isSandbox === true || !entry.overallSkillScores) return
      Object.values(entry.overallSkillScores).forEach((skill) => {
        if (!skill || typeof skill.skillScore !== 'number' || !skill.skillName) return
        sums[skill.skillName] = (sums[skill.skillName] || 0) + skill.skillScore
        counts[skill.skillName] = (counts[skill.skillName] || 0) + 1
      })
    })
  const out = {}
  for (const name of Object.keys(sums)) {
    out[name] = Number((sums[name] / counts[name]).toFixed(2))
  }
  return out
}

/**
 * Aggregate per-question rows from `getRawCriticalThinkingScores`
 * (`statistics/mc/<whom>`) into per-category averages keyed by level:
 *
 *   { [categoryName]: { overall, level1..level5 } }
 *
 * Each input row is one answered question with `{ category, difficulty, score, answer, preparedExamId }`.
 * Abandoned questions (`answer == null`) are skipped here.
 * - levelN ← mean of question scores in that (category, difficulty) cell.
 * - overall ← mean of question scores across the whole category.
 *
 * This is the same math `CriticalThinkingHeatMap` does (mean of per-question
 * scores). Aggregating `statistics/mc/<whom>/average` rows instead would be
 * a mean-of-means, which diverges from the heatmap whenever per-difficulty
 * question counts are unequal.
 *
 * The `preparedExamId` filter must be applied by the caller (matching the
 * heatmap's behavior) before passing rows in.
 */
export function aggregateDidacticAverages(rawCtData) {
  const byCategory = {}
  ;(rawCtData || []).forEach((row) => {
    if (!row || row.score == null) return
    // `answer == null` ⇒ the question was abandoned (score is a 0 that wasn't
    // earned). It still counts as a zero toward exam/overall CT totals, but
    // must be excluded from per-category/per-level didactic averages — mirrors
    // `CriticalThinkingHeatMap`'s `filteredData`.
    if (row.answer == null) return
    const cat = row.category
    if (!cat) return
    const score = Number(row.score)
    if (Number.isNaN(score)) return
    if (!byCategory[cat]) byCategory[cat] = { all: [], byDifficulty: {} }
    byCategory[cat].all.push(score)
    const diff = row.difficulty
    if (diff != null && String(diff).trim() !== '' && String(diff) !== 'null') {
      const key = `level${diff}`
      if (!byCategory[cat].byDifficulty[key]) byCategory[cat].byDifficulty[key] = []
      byCategory[cat].byDifficulty[key].push(score)
    }
  })
  const meanOf = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length
  const out = {}
  for (const [cat, data] of Object.entries(byCategory)) {
    const entry = {}
    if (data.all.length > 0) {
      entry.overall = Number(meanOf(data.all).toFixed(2))
    }
    for (const [lvl, scores] of Object.entries(data.byDifficulty)) {
      if (scores.length > 0) {
        entry[lvl] = Number(meanOf(scores).toFixed(2))
      }
    }
    out[cat] = entry
  }
  return out
}

/**
 * Subject builders — emit per-exam or per-question rows from the raw
 * AngulationCurve / CoverageCurve data. The practice exam and points
 * without a `preparedExamId` are filtered out.
 *
 * Each `point` in the API response represents a questionSet (a group of
 * related questions); the per-question raw values live inside
 * `point.individualAngles` (angulation) or `point.values.individual`
 * (coverage). For perQuestion scope we emit one subject per element of
 * those arrays; for perExam scope we reduce over the flattened individuals
 * across every questionSet in the exam (more accurate than reducing
 * questionSet-level summaries).
 *
 * Each subject: { id, score, preparedExamId, questionSetResultId?, bodyPart?, date? }.
 */
export function buildAngulationSubjectsPerQuestion(rawAngleData, { practiceExamId } = {}) {
  const subjects = []
  Object.values(rawAngleData || {}).forEach((u) => {
    ;((u && u.points) || []).forEach((p) => {
      if (!p) return
      if (p.preparedExamId == null || p.preparedExamId === practiceExamId) return
      const individuals = Array.isArray(p.individualAngles) ? p.individualAngles : null
      if (individuals && individuals.length) {
        individuals.forEach((v, idx) => {
          if (typeof v !== 'number') return
          subjects.push({
            id: `q-${p.preparedExamId}-${p.questionSetResultId}-${idx}`,
            score: Number(v.toFixed(2)),
            preparedExamId: p.preparedExamId,
            questionSetResultId: p.questionSetResultId,
            questionIndex: idx,
            bodyPart: p.bodyPart,
            date: p.x,
          })
        })
      } else if (typeof p.y === 'number') {
        subjects.push({
          id: `q-${p.preparedExamId}-${p.questionSetResultId}`,
          score: Number(p.y.toFixed(2)),
          preparedExamId: p.preparedExamId,
          questionSetResultId: p.questionSetResultId,
          bodyPart: p.bodyPart,
          date: p.x,
        })
      }
    })
  })
  return subjects
}

export function buildAngulationSubjectsPerExam(rawAngleData, { practiceExamId } = {}) {
  const byExam = new Map()
  Object.values(rawAngleData || {}).forEach((u) => {
    ;((u && u.points) || []).forEach((p) => {
      if (!p) return
      if (p.preparedExamId == null || p.preparedExamId === practiceExamId) return
      const individuals = Array.isArray(p.individualAngles)
        ? p.individualAngles.filter((v) => typeof v === 'number')
        : []
      const values = individuals.length ? individuals : typeof p.y === 'number' ? [p.y] : []
      if (!values.length) return
      if (!byExam.has(p.preparedExamId)) byExam.set(p.preparedExamId, { ys: [], date: p.x })
      byExam.get(p.preparedExamId).ys.push(...values)
    })
  })
  const out = []
  for (const [examId, { ys, date }] of byExam) {
    if (!ys.length) continue
    const mean = ys.reduce((a, b) => a + b, 0) / ys.length
    out.push({ id: `e-${examId}`, score: Number(mean.toFixed(2)), preparedExamId: examId, date })
  }
  return out
}

// Map a coverage aggregation to the function that derives a per-question
// score from a signed `individual` value. `total` is signed; the abs
// variants take the absolute value.
const coverageIndividualScore = (aggregation, v) => (aggregation === 'total' ? v : Math.abs(v))

export function buildCoverageSubjectsPerQuestion(rawCoverageData, { metricKey, aggregation, practiceExamId } = {}) {
  const subjects = []
  Object.values(rawCoverageData || {}).forEach((u) => {
    ;((u && u[metricKey] && u[metricKey].points) || []).forEach((p) => {
      if (!p) return
      if (p.preparedExamId == null || p.preparedExamId === practiceExamId) return
      const individuals = Array.isArray(p.values && p.values.individual) ? p.values.individual : null
      if (individuals && individuals.length) {
        individuals.forEach((raw, idx) => {
          if (typeof raw !== 'number') return
          const v = coverageIndividualScore(aggregation, raw)
          subjects.push({
            id: `q-${p.preparedExamId}-${p.questionSetResultId}-${idx}`,
            score: Number(v.toFixed(2)),
            preparedExamId: p.preparedExamId,
            questionSetResultId: p.questionSetResultId,
            questionIndex: idx,
            bodyPart: p.bodyPart,
            date: p.x,
          })
        })
      } else {
        const fallback = (p.values || {})[aggregation]
        if (typeof fallback !== 'number') return
        subjects.push({
          id: `q-${p.preparedExamId}-${p.questionSetResultId}`,
          score: Number(fallback.toFixed(2)),
          preparedExamId: p.preparedExamId,
          questionSetResultId: p.questionSetResultId,
          bodyPart: p.bodyPart,
          date: p.x,
        })
      }
    })
  })
  return subjects
}

// Per-exam coverage reduction operates on the flattened `individual` arrays
// across every questionSet in the exam:
//   - 'total'         → sum of signed individuals
//   - 'absoluteTotal' → sum of |individuals|
//   - 'absoluteMean'  → mean of |individuals|
// Falls back to the questionSet-level aggregate (`point.values[agg]`) if
// `individual` is missing on a point.
export function buildCoverageSubjectsPerExam(rawCoverageData, { metricKey, aggregation, practiceExamId } = {}) {
  const byExam = new Map()
  Object.values(rawCoverageData || {}).forEach((u) => {
    ;((u && u[metricKey] && u[metricKey].points) || []).forEach((p) => {
      if (!p) return
      if (p.preparedExamId == null || p.preparedExamId === practiceExamId) return
      const individuals = Array.isArray(p.values && p.values.individual)
        ? p.values.individual.filter((v) => typeof v === 'number')
        : []
      let perQuestionValues
      if (individuals.length) {
        perQuestionValues = individuals.map((v) => coverageIndividualScore(aggregation, v))
      } else {
        const fallback = (p.values || {})[aggregation]
        if (typeof fallback !== 'number') return
        perQuestionValues = [fallback]
      }
      if (!byExam.has(p.preparedExamId)) byExam.set(p.preparedExamId, { vs: [], date: p.x })
      byExam.get(p.preparedExamId).vs.push(...perQuestionValues)
    })
  })
  const reduceMode = aggregation === 'absoluteMean' ? 'mean' : 'sum'
  const out = []
  for (const [examId, { vs, date }] of byExam) {
    if (!vs.length) continue
    const reduced = reduceMode === 'sum' ? vs.reduce((a, b) => a + b, 0) : vs.reduce((a, b) => a + b, 0) / vs.length
    out.push({ id: `e-${examId}`, score: Number(reduced.toFixed(2)), preparedExamId: examId, date })
  }
  return out
}

/**
 * Match a list of subjects against consistency rules of a given (key, scope,
 * aggregation) bucket. Each subject whose score falls in any applicable
 * rule's [from, to] range produces one entry, with the deduped union of
 * intervention texts across the matching rules.
 */
export function matchConsistencyInterventions({ rules, key, scope, aggregation, subjects }) {
  if (!rules || !rules.consistency) return []
  const bucket = rules.consistency[String(key)]
  if (!Array.isArray(bucket)) return []

  const applicable = bucket.filter((r) => {
    if (r.scope !== scope) return false
    if (r.aggregation && r.aggregation !== aggregation) return false
    return true
  })
  if (!applicable.length) return []

  const out = []
  for (const subj of subjects || []) {
    if (!subj || typeof subj.score !== 'number') continue
    const interventions = []
    const seen = new Set()
    for (const rule of applicable) {
      const from = Number(rule.from)
      const to = Number(rule.to)
      if (!(from <= subj.score && subj.score <= to)) continue
      for (const item of rule.interventions || []) {
        const text = (item && item.text) || ''
        if (!text || seen.has(text)) continue
        seen.add(text)
        interventions.push(text)
      }
    }
    if (interventions.length) out.push({ subject: subj, interventions })
  }
  return out
}

export { labelToSkillId, DIDACTIC_LEVELS }
