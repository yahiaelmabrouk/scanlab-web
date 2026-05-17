<template>
  <div>
    <v-row>
      <strong class="mx-auto">
        <TranslatedContent
          type="multipleChoiceQuestion"
          :record="question"
          :lookup="{ type: 'nestedKey', path: 'questionText' }"
        />
      </strong>
    </v-row>
    <v-row>
      <v-col v-if="question.media" cols="8">
        <div class="pa-1">
          <BaseMedia :full-video-control="true" :media="question.media" />
        </div>
      </v-col>
      <v-col :cols="question.media ? 4 : 12">
        <v-card raised class="pa-1">
          <v-list>
            <v-list-item-group :key="question.id" v-model="selectedAnswer" color="primary">
              <v-list-item
                :ripple="false"
                :selectable="false"
                v-for="choice in choices"
                :key="choice.id"
                :id="choice.id"
                :value="choice.id"
              >
                <!-- This structure of a sudden checkbox seems to still be having the radio option select secretly, too, but it works for now -->
                <span v-if="question.isMultiSelect">
                  <v-checkbox v-model="selectedAnswers" :label="choice.text" :value="choice.id" />
                </span>
                <span v-else>
                  <v-list-item-icon v-if="selectedAnswer === choice.id">
                    <v-icon>radio_button_checked</v-icon>
                    <TranslatedContent
                      type="multipleChoiceQuestion"
                      :record="question"
                      :lookup="{
                        type: 'objectInArray',
                        arrayPath: 'choices',
                        identityKey: 'id',
                        identityValue: choice.id,
                        objectKey: 'text',
                      }"
                    />
                  </v-list-item-icon>
                  <v-list-item-icon v-else>
                    <v-icon>radio_button_unchecked</v-icon>
                    <TranslatedContent
                      type="multipleChoiceQuestion"
                      :record="question"
                      :lookup="{
                        type: 'objectInArray',
                        arrayPath: 'choices',
                        identityKey: 'id',
                        identityValue: choice.id,
                        objectKey: 'text',
                      }"
                    />
                  </v-list-item-icon>
                </span>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import TranslatedContent from '@/components/TranslatedContent'
import _ from 'lodash'
import BaseMedia from '../Media/BaseMedia'
import config from '../../../config'

export default {
  name: 'MultipleChoiceForm',
  components: {
    BaseMedia,
    TranslatedContent,
  },
  props: {
    question: {
      type: Object,
      required: true,
    },
    value: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      selectedAnswer: null, // for single select
      selectedAnswers: [],
      isCTLab: config.isCTLab,
    }
  },
  watch: {
    serializeAnswers(newVal) {
      this.$emit('input', newVal)
    },
  },
  mounted() {
    if (this.question.isMultiSelect && this.value) {
      return (this.selectedAnswers = this.value)
    } else {
      return (this.selectedAnswer = this.value)
    }
  },
  computed: {
    choices() {
      // Matthew wanted choices shuffled to keep people on their toes
      // Unless the category is "Anatomy" or "Patient Screening"
      // TODO: This should be moved into where the questions are generated
      if (this.isCTLab) {
        return _.orderBy(this.question.choices, ['text'])
      } else {
        if (this.question.categoryId === 6 || this.question.categoryId === 3) {
          return this.question.choices
        } else {
          return _.shuffle(this.question.choices)
        }
      }
    },

    // comma separated list (often just one item)
    serializeAnswers() {
      if (this.question.isMultiSelect) {
        return _.join(_.sortBy(this.selectedAnswers), ',')
      } else {
        return this.selectedAnswer
      }
    },
  },
}
</script>

<style></style>
