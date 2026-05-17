<template>
  <div style="min-height: 78vh">
    <div class="loading-overlay" v-if="loading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <v-card>
      <v-card-title>{{ $t('global.translate_word_phrase', languageCode) }}</v-card-title>
      <v-card-text>
        <v-row class="p-3">
          <v-col cols="3">
            <div class="w-100">
              <v-text-field
                v-model="tmpSearch"
                outlined
                label="Search"
                append-icon="mdi-magnify"
                @keypress.enter="search = tmpSearch"
                @input="debouncedSearch"
              />
            </div>
            <LanguageTreeNode
              key="en"
              :content="defaultLanguageTranslationContent"
              :init-path="[]"
              :object-key="null"
              :selected-path="selectedPath"
              :search="search"
              @change-content="onChangeContent"
              @delete-content="onDeleteContent"
              @add-translation="openAddDialog($event)"
            />
          </v-col>

          <v-col cols="9">
            <v-autocomplete
              v-model="selectedLanguageCode"
              :items="languages"
              :label="$t('global.language')"
              item-text="name"
              item-value="code"
              menu-props="auto"
            />
            <v-divider></v-divider>
            <div class="mt-1 d-flex justify-content-end align-items-center gap-2">
              <v-btn outlined color="blue darken-3" @click="onChangeLanguageMap()">
                {{ $t('global.edit_flag', languageCode) }}
              </v-btn>
              <v-btn outlined color="blue darken-3" @click="openAddDialog()">
                {{ $t('global.add_translation', languageCode) }}
              </v-btn>
            </div>
            <h3 v-if="!selectedLanguageCode" class="mt-3">
              {{ $t('Translate.shared.choose_a_language_to_get_started_translating', languageCode) }}
            </h3>
            <h3 v-else-if="!selectedPath" class="mt-3">
              {{ $t('Translate.shared.choose_a_key_to_get_started_translating', languageCode) }}
            </h3>
            <div v-else class="mt-3">
              <div>
                <div class="d-flex flex-grow-1">
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    :value="defaultContentValue"
                    :label="`${$t('global.name')} (en)`"
                    class="mr-2"
                  />
                  <v-textarea
                    outlined
                    readonly
                    hide-details
                    v-model="currentContentValue"
                    :label="`${$t('global.name')} (${languageCode})`"
                  />
                </div>
                <div class="d-flex justify-content-center mt-3">
                  <v-btn outlined color="purple darken-3" @click="openEditDialog">
                    {{ $t('global.edit_translation', languageCode) }}
                  </v-btn>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
      <v-dialog persistent v-model="showEditDialog" max-width="500px">
        <v-card>
          <v-card-title class="headline">
            {{ $t('global.edit_translation') }}
          </v-card-title>
          <v-card-text>
            <v-textarea outlined hide-details v-model="newTranslation" :label="$t('global.translation')" />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn :disabled="loading" outlined @click="closeDialog">
              <span>
                {{ $t('global.cancel') }}
              </span>
            </v-btn>
            <v-btn :disabled="loading" color="success" @click="saveEditTranslatedContent">
              <v-progress-circular indeterminate v-if="loading"></v-progress-circular>
              <span v-else>
                {{ $t('global.save') }}
              </span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog persistent v-model="showAddDialog" max-width="900px">
        <v-card>
          <v-card-title class="headline">
            <span>{{ $t('global.add_translation') }}</span>
            <span class="text-badge">{{ currentFolder ? `(${currentFolder})` : `` }}</span>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-textarea
                  outlined
                  hide-details
                  v-model="newTranslationForm.key"
                  :label="$t('global.key')"
                  placeholder="global.key1.key2"
                />
              </v-col>
              <v-col cols="6">
                <v-textarea
                  outlined
                  hide-details
                  v-model="newTranslationForm.value"
                  :label="$t('global.translation')"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn :disabled="loading" outlined @click="showAddDialog = false">
              <span>
                {{ $t('global.cancel') }}
              </span>
            </v-btn>
            <v-btn :disabled="loading" color="success" @click="saveNewTranslatedContent">
              <v-progress-circular indeterminate v-if="loading"></v-progress-circular>
              <span v-else>
                {{ $t('global.save') }}
              </span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog persistent v-model="showConfirmDeleteDialog" max-width="900px">
        <v-card>
          <v-card-title class="headline">
            {{ $t('global.delete_tranlate_confirmation') }}
          </v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn :disabled="loading" outlined @click="showConfirmDeleteDialog = false">
              <span>
                {{ $t('global.cancel') }}
              </span>
            </v-btn>
            <v-btn :disabled="loading" color="success" @click="deleteTranslatedContent">
              <v-progress-circular indeterminate v-if="loading"></v-progress-circular>
              <span v-else>
                {{ $t('global.okay') }}
              </span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </div>
</template>

<script>
import { allLanguages } from '@/util/languages'
import { mapState, mapGetters, mapActions } from 'vuex'
import LanguageTreeNode from '../../components/LanguageTreeNode.vue'
import _ from 'lodash'
import { apiPut } from '../../util/api'
import Vue from 'vue'

export default {
  name: 'WordPhrases',
  components: { LanguageTreeNode },
  data() {
    return {
      allMriTests: [],
      languages: allLanguages,
      selectedLanguageCode: 'en',
      selectedPath: null,
      currentContentValue: null,
      showEditDialog: false,
      showAddDialog: false,
      showConfirmDeleteDialog: false,
      loading: true,
      newTranslation: null,
      search: '',
      tmpSearch: '',
      debouncedSearch: null,
      removePath: null,
      newTranslationForm: {
        key: '',
        value: '',
      },
      newTranslationFolderPath: null,
    }
  },
  created() {
    this.debouncedSearch = _.debounce(() => {
      this.search = this.tmpSearch
    }, 300)
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapState('authentication', ['accessToken']),
    ...mapState('translatedContent', ['languagesTranslations']),
    currentLanguageTranslation() {
      return this.languagesTranslations.find((lt) => lt.code.toLowerCase() === this.selectedLanguageCode)
    },
    currentLanguageTranslationContent() {
      return this.currentLanguageTranslation?.content
    },
    defaultLanguageTranslation() {
      return this.languagesTranslations.find((lt) => lt.code.toLowerCase() === 'en')
    },
    defaultLanguageTranslationContent() {
      return this.defaultLanguageTranslation?.content
    },
    currentKey() {
      return !_.isEmpty(this.selectedPath) && !_.isNil(this.selectedPath) && this.selectedPath
        ? this.selectedPath.join('.')
        : null
    },
    defaultContentValue() {
      return this.selectedPath ? _.get(this.defaultLanguageTranslationContent, this.selectedPath, null) : ''
    },
    currentFolder() {
      return !_.isEmpty(this.newTranslationFolderPath) &&
        !_.isNil(this.newTranslationFolderPath) &&
        this.newTranslationFolderPath
        ? this.newTranslationFolderPath[this.newTranslationFolderPath.length - 1]
        : null
    },
  },
  watch: {
    selectedPath() {
      this.currentContentValue = _.get(this.currentLanguageTranslationContent, this.selectedPath, null)
      this.newTranslation = this.currentContentValue
    },
    currentLanguageTranslationContent() {
      this.currentContentValue = _.get(this.currentLanguageTranslationContent, this.selectedPath, null)
      this.newTranslation = this.currentContentValue
    },
  },
  async mounted() {
    await this.getAllLanguages()
    this.loading = false
  },
  methods: {
    ...mapActions('translatedContent', ['updateI18nMessages', 'getAllLanguages']),
    onChangeLanguageMap() {
      this.$router.push({ path: '/translate/language-map' })
    },
    openAddDialog(path = null) {
      this.newTranslationForm = {
        key: '',
        value: '',
      }
      this.newTranslationFolderPath = path
      this.showAddDialog = true
    },
    openEditDialog() {
      this.newTranslation = this.currentContentValue
      this.showEditDialog = true
    },
    closeDialog() {
      this.newTranslation = null
      this.showEditDialog = false
      this.$forceUpdate()
    },
    async saveNewTranslatedContent() {
      if (!this.newTranslationForm.key) {
        this.$notify({
          type: 'warning',
          text: 'Key are required!',
        })
        return
      }
      if (_.has(this.defaultLanguageTranslationContent, this.newTranslationForm.key)) {
        this.$notify({
          type: 'warning',
          text: 'Key already exists!',
        })
        return
      }
      this.loading = true
      let newContent = _.cloneDeep(this.defaultLanguageTranslationContent)
      let path = this.newTranslationForm.key.split('.')
      if (this.newTranslationFolderPath) {
        path = this.newTranslationFolderPath.concat(path)
      }
      newContent = _.set(this.defaultLanguageTranslationContent, path, this.newTranslationForm.value)

      const data = {
        content: newContent,
      }

      apiPut(`/languages/${this.defaultLanguageTranslation.id}`, {}, data, this.accessToken)
        .then(async () => {
          this.showAddDialog = false
          this.loading = false
          await this.updateI18nMessages({ lang: 'en' })
          this.selectedPath = null
          this.currentContentValue = _.get(this.defaultLanguageTranslationContent, this.selectedPath, null)
          this.$forceUpdate()
          Vue.notify({
            type: 'success',
            text: 'Saved!',
          })
        })
        .catch((error) => {
          Vue.notify({ type: 'warning', text: `Fail!` })
          this.loading = false
          console.error('Error saving translation:', error)
        })
    },
    async saveEditTranslatedContent() {
      this.loading = true
      let newContent = _.cloneDeep(this.currentLanguageTranslationContent)
      newContent = _.set(this.currentLanguageTranslationContent, this.selectedPath, this.newTranslation)

      const data = {
        content: newContent,
      }

      apiPut(`/languages/${this.currentLanguageTranslation.id}`, {}, data, this.accessToken)
        .then(async () => {
          this.showEditDialog = false
          this.loading = false
          await this.updateI18nMessages({})
          this.currentContentValue = _.get(this.currentLanguageTranslationContent, this.selectedPath, null)
          this.$forceUpdate()
          Vue.notify({
            type: 'success',
            text: 'Saved!',
          })
        })
        .catch((error) => {
          Vue.notify({ type: 'warning', text: `Fail!` })
          this.loading = false
          console.error('Error saving translation:', error)
        })
    },
    deleteTranslatedContent() {
      this.loading = true
      let newContent = _.cloneDeep(this.defaultLanguageTranslationContent)
      _.unset(newContent, this.removePath)

      const data = {
        content: newContent,
      }

      apiPut(`/languages/${this.defaultLanguageTranslation.id}`, {}, data, this.accessToken)
        .then(async () => {
          this.showEditDialog = false
          this.loading = false
          await this.updateI18nMessages({ lang: 'en' })
          this.selectedPath = null
          this.currentContentValue = ''
          this.showConfirmDeleteDialog = false
          this.$forceUpdate()
          Vue.notify({
            type: 'success',
            text: 'Saved!',
          })
        })
        .catch((error) => {
          Vue.notify({ type: 'warning', text: `Fail!` })
          this.loading = false
          console.error('Error saving translation:', error)
        })
    },
    onChangeContent(path) {
      this.selectedPath = path
    },
    onDeleteContent(path) {
      this.selectedPath = null
      this.removePath = path
      this.showConfirmDeleteDialog = true
    },
  },
}
</script>

<style scoped lang="scss">
.gap-2 {
  gap: 1rem;
}
.text-badge {
  font-size: 1.1rem;
  color: #999;
  margin-left: 6px;
}
.scolly-vh-75 {
  overflow-y: auto;
  max-height: 75vh;
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
  z-index: 9999;
}
</style>
