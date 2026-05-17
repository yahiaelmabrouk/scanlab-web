<template>
  <div style="padding: 10px">
    <v-row>
      <v-col>
        <div class="mt-10 mb-10">
          <h2>{{ $t('LocalizerManager.manage_localizers') }}</h2>
        </div>
        <v-row>
          <v-col cols="12">
            <b-card class="mb-2 mx-2">
              <v-row>
                <v-col cols="6">
                  <b-card>
                    <div class="text-start mb-3">
                      <h5 style="text-align: left">{{ $t('LocalizerManager.select_dicom') }}</h5>
                      <span class="subtitle">Select Dicom to work with</span>
                    </div>
                    <v-select
                      v-model="dicomFileSets.selected"
                      :items="dicomFileSets.items"
                      item-text="text"
                      item-value="id"
                    />
                  </b-card>
                </v-col>
                <v-col cols="6">
                  <b-card>
                    <div class="text-start mb-3">
                      <h5 style="text-align: left">{{ $t('LocalizerManager.select_model') }}</h5>
                      <span class="subtitle">Select model to work with</span>
                    </div>
                    <v-select v-model="models.selected" :items="models.items" item-text="text" item-value="id" />
                  </b-card>
                </v-col>
              </v-row>
            </b-card>
          </v-col>
          <v-col cols="12">
            <b-card class="mb-2 mx-2">
              <v-row>
                <v-col cols="6">
                  <b-card v-if="selectedDicomFilesetId !== null">
                    <DicomPreview
                      :key="selectedDicomFilesetId"
                      view-orientation="z"
                      :dicom-file-set-id="selectedDicomFilesetId"
                    />
                  </b-card>
                </v-col>
                <v-col cols="6">
                  <b-card class="h-100">
                    <div style="height: 100%">
                      <MRIMachineView
                        v-if="isCTLab"
                        ref="mriViewer"
                        :is-manage-model-mode="true"
                        :should-reset-patient-position="true"
                        :model-file-name="selectedModelFileName"
                        :is-localizer-box-mode="true"
                      />
                      <MRMRIMachineView
                        v-else
                        ref="mriViewer"
                        :is-manage-model-mode="true"
                        :should-reset-patient-position="true"
                        :model-file-name="selectedModelFileName"
                        :is-localizer-box-mode="true"
                      />
                    </div>
                  </b-card>
                </v-col>
              </v-row>
            </b-card>
          </v-col>
        </v-row>
        <v-row class="d-flex justify-content-center align-items-center">
          <v-btn color="primary" class="btn-save" size="sm" @click="onSaveLocalizerBox()">{{
            $t('global.save')
          }}</v-btn>
        </v-row>
      </v-col>
    </v-row>
    <div class="loading-overlay" v-if="isLoading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script>
import MRIMachineView from '@/components/MRIMachineView'
import MRMRIMachineView from '@/components/MRMRIMachineView'
import DicomPreview from '@/components/DicomPreview'
import Vue from 'vue'
import uuidv4 from 'uuid/v4'
import _ from 'lodash'
import { apiGet, apiPost } from '../../util/api'
import { mapActions, mapState } from 'vuex'
import config from '../../config'
export default {
  components: { MRIMachineView, DicomPreview, MRMRIMachineView },
  name: 'ManageLocalizers',
  data() {
    return {
      isCTLab: config.isCTLab,
      models: {
        selected: 1,
        items: [],
      },
      dicomFileSets: {
        selected: null,
        items: [],
      },
      isLoading: false,
      currentLocalizerBox: {
        x: 0,
        y: 0,
        z: -80,
        length: 20,
        mriUpDownPositionY: 0,
      },
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    selectedModelFileName: {
      get() {
        return _.get(
          _.find(this.models.items, (el) => el.id == this.models.selected),
          ['fileName'],
          this.isCTLab ? 'Erica.glb' : 'Tom.glb'
        )
      },
    },
    selectedDicomFilesetId() {
      return this.dicomFileSets.selected
    },
  },
  watch: {},
  async mounted() {
    console.log(this.$refs)
    await this.fetchAllModels()
    await this.fetchAllDicomFileSets()
    this.$refs.mriViewer.isBodyBoxEnabled = true
    this.$refs.mriViewer.resetDataForLocalizerBoxMode()
  },
  methods: {
    ...mapActions('bodyService', ['getBodyParts']),
    async fetchAllModels() {
      let response = await apiGet(`/model`, this.accessToken)
      const datas = _.get(response, ['data', 'data'], [])
      this.models = {
        selected: _.get(datas, [0, 'id'], 1),
        items: datas.map((el) => {
          el.text = el.name
          return el
        }),
      }
    },
    async fetchAllDicomFileSets() {
      let response = await apiGet(`dicomFileSets`, this.accessToken)
      const datas = _.get(response, ['data'], [])
      this.dicomFileSets = {
        selected: _.get(datas, [0, 'id'], 1),
        items: datas.map((el) => {
          el.text = el.name
          return el
        }),
      }
    },
    onSaveLocalizerBox() {
      const data = {
        ...this.$refs.mriViewer.getPatientPositionLocalizerBoxInfo(),
        modelId: this.models.selected,
        dicomFileSetId: this.dicomFileSets.selected,
      }

      console.log('Localizer box', data)
    },
  },
}
</script>

<style scoped lang="scss">
.btn-save {
  padding: 0 32px !important;
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
.subtitle {
  color: rgb(177, 177, 177);
  font-size: 14px;
}

.no-item-text {
  color: rgb(177, 177, 177);
}
</style>
