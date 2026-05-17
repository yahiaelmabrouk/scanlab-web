<template>
  <v-card class="pa-5">
    <v-container>
      <v-row>
        <v-col class="pb-0">
          <h5 class="text-left">Frequency Voxel:</h5>
        </v-col>
      </v-row>
      <v-row>
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
      <v-row>
        <v-col class="pb-0">
          <h5 class="text-left">Phase Voxel:</h5>
        </v-col>
      </v-row>
      <v-row>
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
    </v-container>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'ResolutionLabAnswerRanges',
  data() {
    return {
      freqVoxelMin: undefined,
      freqVoxelMax: undefined,
      phaseVoxelMin: undefined,
      phaseVoxelMax: undefined,
    }
  },
  computed: {
    ...mapState('selectionConfig', ['selectionConfigsByIdent']),
    ...mapGetters('questionService', ['answerCurrent', 'answerVariantCurrent']),
  },
  mounted() {
    this.setConfigs(this.answerCurrent)
  },
  methods: {
    ...mapActions('selectionConfig', ['setSelectionConfigCurrentIdent']),
    setConfigs(currentAnswer) {
      if (!currentAnswer) return

      this.freqVoxelMin = this.selectionConfigsByIdent['0_min']?.frequencyVoxelSize
      this.freqVoxelMax = this.selectionConfigsByIdent['0_max']?.frequencyVoxelSize
      this.phaseVoxelMin = this.selectionConfigsByIdent['0_min']?.phaseVoxelSize
      this.phaseVoxelMax = this.selectionConfigsByIdent['0_max']?.phaseVoxelSize
    },
    submitRangeParam(value, action, ident) {
      this.setSelectionConfigCurrentIdent({ ident })
      this.$store.dispatch('selectionConfig/' + action, { value })
    },
  },
  watch: {
    answerCurrent: {
      immediate: true,
      handler(newValue) {
        if (!newValue) return
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
      },
    },
    answerVariantCurrent: {
      immediate: true,
      handler(newValue) {
        if (!newValue) {
          this.setConfigs(this.answerCurrent)
        } else {
          this.setConfigs(newValue)
        }
      },
    },
  },
}
</script>

<style scoped lang="scss"></style>
