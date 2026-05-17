<template>
  <div
    ref="draggable"
    class="draggable"
    :style="{ top: posY + 'px', left: posX + 'px', zIndex: zIndex + 1 }"
    @mousedown="startDrag"
  >
    <div class="header">
      <v-icon icon="md:event"></v-icon>
      <span>Auto Voice</span>
      <button class="close-btn btn-2" @click="close"><span>&times;</span></button>
    </div>

    <div class="content">
      <div class="auto-voice-col">
        <!-- 1st Row -->
        <div class="auto-voice-row" style="height: 10%">
          <div class="row-block" style="width: 40%">
            <input type="checkbox" id="input1" />
            <label style="margin-bottom: 0px !important; margin-left: 3px !important">Auto Voice</label>
          </div>
          <div class="row-block" style="width: 60%">
            <label style="margin-bottom: 0px !important">Language: </label>
            <v-menu offset-y>
              <template #activator="{ on }">
                <v-btn
                  :disabled="isAddLocalizerMode"
                  class="btn-4"
                  v-on="on"
                  dense
                  outlined
                  style="
                    margin-left: 8px;
                    padding: 0 8px !important;
                    background-color: #c7cee1;
                    height: 20px !important;
                  "
                >
                  {{ selectedExaminationDatesValue }}
                  <v-icon small>mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list style="max-height: 200px; overflow-y: auto; background-color: #c7cee1">
                <v-list-item v-for="(date, index) in examinationDates" :key="index" @click="resetSelectionEx(date)">
                  <v-list-item-title>{{ `${date}` }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>

        <!-- 2nd Row -->
        <div class="auto-voice-row" style="height: 30%">
          <div class="auto-voice-col" style="height: 100%">
            <label style="display: flex; align-items: start; height: 10%">GE Messages</label>

            <!-- Scrollable container for table -->
            <div style="height: 90%; overflow-y: auto; border: 1px solid gray">
              <table cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse">
                <thead>
                  <tr>
                    <th style="width: 10%">#</th>
                    <th style="width: 50%">Title</th>
                    <th style="width: 20%">Pre (sec)</th>
                    <th style="width: 20%">Post (sec)</th>
                  </tr>
                </thead>
                <tbody style="background-color: #c7cee1">
                  <!-- Sample rows -->
                  <tr>
                    <td>1</td>
                    <td style="text-align: start">Inspiration</td>
                    <td>4.6</td>
                    <td>1.4</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td style="text-align: start">Expiration</td>
                    <td>7.7</td>
                    <td>1.4</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td style="text-align: start">Suspension</td>
                    <td>1.7</td>
                    <td>1.4</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 3rd Row -->
        <div class="auto-voice-row" style="height: 30%">
          <div class="auto-voice-col" style="height: 100%">
            <label style="display: flex; align-items: start; height: 10%">Site Messages</label>

            <!-- Scrollable container for table -->
            <div style="height: 90%; overflow-y: auto; border: 1px solid gray">
              <table cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse">
                <thead>
                  <tr>
                    <th style="width: 10%">#</th>
                    <th style="width: 50%">Title</th>
                    <th style="width: 20%">Pre (sec)</th>
                    <th style="width: 20%">Post (sec)</th>
                  </tr>
                </thead>
                <tbody style="background-color: #c7cee1">
                  <!-- Sample rows -->
                  <tr>
                    <td>1</td>
                    <td style="text-align: start">Inspiration</td>
                    <td>4.6</td>
                    <td>1.4</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td style="text-align: start">Expiration</td>
                    <td>7.7</td>
                    <td>1.4</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td style="text-align: start">Suspension</td>
                    <td>1.7</td>
                    <td>1.4</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 4th Row -->
        <div class="auto-voice-row" style="height: 20%">
          <div class="auto-voice-col" style="height: 100%">
            <label style="display: flex; align-items: start; height: 10%; margin-bottom: 0.7rem">Description</label>
            <textarea
              style="width: 100%; height: 90%; background-color: #c7cee1; resize: none; font-size: 12px"
            ></textarea>
          </div>
        </div>

        <!-- 5th Row -->
        <div class="auto-voice-row" style="height: 10%">
          <div class="auto-voice-col" style="width: 50%">
            <div class="auto-voice-row" style="margin-bottom: 5px !important; height: 50%">
              <label for="input1" style="width: 50%; text-align: end">Preset Delay Time:</label>
              <input
                id="input1"
                type="text"
                style="
                  height: 100%;
                  background-color: #c7cee1;
                  border-radius: 4px;
                  border: 1px solid #ccc;
                  width: 25%;
                  margin-left: 10px;
                "
              />
              <label for="input2" style="width: 25%">secs</label>
            </div>
            <div class="auto-voice-row" style="margin-bottom: 5px !important; height: 50%">
              <label for="input2" style="width: 50%; text-align: end">Total Length:</label>
              <input
                id="input1"
                type="text"
                style="
                  height: 100%;
                  background-color: #c7cee1;
                  border-radius: 4px;
                  border: 1px solid #ccc;
                  width: 25%;
                  margin-left: 10px;
                "
              />
              <label for="input2" style="width: 25%">secs</label>
            </div>
          </div>
          <div class="auto-voice-col" style="width: 50%; justify-content: end">
            <div style="display: flex; justify-content: end">
              <button
                @click="handleAccept"
                type="button"
                style="
                  width: 30%;
                  background-color: #8c98be;
                  border-radius: 4px;
                  border: 1px solid gray;
                  font-size: 12px;
                "
              >
                Accept
              </button>
            </div>
          </div>
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
      posX: 0, // Default X position
      posY: 0, // Default Y position (initial position)
      offsetX: 0,
      offsetY: 0,
      zIndex: 1,
      initialPosY: 0, // Store the default Y position
      initialPosX: 0, // Store the default X position
      selectedExaminationDatesValue: 'English',
      gridView: 1,
      examinationDates: ['Spanish', 'MexSpanish', 'Finnish', 'Norwegian', 'Swedish', 'Danish', 'Dutch', 'English'],
    }
  },
  mounted() {
    this.initialPosY = window.innerHeight - 700 // Store the initial position after mounting
    this.initialPosX = window.innerWidth / 2 // Set default X position to screen width
    this.posX = this.initialPosX // Ensure the draggable component starts at screen width
    this.posY = this.initialPosY
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
      if (newY < this.initialPosY + 500) {
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
    resetSelectionEx(date) {
      this.selectedExaminationDatesValue = date
      console.log(this.selectedDate)
    },
    handleAccept() {
      this.$emit('close')
    },
  },
}
</script>

<style scoped>
.draggable {
  position: absolute;
  width: 475px; /* Prevent unwanted size change */
  height: 468px;
  background-color: #888686;
  border: 1px solid #787878;
}

.auto-voice-col {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
}

.auto-voice-row {
  width: 100%;
  margin-bottom: 10px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.row-block {
  height: 100%;
  display: flex;
  align-items: center;
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
  height: 448px;
  padding: 5px;
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

::v-deep .v-icon {
  font-size: 19px !important;
}

label {
  font-size: 12px;
  font-weight: bold;
}
</style>
