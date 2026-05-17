<template>
  <span>
    <!-- By default this will just print the text of the translation. But you can provide a slot to do something else with the translation when using this component -->
    <slot :translation="text">
      {{ text }}
    </slot>
  </span>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import _ from 'lodash'

export default {
  name: 'TranslatedContent',
  components: {},
  props: {
    /**
     * The translated content resource type used in the key to send to the API
     */
    type: {
      type: String,
      required: true,
    },
    /**
     * A record retrieved from the API that has an ID
     */
    record: {
      type: Object,
      required: true,
    },
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
  },
  mounted() {
    this.translate()
  },
  computed: {
    ...mapState('translatedContent', ['translatedContent']),
    ...mapGetters('user', ['languageCode']),
    translationKey() {
      return `${this.type}|${this.record.id}|${this.languageCode}`
    },
    text() {
      let key = this.translationKey
      let content = this.translatedContent[key]

      if (this.lookup.type === 'nestedKey') {
        return _.get(content, this.lookup.path)
      } else if (this.lookup.type === 'objectInArray') {
        let array = _.get(content, this.lookup.arrayPath)
        let object = _.find(array, [this.lookup.identityKey, this.lookup.identityValue])
        const textResult = _.get(object, this.lookup.objectKey)
        return (_.isNil(textResult) || _.isEmpty(textResult)) && _.has(this.lookup, ['defaultText'])
          ? _.get(this.lookup, ['defaultText'])
          : textResult
      } else {
        throw new Error(`Unknown lookup type: ${this.lookup.type}`)
      }
    },
  },
  watch: {
    translationKey() {
      this.translate()
    },
  },
  methods: {
    ...mapActions('translatedContent', ['translateThisRecord']),
    translate() {
      this.translateThisRecord({
        type: this.type,
        record: this.record,
        lang: this.languageCode,
      })
    },
  },
}
</script>

<style lang="scss"></style>
