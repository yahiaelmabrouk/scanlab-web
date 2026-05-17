<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="custom-container mb-0">
    <v-card :class="['bottom-section', { 'white-background': isQuestionAreaActive }]">
      <div>
        <v-card-text>
          <component
            :is="component"
            :selection-ident="selectionIdent"
            :sequence-type="sequenceType"
            :is-ultra-lab="isUltraLab"
            :should-pause-popup="shouldPausePopup"
            :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults && isRoutineTabFistTimeLoaded"
            @updateData="updateChildData"
            @updateConcomData="updateConComChildData"
            @on-routine-tab-mounted="onRoutineTabFirstLoaded"
          />
        </v-card-text>
      </div>
      <v-container fluid class="pa-0">
        <v-btn-toggle class="btn-1">
          <v-btn
            v-for="btn in visibleButtons"
            :key="btn.component"
            :class="[btn.additionalClasses || 'btn-3', { 'btn-active': component === btn.component }]"
            @click="component = btn.component"
          >
            {{ btn.text }}
          </v-btn>
        </v-btn-toggle>
      </v-container>
    </v-card>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import BroutineTab from './BroutineTab.vue'
import BcontrastTab from './BcontrastTab.vue'
import BresolutionTab from './BresolutionTab.vue'
import BgeometryTab from './BgeometryTab.vue'
import BsystemTab from './BsystemTab.vue'
import BphysioTab from './BphysioTab.vue'
import BsequenceTab from './BsequenceTab.vue'
import QuestionArea from './QuestionArea.vue'
import Bprogram from './Bprogram.vue'
import BdiffusionTab from './BdiffusionTab.vue'
// eslint-disable-next-line no-unused-vars
import EventBus from '@/lib/event-bus'
export default {
  data() {
    return {
      //mixins: [MriMixin, SelectionConfigMixin],
      component: 'QuestionArea',
      buttons: [
        { component: 'Bprogram', text: 'Program' },
        { component: 'BroutineTab', text: 'Routine' },
        { component: 'BcontrastTab', text: 'Contrast' },
        { component: 'BresolutionTab', text: 'Resolution' },
        { component: 'BgeometryTab', text: 'Geometry' },
        { component: 'BsystemTab', text: 'System' },
        { component: 'BphysioTab', text: 'Physio' },
        {
          component: 'QuestionArea',
          text: 'Question',
          additionalClasses: 'tab-blink',
          condition: () => this.isTakingTest,
        },
        {
          component: 'BdiffusionTab',
          text: 'Diff',
          condition: () => this.selectionConfigCurrent.sequenceType === 'DIFF',
        },
        { component: 'BsequenceTab', text: 'Sequence' },
      ],
    }
  },

  computed: {
    ...mapState('questionService', ['isSelectedTab']),
    ...mapGetters('dataToParent', ['getscanTime']),
    ...mapGetters('selectionConfig', ['selectionConfigCurrent']),
    ...mapGetters('testRunService', ['isTakingTest']),

    isQuestionAreaActive() {
      return this.component === 'QuestionArea'
    },
    visibleButtons() {
      return this.buttons.filter((btn) => !btn.condition || btn.condition())
    },
    ...mapGetters('questionService', ['selectedStackQuestionIndexVisual']),
  },

  methods: {
    ...mapActions('questionService', ['questionTabOpen']),
    updateChildData(data) {
      this.childData = data
      // console.log('Received data from child:', this.childData)
      this.emitDataToParent()
    },
    updateConComChildData(data) {
      this.childData = data
      // console.log('Received data from child updateConComChildData:', this.childData)
      this.emitDataToParent()
    },
    emitDataToParent() {
      this.$emit('update-data', {
        numberOfSlices: this.childData.numberOfSlices,
        repetitionTime: this.childData.repetitionTime,
        thickness: this.childData.thickness,
        spacing: this.childData.spacing,
        oversampling: this.childData.oversampling,
        scanTime: this.childData.scanTime,
        phaseVoxelSize: this.childData.phaseVoxelSize,
        frequencyVoxelSize: this.childData.frequencyVoxelSize,
        trueResolutionHeaderUltra: this.childData.trueResolutionHeaderUltra,
        trueResolutionHeader: this.childData.trueResolutionHeader,
        acquiredResolutionHeader: this.childData.acquiredResolutionHeader,
        minConcatAcqPackage: this.childData.minConcatAcqPackage,
        minSeqTr: this.childData.minSeqTr,
        labels: this.childData.labels,
      })
    },
    onRoutineTabFirstLoaded(data) {
      console.log('onRoutineTabFirstLoaded', data)
      this.isRoutineTabFistTimeLoaded = false
    },
  },

  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    sequenceType: {
      type: String,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
    shouldPausePopup: {
      type: Boolean,
      required: false,
      default: true,
    },
    useInitialUltraLabDefaults: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  components: {
    BroutineTab,
    BgeometryTab,
    BcontrastTab,
    BsequenceTab,
    BsystemTab,
    BresolutionTab,
    BphysioTab,
    QuestionArea,
    Bprogram,
    BdiffusionTab,
  },

  watch: {
    selectedStackQuestionIndexVisual(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.component = 'QuestionArea'
        this.$nextTick(() => {
          const activeButtons = document.querySelectorAll('.v-btn--active, .v-item--active')
          activeButtons.forEach((button) => {
            button.classList.remove('v-btn--active', 'v-item--active')
          })
        })
      }
    },

    // Watch the properties and emit when they change
    numberOfSlices() {
      this.emitDataToParent()
    },
    repetitionTime() {
      this.emitDataToParent()
    },
    thickness() {
      this.emitDataToParent()
    },
    spacing() {
      this.emitDataToParent()
    },
    oversampling() {
      this.emitDataToParent()
    },
    scanTime() {
      this.emitDataToParent()
    },
    phaseVoxelSize() {
      this.emitDataToParent()
    },
    frequencyVoxelSize() {
      this.emitDataToParent()
    },
    trueResolutionHeaderUltra() {
      this.emitDataToParent()
    },
    trueResolutionHeader() {
      this.emitDataToParent()
    },
    acquiredResolutionHeader() {
      this.emitDataToParent()
    },
    minConcatAcqPackage() {
      this.emitDataToParent()
    },
    minSeqTr() {
      this.emitDataToParent()
    },
  },
  mounted() {
    if (!this.isTakingTest) {
      this.component = 'BroutineTab'
    }
    console.log('scantime check', this.scanTime)
    console.log('isSelectedTab', this.isSelectedTab)
  },
}
</script>

<style scoped>
.bottom-section {
  height: 100% !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0px !important;
  background: #c0c0c0 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
}
.white-background {
  background: #d3d3d3 !important;
}
::v-deep .v-sheet.v-card:not(.v-sheet--outlined) {
  box-shadow: none !important; /* Completely disables any Vuetify box-shadow */
}
.btn-4 {
  background: #808080 !important;
  border: 1px solid black !important;
  border-top: 0px !important;
  height: 21px !important;
  color: white !important;
  border-radius: 0px !important;

  font-size: 10px !important;
  width: 11% !important;
  text-transform: capitalize !important;
}
/* .v-btn--active {
  animation-play-state: paused !important;
  background: #808080 !important;
} */
::v-deep .v-card__text {
  padding: 0px !important;
}
.v-btn:not(.v-btn--round).v-size--default {
  min-width: 0px !important;
}
.custom-container {
  max-width: 100% !important;
  width: 100% !important;
  padding: 0 !important;
  height: 100%;
}
.btn-1 {
  display: flex;
  background: black !important;
  width: 100% !important;
  gap: 1px;
  margin-top: 0%; /* default margin */
}

@media (min-width: 1706.67px) {
  .btn-1 {
    margin-top: 0%;
  }
}
@media (max-width: 2304px) {
  .btn-1 {
    margin-top: 0%;
  }
}
@media (min-width: 1396.36px) {
  .btn-1 {
    margin-top: 0%;
  }
}
@media (min-width: 1500.36px) {
  .btn-1 {
    margin-top: 0%;
  }
}
@media (min-width: 1706.67px) {
  .btn-1 {
    margin-top: 0%;
  }
}
@media (min-width: 1536px) {
  .btn-1 {
    margin-top: 0%;
  }
}
@media (max-width: 767px) {
  .btn-1 {
    margin-top: 0%;
  }
}

/* .v-btn {
  background: #808080 ;
  border: 1px solid black !important;
  border-top: 0px !important;
  height: 21px !important;
  color: white !important;
  border-radius: 0px !important;

  font-size: 10px !important;
  width: 11% !important;
  text-transform: capitalize !important;
} */
.btn-3,
.tab-blink {
  height: 21px !important;
  color: white !important;
  border-radius: 0px !important;
  font-size: 10px !important;
  text-transform: capitalize !important;
  flex-grow: 1;
  flex-basis: 0;
  min-width: 0 !important;
}
.btn-3 {
  background: #808080 !important;
}
.btn-3:hover,
.btn-3.v-btn--active.v-item--active {
  background: #c0c0c0 !important;
}
.tab-blink {
  animation: blinker 1.5s linear infinite;
  background: red !important;
  font-family: inherit;
}
@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>
