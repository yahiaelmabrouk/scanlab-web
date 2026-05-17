<template>
  <div>
    <v-card width="100%" height="100%">
      <v-btn-toggle class="btn-1">
        <v-btn
          :class="{ 'v-btn--active v-item--active': component === 'BresolutionCommon' }"
          @click="component = 'BresolutionCommon'"
          >Common</v-btn
        >
        <v-btn @click="component = 'BresolutionIpat'">iPAT</v-btn>
        <v-btn @click="component = 'BresolutionFilter'">Filter</v-btn>
      </v-btn-toggle>
      <v-card-text>
        <div>
          <component
            :is="component"
            :selection-ident="selectionIdent"
            :sequence-type="sequenceType"
            :is-ultra-lab="isUltraLab"
            :should-pause-popup="shouldPausePopup"
            :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults"
          />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import BresolutionCommon from './BresolutionCommon.vue'
import BresolutionIpat from './BresolutionIpat.vue'
import BresolutionFilter from './BresolutionFilter.vue'
export default {
  name: 'BresolutionTab',
  components: { BresolutionCommon, BresolutionIpat, BresolutionFilter },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    sequenceType: {
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
    useInitialUltraLabDefaults: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  data() {
    return {
      component: 'BresolutionCommon',
    }
  },
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
  border-radius: 0px !important;
  font-size: 10px !important;
  color: white !important;
  text-transform: capitalize !important;
}
.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: #c0c0c0 !important;
}
</style>
