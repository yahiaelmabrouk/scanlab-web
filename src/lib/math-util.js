// Initially From: https://stackoverflow.com/a/38437831
import * as THREE from 'three'
import _ from 'lodash'
import log from 'loglevel'
/*

Algorithm taken from http://geomalgorithms.com/a05-_intersect-1.html. See the
section 'Intersection of 2 Planes' and specifically the subsection
(A) Direct Linear Equation

*/

const RADIAN_180_DEG = Math.PI
const RADIAN_90_DEG = Math.PI * 0.5

function intersectPlanes(p1, p2) {
  // the cross product gives us the direction of the line at the intersection
  // of the two planes, and gives us an easy way to check if the two planes
  // are parallel - the cross product will have zero magnitude
  let direction = new THREE.Vector3().crossVectors(p1.normal, p2.normal)
  let magnitude = direction.distanceTo(new THREE.Vector3(0, 0, 0))
  if (magnitude === 0) {
    return null
  }

  // now find a point on the intersection. We use the 'Direct Linear Equation'
  // method described in the linked page, and we choose which coordinate
  // to set as zero by seeing which has the largest absolute value in the
  // directional vector

  let X = Math.abs(direction.x)
  let Y = Math.abs(direction.y)
  let Z = Math.abs(direction.z)

  let point

  if (Z >= X && Z >= Y) {
    point = solveIntersectingPoint('z', 'x', 'y', p1, p2)
  } else if (Y >= Z && Y >= X) {
    point = solveIntersectingPoint('y', 'z', 'x', p1, p2)
  } else {
    point = solveIntersectingPoint('x', 'y', 'z', p1, p2)
  }

  return [point, direction]
}

/*

This method helps finding a point on the intersection between two planes.
Depending on the orientation of the planes, the problem could solve for the
zero point on either the x, y or z axis

*/
function solveIntersectingPoint(zeroCoord, A, B, p1, p2) {
  let a1 = p1.normal[A]
  let b1 = p1.normal[B]
  let d1 = p1.constant

  let a2 = p2.normal[A]
  let b2 = p2.normal[B]
  let d2 = p2.constant

  let A0 = (b2 * d1 - b1 * d2) / (a1 * b2 - a2 * b1)
  let B0 = (a1 * d2 - a2 * d1) / (a1 * b2 - a2 * b1)

  let point = new THREE.Vector3()
  point[zeroCoord] = 0
  point[A] = A0
  point[B] = B0

  return point
}

function clamp(val, min, max) {
  if (val < min) {
    return min
  } else if (val > max) {
    return max
  } else {
    return val
  }
}

function getSignedAngleBetween(vecA, vecB, vecNormal) {
  // https://stackoverflow.com/questions/5188561/signed-angle-between-two-3d-vectors-with-same-origin-within-the-same-plane

  // let angle = 2 * Math.acos(Math.abs(vecA.dot(vecB)))
  // let cross = vecA.clone().cross(vecB)
  // let dotProduct = vecNormal.dot(cross)
  // if (dotProduct < 0) {
  //   angle *= -1
  // }
  // log.debug('angle', angle, vecA, vecB, vecNormal)
  // return angle

  // left handed: atan2((Vb x Va) . Vn, Va . Vb)
  // return Math.atan2(vecB.clone().cross(vecA).dot(vecNormal), vecA.clone().dot(vecB))
  // right handed: atan2((Va x Vb) . Vn, Va . Vb)
  // console.log('getSigned A',vecA.x,vecA.y,vecA.z)
  // console.log('getSigned B',vecB.x,vecB.y,vecB.z)
  // console.log('getSigned d',vecB.x - vecA.x,vecB.y - vecA.y,vecB.z - vecA.z)
  // console.log('getSigned N',vecNormal.x,vecNormal.y,vecNormal.z)
  let output = Math.atan2(vecA.clone().cross(vecB).dot(vecNormal), vecA.clone().dot(vecB))
  return output
}

// are the X/Y/Z of both of the vector3s equal to each other in signage? + / 0 / -
function vec3allSignsEqual(a3, b3) {
  return (
    Math.sign(a3.x) === Math.sign(b3.x) && Math.sign(a3.y) === Math.sign(b3.y) && Math.sign(a3.z) === Math.sign(b3.z)
  )
}

// https://github.com/mrdoob/three.js/issues/78
// Could be used to figure out X/Y to place HTML over 3D canvas? For perhaps icons over dots or such
// function vec3ToScreenXY(vec3,camera,width,height) {
//   let widthHalf = (width/2);
//   let heightHalf = (height/2);
//   let out = vec3.clone().project(camera);
//   out.x = ( out.x * widthHalf ) + widthHalf;
//   out.y = - ( out.y * heightHalf ) + heightHalf;
//   return out;
// }

// var planeA = new THREE.Plane((new THREE.Vector3(0, 0, 1)).normalize(), 100)
// var planeB = new THREE.Plane((new THREE.Vector3(1, 1, 1)).normalize(), -100)
//
// var [point, direction] = intersectPlanes(planeA, planeB)

// Just go by the sign of them / roughly same direction (good if we know it's either facing one way or exactly the other only)
function areVectorsSameDirSigns(a3, b3) {
  return _.every(['x', 'y', 'z'], function (axis) {
    return Math.sign(a3[axis]) === Math.sign(b3[axis])
  })
}

let tmp3Projection = new THREE.Vector3()
// Selection A is supposed to be inside B; this gets how much that's not the case on axis3
// // Assuming Selections/boxes are axis-aligned to each other (because the math seems to get crazy otherwise)
// //  this should be pretty close, if it isn't, we already ding for being off on the angle
// // dirByAxis = {x: xDirection3, y: yDirection3, z: zDirection3}
// Returns how much A is outside of B per axis: {x: 0, y: 3.4, z: 5.6} (no less than 0)
function getSelectionOutsideAmountByAxis(dirByAxis, aCenter3, aDimension3, bCenter3, bDimension3) {
  // get diff3 between two box's center3s - we don't care where they are in space, just related to each other
  let diffCenterWorld3 = aCenter3.clone().sub(bCenter3)

  let wrongAmountByAxis = _.mapValues(dirByAxis, function (dirAxis, axis) {
    // project world diff3 onto current axis
    tmp3Projection.copy(diffCenterWorld3)
    tmp3Projection.projectOnVector(dirByAxis[axis])

    // This is the correct center difference, but we lost direction (regained below)
    let projectedLength = tmp3Projection.length()

    // dividing the projected (onto dir3) Vector by its length should give us either the dir3 or the opposite
    //   use this to figure out the scalar direction
    let dir3Diff = tmp3Projection.clone().divideScalar(projectedLength)
    let direction = areVectorsSameDirSigns(dir3Diff, dirByAxis[axis]) ? 1 : -1

    // B center compared to A center, with direction
    let diffCenterScalar = projectedLength * direction

    // console.log('a',aCenter3.x, aCenter3.y, aCenter3.z, 'b',bCenter3.x, bCenter3.y, bCenter3.z, 'diffCenterX', diffCenterWorld3.x, diffCenterScalar)

    // X
    let aRadius = aDimension3[axis] * 0.5
    let bRadius = bDimension3[axis] * 0.5

    let offAmount = 0

    let aRight = aRadius
    let bRight = diffCenterScalar + bRadius
    let diffRight = aRight - bRight
    if (diffRight > 0) {
      offAmount += diffRight
    }

    let aLeft = -aRadius
    let bLeft = diffCenterScalar - bRadius
    let diffLeft = bLeft - aLeft
    if (diffLeft > 0) {
      offAmount += diffLeft
    }
    // console.log('diffRight',diffRight, 'diffLeft', diffLeft, 'offAmount', offAmount)
    return offAmount
  })

  return wrongAmountByAxis
}

// const PI_HALF = Math.PI * 0.5

// Assuming Selections/boxes are axis-aligned to each other (because the math seems to get crazy otherwise)
//  this should be pretty close, if it isn't, we already ding for being off on the angle
// dirByAxis = {x: xDirection3, y: yDirection3, z: zDirection3}
function getSelectionAIsInsideB(dirByAxis, aCenter3, aDimension3, bCenter3, bDimension3) {
  let wrongAmountByAxis = getSelectionOutsideAmountByAxis(dirByAxis, aCenter3, aDimension3, bCenter3, bDimension3)
  return _.sum(_.map(wrongAmountByAxis))
}

function radiansToDegrees(radians) {
  return radians * (180 / Math.PI)
}

// given a number and an ascending list of numbers, get the smallest value from the list that is bigger than the input
function floorWithBracket(input, bracketArray) {
  let floored = Math.floor(input)
  for (const num of bracketArray) {
    if (num >= floored) {
      return num
    }
  }
  return _.last(bracketArray)
}

// returns 'x' / 'y' / 'z' based on abs val of what's passed in
function greatestAxisAbsXYZ(x, y, z) {
  let greatestDir = 'x'
  let directionX = Math.abs(x)
  let directionY = Math.abs(y)
  let directionZ = Math.abs(z)
  if (directionY > directionX && directionY > directionZ) {
    greatestDir = 'y'
  } else if (directionZ > directionX && directionZ > directionY) {
    greatestDir = 'z'
  }
  return greatestDir
}

const SIGNED_VECTOR3_AXIS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
]

function getClosestSignedAxis3(dir3Input) {
  return _.minBy(SIGNED_VECTOR3_AXIS, (dir3) => {
    return dir3.distanceToSquared(dir3Input)
  })
}

let tmpIntersectPoint = new THREE.Vector3()
let tmpIntersectorLine = new THREE.Line3()

// Where does a Plane and FourCorners of a Slice intersect? It should be a line or nowhere
// Sets location and visibility of line based on result
// Returns true if there was a line intersection
// Corners of rectangle must be in specific order
function setIntersectionLineFromPlaneAndFourCorners(
  outputLine,
  plane,
  fourCorners,
  displacementVector,
  isVislibleLineInPlane = false
) {
  let countIntersectPoints = 0
  let isShowVisibleLine = false

  const isAllPointsInPlane = _.every(fourCorners, (corner) => {
    return Math.abs(plane.distanceToPoint(corner)) < Number.EPSILON
  })

  // draw 4 lines between the 4 corners and see where that intersects the tmpBackgroundSlicePlane
  // 0-1,1-3,3-2,2-0
  // with the point generation above, it works out that connecting the points in this way draws all 4 sides of the selection slice
  _.each(
    [
      [0, 1],
      [1, 3],
      [3, 2],
      [2, 0],
    ],
    ([iPoint, jPoint]) => {
      // log.debug(' line',[iPoint, jPoint], tmpCornerPoints[iPoint], tmpCornerPoints[jPoint])
      tmpIntersectorLine.set(fourCorners[iPoint], fourCorners[jPoint])
      // sets result into tmpIntersectPoint
      let bIntersects = plane.intersectLine(tmpIntersectorLine, tmpIntersectPoint)
      if (bIntersects) {
        // log.debug('INTERSECTS',tmpIntersectPoint.x,tmpIntersectPoint.y,tmpIntersectPoint.z)
        // curIntersectPoints.push(tmpIntersectPoint.clone())
        // first intersection point goes into vertices[0], second into vertices[1] (there are two for a line)
        let sliceLineVertex = outputLine.geometry.vertices[countIntersectPoints]
        // The line is in plane
        if (
          isVislibleLineInPlane &&
          !isAllPointsInPlane &&
          Math.abs(plane.distanceToPoint(tmpIntersectorLine.start)) < Number.EPSILON &&
          Math.abs(plane.distanceToPoint(tmpIntersectorLine.end)) < Number.EPSILON
        ) {
          const arrayPoints = [fourCorners[iPoint], fourCorners[jPoint]]
          ;[0, 1].forEach((index) => {
            let sliceLineVertex = outputLine.geometry.vertices[index]
            if (sliceLineVertex) {
              sliceLineVertex.copy(arrayPoints[index])
              if (displacementVector) {
                sliceLineVertex.add(displacementVector) // displace towards camera
              }
            }
          })

          isShowVisibleLine = true
        } else if (sliceLineVertex) {
          if (!isShowVisibleLine) {
            sliceLineVertex.copy(tmpIntersectPoint)
            if (displacementVector) {
              sliceLineVertex.add(displacementVector) // displace towards camera
            }
          }
        } else {
          console.warn('!!! >2 intersection points for sliceLine', countIntersectPoints, iPoint, jPoint, bIntersects)
        }
        countIntersectPoints++
      }
    }
  )

  // get unique intersection points (in case one/two of them is a perfect corner, which might see a duplicate?)
  // this probably isn't gonna fix that situtation does to floating rounding difference (30.1999 vs 30.2 etc)
  // curIntersectPoints = _.uniqBy(curIntersectPoints, function({x,y,z}) {
  //   return x + '-' + y + '-' + z;
  // })
  // log.debug('> Intersect Points', i, curIntersectPoints)

  if (countIntersectPoints === 2 || isShowVisibleLine) {
    // outputLine.computeLineDistances() // not needed without dashed line
    outputLine.geometry.verticesNeedUpdate = true
    outputLine.visible = true
    return true
  } else {
    if (countIntersectPoints > 2) {
      console.warn('!! >2 intersection points for sliceLine', countIntersectPoints)
      // outputLine.visible = true
      // return true
    } else {
      log.debug(' ... no slice intersection line')
    }
    outputLine.visible = false
    return false
  }
}

function convertWindowLevelWidth(windowLevel, windowWidth) {
  return windowLevel === 40 && windowWidth === 400
    ? 'soft'
    : windowLevel === -600 && windowWidth === 1500
    ? 'lung'
    : windowLevel === 600 && windowWidth === 3000
    ? 'bone'
    : windowLevel === 40 && windowWidth === 80
    ? 'brain'
    : 'vascular'
}

export {
  RADIAN_180_DEG,
  RADIAN_90_DEG,
  intersectPlanes,
  clamp,
  getSignedAngleBetween,
  vec3allSignsEqual,
  getSelectionOutsideAmountByAxis,
  areVectorsSameDirSigns,
  greatestAxisAbsXYZ,
  getSelectionAIsInsideB,
  radiansToDegrees,
  floorWithBracket,
  getClosestSignedAxis3,
  setIntersectionLineFromPlaneAndFourCorners,
  convertWindowLevelWidth,
}
