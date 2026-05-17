<template>
  <div>
    <h3 class="mb-4">{{ $t('ApiEndpoints.endpoint_permissions', languageCode) }}</h3>
    <v-row>
      <v-col>
        <div class="d-flex gap-2 mb-4">
          <v-select
            v-model="endpointFilters.service"
            :items="serviceOptions"
            :label="$t('ApiEndpoints.service')"
            clearable
            outlined
            dense
            hide-details
            style="min-width: 150px"
            @change="loadCohortEndpoints"
          />
          <v-select
            v-model="endpointFilters.version"
            :items="versionOptions"
            :label="$t('ApiEndpoints.version')"
            clearable
            outlined
            dense
            hide-details
            style="min-width: 120px"
            @change="loadCohortEndpoints"
          />
          <v-switch
            v-model="endpointFilters.includeInactive"
            :label="$t('ApiEndpoints.include_inactive')"
            class="mt-0"
            hide-details
            @change="loadCohortEndpoints"
          />
        </div>

        <v-data-table
          :headers="endpointHeaders"
          :items="cohortEndpoints"
          class="elevation-1"
          :items-per-page="15"
          :loading="endpointsLoading"
        >
          <template v-slot:item.pathPattern="{ item }">
            <code>{{ item.pathPattern }}</code>
          </template>
          <template v-slot:item.method="{ item }">
            <v-chip :color="getMethodColor(item.method)" small>
              {{ item.method }}
            </v-chip>
          </template>
          <template v-slot:item.isActive="{ item }">
            <v-chip :color="item.isActive ? 'success' : 'error'" small>
              {{ item.isActive ? $t('ApiEndpoints.enabled') : $t('ApiEndpoints.disabled') }}
            </v-chip>
          </template>
          <template v-slot:item.hasPermission="{ item }">
            <v-btn
              v-if="!item.hasPermission"
              color="primary"
              small
              :disabled="!item.isActive"
              @click="grantAccess(item)"
            >
              Grant Access
            </v-btn>
            <v-switch v-else v-model="item.isAllowed" :disabled="!item.isActive" @change="toggleEndpointAccess(item)" />
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { apiGet, apiPost, apiPatch } from '../util/api'

export default {
  name: 'EndpointPermissionsManager',
  props: {
    cohortId: {
      type: [String, Number],
      required: true,
    },
  },
  data() {
    return {
      cohortEndpoints: [],
      endpointsLoading: false,
      endpointFilters: {
        service: null,
        version: null,
        includeInactive: true,
      },
      serviceOptions: [
        { text: 'Cohorts', value: 'cohorts' },
        { text: 'Users', value: 'users' },
        { text: 'DICOM', value: 'dicom' },
        { text: 'Tests', value: 'tests' },
        { text: 'Resources', value: 'resources' },
      ],
      versionOptions: [
        { text: 'v1', value: 'v1' },
        { text: 'v2', value: 'v2' },
      ],
      endpointHeaders: [
        {
          text: 'Endpoint Name',
          value: 'name',
          align: 'start',
          sortable: true,
        },
        {
          text: 'Path Pattern',
          value: 'pathPattern',
          align: 'start',
          sortable: true,
        },
        {
          text: 'Method',
          value: 'method',
          align: 'center',
          sortable: true,
        },
        {
          text: 'Service',
          value: 'service',
          align: 'start',
          sortable: true,
        },
        {
          text: 'Version',
          value: 'version',
          align: 'center',
          sortable: true,
        },
        {
          text: 'Status',
          value: 'isActive',
          align: 'center',
          sortable: true,
        },
        {
          text: 'Access Control',
          value: 'hasPermission',
          align: 'center',
          sortable: false,
        },
      ],
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapGetters('user', ['languageCode']),
  },
  mounted() {
    this.loadCohortEndpoints()
  },
  methods: {
    async loadCohortEndpoints() {
      this.endpointsLoading = true
      try {
        // Build query parameters
        const params = {}
        if (this.endpointFilters.service) params.service = this.endpointFilters.service
        if (this.endpointFilters.version) params.version = this.endpointFilters.version
        if (this.endpointFilters.includeInactive) params.includeInactive = 'true'

        const response = await apiGet(`cohorts/${this.cohortId}/accessible-endpoints`, this.accessToken, params)
        this.cohortEndpoints = response.data.data || response.data
      } catch (error) {
        this.$notify({
          type: 'error',
          text: error.response?.data?.message || 'Failed to load cohort endpoints',
        })
      } finally {
        this.endpointsLoading = false
      }
    },
    async grantAccess(endpoint) {
      try {
        // Grant permission (POST new permission)
        const payload = {
          endpointId: endpoint.id,
          maxRequestsPerHour: null,
          description: `Access granted for ${endpoint.name}`,
        }
        const response = await apiPost(`cohorts/${this.cohortId}/permissions`, payload, this.accessToken)

        if (response.data && response.data.success) {
          // Update endpoint with new permission
          endpoint.hasPermission = true
          endpoint.isAllowed = true
          endpoint.permission = response.data.permission ||
            response.data.data || {
              id: response.data.id,
              isAllowed: true,
              grantedAt: new Date().toISOString(),
            }

          this.$notify({
            type: 'success',
            text: 'Access granted successfully',
          })
        } else {
          this.$notify({ type: 'error', text: 'Failed to grant access' })
        }
      } catch (error) {
        this.$notify({
          type: 'error',
          text: error.response?.data?.message || 'Failed to grant access',
        })
      }
    },
    async toggleEndpointAccess(endpoint) {
      try {
        // Update existing permission (PATCH)
        const payload = {
          isAllowed: endpoint.isAllowed,
          description: `Access ${endpoint.isAllowed ? 'granted' : 'denied'} for ${endpoint.name}`,
        }
        const response = await apiPatch(
          `cohorts/${this.cohortId}/permissions/${endpoint.id}`,
          payload,
          this.accessToken
        )

        if (response.data && response.data.success) {
          // Update permission object with response data
          endpoint.permission = response.data.data || {
            ...endpoint.permission,
            isAllowed: endpoint.isAllowed,
            description: payload.description,
            updatedAt: new Date().toISOString(),
          }

          this.$notify({
            type: 'success',
            text: `Access ${endpoint.isAllowed ? 'granted' : 'denied'} successfully`,
          })
        } else {
          // Revert the switch on failure
          endpoint.isAllowed = !endpoint.isAllowed
          this.$notify({ type: 'error', text: 'Failed to update access' })
        }
      } catch (error) {
        // Revert the switch on failure
        endpoint.isAllowed = !endpoint.isAllowed
        this.$notify({
          type: 'error',
          text: error.response?.data?.message || 'Failed to update access',
        })
      }
    },
    getMethodColor(method) {
      const colors = {
        GET: 'success',
        POST: 'primary',
        PUT: 'warning',
        DELETE: 'error',
        PATCH: 'info',
      }
      return colors[method] || 'default'
    },
  },
}
</script>

<style scoped lang="scss">
.gap-2 {
  gap: 10px;
}
</style>
