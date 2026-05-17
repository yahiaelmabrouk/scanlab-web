<template>
  <div
    class="draggable"
    :style="{ top: posY + 'px', left: posX + 'px', zIndex: zIndex }"
    @mousedown="startDrag"
    @mousemove="drag"
    @mouseup="endDrag"
    @mouseleave="endDrag"
  >
    <div class="content">
      <div class="container">
        <div class="row">
          <div class="white-line"></div>
          <!-- Nayi white line -->
          <div class="line"></div>
          <div class="vertical-line"></div>
          <!-- Green line -->
          <v-select
            :items="RespirationItems1"
            v-model="selectedItem1"
            color="#423c3c"
            dense
            outlined
            style="margin-left: 70%"
            class="position"
          ></v-select>
        </div>
        <div class="row">
          <div class="white-line"></div>
          <!-- Nayi white line -->
          <div class="line"></div>
          <div class="vertical-line"></div>
          <!-- Green line -->
          <v-select
            :items="RespirationItems2"
            v-model="selectedItem2"
            color="#423c3c"
            dense
            outlined
            style="margin-left: 70%"
            class="position"
          ></v-select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RespirationWaveform',
  data() {
    return {
      dragging: false,
      posX: 1420,
      posY: 840,
      mouseX: 0,
      mouseY: 0,
      zIndex: 1000,
      RespirationItems1: ['Respiration', 'Option 2', 'Option 3'],
      selectedItem1: 'Respiration',
      RespirationItems2: ['Respiration', 'Option 2', 'Option 3'],
      selectedItem2: 'Respiration',
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
      if (!this.dragging) return
      // Calculate the new position
      const deltaX = e.clientX - this.mouseX
      const deltaY = e.clientY - this.mouseY
      // Update the component position
      this.posX += deltaX
      this.posY += deltaY
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
      // Close button functionality
      console.log('Close button clicked')
    },
    closeButton() {
      // Close button functionality
      console.log('Close button clicked')
    },
    help() {
      // Help button functionality
      console.log('Help button clicked')
    },
  },
}
</script>

<style scoped>
.draggable {
  position: absolute;
  width: 17%;
  background-color: #888686;
  border: 1px solid #787878;
  cursor: grab;
}

.draggable:active {
  cursor: grabbing;
}
.header {
  cursor: move;
  padding: 4px;
  background-color: #0b0f70;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  height: 20px;
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
body {
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.container {
  width: 100%;
  border: 1px solid #444;
  background-color: #000;
}
.row {
  display: flex;
  align-items: center;
  border-top: 1px solid #444;
  height: 40px;
  position: relative;
}
.line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #00ff00;
  top: 50%;
  width: 68%;
}
.white-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: white;
  top: 0%;
  width: 100%;
}
.vertical-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: white; /* White vertical line */
  left: 68%; /* Dropdown aur line ke beech mein rakhne ke liye */
}

::v-deep .theme--light.v-select .v-select__selections {
  font-size: 12px !important;
}
.v-select.v-input--dense .v-select__selection--comma {
  margin: 0;
}
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
::v-deep .v-text-field__details {
  display: none;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}
::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}
::v-deep .v-input__icon {
  height: 11px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
}

::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-text-field.v-text-field--enclosed .v-text-field__details {
  margin-bottom: 0px;
}

.v-text-field {
  padding-top: 0px;
  margin-top: 0px;
}
::v-deep .v-input__slot fieldset {
  background: white !important;
  border-color: white !important;
  border-radius: 0px;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  font-size: 17px;
}
.v-input {
  max-width: 30%;
  border-radius: 0px;
}

::v-deep .v-text-field input {
  padding: 0px;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: 0px !important;
}
::v-deep .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__append-inner {
  margin-top: 5px !important;
}

::v-deep .v-input__append-inner {
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}
</style>
