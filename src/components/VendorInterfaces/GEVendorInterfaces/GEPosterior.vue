<template>
  <div
    style="
      box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
      width: auto;
      margin: 6px 3px 0px 3px;
    "
  >
    <div class="col" style="height: 100%; padding: 0px !important">
      <div class="tab-list" style="height: 5%">
        <div
          v-for="(tab, index) in tabs"
          :key="index"
          :class="{ active: activeTab === tab.id }"
          @click="setActiveTab(tab.id)"
          class="tab-item"
        >
          <p :href="`#${tab.id}`" style="color: white">{{ tab.label }}</p>
        </div>
      </div>
      <div class="text-4 col" style="padding: 14px 0px 0px 10px; display: flex; height: 5%">
        <input type="checkbox" id="trbody" class="checkboxInner" />
        <v-label>T/R body coil</v-label>
      </div>
      <div class="tab-content" style="height: 85%">
        <div
          v-for="(tab, index) in tabs"
          :key="index"
          :id="tab.id"
          :class="{ active: activeTab === tab.id }"
          class="tab-pane"
          style="height: 100%"
        >
          <v-card>
            <v-card-text style="height: 100% !important">
              <!-- Head/Neck Coil -->
              <v-row
                justify="space-between"
                v-if="
                  (activeTab === 'coil' &&
                    [1, 2, 3, 4, 5, 6, 25, 58, 100, 141, 142, 143, 148].includes(currentBodyPartId)) ||
                  [32, 134, 206, 160].includes(dicomFileSetId)
                "
                style="height: 100%; width: 100%; margin: 0px !important"
              >
                <v-col style="height: 100%; width: 33.33%; padding: 0px !important">
                  <v-col
                    style="
                      height: 50% !important;
                      width: 100%;
                      padding: 0px !important;
                      justify-content: start;
                      display: flex;
                      align-items: start;
                      flex-direction: column;
                    "
                  >
                    <v-btn style="width: 100% !important; background-color: #6875a2 !important"></v-btn>
                    <p style="width: 100%">Port P1</p>
                  </v-col>
                  <v-col
                    style="
                      height: 50% !important;
                      width: 100%;
                      padding: 0px !important;
                      justify-content: center;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                    "
                  >
                    <v-btn style="width: 100% !important; background-color: #6875a2 !important"></v-btn>
                    <p style="width: 100%">Port P4</p>
                  </v-col>
                </v-col>

                <v-col
                  style="
                    height: 100%;
                    width: 33.33%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    padding: 0px !important;
                  "
                >
                  <v-btn style="width: 100% !important; background-color: #879add !important">
                    <img src="@/assets/ge_img/coil_spine_posterior_40ch.png" alt="" style="width: 100%"
                  /></v-btn>
                  <p style="font-weight: bold; margin-bottom: 0px">In Table</p>
                  <p style="width: 80% !important">Spine Posterior 40ch</p>
                </v-col>

                <v-col style="height: 100%; width: 33.33%; padding: 0px !important">
                  <v-col
                    style="
                      height: 50% !important;
                      width: 100%;
                      padding: 0px !important;
                      justify-content: start;
                      display: flex;
                      align-items: start;
                      flex-direction: column;
                    "
                  >
                    <v-btn
                      style="
                        width: 100% !important;
                        background-color: #2f3d6e !important;
                        box-shadow: inset 1px 1px 2px #000000, inset -1px -1px 2px #ffffff;
                      "
                    >
                      <img src="@/assets/ge_img/coil_head_neck_19ch.png" alt="" style="width: 100%" />
                    </v-btn>
                    <p style="width: 100%; font-weight: bold; margin-bottom: 0px">Port P2</p>
                    <p style="width: 100% !important">Head Neck 19ch</p>
                  </v-col>
                </v-col>
              </v-row>
              <!-- Knee Coil -->
              <v-row
                justify="space-between"
                v-else-if="(activeTab === 'coil' && currentBodyPartId === 21) || dicomFileSetId === 66"
                style="height: 100%; width: 100%; margin: 0px !important"
              >
                <v-col style="height: 100%; width: 33.33%; padding: 0px !important">
                  <v-col
                    style="
                      height: 50% !important;
                      width: 100%;
                      padding: 0px !important;
                      justify-content: start;
                      display: flex;
                      align-items: start;
                      flex-direction: column;
                    "
                  >
                    <v-btn
                      style="
                        width: 100% !important;
                        background-color: #2f3d6e !important;
                        box-shadow: inset 1px 1px 2px #000000, inset -1px -1px 2px #ffffff;
                      "
                    >
                      <img src="@/assets/ge_img/coil_knee_16ch.png" alt="" style="width: 55%" />
                    </v-btn>
                    <p style="width: 100%; font-weight: bold; margin-bottom: 0px">Port P1</p>
                    <p style="width: 100% !important">Knee 16ch T/R</p>
                  </v-col>
                  <v-col
                    style="
                      height: 50% !important;
                      width: 100%;
                      padding: 0px !important;
                      justify-content: center;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                    "
                  >
                    <v-btn style="width: 100% !important; background-color: #6875a2 !important"></v-btn>
                    <p style="width: 100%">Port P4</p>
                  </v-col>
                </v-col>

                <v-col
                  style="
                    height: 100%;
                    width: 33.33%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    padding: 0px !important;
                  "
                >
                  <v-btn style="width: 100% !important; background-color: #879add !important">
                    <img src="@/assets/ge_img/coil_spine_posterior_40ch.png" alt="" style="width: 100%"
                  /></v-btn>
                  <p style="font-weight: bold; margin-bottom: 0px">In Table</p>
                  <p style="width: 80% !important">Spine Posterior 40ch</p>
                </v-col>

                <v-col style="height: 100%; width: 33.33%; padding: 0px !important">
                  <v-col
                    style="
                      height: 50% !important;
                      width: 100%;
                      padding: 0px !important;
                      justify-content: start;
                      display: flex;
                      align-items: start;
                      flex-direction: column;
                    "
                  >
                    <v-btn style="width: 100% !important; background-color: #6875a2 !important"></v-btn>
                    <p style="width: 100%">Port P2</p>
                  </v-col>
                </v-col>
              </v-row>
              <!-- default coil -->
              <v-row
                justify="space-between"
                v-else-if="activeTab === 'coil'"
                style="height: 100%; width: 100%; margin: 0px !important"
              >
                <v-col style="height: 100%; width: 33.33%; padding: 0px !important">
                  <v-col
                    style="
                      height: 50% !important;
                      width: 100%;
                      padding: 0px !important;
                      justify-content: start;
                      display: flex;
                      align-items: start;
                      flex-direction: column;
                    "
                  >
                    <v-btn style="width: 100% !important; background-color: #6875a2 !important"></v-btn>
                    <p style="width: 100%">Port P1</p>
                  </v-col>
                  <v-col
                    style="
                      height: 50% !important;
                      width: 100%;
                      padding: 0px !important;
                      justify-content: center;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                    "
                  >
                    <v-btn style="width: 100% !important; background-color: #6875a2 !important"></v-btn>
                    <p style="width: 100%">Port P3</p>
                  </v-col>
                </v-col>

                <v-col
                  style="
                    height: 100%;
                    width: 33.33%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    padding: 0px !important;
                  "
                >
                  <v-btn style="width: 100% !important; background-color: #2f3d6e !important">
                    <img src="@/assets/ge_img/bed.png" alt="" style="width: 100%"
                  /></v-btn>
                  <p style="font-weight: bold; margin-bottom: 0px">In Table</p>
                  <p style="width: 80% !important">Spine Posterior 32ch</p>
                </v-col>

                <v-col style="height: 100%; width: 33.33%; padding: 0px !important">
                  <v-col
                    style="
                      height: 50% !important;
                      width: 100%;
                      padding: 0px !important;
                      justify-content: start;
                      display: flex;
                      align-items: start;
                      flex-direction: column;
                    "
                  >
                    <v-btn style="width: 100% !important; background-color: #6875a2 !important"></v-btn>
                    <p style="width: 100%">Port P2</p>
                  </v-col>
                  <v-col
                    style="
                      height: 50% !important;
                      width: 100%;
                      padding: 0px !important;
                      justify-content: center;
                      display: flex;
                      align-items: center;
                      flex-direction: column;
                    "
                  >
                    <v-btn style="width: 100% !important; background-color: #6875a2 !important"></v-btn>
                    <p style="width: 100%">Port P4</p>
                  </v-col>
                </v-col>
              </v-row>

              <v-row v-if="activeTab === 'questionCriteria'" style="height: 100%">
                <GEQuestionArea
                  v-if="stackQuestions[selectedStackQuestionIndexVisual - 1].description.split(' ')[0] !== '3-Plane'"
                  :selection-ident="selectionConfigCurrentIdent"
                  :sequence-type="sequenceType"
                  :is-ultra-lab="isUltraLab"
                  :should-pause-popup="true"
                  :use-initial-ultra-lab-defaults="useInitialUltraLabDefaults"
                />
              </v-row>
              <v-row v-if="activeTab === 'waveForms'" style="height: 100%"> </v-row>
            </v-card-text>
          </v-card>
        </div>
      </div>
      <div class="text-4 col" style="padding: 0px 0px 0px 10px; display: flex; height: 4%">
        <input type="checkbox" id="applyall" class="checkboxInner" />
        <v-label>Apply All</v-label>
      </div>
    </div>
  </div>
</template>

<script>
import GEQuestionArea from './GEQuestionArea.vue'
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { mapState, mapGetters } from 'vuex'

export default {
  mixins: [MriMixin, SelectionConfigMixin],
  name: 'GEPosterior',
  components: {
    GEQuestionArea,
  },
  data() {
    return {
      activeTab: 'coil', // Default active tab
      tabs: [
        { id: 'coil', label: 'Coil', content: 'Content for Tab 1' },
        { id: 'questionCriteria', label: this.$t('global.question_criteria'), content: 'Content for Tab 2' },
        { id: 'waveForms', label: 'Wave Forms', content: 'Content for Tab 3' },
      ],
      dicomFileSetId: null,
    }
  },
  methods: {
    setActiveTab(tabId) {
      this.activeTab = tabId
    },
    changeActiveTab(tabId) {
      this.$store.dispatch('setActiveTab', tabId)
    },
  },
  computed: {
    ...mapGetters('selectionConfig', ['selectionConfigCurrent']),
    ...mapGetters('questionService', ['currentBodyPartId']),
    sequenceType() {
      console.log('selection config current', this.selectionConfigCurrent)
      return this.selectionConfigCurrent.sequenceType
    },
  },
  mounted() {
    if (this.stackQuestions.length <= 1) {
      this.setActiveTab('coil')
    } else {
      this.setActiveTab('questionCriteria')
    }
    this.dicomFileSetId = Number(this.$route.query.dicom)
  },
}
</script>
<style scoped>
.tabs {
  display: flex;
  border: 1px solid #ddd;
  margin-bottom: 20px;
}

.tab-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  background: #101d4a;
}

.tab-item {
  padding: 10px 15px;
  /* border-bottom: 1px solid #ddd; */
  cursor: pointer;
  border: 1px solid;
  border-radius: 8px;
  border-top-right-radius: 30px;
  font-size: 10px;
  background-color: #2f3d6c;
  font-family: sans-serif;
  padding: 6px 6px 4px 9px;
}

.tab-item.active {
  border-bottom-color: transparent;
  color: black;
  background: #6875a2;
}

.tab-item a {
  text-decoration: none;
  color: #fff;
}

.tab-content {
  padding: 10px 10px 3px 10px;
}

.tab-pane {
  display: none; /* Hide all content panes by default */
}

.tab-pane.active {
  display: block; /* Show the active content pane */
}
.row {
  flex-wrap: nowrap !important;
}
::v-deep .v-btn:not(.v-btn--round).v-size--default {
  height: 70px !important;
}
::v-deep .theme--light.v-card {
  background-color: #6875a2 !important;
}
::v-deep .v-label {
  margin-bottom: 0rem;
  margin-left: 5px;
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: bold;
  color: black;
}
::v-deep .v-sheet.v-card {
  height: 100% !important;
}
::v-deep .v-btn__content {
  width: 100% !important;
}
</style>
