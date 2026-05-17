<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-col :style="localSoftwareVersionPreference === 'r57' ? 'padding:0' : ''">
    <div class="xa-class-1" v-if="localSoftwareVersionPreference === 'xa' && isTestParameterValid === true">
      <MainScreen />
    </div>
    <div class="xa-class-1" v-if="localSoftwareVersionPreference === 'b19' && isTestParameterValid === true">
      <BmainScreen />
    </div>
    <div class="Ph-class-1" v-if="localSoftwareVersionPreference === 'r57' && isTestParameterValid === true">
      <PhmainScreen />
    </div>
    <div class="xa-class-1" v-if="localSoftwareVersionPreference === 'lx' && isTestParameterValid === true">
      <GEmainScreen />
    </div>

    <v-dialog v-model="showAbandonDialog" persistent width="50%">
      <v-card>
        <v-card-title class="headline">
          {{ $t('MRI.abandon_title', languageCode) }}
        </v-card-title>
        <v-card-text>
          {{ $t('MRI.abandon_description', languageCode) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="resumeExam">{{ $t('MRI.resume', languageCode) }}</v-btn>
          <v-btn color="error" @click="abandonExam">{{ $t('MRI.abandon', languageCode) }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showSandboxModeDialog" width="50%">
      <v-card>
        <v-card-title class="headline">
          {{ $t('MRI.sandbox_dialog_title', languageCode) }}
        </v-card-title>

        <v-card-text>
          {{ $t('MRI.sandbox_dialog_body', languageCode) }}
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showSandboxModeDialog = false">{{ $t('global.close', languageCode) }}</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <WebGLSupportCheckModal></WebGLSupportCheckModal>

    <CombinedTestResults
      v-if="
        testResultAugmented &&
        ((localSoftwareVersionPreference !== 'xa' &&
          localSoftwareVersionPreference !== 'b19' &&
          localSoftwareVersionPreference !== 'lx' &&
          localSoftwareVersionPreference !== 'r57') ||
          (localSoftwareVersionPreference === 'xa' && isTestParameterValid === false) ||
          (localSoftwareVersionPreference === 'b19' && isTestParameterValid === false) ||
          (localSoftwareVersionPreference === 'lx' && isTestParameterValid === false) ||
          (localSoftwareVersionPreference === 'r57' && isTestParameterValid === false))
      "
      :test-results="testResultAugmented"
      :is-ultra-lab="isUltraLab"
    />

    <div
      v-if="
        !isLoadedAndReady &&
        !testResultAugmented &&
        ((localSoftwareVersionPreference !== 'xa' &&
          localSoftwareVersionPreference !== 'b19' &&
          localSoftwareVersionPreference !== 'lx' &&
          localSoftwareVersionPreference !== 'r57') ||
          (localSoftwareVersionPreference === 'xa' && isTestParameterValid === false) ||
          (localSoftwareVersionPreference === 'b19' && isTestParameterValid === false) ||
          (localSoftwareVersionPreference === 'lx' && isTestParameterValid === false) ||
          (localSoftwareVersionPreference === 'r57' && isTestParameterValid === false))
      "
    >
      <LoadingBeaker
        v-if="!isViewingCriticalThinkingQuestion || !isLoadedScreeningForm"
        :loading-percentage="progressTotal"
      />
      <CriticalThinkingQuiz v-if="!isEditingQuestion && isViewingCriticalThinkingQuestion && isLoadedScreeningForm" />
    </div>

    <div v-else-if="isRetryingAnswerSubmission">
      {{ $t('global.retrying_answer_submission_check_network') }}
    </div>

    <template
      v-else-if="
        !testResultAugmented &&
        isLoadedAndReady &&
        (localSoftwareVersionPreference !== SOFTWARE_VERSION.NEWUI || isCTLab || (isEditingQuestion && questionSet)) &&
        ((localSoftwareVersionPreference !== 'xa' &&
          localSoftwareVersionPreference !== 'b19' &&
          localSoftwareVersionPreference !== 'lx' &&
          localSoftwareVersionPreference !== 'r57') ||
          (localSoftwareVersionPreference === 'xa' && isTestParameterValid === false) ||
          (localSoftwareVersionPreference === 'b19' && isTestParameterValid === false) ||
          (localSoftwareVersionPreference === 'lx' && isTestParameterValid === false) ||
          (localSoftwareVersionPreference === 'r57' && isTestParameterValid === false))
      "
    >
      <div v-if="isEditingQuestion && questionSet">
        <StackQuestionEdit />
      </div>
      <v-stepper
        v-if="!isCTLab"
        class="mb-1 question-stepper"
        alt-labels
        non-linear
        v-model="selectedStackQuestionIndexVisual"
        @change="jumpToStackQuestion"
      >
        <v-stepper-header>
          <template v-for="(stackQuestion, idx) of stackQuestions">
            <v-stepper-step
              :class="{ disabled: !!!(!isCTLab || (isCTLab && (isEditingQuestion || isAnsweredPrevQuestion(idx)))) }"
              :editable="!!(!isCTLab || (isCTLab && (isEditingQuestion || isAnsweredPrevQuestion(idx))))"
              class="step"
              :step="idx + 1"
              edit-icon="check"
              :key="`${idx}-step`"
              complete-icon="check"
              :complete="scanSubmittedByStackQuestionId[stackQuestion.id]"
            >
              <span class="text-center">
                {{
                  stackQuestion.title
                    ? stackQuestion.title
                    : stackQuestion.questionText.split(' ').slice(0, 4).join(' ')
                }}
              </span>
              <br />
            </v-stepper-step>
            <v-divider v-if="idx < stackQuestions.length - 1" :key="idx"></v-divider>
          </template>
        </v-stepper-header>
      </v-stepper>
      <v-col v-if="testIds" class="column-space">
        <ScorePreviewCT
          v-if="isCTLab"
          :is-admin="isAdmin"
          :is-sandbox="test.isSandbox"
          :is-ct-lab="isCTLab"
          :is-answered-current-question="isAnsweredCurrentQuestionOrStartScan"
          :is-manager="isManager"
          :test-run-state="testRunState"
          :is-acquisition="isAcquisitionQuestion"
          :is-reconstruction="isReconstructionQuestion"
        />
        <ScorePreviewUltraLab
          v-else-if="isUltraLab"
          :is-admin="isAdmin"
          :is-sandbox="test.isSandbox"
          :is-manager="isManager"
          :is-freebie="isFreebie"
        />
        <ScorePreviewContrast
          v-else-if="isContrastLab"
          :is-admin="isAdmin"
          :is-sandbox="test.isSandbox"
          :is-answered-current-question="isAnsweredCurrentQuestionOrStartScan"
          :is-manager="isManager"
          :is-freebie="isFreebie"
        />
        <ScorePreviewResolution
          v-else-if="isResolutionLab"
          :is-admin="isAdmin"
          :is-sandbox="test.isSandbox"
          :is-resolution-lab="isResolutionLab"
          :is-answered-current-question="isAnsweredCurrentQuestionOrStartScan"
          :is-manager="isManager"
          :is-freebie="isFreebie"
        />
        <ScorePreviewMRBasic
          v-else-if="!isCTLab && !isUltraLab && !isContrastLab && !isResolutionLab"
          :is-admin="isAdmin"
          :is-sandbox="test.isSandbox"
          :is-answered-current-question="isAnsweredCurrentQuestionOrStartScan"
          :is-manager="isManager"
          :is-freebie="isFreebie"
        />

        <v-card
          v-if="isAdmin && testRunState !== 'INJECTOR' && testRunState !== 'POSITION' && testRunState !== 'LANDMARK'"
          :class="`rubric-holder${rubricPanel === 0 ? ' force-visible' : ''}`"
        >
          <v-expansion-panels v-model="rubricPanel" accordion>
            <v-expansion-panel style="background-color: #fffef9">
              <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
              <v-expansion-panel-header>Rubric</v-expansion-panel-header>
              <v-expansion-panel-content class="admin-only-score-preview-content">
                <div v-if="isAdmin && stackQuestion && stackQuestion.rubric">
                  <RubricEditor :rubric="stackQuestion.rubric" />
                </div>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </v-col>
      <v-col v-if="((testRunState == 'QUESTIONS' || isEditingQuestion) && isCTLab) || !isCTLab">
        <v-row cols="12" align="center" justify="space-between" class="pt-3 d-flex">
          <div class="d-flex justify-start">
            <SliceViewToolbar :disabled-tools="disabledTools" />
          </div>
          <div v-if="isCTLab" class="d-flex">
            <section cols="6" class="pe-4">
              <section class="view-option mb-1">
                <span>{{ $t('global.reference_lines') }}</span>
                <div
                  class="scanlab-toggle ms-2"
                  :v-model="showReferenceLines"
                  @click="showReferenceLines = !showReferenceLines"
                >
                  <span :class="{ on: true, active: showReferenceLines }">
                    {{ $t('global.on') }}
                  </span>
                  <span :class="{ off: true, active: !showReferenceLines }">
                    {{ $t('global.off') }}
                  </span>
                </div>
              </section>
            </section>
            <section cols="6" class="pe-4">
              <section class="view-option mb-1">
                <span>{{ $t('global.dot_size') }}</span>
                <!-- Slider can only work with consecutive whole numbers, so translating those with dotScaleMultiplierIndex -->
                <v-slider
                  class="dot-size-slider ct-dot-scale-slider w-200"
                  v-model.number="dotScaleMultiplierIndex"
                  :min="0"
                  :max="dotScaleValues.length - 1"
                  ticks
                >
                </v-slider>
              </section>
            </section>
            <template v-if="(testRunState == 'QUESTIONS' && !isLocalizerQuestion) || isEditingQuestion">
              <section v-for="toggleGroupName in Object.keys(testToggles)" :key="toggleGroupName" cols="6">
                <section
                  v-for="(testToggle, index) in testToggles[toggleGroupName]"
                  :key="testToggle.toggleName"
                  class="view-option"
                >
                  <span>{{ getProperToggleName(testToggle.toggleName) }}</span>
                  <div
                    class="scanlab-toggle ms-2"
                    :key="index"
                    :v-model="testToggles[toggleGroupName][index].visible"
                    @click="toggleSlider(toggleGroupName, index)"
                  >
                    <span :class="{ on: true, active: testToggles[toggleGroupName][index].visible }">
                      {{ $t('global.on') }}
                    </span>
                    <span :class="{ off: true, active: !testToggles[toggleGroupName][index].visible }">
                      {{ $t('global.off') }}
                    </span>
                  </div>
                </section>
              </section>
            </template>
          </div>
          <div class="d-flex justify-center">
            <section class="view-option">
              <v-btn-toggle v-model="isVolumeViewMode" dense mandatory>
                <v-btn :value="false">
                  <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                  <span class="hidden-sm-and-down">{{ $t('MRI.slice_view', languageCode) }}</span>
                </v-btn>

                <v-btn :value="true">
                  <!-- eslint-disable-next-line vue-i18n/no-raw-text -->
                  <span class="hidden-sm-and-down">{{ $t('MRI.volume_view', languageCode) }}</span>
                </v-btn>
              </v-btn-toggle>
            </section>
          </div>
          <div class="d-flex justify-end">
            <div class="mr-1">
              <v-menu v-if="!isAcquisitionQuestion">
                <template #activator="{ on }">
                  <v-btn tile outlined class="no-transform bold" color="buttonBlue" v-on="on">
                    <span>{{ $t('global.reset', languageCode) }}</span>
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

              <div class="ml-2 d-inline-block" :class="showParamHints.includes('rf') ? 'param-hint-rf-corners' : ''">
                <div :class="showParamHints.includes('time') ? 'param-hint-time-corners' : ''">
                  <v-btn
                    v-if="!isCTLab"
                    class="no-transform bold"
                    tile
                    outlined
                    color="buttonBlue"
                    @click="createSatBand"
                    :disabled="!mayAddSatBand || hasAnsweredAllStackQuestions"
                  >
                    <v-icon small>add</v-icon>
                    {{ $t('MRI.add_satband', languageCode) }}
                  </v-btn>
                </div>
              </div>
              <v-btn
                tile
                outlined
                class="ml-2 no-transform bold"
                color="buttonBlue"
                v-if="(isCTLab && isEditingQuestion && !isReconstructionQuestion) || (!isCTLab && !isAddLocalizerMode)"
                :disabled="hasAnsweredAllStackQuestions || (isTakingTest && hasAddedLocalizer)"
                @click="setIsAddLocalizerMode(true)"
              >
                <v-icon small>add</v-icon>
                {{ $t('MRI.add_localizer', languageCode) }}
              </v-btn>
              <v-btn
                class="mr-2"
                tile
                outlined
                v-if="isAddLocalizerMode && !isReconstructionQuestion"
                :disabled="hasAnsweredAllStackQuestions"
                color="error"
                @click="setIsAddLocalizerMode(false)"
              >
                {{ $t('MRI.add_localizer_cancel', languageCode) }}
              </v-btn>

              <v-btn
                tile
                class="ml-2 no-transform bold"
                color="buttonBlue text-white"
                v-if="isAdmin && isEditingQuestion"
                @click="addQuestion"
              >
                {{ $t('MRI.create_question', languageCode) }}
              </v-btn>
            </div>
          </div>
        </v-row>
      </v-col>

      <!-- Show timing decision view in timing decision question -->
      <v-row
        v-if="
          isCTLab &&
          testRunState == 'QUESTIONS' &&
          isQuestionSetHasTimingDecisionQuestion &&
          !isEditingQuestion &&
          isTimingDecisionQuestion
        "
        class="ma-0"
        cols="3"
      >
        <v-col class="pa-0" cols="8">
          <v-row cols="2" class="ma-0">
            <v-col class="pa-0" cols="6">
              <TimingDecisionConfirmView v-if="!isSelectedSetDelayTimingDecision" />
              <SliceView
                v-else
                ref="CTLabSliceViewZ"
                view-orientation="z"
                reference-line-id="a"
                :am-fullscreen="false"
                :is-editing-question="isEditingQuestion"
                :slice-view-index="0"
                :selected-sliceview-ids="selectedSliceviewIds"
                slice-id="CTLabSliceViewZ"
                @select="onSliceViewSelect($refs.CTLabSliceViewZ)"
                @select-only="onSliceViewSelectOnly($refs.CTLabSliceViewZ)"
                @config-changed="onSliceViewConfigChanged"
              />
            </v-col>
            <v-col class="pa-0" cols="6">
              <TimingDecisionROIView v-if="!isSelectedSetDelayTimingDecision" />
              <SliceView
                v-else
                ref="CTLabSliceViewY"
                view-orientation="y"
                reference-line-id="b"
                :am-fullscreen="false"
                :slice-view-index="1"
                :selected-sliceview-ids="selectedSliceviewIds"
                slice-id="CTLabSliceViewY"
                @select="onSliceViewSelect($refs.CTLabSliceViewY)"
                @select-only="onSliceViewSelectOnly($refs.CTLabSliceViewY)"
                @config-changed="onSliceViewConfigChanged"
              />
            </v-col>
          </v-row>
          <v-row class="pr-2">
            <v-col cols="5" class="d-flex flex-column">
              <ScanButton :freebie="stackQuestion && stackQuestion.freebie" :should-handle-hot-key="true" />
              <QuestionMenuVertical :step="selectedStackQuestionIndexVisual" />
            </v-col>
            <v-col cols="7">
              <TimingDecisionConfigForm />
            </v-col>
          </v-row>
        </v-col>
        <v-col class="pr-0 pt-0 pl-0">
          <div style="height: calc(40vh + 95px)">
            <MRIMachineView
              v-if="isCTLab"
              :can-show-hint="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :can-check-lazer-position="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :test-run-state="testRunState"
              :is-set-init-position-to-landmarked-position="!isEditingQuestion"
              :model-file-name="testModelFileName"
              :should-zoom-to-landmark-view-after-mount="true"
              :is-show-home-button="true"
              :is-show-for-timing-decision-question="true"
            />
            <MRMRIMachineView
              v-else
              :can-show-hint="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :can-check-lazer-position="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :test-run-state="testRunState"
              :is-set-init-position-to-landmarked-position="!isEditingQuestion"
              :model-file-name="testModelFileName"
              :should-zoom-to-landmark-view-after-mount="true"
              :is-show-home-button="true"
              :is-show-for-timing-decision-question="true"
            />
          </div>
          <div class="mt-6 pl-1" cols="4">
            <PowerInjector v-if="hasContrast" mode="flow" v-model="injector" />
          </div>
        </v-col>
      </v-row>
      <!-- Show slice in general question -->
      <v-row
        v-if="isCTLab && (isEditingQuestion || (testRunState == 'QUESTIONS' && !isTimingDecisionQuestion))"
        class="ma-0"
        cols="3"
      >
        <template>
          <v-col class="pa-0">
            <SliceView
              ref="CTLabSliceViewZ"
              view-orientation="z"
              reference-line-id="a"
              :am-fullscreen="false"
              :is-editing-question="isEditingQuestion"
              :slice-view-index="0"
              :selected-sliceview-ids="selectedSliceviewIds"
              slice-id="CTLabSliceViewZ"
              @select="onSliceViewSelect($refs.CTLabSliceViewZ)"
              @select-only="onSliceViewSelectOnly($refs.CTLabSliceViewZ)"
              @config-changed="onSliceViewConfigChanged"
            />
          </v-col>
          <v-col class="pa-0">
            <SliceView
              ref="CTLabSliceViewY"
              view-orientation="y"
              reference-line-id="b"
              :am-fullscreen="false"
              :slice-view-index="1"
              :selected-sliceview-ids="selectedSliceviewIds"
              slice-id="CTLabSliceViewY"
              @select="onSliceViewSelect($refs.CTLabSliceViewY)"
              @select-only="onSliceViewSelectOnly($refs.CTLabSliceViewY)"
              @config-changed="onSliceViewConfigChanged"
            />
          </v-col>
          <v-col class="pa-0">
            <template
              v-if="
                !isAcquisitionQuestion &&
                !isLocalizerQuestion &&
                !isTimingDecisionQuestion &&
                !isCardiacAcquisitionQuestion
              "
            >
              <SliceView
                ref="CTLabSliceViewX"
                view-orientation="x"
                reference-line-id="c"
                :am-fullscreen="false"
                :slice-view-index="2"
                :selected-sliceview-ids="selectedSliceviewIds"
                slice-id="CTLabSliceViewX"
                @select="onSliceViewSelect($refs.CTLabSliceViewX)"
                @select-only="onSliceViewSelectOnly($refs.CTLabSliceViewX)"
                @config-changed="onSliceViewConfigChanged"
              />
            </template>
            <template
              v-if="
                (isAcquisitionQuestion ||
                  isLocalizerQuestion ||
                  isTimingDecisionQuestion ||
                  isCardiacAcquisitionQuestion) &&
                !isEditingQuestion
              "
            >
              <MRIMachineView
                v-if="isCTLab"
                ref="mriViewer"
                :can-show-hint="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
                :can-check-lazer-position="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
                :test-run-state="testRunState"
                :is-set-init-position-to-landmarked-position="!isEditingQuestion"
                :model-file-name="testModelFileName"
                :should-zoom-to-landmark-view-after-mount="true"
                :is-show-home-button="true"
                :is-handle-move-to-landmark-event="true"
              />
              <MRMRIMachineView
                v-else
                ref="mriViewer"
                :can-show-hint="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
                :can-check-lazer-position="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
                :test-run-state="testRunState"
                :is-set-init-position-to-landmarked-position="!isEditingQuestion"
                :model-file-name="testModelFileName"
                :should-zoom-to-landmark-view-after-mount="true"
                :is-show-home-button="true"
                :is-handle-move-to-landmark-event="true"
              />
            </template>
          </v-col>
        </template>
      </v-row>
      <div v-if="!showX" class="loading-bar">
        <span class="primary--text">Loading...</span>
        <v-progress-linear height="10" color="primary" rounded striped indeterminate></v-progress-linear>
      </div>
      <v-row v-if="!isCTLab" class="ma-0" cols="3" :style="{ opacity: showX ? 1 : 0 }">
        <v-col class="pa-0">
          <SliceView
            ref="MRLabSliceViewZ"
            view-orientation="z"
            reference-line-id="a"
            :am-fullscreen="false"
            :is-editing-question="isEditingQuestion"
            :slice-view-index="0"
            :selected-sliceview-ids="selectedSliceviewIds"
            slice-id="MRLabSliceViewZ"
            @select="onSliceViewSelect($refs.MRLabSliceViewZ)"
            @select-only="onSliceViewSelectOnly($refs.MRLabSliceViewZ)"
            @config-changed="onSliceViewConfigChanged"
          />
        </v-col>
        <v-col class="pa-0">
          <SliceView
            v-if="showY"
            ref="MRLabSliceViewY"
            view-orientation="y"
            reference-line-id="b"
            :am-fullscreen="false"
            :slice-view-index="1"
            :selected-sliceview-ids="selectedSliceviewIds"
            slice-id="MRLabSliceViewY"
            @select="onSliceViewSelect($refs.MRLabSliceViewY)"
            @select-only="onSliceViewSelectOnly($refs.MRLabSliceViewY)"
            @config-changed="onSliceViewConfigChanged"
          />
        </v-col>
        <v-col class="pa-0">
          <SliceView
            v-if="showX"
            ref="MRLabSliceViewX"
            view-orientation="x"
            reference-line-id="c"
            :am-fullscreen="false"
            :slice-view-index="2"
            :selected-sliceview-ids="selectedSliceviewIds"
            slice-id="MRLabSliceViewX"
            @select="onSliceViewSelect($refs.MRLabSliceViewX)"
            @select-only="onSliceViewSelectOnly($refs.MRLabSliceViewX)"
            @config-changed="onSliceViewConfigChanged"
          />
        </v-col>
      </v-row>
      <!-- Injector config -->
      <v-row v-if="!isEditingQuestion && hasContrast && testRunState === 'INJECTOR' && isCTLab" class="ma-0" cols="3">
        <PowerInjector mode="volume" v-model="injector" @volumeSubmit="onInjectorSubmit" />
      </v-row>
      <!-- Landmark position and landmark -->
      <v-row
        v-if="!isEditingQuestion && (testRunState === 'POSITION' || testRunState === 'LANDMARK') && isCTLab"
        style="height: 100%"
      >
        <v-card class="w-100 mt-3 pb-5" style="height: max-content">
          <div v-if="!patientPositionsHaveAnyBodyBoxes" class="pt-5">
            There is no available model that has body box set up for this test!
          </div>
          <div v-else class="landmark-mri-view-container" style="height: 70vh">
            <MRIMachineView
              v-if="isCTLab"
              ref="mriViewer"
              :can-show-hint="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :can-check-lazer-position="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :can-edit-direction-config="true"
              :test-run-state="testRunState"
              :should-reset-patient-position="true"
              :model-file-name="testModelFileName"
              @onConfirmPosition="
                () => {
                  this.positionConfirmed = true
                }
              "
              @onConfirmLandMark="
                () => {
                  this.landmarkConfirmed = true
                }
              "
            />
            <MRMRIMachineView
              v-else
              ref="mriViewer"
              :can-show-hint="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :can-check-lazer-position="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :can-edit-direction-config="true"
              :test-run-state="testRunState"
              :should-reset-patient-position="true"
              :model-file-name="testModelFileName"
              @onConfirmPosition="
                () => {
                  this.positionConfirmed = true
                }
              "
              @onConfirmLandMark="
                () => {
                  this.landmarkConfirmed = true
                }
              "
            />
          </div>
          <div class="mri-machine-actions" v-if="patientPositionsHaveAnyBodyBoxes">
            <div class="d-flex content">
              <div class="font-weight-bold">{{ $t('global.directions') }}:</div>
              <div class="text-justify pl-2">
                <span v-if="testRunState === 'POSITION'" v-html="patientPositionDirections"></span>
                <span v-else v-html="patientLandmarkingDirections"></span>
              </div>
            </div>
            <div class="content" style="width: 100%; text-align: center; margin-top: 20px">
              <template v-if="testRunState === 'LANDMARK' && landmarkConfirmed">
                <v-btn @click="onCancelConfirm" class="ml-3">{{ $t('global.cancel') }}</v-btn>
              </template>
              <v-btn
                class="btn-glowing"
                :class="{
                  'ml-3': testRunState === 'LANDMARK' && landmarkConfirmed,
                  'btn-color-green': !(
                    (testRunState === 'POSITION' && positionConfirmed) ||
                    (testRunState === 'LANDMARK' && landmarkConfirmed)
                  ),
                }"
                :disabled="isSubmittingAnswer"
                @click="onNextTestState"
              >
                <v-progress-circular indeterminate v-if="isSubmittingAnswer"></v-progress-circular>
                <span v-else>{{ $t(confirmAndNextButtonText, languageCode) }}</span>
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-row>
      <!-- Scan button and selection config on CT -->
      <v-row v-if="isCTLab && (isEditingQuestion || (testRunState == 'QUESTIONS' && !isTimingDecisionQuestion))">
        <v-col cols="3" class="d-flex flex-column">
          <ScanButton :freebie="stackQuestion && stackQuestion.freebie" :should-handle-hot-key="true" />
          <QuestionMenuVertical :step="selectedStackQuestionIndexVisual" />
        </v-col>
        <v-col :cols="isEditingQuestion ? 9 : 5">
          <v-row v-if="isEditingQuestion && !isAddLocalizerMode">
            <AdminCopySelectionConfig />
            <SelectionConfigForm class="mt-3" :selection-ident="`${selectionConfigsCurrentGroupId}_min`" />
            <SelectionConfigForm class="mt-3" :selection-ident="`${selectionConfigsCurrentGroupId}_max`" />
            <SelectionConfigForm class="mt-3" :selection-ident="`${selectionConfigsCurrentGroupId}_proposed`" />
          </v-row>
          <SelectionConfigForm v-else-if="isCTLab" class="m-0" :selection-ident="selectionConfigCurrentIdent" />
          <v-row v-else>
            <SelectionConfigForm class="m-0" :selection-ident="selectionConfigCurrentIdent" />
          </v-row>
        </v-col>
        <v-col cols="4" class="pl-0">
          <PowerInjector
            v-if="
              ((isAcquisitionQuestion || isLocalizerQuestion) && hasContrast && !isEditingQuestion) ||
              isCardiacAcquisitionQuestion
            "
            mode="flow"
            v-model="injector"
          />
          <template v-if="isReconstructionQuestion && !isEditingQuestion">
            <MRIMachineView
              v-if="isCTLab"
              ref="mriViewer"
              :can-show-hint="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :can-check-lazer-position="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :test-run-state="testRunState"
              :is-set-init-position-to-landmarked-position="!isEditingQuestion"
              max-height="500px"
              :model-file-name="testModelFileName"
              :should-zoom-to-landmark-view-after-mount="true"
              :is-show-home-button="true"
            />
            <MRMRIMachineView
              v-else
              ref="mriViewer"
              :can-show-hint="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :can-check-lazer-position="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
              :test-run-state="testRunState"
              :is-set-init-position-to-landmarked-position="!isEditingQuestion"
              max-height="500px"
              :model-file-name="testModelFileName"
              :should-zoom-to-landmark-view-after-mount="true"
              :is-show-home-button="true"
            />
          </template>
        </v-col>
      </v-row>
      <v-row v-if="!isCTLab" class="selection-forms" cols="12">
        <v-col cols="9" class="justify-content-md-center selection-forms-sub">
          <v-row
            v-if="(isEditingQuestion || selectionConfigsGroups.length > 1) && !isAddLocalizerMode && !isSingleSliceMode"
            justify="center"
            align="center"
            class="mb-1"
          >
            <span
              v-if="isEditingQuestion"
              @click="removeSelectionConfigGroup({ groupId: selectionConfigsCurrentGroupId })"
              class="clickable"
            >
              <minus-icon :title="$t('global.remove')" />
            </span>

            <v-btn
              bold
              v-for="(group, index) in selectionConfigsGroups"
              :key="index"
              :color="
                isGroupIsSelected(group.id) ||
                (group.id === selectionConfigsCurrentGroupId && selectedGroupIds.length == 0)
                  ? 'primary'
                  : ''
              "
              :class="{
                'group-button': true,
                active:
                  isGroupIsSelected(group.id) ||
                  (group.id === selectionConfigsCurrentGroupId && selectedGroupIds.length == 0),
              }"
              @click="onClickGroup($event, { groupId: group.id })"
            >
              {{ group.name }}
            </v-btn>

            <span v-if="isEditingQuestion" @click="addSelectionConfigGroup({})" class="clickable">
              <plus-icon :title="$t('global.add')" />
            </span>

            <div class="ml-10">
              <button class="group-selection-button" @click="onToggleGroupSelection()">
                <v-icon v-if="groupSelectionConfigs.length > 1">mdi-lock-outline</v-icon>
                <v-icon v-else>mdi-lock-open-variant-outline</v-icon>
              </button>
              <v-btn text hidden v-shortkey.once="['ctrl', 'g']" @shortkey="onSelectAllSelectionConfig()"> </v-btn>
            </div>
          </v-row>
          <v-row v-if="isEditingQuestion && !isAddLocalizerMode">
            <AdminCopySelectionConfig />
            <SatBandAreaEditor />
            <!-- <InteractableForm class="mt-3" v-if="selectedInteractableState" /> -->
            <SelectionConfigForm
              class="mt-3"
              :selection-ident="`${selectionConfigsCurrentGroupId}_min`"
              :is-ultra-lab="isUltraLab"
              :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults"
            />
            <SelectionConfigForm
              class="mt-3"
              :selection-ident="`${selectionConfigsCurrentGroupId}_max`"
              :is-ultra-lab="isUltraLab"
              :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults"
            />
            <SelectionConfigForm
              class="mt-3"
              :selection-ident="`${selectionConfigsCurrentGroupId}_proposed`"
              :is-ultra-lab="isUltraLab"
              :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults"
            />
          </v-row>
          <v-row v-else>
            <!-- <InteractableForm class="mt-3" v-if="selectedInteractableState" /> -->
            <SelectionConfigForm
              :selection-ident="selectionConfigCurrentIdent"
              :is-ultra-lab="isUltraLab"
              :param-hints="showParamHints"
              :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults"
            />
            <v-container
              v-if="
                (isUltraLab || isResolutionLab || isContrastLab || isBasicLab) && !questionSet && !isAddLocalizerMode
              "
              class="w-100 ms-auto me-0"
            >
              <v-row align="center">
                <v-col cols="6" v-if="isAdmin" class="d-flex">
                  <!-- <v-row class="flex-grow-0">
                    <v-col class="ma-0 pa-0">
                      <v-checkbox v-model="adminSliceSelection" label="Slice Selection" color="purple" dense />
                    </v-col>
                    <v-col class="ma-0 pa-0">
                      <v-checkbox v-model="adminEnableTSEBlur" label="TSE Blur" color="indigo" dense :disabled="!isUltraLab" />
                    </v-col>
                    <v-col class="ma-0 pa-0">
                      <v-checkbox v-model="adminEnableResolution" label="Resolution" color="teal" dense :disabled="!isUltraLab && !isResolutionLab" />
                    </v-col>
                    <v-col class="ma-0 pa-0">
                      <v-checkbox
                        v-model="adminEnableCompactMode"
                        label="Compact"
                        color="purple"
                        dense
                        :disabled="adminEnableFovWrap || isResolutionLab || isBasicLab"
                      />
                    </v-col>
                    <v-col class="ma-0 pa-0">
                      <v-checkbox v-model="adminEnableFovWrap" label="FOV Wrap" color="orange" dense />
                    </v-col>
                    <v-col class="ma-0 pa-0">
                      <v-checkbox v-model="adminEnableCruncherResolution" label="Cruncher Res" color="cyan" dense :disabled="isBasicLab" />
                    </v-col>
                    <v-col class="ma-0 pa-0">
                      <v-checkbox v-model="adminEnableCruncherBasicLab" label="Cruncher Basic" color="teal" dense />
                    </v-col>
                    <v-col class="ma-0 pa-0">
                      <v-checkbox v-model="adminEnableBitDepth8" label="8-bit" color="lime" dense />
                    </v-col>
                    <v-col class="ma-0 px-0 py-5">
                      <v-select
                        v-model="adminEchoOrdering"
                        :items="echoOrderingOptions"
                        label="Echo Order"
                        dense
                        outlined
                        hide-details
                        class="mt-n2"
                      />
                    </v-col>
                  </v-row> -->
                </v-col>
                <v-col v-if="isUltraLab" :cols="isAdmin ? 6 : 12" class="d-flex justify-end">
                  <v-row class="flex-grow-0 ml-auto">
                    <v-col class="ma-0 pa-0 pr-3">
                      <v-checkbox
                        v-model="showParamHints"
                        label="SNR"
                        value="snr"
                        color="blue"
                        :disabled="showParamHints.length > 1 && showParamHints.indexOf('snr') === -1"
                      />
                    </v-col>
                    <v-col class="ma-0 pa-0 px-3">
                      <v-checkbox
                        v-model="showParamHints"
                        label="Time"
                        value="time"
                        color="amber"
                        :disabled="showParamHints.length > 1 && showParamHints.indexOf('time') === -1"
                      />
                    </v-col>
                    <v-col class="ma-0 pa-0 px-3">
                      <v-checkbox
                        v-model="showParamHints"
                        label="Res."
                        value="resolution"
                        color="green"
                        :disabled="showParamHints.length > 1 && showParamHints.indexOf('resolution') === -1"
                      />
                    </v-col>
                    <v-col class="ma-0 pa-0 pl-3">
                      <v-checkbox
                        v-model="showParamHints"
                        label="RF"
                        value="rf"
                        color="red"
                        :disabled="showParamHints.length > 1 && showParamHints.indexOf('rf') === -1"
                      />
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-container>
          </v-row>
        </v-col>
        <v-col cols="3">
          <ScanButton
            :freebie="stackQuestion && stackQuestion.freebie"
            :local-software-version-preference="localSoftwareVersionPreference"
          />
          <!-- <br /> -->
          <v-card class="scan-view-options mt-1 pa-5">
            <header>
              <h4>{{ $t('MRI.scan_view_options') }}</h4>
            </header>

            <section v-for="toggleGroupName in Object.keys(testToggles)" :key="toggleGroupName">
              <hr class="mt-5 header-gradient-region" />
              <header v-if="selectionConfigsGroups.length > 1" style="padding-bottom: 5px">
                <h5>{{ getProperGroupName(toggleGroupName) }}</h5>
              </header>
              <section>
                <section class="view-option">
                  <span>{{ $t('global.reference_lines') }}</span>
                  <div
                    class="scanlab-toggle"
                    :v-model="showReferenceLines"
                    @click="showReferenceLines = !showReferenceLines"
                  >
                    <span :class="{ on: true, active: showReferenceLines }">
                      {{ $t('global.on') }}
                    </span>
                    <span :class="{ off: true, active: !showReferenceLines }">
                      {{ $t('global.off') }}
                    </span>
                  </div>
                </section>
              </section>
              <section
                v-for="(testToggle, index) in testToggles[toggleGroupName]"
                :key="testToggle.toggleName"
                class="view-option"
              >
                <span>{{ getProperToggleName(testToggle.toggleName) }}</span>
                <div
                  class="scanlab-toggle"
                  :key="index"
                  :v-model="testToggles[toggleGroupName][index].visible"
                  @click="toggleSlider(toggleGroupName, index)"
                >
                  <span :class="{ on: true, active: testToggles[toggleGroupName][index].visible }">
                    {{ $t('global.on') }}
                  </span>
                  <span :class="{ off: true, active: !testToggles[toggleGroupName][index].visible }">
                    {{ $t('global.off') }}
                  </span>
                </div>
              </section>
              <section class="view-option">
                <span>{{ $t('global.sat_band') }}</span>
                <div
                  class="scanlab-toggle"
                  :v-model="visibleSatBandRect"
                  @click="setVisibleSatBandRect(!visibleSatBandRect)"
                >
                  <span :class="{ on: true, active: visibleSatBandRect }">
                    {{ $t('global.on') }}
                  </span>
                  <span :class="{ off: true, active: !visibleSatBandRect }">
                    {{ $t('global.off') }}
                  </span>
                </div>
              </section>
              <section class="view-option" v-if="isEditingQuestion">
                <span>{{ $t('global.sat_band_no_touch_area') }}</span>
                <div class="scanlab-toggle" :v-model="visibleSatBand" @click="setVisibleSatBand(!visibleSatBand)">
                  <span :class="{ on: true, active: visibleSatBand }">
                    {{ $t('global.on') }}
                  </span>
                  <span :class="{ off: true, active: !visibleSatBand }">
                    {{ $t('global.off') }}
                  </span>
                </div>
              </section>
              <section class="view-option">
                <span>{{ $t('global.dot_size') }}</span>

                <!-- Slider can only work with consecutive whole numbers, so translating those with dotScaleMultiplierIndex -->
                <v-slider
                  class="dot-size-slider"
                  v-model.number="dotScaleMultiplierIndex"
                  :min="0"
                  :max="dotScaleValues.length - 1"
                  ticks
                >
                </v-slider>
              </section>
            </section>
            <!-- <section v-if="isAcquisitionQuestion && isCTLab">
              <v-btn
                block
                tile
                class="no-transform bold button mt-2"
                :class="small ? 'pt-0 pb-0' : ''"
                color="buttonSecondary text-white"
              >
                {{ $t('global.confirm') }}
              </v-btn>
              <v-btn
                block
                tile
                class="no-transform bold button mt-2"
                :class="small ? 'pt-0 pb-0' : ''"
                color="buttonSecondary text-white"
              >
                Move
              </v-btn>
              <v-btn
                block
                tile
                class="no-transform bold button mt-2"
                :class="small ? 'pt-0 pb-0' : ''"
                color="buttonSecondary text-white"
              >
                Start
              </v-btn>
            </section> -->
          </v-card>

          <div v-if="(isUltraLab || isContrastLab) && isEditingQuestion" class="mt-4">
            <FieldStrengthPresetEditor :is-ultra-lab="isUltraLab" />
          </div>

          <div v-if="isResolutionLab && isEditingQuestion" class="mt-4">
            <ResolutionLabAnswerRanges />
          </div>
        </v-col>
      </v-row>
    </template>
    <template
      v-else-if="
        !testResultAugmented &&
        isLoadedAndReady &&
        localSoftwareVersionPreference == SOFTWARE_VERSION.NEWUI &&
        !isCTLab &&
        !(isEditingQuestion && questionSet)
      "
    >
      <v-row class="mr-newui-version-container">
        <!-- Slice config -->
        <v-col cols="12">
          <v-row align="center" justify="space-between" class="pt-3 d-flex m-0">
            <div class="d-flex">
              <section cols="6" class="pe-4">
                <section class="view-option mb-1">
                  <span>{{ $t('global.reference_lines') }}</span>
                  <div
                    class="scanlab-toggle ms-2"
                    :v-model="showReferenceLines"
                    @click="showReferenceLines = !showReferenceLines"
                  >
                    <span :class="{ on: true, active: showReferenceLines }">
                      {{ $t('global.on') }}
                    </span>
                    <span :class="{ off: true, active: !showReferenceLines }">
                      {{ $t('global.off') }}
                    </span>
                  </div>
                </section>
              </section>
              <section cols="6" class="pe-4">
                <section class="view-option mb-1">
                  <span>{{ $t('global.dot_size') }}</span>
                  <!-- Slider can only work with consecutive whole numbers, so translating those with dotScaleMultiplierIndex -->
                  <v-slider
                    class="dot-size-slider ct-dot-scale-slider w-200"
                    v-model.number="dotScaleMultiplierIndex"
                    :min="0"
                    :max="dotScaleValues.length - 1"
                    ticks
                  >
                  </v-slider>
                </section>
              </section>
            </div>
            <div class="d-flex justify-center">
              <section class="view-option">
                <v-btn-toggle v-model="isVolumeViewMode" dense mandatory color="primary">
                  <v-btn :value="false">
                    <span class="hidden-sm-and-down">{{ $t('MRI.slice_view', languageCode) }}</span>
                  </v-btn>

                  <v-btn :value="true">
                    <span class="hidden-sm-and-down">{{ $t('MRI.volume_view', languageCode) }}</span>
                  </v-btn>
                </v-btn-toggle>
              </section>
            </div>
            <div class="d-flex justify-end">
              <div class="d-inline-block" :class="showParamHints.includes('rf') ? 'param-hint-rf-corners' : ''">
                <div :class="showParamHints.includes('time') ? 'param-hint-time-corners' : ''">
                  <v-btn
                    v-if="!isCTLab"
                    class="no-transform bold"
                    tile
                    outlined
                    color="buttonBlue"
                    @click="createSatBand"
                    :disabled="!mayAddSatBand || hasAnsweredAllStackQuestions"
                  >
                    <v-icon small>add</v-icon>
                    {{ $t('MRI.add_satband', languageCode) }}
                  </v-btn>
                </div>
              </div>
              <v-menu v-if="!isAcquisitionQuestion">
                <template #activator="{ on }">
                  <v-btn tile outlined class="no-transform bold ml-2" color="buttonBlue" v-on="on">
                    <span>{{ $t('global.reset', languageCode) }}</span>
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
          </v-row>
        </v-col>
        <!-- Slice view -->
        <v-col cols="12">
          <v-row class="flex-row-reverse">
            <v-col class="col-9-5 pl-1">
              <v-row class="ma-0" cols="3">
                <v-col class="pa-0">
                  <SliceView
                    ref="MRLabNewUISliceViewZ"
                    view-orientation="z"
                    reference-line-id="a"
                    :am-fullscreen="false"
                    :is-editing-question="isEditingQuestion"
                    :selected-sliceview-ids="selectedSliceviewIds"
                    :slice-view-index="0"
                    slice-id="MRLabNewUISliceViewZ"
                    @select="onSliceViewSelect($refs.MRLabNewUISliceViewZ)"
                    @select-only="onSliceViewSelectOnly($refs.MRLabNewUISliceViewZ)"
                    @config-changed="onSliceViewConfigChanged"
                  />
                </v-col>
                <v-col class="pa-0">
                  <SliceView
                    ref="MRLabNewUISliceViewY"
                    view-orientation="y"
                    reference-line-id="b"
                    :am-fullscreen="false"
                    :selected-sliceview-ids="selectedSliceviewIds"
                    :slice-view-index="1"
                    slice-id="MRLabNewUISliceViewY"
                    @select="onSliceViewSelect($refs.MRLabNewUISliceViewY)"
                    @select-only="onSliceViewSelectOnly($refs.MRLabNewUISliceViewY)"
                    @config-changed="onSliceViewConfigChanged"
                  />
                </v-col>
                <v-col class="pa-0">
                  <SliceView
                    ref="MRLabNewUISliceViewX"
                    view-orientation="x"
                    reference-line-id="c"
                    :am-fullscreen="false"
                    :selected-sliceview-ids="selectedSliceviewIds"
                    :slice-view-index="2"
                    slice-id="MRLabNewUISliceViewX"
                    @select="onSliceViewSelect($refs.MRLabNewUISliceViewX)"
                    @select-only="onSliceViewSelectOnly($refs.MRLabNewUISliceViewX)"
                    @config-changed="onSliceViewConfigChanged"
                  />
                </v-col>
              </v-row>
            </v-col>
            <v-col class="d-flex flex-column col-2-5 pr-1">
              <div class="slice-view-toolbar-container">
                <SliceViewToolbar :disabled-tools="disabledTools" />
              </div>
              <div class="mt-4 d-flex flex-column flex-auto">
                <MRQuestionMenuVertical :step="selectedStackQuestionIndexVisual" />
                <ScanButton
                  :freebie="stackQuestion && stackQuestion.freebie"
                  :local-software-version-preference="localSoftwareVersionPreference"
                />
              </div>
            </v-col>
          </v-row>
        </v-col>

        <v-col cols="12">
          <v-row>
            <!-- ECG view -->
            <v-col class="col-2-5 pr-1">
              <SelectionConfigECGChart selection-ident="proposed" />
            </v-col>

            <!-- Selection config -->
            <v-col class="col-9-5 pl-1">
              <v-row class="ma-0 h-100">
                <v-col class="col-3-5 pa-1">
                  <SelectionConfigForm
                    :selection-ident="selectionConfigCurrentIdent"
                    :is-ultra-lab="isUltraLab"
                    :param-hints="showParamHints"
                    :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults"
                    :display-mode="SELECTION_CONFIG_DISPLAY_MODE.CRITERIA_AND_PARAMETER"
                  />
                </v-col>
                <v-col class="col-3-5 pa-1">
                  <SelectionConfigForm
                    :selection-ident="selectionConfigCurrentIdent"
                    :is-ultra-lab="isUltraLab"
                    :param-hints="showParamHints"
                    :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults"
                    :display-mode="SELECTION_CONFIG_DISPLAY_MODE.ULTRALAB_TAB"
                  />
                </v-col>
                <v-col cols="5" class="pa-1 h-100">
                  <div class="injector-and-patient-container">
                    <div class="card-container">
                      <!-- <template v-if="injectorAndPatientTab == 0">
                        <PowerInjector v-if="!isEditingQuestion" mode="flow" v-model="injector" />
                      </template>
                      <template v-if="injectorAndPatientTab == 1">
                        <MRMRIMachineView
                          ref="mriViewer"
                          :can-show-hint="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
                          :can-check-lazer-position="isLocalizerQuestion || selectedStackQuestionIndexVisual == 1"
                          :test-run-state="testRunState"
                          :is-set-init-position-to-landmarked-position="!isEditingQuestion"
                          :model-file-name="testModelFileName"
                          :should-zoom-to-landmark-view-after-mount="true"
                          :is-show-home-button="true"
                          :is-handle-move-to-landmark-event="true"
                        />
                      </template> -->
                    </div>
                    <div class="card-tabs">
                      <div
                        class="tab-item"
                        :class="{ active: injectorAndPatientTab == 0 }"
                        @click="injectorAndPatientTab = 0"
                      >
                        {{ $t('global.injector', languageCode) }}
                      </div>
                      <div
                        class="tab-item"
                        :class="{ active: injectorAndPatientTab == 1 }"
                        @click="injectorAndPatientTab = 1"
                      >
                        {{ $t('global.patient', languageCode) }}
                      </div>
                      <div
                        class="tab-item"
                        :class="{ active: injectorAndPatientTab == 2 }"
                        @click="injectorAndPatientTab = 2"
                      >
                        {{ $t('global.dou', languageCode) }}
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </template>
  </v-col>
</template>

<script>
console.log('==================================================')
console.log('========= START LOADING of MRI VUE FILE ==========')
let lastTime = new Date()
console.log('Current Time = ' + lastTime.getTime())
let currentTime = localStorage.getItem('route_change_time')
// Calculate the difference in milliseconds
const offset = lastTime - currentTime

// Convert the difference from milliseconds to a more readable format (e.g., seconds, minutes)
const offsetInSeconds = offset / 1000

console.log(`Offset: ${offsetInSeconds} seconds (${offset} milliseconds)`)
localStorage.removeItem('route_change_time')
// @ is an alias to /src
import { MriMixin } from '@/components/Mixins/MriMixin'
import { shouldShowMainScreen } from '../util/utils.js'

import MainScreen from '../components/VendorInterfaces/MainScreen.vue'
import BmainScreen from '../components/VendorInterfaces/B-19_Interface/BmainScreen.vue'
import PhmainScreen from '../components/VendorInterfaces/PhilipsVendorInterfaces/PhMainScreen.vue'
import GEmainScreen from '../components/VendorInterfaces/GEVendorInterfaces/GEMainScreen.vue'
import { mapGetters, mapActions } from 'vuex'
import $ from 'jquery'
import _ from 'lodash'

import SliceView from '@/components/SliceView'
import SelectionConfigForm from '@/components/SelectionConfigForm'
import AdminCopySelectionConfig from '@/components/AdminCopySelectionConfig'
import { SOFTWARE_VERSION } from '../constants'
import EventBus from '@/lib/event-bus'
import { startMriLoop, stopMriLoop, stopAll as stopAllMriAudio, setAudioSuppressed } from '@/lib/mri-audio'

export default {
  data() {
    return {
      isTestParameterValid: false,
      localSoftwareVersionPreference: null,
      SOFTWARE_VERSION,
      adminSliceSelection: false,
      adminEnableTSEBlur: false,
      adminEnableResolution: false,
      adminEnableCompactMode: false,
      adminEnableFovWrap: false,
      adminEnableCruncherResolution: false,
      adminEnableCruncherBasicLab: false,
      adminEnableBitDepth8: false,
      adminEchoOrdering: 'linear',
      echoOrderingOptions: ['linear', 'centric', 'reverse-centric'],
      showY: true,
      showX: true,
      timeoutY: null,
      timeoutX: null,
    }
  },
  name: 'Mri',
  mixins: [MriMixin],
  components: {
    // Icons
    PlusIcon: () => import('icons/Plus'),
    MinusIcon: () => import('icons/Minus'),
    // eslint-disable-next-line vue/no-unused-components
    CheckboxMarkedCircleIcon: () => import('icons/CheckboxMarkedCircle'),
    // eslint-disable-next-line vue/no-unused-components
    CloseCircleIcon: () => import('icons/CloseCircle'),
    // eslint-disable-next-line vue/no-unused-components
    AlertCircleIcon: () => import('icons/AlertCircle'),

    // Components from both versions
    StackQuestionEdit: () => import('@/components/StackQuestionEdit'),
    SliceViewToolbar: () => import('@/components/SliceViewToolbar'),
    SliceView,
    MRIMachineView: () => import('@/components/MRIMachineView'),
    MRMRIMachineView: () => import('@/components/MRMRIMachineView'),
    CombinedTestResults: () => import('@/components/CombinedTestResults'),
    LoadingBeaker: () => import('@/components/LoadingBeaker'),
    ScanButton: () => import('@/components/ScanButton'),
    CriticalThinkingQuiz: () => import('@/components/CriticalThinkingQuiz'),
    RubricEditor: () => import('@/components/RubricEditor'),
    // eslint-disable-next-line vue/no-unused-components
    FieldStrengthPresetEditor: () => import('@/components/FieldStrengthPresetEditor'),
    // eslint-disable-next-line vue/no-unused-components
    ResolutionLabAnswerRanges: () => import('@/components/ResolutionLabAnswerRanges'),
    WebGLSupportCheckModal: () => import('@/components/WebGLSupportCheckModal.vue'),
    PowerInjector: () => import('@/components/PowerInjector.vue'),
    QuestionMenuVertical: () => import('@/components/QuestionMenuVertical.vue'),
    MRQuestionMenuVertical: () => import('@/components/MRQuestionMenuVertical.vue'),
    ScorePreviewContrast: () => import('@/components/ScorePreviewContrast.vue'),
    ScorePreviewResolution: () => import('@/components/ScorePreviewResolution.vue'),
    ScorePreviewMRBasic: () => import('@/components/ScorePreviewMRBasic.vue'),
    ScorePreviewUltraLab: () => import('@/components/ScorePreviewUltraLab.vue'),
    ScorePreviewCT: () => import('@/components/ScorePreviewCT.vue'),
    SatBandAreaEditor: () => import('@/components/SatBandAreaEditor.vue'),
    // eslint-disable-next-line vue/no-unused-components
    InteractableForm: () => import('@/components/InteractableForm'),
    TimingDecisionConfirmView: () => import('@/components/TimingDecisionConfirmView'),
    // BloothTubeView: () => import('@/components/BloothTubeView'),
    TimingDecisionROIView: () => import('@/components/TimingDecisionROIView'),
    // BloothResultView: () => import('@/components/BloothResultView'),
    TimingDecisionConfigForm: () => import('@/components/TimingDecisionConfigForm'),
    SelectionConfigECGChart: () => import('@/components/SelectionConfigECGChart'),
    MainScreen,
    BmainScreen,
    PhmainScreen,
    GEmainScreen,
    SelectionConfigForm,
    AdminCopySelectionConfig,
  },

  computed: {
    ...mapGetters('user', ['softwareVendorPreference', 'softwareVersionPreference', 'immersiveSound']),
    ...mapGetters('cohortService', ['isScientificModeEnabled', 'isTeachingModeActive']),
    isAudioSuppressed() {
      return this.isTeachingModeActive || !this.immersiveSound
    },
    mainScreenInfo() {
      return shouldShowMainScreen(this.softwareVendorPreference, this.softwareVersionPreference)
    },
    isBasicLab() {
      return !this.isUltraLab && !this.isResolutionLab && !this.isContrastLab && !this.isCTLab
    },
  },

  methods: {
    ...mapActions('scanTimeConfig', ['updateLocalSoftwareVersionPreference']),
    ...mapActions('cohortService', ['loadUserCohorts']),
    updateAllSelectionConfigs(param, value) {
      // Update all selection configs with the new parameter value
      const selectionConfigsByIdent = this.$store.state.selectionConfig.selectionConfigsByIdent
      Object.keys(selectionConfigsByIdent).forEach((ident) => {
        if (selectionConfigsByIdent[ident]) {
          // Use Vue.set to ensure reactivity for nested properties
          this.$set(selectionConfigsByIdent[ident], param, value)
        }
      })
    },
    initializeAdminControls() {
      // Initialize admin UI controls from the first selection config
      // This only sets up the admin checkbox display state, not user preferences
      const selectionConfigsByIdent = this.$store.state.selectionConfig.selectionConfigsByIdent
      const firstConfig = Object.values(selectionConfigsByIdent)[0]
      if (firstConfig) {
        this.adminSliceSelection = firstConfig.sliceSelection || false
        this.adminEnableTSEBlur = this.isUltraLab ? firstConfig.enableTSEBlur || false : false
        this.adminEnableResolution =
          this.isUltraLab || this.isResolutionLab ? firstConfig.enableResolution || false : false
        this.adminEnableCompactMode = firstConfig.enableCompactMode || false
        this.adminEnableFovWrap = firstConfig.enableFovWrap || false
        this.adminEnableCruncherResolution = firstConfig.enableCruncherResolution || false
        this.adminEnableCruncherBasicLab = firstConfig.enableCruncherBasicLab || false
        this.adminEnableBitDepth8 = firstConfig.enableBitDepth8 || false
        this.adminEchoOrdering = firstConfig.echoOrdering || 'linear'
      }
    },
  },

  created() {
    console.log('this.softwareVersionPreference==========', this.softwareVersionPreference)
  },
  async mounted() {
    // Ensure myCohort is loaded for isScientificModeEnabled getter
    await this.loadUserCohorts()

    if (this.questionSetBodyPartId) {
      await this.translateBodyPartName(this.questionSetBodyPartId)
    }
    this.$store.state.user.vendorStylePreference = this.$store.state.user.softwareVendorPreference
    this.resetPreloadImages()
    if (this.isCTLab) {
      this.localSoftwareVersionPreference = 'scanlab'
    } else if (this.test?.preparedExamId) {
      this.localSoftwareVersionPreference = this.test.softwareVersion
    } else if (
      this.$route.query.ignoreVendorUI === true ||
      this.$route.query.ignoreVendorUI === 'true' ||
      this.isEditingQuestion
    ) {
      this.localSoftwareVersionPreference = 'scanlab'
      console.log('42 ignoreVendorUI inside', this.$route.query.ignoreVendorUI)
      console.log('42 isEditingQuestion inside', this.isEditingQuestion)
    } else {
      this.localSoftwareVersionPreference = this.softwareVersionPreference
    }

    this.updateLocalSoftwareVersionPreference(this.localSoftwareVersionPreference)
    const urlParams = new URLSearchParams(window.location.search)
    const allParams = {}

    // Get all parameters
    urlParams.forEach((value, key) => {
      allParams[key] = value
    })
    console.log('urlParams checked======', allParams)

    // if (Object.prototype.hasOwnProperty.call(allParams, 'test')) {
    //   const testParam = urlParams.get('test')

    //   if (testParam !== null && testParam !== '') {
    //     console.log('testParam======', testParam)
    //     this.isTestParameterValid = true
    //   } else {
    //     this.isTestParameterValid = false
    //   }
    // } else if (Object.prototype.hasOwnProperty.call(allParams, 'dicom')) {
    //   console.log('dicom======', allParams)
    //   if (Object.prototype.hasOwnProperty.call(allParams, 'isUltralab')) {
    //     console.log('isUltralab======', allParams)
    //     const dicomParam = urlParams.get('dicom')
    //     const ultralabParam = urlParams.get('isUltraLab')
    //     // Convert 'ultralabParam' from string to boolean
    //     const isUltralabFalse = ultralabParam === 'false'

    //     if (dicomParam !== null && dicomParam !== '' && isUltralabFalse) {
    //       console.log('ultralabParam (boolean):', isUltralabFalse)
    //       console.log('dicomParam:', dicomParam)
    //       this.isTestParameterValid = true
    //     } else {
    //       this.isTestParameterValid = false
    //     }
    //   } else {
    //     this.isTestParameterValid = false
    //   }
    // } else {
    //   this.isTestParameterValid = false
    // }

    // Has to be bound regardless, because we don't know if we're taking a test until later

    if (Object.prototype.hasOwnProperty.call(allParams, 'test')) {
      const testParam = urlParams.get('test')
      if (testParam !== null && testParam !== '') {
        console.log('testParam======', testParam)
        this.isTestParameterValid = true
      } else {
        this.isTestParameterValid = false
      }
    } else if (Object.prototype.hasOwnProperty.call(allParams, 'dicom')) {
      console.log('dicom======', allParams['dicom'])
      if (Object.prototype.hasOwnProperty.call(allParams, 'isUltraLab')) {
        // Corrected the case sensitivity
        console.log('isUltraLab======', allParams['isUltraLab']) // Log the correct parameter
        const dicomParam = allParams['dicom'] //urlParams.get('dicom')
        const ultralabParam = allParams['isUltraLab'] //urlParams.get('isUltraLab') // Corrected the case sensitivity

        if (dicomParam !== null && dicomParam !== '' && ultralabParam == 'false') {
          console.log('ultralabParam (boolean):', ultralabParam == 'false')
          console.log('dicomParam:', dicomParam)
          this.isTestParameterValid = true
        } else {
          this.isTestParameterValid = false
        }
      } else {
        this.isTestParameterValid = false
      }
    } else {
      this.isTestParameterValid = false
    }
    window.addEventListener('beforeunload', this.beforeUnload)
    window.addEventListener('pagehide', this.pageHide)

    // Get all parameters
    urlParams.forEach((value, key) => {
      allParams[key] = value
    })
    console.log('urlParams checked======', allParams)

    // if (Object.prototype.hasOwnProperty.call(allParams, 'test')) {
    //   const testParam = urlParams.get('test')

    //   if (testParam !== null && testParam !== '') {
    //     console.log('testParam======', testParam)
    //     this.isTestParameterValid = true
    //   } else {
    //     this.isTestParameterValid = false
    //   }
    // } else if (Object.prototype.hasOwnProperty.call(allParams, 'dicom')) {
    //   console.log('dicom======', allParams)
    //   if (Object.prototype.hasOwnProperty.call(allParams, 'isUltralab')) {
    //     console.log('isUltralab======', allParams)
    //     const dicomParam = urlParams.get('dicom')
    //     const ultralabParam = urlParams.get('isUltraLab')
    //     // Convert 'ultralabParam' from string to boolean
    //     const isUltralabFalse = ultralabParam === 'false'

    //     if (dicomParam !== null && dicomParam !== '' && isUltralabFalse) {
    //       console.log('ultralabParam (boolean):', isUltralabFalse)
    //       console.log('dicomParam:', dicomParam)
    //       this.isTestParameterValid = true
    //     } else {
    //       this.isTestParameterValid = false
    //     }
    //   } else {
    //     this.isTestParameterValid = false
    //   }
    // } else {
    //   this.isTestParameterValid = false
    // }

    // Has to be bound regardless, because we don't know if we're taking a test until later

    if (Object.prototype.hasOwnProperty.call(allParams, 'test')) {
      const testParam = urlParams.get('test')
      if (testParam !== null && testParam !== '') {
        console.log('testParam======', testParam)
        this.isTestParameterValid = true
      } else {
        this.isTestParameterValid = false
      }
    } else if (Object.prototype.hasOwnProperty.call(allParams, 'dicom')) {
      console.log('dicom======', allParams['dicom'])
      if (Object.prototype.hasOwnProperty.call(allParams, 'ignoreVendorUI')) {
        // Corrected the case sensitivity
        console.log('vendors ignored======', allParams['ignoreVendorUI']) // Log the correct parameter
        const dicomParam = allParams['dicom'] //urlParams.get('dicom')
        const ignoreVendor = allParams['ignoreVendorUI'] //urlParams.get('isUltraLab') // Corrected the case sensitivity

        if (dicomParam !== null && dicomParam !== '' && ignoreVendor == 'false') {
          console.log('ignoreVendor (boolean):', ignoreVendor == 'false')
          console.log('dicomParam:', dicomParam)
          this.isTestParameterValid = true
        } else {
          this.isTestParameterValid = false
        }
      } else {
        this.isTestParameterValid = false
      }
    } else {
      this.isTestParameterValid = false
    }
    console.log('finally is test param valid', this.isTestParameterValid)
    window.addEventListener('beforeunload', this.beforeUnload)
    window.addEventListener('pagehide', this.pageHide)
    this.$store.dispatch('stackService/setIsOnMriView', true)
    this.$store.dispatch('stackService/resetMriModelBbox')

    await this.resetMRI()
    let elRoot = $(this.$el)
    let el = elRoot.find('.box-container')[0]
    // This is "mounted" after the SliceView ones are, except for waiting for selectionConfig.ready, meaning that the SliceView would add the instances of StackVolumeSlection of the old selectionsConfigs before the below sets them right
    let dicomFileSetId = this.$route.query.dicom
    let questionSetId = this.$route.query.questionSet
    let testId = this.$route.query.test

    if (this.isCTLab) {
      this.resetMRIScanState()
      this.resetInjectorState()
      this.resetTimingDecisionState()

      // Set testInjectionMode default
      this.setTestInjectionMode(this.$store.getters['user/injectionMode'])
      this.setTestInjectCondition(this.$store.getters['user/injectCondition'])
      this.setPowerInjectorCurrentDuration(0.0)
      this.setLastPowerInjectorCurrentDuration(0.0)
    }

    this.$store.dispatch('questionService/setIsEditingQuestion', { isEditingQuestion: this.isEditingQuestion }) // this makes isTakingTest accurate
    this.$store.dispatch('selectionConfig/init')
    this.setIsUltraLab(this.isUltraLab)
    if (this.isEditingQuestion) {
      this.fetchQuestionSetOptions()
    }
    this.setIsLoadingStartTest(false)
    await this.$store.dispatch('threeJSSVGProvider/init')
    if (questionSetId) {
      await this.$store.dispatch('questionService/loadQuestionSet', {
        elProgressBar: el,
        questionSetId,
        dicomFileSetId,
      })
      this.$nextTick(() => {
        this.initializeAdminControls()
      })
    } else if (testId && this.test) {
      this.showSandboxModeDialog = this.test.isSandbox === true
      this.$store.dispatch('questionService/loadCriticalThinkingQuestionsFromTest', { test: this.test })
      const questionSetId = _.find(this.test.questions, { type: 'QUESTIONSET' }).id
      // Both CT and MR tests need to load patient info for screening form
      this.setIsLoadingScreeningFormPatientInfo(true)
      await this.$store.dispatch('questionService/loadQuestionSet', { questionSetId })
      this.$nextTick(() => {
        this.initializeAdminControls()
      })
    } else if (testId && !this.test) {
      // requesting a test but none loaded in session
      this.$router.push({ name: 'region-selection' })
    } else {
      // No initial selections available, add preset selection group

      await this.$store.dispatch('selectionConfig/addSelectionConfigGroup', { groupId: 0 })
      await this.$store.dispatch('dicomService/loadDicomGroup', { dicomFileSetId })
      this.$store.dispatch('selectionConfig/applyScientificModePreferences')
      this.$nextTick(() => {
        this.initializeAdminControls()
      })
    }
    if (!this.isCTLab && !this.isViewingCriticalThinkingQuestion && !this.testResultAugmented) {
      startMriLoop()
    }
    this.$store.dispatch('questionService/getListPatientModel')
    await this.$store.dispatch('selectionConfig/selectTool', { tool: 'pan' })
    this.configAngioExams()
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    EventBus.$on('clearSelectedSliceViews', this.onClearSelectedSliceViews)
  },
  async beforeDestroy() {
    stopAllMriAudio()
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    EventBus.$off('clearSelectedSliceViews', this.onClearSelectedSliceViews)
    this.resetPreloadImages()
    window.removeEventListener('beforeunload', this.beforeUnload)
    window.removeEventListener('pagehide', this.pageHide)
    this.$store.dispatch('questionService/setIsEditingQuestion', { isEditingQuestion: false })
    if (this.previewScorePoller) {
      clearInterval(this.previewScorePoller)
    }
    if (this.shouldAbandonTest) {
      // Chose to abandon the test
      await this.$store.dispatch('questionService/submitTestRun', {})
    }

    this.$store.dispatch('stackService/setIsOnMriView', false)

    await this.$store.dispatch('testRunService/reset', {})
    await this.$store.dispatch('questionService/resetTest', {})
    this.resetMRI()
  },
  beforeRouteLeave(to, from, next) {
    if (this.shouldAbandonTest) {
      this.nextRoute = next
      next(false)
      this.showAbandonDialog = true
    } else {
      next()
    }
  },
  watch: {
    isAudioSuppressed: {
      immediate: true,
      handler(val) {
        setAudioSuppressed(val)
      },
    },
    isViewingCriticalThinkingQuestion(viewing) {
      if (this.isCTLab) return
      if (viewing) {
        stopMriLoop()
      } else if (!this.testResultAugmented) {
        startMriLoop()
      }
    },
    selectedStackQuestionIndexVisual(newIndex, oldIndex) {
      const groupCount = this.selectionConfigsGroups.length

      clearTimeout(this.timeoutY)
      clearTimeout(this.timeoutX)
      // Only apply logic when there are multiple groups
      if (groupCount > 1 && newIndex !== oldIndex) {
        // Reset all first
        this.showY = false
        this.showX = false

        // Now re-enable with staggered timing
        this.timeoutY = setTimeout(() => (this.showY = true), 2000)
        this.timeoutX = setTimeout(() => {
          this.showX = true
        }, 4000)
      }
    },
    'test.preparedExamId': {
      immediate: true,
      handler(newValue) {
        if (this.isCTLab) {
          this.localSoftwareVersionPreference = 'scanlab'
        } else if (newValue) {
          this.localSoftwareVersionPreference = this.test.softwareVersion
        } else {
          this.localSoftwareVersionPreference = this.softwareVersionPreference
        }
      },
    },
    softwareVersionPreference(newValue) {
      if (this.isCTLab) {
        this.localSoftwareVersionPreference = 'scanlab'
      } else if (this.test?.preparedExamId) {
        this.localSoftwareVersionPreference = this.test.softwareVersion
      } else if (
        this.$route.query.ignoreVendorUI === true ||
        this.$route.query.ignoreVendorUI === 'true' ||
        this.isEditingQuestion
      ) {
        this.localSoftwareVersionPreference = 'scanlab'
      } else {
        this.localSoftwareVersionPreference = newValue
      }
    },
    localSoftwareVersionPreference(newValue) {
      this.updateLocalSoftwareVersionPreference(newValue)
    },
    adminSliceSelection(newValue) {
      if (this.isAdmin) {
        this.updateAllSelectionConfigs('sliceSelection', newValue)
      }
    },
    adminEnableTSEBlur(newValue) {
      if (this.isAdmin) {
        // TSE blur is only supported in UltraLab mode
        this.updateAllSelectionConfigs('enableTSEBlur', this.isUltraLab ? newValue : false)
      }
    },
    adminEnableResolution(newValue) {
      if (this.isAdmin) {
        // Resolution is supported in UltraLab and Resolution Lab modes
        this.updateAllSelectionConfigs('enableResolution', this.isUltraLab || this.isResolutionLab ? newValue : false)
      }
    },
    isResolutionLab(newVal) {
      if (newVal) {
        this.$store.dispatch('selectionConfig/applyScientificModePreferences')
        this.$nextTick(() => {
          const firstConfig = Object.values(this.$store.state.selectionConfig.selectionConfigsByIdent)[0]
          if (firstConfig) {
            this.adminEnableResolution = firstConfig.enableResolution || false
          }
        })
      }
    },
    adminEnableCompactMode(newValue) {
      if (this.isAdmin) {
        this.updateAllSelectionConfigs('enableCompactMode', newValue)
      }
    },
    adminEnableFovWrap(newValue) {
      if (this.isAdmin) {
        this.updateAllSelectionConfigs('enableFovWrap', newValue)
        if (newValue) {
          // Automatically enable compact mode when FOV Wrap is enabled
          this.adminEnableCompactMode = true
        }
      }
    },
    adminEnableCruncherResolution(newValue) {
      if (this.isAdmin) {
        this.updateAllSelectionConfigs('enableCruncherResolution', newValue)
      }
    },
    adminEnableCruncherBasicLab(newValue) {
      if (this.isAdmin) {
        this.updateAllSelectionConfigs('enableCruncherBasicLab', newValue)
      }
    },
    adminEnableBitDepth8(newValue) {
      if (this.isAdmin) {
        this.updateAllSelectionConfigs('enableBitDepth8', newValue)
      }
    },
    adminEchoOrdering(newValue) {
      if (this.isAdmin) {
        this.updateAllSelectionConfigs('echoOrdering', newValue)
      }
    },
  },
}
</script>
<style lang="scss">
.truncated-field {
  height: auto !important;
  overflow: hidden;
  margin-bottom: 18px !important;
}
.col-2-5 {
  flex: 0 0 20.833%;
  max-width: 20.833%;
}
.col-9-5 {
  flex: 0 0 79.167%;
  max-width: 79.167%;
}
.col-3-5 {
  flex: 0 0 29.16%;
  max-width: 29.16%;
}
.ct-dot-scale-slider {
  &.dot-size-slider {
    margin-top: 0 !important;
  }
  .v-input__control {
    .v-messages {
      display: none;
    }
    .v-input__slot {
      margin-bottom: 0;
    }
  }
}
.mr-newui-version-container {
  .slice-view-toolbar-container {
    width: 100%;
    overflow-x: auto;
    .slice-btn-group {
      margin-left: 0 !important;
      flex-wrap: wrap;
      .v-btn {
        padding: 0 3px !important;
        font-size: 0.7rem;
      }
    }
  }
  .injector-and-patient-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
    border: solid 2px #c5c6c7;
    .card-container {
      width: 0px;
      flex: auto;
    }
    .card-tabs {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-around;
      height: 100%;
      .tab-item {
        text-align: center;
        writing-mode: vertical-lr;
        // text-orientation: upright;
        transform: rotate(180deg);
        white-space: nowrap;
        overflow: hidden;
        cursor: pointer;
        border: solid 2px #c5c6c7;
        border-left: none;
        flex: auto;
        &:hover {
          color: #247ba0;
          background: #ecf7fa;
        }
        &.active {
          color: #247ba0;
          background: #ecf7fa;
        }
      }
    }
  }
}
</style>
<style scoped lang="scss">
.group-selection-button {
  background-color: #f5f5f5;
  height: 36px;
  padding: 0 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  &.active {
    background-color: rgba($color: #000000, $alpha: 0.16);
    color: white;
  }
}
.w-200 {
  width: 200px;
}

.loading-bar {
  position: absolute;
  z-index: 1;
  margin: 237px 0px 237px 700px;
  width: 500px;
}

.hidden-slices-wrapper {
  display: none;
}

@keyframes glowing {
  0% {
    background-color: #f0bd17;
    box-shadow: 0 0 3px #f0bd17;
  }

  50% {
    background-color: #f08b17;
    box-shadow: 0 0 40px #f08b17;
  }

  100% {
    background-color: #f0bd17;
    box-shadow: 0 0 3px #f0bd17;
  }
}

.btn-glowing {
  -webkit-animation: glowing 1500ms infinite;
  -moz-animation: glowing 1500ms infinite;
  -o-animation: glowing 1500ms infinite;
  animation: glowing 1500ms infinite;
  outline: 4px solid #f08b17 !important;
  outline-offset: -4px;
}

.landmark-mri-view-container {
  width: 100%;
  height: 100%;
}

.mri-machine-actions {
  margin-top: 20px;
  padding: 0 20px;
  gap: 20px;
  width: 100%;
}

.patient-position-item {
  border: 1px solid rgba(7, 25, 32, 0.125);
  padding: 0.75rem 1.25rem !important;
  cursor: pointer;

  &.active {
    background-color: #247ba0;
    border-color: #247ba0;
    color: aliceblue;
  }
}

.subtitle {
  color: rgb(177, 177, 177);
  font-size: 14px;
}

.question-stepper {
  .v-stepper__step.disabled {
    opacity: 0.5;
  }
}

.question-card {
  padding: 1.2em;
  min-width: 45vw;
}

.column-space {
  margin-bottom: -1.5rem !important;
}

.selection-forms-sub {
  padding: 20px !important;
  padding-left: 34px !important;
  padding-top: 6px !important;
}

.test-question {
  width: 33%;

  &:first-child {
    width: 30%;
  }

  min-height: 170px;
  text-align: left;
  margin-right: 30px;

  &:last-child {
    margin-right: 0;
  }
}

.box-container {
  align-items: stretch;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
}

.windowing-style-group {
  .custom-control {
    display: inline;
    margin-left: $spacing-tiny;
  }
}

label {
  font-weight: bold;
  margin-right: $spacing-small;
}

.blur-content {
  filter: blur(5px);
}

.groups-add-remove {
  margin-left: 10px;
  font-size: 120%;
}

.admin-only-score-preview-content {
  height: 280px;
  overflow-y: scroll;
}

.v-btn.no-transform {
  text-transform: none;
  letter-spacing: 0;
}

.v-btn.bold {
  font-weight: bold;
}

.v-btn.group-button {
  margin: 0 5px;
}

.v-btn.active {
  background-color: $light-blue;
  color: $white !important;
  border-color: $light-blue !important;
}

.selection-forms {
  display: flex;
}

.header-gradient-region {
  background-image: $gradient-gray;
  border: 0;
  margin-top: 0;
}

.scan-view-options {
  background-color: $white;
  flex-grow: 1;

  header {
    font-weight: bold;
  }
}

.view-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  user-select: none;
}

.scanlab-toggle {
  cursor: pointer;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: $gray-four;
  border-radius: 5px;
  padding: 1px;
  max-width: 100px;

  .on,
  .off {
    user-select: none;
    width: 100px;
    border-radius: 5px;
    padding: 3px;
    margin: 1px;
    font-weight: bold;

    &.active {
      color: $white;
      background-color: $button-blue;
    }
  }
}

.question-counter {
  font-size: 18px;
}

.theme--light.v-card .v-card__subtitle,
.theme--light.v-card > .v-card__text {
  color: $black;
}

.dot-size-slider {
  margin-top: 20px;
  margin-left: 15px;
}

.freebie {
  color: red;
  font-size: 1.2rem;
  font-weight: bold;
  margin-right: 0.2rem;
}

.step {
  font-size: 0.7rem;
}

.rubric-holder {
  position: fixed;
  opacity: 0;
  top: 65px;
  left: 0;
  z-index: 9999;
  max-width: 50%;

  &:hover {
    opacity: 1;
  }
}

.force-visible {
  opacity: 1 !important;
}

.score-preview-holder {
  position: fixed;
  opacity: 0;
  top: 65px;
  right: 0;
  z-index: 10;

  &:hover {
    opacity: 1;
  }

  .traffic-light-icon-holder {
    padding-right: 8px;

    .traffic-light-icon {
      font-size: 20px;
    }
  }

  .traffic-light-label-holder {
    text-align: left;
  }
}

.param-hint-time-corners {
  border: 2px solid #ffc107;
}
.param-hint-rf-corners {
  border: 2px solid red;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .question-card {
    min-width: 60vw;
  }

  .box-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .test-question {
    width: 100%;
    margin-right: 0;
  }
}

@media (max-width: 992px) {
  .patient-position-item {
    padding: 0.5rem 1rem !important;
  }

  .question-card {
    min-width: 80vw;
  }

  .dot-size-slider {
    margin-top: 15px;
    margin-left: 10px;
  }
}

@media (max-width: 768px) {
  .mri-machine-actions {
    padding: 0 10px;
  }

  .selection-forms-sub {
    padding: 10px !important;
    padding-left: 20px !important;
  }

  .question-card {
    padding: 0.8em;
  }

  .box-container {
    flex-direction: column;
    align-items: stretch;
  }

  .test-question {
    width: 100%;
    margin-right: 0;
    min-height: auto;
  }
}

@media (max-width: 576px) {
  .question-card {
    min-width: 100vw;
  }

  .patient-position-item {
    padding: 0.5rem 1rem !important;
  }

  .dot-size-slider {
    margin-top: 10px;
    margin-left: 5px;
  }
}
.btn-color-green {
  background-color: #41b950 !important;
  color: black !important;
}
</style>
