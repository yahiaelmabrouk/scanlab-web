<template>
  <!-- This binds to :value instead of v-model because toolSelected is read-only -->
  <v-btn-toggle class="ml-2 slice-btn-group" tile group :value="toolSelected">
    <!-- eslint-disable vue-i18n/no-v-html -->
    <v-btn
      v-for="tool in tools"
      :key="tool.value"
      :value="tool.value"
      @click="selectTool({ tool: tool.value })"
      @shortkey="selectTool({ tool: tool.value })"
      v-shortkey.once="tool.hotkey"
      :disabled="tool.disabled"
      v-html="generateToolName(tool)"
    >
    </v-btn>
  </v-btn-toggle>
</template>

<style scoped lang="scss">
.v-btn {
  text-transform: none;
  letter-spacing: 0;
}

.v-btn-toggle:not(.v-btn-toggle--dense) .v-btn.v-btn.v-size--default {
  margin: 0;
  height: 36px;
  border: none;
  color: $black;
  border-right: 1px solid $gray-four;
}

.v-btn:hover,
.v-btn.v-btn--active.v-item--active {
  color: $blue !important;
}

.slice-btn-group {
  box-shadow: 1px 1px 5px $gray-two;
  background-color: $white;
}
</style>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'SliceViewToolbar',
  components: {},
  props: {
    disabledTools: {
      type: Array,
      default: function () {
        return []
      },
    },
  },
  data() {
    return {}
  },
  computed: {
    ...mapState('selectionConfig', ['toolSelected', 'showOutline', 'isAddLocalizerMode']),
    tools: function () {
      let tools = [
        { i18nKey: 'tools.pan', value: 'pan', hotkey: ['p'] },
        { i18nKey: 'tools.move', value: 'move', hotkey: ['m'] },
        { i18nKey: 'tools.resize', value: 'resize', hotkey: ['s'] },
        { i18nKey: 'tools.rotate', value: 'rotate', disabled: false, hotkey: ['r'] },
        { i18nKey: 'tools.zoom', value: 'zoom', hotkey: ['z'] },
        { i18nKey: 'tools.windowing', value: 'windowing', hotkey: ['w'] },
        { i18nKey: 'tools.oversampling', value: 'oversampling', hotkey: ['p'] },
      ]

      return tools.filter((t) => !this.disabledTools.includes(t.value))
    },
  },
  methods: {
    ...mapActions('selectionConfig', ['selectTool']),
    generateToolName({ i18nKey, hotkey }) {
      const toolName = this.$t(i18nKey) || ''
      const lowercaseName = toolName.trim().toLowerCase().split('')

      return lowercaseName.reduce((newToolName, letter, index, allLetters) => {
        // Is the letter uppercased in the original word?
        const isUppercase = toolName[index] === letter.toUpperCase()
        const formattedLetter = isUppercase || index === 0 ? letter.toUpperCase() : letter
        // Create the HTML.
        const generatedHtml = `<span class="short-key">${formattedLetter}</span>`
        // If this is the first occurance of this letter in the sequence...
        if (allLetters.indexOf(hotkey[0]) === index) return newToolName + generatedHtml
        // Else...
        return newToolName + formattedLetter
      }, '')
    },
  },
}
</script>
