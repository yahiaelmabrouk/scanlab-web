<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="toolbar-cls">
    <!-- Example Buttons with Retro Design -->
    <v-tooltip top>
      <template #activator="{ on, attrs }">
        <v-btn icon class="icon-btn retro-btn" @click="handleIconClick('star')" v-bind="attrs" v-on="on">
          <img class="icon-size" src="@/assets/philips_img/3plus.png" alt="" />
        </v-btn>
      </template>
      <span>Toggle 3 Point Plan Scan</span>
      <!-- 👈 Tooltip Text -->
    </v-tooltip>
    <div class="separator retro-separator"></div>

    <div class="text-2">
      <v-select
        v-model="selectedSimpleValue"
        :items="simpleDropdownOptions"
        dense
        solo
        @change="handleDropdownOptionClick"
      ></v-select>
    </div>

    <div class="separator retro-separator"></div>
    <v-tooltip top>
      <template #activator="{ on, attrs }">
        <v-btn icon class="icon-btn retro-btn" @click="handleIconClick('content-copy')" v-bind="attrs" v-on="on">
          <img class="icon-size" src="@/assets/philips_img/copy.png" alt="" />
        </v-btn>
      </template>
      <span>Add Current Geometry</span>
      <!-- 👈 Tooltip Text -->
    </v-tooltip>

    <v-tooltip top>
      <template #activator="{ on, attrs }">
        <v-btn icon class="icon-btn retro-btn" @click="handleIconClick('content-copy')" v-bind="attrs" v-on="on">
          <img class="icon-size" src="@/assets/philips_img/cross.png" alt="" />
        </v-btn>
      </template>
      <span>Delete Current Geometry</span>
      <!-- 👈 Tooltip Text -->
    </v-tooltip>

    <div class="separator retro-separator"></div>
    <!-- Additional Buttons with Retro Styling -->
    <span>Display</span>
    <v-tooltip top>
      <template #activator="{ on, attrs }">
        <v-btn
          icon
          v-model="isVolumeViewMode"
          class="icon-btn retro-btn"
          @click="isVolumeViewMode = true"
          :disabled="isButtonDisabled || !mayAddSatBand"
          v-shortkey="['del']"
          @shortkey="deleteSelectedInteractable"
          :class="['satband-btn', { 'satband--active': isSatBandActive > 0 }]"
          v-bind="attrs"
          v-on="on"
        >
          <img class="icon-size" src="@/assets/philips_img/satband.png" alt="" />
        </v-btn>
      </template>
      <span>Box Mode</span>
      <!-- 👈 Tooltip Text -->
    </v-tooltip>

    <v-tooltip top>
      <template #activator="{ on, attrs }">
        <v-btn
          icon
          class="icon-btn retro-btn"
          @click="isVolumeViewMode = false"
          v-model="isVolumeViewMode"
          v-bind="attrs"
          v-on="on"
        >
          <img class="icon-size" src="@/assets/philips_img/box.png" alt="" />
        </v-btn>
      </template>
      <span>3D Mode</span>
      <!-- 👈 Tooltip Text -->
    </v-tooltip>

    <v-tooltip top>
      <template #activator="{ on, attrs }">
        <v-btn icon class="icon-btn retro-btn" @click="handleIconClick('content-copy')" v-bind="attrs" v-on="on">
          <img class="icon-size" src="@/assets/philips_img/sliceswithbar.png" alt="" />
        </v-btn>
      </template>
      <span>All Mid Planes</span>
      <!-- 👈 Tooltip Text -->
    </v-tooltip>

    <div class="separator retro-separator"></div>
    <span>Hide</span>
    <v-tooltip top>
      <template #activator="{ on, attrs }">
        <v-btn icon class="icon-btn retro-btn" @click="handleIconClick('content-copy')" v-bind="attrs" v-on="on">
          <img class="icon-size" src="@/assets/philips_img/sliceswithoutbar.png" alt="" />
        </v-btn>
      </template>
      <span>Hide/Show Stack</span>
      <!-- 👈 Tooltip Text -->
    </v-tooltip>

    <v-tooltip top>
      <template #activator="{ on, attrs }">
        <v-btn icon class="icon-btn retro-btn" @click="handleIconClick('content-copy')" v-bind="attrs" v-on="on">
          <img class="icon-size" src="@/assets/philips_img/L.png" alt="" />
        </v-btn>
      </template>
      <span>Hide/Show Volume</span>
      <!-- 👈 Tooltip Text -->
    </v-tooltip>

    <v-btn icon class="icon-btn retro-btn" @click="handleIconClick('content-copy')">
      <img class="icon-size" src="@/assets/philips_img/threebars.png" alt="" />
    </v-btn>
    <div class="separator retro-separator"></div>

    <v-btn icon class="icon-btn retro-btn" @click="handleIconClick('content-copy')">
      <img class="icon-size" src="@/assets/philips_img/handle.png" alt="" />
    </v-btn>
    <v-btn icon class="icon-btn retro-btn" @click="handleIconClick('content-copy')">
      <img class="icon-size" src="@/assets/philips_img/clip.png" alt="" />
    </v-btn>
    <span>center</span>
    <div class="separator retro-separator"></div>
    <v-btn icon v-bind="on" class="icon-btn retro-btn">
      <!-- Play Icon with increased size -->
      <v-icon class="play-icon">mdi-play</v-icon>
      <!-- Dropdown Arrow Icon aligned to the right -->
      <v-icon class="dropdown-icon" small>mdi-menu-down</v-icon>
    </v-btn>
    <div class="separator retro-separator"></div>
    <template>
      <div class="custom-dropdown">
        <!-- Default Display with Down Arrow -->
        <div class="dropdown-header" @click="toggleDropdown">
          <span>Viewing</span>
          <v-icon>mdi-chevron-down</v-icon>
        </div>

        <!-- Main Dropdown Menu -->
        <v-menu v-model="menuOpen" offset-y>
          <template v-slot:activator="{ on }">
            <div v-on="on"></div>
          </template>

          <v-list>
            <!-- Loop through main dropdown options -->
            <template v-for="(option, index) in dropdownOptions">
              <!-- Parent Option (with right arrow) -->
              <v-menu v-if="option.children" :key="'parent-' + index" open-on-hover offset-x>
                <template v-slot:activator="{ on }">
                  <v-list-item v-on="on" class="parent-option">
                    <v-btn icon class="icon-btn retro-btn">
                      <img
                        v-if="option.icon !== null"
                        class="icon-size"
                        :src="`/src/assets/philips_img/${option.icon}`"
                        alt=""
                      />
                      <v-icon v-else left>mdi-circle</v-icon>
                    </v-btn>
                    <v-list-item-content>
                      <v-list-item-title>{{ option.text }}</v-list-item-title>
                    </v-list-item-content>
                    <v-icon right>mdi-chevron-right</v-icon>
                  </v-list-item>
                </template>

                <!-- Submenu -->
                <v-list>
                  <v-list-item
                    v-for="(subOption, subIndex) in option.children"
                    :key="'sub-' + subIndex"
                    @click="selectOption(subOption.value)"
                  >
                    <v-btn icon class="icon-btn retro-btn">
                      <img
                        v-if="subOption.icon !== null"
                        class="icon-size"
                        :src="`/src/assets/philips_img/${subOption.icon}`"
                        alt=""
                      />
                      <v-icon v-else left>mdi-circle</v-icon>
                    </v-btn>
                    <v-list-item-content>
                      <v-list-item-title>{{ subOption.text }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-menu>

              <!-- Simple Selectable Option -->
              <v-list-item v-else :key="'option-' + index" @click="selectOption(option.value)">
                <v-btn icon class="icon-btn retro-btn">
                  <img
                    v-if="option.icon !== null"
                    class="icon-size"
                    :src="`/src/assets/philips_img/${option.icon}`"
                    alt=""
                  />
                  <v-icon v-else left>mdi-circle</v-icon>
                </v-btn>
                <v-list-item-content>
                  <v-list-item-title>{{ option.text }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list>
        </v-menu>
      </div>
    </template>
    <div class="dot-size mr-8" style="display: flex; align-items: center">
      <h6 class="mt-2 mx-1">Dot Size</h6>
      <v-slider
        v-model.number="dotScaleMultiplierIndex"
        :min="0"
        :max="dotScaleValues.length - 1"
        ticks
        style="width: 12rem"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState, mapActions } from 'vuex'
import _, { values } from 'lodash'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import { MriMixin } from '@/components/Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'

export default {
  mixins: [ScanButtonMixin, MriMixin, SelectionConfigMixin],
  data() {
    return {
      simpleDropdownOptions: ['Stack A', 'Shim Volume', 'FOS A'],
      selectedSimpleValue: 'Stack A',
      selectedValue: null,
      menuOpen: false,
      dropdownOptions: [
        {
          text: 'Orientation',
          icon: null,
          children: [
            { text: 'Mirror', icon: 'mirror.png', value: 'Mirror' },
            { text: 'Flip', icon: 'flip.png', value: 'Flip' },
            { text: 'Rotate Clockwise', icon: 'rotate_clockwise.png', value: 'Rotate Clockwise' },
            {
              text: 'Rotate Counter-Clockwise',
              icon: 'rotate_counter_clockwise.png',
              value: 'Rotate Counter-Clockwise',
            },
            { text: 'Reset Orientation', icon: null, value: 'Reset Orientation' },
            {
              text: 'Display Images in Radiological View',
              icon: null,
              value: 'Display Images in Radiological View',
            },
          ],
        },
        {
          text: 'Image Information',
          icon: 'information.png',
          children: [
            { text: 'Minimum', icon: 'minimum.png', value: 'Minimum' },
            { text: 'Standard', icon: 'standard.png', value: 'Standard' },
            { text: 'Maximum', icon: 'maximum.png', value: 'Maximum' },
          ],
        },
        {
          text: 'Interpolate',
          icon: null,
          value: 'Interpolate',
        },
        {
          text: 'Invert Grey Level',
          icon: 'invert.png',
          value: 'Invert Grey Level',
        },
        {
          text: 'Reset Windows',
          icon: null,
          value: 'Reset Windows',
        },
        {
          text: 'Reset Zoom/Pan',
          icon: null,
          value: 'Reset Zoom/Pan',
        },
      ],
    }
  },
  computed: {
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'selectedStackQuestionIndexVisual',
      'scanSubmittedByStackQuestionId',
      'scanSubmitted',
    ]),
    ...mapGetters('user', ['vendorStylePreferenceOptions', 'languageCode']),
    ...mapState('selectionConfig', ['isAddLocalizerMode', 'isVolumeViewMode']),
    ...mapGetters('selectionConfig', ['dotScaleValues']),
    ...mapGetters('scanTimeConfig', [
      'getRepetitionTime',
      'getMinConcatAcqPackage',
      'getSlices',
      'getMinSeqTRfuture',
      'getMinConcatAcqPackagefuture',
    ]),

    toggleReferenceLines: {
      get() {
        return this.$store.state.selectionConfig.showReferenceLines
      },
      set(toggleReferenceLines) {
        this.$store.dispatch('selectionConfig/setShowReferenceLines', toggleReferenceLines)
      },
    },
    isVolumeViewMode: {
      get() {
        return this.$store.state.selectionConfig.isVolumeViewMode
      },
      set(isVolumeViewMode) {
        this.$store.dispatch('selectionConfig/setIsVolumeViewMode', isVolumeViewMode)
      },
    },
    dotScaleMultiplierIndex: {
      get() {
        return _.indexOf(this.dotScaleValues, this.dotScaleMultiplier)
      },
      set(index) {
        this.dotScaleMultiplier = this.dotScaleValues[index]
        if (!this.dotScaleMultiplier) {
          throw Error('set dotScaleMultiplier out of bounds')
        }
      },
    },
    dotScaleMultiplier: {
      get() {
        return this.$store.state.selectionConfig.dotScaleMultiplier
      },
      set(dotScaleMultiplier) {
        this.$store.dispatch('selectionConfig/setDotScaleMultiplier', dotScaleMultiplier)
      },
    },
    isButtonDisabled() {
      return this.getRepetitionTime < this.getMinConcatAcqPackagefuture
    },
  },
  methods: {
    ...mapActions('interactableService', ['deleteSelectedInteractable']),
    ...mapActions('questionService', ['jumpToQuestion']),

    ...mapActions('selectionConfig', ['setIsAddLocalizerMode']),
    handleIconClick(iconName) {
      console.log(`Clicked on icon: ${iconName}`)
    },
    handleDropdownOptionClick(option) {
      console.log(`Selected dropdown option: ${option}`)
    },
    toggleDropdown() {
      this.menuOpen = !this.menuOpen
    },
    selectOption(value) {
      this.selectedValue = value
      this.menuOpen = false
    },
  },
  mounted() {
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
      console.log('this.getRepetitionTime', this.getRepetitionTime)
      console.log('this.getMinConcatAcqPackagefuture', this.getMinConcatAcqPackagefuture)
    })
  },
}
</script>

<style scoped>
/* Retro Menubar Styling */
.satband-btn {
  background-color: transparent;
}
.satband--active:before,
.satband--active:hover:before {
  background-color: black;
  opacity: 0.18;
}
.toolbar-cls {
  display: flex;
  align-items: center;
  background-color: #c1c1c1;
  padding: 0.5rem;
  border: 1px solid #b0b2b2;
  height: 39px;
  box-shadow: inset 1px 1px 2px #ffffff, inset -1px -1px 2px #8e8e8e;
}

.icon-btn {
  padding: 0.3rem;
  /* border: 1px solid #b0b2b2;
  box-shadow: inset 1px 1px 2px #ffffff, inset -1px -1px 2px #8e8e8e;
  background-color: #d5d7d7; */
  border-radius: 3px;
  margin-right: 0.5rem;
}

.icon-btn:hover {
  background-color: #c4c6c6;
}

.retro-separator {
  width: 1px;
  height: 20px;
  background-color: #8e8e8e;
  margin: 0 10px;
}

.icon-size {
  height: 30px;
  width: 30px;
  color: #333;
}
.play-icon {
  font-size: 22px;
  margin-left: 8px;
  transform: translateX(15%);
}
.dropdown span {
  font-size: 13px;
  color: #333;
}
.dropdown-icon {
  transform: translateX(-20%);
}

/* UPDATED BY ME */
::v-deep .v-input__slot {
  width: 8rem;
  margin-bottom: 0px !important;
  margin-top: 20px;
  background: transparent !important;
  box-shadow: none !important;
}
.custom-dropdown {
  display: inline-block;
  position: relative;
}

.dropdown-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  color: black !important;
}

.dropdown-header span {
  flex-grow: 1;
}

.parent-option {
  position: relative;
}

::v-deep .v-list-item__title {
  font-size: 12px !important;
  text-align: start;
}

::v-deep .v-list-item {
  min-height: 10px !important;
}
@media screen and (max-width: 1440px) and (max-height: 900px) {
  .retro-separator {
    width: 1px;
    height: 20px;
    background-color: #8e8e8e;
    margin: 0px !important;
  }
}

.v-tooltip__content {
  background: white !important;
  color: black !important;
  opacity: 1 !important;
}
/* END */
</style>
