<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-card-text>
      <div class="main-1 my-2">
        <div class="main-2">
          <h5 style="color: black" class="TransmitterLA">Transmitter</h5>
          <div class="text-1">
            <label class="label-size inactive-label">Frequency 1H</label>
            <div class="text-2">
              <v-text-field
                number
                hide-details
                type="number"
                variant="outlined"
                density="compact"
                class="Frequency1H spin-btn-grp text-left ml-3 mb-2 MaxRecommFactorPE border border-dark border-3"
                disabled
              />
              <span class="mx-2">MHz</span>
            </div>
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">Ref. amplitude 1H</label>
            <BspinButton
              @input="changeRef"
              :type="number"
              v-model="number"
              :step="1"
              :min="1"
              :max="1000"
              :disabled="complete"
              class="input-lock"
              disabled
            />
            <span class="mx-2">V</span>
          </div>
          <div class="text-3">
            <label class="label-size inactive-label">Correction factor</label>
            <v-text-field
              type="number"
              variant="outlined"
              density="compact"
              disabled
              class="corrctionFect spin-btn-grp text-left ml-3 mb-2 MaxRecommFactorPE border border-dark border-3"
            />
          </div>
          <div class="tableML">
            <v-card class="design-card" color="#C0C0C0">
              <v-card-text>
                <!-- Table Structure -->
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Puls</th>
                      <th>Amplitude</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in firstTableData" :key="index">
                      <td>{{ item.nucleus }}</td>
                      <td>{{ item.amplitude }}</td>
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
          <h5 style="color: black" class="Receiver">Receiver</h5>
          <div class="text-3">
            <label class="label-size inactive-label">Gain</label>
            <v-select
              :items="gainOptions"
              v-model="selectedGainValue"
              color="#423c3c"
              dense
              outlined
              style="width: 15.5vw; max-width: 30%; margin-left: 2%"
            ></v-select>
          </div>
          <!-- <div class="text-1">
            <v-card style="width: 55%; margin-left: 16%">
              <v-card-title>
                <h2></h2>
              </v-card-title>
              <v-card-text>
                <v-simple-table>
                  <thead>
                    <tr>
                      <th class="text-left">Coil Elements</th>
                      <th class="text-left">FFT Scale factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in secondTableData" :key="index">
                      <td>{{ item.nucleus }}</td>
                      <td>{{ item.amplitude }}</td>
                    </tr>
                  </tbody>
                </v-simple-table>
              </v-card-text>
            </v-card>
          </div>
          <div class="text-1 reset1" style="">
            <v-btn class="reset-button" color="grey">Reset</v-btn>
          </div>-->
          <div class="tableR">
            <v-card class="design-card" color="#C0C0C0">
              <v-card-text>
                <!-- Table Structure -->
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Coil Elements</th>
                      <th>FFT Scale factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in secondTableData" :key="index">
                      <td>{{ item.nucleus }}</td>
                      <td>{{ item.amplitude }}</td>
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
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  components: { BspinButton },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      number: 1,
      gainOptions: ['Low', 'High'],
      selectedGainValue: 'High',
      Ref: 1,
      firstTableData: [
        { nucleus: 'SLoop1RSatSS 1H', amplitude: '884.237' },
        { nucleus: 'SRFExcit 1H', amplitude: '425.235' },
        { nucleus: 'TSESRFRefoc0 1H', amplitude: '570.588' },
        { nucleus: 'TSESRFRefoc1 1H', amplitude: '499.264' },
      ],
      secondTableData: [
        { nucleus: 'SP4', amplitude: '18.40' },
        { nucleus: 'SP6', amplitude: '18.61' },
        { nucleus: 'SP5', amplitude: '17.53' },
        { nucleus: '', amplitude: '' },
      ],
    }
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    ...mapActions('dataToParent', ['updateScanTime']),
    increment() {
      this.number++
    },
    decrement() {
      if (this.number > 0) {
        this.number--
      }
    },
    changeRef(value) {
      this.Ref = value
    },
  },
  computed: {
    ...mapState('selectionConfig', 'isAddLocalizerMode'),
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
.tableML {
  margin-left: 18%;
}
.tableR {
  margin-left: 26%;
  margin-top: 11%;
}

/* Reset button styling */
.reset-button-container {
  margin-top: 10px;
  display: flex;
  justify-content: right;
  margin-right: 40%;
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

/* Table styling */
.custom-table {
  width: 60%;
  border-collapse: collapse;
}

.custom-table th,
.custom-table td {
  border: 1px solid #000;
  padding: 3px;
  text-align: left;
  font-size: 14px;
  background: white;
  color: black;
  height: 40px;
}

.custom-table th {
  background-color: #c0c0c0;
  color: black;
  font-weight: normal;
  border-top: none;
  border-right: none;
  border-left: none;
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

.bottom-card {
  position: relative;
  bottom: 0px;
  left: 34%;
  transform: translateX(-50%);
  width: 650px;
  height: 10px;
  background-color: #ddd;
  margin-top: 18%;
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
::v-deep .v-text-field__slot {
  /* border: 1px solid white !important;
  background: white;
  border-color: white !important; */
  border-radius: 0px;
  height: 1.05rem;
  border-bottom: none;
  border-radius: 0px;
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
  height: 11px !important;
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
  margin-top: 0px;
}
::v-deep .v-input__slot fieldset {
  background: white;
  border-color: white !important;
  border-radius: 0px;
}
.input-lock {
  border: 1px solid black !important;
  background: transparent;
  border-color: black !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.5rem;
  width: 25%;
  margin-left: 2.2%;
}
::v-deep .theme--light.v-text-field.v-input--is-disabled .v-input__slot:before {
  border-image: repeating-linear-gradient(
      90deg,
      rgba(0, 0, 0, 0) 0,
      rgba(0, 0, 0, 0) 2px,
      transparent 0,
      transparent 4px
    )
    1 repeat;
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
  right: 10px;
  top: 0px !important;
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
  height: 26vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
.active-label {
  color: black; /* Black color for active state */
}
.inactive-label {
  color: grey; /* Grey color for inactive state */
}
/* Responsive Styles */
@media (max-width: 2048px) {
  .Frequency1H {
    max-width: 61%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 13%;
  }
  .Receiver {
    margin-left: 30%;
  }
  .reset {
    margin-left: 55%;
    margin-top: 21%;
  }
  .reset1 {
    margin-left: 60%;
    margin-top: 30%;
  }
  .corrctionFect {
    max-width: 25%;
    margin-left: 2%;
  }
}

@media (max-width: 2304px) {
  .Frequency1H {
    max-width: 62%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 18%;
  }
  .Receiver {
    margin-left: 28%;
  }
  .reset {
    margin-left: 55%;
    margin-top: 21%;
  }
  .reset1 {
    margin-left: 60%;
    margin-top: 30%;
  }
  .corrctionFect {
    max-width: 25%;
    margin-left: 2%;
  }
  .bottom-card {
    left: 34%;
    margin-top: 19.7%;
  }
}
@media (max-width: 1920px) {
  .Frequency1H {
    max-width: 60%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 17%;
  }
  .Receiver {
    margin-left: 29%;
  }
  .reset {
    margin-left: 54%;
    margin-top: 21%;
  }
  .reset1 {
    margin-left: 60%;
    margin-top: 30%;
  }
  .corrctionFect {
    max-width: 25%;
    margin-left: 2%;
  }
}
@media (max-width: 1800px) {
  .bottom-card {
    left: 35%;
    margin-top: 25% !important;
  }
  .Frequency1H {
    max-width: 57%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 17%;
  }
  .Receiver {
    margin-left: 27%;
  }
  .reset {
    margin-left: 53%;
    margin-top: 23%;
  }
  .reset1 {
    margin-left: 57.2%;
    margin-top: 32%;
  }
  .input-lock {
    width: 26.4% !important;
  }
  .corrctionFect {
    max-width: 26%;
    margin-left: 2%;
  }
  .tableML {
    margin-left: 21%;
  }
}
@media (max-width: 1706.67px) {
  .Frequency1H {
    max-width: 50%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 15%;
  }
  .Receiver {
    margin-left: 27%;
  }
  .reset {
    margin-left: 52%;
    margin-top: 24%;
  }
  .reset1 {
    margin-left: 60%;
    margin-top: 30%;
  }
  .corrctionFect {
    max-width: 25%;
    margin-left: 2%;
  }
}
@media (max-width: 1536px) {
  .Frequency1H {
    max-width: 44%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 13%;
  }
  .Receiver {
    margin-left: 25%;
  }
  .reset {
    margin-left: 50.5%;
    margin-top: 27%;
  }
  .reset1 {
    margin-left: 60%;
    margin-top: 30%;
  }
  .corrctionFect {
    max-width: 25%;
    margin-left: 2%;
  }
}

@media (max-width: 1396.36px) {
  .Frequency1H {
    max-width: 61%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 20%;
  }
  .Receiver {
    margin-left: 13%;
  }
}
@media (max-width: 1228.8px) {
  .Frequency1H {
    max-width: 61%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 20%;
  }
  .Receiver {
    margin-left: 13%;
  }
}

@media (max-width: 1200px) {
  .Frequency1H {
    max-width: 61%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 20%;
  }
  .Receiver {
    margin-left: 13%;
  }
}
@media (max-width: 768px) {
  .Frequency1H {
    max-width: 61%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 20%;
  }
  .Receiver {
    margin-left: 13%;
  }
}

@media (max-width: 480px) {
  .Frequency1H {
    max-width: 61%;
    margin-left: 5%;
  }
  .TransmitterLA {
    margin-left: 20%;
  }
}
</style>
