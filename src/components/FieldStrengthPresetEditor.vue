<template>
  <v-card class="pa-5">
    <v-container>
      <v-row v-if="isUltraLab">
        <v-col class="pb-0">
          <h5 class="text-left">Pixel Shift:</h5>
        </v-col>
      </v-row>
      <v-row v-if="isUltraLab">
        <v-col class="py-0">
          <v-text-field
            v-model.number="pixelShiftMin"
            outlined
            dense
            label="Min"
            type="number"
            @change="(e) => submitRangeParam(e, 'adjustPixelShift', '0_min')"
          />
        </v-col>
        <v-col class="py-0">
          <v-text-field
            v-model.number="pixelShiftMax"
            outlined
            dense
            label="Max"
            type="number"
            @change="(e) => submitRangeParam(e, 'adjustPixelShift', '0_max')"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-combobox label="Presets" :items="presetItems" :value="preset" @change="onPresetSelected" dense />
        </v-col>
      </v-row>
      <v-row v-if="isUltraLab">
        <v-col class="pb-0">
          <h5 class="text-left">Frequency Voxel:</h5>
        </v-col>
      </v-row>
      <v-row v-if="isUltraLab">
        <v-col class="py-0">
          <v-text-field
            v-model.number="freqVoxelMin"
            outlined
            dense
            label="Min"
            type="number"
            @change="(e) => submitRangeParam(e, 'adjustFreqVoxelSize', '0_min')"
          />
        </v-col>
        <v-col class="py-0">
          <v-text-field
            v-model.number="freqVoxelMax"
            outlined
            dense
            label="Max"
            type="number"
            @change="(e) => submitRangeParam(e, 'adjustFreqVoxelSize', '0_max')"
          />
        </v-col>
      </v-row>
      <v-row v-if="isUltraLab">
        <v-col class="pb-0">
          <h5 class="text-left">Phase Voxel:</h5>
        </v-col>
      </v-row>
      <v-row v-if="isUltraLab">
        <v-col class="py-0">
          <v-text-field
            v-model.number="phaseVoxelMin"
            outlined
            dense
            label="Min"
            type="number"
            @change="(e) => submitRangeParam(e, 'adjustPhaseVoxelSize', '0_min')"
          />
        </v-col>
        <v-col class="py-0">
          <v-text-field
            v-model.number="phaseVoxelMax"
            outlined
            dense
            label="Max"
            type="number"
            @change="(e) => submitRangeParam(e, 'adjustPhaseVoxelSize', '0_max')"
          />
        </v-col>
      </v-row>
      <v-row v-if="isUltraLab">
        <v-col class="pb-0">
          <h5 class="text-left">Scan Time:</h5>
        </v-col>
      </v-row>
      <v-row v-if="isUltraLab">
        <h6 class="text-left">Min:</h6>
        <v-col class="py-0">
          <v-text-field
            :value="scanTimeMinutesMin"
            outlined
            dense
            label="Minutes"
            type="number"
            @change="(e) => onScanTimeChanged(e, scanTimeSecondsMin, '0_min')"
          />
        </v-col>
        <v-col class="py-0">
          <v-text-field
            :value="scanTimeSecondsMin"
            outlined
            dense
            label="Seconds"
            type="number"
            @change="(e) => onScanTimeChanged(scanTimeMinutesMin, e, '0_min')"
          />
        </v-col>
      </v-row>
      <v-row v-if="isUltraLab">
        <h6 class="text-left">Max:</h6>
        <v-col class="py-0">
          <v-text-field
            :value="scanTimeMinutesMax"
            outlined
            dense
            label="Minutes"
            type="number"
            @change="(e) => onScanTimeChanged(e, scanTimeSecondsMax, '0_max')"
          />
        </v-col>
        <v-col class="py-0">
          <v-text-field
            :value="scanTimeSecondsMax"
            outlined
            dense
            label="Seconds"
            type="number"
            @change="(e) => onScanTimeChanged(scanTimeMinutesMax, e, '0_max')"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>
<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { apiGet } from '@/util/api'
export default {
  name: 'FieldStrengthPresetEditor',
  components: {},
  props: {
    /*presetId: {
      type: Number,
      required: false,
      default: undefined,
    },
    stackQuestion: {
      type: Object,
      required: true,
    },
    */
    isUltraLab: {
      type: Boolean,
      required: false,
      defualt: true,
    },
  },
  data() {
    return {
      presetItems: [],
      pixelShiftMin: undefined,
      pixelShiftMax: undefined,
      freqVoxelMin: undefined,
      freqVoxelMax: undefined,
      phaseVoxelMin: undefined,
      phaseVoxelMax: undefined,
      scanTimeMin: undefined,
      scanTimeMax: undefined,
      presetId: undefined,
      bodyPartItems: [
        {
          text: 'Brain',
          value: 1,
        },
        {
          text: 'Knee',
          value: 21,
        },
        {
          text: 'Lumbar',
          value: 9,
        },
      ],
    }
  },
  created() {
    this.fetchPresets()
  },
  mounted() {
    this.setConfigs(this.answerCurrent)
  },
  methods: {
    ...mapActions('selectionConfig', ['setSelectionConfigCurrentIdent']),
    async fetchPresets() {
      await apiGet('contrastRangePresets', this.accessToken).then((response) => {
        this.presetItems = response.data.presets.map((preset) => {
          return {
            text: this.buildPresetTitle(preset),
            value: preset.id,
            weighting: preset.weighting,
            magPrep: preset.magPrep,
            sequence: preset.sequence,
            bodyPartId: preset.bodyPartId,
            ranges: preset.ranges,
          }
        })
        this.presetItems.sort((a, b) => {
          if (a.text < b.text) {
            return -1
          } else if (a.text > b.text) {
            return 1
          } else {
            return 0
          }
        })
      })
    },
    setConfigs(currentAnswer) {
      if (!currentAnswer.fieldStrengthRanges) {
        currentAnswer.fieldStrengthRanges = { 1.5: { min: {}, max: {} }, '3.0': { min: {}, max: {} } }
      }
      this.pixelShiftMin = this.selectionConfigsByIdent['0_min']?.pixelShift
      this.pixelShiftMax = this.selectionConfigsByIdent['0_max']?.pixelShift
      this.freqVoxelMin = this.selectionConfigsByIdent['0_min']?.frequencyVoxelSize
      this.freqVoxelMax = this.selectionConfigsByIdent['0_max']?.frequencyVoxelSize
      this.phaseVoxelMin = this.selectionConfigsByIdent['0_min']?.phaseVoxelSize
      this.phaseVoxelMax = this.selectionConfigsByIdent['0_max']?.phaseVoxelSize
      this.scanTimeMin = this.selectionConfigsByIdent['0_min']?.scanTime
      this.scanTimeMax = this.selectionConfigsByIdent['0_max']?.scanTime
    },
    copyRanges(prevRanges, newAnswer) {
      newAnswer.fieldStrengthRanges = prevRanges
    },
    buildPresetTitle(preset) {
      let output = []
      if (preset.weighting) output.push(preset.weighting)
      if (preset.magPrep) output.push(preset.magPrep)
      if (preset.sequence) output.push(preset.sequence)
      if (preset.bodyPartId) output.push(this.bodyPartItems.find((bp) => bp.value == preset.bodyPartId).text)
      return output.join(' > ')
    },
    onPresetSelected(preset) {
      const currentAnswer = this.answerVariantCurrent || this.answerCurrent
      currentAnswer.fieldStrengthRanges = preset.ranges
      currentAnswer.fieldStrengthPresetId = preset.value
      //this.stackQuestion.contrastRangePresetId = preset.value
      this.presetId = preset.value
    },
    onScanTimeChanged(minutes, seconds, ident) {
      let scantime = Number(minutes) * 60 + Number(seconds)
      this.submitRangeParam(scantime, 'adjustScanTime', ident)
      if (ident === '0_min') {
        this.scanTimeMin = scantime
      } else {
        this.scanTimeMax = scantime
      }
    },
    submitRangeParam(value, action, ident) {
      this.setSelectionConfigCurrentIdent({ ident })
      this.$store.dispatch('selectionConfig/' + action, { value })
    },
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('selectionConfig', ['selectionConfigsByIdent']),
    ...mapGetters('questionService', ['answerCurrent', 'answerVariantCurrent']),
    scanTimeMinutesMin() {
      return Math.floor(this.scanTimeMin / 60)
    },
    scanTimeSecondsMin() {
      return this.scanTimeMin % 60
    },
    scanTimeMinutesMax() {
      return Math.floor(this.scanTimeMax / 60)
    },
    scanTimeSecondsMax() {
      return this.scanTimeMax % 60
    },
    preset() {
      if (this.presetId && this.presetItems) {
        return this.presetItems.find((preset) => preset.value == this.presetId)
      }
      return undefined
    },
  },
  watch: {
    answerCurrent: {
      immediate: true,
      handler(newValue, oldValue) {
        console.log('answerCurrent changed', newValue, oldValue)
        if (!newValue) return

        if (oldValue?.fieldStrengthRanges && !newValue.fieldStrengthRanges) {
          this.copyRanges(oldValue.fieldStrengthRanges, newValue)
          newValue.fieldStrengthPresetId = oldValue.fieldStrengthPresetId
        }
        this.presetId = newValue.fieldStrengthPresetId
        this.setConfigs(newValue)
      },
    },
    selectionConfigsByIdent: {
      immediate: true,
      handler() {
        if (!this.answerVariantCurrent) {
          this.setConfigs(this.answerCurrent)
        } else {
          this.setConfigs(this.answerVariantCurrent)
        }
        //this.setConfigs(newValue)
      },
    },
    answerVariantCurrent: {
      immediate: true,
      handler(newValue, oldValue) {
        console.log('answerVariantCurrent changed', newValue, oldValue)
        if (!newValue) {
          this.presetId = this.answerCurrent.fieldStrengthPresetId
          this.setConfigs(this.answerCurrent)
        } else {
          if (oldValue?.fieldStrengthRanges && !newValue.fieldStrengthRanges) {
            this.copyRanges(oldValue.fieldStrengthRanges, newValue)
            newValue.fieldStrengthPresetId = oldValue.fieldStrengthPresetId
          }
          this.presetId = newValue.fieldStrengthPresetId
          this.setConfigs(newValue)
        }
      },
    },
  },
}
</script>
<style scoped lang="scss"></style>
