<!-- eslint-disable vue-i18n/no-v-html -->
<template>
  <v-card flat tile>
    <v-app-bar>
      <router-link to="/">
        <v-toolbar-title class="toolbar-title">
          <img v-if="!isCTLab" class="svg" slot="extra" src="@/assets/svg/scanlab-logo.svg" />
          <img v-else class="logo" slot="extra" src="@/assets/svg/scanlab-logo-ct.png" />
        </v-toolbar-title>
      </router-link>
      <router-link to="/">
        <v-btn text small>
          {{ $t('global.home') }}
        </v-btn>
      </router-link>

      <!-- isManager / isAdmin are saved state, but don't get cleared on log out right now... -->
      <v-btn text class="lightBlue--text" to="/cohorts" v-if="isLoggedIn && isManager">
        {{ $t('global.manage_cohorts') }}
      </v-btn>

      <v-btn text color="green" to="/translate" v-if="(isTranslator || isAdmin) && !isMaintenance">
        {{ $t('global.translate') }}
      </v-btn>

      <v-btn text hidden v-shortkey.once="['ctrl', 'shift', 'alt', 'o']" @shortkey="exportStateToClipboard()"> </v-btn>
      <v-btn text hidden v-shortkey.once="['ctrl', 'shift', 'alt', 'p']" @shortkey="importStateFromClipboard()">
      </v-btn>

      <v-spacer></v-spacer>

      <v-menu class="nav-menu-dropdown" bottom left v-if="isLoggedIn">
        <template #activator="{ on }">
          <v-btn text small v-on="on" color="primary">
            {{ $t('global.resources') }}
            <v-icon small>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-if="isCTLab"
            href="https://www.calculator.net/bmi-calculator.html"
            :active="false"
            active-class="v-list-item--no-highlight"
            target="_blank"
          >
            <v-list-item-title>{{ $t('global.bmi_calculator', languageCode) }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="isCTLab"
            href="#"
            :active="false"
            active-class="v-list-item--no-highlight"
            target="_blank"
            to="/weight-based-dose"
          >
            <v-list-item-title>{{ $t('global.weight_based_dose_chart', languageCode) }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-for="item in resourceCategories"
            :key="item.id"
            href="#"
            :active="false"
            active-class="v-list-item--no-highlight"
            target="_blank"
            :to="`/resources?category=${item.id}`"
          >
            <v-list-item-title>{{
              $te(`global.${item.name}`, languageCode) ? $t(`global.${item.name}`, languageCode) : item.name
            }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-dialog v-model="languageSwitcherDialog" max-width="400">
        <template #activator="{ on }">
          <v-btn text v-on="on">
            <img :src="getLanguageFlag(currentLanguage)" style="max-width: 32px; max-height: 21px" />
          </v-btn>
        </template>
        <v-card>
          <v-card-title class="headline">{{ $t('global.change_language') }}</v-card-title>

          <v-col>
            <v-text-field
              solo
              rounded
              clearable
              autofocus
              :label="$t('global.search_languages')"
              prepend-inner-icon="mdi-magnify"
              v-model="languageSearch"
            ></v-text-field>
          </v-col>

          <v-list v-if="filteredLanguages.length">
            <v-list-item-group color="primary">
              <v-list-item v-for="language in filteredLanguages" :key="language.code" @click="changeLanguage(language)">
                <v-list-item-avatar>
                  <v-img :src="getLanguageFlag(language)"></v-img>
                </v-list-item-avatar>

                <v-list-item-content>
                  <v-list-item-title v-text="language.name"></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
          <v-card-text v-else>
            {{ $t('global.no_results_found') }}
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-dialog @input="updateFeedbackData()" v-model="feedbackDialog" max-width="1200" v-if="isLoggedIn">
        <template #activator="{ on }">
          <v-btn color="error" small text v-on="on">
            {{ $t('NavBar.feedback_nav') }}
          </v-btn>
        </template>
        <v-card>
          <v-card-title class="headline" @dblclick="showStateExport">
            {{ $t('NavBar.feedback_title') }}
          </v-card-title>
          <v-card-text>
            <v-form v-model="feedbackFormValid" ref="feedbackForm" @submit.stop.prevent="submitFeedback">
              <v-textarea
                :rules="[(v) => !!v || $t('NavBar.feedback_required')]"
                v-model="feedbackText"
                outlined
                :label="$t('NavBar.feedback')"
                :placeholder="$t('NavBar.feedback_textarea_placeholder')"
              ></v-textarea>
              <v-textarea
                v-if="shownExportState"
                v-model="shownExportState"
                outlined
                :label="$t('global.debug')"
                :readonly="true"
                ref="shownExportStateInput"
              ></v-textarea>
              <div class="d-flex justify-space-between">
                <v-btn @click="feedbackDialog = false">{{ $t('global.close') }}</v-btn>
                <v-btn @click="copyShownExportState" v-if="shownExportState">{{ $t('global.copy') }}</v-btn>
                <div class="d-flex align-items-center gap-2">
                  <!-- <v-btn type="button" color="primary" @click="onRedirectToFAQ()">{{ $t('global.faq') }}</v-btn> -->
                  <span
                    style="max-width: 270px"
                    v-html="
                      $t('NavBar.having_issues_text', {
                        faqLink: `<a href='https://scanlabmr.com/faqs/' target='_blank'>${$t('NavBar.faq')}</a>`,
                      })
                    "
                  >
                  </span>
                  <v-btn :disabled="!feedbackFormValid" type="submit" color="primary">{{ $t('global.submit') }}</v-btn>
                </div>
              </div>
            </v-form>
            <v-divider v-if="feedbackImages"></v-divider>
            <div v-if="feedbackImages" class="d-flex justify-space-around">
              <div v-for="image in feedbackImages" :key="image.id">
                <img :src="image.src" :width="image.width" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-menu class="nav-menu-dropdown" bottom left v-if="isLoggedIn && isAdmin">
        <template #activator="{ on }">
          <v-btn text small v-on="on">
            {{ $t('global.admin_tools') }}
            <v-icon small>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item href="#" to="/student-manager">
            <v-list-item-title>{{ $t('global.manage_students') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/prepared-exams">
            <v-list-item-title>{{ $t('PreparedExams.manage_prepared_exams') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/manage-prepared-exam-questions">
            <v-list-item-title>{{ $t('PreparedExams.manage_prepared_exam_questions') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/dicom">
            <v-list-item-title>{{ $t('global.manage_ct_dicom') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/test-dicom">
            <v-list-item-title>{{ $t('global.manage_tests_dicom') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/question-manager">
            <v-list-item-title>{{ $t('global.manage_tests') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/critical-thinking-manager">
            <v-list-item-title>{{ $t('global.manage_critical_thinking_questions') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/cohort-manager">
            <v-list-item-title>{{ $t('global.manage_cohorts') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/role-manager">
            <v-list-item-title>{{ $t('global.manage_roles') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/admin/intervention-rules">
            <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
            <v-list-item-title>Intervention Rules</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/analysis">
            <v-list-item-title>{{ $t('global.analysis') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/manage-exam-positions" v-if="isCTLab">
            <v-list-item-title>{{ $t('global.manage_exam_positions') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/manage-models">
            <v-list-item-title>{{ $t('global.manage_models') }}</v-list-item-title>
          </v-list-item>
          <!-- <v-list-item href="#" to="/manage-localizers" v-if="isCTLab">
            <v-list-item-title>{{ $t('global.manage_localizers') }}</v-list-item-title>
          </v-list-item> -->
          <v-list-item href="#" to="/manage-dose" v-if="isCTLab">
            <v-list-item-title>{{ $t('global.manage_dose') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/manage-contrast-range-presets" v-if="!isCTLab">
            <v-list-item-title>{{ $t('global.manage_contrast_range_presets') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/manage-patient-physio">
            <v-list-item-title>{{ $t('global.manage_patient_physio') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/manage-dicom-boxes">
            <v-list-item-title>{{ $t('global.manage_dicom_boxes') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/manage-resources">
            <v-list-item-title>{{ $t('global.manage_resources') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/manage-api-endpoints">
            <v-list-item-title>{{ $t('ApiEndpoints.manage_api_endpoints') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/manage-digital-localizer" v-if="isCTLab">
            <v-list-item-title>{{ $t('global.manage_digital_localizer') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" to="/manage-watch-towers">
            <v-list-item-title>{{ $t('global.manage_watch_towers') }}</v-list-item-title>
          </v-list-item>
          <!-- <v-list-item href="#" to="/manage-animated-volumes">
            <v-list-item-title>{{ $t('global.manage_animated_volumes') }}</v-list-item-title>
          </v-list-item> -->
        </v-list>
      </v-menu>

      <v-btn text v-if="!isLoggedIn && !isMaintenance" class="lightBlue--text" to="/login">
        {{ $t('global.login') }}
      </v-btn>
      <v-btn text v-if="!isLoggedIn && !isMaintenance" class="lightBlue--text" to="/register">
        {{ $t('global.register') }}
      </v-btn>
      <notification-bell v-if="isLoggedIn" />

      <v-menu bottom left v-if="isLoggedIn">
        <template #activator="{ on }">
          <v-btn text small v-on="on">
            {{ nickName }}
            <v-icon small>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item href="#" to="/profile">
            <v-list-item-title>{{ $t('global.profile') }}</v-list-item-title>
          </v-list-item>
          <v-list-item href="#" @click="logout">
            <v-list-item-title>{{ $t('global.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
  </v-card>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { allLanguages } from '@/util/languages'
import * as Sentry from '@sentry/vue'
import LogRocket from 'logrocket'
import moment from 'moment'
import { StateManager } from '@/store/store'
import config from '@/config'
import { apiPost } from '../util/api'
import axios from 'axios'
import NotificationBell from './NotificationBell.vue'

export default {
  name: 'NavBar',
  components: { NotificationBell },
  props: {},
  data() {
    return {
      feedbackDialog: false,
      feedbackImages: null,
      feedbackText: null,
      feedbackFormValid: false,
      languageSwitcherDialog: false,
      languages: allLanguages,
      languageSearch: null,
      shownExportState: null,
      isCTLab: config.isCTLab,
      isMaintenance: config.isMaintenance,
    }
  },
  computed: {
    ...mapState('user', ['nickName', 'isAdmin', 'isManager', 'legalName', 'email']),
    ...mapGetters('user', ['languageCode', 'isTranslator']),
    ...mapState('authentication', ['accessToken']),
    ...mapGetters('authentication', ['isLoggedIn']),
    ...mapState('resourceService', ['resourceCategories']),
    ...mapState('translatedContent', ['languageOptions']),
    currentLanguage() {
      let current = this.$i18n.locale

      return this.languageOptions.find((language) => language.code === current)
    },
    filteredLanguages() {
      // If we have a search term, only show languages that include that search term
      if (this.languageSearch && this.languageSearch.length) {
        return this.languageOptions.filter((language) => language.name.toLowerCase().includes(this.languageSearch))

        // Otherwise, show all languages
      } else {
        return this.languageOptions.filter((language) => language.name)
      }
    },
  },
  mounted() {
    this.loadAllResourceCategories()
    if (this.isLoggedIn) {
      this.startPolling()
    }
  },

  beforeDestroy() {
    this.stopPolling()
  },
  methods: {
    ...mapActions('authentication', ['logout']),
    ...mapActions('user', ['saveLanguage']),
    ...mapActions('selectionConfig', ['getCurrentSliceViewsAsImages']),
    ...mapActions('resourceService', ['loadAllResourceCategories']),
    ...mapActions('notificationService', ['startPolling', 'stopPolling']),
    getLanguageFlag(language) {
      if (!language) {
        return null
      }
      if (language.flag) {
        return language.flag
      } else {
        const localLanguage = this.languages.find((lang) => lang.code === language.code)
        return localLanguage.flag
      }
    },
    onRedirectToFAQ() {
      try {
        const faqResource = this.resourceCategories.find((item) => item.name === 'FAQ')
        this.$router.push({ path: `/resources?category=${faqResource.id}` })
        this.feedbackDialog = false
      } catch (e) {
        console.error('FAQ resource not found')
        this.$notify({ type: 'error', text: 'FAQ resource not found' })
      }
    },
    changeLanguage(language) {
      this.saveLanguage({ language })
      this.languageSwitcherDialog = false
      this.languageSearch = null
    },

    async updateFeedbackData() {
      this.feedbackImages = await this.getCurrentSliceViewsAsImages()
      this.shownExportState = null
    },

    showStateExport() {
      if (!this.isAdmin) {
        return
      }

      this.shownExportState = JSON.stringify(StateManager.stateExport())
      console.log(this.shownExportState)
    },

    copyShownExportState() {
      let input = this.$refs.shownExportStateInput
      input.$el.getElementsByTagName('textarea')[0].select()
      document.execCommand('copy')
      this.$notify({ type: 'info', text: 'Copied to clipboard' })
    },

    async exportStateToClipboard() {
      if (!this.isAdmin) {
        return
      }

      await navigator.clipboard.writeText(JSON.stringify(StateManager.stateExport()))
      this.$notify({ type: 'info', text: 'Copied state to clipboard' })
    },

    async importStateFromClipboard() {
      // if you want to use this in prod, run StateManager.stateImport(...) from the console
      if (!this.isAdmin || config.env === 'production') {
        return
      }

      const state = JSON.parse(await navigator.clipboard.readText())
      StateManager.stateImport(state)

      this.$notify({ type: 'success', text: 'Restored state from clipboard' })
    },

    async submitFeedback() {
      // Upload user's state for debugging purposes
      let reportUploadPathKey
      try {
        let response = await apiPost('userReportData', {}, this.accessToken)
        reportUploadPathKey = response.data.pathKey
        await axios.put(response.data.presignedS3Url, StateManager.stateExport({ feedbackText: this.feedbackText }), {
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (e) {
        // Don't prevent error uploading user report data stop user report from being sent to Sentry below
        console.error(e)
      }

      // Report with Sentry that also notifies Slack (only happens in prod since Sentry only init'd there)
      Sentry.withScope((scope) => {
        scope.setLevel('info')
        scope.setExtra('feedbackText', this.feedbackText)
        scope.setExtra('userEmail', this.email)
        scope.setExtra('reportUploadPathKey', reportUploadPathKey)
        const message = `User Report: ${this.feedbackText}\n\nFrom ${this.legalName} at ${moment().format()} on ${
          this.$route.path
        }`
        const sentryEventId = Sentry.captureMessage(message)

        LogRocket.captureMessage(message, {
          tags: {
            // additional data to be grouped as "tags"
            type: 'UserFeedback',
          },
          extra: {
            sentryEventId,
          },
        })
      })

      if (this.$refs.feedbackForm) {
        this.$refs.feedbackForm.reset()
      }
      this.feedbackDialog = false
      if (config.env === 'production') {
        this.$notify({ type: 'success', text: 'Thank you for your feedback!' })
      } else {
        // The only reason that's so is that we don't init Sentry in non-prod since we didn't want to log all errors outside prod, I think
        this.$notify({ type: 'warn', text: 'This is not production: Please notify the team manually' })
      }
    },
  },
}
</script>

<style lang="scss">
.v-list-item--no-highlight::before {
  opacity: 0 !important;
}
</style>
<style scoped lang="scss">
@include hover-colors($colors-list);
@include active-colors($colors-list);

.gap-2 {
  gap: 1rem;
}

nav {
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.17);
}

.nav-menu-dropdown {
  z-index: 12;
}

.toolbar-title {
  cursor: pointer;
}

a {
  &:hover {
    text-decoration: none;
  }
}

.logo {
  height: 60px;
}

/* UPDATED BY ME */
.v-menu__content {
  z-index: 15 !important;
}
/* END */
</style>
