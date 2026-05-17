<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div>
    <v-card width="100%" height="100%">
      <v-btn-toggle class="btn-1">
        <v-btn @click="component = 'SequencePartone'">Part 1</v-btn>
        <v-btn @click="component = 'SequenceParttwo'">Part 2</v-btn>
        <v-btn @click="component = 'SequenceAssistant'">Assistant</v-btn>
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
import SequencePartone from './PhSequencePartone.vue'
import SequenceParttwo from './PhSequenceParttwo.vue'
import SequenceAssistant from './PhSequenceAssistant.vue'

export default {
  data() {
    return {
      component: 'SequencePartone',
    }
  },
  components: { SequencePartone, SequenceParttwo, SequenceAssistant },
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
