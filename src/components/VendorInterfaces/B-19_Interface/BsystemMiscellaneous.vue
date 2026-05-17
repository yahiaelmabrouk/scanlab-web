<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-card-text>
      <div class="main-1 mt-2">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Positioning mode</label>

            <div class="text-2">
              <v-select
                :items="positionSelectionOptions"
                v-model="positionSelectedValue"
                color="#423c3c"
                dense
                outlined
                style="width: 15.5vw; max-width: 53%; margin-left: 3%"
              ></v-select>
            </div>
          </div>
          <div class="text-3 mt-2">
            <label class="label-size inactive-label">Table Position</label>
            <v-select
              color="#423c3c"
              dense
              outlined
              :items="tablePositionOptions"
              v-model="selectedTablePosition"
              class="ml-2 tablepos"
            ></v-select>
            <div class="text-input" style="margin-top: 8px; margin-left: 5px">
              <BspinButton
                :type="'number'"
                v-model.number="tableNumbers"
                :value="tableNumbers"
                :step="1"
                :min="1"
                :max="100"
                :disabled="complete || isAddLocalizerMode"
                style="background-color: white"
                class="tableposmm"
              />
              <span class="unit-text">mm</span>
            </div>
          </div>
          <div class="text-3 mt-2">
            <label class="label-size inactive-label">Table Position memory</label>

            <BspinButton
              @input="changeTablPositionmry"
              :type="'number'"
              :value="tablPositionmry"
              :step="1"
              :min="1"
              :max="10"
              :disabled="complete"
              class="input-lock"
            />
          </div>
          <h5 style="color: black" class="imageno">Image Numbering</h5>

          <div class="text-1">
            <label class="label-size inactive-label">MSMA</label>
            <div class="text-2">
              <v-select
                v-model="MSMAVavlue"
                :items="MSMA"
                color="#423c3c"
                dense
                outlined
                style="width: 15.5vw; max-width: 56%; margin-left: 2%"
              ></v-select>
            </div>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Saggital</label>
            <div class="text-2">
              <v-select
                v-model="sagValue"
                :items="sag"
                color="#423c3c"
                dense
                outlined
                style="width: 15.5vw; max-width: 56%; margin-left: 2%"
              ></v-select>
            </div>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Coronal</label>
            <div class="text-2">
              <v-select
                v-model="coronalValue"
                :items="coronal"
                color="#423c3c"
                dense
                outlined
                style="width: 15.5vw; max-width: 56%; margin-left: 2%"
              ></v-select>
            </div>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Transversal</label>
            <div class="text-2">
              <v-select
                v-model="transversaValue"
                :items="transversa"
                color="#423c3c"
                dense
                outlined
                style="width: 15.5vw; max-width: 56%; margin-left: 2%"
              ></v-select>
            </div>
          </div>
        </div>

        <div class="main-2">
          <div class="text-3 ml-8">
            <label class="label-size-1 mr-2 inactive-label">Save Uncombined</label>
            <checkbox />
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">Matrix Coil Mode</label>
            <v-select
              v-model="matrixOptValue"
              :items="matrixOpt"
              color="#423c3c"
              dense
              outlined
              style="width: 15.5vw; max-width: 30%; margin-left: 2%"
            ></v-select>
          </div>
          <div class="main-3">
            <div class="text-3">
              <label class="label-size inactive-label">Coil combine mode</label>
              <v-select
                color="#423c3c"
                v-model="coilCombinationValue"
                :items="coilCombination"
                dense
                outlined
                style="width: 15.5vw; max-width: 30%; margin-left: 2%"
              ></v-select>
            </div>
            <div class="text-3 mb-12">
              <label class="label-size inactive-label">Auto Coil Select</label>
              <v-select
                color="#423c3c"
                :items="autoCoilSelectOptions"
                v-model="autoCoilSelect"
                dense
                outlined
                style="width: 15.5vw; max-width: 30%; margin-left: 2%"
              ></v-select>
            </div>
          </div>
        </div>
      </div>
      <!-- <div class="main-1">
        <div class="bottom-card"></div>
      </div> -->
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from '../B-19_Interface/BspinButton.vue'
import checkbox from './CustomCheckbox.vue'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  components: { BspinButton, checkbox },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      autoCoilSelect: 'Default',
      autoCoilSelectOptions: ['Default', 'On', 'Off'],
      positionSelectedValue: 'ISO',
      //   tablPosition: 1,
      //   tablPositionmry: 1,
      MSMAVavlue: 'S>T>C',
      sagValue: 'L>R',
      coronalValue: 'A>P',
      transversaValue: 'H>F',
      positionSelectionOptions: ['ISO', 'REF', 'FIX'],
      MSMA: ['S>T>C', 'T>S>C', 'C>T>S'],
      sag: ['R>L', 'L>R'],
      coronal: ['A>P', 'P>A'],
      transversa: ['H>F', 'F>H'],
      coilCombinationValue: 'Adaptive Combine',
      coilCombination: ['Adaptive Combine', 'Sum of Squares'],
      matrixOptValue: 'Off',
      matrixOpt: ['Off', 'Performance', 'Cardio'],
      selectedTablePosition: 'F',
      tablePositionOptions: ['F', 'H'],
      tableNumbers: 1,
    }
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    ...mapActions('dataToParent', ['updateScanTime']),
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
  },
  watch: {
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
  },
}
</script>

<style scoped>
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 36%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 7%;
  border: 2px solid black;
}
.text-input {
  max-width: 20%; /* Adjusted width */
  width: 20%;
  margin-left: 2%;
  /* background: #383535; */
  border-radius: 0px !important;
  /* border: 1px solid #383535 !important; */
  height: 1rem !important;
  border-bottom: none;
  display: flex;
  align-items: center;
}
.unit-text {
  color: black;
  margin-left: 5px;
  font-size: 12px;
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

.label-size-1 {
  width: 63%;
  display: flex;
  justify-content: right;
}

h6 {
  color: black;
}

::v-deep .v-text-field__details {
  display: none;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

.v-input--is-focused {
  display: block !important;
}

label,
span {
  font-size: 80%;
  color: black;
}

.text-2 {
  display: flex;
  justify-content: flex-start;
}

.text-1 {
  display: flex;
  justify-content: flex-start;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}

.text-3 {
  display: flex;
  justify-content: flex-start;
}

::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}

::v-deep .v-input__icon {
  height: 19px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
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
  margin-top: none !important;
}

::v-deep .v-input__slot fieldset {
  background: white;
  border-color: white !important;
  border-radius: 0px;
}

.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.5rem;
  width: 27%;
  margin-left: 8px;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  font-size: 17px;
}

.v-input {
  max-width: 30%;
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

::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 11px;
  top: 0px !important;
  height: 28px;
}

.main-1 {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.main-2 {
  width: 50%;
  color: white !important;
}

.main-3 {
  height: 17vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
}

.btn-1 {
  display: flex;
  width: 66.75%;
  justify-content: space-between;
}

.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
  height: 86%;
}

.v-sheet.v-card {
  border-radius: 0px;
}
::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin: 0px 4px 0px 0px !important;
}
.tablepos {
  max-width: 14%;
}

.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

/* Responsive Styles */
@media (max-width: 2048px) {
  .tablepos {
    max-width: 14%;
  }
  .imageno {
    margin: 2% 0% 2% 14%;
  }
}
@media (max-width: 2304px) {
  .tablepos {
    max-width: 15%;
  }
  .imageno {
    margin: 2% 0% 2% 14%;
  }
}
@media (max-width: 1920px) {
  .tablepos {
    max-width: 14%;
  }
  .imageno {
    margin: 2% 0% 2% 12%;
  }
}
@media (max-width: 1800px) {
  .bottom-card {
    margin-top: 14% !important;
  }
  .tableposmm {
    max-width: 70%;
    width: 66%;
    background: white;
  }
}

@media (max-width: 1706.67px) {
  .tablepos {
    max-width: 13%;
  }
  .tableposmm {
    max-width: 70%;
  }
  .imageno {
    margin: 2% 0% 2% 9%;
  }
}
@media (max-width: 1536px) {
  .tablepos {
    max-width: 14%;
  }
  .tableposmm {
    max-width: 63%;
  }
  .imageno {
    margin: 2% 0% 2% 5%;
  }
}

@media (max-width: 1396.36px) {
}
@media (max-width: 1228.8px) {
}

@media (max-width: 1200px) {
  .tablepos {
    max-width: 14%;
  }
}
@media (max-width: 768px) {
  .tablepos {
    max-width: 14%;
  }
}

@media (max-width: 480px) {
  .tablepos {
    max-width: 14%;
  }
}
</style>
