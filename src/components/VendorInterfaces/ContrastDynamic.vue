<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card color="rgb(46 44 44)" width="100%" height="100%">
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
                <v-icon small class="mx-2" color="black">mdi-arrow-right</v-icon>
                <span class="new-value">{{ formatValue(group.sourceChange.newValue) }}</span>
              </div>

              <!-- Affected parameter changes -->
              <div v-for="(affected, idx) in group.affectedChanges" :key="idx" class="affected-change">
                <div class="affected-label">Will update {{ affected.label }}:</div>
                <div class="change-row">
                  <span class="old-value">{{ formatValue(affected.oldValue) }}</span>
                  <v-icon small class="mx-2" color="black">mdi-arrow-right</v-icon>
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
      <div class="main-1">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Dynamic Mode</label>
            <v-select
              color="#423c3c"
              dense
              outlined
              style="width: 200px"
              v-model="selectedDynamicMode"
              :items="dynamicModeOptions"
            >
            </v-select>
          </div>
        </div>

        <div class="main-2">
          <div class="text-1">
            <label class="label-size inactive-label">Measurements</label>
            <div class="text-input">
              <SpinButton
                :type="'number'"
                v-model.number="measurements"
                :step="1"
                :min="1"
                :max="200"
                :disabled="complete || isAddLocalizerMode"
                style="width: 137px; max-width: 100%; margin-left: 2%"
              />
            </div>
          </div>
          <div class="text-1 mt-8">
            <label class="label-size inactive-label">Multiple Series</label>
            <v-select
              style="width: 200px"
              color="#423c3c"
              dense
              outlined
              v-model="selectedSeries"
              :items="seriesOptions"
            >
            </v-select>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin'
import SpinButton from './SpinButton.vue'
import { MriMixin } from '../Mixins/MriMixin.js'
import { mapState, mapActions, mapGetters } from 'vuex'
export default {
  mixins: [MriMixin, SelectionConfigMixin],
  components: { SpinButton },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      selectedDynamicMode: 'Standard',
      selectedSeries: 'Off',
      dynamicModeOptions: [
        'Standard',
        'Light/Dark',
        'Small/Large',
        'Circle/Square',
        'Striped/Plain',
        'Bold/Regular',
        'Icon/No Icon',
        'Up/Down',
      ],
      seriesOptions: ['Off', 'Each Measurement'],
      measurements: 1,
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
::v-deep .v-input__control .v-input__slot fieldset {
  width: 155px !important;
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

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
  padding: 0px !important;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}
::v-deep .v-text-field__slot {
  text-align: left;
  padding-left: 5px;
}

::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 1rem !important;
  border-bottom: none;
  border-radius: 4px;
}
.v-input--is-focused {
  display: block !important;
}
label {
  font-size: 100%;
  margin-bottom: 0rem !important;
  margin-top: 0.5rem;
}
::v-deep .v-text-field__details {
  display: none;
}
.text-1 {
  display: flex;
  justify-content: space-evenly;
}
::v-deep .v-icon.v-icon {
  height: 1rem;
}
::v-deep .v-input__control .v-input__slot {
  width: 155px;
}
::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
}
::v-deep .v-text-field > .v-input__control > .v-input__slot > .v-text-field__slot {
  /* left: 0.5rem; */
  width: 160px;
  border-radius: 0px;
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
/*
::v-deep .v-icon.v-icon {
  color: white !important;
}
*/
.v-input {
  max-width: 45%;
}
::v-deep .v-text-field input {
  text-align: left !important;
  padding: 0px;
}
::v-deep .v-input__icon {
  height: 15px !important;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}
::v-deep .v-text-field--outlined fieldset {
  bottom: 3px !important;

  right: 10px;
  top: 0px !important;
}

.main-1 {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.main-2 {
  color: white !important;
}
::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 30px;
}

.select-2 {
  width: 250px;
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
  color: white !important;
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
