<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card>
    <v-card-text class="grey lighten-4" style="background-color: #d7d7d7 !important; height: 100% !important">
      <div class="row-container">
        <div class="column">
          <div class="sub-columns scrollable" style="background-color: #d5d7d7" @scroll="handleScroll">
            <div class="sub-column">
              <div class="subcolumn-key"><span>Cardiac Syncronization</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedCardiacSyncronization', 'CardiacSyncronization')">
                <template v-if="editKey === 'SelectedCardiacSyncronization'">
                  <v-select
                    v-model="SelectedCardiacSyncronization"
                    :items="CardiacSyncronization"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedCardiacSyncronization }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Respiratory Compensation</span></div>
              <div
                class="subcolumn-value"
                @click="startEdit('SelectedRespiratoryCompensation', 'RespiratoryCompensation')"
              >
                <template v-if="editKey === 'SelectedRespiratoryCompensation'">
                  <v-select
                    v-model="SelectedRespiratoryCompensation"
                    :items="RespiratoryCompensation"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedRespiratoryCompensation }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Navigator Respiratory Comp</span></div>
              <div
                class="subcolumn-value"
                @click="startEdit('SelectedNavigatorRespiratoryComp', 'NavigatorRespiratoryComp')"
              >
                <template v-if="editKey === 'SelectedNavigatorRespiratoryComp'">
                  <v-select
                    v-model="SelectedNavigatorRespiratoryComp"
                    :items="NavigatorRespiratoryComp"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedNavigatorRespiratoryComp }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span><b>Flow Compensation</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('SelectedFlowCompensation', 'FlowCompensation')">
                <template v-if="editKey === 'SelectedFlowCompensation'">
                  <v-select
                    v-model="SelectedFlowCompensation"
                    :items="FlowCompensation"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedFlowCompensation }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Temporal Slice Spacing</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedTemporalSliceSpacing', 'TemporalSliceSpacing')">
                <template v-if="editKey === 'SelectedTemporalSliceSpacing'">
                  <v-select
                    v-model="SelectedTemporalSliceSpacing"
                    :items="TemporalSliceSpacing"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedTemporalSliceSpacing }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Motion Smoothing</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedMotionSmoothing', 'MotionSmoothing')">
                <template v-if="editKey === 'SelectedMotionSmoothing'">
                  <v-select
                    v-model="SelectedMotionSmoothing"
                    :items="MotionSmoothing"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedMotionSmoothing }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span>NSA</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('NSA')">
                <template v-if="editKey === 'NSA'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="NSA"
                    :value="NSA"
                    :step="1"
                    :min="1"
                    :max="200"
                    @input="changeSpin($event, 'NSA')"
                  />
                </template>
                <template v-else>
                  {{ NSA }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">SMART</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedSMART', 'SMART')">
                <template v-if="editKey === 'SelectedSMART'">
                  <v-select v-model="SelectedSMART" :items="SMART" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ SelectedSMART }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>MRE Enable</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedMREEnable', 'MREEnable')">
                <template v-if="editKey === 'SelectedMREEnable'">
                  <v-select
                    v-model="SelectedMREEnable"
                    :items="MREEnable"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedMREEnable }}
                </template>
              </div>
            </div>
          </div>
        </div>
        <TabSidebar></TabSidebar>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import SpinButton from './PhSpinButton.vue'
import TabSidebar from './PhTabComponentSidebar.vue'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  components: { SpinButton, TabSidebar },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      SelectedCardiacSyncronization: 'no',
      SelectedRespiratoryCompensation: 'no',
      SelectedNavigatorRespiratoryComp: 'no',
      SelectedFlowCompensation: 'no',
      SelectedTemporalSliceSpacing: 'drfault',
      SelectedMotionSmoothing: 'no',
      SelectedNSA: 2,
      SelectedSMART: 'yes',
      SelectedMREEnable: 'no',

      CardiacSyncronization: [
        { text: 'No', value: 'no' },
        { text: 'Trigger', value: 'trigger' },
      ],
      RespiratoryCompensation: [
        { text: 'no', value: 'no' },
        { text: 'Trigger', value: 'trigger' },
        { text: 'Breath hold', value: 'breathHold' },
        { text: 'PEAR', value: 'PEAR' },
      ],
      NavigatorRespiratoryComp: [
        { text: 'no', value: 'no' },
        { text: 'Trigger', value: 'trigger' },
        { text: 'Trigger and track', value: 'triggerandtrack' },
      ],
      FlowCompensation: [
        { text: 'no (yes)', value: 'no (yes)' },
        { text: 'yes', value: 'yes' },
        { text: 'Sensitized', value: 'sensitized' },
      ],
      TemporalSliceSpacing: [
        { text: 'Default', value: 'default' },
        { text: 'Equidistant', value: 'equidistant' },
        { text: 'minimal', value: 'minimal' },
      ],
      MotionSmoothing: [
        { text: 'no', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      NSA: 2,
      SMART: [
        { text: 'no', value: 'no' },
        { text: 'yes', value: 'yes' },
      ],
      MREEnable: [
        { text: 'no', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],

      editKey: null,
      menu: false,
      selectedDropdownItem: null,
    }
  },

  mounted() {
    document.addEventListener('click', this.handleGlobalClick)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleGlobalClick)
  },
  methods: {
    startEdit(key) {
      this.editKey = key
    },
    endEdit() {
      this.editKey = null
    },
    handleScroll() {
      this.endEdit()
    },
    handleGlobalClick(event) {
      const clickedElement = event.target
      const isEditableArea = this.isEditableArea(clickedElement)
      if (!isEditableArea) {
        this.endEdit()
      }
    },
    isEditableArea(element) {
      let currentElement = element
      while (currentElement) {
        if (currentElement.classList.contains('subcolumn-value')) {
          return true
        }
        currentElement = currentElement.parentElement
      }
      return false
    },
  },
}
</script>

<style scoped>
.v-card__text {
  padding: 0px !important;
  position: static !important;
}
.row-container {
  display: flex;
  overflow-x: auto;
  height: 100%;
}

@media screen and (max-width: 1680px) and (max-height: 1050px) {
  .row-container {
    display: flex;
    overflow-x: auto;
    height: 100%;
  }

  .scrollable {
    overflow-y: scroll;
    max-height: 100% !important;
  }
}

@media screen and (max-width: 1600px) and (max-height: 900px) {
  .row-container {
    display: flex;
    overflow-x: auto;
    height: 100%;
  }

  .scrollable {
    overflow-y: scroll;
    max-height: 100% !important;
  }
}

::v-deep .v-input__append-inner {
  margin-top: 5px !important;
}
.column {
  width: 50%;
  padding: 2px;
  box-sizing: border-box;
  background-color: #d5d7d7;
}

input[type='number'] {
  text-align: right;
}

.sub-columns {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sub-column {
  display: flex;
  justify-content: space-between;
  border: 1px solid;
  padding: 5px;
  height: 33px;
}

.sub-column .subcolumn-key {
  text-align: left !important;
}

.sub-column .subcolumn-value {
  text-align: right !important;
}

.subcolumn-key {
  /* font-weight: bold; */
  width: 90%;
}

.subcolumn-value {
  width: 13rem;
  height: 34px;
}

.scrollable {
  overflow-y: scroll;
  max-height: 21.5rem;
}

::v-deep .v-input__slot fieldset {
  background: white !important;
  border-color: white !important;
  border-radius: 4px !important;
  height: 2rem !important;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  margin-bottom: 10px !important;
  margin-left: 0px !important;
}

.v-input__control {
  height: 2rem !important;
}

/* ::v-deep .v-text-field--outlined.v-input--has-state fieldset,
.v-text-field--outlined.v-input--is-focused fieldset {
  border: 1px solid !important;
} */
::v-deep v-text-field__slot {
  background: #fffcfc !important;
}
::v-deep .v-text-field__slot {
  background: #ffffff !important;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 16px !important;
  right: 2px !important;
  top: -7px !important;
}
::v-deep .v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 25px !important;
  height: 25px !important;
}
::v-deep .v-text-field--outlined.v-input--has-state fieldset,
.v-text-field--outlined.v-input--is-focused fieldset {
  border: 1px solid !important;
}
::v-deep .v-select__selection--comma {
  margin: 0px 0px 0px 0px !important;
}
</style>
