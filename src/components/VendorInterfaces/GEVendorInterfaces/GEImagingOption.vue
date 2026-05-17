<template>
  <div
    class="main"
    :style="{
      top: posY + 'px',
      left: posX + 'px',
      zIndex: isImagingOptionActiveFlag ? zIndex + 1 : -1000,
      opacity: isImagingOptionActiveFlag ? '100%' : '0%',
    }"
  >
    <div class="main-content">
      <!-- More Options when you click More button -->
      <div v-if="isMore" class="details">
        <div class="part1">
          <div>
            <label for="plane">Plane</label>
            <select name="plane" id="plane" class="plane" v-model="selectedPlane">
              <option value="3plane">3-Plane</option>
              <option value="oblique">Oblique</option>
            </select>
          </div>
          <div>
            <label for="mode">Mode</label>
            <select name="mode" id="mode" class="mode" v-model="selectedMode">
              <option
                v-for="option in modeOptions"
                :key="option.value"
                :value="option.value"
                :disabled="option.disabled"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
        <hr />
        <div class="part2">
          <div class="part2-content">
            <div class="label"><span>Family</span></div>
            <div class="part2-options">
              <label v-if="!isCanvasActiveFlag">
                <input type="radio" name="family" checked />
                <span>3-Plane Localizer</span>
              </label>
              <label v-if="isCanvasActiveFlag" v-for="option in familyOptions" :key="option.value">
                <input
                  type="radio"
                  :value="option.value"
                  v-model="familyOption"
                  name="family"
                  :disabled="option.disabled"
                />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </div>
          <div class="part2-content">
            <div class="label"><span>Pulse</span></div>
            <div class="part2-options">
              <label v-for="option in pulseOptionList" :key="option.value">
                <input
                  type="radio"
                  :value="option.value"
                  v-model="pulseOption"
                  name="pulse"
                  :disabled="option.disabled"
                />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="part3">
          <div class="label"><span>Application</span></div>
          <div class="part3-options">
            <div class="column">
              <label v-for="app in applicationOptionList.slice(0, 11)" :key="app.value">
                <input
                  type="radio"
                  :value="app.value"
                  v-model="applicationOption"
                  name="application"
                  :disabled="!isCanvasActiveFlag || app.disabled"
                />
                <span>{{ app.label }}</span>
              </label>
            </div>
            <div class="column">
              <label v-for="app in applicationOptionList.slice(11)" :key="app.value">
                <input
                  type="radio"
                  :value="app.value"
                  v-model="applicationOption"
                  name="application"
                  :disabled="!isCanvasActiveFlag || app.disabled"
                />
                <span>{{ app.label }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="part4">
          <label for="psdname">PSD Name</label>
          <input type="text" id="psdname" name="psdname" />
        </div>
      </div>
      <!-- The main initial imaging options -->
      <div class="content">
        <div class="label"><span>Imaging Option</span></div>
        <div class="options">
          <label v-for="option in imagingOptionList" :key="option.value">
            <input type="checkbox" :value="option.value" v-model="imagingOptions" :disabled="option.disabled" />
            <span>{{ option.label }}</span>
          </label>
        </div>
        <div class="buttons" :class="{ active: isMore }">
          <div v-if="!isMore" class="active-content">
            <button class="active-button" @click="handleMore">More</button>
          </div>
          <div class="active-content">
            <button class="active-button" @click="handleAccept">Accept</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin.js'

export default {
  name: 'GEImagingOption',
  mixins: [SelectionConfigMixin],
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
    sequenceType: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      dragging: false,
      posX: 0, // Default X position
      posY: 0, // Default Y position (initial position)
      offsetX: 0,
      offsetY: 0,
      zIndex: 1,
      initialPosY: 0, // Store the default Y position
      initialPosX: 0, // Store the default X position
      selectedExaminationDatesValue: 'English',
      gridView: 1,
      examinationDates: ['Spanish', 'MexSpanish', 'Finnish', 'Norwegian', 'Swedish', 'Danish', 'Dutch', 'English'],
      activeButtonIndex: null, // tracks which button is active
      isOpen: false,
      isMore: false,
      selectedPlane: '3plane',
      selectedMode: '2D',
      modeOptions: [
        { value: '2D', label: '2D', disabled: true },
        { value: '3D', label: '3D', disabled: true },
        { value: 'Cine', label: 'Cine', disabled: true },
        { value: 'MRS', label: 'MRS', disabled: true },
        { value: 'Calib', label: 'Calib', disabled: true },
      ],
      imagingOptions: [],
      imagingOptionList: [],
      imagingOptionsInitial: ['None', 'ARC', 'EDR', 'sequential', 'tailoredRf'],
      imagingOptionListInitial: [
        { value: 'None', label: 'None' },
        { value: 'ARC', label: 'ARC', disabled: true },
        { value: 'acousticReduction', label: 'Acoustic Reduction', disabled: true },
        { value: 'fastRecovery', label: 'Fast Recovery', disabled: true },
        { value: 'sequential', label: 'Sequential', disabled: true },
        { value: 'tailoredRf', label: 'Tailored RF', disabled: true },
      ],
      imagingOptionsTemp: ['EDR'],
      imagingOptionListDwEpi: [
        { value: 'None', label: 'None' },
        { value: 'ARC', label: 'ARC', disabled: true },
        { value: 'Asset', label: 'ASSET' },
        { value: 'acousticReduction', label: 'Acoustic Reduction', disabled: true },
        { value: 'cardiacGating', label: 'Cardiac Gating/Triggering', disabled: true },
        { value: 'EDR', label: 'Extended Dynamic Range' },
        { value: 'flowCompensation', label: 'Flow Compensation', disabled: true },
        { value: 'hyperBand', label: 'HyperBand', disabled: true },
        { value: 'irPrepared', label: 'IR Prepared', disabled: true },
        { value: 'navigator', label: 'Navigator', disabled: true },
        { value: 'respiratoryGating', label: 'Respiratory Gating/Triggering', disabled: true },
        { value: 'sequential', label: 'Sequential', disabled: true },
        { value: 'squarePixel', label: 'Square Pixel', disabled: true },
      ],
      imagingOptionListIR: [
        { value: 'None', label: 'None' },
        { value: 'acousticReduction', label: 'Acoustic Reduction', disabled: true },
        { value: 'classic', label: 'Classic', disabled: true },
        { value: 'EDR', label: 'Extended Dynamic Range' },
        { value: 'flowCompensation', label: 'Flow Compensation', disabled: true },
        { value: 'noPhaseWrap', label: 'No Phase Wrap', disabled: true },
        { value: 'respiratoryCompensation', label: 'Respiratory Compensation', disabled: true },
        { value: 'sequential', label: 'Sequential', disabled: true },
        { value: 'squarePixel', label: 'Square Pixel', disabled: true },
      ],
      imagingOptionListSpinEcho: [
        { value: 'None', label: 'None' },
        { value: 'ARC', label: 'ARC' },
        { value: 'acousticReduction', label: 'Acoustic Reduction', disabled: true },
        { value: 'cardiacGating', label: 'Cardiac Gating/Triggering', disabled: true },
        { value: 'classic', label: 'Classic', disabled: true },
        { value: 'EDR', label: 'Extended Dynamic Range' },
        { value: 'flowCompensation', label: 'Flow Compensation', disabled: true },
        { value: 'magnetizationTransfer', label: 'Magnetization Transfer', disabled: true },
        { value: 'respiratoryCompensation', label: 'Respiratory Compensation', disabled: true },
        { value: 'squarePixel', label: 'Square Pixel', disabled: true },
        { value: 'zip512', label: 'ZIP512', disabled: true },
      ],
      imagingOptionListGre: [
        { value: 'None', label: 'None' },
        { value: 'acousticReduction', label: 'Acoustic Reduction', disabled: true },
        { value: 'ccomp', label: 'CCOMP', disabled: true },
        { value: 'cardiacGating', label: 'Cardiac Gating/Triggering', disabled: true },
        { value: 'EDR', label: 'Extended Dynamic Range' },
        { value: 'flowCompensation', label: 'Flow Compensation', disabled: true },
        { value: 'magnetizationTransfer', label: 'Magnetization Transfer', disabled: true },
        { value: 'noPhaseWrap', label: 'No Phase Wrap', disabled: true },
        { value: 'respiratoryCompensation', label: 'Respiratory Compensation', disabled: true },
        { value: 'sequential', label: 'Sequential', disabled: true },
        { value: 'squarePixel', label: 'Square Pixel', disabled: true },
        { value: 'zip512', label: 'ZIP512', disabled: true },
      ],
      imagingOptionListSsfse: [
        { value: 'None', label: 'None' },
        { value: 'ARC', label: 'ARC' },
        { value: 'Asset', label: 'ASSET' },
        { value: 'acousticReduction', label: 'Acoustic Reduction' },
        { value: 'bloodSuppression', label: 'Blood Suppression' },
        { value: 'cardiacGating', label: 'Cardiac Gating/Triggering' },
        { value: 'fastRecovery', label: 'Fast Recovery' },
        { value: 'flowCompensation', label: 'Flow Compensation' },
        { value: 'irPrepared', label: 'IR Prepared' },
        { value: 'multiPhase', label: 'Multi-Phase' },
        { value: 'navigator', label: 'Navigator' },
        { value: 'respiratoryGating', label: 'Respiratory Gating/Triggering' },
        { value: 'sequential', label: 'Sequential' },
        { value: 'tailoredRf', label: 'Tailored RF' },
        { value: 'zip1024', label: 'ZIP1024' },
        { value: 'zip512', label: 'ZIP512' },
      ],
      imagingOptionListFse: [
        { value: 'None', label: 'None' },
        { value: 'ARC', label: 'ARC' },
        { value: 'Asset', label: 'ASSET' },
        { value: 'acousticReduction', label: 'Acoustic Reduction', disabled: true },
        { value: 'bloodSuppression', label: 'Blood Suppression', disabled: true },
        { value: 'cardiacGating', label: 'Cardiac Gating/Triggering', disabled: true },
        { value: 'classic', label: 'Classic', disabled: true },
        { value: 'EDR', label: 'Extended Dynamic Range' },
        { value: 'fastRecovery', label: 'Fast Recovery', disabled: true },
        { value: 'flowCompensation', label: 'Flow Compensation', disabled: true },
        { value: 'fullEchoTrain', label: 'Full Echo Train', disabled: true },
        { value: 'ideal', label: 'IDEAL', disabled: true },
        { value: 'irPrepared', label: 'IR Prepared', disabled: true },
        { value: 'multiPhase', label: 'Multi-Phase', disabled: true },
        { value: 'navigator', label: 'Navigator', disabled: true },
        { value: 'respiratoryGating', label: 'Respiratory Gating/Triggering', disabled: true },
        { value: 'sequential', label: 'Sequential', disabled: true },
        { value: 'squarePixel', label: 'Square Pixel', disabled: true },
        { value: 't1Flair', label: 'T1 FLAIR', disabled: true },
        { value: 't2Flair', label: 'T2 FLAIR', disabled: true },
        { value: 'tailoredRf', label: 'Tailored RF', disabled: true },
        { value: 'verse', label: 'VERSE', disabled: true },
        { value: 'zip1024', label: 'ZIP1024', disabled: true },
        { value: 'zip512', label: 'ZIP512', disabled: true },
      ],
      familyOption: '',
      familyOptions: [
        { value: 'echoPlanarImaging', label: 'Echo Planar Imaging' },
        { value: 'fastSpinEcho', label: 'Fast Spin Echo' },
        { value: 'gradientEcho', label: 'Gradient Echo' },
        { value: 'mns', label: 'MNS' },
        { value: 'spinEcho', label: 'Spin Echo' },
        { value: 'vascular', label: 'Vascular' },
      ],
      pulseOption: '',
      pulseOptionList: [],
      pulseOptionListInitial: [
        { value: 'fgre', label: 'FGRE', disabled: true },
        { value: 'fgreIrPrep', label: 'FGRE IR Prep', disabled: true },
        { value: 'fiesta', label: 'Fiesta', disabled: true },
        { value: 'ssfse', label: 'SSFSE', disabled: true },
      ],
      pulseOptionListTemp: [
        { value: 'dwPropeller', label: 'DW PROPELLER' },
        { value: 'fse', label: 'FSE' },
        { value: 'propeller', label: 'PROPELLER' },
        { value: 'ssfse', label: 'SSFSE' },
      ],
      applicationOption: '',
      applicationOptionList: [],
      applicationOptionListTemp: [
        { value: '3dasl', label: '3DASL' },
        { value: '3dcineSpgr', label: '3DCINE-SPGR' },
        { value: 'bravo', label: 'BRAVO' },
        { value: 'cineIr', label: 'CINE IR' },
        { value: 'disco', label: 'DISCO' },
        { value: 'magic', label: 'MAGIC' },
        { value: 'mprage', label: 'MP-RAGE' },
        { value: 'muse', label: 'MUSE' },
        { value: 'silenz', label: 'Silenz' },
        { value: 't1mapSpgr', label: 'T1MAP-SPGR' },
        { value: 'tricks', label: 'TRICKS' },
        { value: '3dcineFiesta', label: '3DCINE-FIESTA' },
        { value: 'flow4d', label: '4DFLOW' },
        { value: 'brease', label: 'BREASE' },
        { value: 'cosmic', label: 'COSMIC' },
        { value: 'idealIq', label: 'IDEAL IQ' },
        { value: 'mavricSl', label: 'MAVRIC SL' },
        { value: 'mrTouch', label: 'MR-Touch' },
        { value: 'quickstep', label: 'QuickSTEP', disabled: true },
        { value: 't1mapFiesta', label: 'T1MAP-FIESTA' },
        { value: 't2map', label: 'T2MAP' },
      ],
      tempImagingOptionList: [],
    }
  },
  watch: {
    familyOption(newValue) {
      this.imagingOptionList = []
      switch (newValue) {
        case 'echoPlanarImaging':
          this.pulseOptionList = [
            { value: 'dwEpi', label: 'DW EPI' },
            { value: 'flairEpi', label: 'Flair EPI', disabled: true },
            { value: 'gradientEchoEpi', label: 'Gradient Echo EPI', disabled: true },
            { value: 'spinEchoEpi', label: 'Spin Echo EPI', disabled: true },
          ]
          this.pulseOption = 'dwEpi'
          this.familyOptions = this.familyOptions.map((opt) => ({
            ...opt,
            disabled: opt.value === 'mns' || opt.value === 'vascular',
          }))
          this.applicationOptionList = this.applicationOptionList.map((opt) => ({
            ...opt,
            disabled: !['bravo', 'cineIr', 'mprage', 'tricks', 'cosmic', 'mavricSl', 't2map'].includes(opt.value),
          }))
          break
        case 'fastSpinEcho':
          this.pulseOptionList = [
            { value: 'dwPropeller', label: 'DW PROPELLER', disabled: true },
            { value: 'fse', label: 'FSE' },
            { value: 'propeller', label: 'PROPELLER', disabled: true },
            { value: 'ssfse', label: 'SSFSE', disabled: true },
          ]
          this.pulseOption = 'fse'
          this.familyOptions = this.familyOptions.map((opt) => ({
            ...opt,
            disabled: opt.value === 'mns' || opt.value === 'vascular',
          }))
          this.applicationOptionList = [...this.applicationOptionListTemp]
          break
        case 'gradientEcho':
          this.pulseOptionList = [
            { value: 'fastGre', label: 'Fast GRE', disabled: true },
            { value: 'fastSpgr', label: 'Fast SPGR', disabled: true },
            { value: 'fiesta', label: 'Fiesta', disabled: true },
            { value: 'gre', label: 'GRE' },
            { value: 'merge', label: 'MERGE', disabled: true },
            { value: 'multiEchoFgre', label: 'Multi-Echo FGRE', disabled: true },
            { value: 'multiEchoFspgr', label: 'Multi-Echo FSPGR', disabled: true },
            { value: 'spgr', label: 'SPGR', disabled: true },
          ]
          this.pulseOption = 'gre'
          this.familyOptions = this.familyOptions.map((opt) => ({
            ...opt,
            disabled: opt.value === 'mns' || opt.value === 'vascular',
          }))
          this.applicationOptionList = [...this.applicationOptionListTemp]
          break
        case 'mns':
          break
        case 'spinEcho':
          this.pulseOptionList = [
            { value: 'ir', label: 'IR' },
            { value: 'spinEcho', label: 'Spin Echo' },
          ]
          this.familyOptions = this.familyOptions.map((opt) => ({
            ...opt,
            disabled: opt.value === 'mns' || opt.value === 'vascular',
          }))
          this.applicationOptionList = [...this.applicationOptionListTemp]
          this.pulseOption = 'ir'
          break
        case 'vascular':
          break
      }
    },
    pulseOption(newValue) {
      switch (newValue) {
        case 'ir':
          this.imagingOptionList = [...this.imagingOptionListIR]
          break
        case 'dwEpi':
          this.imagingOptionList = [...this.imagingOptionListDwEpi]
          break
        case 'spinEcho':
          this.imagingOptionList = [...this.imagingOptionListSpinEcho]
          break
        case 'fse':
          this.imagingOptionList = [...this.imagingOptionListFse]
          break
        case 'gre':
          this.imagingOptionList = [...this.imagingOptionListGre]
          break
        case 'ssfse':
          this.imagingOptionList = [...this.imagingOptionListSsfse]
          break
        default:
          break
      }
      this.tempImagingOptionList = [...this.imagingOptionList]
      this.onImagingOptionsChanged(this.imagingOptions, this.imagingOptions)
    },
    imagingOptions: {
      handler: 'onImagingOptionsChanged',
      deep: true,
    },
    isImagingOptionActiveFlag(newValue) {
      if (newValue) {
        this.zIndex = 1000 // Bring to front when active
      } else {
        this.zIndex = 1 // Reset z-index when not active
      }
    },
  },
  mounted() {
    this.initialPosY = window.innerHeight / 6 // Store the initial position after mounting
    this.initialPosX = window.innerWidth / 2.25 // Set default X position to screen width
    this.posX = this.initialPosX // Ensure the draggable component starts at screen width
    this.posY = this.initialPosY
    if (this.isCanvasActiveFlag) {
      this.familyOption = 'fastSpinEcho'
      this.pulseOption = 'fse'
      this.imagingOptions = [...this.imagingOptionsTemp]
      this.selectionConfig.sequenceType = 'TE'
      this.changeSequenceType()
    } else {
      this.imagingOptionList = [...this.imagingOptionListInitial]
      this.imagingOptions = [...this.imagingOptionsInitial]
      this.pulseOptionList = [...this.pulseOptionListInitial]
    }
    this.selectedImagingOptions = {
      imagingOptions: this.imagingOptions,
      familyOption: this.familyOption,
      pulseOption: this.pulseOption,
      applicationOption: this.applicationOption,
      selectedPlane: this.selectedPlane,
      selectedMode: this.selectedMode,
    }
  },
  methods: {
    handleMore() {
      this.isMore = true
      this.posX = window.innerWidth / 3
      if (this.isCanvasActiveFlag) {
        this.selectedPlane = 'oblique'
      }
    },
    handleAccept() {
      this.forcedIsImagingOptionActive = false
      this.isMore = false
      this.posX = window.innerWidth / 2.25 // Set default X position to screen width
      this.isArcChecked = this.imagingOptions.includes('ARC')
      this.isAssetChecked = this.imagingOptions.includes('Asset')
      if (this.pulseOption === 'ir') {
        this.inversionRecovery = true
        this.toggleInversionRecovery()
      } else {
        this.inversionRecovery = false
        this.toggleInversionRecovery()
      }
      const sequenceTypeMap = {
        dwEpi: 'DIFF',
        spinEcho: 'SE',
        fse: 'TE',
        gre: 'GRE',
      }
      const newType = sequenceTypeMap[this.pulseOption]
      if (newType) {
        this.selectionConfig.sequenceType = newType
        this.changeSequenceType()
      }
      this.selectedImagingOptions = {
        imagingOptions: this.imagingOptions.filter((opt) => this.imagingOptionList.some((item) => item.value === opt)),
        familyOption: this.familyOption,
        pulseOption: this.pulseOption,
        applicationOption: this.applicationOption,
        selectedPlane: this.selectedPlane,
        selectedMode: this.selectedMode,
      }
      if (this.isArcChecked || this.isAssetChecked) {
        this.parallelFactor = 2.0
      }
    },
    onImagingOptionsChanged(newValue, oldValue) {
      if (oldValue === newValue) {
        if (oldValue.includes('None') && newValue.includes('None')) {
          this.imagingOptionList = this.imagingOptionList.map((opt) => {
            return { ...opt, disabled: opt.value !== 'None' }
          })
        }
        if (!oldValue.includes('None') && !newValue.includes('None')) {
          this.imagingOptionList = [...this.tempImagingOptionList]
          this.imagingOptions = this.imagingOptions.filter((opt) => opt !== 'None')
        }
      } else {
        if (!oldValue.includes('None') && newValue.includes('None')) {
          this.tempImagingOptionList = [...this.imagingOptionList]
          this.imagingOptionList = this.imagingOptionList.map((opt) => {
            return { ...opt, disabled: opt.value !== 'None' }
          })
        }
        if (oldValue.includes('None') && !newValue.includes('None')) {
          this.imagingOptionList = [...this.tempImagingOptionList]
          this.imagingOptions = this.imagingOptions.filter((opt) => opt !== 'None')
        }
        if (oldValue.includes('None') === newValue.includes('None')) {
          // Mutually exclusive: 'ARC' disables 'Asset', and vice versa
          if (newValue.includes('ARC')) {
            this.imagingOptionList = this.imagingOptionList.map((opt) =>
              opt.value === 'Asset'
                ? { ...opt, disabled: true }
                : opt.value === 'EDR'
                ? { ...opt, disabled: true }
                : opt
            )
            if (!newValue.includes('EDR')) {
              this.imagingOptions = [...this.imagingOptions, 'EDR']
            }
          }
          if (newValue.includes('Asset')) {
            this.imagingOptionList = this.imagingOptionList.map((opt) =>
              opt.value === 'ARC' ? { ...opt, disabled: true } : opt
            )
            if (!oldValue.includes('Asset') && !newValue.includes('EDR')) {
              this.imagingOptions = [...this.imagingOptions, 'EDR']
            }
          }
          if (!newValue.includes('Asset') && !newValue.includes('ARC') && !newValue.includes('None')) {
            this.imagingOptionList = this.imagingOptionList.map((opt) =>
              this.pulseOption !== 'dwEpi' && (opt.value === 'ARC' || opt.value === 'Asset')
                ? { ...opt, disabled: false }
                : this.imagingOptionList.some((o) => o.value === 'ARC') && opt.value === 'EDR'
                ? { ...opt, disabled: false }
                : opt
            )
          }
        }
      }
    },
  },
}
</script>

<style scoped>
.icon {
  width: 100%;
}

.label {
  font-size: 12px;
  position: absolute;
  top: 3px;
  background-color: #6875a2;
  z-index: 2;
  width: 38px;
  left: 11px;
}

.main {
  position: absolute;
  color: #000;
}

.main-content {
  display: flex;
  background-color: #888686;
  border: 2px solid white;
}

.details {
  background-color: #6875a2;
  width: 400px;
}

.part1 {
  display: flex;
  padding: 10px 5px 5px 0px;

  div {
    width: 50%;
    display: flex;
    justify-content: flex-end;
    font-size: 12px;
    font-weight: bold;

    label {
      padding-top: 1px;
      margin: 0.25rem 0 0.25rem 0;
    }

    select {
      width: 100px;
      border-radius: 3px 3px 0 0;
      font-family: Arial, sans-serif;
      font-size: 12px;
      font-weight: bold;
      margin-left: 7px;
      padding: 2px 25px 0px 8px;
      background-color: #d3daf0; /* light blue-gray */
      box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #525e8a; /* dark bottom-right bevel */
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='black'><polygon points='4,6 8,10 12,6'/></svg>");
      background-repeat: no-repeat, no-repeat;
      background-position: right 4px center, right 8px center;
      background-size: 18px 100%, 12px 12px;
    }
  }
}

.part2 {
  display: flex;
}

.part2-content {
  position: relative;
  background-color: #6875a2;
  padding: 13px 6px 5px 6px;
  width: 50%;
  height: 374px;

  .part2-options {
    position: relative;
    z-index: 1;
    outline: solid 2px #000;
    padding: 7px 10px 50px 15px;
    height: 100%;

    label {
      font-size: 12px;
      font-weight: bold;
      display: flex;
      margin: 10px 0px 0px 0px;
      accent-color: black;
    }

    input {
      background-color: #6875a2;
      margin: 3px 0px 3px 0px;
    }

    label:has(input:disabled) {
      color: #525e8a;
      span {
        text-shadow: 0.5px 0.5px 0 #8f96c0, -1px -1px 0 #4b4b80;
        font-weight: normal;
      }
    }

    span {
      text-align: left;
      margin-left: 8px;
      margin-bottom: 0px;
    }
  }
}

hr {
  margin: 0px 5px 0px 0px;
  height: 4px;
  border: none;
  background: linear-gradient(to bottom, #465694 50%, lightgrey 50%);
}

.part3 {
  position: relative;
  background-color: #6875a2;
  padding: 13px 6px 5px 6px;
  height: 380px;

  .label {
    width: 70px;
  }

  .part3-options {
    position: relative;
    z-index: 1;
    outline: solid 2px #000;
    padding: 7px 10px 50px 15px;
    height: 100%;
    display: flex;

    .column {
      width: 50%;

      label {
        font-size: 12px;
        font-weight: bold;
        display: flex;
        margin: 10px 0px 0px 0px;
        accent-color: black;
      }

      input {
        background-color: #6875a2;
        margin: 3px 0px 3px 0px;
      }

      label:has(input:disabled) {
        color: #525e8a;
        span {
          text-shadow: 0.5px 0.5px 0 #8f96c0, -1px -1px 0 #4b4b80;
          font-weight: normal;
        }
      }

      span {
        text-align: left;
        margin-left: 8px;
        margin-bottom: 0px;
      }
    }
  }
}

.part4 {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 7px 6px 40px 0px;

  label {
    font-size: 12px;
    font-weight: bold;
    margin: 5px 10px;
  }

  input {
    font-size: xx-small;
    padding: 5px 10px 5px 10px;
    height: 22px;
    width: 270px;
    border-radius: 5px;
    background-color: white;
  }
}

.content {
  position: relative;
  background-color: #6875a2;
  padding: 13px 6px 5px 6px;

  .label {
    width: 86px;
  }

  .options {
    position: relative;
    z-index: 1;
    outline: solid 2px #000;
    padding: 7px 10px 50px 15px;
    height: 782px;
    width: 207px;

    label {
      font-size: 12px;
      font-weight: bold;
      display: flex;
      margin: 10px 0px 0px 0px;
      accent-color: white;
    }

    input {
      background-color: #6875a2;
      box-shadow: inset 1px 1px 2px #525e8a, /* light top-left bevel */ inset -1px -1px 2px #ffffff; /* dark bottom-right bevel */
      margin: 3px 0px 3px 0px;
    }

    label:has(input:disabled) {
      color: #525e8a;
      span {
        text-shadow: 0.5px 0.5px 0 #8f96c0, -1px -1px 0 #4b4b80;
        font-weight: normal;
      }
    }

    span {
      text-align: left;
      margin-left: 8px;
      margin-bottom: 0px;
    }
  }
}

.buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;

  div {
    width: 55px;
    padding: 1px;
    border-radius: 5px;
    box-shadow: inset 1px 1px 2px #525e8a, /* light top-left bevel */ inset -1px -1px 2px #ffffff; /* dark bottom-right bevel */

    button {
      width: 100%;
      height: 100%;
      border-radius: 5px;
      font-size: 12px;
      font-weight: bold;
      box-shadow: inset 1px 1px 2px #ffffff, /* light top-left bevel */ inset -1px -1px 2px #525e8a; /* dark bottom-right bevel */
    }
  }
}

.buttons.active {
  justify-content: flex-end;
  margin-top: 56px;
}
</style>
