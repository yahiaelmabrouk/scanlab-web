<template>
  <div class="region-card" :class="borderColor">
    <v-row>
      <v-col class="pl-0" sm="12">
        <div class="d-flex align-start">
          <img
            class="card-img"
            :class="[imgBkgrdColor, isContrastLab ? 'contrast-lab' : '']"
            :src="imgFile"
            :alt="title"
          />
        </div>
        <div class="titles d-flex align-start">
          <h1 class="card-info-title">
            <TranslatedContent type="region" :record="region" :lookup="{ type: 'nestedKey', path: 'name' }" />
          </h1>
        </div>
        <div class="card-line" :class="getGradient(borderColor)"></div>
        <v-overflow-btn
          class="mx-4"
          :items="bodyParts"
          item-text="name"
          item-value="id"
          :label="$t('RegionSelection.select_body_part', languageCode)"
          v-model="dropDownValue"
        >
          <template #item="{ item }">
            <TranslatedContent type="bodyPart" :record="item" :lookup="{ type: 'nestedKey', path: 'name' }" />
          </template>
        </v-overflow-btn>

        <v-btn
          class="white--text ma-2"
          block
          tile
          :disabled="!dropDownValue || isLoadingStartTest"
          :color="getRegionColor(region.name, 'buttonColor')"
          @click="startTestFromBodyPart(dropDownValue)"
          >{{ $t('RegionSelection.begin', languageCode) }}</v-btn
        >
      </v-col>
      <div class="card-line-border" :class="getGradient(borderColor)"></div>
    </v-row>
  </div>
</template>
<script>
import _ from 'lodash'
import { mapActions, mapGetters, mapState } from 'vuex'
import { isContrastLab } from '../lib/misc-util'
import TranslatedContent from '@/components/TranslatedContent'
import { REGION_IMAGES, REGION_COLORS } from '../constants'

export default {
  name: 'RegionCard',
  components: { TranslatedContent },
  props: {
    region: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      gradientColor: '',
      isContrastLab: isContrastLab(this.region.name),
      dropDownValue: '',
      borderColor: this.getRegionColor(this.region.name, 'borderColor'),
      imgFile: this.getRegionImage(this.region.name),
      title: this.region.name,
      imgBkgrdColor: this.getRegionColor(this.region.name, 'imgBkgrdColor'),
    }
  },
  computed: {
    ...mapState('translatedContent', ['translatedContent']),
    ...mapGetters('user', ['languageCode']),
    ...mapState('testRunService', ['isLoadingStartTest']),
    bodyParts: function () {
      return _.sortBy(this.region.bodyParts, 'name')
    },
  },
  methods: {
    ...mapActions('testRunService', ['startTest']),
    async startTestFromBodyPart(bodyPartId) {
      const test = await this.startTest({ bodyPartId })
      if (!test) return
      this.$router.push({ path: 'mri', query: { test: test.id } })
      console.log('==================================================')
      console.log('========= AFTER ROUTER CHANGE to `/mri` ==========')
      let currentTime = new Date()
      console.log('Current Time = ' + currentTime.getTime())
      localStorage.setItem('route_change_time', currentTime.getTime())
    },
    loadTest(questionSet) {
      this.dropDownValue = questionSet
    },
    getGradient(borderColor) {
      switch (borderColor) {
        case 'blue-border':
          return (this.gradientColor = 'gradient-blue')
        case 'green-border':
          return (this.gradientColor = 'gradient-green')
        case 'pink-border':
          return (this.gradientColor = 'gradient-pink')
        case 'yellow-border':
          return (this.gradientColor = 'gradient-yellow')
        case 'dark-blue-border':
          return (this.gradientColor = 'gradient-blue-pink')
      }
    },
    getRegionImage(regionName) {
      return REGION_IMAGES[regionName] || REGION_IMAGES['Default']
    },
    getRegionColor(regionName, colorType) {
      return REGION_COLORS[regionName] ? REGION_COLORS[regionName][colorType] : REGION_COLORS['Default'][colorType]
    },
  },
}
</script>
<style scoped lang="scss">
.region-card {
  position: relative;
  border-radius: 0 1rem;
  padding: 2rem 3rem;
  background-color: $white;
  box-shadow: 0 0 0.5rem $gray-two;
  margin: 1rem;
  text-align: left;
  min-width: 30%;
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
}

.titles {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

@media only screen and (max-width: 1024px) {
  .region-card-size {
    width: 45%;
  }
}
::v-deep .theme--light.v-select .v-select__selections {
  color: black !important;
}
</style>
