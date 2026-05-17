<template>
  <div class="spin-btn-grp">
    <div class="spin-btn">
      <v-btn :disabled="disabled" @click="increaseValue"><v-icon>mdi-menu-up</v-icon></v-btn>
      <v-btn :disabled="disabled" @click="decreaseValue"><v-icon>mdi-menu-down</v-icon></v-btn>
    </div>
    <v-text-field
      :key="componentKey"
      :size="size"
      :value="value"
      :min="min"
      :max="max"
      class="text-left"
      hide-details
      @keydown="onPreventInput($event)"
      @keydown.up.prevent="increaseValue"
      @keydown.down.prevent="decreaseValue"
      @keyup.enter="(evt) => valueChange(evt.target.value)"
      @blur="onBlur($event)"
      @focus="onFocus($event)"
      style="border: none; padding-right: 4px"
      :disabled="disabled"
    />

    <!-- </b-input-group> -->
  </div>
</template>

<script>
import _ from 'lodash'
export default {
  name: 'PitchSpinButtonWithInput',
  data() {
    return { componentKey: 0, acceptValues: [0.3, 0.5, 0.8, 1.0, 1.3, 1.5, 1.8] }
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
  methods: {
    increaseValue() {
      const nextValues = this.acceptValues.filter((v) => v > this.$props.value)
      console.log('nextValues', nextValues, this.$props.value)
      if (nextValues.length > 0) {
        const newValue = nextValues[0]
        this.valueChange(newValue)
      }
    },
    decreaseValue() {
      const prevValues = this.acceptValues.filter((v) => v < this.$props.value)
      if (prevValues.length > 0) {
        const newValue = prevValues[prevValues.length - 1]
        this.valueChange(newValue)
      }
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
  margin-top: 0.1rem;
}
.spin-btn-grp {
  display: flex;
  flex: 1;
}

::v-deep .v-input__slot:before {
  border: none !important;
}
::v-deep .v-input__slot:after {
  border: none !important;
}
.v-icon {
  color: white !important;
  font-size: 20px;
}
.v-text-field {
  font-weight: lighter;
  padding-top: 0px;
  display: flex;
  align-items: center;
}
.v-btn {
  height: 16px !important;
  min-width: 22px !important;
  padding: 0px 12px !important;
  width: 22px !important;
  margin-right: 0.5rem;
  background: #918888 !important;
  border-radius: 3px 0px 0px 3px;
  border-bottom: 0px !important;
  border: 1px solid #ced4da !important;
  border-width: thin !important;
}
</style>
