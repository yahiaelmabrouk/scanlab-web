<template>
  <div>
    <h3>{{ $t('ApiKeys.api_keys', languageCode) }}</h3>
    <v-row>
      <v-col>
        <v-form @submit.prevent="generateApiKey()" class="form">
          <v-row>
            <v-col cols="8">
              <v-text-field
                v-model="newApiKeyName"
                :label="$t('ApiKeys.api_key_name', languageCode)"
                placeholder="Enter API key name"
                required
              />
            </v-col>
            <v-col cols="4">
              <v-btn type="submit" color="success" class="align-self-center">
                {{ $t('global.generate', languageCode) }} {{ $t('ApiKeys.api_key', languageCode) }}
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>
    <v-row v-if="cohortApiKeys.length > 0">
      <v-col>
        <v-data-table :headers="apiKeyHeaders" :items="cohortApiKeys" class="elevation-1" :items-per-page="10">
          <template v-slot:item.keyPrefix="{ item }">
            <code>{{ item.keyPrefix }}...</code>
          </template>
          <template v-slot:item.isActive="{ item }">
            <v-chip :color="item.isActive ? 'success' : 'error'" small>
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </v-chip>
          </template>
          <template v-slot:item.expiresAt="{ item }">
            {{ item.expiresAt ? formatDate(item.expiresAt) : 'Never' }}
          </template>
          <template v-slot:item.lastUsedAt="{ item }">
            {{ item.lastUsedAt ? formatDate(item.lastUsedAt) : 'Never' }}
          </template>
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              :color="item.isActive ? 'warning' : 'success'"
              small
              icon
              class="mr-1"
              @click="toggleApiKeyStatus(item.id, item.name, item.isActive)"
              :title="item.isActive ? $t('global.deactivate', languageCode) : $t('global.activate', languageCode)"
            >
              <v-icon small>{{ item.isActive ? 'mdi-pause' : 'mdi-play' }}</v-icon>
            </v-btn>
            <v-btn
              color="primary"
              small
              icon
              class="mr-1"
              @click="regenerateApiKey(item.id, item.name)"
              :title="$t('global.regenerate', languageCode)"
            >
              <v-icon small>mdi-refresh</v-icon>
            </v-btn>
            <v-btn
              color="error"
              small
              icon
              @click="deleteApiKey(item.id, item.name)"
              :title="$t('global.delete', languageCode)"
            >
              <v-icon small>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col>
        <p>{{ $t('ApiKeys.no_api_keys', languageCode) }}</p>
      </v-col>
    </v-row>

    <!-- Instructions Section -->
    <v-divider class="my-6"></v-divider>
    <v-row>
      <v-col>
        <h4 class="mb-3">{{ $t('ApiKeys.instructions', languageCode) }}</h4>
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-header>
              <strong>{{ $t('ApiKeys.how_to_use', languageCode) }}</strong>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <div class="mt-3">
                <p class="mb-3">{{ $t('ApiKeys.auth_header', languageCode) }}</p>

                <v-card class="mb-4" outlined>
                  <v-card-text>
                    <pre class="code-block">X-API-Key: YOUR_API_KEY_HERE</pre>
                  </v-card-text>
                </v-card>

                <h5 class="mb-2">{{ $t('ApiKeys.example_request', languageCode) }}</h5>
                <v-card outlined>
                  <v-card-text>
                    <pre class="code-block">
curl -X GET \
  https://api.scanlabmr.com/v1/cohorts/123/students \
  -H "X-API-Key: slk_1234567890abcdef..." \
  -H "Content-Type: application/json"</pre
                    >
                  </v-card-text>
                </v-card>

                <h5 class="mt-4 mb-2">{{ $t('ApiKeys.base_url', languageCode) }}</h5>
                <v-card outlined>
                  <v-card-text>
                    <code>https://api.scanlabmr.com</code>
                  </v-card-text>
                </v-card>

                <h5 class="mt-4 mb-2">{{ $t('ApiKeys.important_notes', languageCode) }}</h5>
                <v-list dense class="notes-list">
                  <v-list-item>
                    <v-list-item-icon class="aligned-icon">
                      <v-icon color="warning">mdi-shield-lock</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>{{ $t('ApiKeys.note_secure', languageCode) }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon class="aligned-icon">
                      <v-icon color="success">mdi-lock</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>{{ $t('ApiKeys.note_https', languageCode) }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon class="aligned-icon">
                      <v-icon color="info">mdi-calendar-clock</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>{{ $t('ApiKeys.note_expires', languageCode) }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon class="aligned-icon">
                      <v-icon color="error">mdi-delete</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>{{ $t('ApiKeys.note_deactivate', languageCode) }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </div>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <!-- API Key Display Modal -->
    <v-dialog v-model="showApiKeyDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="text-h5">
          {{ $t('ApiKeys.api_key_created', languageCode) }}
        </v-card-title>
        <v-card-text>
          <v-alert type="warning" class="mb-4">
            {{ $t('ApiKeys.api_key_warning', languageCode) }}
          </v-alert>
          <v-row>
            <v-col>
              <strong>{{ $t('ApiKeys.api_key_name', languageCode) }}:</strong>
              <p>{{ createdApiKey.name }}</p>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <strong>{{ $t('ApiKeys.api_key', languageCode) }}:</strong>
              <v-text-field
                :value="createdApiKey.fullKey"
                readonly
                outlined
                class="mt-2"
                append-icon="mdi-content-copy"
                @click:append="copyToClipboard(createdApiKey.fullKey)"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="closeApiKeyDialog">
            {{ $t('global.close', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Modal -->
    <v-dialog v-model="showDeleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">
          {{ $t('global.confirm_delete', languageCode) }}
        </v-card-title>
        <v-card-text>
          <p>
            {{ $t('ApiKeys.delete_api_key_confirm', languageCode) }} <strong>"{{ apiKeyToDelete.name }}"</strong>?
          </p>
          <v-alert type="warning" class="mt-3">
            {{ $t('ApiKeys.delete_api_key_warning', languageCode) }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="cancelDelete">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="error" @click="confirmDelete">
            {{ $t('global.delete', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Regenerate Confirmation Modal -->
    <v-dialog v-model="showRegenerateDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">
          {{ $t('global.confirm_regenerate', languageCode) }}
        </v-card-title>
        <v-card-text>
          <p>
            {{ $t('ApiKeys.regenerate_api_key_confirm', languageCode) }}
            <strong>"{{ apiKeyToRegenerate.name }}"</strong>?
          </p>
          <v-alert type="warning" class="mt-3">
            {{ $t('ApiKeys.regenerate_api_key_warning', languageCode) }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="cancelRegenerate">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="primary" @click="confirmRegenerate">
            {{ $t('global.regenerate', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { apiGet, apiPost, apiPatch, apiDelete } from '../util/api'

export default {
  name: 'ApiKeyManager',
  props: {
    cohortId: {
      type: [String, Number],
      required: true,
    },
  },
  data() {
    return {
      cohortApiKeys: [],
      newApiKeyName: '',
      showApiKeyDialog: false,
      createdApiKey: {},
      showDeleteDialog: false,
      apiKeyToDelete: {},
      showRegenerateDialog: false,
      apiKeyToRegenerate: {},
      apiKeyHeaders: [
        {
          text: 'Name',
          value: 'name',
          align: 'start',
          sortable: true,
        },
        {
          text: 'Key Prefix',
          value: 'keyPrefix',
          align: 'start',
          sortable: false,
        },
        {
          text: 'Status',
          value: 'isActive',
          align: 'center',
          sortable: true,
        },
        {
          text: 'Expires',
          value: 'expiresAt',
          align: 'start',
          sortable: true,
        },
        {
          text: 'Last Used',
          value: 'lastUsedAt',
          align: 'start',
          sortable: true,
        },
        {
          text: 'Created',
          value: 'createdAt',
          align: 'start',
          sortable: true,
        },
        {
          text: 'Actions',
          value: 'actions',
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
    this.loadCohortApiKeys()
  },
  methods: {
    async loadCohortApiKeys() {
      try {
        const response = await apiGet(`cohorts/${this.cohortId}/api-keys`, this.accessToken)
        if (response.data && response.data.success) {
          this.cohortApiKeys = response.data.data
        } else {
          this.$notify({ type: 'error', text: 'Failed to load API keys' })
        }
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to load API keys' })
      }
    },
    async generateApiKey() {
      if (!this.newApiKeyName || this.newApiKeyName.trim() === '') {
        this.$notify({ type: 'error', text: 'Please enter a name for the API key' })
        return
      }

      try {
        const expirationDate = new Date()
        expirationDate.setFullYear(expirationDate.getFullYear() + 1)

        const requestBody = {
          name: this.newApiKeyName.trim(),
          expiresAt: expirationDate.toISOString(),
        }

        const response = await apiPost(`cohorts/${this.cohortId}/api-keys`, requestBody, this.accessToken)
        if (response.data && response.data.success) {
          this.createdApiKey = response.data.data
          this.showApiKeyDialog = true
          this.newApiKeyName = ''
          this.loadCohortApiKeys()
        } else {
          this.$notify({ type: 'error', text: 'Failed to generate API key' })
        }
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to generate API key' })
      }
    },
    deleteApiKey(apiKeyId, apiKeyName) {
      this.apiKeyToDelete = { id: apiKeyId, name: apiKeyName }
      this.showDeleteDialog = true
    },
    async confirmDelete() {
      try {
        const response = await apiDelete(`api-keys/${this.apiKeyToDelete.id}`, this.accessToken)
        if (response.data && response.data.success) {
          this.$notify({ type: 'success', text: 'API key deleted successfully' })
          this.loadCohortApiKeys()
        } else {
          this.$notify({ type: 'error', text: 'Failed to delete API key' })
        }
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to delete API key' })
      }
      this.cancelDelete()
    },
    cancelDelete() {
      this.showDeleteDialog = false
      this.apiKeyToDelete = {}
    },
    regenerateApiKey(apiKeyId, apiKeyName) {
      this.apiKeyToRegenerate = { id: apiKeyId, name: apiKeyName }
      this.showRegenerateDialog = true
    },
    async confirmRegenerate() {
      try {
        const response = await apiPost(`api-keys/${this.apiKeyToRegenerate.id}/regenerate`, {}, this.accessToken)
        if (response.data && response.data.success) {
          this.createdApiKey = response.data.data
          this.showApiKeyDialog = true
          this.loadCohortApiKeys()
        } else {
          this.$notify({ type: 'error', text: 'Failed to regenerate API key' })
        }
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to regenerate API key' })
      }
      this.cancelRegenerate()
    },
    cancelRegenerate() {
      this.showRegenerateDialog = false
      this.apiKeyToRegenerate = {}
    },
    async toggleApiKeyStatus(apiKeyId, apiKeyName, isCurrentlyActive) {
      const action = isCurrentlyActive ? 'deactivate' : 'activate'
      const actionText = isCurrentlyActive ? 'deactivated' : 'activated'

      try {
        const response = await apiPatch(`api-keys/${apiKeyId}/${action}`, {}, this.accessToken)
        if (response.data && response.data.success) {
          this.$notify({ type: 'success', text: `API key "${apiKeyName}" ${actionText} successfully` })
          this.loadCohortApiKeys()
        } else {
          this.$notify({ type: 'error', text: `Failed to ${action} API key` })
        }
      } catch (error) {
        this.$notify({ type: 'error', text: `Failed to ${action} API key` })
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    closeApiKeyDialog() {
      this.showApiKeyDialog = false
      this.createdApiKey = {}
    },
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text)
        this.$notify({ type: 'success', text: 'API key copied to clipboard' })
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to copy to clipboard' })
      }
    },
  },
}
</script>

<style scoped lang="scss">
.form {
  width: 100%;
}

.code-block {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.notes-list {
  max-width: 400px;
  margin: 0 auto;

  .v-list-item {
    align-items: flex-start;
    padding-left: 0 !important;
  }

  .aligned-icon {
    margin-right: 16px !important;
    min-width: 20px !important;
    width: 20px !important;
    margin-top: 0 !important;
  }

  .v-list-item__content {
    align-self: flex-start;
    padding: 0 !important;
    margin-left: 0 !important;
  }

  .v-list-item__title {
    line-height: 24px;
    align-self: flex-start;
    text-align: left !important;
  }
}
</style>
