<template>
  <div
    class="draggable"
    :style="{ top: posY + 'px', left: posX + 'px', zIndex: zIndex }"
    @mousedown="startDrag"
    @mousemove="drag"
    @mouseup="endDrag"
    @mouseleave="endDrag"
  >
    <div class="header">
      ProgStep: 6

      <button class="close-btn btn-2" @click="close">&times;</button>
    </div>

    <div class="content">
      <v-card class="scan"> </v-card>

      <div class="grid-container">
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/xo.png" width="20px" height="20px" />
        </v-btn>

        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/triangle.png" width="20px" height="20px" />
        </v-btn>

        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/cross-one.png" width="20px" height="20px" />
        </v-btn>

        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/scan.png" width="20px" height="20px" />
        </v-btn>

        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/pin.png" width="20px" height="20px" />
        </v-btn>

        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/list.png" width="20px" height="20px" />
        </v-btn>

        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/volumeview.png" width="20px" height="20px" />
        </v-btn>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      dragging: false,
      posX: 800,
      posY: 150,
      mouseX: 800,
      mouseY: 150,
      zIndex: 1,
    }
  },
  methods: {
    startDrag(e) {
      // Enable dragging and store initial mouse position
      this.dragging = true
      this.mouseX = e.clientX
      this.mouseY = e.clientY

      window.addEventListener('mousemove', this.drag)
      window.addEventListener('mouseup', this.endDrag)
    },
    drag(e) {
      // Only move when dragging is true
      if (!this.dragging) return

      // Calculate the new position
      const deltaX = e.clientX - this.mouseX
      const deltaY = e.clientY - this.mouseY

      // Update the component position
      this.posX = Math.min(100, Math.max(0, this.posX + (deltaX / window.innerWidth) * 100))
      this.posY = Math.min(100, Math.max(0, this.posY + (deltaY / window.innerHeight) * 100))

      // Update mouse position for the next movement
      this.mouseX = e.clientX
      this.mouseY = e.clientY
    },
    endDrag() {
      // Stop dragging
      this.dragging = false
      window.removeEventListener('mousemove', this.drag)
      window.removeEventListener('mouseup', this.endDrag)
    },
    close() {
      this.$emit('close')
      console.log('Close button clicked!')
    },
  },
}
</script>

<style scoped>
.draggable {
  position: absolute;
  width: fit-content;
  background-color: #888686;
  border: 1px solid #787878;
}

.header {
  cursor: move;
  padding: 2px;
  background-color: #0b0f70;
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
  padding: 10px;
  background-color: rgb(188 186 186);
  padding: 3px;
}
.grid-container {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1px;
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
  height: 30px !important;
  min-width: 30px !important;
  width: 0px;
  background-color: #bcbaba !important;
  border-top: 1px solid white;
  border-left: 1px solid white;
  border-bottom: 1px solid black;
  border-right: 1px solid black;
}
.scan {
  width: 100%;
  height: 20rem;
  background: black !important;
  border: 1px solid #5a5252 !important;
  border-bottom: 0px !important;
  border-right: 0px !important;
  border-radius: 0px !important;
  border-width: 1px !important;
}
</style>
