// A box in space, made up of 8 points
// each point
import log from 'loglevel'
import * as THREE from 'three'
import _ from 'lodash'
import DragControls from './drag-controls'
import { createLineGeometry } from './misc-util'
import { getClosestSignedAxis3, setIntersectionLineFromPlaneAndFourCorners } from './math-util'

import CursorMoveIconPng from '@/assets/cursors/cursor-move.png'
import Rotate3DVariantIconPng from '@/assets/cursors/rotate-3d-variant.png'
import ArrowExpandAllIconPng from '@/assets/cursors/arrow-expand-all.png'
import ArrowExpandHorizontalIconPng from '@/assets/cursors/arrow-expand-horizontal.png'
import config from '../config'

import { intersect } from 'mathjs'

// let tmpVec3 = new THREE.Vector3()

const DISPLACEMENT_AMOUNT = 300

// TMP variables
// 4 points
let tmpCornerPoints = _.map(_.range(4), function () {
  return new THREE.Vector3()
})
let tmpBackgroundSlicePlane = new THREE.Plane()
let tmpDisplacementVector = new THREE.Vector3()
// let tmpDim3HalfForLocalizerMode = new THREE.Vector3()
//let previousTool = ''

const MATERIAL_LINE = new THREE.LineBasicMaterial({ color: 0x8282ff, depthTest: false })
const MATERIAL_GRID_LINE = new THREE.LineBasicMaterial({ color: 0xffff00, depthTest: false })

// Duplicate from from src/lib/stack-volume-selection.js
function setLinePositions(line, posA, posB) {
  line.geometry.vertices[0].copy(posA)
  line.geometry.vertices[1].copy(posB)
  // displace towards camera (so it's not behind bg slice)
  line.geometry.verticesNeedUpdate = true
}
function createGlowCylinderFromLine(pointA, pointB) {
  let edgeGeometry = new THREE.CylinderBufferGeometry(pointA, pointB)
  let material = new THREE.MeshLambertMaterial({
    color: 0x8282ff,
    opacity: 0,
    transparent: true,
    emissive: 0x8282ff,
  })
  return new THREE.Mesh(edgeGeometry, material)
  // return updateGlowCylinderFromTwoPoints(edge, pointA, pointB)
}
function updateGlowCylinderFromTwoPoints(cylinderMesh, pointA, pointB) {
  cylinderMesh.visible = true
  let length = pointA.distanceTo(pointB)

  // Create a matrix to transform a cylinder to follow the path of the given line
  let orientation = new THREE.Matrix4()
  orientation.lookAt(pointA, pointB, new THREE.Object3D().up)

  orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1))

  // Geometry doesn't need to be updated if the length hasn't changed
  if (Math.floor(length * 100) !== Math.floor(cylinderMesh.geometry.parameters.height * 100)) {
    cylinderMesh.geometry.dispose()
    cylinderMesh.geometry = new THREE.CylinderBufferGeometry(5, 5, length, 4, 1)
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
  return cylinderMesh
}
// TODO extract duplicate code from src/lib/stack-volume-selection.js:27
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

// There is one instance of this per SliceView
class Interactable {
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
    $store,
    type
  ) {
    log.debug('Interactable init', center3, dimensions3)
    this.ident = ident
    // this.selectionConfig = selectionConfig
    this.center3 = center3
    this.dimensions3 = dimensions3 // 'width', 'height', and 'depth'
    this.xDirection3 = xDirection3
    this.yDirection3 = yDirection3
    this.zDirection3 = zDirection3
    this.scene = scene
    this.camera = camera
    this.$store = $store
    this.type = type
    this.setBackgroundSlice(backgroundSlice)
    this.objectsAddedToScene = []
    this.dotIconObjects = [] // the ThreeJS Icons that are over dots to showcase what the dots do

    let geometryDot = this.dotGeometry()
    let materialDot = new THREE.MeshBasicMaterial({ color: 0x82c0ff, depthTest: false, depthFunc: THREE.AlwaysDepth }) // 0x0dee0d
    let materialDot2 = new THREE.MeshBasicMaterial({ color: 0x8282ff, depthFunc: THREE.AlwaysDepth }) // 0x0dee0d
    let materialDot3 = new THREE.MeshBasicMaterial({ color: 0xc082ff, depthFunc: THREE.AlwaysDepth }) // 0x0dee0d

    this.draggableObjects = [] // flat list of just the objects
    this.controlCorners = []
    this.controlSides = []
    this.hiddenPoints = []
    this.draggableLines = []

    this.gridLines = new THREE.Group()

    // Corners
    _.each(_.range(2), () => {
      let dot = new THREE.Mesh(geometryDot, materialDot.clone())
      dot.renderOrder = 2
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
        type: 'hidden',
      }

      this.hiddenPoints.push(dot)
    })

    _.each(_.range(2), () => {
      let newLine = createGlowCylinderFromLine([new THREE.Vector3(), new THREE.Vector3()])
      newLine.__data = { type: 'lineResize' }
      this.draggableLines.push(newLine)
      this.draggableObjects.push(newLine)
    })

    _.each(_.range(4), () => {
      let dot = new THREE.Mesh(geometryDot, materialDot2)
      dot.__data = {
        // index: null, // {x, y, z}
        axis: new THREE.Vector3(),
        type: 'side',
      }

      this.controlSides.push(dot)
      this.draggableObjects.push(dot)
      // this.addIconToDot('ArrowExpandAllIcon', dot)
    })

    // Center
    this.controlCenter = new THREE.Mesh(geometryDot, materialDot3)
    this.controlCenter.__data = {
      type: 'center',
    }
    this.controlCenter.renderOrder = 2
    this.draggableObjects.push(this.controlCenter)
    this.addIconToDot('CursorMoveIcon', this.controlCenter)

    _.each(this.draggableObjects, (obj) => {
      this.addObjectToScene(obj)
    })

    this.addObjectToScene(this.gridLines)

    // get created on the fly, since we don't know how many we'll need ahead of time
    // The are named this way from stack-volume-selection; they are more intersectionLines here, not renaming yet since not sure how best to refactor all this yet
    this.sliceLines = []
  }

  refreshDotSize() {
    let iconScale = this.dotIconScale()
    let geometryDot = this.dotGeometry()

    _.each(this.dotIconObjects, ({ dot, iconObject }) => {
      dot.geometry = geometryDot
      iconObject.scale.set(iconScale, iconScale, iconScale)
    })
  }

  addIconToDot(iconName, dot) {
    this.$store.dispatch('threeJSSVGProvider/createInstance', {
      svgName: iconName,
      renderOrder: 3, // render above everything else, with a sort of z-order of 1
      callback: (iconObject) => {
        let iconScale = this.dotIconScale() // they get larger if the dots are larger
        iconObject.scale.set(iconScale, iconScale, iconScale)
        this.dotIconObjects.push({ iconObject, dot })
        this.addObjectToScene(iconObject)
      },
    })
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

  dotIconScale() {
    return this.dotScaleMultiplier() * 0.3
  }

  isAddLocalizerMode() {
    return this.$store.state.selectionConfig.isAddLocalizerMode
  }

  dotScaleMultiplier() {
    return 2
  }
  dotsShouldBeTransparent() {
    return this.$store.getters['selectionConfig/dotsShouldBeTransparent']
  }
  dotGeometry() {
    return this.$store.getters['selectionConfig/curDotGeometry']
  }
  getControlCenterPosition() {
    return this.controlCenter.position
  }

  // Use this to keep track of which objects this instance added to the scene, so they can be removed when this instance is
  addObjectToScene(obj) {
    this.objectsAddedToScene.push(obj)
    this.scene.add(obj)
  }

  setBackgroundSlice(backgroundSlice) {
    this.backgroundSlice = backgroundSlice
    // cameraDirection - direction of slice / camera (or opposite?)
    this.cameraDirection = this.backgroundSlice.planeDirection

    if (config.isCTLab) {
      this.adjustCameraDirection(this.cameraDirection)
    }
  }

  getInteractableState() {
    let state = this.$store.state.interactableService.interactableStateByIdent[this.ident]
    if (!state) {
      // Just a warning to work around mostly just src/components/FullscreenSlice.vue:5 ?
      console.warn('No interactableStateByIdent for: ' + this.ident)
    }
    return state
  }

  getVisibleSatbandRect() {
    return this.$store.state.satBandService.visibleSatBandRect
  }

  isSatbandVisible() {
    return !this.isAddLocalizerMode() && this.getVisibleSatbandRect()
  }

  isSatbandDisabled() {
    return (
      this.$store.state.questionService.hasAnsweredAllStackQuestions ||
      !this.isSatbandVisible() ||
      this.$store.getters['questionService/isAnsweredCurrentQuestion']
    )
  }

  updateGeometries() {
    if (!this.getInteractableState()) {
      return
    }

    this.gridLines.remove(...this.gridLines.children)
    let visible = this.isSatbandVisible()

    let dimensions3Half = this.getDimensions3Half()

    // Dots - first hide them all
    this.controlCenter.visible = false
    _.each(this.controlCorners, function (dot) {
      dot.visible = false
    })
    _.each(this.controlSides, function (dot) {
      dot.visible = false
    })
    _.each(this.hiddenPoints, function (dot) {
      dot.visible = false
    })
    _.each(this.draggableLines, function (dot) {
      dot.visible = false
    })

    // All slice lines default to hidden
    _.each(this.sliceLines, function (line) {
      line.visible = false
    })

    // center displacement happens for Orth 2d Camera, so that all of Selection Cuboid is visible even if it the slice is in the middle of it
    this.centerDisplaced3 = this.centerDisplaced3 ? this.centerDisplaced3.copy(this.center3) : this.center3.clone()
    this.centerDisplaced3.add(
      this.adjustCameraDirection(this.cameraDirection)
        .clone()
        .multiplyScalar(DISPLACEMENT_AMOUNT * (this.isCameraReversed() ? -1 : 1))
    )

    tmpDisplacementVector.copy(this.adjustCameraDirection(this.cameraDirection))
    tmpDisplacementVector.multiplyScalar(DISPLACEMENT_AMOUNT * (this.isCameraReversed() ? -1 : 1))

    // Get only slice lines that intersect with our tmpBackgroundSlicePlane (and where)
    let numberOfSlices = 2
    let gapSizeGrid = 2 // to go 0...2 // slice center to slice center

    tmpBackgroundSlicePlane.setFromNormalAndCoplanarPoint(
      this.backgroundSlice.planeDirection,
      this.backgroundSlice.planePosition
    )

    // Index of sliceLines that we're updating next
    let sliceLineIndex = 0

    // This is copypasta from stack-volume-selection.js
    const updateSliceLinesInAxis = (axis = 'z') => {
      let sliceLinesVisible = []

      // For each desired selection slice
      for (let i = 0; i < numberOfSlices; i++) {
        // log.debug(' slice', i)
        if (visible) {
          // && !planeClosest[axis]
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

              // Slice Previews should span throughout full selection cuboid, so use the dimensions3Half of that as-is
              // log.info('x y z', x, y, z, dimensions3Half)
              setPositionFromCoordinates(tmpCornerPoints[pointIndex], x, y, z, dimensions3Half, false, this)

              pointIndex++
            })
          })

          // Create SliceLine for current slice's intersection line (which may or may not exist)
          //  if we don't have enough yet
          if (this.sliceLines.length <= sliceLineIndex) {
            log.debug(' creating sliceLine for', sliceLineIndex)
            let line = new THREE.Line(createLineGeometry(), MATERIAL_LINE)
            line.renderOrder = 2

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

      return sliceLinesVisible
    }
    const zLines = updateSliceLinesInAxis('z')
    const yLines = updateSliceLinesInAxis('y')
    const xLines = updateSliceLinesInAxis('x')

    const lineByAxis = [zLines, yLines, xLines]
    const sliceLinesVisible = _.maxBy(lineByAxis, (lines) => lines.length)
    // Position dots
    if (sliceLinesVisible.length > 0) {
      let firstLine = _.first(sliceLinesVisible)
      let firstLeft = firstLine.geometry.vertices[0]
      let firstRight = firstLine.geometry.vertices[1]

      //this.controlCenter.position.lerpVectors(firstLeft, firstRight, 0.5)

      // Center dot is visible as long as we have some intersection line
      this.controlCenter.visible = true

      this.hiddenPoints[0].position.lerpVectors(firstLeft, firstRight, 0.4)
      this.hiddenPoints[1].position.lerpVectors(firstLeft, firstRight, 0.6)
      // updateGlowCylinderFromTwoPoints(this.draggableLines[2], firstLeft, this.hiddenPoints[0].position)
      // this.draggableLines[2].visible = true
      // updateGlowCylinderFromTwoPoints(this.draggableLines[3], this.hiddenPoints[1].position, firstRight)
      // this.draggableLines[3].visible = true
      if (sliceLinesVisible.length > 1) {
        let lastLine = sliceLinesVisible[1]
        let lastLeft = lastLine.geometry.vertices[0]
        let lastRight = lastLine.geometry.vertices[1]

        // place sides between corners
        let cornerPoints = [firstLeft, firstRight, lastRight, lastLeft]
        _.each(cornerPoints, (cornerPointCur, i) => {
          let cornerPointNext = cornerPoints[(i + 1) % cornerPoints.length]
          this.controlSides[i].position.lerpVectors(cornerPointCur, cornerPointNext, 0.5)
          // this.controlSides[i].visible = true
        })
        this.hiddenPoints[2].position.lerpVectors(lastRight, lastLeft, 0.4)
        this.hiddenPoints[3].position.lerpVectors(lastRight, lastLeft, 0.6)

        updateGlowCylinderFromTwoPoints(this.draggableLines[0], firstLeft, firstRight)
        this.draggableLines[0].visible = true
        updateGlowCylinderFromTwoPoints(this.draggableLines[1], lastLeft, lastRight)
        this.draggableLines[1].visible = true

        // Draw net
        const deflection = 0.1
        const distance = 10
        const maxDistance = Math.max(firstLeft.distanceTo(firstRight), lastLeft.distanceTo(lastRight))
        const numOfGrid = Math.floor((maxDistance * (1 + deflection)) / distance / 1.5)

        for (let i = 0; i < numOfGrid; i++) {
          const offsetForDeflection = -deflection + ((i + 1) / numOfGrid) * deflection

          let startPoint = new THREE.Vector3().lerpVectors(firstLeft, firstRight, i / numOfGrid + offsetForDeflection)
          let endPoint = new THREE.Vector3().lerpVectors(
            lastLeft,
            lastRight,
            deflection + i / numOfGrid + offsetForDeflection
          )

          if (i / numOfGrid + offsetForDeflection < 0) {
            const intersect = this.intersectLineSegments3D(startPoint, endPoint, firstLeft, lastLeft)
            if (intersect) {
              this.createGridLineFromTo(this.gridLines, intersect, endPoint)
            }
          } else if (deflection + i / numOfGrid + offsetForDeflection < 1) {
            this.createGridLineFromTo(this.gridLines, startPoint, endPoint)
          } else {
            const intersect = this.intersectLineSegments3D(startPoint, endPoint, firstRight, lastRight)
            if (intersect) {
              this.createGridLineFromTo(this.gridLines, startPoint, intersect)
            }
          }

          startPoint = new THREE.Vector3().lerpVectors(lastLeft, lastRight, i / numOfGrid + offsetForDeflection)
          endPoint = new THREE.Vector3().lerpVectors(
            firstLeft,
            firstRight,
            deflection + i / numOfGrid + offsetForDeflection
          )

          if (i / numOfGrid + offsetForDeflection < 0) {
            const intersect = this.intersectLineSegments3D(startPoint, endPoint, firstLeft, lastLeft)
            if (intersect) {
              this.createGridLineFromTo(this.gridLines, intersect, endPoint)
            }
          } else if (deflection + i / numOfGrid + offsetForDeflection < 1) {
            this.createGridLineFromTo(this.gridLines, endPoint, startPoint)
          } else {
            const intersect = this.intersectLineSegments3D(startPoint, endPoint, firstRight, lastRight)
            if (intersect) {
              this.createGridLineFromTo(this.gridLines, startPoint, intersect)
            }
          }
        }

        // updateGlowCylinderFromTwoPoints(this.draggableLines[4], lastLeft, this.hiddenPoints[2].position)
        // this.draggableLines[4].visible = true
        // updateGlowCylinderFromTwoPoints(this.draggableLines[5], this.hiddenPoints[3].position, lastRight)
        // this.draggableLines[5].visible = true
        // Place center dot into the center of all corners. by averaging them
        let meanX = _.meanBy(cornerPoints, 'x')
        let meanY = _.meanBy(cornerPoints, 'y')
        let meanZ = _.meanBy(cornerPoints, 'z')
        this.controlCenter.position.set(meanX, meanY, meanZ)
        this.controlCorners[0].position.lerpVectors(this.controlSides[1].position, this.controlCenter.position, 0.8)
        this.controlCorners[0].visible = true
        this.controlCorners[1].position.lerpVectors(this.controlSides[3].position, this.controlCenter.position, 0.8)
        this.controlCorners[1].visible = true

        // put limiting axis on sides, based on them to center
        // this makes it so that when dragging sides, resizing only happens along this axis, directly towards center dot
        _.each(this.controlSides, (side) => {
          side.__data.axis.subVectors(this.controlCenter.position, side.position)
        })
        this.draggableLines[0].__data.axis = this.controlSides[0].__data.axis
        this.draggableLines[1].__data.axis = this.controlSides[2].__data.axis
      } else {
        // if there is only one intersection line, be in the middle of that
        this.controlCenter.position.lerpVectors(firstLeft, firstRight, 0.5)
        this.controlCorners[0].position.lerpVectors(firstLeft, this.controlCenter.position, 0.6)
        this.controlCorners[0].visible = true
        this.controlCorners[1].position.lerpVectors(firstRight, this.controlCenter.position, 0.6)
        this.controlCorners[1].visible = true
      }
    }

    // perpendicular line from sides across center
    if (this.controlSides[1].visible && this.controlSides[3].visible) {
      // show perpendicular line
      if (!this.perpendicularLine) {
        this.perpendicularLine = new THREE.Line(createLineGeometry(), MATERIAL_LINE)
        this.addObjectToScene(this.perpendicularLine)
      }

      setLinePositions(this.perpendicularLine, this.controlSides[1].position, this.controlSides[3].position)
      this.perpendicularLine.visible = true
    } else {
      if (this.perpendicularLine) {
        this.perpendicularLine.visible = false
      }
    }

    if (this.isSatbandDisabled()) {
      this.disableControls()
    }

    this.updateDotIconsAndTransparency()
  }
  disableControls() {
    this.controlCenter.visible = false
    _.each(this.controlCorners, (corner) => {
      corner.visible = false
    })
    _.each(this.controlSides, (side) => {
      side.visible = false
    })
    _.each(this.hiddenPoints, function (dot) {
      dot.visible = false
    })
    _.each(this.draggableLines, function (dot) {
      dot.visible = false
    })
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
  createGridLineFromTo(lines, from, to) {
    let line = new THREE.Line(createLineGeometry(), MATERIAL_GRID_LINE)
    line.geometry.vertices = [from, to]
    line.renderOrder = 1
    lines.add(line)
  }
  updateDotIconsAndTransparency() {
    _.each(this.dotIconObjects, ({ iconObject, dot }) => {
      // We never want to make Oversampling dots to be transparent (since they are not in the way, usually)
      let transparent = false

      if (dot.visible) {
        // Make dot fully transparent (but still dragable, so not invisible)
        // There are really just a handful of materials shared between all the dots, so it might be possible to optimize this slightly
        dot.material.opacity = transparent ? 0 : 1
        dot.material.transparent = transparent
      } else {
        dot.material.opacity = 1
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

  // Camera is looking from other side of image
  // Keep this in sync with src/components/SliceView.vue#isCameraReversed
  isCameraReversed() {
    let dirAbs = _.mapValues(this.adjustCameraDirection(this.cameraDirection), Math.abs)
    return dirAbs.y >= dirAbs.x && dirAbs.y >= dirAbs.z
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

  // TODO extract out duplicate code?
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
    // controls.addEventListener('drag', dragCallback.bind(this))

    function hoveronCallback(event) {
      // Pick an icon based on the Dot type
      let { domElement } = renderer
      let dot = event.object
      let type = _.get(dot, '__data.type')

      if (this.isSatbandDisabled()) {
        domElement.style.cursor = 'default'
        return
      }

      if (type === 'corner') {
        // https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
        domElement.style.cursor = `url('${Rotate3DVariantIconPng}') 8 8, grab`
      } else if (type === 'side' || type === 'lineResize') {
        domElement.style.cursor = `url('${ArrowExpandAllIconPng}') 8 8, nesw-resize`
      } else if (type === 'center') {
        domElement.style.cursor = `url('${CursorMoveIconPng}') 8 8, move`
      } else if (type === 'oversampling') {
        domElement.style.cursor = `url('${ArrowExpandHorizontalIconPng}') 8 8, col-resize`
      }
    }

    function dragStartCallback(event) {
      let dot = event.object
      let type = dot.__data.type

      if (this.isSatbandDisabled()) {
        return
      }

      log.debug('dragStart', dot.__data.type, dot.position)
      // dot.__data.dragPrevPosition = dot.position.clone()
      // unselect any tool so it doesn't double up
      //previousTool = this.$store.state.selectionConfig.toolSelected
      let tool = ''
      let toolSelectedConfig = {}
      if (type === 'corner') {
        tool = 'rotate'
      } else if (type === 'side' || type === 'lineResize') {
        tool = 'resize'
        toolSelectedConfig = { axis: dot.__data.axis }
      } else if (type === 'center') {
        tool = 'move'
      } else if (type === 'oversampling') {
        tool = 'oversampling'
      }
      this.$store.dispatch('interactableService/setSelectedInteractableIdent', this.ident) // Different than other copy of this code
      this.$store.dispatch('selectionConfig/selectTool', { tool, toolSelectedConfig })

      // startColor = event.object.material.color.getHex();
      // event.object.material.color.setHex(0x000000);
    }

    function dragendCallback(event) {
      let dot = event.object
      log.debug('dragEnd', dot.__data.type, event, dot.__data, event)
      // reselect whatever tool we had before using the dot
      // this should alwasy go back to 'Pan'
      //this.$store.dispatch('selectionConfig/selectTool', { tool: previousTool })
      this.$store.dispatch('selectionConfig/selectTool', { tool: 'pan' })
    }
  }

  getDimensions3Half() {
    return this.dimensions3.clone().divideScalar(2.0)
  }
}

export default Interactable
