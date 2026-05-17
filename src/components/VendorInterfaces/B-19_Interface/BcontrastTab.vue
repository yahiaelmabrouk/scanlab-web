<template>
  <div>
    <v-card width="100%" height="100%">
      <v-btn-toggle class="btn-1">
        <v-btn
          :class="{ 'v-btn--active v-item--active': component === 'BcontrastCommon' }"
          @click="component = 'BcontrastCommon'"
          >Common</v-btn
        >
        <v-btn @click="component = 'BcontrastDynamic'">Dynamic</v-btn>
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
import BcontrastCommon from './BcontrastCommon.vue'
import BcontrastDynamic from './BcontrastDynamic.vue'
export default {
  name: 'BcontrastTab',
  data() {
    return {
      component: 'BcontrastCommon',
    }
  },
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
  },

  components: { BcontrastCommon, BcontrastDynamic },
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
  border-color: #c0c0c0 !important;
  height: 21px !important;
  color: white !important;
  min-width: 46px !important;
  border-radius: 0px !important;
  font-size: 10px !important;
  text-transform: capitalize !important;
}
.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: #c0c0c0 !important;
}
</style>
