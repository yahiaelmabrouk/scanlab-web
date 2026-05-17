<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-card-text>
      <div class="main-1 mt-1">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Shim mode</label>

            <div class="text-2">
              <v-select
                :items="shimModeOptions"
                v-model="selectedShimValue"
                color="#423c3c"
                dense
                outlined
                class="shimMode"
              ></v-select>
            </div>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Adjust with body coil </label>
            <checkbox />
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Confirm freq. adjustment</label>
            <checkbox />
          </div>

          <div class="text-1">
            <label class="label-size inactive-label">Assume Silicone</label>
            <div class="text-2">
              <checkbox />
            </div>
          </div>
          <div class="text-1">
            <label class="label-size inactive-label">Assume Dominant Fat</label>
            <div class="text-2">
              <checkbox />
            </div>
          </div>
          <div class="text-1 mt-3 tableML">
            <v-card class="design-card" color="#C0C0C0">
              <v-card-text>
                <!-- Table Structure -->
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Tx Ref [Nucleus]</th>
                      <th>Ref.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Ref. amplitude 1H</td>
                      <td>485.850</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                <!-- Reset Button -->
                <div class="reset-button-container">
                  <button class="retro-button">Reset</button>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>

        <div class="main-2">
          <div class="text-3 AdjTol">
            <label class="label-size inactive-label">Adjustment Tolerance</label>
            <v-select
              :items="adjustmentToleranceOptions"
              v-model="adjustmentToleranceValue"
              color="#423c3c"
              dense
              outlined
              style="width: 15.5vw; max-width: 28%; margin-left: 2%"
              @change="updatePositionSelectedValue"
            ></v-select>
          </div>
          <h5 class="Adjustvolume mt-5" style="color: black">Adjust volume</h5>

          <div class="text-1 mt-2">
            <label class="label-size inactive-label">Position</label>
            <div class="text-2">
              <v-select
                color="#423c3c"
                disabled
                dense
                outlined
                class="position disabledClass border border-dark"
                :items="getPositionOptions"
                v-model="getPositionSelectedValue"
              ></v-select>
              <div>
                <v-btn class="btn-2">...</v-btn>
              </div>
            </div>
          </div>
          <div class="text-1">
            <label class="label-size active-label">Orientation</label>
            <div class="text-2">
              <!-- <v-select color="#423c3c" dense outlined style="width: 17vw; max-width: 55%; margin-left: 2%"></v-select> -->
              <v-select
                v-model="selectedValue"
                :items="selectableOptions"
                :disabled="isAddLocalizerMode"
                color="#423c3c"
                dense
                outlined
                class="position"
                @change="handleSelectionChange"
              >
                {{ selectedValue }}
                <v-icon small>mdi-menu-down</v-icon>
              </v-select>

              <div>
                <v-btn class="btn-2">...</v-btn>
              </div>
            </div>
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">Rotation</label>

            <BspinButton
              @input="changeRotation"
              :type="'number'"
              :value="rotation"
              :step="0.5"
              :min="0.0"
              :max="10"
              :disabled="complete"
              class="input-lock"
            />
            <span class="mx-2">deg</span>
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">R>>L</label>

            <BspinButton
              @input="changeRL"
              :type="'number'"
              :value="rl"
              :step="1"
              :min="1"
              :max="10"
              :disabled="complete"
              class="input-lock"
            />
            <span class="mx-2">mm</span>
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">A>>P</label>

            <BspinButton
              @input="changeAP"
              :type="'number'"
              :value="ap"
              :step="1"
              :min="1"
              :max="10"
              :disabled="complete"
              class="input-lock"
            />
            <span class="mx-2">mm</span>
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">F>>H</label>

            <BspinButton
              @input="changeFH"
              :type="'number'"
              :value="fh"
              :step="1"
              :min="1"
              :max="10"
              :disabled="complete"
              class="input-lock"
            />
            <span class="mx-2">mm</span>
          </div>
          <!-- <div class="text-1 mt-1 mb-2 ">
            <v-btn class="reset-button" color="grey">Reset</v-btn>
          </div> -->
          <div class="text-1 mt-2 mb-2 reset2">
            <button class="retro-button">Reset</button>
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
import BspinButton from './BspinButton.vue'
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
      shimModeOptions: ['Tune Up', 'Standard', 'Cardiac', 'Foot/Ankle'],
      selectedShimValue: 'Tune Up',
      selectedValue: 'transversal',
      isAddLocalizerMode: false,
      selectableOptions: ['transversal', 'coronal', 'sagittal'],
      adjustmentToleranceOptions: [
        'Tolerance Range',
        'Incremental Tolerance',
        'Percentage Tolerance',
        'Absolute Tolerance',
        'Dynamic Tolerance',
        'Auto(Maximum)',
      ],
      adjustmentToleranceValue: 'Auto(Maximum)',
      rl: 1,
      ap: 1,
      fh: 1,
      rotation: 0.0,
    }
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    ...mapActions('b19AllValuesSelection', ['updatePositionSelectedValue']),
    ...mapActions('dataToParent', ['updateScanTime']),
    increment() {
      this.number++
    },
    decrement() {
      if (this.number > 0) {
        this.number--
      }
    },
    changeRotation(newVal) {
      this.rotation = newVal
    },
    changeRL(newVal) {
      this.rl = newVal
    },
    changeAP(newVal) {
      this.ap = newVal
    },
    changeFH(newVal) {
      this.fh = newVal
    },
    handleSelectionChange(selectedOption) {
      this.resetSelection({ index: 0, dirOnly: true })
      this.selectedValue = selectedOption
    },
  },
  computed: {
    ...mapState('selectionConfig', ['isAddLocalizerMode']),
    ...mapGetters('b19AllValuesSelection', ['getPositionSelectedValue', 'getPositionOptions']),
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
::v-deep .disabledClass .v-select__slot {
  background: darkgray !important;
  height: 21px !important;
}
::v-deep .v-text-field.v-text-field--enclosed .v-text-field__details,
::v-deep .v-text-field.v-text-field--enclosed:not(.v-text-field--rounded) > .v-input__control > .v-input__slot {
  padding: 0 !important;
}
::v-deep .disabledClass .v-select__selection {
  color: #000000 !important;
}

.retro-button {
  background-color: #d3d3d3;
  font-size: 12px;
  text-align: center;
  color: black;
  width: 80px;
  height: 25px;
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
.AdjTol {
  margin-right: 3%;
}
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 35%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 4%;
  border: 2px solid black;
}
.v-btn {
  font-size: 11px !important;
  background: lightgray !important;
  color: #000 !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
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
  margin-left: 2%;
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
h6 {
  color: black;
}
.text-1 {
  display: flex;
  justify-content: space-evenly;
}
::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}
.text-3 {
  display: flex;
  justify-content: flex-start;
}
::v-deep .v-input__icon {
  height: 16px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
}
::v-deep .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__append-inner {
  margin-top: 1px !important;
  /* margin-right: 11px; */
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
  margin-top: 0px;
}
::v-deep .v-input__slot fieldset {
  background: white;
  border-color: white !important;
  border-radius: 0px;
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
::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
  margin-bottom: -15px !important;
}
.btn-2 {
  width: 20px !important;
  height: 15px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #c0c0c0 !important;
  margin: 0.15rem 0.15rem 0.15rem 0.15rem;
  border-radius: 0px;
  color: black !important;
}
::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: -4px !important;
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
  margin: 0px 4px 4px 0px !important;
}
.reset1 {
  margin: 12% 0% 0% 42%;
}
.position {
  width: 17vw;
  max-width: 55%;
  margin-left: 2%;
}
.Adjustvolume {
  margin-left: 10%;
}
/* Card styling */
.design-card {
  width: 100%;
  max-width: 300px;
  border: 1px solid #000;
  box-shadow: none !important;
  padding: 16px;
}

/* Table styling */
.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.custom-table th,
.custom-table td {
  border: 1px solid #000;
  padding: 8px;
  text-align: left;
  font-size: 14px;
  background: white;
  color: black;
}

.custom-table th {
  background-color: #c0c0c0;
  color: black;
  font-weight: normal;
  border-top: none;
  border-right: none;
  border-left: none;
}

/* Reset button styling */
.reset-button-container {
  margin-top: 10px;
  display: flex;
  justify-content: right;
}

.reset-button {
  width: 100px;
  height: 30px;
  background-color: #d3d3d3;
  color: gray;
  border: 1px solid #000;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  cursor: not-allowed;
  border-left: 2px solid white;
  border-top: 2px solid white;
}
.reset2 {
  margin-left: 20%;
}
.shimMode {
  width: 13.5vw;
  max-width: 68%;
  margin-left: 2%;
}
.tableML {
  margin-left: 20%;
}
.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}
/* Responsive Styles */
@media (max-width: 2048px) {
  .reset1 {
    margin: 12% 0% 0% 42%;
  }
  .shimMode {
    width: 13.5vw;
    max-width: 68%;
    margin-left: 2%;
  }
  .position {
    width: 17vw;
    max-width: 55%;
    margin-left: 2%;
  }
  .Adjustvolume {
    margin-left: 10%;
  }
  .reset2 {
    margin-left: 20%;
  }
  .tableML {
    margin-left: 20%;
  }
  .AdjTol {
    margin-right: 3%;
  }
}

@media (max-width: 2304px) {
  .reset1 {
    margin: 12% 0% 0% 42%;
  }
  .reset2 {
    margin-left: 24%;
  }
  .shimMode {
    width: 13.5vw;
    max-width: 64%;
    margin-left: 2%;
  }
  .position {
    width: 17vw;
    max-width: 48%;
    margin-left: 2%;
    height: 72%;
  }
  .Adjustvolume {
    margin-left: 17%;
  }
  .tableML {
    margin-left: 3%;
  }
  .AdjTol {
    margin-right: 3%;
  }
}
@media (max-width: 1920px) {
  .reset1 {
    margin: 13% 0% 0% 42%;
  }
  .reset2 {
    margin-left: 23%;
  }
  .shimMode {
    width: 13.5vw;
    max-width: 65%;
    margin-left: 2%;
  }
  .position {
    width: 17vw;
    max-width: 49%;
    margin-left: 2%;
  }
  .Adjustvolume {
    margin-left: 16%;
  }
  .tableML {
    margin-left: -1%;
  }
  .AdjTol {
    margin-right: 3%;
  }
}
@media (max-width: 1800px) {
  .bottom-card {
    left: 35%;
    margin-top: 9% !important;
  }
}
@media (max-width: 1706.67px) {
  .reset1 {
    margin: 14% 0% 0% 42%;
  }
  .reset2 {
    margin-left: 21%;
  }
  .shimMode {
    width: 13.5vw;
    max-width: 65%;
    margin-left: 2%;
  }
  .position {
    width: 17vw;
    max-width: 49%;
    margin-left: 2%;
  }
  .Adjustvolume {
    margin-left: 12%;
  }
  .tableML {
    margin-left: -8%;
  }
  .AdjTol {
    margin-right: 3%;
  }
}
@media (max-width: 1536px) {
  .reset1 {
    margin: 16% 0% 0% 42%;
  }
  .reset2 {
    margin-left: 19%;
  }
  .shimMode {
    width: 13.5vw;
    max-width: 65%;
    margin-left: 2%;
  }
  .position {
    width: 17vw;
    max-width: 49%;
    margin-left: 2%;
  }
  .Adjustvolume {
    margin-left: 9%;
  }
  .tableML {
    margin-left: -16%;
  }
  .AdjTol {
    margin-right: 3%;
  }
}
@media (max-width: 768px) {
  .design-card {
    max-width: 100%;
  }

  .custom-table th,
  .custom-table td {
    font-size: 12px;
    padding: 6px;
  }

  .reset-button {
    width: 80px;
    font-size: 12px;
  }
  .tableML {
    margin-left: 20%;
  }
}
</style>
