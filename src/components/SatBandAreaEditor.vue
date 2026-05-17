<template>
  <div class="w-100">
    <div class="w-100 mt-4 mb-6 d-flex justify-content-between">
      <div class="group-btn-draw-control">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="btn-draw-point-select-mode"
              :disabled="
                !visibleSatBand || (satBandMode && satBandMode != pointSelectModes.RECTANGLE && isStartDrawSatBandZone)
              "
              :color="satBandMode == pointSelectModes.RECTANGLE && isStartDrawSatBandZone ? 'primary' : ''"
              @click="onChangeSatBandMode(pointSelectModes.RECTANGLE)"
            >
              <img src="@/assets/img/rectangle-icon.png" alt="" />
            </v-btn>
          </template>
          <span>{{ $t('global.rectangle') }}</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="btn-draw-point-select-mode"
              :disabled="
                !visibleSatBand || (satBandMode && satBandMode != pointSelectModes.CIRCLE && isStartDrawSatBandZone)
              "
              :color="satBandMode == pointSelectModes.CIRCLE && isStartDrawSatBandZone ? 'primary' : ''"
              @click="onChangeSatBandMode(pointSelectModes.CIRCLE)"
            >
              <img src="@/assets/img/circle-icon.png" alt="" />
            </v-btn>
          </template>
          <span>{{ $t('global.circle') }}</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="btn-draw-point-select-mode"
              :disabled="
                !visibleSatBand || (satBandMode && satBandMode != pointSelectModes.POLYGON && isStartDrawSatBandZone)
              "
              :color="satBandMode == pointSelectModes.POLYGON && isStartDrawSatBandZone ? 'primary' : ''"
              @click="onChangeSatBandMode(pointSelectModes.POLYGON)"
            >
              <img src="@/assets/img/polygon-icon.png" alt="" />
            </v-btn>
          </template>
          <span>{{ $t('global.polygon') }}</span>
        </v-tooltip>
      </div>
      <div class="d-flex justify-content-center align-items-start flex-column">
        <div v-for="(item, idx) in previewSatbandOverlapDistance" :key="`item-${idx}`">
          {{ `Overlapped ${idx + 1}: ${item}mm` }}
        </div>
      </div>
      <div class="group-btn-draw-control">
        <template v-if="!isStartDrawSatBandZone">
          <v-btn class="btn-draw-point-select-mode" @click="isDeleteModalOpen = true">
            {{ $t('global.delete_all') }}
          </v-btn>
          <v-btn
            :disabled="!currentSatBandSelection"
            class="btn-draw-point-select-mode"
            @click="onDeleteCurrentSatBand"
          >
            {{ $t('global.delete') }}
          </v-btn>
          <v-btn
            :disabled="!currentSatBandSelection"
            class="btn-draw-point-select-mode"
            :color="satBandEditMode ? 'primary' : ''"
            @click="onToggleSatBandEditMode"
          >
            {{ satBandEditMode ? $t('global.done') : $t('global.edit') }}
          </v-btn>
        </template>
        <template v-else>
          <v-btn class="btn-draw-point-select-mode" @click="onCancelDrawingPoints">
            {{ $t('global.cancel') }}
          </v-btn>
          <v-btn class="btn-draw-point-select-mode" @click="onDoneDrawingPoints">
            {{ $t('global.done') }}
          </v-btn>
        </template>
      </div>
    </div>
    <template v-if="currentSelectionMode == pointSelectModes.POLYGON && satBandEditMode">
      <div class="d-flex">
        <v-slider label="Dot size" v-model.number="currentCornerDotSize" :min="1" :step="1" :max="10" ticks></v-slider>
        <span>{{ currentCornerDotSize }}</span>
      </div>
    </template>
    <template
      v-if="
        (satBandMode == pointSelectModes.CIRCLE && isStartDrawSatBandZone) ||
        (currentSelectionMode == pointSelectModes.CIRCLE && satBandEditMode)
      "
    >
      <div class="d-flex">
        <v-slider label="Tolerance" v-model.number="radius" :min="1" :step="2" :max="150" ticks> </v-slider>
        <span>{{ radius }}</span>
      </div>
    </template>
    <template
      v-if="
        (satBandMode == pointSelectModes.RECTANGLE && isStartDrawSatBandZone) ||
        (currentSelectionMode == pointSelectModes.RECTANGLE && satBandEditMode)
      "
    >
      <v-row>
        <v-col cols="6">
          <div class="d-flex">
            <v-slider label="Width" v-model.number="rectangleWidth" :min="5" :step="2" :max="150" ticks> </v-slider>
            <span>{{ rectangleWidth }}</span>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="d-flex">
            <v-slider label="Height" v-model.number="rectangleHeight" :min="5" :step="2" :max="150" ticks> </v-slider>
            <span>{{ rectangleHeight }}</span>
          </div>
        </v-col>
      </v-row>
    </template>
    <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
    <v-dialog v-model="isDeleteModalOpen" width="500">
      <template>
        <v-card>
          <v-card-title class="headline" primary-title>
            {{ $t('global.confirm') }}
          </v-card-title>

          <v-card-text>
            {{ $t('global.delete_all_sat_band') }}
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="isDeleteModalOpen = false">
              {{ $t('global.cancel') }}
            </v-btn>
            <v-btn color="red darken-1" text @click="onConfirmDeleteAllSatBandSelection">
              {{ $t('global.delete') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex'
import config from '../config'
import { POINT_SELECT_MODES } from '../constants'
import _ from 'lodash'

export default {
  name: 'SatBandAreaEditor',
  components: {},
  props: {},
  methods: {
    ...mapMutations('satBandService', [
      'unload',
      'setCurrentRadius',
      'load',
      'setNewSatBandRadius',
      'setCornerSatBandDotSize',
      'setIsStartDrawSatBandZone',
      'setSatBandMode',
      'setTmpSatBandSelectedPolygonPoints',
      'setSatBandEditMode',
      'setNewSatBandRectangleWidth',
      'setNewSatBandRectangleHeight',
      'setCurrentHeight',
      'setCurrentWidth',
      'removeSatBandSelection',
      'removeAllSatBandSelection',
    ]),
    onToggleSatBandEditMode() {
      this.setSatBandEditMode(!this.satBandEditMode)
    },
    onChangeSatBandMode(mode) {
      this.setTmpSatBandSelectedPolygonPoints([])
      this.setSatBandMode(mode)
      this.setIsStartDrawSatBandZone(true)
    },
    onCancelDrawingPoints() {
      this.setTmpSatBandSelectedPolygonPoints([])
      this.setIsStartDrawSatBandZone(false)
    },
    onDoneDrawingPoints() {
      this.setIsStartDrawSatBandZone(false)
    },
    onDeleteCurrentSatBand() {
      if (this.currentSatBandSelection && this.currentSatBandSelection.id) {
        this.removeSatBandSelection(this.currentSatBandSelection.id)
      }
    },
    onConfirmDeleteAllSatBandSelection() {
      this.isDeleteModalOpen = false
      this.removeAllSatBandSelection(this.removeAllSatBandSelection.id)
    },
  },
  data() {
    return {
      isCTLab: config.isCTLab,
      pointSelectModes: POINT_SELECT_MODES,
      isDeleteModalOpen: false,
    }
  },
  computed: {
    ...mapState('satBandService', [
      'isStartDrawSatBandZone',
      'newSatBandRadius',
      'cornerSatBandDotSize',
      'satBandMode',
      'satBandEditMode',
      'newSatBandRectangleHeight',
      'newSatBandRectangleWidth',
      'currentSatBandSelection',
      'visibleSatBand',
    ]),
    ...mapState('interactableService', ['previewSatbandOverlapDistance']),
    currentSelectionMode() {
      if (!this.currentSatBandSelection) {
        return null
      }

      return _.get(this.currentSatBandSelection, ['mode'], this.pointSelectModes.CIRCLE)
    },
    radius: {
      get() {
        return this.newSatBandRadius
      },
      set(val) {
        this.setNewSatBandRadius(val)
        this.setCurrentRadius(null)
      },
    },
    currentCornerDotSize: {
      get() {
        return this.cornerSatBandDotSize
      },
      set(val) {
        this.setCornerSatBandDotSize(val)
      },
    },
    rectangleWidth: {
      get() {
        return this.newSatBandRectangleWidth
      },
      set(val) {
        this.setNewSatBandRectangleWidth(val)
        this.setCurrentWidth(null)
      },
    },
    rectangleHeight: {
      get() {
        return this.newSatBandRectangleHeight
      },
      set(val) {
        this.setNewSatBandRectangleHeight(val)
        this.setCurrentHeight(null)
      },
    },
  },
  mounted() {
    // this.load(this.$props.value)
  },
  beforeDestroy() {
    this.setIsStartDrawSatBandZone(false)
    this.setSatBandEditMode(false)
  },
  watch: {},
}
</script>

<style scoped lang="scss">
.group-btn-draw-control {
  display: flex;
  gap: 12px;
}
.btn-draw-point-select-mode {
  height: auto !important;
  padding: 4px 8px !important;
  img {
    height: 32px;
  }
}
.media-box {
  position: relative;
}
</style>
