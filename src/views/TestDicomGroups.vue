<template>
  <div>
    <v-dialog v-model="showPreviewDialog" persistent max-width="80%">
      <v-card v-if="previewDicom">
        <v-card-title>
          <!-- eslint-disable-next-line -->
          <span class="headline">{{ previewDicom.name }} Preview</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <DicomPreview view-orientation="z" :dicom-file-set-id="previewDicom.id" :editable="true" />
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="blue"
            text
            @click="
              showPreviewDialog = false
              previewDicom = null
            "
            >{{ $t('global.close', languageCode) }}</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showUploadDialog" max-width="30%">
      <v-card v-if="selectedDicomGroup">
        <v-card-title>
          <span>{{ $t('DicomFileSets.upload_files', languageCode) }}</span>
        </v-card-title>
        <v-card-text>
          <span class="headline">{{ selectedDicomGroup.name }}</span>
          <div v-if="uploadingAmount > 0">
            {{ $t('global.files_remaining', languageCode) }}: {{ uploadingAmount }}
            <ul>
              <li v-for="name in uploadFileNamesRemainingList" :key="name">
                <pre>{{ name }}</pre>
              </li>
            </ul>
          </div>
          <Dropzone
            id="dropzone"
            ref="dropzone"
            :awss3="dropzoneAWSS3"
            :options="dropzoneOptions"
            @vdropzone-s3-upload-error="s3UploadError"
            @vdropzone-s3-upload-success="s3UploadSuccess"
            @vdropzone-success="dropzoneSuccess"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-container v-if="dicomFileSets !== null">
      <TitleAndAside title="DICOM Groups" :aside="`${dicomFileSets.length} Groups(s)`" />
      <v-row>
        <v-dialog v-model="showNewDialog" persistent max-width="50%">
          <template #activator="{ on, attrs }">
            <v-btn color="success" block x-large v-bind="attrs" v-on="on">
              {{ $t('DicomFileSets.new_dicom_group', languageCode) }}
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">{{ $t('DicomFileSets.new_dicom_group', languageCode) }}</span>
            </v-card-title>
            <v-card-text>
              <v-container>
                <v-row>
                  <v-text-field v-model="newDicomGroup.name" label="Name" required></v-text-field>
                </v-row>
                <v-row>
                  <v-select
                    :items="regions"
                    item-text="name"
                    item-value="id"
                    :label="$t('global.region', languageCode)"
                    v-model="newDicomGroup.regionId"
                  ></v-select>
                </v-row>
                <v-row>
                  <v-select :items="dicomGroupTypes" label="Type" required v-model="newDicomGroup.type"></v-select>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue" text @click="showNewDialog = false">{{ $t('global.close', languageCode) }}</v-btn>
              <v-btn color="success" text @click="saveNewDicomGroup">{{ $t('global.save', languageCode) }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-row>
      <v-divider></v-divider>
      <v-row>
        <v-expansion-panels
          v-model="selectedDicomIndex"
          hover
          focusable
          v-if="dicomFileSets"
          :key="dicomFileSets.length"
        >
          <v-expansion-panel v-for="dicom in dicomFileSets" :key="dicom.id">
            <v-expansion-panel-header>
              <v-row align="center" justify="center">
                <v-col cols="6" class="font-weight-bold">{{ dicom.id }}. {{ dicom.name }}</v-col>
                <v-col cols="2" class="text--primary">{{ mapRegion(dicom.regionId) }}</v-col>
                <v-col cols="1" class="text--primary">{{ dicom.type }}</v-col>
                <v-col cols="1">{{ dicom.flipSagittal ? 'F' : '' }} {{ dicom.userViewOnlyAllowed ? 'V' : '' }}</v-col>
                <v-col cols="2">
                  <div>
                    <v-btn @click.native.stop :to="{ path: 'mri', query: { dicom: dicom.id } }" icon
                      ><v-icon>preview</v-icon></v-btn
                    >
                    <v-btn
                      @click.native.stop
                      :to="{ path: 'mri', query: { dicom: dicom.id, questionSet: 'new', editing: true } }"
                      icon
                      ><v-icon>note_add</v-icon></v-btn
                    >
                    <v-btn @click.native.stop="showDeleteDicomModalFor = dicom" icon
                      ><v-icon color="error">delete</v-icon></v-btn
                    >
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-form>
                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model="dicom.name"
                      :placeholder="$t('global.name', languageCode)"
                      :label="$t('global.name', languageCode)"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="2">
                    <v-select
                      v-model="dicom.regionId"
                      :items="regions"
                      item-text="name"
                      item-value="id"
                      :label="$t('global.region', languageCode)"
                    ></v-select>
                  </v-col>
                  <v-col cols="2">
                    <v-select
                      v-model="dicom.bodyPartId"
                      :items="getBodyPartsForRegion(dicom.regionId)"
                      item-text="name"
                      item-value="id"
                      :label="$t('global.body_part', languageCode)"
                    ></v-select>
                  </v-col>
                  <v-col cols="2">
                    <v-select :items="dicomGroupTypes" label="Type" required v-model="dicom.type"></v-select>
                  </v-col>
                </v-row>
                <v-row class="m-0 d-flex justify-content-between gap-5">
                  <div class="d-flex w-0 flex-auto">
                    <div>{{ $t('ModelManager.available_position') }}:</div>
                    <div class="pl-10 w-0 flex-auto pt-1" v-if="dicom.availablePositions != null">
                      <div v-for="item in dicom.availablePositions" :key="item.id">
                        <b-row class="align-items-center">
                          <div class="py-2 text-left">
                            {{ item.value.join(', ')
                            }}{{ item.isShowHeadHolder ? (isCTLab ? ', Head holder' : ', Leg Pillow') : `` }}
                          </div>
                        </b-row>
                      </div>
                    </div>
                  </div>
                  <div>
                    <v-btn color="success" block @click="showAvailablePositionDialog(dicom)">
                      {{ $t('global.manage_positions') }}
                    </v-btn>
                  </div>
                </v-row>
                <v-row>
                  <v-col cols="3" class="group-checkbox-flip">
                    <v-checkbox
                      class="mt-1"
                      v-model="dicom.flipAxial"
                      :label="$t('DicomFileSets.flip_axial', languageCode)"
                    ></v-checkbox>
                    <!-- <v-checkbox
                      class="mt-1"
                      v-model="dicom.flipCoronal"
                      :label="$t('DicomFileSets.flip_coronal', languageCode)"
                    ></v-checkbox> -->
                    <v-checkbox
                      class="mb-3 mt-1"
                      v-model="dicom.flipSagittal"
                      :label="$t('DicomFileSets.flip_sagittal', languageCode)"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="3">
                    <v-checkbox
                      v-model="dicom.userViewOnlyAllowed"
                      :label="$t('DicomFileSets.user_view_only_allowed', languageCode)"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="3">
                    <v-checkbox
                      v-model="dicom.isUltraLab"
                      :label="$t('DicomFileSets.enable_ultralab', languageCode)"
                    ></v-checkbox>
                  </v-col>
                  <v-col cols="3">
                    <v-select
                      v-model="dicom.dicomCategory"
                      label="Select DICOM Category"
                      :items="dicomCategoryOptions"
                      item-text="label"
                      item-value="value"
                    >
                    </v-select>
                  </v-col>
                </v-row>
                <!-- eslint-disable-next-line -->
                <v-btn
                  color="success"
                  block
                  @click="
                    showPreviewDialog = true
                    previewDicom = dicom
                  "
                >
                  Preview Data
                </v-btn>
                <v-btn color="secondary" block x-large @click="saveDicomGroup(dicom)">{{
                  $t('global.save', languageCode)
                }}</v-btn>
              </v-form>
              <v-divider></v-divider>
              <div v-if="dicom.type !== 'CONTRAST'">
                <v-btn @click="showUploadDialog = true" block>{{
                  $t('DicomFileSets.upload_files', languageCode)
                }}</v-btn>
                <v-simple-table dense class="overflow-y-auto" height="100">
                  <template #default>
                    <thead>
                      <tr>
                        <th v-if="dicom.uploads">{{ dicom.uploads.length }} {{ $t('global.files', languageCode) }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="upload in dicom.uploads" :key="upload.id">
                        <td class="text-left">{{ upload.filename }}</td>
                      </tr>
                    </tbody>
                  </template>
                </v-simple-table>
              </div>
              <div v-else>
                <v-select
                  v-model="dicom.linkedDicoms"
                  multiple
                  deletable-chips
                  chips
                  label="Select Other DICOM Groups"
                  :items="dicomFileSetsForGroup(dicom)"
                  item-text="name"
                  item-value="id"
                >
                </v-select>
              </div>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-row>
    </v-container>
    <v-progress-linear v-else striped indeterminate color="#1692AE" height="20" />

    <v-dialog v-model="showDeleteDicomModal" width="80%">
      <v-card outlined>
        <v-card-title>
          <span class="headline">
            {{ $t('DicomFileSets.delete_dicom_confirm_title', languageCode) }}
          </span>
        </v-card-title>

        <v-card-text class="dicom-name" v-if="showDeleteDicomModalFor">
          {{ showDeleteDicomModalFor.name }}
        </v-card-text>

        <v-card-actions class="right">
          <v-spacer></v-spacer>
          <v-btn outlined @click="showDeleteDicomModalFor = null">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="error" @click="deleteDicomFileSet(showDeleteDicomModalFor)">
            {{ $t('global.delete', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showAvailablePositionModal" width="80%">
      <v-card outlined>
        <v-card-title>
          <span class="headline">
            {{ $t('global.manage_positions', languageCode) }}
          </span>
        </v-card-title>

        <v-card-text class="dicom-name">
          <v-row>
            <v-col cols="6">
              <h4 class="mb-4">{{ `Select patient positions` }}</h4>
              <b-row class="group-control">
                <div class="col-4 group-control-buttons">
                  <button
                    style="padding: 5px"
                    :class="{ active: side1 == patientPositionTexts.HEAD_FIRST }"
                    @click="side1 = patientPositionTexts.HEAD_FIRST"
                  >
                    {{ `Head First` }}
                  </button>
                  <button
                    style="padding: 5px"
                    :class="{ active: side1 == patientPositionTexts.FEET_FIRST }"
                    @click="side1 = patientPositionTexts.FEET_FIRST"
                  >
                    {{ `Feet First` }}
                  </button>
                </div>
                <div class="col-4 group-control-buttons">
                  <button
                    style="padding: 5px"
                    :class="{ active: side2 == patientPositionTexts.SUPINE }"
                    @click="side2 = patientPositionTexts.SUPINE"
                  >
                    {{ `Supine` }}
                  </button>
                  <button
                    style="padding: 5px"
                    :class="{ active: side2 == patientPositionTexts.PRONE }"
                    @click="side2 = patientPositionTexts.PRONE"
                  >
                    {{ `Prone` }}
                  </button>
                </div>
                <div class="col-4 group-control-buttons">
                  <button
                    style="padding: 5px"
                    :class="{ active: side3 == patientPositionTexts.ARMS_UP }"
                    @click="side3 = patientPositionTexts.ARMS_UP"
                  >
                    {{ `Arms up` }}
                  </button>
                  <button
                    style="padding: 5px"
                    :class="{ active: side3 == patientPositionTexts.ARMS_DOWN }"
                    @click="side3 = patientPositionTexts.ARMS_DOWN"
                  >
                    {{ `Arms down` }}
                  </button>
                  <button
                    style="padding: 5px"
                    :class="{ active: side3 == patientPositionTexts.SUPERMAN_POSITION }"
                    @click="side3 = patientPositionTexts.SUPERMAN_POSITION"
                  >
                    {{ `Superman position` }}
                  </button>
                </div>
                <div class="col-12">
                  <v-btn color="primary" class="w-100" size="sm" @click="addPatientPosition()">{{
                    $t('global.add')
                  }}</v-btn>
                </div>
              </b-row>
            </v-col>
            <v-col
              cols="6"
              v-if="this.selectedDicom != null && this.selectedDicom.availablePositions != null"
              class="position-list-container"
            >
              <div class="col-12" v-for="item in this.selectedDicom.availablePositions" :key="item.id">
                <b-row class="align-items-center">
                  <div class="col-6 text-left">
                    {{ item.value.join(', ') }}
                  </div>
                  <div class="col-3 checkbox-head-holder-container">
                    <v-checkbox
                      v-model="item.isShowHeadHolder"
                      :label="isCTLab ? 'Head holder' : 'Leg Pillow'"
                      v-if="isHasHeadHolderOption(item)"
                    ></v-checkbox>
                  </div>
                  <div class="col-3">
                    <v-btn color="primary" size="sm" @click="deletePosition(item.id)">{{ $t('global.delete') }}</v-btn>
                  </div>
                </b-row>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="right">
          <v-spacer></v-spacer>
          <v-btn outlined @click="showAvailablePositionModal = false">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn color="error" @click="confirmDicomAvailablePositions()">
            {{ $t('global.okay', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
// @ is an alias to /src
import TitleAndAside from '../components/Headers/TitleAndAside'
import DicomPreview from '../components/DicomPreview'
import log from 'loglevel'
import vue2Dropzone from 'vue2-dropzone'
import 'vue2-dropzone/dist/vue2Dropzone.min.css'
import config from '../config'
import { mapState, mapGetters, mapActions } from 'vuex'
const { apiRoot } = config
import { apiGet, apiPost, apiDelete, getHeaders } from '../util/api'
import _ from 'lodash'
import {
  AVAILABLE_POSITION_COMBINATION,
  AVAILABLE_POSITION_COMBINATION_HAS_HEAD_HOLDER,
  DICOM_CATEGORY,
  PATIENT_POSITION_TEXT,
} from '../constants'
import Vue from 'vue'
import uuidv4 from 'uuid/v4'

const DICOM_GROUP_TYPES = [
  { text: 'LOC', value: 'LOC' },
  { text: 'T1', value: 'T1' },
  { text: 'T2', value: 'T2' },
  { text: 'PD', value: 'PD' },
  { text: 'WOD', value: 'WOD' },
  { text: 'FOD', value: 'FOD' },
  { text: 'WF', value: 'WF' },
  { text: 'TISSUES', value: 'TISSUES' },
  { text: 'CONTRAST', value: 'CONTRAST' },
  { text: '', value: null },
]

export default {
  name: 'TestDicomGroups',
  components: {
    Dropzone: vue2Dropzone,
    TitleAndAside,
    DicomPreview,
  },
  data() {
    return {
      isCTLab: config.isCTLab,
      regions: null,
      dicomFileSets: null,
      uploadingAmount: 0,
      uploadFileNamesRemaining: {}, // {name: true}
      showNewDialog: false,
      showPreviewDialog: false,
      previewDicom: null,
      showUploadDialog: false,
      selectedDicomIndex: null,
      newDicomGroup: {},
      dicomGroupTypes: DICOM_GROUP_TYPES,
      showDeleteDicomModalFor: null,
      dicomCategories: DICOM_CATEGORY,
      dicomCategoryOptions: [
        {
          label: 'For Tests',
          value: DICOM_CATEGORY.FOR_TEST,
        },
        {
          label: 'For CTQ',
          value: DICOM_CATEGORY.FOR_CTQ,
        },
      ],
      showAvailablePositionModal: false,
      selectedDicom: null,
      side1: PATIENT_POSITION_TEXT.HEAD_FIRST,
      side2: PATIENT_POSITION_TEXT.SUPINE,
      side3: PATIENT_POSITION_TEXT.ARMS_UP,
      patientPositionTexts: PATIENT_POSITION_TEXT,
      availablePositionCombination: AVAILABLE_POSITION_COMBINATION,
      availablePositionCombinationHasHeadHolder: AVAILABLE_POSITION_COMBINATION_HAS_HEAD_HOLDER,
    }
  },
  computed: {
    ...mapState('user', ['isAdmin']),
    ...mapState('authentication', ['accessToken']),
    ...mapState('dicomService', ['dicomFileSet']),
    ...mapGetters('authentication', ['isLoggedIn']),
    ...mapGetters('user', ['languageCode']),
    dropzoneOptions() {
      return {
        thumbnailWidth: 150,
        maxFilesize: 1000.0, // MB
        parallelUploads: 1,
        timeout: 240000,
      }
    },
    dropzoneAWSS3() {
      // This is how Dropzone knows what to call to get the presigned post url
      return {
        signingURL: (file) => {
          return this.dropzoneSigningURL(file)
        },
        headers: getHeaders(this.accessToken),
        params: {},
        // We'll let our backend know the file is done uploading on our own
        sendFileToServer: false,
      }
    },
    uploadFileNamesRemainingList() {
      return _.keys(this.uploadFileNamesRemaining)
    },
    selectedDicomGroup() {
      return this.dicomFileSets ? this.dicomFileSets[this.selectedDicomIndex] : null
    },
    showDeleteDicomModal: {
      get() {
        return !!this.showDeleteDicomModalFor
      },
      set(val) {
        // called by v-dialog with falsey value to dismiss modal
        if (!val) {
          this.showDeleteDicomModalFor = null
        }
      },
    },
  },
  mounted() {
    this.fetchDicomFileSets()
    this.fetchRegionsAndBodyParts()
  },
  methods: {
    ...mapActions('authentication', ['login']),
    ...mapActions('bodyService', ['getBodyParts']),
    deletePosition(id) {
      this.selectedDicom.availablePositions = this.selectedDicom.availablePositions.filter((el) => el.id != id)
    },
    isHasHeadHolderOption(item) {
      return _.some(
        this.availablePositionCombinationHasHeadHolder,
        (el) => el.includes(item.value[0]) && el.includes(item.value[1]) && el.includes(item.value[2])
      )
    },
    addPatientPosition() {
      if (!this.selectedDicom.availablePositions) {
        this.selectedDicom.availablePositions = []
      }
      if (
        this.selectedDicom.availablePositions &&
        _.some(
          this.selectedDicom.availablePositions,
          (el) =>
            el.value.includes(this.side1) &&
            el.value.includes(this.side2) &&
            el.value.includes(this.side3) &&
            !el.isShowHeadHolder
        )
      ) {
        Vue.notify({ type: 'error', text: 'Position is exist!' })
        return
      }
      if (
        !_.some(
          this.availablePositionCombination,
          (el) => el.includes(this.side1) && el.includes(this.side2) && el.includes(this.side3)
        )
      ) {
        Vue.notify({ type: 'error', text: `The 3d model doesn't suppot this position!` })
        return
      }
      this.selectedDicom.availablePositions.push({
        id: uuidv4(),
        value: [this.side1, this.side2, this.side3],
        isShowHeadHolder: false,
      })
    },
    showAvailablePositionDialog(dicom) {
      this.showAvailablePositionModal = true
      this.selectedDicom = dicom
    },
    confirmDicomAvailablePositions() {
      if (!this.selectedDicom.availablePositions || this.selectedDicom.availablePositions.length == 0) {
        this.selectedDicom.availablePositions = null
      }
      this.dicomFileSets = this.dicomFileSets.map((el) => {
        if (el.id == this.selectedDicom?.id) {
          el.availablePositions = this.selectedDicom.availablePositions
        }
        return el
      })
      this.showAvailablePositionModal = false
    },
    async saveNewDicomGroup() {
      let response = await apiPost(
        `dicomFileSets`,
        {
          ...this.newDicomGroup,
          dicomCategory: this.dicomCategories.FOR_TEST,
        },
        this.accessToken
      )
      if (response.data.success) {
        this.$notify({ text: `Created ${this.newDicomGroup.name}` })
        this.dicomFileSets.unshift(response.data.dicomFileSet)
        this.selectedDicomIndex = 0
        this.showNewDialog = false
      } else {
        this.$notify({ text: `Unable to create ${this.newDicomGroup.name}`, type: 'error' })
      }
    },

    dicomFileSetsForGroup(dicom) {
      return _.filter(
        this.dicomFileSets,
        (d) => d.regionId === dicom.regionId && d.id !== dicom.id && d.type !== dicom.type
      )
    },

    mapRegion(regionId) {
      const region = _.find(this.regions, { id: regionId })
      return region ? region.name : null
    },

    getBodyPartsForRegion(regionId) {
      return _.filter(this.bodyParts, ({ region }) => region.id === regionId)
    },

    async deleteDicomFileSet(dicom) {
      let response = await apiDelete(`dicomFileSets/${dicom.id}`, this.accessToken)
      if (response.data.success) {
        this.$notify({ text: 'Deleted successfully' })
        this.showDeleteDicomModalFor = null
        this.fetchDicomFileSets()
      }
    },

    // TODO move into store?
    async fetchDicomFileSets() {
      let response = await apiGet(`dicomFileSets?dicomCategory=${this.dicomCategories.FOR_TEST}`, this.accessToken)
      this.dicomFileSets = response.data
    },

    async fetchRegionsAndBodyParts() {
      let response = await apiGet(`regions`, this.accessToken)
      this.regions = response.data.regions

      this.bodyParts = await this.getBodyParts({})
      if (this.isCTLab) {
        this.bodyParts = this.bodyParts.map((bp) => {
          return {
            ...bp,
            name: !bp.baseId ? `${bp.name} Without` : bp.name,
          }
        })
      }
    },

    async saveDicomGroup(dicom) {
      if (dicom.userViewOnlyAllowed && !dicom.bodyPartId) {
        this.$notify({ text: 'Please select a Body Part', type: 'error' })
      } else {
        try {
          await apiPost(`dicomFileSets/${dicom.id}`, dicom, this.accessToken)

          // update state
          _.extend(this.dicomFileSet, dicom)

          await this.fetchDicomFileSets()
          if (!_.some(this.dicomFileSets, (el) => el.id == dicom.id)) {
            this.selectedDicomIndex = null
          }
          this.$notify({ text: 'Saved' })
        } catch (e) {
          log.debug(e)
          this.$notify({ type: 'error', text: 'Failed to change dicom settings' })
        }
      }
    },

    // The API endpoint that makes the AWS createPresignedPost credts
    dropzoneSigningURL(file) {
      // The server REST endpoint we setup earlier
      let url = `${apiRoot}fileUpload?filename=${encodeURIComponent(file.name)}`

      // Keep track of this file being uploaded
      this.uploadFileNamesRemaining[file.name] = file
      this.uploadingAmount++

      return url
    },

    // Fired AFTER a file is successfully uploaded to S3
    async dropzoneSuccess(file) {
      const {
        s3Signature: { key: path },
      } = file

      // Tell backend we are done so it can persist ref this upload in the db
      try {
        let response = await apiPost(
          `fileUploadComplete?pathKey=${encodeURIComponent(path)}&filename=${encodeURIComponent(file.name)}&dicomId=${
            this.selectedDicomGroup.id
          }`,
          {},
          this.accessToken
        )
        if (!response.data.success) {
          this.$notify({ type: 'error', text: 'Failed to complete upload' })
          return
        } else {
          if (!this.selectedDicomGroup.uploads) {
            this.$set(this.selectedDicomGroup, 'uploads', [])
          }
          this.selectedDicomGroup.uploads.push({ filename: file.name, id: response.data.uploadId })
        }
      } catch (e) {
        this.$notify({ type: 'error', text: 'Failed to complete upload' })
      }

      // It's done now (no support for keeping track of duplicate file names, but it'd still work, just look bad - doesn't seem to be a thing within dicom set anyway)
      this.uploadFileNamesRemaining = _.omit(this.uploadFileNamesRemaining, [file.name])
      this.uploadingAmount--

      // Only refresh Dicom FileSets when nothing is uploading since removing the component temporarily breaks the upload
      if (this.uploadingAmount === 0) {
        this.$notify({ text: 'All files uploaded' })
        this.uploadingAmount = -1
        this.showUploadDialog = false
        this.$refs.dropzone.removeAllFiles()
      }
    },
    s3UploadError(errorMessage) {
      // Show an error message on failure
      log.debug('s3UploadError', errorMessage)
      this.$notify({ type: 'error', title: `Upload failed`, text: errorMessage })
    },
    s3UploadSuccess(s3ObjectLocation) {
      // Show a message after uploaded to S3
      log.debug('s3UploadSuccess', s3ObjectLocation)
    },
  },
}
</script>

<style lang="scss">
.group-checkbox-flip {
  .v-input--checkbox {
    .v-input__control {
      .v-input__slot {
        margin-bottom: 0;
      }
      .v-messages {
        display: none;
      }
    }
  }
}
.group-control {
  .group-control-buttons {
    display: flex;
    justify-content: start;
    align-items: center;
    gap: 8px;
    flex-direction: column;
  }

  button {
    background: rgba($color: #000000, $alpha: 0.1);
    width: 100%;

    &:active {
      background: #ffff00;
    }

    &.active {
      background: #ffff00;
    }
  }
}
.checkbox-head-holder-container {
  .v-input--checkbox {
    margin-top: 0;

    .v-input__control .v-input__slot {
      align-items: center;
      margin-bottom: 0;

      .v-label {
        margin-bottom: 0;
      }
    }

    .v-input__control .v-messages {
      display: none;
    }
  }
}
.position-list-container {
  max-height: 400px;
  overflow-y: auto;
}
</style>
