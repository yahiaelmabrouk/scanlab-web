<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-footer color="lightBlue" padless class="">
    <v-row justify="center" no-gutters>
      <v-col cols="12">
        <v-row>
          <v-col class="flex-auto">
            <v-row justify="center" no-gutters>
              <a
                v-if="!isProduction && (isCTLab || isVetMR)"
                href="?scanlabMode=mr"
                class="my-2 v-btn v-btn--rounded v-btn--router v-btn--text theme--light v-size--default brown--text"
              >
                MR
              </a>
              <a
                v-if="!isProduction && !isCTLab"
                href="?scanlabMode=ct"
                class="my-2 v-btn v-btn--rounded v-btn--router v-btn--text theme--light v-size--default brown--text"
              >
                CT
              </a>
              <v-btn color="black" text rounded class="my-2" target="_blank" to="/terms-and-conditions">
                {{ $t('global.terms_and_conditions') }}
              </v-btn>
              <v-btn color="black" text rounded class="my-2" target="_blank" to="/privacy">
                {{ $t('global.privacy_policy') }}
              </v-btn>
              <v-btn color="black" text rounded class="my-2" target="_blank" href="https://scanlabmr.com/faqs/">
                {{ $t('global.faq') }}
              </v-btn>
            </v-row>
          </v-col>
          <v-col class="text-right flex-grow-0">
            <div class="api-health-container">
              <div class="api-health-item">
                {{ $t('global.api') }}
                <v-icon md :color="apiHealth ? '#00ff00' : '#ff0000'">{{
                  apiHealth ? 'mdi-wifi' : 'mdi-wifi-off'
                }}</v-icon>
              </div>
              <div class="api-health-item">
                {{ $t('global.cruncher') }}
                <v-icon md :color="cruncherHealth ? '#00ff00' : '#ff0000'">{{
                  cruncherHealth ? 'mdi-wifi' : 'mdi-wifi-off'
                }}</v-icon>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-col>
      <v-col class="darkBlue py-4 text-center white--text" cols="12">
        <!-- eslint-disable vue-i18n/no-raw-text -->
        &copy;{{ new Date().getFullYear() }} —
        <strong>{{ appName }}&trade;U.S. Patent: 1 569224. 1 00IJS2, Application: 19/345,824 </strong>
        <!-- No translation as this is the company name -->
      </v-col>
    </v-row>
  </v-footer>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import config from '../config'

const { isProduction, isCTLab, isVetMR } = config

export default {
  name: 'Footer',
  components: {},
  props: {},
  data() {
    return {
      isProduction,
      isCTLab,
      isVetMR,
    }
  },
  computed: {
    ...mapGetters('authentication', ['appName']),
    ...mapState('apiHealthService', ['apiHealth', 'cruncherHealth']),
  },
}
</script>
<style lang="scss" scoped>
.api-health-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
  flex-wrap: nowrap;
  column-gap: 10px;
  row-gap: 5px;
  .api-health-item {
    font-size: 18px;
    white-space: nowrap;
    display: flex;
    align-items: start;
    column-gap: 10px;
    margin-right: 10px;
  }
}
</style>
