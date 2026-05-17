<template>
  <v-data-table
    :headers="tablePosition.header"
    :items="tablePosition.rows.filter((el) => !el.hidden)"
    :items-per-page="25"
    :single-expand="true"
    item-key="index"
    hide-default-footer
    hide-default-header
    disable-sort
    show-expand
    class="pa-0 elevation-0"
  >
    <template #header="{ props: { headers } }">
      <thead>
        <tr>
          <th v-for="header in headers" :key="header.value" :class="header.class" :style="{ width: header.width }">
            <span class="custom-header-text" v-if="header.text == 'Type'">
              {{ $t('global.type', languageCode) }}
            </span>
            <span class="custom-header-text" v-else-if="header.text == 'Result'">
              {{ $t('CombinedTestResults.result', languageCode) }}
            </span>
            <span class="custom-header-text" v-else>
              {{ header.text }}
            </span>
          </th>
        </tr>
      </thead>
    </template>
    <template #[`item.index`]="{ item }">
      <span class="bold">{{ item.index }}</span>
    </template>
    <template #[`item.gradingType`]="{ item }">
      <span class="bold">{{ $t(`TestResults.${item.gradingType}`, languageCode) }}</span>
    </template>
    <template #[`item.value`]="{ item }">
      <span
        v-if="patientPrepResults"
        :class="{ bold: true, correct: item.value > CUTOFF_SCORE, incorrect: item.value <= CUTOFF_SCORE }"
      >
        {{ item.value + '%' }}
      </span>
      <span v-else :class="{ bold: true, correct: item.value, incorrect: !item.value }">
        {{ item.text !== undefined ? item.text : parseResultToText(item.value) }}
      </span>
    </template>
    <template #expanded-item="{ headers, item }">
      <td :colspan="headers.length">
        <div v-if="item.gradingType == 'Position'" class="text-left pt-2">
          <v-row>
            <v-col cols="6">
              <div>
                <b>{{ $t('TestResults.selected_position', languageCode) }}:</b>
                {{ item.patientPosition || patientPositionAnswer }}
              </div>
            </v-col>
            <v-col v-if="listPatientPositions && listPatientPositions.length > 0" cols="6">
              <div class="pt-1">
                <span
                  ><b>{{ $t('TestResults.correct_positions', languageCode) }}:</b></span
                >
                <ol>
                  <li v-for="pos in listPatientPositions" :key="pos.id">
                    {{ `${pos.value.join(', ')}${pos.isShowHeadHolder ? `, ${getHeadholderText()}` : ''}` }}
                  </li>
                </ol>
              </div>
            </v-col>
            <v-col v-else cols="6">
              <div class="pt-1">
                <span> {{ $t('TestResults.correct_positions_not_set', languageCode) }} </span>
              </div>
            </v-col>
            <v-col cols="12" v-if="item.patientPositionScreenshot">
              <img :src="item.patientPositionScreenshot" />
            </v-col>
            <v-col cols="12" v-else-if="positionScreenshotAnswer">
              <img :src="positionScreenshotAnswer" />
            </v-col>
          </v-row>
        </div>
        <div v-else-if="item.gradingType == 'Landmark'" class="d-flex justify-content-center flex-column">
          <!-- <div>
            <img :src="positionScreenshotAnswer" v-if="positionScreenshotAnswer" />
          </div> -->
          <div
            v-if="patientPrepResults && typeof item.scoreAP === 'number'"
            :class="`text-start text-none mt-1 font-weight-bold ${
              item.scoreAP > CUTOFF_SCORE ? 'correct' : 'incorrect'
            }`"
          >
            {{ 'Landmark A/P: ' + item.distanceAP + 'cm' }}
            <span class="d-inline-block float-right">{{ item.scoreAP + '%' }}</span>
          </div>
          <div
            v-else-if="patientPrepResults"
            :class="`text-start text-none mt-1 font-weight-bold ${
              landmarkingAPScoreAnswer > CUTOFF_SCORE ? 'correct' : 'incorrect'
            }`"
          >
            {{ 'Landmark A/P: ' + landmarkingAPDistanceAnswer + 'cm' }}
            <span class="d-inline-block float-right">{{ landmarkingAPScoreAnswer + '%' }}</span>
          </div>
          <div
            v-if="patientPrepResults && typeof item.scoreSI == 'number'"
            :class="`text-start text-none mt-1 font-weight-bold ${
              item.scoreSI > CUTOFF_SCORE ? 'correct' : 'incorrect'
            }`"
          >
            {{ 'Landmark S/I: ' + item.distanceSI + 'cm' }}
            <span class="d-inline-block float-right">{{ item.scoreSI + '%' }}</span>
          </div>
          <div
            v-else-if="patientPrepResults"
            :class="`text-start text-none mt-1 font-weight-bold ${
              landmarkingSIScoreAnswer > CUTOFF_SCORE ? 'correct' : 'incorrect'
            }`"
          >
            {{ 'Landmark S/I: ' + landmarkingSIDistanceAnswer + 'cm' }}
            <span class="d-inline-block float-right">{{ landmarkingSIScoreAnswer + '%' }}</span>
          </div>
          <div style="width: 100%">
            <MRIMachineView
              v-if="isCTLab"
              :is-preview="true"
              :preview-position="item.mriMachinePosition || mriMachinePositionAnswer"
              :model-file-name="previewTestModelFileName"
            />
            <MRMRIMachineView
              v-else
              :is-preview="true"
              :preview-position="item.mriMachinePosition || mriMachinePositionAnswer"
              :model-file-name="previewTestModelFileName"
            />
          </div>
        </div>
        <div v-else-if="item.gradingType == 'Injection'" class="pt-2 pb-4">
          <v-row>
            <v-col v-if="patientPrepResults">
              <div class="text-left">
                <strong :class="`text-start text-none ${feedbackColor(!injectionContrastResult)}`">{{
                  injectionContrastResultText + ' ' + item.scoreContrast + '%'
                }}</strong>
              </div>
              <div class="text-left">
                <strong :class="`text-start text-none ${feedbackColor(!injectionSalineResult)}`">{{
                  injectionSalineResultText + ' ' + item.scoreSaline + '%'
                }}</strong>
              </div>
            </v-col>
            <v-col v-else>
              <div class="text-left">
                <strong :class="`text-start text-none ${feedbackColor(!injectionContrastResult)}`">{{
                  injectionContrastResultText
                }}</strong>
              </div>
              <div class="text-left">
                <strong :class="`text-start text-none ${feedbackColor(!injectionSalineResult)}`">{{
                  injectionSalineResultText
                }}</strong>
              </div>
            </v-col>
            <v-col>
              <div v-if="injectorDoseScreenshotAnswer" class="d-flex justify-content-center">
                <img :src="injectorDoseScreenshotAnswer" style="max-height: 400px" />
              </div>
            </v-col>
          </v-row>
        </div>
        <!-- <div v-else-if="item.gradingType == 'Delay time'" class="d-flex justify-content-center pb-4 pt-2">
          <img :src="injectorScreenshotAnswer" v-if="injectorScreenshotAnswer" />
        </div> -->
      </td>
    </template>
  </v-data-table>
</template>
<script>
import _ from 'lodash'
import i18n from '../i18n'
import PassedTest from '@/assets/svg/passed-test.svg'
import ClosePassedTest from '@/assets/svg/close-passed-test.svg'
import FailedTest from '@/assets/svg/failed-test.svg'
import MRIMachineView from './MRIMachineView.vue'
import MRMRIMachineView from './MRMRIMachineView.vue'
import config from '../config'
import { DEFAULT_PATIENT_GENDER, DEFAULT_PATIENT_MODEL_ID } from '../constants'
import { mapGetters, mapState } from 'vuex'
import { INJECTION_MODE } from '../constants'
import { getHeadholderText } from '../util/utils'

export default {
  name: 'CombinedTestResultsOverviewTable',
  components: {
    MRIMachineView,
    MRMRIMachineView,
  },
  props: {
    testResults: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      getHeadholderText,
      tablePosition: {
        header: [
          { text: `#`, value: 'index', width: '200px' },
          { text: `Type`, value: 'gradingType', width: '200px' },
          { text: `Result`, value: 'value', width: '200px' },
          { text: '', value: 'data-table-expand' },
        ],
        rows: [
          { index: 1, gradingType: 'Position', value: false },
          { index: 2, gradingType: 'Landmark', value: false },
          { index: 3, gradingType: 'Injection', value: false },
        ],
      },
      isCTLab: config.isCTLab,
      defaultPatientGender: DEFAULT_PATIENT_GENDER,
      defaultPatientModelId: DEFAULT_PATIENT_MODEL_ID,
      CUTOFF_SCORE: 70,
      INJECTION_MODE,
    }
  },
  computed: {
    ...mapState('questionService', ['listModels']),
    ...mapGetters('user', ['languageCode']),
    patientPrepResults() {
      return this.testResults.patientPrepScores
    },
    landmarkingSIScoreAnswer() {
      return _.round(this.patientPrepResults.landmarking?.si.score, 2)
    },
    landmarkingAPScoreAnswer() {
      return _.round(this.patientPrepResults.landmarking?.ap.score, 2)
    },
    landmarkingSIDistanceAnswer() {
      let output = 0
      if (this.patientPrepResults?.landmarking?.si?.analysis[0]?.isBad)
        output = _.round(this.patientPrepResults.landmarking?.si.analysis[0].value, 2)
      return output
    },
    landmarkingAPDistanceAnswer() {
      let output = 0
      if (this.patientPrepResults?.landmarking?.ap?.analysis[0]?.isBad)
        output = _.round(this.patientPrepResults.landmarking?.ap.analysis[0].value, 2)
      return output
    },
    items() {
      const { stackQuestionResults, criticalThinkingResults } = this.testResults || {}

      const questionCounts = {
        numberOfCorrectQuestions: 0,
        numberOfQuestions: 0,
      }

      const stackQuestionItems = stackQuestionResults.map((stackQuestionResult) => {
        const {
          sliceViews,
          groupScoreVariables,
          score,
          skipped,
          freebie,
          userAnswers,
          isContrastLab,
          stackQuestionId,
          attemptedAnswerIdentifier,
          answerViews,
          stackQuestionResultId,
        } = stackQuestionResult
        const result = Number(score)
        if (result > this.CUTOFF_SCORE) questionCounts.numberOfCorrectQuestions++
        const qText = _.get(stackQuestionResult, ['stackQuestion', 'questionText'], '')

        return {
          questionType: 'MRI',
          questionDescription: qText,
          questionText: qText,
          stackQuestion: stackQuestionResult.stackQuestion || { questionText: qText },
          result,
          sliceViews,
          groupScoreVariables,
          skipped,
          freebie,
          userAnswers,
          isContrastLab,
          id: stackQuestionId,
          attemptedAnswerIdentifier,
          answerViews,
          stackQuestionResultId,
        }
      })

      const criticalThinkingItems = criticalThinkingResults.map(
        ({
          multipleChoiceQuestionId,
          text,
          score,
          answerExplanation,
          media,
          selectedAnswer,
          selectedAnswerShown,
          type,
          range,
          choices,
          screeningForm,
          category,
        }) => {
          const result = Number(score)
          if (result > this.CUTOFF_SCORE) questionCounts.numberOfCorrectQuestions++

          return {
            multipleChoiceQuestionId,
            questionType: 'Critical Thinking',
            questionDescription: text,
            questionText: text,
            result,
            type,
            choices,
            range,
            media,
            answerExplanation,
            selectedAnswer,
            selectedAnswerShown,
            id: multipleChoiceQuestionId,
            screeningForm,
            category,
          }
        }
      )

      // To show Exam results in the same order they were taken in the test.
      const screeningQuestion = criticalThinkingItems.shift()
      const stackAndCriticalThinkingQuestions = stackQuestionItems.concat(criticalThinkingItems)
      if (screeningQuestion) {
        stackAndCriticalThinkingQuestions.unshift(screeningQuestion)
      }
      stackAndCriticalThinkingQuestions.map((q, idx) => (q.questionNumber = idx + 1))
      questionCounts.numberOfQuestions = stackAndCriticalThinkingQuestions.length
      this.generateTestOverview(questionCounts)
      return stackAndCriticalThinkingQuestions
    },
    patientPositionResult() {
      return !_.get(
        _.find(
          _.get(
            this.items.filter((el) => el.groupScoreVariables),
            [0, 'groupScoreVariables', 0, 'analysis']
          ),
          (el) => _.get(el, 'factorName', '') == 'isScanPositionRight'
        ),
        'isBad',
        true
      )
    },
    landmarkResult() {
      return !_.get(
        _.find(
          _.get(
            this.items.filter((el) => el.groupScoreVariables),
            [0, 'groupScoreVariables', 0, 'analysis']
          ),
          (el) => _.get(el, 'factorName', '') == 'landmarkDistanceRatio'
        ),
        'isBad',
        true
      )
    },
    landmarkResultScoreLoss() {
      return _.get(
        _.find(
          _.get(
            this.items.filter((el) => el.groupScoreVariables),
            [0, 'groupScoreVariables', 0, 'analysis']
          ),
          (el) => _.get(el, 'factorName', '') == 'landmarkDistanceRatio'
        ),
        'scoreLoss',
        0
      )
    },
    injectionContrastResult() {
      return !_.get(
        _.find(
          _.get(
            this.items.filter((el) => el.groupScoreVariables),
            [0, 'groupScoreVariables', 0, 'analysis']
          ),
          (el) => _.get(el, 'factorName', '') == 'injectionContrastValue'
        ),
        'isBad',
        true
      )
    },
    injectionContrastResultText() {
      return i18n.t(
        _.get(
          _.find(
            _.get(
              this.items.filter((el) => el.groupScoreVariables),
              [0, 'groupScoreVariables', 0, 'analysis']
            ),
            (el) => _.get(el, 'factorName', '') == 'injectionContrastValue'
          ),
          'key',
          ''
        ),
        {
          scanlab: this.isCTLab ? 'ScanLabCT' : 'ScanLab™',
          scanlabValue: _.get(
            _.find(
              _.get(
                this.items.filter((el) => el.groupScoreVariables),
                [0, 'groupScoreVariables', 0, 'analysis']
              ),
              (el) => _.get(el, 'factorName', '') == 'injectionContrastValue'
            ),
            'value',
            0
          ),
        }
      )
    },
    injectionSalineResult() {
      return !_.get(
        _.find(
          _.get(
            this.items.filter((el) => el.groupScoreVariables),
            [0, 'groupScoreVariables', 0, 'analysis']
          ),
          (el) => _.get(el, 'factorName', '') == 'injectionSalineValue'
        ),
        'isBad',
        true
      )
    },
    injectionSalineResultText() {
      return i18n.t(
        _.get(
          _.find(
            _.get(
              this.items.filter((el) => el.groupScoreVariables),
              [0, 'groupScoreVariables', 0, 'analysis']
            ),
            (el) => _.get(el, 'factorName', '') == 'injectionSalineValue'
          ),
          'key',
          ''
        ),
        {
          scanlab: this.isCTLab ? 'ScanLabCT' : 'ScanLab™',
          scanlabValue: _.get(
            _.find(
              _.get(
                this.items.filter((el) => el.groupScoreVariables),
                [0, 'groupScoreVariables', 0, 'analysis']
              ),
              (el) => _.get(el, 'factorName', '') == 'injectionSalineValue'
            ),
            'value',
            0
          ),
        }
      )
    },
    injectionSettingResult() {
      return _.some(
        _.get(
          this.items.filter((el) => el.groupScoreVariables),
          [0, 'groupScoreVariables'],
          []
        ),
        (el) => {
          return !_.get(
            _.find(_.get(el, 'analysis'), (el) => _.get(el, 'factorName', '') == 'delayTime'),
            'isBad',
            true
          )
        }
      )
    },
    patientPositionAnswer() {
      let value = []
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.patientPositions)
          if (answer) {
            value = answer.patientPositions
          }
        }
      )

      return `${value.join(', ')}${
        this.mriMachinePositionAnswer.isMRIShowHeadHolder ? `, ${this.getHeadholderText()}` : ''
      }`
    },
    positionScreenshotAnswer() {
      let value = ''
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables),
        (el) => {
          const answer = _.get(el, ['answerViews'], []).find((o) => o.id == 'positionScreenshot')
          if (answer) {
            value = answer.src
          }
        }
      )

      return value
    },
    injectorScreenshotAnswer() {
      let value = ''
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables),
        (el) => {
          const answer = _.get(el, ['answerViews'], []).find((o) => o.id == 'injectorScreenshot')
          if (answer) {
            value = answer.src
          }
        }
      )

      return value
    },
    injectorDoseScreenshotAnswer() {
      let value = ''
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables),
        (el) => {
          const answer = _.get(el, ['answerViews'], []).find((o) => o.id == 'injectorDoseScreenshot')
          if (answer) {
            value = answer.src
          }
        }
      )

      return value
    },
    mriMachinePositionAnswer() {
      let mriMachinePosition = {
        mriUpDownPositionY: 0,
        mriInOutPositionZ: 0,
      }
      let isMRIShowHeadHolder = false
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.mriMachinePosition)
          if (answer) {
            mriMachinePosition = answer.mriMachinePosition
          }
          const answerHasIsMRIShowHeadHolder = _.get(el, ['userAnswers'], []).find((o) =>
            _.has(o, ['isMRIShowHeadHolder'])
          )
          if (answerHasIsMRIShowHeadHolder) {
            isMRIShowHeadHolder = answer.isMRIShowHeadHolder
          }
        }
      )

      let patientPositions = []
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.patientPositions)
          if (answer) {
            patientPositions = answer.patientPositions
          }
        }
      )

      return {
        mriMachinePosition: mriMachinePosition,
        patientPositions: patientPositions,
        isMRIShowHeadHolder: isMRIShowHeadHolder,
      }
    },
    previewTestModelFileName() {
      let modelId = this.defaultPatientModelId
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.testPatientModelId)
          if (answer) {
            modelId = answer.testPatientModelId
          }
        }
      )

      //return gender == 'male' ? 'Man.glb' : 'Woman.glb'
      return _.get(
        _.find(this.listModels, (e) => e.id == modelId),
        ['fileName'],
        ''
      )
    },
    listPatientPositions() {
      let values = []
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => o.listPatientPositionsAndBodyBox)
          if (answer) {
            values = answer.listPatientPositionsAndBodyBox
          }
        }
      )

      return values
    },
    injectionModeResult() {
      let mode = this.INJECTION_MODE.CONTRAST_AND_SALINE
      _.forEach(
        this.items.filter((el) => el.groupScoreVariables && el.userAnswers),
        (el) => {
          const answer = _.get(el, ['userAnswers'], []).find((o) => _.has(o, ['testInjectionMode']))
          if (answer) {
            mode = answer.testInjectionMode
          }
        }
      )

      return mode
    },
  },
  async mounted() {
    let patientPrepRows
    if (this.patientPrepResults && this.patientPrepResults.scores) {
      patientPrepRows = []
      let indexCount = 1
      _.forEach(this.patientPrepResults.scores, (el) => {
        patientPrepRows.push(
          {
            index: indexCount++,
            gradingType: 'Position',
            value: el.positioning.score,
            patientPosition: this.patientPosition(el),
            patientPositionScreenshot: this.patientPositionScreenshot(el),
          },
          {
            index: indexCount++,
            gradingType: 'Landmark',
            value: _.round(el.landmarking.combinedScore, 2),
            scoreAP: _.round(el?.landmarking?.ap?.score || 0, 2),
            scoreSI: _.round(el.landmarking.si.score, 2),
            distanceAP: this.landmarkingAPDistance(el),
            distanceSI: this.landmarkingSIDistance(el),
            mriMachinePosition: this.mriMachinePosition(el),
          },
          {
            index: indexCount++,
            gradingType: 'Injection',
            value: _.round(el.injectors.combinedScore, 2),
            scoreContrast: _.round(el.injectors.contrast.score, 2),
            scoreSaline: _.round(el.injectors.saline.score, 2),
            hidden: !el.injectors.combinedScore,
          }
        )
      })
    }

    this.tablePosition = {
      ...this.tablePosition,
      rows: patientPrepRows || [
        {
          index: 1,
          gradingType: 'Position',
          value: this.patientPrepResults ? this.patientPrepResults.positioning.score : this.patientPositionResult,
        },
        {
          index: 2,
          gradingType: 'Landmark',
          value: this.patientPrepResults
            ? _.round(this.patientPrepResults.landmarking.combinedScore, 2)
            : this.landmarkResult,
        },
        {
          index: 3,
          gradingType: 'Injection',
          value: this.patientPrepResults
            ? _.round(this.patientPrepResults.injectors.combinedScore, 2)
            : this.injectionModeResult == this.INJECTION_MODE.CONTRAST_AND_SALINE
            ? this.injectionContrastResult && this.injectionSalineResult
            : this.injectionContrastResult,
          // Hidden when no post contrast
          hidden: !this.injectorDoseScreenshotAnswer,
        },
        // { index: 4, gradingType: 'Delay time', value: this.injectionSettingResult },
      ],
    }
  },
  methods: {
    landmarkingSIDistance(item) {
      let output = 0
      if (item.landmarking.si.analysis[0].isBad) {
        let direction = item.landmarking.si.analysis[0].key.includes('small') ? '-' : ''
        output = direction + _.round(item.landmarking.si.analysis[0].value, 2)
      }
      return output
    },
    landmarkingAPDistance(item) {
      let output = 0
      if (item?.landmarking?.ap?.analysis[0]?.isBad) {
        let direction = item?.landmarking?.ap?.analysis[0]?.key.includes('small') ? '-' : ''
        output = direction + _.round(item?.landmarking?.ap?.analysis[0]?.value, 2)
      }
      return output
    },
    patientPositionScreenshot(item) {
      const imgSrc = item.answerViews[0].src
      return imgSrc
    },
    mriMachinePosition(item) {
      let mriMachinePosition = {
        mriUpDownPositionY: 0,
        mriInOutPositionZ: 0,
      }
      let isMRIShowHeadHolder = false
      let patientPositions = []
      if (item.answer.variables && item.answer.variables[0].mriMachinePosition) {
        const positionData = item.answer.variables[0].submittedPatientPosition
        patientPositions.push(positionData.side1)
        patientPositions.push(positionData.side2)
        patientPositions.push(positionData.side3)
        mriMachinePosition = item.answer.variables[0].mriMachinePosition
        isMRIShowHeadHolder = positionData.isShowHeadHolder
      }

      return {
        mriMachinePosition: mriMachinePosition,
        patientPositions: patientPositions,
        isMRIShowHeadHolder: isMRIShowHeadHolder,
      }
    },
    patientPosition(item) {
      let value = []
      let positionData = item.answer.variables[0].firstSelectedPatientPosition
      value.push(positionData.side1)
      value.push(positionData.side2)
      value.push(positionData.side3)
      return `${value.join(', ')}${positionData.headHolder ? `, ${this.getHeadholderText()}` : ''}`
    },
    parseResultToText(val) {
      if (val) {
        return this.$t('global.correct', this.languageCode)
      } else {
        return this.$t('global.incorrect', this.languageCode)
      }
    },
    feedbackColor(isBad) {
      if (isBad) {
        return 'score_ok'
      } else {
        return 'score_very_good'
      }
    },
    generateTestOverview({ numberOfCorrectQuestions, numberOfQuestions }) {
      const overallPercentage = parseFloat(this.testResults.overall)
      let testResultImage = FailedTest

      if (overallPercentage > 60 && overallPercentage < 80) {
        testResultImage = ClosePassedTest
        this.borderColor = 'danger-border'
      }

      if (overallPercentage >= 80) {
        testResultImage = PassedTest
        this.borderColor = 'pass-border'
      }

      this.testOverview = {
        image: testResultImage,
        numberOfCorrectQuestions,
        numberOfQuestions,
        overallPercentage,
        overallPercentageDisplay: overallPercentage.toFixed(2),
      }
    },
  },
}
</script>
<style scoped lang="scss">
.score_very_good {
  color: green;
}

.score_ok {
  color: orange;
}

.score_bad {
  color: red;
}
.bold {
  font-weight: bold;
}

.correct {
  color: #008000 !important;
}

.incorrect {
  color: $red !important;
}

.explanation {
  width: 80%;
  padding: 0 2rem;
}

.report-button {
  width: 20%;
  text-align: center;
  float: right;
}

.wide-button {
  font-size: 18px !important;
  min-width: 250px !important;
  padding: 35px 25px !important;
}

.no-transform {
  text-transform: none;
  letter-spacing: 0;
}

.title-card {
  border-radius: 0 1rem;
  padding: 1.25rem;
  width: 100%;
  background-color: $white;
  box-shadow: 0 0 0.5rem $gray-two;
  margin-top: 1rem;
}

.theme--light.v-data-table {
  background-color: $white;
}
</style>
