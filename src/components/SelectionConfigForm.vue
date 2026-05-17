<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="selection-config-form" :class="isCurrent ? 'current-selection' : ''">
    <v-dialog v-model="showConfirmDialog" persistent width="700px">
      <v-card class="change-dialog">
        <v-card-title class="headline">
          {{ $t('global.notification', languageCode) }}
        </v-card-title>

        <v-card-text>
          <div class="mb-4">{{ $t('SelectionConfigForm.your_last_change', languageCode) }}</div>

          <!-- Changes grouped by source parameter -->
          <div class="changes-container">
            <div v-for="(group, sourceParam) in groupedChanges" :key="sourceParam" class="change-group">
              <div class="change-group-title">{{ sourceParam }}</div>

              <!-- Source parameter change -->
              <div v-if="group.sourceChange.oldValue !== group.sourceChange.newValue" class="change-row">
                <span class="old-value">{{ formatValue(group.sourceChange.oldValue) }}</span>
                <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                <span class="new-value">{{ formatValue(group.sourceChange.newValue) }}</span>
              </div>

              <!-- Affected parameter changes -->
              <div v-for="(affected, idx) in group.affectedChanges" :key="idx" class="affected-change">
                <div class="affected-label">Will update {{ affected.label }}:</div>
                <div class="change-row">
                  <span class="old-value">{{ formatValue(affected.oldValue) }}</span>
                  <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                  <span class="new-value">{{ formatValue(affected.newValue) }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="cancelChange">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="success" @click="confirmChange" :class="{ 'active-confirm-button': isDialogKeyboardReady }">
            {{ $t('global.okay', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--
    <v-dialog v-model="showConfirmDialog" persistent width="40%">
      <v-card>
        <v-card-title class="headline">
          {{ $t('global.notification', languageCode) }}
        </v-card-title>
        <v-card-text>
          <div>{{ $t('SelectionConfigForm.your_last_change', languageCode) }}</div>
          <div v-if="vendorStylePreference === 'philips'">
          <div class="mt-2" v-if="changeFromOldValue !== changeFromNewValue">
              {{ `Packages ${changeFromOldValue}->${changeFromNewValue}` }}
            </div>
          </div>
          <div v-else>
            <div class="mt-2" v-if="changeFromOldValue !== changeFromNewValue">
              {{ `${changeFromLabel} ${changeFromOldValue}->${changeFromNewValue}` }}
            </div>
          </div>
          <div class="mt-2">
            {{ $t('SelectionConfigForm.adapt_parameters', languageCode) }}
          </div>
          <div class="mt-2" v-if="changeToOldValue !== changeToNewValue">
            {{ `${changeToLabel} ${changeToOldValue}->${changeToNewValue}` }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="cancelChange">{{ $t('global.cancel', languageCode) }}</v-btn>
          <v-btn color="success" @click="confirmChange">{{ $t('global.okay', languageCode) }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    -->
    <template v-if="displayMode == SELECTION_CONFIG_DISPLAY_MODE.DEFAULT">
      <v-tabs v-model="currentActiveTab" :show-arrows="false">
        <header :class="`flex align-center ${isForCT ? '' : 'justify-content-between py-2'}`">
          <div v-if="isUltraLab">
            <v-select
              v-if="isUltraLab"
              @change="changeVendorStylePreference"
              v-model="vendorStylePreference"
              :items="vendorStylePreferenceOptions"
              outlined
              dense
              hide-details
            ></v-select>
          </div>
          <v-tab v-if="isSelectionMin">{{ $t('global.min_configuration') }}</v-tab>
          <v-tab v-else-if="isSelectionMax">{{ $t('global.max_configuration') }}</v-tab>
          <v-tab v-else-if="isAddLocalizerMode">{{ $t('global.localizer_configuration') }}</v-tab>
          <h4 v-else-if="isUltraLab && !isTakingTest" class="tab-1 d-none">
            <v-tab>{{ $t('global.parameters') }}</v-tab>
          </h4>
          <h4 v-else-if="!isUltraLab || (isUltraLab && isTakingTest)" class="tab-1">
            <v-tab v-if="questionSet && !isEditingQuestion">{{ $t('global.question_criteria') }}</v-tab>
            <v-tab @click="questionTabOpen" :class="isSelectedTab && !isEditingQuestion && questionSet ? 'blink' : ''">
              <span :class="isSelectedTab && !isEditingQuestion && questionSet ? 'blink-text' : ''">{{
                $t('global.parameters')
              }}</span>
            </v-tab>
            <v-tab v-if="false">{{ $t('global.hotkey_guide') }}</v-tab>
          </h4>
          <v-btn-toggle
            v-model="fieldStrengthPreference"
            :class="`contrast-lab-buttons ${hideTabHeaderParams ? 'hidden' : ''}`"
            v-if="!isAddLocalizerMode && isContrastLab && !isUltraLab"
            group
            dense
            mandatory
          >
            <v-btn
              :title="$t('SelectionConfigForm.field_strength')"
              outlined
              v-for="fieldStrength in availableFieldStrengths"
              :key="fieldStrength"
              :value="fieldStrength"
            >
              <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
              {{ fieldStrength }} T
            </v-btn>
          </v-btn-toggle>
          <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
            <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
              <v-btn-toggle
                v-model="fieldStrengthPreference"
                :class="`contrast-lab-buttons ${hideTabHeaderParams ? 'hidden' : ''}`"
                v-if="isUltraLab"
                group
                dense
              >
                <v-btn
                  :title="$t('SelectionConfigForm.field_strength')"
                  outlined
                  v-for="fieldStrength in availableFieldStrengths"
                  :key="fieldStrength"
                  :value="fieldStrength"
                  class="m-0"
                >
                  <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                  {{ fieldStrength }} T
                </v-btn>
              </v-btn-toggle>
            </div>
          </div>
          <div v-if="isUltraLab" :class="`${hideTabHeaderParams ? 'hidden' : ''}`"><AlarmIcon />{{ scanTime }}</div>
          <v-tooltip v-if="isResolutionLab || isUltraLab" top>
            <template #activator="{ on, attrs }">
              <p
                class="resolution-label"
                v-bind="attrs"
                v-on="on"
                v-if="isResolutionLab"
                :class="`${hideTabHeaderParams ? 'hidden' : ''}`"
              >
                {{ trueResolutionHeader }}
              </p>
              <p
                class="resolution-label"
                v-bind="attrs"
                v-on="on"
                v-if="isUltraLab"
                :class="`${hideTabHeaderParams ? 'hidden' : ''}`"
              >
                <CubeOutlineIcon />{{ trueResolutionHeaderUltra }}
              </p>
            </template>
            <p class="resolution-tooltip">{{ $t('SelectionConfigForm.reconstructed-resolution') }}</p>
            <p class="resolution-tooltip">{{ acquiredResolutionHeader }}</p>
          </v-tooltip>
          <span v-if="isEditingQuestion && !isAddLocalizerMode && !isSelectionMin && !isSelectionMax">
            <span class="mx-2 clickable" @click="copyCurMinSelectionConfigIntoProposed(false)">
              <ArrowRightIcon :title="$t('global.set_from_min')" />
            </span>
            <span class="clickable" @click="copyCurMinSelectionConfigIntoProposed(true)">
              <ArrowRightBoldIcon :title="$t('global.set_from_min_all')" />
            </span>
          </span>
          <div v-if="isUltraLab && !isTakingTest">
            <b-form-input
              :type="'text'"
              :value="snrDifference !== null ? snrDifference.toFixed(2) : '---'"
              disabled
              class="input-number"
              style="width: 50px"
            />
          </div>
          <div
            :class="`contrast-lab-buttons ${hideTabHeaderParams ? 'hidden' : ''}`"
            v-if="!isAddLocalizerMode && isContrastLab && !isUltraLab"
          >
            <v-btn
              tile
              outlined
              v-for="sequenceType in availableSequenceTypes"
              :key="sequenceType"
              :class="{
                'no-transform bold mr-5 cl-button': true,
                active: selectionConfig.sequenceType === sequenceType,
              }"
              @click="submitActualSequenceType(sequenceType)"
              color="buttonBlue"
            >
              {{ sequenceType }}
            </v-btn>
          </div>
          <div :class="`contrast-lab-buttons ${hideTabHeaderParams ? 'hidden' : ''}`" v-else-if="isUltraLab">
            <v-btn tile outlined class="no-transform bold mr-5" color="buttonBlue" disabled>
              {{ sequenceTypeLabel }}
            </v-btn>
          </div>
          <div
            v-if="
              isForCT &&
              (isEditingQuestion ||
                (isUltraLab && !isTakingTest && currentActiveTab == 0) ||
                ((!isUltraLab || (isUltraLab && isTakingTest)) && currentActiveTab == 1)) &&
              (isAcquisitionQuestion || isLocalizerQuestion || isCardiacAcquisitionQuestion) &&
              (!isEditingQuestion || (isEditingQuestion && (isSelectionMin || isSelectionMax || isIdentTypeProposed)))
            "
            class="config-tabs-header-suffix-container"
          >
            <div
              class="slice-scan-delay-form"
              v-if="(isAcquisitionQuestion || isCardiacAcquisitionQuestion) && !isEditingQuestion"
            >
              <label class="label-with-unit">{{ $t('global.scan_delay') }}</label>
              <SpinButtonWithInput
                v-model.number="displayScanDelayTime"
                :step="1"
                :min="0"
                :max="1000"
                :disabled="complete || isDisabledParameter"
                @input="onInputScanDelay"
              />
            </div>
            <v-select
              :key="selectedStackQuestionIndex"
              outlined
              dense
              hide-details
              :disabled="(complete || isDisabledBreathingHold) && !isEditingQuestion"
              v-model="breathingInstruction"
              :items="breathingInstructionItems"
              item-text="text"
              item-value="value"
              :label="$t('global.breathing_instruction')"
              style="width: 145px"
              :class="{ 'breathing-instruction-glow': isLocalizerQuestion && !isEditingQuestion }"
            />
          </div>
          <div v-if="isForCT && (isReconstructionQuestion || !questionSet)" class="config-tabs-header-suffix-container">
            <v-menu>
              <template #activator="{ on }">
                <v-btn tile outlined class="no-transform bold" color="buttonBlue" v-on="on">
                  <span>{{ $t('global.orientation', languageCode) }}</span>
                  <v-icon small>keyboard_arrow_down</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="resetSelection({ index: 0, dirOnly: true })">
                  <v-list-item-title>{{ $t('global.axial', languageCode) }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="resetSelection({ index: 1, dirOnly: true })">
                  <v-list-item-title>{{ $t('global.coronal', languageCode) }}</v-list-item-title>
                </v-list-item>
                <v-list-item @click="resetSelection({ index: 2, dirOnly: true })">
                  <v-list-item-title>{{ $t('global.sagittal', languageCode) }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </header>

        <!-- This is the Question/Answer layout for non-CT lab test questions -->
        <v-tab-item
          v-if="
            questionSet && !isEditingQuestion && !isAddLocalizerMode && !isSelectionMin && !isSelectionMax && !isForCT
          "
          class="tab-1"
        >
          <v-row cols="12" align="center" justify="space-between" class="criteria_area">
            <v-card class="pt-3 pb-3 scan-view-options test-question-1 pa-5">
              <v-row align="center" justify="space-between" class="">
                <v-card-title class="flex justify-space-between align-center">
                  <h5 class="mb-0">
                    {{ $t('global.question', languageCode) }}
                    {{ selectedStackQuestionIndexVisual }}
                    {{ $t('global.of', languageCode) }}
                    {{ stackQuestionsLength }}
                  </h5>
                  <v-row justify="end" align="center" class="mr-2" v-if="stackQuestionsLength > 1">
                    <div class="mr-4 cycle-question-button" @click="selectPrevQuestion">
                      <img v-if="selectedStackQuestionIndexVisual <= 1" src="@/assets/svg/back-button-disabled.svg" />
                      <img v-else src="@/assets/svg/back-button.svg" />
                    </div>
                    <div class="cycle-question-button" @click="selectNextQuestion">
                      <img
                        v-if="selectedStackQuestionIndexVisual >= stackQuestionsLength"
                        src="@/assets/svg/forward-button-disabled.svg"
                      />
                      <img v-else src="@/assets/svg/forward-button.svg" />
                    </div>
                  </v-row>
                </v-card-title>
              </v-row>
              <v-card-text class="pt-4 pl-0 text-12-rem">
                <span v-if="stackQuestion.freebie" class="freebie">({{ $t('MRI.optional') }})</span>
                <TranslatedContent
                  type="stackQuestion"
                  :record="stackQuestion"
                  :lookup="{ type: 'nestedKey', path: 'questionText' }"
                />
              </v-card-text>
            </v-card>
            <v-card class="pt-3 pb-3 scan-view-options test-question-1 pa-5">
              <v-row align="center" justify="space-between">
                <v-card-title>
                  <h5 class="mb-0">{{ $t('global.answer_criteria') }}</h5>
                </v-card-title>
                <v-col class="flex">
                  <v-select
                    outlined
                    dense
                    hide-details
                    v-model="answerSelectionIdComputed"
                    :items="answersSelections"
                    :disabled="scanSubmitted"
                    :class="answerSelectionsHasUnseenChoice ? 'attention-outline' : ''"
                    @click="onLookedAtAnswerSelections()"
                  >
                    <template #item="{ item }">
                      <TranslatedContent
                        type="stackQuestion"
                        :record="stackQuestion"
                        :lookup="{
                          type: 'objectInArray',
                          arrayPath: 'answers',
                          identityKey: 'id',
                          identityValue: item.value,
                          objectKey: 'name',
                          defaultText: item.text,
                        }"
                      />
                    </template>
                    <template #selection="{ item }">
                      <TranslatedContent
                        type="stackQuestion"
                        :record="stackQuestion"
                        :lookup="{
                          type: 'objectInArray',
                          arrayPath: 'answers',
                          identityKey: 'id',
                          identityValue: item.value,
                          objectKey: 'name',
                          defaultText: item.text,
                        }"
                      />
                    </template>
                  </v-select>
                </v-col>
                <v-card-text class="pt-4 text-12-rem">
                  <v-row class="pt-0 truncated-field pa-4">
                    <TranslatedContent
                      type="stackQuestion"
                      v-if="!(isChallengeModeEnabledForMe || currentTestIsPreparedExam)"
                      :record="stackQuestion"
                      :lookup="{
                        type: 'objectInArray',
                        arrayPath: 'answers',
                        identityKey: 'id',
                        identityValue: answerCurrent.id,
                        objectKey: 'criteria',
                      }"
                    />
                  </v-row>
                  <v-row class="pt-0 pa-4" v-if="answerCurrent.citation && answerCurrent.citation.length > 0">
                    <strong class="mb-0">
                      <TranslatedContent
                        v-if="!(isChallengeModeEnabledForMe || currentTestIsPreparedExam)"
                        type="stackQuestion"
                        :record="stackQuestion"
                        :lookup="{
                          type: 'objectInArray',
                          arrayPath: 'answers',
                          identityKey: 'id',
                          identityValue: answerCurrent.id,
                          objectKey: 'citation',
                        }"
                      />
                    </strong>
                  </v-row>
                </v-card-text>
              </v-row>
            </v-card>
          </v-row>
        </v-tab-item>

        <!-- This is the Question/Answer layout for CT test questions -->
        <v-tab-item
          v-if="
            questionSet && !isEditingQuestion && !isAddLocalizerMode && !isSelectionMin && !isSelectionMax && isForCT
          "
          class="tab-1"
        >
          <template v-if="!isLocalizerQuestion">
            <v-row cols="12" align="center" justify="space-between" class="criteria_area">
              <v-card class="col-12">
                <v-row align="center" justify="space-between" class="">
                  <v-card-title class="flex justify-space-between align-center">
                    <h5 class="mb-0">
                      {{ $t('global.question', languageCode) }}
                      {{ selectedStackQuestionIndex + 1 }}
                      {{ $t('global.of', languageCode) }}
                      {{ stackQuestionsLength + 1 }}
                    </h5>
                  </v-card-title>
                </v-row>
                <v-card-text class="pt-0 pl-0 text-12-rem" :class="{ 'text-left': isForCT }">
                  <span v-if="stackQuestion.freebie" class="freebie">({{ $t('MRI.optional') }})</span>
                  <TranslatedContent
                    type="stackQuestion"
                    :record="stackQuestion"
                    :lookup="{ type: 'nestedKey', path: 'questionText' }"
                  />
                </v-card-text>
              </v-card>
              <v-card class="col-12">
                <v-row align="center" justify="space-between">
                  <v-card-title>
                    <h5 class="mb-0">{{ $t('global.answer_criteria') }}</h5>
                  </v-card-title>
                  <v-col class="flex">
                    <v-select
                      outlined
                      dense
                      hide-details
                      v-model="answerSelectionIdComputed"
                      :items="answersSelections"
                      :disabled="scanSubmitted"
                      :class="answerSelectionsHasUnseenChoice ? 'attention-outline' : ''"
                      @click="onLookedAtAnswerSelections()"
                    >
                      <template #item="{ item }">
                        <TranslatedContent
                          type="stackQuestion"
                          :record="stackQuestion"
                          :lookup="{
                            type: 'objectInArray',
                            arrayPath: 'answers',
                            identityKey: 'id',
                            identityValue: item.value,
                            objectKey: 'name',
                            defaultText: item.text,
                          }"
                        />
                      </template>
                      <template #selection="{ item }">
                        <TranslatedContent
                          type="stackQuestion"
                          :record="stackQuestion"
                          :lookup="{
                            type: 'objectInArray',
                            arrayPath: 'answers',
                            identityKey: 'id',
                            identityValue: item.value,
                            objectKey: 'name',
                            defaultText: item.text,
                          }"
                        />
                      </template>
                    </v-select>
                  </v-col>
                  <v-card-text class="pt-4 text-12-rem">
                    <v-row class="pt-0 truncated-field pa-4" :class="{ 'text-left': isForCT }">
                      <TranslatedContent
                        type="stackQuestion"
                        v-if="!(isChallengeModeEnabledForMe || currentTestIsPreparedExam)"
                        :record="stackQuestion"
                        :lookup="{
                          type: 'objectInArray',
                          arrayPath: 'answers',
                          identityKey: 'id',
                          identityValue: answerCurrent.id,
                          objectKey: 'criteria',
                        }"
                      />
                    </v-row>
                    <v-row class="pt-0 pa-4" v-if="answerCurrent.citation && answerCurrent.citation.length > 0">
                      <strong class="mb-0">
                        <TranslatedContent
                          v-if="!(isChallengeModeEnabledForMe || currentTestIsPreparedExam)"
                          type="stackQuestion"
                          :record="stackQuestion"
                          :lookup="{
                            type: 'objectInArray',
                            arrayPath: 'answers',
                            identityKey: 'id',
                            identityValue: answerCurrent.id,
                            objectKey: 'citation',
                          }"
                        />
                      </strong>
                    </v-row>
                  </v-card-text>
                </v-row>
              </v-card>
            </v-row>
          </template>
          <template v-else>
            <v-row cols="12" align="center" justify="space-between" class="criteria_area">
              <v-card class="col-12">
                <v-card-text class="pa-4 text-12-rem" :class="{ 'text-left': isForCT }">
                  <TranslatedContent
                    type="stackQuestion"
                    :record="stackQuestion"
                    :lookup="{ type: 'nestedKey', path: 'questionText' }"
                  />
                </v-card-text>
              </v-card>
            </v-row>
          </template>
        </v-tab-item>

        <v-tab-item>
          <hr class="header-gradient-region" />
          <!-- CT specific input fields layout -->
          <div class="n-container" v-if="isForCT && isLocalizerQuestion && !isEditingQuestion">
            <!-- Foot-to-head/Head-to-foot -->
            <div class="n-col" v-if="isLocalizerQuestion">
              <div>
                <v-radio-group row v-model="ctScanDirection" :disabled="!isEditingQuestion">
                  <v-radio label="Head-to-foot" :value="1"></v-radio>
                  <v-radio label="Foot-to-head" :value="2"></v-radio>
                </v-radio-group>
              </div>
            </div>
          </div>
          <div class="n-container" v-if="isForCT && (!isLocalizerQuestion || isEditingQuestion)">
            <!-- REGION HELICAL MODE FOR ACQ -->
            <v-row v-if="isAcquisitionQuestion" class="m-0 p-0 w-100">
              <!-- Helical Mode -->
              <v-col cols="4" class="p-0">
                <div class="slice-form slice-form-ct">
                  <v-radio-group v-model="helicalMode" row :disabled="true" class="ct-radio-group">
                    <v-radio label="Helical" :value="true"></v-radio>
                    <v-radio label="Axial" :value="false"></v-radio>
                  </v-radio-group>
                </div>
              </v-col>
              <!-- Foot-to-head/Head-to-foot -->
              <v-col cols="4" class="p-0">
                <div class="slice-form slice-form-ct slice-form-ct-scan-direction">
                  <v-radio-group v-model="ctScanDirection" :disabled="isDisabledParameter" class="ct-radio-group">
                    <v-radio label="Head-to-foot" :value="1"></v-radio>
                    <v-radio label="Foot-to-head" :value="2"></v-radio>
                  </v-radio-group>
                </div>
              </v-col>
              <!-- Scan Duration -->
              <v-col cols="4" class="p-0">
                <div class="slice-form slice-form-ct">
                  <div class="label-with-unit">
                    <label>{{ `Scan Duration` }}</label>
                  </div>
                  <v-text-field :type="'text'" v-model="scanTimeCT" outlined dense rounded class="" disabled />
                </div>
              </v-col>
            </v-row>
            <!--END: REGION HELICAL MODE FOR ACQ -->

            <!-- REGION HELICAL MODE AND FOR CARDIAC ACQ -->
            <template v-if="isCardiacAcquisitionQuestion">
              <v-row class="m-0 p-0 mb-0 w-100">
                <!-- Helical Mode -->
                <v-col cols="6" class="p-0">
                  <v-row class="m-0 p-0">
                    <v-col cols="6" class="p-0">
                      <div class="slice-form slice-form-ct">
                        <v-radio-group v-model="helicalMode" col :disabled="true" class="ct-radio-group mt-0">
                          <v-radio label="Helical" :value="true"></v-radio>
                          <v-radio label="Axial" :value="false"></v-radio>
                        </v-radio-group>
                      </div>
                    </v-col>
                    <v-col cols="6" class="p-0">
                      <div class="slice-form slice-form-ct slice-form-ct-scan-direction">
                        <v-radio-group
                          v-model="ctScanDirection"
                          col
                          :disabled="isDisabledParameter"
                          class="ct-radio-group"
                        >
                          <v-radio label="H-to-F" :value="1"></v-radio>
                          <v-radio label="F-to-H" :value="2"></v-radio>
                        </v-radio-group>
                      </div>
                    </v-col>
                  </v-row>
                  <div>
                    <div class="slice-form slice-form-ct">
                      <div class="label-with-unit">
                        <label>{{ $t('SelectionConfigForm.acquisition_type') }}</label>
                      </div>
                      <v-select
                        class="ct-select"
                        :items="acquisitionTypes"
                        v-model="cardiacAcquisitionType"
                        :disabled="isDisabledParameter"
                      ></v-select>
                    </div>
                  </div>
                  <div>
                    <div class="slice-form slice-form-ct d-flex flex-row align-items-center gap-2">
                      <div class="label-with-unit">
                        <label>{{ $t('SelectionConfigForm.r_wave_delay') }}</label>
                      </div>
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          :type="'number'"
                          v-model.number="rWaveDelay"
                          :step="1"
                          :min="0"
                          :max="100"
                          :disabled="complete || isDisabledParameter"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div class="slice-form slice-form-ct d-flex flex-row align-items-center gap-2">
                      <div class="label-with-unit">
                        <label>{{ $t('SelectionConfigForm.ignore_beats') }}</label>
                      </div>
                      <div>
                        <v-checkbox
                          v-model="ignoreBadBeats"
                          :disabled="complete || isDisabledParameter"
                          class="mt-0 ct-checkbox"
                        />
                      </div>
                    </div>
                  </div>
                  <div v-if="ignoreBadBeats">
                    <div class="slice-form slice-form-ct d-flex flex-row align-items-center gap-1 mt-1">
                      <div class="label-with-unit">
                        <label>{{ `+/-` }}</label>
                      </div>
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          :type="'number'"
                          v-model.number="badBeatsTolerance"
                          :step="1"
                          :min="0"
                          :max="100"
                          :disabled="complete || isDisabledParameter"
                        />
                      </div>
                      <div class="label-with-unit">
                        <label>{{ `bpm` }}</label>
                      </div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="6" class="p-0">
                  <SelectionConfigECGChart :selection-ident="selectionIdent" />
                </v-col>
              </v-row>
              <div class="container row row-cols-4 mt-0 py-1">
                <div :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`">
                  <div class="slice-form slice-form-ct">
                    <div class="label-with-unit">
                      <label>{{ $t('SelectionConfigForm.window') }}</label>
                      <UnitCaption class="pl-1" unit=""></UnitCaption>
                    </div>
                    <v-combobox
                      v-model="windowLevelWidth"
                      :items="windowLevelWidths"
                      hide-details
                      :disabled="isDisabledParameter"
                    ></v-combobox>
                  </div>
                </div>
                <div :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`" v-if="!isAddLocalizerMode">
                  <div class="slice-form slice-form-ct">
                    <div class="label-with-unit">
                      <label
                        >{{ $t('global.slice_thickness_mm') }}
                        <UnitCaption unit="(mm)" />
                      </label>
                    </div>
                    <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                      <SpinButtonWithInput
                        @input="submitThickness"
                        :type="'number'"
                        v-model.number="thickness"
                        :step="0.5"
                        :min="0"
                        :max="60"
                        :disabled="complete || isDisabledParameter"
                      />
                    </div>
                    <div class="font-weight-normal text-muted text-left">Min: 0 | Max: 60</div>
                  </div>
                </div>
                <div
                  :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`"
                  v-if="!isAddLocalizerMode && !isCardiacAcquisitionQuestion"
                >
                  <div class="slice-form slice-form-ct">
                    <div class="label-with-unit">
                      <label>{{ `Scan Duration` }}</label>
                    </div>
                    <v-text-field :type="'text'" v-model="scanTimeCT" outlined dense rounded class="mt-1" disabled />
                  </div>
                </div>
                <div :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`">
                  <div class="slice-form slice-form-ct">
                    <label>mAs</label>
                    <b-form-input class="adj-input" value="Auto" :disabled="isDisabledParameter" />
                  </div>
                </div>
                <div :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`">
                  <div class="slice-form slice-form-ct">
                    <label>KVP</label>
                    <v-select
                      :items="[80, 100, 120, 140]"
                      v-model="kvpValue"
                      :disabled="isDisabledParameter"
                    ></v-select>
                  </div>
                </div>
                <div :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`">
                  <div class="slice-form slice-form-ct">
                    <div class="label-with-unit">
                      <label>{{ $t('SelectionConfigForm.kernels') }}</label>
                      <UnitCaption class="pl-1" unit=""></UnitCaption>
                    </div>
                    <v-select :items="kernels" v-model="kernel" :disabled="isDisabledParameter"></v-select>
                  </div>
                </div>
                <div :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`">
                  <div class="slice-form slice-form-ct">
                    <div class="label-with-unit">
                      <label>{{ $t('SelectionConfigForm.rotation_time') }}</label>
                    </div>
                    <v-select
                      :items="[0.33, 0.5, 1.0, 1.5]"
                      v-model.number="rotationTime"
                      :disabled="isDisabledParameter"
                    ></v-select>
                  </div>
                </div>
                <div :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`">
                  <div class="slice-form slice-form-ct">
                    <label>Pitch</label>
                    <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                      <PitchSpinButtonWithInput
                        :type="'number'"
                        v-model="pitch"
                        :step="0.5"
                        :min="0.3"
                        :max="1.5"
                        :disabled="complete || isDisabledParameter"
                      />
                    </div>
                  </div>
                </div>
                <div :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`">
                  <div class="slice-form slice-form-ct">
                    <div class="label-with-unit">
                      <label>Beam Width</label>
                    </div>
                    <v-select
                      v-model="beamSelected"
                      :items="beamSelectItems"
                      :hint="`${beamSelected.dim}`"
                      item-title="text"
                      item-value="value"
                      persistent-hint
                      return-object
                      :disabled="isDisabledParameter"
                    ></v-select>
                  </div>
                </div>
                <div :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`" v-if="!isAddLocalizerMode">
                  <div class="slice-form slice-form-ct">
                    <div class="label-with-unit">
                      <label>FoV</label>
                    </div>
                    <b-form-input
                      @change="submitDimensions3y"
                      :type="'number'"
                      v-model.number="dimensions3y"
                      :disabled="complete || isDisabledParameter"
                    />
                  </div>
                </div>
                <div :class="`col ${isCardiacAcquisitionQuestion && 'cardiac-form-field'}`">
                  <div class="slice-form slice-form-ct">
                    <div class="label-with-unit">
                      <label>Scan Length</label>
                      <UnitCaption unit="(mm)" />
                    </div>
                    <v-text-field
                      class="adj-input"
                      :type="'number'"
                      :value="scanLength"
                      disabled
                      outlined
                      rounded
                      dense
                    />
                  </div>
                </div>
              </div>
            </template>
            <!-- END: REGION HELICAL MODE FOR CARDIAC ACQ -->

            <!-- REGION FIELDS FOR ANOTHER TYPE -->
            <template v-else>
              <!-- Slice Thickness -->
              <div class="n-col" v-if="!isAddLocalizerMode">
                <div class="slice-form slice-form-ct">
                  <div class="label-with-unit">
                    <label
                      >{{ $t('global.slice_thickness_mm') }}
                      <UnitCaption unit="(mm)" />
                    </label>
                  </div>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                    <SpinButtonWithInput
                      @input="submitThickness"
                      :type="'number'"
                      v-model.number="thickness"
                      :step="0.5"
                      :min="0"
                      :max="60"
                      :disabled="complete || isDisabledParameter"
                    />
                  </div>
                  <div class="font-weight-normal text-muted text-left">Min: 0 | Max: 60</div>
                </div>
              </div>
              <!-- Slice Gap -->
              <div
                class="n-col"
                v-if="(!isSingleSliceMode || isAddLocalizerMode || spacing < 0) && !isAcquisitionQuestion"
              >
                <div class="slice-form slice-form-ct">
                  <div class="label-with-unit">
                    <label>{{ isForCT ? $t('global.slice_interval') : $t('global.slice_gap') }}</label>
                    <UnitCaption unit="(mm)" />
                  </div>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                    <SpinButtonWithInput
                      @input="submitSpacing"
                      v-model.number="spacing"
                      :step="isForCT ? 0.5 : 0.1"
                      :min="0"
                      :max="200"
                      :disabled="complete || isDisabledParameter"
                    />
                    <p-radio
                      class="p-svg p-plain p-smooth"
                      value="spacing"
                      v-model="heightChangeTarget"
                      name="heightChangeTarget"
                      toggle
                      v-if="!isAddLocalizerMode && !isForCT"
                    >
                      <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                      <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                      <label slot="off-label"></label>
                    </p-radio>
                  </div>
                  <div class="font-weight-normal text-muted text-center">Min: 0 | Max: 200</div>
                </div>
              </div>
              <!-- mA -->
              <div class="n-col" v-if="isAcquisitionQuestion">
                <div class="slice-form slice-form-ct">
                  <label>mA</label>
                  <div class="input-lock">
                    <SpinButtonWithInput
                      @input="submitTubeCurrent"
                      :type="'number'"
                      v-model.number="tubeCurrent"
                      :step="10"
                      :min="10"
                      :max="800"
                      :disabled="complete || isDisabledParameter"
                    />
                  </div>
                </div>
              </div>
              <!-- KVP -->
              <div class="n-col" v-if="isAcquisitionQuestion">
                <div class="slice-form slice-form-ct">
                  <label>KVP</label>
                  <v-select :items="[80, 100, 120, 140]" v-model="kvpValue" :disabled="isDisabledParameter"></v-select>
                </div>
              </div>
              <!-- Window -->
              <div class="n-col" v-if="isAcquisitionQuestion">
                <div class="slice-form slice-form-ct">
                  <div class="label-with-unit">
                    <label>{{ $t('SelectionConfigForm.window') }}</label>
                    <UnitCaption class="pl-1" unit=""></UnitCaption>
                  </div>
                  <v-combobox
                    v-model="windowLevelWidth"
                    :items="windowLevelWidths"
                    hide-details
                    :disabled="isDisabledParameter"
                  ></v-combobox>
                </div>
              </div>
              <!-- Kernels -->
              <div class="n-col" v-if="!isAcquisitionQuestion">
                <div class="slice-form slice-form-ct">
                  <div class="label-with-unit">
                    <label>{{ $t('SelectionConfigForm.kernels') }}</label>
                    <UnitCaption class="pl-1" unit=""></UnitCaption>
                  </div>
                  <v-select :items="kernels" v-model="kernel" :disabled="isDisabledParameter"></v-select>
                </div>
              </div>
              <!-- Rotation Time -->
              <div class="n-col" v-if="isAcquisitionQuestion">
                <div class="slice-form slice-form-ct">
                  <div class="label-with-unit">
                    <label>{{ $t('SelectionConfigForm.rotation_time') }}</label>
                  </div>
                  <v-select
                    :items="[0.33, 0.5, 1.0, 1.5]"
                    v-model.number="rotationTime"
                    :disabled="isDisabledParameter"
                  ></v-select>
                </div>
              </div>
              <!-- pitch -->
              <div class="n-col" v-if="isAcquisitionQuestion">
                <div class="slice-form slice-form-ct">
                  <label>Pitch</label>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                    <PitchSpinButtonWithInput
                      :type="'number'"
                      v-model="pitch"
                      :step="0.5"
                      :min="0.3"
                      :max="1.5"
                      :disabled="complete || isDisabledParameter"
                    />
                  </div>
                </div>
              </div>
              <!-- Kernels -->
              <div class="n-col" v-if="isAcquisitionQuestion">
                <div class="slice-form slice-form-ct">
                  <div class="label-with-unit">
                    <label>{{ $t('SelectionConfigForm.kernels') }}</label>
                    <UnitCaption class="pl-1" unit=""></UnitCaption>
                  </div>
                  <v-select :items="kernels" v-model="kernel" :disabled="isDisabledParameter"></v-select>
                </div>
              </div>
              <!-- Window -->
              <div class="n-col" v-if="!isAcquisitionQuestion">
                <div class="slice-form slice-form-ct">
                  <div class="label-with-unit">
                    <label>{{ $t('SelectionConfigForm.window') }}</label>
                    <UnitCaption class="pl-1" unit=""></UnitCaption>
                  </div>
                  <v-combobox
                    v-model="windowLevelWidth"
                    :items="windowLevelWidths"
                    hide-details
                    :disabled="isDisabledParameter"
                  ></v-combobox>
                </div>
              </div>
              <!-- Beam Width --->
              <div class="n-col" v-if="isAcquisitionQuestion">
                <div class="slice-form slice-form-ct">
                  <div class="label-with-unit">
                    <label>Beam Width</label>
                  </div>
                  <v-select
                    class="w-50"
                    v-model="beamSelected"
                    :items="beamSelectItems"
                    :hint="`${beamSelected.dim}`"
                    item-title="text"
                    item-value="value"
                    persistent-hint
                    return-object
                    :disabled="isDisabledParameter"
                  ></v-select>
                </div>
              </div>
              <!-- Show FOV x FOV when recon question or playground -->
              <template v-if="!isAddLocalizerMode && (isReconstructionQuestion || !questionSet)">
                <div :class="{ 'n-col': isEditingQuestion, 'n-2col': !isEditingQuestion }">
                  <div class="group-fields-container">
                    <div class="field-container">
                      <!-- FOV -->
                      <div class="slice-form slice-form-ct pr-0">
                        <div class="label-with-unit">
                          <label>FoV</label>
                        </div>
                        <b-form-input
                          class="outline-red"
                          @change="submitDimensions3y"
                          :type="'number'"
                          v-model.number="dimensions3y"
                          :disabled="complete || isDisabledParameter"
                        />
                      </div>
                    </div>
                    <label class="text-x">X</label>
                    <div class="field-container">
                      <div style="margin-top: 22px"></div>
                      <!-- Phase FOV -->
                      <div class="slice-form slice-form-ct pl-0">
                        <b-form-input
                          class="outline-blue"
                          @change="submitDimensions3x"
                          :type="'number'"
                          v-model.number="dimensions3x"
                          :disabled="complete || isDisabledParameter"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Number of Slices -->
                <div class="n-col">
                  <div class="slice-form slice-form-ct">
                    <div v-if="!isSingleSliceMode && !isAddLocalizerMode">
                      <label>Images</label>
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          class="outline-yellow"
                          @input="submitNumberOfSlices"
                          :type="'number'"
                          v-model.number="numberOfSlices"
                          :step="1"
                          :min="1"
                          :max="300"
                          :disabled="complete || isDisabledParameter"
                        />
                        <p-radio
                          class="p-svg p-plain p-smooth"
                          value="numberOfSlices"
                          v-model="heightChangeTarget"
                          name="heightChangeTarget"
                          toggle
                          v-if="!isForCT"
                        >
                          <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                          <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                          <label slot="off-label"></label>
                        </p-radio>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <!-- Number of Slices -->
                <div class="n-col">
                  <div class="slice-form slice-form-ct">
                    <div v-if="!isSingleSliceMode && !isAddLocalizerMode">
                      <label>Images</label>
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          @input="submitNumberOfSlices"
                          :type="'number'"
                          v-model.number="numberOfSlices"
                          :step="1"
                          :min="1"
                          :max="300"
                          :disabled="complete || isDisabledParameter"
                        />
                        <p-radio
                          class="p-svg p-plain p-smooth"
                          value="numberOfSlices"
                          v-model="heightChangeTarget"
                          name="heightChangeTarget"
                          toggle
                          v-if="!isForCT"
                        >
                          <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                          <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                          <label slot="off-label"></label>
                        </p-radio>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- FOV -->
                <div class="n-col" v-if="!isAddLocalizerMode">
                  <div class="slice-form slice-form-ct">
                    <div class="label-with-unit">
                      <label>FoV</label>
                    </div>
                    <b-form-input
                      @change="submitDimensions3y"
                      :type="'number'"
                      v-model.number="dimensions3y"
                      :disabled="complete || isDisabledParameter"
                    />
                  </div>
                </div>
              </template>
              <!-- Scan Length -->
              <div class="n-col" v-if="isAcquisitionQuestion">
                <div class="slice-form slice-form-ct">
                  <div class="label-with-unit">
                    <label>Scan Length</label>
                    <UnitCaption unit="(mm)" />
                  </div>
                  <v-text-field
                    class="adj-input"
                    :type="'number'"
                    :value="scanLength"
                    disabled
                    outlined
                    rounded
                    dense
                  />
                </div>
              </div>
              <div class="ctdi-dlp-container n-col" v-if="isAcquisitionQuestion">
                <div>{{ $t('global.CTDI') }}: {{ CTDI }} {{ `mGy` }}</div>
                <div>{{ $t('global.DLP') }}: {{ DLP }} {{ `mGy-cm` }}</div>
              </div>
            </template>
            <!-- END: REGION FIELDS FOR ANOTHER TYPE -->
          </div>
          <!-- CT input fields -->

          <!-- MR Classic input fields layout -->
          <div class="form-container" v-if="!isForCT && !isUltraLab">
            <v-row>
              <!-- height -->
              <div
                v-if="isSingleSliceMode && !isIdentTypeProposed && !isAcquisitionQuestion && !isReconstructionQuestion"
                class="slice-form"
              >
                <div class="label-with-unit">
                  <label>{{ $t('global.height') }}</label>
                  <UnitCaption unit="(mm)" />
                </div>
                <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                  <b-form-input
                    :type="'number'"
                    v-model.number="dimensions3zHalf"
                    :disabled="complete || isDisabledParameter"
                  />
                </div>
              </div>
              <!-- Number of Slices -->
              <div class="slice-form" v-if="!isReconstructionQuestion">
                <div v-if="!isSingleSliceMode && !isAddLocalizerMode">
                  <label>{{ $t('global.number_of_slices') }}</label>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                    <SpinButtonWithInput
                      @input="submitNumberOfSlices"
                      :type="'number'"
                      v-model.number="numberOfSlices"
                      :step="1"
                      :min="1"
                      :max="300"
                      :disabled="complete || isDisabledParameter"
                    />
                    <p-radio
                      class="p-svg p-plain p-smooth"
                      value="numberOfSlices"
                      v-model="heightChangeTarget"
                      name="heightChangeTarget"
                      toggle
                    >
                      <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                      <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                      <label slot="off-label"></label>
                    </p-radio>
                  </div>
                  <div class="font-weight-normal text-muted text-center">Min: 1 | Max: 300</div>
                </div>
              </div>

              <!-- Slice Thickness -->
              <div v-if="!isAddLocalizerMode" class="slice-form">
                <div class="label-with-unit">
                  <label>{{ $t('global.slice_thickness_mm') }}</label>
                  <UnitCaption unit="(mm)" />
                </div>
                <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                  <SpinButtonWithInput
                    @input="submitThickness"
                    :type="'number'"
                    v-model.number="thickness"
                    :step="0.5"
                    :min="0"
                    :max="60"
                    :disabled="complete || isDisabledParameter"
                  />
                  <p-radio
                    v-if="!isSingleSliceMode && !isForCT"
                    class="p-svg p-plain p-smooth"
                    value="thickness"
                    v-model="heightChangeTarget"
                    name="heightChangeTarget"
                    toggle
                  >
                    <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                    <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                    <label slot="off-label"></label>
                  </p-radio>
                </div>
                <div class="font-weight-normal text-muted text-center">Min: 0 | Max: 60</div>
              </div>

              <!-- Slice Gap -->
              <!-- For SingleSlice, gap between slices makes no sense (there is just one); but if you're Adding a Localizer, you're adding multiple slices again -->
              <div
                v-if="
                  (!isSingleSliceMode || isAddLocalizerMode || spacing < 0) &&
                  !isAcquisitionQuestion &&
                  !isReconstructionQuestion
                "
                class="slice-form"
              >
                <div class="label-with-unit">
                  <label>{{
                    isForCT
                      ? $t('global.slice_interval')
                      : labels.gap[vendorStylePreference.trim()] || $t('global.slice_gap')
                  }}</label>
                  <UnitCaption
                    unit="(%)"
                    v-if="
                      (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') && !isAddLocalizerMode
                    "
                  />
                  <UnitCaption unit="(mm)" v-else />
                </div>
                <div :class="isCurrent ? 'input-lock' : 'min-max-lock'" :id="'tooltip-spacing' + selectionIdent">
                  <SpinButtonWithInput
                    :step="
                      (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') && !isAddLocalizerMode
                        ? 1
                        : 0.1
                    "
                    :min="0"
                    :max="
                      (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') && !isAddLocalizerMode
                        ? 100
                        : 50
                    "
                    v-model.number="spacing"
                    @input="submitSpacing"
                    :disabled="complete"
                    :allow-decimal="
                      (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') && !isAddLocalizerMode
                        ? false
                        : true
                    "
                  />
                  <p-radio
                    class="p-svg p-plain p-smooth"
                    value="spacing"
                    v-model="heightChangeTarget"
                    name="heightChangeTarget"
                    toggle
                    v-if="!isAddLocalizerMode && !isForCT"
                  >
                    <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                    <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                    <label slot="off-label"></label>
                  </p-radio>
                </div>
                <b-tooltip
                  :target="'tooltip-spacing' + selectionIdent"
                  triggers="hover"
                  :disabled="!(vendorStylePreference === 'siemens' || vendorStylePreference === 'united')"
                >
                  {{ spacingTooltip + ' mm' }}
                </b-tooltip>
                <div class="font-weight-normal text-muted text-center">
                  Min: 0 | Max:
                  {{
                    (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') && !isAddLocalizerMode
                      ? 100
                      : 50
                  }}
                </div>
              </div>

              <!-- Frequency FoV and Phase FoV-->
              <div class="slice-form" v-if="!isAddLocalizerMode && !isAcquisitionQuestion && !isReconstructionQuestion">
                <div class="label-with-unit">
                  <label>{{ labels.frequencyFovLabel[vendorStylePreference] }}</label>
                  <UnitCaption unit="(cm)" v-if="['ge', 'canon'].includes(vendorStylePreference)" />
                  <UnitCaption unit="(mm)" v-else />
                </div>
                <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                  <SpinButtonWithInput
                    @input="submitDimensions3y"
                    :type="'number'"
                    v-model.number="dimensions3y"
                    :step="1"
                    :min="1"
                    :max="['ge', 'canon'].includes(vendorStylePreference) ? 50 : 500"
                    :disabled="complete || isDisabledParameter"
                  />
                </div>
              </div>

              <div class="slice-form" v-if="!isAddLocalizerMode && !isAcquisitionQuestion && !isReconstructionQuestion">
                <div class="label-with-unit">
                  <label>{{ labels.phaseFovLabel[vendorStylePreference] }}</label>
                  <UnitCaption
                    unit="(%)"
                    v-if="vendorStylePreference === 'siemens' || vendorStylePreference === 'philips'"
                  />
                  <UnitCaption unit="(cm)" v-if="['ge', 'canon'].includes(vendorStylePreference)" />
                  <UnitCaption unit="(mm)" v-if="['ge', 'canon', 'siemens', 'philips'].indexOf(vendorStylePreference) < 0" />
                </div>
                <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                  <SpinButtonWithInput
                    @input="submitDimensions3x"
                    :type="'number'"
                    v-model.number="dimensions3x"
                    :step="1"
                    :min="1"
                    :max="500"
                    :id="'dimensions3x_tooltip' + selectionIdent"
                    :disabled="complete || isDisabledParameter"
                  />
                </div>
                <b-tooltip
                  :target="'dimensions3x_tooltip' + selectionIdent"
                  triggers="hover"
                  :disabled="['ge', 'siemens', 'philips', 'united'].indexOf(vendorStylePreference) < 0"
                >
                  {{ dimensions3xTooltip }}</b-tooltip
                >
              </div>

              <!-- Frequency Matrix -->
              <div class="slice-form" v-if="!isAddLocalizerMode && isResolutionLab">
                <label>{{ labels.frequencyMatrixLabel[vendorStylePreference] }}</label>
                <div class="input-lock">
                  <SpinButtonWithInput
                    :step="32"
                    :min="64"
                    :max="512"
                    :value="frequencyMatrix"
                    @input="changeSpin($event, 'frequencyMatrix')"
                    :disabled="complete || isDisabledParameter || vendorStylePreference === 'philips'"
                  />
                </div>
              </div>

              <div class="slice-form" v-if="!isAddLocalizerMode && isResolutionLab">
                <label>{{ labels.phaseMatrixLabel[vendorStylePreference] + (vendorStylePreference === 'siemens' ? ' (%)' : '') }}</label>
                <div :id="'phase_tooltip' + selectionIdent">
                  <div class="input-lock" v-if="vendorStylePreference !== 'siemens'">
                    <SpinButtonWithInput
                      :step="stepForPhaseMatrix"
                      :min="minPhaseMatrix"
                      :max="maxPhaseMatrix"
                      :value="phaseMatrix"
                      @input="changeSpin($event, 'phaseMatrix')"
                      :disabled="complete || isDisabledParameter || vendorStylePreference === 'philips'"
                    />
                  </div>
                  <b-form-input
                    :type="'number'"
                    :value="phaseMatrix"
                    :step="stepForPhaseMatrix"
                    :min="minPhaseMatrix"
                    :max="maxPhaseMatrix"
                    :disabled="complete || isDisabledParameter"
                    @keyup.enter="(evt) => pressEnterKey(evt, 'phaseMatrix')"
                    @blur="(evt) => pressEnterKey(evt, 'phaseMatrix')"
                    v-if="vendorStylePreference === 'siemens'"
                    class="input-number"
                  />
                </div>
                <b-tooltip :target="'phase_tooltip' + selectionIdent" triggers="hover">
                  {{ phaseMatrixTooltip }}</b-tooltip
                >
              </div>

              <div v-if="vendorStylePreference === 'philips' && !isAddLocalizerMode && isResolutionLab">
                <div class="slice-form">
                  <label>{{ $t('global.frequency_voxel') }}</label>
                  <div class="input-lock">
                    <SpinButtonWithInput
                      :type="'number'"
                      :max="100"
                      :step="0.01"
                      :value="frequencyVoxelSize"
                      @input="changeFrequencyVoxelSize($event)"
                    />
                  </div>
                </div>
              </div>
              <div v-if="vendorStylePreference === 'philips' && !isAddLocalizerMode && isResolutionLab">
                <div class="slice-form">
                  <label>{{ $t('global.phase_voxel') }}</label>
                  <div class="input-lock">
                    <SpinButtonWithInput
                      :type="'number'"
                      :max="100"
                      :step="0.01"
                      :value="phaseVoxelSize"
                      @input="changePhaseVoxelSize($event)"
                    />
                  </div>
                </div>
              </div>

              <!-- (Admin) Frequency Voxel Size and Phase Voxel Size -->
              <div
                class="slice-form"
                v-if="
                  isEditingQuestion &&
                  !isAddLocalizerMode &&
                  isResolutionLab &&
                  isAcquisitionQuestion &&
                  !isReconstructionQuestion
                "
              >
                <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                <label>Frequency Voxel Size</label>
                <b-form-input type="number" v-model.number="forcedFrequencyVoxelSize" :disabled="isDisabledParameter" />
                <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                <label>Phase Voxel Size</label>
                <b-form-input type="number" v-model.number="forcedPhaseVoxelSize" :disabled="isDisabledParameter" />
              </div>

              <!-- Wrap Prevent (FOV%) -->
              <div
                class="slice-form"
                v-if="!isAddLocalizerMode && !isAcquisitionQuestion && !isReconstructionQuestion && !isForCT"
              >
                <label v-if="!isAddLocalizerMode">{{
                  labels.wrapPrevent[vendorStylePreference.trim()] + ' %' || $t('global.oversampling_mm')
                }}</label>
                <b-form-input
                  @change="submitOversampling"
                  class="adj-input"
                  :type="'number'"
                  v-model.number="oversamplingPercentage"
                  :disabled="complete || isDisabledParameter"
                />
              </div>

              <!-- Max Rotation Off -->
              <div
                v-if="isSingleSliceMode && isSelectionMax && isAcquisitionQuestion && !isReconstructionQuestion"
                class="slice-form"
              >
                <label>{{ $t('global.max_rotation_off') }}</label>
                <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                  <b-form-input :type="'number'" v-model.number="maxRotationOff" :disabled="isDisabledParameter" />
                </div>
              </div>

              <!-- Helical Mode -->
              <div class="slice-form" v-if="isAcquisitionQuestion">
                <v-radio-group v-model="helicalMode" row :disabled="isDisabledParameter">
                  <v-radio label="Helical" :value="true"></v-radio>
                  <v-radio label="2D" :value="false"></v-radio>
                </v-radio-group>
                <div class="slice-form" v-if="helicalMode">
                  <label>Pitch</label>
                  <b-form-input class="adj-input" :type="'number'" :disabled="isDisabledParameter" />
                </div>
              </div>

              <!-- KVP -->
              <div class="slice-form" v-if="isAcquisitionQuestion">
                <label>KVP</label>
                <b-form-input class="adj-input" :type="'number'" v-model="kvpValue" :disabled="isDisabledParameter" />
              </div>

              <!-- mAs -->
              <div class="slice-form" v-if="isAcquisitionQuestion">
                <label>mAs</label>
                <b-form-input class="adj-input" :type="'number'" :disabled="isDisabledParameter" />
              </div>

              <!-- Rotation speed -->
              <div class="slice-form" v-if="isAcquisitionQuestion">
                <label>Rotation speed</label>
                <b-form-input class="adj-input" :type="'number'" :disabled="isDisabledParameter" />
              </div>

              <!-- Scan Volume -->
              <div class="slice-form" v-if="isAcquisitionQuestion">
                <div class="label-with-unit">
                  <label>Scan Volume</label>
                  <UnitCaption unit="(mm)" />
                </div>
                <b-form-input class="adj-input" :type="'number'" :disabled="isDisabledParameter" />
              </div>

              <!-- Scan Duration -->
              <div class="slice-form" v-if="isAcquisitionQuestion">
                <label>Scan Duration</label>
                <b-form-input class="adj-input" :type="'number'" :disabled="isDisabledParameter" />
              </div>

              <!-- window -->
              <div v-show="isForCT && !isAddLocalizerMode" class="slice-form">
                <div class="label-with-unit">
                  <label>{{ $t('SelectionConfigForm.window') }}</label>
                  <UnitCaption class="pl-1" unit=""></UnitCaption>
                </div>
                <v-combobox
                  v-model="windowLevelWidth"
                  :items="windowLevelWidths"
                  hide-details
                  :disabled="isDisabledParameter"
                ></v-combobox>
              </div>

              <!-- kernel -->
              <div v-show="isForCT && !isAddLocalizerMode" class="slice-form">
                <div class="label-with-unit">
                  <label>{{ $t('SelectionConfigForm.kernels') }}</label>
                  <UnitCaption class="pl-1" unit=""></UnitCaption>
                </div>
                <v-combobox v-model="kernel" :items="kernels" hide-details :disabled="isDisabledParameter"></v-combobox>
              </div>

              <!-- tube_potential -->
              <div class="slice-form" v-if="isForCT && !isAddLocalizerMode">
                <div class="label-with-unit">
                  <label>{{ $t('SelectionConfigForm.tube_potential') }}</label>
                  <UnitCaption unit="(kV)" />
                </div>
                <b-form-input :type="'number'" v-model.number="tubePotential" :disabled="isDisabledParameter" />
              </div>

              <!-- tube_current -->
              <div class="slice-form" v-if="isForCT && !isAddLocalizerMode">
                <div class="label-with-unit">
                  <label>{{ $t('SelectionConfigForm.tube_current') }}</label>
                  <UnitCaption unit="(mA)" />
                </div>
                <b-form-input :type="'number'" v-model.number="tubeCurrent" :disabled="isDisabledParameter" />
              </div>

              <!-- rotation_time -->
              <div class="slice-form" v-if="isForCT && !isAddLocalizerMode">
                <div class="label-with-unit">
                  <label>{{ $t('SelectionConfigForm.rotation_time') }}</label>
                  <UnitCaption unit="" />
                </div>
                <b-form-input :type="'number'" v-model.number="rotationTime" :disabled="isDisabledParameter" />
              </div>

              <!-- <div class="slice-form" v-if="isForCT && !isAddLocalizerMode">
              <div class="label-with-unit highlight">
                <label>Window level: {{ displayWindowLevel }}</label>
              </div>
              <div class="label-with-unit highlight">
                <label>Window width: {{ displayWindowWidth }}</label>
              </div>
            </div> -->

              <div v-if="isContrastLab" class="slice-form">
                <div class="label-with-unit">
                  <label>{{ $t('SelectionConfigForm.repetition_time') }}</label>
                  <UnitCaption unit="ms" />
                </div>
                <b-form-input
                  :type="'number'"
                  v-model.number="repetitionTime"
                  :disabled="complete || isDisabledParameter"
                />
              </div>

              <div v-if="isContrastLab" class="slice-form">
                <div class="label-with-unit">
                  <label>{{ $t('SelectionConfigForm.echo_time') }}</label>
                  <UnitCaption unit="ms" />
                </div>
                <b-form-input :type="'number'" v-model.number="echoTime" :disabled="complete || isDisabledParameter" />
              </div>

              <div v-show="isContrastLab" class="slice-form">
                <div class="label-with-unit">
                  <label>{{ labels.flipAngleLabel[vendorStylePreference] }}</label>
                  <UnitCaption class="pl-1" unit="°"></UnitCaption>
                </div>

                <b-form-input :type="'number'" v-model.number="flipAngle" :disabled="isDisabledParameter" />
              </div>

              <div v-if="isContrastLab">
                <div class="slice-form">
                  <b-form-checkbox
                    v-model="fatSuppression"
                    :disabled="inversionRecovery || complete || isDisabledParameter"
                  >
                    {{ $t('SelectionConfigForm.fat_saturation') }}
                  </b-form-checkbox>
                </div>

                <div :style="{ visibility: displayedSequenceType === 'SE' ? 'visible' : 'hidden' }" class="slice-form">
                  <b-form-checkbox
                    v-model="inversionRecovery"
                    :disabled="fatSuppression || complete || isDisabledParameter"
                  >
                    {{ $t('SelectionConfigForm.inversion_recovery') }}
                  </b-form-checkbox>
                </div>
              </div>

              <div v-show="isContrastLab && inversionRecovery && displayedSequenceType === 'SE'" class="slice-form">
                <div class="label-with-unit">
                  <label>{{ $t('SelectionConfigForm.inversion_time') }}</label>
                  <UnitCaption unit="ms" />
                </div>
                <b-form-input
                  :type="'number'"
                  v-model.number="inversionTime"
                  :disabled="complete || isDisabledParameter"
                />
              </div>

              <!-- swap phase button -->
              <div style="justify-content: end" class="slice-form" v-if="!isReconstructionQuestion">
                <div>
                  <v-btn
                    v-if="vendorStylePreference !== 'philips'"
                    tile
                    outlined
                    class="no-transform bold"
                    color="buttonBlue"
                    :disabled="complete || isDisabledParameter"
                    @click="onSwapPhase"
                  >
                    {{ labels.swap[vendorStylePreference.trim()] || $t('MRI.swap_phase') }}
                  </v-btn>
                  <v-btn
                    v-else
                    tile
                    outlined
                    class="no-transform bold"
                    color="buttonBlue"
                    :disabled="complete || isDisabledParameter"
                    @click="onSwapPhase"
                  >
                    Swap fold-over direction
                  </v-btn>
                </div>
              </div>
            </v-row>

            <div>
              <InteractableForm v-if="interactableFormVisible" />
            </div>
          </div>

          <!-- Begin Ultra Lab Form Fields -->
          <div class="form-container ultralab-container" v-if="isUltraLab">
            <v-row>
              <v-col cols="2" class="slice-form" v-if="!isAddLocalizerMode">
                <div v-if="isSingleSliceMode && !isIdentTypeProposed">
                  <div class="label-with-unit">
                    <label>{{ $t('global.height') }}</label>
                    <UnitCaption unit="(mm)" />
                  </div>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                    <b-form-input :type="'number'" v-model.number="dimensions3zHalf" :disabled="complete" />
                  </div>
                </div>
                <div v-if="!isSingleSliceMode">
                  <label class="white-space-nowrap">
                    {{ $t('global.number_of_slices') }}
                    <p-radio
                      class="p-svg p-plain p-smooth"
                      value="numberOfSlices"
                      v-model="heightChangeTarget"
                      name="heightChangeTarget"
                      toggle
                    >
                      <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                      <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                      <label slot="off-label"></label>
                    </p-radio>
                  </label>
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          @input="submitNumberOfSlices"
                          :type="'number'"
                          v-model.number="numberOfSlices"
                          :step="1"
                          :min="1"
                          :max="300"
                          :disabled="complete"
                        />
                      </div>
                    </div>
                  </div>
                  <!-- <div class="font-weight-normal text-muted text-center">Min: 1 | Max: 300</div> -->
                </div>
                <div>
                  <label>{{ $t('SelectionConfigForm.repetition_time') + '(ms)' }}</label>
                  <!-- <b-form-input
              :type="'number'"
              :value="repetitionTime"
              step="1"
              min="1"
              :disabled="complete"
              @change="changeRepetitionTime"
              class="input-number"
            /> -->
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          @input="changeRepetitionTime"
                          :type="'number'"
                          :value="repetitionTime"
                          :step="1"
                          :min="selectionConfig.sequenceType !== 'DIFF' ? 1 : minConcatAcqPackage"
                          :max="15000"
                          class="input-number"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label>{{ $t('SelectionConfigForm.echo_time') + '(ms)' }}</label>
                  <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                    <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                      <SpinButtonWithInput
                        v-if="selectionConfig && selectionConfig.sequenceType === 'SSFP'"
                        :step="echoSpacing"
                        :min="minTEOptionsForTEandDIFF"
                        :max="maxEchoTime"
                        :value="echoTime"
                        @input="changeSpin($event, 'echoTime')"
                      />
                      <SpinButtonWithInput
                        v-if="
                          selectionConfig &&
                          (selectionConfig.sequenceType === 'TE' || selectionConfig.sequenceType === 'DIFF')
                        "
                        :step="echoSpacing"
                        :min="minTEOptionsForTEandDIFF"
                        :max="maxEchoTime"
                        :value="echoTime"
                        @input="changeEchoTime"
                      />
                      <SpinButtonWithInput
                        v-if="selectionConfig && selectionConfig.sequenceType === 'SE'"
                        :step="1"
                        :min="6"
                        :max="maxTEOptionsForSE"
                        :value="echoTime"
                        @input="changeEchoTime"
                      />
                      <SpinButtonWithInput
                        v-if="selectionConfig && selectionConfig.sequenceType === 'GRE'"
                        :step="1"
                        :min="1"
                        :max="maxTEOptionsForGRE"
                        :value="echoTime"
                        @input="changeEchoTime"
                      />
                    </div>
                  </div>
                </div>
                <div v-if="!isTakingTest">
                  <label>SNR Average</label>
                  <div class="d-flex align-items-center">
                    <b-form-input
                      :type="'text'"
                      :value="selectionConfig.snr !== null ? selectionConfig.snr.toFixed(2) : '---'"
                      disabled
                      class="input-number"
                      style="flex: 1; min-width: 4em"
                    />
                    <div class="d-flex flex-column ml-0">
                      <v-btn
                        icon
                        small
                        @click="fetchSignalAverage"
                        :disabled="isFetchingSignalAverage"
                        title="Refresh SNR average"
                      >
                        <v-icon small>{{ isFetchingSignalAverage ? 'mdi-loading mdi-spin' : 'mdi-refresh' }}</v-icon>
                      </v-btn>
                      <v-btn
                        icon
                        small
                        @click="saveSNR"
                        :disabled="selectionConfig.snr === null"
                        title="Save current SNR for comparison"
                      >
                        <v-icon small>mdi-content-save</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-col>

              <v-col cols="2" class="slice-form">
                <div v-if="!isAddLocalizerMode" class="label-with-unit">
                  <label>{{ $t('global.slice_thickness_mm') }}</label>
                  <UnitCaption unit="(mm)" />
                </div>
                <div
                  v-if="!isAddLocalizerMode"
                  :class="paramHints.includes('resolution') ? 'param-hint-resolution' : ''"
                >
                  <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                    <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                      <SpinButtonWithInput
                        :step="0.5"
                        :min="0"
                        :max="60"
                        v-model.number="thickness"
                        @input="submitThickness"
                        :disabled="complete"
                      />
                      <!--<b-form-input
              @change="submitThickness"
              :type="'number'"
              v-model.number="thickness"
              step="0.1"
              min="0"
              max="50"
              :disabled="complete"
              class="input-number"
              /> -->
                      <p-radio
                        v-if="!isSingleSliceMode && !isForCT"
                        class="p-svg p-plain p-smooth ms-auto me-0"
                        value="thickness"
                        v-model="heightChangeTarget"
                        name="heightChangeTarget"
                        toggle
                      >
                        <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                        <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                        <label slot="off-label"></label>
                      </p-radio>
                    </div>
                  </div>
                </div>
                <div v-if="!isSingleSliceMode || isAddLocalizerMode || spacing < 0">
                  <div class="label-with-unit">
                    <label>{{ labels.gap[vendorStylePreference.trim()] }}</label>
                    <UnitCaption
                      unit="(%)"
                      v-if="
                        (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') &&
                        !isAddLocalizerMode
                      "
                    />
                    <UnitCaption unit="(mm)" v-else />
                  </div>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'" :id="'tooltip-spacing' + selectionIdent">
                    <SpinButtonWithInput
                      :step="
                        (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') &&
                        !isAddLocalizerMode
                          ? 1
                          : 0.1
                      "
                      :min="0"
                      :max="
                        (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') &&
                        !isAddLocalizerMode
                          ? 100
                          : 50
                      "
                      v-model.number="spacing"
                      @input="submitSpacing"
                      :disabled="complete"
                      :allow-decimal="
                        (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') &&
                        !isAddLocalizerMode
                          ? false
                          : true
                      "
                    />

                    <!-- <b-form-input
                    @change="submitSpacing"
                    :type="'number'"
                    v-model.number="spacing"
                    step="0.1"
                    min="0"
                    max="50"
                    :disabled="complete"
                    class="input-number"
                    /> -->
                    <p-radio
                      class="p-svg p-plain p-smooth"
                      value="spacing"
                      v-model="heightChangeTarget"
                      name="heightChangeTarget"
                      toggle
                      v-if="!isAddLocalizerMode && !isForCT"
                    >
                      <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                      <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                      <label slot="off-label"></label>
                    </p-radio>
                  </div>
                  <b-tooltip :target="'tooltip-spacing' + selectionIdent" triggers="hover">
                    {{ spacingTooltip + ' mm' }}
                  </b-tooltip>
                </div>
              </v-col>

              <v-col cols="3" class="slice-form">
                <label v-if="!isAddLocalizerMode && vendorStylePreference === 'philips'">{{
                  labels.wrapPrevent[vendorStylePreference.trim()] + ' (mm)'
                }}</label>
                <label v-if="!isAddLocalizerMode && vendorStylePreference !== 'philips'">{{
                  labels.wrapPrevent[vendorStylePreference.trim()] + ' %'
                }}</label>
                <div v-if="!isAddLocalizerMode" :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          :step="1"
                          :min="0"
                          :max="100"
                          v-model.number="oversamplingPercentage"
                          @input="submitOversampling"
                          :disabled="complete"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <!-- <b-form-input
                @change="submitOversampling"
                class="adj-input input-number"
                :type="'number'"
                v-model.number="oversamplingPercentage"
                step="1"
                min="0"
                :max="100"
                :disabled="complete"
                /> -->
                <v-btn
                  v-if="vendorStylePreference !== 'philips'"
                  tile
                  outlined
                  class="ml-2 no-transform bold mt-5"
                  color="buttonBlue"
                  :disabled="complete || isDisabledParameter"
                  @click="onSwapPhase"
                >
                  {{ labels.swap[vendorStylePreference.trim()] }}
                </v-btn>
                <v-btn
                  v-else
                  tile
                  outlined
                  class="ml-2 no-transform bold mt-5"
                  color="buttonBlue"
                  :disabled="complete || isDisabledParameter"
                  @click="onSwapPhase"
                >
                  Swap fold-over direction
                </v-btn>
              </v-col>

              <v-col v-if="!isAddLocalizerMode" cols="2" class="slice-form">
                <div class="label-with-unit">
                  <label>{{ labels.frequencyFovLabel[vendorStylePreference] }}</label>
                  <UnitCaption unit="(cm)" v-if="['ge', 'canon'].includes(vendorStylePreference)" />
                  <UnitCaption unit="(mm)" v-else />
                </div>
                <!-- <b-form-input
            @change="submitDimensions3y"
            :type="'number'"
            v-model.number="dimensions3y"
            step="1"
            min="1"
            max="500"
            :disabled="complete"
            class="input-number"
          /> -->
                <div :class="paramHints.includes('resolution') ? 'param-hint-resolution' : ''">
                  <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                    <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                      <SpinButtonWithInput
                        @input="submitDimensions3y"
                        :type="'number'"
                        v-model.number="dimensions3y"
                        :step="1"
                        :min="1"
                        :max="['ge', 'canon'].includes(vendorStylePreference) ? 50 : 500"
                      />
                    </div>
                  </div>
                </div>
                <div class="label-with-unit">
                  <label>{{ labels.phaseFovLabel[vendorStylePreference] }}</label>
                  <UnitCaption unit="(%)" v-if="['siemens', 'philips', 'united'].includes(vendorStylePreference)" />
                  <UnitCaption unit="(cm)" v-if="['ge', 'canon'].includes(vendorStylePreference)" />
                  <UnitCaption
                    unit="(mm)"
                    v-if="!['ge', 'canon', 'siemens', 'philips', 'united'].includes(vendorStylePreference)"
                  />
                </div>
                <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                  <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                    <div :class="paramHints.includes('resolution') ? 'param-hint-resolution' : ''">
                      <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                        <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                          <SpinButtonWithInput
                            @input="submitDimensions3x"
                            :type="'number'"
                            v-model.number="dimensions3x"
                            :step="1"
                            :min="1"
                            :max="500"
                            :id="'dimensions3x_tooltip' + selectionIdent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- <b-form-input
                @change="submitDimensions3x"
                :type="'number'"
                v-model.number="dimensions3x"
                id="dimensions3x_tooltip"
                step="1"
                min="1"
                max="500"
                :disabled="complete"
                class="input-number"
                /> -->
                <b-tooltip
                  :target="'dimensions3x_tooltip' + selectionIdent"
                  triggers="hover"
                  :disabled="['ge', 'siemens', 'philips', 'united'].indexOf(vendorStylePreference) < 0"
                >
                  {{ dimensions3xTooltip }}</b-tooltip
                >
                <div v-if="showAverages">
                  <div class="label-with-unit">
                    <label>{{ labels.averageLabel[vendorStylePreference.trim()] }}</label>
                  </div>
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                      <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                        <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                          <SpinButtonWithInput
                            @input="setAverages"
                            :type="'number'"
                            v-model.number="averages"
                            :step="1"
                            :min="1"
                            :max="8"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- <b-form-input
                :type="'number'"
                :value="averages"
                step="1"
                min="1"
                max="8"
                :disabled="complete"
                @keyup.enter="(evt) => pressEnterKey(evt, 'averages')"
                class="input-number"
                /> -->
              </v-col>

              <v-col cols="2" class="slice-form" v-if="!isAddLocalizerMode">
                <div class="label-with-unit">
                  <label>{{ labels.concatenationLabel[vendorStylePreference.trim()] }}</label>
                </div>
                <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                  <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                    <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                      <SpinButtonWithInput
                        @input="changeConcatenations"
                        :type="'number'"
                        :value="concatenations"
                        :step="1"
                        :min="1"
                        :max="10"
                        :disabled="complete || selectionConfig.sequenceType === 'DIFF'"
                      />
                    </div>
                  </div>
                </div>
                <!-- <b-form-input
                :type="'number'"
                :value="concatenations"
                step="1"
                min="1"
                max="10"
                :disabled="complete"
                @change="changeConcatenations"
                class="input-number"
                /> -->
                <div>
                  <!-- <label>{{ $t("SelectionConfigForm.min_concat_acq_package") }}</label> -->
                  <label>{{ labels.minTRLabel[vendorStylePreference.trim()] }}</label>
                  <b-form-input :type="'number'" v-model.number="minConcatAcqPackage" disabled class="input-number" />
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <label>{{ $t('SelectionConfigForm.min_seq_tr') }}</label>
                    <b-form-input :type="'number'" v-model.number="minSeqTr" disabled class="input-number" />
                  </div>

                  <label>{{ $t('SelectionConfigForm.min_seq_te') }}</label>
                  <b-form-input :type="'number'" v-model.number="minSeqTe" disabled class="input-number" />
                </div>
              </v-col>

              <v-col cols="2" class="slice-form" v-if="isEditingQuestion && !isAddLocalizerMode && isResolutionLab">
                <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                <label>Frequency Voxel Size</label>
                <b-form-input type="number" v-model.number="forcedFrequencyVoxelSize" />
                <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                <label>Phase Voxel Size</label>
                <b-form-input type="number" v-model.number="forcedPhaseVoxelSize" />
              </v-col>
              <v-col cols="2" v-if="isSingleSliceMode && isSelectionMax" class="slice-form">
                <label>{{ $t('global.max_rotation_off') }}</label>
                <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                  <b-form-input
                    :type="'number'"
                    v-model.number="maxRotationOff"
                    step="0.1"
                    min="0"
                    max="900"
                    class="input-number"
                  />
                </div>
              </v-col>
              <v-col cols="2" v-if="isSingleSliceMode && !isIdentTypeProposed" class="slice-form">
                <div class="label-with-unit">
                  <label>{{ $t('global.height') }}</label>
                  <UnitCaption unit="(mm)" />
                </div>
                <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                  <b-form-input
                    :type="'number'"
                    v-model.number="dimensions3zHalf"
                    step="0.1"
                    min="0"
                    max="900"
                    :disabled="complete"
                    class="input-number"
                  />
                </div>
              </v-col>
            </v-row>
            <v-tabs v-if="!isAddLocalizerMode" color="accent-4" right>
              <v-tab>{{ $t('SelectionConfigForm.contrast') }}</v-tab>
              <v-tab>{{ $t('SelectionConfigForm.resolution') }}</v-tab>
              <v-tab>{{ $t('SelectionConfigForm.sequence') }}</v-tab>
              <v-tab>{{ $t('SelectionConfigForm.advanced') }}</v-tab>
              <v-tab v-if="showSpecialtyTab">{{ specialtyTabHeader }}</v-tab>
              <v-tab-item>
                <v-container fluid>
                  <v-row>
                    <v-col cols="4" class="slice-form pt-4">
                      <label>{{ $t('SelectionConfigForm.repetition_time') + '(ms)' }}</label>
                      <!-- <b-form-input
                  :type="'number'"
                  :value="repetitionTime"
                  step="1"
                  min="1"
                  max="2000"
                  :disabled="complete"
                  @change="changeRepetitionTime"
                  class="input-number"
                /> -->
                      <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                        <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                          <div class="input-lock">
                            <SpinButtonWithInput
                              @input="changeRepetitionTime"
                              :type="'number'"
                              :value="repetitionTime"
                              :step="1"
                              :min="1"
                              :max="15000"
                              :disabled="complete"
                            />
                          </div>
                        </div>
                      </div>
                      <label>{{ $t('SelectionConfigForm.echo_time') + '(ms)' }}</label>
                      <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                        <div class="input-lock">
                          <SpinButtonWithInput
                            v-if="selectionConfig && selectionConfig.sequenceType === 'SSFP'"
                            :step="echoSpacing"
                            :min="0"
                            :max="maxEchoTime"
                            :value="echoTime"
                            @input="changeSpin($event, 'echoTime')"
                          />
                          <SpinButtonWithInput
                            v-if="
                              selectionConfig &&
                              (selectionConfig.sequenceType === 'TE' || selectionConfig.sequenceType === 'DIFF')
                            "
                            :step="echoSpacing"
                            :min="echoSpacing"
                            :max="selectionConfig.sequenceType === 'DIFF' ? maxEchoTime : maxEchoTime"
                            :value="echoTime"
                            @input="changeSpin($event, 'echoTime')"
                          />
                          <SpinButtonWithInput
                            v-if="selectionConfig && selectionConfig.sequenceType === 'SE'"
                            :step="1"
                            :min="3"
                            :max="maxTEOptionsForSE"
                            :value="echoTime"
                            @input="changeSpin($event, 'echoTime')"
                          />
                          <SpinButtonWithInput
                            v-if="selectionConfig && selectionConfig.sequenceType === 'GRE'"
                            :step="1"
                            :min="1"
                            :max="maxTEOptionsForGRE"
                            :value="echoTime"
                            @input="changeSpin($event, 'echoTime')"
                          />
                        </div>
                      </div>
                    </v-col>
                    <v-col cols="3">
                      <label>{{ labels.flipAngleLabel[vendorStylePreference] + '(°)' }}</label>
                      <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                        <b-form-input
                          :type="'number'"
                          v-model.number="flipAngle"
                          step="1"
                          min="1"
                          max="2000"
                          class="input-number"
                          style="border-radius: 17px"
                          :disabled="complete"
                        />
                      </div>
                      <div v-show="displayedSequenceType === 'SE' || displayedSequenceType === 'TE'">
                        <label>{{ $t('SelectionConfigForm.inversion_time') + '(ms)' }}</label>
                        <b-form-input
                          :type="'number'"
                          v-model.number="inversionTime"
                          step="1"
                          min="0"
                          max="2000"
                          class="input-number"
                          :disabled="
                            ((displayedSequenceType === 'SE' || displayedSequenceType === 'TE') &&
                              !inversionRecovery) ||
                            complete
                          "
                        />
                      </div>
                    </v-col>
                    <v-col>
                      <div class="slice-form">
                        <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                          <b-form-checkbox v-model="fatSuppression" :disabled="complete">
                            {{ $t('SelectionConfigForm.fat_saturation') }}
                          </b-form-checkbox>
                        </div>
                      </div>
                      <div
                        :style="{
                          visibility:
                            displayedSequenceType === 'SE' || displayedSequenceType === 'TE' ? 'visible' : 'hidden',
                        }"
                        class="slice-form"
                      >
                        <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                          <b-form-checkbox
                            v-model="inversionRecovery"
                            :disabled="complete"
                            @change="toggleInversionRecovery"
                          >
                            {{ $t('SelectionConfigForm.inversion_recovery') }}
                          </b-form-checkbox>
                        </div>
                      </div>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tab-item>
              <v-tab-item>
                <v-container fluid>
                  <v-row>
                    <v-col cols="4" class="slice-form pt-4">
                      <label>{{ labels.frequencyMatrixLabel[vendorStylePreference] }}</label>
                      <div :class="paramHints.includes('resolution') ? 'param-hint-resolution' : ''">
                        <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                          <div class="input-lock">
                            <SpinButtonWithInput
                              :step="32"
                              :min="64"
                              :max="512"
                              :value="frequencyMatrix"
                              @input="changeSpin($event, 'frequencyMatrix')"
                              :disabled="complete || isDisabledParameter || vendorStylePreference === 'philips'"
                            />
                          </div>
                        </div>
                      </div>
                      <label>{{
                        labels.phaseMatrixLabel[vendorStylePreference] + (vendorStylePreference === 'siemens' ? ' (%)' : '')
                      }}</label>
                      <div :id="'phase_tooltip' + selectionIdent">
                        <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                          <div :class="paramHints.includes('resolution') ? 'param-hint-resolution' : ''">
                            <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                              <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                                <div class="input-lock" v-if="vendorStylePreference !== 'siemens'">
                                  <SpinButtonWithInput
                                    :step="stepForPhaseMatrix"
                                    :min="minPhaseMatrix"
                                    :max="maxPhaseMatrix"
                                    :value="phaseMatrix"
                                    @input="changeSpin($event, 'phaseMatrix')"
                                    :disabled="complete || vendorStylePreference === 'philips'"
                                  />
                                </div>
                                <b-form-input
                                  :type="'number'"
                                  :value="phaseMatrix"
                                  :step="stepForPhaseMatrix"
                                  :min="minPhaseMatrix"
                                  :max="maxPhaseMatrix"
                                  :disabled="complete"
                                  @keyup.enter="(evt) => pressEnterKey(evt, 'phaseMatrix')"
                                  @blur="(evt) => pressEnterKey(evt, 'phaseMatrix')"
                                  v-if="vendorStylePreference === 'siemens'"
                                  class="input-number"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <b-tooltip :target="'phase_tooltip' + selectionIdent" triggers="hover">
                        {{ phaseMatrixTooltip }}</b-tooltip
                      >
                    </v-col>
                    <v-col cols="4" class="slice-form pt-4" v-if="vendorStylePreference === 'philips'">
                      <label>{{ $t('global.frequency_voxel') }}</label>
                      <div class="input-lock">
                        <SpinButtonWithInput
                          :type="'number'"
                          :max="100"
                          :step="0.01"
                          :value="frequencyVoxelSize"
                          @input="changeFrequencyVoxelSize($event)"
                        />
                      </div>
                      <label>{{ $t('global.phase_voxel') }}</label>
                      <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                        <div class="input-lock">
                          <SpinButtonWithInput
                            :type="'number'"
                            :max="100"
                            :step="0.01"
                            :value="phaseVoxelSize"
                            @input="changePhaseVoxelSize($event)"
                          />
                        </div>
                      </div>
                    </v-col>
                    <v-col cols="4" class="slice-form pt-4">
                      <div v-if="selectionConfig && selectionConfig.sequenceType === 'TE'">
                        <label>{{ labels.echoTrainLabel[vendorStylePreference.trim()] }}</label>
                        <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                          <div :class="paramHints.includes('resolution') ? 'param-hint-resolution' : ''">
                            <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                              <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                                <div class="input-lock">
                                  <SpinButtonWithInput
                                    :step="1"
                                    :min="1"
                                    :max="512"
                                    :value="echoTrainLength"
                                    @input="changeSpin($event, 'echoTrainLength')"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                        <div
                          :class="
                            paramHints.includes('resolution') &&
                            selectionConfig &&
                            selectionConfig.sequenceType === 'GRE'
                              ? 'param-hint-resolution'
                              : ''
                          "
                        >
                          <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                            <div
                              :class="
                                paramHints.includes('snr') && selectionConfig && selectionConfig.sequenceType !== 'GRE'
                                  ? 'param-hint-snr'
                                  : ''
                              "
                            >
                              <label>{{ labels.resolutionPritial[vendorStylePreference.trim()] }}</label>
                              <v-select v-model="partialFourier" :items="fourierItems" solo></v-select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tab-item>
              <v-tab-item>
                <v-container>
                  <v-row>
                    <v-col>
                      <div class="sequence-button-grid">
                        <v-btn-toggle @change="changeSequenceType" v-model="selectionConfig.sequenceType" class="mb-2">
                          <v-btn tile outlined class="no-transform bold" color="buttonBlue" :value="'GRE'" width="130">
                            {{ labels.sequenceTypeLabel[vendorStylePreference].GRE }}
                          </v-btn>
                          <v-btn
                            tile
                            outlined
                            class="outline-btn no-transform bold"
                            color="buttonBlue"
                            :value="'SE'"
                            width="130"
                          >
                            {{ $t('SelectionConfigForm.spin_echo') }}
                          </v-btn>
                          <v-btn
                            tile
                            outlined
                            class="outline-btn no-transform bold"
                            color="buttonBlue"
                            :value="'TE'"
                            width="130"
                          >
                            {{
                              vendorStylePreference === 'philips' || vendorStylePreference === 'siemens'
                                ? $t('SelectionConfigForm.turbo_spin_echo')
                                : $t('SelectionConfigForm.fast_spin_echo')
                            }}
                          </v-btn>
                        </v-btn-toggle>
                        <v-btn-toggle @change="changeSequenceType" v-model="selectionConfig.sequenceType">
                          <v-btn
                            v-if="showDiffusionSequenceOption"
                            tile
                            outlined
                            class="outline-btn no-transform bold"
                            color="buttonBlue"
                            :value="'DIFF'"
                            width="130"
                          >
                            {{
                              vendorStylePreference === 'philips' || vendorStylePreference === 'siemens'
                                ? $t('SelectionConfigForm.spin_echo_diffusion')
                                : $t('SelectionConfigForm.spin_echo_diffusion')
                            }}
                          </v-btn>
                          <!-- <v-btn
                            tile
                            outlined
                            class="outline-btn no-transform bold"
                            color="buttonBlue"
                            :value="'SSFP'"
                            width="130"
                          >
                            {{ $t('SelectionConfigForm.steady_state_free_precession') }}
                          </v-btn> -->
                        </v-btn-toggle>
                      </div>
                      <InteractableForm class="mt-3" v-if="interactableFormVisible" />
                    </v-col>
                  </v-row>
                </v-container>
              </v-tab-item>
              <v-tab-item>
                <v-container fluid>
                  <v-row>
                    <v-col cols="4">
                      <div class="label-with-unit text-left">
                        <label>{{ $t('SelectionConfigForm.receiver_bandwidth') }}</label>
                        <UnitCaption unit="(kHz)" v-if="vendorStylePreference === 'ge'" />
                        <UnitCaption unit="(pixel)" v-else-if="vendorStylePreference === 'philips'" />
                        <UnitCaption unit="(Hz/px)" v-else />
                      </div>
                      <div
                        :class="
                          paramHints.includes('time') && selectionConfig.sequenceType === 'DIFF'
                            ? 'param-hint-time'
                            : ''
                        "
                      >
                        <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                          <div :id="'tooltip-receiver-bandwidth' + selectionIdent">
                            <b-form-input
                              :type="'number'"
                              :value="receiverBandWidth"
                              step="1"
                              min="vendorStylePreference === 'siemens' ? 100 : 1"
                              class="input-number"
                              style="border-radius: 17px"
                              @change="onBandwidthChangedByUser"
                            />
                            <b-tooltip
                              v-if="isUltraLab && vendorStylePreference !== 'philips'"
                              :target="'tooltip-receiver-bandwidth' + selectionIdent"
                              triggers="hover"
                            >
                              {{ 'Fat/Water Shift ' + receiverBandwidthTooltip + ' pxl' }}
                            </b-tooltip>
                            <b-tooltip
                              v-else-if="isUltraLab && vendorStylePreference === 'philips'"
                              :target="'tooltip-receiver-bandwidth' + selectionIdent"
                              triggers="hover"
                            >
                              {{ receiverBandwidthTooltip + ' (Hz/px)' }}
                            </b-tooltip>
                          </div>
                        </div>
                      </div>
                    </v-col>
                    <v-col cols="4">
                      <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                        <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                          <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                            <label>{{ labels.parallelFactor[vendorStylePreference.trim()] }}</label>
                            <v-select
                              v-model="parallelFactor"
                              :items="parallelFactors[vendorStylePreference.trim()]"
                              solo
                              dense
                            ></v-select>
                          </div>
                        </div>
                      </div>
                    </v-col>
                    <v-col cols="4">
                      <div v-if="['TE', 'DIFF', 'SSFP'].includes(selectionConfig.sequenceType)">
                        <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                          <label>{{ labels.timeBetweenEchoes[vendorStylePreference.trim()] + '(ms)' }}</label>
                          <v-text-field
                            :type="'number'"
                            v-model.number="echoSpacing"
                            dense
                            solo
                            disabled
                          ></v-text-field>
                        </div>
                        <!--
                      <label>{{ labels.timeBetweenEchoes[vendorStylePreference.trim()] + '(ms)' }}</label>
                      <v-select
                        :disabled="selectionConfig.sequenceType !== 'TE'"
                        v-model="echoSpacing"
                        :items="echoSpacings"
                        solo
                        dense
                      ></v-select>
                      --></div>
                    </v-col>
                  </v-row>
                  <v-row class="mt-0">
                    <v-col cols="4">
                      <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                        <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                          <label>{{ labels.rfPulsing[vendorStylePreference.trim()] || $t('SelectionConfigForm.rf_pulsing') }}</label>
                          <v-select
                            v-model="rfPulsing"
                            :items="rfPulsingItems"
                            item-title="text"
                            item-value="value"
                            solo
                            dense
                          ></v-select>
                        </div>
                      </div>
                    </v-col>
                    <v-col cols="4">
                      <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                        <label>{{ labels.gradientRamp[vendorStylePreference.trim()] || $t('SelectionConfigForm.gradient_ramp') }}</label>
                        <v-select
                          v-model="gradientRamp"
                          :items="gradientRampItems"
                          item-title="text"
                          item-value="value"
                          solo
                          dense
                        ></v-select>
                      </div>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tab-item>
              <v-tab-item v-if="showSpecialtyTab">
                <v-container fluid>
                  <v-row v-if="isEditingQuestion">
                    <v-col>
                      <v-select
                        v-model="specialtyOption"
                        :items="specialtyOptionItems"
                        class="w-50"
                        solo
                        dense
                      ></v-select>
                    </v-col>
                  </v-row>
                  <v-row v-if="specialtyOption === 'Diffusion'">
                    <v-col>
                      <v-row>
                        <v-col cols="8">
                          {{ 'Diffusion Directions' }}
                        </v-col>
                        <v-col cols="4" class="p-2">
                          <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                            <v-select
                              label="Diffusion Direction"
                              v-model="diffusionDirections"
                              :items="diffusionDirectionItems"
                              solo
                              dense
                              hide-details
                              class="m-1"
                            ></v-select>
                          </div>
                        </v-col>
                      </v-row>
                      <v-row>
                        <v-col cols="8">
                          {{ 'Number of B-Values' }}
                        </v-col>
                        <v-col cols="4" class="slice-form">
                          <div class="input-lock">
                            <SpinButtonWithInput
                              :step="1"
                              :min="1"
                              :max="4"
                              :value="numBValues"
                              @input="changeSpin($event, 'numBValues')"
                            />
                          </div>
                        </v-col>
                      </v-row>
                      <v-row>
                        <v-col>
                          <v-checkbox
                            v-model="diffusionADC"
                            label="ADC"
                            class="p-2"
                            :disabled="adcDisabled"
                          ></v-checkbox>
                        </v-col>
                      </v-row>
                    </v-col>
                    <v-col>
                      <v-row>
                        <v-col cols="5">
                          {{ 'B-Values' }}
                        </v-col>
                        <v-col cols="5">
                          {{ labels.averageLabel[vendorStylePreference.trim()] }}
                        </v-col>
                        <v-col cols="2">
                          <!-- Empty column for alignment -->
                        </v-col>
                      </v-row>
                      <v-row v-for="(_, index) in numBValues" class="p-0 m-0" :key="index">
                        <v-col cols="5" class="slice-form p-0 m-0">
                          <div class="input-lock">
                            <SpinButtonWithInput
                              :step="1"
                              :min="
                                index === 0
                                  ? (numBValues === 1 ? 50 : 0)
                                  : index === numBValues - 1
                                  ? Math.max(50, bValues[index - 1] + 1)
                                  : bValues[index - 1] + 1
                              "
                              :max="5000"
                              :value="bValues[index]"
                              @input="(value) => changeBValueSpin(value, index)"
                            />
                          </div>
                        </v-col>
                        <v-col cols="5" class="slice-form p-0 m-0">
                          <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                            <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                              <div class="input-lock">
                                <SpinButtonWithInput
                                  :step="1"
                                  :min="1"
                                  :max="20"
                                  :value="bAverages[index]"
                                  @input="(value) => changeBAveragesSpin(value, index)"
                                />
                              </div>
                            </div>
                          </div>
                        </v-col>
                        <v-col cols="2">
                          <!-- Empty column for alignment -->
                        </v-col>
                      </v-row>
                      <v-row v-if="numBValues > 0" class="p-0 m-0">
                        <v-col cols="12" class="text-caption text-muted pa-2"> Maximum b-value must be ≥ 50 </v-col>
                      </v-row>
                      <v-row>
                        <v-col cols="7">
                          {{ labels.timeBetweenEchoes[vendorStylePreference.trim()] + '(ms)' }}
                        </v-col>
                        <v-col cols="5">
                          <v-text-field
                            :type="'number'"
                            v-model.number="echoSpacing"
                            :label="labels.timeBetweenEchoes[vendorStylePreference.trim()] + '(ms)'"
                            dense
                            solo
                            disabled
                          ></v-text-field>
                          <!--
                        <v-select :disabled="true" v-model="echoSpacing" :items="echoSpacings" solo dense></v-select>
-->
                        </v-col>
                      </v-row>
                    </v-col>
                  </v-row>
                </v-container>
              </v-tab-item>
            </v-tabs>
          </div>
        </v-tab-item>
        <v-tab-item>
          <hr class="header-gradient-region" />
          <div class="form-container">
            <v-row>
              <v-col class="hotkey-list">
                <p>{{ $t('HotkeyGuide.one') }}</p>
                <p>{{ $t('HotkeyGuide.two') }}</p>
                <p>{{ $t('HotkeyGuide.three') }}</p>
                <p>{{ $t('HotkeyGuide.four') }}</p>
                <p>{{ $t('HotkeyGuide.enter') }}</p>
                <p>{{ $t('HotkeyGuide.esc') }}</p>
              </v-col>
            </v-row>
          </div>
        </v-tab-item>
      </v-tabs>
      <div class="w-25 ms-auto me-0" v-if="!isTakingTest && isUltraLab">
        <div class="w-25 ms-auto me-0">
          <label>Saved SNR</label>
          <div class="d-flex align-items-center">
            <b-form-input
              :type="'text'"
              :value="savedSnr !== null ? savedSnr.toFixed(2) : '---'"
              disabled
              class="input-number"
              style="flex: 1"
            />
          </div>
        </div>
      </div>
      <div v-if="isAdmin && isUltraLab">
        <v-row>
          <v-col>
            <ul class="text-body-2 text-right mb-0">
              <li v-if="selectionConfig.sequenceType !== 'DIFF'">
                Noise Factor: {{ Number.parseFloat(noiseFactor).toFixed(2) }}
              </li>
              <li v-if="selectionConfig.sequenceType === 'DIFF'">
                <div v-for="(_, index) in bNoiseFactor" :key="index">
                  B{{ index + 1 }} Noise Factor: {{ Number.parseFloat(bNoiseFactor[index]).toFixed(2) }}
                </div>
              </li>
              <!--
        <li>gradientRampTime: {{ Number.parseFloat(gradientRampTime).toFixed(2) }}</li>
        <li>rfPulseDuration: {{ Number.parseFloat(rfPulseDuration).toFixed(2) }}</li>
        <li>EchoSpacing: {{ Number.parseFloat(echoSpacing).toFixed(1) }}</li>
        <li>echoTrainLength: {{ Number.parseFloat(echoTrainLength).toFixed(2) }}</li>
        <li>minTE: {{ Number.parseFloat(minTEOptionsForTEandDIFF).toFixed(2) }}</li>
        -->
            </ul>
          </v-col>
          <!--
          <v-col>
            <ul class="text-body-2 text-right mb-0">
              <li v-if="selectionConfig.sequenceType !== 'DIFF'">
                Signal Average: {{ Number.parseFloat(signalAverage).toFixed(2) }}
              </li>
              <li v-if="selectionConfig.sequenceType === 'DIFF'">
                <div v-for="(_, index) in bSignalAverages" :key="index">
                  B{{ index + 1 }} Signal Average: {{ Number.parseFloat(bSignalAverages[index]).toFixed(2) }}
                </div>
              </li>
            </ul>
          </v-col>
          -->
          <!--
          <v-col>
            <ul class="text-body-2 text-right mb-0">
              <li v-if="selectionConfig.sequenceType !== 'DIFF'">
                SNR Average: {{ Number.parseFloat(selectionConfig.snr).toFixed(2) }}
              </li>
              <li v-if="selectionConfig.sequenceType === 'DIFF'">
                <div v-for="(_, index) in selectionConfig.bSnrs" :key="index">
                  B{{ index + 1 }} SNR Average: {{ Number.parseFloat(selectionConfig.bSnrs[index]).toFixed(2) }}
                </div>
              </li>
            </ul>
          </v-col>
          -->
        </v-row>
      </div>
    </template>
    <template v-else-if="displayMode == SELECTION_CONFIG_DISPLAY_MODE.CRITERIA_AND_PARAMETER">
      <v-tabs v-model="currentActiveTab" :show-arrows="false" class="criteria-and-parameter-tabs">
        <header class="tab-header">
          <div class="select-vendor-style-container">
            <v-select
              @change="changeVendorStylePreference"
              v-model="vendorStylePreference"
              :items="vendorStylePreferenceOptions"
              outlined
              dense
              hide-details
            ></v-select>
          </div>
          <div class="tab-container">
            <v-tab v-if="questionSet && !isEditingQuestion">{{ $t('global.question_criteria') }}</v-tab>
            <v-tab @click="questionTabOpen" :class="isSelectedTab && !isEditingQuestion && questionSet ? 'blink' : ''">
              <span :class="isSelectedTab && !isEditingQuestion && questionSet ? 'blink-text' : ''">{{
                $t('global.parameters')
              }}</span>
            </v-tab>
          </div>
        </header>

        <!-- This is the Question/Answer layout for non-CT lab test questions -->
        <!-- Question criteria tab -->
        <v-tab-item v-if="questionSet && !isEditingQuestion" class="tab-1">
          <v-row cols="12" align="center" justify="space-between" class="criteria_area flex-column">
            <v-card class="pt-3 pb-3 scan-view-options test-question-1 pa-5 w-100 mr-0">
              <v-row align="center" justify="space-between" class="">
                <v-card-title class="flex justify-space-between align-center">
                  <h5 class="mb-0">
                    {{ $t('global.question', languageCode) }}
                    {{ selectedStackQuestionIndexVisual }}
                    {{ $t('global.of', languageCode) }}
                    {{ stackQuestionsLength }}
                  </h5>
                  <v-row justify="end" align="center" class="mr-2" v-if="stackQuestionsLength > 1">
                    <div class="mr-4 cycle-question-button" @click="selectPrevQuestion">
                      <img v-if="selectedStackQuestionIndexVisual <= 1" src="@/assets/svg/back-button-disabled.svg" />
                      <img v-else src="@/assets/svg/back-button.svg" />
                    </div>
                    <div class="cycle-question-button" @click="selectNextQuestion">
                      <img
                        v-if="selectedStackQuestionIndexVisual >= stackQuestionsLength"
                        src="@/assets/svg/forward-button-disabled.svg"
                      />
                      <img v-else src="@/assets/svg/forward-button.svg" />
                    </div>
                  </v-row>
                </v-card-title>
              </v-row>
              <v-card-text class="pt-4 pl-0 text-12-rem">
                <span v-if="stackQuestion.freebie" class="freebie">({{ $t('MRI.optional') }})</span>
                <TranslatedContent
                  type="stackQuestion"
                  :record="stackQuestion"
                  :lookup="{ type: 'nestedKey', path: 'questionText' }"
                />
              </v-card-text>
            </v-card>
            <v-card class="pt-3 pb-3 scan-view-options test-question-1 pa-5 w-100">
              <v-row align="center" justify="space-between">
                <v-card-title class="flex-auto">
                  <div class="select-answer-criteria-container">
                    <h5 class="mb-0">{{ $t('global.answer_criteria') }}</h5>
                    <v-select
                      outlined
                      dense
                      hide-details
                      v-model="answerSelectionIdComputed"
                      :items="answersSelections"
                      :disabled="scanSubmitted"
                      :class="answerSelectionsHasUnseenChoice ? 'attention-outline' : ''"
                      class="select-answer-criteria"
                      @click="onLookedAtAnswerSelections()"
                    >
                      <template #item="{ item }">
                        <TranslatedContent
                          type="stackQuestion"
                          :record="stackQuestion"
                          :lookup="{
                            type: 'objectInArray',
                            arrayPath: 'answers',
                            identityKey: 'id',
                            identityValue: item.value,
                            objectKey: 'name',
                            defaultText: item.text,
                          }"
                        />
                      </template>
                      <template #selection="{ item }">
                        <TranslatedContent
                          type="stackQuestion"
                          :record="stackQuestion"
                          :lookup="{
                            type: 'objectInArray',
                            arrayPath: 'answers',
                            identityKey: 'id',
                            identityValue: item.value,
                            objectKey: 'name',
                            defaultText: item.text,
                          }"
                        />
                      </template>
                    </v-select>
                  </div>
                </v-card-title>
                <v-card-text class="pt-4 text-12-rem">
                  <v-row class="pt-0 truncated-field pa-4">
                    <TranslatedContent
                      type="stackQuestion"
                      v-if="!(isChallengeModeEnabledForMe || currentTestIsPreparedExam)"
                      :record="stackQuestion"
                      :lookup="{
                        type: 'objectInArray',
                        arrayPath: 'answers',
                        identityKey: 'id',
                        identityValue: answerCurrent.id,
                        objectKey: 'criteria',
                      }"
                    />
                  </v-row>
                  <v-row class="pt-0 pa-4" v-if="answerCurrent.citation && answerCurrent.citation.length > 0">
                    <strong class="mb-0">
                      <TranslatedContent
                        v-if="!(isChallengeModeEnabledForMe || currentTestIsPreparedExam)"
                        type="stackQuestion"
                        :record="stackQuestion"
                        :lookup="{
                          type: 'objectInArray',
                          arrayPath: 'answers',
                          identityKey: 'id',
                          identityValue: answerCurrent.id,
                          objectKey: 'citation',
                        }"
                      />
                    </strong>
                  </v-row>
                </v-card-text>
              </v-row>
            </v-card>
          </v-row>
        </v-tab-item>

        <!-- Parameters tab -->
        <v-tab-item>
          <div class="form-container ultralab-container">
            <v-row class="m-0 pt-2">
              <!-- Number of Slices -->
              <v-col cols="6" class="slice-form">
                <div v-if="isSingleSliceMode && !isIdentTypeProposed">
                  <div class="label-with-unit">
                    <label>{{ $t('global.height') }}</label>
                    <UnitCaption unit="(mm)" />
                  </div>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                    <b-form-input :type="'number'" v-model.number="dimensions3zHalf" :disabled="complete" />
                  </div>
                </div>
                <div v-if="!isSingleSliceMode">
                  <label class="white-space-nowrap">
                    {{ $t('global.number_of_slices') }}
                    <p-radio
                      class="p-svg p-plain p-smooth"
                      value="numberOfSlices"
                      v-model="heightChangeTarget"
                      name="heightChangeTarget"
                      toggle
                    >
                      <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                      <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                      <label slot="off-label"></label>
                    </p-radio>
                  </label>
                  <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                    <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                      <SpinButtonWithInput
                        @input="submitNumberOfSlices"
                        :type="'number'"
                        v-model.number="numberOfSlices"
                        :step="1"
                        :min="1"
                        :max="300"
                        :disabled="complete"
                      />
                    </div>
                  </div>
                </div>
              </v-col>
              <!-- Repetition Time -->
              <v-col cols="6" class="slice-form">
                <div>
                  <label>{{ $t('SelectionConfigForm.repetition_time') + '(ms)' }}</label>
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          @input="changeRepetitionTime"
                          :type="'number'"
                          :value="repetitionTime"
                          :step="1"
                          :min="1"
                          :max="15000"
                          class="input-number"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>
              <!-- Slice Thickness -->
              <v-col cols="6" class="slice-form">
                <div class="label-with-unit">
                  <label>{{ $t('global.slice_thickness_mm') }}</label>
                  <UnitCaption unit="(mm)" />
                </div>
                <div :class="paramHints.includes('resolution') ? 'param-hint-resolution' : ''">
                  <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                    <div :class="isCurrent ? 'input-lock' : 'min-max-lock'" class="align-items-center">
                      <SpinButtonWithInput
                        :step="0.5"
                        :min="0"
                        :max="60"
                        v-model.number="thickness"
                        @input="submitThickness"
                        :disabled="complete"
                      />
                      <p-radio
                        v-if="!isSingleSliceMode"
                        class="p-svg p-plain p-smooth ms-auto me-0"
                        value="thickness"
                        v-model="heightChangeTarget"
                        name="heightChangeTarget"
                        toggle
                      >
                        <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                        <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                        <label slot="off-label"></label>
                      </p-radio>
                    </div>
                  </div>
                </div>
              </v-col>

              <!-- Echo Time -->
              <v-col cols="6" class="slice-form">
                <div>
                  <label>{{ $t('SelectionConfigForm.echo_time') + '(ms)' }}</label>
                  <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                    <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                      <SpinButtonWithInput
                        v-if="
                          selectionConfig &&
                          (selectionConfig.sequenceType === 'TE' || selectionConfig.sequenceType === 'DIFF')
                        "
                        :step="echoSpacing"
                        :min="minTEOptionsForTEandDIFF"
                        :max="maxEchoTime"
                        :value="echoTime"
                        @input="changeEchoTime"
                      />
                      <SpinButtonWithInput
                        v-if="selectionConfig && selectionConfig.sequenceType === 'SE'"
                        :step="1"
                        :min="6"
                        :max="maxTEOptionsForSE"
                        :value="echoTime"
                        @input="changeEchoTime"
                      />
                      <SpinButtonWithInput
                        v-if="selectionConfig && selectionConfig.sequenceType === 'GRE'"
                        :step="1"
                        :min="1"
                        :max="maxTEOptionsForGRE"
                        :value="echoTime"
                        @input="changeEchoTime"
                      />
                    </div>
                  </div>
                </div>
              </v-col>

              <!-- Dist factor -->
              <v-col cols="6" class="slice-form">
                <div>
                  <div class="label-with-unit">
                    <label>{{
                      isForCT
                        ? $t('global.slice_interval')
                        : labels.gap[vendorStylePreference.trim()] || $t('global.slice_gap')
                    }}</label>
                    <UnitCaption
                      unit="(%)"
                      v-if="
                        (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') &&
                        !isAddLocalizerMode
                      "
                    />
                    <UnitCaption unit="(mm)" v-else />
                  </div>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'" :id="'tooltip-spacing' + selectionIdent">
                    <SpinButtonWithInput
                      :step="
                        (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') &&
                        !isAddLocalizerMode
                          ? 1
                          : 0.1
                      "
                      :min="0"
                      :max="
                        (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') &&
                        !isAddLocalizerMode
                          ? 100
                          : 50
                      "
                      v-model.number="spacing"
                      @input="submitSpacing"
                      :disabled="complete"
                      :allow-decimal="
                        (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') &&
                        !isAddLocalizerMode
                          ? false
                          : true
                      "
                    />
                    <p-radio
                      class="p-svg p-plain p-smooth"
                      value="spacing"
                      v-model="heightChangeTarget"
                      name="heightChangeTarget"
                      toggle
                      v-if="!isAddLocalizerMode && !isForCT"
                    >
                      <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                      <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                      <label slot="off-label"></label>
                    </p-radio>
                  </div>
                  <b-tooltip
                    :target="'tooltip-spacing' + selectionIdent"
                    triggers="hover"
                    :disabled="!(vendorStylePreference === 'siemens' || vendorStylePreference === 'united')"
                  >
                    {{ spacingTooltip + ' mm' }}
                  </b-tooltip>
                  <div class="font-weight-normal text-muted text-center">
                    Min: 0 | Max:
                    {{
                      (vendorStylePreference === 'siemens' || vendorStylePreference === 'united') && !isAddLocalizerMode
                        ? 100
                        : 50
                    }}
                  </div>
                </div>
              </v-col>

              <!-- Concantenations -->
              <v-col cols="6" class="slice-form">
                <div>
                  <div class="label-with-unit">
                    <label>{{ labels.concatenationLabel[vendorStylePreference.trim()] }}</label>
                  </div>
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          @input="changeConcatenations"
                          :type="'number'"
                          :value="concatenations"
                          :step="1"
                          :min="1"
                          :max="10"
                          :disabled="complete || selectionConfig.sequenceType === 'DIFF'"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>

              <!-- Oversampling -->
              <v-col cols="6" class="slice-form">
                <div>
                  <label>{{
                    labels.wrapPrevent[vendorStylePreference.trim()] + ' %' || $t('global.oversampling_mm')
                  }}</label>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                    <SpinButtonWithInput
                      @input="submitOversampling"
                      class="adj-input"
                      :type="'number'"
                      :step="1"
                      :min="1"
                      :max="100"
                      v-model.number="oversamplingPercentage"
                      :disabled="complete || isDisabledParameter"
                    />
                  </div>
                </div>
              </v-col>

              <!-- Averages -->
              <v-col cols="6" class="slice-form">
                <div>
                  <div class="label-with-unit">
                    <label>{{ labels.averageLabel[vendorStylePreference.trim()] }}</label>
                  </div>
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          @input="setAverages"
                          :type="'number'"
                          v-model.number="averages"
                          :step="1"
                          :min="1"
                          :max="8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>

              <!-- Frequency mm -->
              <v-col cols="6" class="slice-form">
                <div>
                  <div class="label-with-unit">
                    <label>{{ labels.frequencyFovLabel[vendorStylePreference] }}</label>
                    <UnitCaption unit="(cm)" v-if="['ge', 'canon'].includes(vendorStylePreference)" />
                    <UnitCaption unit="(mm)" v-else />
                  </div>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                    <SpinButtonWithInput
                      @input="submitDimensions3y"
                      :type="'number'"
                      v-model.number="dimensions3y"
                      :step="1"
                      :min="1"
                      :max="['ge', 'canon'].includes(vendorStylePreference) ? 50 : 500"
                      :disabled="complete || isDisabledParameter"
                    />
                  </div>
                </div>
              </v-col>
              <v-col cols="6" class="slice-form"></v-col>

              <!-- Phase FoV -->
              <v-col cols="6">
                <v-row>
                  <v-col cols="12" class="slice-form">
                    <div>
                      <div class="label-with-unit">
                        <label>{{ labels.phaseFovLabel[vendorStylePreference] }}</label>
                        <UnitCaption
                          unit="(%)"
                          v-if="vendorStylePreference === 'siemens' || vendorStylePreference === 'philips'"
                        />
                        <UnitCaption unit="(cm)" v-if="['ge', 'canon'].includes(vendorStylePreference)" />
                        <UnitCaption
                          unit="(mm)"
                          v-if="['ge', 'canon', 'siemens', 'philips'].indexOf(vendorStylePreference) < 0"
                        />
                      </div>
                      <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                        <SpinButtonWithInput
                          @input="submitDimensions3x"
                          :type="'number'"
                          v-model.number="dimensions3x"
                          :step="1"
                          :min="1"
                          :max="500"
                          :id="'dimensions3x_tooltip' + selectionIdent"
                          :disabled="complete || isDisabledParameter"
                        />
                      </div>
                      <b-tooltip
                        :target="'dimensions3x_tooltip' + selectionIdent"
                        triggers="hover"
                        :disabled="['ge', 'siemens', 'philips'].indexOf(vendorStylePreference) < 0"
                      >
                        {{ dimensions3xTooltip }}</b-tooltip
                      >
                    </div>
                  </v-col>
                  <v-col cols="12" class="slice-form">
                    <v-btn
                      tile
                      outlined
                      class="no-transform bold w-100 mt-8"
                      color="buttonBlue"
                      :disabled="complete || isDisabledParameter"
                      @click="onSwapPhase"
                    >
                      {{ labels.swap[vendorStylePreference.trim()] || $t('MRI.swap_phase') }}
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>

              <!-- Min. TR/Conc -->
              <v-col cols="6">
                <v-row>
                  <v-col cols="12" class="slice-form">
                    <label>{{ labels.minTRLabel[vendorStylePreference.trim()] }}</label>
                    <b-form-input :type="'number'" v-model.number="minConcatAcqPackage" disabled class="input-number" />
                  </v-col>
                  <v-col cols="12" class="slice-form">
                    <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                      <label>{{ $t('SelectionConfigForm.min_seq_tr') }}</label>
                      <b-form-input :type="'number'" v-model.number="minSeqTr" disabled class="input-number" />
                    </div>
                  </v-col>
                  <v-col cols="12" class="slice-form">
                    <label>{{ $t('SelectionConfigForm.min_seq_te') }}</label>
                    <b-form-input :type="'number'" v-model.number="minSeqTe" disabled class="input-number" />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </div>
        </v-tab-item>
      </v-tabs>
    </template>
    <template v-else-if="displayMode == SELECTION_CONFIG_DISPLAY_MODE.ULTRALAB_TAB">
      <div class="ultralab-tabs">
        <div class="tab-header">
          <div class="tab-item select-field-strength-container">
            <v-select v-model="fieldStrengthPreference" :items="availableFieldStrengthsOptions" dense hide-details />
          </div>
          <div class="tab-item scan-info-container">
            <div><AlarmIcon />{{ scanTime }}</div>
            <v-tooltip top>
              <template #activator="{ on, attrs }">
                <p class="resolution-label" v-bind="attrs" v-on="on">
                  <CubeOutlineIcon />{{ trueResolutionHeaderUltra }}
                </p>
              </template>
              <p class="resolution-tooltip">{{ $t('SelectionConfigForm.reconstructed-resolution') }}</p>
              <p class="resolution-tooltip">{{ acquiredResolutionHeader }}</p>
            </v-tooltip>
          </div>
          <div class="tab-item btn-turbo-container">
            <v-btn tile class="outline-btn no-transform bold btn-turbo" color="white" :value="'TE'">
              {{
                vendorStylePreference === 'philips' || vendorStylePreference === 'siemens'
                  ? $t('SelectionConfigForm.turbo_spin_echo')
                  : $t('SelectionConfigForm.fast_spin_echo')
              }}
            </v-btn>
          </div>
        </div>
        <v-tabs v-if="!isAddLocalizerMode" right class="pt-5">
          <v-tab>{{ $t('SelectionConfigForm.contrast') }}</v-tab>
          <v-tab>{{ $t('SelectionConfigForm.resolution') }}</v-tab>
          <v-tab>{{ $t('SelectionConfigForm.sequence') }}</v-tab>
          <v-tab>{{ $t('SelectionConfigForm.advanced') }}</v-tab>
          <v-tab v-if="showSpecialtyTab">{{ specialtyTabHeader }}</v-tab>
          <v-tab-item>
            <v-container fluid>
              <v-row>
                <v-col cols="6" class="slice-form pt-4">
                  <label>{{ $t('SelectionConfigForm.repetition_time') + '(ms)' }}</label>
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                      <div class="input-lock">
                        <SpinButtonWithInput
                          @input="changeRepetitionTime"
                          :type="'number'"
                          :value="repetitionTime"
                          :step="1"
                          :min="1"
                          :max="15000"
                          :disabled="complete"
                        />
                      </div>
                    </div>
                  </div>
                  <label>{{ $t('SelectionConfigForm.echo_time') + '(ms)' }}</label>
                  <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                    <div class="input-lock">
                      <SpinButtonWithInput
                        v-if="
                          selectionConfig &&
                          (selectionConfig.sequenceType === 'TE' || selectionConfig.sequenceType === 'DIFF')
                        "
                        :step="echoSpacing"
                        :min="echoSpacing"
                        :max="maxEchoTime"
                        :value="echoTime"
                        @input="changeSpin($event, 'echoTime')"
                      />
                      <SpinButtonWithInput
                        v-if="selectionConfig && selectionConfig.sequenceType === 'SE'"
                        :step="1"
                        :min="3"
                        :max="maxTEOptionsForSE"
                        :value="echoTime"
                        @input="changeSpin($event, 'echoTime')"
                      />
                      <SpinButtonWithInput
                        v-if="selectionConfig && selectionConfig.sequenceType === 'GRE'"
                        :step="1"
                        :min="1"
                        :max="maxTEOptionsForGRE"
                        :value="echoTime"
                        @input="changeSpin($event, 'echoTime')"
                      />
                    </div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <label>{{ labels.flipAngleLabel[vendorStylePreference] + '(°)' }}</label>
                  <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                    <b-form-input
                      :type="'number'"
                      v-model.number="flipAngle"
                      step="1"
                      min="1"
                      max="2000"
                      class="input-number"
                      style="border-radius: 17px"
                      :disabled="complete"
                    />
                  </div>
                  <div v-show="displayedSequenceType === 'SE' || displayedSequenceType === 'TE'">
                    <label>{{ $t('SelectionConfigForm.inversion_time') + '(ms)' }}</label>
                    <b-form-input
                      :type="'number'"
                      v-model.number="inversionTime"
                      step="1"
                      min="0"
                      max="2000"
                      class="input-number"
                      :disabled="
                        ((displayedSequenceType === 'SE' || displayedSequenceType === 'TE') && !inversionRecovery) ||
                        complete
                      "
                    />
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="slice-form">
                    <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                      <b-form-checkbox v-model="fatSuppression" :disabled="inversionRecovery || complete">
                        {{ $t('SelectionConfigForm.fat_saturation') }}
                      </b-form-checkbox>
                    </div>
                  </div>
                  <div
                    :style="{
                      visibility:
                        displayedSequenceType === 'SE' || displayedSequenceType === 'TE' ? 'visible' : 'hidden',
                    }"
                    class="slice-form"
                  >
                    <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                      <b-form-checkbox
                        v-model="inversionRecovery"
                        :disabled="fatSuppression || complete"
                        @change="toggleInversionRecovery"
                      >
                        {{ $t('SelectionConfigForm.inversion_recovery') }}
                      </b-form-checkbox>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-tab-item>
          <v-tab-item>
            <v-container fluid>
              <v-row>
                <v-col cols="6" class="slice-form pt-4">
                  <label>{{ labels.frequencyMatrixLabel[vendorStylePreference] }}</label>
                  <div :class="paramHints.includes('resolution') ? 'param-hint-resolution' : ''">
                    <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                      <div class="input-lock">
                        <SpinButtonWithInput
                          :step="32"
                          :min="64"
                          :max="512"
                          :value="frequencyMatrix"
                          @input="changeSpin($event, 'frequencyMatrix')"
                          :disabled="complete || isDisabledParameter || vendorStylePreference === 'philips'"
                        />
                      </div>
                    </div>
                  </div>
                  <label>{{ labels.phaseMatrixLabel[vendorStylePreference] + (vendorStylePreference === 'siemens' ? ' (%)' : '') }}</label>
                  <div :id="'phase_tooltip' + selectionIdent">
                    <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                      <div :class="paramHints.includes('resolution') ? 'param-hint-resolution' : ''">
                        <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                          <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                            <div class="input-lock" v-if="vendorStylePreference !== 'siemens'">
                              <SpinButtonWithInput
                                :step="stepForPhaseMatrix"
                                :min="minPhaseMatrix"
                                :max="maxPhaseMatrix"
                                :value="phaseMatrix"
                                @input="changeSpin($event, 'phaseMatrix')"
                                :disabled="complete || vendorStylePreference === 'philips'"
                              />
                            </div>
                            <b-form-input
                              :type="'number'"
                              :value="phaseMatrix"
                              :step="stepForPhaseMatrix"
                              :min="minPhaseMatrix"
                              :max="maxPhaseMatrix"
                              :disabled="complete"
                              @keyup.enter="(evt) => pressEnterKey(evt, 'phaseMatrix')"
                              @blur="(evt) => pressEnterKey(evt, 'phaseMatrix')"
                              v-if="vendorStylePreference === 'siemens'"
                              class="input-number"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <b-tooltip :target="'phase_tooltip' + selectionIdent" triggers="hover">
                    {{ phaseMatrixTooltip }}</b-tooltip
                  >
                </v-col>
                <v-col cols="6" class="slice-form pt-4" v-if="vendorStylePreference === 'philips'">
                  <label>{{ $t('global.frequency_voxel') }}</label>
                  <div class="input-lock">
                    <SpinButtonWithInput
                      :type="'number'"
                      :max="100"
                      :step="0.01"
                      :value="frequencyVoxelSize"
                      @input="changeFrequencyVoxelSize($event)"
                    />
                  </div>
                  <label>{{ $t('global.phase_voxel') }}</label>
                  <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                    <div class="input-lock">
                      <SpinButtonWithInput
                        :type="'number'"
                        :max="100"
                        :step="0.01"
                        :value="phaseVoxelSize"
                        @input="changePhaseVoxelSize($event)"
                      />
                    </div>
                  </div>
                </v-col>
                <v-col cols="6" class="slice-form pt-4">
                  <div v-if="selectionConfig && selectionConfig.sequenceType === 'TE'">
                    <label>{{ labels.echoTrainLabel[vendorStylePreference.trim()] }}</label>
                    <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                      <div :class="paramHints.includes('resolution') ? 'param-hint-resolution' : ''">
                        <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                          <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                            <div class="input-lock">
                              <SpinButtonWithInput
                                :step="1"
                                :min="1"
                                :max="512"
                                :value="echoTrainLength"
                                @input="changeSpin($event, 'echoTrainLength')"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                    <div
                      :class="
                        paramHints.includes('resolution') && selectionConfig && selectionConfig.sequenceType === 'GRE'
                          ? 'param-hint-resolution'
                          : ''
                      "
                    >
                      <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                        <div
                          :class="
                            paramHints.includes('snr') && selectionConfig && selectionConfig.sequenceType !== 'GRE'
                              ? 'param-hint-snr'
                              : ''
                          "
                        >
                          <label>{{ labels.resolutionPritial[vendorStylePreference.trim()] }}</label>
                          <v-select v-model="partialFourier" :items="fourierItems" solo></v-select>
                        </div>
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-tab-item>
          <v-tab-item>
            <v-container>
              <v-row>
                <v-col class="pa-2">
                  <v-btn-toggle
                    @change="changeSequenceType"
                    v-model="selectionConfig.sequenceType"
                    class="btn-group-toggle-sequence"
                  >
                    <v-btn tile outlined class="no-transform bold" color="buttonBlue" :value="'GRE'" width="130">
                      {{ labels.sequenceTypeLabel[vendorStylePreference].GRE }}
                    </v-btn>
                    <v-btn
                      tile
                      outlined
                      class="outline-btn no-transform bold"
                      color="buttonBlue"
                      :value="'SE'"
                      width="130"
                    >
                      {{ $t('SelectionConfigForm.spin_echo') }}
                    </v-btn>
                    <v-btn
                      tile
                      outlined
                      class="outline-btn no-transform bold"
                      color="buttonBlue"
                      :value="'TE'"
                      width="130"
                    >
                      {{
                        vendorStylePreference === 'philips' || vendorStylePreference === 'siemens'
                          ? $t('SelectionConfigForm.turbo_spin_echo')
                          : $t('SelectionConfigForm.fast_spin_echo')
                      }}
                    </v-btn>
                    <v-btn
                      v-if="showDiffusionSequenceOption"
                      tile
                      outlined
                      class="outline-btn no-transform bold"
                      color="buttonBlue"
                      :value="'DIFF'"
                      width="130"
                    >
                      {{
                        vendorStylePreference === 'philips' || vendorStylePreference === 'siemens'
                          ? $t('SelectionConfigForm.spin_echo_diffusion')
                          : $t('SelectionConfigForm.spin_echo_diffusion')
                      }}
                    </v-btn>
                  </v-btn-toggle>
                  <InteractableForm class="mt-3" v-if="interactableFormVisible" />
                </v-col>
              </v-row>
            </v-container>
          </v-tab-item>
          <v-tab-item>
            <v-container fluid>
              <v-row>
                <v-col cols="6">
                  <div class="label-with-unit text-left">
                    <label>{{ $t('SelectionConfigForm.receiver_bandwidth') }}</label>
                    <UnitCaption unit="(kHz)" v-if="vendorStylePreference === 'ge'" />
                    <UnitCaption unit="(pixel)" v-else-if="vendorStylePreference === 'philips'" />
                    <UnitCaption unit="(Hz/px)" v-else />
                  </div>
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                      <div :id="'tooltip-receiver-bandwidth' + selectionIdent">
                        <b-form-input
                          :type="'number'"
                          :value="receiverBandWidth"
                          step="1"
                          min="vendorStylePreference === 'siemens' ? 100 : 1"
                          class="input-number"
                          style="border-radius: 17px"
                          @change="onBandwidthChangedByUser"
                        />
                        <b-tooltip
                          v-if="isUltraLab && vendorStylePreference !== 'philips'"
                          :target="'tooltip-receiver-bandwidth' + selectionIdent"
                          triggers="hover"
                        >
                          {{ 'Fat/Water Shift ' + receiverBandwidthTooltip + ' pxl' }}
                        </b-tooltip>
                        <b-tooltip
                          v-else-if="isUltraLab && vendorStylePreference === 'philips'"
                          :target="'tooltip-receiver-bandwidth' + selectionIdent"
                          triggers="hover"
                        >
                          {{ receiverBandwidthTooltip + ' (Hz/px)' }}
                        </b-tooltip>
                      </div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                    <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                      <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                        <label>{{ labels.parallelFactor[vendorStylePreference.trim()] }}</label>
                        <v-select
                          v-model="parallelFactor"
                          :items="parallelFactors[vendorStylePreference.trim()]"
                          solo
                          dense
                        ></v-select>
                      </div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div v-if="selectionConfig.sequenceType === 'TE' || selectionConfig.sequenceType === 'DIFF'">
                    <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                      <label>{{ labels.timeBetweenEchoes[vendorStylePreference.trim()] + '(ms)' }}</label>
                      <v-text-field :type="'number'" v-model.number="echoSpacing" dense solo disabled></v-text-field>
                    </div>
                    <!--
                      <label>{{ labels.timeBetweenEchoes[vendorStylePreference.trim()] + '(ms)' }}</label>
                      <v-select
                        :disabled="selectionConfig.sequenceType !== 'TE'"
                        v-model="echoSpacing"
                        :items="echoSpacings"
                        solo
                        dense
                      ></v-select>
                      -->
                  </div>
                </v-col>
              </v-row>
              <v-row class="mt-0">
                <v-col cols="6">
                  <div :class="paramHints.includes('rf') ? 'param-hint-rf' : ''">
                    <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                      <label>{{ 'RF Pulsing' }}</label>
                      <v-select
                        v-model="rfPulsing"
                        :items="rfPulsingItems"
                        item-title="text"
                        item-value="value"
                        solo
                        dense
                      ></v-select>
                    </div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                    <label>{{ 'Gradient Ramp' }}</label>
                    <v-select
                      v-model="gradientRamp"
                      :items="gradientRampItems"
                      item-title="text"
                      item-value="value"
                      solo
                      dense
                    ></v-select>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-tab-item>
          <v-tab-item v-if="showSpecialtyTab">
            <v-container fluid>
              <v-row v-if="isEditingQuestion">
                <v-col>
                  <v-select v-model="specialtyOption" :items="specialtyOptionItems" class="w-50" solo dense></v-select>
                </v-col>
              </v-row>
              <v-row v-if="specialtyOption === 'Diffusion'">
                <v-col cols="12">
                  <v-row>
                    <v-col cols="8">
                      {{ 'Diffusion Directions' }}
                    </v-col>
                    <v-col cols="4" class="p-2">
                      <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                        <v-select
                          label="Diffusion Direction"
                          v-model="diffusionDirections"
                          :items="diffusionDirectionItems"
                          solo
                          dense
                          hide-details
                          class="m-1"
                        ></v-select>
                      </div>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="8">
                      {{ 'Number of B-Values' }}
                    </v-col>
                    <v-col cols="4">
                      <div class="slice-form px-0 mb-0">
                        <div class="input-lock w-100">
                          <SpinButtonWithInput
                            :step="1"
                            :min="1"
                            :max="4"
                            :value="numBValues"
                            @input="changeSpin($event, 'numBValues')"
                          />
                        </div>
                      </div>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col>
                      <v-checkbox v-model="diffusionADC" label="ADC" class="p-2" :disabled="adcDisabled"></v-checkbox>
                    </v-col>
                  </v-row>
                </v-col>
                <v-col cols="12">
                  <v-row>
                    <v-col cols="5">
                      {{ 'B-Values' }}
                    </v-col>
                    <v-col cols="5">
                      {{ 'B-Averages' }}
                    </v-col>
                    <v-col cols="2">
                      <!-- Empty column for alignment -->
                    </v-col>
                  </v-row>
                  <v-row v-for="(_, index) in numBValues" class="p-0 m-0" :key="index">
                    <v-col cols="5" class="slice-form p-0 m-0">
                      <div class="input-lock">
                        <SpinButtonWithInput
                          :step="1"
                          :min="
                            index === 0
                              ? (numBValues === 1 ? 50 : 0)
                              : index === numBValues - 1
                              ? Math.max(50, bValues[index - 1] + 1)
                              : bValues[index - 1] + 1
                          "
                          :max="5000"
                          :value="bValues[index]"
                          @input="(value) => changeBValueSpin(value, index)"
                        />
                      </div>
                    </v-col>
                    <v-col cols="5" class="slice-form p-0 m-0">
                      <div :class="paramHints.includes('time') ? 'param-hint-time' : ''">
                        <div :class="paramHints.includes('snr') ? 'param-hint-snr' : ''">
                          <div class="input-lock">
                            <SpinButtonWithInput
                              :step="1"
                              :min="1"
                              :max="20"
                              :value="bAverages[index]"
                              @input="(value) => changeBAveragesSpin(value, index)"
                            />
                          </div>
                        </div>
                      </div>
                    </v-col>
                    <v-col cols="2">
                      <!-- Empty column for alignment -->
                    </v-col>
                  </v-row>
                  <v-row v-if="numBValues > 0" class="p-0 m-0">
                    <v-col cols="12" class="text-caption text-muted pa-2"> Maximum b-value must be ≥ 50 </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="7">
                      {{ labels.timeBetweenEchoes[vendorStylePreference.trim()] + '(ms)' }}
                    </v-col>
                    <v-col cols="5">
                      <v-text-field
                        :type="'number'"
                        v-model.number="echoSpacing"
                        :label="labels.timeBetweenEchoes[vendorStylePreference.trim()] + '(ms)'"
                        dense
                        solo
                        disabled
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-container>
          </v-tab-item>
        </v-tabs>
      </div>
    </template>
    <b-modal
      id="modal-copy-selection-config"
      :title="`Copy parameter from`"
      centered
      ok-only
      @ok="onCopySelectionConfig()"
    >
      <template #modal-ok>
        {{ $t('global.okay') }}
      </template>

      <template #modal-cancel>
        {{ $t('global.cancel') }}
      </template>

      <div class="modal-copy-selection-config-radio-group">
        <div v-if="sameKindAnsweredQuestionWithStackQuestion.length == 0">No available question to copy!</div>
        <v-radio-group row v-model="selectedCopyQuestionId" v-else>
          <v-radio
            v-for="item in sameKindAnsweredQuestionWithStackQuestion"
            :key="item.id"
            :label="item.questionText"
            :value="item.id"
          ></v-radio>
        </v-radio-group>
      </div>
    </b-modal>
  </div>
</template>

<script>
// @ is an alias to /src
import { SelectionConfigMixin } from './Mixins/SelectionConfigMixin'
import { AsyncChangeHandlerMixin } from './Mixins/AsyncChangeHandlerMixin'
import _ from 'lodash'
import ArrowRightBoldIcon from 'icons/ArrowRightBold'
import ArrowRightIcon from 'icons/ArrowRight'
import UnitCaption from './UnitCaption'
import SpinButtonWithInput from './SpinButtonWithInput.vue'
import PitchSpinButtonWithInput from './PitchSpinButtonWithInput.vue'
import SelectionConfigECGChart from './SelectionConfigECGChart.vue'
import TranslatedContent from '@/components/TranslatedContent'
import EventBus from '@/lib/event-bus'
import AlarmIcon from 'icons/Alarm'
import CubeOutlineIcon from 'icons/CubeOutline'
import { mapActions } from 'vuex'
import InteractableForm from '@/components/InteractableForm'

export default {
  name: 'SelectionConfigForm',
  mixins: [SelectionConfigMixin, AsyncChangeHandlerMixin],
  components: {
    ArrowRightBoldIcon,
    ArrowRightIcon,
    UnitCaption,
    TranslatedContent,
    SpinButtonWithInput,
    PitchSpinButtonWithInput,
    AlarmIcon,
    CubeOutlineIcon,
    SelectionConfigECGChart,
    InteractableForm,
  },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
    isUltraLab: {
      type: Boolean,
      required: false,
      default: false,
    },
    paramHints: {
      type: Array,
      required: false,
      default: () => [],
    },
    useInitialUltraLabDefaults: {
      type: Boolean,
      required: false,
      default: true,
    },
    displayMode: {
      type: String,
      required: false,
      default: 'default',
    },
  },
  beforeMount() {
    this.fieldStrengthPreference = this.$store.getters['user/fieldStrengthPreference']
    if (this.isUltraLab) {
      if (!this.inversionRecovery) this.inversionTime = 0
      if (this.useInitialUltraLabDefaults) {
        this.setInitialUltraLabDefaults()
      }
    }
  },
  mounted() {
    EventBus.$on('onSliceViewWindowChange', this.onSliceViewWindowChange)
    if (this.minConcatAcqPackage > this.repetitionTime) {
      if (this.selectionConfig?.sequenceType === 'TE') {
        this.concatenations = _.round(
          ((this.echoSpacing + 5) * (this.echoTrainLength ? this.echoTrainLength : 1) * this.numberOfSlices) /
            this.repetitionTime
        )
      } else if (this.selectionConfig?.sequenceType === 'SE') {
        this.concatenations = _.round(((this.echoSpacing + 5) * this.numberOfSlices) / this.repetitionTime)
        if (this.concatenations <= 1) {
          this.concatenations = 2
        }
      }
    }
    // this.$emit('selection-config-mounted')
    this.setScanDurationOfConfig(this.scanTimeCT)

    //start counting when user changes tabs or windowLevelWidth
    window.addEventListener('blur', this.adjustLostWindowFocus, false)

    const INITIAL_LOADING_DURATION = 7000 // 7 seconds, adjust as needed
    setTimeout(() => {
      console.log('initial loading phase over')
      this.isInitialLoadingPhase = false
    }, INITIAL_LOADING_DURATION)
  },
  beforeDestroy() {
    EventBus.$off('onSliceViewWindowChange', this.onSliceViewWindowChange)
    //stop counting when user changes tabs or windowLevelWidth
    window.removeEventListener('blur', this.adjustLostWindowFocus, false)
  },
  methods: {
    ...mapActions('selectionConfig', ['adjustLostWindowFocus', 'resetSelection']),
  },
}
</script>

<style scoped lang="scss">
.gap-2 {
  gap: 2rem;
}
.gap-1 {
  gap: 1rem;
}
::v-deep .theme--light.v-text-field--solo > .v-input__control > .v-input__slot {
  background: white !important;
}
::v-deep .theme--light.v-select .v-select__selections {
  color: rgba(0, 0, 0, 0.87) !important;
}
.group-fields-container {
  display: flex;
  align-items: center;
  gap: 10px;
  .text-x {
    padding-top: 20px;
  }
}
.n-container {
  display: flex;
  flex-wrap: wrap;
}
.n-col {
  flex-basis: 33.3%;
}
.n-2col {
  flex-basis: 66.6%;
}
.slice-form .input-lock,
.slice-form .min-max-lock {
  width: 130px;
}

/* Active confirm button border */
.active-confirm-button {
  border: 4px solid #f2a14a !important;
}
</style>

<style lang="scss">
@keyframes mdi-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.mdi-spin {
  animation: mdi-spin 1s linear infinite;
}

.text-12-rem {
  font-size: 1.2rem;
}
.criteria-and-parameter-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  .v-tabs-bar {
    background-color: transparent !important;
    .v-slide-group__wrapper {
      background: transparent;
      .v-slide-group__content {
        background: transparent;
        .v-tabs-slider-wrapper {
          display: none;
        }
      }
    }
  }
  .tab-header {
    background: transparent;
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
    width: 100%;
    .select-vendor-style-container {
      width: 150px;
    }
    .tab-container {
      display: flex;
      align-items: end;
      .v-tab {
        font-size: 0.7rem;
        padding: 6px 6px;
        border: solid 1px #c5c6c7;
        height: fit-content;
        transition: all 0.3s ease;
        font-weight: 500;
        &.v-tab--active {
          padding: 12px 6px;
        }
      }
    }
  }
  .v-tabs-items {
    border: solid 2px #c5c6c7;
    height: auto;
    background: $white;
    flex: auto;
    .select-answer-criteria-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: auto;
      .select-answer-criteria {
        width: 0px;
        flex: auto;
      }
    }
  }
}
.ultralab-tabs {
  background-color: $white;
  height: 100%;
  display: flex;
  flex-direction: column;
  .tab-header {
    display: flex;
    justify-content: space-between;
    .tab-item {
      font-size: 0.5rem;
      border: solid 1px #c5c6c7;
      flex: auto;
      &.btn-turbo-container {
        width: fit-content;
        flex: 0;
      }
    }
    .scan-info-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: center;
      font-size: 0.7rem;
      .resolution-tooltip {
        font-size: 0.7rem !important;
      }
    }
    .select-field-strength-container {
      padding: 0 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      .v-input {
        width: 40px;
        font-size: 0.7rem;
        .v-input__control {
          .v-input__slot {
            &::before {
              display: none;
            }
          }
        }
      }
    }
    .btn-turbo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      .btn-turbo {
        font-size: 0.7rem;
        font-weight: 500;
        padding: 6px 6px;
        box-shadow: none;
      }
    }
  }
  .v-tabs-bar {
    background-color: transparent !important;
    .v-slide-group__wrapper {
      background: transparent;
      .v-slide-group__content {
        background: transparent;
      }
    }
  }
  .v-tabs {
    border: solid 2px #c5c6c7;
    .v-tabs-items {
      background: transparent;
    }
  }
  .btn-group-toggle-sequence {
    overflow-x: auto;
    button {
      padding: 0px 0.5rem !important;
      width: auto !important;
    }
  }
}
.ct-radio-group {
  .v-input__control {
    .v-messages {
      display: none;
    }
    .v-input__slot {
      .v-label {
        margin-bottom: 0;
      }
    }
  }
}
.ct-checkbox {
  .v-input__control {
    .v-messages {
      display: none;
    }
    .v-input__slot {
      .v-label {
        margin-bottom: 0;
      }
    }
  }
}
.ct-select {
  .v-input__control {
    .v-text-field__details {
      display: none;
    }
    .v-input__slot {
      .v-label {
        margin-bottom: 0;
      }
    }
  }
}
.slice-form-ct-scan-direction {
  .v-input--radio-group {
    margin-top: 0;
    .v-input__control {
      .v-input__slot {
        margin-bottom: 0;
      }
      .v-messages {
        display: none;
      }
    }
  }
}
.config-tabs-header-suffix-container {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 12px;
  margin-left: 20px;
}
.slice-scan-delay-form {
  position: relative;
  min-height: 40px;
  width: 100px;
  label {
    left: 20px;
    right: auto;
    position: absolute;
    color: rgba(0, 0, 0, 0.6);
    top: -10px;
    height: 20px;
    line-height: 20px;
    letter-spacing: normal;
    font-size: 13px !important;
    font-weight: 700;
    transform: scale(0.75);
    background: #ffffff;
    padding: 0 2px;
    z-index: 4;
  }
  .spin-btn-grp {
    display: flex;
    border: 1px solid $border-gray !important;
    min-height: 40px;
    border-radius: 4px;
  }
}
.header-gradient-region {
  background-image: $gradient-gray !important;
  border: 0;
}

/* Disable up/down arrows on number inputs */
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Disable up/down arrows on number inputs */
/* Firefox */
input[type='number'] {
  -moz-appearance: textfield;
}

header {
  display: flex;
  justify-content: space-between;
}

.form-container {
  display: flex;
}
.tab-1 {
  display: flex;
}
.disabled-cycle-button {
  color: $gray-two;
}

.selection-config-form {
  background: $white;
  padding: $spacing-standard;
  box-shadow: 0px 0px 10px rgba(11, 49, 51, 0.25);
  flex-grow: 3;
  height: 100%;

  label {
    font-size: 13px;
    margin-bottom: 0;
    &.white-space-nowrap {
      white-space: nowrap;
    }
  }
  &:has(.criteria-and-parameter-tabs),
  &:has(.ultralab-tabs) {
    padding: 0;
    box-shadow: none;
    background: transparent;
  }
}
.freebie {
  color: red;
  font-size: 1.2rem;
  font-weight: bold;
  margin-right: 0.2rem;
}

.blink {
  font-family: inherit;
  outline: 2px solid #c1521c !important;
  outline-offset: -2px;
  color: #c1521c !important;
}
.blink-text {
  animation: blinker 1.5s linear infinite;
  color: #c1521c !important;
}
@keyframes blinker {
  50% {
    opacity: 0;
  }
}

.breathing-instruction-glow {
  border-radius: 4px;
  animation: breathing-instruction-glow 1500ms infinite;
}
.breathing-instruction-glow .v-input__slot fieldset {
  border: 3px solid #f5a94a !important;
}
.breathing-instruction-glow .v-label {
  color: #000 !important;
  font-size: 16px;
  font-weight: 600;
}
.breathing-instruction-glow fieldset legend {
  font-size: 16px;
}
/* Allow the breathing-instruction glow's box-shadow to extend
   outside Vuetify's tab bar, which clips by default. */
.v-tabs > .v-tabs-bar,
.v-tabs > .v-tabs-bar .v-slide-group__wrapper,
.v-tabs > .v-tabs-bar .v-slide-group__content {
  overflow: visible;
}
@keyframes breathing-instruction-glow {
  0% {
    box-shadow: 0 0 3px #f5a94a;
  }
  50% {
    box-shadow: 0 0 20px #f5a94a;
  }
  100% {
    box-shadow: 0 0 3px #f5a94a;
  }
}
.truncated-field {
  height: 4rem;
  overflow: hidden;
  margin-bottom: 18px !important;
}

.label-with-unit {
  display: flex;
  justify-content: space-between;
  &.highlight {
    color: #d31246;
  }
}
.cycle-question-button {
  cursor: pointer;
  font-size: 22px;
  color: $light-blue;
  user-select: none;
}
.theme--light.v-card .v-card__subtitle,
.theme--light.v-card > .v-card__text {
  color: $black;
}
.scan-view-options {
  background-color: $white;
  flex-grow: 1;

  header {
    font-weight: bold;
  }
}

.ultralab-container .slice-form {
  display: flex;
  padding: 0 15px;
  text-align: left;
  flex-direction: column;
  margin-bottom: $spacing-small;

  input {
    border-radius: 1em;
  }

  .input-lock,
  .min-max-lock {
    display: flex;
    border: 1px solid $border-gray;
    border-radius: 1em;
    align-items: baseline;
    justify-content: space-between;
    min-width: 5em;
    width: auto;
    input {
      border: none;
    }
    .b-form-input {
      width: 100%;
      margin-bottom: 10px;
    }
  }
}

// Added !important here because p tags have margins set for some reason
.resolution-label {
  margin-bottom: 0px !important;
  font-size: 12px;
  color: $gray-three;
}
.resolution-tooltip {
  margin-bottom: 0 !important;
  font-size: 12px !important;
}

.current-selection {
  font-weight: bold;
}
.v-tab--active {
  animation-play-state: paused;
  color: #247ba0 !important;
}
.submit-button-container {
  justify-content: space-between;
  flex-direction: column;
  display: flex;

  .submit-button-holder {
    justify-content: flex-end;
    display: flex;
  }
}

.v-tabs {
  width: unset;
}

.v-tabs--vertical > .v-tabs-bar .v-tabs-bar__content {
  background-color: $white;
  color: $white;
}

.v-btn.no-transform {
  text-transform: none;
  letter-spacing: 0;
}
.attention-outline {
  outline: #ff9d2f solid 3px;
}

.cl-button {
  width: 80px;
  user-select: none;
  outline: none;

  &.active {
    color: $white !important;
    border-color: $button-blue;
    background: $button-blue;
  }
}
.input-number {
  min-width: 5em;
}
.test-question-1 {
  width: 33%;
  min-height: 170px;
  text-align: left;
  margin-right: 30px;
  &:first-child {
    width: 3%;
  }
  &:last-child {
    margin-right: 0;
  }
}
.criteria_area {
  margin-top: -5px;
}
.slice-form-ct {
  margin-bottom: 6px !important;
  .label-with-unit {
    label {
      margin-bottom: 2px;
    }
  }
}
.slice-form {
  display: flex;
  padding: 0 24px;
  text-align: left;
  flex-direction: column;

  margin-bottom: $spacing-small;

  input {
    border-radius: 1em;
  }

  .input-lock,
  .min-max-lock {
    display: flex;
    border: 1px solid $border-gray;
    border-radius: 1em;
    align-items: center;
    height: 35px;
    width: 150px;
    justify-content: space-between;

    input {
      border: none;
    }
  }
}

.hotkey-list {
  p {
    text-align: left;
  }
}

.v-text-field {
  margin-top: 0;
  padding-top: 0;
}

.param-hint-snr {
  border: 2px solid blue;
  border-radius: 17px;
}
.param-hint-time {
  border: 2px solid #ffc107;
  border-radius: 17px;
}
.param-hint-resolution {
  border: 2px solid green;
  border-radius: 17px;
}
.param-hint-rf {
  border: 2px solid red;
  border-radius: 17px;
}
.outline-red {
  outline: 3px solid red;
}
.outline-blue {
  outline: 3px solid blue;
}
.outline-yellow {
  border: 3px solid #ffe215;
  border-radius: 20px;
}
.ctdi-dlp-container {
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 2px;
  justify-content: center;
}
</style>
