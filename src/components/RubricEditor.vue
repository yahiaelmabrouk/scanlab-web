<template>
  <div>
    <v-row>
      <v-col>
        <v-btn icon @click="copyRubric" color="black">
          <v-icon>mdi-clipboard-text</v-icon>
        </v-btn>
        <v-tabs-items v-model="tab">
          <v-tab-item v-for="(factorEntry, i) in factorOverrides" :key="factorTabs[i]">
            <div v-if="!factorEntry[1].ignore">
              <div v-if="!factorEntry[1].directional">
                <v-text-field
                  v-model.number="factorEntry[1].scoring.maximumPointLoss"
                  label="Max Point Loss"
                ></v-text-field>
                <v-text-field v-model.number="factorEntry[1].scoring.linearBuffer" label="Linear Buffer"></v-text-field>
                <v-text-field v-model.number="factorEntry[1].scoring.linearFactor" label="Linear Factor"></v-text-field>
                <v-text-field
                  v-model.number="factorEntry[1].scoring.quadraticBuffer"
                  label="Quadratic Buffer"
                ></v-text-field>
                <v-text-field
                  v-model.number="factorEntry[1].scoring.quadraticFactor"
                  label="Quadratic Factor"
                ></v-text-field>
              </div>
              <div v-if="factorEntry[1].directional">
                <v-text-field
                  v-model.number="factorEntry[1].scoringTooLow.maximumPointLoss"
                  label="Max Point Loss (Lower)"
                ></v-text-field>
                <v-text-field
                  v-model.number="factorEntry[1].scoringTooLow.linearBuffer"
                  label="Linear Buffer (Lower)"
                ></v-text-field>
                <v-text-field
                  v-model.number="factorEntry[1].scoringTooLow.linearFactor"
                  label="Linear Factor (Lower)"
                ></v-text-field>
                <v-text-field
                  v-model.number="factorEntry[1].scoringTooLow.quadraticBuffer"
                  label="Quadratic Buffer (Lower)"
                ></v-text-field>
                <v-text-field
                  v-model.number="factorEntry[1].scoringTooLow.quadraticFactor"
                  label="Quadratic Factor (Lower)"
                ></v-text-field>
              </div>
              <div v-if="factorEntry[1].directional">
                <v-text-field
                  v-model.number="factorEntry[1].scoringTooHigh.maximumPointLoss"
                  label="Max Point Loss (Higher)"
                ></v-text-field>
                <v-text-field
                  v-model.number="factorEntry[1].scoringTooHigh.linearBuffer"
                  label="Linear Buffer (Higher)"
                ></v-text-field>
                <v-text-field
                  v-model.number="factorEntry[1].scoringTooHigh.linearFactor"
                  label="Linear Factor (Higher)"
                ></v-text-field>
                <v-text-field
                  v-model.number="factorEntry[1].scoringTooHigh.quadraticBuffer"
                  label="Quadratic Buffer (Higher)"
                ></v-text-field>
                <v-text-field
                  v-model.number="factorEntry[1].scoringTooHigh.quadraticFactor"
                  label="Quadratic Factor (Higher)"
                ></v-text-field>
              </div>
            </div>
          </v-tab-item>
        </v-tabs-items>
      </v-col>
      <v-col>
        <v-tabs vertical v-model="tab" v-if="factorTabs">
          <!-- <v-tabs-slider /> -->
          <v-tab v-for="(factorEntry, i) in factorOverrides" :key="factorTabs[i]">
            <!--{{ $t(`global.${factorEntry[1].keyName}`) }}-->
            {{ $t(`global.${factorEntry[1].keyName}`) }}
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>
  </div>
</template>
<script>
export default {
  name: 'RubricEditor',
  props: {
    rubric: {
      type: Object,
      required: true,
    },
  },
  mounted() {
    this.factorOverrides = Object.entries(this.$props.rubric.factors).filter((f) => f[1].ignore == false)
    this.factorTabs = this.factorOverrides.map((f) => f[0])
  },
  data() {
    return {
      factorOverrides: null,
      factorTabs: null,
      tab: null,
    }
  },
  methods: {
    copyRubric() {
      navigator.clipboard.writeText(JSON.stringify(this.factorOverrides))
    },
  },
}
</script>
<style scoped lang="scss"></style>
