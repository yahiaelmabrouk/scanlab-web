<template>
  <div v-if="isLoadingConfig">
    <LoadingBeaker :loading-percentage="progressTotal" loading-text="Loading..." :is-show-percent="false" />
  </div>
  <div
    v-else-if="
      $store.state.dicomService.dicomFileSet &&
      $store.state.dicomService.dicomFileSet.id === dicomFileSetId &&
      $store.state.dicomService.isLoaded &&
      $store.state.threeJSSVGProvider.hasLoaded
    "
    :key="dicomFileSetId"
  >
    <SliceViewToolbar :disabled-tools="['move', 'resize', 'rotate', 'oversampling']" />
    <SliceView
      ref="sliceViewContainer"
      :show-stack-selection="true"
      :view-orientation="viewOrientation"
      :am-fullscreen="false"
      :selected-stack-name="selectedStackName"
      :editable="true"
      :is-preview-slice-view="true"
      :preview-limited-ct-model-planes="limitedCTModelPlanes"
      :is-show-point-selection-answer-area="isShowPointSelectionAnswerArea"
      :is-preview-critical-thinking-question="isPreviewCriticalThinkingQuestion"
      :is-in-critical-thinking-question="isInCriticalThinkingQuestion"
      :is-show-critical-question-result="isShowCriticalQuestionResult"
    />
    <v-row class="mt-3" v-if="isInCriticalThinkingQuestion && allowSelection">
      <v-col cols="12">
        <div
          :class="['d-flex', { 'dot-size-slider-glow': !hasDotSizeSliderBeenClicked }]"
          @click="onDotSizeSliderClick"
        >
          <v-slider
            label="Dot size:"
            v-model.number="currentUserPointSelectAnswerDotSize"
            :min="1"
            :step="1"
            :max="20"
            ticks
          >
          </v-slider>
          <span>{{ currentUserPointSelectAnswerDotSize }}</span>
        </div>
      </v-col>
    </v-row>
  </div>
  <div v-else>
    <LoadingBeaker :loading-percentage="progressTotal" />
  </div>
</template>

<script>
// @ is an alias to /src
import SliceView from '@/components/SliceView'
import SliceViewToolbar from '@/components/SliceViewToolbar'
import LoadingBeaker from '@/components/LoadingBeaker'
import _ from 'lodash'
import { mapMutations, mapState } from 'vuex'
import config from '../config'

export default {
  name: 'DicomPreview',
  components: {
    SliceView,
    SliceViewToolbar,
    LoadingBeaker,
  },
  props: {
    viewOrientation: {
      type: String,
      required: true,
    },
    dicomFileSetId: {
      type: Number,
      required: true,
    },
    addStackConfigsFromSelectionConfigs: {
      required: false,
      default: null,
    },
    allowUsingAlreadyLoadedDicom: {
      // Ideally we'd always want this, but it'd need to work well on all scenarios
      type: Boolean,
      required: false,
      default: false,
    },
    editable: {
      type: Boolean,
      required: false,
      default: false,
    },
    selectedStackQuestion: {
      type: Object,
      required: false,
      default: () => {},
    },
    isShowPointSelectionAnswerArea: {
      type: Boolean,
      required: false,
      default: false,
    },
    isPreviewCriticalThinkingQuestion: {
      type: Boolean,
      required: false,
      default: false,
    },
    isInCriticalThinkingQuestion: {
      type: Boolean,
      required: false,
      default: false,
    },
    isShowCriticalQuestionResult: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      selectedStackName: null,
      isCTLab: config.isCTLab,
      isLoadingConfig: false,
    }
  },
  computed: {
    ...mapState('dicomService', ['isLoaded', 'progressTotal']),
    ...mapState('selectionConfig', ['selectionConfigsByIdent']),
    ...mapState('pointSelectService', ['userPointSelectAnswerDotSize', 'show', 'allowSelection', 'hasDotSizeSliderBeenClicked']),
    currentUserPointSelectAnswerDotSize: {
      get() {
        return this.userPointSelectAnswerDotSize
      },
      set(value) {
        this.setUserPointSelectAnswerDotSize(value)
      },
    },
    testToggles() {
      return Object.keys(this.selectionConfigsByIdent).reduce((newTestToggles, toggleName) => {
        const [groupName] = toggleName.trim().split('_')
        if (!newTestToggles[groupName]) newTestToggles[groupName] = []

        newTestToggles[groupName].push({
          toggleName,
          visible: this.selectionConfigsByIdent[toggleName].visible,
        })

        return newTestToggles
      }, {})
    },
    limitedCTModelPlanes() {
      return _.get(this.addStackConfigsFromSelectionConfigs, [0, 'limitedCTModelPlanes'], [])
    },
  },
  watch: {
    addStackConfigsFromSelectionConfigs() {
      if (this.isCTLab) {
        this.createStackFromAnswerConfig()
      }
    },
    dicomFileSetId() {
      this.onInitDicomPreview()
    },
  },
  async mounted() {
    // If we not allowed to reuse the dicom, or it's not already loaded, then reset + load it now
    // currently doesn't unload user-made StackConfigs, but probably should
    this.onInitDicomPreview()
  },
  methods: {
    ...mapMutations('pointSelectService', ['setUserPointSelectAnswerDotSize', 'setHasDotSizeSliderBeenClicked']),
    onDotSizeSliderClick() {
      if (!this.hasDotSizeSliderBeenClicked) {
        this.setHasDotSizeSliderBeenClicked(true)
      }
    },
    async onInitDicomPreview() {
      if (
        !this.allowUsingAlreadyLoadedDicom ||
        this.dicomFileSetId !== _.get(this.$store.state.dicomService, 'dicomFileSet.id')
      ) {
        await this.$store.dispatch('selectionConfig/reset', {})
        await this.$store.dispatch('interactableService/reset', {})
        await this.$store.dispatch('stackService/resetStackConfigs', {})
        await this.$store.dispatch('selectionConfig/addSelectionConfigGroup', { groupId: 0 }, { root: true })
        await this.$store.dispatch('dicomService/loadDicomGroup', {
          dicomFileSetId: this.$props.dicomFileSetId,
          reset: true,
          skipClassification: this.isInCriticalThinkingQuestion || this.isPreviewCriticalThinkingQuestion,
        })
      }

      await this.$store.dispatch('selectionConfig/selectTool', { tool: 'pan' })
      this.toggleDisplaySlice(false)
      this.createStackFromAnswerConfig()
    },
    async createStackFromAnswerConfig() {
      if (this.addStackConfigsFromSelectionConfigs) {
        this.isLoadingConfig = true
        // Add back these selectionConfigs as stackConfigs (expected to be either an array of 1, or all part of the same Scan (multi-slice-multi-angle style), like ScanButton does)
        let selectionConfigs = this.addStackConfigsFromSelectionConfigs
        const selectedHdBranchId = _.get(this.selectedStackQuestion, ['hdBranchId'], '')
        let stackConfig = await this.$store.dispatch('stackService/addMergedStackConfig', {
          selectionConfigs,
          nameNew: null,
          // shouldCalculateZDir3 = true in MR lab and false in CT lab, in CTlab use the saved zDirection to render preview slice view
          shouldCalculateZDir3: !this.isCTLab,
          selectedHdBranchId,
          skipGlobalLoading: true,
        })
        this.selectedStackName = stackConfig.name
        this.isLoadingConfig = false
      }
    },
    // Toggle display slice
    toggleDisplaySlice(visible) {
      const toggle = this.testToggles[0] ? this.testToggles[0][0] : {}
      if (toggle && toggle.toggleName) {
        this.$store.dispatch('selectionConfig/setSelectionConfig', {
          ident: toggle.toggleName,
          skipSyncingOtherGroups: true,
          selectionConfig: { visible: visible },
        })
      }
    },
    requireResetRenderer() {
      if (this.$refs.sliceViewContainer) {
        this.$refs.sliceViewContainer.requireResetRenderer()
      }
    },
  },
}
</script>

<style scoped lang="scss">
.dot-size-slider-glow ::v-deep {
  .v-slider__thumb {
    animation: thumb-glow 1.5s ease-in-out infinite;
    outline: 4px solid rgba(255, 165, 0, 1);
  }

  .v-slider__track-fill,
  .v-slider__track-background {
    animation: track-glow 1.5s ease-in-out infinite;
    outline: 3px solid rgba(255, 165, 0, 1);
  }
}

@keyframes thumb-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 10px 4px rgba(255, 165, 0, 1);
  }
}

@keyframes track-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 8px 2px rgba(255, 165, 0, 0.7);
  }
}
</style>
