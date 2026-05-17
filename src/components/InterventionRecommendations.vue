<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card class="my-4 pa-4 intervention-recommendations">
    <h2 class="mb-3">Recommended Interventions{{ student && student.name ? ` for ${student.name}` : '' }}</h2>

    <div v-if="isLoading" class="text-center pa-4">
      <v-progress-circular indeterminate size="32"></v-progress-circular>
    </div>

    <template v-else>
      <div v-if="!hasAnyRecommendation" class="grey--text text--darken-1">
        No interventions match this student's current scores.
      </div>

      <template v-else>
        <section v-if="clinicalRecommendations.length" class="mb-4">
          <h3 class="mb-2">Clinical Skills</h3>
          <v-simple-table dense>
            <thead>
              <tr>
                <th style="width: 40%">Skill</th>
                <th style="width: 15%">Average Score</th>
                <th>Interventions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in clinicalRecommendations" :key="`clin-${row.skillId}`">
                <td>{{ row.skillName }}</td>
                <td>{{ formatScore(row.score) }}</td>
                <td>
                  <ul class="my-1">
                    <li v-for="(text, i) in row.interventions" :key="i">{{ text }}</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </section>

        <section v-if="didacticRecommendations.length" class="mb-4">
          <h3 class="mb-2">Didactic Skills</h3>
          <v-simple-table dense>
            <thead>
              <tr>
                <th style="width: 30%">Category</th>
                <th style="width: 10%">Level</th>
                <th style="width: 15%">Average Score</th>
                <th>Interventions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in didacticRecommendations" :key="`did-${row.categoryId}-${row.level}`">
                <td>{{ row.categoryName }}</td>
                <td>{{ levelLabel(row.level) }}</td>
                <td>{{ formatScore(row.score) }}</td>
                <td>
                  <ul class="my-1">
                    <li v-for="(text, i) in row.interventions" :key="i">{{ text }}</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </section>

        <section v-if="consistencyRecommendations.length">
          <h3 class="mb-2">Consistency</h3>
          <v-simple-table dense>
            <thead>
              <tr>
                <th style="width: 22%">Metric</th>
                <th style="width: 12%">Scope</th>
                <th style="width: 14%">Aggregation</th>
                <th style="width: 18%">Exam</th>
                <th style="width: 12%">Score</th>
                <th>Interventions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in consistencyRecommendations"
                :key="`con-${row.metric}-${row.scope}-${row.aggregation || 'na'}-${row.subject.id}`"
              >
                <td>{{ row.label }}</td>
                <td>{{ scopeLabel(row.scope) }}</td>
                <td>
                  <v-tooltip bottom :disabled="!aggregationTooltip(row)">
                    <template #activator="{ on, attrs }">
                      <span v-on="on" v-bind="attrs">{{ aggregationCell(row) }}</span>
                    </template>
                    <span>{{ aggregationTooltip(row) }}</span>
                  </v-tooltip>
                </td>
                <td>{{ examLabel(row) }}</td>
                <td>{{ formatMetric(row.score, row.unit) }}</td>
                <td>
                  <ul class="my-1">
                    <li v-for="(text, i) in row.interventions" :key="i">{{ text }}</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </section>
      </template>
    </template>
  </v-card>
</template>

<script>
import { mapState } from 'vuex'
import { apiGet } from '../util/api'
import {
  matchInterventions,
  matchConsistencyInterventions,
  aggregateClinicalAverages,
  aggregateDidacticAverages,
  buildAngulationSubjectsPerExam,
  buildAngulationSubjectsPerQuestion,
  buildCoverageSubjectsPerExam,
  buildCoverageSubjectsPerQuestion,
  labelToSkillId,
  DIDACTIC_LEVELS,
} from '../util/interventionMatcher'
import { COVERAGE_AGGREGATIONS, CONSISTENCY_SCOPES } from '../constants/interventionRules'
import { CT_PRACTICE_EXAM_ID, MR_PRACTICE_EXAM_ID } from '../constants'
import config from '../config'

// Module-scope cache for didactic categories — same pattern as
// DidacticSkillsPanel.vue. Avoids re-fetching when re-mounting the report.
let categoriesCache = null
// Same caching strategy for prepared exams — used to map preparedExamId → title
// in the consistency report's Exam column.
let preparedExamsCache = null

const LEVEL_DISPLAY = {
  overall: 'Overall',
  level1: 'Level 1',
  level2: 'Level 2',
  level3: 'Level 3',
  level4: 'Level 4',
  level5: 'Level 5',
}

export default {
  name: 'InterventionRecommendations',
  props: {
    whom: {
      type: String,
      required: true,
    },
    student: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      categories: categoriesCache || [],
      preparedExams: preparedExamsCache || [],
      rawCtData: [],
      rawAngleData: {},
      rawCoverageData: {},
      isFetchingRules: false,
      isFetchingMri: false,
      isFetchingCt: false,
      isFetchingCategories: false,
      isFetchingPreparedExams: false,
      isFetchingAngulation: false,
      isFetchingCoverage: false,
    }
  },
  computed: {
    ...mapState('statisticsService', ['rawMriData']),
    ...mapState('interventionRules', {
      rulesClinical: 'clinical',
      rulesDidactic: 'didactic',
      rulesConsistency: 'consistency',
    }),
    rules() {
      return { clinical: this.rulesClinical, didactic: this.rulesDidactic, consistency: this.rulesConsistency }
    },
    isLoading() {
      return (
        this.isFetchingRules ||
        this.isFetchingMri ||
        this.isFetchingCt ||
        this.isFetchingCategories ||
        this.isFetchingPreparedExams ||
        this.isFetchingAngulation ||
        this.isFetchingCoverage
      )
    },
    metricKey() {
      return config.isCTLab ? 'wastedCoverage' : 'wastedSlices'
    },
    consistencyRecommendations() {
      const rules = { consistency: this.rulesConsistency }
      const rows = []
      const angulationBucket = (this.rulesConsistency || {}).angulation || []
      const coverageBucket = (this.rulesConsistency || {})[this.metricKey] || []
      const coverageLabel = this.metricKey === 'wastedCoverage' ? 'Wasted Coverage' : 'Coverage Deviation'
      const coverageUnit = this.metricKey === 'wastedCoverage' ? 'mm' : 'slices'

      for (const scope of ['perExam', 'perQuestion']) {
        if (!angulationBucket.some((r) => r.scope === scope)) continue
        const subjects =
          scope === 'perExam'
            ? buildAngulationSubjectsPerExam(this.rawAngleData, { practiceExamId: this.practiceExamId })
            : buildAngulationSubjectsPerQuestion(this.rawAngleData, { practiceExamId: this.practiceExamId })
        const matches = matchConsistencyInterventions({ rules, key: 'angulation', scope, subjects })
        for (const m of matches) {
          rows.push({
            metric: 'angulation',
            label: 'Angulation Deviation',
            scope,
            score: m.subject.score,
            unit: '°',
            subject: m.subject,
            interventions: m.interventions,
          })
        }
      }

      const seenPairs = new Set()
      for (const r of coverageBucket) {
        if (!r.scope || !r.aggregation) continue
        const pairKey = `${r.scope}:${r.aggregation}`
        if (seenPairs.has(pairKey)) continue
        seenPairs.add(pairKey)
        const subjects =
          r.scope === 'perExam'
            ? buildCoverageSubjectsPerExam(this.rawCoverageData, {
                metricKey: this.metricKey,
                aggregation: r.aggregation,
                practiceExamId: this.practiceExamId,
              })
            : buildCoverageSubjectsPerQuestion(this.rawCoverageData, {
                metricKey: this.metricKey,
                aggregation: r.aggregation,
                practiceExamId: this.practiceExamId,
              })
        const matches = matchConsistencyInterventions({
          rules,
          key: this.metricKey,
          scope: r.scope,
          aggregation: r.aggregation,
          subjects,
        })
        for (const m of matches) {
          rows.push({
            metric: this.metricKey,
            label: coverageLabel,
            scope: r.scope,
            aggregation: r.aggregation,
            score: m.subject.score,
            unit: coverageUnit,
            subject: m.subject,
            interventions: m.interventions,
          })
        }
      }

      // Per-exam first, then by date desc, then by score desc.
      rows.sort((a, b) => {
        if (a.scope !== b.scope) return a.scope === 'perExam' ? -1 : 1
        const da = (a.subject && a.subject.date) || 0
        const db = (b.subject && b.subject.date) || 0
        if (da !== db) return db - da
        return b.score - a.score
      })
      return rows
    },
    categoryIdToName() {
      const out = {}
      for (const c of this.categories) out[String(c.id)] = c.name
      return out
    },
    examIdToTitle() {
      const out = {}
      for (const e of this.preparedExams) out[String(e.id)] = e.title
      return out
    },
    practiceExamId() {
      return config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
    },
    // Prepared-exam mode (mirrors `CriticalThinkingHeatMap`'s prepared filter):
    // drop the practice-exam rows, drop abandoned questions (`answer == null` —
    // their score is a 0 that wasn't earned), then keep only rows with a
    // non-null `preparedExamId`. Interventions are evaluated against
    // prepared-exam performance only.
    filteredRawCtData() {
      return (this.rawCtData || []).filter(
        (d) => d && d.preparedExamId !== this.practiceExamId && d.preparedExamId != null && d.answer != null
      )
    },
    // Same prepared-exam filter applied to MRI/CT exam records before
    // skill-score aggregation. `rawMriData` is bucketed (e.g. by user) so we
    // rebuild it as a filtered shape the helper still knows how to flatten.
    filteredRawMriData() {
      const out = {}
      for (const [key, entries] of Object.entries(this.rawMriData || {})) {
        if (!Array.isArray(entries)) continue
        out[key] = entries.filter((e) => e && e.preparedExamId !== this.practiceExamId && e.preparedExamId != null)
      }
      return out
    },
    clinicalAverages() {
      return aggregateClinicalAverages(this.filteredRawMriData)
    },
    didacticAverages() {
      return aggregateDidacticAverages(this.filteredRawCtData)
    },
    clinicalRecommendations() {
      const rows = []
      for (const [skillName, score] of Object.entries(this.clinicalAverages)) {
        const skillId = labelToSkillId[skillName]
        if (!skillId) continue // unknown skill — silently ignored
        const interventions = matchInterventions({
          rules: this.rules,
          domain: 'clinical',
          key: skillId,
          score,
        })
        if (interventions.length === 0) continue
        rows.push({ skillId, skillName, score, interventions })
      }
      // Stable, readable order: by skill name.
      rows.sort((a, b) => a.skillName.localeCompare(b.skillName))
      return rows
    },
    didacticRecommendations() {
      const rows = []
      const didactic = this.rulesDidactic || {}
      const categoryIds = Object.keys(didactic)
      // Sort by category display name for stable, readable order.
      categoryIds.sort((a, b) => {
        const an = this.categoryIdToName[a] || ''
        const bn = this.categoryIdToName[b] || ''
        return an.localeCompare(bn)
      })
      for (const categoryId of categoryIds) {
        const categoryName = this.categoryIdToName[categoryId]
        if (!categoryName) continue // category not in catalog (filtered or stale rule) — skip
        const perLevel = this.didacticAverages[categoryName]
        if (!perLevel) continue
        for (const level of DIDACTIC_LEVELS) {
          const score = perLevel[level]
          if (typeof score !== 'number') continue
          const interventions = matchInterventions({
            rules: this.rules,
            domain: 'didactic',
            key: categoryId,
            level,
            score,
          })
          if (interventions.length === 0) continue
          rows.push({ categoryId, categoryName, level, score, interventions })
        }
      }
      return rows
    },
    hasAnyRecommendation() {
      return (
        this.clinicalRecommendations.length > 0 ||
        this.didacticRecommendations.length > 0 ||
        this.consistencyRecommendations.length > 0
      )
    },
  },
  watch: {
    whom: {
      immediate: true,
      handler(newWhom) {
        if (!newWhom) return
        this.loadAll(newWhom)
      },
    },
  },
  methods: {
    formatScore(n) {
      if (typeof n !== 'number' || Number.isNaN(n)) return '—'
      return `${Math.round(n)}%`
    },
    levelLabel(level) {
      return LEVEL_DISPLAY[level] || level
    },
    formatMetric(n, unit) {
      if (typeof n !== 'number' || Number.isNaN(n)) return '—'
      return `${Math.round(n * 10) / 10} ${unit}`
    },
    aggregationLabel(a) {
      return (COVERAGE_AGGREGATIONS.find((x) => x.value === a) || {}).label || a
    },
    aggregationCell(row) {
      if (row.metric === 'angulation') return row.scope === 'perExam' ? 'Average' : 'Total'
      return row.aggregation ? this.aggregationLabel(row.aggregation) : '—'
    },
    aggregationTooltip(row) {
      if (row.metric === 'angulation') {
        return row.scope === 'perExam'
          ? 'Average angulation deviation per exam'
          : 'Total angulation deviation per question'
      }
      const entry = COVERAGE_AGGREGATIONS.find((x) => x.value === row.aggregation)
      if (!entry || typeof entry.description !== 'function') return ''
      const metricWord = this.metricKey === 'wastedCoverage' ? 'coverage' : 'slice'
      return entry.description(metricWord)
    },
    scopeLabel(s) {
      const label = (CONSISTENCY_SCOPES.find((x) => x.value === s) || {}).label || s
      return label.replace(/^Per\s+/, '')
    },
    examLabel(row) {
      const s = row.subject || {}
      const title = this.examIdToTitle[String(s.preparedExamId)] || `Exam #${s.preparedExamId}`
      const date = s.date ? new Date(s.date).toLocaleDateString() : ''
      return [title, date].filter(Boolean).join(' · ')
    },
    async loadAll(whom) {
      const tasks = [
        this.loadRules(),
        this.loadCategories(),
        this.loadPreparedExams(),
        this.loadMriScores(whom),
        this.loadCtScores(whom),
        this.loadAngulation(whom),
        this.loadCoverage(whom),
      ]
      await Promise.all(tasks)
    },
    async loadAngulation(whom) {
      this.isFetchingAngulation = true
      try {
        const data = await this.$store.dispatch('statisticsService/getFactorScores_Angle', {
          whom,
          mean: false,
          points: true,
        })
        this.rawAngleData = data && typeof data === 'object' ? data : {}
      } catch (e) {
        console.error('[InterventionRecommendations] getFactorScores_Angle failed', e)
        this.rawAngleData = {}
      } finally {
        this.isFetchingAngulation = false
      }
    },
    async loadCoverage(whom) {
      this.isFetchingCoverage = true
      try {
        const data = await this.$store.dispatch('statisticsService/getWastedSlices', {
          whom,
          mean: false,
          points: true,
        })
        this.rawCoverageData = data && typeof data === 'object' ? data : {}
      } catch (e) {
        console.error('[InterventionRecommendations] getWastedSlices failed', e)
        this.rawCoverageData = {}
      } finally {
        this.isFetchingCoverage = false
      }
    },
    async loadCtScores(whom) {
      this.isFetchingCt = true
      try {
        const data = await this.$store.dispatch('statisticsService/getRawCriticalThinkingScores', { whom })
        this.rawCtData = Array.isArray(data) ? data : []
      } catch (e) {
        console.error('[InterventionRecommendations] getRawCriticalThinkingScores failed', e)
        this.rawCtData = []
      } finally {
        this.isFetchingCt = false
      }
    },
    async loadRules() {
      this.isFetchingRules = true
      try {
        await this.$store.dispatch('interventionRules/fetchRules')
      } finally {
        this.isFetchingRules = false
      }
    },
    async loadCategories() {
      if (categoriesCache) {
        this.categories = categoriesCache
        return
      }
      this.isFetchingCategories = true
      try {
        const data = await this.$store.dispatch('bodyService/getCategories')
        categoriesCache = Array.isArray(data) ? data : []
        this.categories = categoriesCache
      } catch (e) {
        console.error('[InterventionRecommendations] getCategories failed', e)
      } finally {
        this.isFetchingCategories = false
      }
    },
    async loadPreparedExams() {
      if (preparedExamsCache) {
        this.preparedExams = preparedExamsCache
        return
      }
      this.isFetchingPreparedExams = true
      try {
        const response = await apiGet('prepared-exams', this.$store.state.authentication.accessToken)
        preparedExamsCache = (response && response.data && response.data.exams) || []
        this.preparedExams = preparedExamsCache
      } catch (e) {
        console.error('[InterventionRecommendations] getPreparedExams failed', e)
      } finally {
        this.isFetchingPreparedExams = false
      }
    },
    async loadMriScores(whom) {
      this.isFetchingMri = true
      try {
        await this.$store.dispatch('statisticsService/getRawMRIScores', { whom })
      } catch (e) {
        console.error('[InterventionRecommendations] getRawMRIScores failed', e)
      } finally {
        this.isFetchingMri = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.intervention-recommendations {
  ul {
    padding-left: 1.25rem;
    margin: 0;
  }
  th,
  td {
    text-align: left !important;
  }
}
</style>
