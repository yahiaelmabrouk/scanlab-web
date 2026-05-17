<template>
  <div style="padding: 10px; min-height: 78vh">
    <v-row>
      <v-col cols="12">
        <div class="mt-10 mb-10">
          <h2>{{ $t('global.manage_resource_categories') }}</h2>
        </div>
      </v-col>
      <v-col cols="12" class="d-flex justify-end pt-0 mt-0">
        <v-btn
          color="primary"
          @click="
            slectedId = null
            showPopup = true
          "
          >{{ $t('global.add_resource_category') }}</v-btn
        >
      </v-col>
    </v-row>
    <v-row>
      <table class="table table-striped table-bordered">
        <thead>
          <tr>
            <th>{{ $t('global.name') }}</th>
            <th>{{ $t('global.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="resourceCategories.length === 0">
            <td colspan="7">{{ $t('global.no_data') }}</td>
          </tr>
          <tr v-for="category in resourceCategories" :key="category.id" v-else>
            <td>{{ category.name }}</td>
            <td>
              <v-btn
                color="primary"
                text
                @click="
                  slectedId = category.id
                  showPopup = true
                "
                >{{ $t('global.edit') }}</v-btn
              >
              <v-btn color="error" text @click="deleteResourceCategory(category.id)">{{ $t('global.delete') }}</v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </v-row>
    <PopupAddEditResourceCategory :show="showPopup" :id="slectedId" @close="showPopup = false" />
    <div class="loading-overlay" v-if="loadingCategories">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <v-dialog v-model="isDeleteModalOpen" width="700px">
      <v-card outlined>
        <v-card-title>
          <span class="headline">
            {{ $t('global.delete_resource_category', languageCode) }}
          </span>
        </v-card-title>

        <v-card-text>
          <span>
            {{ $t('global.are_you_sure_delete_resource_category', languageCode) }}
          </span>
        </v-card-text>

        <v-card-actions class="right">
          <v-spacer></v-spacer>
          <v-btn :loading="deleteLoading" :disabled="deleteLoading" outlined @click="isDeleteModalOpen = false">
            {{ $t('global.cancel', languageCode) }}
          </v-btn>
          <v-btn
            :loading="deleteLoading"
            :disabled="deleteLoading"
            color="error"
            @click="deleteSelectedResourceCategory"
          >
            {{ $t('global.delete', languageCode) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import Vue from 'vue'
import { mapActions, mapState } from 'vuex'
import PopupAddEditResourceCategory from '../../components/PopupAddEditResourceCategory'
import { apiDelete } from '../../util/api'

export default {
  name: 'ManageResourceCategories',
  components: {
    PopupAddEditResourceCategory,
  },
  data() {
    return {
      showPopup: false,
      slectedId: null,
      isDeleteModalOpen: false,
      deleteLoading: false,
    }
  },
  computed: {
    ...mapState('resourceService', ['resourceCategories', 'loadingCategories']),
    ...mapState('authentication', ['accessToken']),
    ...mapState('user', ['languageCode']),
  },
  mounted() {
    this.loadAllResourceCategories()
  },
  methods: {
    ...mapActions('resourceService', ['loadAllResourceCategories']),
    refresh() {
      this.loadAllResourceCategories()
    },
    deleteSelectedResourceCategory() {
      this.deleteLoading = true
      apiDelete(`resourceCategories/${this.slectedId}`, this.accessToken)
        .then(() => {
          this.refresh()
          this.isDeleteModalOpen = false
          Vue.notify({
            type: 'success',
            text: 'Successfully!',
          })
        })
        .catch((err) => {
          Vue.notify({
            type: 'error',
            text: err.message,
          })
        })
        .finally(() => {
          this.deleteLoading = false
        })
    },
    deleteResourceCategory(id) {
      this.slectedId = id
      this.isDeleteModalOpen = true
    },
  },
}
</script>
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
</style>
