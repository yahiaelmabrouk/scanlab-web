<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-dialog v-model="showConfirmDialog" persistent width="700px">
      <v-card class="change-dialog">
        <v-card-title class="headline">
          {{ $t('global.notification', languageCode) }}
        </v-card-title>

        <v-card-text>
          <div class="mb-4">{{ $t('SelectionConfigForm.your_last_change', languageCode) }}</div>

          <!-- Changes grouped by source parameter -->
          <div class="changes-container">
            <div v-for="(group, sourceParam) in groupedChanges" :key="sourceParam" class="change-group">
              <div class="change-group-title">{{ sourceParam }}</div>

              <!-- Source parameter change -->
              <div v-if="group.sourceChange.oldValue !== group.sourceChange.newValue" class="change-row">
                <span class="old-value">{{ formatValue(group.sourceChange.oldValue) }}</span>
                <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                <span class="new-value">{{ formatValue(group.sourceChange.newValue) }}</span>
              </div>

              <!-- Affected parameter changes -->
              <div v-for="(affected, idx) in group.affectedChanges" :key="idx" class="affected-change">
                <div class="affected-label">Will update {{ affected.label }}:</div>
                <div class="change-row">
                  <span class="old-value">{{ formatValue(affected.oldValue) }}</span>
                  <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                  <span class="new-value">{{ formatValue(affected.newValue) }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="cancelChange">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="success" @click="confirmChange" :class="{ 'active-confirm-button': isDialogKeyboardReady }">
            {{ $t('global.okay', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-card-text>
      <div class="main-3">
        <div class="main-1">
          <div class="main-2">
            <div class="text-1">
              <label class="label-size inactive-label">Saturation Region</label>
              <div class="text-input">
                <DropDownText
                  @input="changeSaturation"
                  :value="saturation"
                  :type="'number'"
                  v-model.number="saturation"
                  :step="1"
                  :max="2"
                  :min="1"
                  :disabled="isButtonDisabled || !mayAddSatBand"
                />
              </div>
            </div>
          </div>
          <div class="main-2">
            <div class="text-1">
              <label class="label-size inactive-label">Special Saturation</label>
              <v-select
                color="#423c3c"
                v-model="specialSaturation"
                :items="specialSaturationOptions"
                dense
                outlined
                style="width: 9.5vw; max-width: 55%; margin-left: 2%"
              ></v-select>
            </div>
          </div>
        </div>
        <div class="main-1 pt-2 pr-20">
          <div class="text-1">
            <div>
              <v-row v-if="selectedInteractableState || satBands.length > 0">
                <InteractableForm class="mt-3 p-2" />
              </v-row>
              <v-row v-else-if="isEditingQuestion && !isAddLocalizerMode">
                <SatBandAreaEditor v-if="visibleSatBand" />
              </v-row>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import SpinButton from './SpinButton.vue'
import DropDownText from './SatDrop.vue'
import EventBus from '../../lib/event-bus'
import { ScanButtonMixin } from '../Mixins/ScanButtonMixin'
import { MriMixin } from '@/components/Mixins/MriMixin'
import SatBandAreaEditor from '@/components/SatBandAreaEditor.vue'
import InteractableForm from '@/components/InteractableForm'

export default {
  mixins: [ScanButtonMixin, MriMixin, SelectionConfigMixin],
  name: 'GeometrySaturation',
  // eslint-disable-next-line vue/no-unused-components
  components: { SpinButton, DropDownText, SatBandAreaEditor, InteractableForm },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      saturation: 0,
      specialSaturationOptions: ['None', 'Parallel P', 'Parallel A', 'Parallel A/P'],
      specialSaturation: 'None',
    }
  },
  mounted() {
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
    }),
      // (this.selectedInteractableState = true)
      console.log('this.selectedInteractableState==============', this.selectedInteractableState)
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    ...mapActions('interactableService', ['setSelectedInteractableIdent']),
    ...mapActions('dataToParent', ['updateScanTime']),
    updateSelectedInteractableIdent(ident) {
      this.setSelectedInteractableIdent(ident)
    },
    changeSaturation(value) {
      this.saturation = value
    },
  },
  computed: {
    ...mapState({
      selectedInteractableIdent: (state) => state.interactableService.selectedInteractableIdent,
      isFullscreen: (state) => state.selectionConfig.isFullscreen,
      isAddLocalizerMode: (state) => state.selectionConfig.isAddLocalizerMode,
      toolSelected: (state) => state.selectionConfig.toolSelected,
      toolSelectedConfig: (state) => state.selectionConfig.toolSelectedConfig,
      showReferenceLines: (state) => state.selectionConfig.showReferenceLines,
      referenceSliceCornersBySliceViewId: (state) => state.selectionConfig.referenceSliceCornersBySliceViewId,
      hasAddedLocalizer: (state) => state.selectionConfig.hasAddedLocalizer,
    }),
    ...mapGetters('interactableService', [
      'selectedInteractableState',
      'isSatBandSelected',
      'indexOfSelectedSatBand',
      'satBands',
    ]),
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    isButtonDisabled() {
      return Math.abs(this.repetitionTime - this.minConcatAcqPackage) < 100
    },
  },
  watch: {
    selectedInteractableIdent(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('selectedInteractableIdent changed:', newVal)
        console.log('this.selectedInteractableIdent:', this.selectedInteractableIdent)
        this.selectedInteractableIdent = newVal
        this.updateSelectedInteractableIdent(newVal) // Trigger the Vuex action to update the store
      }
    },
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
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
.v-btn {
  font-size: 11px !important;
  /* background: black !important; */
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
label {
  font-size: 90%;
}
::v-deep .v-text-field__details {
  display: none;
}
.v-input--is-focused {
  display: block !important;
}
.text-1 {
  display: flex;
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
::v-deep .v-text-field__slot {
  background: #383535;
  border-color: #383535;
  border-radius: 0px;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0px;
}
::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 2rem !important;
  border-bottom: none;
  border-radius: 4px;
}
::v-deep .v-icon.v-icon {
  color: white !important;
  font-size: 17px;
  height: 25px !important;
}
.v-input {
  max-width: 45%;
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
  /* bottom: 15px !important; */

  right: 10px;
  top: -2px !important;
}
::v-deep .v-input__icon {
  height: 10px !important;
}
::v-deep .text-input .sp-btn-updown .sp-btn-grp .sp-btn {
  padding-left: 0px !important;
}
::v-deep .text-input .sp-btn-updown .sp-btn-grp div {
  margin-left: 2px;
}
.main-1 {
  display: flex;
  justify-content: space-around;
  /* color: white !important; */
  height: 100%;
}

.main-2 {
  color: white !important;
  width: 50%;
}
.main-3 {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
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

::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}
::v-deep .theme--light.v-select .v-select__selections {
  margin-top: 5px;
  color: black !important;
}

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}
.text-input {
  max-width: 38%;
  width: 36%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 2rem !important;
  border-bottom: none;
}
::v-deep .main-1 .main-2 .text-1 .v-input__control .v-input__slot .v-select__selections .v-select__selection--comma {
  color: white;
}
::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin: 0px 6px 11px 0;
}
.add-btn:disabled {
  color: white !important;
  opacity: 0.4 !important;
  background-color: grey !important;
  cursor: not-allowed !important;
}
.add-btn:disabled v-icon {
  color: white !important;
  opacity: 0.45 !important;
}

.active-label {
  color: white; /* White color for active state */
}

.inactive-label {
  color: grey; /* Grey color for inactive state */
}

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #F2A14A !important;
}
</style>
