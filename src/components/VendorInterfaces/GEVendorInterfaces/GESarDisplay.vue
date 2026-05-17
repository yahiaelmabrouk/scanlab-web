<template>
  <div
    ref="draggable"
    class="draggable"
    :style="{ top: posY + 'px', left: posX + 'px', zIndex: zIndex }"
    @mousedown="startDrag"
  >
    <div class="header">
      <v-icon icon="md:event"></v-icon>
      <span>SAR Display</span>
      <button class="close-btn btn-2" @click="close"><span>&times;</span></button>
    </div>

    <div class="content">
      <div class="grid-container">
        <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%">
          <span class="SARHeading">Avg W/kg:</span>
          <span>Limit W/kg:</span>
        </div>
        <div class="vertical-bar"></div>
        <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: center">
          <span class="SARHeading">10 sec</span>
          <v-btn class="custom-btn"></v-btn>
        </div>
        <div class="vertical-bar"></div>
        <div style="display: flex; flex-direction: column; flex-wrap: wrap">
          <span class="SARHeading">6 min</span>
          <v-btn class="custom-btn"></v-btn>
        </div>
        <div class="vertical-bar"></div>
        <div style="display: flex; flex-direction: column; flex-wrap: wrap">
          <span class="SARHeading">Room <sup>o</sup>C</span>
          <v-btn class="custom-btn"></v-btn>
        </div>
      </div>
      <div>
        <span style="font-size: 12px; color: white; display: flex">Act W/Kg</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dragging: false,
      posX: 0, // Default X position
      posY: 0, // Default Y position (initial position)
      offsetX: 0,
      offsetY: 0,
      zIndex: 1,
      initialPosY: 0, // Store the default Y position
      initialPosX: 0, // Store the default X position
    }
  },
  mounted() {
    this.initialPosY = this.posY // Store the initial position after mounting
    this.initialPosX = window.innerWidth - 370 // Set default X position to screen width
    this.posX = this.initialPosX // Ensure the draggable component starts at screen width
  },
  methods: {
    startDrag(e) {
      if (!e.target.closest('.header')) return
      this.dragging = true
      this.zIndex = 9999

      // Capture offset relative to element
      this.offsetX = e.clientX - this.$refs.draggable.offsetLeft
      this.offsetY = e.clientY - this.$refs.draggable.offsetTop

      window.addEventListener('mousemove', this.drag)
      window.addEventListener('mouseup', this.endDrag)
    },
    drag(e) {
      if (!this.dragging) return

      const newY = e.clientY - this.offsetY

      // Allow only upward movement from the initial position
      if (newY < this.initialPosY) {
        this.posY = newY
      }

      this.posX = e.clientX - this.offsetX
    },
    endDrag() {
      this.dragging = false
      this.zIndex = 1
      window.removeEventListener('mousemove', this.drag)
      window.removeEventListener('mouseup', this.endDrag)
    },
    close() {
      this.$emit('close')
    },
  },
}
</script>

<style scoped>
.draggable {
  position: absolute;
  width: 350px; /* Prevent unwanted size change */
  height: 150px;
  background-color: #888686;
  border: 1px solid #787878;
}

.header {
  cursor: grab;
  padding: 4px;
  background-color: #101d4a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  height: 20px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.content {
  /* padding: 10px; */
  background-color: #6875a2;
  height: 130px;
  padding: 12px;
}
.grid-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.grid-container img {
  max-width: 100%;
  max-height: 100%;
}
.btn-2 {
  width: 12px !important;
  height: 13px !important;
  padding: 0px !important;
  min-width: 16px !important;
  margin-right: 0rem !important;
  margin-bottom: 0rem !important;
  background: #c0c0c0 !important;
  border-radius: 0px;
  color: black !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
  background-color: #cac3c3 !important;
}
.custom-btn {
  height: 40px !important;
  min-width: 64px !important;
  width: 0px;
  background-color: #e7e2e2 !important;
}
.vertical-bar {
  width: 1px;
  height: 55px;
  background-color: #000;
  box-shadow: 3px 0 5px rgba(0, 0, 0, 0.5);
  margin-top: 1.4rem;
}
.SARHeading {
  font-weight: 800;
  font-family: sans-serif;
  font-size: 9px;
}
</style>
