<template>
  <v-simple-table>
    <thead>
      <tr>
        <th class="text-left">{{ $t('global.body_part') }}</th>
        <th class="text-left">{{ $t('global.region') }}</th>
        <th class="text-left">{{ $t('global.average_score') }}</th>
        <th class="text-left">{{ $t('global.best_score') }}</th>
        <th class="text-left">{{ $t('global.tests_taken_sandbox') }}</th>
        <th class="text-left">{{ $t('global.tests_taken') }}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <!-- <RegistrationCodeTableRow v-for="code in registrationCodes" :value="code" :key="code.id" /> -->
      <tr v-for="result in resultsByBodyPart" :key="result.bodyPart">
        <td class="text-left">
          <strong>
            <TranslatedContent
              type="bodyPart"
              :record="{ id: result.bodyPartId, name: result.bodyPart }"
              :lookup="{ type: 'nestedKey', path: 'name' }"
            />
          </strong>
        </td>
        <td class="text-left">
          <strong
            ><TranslatedContent
              type="region"
              :record="{ id: result.regionId, name: result.region }"
              :lookup="{ type: 'nestedKey', path: 'name' }"
          /></strong>
        </td>
        <td class="text-left">{{ result.avg }}%</td>
        <td class="text-left">{{ result.best }}%</td>
        <td class="text-left">{{ result.sandboxTest }}</td>
        <td class="text-left">{{ result.taken }}</td>
        <td class="text-right">
          <!-- some body parts have a '/' in the name, this breaks the router, using a '$' and switch it back in later -->
          <router-link :to="`${routerPrepend}${result.bodyPart.replace('/', '$')}`">
            {{ $t('global.review_stats') }}
          </router-link>
        </td>
        <!-- <v-form v-if="editingNotes" @submit.prevent="updateNotes()" class="d-flex align-center">
            <v-text-field v-model="newNotes" autofocus :placeholder="$t('global.notes')" class="flex-grow-1 mr-3"/>
            <v-btn type="submit" color="success">{{ $t('global.save') }}</v-btn>
          </v-form>
          <button v-else @click.prevent="editNotes" class="notes">
            <template v-if="hasNotes">
              {{ value.notes }}
            </template>
            <em v-else>&mdash;</em>
            &nbsp;<v-icon small>mdi-pencil</v-icon>
               </button> -->
        <td></td>
      </tr>
    </tbody>
  </v-simple-table>
</template>

<script>
import _ from 'lodash'
import TranslatedContent from '@/components/TranslatedContent'
import config from '@/config'
import { MR_PRACTICE_EXAM_ID, CT_PRACTICE_EXAM_ID } from '@/constants'

export default {
  name: 'StudentMRIScoresTable',
  components: {
    TranslatedContent,
  },
  props: {
    mriResults: {
      type: Array,
      required: true,
    },
    // When linking to a specific body part for further review, what should we prepend to the router to?
    routerPrepend: {
      type: String,
      required: true,
    },
  },
  data() {
    return {}
  },
  computed: {
    resultsByBodyPart() {
      const practiceExamId = config.isCTLab ? CT_PRACTICE_EXAM_ID : MR_PRACTICE_EXAM_ID
      const grouped = _.groupBy(
        this.mriResults.filter((result) => result.preparedExamId != practiceExamId),
        'bodyPart'
      )

      return Object.entries(grouped).map(([bodyPart, bodyPartResults]) => {
        const { region, regionId, bodyPartId } = bodyPartResults[0]
        const taken = this.countNonSandboxResults(bodyPartResults)
        const sandboxTest = this.countSandboxResults(bodyPartResults)
        const scoreSum = this.calculateScoreSum(bodyPartResults)
        const avg = this.calculateAverage(scoreSum, taken)
        const bestResult = this.findBestResult(bodyPartResults)
        const best = parseFloat(bestResult.score) ? bestResult.score : '0.00'

        return { bodyPart, bodyPartId, region, regionId, avg, best, taken, sandboxTest }
      })
    },
  },
  methods: {
    countNonSandboxResults(results) {
      return results.filter((result) => !result.isSandbox).length
    },
    countSandboxResults(results) {
      return results.filter((result) => result.isSandbox).length
    },
    calculateScoreSum(results) {
      return _.sumBy(results, (result) => {
        if (parseFloat(result.score) && !result.isSandbox) {
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
        if (!result.isSandbox && parseFloat(result.score)) {
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
}
</script>

<style scoped lang="scss"></style>
