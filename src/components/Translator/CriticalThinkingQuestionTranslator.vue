<template>
  <v-container class="fluid">
    <v-row>
      <v-col v-if="loading">
        <LoadingBeaker />
      </v-col>
      <v-col v-else>
        <div class="d-flex flex-grow-1">
          <v-textarea
            outlined
            readonly
            hide-details
            v-model="criticalThinkingQuestion.questionText"
            :label="`${$t('global.question')} (en)`"
            class="mr-2"
          />
          <v-textarea
            outlined
            readonly
            hide-details
            v-model="translatedContentRecord.content.questionText"
            :label="`${$t('global.question')} (${languageCode})`"
          />
        </div>
        <div>
          <EditTranslation
            class="mt-2"
            :lookup="{ type: 'nestedKey', path: 'questionText' }"
            :translatedContent="translatedContentRecord"
          />
        </div>

        <div class="d-flex flex-grow-1 mt-7">
          <v-textarea
            outlined
            readonly
            hide-details
            v-model="criticalThinkingQuestion.answerExplanation"
            class="mr-2"
            :label="`${$t('global.explanation')} (en)`"
          />
          <v-textarea
            outlined
            readonly
            hide-details
            v-model="translatedContentRecord.content.answerExplanation"
            :label="`${$t('global.explanation')} (${languageCode})`"
          />
        </div>
        <div>
          <EditTranslation
            class="mt-2"
            :lookup="{ type: 'nestedKey', path: 'answerExplanation' }"
            :translatedContent="translatedContentRecord"
          />
        </div>

        <div v-if="showMultipleChoice">
          <v-card outlined elevation="2" class="mt-7">
            <v-card-title>{{ $t('global.choices') }}</v-card-title>
            <v-card-text>
              <div v-for="choice in criticalThinkingQuestion.choices" :key="choice.id">
                <v-card outlined elevation="1" class="mt-7">
                  <v-card-text>
                    <div class="d-flex flex-grow-1">
                      <v-textarea
                        outlined
                        readonly
                        hide-details
                        v-model="choice.text"
                        class="mr-2"
                        :label="`#${choice.id} (en)`"
                      />
                      <v-textarea
                        outlined
                        readonly
                        hide-details
                        :value="findChoiceText(translatedContentRecord.content.choices, choice.id)"
                        :label="`#${choice.id} (${languageCode})`"
                      />
                    </div>
                    <EditTranslation
                      class="mt-2"
                      :lookup="{
                        type: 'objectInArray',
                        arrayPath: 'choices',
                        identityKey: 'id',
                        identityValue: choice.id,
                        objectKey: 'text',
                      }"
                      :translatedContent="translatedContentRecord"
                    />
                  </v-card-text>
                </v-card>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <div v-if="showScreeningForm">
          <v-card elevation="3" class="mt-7">
            <v-card-title>{{ $t('ScreeningForm.screening_form') }}</v-card-title>
            <v-card-text>
              <div v-if="criticalThinkingQuestion.screeningForm.areaToScan">
                <div class="d-flex flex-grow-1 mt-7">
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="criticalThinkingQuestion.screeningForm.areaToScan"
                    class="mr-2"
                    :label="`${$t('ScreeningForm.area_to_scan')} (en)`"
                  />
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="translatedContentRecord.content.screeningForm.areaToScan"
                    :label="`${$t('ScreeningForm.area_to_scan')} (${languageCode})`"
                  />
                </div>
                <EditTranslation
                  class="mt-2"
                  :lookup="{
                    type: 'nestedKey',
                    path: 'screeningForm.areaToScan',
                  }"
                  :translatedContent="translatedContentRecord"
                />
              </div>

              <div v-if="criticalThinkingQuestion.screeningForm.reasonForMRI">
                <div class="d-flex flex-grow-1 mt-7">
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="criticalThinkingQuestion.screeningForm.reasonForMRI"
                    class="mr-2"
                    :label="`${$t('ScreeningForm.reason_for_mri')} (en)`"
                  />
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="translatedContentRecord.content.screeningForm.reasonForMRI"
                    :label="`${$t('ScreeningForm.reason_for_mri')} (${languageCode})`"
                  />
                </div>
                <EditTranslation
                  class="mt-2"
                  :lookup="{
                    type: 'nestedKey',
                    path: 'screeningForm.reasonForMRI',
                  }"
                  :translatedContent="translatedContentRecord"
                />
              </div>

              <div v-if="criticalThinkingQuestion.screeningForm.surgeriesSinceBirth">
                <div class="d-flex flex-grow-1 mt-7">
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="criticalThinkingQuestion.screeningForm.surgeriesSinceBirth"
                    class="mr-2"
                    :label="`${$t('ScreeningForm.list_surgeries')} (en)`"
                  />
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="translatedContentRecord.content.screeningForm.surgeriesSinceBirth"
                    :label="`${$t('ScreeningForm.list_surgeries')} (${languageCode})`"
                  />
                </div>
                <EditTranslation
                  class="mt-2"
                  :lookup="{
                    type: 'nestedKey',
                    path: 'screeningForm.surgeriesSinceBirth',
                  }"
                  :translatedContent="translatedContentRecord"
                />
              </div>

              <div v-if="criticalThinkingQuestion.screeningForm.locationOfMetalInBody">
                <div class="d-flex flex-grow-1 mt-7">
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="criticalThinkingQuestion.screeningForm.locationOfMetalInBody"
                    class="mr-2"
                    :label="`${$t('ScreeningForm.location')} - ${$t('ScreeningForm.metal_in_body')} (en)`"
                  />
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="translatedContentRecord.content.screeningForm.locationOfMetalInBody"
                    :label="`${$t('ScreeningForm.location')} - ${$t('ScreeningForm.metal_in_body')} (${languageCode})`"
                  />
                </div>
                <EditTranslation
                  class="mt-2"
                  :lookup="{
                    type: 'nestedKey',
                    path: 'screeningForm.locationOfMetalInBody',
                  }"
                  :translatedContent="translatedContentRecord"
                />
              </div>

              <div v-if="criticalThinkingQuestion.screeningForm.locationOfJointReplacement">
                <div class="d-flex flex-grow-1 mt-7">
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="criticalThinkingQuestion.screeningForm.locationOfJointReplacement"
                    class="mr-2"
                    :label="`${$t('ScreeningForm.location')} - ${$t('ScreeningForm.joint_replacement')} (en)`"
                  />
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="translatedContentRecord.content.screeningForm.locationOfJointReplacement"
                    :label="`${$t('ScreeningForm.location')} - ${$t(
                      'ScreeningForm.joint_replacement'
                    )} (${languageCode})`"
                  />
                </div>
                <EditTranslation
                  class="mt-2"
                  :lookup="{
                    type: 'nestedKey',
                    path: 'screeningForm.locationOfJointReplacement',
                  }"
                  :translatedContent="translatedContentRecord"
                />
              </div>

              <div v-if="criticalThinkingQuestion.screeningForm.locationOfBoneOrJointPins">
                <div class="d-flex flex-grow-1 mt-7">
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="criticalThinkingQuestion.screeningForm.locationOfBoneOrJointPins"
                    class="mr-2"
                    :label="`${$t('ScreeningForm.location')} - ${$t('ScreeningForm.bone_joint_pins')} (en)`"
                  />
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="translatedContentRecord.content.screeningForm.locationOfBoneOrJointPins"
                    :label="`${$t('ScreeningForm.location')} - ${$t(
                      'ScreeningForm.bone_joint_pins'
                    )} (${languageCode})`"
                  />
                </div>
                <EditTranslation
                  class="mt-2"
                  :lookup="{
                    type: 'nestedKey',
                    path: 'screeningForm.locationOfBoneOrJointPins',
                  }"
                  :translatedContent="translatedContentRecord"
                />
              </div>

              <div v-if="criticalThinkingQuestion.screeningForm.locationOfMetalRodsPlatesScrewsNails">
                <div class="d-flex flex-grow-1 mt-7">
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="criticalThinkingQuestion.screeningForm.locationOfMetalRodsPlatesScrewsNails"
                    class="mr-2"
                    :label="`${$t('ScreeningForm.location')} - ${$t('ScreeningForm.metal_rods')} (en)`"
                  />
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="translatedContentRecord.content.screeningForm.locationOfMetalRodsPlatesScrewsNails"
                    :label="`${$t('ScreeningForm.location')} - ${$t('ScreeningForm.metal_rods')} (${languageCode})`"
                  />
                </div>
                <EditTranslation
                  class="mt-2"
                  :lookup="{
                    type: 'nestedKey',
                    path: 'screeningForm.locationOfMetalRodsPlatesScrewsNails',
                  }"
                  :translatedContent="translatedContentRecord"
                />
              </div>

              <div v-if="criticalThinkingQuestion.screeningForm.locationOfProsthesisImplant">
                <div class="d-flex flex-grow-1 mt-7">
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="criticalThinkingQuestion.screeningForm.locationOfProsthesisImplant"
                    class="mr-2"
                    :label="`${$t('ScreeningForm.location')} - ${$t('ScreeningForm.prosthesis')} (en)`"
                  />
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="translatedContentRecord.content.screeningForm.locationOfProsthesisImplant"
                    :label="`${$t('ScreeningForm.location')} - ${$t('ScreeningForm.prosthesis')} (${languageCode})`"
                  />
                </div>
                <EditTranslation
                  class="mt-2"
                  :lookup="{
                    type: 'nestedKey',
                    path: 'screeningForm.locationOfProsthesisImplant',
                  }"
                  :translatedContent="translatedContentRecord"
                />
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import EditTranslation from '@/components/EditTranslation.vue'
import LoadingBeaker from '@/components/LoadingBeaker.vue'
import _ from 'lodash'

export default {
  name: 'CriticalThinkingQuestionTranslator',
  components: {
    EditTranslation,
    LoadingBeaker,
  },
  props: {
    criticalThinkingQuestion: {
      type: Object,
      required: true,
    },
    languageCode: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      type: 'multipleChoiceQuestion',
    }
  },
  async mounted() {
    await this.translateThisRecord({
      type: this.type,
      record: this.criticalThinkingQuestion,
      lang: this.languageCode,
    })
    this.loading = false
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('translatedContent', ['translatedContentRecords']),
    translationKey() {
      return `${this.type}|${this.criticalThinkingQuestion.id}|${this.languageCode}`
    },
    translatedContentRecord() {
      return this.translatedContentRecords[this.translationKey]
    },
    showMultipleChoice() {
      return this.criticalThinkingQuestion.type === 'MC' || this.criticalThinkingQuestion.type === 'SF'
    },
    showScreeningForm() {
      return this.criticalThinkingQuestion.type === 'SF'
    },
  },
  methods: {
    ...mapActions('translatedContent', ['translateThisRecord']),
    findChoice(choices, id) {
      return _.find(choices, ['id', id])
    },
    findChoiceText(choices, id) {
      const choice = this.findChoice(choices, id)
      return choice ? choice.text : ''
    },
  },
}
</script>

<style lang="scss" scoped>
.fluid {
  max-width: 100% !important;
}
</style>
