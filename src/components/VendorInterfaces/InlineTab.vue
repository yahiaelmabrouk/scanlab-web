<template>
  <div class="custom-container col-md-9">
    <v-card width="17%">
      <div class="btn-1">
        <v-btn
          :class="{ 'v-btn--active v-item--active': component === 'SysteminSpace' }"
          @click="component = 'SysteminSpace'"
          >SysteminSpace</v-btn
        >
        <v-btn @click="component = 'Cardiac'">Cardiac</v-btn>
        <v-btn @click="component = 'MIP'">MIP</v-btn>
        <v-btn @click="component = 'Composing'">Composing</v-btn>
      </div>
      <v-card-text>
        <div>
          <component :is="component" :selection-ident="selectionIdent" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import InlineCommon from './InlineCommon.vue'
import SysteminSpace from './SysteminSpace.vue'
import Cardiac from './Cardiac.vue'
import MIP from './MIP.vue'
import Composing from './Composing.vue'
import { SelectionConfigMixin } from '../Mixins/SelectionConfigMixin'
import { MriMixin } from '../Mixins/MriMixin.js'
import _ from 'lodash'
export default {
  mixins: [MriMixin, SelectionConfigMixin],
  components: { SysteminSpace, Cardiac, MIP, Composing },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      component: 'SysteminSpace',
    }
  },
}
</script>
<style scoped>
.btn-1 {
  display: flex;
  width: 100%;
  background: black !important;
}

.v-card {
  background: black !important;
}

.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: rgb(136, 136, 136) !important;
}

.v-btn-toggle {
  width: 100%;
}

.v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  border: 1px solid #5a5252 !important;
  border-radius: 0px;
  border-top: none !important;
  width: 12.5%;
}

::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
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

/* Responsive Styles */

/* Mobile Devices (Portrait and Landscape) */
@media (max-width: 767px) {
  .v-btn {
    font-size: 7px !important;
    height: 20px !important;
  }

  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    width: 25% !important;
  }
}

/* Tablets and Small Desktops */
@media (min-width: 768px) and (max-width: 1024px) {
  .v-btn {
    font-size: 8px !important;
    height: 22px !important;
  }

  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    width: 15% !important;
  }
}

/* Large Desktops and Bigger Screens */
@media (min-width: 1025px) {
  .v-btn {
    font-size: 8px !important;
    height: 23px !important;
  }

  .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
    width: 12.5% !important;
  }
}
</style>
