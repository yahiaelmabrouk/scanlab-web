<template></template>

<script></script>

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
.v-btn {
  font-size: 11px !important;
  background: black !important;
  color: #ffffff !important;
  border: 1px solid #5a5252;
  border-radius: none;
  border-top: none !important;
  border-right: none !important;
  width: 18.75%;
}
.v-input--is-focused {
  display: block !important;
}
label,
span {
  font-size: 70%;
}
.text-input {
  max-width: 38%;
  width: 38%;
  margin-left: 2%;
  background: #383535;
  border-radius: 0px !important;
  border: 1px solid #383535 !important;
  height: 25px !important;
  border-bottom: none;
}
::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}
.label-size {
  width: 40%;
  display: flex;
  justify-content: right;
}
::v-deep .v-card__text {
  height: 100% !important;
  position: absolute !important;
  top: 0px !important;
  bottom: 0 !important;
}
::v-deep .v-text-field__details {
  display: none;
}
.text-1 {
  display: flex;
  justify-content: flex-start;
  color: white !important;
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
::v-deep .v-text-field {
  padding-top: 0px;
  margin-top: 0px !important;
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
  height: 1rem;
  border-bottom: none;
  border-radius: 4px;
}
::v-deep .v-input__icon {
  height: 10px !important;
}
::v-deep .v-icon.v-icon {
  color: white !important;
}
.v-input {
  max-width: 45%;
}
::v-deep .v-text-field input {
  padding: 0px;
}

::v-deep .v-text-field--outlined fieldset {
  bottom: 15px !important;

  right: 10px;
  top: -2px !important;
}

/* .main-1 {
  display: flex;
  height: 33vh;
  justify-content: space-around;
}

.main-2 {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 35%;
}
.main-3 {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 50%;
} */
.main-1 {
  display: flex;
  justify-content: space-around;
}

.main-2 {
  color: white !important;
  width: 50%;
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
::v-deep .theme--light.v-select .v-select__selections {
  color: white !important;
}
::v-deep .theme--light.v-input input {
  color: white;
  font-size: small;
  text-align: right;
}

/* Responsive CSS */
@media (max-width: 1200px) {
  .text-input {
    max-width: 48%;
    width: 48%;
  }
  .label-size {
    width: 45%;
  }
  .v-input {
    max-width: 55%;
  }
  .main-1 {
    flex-direction: column;
    height: auto;
  }
  .main-2,
  .main-3 {
    width: 100%;
    justify-content: space-evenly;
  }
}

@media (max-width: 768px) {
  .text-input {
    max-width: 60%;
    width: 60%;
  }
  .label-size {
    width: 50%;
  }
  .v-input {
    max-width: 70%;
  }
  .main-1 {
    flex-direction: column;
  }
  .text-1 {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .text-input {
    max-width: 80%;
    width: 80%;
  }
  .label-size {
    width: 60%;
  }
  .v-input {
    max-width: 90%;
  }
  .text-1 {
    flex-direction: column;
    justify-content: center;
    text-align: left;
  }
  .main-1 {
    flex-direction: column;
    height: auto;
    justify-content: center;
  }
}
</style>
