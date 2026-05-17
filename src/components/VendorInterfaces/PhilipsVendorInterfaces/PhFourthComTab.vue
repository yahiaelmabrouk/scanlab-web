<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card class="bottom-section">
    <v-btn-toggle>
      <div class="btn-1">
        <div class="">
          <v-btn>Info</v-btn>
        </div>
        <div class="">
          <v-btn>Assistant</v-btn>
        </div>
        <div class="active-tab">
          <v-btn>Autoview</v-btn>
        </div>
      </div>
    </v-btn-toggle>
    <v-card-text>
      <component :is="component" :selection-ident="selectionIdent" />
    </v-card-text>
  </v-card>
</template>

<script>
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
export default {
  data() {
    return {
      mixins: [MriMixin, SelectionConfigMixin],
      component: '',
    }
  },
  components: {},
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  methods: {
    setComponent(tabName) {
      this.component = tabName
    },
  },
}
</script>

<style scoped>
/* General styles for deep Vuetify components */
::v-deep .v-text-field--outlined fieldset,
::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535;
  bottom: 6px;
  right: 10px;
  top: 10px;
}

::v-deep .v-text-field__slot {
  background: #383535;
  border: 1px solid #383535;
  border-radius: 0px;
  height: 1.5rem;
}

/* Universal input styles */
::v-deep .v-input--dense > .v-input__control > .v-input__slot,
::v-deep .v-input__slot,
::v-deep .v-text-field.v-text-field--enclosed .v-text-field__details,
::v-deep .v-text-field input {
  margin-bottom: 0px;
  padding: 0px;
}

/* Card styling */
.v-card {
  background: #676866;
  width: 100%;
  height: 100%;
  border-radius: 0px;
}

/* Button styling across the app */
.v-btn {
  font-size: 10px !important;
  height: 1.25rem;
  background: #d5d7d7 !important;
  color: black !important;
  font-weight: bold;
  border: 1px solid #d5d7d7 !important;
  border-bottom: none;
  border-radius: 0px;
  border-top: none;
  min-width: 0px !important;
}

.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: #ffffff !important;
  color: #000000 !important;
}

/* Toggle buttons */
.v-btn-toggle {
  width: 100%;
  background: #676866 !important; /* Matching the theme */
}

/* Layout adjustments */
.custom-container.col-md-9 {
  max-width: 100%;
  padding: 0;
  height: 100%;
  width: 25rem;
}

.btn-1 {
  display: flex;
  width: 28%;
  justify-content: space-between;
  padding-right: 16px;
}

/* Icon color */
::v-deep .v-icon.v-icon {
  color: white;
}

/* Main classes for different sections */
.bottom-section {
  height: 100%;
  background: rgb(46, 44, 44);
  position: relative;
}

.v-card-text {
  padding: 0;
  background: rgb(46, 44, 44);
  position: absolute;
  top: 36px;
  bottom: 0;
  width: 25rem;
  height: 88%; /* Adjusted to maintain the relative positioning */
}
</style>
