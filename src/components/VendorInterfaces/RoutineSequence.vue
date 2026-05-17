<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="custom-container col-md-9">
    <v-card class="bottom-section">
      <v-btn-toggle>
        <div class="btn-1">
          <v-btn
            :class="{ 'v-btn--active v-item--active': component === 'RoutineTab' }"
            @click="component = 'RoutineTab'"
            >Routine</v-btn
          >
          <v-btn @click="component = 'ContrastTab'">Contrast</v-btn>
          <v-btn @click="component = 'ResolutionTab'">Resolution</v-btn>
          <v-btn @click="component = 'GeometryTab'">Geometry</v-btn>
          <v-btn @click="component = 'SystemTab'">System</v-btn>
          <v-btn @click="component = 'PhysioTab'">Physio</v-btn>
          <v-btn v-if="sequenceType === 'DIFF'" @click="component = 'DiffTab'">Diff</v-btn>
          <v-btn @click="component = 'InlineTab'">Inline</v-btn>
          <v-btn @click="component = 'SequenceTab'">Sequence</v-btn>
        </div>
      </v-btn-toggle>

      <v-card-text>
        <component
          :is="component"
          :selection-ident="selectionIdent"
          :sequence-type="sequenceType"
          :is-ultra-lab="isUltraLab"
          :should-pause-popup="shouldPausePopup"
          :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults && isRoutineTabFistTimeLoaded"
          @scan-time-generated="handleScanTimeGenerated"
          @updateData="updateChildData"
          @updateConcomData="updateConComChildData"
          @on-routine-tab-mounted="onRoutineTabFirstLoaded"
        />
      </v-card-text>
    </v-card>
  </div>
</template>
<script>
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin'
import { MriMixin } from '../Mixins/MriMixin'
import ContrastTab from './ContrastTab.vue'
import GeometryTab from './GeometryTab.vue'
import RoutineTab from './RoutineTab.vue'
import SequenceTab from './SequenceTab.vue'
import SystemTab from './SystemTab.vue'
import ResolutionTab from './ResolutionTab.vue'
import InlineTab from './InlineTab.vue'
import PhysioTab from './PhysioTab.vue'
import DiffTab from './DiffusionTab.vue'

import { mapState, mapActions, mapGetters } from 'vuex'

export default {
  name: 'RoutineSequence',
  data() {
    return {
      //mixins: [MriMixin, SelectionConfigMixin],
      component: 'RoutineTab',
      isRoutineTabFistTimeLoaded: true,
      childData: {},
    }
  },
  components: {
    RoutineTab,
    GeometryTab,
    ContrastTab,
    SequenceTab,
    SystemTab,
    ResolutionTab,
    PhysioTab,
    InlineTab,
    DiffTab,
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
  methods: {
    handleScanTimeGenerated(scanTime) {
      this.$emit('scan-time-generated-up', scanTime)
    },
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
  computed: {
    ...mapState('selectionConfig', [
      'selectionConfigsByIdent',
      'isFullscreen',
      'isAddLocalizerMode',
      'toolSelected',
      'toolSelectedConfig',
      'showReferenceLines',
      'referenceSliceCornersBySliceViewId',
      'hasAddedLocalizer',
    ]),
    // ...mapGetters('scanTimeConfig', ['getOversampling']),
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    // ...mapState('scanTimeConfig', ['selectedMagnItems', 'selectedFetOptions', 'Fetoptions']),

    //...mapGetters('dataToParent', ['getSequenceType']),
  },

  watch: {
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
    console.log('counting: routine seq mounted')
    console.log('this.repetitionTime sequence=======', this.repetitionTime)
    console.log('this. sequence Type=======', this.getSequenceType)
  },
}
</script>

<style scoped>
::v-deep .theme--light.v-btn-toggle:not(.v-btn-toggle--group) {
  background: black !important;
}
::v-deep .v-card__text {
  padding: 0;
  background: rgb(46, 44, 44);
  position: absolute;
  top: 36px;
  bottom: 0;
}

.bottom-section {
  height: 100%;
  background: rgb(46, 44, 44);
  position: relative;
}

.v-btn {
  font-size: 60% !important;
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252 !important;
  border-bottom: 1px solid #5a5252 !important;
  border-radius: 0;
  border-top: none !important;
  /* border-right: none !important; */
  min-width: 18.75% !important;
  height: 1.5rem;
}

.v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  height: 36px;
  background: black;
}

.v-btn-toggle {
  width: 100%;
}

.v-card-text {
  height: 88%;
}

.text-1 {
  display: flex;
  justify-content: space-between;
}

/* Adjustments for responsiveness */
::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0;
}

::v-deep.v-input__slot {
  margin-bottom: 0;
}

::v-deep.v-text-field.v-text-field--enclosed .v-text-field__details {
  margin-bottom: 0;
}

.v-text-field {
  padding-top: 0;
  margin-top: 0;
}

::v-deep .v-text-field__slot {
  background: #383535;
  border-color: #383535;
  border-radius: 0;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0;
}

::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 1.5rem;
  border-bottom: none;
  border-radius: 4px;
}

::v-deep .v-icon.v-icon {
  color: white !important;
}

.v-input {
  max-width: 45%;
}

::v-deep .v-text-field input {
  padding: 0;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 6px;
  right: 10px;
  top: 10px;
}

.v-card {
  background: black;
  width: 100%;
  height: 100%;
}

.main-1 {
  display: flex;
  justify-content: space-around;
}

.main-2 {
  color: white !important;
}

.v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  border: 1px solid #5a5252 !important;
  border-radius: 0;
  border-top: none !important;
  border-right: none !important;
  width: 12.5%;
}

.btn-1 {
  display: flex;
  width: 89%;
  justify-content: space-between;
}

.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
  height: 100%;
}

.v-sheet.v-card {
  border-radius: 0;
}

.v-btn:not(.v-btn--round).v-size--default {
  min-width: 0px !important;
}

.v-btn {
  font-size: 8px !important;
}

.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: rgb(49, 49, 49) !important;
}

/* Responsive Styles */

/* Mobile Devices (Portrait and Landscape) */
@media (max-width: 767px) {
  ::v-deep .v-card__text {
    top: 0;
    bottom: 0;
  }

  .bottom-section {
    height: auto;
  }

  .v-btn {
    font-size: 50% !important;
    min-width: 20% !important;
    height: 2rem;
  }

  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    height: 36px;
    font-size: 50% !important;
  }

  .v-card-text {
    height: auto;
  }

  .text-1 {
    flex-direction: column;
    align-items: stretch;
  }

  .v-input {
    max-width: 90%;
  }

  .main-1,
  .btn-1 {
    flex-direction: column;
    align-items: center;
  }

  .custom-container.col-md-9 {
    max-width: 100% !important;
  }

  .v-btn {
    font-size: 10px !important;
  }
}

/* Tablets and Small Desktops */
@media (min-width: 768px) and (max-width: 1024px) {
  ::v-deep .v-card__text {
    top: 30px;
  }

  .bottom-section {
    height: auto;
  }

  .v-btn {
    font-size: 55% !important;
    min-width: 15% !important;
    height: 1.75rem;
  }

  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    height: 36px;
    font-size: 55% !important;
  }

  .v-card-text {
    height: 90%;
  }

  .text-1 {
    flex-direction: row;
  }

  .v-input {
    max-width: 60%;
  }

  .main-1,
  .btn-1 {
    flex-direction: row;
  }

  .custom-container.col-md-9 {
    max-width: 75% !important;
  }

  .v-btn {
    font-size: 10px !important;
  }
}

/* Large Desktops and Bigger Screens */
@media (min-width: 1025px) {
  ::v-deep .v-card__text {
    top: 36px;
  }

  .bottom-section {
    height: 100%;
  }

  .v-btn {
    font-size: 60% !important;
    min-width: 18.75% !important;
    height: 1.5rem;
  }

  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    height: 36px;
    font-size: 60% !important;
  }

  .v-card-text {
    height: 88%;
  }

  .text-1 {
    flex-direction: row;
  }

  .v-input {
    max-width: 45%;
  }

  .main-1,
  .btn-1 {
    flex-direction: row;
  }

  .custom-container.col-md-9 {
    max-width: 66.6% !important;
  }

  .v-btn {
    font-size: 8px !important;
  }
}
</style>
