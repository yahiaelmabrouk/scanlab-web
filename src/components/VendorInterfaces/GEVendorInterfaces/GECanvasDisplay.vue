<template>
  <div
    ref="draggable"
    class="draggable"
    :style="{ top: posY + 'px', left: posX + 'px', zIndex: zIndex + 1 }"
    @mousedown="startDrag"
  >
    <div class="main-content">
      <div class="header">
        <v-icon icon="md:event"></v-icon>
        <span>Graphic Rx Toolbar</span>
        <button @click="handleClose">
          <span>x</span>
        </button>
      </div>
      <div class="content">
        <div class="content-row">
          <div class="row-block">
            <button
              v-for="(label, index) in ['Locs', 'SAT', 'Shim', 'Radial']"
              :key="index"
              @click="setActiveButton(index)"
              :class="{ active: leftButtonIndex === index }"
              class="canvas-left-button"
            >
              {{ label }}
            </button>
          </div>
          <div class="row-block" style="width: 60%; justify-content: end">
            <button
              v-for="(img, index) in rightButtonImages"
              :key="index"
              @click="toggleRightButton(index)"
              :class="{ active: rightButtonStates[index] }"
              class="canvas-right-button"
            >
              <img :src="img" class="icon" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isDropDown" class="dropdown-part">
      <div class="dropdown-content">
        <div class="dropdown-checkboxes">
          <label v-for="item in dropdownOptionList" :key="item.value">
            <input
              type="checkbox"
              :value="item.value"
              v-model="dropdownContents"
              :disabled="item.disabled"
              @change="activeDropDown(item.value)"
            />
            <span>{{ item.label }}</span>
          </label>
        </div>
        <hr />
        <div class="dropdown-buttons">
          <button class="dropdown-button">Display Normal</button>
          <button class="dropdown-button">Reverse Slice Order</button>
          <button class="dropdown-button">Reset Center</button>
        </div>
      </div>
    </div>

    <div v-if="isSatBand" class="sat-part">
      <div class="sat-content">
        <div class="sat-checkbox">
          <input type="checkbox" />
        </div>
        <div class="sat-label">
          <span>Concat</span>
          <span>Thickness:</span>
          <span>Location:</span>
        </div>
        <table border="1">
          <thead>
            <tr>
              <th
                v-for="direction in directions"
                :key="direction.id"
                :class="{ 'active-head': directions[direction.id].active }"
                @click="setActiveDirection(direction.id)"
              >
                {{ direction.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td :key="0" :class="{ 'active-body': directions[0].active }">
                <b-form-input
                  v-if="directions[0].active"
                  @change="submitDimensions3z(0)"
                  :type="'number'"
                  v-model.number="dimensions3zs"
                  step="1"
                  min="1"
                  max="500"
                />
              </td>
              <td :key="1" :class="{ 'active-body': directions[1].active }">
                <b-form-input
                  v-if="directions[1].active"
                  @change="submitDimensions3z(1)"
                  :type="'number'"
                  v-model.number="dimensions3zi"
                  step="1"
                  min="1"
                  max="500"
                />
              </td>
              <td :key="2" :class="{ 'active-body': directions[2].active }">
                <b-form-input
                  v-if="directions[2].active"
                  @change="submitDimensions3z(2)"
                  :type="'number'"
                  v-model.number="dimensions3za"
                  step="1"
                  min="1"
                  max="500"
                />
              </td>
              <td :key="3" :class="{ 'active-body': directions[3].active }">
                <b-form-input
                  v-if="directions[3].active"
                  @change="submitDimensions3z(3)"
                  :type="'number'"
                  v-model.number="dimensions3zp"
                  step="1"
                  min="1"
                  max="500"
                />
              </td>
              <td :key="4" :class="{ 'active-body': directions[4].active }">
                <b-form-input
                  v-if="directions[4].active"
                  @change="submitDimensions3z(4)"
                  :type="'number'"
                  v-model.number="dimensions3zr"
                  step="1"
                  min="1"
                  max="500"
                />
              </td>
              <td :key="5" :class="{ 'active-body': directions[5].active }">
                <b-form-input
                  v-if="directions[5].active"
                  @change="submitDimensions3z(5)"
                  :type="'number'"
                  v-model.number="dimensions3zl"
                  step="1"
                  min="1"
                  max="500"
                />
              </td>
            </tr>
            <!-- location -->
            <tr>
              <td :key="0">
                <span v-if="directions[0].active" class="input-group-text"
                  >I {{ Math.abs(location3zs).toFixed(1) }}</span
                >
              </td>
              <td :key="1">
                <span v-if="directions[1].active" class="input-group-text"
                  >I {{ Math.abs(location3zi).toFixed(1) }}</span
                >
              </td>
              <td :key="2">
                <span v-if="directions[2].active" class="input-group-text"
                  >A {{ Math.abs(location3ya).toFixed(1) }}</span
                >
              </td>
              <td :key="3">
                <span v-if="directions[3].active" class="input-group-text"
                  >A {{ Math.abs(location3yp).toFixed(1) }}</span
                >
              </td>
              <td :key="4">
                <span v-if="directions[4].active" class="input-group-text"
                  >R {{ Math.abs(location3xr).toFixed(1) }}</span
                >
              </td>
              <td :key="5">
                <span v-if="directions[5].active" class="input-group-text"
                  >L {{ Math.abs(location3xl).toFixed(1) }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="isShim" class="shim-part">
      <div class="shim-content">
        <div class="shim-row">
          <label>AP:</label>
          <div class="shim-col">
            <GESpinButton :type="'number'" v-model.number="shimAP" :step="1" :min="1" :max="500" disabled />
          </div>
        </div>
        <div class="shim-row">
          <label>RL:</label>
          <div class="shim-col">
            <GESpinButton :type="'number'" v-model.number="shimRL" :step="1" :min="1" :max="500" disabled />
          </div>
        </div>
        <div class="shim-row">
          <label>SI:</label>
          <div class="shim-col">
            <GESpinButton :type="'number'" v-model.number="shimSI" :step="1" :min="1" :max="500" disabled />
          </div>
        </div>

        <div class="shim-checkbox">
          <label>
            <input type="checkbox" value="" disabled />
            <span>Symmetric Vol</span>
          </label>
        </div>
        <div class="shim-checkbox">
          <label>
            <input type="checkbox" value="" disabled />
            <span>Hide Shim</span>
          </label>
        </div>
        <div class="shim-checkbox">
          <label>
            <input type="checkbox" value="" disabled />
            <span>Localized TG</span>
          </label>
        </div>
      </div>
    </div>

    <div v-if="isRadial" class="radial-part">
      <div class="radial-content">
        <div class="radial-row">
          <label># of Slices:</label>
          <input type="text" value="1" disabled />
        </div>
        <div class="radial-row">
          <label>Partial Spacing:</label>
          <input type="text" value="0" disabled />
        </div>

        <div class="radial-clockwise">
          <label>
            <input type="radio" name="radialDirection" value="clockwise" v-model="radialDirection" disabled />
            <span>Clockwise</span>
          </label>
          <label>
            <input type="radio" name="radialDirection" value="counterClockwise" v-model="radialDirection" disabled />
            <span>Counter Clockwise</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GESpinButton from './GESpinButton.vue'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '@/components/Mixins/MriMixin'
import * as THREE from 'three'
import { mapState, mapGetters, mapActions } from 'vuex'
import _ from 'lodash'

export default {
  mixins: [SelectionConfigMixin, MriMixin],
  name: 'GECanvasDisplay',
  components: {
    GESpinButton,
  },
  data() {
    return {
      dragging: false,
      posX: window.innerWidth / 2.015, // Default X position
      posY: window.innerHeight / 1.8, // Default Y position (initial position)
      offsetX: 0,
      offsetY: 0,
      zIndex: 1,
      initialPosY: 0, // Store the default Y position
      initialPosX: 0, // Store the default X position
      selectedExaminationDatesValue: 'English',
      gridView: 1,
      examinationDates: ['Spanish', 'MexSpanish', 'Finnish', 'Norwegian', 'Swedish', 'Danish', 'Dutch', 'English'],
      dropdownContents: ['keepWL', 'updateAll', 'showSlices', 'showNoPhaseWrap', 'showCoilExtents', 'showAnnotation'],
      dropdownOptionList: [
        { value: 'keepWL', label: 'Keep W/L' },
        { value: 'updateAll', label: 'Update All' },
        { value: 'fallback', label: 'Fallback to R0', disabled: true },
        { value: 'locRefLines', label: 'Loc Ref Lines' },
        { value: 'enableSaveLocalizers', label: 'Enable Save Localizers' },
        { value: 'showSlices', label: 'Show Slices' },
        { value: 'showNoPhaseWrap', label: 'Show No Phase Wrap' },
        { value: 'showCoilExtents', label: 'Show Coil Extents' },
        { value: 'showAnnotation', label: 'Show Annotation' },
        { value: 'fullAnnotation', label: 'Full Annotation' },
      ],
      leftButtonIndex: 0, // tracks which button is active
      rightButtonImages: [],
      rightButtonStates: Array(8).fill(false), // 8 buttons including dropdown
      isDropDown: false,
      isLocs: false,
      isSatBand: false,
      isShim: false,
      isRadial: false,
      shimAP: 27,
      shimRL: 27,
      shimSI: 27,
      radialDirection: 'clockwise',
      directions: [
        { id: 0, name: 'S', active: false, satBandIndex: null },
        { id: 1, name: 'I', active: false, satBandIndex: null },
        { id: 2, name: 'A', active: false, satBandIndex: null },
        { id: 3, name: 'P', active: false, satBandIndex: null },
        { id: 4, name: 'R', active: false, satBandIndex: null },
        { id: 5, name: 'L', active: false, satBandIndex: null },
      ],
      bandDirection: 0,
    }
  },
  computed: {
    ...mapGetters('interactableService', [
      'selectedInteractableState',
      'isSatBandSelected',
      'indexOfSelectedSatBand',
      'satBands',
      'firstInteractableConfig',
    ]),
    selectSatBand: {
      get() {
        return this.indexOfSelectedSatBand
      },
      set() {
        // this.$store.dispatch('interactableService/setSelectedInteractableIdentByIndex', newIndex)
      },
    },
    dimensions3zs: {
      get() {
        if (this.selectedInteractableState) {
          if (this.directions[0].satBandIndex === this.selectSatBand) {
            this.$store.dispatch('interactableService/setSelectedInteractableIdentByIndex', this.selectSatBand)
          }
          return _.get(this.satBands[this.directions[0].satBandIndex], 'dimensions3.z').toFixed(1)
        } else {
          return _.get(this.firstInteractableConfig, 'dimensions3.z', 0).toFixed(1)
        }
      },
      set(dimensions3zs) {
        this.dimensions3zsLocal = dimensions3zs
      },
    },
    dimensions3zi: {
      get() {
        if (this.selectedInteractableState) {
          if (this.directions[1].satBandIndex === this.selectSatBand) {
            this.$store.dispatch('interactableService/setSelectedInteractableIdentByIndex', this.selectSatBand)
          }
          return _.get(this.satBands[this.directions[1].satBandIndex], 'dimensions3.z').toFixed(1)
        } else {
          return _.get(this.firstInteractableConfig, 'dimensions3.z', 0).toFixed(1)
        }
      },
      set(dimensions3zi) {
        this.dimensions3ziLocal = dimensions3zi
      },
    },
    dimensions3za: {
      get() {
        if (this.selectedInteractableState) {
          if (this.directions[2].satBandIndex === this.selectSatBand) {
            this.$store.dispatch('interactableService/setSelectedInteractableIdentByIndex', this.selectSatBand)
          }
          return _.get(this.satBands[this.directions[2].satBandIndex], 'dimensions3.z').toFixed(1)
        } else {
          return _.get(this.firstInteractableConfig, 'dimensions3.z', 0).toFixed(1)
        }
      },
      set(dimensions3za) {
        this.dimensions3zaLocal = dimensions3za
      },
    },
    dimensions3zp: {
      get() {
        if (this.selectedInteractableState) {
          if (this.directions[3].satBandIndex === this.selectSatBand) {
            this.$store.dispatch('interactableService/setSelectedInteractableIdentByIndex', this.selectSatBand)
          }
          return _.get(this.satBands[this.directions[3].satBandIndex], 'dimensions3.z').toFixed(1)
        } else {
          return _.get(this.firstInteractableConfig, 'dimensions3.z', 0).toFixed(1)
        }
      },
      set(dimensions3zp) {
        this.dimensions3zpLocal = dimensions3zp
      },
    },
    dimensions3zr: {
      get() {
        if (this.selectedInteractableState) {
          if (this.directions[4].satBandIndex === this.selectSatBand) {
            this.$store.dispatch('interactableService/setSelectedInteractableIdentByIndex', this.selectSatBand)
          }
          return _.get(this.satBands[this.directions[4].satBandIndex], 'dimensions3.z').toFixed(1)
        } else {
          return _.get(this.firstInteractableConfig, 'dimensions3.z', 0).toFixed(1)
        }
      },
      set(dimensions3zr) {
        this.dimensions3zrLocal = dimensions3zr
      },
    },
    dimensions3zl: {
      get() {
        if (this.selectedInteractableState) {
          if (this.directions[5].satBandIndex === this.selectSatBand) {
            this.$store.dispatch('interactableService/setSelectedInteractableIdentByIndex', this.selectSatBand)
          }
          return _.get(this.satBands[this.directions[5].satBandIndex], 'dimensions3.z').toFixed(1)
        } else {
          return _.get(this.firstInteractableConfig, 'dimensions3.z', 0).toFixed(1)
        }
      },
      set(dimensions3zl) {
        this.dimensions3zlLocal = dimensions3zl
      },
    },
    location3zs: {
      get() {
        if (this.selectedInteractableState) {
          return _.get(this.satBands[this.directions[0].satBandIndex], 'center3.z')
        } else {
          return _.get(this.firstInteractableConfig, 'center3.z', 0)
        }
      },
    },
    location3zi: {
      get() {
        if (this.selectedInteractableState) {
          return _.get(this.satBands[this.directions[1].satBandIndex], 'center3.z')
        } else {
          return _.get(this.firstInteractableConfig, 'center3.z', 0)
        }
      },
    },
    location3ya: {
      get() {
        if (this.selectedInteractableState) {
          return _.get(this.satBands[this.directions[2].satBandIndex], 'center3.y')
        } else {
          return _.get(this.firstInteractableConfig, 'center3.x', 0)
        }
      },
    },
    location3yp: {
      get() {
        if (this.selectedInteractableState) {
          return _.get(this.satBands[this.directions[3].satBandIndex], 'center3.y')
        } else {
          return _.get(this.firstInteractableConfig, 'center3.x', 0)
        }
      },
    },
    location3xr: {
      get() {
        if (this.selectedInteractableState) {
          return _.get(this.satBands[this.directions[4].satBandIndex], 'center3.x')
        } else {
          return _.get(this.firstInteractableConfig, 'center3.x', 0)
        }
      },
    },
    location3xl: {
      get() {
        if (this.selectedInteractableState) {
          return _.get(this.satBands[this.directions[5].satBandIndex], 'center3.x')
        } else {
          return _.get(this.firstInteractableConfig, 'center3.x', 0)
        }
      },
    },
    satBandDirection: {
      get() {
        if (this.selectedInteractableState) {
          const xDirection3 = _.get(this.selectedInteractableState, 'xDirection3')
          const yDirection3 = _.get(this.selectedInteractableState, 'yDirection3')
          const zDirection3 = _.get(this.selectedInteractableState, 'zDirection3')
          const xAxis = new THREE.Vector3(1, 0, 0)
          const yAxis = new THREE.Vector3(0, 1, 0)
          const zAxis = new THREE.Vector3(0, 0, 1)
          const xDirectionAngle = (xAxis.angleTo(xDirection3) * 180) / Math.PI
          const yDirectionAngle = (yAxis.angleTo(yDirection3) * 180) / Math.PI
          const zDirectionAngle = (zAxis.angleTo(zDirection3) * 180) / Math.PI
          let bandDirection = this.bandDirection
          if (zDirectionAngle >= 45 && zDirectionAngle <= 135) {
            if (xDirectionAngle >= 45 && xDirectionAngle <= 135) {
              bandDirection = 2
            } else {
              bandDirection = 1
            }
          } else {
            if (xDirectionAngle >= 45 && xDirectionAngle <= 135 && yDirectionAngle !== 90) {
              bandDirection = 2
            } else {
              bandDirection = 0
            }
          }

          return bandDirection
        } else {
          return 0
        }
      },
      set(index) {
        this.$store.dispatch('interactableService/resetDirection', { index })
        this.bandDirection = index
      },
    },
  },
  async mounted() {
    this.rightButtonImages = [
      (await import('@/assets/ge_img/toolbar_right_1.png')).default,
      (await import('@/assets/ge_img/toolbar_right_2.png')).default,
      (await import('@/assets/ge_img/toolbar_right_3.png')).default,
      (await import('@/assets/ge_img/toolbar_right_7.png')).default,
      (await import('@/assets/ge_img/toolbar_right_4.png')).default,
      (await import('@/assets/ge_img/toolbar_right_5.png')).default,
      (await import('@/assets/ge_img/toolbar_right_6.png')).default,
      (await import('@/assets/ge_img/toolbar_right_8.png')).default,
    ]
    this.initialPosY = window.innerHeight / 2 + 52 // Store the initial position after mounting
    this.initialPosX = window.innerWidth / 2 - 7 // Set default X position to screen width
  },
  methods: {
    activeDropDown(value) {
      switch (value) {
        case 'locRefLines':
          this.showReferenceLines = !this.showReferenceLines
          break
        case 'showSlices':
          this.isVolumeViewMode = !this.isVolumeViewMode
          break
        case 'showAnnotation':
          break
        default:
          break
      }
    },
    ...mapActions('interactableService', ['deleteSelectedInteractable']),
    setActiveButton(index) {
      if (this.leftButtonIndex === index) {
        this.leftButtonIndex = null
        this.isLocs = this.isSatBand = this.isShim = this.isRadial = false
      } else {
        this.leftButtonIndex = index
        this.isSatBand = this.isShim = this.isRadial = false
        switch (index) {
          case 1:
            this.isSatBand = true
            for (let i = 0; i < this.directions.length; i++) {
              this.directions[i].active = false
            }
            break

          case 2:
            this.isShim = true
            break

          case 3:
            this.isRadial = true
            break

          default:
            break
        }
      }
    },
    toggleRightButton(index) {
      if (index === 7) {
        // Toggle dropdown button
        this.$set(this.rightButtonStates, index, !this.rightButtonStates[index])
        this.isDropDown = this.rightButtonStates[index]
        return
      }

      // Toggle only the clicked button, deactivate others
      const wasActive = this.rightButtonStates[index]
      this.rightButtonStates = this.rightButtonStates.map((_, i) => (i === index ? !wasActive : false))
      this.isDropDown = false

      if (index === 0) this.forcedIsSelectRxWidgetActive = true
      if (index === 1) {
        this.forcedIsCopyRxWidgetActive = true
        this.emitCopyRxAction = false
      }

      if (index === 2 && this.rightButtonStates[index]) {
        this.directions.forEach((dir, i) => {
          if (dir.active) this.setActiveDirection(i)
        })
      }
    },
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
    handleClose() {
      this.$emit('close')
    },
    resetSelectionEx(date) {
      this.selectedExaminationDatesValue = date
      console.log(this.selectedDate)
    },
    submitDimensions3z(currentDirectionId) {
      this.$store.dispatch(
        'interactableService/setSelectedInteractableIdentByIndex',
        this.directions[currentDirectionId].satBandIndex
      )
      let { dimensions3 } = this.selectedInteractableState
      switch (currentDirectionId) {
        case 0:
          dimensions3.z = this.dimensions3zsLocal
          break
        case 1:
          dimensions3.z = this.dimensions3ziLocal
          break
        case 2:
          dimensions3.z = this.dimensions3zaLocal
          break
        case 3:
          dimensions3.z = this.dimensions3zpLocal
          break
        case 4:
          dimensions3.z = this.dimensions3zrLocal
          break
        case 5:
          dimensions3.z = this.dimensions3zlLocal
          break
        default:
          break
      }
      this.$store.dispatch('interactableService/update', {})
      this.$store.dispatch('selectionConfig/afterSelectionUserModified', {})
    },
    setActiveDirection(index) {
      if (this.directions[index].active) {
        this.directions[index].active = false
        this.$store.dispatch(
          'interactableService/setSelectedInteractableIdentByIndex',
          this.directions[index].satBandIndex
        )
        this.deleteSelectedInteractable()
        for (let i = 0; i < this.directions.length; i++) {
          if (this.directions[i].satBandIndex > this.directions[index].satBandIndex) {
            this.directions[i].satBandIndex = this.directions[i].satBandIndex - 1
          }
        }
        this.directions[index].satBandIndex = null
        this.satConcats = this.directions.filter((dir) => dir.active).map((dir) => dir.name)
      } else {
        this.createSatBand()
        this.directions[index].active = true
        this.satBandDirection = Math.floor(index / 2)
        this.$store.dispatch('interactableService/setSelectedInteractableIdentByIndex', this.selectSatBand)
        this.directions[index].satBandIndex = this.selectSatBand
        this.satConcats = this.directions.filter((dir) => dir.active).map((dir) => dir.name)
      }
    },
  },
  watch: {
    isSelectRxWidgetActiveFlag(newVal) {
      this.$set(this.rightButtonStates, 0, newVal)
    },
    IsCopyRxWidgetActiveFlag(newVal) {
      this.$set(this.rightButtonStates, 1, newVal)
    },
  },
}
</script>

<style scoped>
.icon {
  width: 96%;
}

.draggable {
  position: absolute;
}

.row-block {
  width: 35%;
  height: 103%;
  display: flex;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.main-content {
  width: 475px; /* Prevent unwanted size change */
  background-color: #888686;
  border: 1px solid #787878;

  .header {
    cursor: grab;
    padding: 4px;
    background-color: rgb(148, 158, 175);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    height: 30px;
    box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px 0px 2px #4b4b80; /* dark bottom-right bevel */

    button {
      border: solid 2px white;
      height: 18px;
      width: 18px;
      position: relative;
      margin-right: 2px;

      span {
        font-size: 22px;
        position: absolute;
        top: -11px;
        right: 1px;
      }
    }
  }

  .content {
    background-color: #6875a2;
    height: 35px;
    border: solid 3px rgb(148, 158, 175);
    border-top: 0px;

    .content-row {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .canvas-left-button {
      width: 25%;
      background-color: #8f96c0; /* similar light blue */
      border: none;
      padding: 7px 2px;
      font-size: 10px;
      font-weight: bold;
      font-family: sans-serif;
      color: #000;
      box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #4b4b80; /* dark bottom-right bevel */
      border-radius: 1px;
      outline: 1px solid #6666aa; /* outer border line for contrast */
    }
    .canvas-left-button.active {
      background-color: rgb(41, 61, 97);
      color: white;
      box-shadow: inset 1px 1px 2px #4b4b80, inset -1px -1px 2px #ffffff;
    }
    .canvas-right-button {
      background-color: #8f96c0; /* similar light blue */
      border: none;
      padding: 2px 2px;
      font-size: 10px;
      font-weight: bold;
      font-family: sans-serif;
      color: #000;
      box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #4b4b80; /* dark bottom-right bevel */
      border-radius: 1px;
      outline: 1px solid #8f96c0; /* outer border line for contrast */
    }
    .canvas-right-button.active {
      color: white;
      box-shadow: inset 1px 1px 2px #4b4b80, inset -1px -1px 2px #ffffff;
    }
  }
}

.dropdown-part {
  display: flex;
  justify-content: flex-end;
  position: absolute;
  top: 63px;
  right: -5px;

  .dropdown-content {
    background-color: #6875a2;
    width: 139px;
    box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #4b4b80; /* dark bottom-right bevel */
    font-size: 12px;
    color: #000;
    font-weight: bold;

    .dropdown-checkboxes {
      padding: 7px 10px 0px 10px;

      label {
        font-size: 12px;
        font-weight: bold;
        display: flex;
        margin: 8px 0px 0px 0px;
        accent-color: white;
      }

      span {
        text-align: left;
        margin-left: 15px;
        margin-bottom: 0px;
      }
    }

    hr {
      margin: 0px;
      height: 2px;
      border: none;
      background: linear-gradient(to bottom, #333 50%, #ffffff 50%);
    }

    .dropdown-buttons {
      text-align: left;

      .dropdown-button {
        margin: 8px 0px 5px 15px;
      }
    }
  }
}

.sat-part {
  position: absolute;
  left: 45px;
  top: 63px;

  .sat-content {
    display: flex;
    background-color: #6875a2;
    box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #4b4b80; /* dark bottom-right bevel */
    font-size: 12px;
    color: #000;
    font-weight: bold;
    padding: 10px 0px 0px 10px;

    .sat-checkbox {
      padding-top: 7px;
    }

    .sat-label {
      display: flex;
      flex-direction: column;
      padding: 0px 5px 0px 5px;

      span {
        padding: 5px 0px 12px 0px;
      }
    }

    th {
      padding: 4px;
      width: 50px;
      background-color: #8f96c0; /* similar light blue */
      border: none;
      font-weight: bold;
      font-family: sans-serif;
      color: #000;
      box-shadow: inset 0 0 0 1px #4b4b80, /* dark layer: tight 1px inner border */ inset 1px 1px 0 1px #ffffff,
        /* light layer: slightly offset */ inset 0 0 0 1px #ffffff,
        /* light outer layer bottom-right */ inset -1px -1px 0 1px #4b4b80; /* dark inner layer bottom-right */
      border-radius: 1px;
      cursor: pointer;
    }

    .active-head {
      background-color: rgb(41, 61, 97);
      color: white;
      box-shadow: inset 1px 1px 2px #4b4b80, inset -1px -1px 2px #ffffff;
      width: 75px;
    }

    td {
      box-shadow: inset 1px 1px 2px #4b4b80, inset -1px -1px 2px #ffffff;
      height: 41px;
    }

    .active-body {
      background-color: #cacbec;
      text-align: left;
    }
  }
}

.shim-part {
  position: absolute;
  left: 86px;
  top: 63px;
  width: 157px;
  color: rgba(0, 0, 0, 0.25);

  input {
    color: rgba(0, 0, 0, 0.25);
  }

  .shim-content {
    background-color: #6875a2;
    box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #4b4b80; /* dark bottom-right bevel */
    font-size: 12px;
    font-weight: bold;
    padding: 13px 20px 5px 15px;

    .shim-row {
      display: flex;
      align-items: center; /* Ensures vertical alignment */
      justify-content: flex-end;
      width: 100%;
      height: 9%;
      margin-bottom: 8px;

      label {
        margin: 0px 5px 0px 0px;
      }

      .shim-col {
        display: flex;
        align-items: center;
        width: 83px;
      }
    }

    .shim-checkbox {
      display: flex;
      margin: 5px 0px 0px 0px;

      label {
        display: flex;
        align-items: center;
      }

      input {
        margin-right: 10px;
      }
    }
  }
}

::v-deep .shim-col .v-text-field {
  background-color: #cacbec;
  font-size: 15px;
  font-weight: bold;
  height: 26px;
  border-radius: 5px;
  margin-right: 3px;

  input {
    padding-left: 8px;
  }
}

.radial-part {
  position: absolute;
  left: 127px;
  top: 63px;
  width: 200px;
  color: rgba(0, 0, 0, 0.25);

  input {
    color: rgba(0, 0, 0, 0.25);
  }

  .radial-content {
    background-color: #6875a2;
    box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #4b4b80; /* dark bottom-right bevel */
    font-size: 12px;
    font-weight: bold;
    padding: 13px 30px 5px 15px;

    .radial-row {
      display: flex;
      align-items: center; /* Ensures vertical alignment */
      justify-content: flex-end;
      width: 100%;
      height: 9%;
      margin-bottom: 10px;

      label {
        margin: 0px 5px 0px 0px;
      }

      input {
        display: flex;
        align-items: center;
        width: 52px;
        height: 23px;
        padding-left: 8px;
        background-color: #cacbec;
        border-radius: 5px;
      }
    }

    .radial-clockwise {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin: 20px 0px 0px 15px;

      label {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        accent-color: black;
      }

      input {
        margin-right: 10px;
      }
    }
  }
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

.input-group-text {
  cursor: default;
}
</style>
