<template>
  <div>
    <v-overlay v-model="isLoading">
      <LoadingBeaker :loading-percentage="value"></LoadingBeaker>
      <h2>{{ title }}</h2>
      <br />
      <h3>{{ subtitle }}</h3>
    </v-overlay>
  </div>
</template>

<script>
import EventBus from '@/lib/event-bus'
import LoadingBeaker from './LoadingBeaker'
import _ from 'lodash'
import { mapActions } from 'vuex/dist/vuex.common.js'

export default {
  name: 'LoadingOverlay',
  components: { LoadingBeaker },
  mounted() {
    this.loaders = []
    this.setAppLoading(this.isLoading)
    EventBus.$on('LOADING', this.handleLoaderEvent)
  },
  beforeDestroy() {
    EventBus.$off('LOADING', this.handleLoaderEvent)
  },
  computed: {
    activeLoaders() {
      return _.filter(this.loaders, (l) => l.isLoading)
    },
    isLoading() {
      return this.activeLoaders.length > 0
    },
    currentLoader() {
      let loader = _.find(this.activeLoaders, (l) => _.isNumber(l.total) && _.isNumber(l.progress))
      if (!loader) {
        loader = _.first(this.activeLoaders)
      }
      return loader
    },
    isIndeterminate() {
      return !this.value
    },
  },
  watch: {
    isLoading(newVal) {
      this.setAppLoading(newVal)
    },
  },
  data() {
    return {
      loaders: [],
      value: null,
      total: null,
      title: ' ',
      subtitle: ' ',
    }
  },
  methods: {
    ...mapActions('globalOptions', ['setAppLoading']),
    update() {
      if (this.currentLoader) {
        this.title = this.currentLoader.title || ' '
        this.subtitle = this.currentLoader.subtitle || ' '
        if (this.currentLoader.total) {
          this.total = this.currentLoader.total
          if (this.currentLoader.progress) {
            this.value = Math.round((this.currentLoader.progress / this.total) * 100)
          } else {
            this.value = null
          }
        } else {
          this.total = null
          this.value = null
        }
      } else {
        this.total = null
        this.value = null
      }
    },
    handleLoaderEvent(event) {
      let loader = _.find(this.loaders, { name: event.name })
      if (!loader) {
        this.loaders.push(event)
      } else {
        Object.assign(loader, event)
        if (loader.isLoading === false) {
          _.remove(this.loaders, { name: event.name })
        }
      }
      this.update()
    },
  },
}
</script>
