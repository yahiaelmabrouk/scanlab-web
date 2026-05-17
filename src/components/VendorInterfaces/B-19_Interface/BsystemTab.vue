<template>
  <div>
    <v-card width="100%" height="100%">
      <v-btn-toggle class="btn-1">
        <v-btn
          :class="{ 'v-btn--active v-item--active': component === 'BsystemCoils' }"
          @click="component = 'BsystemCoils'"
          >Coils</v-btn
        >
        <v-btn @click="component = 'BsystemMiscellaneous'">Miscellaneous</v-btn>
        <v-btn @click="component = 'BsystemAdjustments'">Adjustments</v-btn>
        <v-btn @click="component = 'BsystemTransmitter'">Transmitter/Receiver</v-btn>
      </v-btn-toggle>
      <v-card-text>
        <div>
          <component :is="component" :selection-ident="selectionIdent" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import BsystemMiscellaneous from './BsystemMiscellaneous.vue'
import BsystemAdjustments from './BsystemAdjustments.vue'
import BsystemTransmitter from './BsystemTransmitter.vue'
import BsystemCoils from './BsystemCoils.vue'

export default {
  data() {
    return {
      component: 'BsystemCoils',
    }
  },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  components: { BsystemMiscellaneous, BsystemAdjustments, BsystemTransmitter, BsystemCoils },
}
</script>

<style scoped>
.btn-1 {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  background: #c0c0c0 !important;
  border-radius: 0px !important;
}

.v-btn {
  background: #808080 !important;
  border-color: #808080 !important;
  height: 21px !important;
  min-width: 46px !important;
  color: white !important;
  border-radius: 0px !important;
  font-size: 10px !important;
  text-transform: capitalize !important;
}
.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: #c0c0c0 !important;
}
</style>
