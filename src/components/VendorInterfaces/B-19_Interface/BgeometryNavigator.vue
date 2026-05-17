<template>
  <v-card color="rgb(46 44 44)" height="100%" width="100%">
    <v-card-text>
      <div class="text-1 my-2">
        <label class="label-size inactive-label">Navigator</label>
        <div class="text-2">
          <v-text-field
            value="null"
            v-model="navigator"
            type="number"
            outlined
            dense
            append-icon="mdi-menu-down"
            style="width: 14vw; max-width: 25%; margin-left: 2%"
            disabled="true"
            :typeofcomponent="'true'"
            @input="changeNavigator"
          >
          </v-text-field>

          <div>
            <v-btn @click="increaseNumber" class="btn-2" disabled="true">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn @click="decreaseNumber" class="btn-2" disabled="true">
              <v-icon>mdi-minus</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import BspinButton from './BspinButton.vue'
export default {
  mixins: [SelectionConfigMixin, MriMixin],
  components: { BspinButton },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    sequenceType: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      navigator: null,
    }
  },
  methods: {
    ...mapActions('dataToParent', ['updateScanTime']),
    increaseNumber() {
      this.number++
    },
    decreaseNumber() {
      if (this.number > 1) {
        this.number--
      }
    },
    changeNavigator(value) {
      this.navigator = value
    },
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
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
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
.v-btn {
  font-size: 11px !important;
  background: #c0c0c0 !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
  width: 11% !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}

.label-size {
  width: 15%;
  display: flex;
  justify-content: right;
}

::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}

label {
  font-size: 90%;
  color: white !important;
}

::v-deep .v-text-field--outlined.v-input--dense.v-text-field--outlined > .v-input__control > .v-input__slot {
  min-height: 32px;
}

::v-deep .v-text-field__details {
  display: none;
}

.v-input--is-focused {
  display: block !important;
}

::v-deep .v-input__icon {
  height: 11px !important;
  border: 1px solid #c0c0c0;
  background: #c0c0c0;
  width: 19px !important;
  min-width: 19px !important;
}

::v-deep .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__append-inner {
  margin-top: 5px !important;
}

::v-deep .v-input__append-inner {
  padding-left: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}

.text-2 {
  display: flex;
}

.text-1 {
  display: flex;
  color: white;
}

::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-input__slot {
  margin-bottom: 0px;
}

::v-deep.v-text-field.v-text-field--enclosed .v-text-field__details {
  margin-bottom: 0px;
}

.v-text-field {
  padding-top: 0px;
  margin-top: 0px;
}

::v-deep .v-input__slot fieldset {
  background: white;
  border-color: white !important;
  border-radius: 0px;
}

::v-deep .v-text-field__slot {
  border: 1px solid white !important;
  background: white;
  border-color: white !important;
  border-radius: 0px;
  height: 1.05rem;
  border-bottom: none;
  border-radius: 0px;
  margin-top: 5px;
  height: 16px;
}

::v-deep .v-icon.v-icon {
  color: black !important;
  font-size: 17px;
}

.v-input {
  max-width: 45%;
}

::v-deep .v-text-field input {
  padding: 0px;
}

.btn-2 {
  width: 20px !important;
  height: 15px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #c0c0c0 !important;
  margin: 0.15rem;
  border-radius: 0px;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 11px !important;
  right: 10px;
  top: 0px !important;
}

.main-1 {
  display: flex;
  justify-content: space-around;
  color: white !important;
}

.main-2 {
  color: white !important;
}

.btn-1 {
  display: flex;
  width: 66.75%;
  justify-content: space-between;
}

.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
  height: 86%;
}

.v-sheet.v-card {
  border-radius: 0px;
}

::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}

.active-label {
  color: black; /* Black color for active state */
}

.inactive-label {
  color: grey !important; /* Grey color for inactive state */
}
</style>
