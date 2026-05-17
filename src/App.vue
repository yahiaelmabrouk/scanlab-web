<template>
  <div id="app" @mouseleave="mouseLeave" @mouseup="mouseUp">
    <v-app>
      <NavBar />
      <LoadingOverlay />
      <LoadingDots />
      <router-view />
      <FullscreenSlice />
      <notifications position="bottom right" />
      <footer class="footer-wrapper">
        <Footer />
      </footer>
    </v-app>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import NavBar from './components/NavBar'
import FullscreenSlice from './components/FullscreenSlice'
import Footer from './components/Footer'
import LoadingOverlay from './components/LoadingOverlay'
import EventBus from '@/lib/event-bus'
import LoadingDots from './components/LoadingDots.vue'
import config from './config'

export default {
  data() {
    return {
      isMainScreenVisible: false, // Initially, MainScreen is not visible
    }
  },
  components: { NavBar, FullscreenSlice, Footer, LoadingOverlay, LoadingDots },
  methods: {
    ...mapActions('translatedContent', ['updateI18nMessages', 'loadLocalTranslateContent', 'getAllLanguageOptions']),
    ...mapActions('apiHealthService', ['startCheckHealth']),
    mouseLeave() {
      EventBus.$emit('mouseOutsideOfApp')
    },
    mouseUp(event) {
      EventBus.$emit('mouseButtonUp', event)
    },
    onStartCheckHealth() {
      this.startCheckHealth()
    },
  },
  mounted() {
    EventBus.$on('mainScreenVisible', (isVisible) => {
      this.isMainScreenVisible = isVisible
    })
    this.loadLocalTranslateContent()
    this.updateI18nMessages({})
    this.getAllLanguageOptions()
    this.startCheckHealth()

    if (config.isCTLab) {
      document.title = 'ScanlabCT'
    } else {
      document.title = 'ScanlabMR'
    }

    window.addEventListener('online', this.onStartCheckHealth)
    window.addEventListener('offline', this.onStartCheckHealth)
  },
  beforeDestroy() {
    window.removeEventListener('online', this.onStartCheckHealth)
    window.removeEventListener('offline', this.onStartCheckHealth)
  },
  computed: {
    ...mapGetters('user', ['softwareVendorPreference', 'softwareVersionPreference']),
    ...mapGetters('scanTimeConfig', [
      'getAutoAlignOptions',
      'getSelectedAutoAlign',
      'getLocalSoftwareVersionPreference',
    ]),

    localSoftwareVersionPreference() {
      return this.getLocalSoftwareVersionPreference
    },
    footerWrapperClass() {
      return {
        'footer-wrapper': true,
        'main-screen-visible': this.isMainScreenVisible,
        'b19-version': this.localSoftwareVersionPreference === 'b19',
        'xa-version': this.localSoftwareVersionPreference === 'xa',
        'r57-version': this.localSoftwareVersionPreference === 'r57',
      }
    },
  },
}
</script>

<style lang="scss">
* {
  box-sizing: border-box;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background-color: $bg-gray2;
}

#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

// .footer-wrapper {
//   margin-top: 27vmin;
// }

.xa-version.footer-wrapper {
  margin-top: 9vmin !important;
}
// .b19-version.footer-wrapper {
//   margin-top: 23vmin !important;
// }
.r57-version.footer-wrapper {
  margin-top: 10vmin !important;
}

.clickable {
  cursor: pointer;
}

.hidden {
  visibility: hidden;
}

// bootstrap modal hack
body {
  padding-right: 0px !important;
}

.flex-auto {
  flex: auto;
}

.footer-wrapper {
  margin-top: auto;
}
</style>
