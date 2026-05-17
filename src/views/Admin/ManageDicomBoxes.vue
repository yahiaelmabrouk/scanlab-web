<template>
  <div style="padding: 10px">
    <div v-if="!isLoadedAndReady">
      <LoadingBeaker :loading-percentage="progressTotal" />
    </div>
    <template v-else>
      <v-row>
        <v-col>
          <div class="mt-10 mb-10">
            <h2>{{ $t('global.manage_dicom_boxes') }}</h2>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="6">
          <b-card class="mb-2 mx-2 h-100">
            <v-row>
              <v-col>
                <b-card>
                  <div class="text-start mb-3">
                    <h5 style="text-align: left">{{ $t('BoxesManager.select_dicom') }}</h5>
                    <span class="subtitle">{{ `Select a dicom to work with` }}</span>
                  </div>
                  <v-autocomplete
                    v-model="dicomFileSets.selected"
                    :items="dicomFileSets.items"
                    item-text="title"
                    item-value="id"
                    menu-props="auto"
                  />
                </b-card>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <b-card>
                  <div class="text-start mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <h5>{{ $t('BoxesManager.available_stack') }}</h5>
                    </div>
                  </div>
                  <b-list-group class="text-start">
                    <b-list-group-item
                      v-for="item in stackConfigOptions"
                      :key="`${item.text}-${selectedStackName}`"
                      action
                      :active="item.text == selectedStackName"
                      @click="onClickConfig(item)"
                    >
                      <div class="d-flex justify-content-between">
                        <span>
                          {{ item.text }}
                        </span>
                      </div>
                    </b-list-group-item>
                  </b-list-group>
                </b-card>
              </v-col>
            </v-row>
            <v-row class="d-flex justify-center align-items-center" style="padding: 0 12px; gap: 12px">
              <v-btn color="secondary" class="btn-save" size="sm" @click="onSaveDicomBoxes()">{{
                $t('global.save')
              }}</v-btn>
            </v-row>
          </b-card>
        </v-col>
        <v-col cols="6">
          <b-card class="h-100">
            <div class="box-config-container">
              <div class="box-config-item">
                <span>{{ $t('global.dot_size') }}</span>
                <v-slider
                  class="dot-size-slider"
                  v-model.number="dotScaleMultiplierIndex"
                  :min="0"
                  :max="dotScaleValues.length - 1"
                  ticks
                >
                </v-slider>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <div class="box-config-item">
                  <v-checkbox
                    class="mt-1 mb-2"
                    v-model="isSyncDicomBoxValue"
                    :label="$t('global.sync_dicom_boxes')"
                  ></v-checkbox>
                </div>
                <div
                  v-for="toggleGroupName in Object.keys(testToggles)"
                  :key="toggleGroupName"
                  class="d-flex justify-content-between align-items-center gap-3"
                >
                  <div
                    v-for="(testToggle, index) in testToggles[toggleGroupName]"
                    :key="testToggle.toggleName"
                    class="view-option"
                  >
                    <span>{{ getProperToggleName(testToggle.toggleName) }}</span>
                    <div
                      class="scanlab-toggle ms-2"
                      :class="{ 'scanlab-toggle--disabled': !isHasAnyConfig }"
                      :key="index"
                      :v-model="testToggles[toggleGroupName][index].visible"
                      @click="toggleSlider(toggleGroupName, index)"
                    >
                      <span :class="{ on: true, active: testToggles[toggleGroupName][index].visible }">
                        {{ $t('global.on') }}
                      </span>
                      <span :class="{ off: true, active: !testToggles[toggleGroupName][index].visible }">
                        {{ $t('global.off') }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-2" style="height: auto">
              <DicomBoxSliceView
                ref="sliceViewContainer"
                :selected-stack-name="selectedStackNameToStackName"
                :show-stack-selection="true"
                :view-orientation="'z'"
                :am-fullscreen="false"
                :editable="false"
                :preview-limited-ct-model-planes="[]"
                :is-preview-slice-view="true"
                :is-show-point-selection-answer-area="false"
                :is-preview-critical-thinking-question="false"
                :is-in-critical-thinking-question="false"
                :is-show-critical-question-result="false"
              />
            </div>
            <div class="mt-3">
              <b-card>
                <div class="mb-5">
                  <div class="text-center">
                    <span class="subtitle">{{ currentLocalizerStackConfig ? `Box defined` : `No box defined` }}</span>
                  </div>
                </div>
                <div class="d-flex align-items-center justify-content-center">
                  <b-button
                    v-if="currentLocalizerStackConfig"
                    class="mr-2"
                    variant="danger"
                    @click="onDeleteSelectedBox()"
                    >{{ `Delete` }}</b-button
                  >
                  <b-button v-if="!currentLocalizerStackConfig" class="mr-2" variant="primary" @click="addBox()">{{
                    `Add`
                  }}</b-button>
                </div>
              </b-card>
            </div>
          </b-card>
        </v-col>
      </v-row>
      <v-dialog v-model="isDeleteModalOpen" width="600px">
        <v-card outlined>
          <v-card-title>
            <span class="headline">
              {{ `Are you sure to delete dicom box of stack "${selectedStackName}"?` }}
            </span>
          </v-card-title>

          <v-card-actions class="right">
            <v-spacer></v-spacer>
            <v-btn outlined @click="isDeleteModalOpen = false">
              {{ $t('global.cancel') }}
            </v-btn>
            <v-btn color="error" @click="deleteSelectedBox()">
              {{ $t('global.delete') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>
<script>
import DicomBoxSliceView from '@/components/DicomBoxSliceView'
import LoadingBeaker from '@/components/LoadingBeaker'
import { mapActions, mapState } from 'vuex'
import { apiGet, apiPut } from '../../util/api'
import _ from 'lodash'
import * as THREE from 'three'
import { mapGetters } from 'vuex/dist/vuex.common.js'
import { LOCALIZER_BOX_IDENT, SCAN_BOX_IDENT } from '../../constants'
import { greatestAxisAbsXYZ } from '../../lib/math-util'
export default {
  name: 'ManageDicomBoxes',
  components: {
    DicomBoxSliceView,
    LoadingBeaker,
  },
  data() {
    return {
      dicomFileSets: {
        items: [],
        selected: null,
      },
      isLoadingConfig: false,
      selectedStackName: '',
      localizerBoundingBoxes: [],
      scanBoundingBoxes: [],
      isDeleteModalOpen: false,
      initialDotScaleMultiplierIndex: 1,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('selectionConfig', ['selectionConfigsByIdent']),
    ...mapState('dicomService', ['dicomFileSet', 'isLoaded', 'progressTotal', 'isSyncDicomBox']),
    ...mapState('stackService', ['stackConfigs']),
    ...mapGetters('selectionConfig', [
      'dotScaleValues',
      'currentSelectionConfigVisible',
      'selectionConfigsCurrentGroupId',
    ]),
    isSyncDicomBoxValue: {
      get() {
        return this.isSyncDicomBox
      },
      set(value) {
        this.setIsSyncDicomBox(value)
      },
    },
    stackConfigOptions() {
      // Dont't show the base HD stacks unless we are in debug mode
      const allowedConfigs = _.filter(this.stackConfigs, (c) => !c.hidden)
      let options = _.map(allowedConfigs, (config) => {
        const localizerNames = _.get(this.dicomFileSet, 'localizerNames', {})
        const label = localizerNames[`${config.renameIdent}`]
        return {
          value: config,
          configName: config.name,
          text: label || config.name,
        }
      })
      return options
    },
    selectedStackNameToStackName() {
      return _.get(
        _.find(this.stackConfigOptions, { text: this.selectedStackName }),
        'configName',
        this.selectedStackName
      )
    },
    isLoadedAndReady() {
      return (
        this.isLoaded &&
        !this.isLoadingConfig &&
        this.$store.state.selectionConfig.ready &&
        this.$store.state.threeJSSVGProvider.hasLoaded
      )
    },
    selectedDicom() {
      return _.find(this.dicomFileSets.items, { id: this.dicomFileSets.selected })
    },
    currentLocalizerStackConfig() {
      return this.localizerBoundingBoxes.find((el) => el.name == this.selectedStackName)
    },
    currentScanStackConfig() {
      const scanBox = this.scanBoundingBoxes.find((el) => el.name == this.selectedStackName)
      const localizerBox = _.cloneDeep(this.localizerBoundingBoxes.find((el) => el.name == this.selectedStackName))
      if (localizerBox && localizerBox.config && localizerBox.config.dimensions3) {
        localizerBox.config.dimensions3 = {
          ...localizerBox.config.dimensions3,
          x: Math.max(20, localizerBox.config.dimensions3.x - 20),
          y: Math.max(20, localizerBox.config.dimensions3.y - 20),
          z: Math.max(20, localizerBox.config.dimensions3.z - 20),
        }
      }
      return scanBox ? scanBox : localizerBox
    },
    isHasAnyConfig() {
      return this.currentLocalizerStackConfig || this.currentScanStackConfig
    },
    dotScaleMultiplier: {
      get() {
        return this.$store.state.selectionConfig.dotScaleMultiplier
      },
      set(dotScaleMultiplier) {
        this.$store.dispatch('selectionConfig/setDotScaleMultiplier', dotScaleMultiplier)
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
    testToggles() {
      return Object.keys(this.selectionConfigsByIdent).reduce((newTestToggles, toggleName) => {
        const [groupName] = toggleName.trim().split('_')
        if (!newTestToggles[groupName]) newTestToggles[groupName] = []

        newTestToggles[groupName].push({
          toggleName,
          visible: this.selectionConfigsByIdent[toggleName].visible,
        })

        return newTestToggles
      }, {})
    },
  },
  watch: {
    'dicomFileSets.selected': function () {
      this.onInitBoxesWhenDicomChanged()
      this.localizerBoundingBoxes = _.get(this.selectedDicom, ['localizerBoundingBoxes'], [])
      this.scanBoundingBoxes = _.get(this.selectedDicom, ['scanBoundingBoxes'], [])
    },
    stackConfigOptions: function () {
      this.selectedStackName = _.get(this.stackConfigOptions, [0, 'text'], '')
    },
    selectedStackName: function () {
      this.setLocalizerBoxConfig()
      this.setScanBoxConfig()
    },
    isLoadedAndReady: function () {
      this.setLocalizerBoxConfig()
      this.setScanBoxConfig()
    },
    localizerBoundingBoxes: function () {
      this.setLocalizerBoxConfig()
      this.setScanBoxConfig()
    },
    scanBoundingBoxes: function () {
      this.setScanBoxConfig()
    },
  },
  async mounted() {
    this.initialDotScaleMultiplierIndex = this.dotScaleMultiplierIndex
    this.setIsManageDicomBox(true)
    this.$store.dispatch('selectionConfig/setIsVolumeViewMode', true)
    await this.fetchDicomFileSets(true)
  },
  beforeDestroy() {
    this.setIsManageDicomBox(false)
    this.$store.dispatch('selectionConfig/setIsVolumeViewMode', false)
    this.$store.dispatch('dicomService/reset', { isResetLoadedDicomFileSets: true })
    this.dotScaleMultiplierIndex = this.initialDotScaleMultiplierIndex
  },
  methods: {
    ...mapActions('dicomService', ['setIsManageDicomBox', 'setIsSyncDicomBox']),
    ...mapActions('selectionConfig', ['setSelectionConfigCurrentIdent']),
    getProperToggleName(selectionIdent) {
      const identType = selectionIdent.trim().split('_')[1]

      let properType = ''

      if (identType === LOCALIZER_BOX_IDENT) properType = 'Localizer Box'
      if (identType === SCAN_BOX_IDENT) properType = 'Body Box'

      return properType ? `${properType}` : `${this.$t('MRI.display_slices')}`
    },
    toggleSlider(toggleGroupName, index) {
      const { toggleName, visible } = this.testToggles[toggleGroupName][index]
      this.$store.dispatch('selectionConfig/setSelectionConfig', {
        ident: toggleName,
        skipSyncingOtherGroups: true,
        selectionConfig: { visible: !visible },
      })
    },
    toggleDisplaySlice(visible) {
      this.$store.dispatch('selectionConfig/setSelectionConfig', {
        skipSyncingOtherGroups: true,
        ident: `${this.selectionConfigsCurrentGroupId}_${LOCALIZER_BOX_IDENT}`,
        selectionConfig: { visible: visible },
      })
      this.$store.dispatch('selectionConfig/setSelectionConfig', {
        skipSyncingOtherGroups: true,
        ident: `${this.selectionConfigsCurrentGroupId}_${SCAN_BOX_IDENT}`,
        selectionConfig: { visible: visible },
      })
    },
    async fetchDicomFileSets(resetSelected) {
      let response = await apiGet(`dicomFileSets`, this.accessToken)
      this.dicomFileSets = {
        items: response.data.map((item) => {
          return {
            ...item,
            title: `${item.name} (${item.id})`,
          }
        }),
        selected: resetSelected ? _.get(response.data, [0, 'id'], null) : this.dicomFileSets.selected,
      }
    },
    async onInitBoxesWhenDicomChanged() {
      if (this.dicomFileSets.selected) {
        await this.$store.dispatch('dicomService/reset', { isResetLoadedDicomFileSets: true })
        await this.$store.dispatch('selectionConfig/init')
        await this.$store.dispatch('interactableService/reset', {})
        await this.$store.dispatch('stackService/resetStackConfigs', {})
        await this.$store.dispatch(
          'selectionConfig/addManageDicomBoxesSelectionConfigGroup',
          { groupId: 0 },
          { root: true }
        )
        await this.$store.dispatch('dicomService/loadDicomGroup', {
          dicomFileSetId: this.dicomFileSets.selected,
          reset: true,
        })

        await this.$store.dispatch('selectionConfig/selectTool', { tool: 'pan' })
      }
      await this.setLocalizerBoxConfig()
      await this.setScanBoxConfig()
    },
    async setLocalizerBoxConfig() {
      if (this.currentLocalizerStackConfig && this.currentLocalizerStackConfig.config) {
        const ident = `${this.selectionConfigsCurrentGroupId}_${LOCALIZER_BOX_IDENT}`
        await this.$store.dispatch('selectionConfig/adjustSelectionConfig', {
          selectionConfig: {
            center3: new THREE.Vector3(
              _.get(this.currentLocalizerStackConfig.config, ['center3', 'x'], 0),
              _.get(this.currentLocalizerStackConfig.config, ['center3', 'y'], 0),
              _.get(this.currentLocalizerStackConfig.config, ['center3', 'z'], 0)
            ),
            dimensions3: new THREE.Vector3(
              _.get(this.currentLocalizerStackConfig.config, ['dimensions3', 'x'], 300),
              _.get(this.currentLocalizerStackConfig.config, ['dimensions3', 'y'], 300),
              _.get(this.currentLocalizerStackConfig.config, ['dimensions3', 'z'], 300)
            ),
            xDirection3: new THREE.Vector3(
              _.get(this.currentLocalizerStackConfig.config, ['xDirection3', 'x'], 1),
              _.get(this.currentLocalizerStackConfig.config, ['xDirection3', 'y'], 0),
              _.get(this.currentLocalizerStackConfig.config, ['xDirection3', 'z'], 0)
            ),
            yDirection3: new THREE.Vector3(
              _.get(this.currentLocalizerStackConfig.config, ['yDirection3', 'x'], 0),
              _.get(this.currentLocalizerStackConfig.config, ['yDirection3', 'y'], 1),
              _.get(this.currentLocalizerStackConfig.config, ['yDirection3', 'z'], 0)
            ),
            zDirection3: new THREE.Vector3(
              _.get(this.currentLocalizerStackConfig.config, ['zDirection3', 'x'], 0),
              _.get(this.currentLocalizerStackConfig.config, ['zDirection3', 'y'], 0),
              _.get(this.currentLocalizerStackConfig.config, ['zDirection3', 'z'], 1)
            ),
          },
          ident,
        })
        this.toggleDisplaySlice(true)
      } else {
        if (this.$refs.sliceViewContainer) {
          this.setSelectionConfigCurrentIdent({
            ident: `${this.selectionConfigsCurrentGroupId}_${LOCALIZER_BOX_IDENT}`,
          })
          this.$refs.sliceViewContainer.setSelectionToSliceMidpointOfLocalizerBoxAndScanBox(true)
        }
        this.toggleDisplaySlice(false)
      }
    },
    async setScanBoxConfig() {
      if (this.currentScanStackConfig && this.currentScanStackConfig.config) {
        const ident = `${this.selectionConfigsCurrentGroupId}_${SCAN_BOX_IDENT}`
        await this.$store.dispatch('selectionConfig/adjustSelectionConfig', {
          selectionConfig: {
            center3: new THREE.Vector3(
              _.get(this.currentScanStackConfig.config, ['center3', 'x'], 0),
              _.get(this.currentScanStackConfig.config, ['center3', 'y'], 0),
              _.get(this.currentScanStackConfig.config, ['center3', 'z'], 0)
            ),
            dimensions3: new THREE.Vector3(
              _.get(this.currentScanStackConfig.config, ['dimensions3', 'x'], 300),
              _.get(this.currentScanStackConfig.config, ['dimensions3', 'y'], 300),
              _.get(this.currentScanStackConfig.config, ['dimensions3', 'z'], 300)
            ),
            xDirection3: new THREE.Vector3(
              _.get(this.currentScanStackConfig.config, ['xDirection3', 'x'], 1),
              _.get(this.currentScanStackConfig.config, ['xDirection3', 'y'], 0),
              _.get(this.currentScanStackConfig.config, ['xDirection3', 'z'], 0)
            ),
            yDirection3: new THREE.Vector3(
              _.get(this.currentScanStackConfig.config, ['yDirection3', 'x'], 0),
              _.get(this.currentScanStackConfig.config, ['yDirection3', 'y'], 1),
              _.get(this.currentScanStackConfig.config, ['yDirection3', 'z'], 0)
            ),
            zDirection3: new THREE.Vector3(
              _.get(this.currentScanStackConfig.config, ['zDirection3', 'x'], 0),
              _.get(this.currentScanStackConfig.config, ['zDirection3', 'y'], 0),
              _.get(this.currentScanStackConfig.config, ['zDirection3', 'z'], 1)
            ),
          },
          ident,
        })
        this.toggleDisplaySlice(true)
      } else {
        if (this.$refs.sliceViewContainer) {
          this.setSelectionConfigCurrentIdent({ ident: `${this.selectionConfigsCurrentGroupId}_${SCAN_BOX_IDENT}` })
          this.$refs.sliceViewContainer.setSelectionToSliceMidpointOfLocalizerBoxAndScanBox(true)
        }
        this.toggleDisplaySlice(false)
      }
    },
    addBox() {
      this.toggleDisplaySlice(true)
      this.onConfirmDicomBoxes()
    },
    syncDimension3OfScanBoxes(dirs = []) {
      if (!this.isSyncDicomBoxValue) {
        return
      }
      const config = this.scanBoundingBoxes.find((el) => el.name == this.selectedStackName)
      if (config) {
        this.scanBoundingBoxes = this.scanBoundingBoxes.map((el) => {
          dirs.forEach((dir) => {
            el.config.dimensions3[dir] = config.config.dimensions3[dir]
          })
          return el
        })
      }
    },
    deleteSelectedBox() {
      if (this.selectedStackName) {
        this.localizerBoundingBoxes = this.localizerBoundingBoxes.filter((el) => el.name != this.selectedStackName)
        this.scanBoundingBoxes = this.scanBoundingBoxes.filter((el) => el.name != this.selectedStackName)
      }
      this.$notify({ type: 'success', text: 'Deleted' })
      this.isDeleteModalOpen = false
    },
    onDeleteSelectedBox() {
      this.isDeleteModalOpen = true
    },
    async onSaveDicomBoxes() {
      this.onConfirmDicomBoxes()
      try {
        const data = this.localizerBoundingBoxes.map((el) => {
          return {
            name: el.name,
            config: el.config,
          }
        })
        const scanData = this.scanBoundingBoxes.map((el) => {
          return {
            name: el.name,
            config: el.config,
          }
        })
        await apiPut(
          `dicomFileSets/${this.dicomFileSets.selected}`,
          {},
          { localizerBoundingBoxes: data, scanBoundingBoxes: scanData },
          this.accessToken
        )
        await this.fetchDicomFileSets(false)
        this.$notify({ text: 'Saved' })
      } catch (e) {
        this.$notify({ type: 'error', text: 'Failed to change dicom settings' })
      }
    },
    onConfirmDicomBoxes() {
      const localizerIdent = `${this.selectionConfigsCurrentGroupId}_${LOCALIZER_BOX_IDENT}`
      const localizerConfig = this.selectionConfigsByIdent[localizerIdent]

      const scanIdent = `${this.selectionConfigsCurrentGroupId}_${SCAN_BOX_IDENT}`
      const scanConfig = this.selectionConfigsByIdent[scanIdent]

      if (localizerConfig) {
        const { center3, dimensions3, xDirection3, yDirection3, zDirection3 } = localizerConfig
        if (center3 && dimensions3 && xDirection3 && yDirection3 && zDirection3 && this.selectedStackName) {
          this.localizerBoundingBoxes = this.localizerBoundingBoxes.map((el) => {
            if (el.name == this.selectedStackName) {
              el.config.center3 = center3.clone()
              el.config.dimensions3 = dimensions3.clone()
              el.config.xDirection3 = xDirection3.clone()
              el.config.yDirection3 = yDirection3.clone()
              el.config.zDirection3 = zDirection3.clone()
            }

            return el
          })
          if (!this.localizerBoundingBoxes.find((el) => el.name == this.selectedStackName)) {
            this.localizerBoundingBoxes = [
              ...this.localizerBoundingBoxes,
              {
                name: this.selectedStackName,
                config: {
                  center3: center3.clone(),
                  dimensions3: dimensions3.clone(),
                  xDirection3: xDirection3.clone(),
                  yDirection3: yDirection3.clone(),
                  zDirection3: zDirection3.clone(),
                },
              },
            ]
          }
        }
      }

      if (scanConfig) {
        const { center3, dimensions3, xDirection3, yDirection3, zDirection3 } = scanConfig
        if (center3 && dimensions3 && xDirection3 && yDirection3 && zDirection3 && this.selectedStackName) {
          this.scanBoundingBoxes = this.scanBoundingBoxes.map((el) => {
            if (el.name == this.selectedStackName) {
              el.config.center3 = center3.clone()
              el.config.dimensions3 = dimensions3.clone()
              el.config.xDirection3 = xDirection3.clone()
              el.config.yDirection3 = yDirection3.clone()
              el.config.zDirection3 = zDirection3.clone()
            }

            return el
          })
          if (!this.scanBoundingBoxes.find((el) => el.name == this.selectedStackName)) {
            this.scanBoundingBoxes = [
              ...this.scanBoundingBoxes,
              {
                name: this.selectedStackName,
                config: {
                  center3: center3.clone(),
                  dimensions3: dimensions3.clone(),
                  xDirection3: xDirection3.clone(),
                  yDirection3: yDirection3.clone(),
                  zDirection3: zDirection3.clone(),
                },
              },
            ]
          }

          const dirs = ['x', 'y', 'z'].filter((el) => {
            const config = this.scanBoundingBoxes.find((o) => o.name == this.selectedStackName)
            const configDir = config.config[`${el}Direction3`]
            return (
              greatestAxisAbsXYZ(configDir.x, configDir.y, configDir.z) !=
              this.$refs.sliceViewContainer.cameraDirAxisName
            )
          })

          this.syncDimension3OfScanBoxes(dirs)
        }
      }
    },
    onClickConfig(item) {
      if (this.isHasAnyConfig) {
        this.onConfirmDicomBoxes()
      }
      this.selectedStackName = item.text
      this.$forceUpdate()
    },
  },
}
</script>
<style lang="scss">
.box-config-container {
  .box-config-item {
    display: flex;
    align-items: center;
    gap: 18px;
    .dot-size-slider {
      .v-input__control {
        .v-messages {
          display: none;
        }
      }
    }

    .v-input--checkbox {
      .v-input__control {
        .v-input__slot {
          margin-bottom: 0;
          .v-label {
            margin-bottom: 0;
          }
        }
        .v-messages {
          display: none;
        }
      }
    }
  }
}
</style>
<style lang="scss" scoped>
.view-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  user-select: none;
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

  &--disabled {
    cursor: not-allowed;
    pointer-events: none !important;
    background-color: $gray-two;
    opacity: 0.5;
  }

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
.gap-3 {
  gap: 1.5rem;
}
</style>
