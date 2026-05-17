<template>
  <v-form>
    <v-row>
      <v-tabs v-model="tab">
        <v-tab key="screening_form">{{ $t('ScreeningForm.screening_form') }}</v-tab>
        <v-tab key="laboratory" v-if="isShowLaboratoryTab">{{ $t('global.laboratory') }}</v-tab>
        <v-tab key="misc_documents" v-if="isShowMiscDocumentsTab">{{ $t('global.misc_documents') }}</v-tab>
      </v-tabs>
    </v-row>
    <!-- Screening Form -->
    <template v-if="tab == 0">
      <v-row>
        <img v-if="!isCTLab" class="svg" slot="extra" src="@/assets/svg/scanlab-logo.svg" />
        <img v-else class="logo-screening-form" slot="extra" src="@/assets/svg/scanlab-logo-ct.png" />
      </v-row>
      <v-row>
        <v-col cols="12" md="6" class="py-0 px-8">
          <v-text-field
            dense
            required
            outlined
            :readonly="!editor"
            placeholder="John Doe"
            :label="$t('ScreeningForm.patient_name')"
            v-model="displayPatientName"
          ></v-text-field>
        </v-col>
        <v-col
          cols="12"
          md="3"
          class="py-0 d-flex justify-center align-start"
          :class="{ 'px-8': editor, 'px-2': !editor }"
        >
          <v-radio-group
            v-if="editor"
            row
            dense
            v-model="criticalThinkingQuestion.screeningForm.gender"
            :class="{ 'mt-0': isCTLab }"
          >
            <v-radio key="Male" label="Male" value="male"></v-radio>
            <v-radio key="Female" label="Female" value="female"></v-radio>
            <v-radio key="Either" label="Either" value="either" v-if="isCTLab && editor"></v-radio>
          </v-radio-group>
          <div v-else class="d-flex" :class="{ 'flex-column': isPreview }">
            <div class="screening-form-gender-group">
              <div>
                <v-checkbox
                  :disabled="true"
                  :label="$t('ScreeningForm.male')"
                  v-model="isDisplayGenderIsMale"
                  :class="{ 'mt-0': true, 'hidden-checkbox-input-control': isPreview, 'pt-0': isPreview }"
                  hide-details
                />
              </div>
              <div>
                <v-checkbox
                  :class="{
                    'mt-0': true,
                    'hidden-checkbox-input-control': isPreview,
                    'pt-0': isPreview,
                  }"
                  :disabled="true"
                  :label="$t('ScreeningForm.female')"
                  v-model="isDisplayGenderIsFemale"
                  hide-details
                />
              </div>
              <!-- preview-only debug control: local dev only -->
              <div
                v-if="
                  isLocalDev &&
                  isPreview &&
                  criticalThinkingQuestion.screeningForm.gender === SCREENING_FORM_GENDER.EITHER
                "
                class="mt-2"
              >
                <v-btn x-small color="primary" @click="pickRandomPreviewGender">
                  Randomize sex
                </v-btn>
                <span v-if="previewRandomGender" class="ml-2 caption">
                  ({{ previewRandomGender }})
                </span>
              </div>
            </div>
          </div>
        </v-col>
        <v-col cols="12" md="3" class="py-0 px-8 d-flex justify-center align-start">
          <v-text-field
            dense
            required
            outlined
            :readonly="!editor"
            placeholder=""
            type="number"
            :label="$t('ScreeningForm.age')"
            v-model="displayAge"
          ></v-text-field>
        </v-col>
        <v-col v-if="isCTLab" cols="12" class="mb-8 pt-0" :class="{ 'mt-2': isPreview }">
          <div class="weight-and-height-container">
            <div class="d-flex justify-end align-center">
              <h6 class="mr-3">{{ $t('ScreeningForm.pt_weight') }}</h6>
              <div class="flex-column d-flex align-items-center">
                <v-text-field
                  dense
                  required
                  outlined
                  colored-border
                  :readonly="!editor"
                  placeholder="180lb"
                  hide-details="auto"
                  class="mr-3 centered-input"
                  v-model.number="weightImperial"
                />
                <span class="mr-3">{{ $t('ScreeningForm.weight_imperial') }}</span>
              </div>
              <div class="flex-column d-flex align-items-center">
                <v-text-field
                  dense
                  required
                  outlined
                  colored-border
                  placeholder="80kg"
                  :readonly="!editor"
                  hide-details="auto"
                  class="mr-3 centered-input"
                  v-model.number="weightMetric"
                />
                <span class="mr-3">{{ $t('ScreeningForm.weight_metric') }}</span>
              </div>
            </div>
            <div class="d-flex justify-start align-center">
              <h6 class="mr-3">{{ $t('ScreeningForm.pt_height') }}</h6>
              <div class="flex-column d-flex align-items-center">
                <v-text-field
                  dense
                  required
                  outlined
                  colored-border
                  :readonly="!editor"
                  hide-details="auto"
                  placeholder="6ft 2in"
                  class="mr-3 centered-input"
                  v-model.number="heightImperial"
                />
                <span class="mr-3">{{ $t('ScreeningForm.height_imperial') }}</span>
              </div>
              <div class="flex-column d-flex align-items-center" v-if="!editor">
                <v-text-field
                  dense
                  required
                  outlined
                  colored-border
                  :readonly="true"
                  hide-details="auto"
                  placeholder="2in"
                  class="mr-3 centered-input"
                  v-model.number="heightInches"
                />
                <span class="mr-3">{{ $t('ScreeningForm.height_inches') }}</span>
              </div>
              <div class="flex-column d-flex align-items-center">
                <v-text-field
                  dense
                  required
                  outlined
                  colored-border
                  :readonly="!editor"
                  placeholder="180cm"
                  hide-details="auto"
                  class="mr-3 centered-input"
                  v-model.number="heightMetric"
                />
                <span class="mr-3">{{ $t('ScreeningForm.height_metric') }}</span>
              </div>
            </div>
          </div>
        </v-col>
        <v-col cols="12" class="py-0 px-8">
          <v-text-field
            dense
            required
            outlined
            v-if="editor"
            colored-border
            :disabled="isCTLab"
            :placeholder="$t('ScreeningForm.left_ankle')"
            :label="$t('ScreeningForm.area_to_scan')"
            v-model="criticalThinkingQuestion.screeningForm.areaToScan"
          />
          <v-text-field
            v-else-if="dynamicAreaToScan"
            required
            outlined
            colored-border
            :readonly="true"
            :placeholder="$t('ScreeningForm.left_ankle')"
            :label="$t('ScreeningForm.area_to_scan')"
            :value="dynamicAreaToScan"
          />
          <TranslatedContent
            v-else
            type="multipleChoiceQuestion"
            :record="criticalThinkingQuestion"
            :lookup="{ type: 'nestedKey', path: 'screeningForm.areaToScan' }"
          >
            <template #default="tc">
              <v-text-field
                required
                outlined
                colored-border
                :readonly="true"
                :placeholder="$t('ScreeningForm.left_ankle')"
                :label="$t('ScreeningForm.area_to_scan')"
                v-model="tc.translation"
              />
            </template>
          </TranslatedContent>
        </v-col>
      </v-row>
      <v-row class="px-5">
        <h5 v-if="!isCTLab" class="blue-text">{{ $t('ScreeningForm.reason_for_mri') }}</h5>
        <h5 v-else class="blue-text">{{ $t('ScreeningForm.reason_for_ct') }}</h5>
        <v-col cols="12">
          <v-text-field
            dense
            required
            outlined
            v-if="editor"
            colored-border
            :placeholder="$t('ScreeningForm.patient_experiencing')"
            v-model="criticalThinkingQuestion.screeningForm.reasonForMRI"
          />
          <TranslatedContent
            v-else
            type="multipleChoiceQuestion"
            :record="criticalThinkingQuestion"
            :lookup="{ type: 'nestedKey', path: 'screeningForm.reasonForMRI' }"
          >
            <template #default="tc">
              <v-text-field
                required
                outlined
                colored-border
                :readonly="true"
                :placeholder="$t('ScreeningForm.patient_experiencing')"
                v-model="editor ? criticalThinkingQuestion.screeningForm.reasonForMRI : tc.translation"
              />
            </template>
          </TranslatedContent>
        </v-col>
      </v-row>
      <v-row class="px-6">
        <div class="w-100 d-flex">
          <h5 v-if="!isCTLab" class="flex-grow-1 blue-text d-flex justify-start">
            {{ $t('ScreeningForm.allergies') }}
          </h5>
          <h5 v-else class="flex-grow-1 blue-text d-flex justify-start">{{ $t('ScreeningForm.allergiesCT') }}</h5>
          <div v-if="!editor" class="flex-grow-1 d-flex justify-end align-center">
            {{ $t('ScreeningForm.yes') }} / {{ $t('ScreeningForm.no') }}
          </div>
        </div>
        <YesOrNo
          v-if="!isCTLab"
          :editor="editor"
          @update-field="updateField"
          field="previousMRIContrast"
          :label="$t('ScreeningForm.previous_mri_contrast')"
          :value="criticalThinkingQuestion.screeningForm.previousMRIContrast"
        />
        <YesOrNo
          v-else
          :editor="editor"
          @update-field="updateField"
          field="previousCTContrast"
          :label="$t('ScreeningForm.previous_ct_contrast')"
          :value="criticalThinkingQuestion.screeningForm.previousCTContrast"
        />
        <YesOrNo
          v-if="!isCTLab"
          :editor="editor"
          @update-field="updateField"
          field="reactedToMRIContrast"
          :label="$t('ScreeningForm.reacted_to_mri_contrast')"
          :value="criticalThinkingQuestion.screeningForm.reactedToMRIContrast"
        />
        <YesOrNo
          v-if="isCTLab"
          :editor="editor"
          @update-field="updateField"
          field="reactedToCTContrast"
          :label="$t('ScreeningForm.reacted_to_ct_contrast')"
          :value="criticalThinkingQuestion.screeningForm.reactedToCTContrast"
        />
        <div v-if="isCTLab" class="w-100">
          <p class="text-left">{{ $t('ScreeningForm.reaction_to_iv_contrast') }}</p>
          <v-row class="py-6">
            <v-col cols="12" class="py-0 mx-0 px-0 d-flex flex-wrap">
              <v-checkbox
                class="ms-7 my-0"
                hide-details
                :disabled="!editor"
                v-for="(option, idx) in ctIVContrastReactionsOptions"
                :key="idx"
                v-model="ctIVContrastReactions"
                :label="option.text"
                :value="option.value"
              ></v-checkbox>
            </v-col>
            <v-col cols="12" class="py-0 pt-2" v-if="ctIVContrastReactions == 'Other'">
              <v-text-field
                dense
                required
                outlined
                v-if="editor"
                colored-border
                :label="$t('ScreeningForm.note')"
                v-model="criticalThinkingQuestion.screeningForm.contrastIVReactionNote"
              />
              <TranslatedContent
                v-else
                type="multipleChoiceQuestion"
                :record="criticalThinkingQuestion"
                :lookup="{ type: 'nestedKey', path: 'screeningForm.contrastIVReactionNote' }"
              >
                <template #default="tc">
                  <v-text-field
                    required
                    outlined
                    colored-border
                    :readonly="true"
                    :label="$t('ScreeningForm.note')"
                    v-model="tc.translation"
                  />
                </template>
              </TranslatedContent>
            </v-col>
          </v-row>
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="oralContrastAllergy"
            :label="$t('ScreeningForm.oral_contrast_allergy')"
            :value="criticalThinkingQuestion.screeningForm.oralContrastAllergy"
          />
          <p class="text-left">{{ $t('ScreeningForm.reaction_to_iv_contrast') }}</p>
          <v-row class="py-6">
            <v-col cols="12" class="py-0 mx-0 px-0 d-flex flex-wrap">
              <v-checkbox
                class="ms-7 my-0"
                hide-details
                :disabled="!editor"
                v-for="(option, idx) in ctOralContrastReactionsOptions"
                :key="idx"
                v-model="ctOralContrastReactions"
                :label="option.text"
                :value="option.value"
              ></v-checkbox>
            </v-col>
            <v-col cols="12" class="py-0 pt-2" v-if="ctOralContrastReactions == 'Other'">
              <v-text-field
                dense
                required
                outlined
                v-if="editor"
                colored-border
                :label="$t('ScreeningForm.note')"
                v-model="criticalThinkingQuestion.screeningForm.ctOralContrastReactionNote"
              />
              <TranslatedContent
                v-else
                type="multipleChoiceQuestion"
                :record="criticalThinkingQuestion"
                :lookup="{ type: 'nestedKey', path: 'screeningForm.ctOralContrastReactionNote' }"
              >
                <template #default="tc">
                  <v-text-field
                    required
                    outlined
                    colored-border
                    :readonly="true"
                    :label="$t('ScreeningForm.note')"
                    v-model="tc.translation"
                  />
                </template>
              </TranslatedContent>
            </v-col>
          </v-row>
          <h5 class="flex-grow-1 blue-text d-flex justify-start">{{ $t('ScreeningForm.other_allergies') }}</h5>
          <v-textarea
            v-if="editor"
            outlined
            colored-border
            :label="$t('ScreeningForm.other_known_allergies')"
            v-model="criticalThinkingQuestion.screeningForm.otherKnownAllergies"
          />
          <TranslatedContent
            v-else
            type="multipleChoiceQuestion"
            :record="criticalThinkingQuestion"
            :lookup="{ type: 'nestedKey', path: 'screeningForm.otherKnownAllergies' }"
          >
            <template #default="tc">
              <v-textarea
                outlined
                colored-border
                readonly
                :label="$t('ScreeningForm.other_known_allergies')"
                v-model="tc.translation"
              />
            </template>
          </TranslatedContent>
        </div>
      </v-row>
      <v-row class="mt-3 px-6">
        <h5 class="blue-text">{{ $t('ScreeningForm.medical_history') }}</h5>
        <YesOrNo
          v-if="!isCTLab"
          :editor="editor"
          @update-field="updateField"
          field="metalInEyes"
          :label="$t('ScreeningForm.previous_metal_in_eyes')"
          :value="criticalThinkingQuestion.screeningForm.metalInEyes"
        />
      </v-row>
      <v-row v-if="isCTLab" class="px-6">
        <p class="text-left">{{ $t('ScreeningForm.medical_conditions') }}</p>
        <v-row class="py-6">
          <v-checkbox
            v-for="(option, idx) in ctMedicalConditionsOptions"
            hide-details
            :disabled="!editor"
            class="ms-7 my-0"
            :key="idx"
            v-model="ctMedicalConditions"
            :label="option.text"
            :value="option.value"
          ></v-checkbox>
        </v-row>
      </v-row>
      <v-row class="mt-5 px-6" v-if="!isCTLab">
        <h6>{{ $t('ScreeningForm.please_checkbox_if') }}</h6>
        <v-col cols="12">
          <v-row>
            <v-col cols="4" class="py-0">
              <YesOrNo
                :editor="editor"
                :single-checkbox="true"
                field="highBloodPressure"
                @update-field="updateField"
                :label="$t('ScreeningForm.high_blood_pressure')"
                :value="criticalThinkingQuestion.screeningForm.highBloodPressure"
              />
            </v-col>
            <v-col cols="4" class="py-0">
              <YesOrNo
                :editor="editor"
                field="diabetes"
                :single-checkbox="true"
                @update-field="updateField"
                :label="$t('ScreeningForm.diabetes')"
                :value="criticalThinkingQuestion.screeningForm.diabetes"
              />
            </v-col>
            <v-col cols="4" class="py-0">
              <YesOrNo
                :editor="editor"
                field="kidneyDialysis"
                :single-checkbox="true"
                @update-field="updateField"
                :label="$t('ScreeningForm.kidney_dialysis')"
                :value="criticalThinkingQuestion.screeningForm.kidneyDialysis"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-row v-if="!isCTLab" class="mt-5">
        <v-col cols="12">
          <v-row>
            <v-col cols="6" class="d-flex justify-end align-center">
              <h6 class="mr-3">{{ $t('ScreeningForm.pt_weight') }}</h6>
              <div class="flex-column d-flex align-items-center">
                <v-text-field
                  dense
                  required
                  outlined
                  colored-border
                  :readonly="!editor"
                  placeholder="180lb"
                  hide-details="auto"
                  class="mr-3 centered-input"
                  v-model.number="weightImperial"
                />
                <span>{{ $t('ScreeningForm.weight_imperial') }}</span>
              </div>
              <div class="flex-column d-flex align-items-center">
                <v-text-field
                  dense
                  required
                  outlined
                  colored-border
                  placeholder="80kg"
                  :readonly="!editor"
                  hide-details="auto"
                  class="mr-3 centered-input"
                  v-model.number="weightMetric"
                />
                <span>{{ $t('ScreeningForm.weight_metric') }}</span>
              </div>
            </v-col>
            <v-col cols="6" class="px-10 d-flex justify-start align-center">
              <h6 class="mr-3">{{ $t('ScreeningForm.pt_height') }}</h6>
              <div class="flex-column d-flex align-items-center">
                <v-text-field
                  dense
                  required
                  outlined
                  colored-border
                  :readonly="!editor"
                  hide-details="auto"
                  placeholder="6ft 2in"
                  class="mr-3 centered-input"
                  v-model.number="heightImperial"
                />
                <span>{{ $t('ScreeningForm.height_imperial') }}</span>
              </div>
              <div class="flex-column d-flex align-items-center" v-if="!editor">
                <v-text-field
                  dense
                  required
                  outlined
                  colored-border
                  :readonly="true"
                  hide-details="auto"
                  placeholder="2in"
                  class="mr-3 centered-input"
                  v-model.number="heightInches"
                />
                <span class="mr-3">{{ $t('ScreeningForm.height_inches') }}</span>
              </div>
              <div class="flex-column d-flex align-items-center">
                <v-text-field
                  dense
                  required
                  outlined
                  colored-border
                  :readonly="!editor"
                  placeholder="180cm"
                  hide-details="auto"
                  class="mr-3 centered-input"
                  v-model.number="heightMetric"
                />
                <span>{{ $t('ScreeningForm.height_metric') }}</span>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-row>
        <v-row class="py-0 px-8 mt-3">
          <v-col cols="12">
            <div v-if="isCTLab" class="d-flex flex-row">
              <div class="flex-grow-1 d-flex justify-start align-center">
                <h5 class="text-left blue-text">{{ $t('ScreeningForm.history_ct') }}</h5>
              </div>
              <div v-if="!editor" class="flex-grow-1 d-flex justify-end align-center">
                {{ $t('ScreeningForm.yes') }} / {{ $t('ScreeningForm.no') }}
              </div>
            </div>
            <h5 v-if="!isCTLab" class="text-left blue-text">{{ $t('ScreeningForm.surgical_history') }}</h5>
          </v-col>
          <v-col v-if="!isCTLab" cols="12">
            <h6 class="text-left">{{ $t('ScreeningForm.surgical_history_warning') }}</h6>
          </v-col>
        </v-row>
        <v-row v-if="isCTLab" class="px-8 my-5">
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="powerPortCentralIvAccess"
            :label="$t('ScreeningForm.power_port_central_iv_access')"
            :value="criticalThinkingQuestion.screeningForm.powerPortCentralIvAccess"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="currentlyOnDialysis"
            :label="$t('ScreeningForm.currently_on_dialysis')"
            :value="criticalThinkingQuestion.screeningForm.currentlyOnDialysis"
          />
          <v-row>
            <v-checkbox
              v-for="(option, idx) in ctDialysisOptions"
              class="ms-7"
              :disabled="!editor"
              :key="idx"
              v-model="ctDialysis"
              :label="option.text"
              :value="option.value"
            ></v-checkbox>
          </v-row>
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="medicationToPrepare"
            :label="$t('ScreeningForm.medication_to_prepare')"
            :value="criticalThinkingQuestion.screeningForm.medicationToPrepare"
          />
          <v-text-field
            v-if="editor"
            outlined
            colored-border
            v-model="criticalThinkingQuestion.screeningForm.medicationToPrepareDetails"
          />
          <TranslatedContent
            v-else
            type="multipleChoiceQuestion"
            :record="criticalThinkingQuestion"
            :lookup="{ type: 'nestedKey', path: 'screeningForm.medicationToPrepareDetails' }"
            class="w-100"
          >
            <template #default="tc">
              <v-text-field outlined colored-border v-model="tc.translation" readonly />
            </template>
          </TranslatedContent>
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="currentlyOnChemotherapy"
            :label="$t('ScreeningForm.currently_on_chemotherapy')"
            :value="criticalThinkingQuestion.screeningForm.currentlyOnChemotherapy"
            class="mb-5"
          />
          <p>{{ $t('ScreeningForm.currently_on_hydroxyurea') }}</p>
          <v-radio-group
            v-model="criticalThinkingQuestion.screeningForm.currentlyOnHydroxyurea"
            row
            :disabled="!editor"
            inline
          >
            <v-radio :label="$t('ScreeningForm.yes')" :value="$t('ScreeningForm.yes')"></v-radio>
            <v-radio
              :label="$t('ScreeningForm.yes_discontinued_for_exam')"
              :value="$t('ScreeningForm.yes_discontinued_for_exam')"
            ></v-radio>
            <v-radio
              :label="$t('ScreeningForm.yes_taken_today')"
              :value="$t('ScreeningForm.yes_taken_today')"
            ></v-radio>
            <v-radio :label="$t('ScreeningForm.no')" :value="$t('ScreeningForm.no')"></v-radio>
          </v-radio-group>
          <p>{{ $t('ScreeningForm.currently_on_metformin') }}</p>
          <v-radio-group
            v-model="criticalThinkingQuestion.screeningForm.currentlyOnMetformin"
            row
            :disabled="!editor"
            inline
          >
            <v-radio :label="$t('ScreeningForm.yes')" :value="$t('ScreeningForm.yes')"></v-radio>
            <v-radio
              :label="$t('ScreeningForm.yes_discontinued_for_exam')"
              :value="$t('ScreeningForm.yes_discontinued_for_exam')"
            ></v-radio>
            <v-radio
              :label="$t('ScreeningForm.yes_taken_today')"
              :value="$t('ScreeningForm.yes_taken_today')"
            ></v-radio>
            <v-radio :label="$t('ScreeningForm.no')" :value="$t('ScreeningForm.no')"></v-radio>
          </v-radio-group>
        </v-row>
        <v-col v-if="!isCTLab" cols="12" md="6" class="px-8 my-5">
          <div class="w-100 d-flex">
            <div v-if="!editor" class="flex-grow-1 d-flex justify-end align-center">
              {{ $t('ScreeningForm.yes') }} / {{ $t('ScreeningForm.no') }}
            </div>
          </div>
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="brainAneurysmClips"
            :label="$t('ScreeningForm.brain_aneurysm_clips')"
            :value="criticalThinkingQuestion.screeningForm.brainAneurysmClips"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="earImplants"
            :label="$t('ScreeningForm.ear_implant')"
            :value="criticalThinkingQuestion.screeningForm.earImplants"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="shunts"
            :label="$t('ScreeningForm.shunts')"
            :value="criticalThinkingQuestion.screeningForm.shunts"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="cardiacPacemaker"
            :label="$t('ScreeningForm.cardiac_pacemaker')"
            :value="criticalThinkingQuestion.screeningForm.cardiacPacemaker"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="conditionalPacemaker"
            :label="$t('ScreeningForm.mri_conditional_pacemaker')"
            :value="criticalThinkingQuestion.screeningForm.conditionalPacemaker"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="residualPacerWires"
            :label="$t('ScreeningForm.residual_pacer_wires')"
            :value="criticalThinkingQuestion.screeningForm.residualPacerWires"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="heartValue"
            :label="$t('ScreeningForm.heart_valve')"
            :value="criticalThinkingQuestion.screeningForm.heartValue"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="heartStent"
            :label="$t('ScreeningForm.heart_stent')"
            :value="criticalThinkingQuestion.screeningForm.heartStent"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="implantedDefibrillator"
            :label="$t('ScreeningForm.icd')"
            :value="criticalThinkingQuestion.screeningForm.implantedDefibrillator"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="tissueExpander"
            :label="$t('ScreeningForm.tissue_expander')"
            :value="criticalThinkingQuestion.screeningForm.tissueExpander"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="swanGanzCatheter"
            :label="$t('ScreeningForm.swan_ganz')"
            :value="criticalThinkingQuestion.screeningForm.swanGanzCatheter"
          />
        </v-col>
        <v-col v-if="!isCTLab" cols="12" md="6" class="px-8 my-5">
          <div class="w-100 d-flex">
            <div v-if="!editor" class="flex-grow-1 d-flex justify-end align-center">
              {{ $t('ScreeningForm.yes') }} / {{ $t('ScreeningForm.no') }}
            </div>
          </div>
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="insulinPump"
            :label="$t('ScreeningForm.insulin_pump')"
            :value="criticalThinkingQuestion.screeningForm.insulinPump"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="intravascularColisFilterStent"
            :label="$t('ScreeningForm.intravascular_colis')"
            :value="criticalThinkingQuestion.screeningForm.intravascularColisFilterStent"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="neuroStimulator"
            :label="$t('ScreeningForm.neurostimulator')"
            :value="criticalThinkingQuestion.screeningForm.neuroStimulator"
          />
          <YesOrNo
            :editor="editor"
            field="venaCavaFilter"
            @update-field="updateField"
            :label="$t('ScreeningForm.vena_cava_filter')"
            :value="criticalThinkingQuestion.screeningForm.venaCavaFilter"
          />
          <YesOrNo
            :editor="editor"
            field="penileImplant"
            @update-field="updateField"
            :label="$t('ScreeningForm.penile_implant')"
            :value="criticalThinkingQuestion.screeningForm.penileImplant"
          />
          <YesOrNo
            :editor="editor"
            field="electrodes"
            @update-field="updateField"
            :label="$t('ScreeningForm.electrodes')"
            :value="criticalThinkingQuestion.screeningForm.electrodes"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="bulletsPelletsShrapnel"
            :label="$t('ScreeningForm.bullets')"
            :value="criticalThinkingQuestion.screeningForm.bulletsPelletsShrapnel"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="magneticBatteryOperatedDevice"
            :label="$t('ScreeningForm.magnetic_device')"
            :value="criticalThinkingQuestion.screeningForm.magneticBatteryOperatedDevice"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="boneStimulator"
            :label="$t('ScreeningForm.bone_stimulator')"
            :value="criticalThinkingQuestion.screeningForm.boneStimulator"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="recentColonoscopyEndoscopy"
            :label="$t('ScreeningForm.colon_endoscopy')"
            :value="criticalThinkingQuestion.screeningForm.recentColonoscopyEndoscopy"
          />
        </v-col>
      </v-row>
      <v-row v-if="!isCTLab">
        <v-row class="mt-8 px-8 pt-0">
          <v-col cols="12">
            <h6 class="text-left">{{ $t('ScreeningForm.interfere_warning') }}</h6>
          </v-col>
        </v-row>
        <v-col cols="12" md="6" class="px-8">
          <div class="w-100 d-flex">
            <div v-if="!editor" class="flex-grow-1 d-flex justify-end align-center">
              {{ $t('ScreeningForm.yes') }} / {{ $t('ScreeningForm.no') }}
            </div>
          </div>
          <YesOrNo
            :editor="editor"
            field="hearingAids"
            @update-field="updateField"
            :label="$t('ScreeningForm.hearing_aids')"
            :value="criticalThinkingQuestion.screeningForm.hearingAids"
          />
          <YesOrNo
            :editor="editor"
            :child-emphasis="true"
            field="removableHearingAid"
            @update-field="updateField"
            :label="$t('ScreeningForm.removable')"
            v-if="criticalThinkingQuestion.screeningForm.hearingAids"
            :value="criticalThinkingQuestion.screeningForm.removableHearingAid"
          />
          <YesOrNo
            :editor="editor"
            field="dentures"
            @update-field="updateField"
            :label="$t('ScreeningForm.dentures')"
            :value="criticalThinkingQuestion.screeningForm.dentures"
          />
          <YesOrNo
            :editor="editor"
            :child-emphasis="true"
            field="removableDentures"
            @update-field="updateField"
            :label="$t('ScreeningForm.removable')"
            v-if="criticalThinkingQuestion.screeningForm.dentures"
            :value="criticalThinkingQuestion.screeningForm.removableDentures"
          />
          <YesOrNo
            :editor="editor"
            field="wigHairpiece"
            @update-field="updateField"
            :label="$t('ScreeningForm.wig_hairpiece')"
            :value="criticalThinkingQuestion.screeningForm.wigHairpiece"
          />
          <YesOrNo
            :editor="editor"
            field="removableWig"
            :child-emphasis="true"
            @update-field="updateField"
            :label="$t('ScreeningForm.removable')"
            v-if="criticalThinkingQuestion.screeningForm.wigHairpiece"
            :value="criticalThinkingQuestion.screeningForm.removableWig"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="harringtonRod"
            :label="$t('ScreeningForm.harrington_rod')"
            :value="criticalThinkingQuestion.screeningForm.harringtonRod"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="vascularAccessPort"
            :label="$t('ScreeningForm.vascular_access_port')"
            :value="criticalThinkingQuestion.screeningForm.vascularAccessPort"
          />
          <YesOrNo
            :editor="editor"
            field="medicationPatch"
            @update-field="updateField"
            :label="$t('ScreeningForm.medication_patch')"
            :value="criticalThinkingQuestion.screeningForm.medicationPatch"
          />
          <YesOrNo
            :editor="editor"
            :child-emphasis="true"
            @update-field="updateField"
            field="removableMedicationPatch"
            :label="$t('ScreeningForm.removable')"
            v-if="criticalThinkingQuestion.screeningForm.medicationPatch"
            :value="criticalThinkingQuestion.screeningForm.removableMedicationPatch"
          />
          <YesOrNo
            :editor="editor"
            field="jointReplacement"
            @update-field="updateField"
            :label="$t('ScreeningForm.joint_replacement')"
            :value="criticalThinkingQuestion.screeningForm.jointReplacement"
          />
          <v-row v-if="criticalThinkingQuestion.screeningForm.jointReplacement">
            <v-text-field
              v-if="editor"
              required
              outlined
              :label="$t('ScreeningForm.location')"
              :placeholder="$t('ScreeningForm.location_joint_replacement')"
              v-model="criticalThinkingQuestion.screeningForm.locationOfJointReplacement"
            />
            <v-container v-else class="bg-grey font-weight-bold mx-3 p-3 d-flex justify-start freeform-text-bubble">
              <TranslatedContent
                type="multipleChoiceQuestion"
                :record="criticalThinkingQuestion"
                :lookup="{ type: 'nestedKey', path: 'screeningForm.locationOfJointReplacement' }"
              />
            </v-container>
          </v-row>
          <YesOrNo
            :editor="editor"
            field="boneOrJointPins"
            @update-field="updateField"
            :label="$t('ScreeningForm.bone_joint_pins')"
            :value="criticalThinkingQuestion.screeningForm.boneOrJointPins"
          />
          <v-row v-if="criticalThinkingQuestion.screeningForm.boneOrJointPins">
            <v-text-field
              v-if="editor"
              required
              outlined
              :label="$t('ScreeningForm.location')"
              :placeholder="$t('ScreeningForm.location_pins')"
              v-model="criticalThinkingQuestion.screeningForm.locationOfBoneOrJointPins"
            />
            <v-container v-else class="bg-grey font-weight-bold mx-3 p-3 d-flex justify-start freeform-text-bubble">
              <TranslatedContent
                type="multipleChoiceQuestion"
                :record="criticalThinkingQuestion"
                :lookup="{ type: 'nestedKey', path: 'screeningForm.locationOfBoneOrJointPins' }"
              />
            </v-container>
          </v-row>
          <YesOrNo
            :editor="editor"
            field="diaphragm"
            @update-field="updateField"
            :label="$t('ScreeningForm.diaphragm')"
            :value="criticalThinkingQuestion.screeningForm.diaphragm"
          />
        </v-col>
        <v-col cols="12" md="6" class="px-8">
          <div class="w-100 d-flex">
            <div v-if="!editor" class="flex-grow-1 d-flex justify-end align-center">
              {{ $t('ScreeningForm.yes') }} / {{ $t('ScreeningForm.no') }}
            </div>
          </div>
          <YesOrNo
            :editor="editor"
            field="metalMesh"
            @update-field="updateField"
            :label="$t('ScreeningForm.metal_mesh')"
            :value="criticalThinkingQuestion.screeningForm.metalMesh"
          />
          <YesOrNo
            :editor="editor"
            field="wireSutures"
            @update-field="updateField"
            :label="$t('ScreeningForm.wire_suture')"
            :value="criticalThinkingQuestion.screeningForm.wireSutures"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="vascularClampsClips"
            :label="$t('ScreeningForm.vascular_clamp_clip')"
            :value="criticalThinkingQuestion.screeningForm.vascularClampsClips"
          />
          <YesOrNo
            :editor="editor"
            field="skinStaples"
            @update-field="updateField"
            :label="$t('ScreeningForm.skin_staples')"
            :value="criticalThinkingQuestion.screeningForm.skinStaples"
          />
          <YesOrNo
            :editor="editor"
            field="bodyPiercing"
            @update-field="updateField"
            :label="$t('ScreeningForm.body_piercing')"
            :value="criticalThinkingQuestion.screeningForm.bodyPiercing"
          />
          <YesOrNo
            :editor="editor"
            :child-emphasis="true"
            @update-field="updateField"
            field="removableBodyPiercing"
            :label="$t('ScreeningForm.removable')"
            v-if="criticalThinkingQuestion.screeningForm.bodyPiercing"
            :value="criticalThinkingQuestion.screeningForm.removableBodyPiercing"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="metalRodsPlatesScrewsNails"
            :label="$t('ScreeningForm.metal_rods')"
            :value="criticalThinkingQuestion.screeningForm.metalRodsPlatesScrewsNails"
          />
          <v-row v-if="criticalThinkingQuestion.screeningForm.metalRodsPlatesScrewsNails">
            <v-text-field
              v-if="editor"
              required
              outlined
              :label="$t('ScreeningForm.location')"
              :placeholder="$t('ScreeningForm.location_metal_rods')"
              v-model="criticalThinkingQuestion.screeningForm.locationOfMetalRodsPlatesScrewsNails"
            />
            <v-container v-else class="bg-grey font-weight-bold mx-3 p-3 d-flex justify-start freeform-text-bubble">
              <TranslatedContent
                type="multipleChoiceQuestion"
                :record="criticalThinkingQuestion"
                :lookup="{ type: 'nestedKey', path: 'screeningForm.locationOfMetalRodsPlatesScrewsNails' }"
              />
            </v-container>
          </v-row>
          <YesOrNo
            :editor="editor"
            field="prosthesisImplant"
            @update-field="updateField"
            :label="$t('ScreeningForm.prosthesis')"
            :value="criticalThinkingQuestion.screeningForm.prosthesisImplant"
          />
          <v-row v-if="criticalThinkingQuestion.screeningForm.prosthesisImplant">
            <v-text-field
              v-if="editor"
              required
              outlined
              :label="$t('ScreeningForm.location')"
              :placeholder="$t('ScreeningForm.location_prosthesis')"
              v-model="criticalThinkingQuestion.screeningForm.locationOfProsthesisImplant"
            />
            <v-container v-else class="bg-grey font-weight-bold mx-3 p-3 d-flex justify-start">
              <TranslatedContent
                type="multipleChoiceQuestion"
                :record="criticalThinkingQuestion"
                :lookup="{ type: 'nestedKey', path: 'screeningForm.locationOfProsthesisImplant' }"
              />
            </v-container>
          </v-row>
          <YesOrNo
            :editor="editor"
            field="metalInBody"
            @update-field="updateField"
            :label="$t('ScreeningForm.metal_in_body')"
            :value="criticalThinkingQuestion.screeningForm.metalInBody"
          />
          <v-row v-if="criticalThinkingQuestion.screeningForm.metalInBody">
            <v-text-field
              v-if="editor"
              required
              outlined
              :label="$t('ScreeningForm.location')"
              :placeholder="$t('ScreeningForm.left_ankle')"
              v-model="criticalThinkingQuestion.screeningForm.locationOfMetalInBody"
            />
            <v-container v-else class="bg-grey font-weight-bold mx-3 p-3 d-flex justify-start freeform-text-bubble">
              <TranslatedContent
                type="multipleChoiceQuestion"
                :record="criticalThinkingQuestion"
                :lookup="{ type: 'nestedKey', path: 'screeningForm.locationOfMetalInBody' }"
              />
            </v-container>
          </v-row>
        </v-col>
      </v-row>
      <v-row v-if="!isCTLab" class="px-6">
        <v-col cols="12" class="mt-3 py-0 px-8">
          <v-text-field
            v-if="editor"
            required
            outlined
            :placeholder="$t('ScreeningForm.none')"
            :label="$t('ScreeningForm.list_surgeries')"
            v-model="criticalThinkingQuestion.screeningForm.surgeriesSinceBirth"
          />
          <TranslatedContent
            v-else
            type="multipleChoiceQuestion"
            :record="criticalThinkingQuestion"
            :lookup="{ type: 'nestedKey', path: 'screeningForm.surgeriesSinceBirth' }"
          >
            <template #default="tc">
              <v-text-field
                required
                outlined
                :readonly="true"
                :placeholder="$t('ScreeningForm.none')"
                :label="$t('ScreeningForm.list_surgeries')"
                v-model="tc.translation"
              />
            </template>
          </TranslatedContent>
        </v-col>
      </v-row>
      <v-row v-if="!isCTLab" class="d-flex justify-center align-center">
        <v-col cols="12 px-8">
          <div class="w-100 d-flex">
            <div></div>
            <div v-if="!editor" class="flex-grow-1 d-flex justify-end align-center">
              {{ $t('ScreeningForm.yes') }} / {{ $t('ScreeningForm.no') }}
            </div>
          </div>
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="previousCancerDiagnosis"
            :label="$t('ScreeningForm.previously_had_cancer')"
            :value="criticalThinkingQuestion.screeningForm.previousCancerDiagnosis"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" class="py-0 px-8">
          <h5 class="text-left blue-text">{{ $t('ScreeningForm.female_patients') }}</h5>
          <div class="w-100 d-flex">
            <div></div>
            <div v-if="!editor" class="flex-grow-1 d-flex justify-end align-center">
              {{ $t('ScreeningForm.yes') }} / {{ $t('ScreeningForm.no') }}
            </div>
          </div>
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="chanceOfPregnancy"
            :label="$t('ScreeningForm.pregnancy')"
            :value="clearFemaleFieldValues ? null : criticalThinkingQuestion.screeningForm.chanceOfPregnancy"
          />
          <YesOrNo
            :editor="editor"
            @update-field="updateField"
            field="breastFeeding"
            :label="$t('ScreeningForm.breastfeeding')"
            :value="clearFemaleFieldValues ? null : criticalThinkingQuestion.screeningForm.breastFeeding"
          />
          <YesOrNo
            v-if="!isCTLab"
            :editor="editor"
            @update-field="updateField"
            field="currentlyTakingHormones"
            :label="$t('ScreeningForm.hormones')"
            :value="clearFemaleFieldValues ? null : criticalThinkingQuestion.screeningForm.currentlyTakingHormones"
          />
          <YesOrNo
            v-if="!isCTLab"
            :editor="editor"
            @update-field="updateField"
            field="previousHysterectomy"
            :label="$t('ScreeningForm.hysterectomy')"
            :value="clearFemaleFieldValues ? null : criticalThinkingQuestion.screeningForm.previousHysterectomy"
          />
          <YesOrNo
            v-if="!isCTLab"
            :editor="editor"
            @update-field="updateField"
            field="ovariesRemoved"
            :label="$t('ScreeningForm.ovaries_removed')"
            :value="clearFemaleFieldValues ? null : criticalThinkingQuestion.screeningForm.ovariesRemoved"
          />
        </v-col>
      </v-row>
      <v-row class="mt-10 px-6">
        <v-col cols="12" md="6">
          <v-text-field
            required
            outlined
            :readonly="!editor || isCTLab"
            :placeholder="$t('ScreeningForm.ms_graziano')"
            :label="$t('ScreeningForm.patient_signature')"
            v-model="displayTestPatientFamilyMemberSignature"
          ></v-text-field>
          <v-text-field
            required
            outlined
            :readonly="!editor"
            :label="$t('ScreeningForm.date_time')"
            v-model="criticalThinkingQuestion.screeningForm.dateTimePatient"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            required
            outlined
            :readonly="!editor || isCTLab"
            :placeholder="$t('ScreeningForm.dr_tran')"
            :label="$t('ScreeningForm.technologist_signature')"
            v-model="displayTechnologistSignature"
          ></v-text-field>
          <v-text-field
            required
            outlined
            :readonly="!editor"
            :label="$t('ScreeningForm.date_time')"
            v-model="criticalThinkingQuestion.screeningForm.dateTimeTechnologist"
          ></v-text-field>
        </v-col>
      </v-row>
    </template>
    <!-- Laboratory -->
    <template v-if="tab == 1">
      <v-row>
        <img v-if="!isCTLab" class="svg" slot="extra" src="@/assets/svg/scanlab-logo.svg" />
        <img v-else class="logo-screening-form" slot="extra" src="@/assets/svg/scanlab-logo-ct.png" />
      </v-row>
      <v-row class="mt-8">
        <v-col cols="12" md="6" class="py-0 px-8">
          <v-text-field
            dense
            required
            outlined
            :readonly="!editor"
            placeholder="John Doe"
            :label="$t('ScreeningForm.patient_name')"
            v-model="displayPatientName"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="12" class="py-0 px-8 pb-6">
          <div class="text-left">{{ `Values` }}</div>
        </v-col>
        <v-col cols="12" md="6" class="py-0 px-8 d-flex justify-center align-center" v-if="editor">
          <label class="mr-4 mb-0">{{ $t('ScreeningForm.eGFR') }}</label>
          <SpinButtonWithInput
            :type="'number'"
            v-model.number="eGFR"
            :step="1"
            :min="0"
            :max="10000"
            :disabled="!editor || noAvailableLabs"
          />
        </v-col>
        <v-col cols="12" md="6" class="py-0 px-8 d-flex justify-center align-start mb-4" v-if="!editor">
          <v-text-field
            dense
            required
            outlined
            :readonly="!editor"
            :disabled="noAvailableLabs"
            placeholder=""
            type="text"
            :label="$t('ScreeningForm.eGFR')"
            v-model="eGFR"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="6" class="py-0 px-8 d-flex justify-center align-center" v-if="editor">
          <v-checkbox
            :disabled="!editor"
            :label="$t('ScreeningForm.no_available_labs')"
            v-model="noAvailableLabs"
            :class="{ 'mt-0': true, 'pt-0': true }"
          />
        </v-col>
        <v-col cols="12" md="6" class="py-0 px-8 d-flex justify-center align-center mb-4" v-if="editor">
          <label class="mr-4 mb-0">{{ $t('ScreeningForm.days_old') }}</label>
          <SpinButtonWithInput
            :type="'number'"
            v-model.number="daysOld"
            :step="1"
            :min="1"
            :max="120"
            :disabled="!editor || noAvailableLabs"
            :allow-decimal="false"
            :allow-floating-point="false"
          />
        </v-col>
        <v-col cols="12" md="6" class="py-0 px-8 d-flex justify-center align-start" v-if="!editor">
          <v-text-field
            dense
            required
            outlined
            :readonly="!editor"
            :disabled="noAvailableLabs"
            placeholder=""
            type="text"
            :label="$t('ScreeningForm.performed_on')"
            v-model="performedOn"
          ></v-text-field>
        </v-col>
      </v-row>
    </template>
    <template v-if="tab == 2">
      <v-row>
        <img v-if="!isCTLab" class="svg" slot="extra" src="@/assets/svg/scanlab-logo.svg" />
        <img v-else class="logo-screening-form" slot="extra" src="@/assets/svg/scanlab-logo-ct.png" />
      </v-row>
      <v-row class="mt-8 mb-4">
        <v-col cols="12" md="6" class="py-0 px-8" v-if="editor">
          <v-btn class="w-100" outlined rounded text @click="onUploadPdf">{{ $t('global.upload') }}</v-btn>
          <input ref="inputUploadPdf" type="file" accept="application/pdf" hidden @input="onFileChange" />

          <div class="files-list">
            <div v-for="(file, index) in localMiscDocuments.files" :key="index" class="file-item">
              <span class="file-name">{{ index + 1 }}: {{ file.filename }}</span>
              <v-icon small @click="onRemoveFile(index)" class="remove-file-icon" :disabled="!editor">mdi-close</v-icon>
            </div>
          </div>
        </v-col>
        <v-col cols="12" md="6" class="py-0 px-8 d-flex justify-center align-start mb-4" v-if="editor">
          <v-checkbox
            :disabled="!editor"
            :label="$t('ScreeningForm.no_available_misc_documents')"
            v-model="noAvailableDocuments"
            :class="{ 'mt-0': true, 'pt-0': true }"
          />
        </v-col>
        <v-col cols="12" class="py-0 px-8 d-flex justify-center align-start mb-4" v-if="!editor">
          <div class="files-list w-100">
            <div
              v-for="(file, index) in localMiscDocuments.files"
              :key="index"
              class="file-item"
              @click="onPreviewFile(file)"
            >
              <span class="preview-file-name" :title="file.filename">{{ index + 1 }}: {{ file.filename }}</span>
            </div>
          </div>
        </v-col>
      </v-row>
    </template>
  </v-form>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'

import TranslatedContent from '@/components/TranslatedContent'
import YesOrNo from '@/components/YesOrNo'
import config from '../config'
import { SCREENING_FORM_DEFAULTS, SCREENING_FORM_GENDER, BODY_PART_TYPE } from '../constants'
import _ from 'lodash'
import moment from 'moment'
import SpinButtonWithInput from '@/components/SpinButtonWithInput.vue'

export default {
  name: 'ScreeningForm',
  components: {
    TranslatedContent,
    YesOrNo,
    SpinButtonWithInput,
  },
  props: {
    criticalThinkingQuestion: {
      type: Object,
      required: true,
    },
    editor: {
      type: Boolean,
      required: true,
    },
    isPreview: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      isCTLab: config.isCTLab,
      ctIVContrastReactions: [],
      ctOralContrastReactions: [],
      ctMedicalConditions: [],
      ctDialysis: [],
      SCREENING_FORM_GENDER: SCREENING_FORM_GENDER,
      tab: 0,
      localLaboratory: {
        eGFR: 0,
        daysOld: 0,
        noAvailableLabs: true,
      },
      localMiscDocuments: {
        files: [],
        noAvailableDocuments: true,
      },
      localAge: SCREENING_FORM_DEFAULTS.age,
      previewRandomGender: null,
      isLocalDev: import.meta.env.DEV,
    }
  },
  beforeMount() {
    if (this.isCTLab) {
      this.setCTCheckboxes()
    }
    this.ensureBodyPartTranslation()
  },
  watch: {
    questionSetBodyPartId() {
      this.ensureBodyPartTranslation()
    },
    languageCode() {
      this.ensureBodyPartTranslation()
    },
    'criticalThinkingQuestion.screeningForm.gender'(newVal) {
      if (newVal === SCREENING_FORM_GENDER.EITHER) {
        const screeningForm = this.criticalThinkingQuestion.screeningForm
        screeningForm.chanceOfPregnancy = null
        screeningForm.breastFeeding = null
      } else {
        this.previewRandomGender = null
      }
    },
    ctIVContrastReactions(newVal) {
      this.criticalThinkingQuestion.screeningForm.contrastIVReactions = newVal
    },
    ctOralContrastReactions(newVal) {
      this.criticalThinkingQuestion.screeningForm.contrastOralReactions = newVal
    },
    ctMedicalConditions(newVal) {
      this.criticalThinkingQuestion.screeningForm.medicalConditions = newVal
    },
    ctDialysis(newVal) {
      this.criticalThinkingQuestion.screeningForm.dialysis = newVal
    },
    criticalThinkingQuestion: {
      handler(newVal) {
        this.localLaboratory = _.get(newVal, ['screeningForm', 'laboratory'], this.localLaboratory)
        const dbAgeValue = _.get(newVal, ['screeningForm', 'age'], SCREENING_FORM_DEFAULTS.age)
        this.localAge = _.isNil(dbAgeValue) ? SCREENING_FORM_DEFAULTS.age : parseInt(dbAgeValue)
        this.localMiscDocuments = {
          ...this.localMiscDocuments,
          ...{
            files: _.get(this.criticalThinkingQuestion, ['questionMiscDocuments'], []),
            noAvailableDocuments: _.get(
              this.criticalThinkingQuestion,
              ['screeningForm', 'miscDocuments', 'noAvailableDocuments'],
              {}
            ),
          },
        }
      },
      deep: true,
    },
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapGetters('questionService', [
      'testModel',
      'questionSetBodyPartId',
      'questionSetBodyPartName',
      'questionSetBodyPartTypeId',
    ]),
    ...mapState('questionService', ['testPatientName', 'testPatientFamilyMemberSignature']),
    ...mapState('translatedContent', { translatedContentMap: 'translatedContent' }),
    bodyPartTypeText() {
      const typeId = this.questionSetBodyPartTypeId
      if (typeId === BODY_PART_TYPE.WITH_OUT || typeId === BODY_PART_TYPE.WITH_CONTRAST) {
        return ` ${this.$t('ContrastTypes.' + typeId, this.languageCode)}`
      }
      return ''
    },
    translatedBodyPartName() {
      if (!this.questionSetBodyPartId) {
        return this.questionSetBodyPartName || ''
      }
      const key = `bodyPart|${this.questionSetBodyPartId}|${this.languageCode}`
      return _.get(this.translatedContentMap, [key, 'name']) || this.questionSetBodyPartName || ''
    },
    dynamicAreaToScan() {
      if (!this.isCTLab || !this.questionSetBodyPartName) {
        return null
      }
      return `${this.translatedBodyPartName}${this.bodyPartTypeText}`
    },
    displayAge: {
      get() {
        const dbValue = this.localAge
        return _.isNil(dbValue) ? SCREENING_FORM_DEFAULTS.age : parseInt(this.localAge)
      },
      set(value) {
        _.set(this.criticalThinkingQuestion, ['screeningForm', 'age'], value)
        this.localAge = value
        this.$emit('update-screening-form')
      },
    },
    ctDialysisOptions() {
      return [
        {
          text: this.$t('ScreeningForm.ctDialysisOptions.hemodialysis', this.languageCode),
          value: 'Hemodialysis',
        },
        {
          text: this.$t('ScreeningForm.ctDialysisOptions.peritoneal_dialysis', this.languageCode),
          value: 'Peritoneal Dialysis',
        },
      ]
    },
    ctIVContrastReactionsOptions() {
      return [
        {
          text: this.$t('ScreeningForm.ctIVContrastReactionsOptions.rash_hives', this.languageCode),
          value: 'Rash, Hives',
        },
        {
          text: this.$t('ScreeningForm.ctIVContrastReactionsOptions.nausea_vomiting', this.languageCode),
          value: 'Nausea, Vomiting',
        },
        {
          text: this.$t('ScreeningForm.ctIVContrastReactionsOptions.swelling_eyes_face', this.languageCode),
          value: 'Swelling: eyes, face',
        },
        {
          text: this.$t('ScreeningForm.ctIVContrastReactionsOptions.shortness_of_breath', this.languageCode),
          value: 'Shortness of Breath',
        },
        {
          text: this.$t('ScreeningForm.ctIVContrastReactionsOptions.other', this.languageCode),
          value: 'Other',
        },
      ]
    },
    ctOralContrastReactionsOptions() {
      return [
        {
          text: this.$t('ScreeningForm.ctOralContrastReactionsOptions.rash_hives', this.languageCode),
          value: 'Rash, Hives',
        },
        {
          text: this.$t('ScreeningForm.ctOralContrastReactionsOptions.nausea_vomiting', this.languageCode),
          value: 'Nausea, Vomiting',
        },
        {
          text: this.$t('ScreeningForm.ctOralContrastReactionsOptions.swelling_eyes_face', this.languageCode),
          value: 'Swelling: eyes, face',
        },
        {
          text: this.$t('ScreeningForm.ctOralContrastReactionsOptions.shortness_of_breath', this.languageCode),
          value: 'Shortness of Breath',
        },
        {
          text: this.$t('ScreeningForm.ctOralContrastReactionsOptions.diarrhea', this.languageCode),
          value: 'Diarrhea',
        },
        {
          text: this.$t('ScreeningForm.ctOralContrastReactionsOptions.other', this.languageCode),
          value: 'Other',
        },
      ]
    },
    ctMedicalConditionsOptions() {
      return [
        {
          text: this.$t('ScreeningForm.ctMedicalConditionsOptions.multiple_myeloma', this.languageCode),
          value: 'Multiple Myeloma',
        },
        {
          text: this.$t('ScreeningForm.ctMedicalConditionsOptions.kidney_surgery', this.languageCode),
          value: 'Kidney Surgery (partial/single/transplant)',
        },
        {
          text: this.$t('ScreeningForm.ctMedicalConditionsOptions.diabetes', this.languageCode),
          value: 'Diabetes',
        },
        {
          text: this.$t('ScreeningForm.ctMedicalConditionsOptions.asthma', this.languageCode),
          value: 'Asthma',
        },
        {
          text: this.$t('ScreeningForm.ctMedicalConditionsOptions.kidney_disease', this.languageCode),
          value: 'Kidney Disease',
        },
        {
          text: this.$t('ScreeningForm.ctMedicalConditionsOptions.high_blood_pressure', this.languageCode),
          value: 'High Blood Preasure treated with Medication',
        },
        {
          text: this.$t('ScreeningForm.ctMedicalConditionsOptions.none', this.languageCode),
          value: 'None',
        },
      ]
    },
    isShowLaboratoryTab: {
      get() {
        // Show on both CT and MRI
        return this.editor || (!this.editor && !this.noAvailableLabs)
      },
      set() {},
    },
    isShowMiscDocumentsTab: {
      get() {
        // Show on both CT and MRI
        return this.editor || (!this.editor && !this.noAvailableDocuments)
      },
      set() {},
    },
    eGFR: {
      get() {
        if (this.noAvailableLabs) {
          return null
        } else {
          return parseFloat(_.get(this.localLaboratory, ['eGFR'], 0))
        }
      },
      set(value) {
        this.localLaboratory = {
          ...this.localLaboratory,
          eGFR: value,
        }
        this.$emit('update-screening-form')
        _.set(this.criticalThinkingQuestion, ['screeningForm', 'laboratory', 'eGFR'], value)
      },
    },
    daysOld: {
      get() {
        if (this.noAvailableLabs) {
          return null
        } else {
          return parseInt(_.get(this.localLaboratory, ['daysOld'], 1))
        }
      },
      set(value) {
        this.localLaboratory = {
          ...this.localLaboratory,
          daysOld: value,
        }
        this.$emit('update-screening-form')
        _.set(this.criticalThinkingQuestion, ['screeningForm', 'laboratory', 'daysOld'], value)
      },
    },
    noAvailableLabs: {
      get() {
        return _.get(this.localLaboratory, ['noAvailableLabs'], true)
      },
      set(value) {
        this.localLaboratory = {
          ...this.localLaboratory,
          noAvailableLabs: value,
        }
        this.$emit('update-screening-form')
        _.set(this.criticalThinkingQuestion, ['screeningForm', 'laboratory', 'noAvailableLabs'], value)
      },
    },
    noAvailableDocuments: {
      get() {
        return _.get(this.localMiscDocuments, ['noAvailableDocuments'], true)
      },
      set(value) {
        this.localMiscDocuments = {
          ...this.localMiscDocuments,
          noAvailableDocuments: value,
        }
        this.$emit('update-screening-form')
        _.set(this.criticalThinkingQuestion, ['screeningForm', 'miscDocuments', 'noAvailableDocuments'], value)
      },
    },
    performedOn() {
      if (this.noAvailableLabs) {
        return ''
      } else {
        return moment()
          .subtract(_.get(this.criticalThinkingQuestion, ['screeningForm', 'laboratory', 'daysOld'], 0), 'days')
          .format('MMMM DD, YYYY')
          .toString()
      }
    },
    legalName: {
      get: function () {
        // If we've never set this, return whatever the store has for us (which refreshes once that data is actually loaded)
        // Once we've typed something into the box ourselves, that's what it'll stay as
        return this.$store.state.user.legalName
      },
    },
    displayPatientName: {
      set(val) {
        this.criticalThinkingQuestion.screeningForm.patientName = val
      },
      get() {
        if (!this.editor) {
          // Both CT and MRI
          // We get random test patient names from the model
          // If patient name null, use default screening form patient name
          return this.testPatientName || this.criticalThinkingQuestion.screeningForm.patientName
        } else {
          return this.criticalThinkingQuestion.screeningForm.patientName
        }
      },
    },
    displayTestPatientFamilyMemberSignature: {
      set(val) {
        this.criticalThinkingQuestion.screeningForm.patientOrFamilyMemberSignature = val
      },
      get() {
        if (!this.editor && this.isCTLab) {
          if (_.get(this.criticalThinkingQuestion, ['screeningForm', 'age'], 0) < 18) {
            return (
              this.testPatientFamilyMemberSignature ||
              this.criticalThinkingQuestion.screeningForm.patientOrFamilyMemberSignature
            )
          } else {
            return this.testPatientName || this.criticalThinkingQuestion.screeningForm.patientOrFamilyMemberSignature
          }
        } else {
          return this.criticalThinkingQuestion.screeningForm.patientOrFamilyMemberSignature
        }
      },
    },
    displayGender: {
      get() {
        if (!this.editor && this.isCTLab && !this.isPreview) {
          return _.get(this.testModel, ['gender'], '')
        } else if (this.isPreview && this.previewRandomGender) {
          return this.previewRandomGender
        } else {
          return this.criticalThinkingQuestion.screeningForm.gender
        }
      },
    },
    isDisplayGenderIsMale: {
      get() {
        return this.displayGender == this.SCREENING_FORM_GENDER.MALE
      },
    },
    isDisplayGenderIsFemale: {
      get() {
        return this.displayGender == this.SCREENING_FORM_GENDER.FEMALE
      },
    },
    isDisplayGenderIsEither: {
      get() {
        return this.displayGender == this.SCREENING_FORM_GENDER.EITHER
      },
    },
    clearFemaleFieldValues() {
      return !this.editor && this.isCTLab && this.isDisplayGenderIsMale
    },
    weightImperial: {
      set(val) {
        this.criticalThinkingQuestion.screeningForm.weightImperial = val
        this.criticalThinkingQuestion.screeningForm.weightMetric = (val / 2.2046).toFixed(2)
      },
      get() {
        if (!this.editor) {
          return _.get(this.testModel, ['weightImperial'], '')
        } else {
          return this.criticalThinkingQuestion.screeningForm.weightImperial
        }
      },
    },
    weightMetric: {
      set(val) {
        this.criticalThinkingQuestion.screeningForm.weightImperial = (val * 2.2046).toFixed(2)
        this.criticalThinkingQuestion.screeningForm.weightMetric = val
      },
      get() {
        if (!this.editor) {
          return _.get(this.testModel, ['weightMetric'], '')
        } else {
          return this.criticalThinkingQuestion.screeningForm.weightMetric
        }
      },
    },
    heightImperial: {
      set(val) {
        this.criticalThinkingQuestion.screeningForm.heightImperial = val
        this.criticalThinkingQuestion.screeningForm.heightMetric = (val * 30.48).toFixed(2)
      },
      get() {
        if (!this.editor) {
          return _.get(this.testModel, ['heightImperial'], '')
        } else {
          return this.criticalThinkingQuestion.screeningForm.heightImperial
        }
      },
    },
    heightInches: {
      set() {},
      get() {
        if (!this.editor) {
          return _.get(this.testModel, ['heightInches'], '')
        } else {
          return 0
        }
      },
    },
    heightMetric: {
      set(val) {
        this.criticalThinkingQuestion.screeningForm.heightImperial = (val / 30.48).toFixed(2)
        this.criticalThinkingQuestion.screeningForm.heightMetric = val
      },
      get() {
        if (!this.editor) {
          return _.get(this.testModel, ['heightMetric'], '')
        } else {
          return this.criticalThinkingQuestion.screeningForm.heightMetric
        }
      },
    },
    displayTechnologistSignature: {
      set(val) {
        this.criticalThinkingQuestion.screeningForm.technologistSignature = val
      },
      get() {
        if (this.isCTLab) {
          return this.legalName
        } else {
          return this.criticalThinkingQuestion.screeningForm.technologistSignature
        }
      },
    },
  },
  mounted() {
    this.localLaboratory = {
      ...this.localLaboratory,
      ..._.get(this.criticalThinkingQuestion, ['screeningForm', 'laboratory'], {}),
    }
    const dbAgeValue = _.get(this.criticalThinkingQuestion, ['screeningForm', 'age'], SCREENING_FORM_DEFAULTS.age)
    this.localAge = _.isNil(dbAgeValue) ? SCREENING_FORM_DEFAULTS.age : parseInt(dbAgeValue)
    this.localMiscDocuments = {
      ...this.localMiscDocuments,
      ...{
        files: _.get(this.criticalThinkingQuestion, ['questionMiscDocuments'], []),
        noAvailableDocuments: _.get(
          this.criticalThinkingQuestion,
          ['screeningForm', 'miscDocuments', 'noAvailableDocuments'],
          {}
        ),
      },
    }
  },
  methods: {
    ...mapActions('translatedContent', ['translateThisRecord']),
    ensureBodyPartTranslation() {
      if (!this.isCTLab || !this.questionSetBodyPartId || !this.questionSetBodyPartName) {
        return
      }
      this.translateThisRecord({
        type: 'bodyPart',
        record: { id: this.questionSetBodyPartId, name: this.questionSetBodyPartName },
        lang: this.languageCode,
      })
    },
    pickRandomPreviewGender() {
      this.previewRandomGender =
        Math.random() < 0.5 ? SCREENING_FORM_GENDER.MALE : SCREENING_FORM_GENDER.FEMALE
    },
    onPreviewFile(file) {
      if (file.src) {
        if (file.src.startsWith('data') && file.localUrl) {
          window.open(file.localUrl, '_blank')
          return
        }
        window.open(file.src, '_blank')
      } else {
        this.$notify({ type: 'error', text: this.$t('ScreeningForm.file_not_found') })
      }
    },
    onRemoveFile(index) {
      this.localMiscDocuments.files.splice(index, 1)
      this.criticalThinkingQuestion.questionMiscDocuments = this.localMiscDocuments.files
      if (this.localMiscDocuments.files.length === 0) {
        this.noAvailableDocuments = true
      }
      this.$forceUpdate()
    },
    onUploadPdf() {
      this.$refs.inputUploadPdf.click()
    },
    onFileChange(e) {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = async (evt) => {
          const newFile = {
            filename: file.name,
            src: evt.target.result,
            type: file.type,
            localUrl: URL.createObjectURL(file),
            isNew: !file.uploaded,
          }
          if (this.localMiscDocuments.files.find((f) => f.filename === newFile.filename)) {
            this.$notify({ type: 'error', text: this.$t('ScreeningForm.file_already_exists') })
            return
          }
          this.localMiscDocuments.files.push(newFile)
          this.criticalThinkingQuestion.questionMiscDocuments = this.localMiscDocuments.files
          this.noAvailableDocuments = false
          this.$forceUpdate()
        }
        reader.readAsDataURL(file)
      }
    },
    updateField(field, val) {
      this.criticalThinkingQuestion.screeningForm[field] = val
    },
    setCTCheckboxes() {
      // for CT: either set checkboxes or set default (empty array)
      let screeningForm = this.criticalThinkingQuestion.screeningForm
      if (!this.criticalThinkingQuestion.isNew) {
        this.ctIVContrastReactions = screeningForm.contrastIVReactions
        this.ctOralContrastReactions = screeningForm.contrastOralReactions
        this.ctMedicalConditions = _.isArray(screeningForm.medicalConditions)
          ? screeningForm.medicalConditions
          : screeningForm.medicalConditions
          ? [screeningForm.medicalConditions]
          : []
        this.ctDialysis = screeningForm.dialysis
      } else if (this.criticalThinkingQuestion.isNew) {
        screeningForm.contrastIVReactions = this.ctIVContrastReactions
        screeningForm.contrastOralReactions = this.ctOralContrastReactions
        screeningForm.medicalConditions = this.ctMedicalConditions
        screeningForm.dialysis = this.ctDialysis
      }
    },
  },
}
</script>
<style lang="scss">
.hidden-checkbox-input-control {
  .v-messages {
    display: none;
  }
  .v-input__slot {
    margin-bottom: 0;
  }
}
</style>
<style scoped lang="scss">
.files-list {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  gap: 10px;
  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 10px;
    background-color: #f0f0f0;
    border-radius: 4px;
    .file-name {
      font-size: 14px;
      color: #333;
      max-width: 80%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .preview-file-name {
      font-size: 14px;
      color: #333;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }
  }
}
.spin-btn-grp {
  border: solid 1px rgb(177, 177, 177);
  border-radius: 4px;
}
.blue-text {
  color: $light-blue;
}
.col {
  padding-bottom: 0px !important;
}
.bg-blue {
  background-color: $light-blue;
}
.max-width {
  width: 100% !important;
}
.bg-grey {
  background-color: $gray;
}
.centered-input input {
  text-align: center;
  max-width: 100px;
}
.freeform-text-bubble {
  border-radius: 12px;
  color: #808080 !important;
}
.logo-screening-form {
  width: 160px;
  height: 60px;
}
.screening-form-gender-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-items: center;
  margin-bottom: 10px;
}
.weight-and-height-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-items: start;
  align-items: center;
}
</style>
