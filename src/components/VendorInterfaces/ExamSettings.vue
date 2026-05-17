<template>
  <div>
    <v-card color="rgb(110 104 104)" width="25vw">
      <v-toolbar dark class="toolbar-1">
        <div>
          <v-toolbar-title>Exam Settings </v-toolbar-title>
        </div>

        <div>
          <v-icon>mdi-help</v-icon>
          <v-icon>mdi-close</v-icon>
        </div>
      </v-toolbar>

      <v-row>
        <v-card-title>
          <h5>Table Move</h5>

          <v-col class="flex">
            <v-checkbox label="Show Notification"> </v-checkbox>
          </v-col>
        </v-card-title>
      </v-row>

      <h4>Automatic Voice Commands</h4>

      <v-row>
        <v-card-text>
          <v-col class="exam-2">
            <h3>Command Language</h3>

            <v-select dense outlined> </v-select>
          </v-col>
          <v-row>
            <v-col class="main">
              <div class="icons">
                <v-icon size="30">mdi-play</v-icon>
                <span>Play</span>
              </div>
              <div class="icons">
                <v-icon size="30">mdi-stop</v-icon>
                <span>Stop</span>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col class="exam-2">
              <h4 style="margin: 6px">Playback</h4>
              <v-slider width="63%" prepend-icon="mdi-volume-high"> </v-slider>
            </v-col>
          </v-row>
        </v-card-text>
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
