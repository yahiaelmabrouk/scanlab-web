<template>
  <div>
    <div v-if="cohortLoading || studentLoading || allBodyPartsLoading">
      <v-progress-linear striped indeterminate color="buttonBlue" height="20" />
    </div>
    <v-container v-else>
      <v-row>
        <v-col>
          <router-link :to="`/cohorts/${cohort.id}/students/${student.id}`" class="navigation-link">
            &laquo; {{ $t('global.go_back_to', languageCode) }} {{ student.user.legalName }}
          </router-link>

          <TitleAndAside v-if="isCTLab" :title="`${$t('global.ct_scores', languageCode)} | ${bodyPartName}`">
            <template #aside>
              <TranslatedContent
                type="region"
                :record="bodyPart.region"
                :lookup="{ type: 'nestedKey', path: 'name' }"
              />
            </template>
          </TitleAndAside>
          <TitleAndAside v-else :title="`${$t('global.mri_scores', languageCode)} | ${bodyPartName}`">
            <template #aside>
              <TranslatedContent
                type="region"
                :record="bodyPart.region"
                :lookup="{ type: 'nestedKey', path: 'name' }"
              />
            </template>
          </TitleAndAside>

          <PageSection>
            <MRIScoreLine
              title=""
              :whom="`user_${this.student.user.id}`"
              :filter="bodyPartFilter"
              :exact="true"
              group="bodyPart"
              group-label="bodyPart"
              :visible-by-default="true"
            ></MRIScoreLine>
            <SkillScoresLine :whom="`user_${student.user.id}`" :show-all-data-on-none-selected="false"></SkillScoresLine>
          </PageSection>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import config from '@/config'
import { mapState, mapGetters, mapActions } from 'vuex'
import { apiGet } from '@/util/api'
import TitleAndAside from '@/components/Headers/TitleAndAside'
import PageSection from '@/components/PageSection'
import MRIScoreLine from '@/components/Statistics/MRIScoreLine'
import SkillScoresLine from '@/components/Statistics/SkillScoresLine'
import TranslatedContent from '@/components/TranslatedContent'

export default {
  name: 'CohortsStudentMRI',
  components: {
    TitleAndAside,
    PageSection,
    MRIScoreLine,
    SkillScoresLine,
    TranslatedContent,
  },
  data() {
    return {
      student: null,
      studentLoading: true,
      // ⬇start as an empty array so .find() is always safe
      allBodyParts: [],
      allBodyPartsLoading: true,
      isCTLab: config.isCTLab,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('cohortService', ['cohort', 'cohortLoading']),
    ...mapGetters('user', ['languageCode']),
    ...mapState('translatedContent', ['translatedContent']),

    // normalized route param: decode + $ -> /
    bodyPartSlug() {
      const raw = this.$route.params.bodyPart || ''
      return decodeURIComponent(raw).replace(/\$/g, '/').toLowerCase()
    },

    bodyPart() {
      // always search an array
      const list = this.allBodyParts || []
      return (
        list.find((p) => (p.slug || p.name || '').toLowerCase() === this.bodyPartSlug) || null
      )
    },

    bodyPartName() {
      if (!this.bodyPart) return this.bodyPartSlug
      const key = `bodyPart|${this.bodyPart.id}|${this.languageCode}`
      return this.translatedContent[key]?.name || this.bodyPart.name
    },

    bodyPartFilter() {
      const target = this.bodyPartSlug
      return (value) => (value.bodyPart || '').toLowerCase() === target
    },
  },

  watch: {
    // translate when we DO have a bodyPart (the old check was inverted)
    bodyPart: {
      handler(bp) {
        if (bp) this.translateThisRecord({ type: 'bodyPart', record: bp, lang: this.languageCode })
      },
      immediate: true,
    },
  },
  beforeMount() {
    this.loadCohort(this.$route.params.cohortId)
  },
  async mounted() {
    // fetch in parallel for faster paint
    const [student, parts] = await Promise.all([
      this.getStudent(),
      this.getBodyParts({}),
    ])
    this.student = student
    this.studentLoading = false
    this.allBodyParts = parts || []
    this.allBodyPartsLoading = false

    // if list is loaded but slug didn’t match anything, we can redirect or show 404
    if (this.allBodyParts.length && !this.bodyPart) {
      // optional: this.$router.replace('/404')
      // or leave as-is and show slug in header via bodyPartName fallback
    }
  },
  methods: {
    ...mapActions('cohortService', ['loadCohort']),
    ...mapActions('statisticsService', ['getRawMRIScores']),
    ...mapActions('bodyService', ['getBodyParts']),
    ...mapActions('translatedContent', ['translateThisRecord']),
    async getStudent() {
      let response = await apiGet(`/cohortStudents/${this.$route.params.studentId}`, this.accessToken)

      return response.data.student
    },
  },
}
</script>

<style scoped lang="scss"></style>
