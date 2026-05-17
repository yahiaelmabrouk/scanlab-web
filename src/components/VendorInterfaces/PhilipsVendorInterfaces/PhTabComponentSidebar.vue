<template>
  <div class="column">
    <div class="sub-columns scrollable" style="background-color: #d5d7d7">
      <div v-for="(value, key) in data" :key="key" class="sub-column">
        <div class="subcolumn-key">{{ key }}</div>
        <div class="subcolumn-value" @click="startEdit(key)">
          <template>
            {{ value }}
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import SpinButton from './PhSpinButton.vue'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  // eslint-disable-next-line vue/no-unused-components
  components: { SpinButton },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  computed: {
    ...mapState('dataToParent', ['data']),
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
    ...mapActions('selectionConfig', ['updateField', 'resetAllFields']),
    ...mapActions('scanTimeConfig', [
      'updateVendorStylePreference',
      'updateIsUltraLab',
      'updateSelectionIdent',
      'updateOversamplingPercentage',
      'updateTrueResolutionHeaderUltra',
      'updateTrueResolutionHeader',
      'updateAcquiredResolutionHeader',
      'updateMinConcatAcqPackage',
      'updateRepetitionTime',
    ]),
    ...mapMutations('dataToParent', ['setScanTime', 'setSequenceType']),
    ...mapActions('dataToParent', ['updateScanTime', 'updateOversamplings']),
    updateExample() {
      this.updateField({ field: 'APFOV', value: 320 }) // Example of updating a field
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
}

@media screen and (max-width: 1600px) and (max-height: 900px) {
  .scrollable {
    overflow-y: scroll;
    max-height: 100% !important;
  }
}

@media screen and (max-width: 1680px) and (max-height: 1050px) {
  .scrollable {
    overflow-y: scroll;
    max-height: 100% !important;
  }
}

.scrollable {
  overflow-y: scroll;
  max-height: 100%;
}

::v-deep .v-input__slot fieldset {
  background: white !important;
  border-color: white !important;
  border-radius: 0px !important;
}

::v-deep .v-icon.v-icon {
  color: black !important;
}

.v-input__control {
  height: 2rem !important;
}

::v-deep .v-text-field--outlined.v-input--has-state fieldset,
.v-text-field--outlined.v-input--is-focused fieldset {
  border: 1px solid;
}
</style>
