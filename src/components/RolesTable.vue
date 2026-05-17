<template>
  <div>
    <v-simple-table>
      <thead>
        <tr>
          <th class="text-left">{{ $t('global.name') }}</th>
          <th class="text-left">{{ $t('global.email') }}</th>
          <th class="text-left">{{ $t('global.created_at') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="role in roles" :key="role.id">
          <td class="text-left">{{ role.user.legalName }}</td>
          <td class="text-left">{{ role.user.email }}</td>
          <td class="text-left">{{ role.formattedCreatedAt }}</td>
          <td class="text-right">
            <v-btn color="error" @click="showDeleteRoleDialog(role.id)">{{ $t('global.delete') }}</v-btn>
          </td>
        </tr>
      </tbody>
    </v-simple-table>
    <v-dialog v-model="deleteRoleDialogVisible" max-width="600px">
      <v-card>
        <v-card-title class="headline">
          {{ $t('global.create_role') }}
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete this role?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deleteRoleDialogVisible = false">{{ $t('global.cancel') }}</v-btn>
          <v-btn color="error" @click="deleteRole">{{ $t('global.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { apiGet, apiDelete } from '@/util/api'
import moment from 'moment'

export default {
  name: 'RolesTable',
  components: {},
  props: {
    roleName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      roles: [],
      roleToDeleteId: null,
      deleteRoleDialogVisible: false,
    }
  },
  async mounted() {
    await this.refresh()
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
  },
  methods: {
    showDeleteRoleDialog(roleId) {
      this.roleToDeleteId = roleId
      this.deleteRoleDialogVisible = true
    },
    async refresh() {
      this.roles = await this.getRoles()
    },
    async getRoles() {
      let response = await apiGet('/roles', this.accessToken, { name: this.roleName })

      return response.data.roles.map((role) => {
        role.formattedCreatedAt = moment(role.createdAt).format('l LT')
        return role
      })
    },
    async deleteRole() {
      let response = await apiDelete(`/roles/${this.roleToDeleteId}`, this.accessToken)
      if (response.data && response.data.success) {
        this.$notify({ text: 'Role deleted' })
      } else {
        this.$notify({ text: 'Error deleting role', type: 'error' })
      }
      this.refresh()
      this.deleteRoleDialogVisible = false
    },
  },
}
</script>

<style scoped lang="scss"></style>
