<template>
  <div class="w-100">
    <div v-if="!content && isInitPath">
      {{ $t('Translate.shared.choose_a_language_to_get_started_translating', languageCode) }}
    </div>
    <div v-else>
      <div
        class="tree-node"
        :class="{ selected: isSelectedNode }"
        @click="toggle"
        v-if="isStringValid || isObjectHasAnyLeafMatch"
      >
        <img src="../assets/svg/forward-button.svg" :class="{ open: isExpandTree }" alt="" v-if="isObject(content)" />
        <span :class="{ 'ml-6': !isObject(content) }" v-if="isObject(content)">{{
          objectKey ? objectKey : `Key map`
        }}</span>
        <span :class="{ 'ml-6': !isObject(content) }" v-else-if="isStringValid">
          <TextHighlight :queries="queries">{{ content ? `${content}` : `Empty` }}</TextHighlight>
        </span>
        <div class="btn-tree-node-action-container">
          <v-btn
            v-if="isObject(content)"
            class="btn-tree-node-action"
            color="primary"
            @click.prevent="addTranslation($event, path)"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <v-btn class="btn-tree-node-action" color="error" @click.prevent="deleteContent($event, path)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>
      <template v-if="isObject(content)">
        <div v-for="[key, value] in Object.entries(content)" :key="key">
          <div class="tree-child-container">
            <div class="ml-2 w-100" v-if="isExpandTree">
              <LanguageTreeNode
                :content="value"
                :object-key="key"
                :init-path="path"
                :selected-path="selectedPath"
                :search="search"
                @change-content="changeContent($event)"
                @delete-content="deleteContent(null, $event)"
                @add-translation="addTranslation(null, $event)"
              ></LanguageTreeNode>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import _ from 'lodash'

export default {
  name: 'LanguageTreeNode',
  props: {
    content: {
      type: [Object, String],
      required: false,
      default: () => ({}),
    },
    objectKey: {
      type: String,
      required: false,
      default: null,
    },
    initPath: {
      type: Array,
      required: false,
      default: null,
    },
    selectedPath: {
      type: Array,
      required: false,
      default: null,
    },
    search: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    return {
      open: false,
    }
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    isStringValid() {
      return (
        !this.isObject(this.content) &&
        (!this.search || !_.some(this.queries, (query) => this.content && !this.content.toLowerCase().includes(query)))
      )
    },
    isObjectHasAnyLeafMatch() {
      return this.checkIsObjectHasAnyLeafMatch(this.content)
    },
    queries() {
      return !this.search ? [] : this.search.toLowerCase().split(' ')
    },
    isExpandTree() {
      return this.isObject(this.content) && (this.open || this.search)
    },
    path() {
      if (!this.objectKey) {
        return [...this.initPath]
      }
      return [...this.initPath, this.objectKey]
    },
    isSelectedNode() {
      return this.selectedPath && this.path.join('.') === this.selectedPath.join('.')
    },
    isInitPath() {
      return this.path.join('.') === [].join('.')
    },
  },
  methods: {
    checkIsObjectHasAnyLeafMatch(content) {
      return (
        this.isObject(content) &&
        Object.entries(content).some(([, value]) => {
          if (this.isObject(value)) {
            return this.checkIsObjectHasAnyLeafMatch(value)
          }
          return !this.search || !_.some(this.queries, (query) => value && !value.toLowerCase().includes(query))
        })
      )
    },
    isObject(val) {
      return val && typeof val === 'object'
    },
    toggle() {
      if (this.isObject(this.content)) {
        this.open = !this.open
      } else {
        this.$emit('change-content', this.path)
      }
    },
    changeContent(path) {
      this.$emit('change-content', path)
    },
    deleteContent(e, path) {
      if (e) {
        e.stopPropagation()
      }
      this.$emit('delete-content', path)
    },
    addTranslation(e, path) {
      if (e) {
        e.stopPropagation()
      }
      this.$emit('add-translation', path)
    },
  },
}
</script>

<style lang="scss" scoped>
.btn-tree-node-action-container {
  display: none;
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  top: 50%;
  z-index: 2;
  flex-direction: row;
  gap: 0.5rem;
}
.tree-child-container {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: space-between;
  width: 100%;
}
.tree-node {
  &:hover {
    .btn-tree-node-action-container {
      display: flex;
    }
  }
  position: relative;
  cursor: pointer;
  padding: 0.5rem;
  width: 100%;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &.selected {
    background-color: #f5f5f5;
  }
  img {
    transition: all 0.3s linear;
    &.open {
      transform: rotate(90deg);
    }
  }
  &:hover {
    background-color: #f5f5f5;
  }
}
</style>
