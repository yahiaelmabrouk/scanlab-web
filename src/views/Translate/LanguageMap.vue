<template>
  <div>
    <v-card>
      <v-card-title>{{ $t('global.edit_flag', languageCode) }}</v-card-title>
      <v-card-text>
        <v-row class="p-3">
          <v-col cols="12">
            <div class="w-100">
              <v-text-field
                v-model="search"
                outlined
                label="Search"
                append-icon="mdi-magnify"
                class="input-search-language"
              />
            </div>
            <hr />
            <div class="language-container">
              <input type="file" ref="fileInput" @change="onInputFileChange" hidden accept=".png,.jpg" />
              <v-list>
                <v-list-item-group>
                  <v-list-item
                    v-for="(language, index) in filteredLanguages"
                    :key="index"
                    :value="language.code"
                    class="language-item"
                    @click="selectedLanguageCode = language.code"
                  >
                    <v-list-item-avatar>
                      <v-img :src="getLanguageFlag(language)" alt=""></v-img>
                    </v-list-item-avatar>
                    <v-list-item-content>
                      <v-list-item-title>
                        <div class="d-flex align-center justify-content-between w-100">
                          <span>{{ language.name }}</span>
                          <div class="d-flex align-center gap-2">
                            <v-btn
                              outlined
                              color="purple darken-3 ml-2"
                              class="btn-change-flag"
                              :disabled="loading"
                              @click.stop="onUploadNewFlag(language)"
                            >
                              <v-progress-circular indeterminate v-if="loading"></v-progress-circular>
                              <span v-else>{{ $t('global.upload_flag') }}</span>
                            </v-btn>
                            <v-btn
                              outlined
                              color="purple darken-3 ml-2"
                              class="btn-change-flag"
                              :disabled="loading"
                              @click.stop="onOpenEditDialog(language)"
                            >
                              <v-progress-circular indeterminate v-if="loading"></v-progress-circular>
                              <span v-else>{{ $t('global.change_flag') }}</span>
                            </v-btn>
                          </div>
                        </div>
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </div>
          </v-col>
          <v-col cols="9" v-if="currentLanguage">
            <div class="text-center">
              <h3>{{ currentLanguage.name }}</h3>
            </div>
            <div class="d-flex justify-center mt-3">
              <v-img :src="getLanguageFlag(currentLanguage)" alt="" class="current-image-flag"></v-img>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-dialog persistent v-model="showEditDialog" max-width="300px">
      <v-card>
        <v-card-title class="headline">
          {{ $t('global.change_flag') }}
        </v-card-title>
        <v-card-text>
          <div class="w-100 language-options-container">
            <v-list>
              <v-list-item-group v-model="selectedEditFlag">
                <v-list-item
                  v-for="(language, index) in languages"
                  :key="index"
                  :value="language.flag"
                  class="language-item"
                >
                  <v-list-item-avatar>
                    <v-img :src="getLanguageFlag(language)" alt=""></v-img>
                  </v-list-item-avatar>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn :disabled="loading" outlined @click="closeDialog">
            <span>
              {{ $t('global.cancel') }}
            </span>
          </v-btn>
          <v-btn :disabled="loading" color="success" @click="saveLanguageContent">
            <v-progress-circular indeterminate v-if="loading"></v-progress-circular>
            <span v-else>
              {{ $t('global.save') }}
            </span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import { allLanguages } from '@/util/languages'
import { apiPut } from '../../util/api'
import Vue from 'vue'

export default {
  name: 'LanguageMap',
  data() {
    return {
      search: '',
      languages: allLanguages,
      selectedLanguageCode: 'en',
      selectedEditFlag: '',
      showEditDialog: false,
      loading: false,
    }
  },
  computed: {
    ...mapState('translatedContent', ['languageOptions']),
    ...mapGetters('user', ['languageCode']),
    ...mapState('authentication', ['accessToken']),
    filteredLanguages() {
      // If we have a search term, only show languages that include that search term
      if (this.search && this.search.length) {
        return this.languageOptions.filter((language) => language.name.toLowerCase().includes(this.search))

        // Otherwise, show all languages
      } else {
        return this.languageOptions.filter((language) => language.name)
      }
    },
    currentLanguage() {
      return this.languageOptions.find((language) => language.code === this.selectedLanguageCode)
    },
  },
  methods: {
    ...mapActions('translatedContent', ['updateFlagOfLanguageOptions']),
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = (error) => reject(error)
      })
    },
    async onInputFileChange(event) {
      const file = event.target.files[0]
      if (!file) {
        return
      }

      try {
        this.loading = true
        const base64 = await this.fileToBase64(file)
        console.log('Selected file:', base64)

        apiPut(`/languages/${this.currentLanguage.id}`, {}, { flagSrc: base64 }, this.accessToken)
          .then((response) => {
            this.showEditDialog = false
            this.loading = false
            this.$forceUpdate()
            if (response.data?.success) {
              this.updateFlagOfLanguageOptions({
                id: this.currentLanguage.id,
                flag: response.data?.data?.flag,
              })
            }
            Vue.notify({
              type: 'success',
              text: 'Saved!',
            })
          })
          .catch((error) => {
            Vue.notify({ type: 'warning', text: `Fail!` })
            this.loading = false
            console.error('Error saving flag:', error)
          })
      } catch (error) {
        console.error('Error converting file to base64:', error)
        Vue.notify({ type: 'warning', text: `Fail!` })
      }
    },
    onUploadNewFlag(language) {
      this.selectedLanguageCode = language.code
      this.$refs.fileInput.click()
    },
    onOpenEditDialog(language) {
      this.selectedLanguageCode = language.code
      this.selectedEditFlag = this.getLanguageFlag(language)
      this.showEditDialog = true
    },
    onChangeFlag(language) {
      this.selectedEditFlag = this.getLanguageFlag(language)
    },
    closeDialog() {
      this.showEditDialog = false
    },
    saveLanguageContent() {
      this.loading = true

      apiPut(`/languages/${this.currentLanguage.id}`, {}, { flag: this.selectedEditFlag }, this.accessToken)
        .then((response) => {
          this.showEditDialog = false
          this.loading = false
          this.$forceUpdate()
          console.log('Response:', response)
          if (response.data?.success) {
            this.updateFlagOfLanguageOptions({
              id: this.currentLanguage.id,
              flag: this.selectedEditFlag,
            })
          }
          Vue.notify({
            type: 'success',
            text: 'Saved!',
          })
        })
        .catch((error) => {
          Vue.notify({ type: 'warning', text: `Fail!` })
          this.loading = false
          console.error('Error saving flag:', error)
        })
    },
    getLanguageFlag(language) {
      if (!language) {
        return null
      }
      if (language.flag) {
        return language.flag
      } else {
        const localLanguage = this.languages.find((lang) => lang.code === language.code)
        if (!localLanguage) {
          return null
        }
        return localLanguage.flag
      }
    },
  },
}
</script>
<style lang="scss">
.input-search-language {
  .v-input__control {
    .v-text-field__details {
      display: none;
    }
  }
}
.language-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  .language-item {
    .btn-change-flag {
      display: none;
    }
    &:hover {
      .btn-change-flag {
        display: block;
      }
    }
  }
}
.language-options-container {
  max-height: 500px;
  overflow-y: auto;
}
.gap-2 {
  gap: 1rem;
}
</style>
