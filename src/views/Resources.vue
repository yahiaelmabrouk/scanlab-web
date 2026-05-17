<template>
  <div style="padding: 10px; min-height: 78vh">
    <v-row>
      <v-col cols="12">
        <div class="mt-10 mb-10">
          <h2>{{ categoryName || $t('global.resources') }}</h2>
        </div>
      </v-col>
      <v-col cols="12">
        <v-row class="px-10 text-left" v-if="hasResources">
          <v-col v-for="group in groupResources" :key="group[0]" cols="12">
            <!-- <h3>{{ getCategoryText(group[0]) }}</h3> -->
            <v-row>
              <v-col cols="4">
                <h3>{{ $t('global.title') }}</h3>
              </v-col>
              <v-col cols="4">
                <h3>{{ $t('global.description') }}</h3>
              </v-col>
            </v-row>
            <v-row v-for="resource in group[1]" :key="resource.id" class="mt-1">
              <v-col cols="4">
                <span class="resource-title" @click="onResourceClick(resource)">
                  {{ resource.title }}
                </span>
              </v-col>
              <v-col cols="8">
                {{ resource.description }}
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row class="px-10 text-left" v-else>
          <v-col cols="12">
            <h3>{{ $t('global.no_data') }}</h3>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import { apiGet } from '../util/api'
import { RESOURCE_TYPES } from '../constants'
import _ from 'lodash'
export default {
  name: 'Resources',
  data() {
    return {
      resources: [],
      categoryName: '',
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapGetters('user', ['languageCode']),
    ...mapState('resourceService', ['resourceCategories']),
    hasResources() {
      return this.groupResources?.length > 0
    },
    groupResources() {
      const grouped = this.resources.reduce((acc, resource) => {
        if (!acc[resource.categoryId]) {
          acc[resource.categoryId] = []
        }
        acc[resource.categoryId].push(resource)
        return acc
      }, {})

      Object.values(grouped).forEach((group) => {
        group.sort((a, b) => {
          const orderA = Number.isFinite(a.sortOrder) ? a.sortOrder : 0
          const orderB = Number.isFinite(b.sortOrder) ? b.sortOrder : 0

          if (orderA !== orderB) {
            return orderA - orderB
          }

          return a.id - b.id
        })
      })

      const data = Object.entries(grouped)

      return data.filter((group) => group[0] != 'undefined' && group[0] != 'null')
    },
  },
  watch: {
    $route() {
      this.getResources()
      this.categoryName = this.getCategoryText(this.$route.query.category)
    },
    languageCode() {
      this.getResources()
    },
  },
  mounted() {
    this.getResources()
    this.loadAllResourceCategories()
    this.categoryName = this.getCategoryText(this.$route.query.category)
  },
  methods: {
    ...mapActions('resourceService', ['loadAllResourceCategories']),
    onResourceClick(resource) {
      if (resource.type == RESOURCE_TYPES.LINK) {
        window.open(resource.url, '_self')
      } else {
        const isVideo = resource.pathKey.endsWith('.mp4')
        if (isVideo) {
          this.$router.push({ path: '/resources/preview', query: { path: resource.path, pathKey: resource.pathKey } })
        } else {
          window.open(resource.path, '_self')
        }
      }
    },
    async getResources() {
      try {
        const categoryId = this.$route.query.category
        if (categoryId) {
          const response = await apiGet(
            `resourceCategories?id=${categoryId}&languageCode=${this.languageCode}`,
            this.accessToken
          )
          this.resources = _.get(response, ['data', 'data', 'resources'], [])
          return
        }
        const response = await apiGet(`resources/view`, this.accessToken)
        this.resources = response.data.data
      } catch (error) {
        console.error(error)
      }
    },
    getCategoryText(category) {
      return this.resourceCategories.find((option) => option.id == category)?.name
    },
  },
}
</script>
<style lang="scss" scoped>
.resource-title {
  font-size: 20px;
  font-weight: bold;
  color: #4381be;

  &:hover {
    cursor: pointer;
    text-decoration: underline;
  }
}
</style>
