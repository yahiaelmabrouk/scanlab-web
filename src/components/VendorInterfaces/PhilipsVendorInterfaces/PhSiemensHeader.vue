<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div>
    <v-toolbar dark style="height: 6.7vh">
      <h4>Logo</h4>

      <img src="/home.png" height="48%" />
      <img src="/note.png" height="48%" />
      <img src="/p-magnify.png" height="59%" />

      <v-spacer></v-spacer>
      <img src="/help.png" height="45%" />
      <img src="/computer.png" height="45%" />
      <img src="/header-icon2.png" height="45%" />

      <img src="/setting.png" height="45%" />
      <img src="/bag.png" height="45%" />
      <img src="/video.png" height="48%" />
      <img src="/cart.png" height="48%" />

      <v-icon>mdi-account-circle</v-icon>
    </v-toolbar>
  </div>
</template>

<style scoped>
.nav-1 {
  display: flex;
  justify-content: space around;
}

img {
  margin: 0.5%;
}
</style>
