<template>
  <div class="expand-bar" @click="$emit('toggle-expand')">
    <v-icon color="#ffffff" size="25">{{ iconName }} </v-icon>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['isSidebarExpanded']),
    iconName() {
      return this.isSidebarExpanded ? 'mdi-menu-up' : 'mdi-menu-down'
    },
  },
}
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
@media (min-width: 1706.67px) {
  .expand-bar {
    background: #585151;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0px;
  }
}

@media (max-width: 2304px) {
  .expand-bar {
    background: #585151;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0px;
  }
}

@media (min-width: 1396.36px) {
  .expand-bar {
    background: #585151;
    width: 75%;
    display: flex;
    justify-content: center;
    padding: 0px;
  }
}

@media (min-width: 1706.67px) {
  .expand-bar {
    background: #585151;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0px;
  }
}

@media (min-width: 1536px) {
  .expand-bar {
    background: #585151;
    width: 75%;
    display: flex;
    justify-content: center;
    padding: 0px;
  }
}

@media (max-width: 767px) {
  .expand-bar {
    background: #585151;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 10px;
  }

  .expand-bar v-icon {
    font-size: 0px;
  }
}

/* Tablets and Small Desktops */
@media (min-width: 768px) and (max-width: 1024px) {
  .expand-bar {
    background: #585151;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0px;
  }

  .expand-bar v-icon {
    font-size: 22px;
  }
}

@media (min-width: 1025px) {
  .expand-bar {
    background: #585151;
    width: 75%;
    display: flex;
    justify-content: center;
    padding: 0px;
  }

  .expand-bar v-icon {
    font-size: 25px;
  }
}
</style>
