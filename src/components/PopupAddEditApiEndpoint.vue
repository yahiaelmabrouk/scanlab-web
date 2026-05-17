<template>
  <v-dialog persistent v-model="show" max-width="800px">
    <v-card>
      <v-card-title class="headline">
        {{ isAddMode ? $t('ApiEndpoints.add_api_endpoint') : $t('ApiEndpoints.edit_api_endpoint') }}
      </v-card-title>
      <div>
        <v-form v-model="formValid" @submit.prevent="save">
          <v-row class="m-0">
            <v-col cols="12">
              <v-text-field
                :rules="rules.requiredPathPattern"
                outlined
                hide-details
                v-model="endpoint.pathPattern"
                :label="$t('ApiEndpoints.path_pattern')"
                placeholder="/v1/cohorts/:id/students"
                :disabled="!isAddMode"
                :readonly="!isAddMode"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                :rules="rules.requiredName"
                outlined
                hide-details
                v-model="endpoint.name"
                :label="$t('ApiEndpoints.endpoint_name')"
                placeholder="Get Cohort Students"
              />
            </v-col>
            <v-col cols="4">
              <v-select
                outlined
                hide-details
                :rules="rules.requiredMethod"
                v-model="endpoint.method"
                :label="$t('ApiEndpoints.http_method')"
                :items="httpMethods"
                :disabled="!isAddMode"
                :readonly="!isAddMode"
              />
            </v-col>
            <v-col cols="4">
              <v-select
                outlined
                hide-details
                :rules="rules.requiredService"
                v-model="endpoint.service"
                :label="$t('ApiEndpoints.service')"
                :items="serviceOptions"
              />
            </v-col>
            <v-col cols="4">
              <v-select
                outlined
                hide-details
                :rules="rules.requiredVersion"
                v-model="endpoint.version"
                :label="$t('ApiEndpoints.version')"
                :items="versionOptions"
                :disabled="!isAddMode"
                :readonly="!isAddMode"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                outlined
                hide-details
                v-model="endpoint.description"
                :label="$t('ApiEndpoints.description')"
                rows="3"
              />
            </v-col>
            <v-col cols="6">
              <v-switch v-model="endpoint.isActive" :label="$t('ApiEndpoints.enabled')" hide-details />
            </v-col>
            <v-col cols="6">
              <v-switch
                v-model="endpoint.requiresAuth"
                :label="$t('ApiEndpoints.requires_authentication')"
                hide-details
              />
            </v-col>
          </v-row>
        </v-form>
      </div>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn outlined @click="close">{{ $t('global.cancel') }}</v-btn>
        <v-btn :loading="loading" :disabled="!formValid || loading" color="primary" @click="save">{{
          $t('global.save')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import { apiGet, apiPost, apiPatch } from '../util/api'
import { mapState } from 'vuex'
import Vue from 'vue'

export default {
  name: 'PopupAddEditApiEndpoint',
  props: {
    show: Boolean,
    id: [String, Number],
  },
  data() {
    return {
      formValid: false,
      loading: false,
      endpoint: {
        pathPattern: '',
        name: '',
        method: 'GET',
        service: '',
        version: 'v1',
        description: '',
        isActive: false,
        requiresAuth: true,
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
      httpMethods: [
        { text: 'GET', value: 'GET' },
        { text: 'POST', value: 'POST' },
        { text: 'PUT', value: 'PUT' },
        { text: 'DELETE', value: 'DELETE' },
        { text: 'PATCH', value: 'PATCH' },
      ],
      rules: {
        requiredPathPattern: [
          (v) => !!v || 'Path pattern is required',
          (v) => v.startsWith('/') || 'Path must start with /',
        ],
        requiredName: [(v) => !!v || 'Endpoint name is required'],
        requiredMethod: [(v) => !!v || 'HTTP method is required'],
        requiredService: [(v) => !!v || 'Service is required'],
        requiredVersion: [(v) => !!v || 'Version is required'],
      },
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    isAddMode() {
      return !this.id
    },
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.loadData()
      }
    },
    id(newVal, oldVal) {
      if (newVal !== oldVal && this.show) {
        this.loadData()
      }
    },
  },
  methods: {
    close() {
      this.$emit('close')
      this.resetForm()
    },
    resetForm() {
      this.endpoint = {
        pathPattern: '',
        name: '',
        method: 'GET',
        service: '',
        version: 'v1',
        description: '',
        isActive: false,
        requiresAuth: true,
      }
      this.formValid = false
    },
    loadData() {
      if (this.isAddMode) {
        this.resetForm()
        return
      }

      this.loading = true
      apiGet(`endpoints/${this.id}`, this.accessToken)
        .then((response) => {
          // Handle different response structures
          const data = response.data.data || response.data
          this.endpoint = { ...data }
        })
        .catch((err) => {
          Vue.notify({
            type: 'error',
            text: err.response?.data?.message || 'Failed to load endpoint data',
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    save() {
      if (!this.formValid) return

      this.loading = true
      const payload = { ...this.endpoint }

      const apiCall = this.isAddMode
        ? apiPost('endpoints', payload, this.accessToken)
        : apiPatch(`endpoints/${this.id}`, payload, this.accessToken)

      apiCall
        .then(() => {
          Vue.notify({
            type: 'success',
            text: this.isAddMode ? 'Endpoint created successfully!' : 'Endpoint updated successfully!',
          })
          this.$emit('refresh')
          this.close()
        })
        .catch((err) => {
          Vue.notify({
            type: 'error',
            text: err.response?.data?.message || 'Failed to save endpoint',
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
  },
}
</script>
