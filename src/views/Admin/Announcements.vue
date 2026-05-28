<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-container fluid class="announcements-page pa-4 pa-md-6">
    <!-- Header -->
    <div class="d-flex align-center mb-1" style="gap: 12px">
      <v-btn icon small @click="$router.back()">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-icon size="26" color="primary">mdi-bullhorn-outline</v-icon>
      <h1 class="announcements-page__title">Announcements</h1>
    </div>
    <p class="grey--text mb-4 ml-10">Broadcast announcements to all students.</p>

    <v-divider class="mb-5"></v-divider>

    <!-- New Feature -->
    <v-card elevation="2" class="announcements-card mb-5">
      <div class="announcements-card__header d-flex align-center px-4 py-3">
        <v-icon color="primary" class="mr-2">mdi-star-outline</v-icon>
        <span class="font-weight-bold">New Feature</span>
      </div>

      <v-divider></v-divider>

      <div class="pa-4">
        <p class="grey--text text--darken-1 mb-4">
          Announce a newly released feature. Every student will receive a notification with the feature name.
        </p>

        <v-btn v-if="!feature.show" color="primary" depressed @click="feature.show = true">
          <v-icon left>mdi-plus</v-icon>
          New Feature
        </v-btn>

        <v-expand-transition>
          <div v-if="feature.show">
            <v-form ref="featureForm" v-model="feature.valid" @submit.prevent="submitFeature">
              <v-text-field
                v-model="feature.text"
                label="Feature name"
                placeholder="e.g. Dark Mode"
                outlined
                autofocus
                counter="120"
                :rules="featureRules"
                :disabled="feature.sending"
              ></v-text-field>

              <div class="d-flex" style="gap: 12px">
                <v-btn color="primary" depressed type="submit" :loading="feature.sending" :disabled="!feature.valid">
                  <v-icon left>mdi-send</v-icon>
                  Send to students
                </v-btn>
                <v-btn text :disabled="feature.sending" @click="cancelFeature">Cancel</v-btn>
              </div>
            </v-form>
          </div>
        </v-expand-transition>
      </div>
    </v-card>

    <!-- Account Expiry Reminder -->
    <v-card elevation="2" class="announcements-card mb-5">
      <div class="announcements-card__header d-flex align-center px-4 py-3">
        <v-icon color="warning" class="mr-2">mdi-clock-alert-outline</v-icon>
        <span class="font-weight-bold">Account Expiry Reminder</span>
      </div>

      <v-divider></v-divider>

      <div class="pa-4">
        <p class="grey--text text--darken-1 mb-4">
          Students are automatically reminded when their account is about to expire. Choose how many days before expiry
          the reminder is sent.
        </p>

        <div class="d-flex align-center flex-wrap" style="gap: 16px">
          <div class="announcements-card__current">
            <span class="announcements-card__current-label">Currently notifying</span>
            <span class="announcements-card__current-value">
              <template v-if="expiry.loading">…</template>
              <template v-else>{{ expiry.days }} {{ expiry.days === 1 ? 'day' : 'days' }} before expiry</template>
            </span>
          </div>
          <v-btn color="warning" depressed :disabled="expiry.loading" @click="openExpiryDialog">
            <v-icon left>mdi-pencil-outline</v-icon>
            Change duration
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- Account Expiry dialog -->
    <v-dialog v-model="expiry.dialog" max-width="420" persistent>
      <v-card>
        <v-card-title class="d-flex align-center" style="gap: 8px">
          <v-icon color="warning">mdi-clock-alert-outline</v-icon>
          <span class="font-weight-bold">Account Expiry Reminder</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <p class="grey--text text--darken-1 mb-3">
            Send students a reminder this many days before their account expires.
          </p>
          <v-form ref="expiryForm" v-model="expiry.valid" @submit.prevent="submitExpiry">
            <v-text-field
              v-model.number="expiry.draft"
              label="Days before expiry"
              type="number"
              min="1"
              max="365"
              outlined
              autofocus
              suffix="days"
              :rules="expiryRules"
              :disabled="expiry.saving"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="px-4 py-3">
          <v-spacer></v-spacer>
          <v-btn text :disabled="expiry.saving" @click="expiry.dialog = false">Cancel</v-btn>
          <v-btn color="warning" depressed :loading="expiry.saving" :disabled="!expiry.valid" @click="submitExpiry">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Known Bug -->
    <v-card elevation="2" class="announcements-card">
      <div class="announcements-card__header d-flex align-center px-4 py-3">
        <v-icon color="error" class="mr-2">mdi-bug-outline</v-icon>
        <span class="font-weight-bold">Known Bug</span>
      </div>

      <v-divider></v-divider>

      <div class="pa-4">
        <p class="grey--text text--darken-1 mb-4">
          Inform students about a known issue you're working on. Every student will receive a notification.
        </p>

        <v-btn v-if="!bug.show" color="error" depressed @click="bug.show = true">
          <v-icon left>mdi-plus</v-icon>
          Known Bug
        </v-btn>

        <v-expand-transition>
          <div v-if="bug.show">
            <v-form ref="bugForm" v-model="bug.valid" @submit.prevent="submitBug">
              <v-textarea
                v-model="bug.text"
                label="Issue description"
                placeholder="e.g. Scores may load slowly on the results page"
                outlined
                autofocus
                rows="3"
                counter="280"
                :rules="bugRules"
                :disabled="bug.sending"
              ></v-textarea>

              <div class="d-flex" style="gap: 12px">
                <v-btn color="error" depressed type="submit" :loading="bug.sending" :disabled="!bug.valid">
                  <v-icon left>mdi-send</v-icon>
                  Send to students
                </v-btn>
                <v-btn text :disabled="bug.sending" @click="cancelBug">Cancel</v-btn>
              </div>
            </v-form>
          </div>
        </v-expand-transition>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'Announcements',
  data() {
    return {
      feature: { show: false, text: '', valid: false, sending: false },
      bug: { show: false, text: '', valid: false, sending: false },
      expiry: { days: 7, draft: 7, dialog: false, valid: true, loading: true, saving: false },
      expiryRules: [
        (v) => (v !== '' && v !== null && v !== undefined) || 'Number of days is required',
        (v) => Number.isInteger(Number(v)) || 'Must be a whole number',
        (v) => Number(v) >= 1 || 'Must be at least 1 day',
        (v) => Number(v) <= 365 || 'Must be 365 days or less',
      ],
      featureRules: [
        (v) => !!(v && v.trim()) || 'Feature name is required',
        (v) => (v || '').length <= 120 || 'Feature name must be 120 characters or less',
      ],
      bugRules: [
        (v) => !!(v && v.trim()) || 'Issue description is required',
        (v) => (v || '').length <= 280 || 'Description must be 280 characters or less',
      ],
    }
  },
  async mounted() {
    await this.loadExpirySetting()
  },
  methods: {
    ...mapActions('notificationService', [
      'announceNewFeature',
      'announceKnownBug',
      'fetchAccountExpirySetting',
      'saveAccountExpirySetting',
    ]),

    async loadExpirySetting() {
      this.expiry.loading = true
      try {
        const days = await this.fetchAccountExpirySetting()
        if (Number.isInteger(days)) this.expiry.days = days
      } catch {
        // keep default on failure
      } finally {
        this.expiry.loading = false
      }
    },

    openExpiryDialog() {
      this.expiry.draft = this.expiry.days
      this.expiry.dialog = true
      if (this.$refs.expiryForm) this.$refs.expiryForm.resetValidation()
    },

    async submitExpiry() {
      if (this.$refs.expiryForm && !this.$refs.expiryForm.validate()) return
      this.expiry.saving = true
      try {
        const days = Number(this.expiry.draft)
        await this.saveAccountExpirySetting({ days })
        this.expiry.days = days
        this.expiry.dialog = false
        this.$notify({
          type: 'success',
          text: `Students will be reminded ${days} ${days === 1 ? 'day' : 'days'} before expiry`,
        })
      } catch (err) {
        this.$notify({ type: 'error', text: err.message || 'Failed to save setting' })
      } finally {
        this.expiry.saving = false
      }
    },

    cancelFeature() {
      this.feature.show = false
      this.feature.text = ''
      if (this.$refs.featureForm) this.$refs.featureForm.resetValidation()
    },

    cancelBug() {
      this.bug.show = false
      this.bug.text = ''
      if (this.$refs.bugForm) this.$refs.bugForm.resetValidation()
    },

    async submitFeature() {
      if (this.$refs.featureForm && !this.$refs.featureForm.validate()) return
      this.feature.sending = true
      try {
        const name = this.feature.text.trim()
        await this.announceNewFeature({ featureName: name })
        this.$notify({ type: 'success', text: `Students notified about "${name}"` })
        this.cancelFeature()
      } catch (err) {
        this.$notify({ type: 'error', text: err.message || 'Failed to send announcement' })
      } finally {
        this.feature.sending = false
      }
    },

    async submitBug() {
      if (this.$refs.bugForm && !this.$refs.bugForm.validate()) return
      this.bug.sending = true
      try {
        const description = this.bug.text.trim()
        await this.announceKnownBug({ bugDescription: description })
        this.$notify({ type: 'success', text: 'Students notified about the known issue' })
        this.cancelBug()
      } catch (err) {
        this.$notify({ type: 'error', text: err.message || 'Failed to send announcement' })
      } finally {
        this.bug.sending = false
      }
    },
  },
}
</script>

<style scoped lang="scss">
.announcements-page {
  max-width: 760px;
  margin: 0 auto;

  &__title {
    font-size: 22px;
    font-weight: 600;
    color: #071920;
  }
}

.announcements-card {
  border-radius: 12px;
  overflow: hidden;

  &__header {
    background: #f8fafc;
  }

  &__current {
    display: flex;
    flex-direction: column;
  }

  &__current-label {
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__current-value {
    font-size: 15px;
    font-weight: 600;
    color: #071920;
  }
}
</style>
