<template>
  <div class="spin-btn-grp">
    <v-text-field
      :size="size"
      v-model="internalValue"
      :min="min"
      :max="max"
      type="number"
      class="text-right"
      number
      hide-details
      @keydown="onPreventInput($event)"
      @keydown.up.prevent="increaseValue"
      @keydown.down.prevent="decreaseValue"
      @keyup.enter="(evt) => valueChange(evt.target.value)"
      @blur="onBlur($event)"
      @focus="onFocus($event)"
      style="border: none; padding-right: 4px; margin-top: 0px; margin-bottom: 5px"
    />
    <div class="spin-btn pt-2">
      <v-icon @click="valueChange(value + step)">mdi-menu-up</v-icon>
      <v-icon @click="valueChange(value - step)">mdi-menu-down</v-icon>
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
    return {
      internalValue: this.value, // Sync initial value
    }
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
      const newValue = this.value + this.step
      this.valueChange(newValue)
    },
    decreaseValue() {
      const newValue = this.value - this.step
      this.valueChange(newValue)
    },
    onFocus(e) {
      this.$emit('focus', e)
    },
    onBlur(e) {
      this.valueChange(e.target.value)
      this.$emit('blur', e)
    },
    // valueChange(newValue) {
    //   if (newValue <= this.min) {
    //     this.$emit('input', this.min)
    //   } else if (newValue >= this.max) {
    //     this.$emit('input', this.max)
    //   } else {
    //     this.$emit('input', _.round(newValue / this.step) * this.step)
    //   }
    // },
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
  watch: {
    value(newValue) {
      this.internalValue = newValue
    },
    internalValue(newValue) {
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

::v-deep .v-input__slot .v-text-field__slot input {
  text-align: end;
}

::v-deep .v-input__slot:after {
  border: none !important;
}
::v-deep .v-icon.v-icon {
  color: black !important;
  font-size: 22px !important;
  height: 0px;
  /* margin-bottom: 10px !important;
  margin-left: 0px !important; */
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
  color: white !important;
}
</style>
