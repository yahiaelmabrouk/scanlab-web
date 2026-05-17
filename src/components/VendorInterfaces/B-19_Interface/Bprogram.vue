<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-container class="custom-container">
    <v-row class="my-0">
      <v-col cols="10" class="pt-0">
        <v-row no-gutters class="mt-1 ml-2 mr-2 d-flex flex-column">
          <v-col class="col-5">
            <div class="text-3">
              <label class="label-size">Region</label>
              <div class="text-2">
                <v-select
                  v-model="region"
                  :items="regions"
                  style="width: 15.4vw; max-width: 55%; margin-left: 2%"
                  dense
                  outlined
                  hide-details
                  color="#423c3c"
                ></v-select>
              </div>
            </div>
            <!-- <div>
          <label class="label">Exams:</label>
          <v-select v-model="exam" :items="exams" dense outlined hide-details class="dropdown"></v-select>
        </div> -->

            <div class="text-3">
              <label class="label-size">Exams</label>
              <div class="text-2">
                <v-select
                  v-model="exam"
                  :items="exams"
                  style="width: 15.4vw; max-width: 55%; margin-left: 2%"
                  dense
                  outlined
                  hide-details
                  color="#423c3c"
                ></v-select>
              </div>
            </div>
          </v-col>
        </v-row>
        <v-row class="ml-2 d-flex flex-row justify-content-md-start">
          <div class="ml-0">
            <label for="" class="label-size">Programs:</label>
            <v-btn class="retro-button mr-4" outlined dense style="margin-top: 140%">&lt;&lt;</v-btn>
          </div>

          <div class="program-list">
            <v-list dense>
              <v-list-item
                v-for="program in programs"
                :key="program"
                @click="selectProgram(program)"
                :class="{ 'selected-program': program === selectedProgram }"
              >
                <v-list-item-content>
                  <v-list-item-title>{{ program }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>

          <!-- <v-data-table :headers="headers" :items="selectedProgramDetails" class="custom-table" hide-default-footer dense>
        <template v-slot:item.icon="{ item }">
          <v-icon v-if="item.icon" class="icon">{{ item.icon }}</v-icon>
        </template>
        <template v-slot:item.description="{ item }">
          <span class="description">{{ item.description }}</span>
        </template>
        <template v-slot:item.duration="{ item }">
          <span class="duration">{{ item.duration }}</span>
        </template>
      </v-data-table> -->
          <div class="details-container">
            <div v-for="(item, index) in selectedProgramDetails" :key="index" class="detail-row">
              <span class="icon">
                <v-icon>{{ item.icon }}</v-icon>
              </span>
              <span class="description">{{ item.description }}</span>
              <span class="icon-count" v-if="item.copies">
                <img src="https://img.icons8.com/ios-filled/50/000000/copy.png" alt="Copies" /> {{ item.copies }}</span
              >
              <span class="duration">{{ item.duration }}</span>
            </div>
          </div>
        </v-row>
        <v-row class="ml-2 d-flex flex-row justify-content-md-start">
          <v-col cols="11" class="total-duration text-right">
            <div class="mr-4">Σ {{ totalDurationFormatted }}</div></v-col
          >
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import EventBus from '@/lib/event-bus'
import _ from 'lodash'
export default {
  mixins: [SelectionConfigMixin, MriMixin, ScanButtonMixin],
  name: 'Bprogram',
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    sequenceType: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      region: 'SPINE',
      regions: ['SPINE'],
      exam: 'LUMBAR',
      exams: ['LUMBAR'],
      programs: [
        'ROUTINE W/O',
        'ROUTINE W/W',
        'LUMBAR PLEXUS W/O',
        'LUMBAR PLEXUS W/W/O',
        'METAL W/O',
        'ROUTINE W/O WIP',
      ],
      selectedProgram: 'ROUTINE W/O',
      headers: [
        { text: '', value: 'icon', width: 10 },
        { text: '', value: 'description' },
        { text: '', value: 'duration', width: 10 },
      ],
      programDetails: {
        'ROUTINE W/O': [
          { icon: 'mdi-run', description: 'LOCALIZER', duration: '00:40' },
          { icon: 'mdi-run', description: 'HASTE CORONAL', duration: '00:39' },
          { icon: 'mdi-run', description: 'TSE-R T2 SAGITTAL', copies: 3, duration: '03:26' },
          { icon: 'mdi-content-copy', description: 'T1 SAG', copies: 3, duration: '02:16' },
          { icon: 'mdi-content-copy', description: 'STIR SAGITTAL', duration: '03:21' },
          { icon: 'mdi-run', description: 'TSE-R T2 AXIAL MSMA', copies: 3, duration: '02:32' },
          { icon: 'mdi-run', description: 'T1 AXIAL STACK', copies: 7, duration: '03:35' },
        ],
        // Define other program details similarly
      },
    }
  },
  computed: {
    selectedProgramDetails() {
      return this.programDetails[this.selectedProgram] || []
    },
    totalDuration() {
      return this.selectedProgramDetails.reduce((total, item) => {
        const [minutes, seconds] = item.duration.split(':').map(Number)
        return total + minutes * 60 + seconds
      }, 0)
    },
    totalDurationFormatted() {
      const minutes = Math.floor(this.totalDuration / 60)
      const seconds = this.totalDuration % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },
  },
  methods: {
    selectProgram(program) {
      this.selectedProgram = program
    },
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    ...mapActions('dataToParent', ['updateOversamplings', 'updateScanTime']),

    saveOversampling() {
      this.updateOversampling(this.oversamplingValue)
      this.oversamplingValue = ''
    },
    submitOversampling() {
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustOversamplingByUser', { oversampling: this.oversamplingLocal })
    },
  },
  mounted() {
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
    console.log('isChallengeModeEnabledForMe==', this.isChallengeModeEnabledForMe)
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
.icon-count {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-right: 20%;
}

.icon-count img {
  width: 15px;
  height: 15px;
}
::v-deep .v-list-item {
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 12px;
  padding-right: 0px;
  min-height: 30px;
}
::v-deep .v-list {
  padding-top: 0px !important;
  padding-bottom: 14px !important;
}
.details-container {
  border: 1px solid black;
  margin-left: 12px;
  width: 53%;
  background: white;
  padding: 10px;
}
::v-deep v-list {
  padding: 0 !important;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 5px;
}

.icon {
  width: 20px;
  text-align: center;
}

.description {
  flex: 1;
  text-align: left;
}
.custom-container {
  background-color: #c0c0c0;
  font-family: Arial, sans-serif;
  /* padding: 8px; */
  height: 99%;
  max-width: 66.6% !important;
}
.left-panel {
  background-color: #e0e0e0;
  padding: 10px;
  border: 1px solid #888;
  max-width: 200px;
}
.label {
  font-size: 14px;
  font-weight: bold;
  margin-top: 4px;
}
.dropdown {
  margin-bottom: 10px;
  background-color: white !important; /* Set background to white */
  color: black !important; /* Set text color to black */
}
.program-list {
  /* border: 1px solid #888; */
  /* height: 15rem; */
  /* overflow-y: auto; */
  text-align: justify;
  width: 24%;
}
.selected-program {
  border: 1px solid black;
  font-weight: inherit;
  width: 105%;
  background: white;
  border-right: none;
}
.back-button {
  width: 100%;
  margin-top: 10px;
}
.details-panel {
  background-color: #f0f0f0;
  padding: 10px;
  border: 1px solid #888;
}
.custom-table {
  font-size: 14px;
}
.icon {
  font-size: 20px;
}
.description {
  font-size: 14px;
}
.duration {
  font-size: 14px;
  text-align: right;
}
.total-duration {
  font-weight: bold;
  font-size: 14px;
  color: #555;
}
.bottom-card {
  position: relative;
  bottom: 0px;
  left: 48%;
  transform: translateX(-50%);
  width: 121%;
  height: 10px;
  background-color: #ddd;
  border-radius: 2px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
  margin-top: 1%;
}
.coil-elements-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.coil-elements-display {
  border: 1px solid #000; /* Black border */
  background-color: #f0f0f0; /* Light grey background */
  padding: 10px; /* Space inside the box */
  width: 100px; /* Adjust width as needed */
  text-align: center;
}

.coil-elements-display p {
  margin: 0;
  font-size: 14px;
  color: #000; /* Black text color */
}

.disabled-div {
  background-color: #b5b1b1; /* Background color to make it look disabled */
  padding: 3px;
  border: 1px solid #555; /* Subtle border */
  border-radius: 5px;
  max-width: 260px;
  margin: auto;
  opacity: 0.5; /* Makes it look disabled */
}
.text-input {
  max-width: 100%;
  width: 38%;
  margin-left: 2%;
  border-radius: 0px !important;
  height: 1rem !important;
  border-bottom: none;
}

::v-deep .theme--light.v-select .v-select__selections {
  font-size: 12px !important;
}
.v-select.v-input--dense .v-select__selection--comma {
  margin: 0px 1px 4px 0;
}
.input-lock {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  display: flex;
  border-radius: 0px;
  align-items: center;
  height: 1.05rem;
  width: 28%;
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
  justify-content: left;
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
  color: black;
  font-size: 80%;
}

.text-2 {
  display: flex;
}

.text-1 {
  display: flex;
  justify-content: space-between;
}

::v-deep .v-text-field > .v-input__control > .v-input__slot:after {
  width: 0% !important;
}

.text-3 {
  display: flex;
  justify-content: flex-start;
}

::v-deep .v-input__icon {
  height: 11px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
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
  background: white !important;
  border-color: white !important;
  border-radius: 0px;
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

.v-sheet.v-card {
  border-radius: 0px;
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
@media (max-width: 500px) {
  .disabled-div {
    padding: 10px;
    max-width: 100%;
  }

  .input-group {
    flex-direction: column;
  }

  .input-group input {
    max-width: 100%;
  }
}
.retro-button {
  background-color: #bababa;
  font-size: 16px;
  text-align: center;
  color: black;
  width: 50px;
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
</style>
