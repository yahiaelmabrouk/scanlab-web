<template>
  <div>
    <div class="d-flex justify-end mt-4 mb-12">
      <div class="d-flex">
        <v-combobox
          class="cohorts-dropdown"
          v-model="selectedCohort"
          solo
          hide-details
          v-if="!isFromCohortManager"
          :items="cohortItems"
          :loading="!cohorts || isCohortGraphsLoading"
          :label="$t('global.select_cohort')"
          :disabled="isCohortGraphsLoading || !cohorts"
        ></v-combobox>
        <v-btn class="btn-refresh ml-2" :disabled="isCohortGraphsLoading" @click="loadGraphs">
          <v-icon>mdi-cached</v-icon>
        </v-btn>
      </div>
    </div>
    <div
      v-if="(!isCohortGraphsLoading && !selectedCohort) || (isCohortGraphsLoaded && isCohortGraphsError)"
      class="no-cohort-selected"
    >
      <span v-if="!isCohortGraphsLoading && !selectedCohort">{{ $t('global.select_cohort') }}</span>
      <span v-if="isCohortGraphsLoaded && isCohortGraphsError">{{ $t('global.error_occured_analysis') }}</span>
    </div>
    <div
      v-if="
        (selectedCohort && isCohortGraphsLoaded && !isCohortGraphsError) ||
        (!isCohortGraphsLoading && selectedCohort && selectedCohort.value)
      "
    >
      <div v-for="graph in cohortGraphFiles" :key="graph.filename" class="wrapper">
        <iframe :src="publicRootPath + '/' + graph.filename" frameborder="0"></iframe>
      </div>
    </div>
    <v-progress-circular v-if="isCohortGraphsLoading" indeterminate size="60"></v-progress-circular>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import _ from 'lodash'
import config from '../../config'

const { analysisPublicRoot } = config

const COHORT_GRAPH_FILES = [
  {
    filename: 'plot3.html',
    alt: 'Conceptual Knowledge Rating',
  },
  {
    filename: 'plot5.html',
    alt: 'Total Skill Rating',
  },
  {
    filename: 'plot6.html',
    alt: 'Brain Skill Rating',
  },
  {
    filename: 'plot7.html',
    alt: 'Glicko Analysis for Cohort',
  },
  {
    filename: 'plot8.html',
    alt: 'Lumbar Skill Rating',
  },
]

export default {
  name: 'GlickoAnalysis',
  components: {},
  props: {
    from: {
      type: String,
      default: 'admin-tools',
    },
    cohort: {
      type: Object,
    },
  },
  data() {
    return {
      loading: false,
      selectedCohort: null,
      cohortItems: [],
      publicRootPath: analysisPublicRoot,
      cohortGraphFiles: COHORT_GRAPH_FILES,
    }
  },
  computed: {
    ...mapState('cohortService', ['cohorts']),
    ...mapState('analysisService', ['isCohortGraphsLoading', 'isCohortGraphsLoaded', 'isCohortGraphsError']),
    isFromCohortManager() {
      return this.$props.from === 'cohort-manager'
    },
  },
  async beforeMount() {},
  async mounted() {
    if (!this.isFromCohortManager) this.loadCohorts()
  },
  beforeDestroy() {},
  watch: {
    cohorts: {
      immediate: true,
      handler(newCohorts) {
        if (newCohorts) {
          this.cohortItems = newCohorts
            .filter((_cohort) => _cohort.cohortPreparedExams.length)
            .map((_cohort) => ({
              text: _cohort.name,
              value: _cohort.id,
            }))
        }
      },
    },
    selectedCohort(newSelectedCohort) {
      if (newSelectedCohort?.value) this.loadGraphs()
    },
    from: {
      immediate: true,
      handler(isFrom) {
        if (isFrom === 'cohort-manager') {
          this.selectedCohort = {
            text: this.$props.cohort.name,
            value: this.$props.cohort.id,
          }
        }
      },
    },
  },
  methods: {
    ...mapActions('cohortService', ['loadCohorts']),
    ...mapActions('analysisService', ['generateCohortGraphs']),
    async loadGraphs() {
      this.generateCohortGraphs({ cohortId: this.selectedCohort.value })
    },
  },
}
</script>

<style scoped lang="scss">
.v-input--selection-controls {
  margin-top: 0;
}

.btn-refresh {
  height: 100% !important;
  min-height: 45px;
}

.v-menu__content {
  text-align: start;
}

.mri-config-container {
  position: relative;
  width: 100%;

  & .students-panel {
    position: absolute;
    right: 10px;
    max-width: 150px;

    & .v-expansion-panel-header {
      font-size: 14px;
      padding: 5px 10px;
    }

    ::v-deep .v-expansion-panel-content__wrap {
      padding: 5px 10px;
      font-size: 14px;
    }
  }
}

.line-color {
  margin-right: 6px;
  height: 3px;
  width: 15px;
}

.line-name {
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 30px;
}

.no-cohort-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.wrapper {
  position: relative;
  padding-top: 56.25%;
  padding-top: 50%;
  height: 0;
  margin-top: 30px;

  & iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
