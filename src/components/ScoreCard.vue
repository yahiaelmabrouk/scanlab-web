<template>
  <article class="score-card" :class="borderColor">
    <v-row>
      <v-col class="pl-0 pr-0" sm="12">
        <header class="titles d-flex align-center justify-content-center">
          <h1 class="card-info-title">
            {{ title }}
          </h1>
        </header>
        <div class="card-line" :class="getGradient(borderColor)"></div>
        <figure class="d-flex align-center justify-content-center">
          <img
            class="card-img"
            :class="[imgBkgrdColor, isContrastLab ? 'contrast-lab' : '']"
            :src="imgFile"
            :alt="title"
          />
        </figure>
        <footer class="d-flex flex-column align-center justify-content-center">
          <span class="region-status" v-text="currentRegionStatus"></span>
          <span
            >{{ numberOfTestsTaken }} / {{ numberOfTotalTests }} {{ $t('Scores.tests_completed', languageCode) }}</span
          >
        </footer>
        <slot name="card-bottom"></slot>
      </v-col>
      <div class="card-line-border" :class="getGradient(borderColor)"></div>
    </v-row>
  </article>
</template>

<style scoped lang="scss">
.score-card {
  position: relative;
  border-radius: 0 1rem;
  padding: 2rem 3rem;
  background-color: $white;
  box-shadow: 0 0 0.5rem $gray-two;
  margin: 1rem;
  text-align: left;
  width: 30%;
}

.contrast-lab {
  filter: invert(100%);
}

.card-copy {
  text-align: left;
}

.card-line {
  padding: 1px;
  margin: 1rem 0 1.5rem 0;
}

.card-line-border {
  padding: 1px;
  margin: 1rem 0 2rem 0;
  position: absolute;
  bottom: -2px;
  left: 2%;
  width: 98%;
  margin: 0;
}

.card-img {
  height: 7.5rem;
  width: auto;
  border-radius: 50%;
  margin-bottom: 2rem;
}

.card-info-title {
  flex: 1;
  font-size: 1.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.titles {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.region-status {
  font-weight: bold;
}

@media only screen and (max-width: 1024px) {
  .score-card-size {
    width: 45%;
  }
}
</style>

<script>
import { isContrastLab } from '../lib/misc-util'
import { mapGetters } from 'vuex'

const regionStatuses = ['Not Started', 'In Progress', 'Completed']

export default {
  name: 'ScoreCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    imgFile: {
      type: String,
      required: true,
    },
    borderColor: {
      type: String,
      required: true,
    },
    imgBkgrdColor: {
      type: String,
      required: true,
    },
    numberOfTestsTaken: {
      type: Number,
      required: false,
      default: 0,
    },
    numberOfTotalTests: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  data() {
    return {
      isContrastLab: isContrastLab(this.$props.title),
    }
  },
  computed: {
    currentRegionStatus() {
      const [NOT_STARTED, IN_PROGRESS, COMPLETED] = regionStatuses

      if (!this.numberOfTestsTaken) return NOT_STARTED
      if (this.numberOfTestsTaken < this.numberOfTotalTests) return IN_PROGRESS
      return COMPLETED
    },
    ...mapGetters('user', ['languageCode']),
  },
  methods: {
    getGradient(borderColor) {
      const gradientOverrides = {
        'dark-blue-border': 'gradient-blue-pink',
      }

      let gradientColor = gradientOverrides[borderColor]

      if (!gradientColor) {
        let [color] = borderColor.split('-')
        gradientColor = `gradient-${color}`
      }

      return gradientColor
    },
  },
}
</script>
