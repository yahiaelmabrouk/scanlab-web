<template>
  <div>
    <v-card width="100%" height="100%">
      <v-btn-toggle class="btn-1">
        <v-btn
          :class="{ 'v-btn--active v-item--active': component === 'ContrastCommon' }"
          @click="component = 'ContrastCommon'"
          >Common</v-btn
        >
        <v-btn @click="component = 'ContrastDynamic'">Dynamic</v-btn>
      </v-btn-toggle>
      <v-card-text>
        <div>
          <component
            :is="component"
            :selection-ident="selectionIdent"
            :sequence-type="sequenceType"
            :is-ultra-lab="isUltraLab"
            :shouldPausePopup="shouldPausePopup"
            @updateConcomData="updateConcomChildData"
          />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import ContrastCommon from './ContrastCommon.vue'
import ContrastDynamic from './ContrastDynamic.vue'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin'
import { MriMixin } from '../Mixins/MriMixin.js'
export default {
  //mixins: [MriMixin, SelectionConfigMixin],
  name: 'ContrastTab',
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
  },
  data() {
    return {
      component: 'ContrastCommon',
      childConComData: {},
    }
  },
  components: { ContrastCommon, ContrastDynamic },

  methods: {
    updateConcomChildData(data) {
      this.childConComData = data
      console.log('Received data from childConComData:', this.childConComData)
      this.emitConComDataToParent()
    },
    emitConComDataToParent() {
      this.$emit('update-Concom-Data', {
        numberOfSlices: this.childConComData.numberOfSlices,
        repetitionTime: this.childConComData.repetitionTime,
        thickness: this.childConComData.thickness,
        spacing: this.childConComData.spacing,
        oversampling: this.childConComData.oversampling,
        scanTime: this.childConComData.scanTime,
        phaseVoxelSize: this.childConComData.phaseVoxelSize,
        frequencyVoxelSize: this.childConComData.frequencyVoxelSize,
        trueResolutionHeaderUltra: this.childConComData.trueResolutionHeaderUltra,
        trueResolutionHeader: this.childConComData.trueResolutionHeader,
        acquiredResolutionHeader: this.childConComData.acquiredResolutionHeader,
        minConcatAcqPackage: this.childConComData.minConcatAcqPackage,
        minSeqTr: this.childConComData.minSeqTr,
        labels: this.childConComData.labels,
      })
    },
  },
  watch: {
    // Watch the properties and emit when they change
    numberOfSlices() {
      this.emitConComDataToParent()
    },
    repetitionTime() {
      this.emitConComDataToParent()
    },
    thickness() {
      this.emitConComDataToParent()
    },
    spacing() {
      this.emitConComDataToParent()
    },
    oversampling() {
      this.emitConComDataToParent()
    },
    scanTime() {
      this.emitConComDataToParent()
    },
    phaseVoxelSize() {
      this.emitConComDataToParent()
    },
    frequencyVoxelSize() {
      this.emitConComDataToParent()
    },
    trueResolutionHeaderUltra() {
      this.emitConComDataToParent()
    },
    trueResolutionHeader() {
      this.emitConComDataToParent()
    },
    acquiredResolutionHeader() {
      this.emitConComDataToParent()
    },
    minConcatAcqPackage() {
      this.emitConComDataToParent()
    },
    minSeqTr() {
      this.emitConComDataToParent()
    },
  },
  mounted() {
    // this.sequenceType = "TE"
    console.log('--- Calculation State Log Start routine ---')
    console.log('Oversampling:', this.oversampling)
    console.log('Phase Matrix:', this.phaseMatrix)
    console.log('Frequency Matrix:', this.frequencyMatrix)
    console.log('Dimensions 3X:', this.dimensions3x)
    console.log('Dimensions 3Y:', this.dimensions3y)
    console.log('Partial Fourier:', this.partialFourier)
    console.log('Averages:', this.averages)
    console.log('Concatenations:', this.concatenations)
    console.log('Repetition Time:', this.repetitionTime)
    console.log('Echo Train Length:', this.echoTrainLength)
    console.log('Parallel Factor:', this.parallelFactor)
    console.log('Vendor Style Preference:', this.vendorStylePreference)
    console.log('Sequence Type:', this.sequenceType)
    console.log('scanTime ', this.scanTime)
    console.log('--- Calculation State Log End routine ---')
    // console.log('this.childData=======', this.childData)
    // console.log('this.childConComData=======', this.childConComData)
    // console.log('minSeqTr--------', this.minSeqTr)
    // console.log('minConcatAcqPackage--------', this.minConcatAcqPackage)
  },
}
</script>
<style scoped>
/* dropdown background style */
.theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}
.theme--light.v-list {
  background: #565656;
  color: rgb(0 0 0 / 87%);
}
.theme--light.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: rgb(255 255 255 / 87%);
}
.theme--light.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: rgb(255 255 255 / 87%);
}
::v-deep .v-application .primary--text {
  color: #ffffff !important;
  caret-color: #ffffff !important;
}
::v-deep .v-list-item__title {
  color: #ffffff !important;
}
::v-deep .v-list-item--link:before {
  background-color: lightgray !important;
}
.active-list-item {
  background-color: darkgray;
}

/* dropdown background style */

.btn-1 {
  display: flex;
  width: 100%;
  background: black !important;
}

.v-card {
  background: black !important;
}

.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: rgb(136, 136, 136) !important;
  /* background: rgb(163, 18, 18) !important; */
}

.v-btn-toggle {
  width: 100%;
}

.v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  border: 1px solid #5a5252 !important;
  border-radius: 0px;
  border-top: none !important;
  width: 12.5%;
}

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}

::v-deep .v-card__text {
  padding: 0px;
  width: 100%;
}

.v-btn:not(.v-btn--round).v-size--default {
  min-width: 0px !important;
}

.v-btn {
  font-size: 8px !important;
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: 0px;
  border-top: none !important;
  height: 23px !important;
}

/* Responsive Styles */

/* Mobile Devices (Portrait and Landscape) */
@media (max-width: 767px) {
  .v-btn {
    font-size: 7px !important;
    height: 20px !important;
  }

  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    width: 25% !important;
  }
}

/* Tablets and Small Desktops */
@media (min-width: 768px) and (max-width: 1024px) {
  .v-btn {
    font-size: 8px !important;
    height: 22px !important;
  }

  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    width: 15% !important;
  }
}

/* Large Desktops and Bigger Screens */
@media (min-width: 1025px) {
  .v-btn {
    font-size: 8px !important;
    height: 23px !important;
  }

  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    width: 12.5% !important;
  }
}
</style>
