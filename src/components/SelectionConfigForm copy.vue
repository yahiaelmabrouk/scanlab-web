<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="selection-config-form" :class="isCurrent ? 'current-selection' : ''">
    <v-tabs v-model="activeTab" :show-arrows="false">
      <header class="flex align-center">
        <v-tab v-if="isSelectionMin">{{ $t('global.min_configuration') }}</v-tab>
        <v-tab v-else-if="isSelectionMax">{{ $t('global.max_configuration') }}</v-tab>
        <v-tab v-else-if="isAddLocalizerMode">{{ $t('global.localizer_configuration') }}</v-tab>
        <h4 v-else class="tab-1">
          <v-tab v-if="questionSet && !isEditingQuestion">{{ $t('global.question_criteria') }}</v-tab>
          <v-tab @click="questionTabOpen" :class="isSelectedTab ? 'blink' : ''">{{ $t('global.parameters') }}</v-tab>
          <v-tab v-if="false">{{ $t('global.hotkey_guide') }}</v-tab>
        </h4>
        <v-btn-toggle
          v-model="selectionConfig.fieldStrength"
          class="contrast-lab-buttons"
          v-if="!isAddLocalizerMode && isContrastLab"
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

        <v-tooltip v-if="isResolutionLab" top>
          <template #activator="{ on, attrs }">
            <p class="resolution-label" v-bind="attrs" v-on="on" v-if="isResolutionLab">
              {{ trueResolutionHeader }}
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
        <div class="contrast-lab-buttons" v-if="!isAddLocalizerMode && isContrastLab">
          <v-btn
            tile
            outlined
            v-for="sequenceType in availableSequenceTypes"
            :key="sequenceType"
            :class="{ 'no-transform bold mr-5 cl-button': true, active: selectionConfig.sequenceType === sequenceType }"
            @click="submitActualSequenceType(sequenceType)"
            color="buttonBlue"
          >
            {{ sequenceType }}
          </v-btn>
        </div>
      </header>
      <v-tab-item
        v-if="questionSet && !isEditingQuestion && !isAddLocalizerMode && !isSelectionMin && !isSelectionMax"
        class="tab-1"
      >
        <template v-if="selectedStackQuestionIndexVisual != 1">
          <v-row cols="12" align="center" justify="space-between" class="criteria_area">
            <v-card class="col-12">
              <v-row align="center" justify="space-between" class="">
                <v-card-title class="flex justify-space-between align-center">
                  <h5 class="mb-0">
                    {{ $t('global.question', languageCode) }}
                    {{ selectedStackQuestionIndexVisual }}
                    {{ $t('global.of', languageCode) }}
                    {{ stackQuestionsLength + 1 }}
                  </h5>
                  <v-row justify="end" align="center" class="mr-2" v-if="stackQuestionsLength > 1">
                    <!-- <div class="mr-4 cycle-question-button" @click="selectPrevQuestion">
                      <img v-if="selectedStackQuestionIndexVisual <= 1" src="@/assets/svg/back-button-disabled.svg" />
                      <img v-else src="@/assets/svg/back-button.svg" />
                    </div> -->
                    <!-- <div class="cycle-question-button" @click="selectNextQuestion">
                      <img
                        v-if="selectedStackQuestionIndexVisual >= stackQuestionsLength"
                        src="@/assets/svg/forward-button-disabled.svg"
                      />
                      <img v-else src="@/assets/svg/forward-button.svg" />
                    </div> -->
                  </v-row>
                </v-card-title>
              </v-row>
              <v-card-text class="pt-0 pl-0">
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
                        }"
                      />
                    </template>
                  </v-select>
                </v-col>
                <v-card-text class="pt-0">
                  <v-row class="pt-0 truncated-field pa-4">
                    <TranslatedContent
                      type="stackQuestion"
                      v-if="!isChallengeModeEnabledForMe"
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
                        v-if="!isChallengeModeEnabledForMe"
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
      </v-tab-item>

      <v-tab-item>
        <hr class="header-gradient-region" />
        <!-- CT specific input fields layout -->
        <v-container v-if="isForCT">
          <template v-if="selectedStackQuestionIndexVisual == 1">
            <v-row>
              <v-col class="pt-0 pb-0 d-flex align-items-center" cols="3">
                <p>Localizer</p>
              </v-col>
              <v-col class="pt-0 pb-0" cols="3">
                <!-- Caudocranial/Craniocaudal -->
                <div v-if="isAcquisitionQuestion">
                  <v-radio-group v-model="ctScanDirection">
                    <v-radio label="Caudocranial" value="caudocranial"></v-radio>
                    <v-radio label="Craniocaudal" value="craniocaudal"></v-radio>
                  </v-radio-group>
                </div>
              </v-col>
            </v-row>
          </template>
          <template v-if="selectedStackQuestionIndexVisual != 1">
            <v-row>
              <v-col class="pt-0 pb-0">
                <!-- Helical Mode -->
                <div class="slice-form" v-if="isAcquisitionQuestion">
                  <v-radio-group v-model="helicalMode" row :disabled="true">
                    <v-radio label="Helical" :value="true"></v-radio>
                    <v-radio label="Axial" :value="false"></v-radio>
                  </v-radio-group>
                </div>
                <!-- 3D -->
                <div class="slice-form" v-if="!isAcquisitionQuestion">
                  <v-radio-group row>
                    <v-radio label="3D" value="one"></v-radio>
                  </v-radio-group>
                </div>
              </v-col>
              <v-col class="pt-0 pb-0">
                <!-- Caudocranial/Craniocaudal -->
                <div v-if="isAcquisitionQuestion">
                  <v-radio-group v-model="ctScanDirection">
                    <v-radio label="Caudocranial" value="caudocranial"></v-radio>
                    <v-radio label="Craniocaudal" value="craniocaudal"></v-radio>
                  </v-radio-group>
                </div>
              </v-col>
              <v-col class="pt-0 pb-0">
                <!-- Scan Duration -->
                <div v-if="isForCT">
                  <label class="slice-form">Scan Duration</label>
                  <v-text-field :type="'number'" v-model="scanTimeCT" outlined dense rounded class="" disabled />
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col class="pt-0 pb-0">
                <!-- Slice Thickness -->
                <div v-if="!isAddLocalizerMode" class="slice-form">
                  <div class="label-with-unit">
                    <label>{{ $t('global.slice_thickness_mm') }}<UnitCaption unit="(mm)" /></label>
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
                      v-if="!isSingleSliceMode"
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
                  <div class="font-weight-normal text-muted text-left">Min: 0 | Max: 60</div>
                </div>
              </v-col>
              <v-col class="pt-0 pb-0">
                <!-- mAs -->
                <div class="slice-form" v-if="isAcquisitionQuestion">
                  <label>mAs</label>
                  <b-form-input class="adj-input" value="Auto" />
                </div>
                <!-- Slice Gap -->
                <!-- For SingleSlice, gap between slices makes no sense (there is just one); but if you're Adding a Localizer, you're adding multiple slices again -->
                <div
                  v-if="(!isSingleSliceMode || isAddLocalizerMode || spacing < 0) && !isAcquisitionQuestion"
                  class="slice-form"
                >
                  <div class="label-with-unit">
                    <label>{{ $t('global.slice_gap') }}</label>
                    <UnitCaption unit="(mm)" />
                  </div>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                    <SpinButtonWithInput
                      @input="submitSpacing"
                      v-model.number="spacing"
                      :step="0.1"
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
                      v-if="!isAddLocalizerMode"
                    >
                      <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                      <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                      <label slot="off-label"></label>
                    </p-radio>
                  </div>
                  <div class="font-weight-normal text-muted text-center">Min: 0 | Max: 200</div>
                </div>
              </v-col>
              <v-col class="pt-0 pb-0">
                <!-- KVP -->
                <div class="slice-form" v-if="isAcquisitionQuestion">
                  <label>KVP</label>
                  <v-select :items="[80, 100, 120, 140]" :value="120"></v-select>
                </div>
                <!-- FoV-->
                <div
                  class="slice-form"
                  v-if="!isAddLocalizerMode && !isAcquisitionQuestion && !isReconstructionQuestion"
                >
                  <div class="label-with-unit">
                    <label>FoV</label>
                    <UnitCaption unit="(mm)" />
                  </div>
                  <b-form-input
                    @change="submitDimensions3y"
                    :type="'number'"
                    v-model.number="dimensions3y"
                    :disabled="complete || isDisabledParameter"
                  />
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col class="pt-0 pb-0">
                <!-- Kernels -->
                <div class="slice-form">
                  <div class="label-with-unit">
                    <label>{{ $t('SelectionConfigForm.kernels') }}</label>
                    <UnitCaption class="pl-1" unit=""></UnitCaption>
                  </div>
                  <v-combobox
                    v-model="kernel"
                    :items="kernels"
                    hide-details
                    :disabled="isDisabledParameter"
                  ></v-combobox>
                </div>
              </v-col>
              <v-col class="pt-0 pb-0">
                <!-- Rotation Time -->
                <div class="slice-form" v-if="isAcquisitionQuestion">
                  <div class="label-with-unit">
                    <label>{{ $t('SelectionConfigForm.rotation_time') }}</label>
                  </div>
                  <v-select :items="[0.33, 0.5, 1.0, 1.5]" v-model.number="rotationTime"></v-select>
                </div>
              </v-col>
              <v-col class="pt-0 pb-0">
                <!-- pitch -->
                <div class="slice-form" v-if="isAcquisitionQuestion">
                  <label>Pitch</label>
                  <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                    <SpinButtonWithInput
                      :type="'number'"
                      v-model="pitch"
                      :step="0.5"
                      :min="0.3"
                      :max="1.5"
                      :disabled="complete || isDisabledParameter"
                    />
                  </div>
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col class="pt-0 pb-0">
                <!-- Window -->
                <div class="slice-form">
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
              </v-col>
              <v-col cols="8" class="pt-0 pb-0">
                <div class="slice-form" v-if="isAcquisitionQuestion">
                  <!-- Beam Width --->
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
                  ></v-select>
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col class="pt-0 pb-0">
                <!-- Number of Slices -->
                <div class="slice-form" v-if="!isReconstructionQuestion">
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
                      >
                        <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                        <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                        <label slot="off-label"></label>
                      </p-radio>
                    </div>
                  </div>
                </div>
              </v-col>
              <v-col class="pt-0 pb-0">
                <!-- FOV -->
                <div class="slice-form" v-if="!isAddLocalizerMode && isAcquisitionQuestion">
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
              </v-col>
              <v-col class="pt-0 pb-0">
                <!-- Scan Length -->
                <div class="slice-form" v-if="isAcquisitionQuestion">
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
              </v-col>
            </v-row>
          </template>
        </v-container>
        <!-- CT input filds -->

        <!-- MR Classic input fields layout -->
        <div class="form-container" v-if="!isForCT">
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
              <!-- <div class="mt-8">
                <v-btn
                  tile
                  outlined
                  class="no-transform bold"
                  color="buttonBlue"
                  @click="smartRotateSelectionConfigDir"
                >
                  {{ $t('MRI.swap_phase') }}
                </v-btn>
              </div> -->
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
                  v-if="!isSingleSliceMode"
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
                <label>{{ $t('global.slice_gap') }}</label>
                <UnitCaption unit="(mm)" />
              </div>
              <div :class="isCurrent ? 'input-lock' : 'min-max-lock'">
                <SpinButtonWithInput
                  @input="submitSpacing"
                  v-model.number="spacing"
                  :step="0.1"
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
                  v-if="!isAddLocalizerMode"
                >
                  <img class="svg" slot="extra" src="@/assets/svg/unlocked.svg" />
                  <img class="svg" slot="off-extra" src="@/assets/svg/locked.svg" />
                  <label slot="off-label"></label>
                </p-radio>
              </div>
              <div class="font-weight-normal text-muted text-center">Min: 0 | Max: 200</div>
            </div>

            <!-- Frequency FoV and Phase FoV-->
            <div class="slice-form" v-if="!isAddLocalizerMode && !isAcquisitionQuestion && !isReconstructionQuestion">
              <div class="label-with-unit">
                <label>{{ $t('global.frequency_mm') }}</label>
                <UnitCaption unit="(mm)" />
              </div>
              <b-form-input
                @change="submitDimensions3y"
                :type="'number'"
                v-model.number="dimensions3y"
                :disabled="complete || isDisabledParameter"
              />

              <div class="label-with-unit">
                <label>{{ $t('global.phase_mm') }}</label>
                <UnitCaption unit="(mm)" />
              </div>
              <b-form-input
                @change="submitDimensions3x"
                :type="'number'"
                v-model.number="dimensions3x"
                :disabled="complete || isDisabledParameter"
              />
            </div>

            <!-- Frequency Matrix -->
            <div
              class="slice-form"
              v-if="!isAddLocalizerMode && isResolutionLab && isAcquisitionQuestion && !isReconstructionQuestion"
            >
              <label>{{ $t('global.frequency_matrix') }}</label>
              <b-form-spinbutton
                v-model.number="frequencyMatrix"
                step="32"
                min="64"
                max="512"
                class="spinner"
                :disabled="complete || isDisabledParameter"
              ></b-form-spinbutton>
              <label>{{ $t('global.phase_matrix') }}</label>
              <b-form-spinbutton
                step="32"
                :min="0"
                :max="maxPhaseMatrix"
                class="spinner"
                :disabled="complete || isDisabledParameter"
                v-model.number="phaseMatrix"
              ></b-form-spinbutton>
            </div>

            <!-- Frequency Voxel Size and Phase Voxel Size -->
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
              <label>{{ $t('global.oversampling_mm') }}</label>
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
              <b-form-input class="adj-input" :type="'number'" :disabled="isDisabledParameter" />
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
            <div v-show="isForCT && !isAddLocalizerMode" class="slice-form">
              <div class="label-with-unit">
                <label>{{ $t('SelectionConfigForm.kernels') }}</label>
                <UnitCaption class="pl-1" unit=""></UnitCaption>
              </div>
              <v-combobox v-model="kernel" :items="kernels" hide-details :disabled="isDisabledParameter"></v-combobox>
            </div>
            <div class="slice-form" v-if="isForCT && !isAddLocalizerMode">
              <div class="label-with-unit">
                <label>{{ $t('SelectionConfigForm.tube_potential') }}</label>
                <UnitCaption unit="(kV)" />
              </div>
              <b-form-input :type="'number'" v-model.number="tubePotential" :disabled="isDisabledParameter" />
            </div>
            <div class="slice-form" v-if="isForCT && !isAddLocalizerMode">
              <div class="label-with-unit">
                <label>{{ $t('SelectionConfigForm.tube_current') }}</label>
                <UnitCaption unit="(mA)" />
              </div>
              <b-form-input :type="'number'" v-model.number="tubeCurrent" :disabled="isDisabledParameter" />
            </div>
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
          </v-row>

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

          <div v-show="isContrastLab && inversionRecovery && displayedSequenceType === 'SE'" class="slice-form">
            <div class="label-with-unit">
              <label>{{ $t('SelectionConfigForm.inversion_time') }}</label>
              <UnitCaption unit="ms" />
            </div>
            <b-form-input :type="'number'" v-model.number="inversionTime" :disabled="complete || isDisabledParameter" />
          </div>

          <div v-show="isContrastLab && displayedSequenceType === 'GRE'" class="slice-form">
            <div class="label-with-unit">
              <label>{{ $t('SelectionConfigForm.flip_angle') }}</label>
              <UnitCaption class="pl-1" unit="°"></UnitCaption>
            </div>

            <b-form-input :type="'number'" v-model.number="flipAngle" :disabled="isDisabledParameter" />
          </div>

          <v-col v-if="isContrastLab">
            <div class="slice-form">
              <b-form-checkbox
                v-model="fatSuppression"
                :disabled="inversionRecovery || complete || isDisabledParameter"
              >
                {{ $t('SelectionConfigForm.fat_suppression') }}
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
          </v-col>
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
  </div>
</template>

<script>
// @ is an alias to /src

import { SCAN_STATUS } from '../constants'
import log from 'loglevel'
import { mapState, mapGetters, mapActions } from 'vuex'
import _ from 'lodash'
import ArrowRightBoldIcon from 'icons/ArrowRightBold'
import ArrowRightIcon from 'icons/ArrowRight'
import UnitCaption from './UnitCaption'
import SpinButtonWithInput from './SpinButtonWithInput.vue'
import TranslatedContent from '@/components/TranslatedContent'
import config from '../config'
import { convertWindowLevelWidth } from '@/lib/math-util'
import EventBus from '@/lib/event-bus'
const { isCTLab } = config

export default {
  name: 'SelectionConfigForm',
  components: {
    ArrowRightBoldIcon,
    ArrowRightIcon,
    UnitCaption,
    TranslatedContent,
    SpinButtonWithInput,
  },
  props: {
    selectionIdent: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      numberOfSlicesLocal: null,
      thicknessLocal: null,
      spacingLocal: null,
      dimensions3xLocal: null,
      dimensions3yLocal: null,
      echoTimeLocal: null,
      repetitionTimeLocal: null,
      inversionTimeLocal: null,
      flipAngleLocal: null,
      inversionRecoveryLocal: false,
      fatSuppressionLocal: null,
      oversamplingLocal: null,
      hasLookedAtAnswersSelectionsByQuestionId: {},
      testId: this.$route.query.test ?? null,
      helicalMode: true,
      kernelLocal: null,
      kernels: isCTLab
        ? ['Smooth', 'Medium', 'Sharp']
        : ['B10f', 'B20f', 'B30f', 'B40f', 'B50f', 'B60f', 'B70f', 'B80f'],
      isForCT: isCTLab,
      windowLevelLocal: null,
      windowWidthLocal: null,
      windowLevelWidthLocal: null,
      windowLevelWidths: [
        {
          text: 'Soft tissue',
          value: 'soft',
          windowLevel: 40,
          windowWidth: 400,
        },
        {
          text: 'Lung',
          value: 'lung',
          windowLevel: -600,
          windowWidth: 1500,
        },
        {
          text: 'Bone',
          value: 'bone',
          windowLevel: 600,
          windowWidth: 3000,
        },
        {
          text: 'Brain',
          value: 'brain',
          windowLevel: 40,
          windowWidth: 80,
        },
        {
          text: 'Vascular',
          value: 'vascular',
          windowLevel: 100,
          windowWidth: 90,
        },
      ],
      tubePotentialLocal: null,
      tubeCurrentLocal: null,
      displayWindowWidth: 0,
      displayWindowLevel: 0,
      SCAN_STATUS: SCAN_STATUS,
      pitch: 0.8,
      beamSelected: { text: 'Wide: 40mm', value: 40, dim: '64 x 1.2' },
      beamSelectItems: [
        {
          text: 'Wide: 40mm',
          value: 40,
          dim: '64 x 1.2',
        },
        {
          text: 'Narrow: 20mm',
          value: 20,
          dim: '32 x 0.6',
        },
        {
          text: 'Single Slice: 5mm',
          value: 5,
          dim: '1 x 1.2',
        },
      ],
      ctScanDirection: 'caudocranial',
    }
  },
  watch: {
    forcedFrequencyVoxelSize(newVal) {
      if (this.isEditingQuestion) {
        this.selectionConfig.frequencyVoxelSize = newVal
      }
    },
    forcedPhaseVoxelSize(newVal) {
      if (this.isEditingQuestion) {
        this.selectionConfig.phaseVoxelSize = newVal
      }
    },
    phaseVoxelSize(newValue) {
      const asNumber = new Number(newValue)
      this.selectionConfig.phaseVoxelSize = this.isEditingQuestion ? this.forcedPhaseVoxelSize : asNumber
    },
    frequencyVoxelSize(newValue) {
      const asNumber = new Number(newValue)
      this.selectionConfig.frequencyVoxelSize = this.isEditingQuestion ? this.forcedFrequencyVoxelSize : asNumber
    },
    stackQuestion() {
      // to handle AdminPreview looking at a group in one Question that doesn't exist in the next
      this.previewScoreGroupIndex = 0
    },
    windowLevel(_windowLevel) {
      this.windowLevelWidth = convertWindowLevelWidth(_windowLevel, this.windowWidth)
      this.displayWindowLevel = _windowLevel
    },
    windowWidth(_windowWidth) {
      this.windowLevelWidth = convertWindowLevelWidth(this.windowLevel, _windowWidth)
      this.displayWindowWidth = _windowWidth
    },
  },
  computed: {
    ...mapGetters('cohortService', ['isChallengeModeEnabledForMe']),
    ...mapGetters('testRunService', ['isTakingTest']),
    ...mapGetters('selectionConfig', ['selectionConfigsIdentTypeNames', 'isSingleSliceMode']),
    ...mapGetters('dicomService', [
      'isContrastLab',
      'availableSequenceTypes',
      'availableFieldStrengths',
      'isFatSatAvailable',
      'isResolutionLab',
    ]),
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'answersSelections',
      'stackQuestionsLength',
      'selectedStackQuestionIndexVisual',
      'scanSubmitted',
      'testResultAugmented',
      'answerCurrent',
      'scanSubmittedByStackQuestionId',
      'isAcquisitionQuestion',
    ]),
    ...mapState('selectionConfig', ['selectionConfigsByIdent', 'selectionConfigCurrentIdent', 'isAddLocalizerMode']),
    ...mapState('questionService', [
      'questionSet',
      'activeTab',
      'isSelectedTab',
      'answerSelectionId',
      'hasAnsweredAllStackQuestions',
      'isEditingQuestion',
      'isReconstructionQuestion',
      'scanStatus',
      'selectedStackQuestionIndex',
      'selectedStackQuestionIndexVisual',
    ]),
    ...mapState('dicomService', [
      'dicomFileSet',
      'isLoaded',
      'progressFetch',
      'progressParse',
      'progressTotal',
      'allowPageReloadWithoutConfirmation',
    ]),
    ...mapGetters('user', ['languageCode']),

    answerSelectionIdComputed: {
      get() {
        return this.answerSelectionId
      },
      set(answerSelectionId) {
        this.setAnswerSelectionId({ answerSelectionId })
      },
    },
    isEditingQuestion() {
      // This is checked before we have an ID (can't move this to a service because router there is not reactive)
      // If you want to know in a service, it's stored in questionService.isEditingQuestion
      return Boolean(this.$route.query.editing)
    },
    trueResolutionHeader() {
      return `PH ${this.phaseVoxelSize}mm | ƒ ${this.frequencyVoxelSize}mm | SL ${this.thickness.toFixed(1)}mm`
    },
    acquiredResolutionHeader() {
      return `PH ${this.frequencyVoxelSize}mm | ƒ ${this.frequencyVoxelSize}mm | SL ${this.thickness.toFixed(1)}mm`
    },
    forcedPhaseVoxelSize: {
      get() {
        return _.get(this.selectionConfig, 'phaseVoxelSize')
      },
      set(newValue) {
        if (this.isEditingQuestion) {
          this.selectionConfig.phaseVoxelSize = newValue
        }
      },
    },
    forcedFrequencyVoxelSize: {
      get() {
        return _.get(this.selectionConfig, 'frequencyVoxelSize')
      },
      set(newValue) {
        if (this.isEditingQuestion) {
          this.selectionConfig.frequencyVoxelSize = newValue
        }
      },
    },
    frequencyVoxelSize() {
      const val = this.dimensions3y / this.frequencyMatrix
      return val.toFixed(2)
    },
    phaseVoxelSize() {
      const val = this.dimensions3x / this.phaseMatrix
      return val.toFixed(2)
    },
    maxPhaseMatrix() {
      return this.frequencyMatrix
    },
    frequencyMatrix: {
      get() {
        return _.get(this.selectionConfig, 'frequencyMatrix')
      },
      set(frequencyMatrix) {
        const frequencyVoxelSize = this.dimensions3y / frequencyMatrix
        this.selectionConfig.frequencyVoxelSize = this.isEditingQuestion
          ? this.forcedFrequencyVoxelSize
          : frequencyVoxelSize
        this.selectionConfig.frequencyMatrix = frequencyMatrix
        if (this.phaseMatrix > this.frequencyMatrix) {
          this.phaseMatrix = this.frequencyMatrix
        }
      },
    },
    phaseMatrix: {
      get() {
        return _.get(this.selectionConfig, 'phaseMatrix')
      },
      set(phaseMatrix) {
        const phaseVoxelSize = this.dimensions3x / phaseMatrix
        this.selectionConfig.phaseVoxelSize = this.isEditingQuestion ? this.forcedPhaseVoxelSize : phaseVoxelSize
        this.selectionConfig.phaseMatrix = phaseMatrix
      },
    },
    complete() {
      // This requires that you are taking a TestRun. If you are just an admin viewing a QuestionSet, you can not submit that as a TestRun
      return this.hasAnsweredAllStackQuestions && this.isTakingTest
    },

    displayedSequenceType() {
      return this.selectionConfig.sequenceType === 'IR' ? 'SE' : this.selectionConfig.sequenceType
    },

    selectionConfig() {
      return this.selectionConfigsByIdent[this.selectionIdent]
    },

    isCurrent() {
      return this.selectionIdent === this.selectionConfigCurrentIdent
    },

    isSelectionMin() {
      return this.selectionIdent.endsWith('min')
    },

    isSelectionMax() {
      return this.selectionIdent.endsWith('max')
    },

    isIdentTypeProposed() {
      return this.selectionIdent.endsWith('proposed')
    },

    isDisabledParameter() {
      return this.isForCT && this.scanStatus !== this.SCAN_STATUS.NO_SCAN
    },

    selectionConfigCurrentInvisible: {
      get() {
        return !_.get(this.selectionConfig, 'visible')
      },
      set(invisible) {
        let visible = !invisible
        // The checkbox component seems to have a bug where it sends itself to be toggled to null after it has already been destroyed
        // So an old group that has already been deleted will set itself to visible: null, causing it to get partially re-created during set
        if (_.isBoolean(visible)) {
          this.setSelectionConfigVisible(visible, this.selectionIdent)
        } else {
          console.warn('set selectionConfigCurrentVisible tried to set visible', visible, 'for', this.selectionIdent)
        }
      },
    },
    numberOfSlices: {
      get() {
        return _.get(this.selectionConfig, 'numberOfSlices')
      },
      set(numberOfSlices) {
        this.numberOfSlicesLocal = numberOfSlices
      },
    },
    thickness: {
      get() {
        const val = _.get(this.selectionConfig, 'thickness')
        return val
      },
      set(thickness) {
        this.thicknessLocal = thickness
      },
    },
    spacing: {
      get() {
        const val = _.get(this.selectionConfig, 'spacing')
        return val
      },
      set(spacing) {
        this.spacingLocal = spacing
      },
    },
    dimensions3x: {
      get() {
        return _.get(this.selectionConfig, 'dimensions3.x')
      },
      set(dimensions3x) {
        this.dimensions3xLocal = dimensions3x
      },
    },
    dimensions3y: {
      get() {
        return _.get(this.selectionConfig, 'dimensions3.y')
      },
      set(dimensions3y) {
        this.dimensions3yLocal = dimensions3y
      },
    },
    dimensions3zHalf: {
      // (Height half) for SingleSlice
      get() {
        let height = _.get(this.selectionConfig, 'dimensions3.z') || 0
        return height / 2
      },
      set(heightHalf) {
        this.$store.dispatch('selectionConfig/heightChanged', {
          currentVal: heightHalf * 2,
        })
      },
    },
    oversamplingPercentage: {
      // 0.0 - 100.0
      get() {
        return _.round(this.oversampling * 100, 1)
      },
      set(oversamplingPercentage) {
        this.oversampling = oversamplingPercentage / 100
      },
    },
    oversampling: {
      // 0.0 - 1.0, where 1.0 means each side of oversampling is as wide as 0.5*Phase(aka Dim3.x), so both sides added together would be as wide as Phase
      get() {
        return _.get(this.selectionConfig, 'oversampling')
      },
      set(oversampling) {
        this.oversamplingLocal = oversampling
      },
    },
    maxRotationOff: {
      get() {
        return _.get(this.selectionConfig, 'maxRotationOff')
      },
      set(maxRotationOff) {
        this.selectionConfig.maxRotationOff = maxRotationOff
      },
    },
    echoTime: {
      get() {
        return _.get(this.selectionConfig, 'echoTime')
      },
      set(echoTime) {
        this.selectionConfig.echoTime = echoTime
        this.echoTimeLocal = echoTime
      },
    },
    repetitionTime: {
      get() {
        return _.get(this.selectionConfig, 'repetitionTime')
      },
      set(repetitionTime) {
        this.selectionConfig.repetitionTime = repetitionTime
        this.repetitionTimeLocal = repetitionTime
      },
    },
    windowLevel: {
      get() {
        return _.get(this.selectionConfig, 'windowLevel')
      },
      set(windowLevel) {
        this.selectionConfig.windowLevel = windowLevel
        this.windowLevelLocal = windowLevel
      },
    },
    windowWidth: {
      get() {
        return _.get(this.selectionConfig, 'windowWidth')
      },
      set(windowWidth) {
        this.selectionConfig.windowWidth = windowWidth
        this.windowWidthLocal = windowWidth
      },
    },
    windowLevelWidth: {
      get() {
        const windowLevel = _.get(this.selectionConfig, 'windowLevel')
        const windowWidth = _.get(this.selectionConfig, 'windowWidth')
        const value = this.windowLevelWidths.find(
          (_windowLevelWidth) => _windowLevelWidth.value === convertWindowLevelWidth(windowLevel, windowWidth)
        )

        return value
      },
      set(windowLevelWidth) {
        if (windowLevelWidth?.value) {
          this.selectionConfig.windowWidth = windowLevelWidth.windowWidth
          this.selectionConfig.windowLevel = windowLevelWidth.windowLevel
          this.syncSelectionConfigToOtherIndent({
            selectionIdent: this.selectionIdent,
            keys: ['windowWidth', 'windowLevel'],
          })

          this.windowWidthLocal = windowLevelWidth.windowWidth
          this.windowLevelLocal = windowLevelWidth.windowLevel
          this.windowLevelWidthLocal = windowLevelWidth.value
        }
      },
    },
    kernel: {
      get() {
        return _.get(this.selectionConfig, 'kernel')
      },
      set(kernel) {
        this.selectionConfig.kernel = kernel
        this.syncSelectionConfigToOtherIndent({
          selectionIdent: this.selectionIdent,
          keys: ['kernel'],
        })

        this.kernelLocal = kernel
      },
    },
    tubePotential: {
      get() {
        return _.get(this.selectionConfig, 'tubePotential')
      },
      set(tubePotential) {
        this.selectionConfig.tubePotential = tubePotential
        this.tubePotentialLocal = tubePotential
      },
    },
    tubeCurrent: {
      get() {
        return _.get(this.selectionConfig, 'tubeCurrent')
      },
      set(tubeCurrent) {
        this.selectionConfig.tubeCurrent = tubeCurrent
        this.tubeCurrentLocal = tubeCurrent
      },
    },
    rotationTime: {
      get() {
        return _.get(this.selectionConfig, 'rotationTime')
      },
      set(rotationTime) {
        this.selectionConfig.rotationTime = rotationTime
        this.rotationTimeLocal = rotationTime
      },
    },
    inversionTime: {
      get() {
        return _.get(this.selectionConfig, 'inversionTime')
      },
      set(inversionTime) {
        this.selectionConfig.inversionTime = inversionTime
        this.inversionTimeLocal = inversionTime
      },
    },
    flipAngle: {
      get() {
        return _.get(this.selectionConfig, 'flipAngle')
      },
      set(flipAngle) {
        this.selectionConfig.flipAngle = flipAngle
        this.flipAngleLocal = flipAngle
      },
    },
    fatSuppression: {
      get() {
        return _.get(this.selectionConfig, 'fatSuppression')
      },
      set(fatSuppression) {
        this.selectionConfig.fatSuppression = fatSuppression
        this.fatSuppressionLocal = fatSuppression
      },
    },
    inversionRecovery: {
      get() {
        return _.get(this.selectionConfig, 'inversionRecovery')
      },
      set(inversionRecovery) {
        this.selectionConfig.inversionRecovery = inversionRecovery
        this.inversionRecoveryLocal = inversionRecovery
      },
    },
    heightChangeTarget: {
      get() {
        return this.$store.state.selectionConfig.heightChangeTarget
      },
      set(heightChangeTarget) {
        this.$store.commit('selectionConfig/set', { heightChangeTarget })
      },
    },
    answerSelectionsHasUnseenChoice() {
      return _.size(this.answersSelections) > 1 && !this.hasLookedAtAnswersSelectionsByQuestionId[this.stackQuestion.id]
    },
    scanLength() {
      return this.thickness * this.numberOfSlices
    },
    scanTimeCT() {
      const l = this.scanLength // thickness x # of slices (mm)
      const w = this.beamSelected.value // beam width (mm)
      const p = this.pitch // pitch
      const r = this.rotationTime // rotation time (secs)

      return (r * l) / (w * p)
    },
  },
  async mounted() {
    EventBus.$on('onSliceViewWindowChange', this.onSliceViewWindowChange)
  },
  beforeDestroy() {
    EventBus.$off('onSliceViewWindowChange', this.onSliceViewWindowChange)
  },
  methods: {
    ...mapActions('selectionConfig', [
      'setSelectionConfigCurrentIdent',
      'copyCurMinSelectionConfigIntoProposed',
      'smartRotateSelectionConfigDir',
      'syncSelectionConfigToOtherIndent',
    ]),
    ...mapActions('questionService', [
      'selectNextQuestion',
      'setAnswerSelectionId',
      'selectPrevQuestion',
      'proceedToTakingPostQuestions',
      'questionTabOpen',
    ]),
    onSliceViewWindowChange({ windowLevel, windowWidth }) {
      this.displayWindowWidth = windowWidth
      this.displayWindowLevel = windowLevel
    },
    setSelectionConfigVisible(visible, ident) {
      this.$store.dispatch('selectionConfig/setSelectionConfig', {
        ident, // pass in to specify which one to alter, otherwise current
        selectionConfig: { visible },
      })
    },

    submitNumberOfSlices() {
      let numberOfSlices = this.numberOfSlicesLocal
      log.debug('submitNumberOfSlices', numberOfSlices)
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustNumberOfSlices', { numberOfSlices })
    },
    submitThickness() {
      let thickness = this.thicknessLocal
      log.debug('submitThickness', thickness)
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustThickness', { thickness })
    },
    submitSpacing() {
      let spacing = this.spacingLocal
      log.debug('submitSpacing', spacing)
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustSpacing', { spacing })
    },
    submitDimensions3x() {
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustDimensions3XYByUser', { x: this.dimensions3xLocal })
    },
    submitDimensions3y() {
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustDimensions3XYByUser', { y: this.dimensions3yLocal })
    },
    submitOversampling() {
      this.setSelectionConfigCurrentIdent({ ident: this.selectionIdent })
      this.$store.dispatch('selectionConfig/adjustOversamplingByUser', { oversampling: this.oversamplingLocal })
    },
    submitActualSequenceType(sequenceType) {
      if (sequenceType !== 'SE') {
        this.inversionRecovery = false
      }

      this.selectionConfig.sequenceType = sequenceType
    },
    onLookedAtAnswerSelections() {
      // shallow copy so Vue notices the change for the computed
      this.hasLookedAtAnswersSelectionsByQuestionId = {
        ...this.hasLookedAtAnswersSelectionsByQuestionId,
        [this.stackQuestion.id]: true,
      }
    },
  },
}
</script>

<style lang="scss">
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
}
.freebie {
  color: red;
  font-size: 1.2rem;
  font-weight: bold;
  margin-right: 0.2rem;
}

.blink {
  animation: blinker 1.5s linear infinite;
  color: #c1521c !important;
  font-family: inherit;
}
@keyframes blinker {
  50% {
    opacity: 0;
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

// Added !important here because p tags have margins set for some reason
.resolution-label {
  margin-bottom: 0px !important;
  font-size: 12px;
  color: $gray-three;
}
.resolution-tooltip {
  margin-bottom: 0 !important;
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
.test-question-1 {
  width: 33%;
  &:first-child {
    width: 3%;
  }
  min-height: 170px;
  text-align: left;
  margin-right: 30px;
  &:last-child {
    margin-right: 0;
  }
}
.criteria_area {
  margin-top: -5px;
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
</style>
