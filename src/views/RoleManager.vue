<template>
  <v-container>
    <v-row>
      <v-col>
        <TitleAndAside :title="$t('global.roles', languageCode)" />
        <PageSection>
          <v-tabs v-model="tab">
            <v-tab key="translators">
              {{ $t('global.translators', languageCode) }}
            </v-tab>
          </v-tabs>

          <v-tabs-items v-model="tab">
            <v-tab-item key="translators">
              <RolesTable roleName="translator" ref="rolesTable" />
              <v-spacer></v-spacer>

              <v-btn color="success" @click="showCreateRoleDialog('translator')">
                {{ $t('global.create_role', languageCode) }}
              </v-btn>

              <v-dialog v-model="createRoleDialogVisible" max-width="600px">
                <v-card>
                  <v-card-title class="headline">
                    {{ $t('global.create_role') }}
                  </v-card-title>
                  <v-card-text>
                    <v-form @submit.prevent="createRole">
                      <v-text-field label="User's email address" v-model="newRoleUserEmail" required></v-text-field>
                    </v-form>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="createRoleDialogVisible = false">{{ $t('global.cancel') }}</v-btn>
                    <v-btn color="success" @click="createRole">{{ $t('global.create_role') }}</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-tab-item>
          </v-tabs-items>
        </PageSection>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import TitleAndAside from '../components/Headers/TitleAndAside.vue'
import PageSection from '../components/PageSection.vue'
import RolesTable from '../components/RolesTable.vue'
import { apiGet, apiPost } from '../util/api'

const TAB_ARRAY = ['translators']

export default {
  components: { TitleAndAside, PageSection, RolesTable },
  name: 'RoleManager',
  data() {
    return {
      tabArray: TAB_ARRAY,
      createRoleDialogVisible: false,
      newRoleName: '',
      newRoleUserEmail: '',
    }
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    ...mapGetters('user', ['languageCode']),
    tab: {
      get: function () {
        let index = this.tabArray.indexOf(this.$route.query.tab)
        if (index === -1) {
          // default to available codes
          index = 0
        }
        return index
      },
      set: function (newValue) {
        this.$router.replace({ query: { tab: this.tabArray[newValue] } })
      },
    },
  },
  methods: {
    showCreateRoleDialog(roleName) {
      this.newRoleName = roleName
      this.createRoleDialogVisible = true
    },
    async createRole() {
      let result = await apiPost(
        'roles',
        { name: this.newRoleName, userEmail: this.newRoleUserEmail },
        this.accessToken
      )
      if (result.data && result.data.success) {
        this.$notify({ text: 'Created role' })
        this.newRoleUserEmail = ''
        this.createRoleDialogVisible = false
        this.$refs.rolesTable.refresh()
      } else {
        if (result.data.error_description) {
          this.$notify({ text: result.data.error_description, type: 'error' })
        } else {
          this.$notify({ text: 'Error creating role', type: 'error' })
        }
      }
    },
  },
}
</script>

<style scoped lang="scss"></style>
