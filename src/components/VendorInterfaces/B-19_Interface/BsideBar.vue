<template>
  <div class="side-bar">
    <v-btn
      v-for="(item, index) in menuItems"
      :key="index"
      :class="{
        'selected-item': selectedIndex === index,
        'default-item': selectedIndex !== index,
      }"
      @click="selectedIndex = index"
      outlined
      class="menu-item v-btn1"
    >
      {{ item }}
    </v-btn>
  </div>
</template>
<script>
export default {
  data() {
    return {
      selectedIndex: 0,
      menuItems: ['Exam', 'Viewing', 'Filming', '3D'],
    }
  },
}
</script>
<style scoped lang="scss">
.side-bar {
  transform: rotate(90deg);
  display: flex !important;
}
.v-btn1 {
  padding: 0px 1rem !important;
  height: 20px !important;
  border-color: #ffffff !important;
  background-color: rgb(34, 34, 76) !important;
  color: white !important;
  text-transform: capitalize !important;

  border-radius: 0px;
}
::v-deep .v-btn--active {
  color: white !important;
}
.menu-item {
  background-color: rgb(34, 34, 76) !important;

  color: black !important;
  height: 60px;
  justify-content: center;
  text-transform: capitalize !important;
  border-radius: 0 !important;
  background-color: rgb(34, 34, 76) !important;
}

.selected-item {
  color: white !important;
  font-weight: bold;
  border-top: 1px solid white !important;
  border-left: 1px solid white !important;
  border-right: 1px solid white !important;
  border-bottom: none !important;
}

.default-item {
  border-bottom: 1px solid #fff !important;
  border-top: none;
  border-right: none;
  border-left: none;
}
::v-deep .v-btn:not(.v-btn--round).v-size--default {
  min-width: 157px;
}
</style>
