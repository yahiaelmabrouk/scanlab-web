<template>
  <div style="padding: 10px; min-height: 78vh">
    <v-row>
      <v-col cols="12">
        <div class="mt-10 mb-10">
          <h2>{{ $t('global.manage_resources') }}</h2>
        </div>
      </v-col>
      <v-col cols="12" class="d-flex justify-end align-items-center gap-2 pt-0 mt-0">
        <v-btn color="primary" to="/manage-resource-categories">{{ $t('global.manage_category') }}</v-btn>
        <v-btn
          color="primary"
          @click="
            slectedId = null
            showPopup = true
          "
          >{{ $t('global.add_resource') }}</v-btn
        >
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-tabs v-model="activeTab" show-arrows>
          <v-tab v-for="category in resourceCategories" :key="category.id">
            {{ category.name }}
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>
    <v-row>
      <table class="table table-striped table-bordered resources-table">
        <colgroup>
          <col class="col-title" />
          <col class="col-category" />
          <col class="col-type" />
          <col class="col-language" />
          <col class="col-description" />
          <col class="col-url" />
          <col class="col-path" />
          <col class="col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th>{{ $t('global.resource_title') }}</th>
            <th>{{ $t('global.resource_category') }}</th>
            <th>{{ $t('global.resource_type') }}</th>
            <th>{{ $t('global.resource_language') }}</th>
            <th>{{ $t('global.resource_description') }}</th>
            <th>{{ $t('global.resource_url') }}</th>
            <th>{{ $t('global.resource_path') }}</th>
            <th>{{ $t('global.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredResources.length === 0">
            <td colspan="8">{{ $t('global.no_data') }}</td>
          </tr>
          <tr v-for="(resource, index) in filteredResources" :key="resource.id">
            <td>{{ resource.title }}</td>
            <td>{{ getCategoryText(resource.categoryId) }}</td>
            <td>{{ getTypeText(resource.type) }}</td>
            <td>{{ getLanguageText(resource.language) }}</td>
            <td>{{ resource.description }}</td>
            <td>{{ resource.url }}</td>
            <td>{{ resource.path }}</td>
            <td>
              <v-btn
                icon
                :disabled="reorderLoading || index === 0"
                @click="moveResource(resource, -1)"
              >
                <v-icon small>mdi-chevron-up</v-icon>
              </v-btn>
              <v-btn
                icon
                :disabled="reorderLoading || index === filteredResources.length - 1"
                @click="moveResource(resource, 1)"
              >
                <v-icon small>mdi-chevron-down</v-icon>
              </v-btn>
              <v-btn
                color="primary"
                text
                @click="
                  slectedId = resource.id
                  showPopup = true
                "
                >{{ $t('global.edit') }}</v-btn
              >
              <v-btn color="error" text @click="deleteResource(resource.id)">{{ $t('global.delete') }}</v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </v-row>
    <PopupAddEditResource :show="showPopup" :id="slectedId" @close="showPopup = false" @refresh="refresh" />
    <v-dialog v-model="isDeleteModalOpen" width="700px">
      <v-card outlined>
        <v-card-title>
          <span class="headline">
            {{ $t('global.delete_resource', languageCode) }}
          </span>
        </v-card-title>

        <v-card-text>
          <span>
            {{ $t('global.are_you_sure_delete_resource', languageCode) }}
          </span>
        </v-card-text>

        <v-card-actions class="right">
          <v-spacer></v-spacer>
          <v-btn :loading="deleteLoading" :disabled="deleteLoading" outlined @click="isDeleteModalOpen = false">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn :loading="deleteLoading" :disabled="deleteLoading" color="error" @click="deleteSelectedResource">
            {{ $t('global.delete', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import PopupAddEditResource from '../../components/PopupAddEditResource.vue'
import { apiDelete, apiGet, apiPut } from '../../util/api'
import { mapActions, mapState } from 'vuex'
import { RESOURCE_TYPE_OPTIONS } from '../../constants'
import Vue from 'vue'
import { allLanguages } from '@/util/languages'

export default {
  name: 'ManageResources',
  components: {
    PopupAddEditResource,
  },
  data() {
    return {
      resources: [],
      showPopup: false,
      slectedId: null,
      RESOURCE_TYPE_OPTIONS,
      isDeleteModalOpen: false,
      loading: false,
      deleteLoading: false,
      activeTab: 0,
      reorderLoading: false,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('user', ['languageCode']),
    ...mapState('resourceService', ['resourceCategories']),
    activeCategoryId() {
      return this.resourceCategories[this.activeTab]?.id || null
    },
    filteredResources() {
      if (!this.activeCategoryId) {
        return []
      }

      return this.resources
        .filter((resource) => resource.categoryId === this.activeCategoryId)
        .slice()
        .sort((a, b) => {
          const orderA = Number.isFinite(a.sortOrder) ? a.sortOrder : 0
          const orderB = Number.isFinite(b.sortOrder) ? b.sortOrder : 0

          if (orderA !== orderB) {
            return orderA - orderB
          }

          return a.id - b.id
        })
    },
  },
  watch: {
    resourceCategories(categories) {
      if (!categories.length) {
        this.activeTab = 0
        return
      }

      if (this.activeTab >= categories.length) {
        this.activeTab = 0
      }
    },
  },
  mounted() {
    this.refresh()
    this.loadAllResourceCategories()
  },
  methods: {
    ...mapActions('resourceService', ['loadAllResourceCategories']),
    refresh() {
      this.showPopup = false
      this.loading = true

      apiGet('resources/all', this.accessToken)
        .then((response) => {
          this.resources = response.data.data
        })
        .catch(() => {
          Vue.notify({
            type: 'error',
            text: 'Failed to load resources.',
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    async moveResource(resource, direction) {
      if (!this.activeCategoryId) {
        return
      }

      const orderedResources = this.filteredResources
      const currentIndex = orderedResources.findIndex((item) => item.id === resource.id)
      const nextIndex = currentIndex + direction

      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= orderedResources.length) {
        return
      }

      const reordered = orderedResources.slice()
      const [moved] = reordered.splice(currentIndex, 1)
      reordered.splice(nextIndex, 0, moved)

      const updatedOrder = new Map()
      reordered.forEach((item, index) => {
        updatedOrder.set(item.id, index + 1)
      })

      this.resources = this.resources.map((item) => {
        if (updatedOrder.has(item.id)) {
          return { ...item, sortOrder: updatedOrder.get(item.id) }
        }
        return item
      })

      await this.saveResourceOrder(reordered.map((item) => item.id))
    },
    async saveResourceOrder(resourceIds) {
      this.reorderLoading = true
      try {
        await apiPut(
          'resources/reorder',
          {},
          {
            categoryId: this.activeCategoryId,
            resourceIds,
          },
          this.accessToken
        )
      } catch (error) {
        this.refresh()
        Vue.notify({
          type: 'error',
          text: error?.response?.data?.message || 'Failed to update resource order.',
        })
      } finally {
        this.reorderLoading = false
      }
    },
    getCategoryText(category) {
      return this.resourceCategories.find((item) => item.id === category)?.name
    },
    getTypeText(type) {
      return this.RESOURCE_TYPE_OPTIONS.find((item) => item.value === type)?.text
    },
    deleteResource(id) {
      this.slectedId = id
      this.isDeleteModalOpen = true
    },
    deleteSelectedResource() {
      this.deleteLoading = true
      apiDelete(`resources/${this.slectedId}`, this.accessToken)
        .then(() => {
          this.refresh()
          this.isDeleteModalOpen = false
          Vue.notify({
            type: 'success',
            text: 'Successfully!',
          })
        })
        .catch((err) => {
          Vue.notify({
            type: 'error',
            text: err.response.data.message,
          })
        })
        .finally(() => {
          this.deleteLoading = false
        })
    },
    getLanguageText(language) {
      return allLanguages.find((item) => item.code === language)?.name
    },
  },
}
</script>
<style lang="scss" scoped>
.gap-2 {
  gap: 10px;
}
.resources-table {
  table-layout: fixed;
  width: 100%;
}
.resources-table th,
.resources-table td {
  vertical-align: top;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.resources-table col.col-title {
  width: 12%;
}
.resources-table col.col-category {
  width: 10.8%;
}
.resources-table col.col-type {
  width: 7.2%;
}
.resources-table col.col-language {
  width: 8%;
}
.resources-table col.col-description {
  width: 26.2%;
}
.resources-table col.col-url {
  width: 19.8%;
}
.resources-table col.col-path {
  width: 8%;
}
.resources-table col.col-actions {
  width: 8%;
}
</style>
