<template>
  <v-simple-table>
    <thead>
      <tr>
        <th class="text-left">{{ $t('global.category') }}</th>
        <th class="text-left">{{ $t('global.overall') }}</th>
        <th class="text-left">{{ $t('global.level_1') }}</th>
        <th class="text-left">{{ $t('global.level_2') }}</th>
        <th class="text-left">{{ $t('global.level_3') }}</th>
        <th class="text-left">{{ $t('global.level_4') }}</th>
        <th class="text-left">{{ $t('global.level_5') }}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(result, index) in rows" :key="`${index}-${result.name}`">
        <td class="text-left">
          <strong>{{
            $te(`CriticalThinkingCategory.${result.name}`) ? $t(`CriticalThinkingCategory.${result.name}`) : result.name
          }}</strong>
        </td>
        <td class="text-left">{{ result.overall }}</td>
        <td class="text-left">{{ result.level1 }}</td>
        <td class="text-left">{{ result.level2 }}</td>
        <td class="text-left">{{ result.level3 }}</td>
        <td class="text-left">{{ result.level4 }}</td>
        <td class="text-left">{{ result.level5 }}</td>
        <td></td>
      </tr>
    </tbody>
  </v-simple-table>
</template>

<script>
import _ from 'lodash'

function formatScore(score) {
  if (score) {
    return `${score}%`
  } else {
    return '—'
  }
}

export default {
  name: 'StudentCriticalThinkingScoresTable',
  props: {
    overall: {
      type: Array,
      required: true,
    },
    perDifficulty: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {}
  },
  computed: {
    rows() {
      return this.overall.map((item) => {
        let averages = _.chain(this.perDifficulty)
          .filter(['category', item.category])
          .groupBy('difficulty')
          .mapValues((averageArray) => averageArray[0])
          .value()

        return {
          name: item.category,
          overall: formatScore(item.score),
          level1: formatScore(_.get(averages, '1.score')),
          level2: formatScore(_.get(averages, '2.score')),
          level3: formatScore(_.get(averages, '3.score')),
          level4: formatScore(_.get(averages, '4.score')),
          level5: formatScore(_.get(averages, '5.score')),
        }
      })
    },
  },
  methods: {},
}
</script>

<style scoped lang="scss"></style>
