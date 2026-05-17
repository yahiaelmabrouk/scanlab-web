<!-- eslint-disable vue-i18n/no-raw-text -->
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
      Position Toolbar

      <button class="close-btn btn-2" @click="close"><span>&times;</span></button>
    </div>

    <div class="content">
      <div class="grid-container">
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/xo_enhanced.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/triangle_enhanced.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/cross-one_enhanced.png" width="20px" height="20px" />
        </v-btn>
        <v-btn
          class="custom-btn"
          @click="createSatBand"
          :disabled="isButtonDisabled || !mayAddSatBand"
          v-shortkey="['del']"
          @shortkey="deleteSelectedInteractable"
          :class="['satband-btn', { 'satband--active': isSatBandActive > 0 }]"
          :id="'tooltip-satband'"
        >
          <img src="@/assets/siemens_img/scan_enhanced.png" width="20px" height="20px" />
          <b-tooltip :target="'tooltip-satband'" triggers="hover"> Satband </b-tooltip>
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/pin.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/up-one_enhanced.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/arrow_enhanced.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/up-two_enhanced.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn" :disabled="!isVolumeViewMode" @click="toggleViewMode(false)">
          <img src="@/assets/siemens_img/list.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn" :disabled="isVolumeViewMode" @click="toggleViewMode(true)">
          <img src="@/assets/siemens_img/volumeview.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/box-one.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/person_adjusted.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn" @click="toggleReferenceLinesMode">
          <img src="@/assets/siemens_img/person-two_adjusted.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/person-one_adjusted.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/lines_enhanced.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/setting_adjusted.png" width="20px" height="20px" />
        </v-btn>
        <v-btn class="custom-btn">
          <img src="@/assets/siemens_img/magnify_adjusted.png" width="20px" height="20px" />
        </v-btn>
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
  mixins: [ScanButtonMixin, MriMixin, SelectionConfigMixin],
  data() {
    return {
      dragging: false,
      posX: 70,
      posY: 53,
      mouseX: 865,
      mouseY: 26,
      zIndex: 1,
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
    ...mapGetters('user', ['vendorStylePreferenceOptions', 'languageCode']),
    ...mapState('selectionConfig', ['isAddLocalizerMode']),
    ...mapGetters('selectionConfig', ['dotScaleValues']),
    ...mapGetters('scanTimeConfig', [
      'getRepetitionTime',
      'getMinConcatAcqPackage',
      'getSlices',
      'getMinSeqTRfuture',
      'getMinConcatAcqPackagefuture',
    ]),

    toggleReferenceLines: {
      get() {
        return this.$store.state.selectionConfig.showReferenceLines
      },
      set(toggleReferenceLines) {
        this.$store.dispatch('selectionConfig/setShowReferenceLines', toggleReferenceLines)
      },
    },
    isVolumeViewMode: {
      get() {
        return this.$store.state.selectionConfig.isVolumeViewMode
      },
      set(isVolumeViewMode) {
        this.$store.dispatch('selectionConfig/setIsVolumeViewMode', isVolumeViewMode)
      },
    },
    dotScaleMultiplierIndex: {
      get() {
        return _.indexOf(this.dotScaleValues, this.dotScaleMultiplier)
      },
      set(index) {
        this.dotScaleMultiplier = this.dotScaleValues[index]
        if (!this.dotScaleMultiplier) {
          throw Error('set dotScaleMultiplier out of bounds')
        }
      },
    },
    dotScaleMultiplier: {
      get() {
        return this.$store.state.selectionConfig.dotScaleMultiplier
      },
      set(dotScaleMultiplier) {
        this.$store.dispatch('selectionConfig/setDotScaleMultiplier', dotScaleMultiplier)
      },
    },
    isButtonDisabled() {
      return this.getRepetitionTime < this.getMinConcatAcqPackagefuture
    },
  },
  methods: {
    ...mapActions('interactableService', ['deleteSelectedInteractable']),
    ...mapActions('questionService', ['jumpToQuestion']),
    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),
    toggleViewMode(mode) {
      this.isVolumeViewMode = mode
    },
    toggleReferenceLinesMode() {
      this.toggleReferenceLines = !this.toggleReferenceLines
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

  mounted() {
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
      console.log('this.getRepetitionTime', this.getRepetitionTime)
      console.log('this.getMinConcatAcqPackagefuture', this.getMinConcatAcqPackagefuture)
    })
  },
}
</script>

<style scoped>
.darkened-image {
  filter: brightness(0.6) sepia(1) saturate(5) hue-rotate(13deg);
}
.custom-btn:disabled {
  opacity: 0.5;
}
.draggable {
  position: absolute;
  width: fit-content;
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
.satband-btn {
  background-color: transparent;
}

.satband--active:before,
.satband--active:hover:before {
  background-color: black;
  opacity: 0.18;
}
</style>
