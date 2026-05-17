<template>
  <div>
    <v-text-field
      v-model="search"
      append-icon="mdi-magnify"
      :label="$t('StudentManager.find_student')"
      single-line
      hide-details
      class="mb-4"
    ></v-text-field>
    <v-simple-table>
      <thead>
        <tr>
          <th class="text-left">{{ `ID` }}</th>
          <th class="text-left">{{ $t('global.name') }}</th>
          <th></th>
          <th class="text-left">{{ $t('global.email') }}</th>
          <th class="text-left">{{ $t('global.registration_code') }}</th>
          <th class="text-left">{{ $t('global.registered_on') }}</th>
          <th class="text-left">{{ $t('global.notes') }}</th>
        </tr>
      </thead>
      <tbody>
        <!-- <template v-for="category in categoryList">
          <CohortExamTableCategory :category="category" :key="category.id" @update="updateCohortSettings" />
        </template> -->
        <tr v-for="student in filteredStudents" :key="student.id">
          <td class="text-left">{{ student.user.id }}</td>
          <td class="text-left">{{ student.user.legalName }}</td>
          <td class="text-center">
            <router-link :to="`/cohorts/${cohort.id}/students/${student.id}`">{{
              $t('global.view_details')
            }}</router-link>
            <ExportStudentDataLink :student="student" :cohort="cohort" />
          </td>
          <td class="text-left">{{ student.user.email }}</td>
          <td class="text-left">{{ student.registrationCode.code }}</td>
          <td class="text-left">{{ student.formattedCreatedAt }}</td>
          <td class="text-left">{{ student.registrationCode.notes }}</td>
        </tr>
      </tbody>
    </v-simple-table>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { apiGet } from '@/util/api'
import moment from 'moment'
import ExportStudentDataLink from '@/components/ExportStudentDataLink.vue'

export default {
  name: 'CohortStudentsTable',
  components: {
    ExportStudentDataLink,
  },
  props: {
    cohort: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      students: [],
      search: '',
    }
  },
  async mounted() {
    this.students = await this.getStudents()
  },
  computed: {
    ...mapState('authentication', ['accessToken']),
    filteredStudents() {
      if (this.search) {
        return this.students.filter((student) => {
          return (
            student.user.legalName.toLowerCase().includes(this.search.toLowerCase()) ||
            student.user.id.toString().includes(this.search)
          )
        })
      }
      return this.students
    },
  },
  methods: {
    async getStudents() {
      let response = await apiGet('/cohortStudents', this.accessToken, { cohortId: this.cohort.id })

      return response.data.students.map((student) => {
        student.formattedCreatedAt = moment(student.createdAt).format('l LT')
        return student
      })
    },
  },
}
</script>

<style scoped lang="scss"></style>
