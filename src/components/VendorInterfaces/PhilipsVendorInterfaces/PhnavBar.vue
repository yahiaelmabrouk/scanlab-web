<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <v-card>
    <v-toolbar density="compact" height="25px">
      <v-btn><u>P</u>atient</v-btn>
      <v-btn><u>E</u>xamination</v-btn>
      <v-btn><u>R</u>eview</v-btn>
      <v-btn><u>A</u>nalysis</v-btn>
      <v-btn><u>S</u>ystem</v-btn>
      <v-btn>P<u>H</u>elp</v-btn>
    </v-toolbar>
  </v-card>
</template>

<style scoped lang="scss">
.v-sheet,
v-card {
  height: 25px !important;
  background: black !important;
  border-radius: 0px !important;
}

::v-deep .v-toolbar__content,
.v-toolbar__extension {
  padding: 0px 0px !important;
  background: black !important;
}
.v-btn {
  padding: 0px 3px !important;
  height: 20px !important;
  background: black !important;
  color: white !important;
  font-size: 10px !important;
  border-radius: 0px !important;
  text-transform: inherit !important;
}
</style>
