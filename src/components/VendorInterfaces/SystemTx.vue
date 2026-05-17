<template>
  <!-- <v-card color="rgb(46 44 44)" width="100%" height="100%">
    <v-card-text>
      <div class="main-1">
        <div class="main-2">
          <div class="text-1">
            <label class="label-size">Transmitter</label>
          </div>
          <div class="text-1">
            <label class="label-size">Frequency 1H</label>
            <v-text-field type="number" variant="outlined" density="compact" width="30px"></v-text-field
            ><span>MHz</span>
          </div>

          <div class="text-1">
            <v-btn class="btn-size">Tx Ref[Nucleus]</v-btn>
            <v-btn class="btn-size">Amplitude[V]</v-btn>
            <v-btn class="btn-2">...</v-btn>
          </div>

          <div class="text-1 btn-size">
            <v-btn>?Ref.Amplitude 1H</v-btn>
            <v-text-field type="number" variant="outlined" density="compact" width="30px"></v-text-field>
          </div>
          <div class="text-1">
            <v-btn class="btn-3">Reset</v-btn>
          </div>
          <div class="text-1">
            <label class="label-size"> Correction Factor</label>
            <v-text-field type="number" variant="outlined" density="compact" width="30px"></v-text-field>
          </div>
        </div>

        <div class="main-2">
          <div class="text-1">
            <label class="label-size">Receiver</label>
          </div>
          <div class="text-1">
            <label class="label-size">Image Scaling</label>
            <v-text-field type="number" variant="outlined" density="compact" width="30px"></v-text-field>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card> -->
</template>
<script>
export default {}
</script>
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
.v-btn {
  font-size: 11px !important;
  background: #413e3e !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: 0px;
  border-top: none !important;
  border-right: none !important;
  margin: 0.15rem;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}
.btn-size {
  width: 50px !important;
  height: 25px !important;
  padding: 0px !important;
  min-width: 16px !important;
  font-size: 12% !important;
}
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
.btn-2 {
  width: 30px !important;
  height: 25px !important;
  padding: 0px !important;
  min-width: 16px !important;
  background: #423c3c !important;
  margin: 0.15rem;
  border-radius: 0px;
}
.btn-3 {
  background: rgb(46 44 44) !important;
  border: 1px solid #6b5e5e;
  border-radius: 10px;
  height: 20px !important;
}
::v-deep .v-text-field__details {
  display: none;
}
label {
  font-size: 70%;
}
.v-input--is-focused {
  display: block !important;
}
.text-1 {
  display: flex;
}
::v-deep .v-input--dense > .v-input__control > .v-input__slot {
  margin-bottom: 0px;
}
::v-deep.v-input__slot {
  margin-bottom: 0px;
}
::v-deep.v-text-field.v-text-field--enclosed .v-text-field__details {
  margin-bottom: 0px;
}
.v-text-field {
  padding-top: 0px;
  margin-top: 0px;
}
::v-deep .v-text-field__slot {
  background: #383535;
  border-color: #383535;
  border-radius: 0px;
}

::v-deep .v-input__slot fieldset {
  background: #383535;
  border-color: #383535 !important;
  border-radius: 0px;
}
::v-deep .v-text-field__slot {
  border: 1px solid #383535 !important;
  height: 1.25rem;
  border-bottom: none;
  border-radius: 0px;
}
::v-deep .v-icon.v-icon {
  color: white !important;
}
.v-input {
  max-width: 45%;
}

.main-1 {
  display: flex;
  justify-content: space-around !important;
}

.main-2 {
  color: white !important;
}

.btn-1 {
  display: flex;
  width: 66.75%;
  justify-content: space-between;
}
.custom-container.col-md-9 {
  max-width: 66.6% !important;
  padding: 0 !important;
}
.v-sheet.v-card {
  border-radius: 0px;
}

::v-deep.v-input--selection-controls {
  margin-top: 0px;
  padding-top: 0px;
}
</style>
