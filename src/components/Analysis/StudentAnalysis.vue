<template>
  <StatisticsContainer>
    <template v-slot:title>
      <h5>{{ $t('global.analysis') }}</h5>
    </template>
    <img :src="publicRootPath + '/person.png?rnd=' + rndDate" alt="Personal analysis" />
  </StatisticsContainer>
</template>

<script>
import config from '../../config'
import StatisticsContainer from '../Statistics/StatisticsContainer.vue'

const { analysisPublicRoot } = config

export default {
  name: 'StudentAnalysis',
  components: { StatisticsContainer },
  props: {},
  data() {
    return {
      publicRootPath: analysisPublicRoot,
      rndDate: +new Date(),
    }
  },
}
</script>

<style scoped lang="scss">
img {
  width: 100%;
}
</style>
