<template>
  <div class="ma-4">
    <h5 class="text-left">{{ $t('global.analysis') }}</h5>
    <v-simple-table class="d-block w-75">
      <thead>
        <tr>
          <th class="text-left">Exam Category</th>
          <th>Statistical Percentile</th>
          <th>ScanLab Score</th>
          <th>ScanLab Score Percentile</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in analysisData" :key="item.name">
          <td class="text-left">{{ item.ExamCategory }}</td>
          <td class="text-left">{{ item.StatisticalPercentile }}</td>
          <td class="text-left">{{ item.ScanlabScore }}</td>
          <td class="text-left">{{ item.ScanlabScorePercentile }}</td>
        </tr>
      </tbody>
    </v-simple-table>
  </div>
</template>

<script>
export default {
  name: 'StatisticsTableContainer',
  props: {
    analysisData: {
      type: Array,
      required: true,
    },
  },
}
</script>

<style scoped lang="scss">
tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
