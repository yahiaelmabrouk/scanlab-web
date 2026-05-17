<template>
  <v-simple-table>
    <thead>
      <tr>
        <th v-if="isAdmin" class="text-left">{{ $t('global.status') }}</th>
        <th v-if="isAdmin" class="text-left">{{ $t('CohortManager.expiration_date') }}</th>
        <th v-if="isAdmin" class="text-left">{{ $t('CohortManager.days_active_count') }}</th>
        <th v-if="isAdmin" class="text-left">{{ $t('CohortManager.date_code_will_expire') }}</th>
        <th class="text-left">{{ $t('global.code') }}</th>
        <th class="text-left">{{ $t('global.notes') }}</th>
      </tr>
    </thead>
    <tbody>
      <RegistrationCodeTableRow v-for="code in registrationCodes" :value="code" :key="code.id" />
    </tbody>
  </v-simple-table>
</template>

<script>
import { mapState } from 'vuex'
import RegistrationCodeTableRow from '@/components/RegistrationCodeTableRow'

export default {
  name: 'RegistrationCodesTable',
  components: {
    RegistrationCodeTableRow,
  },
  props: {
    registrationCodes: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {}
  },
  computed: {
    ...mapState('user', ['isAdmin']),
  },
  methods: {},
}
</script>

<style scoped lang="scss"></style>
