<template>
  <div>
    <v-card width="100%" height="100%">
      <v-btn-toggle class="btn-1">
        <v-btn
          :class="{ 'v-btn--active v-item--active': component === 'ResolutionCommon' }"
          @click="component = 'ResolutionCommon'"
          >Common</v-btn
        >
        <v-btn @click="component = 'ResolutionAcceleration'">Acceleration</v-btn>
        <v-btn @click="component = 'ResolutionFilter'">Filter</v-btn>
      </v-btn-toggle>
      <v-card-text>
        <div>
          <component :is="component" :selection-ident="selectionIdent" :sequence-type="sequenceType" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import ResolutionCommon from './ResolutionCommon.vue'
import ResolutionAcceleration from './ResolutionAcceleration.vue'
import ResolutionFilter from './ResolutionFilter.vue'

export default {
  data() {
    return {
      component: 'ResolutionCommon',
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
  },
  components: { ResolutionCommon, ResolutionAcceleration, ResolutionFilter },
}
</script>

<style scoped>
.btn-1 {
  display: flex;
  width: 100%;
  background: black;
}

::v-deep .v-card__text {
  padding: 0px;
  width: 100%;
}

.v-btn-toggle {
  width: 100%;
  background: black;
}

.v-card {
  background: black;
}

.v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  border: 1px solid #5a5252 !important;
  background: black;
  border-radius: 0px;
  border-top: none !important;
  width: 12.5%;
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

.theme--light.v-btn-toggle:not(.v-btn-toggle--group) {
  background: black;
}

.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: rgb(136, 136, 136) !important;
}

.v-btn:not(.v-btn--round).v-size--default {
  min-width: 0px !important;
}

/* Responsive Styles */

/* Mobile Devices (Portrait and Landscape) */
@media (max-width: 767px) {
  .v-btn {
    font-size: 10px !important;
    height: 30px !important;
  }
  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    width: 25%; /* Adjust button width for smaller screens */
  }
}

/* Tablets and Small Desktops */
@media (min-width: 768px) and (max-width: 1024px) {
  .v-btn {
    font-size: 10px !important;
    height: 25px !important;
  }
  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    width: 20%; /* Adjust button width for medium screens */
  }
}

/* Large Desktops and Bigger Screens */
@media (min-width: 1025px) {
  .v-btn {
    font-size: 8px !important;
    height: 23px !important;
  }
  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    width: 12.5%; /* Default button width for large screens */
  }
}
</style>
