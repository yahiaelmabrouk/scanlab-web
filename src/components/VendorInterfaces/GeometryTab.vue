<template>
  <div>
    <v-card width="100%" height="100%">
      <v-btn-toggle class="btn-1">
        <v-btn
          :class="{ 'v-btn--active v-item--active': component === 'GeometryCommon' }"
          @click="component = 'GeometryCommon'"
          >Common</v-btn
        >
        <v-btn @click="component = 'GeometryAutoalign'">AutoAlign</v-btn>
        <v-btn @click="component = 'GeometryNavigator'">Navigator</v-btn>
        <v-btn @click="component = 'GeometrySaturation'">Saturation</v-btn>
        <v-btn @click="component = 'GeometryPlanning'">Tim Planning Suite</v-btn>
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
import GeometryCommon from './GeometryCommon.vue'
import GeometryAutoalign from './GeometryAutoalign.vue'
import GeometryNavigator from './GeometryNavigator.vue'
import GeometrySaturation from './GeometrySaturation.vue'
import GeometryPlanning from './GeometryPlanning.vue'
export default {
  name: 'GeometryTab',
  components: { GeometryCommon, GeometryAutoalign, GeometryNavigator, GeometrySaturation, GeometryPlanning },
  data() {
    return {
      component: 'GeometryCommon',
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
}
</script>
<style scoped>
/* dropdown background style */
.theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}
.theme--light.v-list {
  background: #565656;
  color: rgb(0 0 0 / 87%);
}

.theme--light.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: rgb(255 255 255 / 87%);
}
::v-deep .v-application .primary--text {
  color: #ffffff !important;
  caret-color: #ffffff !important;
}
::v-deep .v-list-item__title {
  color: #ffffff !important;
}
::v-deep .v-list-item--link:before {
  background-color: lightgray !important;
}
.active-list-item {
  background-color: darkgray;
}

/* dropdown background style */
.btn-1 {
  display: flex;
  width: 100%;
  background: black;
}
.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
}
::v-deep .v-card__text {
  padding: 0px;
  width: 100%;
}
::v-deep .v-btn:not(.v-btn--round).v-size--default {
  min-width: 0px !important;
  padding: 0 12px;
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
.v-btn-toggle {
  width: 100%;
  background: black;
}
.v-card {
  background: black;
}
.theme--light.v-btn-toggle:not(.v-btn-toggle--group) {
  background: black;
}
.v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  border: 1px solid #5a5252 !important;
  background: black;
  border-radius: 0px;
  border-top: none !important;

  width: 18%;
}
.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: rgb(136, 136, 136) !important;
}
</style>
