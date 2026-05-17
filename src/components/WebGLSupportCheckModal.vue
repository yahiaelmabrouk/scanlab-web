<template>
  <v-dialog v-model="openWebGlDialog" persistent width="50%">
    <v-card>
      <v-card-title class="headline">
        {{ $t('global.check_webgl_title', languageCode) }}
      </v-card-title>
      <v-card-text>
        {{ $t('global.check_webgl_description', languageCode) }}
      </v-card-text>
      <v-card-text>
        <a target="_blank" href="https://get.webgl.org/">https://get.webgl.org/</a>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn href="https://get.webgl.org/" target="_blank" color="success">{{
          $t('global.continue', languageCode)
        }}</v-btn>
        <v-btn color="error" @click="openWebGlDialog = false">{{ $t('global.close', languageCode) }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'WebGLSupportCheckModal',
  data() {
    return {
      openWebGlDialog: false,
    }
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
  },
  mounted() {
    this.openWebGlDialog = this.checkWebGL()
  },
  methods: {
    // check webGL support
    checkWebGL() {
      try {
        let canvas = document.createElement('canvas')
        let test =
          !!window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        return test instanceof WebGLRenderingContext ? false : true
      } catch (e) {
        return true
      }
    },
  },
}
</script>
