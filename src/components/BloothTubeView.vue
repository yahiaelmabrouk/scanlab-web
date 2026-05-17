<template>
  <div>
    <div
      :style="{ minHeight: '360px', maxHeight: maxHeight }"
      ref="box"
      class="box"
      @mouseenter="cursorOnBox = true"
      @mouseleave="cursorOnBox = false"
    ></div>
    <v-slider v-model.number="bloothTuveStepValue" :min="1" :step="1" :max="121" ticks class="slider-input" />
  </div>
</template>
<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import _ from 'lodash'
import { mapActions, mapState } from 'vuex'

export default {
  name: 'BloothTubeView',
  props: {
    maxHeight: {
      type: String,
      required: false,
      default: 'unset',
    },
  },
  data() {
    return {
      cursorOnBox: false,
      scene: null,
      camera: null,
      renderer: null,
      elBox: null,
      controls: null,
      requestAnimationId: null,
      rendererSize: new THREE.Vector2(),
      mixer: null,
      clock: new THREE.Clock(),
      animationDuration: 1,
      animationAction: null,
    }
  },
  computed: {
    ...mapState('timingDecisionService', ['bloothTubeStep']),
    bloothTuveStepValue: {
      get() {
        return this.bloothTubeStep
      },
      set(value) {
        this.setBloothTubeStep(value)
      },
    },
  },
  mounted() {
    this.elBox = this.$refs.box
    this.scene = new THREE.Scene()

    this.initRenderer()

    this.elBox.appendChild(this.renderer.domElement)

    //Init scene
    this.scene.background = new THREE.Color('#dedede')

    // Init camera
    this.camera = new THREE.PerspectiveCamera(50, this.elBox.offsetWidth / this.elBox.offsetHeight, 0.1, 100000)
    this.camera.position.set(0, 0, 20)

    // Init light
    const ambientLight = new THREE.AmbientLight()
    this.scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight()
    directionalLight.intensity = 0.5
    directionalLight.position.set(10, 10, 10)
    this.scene.add(directionalLight)

    this.loadModel()

    this.initOrbitControl()

    this.onSetSizeOfRenderer()

    this.onWindowResize = _.debounce(() => {
      this.onSetSizeOfRenderer()
    }, 50)

    this.requestAnimationId = requestAnimationFrame(this.onFrame)
  },
  watch: {
    bloothTubeStep(newValue) {
      if (this.mixer) {
        const time = (newValue / 121) * this.animationDuration
        console.log('time', time)
        this.mixer.setTime(time)
      }
    },
  },
  beforeDestroy() {
    const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame
    cancelAnimationFrame(this.requestAnimationId)
    if (this.scene) {
      this.scene.dispose()
    }
  },
  methods: {
    ...mapActions('timingDecisionService', ['setBloothTubeStep']),
    initRenderer() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
      })
      this.renderer.setClearColor(0x000000, 1)
      this.renderer.setPixelRatio(window.devicePixelRatio)
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
    initOrbitControl() {
      let target = null
      if (this.controls) {
        target = new THREE.Vector3().copy(this.controls.target)
        this.controls.dispose()
      }
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.LEFT,
        MIDDLE: THREE.MOUSE.MIDDLE,
        RIGHT: THREE.MOUSE.RIGHT,
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
    loadModel() {
      const loader = new GLTFLoader()
      loader.load(
        '/blooth-tube/tube_anim.glb',
        (gltf) => {
          const center = new THREE.Vector3()
          const box = new THREE.Box3().setFromObject(gltf.scene)
          box.getCenter(center)
          gltf.scene.position.x = -center.x
          gltf.scene.position.y = -center.y
          gltf.scene.position.z = -center.z
          gltf.scene.traverse((child) => {
            console.log(child)
            if (child.isMesh) {
              if (child.name == 'Cylinder001') {
                child.material = child.material.clone()
                child.material.emissive = new THREE.Color(0xff0000)
                child.material.depthWrite = false
                child.material.depthTest = false
              } else {
                child.material.opacity = 0.5
                child.material.transparent = true
              }
            }
          })
          this.scene.add(gltf.scene)
          this.renderer.render(this.scene, this.camera)

          const animations = gltf.animations
          if (animations && animations.length) {
            this.mixer = new THREE.AnimationMixer(gltf.scene)
            const animation = animations[0]
            this.animationAction = this.mixer.clipAction(animation)
            this.animationAction.play()
            // this.animationAction.paused = true
            this.animationDuration = animation.duration
          }
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        },
        (error) => {
          console.error('An error happened', error)
        }
      )
    },
    onFrame() {
      if (this.renderer) {
        this.renderer.getSize(this.rendererSize)
        if (this.rendererSize.x != 0 && this.rendererSize.y != 0) {
          this.controls.update()
          this.render()
        }
        // if (this.mixer && this.clock) {
        //   const delta = this.clock.getDelta()
        //   if (this.mixer) {
        //     this.mixer.update(delta)
        //   }
        // }
      }

      this.requestAnimationId = requestAnimationFrame(this.onFrame)
    },
    render() {
      this.renderer.render(this.scene, this.camera)
    },
  },
}
</script>
