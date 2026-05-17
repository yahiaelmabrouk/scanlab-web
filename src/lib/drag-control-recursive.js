import { EventDispatcher, Plane, Raycaster, Vector2, Vector3 } from 'three'

/*
 * @author zz85 / https://github.com/zz85
 * @author mrdoob / http://mrdoob.com
 * Running this will allow you to drag three.js objects around the screen.
 */

// Commenting out actual dragging logic, since we don't want dots to move without cuboid moving
// We just want to click on / drag(ignore) / click off

function DragControls(_objects, _camera, _domElement) {
  if (_objects.isCamera) {
    console.warn('THREE.DragControls: Constructor now expects ( objects, camera, domElement )')
    let temp = _objects
    _objects = _camera
    _camera = temp
  }

  let _plane = new Plane()
  let _raycaster = new Raycaster()

  let _mouse = new Vector2()
  let _offset = new Vector3()
  let _intersection = new Vector3()

  let _selected = null,
    _hovered = null

  //

  let scope = this

  function activate() {
    _domElement.addEventListener('mousemove', onDocumentMouseMove, false)
    _domElement.addEventListener('mousedown', onDocumentMouseDown, false)
    _domElement.addEventListener('mouseup', onDocumentMouseCancel, false)
    _domElement.addEventListener('mouseleave', onDocumentMouseCancel, false)
    _domElement.addEventListener('touchmove', onDocumentTouchMove, false)
    _domElement.addEventListener('touchstart', onDocumentTouchStart, false)
    _domElement.addEventListener('touchend', onDocumentTouchEnd, false)
  }

  function deactivate() {
    _domElement.removeEventListener('mousemove', onDocumentMouseMove, false)
    _domElement.removeEventListener('mousedown', onDocumentMouseDown, false)
    _domElement.removeEventListener('mouseup', onDocumentMouseCancel, false)
    _domElement.removeEventListener('mouseleave', onDocumentMouseCancel, false)
    _domElement.removeEventListener('touchmove', onDocumentTouchMove, false)
    _domElement.removeEventListener('touchstart', onDocumentTouchStart, false)
    _domElement.removeEventListener('touchend', onDocumentTouchEnd, false)
  }

  function dispose() {
    deactivate()
  }

  function onDocumentMouseMove(event) {
    event.preventDefault()

    let rect = _domElement.getBoundingClientRect()

    _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    _raycaster.setFromCamera(_mouse, _camera)

    if (_selected && scope.enabled) {
      // if (_raycaster.ray.intersectPlane(_plane, _intersection)) {

      //   _selected.position.copy(_intersection.sub(_offset));

      // }

      scope.dispatchEvent({
        type: 'drag',
        object: _selected,
        mouseEvent: event,
      })

      return
    }

    _raycaster.setFromCamera(_mouse, _camera)

    let intersects = _raycaster.intersectObjects(_objects, true)

    if (intersects.length > 0) {
      let object = intersects[0].object

      _plane.setFromNormalAndCoplanarPoint(_camera.getWorldDirection(_plane.normal), object.position)

      if (_hovered !== object) {
        _domElement.style.cursor = 'pointer'

        scope.dispatchEvent({
          type: 'hoveron',
          object: object,
          mouse: _mouse,
        })

        _hovered = object
      }
    } else {
      if (_hovered !== null) {
        scope.dispatchEvent({
          type: 'hoveroff',
          object: _hovered,
        })

        _domElement.style.cursor = 'auto'
        _hovered = null
      }
    }
  }

  function onDocumentMouseDown(event) {
    event.preventDefault()

    _raycaster.setFromCamera(_mouse, _camera)

    let intersects = _raycaster.intersectObjects(_objects, true)

    if (intersects.length > 0) {
      _selected = intersects[0].object

      if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
        _offset.copy(_intersection).sub(_selected.position)
      }

      // _domElement.style.cursor = 'move'

      scope.dispatchEvent({
        type: 'dragstart',
        object: _selected,
        mouseEvent: event,
      })
    }
  }

  function onDocumentMouseCancel(event) {
    event.preventDefault()

    if (_selected) {
      scope.dispatchEvent({
        type: 'dragend',
        object: _selected,
        mouseEvent: event,
      })

      _selected = null
    }

    _domElement.style.cursor = 'auto'
  }

  function onDocumentTouchMove(event) {
    event.preventDefault()
    event = event.changedTouches[0]

    let rect = _domElement.getBoundingClientRect()

    _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    _raycaster.setFromCamera(_mouse, _camera)

    // if (_selected && scope.enabled) {
    //
    //   if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
    //
    //     _selected.position.copy(_intersection.sub(_offset));
    //
    //   }
    //
    //   scope.dispatchEvent({
    //     type: 'drag',
    //     object: _selected
    //   });
    //
    //   return;
    //
    // }
  }

  function onDocumentTouchStart(event) {
    event.preventDefault()
    event = event.changedTouches[0]

    let rect = _domElement.getBoundingClientRect()

    _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    _raycaster.setFromCamera(_mouse, _camera)

    let intersects = _raycaster.intersectObjects(_objects, true)

    if (intersects.length > 0) {
      _selected = intersects[0].object

      _plane.setFromNormalAndCoplanarPoint(_camera.getWorldDirection(_plane.normal), _selected.position)

      if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
        _offset.copy(_intersection).sub(_selected.position)
      }

      // _domElement.style.cursor = 'move'

      scope.dispatchEvent({
        type: 'dragstart',
        object: _selected,
        mouseEvent: event,
      })
    }
  }

  function onDocumentTouchEnd(event) {
    event.preventDefault()

    if (_selected) {
      scope.dispatchEvent({
        type: 'dragend',
        object: _selected,
        mouseEvent: event,
      })

      _selected = null
    }

    _domElement.style.cursor = 'auto'
  }

  activate()

  // API

  this.enabled = true

  this.activate = activate
  this.deactivate = deactivate
  this.dispose = dispose

  // Backward compatibility

  this.setObjects = function () {
    console.error('THREE.DragControls: setObjects() has been removed.')
  }

  this.on = function (type, listener) {
    console.warn('THREE.DragControls: on() has been deprecated. Use addEventListener() instead.')
    scope.addEventListener(type, listener)
  }

  this.off = function (type, listener) {
    console.warn('THREE.DragControls: off() has been deprecated. Use removeEventListener() instead.')
    scope.removeEventListener(type, listener)
  }

  this.notify = function (type) {
    console.error('THREE.DragControls: notify() has been deprecated. Use dispatchEvent() instead.')
    scope.dispatchEvent({
      type: type,
    })
  }
}

DragControls.prototype = Object.create(EventDispatcher.prototype)
DragControls.prototype.constructor = DragControls

export default DragControls
