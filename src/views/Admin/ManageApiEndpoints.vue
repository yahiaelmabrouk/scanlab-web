<template>
  <div style="padding: 10px; min-height: 78vh">
    <v-row>
      <v-col cols="12">
        <div class="mt-10 mb-10">
          <h2>{{ $t('ApiEndpoints.manage_api_endpoints') }}</h2>
        </div>
      </v-col>
      <v-col cols="12" class="d-flex justify-space-between align-items-center gap-2 pt-0 mt-0">
        <div class="d-flex gap-2">
          <v-select
            v-model="filters.service"
            :items="serviceOptions"
            :label="$t('ApiEndpoints.service')"
            clearable
            outlined
            dense
            hide-details
            style="min-width: 150px"
            @change="refresh"
          />
          <v-select
            v-model="filters.version"
            :items="versionOptions"
            :label="$t('ApiEndpoints.version')"
            clearable
            outlined
            dense
            hide-details
            style="min-width: 120px"
            @change="refresh"
          />
          <v-select
            v-model="filters.isActive"
            :items="activeOptions"
            :label="$t('ApiEndpoints.status')"
            clearable
            outlined
            dense
            hide-details
            style="min-width: 120px"
            @change="refresh"
          />
        </div>
        <v-btn
          color="primary"
          @click="
            selectedId = null
            showPopup = true
          "
          >{{ $t('ApiEndpoints.add_api_endpoint') }}</v-btn
        >
      </v-col>
    </v-row>
    <v-row>
      <table class="table table-striped table-bordered">
        <thead>
          <tr>
            <th>{{ $t('ApiEndpoints.endpoint_name') }}</th>
            <th>{{ $t('ApiEndpoints.path_pattern') }}</th>
            <th>{{ $t('ApiEndpoints.http_method') }}</th>
            <th>{{ $t('ApiEndpoints.service') }}</th>
            <th>{{ $t('ApiEndpoints.version') }}</th>
            <th>{{ $t('ApiEndpoints.description') }}</th>
            <th>{{ $t('ApiEndpoints.requires_authentication') }}</th>
            <th>{{ $t('ApiEndpoints.enabled') }}</th>
            <th>{{ $t('global.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="endpoints.length === 0">
            <td colspan="9">{{ $t('global.no_data') }}</td>
          </tr>
          <tr v-for="endpoint in endpoints" :key="endpoint.id" v-else>
            <td>{{ endpoint.name }}</td>
            <td>
              <code>{{ endpoint.pathPattern }}</code>
            </td>
            <td>
              <v-chip :color="getMethodColor(endpoint.method)" small>
                {{ endpoint.method }}
              </v-chip>
            </td>
            <td>{{ endpoint.service }}</td>
            <td>{{ endpoint.version }}</td>
            <td>{{ endpoint.description }}</td>
            <td>
              <v-chip :color="endpoint.requiresAuth ? 'success' : 'warning'" small>
                {{ endpoint.requiresAuth ? $t('global.yes') : $t('global.no') }}
              </v-chip>
            </td>
            <td>
              <v-chip :color="endpoint.isActive ? 'success' : 'error'" small>
                {{ endpoint.isActive ? $t('ApiEndpoints.enabled') : $t('ApiEndpoints.disabled') }}
              </v-chip>
            </td>
            <td>
              <v-btn
                color="primary"
                text
                @click="
                  selectedId = endpoint.id
                  showPopup = true
                "
                >{{ $t('global.edit') }}</v-btn
              >
              <v-btn
                :color="endpoint.isActive ? 'warning' : 'success'"
                text
                @click="toggleEndpoint(endpoint.id, !endpoint.isActive)"
              >
                {{ endpoint.isActive ? $t('ApiEndpoints.disable') : $t('ApiEndpoints.enable') }}
              </v-btn>
              <v-btn color="error" text @click="deleteEndpoint(endpoint.id)">{{ $t('global.delete') }}</v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </v-row>
    <PopupAddEditApiEndpoint :show="showPopup" :id="selectedId" @close="showPopup = false" @refresh="refresh" />
    <v-dialog v-model="isDeleteModalOpen" width="700px">
      <v-card outlined>
        <v-card-title>
          <span class="headline">
            {{ $t('ApiEndpoints.delete_api_endpoint', languageCode) }}
          </span>
        </v-card-title>

        <v-card-text>
          <span>
            {{ $t('ApiEndpoints.are_you_sure_delete_api_endpoint', languageCode) }}
          </span>
        </v-card-text>

        <v-card-actions class="right">
          <v-spacer></v-spacer>
          <v-btn :loading="deleteLoading" :disabled="deleteLoading" outlined @click="isDeleteModalOpen = false">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn :loading="deleteLoading" :disabled="deleteLoading" color="error" @click="deleteSelectedEndpoint">
            {{ $t('global.delete', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import PopupAddEditApiEndpoint from '../../components/PopupAddEditApiEndpoint.vue'
import { apiDelete, apiGet, apiPatch } from '../../util/api'
import { mapState } from 'vuex'
import Vue from 'vue'

export default {
  name: 'ManageApiEndpoints',
  components: {
    PopupAddEditApiEndpoint,
  },
  data() {
    return {
      endpoints: [],
      showPopup: false,
      selectedId: null,
      isDeleteModalOpen: false,
      loading: false,
      deleteLoading: false,
      filters: {
        service: null,
        version: null,
        isActive: null,
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
      activeOptions: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('user', ['languageCode']),
  },
  mounted() {
    this.refresh()
  },
  methods: {
    refresh() {
      this.showPopup = false
      this.loading = true

      // Build query parameters
      const params = new URLSearchParams()
      if (this.filters.service) params.append('service', this.filters.service)
      if (this.filters.version) params.append('version', this.filters.version)
      if (this.filters.isActive !== null) params.append('isActive', this.filters.isActive.toString())

      const queryString = params.toString()
      const url = queryString ? `endpoints?${queryString}` : 'endpoints'

      apiGet(url, this.accessToken)
        .then((response) => {
          this.endpoints = response.data.data || response.data
        })
        .catch((err) => {
          Vue.notify({
            type: 'error',
            text: err.response?.data?.message || 'Failed to load API endpoints',
          })
        })
        .finally(() => {
          this.loading = false
        })
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
    toggleEndpoint(id, isActive) {
      const action = isActive ? 'activate' : 'deactivate'
      apiPatch(`endpoints/${id}/${action}`, {}, this.accessToken)
        .then(() => {
          this.refresh()
          Vue.notify({
            type: 'success',
            text: isActive ? 'Endpoint activated successfully' : 'Endpoint deactivated successfully',
          })
        })
        .catch((err) => {
          Vue.notify({
            type: 'error',
            text: err.response?.data?.message || 'Failed to toggle endpoint',
          })
        })
    },
    deleteEndpoint(id) {
      this.selectedId = id
      this.isDeleteModalOpen = true
    },
    deleteSelectedEndpoint() {
      this.deleteLoading = true
      apiDelete(`endpoints/${this.selectedId}`, this.accessToken)
        .then(() => {
          this.refresh()
          this.isDeleteModalOpen = false
          Vue.notify({
            type: 'success',
            text: 'Successfully deleted!',
          })
        })
        .catch((err) => {
          Vue.notify({
            type: 'error',
            text: err.response?.data?.message || 'Failed to delete endpoint',
          })
        })
        .finally(() => {
          this.deleteLoading = false
        })
    },
  },
}
</script>
<style lang="scss" scoped>
.gap-2 {
  gap: 10px;
}
</style>
