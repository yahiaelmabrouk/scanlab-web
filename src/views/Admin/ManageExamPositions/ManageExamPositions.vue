<template>
  <div>
    <h2 class="mt-10 mb-10">{{ $t('global.manage_exam_positions') }}</h2>
    <b-card class="mb-2 mx-2">
      <b-row align-h="center" class="my-3">
        <div class="col-6">
          <b-row>
            <b-col cols="12">
              <h4 class="mb-4">Select body part</h4>
              <v-select
                :value="bodyPartId"
                :items="bodyPartOptions.filter((el) => !el.baseId)"
                item-text="name"
                item-value="id"
                :label="$t('global.body_part')"
                @change="setBodyPartId($event)"
                menu-props="auto"
              />
            </b-col>
            <b-col cols="12" v-if="isShowSelectSet">
              <h4 class="mb-4">Select position set</h4>
              <v-select
                v-model="selectedPositionSetIdValue"
                :items="patientPositionSets"
                item-text="name"
                item-value="id"
                :label="$t('global.position_set')"
                menu-props="auto"
              >
                <template #item="{ item }">
                  <div class="w-100 d-flex justify-content-between align-items-center">
                    <span>
                      {{ item.name }}
                    </span>
                    <v-btn color="primary" size="sm" @click.prevent="onDeletePositionSet($event, item)">
                      {{ $t('global.delete') }}
                    </v-btn>
                  </div>
                </template>
                <template #append-item>
                  <v-divider class="mb-2"></v-divider>
                  <v-btn class="w-100" color="primary" size="sm" @click="onAddPositionSet">
                    {{ `+ ${$t('global.add')}` }}
                  </v-btn>
                </template>
              </v-select>
            </b-col>
          </b-row>
        </div>
        <div class="col-6">
          <h4 class="mb-4">Select patient positions</h4>
          <b-row class="group-control">
            <div class="col-4 group-control-buttons">
              <button
                style="padding: 5px"
                :class="{ active: side1 == patientPositionTexts.HEAD_FIRST }"
                @click="side1 = patientPositionTexts.HEAD_FIRST"
              >
                Head First
              </button>
              <button
                style="padding: 5px"
                :class="{ active: side1 == patientPositionTexts.FEET_FIRST }"
                @click="side1 = patientPositionTexts.FEET_FIRST"
              >
                Feet First
              </button>
            </div>
            <div class="col-4 group-control-buttons">
              <button
                style="padding: 5px"
                :class="{ active: side2 == patientPositionTexts.SUPINE }"
                @click="side2 = patientPositionTexts.SUPINE"
              >
                Supine
              </button>
              <button
                style="padding: 5px"
                :class="{ active: side2 == patientPositionTexts.PRONE }"
                @click="side2 = patientPositionTexts.PRONE"
              >
                Prone
              </button>
            </div>
            <div class="col-4 group-control-buttons">
              <button
                style="padding: 5px"
                :class="{ active: side3 == patientPositionTexts.ARMS_UP }"
                @click="side3 = patientPositionTexts.ARMS_UP"
              >
                Arms up
              </button>
              <button
                style="padding: 5px"
                :class="{ active: side3 == patientPositionTexts.ARMS_DOWN }"
                @click="side3 = patientPositionTexts.ARMS_DOWN"
              >
                Arms down
              </button>
              <button
                style="padding: 5px"
                :class="{ active: side3 == patientPositionTexts.SUPERMAN_POSITION }"
                @click="side3 = patientPositionTexts.SUPERMAN_POSITION"
              >
                Superman position
              </button>
            </div>
            <div class="col-12">
              <v-btn color="primary" class="w-100" size="sm" @click="addPatientPosition()">{{
                $t('global.add')
              }}</v-btn>
            </div>
            <div class="col-12" v-for="item in patientPositionVariantsOfSelectedSet" :key="item.id">
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
                  <v-btn color="primary" size="sm" @click="deletePatientPositionVariant(item.id)">{{
                    $t('global.delete')
                  }}</v-btn>
                </div>
              </b-row>
            </div>
          </b-row>
        </div>
      </b-row>
      <b-row align-h="center" class="my-3">
        <v-btn color="primary" size="sm" @click="savePatientPositions()">{{ $t('global.save') }}</v-btn>
      </b-row>
    </b-card>
    <div class="loading-overlay" v-if="isLoading || isLoadingData">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <b-modal id="modal-add-position-set" centered hide-header ok-only @ok="onConfirmAddPositionSet">
      <div class="p-2">
        <div class="mb-3">{{ $t('global.enter_position_set_name') }}</div>
        <b-card>
          <v-text-field v-model="newPositionSetName" label="Position set name"></v-text-field>
        </b-card>
      </div>
    </b-modal>
  </div>
</template>
<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import uuidv4 from 'uuid/v4'
import _ from 'lodash'
import Vue from 'vue'
import {
  PATIENT_POSITION_TEXT,
  AVAILABLE_POSITION_COMBINATION,
  AVAILABLE_POSITION_COMBINATION_HAS_HEAD_HOLDER,
} from '../../../constants'
import { apiDelete, apiGet, apiPost } from '../../../util/api'
import config from '../../../config'

export default {
  name: 'ManageExamPositions',
  components: {},
  data() {
    return {
      isCTLab: config.isCTLab,
      newPositionSetName: '',
      bodyPartOptions: [],
      side1: PATIENT_POSITION_TEXT.HEAD_FIRST,
      side2: PATIENT_POSITION_TEXT.SUPINE,
      side3: PATIENT_POSITION_TEXT.ARMS_UP,
      isLoadingData: false,
      patientPositionTexts: PATIENT_POSITION_TEXT,
      availablePositionCombination: AVAILABLE_POSITION_COMBINATION,
      availablePositionCombinationHasHeadHolder: AVAILABLE_POSITION_COMBINATION_HAS_HEAD_HOLDER,
    }
  },
  computed: {
    ...mapState('patientPositionService', [
      'patientPositionVariants',
      'patientPositionSets',
      'bodyPartId',
      'selectedPositionSetId',
      'isLoading',
    ]),
    ...mapGetters('patientPositionService', ['patientPositionVariantsOfSelectedSet']),
    ...mapState('authentication', ['accessToken']),
    selectedPositionSetIdValue: {
      get() {
        return this.selectedPositionSetId
      },
      set(value) {
        this.setSelectedPositionSetId(value)
      },
    },
    isShowSelectSet() {
      let ids = [161, 265, 266, 273, 274]
      return ids.includes(this.bodyPartId)
    },
  },
  mounted() {
    this.fetchAllBodyParts()
  },
  methods: {
    ...mapActions('patientPositionService', [
      'addPatientPositionVariant',
      'deletePatientPositionVariant',
      'setBodyPartId',
      'setPatientPositionVariants',
      'setPatientPositionSets',
      'setPositionIsLoading',
      'getPatientPositionSetsByBodyPartId',
      'setSelectedPositionSetId',
    ]),
    ...mapActions('bodyService', ['getBodyParts']),
    async onDeletePositionSet(e, item) {
      this.setPositionIsLoading(true)
      let response = await apiDelete(`/patientPositionSet/${item.id}`, this.accessToken)
      if (response.data.success) {
        Vue.notify({
          type: 'success',
          text: 'Delete successfully!',
        })
        const data = await this.getPatientPositionSetsByBodyPartId({
          bodyPartId: this.bodyPartId,
        })
        this.setPatientPositionSets(data)
        if (item.id == this.selectedPositionSetId) {
          this.setSelectedPositionSetId(_.get(data, [0, 'id'], null))
        }
        this.setPatientPositionVariants(this.patientPositionVariants.filter((el) => el.positionSetId != item.id))
      }
      this.setPositionIsLoading(false)
    },
    onAddPositionSet() {
      this.newPositionSetName = ''
      this.$root.$emit('bv::show::modal', 'modal-add-position-set')
    },
    async onConfirmAddPositionSet() {
      if (!this.newPositionSetName) {
        Vue.notify({
          type: 'warning',
          text: "Position name can't be null!",
        })
      } else {
        this.setPositionIsLoading(true)
        let response = await apiPost(
          `/patientPositionSet`,
          { name: this.newPositionSetName, bodyPartId: this.bodyPartId },
          this.accessToken
        )

        this.setPatientPositionSets([...this.patientPositionSets, _.pick(response.data.data, ['id', 'name'])])
        this.setPositionIsLoading(false)
      }
    },
    async fetchAllBodyParts() {
      this.isLoadingData = true
      this.bodyPartOptions = await this.getBodyParts()
      this.bodyPartOptions = _.orderBy(this.bodyPartOptions, ['name'], ['asc'])
      if (this.bodyPartOptions.filter((el) => !el.baseId).length > 0) {
        this.setBodyPartId(this.bodyPartOptions.filter((el) => !el.baseId)[0].id)
      }
      this.isLoadingData = false
    },
    isHasHeadHolderOption(item) {
      return _.some(
        this.availablePositionCombinationHasHeadHolder,
        (el) => el.includes(item.value[0]) && el.includes(item.value[1]) && el.includes(item.value[2])
      )
    },
    addPatientPosition() {
      if (
        this.patientPositionVariants &&
        _.some(
          this.patientPositionVariants,
          (el) =>
            el.value.includes(this.side1) &&
            el.value.includes(this.side2) &&
            el.value.includes(this.side3) &&
            !el.isShowHeadHolder &&
            el.positionSetId == this.selectedPositionSetId
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
      this.addPatientPositionVariant({
        id: uuidv4(),
        value: [this.side1, this.side2, this.side3],
        isShowHeadHolder: false,
        positionSetId: this.selectedPositionSetId,
      })
    },
    checkPatientPositionDuplicate() {
      let isDup = false

      for (let i = 0; i < this.patientPositionVariants.length; i++) {
        const item = this.patientPositionVariants[i]
        if (
          this.patientPositionVariants.filter((el) => {
            return (
              el.isShowHeadHolder == item.isShowHeadHolder &&
              this.isArrayPositionEqual(el.value, item.value) &&
              el.positionSetId == item.positionSetId
            )
          }).length > 1
        ) {
          isDup = true
        }
      }

      return isDup
    },
    isArrayPositionEqual(arr1, arr2) {
      let isEqual = true

      for (let i = 0; i < arr1.length; i++) {
        if (!arr2.includes(arr1[i])) {
          isEqual = false
        }
      }

      return isEqual
    },
    async saveCurrentPatientPositions() {
      if (!this.bodyPartId) {
        this.setPatientPositionVariants([])
      } else {
        this.setPositionIsLoading(true)
        let response = await apiPost(
          `/patientPositions/updateByBodyPart/${this.bodyPartId}`,
          { patientPositions: this.patientPositionVariants },
          this.accessToken
        )

        this.setPatientPositionVariants(response.data.patientPositions)
        this.setPositionIsLoading(false)
      }

      Vue.notify({ text: 'Saved' })
    },
    async savePatientPositions() {
      if (this.checkPatientPositionDuplicate()) {
        Vue.notify({ type: 'error', text: `Please delete duplicate position before save!` })
        return
      }
      this.isLoadingData = true
      await this.saveCurrentPatientPositions()
      this.isLoadingData = false
    },
  },
}
</script>
<style lang="scss">
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
</style>
<style lang="scss" scoped>
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
</style>
