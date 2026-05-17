<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card>
    <v-card-text class="grey lighten-4" style="background-color: #d7d7d7 !important; height: 100% !important">
      <div class="row-container">
        <div class="column">
          <div class="sub-columns scrollable" style="background-color: #d5d7d7" @scroll="handleScroll">
            <div class="sub-column">
              <div class="subcolumn-key"><span>FidReduction</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedFidReduction', 'FidReduction')">
                <template v-if="editKey === 'selectedFidReduction'">
                  <v-select
                    v-model="selectedFidReduction"
                    :items="FidReduction"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedFidReduction }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Flow Compensation</span></div>
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
              <div class="subcolumn-key"><span>Direction</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedDirection', 'direction')">
                <template v-if="editKey === 'SelectedDirection'">
                  <v-select
                    v-model="SelectedDirection"
                    :items="direction"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedDirection }}
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
  // eslint-disable-next-line vue/no-unused-components
  components: { SpinButton, TabSidebar },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      selectedFidReduction: 'default',
      FidReduction: [
        { text: 'Default', value: 'default' },
        { text: 'Strong', value: 'strong' },
        { text: 'Extrastrong', value: 'extrastrong' },
      ],
      SelectedFlowCompensation: 'no',
      FlowCompensation: [
        { text: 'no (yes)', value: 'no (yes)' },
        { text: 'yes', value: 'yes' },
        { text: 'Sensitized', value: 'sensitized' },
      ],
      SelectedDirection: 'In-plane',
      direction: [
        { text: 'In-plane', value: 'In-plane' },
        { text: 'Through-plane', value: 'through-plane' },
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
  height: 100%;
}
::v-deep .v-input__append-inner {
  margin-top: 10px !important;
}
.scrollable {
  overflow-y: scroll;
  max-height: 100%;
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
::v-deep .v-input__slot fieldset {
  background: white !important;
  border-color: white !important;
  border-radius: 4px !important;
  height: 2rem !important;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  margin-bottom: 22px !important;
  margin-left: 15px !important;
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
