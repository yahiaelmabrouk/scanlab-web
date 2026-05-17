<template>
  <div class="region-card" :class="borderColor">
    <v-row>
      <v-col class="pl-0" sm="12">
        <div class="d-flex align-start card-img-wrapper">
          <img
            class="card-img p-1"
            :class="[imgBkgrdColor, isContrastLab ? 'contrast-lab' : '']"
            :src="imgFile"
            :alt="title"
          />
        </div>
        <div class="titles d-flex align-start">
          <h1 class="card-info-title">
            <TranslatedContent type="bodyPart" :record="bodyPart" :lookup="{ type: 'nestedKey', path: 'name' }" />
          </h1>
        </div>
        <div class="card-line" :class="getGradient(borderColor)"></div>
        <v-overflow-btn
          class="mx-4"
          :items="filterBodyPartTypes"
          item-text="name"
          item-value="id"
          :label="$t('RegionSelection.select_exam', languageCode)"
          v-model="bodyPartTypeValue"
        >
          <template #item="{ item }">
            <!-- <TranslatedContent type="bodyPart" :record="item" :lookup="{ type: 'nestedKey', path: 'name' }" /> -->
            {{ item.name }}
          </template>
        </v-overflow-btn>

        <v-btn
          class="white--text ma-2"
          block
          tile
          :disabled="!bodyPartId || isLoadingStartTest"
          :color="getRegionColor(bodyPart.region.name, 'buttonColor')"
          @click="startTestFromBodyPart(bodyPartId)"
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
import { REGION_IMAGES, REGION_COLORS, BODY_PART_TYPES, BODYPART_IMAGES } from '../constants'

export default {
  name: 'BodyPartCard',
  components: { TranslatedContent },
  props: {
    bodyPart: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      gradientColor: '',
      isContrastLab: isContrastLab(this.bodyPart.region.name),
      borderColor: this.getRegionColor(this.bodyPart.region.name, 'borderColor'),
      imgFile: this.getRegionImage(this.bodyPart.region.name, this.bodyPart.name),
      title: this.bodyPart.name,
      imgBkgrdColor: this.getRegionColor(this.bodyPart.region.name, 'imgBkgrdColor'),
      bodyPartTypes: BODY_PART_TYPES,
      bodyPartTypeValue: '',
    }
  },
  computed: {
    ...mapState('translatedContent', ['translatedContent']),
    ...mapGetters('user', ['languageCode']),
    ...mapState('testRunService', ['isLoadingStartTest']),
    bodyParts: function () {
      return [] //_.sortBy(this.region.bodyParts, 'name')
    },
    bodyPartId: {
      get() {
        return _.get(
          _.find(this.bodyPart.children, (el) => _.get(el, ['contrastTypes', this.bodyPartTypeValue], false)),
          ['id'],
          null
        )
      },
    },
    filterBodyPartTypes: {
      get() {
        return this.bodyPartTypes
          .filter(
            (bpt) =>
              !!_.get(
                _.find(this.bodyPart.children, (el) => _.get(el, ['contrastTypes', bpt.id], false)),
                ['id'],
                null
              )
          )
          .map((e) => ({ id: e.id, name: this.$t('ContrastTypes.' + e.id, this.languageCode) }))
      },
    },
  },
  methods: {
    ...mapActions('testRunService', ['startTest']),
    async startTestFromBodyPart(bodyPartId) {
      const test = await this.startTest({ bodyPartId })
      if (!test) return
      this.$router.push({ path: 'mri', query: { test: test.id } })
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
    getRegionImage(regionName, bodyPartName) {
      return BODYPART_IMAGES[bodyPartName] || REGION_IMAGES[regionName] || REGION_IMAGES['Default']
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
.card-img-wrapper {
  position: relative;
  &::after {
    content: '';
    width: 7rem;
    height: 7em;
    border: solid 2px #ffff00;
    border-radius: 50%;
    position: absolute;
    inset: 0.25rem;
    z-index: 2;
  }
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
</style>
