<template>
  <div>
    <div class="mt-10 mb-10">
      <h2>{{ $t('global.manage_contrast_range_presets') }}</h2>
    </div>
    <v-container>
      <b-card class="mb-2 mx-2">
        <v-row>
          <v-col cols="8">
            <v-combobox
              label="Presets"
              :items="presetItems"
              v-model="preset"
              @change="onPresetSelected"
              :disabled="!isPresetSelectEnabled"
              dense
            ></v-combobox>
          </v-col>
          <v-col cols="2">
            <v-btn
              v-if="currentState !== state.UPDATE"
              class="w-100 ma-1"
              color="primary"
              :disabled="!isEditEnabled"
              @click="onEditPreset"
              size="sm"
            >
              {{ $t('global.edit') }}
            </v-btn>
            <v-btn
              v-if="currentState === state.UPDATE"
              class="w-100 ma-1"
              color="primary"
              @click="onCancelEditPreset"
              size="sm"
            >
              {{ $t('global.cancel') }}
            </v-btn>
          </v-col>
          <v-col cols="2">
            <v-btn class="w-100 ma-1" color="error" :disabled="!isDeleteEnabled" @click="onDeletePreset" size="sm">
              {{ $t('global.delete') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="2">
            <v-btn
              v-if="currentState !== state.CREATING"
              class=""
              color="primary"
              :disabled="!isCreateEnabled"
              @click="onCreatePreset"
              size="sm"
            >
              {{ $t('global.create') }}
            </v-btn>
            <v-btn
              v-if="currentState === state.CREATING"
              class=""
              color="warning"
              @click="onCancelCreatePreset"
              size="sm"
            >
              {{ $t('global.cancel') }}
            </v-btn>
          </v-col>
          <v-col cols="10">
            <v-sheet outlined class="pa-2 h-100">
              {{ presetTitle }}
            </v-sheet>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-row>
              <v-col>
                <v-combobox
                  label="Weighting"
                  :items="weightingItems"
                  v-model="weighting"
                  :disabled="!isComboBoxEnabled"
                  dense
                ></v-combobox>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-combobox
                  label="Mag. Prep"
                  :items="magPrepItems"
                  v-model="magPrep"
                  :disabled="!isComboBoxEnabled"
                  dense
                ></v-combobox>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-combobox
                  label="Sequence"
                  :items="sequenceItems"
                  :return-object="true"
                  v-model="sequence"
                  :disabled="!isComboBoxEnabled"
                  dense
                ></v-combobox>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-combobox
                  label="Body Part"
                  :items="bodyPartItems"
                  v-model="bodyPart"
                  :disabled="!isComboBoxEnabled"
                  dense
                ></v-combobox>
              </v-col>
            </v-row>
          </v-col>
          <v-col>
            <FieldStrengthEditor
              :field-strength-ranges="fieldStrengthRangeObject"
              :is-enabled="isFieldStrengthEditorEnabled"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col class="text-right">
            <v-btn class="w-25" color="primary" :disabled="!isSaveEnabled" @click="onSavePreset" size="sm">
              {{ $t('global.save') }}
            </v-btn>
          </v-col>
        </v-row>
      </b-card>
    </v-container>
  </div>
</template>
<script>
import { mapState } from 'vuex'
import { apiGet, apiPost, apiPut, apiDelete } from '../../util/api'
import FieldStrengthEditor from '@/components/FieldStrengthEditor'
export default {
  name: 'ManageContrastRangePresets',
  components: {
    FieldStrengthEditor,
  },
  data() {
    return {
      fieldStrengthRangeObject: undefined,
      weighting: undefined,
      magPrep: undefined,
      sequence: undefined,
      bodyPart: undefined,
      preset: undefined,
      presetItems: [],
      weightingItems: [
        {
          text: 'T1',
          value: 'T1',
        },
        {
          text: 'T2',
          value: 'T2',
        },
        {
          text: 'Proton Density',
          value: 'Proton Density',
        },
        {
          text: 'Diffusion',
          value: 'Diffusion',
        },
        {
          text: 'None',
          value: null,
        },
      ],
      magPrepItems: [
        {
          text: 'Fat Suppression',
          value: 'Fat Suppression',
        },
        {
          text: 'FLAIR',
          value: 'FLAIR',
        },
        {
          text: 'STIR',
          value: 'STIR',
        },
        {
          text: 'None',
          value: null,
        },
      ],
      sequenceItems: [
        {
          text: 'Spin Echo',
          value: 'SE',
        },
        {
          text: 'Fast Spin Echo',
          value: 'TSE',
        },
        {
          text: 'Gradient Echo',
          value: 'GRE',
        },
        {
          text: 'None',
          value: null,
        },
      ],
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
        {
          text: 'None',
          value: null,
        },
      ],
      state: { CREATING: 0, READING: 1, UPDATE: 2, DELETE: 3 },
      currentState: undefined,
    }
  },
  created() {
    this.fetchPresets()
  },
  mounted() {
    this.buildRanges()
    this.currentState = this.state.READING
  },
  methods: {
    async fetchPresets() {
      await apiGet('contrastRangePresets', this.accessToken).then((response) => {
        this.presetItems = response.data.presets.map((preset) => {
          this.buildPresetTitle('test')
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
    buildPresetTitle(preset) {
      let output = []
      if (preset.weighting) output.push(preset.weighting)
      if (preset.magPrep) output.push(preset.magPrep)
      if (preset.sequence) output.push(preset.sequence)
      if (preset.bodyPartId) output.push(this.bodyPartItems.find((bp) => bp.value == preset.bodyPartId).text)
      return output.join(' > ')
    },
    async onSavePreset() {
      let data = {
        weighting: this.weighting?.value,
        magPrep: this.magPrep?.value,
        sequence: this.sequence?.value,
        bodyPartId: this.bodyPart?.value,
        ranges: JSON.parse(JSON.stringify(this.fieldStrengthRangeObject)),
      }
      if (this.currentState == this.state.UPDATE) {
        apiPut('contrastRangePresets/' + this.preset.value, '', data, this.accessToken).then(() => {
          this.fetchPresets()
          this.currentState = this.state.READING
        })
      } else if (this.currentState == this.state.CREATING) {
        apiPost('contrastRangePresets', data, this.accessToken).then(() => {
          this.fetchPresets()
          this.resetComboBoxes()
          this.currentState = this.state.READING
        })
      }
    },
    async onDeletePreset() {
      await apiDelete('contrastRangePresets/' + this.preset.value, this.accessToken).then(() => {
        this.fetchPresets()
        this.preset = undefined
        this.resetComboBoxes()
        this.buildRanges()
        this.currentState = this.state.READING
      })
    },
    addParamToRange(ranges, param, value = 0) {
      ranges['1.5']['min'][param] = value
      ranges['1.5']['max'][param] = value
      ranges['3.0']['min'][param] = value
      ranges['3.0']['max'][param] = value
    },
    buildRanges() {
      let ranges = {
        1.5: {
          min: {},
          max: {},
        },
        '3.0': {
          min: {},
          max: {},
        },
      }

      if (this.sequence?.value === 'GRE') {
        this.addParamToRange(ranges, 'echoTime')
        this.addParamToRange(ranges, 'repetitionTime')
      } else if (this.sequence?.value === 'SE' || this.sequence?.value === 'TSE') {
        this.addParamToRange(ranges, 'echoTime')
        this.addParamToRange(ranges, 'repetitionTime')
      }

      if (this.magPrep?.value === 'STIR' || this.magPrep?.value === 'FLAIR') {
        this.addParamToRange(ranges, 'inversionTime')
      }

      if (this.weighting?.value === 'Diffusion') {
        this.addParamToRange(ranges, 'bValueLower')
        this.addParamToRange(ranges, 'bValueUpper')
      }

      // if (this.weighting?.value === 'T1' || this.weighting?.value === 'T2') {
      // }

      this.addParamToRange(ranges, 'flipAngle')
      this.addParamToRange(ranges, 'snr')

      this.fieldStrengthRangeObject = ranges
    },
    onPresetSelected(preset) {
      console.log('selectPreset', preset)
      this.weighting = preset.weighting
      this.magPrep = preset.magPrep
      this.sequence = this.sequenceItems.find((s) => s.value == preset.sequence).text
      this.bodyPart = this.bodyPartItems.find((bp) => bp.value == preset.bodyPartId).text
      // Add SNR to existing presets that don't have it
      const ranges = preset.ranges
      if (ranges['1.5']?.min && !('snr' in ranges['1.5'].min)) {
        ranges['1.5'].min.snr = 0
        ranges['1.5'].max.snr = 0
      }
      if (ranges['3.0']?.min && !('snr' in ranges['3.0'].min)) {
        ranges['3.0'].min.snr = 0
        ranges['3.0'].max.snr = 0
      }
      this.fieldStrengthRangeObject = ranges
    },
    onCreatePreset() {
      this.resetComboBoxes()
      this.buildRanges()
      this.preset = undefined
      this.currentState = this.state.CREATING
    },
    onCancelCreatePreset() {
      this.resetComboBoxes()
      this.buildRanges()
      this.currentState = this.state.READING
    },
    onEditPreset() {
      this.currentState = this.state.UPDATE
    },
    onCancelEditPreset() {
      let presetId = this.preset.value
      this.fetchPresets()
      this.preset = this.presetItems.find((p) => p.value == presetId)
      this.fieldStrengthRangeObject = this.preset.ranges
      this.currentState = this.state.READING
    },
    resetComboBoxes() {
      this.bodyPart = undefined
      this.weighting = undefined
      this.magPrep = undefined
      this.sequence = undefined
    },
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    presetTitle() {
      let output = []
      if (this.currentState == this.state.CREATING) {
        if (this.weighting?.value) output.push(this.weighting.value)
        if (this.magPrep?.value) output.push(this.magPrep.value)
        if (this.sequence?.value) output.push(this.sequence.value)
        if (this.bodyPart?.value) output.push(this.bodyPart.text)
      }

      return output.join(' > ')
    },
    isSaveEnabled() {
      let output = false
      let values = [this.bodyPart, this.sequence, this.weighting, this.magPrep]
      if (!values.includes(undefined) && values.some((value) => value.value !== null)) {
        if (this.currentState == this.state.CREATING || this.currentState == this.state.UPDATE) {
          output = true
        }
      }
      return output
    },
    isDeleteEnabled() {
      let ouptut = false
      if (this.preset) {
        ouptut = true
      }
      return ouptut
    },
    isCreateEnabled() {
      let output = false
      if (this.currentState == this.state.READING) {
        output = true
      }
      return output
    },
    isEditEnabled() {
      let output = false
      if (this.currentState == this.state.READING && this.preset) {
        output = true
      }
      return output
    },
    isPresetSelectEnabled() {
      let output = false
      if (this.currentState == this.state.READING) {
        output = true
      }
      return output
    },
    isComboBoxEnabled() {
      let output = false
      if (this.currentState == this.state.CREATING) {
        output = true
      }
      return output
    },
    isFieldStrengthEditorEnabled() {
      let output = false
      if (this.currentState == this.state.CREATING || this.currentState == this.state.UPDATE) {
        output = true
      }
      return output
    },
  },
  watch: {
    sequence() {
      if (this.currentState == this.state.CREATING) {
        this.buildRanges()
      }
    },
    magPrep() {
      if (this.currentState == this.state.CREATING) {
        this.buildRanges()
      }
    },
    weighting() {
      if (this.currentState == this.state.CREATING) {
        this.buildRanges()
      }
    },
  },
}
</script>
<style scoped lang="scss"></style>
