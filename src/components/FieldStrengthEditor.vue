<template>
  <v-card class="pa-5">
    <header>
      <!-- eslint-disable-next-line vue-i18n/no-raw-text Admin-Only Text -->
      <h4>Field Strength Ranges</h4>
      <v-select v-model="currentFieldStrength" label="Field Strength" :items="fieldStrengthOptions" dense outlined>
      </v-select>
    </header>
    <hr class="mt-5" />

    <section
      v-for="variablePropName in Object.keys(fieldStrengthRanges[currentFieldStrength].min)"
      :key="variablePropName"
    >
      <v-row align="center" no-gutters>
        <v-col cols="4">
          <h5>{{ humanReadablePropName(variablePropName) }}</h5>
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model.number="fieldStrengthRanges[currentFieldStrength].min[variablePropName]"
            rounded
            outlined
            dense
            label="Min"
            type="number"
            :disabled="!isEnabled"
            @change="updateAnswer"
          />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model.number="fieldStrengthRanges[currentFieldStrength].max[variablePropName]"
            rounded
            outlined
            dense
            label="Max"
            type="number"
            :disabled="!isEnabled"
            @change="updateAnswer"
          />
        </v-col>
      </v-row>
    </section>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'FieldStrengthEditor',
  components: {},
  props: {
    fieldStrengthRanges: {
      required: false,
      type: Object,
      default: () => ({
        // eslint-disable-next-line prettier/prettier
        1.5: {
          min: {
            echoTime: 0,
            repetitionTime: 0,
            snr: 0,
          },
          max: {
            echoTime: 0,
            repetitionTime: 0,
            snr: 0,
          },
        },
        '3.0': {
          min: {
            echoTime: 0,
            repetitionTime: 0,
            snr: 0,
          },
          max: {
            echoTime: 0,
            repetitionTime: 0,
            snr: 0,
          },
        },
      }),
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      currentFieldStrength: '3.0',
      fieldStrengthOptions: [
        { text: '1.5T', value: '1.5' },
        { text: '3.0T', value: '3.0' },
      ],
    }
  },
  computed: {
    ...mapGetters('questionService', ['answerCurrent']),
  },
  methods: {
    updateAnswer() {
      if (this.answerCurrent) this.answerCurrent.fieldStrengthRanges = this.fieldStrengthRanges
    },
    humanReadablePropName(propName) {
      return (
        propName
          // Insert a space before all caps
          .replace(/([A-Z])/g, ' $1')
          // Uppercase the first character
          .replace(/^./, function (str) {
            return str.toUpperCase()
          })
          // Trim any leading spaces
          .trim()
      )
    },
  },
}
</script>

<style lang="scss" scoped>
h6 {
  align-content: center;
}
</style>
