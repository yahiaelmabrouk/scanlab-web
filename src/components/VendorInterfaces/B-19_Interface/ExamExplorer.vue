<template>
  <div
    class="draggable"
    :style="{ top: posY + '%', left: posX + '%', zIndex: zIndex }"
    @mousedown="startDrag"
    @mousemove="drag"
    @mouseup="endDrag"
    @mouseleave="endDrag"
  >
    <div class="header">
      Exam Explorer

      <button class="close-btn btn-2" @click="close"><span>&times;</span></button>
    </div>

    <div class="content">
      <div>
        <div class="toolbar">
          <button><u>O</u>bject</button>
          <button><u>E</u>dit</button>
          <button><u>T</u>ools</button>
          <button><u>I</u>nsert</button>
          <button><u>H</u>elp</button>
        </div>
        <div class="icon-toolbar">
          <button class="retro-button mr-2" icon>
            <v-icon>mdi-content-save</v-icon>
          </button>
          <button class="retro-button" icon>
            <v-icon>mdi-folder-open</v-icon>
          </button>
          <button class="retro-button" icon>
            <v-icon>mdi-delete</v-icon>
          </button>
          <button class="retro-button" icon>
            <v-icon>mdi-content-cut</v-icon>
          </button>
          <button class="retro-button mr-2" icon>
            <v-icon>mdi-content-copy</v-icon>
          </button>
          <button class="retro-button" icon>
            <v-icon>mdi-content-paste</v-icon>
          </button>
          <button class="retro-button mr-2" icon>
            <v-icon>mdi-undo</v-icon>
          </button>
          <button class="retro-button" icon>
            <v-icon>mdi-redo</v-icon>
          </button>
          <button class="retro-button mr-2" icon>
            <v-icon>mdi-pencil</v-icon>
          </button>
          <button class="retro-button" icon>
            <v-icon>mdi-magnify-plus</v-icon>
          </button>
          <button class="retro-button" icon>
            <v-icon>mdi-printer</v-icon>
          </button>
          <button class="retro-button" icon>
            <v-icon>mdi-cog</v-icon>
          </button>
        </div>
        <div id="container">
          <div id="sidebar">
            <ul class="treeview">
              <li @click="toggleOpen">
                SIEMENS
                <ul>
                  <li @click.stop="toggleOpen">
                    USER
                    <ul>
                      <li>HEAD</li>
                      <li>NECK</li>
                      <li>UPPER EXTREMITIES</li>
                      <li @click.stop="toggleOpen">
                        SPINE
                        <ul>
                          <li>CERVICAL</li>
                          <li>THORACIC</li>
                          <li @click.stop="toggleOpen">
                            LUMBAR
                            <ul>
                              <li>ROUTINE WOW</li>
                              <li>METAL WOW</li>
                              <li>SCOLOSIS SURVEY</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
          <div id="content">
            <div class="row" v-for="(item, index) in contentItems" :key="index">
              <div class="sequence-number">{{ item.sequence }}</div>
              <div class="description">
                <div class="icon">&#128300;</div>
                {{ item.description }}
              </div>
              <div class="icon-count" v-if="item.copies">
                <img src="https://img.icons8.com/ios-filled/50/000000/copy.png" alt="Copies" />
                {{ item.copies }}
              </div>
              <div v-else class="icon-count"></div>
              <div class="time">{{ item.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapState, mapActions } from 'vuex'
import _ from 'lodash'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import { MriMixin } from '@/components/Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
export default {
  name: 'ExamExplorer',
  mixins: [ScanButtonMixin, MriMixin, SelectionConfigMixin],
  data() {
    return {
      dragging: false,
      posX: 12,
      posY: 12,
      mouseX: 865,
      mouseY: 26,
      zIndex: 1000,
      contentItems: [
        { sequence: 1, description: 'LOCALIZER', time: '00:40' },
        { sequence: 2, description: 'HASTE CORONAL', time: '00:39' },
        { sequence: 3, description: 'TSE-R T2 SAGITTAL', copies: 3, time: '03:32' },
        { sequence: 4, description: 'T1 SAG', copies: 3, time: '03:29' },
        { sequence: 5, description: 'STR SAGITTAL', copies: 3, time: '03:44' },
        { sequence: 6, description: 'TSE-R T2 AXIAL MSMA', time: '02:44' },
        { sequence: 7, description: 'T1 AXIAL STACK PRE', time: '03:02' },
        { sequence: 8, description: 'INJECT', time: '02:37' },
        { sequence: 9, description: 'T1 FS SAG POST', copies: 3, time: '03:37' },
        { sequence: 10, description: 'T1 AXIAL STACK POST', copies: 7, time: '03:02' },
      ],
    }
  },
  methods: {
    ...mapActions('interactableService', ['deleteSelectedInteractable']),
    ...mapActions('questionService', ['jumpToQuestion']),
    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),

    toggleOpen(event) {
      const target = event.currentTarget
      target.classList.toggle('open')
    },
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
.darkened-image {
  filter: brightness(0.6) sepia(1) saturate(5) hue-rotate(13deg);
}

.draggable {
  position: absolute;
  width: 50%;
  background-color: #888686;
  border: 1px solid #787878;
  cursor: grab; /* Indicates draggable area */
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

/* Exam Explorer */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  background-color: #e0e0e0;
}

#container {
  display: flex;
  height: 100%;
  width: 100%;
}

#sidebar {
  width: 25%;
  background-color: #f0f0f0;
  border-right: 1px solid #a0a0a0;
  overflow-y: auto;
  padding: 10px;
}

#content {
  width: 75%;
  padding: 10px;
  overflow-y: auto;
}

h1 {
  font-size: 16px;
  background-color: #404040;
  color: #ffffff;
  padding: 8px;
  text-align: center;
  margin-bottom: 10px;
}

ul.treeview {
  list-style-type: none;
  padding-left: 10px;
}

ul.treeview li {
  cursor: pointer;
  padding: 4px;
  margin-left: 10px;
  position: relative;
  list-style-type: none;
}

ul.treeview li::before {
  content: '+'; /* Old version Plus icon */
  position: absolute;
  left: -15px;
  top: 6px;
  cursor: pointer;
}

ul.treeview li.open::before {
  content: '-'; /* Old version Minus icon */
}

ul.treeview li ul {
  display: none;
  padding-left: 20px;
}

ul.treeview li.open > ul {
  display: block;
}

.icon {
  width: 20px;
  height: 20px;
  display: inline-block;
  margin-right: 5px;
}

.row {
  display: grid;
  grid-template-columns: 20px 1fr 100px 100px;
  align-items: center;
  background-color: #f9f9f9;
  border-bottom: 1px solid #d0d0d0;
  padding: 5px;
  margin-bottom: 3px;
}

.row:nth-child(even) {
  background-color: #eeeeee;
}

.description {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 25%;
}

.time {
  font-size: 0.9rem;
  color: #606060;
}

.toolbar {
  background-color: #000;
  padding: 0px;
  display: flex;
  /* gap: 10px; */
}

.toolbar button {
  /* background-color: #404040; */
  color: #ffffff;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.toolbar button:hover {
  background-color: #606060;
}

.icon-toolbar {
  /* background-color: #d3d3d3; */
  padding: 5px;
  display: flex;
  gap: 1px;
}
/* 
.icon-toolbar button {
  width: 30px;
  height: 30px;
  background-color: #e0e0e0;
  border: 1px solid #a0a0a0;
  cursor: pointer;
} */

.icon-toolbar button img {
  width: 100%;
  height: 100%;
}

.sequence-number {
  text-align: left;
  font-weight: bold;
}

.icon-count {
  display: flex;
  align-items: center;
  gap: 5px;
}

.icon-count img {
  width: 15px;
  height: 15px;
}
.retro-button {
  background-color: #d3d3d3;
  font-size: 12px;
  text-align: center;
  color: black;
  width: 42px;
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
</style>
