<template>
  <div style="height: 100%">
    <v-card width="100%" height="100%">
      <v-btn-toggle class="btn-1">
        <v-btn :class="{ 'v-btn--active v-item--active': component === 'Coils' }" @click="component = 'Coils'"
          >Coils</v-btn
        >
        <v-btn @click="component = 'SystemMiscellaneous'">Miscellaneous</v-btn>
        <v-btn @click="component = 'SystemAdjustments'">Adjustments</v-btn>
        <v-btn @click="component = 'SystemAdjustvol'">Adjust Volume</v-btn>
        <v-btn @click="component = 'SystemTx'">Tx/Rx</v-btn>
      </v-btn-toggle>
      <v-card-text style="position: unset;">
        <div style="height: 100%">
          <component :is="component" :selection-ident="selectionIdent" :sequence-type="sequenceType" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin.js'
import { MriMixin } from '../Mixins/MriMixin.js'
import { mapState, mapActions, mapGetters } from 'vuex'
import SystemMiscellaneous from './SystemMiscellaneous.vue'
import SystemAdjustments from './SystemAdjustments.vue'
import SystemAdjustvol from './SystemAdjustvol.vue'
import SystemTx from './SystemTx.vue'
import Coils from './SystemCoil.vue'
import EventBus from '@/lib/event-bus'
import _ from 'lodash'
export default {
  mixins: [MriMixin, SelectionConfigMixin],
  components: { Coils, SystemMiscellaneous, SystemAdjustments, SystemAdjustvol, SystemTx },
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
      component: 'Coils',
    }
  },
  computed: {
    ...mapGetters('user', ['softwareVendorPreference', 'softwareVersionPreference']),
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
    // ...mapGetters("dataToParent", ['getOversamplings']),
    // oversampling() {
    //   return this.getOversampling;
    // },
  },
  methods: {
    ...mapActions('selectionConfig', [
      'resetSelection',
      'getHeightFromNumberOfSlicesThicknessSpacing',
      'getNumberOfSlicesFromHeightThicknessSpacing',
    ]),
  },
  mounted() {
    EventBus.$on('onSliceViewWindowChange', this.onSliceViewWindowChange)
  },
}
</script>
<style scoped>
.btn-1 {
  display: flex;
  width: 100%;
  background: black;
}
.v-btn:not(.v-btn--round).v-size--default {
  min-width: 0px !important;
  padding: 0 12px;
}
.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
}
::v-deep .v-card__text {
  padding: 0px;
  width: 100%;
  height: 95%;
}
.theme--light.v-btn-toggle:not(.v-btn-toggle--group) {
  background: black;
}
.v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  border: 1px solid #5a5252 !important;
  background: black;
  border-radius: 0px;
  border-top: none !important;
  width: 15%;
}
.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: rgb(136, 136, 136) !important;
}
.v-btn {
  font-size: 8px !important;
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: 0px;
  border-top: none !important;
  height: 23px !important;
}
</style>
