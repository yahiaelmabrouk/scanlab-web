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
/* dropdown background style */
.theme--light.v-select .v-select__selections {
  color: white !important;
  font-size: small;
  margin: 0px 2px 4px 3px;
}
.theme--light.v-list {
  background: #565656;
  color: rgb(0 0 0 / 87%);
}
.theme--light.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: rgb(255 255 255 / 87%);
}
.theme--light.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) {
  color: rgb(255 255 255 / 87%);
}
::v-deep .v-application .primary--text {
  color: #ffffff !important;
  caret-color: #ffffff !important;
}
::v-deep .v-list-item__title {
  color: #ffffff !important;
}
::v-deep .v-list-item--link:before {
  background-color: lightgray !important;
}
.active-list-item {
  background-color: darkgray;
}

/* dropdown background style */
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

>>> .v-slider--horizontal .v-slider__track-container {
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

>>> .v-slider__thumb {
  border-radius: 0px !important;
}

>>> .v-toolbar__content {
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
