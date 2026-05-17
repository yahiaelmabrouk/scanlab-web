<template>
  <tr>
    <td v-if="isAdmin" class="text-left" @click="editStatus">{{ value.status }}</td>
    <td v-if="isAdmin" class="text-left">
      <input type="date" :value="expirationDate" @change.prevent="editExpirationDate" />
    </td>
    <td v-if="isAdmin" class="text-left">
      <v-text-field min="1" step="1" type="number" v-model.number="numOfDaysActive" />
    </td>
    <td v-if="isAdmin" class="text-left">
      <input disabled type="date" :value="postActivationExpirationDate()" />
    </td>
    <td class="text-left">{{ value.code }}</td>
    <td class="text-left">
      <v-form v-if="editingNotes" @submit.prevent="updateNotes()" class="d-flex align-center">
        <v-text-field v-model="newNotes" autofocus :placeholder="$t('global.notes')" class="flex-grow-1 mr-3" />
        <v-btn type="submit" color="success">{{ $t('global.save') }}</v-btn>
      </v-form>
      <button v-else @click.prevent="editNotes" class="notes">
        <template v-if="hasNotes">
          {{ value.notes }}
        </template>
        <em v-else>&mdash;</em>
        &nbsp;<v-icon small>mdi-pencil</v-icon>
      </button>
    </td>
  </tr>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'

import { apiPatch } from '@/util/api'

export default {
  name: 'RegistrationCodeTableRow',
  components: {},
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      newNotes: null,
      editingNotes: false,
      expirationDate: null,
    }
  },
  computed: {
    ...mapState('user', ['isAdmin']),
    ...mapGetters('user', ['languageCode']),
    ...mapState('authentication', ['accessToken']),
    hasNotes() {
      return this.value.notes && this.value.notes.length > 0
    },
    numOfDaysActive: {
      get() {
        return this.value.numOfDaysActive
      },
      set(newNumOfDays) {
        this.value.numOfDaysActive = newNumOfDays
        this.updateNumOfDaysActive()
        return newNumOfDays
      },
    },
  },
  mounted() {
    this.expirationDate = moment(this.value.expirationDate).format('YYYY-MM-DD')
  },
  methods: {
    postActivationExpirationDate() {
      let today = new Date()
      let future = new Date()
      let futureDate = future.setDate(today.getDate() + parseInt(this.value.numOfDaysActive))
      return moment(futureDate).format('YYYY-MM-DD')
    },
    editNotes() {
      this.newNotes = this.value.notes
      this.editingNotes = true
    },
    async editStatus() {
      const newStatus = this.value.status === 'active' ? 'disabled' : 'active'
      let response = await apiPatch(
        `registrationCodes/${this.value.id}`,
        {
          status: newStatus,
          registrationCodeId: this.value.code,
        },
        this.accessToken
      )

      if (response.data && response.data.success) {
        this.value.status = newStatus
        this.$notify({ type: 'success', text: 'Status Updated' })
      } else {
        this.$notify({ type: 'error', text: 'Error updating status' })
      }
    },
    async editExpirationDate(e) {
      let response = await apiPatch(
        `registrationCodes/${this.value.id}`,
        {
          expirationDate: e.target.value,
          registrationCodeId: this.value.code,
        },
        this.accessToken
      )

      if (response.data && response.data.success) {
        // eslint-disable-next-line no-self-assign
        this.expirationDate = this.expirationDate
        this.$notify({ type: 'success', text: 'Expiration Date Updated' })
      } else {
        this.$notify({ type: 'error', text: 'Error updating expiration date' })
      }
    },
    async updateNotes() {
      let response = await apiPatch(
        `registrationCodes/${this.value.id}`,
        {
          notes: this.newNotes,
          registrationCodeId: this.value.code,
        },
        this.accessToken
      )

      if (response.data && response.data.success) {
        this.value.notes = this.newNotes
        this.$notify({ type: 'success', text: 'Saved notes!' })
      } else {
        this.$notify({ type: 'error', text: 'Failed to save notes' })
      }

      this.editingNotes = false
    },
    async updateNumOfDaysActive() {
      let response = await apiPatch(
        `registrationCodes/${this.value.id}`,
        {
          registrationCodeId: this.value.code,
          numOfDaysActive: this.value.numOfDaysActive,
        },
        this.accessToken
      )

      if (response.data && response.data.success) {
        this.value.notes = this.newNotes
        this.$notify({ type: 'success', text: 'Number of active days saved' })
      } else {
        this.$notify({ type: 'error', text: 'Failed to change number of active days' })
      }
    },
  },
}
</script>

<style scoped lang="scss">
.notes:hover .v-icon {
  color: $ocean;
  caret-color: $ocean;
}
</style>
