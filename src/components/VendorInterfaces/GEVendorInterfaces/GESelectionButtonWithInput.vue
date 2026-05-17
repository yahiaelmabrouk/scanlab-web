<template>
  <div class="editable-main">
    <div class="editable-select">
      <v-text-field
        number
        type="number"
        :value="value"
        @input="onInput"
        @blur="onBlur"
        @keydown.down.prevent="openDropdown"
        @keydown.enter="(evt) => valueChange(evt.target.value)"
        class="editable-input"
        style="border: none; padding-right: 4px; margin-top: 0px"
      />
      <v-icon v-if="hasSelectionButton" @click="toggleDropdown">mdi-menu-down</v-icon>
      <ul v-if="showDropdown" class="dropdown-list">
        <li v-for="(item, index) in options" :key="index" @mousedown.prevent="selectItem(item)" class="dropdown-item">
          {{ item }}
        </li>
      </ul>
    </div>
    <div v-if="hasIncreaseButton" class="spin-btn">
      <v-icon @click="updateValue(step)">mdi-menu-up</v-icon>
      <v-icon @click="updateValue(-step)">mdi-menu-down</v-icon>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  name: 'GESelectionButtonWithInput',

  props: {
    value: {
      type: Number,
      required: true,
    },
    options: {
      type: Array,
      required: false,
    },
    step: {
      type: Number,
      required: false,
    },
    min: {
      type: Number,
      required: false,
    },
    max: {
      type: Number,
      required: false,
    },
    hasIncreaseButton: {
      type: Boolean,
      required: false,
      default: false,
    },
    hasSelectionButton: {
      type: Boolean,
      required: false,
      default: true,
    },
  },

  data() {
    return {
      showDropdown: false,
    }
  },

  mounted() {
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside)
  },

  methods: {
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.showDropdown = false
      }
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown
    },
    openDropdown() {
      this.showDropdown = true
    },
    selectItem(item) {
      this.value = item
      this.$emit('input', item)
      this.showDropdown = false
    },
    onInput() {
      this.$emit('input', this.value)
    },
    onBlur(evt) {
      const rawValue = evt?.target?.value
      const numericValue = Number(rawValue)
      if (Number.isFinite(numericValue) && Number.isFinite(this.step)) {
        this.valueChange(rawValue)
      }
      // Small delay to allow selection before hiding
      setTimeout(() => {
        this.showDropdown = false
      }, 200)
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
      const newValue = Number(this.value) + Number(delta)
      this.valueChange(newValue)
    },
  },
}
</script>

<style scoped>
.editable-main {
  display: flex;
  align-items: center;
}

.spin-btn {
  display: flex;
  flex-direction: column;

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
}

.editable-select {
  position: relative;
  display: flex;
  border-radius: 5px;
  background-color: #cacbec;
  height: 25px;
  margin-right: 3px;
}

.editable-input {
  width: 100%;
  height: 25px;
  box-sizing: border-box;
}

.editable-input:focus {
  outline: none;
}

.dropdown-icon {
  position: absolute;
  top: 2px;
  right: 6px;
  cursor: pointer;
  font-size: 12px;
}

.dropdown-list {
  position: absolute;
  top: 25px;
  width: 100%;
  background: #cacbec;
  border: 2px solid #535561;
  border-radius: 5px;
  max-height: 174px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 6px 10px;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f0f0f0;
}

::v-deep .editable-input .v-text-field__slot {
  margin-left: 8px;
  height: 24px !important;
}

::v-deep .v-input__slot:before {
  border: none !important;
}

::v-deep .v-input__slot:after {
  border: none !important;
}
</style>
