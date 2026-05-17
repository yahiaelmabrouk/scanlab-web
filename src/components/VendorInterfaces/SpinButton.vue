<template>
  <div class="spin-btn-grp">
    <v-text-field
      :key="componentKey"
      :size="size"
      :value="value"
      :min="min"
      :max="max"
      type="number"
      class="text-left"
      number
      hide-details
      @keydown="onPreventInput($event)"
      @keydown.up.prevent="increaseValue"
      @keydown.down.prevent="decreaseValue"
      @keyup.enter="(evt) => valueChange(evt.target.value)"
      @blur="onBlur($event)"
      @focus="onFocus($event)"
      style="border: none; padding-right: 4px; margin-top: 0px"
      :disabled="disabled"
    />
    <div class="spin-btn">
      <v-icon :disabled="disabled" @click="valueChange(value + step)">mdi-menu-up</v-icon>
      <v-icon :disabled="disabled" @click="valueChange(value - step)">mdi-menu-down</v-icon>
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import _ from 'lodash'
import { mapState } from 'vuex'
export default {
  name: 'SpinButtonWithInput',
  data() {
    return { componentKey: 0 }
  },
  props: {
    size: {
      type: String,
      required: false,
      default: 'md',
      validator: function (value) {
        return ['sm', 'md', 'lg'].includes(value)
      },
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    value: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      required: true,
    },
    step: {
      type: Number,
      default: 0.05,
    },
    allowDecimal: {
      type: Boolean,
      required: false,
      default: true,
    },
    allowFloatingPoint: {
      type: Boolean,
      required: false,
      default: true,
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
      const newValue = this.sum(this.$props.value, this.$props.step, 4)
      this.valueChange(newValue)
    },
    decreaseValue() {
      const newValue = this.subtract(this.$props.value, this.$props.step, 4)
      this.valueChange(newValue)
    },
    onFocus(e) {
      this.$emit('focus', e)
    },
    onBlur(e) {
      this.valueChange(e.target.value)
      this.$emit('blur', e)
    },
    valueChange(newValue) {
      const inputValue = this.allowDecimal ? Number(newValue) : Math.floor(newValue)
      let emitValue

      if (inputValue < this.$props.min || isNaN(inputValue)) {
        emitValue = this.$props.min
      } else if (inputValue > this.$props.max) {
        emitValue = this.$props.max
      } else {
        emitValue = inputValue
      }
      this.$emit('input', emitValue)

      // This forces a re-render due to a loophole with v-model
      if (Number(newValue) !== emitValue) this.forceRerender()
    },
    forceRerender() {
      this.componentKey++
    },
    sum(a, b, positions) {
      const factor = Math.pow(10, positions)
      return (a.toFixed(positions) * factor + b.toFixed(positions) * factor) / factor
    },
    subtract(a, b, positions) {
      const factor = Math.pow(10, positions)
      return (a.toFixed(positions) * factor - b.toFixed(positions) * factor) / factor
    },
    onPreventInput(e) {
      if (!this.$props.allowFloatingPoint) {
        // Prevent input . and ,
        if (e?.keyCode == 188 || e?.keyCode == 190) {
          e.preventDefault()
        }
      }
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
  width: 100%;
}
::v-deep .v-input__slot:before {
  border: none !important;
}
::v-deep .v-input__slot:after {
  border: none !important;
}
::v-deep .v-icon.v-icon {
  color: white !important;
  font-size: 17px !important;
  height: 8px;
}
[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}
::v-deep .v-text-field {
  font-weight: lighter;
  padding-top: 0px;
  display: flex;
  align-items: center;
  color: white !important;
}
</style>
