<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card>
    <v-card-text class="grey lighten-4" style="height: 100% !important">
      <div class="row-container">
        <div class="column">
          <div class="sub-columns scrollable" style="background-color: #d5d7d7" @scroll="handleScroll">
            <div class="sub-column">
              <div class="subcolumn-key"><span>Preparation Phases</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedPreparationPhases', 'PreparationPhases')">
                <template v-if="editKey === 'SelectedPreparationPhases'">
                  <v-select
                    v-model="SelectedPreparationPhases"
                    :items="PreparationPhases"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedPreparationPhases }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Interactive FO</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedInteractiveFO', 'InteractiveFO')">
                <template v-if="editKey === 'SelectedInteractiveFO'">
                  <v-select
                    v-model="SelectedInteractiveFO"
                    :items="InteractiveFO"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedInteractiveFO }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Quick Survey</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedQuickSurvey', 'QuickSurvey')">
                <template v-if="editKey === 'SelectedQuickSurvey'">
                  <v-select
                    v-model="SelectedQuickSurvey"
                    :items="QuickSurvey"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedQuickSurvey }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Smart Plan Survey</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedSmartPlanSurvey', 'SmartPlanSurvey')">
                <template v-if="editKey === 'SelectedSmartPlanSurvey'">
                  <v-select
                    v-model="SelectedSmartPlanSurvey"
                    :items="SmartPlanSurvey"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedSmartPlanSurvey }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>B0 Field Map</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedB0FieldMap', 'B0FieldMap')">
                <template v-if="editKey === 'SelectedB0FieldMap'">
                  <v-select
                    v-model="SelectedB0FieldMap"
                    :items="B0FieldMap"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedB0FieldMap }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>B1 Field Map</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedB1FieldMap', 'B1FieldMap')">
                <template v-if="editKey === 'SelectedB1FieldMap'">
                  <v-select
                    v-model="SelectedB1FieldMap"
                    :items="B1FieldMap"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedB1FieldMap }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>MIP/MPR</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedMIP_MPR', 'MIP_MPR')">
                <template v-if="editKey === 'SelectedMIP_MPR'">
                  <v-select
                    v-model="SelectedMIP_MPR"
                    :items="MIP_MPR"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedMIP_MPR }}
                </template>
              </div>
            </div>
            <div class="sub-column" @click="toggleImages">
              <div class="subcolumn-key"><span style="margin-left: 15px">Images</span></div>
            </div>
            <div class="sub-column" v-show="showImages">
              <div class="subcolumn-key"><span>1</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedImages1', 'images1')">
                <template v-if="editKey === 'selectedImages1'">
                  <v-select
                    v-model="selectedImages1"
                    :items="images1"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedImages1 }}
                </template>
              </div>
            </div>
            <div class="sub-column" v-show="showImages">
              <div class="subcolumn-key"><span>2</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedImages2', 'images2')">
                <template v-if="editKey === 'selectedImages2'">
                  <v-select
                    v-model="selectedImages2"
                    :items="images2"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedImages2 }}
                </template>
              </div>
            </div>
            <div class="sub-column">
              <div class="subcolumn-key"><span>Autoview Image</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedAutoviewImage', 'AutoviewImage')">
                <template v-if="editKey === 'SelectedAutoviewImage'">
                  <v-select
                    v-model="SelectedAutoviewImage"
                    :items="AutoviewImage"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedAutoviewImage }}
                </template>
              </div>
            </div>

            <div class="sub-column" @click="toggleCalImages">
              <div class="subcolumn-key"><span style="margin-left: 15px">Calculated Images</span></div>
              <!-- <div class="subcolumn-value" @click="startEdit('SelectedCalculatedImages', 'CalculatedImages')">
                <template v-if="editKey === 'SelectedCalculatedImages'">
                  <v-select
                    v-model="SelectedCalculatedImages"
                    :items="CalculatedImages"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedCalculatedImages }}
                </template>
              </div> -->
            </div>
            <div class="sub-column" v-show="showCalImages">
              <div class="subcolumn-key"><span>1</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedCalImages1', 'Calimages1')">
                <template v-if="editKey === 'selectedCalImages1'">
                  <v-select
                    v-model="selectedCalImages1"
                    :items="Calimages1"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedCalImages1 }}
                </template>
              </div>
            </div>
            <div class="sub-column" v-show="showCalImages">
              <div class="subcolumn-key"><span>2</span></div>
              <div class="subcolumn-value" @click="startEdit('selectedCalImages2', 'Calimages2')">
                <template v-if="editKey === 'selectedCalImages2'">
                  <v-select
                    v-model="selectedCalImages2"
                    :items="Calimages2"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ selectedCalImages2 }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Reference Tissue</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedReferenceTissue', 'ReferenceTissue')">
                <template v-if="editKey === 'SelectedReferenceTissue'">
                  <v-select
                    v-model="SelectedReferenceTissue"
                    :items="ReferenceTissue"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedReferenceTissue }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Recon Compression</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedReconCompression', 'ReconCompression')">
                <template v-if="editKey === 'SelectedReconCompression'">
                  <v-select
                    v-model="SelectedReconCompression"
                    :items="ReconCompression"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedReconCompression }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Preset Window Contrast</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedPresetWindowContrast', 'PresetWindowContrast')">
                <template v-if="editKey === 'SelectedPresetWindowContrast'">
                  <v-select
                    v-model="SelectedPresetWindowContrast"
                    :items="PresetWindowContrast"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedPresetWindowContrast }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Reconstruction Mode</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedReconstructionMode', 'ReconstructionMode')">
                <template v-if="editKey === 'SelectedReconstructionMode'">
                  <v-select
                    v-model="SelectedReconstructionMode"
                    :items="ReconstructionMode"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedReconstructionMode }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Save Raw Data</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedSaveRawData', 'SaveRawData')">
                <template v-if="editKey === 'SelectedSaveRawData'">
                  <v-select
                    v-model="SelectedSaveRawData"
                    :items="SaveRawData"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedSaveRawData }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Hard copy Protocol</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedHardcopyProtocol', 'HardcopyProtocol')">
                <template v-if="editKey === 'SelectedHardcopyProtocol'">
                  <v-select
                    v-model="SelectedHardcopyProtocol"
                    :items="HardcopyProtocol"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedHardcopyProtocol }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Image Filter</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedImageFilter', 'ImageFilter')">
                <template v-if="editKey === 'SelectedImageFilter'">
                  <v-select
                    v-model="SelectedImageFilter"
                    :items="ImageFilter"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedImageFilter }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Uniformity Correction</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedUniformityCorrection', 'UniformityCorrection')">
                <template v-if="editKey === 'SelectedUniformityCorrection'">
                  <v-select
                    v-model="SelectedUniformityCorrection"
                    :items="UniformityCorrection"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedUniformityCorrection }}
                </template>
              </div>
            </div>

            <div class="sub-column">
              <div class="subcolumn-key"><span>Geometry Correction</span></div>
              <div class="subcolumn-value" @click="startEdit('SelectedGeometryCorrection', 'GeometryCorrection')">
                <template v-if="editKey === 'SelectedGeometryCorrection'">
                  <v-select
                    v-model="SelectedGeometryCorrection"
                    :items="GeometryCorrection"
                    hide-details
                    outlined
                    @input="endEdit"
                  ></v-select>
                </template>
                <template v-else>
                  {{ SelectedGeometryCorrection }}
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
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import SpinButton from './PhSpinButton.vue'
import TabSidebar from './PhTabComponentSidebar.vue'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  // eslint-disable-next-line vue/no-unused-components
  components: { SpinButton, TabSidebar },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showImages: false,
      showCalImages: false,
      SelectedPreparationPhases: 'auto',
      SelectedInteractiveFO: 'No',
      SelectedQuickSurvey: 'No',
      SelectedSmartPlanSurvey: 'No',
      SelectedB0FieldMap: 'No',
      SelectedB1FieldMap: 'No',
      SelectedMIP_MPR: 'No',
      SelectedImages: '',
      SelectedAutoviewImage: 'M',
      SelectedCalculatedImages: '',
      SelectedReferenceTissue: 'White matter',
      SelectedReconCompression: 'No',
      SelectedPresetWindowContrast: 'soft',
      SelectedReconstructionMode: 'immediate',
      SelectedSaveRawData: 'No',
      SelectedHardcopyProtocol: 'No',
      SelectedImageFilter: 'system default',
      SelectedUniformityCorrection: 'No',
      SelectedGeometryCorrection: 'default',

      PreparationPhases: [
        { text: 'Auto', value: 'auto' },
        { text: 'Full', value: 'full' },
        { text: 'Prep_only', value: 'prep_only' },
      ],
      InteractiveFO: [
        { text: 'No', value: 'no' },
        { text: 'Auto', value: 'auto' },
        { text: 'Select', value: 'select' },
      ],
      QuickSurvey: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
        { text: 'Default', value: 'default' },
      ],
      SmartPlanSurvey: [
        { text: 'No', value: 'no' },
        { text: 'Brain', value: 'brain' },
        { text: 'Knee', value: 'knee' },
        { text: 'C-spine', value: 'C-spine' },
        { text: 'L-spine', value: 'L-spine' },
        { text: 'Shoulder', value: 'shoulder' },
        { text: 'Breasts', value: 'breasts' },
        { text: 'Research', value: 'research' },
      ],
      B0FieldMap: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
        { text: 'Callbrate', value: 'callbrate' },
      ],
      B1FieldMap: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      MIP_MPR: [
        { text: 'No', value: 'no' },
        { text: 'MIP', value: 'MIP' },
        { text: 'MPR', value: 'MPR' },
      ],
      Images: [{ text: '', value: '' }],
      AutoviewImage: [{ text: 'M', value: 'M' }],
      CalculatedImages: [{ text: '', value: '' }],
      ReferenceTissue: [
        { text: 'White matter', value: 'whiteMatter' },
        { text: 'Gray matter', value: 'grayMmatter' },
        { text: 'CSF', value: 'CSF' },
        { text: 'Skeletal muscle', value: 'skeletalMuscle' },
        { text: 'Vertab marrow', value: 'vertabMarrow' },
        { text: 'Bone marrow', value: 'boneMarrow' },
        { text: 'Fat', value: 'fat' },
        { text: 'Lung', value: 'lung' },
        { text: 'Blood', value: 'blood' },
        { text: 'Disk', value: 'disk' },
      ],
      ReconCompression: [
        { text: 'No', value: 'No' },
        { text: 'Default', value: 'default' },
        { text: 'High', value: 'high' },
        { text: 'User defined', value: 'userDefind' },
      ],
      PresetWindowContrast: [
        { text: 'No', value: 'no' },
        { text: 'Soft', value: 'soft' },
        { text: 'Intermediate', value: 'intermediate' },
        { text: 'Hard', value: 'hard' },
        { text: 'Very hard', value: 'veryHard' },
      ],
      ReconstructionMode: [
        { text: 'Immediate', value: 'immediate' },
        { text: 'Delayed', value: 'delayed' },
        { text: 'Immed. 1st dyn', value: 'immed1stdyn' },
        { text: 'Real time', value: 'realTime' },
      ],
      SaveRawData: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      HardcopyProtocol: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      ImageFilter: [{ text: 'system default', value: 'system default' }],
      UniformityCorrection: [
        { text: 'No', value: 'no' },
        { text: 'Yes', value: 'yes' },
      ],
      GeometryCorrection: [
        { text: 'None', value: 'none' },
        { text: '2D Compensation', value: '2DCompensation' },
        { text: '3D Compensation', value: '3DCompensation' },
        { text: 'default', value: 'default' },
      ],

      images2: [
        { text: 'R', value: 'R' },
        { text: 'I', value: 'I' },
        { text: 'M', value: 'M' },
        { text: 'P', value: 'P' },
        { text: 'No', value: 'no' },
      ],
      selectedImages2: 'no',
      images1: [
        { text: 'R', value: 'R' },
        { text: 'I', value: 'I' },
        { text: 'M', value: 'M' },
        { text: 'P', value: 'P' },
        { text: 'No', value: 'no' },
      ],
      selectedImages1: 'no',

      Calimages2: [
        { text: 'T1', value: 'T1' },
        { text: 'T2', value: 'T2' },
        { text: 'RHO', value: 'RHO' },
        { text: 'CR', value: 'CR' },
        { text: 'No', value: 'no' },
        { text: 'R2', value: 'R2' },
        { text: 'SUM', value: 'SUM' },
      ],
      selectedCalImages2: 'no',
      Calimages1: [
        { text: 'T1', value: 'T1' },
        { text: 'T2', value: 'T2' },
        { text: 'RHO', value: 'RHO' },
        { text: 'CR', value: 'CR' },
        { text: 'No', value: 'no' },
        { text: 'R2', value: 'R2' },
        { text: 'SUM', value: 'SUM' },
      ],
      selectedCalImages1: 'no',

      editKey: null,
      menu: false,
      selectedDropdownItem: null,
    }
  },

  mounted() {
    document.addEventListener('click', this.handleGlobalClick)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleGlobalClick)
  },
  methods: {
    toggleImages() {
      this.showImages = !this.showImages
    },
    toggleCalImages() {
      this.showCalImages = !this.showCalImages
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
::v-deep .v-input__append-inner {
  margin-top: 10px !important;
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

.subcolumn-key {
  /* font-weight: bold; */
  width: 90%;
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

::v-deep .v-input__slot fieldset {
  background: white !important;
  border-color: white !important;
  border-radius: 4px !important;
  height: 2rem !important;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  margin-bottom: 22px !important;
  margin-left: 15px !important;
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
</style>
