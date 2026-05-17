<template>
  <v-col cols="12" class="p-0">
    <div class="d-flex justify-center align-center">
      <v-subheader v-if="!singleCheckbox" class="bg-blue flex-grow-1" :class="[childEmphasis ? 'emphasis' : '']">{{
        label
      }}</v-subheader>
      <v-radio-group v-if="editor" row dense v-model="checkedForRadio" class="d-flex justify-center align-center">
        <v-radio key="Yes" label="Yes" :value="'true'"></v-radio>
        <v-radio key="No" label="No" :value="'false'"></v-radio>
        <v-radio key="Null" label="U.A." :value="'null'"></v-radio>
      </v-radio-group>
      <div v-else class="d-flex flex-row align-center justify-center">
        <v-checkbox :disabled="true" v-model="checked"></v-checkbox>
        <v-checkbox :disabled="true" v-model="unchecked" v-if="!singleCheckbox"></v-checkbox>
      </div>
      <v-subheader v-if="singleCheckbox" class="bg-blue flex-grow-1">{{ label }}</v-subheader>
    </div>
  </v-col>
</template>

<script>
export default {
  name: 'YesOrNo',
  props: {
    value: {
      default: null,
      required: false,
      type: [Boolean, null],
    },
    label: {
      type: String,
      required: true,
    },
    singleCheckbox: {
      type: Boolean,
      default: false,
    },
    editor: {
      type: Boolean,
      default: false,
    },
    childEmphasis: {
      type: Boolean,
      default: false,
    },
    field: {
      type: String,
      default: '',
    },
  },
  computed: {
    checked: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('update-field', this.field, val)
      },
    },
    unchecked() {
      return this.value === false
    },
    // Vuetify Radio boxes don't support null for some reason, so we have to map true/false/null -> 'true'/'false'/'null' for its use only
    checkedForRadio: {
      get() {
        return this.checked + ''
      },
      set(val) {
        if (val === 'true') {
          this.checked = true
        } else if (val === 'false') {
          this.checked = false
        } else {
          this.checked = null
        }
      },
    },
  },
}
</script>

<style scoped lang="scss">
.bg-blue {
  background-color: $gray;
  margin-right: $base-font-size;
  border-radius: $base-font-size;
}
.emphasis {
  font-weight: 900;
  margin-left: 2rem;
}
</style>
