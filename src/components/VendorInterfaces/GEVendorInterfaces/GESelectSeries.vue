<template>
  <div
    v-if="closeToolbar"
    ref="draggable"
    class="draggable"
    :style="{ top: posY + 'px', left: posX + 'px', zIndex: zIndex + 1 }"
    @mousedown="startDrag"
  >
    <div class="main-content">
      <div class="header">
        <v-icon color="white">mdi-folder-outline</v-icon>
        <span>Select Series</span>
        <button @click="handleClose">
          <span>x</span>
        </button>
      </div>
      <div class="content">
        <div class="label"><span>Select Series</span></div>
        <div class="options">
          <v-table>
            <thead>
              <tr>
                <th width="70px">#</th>
                <th width="135px">Plane</th>
                <th width="234px">Description</th>
              </tr>
            </thead>
            <div class="series-body">
              <tbody>
                <tr
                  v-for="(item, index) in stackConfigOptions"
                  :key="index"
                  :class="{ 'active-plane': indexOfActivePlane === index }"
                  @click="indexOfActivePlane = index"
                >
                  <td width="70px">{{ index + 1 }}</td>
                  <td width="135px">{{ item.text }}</td>
                  <td width="234px" style="display: flex; padding-left: 5px">
                    {{
                      stackQuestions === ''
                        ? stackQuestions[isActive].questionText.split(' ').slice(0, 3).join(' ')
                        : ''
                    }}
                  </td>
                </tr>
              </tbody>
            </div>
          </v-table>
          <div class="series-buttons">
            <button @click="handleOK">OK</button>
            <button>OK ALL</button>
            <button @click="handleClose">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '@/components/Mixins/MriMixin'
import _ from 'lodash'

export default {
  mixins: [SelectionConfigMixin, MriMixin],
  name: 'GESelectSeries',
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
      // series: [
      //     { id: '1', plane: $t('global.axial', languageCode), description: this.stackQuestions[this.isActive].questionText.split(' ').slice(0, 3).join(' ') },
      //     { id: '2', plane: $t('global.coronal', languageCode), description: this.stackQuestions[this.isActive].questionText.split(' ').slice(0, 3).join(' ') },
      //     { id: '3', plane: $t('global.sagittal', languageCode), description: this.stackQuestions[this.isActive].questionText.split(' ').slice(0, 3).join(' ') },
      // ],
      series: [{ id: '1', plane: '123', description: 'f;jlksdj;fj' }],
      closeToolbar: true,
      isActive: 0,
      isCurrentQuestion: 0,
      selected: false,
      indexOfActivePlane: null,
    }
  },
  computed: {
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'selectedStackQuestionIndexVisual',
      'scanSubmittedByStackQuestionId',
      'scanSubmitted',
    ]),
    ...mapState('stackService', [
      'stackConfigs',
      'sliceViewIndexWillShowResult',
      'isOnMriView',
      'isMriMachineScanComplete',
      'scanPercentStartOfMRIMachine',
      'scanPercentOfMRIMachine',
      'configNameOfFirstSliceView',
      'mriModelBbox',
      'scanPercentStartOfLandmark',
    ]),
    ...mapGetters('user', ['windowingDirection', 'languageCode']),
    stackConfigOptions() {
      // Dont't show the base HD stacks unless we are in debug mode
      let allowedConfigs = _.filter(this.stackConfigs, (c) => !c.hidden)
      let options = _.map(allowedConfigs, (config) => {
        const localizerNames = _.get(this.dicomFileSet, 'localizerNames', {})
        const label = localizerNames[`${config.renameIdent}`]
        return {
          value: config,
          text: label || config.name,
        }
      })
      // Remove duplicates
      return _.uniqBy(options, 'text')
    },
  },
  watch: {
    stackQuestion() {
      this.previewScoreGroupIndex = 0
    },
    selectedStackQuestionIndexVisual(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('newVal', newVal)
        this.isActive = newVal - 1
        this.isCurrentQuestion = newVal - 1
      }
    },
    indexOfSelectedViewOrientation(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.indexOfActivePlane = newVal
      }
    },
  },
  async mounted() {
    this.initialPosY = window.innerHeight / 2 + 65 // Store the initial position after mounting
    this.initialPosX = window.innerWidth / 4 - 4 // Set default X position to screen width
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
    handleOK() {
      this.closeToolbar = false
      this.forcedIsSelectSeriesActive = false
      this.indexOfSelectedViewOrientation = this.indexOfActivePlane
    },
    handleClose() {
      this.closeToolbar = false
      this.forcedIsSelectSeriesActive = false
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

.main-content {
  width: 476px; /* Prevent unwanted size change */
  background-color: #888686;
  border: 1px solid #787878;
}

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
  position: relative;
  background-color: #6875a2;
  padding: 13px 6px 5px 6px;
  font-weight: 500;
  color: black;
  font-size: 14px;

  .label {
    color: black;
    font-size: 12px;
    font-weight: bold;
    position: absolute;
    top: 3px;
    background-color: #6875a2;
    z-index: 2;
    width: 80px;
    left: 11px;
  }

  .options {
    z-index: 1;
    outline: solid 2px #000;
    padding: 17px 4px 10px 4px;

    thead {
      display: flex;

      th {
        font-weight: 500;
        padding: 1px 0px 1px 0px;
        box-shadow: inset 1px 1px 2px #070729, /* light top-left bevel */ inset -1px -1px 2px #ffffff; /* dark bottom-right bevel */
      }
    }

    .series-body {
      box-shadow: inset 1px 1px 2px #070729, /* light top-left bevel */ inset -1px -1px 2px #ffffff; /* dark bottom-right bevel */
      max-height: 400px;
      min-height: 400px;
      overflow-y: scroll;
      background-color: #c7cee1;

      tr {
        cursor: pointer;
      }

      td {
        padding-top: 3px;
      }
    }

    .series-buttons {
      button {
        background-color: #8b96bd;
        box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #070729; /* dark bottom-right bevel */
        padding: 4px 10px 4px 10px;
        margin: 8px 3px 0px 3px;
        border-radius: 5px;
      }
    }
  }
}

.active-plane {
  background-color: #fdfd6d;
}
</style>
