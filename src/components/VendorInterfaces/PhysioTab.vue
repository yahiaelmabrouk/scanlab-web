<template>
  <div>
    <v-card width="100%" height="100%">
      <v-btn-toggle class="btn-1">
        <v-btn
          :class="{ 'v-btn--active v-item--active': component === 'PhysioSignal' }"
          @click="component = 'PhysioSignal'"
          >Signal</v-btn
        >
        <v-btn @click="component = 'PhysioCardiac'">Cardiac</v-btn>
        <v-btn @click="component = 'PhysioPace'">PACE</v-btn>
      </v-btn-toggle>
      <v-card-text>
        <div>
          <component
            :is="component"
            :selection-ident="selectionIdent"
            :sequence-type="sequenceType"
            :is-ultra-lab="isUltraLab"
            :should-pause-popup="shouldPausePopup"
          />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import PhysioSignal from './PhysioSignal.vue'
import PhysioCardiac from './PhysioCardiac.vue'
import PhysioPace from './PhysioPace.vue'

export default {
  data() {
    return {
      component: 'PhysioSignal',
    }
  },
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
    shouldPausePopup: {
      type: Boolean,
      required: false,
      default: true,
    },
    sequenceType: {
      type: String,
      required: true,
    },
  },
  components: { PhysioSignal, PhysioCardiac, PhysioPace },
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
}
::v-deep .v-card__text {
  padding: 0px;
  width: 100%;
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
