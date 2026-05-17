<template>
  <div>
    <div class="media-box">
      <!-- <ClickableOverlay v-model="pointData" :dimensions="media.dimensions" /> -->
      <BaseMedia :full-video-control="true" :media="media" :is-show-point-selection-answer-area="true"></BaseMedia>
    </div>
    <div class="mt-4 mb-6 d-flex justify-content-between">
      <div class="group-btn-draw-control">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              class="btn-draw-point-select-mode"
              :disabled="pointSelectMode && pointSelectMode != pointSelectModes.RECTANGLE && isStartDrawPointSelectZone"
              :color="pointSelectMode == pointSelectModes.RECTANGLE && isStartDrawPointSelectZone ? 'primary' : ''"
              @click="onChangePointSelectMode(pointSelectModes.RECTANGLE)"
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
              :disabled="pointSelectMode && pointSelectMode != pointSelectModes.CIRCLE && isStartDrawPointSelectZone"
              :color="pointSelectMode == pointSelectModes.CIRCLE && isStartDrawPointSelectZone ? 'primary' : ''"
              @click="onChangePointSelectMode(pointSelectModes.CIRCLE)"
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
              :disabled="pointSelectMode && pointSelectMode != pointSelectModes.POLYGON && isStartDrawPointSelectZone"
              :color="pointSelectMode == pointSelectModes.POLYGON && isStartDrawPointSelectZone ? 'primary' : ''"
              @click="onChangePointSelectMode(pointSelectModes.POLYGON)"
            >
              <img src="@/assets/img/polygon-icon.png" alt="" />
            </v-btn>
          </template>
          <span>{{ $t('global.polygon') }}</span>
        </v-tooltip>
      </div>
      <div class="group-btn-draw-control">
        <template v-if="!isStartDrawPointSelectZone">
          <v-btn class="btn-draw-point-select-mode" @click="isDeleteModalOpen = true">
            {{ $t('global.delete_all') }}
          </v-btn>
          <v-btn :disabled="!currentSelection" class="btn-draw-point-select-mode" @click="onDeleteCurrentPointSelect">
            {{ $t('global.delete') }}
          </v-btn>
          <v-btn
            :disabled="!currentSelection"
            class="btn-draw-point-select-mode"
            :color="pointSelectEditMode ? 'primary' : ''"
            @click="onTogglePointSelectEditMode"
          >
            {{ pointSelectEditMode ? $t('global.done') : $t('global.edit') }}
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
    <template v-if="currentSelectionMode == pointSelectModes.POLYGON && pointSelectEditMode">
      <div class="d-flex">
        <v-slider label="Dot size" v-model.number="currentCornerDotSize" :min="1" :step="1" :max="10" ticks></v-slider>
        <span>{{ currentCornerDotSize }}</span>
      </div>
    </template>
    <template
      v-if="
        (pointSelectMode == pointSelectModes.CIRCLE && isStartDrawPointSelectZone) ||
        (currentSelectionMode == pointSelectModes.CIRCLE && pointSelectEditMode)
      "
    >
      <div class="d-flex">
        <v-slider label="Tolerance" v-model.number="radius" :min="1" :step="2" :max="150" ticks> </v-slider>
        <span>{{ radius }}</span>
      </div>
    </template>
    <template
      v-if="
        (pointSelectMode == pointSelectModes.RECTANGLE && isStartDrawPointSelectZone) ||
        (currentSelectionMode == pointSelectModes.RECTANGLE && pointSelectEditMode)
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
    <v-btn tile @click="unload" v-if="shouldShowNoPathologyButton"> No Pathology </v-btn>
    <v-dialog v-model="isDeleteModalOpen" width="500">
      <template>
        <v-card>
          <v-card-title class="headline" primary-title>
            {{ $t('global.confirm') }}
          </v-card-title>

          <v-card-text>
            {{ $t('global.delete_all_point_selection') }}
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="isDeleteModalOpen = false">
              {{ $t('global.cancel') }}
            </v-btn>
            <v-btn color="red darken-1" text @click="onConfirmDeleteAllPointSelection">
              {{ $t('global.delete') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>

<script>
import BaseMedia from '../Media/BaseMedia'
// import ClickableOverlay from '../../ClickableOverlay'
import { mapMutations, mapState } from 'vuex'
import config from '../../../config'
import EventBus from '@/lib/event-bus'
import { POINT_SELECT_MODES } from '../../../constants'
import _ from 'lodash'

export default {
  name: 'PointSelectQuestionEditor',
  components: {
    BaseMedia,
    // ClickableOverlay,
  },
  props: {
    media: {
      type: Object,
      required: true,
    },
    value: {
      type: Object,
      required: true,
    },
    selectedCategoryName: {
      type: String,
      required: false,
      default: '',
    },
  },
  methods: {
    ...mapMutations('pointSelectService', [
      'unload',
      'setCurrentRadius',
      'load',
      'showPointSelect',
      'hidePointSelect',
      'enableSelection',
      'setNewRadius',
      'setCornerDotSize',
      'setIsStartDrawPointSelectZone',
      'setPointSelectMode',
      'setTmpSelectedPolygonPoints',
      'setPointSelectEditMode',
      'setNewRectangleWidth',
      'setNewRectangleHeight',
      'setCurrentHeight',
      'setCurrentWidth',
    ]),
    onTogglePointSelectEditMode() {
      this.setPointSelectEditMode(!this.pointSelectEditMode)
    },
    onChangePointSelectMode(mode) {
      this.setTmpSelectedPolygonPoints([])
      this.setPointSelectMode(mode)
      this.setIsStartDrawPointSelectZone(true)
    },
    onCancelDrawingPoints() {
      this.setTmpSelectedPolygonPoints([])
      this.setIsStartDrawPointSelectZone(false)
    },
    onDoneDrawingPoints() {
      this.setIsStartDrawPointSelectZone(false)
    },
    onDeleteCurrentPointSelect() {
      EventBus.$emit('onDeleteCurrentPointSelect')
    },
    onConfirmDeleteAllPointSelection() {
      this.isDeleteModalOpen = false
      EventBus.$emit('onDeleteAllCurrentPointSelect')
    },
    // toggleDrawPointSelectZone() {
    //   this.setIsStartDrawPointSelectZone(!this.isStartDrawPointSelectZone)
    // },
  },
  data() {
    return {
      isCTLab: config.isCTLab,
      pointSelectModes: POINT_SELECT_MODES,
      isDeleteModalOpen: false,
    }
  },
  computed: {
    ...mapState('pointSelectService', [
      'noSelections',
      'selections',
      'isStartDrawPointSelectZone',
      'newRadius',
      'cornerDotSize',
      'pointSelectMode',
      'pointSelectEditMode',
      'newRectangleHeight',
      'newRectangleWidth',
      'currentSelection',
    ]),
    currentSelectionMode() {
      if (!this.currentSelection) {
        return null
      }

      return _.get(this.currentSelection, ['mode'], this.pointSelectModes.CIRCLE)
    },
    radius: {
      get() {
        return this.newRadius
      },
      set(val) {
        this.setNewRadius(val)
        this.setCurrentRadius(null)
      },
    },
    currentCornerDotSize: {
      get() {
        return this.cornerDotSize
      },
      set(val) {
        this.setCornerDotSize(val)
      },
    },
    rectangleWidth: {
      get() {
        return this.newRectangleWidth
      },
      set(val) {
        this.setNewRectangleWidth(val)
        this.setCurrentWidth(null)
      },
    },
    rectangleHeight: {
      get() {
        return this.newRectangleHeight
      },
      set(val) {
        this.setNewRectangleHeight(val)
        this.setCurrentHeight(null)
      },
    },
    shouldShowNoPathologyButton() {
      if (_.toLower(this.selectedCategoryName) == 'pathology') {
        return true
      } else {
        return false
      }
    },
  },
  mounted() {
    this.load(this.$props.value)
    this.enableSelection()
    this.showPointSelect()
  },
  beforeDestroy() {
    this.unload()
    this.setIsStartDrawPointSelectZone(false)
    this.hidePointSelect(false)
  },
  watch: {
    selections: {
      deep: true,
      handler: function () {
        this.$emit('input', { noSelections: this.noSelections, selections: this.selections })
      },
    },
  },
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
