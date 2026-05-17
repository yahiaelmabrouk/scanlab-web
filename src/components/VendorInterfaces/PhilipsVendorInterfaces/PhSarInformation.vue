<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div>
    <v-card color="rgb(110 104 104)" width="60vw">
      <v-toolbar dark class="toolbar-1">
        <div>
          <v-toolbar-title>SAR Information </v-toolbar-title>
        </div>

        <div>
          <v-icon>mdi-help</v-icon>
          <v-icon>mdi-close</v-icon>
        </div>
      </v-toolbar>

      <v-row>
        <v-card-title>
          <h5>SAR Monitor Operating Mode</h5>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col>
              <h4>Current Measurement</h4>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="data-1">
              <h4>Next Measurement</h4>
              <v-radio-group>
                <v-radio label="Normal Mode" value="1"></v-radio>
                <v-radio label="First Level" value="2"></v-radio>
              </v-radio-group>
            </v-col>
          </v-row>
        </v-card-text>
      </v-row>
      <v-row>
        <v-col class="btn-grp">
          <v-btn>Prediction</v-btn>
          <v-btn>Status</v-btn>
          <v-btn>Patient</v-btn>
          <v-btn>Protocol</v-btn>
          <v-btn>Current</v-btn>
        </v-col>
      </v-row>

      <v-footer dark class="footer-1">
        <v-btn rounded>Close</v-btn>
      </v-footer>
    </v-card>
  </div>
</template>

<style scoped>
.exam-2 {
  display: flex;
}

.icons {
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  margin-left: 5%;
}

.btn-grp {
  display: flex;
  width: 100%;
  justify-content: space-evenly;
}

.main {
  display: flex;
}
.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}
.data-1 {
  display: flex;
}

.toolbar-1 {
  display: flex !important;
  justify-content: space-between;
  color: white;
}

.v-card-title {
  color: white;
}

.v-toolbar__content {
  display: flex;
  justify-content: space-between;
}
.v-btn {
  border: 1px solid;
}

.footer-1 {
  display: flex;
  justify-content: center;
}
</style>
