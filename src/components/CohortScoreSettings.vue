<template>
  <v-container class="py-3 px-10">
    <v-row class="px-0" fluid>
      <v-col cols="12" md="3">
        <v-radio-group v-model="showScoreType">
          <v-radio :label="$t('global.all', languageCode)" value="all"></v-radio>
          <v-radio :label="$t(isCTLab ? 'global.ct' : 'global.mri', languageCode)" value="mri"></v-radio>
          <v-radio :label="$t('global.critical_thinking', languageCode)" value="critical_thinking"></v-radio>
        </v-radio-group>
      </v-col>
      <v-col cols="12" md="5">
        <span class="d-flex align-center"
          >{{ $t('MRI.cohort_success_score') }}
          <v-text-field
            class="cohort-score-input"
            v-model="showScoreValue"
            type="number"
            :min="0"
            :max="99"
            :error="isScoreValueError"
          ></v-text-field>
          %
        </span>
      </v-col>
      <!-- <v-col cols="12" md="12">
        <div class="ep-difficulty-group">
          <span class="d-flex align-center">{{ $t('MRI.ep_difficulty') }} </span>
          <v-range-slider min="1" max="5" step="1" :value="difficulty" @change="updateDifficulty"></v-range-slider>
          <span>{{ difficulty.join('-') }}</span>
        </div>
      </v-col> -->
    </v-row>
    <v-row class="d-flex justify-end">
      <v-btn color="success" class="my-5" elevation="2" @click="save()" :disabled="isScoreValueError">{{
        $t('global.save', languageCode)
      }}</v-btn>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import config from '../config'

export default {
  name: 'CohortScoreSettings',
  components: {},
  props: {
    cohort: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showScoreType: 'all',
      showScoreValue: 0,
      isScoreValueError: false,
      adminSettings: {},
      settings: {},
      isCTLab: config.isCTLab,
      difficulty: [1, 5],
    }
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
  },
  watch: {
    cohort: {
      immediate: true,
      handler(newCohort) {
        this.showScoreType = newCohort.settings.showScore?.type ?? 'all'
        this.showScoreValue = newCohort.settings.showScore?.value ?? 0
        this.difficulty = [newCohort.settings?.minEPDifficulty ?? 1, newCohort.settings?.maxEPDifficulty ?? 5]
      },
    },
    showScoreValue(value) {
      if (value > 99 || value < 0) {
        this.isScoreValueError = true
      } else {
        this.isScoreValueError = false
      }
    },
  },
  methods: {
    ...mapActions('cohortService', ['updateCohort']),
    async save() {
      this.settings.showScore = {
        type: this.showScoreType,
        value: this.showScoreValue ?? 0,
      }
      this.settings.minEPDifficulty = this.difficulty[0]
      this.settings.maxEPDifficulty = this.difficulty[1]
      this.updateCohortSettings()
    },
    updateDifficulty(difficulty) {
      this.difficulty = difficulty
    },
    async updateCohortSettings() {
      const success = await this.updateCohort({
        settings: this.settings,
        cohortId: this.$props.cohort.id,
      })

      if (success) {
        this.$notify({ type: 'success', text: 'Updated!' })
      } else {
        this.$notify({ type: 'error', text: 'Failed' })
      }
    },
  },
}
</script>

<style lang="scss">
.ep-difficulty-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  .v-input {
    .v-input__control {
      .v-input__slot {
        margin-bottom: 0;
      }
      .v-messages {
        display: none;
      }
    }
  }
}
</style>
