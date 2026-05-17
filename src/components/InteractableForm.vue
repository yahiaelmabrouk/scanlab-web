<template>
  <div
    style="min-width: 250px"
    :class="softwareVersionPreference === 'xa' ? 'xa-theme' : 'default-theme current-selection'"
  >
    <header
      class="flex align-center"
      :style="softwareVersionPreference === 'xa' ? 'margin-top: 0%; margin-bottom: -2%' : ''"
    >
      <v-btn-toggle v-model="selectSatBand" class="sat-band-buttons" group dense mandatory v-if="satBands.length > 0">
        <v-btn
          :title="satbandTabTitle(index)"
          outlined
          v-for="(satBand, index) in satBands"
          :key="index"
          :value="index"
          :style="softwareVersionPreference === 'xa' ? 'font-size: 0.652rem; color: white;' : ''"
          @click="onChangeSelectedSatBand(index)"
        >
          {{ $t('MRI.satband') }} {{ index + 1 }}
        </v-btn>
      </v-btn-toggle>
      <h4 v-else :style="softwareVersionPreference === 'xa' ? 'color: white;' : ''">
        {{ `Unknown Interactable Type` }}
      </h4>
      <span>
        <span
          class="clickable delete-icon"
          :class="{ disabled: complete || isDisabledParameter }"
          v-shortkey="['del']"
          @shortkey="onDeleteSelectedInteractable"
          @click="onDeleteSelectedInteractable"
          :disabled="complete || isDisabledParameter"
        >
          <DeleteIcon :title="$t('global.delete')" :class="softwareVersionPreference === 'xa' ? 'icon-white' : ''" />
        </span>
      </span>
    </header>

    <hr class="header-gradient-region" />
    <div class="form-container">
      <v-row>
        <div class="slice-form col-6">
          <div class="label-with-unit">
            <label :style="softwareVersionPreference === 'xa' ? 'font-size: 0.725rem; color: white;' : ''">{{
              $t('global.thickness')
            }}</label>
            <UnitCaption unit="(mm)" />
          </div>
          <b-form-input
            @change="submitDimensions3z"
            :type="'number'"
            v-model.number="dimensions3z"
            step="1"
            min="1"
            max="500"
            :disabled="complete || isDisabledParameter"
            :style="
              softwareVersionPreference === 'xa' ? 'background-color: #2e2c2c; color: white; border-color: white;' : ''
            "
          />
        </div>
        <div class="slice-form col-6" :style="softwareVersionPreference === 'xa' ? 'width:50%' : ''">
          <div class="label-with-unit">
            <label :style="softwareVersionPreference === 'xa' ? 'font-size: 0.725rem; color: white;' : ''">{{
              $t('global.orientation')
            }}</label>
          </div>
          <div style="max-width: 150px">
            <v-select
              v-model="satBandDirection"
              :items="directions"
              item-value="id"
              item-text="name"
              dense
              solo
              :disabled="complete || isDisabledParameter"
              :style="
                softwareVersionPreference === 'xa'
                  ? 'background-color: white; color: white; border-color: white;'
                  : 'background-color: white; color: black; border-color: black;'
              "
            ></v-select>
          </div>
        </div>
      </v-row>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src

import * as THREE from 'three'
import { mapState, mapGetters, mapActions } from 'vuex'
import _ from 'lodash'
import DeleteIcon from 'icons/Delete'
import UnitCaption from './UnitCaption'

export default {
  name: 'InteractableForm',
  components: {
    DeleteIcon,
    UnitCaption,
  },
  props: {},
  data() {
    return {
      directions: [
        { id: 0, name: this.$t('global.axial', this.languageCode) },
        { id: 1, name: this.$t('global.coronal', this.languageCode) },
        { id: 2, name: this.$t('global.sagittal', this.languageCode) },
      ],
      bandDirection: 0,
    }
  },
  computed: {
    ...mapGetters('interactableService', [
      'selectedInteractableState',
      'isSatBandSelected',
      'indexOfSelectedSatBand',
      'satBands',
      'firstInteractableConfig',
    ]),
    ...mapGetters('testRunService', ['isTakingTest']),
    ...mapGetters('user', ['languageCode', 'softwareVendorPreference', 'softwareVersionPreference']),
    ...mapGetters('questionService', ['isAnsweredCurrentQuestion']),
    ...mapState('questionService', ['hasAnsweredAllStackQuestions']),
    dimensions3z: {
      get() {
        if (this.selectedInteractableState) {
          return _.get(this.selectedInteractableState, 'dimensions3.z')
        } else {
          return _.get(this.firstInteractableConfig, 'dimensions3.z', 0)
        }
      },
      set(dimensions3z) {
        this.dimensions3zLocal = dimensions3z
      },
    },
    satBandDirection: {
      get() {
        if (this.selectedInteractableState) {
          const xDirection3 = _.get(this.selectedInteractableState, 'xDirection3')
          const yDirection3 = _.get(this.selectedInteractableState, 'yDirection3')
          const zDirection3 = _.get(this.selectedInteractableState, 'zDirection3')
          const xAxis = new THREE.Vector3(1, 0, 0)
          const yAxis = new THREE.Vector3(0, 1, 0)
          const zAxis = new THREE.Vector3(0, 0, 1)
          const xDirectionAngle = (xAxis.angleTo(xDirection3) * 180) / Math.PI
          const yDirectionAngle = (yAxis.angleTo(yDirection3) * 180) / Math.PI
          const zDirectionAngle = (zAxis.angleTo(zDirection3) * 180) / Math.PI
          let bandDirection = this.bandDirection
          if (zDirectionAngle >= 45 && zDirectionAngle <= 135) {
            if (xDirectionAngle >= 45 && xDirectionAngle <= 135) {
              bandDirection = 2
            } else {
              bandDirection = 1
            }
          } else {
            if (xDirectionAngle >= 45 && xDirectionAngle <= 135 && yDirectionAngle !== 90) {
              bandDirection = 2
            } else {
              bandDirection = 0
            }
          }

          return bandDirection
        } else {
          return 0
        }
      },
      set(index) {
        this.$store.dispatch('interactableService/resetDirection', { index })
        this.bandDirection = index
      },
    },
    selectSatBand: {
      get() {
        return this.indexOfSelectedSatBand
      },
      set() {
        // this.$store.dispatch('interactableService/setSelectedInteractableIdentByIndex', newIndex)
      },
    },
    isDisabledParameter() {
      return this.hasAnsweredAllStackQuestions || this.isAnsweredCurrentQuestion
    },
    complete() {
      // This requires that you are taking a TestRun. If you are just an admin viewing a QuestionSet, you can not submit that as a TestRun
      return this.hasAnsweredAllStackQuestions && this.isTakingTest
    },
  },
  watch: {
    // No need to set default value, we set in interactableService
    // satBands(newValue, oldValue) {
    //   // If there are satBands present
    //   if (newValue.length > 0) {
    //     if (this.selectSatBand === null || this.selectSatBand >= newValue.length) {
    //       // Select the last item if the current index is out of bounds or if no item was selected
    //       this.selectSatBand = newValue.length - 1
    //     }
    //   } else {
    //     // If no satBands are present, clear the selection
    //     this.selectSatBand = null
    //   }
    // },
  },
  methods: {
    ...mapActions('interactableService', ['deleteSelectedInteractable']),
    onChangeSelectedSatBand(index) {
      this.$store.dispatch('interactableService/setSelectedInteractableIdentByIndex', index)
    },
    onDeleteSelectedInteractable() {
      if (!this.isDisabledParameter && !this.complete) {
        this.deleteSelectedInteractable()
      }
    },
    submitDimensions3z() {
      let { dimensions3 } = this.selectedInteractableState
      dimensions3.z = this.dimensions3zLocal
      this.$store.dispatch('interactableService/update', {})
      this.$store.dispatch('selectionConfig/afterSelectionUserModified', {})
    },
    satbandTabTitle(index) {
      return `${this.$t('MRI.satband')} ${index + 1}`
    },
  },
}
</script>

<style scoped lang="scss">
.sat-band-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.delete-icon {
  font-size: 1.3em;
  &.disabled {
    cursor: not-allowed;
    pointer-events: none;
    color: grey !important;
  }
}
.delete-icon.icon-white {
  color: white;
}
.header-gradient-region {
  background-image: $gradient-gray !important;
  border: 0;
}

/* Disable up/down arrows on number inputs */
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Disable up/down arrows on number inputs */
/* Firefox */
input[type='number'] {
  -moz-appearance: textfield;
}

header {
  display: flex;
  justify-content: space-between;
}

.form-container {
  display: flex;
}
.selection-config-form.xa-theme {
  background-color: black !important;
  color: white;
  border-radius: 12px;
}
.selection-config-form {
  background: $white;
  padding: $spacing-standard;
  box-shadow: 0px 0px 10px rgba(11, 49, 51, 0.25);
  flex-grow: 3;
}

.label-with-unit {
  display: flex;
  justify-content: space-between;
}

.slice-form {
  display: flex;
  padding: 0 24px;
  text-align: left;
  flex-direction: column;
  margin-bottom: $spacing-small;

  input {
    border-radius: 1em;
  }

  .input-lock,
  .min-max-lock {
    display: flex;
    border: 1px solid $border-gray;
    border-radius: 1em;
    align-items: center;

    input {
      border: none;
    }
  }
}

// Added !important here because p tags have margins set for some reason
.resolution-label {
  margin-bottom: 0px !important;
  font-size: 12px;
  color: $gray-three;
}
.resolution-tooltip {
  margin-bottom: 0 !important;
}

.current-selection {
  font-weight: bold;
}

.submit-button-container {
  justify-content: space-between;
  flex-direction: column;
  display: flex;

  .submit-button-holder {
    justify-content: flex-end;
    display: flex;
  }
}

.v-tabs {
  width: unset;
}

.v-tabs--vertical > .v-tabs-bar .v-tabs-bar__content {
  background-color: $white;
  color: $white;
}

.v-btn.no-transform {
  text-transform: none;
  letter-spacing: 0;
}

.cl-button {
  width: 80px;
  user-select: none;
  outline: none;

  &.active {
    color: $white !important;
    border-color: $button-blue;
    background: $button-blue;
  }
}
.selection-config-form.xa-theme .orientation-select .v-input__control {
  background-color: black !important;
  color: white !important;
  border-color: white !important;
}

/* Override the dropdown menu and text color for xa mode */
.selection-config-form.xa-theme .orientation-select .v-input__slot {
  color: white !important;
}

.selection-config-form.xa-theme .v-list-item__title {
  color: white !important;
}

.selection-config-form.xa-theme .v-select__selections {
  color: white !important;
}

.selection-config-form.xa-theme .v-select__control {
  border-color: white !important;
}

.selection-config-form.xa-theme .v-select__control .v-input__append-inner .v-icon {
  color: white !important;
}

.selection-config-form.xa-theme .v-select__control:hover {
  border-color: white !important;
}
.theme--light.v-text-field--solo > .v-input__control > .v-input__slot {
  background: #2e2c2c !important;
}
.theme--light.v-select .v-select__selections {
  color: white !important;
}
::v-deep .v-select.v-input--dense .v-select__selection--comma {
  margin: 0px 0px 0px 0;
}
</style>
