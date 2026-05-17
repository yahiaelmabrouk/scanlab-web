<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div>
    <v-card color="rgb(110 104 104)" width="50vh">
      <v-toolbar dark class="toolbar-1">
        <div>
          <v-toolbar-title>Inroom Settings </v-toolbar-title>
        </div>

        <div>
          <v-icon>mdi-help</v-icon>
          <v-icon>mdi-close</v-icon>
        </div>
      </v-toolbar>

      <v-row>
        <v-card-title>
          <h5></h5>
        </v-card-title>
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

.main {
  display: flex;
}

::v-deep .v-slider--horizontal .v-slider__track-container {
  width: 63%;
}
.toolbar-1 {
  display: flex !important;
  justify-content: space-between;
  color: white;
}

.v-card-title {
  color: white;
}

::v-deep .v-slider__thumb {
  border-radius: 0px !important;
}

::v-deep .v-toolbar__content {
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
