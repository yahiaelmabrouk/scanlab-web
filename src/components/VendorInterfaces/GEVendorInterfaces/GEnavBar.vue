<template>
  <div style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; height: 100%">
    <div class="navbar-left-content">
      <v-card style="width: 30%; height: 100% !important">
        <v-toolbar density="compact" style="height: 100% !important">
          <v-btn @click="emitShowPatientRecord"
            ><img src="@/assets/ge_img/header_1.png" alt="Patient Record" style="width: 80%; height: 80%" />
          </v-btn>
          <v-btn @click="emitShowMedicalDatabase"
            ><img src="@/assets/ge_img/header_2.png" alt="Patient Record" style="width: 80%; height: 80%" />
          </v-btn>
          <v-btn @click="emitShowProtocolManager"
            ><img src="@/assets/ge_img/header_3.png" alt="Patient Record" style="width: 80%; height: 80%"
          /></v-btn>
        </v-toolbar>
      </v-card>
      <div class="dot-size-option">
        <span>{{ $t('global.dot_size') }}</span>
        <!-- Slider can only work with consecutive whole numbers, so translating those with dotScaleMultiplierIndex -->
        <v-slider
          class="dot-size-slider"
          v-model.number="dotScaleMultiplierIndex"
          :min="0"
          :max="dotScaleValues.length - 1"
          ticks
        >
        </v-slider>
      </div>
    </div>

    <div class="navbar-right-content">
      <div
        style="
          width: 100%;
          height: 90%;
          background-color: #6875a2;
          display: flex;
          justify-content: space-between;
          padding-right: 10px;
        "
      >
        <div style="display: flex">
          <img @click="emitShowInitialExam" src="@/assets/ge_img/header_4.png" alt="" style="cursor: pointer" />
          <div @click="emitShowInitialExam" class="toolbar-left cont-col" style="color: white; cursor: pointer">
            <p class="mb-0">Hayes, Matthew L.</p>
            <p class="mb-0" style="font-size: 12px">123456</p>
            <p class="mb-0" style="font-size: 10px">0. Brain</p>
          </div>
        </div>

        <div class="toolbar-right cont" style="align-items: start; color: white; display: flex; flex-direction: column">
          <div>
            <span style="font-size: 20px; font-weight: bold">00&nbsp;00:00</span>
          </div>

          <div>
            <p style="font-size: 15px">Views Scanned</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { MriMixin } from '@/components/Mixins/MriMixin'
import { SelectionConfigMixin } from '@/components/Mixins/SelectionConfigMixin'

export default {
  name: 'GENavBar',
  mixins: [MriMixin, SelectionConfigMixin],
  emits: ['show-patient-record', 'show-medical-database', 'show-protocol-manager', 'show-initial-exam'],
  methods: {
    emitShowPatientRecord() {
      this.$emit('show-patient-record')
    },
    emitShowMedicalDatabase() {
      this.$emit('show-medical-database')
    },
    emitShowProtocolManager() {
      this.$emit('show-protocol-manager')
    },
    emitShowInitialExam() {
      this.$emit('show-initial-exam')
    },
  },
}
</script>
<style scoped lang="scss">
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}
.cont-col {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-start;
}

.v-sheet,
v-card {
  height: 25px !important;
  background: #343579 !important;
  border-radius: 0px !important;
}

::v-deep .v-toolbar__content,
.v-toolbar__extension {
  padding: 0px 0px !important;
  background: #2f3d6e !important;
}
.v-btn {
  padding: 4px 6px !important;
  height: 75% !important;
  margin: 0.3rem;
  background: #2f3d6e !important;
  color: white !important;
  font-size: 10px !important;
  text-transform: inherit !important;

  border-radius: 4px; /* Rounded edges */
  box-shadow: inset 1px 1px 2px rgba(255, 255, 255, 0.3), /* Light upper-left */ inset -1px -1px 2px rgba(0, 0, 0, 0.6); /* Dark lower-right */
  border: 1px solid rgba(255, 255, 255, 0.2); /* Subtle border */
  min-width: 50px;
}
::v-deep .v-sheet.v-toolbar:not(.v-sheet--outlined) {
  box-shadow: none !important;
}

.navbar-left-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 900px;
}

.dot-size-option {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  padding: 0px 20px 0px 20px;
  height: 60%;
  border-radius: 5px;

  span {
    color: black;
  }

  .dot-size-slider {
    margin-top: 20px;
    margin-left: 15px;
    width: 300px;
  }
}

.navbar-right-content {
  width: 25%;
  background-color: rgb(47, 61, 110);
  display: flex;
  flex-direction: column;
  justify-content: end;
}
</style>
