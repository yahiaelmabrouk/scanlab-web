// A box in space, made up of 8 points
// each point
import log from 'loglevel'
import * as THREE from 'three'
import _ from 'lodash'
import DragControls from './drag-controls'
import { createLineGeometry } from './misc-util'
import { setIntersectionLineFromPlaneAndFourCorners, getClosestSignedAxis3 } from './math-util'
import { identToIdentType, identToGroupId } from '@/lib/selection-config-util'

import CursorMoveIconPng from '@/assets/cursors/cursor-move.png'
import Rotate3DVariantIconPng from '@/assets/cursors/rotate-3d-variant.png'
import ArrowExpandAllIconPng from '@/assets/cursors/arrow-expand-all.png'
import ArrowExpandHorizontalIconPng from '@/assets/cursors/arrow-expand-horizontal.png'
import config from '../config'
import { SCAN_STATUS } from '@/constants'
import { intersect } from 'mathjs'
import { LOCALIZER_BOX_IDENT, SCAN_BOX_IDENT } from '../constants'
import EventBus from './event-bus'

// be able to configure
// slices
// thickness
// gap between

// How to adjust cuboid / selection
// center square - moves the whole thing
// corners - rotate
// sides to resize

let tmpVec3 = new THREE.Vector3()
// Separate scratch vector from tmpVec3: aimEncodingArrow's minBy callback
// stomps tmpVec3 via subVectors, so we can't pass a tmpVec3-backed value in
// as outwardAxis — it would be clobbered mid-iteration.
let tmpVec3B = new THREE.Vector3()

// Colors for the on-box encoding-direction arrows. Non-GE draws a yellow
// phase arrow along +xDirection3; GE draws a blue frequency arrow along
// -yDirection3. The arrows are display only — cruncher reads
// phaseEncodingAxis from the store (see src/store/stackService.js and
// src/store/dicomService.js).
const PHASE_ARROW_COLOR = 0xffff00
const FREQUENCY_ARROW_COLOR = 0x0000ff

// Cuboid coordianates like -1,0,1 for x/y/z for corners/center/etc
function setPositionFromCoordinates(
  position,
  x,
  y,
  z,
  dimensions3Half,
  bDisplaced,
  { centerDisplaced3, center3, xDirection3, yDirection3, zDirection3 }
) {
  if (bDisplaced) {
    position.copy(centerDisplaced3)
  } else {
    position.copy(center3)
  }
  if (x !== 0) {
    // avoiding clone() to avoid garbage collection
    // position.add(xDirection3.clone().multiplyScalar(x * dimensions3Half.x))
    position.x += xDirection3.x * x * dimensions3Half.x
    position.y += xDirection3.y * x * dimensions3Half.x
    position.z += xDirection3.z * x * dimensions3Half.x
  }
  if (y !== 0) {
    // position.add(yDirection3.clone().multiplyScalar(y * dimensions3Half.y))
    position.x += yDirection3.x * y * dimensions3Half.y
    position.y += yDirection3.y * y * dimensions3Half.y
    position.z += yDirection3.z * y * dimensions3Half.y
  }
  if (z !== 0) {
    // position.add(zDirection3.clone().multiplyScalar(z * dimensions3Half.z))
    position.x += zDirection3.x * z * dimensions3Half.z
    position.y += zDirection3.y * z * dimensions3Half.z
    position.z += zDirection3.z * z * dimensions3Half.z
  }
  return position
}

function updateGlowCylinderFromLine(cylinderMesh, lineMesh, radius = 1.5, ratio = 0.35, dirBias = -1) {
  cylinderMesh.visible = true
  let pointA = lineMesh.geometry.vertices[0]
  let pointB = lineMesh.geometry.vertices[1]
  let length = pointA.distanceTo(pointB) * ratio
  // Create a matrix to transform a cylinder to follow the path of the given line
  let orientation = new THREE.Matrix4()
  orientation.lookAt(pointA, pointB, new THREE.Object3D().up)

  orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1))

  // Geometry doesn't need to be updated if the length hasn't changed
  if (Math.floor(length * 100) !== Math.floor(cylinderMesh.geometry.parameters.height * 100)) {
    cylinderMesh.geometry.dispose()
    cylinderMesh.geometry = new THREE.CylinderBufferGeometry(radius, radius, length, 4, 1)
  }

  // Reset the mesh so the transformations don't pile on eachother
  cylinderMesh.rotation.set(0, 0, 0)
  cylinderMesh.position.set(0, 0, 0)
  cylinderMesh.updateMatrix()

  cylinderMesh.applyMatrix4(orientation)

  const dir = pointB.clone().sub(pointA).normalize()
  if (dirBias === -1) {
    cylinderMesh.position.copy(pointA).add(dir.clone().multiplyScalar(length / 2))
  } else {
    cylinderMesh.position.copy(pointB).sub(dir.clone().multiplyScalar(length / 2))
  }

  cylinderMesh.geometry.verticesNeedUpdate = true
  cylinderMesh.__data = {
    type: 'glow',
  }
  return cylinderMesh
}

function updateGlowCenterCylinderFromLine(cylinderMesh, lineMesh, radius = 1.5, ratio = 0.3) {
  cylinderMesh.visible = true
  let pointA = lineMesh.geometry.vertices[0]
  let pointB = lineMesh.geometry.vertices[1]
  let length = pointA.distanceTo(pointB) * ratio
  // Create a matrix to transform a cylinder to follow the path of the given line
  let orientation = new THREE.Matrix4()
  orientation.lookAt(pointA, pointB, new THREE.Object3D().up)

  orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1))

  // Geometry doesn't need to be updated if the length hasn't changed
  if (Math.floor(length * 100) !== Math.floor(cylinderMesh.geometry.parameters.height * 100)) {
    cylinderMesh.geometry.dispose()
    cylinderMesh.geometry = new THREE.CylinderBufferGeometry(radius, radius, length, 4, 1)
  }

  // Reset the mesh so the transformations don't pile on eachother
  cylinderMesh.rotation.set(0, 0, 0)
  cylinderMesh.position.set(0, 0, 0)
  cylinderMesh.updateMatrix()

  cylinderMesh.applyMatrix4(orientation)

  // position based on midpoints - there may be a better solution than this
  cylinderMesh.position.x = (pointB.x + pointA.x) / 2
  cylinderMesh.position.y = (pointB.y + pointA.y) / 2
  cylinderMesh.position.z = (pointB.z + pointA.z) / 2

  cylinderMesh.geometry.verticesNeedUpdate = true
  cylinderMesh.__data = {
    type: 'glowCenter',
    length: length,
  }
  return cylinderMesh
}

function createGlowCylinder() {
  let edgeGeometry = new THREE.CylinderBufferGeometry()
  let material = new THREE.MeshLambertMaterial({
    color: 0x00b000,
    opacity: 0.4,
    transparent: true,
    emissive: 0x00b000,
  })
  let edge = new THREE.Mesh(edgeGeometry, material)
  return edge
}

function setLinePositions(line, posA, posB) {
  line.geometry.vertices[0].copy(posA)
  line.geometry.vertices[1].copy(posB)
  // displace towards camera (so it's not behind bg slice)
  line.geometry.verticesNeedUpdate = true
}

const materialOversampling = new THREE.LineBasicMaterial({ color: 0xffa500 })
const materialOutline = new THREE.LineBasicMaterial({ color: 0xffff00 })
const materialDashedLine = new THREE.LineDashedMaterial({
  color: 0xffff00,
  linewidth: 0.7,
  scale: 1,
  dashSize: 6,
  gapSize: 4,
})
const materialOutlineTest = new THREE.LineBasicMaterial({ color: 0xffffff })

const materialOutlineByIdent = {
  min: new THREE.LineBasicMaterial({ color: 0xf35588, linewidth: 3 }),
  max: new THREE.LineBasicMaterial({ color: 0x3581c7, linewidth: 3 }),
  scan: new THREE.LineBasicMaterial({ color: 0x18cfec, linewidth: 3 }),
  default: new THREE.LineBasicMaterial({ color: 0xe9ee0d, linewidth: 3 }),
  localizer: new THREE.LineBasicMaterial({ color: 0x00b000, linewidth: 3 }),
}

// let materialLineSlice = new THREE.LineDashedMaterial({color: 0x33ff00, linewidth: 1, scale: 1, dashSize: 6, gapSize: 1})
let materialLineSliceByIdent = {
  min: new THREE.LineBasicMaterial({ color: 0xffbbb4, linewidth: 3 }),
  max: new THREE.LineBasicMaterial({ color: 0x18cfec, linewidth: 3 }),
  scan: new THREE.LineBasicMaterial({ color: 0x18cfec, linewidth: 3 }),
  default: new THREE.LineBasicMaterial({ color: 0x00b000, linewidth: 3 }),
  localizer: new THREE.LineBasicMaterial({ color: 0x00b000, linewidth: 3 }),
}

// For "Master Angle", the center slice line (or two center slices lines if even total amount)
let materialLineSliceMasterByIdent = {
  min: new THREE.LineBasicMaterial({ color: 0xffffff }), // 0xffbbb4
  max: new THREE.LineBasicMaterial({ color: 0xffffff }), // 0x75dff0
  scan: new THREE.LineBasicMaterial({ color: 0x18cfec }),
  default: new THREE.LineBasicMaterial({ color: 0x84ff84 }), // 0x92ff77
  localizer: new THREE.LineBasicMaterial({ color: 0x00b000 }),
}

const DISPLACEMENT_AMOUNT = 300

// TMP variables
// 4 points
let tmpCornerPoints = _.map(_.range(4), function () {
  return new THREE.Vector3()
})
let tmpBackgroundSlicePlane = new THREE.Plane()
// let tmpCalcPlane = new THREE.Plane()
let tmpDisplacementVector = new THREE.Vector3()
let tmpDisplacementDashedLineVector = new THREE.Vector3()
let tmpDim3HalfForLocalizerMode = new THREE.Vector3()
// let tmpLine = new THREE.Line3()
// let tmpIntersectionPoint = new THREE.Vector3()
//let previousTool = ''

// A normal vector3 of X
const VECTOR3_NORMAL_X = new THREE.Vector3(1, 0, 0)

// How close can certain dots be others before they are hidden (mostly for center side dots hiding to show corners better)
const MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT = 10

// There is one instance of this per SliceView
class StackVolumeSelection {
  // Vector 3s
  constructor(
    ident,
    selectionConfig,
    center3,
    dimensions3,
    xDirection3,
    yDirection3,
    zDirection3,
    backgroundSlice,
    scene,
    camera,
    $store
  ) {
    log.debug('StackVolumeSelection init', center3, dimensions3)
    this.ident = ident
    this.isHoverDraggableDot = false
    // this.selectionConfig = selectionConfig
    this.center3 = center3
    this.dimensions3 = dimensions3 // 'width', 'height', and 'depth'
    this.xDirection3 = xDirection3
    this.yDirection3 = yDirection3
    this.zDirection3 = zDirection3
    this.scene = scene
    this.camera = camera
    this.$store = $store
    this.setBackgroundSlice(backgroundSlice)
    this.objectsAddedToScene = []
    this.dotIconObjects = [] // the ThreeJS Icons that are over dots to showcase what the dots do

    this.outlineVisible = false

    this.needsRender = true
    this.sideLine = new THREE.Line3()

    let geometryDot = this.dotGeometry()
    let materialDot = new THREE.MeshBasicMaterial({ color: 0xf9ff0d, depthFunc: THREE.AlwaysDepth }) // 0x0dee0d
    let materialDot2 = new THREE.MeshBasicMaterial({ color: 0xf9cc0d, depthFunc: THREE.AlwaysDepth }) // 0x0dee0d
    let materialDot3 = new THREE.MeshBasicMaterial({ color: 0xfe990c, depthFunc: THREE.AlwaysDepth }) // 0x0dee0d
    let materialDotOversampling = new THREE.MeshBasicMaterial({ color: 0xf9ff0d, depthFunc: THREE.AlwaysDepth }) // 0x0dee0d

    this.glowMeshes = []
    this.glowCenterMeshes = []
    this.draggableObjects = [] // flat list of just the objects
    this.controlCorners = []
    this.controlSides = []

    // Encoding-direction arrows. Non-GE draws phase (yellow, along
    // +xDirection3). GE draws frequency (blue, along -yDirection3). Each
    // indicator keeps its own permanent color; visibility decides which is
    // rendered. Physics sent to cruncher is derived from `swapPhase` alone
    // (see stackService.js / dicomService.js) and is independent of these.
    let indicatorGeometry = new THREE.ConeGeometry(3, 15, 32)
    let indicatorMaterial = new THREE.MeshBasicMaterial({ color: PHASE_ARROW_COLOR })
    this.phaseIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
    this.frequencyIndicator = new THREE.Mesh(
      indicatorGeometry.clone(),
      new THREE.MeshBasicMaterial({ color: FREQUENCY_ARROW_COLOR })
    )
    this.addObjectToScene(this.phaseIndicator)
    this.addObjectToScene(this.frequencyIndicator)

    this.sliceEncodingDirectionIndicator = new THREE.Mesh(indicatorGeometry.clone(), indicatorMaterial.clone())
    this.sliceEncodingDirectionIndicator.scale.set(1.5, 1.5, 1.5)
    this.addObjectToScene(this.sliceEncodingDirectionIndicator)

    const sphereGeo = new THREE.SphereGeometry(5, 32, 32)
    const scale = this.dotColorScale()
    this.rotationIndicator1 = new THREE.Mesh(sphereGeo, indicatorMaterial.clone())
    this.rotationIndicator1.scale.set(scale, scale, scale)
    this.rotationIndicator1.visible = false
    this.addObjectToScene(this.rotationIndicator1)

    this.rotationIndicator2 = new THREE.Mesh(sphereGeo, indicatorMaterial.clone())
    this.rotationIndicator2.scale.set(scale, scale, scale)
    this.rotationIndicator2.visible = false
    this.addObjectToScene(this.rotationIndicator2)

    this.rotationIndicator3 = new THREE.Mesh(sphereGeo, indicatorMaterial.clone())
    this.rotationIndicator3.scale.set(scale, scale, scale)
    this.rotationIndicator3.visible = false
    this.addObjectToScene(this.rotationIndicator3)

    // this.rotationIndicator3 = new THREE.Mesh(indicatorGeometry.clone(), indicatorMaterial.clone())
    // this.rotationIndicator3.scale.set(2, 2, 2)
    // this.rotationIndicator3.visible = false
    // this.addObjectToScene(this.rotationIndicator3)

    _.each(_.range(2), () => {
      let cylinderLine = createGlowCylinder()
      cylinderLine.__data = {
        type: 'glowCenter',
      }
      this.glowCenterMeshes.push(cylinderLine)
      this.draggableObjects.push(cylinderLine)
    })

    _.each(_.range(4), () => {
      let cylinderLine = createGlowCylinder()
      cylinderLine.__data = {
        type: 'glow',
      }
      this.glowMeshes.push(cylinderLine)
      this.draggableObjects.push(cylinderLine)
    })

    // Corners
    _.each(_.range(4), () => {
      let dot = new THREE.Mesh(geometryDot, materialDot)
      dot.__data = {
        // index: null, // {x, y, z}
        type: 'corner',
      }

      this.controlCorners.push(dot)
      this.draggableObjects.push(dot)
      this.addIconToDot('Rotate3DVariantIcon', dot)
    })

    // Sides
    _.each(_.range(4), () => {
      let dot = new THREE.Mesh(geometryDot, materialDot2)
      dot.__data = {
        // index: null, // {x, y, z}
        axis: new THREE.Vector3(),
        type: 'side',
      }

      this.controlSides.push(dot)
      this.draggableObjects.push(dot)
      this.addIconToDot('ArrowExpandAllIcon', dot)
    })

    // Center
    this.controlCenter = new THREE.Mesh(geometryDot, materialDot3)
    this.controlCenter.__data = {
      // index: null, // {x, y, z}
      type: 'center',
    }
    this.draggableObjects.push(this.controlCenter)
    this.addIconToDot('CursorMoveIcon', this.controlCenter)

    if (!config.isCTLab && !this.isScanOrLocalizer()) {
      // Oversampling Dots
      _.each([true, false], (isA) => {
        let dot = new THREE.Mesh(geometryDot, materialDotOversampling)
        dot.__data = {
          type: 'oversampling',
        }
        this.draggableObjects.push(dot)
        this.addIconToDot('ArrowExpandHorizontalIcon', dot)

        if (isA) {
          // setting it like this instead of as this[varName] since my IDE didn't understand where the variable was defined that way
          this.oversamplingDotA = dot
        } else {
          this.oversamplingDotB = dot
        }
      })
    }

    _.each(this.draggableObjects, (obj) => {
      this.addObjectToScene(obj)
    })

    // After add object to scene, remove glow cylinder if CT lab mode
    if (config.isCTLab) {
      this.draggableObjects = this.draggableObjects.filter(
        (dot) => _.get(dot, '__data.type') != 'glow' && _.get(dot, '__data.type') != 'glowCenter'
      )
    }

    // Outline
    this.outlineCornerPositionsByXYZ = {}
    this.outlineTestCornerPositionsByXYZ = {}
    this.oversamplingOutlineACornerPositionsByXYZ = {}
    this.oversamplingOutlineBCornerPositionsByXYZ = {}
    _.each([-1, 1], (x) => {
      _.each([-1, 1], (y) => {
        _.each([-1, 1], (z) => {
          _.set(this.outlineTestCornerPositionsByXYZ, [x, y, z], new THREE.Vector3())
          _.set(this.outlineCornerPositionsByXYZ, [x, y, z], new THREE.Vector3())
          _.set(this.oversamplingOutlineACornerPositionsByXYZ, [x, y, z], new THREE.Vector3())
          _.set(this.oversamplingOutlineBCornerPositionsByXYZ, [x, y, z], new THREE.Vector3())
        })
      })
    })
    this.recreateOutlineObject()

    // get created on the fly, since we don't know how many we'll need ahead of time
    this.sliceLines = []

    this.dashedSliceLines = []

    // Outline slice lines, replace for outline when region is 'Cardiac' in MR Mode
    this.outlineLines = []

    this.oversamplingLines = []

    if (!config.isCTLab && !this.isScanOrLocalizer()) {
      this.oversamplingLines = _.map(_.range(12), () => {
        // 12 = 2 cubes with 6 faces/planes/sides each
        let line = new THREE.Line(createLineGeometry(), materialOversampling)
        this.addObjectToScene(line)
        return line
      })
    }
  }

  beforeDestroy() {
    // Remove all ThreeJS objects that are part of this instance from scene
    _.each(this.objectsAddedToScene, (obj) => {
      this.scene.remove(obj)
    })

    if (this.controls) {
      this.controls?.deactivate()
    }
  }

  // NEW dispose() method: call this to fully release resources
  dispose() {
    // console.log('StackVolumeSelection: dispose() called for ident', this.ident);

    // Dispose DragControls if they exist.
    if (this.dragControls && typeof this.dragControls.dispose === 'function') {
      this.dragControls.dispose()
      this.dragControls = null
    }

    // Dispose all objects we added.
    _.each(this.objectsAddedToScene, (obj) => {
      if (this.scene && obj) {
        this.scene.remove(obj)
      }
      if (obj.geometry && typeof obj.geometry.dispose === 'function') {
        obj.geometry.dispose()
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => {
            if (m && typeof m.dispose === 'function') {
              m.dispose()
            }
          })
        } else if (typeof obj.material.dispose === 'function') {
          obj.material.dispose()
        }
      }
    })
    // Clear any arrays to remove lingering references
    this.objectsAddedToScene = []
    this.draggableObjects = []
    this.dotIconObjects = []
  }

  vendorStylePreference() {
    return this.$store.state.selectionConfig.vendorStylePreference
      ? this.$store.state.selectionConfig.vendorStylePreference
      : this.$store.state.user.vendorStylePreference
  }
  isUltraLab() {
    return this.$store.state.selectionConfig.isUltraLab
  }
  dotScaleMultiplier() {
    return this.$store.state.selectionConfig.dotScaleMultiplier
  }
  isEditingQuestion() {
    return this.$store.state.questionService.isEditingQuestion
  }
  isPressCtrlButton() {
    return this.$store.state.selectionConfig.keyStates.Control
  }
  dotsShouldBeTransparent() {
    return this.$store.getters['selectionConfig/dotsShouldBeTransparent']
  }
  shouldShowSignleSliceRotationIcons() {
    const dotScaleMultiplier = this.$store.state.selectionConfig.dotScaleMultiplier
    return this.isSingleSliceMode() && (dotScaleMultiplier == 1.5 || dotScaleMultiplier == 2 || dotScaleMultiplier == 3)
  }
  isShowSingleSliceWhenPlaneClosestIsZ() {
    // return this.$store.state.dicomService.dicomFileSet.regionId === 11 && !config.isCTLab
    return !this.isScanOrLocalizer()
  }
  isVolumeViewMode() {
    return this.$store.state.selectionConfig.isVolumeViewMode
  }
  dotGeometry() {
    return this.$store.getters['selectionConfig/curDotGeometry']
  }
  dotIconScale() {
    return this.dotScaleMultiplier() * 0.3
  }
  dotColorScale() {
    let mul = this.dotScaleMultiplier()
    if (mul === 2.9) {
      mul = 0.5
    }
    return mul * 0.7
  }
  currentZDirectionBias() {
    return this.$store.getters['stackService/currentZDirectionBias']
  }

  refreshDotSize() {
    let iconScale = this.dotIconScale()
    let geometryDot = this.dotGeometry()

    _.each(this.dotIconObjects, ({ dot, iconObject }) => {
      dot.geometry = geometryDot
      iconObject.scale.set(iconScale, iconScale, iconScale)
    })

    const scale = this.dotColorScale()
    this.rotationIndicator1.scale.set(scale, scale, scale)
    this.rotationIndicator2.scale.set(scale, scale, scale)
    this.rotationIndicator3.scale.set(scale, scale, scale)
  }

  addIconToDot(iconName, dot) {
    this.$store.dispatch('threeJSSVGProvider/createInstance', {
      svgName: iconName,
      renderOrder: 1, // render above everything else, with a sort of z-order of 1
      callback: (iconObject) => {
        let iconScale = this.dotIconScale() // they get larger if the dots are larger
        iconObject.scale.set(iconScale, iconScale, iconScale)
        this.dotIconObjects.push({ iconObject, dot })
        this.addObjectToScene(iconObject)
      },
    })
  }

  // Use this to keep track of which objects this instance added to the scene, so they can be removed when this instance is
  addObjectToScene(obj) {
    this.objectsAddedToScene.push(obj)
    this.scene.add(obj)
  }

  // Position and aim an encoding-direction arrow along an outward axis.
  // outwardAxis points from box center to the side where the arrow should
  // sit; the arrow tip extends 18 units further along outwardAxis.
  aimEncodingArrow(indicator, outwardAxis) {
    const controlSide = _.minBy(_.filter(this.controlSides, 'visible'), (side) => {
      return tmpVec3.subVectors(side.position, this.center3).normalize().distanceToSquared(outwardAxis)
    })
    if (!controlSide) return

    indicator.visible = true
    const destination = controlSide.position.clone().add(outwardAxis.clone().multiplyScalar(18))
    // lookAt works from the mesh's current position, so seat the indicator
    // at controlSide first, aim, then slide out to destination.
    indicator.position.copy(controlSide.position)
    indicator.lookAt(destination)
    // lookAt points the cone 90° off its long axis; rotate local X back.
    indicator.rotateOnAxis(VECTOR3_NORMAL_X, Math.PI / 2)
    indicator.position.copy(destination)
  }

  setBackgroundSlice(backgroundSlice) {
    this.backgroundSlice = backgroundSlice
    // cameraDirection - direction of slice / camera (or opposite?)
    // Set address of cameradirection to address of planeDirection
    this.cameraDirection = this.backgroundSlice.planeDirection

    // Fix: FLIP L/R
    // In CT Lab mode, axial view reference from the direction of mri machine in/out
    // To prevent image flip L/R is wrong, always set the dirLPS closest Z > 0
    if (config.isCTLab) {
      this.adjustCameraDirection(this.cameraDirection)
    }
  }

  adjustCameraDirection(cameraDir) {
    if (!config.isCTLab) {
      return cameraDir
    } else {
      let closestSignedWorldAxis3 = getClosestSignedAxis3(cameraDir)
      if (closestSignedWorldAxis3.z == -1) {
        cameraDir = cameraDir.clone().negate()
      }

      return cameraDir
    }
  }

  makeNewOutlineGeometry(fromVarName) {
    let geometry = new THREE.Geometry()
    geometry.vertices.push(
      // X=1 square
      this[fromVarName][1][1][1],
      this[fromVarName][1][1][-1],
      this[fromVarName][1][-1][-1],
      this[fromVarName][1][-1][1],
      this[fromVarName][1][1][1],
      // X=-1 square
      this[fromVarName][-1][1][1],
      this[fromVarName][-1][1][-1],
      this[fromVarName][-1][-1][-1],
      this[fromVarName][-1][-1][1],
      this[fromVarName][-1][1][1],

      this[fromVarName][-1][1][-1],
      this[fromVarName][1][1][-1],
      this[fromVarName][1][-1][-1],
      this[fromVarName][-1][-1][-1],
      this[fromVarName][-1][-1][1],
      this[fromVarName][1][-1][1]
    )
    return geometry
  }

  recreateOutlineObject() {
    if (this.outline) {
      log.debug('Recreating outline geometry')
      this.outline.geometry.dispose()
      this.outline.geometry = this.makeNewOutlineGeometry('outlineCornerPositionsByXYZ')
      this.outlineTest.geometry.dispose()
      this.outlineTest.geometry = this.makeNewOutlineGeometry('outlineTestCornerPositionsByXYZ')
    } else {
      let materialOutline = materialOutlineByIdent[this.getIdentType()] || materialOutlineByIdent.default
      this.outline = new THREE.Line(this.makeNewOutlineGeometry('outlineCornerPositionsByXYZ'), materialOutline)
      this.outlineTest = new THREE.Line(
        this.makeNewOutlineGeometry('outlineTestCornerPositionsByXYZ'),
        materialOutlineTest
      )
      this.outlineTest.frustumCulled = false
      this.addObjectToScene(this.outlineTest)
      this.outline.frustumCulled = false
      this.addObjectToScene(this.outline)
    }
    this.recreateOversamplingOutlineObject()
  }

  recreateOversamplingOutlineObject() {
    if (config.isCTLab) {
      return
    }
    if (this.oversamplingOutlineA) {
      log.debug('Recreating outline geometryA')
      this.oversamplingOutlineA.geometry.dispose()
      this.oversamplingOutlineA.geometry = this.makeNewOutlineGeometry('oversamplingOutlineACornerPositionsByXYZ')
    } else {
      this.oversamplingOutlineA = new THREE.Line(
        this.makeNewOutlineGeometry('oversamplingOutlineACornerPositionsByXYZ'),
        materialOversampling
      )
      if (!config.isCTLab) {
        this.addObjectToScene(this.oversamplingOutlineA)
      }
    }

    if (this.oversamplingOutlineB) {
      log.debug('Recreating outline geometryB')
      this.oversamplingOutlineB.geometry.dispose()
      this.oversamplingOutlineB.geometry = this.makeNewOutlineGeometry('oversamplingOutlineBCornerPositionsByXYZ')
    } else {
      this.oversamplingOutlineB = new THREE.Line(
        this.makeNewOutlineGeometry('oversamplingOutlineBCornerPositionsByXYZ'),
        materialOversampling
      )
      if (!config.isCTLab) {
        this.addObjectToScene(this.oversamplingOutlineB)
      }
    }
  }

  getIdentType() {
    return identToIdentType(this.ident)
  }
  isScanOrLocalizer() {
    return this.getIdentType() === SCAN_BOX_IDENT || this.getIdentType() === LOCALIZER_BOX_IDENT
  }
  getGroupId() {
    return identToGroupId(this.ident)
  }
  myGroupIsSelected() {
    // selected ident has same group as myself
    let curGroupId = this.$store.getters['selectionConfig/selectionConfigsCurrentGroupId']
    return curGroupId === this.getGroupId()
  }

  selectionConfigIsCurrent() {
    return this.ident === this.$store.state.selectionConfig.selectionConfigCurrentIdent
  }

  currentIdentIsSelected() {
    return _.includes(this.$store.state.selectionConfig.groupSelectionConfigs, this.ident)
  }
  currentIdentSelectionConfigIsSelected() {
    return _.includes(
      this.$store.state.selectionConfig.groupSelectionConfigs,
      this.$store.state.selectionConfig.selectionConfigCurrentIdent
    )
  }
  groupSelectionConfigs() {
    return this.$store.state.selectionConfig.groupSelectionConfigs
  }

  isAddLocalizerMode() {
    return this.$store.state.selectionConfig.isAddLocalizerMode
  }

  isSingleSliceMode() {
    return this.$store.getters['selectionConfig/isSingleSliceMode'] || this.getSelectionConfig().numberOfSlices == 1
  }

  getSelectionConfig() {
    let selectionConfig = this.$store.state.selectionConfig.selectionConfigsByIdent[this.ident]
    if (!selectionConfig) {
      // Just a warning to work around mostly just src/components/FullscreenSlice.vue:5 ?
      console.warn('No selectionConfigsByIdent for: ' + this.ident)
    }
    return selectionConfig
  }

  isVisible() {
    // Hide all but current selection when isAddLocalizerMode (but still allow even it to be made invisible)
    if (this.isAddLocalizerMode() && this.ident !== this.$store.state.selectionConfig.selectionConfigCurrentIdent) {
      return false
    }
    return this.getSelectionConfig().visible
  }

  isOutlineVisible() {
    return this.outlineVisible
  }
  getControlCenterPosition() {
    return this.controlCenter.position
  }
  isControlsDisabled() {
    return (
      (config.isCTLab &&
        (!this.isVisible() ||
          this.$store.state.questionService.scanStatus !== SCAN_STATUS.NO_SCAN ||
          this.$store.getters['questionService/isAnsweredCurrentQuestion'])) ||
      (!config.isCTLab &&
        (!this.isVisible() ||
          this.$store.state.questionService.hasAnsweredAllStackQuestions ||
          this.$store.getters['questionService/isAnsweredCurrentQuestion']))
    )
  }

  getMaterialForSliceLine(identType, isMasterAngle, isSingleSliceMinCenterLine) {
    // Matthew wants center-most line of Min to also be green like initial/proposed
    if (isSingleSliceMinCenterLine) {
      return materialLineSliceByIdent.default
    } else {
      let map = isMasterAngle ? materialLineSliceMasterByIdent : materialLineSliceByIdent
      return map[identType] || map.default
    }
  }

  getPlaneClosest() {
    // Which plane is facing the camera the most
    //  figuring out which plane is facing camera: get distance^2 from planetDirection vs this.xDirection3 / y / z and negative z / y / z
    let planes = [
      {
        x: 1,
        y: null,
        z: null,
        dir: this.xDirection3,
      },
      {
        x: -1,
        y: null,
        z: null,
        dir: this.xDirection3.clone().negate(),
      },
      {
        x: null,
        y: 1,
        z: null,
        dir: this.yDirection3,
      },
      {
        x: null,
        y: -1,
        z: null,
        dir: this.yDirection3.clone().negate(),
      },
      {
        x: null,
        y: null,
        z: 1,
        dir: this.zDirection3,
      },
      {
        x: null,
        y: null,
        z: -1,
        dir: this.zDirection3.clone().negate(),
      },
    ]

    let cameraDir = this.adjustCameraDirection(this.cameraDirection)
    if (this.isCameraReversed()) {
      cameraDir = cameraDir.clone().negate()
    }

    return _.minBy(planes, (plane) => {
      return plane.dir.distanceToSquared(cameraDir)
    })
  }

  // Camera is looking from other side of image
  // Keep this in sync with src/components/SliceView.vue#isCameraReversed
  isCameraReversed() {
    let dirAbs = _.mapValues(this.adjustCameraDirection(this.cameraDirection), Math.abs)
    return dirAbs.y >= dirAbs.x && dirAbs.y >= dirAbs.z
  }
  intersectLineSegments3D(p1a, p1b, p2a, p2b) {
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
  intersectLineSegments3DNoClamp(p1a, p1b, p2a, p2b) {
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
    return new THREE.Vector3(x, y, z)
  }
  areVectorsSameDirection(vectorA, vectorB) {
    // Normalize the vectors
    const normalizedA = vectorA.clone().normalize()
    const normalizedB = vectorB.clone().normalize()

    // Calculate the dot product
    const dotProduct = normalizedA.dot(normalizedB)

    // Check if the dot product is close to 1 (same direction)
    return Math.abs(dotProduct - 1) < Number.EPSILON
  }
  updateGeometries({ recreateLines } = {}) {
    // If my this.ident doesn't correspond to any valid selectionConfig right now, just don't render
    // Mostly just caused by src/components/FullscreenSlice.vue:5 ?
    if (!this.getSelectionConfig()) {
      return
    }

    let visible = this.isVisible()

    // Initially hide the glowing lines
    _.each(this.glowMeshes, function (glowLine) {
      glowLine.visible = false
    })

    // Initially hide the glowing center lines
    _.each(this.glowCenterMeshes, function (glowLine) {
      glowLine.visible = false
    })

    // Dots - first hide them all
    _.each(this.controlCorners, function (dot) {
      dot.visible = false
    })
    _.each(this.controlSides, function (dot) {
      dot.visible = false
    })
    this.controlCenter.visible = false
    if (!config.isCTLab && !this.isScanOrLocalizer()) {
      this.oversamplingDotA.visible = false
      this.oversamplingDotB.visible = false
    }
    this.phaseIndicator.visible = false
    this.frequencyIndicator.visible = false
    this.sliceEncodingDirectionIndicator.visible = false

    if (recreateLines) {
      // This has to be done when changing the slice stack to a different one, or the outline won't re-render anywhere but the first one it was seen in
      this.recreateOutlineObject()
      _.each(
        _.concat(this.sliceLines, this.oversamplingLines, this.outlineLines, this.dashedSliceLines),
        function (line) {
          line.geometry.dispose()
          line.geometry = createLineGeometry()
        }
      )
    }

    // All slice lines default to hidden
    _.each(
      _.concat(this.sliceLines, this.oversamplingLines, this.outlineLines, this.dashedSliceLines),
      function (line) {
        line.visible = false
      }
    )

    // let {exceptId} = options
    let dimensions3Half = this.getDimensions3Half()

    // center displacement happens for Orth 2d Camera, so that all of Selection Cuboid is visible even if it the slice is in the middle of it
    this.centerDisplaced3 = this.centerDisplaced3 ? this.centerDisplaced3.copy(this.center3) : this.center3.clone()
    // this seems to break lines in 3D? Not sure why, but not doing this even, even in 2D, fixes 3D lines...
    if (!this.isCamera3D) {
      this.centerDisplaced3.add(
        this.adjustCameraDirection(this.cameraDirection)
          .clone()
          .multiplyScalar(DISPLACEMENT_AMOUNT * (this.isCameraReversed() ? -1 : 1))
      )
      log.debug('update geo: cameraDirection', this.cameraDirection.x, this.cameraDirection.y, this.cameraDirection.z)
      // log.debug('update geo: centerDisplacement3', centerDisplacement3.x, centerDisplacement3.y, centerDisplacement3.z)
    }

    let planeClosest = this.getPlaneClosest()

    // Outline
    // Z is the direction in which the Slices are on top of each other, so there are no slice lines to see there
    //  also: only show outline for current group
    this.outline.visible =
      visible &&
      (!!planeClosest.z || this.$store.state.selectionConfig.showOutline || this.isAddLocalizerMode()) &&
      this.myGroupIsSelected()
    this.outlineTest.visible = false //config.env == 'development'

    // if (this.outline.visible && this.isShowSingleSliceWhenPlaneClosestIsZ() && !this.isAddLocalizerMode()) {
    //   dimensions3Half = dimensions3Half.clone().setZ(0)
    // }

    let { oversampling } = this.getSelectionConfig()
    // if x=1 is as as far from the center as dim3Half.x, then this is how far the oversampling goes out
    let xOversamplingToDem3HalfXRatio = oversampling + 1

    // Show Oversampling intersection lines: visible && planeClosest.y && this.myGroupIsSelected()
    if (_.has(this.oversamplingOutlineA, ['visible'])) {
      this.oversamplingOutlineA.visible =
        this.outline.visible && !this.isAddLocalizerMode() && oversampling > 0 && !this.isScanOrLocalizer()
    }
    if (_.has(this.oversamplingOutlineB, ['visible'])) {
      this.oversamplingOutlineB.visible = this.oversamplingOutlineA.visible
    }

    if (this.outline.visible) {
      // Place Line / outline
      _.each([-1, 1], (x) => {
        _.each([-1, 1], (y) => {
          _.each([-1, 1], (z) => {
            if (this.outline.visible) {
              let positionOutline = _.get(this.outlineCornerPositionsByXYZ, [x, y, z])
              // displaced so we can always see the full outline
              setPositionFromCoordinates(positionOutline, x, y, z, dimensions3Half, this.isSingleSliceMode(), this)
            }
            if (this.oversamplingOutlineA?.visible) {
              let positionOversamplingOutlineA = _.get(this.oversamplingOutlineACornerPositionsByXYZ, [x, y, z])
              setPositionFromCoordinates(
                positionOversamplingOutlineA,
                x === 1 ? xOversamplingToDem3HalfXRatio : 1,
                y,
                z,
                dimensions3Half,
                true,
                this
              )
              let positionOversamplingOutlineB = _.get(this.oversamplingOutlineBCornerPositionsByXYZ, [x, y, z])
              setPositionFromCoordinates(
                positionOversamplingOutlineB,
                x === -1 ? -xOversamplingToDem3HalfXRatio : -1,
                y,
                z,
                dimensions3Half,
                true,
                this
              )
            }
          })
        })
      })
      this.outline.geometry.verticesNeedUpdate = true

      if (this.oversamplingOutlineA?.visible) {
        this.oversamplingOutlineA.geometry.verticesNeedUpdate = true
        this.oversamplingOutlineB.geometry.verticesNeedUpdate = true

        // We want to use the Z where the other dots go, which depends on which one is closest to the camera
        let z = planeClosest.z === 1 ? 1 : -1
        // Lerp it over one of the lines of the outline (from -Y to +Y)
        if (!config.isCTLab && !this.isScanOrLocalizer()) {
          this.oversamplingDotA.position.lerpVectors(
            this.oversamplingOutlineACornerPositionsByXYZ[1][1][z],
            this.oversamplingOutlineACornerPositionsByXYZ[1][-1][z],
            0.75
          )
          this.oversamplingDotA.visible = true
          this.oversamplingDotB.position.lerpVectors(
            this.oversamplingOutlineBCornerPositionsByXYZ[-1][1][z],
            this.oversamplingOutlineBCornerPositionsByXYZ[-1][-1][z],
            0.75
          ) // So you could say that B is left? A is right?
          this.oversamplingDotB.visible = true
        }
      }
    }

    if (this.outlineTest.visible) {
      // Place Line / outlineTest
      _.each([-1, 1], (x) => {
        _.each([-1, 1], (y) => {
          _.each([-1, 1], (z) => {
            if (this.outlineTest.visible) {
              let positionOutline = _.get(this.outlineTestCornerPositionsByXYZ, [x, y, z])
              setPositionFromCoordinates(positionOutline, x, y, z, dimensions3Half, false, this)
            }
          })
        })
      })
      this.outlineTest.geometry.verticesNeedUpdate = true
    }

    if (this.outline.visible) {
      // Show Outline, means the dots need to be placed on the outline cuboid
      // Hide lines that only show in non-outline mode
      if (this.perpendicularLine) {
        this.perpendicularLine.visible = false
      }
      if (this.volumeViewOuterLineLeft) {
        this.volumeViewOuterLineLeft.visible = false
      }
      if (this.volumeViewOuterLineRight) {
        this.volumeViewOuterLineRight.visible = false
      }

      // Place Corners / Sides / Center - Dots
      // We need all these dots, even if there is only 1 Slice picked, because this is the top of that slice
      let indexCorner = 0
      let indexSide = 0
      _.each([-1, 0, 1], (j) => {
        _.each([-1, 0, 1], (k) => {
          // on the grid of -1, 0, 1, the the 0s represent the side-centers: none of those is a corner, 1 is a side, 2 is double-center
          let zerosCount = _.size(_.reject([j, k]))
          let x, y, z
          if (planeClosest.x) {
            ;[x, y, z] = [planeClosest.x, j, k]
          } else if (planeClosest.y) {
            ;[x, y, z] = [j, planeClosest.y, k]
          } else if (planeClosest.z) {
            ;[x, y, z] = [j, k, planeClosest.z]
          } else {
            console.error('Bad planeClosest')
            return
          }
          if (zerosCount === 0) {
            // Corner - Rotate
            let corner = this.controlCorners[indexCorner]
            corner.visible = visible
            _.set(corner.__data, 'index', { x, y, z })
            setPositionFromCoordinates(corner.position, x, y, z, dimensions3Half, true, this)
            indexCorner++
          } else if (zerosCount === 1) {
            // Side - Resize
            let side = this.controlSides[indexSide]
            side.visible = visible
            _.set(side.__data, 'index', { x, y, z })
            setPositionFromCoordinates(side.position, x, y, z, dimensions3Half, true, this)

            indexSide++
          } else if (zerosCount === 2) {
            // Center - Move
            this.controlCenter.visible = visible
            _.set(this.controlCenter.__data, 'index', { x, y, z })
            setPositionFromCoordinates(this.controlCenter.position, x, y, z, dimensions3Half, true, this)
          }
        })
      })
    }

    if (!this.outline.visible || this.isAddLocalizerMode()) {
      // no outline, so look for slice lines, and put dots there

      // Slice Lines
      let sliceLinesVisible = []

      tmpDisplacementVector.copy(this.adjustCameraDirection(this.cameraDirection))
      tmpDisplacementVector.multiplyScalar(DISPLACEMENT_AMOUNT * (this.isCameraReversed() ? -1 : 1))

      // Get only slice lines that intersect with our tmpBackgroundSlicePlane (and where)
      let numberOfSlices = this.getSelectionConfig().numberOfSlices
      let gapSizeGrid = numberOfSlices === 1 ? 0 : 2 / (numberOfSlices - 1) // to go 0...2 // slice center to slice center

      tmpBackgroundSlicePlane.setFromNormalAndCoplanarPoint(
        this.backgroundSlice.planeDirection,
        this.backgroundSlice.planePosition
      )
      //#region Awlway show slice lines
      // // Is plane dir is same with any box direction, then we can see the slice line
      // const isSameZDirection = this.areVectorsSameDirection(this.backgroundSlice.planeDirection, this.zDirection3)
      // const isSameYDirection = this.areVectorsSameDirection(this.backgroundSlice.planeDirection, this.yDirection3)
      // const isSameXDirection = this.areVectorsSameDirection(this.backgroundSlice.planeDirection, this.xDirection3)
      // const isSameAnyDirection = isSameZDirection || isSameYDirection || isSameXDirection

      // if (isSameAnyDirection) {
      //   tmpBackgroundSlicePlane.setFromNormalAndCoplanarPoint(this.backgroundSlice.planeDirection, this.center3)
      //   tmpCalcPlane.setFromNormalAndCoplanarPoint(
      //     this.backgroundSlice.planeDirection,
      //     this.backgroundSlice.planePosition
      //   )
      //   const center3ToPlaneDistance = tmpCalcPlane.distanceToPoint(this.center3)

      //   tmpDisplacementVector.copy(this.adjustCameraDirection(this.cameraDirection))
      //   tmpDisplacementVector.multiplyScalar(
      //     (DISPLACEMENT_AMOUNT - center3ToPlaneDistance) * (this.isCameraReversed() ? -1 : 1)
      //   )
      // } else {
      //   tmpBackgroundSlicePlane.setFromNormalAndCoplanarPoint(
      //     this.backgroundSlice.planeDirection,
      //     this.backgroundSlice.planePosition
      //   )
      //   tmpDisplacementVector.copy(this.adjustCameraDirection(this.cameraDirection))
      //   tmpDisplacementVector.multiplyScalar(DISPLACEMENT_AMOUNT * (this.isCameraReversed() ? -1 : 1))
      // }
      //#endregion Awlway show slice lines

      // log.debug('>>> camera direction',this.cameraDirection.x,this.cameraDirection.y,this.cameraDirection.z)
      // log.debug('tmpBackgroundSlicePlane',tmpBackgroundSlicePlane)

      // Index of sliceLines that we're updating next
      let sliceLineIndex = 0

      const updateSliceLinesInAxis = (axis = 'z') => {
        let { spacing } = this.getSelectionConfig()

        // For each desired selection slice
        for (let i = 0; i < numberOfSlices; i++) {
          // log.debug(' slice', i)
          if (visible && !planeClosest[axis]) {
            // Get position of all 4 corners of current slice
            // Z goes from -1 to 1 (so enough gapSize to cover 2 units, usually) - except if there is just one slice, then stick with Z = 0
            let gridPositionInAxis = numberOfSlices === 1 ? 0 : -1 + i * gapSizeGrid
            let pointIndex = 0
            _.each([-1, 1], (j) => {
              _.each([-1, 1], (k) => {
                let x, y, z
                if (axis === 'x') {
                  ;[x, y, z] = [gridPositionInAxis, j, k]
                } else if (axis === 'y') {
                  ;[x, y, z] = [j, gridPositionInAxis, k]
                } else if (axis === 'z') {
                  ;[x, y, z] = [j, k, gridPositionInAxis]
                } else {
                  console.error('Bad planeClosest')
                  return
                }

                if (this.isAddLocalizerMode()) {
                  // Slice Previews in Localizer Mode have the currection Slice Preview axis shortened to the length of user-set spacing
                  tmpDim3HalfForLocalizerMode.set(dimensions3Half.x, dimensions3Half.y, dimensions3Half.z)
                  tmpDim3HalfForLocalizerMode[axis] = spacing
                  // console.log('createPoints', x, y, z, dimensions3Half, tmpDim3HalfForLocalizerMode, this.getSelectionConfig())
                  setPositionFromCoordinates(
                    tmpCornerPoints[pointIndex],
                    x,
                    y,
                    z,
                    tmpDim3HalfForLocalizerMode,
                    false,
                    this
                  )
                } else {
                  // Slice Previews should span throughout full selection cuboid, so use the dimensions3Half of that as-is
                  // log.info('x y z', x, y, z, dimensions3Half)
                  setPositionFromCoordinates(tmpCornerPoints[pointIndex], x, y, z, dimensions3Half, false, this)
                }
                pointIndex++
              })
            })

            // Create SliceLine for current slice's intersection line (which may or may not exist)
            //  if we don't have enough yet
            if (this.sliceLines.length <= sliceLineIndex) {
              log.debug(' creating sliceLine for', sliceLineIndex)
              let line = new THREE.Line(
                createLineGeometry(),
                this.getMaterialForSliceLine(this.getIdentType(), false, false)
              )
              line.frustumCulled = false

              this.sliceLines.push(line)
              this.addObjectToScene(line)
            }
            let sliceLine = this.sliceLines[sliceLineIndex]
            sliceLineIndex++

            // Sets sliceLine to line of where Plane and fourCorners intersect
            let bIntersects = setIntersectionLineFromPlaneAndFourCorners(
              sliceLine,
              tmpBackgroundSlicePlane,
              tmpCornerPoints,
              tmpDisplacementVector
            )
            if (bIntersects) {
              sliceLinesVisible.push(sliceLine)
            }
          }
        }
      }
      updateSliceLinesInAxis('z')
      if (this.isAddLocalizerMode()) {
        updateSliceLinesInAxis('y')
        updateSliceLinesInAxis('x')
      }

      // Oversampling Non-Outline rendering; Figure out the intersections
      // For the Outline view, we only want to render the Oversampling if the group is selected (in planeClosest.z the camera is looking at it like an outline / "top of the stack of paper/slices")
      if (
        visible &&
        oversampling > 0 &&
        !planeClosest.x &&
        !this.isAddLocalizerMode() &&
        (!planeClosest.z || this.myGroupIsSelected())
      ) {
        // the faces of a cube. For each axis there are two faces. One with all the points from that axis all as 1, and other other with them as -1
        let faces = [
          [
            // -X (left)
            [-1, 1, -1],
            [-1, -1, -1],
            [-1, 1, 1],
            [-1, -1, 1],
          ],
          [
            // +X
            [1, 1, -1],
            [1, -1, -1],
            [1, 1, 1],
            [1, -1, 1],
          ],
          [
            // -Y
            [1, -1, -1],
            [-1, -1, -1],
            [1, -1, 1],
            [-1, -1, 1],
          ],
          [
            // +Y
            [1, 1, -1],
            [-1, 1, -1],
            [1, 1, 1],
            [-1, 1, 1],
          ],
          [
            // -Z
            [1, -1, -1],
            [-1, -1, -1],
            [1, 1, -1],
            [-1, 1, -1],
          ],
          [
            // +Z
            [1, -1, 1],
            [-1, -1, 1],
            [1, 1, 1],
            [-1, 1, 1],
          ],
        ]

        let lineIndex = 0
        // for both cubes: left/right side
        _.each([true, false], (oversamplingLeftSide) => {
          _.each(faces, (corners, faceIndex) => {
            // 4 corners per face
            _.each(corners, ([x, y, z], pointIndex) => {
              if (oversamplingLeftSide) {
                setPositionFromCoordinates(
                  tmpCornerPoints[pointIndex],
                  x === -1 ? -xOversamplingToDem3HalfXRatio : -1,
                  y,
                  z,
                  dimensions3Half,
                  false,
                  this
                )
              } else {
                setPositionFromCoordinates(
                  tmpCornerPoints[pointIndex],
                  x === 1 ? xOversamplingToDem3HalfXRatio : 1,
                  y,
                  z,
                  dimensions3Half,
                  false,
                  this
                )
              }
            })
            let curOversamplingLine = this.oversamplingLines[lineIndex]
            if (curOversamplingLine) {
              // makes line visible if it intersects
              let bIntersects = setIntersectionLineFromPlaneAndFourCorners(
                curOversamplingLine,
                tmpBackgroundSlicePlane,
                tmpCornerPoints,
                tmpDisplacementVector
              )
              if (bIntersects) {
                // Oversampling dots based on line intersections go from specific cuboid faces per side
                // Each face of the cuboid should result in a single sliceLine - if this sliceLine was from the appropriate face of a the cube, put the dot there
                let [linePointA, linePointB] = curOversamplingLine.geometry.vertices
                if (oversamplingLeftSide) {
                  if (faceIndex === 0 && !config.isCTLab && !this.isScanOrLocalizer()) {
                    // -X face
                    this.oversamplingDotA.position.lerpVectors(linePointA, linePointB, 0.75)
                    this.oversamplingDotA.visible = true
                  }
                } else {
                  if (faceIndex === 1 && !config.isCTLab && !this.isScanOrLocalizer()) {
                    // +X face
                    this.oversamplingDotB.position.lerpVectors(linePointA, linePointB, 0.75)
                    this.oversamplingDotB.visible = true
                  }
                }

                lineIndex++
              }
            }
          })
        })
      }

      // Volume View - Trim away based on the visible slice (the ones that intersect with bg slice)
      // just leaves the top+bottom + centermost 1 or 2 (for "Master Angle")
      if (this.isVolumeViewMode()) {
        let amountVisible = _.size(sliceLinesVisible)
        sliceLinesVisible = _.reject(sliceLinesVisible, function (sliceLine, i) {
          // when amount of lines is odd, then just the one center line is highlighted; otherwise, both of the two most center lines are
          let isCenterMost = i === Math.floor((amountVisible - 1) / 2) || i === Math.ceil((amountVisible - 1) / 2)
          let omittedDueToVolumeViewMode = i > 0 && i < amountVisible - 1 && !isCenterMost
          if (omittedDueToVolumeViewMode) {
            sliceLine.visible = false
          }
          return omittedDueToVolumeViewMode
        })
      }

      if (sliceLinesVisible.length > 0 && !this.isAddLocalizerMode()) {
        let masterCount = 0
        let masterLines = []
        let identType = this.getIdentType()

        // "Master Angle" slice lines / SingleSliceMinCenterLine
        // Master Angle is the centermost one/two of any selected ident, which highlists
        // SingleSliceMinCenterLine is the centermost one/two of in Single Slice Mode of the Min identType, to make it look green like the initial usually is
        _.each(sliceLinesVisible, (line, i) => {
          let isMasterAngle = false
          let isSingleSliceMinCenterLine = false
          // only highlight for current Selection
          let isSingleSliceAndMin = this.isSingleSliceMode() && identType === 'min'
          // Check the curent selection is it or the group includes it
          if (this.selectionConfigIsCurrent() || this.currentIdentIsSelected() || isSingleSliceAndMin) {
            // when amount of lines is odd, then just the one center line is highlighted; otherwise, both of the two most center lines are
            let isCenterMost =
              i === Math.floor((sliceLinesVisible.length - 1) / 2) ||
              i === Math.ceil((sliceLinesVisible.length - 1) / 2)
            isMasterAngle = (this.selectionConfigIsCurrent() || this.currentIdentIsSelected()) && isCenterMost
            isSingleSliceMinCenterLine = isSingleSliceAndMin && isCenterMost
          }
          line.material = this.getMaterialForSliceLine(identType, isMasterAngle, isSingleSliceMinCenterLine)
          line.frustumCulled = false

          if (isMasterAngle) {
            masterLines[masterCount] = line
            masterCount++
          }
        })
        if (masterCount === 2) {
          let firstLinePointA = masterLines[0].geometry.vertices[0]
          let secondLinePointA = masterLines[1].geometry.vertices[0]
          let distanceBetween = secondLinePointA.distanceTo(firstLinePointA)
          this.glowMeshes[0] = updateGlowCylinderFromLine(
            this.glowMeshes[0],
            masterLines[0],
            distanceBetween / 2,
            0.35,
            -1
          )
          this.glowMeshes[1] = updateGlowCylinderFromLine(
            this.glowMeshes[1],
            masterLines[0],
            distanceBetween / 2,
            0.35,
            1
          )
          this.glowMeshes[2] = updateGlowCylinderFromLine(
            this.glowMeshes[2],
            masterLines[1],
            distanceBetween / 2,
            0.35,
            -1
          )
          this.glowMeshes[3] = updateGlowCylinderFromLine(
            this.glowMeshes[3],
            masterLines[1],
            distanceBetween / 2,
            0.35,
            1
          )

          this.glowCenterMeshes[0] = updateGlowCenterCylinderFromLine(
            this.glowCenterMeshes[0],
            masterLines[0],
            distanceBetween / 2
          )
          this.glowCenterMeshes[1] = updateGlowCenterCylinderFromLine(
            this.glowCenterMeshes[1],
            masterLines[1],
            distanceBetween / 2
          )
        } else if (masterCount === 1) {
          // Update the glow lines to prevent old lines in front of new ones
          this.glowMeshes[0] = updateGlowCylinderFromLine(this.glowMeshes[0], masterLines[0], 1.5, 0.35, -1)
          this.glowMeshes[1] = updateGlowCylinderFromLine(this.glowMeshes[1], masterLines[0], 1.5, 0.35, 1)
          this.glowMeshes[2] = updateGlowCylinderFromLine(this.glowMeshes[2], masterLines[0], 1.5, 0.35, -1)
          this.glowMeshes[3] = updateGlowCylinderFromLine(this.glowMeshes[3], masterLines[0], 1.5, 0.35, 1)

          // Update the glow lines to prevent old lines in front of new ones
          this.glowCenterMeshes[0] = updateGlowCenterCylinderFromLine(this.glowCenterMeshes[0], masterLines[0])
          this.glowCenterMeshes[1] = updateGlowCenterCylinderFromLine(this.glowCenterMeshes[1], masterLines[0])
        }
        // Dots - Use sliceLinesVisible to figure out where to place dots
        // Corners in first / last lines end points

        // Bottom
        let firstLine = _.first(sliceLinesVisible)
        let firstLeft = firstLine.geometry.vertices[0]
        let firstRight = firstLine.geometry.vertices[1]

        // When there is only one line visible, one side dot is move, the other side is resize, and center is move
        if (sliceLinesVisible.length === 1) {
          // this.controlCorners[0].position.copy(firstLeft)
          // this.controlCorners[0].visible = true

          // Add icon that moves instead of rotating
          this.controlSides[0].position.copy(firstLeft)
          this.controlSides[0].visible = true

          this.controlSides[1].position.copy(firstRight)
          this.controlSides[1].visible = true

          this.controlCenter.position.lerpVectors(firstLeft, firstRight, 0.5)
          if (firstLeft.distanceToSquared(firstRight) > 250) {
            this.controlCenter.visible = true
          }

          if (this.shouldShowSignleSliceRotationIcons()) {
            // Show control rotate in center of two side of the slice
            this.controlCorners[0].position.lerpVectors(firstLeft, firstRight, 0.25)
            this.controlCorners[0].visible = true
            this.controlCorners[1].position.lerpVectors(firstLeft, firstRight, 0.75)
            this.controlCorners[1].visible = true
          }
        } else if (sliceLinesVisible.length > 1) {
          // Bottom Corners
          this.controlCorners[0].position.copy(firstLeft)
          this.controlCorners[0].visible = true
          this.controlCorners[1].position.copy(firstRight)
          this.controlCorners[1].visible = true

          // Bottom Middle/side
          if (firstLeft.distanceToSquared(firstRight) > MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT) {
            this.controlSides[0].position.lerpVectors(firstLeft, firstRight, 0.5)
            this.controlSides[0].visible = !this.isAddLocalizerMode() // No Resize in AddLocalizer
          }

          // Top
          let lastLine = _.last(sliceLinesVisible)
          let lastLeft = lastLine.geometry.vertices[0]
          let lastRight = lastLine.geometry.vertices[1]

          // Reverse what is "left" vs "right" - depending
          // Slice line intersection has no concept of left or right, so what is camera left/right for the first slice-line might be the opposite for the last slice line
          // so when the direction between the left/right between first set and last set is reversed, then flip out left/right, so it's the same
          // let firstDir3 = new THREE.Vector3()
          // firstDir3.subVectors(firstLeft, firstRight)
          // let lastDir3 = new THREE.Vector3()
          // lastDir3.subVectors(lastLeft, lastRight)
          // let firstAngle = firstLeft.angleTo(firstRight)
          // let lastAngle = lastLeft.angleTo(lastRight)
          // log.debug('first angle', firstLeft.angleTo(firstRight),'last angle', lastLeft.angleTo(lastRight))
          // // Bug: seems to sometimes misfire, angles vary a bit between lines, which I wouldn't have expected
          // // maybe use .angleTo instead?
          // // if(Math.abs(firstAngle - lastAngle) >= 0.20){
          // if(!vec3allSignsEqual(firstDir3,lastDir3)){
          //   log.debug(' flipping')
          //   // lastLeft = lastLine.geometry.vertices[1]
          //   // lastRight = lastLine.geometry.vertices[0]
          // }

          // Top Corners
          this.controlCorners[2].position.copy(lastLeft)
          this.controlCorners[2].visible = true
          this.controlCorners[3].position.copy(lastRight)
          this.controlCorners[3].visible = true

          // Bottom Middle/side
          if (lastLeft.distanceToSquared(lastRight) > MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT) {
            this.controlSides[1].position.lerpVectors(lastLeft, lastRight, 0.5)
            this.controlSides[1].visible = !this.isAddLocalizerMode() // No Resize in AddLocalizer
          }

          // Top-Bottom Left side
          this.controlSides[2].position.lerpVectors(lastLeft, firstLeft, 0.5)
          let leftSide = this.controlSides[2].position
          if (lastLeft.distanceToSquared(firstLeft) > MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT) {
            this.controlSides[2].visible = !this.isAddLocalizerMode() // No Resize in AddLocalizer
          }

          // Top-Bottom Right side
          this.controlSides[3].position.lerpVectors(lastRight, firstRight, 0.5)
          let rightSide = this.controlSides[3].position
          if (lastRight.distanceToSquared(firstRight) > MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT) {
            this.controlSides[3].visible = !this.isAddLocalizerMode() // No Resize in AddLocalizer
          }

          // Center
          this.controlCenter.position.lerpVectors(leftSide, rightSide, 0.5)
          if (leftSide.distanceToSquared(rightSide) > MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT) {
            this.controlCenter.visible = true
          }
        }
      }

      if (this.controlSides[0].visible && this.controlSides[1].visible && !this.isAddLocalizerMode()) {
        // show perpendicular line
        if (!this.perpendicularLine) {
          this.perpendicularLine = new THREE.Line(
            createLineGeometry(),
            this.getMaterialForSliceLine(this.getIdentType(), false, false)
          )
          this.perpendicularLine.frustumCulled = false
          this.addObjectToScene(this.perpendicularLine)
        }

        setLinePositions(this.perpendicularLine, this.controlSides[0].position, this.controlSides[1].position)
        this.perpendicularLine.visible = true
      } else {
        if (this.perpendicularLine) {
          this.perpendicularLine.visible = false
        }
      }

      // Volume View - outer lines left/right
      if (this.isVolumeViewMode() && _.size(sliceLinesVisible) > 1) {
        if (!this.volumeViewOuterLineLeft) {
          this.volumeViewOuterLineLeft = new THREE.Line(
            createLineGeometry(),
            this.getMaterialForSliceLine(this.getIdentType(), false, false)
          )
          this.volumeViewOuterLineLeft.frustumCulled = false
          this.addObjectToScene(this.volumeViewOuterLineLeft)
        }
        if (!this.volumeViewOuterLineRight) {
          this.volumeViewOuterLineRight = new THREE.Line(
            createLineGeometry(),
            this.getMaterialForSliceLine(this.getIdentType(), false, false)
          )
          this.volumeViewOuterLineRight.frustumCulled = false
          this.addObjectToScene(this.volumeViewOuterLineRight)
        }

        // Left side line
        // No need to displace further, control dots area already displaces
        setLinePositions(this.volumeViewOuterLineLeft, this.controlCorners[0].position, this.controlCorners[2].position)
        this.volumeViewOuterLineLeft.visible = true
        // Right side line
        setLinePositions(
          this.volumeViewOuterLineRight,
          this.controlCorners[1].position,
          this.controlCorners[3].position
        )
        this.volumeViewOuterLineRight.visible = true
      } else {
        if (this.volumeViewOuterLineLeft) {
          this.volumeViewOuterLineLeft.visible = false
        }
        if (this.volumeViewOuterLineRight) {
          this.volumeViewOuterLineRight.visible = false
        }
      }
    }

    this.outlineVisible = this.outline.visible

    // //#region Visible part of slice box
    // // Show the visible part of the slice box
    // // Update 3d box lines
    // if (this.outline.visible && !this.isSingleSliceMode()) {
    //   // this.outline.visible = false
    //   // this.update3DBoxLines()
    //   tmpBackgroundSlicePlane.setFromNormalAndCoplanarPoint(
    //     this.backgroundSlice.planeDirection,
    //     this.backgroundSlice.planePosition
    //   )

    //   const allSegments = [
    //     [_.get(this.outlineCornerPositionsByXYZ, [-1, 1, 1]), _.get(this.outlineCornerPositionsByXYZ, [-1, 1, -1])],
    //     [_.get(this.outlineCornerPositionsByXYZ, [-1, 1, -1]), _.get(this.outlineCornerPositionsByXYZ, [-1, -1, -1])],
    //     [_.get(this.outlineCornerPositionsByXYZ, [-1, -1, -1]), _.get(this.outlineCornerPositionsByXYZ, [-1, -1, 1])],
    //     [_.get(this.outlineCornerPositionsByXYZ, [-1, -1, 1]), _.get(this.outlineCornerPositionsByXYZ, [-1, 1, 1])],

    //     [_.get(this.outlineCornerPositionsByXYZ, [1, 1, 1]), _.get(this.outlineCornerPositionsByXYZ, [1, 1, -1])],
    //     [_.get(this.outlineCornerPositionsByXYZ, [1, 1, -1]), _.get(this.outlineCornerPositionsByXYZ, [1, -1, -1])],
    //     [_.get(this.outlineCornerPositionsByXYZ, [1, -1, -1]), _.get(this.outlineCornerPositionsByXYZ, [1, -1, 1])],
    //     [_.get(this.outlineCornerPositionsByXYZ, [1, -1, 1]), _.get(this.outlineCornerPositionsByXYZ, [1, 1, 1])],

    //     [_.get(this.outlineCornerPositionsByXYZ, [-1, 1, 1]), _.get(this.outlineCornerPositionsByXYZ, [1, 1, 1])],
    //     [_.get(this.outlineCornerPositionsByXYZ, [-1, -1, 1]), _.get(this.outlineCornerPositionsByXYZ, [1, -1, 1])],
    //     [_.get(this.outlineCornerPositionsByXYZ, [-1, 1, -1]), _.get(this.outlineCornerPositionsByXYZ, [1, 1, -1])],
    //     [_.get(this.outlineCornerPositionsByXYZ, [-1, -1, -1]), _.get(this.outlineCornerPositionsByXYZ, [1, -1, -1])],
    //   ]

    //   const isVerticeInFrontOfPlane = (plane, vertice) => {
    //     return plane.distanceToPoint(vertice) > 0
    //   }

    //   const isCameraInFrontOfPlane = isVerticeInFrontOfPlane(tmpBackgroundSlicePlane, this.camera.position)

    //   const displaceTranslate = new THREE.Vector3() //this.centerDisplaced3.clone().sub(this.center3)

    //   let dashedLineIndex = 0
    //   allSegments.forEach((segment) => {
    //     const startPoint = segment[0].clone()
    //     const endPoint = segment[1].clone()

    //     const isStartPointInFrontOfPlane = isVerticeInFrontOfPlane(tmpBackgroundSlicePlane, startPoint)
    //     const isEndPointInFrontOfPlane = isVerticeInFrontOfPlane(tmpBackgroundSlicePlane, endPoint)

    //     if (
    //       isStartPointInFrontOfPlane == isCameraInFrontOfPlane &&
    //       isEndPointInFrontOfPlane == isCameraInFrontOfPlane
    //     ) {
    //       // Both points are in front of the plane, so the line is visible
    //       if (dashedLineIndex >= this.dashedSliceLines.length) {
    //         this.dashedSliceLines[dashedLineIndex] = new THREE.Line(createLineGeometry(), materialDashedLine)
    //         this.addObjectToScene(this.dashedSliceLines[dashedLineIndex])
    //       }
    //       this.dashedSliceLines[dashedLineIndex].geometry.vertices[0].copy(startPoint.clone().add(displaceTranslate))
    //       this.dashedSliceLines[dashedLineIndex].geometry.vertices[1].copy(endPoint.clone().add(displaceTranslate))
    //       this.dashedSliceLines[dashedLineIndex].visible = true
    //       this.dashedSliceLines[dashedLineIndex].geometry.verticesNeedUpdate = true
    //       this.dashedSliceLines[dashedLineIndex].computeLineDistances()

    //       dashedLineIndex++
    //     } else if (
    //       isStartPointInFrontOfPlane == isCameraInFrontOfPlane &&
    //       isEndPointInFrontOfPlane != isCameraInFrontOfPlane
    //     ) {
    //       tmpLine.set(startPoint, endPoint)
    //       tmpBackgroundSlicePlane.intersectLine(tmpLine, tmpIntersectionPoint)
    //       if (tmpIntersectionPoint) {
    //         if (dashedLineIndex >= this.dashedSliceLines.length) {
    //           this.dashedSliceLines[dashedLineIndex] = new THREE.Line(createLineGeometry(), materialDashedLine)
    //           this.addObjectToScene(this.dashedSliceLines[dashedLineIndex])
    //         }
    //         this.dashedSliceLines[dashedLineIndex].geometry.vertices[0].copy(startPoint.clone().add(displaceTranslate))
    //         this.dashedSliceLines[dashedLineIndex].geometry.vertices[1].copy(
    //           tmpIntersectionPoint.clone().add(displaceTranslate)
    //         )
    //         this.dashedSliceLines[dashedLineIndex].visible = true
    //         this.dashedSliceLines[dashedLineIndex].geometry.verticesNeedUpdate = true
    //         this.dashedSliceLines[dashedLineIndex].computeLineDistances()
    //         dashedLineIndex++
    //       }
    //     } else if (
    //       isStartPointInFrontOfPlane != isCameraInFrontOfPlane &&
    //       isEndPointInFrontOfPlane == isCameraInFrontOfPlane
    //     ) {
    //       tmpLine.set(startPoint, endPoint)
    //       tmpBackgroundSlicePlane.intersectLine(tmpLine, tmpIntersectionPoint)
    //       if (tmpIntersectionPoint) {
    //         if (dashedLineIndex >= this.dashedSliceLines.length) {
    //           this.dashedSliceLines[dashedLineIndex] = new THREE.Line(createLineGeometry(), materialDashedLine)
    //           this.addObjectToScene(this.dashedSliceLines[dashedLineIndex])
    //         }
    //         this.dashedSliceLines[dashedLineIndex].geometry.vertices[0].copy(endPoint.clone().add(displaceTranslate))
    //         this.dashedSliceLines[dashedLineIndex].geometry.vertices[1].copy(
    //           tmpIntersectionPoint.clone().add(displaceTranslate)
    //         )
    //         this.dashedSliceLines[dashedLineIndex].visible = true
    //         this.dashedSliceLines[dashedLineIndex].geometry.verticesNeedUpdate = true
    //         this.dashedSliceLines[dashedLineIndex].computeLineDistances()
    //         dashedLineIndex++
    //       }
    //     }
    //   })

    //   console.log('this.outlineCornerPositionsByXYZ', this.outlineCornerPositionsByXYZ)
    // }
    // //#endregion

    //#region Cross section of slice box with plane closest is Z
    // Cardiac region for MR
    // The outline box isn't added to scene, so we need to add slice lines for cardiac region
    if (this.isShowSingleSliceWhenPlaneClosestIsZ() && this.outline.visible && !this.isSingleSliceMode()) {
      this.outline.visible = false
      // Index of outlineLines that we're updating next
      let sliceLineIndex = 0

      tmpDisplacementVector.copy(this.adjustCameraDirection(this.cameraDirection))
      tmpDisplacementVector.multiplyScalar(DISPLACEMENT_AMOUNT * (this.isCameraReversed() ? -1 : 1))

      tmpDisplacementDashedLineVector.copy(this.adjustCameraDirection(this.cameraDirection))
      tmpDisplacementDashedLineVector.multiplyScalar((DISPLACEMENT_AMOUNT - 3) * (this.isCameraReversed() ? -1 : 1))

      let numberOfSlices = 2
      let gapSizeGrid = 2 / (numberOfSlices - 1)
      tmpBackgroundSlicePlane.setFromNormalAndCoplanarPoint(
        this.backgroundSlice.planeDirection,
        this.backgroundSlice.planePosition
      )

      const updateOutlineLinesInAxis = (axis = 'z') => {
        let sliceLinesVisible = []
        // For each desired selection slice
        for (let i = 0; i < numberOfSlices; i++) {
          // Get position of all 4 corners of current slice
          // Z goes from -1 to 1 (so enough gapSize to cover 2 units, usually) - except if there is just one slice, then stick with Z = 0
          let gridPositionInAxis = numberOfSlices === 1 ? 0 : -1 + i * gapSizeGrid
          let pointIndex = 0
          _.each([-1, 1], (j) => {
            _.each([-1, 1], (k) => {
              let x, y, z
              if (axis === 'x') {
                ;[x, y, z] = [gridPositionInAxis, j, k]
              } else if (axis === 'y') {
                ;[x, y, z] = [j, gridPositionInAxis, k]
              } else if (axis === 'z') {
                ;[x, y, z] = [j, k, gridPositionInAxis]
              } else {
                console.error('Bad planeClosest')
                return
              }

              setPositionFromCoordinates(tmpCornerPoints[pointIndex], x, y, z, dimensions3Half, false, this)
              pointIndex++
            })
          })

          // Create SliceLine for current slice's intersection line (which may or may not exist)
          //  if we don't have enough yet
          if (this.outlineLines.length <= sliceLineIndex) {
            let line = new THREE.Line(createLineGeometry(), materialOutline)
            line.frustumCulled = false
            this.outlineLines.push(line)
            this.addObjectToScene(line)
          }

          let outlineLine = this.outlineLines[sliceLineIndex]
          sliceLineIndex++

          // Sets outlineLine to line of where Plane and fourCorners intersect
          let bIntersects = setIntersectionLineFromPlaneAndFourCorners(
            outlineLine,
            tmpBackgroundSlicePlane,
            tmpCornerPoints,
            tmpDisplacementVector,
            true
          )
          if (bIntersects) {
            sliceLinesVisible.push(outlineLine)
          }
        }

        return sliceLinesVisible
      }

      const xLines = updateOutlineLinesInAxis('x')
      const yLines = updateOutlineLinesInAxis('y')
      const zLines = updateOutlineLinesInAxis('z')
      const lineArray = [xLines, yLines, zLines]
      const numOfAxisesHasTwoLine = _.filter(lineArray, (el) => _.size(el) === 2).length
      const allLines = _.flatten(lineArray)
      const totalLines = allLines.length
      let sliceLinesVisible = _.find(lineArray, (el) => _.size(el) > 1)
      let sliceYLinesVisible = yLines

      const expandCornerByProjectionPoints = (corner, center, lineDir, projectionPoints, anotherPoints) => {
        let result = corner.clone()
        let point = corner.clone()
        let distanceFromCenterToLeft = center.distanceTo(result)
        for (let i = 0; i < projectionPoints.length; i++) {
          const pointDir = projectionPoints[i].clone().sub(center).normalize()
          const isPointSameDir = pointDir.angleTo(lineDir) < Number.EPSILON
          const distanceFromCenter = center.distanceTo(projectionPoints[i])
          if (distanceFromCenter > distanceFromCenterToLeft && isPointSameDir) {
            distanceFromCenterToLeft = distanceFromCenter
            result = projectionPoints[i]
            point = anotherPoints[i]
          }
        }

        return {
          corner: result,
          point: point,
        }
      }

      const calcDistanceFromLineToPoint = (line3, point) => {
        const projection = line3.closestPointToPoint(point, false, new THREE.Vector3())
        return projection.distanceTo(point)
      }

      const expandCornerByAnotherPoints = (corner, line3, anotherPoints) => {
        let result = corner.clone()
        let distanceFromLine = calcDistanceFromLineToPoint(line3, result)
        for (let i = 0; i < anotherPoints.length; i++) {
          const distance = calcDistanceFromLineToPoint(line3, anotherPoints[i])
          if (distance > distanceFromLine) {
            distanceFromLine = distance
            result = anotherPoints[i]
          }
        }

        const projection = line3.closestPointToPoint(result, false, new THREE.Vector3())
        const dir = result.clone().sub(projection).normalize()
        const newCorner = corner.clone().addScaledVector(dir, distanceFromLine)

        return newCorner
      }

      if (totalLines > 1 && (numOfAxisesHasTwoLine != 2 || totalLines != 4)) {
        const standardLine = allLines[0]
        let firstLinePointA = standardLine.geometry.vertices[0].clone()
        let firstLinePointB = standardLine.geometry.vertices[1].clone()
        const lineDir = firstLinePointB.clone().sub(firstLinePointA).normalize()
        const centerPoint = firstLinePointA.clone().add(firstLinePointB).multiplyScalar(0.5)
        const lineA = new THREE.Line3(firstLinePointA, firstLinePointB)

        const anotherPoints = _.flatMap(_.range(1, totalLines), (i) => {
          const lineObject = allLines[i]
          const linePointA = lineObject.geometry.vertices[0].clone()
          const linePointB = lineObject.geometry.vertices[1].clone()
          return [linePointA, linePointB]
        })

        let projectionPoints = _.map(anotherPoints, (point) => {
          return lineA.closestPointToPoint(point, false, new THREE.Vector3())
        })

        const firstLinePointAExpandInfo = expandCornerByProjectionPoints(
          firstLinePointA,
          centerPoint,
          lineDir.clone().negate(),
          projectionPoints,
          anotherPoints
        )
        const firstLinePointBExpandInfo = expandCornerByProjectionPoints(
          firstLinePointB,
          centerPoint,
          lineDir,
          projectionPoints,
          anotherPoints
        )
        firstLinePointA = firstLinePointAExpandInfo.corner
        firstLinePointB = firstLinePointBExpandInfo.corner

        const secondLinePointA = expandCornerByAnotherPoints(firstLinePointA, lineA, anotherPoints)
        const secondLinePointB = expandCornerByAnotherPoints(firstLinePointB, lineA, anotherPoints)

        if (secondLinePointA && secondLinePointB) {
          const listVertices = [
            [firstLinePointA, firstLinePointB],
            [secondLinePointA, secondLinePointB],
            [firstLinePointA, secondLinePointA],
            [firstLinePointB, secondLinePointB],
          ]

          const hiddenAllLines = () => {
            this.outlineLines.forEach((line) => {
              line.visible = false
            })
          }
          hiddenAllLines()

          sliceLinesVisible = []
          sliceYLinesVisible = []
          listVertices.forEach((vertices, index) => {
            if (this.outlineLines.length <= index) {
              log.debug(' creating sliceLine for', index)
              let line = new THREE.Line(
                createLineGeometry(),
                this.getMaterialForSliceLine(this.getIdentType(), false, false)
              )
              line.frustumCulled = false

              this.outlineLines.push(line)
              this.addObjectToScene(line)
            }
            this.outlineLines[index].geometry.vertices[0].copy(vertices[0])
            this.outlineLines[index].geometry.vertices[1].copy(vertices[1])
            this.outlineLines[index].geometry.verticesNeedUpdate = true
            this.outlineLines[index].visible = true
            if (index == 0 || index == 1) {
              sliceLinesVisible.push(this.outlineLines[index])
            }
            if (index == 2 || index == 3) {
              sliceYLinesVisible.push(this.outlineLines[index])
            }
          })
        }
      }

      // Handle draw maximum box
      const allCornersOf3dBox = [
        this.outlineCornerPositionsByXYZ[1][1][1],
        this.outlineCornerPositionsByXYZ[1][1][-1],
        this.outlineCornerPositionsByXYZ[1][-1][-1],
        this.outlineCornerPositionsByXYZ[1][-1][1],
        // X=-1 square
        this.outlineCornerPositionsByXYZ[-1][1][1],
        this.outlineCornerPositionsByXYZ[-1][1][-1],
        this.outlineCornerPositionsByXYZ[-1][-1][-1],
        this.outlineCornerPositionsByXYZ[-1][-1][1],
      ]
      const allCornerProjectionPoints = _.map(allCornersOf3dBox, (corner) => {
        return tmpBackgroundSlicePlane.projectPoint(corner, new THREE.Vector3())
      })

      const maximumBoxDir = new THREE.Vector3()
        .crossVectors(tmpBackgroundSlicePlane.normal, this.xDirection3)
        .normalize()
      const sortDir = maximumBoxDir.clone().cross(tmpBackgroundSlicePlane.normal).normalize()
      const sortCorners = _.sortBy(allCornerProjectionPoints, (corner) => {
        return corner.dot(sortDir)
      })

      let firtMaximumXLinePointA = sortCorners[0].clone()
      let firtMaximumXLinePointB = sortCorners[0].clone().addScaledVector(maximumBoxDir, 0.01)
      const centerPoint = new THREE.Vector3()
        .copy(firtMaximumXLinePointA)
        .add(firtMaximumXLinePointB)
        .multiplyScalar(0.5)
      const lineDir = new THREE.Vector3().copy(firtMaximumXLinePointB).sub(firtMaximumXLinePointA).normalize()
      const lineA = new THREE.Line3().set(firtMaximumXLinePointA, firtMaximumXLinePointB)

      let projectionPoints = _.map(allCornerProjectionPoints, (point) => {
        return lineA.closestPointToPoint(point, false, new THREE.Vector3())
      })

      const firstMaximumXLinePointAExpandInfo = expandCornerByProjectionPoints(
        firtMaximumXLinePointA,
        centerPoint,
        lineDir.clone().negate(),
        projectionPoints,
        allCornerProjectionPoints
      )
      const firstMaximumXLinePointBExpandInfo = expandCornerByProjectionPoints(
        firtMaximumXLinePointB,
        centerPoint,
        lineDir,
        projectionPoints,
        allCornerProjectionPoints
      )
      firtMaximumXLinePointA = firstMaximumXLinePointAExpandInfo.corner
      firtMaximumXLinePointB = firstMaximumXLinePointBExpandInfo.corner

      let secondMaximumXLinePointA = expandCornerByAnotherPoints(
        firtMaximumXLinePointA,
        lineA,
        allCornerProjectionPoints
      )
      let secondMaximumXLinePointB = expandCornerByAnotherPoints(
        firtMaximumXLinePointB,
        lineA,
        allCornerProjectionPoints
      )

      if (secondMaximumXLinePointA && secondMaximumXLinePointA) {
        secondMaximumXLinePointA.add(tmpDisplacementDashedLineVector)
        secondMaximumXLinePointB.add(tmpDisplacementDashedLineVector)
        firtMaximumXLinePointA.add(tmpDisplacementDashedLineVector)
        firtMaximumXLinePointB.add(tmpDisplacementDashedLineVector)

        const listVertices = [
          [firtMaximumXLinePointA, firtMaximumXLinePointB],
          [secondMaximumXLinePointA, secondMaximumXLinePointB],
          [firtMaximumXLinePointA, secondMaximumXLinePointA],
          [firtMaximumXLinePointB, secondMaximumXLinePointB],
        ]

        sliceLinesVisible = []
        sliceYLinesVisible = []
        listVertices.forEach((vertices, index) => {
          if (this.dashedSliceLines.length <= index) {
            let line = new THREE.Line(createLineGeometry(), materialDashedLine)
            line.frustumCulled = false
            this.dashedSliceLines.push(line)
            this.addObjectToScene(line)
          }
          this.dashedSliceLines[index].geometry.vertices[0].copy(vertices[0])
          this.dashedSliceLines[index].geometry.vertices[1].copy(vertices[1])
          this.dashedSliceLines[index].geometry.verticesNeedUpdate = true
          this.dashedSliceLines[index].computeLineDistances()
          this.dashedSliceLines[index].visible = true

          if (index == 0 || index == 1) {
            sliceLinesVisible.push(this.dashedSliceLines[index])
          }
          if (index == 2 || index == 3) {
            sliceYLinesVisible.push(this.dashedSliceLines[index])
          }
        })
      }

      const hiddenOversampling = () => {
        if (_.has(this.oversamplingOutlineA, ['visible'])) {
          this.oversamplingOutlineA.visible = false
        }
        if (_.has(this.oversamplingOutlineB, ['visible'])) {
          this.oversamplingOutlineB.visible = this.oversamplingOutlineA.visible
        }
        if (this.oversamplingDotA) {
          this.oversamplingDotA.visible = false
        }
        if (this.oversamplingDotB) {
          this.oversamplingDotB.visible = false
        }
      }

      hiddenOversampling()

      // Oversampling Non-Outline rendering; Figure out the intersections
      // For the Outline view, we only want to render the Oversampling if the group is selected (in planeClosest.z the camera is looking at it like an outline / "top of the stack of paper/slices")
      // if (oversampling > 0 && totalLines == 4 && numOfAxisesHasTwoLine == 2 && !config.isCTLab) {
      //   // the faces of a cube. For each axis there are two faces. One with all the points from that axis all as 1, and other other with them as -1
      //   let faces = [
      //     [
      //       // -X (left)
      //       [-1, 1, -1],
      //       [-1, -1, -1],
      //       [-1, 1, 1],
      //       [-1, -1, 1],
      //     ],
      //     [
      //       // +X
      //       [1, 1, -1],
      //       [1, -1, -1],
      //       [1, 1, 1],
      //       [1, -1, 1],
      //     ],
      //     [
      //       // -Y
      //       [1, -1, -1],
      //       [-1, -1, -1],
      //       [1, -1, 1],
      //       [-1, -1, 1],
      //     ],
      //     [
      //       // +Y
      //       [1, 1, -1],
      //       [-1, 1, -1],
      //       [1, 1, 1],
      //       [-1, 1, 1],
      //     ],
      //     [
      //       // -Z
      //       [1, -1, -1],
      //       [-1, -1, -1],
      //       [1, 1, -1],
      //       [-1, 1, -1],
      //     ],
      //     [
      //       // +Z
      //       [1, -1, 1],
      //       [-1, -1, 1],
      //       [1, 1, 1],
      //       [-1, 1, 1],
      //     ],
      //   ]

      //   let lineIndex = 0
      //   // for both cubes: left/right side
      //   _.each([true, false], (oversamplingLeftSide) => {
      //     _.each(faces, (corners, faceIndex) => {
      //       // 4 corners per face
      //       _.each(corners, ([x, y, z], pointIndex) => {
      //         if (oversamplingLeftSide) {
      //           setPositionFromCoordinates(
      //             tmpCornerPoints[pointIndex],
      //             x === -1 ? -xOversamplingToDem3HalfXRatio : -1,
      //             y,
      //             z,
      //             dimensions3Half,
      //             false,
      //             this
      //           )
      //         } else {
      //           setPositionFromCoordinates(
      //             tmpCornerPoints[pointIndex],
      //             x === 1 ? xOversamplingToDem3HalfXRatio : 1,
      //             y,
      //             z,
      //             dimensions3Half,
      //             false,
      //             this
      //           )
      //         }
      //       })
      //       let curOversamplingLine = this.oversamplingLines[lineIndex]
      //       if (curOversamplingLine) {
      //         // makes line visible if it intersects
      //         let bIntersects = setIntersectionLineFromPlaneAndFourCorners(
      //           curOversamplingLine,
      //           tmpBackgroundSlicePlane,
      //           tmpCornerPoints,
      //           tmpDisplacementVector
      //         )
      //         if (bIntersects) {
      //           // Oversampling dots based on line intersections go from specific cuboid faces per side
      //           // Each face of the cuboid should result in a single sliceLine - if this sliceLine was from the appropriate face of a the cube, put the dot there
      //           let [linePointA, linePointB] = curOversamplingLine.geometry.vertices
      //           if (oversamplingLeftSide) {
      //             if (faceIndex === 0 && !config.isCTLab) {
      //               // -X face
      //               this.oversamplingDotA.position.lerpVectors(linePointA, linePointB, 0.75)
      //               this.oversamplingDotA.visible = true
      //             }
      //           } else {
      //             if (faceIndex === 1 && !config.isCTLab) {
      //               // +X face
      //               this.oversamplingDotB.position.lerpVectors(linePointA, linePointB, 0.75)
      //               this.oversamplingDotB.visible = true
      //             }
      //           }

      //           lineIndex++
      //         }
      //       }
      //     })
      //   })
      // }
      if (oversampling > 0 && xLines.length > 0 && sliceYLinesVisible.length > 1 && !config.isCTLab) {
        const firstLine = sliceYLinesVisible[0]
        const secondLine = sliceYLinesVisible[1]
        const firstLinePointA = firstLine.geometry.vertices[0].clone()
        const firstLinePointB = firstLine.geometry.vertices[1].clone()
        const secondLinePointA = secondLine.geometry.vertices[0].clone()
        const secondLinePointB = secondLine.geometry.vertices[1].clone()
        const firstLineDir = firstLinePointB.clone().sub(firstLinePointA).normalize()
        const secondLineDir = secondLinePointB.clone().sub(secondLinePointA).normalize()

        // Draw oversampling lines left
        const oversamplingLeftPoints = []
        _.each([0, 1], (xCorner) => {
          _.each([0, 1], (yCorner) => {
            if (yCorner == 0) {
              oversamplingLeftPoints.push(
                firstLinePointA
                  .clone()
                  .addScaledVector(firstLineDir.clone().negate(), oversampling * dimensions3Half.x * xCorner)
              )
            } else {
              oversamplingLeftPoints.push(
                secondLinePointA
                  .clone()
                  .addScaledVector(secondLineDir.clone().negate(), oversampling * dimensions3Half.x * xCorner)
              )
            }
          })
        })
        const oversamplingLeftVertices = [
          [oversamplingLeftPoints[0], oversamplingLeftPoints[1]],
          [oversamplingLeftPoints[2], oversamplingLeftPoints[3]],
          [oversamplingLeftPoints[0], oversamplingLeftPoints[2]],
          [oversamplingLeftPoints[1], oversamplingLeftPoints[3]],
        ]
        let lineIndex = 0
        oversamplingLeftVertices.forEach((points, index) => {
          let curOversamplingLine = this.oversamplingLines[lineIndex]
          if (curOversamplingLine) {
            curOversamplingLine.geometry.vertices[0].copy(points[0])
            curOversamplingLine.geometry.vertices[1].copy(points[1])
            curOversamplingLine.geometry.verticesNeedUpdate = true
            curOversamplingLine.visible = true
            lineIndex++
          }

          if (index == 1 && this.oversamplingDotA) {
            this.oversamplingDotA.position.lerpVectors(points[0], points[1], 0.75)
            this.oversamplingDotA.visible = true
          }
        })

        // Draw oversampling lines right
        const oversamplingRightPoints = []
        _.each([0, 1], (xCorner) => {
          _.each([0, 1], (yCorner) => {
            if (yCorner == 0) {
              oversamplingRightPoints.push(
                firstLinePointB.clone().addScaledVector(firstLineDir, oversampling * dimensions3Half.x * xCorner)
              )
            } else {
              oversamplingRightPoints.push(
                secondLinePointB.clone().addScaledVector(secondLineDir, oversampling * dimensions3Half.x * xCorner)
              )
            }
          })
        })
        const oversamplingRightVertices = [
          [oversamplingRightPoints[0], oversamplingRightPoints[1]],
          [oversamplingRightPoints[2], oversamplingRightPoints[3]],
          [oversamplingRightPoints[0], oversamplingRightPoints[2]],
          [oversamplingRightPoints[1], oversamplingRightPoints[3]],
        ]
        oversamplingRightVertices.forEach((points, index) => {
          let curOversamplingLine = this.oversamplingLines[lineIndex]
          if (curOversamplingLine) {
            curOversamplingLine.geometry.vertices[0].copy(points[0])
            curOversamplingLine.geometry.vertices[1].copy(points[1])
            curOversamplingLine.geometry.verticesNeedUpdate = true
            curOversamplingLine.visible = true
            lineIndex++
          }
          if (index == 1 && this.oversamplingDotB) {
            this.oversamplingDotB.position.lerpVectors(points[0], points[1], 0.75)
            this.oversamplingDotB.visible = true
          }
        })
      }

      if (_.size(sliceLinesVisible) >= 1) {
        // Show Outline, means the dots need to be placed on the outline cuboid
        // Hide lines that only show in non-outline mode
        if (this.perpendicularLine) {
          this.perpendicularLine.visible = false
        }
        if (this.volumeViewOuterLineLeft) {
          this.volumeViewOuterLineLeft.visible = false
        }
        if (this.volumeViewOuterLineRight) {
          this.volumeViewOuterLineRight.visible = false
        }

        // Dots - Use sliceLinesVisible to figure out where to place dots
        // Corners in first / last lines end points

        // Bottom
        let firstLine = _.first(sliceLinesVisible)
        let firstLeft = firstLine.geometry.vertices[0]
        let firstRight = firstLine.geometry.vertices[1]

        // When there is only one line visible, one side dot is move, the other side is resize, and center is move
        if (sliceLinesVisible.length === 1) {
          this.controlCorners[0].position.copy(firstLeft)
          this.controlCorners[0].visible = true
          this.controlCorners[1].visible = false
          this.controlCorners[2].visible = false
          this.controlCorners[3].visible = false

          this.controlSides[0].position.copy(firstRight)
          this.controlSides[0].visible = true
          this.controlSides[1].visible = false
          this.controlSides[2].visible = false
          this.controlSides[3].visible = false

          this.controlCenter.position.lerpVectors(firstLeft, firstRight, 0.5)
          if (firstLeft.distanceToSquared(firstRight) > 250) {
            this.controlCenter.visible = true
          }
        } else if (sliceLinesVisible.length > 1) {
          // Bottom Corners
          this.controlCorners[0].position.copy(firstLeft)
          this.controlCorners[0].visible = true
          this.controlCorners[1].position.copy(firstRight)
          this.controlCorners[1].visible = true

          // Bottom Middle/side
          if (firstLeft.distanceToSquared(firstRight) > MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT) {
            this.controlSides[0].position.lerpVectors(firstLeft, firstRight, 0.5)
            this.controlSides[0].visible = !this.isAddLocalizerMode() // No Resize in AddLocalizer
          }

          // Top
          let lastLine = _.last(sliceLinesVisible)
          let lastLeft = lastLine.geometry.vertices[0]
          let lastRight = lastLine.geometry.vertices[1]

          // Top Corners
          this.controlCorners[2].position.copy(lastLeft)
          this.controlCorners[2].visible = true
          this.controlCorners[3].position.copy(lastRight)
          this.controlCorners[3].visible = true

          // Bottom Middle/side
          if (lastLeft.distanceToSquared(lastRight) > MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT) {
            this.controlSides[1].position.lerpVectors(lastLeft, lastRight, 0.5)
            this.controlSides[1].visible = !this.isAddLocalizerMode() // No Resize in AddLocalizer
          }

          // Top-Bottom Left side
          this.controlSides[2].position.lerpVectors(lastLeft, firstLeft, 0.5)
          let leftSide = this.controlSides[2].position
          if (lastLeft.distanceToSquared(firstLeft) > MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT) {
            this.controlSides[2].visible = !this.isAddLocalizerMode() // No Resize in AddLocalizer
          }

          // Top-Bottom Right side
          this.controlSides[3].position.lerpVectors(lastRight, firstRight, 0.5)
          let rightSide = this.controlSides[3].position
          if (lastRight.distanceToSquared(firstRight) > MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT) {
            this.controlSides[3].visible = !this.isAddLocalizerMode() // No Resize in AddLocalizer
          }

          // Center
          this.controlCenter.position.lerpVectors(leftSide, rightSide, 0.5)
          if (leftSide.distanceToSquared(rightSide) > MAX_DISTANCE_BETWEEN_VISIBLE_DOTS_SQRT) {
            this.controlCenter.visible = true
          }
        }
      } else {
        // Hide all control dots
        _.each(this.controlCorners, (corner) => {
          corner.visible = false
        })
        _.each(this.controlSides, (side) => {
          side.visible = false
        })
        this.controlCenter.visible = false
      }
    }
    //#endregion

    this.rotationIndicator1.visible = false
    this.rotationIndicator2.visible = false
    this.rotationIndicator3.visible = false

    // Handle for show dimension indicator
    const isOnMriView = this.$store.state.stackService.isOnMriView
    const questionSet = this.$store.state.questionService.questionSet
    // Only show dimension indicator for reconstruction question and Playground mode
    const isDimensionIndicatorEnabled =
      (this.$store.getters['questionService/isReconstructionQuestion'] || (isOnMriView && !questionSet)) &&
      config.isCTLab

    if (isDimensionIndicatorEnabled) {
      this.drawDimensionIndicator(planeClosest)
    }

    // Handle for show scan zDir indicator
    const sliceDirectionIndicatorEnable = this.$store.getters['questionService/isAcquisitionQuestion'] && config.isCTLab
    if (sliceDirectionIndicatorEnable && (planeClosest.x || planeClosest.y)) {
      let closestSignedWorldAxis3 = getClosestSignedAxis3(this.zDirection3)
      let sideVector = this.yDirection3
      if (!planeClosest.x) {
        sideVector = this.xDirection3
      }
      this.sideLine.set(this.center3, this.center3.clone().addScaledVector(sideVector, 2))
      let clampPoint = new THREE.Vector3()
      let controlSide = _.minBy(_.filter(this.controlSides, 'visible'), (side) => {
        this.sideLine.closestPointToPoint(side.position, false, clampPoint)
        return clampPoint.distanceTo(side.position) + side.position.clone().sub(this.center3).angleTo(sideVector)
      })
      if (controlSide) {
        let controlSidePos = controlSide.position.clone()
        // Translate far center3
        this.sliceEncodingDirectionIndicator.visible = true
        this.sliceEncodingDirectionIndicator.position.copy(controlSidePos)
      }

      // Reference to stackService/createStackConfig
      let destinationDirection = this.zDirection3.clone()
      // Flip Coronal and Sagittal
      if (closestSignedWorldAxis3.y === -1 || closestSignedWorldAxis3.x === -1) {
        destinationDirection = destinationDirection.clone().negate()
      }
      // Rotate zDirection if it has closestSignedWorldAxis3.z != 0
      if (Math.abs(closestSignedWorldAxis3.z) === 1) {
        // zDirectionBias: 1 - Top to bottom
        // closestSignedWorldAxis3.z: -1 - Top to bottom
        // closestSignedWorldAxis3.z / zDirectionBias == 1 when reverse direction
        if (closestSignedWorldAxis3.z / this.currentZDirectionBias() == 1) {
          destinationDirection = destinationDirection.clone().negate()
        }
      }

      // destination is this many units away from where the dot is, on Selection Y Axis
      let destination = this.sliceEncodingDirectionIndicator.position
        .clone()
        .add(destinationDirection.multiplyScalar(18))
      // Look at destination to get cone pointed towards there
      this.sliceEncodingDirectionIndicator.lookAt(destination)
      // except the cone looking at something makes it point 90 degree off, so rotate it on local cone axis so it's proper
      this.sliceEncodingDirectionIndicator.rotateOnAxis(VECTOR3_NORMAL_X, 1.570796) // 90 degrees in radian (Math.PI * 0.5)

      this.sliceEncodingDirectionIndicator.material.color.setHex(0xffff00)

      this.sliceEncodingDirectionIndicator.position.copy(
        this.sliceEncodingDirectionIndicator.position.clone().add(sideVector.clone().multiplyScalar(18))
      )
    }

    // Encoding-direction arrows — MRI only. Hidden every frame, then
    // conditionally shown so only the vendor-appropriate one renders. The
    // physical axis sent to cruncher is independent of this display and is
    // derived from `swapPhase` alone in stackService.js / dicomService.js.
    this.phaseIndicator.visible = false
    this.frequencyIndicator.visible = false

    if (!config.isCTLab && visible && this.controlCenter.visible) {
      const vendor = this.vendorStylePreference()
      if (vendor !== 'ge' && !planeClosest.x) {
        // Non-GE: phase arrow along +xDirection3. Hidden when camera looks
        // along ±X (arrow would foreshorten to nothing).
        this.aimEncodingArrow(this.phaseIndicator, this.xDirection3)
      } else if (vendor === 'ge' && !planeClosest.y) {
        // GE: frequency arrow along -yDirection3. Pre-negate into a pooled
        // temp vector so aimEncodingArrow keeps a single code path.
        this.aimEncodingArrow(this.frequencyIndicator, tmpVec3B.copy(this.yDirection3).negate())
      }
    }

    // For Dots - both on outline, or not on outline
    // put limiting axis on sides, based on them to center
    // this makes it so that when dragging sides, resizing only happens along this axis, directly towards center dot
    _.each(this.controlSides, (side) => {
      if (side.visible) {
        side.__data.axis.subVectors(this.controlCenter.position, side.position)
      }
    })

    if (this.isControlsDisabled()) {
      this.disableControls()
    }

    this.updateDotIconsAndTransparency()

    this.needsRender = true
  }

  drawDimensionIndicator(planeClosest) {
    let distance = (this.dotColorScale() / 1.5) * 25
    //red
    let sideVector = this.yDirection3
    if (!planeClosest.x) {
      sideVector = this.yDirection3.clone().negate()
    }
    let controlSide = null

    if (planeClosest.z) {
      // We re calc the sideVector, since it's not the same as the one we have
      if (this.isSingleSliceMode()) {
        controlSide = this.controlSides[1]
      } else {
        sideVector = this.controlCorners[1].position.clone().sub(this.controlCorners[0].position).negate().normalize()
        controlSide = this.controlSides[2]
      }
    } else if (planeClosest.x) {
      controlSide = this.controlSides[2]
    }

    if (controlSide) {
      let controlSidePos = controlSide.position.clone()
      this.rotationIndicator1.visible = controlSide.visible
      this.rotationIndicator1.position.copy(controlSidePos)
    }

    this.rotationIndicator1.material.color.setHex(0xff0000)

    this.rotationIndicator1.position.copy(
      this.rotationIndicator1.position.clone().add(sideVector.clone().multiplyScalar(distance))
    )

    //blue
    sideVector = this.xDirection3.clone().negate()
    controlSide = null

    if (planeClosest.z) {
      controlSide = this.controlSides[0]
    } else if (planeClosest.y) {
      controlSide = this.controlSides[2]
    }

    if (controlSide) {
      let controlSidePos = controlSide.position.clone()
      this.rotationIndicator2.visible = controlSide.visible
      this.rotationIndicator2.position.copy(controlSidePos)
    }

    this.rotationIndicator2.material.color.setHex(0x0000ff)

    this.rotationIndicator2.position.copy(
      this.rotationIndicator2.position.clone().add(sideVector.clone().multiplyScalar(distance))
    )

    //yellow
    sideVector = this.zDirection3.clone()

    controlSide = planeClosest.x || planeClosest.y ? this.controlSides[1] : null

    if (controlSide) {
      let controlSidePos = controlSide.position.clone()
      this.rotationIndicator3.visible = controlSide.visible
      this.rotationIndicator3.position.copy(controlSidePos)
    }

    this.rotationIndicator3.material.color.setHex(0xffff00)

    this.rotationIndicator3.position.copy(
      this.rotationIndicator3.position.clone().add(sideVector.clone().multiplyScalar(distance))
    )
  }

  disableControls() {
    this.controlCenter.visible = false
    _.each(this.controlCorners, (corner) => {
      corner.visible = false
    })
    _.each(this.controlSides, (side) => {
      side.visible = false
    })
    // this.rotationIndicator1.visible = false
    // this.rotationIndicator2.visible = false
    // this.rotationIndicator3.visible = false
    this.sliceEncodingDirectionIndicator.visible = false
    this.phaseIndicator.visible = false
    this.frequencyIndicator.visible = false

    if (this.oversamplingDotA) {
      this.oversamplingDotA.visible = false
    }
    if (this.oversamplingDotB) {
      this.oversamplingDotB.visible = false
    }
  }

  updateDotIconsAndTransparency() {
    let shouldBeTransparent = this.dotsShouldBeTransparent()
    let cornerDisable =
      (this.$store.getters['questionService/isAcquisitionQuestion'] ||
        this.$store.getters['questionService/isLocalizerQuestion'] ||
        this.$store.state.dicomService.isManageDicomBox) &&
      config.isCTLab

    _.each(this.dotIconObjects, ({ iconObject, dot }) => {
      const isHiddenCorner = dot.__data.type === 'corner' && cornerDisable
      // We never want to make Oversampling dots to be transparent (since they are not in the way, usually)
      let transparent = (shouldBeTransparent && dot.__data.type !== 'oversampling') || isHiddenCorner

      if (dot.visible) {
        // Make dot fully transparent (but still dragable, so not invisible)
        // There are really just a handful of materials shared between all the dots, so it might be possible to optimize this slightly
        dot.material.opacity = transparent ? 0 : 1
        dot.material.transparent = transparent
        dot.visible = !transparent
      } else {
        dot.material.opacity = transparent ? 0 : 1
        dot.material.transparent = false
      }

      iconObject.visible = dot.visible && !transparent
      // console.log('dot ', dot.__data.type, dot.visible, iconObject.visible, transparent)
      if (iconObject.visible) {
        // make it face the camera
        iconObject.quaternion.copy(this.camera.quaternion)
        iconObject.position.copy(dot.position)
        // move icon from top-left of Dot, to on centered on the dot
        iconObject.translateY(-3.7 * this.dotScaleMultiplier())
        iconObject.translateX(-3.7 * this.dotScaleMultiplier())
      }
    })
  }
  addDotDragControls(camera, renderer) {
    // Running the again just no-ops
    if (this.didAddDotDragControls) {
      return
    }
    this.didAddDotDragControls = true
    this.updateGeometries()

    this.controls = new DragControls(this.draggableObjects, camera, renderer.domElement, 'move')
    this.controls.addEventListener('dragstart', dragStartCallback.bind(this))
    this.controls.addEventListener('dragend', dragendCallback.bind(this))
    this.controls.addEventListener('hoveron', hoveronCallback.bind(this))
    this.controls.addEventListener('hoveroff', hoveroffCallback.bind(this))
    // controls.addEventListener('drag', dragCallback.bind(this))

    // Save a reference so we can dispose later
    this.dragControls = this.controls
    const that = this

    function hoveronCallback(event) {
      // Pick an icon based on the Dot type
      let { domElement } = renderer
      let dot = event.object
      let type = _.get(dot, '__data.type')
      that.isHoverDraggableDot = false

      const isIgnoreDot = dot.material.opacity != 0 && !dot.visible
      const allControlsDisabled = this.isControlsDisabled()

      if (allControlsDisabled || isIgnoreDot) {
        domElement.style.cursor = 'default'
        return
      }

      if (type == 'glowCenter') {
        type = 'center'
      }

      let cornerDisable =
        (this.$store.getters['questionService/isAcquisitionQuestion'] ||
          this.$store.getters['questionService/isLocalizerQuestion'] ||
          this.$store.state.dicomService.isManageDicomBox) &&
        config.isCTLab

      if ((type === 'corner' || type === 'glow') && cornerDisable) {
        return
      }

      if ((type === 'corner' || type === 'glow') && !cornerDisable) {
        // https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
        domElement.style.cursor = `url('${Rotate3DVariantIconPng}') 8 8, grab`
      } else if (type === 'side') {
        domElement.style.cursor = `url('${ArrowExpandAllIconPng}') 8 8, nesw-resize`
      } else if (type === 'center') {
        domElement.style.cursor = `url('${CursorMoveIconPng}') 8 8, move`
      } else if (type === 'oversampling') {
        domElement.style.cursor = `url('${ArrowExpandHorizontalIconPng}') 8 8, col-resize`
      }
      that.isHoverDraggableDot = true
    }

    function hoveroffCallback() {
      that.isHoverDraggableDot = false
    }

    let startDragPoint = new THREE.Vector3()

    function dragStartCallback(event) {
      let dot = event.object
      let type = dot.__data.type

      log.debug('dragStart', dot.__data.type, dot.position)
      // dot.__data.dragPrevPosition = dot.position.clone()
      // unselect any tool so it doesn't double up
      //previousTool = this.$store.state.selectionConfig.toolSelected
      let tool = ''
      let toolSelectedConfig = {}

      const isIgnoreDot = dot.material.opacity != 0 && !dot.visible
      const allControlsDisabled = this.isControlsDisabled()

      if (allControlsDisabled || isIgnoreDot) {
        return
      }

      if (type == 'glowCenter') {
        type = 'center'
      }

      let cornerDisable =
        (this.$store.getters['questionService/isAcquisitionQuestion'] ||
          this.$store.getters['questionService/isLocalizerQuestion'] ||
          this.$store.state.dicomService.isManageDicomBox) &&
        config.isCTLab

      if ((type === 'corner' || type === 'glow') && cornerDisable) {
        return
      }

      if ((type === 'corner' || type === 'glow') && !cornerDisable) {
        tool = 'rotate'
      } else if (type === 'side') {
        tool = 'resize'
        toolSelectedConfig = { axis: dot.__data.axis }
      } else if (type === 'center') {
        tool = 'move'
      } else if (type === 'oversampling') {
        tool = 'oversampling'
      }
      if (this.isPressCtrlButton()) {
        EventBus.$emit('clearSelectedSliceViews')
        if (this.groupSelectionConfigs().length > 0) {
          // Clear selected slice views
          this.$store.dispatch('selectionConfig/toggleSelectionConfigToGroup', { ident: this.ident })
        } else {
          // Check if selected selection not in group
          // Add it to group
          if (!this.currentIdentSelectionConfigIsSelected()) {
            this.$store.dispatch('selectionConfig/addSelectionConfigToGroup', {
              ident: this.$store.state.selectionConfig.selectionConfigCurrentIdent,
            })
          }
          this.$store.dispatch('selectionConfig/toggleSelectionConfigToGroup', { ident: this.ident })
        }
      } else {
        if (!this.currentIdentIsSelected() && this.groupSelectionConfigs().length > 0) {
          this.$store.dispatch('selectionConfig/clearGroupSelectionConfigs')
          this.$store.dispatch('selectionConfig/addSelectionConfigToGroup', { ident: this.ident })
        }
      }

      this.$store.dispatch('interactableService/setSelectedInteractableIdent', null)
      this.$store.dispatch('selectionConfig/setSelectionConfigCurrentIdent', { ident: this.ident })
      this.$store.dispatch('selectionConfig/selectTool', { tool, toolSelectedConfig })

      startDragPoint.copy(event.object.position)
    }

    function dragendCallback(event) {
      let dot = event.object
      log.debug('dragEnd', dot.__data.type, event, dot.__data, event)
      const dragDistance = event.object.position.distanceTo(startDragPoint)
      if (this.groupSelectionConfigs().length > 0) {
        /// If the drag distance is less than 2 pixels, this is a click
        if (dragDistance < 2 && this.selectionConfigIsCurrent()) {
          if (!this.isPressCtrlButton()) {
            this.$store.dispatch('selectionConfig/clearGroupSelectionConfigs')
          }
        }
      }

      // Reset signal average when geometry is changed by dragging (position changes affect slice selection)
      if (dragDistance >= 2) {
        this.$store.dispatch('selectionConfig/setSignalAverage', { signalAverage: null, ident: this.ident })
        // Reset bSignalAverages for DIFF sequences
        const selectionConfig = this.getSelectionConfig()
        if (selectionConfig && selectionConfig.sequenceType === 'DIFF') {
          this.$store.dispatch('selectionConfig/setBSignalAverages', { bSignalAverages: [], ident: this.ident })
        }
      }

      // reselect whatever tool we had before using the dot
      // this should alwasy go back to 'Pan'
      //this.$store.dispatch('selectionConfig/selectTool', { tool: previousTool })
      this.$store.dispatch('selectionConfig/selectTool', { tool: 'pan' })
    }
  }

  setIsCamera3D(isCamera3D) {
    this.isCamera3D = isCamera3D
    this.updateGeometries()
  }
  getDimensions3Half() {
    return this.dimensions3.clone().divideScalar(2.0)
  }
}

export default StackVolumeSelection
