<template>
  <div>
    <v-card width="100%" height="100%">
      <v-btn-toggle class="btn-1">
        <v-btn
          :class="{ 'v-btn--active v-item--active': component === 'SequencePartone' }"
          @click="component = 'SequencePartone'"
          >Part 1</v-btn
        >
        <v-btn @click="component = 'SequenceParttwo'">Part 2</v-btn>
        <v-btn @click="component = 'SequenceAssistant'">Assistant</v-btn>
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
import SequencePartone from './SequencePartone.vue'
import SequenceParttwo from './SequenceParttwo.vue'
import SequenceAssistant from './SequenceAssistant.vue'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin'
import { MriMixin } from '../Mixins/MriMixin.js'
export default {
  name: 'SequenceTab',
  components: { SequencePartone, SequenceParttwo, SequenceAssistant },
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
  data() {
    return {
      component: 'SequencePartone',
    }
  },
}
</script>
<style scoped>
.btn-1 {
  display: flex;
  width: 100%;
  background: black;
}
.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
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
::v-deep .v-card__text {
  padding: 0px;
  width: 100%;
}
.v-btn:not(.v-btn--round).v-size--default {
  min-width: 0px !important;
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
