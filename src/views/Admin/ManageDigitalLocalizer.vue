<template>
  <div style="padding: 10px">
    <v-row>
      <v-col>
        <div class="mt-10 mb-10">
          <h2>{{ $t('global.manage_digital_localizer') }}</h2>
        </div>
        <v-row>
          <v-col cols="6">
            <b-card class="mb-2 mx-2">
              <v-row>
                <v-row>
                  <v-col>
                    <b-card>
                      <div class="text-start mb-3">
                        <h5>{{ $t('ModelManager.select_body_part') }}</h5>
                        <span class="subtitle">{{ `Select body part to define body boxes` }}</span>
                      </div>
                      <v-row>
                        <v-col>
                          <v-autocomplete
                            v-model="bodyPart.selected"
                            :items="bodyPart.items.filter((el) => !el.baseId)"
                            item-text="name"
                            item-value="id"
                            menu-props="auto"
                          />
                        </v-col>
                      </v-row>
                    </b-card>
                  </v-col>
                </v-row>
              </v-row>
              <v-row class="d-flex justify-content-center align-items-center mt-5" style="gap: 12px">
                <v-btn color="primary" class="btn-save" size="sm" @click="onSave">{{ $t('global.save') }}</v-btn>
                <v-btn color="warning" class="btn-save" size="sm">{{ $t('global.cancel') }}</v-btn>
              </v-row>
            </b-card>
          </v-col>
          <v-col cols="6">
            <b-card>
              <div
                class="timing-decision-container"
                ref="container"
                @mouseover="isHover = true"
                @mouseout="isHover = false"
                @mousewheel="onMousewheel"
                style="background-color: #000000; height: 400px"
              >
                <canvas ref="canvas" id="digitalLocalizerConfigCanvas"></canvas>
              </div>
            </b-card>
            <div class="mt-5">
              <v-btn color="primary" class="btn-save" size="sm" @click="onAdd" v-if="!isAddLocal">{{
                $t('global.add')
              }}</v-btn>
              <v-btn color="error" class="btn-save" size="sm" @click="onDelete" v-if="isAddLocal">
                {{ $t('global.delete') }}
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <div class="loading-overlay" v-if="loading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <v-dialog v-model="isVisibleModelConfirmDelete" width="500">
      <template>
        <v-card>
          <v-card-title class="headline" primary-title>
            {{ $t('global.confirm') }}
          </v-card-title>

          <v-card-text>
            {{ $t('global.delete_selected_digital_localizer') }}
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="isVisibleModelConfirmDelete = false">
              {{ $t('global.cancel') }}
            </v-btn>
            <v-btn color="red darken-1" text @click="onConfirmDelete">
              {{ $t('global.okay') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import _ from 'lodash'
import { fabric } from 'fabric'
import bodyMapPositions from '@/assets/jsons/digitalBodyMapViewPosition.json'
import { NUM_OF_BODY_MAP_IMAGES } from '../../constants'
import { apiDelete, apiGet, apiPost, apiPut } from '../../util/api'
import { mapState } from 'vuex/dist/vuex.common.js'
export default {
  name: 'ManageDigitalLocalizer',
  data() {
    return {
      digitalLocalizers: [],
      bodyPart: {
        selected: 1,
        items: [],
      },
      canvasRealWidth: null,
      canvasRealHeight: null,
      canvas: null,
      loading: true,
      error: null,
      isHover: false,
      lastPosX: null,
      lastPosY: null,
      isPressingMouse: false,
      isDragging: false,
      isZooming: false,
      isDisableWheel: false,
      backgroundImage: null,
      NUM_OF_BODY_MAP_IMAGES,
      minStep: 0,
      maxStep: NUM_OF_BODY_MAP_IMAGES - 1,
      scanMinLine: null,
      scanMaxLine: null,
      scanBox: null,
      bodyMapPositions,
      selectedLine: null,
      isAddLocal: false,
      isVisibleModelConfirmDelete: false,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    imageUrl() {
      return `/img/body-maps/bodyMap.origin-1.png`
    },
  },
  watch: {
    minStep() {
      this.drawScanLine()
    },
    maxStep() {
      this.drawScanLine()
    },
    isAddLocal() {
      this.drawScanLine()
    },
    digitalLocalizers() {
      this.setStep()
    },
    'bodyPart.selected'() {
      this.setStep()
    },
  },
  async mounted() {
    this.onInitCanvas()
    this.drawCanvasBackground()
    this.drawScanLine()
    await this.fetchAllBodyParts()
    await this.fetchAllDigitalLocalizers()
    window.addEventListener('resize', this.onWindowSizeChanged)
    this.$refs.container.addEventListener('contextmenu', this.onContextMenu)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowSizeChanged)
    this.$refs.container.removeEventListener('contextmenu', this.onContextMenu)
  },
  methods: {
    ...mapActions('bodyService', ['getBodyParts']),
    onDelete() {
      this.isVisibleModelConfirmDelete = true
    },
    onConfirmDelete() {
      this.isVisibleModelConfirmDelete = false
      this.loading = true
      if (this.bodyPart.selected) {
        const localizer = this.digitalLocalizers.find((el) => el.bodyPartId == this.bodyPart.selected)
        if (localizer) {
          apiDelete(`digitalLocalizer/${localizer.bodyPartId}`, this.accessToken)
            .then(() => {
              this.$notify({ type: 'success', text: 'Digital localizer deleted successfully' })
              this.digitalLocalizers = this.digitalLocalizers.filter((el) => el.bodyPartId != localizer.bodyPartId)
              this.setStep()
              this.loading = false
            })
            .catch((error) => {
              this.$notify({ type: 'error', text: 'Failed to delete digital localizer' })
              console.error(error)
              this.loading = false
            })
        } else {
          this.isAddLocal = false
          this.$notify({ type: 'success', text: 'Digital localizer deleted successfully' })
          this.loading = false
        }
      } else {
        this.$notify({ type: 'error', text: 'Please select a body part to delete' })
        this.loading = false
      }
    },
    onAdd() {
      this.isAddLocal = true
      this.minStep = 111
      this.maxStep = 234
    },
    onSave() {
      if (this.bodyPart.selected) {
        const localizer = this.digitalLocalizers.find((el) => el.bodyPartId == this.bodyPart.selected)
        if (!localizer) {
          apiPost(
            'digitalLocalizer',
            {
              bodyPartId: this.bodyPart.selected,
              minStep: this.minStep,
              maxStep: this.maxStep,
            },
            this.accessToken
          )
            .then(() => {
              this.$notify({ type: 'success', text: 'Digital localizer updated successfully' })
              this.digitalLocalizers.push({
                bodyPartId: this.bodyPart.selected,
                minStep: this.minStep,
                maxStep: this.maxStep,
              })
            })
            .catch((error) => {
              this.$notify({ type: 'error', text: 'Failed to update digital localizer' })
              console.error(error)
            })
        } else {
          apiPut(
            `digitalLocalizer/${localizer.bodyPartId}`,
            {},
            {
              minStep: this.minStep,
              maxStep: this.maxStep,
            },
            this.accessToken
          )
            .then(() => {
              this.$notify({ type: 'success', text: 'Digital localizer updated successfully' })
              localizer.minStep = this.minStep
              localizer.maxStep = this.maxStep
            })
            .catch((error) => {
              this.$notify({ type: 'error', text: 'Failed to update digital localizer' })
              console.error(error)
            })
        }
      } else {
        this.$notify({ type: 'error', text: 'Please select a body part and set the steps' })
      }
    },
    setStep() {
      if (this.digitalLocalizers.length > 0) {
        const localizer = this.digitalLocalizers.find((el) => el.bodyPartId == this.bodyPart.selected)
        if (localizer) {
          this.minStep = localizer.minStep
          this.maxStep = localizer.maxStep
          this.isAddLocal = true
        } else {
          this.minStep = 0
          this.maxStep = NUM_OF_BODY_MAP_IMAGES - 1
          this.isAddLocal = false
        }
      } else {
        this.isAddLocal = false
        this.minStep = 0
        this.maxStep = NUM_OF_BODY_MAP_IMAGES - 1
      }
      this.drawScanLine()
    },
    async fetchAllBodyParts() {
      this.loading = true
      this.bodyPart.items = await this.getBodyParts()
      this.bodyPart.items = _.orderBy(this.bodyPart.items, ['name'], ['asc'])
      this.bodyPart = {
        ...this.bodyPart,
      }
      this.loading = false
    },
    async fetchAllDigitalLocalizers() {
      this.loading = true
      try {
        const response = await apiGet('digitalLocalizer/all', this.accessToken)
        this.digitalLocalizers = response.data.data || []
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to load digital localizers' })
        this.error = error
      } finally {
        this.loading = false
      }
    },
    onWindowSizeChanged() {
      this.onInitCanvas()
      this.drawCanvasBackground()
      this.drawScanLine()
    },
    drawCanvasBackground() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      this.canvasRealWidth = boundingRec.width
      this.canvasRealHeight = boundingRec.height
      fabric.Image.fromURL(this.imageUrl, (img) => {
        if (this.backgroundImage) {
          this.canvas.remove(this.backgroundImage)
        }
        this.backgroundImage = img
        img.set({ left: this.canvasRealWidth / 2 - img.width / 2 - 10, top: 0 })
        img.evented = false
        img.selectable = false
        this.canvas.add(img)
        this.canvas.moveTo(img, 0)

        this.drawScanLine()
      })
    },
    drawScanLine() {
      if (!this.canvas) {
        return
      }

      if (!this.backgroundImage) {
        return
      }

      const leftCoord = this.canvasRealWidth / 2 - this.backgroundImage.width / 2
      const rightCoord = this.canvasRealWidth / 2 + this.backgroundImage.width / 2

      const scanMinLineTop = _.get(
        this.bodyMapPositions.find((el) => el.index == this.minStep),
        ['y'],
        0
      )
      if (this.scanMinLine) {
        this.scanMinLine.top = scanMinLineTop
        this.scanMinLine.left = leftCoord
        this.scanMinLine.right = rightCoord
        this.scanMinLine.visible = this.isAddLocal
        this.canvas.requestRenderAll()
      } else {
        this.scanMinLine = new fabric.Line([leftCoord, scanMinLineTop, rightCoord, scanMinLineTop], {
          strokeWidth: 4,
          stroke: '#FBCD18',
          selectable: false,
          evented: false,
          globalCompositeOperation: 'source-atop',
          name: 'scanMinLine',
          visible: this.isAddLocal,
        })

        this.canvas.add(this.scanMinLine)
      }

      const scanMaxLineTop = _.get(
        this.bodyMapPositions.find((el) => el.index == this.maxStep),
        ['y'],
        0
      )
      if (this.scanMaxLine) {
        this.scanMaxLine.top = scanMaxLineTop
        this.scanMaxLine.left = leftCoord
        this.scanMaxLine.right = rightCoord
        this.scanMaxLine.visible = this.isAddLocal
        this.canvas.requestRenderAll()
      } else {
        this.scanMaxLine = new fabric.Line([leftCoord, scanMaxLineTop, rightCoord, scanMaxLineTop], {
          strokeWidth: 4,
          stroke: '#FBCD18',
          selectable: false,
          evented: false,
          globalCompositeOperation: 'source-atop',
          name: 'scanMaxLine',
          visible: this.isAddLocal,
        })

        this.canvas.add(this.scanMaxLine)
      }

      if (this.scanBox) {
        this.scanBox.top = scanMinLineTop
        this.scanBox.left = leftCoord
        this.scanBox.width = rightCoord - leftCoord
        this.scanBox.scaleY = (scanMaxLineTop - scanMinLineTop) / 100
        this.scanBox.visible = this.isAddLocal
        this.canvas.requestRenderAll()
      } else {
        this.scanBox = new fabric.Rect({
          left: leftCoord,
          top: scanMinLineTop,
          width: rightCoord - leftCoord,
          height: 100,
          fill: 'rgba(251, 205, 24, 0.3)',
          stroke: '#FBCD18',
          strokeWidth: 0,
          selectable: false,
          evented: false,
          name: 'scanBox',
          globalCompositeOperation: 'source-atop',
          visible: this.isAddLocal,
        })
        this.scanBox.scaleY = (scanMaxLineTop - scanMinLineTop) / 100

        this.canvas.add(this.scanBox)
      }
    },
    onInitCanvas() {
      const boundingRec = this.$refs.container.getBoundingClientRect()
      let c = this.$refs.canvas
      c.width = boundingRec.width
      c.height = boundingRec.height
      this.canvasRealWidth = boundingRec.width
      this.canvasRealHeight = boundingRec.height

      if (!this.canvas) {
        this.canvas = new fabric.Canvas('digitalLocalizerConfigCanvas', {
          selection: false,
          fireRightClick: true,
          width: boundingRec.width,
          height: boundingRec.height,
        })
      }

      this.canvas.setDimensions({
        width: boundingRec.width,
        height: boundingRec.height,
      })

      this.canvas.on({
        'mouse:down': this.onMouseDown,
        'mouse:move': this.onMouseMove,
        'mouse:up': this.onMouseUp,
      })
    },
    onContextMenu(e) {
      e.preventDefault()
    },
    isBoundingBoxIncludeAbsolutePosition(boundingBox, x, y) {
      return (
        x >= boundingBox.left &&
        x <= boundingBox.left + boundingBox.width &&
        y >= boundingBox.top &&
        y <= boundingBox.top + boundingBox.height
      )
    },
    expandBox(boundingBox, expandSize) {
      return {
        left: boundingBox.left,
        top: boundingBox.top - expandSize,
        width: boundingBox.width,
        height: boundingBox.height + expandSize * 2,
      }
    },
    onMouseDown(e) {
      e.e.preventDefault()
      let scanMaxLineBoundingBox = this.scanMaxLine.getBoundingRect()
      scanMaxLineBoundingBox = this.expandBox(scanMaxLineBoundingBox, 10)
      let scanMinLineBoundingBox = this.scanMinLine.getBoundingRect()
      scanMinLineBoundingBox = this.expandBox(scanMinLineBoundingBox, 10)
      let scanBoxBoundingBox = this.scanBox.getBoundingRect()
      if (this.isBoundingBoxIncludeAbsolutePosition(scanMaxLineBoundingBox, e.pointer.x, e.pointer.y)) {
        this.selectedLine = 'scanMaxLine'
        this.isZooming = false
        this.isDragging = false
      } else if (this.isBoundingBoxIncludeAbsolutePosition(scanMinLineBoundingBox, e.pointer.x, e.pointer.y)) {
        this.selectedLine = 'scanMinLine'
        this.isZooming = false
        this.isDragging = false
      } else if (this.isBoundingBoxIncludeAbsolutePosition(scanBoxBoundingBox, e.pointer.x, e.pointer.y)) {
        this.selectedLine = 'scanBox'
        this.isZooming = false
        this.isDragging = false
      } else {
        this.selectedLine = null
      }
      // No selection
      if (!e.target) {
        if (e.e.ctrlKey) {
          this.isZooming = false
          this.isDragging = true
        } else if (e.button != 3) {
          this.isPressingMouse = true
        } else {
          this.isDragging = false
          this.isZooming = true
        }

        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
      }
    },
    onMouseUp() {
      this.isPressingMouse = false
      this.canvas.setViewportTransform(this.canvas.viewportTransform)
      this.isDragging = false
      this.isZooming = false
      this.selectedLine = null
    },
    onMouseMove(e) {
      if (this.isDragging) {
        const vpt = this.canvas.viewportTransform
        vpt[4] += e.e.clientX - this.lastPosX
        vpt[5] += e.e.clientY - this.lastPosY
        this.canvas.requestRenderAll()
        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
        return
      } else if (this.isZooming) {
        let delta = e.e.clientY - this.lastPosY
        let zoom = this.canvas.getZoom()
        zoom *= 0.99 ** delta
        if (zoom > 20) zoom = 20
        if (zoom < 0.01) zoom = 0.01
        this.canvas.zoomToPoint({ x: this.canvasRealWidth / 2, y: this.canvasRealHeight / 2 }, zoom)

        this.lastPosX = e.e.clientX
        this.lastPosY = e.e.clientY
        return
      }

      if (this.isDisableWheel) {
        return
      }

      if (this.selectedLine) {
        const cursorOnImageY = e.absolutePointer.y
        const stepInfo = this.bodyMapPositions.find((el) => el.y > cursorOnImageY)

        if (this.selectedLine === 'scanMinLine') {
          this.minStep = stepInfo ? stepInfo.index : NUM_OF_BODY_MAP_IMAGES - 1
          if (this.minStep > this.maxStep) {
            const tmp = this.minStep
            this.minStep = this.maxStep
            this.maxStep = tmp
          }
        } else if (this.selectedLine === 'scanMaxLine') {
          this.maxStep = stepInfo ? stepInfo.index : NUM_OF_BODY_MAP_IMAGES - 1
          if (this.maxStep < this.minStep) {
            const tmp = this.maxStep
            this.maxStep = this.minStep
            this.minStep = tmp
          }
        } else if (this.selectedLine === 'scanBox') {
          const movementY = e.e.clientY - this.lastPosY
          if (movementY === 0) {
            return
          }
          const lastMinStepInfo = this.bodyMapPositions.find((el) => el.index == this.minStep)
          const lastMaxStepInfo = this.bodyMapPositions.find((el) => el.index == this.maxStep)
          const cursorOnImageMinY = lastMinStepInfo.y + movementY * this.backgroundImage.scaleY
          const cursorOnImageMaxY = lastMaxStepInfo.y + movementY * this.backgroundImage.scaleY
          const stepMinInfo =
            movementY < 0
              ? _.reverse(_.cloneDeep(this.bodyMapPositions)).find((el) => el.y < cursorOnImageMinY)
              : this.bodyMapPositions.find((el) => el.y > cursorOnImageMinY)
          const stepMaxInfo =
            movementY < 0
              ? _.reverse(_.cloneDeep(this.bodyMapPositions)).find((el) => el.y < cursorOnImageMaxY)
              : this.bodyMapPositions.find((el) => el.y > cursorOnImageMaxY)
          if (stepMinInfo) {
            this.minStep = stepMinInfo.index
          } else {
            this.minStep = 0
          }
          if (stepMaxInfo) {
            this.maxStep = stepMaxInfo.index
          } else {
            this.maxStep = NUM_OF_BODY_MAP_IMAGES - 1
          }
          if (this.minStep > this.maxStep) {
            const tmp = this.minStep
            this.minStep = this.maxStep
            this.maxStep = tmp
          }
          this.lastPosY = e.e.clientY
        }
      }
    },
    onMousewheel(e) {
      e.preventDefault()
      if (this.isDisableWheel) {
        return
      }
      if (e.deltaY > 0) {
        // this.adjustTimingDecisionStep(2)
      } else {
        // this.adjustTimingDecisionStep(-2)
      }
    },
  },
}
</script>
<style lang="scss" scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba($color: #ffffff, $alpha: 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.btn-save {
  padding: 0 32px !important;
}
</style>
