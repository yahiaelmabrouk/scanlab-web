<template>
  <div class="dicom">
    <div class="m-5 container">
      <div class="row">
        <div class="col-10">
          <h2>{{ $t('global.tests', languageCode) }}</h2>
        </div>
      </div>
    </div>

    <div class="m-5 container">
      <div class="row py-2 my-3 dicom-row" v-for="questionSet in questionSets" :key="questionSet.id">
        <div class="col-12">
          <div class="row">
            <div class="col-6 dicom-name">
              <span v-if="isAdmin">
                {{ questionSet.id + '.' }}
              </span>
              {{ questionSetDisplayName(questionSet) }}
              <div class="d-flex justify-content-start align-items-center">
                <div class="text-body-part-info">
                  <span class="text-label"> {{ $t('global.label_body_part') }} :</span>
                  <span> {{ getBodyPartName(questionSet) }}</span>
                </div>
                <div class="text-body-part-info ml-5" v-if="isCTLab">
                  <span class="text-label"> {{ $t('global.type') }} :</span>
                  <span> {{ getBodyPartType(questionSet) }}</span>
                </div>
                <div class="body-part-info-checkbox ml-5">
                  <v-checkbox v-model="questionSet.isAvailable" disabled :label="$t('global.available')" class="mt-0" />
                </div>
                <div class="body-part-info-checkbox ml-5">
                  <v-checkbox
                    v-model="questionSet.isPreparedExamOnly"
                    disabled
                    :label="$t('MRI.prepared_exam_only')"
                    class="mt-0"
                  />
                </div>
              </div>
            </div>
            <div class="col-6">
              <router-link :to="{ path: 'mri', query: { questionSet: questionSet.id } }" class="btn-view ml-2 mb-4">
                {{ $t('global.view', languageCode) }}
              </router-link>
              <v-btn
                :to="{ path: 'mri', query: { questionSet: questionSet.id, editing: true } }"
                variant="primary"
                class="ml-2 mb-4"
              >
                {{ $t('global.edit', languageCode) }}
              </v-btn>
              <v-btn
                type="button"
                color="secondary"
                @click.stop="duplicateQuestionSetShowModal(questionSet)"
                class="ml-2 mb-4"
              >
                {{ $t('global.duplicate', languageCode) }}
              </v-btn>
              <!-- hiding this for now. deleting a test removes all the question set results for a user. This is not wanted -->
              <v-btn
                v-if="false"
                type="button"
                color="error"
                @click.stop="deleteQuestionSetShowModal(questionSet)"
                class="ml-2 mb-4"
                :disabled="true"
              >
                {{ $t('global.delete', languageCode) }}
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <v-dialog v-model="isDeleteModalOpen" width="80%">
      <v-card outlined>
        <v-card-title>
          <span class="headline">
            {{ $t('QuestionsManager.delete_test', languageCode) }}
          </span>
        </v-card-title>

        <v-card-text class="dicom-name" v-if="shownConfirmDeleteQuestionSet">
          {{ shownConfirmDeleteQuestionSet.name || shownConfirmDeleteQuestionSet.stackQuestions[0].questionText }}
        </v-card-text>

        <v-card-actions class="right">
          <v-spacer></v-spacer>
          <v-btn outlined @click="isDeleteModalOpen = false">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="error" @click="deleteQuestionSet(shownConfirmDeleteQuestionSet)">
            {{ $t('global.delete', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isDuplicateModalOpen" width="50%">
      <v-card v-if="shownDuplicatableQuestionSet">
        <v-card-title class="headline">{{ $t('global.duplicate') }}</v-card-title>
        <v-card-text>
          <v-form v-model="duplicateFormValid" ref="duplicateForm" @submit.stop.prevent="submitDuplicateTest">
            <v-select
              v-model="dicomFileSetId"
              :rules="requiredRule"
              outlined
              :items="dicomFileSets.filter((opt) => shownDuplicatableQuestionSet.dicomFileSet !== opt.id)"
              item-text="name"
              item-value="id"
              label="Dicom"
              required
            />
            <div class="d-flex justify-space-between">
              <v-btn :disabled="!duplicateFormValid" type="submit" color="primary">
                {{ $t('global.submit') }}
              </v-btn>
              <v-btn @click="isDuplicateModalOpen = false">{{ $t('global.close') }}</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import 'vue2-dropzone/dist/vue2Dropzone.min.css'
import { mapState, mapGetters, mapActions } from 'vuex'
import { apiGet, apiDelete, apiPost } from '../util/api'
import _ from 'lodash'
import config from '../config'
import { BODY_PART_TYPES } from '../constants'

export default {
  name: 'QuestionsManager',
  data() {
    return {
      questionSets: null,
      shownConfirmDeleteQuestionSet: null,
      shownDuplicatableQuestionSet: null,
      isDeleteModalOpen: false,
      isDuplicateModalOpen: false,
      dicomFileSets: null,
      dicomFileSetId: null,
      duplicateFormValid: null,
      requiredRule: [(v) => !!v || 'Required'],
      isCTLab: config.isCTLab,
      bodyPartTypes: BODY_PART_TYPES,
    }
  },
  computed: {
    ...mapState('user', ['isAdmin']),
    ...mapState('authentication', ['accessToken']),
    ...mapGetters('authentication', ['isLoggedIn']),
    ...mapGetters('user', ['languageCode']),
    questionSetDisplayName() {
      return (questionSet) => {
        if (questionSet.name || questionSet.stackQuestions.length > 1) {
          return questionSet.stackQuestions[1].questionText
        } else if (questionSet.name || questionSet.stackQuestions.length == 1) {
          return questionSet.stackQuestions[0].questionText
        }
        return 'No questions available'
      }
    },
  },
  async mounted() {
    this.fetchStackQuestions()
    this.dicomFileSets = await this.fetchAllDicoms()
  },
  methods: {
    ...mapActions('authentication', ['login']),
    ...mapActions('dicomService', ['fetchAllDicoms']),
    getBodyPartType(questionSet) {
      let type = ''
      const typeItem = _.find(this.bodyPartTypes, (el) => _.get(questionSet, ['bodyPart', 'contrastTypes', el.id]))
      if (typeItem) {
        type = typeItem.name
      }

      return type
    },
    getBodyPartName(questionSet) {
      return _.get(questionSet, ['bodyPart', 'name'], '')
    },
    async fetchStackQuestions() {
      let response = await apiGet(`questionSets`, this.accessToken)
      this.questionSets = response.data.questionSets
    },

    deleteQuestionSetShowModal(questionSet) {
      this.shownConfirmDeleteQuestionSet = questionSet
      this.isDeleteModalOpen = true
    },

    async deleteQuestionSet(questionSet) {
      this.isDeleteModalOpen = false
      this.shownConfirmDeleteQuestionSet = null

      let response = await apiDelete(`questionSets/${questionSet.id}`, this.accessToken)
      if (response.data.success) {
        this.$notify({ text: 'Deleted successfully' })
        this.fetchStackQuestions()
      }
    },

    duplicateQuestionSetShowModal(questionSet) {
      this.shownDuplicatableQuestionSet = questionSet
      this.isDuplicateModalOpen = true
    },

    async submitDuplicateTest() {
      let response = await apiPost(
        `questionSets/${this.shownDuplicatableQuestionSet.id}/duplicate`,
        { dicomFileSet: this.dicomFileSetId },
        this.accessToken
      )
      if (response.data.success) {
        this.$notify({ text: 'Duplicated successfully' })
        this.isDuplicateModalOpen = false
        this.shownDuplicatableQuestionSet = null
        this.fetchStackQuestions()
      } else {
        this.$notify({ text: response.data.error, type: 'error' })
      }
    },
  },
}
</script>
<style lang="scss">
.body-part-info-checkbox {
  .v-input--checkbox {
    align-items: center;
    .v-input__control {
      .v-input__slot {
        margin-bottom: 3px;
      }
      .v-messages {
        display: none;
      }
      .v-label {
        margin-bottom: 0;
        font-weight: normal;
        color: #535353;
      }
    }
  }
}
</style>
<style scoped lang="scss">
.text-body-part-info {
  font-weight: normal;
  color: #535353;
  .text-label {
    color: #b3b3b3;
  }
}
.dicom-row {
  margin-bottom: 10px;
  background: rgba(230, 230, 230, 0.31);
  .dicom-name {
    width: 200px;
  }
  .uploads-listing {
    background: #f1f1f1;
    max-height: 250px;
    overflow-y: auto;
    pre {
      margin-bottom: 0;
    }
  }
}
.dicom-name {
  font-weight: bold;
  text-align: left;
  overflow-wrap: break-word;
}
.upload-dropzone-wrapper {
  overflow-y: auto;
  max-height: 500px;
}
.btn-view {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex: 0 0 auto;
  user-select: none;
  vertical-align: middle;
  white-space: nowrap;
  height: 36px;
  min-width: 64px;
  padding: 0 16px;
}
</style>
