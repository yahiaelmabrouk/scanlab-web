<template>
  <div class="spin-btn-grp">
    <v-text-field
      :size="size"
      :value="value"
      type="number"
      min="0"
      class="text-left"
      number
      hide-details
      @keydown.up.prevent="increaseValue"
      @keydown.down.prevent="decreaseValue"
      @keyup="(evt) => valueChange(evt.target.value)"
      style="border: none; padding-right: 4px; margin-top: 0px"
    />
    <div class="spin-btn">
      <v-icon @click="updateValue(step)">mdi-menu-up</v-icon>
      <v-icon @click="updateValue(-step)">mdi-menu-down</v-icon>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
export default {
  name: 'GESpinButtonWithInput',

  props: {
    size: {
      type: String,
      required: false,
      default: 'md',
      validator: function (value) {
        return ['sm', 'md', 'lg'].includes(value)
      },
    },

    value: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
    step: {
      type: Number,
      required: true,
    },
  },
  computed: {
    ...mapState('selectionConfig', ['isAddLocalizerMode']),
    vendorStylePreference: {
      get() {
        return this.$store.getters['user/vendorStylePreference']
      },
    },
  },
  methods: {
    increaseValue() {
      const newValue = this.value + this.step
      this.valueChange(newValue)
    },
    decreaseValue() {
      const newValue = this.value - this.step
      this.valueChange(newValue)
    },
    valueChange(newValue) {
      if (newValue <= this.min) {
        this.$emit('input', this.min)
      } else if (newValue >= this.max) {
        this.$emit('input', this.max)
      } else {
        this.$emit('input', _.round(_.round(newValue / this.step) * this.step, 2))
      }
    },
    updateValue(delta) {
      const newValue = this.value + delta
      this.valueChange(newValue)
    },
  },
}
</script>

<style scoped>
.spin-btn {
  display: flex;
  flex-direction: column;
}
.spin-btn-grp {
  display: flex;
}
::v-deep .v-input__slot:before {
  border: none !important;
}
::v-deep .v-input__slot:after {
  border: none !important;
}
.v-icon.v-icon {
  color: black !important;
  background-color: #cacbec;
  font-size: 17px !important;
  height: 13px;

  /* Add border */
  border: 1px solid gray; /* Change color & thickness as needed */

  /* Rounded corners only on top-right & bottom-right */
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-top-right-radius: 3px; /* Adjust radius as needed */
  border-bottom-right-radius: 3px; /* Adjust radius as needed */
}
[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}
.v-text-field {
  font-weight: lighter;
  padding-top: 0px;
  display: flex;
  align-items: center;
  color: black !important;
}
</style>
