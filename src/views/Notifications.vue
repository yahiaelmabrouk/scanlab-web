<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-container fluid class="notifications-page pa-4 pa-md-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between flex-wrap mb-4" style="gap: 12px;">
      <div class="d-flex align-center" style="gap: 12px;">
        <v-icon size="28" color="primary">mdi-bell-outline</v-icon>
        <h1 class="notifications-page__title">Notifications</h1>
        <v-chip v-if="unreadCount > 0" color="error" small dark class="font-weight-bold">
          {{ unreadCount }} unread
        </v-chip>
      </div>

      <div class="d-flex align-center" style="gap: 8px;">
        <v-btn
          outlined
          small
          color="primary"
          :disabled="unreadCount === 0 || markingAll"
          :loading="markingAll"
          @click="onMarkAllAsRead"
        >
          <v-icon left small>mdi-check-all</v-icon>
          Mark all as read
        </v-btn>
        <v-btn outlined small color="grey darken-1" to="/notification-preferences">
          <v-icon left small>mdi-tune</v-icon>
          Preferences
        </v-btn>
      </div>
    </div>

    <v-divider class="mb-4"></v-divider>

    <!-- Loading (first load) -->
    <div v-if="loading && safeNotifications.length === 0">
      <v-skeleton-loader
        v-for="i in 6"
        :key="i"
        type="list-item-avatar-two-line"
        class="mb-2"
        elevation="1"
        style="border-radius: 10px;"
      ></v-skeleton-loader>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && safeNotifications.length === 0" class="notifications-page__empty">
      <v-icon size="72" color="grey lighten-2">mdi-bell-off-outline</v-icon>
      <h3 class="mt-4 grey--text text--darken-1">You're all caught up!</h3>
      <p class="grey--text">No notifications to show.</p>
    </div>

    <!-- Notification list -->
    <v-card v-else class="notifications-card" elevation="2">
      <v-list two-line class="pa-0">
        <template v-for="(notif, index) in safeNotifications">
          <v-list-item
            :key="notif.id"
            :class="['notif-row', { 'notif-row--unread': !notif.isRead }]"
            @click="onClickNotification(notif)"
          >
            <!-- Type avatar -->
            <v-list-item-avatar size="44" :color="typeColor(notif.type)">
              <v-icon color="white">{{ typeIcon(notif.type) }}</v-icon>
            </v-list-item-avatar>

            <!-- Content -->
            <v-list-item-content>
              <v-list-item-title :class="['notif-row__title', { 'font-weight-bold': !notif.isRead }]">
                {{ notif.title }}
              </v-list-item-title>
              <v-list-item-subtitle class="notif-row__message">
                {{ notif.message }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="notif-row__time">
                <v-icon x-small color="grey lighten-1" style="vertical-align: middle;">mdi-clock-outline</v-icon>
                {{ relativeTime(notif.createdAt) }}
              </v-list-item-subtitle>
            </v-list-item-content>

            <!-- Unread dot + actions -->
            <v-list-item-action class="notif-row__actions d-flex flex-column align-center" style="gap: 6px;">
              <div v-if="!notif.isRead" class="notif-row__dot"></div>
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <v-btn
                    icon
                    x-small
                    v-on="on"
                    @click.stop="onMarkOneRead(notif)"
                    v-if="!notif.isRead"
                    color="primary"
                  >
                    <v-icon x-small>mdi-check</v-icon>
                  </v-btn>
                </template>
                <span>Mark as read</span>
              </v-tooltip>
            </v-list-item-action>
          </v-list-item>
          <v-divider v-if="index < safeNotifications.length - 1" :key="`d-${notif.id}`" inset></v-divider>
        </template>
      </v-list>
    </v-card>

    <!-- Load more -->
    <div v-if="canLoadMore" class="d-flex justify-center mt-4">
      <v-btn
        outlined
        color="primary"
        :loading="loading"
        @click="loadMore"
        class="notifications-page__load-more"
      >
        <v-icon left>mdi-chevron-down</v-icon>
        Load more
      </v-btn>
    </div>

    <!-- Pagination info -->
    <div v-if="total > 0" class="text-center mt-3 grey--text caption">
      Showing {{ safeNotifications.length }} of {{ total }} notifications
    </div>
  </v-container>
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

const TYPE_LABELS = {
  EXAM_ASSIGNED: 'Exam',
  FEEDBACK_RECEIVED: 'Feedback',
  ACCOUNT_CREATED: 'Account',
  COHORT_ACCOUNT_OPENED: 'Cohort',
  EXAM_UNLOCKED: 'Unlocked',
  EXAM_SANDBOX_ENABLED: 'Sandbox',
  EXAM_SANDBOX_DISABLED: 'Sandbox',
  FEEDBACK_REPLIED: 'Reply',
  STUDENT_EXAM_COMPLETED: 'Exam',
  NEW_FEATURE: 'Feature',
  KNOWN_BUG: 'Issue',
  ACCOUNT_EXPIRING: 'Expiry',
}

export default {
  name: 'Notifications',

  data() {
    return {
      markingAll: false,
    }
  },

  computed: {
    ...mapState('notificationService', ['notifications', 'loading', 'total', 'currentPage', 'totalPages', 'unreadCount']),
    ...mapGetters('notificationService', ['canLoadMore']),
    safeNotifications() {
      return this.notifications || []
    },
  },

  mounted() {
    this.fetchNotifications({ page: 1, limit: 20 })
  },

  methods: {
    ...mapActions('notificationService', ['fetchNotifications', 'markAsRead', 'markAllAsRead']),

    async onClickNotification(notif) {
      if (!notif.isRead) {
        await this.markAsRead(notif.id)
      }
    },

    async onMarkOneRead(notif) {
      if (!notif.isRead) {
        await this.markAsRead(notif.id)
      }
    },

    async onMarkAllAsRead() {
      this.markingAll = true
      try {
        await this.markAllAsRead()
        this.$notify({ type: 'success', text: 'All notifications marked as read' })
      } finally {
        this.markingAll = false
      }
    },

    loadMore() {
      this.fetchNotifications({ page: this.currentPage + 1, limit: 20 })
    },

    typeIcon(type) {
      return TYPE_ICONS[type] || 'mdi-bell-outline'
    },

    typeColor(type) {
      return TYPE_COLORS[type] || '#247ba0'
    },

    typeLabel(type) {
      return TYPE_LABELS[type] || type
    },

    relativeTime(dateStr) {
      return moment(dateStr).fromNow()
    },
  },
}
</script>

<style lang="scss" scoped>
.notifications-page {
  max-width: 800px;
  margin: 0 auto;

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: #071920;
    line-height: 1.2;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 16px;
    text-align: center;
  }

  &__load-more {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
  }
}

.notifications-card {
  border-radius: 12px !important;
  overflow: hidden;
}

.notif-row {
  cursor: pointer;
  transition: background 0.15s ease;
  padding: 12px 16px;
  min-height: 72px;

  &--unread {
    background-color: rgba(36, 123, 160, 0.06) !important;
  }

  &:hover {
    background-color: rgba(36, 123, 160, 0.1) !important;
  }

  &__title {
    font-size: 14px !important;
    white-space: normal !important;
    line-height: 1.4 !important;
  }

  &__message {
    font-size: 13px !important;
    white-space: normal !important;
    line-height: 1.35 !important;
    margin-top: 3px !important;
  }

  &__time {
    font-size: 11px !important;
    color: #a0aec0 !important;
    margin-top: 4px !important;
  }

  &__actions {
    min-width: 28px;
  }

  &__dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background-color: #247ba0;
    flex-shrink: 0;
  }
}
</style>
