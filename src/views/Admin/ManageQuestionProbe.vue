<template>
  <div style="padding: 10px">
    <v-row>
      <v-col>
        <div class="mt-10 mb-10">
          <h2>{{ $t('global.manage_watch_towers') }}</h2>
        </div>
        <v-row>
          <v-col cols="4">
            <b-card class="mb-2 mx-2">
              <v-row>
                <v-row>
                  <v-col>
                    <b-card>
                      <div class="text-start mb-3">
                        <h5>{{ $t('ModelManager.select_body_part') }}</h5>
                        <span class="subtitle">{{ `Select body part to define probe data` }}</span>
                      </div>
                      <v-row>
                        <v-col>
                          <v-autocomplete
                            v-model="selectedBodyPartId"
                            :items="bodyPartOptions"
                            item-text="text"
                            item-value="value"
                            menu-props="auto"
                          />
                        </v-col>
                      </v-row>
                    </b-card>
                  </v-col>
                </v-row>
              </v-row>
              <v-row class="d-flex justify-content-center align-items-center mt-5" style="gap: 12px">
                <v-btn
                  color="primary"
                  class="btn-save"
                  :disabled="selectedBodyPartId == null"
                  size="sm"
                  @click="onSave"
                  >{{ $t('global.save') }}</v-btn
                >
                <!-- <v-btn color="warning" class="btn-save" size="sm">{{ $t('global.cancel') }}</v-btn> -->
              </v-row>
            </b-card>
          </v-col>
          <v-col cols="8">
            <b-card class="mb-2 mx-2 text-left">
              <v-row>
                <v-col cols="12" class="p-2">
                  <div class="d-flex align-items-center gap-5">
                    <h5 class="m-0">
                      {{ `Scan Direction` }}
                    </h5>
                    <div class="flex-auto d-flex justify-content-center">
                      <v-radio-group
                        v-model="selectedScanDirection"
                        row
                        class="question-probe-scan-direction-container"
                      >
                        <v-radio label="Head-to-foot" :value="1"></v-radio>
                        <v-radio label="Foot-to-head" :value="2"></v-radio>
                      </v-radio-group>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" class="p-2 mb-0 pb-0">
                  <h5 class="m-0">
                    {{ `Probe components:` }}
                  </h5>
                </v-col>
                <!-- <v-col
                  cols="4"
                  v-for="(item, index) in this.currentQuestionProbe.visibleProbes"
                  :key="item.name"
                  class="p-2"
                >
                  <v-checkbox
                    hide-details
                    :label="`(${index + 1}) ${item.label}`"
                    v-model="item.visible"
                    class="probe-name-checkbox"
                  />
                </v-col> -->
                <v-col cols="12">
                  <draggable
                    v-model="currentQuestionProbe.visibleProbes"
                    tag="div"
                    class="row"
                    handle=".handle"
                    :animation="200"
                    ghost-class="ghost"
                    chosen-class="chosen"
                    drag-class="dragging"
                    @end="onDragEnd"
                    :clone="cloneItem"
                  >
                    <v-col
                      cols="4"
                      v-for="(item, index) in currentQuestionProbe.visibleProbes"
                      :key="item.name"
                      class="question-probe-item"
                    >
                      <v-checkbox
                        hide-details
                        :label="`${index + 1}. ${item.label}`"
                        v-model="item.visible"
                        class="probe-name-checkbox"
                      >
                        <template #prepend>
                          <v-icon class="handle" style="cursor: move">mdi-drag</v-icon>
                        </template>
                      </v-checkbox>
                    </v-col>
                  </draggable>
                </v-col>
              </v-row>
            </b-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <div class="loading-overlay" v-if="isLoading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>
<script>
import { mapActions, mapState } from 'vuex'
import { apiGet, apiPost, apiPut } from '../../util/api'
import _ from 'lodash'
import { DEFAULT_QUESTION_PROBE, SCAN_DIRECTION } from '../../constants'
import Vue from 'vue'
import draggable from 'vuedraggable'

export default {
  name: 'ManageQuestionProbe',
  components: {
    draggable,
  },
  data: () => {
    return {
      selectedBodyPartId: null,
      isLoading: false,
      currentQuestionProbe: _.cloneDeep(DEFAULT_QUESTION_PROBE),
      allBodyParts: [],
      selectedScanDirection: SCAN_DIRECTION.HEAD_TO_FOOT,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapState('timingDecisionService', ['probeData']),
    bodyPartOptions() {
      return this.allBodyParts
        .filter((el) => {
          return (
            !el.baseId &&
            el.name &&
            (el.name.toLowerCase().includes('abdomen') || el.name.toLowerCase().includes('cta'))
          )
        })
        .map((el) => ({
          text: el.name,
          value: el.id,
        }))
    },
    selectedProbeNames() {
      return _.get(this.currentQuestionProbe, ['visibleProbes'], []).map((el) => el.name)
    },
  },
  watch: {
    selectedBodyPartId: 'loadCurrentQuestionProbe',
    selectedScanDirection: 'loadCurrentQuestionProbe',
    probeData: 'syncVisibleProbes',
  },
  async mounted() {
    this.isLoading = true
    await this.fetchAllBodyParts()
    if (this.bodyPartOptions.length > 0) {
      this.selectedBodyPartId = this.bodyPartOptions[0].value
    }
    await this.loadProbeJsonData('/img/probeData.zip')
    this.isLoading = false

    this.loadCurrentQuestionProbe()
  },
  methods: {
    ...mapActions('timingDecisionService', ['loadProbeJsonData']),
    ...mapActions('bodyService', ['getBodyParts']),
    onDragEnd() {},
    cloneItem(item) {
      return { ...item }
    },
    async fetchAllBodyParts() {
      this.allBodyParts = await this.getBodyParts()
      this.allBodyParts = _.orderBy(this.allBodyParts, ['name'], ['asc'])
    },
    onSave() {
      this.isLoading = true
      if (!this.currentQuestionProbe.id) {
        apiPost('questionProbe', this.currentQuestionProbe, this.accessToken)
          .then((res) => {
            this.currentQuestionProbe = res.data.data
            Vue.notify({ type: 'success', text: 'Saved!' })
          })
          .catch((error) => {
            console.error(error)
            Vue.notify({ type: 'success', text: 'Fail!' })
          })
          .finally(() => {
            this.isLoading = false
          })
      } else {
        apiPut(`questionProbe/${this.currentQuestionProbe.id}`, {}, this.currentQuestionProbe, this.accessToken)
          .then((res) => {
            this.currentQuestionProbe = res.data.data
            Vue.notify({ type: 'success', text: 'Saved!' })
          })
          .catch((error) => {
            console.error(error)
            Vue.notify({ type: 'success', text: 'Fail!' })
          })
          .finally(() => {
            this.isLoading = false
          })
      }
    },
    syncVisibleProbes() {
      const allCurrentProbeData = this.currentQuestionProbe.visibleProbes.map((el) => el.name)
      const unAppearProbeData = this.probeData.filter((el) => {
        return !allCurrentProbeData.includes(el.fileName)
      })

      this.currentQuestionProbe.visibleProbes = [
        ...this.currentQuestionProbe.visibleProbes,
        ...unAppearProbeData.map((el) => ({
          name: el.fileName,
          label: el.label,
          visible: false,
          color: null,
        })),
      ]

      // update label of saved data
      this.currentQuestionProbe.visibleProbes.forEach((el) => {
        const probe = this.probeData.find((p) => p.fileName == el.name)
        if (probe) {
          el.label = probe.label
        }
      })
    },
    async loadCurrentQuestionProbe() {
      if (!this.selectedBodyPartId) {
        return
      }
      this.isLoading = true
      apiGet(
        `questionProbe?bodyPartId=${this.selectedBodyPartId}&scanDirection=${this.selectedScanDirection}`,
        this.accessToken
      )
        .then((response) => {
          const questionProbes = _.get(response, ['data', 'data', 'questionProbes'], [])
          if (questionProbes.length > 0) {
            this.currentQuestionProbe = questionProbes[0]
          } else {
            this.currentQuestionProbe = _.cloneDeep(DEFAULT_QUESTION_PROBE)
            this.currentQuestionProbe.bodyPartId = this.selectedBodyPartId
          }
          this.currentQuestionProbe.scanDirection = this.selectedScanDirection
          this.syncVisibleProbes()
        })
        .catch(() => {
          this.currentQuestionProbe = _.cloneDeep(DEFAULT_QUESTION_PROBE)
          this.currentQuestionProbe.bodyPartId = this.selectedBodyPartId
          this.currentQuestionProbe.scanDirection = this.selectedScanDirection
          this.syncVisibleProbes()
        })
        .finally(() => {
          this.isLoading = false
        })
    },
  },
}
</script>
<style lang="scss">
.probe-name-checkbox {
  margin-top: 0;
  .v-input__slot {
    .v-label {
      margin-bottom: 0;
    }
  }
}
.question-probe-scan-direction-container {
  margin-top: 0;
  .v-radio {
    .v-label {
      margin-bottom: 0 !important;
    }
  }
  .v-input__control {
    .v-input__slot {
      margin-bottom: 0 !important;
    }
    .v-messages {
      display: none;
    }
  }
}
</style>
<style lang="scss" scoped>
.question-probe-item {
  background: #fffef9;
}
.handle {
  cursor: move;
}

.chosen {
  opacity: 1;
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

.dragging {
  opacity: 0.3;
  background: #e0e0e0;
  transition: opacity 0.2s ease;
}

.ghost {
  opacity: 1;
  background: #c8ebfb;
  border: 2px dashed #1976d2;
  position: relative;
  z-index: 9999;
}

.draggable-ghost {
  position: fixed !important;
  pointer-events: none;
  z-index: 9999;
}
.gap-5 {
  gap: 1.25rem;
}
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
