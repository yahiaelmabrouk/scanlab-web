<template>
  <div class="custom-checkbox" :class="{ checked: isChecked, disabled }" @click="handleClick">
    <div class="box">
      <span v-if="isChecked" class="checkmark">✔</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: Boolean,
    disabled: Boolean,
  },
  data() {
    return {
      isChecked: this.value,
    }
  },
  methods: {
    handleClick() {
      if (!this.disabled) {
        this.toggleCheckbox()
      }
    },
    toggleCheckbox() {
      this.isChecked = !this.isChecked
      this.$emit('input', this.isChecked)
    },
  },
  watch: {
    value(newValue) {
      this.isChecked = newValue
    },
  },
}
</script>

<style scoped>
.custom-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.box {
  width: 15px;
  height: 15px;
  border: 1px solid black;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.checkmark {
  color: black;
  font-size: 16px;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.disabled .box {
  border-color: #999;
}
</style>
