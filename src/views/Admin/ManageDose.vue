<template>
  <div style="padding: 10px">
    <div class="mt-10 mb-10">
      <h2>{{ $t('DoseManager.manage_dose') }}</h2>
    </div>
    <v-container>
      <b-card class="mb-2 mx-2">
        <v-row>
          <v-col>
            <b-card>
              <div class="text-start mb-3">
                <h5 style="text-align: left">{{ $t('DoseManager.select_exam') }}</h5>
              </div>
              <v-row>
                <v-col>
                  <v-select
                    v-model="baseBodyPartId"
                    :items="(exam.items || []).filter((el) => !el.baseId)"
                    item-text="name"
                    item-value="id"
                    menu-props="auto"
                    @change="onBodyPartSelectionChanged"
                  />
                </v-col>
                <v-col>
                  <v-select
                    v-model="bodyPartTypeValue"
                    :items="filterBodyPartTypes"
                    item-text="name"
                    item-value="id"
                    :label="`Type`"
                    menu-props="auto"
                  />
                </v-col>
              </v-row>
            </b-card>
            <div style="height: 20px"></div>
            <b-card>
              <v-row>
                <v-col>
                  <table>
                    <tr>
                      <td></td>
                      <td><span style="color: green">Contrast</span></td>
                      <td><span style="color: blue">Saline</span></td>
                    </tr>
                    <!-- Min dose -->
                    <tr>
                      <td>Min Dose</td>
                      <td>
                        <div class="slice-form">
                          <div class="min-max-lock contrast">
                            <SpinButtonWithInput
                              :type="'number'"
                              v-model="contrast.minDose"
                              :step="1"
                              :min="0"
                              :max="9999"
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="slice-form">
                          <div class="min-max-lock saline">
                            <SpinButtonWithInput
                              :type="'number'"
                              v-model="saline.minDose"
                              :step="1"
                              :min="0"
                              :max="9999"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <!-- Max dose -->
                    <tr>
                      <td>Max Dose</td>
                      <td>
                        <div class="slice-form">
                          <div class="min-max-lock contrast">
                            <SpinButtonWithInput
                              :type="'number'"
                              v-model="contrast.maxDose"
                              :step="1"
                              :min="0"
                              :max="9999"
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="slice-form">
                          <div class="min-max-lock saline">
                            <SpinButtonWithInput
                              :type="'number'"
                              v-model="saline.maxDose"
                              :step="1"
                              :min="0"
                              :max="9999"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <!-- Min flow rate -->
                    <tr>
                      <td>Min flow rate</td>
                      <td>
                        <div class="slice-form">
                          <div class="min-max-lock contrast">
                            <SpinButtonWithInput
                              :type="'number'"
                              v-model="contrast.minFlowRate"
                              :step="1"
                              :min="0"
                              :max="9999"
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="slice-form">
                          <div class="min-max-lock saline">
                            <SpinButtonWithInput
                              :type="'number'"
                              v-model="saline.minFlowRate"
                              :step="1"
                              :min="0"
                              :max="9999"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    <!-- Max flow rate -->
                    <tr>
                      <td>Max flow rate</td>
                      <td>
                        <div class="slice-form">
                          <div class="min-max-lock contrast">
                            <SpinButtonWithInput
                              :type="'number'"
                              v-model="contrast.maxFlowRate"
                              :step="1"
                              :min="0"
                              :max="9999"
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="slice-form">
                          <div class="min-max-lock saline">
                            <SpinButtonWithInput
                              :type="'number'"
                              v-model="saline.maxFlowRate"
                              :step="1"
                              :min="0"
                              :max="9999"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                </v-col>
                <v-col>
                  <div style="padding: 20px; padding-bottom: 0" v-for="(item, index) in posts" :key="index">
                    <v-row class="align-items-center">
                      <v-col> Post {{ index + 1 }} </v-col>
                      <v-col>
                        <div style="display: flex; align-items: center">
                          <span style="margin-right: 10px">Min</span>
                          <TimeInput v-model="item.minTime" />
                        </div>
                      </v-col>
                      <v-col>
                        <div style="display: flex; align-items: center">
                          <span style="margin-right: 10px">Max</span>
                          <TimeInput v-model="item.maxTime" />
                        </div>
                      </v-col>
                    </v-row>

                    <hr class="mb-0" v-if="index !== posts.length - 1" />
                  </div>
                </v-col>
              </v-row>
            </b-card>
          </v-col>
        </v-row>
        <v-row class="d-flex justify-content-center align-items-center">
          <v-btn color="primary" class="btn-save" size="sm" @click="onSave()">{{ $t('global.save') }}</v-btn>
        </v-row>
      </b-card>
    </v-container>
    <div class="loading-overlay" v-if="isLoading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapState } from 'vuex'
import SpinButtonWithInput from '../../components/SpinButtonWithInput.vue'
import TimeInput from '../../components/TimeInput.vue'
import { apiPatch, apiGet } from '../../util/api'
import Vue from 'vue'
import { BODY_PART_TYPES } from '../../constants'
import { calculateBodyPartIdFromBaseAndType } from '../../util/utils'

export default {
  components: { SpinButtonWithInput, TimeInput },
  name: 'ManageModels',
  data() {
    return {
      exam: {
        selected: null,
        items: [],
      },
      contrast: {
        minDose: 0,
        maxDose: 0,
        minFlowRate: 0,
        maxFlowRate: 0,
      },
      saline: {
        minDose: 0,
        maxDose: 0,
        minFlowRate: 0,
        maxFlowRate: 0,
      },
      posts: [
        {
          minTime: {
            minute: 0,
            second: 0,
          },
          maxTime: {
            minute: 0,
            second: 0,
          },
        },
        {
          minTime: {
            minute: 0,
            second: 0,
          },
          maxTime: {
            minute: 0,
            second: 0,
          },
        },
        {
          minTime: {
            minute: 0,
            second: 0,
          },
          maxTime: {
            minute: 0,
            second: 0,
          },
        },
        {
          minTime: {
            minute: 0,
            second: 0,
          },
          maxTime: {
            minute: 0,
            second: 0,
          },
        },
      ],
      bodyPartTypes: BODY_PART_TYPES,
      bodyPartTypeValue: BODY_PART_TYPES[0].id,
      baseBodyPartId: null,
      // minTimeMin: 0,
      // minTimeSec: 0,
      // maxTimeMin: 0,
      // maxTimeSec: 0,
      isLoading: false,
      pitch: 0,
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    filterBodyPartTypes: {
      get() {
        return this.bodyPartTypes.filter(
          (bpt) =>
            !!_.get(
              _.find(
                _.filter(
                  this.exam.items || [],
                  (el) => el.id == this.baseBodyPartId || el.baseId == this.baseBodyPartId
                ),
                (el) => _.get(el, ['contrastTypes', bpt.id], false)
              ),
              ['id'],
              null
            )
        )
      },
    },
  },
  watch: {
    filterBodyPartTypes: function (newVal, prevVal) {
      if (_.get(newVal, ['length'], 0) != _.get(prevVal, ['length'], 0)) {
        this.bodyPartTypeValue = _.get(newVal, ['0', 'id'], '')
      }
    },
    baseBodyPartId: function () {
      this.onBodyPartIdChange()
    },
    bodyPartTypeValue: function () {
      this.onBodyPartIdChange()
    },
    'exam.selected': function () {
      this.onBodyPartSelectionChanged(this.exam.selected)
    },
  },
  async mounted() {
    this.fetchAllBodyParts()
  },
  methods: {
    ...mapActions('bodyService', ['getBodyParts']),
    onBodyPartIdChange() {
      const id = calculateBodyPartIdFromBaseAndType(this.exam.items, this.baseBodyPartId, this.bodyPartTypeValue)
      this.exam.selected = id
    },
    async fetchAllBodyParts() {
      this.isLoading = true
      this.exam.items = await this.getBodyParts()
      this.exam.items = _.orderBy(this.exam.items, ['name'], ['asc'])
      if (this.exam.items.length > 0) {
        this.baseBodyPartId = _.get(
          this.exam.items.filter((el) => !el.baseId),
          [0, 'id'],
          this.exam.items[0].id
        )
      }
      this.isLoading = false
    },
    onSave() {
      if (_.isNil(this.exam.selected)) {
        return
      }

      this.isLoading = true

      const data = {
        contrastMinDose: this.contrast.minDose,
        contrastMaxDose: this.contrast.maxDose,
        contrastMinFlowRate: this.contrast.minFlowRate,
        contrastMaxFlowRate: this.contrast.maxFlowRate,
        salineMinDose: this.saline.minDose,
        salineMaxDose: this.saline.maxDose,
        salineMinFlowRate: this.saline.minFlowRate,
        salineMaxFlowRate: this.saline.maxFlowRate,
        posts: this.posts.map((el) => {
          return {
            minTime: parseInt(el.minTime.minute) * 60 + parseInt(el.minTime.second),
            maxTime: parseInt(el.maxTime.minute) * 60 + parseInt(el.maxTime.second),
          }
        }),
      }

      apiPatch('/injection/injectionAttributes?bodyPartId=' + this.exam.selected, data, this.accessToken)
        .then((rs) => {
          Vue.notify({ type: 'success', text: `Update successfully` })
          this.isLoading = false
        })
        .catch((err) => {
          Vue.notify({ type: 'error', text: err.message })
          this.isLoading = false
        })
    },
    onBodyPartSelectionChanged(e) {
      apiGet('/injection/injectionAttributes?bodyPartId=' + e, this.accessToken).then((rs) => {
        const data = rs.data.result

        if (data) {
          this.contrast.minDose = data.contrastMinDose
          this.contrast.maxDose = data.contrastMaxDose
          this.contrast.minFlowRate = data.contrastMinFlowRate
          this.contrast.maxFlowRate = data.contrastMaxFlowRate
          this.saline.minDose = data.salineMinDose
          this.saline.maxDose = data.salineMaxDose
          this.saline.minFlowRate = data.salineMinFlowRate
          this.saline.maxFlowRate = data.salineMaxFlowRate

          this.posts = _.map(_.get(data, ['posts'], new Array(4).fill(null)), (el) => {
            return {
              minTime: {
                minute: Math.floor(_.get(el, ['minTime'], 0) / 60),
                second: Math.floor(_.get(el, ['minTime'], 0) % 60),
              },
              maxTime: {
                minute: Math.floor(_.get(el, ['maxTime'], 0) / 60),
                second: Math.floor(_.get(el, ['maxTime'], 0) % 60),
              },
            }
          })
          this.posts = [
            ...this.posts,
            ..._.map(new Array(Math.max(0, 4 - this.posts.length)).fill(null), (el) => {
              return {
                minTime: {
                  minute: Math.floor(_.get(el, ['minTime'], 0) / 60),
                  second: Math.floor(_.get(el, ['minTime'], 0) % 60),
                },
                maxTime: {
                  minute: Math.floor(_.get(el, ['maxTime'], 0) / 60),
                  second: Math.floor(_.get(el, ['maxTime'], 0) % 60),
                },
              }
            }),
          ]
        } else {
          this.contrast.minDose = 0
          this.contrast.maxDose = 0
          this.contrast.minFlowRate = 0
          this.contrast.maxFlowRate = 0
          this.saline.minDose = 0
          this.saline.maxDose = 0
          this.saline.minFlowRate = 0
          this.saline.maxFlowRate = 0

          this.posts = _.map(new Array(4).fill(null), (el) => {
            return {
              minTime: {
                minute: Math.floor(_.get(el, ['minTime'], 0) / 60),
                second: Math.floor(_.get(el, ['minTime'], 0) % 60),
              },
              maxTime: {
                minute: Math.floor(_.get(el, ['maxTime'], 0) / 60),
                second: Math.floor(_.get(el, ['maxTime'], 0) % 60),
              },
            }
          })
        }
      })
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
.slice-form {
  display: flex;
  padding: 0 24px;
  text-align: left;
  flex-direction: column;

  margin-bottom: $spacing-small;

  input {
    border-radius: 1em;
  }

  .input-lock,
  .min-max-lock {
    display: flex;
    border: 1px solid $border-gray;
    border-top-right-radius: 0.7em;
    border-bottom-right-radius: 0.7em;
    align-items: center;
    height: 35px;
    width: 150px;
    justify-content: space-between;

    &.contrast {
      border-color: green;
    }
    &.saline {
      border-color: blue;
    }

    input {
      border: none;
    }
  }
}
</style>
