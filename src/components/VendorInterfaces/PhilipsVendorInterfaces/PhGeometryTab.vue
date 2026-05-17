<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card>
    <v-card-text class="grey lighten-4" style="height: 100% !important">
      <div class="row-container">
        <div class="column">
          <div
            class="sub-columns scrollable"
            :class="{ disabled: isScrollableDisabled }"
            style="background-color: #d5d7d7"
            @scroll="handleScroll"
          >
            <div class="sub-column">
              <div class="subcolumn-key"><span>Uniformity</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedUniformity', 'uniformity')">
                <template v-if="editKey === 'selectedUniformity'">
                  <v-select
                    v-model="selectedUniformity"
                    :items="uniformity"
                    hide-details
                    outlined
                    @input="endEdit"
                    style="color: black !important; margin-bottom: 22px; margin-left: 18px"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedUniformity }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span>FOV AP(mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('dimensions3y')">
                <template v-if="editKey === 'dimensions3y'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="dimensions3y"
                    :step="1"
                    :min="1"
                    :max="1000"
                    @input="submitDimensions3y"
                  />
                </template>
                <template v-else>
                  {{ dimensions3y }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">RL(mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('dimensions3x')">
                <template v-if="editKey === 'dimensions3x'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="dimensions3x"
                    :step="1"
                    :min="1"
                    :max="1000"
                    @input="submitDimensions3x"
                  />
                </template>
                <template v-else>
                  {{ dimensions3x }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">FH(mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('dimensions3zHalf')">
                <template v-if="editKey === 'dimensions3zHalf'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="dimensions3zHalf"
                    :step="1"
                    :min="1"
                    :max="1000"
                    @input="submitDimensions3z"
                  />
                </template>
                <template v-else>
                  {{ dimensions3zHalf }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span>ACQ voxel size AP(mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('frequencyVoxelSize')">
                <template v-if="editKey === 'frequencyVoxelSize'">
                  <SpinButton
                    :type="'number'"
                    :max="100"
                    :step="0.01"
                    :value="frequencyVoxelSize"
                    @input="changeFrequencyVoxelSize($event)"
                  />
                </template>
                <template v-else>
                  {{ frequencyVoxelSize }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">RL(mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('phaseVoxelSize')">
                <template v-if="editKey === 'phaseVoxelSize'">
                  <SpinButton
                    :type="'number'"
                    :max="100"
                    :step="0.01"
                    :value="phaseVoxelSize"
                    @input="changePhaseVoxelSize($event)"
                  />
                </template>
                <template v-else>
                  {{ phaseVoxelSize }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span>Slice thickness (mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('SliceThickness')">
                <template v-if="editKey === 'SliceThickness'">
                  <SpinButton
                    @input="submitThickness"
                    :type="'number'"
                    v-model.number="thickness"
                    :step="0.5"
                    :min="0"
                    :max="50"
                    :disabled="complete"
                  />
                </template>
                <template v-else>
                  {{ thickness }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span>Recon voxel size AP (mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('ReconVoxelSizeAP')">
                <template v-if="editKey === 'ReconVoxelSizeAP'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="ReconVoxelSizeAP"
                    :value="ReconVoxelSizeAP"
                    :step="0.1"
                    :min="0"
                    :max="560"
                    @input="ReconVoxelSizeAP = Math.round($event * 1000) / 1000"
                  />
                </template>
                <template v-else>
                  {{ ReconVoxelSizeAP }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">RL(mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('ReconFH')">
                <template v-if="editKey === 'ReconFH'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="ReconFH"
                    :value="ReconFH"
                    :step="0.1"
                    :min="0"
                    :max="560"
                    @input="ReconFH = Math.round($event * 1000) / 1000"
                  />
                </template>
                <template v-else>
                  {{ ReconFH }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>Fold-over suppression</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedFoldOverSuppression', 'FoldOverSuppression')">
                <template v-if="editKey === 'selectedFoldOverSuppression'">
                  <v-select
                    v-model="selectedFoldOverSuppression"
                    :items="FoldOverSuppression"
                    hide-details
                    outlined
                    @input="endEdit"
                    @change="actionFoldOver($event)"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedFoldOverSuppression }}
                </template>
              </div>
            </div>
            <div v-if="foldShowFlag">
              <div class="sub-column">
                <div class="subcolumn-key">
                  <span style="margin-left: 15px">P (mm)</span>
                </div>
                <div class="subcolumn-value" @click="startEdit('p_mm')">
                  <template v-if="editKey === 'p_mm'">
                    <SpinButton :type="'number'" v-model="p_mm" :value="p_mm" :step="1" :min="10" :max="560" />
                  </template>
                  <template v-else>
                    {{ p_mm }}
                  </template>
                </div>
              </div>
              <div class="sub-column">
                <div class="subcolumn-key">
                  <span style="margin-left: 15px">A (mm)</span>
                </div>
                <div class="subcolumn-value" @click="startEdit('a_mm')">
                  <template v-if="editKey === 'a_mm'">
                    <v-text-field v-model="a_mm" :value="a_mm" />
                  </template>
                  <template v-else>
                    {{ a_mm }}
                  </template>
                </div>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span>Reconstruction matrix</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('ReconstructionMatrix')">
                <template v-if="editKey === 'ReconstructionMatrix'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="ReconstructionMatrix"
                    :value="ReconstructionMatrix"
                    :step="1"
                    :min="1"
                    :max="100000"
                  />
                </template>
                <template v-else>
                  {{ ReconstructionMatrix }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span><b>SENSE</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('selectedSENSE', 'SENSE')">
                <template v-if="editKey === 'selectedSENSE'">
                  <v-select
                    v-model="parallelFactor"
                    :items="parallelFactors[softwareVendorPreference]"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ parallelFactor }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span><b>CS-SENSE</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('selectedCSSENSE', 'CSSENSE')">
                <template v-if="editKey === 'selectedCSSENSE'">
                  <v-select
                    v-model="selectedCSSENSE"
                    :items="CSSENSE"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedCSSENSE }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px"><b>Reduction</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('reduction')">
                <template v-if="editKey === 'reduction'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="reduction"
                    :value="reduction"
                    :step="0.5"
                    :min="0"
                    :max="2000"
                  />
                </template>
                <template v-else>
                  {{ reduction }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">Denoising</span></div>
              <div class="subcolumn-value" @click="startEdit('selecteddenoising', 'denoising')">
                <template v-if="editKey === 'selecteddenoising'">
                  <v-select
                    v-model="selecteddenoising"
                    :items="denoising"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selecteddenoising }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>k-t Acceleration</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedktAcceleration', 'ktAcceleration')">
                <template v-if="editKey === 'selectedktAcceleration'">
                  <v-select
                    v-model="selectedktAcceleration"
                    :items="CSSENSE"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedktAcceleration }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span>Stacks</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('stacks')">
                <template v-if="editKey === 'stacks'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="stacks"
                    :value="stacks"
                    :step="1"
                    :min="1"
                    :max="20000"
                  />
                </template>
                <template v-else>
                  {{ stacks }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">Type</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedtype', 'type')">
                <template v-if="editKey === 'selectedtype'">
                  <v-select v-model="selectedtype" :items="type" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ selectedtype }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">Slices</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('slices')">
                <template v-if="editKey === 'slices'">
                  <SpinButton
                    @input="submitNumberOfSlices"
                    :type="'number'"
                    v-model.number="numberOfSlices"
                    :step="1"
                    :min="1"
                    :max="300"
                  />
                </template>
                <template v-else>
                  {{ numberOfSlices }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">Slice Gap</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedsliceGap', 'sliceGap')">
                <template v-if="editKey === 'selectedsliceGap'">
                  <v-select
                    v-model="selectedsliceGap"
                    :items="sliceGap"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedsliceGap }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 30px">Gap (mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('spacing')">
                <template v-if="editKey === 'spacing'">
                  <SpinButton
                    @input="submitSpacing"
                    v-model.number="spacing"
                    :step="isForCT ? 0.5 : 0.1"
                    :min="0"
                    :max="200"
                    :disabled="complete || isDisabledParameter"
                  />
                </template>
                <template v-else>
                  {{ spacing }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">Slice orientation</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedValue', 'SliceOrientation')">
                <template v-if="editKey === 'selectedValue'">
                  <v-menu>
                    <template #activator="{ on }">
                      <v-btn
                        :disabled="isAddLocalizerMode"
                        class="btn-4"
                        v-on="on"
                        dense
                        outlined
                        style="margin-left: 0.5rem; height: 26px"
                      >
                        {{ selectedValue }}
                        <v-icon small>mdi-menu-down</v-icon>
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item
                        :class="{ 'active-list-item': selectedValue === 'Transversal' }"
                        @click="
                          resetSelection({ index: 0, dirOnly: true })
                          selectedValue = 'Transversal'
                        "
                      >
                        <v-list-item-title>Transversal</v-list-item-title>
                      </v-list-item>

                      <v-list-item
                        :class="{ 'active-list-item': selectedValue === 'Coronal' }"
                        @click="
                          resetSelection({ index: 1, dirOnly: true })
                          selectedValue = 'Coronal'
                        "
                      >
                        <v-list-item-title>Coronal</v-list-item-title>
                      </v-list-item>

                      <v-list-item
                        :class="{ 'active-list-item': selectedValue === 'Sagittal' }"
                        @click="
                          resetSelection({ index: 2, dirOnly: true })
                          selectedValue = 'Sagittal'
                        "
                      >
                        <v-list-item-title>Sagittal</v-list-item-title>
                      </v-list-item>

                      <v-list-item
                        :class="{ 'active-list-item': selectedValue === 'S>C-7.7' }"
                        @click="
                          resetSelection({ index: 3, dirOnly: true })
                          selectedValue = 'S>C-7.7'
                        "
                      >
                        <v-list-item-title>S > C-7.7</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </template>

                <template v-else>
                  {{ selectedValue }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">Fold-Over Direction</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedfoldOverDirection', 'foldOverDirection')">
                <template v-if="editKey === 'selectedfoldOverDirection'">
                  <v-btn
                    tile
                    outlined
                    class="no-transform bold"
                    color="buttonBlue"
                    :disabled="complete || isDisabledParameter"
                    @click="onSwapPhase"
                  >
                    Swap fold-over direction
                  </v-btn>
                </template>
                <template v-else>
                  <v-btn
                    tile
                    outlined
                    class="no-transform bold"
                    color="buttonBlue"
                    :disabled="complete || isDisabledParameter"
                    @click="onSwapPhase"
                  >
                    Swap fold-over direction
                  </v-btn>
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span style="margin-left: 15px">Fat Shift Direction</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedfatShiftDirection', 'fatShiftDirection')">
                <template v-if="editKey === 'selectedfatShiftDirection'">
                  <v-select
                    v-model="selectedfatShiftDirection"
                    :items="foldOverDirection"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedfatShiftDirection }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span>Minimum No. of packges</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('MinimumNoofpa')">
                <template v-if="editKey === 'MinimumNoofpa'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="concatenations"
                    :value="concatenations"
                    :step="1"
                    :min="1"
                    :max="20000"
                    @input="changeConcatenations"
                  />
                </template>
                <template v-else>
                  {{ concatenations }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>Slice scan order</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedSliceScanOrder', 'SliceScanOrder')">
                <template v-if="editKey === 'selectedSliceScanOrder'">
                  <v-select
                    v-model="selectedSliceScanOrder"
                    :items="SliceScanOrder"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedSliceScanOrder }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>O-MAR</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedOMAR', 'OMAR')">
                <template v-if="editKey === 'selectedOMAR'">
                  <v-select v-model="selectedOMAR" :items="OMAR" hide-details outlined @input="endEdit"></v-select>
                </template>
                <template v-else>
                  {{ selectedOMAR }}
                </template>
              </div>
            </div>
            <div class="sub-column" v-if="selectedOMAR === 'SEMAC+VAT'">
              <div class="subcolumn-key"><span>Distortion Correction</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedDistortionCorrection', 'distortionCorrection')">
                <template v-if="editKey === 'selectedDistortionCorrection'">
                  <v-select
                    v-model="selectedDistortionCorrection"
                    :items="distortionCorrection"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedDistortionCorrection }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>PlanAlign</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedPlanAlign', 'PlanAlign')">
                <template v-if="editKey === 'selectedPlanAlign'">
                  <v-select
                    v-model="selectedPlanAlign"
                    :items="PlanAlign"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedPlanAlign }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span>REST slabs</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('RESTSlabs')">
                <template v-if="editKey === 'RESTSlabs'">
                  <SpinButton
                    :type="'number'"
                    v-model.number="RESTSlabs"
                    :value="RESTSlabs"
                    :step="1"
                    :min="1"
                    :max="20000"
                  />
                </template>
                <template v-else>
                  {{ RESTSlabs }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px"><b>Type</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('selectedFreetype', 'Freetype')">
                <template v-if="editKey === 'selectedFreetype'">
                  <v-select
                    v-model="selectedFreetype"
                    :items="Freetype"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedFreetype }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px"><b>Orientation</b></span>
              </div>
              <div class="subcolumn-value" @click="startEdit('selectedOrientation', 'orientation')">
                <template v-if="editKey === 'selectedOrientation'">
                  <v-select
                    v-model="selectedOrientation"
                    :items="orientation"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedOrientation }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key">
                <span style="margin-left: 15px">Thickness (mm)</span>
              </div>
              <div class="subcolumn-value" @click="startEdit('sliceThick')">
                <template v-if="editKey === 'sliceThick'">
                  <SpinButton
                    @input="submitThickness"
                    :type="'number'"
                    v-model.number="thickness"
                    :value="thickness"
                    :step="0.5"
                    :min="0"
                    :max="60"
                  />
                </template>
                <template v-else>
                  {{ thickness }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>Interactive positioning</span></div>
              <div
                class="subcolumn-value"
                @click="startEdit('selectedInteractivePositioning', 'InteractivePositioning')"
              >
                <template v-if="editKey === 'selectedInteractivePositioning'">
                  <v-select
                    v-model="selectedInteractivePositioning"
                    :items="InteractivePositioning"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedInteractivePositioning }}
                </template>
              </div>
            </div>
          </div>
        </div>
        <TabSidebar></TabSidebar>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import SpinButton from './PhSpinButton.vue'
import TabSidebar from './PhTabComponentSidebar.vue'
import _ from 'lodash'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  components: { SpinButton, TabSidebar },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      selectedUniformity: 'Clear',
      selectedFoldOverSuppression: 'no',
      selectedSENSE: 'no',
      selectedCSSENSE: 'no',
      selecteddenoising: 'systemDefault',
      selectedktAcceleration: 'no',
      selectedtype: 'parallel',
      selectedsliceGap: 'userDefined',
      selectedValue: 'Transversal',
      selectedSliceOrientation: 'transverse',
      selectedfoldOverDirection: 'RL',
      selectedfatShiftDirection: 'P',
      selectedSliceScanOrder: 'interleaved',
      selectedPlanAlign: 'no',
      selectedOMAR: 'no',
      selectedFreetype: 'free (parallel)',
      selectedOrientation: 'coronal (transvers)',
      selectedInteractivePositioning: 'no',
      foldShowFlag: false,
      p_mm: 10,
      a_mm: '120 (100)',

      selectedACQMatrixMP: '384 X 254',
      selectedDistortionCorrection: 'weak',
      uniformity: [
        { text: 'Clear', value: 'Clear' },
        { text: 'Body-tuned', value: 'BodyTuned' },
        { text: 'Synergy', value: 'synergy' },
        { text: 'Classic', value: 'classic' },
      ],

      // FOVAP: 230,
      // FOV_RL: 137,
      // FH: 230,
      ACQVoxelSizeAP: 0.599,
      ACQ_FH: 0.75,
      SliceThickness: this.thickness,
      sliceThick: 5,
      ReconVoxelSizeAP: 0.399,
      ReconFH: 0.399,

      FoldOverSuppression: [
        { text: 'No', value: 'no' },
        { text: 'Oversampling', value: 'oversampling' },
        { text: 'Rest', value: 'rest' },
        { text: 'Zoom', value: 'zoom' },
      ],

      ReconstructionMatrix: 768,

      SENSE: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],

      CSSENSE: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      reduction: 2.15,
      denoising: [
        { text: 'No', value: 'no' },
        { text: 'Weak', value: 'weak' },
        { text: 'Medium', value: 'medium' },
        { text: 'Strong', value: 'strong' },
        { text: 'system default', value: 'systemDefault' },
        { text: 'User defind', value: 'userDefind' },
      ],
      ktAcceleration: [
        { text: 'No', value: 'no' },
        { text: 'k-t BLAST', value: 'ktBLAST' },
        { text: 'k-t SENSE', value: 'ktSENSE' },
      ],
      stacks: 1,
      type: [
        { text: 'Parallel', value: 'parallel' },
        { text: 'Radial', value: 'radial' },
      ],
      slices: this.numberOfSlices,
      sliceGap: [
        { text: 'User defined', value: 'userDefined' },
        { text: 'Default', value: 'default' },
      ],

      gap: this.spacing,
      SliceOrientation: [
        { text: 'Transversal', value: 'transverse' },
        { text: 'Sagittal', value: 'sagittal' },
        { text: 'Coronal', value: 'coronal' },
      ],
      foldOverDirection: [
        { text: 'RL', value: 'RL' },
        { text: 'AP', value: 'AP' },
      ],
      fatShiftDirection: [
        { text: 'P', value: 'P' },
        { text: 'A', value: 'A' },
      ],
      MinimumNoofpa: 1,
      SliceScanOrder: [
        { text: 'default', value: 'default' },
        { text: 'FH', value: 'FH' }, //if Sagittal RL
        { text: 'HF', value: 'HF' }, //if Sagittal LR
        { text: 'Rev. Central', value: 'revCentral' },
        { text: 'Interleaved', value: 'interleaved' },
      ],
      OMAR: [
        { text: 'No', value: 'no' },
        { text: 'MARS+VAT', value: 'MARS+VAT' },
        { text: 'SEMAC+VAT', value: 'SEMAC+VAT' },
      ],
      distortionCorrection: [
        { text: 'Weak', value: 'weak' },
        { text: 'Medium', value: 'medium' },
        { text: 'Strong', value: 'strong' },
      ],
      PlanAlign: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      RESTSlabs: 1,
      Freetype: [{ text: 'free (parallel)', value: 'free (parallel)' }],
      orientation: [
        { text: 'coronal (transvers)', value: 'coronal (transvers)' },
        { text: 'sagittal (transvers)', value: 'sagittal (transvers)' },
        { text: 'transvers', value: 'transvers' },
      ],
      // thickness: 2,
      InteractivePositioning: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],

      editKey: null,
      menu: false,
      selectedDropdownItem: null,
    }
  },
  computed: {
    ...mapState('selectionConfig', [
      'selectionConfigsByIdent',
      'isFullscreen',
      'isAddLocalizerMode',
      'toolSelected',
      'toolSelectedConfig',
      'showReferenceLines',
      'referenceSliceCornersBySliceViewId',
      'hasAddedLocalizer',
    ]),
    ...mapState('scanTimeConfig', [
      'APFOV',
      'RLFOV',
      'FHFOV',
      'APVoxel',
      'RLVoxel',
      'FHVoxel',
      'APMatrix',
      'RLMatrix',
      'FHMatrix',
      'defaultTxt',
      'NSA',
      'isCheckedGap',
      'isCheckedFS',
      'textColorText',
    ]),
    isScrollableDisabled() {
      return this.$store.state.scanTimeConfig.isScrollableDisabled
    },
    ...mapState('scanTimeConfig', ['formData', 'isEditable']),
    // APFOV: {
    //   get() {
    //     return this.getParameter('APFOV')
    //   },
    //   set(value) {
    //     this.updateField({ field: 'APFOV', value })
    //   },
    // },

    ...mapGetters('user', ['softwareVendorPreference', 'softwareVersionPreference']),

    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
    spacing: {
      get() {
        let output = _.get(this.selectionConfig, 'spacing')
        if (this.isUltraLab && this.vendorStylePreference === 'siemens' && !this.isAddLocalizerMode) {
          // Convert mm to %
          output = output !== 0 ? _.round((output / this.thickness) * 100, 2) : 0 // Round to 2 decimal places
        } else {
          output = _.round(output, 2) // Round to 2 decimal places
        }
        return output
      },
      set(spacing) {
        let input = spacing
        if (this.isUltraLab && this.vendorStylePreference === 'siemens' && !this.isAddLocalizerMode) {
          // Convert % to mm
          input = _.round((this.thickness / 100) * input, 2) // Round to 2 decimal places
        }
        const roundedInput = Math.round(input * 10) / 10
        this.spacingLocal = roundedInput
      },
    },
  },
  mounted() {
    document.addEventListener('click', this.handleGlobalClick)
    this.initializeFormData({
      selectedUniformity: 'Clear',
      dimensions3y: 230,
      dimensions3x: 137,
      dimensions3zHalf: 57,
      thickness: 5,
      frequencyVoxelSize: 0.599,
      phaseVoxelSize: 0.75,
      SliceThickness: 5,
      ReconVoxelSizeAP: 0.399,
      ReconFH: 0.399,
      p_mm: 10,
      r_mm: '120 (100)',
      selectedFoldOverSuppression: 'no',
      ReconstructionMatrix: 768,
      parallelFactor: 'no',
      selectedCSSENSE: 'no',
      reduction: 2.15,
      selecteddenoising: 'systemDefault',
      selectedktAcceleration: 'no',
      stacks: 1,
      selectedtype: 'parallel',
      slices: 10,
      selectedsliceGap: 'userDefined',
      spacing: 0.1,
      selectedValue: 'Transversal',
      selectedfoldOverDirection: 'RL',
      selectedfatShiftDirection: 'P',
      MinimumNoofpa: 1,
      selectedSliceScanOrder: 'interleaved',
      selectedOMAR: 'no',
      selectedDistortionCorrection: 'weak',
      selectedPlanAlign: 'no',
      RESTSlabs: 1,
      selectedFreetype: 'free (parallel)',
      selectedOrientation: 'coronal (transvers)',
      sliceThick: 5,
      selectedInteractivePositioning: 'no',
    })
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleGlobalClick)
  },
  methods: {
    ...mapActions('selectionConfig', ['resetSelection']),
    ...mapActions('dataToParent', ['updateScanTime']),
    ...mapActions('scanTimeConfig', [
      'updateAPFOV',
      'updateRLFOV',
      'updateFHFOV',
      'updateAPVoxel',
      'updateRLVoxel',
      'updateFHVoxel',
      'updateAPMatrix',
      'updateRLMatrix',
      'updateFHMatrix',
      'updateDefaultTxt',
      'updateNSA',
      'updateIsCheckedGap',
      'updateIsCheckedFS',
      'updateTextColorText',
      'updateSelectedUniformity',
      'updateSelectedFoldOverSuppression',
      'updateSelectedSENSE',
      'updateSelectedCSSENSE',
      'updateSelectedDenoising',
      'updateSelectedKTAcceleration',
      'updateSelectedType',
      'updateSelectedSliceGap',
      'updateSelectedSliceOrientation',
      'updateSelectedFoldOverDirection',
      'updateSelectedFatShiftDirection',
      'updateSelectedSliceScanOrder',
      'updateSelectedPlanAlign',
      'updateSelectedOMAR',
      'updateSelectedFreetype',
      'updateSelectedOrientation',
      'updateSelectedInteractivePositioning',
      'updateACQVoxelSizeAP',
      'updateACQFH',
      'updateSliceThick',
      'updateReconVoxelSizeAP',
      'updateReconFH',
      'updateReconstructionMatrix',
      'updateReduction',
      'updateStacks',
      'updateMinimumNoofPA',
      'updateRESTSlabs',
      'updateField',
    ]),
    handleInput(key, value) {
      if (this.isEditable) {
        this.updateField({ key, value })
      }
    },
    startEdit(key) {
      this.editKey = key
    },
    endEdit() {
      this.editKey = null
    },
    handleScroll() {
      this.endEdit()
    },
    actionFoldOver(event) {
      if (event === 'oversampling') this.foldShowFlag = true
      else this.foldShowFlag = false
    },
    handleGlobalClick(event) {
      const clickedElement = event.target
      const isEditableArea = this.isEditableArea(clickedElement)
      if (!isEditableArea) {
        this.endEdit()
      }
    },
    isEditableArea(element) {
      let currentElement = element
      while (currentElement) {
        if (currentElement.classList.contains('subcolumn-value')) {
          return true
        }
        currentElement = currentElement.parentElement
      }
      return false
    },
  },
  watch: {
    scanTime(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.updateScanTime(newVal)
      }
    },
  },
}
</script>

<style scoped>
.v-card__text {
  padding: 0px !important;
  position: static !important;
}

.row-container {
  display: flex;
  overflow-x: auto;
  height: 100%;
}

@media screen and (max-width: 1680px) and (max-height: 1050px) {
  .row-container {
    display: flex;
    overflow-x: auto;
    height: 100%;
  }

  .scrollable {
    overflow-y: scroll;
    max-height: 100% !important;
  }
}

.column {
  width: 50%;
  padding: 2px;
  box-sizing: border-box;
  background-color: #d5d7d7;
}

input[type='number'] {
  text-align: right;
}

.sub-columns {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sub-column {
  display: flex;
  justify-content: space-between;
  border: 1px solid;
  padding: 5px;
  height: 33px;
}

.sub-column .subcolumn-key {
  text-align: left !important;
}

.sub-column .subcolumn-value {
  text-align: right !important;
}
.sub-column .subcolumn-value button {
  text-align: right !important;
}
.subcolumn-key {
  /* font-weight: bold; */
  width: 80%;
}

.subcolumn-value {
  width: 13rem;
  height: 34px;
}

.scrollable {
  overflow-y: scroll;
  max-height: 100%;
}

@media screen and (max-width: 1600px) and (max-height: 900px) {
  .row-container {
    display: flex;
    overflow-x: auto;
    height: 100%;
  }

  .scrollable {
    overflow-y: scroll;
    max-height: 100% !important;
  }
}
::v-deep .v-input__append-inner {
  margin-top: 5px !important;
}

::v-deep .v-input__slot fieldset {
  background: white !important;
  border-color: white !important;
  border-radius: 4px !important;
  height: 2rem !important;
}
::v-deep .column .sub-column .subcolumn-value button span i {
  color: red;
  font-size: 18px;
}

.subcolumn-value .v-btn__content i {
  /* Add your styles here */
  color: red;
  font-size: 18px;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  margin-bottom: 12px !important;
  margin-left: 0px !important;
}

.v-input__control {
  height: 2rem !important;
}

/* ::v-deep .v-text-field--outlined.v-input--has-state fieldset,
.v-text-field--outlined.v-input--is-focused fieldset {
  border: 1px solid !important;
} */
::v-deep v-text-field__slot {
  background: #fffcfc !important;
}
::v-deep .v-text-field__slot {
  background: #ffffff !important;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 16px !important;
  right: 2px !important;
  top: -7px !important;
}
::v-deep .v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 25px !important;
  height: 25px !important;
}
::v-deep .v-text-field--outlined.v-input--has-state fieldset,
.v-text-field--outlined.v-input--is-focused fieldset {
  border: 1px solid !important;
}
::v-deep .v-select__selection--comma {
  margin: 0px 0px 0px 0px !important;
}
.disabled {
  pointer-events: none;
  opacity: 0.5; /* visually indicate the area is disabled */
}

/* UPDATED BY ME */
::v-deep .subcolumn-value .v-btn {
  height: 20px !important;
  font-size: 0.75rem !important;
  color: #222425 !important;
}
/* END */
</style>
