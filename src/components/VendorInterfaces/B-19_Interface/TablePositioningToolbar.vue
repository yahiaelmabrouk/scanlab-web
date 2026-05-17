<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div
    class="draggable"
    :style="{ top: posY + 'px', left: posX + 'px' }"
    @mousedown="startDrag"
    @mousemove="drag"
    @mouseup="endDrag"
    @mouseleave="endDrag"
  >
    <div class="header">
      Table Positioning
      <button class="close-btn btn-2" @click="close">&times;</button>
    </div>
    <div class="content">
      <div class="table-positioning-container">
        <div class="positioning-panel">
          <div class="top-row">
            <div class="input-section">
              <div class="position-info">
                <label for="current-position">Current position</label>
                <div class="text-2">
                  <v-text-field v-model.number="sliceGroup" type="number" outlined dense class="mr-2"> </v-text-field>
                  <span>[mm]</span>
                </div>
              </div>
              <div class="move-info">
                <label for="move-by">Move table by</label>
                <div class="text-2" style="width: 82%">
                  <BspinButton class="input-lock mr-2" :step="1" :min="0" :max="100" />
                  <span>[mm]</span>
                </div>
              </div>
            </div>
            <div class="Twarning">
              <strong>Warning:</strong>
              <p>
                Inform the patient about remote table movement.<br />
                Monitor the patient during remote table movement.
              </p>
            </div>
          </div>
          <div class="second-row">
            <div class="first-col">
              <button class="retro-button ml-2">
                <img src="@/assets/siemens_img/mri_icon_arrows_brackets.png" />
              </button>
            </div>
            <div class="second-col ml-15">
              <button class="retro-button">
                <img src="@/assets/siemens_img/right_double_arrow.png" />
              </button>
              <button class="retro-button">
                <img src="@/assets/siemens_img/left_double_arrow.png" />
              </button>
            </div>
            <div class="third-col mr-10">
              <button class="retro-button">
                <img src="@/assets/siemens_img/mri_icon_central_line_arrows.png" />
              </button>
              <button class="retro-button">
                <img src="@/assets/siemens_img/button_icon.png" />
              </button>
            </div>
          </div>
          <div class="third-row mt-16">
            <div class="first-col ml-13"></div>
            <div class="second-col ml-16">
              <button class="retro-button">
                <img src="@/assets/siemens_img/mri_icon_arrows_brackets.png" />
              </button>
              <button class="retro-button">
                <img src="@/assets/siemens_img/mri_icon_central_line_arrows.png" />
              </button>
            </div>
            <div class="third-col mr-10">
              <button class="retro-button">
                <img src="@/assets/siemens_img/mri_icon_bed_arrows.png" />
              </button>
              <button class="retro-button">
                <img src="@/assets/siemens_img/mri_icon_bed_crossed_arrows.png" />
              </button>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="retro-button-close-help">Close</button>
          <button class="retro-button-close-help">Help</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BspinButton from '../B-19_Interface/BspinButton.vue'
export default {
  components: { BspinButton },
  data() {
    return {
      currentPosition: 4, // Default current position in mm
      moveBy: 0, // Default move by value in mm
      dragging: false,
      posX: 800,
      posY: 150,
      mouseX: 800,
      mouseY: 150,
    }
  },
  methods: {
    startDrag(e) {
      if (e.target.classList.contains('header') || e.target.classList.contains('close-btn')) {
        this.dragging = true
        this.mouseX = e.clientX - this.posX
        this.mouseY = e.clientY - this.posY
      }
    },
    drag(e) {
      if (this.dragging) {
        this.posX = e.clientX - this.mouseX
        this.posY = e.clientY - this.mouseY
      }
    },
    endDrag() {
      this.dragging = false
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
  cursor: grab;
  z-index: 1000;
  height: 72.5%;
}
.main-1 {
  display: flex;
  justify-content: space-around;
  width: 100%;
}
.text-input {
  max-width: 100%;
  width: 38%;
  margin-left: 2%;
  border-radius: 0px !important;
  height: 1rem !important;
  border-bottom: none;
}
.input-lock {
  border: 1px solid rgb(0, 0, 0) !important;
  background: #d4d4d4;
  border-color: rgb(0, 0, 0) !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.7rem;
  width: 72%;
  margin-left: 2%;
  border-radius: 5px;
}
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

::v-deep .v-text-field__details {
  display: none;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
  border: 1px solid black;
  border-radius: 5px;
  background: #d4d4d4;
}

.v-input--is-focused {
  display: block !important;
}

.text-2 {
  display: flex;
}

.text-1 {
  display: flex;
  justify-content: space-between;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}

.text-3 {
  display: flex;
  justify-content: flex-start;
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
  background: #d4d4d4 !important;
  border-color: #d4d4d4 !important;
  border-radius: 0px;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  font-size: 17px;
}

.v-input {
  max-width: 60%;
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

.content {
  padding-top: 2%;
  padding-bottom: 24%;
}
.header {
  cursor: move;
  padding: 4px;
  background-color: #0b0f70;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  height: 26px;
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
body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
}

.table-positioning-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 55vh;
  background: url('@/assets/siemens_img/mri.png') no-repeat center center;
  background-size: cover;
  position: relative;
}

.positioning-panel {
  /* background-color: rgba(255, 255, 255, 0.8); */
  /* padding: 20px; */
  border-radius: 8px;
  /* box-shadow: 0 0 15px rgba(0, 0, 0, 0.1); */
  width: 600px;
  position: absolute;
  height: 100%;
}

.positioning-panel h2 {
  text-align: center;
  margin-bottom: 15px;
}

.top-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 15px;
  gap: 0;
  /* margin-left: 20%; */
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.position-info,
.move-info {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: start;
  padding-left: 20%;
}

.second-row,
.third-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

label {
  font-size: 12px;
}

.first-col,
.second-col,
.third-col {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.Twarning {
  /* background-color: #ffefc5; */
  padding: 10px;
  /* border-left: 4px solid #ffa500; */
  margin-bottom: 15px;
  width: 28%;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 0px;
  width: 600px;
  position: relative;
  margin-top: 95%;
  padding: 0px 22px;
}

/* .actions button {
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.actions button:first-child {
  background-color: #6c757d;
  color: white;
} */

/* .actions button:last-child {
  background-color: #007bff;
  color: white;
} */
.retro-button {
  background-color: #d3d3d3;
  font-size: 12px;
  text-align: center;
  color: black;
  width: 50px;
  height: 50px;
  cursor: pointer;
  border: none;

  /* 3D Border Styling */
  border-top: 2px solid white;
  border-left: 2px solid white;
  border-bottom: 2px solid black;
  border-right: 2px solid black;

  transition: all 0.2s ease;
}
.retro-button-close-help {
  background-color: #d3d3d3;
  font-size: 12px;
  text-align: center;
  color: black;
  width: 75px;
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
.retro-button-close-help.active {
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
.retro-button-close-help:active {
  background-color: #b0b0b0;
  border-top: 2px solid black;
  border-left: 2px solid black;
  border-bottom: 2px solid white;
  border-right: 2px solid white;
}

/* Responsive Design CSS */
@media (max-width: 3072px) {
  .actions {
    margin-top: 130%;
  }
}

@media (max-width: 2304px) {
  .actions {
    margin-top: 106%;
  }
}
@media (max-width: 2048px) {
  .actions {
    margin-top: 94%;
  }
}
@media (max-width: 1920px) {
  .actions {
    margin-top: 88%;
  }
}
@media (max-width: 1800px) {
  .actions {
    margin-top: 100%;
  }
}
@media (max-width: 1706.67px) {
  .actions {
    margin-top: 80%;
  }
}
@media (max-width: 1536px) {
  .actions {
    margin-top: 80%;
  }
  .table-positioning-container {
    height: 62vh;
  }
}

@media (max-width: 1396.36px) {
}
@media (max-width: 1228.8px) {
}

@media (max-width: 1200px) {
}
@media (max-width: 768px) {
}

@media (max-width: 480px) {
}
</style>
