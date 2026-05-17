<template>
  <div>
    <v-btn outlined color="purple darken-3" @click="openDialog">
      {{ $t('global.edit_translation', languageCode) }}
    </v-btn>
    <v-dialog persistent v-model="showDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">
          {{ $t('global.edit_translation') }}
        </v-card-title>
        <v-card-text>
          <v-textarea outlined hide-details v-model="newTranslation" :label="$t('global.translation')" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn outlined @click="closeDialog">{{ $t('global.cancel') }}</v-btn>
          <v-btn color="success" @click="saveTranslatedContent">{{ $t('global.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import _ from 'lodash'
import { apiPatch } from '../util/api'

export default {
  name: 'EditTranslation',
  props: {
    /**
     * Examples:
     *  {
     *    type: "nestedKey",
     *    path: "big.nested.path"
     *  }
     *  {
     *    type: "objectInArray",
     *    arrayPath: "nested.array",
     *    identityKey: "id",
     *    identityValue: "123",
     *    objectKey: "text"
     *  }
     */
    lookup: {
      type: Object,
      required: true,
    },
    translatedContent: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showDialog: false,
      newTranslation: null,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapGetters('user', ['languageCode']),
    translation() {
      let content = this.translatedContent.content

      if (this.lookup.type === 'nestedKey') {
        return _.get(content, this.lookup.path)
      } else if (this.lookup.type === 'objectInArray') {
        let array = _.get(content, this.lookup.arrayPath)
        let object = _.find(array, [this.lookup.identityKey, this.lookup.identityValue])
        return _.get(object, this.lookup.objectKey)
      } else {
        throw new Error(`Unknown lookup type: ${this.lookup.type}`)
      }
    },
  },
  methods: {
    openDialog() {
      this.newTranslation = this.translation
      this.showDialog = true
    },
    closeDialog() {
      this.newTranslation = null
      this.showDialog = false
      this.$forceUpdate()
    },
    async saveTranslatedContent() {
      let newTranslation = this.newTranslation || this.translation
      let content = this.translatedContent.content

      if (this.lookup.type === 'nestedKey') {
        _.set(content, this.lookup.path, newTranslation)
      } else if (this.lookup.type === 'objectInArray') {
        let array = _.get(content, this.lookup.arrayPath)
        let object = _.find(array, [this.lookup.identityKey, this.lookup.identityValue])
        if (!object) {
          // Push a new object if it doesn't exist
          object = {
            [this.lookup.identityKey]: this.lookup.identityValue,
            [this.lookup.objectKey]: newTranslation,
          }
          array.push(object)
        } else {
          _.set(object, this.lookup.objectKey, newTranslation)
        }
      } else {
        throw new Error(`Unknown lookup type: ${this.lookup.type}`)
      }

      try {
        let response = await apiPatch(`translatedContent/${this.translatedContent.key}`, { content }, this.accessToken)

        if (response.data && response.data.success) {
          this.$notify({ text: 'Saved translation' })
          this.closeDialog()
        } else {
          this.$notify({ text: 'Error saving translation', type: 'error' })
        }
      } catch {
        this.$notify({ text: 'Error saving translation', type: 'error' })
      }
    },
  },
}
</script>
