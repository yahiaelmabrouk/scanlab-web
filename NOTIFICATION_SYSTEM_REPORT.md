# Notification System — Frontend Technical Report

**Project:** ScanLab Web  
**Framework:** Vue 2.6 + Vuex + Vuetify  
**Date:** 2026-05-21

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [State Management](#state-management)
5. [Real-Time Mechanism](#real-time-mechanism)
6. [API Integration](#api-integration)
7. [UI Components](#ui-components)
8. [Notification Types](#notification-types)
9. [Multi-Channel Preferences](#multi-channel-preferences)
10. [Routing](#routing)
11. [Toast Notifications](#toast-notifications)
12. [Feature Summary](#feature-summary)

---

## Overview

The notification system provides users with real-time (polling-based) updates about platform events such as exam assignments, feedback received, and account changes. It is composed of three major functional areas:

- **In-app notification center** — A dropdown bell menu in the navbar and a dedicated full-page view
- **Notification preferences** — A settings page where users control which events trigger which channels (in-app, email, SMS)
- **Toast notifications** — Ephemeral pop-up alerts triggered by frontend actions

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          NavBar.vue                         │
│  ┌─────────────┐    starts/stops polling on mount/destroy   │
│  │ NotificationBell.vue │◄──── Vuex: notificationService   │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Vuex Module: notificationService.js                       │
│                                                             │
│  State:  unreadCount, notifications[], preferences[], ...   │
│  Actions: fetchUnreadCount, fetchNotifications,             │
│           markAsRead, markAllAsRead, fetchPreferences,      │
│           savePreferences, fetchPhoneStatus, setPhoneNumber │
│  Polling: setInterval(fetchUnreadCount, 30_000)             │
└────────────────┬────────────────┘
                 │  HTTP REST
                 ▼
         Backend API Endpoints
```

---

## File Structure

| File | Role |
|------|------|
| `src/store/notificationService.js` | Vuex module — all notification state, actions, mutations, polling logic |
| `src/components/NotificationBell.vue` | Navbar dropdown with unread badge, preview list, and deep-link navigation |
| `src/views/Notifications.vue` | Full-page paginated notification list with mark-as-read controls |
| `src/views/NotificationPreferences.vue` | Preferences settings — channel toggles and phone number management |
| `src/components/NavBar.vue` | Mounts/unmounts polling lifecycle; hosts `<NotificationBell>` |
| `src/store/store.js` | Registers `notificationService` as a named Vuex module |
| `src/main.js` | Registers `vue-notification` plugin globally |
| `src/App.vue` | Renders the root `<notifications>` component for toasts |
| `src/router/index.js` | Defines `/notifications` and `/notification-preferences` routes |

---

## State Management

The entire notification state lives in a dedicated Vuex module (`notificationService`).

### State Shape

```javascript
{
  unreadCount: Number,          // Badge count shown in navbar
  notifications: Array,         // Loaded notification objects
  total: Number,                // Total available on server
  currentPage: Number,          // Pagination cursor
  totalPages: Number,           // Total pages available
  loading: Boolean,             // Loading indicator for the list
  preferences: Array,           // Per-event, per-channel toggles
  preferencesLoading: Boolean,  // Loading state for preferences form
  phoneStatus: Object,          // { phoneNumber, countryCode }
  _pollIntervalId: Number       // Internal interval reference
}
```

### Notification Object Shape

```javascript
{
  id: String,
  title: String,
  message: String,
  type: String,       // EXAM_ASSIGNED | FEEDBACK_RECEIVED | ACCOUNT_CREATED | COHORT_ACCOUNT_OPENED
  isRead: Boolean,
  createdAt: String,  // ISO timestamp
  deepLink: String    // Optional route path for navigation
}
```

### Vuex Actions

| Action | Description |
|--------|-------------|
| `fetchUnreadCount` | Polls the server for unread count; silently fails on error |
| `fetchNotifications(page)` | Loads paginated notifications (limit: 20/page) |
| `markAsRead(id)` | Marks a single notification as read |
| `markAllAsRead` | Bulk-marks all notifications as read |
| `fetchPreferences` | Loads per-channel, per-event preference toggles |
| `savePreferences(prefs)` | Saves updated preference configuration |
| `fetchPhoneStatus` | Fetches the user's registered phone number |
| `setPhoneNumber(payload)` | Registers or updates the user's phone number |
| `startPolling` | Starts a 30-second `setInterval` for `fetchUnreadCount` |
| `stopPolling` | Clears the polling interval on logout/destroy |

---

## Real-Time Mechanism

The system uses **HTTP long-polling** (not WebSocket or SSE) to keep the unread count up to date.

### How It Works

1. `NavBar.vue` calls `startPolling()` in its `mounted()` lifecycle hook.
2. `startPolling()` immediately calls `fetchUnreadCount()` and then starts a `setInterval` with a **30-second** interval.
3. Each tick sends a `GET /api/notifications/unread-count` request.
4. On success, `unreadCount` in the Vuex store is updated, and the bell badge re-renders reactively.
5. On error, failures are swallowed silently so background polling does not disrupt the user experience.
6. `NavBar.vue` calls `stopPolling()` in `beforeDestroy()` to clear the interval when the user logs out.

### Polling Lifecycle

```
User logs in ──► NavBar mounted ──► startPolling()
                                        │
                                   every 30 sec
                                        │
                                   fetchUnreadCount()
                                        │
                               [silent error handling]
                                        │
User logs out ──► NavBar destroyed ──► stopPolling()
```

---

## API Integration

All API calls are made through the project's shared HTTP client (Axios wrapper).

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `notifications/unread-count` | Returns `{ count: Number }` — polling target |
| `GET` | `notifications?page=N&limit=20` | Returns paginated notification list |
| `PATCH` | `notifications/{id}/read` | Marks a single notification as read |
| `PATCH` | `notifications/read-all` | Marks all notifications as read |
| `GET` | `notification-preferences` | Fetches user's preference matrix |
| `PUT` | `notification-preferences` | Saves updated preference matrix |
| `GET` | `phone/status` | Returns current phone number and country code |
| `POST` | `phone/set` | Registers or updates phone number |

---

## UI Components

### 1. NotificationBell (`NotificationBell.vue`)

The primary entry point for in-app notifications, rendered in the top navbar.

**Features:**
- **Unread badge**: Displays the unread count using Vuetify's `v-badge`. Shows raw number up to 99, then "99+" for 100 or more.
- **Bell-ring animation**: The bell icon animates when new notifications arrive (CSS keyframe animation triggered by unread count changes).
- **Dropdown preview**: Shows the 8 most recent notifications with type icons, colored borders, and relative timestamps.
- **One-click navigation**: Clicking a notification marks it as read and follows its `deepLink` route if present.
- **"View all" link**: Navigates to the full `/notifications` page.
- **On-open fetch**: The dropdown calls `loadPreview()` to refresh the notification list whenever it is opened.

### 2. Notifications Page (`Notifications.vue`)

A dedicated full-page view for browsing all notifications.

**Features:**
- **Paginated list**: Loads 20 notifications per page with a "Load more" button.
- **Mark all as read**: Single-click action to bulk-mark all notifications as read.
- **Unread indicators**: Unread notifications are visually distinguished (bold title, colored left border, dot indicator).
- **Relative timestamps**: Uses `moment.js` to display human-friendly times ("2 hours ago", "yesterday").
- **Empty state**: A centered icon and message when no notifications exist.
- **Skeleton loaders**: Placeholder animation while notifications are loading.
- **Preferences shortcut**: Link to navigate to the preferences settings page.

### 3. NotificationPreferences Page (`NotificationPreferences.vue`)

A settings page for controlling notification delivery behavior.

**Features:**
- **Channel toggles**: Three delivery channels — `In-App`, `Email`, `SMS` — each independently togglable per event type.
- **Event types**: Three configurable event types: `EXAM_ASSIGNED`, `FEEDBACK_RECEIVED`, `COHORT_ACCOUNT_OPENED`.
- **Phone number management**: 
  - Displays masked phone number (e.g., `+1 ••••••1234`) when registered.
  - Form to set/update phone number with separate fields for country code and phone digits.
  - Client-side validation: country code ≥ 1 character, digits ≥ 7 characters.
- **Save state**: Loading state on the save button with success/error feedback.

---

## Notification Types

Four event types are supported, each with a distinct icon and color:

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| `EXAM_ASSIGNED` | `mdi-clipboard-text` | `#247ba0` (blue) | A new exam has been assigned to the user |
| `FEEDBACK_RECEIVED` | `mdi-message-text` | `#3a9989` (teal) | Feedback was received on a submission |
| `ACCOUNT_CREATED` | `mdi-account-plus` | `#be1898` (magenta) | A new account was created |
| `COHORT_ACCOUNT_OPENED` | `mdi-account-group` | `#f9ac34` (gold) | A cohort account was opened |

---

## Multi-Channel Preferences

The preferences system allows fine-grained control over notification delivery.

### Preference Matrix

Each combination of **event type** × **channel** has an independent `enabled` boolean:

```
                 in-app    email    sms
EXAM_ASSIGNED    [  ✓  ]   [  ✓  ]  [     ]
FEEDBACK_RECEIVED[  ✓  ]   [     ]  [     ]
COHORT_ACCOUNT_OPENED[ ✓ ] [  ✓  ]  [  ✓  ]
```

### Phone Number Flow

1. User opens Notification Preferences.
2. System fetches phone status via `GET phone/status`.
3. If a number is registered, it is shown masked.
4. User can enter a new number (country code + digits fields).
5. On submit, `POST phone/set` is called with the validated data.
6. Success reloads the phone status to confirm the update.

---

## Routing

Both notification-related views are protected routes requiring authentication:

| Path | Component | Guard |
|------|-----------|-------|
| `/notifications` | `Notifications.vue` | `requireLogin` |
| `/notification-preferences` | `NotificationPreferences.vue` | `requireLogin` |

Deep links embedded in notification objects can route users directly to relevant content in the application (e.g., a specific exam or feedback page).

---

## Toast Notifications

Separate from the in-app notification center, the project uses the `vue-notification` library for transient toast messages.

- **Plugin**: `vue-notification` (registered globally in `main.js`)
- **Position**: Bottom-right corner of the screen
- **Usage**: Triggered via `this.$notify({ type, title, text })` from any component or Vuex action on API success/error events
- **Render point**: `<notifications position="bottom right" />` in `App.vue`

Toasts are used for immediate UI feedback (e.g., "Preferences saved", "Error loading notifications") and are **separate from the persistent notification feed**.

---

## Feature Summary

| Feature | Implementation |
|---------|----------------|
| Real-time unread count | HTTP polling every 30 seconds via `setInterval` |
| Unread badge | Vuetify `v-badge` with "99+" overflow handling |
| Bell animation | CSS keyframe animation on new notifications |
| Notification dropdown | `NotificationBell.vue` — top 8 preview + deep links |
| Full notification list | `Notifications.vue` — paginated, load-more pattern |
| Mark as read (single) | `PATCH notifications/{id}/read` |
| Mark all as read | `PATCH notifications/read-all` |
| Delivery channel control | Per-event toggles for in-app, email, SMS |
| Phone number management | Country code + digits form with masked display |
| Relative timestamps | `moment.js` — "X minutes ago" format |
| Skeleton loaders | Loading placeholders in list view |
| Empty state | Icon + message when no notifications exist |
| Toast alerts | `vue-notification` library — bottom-right toasts |
| Deep linking | Notifications route to relevant app content |
| Polling lifecycle | Started on NavBar mount, stopped on destroy |
| Silent polling errors | Background failures do not surface to the user |
| Route protection | Both routes guarded by `requireLogin` |
