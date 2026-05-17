<template>
  <div>
    <v-btn x-small text @click="exportHandler">{{ displayText }}</v-btn>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import moment from 'moment'
import { utils, writeFileXLSX, writeXLSX } from 'xlsx'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import _ from 'lodash'
import { apiGet } from '@/util/api'
import config from '@/config'
import { MR_PRACTICE_EXAM_ID, CT_PRACTICE_EXAM_ID } from '@/constants'

export default {
  name: 'ExportStudentDataLink',

  props: {
    student: {
      type: Object,
      required: false,
      default: null,
    },
    cohort: {
      type: Object,
      required: true,
    },
    format: {
      type: String,
      default: 'xlsx',
      required: false,
    },
    text: {
      type: String,
      required: false,
      default: 'Export Data',
    },
  },
  methods: {
    async exportHandler(event) {
      event.preventDefault()
      // If only the cohort param is passed and no student, export the entire cohort
      switch (this.format) {
        case 'csv':
          this.exportCohortCSV(this.cohort)
          break
        case 'xlsx':
          if (this.student) {
            this.exportStudentWorkbook(this.student, this.cohort)
          } else {
            this.exportCohortWorkbook(this.cohort)
          }
          break
        default:
          console.warn('Invalid format')
      }
    },
    async exportCohortCSV(cohort) {
      console.log('csv export requested for cohort id: ', cohort.id)
      let students = await apiGet('/cohortStudents', this.accessToken, { cohortId: cohort.id }).then(
        (response) => response.data.students
      )
      let csvData = await this.generateCSVCohortData(students, cohort)
      let csvContent = this.generateCSVContent(csvData)
      this.triggerCSVDownload(csvContent)
    },
    async generateCSVCohortData(students, cohort) {
      let data = []
      data.push([
        'Student Name',
        'Student Id',
        'Student Email',
        'Cohort Name',
        'Body Part',
        'Region',
        'Date',
        'Time',
        'Overall Score',
        'Clinical Score',
        'Critical Thinking Score',
        'Mode',
      ])
      for (let student of students) {
        let results = await apiGet(`statistics/export-data/user_${student.user.id}`, this.accessToken).then(
          (response) => response.data.data
        )
        for (let result of results) {
          const practiceExamId = config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
          if (result.preparedExamId == practiceExamId) continue
          data.push(this.parseCSVStudentData(student, result, cohort))
        }
      }
      return data
    },
    parseCSVStudentData(student, result, cohort) {
      let data = [
        student.user.legalName,
        student.user.id,
        student.user.email,
        cohort.name,
        result.bodyPart,
        result.region,
        moment(result.timestamp).format('l LT'),
        result.duration,
        result.score + '%',
        result?.sliceQuantScore + '%',
        _.round(result.criticalThinkingAvg, 2) + '%',
        result.isSandbox ? 'Sandbox' : 'Standard',
      ]
      return data
    },
    generateCSVContent(data) {
      let csvContent = 'data:text/csv;charset=utf-8,'
      data.forEach((row) => {
        const csvRow = row.join(',')
        csvContent += csvRow + '\r\n'
      })
      return csvContent
    },
    triggerCSVDownload(csvContent) {
      // Create a temporary anchor element to download the CSV file
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', 'data.csv')
      document.body.appendChild(link)

      // Trigger the download
      link.click()

      // Clean up
      document.body.removeChild(link)
    },
    async exportCohortWorkbook(cohort) {
      console.log('export requested for cohort id: ', cohort)
      let zip = new JSZip()
      let students = await apiGet('/cohortStudents', this.accessToken, { cohortId: cohort.id }).then(
        (response) => response.data.students
      )

      for (let student of students) {
        let workbook = await this.generateStudentWorkbook(student, cohort)
        let workbookBinary = writeXLSX(workbook, { type: 'binary', bookType: 'xlsx', bookSST: true })
        zip.file(`student_${student.user.legalName}.xlsx`, workbookBinary, { binary: true })
      }

      zip.generateAsync({ type: 'blob' }).then(function (blob) {
        saveAs(blob, 'ScanLab.zip')
      })
    },
    async exportStudentWorkbook(student, cohort) {
      console.log('export requested for student id: ', student.user.id)
      let workbook = await this.generateStudentWorkbook(student, cohort)
      console.log('writing to file')
      writeFileXLSX(workbook, `student_${student.user.legalName}.xlsx`, { compression: true })
    },
    async generateStudentWorkbook(student, cohort) {
      const workbook = utils.book_new()

      let results = await apiGet(`statistics/export-data/user_${student.user.id}`, this.accessToken).then(
        (response) => response.data.data
      )

      let criticalResults = await apiGet(
        `/statistics/mc/user_${student.user.id}/average_overall`,
        this.accessToken
      ).then((response) => response.data.data)

      this.addGeneralInfoSheet(workbook, student, cohort)
      this.addSummarySheet(workbook, results, criticalResults)
      this.addBodyPartsSheets(workbook, results)

      return workbook
    },
    addGeneralInfoSheet(workbook, student, cohort) {
      let rows = this.parseGeneralInfo(student, cohort)
      let worksheet = utils.aoa_to_sheet(rows)
      worksheet['!cols'] = [{ wch: 15 }, { wch: 20 }]
      utils.book_append_sheet(workbook, worksheet, 'General Info')
    },
    addSummarySheet(workbook, mri, critical) {
      let rowsMRI = this.parseMRIScores(mri)
      let rowsCritical = this.parseCriticalThinkingScores(critical)
      let worksheet = utils.json_to_sheet(rowsMRI)
      worksheet['!cols'] = [{ wch: 30 }, { wch: 17 }, { wch: 13 }, { wch: 10 }, { wch: 16 }, { wch: 5 }]
      utils.sheet_add_json(worksheet, rowsCritical, { origin: `A${rowsMRI.length + 3}` })
      utils.book_append_sheet(workbook, worksheet, 'Summary')
    },
    addBodyPartsSheets(workbook, results) {
      let bodyParts = results.reduce((acc, val) => {
        return !acc.includes(val.bodyPart) ? [...acc, val.bodyPart] : acc
      }, [])

      for (let part of bodyParts) {
        let partList = results.filter((result) => result.bodyPart === part)
        let rows = this.parseBodyPart(partList)
        let worksheet = utils.json_to_sheet(rows)
        worksheet['!cols'] = [{ wch: 18 }, { wch: 8 }, { wch: 13 }, { wch: 15 }, { wch: 23 }, { wch: 8 }]
        let modeCounts = this.parseModeCounts(partList)
        utils.sheet_add_aoa(worksheet, modeCounts, { origin: `A${rows.length + 3}` })
        let sanitizedPartName = this.sanitizeSheetName(part)
        utils.book_append_sheet(workbook, worksheet, sanitizedPartName)
      }
    },
    sanitizeSheetName(name) {
      // Replace invalid characters with underscores
      return name.replace(/[:/?*[\]]/g, '_')
    },
    parseBodyPart(scores) {
      let rows = scores.map((score) => {
        return {
          Date: moment(score.timestamp).format('l LT'),
          Time: score.duration,
          'Overall Score': score.score + '%',
          'Clinical Score': score?.sliceQuantScore + '%',
          'Critical Thinking Score': _.round(score.criticalThinkingAvg, 2) + '%',
          Mode: score.isSandbox ? 'Sandbox' : 'Standard',
        }
      })
      return rows
    },
    parseModeCounts(scores) {
      let counts = [
        ['Attempts', 0],
        ['Sandbox Attempts', 0],
      ]
      scores.forEach((score) => {
        if (score.isSandbox) {
          counts[1][1]++
        } else {
          counts[0][1]++
        }
      })
      return counts
    },
    parseGeneralInfo(student, cohort) {
      let info = [
        ['Student Name', student.user.legalName],
        ['Student Id', student.user.id],
        ['Cohort Name', cohort.name],
        ['Registration Date', student.formattedCreatedAt],
        ['Date of Export', moment().format('l LT')],
      ]
      return info
    },
    parseCriticalThinkingScores(overall) {
      let scores = []
      scores = overall.map((score) => {
        return { Category: score.category, Overall: score.score }
      })
      return scores
    },
    parseMRIScores(results) {
      let scores = []
      let grouped = _.groupBy(results, 'bodyPart')
      for (let [bodyPart, bodyPartResults] of Object.entries(grouped)) {
        let region = bodyPartResults[0].region
        let taken = this.countNonSandboxResults(bodyPartResults)
        let sandboxTest = this.countSandboxResults(bodyPartResults)
        let scoreSum = this.calculateScoreSum(bodyPartResults)
        let avg = this.calculateAverage(scoreSum, taken)
        let bestResult = this.findBestResult(bodyPartResults)
        let best = parseFloat(bestResult.score) ? bestResult.score : '0.00'
        scores.push({
          'Body Part': bodyPart,
          Region: region,
          'Average Score': avg,
          'Best Score': best,
          'Taken in Sandbox': sandboxTest,
          Taken: taken,
        })
      }
      return scores
    },
    countNonSandboxResults(results) {
      const practiceExamId = config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
      return results.filter((result) => !result.isSandbox && result.preparedExamId != practiceExamId).length
    },
    countSandboxResults(results) {
      return results.filter((result) => result.isSandbox).length
    },
    calculateScoreSum(results) {
      const practiceExamId = config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
      return _.sumBy(results, (result) => {
        if (parseFloat(result.score) && !result.isSandbox && result.preparedExamId != practiceExamId) {
          return parseFloat(result.score)
        }
        return 0
      })
    },
    calculateAverage(sum, count) {
      return count > 0 ? (sum / count).toFixed(2) : '0.00'
    },
    findBestResult(results) {
      const bestNonSandboxResult = _.maxBy(results, (result) => {
        const practiceExamId = config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
        if (!result.isSandbox && parseFloat(result.score) && result.preparedExamId != practiceExamId) {
          return parseFloat(result.score)
        }
        return -Infinity // Ensure sandbox results are never chosen
      })

      if (bestNonSandboxResult && !bestNonSandboxResult.isSandbox) {
        return bestNonSandboxResult
      }

      return { score: '0.00' }
    },
  },

  computed: {
    ...mapState('authentication', ['accessToken']),
    displayText() {
      return this.text == 'Export Data' ? this.$t('global.export_data') : this.text
    },
  },
}
</script>
