<template>
  <div class="patient-record">
    <div class="section patient-buttons">
      <div class="header">Patient Record</div>
      <div class="content-flex" style="gap: 10px">
        <button class="large-button"><v-icon size="36px">mdi-account-multiple-plus</v-icon></button>
        <button class="large-button"><v-icon size="36px">mdi-account-edit</v-icon></button>
        <button class="large-button"><v-icon size="36px">mdi-account-multiple</v-icon></button>
        <button class="large-button"><v-icon size="36px">mdi-account-remove</v-icon></button>
      </div>
    </div>
    <div class="section view-options">
      <div class="header">View</div>
      <div class="content-flex-col">
        <div class="content-flex">
          <label><input type="checkbox" checked /> In Progress</label>
          <label><input type="checkbox" checked /> Details</label>
        </div>
        <label><input type="checkbox" /> Completed</label>
      </div>
    </div>
    <div class="section find">
      <div class="header">Find</div>
      <div class="content-flex-col">
        <v-select v-model="searchBy" :items="['Name']"></v-select>
        <v-text-field placeholder="Last" v-model="lastName"></v-text-field>
        <v-text-field placeholder="First" v-model="firstName"></v-text-field>
      </div>
    </div>
    <div class="section search-refresh">
      <div class="header">Search/Refresh</div>
      <div class="content-flex-col">
        <span>Last Refreshed Time: 29 Apr, 03:09:05</span>
        <div class="content-flex">
          <button @click="searchData">Search Data</button>
          <button><v-icon>mdi-sync</v-icon></button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'GEToolbar',
  data() {
    return {
      searchBy: 'Name',
      lastName: '',
      firstName: '',
    }
  },
  methods: {
    searchData() {
      console.log(`Searching for ${this.firstName} ${this.lastName} by ${this.searchBy}`)
    },
  },
}
</script>
<style scoped>
.patient-record {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  background-color: #3b3f56;
  padding: 10px;
  color: white;
  font-family: Arial, sans-serif;
  width: 100%;
}

.section {
  border: 1px solid #5a5e78;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: #3b3f56;
  color: white;
}

.header {
  font-weight: bold;
  margin-bottom: 10px;
}

.patient-buttons,
.view-options,
.find,
.search-refresh {
  flex: 1;
  min-width: 200px;
}

.patient-buttons .btn,
.search-refresh button {
  background-color: #5a5e78;
  border: none;
  padding: 10px;
  cursor: pointer;
  color: white;
  margin-right: 5px;
}

.view-options label,
.find label {
  display: block;
  margin-bottom: 5px;
}

.find select,
.find input {
  margin-right: 5px;
  padding: 5px;
}

.search-refresh {
  display: flex;
  align-items: left;
}

.content-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.content-flex-col {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.search-refresh button {
  background-color: #5a5e78;
  border: none;
  padding: 10px;
  cursor: pointer;
  color: white;
}
.large-button {
  padding: 12px;
  font-size: 24px;
}
</style>
