<template>
  <div class="mx-10 my-10">
    <h2>{{ $t('global.weight_based_dose_chart', languageCode) }}</h2>
    <v-row class="mt-5">
      <v-col lg="3" md="4" sm="12" v-for="(chunk, index) in seperateData" :key="index">
        <table class="table table-striped table-bordered">
          <thead>
            <tr>
              <th>{{ $t('global.wt', languageCode) + ' (kg)' }}</th>
              <th>{{ $t('global.wt', languageCode) + ' (lbs)' }}</th>
              <th>{{ $t('global.contrast_dose', languageCode) + ' (ml)' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in chunk" :key="idx">
              <td>{{ item.weightMetric }}</td>
              <td>{{ +(item.weightMetric * 2.2046).toFixed(2) }}</td>
              <td>{{ item.contrastDose }}</td>
            </tr>
          </tbody>
        </table>
      </v-col>
    </v-row>
    <div class="loading-overlay" v-if="isLoading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { apiGet } from '../util/api'
export default {
  name: 'WeightBasedDose',
  data() {
    return {
      data: [],
      isLoading: true,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapGetters('user', ['languageCode']),
    seperateData() {
      const chunkCount = 4
      const result = [[], [], [], []]
      if (!this.data.length) return result
      const chunkSize = Math.ceil(this.data.length / chunkCount)
      for (let i = 0; i < chunkCount; i++) {
        result[i] = this.data.slice(i * chunkSize, (i + 1) * chunkSize)
      }
      return result
    },
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      apiGet('weightBasedDose/all', this.accessToken)
        .then((response) => {
          this.data = response.data.data
          this.isLoading = false
        })
        .catch((error) => {
          this.isLoading = false
          console.error('Error fetching weight-based dose data:', error)
        })
    },
  },
}
</script>
<style lang="scss" scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba($color: #ffffff, $alpha: 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
