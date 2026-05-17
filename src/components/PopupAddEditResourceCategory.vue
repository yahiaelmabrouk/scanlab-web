<template>
  <v-dialog persistent v-model="show" max-width="600px">
    <v-card>
      <v-card-title class="headline">
        {{ isAddMode ? $t('global.add_resource_category') : $t('global.edit_resource_category') }}
      </v-card-title>
      <div>
        <v-form v-model="feedbackFormValid" @submit.prevent="save">
          <v-row class="m-0">
            <v-col cols="12">
              <v-text-field
                :rules="rules.requiredName"
                outlined
                hide-details
                v-model="resourceCategory.name"
                :label="$t('global.resource_category_name')"
              />
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
import Vue from 'vue'
import { mapState } from 'vuex'
export default {
  name: 'PopupAddEditResourceCategory',
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
      resourceCategory: {
        name: '',
      },
      feedbackFormValid: true,
      rules: {
        requiredName: [
          (value) => {
            if (value) return true

            return 'This field is required.'
          },
        ],
      },
    }
  },
  watch: {
    show(val) {
      if (val) {
        this.resourceCategory = {
          name: '',
        }
        if (this.id) {
          this.loadResourceCategory()
        }
      }
    },
  },
  computed: {
    ...mapState('resourceService', ['resourceCategories']),
    isAddMode() {
      return !this.id
    },
  },
  methods: {
    closeDialog() {
      this.$emit('close')
    },
    loadResourceCategory() {
      const category = this.resourceCategories.find((item) => item.id === this.id)
      this.resourceCategory = {
        name: category.name,
      }
    },
    async save() {
      this.loading = true
      if (this.id) {
        this.$store
          .dispatch('resourceService/updateResourceCategory', {
            id: this.id,
            name: this.resourceCategory.name,
          })
          .then(() => {
            this.loading = false
            this.$emit('close')
          })
      } else {
        try {
          await this.$store.dispatch('resourceService/createResourceCategory', {
            name: this.resourceCategory.name,
          })
          this.loading = false
          this.$emit('close')
        } catch (error) {
          Vue.notify({
            type: 'error',
            text: error.message,
          })
        }
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
