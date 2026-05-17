<template>
  <div class="mri-machine-container" :style="{ 'z-index': zIndex || 1, minHeight: '360px', maxHeight: maxHeight }">
    <div class="mri-machine-container-loading-overlay" v-if="isLoading">
      <v-progress-circular indeterminate :size="95" />
    </div>
    <div
      :style="{ minHeight: '360px', maxHeight: maxHeight }"
      ref="box"
      class="box"
      @mouseenter="cursorOnBox = true"
      @mouseleave="cursorOnBox = false"
    ></div>
    <v-btn text hidden v-shortkey.push="['arrowleft']" @shortkey="onToggleKeyCode('ArrowLeft')"> </v-btn>
    <v-btn text hidden v-shortkey.push="['arrowright']" @shortkey="onToggleKeyCode('ArrowRight')"> </v-btn>
    <v-btn text hidden v-shortkey.push="['arrowup']" @shortkey="onToggleKeyCode('ArrowUp')"> </v-btn>
    <v-btn text hidden v-shortkey.push="['arrowdown']" @shortkey="onToggleKeyCode('ArrowDown')"> </v-btn>
    <template v-if="isShowControlSelectPatientPosition">
      <div class="top-right-action-control-board">
        <div class="checkbox-head-holder-container" v-if="isShowOptionHeadHolder">
          <v-checkbox v-model="isShowHeadHolder" label="Leg Pillow"></v-checkbox>
        </div>
        <div class="group-control-three-column">
          <button
            :class="{ active: side1 === patientPositionTexts.HEAD_FIRST }"
            @click="side1 = patientPositionTexts.HEAD_FIRST"
          >
            {{ `Head First` }}
          </button>
          <button
            :class="{ active: side2 === patientPositionTexts.SUPINE }"
            @click="side2 = patientPositionTexts.SUPINE"
          >
            {{ `Supine` }}
          </button>
          <button
            :class="{ active: side3 === patientPositionTexts.ARMS_UP }"
            @click="side3 = patientPositionTexts.ARMS_UP"
          >
            {{ `Arms up` }}
          </button>

          <button
            :class="{ active: side1 === patientPositionTexts.FEET_FIRST }"
            @click="side1 = patientPositionTexts.FEET_FIRST"
          >
            {{ `Feet First` }}
          </button>
          <button :class="{ active: side2 === patientPositionTexts.PRONE }" @click="side2 = patientPositionTexts.PRONE">
            {{ `Prone` }}
          </button>
          <button
            :class="{ active: side3 === patientPositionTexts.ARMS_DOWN }"
            @click="side3 = patientPositionTexts.ARMS_DOWN"
          >
            {{ `Arms down` }}
          </button>
          <div></div>
          <div></div>
          <button
            :class="{ active: side3 === patientPositionTexts.SUPERMAN_POSITION }"
            @click="side3 = patientPositionTexts.SUPERMAN_POSITION"
          >
            {{ `Superman position` }}
          </button>
        </div>
      </div>
    </template>

    <template v-if="(canShowHint || canCheckLazerPosition) && !isPreview">
      <div class="body-box-controls" style="width: 187px">
        <template>
          <template>
            <div v-if="isPlayingMusic">
              <img src="@/assets/audio.png" alt="" />
            </div>
            <div class="text-left text-mouse-legend">{{ `LMB - Pan/Move` }}</div>
            <div class="text-left text-mouse-legend">{{ `MMB - Zoom` }}</div>
            <div class="text-left text-mouse-legend">{{ `RMB - Rotate` }}</div>
          </template>
        </template>
      </div>
    </template>
    <template v-else-if="isBodyBoxEnabled && !isPreview">
      <div class="body-box-controls">
        <div
          :class="`mb-2 text-left ${
            isLocalizerBoxMode ? 'body-box-localizer-controls-group' : 'body-box-controls-group'
          }`"
        >
          <span class="mr-2">{{ `L` }}</span>
          <SpinButtonWithInput
            :type="'number'"
            v-model.number="bodyBoxLength"
            :disabled="!isEditingBodyBox"
            :step="1"
            :min="bodyBoxDimension.length.min"
            :max="bodyBoxDimension.length.max"
          />
        </div>

        <template v-if="!isLocalizerBoxMode">
          <div class="mb-2 text-left body-box-controls-group">
            <span class="mr-2">{{ `W` }}</span>
            <SpinButtonWithInput
              :type="'number'"
              v-model.number="bodyBoxWidth"
              :disabled="!isEditingBodyBox"
              :step="1"
              :min="bodyBoxDimension.width.min"
              :max="bodyBoxDimension.width.max"
            />
          </div>
          <div class="mb-2 text-left body-box-controls-group">
            <span class="mr-2">{{ `H` }}</span>
            <SpinButtonWithInput
              :type="'number'"
              v-model.number="bodyBoxHeight"
              :disabled="!isEditingBodyBox"
              :step="1"
              :min="bodyBoxDimension.height.min"
              :max="bodyBoxDimension.height.max"
            />
          </div>
          <div class="mb-2 text-left body-box-controls-group">
            <span class="mr-2">{{ `H-tol` }}</span>
            <SpinButtonWithInput
              :type="'number'"
              v-model.number="landmarkToleranceTopValue"
              :disabled="!isEditingBodyBox"
              :step="1"
              :min="bodyBoxDimension.toleranceTop.min"
              :max="bodyBoxDimension.toleranceTop.max"
            />
          </div>
          <div class="mb-2 text-left body-box-controls-group">
            <span class="mr-2">{{ `F-tol` }}</span>
            <SpinButtonWithInput
              :type="'number'"
              v-model.number="landmarkToleranceBottomValue"
              :disabled="!isEditingBodyBox"
              :step="1"
              :min="bodyBoxDimension.toleranceBottom.min"
              :max="bodyBoxDimension.toleranceBottom.max"
            />
          </div>
          <div class="mb-2 text-left body-box-controls-group">
            <span class="mr-2">{{ `A/P-tol` }}</span>
            <SpinButtonWithInput
              :type="'number'"
              v-model.number="landmarkToleranceVerticalValue"
              :disabled="!isEditingBodyBox"
              :step="1"
              :min="bodyBoxDimension.toleranceVertical.min"
              :max="bodyBoxDimension.toleranceVertical.max"
            />
          </div>
          <div class="group-scan-dir">
            <button class="btn-change-direction" @click="changeDirection()" :disabled="!isEditingBodyBox">
              {{ `Change Direction` }}
            </button>
          </div>
        </template>
      </div>
    </template>
    <template v-else>
      <div class="body-box-controls" style="width: 187px">
        <div v-if="isPlayingMusic">
          <img src="@/assets/audio.png" alt="" />
        </div>
        <div class="text-left text-mouse-legend">{{ `LMB - Pan/Move` }}</div>
        <div class="text-left text-mouse-legend">{{ `MMB - Zoom` }}</div>
        <div class="text-left text-mouse-legend">{{ `RMB - Rotate` }}</div>
      </div>
    </template>

    <template v-if="canEditDirectionConfig && testRunState == 'LANDMARK' && !isPreview">
      <div class="group-edit-scan-dir">
        <v-radio-group v-model="ctScanDirectionOfLocalizer">
          <v-radio label="Head-to-foot" :value="1"></v-radio>
          <v-radio label="Foot-to-head" :value="2"></v-radio>
        </v-radio-group>
      </div>
    </template>

    <div
      v-if="!isBodyBoxEnabled && !isShowHint && testRunState === 'LANDMARK' && !isPreview"
      class="float-button-container"
      style="top: 12px; left: 80px"
    >
      <button class="float-button" @click="toggleLazer">{{ `Toggle laser` }}</button>
    </div>

    <div v-if="!isPreview" class="float-button-container" style="top: 80px; left: 24px">
      <button class="float-button" @click="toggleFullScreen"><v-icon>mdi-fullscreen </v-icon></button>
    </div>
    <template v-if="!isShowHint && !isPreview">
      <div class="zoom-action-control-board">
        <button @click="zoomIn()">{{ `+` }}</button>
        <button @click="zoomOut()">{{ `-` }}</button>
      </div>
    </template>

    <template v-if="isShowControlUpdown">
      <div class="key-action-control-board">
        <div></div>
        <button :disabled="!isMriInoutPositionNotModified" @mousedown="onActiveKeyCode('ArrowUp')">{{ `Up` }}</button>
        <div></div>
        <button :disabled="!isMriUpDownPositionCorrect" @mousedown="onActiveKeyCode('ArrowLeft')" class="btn-up-down">
          {{ `In` }}
        </button>
        <button :disabled="!isMriInoutPositionNotModified" @mousedown="onActiveKeyCode('ArrowDown')">
          {{ `Down` }}
        </button>
        <button :disabled="!isMriUpDownPositionCorrect" @mousedown="onActiveKeyCode('ArrowRight')" class="btn-up-down">
          {{ `Out` }}
        </button>
      </div>
      <button v-if="isShowHomeButton" class="btn-move-to-home-posiiton" @click="onMoveToHomePosition">
        <v-icon color="#FFF">home</v-icon>
      </button>
    </template>

    <template>
      <div class="bottom-right-action-control-board">
        <v-menu top left>
          <template #activator="{ on }">
            <v-btn v-on="on"> {{ `View` }} </v-btn>
          </template>
          <v-list>
            <v-list-item href="#" @click="moveCameraToView('Bird’s eye')">
              <v-list-item-title>{{ `Bird’s eye` }}</v-list-item-title>
            </v-list-item>
            <v-list-item href="#" @click="moveCameraToView('Oblique')">
              <v-list-item-title>{{ `Oblique` }}</v-list-item-title>
            </v-list-item>
            <v-list-item href="#" @click="moveCameraToView('Lateral')">
              <v-list-item-title>{{ `Lateral` }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </template>

    <b-modal id="modal-patient-position-info" :title="`Patient positions`" centered hide-header ok-only>
      <div class="p-2">
        <div class="mb-3">{{ $t('global.patient_position_is_incorrect') }}</div>
        <b-card>
          <div class="text-start"></div>
          <v-row class="mt-2 mx-0 mb-0">
            <v-col
              cols="12"
              class="pa-0 patient-position-item"
              v-for="item in listPatientPositionsAndBodyBox.filter((el) => el.bodyBox)"
              :key="item.id"
              @click="onSelectPatientPosition(item)"
            >
              {{ item.value.join(', ') }}{{ item.isShowHeadHolder ? `, ${getHeadholderText()}` : `` }}
            </v-col>
          </v-row>
        </b-card>
      </div>
    </b-modal>
  </div>
</template>
<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import _ from 'lodash'
import { Box3, CylinderGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, Vector2, Vector3 } from 'three'
import EventBus from '@/lib/event-bus'
import gsap from 'gsap'
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
import {
  PATIENT_POSITION_TEXT,
  HINT_DIRECTION_TEXTS,
  AVAILABLE_POSITION_COMBINATION,
  SCAN_STATUS,
  PATIENT_POSITION_MODEL_NAME,
  AVAILABLE_POSITION_COMBINATION_HAS_HEAD_HOLDER,
  DEFAULT_POSITION,
  NUM_OF_BODY_MAP_IMAGES,
  ROI_STATUS,
  MAXIMUM_DURATION_OF_MOVING_MRI_MACHINE,
} from '../constants'
import Vue from 'vue'
import SpinButtonWithInput from '@/components/SpinButtonWithInput.vue'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { getHeadholderText } from '../util/utils'
import { MODELS_CACHE } from '../util/loaderManager'

let startTime = window.performance.now()
let previousTime = startTime
let currentTime = 0
let deltaTime = 0
let newPos = new Vector3()

const MIN_Z_OF_BED = 0
const MAX_Z_OF_BED = 30

const MAX_Y_OF_BED = -7.6
const MIN_Y_OF_BED = -35.7

const MAX_Y_IN_OUT_OF_BED = 0
const MIN_Y_IN_OUT_OF_BED = -180

const LAZER_POSITION = new Vector3(0, 78.23276940291073, -85.32322765125012)
const SCAN_AREA_POSITION = new Vector3(0, 78.23276940291073, -115.32322765125012)

const BED_UPDOWN_OBJECT_NAME = 'SM_MRI_bed_upDown'
const BED_INOUT_OBJECT_NAME = 'SM_MRI_bed_inOut'

export default {
  name: 'MRMRIMachineView',
  components: {
    SpinButtonWithInput,
  },
  props: {
    zIndex: { type: Number, required: false, default: 2 },
    canShowHint: {
      type: Boolean,
      required: false,
      default: false,
    },
    canCheckLazerPosition: {
      type: Boolean,
      required: false,
      default: false,
    },
    initBodyBox: {
      type: Object,
      required: false,
      default: null,
    },
    testRunState: {
      type: String,
      required: false,
      default: 'VIEWS',
    },
    canEditDirectionConfig: {
      type: Boolean,
      required: false,
      default: false,
    },
    shouldResetPatientPosition: {
      type: Boolean,
      required: false,
      default: false,
    },
    maxHeight: {
      type: String,
      required: false,
      default: 'unset',
    },
    isPreview: {
      type: Boolean,
      required: false,
      default: false,
    },
    previewPosition: {
      type: Object,
      required: false,
      default: () => {},
    },
    isSetInitPositionToLandmarkedPosition: {
      type: Boolean,
      required: false,
      default: false,
    },
    modelFileName: {
      type: String,
      required: false,
      default: 'Tom.glb',
    },
    isManageModelMode: {
      type: Boolean,
      required: false,
      default: false,
    },
    isLocalizerBoxMode: {
      type: Boolean,
      required: false,
      default: false,
    },
    isEditingBodyBox: {
      type: Boolean,
      required: false,
      default: false,
    },
    shouldZoomToLandmarkViewAfterMount: {
      type: Boolean,
      required: false,
      default: false,
    },
    isShowHomeButton: {
      type: Boolean,
      required: false,
      default: false,
    },
    isHandleMoveToLandmarkEvent: {
      type: Boolean,
      required: false,
      default: false,
    },
    isShowForTimingDecisionQuestion: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      getHeadholderText,
      scene: null,
      renderer: null,
      camera: null,
      controls: null,
      elBox: null,
      model: null,
      keyStates: {},
      cursorOnBox: false,
      currentAnimation: null,
      currentInOutAnimation: null,
      currentUpDownAnimation: null,
      shouldUpdateScanPercent: true,
      startPosY: -7.6,
      isBodyBoxEnabled: false,
      bodyBoxDimension: {
        length: {
          min: 5,
          max: 200,
          current: 20,
        },
        toleranceTop: {
          min: 0,
          max: 200,
          current: 5,
        },
        toleranceBottom: {
          min: 0,
          max: 200,
          current: 5,
        },
        toleranceVertical: {
          min: 0,
          max: 200,
          current: 5,
        },
        width: {
          min: 5,
          max: 200,
          current: 50,
        },
        height: {
          min: 5,
          max: 200,
          current: 20,
        },
      },
      patientPositionTexts: PATIENT_POSITION_TEXT,
      patientPositionModelName: PATIENT_POSITION_MODEL_NAME,
      requestAnimationId: null,
      transformControl: null,
      isShowHint: false,
      hintDirection: HINT_DIRECTION_TEXTS.AP,
      hintDirectionTexts: HINT_DIRECTION_TEXTS,
      availablePositionCombination: AVAILABLE_POSITION_COMBINATION,
      availablePositionCombinationHasHeadHolder: AVAILABLE_POSITION_COMBINATION_HAS_HEAD_HOLDER,
      bodyBoxDirection: 1,
      isConfirmPosition: false,
      isConfirmLandmark: false,
      isPositionRight: false,
      isLandMarkRight: false,
      scanStartPos: null,
      scanEndPos: null,
      SCAN_STATUS: SCAN_STATUS,
      isLoading: false,
      defaultPosition: DEFAULT_POSITION,
      views: [
        {
          title: 'Bird’s eye',
        },
        {
          title: 'Oblique',
        },
        {
          title: 'Lateral',
        },
      ],

      mapTimingDecisionStepWithPatientPosition: [],
      NUM_OF_BODY_MAP_IMAGES: NUM_OF_BODY_MAP_IMAGES,
      ROI_STATUS,
      MAXIMUM_DURATION_OF_MOVING_MRI_MACHINE: MAXIMUM_DURATION_OF_MOVING_MRI_MACHINE,
      rendererSize: new Vector2(),
    }
  },
  computed: {
    ...mapState('selectionConfig', [
      'selectionConfigsByIdent',
      'selectedMRIScanDirection',
      'selectedMRIScanDirectionOfLocalizer',
      'isMRIShowHeadHolder',
    ]),
    ...mapState('stackService', [
      'scanPercentStartOfMRIMachine',
      'scanPercentOfMRIMachine',
      'isMriMachineScanComplete',
      'landmarked3dPoint',
      'scanPercentStartOfLandmark',
    ]),
    ...mapState('questionService', [
      'isEditingQuestion',
      'patientDirectionSide1',
      'patientDirectionSide2',
      'patientDirectionSide3',
      'firstSelectedPatientPosition',
      'submittedPatientPosition',
      'selectedStackQuestionIndex',
      'scanStatus',
      'isMoveMRIMachineEnabled',
      'mriMachineCurrentPosition',
      'isLoadingPlayingTheSlices',
      'isPlayingMusic',
      'roiStatus',
      'timingDecisionStep',
      'presentationTimingDecisionStep',
      'timingDecisionFlouroFrameRate',
      'selectedStackQuestionIndex',
    ]),
    ...mapGetters('questionService', [
      'listPatientPositionsAndBodyBox',
      'isReconstructionQuestion',
      'isAcquisitionQuestion',
      'isLocalizerQuestion',
      'isTimingDecisionQuestion',
      'stackQuestion',
    ]),
    ...mapGetters('stackService', ['distancePercentFromMaxConfigBoxTo3dModelBox', 'isBodyBoxSameDirWithCtScan']),
    modelFileUrl() {
      return `/mr-models/${this.modelFileName}`
    },
    isShowControlSelectPatientPosition() {
      return (
        !this.isShowHint &&
        this.testRunState !== 'LANDMARK' &&
        this.testRunState !== 'QUESTIONS' &&
        this.testRunState !== 'VIEWS' &&
        !this.isPreview &&
        !this.isConfirmPosition
      )
    },
    isShowControlUpdown() {
      return (
        !this.isShowHint &&
        this.testRunState !== 'POSITION' &&
        (this.testRunState !== 'LANDMARK' || (this.testRunState == 'LANDMARK' && !this.isConfirmLandmark)) &&
        !this.isPreview
      )
    },
    ctScanDirection: {
      get() {
        return this.selectedMRIScanDirection
      },
      set(val) {
        this.setSelectedMRIScanDirection(val)
      },
    },
    isShowHeadHolder: {
      get() {
        return this.isMRIShowHeadHolder
      },
      set(val) {
        this.setIsMRIShowHeadHolder(val)
      },
    },
    isShowOptionHeadHolder() {
      return (
        this.side1 == this.patientPositionTexts.HEAD_FIRST &&
        this.side2 == this.patientPositionTexts.SUPINE &&
        this.side3 == this.patientPositionTexts.ARMS_DOWN
      )
    },
    ctScanDirectionOfLocalizer: {
      get() {
        return this.selectedMRIScanDirectionOfLocalizer
      },
      set(val) {
        this.setSelectedMRIScanDirectionOfLocalizer(val)
        this.setSelectedMRIScanDirection(val)
      },
    },
    testToggles() {
      return Object.keys(this.selectionConfigsByIdent).reduce((newTestToggles, toggleName) => {
        const [groupName] = toggleName.trim().split('_')
        if (!newTestToggles[groupName]) newTestToggles[groupName] = []

        newTestToggles[groupName].push({
          toggleName,
          visible: this.selectionConfigsByIdent[toggleName].visible,
        })

        return newTestToggles
      }, {})
    },
    bodyBoxObject() {
      if (!this.scene) return null
      return this.scene.getObjectByName('body-box')
    },
    lazeVerticalObject() {
      if (!this.scene) return null
      return this.scene.getObjectByName('LAZE_VERTICAL')
    },
    scanDirectionArrow() {
      if (!this.scene) return null
      return this.scene.getObjectByName('scan-direction-arrow')
    },
    landmarkToleranceTopBox() {
      if (!this.scene) return null
      return this.scene.getObjectByName('landmark-tolerance-top-box')
    },
    landmarkToleranceVerticalBox() {
      if (!this.scene) return null
      return this.scene.getObjectByName('landmark-tolerance-vertical-box')
    },
    landmarkToleranceBottomBox() {
      if (!this.scene) return null
      return this.scene.getObjectByName('landmark-tolerance-bottom-box')
    },
    MriBedInOut() {
      if (!this.scene) return null
      return this.scene.getObjectByName(BED_INOUT_OBJECT_NAME)
    },
    isMriInoutPositionNotModified() {
      return _.get(this.MriBedInOut, ['position', 'y'], 0) > -1
    },
    MriUpDownObject() {
      if (!this.scene) return null
      return this.scene.getObjectByName(BED_UPDOWN_OBJECT_NAME)
    },
    isMriUpDownPositionCorrect() {
      return _.get(this.MriUpDownObject, ['position', 'z'], 0) < 1
    },
    bodyBoxTransformControl() {
      return this.scene.getObjectByName('bbTransformControl')
    },
    bodyBoxWidth: {
      get() {
        return this.bodyBoxDimension.width.current
      },
      set(val) {
        if (val < this.bodyBoxDimension.width.min || val > this.bodyBoxDimension.width.max) {
          return
        }
        this.bodyBoxDimension.width.current = val
        this.updateBodyBoxSize(Number(val), this.bodyBoxLength, this.bodyBoxHeight)
        this.updateLandmarkToleranceTopBoxSize(Number(val), this.landmarkToleranceTopValue, this.bodyBoxHeight)
        this.updateLandmarkToleranceBottomBoxSize(Number(val), this.landmarkToleranceBottomValue, this.bodyBoxHeight)
        this.updateLandmarkToleranceVerticalBoxSize(
          Number(val),
          this.bodyBoxLength,
          this.landmarkToleranceVerticalValue
        )
      },
    },
    bodyBoxHeight: {
      get() {
        return this.bodyBoxDimension.height.current
      },
      set(val) {
        if (val < this.bodyBoxDimension.height.min || val > this.bodyBoxDimension.height.max) {
          return
        }
        this.bodyBoxDimension.height.current = val
        this.updateBodyBoxSize(this.bodyBoxWidth, this.bodyBoxLength, Number(val))
        this.updateLandmarkToleranceTopBoxSize(this.bodyBoxWidth, this.landmarkToleranceTopValue, Number(val))
        this.updateLandmarkToleranceBottomBoxSize(this.bodyBoxWidth, this.landmarkToleranceBottomValue, Number(val))
        this.updateLandmarkToleranceVerticalBoxSize(
          this.bodyBoxWidth,
          this.bodyBoxLength,
          this.landmarkToleranceVerticalValue
        )
      },
    },
    bodyBoxLength: {
      get() {
        return this.bodyBoxDimension.length.current
      },
      set(val) {
        if (val < this.bodyBoxDimension.length.min || val > this.bodyBoxDimension.length.max) {
          return
        }
        this.bodyBoxDimension.length.current = val
        this.updateBodyBoxSize(this.bodyBoxWidth, Number(val), this.bodyBoxHeight)
        this.updateLandmarkToleranceTopBoxSize(this.bodyBoxWidth, this.landmarkToleranceTopValue, this.bodyBoxHeight)
        this.updateLandmarkToleranceBottomBoxSize(
          this.bodyBoxWidth,
          this.landmarkToleranceBottomValue,
          this.bodyBoxHeight
        )
        this.updateLandmarkToleranceVerticalBoxSize(this.bodyBoxWidth, Number(val), this.landmarkToleranceVerticalValue)
      },
    },
    landmarkToleranceVerticalValue: {
      get() {
        return this.bodyBoxDimension.toleranceVertical.current
      },
      set(val) {
        if (val < this.bodyBoxDimension.toleranceVertical.min || val > this.bodyBoxDimension.toleranceVertical.max) {
          return
        }
        this.bodyBoxDimension.toleranceVertical.current = val
        this.updateLandmarkToleranceVerticalBoxSize(this.bodyBoxWidth, this.bodyBoxLength, Number(val))
      },
    },
    landmarkToleranceTopValue: {
      get() {
        return this.bodyBoxDimension.toleranceTop.current
      },
      set(val) {
        if (val < this.bodyBoxDimension.toleranceTop.min || val > this.bodyBoxDimension.toleranceTop.max) {
          return
        }
        this.bodyBoxDimension.toleranceTop.current = val
        this.updateLandmarkToleranceTopBoxSize(this.bodyBoxWidth, Number(val), this.bodyBoxHeight)
      },
    },
    landmarkToleranceBottomValue: {
      get() {
        return this.bodyBoxDimension.toleranceBottom.current
      },
      set(val) {
        if (val < this.bodyBoxDimension.toleranceBottom.min || val > this.bodyBoxDimension.toleranceBottom.max) {
          return
        }
        this.bodyBoxDimension.toleranceBottom.current = val
        this.updateLandmarkToleranceBottomBoxSize(this.bodyBoxWidth, Number(val), this.bodyBoxHeight)
      },
    },
    bodyBoxZ: {
      get() {
        if (!this.bodyBoxObject) return 0
        let pos = this.bodyBoxObject.position.clone()
        if (this.MriBedInOut && this.MriUpDownObject) {
          const bodyBoxBox3 = new Box3().setFromObject(this.bodyBoxObject)
          // Invert box by scene
          this.MriUpDownObject.updateWorldMatrix(true, true)
          bodyBoxBox3.applyMatrix4(new Matrix4().getInverse(this.MriUpDownObject.matrixWorld))
          bodyBoxBox3.getCenter(pos)
        }
        return Math.round(pos.z)
      },
      // set(val) {
      // },
    },
    bodyBoxY: {
      get() {
        // return 0
        if (!this.bodyBoxObject) return 0
        let pos = this.bodyBoxObject.position.clone()
        if (this.MriBedInOut && this.MriUpDownObject) {
          const bodyBoxBox3 = new Box3().setFromObject(this.bodyBoxObject)
          // Invert box by scene
          this.MriUpDownObject.updateWorldMatrix(true, true)
          bodyBoxBox3.applyMatrix4(new Matrix4().getInverse(this.MriUpDownObject.matrixWorld))
          bodyBoxBox3.getCenter(pos)
        }
        return Math.round(pos.y)
      },
      // set(val){
      //   if(val < this.bodyBoxDimension.x.min || val > this.bodyBoxDimension.x.max){
      //     return
      //   }
      //   this.bodyBoxDimension.x.current = val
      //   this.updateBodyBoxSize(this.bodyBoxWidth, Number(val))
      // }
    },
    side1: {
      get() {
        return this.patientDirectionSide1
      },
      set(val) {
        this.setPatientDirectionSide1(val)
      },
    },
    side2: {
      get() {
        return this.patientDirectionSide2
      },
      set(val) {
        this.setPatientDirectionSide2(val)
      },
    },
    side3: {
      get() {
        return this.patientDirectionSide3
      },
      set(val) {
        this.setPatientDirectionSide3(val)
      },
    },
    currentSavedPatientPosition() {
      return this.listPatientPositionsAndBodyBox.find(
        (el) =>
          el.value.includes(this.side1) &&
          el.value.includes(this.side2) &&
          el.value.includes(this.side3) &&
          el.isShowHeadHolder == this.isShowHeadHolder
      )
    },
  },
  watch: {
    isBodyBoxEnabled() {
      this.onIsBodyBoxEnabledChanged()
      this.updateScanDirectionArrowPosition()
      this.updateLandmarkToleranceBoxPosition()
    },
    side1: 'handleRotateModel',
    side2: 'handleRotateModel',
    side3: 'handleRotateModel',
    initBodyBox() {
      this.onSetupInitBodyBox()
    },
    isShowHint: 'onHandleHintChange',
    hintDirection: 'onHandleHintChange',
    bodyBoxDirection() {
      this.updateScanDirectionArrowPosition()
      this.updateLandmarkToleranceBoxPosition()
    },
    previewPosition: 'onPreviewPositionChange',
    modelFileUrl: 'loadMriMachine',
    isShowHeadHolder() {
      this.toggleHeadHolder()
    },
    scanStatus: 'onMoveMriUpDownToTimingDecisionStep',
    timingDecisionStep: 'onMoveMriUpDownToTimingDecisionStep',
    presentationTimingDecisionStep: 'onMoveMriUpDownToTimingDecisionStep',
    roiStatus: 'onMoveMriUpDownToTimingDecisionStep',
    stackQuestion: 'onSetSizeOfRenderer',
    selectedStackQuestionIndex: 'onMoveMRIMachineToLastestPosition',
  },
  async mounted() {
    if (this.isEditingQuestion) {
      this.setIsMriMachineScanComplete(true)
    } else {
      if (this.isLocalizerQuestion) {
        this.setIsMriMachineScanComplete(false)
      }
    }

    if (this.shouldResetPatientPosition) {
      this.side1 = this.defaultPosition[0]
      this.side2 = this.defaultPosition[1]
      this.side3 = this.defaultPosition[2]
      this.isShowHeadHolder = false
      this.setFirstSelectedPatientPosition(null)
    }

    this.elBox = this.$refs.box

    this.elBox.addEventListener('dblclick', this.toggleFullScreen)

    this.scene = new THREE.Scene()

    this.initRenderer()

    this.elBox.appendChild(this.renderer.domElement)

    //Init scene
    this.scene.background = new THREE.Color('#dedede')

    // Init camera
    this.camera = new THREE.PerspectiveCamera(50, this.elBox.offsetWidth / this.elBox.offsetHeight, 0.1, 100000)
    this.camera.position.set(-300, 300, 300)

    // Init light
    const ambientLight = new THREE.AmbientLight()
    this.scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight()
    directionalLight.intensity = 0.5
    directionalLight.position.set(10, 10, 10)
    this.scene.add(directionalLight)

    this.loadMriMachine()

    this.initOrbitControl()

    this.onSetSizeOfRenderer()

    this.onWindowResize = _.debounce(() => {
      this.onSetSizeOfRenderer()
    }, 50)

    this.requestAnimationId = requestAnimationFrame(this.onFrame)
    document.addEventListener('pointerup', this.onDeActiveAllKeyCode)

    EventBus.$on('onIndexSliceChange', this.handleIndexSliceChange)
    EventBus.$on('onMoveMriModelToBodyBox', this.moveMriUpDownToLandmarkPoint)
    EventBus.$on('onCancelMoveMriModelToBodyBox', this.cancelMoveMriUpDownToLandmarkPoint)
    EventBus.$on('onMoveMriUpDownToTimingDecisionStep', this.onMoveMriUpDownToTimingDecisionStep)
    window.addEventListener('resize', this.onWindowResize)

    if (this.shouldZoomToLandmarkViewAfterMount) {
      this.moveCameraToLandmarkView()
    }

    window.mriMachine = this
  },
  beforeDestroy() {
    this.setMriMachineCurrentPos()
    window.removeEventListener('resize', this.onWindowResize)
    document.removeEventListener('pointerup', this.onDeActiveAllKeyCode)
    EventBus.$off('onIndexSliceChange', this.handleIndexSliceChange)
    EventBus.$off('onMoveMriModelToBodyBox', this.moveMriUpDownToLandmarkPoint)
    EventBus.$off('onCancelMoveMriModelToBodyBox', this.cancelMoveMriUpDownToLandmarkPoint)
    EventBus.$off('onMoveMriUpDownToTimingDecisionStep', this.onMoveMriUpDownToTimingDecisionStep)
    this.destroyAnimation()
    const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
    cancelAnimationFrame(this.requestAnimationId)
    if (this.scene) {
      this.scene.dispose()
    }
  },
  methods: {
    ...mapActions('selectionConfig', [
      'setSelectedMRIScanDirection',
      'setSelectedMRIScanDirectionOfLocalizer',
      'setLandmarkDistanceRatio',
      'setLandmarkDistanceSI',
      'setLandmarkDistanceAP',
      'setIsMRIShowHeadHolder',
    ]),
    ...mapActions('stackService', [
      'setScanPercentStartOfMRIMachine',
      'setScanPercentStartOfLandmark',
      'setScanPercentOfMRIMachine',
      'setIsMriMachineScanComplete',
      'setLandmarked3dPoint',
    ]),
    ...mapActions('questionService', [
      'setPatientDirectionSide1',
      'setPatientDirectionSide2',
      'setPatientDirectionSide3',
      'setPositionScreenshot',
      'setIsMovingMRIMachine',
      'setIsMoveMRIMachineEnabled',
      'setMriMachineLanmarkedPosition',
      'setMriMachineCurrentPosition',
      'setIsMRIMachineMoved',
    ]),
    ...mapActions('timingDecisionService', [
      'setIsMovingMRIMachineToConfirmedPosition',
      'setIsMovedMRIPositionToCorrectZone',
    ]),
    ...mapMutations('questionService', ['setFirstSelectedPatientPosition', 'setSubmittedPatientPosition']),
    onSelectPatientPosition(item) {
      this.side1 = item.value[0]
      this.side2 = item.value[1]
      this.side3 = item.value[2]
      this.isShowHeadHolder = item.isShowHeadHolder
    },
    initRenderer() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
      })
      this.renderer.setClearColor(0x000000, 1)
      this.renderer.setPixelRatio(window.devicePixelRatio)
    },
    initOrbitControl() {
      let target = null
      if (this.controls) {
        target = new Vector3().copy(this.controls.target)
        this.controls.dispose()
      }
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.RIGHT,
        MIDDLE: THREE.MOUSE.MIDDLE,
        RIGHT: THREE.MOUSE.LEFT,
      }
      this.controls.screenSpacePanning = true

      if (!this.isManageModelMode) {
        this.controls.maxPolarAngle = Math.PI / 2
        this.controls.minPolarAngle = -Math.PI / 2

        this.controls.maxAzimuthAngle = Math.PI / 2
        this.controls.minAzimuthAngle = -Math.PI / 2
      }

      if (target) {
        this.controls.target.copy(target)
      }
    },
    resetDataForLocalizerBoxMode() {
      this.side1 = this.defaultPosition[0]
      this.side2 = this.defaultPosition[1]
      this.side3 = this.defaultPosition[2]
    },
    onPreviewPositionChange() {
      if (this.isPreview) {
        let patientPositions = _.get(
          this.previewPosition,
          ['patientPositions'],
          [this.patientPositionTexts.HEAD_FIRST, this.patientPositionTexts.SUPINE, this.patientPositionTexts.ARMS_UP]
        )
        if (patientPositions.length < 2) {
          patientPositions = [
            this.patientPositionTexts.HEAD_FIRST,
            this.patientPositionTexts.SUPINE,
            this.patientPositionTexts.ARMS_UP,
          ]
        }

        this.side1 = patientPositions[0]
        this.side2 = patientPositions[1]
        this.side3 = patientPositions[2]

        const machinePosition = _.get(this.previewPosition, ['mriMachinePosition'], {
          mriUpDownPositionY: 0,
          mriInOutPositionZ: 0,
        })
        this.setMriUpdownAndInOutPosition(machinePosition)

        const showHeadHolder = _.get(this.previewPosition, ['isMRIShowHeadHolder'], false)
        this.isShowHeadHolder = showHeadHolder
      }
    },
    setMriUpdownAndInOutPosition(machinePosition) {
      if (this.MriBedInOut) {
        this.MriUpDownObject.updateWorldMatrix(true, true)
        const mriInOutPositionZ = _.get(machinePosition, ['mriInOutPositionZ'], 0)
        const currentUpDownPositionZ = this.MriBedInOut.getWorldPosition(new Vector3()).z
        const distanceZ = currentUpDownPositionZ - mriInOutPositionZ
        this.MriBedInOut.position.set(
          this.MriBedInOut.position.x,
          this.MriBedInOut.position.y - distanceZ,
          this.MriBedInOut.position.z
        )
      }
    },
    onSetupInitBodyBox() {
      if (this.canCheckLazerPosition || this.canShowHint) {
        if (this.initBodyBox) {
          this.addBox()
          this.setBodyBox(this.initBodyBox)
          this.updateBodyBoxVisibility(false, 'view')
          if (this.transformControl) {
            this.transformControl.detach()
          }
        } else {
          this.removeBox()
          if (this.transformControl) {
            this.transformControl.detach()
          }
        }
      }
    },
    onHandleHintChange() {
      this.onRemoveHint()
      if (this.isShowHint) {
        this.toggleVisibleLazer(false)
        this.onShowHint()
        this.fitCameraToHint()
      } else {
        this.toggleVisibleLazer(true)
        this.resetCamera()
      }
    },
    onShowHint() {
      if (!this.bodyBoxObject) {
        Vue.notify({ type: 'warning', text: `Can't find body box in model!` })
        return
      }

      const hintLinesGroup = new THREE.Group()
      hintLinesGroup.name = 'hint-lines'

      this.bodyBoxObject.updateWorldMatrix(true, true)
      let newCenter = new Vector3()
      new Box3().setFromObject(this.bodyBoxObject).getCenter(newCenter)

      const hintPos = newCenter.clone().setZ(newCenter.z - this.bodyBoxLength / 2)

      const cylinderMaterial = new MeshStandardMaterial({ color: '#FF0000', depthTest: false, depthWrite: false })
      const cylinderGeometry = new CylinderGeometry(0.2, 0.2, 120, 32)
      const cylinderX = new Mesh(cylinderGeometry, cylinderMaterial)
      cylinderX.renderOrder = 10
      cylinderX.position.copy(hintPos)
      cylinderX.rotation.set(0, 0, Math.PI / 2)

      const cylinderY = cylinderX.clone()
      cylinderY.rotation.set(0, 0, 0)

      const cylinderZ = cylinderX.clone()
      cylinderZ.rotation.set(Math.PI / 2, 0, 0)

      hintLinesGroup.add(cylinderX, cylinderY, cylinderZ)

      this.scene.add(hintLinesGroup)
    },
    moveCameraToLandmarkView() {
      const target = new Vector3(0, 90, -20)
      if (this.controls && this.camera) {
        this.controls.target.copy(target)
        this.camera.position.copy(
          target.clone().add(new Vector3(-0.9761870601839527, 0, 0.21693045781865616).multiplyScalar(160))
        )
      }
    },
    moveCameraToPositionView() {
      const target = new Vector3(0, 65, -20)
      if (this.controls && this.camera) {
        this.controls.target.copy(target)
        this.camera.position.copy(target.clone().add(new Vector3(-2, 0.5, 1).normalize().multiplyScalar(230)))
      }
    },
    moveCameraToView(view) {
      const target = new Vector3(0, 90, -20)

      if (this.controls && this.camera) {
        this.controls.target.copy(target)
        if (view == 'Bird’s eye') {
          this.camera.position.copy(target.clone().add(new Vector3(0, 1, 0).multiplyScalar(330)))
        } else if (view == 'Lateral') {
          this.camera.position.copy(
            target.clone().add(new Vector3(-0.9761870601839527, 0, 0.21693045781865616).multiplyScalar(330))
          )
        } else if (view == 'Oblique') {
          this.camera.position.copy(
            target
              .clone()
              .add(new Vector3(-0.7276068751089989, 0.48507125007266594, 0.48507125007266594).multiplyScalar(330))
          )
        }
      }
    },
    fitCameraToHint() {
      if (!this.bodyBoxObject) {
        return
      }

      this.bodyBoxObject.updateWorldMatrix(true, true)
      let newCenter = new Vector3()
      new Box3().setFromObject(this.bodyBoxObject).getCenter(newCenter)
      const hintPos = newCenter.clone().setZ(newCenter.z - this.bodyBoxLength / 2)

      this.controls.target.copy(hintPos)
      if (this.hintDirection == this.hintDirectionTexts.AP) {
        this.camera.position.copy(hintPos.clone().add(new Vector3(0, 1, 0).multiplyScalar(300)))
      } else {
        if (this.hintDirection == this.hintDirectionTexts.LATERAL) {
          this.camera.position.copy(hintPos.clone().add(new Vector3(-1, 0, 0).multiplyScalar(300)))
        }
      }
    },
    resetCamera() {
      this.camera.position.copy(new Vector3(-300, 300, 300))
      this.controls.target = new Vector3(0, 0, 0)
    },
    onRemoveHint() {
      if (this.scene) {
        const hintGroup = this.scene.getObjectByName('hint-lines')
        if (hintGroup) {
          this.scene.remove(hintGroup)
        }
      }
    },
    onIsBodyBoxEnabledChanged() {
      if (this.isBodyBoxEnabled && !this.bodyBoxObject) {
        this.addBox()
      }
    },
    destroyAnimation() {
      if (this.currentAnimation && this.currentAnimation.kill) {
        this.currentAnimation.kill()
      }
      if (this.currentInOutAnimation && this.currentInOutAnimation.kill) {
        this.currentInOutAnimation.kill()
      }
      if (this.currentUpDownAnimation && this.currentUpDownAnimation.kill) {
        this.currentUpDownAnimation.kill()
      }
    },
    onMoveToHomePosition() {
      this.destroyAnimation()
      this.enabledMoveButton()
      const MriBedInOut = this.scene.getObjectByName(BED_INOUT_OBJECT_NAME)
      if (MriBedInOut) {
        this.currentAnimation = gsap.to(MriBedInOut.position, {
          y: 0,
          // Duration in setInterval auto play slice in SliceView
          duration: Math.abs(MriBedInOut.position.y) / 30,
          ease: 'none',
          onComplete: () => {
            this.setMriMachineCurrentPos()
          },
        })
      }
    },
    getMRIInOutHomePosition() {
      if (this.modelFileUrl) {
        if (
          this.modelFileUrl.includes('Gordo') ||
          this.modelFileUrl.includes('Penny') ||
          this.modelFileUrl.includes('Sharon')
        ) {
          return 7.7877
        }
      }

      return 0
    },
    onMoveMRIUpdownToLowestPosition() {},
    handleIndexSliceChange(indexSlice, slicesAmount) {
      if (this.isReconstructionQuestion) {
        return
      }
      this.shouldUpdateScanPercent = true
      this.destroyAnimation()
      let startPos = MAX_Y_OF_BED
      let endPos = MIN_Y_OF_BED
      const info = this.currentSavedPatientPosition
      if (info && info.bodyBox) {
        this.addBox()
        this.setBodyBox(info.bodyBox)
        this.updateBodyBoxVisibility(false, 'view')
        if (this.transformControl) {
          this.transformControl.detach()
        }
        //Lookup body box
        if (this.bodyBoxObject) {
          this.bodyBoxObject.updateWorldMatrix(true, true)

          // scanPercentStartOfLandmark < 0 mean the landmarked is far from bodybox
          const expandOfScan =
            this.bodyBoxLength -
            (this.scanPercentStartOfLandmark / 100) * this.bodyBoxLength +
            (this.distancePercentFromMaxConfigBoxTo3dModelBox / 100) * this.bodyBoxLength
          const bodyBoxDirection = _.get(info, ['bodyBox', 'bodyBoxDirection'], 1)
          if (this.MriBedInOut) {
            if (indexSlice == 0) {
              startPos = this.MriBedInOut.position.y
            } else {
              startPos = this.startPosY
            }
            if (this.isBodyBoxSameDirWithCtScan) {
              if (bodyBoxDirection == 1) {
                //In
                endPos = startPos - expandOfScan
              } else {
                //Out
                endPos = startPos + expandOfScan
              }
            } else {
              if (bodyBoxDirection == 1) {
                //Out
                endPos = startPos + expandOfScan
              } else {
                //In
                endPos = startPos - expandOfScan
              }
            }
          }
        }
      }
      if (slicesAmount < 1) {
        this.moveBedInOutToYPos(startPos, 0.4)
      } else {
        if (this.MriBedInOut) {
          if (indexSlice == 0) {
            this.startPosY = this.MriBedInOut.position.y
            if (!this.isMriMachineScanComplete) {
              let startPercent = 0
              this.scanStartPos = startPos
              this.scanEndPos = endPos
              if (
                (startPos > endPos && this.startPosY > startPos) ||
                (startPos < endPos && this.startPosY < startPos)
              ) {
                startPercent = 0
              } else if (
                (startPos > endPos && this.startPosY < endPos) ||
                (startPos < endPos && this.startPosY > endPos)
              ) {
                startPercent = 100
              } else {
                startPercent = Math.min(
                  Math.ceil((Math.abs(startPos - this.startPosY) / Math.abs(startPos - endPos)) * 100),
                  100
                )
              }
              this.setScanPercentStartOfMRIMachine(startPercent)
            }
          } else {
            const currentStartPost = this.isLocalizerQuestion ? this.startPosY ?? startPos : startPos
            const distanceForOneStep = (endPos - currentStartPost) / (slicesAmount - 1)
            const nextYPos = currentStartPost + indexSlice * distanceForOneStep
            this.moveBedInOutToYPos(nextYPos, 0.4)
          }
        }
      }
    },
    moveBedInOutToYPos(newYPos, duration = 0.4) {
      if (!this.scene) {
        return
      }
      const MriBedInOut = this.scene.getObjectByName(BED_INOUT_OBJECT_NAME)
      if (MriBedInOut) {
        this.setIsMovedMRIPositionToCorrectZone(false)
        this.currentAnimation = gsap.to(MriBedInOut.position, {
          y: newYPos,
          // Duration in setInterval auto play slice in SliceView
          duration: duration,
          ease: 'none',
          onComplete: () => {
            this.setMriMachineCurrentPos()
          },
        })
      }
    },
    zoomIn() {
      if (this.camera) {
        this.camera.fov = this.clickZoom(this.camera.fov, 'zoomIn')
        this.camera.updateProjectionMatrix()
      }
    },
    zoomOut() {
      if (this.camera) {
        this.camera.fov = this.clickZoom(this.camera.fov, 'zoomOut')
        this.camera.updateProjectionMatrix()
      }
    },
    clickZoom(value, zoomType) {
      if (value >= 20 && zoomType === 'zoomIn') {
        return value - 5
      } else if (value <= 100 && zoomType === 'zoomOut') {
        return value + 5
      } else {
        return value
      }
    },
    onFrame(timestamp) {
      currentTime = timestamp
      deltaTime = currentTime - previousTime
      previousTime = currentTime

      if (this.renderer) {
        this.renderer.getSize(this.rendererSize)
        if (this.rendererSize.x != 0 && this.rendererSize.y != 0) {
          this.handleMriMove(deltaTime / 3600)
          this.updateScanPercentOfMRIMachine()

          this.controls.update()
          this.render()
        }
      }

      this.requestAnimationId = requestAnimationFrame(this.onFrame)
    },
    render() {
      this.renderer.render(this.scene, this.camera)
    },
    afterBodyBoxChange() {
      if (this.isBodyBoxEnabled) {
        const MriBedInOut = this.scene.getObjectByName(BED_INOUT_OBJECT_NAME)
        const MriUpDown = this.scene.getObjectByName(BED_UPDOWN_OBJECT_NAME)
        const bodyBox = this.scene.getObjectByName('body-box')
        if (bodyBox && MriBedInOut && MriUpDown) {
          MriBedInOut.updateWorldMatrix(true, true)
          const bodyBoxBox3 = new Box3().setFromObject(bodyBox)
          // Invert box by scene
          bodyBoxBox3.applyMatrix4(new Matrix4().getInverse(MriUpDown.matrixWorld))
        }
      }
    },
    updateScanPercentOfMRIMachine() {
      if (_.isNil(this.scanStartPos) || _.isNil(this.scanEndPos) || !this.MriBedInOut) {
        return
      }
      let newScanPercent = 100

      if (
        (this.scanStartPos > this.scanEndPos && this.MriBedInOut.position.y > this.scanStartPos) ||
        (this.scanStartPos < this.scanEndPos && this.MriBedInOut.position.y < this.scanStartPos)
      ) {
        newScanPercent = 0
      } else if (
        (this.scanStartPos > this.scanEndPos && this.MriBedInOut.position.y < this.scanEndPos) ||
        (this.scanStartPos < this.scanEndPos && this.MriBedInOut.position.y > this.scanEndPos)
      ) {
        newScanPercent = 100
      } else {
        newScanPercent = Math.min(
          Math.ceil(
            (Math.abs(this.scanStartPos - this.MriBedInOut.position.y) /
              Math.abs(this.scanStartPos - this.scanEndPos)) *
              100
          ),
          100
        )
      }

      if (
        newScanPercent != this.scanPercentOfMRIMachine &&
        !this.isMriMachineScanComplete &&
        this.shouldUpdateScanPercent
      ) {
        this.setScanPercentOfMRIMachine(newScanPercent)
      }
    },
    removeBox() {
      if (this.bodyBoxObject && this.MriBedInOut) {
        this.MriBedInOut.remove(this.bodyBoxObject)
      }
    },
    onMoveMriUpDownToTimingDecisionStep() {
      if (this.isTimingDecisionQuestion && this.isShowForTimingDecisionQuestion) {
        if (this.roiStatus == this.ROI_STATUS.NO_CONFIRM && this.scanStatus == this.SCAN_STATUS.SCANNED) {
          this.handleMoveMriUpDownToTimingDecisionStep(null)
        } else if (this.roiStatus == this.ROI_STATUS.CONFIRMED) {
          this.handleMoveMriUpDownToTimingDecisionStep(null)
        } else if (this.roiStatus == this.ROI_STATUS.SHOW_ROI) {
          this.handleMoveMriUpDownToTimingDecisionStep(null)
        } else if (this.roiStatus == this.ROI_STATUS.RUNNING) {
          this.handleMoveMriUpDownToTimingDecisionStep(Math.max(this.timingDecisionFlouroFrameRate, 0.1))
        }
      }
    },
    handleMoveMriUpDownToTimingDecisionStep(duration = 1) {
      if (this.MriBedInOut && this.MriUpDownObject) {
        this.addROIBox()
        this.MriUpDownObject.updateWorldMatrix(true, true)

        const mapTimingDecisionStepInfo = this.mapTimingDecisionStepWithPatientPosition.find(
          (el) => el.step == this.timingDecisionStep
        )
        if (!mapTimingDecisionStepInfo) {
          return
        }
        // const worldPosition = this.MriBedInOut.getWorldPosition(new Vector3())
        const distanceZ = mapTimingDecisionStepInfo.z - SCAN_AREA_POSITION.z // 30 is distance from lazer to black scan area

        if (this.currentInOutAnimation) {
          this.currentInOutAnimation.kill()
          this.currentInOutAnimation = null
        }

        let movingDuration = duration != null ? duration : Math.abs(distanceZ / 15)
        if (movingDuration > this.MAXIMUM_DURATION_OF_MOVING_MRI_MACHINE) {
          movingDuration = this.MAXIMUM_DURATION_OF_MOVING_MRI_MACHINE
        }

        this.setIsMovingMRIMachineToConfirmedPosition(
          this.roiStatus != this.ROI_STATUS.RUNNING && this.roiStatus != this.ROI_STATUS.DONE
        )
        this.currentInOutAnimation = gsap.to(this.MriBedInOut.position, {
          y: this.MriBedInOut.position.y - distanceZ,
          // Duration in setInterval auto play slice in SliceView
          duration: movingDuration,
          ease: 'none',
          onComplete: () => {
            this.setIsMovingMRIMachineToConfirmedPosition(false)
            this.setIsMovedMRIPositionToCorrectZone(true)
            this.setMriMachineCurrentPos()
          },
        })
      }
    },
    addROIBox() {
      const roiBoxObject = this.scene.getObjectByName('ROI_BOX')
      if (roiBoxObject) {
        this.scene.remove(roiBoxObject)
      }
      const standardModelName = `headfirst_supine_armsdown`
      const standardPatient = this.scene.getObjectByName(standardModelName)

      const currentModelName = `${this.patientPositionModelName[this.side1]}_${
        this.patientPositionModelName[this.side2]
      }_${this.patientPositionModelName[this.side3]}`
      const currentPatient = this.scene.getObjectByName(currentModelName)

      let patientHeight = 0
      // Patient orientation is Z
      if (standardPatient) {
        standardPatient.updateWorldMatrix(true, true)
        currentPatient.updateWorldMatrix(true, true)

        const standardBox3 = new Box3().setFromObject(standardPatient)
        const currentBox3 = new Box3().setFromObject(currentPatient)

        patientHeight = standardBox3.max.z - standardBox3.min.z - 10

        if (this.side1 == this.patientPositionTexts.HEAD_FIRST) {
          standardBox3.max.setZ(currentBox3.max.z - patientHeight / 2)
          standardBox3.min.setZ(currentBox3.max.z - patientHeight)
        } else {
          standardBox3.max.setZ(currentBox3.min.z + patientHeight)
          standardBox3.min.setZ(currentBox3.min.z + patientHeight / 2)
        }

        if (standardBox3.max.z - standardBox3.min.z > 0) {
          const step = (standardBox3.max.z - standardBox3.min.z) / this.NUM_OF_BODY_MAP_IMAGES

          if (this.side1 == this.patientPositionTexts.HEAD_FIRST) {
            this.mapTimingDecisionStepWithPatientPosition = new Array(this.NUM_OF_BODY_MAP_IMAGES)
              .fill(null)
              .map((el, index) => {
                return {
                  step: index,
                  z: standardBox3.min.z + index * step,
                }
              })
          } else {
            this.mapTimingDecisionStepWithPatientPosition = new Array(this.NUM_OF_BODY_MAP_IMAGES)
              .fill(null)
              .map((el, index) => {
                return {
                  step: index,
                  z: standardBox3.max.z - index * step,
                }
              })
          }
        }

        // const boxHelper = new Box3Helper(standardBox3)
        // boxHelper.name = 'ROI_BOX'
        // this.scene.add(boxHelper)
      }
    },
    addBox() {
      if (this.bodyBoxObject || !this.model) {
        return
      }
      const boxGeo = new THREE.BoxBufferGeometry(
        this.bodyBoxDimension.width.max,
        this.bodyBoxDimension.length.max,
        this.bodyBoxDimension.height.max
      )
      const box = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 'red', transparent: true, opacity: 0.5 }))
      box.renderOrder = 1
      // this.scene.add(box)
      const MriBedInOut = this.model.getObjectByName(BED_INOUT_OBJECT_NAME)
      if (MriBedInOut) {
        MriBedInOut.add(box)
        box.updateWorldMatrix(true, true)
      }
      box.position.set(0, 0, -80)
      box.scale.setX(this.bodyBoxWidth / this.bodyBoxDimension.width.max)
      box.scale.setY(this.bodyBoxLength / this.bodyBoxDimension.length.max)
      box.scale.setZ(this.bodyBoxHeight / this.bodyBoxDimension.height.max)
      box.name = 'body-box'

      if (this.transformControl) {
        this.scene.remove(this.transformControl)
        this.transformControl.dispose()
      }

      this.transformControl = new TransformControls(this.camera, this.renderer.domElement)
      this.transformControl.name = 'bbTransformControl'
      this.transformControl.showX = false

      this.transformControl.addEventListener('mouseDown', () => {
        this.controls.enabled = false
      })
      this.transformControl.addEventListener('mouseUp', () => {
        this.controls.enabled = true
        this.afterBodyBoxChange()
      })
      this.transformControl.addEventListener('change', () => {
        this.updateScanDirectionArrowPosition()
        this.updateLandmarkToleranceBoxPosition()
      })
      this.transformControl.attach(box)
      this.scene.add(this.transformControl)

      this.afterBodyBoxChange()
      this.addScanDirectionArrow()
      this.addLandmarkToleranceTopBox()
      this.addLandmarkToleranceBottomBox()
      this.addLandmarkToleranceVerticalBox()
    },
    addLandmarkToleranceTopBox() {
      if (this.landmarkToleranceTopBox || !this.model) {
        return
      }

      const boxGeo = new THREE.BoxBufferGeometry(
        this.bodyBoxDimension.width.max,
        this.bodyBoxDimension.length.max,
        this.bodyBoxDimension.height.max
      )
      const box = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 'green', transparent: false }))
      // this.scene.add(box)
      const MriBedInOut = this.model.getObjectByName(BED_INOUT_OBJECT_NAME)
      if (MriBedInOut) {
        MriBedInOut.add(box)
        box.updateWorldMatrix(true, true)
      }
      box.position.set(0, 0, -80)
      box.scale.setX((this.bodyBoxWidth - 1) / this.bodyBoxDimension.width.max)
      box.scale.setY(this.landmarkToleranceTopValue / this.bodyBoxDimension.length.max)
      box.scale.setZ((this.bodyBoxHeight - 2) / this.bodyBoxDimension.height.max)
      box.name = 'landmark-tolerance-top-box'

      this.updateLandmarkToleranceBoxPosition()
    },
    addLandmarkToleranceVerticalBox() {
      if (this.landmarkToleranceVerticalBox || !this.model) {
        return
      }

      const boxGeo = new THREE.BoxBufferGeometry(
        this.bodyBoxDimension.width.max,
        this.bodyBoxDimension.length.max,
        this.bodyBoxDimension.height.max
      )
      const box = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: '#ff00ec', transparent: false }))
      // this.scene.add(box)
      const MriBedInOut = this.model.getObjectByName(BED_INOUT_OBJECT_NAME)
      if (MriBedInOut) {
        MriBedInOut.add(box)
        box.updateWorldMatrix(true, true)
      }
      box.position.set(0, 0, -80)
      box.scale.setX((this.bodyBoxWidth - 1) / this.bodyBoxDimension.width.max)
      box.scale.setY((this.bodyBoxLength - 1) / this.bodyBoxDimension.length.max)
      box.scale.setZ(this.landmarkToleranceVerticalValue / this.bodyBoxDimension.height.max)
      box.name = 'landmark-tolerance-vertical-box'

      this.updateLandmarkToleranceBoxPosition()
    },
    addLandmarkToleranceBottomBox() {
      if (this.landmarkToleranceBottomBox || !this.model) {
        return
      }

      const boxGeo = new THREE.BoxBufferGeometry(
        this.bodyBoxDimension.width.max,
        this.bodyBoxDimension.length.max,
        this.bodyBoxDimension.height.max
      )
      const box = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 'yellow', transparent: false }))
      // this.scene.add(box)
      const MriBedInOut = this.model.getObjectByName(BED_INOUT_OBJECT_NAME)
      if (MriBedInOut) {
        MriBedInOut.add(box)
        box.updateWorldMatrix(true, true)
      }
      box.position.set(0, 0, -80)
      box.scale.setX((this.bodyBoxWidth - 1) / this.bodyBoxDimension.width.max)
      box.scale.setY(this.landmarkToleranceBottomValue / this.bodyBoxDimension.length.max)
      box.scale.setZ((this.bodyBoxHeight - 2) / this.bodyBoxDimension.height.max)
      box.name = 'landmark-tolerance-bottom-box'

      this.updateLandmarkToleranceBoxPosition()
    },
    updateLandmarkToleranceBoxPosition() {
      this.updateLandmarkToleranceTopBoxPosition()
      this.updateLandmarkToleranceBottomBoxPosition()
      this.updateLandmarkToleranceVerticalBoxPosition()
    },
    updateLandmarkToleranceVerticalBoxPosition() {
      if (!this.landmarkToleranceVerticalBox) {
        return
      }
      if (!this.bodyBoxObject || this.isLocalizerBoxMode) {
        this.landmarkToleranceVerticalBox.visible = false
        return
      } else {
        this.landmarkToleranceVerticalBox.visible = this.bodyBoxObject.visible
      }

      this.bodyBoxObject.updateWorldMatrix(true, true)

      this.landmarkToleranceVerticalBox.position.set(
        this.bodyBoxObject.position.x,
        this.bodyBoxObject.position.y,
        this.bodyBoxObject.position.z
      )
    },
    updateLandmarkToleranceTopBoxPosition() {
      if (!this.landmarkToleranceTopBox) {
        return
      }
      if (!this.bodyBoxObject || this.isLocalizerBoxMode) {
        this.landmarkToleranceTopBox.visible = false
        return
      } else {
        this.landmarkToleranceTopBox.visible = this.bodyBoxObject.visible
      }

      this.bodyBoxObject.updateWorldMatrix(true, true)

      //The local position of body box
      const localPosYBodyBox = this.bodyBoxObject.position.y
      const localTopPos =
        this.bodyBoxDirection == 1
          ? // In
            localPosYBodyBox - this.bodyBoxLength / 2
          : //Out
            localPosYBodyBox + this.bodyBoxLength / 2
      const localPosYOfToleranceTopBox = localTopPos

      this.landmarkToleranceTopBox.position.set(
        this.bodyBoxObject.position.x,
        localPosYOfToleranceTopBox,
        this.bodyBoxObject.position.z
      )
    },
    updateLandmarkToleranceBottomBoxPosition() {
      if (!this.landmarkToleranceBottomBox) {
        return
      }
      if (!this.bodyBoxObject || this.isLocalizerBoxMode) {
        this.landmarkToleranceBottomBox.visible = false
        return
      } else {
        this.landmarkToleranceBottomBox.visible = this.bodyBoxObject.visible
      }

      this.bodyBoxObject.updateWorldMatrix(true, true)

      //The local position of body box
      const localPosYBodyBox = this.bodyBoxObject.position.y
      const localBottomPos =
        this.bodyBoxDirection == 1
          ? // In
            localPosYBodyBox + this.bodyBoxLength / 2
          : //Out
            localPosYBodyBox - this.bodyBoxLength / 2
      const localPosYOfToleranceBottomBox = localBottomPos

      this.landmarkToleranceBottomBox.position.set(
        this.bodyBoxObject.position.x,
        localPosYOfToleranceBottomBox,
        this.bodyBoxObject.position.z
      )
    },
    addScanDirectionArrow() {
      if (this.scanDirectionArrow || !this.model) {
        return
      }

      const geometry = new THREE.ConeGeometry(3, 10, 32)
      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })
      const cone = new THREE.Mesh(geometry, material)
      cone.position.setY(15)

      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 30, 32), material)
      // cylinder.rotation.set(0,0,Math.PI/2)
      // cylinder.position.set(0,10,-10)

      const group = new Group()
      group.add(cone, cylinder)
      group.rotation.set(Math.PI / 2, 0, 0)

      group.name = 'scan-direction-arrow'

      this.scene.add(group)
      this.updateScanDirectionArrowPosition()
      this.updateLandmarkToleranceBoxPosition()
    },
    updateScanDirectionArrowPosition() {
      if (!this.scanDirectionArrow) {
        return
      }
      if (!this.bodyBoxObject || this.isLocalizerBoxMode) {
        this.scanDirectionArrow.visible = false
      } else {
        this.scanDirectionArrow.visible = this.bodyBoxObject.visible
      }

      this.bodyBoxObject.updateWorldMatrix(true, true)
      let newCenter = new Vector3()
      new Box3().setFromObject(this.bodyBoxObject).getCenter(newCenter)

      this.scanDirectionArrow.position.copy(newCenter.clone().setY(newCenter.y + +this.bodyBoxHeight / 2 + 10))

      this.scanDirectionArrow.rotation.set(this.bodyBoxDirection == 1 ? -Math.PI / 2 : Math.PI / 2, 0, 0)
    },
    onMoveMRIMachineToLastestPosition() {
      if (this.isSetInitPositionToLandmarkedPosition) {
        this.setMriUpdownAndInOutPosition(this.mriMachineCurrentPosition)
      }
    },
    loadMriMachine() {
      THREE.Cache.enabled = true
      this.isLoading = true
      const gltfLoader = new GLTFLoader()
      const drcLoader = new DRACOLoader()
      drcLoader.setDecoderPath(`/draco/`)
      drcLoader.setDecoderConfig({ type: 'js' })
      gltfLoader.setDRACOLoader(drcLoader)
      try {
        const onLoadModel = (object) => {
          if (object?.scene?.children[0]) {
            if (this.model) {
              if (this.transformControl) {
                this.transformControl.detach()
              }
              this.scene.remove(this.model)
            }

            this.model = object.scene.children[0].clone()
            this.model.scale.set(1, 1, 1)
            const MriBedInOut = this.model.getObjectByName(BED_INOUT_OBJECT_NAME)
            if (MriBedInOut.position.y > MIN_Y_OF_BED) {
              newPos.set(MriBedInOut.position.x, MAX_Y_OF_BED, MriBedInOut.position.z)
              MriBedInOut.position.copy(newPos)
            }
            this.scene.add(this.model)

            // this.addLazeVerticalLine()

            if (this.testRunState != 'LANDMARK') {
              this.toggleLazer(null, false)
            }

            if (this.isBodyBoxEnabled) {
              this.addBox()
            }

            this.addROIBox()

            this.hiddenAllPatientPositions()

            this.handleRotateModel()
            this.onSetupInitBodyBox()
            this.onPreviewPositionChange()

            if (this.isSetInitPositionToLandmarkedPosition) {
              this.setMriUpdownAndInOutPosition(this.mriMachineCurrentPosition)
            } else {
              // this.onMoveToHomePosition()
              if (this.testRunState == 'POSITION') {
                this.onMoveMRIUpdownToLowestPosition()
                this.moveCameraToPositionView()
              }
            }
            if (this.isPreview) {
              this.toggleLazer(null, true)
            }
            this.$emit('onMRILoaded')
          }
          this.isLoading = false
        }

        if (MODELS_CACHE[this.modelFileUrl]) {
          const object = MODELS_CACHE[this.modelFileUrl]
          onLoadModel(object)
        } else {
          gltfLoader.load(this.modelFileUrl, onLoadModel)
        }
      } catch (err) {
        // No action
        console.log('err', err)
        this.isLoading = false
      }
    },
    addLazeVerticalLine() {
      if (!this.scene) {
        return
      }
      const lazeVerticalName = 'LAZE_VERTICAL'
      const lazeVertical = this.scene.getObjectByName(lazeVerticalName)
      if (!lazeVertical) {
        const cylinderMaterial = new MeshStandardMaterial({ color: '#FF0000' })
        const cylinderGeometry = new CylinderGeometry(0.3, 0.3, 200, 32)
        const cylinderZ = new Mesh(cylinderGeometry, cylinderMaterial)
        cylinderZ.position.copy(LAZER_POSITION)
        cylinderZ.rotation.set(Math.PI / 2, 0, 0)
        cylinderZ.name = lazeVerticalName
        cylinderZ.translateY(50)

        this.scene.add(cylinderZ)
      }
    },
    onToggleKeyCode(keyCode) {
      this.keyStates = {
        ...this.keyStates,
        [keyCode]: this.keyStates[keyCode] ? false : this.cursorOnBox && keyCode,
      }
    },
    onActiveKeyCode(keyCode) {
      this.shouldUpdateScanPercent = false
      this.keyStates = {
        ...this.keyStates,
        [keyCode]: true,
      }
    },
    onDeActiveAllKeyCode() {
      this.keyStates = {}
    },
    handleMriMove(delta) {
      if (!this.scene || this.isShowHint || !this.model) {
        return
      }
      if (this.keyStates['ArrowUp']) {
        this.destroyAnimation()
        if (!this.isMriInoutPositionNotModified) {
          return
        }
        const MriBedUpDown = this.scene.getObjectByName(BED_UPDOWN_OBJECT_NAME)
        if (MriBedUpDown.position.z > MIN_Z_OF_BED) {
          newPos.set(MriBedUpDown.position.x, MriBedUpDown.position.y, MriBedUpDown.position.z - 50)
          MriBedUpDown.position.lerp(newPos, delta)
        }

        this.updateScanDirectionArrowPosition()
        this.updateLandmarkToleranceBoxPosition()
        this.enabledMoveButton()
      }
      if (this.keyStates['ArrowDown']) {
        this.destroyAnimation()
        if (!this.isMriInoutPositionNotModified) {
          return
        }
        const MriBedUpDown = this.scene.getObjectByName(BED_UPDOWN_OBJECT_NAME)
        if (MriBedUpDown.position.z < MAX_Z_OF_BED) {
          newPos.set(MriBedUpDown.position.x, MriBedUpDown.position.y, MriBedUpDown.position.z + 50)
          MriBedUpDown.position.lerp(newPos, delta)
        }

        this.updateScanDirectionArrowPosition()
        this.updateLandmarkToleranceBoxPosition()
        this.enabledMoveButton()
      }

      if (this.keyStates['ArrowLeft']) {
        this.destroyAnimation()
        if (!this.isMriUpDownPositionCorrect) {
          return
        }
        const MriBedInOut = this.scene.getObjectByName(BED_INOUT_OBJECT_NAME)
        if (MriBedInOut.position.y > MIN_Y_IN_OUT_OF_BED) {
          newPos.set(MriBedInOut.position.x, MriBedInOut.position.y - 50, MriBedInOut.position.z)
          MriBedInOut.position.lerp(newPos, delta)
        }

        this.updateScanDirectionArrowPosition()
        this.updateLandmarkToleranceBoxPosition()
        this.enabledMoveButton()
      }

      if (this.keyStates['ArrowRight']) {
        this.destroyAnimation()
        if (!this.isMriUpDownPositionCorrect) {
          return
        }
        const MriBedInOut = this.scene.getObjectByName(BED_INOUT_OBJECT_NAME)
        if (MriBedInOut.position.y < MAX_Y_IN_OUT_OF_BED) {
          newPos.set(MriBedInOut.position.x, MriBedInOut.position.y + 50, MriBedInOut.position.z)
          MriBedInOut.position.lerp(newPos, delta)
        }

        this.updateScanDirectionArrowPosition()
        this.updateLandmarkToleranceBoxPosition()
        this.enabledMoveButton()
      }
    },
    enabledMoveButton() {
      this.setIsMovedMRIPositionToCorrectZone(false)
      if (
        this.scanStatus != this.SCAN_STATUS.NO_SCAN &&
        (this.isAcquisitionQuestion || this.isLocalizerQuestion) &&
        !this.isMoveMRIMachineEnabled
      ) {
        this.setIsMoveMRIMachineEnabled(true)
      }
    },
    hiddenAllPatientPositions() {
      if (this.MriBedInOut) {
        this.MriBedInOut.children.forEach((el) => {
          if (el.type === 'Object3D') {
            el.visible = false
          }
        })
      }
    },
    handleRotateModel() {
      if (this.scene) {
        this.hiddenAllPatientPositions()

        const modelName = `${this.patientPositionModelName[this.side1]}_${this.patientPositionModelName[this.side2]}_${
          this.patientPositionModelName[this.side3]
        }`
        const patient = this.scene.getObjectByName(modelName)

        if (patient) {
          patient.visible = true

          const patientOpacity = this.lazeVerticalObject && this.lazeVerticalObject.visible ? 1 : 1
          if (patient.isMesh) {
            patient.material.transparent = true
            patient.material.opacity = patientOpacity
          } else {
            patient.traverse((el) => {
              if (el.isMesh) {
                el.material.transparent = true
                el.material.opacity = patientOpacity
              }
            })
          }
        }

        this.toggleHeadHolder()

        this.addROIBox()

        if (
          !_.some(
            this.availablePositionCombination,
            (el) => el.includes(this.side1) && el.includes(this.side2) && el.includes(this.side3)
          )
        ) {
          Vue.notify({ type: 'error', text: `The 3d model doesn't suppot this position!` })
          return
        }
      }
    },
    toggleHeadHolder() {
      if (!this.scene) {
        return
      }

      // const headHolder = this.scene.getObjectByName('CT_headHolder_headfirst_supine_armsdown')
      // if (headHolder) {
      //   headHolder.visible = this.isShowHeadHolder
      // }
      const modelName = `${this.patientPositionModelName[this.side1]}_${this.patientPositionModelName[this.side2]}_${
        this.patientPositionModelName[this.side3]
      }`
      if (
        !_.some(
          this.availablePositionCombinationHasHeadHolder,
          (el) => el.includes(this.side1) && el.includes(this.side2) && el.includes(this.side3)
        )
      ) {
        this.isShowHeadHolder = false
        return
      }

      const withHeadHolder = this.scene.getObjectByName(modelName)
      const withoutHeadHolder = this.scene.getObjectByName(`${modelName}_no_headholder`)

      if (withHeadHolder) {
        withHeadHolder.visible = this.isShowHeadHolder
      }
      if (withoutHeadHolder) {
        withoutHeadHolder.visible = !this.isShowHeadHolder
      }
    },
    toggleLazer(e, d) {
      ;['SM_laser_top', 'SM_laser_left', 'SM_laser_right', 'LAZE_VERTICAL'].forEach((name) => {
        const obj = this.scene.getObjectByName(name)
        if (obj) {
          if (d !== undefined) {
            obj.visible = d
          } else {
            obj.visible = !obj.visible
          }
        }
      })

      this.handleRotateModel()
    },
    toggleFullScreen() {
      const parent = this.elBox.closest('.mri-machine-container')
      parent.classList.toggle('fullscreen')
      this.onSetSizeOfRenderer()
    },
    onSetSizeOfRenderer() {
      this.renderer.setSize(this.$refs.box.offsetWidth, this.$refs.box.offsetHeight)

      if (this.camera) {
        this.camera.updateWorldMatrix(true, true)
        const cameraMatrix = this.camera.matrixWorld
        this.camera = new THREE.PerspectiveCamera(50, this.elBox.offsetWidth / this.elBox.offsetHeight, 0.1, 100000)
        this.camera.applyMatrix4(cameraMatrix)
        this.camera.updateProjectionMatrix()
        this.camera.aspect =
          this.$refs.box.offsetHeight > 0 ? this.$refs.box.offsetWidth / this.$refs.box.offsetHeight : 1
      }

      if (this.elBox.firstChild) {
        this.elBox.removeChild(this.elBox.firstChild)
      }

      this.initOrbitControl()

      this.$refs.box.appendChild(this.renderer.domElement)
    },
    toggleVisibleLazer(visvile) {
      ;['SM_laser_top', 'SM_laser_left', 'SM_laser_right', 'LAZE_VERTICAL'].forEach((name) => {
        const obj = this.scene.getObjectByName(name)
        if (obj) {
          obj.visible = visvile
        }
      })

      this.handleRotateModel()
    },
    updateBodyBoxSize(width, lenght, height) {
      if (this.scene) {
        const bodyBox = this.scene.getObjectByName('body-box')
        if (bodyBox) {
          bodyBox.scale.setY(lenght / this.bodyBoxDimension.length.max)
          bodyBox.scale.setX(width / this.bodyBoxDimension.width.max)
          bodyBox.scale.setZ(height / this.bodyBoxDimension.height.max)
        }
        this.afterBodyBoxChange()
        this.updateScanDirectionArrowPosition()
      }
    },
    updateLandmarkToleranceTopBoxSize(width, lenght, height) {
      if (this.scene && this.landmarkToleranceTopBox) {
        this.landmarkToleranceTopBox.scale.setY(lenght / this.bodyBoxDimension.length.max)
        this.landmarkToleranceTopBox.scale.setX((width - 2) / this.bodyBoxDimension.width.max)
        this.landmarkToleranceTopBox.scale.setZ((height - 2) / this.bodyBoxDimension.height.max)
        this.updateLandmarkToleranceBoxPosition()
      }
    },
    updateLandmarkToleranceBottomBoxSize(width, lenght, height) {
      if (this.scene && this.landmarkToleranceBottomBox) {
        this.landmarkToleranceBottomBox.scale.setY(lenght / this.bodyBoxDimension.length.max)
        this.landmarkToleranceBottomBox.scale.setX((width - 2) / this.bodyBoxDimension.width.max)
        this.landmarkToleranceBottomBox.scale.setZ((height - 2) / this.bodyBoxDimension.height.max)
        this.updateLandmarkToleranceBoxPosition()
      }
    },
    updateLandmarkToleranceVerticalBoxSize(width, lenght, height) {
      if (this.scene && this.landmarkToleranceVerticalBox) {
        this.landmarkToleranceVerticalBox.scale.setY((lenght - 1) / this.bodyBoxDimension.length.max)
        this.landmarkToleranceVerticalBox.scale.setX((width - 1) / this.bodyBoxDimension.width.max)
        this.landmarkToleranceVerticalBox.scale.setZ(height / this.bodyBoxDimension.height.max)
        this.updateLandmarkToleranceBoxPosition()
      }
    },
    updateBodyBoxVisibility(visible, editMode) {
      if (this.bodyBoxObject) {
        this.bodyBoxObject.visible = visible

        if (editMode === 'none') {
          this.bodyBoxTransformControl.visible = false
        } else if (editMode === 'new') {
          this.bodyBoxTransformControl.visible = true
          this.bodyBoxObject.material.color = new THREE.Color('red')
        } else if (editMode === 'view') {
          this.bodyBoxTransformControl.visible = false
          this.bodyBoxObject.material.color = new THREE.Color('blue')
        } else if (editMode === 'edit') {
          this.bodyBoxTransformControl.visible = true
          this.bodyBoxObject.material.color = new THREE.Color('red')
        }

        this.updateScanDirectionArrowPosition()
        this.updateLandmarkToleranceBoxPosition()
      }
    },
    getPatientPositionInfo() {
      const bodyBox = this.scene.getObjectByName('body-box')
      if (this.MriBedInOut && this.MriUpDownObject && bodyBox) {
        let pos = bodyBox.position.clone()
        return {
          x: pos.x,
          y: pos.y,
          z: pos.z,
          width: this.bodyBoxWidth,
          height: this.bodyBoxHeight,
          length: this.bodyBoxLength,
          bodyBoxDirection: this.bodyBoxDirection,
          mriUpDownPositionY: this.MriUpDownObject.getWorldPosition(new Vector3()).y,
          landmarkTolerance: this.landmarkToleranceTopValue,
          landmarkToleranceBottom: this.landmarkToleranceBottomValue,
          landmarkToleranceVertical: this.landmarkToleranceVerticalValue,
        }
      } else {
        return {
          x: 0,
          y: 0,
          z: -80,
          width: this.bodyBoxWidth,
          height: this.bodyBoxHeight,
          length: this.bodyBoxLength,
          bodyBoxDirection: this.bodyBoxDirection,
          mriUpDownPositionY: 0,
          landmarkTolerance: this.landmarkToleranceTopValue,
          landmarkToleranceBottom: this.landmarkToleranceBottomValue,
          landmarkToleranceVertical: this.landmarkToleranceVerticalValue,
        }
      }
    },
    getPatientPositionLocalizerBoxInfo() {
      const bodyBox = this.scene.getObjectByName('body-box')
      if (this.MriBedInOut && this.MriUpDownObject && bodyBox) {
        let pos = bodyBox.position.clone()
        return {
          x: Math.round(pos.x),
          y: Math.round(pos.y),
          z: Math.round(pos.z),
          length: this.bodyBoxLength,
          mriUpDownPositionY: this.MriUpDownObject.getWorldPosition(new Vector3()).y,
        }
      } else {
        return {
          x: 0,
          y: 0,
          z: -80,
          length: this.bodyBoxLength,
          mriUpDownPositionY: 0,
        }
      }
    },
    async onConfirmPosition() {
      const info = this.currentSavedPatientPosition
      if (this.firstSelectedPatientPosition === null) {
        this.setFirstSelectedPatientPosition({
          side1: this.patientDirectionSide1,
          side2: this.patientDirectionSide2,
          side3: this.patientDirectionSide3,
          headHolder: this.isMRIShowHeadHolder,
        })
        if (info) this.isPositionRight = true
        await this.takeScreenShot()
      }

      if (!_.get(info, ['bodyBox'], null)) {
        Vue.notify({ type: 'warning', text: `Body box isn't set up for this patient position!` })
        this.$root.$emit('bv::show::modal', 'modal-patient-position-info')
        return
      }

      if (info) {
        //this.isPositionRight = true
        // Vue.notify({ type: 'success', text: 'Patient position is correct!' })
        this.setSubmittedPatientPosition({
          side1: this.patientDirectionSide1,
          side2: this.patientDirectionSide2,
          side3: this.patientDirectionSide3,
          headHolder: this.isMRIShowHeadHolder,
        })
      } else {
        //this.isPositionRight = false
        // Show info
        // Vue.notify({ type: 'warning', text: `Patient position is wrong!` })
        this.$root.$emit('bv::show::modal', 'modal-patient-position-info')
      }
      this.isConfirmPosition = true
      this.$emit('onConfirmPosition')
    },
    async onConfirmLandmark() {
      await this.takeScreenShot()
      let landmarkDistanceRatioValue = -1
      // Horizontal tolerance
      let landmarkDistanceSI = -100
      let landmarkDistanceAP = -100

      if (this.MriBedInOut) {
        const worldposition = this.MriBedInOut.getWorldPosition(new Vector3())
        this.setLandmarked3dPoint(worldposition)
      }

      const info = this.currentSavedPatientPosition
      if (info) {
        if (!info.bodyBox) {
          this.isLandMarkRight = false
          this.isConfirmLandmark = true
          this.$emit('onConfirmLandMark')
          this.setLandmarkDistanceRatio(landmarkDistanceRatioValue)
          this.setLandmarkDistanceSI(landmarkDistanceSI)
          this.setLandmarkDistanceAP(landmarkDistanceAP)
          return
        }
        // 1: bed move in, 2: bed move out
        const bodyBoxDirection = _.get(info, ['bodyBox', 'bodyBoxDirection'], 1)

        if (info.bodyBox) {
          this.addBox()
          this.setBodyBox(info.bodyBox)
          this.updateBodyBoxVisibility(false, 'view')
          if (this.transformControl) {
            this.transformControl.detach()
          }
        } else {
          this.removeBox()
          if (this.transformControl) {
            this.transformControl.detach()
          }
        }

        if (!this.bodyBoxObject) {
          this.isLandMarkRight = false
          this.isConfirmLandmark = true
          this.$emit('onConfirmLandMark')
          this.setLandmarkDistanceRatio(landmarkDistanceRatioValue)
          this.setLandmarkDistanceSI(landmarkDistanceSI)
          this.setLandmarkDistanceAP(landmarkDistanceAP)
          return
        }

        this.bodyBoxObject.updateWorldMatrix(true, true)
        let newCenter = new Vector3()
        new Box3().setFromObject(this.bodyBoxObject).getCenter(newCenter)

        if (this.isBodyBoxSameDirWithCtScan) {
          const topPosZOfBodyBox =
            bodyBoxDirection == 1
              ? newCenter.clone().setZ(newCenter.z - this.bodyBoxLength / 2).z
              : newCenter.clone().setZ(newCenter.z + this.bodyBoxLength / 2).z

          const landmarkToleranceTop = _.get(info, ['bodyBox', 'landmarkTolerance'], 5)
          const minRangeOfToleranceTopBox = topPosZOfBodyBox - landmarkToleranceTop / 2
          const maxRangeOfToleranceTopBox = topPosZOfBodyBox + landmarkToleranceTop / 2

          if (LAZER_POSITION.z >= minRangeOfToleranceTopBox && LAZER_POSITION.z <= maxRangeOfToleranceTopBox) {
            this.setLandmarkDistanceRatio(0)
            this.setLandmarkDistanceSI(0)

            this.isLandMarkRight = true
          } else {
            this.isLandMarkRight = false

            const distance = Math.min(
              new Vector3(0, 0, LAZER_POSITION.z).distanceTo(new Vector3(0, 0, minRangeOfToleranceTopBox)),
              new Vector3(0, 0, LAZER_POSITION.z).distanceTo(new Vector3(0, 0, maxRangeOfToleranceTopBox))
            )

            landmarkDistanceRatioValue = Math.ceil(((distance / landmarkToleranceTop) * 100) / 20)
            this.setLandmarkDistanceRatio(landmarkDistanceRatioValue)
            // bias > 0 - The landmark point is far from the bodyBox
            // bias < 0 - The landmark point is cross all the bodyBox
            let bias = 1
            // Box direction -Z
            if (bodyBoxDirection == 1 && LAZER_POSITION.z > maxRangeOfToleranceTopBox) {
              bias = -1
            }
            // Box direction -Z
            else if (bodyBoxDirection == 2 && LAZER_POSITION.z < minRangeOfToleranceTopBox) {
              bias = -1
            }

            landmarkDistanceSI = bias * distance
            this.setLandmarkDistanceSI(landmarkDistanceSI)
          }

          if (bodyBoxDirection == 1) {
            // In
            this.setScanPercentStartOfLandmark(((LAZER_POSITION.z - topPosZOfBodyBox) / this.bodyBoxLength) * 100)
          } else {
            // Out
            this.setScanPercentStartOfLandmark(((topPosZOfBodyBox - LAZER_POSITION.z) / this.bodyBoxLength) * 100)
          }
        } else {
          const bottomPosZOfBodyBox =
            bodyBoxDirection == 1
              ? newCenter.clone().setZ(newCenter.z + this.bodyBoxLength / 2).z
              : newCenter.clone().setZ(newCenter.z - this.bodyBoxLength / 2).z

          const landmarkToleranceBottom = _.get(info, ['bodyBox', 'landmarkToleranceBottom'], 5)
          const minRangeOfToleranceBottomBox = bottomPosZOfBodyBox - landmarkToleranceBottom / 2
          const maxRangeOfToleranceBottomBox = bottomPosZOfBodyBox + landmarkToleranceBottom / 2

          if (LAZER_POSITION.z >= minRangeOfToleranceBottomBox && LAZER_POSITION.z <= maxRangeOfToleranceBottomBox) {
            this.setLandmarkDistanceRatio(0)
            this.setLandmarkDistanceSI(0)

            this.isLandMarkRight = true
          } else {
            this.isLandMarkRight = false

            const distance = Math.min(
              new Vector3(0, 0, LAZER_POSITION.z).distanceTo(new Vector3(0, 0, minRangeOfToleranceBottomBox)),
              new Vector3(0, 0, LAZER_POSITION.z).distanceTo(new Vector3(0, 0, maxRangeOfToleranceBottomBox))
            )

            landmarkDistanceRatioValue = Math.ceil(((distance / landmarkToleranceBottom) * 100) / 20)
            this.setLandmarkDistanceRatio(landmarkDistanceRatioValue)
            // bias > 0 - The landmark point is far from the bodyBox
            // bias < 0 - The landmark point is cross all the bodyBox
            let bias = 1
            // Box direction -Z
            if (bodyBoxDirection == 1 && LAZER_POSITION.z < minRangeOfToleranceBottomBox) {
              bias = -1
            }
            // Box direction -Z
            else if (bodyBoxDirection == 2 && LAZER_POSITION.z > maxRangeOfToleranceBottomBox) {
              bias = -1
            }
            landmarkDistanceSI = bias * distance
            this.setLandmarkDistanceSI(landmarkDistanceSI)
          }
          if (bodyBoxDirection == 1) {
            // Out
            this.setScanPercentStartOfLandmark(((bottomPosZOfBodyBox - LAZER_POSITION.z) / this.bodyBoxLength) * 100)
          } else {
            // Int
            this.setScanPercentStartOfLandmark(((LAZER_POSITION.z - bottomPosZOfBodyBox) / this.bodyBoxLength) * 100)
          }
        }

        const landmarkToleranceVertical = _.get(info, ['bodyBox', 'landmarkToleranceVertical'], 1)
        const minRangeOfToleranceVerticalBox = newCenter.y - landmarkToleranceVertical / 2
        const maxRangeOfToleranceVerticalBox = newCenter.y + landmarkToleranceVertical / 2

        if (LAZER_POSITION.y >= minRangeOfToleranceVerticalBox && LAZER_POSITION.y <= maxRangeOfToleranceVerticalBox) {
          this.setLandmarkDistanceAP(0)
        } else {
          const distance = Math.min(
            new Vector3(0, LAZER_POSITION.y, 0).distanceTo(new Vector3(0, minRangeOfToleranceVerticalBox, 0)),
            new Vector3(0, LAZER_POSITION.y, 0).distanceTo(new Vector3(0, maxRangeOfToleranceVerticalBox, 0))
          )
          // bias > 0 - The landmark point is higher the tolerance range
          // bias < 0 - The landmark point is lower the tolerance range
          let bias = 1
          if (LAZER_POSITION.y < minRangeOfToleranceVerticalBox) {
            bias = -1
          }
          landmarkDistanceAP = bias * distance
          this.setLandmarkDistanceAP(landmarkDistanceAP)
        }
      } else {
        this.isLandMarkRight = false
        this.setLandmarkDistanceRatio(landmarkDistanceRatioValue)
        this.setLandmarkDistanceSI(landmarkDistanceSI)
        this.setLandmarkDistanceAP(landmarkDistanceAP)
        // Show info
      }
      this.isConfirmLandmark = true
      this.$emit('onConfirmLandMark')
    },
    cancelMoveMriUpDownToLandmarkPoint() {
      if (this.currentInOutAnimation) {
        this.currentInOutAnimation.kill()
        this.currentInOutAnimation = null
        this.setIsMovingMRIMachine(false)
      }
    },
    moveMriUpDownToLandmarkPoint() {
      if (!this.isHandleMoveToLandmarkEvent) {
        return
      }
      const info = this.currentSavedPatientPosition
      if (info && info.bodyBox) {
        this.addBox()
        this.setBodyBox(info.bodyBox)
        this.updateBodyBoxVisibility(false, 'view')
        if (this.transformControl) {
          this.transformControl.detach()
        }

        if (this.MriBedInOut && this.MriUpDownObject && this.bodyBoxObject) {
          this.bodyBoxObject.updateWorldMatrix(true, true)
          this.MriUpDownObject.updateWorldMatrix(true, true)

          const worldPosition = this.MriBedInOut.getWorldPosition(new Vector3())
          const distanceZ = this.landmarked3dPoint.z - 30 - worldPosition.z // 30 is distance from lazer to black scan area

          if (this.currentInOutAnimation) {
            this.currentInOutAnimation.kill()
            this.currentInOutAnimation = null
          }

          let duration = Math.abs(distanceZ) / 15
          if (duration > this.MAXIMUM_DURATION_OF_MOVING_MRI_MACHINE) {
            duration = this.MAXIMUM_DURATION_OF_MOVING_MRI_MACHINE
          }
          this.setIsMovedMRIPositionToCorrectZone(false)
          this.currentInOutAnimation = gsap.to(this.MriBedInOut.position, {
            y: this.MriBedInOut.position.y + distanceZ,
            // Duration in setInterval auto play slice in SliceView
            duration: duration,
            ease: 'none',
            onUpdate: () => {
              this.updateScanDirectionArrowPosition()
              this.updateLandmarkToleranceBoxPosition()
            },
            onComplete: () => {
              this.setIsMovingMRIMachine(false)
              this.setIsMRIMachineMoved(true)
              this.setIsMoveMRIMachineEnabled(false)
              EventBus.$emit('onMoveMriModelToBodyBoxEnd')
              this.setMriMachineCurrentPos()
            },
          })
        } else {
          this.setIsMovingMRIMachine(false)
          this.setIsMRIMachineMoved(true)
          this.setIsMoveMRIMachineEnabled(false)
          EventBus.$emit('onMoveMriModelToBodyBoxEnd')
        }
      } else {
        // Show info
        Vue.notify({ type: 'warning', text: `Body box isn't set up for this patient position!` })
        this.setIsMovingMRIMachine(false)
        this.setIsMRIMachineMoved(true)
        this.setIsMoveMRIMachineEnabled(false)
        EventBus.$emit('onMoveMriModelToBodyBoxEnd')
        return
      }
    },
    moveMriUpDownToTopOfBodyBox() {
      const info = this.currentSavedPatientPosition
      if (info && info.bodyBox) {
        this.addBox()
        this.setBodyBox(info.bodyBox)
        this.updateBodyBoxVisibility(false, 'view')
        if (this.transformControl) {
          this.transformControl.detach()
        }

        if (this.MriBedInOut && this.MriUpDownObject && this.bodyBoxObject) {
          this.bodyBoxObject.updateWorldMatrix(true, true)
          this.MriUpDownObject.updateWorldMatrix(true, true)
          let newCenter = new Vector3()
          new Box3().setFromObject(this.bodyBoxObject).getCenter(newCenter)

          const bodyBoxDirection = _.get(info, ['bodyBox', 'bodyBoxDirection'], 1)
          const topPosZOfBodyBox =
            (bodyBoxDirection == 1 && this.ctScanDirection == 1) || (bodyBoxDirection == 2 && this.ctScanDirection == 2)
              ? newCenter.clone().setZ(newCenter.z - this.bodyBoxLength / 2).z
              : newCenter.clone().setZ(newCenter.z + this.bodyBoxLength / 2).z

          const distanceZ = topPosZOfBodyBox - SCAN_AREA_POSITION.z

          const mriUpDownPositionY = _.get(info.bodyBox, ['mriUpDownPositionY'], 0)
          const currentUpDownPositionY = this.MriUpDownObject.getWorldPosition(new Vector3()).y
          const distanceY = currentUpDownPositionY - mriUpDownPositionY
          const maxDistance = Math.max(Math.abs(distanceY), Math.abs(distanceZ))

          let duration = maxDistance / 15
          if (duration > this.MAXIMUM_DURATION_OF_MOVING_MRI_MACHINE) {
            duration = this.MAXIMUM_DURATION_OF_MOVING_MRI_MACHINE
          }

          this.setIsMovedMRIPositionToCorrectZone(false)
          this.currentInOutAnimation = gsap.to(this.MriBedInOut.position, {
            y: this.MriBedInOut.position.y - distanceZ,
            // Duration in setInterval auto play slice in SliceView
            duration: duration,
            ease: 'none',
            onUpdate: () => {
              this.updateScanDirectionArrowPosition()
              this.updateLandmarkToleranceBoxPosition()
            },
            onComplete: () => {
              this.setIsMovingMRIMachine(false)
              this.setMriMachineCurrentPos()
            },
          })
          // Don't move Y
          // this.currentUpDownAnimation = gsap.to(this.MriUpDownObject.position, {
          //   z: this.MriUpDownObject.position.z + distanceY,
          //   // Duration in setInterval auto play slice in SliceView
          //   duration: maxDistance / 15,
          //   ease: 'none',
          // })
        } else {
          this.setIsMovingMRIMachine(false)
        }
      } else {
        // Show info
        Vue.notify({ type: 'warning', text: `Body box isn't set up for this patient position!` })
        this.setIsMovingMRIMachine(false)
        return
      }
    },
    setBodyBox(boxInfo) {
      const { x, y, z, width, length, height } = boxInfo
      this.bodyBoxDirection = _.get(boxInfo, 'bodyBoxDirection', 1)
      this.landmarkToleranceTopValue = _.get(boxInfo, 'landmarkTolerance', 5)
      this.landmarkToleranceBottomValue = _.get(boxInfo, 'landmarkToleranceBottom', 5)
      this.landmarkToleranceVerticalValue = _.get(boxInfo, 'landmarkToleranceVertical', 5)
      this.bodyBoxWidth = width || 50
      this.bodyBoxLength = length
      this.bodyBoxHeight = height || 20
      let pos = new Vector3(x, y, z)
      const bodyBox = this.scene.getObjectByName('body-box')
      if (bodyBox) {
        bodyBox.position.copy(pos)
      }

      this.updateScanDirectionArrowPosition()
      this.updateLandmarkToleranceBoxPosition()
    },
    setPatientPosition(patientPosition, showHeadHolder = false) {
      if (patientPosition) {
        if (patientPosition.includes(this.patientPositionTexts.HEAD_FIRST)) {
          this.side1 = this.patientPositionTexts.HEAD_FIRST
        } else {
          this.side1 = this.patientPositionTexts.FEET_FIRST
        }

        if (
          patientPosition.includes(this.patientPositionTexts.SUPINE) &&
          patientPosition.includes(this.patientPositionTexts.ARMS_UP)
        ) {
          this.side2 = this.patientPositionTexts.SUPINE
          this.side3 = this.patientPositionTexts.ARMS_UP
        } else if (
          patientPosition.includes(this.patientPositionTexts.PRONE) &&
          patientPosition.includes(this.patientPositionTexts.ARMS_UP)
        ) {
          this.side2 = this.patientPositionTexts.PRONE
          this.side3 = this.patientPositionTexts.ARMS_UP
        } else if (
          patientPosition.includes(this.patientPositionTexts.SUPINE) &&
          patientPosition.includes(this.patientPositionTexts.ARMS_DOWN)
        ) {
          this.side2 = this.patientPositionTexts.SUPINE
          this.side3 = this.patientPositionTexts.ARMS_DOWN
        } else if (
          patientPosition.includes(this.patientPositionTexts.SUPINE) &&
          patientPosition.includes(this.patientPositionTexts.SUPERMAN_POSITION)
        ) {
          this.side2 = this.patientPositionTexts.SUPINE
          this.side3 = this.patientPositionTexts.SUPERMAN_POSITION
        } else if (
          patientPosition.includes(this.patientPositionTexts.PRONE) &&
          patientPosition.includes(this.patientPositionTexts.SUPERMAN_POSITION)
        ) {
          this.side2 = this.patientPositionTexts.PRONE
          this.side3 = this.patientPositionTexts.SUPERMAN_POSITION
        } else if (
          patientPosition.includes(this.patientPositionTexts.PRONE) &&
          patientPosition.includes(this.patientPositionTexts.ARMS_DOWN)
        ) {
          this.side2 = this.patientPositionTexts.PRONE
          this.side3 = this.patientPositionTexts.ARMS_DOWN
        }
      }

      this.isShowHeadHolder = showHeadHolder
    },
    changeDirection() {
      if (this.bodyBoxDirection === 1) {
        this.bodyBoxDirection = 2
      } else {
        this.bodyBoxDirection = 1
      }
    },
    getMriMachinePos() {
      let mriUpDownPositionY = 0
      let mriInOutPositionZ = 0
      if (this.MriUpDownObject && this.MriBedInOut) {
        this.MriUpDownObject.updateWorldMatrix(true, true)
        this.MriBedInOut.updateWorldMatrix(true, true)
        mriUpDownPositionY = this.MriUpDownObject.getWorldPosition(new Vector3()).y
        mriInOutPositionZ = this.MriBedInOut.getWorldPosition(new Vector3()).z
      }

      return { mriUpDownPositionY, mriInOutPositionZ }
    },
    setMriMachineCurrentPos() {
      const { mriUpDownPositionY, mriInOutPositionZ } = this.getMriMachinePos()
      this.setMriMachineCurrentPosition({ mriUpDownPositionY, mriInOutPositionZ })
    },
    async takeScreenShot() {
      if (this.testRunState === 'POSITION') {
        const imgData = this.renderer.domElement.toDataURL('image/jpeg')
        await this.setPositionScreenshot(imgData)
      } else if (this.testRunState === 'LANDMARK') {
        const { mriUpDownPositionY, mriInOutPositionZ } = this.getMriMachinePos()
        await this.setMriMachineLanmarkedPosition({ mriUpDownPositionY, mriInOutPositionZ })
      }
    },
  },
}
</script>
<style lang="scss">
.btn-move-to-home-posiiton {
  position: absolute;
  top: 0px;
  right: 0px;
  padding: 6px 12px;
  background: #247ba0;
}

.body-box-controls {
  .spin-btn-grp {
    border: solid 1px rgb(177, 177, 177);
    border-radius: 4px;
    width: 80px;
    background: #ffffff;
  }

  .text-mouse-legend {
    font-size: 12px;
  }
}

.checkbox-head-holder-container {
  .v-input--checkbox {
    margin-top: 0;

    .v-input__slot {
      align-items: center;

      .v-label {
        margin-bottom: 0;
      }
    }
  }
}

.body-box-controls-group {
  display: grid;
  grid-template-columns: 60px 1fr;
}

.body-box-localizer-controls-group {
  display: grid;
  grid-template-columns: 50px 1fr;
}

.group-scan-dir {
  background: transparent;
  height: 28px;
  width: 100%;
  flex: auto;
  bottom: 0;

  .v-input--radio-group__input {
    flex-direction: row;
    gap: 16px;

    .v-label {
      margin-bottom: 0;
    }

    .v-radio {
      margin-bottom: 0 !important;
    }
  }

  .btn-change-direction {
    &:disabled {
      background: #d2d2d2 !important;
      pointer-events: none;
    }
  }
}

.group-edit-scan-dir {
  background: transparent;
  height: 28px;
  width: fit-content;
  flex: auto;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  position: absolute;

  .v-input--radio-group__input {
    flex-direction: row;
    gap: 16px;

    .v-label {
      margin-bottom: 0;
    }

    .v-radio {
      margin-bottom: 0 !important;
    }
  }
}
</style>
<style lang="scss" scoped>
.mri-machine-container-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  background: rgba($color: #ffffff, $alpha: 0.5);
  backdrop-filter: blur(4px);
}

.btn-machine-view {
  &:disabled {
    pointer-events: none;
    opacity: 0.3;
  }
}

.mri-machine-container {
  width: 100%;
  height: 100%;
  position: relative;
  user-select: none;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000 !important;
  }

  .box {
    position: absolute;
    background: gainsboro;
    height: 100%;
    width: 100%;

    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
    }
  }

  .key-action-control-board {
    position: absolute;
    right: 24px;
    top: 24px;
    z-index: 2;

    display: grid;
    grid-template-columns: 50px 50px 50px;
    gap: 12px;

    button {
      background: #ffffff;

      &:active {
        background: #247ba0;
        color: #ffffff;
      }

      &:disabled {
        pointer-events: none;
        opacity: 0.5;
      }
    }

    .btn-up-down {
      position: relative;
      top: -16px;
    }
  }

  .bottom-right-action-control-board {
    position: absolute;
    right: 24px;
    z-index: 2;
    bottom: 12px;
  }

  .body-box-controls {
    position: absolute;
    left: 24px;
    bottom: 12px;
    z-index: 2;

    //

    input {
      padding: 2px;
      outline: none !important;
      background: #ffffff;
      border: solid 1px #000000;
      border-radius: 2px;
    }

    button {
      background: rgba($color: #000000, $alpha: 0.1);
      width: 100%;
      background: #ffffff;
      padding: 0 5px !important;
      border-radius: 2px;

      &:active {
        background: #247ba0;
        color: #ffffff;
      }

      &.active {
        background: #247ba0;
        color: #ffffff;
      }
    }
  }

  .float-button-container {
    position: absolute;

    .float-button {
      background: #ffffff;
      padding: 0 10px;

      &:active {
        background: #247ba0;
        color: #ffffff;
      }
    }
  }

  .top-right-action-control-board {
    position: absolute;
    right: 24px;
    top: 12px;
    z-index: 2;

    display: flex;
    gap: 10px;

    .group-control-three-column {
      display: grid;
      grid-template-columns: 100px 65px 100px;
      gap: 4px;
    }

    .group-control {
      display: grid;
      grid-template-columns: 100px 65px;
      gap: 4px;
    }

    button {
      background: #ffffff;
      width: 100%;

      &:active {
        background: #247ba0;
        color: #ffffff;
      }

      &.active {
        background: #247ba0;
        color: #ffffff;
      }
    }
  }

  .zoom-action-control-board {
    position: absolute;
    left: 24px;
    top: 12px;
    z-index: 2;

    display: flex;
    flex-direction: column;
    gap: 4px;

    button {
      width: 36px;
      background: #ffffff;
    }
  }
}

#modal-patient-position-info {
  .patient-position-item {
    cursor: pointer;
    &:hover {
      background: #f0f0f0;
    }
  }
}
</style>
