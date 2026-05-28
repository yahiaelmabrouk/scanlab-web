<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-container fluid class="notif-prefs-page pa-4 pa-md-6">
    <!-- Header -->
    <div class="d-flex align-center mb-1" style="gap: 12px;">
      <v-btn icon small @click="$router.back()">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-icon size="26" color="primary">mdi-tune</v-icon>
      <h1 class="notif-prefs-page__title">Notification Preferences</h1>
    </div>
    <p class="grey--text mb-4 ml-10">Choose how you'd like to be notified for each event.</p>

    <v-divider class="mb-5"></v-divider>

    <!-- Loading -->
    <div v-if="preferencesLoading">
      <v-skeleton-loader v-for="i in 4" :key="i" type="table-row" class="mb-2"></v-skeleton-loader>
    </div>

    <!-- Preferences table -->
    <v-card v-else elevation="2" class="notif-prefs-card">
      <!-- Channel header -->
      <div class="notif-prefs-card__header d-flex align-center px-4 py-3">
        <div class="notif-prefs-card__event-col font-weight-bold caption text-uppercase grey--text text--darken-1">
          Event
        </div>
        <div
          v-for="channel in channels"
          :key="channel.key"
          class="notif-prefs-card__channel-col d-flex flex-column align-center"
        >
          <v-icon small :color="channel.color" class="mb-1">{{ channel.icon }}</v-icon>
          <span class="caption font-weight-medium" :style="{ color: channel.color }">{{ channel.label }}</span>
        </div>
      </div>

      <v-divider></v-divider>

      <!-- Event rows -->
      <template v-for="(event, idx) in events">
        <div
          :key="event.type"
          class="notif-prefs-card__row d-flex align-center px-4 py-3"
          :class="{ 'notif-prefs-card__row--alt': idx % 2 === 1 }"
        >
          <!-- Event info -->
          <div class="notif-prefs-card__event-col d-flex align-center" style="gap: 10px;">
            <v-avatar :color="event.color" size="34">
              <v-icon small color="white">{{ event.icon }}</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium" style="font-size: 13px; color: #071920;">{{ event.label }}</div>
              <div class="caption grey--text">{{ event.description }}</div>
            </div>
          </div>

          <!-- Channel toggles -->
          <div
            v-for="channel in channels"
            :key="channel.key"
            class="notif-prefs-card__channel-col d-flex justify-center"
          >
            <v-switch
              dense
              hide-details
              :input-value="getToggle(event.type, channel.key)"
              :color="channel.color"
              class="notif-pref-toggle mt-0 pt-0"
              @change="(val) => setToggle(event.type, channel.key, val)"
            ></v-switch>
          </div>
        </div>
        <v-divider v-if="idx < events.length - 1" :key="`d-${event.type}`"></v-divider>
      </template>
    </v-card>

    <!-- Save button -->
    <div class="d-flex justify-end mt-5">
      <v-btn
        color="primary"
        :loading="saving"
        :disabled="preferencesLoading"
        elevation="0"
        class="notif-prefs-page__save-btn"
        @click="onSave"
      >
        <v-icon left>mdi-content-save-outline</v-icon>
        Save preferences
      </v-btn>
    </div>

    <!-- Phone Number -->
    <v-card class="notif-phone-card mt-6" elevation="2">
      <div class="notif-phone-card__header px-4 py-3 d-flex align-center" style="gap: 10px;">
        <v-icon color="primary">mdi-cellphone</v-icon>
        <span class="font-weight-bold" style="font-size: 15px; color: #071920;">Phone Number</span>
      </div>
      <v-divider />

      <!-- Loading -->
      <div v-if="phoneLoading" class="pa-5">
        <v-skeleton-loader type="text@2" />
        <v-skeleton-loader type="button" class="mt-4" />
      </div>

      <!-- Phone registered -->
      <div v-else-if="safePhoneStatus.phoneNumber && !editingPhone" class="pa-5">
        <div class="d-flex align-center mb-1" style="gap: 8px;">
          <v-avatar color="success" size="28">
            <v-icon small color="white">mdi-check</v-icon>
          </v-avatar>
          <span class="font-weight-medium" style="font-size: 14px; color: #071920;">SMS notifications active</span>
        </div>
        <div class="notif-phone-card__number mt-2 mb-4">
          {{ maskedPhone }}
        </div>
        <v-btn small outlined color="primary" class="notif-phone-card__change-btn" @click="onChangeNumber">
          <v-icon left small>mdi-pencil-outline</v-icon>
          Change number
        </v-btn>
      </div>

      <!-- Form (no phone or editing) -->
      <div v-else class="pa-5">
        <p class="grey--text text--darken-1 mb-4" style="font-size: 14px;">
          Add your number to receive SMS notifications
        </p>
        <div class="d-flex flex-wrap" style="gap: 12px;">
          <div class="notif-phone-card__code-field">
            <label for="phone-country-code" class="notif-phone-card__label">Country code</label>
            <v-text-field
              id="phone-country-code"
              v-model="phoneForm.countryCode"
              placeholder="+1"
              outlined
              dense
              hide-details
              maxlength="5"
              @keypress="onlyPlusDigits"
            />
          </div>
          <div class="notif-phone-card__digits-field">
            <label for="phone-digits" class="notif-phone-card__label">Phone number</label>
            <v-text-field
              id="phone-digits"
              v-model="phoneForm.digits"
              placeholder="e.g. 1234567890"
              outlined
              dense
              hide-details
              maxlength="15"
              @input="stripNonDigits"
            />
          </div>
        </div>
        <div class="d-flex align-center flex-wrap mt-4" style="gap: 12px;">
          <v-btn
            color="primary"
            elevation="0"
            :disabled="!canSavePhone"
            :loading="phoneSaving"
            class="notif-prefs-page__save-btn"
            @click="onSavePhone"
          >
            <v-icon left>mdi-content-save-outline</v-icon>
            Save number
          </v-btn>
          <v-btn
            v-if="editingPhone"
            text
            color="grey darken-1"
            style="text-transform: none; letter-spacing: 0;"
            @click="editingPhone = false"
          >
            Cancel
          </v-btn>
        </div>
        <div v-if="phoneError" class="notif-phone-card__error mt-2">{{ phoneError }}</div>
      </div>
    </v-card>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'

const EVENTS = [
  {
    type: 'EXAM_ASSIGNED',
    label: 'Exam Assigned',
    description: 'When a new exam is assigned to you',
    icon: 'mdi-clipboard-text-outline',
    color: '#247ba0',
  },
  {
    type: 'FEEDBACK_RECEIVED',
    label: 'Feedback Received',
    description: 'When your instructor leaves feedback',
    icon: 'mdi-comment-text-outline',
    color: '#3a9989',
  },
  {
    type: 'COHORT_ACCOUNT_OPENED',
    label: 'Added to Cohort',
    description: 'When you are added to a cohort',
    icon: 'mdi-school-outline',
    color: '#f9ac34',
  },
  {
    type: 'EXAM_UNLOCKED',
    label: 'Exam Unlocked',
    description: 'When your instructor unlocks an exam',
    icon: 'mdi-lock-open-variant-outline',
    color: '#5b8c5a',
  },
  {
    type: 'EXAM_SANDBOX_ENABLED',
    label: 'Sandbox Enabled',
    description: 'When an exam is put into sandbox mode',
    icon: 'mdi-flask-outline',
    color: '#247ba0',
  },
  {
    type: 'EXAM_SANDBOX_DISABLED',
    label: 'Sandbox Disabled',
    description: 'When an exam is removed from sandbox mode',
    icon: 'mdi-flask-off-outline',
    color: '#b5651d',
  },
  {
    type: 'NEW_FEATURE',
    label: 'New Features',
    description: 'When a new feature is released',
    icon: 'mdi-star-outline',
    color: '#f9ac34',
  },
  {
    type: 'KNOWN_BUG',
    label: 'Known Issues',
    description: 'When a known issue is reported',
    icon: 'mdi-bug-outline',
    color: '#e0556e',
  },
  {
    type: 'ACCOUNT_EXPIRING',
    label: 'Account Expiring',
    description: 'When your account is about to expire',
    icon: 'mdi-clock-alert-outline',
    color: '#f9ac34',
  },
]

const CHANNELS = [
  { key: 'in_app', label: 'In-App', icon: 'mdi-bell-outline', color: '#247ba0' },
  { key: 'email', label: 'Email', icon: 'mdi-email-outline', color: '#3a9989' },
  { key: 'sms', label: 'SMS', icon: 'mdi-message-text-outline', color: '#f9ac34' },
]

// Defaults when the backend returns an empty preferences array
const DEFAULTS = {
  in_app: true,
  email: true,
  sms: false,
}

export default {
  name: 'NotificationPreferences',

  data() {
    return {
      events: EVENTS,
      channels: CHANNELS,
      localToggles: {},
      saving: false,
      // phone section
      phoneLoading: false,
      editingPhone: false,
      phoneForm: { countryCode: '', digits: '' },
      phoneSaving: false,
      phoneError: null,
    }
  },

  computed: {
    ...mapState('notificationService', ['preferences', 'preferencesLoading', 'phoneStatus']),

    safePhoneStatus() {
      return this.phoneStatus || { phoneNumber: null, countryCode: null }
    },

    maskedPhone() {
      const { phoneNumber, countryCode } = this.safePhoneStatus
      if (!phoneNumber) return ''
      const end = phoneNumber.slice(-4)
      return `${countryCode} ••••••${end}`
    },

    canSavePhone() {
      return this.phoneForm.countryCode.trim().length >= 1 && this.phoneForm.digits.length >= 7
    },
  },

  watch: {
    preferences: {
      immediate: true,
      handler(prefs) {
        this.buildLocalToggles(prefs)
      },
    },
  },

  mounted() {
    this.fetchPreferences()
    this.loadPhoneStatus()
  },

  methods: {
    ...mapActions('notificationService', ['fetchPreferences', 'savePreferences', 'fetchPhoneStatus', 'setPhoneNumber']),
    ...mapMutations('notificationService', ['setPhoneStatus']),

    buildLocalToggles(prefs) {
      const map = {}
      for (const event of EVENTS) {
        map[event.type] = {}
        for (const channel of CHANNELS) {
          if (prefs && prefs.length > 0) {
            const match = prefs.find((p) => p.eventType === event.type && p.channel === channel.key)
            map[event.type][channel.key] = match ? match.enabled : DEFAULTS[channel.key]
          } else {
            map[event.type][channel.key] = DEFAULTS[channel.key]
          }
        }
      }
      this.localToggles = map
    },

    getToggle(eventType, channel) {
      return this.localToggles[eventType]?.[channel] ?? DEFAULTS[channel]
    },

    setToggle(eventType, channel, value) {
      if (!this.localToggles[eventType]) {
        this.$set(this.localToggles, eventType, {})
      }
      this.$set(this.localToggles[eventType], channel, value)
    },

    async loadPhoneStatus() {
      this.phoneLoading = true
      try {
        await this.fetchPhoneStatus()
      } finally {
        this.phoneLoading = false
      }
    },

    onlyPlusDigits(e) {
      if (!/[\d+]/.test(String.fromCharCode(e.keyCode || e.which))) {
        e.preventDefault()
      }
    },

    stripNonDigits() {
      this.phoneForm.digits = this.phoneForm.digits.replace(/\D/g, '')
    },

    onChangeNumber() {
      const { countryCode, phoneNumber } = this.safePhoneStatus
      this.phoneForm.countryCode = countryCode || ''
      let digits = phoneNumber || ''
      if (countryCode && digits.startsWith(countryCode)) {
        digits = digits.slice(countryCode.length)
      }
      this.phoneForm.digits = digits
      this.editingPhone = true
      this.phoneError = null
    },

    async onSavePhone() {
      this.phoneSaving = true
      this.phoneError = null
      try {
        const { countryCode, digits } = this.phoneForm
        await this.setPhoneNumber({ phoneNumber: countryCode + digits, countryCode })
        this.editingPhone = false
      } catch (e) {
        this.phoneError = e?.message || 'Failed to save phone number. Please try again.'
      } finally {
        this.phoneSaving = false
      }
    },

    async onSave() {
      this.saving = true
      try {
        const preferencesPayload = []
        for (const event of EVENTS) {
          for (const channel of CHANNELS) {
            preferencesPayload.push({
              eventType: event.type,
              channel: channel.key,
              enabled: this.getToggle(event.type, channel.key),
            })
          }
        }
        await this.savePreferences({ preferences: preferencesPayload })
        this.$notify({ type: 'success', text: 'Notification preferences saved' })
      } catch {
        this.$notify({ type: 'error', text: 'Failed to save preferences' })
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.notif-prefs-page {
  max-width: 750px;
  margin: 0 auto;

  &__title {
    font-size: 21px;
    font-weight: 700;
    color: #071920;
    line-height: 1.2;
  }

  &__save-btn {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 600;
    padding: 0 24px;
    height: 40px;
    border-radius: 8px;
  }
}

.notif-prefs-card {
  border-radius: 12px !important;
  overflow: hidden;

  &__header {
    background: #f8fafc;
  }

  &__event-col {
    flex: 1 1 0;
    min-width: 0;
  }

  &__channel-col {
    width: 90px;
    flex-shrink: 0;
  }

  &__row {
    transition: background 0.12s ease;

    &--alt {
      background-color: #f8fafc;
    }

    &:hover {
      background-color: rgba(36, 123, 160, 0.06) !important;
    }
  }
}

.notif-pref-toggle {
  ::v-deep .v-input--switch__thumb {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }
}

.notif-phone-card {
  border-radius: 12px !important;
  overflow: hidden;

  &__header {
    background: #f8fafc;
  }

  &__number {
    font-size: 17px;
    font-weight: 600;
    color: #071920;
    font-family: monospace;
    letter-spacing: 0.05em;
    background: #f1f5f9;
    display: inline-block;
    padding: 6px 14px;
    border-radius: 8px;
  }

  &__label {
    display: block;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
    font-weight: 500;
  }

  &__code-field {
    width: 110px;
  }

  &__digits-field {
    flex: 1;
    min-width: 180px;
  }

  &__change-btn {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
  }

  &__error {
    color: #ef4444;
    font-size: 13px;
  }
}
</style>
