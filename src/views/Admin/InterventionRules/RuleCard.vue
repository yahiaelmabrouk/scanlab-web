<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card class="rule-card" outlined>
    <v-card-title class="rule-card__header">
      <span class="rule-card__title">{{ isNew ? 'New rule' : 'Rule' }}</span>
      <v-spacer />
      <v-btn icon small :disabled="isLocked" @click="confirmDelete" aria-label="Delete rule">
        <v-icon small>mdi-delete</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <div class="rule-body">
        <div class="rule-body__controls">
          <div v-if="domain === 'didactic'" class="rule-body__level">
            <v-select
              v-model="draft.level"
              :items="levelOptions"
              label="Level"
              dense
              outlined
              hide-details
              :disabled="isLocked"
            />
          </div>

          <div v-if="isConsistency" class="rule-body__level">
            <v-select
              v-model="draft.scope"
              :items="scopeOptions"
              item-text="label"
              item-value="value"
              label="Scope"
              dense
              outlined
              hide-details
              :disabled="isLocked || !isNew"
            />
          </div>

          <div v-if="isConsistency && bounds.hasAggregation" class="rule-body__level">
            <v-select
              v-model="draft.aggregation"
              :items="aggregationOptions"
              item-text="label"
              item-value="value"
              label="Aggregation"
              dense
              outlined
              hide-details
              :disabled="isLocked"
            />
          </div>

          <div class="rule-body__range">
            <v-text-field
              :value="draft.from"
              type="number"
              :min="rangeAttrs.min"
              :max="rangeAttrs.max"
              :step="rangeAttrs.step"
              label="From"
              :suffix="rangeAttrs.suffix"
              dense
              outlined
              hide-details="auto"
              class="range-field"
              :disabled="isLocked"
              @input="onRangeInput('from', $event)"
            />
            <v-text-field
              :value="draft.to"
              type="number"
              :min="rangeAttrs.min"
              :max="rangeAttrs.max"
              :step="rangeAttrs.step"
              label="To"
              :suffix="rangeAttrs.suffix"
              dense
              outlined
              hide-details="auto"
              class="range-field"
              :disabled="isLocked"
              @input="onRangeInput('to', $event)"
            />
          </div>
        </div>

        <div class="interventions">
          <div class="interventions__label">Interventions</div>
          <div
            v-for="(intervention, idx) in draft.interventions"
            :key="intervention.id || intervention._localId"
            class="intervention-row"
          >
            <v-text-field
              v-model="intervention.text"
              label="Intervention"
              dense
              outlined
              hide-details="auto"
              :disabled="isLocked"
            />
            <v-btn
              icon
              small
              class="intervention-row__remove"
              :disabled="isLocked || draft.interventions.length === 1"
              @click="removeIntervention(idx)"
              aria-label="Remove intervention"
            >
              <v-icon small>mdi-close</v-icon>
            </v-btn>
          </div>
          <v-btn text small color="primary" :disabled="isLocked" @click="addIntervention"> + Add intervention </v-btn>
        </div>
      </div>

      <div v-if="error" class="rule-card__error">{{ error }}</div>

      <div v-if="isDirty" class="rule-card__actions">
        <span v-if="validationError" class="rule-card__validation">{{ validationError }}</span>
        <v-spacer />
        <v-btn text small :disabled="isLocked" @click="cancel">Cancel</v-btn>
        <v-btn color="primary" small :loading="saving" :disabled="isLocked || !!validationError" @click="save">
          Save
        </v-btn>
      </div>
    </v-card-text>

    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete this rule?</v-card-title>
        <v-card-text>This cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="doDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import _ from 'lodash'
import uuidv4 from 'uuid/v4'
import {
  LEVEL_OPTIONS,
  cloneRule,
  normalizeForCompare,
  metricBounds,
  COVERAGE_AGGREGATIONS,
  CONSISTENCY_SCOPES,
} from '../../../constants/interventionRules'

const isInFlightError = (err) => err && (err.message === 'save-in-flight' || err.message === 'delete-in-flight')

export default {
  name: 'RuleCard',
  props: {
    rule: { type: Object, required: true },
    domain: { type: String, required: true },
    parentKey: { type: [String, Number], required: true },
  },
  data() {
    return {
      levelOptions: LEVEL_OPTIONS,
      aggregationOptions: COVERAGE_AGGREGATIONS,
      scopeOptions: CONSISTENCY_SCOPES,
      draft: cloneRule(this.rule),
      saving: false,
      deleting: false,
      error: '',
      showDeleteDialog: false,
    }
  },
  computed: {
    isNew() {
      return !this.rule.id
    },
    isLocked() {
      return this.saving || this.deleting
    },
    isConsistency() {
      return this.domain === 'consistency'
    },
    bounds() {
      if (!this.isConsistency) return { hasAggregation: false }
      return metricBounds(String(this.parentKey), this.draft.aggregation)
    },
    rangeAttrs() {
      if (this.isConsistency) {
        const b = this.bounds
        // softMax is informational (no max attr) so above-cap values save silently per spec.
        return {
          min: b.min,
          max: undefined,
          step: b.step,
          suffix: b.unit,
        }
      }
      return { min: 0, max: 100, step: 1, suffix: '%' }
    },
    isDirty() {
      if (this.isNew) return true
      return !_.isEqual(normalizeForCompare(this.draft), normalizeForCompare(this.rule))
    },
    validationError() {
      const f = this.draft.from
      const t = this.draft.to
      if (f === '' || f == null) return 'From is required'
      if (t === '' || t == null) return 'To is required'
      const fn = Number(f)
      const tn = Number(t)
      if (!Number.isFinite(fn) || !Number.isFinite(tn)) return 'From and To must be numbers'
      if (this.isConsistency) {
        if (!this.draft.scope) return 'Scope is required'
        const min = this.bounds.min
        if (fn < min || tn < min) {
          return min < 0 ? `Values must be ≥ ${min}` : 'Values must be ≥ 0'
        }
      } else if (fn < 0 || fn > 100 || tn < 0 || tn > 100) {
        return 'Values must be between 0 and 100'
      }
      if (fn > tn) return 'From must be ≤ To'
      if (!this.draft.interventions || this.draft.interventions.length < 1) {
        return 'At least one intervention is required'
      }
      if (this.draft.interventions.some((i) => !i.text || !i.text.trim())) {
        return 'Intervention text cannot be empty'
      }
      return ''
    },
  },
  methods: {
    onRangeInput(field, value) {
      this.draft[field] = value === '' ? '' : Number(value)
    },
    addIntervention() {
      if (this.isLocked) return
      this.draft.interventions.push({ _localId: uuidv4(), text: '' })
    },
    removeIntervention(idx) {
      if (this.isLocked || this.draft.interventions.length <= 1) return
      this.draft.interventions.splice(idx, 1)
    },
    save() {
      if (this.validationError) {
        this.error = this.validationError
        return
      }
      this.error = ''
      this.saving = true
      this.$store
        .dispatch('interventionRules/saveRule', {
          rule: this.draft,
          domain: this.domain,
          parentKey: this.parentKey,
        })
        .then((saved) => {
          this.draft = cloneRule(saved)
        })
        .catch((err) => {
          if (isInFlightError(err)) return
          this.error = this.extractError(err) || 'Save failed'
        })
        .finally(() => {
          this.saving = false
        })
    },
    cancel() {
      if (this.isLocked) return
      this.error = ''
      if (this.isNew) {
        this.$store.commit('interventionRules/removeRule', {
          domain: this.domain,
          key: String(this.parentKey),
          ruleKey: this.rule._localId,
        })
        return
      }
      this.draft = cloneRule(this.rule)
    },
    confirmDelete() {
      if (this.isLocked) return
      // Never-saved rules have no server state to confirm against — drop them straight away.
      if (this.isNew) {
        this.cancel()
        return
      }
      this.showDeleteDialog = true
    },
    doDelete() {
      this.showDeleteDialog = false
      this.error = ''
      this.deleting = true
      this.$store
        .dispatch('interventionRules/deleteRulePersisted', {
          rule: this.rule,
          domain: this.domain,
          parentKey: this.parentKey,
        })
        .catch((err) => {
          if (isInFlightError(err)) return
          this.error = this.extractError(err) || 'Delete failed'
        })
        .finally(() => {
          this.deleting = false
        })
    },
    extractError(err) {
      if (!err) return ''
      const data = err.response && err.response.data
      if (data && data.error) return data.error
      return err.message || ''
    },
  },
}
</script>

<style scoped lang="scss">
.rule-card {
  margin-bottom: 16px;
}
.rule-card__header {
  display: flex;
  align-items: center;
}
.rule-card__title {
  font-size: 1rem;
  font-weight: 500;
}
.rule-card__error {
  margin-top: 12px;
  color: var(--v-error-base, #b00020);
  font-size: 0.875rem;
}
.rule-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.rule-card__validation {
  color: var(--v-error-base, #b00020);
  font-size: 0.875rem;
}
.rule-body {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: flex-start;
  gap: 16px 24px;
}
.rule-body__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  margin-top: 30px;
}
.rule-body__level {
  flex: 0 0 140px;
}
.rule-body__range {
  display: flex;
  flex-direction: row;
  gap: 8px;
  flex-shrink: 0;
}
.range-field {
  width: 120px;
  flex: 0 0 120px;
}
.interventions {
  min-width: 0;
}
.interventions__label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 8px;
}
.intervention-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.intervention-row__remove {
  flex-shrink: 0;
}
</style>
