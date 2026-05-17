<template>
  <div>
    <h2>{{ questionSet.id ? $t('global.edit_test') : $t('global.new_test') }}</h2>
    <b-card class="mb-2 mx-2">
      <b-row align-h="center" class="my-3">
        <div class="col-6">
          <b>{{ $t('global.dicom') }}</b
          >: {{ dicomFileSet ? `(${regionName}) ${dicomFileSet.name}` : $t('blank') }}
        </div>
        <div class="col-6 d-flex flex-column">
          <div class="w-100 d-flex align-items-center">
            <v-checkbox v-model="questionSet.isAvailable" :label="$t('MRI.make_available_button')" class="pr-4 mt-0" />
            <v-checkbox
              v-model="questionSet.isPreparedExamOnly"
              :label="$t('MRI.prepared_exam_only')"
              class="pr-4 mt-0"
            />
            <v-select
              v-model="baseBodyPart"
              :items="(bodyPartOptions || []).filter((el) => !el.baseId)"
              item-text="name"
              item-value="id"
              :label="$t('global.body_part')"
            />
            <v-select
              v-if="isCTLab"
              v-model="bodyPartTypeValue"
              :items="filterBodyPartTypes"
              item-text="name"
              item-value="id"
              :label="`Type`"
              menu-props="auto"
              class="pl-2"
            />
          </div>
          <div class="w-100 d-flex" v-if="isCTLab">
            <v-row>
              <v-col>
                <v-text-field v-model="ageFrom" :label="$t(`global.age`)"></v-text-field>
              </v-col>
              <v-col>
                <v-text-field v-model="ageTo" :label="$t(`global.To`)"></v-text-field>
              </v-col>
              <v-col>
                <v-select
                  v-model="gender"
                  :items="SCREENING_FORM_GENDER_OPTIONS"
                  item-text="text"
                  item-value="value"
                  :label="$t('ScreeningForm.gender')"
                  menu-props="auto"
                  class="pl-2"
                />
              </v-col>
            </v-row>
          </div>
        </div>
      </b-row>
    </b-card>
    <b-card
      :title="
        $t('global.question') +
        ` ${selectedStackQuestionIndex + 1} / ${stackQuestions.length + (isEditingQuestion ? 0 : 1)}`
      "
      class="mb-2 mx-2"
    >
      <!-- TODO Better styling -->
      <div class="py-2" style="float: right">
        {{ $t('StackQuestionEdit.change_order') }}
        <span class="px-1 clickable" @click="reorderQuestion({ dir: -1 })">
          <arrow-collapse-left-icon :title="$t('StackQuestionEdit.move_question_backward')" />
        </span>
        <span class="px-1 clickable" @click="reorderQuestion({ dir: 1 })">
          <arrow-collapse-right-icon :title="$t('StackQuestionEdit.move_question_forward')" />
        </span>
      </div>
      <div style="float: left">
        <span class="clickable" @click="selectPrevQuestion">
          <arrow-left-bold-icon :title="$t('global.previous_question')" />
        </span>
        <span class="clickable" @click="addQuestion">
          <plus-icon :title="$t('StackQuestionEdit.add_question')" />
        </span>
        <span class="clickable" @click="removeQuestion">
          <delete-icon :title="$t('StackQuestionEdit.remove_question')" />
        </span>
        <span class="clickable" @click="copyQuestion">
          <content-copy-icon title="Copy Question" />
        </span>
        <span class="clickable" @click="selectNextQuestion">
          <arrow-right-bold-icon :title="$t('global.next_question')" />
        </span>
      </div>

      <div class="container">
        <b-row align-h="center">
          <v-text-field v-model="stackQuestion.questionText" :label="$t('global.question')"></v-text-field>
          <div class="col-6">
            <v-select
              outlined
              v-model="stackQuestion.difficulty"
              :items="difficultyChoices"
              item-text="name"
              item-value="val"
              :label="$t('global.difficulty')"
            />
          </div>
          <div class="col-6" v-if="dicomBranchIdHdChoices.length > 0">
            <v-select
              outlined
              v-model="stackQuestion.hdBranchId"
              :items="dicomBranchIdHdChoices"
              item-text="name"
              item-value="val"
              :label="'Dicom Branch'"
            />
          </div>
          <div class="col-12" v-if="!isCTLab">
            <v-text-field v-model="stackQuestion.title" :label="$t('StackQuestionEdit.title')" />
          </div>
          <div class="col-12 d-flex justify-center" style="gap: 12px">
            <v-radio-group v-model="stackQuestion.questionType" v-if="isCTLab">
              <v-radio label="Localizer Question" :value="3" :disabled="!canBeChosenLocalizerQuestion"></v-radio>
              <v-radio label="Acquisition Question" :value="1" :disabled="!canBeChosenAcquisitionQuestion"></v-radio>
              <v-radio
                label="Reconstruction Question"
                :value="2"
                :disabled="!canBeChosenReconstructionQuestion"
              ></v-radio>
              <v-radio
                label="Change patient position Question"
                :value="4"
                :disabled="!canBeChosenChangePatientPositionQuestion"
              ></v-radio>
              <v-radio label="Timing Decision" :value="5"></v-radio>
              <v-radio label="Cardiac Acquisition" :value="6"></v-radio>
            </v-radio-group>
            <div>
              <v-checkbox
                v-if="isCTLab"
                v-model="stackQuestion.postContrast"
                label="Post Contrast"
                class="pt-9"
                :disabled="stackQuestion.questionType !== 1"
              ></v-checkbox>
              <v-checkbox
                v-if="isCTLab"
                v-model="stackQuestion.hideSetDelay"
                label="Hide Set Delay"
                class="pt-10"
                :disabled="stackQuestion.questionType !== 5"
              ></v-checkbox>
            </div>
            <div
              class="d-flex flex-column select-phase-container"
              v-if="
                isCTLab &&
                stackQuestion.questionType == 1 &&
                stackQuestion.postContrast &&
                !this.isFirstPostContrastQuestion
              "
            >
              <v-radio-group v-model="stackQuestion.phaseNum">
                <v-radio label="Phase 2" :value="2"></v-radio>
                <v-radio label="Phase 3" :value="3"></v-radio>
                <v-radio label="Phase 4" :value="4"></v-radio>
              </v-radio-group>
            </div>
          </div>
          <template v-if="isCTLab && isShowSelectSet && stackQuestion.questionType == 4">
            <div class="col-12 d-flex justify-center" style="gap: 24px">
              <span>{{ $t('global.select_patient_position_set') }}</span>
              <div style="width: 400px">
                <v-select
                  v-model="stackQuestion.positionSetId"
                  :items="testPatientPositionSets"
                  item-text="name"
                  item-value="id"
                  :label="$t('global.position_set')"
                  menu-props="auto"
                ></v-select>
              </div>
            </div>
          </template>
          <div v-if="!isCTLab && questionSet.isUltraLab" class="checkboxes">
            <v-checkbox v-model="stackQuestion.gradeContats" label="Grade Concats" class="p-2"></v-checkbox>
            <v-checkbox
              v-model="stackQuestion.dontGradeEfficiency"
              label="Don't Grade TR Effiecency"
              class="p-2"
            ></v-checkbox>
            <v-checkbox
              v-model="stackQuestion.dontGradePixelShift"
              label="Don't Grade Pixel Shift"
              class="p-2"
            ></v-checkbox>
            <v-checkbox v-model="stackQuestion.hasSpecialtyOptions" label="Specialty Options" class="p-2"></v-checkbox>
          </div>
          <div class="checkboxes">
            <v-checkbox v-model="alterVolumeViewForCheckbox" label="Turn on Volume View" class="p-2"></v-checkbox>
            <v-checkbox
              v-model="stackQuestion.alterSpacingThickness"
              label="Alter Slice Thickness/Gap"
              class="p-2"
            ></v-checkbox>
            <v-checkbox
              v-if="!isCTLab"
              v-model="stackQuestion.ignoreInPlaneRotation"
              label="Ignore In-Plane Rotation"
              class="p-2"
            ></v-checkbox>
            <v-checkbox
              v-model="stackQuestion.freebie"
              label="Do not grade"
              class="p-2"
              :disabled="!canDoNotGradeQuestion"
            ></v-checkbox>
          </div>
        </b-row>
      </div>

      <div class="container pt-3">
        <b-row class="justify-content-md-center">
          <div class="col-3">
            <b-form inline>
              <label class="mr-sm-2">
                <b>{{ $t('global.answers') }}</b>
              </label>
              <v-btn color="primary" variant size="sm" @click="addAnswerToStackQuestion({})">{{
                $t('global.add')
              }}</v-btn>
            </b-form>
          </div>
        </b-row>
      </div>

      <b-card class="mt-1">
        <div class="container">
          <b-row class="justify-content-md-center mt-2">
            <div class="col-5">
              <v-select
                class="answer-picker mx-2"
                label="Answers"
                v-model="answerSelectionIdComputed"
                :items="answersSelections"
                :disabled="answerCurrentHasBeenModified"
                size="sm"
              ></v-select>
            </div>
            <div class="col-2">
              <v-checkbox v-model="answerCurrent.isSingleSlice" label="Single Slice Mode"></v-checkbox>
            </div>
            <div class="col-3">
              <v-select
                label="Variants"
                v-model="answerVariantSelectionIdComputed"
                :items="answerVariantSelections"
                :disabled="answerCurrentHasBeenModified"
                size="sm"
              ></v-select>
            </div>
            <div class="col-1">
              <v-btn color="success" @click="addAnswerVariant({})" :disabled="answerCurrentHasBeenModified">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>
            <div class="col-1">
              <v-btn color="error" @click="removeAnswerVariant({})" :disabled="answerVariantCurrent == null">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </b-row>
          <b-row class="justify-content-md-center mt-2">
            <div :class="answerVariantCurrent ? 'col-6' : 'col-10'">
              <v-text-field v-model="answerCurrent.name" label="Answer Name"></v-text-field>
            </div>
            <div class="col-2">
              <v-checkbox v-model="answerCurrentDefaultComputed" label="Default"></v-checkbox>
            </div>
            <div class="col-4" v-if="answerVariantCurrent">
              <b-row>
                <v-text-field v-model="answerVariantCurrent.name" label="Variant Name"></v-text-field>
              </b-row>
            </div>
          </b-row>
          <b-row class="justify-content-md-center mt-2">
            <v-container>
              <v-row>
                <v-col cols="12" md="6">
                  <v-textarea
                    v-model="answerCurrent.criteria"
                    :label="$t('global.answer_criteria')"
                    required
                  ></v-textarea>
                </v-col>
                <v-col cols="12" md="6">
                  <v-row>
                    <v-col cols="6">
                      <v-select
                        :label="$t('global.display_variants')"
                        v-model="displayVariantSelectionIdComputed"
                        :items="displayVariantSelections"
                        :disabled="answerCurrentHasBeenModified"
                        size="sm"
                      ></v-select>
                    </v-col>
                    <v-col cols="2">
                      <v-btn color="success" @click="addDisplayVariant({})" :disabled="answerCurrentHasBeenModified">
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </v-col>
                    <v-col cols="2">
                      <v-btn color="error" @click="removeDisplayVariant({})" :disabled="displayVariantCurrent == null">
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </v-col>
                    <v-col cols="2">
                      <v-btn color="error" @click="editDisplayVariantName()" :disabled="displayVariantCurrent == null">
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <v-textarea v-model="answerCurrent.citation" :label="$t('global.answer_citation')"></v-textarea>
                </v-col>
              </v-row>
            </v-container>
          </b-row>
          <b-row class="justify-content-md-center mt-2">
            <div class="col-8">
              <v-btn
                color="error"
                size="sm"
                @click="removeAnswerFromStackQuestion({ answer: answerCurrent })"
                :disabled="answers.length < 2"
                >{{ $t('global.remove_answer') }}</v-btn
              >
              <v-btn
                color="primary"
                class="mx-2"
                size="sm"
                @click="setSelectionsFromStackQuestionAnswer({ clickedRevertAnswer: true })"
                >{{ $t('global.revert_answer') }}</v-btn
              >
              <v-btn
                color="success"
                size="sm"
                @click="setStackQuestionAnswerFromSelectionsAndRefresh({ answer: answerDataCurrent })"
                >{{ $t('global.set_answer') }}</v-btn
              >
            </div>
          </b-row>
        </div>
      </b-card>

      <div class="row justify-content-md-center save-questionset-holder pt-2">
        <div v-if="answerCurrentHasBeenModified && !isModifierQuestionSet">
          {{ $t('StackQuestionEdit.answer_modified_description') }}
        </div>
        <div v-else>
          <a href="#" @click="save(true)" class="mx-2">
            {{ $t('global.save_test_as') }}
          </a>
          <v-btn color="primary" size :disabled="!maySave" @click="save(false)" class="mt-2 text-right">
            {{ $t('global.save_test') }}
          </v-btn>
        </div>
      </div>
    </b-card>

    <b-modal
      id="modal-submit-scan"
      ref="modalEditDisplayVariantName"
      :title="$t('global.enter_a_display_variant_name')"
      centered
      ok-variant="success"
      cancel-variant="danger"
      @ok="onConfirmEditDisplayVariantName()"
      @shown="modalFocusInput"
    >
      <template #modal-ok>{{ $t('global.okay') }}</template>
      <template #modal-cancel>{{ $t('global.cancel') }}</template>
      <v-form @submit.stop.prevent="onConfirmEditDisplayVariantName()">
        <v-text-field v-model="newName" :label="$t('global.name')" ref="refNewNameInput"></v-text-field>
      </v-form>
    </b-modal>
  </div>
</template>

<script>
// @ is an alias to /src
import { mapState, mapGetters, mapActions } from 'vuex'
import _ from 'lodash'
import ArrowRightBoldIcon from 'icons/ArrowRightBold'
import ArrowLeftBoldIcon from 'icons/ArrowLeftBold'
import ArrowCollapseRightIcon from 'icons/ArrowCollapseRight'
import ArrowCollapseLeftIcon from 'icons/ArrowCollapseLeft'
import PlusIcon from 'icons/Plus'
import DeleteIcon from 'icons/Delete'
import ContentCopyIcon from 'icons/ContentCopy'
import Vue from 'vue'
import config from '../config'
import { BODY_PART_TYPES, SCREENING_FORM_GENDER_OPTIONS } from '../constants'
import { calculateBodyPartIdFromBaseAndType } from '../util/utils'

export default {
  name: 'StackQuestionEdit',
  components: {
    ArrowCollapseRightIcon,
    ArrowCollapseLeftIcon,
    ArrowRightBoldIcon,
    ArrowLeftBoldIcon,
    PlusIcon,
    DeleteIcon,
    ContentCopyIcon,
  },
  data() {
    return {
      bodyPartOptions: null,
      modelOptions: [
        {
          id: 1,
          name: 'Erica',
        },
        {
          id: 2,
          name: 'Stephen',
        },
        {
          id: 3,
          name: 'Gordo',
        },
      ],
      side1: 'Head first',
      side2: 'Supine',
      side3: 'Arms up',
      isCTLab: config.isCTLab,
      bodyPartTypes: BODY_PART_TYPES,
      bodyPartTypeValue: BODY_PART_TYPES[0].id,
      baseBodyPartId: null,
      selectedPositionSet: 1,
      newName: '',
      isOpenModalEditDisplayVariantName: false,
      SCREENING_FORM_GENDER_OPTIONS,
      isModifierQuestionSet: false,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapGetters('selectionConfig', [
      'selectionConfigCurrent',
      'selectionConfigsAsAnswerData',
      'selectionConfigsGroups',
      'selectionConfigsHighestGroupId',
      'selectionConfigsCurrentGroupByIdentTypes',
    ]),
    ...mapGetters('dicomService', ['dicomFileSet', 'hdBranchIds']),
    ...mapState('questionService', [
      'questionSet',
      'answerSelectionId',
      'isSavingQuestionSet',
      'answerVariantSelectionId',
      'displayVariantSelectionId',
      'isEditingQuestion',
      'selectedStackQuestionIndex',
      'testPatientPositionSets',
    ]),
    ...mapGetters('questionService', [
      'stackQuestions',
      'isLocalizerQuestion',
      'stackQuestion',
      'answersSelections',
      'answerCurrent',
      'displayDataCurrent',
      'answerCurrentHasBeenModified',
      'refreshTestButton',
      'answers',
      'difficultyChoices',
      'answerDataCurrent',
      'answerVariantCurrent',
      'displayVariantCurrent',
      'answerVariantSelections',
      'displayVariantSelections',
      'canBeChosenReconstructionQuestion',
      'canBeChosenLocalizerQuestion',
      'canBeChosenChangePatientPositionQuestion',
      'canBeChosenAcquisitionQuestion',
      'isAcquisitionQuestion',
      'isFirstPostContrastQuestion',
      'isPostContrastQuestion',
    ]),
    canDoNotGradeQuestion() {
      // Recon question
      // return !this.isCTLab || (this.isCTLab && _.get(this.stackQuestion, ['questionType'], 0) == 2)
      // All question types can be set to "Do not grade"
      return true
    },
    isShowSelectSet() {
      let ids = [161, 265, 266, 273, 274]
      return ids.includes(this.questionSet.bodyPartId)
    },
    baseBodyPart: {
      get() {
        if (!this.isCTLab) {
          return this.questionSet.bodyPartId
        } else {
          if (!this.baseBodyPartId) {
            const bodyPart = _.find(this.bodyPartOptions, (el) => el.id == _.get(this.questionSet, ['bodyPartId']))
            return bodyPart?.baseId || bodyPart?.id
          } else {
            return this.baseBodyPartId
          }
        }
      },
      set(id) {
        if (!this.isCTLab) {
          this.questionSet.bodyPartId = id
          this.setUltraLab(id)
        } else {
          this.baseBodyPartId = id
        }
      },
    },
    ageFrom: {
      get() {
        return this.questionSet.ageFrom
      },
      set(value) {
        this.questionSet.ageFrom = +value
        this.isModifierQuestionSet = true
      },
    },
    ageTo: {
      get() {
        return this.questionSet.ageTo
      },
      set(value) {
        this.questionSet.ageTo = +value
        this.isModifierQuestionSet = true
      },
    },
    gender: {
      get() {
        return this.questionSet.gender
      },
      set(value) {
        this.questionSet.gender = value
        this.isModifierQuestionSet = true
      },
    },
    answerSelectionIdComputed: {
      get() {
        return this.answerSelectionId
      },
      set(answerSelectionId) {
        this.setAnswerSelectionId({ answerSelectionId })
      },
    },
    answerVariantSelectionIdComputed: {
      get() {
        return this.answerVariantSelectionId
      },
      set(answerVariantSelectionId) {
        this.setAnswerSelectionId({ answerSelectionId: this.answerSelectionIdComputed, answerVariantSelectionId })
      },
    },
    displayVariantSelectionIdComputed: {
      get() {
        return this.displayVariantSelectionId
      },
      set(displayVariantSelectionId) {
        this.setDisplaySelectionId(displayVariantSelectionId)
      },
    },
    answerCurrentDefaultComputed: {
      get() {
        return _.get(this.answerCurrent, 'default')
      },
      set(isDefault) {
        this.setAnswerIdAsDefault({ answerId: isDefault ? this.answerCurrent.id : null })
      },
    },
    alterVolumeViewForCheckbox: {
      get() {
        // could be true/false/null, but the checkbox treats null as unchecked for now also
        return !!this.stackQuestion.alterVolumeView
      },
      set(checkbox) {
        // Only set to true or null for now (false is not a desired functionality yet, but might be later)
        // true - set on; false - set off; null - leave as-is
        this.stackQuestion.alterVolumeView = checkbox ? true : null
      },
    },
    regionName: function () {
      if (_.size(this.bodyPartOptions) !== 0) {
        return this.bodyPartOptions[0].region.name
      } else {
        return ''
      }
    },
    dicomBranchIdHdChoices() {
      return _.map(this.hdBranchIds, function (branchId) {
        return {
          id: branchId,
          name: branchId,
        }
      })
    },
    maySave() {
      if (this.isModifierQuestionSet) {
        return true
      }
      if (this.answerCurrentHasBeenModified) {
        return false
      }
      if (this.isSavingQuestionSet) {
        return false
      }
      if (_.size(this.stackQuestion.questionText) === 0) {
        return false
      }

      // every answer has a selection
      return _.every(this.answers, function (answer) {
        return _.keys(answer).length > 2
      })
    },
    filterBodyPartTypes: {
      get() {
        return this.bodyPartTypes.filter(
          (bpt) =>
            !!_.get(
              _.find(
                _.filter(
                  this.bodyPartOptions,
                  (el) => el.id == this.baseBodyPartId || el.baseId == this.baseBodyPartId
                ),
                (el) => _.get(el, ['contrastTypes', bpt.id], false)
              ),
              ['id'],
              null
            )
        )
      },
    },
  },
  watch: {
    filterBodyPartTypes: function (newVal, prevVal) {
      if (_.get(prevVal, ['length'], 0) > 0 && _.get(newVal, ['length'], 0) != _.get(prevVal, ['length'], 0)) {
        this.bodyPartTypeValue = _.get(newVal, ['0', 'id'], '')
      }
    },
    displayDataCurrent: {
      handler: 'displayDataCurrentChanged',
      immediate: true,
    },
    answerCurrent: {
      handler: 'answerCurrentChanged',
      immediate: true,
    },
    refreshTestButton: {
      handler: 'answerCurrentChanged',
      immediate: true,
    },
    answerVariantCurrent: {
      handler: 'answerCurrentChanged',
      immediate: true,
    },
    'stackQuestion.questionType': function () {
      if (this.stackQuestion?.questionType == 2) {
        this.stackQuestion.postContrast = false
        this.stackQuestion.phaseNum = 1
      } else if (this.isCTLab) {
        this.stackQuestion.freebie = false
      }
      this.onSetPhaseNum()
    },
    'stackQuestion.postContrast': function () {
      this.onSetPhaseNum()
    },
    bodyPartTypeValue: function () {
      this.onBodyPartIdChange()
    },
    baseBodyPartId: function () {
      this.onBodyPartIdChange()
    },
    selectedStackQuestionIndex: function () {
      this.onSetPhaseNum()
    },
  },
  mounted() {
    this.fetchBodyPartsForRegion()
  },
  methods: {
    ...mapActions('questionService', [
      'saveQuestionSet',
      'setAnswerSelectionId',
      'setDisplaySelectionId',
      'setStackQuestionAnswerFromSelectionsAndRefresh',
      'addAnswerToStackQuestion',
      'removeAnswerFromStackQuestion',
      'selectPrevQuestion',
      'selectNextQuestion',
      'removeQuestion',
      'addQuestion',
      'copyQuestion',
      'reorderQuestion',
      'addAnswerVariant',
      'addDisplayVariant',
      'removeAnswerVariant',
      'removeDisplayVariant',
      'setAnswerIdAsDefault',
      'clearMemory',
      'updateDisplayVariantName',
    ]),
    ...mapActions('selectionConfig', ['setSelectionsFromStackQuestionAnswer', 'setProposedConfigFromDisplayVariant']),
    ...mapActions('bodyService', ['getBodyParts']),
    editDisplayVariantName() {
      if (this.displayVariantCurrent) {
        this.newName = this.displayVariantCurrent?.name
        this.$refs.modalEditDisplayVariantName.show()
      }
    },
    modalFocusInput() {
      let input = this.$refs.refNewNameInput
      if (input) {
        input.focus()
      }
    },
    onConfirmEditDisplayVariantName() {
      this.updateDisplayVariantName({
        name: this.newName,
      })
      this.$refs.modalEditDisplayVariantName.hide()
    },
    setUltraLab(newVal) {
      console.log('baseBodyPart', newVal)
      // check if its ultra lab enabled body part to change the min/max UI
      // TODO: come up with a way to denote lab types better
      if (this.bodyPartOptions) {
        const selectedBodyPart = this.bodyPartOptions.find((el) => el.id == newVal)
        this.questionSet.isUltraLab = selectedBodyPart.name.includes('UltraLab')
      }
    },
    onSetPhaseNum() {
      if (!this.isCTLab) {
        return
      }
      if (this.stackQuestion && this.isPostContrastQuestion) {
        if (!this.isFirstPostContrastQuestion) {
          if (_.get(this.stackQuestion, ['phaseNum'], 1) == 1) {
            this.stackQuestion.phaseNum = 2
          }
        } else {
          if (_.get(this.stackQuestion, ['phaseNum'], 1) != 1) {
            this.stackQuestion.phaseNum = 1
          }
        }
      }
    },
    onBodyPartIdChange() {
      if (!this.isCTLab) {
        return
      }
      const id = calculateBodyPartIdFromBaseAndType(this.bodyPartOptions, this.baseBodyPartId, this.bodyPartTypeValue)
      if (id) {
        this.questionSet.bodyPartId = id
      }
    },
    answerCurrentChanged() {
      if (!this.answerCurrent) {
        console.warn('No current answer')
        return
      }
      this.setSelectionsFromStackQuestionAnswer({ answer: this.answerCurrent })
    },
    displayDataCurrentChanged() {
      if (!this.answerCurrent) {
        console.warn('No current answer')
        return
      }
      this.setProposedConfigFromDisplayVariant({ answer: this.answerCurrent })
    },
    async fetchBodyPartsForRegion() {
      this.bodyPartOptions = await this.getBodyParts({ regionId: this.dicomFileSet.regionId })

      if (this.isCTLab && !this.baseBodyPartId && this.questionSet) {
        const bodyPart = _.find(this.bodyPartOptions, (el) => el.id == _.get(this.questionSet, ['bodyPartId']))
        if (bodyPart) {
          this.baseBodyPartId = bodyPart?.baseId || bodyPart.id
          this.bodyPartTypes.forEach((el) => {
            if (_.get(bodyPart, ['contrastTypes', el.id], false)) {
              this.bodyPartTypeValue = el.id
            }
          })
        }
      }
    },

    // saveANewCopy - don't Edit current QuestionSet; instead save as a new QuestionSet
    async save(saveANewCopy = false) {
      if (!this.maySave) {
        return
      }

      if (!this.questionSet.bodyPartId) {
        Vue.notify({ type: 'error', text: 'Please pick a body part' })
      } else {
        // if CT ignore in-plane rotation not needed
        if (this.isCTLab) {
          for (let question of this.questionSet.stackQuestions) {
            question.ignoreInPlaneRotation = true
          }
        }
        this.saveQuestionSet({ saveANewCopy })
        this.isModifierQuestionSet = false
      }
    },
  },
  beforeDestroy() {
    this.clearMemory()
  },
}
</script>

<style lang="scss">
.select-phase-container {
  .v-input__control {
    .v-messages {
      display: none;
    }
    .v-label {
      margin-bottom: 0;
    }
  }
}
</style>
<style scoped lang="scss">
.group-control {
  .group-control-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    flex-direction: column;
  }
  button {
    background: rgba($color: #000000, $alpha: 0.1);
    width: 100%;
    &:active {
      background: #ffff00;
    }
    &.active {
      background: #ffff00;
    }
  }
}

.answer-picker {
  min-width: 200px;
}
.save-questionset-holder {
  // to prevent vertical jump when dragging around Selection and thereby Modifying the answer and hiding the save button
  min-height: 45px;
}
.checkboxes {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
</style>
