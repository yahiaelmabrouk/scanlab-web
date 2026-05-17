<template>
  <v-overlay v-model="isLoading" class="loading-overlay">
    <div class="loading-text">
      <span>{{ message }}</span>
      <span class="dots">
        <span v-for="dot in 3" :key="dot" class="dot">.</span>
      </span>
    </div>
  </v-overlay>
</template>

<script>
import EventBus from '@/lib/event-bus'

export default {
  name: 'LoadingDots',
  data() {
    return {
      isLoading: false, // Tracks whether the overlay is visible
      message: 'Reconnecting', // Reactive message variable
    }
  },
  mounted() {
    // Listen for events to show or hide the animation
    EventBus.$on('SHOW_LOADING', this.showLoading)
    EventBus.$on('HIDE_LOADING', this.hideLoading)
    this.startDotAnimation()
  },
  beforeDestroy() {
    // Clean up listeners and intervals
    EventBus.$off('SHOW_LOADING', this.showLoading)
    EventBus.$off('HIDE_LOADING', this.hideLoading)
    clearInterval(this.dotInterval)
  },
  methods: {
    showLoading(payload) {
      this.isLoading = true
      this.message = payload?.message || this.message
    },
    hideLoading() {
      this.isLoading = false
    },
    startDotAnimation() {
      let dotCount = 0
      this.dotInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4 // Cycle through 0, 1, 2, 3 dots
        const dots = document.querySelectorAll('.dot')
        dots.forEach((dot, index) => {
          dot.style.opacity = index < dotCount ? '1' : '0.2'
        })
      }, 500) // Change dots every 500ms
    },
  },
}
</script>

<style scoped>
.loading-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-text {
  font-size: 2rem;
  /* font-weight: bold; */
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8); /* Add a shadow to enhance contrast */
  display: flex;
  align-items: center;
  gap: 5px;
}

.dots {
  display: flex;
  align-items: center;
}

.dot {
  font-size: 2.5rem;
  /* font-weight: bold; */
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  transition: opacity 0.3s;
  position: relative;
  top: -0.1em;
}
</style>
