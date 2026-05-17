<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="custom-container col-md-6">
    <v-card class="bottom-section">
      <v-btn-toggle>
        <div class="btn-1">
          <div :class="{ 'active-tab': component === 'InfoComponent' }">
            <v-btn @click="setComponent('InfoComponent')" :class="{ 'active-tab': component === 'InfoComponent' }"
              >Info</v-btn
            >
          </div>
          <div :class="{ 'active-tab': component === 'Assistant' }">
            <v-btn @click="setComponent('Assistant')">Assistant</v-btn>
          </div>
          <div :class="{ 'active-tab': component === 'Autoview' }">
            <v-btn @click="setComponent('Autoview')">Autoview</v-btn>
          </div>
        </div>
      </v-btn-toggle>
      <v-card-text>
        <component :is="component" :selection-ident="selectionIdent" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import InfoComponent from './PhInfoComponent.vue'
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'

export default {
  data() {
    return {
      mixin: [MriMixin, SelectionConfigMixin],
      component: 'InfoComponent',
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
  components: {
    InfoComponent,
    // AssistantComponent,
    // AutoviewComponent,
  },
  methods: {
    setComponent(tabName) {
      this.component = tabName
      console.log('Component set to:', this.component)
    },
  },
}
</script>

<style scoped>
/* General and universal input styles */
::v-deep .v-text-field--outlined fieldset,
::v-deep .v-input__slot fieldset,
::v-deep .v-text-field__slot,
::v-deep .v-input--dense > .v-input__control > .v-input__slot,
::v-deep .v-input__slot,
::v-deep .v-text-field.v-text-field--enclosed .v-text-field__details,
::v-deep .v-text-field input {
  background: #ffffff;
  border-color: #ffffff;
  border-radius: 0px;
  margin-bottom: 0px;
  padding: 0px;
  height: 1.5rem; /* Applicable only to .v-text-field__slot */
  bottom: 6px; /* Positioning for fieldsets */
  right: 10px;
  top: 10px;
}
::v-deep .v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  height: 27px !important;
}
/* Button styling across the app */
.v-btn {
  font-size: 10px !important;
  height: 1.25rem;
  background: #d5d7d7 !important;
  color: black !important;
  font-weight: bold;
  border: 1px solid #d5d7d7 !important;
  border-radius: 0px;
  border-bottom: none;
  border-top: none;
  min-width: 0px !important;
}

.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  background: #ffffff !important;
  color: #000000 !important;
}

/* Icon color customization */
::v-deep .v-icon {
  color: white;
}

/* Card and container styling */
.v-card,
.bottom-section {
  background: #f5f5f5; /* Dark grey for .v-card, overridden by specific sections */
  width: 100%;
  height: 100%;
  border-radius: 0px;
}

.bottom-section {
  background: #d5d7d7; /* Darker grey specified for bottom sections */
}

/* Scan section specifics */
.scan {
  width: 100%;
  background: black;
  border: 1px solid black;
  border-right: none;
  border-bottom: none;
  border-top: none;
  margin-top: 2.6rem;
}

/* Text and layout adjustments within card */
.v-card-text {
  padding: 0;
  background: rgb(46, 44, 44);
  position: absolute;
  top: 36px;
  bottom: 0;
  width: 25rem;
  height: 88%; /* Maintain relative position and size */
}

/* Toggle buttons and custom container adjustments */
.v-btn-toggle {
  width: 100%;
  background: #676866 !important;
}

.custom-container {
  max-width: 100%;
  padding: 0;
  height: 100%;
  width: 25rem;
}
@media screen and (max-width: 1440px) and (max-height: 900px) {
  .custom-container {
    max-width: 45.5% !important;
  }
}
.btn-1 {
  display: flex;
  width: 28%;
  justify-content: space-between;
  padding-right: 4%;
}
.theme--light.v-select .v-select__selections {
  margin: 0px 0px 25px 0px;
}
.theme--light.v-tabs-items {
  background-color: #f5f5f5;
}
</style>
