<template>
  <v-container>
    <v-progress-linear v-if="!myCohorts" indeterminate color="cyan"></v-progress-linear>
    <v-row>
      <v-col>
        <v-card>
          <v-col>
            <v-list subheader>
              <v-subheader>{{ $t('global.cohorts', languageCode) }}</v-subheader>
              <v-list-item-group>
                <template v-if="myCohorts">
                  <template v-for="(cohort, index) in myCohorts">
                    <v-list-item :key="cohort.key" :to="{ name: 'cohorts/cohort', params: { cohortId: cohort.id } }">
                      <v-list-item-content>
                        <v-list-item-title class="text-wrap" v-text="`${cohort.name}`"></v-list-item-title>
                        <export-student-data-link
                          :cohort="cohort"
                          :text="$t('global.export_cohort_excel')"
                          format="xlsx"
                        />
                        <export-student-data-link
                          :cohort="cohort"
                          :text="$t('global.export_cohort_csv')"
                          format="csv"
                        />
                      </v-list-item-content>
                      <v-list-item-action @click.stop.prevent>
                        <v-tooltip bottom max-width="260">
                          <template #activator="{ on, attrs }">
                            <div v-bind="attrs" v-on="on">
                              <v-switch
                                :input-value="!!(cohort.settings && cohort.settings.isTeachingModeEnabled)"
                                :label="$t('CohortManager.teaching_mode')"
                                hide-details
                                @change="onTeachingModeToggle(cohort, $event)"
                              />
                            </div>
                          </template>
                          <span>{{ $t('CohortManager.teaching_mode_refresh_hint') }}</span>
                        </v-tooltip>
                      </v-list-item-action>
                    </v-list-item>
                    <v-divider :key="index" />
                  </template>
                </template>
              </v-list-item-group>
            </v-list>
          </v-col>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import ExportStudentDataLink from '@/components/ExportStudentDataLink'

export default {
  name: 'Cohorts',
  components: { ExportStudentDataLink },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('cohortService', ['myCohorts']),
    ...mapGetters('user', ['languageCode']),
  },
  beforeMount() {
    this.loadMyCohorts()
  },
  methods: {
    ...mapActions('cohortService', ['loadMyCohorts', 'updateCohort']),
    async onTeachingModeToggle(cohort, value) {
      await this.updateCohort({
        cohortId: cohort.id,
        settings: { isTeachingModeEnabled: !!value },
      })
    },
  },
}
</script>

<style scoped lang="scss"></style>
