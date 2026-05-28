<template>
  <v-menu
    v-model="open"
    :close-on-content-click="false"
    offset-y
    left
    max-width="380"
    min-width="380"
    content-class="notification-dropdown"
  >
    <template #activator="{ on }">
      <v-btn icon v-on="on" class="notification-bell-btn" :class="{ 'bell-active': open }">
        <v-badge
          :content="displayCount"
          :value="unreadCount > 0"
          color="error"
          overlap
          offset-x="12"
          offset-y="12"
        >
          <v-icon :class="{ 'bell-ring': unreadCount > 0 }">mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card class="notification-panel">
      <!-- Header -->
      <div class="notification-panel__header d-flex align-center justify-space-between px-4 py-3">
        <span class="notification-panel__title">Notifications</span>
        <div class="d-flex align-center" style="gap: 4px;">
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn
                icon
                small
                v-on="on"
                :disabled="unreadCount === 0"
                @click="markAllAsRead"
                class="notification-panel__mark-all-btn"
              >
                <v-icon small>mdi-check-all</v-icon>
              </v-btn>
            </template>
            <span>Mark all as read</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <v-btn icon small v-on="on" @click="goToNotifications">
                <v-icon small>mdi-open-in-new</v-icon>
              </v-btn>
            </template>
            <span>View all notifications</span>
          </v-tooltip>
        </div>
      </div>

      <v-divider></v-divider>

      <!-- Loading skeleton -->
      <div v-if="loading" class="notification-panel__loading">
        <v-skeleton-loader v-for="i in 3" :key="i" type="list-item-two-line" class="mx-3 my-1"></v-skeleton-loader>
      </div>

      <!-- Empty state -->
      <div v-else-if="previewNotifications.length === 0" class="notification-panel__empty">
        <v-icon size="48" color="grey lighten-1">mdi-bell-off-outline</v-icon>
        <p class="grey--text mt-2">No notifications yet</p>
      </div>

      <!-- Notification list -->
      <v-list v-else two-line dense class="notification-panel__list py-0">
        <template v-for="(notif, index) in previewNotifications">
          <v-list-item
            :key="notif.id"
            :class="['notification-item', { 'notification-item--unread': !notif.isRead }]"
            @click="onClickNotification(notif)"
          >
            <v-list-item-avatar size="36" :color="typeColor(notif.type)" class="notification-item__avatar">
              <v-icon small color="white">{{ typeIcon(notif.type) }}</v-icon>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title class="notification-item__title">{{ notif.title }}</v-list-item-title>
              <v-list-item-subtitle class="notification-item__message">{{ notif.message }}</v-list-item-subtitle>
              <v-list-item-subtitle class="notification-item__time">{{ relativeTime(notif.createdAt) }}</v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action v-if="!notif.isRead">
              <div class="notification-item__dot"></div>
            </v-list-item-action>
          </v-list-item>
          <v-divider v-if="index < previewNotifications.length - 1" :key="`d-${notif.id}`" inset></v-divider>
        </template>
      </v-list>

      <v-divider v-if="previewNotifications.length > 0"></v-divider>

      <!-- Footer -->
      <div class="notification-panel__footer d-flex justify-center pa-2">
        <v-btn text small color="primary" @click="goToNotifications" class="notification-panel__view-all-btn">
          View all notifications
          <v-icon small right>mdi-arrow-right</v-icon>
        </v-btn>
      </div>
    </v-card>
  </v-menu>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import moment from 'moment'

const TYPE_ICONS = {
  EXAM_ASSIGNED: 'mdi-clipboard-text-outline',
  FEEDBACK_RECEIVED: 'mdi-comment-text-outline',
  ACCOUNT_CREATED: 'mdi-account-circle-outline',
  COHORT_ACCOUNT_OPENED: 'mdi-school-outline',
  EXAM_UNLOCKED: 'mdi-lock-open-variant-outline',
  EXAM_SANDBOX_ENABLED: 'mdi-flask-outline',
  EXAM_SANDBOX_DISABLED: 'mdi-flask-off-outline',
  FEEDBACK_REPLIED: 'mdi-reply-outline',
  STUDENT_EXAM_COMPLETED: 'mdi-clipboard-check-outline',
  NEW_FEATURE: 'mdi-star-outline',
  KNOWN_BUG: 'mdi-bug-outline',
  ACCOUNT_EXPIRING: 'mdi-clock-alert-outline',
}

const TYPE_COLORS = {
  EXAM_ASSIGNED: '#247ba0',
  FEEDBACK_RECEIVED: '#3a9989',
  ACCOUNT_CREATED: '#be1898',
  COHORT_ACCOUNT_OPENED: '#f9ac34',
  EXAM_UNLOCKED: '#5b8c5a',
  EXAM_SANDBOX_ENABLED: '#247ba0',
  EXAM_SANDBOX_DISABLED: '#b5651d',
  FEEDBACK_REPLIED: '#3a9989',
  STUDENT_EXAM_COMPLETED: '#247ba0',
  NEW_FEATURE: '#f9ac34',
  KNOWN_BUG: '#e0556e',
  ACCOUNT_EXPIRING: '#f9ac34',
}

export default {
  name: 'NotificationBell',
  data() {
    return {
      open: false,
      loading: false,
    }
  },
  computed: {
    ...mapState('notificationService', ['unreadCount', 'notifications']),
    ...mapGetters('notificationService', ['hasUnread']),
    displayCount() {
      return this.unreadCount > 99 ? '99+' : String(this.unreadCount)
    },
    previewNotifications() {
      return (this.notifications || []).slice(0, 8)
    },
  },
  watch: {
    open(val) {
      if (val) {
        this.loadPreview()
      }
    },
  },
  methods: {
    ...mapActions('notificationService', ['fetchNotifications', 'markAsRead', 'markAllAsRead']),

    async loadPreview() {
      this.loading = true
      try {
        await this.fetchNotifications({ page: 1, limit: 8 })
      } finally {
        this.loading = false
      }
    },

    async onClickNotification(notif) {
      if (!notif.isRead) {
        await this.markAsRead(notif.id)
      }
      this.open = false
      if (notif.deepLink) {
        this.$router.push(notif.deepLink).catch(() => {})
      }
    },

    goToNotifications() {
      this.open = false
      this.$router.push('/notifications').catch(() => {})
    },

    typeIcon(type) {
      return TYPE_ICONS[type] || 'mdi-bell-outline'
    },

    typeColor(type) {
      return TYPE_COLORS[type] || '#247ba0'
    },

    relativeTime(dateStr) {
      return moment(dateStr).fromNow()
    },
  },
}
</script>

<style lang="scss" scoped>
.notification-bell-btn {
  transition: color 0.2s ease;

  &.bell-active .v-icon {
    color: #247ba0 !important;
  }
}

.bell-ring {
  animation: bell-swing 0.6s ease-in-out;
  transform-origin: top center;
}

@keyframes bell-swing {
  0%, 100% { transform: rotate(0deg); }
  20%       { transform: rotate(12deg); }
  40%       { transform: rotate(-10deg); }
  60%       { transform: rotate(8deg); }
  80%       { transform: rotate(-5deg); }
}

.notification-panel {
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18) !important;

  &__header {
    background: linear-gradient(135deg, #247ba0 0%, #03b5aa 100%);
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.3px;
  }

  &__mark-all-btn {
    color: rgba(255, 255, 255, 0.85) !important;

    &:hover {
      color: #fff !important;
    }
  }

  &__loading {
    padding: 8px 0;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 36px 16px;
    text-align: center;
  }

  &__list {
    max-height: 380px;
    overflow-y: auto;
  }

  &__footer {
    background: #f8fafc;
  }

  &__view-all-btn {
    font-size: 13px;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
  }
}

.notification-item {
  cursor: pointer;
  transition: background 0.15s ease;
  min-height: 64px;
  padding: 10px 16px;

  &--unread {
    background-color: rgba(36, 123, 160, 0.06) !important;
  }

  &:hover {
    background-color: rgba(36, 123, 160, 0.1) !important;
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__title {
    font-size: 13px !important;
    font-weight: 600 !important;
    white-space: normal !important;
    line-height: 1.4 !important;
  }

  &__message {
    font-size: 12px !important;
    white-space: normal !important;
    line-height: 1.3 !important;
    margin-top: 2px !important;
  }

  &__time {
    font-size: 11px !important;
    color: #a0aec0 !important;
    margin-top: 3px !important;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #247ba0;
    flex-shrink: 0;
  }
}
</style>
