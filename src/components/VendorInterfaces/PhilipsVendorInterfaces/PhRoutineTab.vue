<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card>
    <v-card-text class="grey lighten-4" style="background-color: #d7d7d7 !important">
      <div class="horizontal-separator">
        <div class="main-1 mt-7">
          <div class="main-2" style="width: 95%; margin-left: 2rem">
            <div class="text-3 equal-grid-row">
              <div style="margin-right: 5.5rem">
                <v-label class="label-size" style="margin-bottom: 1.5rem">&ThinSpace;&ThinSpace;&ThinSpace;</v-label>
              </div>
              <span class="equal-grid-item">AP(freq)</span>
              <span class="equal-grid-item">RL(phase)</span>
              <span class="equal-grid-item">FH</span>
            </div>
            <div class="text-3 equal-grid-row mt-2" style="width: 98%">
              <div style="margin-right: 5.5rem">
                <v-label class="label-size" style="margin-bottom: 1.5rem">FOV</v-label>
              </div>
              <v-text-field
                v-model="dimensions3y"
                class="textbox-input equal-grid-item"
                :style="{ color: textColorText }"
              ></v-text-field>
              <span class="mx-2 mb-2" style="font-size: 20px">×</span>
              <v-text-field
                type="number"
                v-model="dimensions3x"
                @input="submitDimensions3x"
                class="textbox-input equal-grid-item"
                :style="{ color: textColorText }"
              ></v-text-field>
              <span class="mx-2 mb-2" style="font-size: 15px">mm</span>
              <span class="mb-2 mr-2" style="font-size: 20px">×</span>
              <v-text-field
                type="number"
                v-model="dimensions3zHalf"
                @change="submitDimensions3z"
                class="textbox-input equal-grid-item"
                :style="{ color: textColorText }"
              ></v-text-field>
              <span class="mx-2 mb-2" style="font-size: 15px">mm</span>
            </div>
            <div class="text-3 equal-grid-row mt-2" style="width: 98%">
              <div style="margin-right: 5rem">
                <v-label class="label-size" style="margin-bottom: 1.5rem">Voxel</v-label>
              </div>
              <v-text-field
                type="number"
                v-model="forcedFrequencyVoxelSize"
                class="textbox-input equal-grid-item"
                :style="{ color: textColorText }"
                @input="changeFrequencyVoxelSize($event)"
              ></v-text-field>
              <span class="mx-2 mb-2" style="font-size: 20px">×</span>
              <v-text-field
                type="number"
                v-model="forcedPhaseVoxelSize"
                class="textbox-input equal-grid-item"
                :style="{ color: textColorText }"
                @input="changePhaseVoxelSize($event)"
              ></v-text-field>
              <span class="mx-2 mb-2" style="font-size: 15px">mm</span>
              <span class="mb-2 mr-2" style="font-size: 20px">×</span>
              <v-text-field
                type="number"
                v-model="FHVoxel"
                @input="$store.commit('scanTimeConfig/SET_FHVOXEL', $event)"
                class="textbox-input equal-grid-item"
                :style="{ color: textColorText }"
              ></v-text-field>
              <span class="mx-2 mb-2" style="font-size: 15px">mm</span>
            </div>
            <div class="text-3 equal-grid-row mt-2">
              <div style="margin-right: 4.6rem">
                <v-label class="label-size">Matrix</v-label>
              </div>
              <v-text-field
                type="number"
                v-model="APMatrix"
                class="textbox-input equal-grid-item"
                :style="{ color: textColorText }"
              ></v-text-field>
              <!-- <span class="mx-1 mb-2" style="font-size: 15px"></span> -->
              <span class="mb-2 mx-2" style="font-size: 20px">×</span>
              <!-- <span class="mx-1 mb-2" style="font-size: 15px"></span> -->
              <v-text-field
                type="number"
                v-model="RLMatrix"
                class="textbox-input equal-grid-item"
                :style="{ color: textColorText }"
              ></v-text-field>
              <span class="mx-2 mb-2" style="font-size: 15px"></span>
              <span class="mx-2 mb-2" style="font-size: 15px"></span>
              <span class="mb-2" style="font-size: 20px; margin-left: 11px; margin-right: 8px">×</span>
              <v-text-field
                type="number"
                v-model="FHMatrix"
                class="textbox-input equal-grid-item"
                :style="{ color: textColorText }"
              ></v-text-field>
              <span class="mb-2" style="font-size: 15px; margin-left: 8px; margin-right: 10px">slices</span>
            </div>
            <div class="text-4 ttyy">
              <div class="text-4" style="padding: 0px 0px 0px 0px; margin-top: 1.2rem">
                <v-label>Gap</v-label>
                <!-- <v-checkbox v-model="isChecked" class="checkbox-input" style="margin-top: 0%;"></v-checkbox> -->
              </div>
              <div class="text-8 yytt">
                <input type="checkbox" id="gap" class="checkboxInner" v-model="isCheckedGap" />
                <div class="tyty"><v-label>default</v-label></div>
                <div class="ytyt">
                  <v-text-field
                    type="number"
                    v-model="defaultTxt"
                    class="textbox-input"
                    style="margin-left: 0.6rem"
                  ></v-text-field>
                </div>
                <span class="mx-2 mb-2" style="font-size: 15px; margin-top: 1rem">mm</span>
              </div>
            </div>
          </div>
        </div>

        <v-divider class="separator" style="margin-top: 1rem; margin-bottom: 1rem"></v-divider>

        <div class="main-1 mt-1">
          <div class="main-2" style="width: 22%; padding-left: 2rem">
            <div class="text-5">
              <div class="text-4" style="width: 16.8rem">
                <div style="margin-top: 0.3rem">
                  <v-label>NSA</v-label>
                </div>
                <v-text-field
                  @input="setAverages"
                  type="number"
                  v-model.number="averages"
                  class="textbox-input"
                  style="margin-left: 5.3rem"
                  max="8"
                  step="1"
                  min="1"
                ></v-text-field>
              </div>
              <div class="text-4" style="width: 15rem; margin-top: 1rem">
                <v-label>Fat saturation</v-label>

                <input
                  type="checkbox"
                  style="margin-left: 1.5rem; margin-right: 0.8rem"
                  class="checkboxInner"
                  v-model="fatSuppression"
                />
                <v-label>SPIR</v-label>
              </div>
            </div>
          </div>
        </div>
        <v-divider class="separator" style="margin-top: 1rem"></v-divider>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import SpinButton from './PhSpinButton.vue'
import DropDownText from './PhDropDownText.vue'
import EventBus from '@/lib/event-bus'
import _ from 'lodash'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  // eslint-disable-next-line vue/no-unused-components
  components: { SpinButton, DropDownText },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {}
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    ...mapActions('selectionConfig', ['updateField', 'resetAllFields']),
    ...mapActions('scanTimeConfig', [
      'updateVendorStylePreference',
      'updateIsUltraLab',
      'updateSelectionIdent',
      'updateOversamplingPercentage',
      'updateTrueResolutionHeaderUltra',
      'updateTrueResolutionHeader',
      'updateAcquiredResolutionHeader',
      'updateMinConcatAcqPackage',
      'updateRepetitionTime',
    ]),
    ...mapMutations('dataToParent', ['setScanTime', 'setSequenceType']),
    ...mapActions('dataToParent', ['updateScanTime', 'updateOversamplings']),
    updateExample() {
      this.updateField({ field: 'APFOV', value: 320 }) // Example of updating a field
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
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    ...mapState('scanTimeConfig', [
      'APFOV',
      'RLFOV',
      'FHFOV',
      'APVoxel',
      'RLVoxel',
      'FHVoxel', // Need checking!!!!
      'APMatrix',
      'RLMatrix',
      'FHMatrix',
      'defaultTxt',
      'NSA',
      'isCheckedGap',
      'isCheckedFS',
      'textColorText',
    ]),
  },
  mounted() {
    console.log('this.scanTime', this.scanTime)
    this.setScanTime(this.scanTime)
    this.updateSeqValues()
    this.$emit('scan-time-generated', this.scanTime)
    this.$store.dispatch('scanTimeConfig/updateMinConcatAcqPackage', this.minConcatAcqPackage)
    this.updateScanTime(this.scanTime)
    this.updateTrueResolutionHeaderUltra(this.trueResolutionHeaderUltra)
    this.updateTrueResolutionHeader(this.trueResolutionHeader)
    this.updateAcquiredResolutionHeader(this.acquiredResolutionHeader)
    this.updateVendorStylePreference(this.vendorStylePreference)
    this.updateIsUltraLab(this.isUltraLab)
    this.updateSelectionIdent(this.selectionIdent)
    this.updateRepetitionTime(this.repetitionTime)
    EventBus.$on('onSliceViewWindowChange', this.onSliceViewWindowChange)
    if (this.minConcatAcqPackage > this.repetitionTime) {
      if (this.selectionConfig?.sequenceType === 'TE') {
        this.concatenations = _.round(
          ((this.echoSpacing + 5) * (this.echoTrainLength ? this.echoTrainLength : 1) * this.numberOfSlices) /
            this.repetitionTime
        )
      } else if (this.selectionConfig?.sequenceType === 'SE') {
        this.concatenations = _.round(((this.echoSpacing + 5) * this.numberOfSlices) / this.repetitionTime)
        if (this.concatenations <= 1) {
          this.concatenations = 2
        }
      }
    }
  },
  watch: {
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
    repetitionTime(newVal, oldVal) {
      this.updateSeqValues()
      if (newVal !== oldVal) {
        this.updateRepetition(newVal)
        // this.emitData()
      }
    },
  },
}
</script>

<style scoped>
.indented-input input {
  text-indent: 10px; /* Adjust the value for desired indentation */
}

.equal-grid-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.equal-grid-item {
  font-size: 10px !important;
  flex: 1;
}
.equal-grid-item:first-child {
  flex: none; /* Fix the width of the first field */
  width: 100px; /* Adjust the width as needed */
}
.horizontal-separator {
  display: flex;
  flex-direction: column;
}
.separator {
  flex-grow: 1;
  height: 1px;
  background-color: #ccc;
  margin: 0 10px;
  border-width: thin 100% 0;
  display: block;
}
.v-btn {
  font-size: 11px !important;
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
}

::v-deep .theme--light.v-select .v-select__selections {
  color: black !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

::v-deep .theme--light.v-input input {
  color: black;
  font-size: small;
  text-align: left;
}

.text-input {
  max-width: 100%;
  width: 38%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
}

.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}

::v-deep .v-text-field__details {
  display: none;
}

[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

::v-deep .v-input.textbox-input.equal-grid-item .v-input__control .v-input__slot .v-text-field__slot input {
  margin-left: 5px;
}

::v-deep .v-input.textbox-input .v-input__control .v-input__slot .v-text-field__slot input {
  /* Your styles here */
  margin-left: 5px;
}

.v-input--is-focused {
  display: block !important;
}

label {
  font-size: 100%;
}
span {
  font-size: 70%;
}

.text-2 {
  display: flex;
  justify-content: flex-start;
}

.text-1 {
  display: flex;
  justify-content: space-between;
}
.text-4 {
  display: flex;
  /* justify-content: space-around; */
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}

.text-3 {
  display: flex;
  justify-content: flex-start;
}

::v-deep .v-input__icon {
  height: 10px !important;
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

::v-deep .v-text-field {
  padding-top: 0px !important;
  margin-top: 0px !important;
}

::v-deep .v-text-field__slot {
  background: #dfe2e2 !important;
  border-color: #dfe2e2 !important;
  border-radius: 0px;
  border: 1px solid #dfe2e2 !important;
  height: 2rem !important;
  width: 7rem !important;
  border-bottom: none;
  border-radius: 4px;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0px;
}

::v-deep .v-icon.v-icon {
  color: white !important;
  font-size: 17px;
}

.v-input {
  max-width: 100%;
  border-radius: 0px;
}

::v-deep .v-text-field input {
  padding: 0px;
}

.btn-2 {
  width: 20px !important;
  height: 15px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #423c3c !important;
  margin: 0.15rem;
  border-radius: 0px;
}

.btn-3 {
  width: 35px !important;
  height: 20px !important;
  background: #423c3c !important;
  border-radius: 0px;
}

.btn-4 {
  display: flex;
  justify-content: flex-end;
  background: #383535 !important;
  padding: 0px 4px !important;
  width: 80px !important;
  height: 16px !important;
  box-shadow: none;
  border-radius: 0px;
  border: none !important;
  font-size: 10px !important;
  font-weight: inherit !important;
  text-transform: inherit !important;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: 0px !important;
}

.main-1 {
  display: flex;
  justify-content: start;
  /* width: 100%; */
}

.main-2 {
  width: 50%;
  color: rgb(0, 0, 0) !important;
}

.btn-1 {
  display: flex;
  width: 66.75%;
  justify-content: space-between;
}

.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
}

.v-sheet.v-card {
  border-radius: 0px;
}

.text-5 {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}
.v-input--selection-controls__input {
  height: 10px;
}
.checkboxInner::before {
  margin-left: 1rem;
  background-color: #d5d7d7; /* Set the inner color of the checkbox */
}
@media only screen and (max-width: 1200px) {
  .main-1 {
    display: flex;
    justify-content: start;
    width: 80%;
    margin-right: 7rem;
  }
}
.ttyy {
  margin-left: 18.5rem;
}

.yytt {
  margin-left: 7.2rem;
}

.ytyt {
  margin-top: 0.7rem;
  width: 165px;
}

.tyty {
  margin-top: 1rem;
  margin-left: 0.6rem;
}

@media screen and (max-width: 1680px) and (max-height: 1050px) {
  .ttyy {
    margin-left: 16.3rem;
  }

  .yytt {
    margin-left: 6.2rem;
  }

  .ytyt {
    margin-top: 0.7rem;
    width: 138px;
  }

  .tyty {
    margin-left: 0.9rem;
  }
}

@media screen and (max-width: 1440px) and (max-height: 900px) {
  .ttyy {
    margin-left: 15.5rem;
  }

  .yytt {
    margin-left: 5.2rem;
  }

  .ytyt {
    margin-top: 0.7rem;
    width: 123px;
  }
}
.text-8 {
  display: flex;
  justify-content: normal;
}
</style>
