import _ from 'lodash'
import { Plane, Vector3 } from 'three'
import { POINT_SELECT_MODES } from '../constants'
import * as THREE from 'three'

function isPointInBox(point, corner1, corner2, corner3, corner4) {
  const nullVector0 = corner1
  const nullVectorX = corner2
  const nullVectorY = corner3
  const nullVectorZ = corner4

  const ptPos = new THREE.Vector3().subVectors(point, nullVector0)

  const nullX = new THREE.Vector3().subVectors(nullVectorX, nullVector0)
  const nullY = new THREE.Vector3().subVectors(nullVectorY, nullVector0)
  const nullZ = new THREE.Vector3().subVectors(nullVectorZ, nullVector0)

  const dotX = nullX.clone().dot(ptPos)
  const dotY = nullY.clone().dot(ptPos)
  const dotZ = nullZ.clone().dot(ptPos)

  const dotNullX = nullX.clone().dot(nullX)
  const dotNullY = nullY.clone().dot(nullY)
  const dotNullZ = nullZ.clone().dot(nullZ)

  const isX = -1e-8 > dotX || dotX - dotNullX > 1e-5
  const isY = -1e-8 > dotY || dotY - dotNullY > 1e-5
  const isZ = -1e-8 > dotZ || dotZ - dotNullZ > 1e-5

  return !(isX || isY || isZ)
}

function createHexagonPoints(radius) {
  const points = []
  const numOfSegments = 30
  const angleIncrement = Math.PI / (numOfSegments / 2) // 60 degrees in radians

  for (let i = 0; i < numOfSegments; i++) {
    const angle = i * angleIncrement
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    points.push(new THREE.Vector3(x, y, 0))
  }

  return points
}

function calculateNormalFromPoints(p1, p2, p3) {
  // Create vectors from the points
  const v1 = new THREE.Vector3().subVectors(p2, p1)
  const v2 = new THREE.Vector3().subVectors(p3, p1)

  // Calculate the normal vector by taking the cross product of v1 and v2
  const normal = new THREE.Vector3().crossVectors(v1, v2).normalize()

  return normal
}

function areVectorsCollinear(v1, v2) {
  // Normalize the vectors
  const normalizedV1 = v1.clone().normalize()
  const normalizedV2 = v2.clone().normalize()

  // Calculate the dot product
  const dotProduct = normalizedV1.dot(normalizedV2)

  // Check if the dot product is close to 1 or -1
  return Math.abs(Math.abs(dotProduct) - 1) < 1e-5
}

function checkIntersectOfSatBandWithSatBandMarkZone(satBand, satBandSelections) {
  const xDir3Data = _.get(satBand, ['xDirection3'], { x: 1, y: 0, z: 0 })
  const xDir3 = new Vector3(xDir3Data.x, xDir3Data.y, xDir3Data.z).normalize()
  const yDir3Data = _.get(satBand, ['yDirection3'], { x: 0, y: 1, z: 0 })
  const yDir3 = new Vector3(yDir3Data.x, yDir3Data.y, yDir3Data.z).normalize()
  const zDir3Data = _.get(satBand, ['zDirection3'], { x: 0, y: 1, z: 0 })
  const zDir3 = new Vector3(zDir3Data.x, zDir3Data.y, zDir3Data.z).normalize()

  const dimensions = _.get(satBand, ['dimensions3'])
  const size = new Vector3(dimensions.x, dimensions.y, dimensions.z)

  const rotationMatrix = new THREE.Matrix4()
  rotationMatrix.makeBasis(xDir3, yDir3, zDir3)

  let isIntersect = false
  const ckeckInfo = []
  Object.entries(satBandSelections).forEach(([, selection]) => {
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

        const check = checkIntersectOfPolygonWithSatBand(points, satBand)
        ckeckInfo.push({
          ...check,
          stackName: selection.stackName,
          selectionId: selection.id,
        })
        if (check.isIntersect) {
          isIntersect = true
        }
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

        const check = checkIntersectOfPolygonWithSatBand(points, satBand)
        ckeckInfo.push({
          ...check,
          stackName: selection.stackName,
          selectionId: selection.id,
        })
        if (check.isIntersect) {
          isIntersect = true
        }
      }
    } else if (mode == POINT_SELECT_MODES.POLYGON) {
      if (_.has(selection, ['points'])) {
        const points = _.get(selection, ['points'], []).map((vec3) => {
          return new THREE.Vector3(vec3.x, vec3.y, vec3.z)
        })

        const check = checkIntersectOfPolygonWithSatBand(points, satBand)
        ckeckInfo.push({
          ...check,
          stackName: selection.stackName,
          selectionId: selection.id,
        })
        if (check.isIntersect) {
          isIntersect = true
        }
      }
    }
  })

  const groupByStackName = _.groupBy(ckeckInfo, 'stackName')
  const maxOverlappedDistanceByStackName = _.max([
    ..._.map(Object.values(groupByStackName), (stacks) => {
      return _.max([_.sum(_.map(stacks, 'intersectDistance')), 0])
    }),
    0,
  ])
  return {
    isIntersect,
    intersectDistance: isIntersect ? _.min([maxOverlappedDistanceByStackName, size.z]) : 0,
  }
}

function findPlaneCombinations(planes) {
  const combinations = []

  for (let i = 0; i < planes.length; i++) {
    for (let j = i + 1; j < planes.length; j++) {
      combinations.push([planes[i], planes[j]])
    }
  }

  return combinations
}

function calcMaxDistanceFromPoints(points) {
  let maxDistance = 0

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const distance = points[i].distanceTo(points[j])
      if (distance > maxDistance) {
        maxDistance = distance
      }
    }
  }

  return maxDistance
}

function findDistanceBetweenCollinearPlanes(plane1, plane2) {
  // Kiểm tra xem hai mặt phẳng có song song không
  if (!areVectorsCollinear(plane1.normal, plane2.normal)) {
    return 100
  }

  // Tính khoảng cách giữa hai mặt phẳng
  const pointOnPlane1 = plane1.normal.clone().multiplyScalar(-plane1.constant)
  const distance = plane2.distanceToPoint(pointOnPlane1)

  return Math.abs(distance)
}

function getIntersectionLineVerticesFromPlaneAndFourCorners(plane, fourCorners, displacementVector) {
  let countIntersectPoints = 0
  const vertices = []
  const tmpIntersectorLine = new THREE.Line3()
  const tmpIntersectPoint = new THREE.Vector3()

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
      tmpIntersectorLine.set(fourCorners[iPoint], fourCorners[jPoint])
      // sets result into tmpIntersectPoint
      let bIntersects = plane.intersectLine(tmpIntersectorLine, tmpIntersectPoint)
      if (bIntersects) {
        // first intersection point goes into vertices[0], second into vertices[1] (there are two for a line)
        vertices[countIntersectPoints] = new THREE.Vector3()
        let sliceLineVertex = vertices[countIntersectPoints]
        if (sliceLineVertex) {
          sliceLineVertex.copy(tmpIntersectPoint)
          if (displacementVector) {
            sliceLineVertex.add(displacementVector) // displace towards camera
          }
        } else {
          console.warn('!!! >2 intersection points for sliceLine', countIntersectPoints, iPoint, jPoint, bIntersects)
        }
        countIntersectPoints++
      }
    }
  )

  if (countIntersectPoints === 2) {
    return vertices
  } else {
    return null
  }
}

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

const updateSliceLinesInAxis = (axis = 'z', dimensions3Half, selectionPlane, satBand) => {
  let sliceLinesVisible = []
  const numberOfSlices = 2
  let gapSizeGrid = 2
  let tmpCornerPoints = _.map(_.range(4), function () {
    return new THREE.Vector3()
  })

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

        // Slice Previews should span throughout full selection cuboid, so use the dimensions3Half of that as-is
        setPositionFromCoordinates(tmpCornerPoints[pointIndex], x, y, z, dimensions3Half, false, satBand)

        pointIndex++
      })
    })

    // Sets sliceLine to line of where Plane and fourCorners intersect
    let bIntersects = getIntersectionLineVerticesFromPlaneAndFourCorners(
      selectionPlane,
      tmpCornerPoints,
      selectionPlane.normal
    )
    if (bIntersects) {
      sliceLinesVisible.push(bIntersects)
    }
  }

  return sliceLinesVisible
}

function checkIntersectOfPolygonWithSatBand(points, satBand) {
  if (points.length < 3) {
    return {
      isIntersect: false,
    }
  }
  const center = _.get(satBand, ['center3'])
  const dimensions = _.get(satBand, ['dimensions3'])

  const xDir3Data = _.get(satBand, ['xDirection3'], { x: 1, y: 0, z: 0 })
  const xDir3 = new Vector3(xDir3Data.x, xDir3Data.y, xDir3Data.z).normalize()
  const yDir3Data = _.get(satBand, ['yDirection3'], { x: 0, y: 1, z: 0 })
  const yDir3 = new Vector3(yDir3Data.x, yDir3Data.y, yDir3Data.z).normalize()
  const zDir3Data = _.get(satBand, ['zDirection3'], { x: 0, y: 0, z: 1 })
  const zDir3 = new Vector3(zDir3Data.x, zDir3Data.y, zDir3Data.z).normalize()
  const size = new Vector3(dimensions.x, dimensions.y, dimensions.z)
  const pos = new Vector3(center.x, center.y, center.z)

  const corner0 = pos
    .clone()
    .add(xDir3.clone().multiplyScalar(-0.5 * size.x))
    .add(yDir3.clone().multiplyScalar(-0.5 * size.y))
    .add(zDir3.clone().multiplyScalar(-0.5 * size.z))
  const cornerX = pos
    .clone()
    .add(xDir3.clone().multiplyScalar(0.5 * size.x))
    .add(yDir3.clone().multiplyScalar(-0.5 * size.y))
    .add(zDir3.clone().multiplyScalar(-0.5 * size.z))
  const cornerY = pos
    .clone()
    .add(xDir3.clone().multiplyScalar(-0.5 * size.x))
    .add(yDir3.clone().multiplyScalar(0.5 * size.y))
    .add(zDir3.clone().multiplyScalar(-0.5 * size.z))
  const cornerZ = pos
    .clone()
    .add(xDir3.clone().multiplyScalar(-0.5 * size.x))
    .add(yDir3.clone().multiplyScalar(-0.5 * size.y))
    .add(zDir3.clone().multiplyScalar(0.5 * size.z))

  const rotationMatrix = new THREE.Matrix4()
  rotationMatrix.makeBasis(xDir3, yDir3, zDir3)

  let planeCorners = [
    [
      [-0.5, -0.5, -0.5],
      [-0.5, 0.5, -0.5], // Y
      [-0.5, -0.5, 0.5], // Z
    ],
    [
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5], // X
      [-0.5, -0.5, 0.5], // Z
    ],
    [
      [-0.5, -0.5, -0.5],
      [0.5, -0.5, -0.5], // X
      [-0.5, 0.5, -0.5], // Y
    ],
    [
      [0.5, 0.5, 0.5],
      [0.5, -0.5, 0.5], // - Y
      [0.5, 0.5, -0.5], // - Z
    ],
    [
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5], // - X
      [0.5, 0.5, -0.5], // - Z
    ],
    [
      [0.5, 0.5, 0.5],
      [-0.5, 0.5, 0.5], // - X
      [0.5, -0.5, 0.5], // - Y
    ],
  ]

  planeCorners = planeCorners.map((corners) => {
    const p1 = pos
      .clone()
      .add(xDir3.clone().multiplyScalar(corners[0][0] * size.x))
      .add(yDir3.clone().multiplyScalar(corners[0][1] * size.y))
      .add(zDir3.clone().multiplyScalar(corners[0][2] * size.z))
    const p2 = pos
      .clone()
      .add(xDir3.clone().multiplyScalar(corners[1][0] * size.x))
      .add(yDir3.clone().multiplyScalar(corners[1][1] * size.y))
      .add(zDir3.clone().multiplyScalar(corners[1][2] * size.z))
    const p3 = pos
      .clone()
      .add(xDir3.clone().multiplyScalar(corners[2][0] * size.x))
      .add(yDir3.clone().multiplyScalar(corners[2][1] * size.y))
      .add(zDir3.clone().multiplyScalar(corners[2][2] * size.z))
    return new Plane().setFromCoplanarPoints(p1, p2, p3)
  })

  const polygonNormal = calculateNormalFromPoints(points[0], points[1], points[2])
  const lineVertices = points.map((point, index) => {
    return [point.clone(), points[(index + 1) % points.length].clone()]
  })

  let isIntersect = false

  const maximumIntersectDistance = calcMaxDistanceFromPoints(points)
  let intersectDistance = maximumIntersectDistance

  if (!_.some(points, (point) => !isPointInBox(point.clone(), corner0, cornerX, cornerY, cornerZ))) {
    isIntersect = true
    // Return maximum distance of polygon
    const halfSize = size.clone().multiplyScalar(0.5)
    const polygonPlane = new Plane().setFromNormalAndCoplanarPoint(polygonNormal, points[0])
    // Check if all points are in the box
    const zLines = updateSliceLinesInAxis('z', halfSize, polygonPlane, satBand)
    const yLines = updateSliceLinesInAxis('y', halfSize, polygonPlane, satBand)
    const xLines = updateSliceLinesInAxis('x', halfSize, polygonPlane, satBand)

    const lineByAxis = [zLines, yLines, xLines]
    const sliceLinesVisible = _.maxBy(lineByAxis, (lines) => lines.length)

    if (sliceLinesVisible.length > 0) {
      intersectDistance = _.max(
        _.map(sliceLinesVisible, (lineVertices) => {
          const line = new THREE.Line3(lineVertices[0], lineVertices[1])
          const distanceFromLineToPoints = _.map(points, (point) => distanceFromLineToPoint(line, point))
          return _.max(distanceFromLineToPoints) - _.min(distanceFromLineToPoints)
        })
      )
    }
  } else if (
    _.some(lineVertices, (vertices) =>
      _.some(planeCorners, (plane) => {
        const intersection = getIntersectOfSegmentAndPlane(new THREE.Line3(vertices[0], vertices[1]), plane)
        return intersection && isPointInBox(intersection, corner0, cornerX, cornerY, cornerZ)
      })
    )
  ) {
    isIntersect = true
    const intersectedPlanes = planeCorners.filter((plane) =>
      _.some(lineVertices, (vertices) => {
        const intersection = getIntersectOfSegmentAndPlane(new THREE.Line3(vertices[0], vertices[1]), plane)
        return intersection && isPointInBox(intersection, corner0, cornerX, cornerY, cornerZ)
      })
    )

    const filterPolygonOnBox = (polygons, intersectedPoints) => {
      return polygons.filter((polygonPoints) => {
        const pointsExceptIntersected = polygonPoints.filter(
          (el) => !_.some(intersectedPoints, (intersectedPoint) => intersectedPoint.point.distanceTo(el) < 1e-5)
        )
        return (
          polygonPoints.length == 2 || // If polygon has only 2 points, return true
          pointsExceptIntersected.length == 0 || // If all points are intersected, return true
          _.filter(pointsExceptIntersected, (point) => !isPointInBox(point.clone(), corner0, cornerX, cornerY, cornerZ))
            .length <= (pointsExceptIntersected.length > 1 ? 1 : 0)
        )
      })
    }

    const seperatePolygonsByIntersectPoints = (polygons, intersectedPoints) => {
      const initialPoint = intersectedPoints[0].point
      let localPolygons = polygons
      for (let i = 1; i < intersectedPoints.length; i++) {
        const rs = []
        localPolygons.forEach((polygon) => {
          rs.push(...seperatePointsByTwoPoints(polygon, initialPoint, intersectedPoints[i].point))
        })
        localPolygons = rs
      }
      return localPolygons
    }

    const seperatePointsByIntersectLines = (points, intersectedPoints) => {
      if (intersectedPoints.length == 1) {
        return [points]
      } else {
        let polygons = [points]
        for (let i = 0; i < intersectedPoints.length - 1; i++) {
          polygons = seperatePolygonsByIntersectPoints(
            polygons,
            intersectedPoints.filter((el, index) => index >= i)
          )
        }
        polygons = filterPolygonOnBox(polygons, intersectedPoints)
        return polygons
      }
    }

    const findIntersectPoints = (intersectedLineVertices) => {
      const intersectedPoints = _.flatMap(intersectedLineVertices, (vertices) => {
        const intersectedPlanes = planeCorners.filter((plane) => {
          const intersection = getIntersectOfSegmentAndPlane(new THREE.Line3(vertices[0], vertices[1]), plane)
          return intersection && isPointInBox(intersection, corner0, cornerX, cornerY, cornerZ)
        })
        return intersectedPlanes.map((intersectedPlane) => {
          return {
            point: intersectedPlane.intersectLine(new THREE.Line3(vertices[0], vertices[1]), new THREE.Vector3()),
            plane: intersectedPlane,
          }
        })
      })

      return intersectedPoints
    }

    if (intersectedPlanes.length > 2) {
      // Return maximum distance of polygon
      const planeCombinations = findPlaneCombinations(intersectedPlanes)
      const collinearPlane = planeCombinations.find((combination) => {
        return areVectorsCollinear(combination[0].normal, combination[1].normal)
      })
      if (collinearPlane) {
        intersectDistance = findDistanceBetweenCollinearPlanes(collinearPlane[0], collinearPlane[1])
      }
    } else if (intersectedPlanes.length == 2) {
      // Two planes are opposite sides of the box
      if (areVectorsCollinear(intersectedPlanes[0].normal, intersectedPlanes[1].normal)) {
        // Return maximum distance of satband
        intersectDistance = findDistanceBetweenCollinearPlanes(intersectedPlanes[0], intersectedPlanes[1])
      } else {
        const intersectedLineVertices = lineVertices.filter((vertices) =>
          _.some(planeCorners, (plane) => {
            const intersection = getIntersectOfSegmentAndPlane(new THREE.Line3(vertices[0], vertices[1]), plane)
            return intersection && isPointInBox(intersection, corner0, cornerX, cornerY, cornerZ)
          })
        )
        if (intersectedLineVertices.length <= 1) {
          intersectDistance = 100
        } else if (intersectedLineVertices.length >= 2) {
          const intersectedPoints = findIntersectPoints(intersectedLineVertices)
          let polygons = seperatePointsByIntersectLines(points, intersectedPoints)
          if (polygons.length > 0) {
            intersectDistance = _.max(
              _.map(polygons, (polygon) => {
                const intersectedPointsOfPolygon = intersectedPoints.filter((el) =>
                  _.some(polygon, (point) => point == el.point)
                )
                return findIntersectDistance(polygon, polygonNormal, intersectedPointsOfPolygon)
              })
            )
          } else {
            // Return maximum distance of polygon
          }
        }
      }
    } else {
      const intersectedLineVertices = lineVertices.filter((vertices) =>
        _.some(planeCorners, (plane) => {
          const intersection = getIntersectOfSegmentAndPlane(new THREE.Line3(vertices[0], vertices[1]), plane)
          return intersection && isPointInBox(intersection, corner0, cornerX, cornerY, cornerZ)
        })
      )
      const intersectedPoints = findIntersectPoints(intersectedLineVertices)
      let polygons = seperatePointsByIntersectLines(points, intersectedPoints)
      if (polygons.length > 0) {
        intersectDistance = _.max(
          _.map(polygons, (polygon) => {
            const intersectedPointsOfPolygon = intersectedPoints.filter((el) =>
              _.some(polygon, (point) => point == el.point)
            )
            return findIntersectDistance(polygon, polygonNormal, intersectedPointsOfPolygon)
          })
        )
      } else {
        // Return maximum distance of polygon
      }
    }
  }

  return {
    isIntersect,
    intersectDistance: isIntersect && !_.isNil(intersectDistance) ? intersectDistance : 0,
  }
}

function findIntersectDistance(points, polygonNormal, intersectPointInfos) {
  const intersectLines = intersectPointInfos.map((info) => {
    const lineDir = polygonNormal.clone().cross(info.plane.normal).normalize()
    return new THREE.Line3(info.point, info.point.clone().add(lineDir))
  })

  return _.max(_.flatMap(intersectLines, (line) => points.map((point) => distanceFromLineToPoint(line, point))))
}

function distanceFromLineToPoint(line, point) {
  const closestPoint = line.closestPointToPoint(point, false, new THREE.Vector3())
  return closestPoint.distanceTo(point)
}

function removeDuplicatePoints(points) {
  const uniquePoints = []
  const pointSet = new Set()

  points.forEach((point) => {
    const key = `${point.x},${point.y},${point.z}`
    if (!pointSet.has(key)) {
      pointSet.add(key)
      uniquePoints.push(point)
    }
  })

  return uniquePoints
}

const seperatePointsByTwoPoints = (points, point1, point2) => {
  const index1 = points.findIndex((point, index) =>
    isPointOnSegment(point1, point, points[(index + 1) % points.length])
  )
  const index2 = points.findIndex((point, index) =>
    isPointOnSegment(point2, point, points[(index + 1) % points.length])
  )

  if (index1 == -1 || index2 == -1) {
    return [points]
  }

  if (index1 == index2) {
    return [points]
  } else if (index1 < index2) {
    let polygon1 = [point1, ...points.filter((el, i) => i > index1 && i <= index2), point2]
    let polygon2 = [point2, ...points.filter((el, i) => i > index2), point1, ...points.filter((el, i) => i <= index1)]

    polygon1 = removeDuplicatePoints(polygon1)
    polygon2 = removeDuplicatePoints(polygon2)
    const rs = []
    if (polygon1.length > 2) {
      rs.push(polygon1)
    }
    if (polygon2.length > 2) {
      rs.push(polygon2)
    }
    return rs
  } else {
    let polygon1 = [point1, ...points.filter((el, i) => i > index2 && i <= index1), point2]
    let polygon2 = [point2, ...points.filter((el, i) => i > index1), point1, ...points.filter((el, i) => i <= index2)]

    polygon1 = removeDuplicatePoints(polygon1)
    polygon2 = removeDuplicatePoints(polygon2)
    const rs = []
    if (polygon1.length > 2) {
      rs.push(polygon1)
    }
    if (polygon2.length > 2) {
      rs.push(polygon2)
    }
    return rs
  }
}

function isPointOnSegment(point, segmentStart, segmentEnd) {
  const segment = new THREE.Line3(segmentStart, segmentEnd)
  const closestPoint = segment.closestPointToPoint(point, true, new THREE.Vector3())

  // Check if the closest point on the segment to the given point is the point itself
  return closestPoint.distanceToSquared(point) < 1
}

// const isIntersectOfSegmentAndPlane = (segment, plane) => {
//   const intersection = plane.intersectLine(segment, new Vector3())

//   if (!intersection) {
//     return false
//   }

//   let clampedIntersection3A = segment.closestPointToPoint(intersection, true, new THREE.Vector3())

//   if (intersection.distanceToSquared(clampedIntersection3A) > 1) {
//     return false
//   } else {
//     return true
//   }
// }

const getIntersectOfSegmentAndPlane = (segment, plane) => {
  const intersection = plane.intersectLine(segment, new Vector3())

  if (!intersection) {
    return null
  }

  let clampedIntersection3A = segment.closestPointToPoint(intersection, true, new THREE.Vector3())

  if (intersection.distanceToSquared(clampedIntersection3A) > 1) {
    return null
  } else {
    return intersection
  }
}

export {
  checkIntersectOfSatBandWithSatBandMarkZone,
  createHexagonPoints,
  areVectorsCollinear,
  getIntersectOfSegmentAndPlane,
}
