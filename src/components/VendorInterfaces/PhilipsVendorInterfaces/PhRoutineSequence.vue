<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="custom-container col-md-6">
    <v-card class="bottom-section">
      <v-btn-toggle>
        <div class="btn-1">
          <div :class="{ 'active-tab': component === 'RoutineTab' }" v-if="!hidebtn || component === 'RoutineTab'">
            <v-btn
              @click="setComponent('RoutineTab')"
              :class="{ 'active-tab': component === 'RoutineTab' }"
              class="btn-pad"
              >Summary</v-btn
            >
          </div>
          <div :class="{ 'active-tab': component === 'GeometryTab' }" v-if="!hidebtn || component === 'GeometryTab'">
            <v-btn
              @click="setComponent('GeometryTab')"
              :class="{ 'active-tab': component === 'GeometryTab' }"
              class="btn-pad"
              >Geometry</v-btn
            >
          </div>
          <div :class="{ 'active-tab': component === 'ContrastTab' }" v-if="!hidebtn || component === 'ContrastTab'">
            <v-btn
              @click="setComponent('ContrastTab')"
              :class="{ 'active-tab': component === 'ContrastTab' }"
              class="btn-pad"
              >Contrast</v-btn
            >
          </div>

          <div :class="{ 'active-tab': component === 'MotionTab' }" v-if="!hidebtn || component === 'MotionTab'">
            <v-btn
              @click="setComponent('MotionTab')"
              :class="{ 'active-tab': component === 'MotionTab' }"
              class="btn-pad"
              >Motion</v-btn
            >
          </div>

          <div :class="{ 'active-tab': component === 'DynAng' }" v-if="!hidebtn || component === 'DynAng'">
            <v-btn @click="setComponent('DynAng')" :class="{ 'active-tab': component === 'DynAng' }" class="btn-pad"
              >Dyn/Ang</v-btn
            >
          </div>
          <div :class="{ 'active-tab': component === 'Postproc' }" v-if="!hidebtn || component === 'Postproc'">
            <v-btn @click="setComponent('Postproc')" :class="{ 'active-tab': component === 'Postproc' }" class="btn-pad"
              >Postproc</v-btn
            >
          </div>
          <div :class="{ 'active-tab': component === 'OffcAng' }" v-if="!hidebtn || component === 'OffcAng'">
            <v-btn @click="setComponent('OffcAng')" :class="{ 'active-tab': component === 'OffcAng' }" class="btn-pad"
              >Offc/Ang</v-btn
            >
          </div>
          <div :class="{ 'active-tab': component === 'Coils' }" v-if="!hidebtn || component === 'Coils'">
            <v-btn @click="setComponent('Coils')" :class="{ 'active-tab': component === 'Coils' }" class="btn-pad"
              >Coils</v-btn
            >
          </div>
          <div
            :class="{ 'active-tab': component === 'Conflicts', 'slide-left': isSlided }"
            v-if="!hidebtn || component === 'Conflicts'"
          >
            <v-btn
              @click="setComponent('Conflicts')"
              :class="{ 'active-tab': component === 'Conflicts' }"
              class="btn-pad"
              >Conflicts</v-btn
            >
          </div>
          <div>
            <v-btn class="btn-pad" :class="{ 'slide-left': isSlided }" @click="toggleSlide">
              <v-icon>mdi-chevron-double-left</v-icon>
            </v-btn>
          </div>
        </div>
      </v-btn-toggle>
      <v-card-text>
        <component :is="component" :selection-ident="selectionIdent" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { MriMixin } from '../../Mixins/MriMixin'
import ContrastTab from './PhContrastTab.vue'
import GeometryTab from './PhGeometryTab.vue'
import RoutineTab from './PhRoutineTab.vue'
import MotionTab from './PhMotionTab.vue'
import DynAng from './PhDynAng.vue'
import Postproc from './PhPostProc.vue'
import OffcAng from './PhOffset_ang.vue'
import Coils from './PhCoils.vue'
import Conflicts from './PhConflicts.vue'
export default {
  data() {
    return {
      mixins: [MriMixin],
      component: 'RoutineTab',
      isSlided: false,
      hidebtn: false,
    }
  },
  components: {
    RoutineTab,
    GeometryTab,
    ContrastTab,
    MotionTab,
    DynAng,
    Postproc,
    OffcAng,
    Coils,
    Conflicts,
  },
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
  methods: {
    setComponent(tabName) {
      this.component = tabName
      console.log('Component set to:', this.component)
    },
    toggleSlide() {
      this.isSlided = !this.isSlided
      this.hidebtn = !this.hidebtn
    },
  },
}
</script>

<style scoped>
.slide-left {
  transform: translateX(1%);
  transition: transform 0.5s ease;
}

::v-deep .v-card__text {
  padding: 0px;
  background: rgb(46, 44, 44);
  position: absolute;
  top: 30px;
  bottom: 0px;
}

.bottom-section {
  height: 100%;
  background: rgb(46, 44, 44);
  position: relative;
}

.v-btn {
  font-size: 10px !important;
  height: 1.25rem;
  background: #d5d7d7 !important;
  color: black !important;
  font-weight: bold;
  border: 1px solid #d5d7d7 !important;
  border-bottom: 1px solid #d5d7d7 !important;
  border-radius: 0px;
  border-top: none !important;
  border-right: none !important;
  min-width: 18.75% !important;
}

.v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  height: 27px;
  background: #d5d7d7;
}

.v-btn-toggle {
  width: 100%;
  border-radius: 0px;
}

.v-card-text {
  height: 88%;
}

.text-1 {
  display: flex;
  justify-content: space-between;
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
  /* border: 1px solid #383535 !important; */
  height: 1.5rem;
  border-bottom: none;
  /* border-radius: 4px; */
}

::v-deep .v-icon.v-icon {
  color: white;
}

.v-input {
  max-width: 45%;
}

::v-deep .v-text-field input {
  padding: 0px;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 6px;
  right: 10px;
  top: 10px;
}

.v-card {
  background: #676866;
  width: 100%;
  height: 100%;
}

.main-1 {
  display: flex;
  justify-content: space-around;
}

.main-2 {
  color: white !important;
}

.v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  border: 1px solid #5a5252 !important;
  border-radius: 0px;
  border-top: none !important;
  border-right: none !important;
  /* width: 12.5%; */
}

.btn-1 {
  display: flex;
  width: 60%;
  justify-content: space-between;
}

.custom-container.col-md-6 {
  max-width: 100% !important;
  padding: 0 !important;
  height: 100%;
}

.v-sheet.v-card {
  border-radius: 0px;
}

.v-btn:not(.v-btn--round).v-size--default {
  min-width: 0px !important;
}

.v-btn {
  font-size: 8px !important;
}

::v-deep .v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: #ffffff !important;
  color: #000000 !important;
}

.active-tab {
  background: #ffffff !important;
  color: black !important;
  font-weight: bold;
  border-bottom: 2px solid white !important;
}

.theme--light.v-btn-toggle:not(.v-btn-toggle--group) {
  background: #676866 !important;
}
.btn-pad {
  width: 100%;
  height: 100%;
  padding: 0 10% 0px 10%;
}
@media only screen and (max-width: 1240px) {
  .btn-1 {
    justify-content: flex-start;
    width: 100%;
  }
  .active-tab {
    width: auto;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    padding: 0 6px;
  }
}

@media only screen and (min-width: 1240px) {
  .btn-1 {
    justify-content: flex-start;
    width: 100%;
  }
  .active-tab {
    width: auto;
  }
  ::v-deep .v-btn:not(.v-btn--round).v-size--default {
    padding: 0 10px;
  }
}
</style>
