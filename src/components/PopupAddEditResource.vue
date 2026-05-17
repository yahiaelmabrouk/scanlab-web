<template>
  <v-dialog persistent v-model="show" max-width="1200px">
    <v-card>
      <v-card-title class="headline">
        {{ isAddMode ? $t('global.add_resource') : $t('global.edit_resource') }}
      </v-card-title>
      <div>
        <v-form v-model="feedbackFormValid" @submit.prevent="save">
          <v-row class="m-0">
            <v-col cols="6">
              <v-text-field
                :rules="rules.requiredTitle"
                outlined
                hide-details
                v-model="resource.title"
                :label="$t('global.resource_title')"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                outlined
                hide-details
                :rules="rules.requiredCategory"
                v-model="resource.categoryId"
                :label="$t('global.resource_category')"
                item-text="name"
                item-value="id"
                :items="resourceCategories"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                outlined
                hide-details
                v-model="resource.type"
                :label="$t('global.resource_type')"
                :items="RESOURCE_TYPE_OPTIONS"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                outlined
                hide-details
                v-model="resource.language"
                :label="$t('global.resource_language')"
                :items="allLanguages"
                item-text="name"
                item-value="code"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                outlined
                hide-details
                v-model="resource.description"
                rows="3"
                :label="$t('global.resource_description')"
              />
            </v-col>
            <v-col cols="12" v-if="resource.type === RESOURCE_TYPES.LINK">
              <v-text-field
                outlined
                hide-details
                v-model="resource.url"
                :rules="rules.requiredUrl"
                :label="$t('global.resource_url')"
              />
            </v-col>
            <v-col cols="12" v-if="resource.type === RESOURCE_TYPES.FILE || resource.type === RESOURCE_TYPES.VIDEO">
              <v-text-field
                outlined
                hide-details
                v-model="resource.path"
                :rules="rules.requiredPath"
                :label="$t('global.resource_path')"
                readonly
                @click="onUploadFile"
              />
              <input type="file" ref="uploadFileRef" :accept="fileAccept" hidden @input="onChangeFile" />
            </v-col>
          </v-row>
          <v-row class="m-0">
            <v-col class="d-flex justify-end gap-2">
              <v-spacer></v-spacer>
              <v-btn :disabled="loading" outlined @click="closeDialog">
                <span>
                  {{ $t('global.cancel') }}
                </span>
              </v-btn>
              <v-btn :disabled="!feedbackFormValid" :loading="loading" color="success" type="submit">
                <span>
                  {{ $t('global.save') }}
                </span>
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </div>
    </v-card>
  </v-dialog>
</template>
<script>
import { RESOURCE_TYPE_OPTIONS, RESOURCE_TYPES } from '../constants'
import { apiGet, apiPost, apiPut, getHeaders } from '../util/api'
import config from '../config'
const { apiRoot } = config
import Vue from 'vue'
import { mapState } from 'vuex'
import _ from 'lodash'
import { allLanguages } from '@/util/languages'

export default {
  name: 'PopupAddEditResource',
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    id: {
      type: Number,
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      resource: {
        title: '',
        categoryId: 1,
        type: 1,
        description: '',
        url: '',
        path: '',
        language: 'en',
      },
      RESOURCE_TYPE_OPTIONS,
      RESOURCE_TYPES,
      file: null,
      feedbackFormValid: true,
      rules: {
        requiredTitle: [
          (value) => {
            if (value) return true

            return 'This field is required.'
          },
        ],
        requiredCategory: [
          (value) => {
            if (value) return true

            return 'This field is required.'
          },
        ],
        requiredUrl: [
          (value) => {
            if (value) return true

            return 'This field is required.'
          },
        ],
        requiredPath: [
          (value) => {
            if (value) return true

            return 'This field is required.'
          },
        ],
      },
      allLanguages,
    }
  },
  watch: {
    show(val) {
      if (val) {
        this.resource = {
          title: '',
          categoryId: 1,
          type: 1,
          description: '',
          url: '',
          path: '',
          language: 'en',
        }
        this.file = null
        this.feedbackFormValid = true

        if (this.id) {
          this.loading = true
          apiGet(`resources?id=${this.id}`, this.accessToken)
            .then((response) => {
              this.resource = _.pick(response.data.data, [
                'title',
                'categoryId',
                'type',
                'description',
                'url',
                'path',
                'language',
              ])
              this.loading = false
            })
            .catch((error) => {
              console.error(error)
              this.loading = false
            })
        }
      }
    },
  },
  computed: {
    ...mapState('resourceService', ['resourceCategories']),
    ...mapState('authentication', ['accessToken']),
    isAddMode() {
      return !this.id
    },
    fileAccept() {
      if (this.resource.type === RESOURCE_TYPES.FILE) {
        return '.pdf,.doc,.docx'
      } else if (this.resource.type === RESOURCE_TYPES.VIDEO) {
        return '.mp4'
      }
      return ''
    },
  },
  methods: {
    onChangeFile(e) {
      const file = e.target.files[0]
      this.file = file
      const localFileUrl = URL.createObjectURL(file)
      this.resource.path = localFileUrl
      this.$forceUpdate()
    },
    onUploadFile() {
      this.$refs.uploadFileRef.click()
    },
    closeDialog() {
      this.$emit('close')
    },
    async save() {
      this.loading = true

      if (this.file) {
        // Upload file
        try {
          let url = `${apiRoot}resources/fileUpload?filename=${encodeURIComponent(
            this.file.name
          )}&type=${encodeURIComponent(this.file.type)}`
          const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({}),
            headers: getHeaders(this.accessToken),
          })
          const data = await response.json()
          console.log(data)
          const { signature, postEndpoint } = data

          const formData = new FormData()
          _.forEach(_.keys(data.signature), (key) => {
            formData.append(key, data.signature[key])
          })
          await fetch(this.resource.path)
            .then((res) => res.blob())
            .then(async (blob) => {
              const file = new File([blob], this.file.name, { type: this.file.type })
              formData.append('file', file)

              await fetch(postEndpoint, {
                method: 'POST',
                body: formData,
              })
            })
          this.resource.path = signature.key
        } catch (e) {
          Vue.notify({ type: 'error', text: 'Failed to complete upload' })
          this.loading = false
          return
        }
      }

      const data = {
        ...this.resource,
      }
      if (this.isAddMode) {
        // Add resource
        // Call API to add resource
        apiPost('resources', data, this.accessToken)
          .then(() => {
            this.$emit('refresh')
            Vue.notify({ type: 'success', text: 'Saved!' })
          })
          .catch((error) => {
            console.error(error)
            Vue.notify({ type: 'success', text: 'Fail!' })
          })
          .finally(() => {
            this.loading = false
          })
      } else {
        // Edit resource
        // Call API to edit resource
        apiPut(`resources/${this.id}`, {}, data, this.accessToken)
          .then(() => {
            this.$emit('refresh')
            Vue.notify({ type: 'success', text: 'Saved!' })
          })
          .catch((error) => {
            console.error(error)
            Vue.notify({ type: 'success', text: 'Fail!' })
          })
          .finally(() => {
            this.loading = false
          })
      }
    },
  },
}
</script>
<style lang="scss" scoped>
.gap-2 {
  gap: 10px;
}
</style>
