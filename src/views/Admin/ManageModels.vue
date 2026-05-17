<template>
  <div style="padding: 10px">
    <v-row>
      <v-col>
        <div class="mt-10 mb-10">
          <h2>{{ $t('ModelManager.manage_models') }}</h2>
        </div>
        <v-row>
          <v-col cols="6">
            <b-card class="mb-2 mx-2">
              <v-row>
                <v-col>
                  <b-card>
                    <div class="text-start mb-3">
                      <h5 style="text-align: left">{{ $t('ModelManager.select_model') }}</h5>
                      <span class="subtitle">Select model to work with</span>
                    </div>
                    <v-select v-model="models.selected" :items="models.items" item-text="text" item-value="id" />
                  </b-card>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <b-card>
                    <div class="text-start mb-3">
                      <h5>{{ $t('ModelManager.select_body_part') }}</h5>
                      <span class="subtitle">Select body part to define body boxes</span>
                    </div>
                    <v-row>
                      <v-col>
                        <v-select
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
              <v-row v-if="isShowSelectSet">
                <v-col>
                  <b-card>
                    <div class="text-start mb-3">
                      <h5>{{ $t('ModelManager.select_patient_position_set') }}</h5>
                      <span class="subtitle">Select patient position set to define body boxes</span>
                    </div>
                    <v-row>
                      <v-col>
                        <v-select
                          v-model="patientPositionSet.selected"
                          :items="patientPositionSet.items"
                          item-text="name"
                          item-value="id"
                          menu-props="auto"
                        />
                      </v-col>
                    </v-row>
                  </b-card>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <b-card>
                    <div class="text-start mb-3">
                      <div class="d-flex justify-content-between align-items-center">
                        <h5>{{ $t('ModelManager.available_position') }}</h5>
                        <div class="d-flex justify-content-end">
                          <v-tooltip top>
                            <template #activator="{ on, attrs }">
                              <v-icon
                                color="primary"
                                class=""
                                v-bind="attrs"
                                v-on="on"
                                size="20"
                                @click="showModalCopyPositions"
                                >mdi-content-copy</v-icon
                              >
                            </template>
                            <p>Copy positions and bodyboxes from</p>
                          </v-tooltip>
                        </div>
                      </div>

                      <span class="subtitle"
                        >This is predefined positions for the selected body part. Select one to define the body box
                        for</span
                      >
                    </div>
                    <b-list-group class="text-start">
                      <b-list-group-item
                        v-for="item in availablePositionsForSelectedPositionSet"
                        :key="item.id"
                        action
                        :active="item.selected"
                        @click="availablePosOnClick(item)"
                      >
                        <div class="d-flex justify-content-between">
                          <span>
                            {{ `${item.value.join(', ')}${item.isShowHeadHolder ? `, ${getHeadholderText()}` : ''}` }}
                          </span>
                          <v-tooltip
                            top
                            v-if="item.id != currentPatientPositionValueId && isPatientPositionHasBodyBox(item.id)"
                          >
                            <template #activator="{ on, attrs }">
                              <v-icon
                                color="primary"
                                class=""
                                v-bind="attrs"
                                v-on="on"
                                size="20"
                                @click="onCopyBodyBoxFromPatientPosition($event, item.id)"
                                >mdi-content-copy</v-icon
                              >
                            </template>
                            <p>Copy bodybox from this patient position</p>
                          </v-tooltip>
                        </div>
                      </b-list-group-item>
                    </b-list-group>
                  </b-card>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <b-card>
                    <div class="mb-5">
                      <div class="text-start">
                        <h5>{{ $t('ModelManager.body_boxes') }}</h5>
                        <span class="subtitle">There is only one body box per selected position</span>
                      </div>
                      <!-- <b-button>Add</b-button> -->
                    </div>
                    <div class="mb-5">
                      <b-card v-if="currentBodyBox">
                        <b-row>
                          <b-col cols="8" class="d-flex align-items-center">{{
                            `X: ${Math.round(currentBodyBox.x || 0)}, Y: ${Math.round(
                              currentBodyBox.y || 0
                            )}, Z: ${Math.round(currentBodyBox.z || 0)}, W: ${currentBodyBox.width}, H: ${
                              currentBodyBox.height
                            }, L: ${currentBodyBox.length}`
                          }}</b-col>
                          <b-col cols="4" class="d-flex justify-content-end">
                            <b-button class="mr-2" variant="danger" @click="deleteBodyBox">Delete</b-button>
                            <b-button v-if="!isEditingBodyBox" class="mr-2" @click="changeBodyBox">Change</b-button>
                            <b-button v-else class="mr-2" @click="saveBodyBox">Confirm</b-button>
                          </b-col>
                        </b-row>
                      </b-card>
                      <div v-else>
                        <!-- <div class="no-item-text">No body box defined</div> -->
                        <div class="d-flex justify-content-center">
                          <b-button @click="addBodyBox">Add body box</b-button>
                        </div>
                      </div>
                    </div>

                    <!-- <b-list-group>
                    <b-list-group-item v-for="row in bodyBoxes.rows" action :active="row.active" @click="bodyBoxRowClick(row)">
                      <v-row>
                        <v-col cols="9">{{ row.name }}</v-col>
                        <v-col cols="3">
                          <b-button class="mb-1" variant="danger">Delete</b-button>
                          <b-button>Change</b-button>
                        </v-col>
                      </v-row>
                    </b-list-group-item>
                  </b-list-group> -->
                  </b-card>
                </v-col>
              </v-row>
              <v-row class="d-flex justify-content-center align-items-center" style="gap: 12px">
                <v-btn
                  v-if="!isEnablePreviewCopyPatientPositionFromSourceModel"
                  color="primary"
                  class="btn-save"
                  size="sm"
                  @click="onSaveBodyBoxes()"
                  >{{ $t('global.save') }}</v-btn
                >
                <template v-else>
                  <v-btn color="warning" class="btn-save" size="sm" @click="onCancelCopyAllBodyPartFromModel()">{{
                    $t('global.cancel')
                  }}</v-btn>
                  <v-btn color="primary" class="btn-save" size="sm" @click="onConfirmBodyBoxes()">{{
                    $t('global.confirm')
                  }}</v-btn>
                  <v-btn color="secondary" class="btn-save" size="sm" @click="onSaveAllPreviewBodyBoxes()">{{
                    $t('global.save_all')
                  }}</v-btn>
                </template>
              </v-row>
            </b-card>
          </v-col>
          <v-col cols="6">
            <b-card>
              <div style="height: 500px">
                <MRIMachineView
                  v-if="isCTLab"
                  ref="mriViewer"
                  :is-manage-model-mode="true"
                  :should-reset-patient-position="true"
                  :model-file-name="selectedModelFileName"
                  :is-editing-body-box="isEditingBodyBox"
                  @onMRILoaded="onMRILoaded"
                />
                <MRMRIMachineView
                  v-else
                  ref="mriViewer"
                  :is-manage-model-mode="true"
                  :should-reset-patient-position="true"
                  :model-file-name="selectedModelFileName"
                  :is-editing-body-box="isEditingBodyBox"
                  @onMRILoaded="onMRILoaded"
                />
              </div>
              <v-row class="mt-2 patient-info-container">
                <v-col>
                  <b-card>
                    <v-row>
                      <v-col cols="12" md="6" class="py-0 px-8">
                        <v-text-field
                          dense
                          required
                          outlined
                          placeholder="John Doe"
                          :label="$t('ScreeningForm.patient_name')"
                          v-model="selectedModelInfo.name"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="3" class="py-0 px-8 d-flex justify-center align-start">
                        <v-radio-group row dense v-model="selectedModelInfo.gender">
                          <v-radio key="Male" label="Male" value="male"></v-radio>
                          <v-radio key="Female" label="Female" value="female"></v-radio>
                        </v-radio-group>
                      </v-col>
                      <v-col cols="12" md="3" class="py-0 px-8 d-flex flex-column justify-center align-start">
                        <div class="d-flex align-items-center">
                          <h6 class="mr-3 mb-0">{{ $t('ScreeningForm.age') }}</h6>
                          <SpinButtonWithInput
                            :type="'number'"
                            v-model.number="selectedModelInfo.age"
                            :step="1"
                            :min="0"
                            :max="100"
                          />
                        </div>
                        <div class="d-flex align-items-center mt-2">
                          <h6 class="mr-3 mb-0">{{ $t('ScreeningForm.to') }}</h6>
                          <SpinButtonWithInput
                            :type="'number'"
                            v-model.number="selectedModelInfo.to"
                            :step="1"
                            :min="0"
                            :max="100"
                          />
                        </div>
                      </v-col>
                      <v-col cols="12" class="mb-8 pt-0">
                        <v-row>
                          <v-col cols="12" class="d-flex justify-start align-center">
                            <div>
                              <h6 class="mr-3">{{ $t('ScreeningForm.pt_weight') }}</h6>
                            </div>
                            <div class="flex-column d-flex">
                              <SpinButtonWithInput
                                :type="'number'"
                                v-model.number="weightImperial"
                                :step="1"
                                :min="0"
                                :allow-decimal="true"
                                :max="1000"
                              />
                              <span>{{ $t('ScreeningForm.weight_imperial') }}</span>
                            </div>
                            <div class="flex-column d-flex">
                              <SpinButtonWithInput
                                :type="'number'"
                                v-model.number="weightMetric"
                                :step="1"
                                :min="0"
                                :allow-decimal="true"
                                :max="1000"
                              />
                              <span>{{ $t('ScreeningForm.weight_metric') }}</span>
                            </div>
                          </v-col>
                          <v-col cols="12" class="d-flex justify-start align-center">
                            <div style="white-space: nowrap">
                              <h6 class="mr-3">{{ $t('ScreeningForm.pt_height') }}</h6>
                            </div>
                            <div class="flex-column d-flex">
                              <SpinButtonWithInput
                                :type="'number'"
                                v-model.number="heightImperial"
                                :step="1"
                                :min="0"
                                :allow-decimal="false"
                                :allow-floating-point="false"
                                :max="10"
                              />
                              <span>{{ $t('ScreeningForm.height_imperial') }}</span>
                            </div>
                            <div class="flex-column d-flex">
                              <SpinButtonWithInput
                                :type="'number'"
                                v-model.number="heightInches"
                                :step="1"
                                :min="0"
                                :allow-decimal="true"
                                :max="150"
                              />
                              <span>{{ $t('ScreeningForm.height_inches') }}</span>
                            </div>
                            <div class="flex-column d-flex">
                              <SpinButtonWithInput
                                :type="'number'"
                                v-model.number="heightMetric"
                                :step="1"
                                :min="0"
                                :allow-decimal="true"
                                :max="350"
                              />
                              <span>{{ $t('ScreeningForm.height_metric') }}</span>
                            </div>
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>
                  </b-card>
                </v-col>
              </v-row>
              <v-row class="mt-2 patient-info-container">
                <v-col>
                  <b-card>
                    <v-row v-for="item in attributes" :key="item.id">
                      <v-col cols="9">
                        <v-row>
                          <v-col cols="6">
                            <v-text-field
                              dense
                              required
                              outlined
                              placeholder="Steven"
                              :label="`First name`"
                              v-model="item.firstName"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              dense
                              required
                              outlined
                              placeholder="Jobs"
                              :label="`Last name`"
                              v-model="item.lastName"
                            ></v-text-field>
                          </v-col>
                        </v-row>
                      </v-col>
                      <v-col cols="3">
                        <v-btn class="w-100" color="primary" size="sm" @click="deleteAttribute(item.id)">{{
                          $t('global.delete')
                        }}</v-btn>
                      </v-col>
                    </v-row>
                    <hr v-if="attributes.length < 30" />
                    <v-row v-if="attributes.length < 30">
                      <v-col cols="9">
                        <v-row>
                          <v-col cols="6">
                            <v-text-field
                              dense
                              required
                              outlined
                              placeholder="Steven"
                              :label="`First name`"
                              v-model="newAttribute.firstName"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="6">
                            <v-text-field
                              dense
                              required
                              outlined
                              placeholder="Jobs"
                              :label="`Last name`"
                              v-model="newAttribute.lastName"
                            ></v-text-field>
                          </v-col>
                        </v-row>
                      </v-col>
                      <v-col cols="3">
                        <v-btn class="w-100" color="primary" size="sm" @click="addAttribute()">{{
                          $t('global.add')
                        }}</v-btn>
                      </v-col>
                    </v-row>
                  </b-card>
                </v-col>
              </v-row>
            </b-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <div class="loading-overlay" v-if="isLoading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <b-modal
      id="modal-copy-positions"
      :title="`Copy positions and bodyboxes from`"
      centered
      ok-only
      @ok="onCopyPositions()"
    >
      <template #modal-ok>
        {{ $t('global.okay') }}
      </template>

      <template #modal-cancel>
        {{ $t('global.cancel') }}
      </template>

      <div>
        <div>
          <v-select
            v-model="copyFromModelId"
            :items="models.items"
            item-text="name"
            item-value="id"
            :label="`Model`"
            menu-props="auto"
          />
        </div>
        <div>
          <v-select
            v-model="copyFromBodyPartId"
            :items="copyFromBodyPartOptions.filter((el) => !el.baseId)"
            item-text="name"
            item-value="id"
            :label="`Body part`"
            menu-props="auto"
          />
        </div>
        <div>
          <v-select
            v-model="copyFromPatientPositionId"
            :items="copyFromPatientPositionOptions"
            :disabled="copyFromBodyPartId == 'All'"
            item-text="name"
            item-value="id"
            :label="`Position`"
            menu-props="auto"
          />
        </div>
      </div>
    </b-modal>
    <v-dialog v-model="isSaveAllModelOpen" width="500">
      <template>
        <v-card>
          <v-card-title class="headline" primary-title>
            {{ $t('global.confirm') }}
          </v-card-title>

          <v-card-text>
            {{ $t('global.save_all_patient_positions') }}
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="isSaveAllModelOpen = false">
              {{ $t('global.cancel') }}
            </v-btn>
            <v-btn color="red darken-1" text @click="onConfirmSaveAllPreviewBodyBoxes">
              {{ $t('global.okay') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </div>
</template>

<script>
import SpinButtonWithInput from '@/components/SpinButtonWithInput.vue'
import MRIMachineView from '@/components/MRIMachineView'
import MRMRIMachineView from '@/components/MRMRIMachineView'
import Vue from 'vue'
import uuidv4 from 'uuid/v4'
import _ from 'lodash'
import { apiGet, apiPost, apiPut } from '../../util/api'
import { mapActions, mapState } from 'vuex'
import { MAXIMUM_ATTRIBUTE_OF_MODEL } from '../../constants'
import config from '../../config'
import { getHeadholderText } from '../../util/utils'
export default {
  components: { MRIMachineView, MRMRIMachineView, SpinButtonWithInput },
  name: 'ManageModels',
  data() {
    return {
      isCTLab: config.isCTLab,
      getHeadholderText,
      models: {
        selected: null,
        items: [],
      },
      availablePositions: [],
      bodyPart: {
        selected: 1,
        items: [],
      },
      patientPositionSet: {
        selected: null,
        items: [],
      },
      isEditingBodyBox: false,
      isLoading: false,
      selectedModelInfo: {},
      copyFromBodyPartId: 1,
      copyFromModelId: null,
      copyFromPatientPositionId: null,
      maximumAttributeOfModel: MAXIMUM_ATTRIBUTE_OF_MODEL,
      newAttribute: {
        firstName: '',
        lastName: '',
      },
      isSaveAllModelOpen: false,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('patientPositionService', ['previewCopyPatientPosition']),
    isEnablePreviewCopyPatientPositionFromSourceModel() {
      return this.previewCopyPatientPosition.enable
    },
    copyFromBodyPartOptions() {
      return [{ id: 'All', name: 'All' }, ...this.bodyPart.items]
    },
    copyFromPatientPositionOptions() {
      return [
        { id: 'All', name: 'All' },
        ...this.availablePositionsForSelectedPositionSet.map((el) => {
          el.name = `${el.value.join(', ')}${el.isShowHeadHolder ? `, ${getHeadholderText()}` : ''}`
          return el
        }),
      ]
    },
    isShowSelectSet() {
      return this.isBodyPartHasMultiPositionSet(this.bodyPart.selected)
    },
    currentBodyBox: {
      get() {
        const selectedPos = this.availablePositions.find((e) => e.selected)
        if (!selectedPos) return null

        return selectedPos.bodyBox
      },
      set(val) {
        let selectedPos = this.availablePositions.find((e) => e.selected)
        if (!selectedPos) return

        selectedPos.bodyBox = val ? { ...val } : null
      },
    },
    currentPatientPositionValue: {
      get() {
        const selectedPos = this.availablePositions.find((e) => e.selected)
        return selectedPos
      },
      set() {},
    },
    currentPatientPositionValueId: {
      get() {
        return _.get(this.currentPatientPositionValue, ['id'], '')
      },
      set() {},
    },
    weightImperial: {
      set(val) {
        this.selectedModelInfo.weightImperial = +val
        this.selectedModelInfo.weightMetric = +(val / 2.2046).toFixed(2)
      },
      get() {
        return this.selectedModelInfo.weightImperial
      },
    },
    weightMetric: {
      set(val) {
        this.selectedModelInfo.weightImperial = +(val * 2.2046).toFixed(2)
        this.selectedModelInfo.weightMetric = +val
      },
      get() {
        return this.selectedModelInfo.weightMetric
      },
    },
    //Feet
    heightImperial: {
      set(val) {
        this.selectedModelInfo.heightImperial = +val
        this.selectedModelInfo.heightMetric = +(val * 30.48 + this.heightInches * 2.54).toFixed(2)
      },
      get() {
        return this.selectedModelInfo.heightImperial
      },
    },
    //Inch
    heightInches: {
      set(val) {
        this.selectedModelInfo.heightInches = +val
        this.selectedModelInfo.heightMetric = +(this.heightImperial * 30.48 + val * 2.54).toFixed(2)
      },
      get() {
        return this.selectedModelInfo.heightInches
      },
    },
    //Centimeter
    heightMetric: {
      set(val) {
        this.selectedModelInfo.heightImperial = parseInt(val / 30.48)
        this.selectedModelInfo.heightInches = +((val % 30.48) / 2.54).toFixed(2)
        this.selectedModelInfo.heightMetric = +val
      },
      get() {
        return this.selectedModelInfo.heightMetric
      },
    },
    selectedModelFileName: {
      get() {
        return _.get(
          _.find(this.models.items, (el) => el.id == this.models.selected),
          ['fileName'],
          this.isCTLab ? 'Erica.glb' : 'Tom.glb'
        )
      },
    },
    attributes: {
      get() {
        return _.get(this.selectedModelInfo, ['attributes'], [])
      },
    },
    availablePositionsForSelectedPositionSet() {
      if (this.patientPositionSet.selected) {
        return this.availablePositions.filter((el) => el.positionSetId == this.patientPositionSet.selected)
      } else {
        return this.availablePositions
      }
    },
  },
  watch: {
    'bodyPart.selected': function () {
      this.loadDataByBodyPartId()
      this.loadPatientPositionSetByBodyPartId()
      this.copyFromBodyPartId = this.bodyPart.selected
    },
    'patientPositionSet.selected': function () {
      if (this.availablePositionsForSelectedPositionSet.length > 0) {
        this.availablePosOnClick(this.availablePositionsForSelectedPositionSet[0])
      }
    },
    'models.selected': function () {
      this.resetPreviewCopyPatientPosition()
      this.loadDataByBodyPartId()

      this.selectedModelInfo = _.cloneDeep(_.find(this.models.items, (el) => el.id == this.models.selected)) || {}
      this.copyFromModelId = this.models.selected
    },
    currentPatientPositionValueId: function () {
      this.copyFromPatientPositionId = this.currentPatientPositionValueId
    },
    currentBodyBox: function () {
      if (!this.currentBodyBox) {
        this.$refs.mriViewer.updateBodyBoxVisibility(true, 'edit')
      }
    },
  },
  async mounted() {
    await this.fetchAllModels(true)
    await this.fetchAllBodyParts()
    this.$refs.mriViewer.isBodyBoxEnabled = true
    await this.loadPatientPositionSetByBodyPartId()
    await this.loadDataByBodyPartId()
  },
  beforeDestroy() {
    this.resetPreviewCopyPatientPosition()
  },
  methods: {
    ...mapActions('bodyService', ['getBodyParts']),
    ...mapActions('patientPositionService', [
      'resetPreviewCopyPatientPosition',
      'setPreviewCopyPatientPosition',
      'updatePreviewCopyPatientPosition',
    ]),
    isBodyPartHasMultiPositionSet(bodyPartId) {
      let ids = [161, 265, 266, 273, 274]
      return ids.includes(bodyPartId)
    },
    async onCancelCopyAllBodyPartFromModel() {
      await this.resetPreviewCopyPatientPosition()
      this.loadDataByBodyPartId()
    },
    isPatientPositionHasBodyBox(patientPositionId) {
      return !!_.get(_.find(this.availablePositions, { id: patientPositionId }), ['bodyBox'], null)
    },
    onCopyBodyBoxFromPatientPosition(e, patientPositionId) {
      e.stopPropagation()
      this.copyBodyBoxFromCurrentPatientPosition(patientPositionId)
    },
    copyBodyBoxFromCurrentPatientPosition(patientPositionId) {
      const copyFromBodyBox = _.get(_.find(this.availablePositions, { id: patientPositionId }), ['bodyBox'], null)
      if (!copyFromBodyBox) {
        return
      }
      if (this.currentBodyBox) {
        this.currentBodyBox = {
          ...copyFromBodyBox,
          id: this.currentBodyBox.id,
        }
      } else {
        this.currentBodyBox = {
          ...copyFromBodyBox,
          id: uuidv4(),
        }
      }
      this.$refs.mriViewer.setBodyBox(this.currentBodyBox, true)
      this.$refs.mriViewer.updateBodyBoxVisibility(true, 'view')
      this.isEditingBodyBox = false
      Vue.notify({ type: 'success', text: 'Body box set!' })
    },
    async copyBodyBoxFromPatientPosition(modelId, bodyPartId, patientPositionId) {
      if (!bodyPartId) {
        Vue.notify({ type: 'warning', text: "This body part isn't exist!" })
        return
      }
      if (!modelId) {
        Vue.notify({ type: 'warning', text: "This body part isn't exist!" })
        return
      }
      this.isLoading = true
      const originPatientPositionsData = await this.$store.dispatch(
        'patientPositionService/getPatientPositionsByBodyPartId',
        {
          bodyPartId: bodyPartId,
          modelId: modelId,
        }
      )
      this.isLoading = false
      let sourcePatientPositions = originPatientPositionsData.map((el) => {
        el.bodyBox = el.bodyBoxes[0] ?? null
        delete el.bodyBoxes
        return el
      })

      sourcePatientPositions = sourcePatientPositions.map((el) => {
        el.id = uuidv4()
        if (el.bodyBox) {
          el.bodyBox.id = uuidv4()
        }
        return el
      })

      const targetPosition = this.availablePositions.find((el) => el.id == patientPositionId)
      if (!targetPosition) {
        Vue.notify({ type: 'warning', text: 'Please select one available position!' })
        return
      }
      const copyFromBodyBox = _.get(
        _.find(sourcePatientPositions, {
          value: targetPosition.value,
          isShowHeadHolder: targetPosition.isShowHeadHolder,
        }),
        ['bodyBox'],
        null
      )
      if (!copyFromBodyBox) {
        Vue.notify({ type: 'warning', text: 'Source body box is null!' })
        return
      }
      if (this.currentBodyBox) {
        this.currentBodyBox = {
          ...copyFromBodyBox,
          id: this.currentBodyBox.id,
        }
      } else {
        this.currentBodyBox = {
          ...copyFromBodyBox,
          id: uuidv4(),
        }
      }
      this.$refs.mriViewer.setBodyBox(this.currentBodyBox, true)
      this.$refs.mriViewer.updateBodyBoxVisibility(true, 'view')
      this.isEditingBodyBox = false
      Vue.notify({ type: 'success', text: 'Body box set!' })
    },
    onMRILoaded() {
      if (this.currentPatientPositionValue) {
        this.availablePosOnClick(this.currentPatientPositionValue)
      }
    },
    showModalCopyPositions() {
      this.$root.$emit('bv::show::modal', 'modal-copy-positions')
    },
    onCopyPositions() {
      if (this.copyFromModelId == this.models.selected) {
        if (this.copyFromBodyPartId != 'All') {
          if (this.copyFromPatientPositionId == 'All') {
            this.copyPositionFromModelIdAndBodyPartId(this.copyFromModelId, this.copyFromBodyPartId)
          } else {
            if (this.copyFromBodyPartId == this.bodyPart.selected) {
              this.copyBodyBoxFromCurrentPatientPosition(this.copyFromPatientPositionId)
            } else {
              this.copyBodyBoxFromPatientPosition(
                this.copyFromModelId,
                this.copyFromBodyPartId,
                this.copyFromPatientPositionId
              )
            }
          }
        } else {
          this.copyPositionFromModelIdAndBodyPartId(this.copyFromModelId, this.copyFromBodyPartId)
        }
      } else {
        if (this.copyFromBodyPartId != 'All') {
          if (this.copyFromPatientPositionId == 'All') {
            this.copyPositionFromModelIdAndBodyPartId(this.copyFromModelId, this.copyFromBodyPartId)
          } else {
            this.copyBodyBoxFromPatientPosition(
              this.copyFromModelId,
              this.copyFromBodyPartId,
              this.copyFromPatientPositionId
            )
          }
        } else {
          this.copyAllPatientPositionsOfAllBodyPartFromModelId(this.copyFromModelId)
        }
      }
    },
    async copyAllPatientPositionsOfAllBodyPartFromModelId(modelId) {
      this.isLoading = true
      let data = await this.$store.dispatch('patientPositionService/getAllPatientPositionsByModelId', {
        modelId: modelId,
      })

      data = _.groupBy(data, 'bodyPart.id')

      await this.setPreviewCopyPatientPosition({
        from: modelId,
        to: this.models.selected,
        data: data,
      })
      this.isLoading = false
      this.loadDataByBodyPartId()
    },
    async copyPositionFromModelIdAndBodyPartId(modelId, bodyPartId) {
      if (!bodyPartId) {
        Vue.notify({ type: 'warning', text: "This body part isn't exist!" })
        return
      }
      if (!modelId) {
        Vue.notify({ type: 'warning', text: "This body part isn't exist!" })
        return
      }
      this.isLoading = true
      const originPatientPositionsData = await this.$store.dispatch(
        'patientPositionService/getPatientPositionsByBodyPartId',
        {
          bodyPartId: bodyPartId,
          modelId: modelId,
        }
      )
      let originPatientPositions = originPatientPositionsData.map((el) => {
        el.bodyBox = el.bodyBoxes[0] ?? null
        delete el.bodyBoxes
        return el
      })

      originPatientPositions = originPatientPositions.map((el) => {
        el.id = uuidv4()
        if (el.bodyBox) {
          el.bodyBox.id = uuidv4()
        }
        return el
      })

      if (bodyPartId != this.bodyPart.selected) {
        originPatientPositions = originPatientPositions.map((el) => {
          el.positionSetId = this.patientPositionSet.selected
          return el
        })
        if (this.isBodyPartHasMultiPositionSet(this.bodyPart.selected)) {
          Vue.notify({
            type: 'warning',
            text:
              'Copy patient positions from bodyPart have multiple patient posotion sets may cause unexpected errors!',
          })
        }
      }

      this.availablePositions = this.availablePositions.map((el) => {
        const foundedPosition = _.find(originPatientPositions, {
          value: el.value,
          isShowHeadHolder: el.isShowHeadHolder,
        })
        if (foundedPosition && foundedPosition.bodyBox) {
          el.bodyBox = _.cloneDeep(foundedPosition.bodyBox)
          el.bodyBox.id = uuidv4()
        }
        return el
      })

      Vue.notify({
        type: 'success',
        text: 'Copied all body boxes found in source body part!',
      })

      if (this.availablePositions[0]) {
        this.availablePosOnClick(this.availablePositions[0])
      }
      this.isLoading = false
      Vue.notify({ text: 'Updated successfully!' })
    },
    addAttribute() {
      if (!this.newAttribute.firstName) {
        Vue.notify({ type: 'warning', text: "First name can't be null!" })
        return
      } else if (!this.newAttribute.lastName) {
        Vue.notify({ type: 'warning', text: "Last name can't be null!" })
        return
      }

      this.selectedModelInfo.attributes.push({
        ...this.newAttribute,
        id: uuidv4(),
      })

      this.newAttribute = {
        firstName: '',
        lastName: '',
      }
    },
    deleteAttribute(id) {
      this.selectedModelInfo.attributes = this.selectedModelInfo.attributes.filter((el) => el.id !== id)
    },
    async fetchAllModels(isSetInitState = false) {
      let response = await apiGet(`/model`, this.accessToken)
      const datas = _.get(response, ['data', 'data'], [])
      if (isSetInitState) {
        this.models = {
          selected: _.get(datas, [0, 'id'], 1),
          items: datas.map((el) => {
            el.text = el.name
            return el
          }),
        }
        this.selectedModelInfo = _.cloneDeep(_.find(this.models.items, (el) => el.id == this.models.selected)) || {}
      } else {
        this.models = {
          selected: this.models.selected,
          items: datas.map((el) => {
            el.text = el.name
            return el
          }),
        }
      }
    },
    async fetchAllBodyParts() {
      this.isLoading = true
      this.bodyPart.items = await this.getBodyParts()
      this.bodyPart.items = _.orderBy(this.bodyPart.items, ['name'], ['asc'])
      this.bodyPart = {
        ...this.bodyPart,
      }
      this.isLoading = false
    },
    async onSaveBodyBoxes() {
      this.isLoading = true
      const selectedPatientPositionIndex = this.availablePositions.findIndex((el) => el.selected)

      const modelInfo = _.pick(this.selectedModelInfo, [
        'name',
        'gender',
        'age',
        'to',
        'weightImperial',
        'weightMetric',
        'heightImperial',
        'heightMetric',
        'heightInches',
        'attributes',
      ])

      await apiPut(`/model/${this.models.selected}`, {}, modelInfo, this.accessToken)
      this.fetchAllModels(false)

      apiPost(
        `/patientPositions/copyByBodyPart/${this.bodyPart.selected}/${this.models.selected}`,
        {
          patientPositions: this.availablePositions,
        },
        this.accessToken
      )
        .then(async (rs) => {
          this.availablePositions = rs.data.patientPositions.map((el) => {
            el.bodyBox = el.bodyBoxes[0] ?? null
            delete el.bodyBoxes
            return el
          })

          if (this.availablePositions[selectedPatientPositionIndex]) {
            this.availablePosOnClick(this.availablePositions[selectedPatientPositionIndex])
          }

          this.isLoading = false
          Vue.notify({ text: 'Updated successfully!' })
        })
        .catch(() => {
          this.isLoading = false
        })
    },
    async onConfirmSaveAllPreviewBodyBoxes() {
      this.isLoading = true

      const modelInfo = _.pick(this.selectedModelInfo, [
        'name',
        'gender',
        'age',
        'to',
        'weightImperial',
        'weightMetric',
        'heightImperial',
        'heightMetric',
        'heightInches',
        'attributes',
      ])

      await apiPut(`/model/${this.models.selected}`, {}, modelInfo, this.accessToken)
      this.fetchAllModels(false)

      const data = _.cloneDeep(this.previewCopyPatientPosition.data || {})
      const body = []
      for (const [key, value] of Object.entries(data)) {
        const item = value
        item.forEach((el, index) => {
          if (item[index].bodyBoxes && item[index].bodyBoxes.length > 0) {
            item[index].bodyBox = item[index].bodyBoxes[0]
            item[index].bodyBox.id = uuidv4()
          } else {
            item[index].bodyBox = null
          }
          delete item[index].bodyBoxes
        })
        body.push({
          bodyPartId: key,
          patientPositions: item,
        })
      }

      apiPost(
        `/patientPositions/copyByMultiBodyParts/${this.models.selected}`,
        {
          data: body,
        },
        this.accessToken
      )
        .then(async () => {
          await this.onCancelCopyAllBodyPartFromModel()

          this.isSaveAllModelOpen = false
          this.isLoading = false
          Vue.notify({ text: 'Updated successfully!' })
        })
        .catch(() => {
          this.isSaveAllModelOpen = false
          this.isLoading = false
        })
    },
    async onSaveAllPreviewBodyBoxes() {
      this.isSaveAllModelOpen = true
    },
    onConfirmBodyBoxes() {
      this.updatePreviewCopyPatientPosition({
        bodyPartId: this.bodyPart.selected,
        patientPositions: this.availablePositions,
      })
      Vue.notify({ text: 'Updated successfully!' })
    },
    async loadDataByBodyPartId() {
      const bodyPartId = this.bodyPart.selected
      this.isLoading = true

      const patientPositions = await this.$store.dispatch('patientPositionService/getPatientPositionsByBodyPartId', {
        bodyPartId,
        modelId: this.models.selected,
      })
      Vue.notify({ text: 'Get available positions successfully!' })
      this.availablePositions = patientPositions.map((el) => {
        el.bodyBox = el.bodyBoxes[0] ?? null
        delete el.bodyBoxes
        return el
      })
      this.isLoading = false
      if (this.availablePositions.length > 0) {
        this.availablePosOnClick(this.availablePositions[0])
      }
    },
    async loadPatientPositionSetByBodyPartId() {
      const bodyPartId = this.bodyPart.selected
      this.isLoading = true

      const patientPositionSets = await this.$store.dispatch(
        'patientPositionService/getPatientPositionSetsByBodyPartId',
        {
          bodyPartId,
        }
      )
      Vue.notify({ text: 'Get patient position sets successfully!' })
      this.patientPositionSet = {
        items: patientPositionSets,
        selected: _.get(patientPositionSets, [0, 'id']),
      }
      this.isLoading = false
    },
    addBodyBox() {
      const selectedPos = this.availablePositions.find((e) => e.selected)
      if (selectedPos) {
        const newPatientPositionInfo = this.$refs.mriViewer.getPatientPositionInfo()
        this.currentBodyBox = {
          id: uuidv4(),
          x: 0,
          y: 0,
          z: -80,
          width: 50,
          length: 20,
          height: 20,
          landmarkTolerance: 5,
          landmarkToleranceBottom: 5,
          landmarkToleranceVertical: 5,
          bodyBoxDirection: 1,
          mriUpDownPositionY: 0,
          modelId: this.models.selected,
          ...newPatientPositionInfo,
        }
        this.$refs.mriViewer.setBodyBox(this.currentBodyBox, true)
        this.$refs.mriViewer.updateBodyBoxVisibility(true, 'view')
      } else {
        Vue.notify({ type: 'error', text: 'Please choose a patient position!' })
      }
    },
    deleteBodyBox() {
      this.currentBodyBox = null
      this.$refs.mriViewer.updateBodyBoxVisibility(false, 'none')
    },
    changeBodyBox() {
      this.isEditingBodyBox = true
      this.$refs.mriViewer.updateBodyBoxVisibility(true, 'edit')
    },
    saveBodyBox() {
      this.isEditingBodyBox = false
      this.$refs.mriViewer.updateBodyBoxVisibility(true, 'view')

      const newPatientPositionInfo = this.$refs.mriViewer.getPatientPositionInfo()
      this.currentBodyBox = _.assign(this.currentBodyBox, newPatientPositionInfo)
    },
    bodyBoxRowClick(item) {
      this.bodyBoxe.rows.forEach((e) => {
        e.active = e.id != item.id ? false : true
      })
    },
    availablePosOnClick(item) {
      this.availablePositions = this.availablePositions.map((e) => {
        e.selected = e.id != item.id ? false : true

        return e
      })

      this.$refs.mriViewer.setPatientPosition(
        this.currentPatientPositionValue?.value,
        this.currentPatientPositionValue.isShowHeadHolder
      )
      if (this.currentBodyBox) {
        this.$refs.mriViewer.updateBodyBoxVisibility(true, 'view')
        this.$refs.mriViewer.setBodyBox(this.currentBodyBox, true)
      } else {
        this.$refs.mriViewer.updateBodyBoxVisibility(true, 'edit')
      }

      this.isEditingBodyBox = false
    },
  },
}
</script>
<style lang="scss">
.patient-info-container {
  .v-input__control {
    .v-text-field__details {
      display: none;
    }
  }
}
</style>
<style scoped lang="scss">
.patient-info-container {
  .v-input--selection-controls {
    margin-top: 0;
  }
  .spin-btn-grp {
    border: solid 1px rgb(177, 177, 177);
    border-radius: 4px;
  }
}
.btn-save {
  padding: 0 32px !important;
}
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
.subtitle {
  color: rgb(177, 177, 177);
  font-size: 14px;
}

.no-item-text {
  color: rgb(177, 177, 177);
}
</style>
