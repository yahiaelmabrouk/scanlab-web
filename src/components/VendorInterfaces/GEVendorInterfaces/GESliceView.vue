<template>
  <div
    @click="emitSelectedViewOrientation"
    :class="
      vendorStylePreference == 'ge'
        ? forScanning
          ? 'mr-1 ml-1 box-holder main-forscanning'
          : 'mr-1 ml-1 box-holder'
        : 'mr-0 ml-0 box-holder xa-box'
    "
    style="height: 100%"
  >
    <div :class="amFullscreen ? 'fullscreen' : ''" oncontextmenu="return false;" style="height: 100%">
      <v-select
        outlined
        dense
        hide-details
        :class="
          vendorStylePreference !== 'ge' ? ' rounded-0  mr-0 ml-0 xa-class' : ' rounded-0 stack-config text-h6 pb-1'
        "
        :items="stackConfigOptions"
        item-text="text"
        item-value="value"
        v-if="showStackSelection && !isFullscreen"
        v-model="stackConfig"
        @change="setRenamingStackConfigLabel"
        :disabled="
          isCTLab &&
          !isComplete &&
          (isPlayingTheSlices ||
            (canGoToNextStep &&
              !(selectedStackQuestionIndex >= stackQuestions.length - 1) &&
              scanStatus == scanStatuses.SCANNED) ||
            (scanStatus == scanStatuses.SCANNED && selectedStackQuestionIndex >= stackQuestions.length - 1))
        "
      >
      </v-select>
      <v-row cols="12" align="center" justify="space-between" class="m-1 d-flex" v-if="isFullscreen">
        <v-col cols="4">
          <v-select
            outlined
            dense
            hide-details
            class="rounded-0 stack-config"
            :items="stackConfigOptions"
            item-text="text"
            item-value="value"
            v-if="showStackSelection"
            v-model="stackConfig"
            @change="setRenamingStackConfigLabel"
            :disabled="
              isCTLab &&
              !isComplete &&
              (isPlayingTheSlices ||
                (canGoToNextStep &&
                  !(selectedStackQuestionIndex >= stackQuestions.length - 1) &&
                  scanStatus == scanStatuses.SCANNED) ||
                (scanStatus == scanStatuses.SCANNED && selectedStackQuestionIndex >= stackQuestions.length - 1))
            "
          >
          </v-select>
        </v-col>
        <v-col col="4" class="d-flex align-center">
          <span>{{ $t('global.dot_size') }}</span>
          <!-- <v-slider
          class="dot-size-slider"
          v-model.number="dotScaleMultiplierIndex"
          :min="0"
          :max="dotScaleValues.length - 1"
          ticks
        >
        </v-slider> -->
        </v-col>
        <v-col col="2">
          <section class="view-option d-flex align-center">
            <span>{{ $t('global.reference_lines') }}</span>
            <div
              class="scanlab-toggle ml-2"
              :v-model="toggleReferenceLines"
              @click="toggleReferenceLines = !toggleReferenceLines"
            >
              <span :class="{ on: true, active: toggleReferenceLines }">
                {{ $t('global.on') }}
              </span>
              <span :class="{ off: true, active: !toggleReferenceLines }">
                {{ $t('global.off') }}
              </span>
            </div>
          </section>
        </v-col>
        <v-col col="2">
          <section class="view-option d-flex align-center" v-if="testToggles.length > 0">
            <span>{{ $t('MRI.display_slices') }}</span>
            <div class="scanlab-toggle ml-2" :v-model="testToggles[0][0].visible" @click="toggleSlider()">
              <span :class="{ on: true, active: testToggles[0][0].visible }">
                {{ $t('global.on') }}
              </span>
              <span :class="{ off: true, active: !testToggles[0][0].visible }">
                {{ $t('global.off') }}
              </span>
            </div>
          </section>
        </v-col>
      </v-row>
      <div class="mb-1 d-flex align-items-center" v-if="showStackSelection && editable && renamingStackConfigLabel">
        <span class="pl-1 pr-2">{{ renamingStackConfigLabel.key }}</span>
        <v-text-field
          v-model="renamingStackConfigLabel.value"
          class="rounded-0 mt-1"
          dense
          clearable
          outlined
          hide-details
          @blur="saveStackConfigLabel"
        ></v-text-field>
      </div>
      <div :class="forScanning ? 'box-container box-forscanning' : 'box-container'">
        <div class="fullscreen-only-toolbar" v-if="amFullscreen">
          <v-row cols="12" align="center" justify="space-between" class="m-1 d-flex">
            <v-col col="6">
              <GESliceViewToolbar :disabled-tools="disabledTools" />
            </v-col>
            <v-col col="2" v-if="!isAcquisitionQuestion && !isReconstructionQuestion">
              <section class="view-option">
                <v-btn-toggle v-model="isVolumeViewMode" dense mandatory>
                  <v-btn :value="false">
                    <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                    <span class="hidden-sm-and-down">{{ $t('MRI.slice_view', languageCode) }}</span>
                  </v-btn>

                  <v-btn :value="true">
                    <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                    <span class="hidden-sm-and-down">{{ $t('MRI.volume_view', languageCode) }}</span>
                  </v-btn>
                </v-btn-toggle>
              </section>
            </v-col>
            <v-col col="1" v-if="!isCTLab">
              <v-btn tile outlined class="no-transform bold" color="buttonBlue" @click="smartRotateSelectionConfigDir">
                <span>{{ $t('MRI.swap_phase', languageCode) }}</span>
              </v-btn>
            </v-col>
            <v-col col="3" class="d-flex justify-end">
              <div class="mr-1">
                <v-menu v-if="!isAcquisitionQuestion">
                  <template #activator="{ on }">
                    <v-btn tile outlined class="no-transform bold" color="buttonBlue" v-on="on">
                      <span>{{ $t('global.reset', languageCode) }}</span>
                      <v-icon small>keyboard_arrow_down</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="resetSelection({ index: 0, dirOnly: true })">
                      <v-list-item-title>{{ $t('global.axial', languageCode) }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="resetSelection({ index: 1, dirOnly: true })">
                      <v-list-item-title>{{ $t('global.coronal', languageCode) }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="resetSelection({ index: 2, dirOnly: true })">
                      <v-list-item-title>{{ $t('global.sagittal', languageCode) }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
              <ScanButton :freebie="stackQuestion && stackQuestion.freebie" :small="true" />
            </v-col>
          </v-row>
        </div>
        <div class="inner-box-container">
          <div
            ref="box"
            class="box"
            @dblclick="onDoubleClick"
            @mousedown="mouseDown"
            @mouseup="mouseUp"
            @mousemove="mouseMove"
            @touchstart="touchDown"
            @touchmove="touchMove"
            @touchend="touchUp"
            @mousewheel.prevent="onMouseWheel"
            @mouseenter="cursorOnBox = true"
            @mouseleave="cursorOnBox = false"
          ></div>
          <v-btn
            icon
            large
            color="buttonBlue"
            class="left-center clickable in-box-control"
            v-if="isFullscreen"
            @click="changeFrameByArrowIcon(-1)"
          >
            <v-icon size="80">mdi-menu-left</v-icon>
          </v-btn>
          <v-btn
            icon
            larg
            color="buttonBlue"
            class="right-center clickable in-box-control"
            v-if="isFullscreen"
            @click="changeFrameByArrowIcon(1)"
          >
            <v-icon size="80">mdi-menu-right</v-icon>
          </v-btn>
          <v-btn text hidden v-shortkey.once="['arrowleft']" @shortkey="amFullscreen && changeFrameByArrowIcon(-1)">
          </v-btn>
          <v-btn text hidden v-shortkey.once="['arrowright']" @shortkey="amFullscreen && changeFrameByArrowIcon(1)">
          </v-btn>
          <p class="orientation label-left">{{ orientationLabels[0] }}</p>
          <p class="orientation label-top">{{ orientationLabels[1] }}</p>
          <p class="orientation label-right">{{ orientationLabels[2] }}</p>
          <p class="orientation label-bottom">{{ orientationLabels[3] }}</p>
          <p class="top-left-lower orientation in-box-control">
            {{ indexSliceSlider }} / {{ stackConfigSlicesAmount }}
          </p>
          <template v-if="allowSelection && showPointSelect">
            <div class="right-center-control">
              <v-btn @click="onSetWindow('bone')">{{ `Bone` }}</v-btn>
              <v-btn @click="onSetWindow('soft')">{{ `Soft tissue` }}</v-btn>
              <v-btn @click="onSetWindow('lung')">{{ `Lung` }}</v-btn>
            </div>
          </template>
          <fullscreen-icon
            class="bottom-right clickable in-box-control"
            @click="toggleFullscreen()"
            :title="$t('global.fullscreen')"
            v-if="!amFullscreen && !forScanning"
          />
          <close-icon
            class="bottom-right clickable in-box-control fullscreen"
            @click="toggleFullscreen()"
            :title="$t('global.close')"
            v-else-if="!forScanning"
          />
          <div v-if="!forScanning" class="in-box-control above-bottom-left">
            <div>
              <p>{{ `W: ${windowWidth != false ? Math.round(windowWidth) : 0}` }}</p>
              <p>{{ `C: ${windowCenter != false ? Math.round(windowCenter) : 0}` }}</p>
            </div>
          </div>
          <brightness-auto
            v-if="!forScanning"
            class="bottom-left auto-windowing clickable in-box-control"
            @click="resetWindowing()"
          />
          <ContentCopyIcon
            v-if="!forScanning"
            class="top-right auto-windowing clickable in-box-control"
            @click="setSelectionToSliceMidpoint(false)"
            :title="$t('tools.copy_slice_position')"
          />
          <AxisXArrowIcon
            v-if="!forScanning"
            class="top-left auto-windowing clickable in-box-control"
            @click="setSelectionToSliceMidpoint(true)"
            :title="$t('tools.copy_slice_position_perpendicular')"
          />
        </div>
      </div>
      <div class="box-controls" v-if="vendorStylePreference === 'ge'">
        <v-row class="m0" justify="space-around" v-if="!amFullscreen">
          <v-col class="text-center pr0 py0" cols="2" :class="forScanning ? 'text-h5 py1' : ''">
            <!-- eslint-disable-next-line -->
            <span>1</span>
          </v-col>
          <v-col cols="8" class="align-self-center py0">
            <v-slider
              v-model.number="indexSliceSlider"
              min="1"
              :max="stackConfigSlicesAmount"
              :disabled="stackConfigSlicesAmount <= 1"
              thumb-label
              ticks
              hide-details="true"
            >
            </v-slider>
          </v-col>
          <v-col class="text-center pl0 py0" cols="2" :class="forScanning ? 'text-h5 py1' : ''">
            <span>{{ stackConfigSlicesAmount }}</span>
          </v-col>
        </v-row>

        <div v-if="!amFullscreen">
          <b-btn v-if="allowDebug" @click="showDebug = !showDebug" class="m-1" size="sm">{{
            $t('global.debug')
          }}</b-btn>

          <span v-if="showDebug">
            <!-- I'm going to assume it's okay to not translate this title because it's behind a showDebug flag -->
            <span class="clickable" @click="toggleShowCamera3D()"> <cube-icon title="3D View Toggle" /> </span>
            <!--<span class="clickable" @click="bShowBoundingBox = !bShowBoundingBox">-->
            <!--<cube-scan-icon title="Bounding Box Toggle"/>-->
            <!--</span>-->
            <b-form-checkbox v-model="showOutline">{{ $t('global.outline') }}</b-form-checkbox>
          </span>

          <!-- element to collapse -->
          <b-collapse v-model="showDebug" :id="`collapse${id}`">
            <div>
              <div>
                {{ $t('global.center_xyz') }}
                <span class="clickable" @click="movePositionInto(-3)"> <arrow-expand-down-icon title="In" /> </span>
                <span class="clickable" @click="movePositionInto(3)"> <arrow-collapse-up-icon title="Out" /> </span>
              </div>
              <input v-model.number="originX" type="number" step="0.1" />
              <input v-model.number="originY" type="number" step="0.1" />
              <input v-model.number="originZ" type="number" step="0.1" />
            </div>
            <div>
              {{ $t('global.direction_xyz') }}
              <input v-model.number="zDirectionX" type="number" step="0.01" />
              <input v-model.number="zDirectionY" type="number" step="0.01" />
              <input v-model.number="zDirectionZ" type="number" step="0.01" />
            </div>
            <div>{{ $t('global.thickness') }} <input v-model.number="thickness" type="number" step="1" /></div>
            <div>{{ $t('global.spacing') }} <input v-model.number="spacing" type="number" step="0.1" /></div>
          </b-collapse>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src

import log from 'loglevel'
import * as THREE from 'three'
import * as AMI from '@froilan-miranda/ami.js'
import { intersect } from 'mathjs'
import uuidv4 from 'uuid/v4'
import isPointInPolygon from 'robust-point-in-polygon'
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import ArrowExpandDownIcon from 'icons/ArrowExpandDown'
import ArrowCollapseUpIcon from 'icons/ArrowCollapseUp'
import CubeIcon from 'icons/Cube'
import CloseIcon from 'icons/Close'
import EventBus from '@/lib/event-bus'
import FullscreenIcon from 'icons/Fullscreen'
import BrightnessAuto from 'icons/BrightnessAuto'
import ContentCopyIcon from 'icons/ContentCopy'
import AxisXArrowIcon from 'icons/AxisXArrow'
import SliceViewToolbar from '@/components/SliceViewToolbar'
import ScanButton from '@/components/ScanButton'
import {
  clamp,
  getSignedAngleBetween,
  setIntersectionLineFromPlaneAndFourCorners,
  getClosestSignedAxis3,
  greatestAxisAbsXYZ,
} from '@/lib/math-util'
import { apiPatch } from '@/util/api'
import _, { mixin } from 'lodash'
import { Box3, CylinderGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, Plane, Vector2, Vector3 } from 'three'
import { createLineGeometry, dataToVector3 } from '@/lib/misc-util'
import { createHexagonPoints, getIntersectOfSegmentAndPlane } from '@/lib/satband-util'
import config from '@/config'
import { EXTRA_SCAN_BASE_NAME, MRI_MODEL_DIMENSIONS, SCAN_STATUS, POINT_SELECT_MODES } from '../../../constants'
import DragControls from '../../../lib/drag-control-recursive'
import ArrowExpandAllIconPng from '@/assets/cursors/arrow-expand-all.png'
import {
  getCTLabSliceVertexShaderContent,
  getMRSliceVertexShaderContent,
  getCTLabFragmentShader,
  getMRLabFragmentShader,
} from '../../../util/shader'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'

const StackHelper = AMI.stackHelperFactory(THREE)

const limitZPlane1 = new THREE.Plane().setFromNormalAndCoplanarPoint(
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, 0)
)
const limitZPlane2 = new THREE.Plane().setFromNormalAndCoplanarPoint(
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(0, 0, 0)
)

const mouseButtonIndexToName = {
  0: 'left',
  1: 'middle',
  2: 'right',
}

let tmpRaycaster = new THREE.Raycaster()
let tmpBackgroundSlicePlane = new THREE.Plane()
let tmpMouse2 = new THREE.Vector2()
let tmpMouseSliceMovement3 = new THREE.Vector3()
let tmpMovementProjected3 = new THREE.Vector3()
let tmpMovementProjected3x = new THREE.Vector3()
let tmpMovementProjected3y = new THREE.Vector3()
let tmpMovementProjected3z = new THREE.Vector3()

let throttledDispatch = null
let throttledCombinedUpdate = null

function intersectLineSegments3D(p1a, p1b, p2a, p2b) {
  // https://mathjs.org/docs/reference/functions/intersect.html
  // This finds the intersection point between the infinite length Lines (which is nice, but we only care if the actual Line Segments intersect, so this might return a point outside of those)
  let intersection = intersect(
    [p1a.x, p1a.y, p1a.z],
    [p1b.x, p1b.y, p1b.z],
    [p2a.x, p2a.y, p2a.z],
    [p2b.x, p2b.y, p2b.z]
  )
  if (!intersection) {
    return null
  }
  let [x, y, z] = intersection
  let intersection3 = new THREE.Vector3(x, y, z)

  // https://threejs.org/docs/#api/en/math/Line3
  let line1 = new THREE.Line3(p1a, p1b)
  let line2 = new THREE.Line3(p2a, p2b)
  // Need to check against both lines! Just because the infinite intersection check happens to be on one line segment doesn't mean it's also on the other line segment
  let clampedIntersection3A = line1.closestPointToPoint(intersection3, true, new THREE.Vector3())
  let clampedIntersection3B = line2.closestPointToPoint(intersection3, true, new THREE.Vector3())

  // if the intersection clamped to the line segment is far from the calculated infinite line intersection, we don't have an intersection at all
  if (
    intersection3.distanceToSquared(clampedIntersection3A) > 1 ||
    intersection3.distanceToSquared(clampedIntersection3B) > 1
  ) {
    return null
  } else {
    return clampedIntersection3A
  }
}

// This assumes all the 3D points are already projected on a plane of which the x/yAxis3 could be valid
function convertPointsTo2D(pointZero3, xAxis3, yAxis3, points3) {
  return _.map(points3, function (point3) {
    let diff3 = point3.clone().sub(pointZero3)
    // this is a Vector2: this is the format that isPointInPolygon / https://github.com/mikolalysenko/robust-point-in-polygon expects
    return [diff3.dot(xAxis3), diff3.dot(yAxis3)]
  })
}

// tweaked from stackoverflow; this works for Mouse and Touch events relative to an element
function getOffsetPosition(position2, evt, parent) {
  position2.x = evt.targetTouches ? evt.targetTouches[0].pageX : evt.clientX
  position2.y = evt.targetTouches ? evt.targetTouches[0].pageY : evt.clientY

  // This was a hacked quicker way to do this, but it didn't get the right Y in Question Edit View when things were offset more
  // This caused lots of rotation tool bugs/weirdness, as the Mouse X,Y had a negative Y
  // while(parent.offsetParent){
  //   position2.x -= parent.offsetLeft - parent.scrollLeft;
  //   position2.y -= parent.offsetTop - parent.scrollTop;
  //
  //   parent = parent.offsetParent;
  // }

  // getBoundingClientRect() is the traditional way to do this; slower, but works
  let rect = parent.getBoundingClientRect()
  position2.x -= rect.left
  position2.y -= rect.top

  return position2
}

function makeStackHelper(stack) {
  let stackHelper = new StackHelper(stack)
  const centerLPS = stackHelper.stack.worldCenter()
  // https://www.slicer.org/wiki/Coordinate_systems
  stackHelper.slice.aabbSpace = 'LPS'
  stackHelper.slice.planePosition.x = centerLPS.x
  stackHelper.slice.planePosition.y = centerLPS.y
  stackHelper.slice.planePosition.z = centerLPS.z
  stackHelper.slice.thickness = 0
  stackHelper.slice.spacing = 1
  return stackHelper
}

// Gets the actual center/midpoint of a slice (slice's center3 is actually just a corner of the slice?)
function getMidpointFromStackHelperSlice(stackHelperSlice) {
  // These are the 4 corners of the slices, with x,y,z for each, structured like x1,y1,z1,x2,y2,z2,....
  // They are both created by AMI (for localizers) and updated when trimming a slice into the desired FOV for a Scan
  let { array } = stackHelperSlice.mesh.geometry.getAttribute('position')
  return new THREE.Vector3(
    (array[0] + array[3] + array[6] + array[9]) / 4,
    (array[1] + array[4] + array[7] + array[10]) / 4,
    (array[2] + array[5] + array[8] + array[11]) / 4
  )
}

// The four corners of the background slice (stored as sliceView.selectionCorners on reformats, or crunched here for localizers)
// Returns: Array<Vector3> of length 4
function getBackgroundSliceCorners(sliceView) {
  // Reformats/User-Scans have selectionCorners, so use those if we have them
  /// sliceView.selectionCorners seemed to cause issues in the original order, which is:
  //     add add
  //     add sub
  //     sub add
  //     sub sub
  // so changing order to be the same as what's used below for initial localizer
  if (sliceView.selectionCorners) {
    let c = sliceView.selectionCorners
    return [c[0], c[2], c[1], c[3]]
  }

  // Crunch the 4 points ourselves
  let center3 = getMidpointFromStackHelperSlice(sliceView.stackHelper.slice)
  // which way is Up / Inwards / Right
  // If this sliceView is of a default Localizer, the best we have is using the camera.up planeDirection
  // (Assuming we're not a reformat at this point, because camera.up may not line up with the actual up of the scan/reformat (it can be non axis aligned with the camera.up))
  let up3 = sliceView.camera.up
  let inwards3 = sliceView.stackHelper.slice.planeDirection
  let right3 = up3.clone().cross(inwards3)

  // Vector for how much to go in the local Up/Y axis, and Right/X axis
  let yOffset = up3.multiplyScalar(sliceView.stackHelper.slice.halfDimensions.y)
  let xOffset = right3.multiplyScalar(sliceView.stackHelper.slice.halfDimensions.x)

  // make 4 corners:
  // need to be ordered for setIntersectionLineFromPlaneAndFourCorners
  let bgSliceCorners = _.map(
    [
      ['add', 'add'],
      ['sub', 'add'],
      ['add', 'sub'],
      ['sub', 'sub'],
    ],
    ([xOperation, yOperation]) => {
      let position3 = center3.clone()
      position3[xOperation](xOffset)
      position3[yOperation](yOffset)
      return position3
    }
  )

  return bgSliceCorners
}

let isDragControlHandling = false

export default {
  mixins: [SelectionConfigMixin],
  name: 'SliceBox',
  components: {
    SliceViewToolbar,
    FullscreenIcon,
    CubeIcon,
    CloseIcon,
    ArrowCollapseUpIcon,
    ArrowExpandDownIcon,
    BrightnessAuto,
    ContentCopyIcon,
    AxisXArrowIcon,
    ScanButton,
  },
  // viewOrientation - only used for default selection
  props: {
    forScanning: {
      type: Boolean,
      default: false,
    },
    viewOrientation: {
      type: String,
      required: true,
    },
    // the globally unique source ID for the references line that comes from this SliceView instance
    referenceLineId: {
      type: String,
      default: null,
    },
    showStackSelection: {
      type: Boolean,
      default: true,
    },
    // which StackConfig to pick by default
    selectedStackName: {
      type: String,
      default: null,
    },
    amFullscreen: Boolean,
    editable: {
      type: Boolean,
      required: false,
      default: false,
    },
    // isPlaySlice: {
    //   type: Boolean,
    //   required: false,
    //   default: false,
    // },
    expanded: {
      type: Boolean,
      default: false,
    },
    sliceViewIndex: {
      type: Number,
      required: false,
      default: 0,
    },
    isPreviewSliceView: {
      type: Boolean,
      required: false,
      default: false,
    },
    previewLimitedCtModelPlanes: {
      type: Array,
      required: false,
      default: () => {
        return []
      },
    },
    isShowPointSelectionAnswerArea: {
      type: Boolean,
      required: false,
      default: false,
    },
    isPreviewCriticalThinkingQuestion: {
      type: Boolean,
      required: false,
      default: false,
    },
    isInCriticalThinkingQuestion: {
      type: Boolean,
      required: false,
      default: false,
    },
    isShowCriticalQuestionResult: {
      type: Boolean,
      required: false,
      default: false,
    },
    isAutoWLChecked: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      windowCenter: false,
      windowWidth: false,
      clientWidthHalf: 0, // based on size of canvas element
      clientHeightHalf: 0,
      offsetForCameraCenteringBase: 0, // how much to adjust the camera panning by default to attempt to center (hack-ish math)
      cameraDirAxisName: 'x', // which axis is the cameara mostly alligned with
      lastMiddleClick: Date.now(),
      mouseButtonsDown: {}, // truthmap by button
      mousePosition2Init: new THREE.Vector2(),
      mousePosition2Prev: new THREE.Vector2(),
      mousePosition2Cur: new THREE.Vector2(),
      mousePositionSlice3Init: new THREE.Vector3(),
      mousePositionSlice3Prev: new THREE.Vector3(),
      mousePositionSlice3Cur: new THREE.Vector3(),
      mouseMovementResizeRemainder3: new THREE.Vector3(),
      id: null,
      elBox: null,
      indexSlice: 0,
      indexSliceOverwrite: null, // used briefly when swapping in state (for fullscreen config transfer)
      stackHelperByStackIdent: null,
      stackHelperPrevious: null,
      scene: null,
      renderer: null,
      camera: null,
      camera3D: null,
      bShowBoundingBox: false, // can't toggle live
      bShowCamera3D: false,
      showDebug: false,
      stackVolumeSelection: null, // one instance per view
      stackConfig: null,
      tempStackConfig: null,
      renamingStackConfigLabel: null,
      zoom: 1.3,
      // the below is about the slice we are looking at (this is set from the current slice of the stackConfig)
      originX: null,
      originY: null,
      originZ: null,
      zDirectionX: Math.sin(0), // zDirection should always exist
      zDirectionY: 0,
      zDirectionZ: Math.abs(Math.cos(0)),
      yDirectionX: null, // yDirection+ xDirection only exist on user reformats/scans, not on original localizer
      yDirectionY: null,
      yDirectionZ: null,
      xDirectionX: null,
      xDirectionY: null,
      xDirectionZ: null,
      selectionCorners: null, // the user-requested corners of the current bg slice (generally null for initial localizers)
      selectionLimitCorners: null, // the limit corners of prev scan view
      isLimited: null,
      // https://github.com/FNNDSC/ami/blob/dev/examples/geometries_slice/geometries_slice.js#L282
      thickness: 0, // 0 ... 20 (actually, seemingly no limit), step 1
      spacing: 1, // 0 ...2 (stops looking different around ~5?), step 0.2
      geometryMustUpdate: true,
      pointSelectionMeshes: {},
      satBandMeshes: {},
      // In preview critical thinking mode
      pointPreviewChosenSelectionMeshes: {},
      pointerMovedSinceLastDown: false,
      referenceLineBySliceViewId: {}, // {sliceId: Line} for Reference Lines to other SliceView's bgSlice; Line; like a green selection slice intersection line, but based on the other SliceView's background slice
      interval: null,
      isCTLab: config.isCTLab,
      windowLevelWidths: [
        {
          hotKeyCode: 49,
          text: 'Soft tissue',
          value: 'soft',
          windowLevel: 40,
          windowWidth: 400,
        },
        {
          hotKeyCode: 50,
          text: 'Lung',
          value: 'lung',
          windowLevel: -600,
          windowWidth: 1500,
        },
        {
          hotKeyCode: 51,
          text: 'Bone',
          value: 'bone',
          windowLevel: 600,
          windowWidth: 3000,
        },
        {
          hotKeyCode: 52,
          text: 'Brain',
          value: 'brain',
          windowLevel: 40,
          windowWidth: 80,
        },
        {
          hotKeyCode: 53,
          text: 'Vascular',
          value: 'vascular',
          windowLevel: 100,
          windowWidth: 90,
        },
      ],
      cursorOnBox: false,
      extraScanBaseName: EXTRA_SCAN_BASE_NAME,
      mriModelDimensions: MRI_MODEL_DIMENSIONS,
      scanStatuses: SCAN_STATUS,
      stackVolumeSelections: [],
      requestAnimationId: null,
      pointSelectModes: POINT_SELECT_MODES,
      snapDraggableObjects: [],
      snapDraggableObjectContainer: new Group(),
      projectionSatBandSelectionObjectContainer: new Group(),
      dragControl: null,
      pointSelectionGeometry: new THREE.SphereGeometry(1, 20, 20),
      pointSelectionPolygonGeometry: new CylinderGeometry(1, 1, 1, 16),
      pointSelectionMaterial: new THREE.MeshBasicMaterial({
        transparent: true,
        color: 0xde2c1f,
        depthTest: false,
      }),
      satBandMaterial: new THREE.MeshBasicMaterial({
        transparent: true,
        color: 0xde2c1f,
        depthTest: false,
      }),
      pointSelectionHighlightMaterial: new THREE.MeshBasicMaterial({
        transparent: true,
        color: 0x00ff00,
        depthTest: false,
      }),
      satBandHighlightMaterial: new THREE.MeshBasicMaterial({
        transparent: true,
        color: 0x00ff00,
        depthTest: false,
      }),
      pointSelectionPolygonMaterial: new MeshBasicMaterial({
        transparent: true,
        color: 0xde2c1f,
        depthTest: false,
      }),
      satBandPolygonMaterial: new MeshBasicMaterial({
        transparent: true,
        color: 0xde2c1f,
        depthTest: false,
      }),
      pointSelectionShapeMaterial: new MeshBasicMaterial({
        color: 0xde2c1f,
        side: DoubleSide,
        depthTest: false,
        transparent: true,
      }),
      satBandShapeMaterial: new MeshBasicMaterial({
        color: 0xde2c1f,
        side: DoubleSide,
        depthTest: false,
        transparent: true,
      }),
      pointSelectionShapeHighlightMaterial: new MeshBasicMaterial({
        color: 0x00ff00,
        side: DoubleSide,
        depthTest: false,
        transparent: true,
      }),
      satBandShapeHighlightMaterial: new MeshBasicMaterial({
        color: 0x00ff00,
        side: DoubleSide,
        depthTest: false,
        transparent: true,
      }),
      pointSelectionDotGeometry: new THREE.SphereGeometry(1, 20, 20),
      pointSelectionCenterDotGeometry: new THREE.SphereGeometry(4, 20, 20),
      pointSelectionDotMaterial: new MeshBasicMaterial({
        color: 0xf9ff0d,
        depthTest: false,
        transparent: true,
        opacity: 1,
      }),
      movePointSelectCenterIcon: null,
      userSelectedPointMesh: null,
      interactableInstances: null,
      shouldUpdateMRShaderMaterial: false,
      // Only used for full screen
      isInCriticalThinkingQuestionForFullScreen: false,
      isPreviewCriticalThinkingQuestionForFullScreen: false,
      isMovedSliceBoxToCenter: false,

      lastSetUpCameraStackConfigName: '',
      isMoveToCenterOfLimitSquare: false,
      lastCameraOriginPosition: new Vector3(),

      lastDirLPS: null,
      updateProjectionOfSatBandGradeZoneTimeOut: null,
      debounceCenterPlaneIntersectionDir: null,
      refreshKey: 0,
      screenHeight: window.innerHeight,
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
    ...mapState('authentication', ['accessToken']),
    ...mapState('dicomService', ['stack', 'dicomFileSet']),
    ...mapState('satBandService', [
      'tmpSatBandSelectedPolygonPoints',
      'isStartDrawSatBandZone',
      'newSatBandRadius',
      'satBandMode',
      'satBandEditMode',
      'newSatBandRectangleWidth',
      'newSatBandRectangleHeight',
      'cornerSatBandDotSize',
      'satBandSelections',
      'selectedSatBandStackConfigName',
      'visibleSatBand',
    ]),
    ...mapState('pointSelectService', [
      'selections',
      'noSelections',
      'showPointSelect',
      'allowSelection',
      'newRadius',
      'previewChosenSelection',
      'cornerDotSize',
      'newRectangleHeight',
      'newRectangleWidth',
      'isStartDrawPointSelectZone',
      'tmpSelectedPolygonPoints',
      'pointSelectMode',
      'pointSelectEditMode',
      'selectedPointInfo',
      'userPointSelectAnswerDotSize',
    ]),
    ...mapGetters('pointSelectService', ['currentSelection']),
    ...mapGetters('satBandService', ['currentSatBandSelection']),
    ...mapGetters('stackService', [
      'stackConfigsByOrientation',
      'stackConfigOfFirstLocalizer',
      'stackConfigOfFirstNonLocalizer',
      'limitedCTModelPlanesOfStackConfigs',
      'distancePercentFromMaxConfigBoxTo3dModelBox',
    ]),
    ...mapGetters('user', [
      'windowingDirection',
      'languageCode',
      'softwareVendorPreference',
      'softwareVersionPreference',
      'sliceFrameRate',
    ]),
    ...mapState('user', ['isAdmin', 'allowDebug']),
    ...mapState('stackService', [
      'stackConfigs',
      'sliceViewIndexWillShowResult',
      'isOnMriView',
      'isMriMachineScanComplete',
      'scanPercentStartOfMRIMachine',
      'scanPercentOfMRIMachine',
      'configNameOfFirstSliceView',
      'mriModelBbox',
      'scanPercentStartOfLandmark',
    ]),
    ...mapState('selectionConfig', [
      'selectionConfigsByIdent',
      'isFullscreen',
      'isAddLocalizerMode',
      'toolSelected',
      'toolSelectedConfig',
      'showReferenceLines',
      'referenceSliceCornersBySliceViewId',
      'centerPlaneIntersectionDirBySliceViewId',
      'hasAddedLocalizer',
      'showOutline',
      'selectedMRIScanDirectionOfLocalizer',
    ]),
    ...mapGetters('selectionConfig', ['dotScaleValues', 'isHotkeysEnabledCT', 'isParameterDisabled']),
    ...mapGetters('questionService', [
      'stackQuestion',
      'answerCurrent',
      'isAcquisitionQuestion',
      'isReconstructionQuestion',
      'stackQuestions',
      'prevStackQuestion',
      'isLocalizerQuestion',
      'hasLocalizerQuestion',
      'answerDataCurrentHasSelectionConfigData',
    ]),
    ...mapState('questionService', [
      'hasAnsweredAllStackQuestions',
      'isPlayingTheSlices',
      'selectedStackQuestionIndex',
      'userAnswers',
      'isEditingQuestion',
      'canGoToNextStep',
      'scanStatus',
      'questionSet',
      'criticalThinkingQuestions',
      'criticalThinkingQuestionIndex',
      'isViewingCriticalThinkingQuestion',
      'currentCriticalThinkingQuestionSelectedAnswer',
    ]),
    ...mapGetters('testRunService', ['isTakingTest']),
    ...mapGetters('scanTimeConfig', [
      'getAutoAlignOptions',
      'getSelectedAutoAlign',
      'getLocalSoftwareVersionPreference',
    ]),

    localSoftwareVersionPreference() {
      return this.getLocalSoftwareVersionPreference
    },
    currentCriticalThinkingQuestion() {
      const { preQuestion, postQuestions } = this.criticalThinkingQuestions || {}

      if (!this.isViewingCriticalThinkingQuestion) {
        return null
      }
      if (preQuestion) return preQuestion

      if (postQuestions) {
        return postQuestions[this.criticalThinkingQuestionIndex]
      }

      return null
    },
    computedStyle() {
      if (this.viewOrientation === 'x') {
        if (this.screenHeight >= 900) {
          return {
            height: this.isSidebarExpanded ? '86.1vh' : '100%',
          }
        } else if (this.screenHeight >= 768 && this.screenHeight < 900) {
          return {
            height: this.isSidebarExpanded ? '85.6vh' : '100%',
          }
        } else if (this.screenHeight >= 650 && this.screenHeight < 768) {
          return {
            height: this.isSidebarExpanded ? '85.1vh' : '100%',
          }
        } else if (this.screenHeight >= 600 && this.screenHeight < 650) {
          return {
            height: this.isSidebarExpanded ? '84.6vh' : '100%',
          }
        } else if (this.screenHeight >= 500 && this.screenHeight < 600) {
          return {
            height: this.isSidebarExpanded ? '83.6vh' : '100%',
          }
        }
      }
    },
    isSidebarExpanded() {
      return this.$store.getters.isSidebarExpanded
    },
    selectedCategoryName() {
      return _.get(this.currentCriticalThinkingQuestion, ['category', 'name'], '')
    },
    shouldShowNoPathologyButton() {
      if (_.toLower(this.selectedCategoryName) == 'pathology') {
        return true
      } else {
        return false
      }
    },
    selectedCriticalThinkingAnswer: {
      get() {
        return this.currentCriticalThinkingQuestionSelectedAnswer
      },
      set() {},
    },
    currentNopathologyValue: {
      get() {
        if (this.selectedCriticalThinkingAnswer && this.selectedCriticalThinkingAnswer.noSelections) {
          return true
        } else {
          return false
        }
      },
      set() {},
    },
    isShowPointSelectPathologyButton() {
      return this.isCTLab && this.isInCriticalThinkingQuestionForFullScreen
    },
    isSubmitPointSelectDisabled() {
      const selectedAnswer = this.selectedCriticalThinkingAnswer
      if (!selectedAnswer) {
        return true
      }
      return false
    },
    currentSelectionMode() {
      if (!this.currentSelection) {
        return null
      }

      return _.get(this.currentSelection, ['mode'], this.pointSelectModes.CIRCLE)
    },
    currentSatBandSelectionMode() {
      if (!this.currentSatBandSelection) {
        return null
      }

      return _.get(this.currentSatBandSelection, ['mode'], this.pointSelectModes.CIRCLE)
    },
    selectedPolygonPoints: {
      get() {
        return this.tmpSelectedPolygonPoints
      },
      set(val) {
        this.setTmpSelectedPolygonPoints(val)
      },
    },
    selectedSatBandPolygonPoints: {
      get() {
        return this.tmpSatBandSelectedPolygonPoints
      },
      set(val) {
        this.setTmpSatBandSelectedPolygonPoints(val)
      },
    },
    isComplete() {
      return this.hasAnsweredAllStackQuestions
    },
    showOutline: {
      get() {
        return this.$store.state.selectionConfig.showOutline
      },
      set(showOutline) {
        this.$store.commit('selectionConfig/set', { showOutline })
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
    testToggles() {
      return Object.values(
        Object.keys(this.selectionConfigsByIdent).reduce((newTestToggles, toggleName) => {
          const [groupName, identType] = toggleName.trim().split('_')
          if (!newTestToggles[groupName]) newTestToggles[groupName] = []
          if (identType !== 'min' || identType !== 'max') {
            newTestToggles[groupName].push({
              toggleName,
              visible: this.selectionConfigsByIdent[toggleName].visible,
            })
          }

          return newTestToggles
        }, {})
      )
    },
    toggleReferenceLines: {
      get() {
        return this.$store.state.selectionConfig.showReferenceLines
      },
      set(toggleReferenceLines) {
        this.$store.dispatch('selectionConfig/setShowReferenceLines', toggleReferenceLines)
      },
    },
    orientationLabels() {
      switch (this.cameraDirAxisName) {
        case 'z':
          return ['R', 'A', 'L', 'P']
        case 'y':
          return ['R', 'H', 'L', 'F']
        case 'x':
          return ['A', 'H', 'P', 'F']
        default:
          throw new Error('Invalid direction given')
      }
    },
    stackIdent() {
      let stackIdent = this.stackConfig?.stackIdent
      if (!stackIdent) {
        log.debug('stackConfig had no stackIdent, so defaulting to first')
        stackIdent = this.$store.getters['dicomService/stackIdentFirst']
      }
      return stackIdent
    },
    stack() {
      return this.$store.state.dicomService.stackByStackIdent[this.stackIdent]
    },
    stackWorldBoundingBoxDimensions() {
      log.debug('get stack bounding box', this.stackIdent)
      try {
        const worldbb = this.stack.worldBoundingBox()
        const lpsDims = new THREE.Vector3(worldbb[1] - worldbb[0], worldbb[3] - worldbb[2], worldbb[5] - worldbb[4])
        return lpsDims
      } catch (e) {
        return null
      }
    },
    stackHelper() {
      // Swap StackHelpder TODO (in watch?)
      // - Scene Remove old thing, then add new:
      // if (this.bShowBoun1dingBox) {
      //   this.scene.add(this.stackHelper)
      // } else {
      //   this.scene.add(this.stackHelper.slice)
      // }
      // - selectionConfig/addInstance
      // - swap the instance's backgroundSlice: this.stackHelper.slice

      let stackIdent = this.stackIdent
      log.debug('Getting stackHelper for stackIdent', stackIdent)
      let stackHelperByStackIdent = this.stackHelperByStackIdent || {}
      if (stackHelperByStackIdent[stackIdent]) {
        log.debug(' found existing')
        return stackHelperByStackIdent[stackIdent]
      } else {
        log.debug(' making new one', stackHelperByStackIdent)
        if (!this.stack) {
          throw Error(`Could not find loaded stack for stackIdent: ${stackIdent}`)
        }
        let stackHelper = makeStackHelper(this.stack)
        _.set(this, ['stackHelperByStackIdent', stackIdent], stackHelper)
        return stackHelper
      }
    },
    stackConfigSlices() {
      // slices in the current stack config
      return this.stackConfig?.slices || []
    },
    stackConfigSlicesAmount() {
      // slices in the current stack config
      return _.size(_.get(this.stackConfig, 'slices')) || 1
    },
    stackConfigIsFromFrames() {
      return this.stackConfig?.isFromFrames
    },
    stackConfigOptions() {
      // Dont't show the base HD stacks unless we are in debug mode
      let allowedConfigs = this.showDebug ? this.stackConfigs : _.filter(this.stackConfigs, (c) => !c.hidden)
      let options = _.map(allowedConfigs, (config) => {
        const localizerNames = _.get(this.dicomFileSet, 'localizerNames', {})
        const label = localizerNames[`${config.renameIdent}`]
        return {
          value: config,
          text: label || config.name,
        }
      })
      // Remove duplicates
      return _.uniqBy(options, 'text')
    },
    indexSliceSlider: {
      get() {
        return this.indexSlice + 1
      },
      set(index) {
        let val = clamp(index, 1, this.stackConfigSlicesAmount)
        this.setSliceIndex(val - 1, true)
      },
    },
    // Camera is looking from other side of image
    // This impacts how the Selection looks
    // Keep this in sync with src/lib/stack-volume-selection.js#isCameraReversed
    isCameraReversed() {
      return this.cameraDirAxisName === 'y'
    },
    // This flips the Slice background image
    isCameraLeftRightFlipped() {
      // Flipping Axial always, via Matthew
      // Flipping Sagittal back if attribute is set on DICOM (This one also depends on stackConfigIsFromFrames)
      return (
        this.cameraDirAxisName === 'z' ||
        (this.cameraDirAxisName === 'x' &&
          !this.dicomFileSet?.flipSagittal &&
          (this.stackConfigIsFromFrames || (this.isCTLab && this.stackConfig.shouldFlipCamera)))
      )
    },
    // the stackVolumeSelection instance (for this SliceView) for the current selected selectionConfig ident
    selectedStackVolumeSelection() {
      let ident = this.$store.state.selectionConfig.selectionConfigCurrentIdent
      return _.find(this.stackVolumeSelections, { ident })
    },
    disabledTools() {
      if (this.isCTLab) {
        if (this.isParameterDisabled) {
          return ['move', 'resize', 'rotate', 'oversampling']
        }
        if (this.isAcquisitionQuestion) {
          return ['rotate', 'oversampling']
        }
        if (this.isReconstructionQuestion) {
          return ['oversampling']
        }
        return ['oversampling']
      } else {
        return []
      }
    },
    isShowOrientationView() {
      // const prevQuestion =
      //   this.selectedStackQuestionIndex > 0 ? this.stackQuestions[this.selectedStackQuestionIndex - 1] : null

      // const isAwsweredPrevQuestion =
      //   !prevQuestion || (this.userAnswers && this.userAnswers.find((el) => el.stackQuestionId === prevQuestion.id))

      // return isAwsweredPrevQuestion && this.isReconstructionQuestion

      return true
    },
    isPlaySlice() {
      if (this.isOnMriView) {
        if (this.isAcquisitionQuestion) {
          if (this.sliceViewIndexWillShowResult == -1 || this.sliceViewIndexWillShowResult > 2) {
            if (this.sliceViewIndex == 0) {
              return true
            } else {
              return false
            }
          } else {
            if (this.sliceViewIndexWillShowResult == this.sliceViewIndex) {
              return true
            } else {
              return false
            }
          }
        }
        // Case: Reconstruction question or dicom playground
        else if (this.isReconstructionQuestion || (this.isCTLab && !this.questionSet)) {
          if (this.sliceViewIndexWillShowResult == -1) {
            if (this.sliceViewIndex == 0) {
              return true
            } else {
              return false
            }
          } else {
            if (this.sliceViewIndexWillShowResult == this.sliceViewIndex) {
              return true
            } else {
              return false
            }
          }
        } else {
          if (this.sliceViewIndex == 0) {
            return true
          } else {
            return false
          }
        }
      } else {
        if (this.sliceViewIndex == 0) {
          return true
        } else {
          return false
        }
      }
    },

    dicomLocalizerBoxConfig() {
      if (this.stackConfig && this.dicomFileSet) {
        return _.get(
          _.find(_.get(this.dicomFileSet, ['localizerBoundingBoxes'], []), (el) => el.name == this.stackConfig.name),
          ['config']
        )
      }
      return null
    },
    dicomScanBoxConfig() {
      if (this.stackConfig && this.dicomFileSet) {
        const localizerConfig = _.cloneDeep(
          _.get(
            _.find(_.get(this.dicomFileSet, ['localizerBoundingBoxes'], []), (el) => el.name == this.stackConfig.name),
            ['config']
          )
        )
        const scanConfig = _.cloneDeep(
          _.get(
            _.find(_.get(this.dicomFileSet, ['scanBoundingBoxes'], []), (el) => el.name == this.stackConfig.name),
            ['config']
          )
        )

        if (localizerConfig) {
          localizerConfig.dimensions3 = {
            ...localizerConfig.dimensions3,
            x: Math.max(20, localizerConfig.dimensions3.x - 20),
            y: Math.max(20, localizerConfig.dimensions3.y - 20),
            z: Math.max(20, localizerConfig.dimensions3.z - 20),
          }
        }
        return scanConfig ? scanConfig : localizerConfig
      }
      return null
    },
    dicomLocalizerBoxCenter() {
      if (this.stackConfig && this.dicomFileSet) {
        return _.get(this.dicomLocalizerBoxConfig, ['center3'])
      }
      return null
    },
    limitedCTModelPlanesOfScanPercent() {
      if (!this.isCTLab) {
        return []
      }
      // Only used for the first localizer
      let bias = 1
      // Head to foot bias = 1
      if (this.selectedMRIScanDirectionOfLocalizer == 1) {
        bias = 1
      } else {
        bias = -1
      }

      // Orientation x or y
      let limitDirection = new THREE.Vector3(0, 0, 1)
      let limitDirText = 'z'
      // Get direction of default stackConfig to calculate the axis of limit scan
      // The initial scaned stackconfigs is stackConfigs[0]
      if (this.stackConfigs.length > 0) {
        let defaultStackConfig = this.stackConfigs[0]
        const noHiddenStackConfigs = _.reject(this.stackConfigs, 'hidden')
        if (noHiddenStackConfigs.length > 0) {
          defaultStackConfig = noHiddenStackConfigs[0]
        }
        let orientation = greatestAxisAbsXYZ(
          defaultStackConfig.slices[0].zDirectionX,
          defaultStackConfig.slices[0].zDirectionY,
          defaultStackConfig.slices[0].zDirectionZ
        )
        // Calculate dir
        // Follow function updateGeometries() in SliceView.vue
        // With orientation is x or y, z is the direction of MRI scan
        // Set limit direction for z orientation
        if (orientation == 'z') {
          limitDirection = new THREE.Vector3(0, -1, 0)
          limitDirText = 'y'
        }
      }

      // Get box from localizer question
      const localizerQuestion = this.stackQuestions.find((el) => el.questionType == 3)
      const maxConfig = _.get(localizerQuestion, ['answers', 0, '0_max'], null)
      const planes = []
      if (maxConfig || this.dicomScanBoxConfig) {
        let mriBoxExpand = 0
        const arrs = ['x', 'y', 'z']
        if (this.dicomScanBoxConfig) {
          arrs.forEach((text) => {
            if (
              _.has(this.dicomScanBoxConfig, [`${text}Direction3`]) &&
              greatestAxisAbsXYZ(
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'x']),
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'y']),
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'z'])
              ) == limitDirText
            ) {
              mriBoxExpand = _.get(this.dicomScanBoxConfig, ['dimensions3', text])
            }
          })
        } else {
          arrs.forEach((text) => {
            if (
              _.has(maxConfig, [`${text}DirectionX`]) &&
              _.has(maxConfig, [`${text}DirectionY`]) &&
              _.has(maxConfig, [`${text}DirectionZ`]) &&
              greatestAxisAbsXYZ(
                _.get(maxConfig, [`${text}DirectionX`]),
                _.get(maxConfig, [`${text}DirectionY`]),
                _.get(maxConfig, [`${text}DirectionZ`])
              ) == limitDirText
            ) {
              mriBoxExpand = _.get(maxConfig, [`dimension${text.toLocaleUpperCase()}`])
            }
          })
        }

        // Box in max config
        let center = new THREE.Vector3(
          _.get(maxConfig, ['centerX'], 0),
          _.get(maxConfig, ['centerY'], 0),
          _.get(maxConfig, ['centerZ'], 0)
        )
        if (this.dicomLocalizerBoxCenter) {
          center = new THREE.Vector3(
            _.get(this.dicomScanBoxConfig, ['center3', 'x'], 0),
            _.get(this.dicomScanBoxConfig, ['center3', 'y'], 0),
            _.get(this.dicomScanBoxConfig, ['center3', 'z'], 0)
          )
        }

        let originMriBoxExpand = mriBoxExpand
        // No config localizer box
        if (!this.dicomLocalizerBoxCenter) {
          if (this.distancePercentFromMaxConfigBoxTo3dModelBox > 0) {
            const distance = (this.distancePercentFromMaxConfigBoxTo3dModelBox / 100) * originMriBoxExpand
            // Expand to end of model 3d
            mriBoxExpand += distance
            // Adjust center of config
            center[limitDirText] = center[limitDirText] - distance / 2
          }
        }

        // let centerToleranceOfLocalizerAndScan = 0
        if (this.scanPercentStartOfLandmark > 0 || !this.dicomLocalizerBoxCenter) {
          // scanPercentStartOfLandmark < 0
          // start point is far from center
          // scanPercentStartOfLandmark > 0 start point near center
          const distance = (this.scanPercentStartOfLandmark / 100) * originMriBoxExpand

          // Expand to end of model 3d
          mriBoxExpand -= distance
          // Adjust center of config
          center[limitDirText] = center[limitDirText] - distance / 2
        } else {
          const distanceFromLandmarkToBox = (Math.abs(this.scanPercentStartOfLandmark) / 100) * originMriBoxExpand
          let centerLocalizer = new THREE.Vector3(
            _.get(this.dicomLocalizerBoxConfig, ['center3', 'x'], 0),
            _.get(this.dicomLocalizerBoxConfig, ['center3', 'y'], 0),
            _.get(this.dicomLocalizerBoxConfig, ['center3', 'z'], 0)
          )
          let expand = 0
          let centerTolerance = 0
          arrs.forEach((text) => {
            if (
              _.has(this.dicomScanBoxConfig, [`${text}Direction3`]) &&
              greatestAxisAbsXYZ(
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'x']),
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'y']),
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'z'])
              ) == limitDirText
            ) {
              centerTolerance = center[text] - centerLocalizer[text]
              expand =
                Math.abs(this.dicomLocalizerBoxConfig.dimensions3[text] - this.dicomScanBoxConfig.dimensions3[text]) / 2
            }
          })

          if (bias == 1) {
            expand = Math.max(0, expand - centerTolerance)
          } else {
            expand = Math.max(0, expand + centerTolerance)
          }

          if (distanceFromLandmarkToBox < expand) {
            expand = distanceFromLandmarkToBox
          }

          // Expand to end of localizer box
          mriBoxExpand += expand
          // centerToleranceOfLocalizerAndScan = Math.abs(expand)
          // Adjust center of config
          center[limitDirText] = center[limitDirText] + (expand / 2) * bias
        }

        if (mriBoxExpand != 0) {
          if (this.scanPercentStartOfLandmark > 0 || !this.dicomLocalizerBoxCenter) {
            // User move to another point vs landmark
            // In new version, user can't move to another point
            // Limit top
            const planes = []
            const p1 = center.clone().add(
              limitDirection
                .clone()
                .multiplyScalar(bias)
                .multiplyScalar(mriBoxExpand / 2 - (mriBoxExpand * this.scanPercentStartOfMRIMachine) / 100)
            )
            const n1 = bias == 1 ? limitDirection.clone().negate() : limitDirection.clone()
            const plane1 = new THREE.Plane().setFromNormalAndCoplanarPoint(n1, p1)
            planes.push(plane1)

            // Limit bottom
            const p2 = center.clone().add(
              limitDirection
                .clone()
                .multiplyScalar(bias)
                .multiplyScalar(mriBoxExpand / 2 - (mriBoxExpand * this.scanPercentOfMRIMachine) / 100)
            )
            const n2 = bias == 1 ? limitDirection.clone() : limitDirection.clone().negate()
            const plane2 = new THREE.Plane().setFromNormalAndCoplanarPoint(n2, p2)
            planes.push(plane2)
            return planes
          } else {
            // Limit top
            const planes = []
            const p1 = center.clone().add(
              limitDirection
                .clone()
                .multiplyScalar(bias)
                .multiplyScalar(mriBoxExpand / 2)
            )
            const n1 = bias == 1 ? limitDirection.clone().negate() : limitDirection.clone()
            const plane1 = new THREE.Plane().setFromNormalAndCoplanarPoint(n1, p1)
            planes.push(plane1)

            // const percentProportionOfLandmark =
            //   (Math.abs(this.scanPercentStartOfLandmark) / (Math.abs(this.scanPercentStartOfLandmark) + 100)) * 100
            // const distancePercentProportionOfLandmark =
            //   (centerToleranceOfLocalizerAndScan / (originMriBoxExpand + centerToleranceOfLocalizerAndScan)) * 100

            // let convertPercent = 0
            // if (this.scanPercentOfMRIMachine < percentProportionOfLandmark) {
            //   convertPercent = Math.round(
            //     (this.scanPercentOfMRIMachine / percentProportionOfLandmark) * distancePercentProportionOfLandmark
            //   )
            // } else {
            //   convertPercent = Math.round(
            //     distancePercentProportionOfLandmark +
            //       ((this.scanPercentOfMRIMachine - percentProportionOfLandmark) / (100 - percentProportionOfLandmark)) *
            //         (100 - distancePercentProportionOfLandmark)
            //   )
            // }
            let convertPercent = this.scanPercentOfMRIMachine
            // Limit bottom
            const p2 = center.clone().add(
              limitDirection
                .clone()
                .multiplyScalar(bias)
                .multiplyScalar(mriBoxExpand / 2 - (mriBoxExpand * convertPercent) / 100)
            )
            const n2 = bias == 1 ? limitDirection.clone() : limitDirection.clone().negate()
            const plane2 = new THREE.Plane().setFromNormalAndCoplanarPoint(n2, p2)
            planes.push(plane2)
            return planes
          }
        } else {
          return []
        }
      }

      return planes
    },
    limitedCTModelPlanesOfLandmark() {
      if (!this.isCTLab) {
        return {
          planes: [],
          limit: null,
        }
      }
      let bias = 1
      // Head to foot bias = 1
      if (this.selectedMRIScanDirectionOfLocalizer == 1) {
        bias = 1
      } else {
        bias = -1
      }

      const cameraUpDir = greatestAxisAbsXYZ(this.camera.up.x, this.camera.up.y, this.camera.up.z)
      const cameraSizeDirectionText = ['x', 'y', 'z'].filter(
        (text) => text != cameraUpDir && text != this.cameraDirAxisName
      )
      const cameraSizeDirection =
        cameraSizeDirectionText == 'x'
          ? new Vector3(1, 0, 0)
          : cameraSizeDirectionText == 'y'
          ? new Vector3(0, 1, 0)
          : new Vector3(0, 0, 1)

      // Orientation x or y
      let limitDirection = new THREE.Vector3(0, 0, 1)
      let limitDirText = 'z'
      // Get direction of default stackConfig to calculate the axis of limit scan
      // The initial scaned stackconfigs is stackConfigs[0]
      if (this.stackConfigs.length > 0) {
        let defaultStackConfig = this.stackConfigs[0]
        const noHiddenStackConfigs = _.reject(this.stackConfigs, 'hidden')
        if (noHiddenStackConfigs.length > 0) {
          defaultStackConfig = noHiddenStackConfigs[0]
        }
        let orientation = greatestAxisAbsXYZ(
          defaultStackConfig.slices[0].zDirectionX,
          defaultStackConfig.slices[0].zDirectionY,
          defaultStackConfig.slices[0].zDirectionZ
        )
        // Calculate dir
        // Follow function updateGeometries() in SliceView.vue
        // With orientation is x or y, z is the direction of MRI scan
        // Set limit direction for z orientation
        if (orientation == 'z') {
          limitDirection = new THREE.Vector3(0, -1, 0)
          limitDirText = 'y'
        }
      }

      // Get box from localizer question
      const localizerQuestion = this.stackQuestions.find((el) => el.questionType == 3)
      const maxConfig = _.get(localizerQuestion, ['answers', 0, '0_max'], null)
      const planes = []
      if (maxConfig) {
        let mriBoxExpand = 0
        let mriBoxSizeExpand = 0
        const arrs = ['x', 'y', 'z']
        if (this.dicomScanBoxConfig) {
          arrs.forEach((text) => {
            if (
              _.has(this.dicomScanBoxConfig, [`${text}Direction3`]) &&
              greatestAxisAbsXYZ(
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'x']),
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'y']),
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'z'])
              ) == limitDirText
            ) {
              mriBoxExpand = _.get(this.dicomScanBoxConfig, ['dimensions3', text])
            }
            if (
              _.has(this.dicomScanBoxConfig, [`${text}Direction3`]) &&
              greatestAxisAbsXYZ(
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'x']),
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'y']),
                _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'z'])
              ) == cameraSizeDirectionText
            ) {
              mriBoxSizeExpand = _.get(this.dicomScanBoxConfig, ['dimensions3', text])
            }
          })
        } else {
          arrs.forEach((text) => {
            if (
              _.has(maxConfig, [`${text}DirectionX`]) &&
              _.has(maxConfig, [`${text}DirectionY`]) &&
              _.has(maxConfig, [`${text}DirectionZ`]) &&
              greatestAxisAbsXYZ(
                _.get(maxConfig, [`${text}DirectionX`]),
                _.get(maxConfig, [`${text}DirectionY`]),
                _.get(maxConfig, [`${text}DirectionZ`])
              ) == limitDirText
            ) {
              mriBoxExpand = _.get(maxConfig, [`dimension${text.toLocaleUpperCase()}`])
            }
            if (
              _.has(maxConfig, [`${text}DirectionX`]) &&
              _.has(maxConfig, [`${text}DirectionY`]) &&
              _.has(maxConfig, [`${text}DirectionZ`]) &&
              greatestAxisAbsXYZ(
                _.get(maxConfig, [`${text}DirectionX`]),
                _.get(maxConfig, [`${text}DirectionY`]),
                _.get(maxConfig, [`${text}DirectionZ`])
              ) == cameraSizeDirectionText
            ) {
              mriBoxSizeExpand = _.get(maxConfig, [`dimension${text.toLocaleUpperCase()}`])
            }
          })
        }
        let center = new THREE.Vector3(
          _.get(maxConfig, ['centerX'], 0),
          _.get(maxConfig, ['centerY'], 0),
          _.get(maxConfig, ['centerZ'], 0)
        )
        if (this.dicomLocalizerBoxCenter) {
          center = new THREE.Vector3(
            _.get(this.dicomScanBoxConfig, ['center3', 'x'], 0),
            _.get(this.dicomScanBoxConfig, ['center3', 'y'], 0),
            _.get(this.dicomScanBoxConfig, ['center3', 'z'], 0)
          )
        }

        if (mriBoxExpand != 0) {
          let p = center.clone()
          let endPoint = center.clone()
          let startPoint = center.clone()
          const leftPoint = center.clone().add(cameraSizeDirection.clone().multiplyScalar(mriBoxSizeExpand / 2))
          const rightPoint = center.clone().add(cameraSizeDirection.clone().multiplyScalar(-mriBoxSizeExpand / 2))
          // Limit top
          if (this.scanPercentStartOfLandmark != 0) {
            if (this.scanPercentStartOfLandmark > 0 || !this.dicomLocalizerBoxCenter) {
              // Cut inside box
              p = center.clone().add(
                limitDirection
                  .clone()
                  .multiplyScalar(bias)
                  .multiplyScalar(mriBoxExpand / 2 - (mriBoxExpand * this.scanPercentStartOfLandmark) / 100)
              )
              startPoint = p
              endPoint = center.clone().add(
                limitDirection
                  .clone()
                  .multiplyScalar(bias)
                  .multiplyScalar(-mriBoxExpand / 2)
              )
            } else {
              const distanceFromLandmarkToBox = (Math.abs(this.scanPercentStartOfLandmark) / 100) * mriBoxExpand
              let centerLocalizer = new THREE.Vector3(
                _.get(this.dicomLocalizerBoxConfig, ['center3', 'x'], 0),
                _.get(this.dicomLocalizerBoxConfig, ['center3', 'y'], 0),
                _.get(this.dicomLocalizerBoxConfig, ['center3', 'z'], 0)
              )
              let expand = 0
              let centerTolerance = 0
              arrs.forEach((text) => {
                if (
                  _.has(this.dicomScanBoxConfig, [`${text}Direction3`]) &&
                  greatestAxisAbsXYZ(
                    _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'x']),
                    _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'y']),
                    _.get(this.dicomScanBoxConfig, [`${text}Direction3`, 'z'])
                  ) == limitDirText
                ) {
                  centerTolerance = center[text] - centerLocalizer[text]
                  expand =
                    Math.abs(
                      this.dicomLocalizerBoxConfig.dimensions3[text] - this.dicomScanBoxConfig.dimensions3[text]
                    ) / 2
                }
              })

              if (bias == 1) {
                expand = Math.max(0, expand - centerTolerance)
              } else {
                expand = Math.max(0, expand + centerTolerance)
              }

              if (distanceFromLandmarkToBox < expand) {
                expand = distanceFromLandmarkToBox
              }
              // Cut out side box
              p = center.clone().add(
                limitDirection
                  .clone()
                  .multiplyScalar(bias)
                  .multiplyScalar(mriBoxExpand / 2 + expand)
              )

              startPoint = p
              endPoint = center.clone().add(
                limitDirection
                  .clone()
                  .multiplyScalar(bias)
                  .multiplyScalar(-mriBoxExpand / 2)
              )
            }
            const n = bias == 1 ? limitDirection.clone().negate() : limitDirection.clone()
            const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, p)
            planes.push(plane)
          }
          return {
            planes,
            limit: {
              startPoint,
              endPoint,
              leftPoint,
              rightPoint,
            },
          }
        } else {
          return {
            planes: [],
            limit: null,
          }
        }
      }

      return {
        planes,
        limit: null,
      }
    },
    limitedCTLocalizerConfigBox() {
      if (this.dicomLocalizerBoxConfig) {
        const center = new THREE.Vector3(
          _.get(this.dicomLocalizerBoxConfig, ['center3', 'x'], 0),
          _.get(this.dicomLocalizerBoxConfig, ['center3', 'y'], 0),
          _.get(this.dicomLocalizerBoxConfig, ['center3', 'z'], 0)
        )
        const cameraUpDir = greatestAxisAbsXYZ(this.camera.up.x, this.camera.up.y, this.camera.up.z)
        const limitDirection = cameraUpDir == 'z' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0)
        const cameraSizeDirectionText = ['x', 'y', 'z'].filter(
          (text) => text != cameraUpDir && text != this.cameraDirAxisName
        )
        const cameraSizeDirection =
          cameraSizeDirectionText == 'x'
            ? new Vector3(1, 0, 0)
            : cameraSizeDirectionText == 'y'
            ? new Vector3(0, 1, 0)
            : new Vector3(0, 0, 1)
        let mriBoxExpand = 0
        let mriBoxSizeExpand = 0
        const arrs = ['x', 'y', 'z']
        arrs.forEach((text) => {
          if (
            _.has(this.dicomLocalizerBoxConfig, [`${text}Direction3`]) &&
            greatestAxisAbsXYZ(
              _.get(this.dicomLocalizerBoxConfig, [`${text}Direction3`, 'x']),
              _.get(this.dicomLocalizerBoxConfig, [`${text}Direction3`, 'y']),
              _.get(this.dicomLocalizerBoxConfig, [`${text}Direction3`, 'z'])
            ) == cameraUpDir
          ) {
            mriBoxExpand = _.get(this.dicomLocalizerBoxConfig, ['dimensions3', text])
          }
          if (
            _.has(this.dicomLocalizerBoxConfig, [`${text}Direction3`]) &&
            greatestAxisAbsXYZ(
              _.get(this.dicomLocalizerBoxConfig, [`${text}Direction3`, 'x']),
              _.get(this.dicomLocalizerBoxConfig, [`${text}Direction3`, 'y']),
              _.get(this.dicomLocalizerBoxConfig, [`${text}Direction3`, 'z'])
            ) == cameraSizeDirectionText
          ) {
            mriBoxSizeExpand = _.get(this.dicomLocalizerBoxConfig, ['dimensions3', text])
          }
        })

        const startPoint = center.clone().add(limitDirection.clone().multiplyScalar(mriBoxExpand / 2))
        const endPoint = center.clone().add(limitDirection.clone().multiplyScalar(-mriBoxExpand / 2))
        const leftPoint = center.clone().add(cameraSizeDirection.clone().multiplyScalar(mriBoxSizeExpand / 2))
        const rightPoint = center.clone().add(cameraSizeDirection.clone().multiplyScalar(-mriBoxSizeExpand / 2))

        return {
          startPoint,
          endPoint,
          leftPoint,
          rightPoint,
        }
      }
      return null
    },
    cssVariables() {
      // CSS variables based on softwareVersionPreference
      return {
        '--background-color':
          this.localSoftwareVersionPreference === 'xa'
            ? '#565656'
            : this.localSoftwareVersionPreference === 'r57' || this.localSoftwareVersionPreference === 'scanlab'
            ? '#ffffff'
            : '#000000',
        '--text-color':
          this.localSoftwareVersionPreference === 'xa'
            ? '#fff'
            : this.localSoftwareVersionPreference === 'r57' || this.localSoftwareVersionPreference === 'scanlab'
            ? '#000000'
            : '#ffffff',
      }
    },
    frameWaitMs() {
      switch (this.sliceFrameRate) {
        case 'High':
          return 100
        case 'Medium':
          return 200
        case 'Low':
          return 300
        case 'Budget':
          return 400
        default:
          return 100
      }
    },
  },
  watch: {
    selectedStackName: 'selectedStackNameChanged',
    stackConfig: 'onStackConfigChanged',
    // changing the stackQuestion also changes the Selection these days due to the initialSelection getting applied at that this
    // This introduces a slight bug in that the selected Slice Index of the StackConfig gets set back to the first when changing questions; but it's minor compared to huge bug this fixes that's important for the demo in the morning
    stackQuestion: 'onStackHelperChanged',
    answerCurrent: 'onStackHelperChanged',
    zoom: 'onZoomChanged',
    selections: {
      deep: true,
      handler: 'updateClickableQuestion',
    },
    satBandSelections: {
      deep: true,
      handler: 'updateSatBandGradeZone',
    },
    noSelections: {
      handler: 'updateClickableQuestion',
    },
    currentSatBandSelection: {
      deep: true,
      handler: 'updateSatBandGradeZone',
    },
    currentSelection: {
      deep: true,
      handler: 'updateClickableQuestion',
    },
    isPlayingTheSlices: 'handleScanningChanged',
    isPlaySlice: 'handleScanningChanged',
    windowCenter: 'onSliceViewWindowChange',
    windowWidth: 'onSliceViewWindowChange',
    selectedStackQuestionIndex: function () {
      this.showStackByViewOrientation()
      this.onSetSelectionToSliceMidPointIfQuestionIsNew()
      this.updateShaderMaterialForCTMode()
    },
    // configNameOfFirstSliceView: 'onConfigNameOfFirstSliceViewChanged',
    isMriMachineScanComplete: 'onIsMriMachineScanCompleteChange',
    scanPercentStartOfMRIMachine: 'updateShaderMaterialForCTMode',
    scanPercentOfMRIMachine: 'updateShaderMaterialForCTMode',
    stackConfigs: 'updateShaderMaterialForCTMode',
    previewLimitedCtModelPlanes: 'updateShaderMaterialForCTMode',
    stackHelperByStackIdent: function () {
      this.updateShaderMaterialForCTMode()
      this.updateShaderMaterialForMRMode()
    },
    isStartDrawPointSelectZone: 'onDrawPointSelectModeChange',
    isStartDrawSatBandZone: 'onDrawSatBandSelectionModeChange',
    indexSlice: function (curVal, oldVal) {
      this.onIndexSliceChange(curVal, oldVal)
      this.toggleVisibleUserSelectedPoint()
      if (this.allowSelection && this.pointSelectEditMode) {
        this.setPointSelectEditMode(false)
      }
      if (!this.isCTLab && this.isEditingQuestion && this.stackConfig?.name == this.selectedSatBandStackConfigName) {
        this.setSatBandEditMode(false)
      }
    },
    selectedPolygonPoints: 'updateClickableQuestion',
    selectedSatBandPolygonPoints: 'updateSatBandGradeZone',
    visibleSatBand: function () {
      this.updateProjectionOfSatBandGradeZone()
      this.updateSatBandGradeZone()
    },
    newRadius: function () {
      if (this.selectedPolygonPoints.length > 0) {
        this.updateClickableQuestion()
      }
    },
    async isSidebarExpanded(newValue) {
      await this.$nextTick(() => {
        console.log('Sidebar state changed, content updated!')
      })
    },
    newSatBandRadius: function () {
      if (this.selectedSatBandPolygonPoints.length > 0) {
        this.updateSatBandGradeZone()
      }
    },
    cornerDotSize: function () {
      if (this.pointSelectEditMode && this.currentSelectionMode == this.pointSelectModes.POLYGON) {
        this.updateClickableQuestion()
      }
    },
    cornerSatBandDotSize: function () {
      if (this.satBandEditMode && this.currentSatBandSelectionMode == this.pointSelectModes.POLYGON) {
        this.updateSatBandGradeZone()
      }
    },
    newRectangleHeight: function () {
      if (this.selectedPolygonPoints.length > 0) {
        this.updateClickableQuestion()
      }
    },
    newSatBandRectangleHeight: function () {
      if (this.selectedSatBandPolygonPoints.length > 0) {
        this.updateSatBandGradeZone()
      }
    },
    newRectangleWidth: function () {
      if (this.selectedPolygonPoints.length > 0) {
        this.updateClickableQuestion()
      }
    },
    newSatBandRectangleWidth: function () {
      if (this.selectedSatBandPolygonPoints.length > 0) {
        this.updateSatBandGradeZone()
      }
    },
    pointSelectEditMode: function () {
      this.updateClickableQuestion()
    },
    satBandEditMode: function () {
      this.updateSatBandGradeZone()
    },
    previewChosenSelection: function () {
      this.updatePreviewPointSelectAnswer()
      this.updateClickableQuestion()
    },
    selectedPointInfo: function () {
      this.toggleVisibleUserSelectedPoint()
    },
    userPointSelectAnswerDotSize: function () {
      this.toggleVisibleUserSelectedPoint()
    },
    selectedSatBandStackConfigName: function () {
      this.updateSatBandGradeZone()
    },
    isShowCriticalQuestionResult: function () {
      this.resetWindowWhenShowCriticalThinkingResult()
    },
    cssVariables: {
      handler(newVal) {
        // Apply each CSS variable to the document's root element
        Object.keys(newVal).forEach((key) => {
          document.documentElement.style.setProperty(key, newVal[key])
        })
      },
      immediate: true, // Run this watcher immediately to apply the initial values
    },
    isSelectRxWidgetActiveFlag(newVal, oldVal) {
      if (!newVal && this.referenceLineId === this.selectedReferenceLineId) {
        this.stackConfig = this.stackConfigOptions[this.indexOfSelectedViewOrientation].value
      }
    },
    IsCopyRxWidgetActiveFlag(newVal, oldVal) {
      if (!newVal && this.emitCopyRxAction && this.referenceLineId === this.selectedReferenceLineId) {
        this.setSelectionToSliceMidpoint(false)
      }
    },
    isAutoWLChecked(newVal, oldVal) {
      if (this.forScanning && newVal) {
        this.resetWindowing()
      }
    },
    frameWaitMs: {
      immediate: true,
      handler(ms) {
        // recreate throttled functions whenever the wait changes
        throttledDispatch = _.throttle((dispatch, action, payload) => {
          dispatch(action, payload)
        }, ms)

        throttledCombinedUpdate = _.throttle((dispatch, a1, p1, a2, p2) => {
          dispatch(a1, p1)
          dispatch(a2, p2)
        }, ms)

        // If need to store on `this`:
        // this.throttledDispatch = throttledDispatch
        // this.throttledCombinedUpdate = throttledCombinedUpdate
      },
    },
  },
  async mounted() {
    console.log('localSoftwareVersionPreference==========', this.localSoftwareVersionPreference)
    this.updateHeight()
    await this.$store.dispatch('threeJSSVGProvider/init')
    window.addEventListener('resize', this.updateHeight)
    // In critical thinking mode, reset previewChosenSelection before use
    if (!this.isShowPointSelectionAnswerArea && this.allowSelection && this.isPreviewCriticalThinkingQuestion) {
      this.resetPreviewChosenSelection()
    }
    this.elBox = this.$refs.box
    // Pick a default sliceConfig for this SliceView (prefer orientation that we are in, if available)

    if (this.isCTLab) {
      this.resetStackConfig()
      this.showStackByViewOrientation()
    } else {
      let stacksByOrientation = this.stackConfigsByOrientation[this.viewOrientation]
      if (this.selectedStackName) {
        this.selectedStackNameChanged()
      } else if (_.isEmpty(stacksByOrientation)) {
        this.stackConfig = this.stackConfigOfFirstLocalizer
        if (!this.stackConfig) {
          this.stackConfig = this.stackConfigOfFirstNonLocalizer
        }
      } else {
        this.stackConfig = this.stackConfigsByOrientation[this.viewOrientation][0]
      }
    }

    this.id = this._uid
    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    })
    if (this.isCTLab) {
      this.renderer.localClippingEnabled = true
    }
    this.onSetSizeOfRenderer()
    this.renderer.setClearColor(0x000000, 1) // 0x353535
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.renderer.domElement.id = `${this.amFullscreen ? 'full-' : ''}sliceview-${this.viewOrientation}`
    this.elBox.appendChild(this.renderer.domElement)
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost, false)
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored, false)

    // don't bother setting frustum correctly here, will do in resetCameraPan()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10000000)
    this.resetCameraPan()
    this.onZoomChanged()

    this.initInstanceGeometryAndMaterial()

    this.onWindowResize = _.debounce(() => {
      this.onSetSizeOfRenderer()
      this.resetCameraPan()
      this.geometryMustUpdate = true
    }, 50)

    window.addEventListener('resize', this.onWindowResize)
    // Disabled change windowLevel follow hot key
    // window.addEventListener('keypress', this.onKeyPress)

    this.updateShaderMaterialForCTMode()

    this.updateGeometries() // this sets the planeDirection right for the stackVolumeSelection

    this.scene.add(this.snapDraggableObjectContainer)
    this.snapDraggableObjects.push(this.snapDraggableObjectContainer)
    this.scene.add(this.projectionSatBandSelectionObjectContainer)
    this.dragControl = new DragControls(this.snapDraggableObjects, this.camera, this.renderer.domElement, 'move')
    this.dragControl.addEventListener('hoveron', this.onHoverDraggable)
    this.dragControl.addEventListener('dragend', this.onDragEnd)
    this.dragControl.addEventListener('dragstart', this.onDragStart)
    this.dragControl.addEventListener('drag', this.onDrag)

    this.stackVolumeSelections = []
    this.interactableInstances = []
    this.sliceViewId = uuidv4()

    // On dicom playground mode, should move slice box to center after init view
    if (this.isCTLab && !this.stackQuestion && !this.amFullscreen && !this.isMovedSliceBoxToCenter) {
      this.isMovedSliceBoxToCenter = true
      this.setSelectionToSliceMidpoint(true)
    }

    if (!this.forScanning) {
      this.$store.dispatch('selectionConfig/registerSliceView', {
        $store: this.$store,
        sliceViewId: this.sliceViewId,
        backgroundSlice: this.stackHelper.slice,
        scene: this.scene,
        camera: this.camera,
        onAddedStackVolumeSelection: (stackVolumeSelection) => {
          this.stackVolumeSelections = [...this.stackVolumeSelections, stackVolumeSelection]
          stackVolumeSelection.addDotDragControls(this.camera, this.renderer)
        },
        // This just trims local list of instances, doesn't set them up or clean them up
        onRemovedStackVolumeSelection: (stackVolumeSelections) => {
          this.stackVolumeSelections = [...stackVolumeSelections]
        },
      })
    }

    if (!this.isCTLab & !this.forScanning) {
      // for Interactables like SatBands
      this.$store.dispatch('interactableService/registerSliceView', {
        $store: this.$store,
        sliceViewId: this.sliceViewId,
        backgroundSlice: this.stackHelper.slice,
        scene: this.scene,
        camera: this.camera,
        onAddedInteractable: (interactableInstance) => {
          this.interactableInstances = [...this.interactableInstances, interactableInstance]
          interactableInstance.addDotDragControls(this.camera, this.renderer)
        },
        onRemovedInteractable: (interactableInstances) => {
          this.interactableInstances = [...interactableInstances]
        },
      })
    }

    // http://jsfiddle.net/zwxkpj1c/3/
    // this.controls = new AMI.TrackballOrthoControl(this.camera, this.elBox);
    // this.controls = new THREE.OrthographicTrackballControls(this.camera, this.elBox)
    // this.controls.target.set(this.originX, this.originY, this.originZ) // this line causes issues with changing between stackConfigs in dropdown
    // this.controls.noRotate = true // 3D changing direction
    // this.controls.noZoom = true
    // this.controls.noPan = true // rotate around camera
    // this.controls.noRoll = true
    // // this.controls.staticMoving = true;

    this.onSetSelectionToSliceMidPointIfQuestionIsNew()

    EventBus.$on('fullscreenChange', (event) => {
      this.onFullscreenChange(event)
    })

    // Allow selected stackConfig here to be changed from elsewhere if it matches the orientation
    EventBus.$on('SliceView_setStackConfig_forOrientation', this.onSetStackConfigForOrientation)
    EventBus.$on('SliceView_setStackConfig_forReconOrientation', this.onSetStackConfigForReconOrientation)
    // Disable ALL mouse button enabled SliceView controls
    EventBus.$on('mouseOutsideOfApp', () => {
      for (const mouseButtonIndex in mouseButtonIndexToName) {
        _.set(this.mouseButtonsDown, mouseButtonIndexToName[mouseButtonIndex], false)
      }
    })

    // identify when a user has released a mouse button outside of the SliceView component itself
    EventBus.$on('mouseButtonUp', (event) => {
      this.mouseUp(event, true)
    })

    EventBus.$on('sliceViewUpdateGeometries', this.updateGeometriesNextFrame)
    EventBus.$on('OnDeleteLastStack', this.onDeleteLastStack)
    EventBus.$on('OnShowExtraView', this.showStackByViewOrientation)
    EventBus.$on('OnPrepareStackHelperForIdent', this.onPrepareStackHelperForIdent)
    EventBus.$on('onDeleteCurrentPointSelect', this.onDeleteCurrentPointSelect)
    EventBus.$on('onDeleteAllCurrentPointSelect', this.onDeleteAllCurrentPointSelect)
    EventBus.$on('onMoveToMiddleSlice', this.onMoveToMiddleSlice)
    EventBus.$on('moveAllSelectionConfigToCenter', this.onSetSelectionToSliceMidPointIfQuestionIsNew)
    EventBus.$on('sliceViewCalcCenterPlaneIntersectionDir', this.onUpdateCenterPlaneIntersectionDir)

    this.requestAnimationId = requestAnimationFrame(() => {
      this.onFrame()
    })

    this.updateClickableQuestion()
    this.updateSatBandGradeZone()
    this.updatePreviewPointSelectAnswer()
    if (this.isAcquisitionQuestion || this.isReconstructionQuestion) {
      this.isVolumeViewMode = true
    }

    this.resetWindowWhenShowCriticalThinkingResult()
  },
  beforeDestroy() {
    // TODO EventBus off the rest of the events, too
    EventBus.$off('sliceViewUpdateGeometries', this.updateGeometriesNextFrame)
    EventBus.$off('OnDeleteLastStack', this.onDeleteLastStack)
    EventBus.$off('SliceView_setStackConfig_forOrientation', this.onSetStackConfigForOrientation)
    EventBus.$off('SliceView_setStackConfig_forReconOrientation', this.onSetStackConfigForReconOrientation)
    EventBus.$off('OnShowExtraView', this.showStackByViewOrientation)
    EventBus.$off('OnPrepareStackHelperForIdent', this.onPrepareStackHelperForIdent)
    EventBus.$off('onDeleteCurrentPointSelect', this.onDeleteCurrentPointSelect)
    EventBus.$off('onDeleteAllCurrentPointSelect', this.onDeleteAllCurrentPointSelect)
    EventBus.$off('onMoveToMiddleSlice', this.onMoveToMiddleSlice)
    EventBus.$off('moveAllSelectionConfigToCenter', this.onSetSelectionToSliceMidPointIfQuestionIsNew)
    EventBus.$off('sliceViewCalcCenterPlaneIntersectionDir', this.onUpdateCenterPlaneIntersectionDir)
    window.removeEventListener('resize', this.updateHeight)
    const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
    cancelAnimationFrame(this.requestAnimationId)

    if (this.updateProjectionOfSatBandGradeZoneTimeOut) {
      clearTimeout(this.updateProjectionOfSatBandGradeZoneTimeOut)
    }

    if (this.sliceViewIndex == this.sliceViewIndexWillShowResult) {
      this.$store.dispatch('stackService/setSliceViewIndexWillShowResult', -1)
    }

    window.removeEventListener('resize', this.onWindowResize)
    this.$store.dispatch('selectionConfig/unregisterSliceView', {
      sliceViewId: this.sliceViewId,
    })
    this.stackHelper.dispose()
    if (this.scene) {
      this.scene.dispose()
    }
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost)
      this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored)
      this.renderer.dispose()
      this.renderer.forceContextLoss()
      this.renderer.domElement.remove()
      this.renderer = null
    }

    if (this.interval) {
      clearInterval(this.interval)
    }
  },
  methods: {
    onContextLost(event) {
      event.preventDefault()
      const cancelAF = window.cancelAnimationFrame || window.mozCancelAnimationFrame
      cancelAF(this.requestAnimationId)
    },
    onContextRestored() {
      this.requestAnimationId = requestAnimationFrame(() => {
        this.onFrame()
      })
    },
    ...mapMutations('pointSelectService', [
      'addSelection',
      'setCurrentSelection',
      'setSelectedPointInfo',
      'removeSelection',
      'removeAllSelection',
      'setIsStartDrawPointSelectZone',
      'setTmpSelectedPolygonPoints',
      'setPointSelectEditMode',
      'adjustPointOfPolygon',
      'adjustPositionOfPointSelect',
      'addPreviewChosenSelection',
      'resetPreviewChosenSelection',
    ]),
    ...mapMutations('satBandService', [
      'setTmpSatBandSelectedPolygonPoints',
      'addSatBandSelection',
      'setSelectedSatBandViewOrientation',
      'setCurrentSatBandSelection',
      'setSelectedSatBandStackConfigName',
      'adjustPointOfSatBandPolygon',
      'adjustPositionOfSatBand',
      'setSatBandEditMode',
      'removeSatBandSelection',
      'removeAllSatBandSelection',
    ]),
    ...mapActions('selectionConfig', [
      'resetSelection',
      'smartRotateSelectionConfigDir',
      'assignValueToSelectionConfigs',
    ]),
    ...mapActions('stackService', [
      'setMriModelBbox',
      'setConfigNameOfFirstSliceView',
      'setSliceIndexOfFirstSliceView',
    ]),
    onSetSizeOfRenderer() {
      if (this.renderer) {
        this.renderer.setSize(this.elBox.offsetWidth, this.elBox.offsetHeight + 5)
      }
    },
    updateHeight() {
      this.screenHeight = window.innerHeight
    },
    onNoAnswerPointSelectQuestion() {
      EventBus.$emit('onNoAnswerPointSelectQuestion')
    },
    onConfirmPointSelectQuestion() {
      this.toggleFullscreen()
      EventBus.$emit('onConfirmPointSelectQuestion')
    },
    resetWindowWhenShowCriticalThinkingResult() {
      if (this.isShowCriticalQuestionResult) {
        this.resetWindowing()
      }
    },
    getPointSelectMaterialOpacity() {
      return this.isShowPointSelectionAnswerArea
        ? 0.85
        : this.isPreviewCriticalThinkingQuestion || this.isPreviewCriticalThinkingQuestionForFullScreen
        ? 0.2
        : 0
    },
    getSatBandMaterialOpacity() {
      return 1 //this.isEditingQuestion ? 0.85 : 0
    },
    initInstanceGeometryAndMaterial() {
      this.scene.remove(...this.scene.children.filter((el) => el.userData.userSelectedPointMesh))
      this.userSelectedPointMesh = new Mesh(this.pointSelectionCenterDotGeometry, this.pointSelectionDotMaterial)
      this.userSelectedPointMesh.renderOrder = 104
      this.userSelectedPointMesh.userData.userSelectedPointMesh = true
      this.userSelectedPointMesh.visible = false
      this.userSelectedPointMesh.scale.set(2, 2, 2)
      this.scene.add(this.userSelectedPointMesh)

      this.pointSelectionPolygonGeometry.translate(0, 0.5, 0)
      this.pointSelectionPolygonGeometry.rotateX(Math.PI / 2)

      this.pointSelectionMaterial.opacity = this.getPointSelectMaterialOpacity()
      this.pointSelectionHighlightMaterial.opacity = this.getPointSelectMaterialOpacity()
      this.pointSelectionPolygonMaterial.opacity = this.getPointSelectMaterialOpacity()
      this.pointSelectionShapeMaterial.opacity = this.getPointSelectMaterialOpacity()
      this.pointSelectionShapeHighlightMaterial.opacity = this.getPointSelectMaterialOpacity()

      this.satBandMaterial.opacity = this.getSatBandMaterialOpacity()
      this.satBandHighlightMaterial.opacity = this.getSatBandMaterialOpacity()
      this.satBandPolygonMaterial.opacity = this.getSatBandMaterialOpacity()
      this.satBandShapeMaterial.opacity = this.getSatBandMaterialOpacity()
      this.satBandShapeHighlightMaterial.opacity = this.getSatBandMaterialOpacity()

      this.pointSelectionDotGeometry = new THREE.SphereGeometry(1, 20, 20)

      this.$store.dispatch('threeJSSVGProvider/createInstance', {
        svgName: 'CursorMoveIcon',
        renderOrder: 104, // render above everything else, with a sort of z-order of 1
        callback: (iconObject) => {
          iconObject.scale.set(0.5, 0.5, 0.5)
          this.movePointSelectCenterIcon = iconObject
          this.movePointSelectCenterIcon.visible = false
          this.movePointSelectCenterIcon.children[0].renderOrder = 104
          this.movePointSelectCenterIcon.children[0].material.transparent = true
          this.movePointSelectCenterIcon.children[0].material.needsUpdate = true

          this.scene.add(this.movePointSelectCenterIcon)
        },
      })
    },
    onSetWindow(windowType) {
      const windowInfo = this.windowLevelWidths.find((el) => el.value == windowType)
      if (windowInfo) {
        this.windowWidth = windowInfo.windowWidth
        this.windowCenter = windowInfo.windowLevel

        this.geometryMustUpdate = true
      }
    },
    // Hover snap point on edit polygon mode
    onHoverDraggable() {
      this.renderer.domElement.style.cursor = `url('${ArrowExpandAllIconPng}') 8 8, nesw-resize`
    },
    onDragEnd(event) {
      isDragControlHandling = false
      const object = event.object
      if (_.has(this.selections, [_.get(object, ['userData', 'zoneId'])])) {
        if (_.get(object, ['userData', 'type']) == 'adjust') {
          this.adjustPolygonWhenDrag(event)
        }
        if (_.get(object, ['userData', 'type']) == 'move') {
          this.adjustPointSelectPositionWhenDrag(event)
        }
      }
      if (_.has(this.satBandSelections, [_.get(object, ['userData', 'zoneId'])])) {
        if (_.get(object, ['userData', 'type']) == 'adjust') {
          this.adjustPolygonWhenDrag(event, true)
        }
        if (_.get(object, ['userData', 'type']) == 'move') {
          this.adjustPointSelectPositionWhenDrag(event, true)
        }
      }
    },
    onDrag(event) {
      const object = event.object
      if (_.has(this.selections, [_.get(object, ['userData', 'zoneId'])])) {
        if (_.get(object, ['userData', 'type']) == 'adjust') {
          this.adjustPolygonWhenDrag(event)
        }
        if (_.get(object, ['userData', 'type']) == 'move') {
          this.adjustPointSelectPositionWhenDrag(event)
        }
      }
      if (_.has(this.satBandSelections, [_.get(object, ['userData', 'zoneId'])])) {
        if (_.get(object, ['userData', 'type']) == 'adjust') {
          this.adjustPolygonWhenDrag(event, true)
        }
        if (_.get(object, ['userData', 'type']) == 'move') {
          this.adjustPointSelectPositionWhenDrag(event, true)
        }
      }
    },
    adjustPointSelectPositionWhenDrag(event, isSatBand = false) {
      const object = event.object
      if (event.mouseEvent && _.has(object, ['userData', 'zoneId'])) {
        const zoneId = _.get(object, ['userData', 'zoneId'])
        let tmpMousePosition2 = new Vector2()
        let tmpMousePosition3 = new Vector3()
        getOffsetPosition(tmpMousePosition2, event.mouseEvent, this.elBox)
        this.getMouseSliceIntersection(tmpMousePosition3, tmpMousePosition2)
        const dataPosition = AMI.UtilsCore.worldToData(this.stackHelper.stack.lps2IJK, tmpMousePosition3)

        if (isSatBand) {
          const worldPosition = new THREE.Vector3(dataPosition.x, dataPosition.y, dataPosition.z).applyMatrix4(
            this.stackHelper.stack.ijk2LPS
          )
          this.adjustPositionOfSatBand({
            id: zoneId,
            position: worldPosition,
          })
        } else {
          this.adjustPositionOfPointSelect({
            id: zoneId,
            position: dataPosition,
          })
        }
      }
    },
    adjustPolygonWhenDrag(event, isSatBand = false) {
      const object = event.object
      if (event.mouseEvent && _.has(object, ['userData', 'zoneId'])) {
        const zoneId = _.get(object, ['userData', 'zoneId'])
        const pointIndex = _.get(object, ['userData', 'index'])
        let tmpMousePosition2 = new Vector2()
        let tmpMousePosition3 = new Vector3()
        getOffsetPosition(tmpMousePosition2, event.mouseEvent, this.elBox)
        this.getMouseSliceIntersection(tmpMousePosition3, tmpMousePosition2)
        const dataPosition = AMI.UtilsCore.worldToData(this.stackHelper.stack.lps2IJK, tmpMousePosition3)

        if (isSatBand) {
          const worldPosition = new THREE.Vector3(dataPosition.x, dataPosition.y, dataPosition.z).applyMatrix4(
            this.stackHelper.stack.ijk2LPS
          )
          this.adjustPointOfSatBandPolygon({
            id: zoneId,
            index: pointIndex,
            position: worldPosition,
          })
        } else {
          this.adjustPointOfPolygon({
            id: zoneId,
            index: pointIndex,
            position: dataPosition,
          })
        }
      }
    },
    onDragStart() {
      isDragControlHandling = true
    },
    onPrepareStackHelperForIdent({ stackIdent }) {
      let stackHelperByStackIdent = this.stackHelperByStackIdent || {}
      if (stackHelperByStackIdent[stackIdent]) {
        return
      } else {
        const stackByStackIdent = this.$store.state.dicomService.stackByStackIdent[stackIdent]
        if (!this.stack) {
          return
        }
        let stackHelper = makeStackHelper(stackByStackIdent)
        _.set(this, ['stackHelperByStackIdent', stackIdent], stackHelper)
        return
      }
    },
    onSetSelectionToSliceMidPointIfQuestionIsNew() {
      if (
        this.isCTLab &&
        this.isEditingQuestion &&
        this.sliceViewIndex == 1 &&
        !this.answerDataCurrentHasSelectionConfigData
      ) {
        this.$store.dispatch('selectionConfig/setAllSelectionToSliceMidpoint', [
          getMidpointFromStackHelperSlice(this.stackHelper.slice),
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: -1 },
          { x: 0, y: 0, z: 1 },
          true,
        ])
      }
    },
    onCopySelection() {
      if (!this.isCTLab) {
        return
      }

      if (_.has(this.stackConfig, ['questionIndex']) && _.has(this.stackConfig, ['answerData'])) {
        const questionIndex = _.get(this.stackConfig, ['questionIndex'])
        this.$store.dispatch('questionService/copySelectionConfigFromQuestionIndexAnswer', {
          questionIndex,
          stackConfig: this.stackConfig,
        })
      }
    },
    requireResetRenderer() {
      this.onWindowResize()
    },
    onIsMriMachineScanCompleteChange() {
      if (this.isMriMachineScanComplete && !this.isEditingQuestion) {
        this.setSelectionToSliceMidpoint(true)
      }
      this.updateShaderMaterialForCTMode()
    },
    // onConfigNameOfFirstSliceViewChanged() {
    //   // this.showStackByViewOrientation()
    // },
    onSliceViewWindowChange() {
      EventBus.$emit('onSliceViewWindowChange', { windowLevel: this.windowCenter, windowWidth: this.windowWidth })
    },
    onSetStackConfigForReconOrientation({ stackConfig }) {
      // Check yellow out line
      // this.selectedStackVolumeSelection is not bind new value, we have to calculate planeClosest manually
      let planeClosest = this.getPlaneClosestOfSliceView()
      if (stackConfig && Math.abs(planeClosest.z)) {
        // Set the index of the sliceView will show result
        this.$store.dispatch('stackService/setSliceViewIndexWillShowResult', +this.sliceViewIndex)
      }

      this.tempStackConfig = stackConfig
    },
    getPlaneClosestOfSliceView() {
      let dir = this.stackHelper.slice.planeDirection
      const selectionConfigCurrent = this.$store.getters['selectionConfig/selectionConfigCurrent']
      let { xDirection3, yDirection3, zDirection3 } = selectionConfigCurrent
      if (dir) {
        let dirAbs = _.mapValues(dir, Math.abs)
        // Check dir reversed
        if (dirAbs.y >= dirAbs.x && dirAbs.y >= dirAbs.z) {
          dir = dir.clone().negate()
        }

        let planes = [
          {
            x: 1,
            y: null,
            z: null,
            dir: xDirection3,
          },
          {
            x: -1,
            y: null,
            z: null,
            dir: xDirection3.clone().negate(),
          },
          {
            x: null,
            y: 1,
            z: null,
            dir: yDirection3,
          },
          {
            x: null,
            y: -1,
            z: null,
            dir: yDirection3.clone().negate(),
          },
          {
            x: null,
            y: null,
            z: 1,
            dir: zDirection3,
          },
          {
            x: null,
            y: null,
            z: -1,
            dir: zDirection3.clone().negate(),
          },
        ]

        return _.minBy(planes, (plane) => {
          return plane.dir.distanceToSquared(dir)
        })
      } else {
        return {
          x: null,
          y: null,
          z: 1,
          dir: zDirection3,
        }
      }
    },
    onSetStackConfigForOrientation({ viewOrientation, stackConfig }) {
      if (this.isCTLab) {
        // Acquisition question or dicom playground mode
        if (this.isAcquisitionQuestion || !this.questionSet) {
          let planeClosest = this.getPlaneClosestOfSliceView()
          if (stackConfig && Math.abs(planeClosest.z)) {
            // Set the index of the sliceView will show result
            this.$store.dispatch('stackService/setSliceViewIndexWillShowResult', +this.sliceViewIndex)
          }
          this.tempStackConfig = stackConfig
        } else if (this.isPlaySlice && viewOrientation === this.viewOrientation) {
          this.tempStackConfig = stackConfig
        }
      } else if (viewOrientation === this.viewOrientation) {
        this.stackConfig = stackConfig
      }
    },
    showStackByViewOrientation() {
      if (this.isShowOrientationView && this.isCTLab && !this.isEditingQuestion) {
        let newStackConfig = null
        if (!this.isPlaySlice && !this.isLocalizerQuestion) {
          let stacksByOrientation = _.filter(this.stackConfigsByOrientation[this.viewOrientation], (el) => !el.hidden)
          if (_.isEmpty(stacksByOrientation)) {
            newStackConfig = this.stackConfigOfFirstLocalizer
            if (!newStackConfig) {
              newStackConfig = this.stackConfigOfFirstNonLocalizer
            }
          } else {
            // pick first of my orientation
            newStackConfig = _.filter(this.stackConfigsByOrientation[this.viewOrientation], (el) => !el.hidden)[0]

            let extraViews = this.stackConfigs.filter(
              (el) => el.name.includes(this.extraScanBaseName) && el.name.includes(this.configNameOfFirstSliceView)
            )
            if (!this.configNameOfFirstSliceView.includes(this.extraScanBaseName) && extraViews.length > 1) {
              // calculate view orientation
              if (this.sliceViewIndexWillShowResult == -1 || this.sliceViewIndexWillShowResult == 0) {
                if (this.sliceViewIndex == 1) {
                  newStackConfig = extraViews[0]
                }
                if (this.sliceViewIndex == 2) {
                  newStackConfig = extraViews[1]
                }
              } else if (this.sliceViewIndexWillShowResult == 1) {
                if (this.sliceViewIndex == 0) {
                  newStackConfig = extraViews[0]
                }
                if (this.sliceViewIndex == 2) {
                  newStackConfig = extraViews[1]
                }
              } else if (this.sliceViewIndexWillShowResult == 2) {
                if (this.sliceViewIndex == 0) {
                  newStackConfig = extraViews[0]
                }
                if (this.sliceViewIndex == 1) {
                  newStackConfig = extraViews[1]
                }
              }
            }
          }
        } else if (this.isLocalizerQuestion) {
          // pick first of my orientation
          newStackConfig = _.get(
            _.filter(this.stackConfigsByOrientation[this.viewOrientation] || [], (el) => el.isLocalizer && !el.hidden),
            [0]
          )

          // but if it's hidden, but anything that's not hidden
          if (!newStackConfig || newStackConfig.hidden) {
            newStackConfig = this.getAnotherLocalizerView()
          }
          if (!newStackConfig) {
            let stacksByOrientation = this.stackConfigsByOrientation[this.viewOrientation]
            if (_.isEmpty(stacksByOrientation)) {
              newStackConfig = this.stackConfigOfFirstLocalizer
              if (!newStackConfig) {
                newStackConfig = this.stackConfigOfFirstNonLocalizer
              }
            }
          }
        } else {
          return
        }

        if (
          _.isEqual(_.get(this.stackConfig, 'name'), _.get(newStackConfig, 'name')) &&
          _.isEqual(_.size(_.get(this.stackConfig, 'slices')), _.size(_.get(newStackConfig, 'slices')))
        ) {
          return
        }
        this.stackConfig = newStackConfig
        this.indexSliceOverwrite = Math.floor((_.size(_.get(this.stackConfig, 'slices')) || 1) / 2) || 0
      }
    },
    async onDeleteLastStack() {
      const currentConfig = _.find(this.stackConfigs, { name: this.selectedStackName })
      if (!currentConfig) {
        const mergedStackConfigName = _.get(
          _.reverse(_.cloneDeep(this.stackConfigs)).find(
            (el) =>
              !el.name.includes(this.extraScanBaseName) &&
              el.isConfigOfCTLabMode &&
              _.get(el, ['questionIndex'], -1) == this.selectedStackQuestionIndex
          ),
          'name',
          ''
        )
        if (mergedStackConfigName) {
          let extraViews = this.stackConfigs.filter(
            (el) => el.name.includes(this.extraScanBaseName) && el.name.includes(mergedStackConfigName)
          )
          let extraViewNames = ['Axial', 'Coronal', 'Sagittal']
          extraViewNames = extraViewNames.filter(
            (el) =>
              !_.some(
                extraViews.map((o) => o.name),
                (o) => o.includes(el)
              )
          )
          if (extraViewNames.length > 0) {
            const newStackConfig = _.find(this.stackConfigs, { name: mergedStackConfigName })
            if (newStackConfig) {
              if (extraViewNames[0] == 'Axial') {
                if (this.sliceViewIndex == 0) {
                  this.stackConfig = newStackConfig
                  await this.$store.dispatch('stackService/setSliceViewIndexWillShowResult', 0)
                  await this.setConfigNameOfFirstSliceView(this.stackConfig?.name)
                  EventBus.$emit('OnShowExtraView')
                }
              } else if (extraViewNames[0] == 'Coronal') {
                if (this.sliceViewIndex == 1) {
                  this.stackConfig = newStackConfig
                  await this.$store.dispatch('stackService/setSliceViewIndexWillShowResult', 1)
                  await this.setConfigNameOfFirstSliceView(this.stackConfig?.name)
                  EventBus.$emit('OnShowExtraView')
                }
              } else if (extraViewNames[0] == 'Sagittal') {
                if (this.sliceViewIndex == 2) {
                  this.stackConfig = newStackConfig
                  await this.$store.dispatch('stackService/setSliceViewIndexWillShowResult', 2)
                  await this.setConfigNameOfFirstSliceView(this.stackConfig?.name)
                  EventBus.$emit('OnShowExtraView')
                }
              }
            } else {
              this.resetStackConfig()
            }
          } else {
            this.resetStackConfig()
          }
        } else {
          // Pick a default sliceConfig for this SliceView (prefer orientation that we are in, if available)
          this.resetStackConfig()
        }
      }
    },
    getAnotherLocalizerView() {
      if (!this.isCTLab) {
        return _.reject(_.flatMap(this.stackConfigsByOrientation), 'hidden')[0]
      } else {
        let newConfig = null
        new Array('x', 'y', 'z')
          .filter((el) => el != this.viewOrientation)
          .forEach((el) => {
            if (
              !newConfig &&
              _.filter(this.stackConfigsByOrientation[el], { hidden: false, isLocalizer: true }).length > 0
            ) {
              newConfig = _.filter(this.stackConfigsByOrientation[el], { hidden: false, isLocalizer: true })[0]
            }
          })
        if (!newConfig) {
          newConfig = _.filter(_.flatMap(this.stackConfigsByOrientation), { hidden: false, isLocalizer: true })[0]
        }
        return newConfig || this.stackConfig
      }
    },
    resetStackConfig() {
      let stacksByOrientation = this.stackConfigsByOrientation[this.viewOrientation]
      if (this.selectedStackName) {
        this.selectedStackNameChanged()
      } else if (_.isEmpty(stacksByOrientation)) {
        this.stackConfig = this.stackConfigOfFirstLocalizer
        if (!this.stackConfig) {
          this.stackConfig = this.stackConfigOfFirstNonLocalizer
        }
      } else {
        // pick first of my orientation
        this.stackConfig = this.stackConfigsByOrientation[this.viewOrientation][0]
        // but if it's hidden, but anything that's not hidden
        if (this.stackConfig.hidden) {
          this.stackConfig = this.getAnotherLocalizerView()
        }
      }
      // this.setSliceIndex(0, false)
    },
    handleScanningChanged() {
      if (!this.isPlaySlice) {
        return
      }
      if (
        !this.isPlayingTheSlices ||
        (this.isLocalizerQuestion && !this.isMriMachineScanComplete && !this.isEditingQuestion)
      ) {
        if (this.interval) {
          clearInterval(this.interval)
        }
        this.interval = null
      } else {
        this.stackConfig = this.tempStackConfig
        this.$store.dispatch('questionService/setIsLoadingDataToPlaySlice', false)
        clearInterval(this.interval)
        this.interval = null
        if (this.stackConfigSlicesAmount && this.stackConfigSlicesAmount > 1) {
          let intervalTime = this.isAcquisitionQuestion ? 400 : 200
          if (this.isAcquisitionQuestion && _.has(this.stackConfig, ['scanDuration'])) {
            const scanDuration = _.get(this.stackConfig, ['scanDuration'], 1) * 1000
            intervalTime = scanDuration / this.stackConfigSlicesAmount
          }
          this.interval = setInterval(() => {
            let currentIndexSliceSlider = this.indexSlice + 1

            let index = clamp(currentIndexSliceSlider, 1, this.stackConfigSlicesAmount - 1)
            this.setSliceIndex(index)
            if (this.isPlaySlice && this.isCTLab) {
              EventBus.$emit('onIndexSliceChange', index, this.stackConfigSlicesAmount)
            }

            if (index >= this.stackConfigSlicesAmount - 1) {
              EventBus.$emit('EndAutoRunSlices')
              clearInterval(this.interval)
              // setTimeout(() => {
              //   this.setSliceIndex(this.stackConfigSlicesAmount - 1, true)
              // }, 1000)
            }
          }, intervalTime)
        } else {
          EventBus.$emit('EndAutoRunSlices')
        }
      }
    },
    selectedStackNameChanged() {
      if (this.selectedStackName) {
        this.stackConfig = _.find(this.stackConfigs, { name: this.selectedStackName })
      }
    },
    getIntersectionDirOfTwoPlanes(plane1, plane2) {
      const direction = new THREE.Vector3().crossVectors(plane1.normal, plane2.normal).normalize()
      if (direction.length() == 0) {
        return null
      } else {
        return direction.normalize()
      }
    },
    getCenterPlaneIntersectionLine() {
      const selectionConfig = this.$store.getters['selectionConfig/selectionConfigCurrent']
      const { center3, xDirection3, yDirection3 } = selectionConfig
      const centerPlaneDir = xDirection3.clone().cross(yDirection3).normalize()

      const centerSlicePlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        new THREE.Vector3(centerPlaneDir.x, centerPlaneDir.y, centerPlaneDir.z),
        new THREE.Vector3(center3.x, center3.y, center3.z)
      )

      if (!this.stackHelper || !this.stackHelper.slice) {
        return null
      }

      let planeDirection = this.stackHelper.slice.planeDirection
      let planePosition = this.stackHelper.slice.planePosition
      const stackHelperPlane = new Plane().setFromNormalAndCoplanarPoint(planeDirection, planePosition)
      return this.getIntersectionDirOfTwoPlanes(centerSlicePlane, stackHelperPlane)
    },
    activateThisSliceView() {
      if (!this.amFullscreen && this.camera) {
        this.$store.dispatch('selectionConfig/setReferenceSliceCornersForSliceViewId', {
          sliceViewId: this.referenceLineId,
          bgSliceCorners: getBackgroundSliceCorners(this),
        })
        this.onUpdateCenterPlaneIntersectionDir()
      }
    },
    onUpdateCenterPlaneIntersectionDir() {
      if (this.debounceCenterPlaneIntersectionDir) {
        clearTimeout(this.debounceCenterPlaneIntersectionDir)
      }

      const handleEvent = () => {
        try {
          if (!this.amFullscreen && this.camera) {
            this.$store.dispatch('selectionConfig/setCenterPlaneIntersectionDirBySliceViewId', {
              sliceViewId: this.referenceLineId,
              dir: this.getCenterPlaneIntersectionLine(),
            })
          }
        } catch (err) {
          console.error(err)
        }
      }

      this.debounceCenterPlaneIntersectionDir = setTimeout(() => {
        handleEvent()
      }, 100)
    },
    resetWindowing() {
      const middleFrameIndex = Math.floor(this.stackHelper.stack.frame.length / 2)
      const middleFrame = this.stackHelper.stack.frame[middleFrameIndex]
      // https://github.com/FNNDSC/ami/blob/master/src/models/models.stack.js
      this.windowWidth = middleFrame.windowWidth || this.stackHelper.stack.minMax[1] - this.stackHelper.stack.minMax[0]
      this.windowCenter = middleFrame.windowCenter || this.stackHelper.stack.minMax[0] + this.windowWidth / 2
      this.geometryMustUpdate = true
    },

    resetCameraPan() {
      this.clientWidthHalf = this.elBox.offsetWidth / 2
      this.clientHeightHalf = this.elBox.offsetHeight / 2

      let offset = 0
      // PAN camera by half of world width, if from Frames
      // FromFrames Camera pan would start in the bottom-left corner usually, so offset it by roughly half the world diameter
      if (this.stackConfigIsFromFrames && this.stackWorldBoundingBoxDimensions) {
        // This math might be off if the localizer orientation is vastly not axis-alligned
        // Might need some sort of vector project of camera vs world bounding box
        // but seems to work pretty well in example DICOM localizer we have so far
        let { x, y, z } = this.stackWorldBoundingBoxDimensions
        offset = Math.max(x, y, z) * 0.5
        log.debug('worldBoundsDims', x, y, z, '->', offset)
      }
      this.offsetForCameraCenteringBase = offset

      this.refreshCameraFraming()
    },
    shouldHighlightSelection(id, index) {
      const currentSelectionId = _.get(this.currentSelection, ['id'])
      if (currentSelectionId == id) {
        return true
      }
      // In preview critical thinking question modal
      if (this.isPreviewCriticalThinkingQuestion || this.isPreviewCriticalThinkingQuestionForFullScreen) {
        const answerSelectionId = _.get(this.previewChosenSelection, [this.indexSlice, 'selectionId'])
        if (!_.isNil(answerSelectionId) && index == this.indexSlice) {
          return true
        }
      }

      return false
    },
    shouldHighlightSatBandZone(id) {
      const currentSelectionId = _.get(this.currentSatBandSelection, ['id'])
      if (currentSelectionId == id) {
        return true
      }

      return false
    },
    // event
    // {renderPosition, radius, position}
    createMesh(zoneId, isHighLight = false, isSatBand) {
      let mesh = new THREE.Mesh(
        this.pointSelectionGeometry,
        isSatBand
          ? isHighLight
            ? this.satBandHighlightMaterial
            : this.satBandMaterial
          : isHighLight
          ? this.pointSelectionHighlightMaterial
          : this.pointSelectionMaterial
      )
      mesh.renderOrder = 100
      mesh.visible = false
      mesh.userData = { circle: true, id: zoneId }
      this.scene.add(mesh)
      return mesh
    },
    drawCirclePolygon(points, flatPoints, zoneId, isHighLight = false, isSatBand = false) {
      const group = new Group()

      for (let i = 0; i < points.length; i++) {
        const startPoint = points[i]
        const endPoint = points[(i + 1) % points.length]

        const line = new Mesh(
          this.pointSelectionPolygonGeometry,
          isSatBand ? this.satBandPolygonMaterial : this.pointSelectionPolygonMaterial
        )
        line.scale.set(1, 1, endPoint.distanceTo(startPoint))
        line.position.copy(startPoint)
        line.lookAt(endPoint)
        line.renderOrder = 101
        group.add(line)
      }
      const shape = this.drawCircleShapeFromPoint(points, flatPoints, zoneId, isHighLight, isSatBand)
      if (shape) {
        group.add(shape)
      }

      group.userData = {
        circle: true,
      }
      this.scene.add(group)
      return group
    },
    updateClickableQuestion() {
      if (this.movePointSelectCenterIcon) {
        this.movePointSelectCenterIcon.visible = false
      }
      if (!this.scene || !this.showPointSelect) {
        // too early or not needed
        return
      }
      this.snapDraggableObjectContainer.remove(...this.snapDraggableObjectContainer.children)
      if (this.$store.state.pointSelectService.noSelections) {
        Object.values(this.pointSelectionMeshes).forEach((m) => this.scene.remove(m))
        this.pointSelectionMeshes = {}
        this.geometryMustUpdate = true
        return
      }
      const selections = this.$store.state.pointSelectService.selections ?? {}
      if (selections) {
        // create meshes for each position
        _.forOwn(selections, (position) => {
          const mode = _.get(position, ['mode'], this.pointSelectModes.CIRCLE)
          if (
            mode == this.pointSelectModes.CIRCLE &&
            _.has(position, ['x']) &&
            _.has(position, ['y']) &&
            _.has(position, ['z'])
          ) {
            if (this.pointSelectionMeshes[position.id]) {
              this.scene.remove(this.pointSelectionMeshes[position.id])
              delete this.pointSelectionMeshes[position.id]
            }
            if (!this.pointSelectionMeshes[position.id]) {
              this.pointSelectionMeshes[position.id] = this.createMesh(
                position.id,
                this.shouldHighlightSelection(position.id, _.get(position, ['indexSlice'], -1))
              )
            }

            const worldPosition = new THREE.Vector3(position.x, position.y, position.z).applyMatrix4(
              this.stackHelper.stack.ijk2LPS
            )

            if (_.isNil(position.radius)) {
              position.radius = this.newRadius
            }

            this.pointSelectionMeshes[position.id].position.set(worldPosition.x, worldPosition.y, worldPosition.z)
            this.pointSelectionMeshes[position.id].scale.set(position.radius, position.radius, position.radius)

            this.pointSelectionMeshes[position.id].visible = position.indexSlice == this.indexSlice

            // Draw snap to edit polygon
            if (this.allowSelection && this.pointSelectEditMode && position.id == this.currentSelection?.id) {
              this.showMovePointSelectCenter(worldPosition)
              this.addMovePointSelectCenterBackground(worldPosition, position.id)
            }
          } else if (
            mode == this.pointSelectModes.RECTANGLE &&
            _.has(position, ['x']) &&
            _.has(position, ['y']) &&
            _.has(position, ['z'])
          ) {
            if (this.pointSelectionMeshes[position.id]) {
              this.scene.remove(this.pointSelectionMeshes[position.id])
              delete this.pointSelectionMeshes[position.id]
            }
            const worldPosition = new THREE.Vector3(position.x, position.y, position.z).applyMatrix4(
              this.stackHelper.stack.ijk2LPS
            )
            if (_.isNil(position.width)) {
              position.width = this.newRectangleWidth
            }
            if (_.isNil(position.height)) {
              position.height = this.newRectangleHeight
            }

            this.pointSelectionMeshes[position.id] = this.drawRectangle(
              worldPosition,
              position,
              this.shouldHighlightSelection(position.id, _.get(position, ['indexSlice'], -1))
            )
            this.pointSelectionMeshes[position.id].visible = position.indexSlice == this.indexSlice
            if (this.allowSelection && this.pointSelectEditMode && position.id == this.currentSelection?.id) {
              this.showMovePointSelectCenter(worldPosition)
              this.addMovePointSelectCenterBackground(worldPosition, position.id)
            }
          } else if (_.has(position, ['points']) && this.pointSelectModes.POLYGON) {
            if (this.pointSelectionMeshes[position.id]) {
              this.scene.remove(this.pointSelectionMeshes[position.id])
              delete this.pointSelectionMeshes[position.id]
            }
            const worldPoints = _.get(position, ['points'], []).map((vec3) => {
              return new THREE.Vector3(vec3.x, vec3.y, vec3.z).applyMatrix4(this.stackHelper.stack.ijk2LPS)
            })
            this.pointSelectionMeshes[position.id] = this.drawPolygon(
              worldPoints,
              position.id,
              this.shouldHighlightSelection(position.id, _.get(position, ['indexSlice'], -1))
            )

            this.pointSelectionMeshes[position.id].visible = position.indexSlice == this.indexSlice

            // Draw snap to edit polygon
            if (this.allowSelection && this.pointSelectEditMode && position.id == this.currentSelection?.id) {
              worldPoints.forEach((vec3, index) => {
                let dot = new THREE.Mesh(this.pointSelectionDotGeometry, this.pointSelectionDotMaterial)
                dot.userData = {
                  zoneId: position.id,
                  index,
                  type: 'adjust',
                }
                dot.renderOrder = 102
                dot.scale.set(
                  Math.max(1, this.cornerDotSize),
                  Math.max(1, this.cornerDotSize),
                  Math.max(1, this.cornerDotSize)
                )
                dot.position.copy(vec3)

                this.snapDraggableObjectContainer.add(dot)
              })

              const averageX = _.mean(worldPoints.map((el) => el.x))
              const averageY = _.mean(worldPoints.map((el) => el.y))
              const averageZ = _.mean(worldPoints.map((el) => el.z))
              const worldPosition = new Vector3(averageX, averageY, averageZ)
              this.showMovePointSelectCenter(worldPosition)
              this.addMovePointSelectCenterBackground(worldPosition, position.id)
            }
          }
        })

        Object.keys(this.pointSelectionMeshes).forEach((mKey) => {
          if (!selections[mKey]) {
            // clear out old meshes
            this.scene.remove(this.pointSelectionMeshes[mKey])
            delete this.pointSelectionMeshes[mKey]
          }
        })
      }

      if (this.pointSelectionMeshes['drawing']) {
        this.scene.remove(this.pointSelectionMeshes['drawing'])
        delete this.pointSelectionMeshes['drawing']
      }
      if (this.selectedPolygonPoints) {
        if (this.selectedPolygonPoints.length == 1 && this.pointSelectMode == this.pointSelectModes.CIRCLE) {
          this.pointSelectionMeshes['drawing'] = this.createMesh('drawing')
          const position = {
            x: this.selectedPolygonPoints[0].x,
            y: this.selectedPolygonPoints[0].y,
            z: this.selectedPolygonPoints[0].z,
          }
          const worldPosition = new THREE.Vector3(position.x, position.y, position.z).applyMatrix4(
            this.stackHelper.stack.ijk2LPS
          )

          if (_.isNil(position.radius)) {
            position.radius = this.newRadius
          }

          this.pointSelectionMeshes['drawing'].position.set(worldPosition.x, worldPosition.y, worldPosition.z)
          this.pointSelectionMeshes['drawing'].scale.set(position.radius, position.radius, position.radius)
          this.pointSelectionMeshes['drawing'].visible = true
        } else if (this.selectedPolygonPoints.length == 1 && this.pointSelectMode == this.pointSelectModes.RECTANGLE) {
          const position = {
            x: this.selectedPolygonPoints[0].x,
            y: this.selectedPolygonPoints[0].y,
            z: this.selectedPolygonPoints[0].z,
          }
          const worldPosition = new THREE.Vector3(position.x, position.y, position.z).applyMatrix4(
            this.stackHelper.stack.ijk2LPS
          )
          if (_.isNil(position.width)) {
            position.width = this.newRectangleWidth
          }
          if (_.isNil(position.height)) {
            position.height = this.newRectangleHeight
          }
          position.id = 'drawing'
          this.pointSelectionMeshes['drawing'] = this.drawRectangle(worldPosition, position)
          this.pointSelectionMeshes['drawing'].visible = true
        } else if (this.selectedPolygonPoints.length > 1) {
          const worldPoints = this.selectedPolygonPoints.map((vec3) => {
            return new THREE.Vector3(vec3.x, vec3.y, vec3.z).applyMatrix4(this.stackHelper.stack.ijk2LPS)
          })
          this.pointSelectionMeshes['drawing'] = this.drawPolygon(worldPoints, 'drawing')
          this.pointSelectionMeshes['drawing'].visible = true
        }
      }
      this.geometryMustUpdate = true
    },
    getGlobalPolygonPointsFromSatbandSelection(selection) {
      const mode = _.get(selection, ['mode'], POINT_SELECT_MODES.CIRCLE)
      if (mode == POINT_SELECT_MODES.CIRCLE) {
        const worldPosition = new THREE.Vector3(selection.x, selection.y, selection.z)
        const radius = _.get(selection, ['radius'], 1)
        if (_.has(selection, ['cameraSideDir']) && _.has(selection, ['cameraUpDir'])) {
          const points = createHexagonPoints(radius)
          const zVector = new THREE.Vector3(0, 0, 1)
          const cameraUpDir = new Vector3(selection.cameraUpDir.x, selection.cameraUpDir.y, selection.cameraUpDir.z)
          const cameraSideDir = new Vector3(
            selection.cameraSideDir.x,
            selection.cameraSideDir.y,
            selection.cameraSideDir.z
          )
          const cameraViewDir = cameraSideDir.clone().cross(cameraUpDir).normalize()
          const quaternion = new THREE.Quaternion().setFromUnitVectors(zVector, cameraViewDir)
          points.forEach((point) => {
            point.applyQuaternion(quaternion).add(worldPosition)
          })

          return points
        }
      } else if (mode == POINT_SELECT_MODES.RECTANGLE) {
        const worldPosition = new THREE.Vector3(selection.x, selection.y, selection.z)
        if (_.has(selection, ['cameraSideDir']) && _.has(selection, ['cameraUpDir'])) {
          const cameraSideDir = new Vector3(
            selection.cameraSideDir.x,
            selection.cameraSideDir.y,
            selection.cameraSideDir.z
          )
          const width = _.get(selection, ['width'], 1)
          const height = _.get(selection, ['height'], 1)
          const cameraUpDir = new Vector3(selection.cameraUpDir.x, selection.cameraUpDir.y, selection.cameraUpDir.z)

          const fourCornerArray = [
            [1, 1],
            [-1, 1],
            [-1, -1],
            [1, -1],
          ]
          const points = []
          fourCornerArray.forEach((array) => {
            points.push(
              new Vector3()
                .copy(worldPosition)
                .add(
                  cameraSideDir
                    .clone()
                    .multiplyScalar(array[0])
                    .multiplyScalar(width / 2)
                )
                .add(
                  cameraUpDir
                    .clone()
                    .multiplyScalar(array[1])
                    .multiplyScalar(height / 2)
                )
            )
          })

          return points
        }
      } else if (mode == POINT_SELECT_MODES.POLYGON) {
        if (_.has(selection, ['points'])) {
          const points = _.get(selection, ['points'], []).map((vec3) => {
            return new THREE.Vector3(vec3.x, vec3.y, vec3.z)
          })

          return points
        }
      }
      return []
    },
    updateProjectionOfSatBandGradeZone() {
      if (this.updateProjectionOfSatBandGradeZoneTimeOut) {
        clearTimeout(this.updateProjectionOfSatBandGradeZoneTimeOut)
      }
      this.updateProjectionOfSatBandGradeZoneTimeOut = setTimeout(() => {
        const shouldRenderSatBandIfRemove = this.projectionSatBandSelectionObjectContainer.children.length > 0
        this.projectionSatBandSelectionObjectContainer.remove(
          ...this.projectionSatBandSelectionObjectContainer.children
        )
        if (this.isCTLab || !this.scene || !this.isEditingQuestion) {
          // too early or not needed
          return
        }
        if (!this.visibleSatBand) {
          this.geometryMustUpdate |= shouldRenderSatBandIfRemove
          return
        }

        const selections = this.$store.state.satBandService.satBandSelections ?? {}
        _.forOwn(selections, (selection) => {
          if (selection?.stackName == this.stackConfig?.name) {
            return
          }

          const points = this.getGlobalPolygonPointsFromSatbandSelection(selection)
          let planeDirection = this.stackHelper.slice.planeDirection
          let planePosition = this.stackHelper.slice.planePosition

          const plane = new Plane().setFromNormalAndCoplanarPoint(planeDirection, planePosition)
          const line = new THREE.Line3()

          let intersectionPoints = []
          for (let i = 0; i < points.length; i++) {
            const lineVertices = [points[i], points[(i + 1) % points.length]]
            line.set(lineVertices[0], lineVertices[1])
            const intersection = getIntersectOfSegmentAndPlane(line, plane)
            if (intersection) {
              intersectionPoints.push(intersection)
            }
          }

          if (intersectionPoints.length > 0 && intersectionPoints.length % 2 == 0) {
            const intersectedLineDir = intersectionPoints[1].clone().sub(intersectionPoints[0]).normalize()
            intersectionPoints = this.sortProjectionPoints(intersectionPoints, intersectedLineDir)

            for (let i = 0; i < intersectionPoints.length; i += 2) {
              const startPoint = intersectionPoints[i]
              const endPoint = intersectionPoints[i + 1]
              const line = new Mesh(this.pointSelectionPolygonGeometry, this.satBandPolygonMaterial)
              line.scale.set(1, 1, endPoint.distanceTo(startPoint))
              line.position.copy(startPoint)
              line.lookAt(endPoint)
              line.renderOrder = 100
              this.projectionSatBandSelectionObjectContainer.add(line)
            }
          }
        })
        this.geometryMustUpdate = true
      }, 50)
    },
    sortProjectionPoints(projectionPoints, vectorOnPlane) {
      // Normalize the vectorOnPlane
      const normalizedVector = vectorOnPlane.clone().normalize()

      // Sort the projection points based on their projection onto the vectorOnPlane
      projectionPoints.sort((a, b) => {
        const projectionA = a.dot(normalizedVector)
        const projectionB = b.dot(normalizedVector)
        return projectionA - projectionB
      })

      return projectionPoints
    },
    // Sat band selection is used to grade user answer
    // Draw all sat band selections
    updateSatBandGradeZone() {
      if (this.movePointSelectCenterIcon) {
        this.movePointSelectCenterIcon.visible = false
      }
      if (this.isCTLab || !this.scene || !this.isEditingQuestion) {
        // too early or not needed
        return
      }
      Object.values(this.satBandMeshes).forEach((m) => this.scene.remove(m))
      this.snapDraggableObjectContainer.remove(...this.snapDraggableObjectContainer.children)
      const selections = this.$store.state.satBandService.satBandSelections ?? {}
      if (selections) {
        // create meshes for each position
        _.forOwn(selections, (position) => {
          const mode = _.get(position, ['mode'], this.pointSelectModes.CIRCLE)
          if (
            mode == this.pointSelectModes.CIRCLE &&
            _.has(position, ['x']) &&
            _.has(position, ['y']) &&
            _.has(position, ['z'])
          ) {
            if (this.satBandMeshes[position.id]) {
              this.scene.remove(this.satBandMeshes[position.id])
              delete this.satBandMeshes[position.id]
            }
            const worldPosition = new THREE.Vector3(position.x, position.y, position.z)
            if (_.isNil(position.radius)) {
              position.radius = this.newSatBandRadius
            }

            if (!this.satBandMeshes[position.id]) {
              const flatPoints = createHexagonPoints(position.radius)
              const zVector = new THREE.Vector3(0, 0, 1)

              let cameraDir = new Vector3()
              this.camera.getWorldDirection(cameraDir)
              let cameraSideDir = cameraDir.clone().cross(this.camera.up).normalize()
              let cameraUpDir = this.camera.up.clone().normalize()

              // Sat band has cameraSideDir and cameraUpDir, pointSelect is not
              if (_.has(position, ['cameraSideDir'])) {
                cameraSideDir = new Vector3(
                  position.cameraSideDir.x,
                  position.cameraSideDir.y,
                  position.cameraSideDir.z
                )
              }
              if (_.has(position, ['cameraUpDir'])) {
                cameraUpDir = new Vector3(position.cameraUpDir.x, position.cameraUpDir.y, position.cameraUpDir.z)
              }
              const cameraViewDir = cameraSideDir.clone().cross(cameraUpDir).normalize()
              const quaternion = new THREE.Quaternion().setFromUnitVectors(zVector, cameraViewDir)
              const points = _.map(flatPoints, (el) => el.clone())
              points.forEach((point) => {
                point.applyQuaternion(quaternion).add(worldPosition)
              })

              this.satBandMeshes[position.id] = this.drawCirclePolygon(
                points,
                flatPoints,
                position.id,
                this.shouldHighlightSatBandZone(position.id, _.get(position, ['indexSlice'], -1)),
                true
              )
            }

            this.satBandMeshes[position.id].visible =
              position.indexSlice == this.indexSlice &&
              position.stackName == this.stackConfig?.name &&
              this.visibleSatBand

            // Draw snap to edit polygon
            if (
              this.satBandEditMode &&
              position.id == this.currentSatBandSelection?.id &&
              this.satBandMeshes[position.id].visible &&
              position.stackName == this.stackConfig?.name
            ) {
              this.showMovePointSelectCenter(worldPosition)
              this.addMovePointSelectCenterBackground(worldPosition, position.id)
            }
          } else if (
            mode == this.pointSelectModes.RECTANGLE &&
            _.has(position, ['x']) &&
            _.has(position, ['y']) &&
            _.has(position, ['z'])
          ) {
            if (this.satBandMeshes[position.id]) {
              this.scene.remove(this.satBandMeshes[position.id])
              delete this.satBandMeshes[position.id]
            }
            const worldPosition = new THREE.Vector3(position.x, position.y, position.z)
            if (_.isNil(position.width)) {
              position.width = this.newSatBandRectangleWidth
            }
            if (_.isNil(position.height)) {
              position.height = this.newSatBandRectangleHeight
            }

            this.satBandMeshes[position.id] = this.drawRectangle(
              worldPosition,
              position,
              this.shouldHighlightSatBandZone(position.id, _.get(position, ['indexSlice'], -1)),
              true
            )
            this.satBandMeshes[position.id].visible =
              position.indexSlice == this.indexSlice &&
              position.stackName == this.stackConfig?.name &&
              this.visibleSatBand
            if (
              this.satBandEditMode &&
              position.id == this.currentSatBandSelection?.id &&
              this.satBandMeshes[position.id].visible &&
              position.stackName == this.stackConfig?.name
            ) {
              this.showMovePointSelectCenter(worldPosition)
              this.addMovePointSelectCenterBackground(worldPosition, position.id)
            }
          } else if (_.has(position, ['points']) && this.pointSelectModes.POLYGON) {
            if (this.satBandMeshes[position.id]) {
              this.scene.remove(this.satBandMeshes[position.id])
              delete this.satBandMeshes[position.id]
            }
            const worldPoints = _.get(position, ['points'], []).map((vec3) => {
              return new THREE.Vector3(vec3.x, vec3.y, vec3.z)
            })
            this.satBandMeshes[position.id] = this.drawPolygon(
              worldPoints,
              position.id,
              this.shouldHighlightSatBandZone(position.id),
              true
            )

            this.satBandMeshes[position.id].visible =
              position.indexSlice == this.indexSlice &&
              position.stackName == this.stackConfig?.name &&
              this.visibleSatBand

            // Draw snap to edit polygon
            if (
              this.satBandEditMode &&
              position.id == this.currentSatBandSelection?.id &&
              this.satBandMeshes[position.id].visible &&
              position.stackName == this.stackConfig?.name
            ) {
              worldPoints.forEach((vec3, index) => {
                let dot = new THREE.Mesh(this.pointSelectionDotGeometry, this.pointSelectionDotMaterial)
                dot.userData = {
                  zoneId: position.id,
                  index,
                  type: 'adjust',
                }
                dot.renderOrder = 102
                dot.scale.set(
                  Math.max(1, this.cornerSatBandDotSize),
                  Math.max(1, this.cornerSatBandDotSize),
                  Math.max(1, this.cornerSatBandDotSize)
                )
                dot.position.copy(vec3)

                this.snapDraggableObjectContainer.add(dot)
              })

              const averageX = _.mean(worldPoints.map((el) => el.x))
              const averageY = _.mean(worldPoints.map((el) => el.y))
              const averageZ = _.mean(worldPoints.map((el) => el.z))
              const worldPosition = new Vector3(averageX, averageY, averageZ)
              this.showMovePointSelectCenter(worldPosition)
              this.addMovePointSelectCenterBackground(worldPosition, position.id)
            }
          }
        })

        Object.keys(this.satBandMeshes).forEach((mKey) => {
          if (!selections[mKey]) {
            // clear out old meshes
            this.scene.remove(this.satBandMeshes[mKey])
            delete this.satBandMeshes[mKey]
          }
        })
      }

      if (this.satBandMeshes['drawing']) {
        this.scene.remove(this.satBandMeshes['drawing'])
        delete this.satBandMeshes['drawing']
      }
      if (this.selectedSatBandPolygonPoints && this.selectedSatBandPolygonPoints.length > 0) {
        if (this.selectedSatBandPolygonPoints.length == 1 && this.satBandMode == this.pointSelectModes.CIRCLE) {
          this.satBandMeshes['drawing'] = this.createMesh('drawing', false, true)
          const position = {
            x: this.selectedSatBandPolygonPoints[0].x,
            y: this.selectedSatBandPolygonPoints[0].y,
            z: this.selectedSatBandPolygonPoints[0].z,
          }
          const worldPosition = new THREE.Vector3(position.x, position.y, position.z)

          if (_.isNil(position.radius)) {
            position.radius = this.newSatBandRadius
          }

          this.satBandMeshes['drawing'].position.set(worldPosition.x, worldPosition.y, worldPosition.z)
          this.satBandMeshes['drawing'].scale.set(position.radius, position.radius, position.radius)
          this.satBandMeshes['drawing'].visible = this.stackConfig?.name == this.selectedSatBandStackConfigName
        } else if (
          this.selectedSatBandPolygonPoints.length == 1 &&
          this.satBandMode == this.pointSelectModes.RECTANGLE
        ) {
          const position = {
            x: this.selectedSatBandPolygonPoints[0].x,
            y: this.selectedSatBandPolygonPoints[0].y,
            z: this.selectedSatBandPolygonPoints[0].z,
          }
          const worldPosition = new THREE.Vector3(position.x, position.y, position.z)
          if (_.isNil(position.width)) {
            position.width = this.newSatBandRectangleWidth
          }
          if (_.isNil(position.height)) {
            position.height = this.newSatBandRectangleHeight
          }
          position.id = 'drawing'

          this.satBandMeshes['drawing'] = this.drawRectangle(worldPosition, position, false, true)
          this.satBandMeshes['drawing'].visible = this.stackConfig?.name == this.selectedSatBandStackConfigName
        } else if (this.selectedSatBandPolygonPoints.length > 1) {
          const worldPoints = this.selectedSatBandPolygonPoints.map((vec3) => {
            return new THREE.Vector3(vec3.x, vec3.y, vec3.z)
          })
          this.satBandMeshes['drawing'] = this.drawPolygon(worldPoints, 'drawing', false, true)
          this.satBandMeshes['drawing'].visible = this.stackConfig?.name == this.selectedSatBandStackConfigName
        }
      }

      this.updateProjectionOfSatBandGradeZone()
      this.geometryMustUpdate = true
    },
    addMovePointSelectCenterBackground(pos, id) {
      let dot = new THREE.Mesh(this.pointSelectionCenterDotGeometry, this.pointSelectionDotMaterial.clone())
      dot.userData = {
        zoneId: id,
        type: 'move',
      }
      dot.material.transparent = true
      dot.material.opacity = 0
      dot.scale.set(1.5, 1.5, 1.5)
      dot.renderOrder = 102
      dot.position.copy(pos)

      this.snapDraggableObjectContainer.add(dot)
    },
    showMovePointSelectCenter(pos) {
      if (this.movePointSelectCenterIcon) {
        this.movePointSelectCenterIcon.visible = true
        this.movePointSelectCenterIcon.position.copy(pos)
        this.movePointSelectCenterIcon.quaternion.copy(this.camera.quaternion)
        this.movePointSelectCenterIcon.translateX(-6)
        this.movePointSelectCenterIcon.translateY(-6)
      }
    },
    drawRectangle(pos, position, isHighLight = false, isSatBand = false) {
      const group = new Group()

      const width = _.get(position, ['width'], 1)
      const height = _.get(position, ['height'], 1)
      const zoneId = _.get(position, ['id'], 1)

      let cameraDir = new Vector3()
      this.camera.getWorldDirection(cameraDir)
      let cameraSideDir = cameraDir.clone().cross(this.camera.up).normalize()
      let cameraUpDir = this.camera.up.clone().normalize()

      // Sat band has cameraSideDir and cameraUpDir, pointSelect is not
      if (_.has(position, ['cameraSideDir'])) {
        cameraSideDir = new Vector3(position.cameraSideDir.x, position.cameraSideDir.y, position.cameraSideDir.z)
      }
      if (_.has(position, ['cameraUpDir'])) {
        cameraUpDir = new Vector3(position.cameraUpDir.x, position.cameraUpDir.y, position.cameraUpDir.z)
      }

      const fourCornerArray = [
        [1, 1],
        [-1, 1],
        [-1, -1],
        [1, -1],
      ]
      const points = []
      fourCornerArray.forEach((array) => {
        points.push(
          new Vector3()
            .copy(pos)
            .add(
              cameraSideDir
                .clone()
                .multiplyScalar(array[0])
                .multiplyScalar(width / 2)
            )
            .add(
              cameraUpDir
                .clone()
                .multiplyScalar(array[1])
                .multiplyScalar(height / 2)
            )
        )
      })

      for (let i = 0; i < points.length; i++) {
        const startPoint = points[i]
        const endPoint = points[(i + 1) % points.length]

        const line = new Mesh(
          this.pointSelectionPolygonGeometry,
          isSatBand ? this.satBandPolygonMaterial : this.pointSelectionPolygonMaterial
        )
        line.scale.set(1, 1, endPoint.distanceTo(startPoint))
        line.position.copy(startPoint)
        line.lookAt(endPoint)
        line.renderOrder = 100
        group.add(line)
      }
      const shape = this.drawShapeFromPoint(points, zoneId, isHighLight, isSatBand)
      if (shape) {
        group.add(shape)
      }

      group.userData = {
        rectangle: true,
      }
      this.scene.add(group)
      return group
    },
    drawPolygon(points, zoneId, isHighLight = false, isSatBand = false) {
      const group = new Group()

      for (let i = 0; i < points.length; i++) {
        const startPoint = points[i]
        const endPoint = points[(i + 1) % points.length]

        const line = new Mesh(
          this.pointSelectionPolygonGeometry,
          isSatBand ? this.satBandPolygonMaterial : this.pointSelectionPolygonMaterial
        )
        line.scale.set(1, 1, endPoint.distanceTo(startPoint))
        line.position.copy(startPoint)
        line.lookAt(endPoint)
        line.renderOrder = 100
        group.add(line)
      }
      const shape = this.drawShapeFromPoint(points, zoneId, isHighLight, isSatBand)
      if (shape) {
        group.add(shape)
      }

      group.userData = {
        polygon: true,
      }
      this.scene.add(group)
      return group
    },
    drawCircleShapeFromPoint(points, flatPoints, zoneId, isHighLight = false, isSatBand = false) {
      if (points.length < 3) {
        return null
      }

      const mat = isSatBand
        ? isHighLight
          ? this.satBandShapeHighlightMaterial
          : this.satBandShapeMaterial
        : isHighLight
        ? this.pointSelectionShapeHighlightMaterial
        : this.pointSelectionShapeMaterial
      const clonePoints = [...points.map((vec3) => vec3.clone()), points[0].clone()]
      const cloneFlatPoints = [...flatPoints.map((vec3) => vec3.clone()), flatPoints[0].clone()]

      // 3 create shape and shapeGeometry
      let shape = new THREE.Shape(cloneFlatPoints)
      let shapeGeom = new THREE.ShapeGeometry(shape)

      let verticesIndex = _.cloneDeep(shapeGeom.vertices).map((el) =>
        _.findIndex(cloneFlatPoints, (p) => _.round(p.x, 1) == _.round(el.x, 1) && _.round(p.y, 1) == _.round(el.y, 1))
      )

      if (!verticesIndex || verticesIndex.length < 3) {
        return null
      }

      // 5 assign points to .vertices
      shapeGeom.vertices = verticesIndex.map((index) => {
        if (index > -1) {
          return clonePoints[index]
        } else {
          return clonePoints[0]
        }
      })
      shapeGeom.verticesNeedUpdate = true

      let shapeMesh = new THREE.Mesh(shapeGeom, mat)
      shapeMesh.renderOrder = 101
      shapeMesh.userData = {
        name: 'PointSelectedZone',
        id: zoneId,
      }
      return shapeMesh
    },
    drawShapeFromPoint(points, zoneId, isHighLight = false, isSatBand = false) {
      if (points.length < 3) {
        return null
      }

      const mat = isSatBand
        ? isHighLight
          ? this.satBandShapeHighlightMaterial
          : this.satBandShapeMaterial
        : isHighLight
        ? this.pointSelectionShapeHighlightMaterial
        : this.pointSelectionShapeMaterial
      const clonePoints = [...points.map((vec3) => vec3.clone()), points[0].clone()]

      let dirLPS = this.stackHelper.slice.planeDirection
      dirLPS.x = this.zDirectionX
      dirLPS.y = this.zDirectionY
      dirLPS.z = this.zDirectionZ
      // keep image facing upwards somewhat? we don't want to go upside down, which might invert the image

      // Fix: FLIP L/R
      // In CT Lab mode, axial view reference from the direction of mri machine in/out
      // To prevent image flip L/R is wrong, always set the dirLPS closest Z > 0
      if (this.isCTLab) {
        let closestSignedWorldAxis3 = getClosestSignedAxis3(dirLPS)
        if (closestSignedWorldAxis3.z == -1) {
          dirLPS = dirLPS.clone().negate()
        }
      }

      if (dirLPS.lengthSq() === 0) {
        dirLPS.z = 1
      }
      dirLPS.normalize()

      // normals
      let normal = dirLPS // I already know the normal of stack plane ;)
      let normalZ = new Vector3(0, 0, 1) // base normal of xy-plane
      // 1 quaternions
      let quaternion = new THREE.Quaternion().setFromUnitVectors(normal, normalZ)
      let quaternionBack = new THREE.Quaternion().setFromUnitVectors(normalZ, normal)

      // 2 make it parallel to xy-plane
      clonePoints.forEach((p) => {
        p.applyQuaternion(quaternion)
      })

      // 3 create shape and shapeGeometry
      let shape = new THREE.Shape(clonePoints)
      let shapeGeom = new THREE.ShapeGeometry(shape)

      let verticesIndex = _.cloneDeep(shapeGeom.vertices).map((el) =>
        _.findIndex(clonePoints, (p) => _.round(p.x, 1) == _.round(el.x, 1) && _.round(p.y, 1) == _.round(el.y, 1))
      )

      // 4 put our points back to their origins
      clonePoints.forEach((p) => {
        p.applyQuaternion(quaternionBack)
      })

      if (!verticesIndex || verticesIndex.length < 3) {
        return null
      }

      // 5 assign points to .vertices
      shapeGeom.vertices = verticesIndex.map((index) => {
        if (index > -1) {
          return clonePoints[index]
        } else {
          return clonePoints[0]
        }
      })
      shapeGeom.verticesNeedUpdate = true

      let shapeMesh = new THREE.Mesh(shapeGeom, mat)
      shapeMesh.renderOrder = 101
      shapeMesh.userData = {
        name: 'PointSelectedZone',
        id: zoneId,
      }
      return shapeMesh
    },
    refreshCameraFraming() {
      // This seems to be the scenario in which we'd want to flip the image seen by the camera
      let flippedLR = this.isCameraLeftRightFlipped ? -1 : 1

      if (this.isLimited) {
        // when the slices in the same places as before
        if (!this.stackHelper.slice.geometry.boundingSphere) {
          this.stackHelper.slice.geometry.computeBoundingSphere()
        }
        const bsphere_radius = this.stackHelper.slice.geometry.boundingSphere.radius

        const aspect = this.elBox.offsetWidth / this.elBox.offsetHeight
        let frustumHeight = bsphere_radius
        if (aspect > 1) {
          frustumHeight /= aspect
        }

        if (flippedLR === 1) {
          this.camera.left = -frustumHeight * aspect
          this.camera.right = frustumHeight * aspect
        } else {
          this.camera.right = -frustumHeight * aspect
          this.camera.left = frustumHeight * aspect
        }
        this.camera.top = frustumHeight
        this.camera.bottom = -frustumHeight
      } else {
        // OLD LOGIC
        // let leftRightOffset = this.offsetForCameraCenteringBase * (this.isCameraReversed ? -1 : 1)
        // this.camera.left = this.clientWidthHalf * -1 * flippedLR - leftRightOffset
        // this.camera.right = this.clientWidthHalf * flippedLR - leftRightOffset
        // this.camera.top = this.clientHeightHalf - this.offsetForCameraCenteringBase
        // this.camera.bottom = this.clientHeightHalf * -1 - this.offsetForCameraCenteringBase
        // END OLD LOGIC

        this.camera.left = this.clientWidthHalf * -1 * flippedLR
        this.camera.right = this.clientWidthHalf * flippedLR
        this.camera.top = this.clientHeightHalf
        this.camera.bottom = this.clientHeightHalf * -1
      }

      // Calculate zoom for localizer
      if (
        this.stackWorldBoundingBoxDimensions &&
        this.stackConfig?.isLocalizer &&
        !this.stackConfig?.name.includes('Added Localizer')
      ) {
        let { x, y, z } = this.stackWorldBoundingBoxDimensions
        const width = Math.abs(this.camera.left - this.camera.right)
        const height = Math.abs(this.camera.top - this.camera.bottom)
        const onZoomByStartPointAndEndPoint = (startPoint, endPoint, leftPoint = null, rightPoint = null) => {
          const modelHeight = startPoint.distanceTo(endPoint)
          const modelWidth = leftPoint ? leftPoint.distanceTo(rightPoint) : this.cameraDirAxisName === 'x' ? y : x
          if (this.cameraDirAxisName === 'x') {
            const zoomWidth = width / modelWidth
            const zoomHeight = height / modelHeight
            this.zoom = Math.min(zoomWidth, zoomHeight)
          } else if (this.cameraDirAxisName === 'y') {
            const zoomWidth = width / modelWidth
            const zoomHeight = height / modelHeight
            this.zoom = Math.min(zoomWidth, zoomHeight)
          } else if (this.cameraDirAxisName === 'z') {
            const zoomWidth = width / modelWidth
            const zoomHeight = height / modelHeight
            this.zoom = Math.min(zoomWidth, zoomHeight)
          }
        }
        if (
          this.limitedCTModelPlanesOfLandmark &&
          this.limitedCTModelPlanesOfLandmark.limit &&
          this.dicomLocalizerBoxConfig
        ) {
          const { startPoint, endPoint, leftPoint, rightPoint } = this.limitedCTModelPlanesOfLandmark.limit
          onZoomByStartPointAndEndPoint(startPoint, endPoint, leftPoint, rightPoint)
        } else if (this.limitedCTLocalizerConfigBox) {
          const { startPoint, endPoint, leftPoint, rightPoint } = this.limitedCTLocalizerConfigBox
          onZoomByStartPointAndEndPoint(startPoint, endPoint, leftPoint, rightPoint)
        } else {
          const padding = 0 // 20
          if (this.cameraDirAxisName === 'x') {
            this.zoom = Math.min((height - padding) / z, (width - padding) / y)
          } else if (this.cameraDirAxisName === 'y') {
            this.zoom = Math.min((height - padding) / z, (width - padding) / x)
          } else if (this.cameraDirAxisName === 'z') {
            this.zoom = Math.min((height - padding) / y, (width - padding) / x)
          }
        }
      }

      this.isMoveToCenterOfLimitSquare = false
      this.geometryMustUpdate = true
    },
    stackHelperAddToScene() {
      if (this.bShowBoundingBox) {
        this.scene.add(this.stackHelper)
      } else {
        this.scene.add(this.stackHelper.slice)
      }
    },
    stackHelperRemoveFromScene(stackHelper) {
      if (this.bShowBoundingBox) {
        this.scene.remove(stackHelper)
      } else {
        this.scene.remove(stackHelper.slice)
      }
    },
    onMoveToMiddleSlice() {
      if (this.isCTLab && this.isPlaySlice && this.stackConfigSlicesAmount > 0) {
        this.setSliceIndex(Math.floor(this.stackConfigSlicesAmount / 2) || 0, true)
      }
    },
    // This needs to run immediately also to add it to the scene
    onStackHelperChanged() {
      // When we change from timing decision question to another question, need to set renderer size
      this.onSetSizeOfRenderer()
      log.debug('onStackHelperChanged')
      if (this.stackHelperPrevious) {
        log.debug(' had a previous')
        // remove from scene
        this.stackHelperRemoveFromScene(this.stackHelperPrevious)
        // this.stackVolumeSelection.setBackgroundSlice(this.stackHelper.slice)
        _.each(this.stackVolumeSelections, (stackVolumeSelection) =>
          stackVolumeSelection.setBackgroundSlice(this.stackHelper.slice)
        )
        _.each(this.interactableInstances, (interactableInstance) =>
          interactableInstance.setBackgroundSlice(this.stackHelper.slice)
        )
        // Set index back to 0, and also recalculate various geometry since that's certainly different
        if (this.isCTLab && this.stackConfigSlicesAmount > 0) {
          this.setSliceIndex(Math.floor(this.stackConfigSlicesAmount / 2) || 0, true)
        } else {
          this.setSliceIndex(0, true)
        }

        if (this.isPlaySlice && this.isCTLab) {
          EventBus.$emit('onIndexSliceChange', 0, this.stackConfigSlicesAmount)
        }
      }
      // always add the new one to the scene
      this.stackHelperAddToScene(this.stackHelperPrevious)
      if (this.isCTLab) {
        this.updateMriModelBox()
      }

      // Remember this one for if we change it
      this.stackHelperPrevious = this.stackHelper
      this.resetCameraPan()
    },
    updateMriModelBox() {
      if (this.stackHelper?.slice) {
        const stackBox = new Box3().setFromObject(this.stackHelper)
        const sliceBox = new Box3().setFromObject(this.stackHelper.slice)
        const sliceCenter = sliceBox.getCenter(new Vector3())
        const sliceDimensions = new Vector3(
          stackBox.max.x - stackBox.min.x,
          stackBox.max.y - stackBox.min.y,
          stackBox.max.z - stackBox.min.z
        )

        this.setMriModelBbox({ center: sliceCenter, dimensions: sliceDimensions })
      }
    },
    onZoomChanged() {
      this.camera.zoom = this.zoom
    },
    async toggleFullscreen() {
      let componentConfig = {
        stackConfig: this.stackConfig,
        indexSlice: this.indexSlice,
        windowWidth: this.windowWidth,
        windowCenter: this.windowCenter,
        zoom: this.zoom,
        renderWidth: this.elBox.offsetWidth,
        renderHeight: this.elBox.offsetHeight,
        isInCriticalThinkingQuestionForFullScreen: this.isInCriticalThinkingQuestion,
        isPreviewCriticalThinkingQuestionForFullScreen: this.isPreviewCriticalThinkingQuestion,
      }
      if (!this.isFullscreen) {
        // this.elBox.removeChild(this.renderer.domElement)
        await this.$store.dispatch('selectionConfig/enterFullscreen', {
          fullscreenSourceId: this.id,
          componentConfig,
        })
      } else {
        await this.$store.dispatch('selectionConfig/exitFullscreen', {
          componentConfig,
        })
      }
    },
    onStackConfigChanged() {
      if (this.isCTLab) {
        // Check is first slice view
        if (this.isPlaySlice) {
          this.setConfigNameOfFirstSliceView(this.stackConfig?.name)
        }
        this.windowWidth = this.stackConfig?.windowWidth
        this.windowCenter = this.stackConfig?.windowLevel
      } else {
        this.windowWidth = false
        this.windowCenter = false
      }

      this.onStackHelperChanged() // this might be overkill, but it fixes critical issue: https://app.clubhouse.io/scanlab/story/275/slice-lines-show-up-behind-image-in-sagittal-view-after-scan
      if (_.isFinite(this.indexSliceOverwrite)) {
        log.debug('indexSliceOverwrite', this.indexSliceOverwrite)
        this.setSliceIndex(this.indexSliceOverwrite, true)
        this.indexSliceOverwrite = null
      } else if (this.isCTLab && this.stackConfigSlicesAmount > 0 && !this.isPlayingTheSlices) {
        this.setSliceIndex(Math.floor(this.stackConfigSlicesAmount / 2) || 0, true)
      } else {
        this.setSliceIndex(0, true)
      }

      this.updateShaderMaterialForCTMode()
      this.updateShaderMaterialForMRMode()

      if (this.stackVolumeSelections) {
        _.each(this.stackVolumeSelections, (stackVolumeSelection) =>
          stackVolumeSelection.updateGeometries({ recreateLines: true })
        )
      }
      this.resetCameraPan()
    },
    onFullscreenChange(event) {
      // fullscreen popup just toggled and needs to transfer config in from where it was started from, or back out
      if ((event.isFullscreen && this.amFullscreen) || event.targetId === this.id) {
        _.extend(this, event.componentConfig, {
          indexSliceOverwrite: event.componentConfig.indexSlice,
        })

        this.windowWidth = _.get(event.componentConfig, 'windowWidth', this.windowWidth)
        this.windowCenter = _.get(event.componentConfig, 'windowCenter', this.windowCenter)
        this.geometryMustUpdate = true
        // if the stack was the same, still change the index
        this.setSliceIndex(event.componentConfig.indexSlice, true)

        // figure out new zoom
        const ratio =
          Math.min(this.elBox.offsetWidth, this.elBox.offsetHeight) /
          Math.min(event.componentConfig.renderWidth, event.componentConfig.renderHeight)
        if (this.stackConfig.isLocalizer) {
          this.zoom = ratio * event.componentConfig.zoom
        } else {
          // not sure why the behavior of scanned images is different. Seems like it's getting the same ratio as before. Should it not be? Maybe the zoom is wrong now? It's a multiplication... is the base different now?
          // Non-localizers don't seem to need to be multiplied by the ratio (although it's not quite right, but a lot closer than when multiplying by ratio)
          this.zoom = event.componentConfig.zoom
        }

        if (this.isCTLab) {
          this.initInstanceGeometryAndMaterial()
          this.updateClickableQuestion()
          this.updatePreviewPointSelectAnswer()
          this.toggleVisibleUserSelectedPoint()
        }
      } else if (this.isCTLab && !event.isFullscreen && !this.amFullscreen) {
        this.initInstanceGeometryAndMaterial()
        this.updateClickableQuestion()
        this.updatePreviewPointSelectAnswer()
        this.toggleVisibleUserSelectedPoint()
      }
    },
    onMouseWheel(event) {
      log.debug('onMouseWheel', event, this.id)
      this.indexSliceSlider = this.indexSliceSlider + (event.deltaY > 0 ? 1 : -1)
    },
    changeFrameByArrowIcon(offset) {
      const index = this.stackConfigOptions.findIndex((data) => data.value === this.stackConfig)
      if (index === 0 && offset === -1) {
        this.stackConfig = this.stackConfigOptions[this.stackConfigOptions.length - 1].value
      } else if (index === this.stackConfigOptions.length - 1 && offset === 1) {
        this.stackConfig = this.stackConfigOptions[0].value
      } else {
        this.stackConfig = this.stackConfigOptions[index + offset].value
      }
    },
    mouseDown(event) {
      log.debug('down', event, this.mouseButtonsDown, this.id)
      _.set(this.mouseButtonsDown, mouseButtonIndexToName[event.button], true)
      this.pointerDown(event)
    },
    touchDown(event) {
      log.debug('touchDown', event)
      _.set(this.mouseButtonsDown, 'left', true)
      this.pointerDown(event)
    },
    pointerDown(event) {
      event.preventDefault()

      this.mouseMovementResizeRemainder3.set(0, 0, 0)

      getOffsetPosition(this.mousePosition2Init, event, this.elBox)
      this.mousePosition2Prev.copy(this.mousePosition2Init)
      this.getMouseSliceIntersection(this.mousePositionSlice3Init, this.mousePosition2Prev)
      if (this.allowSelection && this.showPointSelect) {
        const dataPosition = AMI.UtilsCore.worldToData(
          this.stackHelper.stack.lps2IJK,
          this.mousePositionSlice3Init.clone()
        )
        // Raycast and set selection
        this.onRaycastPointSelection(dataPosition)
      }
      if (this.isEditingQuestion && !this.isCTLab) {
        this.onRaycastSatBand()
      }

      this.mousePositionSlice3Prev.copy(this.mousePositionSlice3Init)

      this.pointerMovedSinceLastDown = false

      log.debug('touchDown', event)
    },
    onRaycastSatBand() {
      const objectsToRaycast = Object.entries(this.satBandMeshes)
        .map(([, value]) => {
          if (value.visible) {
            return value
          }

          return null
        })
        .filter((el) => el)
      const intersections = tmpRaycaster.intersectObjects(objectsToRaycast, true)

      let selectionId = null
      if (intersections.length && _.has(intersections, [0, 'object', 'userData', 'id'])) {
        selectionId = _.get(intersections, [0, 'object', 'userData', 'id'])
        this.setCurrentSatBandSelection(`${selectionId}`)
      } else if (!(this.currentSatBandSelectionMode == this.pointSelectModes.POLYGON && this.satBandEditMode)) {
        this.setCurrentSatBandSelection(null)
      }
    },
    onRaycastPointSelection(dataPosition) {
      if (this.mouseButtonsDown.left) {
        const objectsToRaycast = Object.entries(this.pointSelectionMeshes)
          .map(([, value]) => {
            if (value.visible) {
              return value
            }

            return null
          })
          .filter((el) => el)
        const intersections = tmpRaycaster.intersectObjects(objectsToRaycast, true)

        // Set point before set selection
        this.setSelectedPointInfo({
          indexSlice: this.indexSlice,
          position: dataPosition,
        })

        let selectionId = null
        if (intersections.length && _.has(intersections, [0, 'object', 'userData', 'id'])) {
          selectionId = _.get(intersections, [0, 'object', 'userData', 'id'])
          this.setCurrentSelection(`${selectionId}`)
          if (
            !this.isShowPointSelectionAnswerArea &&
            this.allowSelection &&
            (this.isPreviewCriticalThinkingQuestion || this.isPreviewCriticalThinkingQuestionForFullScreen)
          ) {
            this.$notify({ type: 'success', text: 'Correct selection!' })
          }
        } else if (!(this.currentSelectionMode == this.pointSelectModes.POLYGON && this.pointSelectEditMode)) {
          this.setCurrentSelection(null)
          if (
            !this.isShowPointSelectionAnswerArea &&
            this.allowSelection &&
            (this.isPreviewCriticalThinkingQuestion || this.isPreviewCriticalThinkingQuestionForFullScreen)
          ) {
            this.$notify({ type: 'warning', text: 'Wrong selection!' })
          }
        }

        if (
          !this.isShowPointSelectionAnswerArea &&
          this.allowSelection &&
          (this.isPreviewCriticalThinkingQuestion || this.isPreviewCriticalThinkingQuestionForFullScreen)
        ) {
          this.addPreviewChosenSelection({
            position: dataPosition,
            selectionId: selectionId,
            id: this.indexSlice,
          })
        }
      }
    },
    toggleVisibleUserSelectedPoint() {
      if (
        !this.scene ||
        !this.userSelectedPointMesh ||
        (!this.isInCriticalThinkingQuestion && !this.amFullscreen) ||
        (!this.isInCriticalThinkingQuestionForFullScreen && this.amFullscreen)
      ) {
        return
      }
      if (!this.selectedPointInfo) {
        this.userSelectedPointMesh.visible = false
        this.geometryMustUpdate = true
        return
      }
      const index = _.get(this.selectedPointInfo, ['indexSlice'], -1)
      if (
        (this.isInCriticalThinkingQuestion && !this.amFullscreen) ||
        (this.isInCriticalThinkingQuestionForFullScreen && this.amFullscreen)
      ) {
        if (index == this.indexSlice && index > -1) {
          const dataPosition = _.get(this.selectedPointInfo, ['position'])
          this.userSelectedPointMesh.visible = true

          const worldPosition = new THREE.Vector3(dataPosition.x, dataPosition.y, dataPosition.z).applyMatrix4(
            this.stackHelper.stack.ijk2LPS
          )
          this.userSelectedPointMesh.position.copy(worldPosition)
          const scale = this.userPointSelectAnswerDotSize / 2
          this.userSelectedPointMesh.scale.set(scale, scale, scale)
        } else {
          this.userSelectedPointMesh.visible = false
        }
        this.geometryMustUpdate = true
      }
    },
    updatePreviewPointSelectAnswer() {
      if (
        (this.isPreviewCriticalThinkingQuestion || this.isPreviewCriticalThinkingQuestionForFullScreen) &&
        this.showPointSelect
      ) {
        if (!this.scene || !this.showPointSelect) {
          return
        }
        const createUserSelectedPointMeshMesh = (previewSelection) => {
          let mesh = new THREE.Mesh(this.pointSelectionCenterDotGeometry, this.pointSelectionDotMaterial)
          mesh.renderOrder = 104
          mesh.visible = false
          if (_.has(previewSelection, ['userPointSelectAnswerDotSize'])) {
            const scale = _.get(previewSelection, ['userPointSelectAnswerDotSize'], 1) / 2
            mesh.scale.set(scale, scale, scale)
          } else {
            mesh.scale.set(2, 2, 2)
          }
          this.scene.add(mesh)
          return mesh
        }
        _.forOwn(this.pointPreviewChosenSelectionMeshes, (value, key) => {
          this.scene.remove(this.pointPreviewChosenSelectionMeshes[key])
          delete this.pointPreviewChosenSelectionMeshes[key]
        })

        if (this.previewChosenSelection) {
          _.forOwn(this.previewChosenSelection, (previewSelection) => {
            if (this.pointPreviewChosenSelectionMeshes[previewSelection.id]) {
              this.scene.remove(this.pointPreviewChosenSelectionMeshes[previewSelection.id])
              delete this.pointPreviewChosenSelectionMeshes[previewSelection.id]
            }

            const worldPosition = new THREE.Vector3(
              previewSelection.position.x,
              previewSelection.position.y,
              previewSelection.position.z
            ).applyMatrix4(this.stackHelper.stack.ijk2LPS)

            if (!this.pointPreviewChosenSelectionMeshes[previewSelection.id]) {
              this.pointPreviewChosenSelectionMeshes[previewSelection.id] = createUserSelectedPointMeshMesh(
                previewSelection
              )
            }

            this.pointPreviewChosenSelectionMeshes[previewSelection.id].position.set(
              worldPosition.x,
              worldPosition.y,
              worldPosition.z
            )
            this.pointPreviewChosenSelectionMeshes[previewSelection.id].visible = previewSelection.id == this.indexSlice
          })
        }

        this.geometryMustUpdate = true
      }
    },
    onDoubleClick() {
      this.toggleFullscreen()
    },
    mouseUp(event, shouldPreventDoubleClick) {
      if (event.which === 2 && !shouldPreventDoubleClick) {
        // For double middle click, reset windowing
        if (Date.now() - this.lastMiddleClick < 250) {
          this.resetWindowing()
        }
        this.lastMiddleClick = Date.now()
      }
      log.debug('up', event, this.mouseButtonsDown, this.id)
      this.pointerUp(event, shouldPreventDoubleClick)
      _.set(this.mouseButtonsDown, mouseButtonIndexToName[event.button], false)
    },
    touchUp(event) {
      log.debug('touchUp', event)
      this.pointerUp(event)
      _.set(this.mouseButtonsDown, 'left', false)
    },
    onDeleteCurrentPointSelect() {
      if (this.currentSelection && this.currentSelection.id) {
        this.removeSelection(this.currentSelection.id)
      }
    },
    onDeleteAllCurrentPointSelect() {
      if (!this.amFullscreen) {
        this.removeAllSelection(this.indexSlice)
      }
    },
    onDrawSatBandSelectionModeChange() {
      if (this.amFullscreen || !this.isEditingQuestion) {
        return
      }
      if (this.isStartDrawSatBandZone) {
        this.selectedSatBandPolygonPoints = []
      } else if (
        !this.isStartDrawSatBandZone &&
        !this.amFullscreen &&
        this.stackConfig?.name == this.selectedSatBandStackConfigName
      ) {
        if (this.satBandMode == this.pointSelectModes.CIRCLE && this.selectedSatBandPolygonPoints.length == 1) {
          let cameraDir = new Vector3()
          this.camera.getWorldDirection(cameraDir)
          const cameraSideDir = cameraDir.clone().cross(this.camera.up).normalize()
          const cameraUpDir = this.camera.up.clone().normalize()
          this.addSatBandSelection({
            ...this.selectedSatBandPolygonPoints[0],
            radius: this.newSatBandRadius,
            mode: this.satBandMode,
            indexSlice: this.indexSlice,
            id: uuidv4(),
            cameraSideDir: cameraSideDir,
            cameraUpDir: cameraUpDir,
            stackName: this.selectedSatBandStackConfigName,
          })
        } else if (
          this.satBandMode == this.pointSelectModes.RECTANGLE &&
          this.selectedSatBandPolygonPoints.length == 1
        ) {
          let cameraDir = new Vector3()
          this.camera.getWorldDirection(cameraDir)
          const cameraSideDir = cameraDir.clone().cross(this.camera.up).normalize()
          const cameraUpDir = this.camera.up.clone().normalize()
          this.addSatBandSelection({
            ...this.selectedSatBandPolygonPoints[0],
            width: this.newSatBandRectangleWidth,
            height: this.newSatBandRectangleHeight,
            mode: this.satBandMode,
            indexSlice: this.indexSlice,
            id: uuidv4(),
            cameraSideDir: cameraSideDir,
            cameraUpDir: cameraUpDir,
            stackName: this.selectedSatBandStackConfigName,
          })
        } else if (this.selectedSatBandPolygonPoints.length > 2) {
          this.addSatBandSelection({
            points: this.selectedSatBandPolygonPoints,
            mode: this.satBandMode,
            indexSlice: this.indexSlice,
            id: uuidv4(),
            stackName: this.selectedSatBandStackConfigName,
          })
        }
        this.selectedSatBandPolygonPoints = []
      }
    },
    onDrawPointSelectModeChange() {
      if (this.amFullscreen) {
        return
      }
      if (this.isStartDrawPointSelectZone && this.allowSelection) {
        this.selectedPolygonPoints = []
      } else if (!this.isStartDrawPointSelectZone && this.allowSelection && !this.amFullscreen) {
        if (this.pointSelectMode == this.pointSelectModes.CIRCLE && this.selectedPolygonPoints.length == 1) {
          this.addSelection({
            ...this.selectedPolygonPoints[0],
            radius: this.newRadius,
            mode: this.pointSelectMode,
            indexSlice: this.indexSlice,
            id: uuidv4(),
          })
        } else if (this.pointSelectMode == this.pointSelectModes.RECTANGLE && this.selectedPolygonPoints.length == 1) {
          this.addSelection({
            ...this.selectedPolygonPoints[0],
            width: this.newRectangleWidth,
            height: this.newRectangleHeight,
            mode: this.pointSelectMode,
            indexSlice: this.indexSlice,
            id: uuidv4(),
          })
        } else if (this.selectedPolygonPoints.length > 2) {
          this.addSelection({
            points: this.selectedPolygonPoints,
            mode: this.pointSelectMode,
            indexSlice: this.indexSlice,
            id: uuidv4(),
          })
        }
        this.selectedPolygonPoints = []
      }
    },
    onIndexSliceChange(curVal, oldVal) {
      if (this.amFullscreen) {
        return
      }
      if (this.allowSelection && this.isStartDrawPointSelectZone) {
        // Save old selection
        if (this.pointSelectMode == this.pointSelectModes.CIRCLE && this.selectedPolygonPoints.length == 1) {
          this.addSelection({
            ...this.selectedPolygonPoints[0],
            radius: this.newRadius,
            mode: this.pointSelectMode,
            indexSlice: oldVal,
            id: uuidv4(),
          })
        } else if (this.pointSelectMode == this.pointSelectModes.RECTANGLE && this.selectedPolygonPoints.length == 1) {
          this.addSelection({
            ...this.selectedPolygonPoints[0],
            width: this.newRectangleWidth,
            height: this.newRectangleHeight,
            mode: this.pointSelectMode,
            indexSlice: oldVal,
            id: uuidv4(),
          })
        } else if (this.selectedPolygonPoints.length > 2) {
          this.addSelection({
            points: this.selectedPolygonPoints,
            mode: this.pointSelectMode,
            indexSlice: oldVal,
            id: uuidv4(),
          })
        }
        this.selectedPolygonPoints = []
        // this.setIsStartDrawPointSelectZone(false)
      }

      if (
        this.isStartDrawSatBandZone &&
        this.stackConfig?.name == this.selectedSatBandStackConfigName &&
        !this.isCTLab
      ) {
        // Save old selection
        if (this.satBandMode == this.pointSelectModes.CIRCLE && this.selectedSatBandPolygonPoints.length == 1) {
          let cameraDir = new Vector3()
          this.camera.getWorldDirection(cameraDir)
          const cameraSideDir = cameraDir.clone().cross(this.camera.up).normalize()
          const cameraUpDir = this.camera.up.clone().normalize()
          this.addSatBandSelection({
            ...this.selectedSatBandPolygonPoints[0],
            radius: this.newSatBandRadius,
            mode: this.satBandMode,
            indexSlice: oldVal,
            id: uuidv4(),
            cameraSideDir: cameraSideDir,
            cameraUpDir: cameraUpDir,
            stackName: this.selectedSatBandStackConfigName,
          })
        } else if (
          this.satBandMode == this.pointSelectModes.RECTANGLE &&
          this.selectedSatBandPolygonPoints.length == 1
        ) {
          let cameraDir = new Vector3()
          this.camera.getWorldDirection(cameraDir)
          const cameraSideDir = cameraDir.clone().cross(this.camera.up).normalize()
          const cameraUpDir = this.camera.up.clone().normalize()
          this.addSatBandSelection({
            ...this.selectedSatBandPolygonPoints[0],
            width: this.newSatBandRectangleWidth,
            height: this.newSatBandRectangleHeight,
            mode: this.satBandMode,
            indexSlice: oldVal,
            id: uuidv4(),
            cameraSideDir: cameraSideDir,
            cameraUpDir: cameraUpDir,
            stackName: this.selectedSatBandStackConfigName,
          })
        } else if (this.selectedSatBandPolygonPoints.length > 2) {
          this.addSatBandSelection({
            points: this.selectedSatBandPolygonPoints,
            mode: this.satBandMode,
            indexSlice: oldVal,
            id: uuidv4(),
            stackName: this.selectedSatBandStackConfigName,
          })
        }
        this.selectedSatBandPolygonPoints = []
      }
    },
    pointerUp(event, shouldPreventDoubleClick) {
      event.preventDefault()
      if (
        this.allowSelection &&
        this.showPointSelect &&
        !shouldPreventDoubleClick &&
        !this.pointerMovedSinceLastDown &&
        mouseButtonIndexToName[event.button] == 'left' &&
        this.isStartDrawPointSelectZone &&
        this.cursorOnBox
      ) {
        let tmpMousePosition2 = new Vector2()
        let tmpMousePosition3 = new Vector3()
        getOffsetPosition(tmpMousePosition2, event, this.elBox)
        this.getMouseSliceIntersection(tmpMousePosition3, tmpMousePosition2)
        const dataPosition = AMI.UtilsCore.worldToData(this.stackHelper.stack.lps2IJK, tmpMousePosition3)
        if (this.pointSelectMode == this.pointSelectModes.CIRCLE) {
          this.selectedPolygonPoints = [dataPosition]
        } else if (this.pointSelectMode == this.pointSelectModes.RECTANGLE) {
          this.selectedPolygonPoints = [dataPosition]
        } else {
          this.selectedPolygonPoints = [...this.selectedPolygonPoints, dataPosition]
        }

        return
      }
      if (
        this.isEditingQuestion &&
        !shouldPreventDoubleClick &&
        !this.pointerMovedSinceLastDown &&
        mouseButtonIndexToName[event.button] == 'left' &&
        this.isStartDrawSatBandZone &&
        this.cursorOnBox
      ) {
        if (!this.stackConfig?.isLocalizer) {
          this.$notify({ type: 'warning', text: "Can't draw sat band on Non-localizer" })
          return
        }

        this.setSelectedSatBandViewOrientation(this.viewOrientation)
        let tmpMousePosition2 = new Vector2()
        let tmpMousePosition3 = new Vector3()
        getOffsetPosition(tmpMousePosition2, event, this.elBox)
        this.getMouseSliceIntersection(tmpMousePosition3, tmpMousePosition2)
        const dataPosition = AMI.UtilsCore.worldToData(this.stackHelper.stack.lps2IJK, tmpMousePosition3)
        const worldPosition = new THREE.Vector3(dataPosition.x, dataPosition.y, dataPosition.z).applyMatrix4(
          this.stackHelper.stack.ijk2LPS
        )

        if (this.selectedSatBandStackConfigName != this.stackConfig?.name) {
          this.selectedSatBandPolygonPoints = []
          this.setSelectedSatBandStackConfigName(this.stackConfig?.name)
        }

        if (this.satBandMode == this.pointSelectModes.CIRCLE) {
          this.selectedSatBandPolygonPoints = [worldPosition]
        } else if (this.satBandMode == this.pointSelectModes.RECTANGLE) {
          this.selectedSatBandPolygonPoints = [worldPosition]
        } else {
          this.selectedSatBandPolygonPoints = [...this.selectedSatBandPolygonPoints, worldPosition]
        }

        return
      }
      log.debug('touchUp', event)
    },
    touchMove(event) {
      this.pointerMove(event)
    },
    mouseMove(event) {
      this.pointerMove(event)
    },
    pointerMove(event) {
      if (this.mouseButtonsDown.left || this.mouseButtonsDown.middle || this.mouseButtonsDown.right) {
        event.preventDefault()
        // log.debug('mouseMove', event)

        getOffsetPosition(this.mousePosition2Cur, event, this.elBox)
        this.getMouseSliceIntersection(this.mousePositionSlice3Cur, this.mousePosition2Cur)
        this.pointerMoveMain()
        this.mousePosition2Prev.copy(this.mousePosition2Cur)
        this.mousePositionSlice3Prev.copy(this.mousePositionSlice3Cur)

        this.pointerMovedSinceLastDown = true
      }
    },
    getMouseSliceIntersection(out3, mouseScreen2) {
      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
      tmpMouse2.x = (mouseScreen2.x / this.elBox.offsetWidth) * 2 - 1
      tmpMouse2.y = -(mouseScreen2.y / this.elBox.offsetHeight) * 2 + 1
      // update the picking ray with the camera and mouse position
      tmpRaycaster.setFromCamera(tmpMouse2, this.camera)

      if (tmpRaycaster.ray.intersectPlane(this.getBackgroundSlicePlane(), out3)) {
        log.debug('mouse -> plane intersection', out3)
      }
    },
    getBackgroundSlicePlane() {
      tmpBackgroundSlicePlane.setFromNormalAndCoplanarPoint(
        this.stackHelper.slice.planeDirection,
        this.stackHelper.slice.planePosition
      )
      return tmpBackgroundSlicePlane
    },
    getMouseMovement2() {
      return {
        x: this.mousePosition2Cur.x - this.mousePosition2Prev.x,
        y: this.mousePosition2Cur.y - this.mousePosition2Prev.y,
      }
    },
    getMouseSliceMovement3() {
      tmpMouseSliceMovement3.copy(this.mousePositionSlice3Cur)
      tmpMouseSliceMovement3.sub(this.mousePositionSlice3Prev)
      return tmpMouseSliceMovement3
    },
    getOtherSliceViewsProjectionDirections() {
      const dirs = []
      _.each(this.centerPlaneIntersectionDirBySliceViewId, (dir, sliceViewId) => {
        // only for reference lines that aren't from myself
        if (sliceViewId !== this.referenceLineId) {
          if (!dir) {
            let vector = new THREE.Vector3(-1, 0, 0)
            dirs.push(vector)
          } else {
            dirs.push(dir)
          }
        }
      })

      return dirs
    },
    pointerMoveMain() {
      if (isDragControlHandling) {
        return
      }
      // selectedInteractableState is only set if an interactable is selected
      const selectedInteractableState = this.$store.getters['interactableService/selectedInteractableState']
      let selectionConfigCurrent = selectedInteractableState
        ? null
        : this.$store.getters['selectionConfig/selectionConfigCurrent']
      // either one, for cases where it doesn't matter which it is
      let selectedObject = selectedInteractableState || selectionConfigCurrent
      if (this.isCTLab) {
        selectionConfigCurrent = this.$store.getters['selectionConfig/selectionConfigCurrent']
        selectedObject = selectionConfigCurrent
      }

      if (selectedObject && this.toolSelected === 'move' && this.mouseButtonsDown.left) {
        let movement3 = this.getMouseSliceMovement3()
        log.debug('movement3', movement3.x, movement3.y, movement3.z)

        let { center3 } = selectedObject
        let planeClosest = this.getPlaneClosestOfSliceView()
        if (planeClosest.z) {
          const otherSliceViewsProjectionDirections = this.getOtherSliceViewsProjectionDirections()
          if (otherSliceViewsProjectionDirections.filter((el) => el && el.length() > 0)) {
            const projectionMovements = otherSliceViewsProjectionDirections.map((dir) => {
              return movement3.clone().projectOnVector(dir)
            })
            projectionMovements.forEach((el) => {
              center3.add(el)
            })
          } else {
            center3.add(movement3)
          }
        } else {
          center3.add(movement3) // Maybe this should be a call to the selectionConfig store
        }
        if (selectedInteractableState) {
          throttledCombinedUpdate(
            this.$store.dispatch,
            'interactableService/update',
            {},
            'selectionConfig/afterSelectionUserModified',
            {}
          )
        } else {
          throttledDispatch(this.$store.dispatch, 'selectionConfig/afterSelectionUserModified', {})
        }
      } else if (
        selectedObject &&
        this.toolSelected === 'rotate' &&
        this.mouseButtonsDown.left &&
        (!this.isCTLab ||
          selectedInteractableState ||
          (!this.isAcquisitionQuestion && !this.isLocalizerQuestion && this.isCTLab))
      ) {
        let { center3, xDirection3, yDirection3, zDirection3 } = selectedObject

        // Usually we just want to rotate around the plane that is the background/stackHelper slice, but in Outline mode, we want to rotate along the plane that is made up by the dots on the camera-most-facing side of the selection cuboid
        let rotationPlaneNormal = this.stackHelper.slice.planeDirection

        // if (this.selectedStackVolumeSelection && this.selectedStackVolumeSelection.isOutlineVisible()) {
        //   // This works for Outline, but not otherwise if there is also just a single slice intersection line (because then we don't have enough points?)
        //   // Maybe Refactor into method of that class?; maybe stackVolumeSelection.getCameraMostFacingSelectionPlane()
        //   let points = _.map(this.selectedStackVolumeSelection.controlCorners, 'position')
        //   let plane = new THREE.Plane().setFromCoplanarPoints(points[0], points[1], points[2])
        //   rotationPlaneNormal = plane.normal
        // }

        let planeClosest = this.getPlaneClosestOfSliceView()
        if (planeClosest.z) {
          rotationPlaneNormal = zDirection3.clone()
        }

        const controlCenterPosition = this.selectedStackVolumeSelection.getControlCenterPosition()
        const backgroundSlicePlane = this.getBackgroundSlicePlane()
        const controlCenterProjection = new Vector3().copy(controlCenterPosition)
        backgroundSlicePlane.projectPoint(controlCenterPosition, controlCenterProjection)

        // mousePositionSlice3 is the position of the mouse on the slice
        // center3 is the center of the selectionVolume ( that's offset by the amount from it to the where the slice is (which is also there the center dot is) in planeDir)
        // this.stackHelper.slice.planePosition ?
        // it's not just the selection Center3 + directionZ3 interesecting the slice.plane ( that might not even happen )
        // even if the center dot is wrong, we should rotate around that

        // This gets the signed angle between two points around 0,0... So first align them so that 0,0 is the center3, and then get signedAngle considering planeDirection (which is also our camera, so it lines up with the mouse's plane)
        // (center3 isn't quite the right point to rotate around, since that's not really where the middle dot is, but it's feel pretty close; and the current way of getting the middle dot is pretty hacky, too)
        // If it were to base off the center dot (or maybe the midpoint of all the corners (2 or...4)), persist what that is at drag start, and keep using that location until drag end (otherwise it will shift mid drag...)
        let before = this.mousePositionSlice3Prev.clone().sub(center3).normalize()
        let now = this.mousePositionSlice3Cur.clone().sub(center3).normalize()

        if (!planeClosest.z) {
          before = this.mousePositionSlice3Prev.clone().sub(controlCenterProjection).normalize()
          now = this.mousePositionSlice3Cur.clone().sub(controlCenterProjection).normalize()
        }

        // signed angle between start drag and current drag position
        let angle = getSignedAngleBetween(before, now, rotationPlaneNormal)
        console.log('angle', angle)

        if (!_.isFinite(angle)) {
          // got this to be NaN before, which would break the logic below
          console.error('BAD angle')
        } else {
          // distance
          // let distance = before.distanceTo(now)
          // log.debug('distance', distance)

          xDirection3.applyAxisAngle(rotationPlaneNormal, angle)
          yDirection3.applyAxisAngle(rotationPlaneNormal, angle)
          zDirection3.applyAxisAngle(rotationPlaneNormal, angle)

          if (!planeClosest.z) {
            const translatedPoint = center3.clone().sub(controlCenterPosition)
            // Create a quaternion for the rotation
            const quaternion = new THREE.Quaternion().setFromAxisAngle(rotationPlaneNormal.normalize(), angle)
            // Apply the rotation
            translatedPoint.applyQuaternion(quaternion)
            center3.copy(translatedPoint.add(controlCenterPosition))
          }

          // update every instance of this
          if (selectedInteractableState) {
            throttledCombinedUpdate(
              this.$store.dispatch,
              'interactableService/update',
              {},
              'selectionConfig/afterSelectionUserModified',
              {}
            )
          } else {
            throttledDispatch(this.$store.dispatch, 'selectionConfig/afterSelectionUserModified', {})
          }
        }
      } else if (
        selectionConfigCurrent &&
        this.toolSelected === 'oversampling' &&
        this.mouseButtonsDown.left &&
        ((this.isCTLab && !this.isAcquisitionQuestion && !this.isReconstructionQuestion) || !this.isCTLab)
      ) {
        let movement3 = this.getMouseSliceMovement3()
        let { center3, xDirection3, dimensions3, oversampling } = selectionConfigCurrent
        let towardsCenter =
          this.mousePositionSlice3Cur.distanceToSquared(center3) <
          this.mousePositionSlice3Prev.distanceToSquared(center3)

        // How much did we drag in the xDir3?
        let projected3 = movement3.clone().projectOnVector(xDirection3)
        let amountMovement = projected3.length() * (towardsCenter ? -1 : 1)
        // Translate the length of that change into the oversampling (stored as ratio 0...1)
        let oversamplingChange = amountMovement / (dimensions3.x * 0.5)
        oversampling += oversamplingChange

        this.$store.dispatch('selectionConfig/adjustOversamplingByUser', { oversampling }) // It should be good without Throttle Dispatch.
      } else if (selectedObject && this.toolSelected === 'resize' && this.mouseButtonsDown.left) {
        let movement3 = this.getMouseSliceMovement3()
        let haftOfMovement3 = new Vector3()
        if (this.isCTLab) {
          movement3 = movement3.multiplyScalar(0.5)
        }
        log.debug('movement3', movement3.x, movement3.y, movement3.z)

        let { center3, xDirection3, yDirection3, zDirection3, dimensions3 } = selectedObject

        // is movement towards center or away from it?
        let towardsCenter =
          this.mousePositionSlice3Cur.distanceToSquared(center3) <
          this.mousePositionSlice3Prev.distanceToSquared(center3)

        // Project first onto a configured axis to only limit resizing in one dimension based on side dot to it's center dot
        let preMovementProjected3 = new THREE.Vector3()
        preMovementProjected3.copy(movement3)
        if (this.toolSelectedConfig.axis) {
          preMovementProjected3.projectOnVector(this.toolSelectedConfig.axis)
        }

        // project vector of movement onto the axis vector of the selection; that's much much we moved in that axis
        // Z
        tmpMovementProjected3.copy(preMovementProjected3)
        tmpMovementProjected3.projectOnVector(zDirection3)
        let zDirMovement3 = tmpMovementProjected3.clone()
        let zDirMovement = tmpMovementProjected3.length() * (towardsCenter ? -1 : 1)
        // Y
        tmpMovementProjected3.copy(preMovementProjected3)
        tmpMovementProjected3.projectOnVector(yDirection3)
        let yDirMovement3 = tmpMovementProjected3.clone()
        let yDirMovement = tmpMovementProjected3.length() * (towardsCenter ? -1 : 1)
        // X
        tmpMovementProjected3.copy(preMovementProjected3)
        tmpMovementProjected3.projectOnVector(xDirection3)
        let xDirMovement3 = tmpMovementProjected3.clone()
        let xDirMovement = tmpMovementProjected3.length() * (towardsCenter ? -1 : 1)

        // Z
        tmpMovementProjected3z.copy(preMovementProjected3)
        tmpMovementProjected3z.projectOnVector(zDirection3)
        // Y
        tmpMovementProjected3y.copy(preMovementProjected3)
        tmpMovementProjected3y.projectOnVector(yDirection3)
        // X
        tmpMovementProjected3x.copy(preMovementProjected3)
        tmpMovementProjected3x.projectOnVector(xDirection3)

        // SatBands want the center to move so the opposite stays in place instead of the center
        let keepCenter3InPlace = !selectedInteractableState
        // * 2 if center3 stays in place, because however much we moved the mouse, that's how much we want to change the height on one side from the center, and then also change it the same amount on the other side of the center
        let dimensionDiffMultiplier = keepCenter3InPlace ? 2 : 1

        // Prevent unexpected change of X and Y dir when we drag Z move icon, on CT lab mode
        const isZdirMoveMax =
          Math.abs(zDirMovement) > Math.abs(xDirMovement) && Math.abs(zDirMovement) > Math.abs(yDirMovement)
        const shouldNotAdjustXY =
          this.isCTLab && isZdirMoveMax && !selectedInteractableState && zDirMovement !== 0 && !!selectionConfigCurrent

        // X / Y
        if (
          (xDirMovement !== 0 || yDirMovement !== 0 || (selectedInteractableState && zDirMovement !== 0)) &&
          !shouldNotAdjustXY
        ) {
          const WIDTH_DEPTH_INCREMENTS = 1
          // * 2 because however much we moved the mouse, that's how much we want to change the height on one side from the center, and then also change it the same amount on the other side of the center
          this.mouseMovementResizeRemainder3.x += xDirMovement * dimensionDiffMultiplier
          this.mouseMovementResizeRemainder3.y += yDirMovement * dimensionDiffMultiplier
          let changed = {}
          let changedDiff = new THREE.Vector3()

          // Only adjust X/Y dimensions by whole numbers
          //X
          if (Math.abs(this.mouseMovementResizeRemainder3.x) >= WIDTH_DEPTH_INCREMENTS) {
            let changedAmount = Math.floor(this.mouseMovementResizeRemainder3.x / WIDTH_DEPTH_INCREMENTS) // floor just works here because WIDTH_DEPTH_INCREMENTS is a whole number?
            this.mouseMovementResizeRemainder3.x -= changedAmount
            changed.x = Math.abs(dimensions3.x + changedAmount)
            changedDiff.add(tmpMovementProjected3x)
            haftOfMovement3.add(xDirMovement3)
          }
          //Y
          if (Math.abs(this.mouseMovementResizeRemainder3.y) >= WIDTH_DEPTH_INCREMENTS) {
            let changedAmount = Math.floor(this.mouseMovementResizeRemainder3.y / WIDTH_DEPTH_INCREMENTS)
            this.mouseMovementResizeRemainder3.y -= changedAmount
            changed.y = Math.abs(dimensions3.y + changedAmount)
            changedDiff.add(tmpMovementProjected3y)
            haftOfMovement3.add(yDirMovement3)
          }
          // SelectionConfig, X and/or Y may have changed
          if (selectionConfigCurrent) {
            if (!_.isEmpty(changed)) {
              this.$store.dispatch('selectionConfig/adjustDimensions3XYByUser', changed)
            }
          } else if (selectedInteractableState) {
            // Interactable, X/Y/Z may have changed, and are all treated the same way
            this.mouseMovementResizeRemainder3.z += zDirMovement * dimensionDiffMultiplier
            if (Math.abs(this.mouseMovementResizeRemainder3.z) >= WIDTH_DEPTH_INCREMENTS) {
              let changedAmount = Math.floor(this.mouseMovementResizeRemainder3.z / WIDTH_DEPTH_INCREMENTS)
              changedDiff.add(tmpMovementProjected3z)
              this.mouseMovementResizeRemainder3.z -= changedAmount
              changed.z = Math.abs(dimensions3.z + changedAmount)
            }
            if (!_.isEmpty(changed)) {
              Object.assign(dimensions3, changed)

              selectedInteractableState.center3.add(changedDiff.divideScalar(2))
              // selectedInteractableState.center3.add(preMovementProjected3.clone().divideScalar(2 ))

              throttledCombinedUpdate(
                this.$store.dispatch,
                'interactableService/update',
                {},
                'selectionConfig/afterSelectionUserModified',
                {}
              )
            }
          }
        }

        // Z Axis has to account for its height change in terms of the 3 numbers that make it up
        if (selectionConfigCurrent && zDirMovement !== 0) {
          this.mouseMovementResizeRemainder3.z += zDirMovement * 2
          haftOfMovement3.add(zDirMovement3)
          this.$store.dispatch('selectionConfig/heightChanged', {
            currentVal: Math.abs(dimensions3.z + this.mouseMovementResizeRemainder3.z),
            onHeightChanged: () => {
              // this is mostly for the Number Of Slices resize, which only adjusts in full numbers or nothing
              // this remainder keeps track of mouse movement that's too small to change the slice number, but might add up with more moving
              // Bug?: Looks like we're losing any remainder after a change happens... this should technically just subtract as much slices worth of distance as we adjusted
              this.mouseMovementResizeRemainder3.z = 0
            },
          })
        }

        // Move box with haft movement
        if (this.isCTLab && selectionConfigCurrent) {
          let { center3 } = selectionConfigCurrent
          center3.add(haftOfMovement3) // Maybe this should be a call to the selectionConfig store
          // this.$store.dispatch('selectionConfig/afterSelectionUserModified', {})
          throttledDispatch(this.$store.dispatch, 'selectionConfig/afterSelectionUserModified', {})
        }
      } else if ((this.toolSelected === 'windowing' && this.mouseButtonsDown.left) || this.mouseButtonsDown.middle) {
        let movement2 = this.getMouseMovement2()
        log.debug('movement2', movement2)

        // log.debug('move', movement2.x, event.movement2Y)
        // adjust windowWidth / windowCenter
        // https://codesandbox.io/s/github/FNNDSC/ami/tree/master/lessons/01

        // windowingStyle 'ge' inverse the direction of the controls

        const baseRange = this.stackHelper.stack.minMax[1] - this.stackHelper.stack.minMax[0]
        const baseMultiplier = this.windowingDirection * (baseRange / 140)
        const maxClamp = baseRange * 2
        const minWindowWidthClamp = this.isCTLab
          ? Math.min(this.stackHelper.stack.minMax[0], -baseRange * 2)
          : Math.max(0.0001, this.stackHelper.stack.minMax[0])
        const minWindowLevelClamp = this.isCTLab
          ? Math.min(this.stackHelper.stack.minMax[0], -baseRange * 2)
          : Math.max(0.0001, this.stackHelper.stack.minMax[0])

        const widthMultiplier = config.isCTLab ? baseMultiplier / 4 : baseMultiplier
        const centerMultiplier = config.isCTLab ? baseMultiplier / 4 : baseMultiplier

        if (movement2.x !== 0) {
          // Make sure the geometry updates due to windowing value
          this.geometryMustUpdate = true

          let windowWidth = this.windowWidth
          windowWidth += movement2.x * widthMultiplier
          windowWidth = clamp(windowWidth, minWindowWidthClamp, maxClamp)
          if (this.windowWidth !== windowWidth) {
            // Make sure the geometry updates due to windowing value
            this.geometryMustUpdate = true
            this.windowWidth = windowWidth
          }
          log.debug('windowWidth', windowWidth)
        }
        if (movement2.y !== 0) {
          let windowCenter = this.windowCenter
          windowCenter += movement2.y * centerMultiplier
          windowCenter = clamp(windowCenter, minWindowLevelClamp, maxClamp)
          if (this.windowCenter !== windowCenter) {
            // Make sure the geometry updates due to windowing value
            this.geometryMustUpdate = true
            this.windowCenter = windowCenter
          }
          log.debug('windowCenter', windowCenter)
        }
      } else if ((this.toolSelected === 'zoom' && this.mouseButtonsDown.left) || this.mouseButtonsDown.right) {
        let movement2 = this.getMouseMovement2()
        log.debug('movement2', movement2)

        if (movement2.y !== 0) {
          // Make sure the geometry updates due to camera zoom
          this.geometryMustUpdate = true

          this.zoom -= movement2.y * 0.01
          this.zoom = clamp(this.zoom, 0.1, 8.0)
        }
      } else if (this.toolSelected === 'pan' && this.mouseButtonsDown.left) {
        let movement2 = this.getMouseMovement2()
        log.debug('movement2', movement2)

        if (movement2.x !== 0) {
          // Make sure the geometry updates due to camera movement
          this.geometryMustUpdate = true

          // Use the true zoom (this.camera.zoom) vs the untranslated amount (this.zoom) so panning works right in fullscreen
          // flip dir of left/right movement here when camaera is flipped
          let flippedLR = this.isCameraLeftRightFlipped ? -1 : 1
          this.camera.left -= (movement2.x / this.camera.zoom) * flippedLR
          this.camera.right -= (movement2.x / this.camera.zoom) * flippedLR
        }
        if (movement2.y !== 0) {
          //Make sure the geometry updates due to camera movement
          this.geometryMustUpdate = true

          this.camera.top += movement2.y / this.camera.zoom
          this.camera.bottom += movement2.y / this.camera.zoom
        }
      }
    },
    onKeyPress(event) {
      let hotKeysEnabled = true
      if (this.$store.state.selectionConfig !== undefined) {
        hotKeysEnabled = this.$store.state.selectionConfig.isHotkeysEnabledCT
      }
      if (this.isCTLab && hotKeysEnabled) {
        const newConfigs = {}
        const value = this.windowLevelWidths.find((v) => v.hotKeyCode == event.keyCode)
        if (value && value.windowWidth && value.windowLevel) {
          newConfigs.windowWidth = value.windowWidth
          newConfigs.windowLevel = value.windowLevel

          this.assignValueToSelectionConfigs({ objects: newConfigs })
        }
      }
    },
    setupCamera3D() {
      if (this.camera3D) {
        return
      }

      log.debug('Setting up 3D Camera...')
      this.camera3D = new THREE.PerspectiveCamera(45, this.elBox.offsetWidth / this.elBox.offsetHeight, 0.01, 10000000)
      this.camera3D.position.x = 150
      this.camera3D.position.y = 150
      this.camera3D.position.z = 100
      this.camera3D.zoom = 1
      this.camera3D.lookAt(this.originX, this.originY, this.originZ)
      this.camera3D.updateProjectionMatrix()
    },
    setSliceIndex(index, updateGeometries = true) {
      // always update the geometry on the next frame when the index changes
      this.geometryMustUpdate = updateGeometries || this.indexSlice !== index

      for (const [key] of Object.entries(this.pointSelectionMeshes)) {
        if (_.get(this.selections, [key, 'indexSlice']) == this.indexSlice) {
          this.pointSelectionMeshes[key].visible = false
        }
      }

      for (const [key] of Object.entries(this.satBandMeshes)) {
        if (
          _.get(this.satBandSelections, [key, 'indexSlice']) == this.indexSlice &&
          _.get(this.satBandSelections, [key, 'stackName']) == this.stackConfig?.name
        ) {
          this.satBandMeshes[key].visible = false
        }
      }

      for (const [key] of Object.entries(this.pointPreviewChosenSelectionMeshes)) {
        if (key == this.indexSlice) {
          this.pointPreviewChosenSelectionMeshes[key].visible = false
        }
      }

      this.indexSlice = index
      if (this.indexSlice < 0) {
        this.indexSlice = this.stackConfigSlicesAmount - 1
      } else if (this.indexSlice > this.stackConfigSlicesAmount - 1) {
        this.indexSlice = 0
      }
      // Check is first slice view
      if (this.isCTLab && this.isPlaySlice) {
        this.setSliceIndexOfFirstSliceView(this.indexSlice)
      }

      //log.debug('setSliceIndex', this.indexSlice)
      // if (this.isPlaySlice && this.isCTLab) {
      //   EventBus.$emit('onIndexSliceChange', this.indexSlice, this.stackConfigSlicesAmount)
      // }
      // Put all the current StackConfig Slice's state directly into the state of this component
      _.extend(
        this,
        {
          // default these to null as they originally, because they are not always included in the slice obj
          isLimited: null,
          selectionCorners: null,
          selectionLimitCorners: null,
        },
        this.stackConfigSlices[this.indexSlice]
      )

      if (this.stackHelper.slice && !this.windowWidth) {
        this.windowWidth = this.stackHelper.slice.windowWidth
      }

      if (this.stackHelper.slice && !this.windowCenter) {
        this.windowCenter = this.stackHelper.slice.windowCenter
      }

      if (this.geometryMustUpdate) {
        this.updateGeometries() // camera needs to update
        if (this.stackVolumeSelections) {
          _.each(this.stackVolumeSelections, (stackVolumeSelection) =>
            stackVolumeSelection.updateGeometries({ recreateLines: true })
          )
          _.each(this.interactableInstances, (interactableInstance) =>
            interactableInstance.updateGeometries({ recreateLines: true })
          )
        }
      }

      // Scrolling with the mouse / sliding which BG Slice is shown makes this the active SliceView
      // (Needs to happen after updateGeometries above, otherwise it lags one sliceIndex behind sometimes)
      this.activateThisSliceView()

      if (!(this.isInCriticalThinkingQuestion || this.isInCriticalThinkingQuestionForFullScreen)) {
        this.setCurrentSelection(null)
      }

      this.setCurrentSatBandSelection(null)
      for (const [key] of Object.entries(this.pointSelectionMeshes)) {
        if (_.get(this.selections, [key, 'indexSlice']) == this.indexSlice) {
          this.pointSelectionMeshes[key].visible = true
        }
      }
      let isAnySatBandZoneVisible = false
      for (const [key] of Object.entries(this.satBandMeshes)) {
        if (
          _.get(this.satBandSelections, [key, 'indexSlice']) == this.indexSlice &&
          _.get(this.satBandSelections, [key, 'stackName']) == this.stackConfig?.name
        ) {
          this.satBandMeshes[key].visible = this.visibleSatBand
          isAnySatBandZoneVisible = true
        }
      }
      if (isAnySatBandZoneVisible) {
        this.updateSatBandGradeZone()
      }
      for (const [key] of Object.entries(this.pointPreviewChosenSelectionMeshes)) {
        if (key == this.indexSlice) {
          this.pointPreviewChosenSelectionMeshes[key].visible = true
          // Highlight selection when any preview user select point intersect with selection
          this.updateClickableQuestion()
        }
      }

      this.hideSnapPointEditPolygonPointSelect()
      this.updateProjectionOfSatBandGradeZone()
    },
    hideSnapPointEditPolygonPointSelect() {
      this.snapDraggableObjectContainer.remove(...this.snapDraggableObjectContainer.children)
    },
    movePositionInto(amount = 1) {
      this.originX += this.zDirectionX * amount
      this.originY += this.zDirectionY * amount
      this.originZ += this.zDirectionZ * amount
    },
    onFrame() {
      let shouldRender = false
      // if we're looking at fullscreen, but that's not me, save the effort; vice versa
      if (this.amFullscreen === this.isFullscreen) {
        // don't update things unless needed
        if (this.geometryMustUpdate) {
          this.geometryMustUpdate = false
          this.updateGeometries()
          if (this.isCTLab) {
            if (this.stackVolumeSelections) {
              _.each(this.stackVolumeSelections, (stackVolumeSelection) =>
                stackVolumeSelection.updateGeometries({ recreateLines: true })
              )
            }
          }
          shouldRender = true
        }
        shouldRender |= _.some(this.stackVolumeSelections, 'needsRender')
        shouldRender |= _.some(this.interactableInstances, 'needsRender')
        for (const selection of _.concat(this.stackVolumeSelections, this.interactableInstances)) {
          selection.needsRender = false
        }

        if (shouldRender) {
          this.render()
        }
      }
      this.requestAnimationId = requestAnimationFrame(() => {
        this.onFrame()
      })
    },
    render() {
      let camera = this.camera
      if (this.bShowCamera3D) {
        this.setupCamera3D()
        camera = this.camera3D
      }
      this.renderer.render(this.scene, camera)
    },
    toggleShowCamera3D() {
      this.bShowCamera3D = !this.bShowCamera3D
      _.each(this.stackVolumeSelections, (stackVolumeSelection) =>
        stackVolumeSelection.setIsCamera3D(this.bShowCamera3D)
      )
    },
    // "Copy Slice Position" action - sets Selection position to slice's midpoint, and changes orientation to be axis-aligned with slice plane
    setSelectionToSliceMidpoint(isPerpendicular) {
      // We want to have the full directions of the current sliceConfig (so zDir3 and yDir3 is enough to cross them to gain xDir3)
      // Default Localizers don't have these axis, but for them camera.up works fine because they are axis-aligned (by custom Scans often are not, so use actual yDir3 if known)
      let { yDirectionX, yDirectionY, yDirectionZ } = this.stackConfigSlices[this.indexSlice]
      let yDir3 = _.isFinite(yDirectionX) ? { x: yDirectionX, y: yDirectionY, z: yDirectionZ } : this.camera.up

      if (!config.isCTLab) {
        this.$store.dispatch('selectionConfig/setSelectionToSliceMidpoint', [
          getMidpointFromStackHelperSlice(this.stackHelper.slice),
          yDir3,
          { x: this.zDirectionX, y: this.zDirectionY, z: this.zDirectionZ },
          this.camera.up,
          isPerpendicular,
        ])
      } else {
        this.$store.dispatch('selectionConfig/setSelectionToSliceMidpoint', [
          getMidpointFromStackHelperSlice(this.stackHelper.slice),
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: -1 },
          { x: 0, y: 0, z: 1 },
          isPerpendicular,
        ])
      }
    },
    updateGeometriesNextFrame() {
      this.geometryMustUpdate = true
    },
    updateShaderMaterialForMRMode() {
      this.shouldUpdateMRShaderMaterial = true
      if (this.isCTLab) {
        this.shouldUpdateMRShaderMaterial = false
      }
      if (this.isCTLab || !this.stackHelper.slice.mesh) {
        return
      }

      let satBandsToCutSlice = _.get(this.stackConfig, ['satBands'], [])
      if (!_.isArray(satBandsToCutSlice)) {
        satBandsToCutSlice = []
      }

      const boxes = []

      satBandsToCutSlice.forEach((box3) => {
        const center = _.get(box3, ['center3'])
        const dimensions = _.get(box3, ['dimensions3'])

        if (!_.isNil(center) && !_.isNil(dimensions)) {
          const xDir3Data = _.get(box3, ['xDirection3'], { x: 1, y: 0, z: 0 })
          const xDir3 = new Vector3(xDir3Data.x, xDir3Data.y, xDir3Data.z).normalize()
          const yDir3Data = _.get(box3, ['yDirection3'], { x: 0, y: 1, z: 0 })
          const yDir3 = new Vector3(yDir3Data.x, yDir3Data.y, yDir3Data.z).normalize()
          const zDir3Data = _.get(box3, ['zDirection3'], { x: 0, y: 1, z: 0 })
          const zDir3 = new Vector3(zDir3Data.x, zDir3Data.y, zDir3Data.z).normalize()

          const size = new Vector3(dimensions.x, dimensions.y, dimensions.z)
          const pos = new Vector3(center.x, center.y, center.z)
          const nullBox0 = pos
            .clone()
            .add(xDir3.clone().multiplyScalar(-0.5 * size.x))
            .add(yDir3.clone().multiplyScalar(-0.5 * size.y))
            .add(zDir3.clone().multiplyScalar(-0.5 * size.z))
          const nullBoxX = pos
            .clone()
            .add(xDir3.clone().multiplyScalar(0.5 * size.x))
            .add(yDir3.clone().multiplyScalar(-0.5 * size.y))
            .add(zDir3.clone().multiplyScalar(-0.5 * size.z))
          const nullBoxY = pos
            .clone()
            .add(xDir3.clone().multiplyScalar(-0.5 * size.x))
            .add(yDir3.clone().multiplyScalar(0.5 * size.y))
            .add(zDir3.clone().multiplyScalar(-0.5 * size.z))
          const nullBoxZ = pos
            .clone()
            .add(xDir3.clone().multiplyScalar(-0.5 * size.x))
            .add(yDir3.clone().multiplyScalar(-0.5 * size.y))
            .add(zDir3.clone().multiplyScalar(0.5 * size.z))
          boxes.push({
            nullBox0: nullBox0,
            nullBoxX: nullBoxX,
            nullBoxY: nullBoxY,
            nullBoxZ: nullBoxZ,
          })
        }
      })

      // Shader only world if boxes length is greater than 0
      if (boxes.length > 0) {
        this.stackHelper.slice.mesh.material.uniforms.boxes = {
          value: boxes,
        }
        this.stackHelper.slice.mesh.material.clipping = true
        this.stackHelper.slice.mesh.material.vertexShader = getMRSliceVertexShaderContent()
        this.stackHelper.slice.mesh.material.fragmentShader = getMRLabFragmentShader(boxes.length)
        this.stackHelper.slice.mesh.material.needsUpdate = true
        this.stackHelper.slice.mesh.material.uniformsNeedUpdate = true
        this.shouldUpdateMRShaderMaterial = false
        this.geometryMustUpdate = true
      } else {
        this.stackHelper.slice.mesh.material.clipping = true
        this.stackHelper.slice.mesh.material.vertexShader = getCTLabSliceVertexShaderContent()
        this.stackHelper.slice.mesh.material.fragmentShader = getCTLabFragmentShader()
        this.stackHelper.slice.mesh.material.needsUpdate = true
        this.shouldUpdateMRShaderMaterial = false
        this.geometryMustUpdate = true
      }
    },
    updateShaderMaterialForCTMode() {
      if (!this.isCTLab || !this.scene) {
        return
      }
      if (this.stackHelper?.slice?.mesh) {
        this.stackHelper.slice.mesh.material.clipping = true
        // In dicom preview Mode, load the saved planes from user answer
        if (this.isPreviewSliceView) {
          const filterCTModelPlanesOfStackConfigs = this.previewLimitedCtModelPlanes
            .map((el) => {
              if (el.n && el.p) {
                return new Plane().setFromNormalAndCoplanarPoint(dataToVector3(el.n), dataToVector3(el.p))
              } else {
                return null
              }
            })
            .filter((el) => !!el)
          this.stackHelper.slice.mesh.material.clippingPlanes = filterCTModelPlanesOfStackConfigs
        } else {
          let filterCTModelPlanesOfStackConfigs = this.limitedCTModelPlanesOfStackConfigs.filter(
            (el) => el.questionIndex < this.selectedStackQuestionIndex
          )
          // We must sort configs list
          filterCTModelPlanesOfStackConfigs = _.orderBy(filterCTModelPlanesOfStackConfigs, ['questionIndex'])

          // Get last acq limit
          if (filterCTModelPlanesOfStackConfigs.length > 0) {
            const lastQuestionIndex =
              filterCTModelPlanesOfStackConfigs[filterCTModelPlanesOfStackConfigs.length - 1].questionIndex
            filterCTModelPlanesOfStackConfigs = filterCTModelPlanesOfStackConfigs.filter(
              (el) => el.questionIndex == lastQuestionIndex
            )
          } else {
            filterCTModelPlanesOfStackConfigs = []
          }

          filterCTModelPlanesOfStackConfigs = filterCTModelPlanesOfStackConfigs.map((el) => el.plane)

          if (this.stackConfig?.isLocalizer) {
            filterCTModelPlanesOfStackConfigs = []
          }
          if (this.questionSet) {
            let limitScanPercentPlanesOfLandmark = this.limitedCTModelPlanesOfLandmark.planes
            let limitScanPercentPlanes = this.limitedCTModelPlanesOfScanPercent
            if (!this.isPlayingTheSlices && !this.isMriMachineScanComplete) {
              limitScanPercentPlanes = [limitZPlane1, limitZPlane2]
            }
            if (
              !this.stackConfig?.isLocalizer ||
              this.isEditingQuestion ||
              ((!this.stackConfig?.isLocalizer || this.stackConfig?.name.includes(this.extraScanBaseName)) &&
                this.selectedStackQuestionIndex != 0 &&
                !(
                  this.selectedStackQuestionIndex == 1 &&
                  this.prevStackQuestion &&
                  _.get(this.prevStackQuestion, 'questionType') === 3
                ))
            ) {
              limitScanPercentPlanes = []
              limitScanPercentPlanesOfLandmark = []
            }
            // If question set doesn't have localizer question, no cover the localizer view
            if (!this.hasLocalizerQuestion) {
              limitScanPercentPlanes = []
            }
            this.stackHelper.slice.mesh.material.clippingPlanes = [
              ...filterCTModelPlanesOfStackConfigs,
              ...limitScanPercentPlanes,
              ...limitScanPercentPlanesOfLandmark,
            ]
          } else {
            this.stackHelper.slice.mesh.material.clippingPlanes = filterCTModelPlanesOfStackConfigs
          }
        }

        this.stackHelper.slice.mesh.material.vertexShader = getCTLabSliceVertexShaderContent()
        this.stackHelper.slice.mesh.material.fragmentShader = getCTLabFragmentShader()
        this.stackHelper.slice.mesh.material.needsUpdate = true
      }
      this.updateGeometriesNextFrame()
    },
    updateGeometries() {
      if (!this.stackHelper.slice || !this.camera) {
        return
      }
      if (
        this.stackHelper.slice.planePosition &&
        (this.stackHelper.slice.planePosition.x !== this.originX ||
          this.stackHelper.slice.planePosition.y !== this.originY ||
          this.stackHelper.slice.planePosition.z !== this.originZ)
      ) {
        // configs with null as the origin means we don't have one, and want to go to WorldCenter
        if (!_.isFinite(this.originX) || !_.isFinite(this.originY) || !_.isFinite(this.originZ)) {
          const centerLPS = this.stackHelper.stack.worldCenter()
          log.debug('set origin from WordCenter', centerLPS.x, centerLPS.y, centerLPS.z)
          // TODO One way to pan: offset this by as much as desired, make it clamp to the worldbounds below
          this.originX = centerLPS.x
          this.originY = centerLPS.y
          this.originZ = centerLPS.z
        }

        // https://codesandbox.io/s/github/FNNDSC/ami/tree/master/lessons/03
        // const worldbb = stack.worldBoundingBox();
        // const lpsDims = new THREE.Vector3(
        //   worldbb[1] - worldbb[0],
        //   worldbb[3] - worldbb[2],
        //   worldbb[5] - worldbb[4]
        // );
        // let { center3, xDirection3, yDirection3, zDirection3 } = this.$store.state.selectionConfig
        // this.camera.directions = [this.stackHelper.stack.xCosine, this.stackHelper.stack.yCosine, this.stackHelper.stack.zCosine];
        //

        log.debug('set stackHelper center from this origin', this.originX, this.originY, this.originZ)
        this.stackHelper.slice.planePosition.x = this.originX
        this.stackHelper.slice.planePosition.y = this.originY
        this.stackHelper.slice.planePosition.z = this.originZ
      }

      let dirLPS = this.stackHelper.slice.planeDirection
      dirLPS.x = this.zDirectionX
      dirLPS.y = this.zDirectionY
      dirLPS.z = this.zDirectionZ
      // keep image facing upwards somewhat? we don't want to go upside down, which might invert the image

      // Fix: FLIP L/R
      // In CT Lab mode, axial view reference from the direction of mri machine in/out
      // To prevent image flip L/R is wrong, always set the dirLPS closest Z > 0
      if (this.isCTLab) {
        let closestSignedWorldAxis3 = getClosestSignedAxis3(dirLPS)
        if (closestSignedWorldAxis3.z == -1) {
          dirLPS = dirLPS.clone().negate()
        }
      }

      if (dirLPS.lengthSq() === 0) {
        dirLPS.z = 1
      }
      dirLPS.normalize()

      if (!this.lastDirLPS) {
        this.lastSetUpCameraStackConfigName = ''
        this.lastDirLPS = dirLPS.clone()
        this.isMoveToCenterOfLimitSquare = false
      } else if (this.lastDirLPS.angleTo(dirLPS) > 0.01) {
        this.lastSetUpCameraStackConfigName = ''
        this.lastDirLPS.copy(dirLPS)
        this.isMoveToCenterOfLimitSquare = false
      }

      if (
        this.isCTLab &&
        ((this.indexSlice == 0 && this.isPlayingTheSlices) ||
          this.lastSetUpCameraStackConfigName != _.get(this.stackConfig, ['name']))
      ) {
        this.isMoveToCenterOfLimitSquare = false
      }

      this.stackHelper.slice._update()
      if (!this.stackHelper.slice.mesh) {
        console.warn('Invalid Slice', this.stackHelper.slice)
        return
      }

      // If stack helper mesh is exist, update material
      if (this.shouldUpdateMRShaderMaterial) {
        this.updateShaderMaterialForMRMode()
      }

      this.setWindowToSliceMesh()

      // Unclear why, but there is distortion if these are > 0
      if (this.stackHelper.slice.thickness !== 0) {
        this.stackHelper.slice.thickness = 0
      }
      if (this.stackHelper.slice.spacing !== 0) {
        this.stackHelper.slice.spacing = 0
      }

      // move camera 2D
      // start from slice planePosition, move out into direction we want to see, and then look back at slice
      // Camera position is the center point of slice shown when this stackConfig renderd at the first time
      let meshCenter = this.stackHelper.slice.planePosition
      try {
        if (_.get(this.stackConfig, ['name']) == this.lastSetUpCameraStackConfigName) {
          this.camera.position.copy(this.lastCameraOriginPosition)
          meshCenter = this.lastCameraOriginPosition
        }
        // Only on test mode
        else if (
          this.dicomLocalizerBoxConfig &&
          this.limitedCTModelPlanesOfLandmark &&
          this.limitedCTModelPlanesOfLandmark.limit
        ) {
          const { startPoint, endPoint } = this.limitedCTModelPlanesOfLandmark.limit
          const setupCenter = startPoint.clone().add(endPoint).multiplyScalar(0.5)
          let plane = new THREE.Plane()
            .setFromNormalAndCoplanarPoint(dirLPS.clone(), this.stackHelper.slice.planePosition)
            .normalize()
          plane.projectPoint(setupCenter, meshCenter)
          this.lastSetUpCameraStackConfigName = _.get(this.stackConfig, ['name'])
          this.lastCameraOriginPosition.copy(meshCenter)
          this.camera.position.copy(meshCenter)
        } else if (this.limitedCTLocalizerConfigBox) {
          const { startPoint, endPoint } = this.limitedCTLocalizerConfigBox
          const setupCenter = startPoint.clone().add(endPoint).multiplyScalar(0.5)
          let plane = new THREE.Plane()
            .setFromNormalAndCoplanarPoint(dirLPS.clone(), this.stackHelper.slice.planePosition)
            .normalize()
          plane.projectPoint(setupCenter, meshCenter)
          this.lastSetUpCameraStackConfigName = _.get(this.stackConfig, ['name'])
          this.lastCameraOriginPosition.copy(meshCenter)
          this.camera.position.copy(meshCenter)
        } else {
          const box3 = new Box3().setFromObject(this.stackHelper.slice.mesh)
          meshCenter = box3.getCenter(new Vector3())
          if (this.dicomLocalizerBoxCenter && this.isCTLab) {
            const setupCenter = new THREE.Vector3(
              this.dicomLocalizerBoxCenter.x,
              this.dicomLocalizerBoxCenter.y,
              this.dicomLocalizerBoxCenter.z
            )
            let plane = new THREE.Plane()
              .setFromNormalAndCoplanarPoint(dirLPS.clone(), this.stackHelper.slice.planePosition)
              .normalize()
            plane.projectPoint(setupCenter, meshCenter)
          }
          this.lastSetUpCameraStackConfigName = _.get(this.stackConfig, ['name'])
          this.lastCameraOriginPosition.copy(meshCenter)
          this.camera.position.copy(meshCenter)
        }
        // eslint-disable-next-line no-empty
      } catch (err) {}

      if (this.isCameraReversed) {
        this.camera.position.add(dirLPS.clone().multiplyScalar(600).negate())
      } else {
        this.camera.position.add(dirLPS.clone().multiplyScalar(600))
      }
      // camera.getWorldDirection === dirLPS.negate() ?

      // this.camera.up.copy(dirLPS) // THIS IS HOW YOU ROTATE THE CAMERA
      // if (dirLPS.x === 1) {
      let dirAbs = _.mapValues(dirLPS, Math.abs)
      // if x is the direction the most: Sigittal - side
      if (dirAbs.x >= dirAbs.y && dirAbs.x >= dirAbs.z) {
        // camera up is the top of the head
        // console.log('Dir most: X', dirAbs.x, dirAbs.y, dirAbs.z)
        this.cameraDirAxisName = 'x'
        this.camera.up.set(0, 0, 1)
        // Y is the most: Coronal - front
      } else if (dirAbs.y >= dirAbs.x && dirAbs.y >= dirAbs.z) {
        // camera up is the top of the head
        // console.log('Dir most: Y', dirAbs.x, dirAbs.y, dirAbs.z)
        this.camera.up.set(0, 0, 1)
        this.cameraDirAxisName = 'y'
        //  Z is the most: Axial - bottom
      } else {
        // This view is from the bottom of the head, looking up to the top of the head
        // camera up is the face
        // console.log('Dir most: Z', dirAbs.x, dirAbs.y, dirAbs.z)
        this.cameraDirAxisName = 'z'

        // Guard: dicomFileSet may not be ready yet
        const flipAxial = _.get(this, ['dicomFileSet', 'flipAxial'], false)
        if (flipAxial) {
          this.camera.up.set(0, 1, 0)
        } else {
          this.camera.up.set(0, -1, 0)
        }
      }

      let displacementVector = this.isCameraReversed
        ? dirLPS.clone().multiplyScalar(350).negate()
        : dirLPS.clone().multiplyScalar(350)

      //Reference Line - if enabled and we know where the corners of the active SliceView's bgSlice is
      _.each(this.referenceSliceCornersBySliceViewId, (referenceSliceCorners, sliceViewId) => {
        // only for reference lines that aren't from myself
        if (sliceViewId !== this.referenceLineId) {
          let referenceLine = this.referenceLineBySliceViewId[sliceViewId]
          // create as needed
          if (!referenceLine) {
            referenceLine = new THREE.Line(createLineGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff }))
            referenceLine.visible = false
            this.scene.add(referenceLine)
            this.referenceLineBySliceViewId[sliceViewId] = referenceLine
          }

          if (this.showReferenceLines && referenceSliceCorners) {
            setIntersectionLineFromPlaneAndFourCorners(
              referenceLine,
              this.getBackgroundSlicePlane(),
              referenceSliceCorners,
              displacementVector
            )
          } else {
            referenceLine.visible = false
          }
        }
      })

      // Only apply limiting when we have a limited area and stackVolumeSelections is available
      // Without limiting, Phase/Frequency (X/Y dimensions) of the scan/reformat would not apply, and the output slice would be infinitely wide/tall (not like a real MRI) (up to what we have data for, which is the HD data we have)
      if (this.isLimited && this.selectionCorners && this.stackVolumeSelections) {
        this.createLimitedSquareForSliceIndex(this.indexSlice)

        let limitedSquare = this.stackConfig.limitedSquare[this.indexSlice]
        if (_.size(limitedSquare) > 2) {
          let newShapeGeo = this.createShapeGeometryFromLimitedSquare(limitedSquare)

          this.stackHelper.slice.mesh.geometry.dispose()
          this.stackHelper.slice.mesh.geometry = newShapeGeo
          this.stackHelper.slice._geometry = newShapeGeo
          this.stackHelper.slice.geometry = newShapeGeo

          // Move to center of first slice config
          try {
            if (!this.isMoveToCenterOfLimitSquare) {
              const centerSliceIndex = Math.floor(this.stackConfigSlicesAmount / 2) || 0
              this.createLimitedSquareForSliceIndex(centerSliceIndex)
              const limitedSquareOfMiddleSlice = this.stackConfig.limitedSquare[centerSliceIndex]
              const shapeGeoOfMiddleSlice = this.createShapeGeometryFromLimitedSquare(limitedSquareOfMiddleSlice)
              if (shapeGeoOfMiddleSlice) {
                const { meshCenter: meshCenterOfMiddleSlice } = this.fitCameraToShape(shapeGeoOfMiddleSlice, dirLPS)
                meshCenter = meshCenterOfMiddleSlice
              }
            }
          } catch (err) {
            // No action
          }
        }
      }

      this.camera.lookAt(meshCenter)
      this.camera.updateProjectionMatrix()
      this.camera.updateMatrixWorld()
    },
    setWindowToSliceMesh() {
      if (this.windowWidth) {
        this.stackHelper.slice.windowWidth = this.windowWidth
      }
      if (this.windowCenter) {
        this.stackHelper.slice.windowCenter = this.windowCenter
      }
    },
    fitCameraToShape(newShapeGeo, dirLPS) {
      const meshCenter = newShapeGeo.boundingBox.getCenter(new Vector3())
      this.lastSetUpCameraStackConfigName = _.get(this.stackConfig, ['name'])
      this.lastCameraOriginPosition.copy(meshCenter)
      this.camera.position.copy(meshCenter)
      if (this.isCameraReversed) {
        this.camera.position.add(dirLPS.clone().multiplyScalar(600).negate())
      } else {
        this.camera.position.add(dirLPS.clone().multiplyScalar(600))
      }

      // Need to add padding from border to box
      const padding = 0 // 0.15
      const cloneShape = newShapeGeo.clone()
      const targetAxis =
        this.cameraDirAxisName === 'x'
          ? new THREE.Vector3(1, 0, 0)
          : this.cameraDirAxisName === 'y'
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(0, 0, 1)
      const shapeNormalDir = dirLPS.angleTo(targetAxis) >= Math.PI / 2 ? dirLPS.clone().negate() : dirLPS.clone()
      const quaternion = new THREE.Quaternion().setFromUnitVectors(shapeNormalDir.normalize(), targetAxis)
      const rotateMatrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion)
      // Rotate shape to camera direction to calc correct bouding box size
      cloneShape.applyMatrix4(rotateMatrix)
      cloneShape.computeBoundingBox()
      const { x, y, z } = cloneShape.boundingBox.getSize(new Vector3())
      const aspect = this.elBox.offsetWidth / this.elBox.offsetHeight
      const viewHeight = Math.abs(this.camera.top - this.camera.bottom) * (1 - padding)
      const viewWidth = viewHeight * aspect * (1 - padding)
      if (this.cameraDirAxisName === 'x') {
        this.zoom = Math.min(viewWidth / y, viewHeight / z)
      } else if (this.cameraDirAxisName === 'y') {
        this.zoom = Math.min(viewWidth / x, viewHeight / z)
      } else if (this.cameraDirAxisName === 'z') {
        this.zoom = Math.min(viewWidth / x, viewHeight / y)
      }
      this.camera.zoom = this.zoom

      this.isMoveToCenterOfLimitSquare = true

      return {
        meshCenter,
      }
    },
    createShapeGeometryFromLimitedSquare(limitedSquare) {
      if (_.size(limitedSquare) <= 2) {
        return null
      }
      // shape construction from
      // if we only have 1 or 2 vertices, just show the whole thing
      // 3 sucks too, because then we get a triangle, which looks real bad; see triangle reformat output in https://app.clubhouse.io/scanlab/story/709/even-in-non-contrastlab-scans-sometimes-result-in-overcut-triangle-output-slices

      // shape construction from https://github.com/FNNDSC/ami/blob/master/src/geometries/geometries.slice.js
      // create the shape
      let shape = new THREE.Shape()
      // move to first point
      shape.moveTo(limitedSquare[0].xy.x, limitedSquare[0].xy.y)

      // loop through all points
      const positions = new Float32Array(limitedSquare.length * 3)
      positions.set(limitedSquare[0].toArray(), 0)

      for (let i = 1; i < limitedSquare.length; i++) {
        // project each on plane
        positions.set(limitedSquare[i].toArray(), i * 3)

        shape.lineTo(limitedSquare[i].xy.x, limitedSquare[i].xy.y)
      }

      // close the shape
      shape.lineTo(limitedSquare[0].xy.x, limitedSquare[0].xy.y)

      // Unfortunetly, updating the geo doesn't seem to be enough if it doesn't have 4 vertices. This completely rebuilds it
      let newShapeGeo = new THREE.ShapeBufferGeometry(shape)
      newShapeGeo.type = 'SliceBufferGeometry'
      newShapeGeo.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      newShapeGeo.vertices = limitedSquare
      newShapeGeo.computeBoundingBox()

      return newShapeGeo
    },
    createLimitedSquareForSliceIndex(sliceIndex) {
      if (!this.stackHelper.slice) {
        return
      }
      if (!this.stackConfig.limitedSquare) {
        this.stackConfig.limitedSquare = []
      }

      const selectionCorners = _.get(this.stackConfigSlices, [sliceIndex, 'selectionCorners'], null)

      if (!selectionCorners) {
        return
      }

      const { originX, originY, originZ } = this.stackConfigSlices[sliceIndex]
      const planePosition = new THREE.Vector3(originX, originY, originZ)

      const oldPlanePosition = new THREE.Vector3(
        this.stackHelper.slice.planePosition.x,
        this.stackHelper.slice.planePosition.y,
        this.stackHelper.slice.planePosition.z
      )

      const assignSlicePlanePosition = (position) => {
        this.stackHelper.slice.planePosition.x = position.x
        this.stackHelper.slice.planePosition.y = position.y
        this.stackHelper.slice.planePosition.z = position.z
      }

      // Move slice to position of slice need to be limited
      assignSlicePlanePosition(planePosition)

      this.stackHelper.slice._update()

      // Caching the trimming / limitedSquare (cached per slice)
      if (!this.stackConfig.limitedSquare[sliceIndex]) {
        // create a normalized THREE.Plane the matches the slice
        let plane = new THREE.Plane()
          .setFromNormalAndCoplanarPoint(this.stackHelper.slice._planeDirection, planePosition)
          .normalize()

        // get slice bounds from current (uncut) bg slice (what we have HD data for)
        // this has like 4-6+ points. not always just a rectangle, because if you take a slice through (and beyond the volume of) the cuboid we have data for near the edges of it, you may not get a rectangle
        // Needs to be projected to bgPlane so that 3D line intersections can hit each other
        let slicePoints = _.map(this.stackHelper.slice.geometry.vertices, (vert) => {
          return plane.projectPoint(vert, new THREE.Vector3())
        })
        slicePoints = AMI.UtilsCore.orderIntersections(slicePoints, plane.normal)
        // console.log('slicePoints', slicePoints, this.stackHelper.slice.geometry.vertices)

        // get corners of the current selection (what the user wanted)
        // Projection here has to happen because corner data is per stack; could likely do without if kept per slice
        let selectionPoints = _.map(selectionCorners, (vert) => {
          return plane.projectPoint(vert, new THREE.Vector3())
        })
        selectionPoints = AMI.UtilsCore.orderIntersections(selectionPoints, plane.normal)
        // console.log('selectionPoints', selectionPoints)

        // These are the points that will make up the final polygon that we are cutting out / outside of which we just want to show black
        let outputShapePoints = []

        // Find intersections
        // For each slicePoints' edge, check against each selectionPoints's edge
        _.each(slicePoints, function (slicePointA, slicePointAIndex) {
          let slicePointBIndex = (slicePointAIndex + 1) % slicePoints.length
          let slicePointB = slicePoints[slicePointBIndex]

          _.each(selectionPoints, function (selectionPointA, selectionPointAIndex) {
            let selectionPointBIndex = (selectionPointAIndex + 1) % selectionPoints.length
            let selectionPointB = selectionPoints[selectionPointBIndex]

            // If they do intersect, remember this point
            let intersectionPoint3D = intersectLineSegments3D(
              slicePointA,
              slicePointB,
              selectionPointA,
              selectionPointB
            )
            if (intersectionPoint3D) {
              outputShapePoints.push(intersectionPoint3D)
              // console.log('! Intersection point!', intersectionPoint3D)
            }
          })
        })

        // Find all the points of both the Slice and Selection that are not intersections, but that are within the other's polygon/points, and are therefore necessary to cut out the final shape
        // Translate 3D points into 2D on the plane (they are already on the plane in 3D space), using our existing xAxis and yAxis this bgSlice (they are arbitrary, but already line up with planeNormal(===zAxis))
        // pointZero3 is where 2D 0,0 will be on our plane - it doesn't matter where, but it must be somewhere
        let pointZero3 = _.first(slicePoints)
        if (pointZero3) {
          let xAxis3 = new THREE.Vector3(this.xDirectionX, this.xDirectionY, this.xDirectionZ)
          let yAxis3 = new THREE.Vector3(this.yDirectionX, this.yDirectionY, this.yDirectionZ)
          let slicePoints2D = convertPointsTo2D(pointZero3, xAxis3, yAxis3, slicePoints)
          let selectionPoints2D = convertPointsTo2D(pointZero3, xAxis3, yAxis3, selectionPoints)

          // slicePoints: look for any that are inside the other polygon (selectionPoints)
          _.each(slicePoints2D, function (slicePointCur2D, i) {
            // -1 means it's inside, 0 means it's touching the polygon; see: https://github.com/mikolalysenko/robust-point-in-polygon#api
            if (isPointInPolygon(selectionPoints2D, slicePointCur2D) < 0) {
              let slicePointCur3D = slicePoints[i]
              // console.log('! Inside SlicePoint!', slicePointCur2D, slicePointCur3D)
              outputShapePoints.push(slicePointCur3D)
            }
          })

          // selectionPoints: look for any that are inside the other polygon (slicePoints)
          _.each(selectionPoints2D, function (selectionPointCur2D, i) {
            // -1 means it's inside, 0 means it's touching the polygon; see: https://github.com/mikolalysenko/robust-point-in-polygon#api
            if (isPointInPolygon(slicePoints2D, selectionPointCur2D) < 0) {
              let selectionPointCur3D = selectionPoints[i]
              outputShapePoints.push(selectionPointCur3D)
            }
          })
        }

        // Do we have enough points that we could cut out a polygon?
        if (outputShapePoints.length > 2) {
          this.stackConfig.limitedSquare[sliceIndex] = AMI.UtilsCore.orderIntersections(
            outputShapePoints, // errors if it's empty
            plane.normal
          )
        }
      }

      // Move slice to old position
      assignSlicePlanePosition(oldPlanePosition)
      this.stackHelper.slice._update()

      this.setWindowToSliceMesh()
    },
    setRenamingStackConfigLabel(config) {
      this.indexOfSelectedViewOrientation = this.stackConfigOptions.findIndex((data) => data.value === this.stackConfig)
      if (!this.editable) {
        return
      }
      // const index = this.stackConfigOptions.findIndex((data) => data.value === config)
      const key = `${config.renameIdent}`
      const label = this.dicomFileSet.localizerNames[key] || config.name
      this.renamingStackConfigLabel = {
        key,
        value: label,
        previousValue: label,
      }
    },
    async saveStackConfigLabel() {
      // only if user changed value
      if (this.editable && this.renamingStackConfigLabel.previousValue !== this.renamingStackConfigLabel.value) {
        try {
          let response = await apiPatch(
            `dicomFileSets/${this.dicomFileSet.id}`,
            {
              localizerNames: {
                [this.renamingStackConfigLabel.key]: this.renamingStackConfigLabel.value,
              },
            },
            this.accessToken
          )

          if (response.data && response.data.success) {
            this.$notify({ type: 'success', text: 'Stack Config Label Saved' })
            this.renamingStackConfigLabel.previousValue = this.renamingStackConfigLabel.value
            this.$store.dispatch(
              'dicomService/loadDicomGroup',
              { dicomFileSetId: this.dicomFileSet.id },
              { root: true }
            )
          } else {
            this.$notify({ type: 'error', text: 'Error saving label' })
          }
        } catch (e) {
          log.debug(e)
          this.$notify({ type: 'error', text: 'Failed to save stack config label' })
        }
      }
    },
    toggleSlider() {
      this.testToggles.forEach((toggle) => {
        const { toggleName, visible } = toggle[0]
        this.$store.dispatch('selectionConfig/setSelectionConfig', {
          ident: toggleName,
          skipSyncingOtherGroups: true,
          selectionConfig: { visible: !visible },
        })
      })
    },
    emitSelectedViewOrientation() {
      this.selectedReferenceLineId = this.referenceLineId
      this.indexOfSelectedViewOrientation = this.stackConfigOptions.findIndex((data) => data.value === this.stackConfig)
    },
  },
}
</script>

<style scoped lang="scss">
.main-forscanning {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 98%;
}

.box-holder {
  min-width: 33.2% !important;

  &.fullscreen {
    .box-container {
      .inner-box-container {
        width: 100vw;
        height: calc(100vh - 150px);

        .orientation {
          &.label-right {
            left: calc(100% - 0.8rem - 20px); // take vertical scrollbar into account
          }
        }
      }
    }
  }

  .box-forscanning {
    height: 81% !important;
    overflow: hidden;
  }

  .box-container {
    height: 83%;
    width: 100%;

    .inner-box-container {
      height: 100%;
      width: 100%;
      position: relative;

      .orientation {
        position: absolute;
        z-index: 1;
        color: white;
        text-shadow: 1px 1px $black;
        opacity: 0.9;
        font-size: 0.8rem;
        pointer-events: none;
        user-select: none; // pointer-events should be good enough, but these two will help if it's not supported
        cursor: default;

        &.label-left {
          top: 50%;
          left: 0.2rem;
        }

        &.label-top {
          left: 50%;
        }

        &.label-right {
          top: 50%;
          left: calc(100% - 0.8rem);
        }

        &.label-bottom {
          top: calc(100% - 1rem);
          left: 50%;
        }
      }

      .box {
        position: absolute;
        background: gainsboro;
        height: 100%;
        width: 100%;
        display: flex;
        justify-content: center;
        overflow: hidden;
      }
    }
  }

  .box-controls {
    font-size: 28px;
    color: #2c3e50;
    background: black;
    padding: 0px 10px;
    box-shadow: 0px 0px 10px rgba(11, 49, 51, 0.25);
  }
}

.slice-slicer {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 48px;

  input[type='range'] {
    width: 80%;
    padding: 5px 10px;
  }
}
.xa-class {
  width: 100%;
  cursor: pointer;
  user-select: none;
  outline: none;
  background-color: $white;
  ::v-deep .v-input__control {
    height: 25px !important;
    font-size: 12px !important;
  }
  ::v-deep .v-select__slot {
    height: 20px !important;
  }

  .v-text-field--outlined.v-input--is-focused fieldset {
    height: 29px !important;
  }
  ::v-deep .v-input__append-inner {
    margin-top: 0px !important;
  }
  .box-controls {
    display: none !important;
  }
}
.xa-box {
  .box {
    background: black;
  }
}
.stack-config {
  width: 100%;
  cursor: pointer;
  user-select: none;
  outline: none;
  background-color: black;
}

.right-center-control {
  position: absolute;
  z-index: 1;
  right: 2em;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.in-box-control {
  font-size: 30px;
  color: white;
  position: absolute;
  z-index: 1;
  color: white;
  text-shadow: 1px 1px $black;
  opacity: 0.9;
  user-select: none;
  cursor: pointer;

  &.left-center {
    top: 50%;
    left: 1rem;
  }

  &.right-center {
    top: 50%;
    right: 2rem;
  }

  &.bottom-right {
    bottom: 0.5rem;
    left: calc(100% - 2rem);

    &.fullscreen {
      left: calc(100% - 3rem);
    }
  }

  &.bottom-left {
    bottom: 0.5rem;
    left: 0.25rem;
  }

  &.above-bottom-left {
    bottom: calc(0.5rem + 30px);
    left: 0.3rem;

    p {
      color: #fff;
      font-size: 1rem;
      margin-bottom: 0;
      text-align: left;
    }
  }

  &.auto-windowing {
    font-size: 25px;
  }

  &.top-right {
    top: 0.5rem;
    left: calc(100% - 2rem);

    &.fullscreen {
      left: calc(100% - 3rem);
    }
  }

  &.top-left {
    top: 0.5rem;
    right: calc(100% - 2rem);

    &.fullscreen {
      right: calc(100% - 3rem);
    }
  }

  &.top-left-lower {
    top: 3rem;
    left: -0.5rem;
    min-width: 100px;
    margin-left: 1%;
    padding-left: 0px;
    font-size: 1.3rem !important;
    right: calc(100% - 2rem);

    &.fullscreen {
      right: calc(100% - 3rem);
    }
  }
}

.pl0 {
  padding-left: 0;
}

.pr0 {
  padding-right: 0;
}

.py0 {
  padding-top: 0px;
  padding-bottom: 0px;
}

.py1 {
  padding-top: 2px;
  padding-bottom: 2px;
}

.pb0 {
  padding-bottom: 0;
}

.m0 {
  margin: 0;
}

.dot-size-slider {
  margin-top: 20px;
  margin-left: 15px;
}

.scanlab-toggle {
  cursor: pointer;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: $gray-four;
  border-radius: 5px;
  padding: 1px;
  max-width: 100px;

  .on,
  .off {
    user-select: none;
    width: 100px;
    border-radius: 5px;
    padding: 3px;
    margin: 1px;
    font-weight: bold;

    &.active {
      color: $white;
      background-color: $button-blue;
    }
  }
}

::v-deep .v-select__selections {
  color: white !important;
}

::v-deep .v-select__selection {
  height: 20px !important;
}
</style>
