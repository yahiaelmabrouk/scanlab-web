<template>
  <v-container>
    <v-progress-linear v-if="!cohorts" indeterminate color="cyan"></v-progress-linear>
    <v-row>
      <v-col>
        <v-card>
          <v-col>
            <v-list subheader>
              <v-subheader>{{ $t('global.cohorts', languageCode) }}</v-subheader>
              <v-list-item-group v-if="cohorts">
                <template v-for="(cohort, index) in cohorts">
                  <v-list-item
                    :key="cohort.key"
                    :to="{ name: 'cohort-manager/cohort', params: { cohortId: cohort.id } }"
                  >
                    <v-list-item-content>
                      <div class="d-flex align-center justify-space-between">
                        <div class="text-wrap flex-auto" v-text="`${cohort.name}`"></div>
                        <div class="p-1 cohort-item-icons">
                          <div class="icon-wrapper" @click.prevent="onEditCohort(cohort)">
                            <v-icon color="black" size="20">mdi-table-edit</v-icon>
                          </div>
                        </div>
                      </div>
                    </v-list-item-content>
                  </v-list-item>
                  <v-divider :key="index" />
                </template>
              </v-list-item-group>
            </v-list>

            <!-- <v-form @submit.prevent="createCohort()">
              <h2>{{ $t('CohortManager.new_cohort', languageCode) }}</h2>

              <v-text-field v-model="newCohortName" :label="$t('global.name', languageCode)" />
              <v-btn type="submit" color="success"> {{ $t('global.create', languageCode) }} </v-btn>
            </v-form> -->

            <v-btn type="button" color="success" @click="onOpenCreateCohortModal">
              {{ $t('global.create', languageCode) }}
            </v-btn>
          </v-col>
        </v-card>
      </v-col>
    </v-row>
    <b-modal
      id="createCohortModal"
      :title="selectedCohort ? $t('global.edit_cohort', languageCode) : $t('global.create_cohort', languageCode)"
      centered
      ok-only
      @ok="onCreateNewCohort($event)"
    >
      <template #modal-ok>
        {{ $t('global.okay') }}
      </template>

      <template #modal-cancel>
        {{ $t('global.cancel') }}
      </template>

      <div>
        <v-text-field v-model="newCohortName" :label="$t('global.name', languageCode)" />
        <v-select
          v-model="newCohortArea"
          :items="USER_AREA_OPTIONS"
          :label="$t('global.area', languageCode)"
          :disabled="!!selectedCohort"
          item-text="text"
          item-value="value"
        />
      </div>
    </b-modal>
  </v-container>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { apiPost, apiPut } from '../util/api'
import { USER_AREA, USER_AREA_OPTIONS } from '../constants'

export default {
  name: 'CohortManager',
  data() {
    return {
      newCohortName: '',
      newCohortArea: USER_AREA.US_EAST,
      USER_AREA_OPTIONS,
      selectedCohort: null,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('cohortService', ['cohorts']),
    ...mapGetters('user', ['languageCode']),
  },
  async beforeMount() {
    this.loadCohorts()
  },
  methods: {
    ...mapActions('cohortService', ['loadCohorts']),
    onCreateNewCohort(e) {
      e.preventDefault()
      this.createCohort()
    },
    onOpenCreateCohortModal() {
      this.selectedCohort = null
      this.newCohortName = ''
      this.newCohortArea = USER_AREA.US_EAST
      this.$root.$emit('bv::show::modal', 'createCohortModal')
    },
    onEditCohort(cohort) {
      this.selectedCohort = cohort
      this.newCohortName = cohort.name
      this.newCohortArea = cohort.area || USER_AREA.US_EAST
      this.$root.$emit('bv::show::modal', 'createCohortModal')
    },
    async createCohort() {
      if (!this.newCohortName || this.newCohortName.trim() === '') {
        this.$notify({ type: 'error', text: 'Cohort name cannot be empty' })
        return
      }
      if (this.selectedCohort) {
        // Edit existing cohort
        let result = await apiPut(
          `cohorts/${this.selectedCohort.id}`,
          {},
          { name: this.newCohortName },
          this.accessToken
        )
        if (result.data && result.data.success) {
          this.$notify({ text: 'Updated Cohort' })
          this.newCohortName = ''
          this.selectedCohort = null
          this.loadCohorts()
          this.$root.$emit('bv::hide::modal', 'createCohortModal')
        } else {
          this.$notify({ type: 'error', text: 'Failed to Update Cohort' })
        }
        return
      } else {
        // Create new cohort
        let result = await apiPost('cohorts', { name: this.newCohortName, area: this.newCohortArea }, this.accessToken)
        if (result.data && result.data.success) {
          this.$notify({ text: 'Created Cohort' })
          this.newCohortName = ''
          this.loadCohorts()
          this.$root.$emit('bv::hide::modal', 'createCohortModal')
        } else {
          this.$notify({ type: 'error', text: 'Failed to Create Cohort' })
        }
      }
    },
  },
}
</script>

<style scoped lang="scss"></style>
