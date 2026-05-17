<template>
  <div class="sp-btn-updown">
    <div class="text-2">
      <v-text-field
        :size="size"
        :value="value"
        :type="type"
        min="0"
        class="text-left"
        hide-details
        @keydown.up.prevent="increaseValue"
        @keydown.down.prevent="decreaseValue"
        @keyup="(evt) => valueChange(evt.target.value)"
        style="width: 14vw; max-width: 25%; margin-left: 2%"
      />
      <v-btn class="btn-2" v-if="!typeofcomponent"><v-icon>mdi-menu-down</v-icon></v-btn>
    </div>

    <div class="text-2">
      <v-icon class="btn-2" @click="valueChange(value + step)">mdi-plus</v-icon>
      <v-icon class="btn-2" @click="valueChange(value - step)">mdi-minus</v-icon>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
export default {
  name: 'DropDownText',

  props: {
    size: {
      type: String,
      required: false,
      default: 'md',
      validator: function (value) {
        return ['sm', 'md', 'lg'].includes(value)
      },
    },
    typeofcomponent: {
      type: String,
      required: false,
    },
    value: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: false,
      default: 'text',
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
        this.$emit('input', _.round(newValue / this.step) * this.step)
      }
    },
  },
}
</script>

<style scoped>
.sp-btn {
  /* display: flex;
    flex-direction: column;
    padding-left: 5px; */
  display: flex;
  flex-direction: column;
  margin-top: 0rem;
}

.sp-btn-grp {
  display: flex;
}

.sp-btn-updown {
  display: flex;
  background: white;
  height: 19px;
  width: 28%;
  margin-left: 8px;
}

[disabled] {
  cursor: none !important;
  pointer-events: none;
  opacity: 0.5;
}

.spin-btn {
  display: flex;
  flex-direction: column;
  margin-top: 0rem;
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
  font-size: 15px !important;
}

.v-text-field {
  border: none !important;
  font-weight: lighter;
  padding-top: 0px;
  display: flex;
  align-items: center;
  width: 35%;
}

.v-btn {
  height: 8px !important;
  min-width: 22px !important;
  padding: 0px 10px !important;
  width: 22px !important;
  background: #c0c0c0 !important;
  border-radius: 0px !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
  border-width: thin !important;
}
.btn-2 {
  width: 20px !important;
  height: 18px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #c0c0c0 !important;
  border-radius: 0px;
  color: black !important;
  border-bottom: 1px solid black !important;
  border-right: 1px solid black !important;
  border-top: 2px solid white !important;
  border-left: 2px solid white !important;
}
.text-2 {
  display: flex;
}
</style>
