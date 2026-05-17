import { mapActions, mapState } from 'vuex'
import _ from 'lodash'
import config from '../config'

export default {
  data() {
    return {
      testResults: null,
    }
  },
  computed: {
    ...mapState('statisticsService', {
      srvRawData: 'rawData',
      srvRawMriData: 'rawMriData',
    }),
    ...mapState('user', ['isAdmin', 'isManager']),
    ...mapState('authentication', ['userId']),
  },
  methods: {
    ...mapActions('questionService', ['getQuestionSetResultReview']),

    async openTestResultsForPoint(event) {
      const {
        questionSetResultId,
        userId: pointUserId,
        isSandbox,
        isViewedAdminComment,
        isViewedUserReply,
      } = event.point

      if (isSandbox) return
      if (!questionSetResultId) return

      const targetUserId = pointUserId || this.userId
      const whomKey = `user_${targetUserId}`

      const data = await this.getQuestionSetResultReview({ questionSetResultId, userId: targetUserId })
      if (!_.get(data, ['stackQuestionResults', 'length'])) return

      const { criticalThinkingResults: rawCriticalThinkingResults, ...remainingData } = data
      const mriOverallScore = data.questionSetResult?.score ?? data.overall

      const { score: overall } =
        this.srvRawData?.[whomKey]?.find((item) => item.questionSetResultId === remainingData.questionSetResultId) || {}

      const { patientPrepScore, patientPrepScores, questionSetResultScore, sliceQuantScore } =
        this.srvRawMriData?.[whomKey]?.find((item) => item.questionSetResultId === remainingData.questionSetResultId) ||
        {}

      const parseScore = (result) => Number(_.get(result, ['score'], 0))
      const criticalThinkingResults = _.uniqBy(rawCriticalThinkingResults, 'questionId') || []
      const criticalThinkingOverallScore = config.isCTLab
        ? _.meanBy(
            criticalThinkingResults.filter((r) => r.type !== 'SF'),
            parseScore
          ).toFixed(2)
        : _.meanBy(criticalThinkingResults, parseScore).toFixed(2)

      this.testResults = {
        ...remainingData,
        criticalThinkingResults,
        overall,
        mriOverallScore,
        patientPrepScore,
        patientPrepScores,
        questionSetResultScore,
        criticalThinkingOverallScore,
        sliceQuantScore,
        isViewedAdminComment,
        isViewedUserReply,
      }
    },

    onCloseTestResults() {
      this.testResults = null
    },
  },
}
