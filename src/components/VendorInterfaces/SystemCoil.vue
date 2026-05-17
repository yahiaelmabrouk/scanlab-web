<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-card-text>
      <div class="body-image">
        <img src="@/assets/siemens_img/SystemCoil.png" />
      </div>

      <!-- Buttons (SP1 - SP8) -->
      <div class="buttons-container">
          <div class="HE-buttons1" >
            <v-btn
              v-for="(button, index) in topButtons"
              :key="`top-btn-${index}`"
              :class="['sp-btn', { highlight: isActiveButton(button) }]"
              @click="toggleButton(`top-${index}`, button)"
            >
              {{ button }}
            </v-btn>
          </div>
          <div class="HE-buttons2" >
            <v-btn
              v-for="(button, index) in bottomButtons"
              :key="`bottom-btn-${index}`"
              :class="['sp-btn', { highlight: isActiveButton(button) }]"
              @click="toggleButton(`bottom-${index}`, button)"
            >
              {{ button }}
            </v-btn>
          </div>
          
          <div class="sp-buttons" >
            <v-btn
              v-for="(button, index) in buttons"
              :key="index"
              class="sp-btn"
              :class="{ highlight: isActiveButton(button) }"
              @click="toggleButton(index, button)"
            >
              {{ button }}
            </v-btn>
          </div>
        
          <div class="body-btn-div" >
            <v-btn class="body-btn">Body</v-btn>
          </div>
        </div>

    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import SpinButton from './SpinButton.vue'
import DropDownText from './DropDownText.vue'
import { MriMixin } from '../Mixins/MriMixin.js'
import EventBus from '@/lib/event-bus'
import _ from 'lodash'
export default {
  mixins: [MriMixin, SelectionConfigMixin],
  components: { SpinButton, DropDownText },
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
      component: 'Coils',
      buttons: ['SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SP6', 'SP7', 'SP8'],
      topButtons: ['HE1', 'HE3', 'NE1'],
      bottomButtons: ['HE2', 'HE4', 'NE2'],
    }
  },
  computed: {
    ...mapGetters('user', ['softwareVendorPreference', 'softwareVersionPreference']),
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
    ...mapState('scanTimeConfig', ['activeButtons']),
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    activeButtons: {
      get() {
        return this.$store.state.scanTimeConfig.activeButtons
      },
      set(value) {
        this.$store.dispatch('scanTimeConfig/updateActiveButtons', value)
      },
    },
    // ...mapState('scanTimeConfig', ['activeButtons']),
  },
  methods: {
    // ...mapActions('scanTimeConfig', ['toggleButtonState']),
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    // ...mapActions('scanTimeConfig', ['updateActiveButtons']),
    ...mapActions('dataToParent', ['updateScanTime']),
    toggleButton(button, buttonName) {
      console.log('Toggling button:', buttonName)
      console.log('Current active buttons:', this.activeButtons)
      if (this.activeButtons.includes(buttonName)) {
        this.activeButtons = this.activeButtons.filter((b) => b !== buttonName)
      } else {
        this.activeButtons.push(buttonName)
        console.log('Added button:', buttonName)
      }

      this.$store.dispatch('scanTimeConfig/updateActiveButtons', this.activeButtons)
    },
    isActiveButton(button) {
      return this.activeButtons.includes(button)
    },
  },
  mounted() {
    EventBus.$on('onSliceViewWindowChange', this.onSliceViewWindowChange)
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
.v-btn {
  font-size: 11px !important;
  background: black !important;
  color: #ffffff !important;
  border-radius: none !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
}
.highlight {
  border-color: orange !important;
}
::v-deep .v-btn:not(.v-btn--round).v-size--default {
  height: 24px;
  min-width: 50px;
  padding: 0 0px;
}
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

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}

.text-input {
  max-width: 100%;
  width: 100%;
  margin-left: 0%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
}

.label-size {
  width: 100%;
  display: flex;
  justify-content: flex-end;
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

.v-input--is-focused {
  display: block !important;
}

label,
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
  background: #383535;
  border-color: #383535;
  border-radius: 0px;
  border: 1px solid #383535 !important;
  height: 1rem !important;
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

::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: 0px !important;
}

.main-1 {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.main-2 {
  width: 100%;
  color: white !important;
}

.custom-container.col-md-9 {
  max-width: 100% !important;
  padding: 0 !important;
}

.v-sheet.v-card {
  border-radius: 0px;
}

label {
  margin-bottom: 0.35rem;
}

.buttons-container {
  position: absolute; 
  bottom: 10px; 
  display: flex; 
  flex-direction: column;
}

.HE-buttons1 {
  margin-left: 20%; 
  display:flex; 
  justify-content: start;
}

.HE-buttons2 {
  margin-top: 5%;
  margin-left: 20%; 
  display: flex; 
  justify-content: start;
}

.disabled-div {
  background-color: #444; /* Background color to make it look disabled */
  padding: 15px;
  border: 1px solid #555; /* Subtle border */
  border-radius: 5px;
  max-width: 400px;
  margin: auto;
  opacity: 0.5; /* Makes it look disabled */
}

.input-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.input-group label {
  color: #ccc;
  font-size: 14px;
  flex: 1;
}

.input-group input {
  background-color: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 5px;
  flex: 1;
  text-align: right;
  max-width: 100px;
}

input[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}
/* coils */

.body-row {
  margin-top: 20px;
}

.body-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  filter: grayscale(100%);
  margin: 0% 0% 0% 0%;
}

.n16-chip {
  position: relative;
  top: -30px;
  background-color: #666;
  color: white;
}

.sp-buttons {
  margin-left: 45%; 
  display: flex; 
  justify-content: start;
}

.sp-btn {
  background-color: #444;
  color: white;
  margin: 3px;
  width: 0px;
  height: 30px;
  border: 1px solid #444;
}

/* .orange-border {
  border-color: orange;
} */
.black-border {
  border-color: black;
}
.bottom-body-row {
  margin-top: 20px;
  margin-right: 80%;
}

.body-btn-div {
  display: flex;
  justify-content: start;
  margin-left: 10%;
}

.body-btn {
  background-color: #666;
  color: white;
  width: 150px;
}

/* Responsive Design */

/* Small Devices (Max Width: 500px) */
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

/* Extra Small Devices (Max Width: 600px) */
@media (max-width: 600px) {
  .sp-btn {
    width: 100%;
  }
}

/* Small Devices (Max Width: 767px) */
@media (max-width: 767px) {
  .text-input {
    max-width: 100%;
    width: 100%;
    margin-left: 0%;
    height: 1.2rem !important;
  }
  .label-size {
    width: 100%;
    justify-content: left;
    margin-right: 0;
  }
  .main-1 {
    flex-direction: column;
  }
  .main-2 {
    width: 100%;
    margin-top: 2%;
  }
  .v-input {
    max-width: 100%;
  }
  .text-1,
  .text-2,
  .text-3 {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Tablets and Small Desktops (Width: 768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .text-input {
    max-width: 45%;
    width: 45%;
    margin-left: 0%;
    height: 1.2rem !important;
  }
  .label-size {
    width: 45%;
    margin-right: 5px;
  }
  .main-1 {
    flex-direction: column;
  }
  .main-2 {
    width: 100%;
    margin-top: 3%;
  }
  .v-input {
    max-width: 45%;
  }
  .text-1,
  .text-2,
  .text-3 {
    flex-direction: column;
  }
}

/* Large Desktops and Bigger Screens (Min Width: 1025px) */
@media (min-width: 1025px) and (max-width: 1399px) {
  .text-input {
    max-width: 38%;
    width: 38%;
  }
  .label-size {
    width: 40%;
    margin-right: 5px;
  }
  .v-btn {
    font-size: 11px !important;
  }
  .main-1 {
    flex-direction: row;
  }
  .main-2 {
    width: 50%;
    margin-top: 1%;
  }
  .v-input {
    max-width: 30%;
  }
  .text-1,
  .text-2,
  .text-3 {
    flex-direction: row;
  }
}

/* Extra Large Screens (Min Width: 1536px) */
@media (min-width: 1400px) and (max-width: 1536px) {
  .body-row {
    margin-top: 1%;
  }
}

@media (min-width: 1536px) and (max-width: 2490px) {
  .body-row {
    margin-top: 0%;
  }
}
/* Extra Extra Large Screens (Width: 1920px - 2490px) */
/* @media (min-width: 1920px) and (max-width: 2490px) {
  .body-row {
    margin-top: 6%;
  }
} */
</style>
