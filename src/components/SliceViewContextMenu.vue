<template>
  <div class="slice-view-context-menu" ref="contextMenu" v-show="visible" :style="{ left: x + 'px', top: y + 'px' }">
    <div class="menu-item" @click="onSelectAllSelectionConfig">
      <span>
        {{ `Sync slice groups` }}
      </span>
    </div>
    <div class="menu-item" @click="onResetSegment">
      <span>
        {{ $t('global.reset_segment') }}
      </span>
    </div>
  </div>
</template>
<script>
import { mapActions } from 'vuex'
import config from '../config'
export default {
  name: 'SliceViewContextMenu',
  props: {},
  data() {
    return {
      visible: false,
      x: 0,
      y: 0,
      isCTLab: config.isCTLab,
    }
  },
  computed: {},
  watch: {
    visible(newValue) {
      if (newValue) {
        document.addEventListener('pointerdown', this.onPointerDown)
      } else {
        document.removeEventListener('pointerdown', this.onPointerDown)
      }
    },
  },
  mounted() {},
  methods: {
    ...mapActions('selectionConfig', ['selectAllSelectionConfigs']),
    onResetSegment() {
      this.$emit('reset-segment')
      this.visible = false
    },
    onSelectAllSelectionConfig() {
      if (this.isCTLab) {
        this.visible = false
        return
      }
      this.selectAllSelectionConfigs()
      this.visible = false
    },
    onPointerDown(event) {
      if (!this.$refs.contextMenu.contains(event.target)) {
        this.visible = false
      }
    },
    show(x, y, boudingRect) {
      this.visible = true
      const contextBoundingRect = this.$refs.contextMenu.getBoundingClientRect()
      const contextWidth = contextBoundingRect.width
      const contextHeight = contextBoundingRect.height
      const contextX = x + contextWidth > boudingRect.width ? x - contextWidth : x
      const contextY = y + contextHeight > boudingRect.height ? y - contextHeight : y

      this.x = contextX
      this.y = contextY
    },
  },
}
</script>
<style lang="scss" scoped>
.slice-view-context-menu {
  position: absolute;
  z-index: 1000;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 8px;
  .menu-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    gap: 1rem;
    cursor: pointer;
    user-select: none;
    &:hover {
      background-color: #f0f0f0;
    }
    span {
      flex-grow: 1;
      white-space: nowrap;
    }
    .tick {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
