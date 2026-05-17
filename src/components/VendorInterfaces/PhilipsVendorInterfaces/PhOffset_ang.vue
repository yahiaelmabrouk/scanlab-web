<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card>
    <v-card-text class="grey lighten-4" style="background-color: #d7d7d7 !important; height: 100%">
      <div class="row-container">
        <div class="column">
          <div class="sub-columns scrollable" style="background-color: #d5d7d7" @scroll="handleScroll">
            <div class="sub-column">
              <div class="subcolumn-key">
                <span>Stacks</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('Stacks')">
                <template v-if="editKey === 'Stacks'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="Stacks"
                    :value="Stacks"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'Stacks')"
                  />
                </template>
                <template v-else>
                  {{ Stacks }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span>Stack Offc.AP (P=+mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('StacksOffcAP')">
                <template v-if="editKey === 'StacksOffcAP'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="StacksOffcAP"
                    :value="StacksOffcAP"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'StacksOffcAP')"
                  />
                </template>
                <template v-else>
                  {{ StacksOffcAP }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 30px">RL (L=+mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('StackRL')">
                <template v-if="editKey === 'StackRL'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="StackRL"
                    :value="StackRL"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'StackRL')"
                  />
                </template>
                <template v-else>
                  {{ StackRL }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 30px">FH (H=+mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('StackFH')">
                <template v-if="editKey === 'StackFH'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="StackFH"
                    :value="StackFH"
                    :step="1"
                    :min="1"
                    :max="20000"
                    @input="changeSpin($event, 'StackFH')"
                  />
                </template>
                <template v-else>
                  {{ StackFH }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">Ang.AP (deg)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('AngAP')">
                <template v-if="editKey === 'AngAP'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="AngAP"
                    :value="AngAP"
                    :step="1"
                    :min="1"
                    :max="20000"
                    @input="changeSpin($event, 'AngAP')"
                  />
                </template>
                <template v-else>
                  {{ AngAP }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 30px">RL (deg)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('AngRL')">
                <template v-if="editKey === 'AngRL'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="AngRL"
                    :value="AngRL"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'AngRL')"
                  />
                </template>
                <template v-else>
                  {{ AngRL }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 30px">FH (deg)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('AngFH')">
                <template v-if="editKey === 'AngFH'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="AngFH"
                    :value="AngFH"
                    :step="1"
                    :min="1"
                    :max="20000"
                    @input="changeSpin($event, 'AngFH')"
                  />
                </template>
                <template v-else>
                  {{ AngFH }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">Free rotatable</span></div>
              <div class="subcolumn-value" @click="startEdit('selecteFreeRotatable', 'FreeRotatable')">
                <template v-if="editKey === 'selecteFreeRotatable'">
                  <v-select
                    v-model="selecteFreeRotatable"
                    :items="FreeRotatable"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selecteFreeRotatable }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span>Rest Offc.AP (P=+mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('RestOffcAP')">
                <template v-if="editKey === 'RestOffcAP'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="RestOffcAP"
                    :value="RestOffcAP"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'RestOffcAP')"
                  />
                </template>
                <template v-else>
                  {{ RestOffcAP }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 30px"><b>RL (L=+mm)</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('RestRL')">
                <template v-if="editKey === 'RestRL'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="RestRL"
                    :value="RestRL"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'RestRL')"
                  />
                </template>
                <template v-else>
                  {{ RestRL }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 30px"><b> (H=+mm)</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('RestFH')">
                <template v-if="editKey === 'RestFH'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="RestFH"
                    :value="RestFH"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'RestFH')"
                  />
                </template>
                <template v-else>
                  {{ RestFH }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">Ang.AP (deg)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('AngAP')">
                <template v-if="editKey === 'AngAP'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="AngAP"
                    :value="AngAP"
                    :step="1"
                    :min="1"
                    :max="20000"
                    @input="changeSpin($event, 'AngAP')"
                  />
                </template>
                <template v-else>
                  {{ AngAP }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 30px">RL (deg)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('AngRL')">
                <template v-if="editKey === 'AngRL'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="AngRL"
                    :value="AngRL"
                    :step="1"
                    :min="1"
                    :max="2000"
                    @input="changeSpin($event, 'AngRL')"
                  />
                </template>
                <template v-else>
                  {{ AngRL }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 30px">FH (deg)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('AngFH')">
                <template v-if="editKey === 'AngFH'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="AngFH"
                    :value="AngFH"
                    :step="1"
                    :min="1"
                    :max="20000"
                    @input="changeSpin($event, 'AngFH')"
                  />
                </template>
                <template v-else>
                  {{ AngFH }}
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
      selecteFreeRotatable: 'no',

      Stacks: 1,
      StacksOffcAP: 0,
      StackRL: 0,
      StackFH: 0,
      AngAP: 0,
      AngRL: 0,
      AngFH: 0,
      FreeRotatable: [{ text: 'No', value: 'no' }],
      RestOffcAP: 0,
      RestRL: 80,
      RestFH: 0,

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
