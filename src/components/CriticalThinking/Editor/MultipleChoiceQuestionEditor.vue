<template>
  <v-container>
    <draggable handle=".drag-handle" v-model="internalChoices">
      <div v-for="(option, i) in internalChoices" :key="option.id">
        <v-textarea
          :rules="requiredRule"
          solo
          v-model="option.text"
          @input="updateChoices"
          :label="$t('global.option') + `${i + 1}`"
        >
          <template slot="append-outer">
            <div>
              <v-checkbox v-model="option.isCorrect" @change="onAfterIsCorrectModified(option)" />
            </div>
          </template>
          <template slot="prepend">
            <div class="text-center d-flex flex-column">
              <h3>{{ i + 1 }}</h3>
              <v-icon large class="drag-handle">drag_indicator</v-icon>
              <v-icon @click="removeOption(internalChoices, i)" color="red">mdi-delete</v-icon>
            </div>
          </template>
        </v-textarea>
      </div>
    </draggable>

    <v-btn @click="addOption(internalChoices)" block color="primary">
      <v-icon color="white">mdi-plus</v-icon>
      {{ $t('global.option') }}
    </v-btn>
  </v-container>
</template>

<script>
import draggable from 'vuedraggable'
import uuidv4 from 'uuid/v4'
import _ from 'lodash'

export default {
  name: 'TimingQuestionEditor',
  components: {
    draggable,
  },
  props: {
    // choices [a, b, ...]
    value: {
      type: Array,
      required: true,
    },
    questionType: {
      type: String,
      default: 'MC',
    },
    media: {
      type: Object,
      default: null,
    },
  },
  watch: {
    internalChoices() {
      this.updateChoices()
    },
    value() {
      this.internalChoices = this.value
    },
  },
  methods: {
    onAfterIsCorrectModified(option) {
      // Ensure only one option can be correct
      if (option.isCorrect && this.questionType == 'SF') {
        _.each(this.internalChoices, (opt) => {
          if (opt.id !== option.id && opt.isCorrect) {
            opt.isCorrect = false
          }
        })
      }
      this.updateChoices()
    },
    updateChoices() {
      this.$emit('input', this.internalChoices)
    },
    removeOption(optionList, index) {
      optionList.splice(index, 1)
    },
    addOption(optionList) {
      optionList.push({ id: uuidv4(), text: '', isCorrect: false })
    },
  },
  data() {
    return {
      internalChoices: this.value,
      requiredRule: [(v) => !!v || 'Required'],
    }
  },
}
</script>

<style scoped lang="scss"></style>
