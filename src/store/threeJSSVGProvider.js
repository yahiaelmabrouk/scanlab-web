import _ from 'lodash'
// Some parts of ThreeJS need to be imported from their examples folder, per: https://threejs.org/docs/#manual/en/introduction/Installation
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'
import { promiseProps } from '@/lib/misc-util'
// import { SVGRenderer, SVGObject } from 'three/examples/jsm/renderers/SVGRenderer';
import * as THREE from 'three'
import CursorMoveIcon from '@/assets/svg/cursor-move.svg'
import Rotate3DVariantIcon from '@/assets/svg/rotate-3d-variant.svg'
import ArrowExpandAllIcon from '@/assets/svg/arrow-expand-all.svg'
import ArrowExpandHorizontalIcon from '@/assets/svg/arrow-expand-horizontal.svg'
import log from 'loglevel'

// SVG images/icons for use inside 3D world / ThreeJS
// Define any SVGs you want to use in here, and they'll all be loaded when `threeJSSVGProvider.init` is called
// Svg source code needs to be pretty plain (no extensive prefix declaration - I just deleted it in the SVGs I used) - see existing ones in use
const SVGS = {
  CursorMoveIcon,
  Rotate3DVariantIcon,
  ArrowExpandAllIcon,
  ArrowExpandHorizontalIcon,
}

// Loads an SVG into a ThreeJS Group(think Object3D)
function loadSVG(svgLoader, svgUrl) {
  return new Promise((resolve) => {
    // load a SVG resource
    svgLoader.load(
      // resource URL
      svgUrl,
      // called when the resource is loaded
      (data) => {
        // This assumes a very simple SVG structure that must start immediately with the <svg> tag
        let paths = data.paths
        let outputs = []

        for (let i = 0; i < paths.length; i++) {
          let path = paths[i]

          let material = new THREE.MeshBasicMaterial({
            color: path.color,
            side: THREE.DoubleSide,
            depthWrite: false,
          })

          let shapes = path.toShapes(true)

          for (let j = 0; j < shapes.length; j++) {
            let shape = shapes[j]
            let geometry = new THREE.ShapeBufferGeometry(shape)
            // these two pieces are what is needed for creating a Mesh, but we wait to create the Mesh until we want an instance of the SVG Group(think Object3D) - because otherwise it visually bugs out
            outputs.push({ material, geometry })
          }
        }

        resolve(outputs)
      },
      // called when loading is in progresses
      function () {
        // xhr
        // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },
      // called when loading has errors
      function (error) {
        console.warn('Error loading SVG for ThreeJS', error)
      }
    )
  })
}

// Provides SVGs usable inside ThreeJS
const threeJSSVGProvider = {
  namespaced: true,
  state: {
    hasLoaded: false, // are we all done loading?
    hasBegunLoading: false, // keep track that we've started loading, so we don't do it again
    svgLoader: null,
    svgDataByName: {}, // {svgName: [{geometry, material}],...} // each svg turns into an array of meshes, which can then be added into a new ThreeJS.Group, and moved around / rotates separately per Group instance of same svg meshes
  },
  mutations: {
    set(state, stuff) {
      _.extend(state, stuff)
    },
  },
  actions: {
    async init({ state, commit }) {
      log.debug('threeJSSVGProvider init')
      if (!state.hasBegunLoading) {
        commit('set', { hasBegunLoading: true })

        let svgLoader = new SVGLoader()

        // Load all SVGs in parallel
        let svgDataByName = _.mapValues(SVGS, (svgUrl) => {
          return loadSVG(svgLoader, svgUrl)
        })
        // wait for all SVGs to load
        svgDataByName = await promiseProps(svgDataByName)

        log.debug('threeJSSVGProvider loaded', svgDataByName)
        commit('set', {
          hasLoaded: true,
          svgDataByName,
          svgLoader,
        })
      }
    },
    // Returns a THREE.Group, which can be used like a THREE.Object3D, for the SVG
    // renderOrder - int to set on material, so it will be rendered on top of everything else in this order, regardless of depth check (see https://discourse.threejs.org/t/always-render-mesh-on-top-of-another/120/5 )
    async createInstance({ state }, { svgName, renderOrder, callback }) {
      let group = new THREE.Group()
      let pairs = state.svgDataByName[svgName]
      if (!pairs) {
        throw Error(`No data found for SVG named '${svgName}'. Did you add it to threeJSSVGProvider?`)
      }

      for (let { geometry, material } of pairs) {
        if (renderOrder) {
          material = material.clone()
          material.depthTest = false
          material.renderOrder = renderOrder
        }
        let mesh = new THREE.Mesh(geometry, material)
        if (renderOrder) {
          mesh.renderOrder = renderOrder
        }
        group.add(mesh)
      }

      log.debug('threeJSSVGProvider createInstance', svgName, group)

      // dispatch actions can only return promises, but since not all consumers of this can be async, provide callback option
      if (callback) {
        callback(group)
      }
      return group
    },
  },
}

export default threeJSSVGProvider
