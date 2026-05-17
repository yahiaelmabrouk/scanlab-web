import log from 'loglevel'
// Set Log level first so other imports immediately use it
// log.setLevel('trace')
// log.setLevel('debug')
log.setLevel('info')

import Vue from 'vue'
import * as THREE from 'three'
import App from './App.vue'
import router from './router'
import { store } from './store/store'
import i18n from './i18n'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import BootstrapVue from 'bootstrap-vue/dist/bootstrap-vue.min'
import ShortKey from 'vue-shortkey'
import Notifications from 'vue-notification'
import PrettyCheckbox from 'pretty-checkbox-vue'
import HighchartsVue from 'highcharts-vue'
import HighCharts from 'highcharts'
import heatmap from 'highcharts/modules/heatmap'
import bellcurve from 'highcharts/modules/histogram-bellcurve'
import regression from 'highcharts-regression'
import TextHighlight from 'vue-text-highlight'

// Add custom Highcharts SVG symbol
// cross symbol
HighCharts.SVGRenderer.prototype.symbols.cross = function (x, y, w, h) {
  return ['M', x, y, 'L', x + w, y + h, 'M', x + w, y, 'L', x, y + h, 'z']
}

heatmap(HighCharts)
bellcurve(HighCharts)
regression(HighCharts)

// Styles
import './styles/_bootstrap_custom.scss'
import 'icons/styles.css'

// AMI requires THREE to be defined globally on window
window.THREE = THREE

Vue.use(BootstrapVue)
Vue.use(Notifications)
Vue.use(ShortKey, { prevent: ['input', 'textarea'] })
Vue.use(Vuetify)
Vue.use(HighchartsVue)

Vue.use(PrettyCheckbox)
Vue.component('TextHighlight', TextHighlight)

Vue.config.productionTip = false

store.dispatch('onInit')

new Vue({
  i18n,
  router,
  store,
  vuetify: new Vuetify({
    theme: {
      themes: {
        light: {
          primary: '#247ba0',
          secondary: '#3a9989',
          accent: '#ff1654',
          error: '#d31246',
          info: '#2cc8eb',
          success: '#03b5aa',
          warning: '#f9ac34',
          black: '#071920',
          white: '#fffef9',
          lightBlue: '#2cc8eb',
          darkBlue: '#074874',
          buttonBlue: '#1692ae',
          buttonSecondary: '#125471',
        },
      },
    },
  }),
  created() {
    // this.$store.dispatch('onCreated')
  },
  render: (h) => h(App),
}).$mount('#app')
