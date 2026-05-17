<template>
  <div class="mr-1 ml-1 box-holder" :class="amFullscreen ? 'fullscreen' : ''" oncontextmenu="return false;">
    <v-select
      outlined
      dense
      hide-details
      class="rounded-0 stack-config"
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
        <v-slider
          class="dot-size-slider"
          v-model.number="dotScaleMultiplierIndex"
          :min="0"
          :max="dotScaleValues.length - 1"
          ticks
        >
        </v-slider>
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

    <div class="box-container">
      <div class="fullscreen-only-toolbar" v-if="amFullscreen">
        <v-row cols="12" align="center" justify="space-between" class="m-1 d-flex">
          <v-col col="6">
            <SliceViewToolbar :disabled-tools="disabledTools" />
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
          <v-col cols="2" v-if="isShowPointSelectPathologyButton">
            <v-btn
              v-if="
                currentCriticalThinkingQuestion &&
                currentCriticalThinkingQuestion.type === 'PS' &&
                shouldShowNoPathologyButton
              "
              class="wide-button no-transform"
              @click="onNoAnswerPointSelectQuestion"
            >
              {{ $t('CriticalThinkingPrompt.no_pathology', languageCode) }}
              <v-checkbox v-model="currentNopathologyValue"></v-checkbox>
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
            <template v-if="isShowPointSelectPathologyButton">
              <v-btn
                tile
                class="ml-2 no-transform wide-button bold"
                color="buttonBlue text-white"
                :disabled="isSubmitPointSelectDisabled"
                @click="onConfirmPointSelectQuestion"
              >
                {{ $t('global.confirm', languageCode) }}
              </v-btn>
            </template>
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
        <p class="top-left-lower orientation in-box-control">{{ indexSliceSlider }} / {{ stackConfigSlicesAmount }}</p>
        <template v-if="(allowSelection && showPointSelect && isCTLab) || (isCTLab && isShowCriticalQuestionResult)">
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
          v-if="!amFullscreen"
        />
        <close-icon
          class="bottom-right clickable in-box-control fullscreen"
          @click="toggleFullscreen()"
          :title="$t('global.close')"
          v-else
        />
        <div class="in-box-control above-bottom-left">
          <div>
            <p>{{ `W: ${windowWidth != false ? Math.round(windowWidth) : 0}` }}</p>
            <p>{{ `C: ${windowCenter != false ? Math.round(windowCenter) : 0}` }}</p>
          </div>
        </div>
        <brightness-auto class="bottom-left auto-windowing clickable in-box-control" @click="resetWindowing()" />
        <ContentCopyIcon
          class="top-right auto-windowing clickable in-box-control"
          @click="setSelectionToSliceMidpointOfLocalizerBoxAndScanBox(false)"
          :title="$t('tools.copy_slice_position')"
        />
        <AxisXArrowIcon
          class="top-left auto-windowing clickable in-box-control"
          @click="setSelectionToSliceMidpointOfLocalizerBoxAndScanBox(true)"
          :title="$t('tools.copy_slice_position_perpendicular')"
        />
      </div>
    </div>
    <div class="box-controls">
      <v-row justify="space-around" v-if="!amFullscreen">
        <v-col class="text-center pr0" cols="2">
          <!-- eslint-disable-next-line -->
          <span>1</span>
        </v-col>
        <v-col cols="8" class="align-self-center">
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
        <v-col class="text-center pl0" cols="2">
          <span>{{ stackConfigSlicesAmount }}</span>
        </v-col>
      </v-row>

      <div v-if="!amFullscreen">
        <b-btn v-if="allowDebug" @click="showDebug = !showDebug" class="m-1" size="sm">{{ $t('global.debug') }}</b-btn>

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
} from '@/lib/math-util'
import { apiPatch } from '@/util/api'
import _ from 'lodash'
import { Box3, Vector2, Vector3 } from 'three'
import { createLineGeometry } from '@/lib/misc-util'
import config from '@/config'
import {
  EXTRA_SCAN_BASE_NAME,
  MRI_MODEL_DIMENSIONS,
  SCAN_STATUS,
  POINT_SELECT_MODES,
  LOCALIZER_BOX_IDENT,
  SCAN_BOX_IDENT,
} from '../constants'
import { greatestAxisAbsXYZ } from '../lib/math-util'

const StackHelper = AMI.stackHelperFactory(THREE)

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
  name: 'DicomBoxSliceView',
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
      movePointSelectCenterIcon: null,
      userSelectedPointMesh: null,
      interactableInstances: null,
      shouldUpdateMRShaderMaterial: false,
      // Only used for full screen
      isInCriticalThinkingQuestionForFullScreen: false,
      isPreviewCriticalThinkingQuestionForFullScreen: false,

      lastSetUpCameraStackConfigName: '',
      lastCameraOriginPosition: new Vector3(),
    }
  },
  computed: {
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
    ...mapGetters('stackService', [
      'stackConfigsByOrientation',
      'stackConfigOfFirstLocalizer',
      'stackConfigOfFirstNonLocalizer',
    ]),
    ...mapGetters('user', ['windowingDirection', 'languageCode']),
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
    ]),
    ...mapState('selectionConfig', [
      'selectionConfigsByIdent',
      'isFullscreen',
      'isAddLocalizerMode',
      'toolSelected',
      'toolSelectedConfig',
      'showReferenceLines',
      'referenceSliceCornersBySliceViewId',
      'hasAddedLocalizer',
      'showOutline',
    ]),
    ...mapGetters('selectionConfig', ['dotScaleValues', 'isHotkeysEnabledCT', 'selectionConfigsCurrentGroupId']),
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
      const allowedConfigs = this.showDebug ? this.stackConfigs : _.filter(this.stackConfigs, (c) => !c.hidden)
      let options = _.map(allowedConfigs, (config) => {
        const localizerNames = _.get(this.dicomFileSet, 'localizerNames', {})
        const label = localizerNames[`${config.renameIdent}`]
        return {
          value: config,
          text: label || config.name,
        }
      })
      return options
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
      if (this.isAcquisitionQuestion) {
        return ['rotate', 'oversampling']
      }
      if (this.isReconstructionQuestion) {
        return ['oversampling']
      }
      if (this.isCTLab) {
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
  },
  watch: {
    selectedStackName: 'selectedStackNameChanged',
    stackConfig: 'onStackConfigChanged',
    // changing the stackQuestion also changes the Selection these days due to the initialSelection getting applied at that this
    // This introduces a slight bug in that the selected Slice Index of the StackConfig gets set back to the first when changing questions; but it's minor compared to huge bug this fixes that's important for the demo in the morning
    stackQuestion: 'onStackHelperChanged',
    answerCurrent: 'onStackHelperChanged',
    zoom: 'onZoomChanged',
    isPlayingTheSlices: 'handleScanningChanged',
    isPlaySlice: 'handleScanningChanged',
    windowCenter: 'onSliceViewWindowChange',
    windowWidth: 'onSliceViewWindowChange',
    selectedStackQuestionIndex: function () {
      this.showStackByViewOrientation()
    },
    isShowCriticalQuestionResult: function () {
      this.resetWindowWhenShowCriticalThinkingResult()
    },
  },
  async mounted() {
    await this.$store.dispatch('threeJSSVGProvider/init')

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

    this.onWindowResize = _.debounce(() => {
      this.onSetSizeOfRenderer()
      this.resetCameraPan()
      this.geometryMustUpdate = true
    }, 50)

    window.addEventListener('resize', this.onWindowResize)
    // Disabled change windowLevel follow hot key
    // window.addEventListener('keypress', this.onKeyPress)

    this.updateGeometries() // this sets the planeDirection right for the stackVolumeSelection

    this.stackVolumeSelections = []
    this.interactableInstances = []
    this.sliceViewId = uuidv4()

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

    if (!this.isCTLab) {
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
    EventBus.$on('onDeleteAllCurrentPointSelect', this.onDeleteAllCurrentPointSelect)
    EventBus.$on('onMoveToMiddleSlice', this.onMoveToMiddleSlice)

    this.requestAnimationId = requestAnimationFrame(() => {
      this.onFrame()
    })

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
    EventBus.$off('onDeleteAllCurrentPointSelect', this.onDeleteAllCurrentPointSelect)
    EventBus.$off('onMoveToMiddleSlice', this.onMoveToMiddleSlice)

    const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
    cancelAnimationFrame(this.requestAnimationId)

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
      'adjustPointOfPolygon',
      'adjustPositionOfPointSelect',
      'addPreviewChosenSelection',
      'resetPreviewChosenSelection',
    ]),
    ...mapMutations('satBandService', [
      'setTmpSatBandSelectedPolygonPoints',
      'setSelectedSatBandViewOrientation',
      'setCurrentSatBandSelection',
      'setSelectedSatBandStackConfigName',
      'adjustPointOfSatBandPolygon',
      'adjustPositionOfSatBand',
      'removeSatBandSelection',
      'removeAllSatBandSelection',
    ]),
    ...mapActions('selectionConfig', [
      'resetSelection',
      'smartRotateSelectionConfigDir',
      'assignValueToSelectionConfigs',
      'setSelectionConfigCurrentIdent',
    ]),
    ...mapActions('stackService', [
      'setMriModelBbox',
      'setConfigNameOfFirstSliceView',
      'setSliceIndexOfFirstSliceView',
    ]),
    onSetSizeOfRenderer() {
      if (this.renderer) {
        this.renderer.setSize(this.elBox.offsetWidth, this.elBox.offsetHeight)
      }
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
    onSetWindow(windowType) {
      const windowInfo = this.windowLevelWidths.find((el) => el.value == windowType)
      if (windowInfo) {
        this.windowWidth = windowInfo.windowWidth
        this.windowCenter = windowInfo.windowLevel

        this.geometryMustUpdate = true
      }
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
    activateThisSliceView() {
      if (!this.amFullscreen && this.camera) {
        this.$store.dispatch('selectionConfig/setReferenceSliceCornersForSliceViewId', {
          sliceViewId: this.referenceLineId,
          bgSliceCorners: getBackgroundSliceCorners(this),
        })
      }
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
        this.isCTLab &&
        this.stackWorldBoundingBoxDimensions &&
        this.stackConfig?.isLocalizer &&
        !this.stackConfig?.name.includes('Added Localizer')
      ) {
        let { x, y, z } = this.stackWorldBoundingBoxDimensions
        const aspect = this.elBox.offsetWidth / this.elBox.offsetHeight
        if (this.cameraDirAxisName === 'x') {
          this.zoom = Math.min(y / z, z / y) / aspect
        } else if (this.cameraDirAxisName === 'y') {
          this.zoom = Math.min(x / z, z / x) / aspect
        } else if (this.cameraDirAxisName === 'z') {
          this.zoom = Math.min(x / y, y / x) / aspect
        }
      }
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

      this.mousePositionSlice3Prev.copy(this.mousePositionSlice3Init)

      this.pointerMovedSinceLastDown = false

      log.debug('touchDown', event)
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
    onDeleteAllCurrentPointSelect() {
      if (!this.amFullscreen) {
        this.removeAllSelection(this.indexSlice)
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
        center3.add(movement3) // Maybe this should be a call to the selectionConfig store
        if (selectedInteractableState) {
          this.$store.dispatch('interactableService/update', {})
        }
        this.$store.dispatch('selectionConfig/afterSelectionUserModified', {})
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
        // if (
        //   this.selectedStackVolumeSelection &&
        //   this.selectedStackVolumeSelection.isOutlineVisible() &&
        //   !this.selectedStackVolumeSelection.isShowSingleSliceWhenPlaneClosestIsZ()
        // ) {
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

        // signed angle between start drag and current drag position
        let angle = getSignedAngleBetween(before, now, rotationPlaneNormal)

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

          // update every instance of this
          if (selectedInteractableState) {
            this.$store.dispatch('interactableService/update', {})
          }
          // update every instance of this
          this.$store.dispatch('selectionConfig/afterSelectionUserModified', {})
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

        this.$store.dispatch('selectionConfig/adjustOversamplingByUser', { oversampling })
      } else if (selectedObject && this.toolSelected === 'resize' && this.mouseButtonsDown.left) {
        let movement3 = this.getMouseSliceMovement3()
        const cameraUpDir = greatestAxisAbsXYZ(this.camera.up.x, this.camera.up.y, this.camera.up.z)
        const movementDir = greatestAxisAbsXYZ(movement3.x, movement3.y, movement3.z)
        const isMovementParallelToCameraUp = cameraUpDir === movementDir
        if (this.isCTLab && !isMovementParallelToCameraUp) {
          movement3 = movement3.multiplyScalar(0.5)
        }
        let haftOfMovement3 = new Vector3()
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

              this.$store.dispatch('interactableService/update', {})
              this.$store.dispatch('selectionConfig/afterSelectionUserModified', {})
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
        if (this.isCTLab && selectionConfigCurrent && !isMovementParallelToCameraUp) {
          let { center3 } = selectionConfigCurrent
          center3.add(haftOfMovement3) // Maybe this should be a call to the selectionConfig store
          this.$store.dispatch('selectionConfig/afterSelectionUserModified', {})
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
        const minClamp = Math.max(0.0001, this.stackHelper.stack.minMax[0])
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
          windowWidth = clamp(windowWidth, minWindowLevelClamp, maxClamp)
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
          windowCenter = clamp(windowCenter, minClamp, maxClamp)
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
      for (const [key] of Object.entries(this.satBandMeshes)) {
        if (
          _.get(this.satBandSelections, [key, 'indexSlice']) == this.indexSlice &&
          _.get(this.satBandSelections, [key, 'stackName']) == this.stackConfig?.name
        ) {
          this.satBandMeshes[key].visible = this.visibleSatBand
        }
      }
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
    setSelectionToSliceMidpointOfLocalizerBoxAndScanBox(isPerpendicular) {
      this.setSelectionConfigCurrentIdent({
        ident: `${this.selectionConfigsCurrentGroupId}_${LOCALIZER_BOX_IDENT}`,
      })
      this.$store.dispatch('selectionConfig/setSelectionToSliceMidpoint', [
        getMidpointFromStackHelperSlice(this.stackHelper.slice),
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: -1 },
        { x: 0, y: 0, z: 1 },
        isPerpendicular,
      ])
      this.setSelectionConfigCurrentIdent({
        ident: `${this.selectionConfigsCurrentGroupId}_${SCAN_BOX_IDENT}`,
      })
      this.$store.dispatch('selectionConfig/setSelectionToSliceMidpoint', [
        getMidpointFromStackHelperSlice(this.stackHelper.slice),
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: -1 },
        { x: 0, y: 0, z: 1 },
        isPerpendicular,
      ])
    },
    updateGeometriesNextFrame() {
      this.geometryMustUpdate = true
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

      this.stackHelper.slice._update()
      if (!this.stackHelper.slice.mesh) {
        console.warn('Invalid Slice', this.stackHelper.slice)
        return
      }

      if (this.windowWidth) {
        this.stackHelper.slice.windowWidth = this.windowWidth
      }
      if (this.windowCenter) {
        this.stackHelper.slice.windowCenter = this.windowCenter
      }

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
        } else {
          const box3 = new Box3().setFromObject(this.stackHelper.slice.mesh)
          meshCenter = box3.getCenter(new Vector3())
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

        // Guard: dicomFileSet can be null while data is loading
        const flipAxial = _.get(this, ['dicomFileSet', 'flipAxial'], false)
        if (flipAxial) {
          this.camera.up.set(0, 1, 0)
        } else {
          this.camera.up.set(0, -1, 0)
        }
      }

      let displacementVector = this.isCameraReversed
        ? dirLPS.clone().multiplyScalar(300).negate()
        : dirLPS.clone().multiplyScalar(300)

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
        // This is to cache the limiting
        if (!this.stackConfig.limitedSquare) {
          this.stackConfig.limitedSquare = []
        }

        // Caching the trimming / limitedSquare (cached per slice)
        if (!this.stackConfig.limitedSquare[this.indexSlice]) {
          // create a normalized THREE.Plane the matches the slice
          let plane = new THREE.Plane()
            .setFromNormalAndCoplanarPoint(
              this.stackHelper.slice._planeDirection,
              this.stackHelper.slice._planePosition
            )
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
          let selectionPoints = _.map(this.selectionCorners, (vert) => {
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
            this.stackConfig.limitedSquare[this.indexSlice] = AMI.UtilsCore.orderIntersections(
              outputShapePoints, // errors if it's empty
              plane.normal
            )
          }
        }

        let limitedSquare = this.stackConfig.limitedSquare[this.indexSlice]
        if (_.size(limitedSquare) > 2) {
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
          this.stackHelper.slice.mesh.geometry.dispose()
          this.stackHelper.slice.mesh.geometry = newShapeGeo
          this.stackHelper.slice._geometry = newShapeGeo
          this.stackHelper.slice.geometry = newShapeGeo
        }
      }

      this.camera.lookAt(meshCenter)
      this.camera.updateProjectionMatrix()
      this.camera.updateMatrixWorld()
    },
    setRenamingStackConfigLabel(config) {
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
  },
}
</script>

<style scoped lang="scss">
.box-holder {
  &.fullscreen {
    .box-container {
      .inner-box-container {
        width: 100vw;
        height: calc(100vh - 175px);

        .orientation {
          &.label-right {
            left: calc(100% - 0.8rem - 20px); // take vertical scrollbar into account
          }
        }
      }
    }
  }

  .box-container {
    height: 40vh;
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
      }
    }
  }

  .box-controls {
    font-size: 30px;
    background: $white;
    padding: 5px 10px;
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

.stack-config {
  width: 100%;
  cursor: pointer;
  user-select: none;
  outline: none;
  background-color: $white;
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
::v-deep .theme--light.v-select .v-select__selections {
  color: black !important;
}
</style>
