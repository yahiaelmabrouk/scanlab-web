<template>
  <div class="dropdown">
    <select v-model="selectedValue" class="custom-select">
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        disabled
        :class="{ 'disabled-option': option.disabled }"
      >
        {{ option.text }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedValue: 'disabledOption', // Initial selected value
      options: [
        { value: 'disabledOption', text: 'Disabled Option', disabled: true }, // Disabled option
        { value: 'option1', text: 'Option 1' },
        { value: 'option2', text: 'Option 2' },
        { value: 'option3', text: 'Option 3' },
      ],
    }
  },
}
</script>

<style scoped>
.dropdown {
  width: 200px;
}

.custom-select {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
}

.disabled-option {
  background-color: lightgray;
  color: #888;
}
</style>
