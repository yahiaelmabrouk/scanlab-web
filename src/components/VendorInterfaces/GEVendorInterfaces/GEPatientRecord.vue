<template>
  <div style="background-color: #6875a2; width: 75%; z-index: 3">
    <div style="background-color: #6875a2; height: 100%">
      <v-row>
        <GEToolbar />
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-data-table :headers="tableHeaders" :items="tableItems" class="elevation-1"> </v-data-table>
        </v-col>
      </v-row>

      <v-row class="part-3">
        <v-col cols="4">
          <v-card>
            <v-card-title>Patient</v-card-title>
            <v-card-text>
              <v-form>
                <v-text-field label="Last Name" v-model="patient.lastName" required outlined></v-text-field>
                <v-text-field label="First Name" v-model="patient.firstName" required outlined></v-text-field>
                <v-text-field label="Patient ID" v-model="patient.id" required outlined></v-text-field>
                <v-text-field label="Weight (lb)" v-model="patient.weightLb" outlined></v-text-field>
                <v-text-field label="Weight (kg)" v-model="patient.weightKg" outlined></v-text-field>
                <v-menu
                  ref="menu"
                  v-model="menu"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  lazy
                  transition="scale-transition"
                  offset-y
                  full-width
                  min-width="290px"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="patient.dateOfBirth"
                      label="Date of Birth"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                      outlined
                    ></v-text-field>
                  </template>
                  <v-date-picker v-model="patient.dateOfBirth" no-title @input="menu = false"></v-date-picker>
                </v-menu>
                <v-row>
                  <v-col cols="4">
                    <v-text-field label="Years" v-model="patient.ageYears" outlined></v-text-field>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field label="Months" v-model="patient.ageMonths" outlined></v-text-field>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field label="Weeks" v-model="patient.ageWeeks" outlined></v-text-field>
                  </v-col>
                </v-row>
                <v-text-field label="Days" v-model="patient.ageDays" outlined></v-text-field>
                <v-select :items="['Male', 'Female', 'Other']" label="Sex" v-model="patient.sex" outlined></v-select>
                <v-menu
                  ref="menu2"
                  v-model="menu2"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  lazy
                  transition="scale-transition"
                  offset-y
                  full-width
                  min-width="290px"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="patient.scheduledDate"
                      label="Scheduled Date"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-bind="attrs"
                      v-on="on"
                      outlined
                    ></v-text-field>
                  </template>
                  <v-date-picker v-model="patient.scheduledDate" no-title @input="menu2 = false"></v-date-picker>
                </v-menu>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="4">
          <v-card>
            <v-card-title>Exam</v-card-title>
            <v-card-text>
              <v-form>
                <v-text-field label="Accession" v-model="exam.accession" outlined></v-text-field>
                <v-text-field label="Exam Description" v-model="exam.description" outlined></v-text-field>
                <v-text-field label="SPS Description" v-model="exam.spsDescription" outlined></v-text-field>
                <v-text-field label="Procedure ID" v-model="exam.procedureId" outlined></v-text-field>
                <v-text-field label="Operator Last Name" v-model="exam.operatorLastName" outlined></v-text-field>
                <v-text-field label="Operator First Name" v-model="exam.operatorFirstName" outlined></v-text-field>
                <v-text-field label="Radiologist Last Name" v-model="exam.radiologistLastName" outlined></v-text-field>
                <v-text-field
                  label="Radiologist First Name"
                  v-model="exam.radiologistFirstName"
                  outlined
                ></v-text-field>
                <v-text-field
                  label="Referring Physician Last Name"
                  v-model="exam.referringPhysicianLastName"
                  outlined
                ></v-text-field>
                <v-text-field
                  label="Referring Physician First Name"
                  v-model="exam.referringPhysicianFirstName"
                  outlined
                ></v-text-field>
                <v-text-field label="Protocol" v-model="exam.protocol" outlined></v-text-field>
                <v-select
                  :items="favoriteProtocols"
                  label="Favorite Protocols"
                  v-model="exam.favoriteProtocol"
                  outlined
                ></v-select>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="4">
          <v-card>
            <v-card-title>Other Information</v-card-title>
            <v-card-text>
              <p>
                This is patient sensitive information, please adhere to patient confidentiality rules. Please verify the
                information using either the patient's medical record or directly with the patient to guarantee its
                accuracy.
              </p>
              <v-text-field label="Allergies" v-model="otherInfo.allergies" readonly outlined></v-text-field>
              <v-text-field label="Pre-Med" v-model="otherInfo.preMed" readonly outlined></v-text-field>
              <v-select
                :items="['No Entry', 'Yes', 'No']"
                label="Pregnancy Status"
                v-model="otherInfo.pregnancyStatus"
                outlined
              ></v-select>
              <v-textarea label="History" v-model="otherInfo.history" outlined></v-textarea>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col class="text-right">
          <v-btn color="primary">Start Exam</v-btn>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import GEToolbar from './GEToolbar.vue'

export default {
  data() {
    return {
      searchBy: '',
      searchOptions: ['Name', 'ID', 'Date'],
      searchQuery: '',
      tableHeaders: [
        { text: 'Scheduled', align: 'start', value: 'scheduled' },
        { text: 'Name', value: 'name' },
        { text: 'Patient ID', value: 'patientId' },
        { text: 'Accession', value: 'accession' },
        { text: 'SPS Description', value: 'spsDescription' },
        { text: 'Modality', value: 'modality' },
        { text: 'Referring Physician', value: 'referringPhysician' },
        { text: 'Scheduled Date', value: 'scheduledDate' },
        { text: 'Status', value: 'status' },
        { text: 'Local Protocol', value: 'localProtocol' },
        { text: 'Recommendation', value: 'recommendation' },
        { text: 'Caution', value: 'caution' },
      ],
      tableItems: [],
      patient: {
        lastName: '',
        firstName: '',
        id: '',
        weightLb: '',
        weightKg: '',
        dateOfBirth: '',
        ageYears: '',
        ageMonths: '',
        ageWeeks: '',
        ageDays: '',
        sex: '',
        scheduledDate: '',
      },
      exam: {
        accession: '',
        description: '',
        spsDescription: '',
        procedureId: '',
        operatorLastName: '',
        operatorFirstName: '',
        radiologistLastName: '',
        radiologistFirstName: '',
        referringPhysicianLastName: '',
        referringPhysicianFirstName: '',
        protocol: '',
        favoriteProtocol: '',
      },
      otherInfo: {
        allergies: 'NONE',
        preMed: 'NONE',
        pregnancyStatus: 'No Entry',
        history: '',
      },
      favoriteProtocols: ['Protocol 1', 'Protocol 2', 'Protocol 3'],
      menu: false,
      menu2: false,
    }
  },
  components: {
    GEToolbar,
  },
}
</script>

<style scoped>
.v-text-field,
.v-select,
.v-textarea {
  margin-bottom: 16px;
}

.row {
  margin: 0px;
}

.part-3 {
  height: 54%;
  overflow-y: scroll;
}
</style>
