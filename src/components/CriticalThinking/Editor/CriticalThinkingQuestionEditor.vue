<!-- TODO: To avoid prop mutation, this entire component needs to be rethought out -->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <v-form ref="questionForm" v-model="formIsValid">
    <CriticalThinkingPreview
      v-if="showPreview"
      v-model="showPreview"
      :question="criticalThinkingQuestion"
    ></CriticalThinkingPreview>
    <v-container>
      <v-dialog v-model="isDeleteModalOpen" width="500">
        <template>
          <v-card>
            <v-card-title class="headline" primary-title>
              {{ $t('global.confirm') }}
            </v-card-title>

            <v-card-text>
              {{ $t('CriticalThinkingManager.delete_question_confirmation') }}
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" text @click="isDeleteModalOpen = false">
                {{ $t('global.cancel') }}
              </v-btn>
              <v-btn color="red darken-1" text @click="$emit('delete', criticalThinkingQuestion)">
                {{ $t('global.delete') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
      <v-row>
        <v-col cols="2">
          <v-btn @click="isDeleteModalOpen = true" color="error" block>{{ $t('global.delete') }}</v-btn>
        </v-col>
        <v-col cols="2">
          <v-btn :disabled="!canReset" @click="reset" block>{{ $t('global.reset') }}</v-btn>
        </v-col>
        <v-col cols="2">
          <v-btn :disabled="!canPreview" @click="showPreview = true" color="primary" block>{{
            $t('global.preview')
          }}</v-btn>
        </v-col>
        <v-col cols="2">
          <v-btn
            :disabled="!canDuplicateQuestion"
            @click="$emit('duplicate', criticalThinkingQuestion)"
            color="secondary"
            block
            >{{ $t('global.duplicate') }}</v-btn
          >
        </v-col>
        <v-col cols="4">
          <v-btn :disabled="!canSaveQuestion" @click="save" color="success" block>{{
            criticalThinkingQuestion.isNew ? $t('CriticalThinkingManager.save_new_question') : $t('global.save')
          }}</v-btn>
        </v-col>
      </v-row>
      <v-divider></v-divider>
      <v-row>
        <v-col>
          <v-textarea
            outlined
            :rules="requiredRule"
            v-model="criticalThinkingQuestion.questionText"
            :label="$t('global.question')"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-textarea
            outlined
            :rules="requiredRule"
            v-model="criticalThinkingQuestion.answerExplanation"
            label="Answer Explanation"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-select
            outlined
            :rules="requiredRule"
            v-model="criticalThinkingQuestion.categoryId"
            :items="categories"
            item-text="name"
            item-value="id"
            :label="$t('global.category')"
          />
        </v-col>
        <v-col>
          <v-select
            outlined
            v-model="baseBodyPart"
            :items="bodyParts.filter((el) => !el.baseId)"
            item-text="name"
            item-value="id"
            :label="$t('global.body_part')"
            clearable
          />
          <v-select
            v-if="isCTLab"
            v-model="bodyPartTypeValue"
            :items="filterBodyPartTypes"
            item-text="name"
            item-value="id"
            :label="`Type`"
            menu-props="auto"
            outlined
            :disabled="!baseBodyPart"
          />
        </v-col>
        <v-col cols="3">
          <v-select
            outlined
            v-model="criticalThinkingQuestion.type"
            :items="availableQuestionTypes"
            :rules="requiredRule"
            label="Question Type"
          />
        </v-col>
        <v-col cols="2">
          <v-select
            outlined
            v-model="criticalThinkingQuestion.difficulty"
            :items="difficultyChoices"
            :rules="requiredRule"
            item-text="name"
            item-value="val"
            :label="$t('global.difficulty')"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="3">
          <v-text-field
            default="45"
            type="number"
            v-model="criticalThinkingQuestion.secondsToAnswer"
            :label="$t('global.seconds_per_question')"
          ></v-text-field>
        </v-col>
        <v-col cols="3">
          <v-checkbox :label="$t('global.for_prepared_exams')" v-model="isOnlyForPreparedExams"></v-checkbox>
          <v-checkbox
            :label="$t('global.beta_question')"
            v-model="isBetaQuestion"
            :disabled="!isOnlyForPreparedExams"
            class="mt-0 pt-0"
          ></v-checkbox>
        </v-col>
        <v-col cols="3">
          <v-checkbox
            :label="$t('global.global_question')"
            v-model="criticalThinkingQuestion.globalQuestion"
            :disabled="isBetaQuestion"
          ></v-checkbox>
        </v-col>
        <v-col cols="3">
          <v-checkbox :label="$t('global.hide_question')" v-model="isHideQuestion"></v-checkbox>
        </v-col>
        <v-col cols="2">
          <v-select
            outlined
            v-model="mediaType"
            :items="availableMediaTypes"
            :rules="requiredRule"
            label="Media Type"
            @change="filePicker = null"
          />
        </v-col>
        <v-col cols="10" v-if="mediaType == 'dicom'">
          <v-select
            v-model="dicomFileSetId"
            @change="criticalThinkingQuestion.media = { isNew: true, dicomFileSetId }"
            outlined
            :items="dicomFileSets"
            item-text="name"
            item-value="id"
            label="Dicom"
          />
        </v-col>
        <v-col cols="10" v-if="mediaType == 'upload'">
          <v-file-input
            v-model="filePicker"
            :accept="acceptedFileTypes"
            label="File input"
            clearable
            truncate-length="100"
          ></v-file-input>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-if="showTimingQuestionEditor && criticalThinkingQuestion.media">
          <TimingQuestionEditor :video="criticalThinkingQuestion.media" v-model="questionRange"></TimingQuestionEditor>
        </v-col>
        <v-col v-if="showPointSelectQuestionEditor && criticalThinkingQuestion.media">
          <PointSelectQuestionEditor
            :media="criticalThinkingQuestion.media"
            :selected-category-name="selectedCategoryName"
            v-model="questionRange"
          ></PointSelectQuestionEditor>
        </v-col>
        <v-col v-if="showMultipleChoiceEditor">
          <div v-if="criticalThinkingQuestion.media">
            <BaseMedia :full-video-control="true" :media="criticalThinkingQuestion.media"></BaseMedia>
          </div>
          <div class="group-checkbox-keep-order">
            <label>{{ $t('ScreeningForm.keep_order') }}</label>
            <v-checkbox v-model="criticalThinkingQuestion.keepOrder"></v-checkbox>
          </div>
          <MultipleChoiceQuestionEditor
            v-model="criticalThinkingQuestion.choices"
            :question-type="criticalThinkingQuestion.type"
          ></MultipleChoiceQuestionEditor>
          <v-expansion-panels accordion multiple v-model="panel">
            <v-expansion-panel>
              <v-expansion-panel-header>{{ $t('global.settings') }}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-col>
                    <v-select
                      outlined
                      item-value="id"
                      item-text="name"
                      :items="categories"
                      :rules="requiredRule"
                      :label="$t('global.category')"
                      v-model="criticalThinkingQuestion.categoryId"
                    />
                  </v-col>
                  <v-col>
                    <v-select
                      outlined
                      clearable
                      item-value="id"
                      item-text="name"
                      :items="bodyParts"
                      :label="$t('global.body_part')"
                      v-model="criticalThinkingQuestion.bodyPartId"
                    />
                  </v-col>
                  <v-col cols="3">
                    <v-select
                      outlined
                      :rules="requiredRule"
                      label="Question Type"
                      :change="handleNewQuestionAnswerChoices()"
                      :items="criticalThinkingQuestionTypes.slice(1)"
                      v-model="criticalThinkingQuestion.type"
                    />
                  </v-col>
                  <v-col cols="2">
                    <v-select
                      outlined
                      item-text="name"
                      item-value="val"
                      :rules="requiredRule"
                      :items="difficultyChoices"
                      :label="$t('global.difficulty')"
                      v-model="criticalThinkingQuestion.difficulty"
                    />
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="3">
                    <v-text-field
                      default="45"
                      type="number"
                      v-model="criticalThinkingQuestion.secondsToAnswer"
                      :label="$t('global.seconds_per_question')"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="3">
                    <v-checkbox :label="$t('global.for_prepared_exams')" v-model="isOnlyForPreparedExams"></v-checkbox>
                  </v-col>
                  <v-col cols="3">
                    <v-checkbox
                      :label="$t('global.global_question')"
                      v-model="criticalThinkingQuestion.globalQuestion"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="3">
                    <v-checkbox :label="$t('global.hide_question')" v-model="isHideQuestion"></v-checkbox>
                  </v-col>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel v-if="this.criticalThinkingQuestion.type !== 'TR'">
              <v-expansion-panel-header>{{ $t('global.answers') }}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-col>
                  <MultipleChoiceQuestionEditor
                    v-model="criticalThinkingQuestion.choices"
                    :question-type="criticalThinkingQuestion.type"
                  ></MultipleChoiceQuestionEditor>
                </v-col>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel>
              <v-expansion-panel-header>{{ $t('ScreeningForm.media') }}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-col cols="2">
                    <v-select
                      outlined
                      v-model="mediaType"
                      :items="availableMediaTypes"
                      :rules="requiredRule"
                      label="Media Type"
                      @change="filePicker = null"
                    />
                  </v-col>
                  <v-col cols="10" v-if="mediaType == 'dicom'">
                    <v-select
                      v-model="dicomFileSetId"
                      @change="criticalThinkingQuestion.media = { isNew: true, dicomFileSetId }"
                      outlined
                      :items="dicomFileSets"
                      item-text="name"
                      item-value="id"
                      label="Dicom"
                    />
                  </v-col>
                  <v-col cols="10" v-if="mediaType == 'upload'">
                    <v-file-input
                      v-model="filePicker"
                      :accept="acceptedFileTypes"
                      label="File input"
                      clearable
                      truncate-length="100"
                    ></v-file-input>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col v-if="showTimingQuestionEditor && criticalThinkingQuestion.media">
                    <TimingQuestionEditor
                      :video="criticalThinkingQuestion.media"
                      v-model="questionRange"
                    ></TimingQuestionEditor>
                  </v-col>
                  <v-col v-if="showMultipleChoiceEditor">
                    <div v-if="criticalThinkingQuestion.media">
                      <BaseMedia :full-video-control="true" :media="criticalThinkingQuestion.media"></BaseMedia>
                    </div>
                  </v-col>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <v-expansion-panel v-if="showScreeningFormEditor">
              <v-expansion-panel-header>{{ $t('ScreeningForm.screening_form') }}</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-col>
                    <ScreeningForm
                      :critical-thinking-question="criticalThinkingQuestion"
                      :editor="true"
                      @update-screening-form="onUpdateScreeningForm"
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import CriticalThinkingPreview from '../CriticalThinkingPreview'
import MultipleChoiceQuestionEditor from './MultipleChoiceQuestionEditor'
import TimingQuestionEditor from './TimingQuestionEditor'
import PointSelectQuestionEditor from './PointSelectQuestionEditor'
import BaseMedia from '../Media/BaseMedia'
import ScreeningForm from '../../ScreeningForm.vue'
import { SCREENING_FORM_DEFAULTS, BODY_PART_TYPES } from '../../../constants'
import { calculateBodyPartIdFromBaseAndType } from '../../../util/utils'
import _ from 'lodash'
import uuidv4 from 'uuid/v4'
import config from '../../../config'

function getDimensions(type, src) {
  return new Promise((resolve) => {
    if (type.startsWith('video')) {
      let video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = function () {
        resolve({ duration: video.duration })
      }

      video.src = src
    } else if (type.startsWith('image')) {
      let image = document.createElement('img')

      image.onload = function () {
        resolve({ width: image.naturalWidth, height: image.naturalHeight })
      }

      image.src = src
    }
  })
}

export default {
  name: 'CriticalThinkingQuestionEditor',
  components: {
    MultipleChoiceQuestionEditor,
    TimingQuestionEditor,
    PointSelectQuestionEditor,
    CriticalThinkingPreview,
    BaseMedia,
    ScreeningForm,
  },
  watch: {
    isBetaQuestion: {
      handler: function (newVal) {
        console.log('isBetaQuestion', newVal)
        this.criticalThinkingQuestion.isBetaQuestion = newVal
        if (newVal) {
          this.criticalThinkingQuestion.globalQuestion = false
        }
      },
    },
    criticalThinkingQuestion: {
      handler: function (newVal) {
        this.isBetaQuestion = newVal.isBetaQuestion
      },
      immediate: true,
    },
    filePicker(file) {
      if (file) {
        if (!file.uploaded) {
          const reader = new FileReader()
          reader.onload = async (evt) => {
            this.criticalThinkingQuestion.media = {
              filename: file.name,
              src: evt.target.result,
              type: file.type,
              dimensions: await getDimensions(file.type, evt.target.result),
              isNew: !file.uploaded,
            }
            this.$forceUpdate()
          }
          reader.readAsDataURL(this.filePicker)
        }
      } else {
        this.criticalThinkingQuestion.media = null
      }
    },

    hasChanged(changed) {
      this.initialCriticalThinkingQuestion.hasChanged = changed
      this.criticalThinkingQuestion.hasChanged = changed
      this.$emit('changed')
    },
    bodyPartTypeValue: function () {
      if (this.bodyPartTypeValue == 'general') {
        this.criticalThinkingQuestion.isGeneralQuestion = true
      } else {
        this.criticalThinkingQuestion.isGeneralQuestion = false
      }
      this.onBodyPartIdChange()
    },
    baseBodyPartId: function () {
      this.onBodyPartIdChange()
    },
  },
  props: {
    criticalThinkingQuestion: {
      type: Object,
      required: true,
    },
    categories: {
      type: Array,
      required: true,
    },
    bodyParts: {
      type: Array,
      required: true,
    },
    dicomFileSets: {
      type: Array,
      required: true,
    },
  },
  methods: {
    onUpdateScreeningForm() {
      this.checkKey = this.checkKey + 1
    },
    onInnitBodyPartValue() {
      if (this.bodyParts.length > 0 && this.isCTLab) {
        const bodyPart = _.find(this.bodyParts, (el) => el.id == _.get(this.criticalThinkingQuestion, ['bodyPartId']))

        this.baseBodyPartId = bodyPart?.baseId || bodyPart?.id || _.get(this.criticalThinkingQuestion, ['bodyPartId'])
        if (this.criticalThinkingQuestion.isGeneralQuestion) {
          this.bodyPartTypeValue = 'general'
        } else {
          this.bodyPartTypes.forEach((el) => {
            if (_.get(bodyPart, ['contrastTypes', el.id], false)) {
              this.bodyPartTypeValue = el.id
            }
          })
        }
      }
    },
    onBodyPartIdChange() {
      if (!this.isCTLab) {
        return
      }
      const baseTypeValue = this.criticalThinkingQuestion.isGeneralQuestion ? 'withOut' : this.bodyPartTypeValue
      const id = calculateBodyPartIdFromBaseAndType(this.bodyParts, this.baseBodyPartId, baseTypeValue)
      if (id) {
        const baseBodyPartValue = _.find(this.bodyParts, { id: id })
        if (
          baseBodyPartValue &&
          this.criticalThinkingQuestion.type == 'SF' &&
          _.has(this.criticalThinkingQuestion, ['screeningForm'])
        ) {
          this.criticalThinkingQuestion.screeningForm.areaToScan = _.get(baseBodyPartValue, ['name'], '')
        }
      } else {
        this.criticalThinkingQuestion.screeningForm.areaToScan = ''
      }

      this.criticalThinkingQuestion.bodyPartId = id
    },

    save() {
      this.initialCriticalThinkingQuestion.hasChanged = false
      this.criticalThinkingQuestion.hasChanged = false
      if (!this.isCTLab) {
        this.criticalThinkingQuestion.onlyForPreparedExams =
          this.criticalThinkingQuestion.globalQuestion || this.criticalThinkingQuestion.onlyForPreparedExams
      }

      this.$emit('save', this.criticalThinkingQuestion)
    },

    reset() {
      _.extend(this.criticalThinkingQuestion, this.initialCriticalThinkingQuestion)
    },
    handleNewQuestionAnswerChoices() {
      const { isNew, type } = this.criticalThinkingQuestion
      const isScreeningForm = type === 'SF'
      const hasNoPreviousAnswerOptions = this.criticalThinkingQuestion.choices.length < 1
      if (isNew && isScreeningForm && hasNoPreviousAnswerOptions) {
        const defaultSFAnswerOptions = [
          'No. Proceed with examination',
          'Yes. Incomplete History. Additional conversation with patient needed',
          'Yes. Unclear Implant. Additional device information/screening needed',
          'Yes. Additional foreign body screening needed',
          'Yes. Contrast/Renal Concerns',
          'Multiple Concerns/Contraindications',
        ]
        for (const choice of defaultSFAnswerOptions) {
          this.criticalThinkingQuestion.choices.push({ id: uuidv4(), text: choice, isCorrect: false })
          this.criticalThinkingQuestion.screeningForm = SCREENING_FORM_DEFAULTS
        }
      }
    },
  },
  computed: {
    ...mapState('questionService', ['criticalThinkingQuestionTypes']),
    ...mapGetters('questionService', ['difficultyChoices']),
    selectedCategoryName() {
      return _.get(_.find(this.categories, { id: this.criticalThinkingQuestion.categoryId }), ['name'], '')
    },
    isOnlyForPreparedExams: {
      get() {
        console.log('prep exam computed get', this.criticalThinkingQuestion.onlyForPreparedExams)
        return this.criticalThinkingQuestion.onlyForPreparedExams
      },
      set(value) {
        console.log('prep exam computed', value)
        this.criticalThinkingQuestion.onlyForPreparedExams = value
        if (value) {
          this.criticalThinkingQuestion.hideQuestion = false
        }
        if (!value) {
          this.isBetaQuestion = false
        }
      },
    },
    isHideQuestion: {
      get() {
        return this.criticalThinkingQuestion.hideQuestion
      },
      set(value) {
        this.criticalThinkingQuestion.hideQuestion = value
        if (value) {
          this.criticalThinkingQuestion.onlyForPreparedExams = false
        }
      },
    },
    filterBodyPartTypes: {
      get() {
        return [
          {
            id: 'general',
            name: 'General',
          },
          ...this.bodyPartTypes.filter(
            (bpt) =>
              !!_.get(
                _.find(
                  _.filter(this.bodyParts, (el) => el.id == this.baseBodyPartId || el.baseId == this.baseBodyPartId),
                  (el) => _.get(el, ['contrastTypes', bpt.id], false)
                ),
                ['id'],
                null
              )
          ),
        ]
      },
    },
    acceptedFileTypes() {
      return this.criticalThinkingQuestion.type === 'TR' ? 'video/mp4,video/webm,video/ogv' : 'image/*,video/*'
    },

    showMultipleChoiceEditor() {
      return this.criticalThinkingQuestion.type === 'MC' || this.criticalThinkingQuestion.type === 'SF'
    },

    showTimingQuestionEditor() {
      return this.criticalThinkingQuestion.type === 'TR'
    },

    showPointSelectQuestionEditor() {
      return this.criticalThinkingQuestion.type === 'PS'
    },

    availableQuestionTypes() {
      const questionTypes = [
        { value: `MC`, text: `Multiple Choice` },
        { value: `TR`, text: `Timed Response` },
        { value: `PS`, text: `Point Select` },
        { value: `SF`, text: `Screening Form` },
      ]
      return questionTypes
    },

    availableMediaTypes() {
      const mediaTypes = [{ value: 'upload', text: 'Upload' }]
      if (this.criticalThinkingQuestion.categoryId !== 3) {
        mediaTypes.push({ value: 'dicom', text: 'Dicom' })
      }
      return mediaTypes
    },

    showScreeningFormEditor() {
      return this.criticalThinkingQuestion.type === 'SF'
    },
    hasChangedLaboratoryForm() {
      return (
        this.criticalThinkingQuestion.type === 'SF' &&
        this.checkKey &&
        !_.isEqual(
          _.get(this.criticalThinkingQuestion, ['screeningForm', 'laboratory']),
          _.get(this.initialCriticalThinkingQuestion, ['screeningForm', 'laboratory'])
        )
      )
    },
    hasChanged() {
      return (
        !_.isEqual(this.criticalThinkingQuestion, this.initialCriticalThinkingQuestion) || this.hasChangedLaboratoryForm
      )
    },
    choicesValid() {
      return (
        this.criticalThinkingQuestion.choices.length > 0 && _.some(this.criticalThinkingQuestion.choices, 'isCorrect')
      )
    },

    canSaveQuestion() {
      return (
        this.isValid && (this.hasChanged || this.criticalThinkingQuestion.isNew || this.showPointSelectQuestionEditor)
      )
    },

    canPreview() {
      return this.isValid
    },

    canReset() {
      return this.hasChanged && !this.criticalThinkingQuestion.isNew
    },

    isValid() {
      return (
        (this.choicesValid ||
          (this.showTimingQuestionEditor && this.$props.criticalThinkingQuestion.media) ||
          this.showPointSelectQuestionEditor) &&
        this.formIsValid
      )
    },

    canDuplicateQuestion() {
      return this.isValid
    },

    questionRange: {
      get() {
        const defaultValue = this.showTimingQuestionEditor ? [0, 1] : {}
        return this.criticalThinkingQuestion.range ? this.criticalThinkingQuestion.range : defaultValue
      },
      set(newVal) {
        this.criticalThinkingQuestion.range = newVal
      },
    },
    baseBodyPart: {
      get() {
        if (!this.isCTLab) {
          return this.criticalThinkingQuestion.bodyPartId
        } else {
          if (!this.baseBodyPartId) {
            const bodyPart = _.find(
              this.bodyParts,
              (el) => el.id == _.get(this.criticalThinkingQuestion, ['bodyPartId'])
            )
            return bodyPart?.baseId || bodyPart?.id || this.criticalThinkingQuestion.bodyPartId
          } else {
            return this.baseBodyPartId
          }
        }
      },
      set(id) {
        if (!this.isCTLab) {
          this.criticalThinkingQuestion.bodyPartId = id
        } else {
          this.baseBodyPartId = id
        }
      },
    },
  },
  data() {
    return {
      panel: [0, 1, 2, 3],
      isDeleteModalOpen: false,
      filePicker: null,
      mediaType: 'upload',
      dicomFileSetId: null,
      formIsValid: false,
      requiredRule: [(v) => !!v || 'Required'],
      showPreview: false,
      initialCriticalThinkingQuestion: _.cloneDeep(this.criticalThinkingQuestion),
      bodyPartTypes: BODY_PART_TYPES,
      bodyPartTypeValue: BODY_PART_TYPES[0].id,
      baseBodyPartId: null,
      isCTLab: config.isCTLab,
      checkKey: 1,
      isBetaQuestion: false,
    }
  },
  mounted() {
    if (this.criticalThinkingQuestion.media) {
      if (this.criticalThinkingQuestion.media.filename) {
        let file = new File([], this.criticalThinkingQuestion.media.filename, {
          type: this.criticalThinkingQuestion.media.type,
        })
        file.uploaded = true
        this.mediaType = 'upload'
        this.filePicker = file
      } else if (this.criticalThinkingQuestion.media.dicomFileSetId) {
        this.dicomFileSetId = this.criticalThinkingQuestion.media.dicomFileSetId
        this.mediaType = 'dicom'
      }
    } else {
      this.filePicker = null
      this.dicomFileSetId = null
    }
    this.onInnitBodyPartValue()
  },
}
</script>

<style lang="scss">
.group-checkbox-keep-order {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding: 15px 20px;
  background-color: aliceblue;
  label {
    margin: 0;
    font-size: 1rem;
  }
  .v-input--checkbox {
    margin: 0;
    .v-input__control {
      .v-messages {
        display: none;
      }
    }
  }
}
</style>
