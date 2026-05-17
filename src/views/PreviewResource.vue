<template>
  <div style="padding: 10px" ref="container">
    <v-row>
      <v-col cols="12">
        <div class="mt-2 mb-2">
          <h2>{{ $t('global.preview_resource') }}</h2>
        </div>
      </v-col>
      <v-col cols="12" v-if="isPdf" style="height: 100vh; z-index: 1">
        <vue-pdf-app :pdf="path"></vue-pdf-app>
      </v-col>
      <v-col cols="12" v-else-if="isVideo" style="z-index: 1">
        <div class="d-flex justify-content-center" style="height: 80vh; width: 100%">
          <video width="80%" height="100%" controls :src="path" style="background-color: black"></video>
        </div>
      </v-col>
      <v-col cols="12" v-else style="height: 100vh; z-index: 1">
        <span @click="handleDowload" style="cursor: pointer">{{ `Click this url to dowload the resource` }}</span>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import VuePdfApp from 'vue-pdf-app'
import 'vue-pdf-app/dist/icons/main.css'

export default {
  name: 'PreviewResource',
  components: { VuePdfApp },
  data() {
    return {
      path: '',
      pathKey: '',
    }
  },
  computed: {
    isPdf() {
      return this.pathKey.endsWith('.pdf')
    },
    isVideo() {
      return this.pathKey.endsWith('.mp4')
    },
    isOther() {
      return !this.isPdf && !this.isVideo
    },
  },
  mounted() {
    this.path = this.$route.query.path
    this.pathKey = this.$route.query.pathKey
  },
  methods: {
    handleDowload() {
      window.open(this.path, '_blank').focus()
    },
  },
}
</script>
<style lang="scss" scoped></style>
