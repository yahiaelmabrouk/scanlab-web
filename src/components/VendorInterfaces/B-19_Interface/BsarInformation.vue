<!-- eslint-disable vue-i18n/no-raw-text -->
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
      SAR Information
      <button class="close-btn btn-2" @click="close"><span>&times;</span></button>
    </div>

    <div class="content">
      <div class="container">
        <div class="mb-4 curretTital mode-title">
          <span class="label">Current operating mode:</span>
          <span class="value">
            {{ selectedMode === 'normal' ? 'Normal mode (NM)' : 'First level (FL)' }}
          </span>
        </div>
        <div class="mode-section">
          <div>Operating mode for the next measurement:</div>
          <div class="mode-buttons ml-2">
            <button class="retro-button" :class="{ active: selectedMode === 'normal' }" @click="setMode('normal')">
              Normal mode
            </button>
            <button class="retro-button" :class="{ active: selectedMode === 'first' }" @click="setMode('first')">
              First level
            </button>
          </div>
        </div>

        <div class="values-section">
          <div class="title mr-10">Displayed values belong to the current patient:</div>
          <div class="values">
            <div class="value-row">
              <label>Whole Body</label>
              <input type="text" v-model="values.wholeBody" />
              <span>[%]</span>
            </div>
            <div class="value-row">
              <label>Exposed Body</label>
              <input type="text" v-model="values.exposedBody" />
              <span>[%]</span>
            </div>
            <div class="value-row">
              <label>Head</label>
              <input type="text" v-model="values.head" />
              <span>[%]</span>
            </div>
            <div class="value-row">
              <label>Head Local</label>
              <input type="text" v-model="values.headLocal" />
              <span>[%]</span>
            </div>
            <div class="value-row">
              <label>Torso Local</label>
              <input type="text" v-model="values.torsoLocal" />
              <span>[%]</span>
            </div>
            <div class="value-row">
              <label>Legs Local</label>
              <input type="text" v-model="values.legsLocal" />
              <span>[%]</span>
            </div>
            <div class="value-row">
              <label>B1+ rms</label>
              <input type="text" v-model="values.b1Rms" />
              <span>[%]</span>
            </div>
          </div>
          <div class="calculation-time">Calculation time: 12:09:25</div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-label">Whole Body [W/kg]</div>
          <div class="progress-bar">
            <div class="progress-bar-fill" :style="{ width: progressBarWidth + '%' }"></div>
          </div>
          <div class="progress-bar-values">
            <span class="progress-bar-value-left">0.0</span>
            <span class="progress-bar-value-right-top">0.9</span>
            <span class="progress-bar-value-right-bottom">0.9</span>
          </div>
        </div>

        <div class="tabs">
          <div class="tab btn-3" :class="{ active: activeTab === 'Prediction' }" @click="activeTab = 'Prediction'">
            Prediction
          </div>
          <div class="tab btn-3" :class="{ active: activeTab === 'Status' }" @click="activeTab = 'Status'">Status</div>
          <div class="tab btn-3" :class="{ active: activeTab === 'Patient' }" @click="activeTab = 'Patient'">
            Patient
          </div>
          <div class="tab btn-3" :class="{ active: activeTab === 'Protocol' }" @click="activeTab = 'Protocol'">
            Protocol
          </div>
          <div class="tab btn-3" :class="{ active: activeTab === 'Current' }" @click="activeTab = 'Current'">
            Current
          </div>
        </div>

        <div class="footer-buttons">
          <button class="retro-button" @click="closeButton">Close</button>
          <button class="retro-button" @click="help">Help</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dragging: false,
      posX: 100,
      posY: 100,
      mouseX: 0,
      mouseY: 0,
      zIndex: 1000,
      values: {
        wholeBody: 100,
        exposedBody: 67,
        head: 0,
        headLocal: 0,
        torsoLocal: 0,
        legsLocal: 0,
        b1Rms: 47,
      },
      progressBarWidth: 100,
      activeTab: 'Prediction',
      selectedMode: 'normal',
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
      this.$emit('close')
      console.log('Close button clicked')
    },
    closeButton() {
      // Close button functionality
      this.$emit('close')
      console.log('Close button clicked')
    },
    help() {
      // Help button functionality
      console.log('Help button clicked')
    },
    setMode(mode) {
      this.selectedMode = mode
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
  cursor: grab;
}

.draggable:active {
  cursor: grabbing;
}

::v-deep .v-application .title {
  font-size: 1rem !important;
  margin-right: 10% !important;
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

.curretTital {
  margin-right: 40%;
}

.content {
  padding: 10px;
  background-color: rgb(188 186 186);
  padding: 3px;
}

.container {
  border: 2px solid #a0a0a0;
  background-color: #e0e0e0;
  padding: 20px;
  position: relative;
  font-family: Arial, sans-serif;
}

.title {
  font-weight: bold;
  margin-bottom: 10px;
}

.mode-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.mode-buttons {
  display: flex;
  gap: 10px;
}

.values-section {
  padding: 15px;
  margin-bottom: 20px;
}

.values {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.value-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 5px;
  margin-right: 25%;
}

.value-row label {
  width: 150px;
  text-align: right;
  padding-right: 5px;
}

.value-row input {
  width: 28%;
  background-color: #d3d3d3;
  border: 1px solid #a0a0a0;
  text-align: left;
  color: black;
}

.calculation-time {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
}

.progress-bar-container {
  margin-top: 20px;
  display: flex;
  justify-content: space-evenly;
  gap: 0px;
}

.progress-bar-label {
  margin-bottom: 10px;
}

.progress-bar {
  width: 50%;
  height: 20px;
  background-color: #e0e0e0;
  border: 1px solid #a0a0a0;
  position: relative;
  margin-right: 10%;
}

.progress-bar-fill {
  height: 100%;
  background-color: #00b300;
  position: absolute;
}

.progress-bar-values {
  position: absolute;
  width: 100%;
  top: 80%;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #000;
}

.progress-bar-value-left {
  position: absolute;
  bottom: -20px;
  left: 35%;
}

.progress-bar-value-right-top {
  position: absolute;
  top: -50px;
  right: 18%;
}

.progress-bar-value-right-bottom {
  position: absolute;
  top: 2px;
  right: 18%;
}

.tabs {
  display: flex;
  justify-content: flex-start;
  margin-top: 20px;
  background: #ababab;
  width: 100%;
}

.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: #c0c0c0 !important;
}

.retro-button {
  background-color: #d3d3d3;
  font-size: 15px;
  text-align: center;
  color: black;
  width: 150px;
  height: 35px;
  cursor: pointer;
  border: none;

  /* 3D Border Styling */
  border-top: 2px solid white;
  border-left: 2px solid white;
  border-bottom: 2px solid black;
  border-right: 2px solid black;

  transition: all 0.2s ease;
}

.retro-button.active {
  background-color: #ffffff;
  border-top: 2px solid black;
  border-left: 2px solid black;
  border-bottom: 2px solid white;
  border-right: 2px solid white;
}

.retro-button:active {
  background-color: #b0b0b0;
  border-top: 2px solid black;
  border-left: 2px solid black;
  border-bottom: 2px solid white;
  border-right: 2px solid white;
}

.tab {
  padding: 2px;
  background: #c6c6c6;
  border: 1px solid #a0a0a0;
  height: 25px;
  color: #606060;
  border-radius: 0;
  font-size: 12px;
  width: 17%;
  text-align: center;
  text-transform: capitalize;
  cursor: pointer;
}
.mode-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 24px;
}

.mode-title .label {
  white-space: nowrap;
}

.mode-title .value {
  min-width: 140px;
  display: inline-block;
}
.tab.active {
  background-color: #e0e0e0;
  color: #000;
  font-weight: bold;
}

.footer-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.footer-buttons button {
  padding: 5px 15px;
}
</style>
