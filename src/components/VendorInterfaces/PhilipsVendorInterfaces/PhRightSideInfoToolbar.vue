<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="toolbar-cls">
    <!-- Any Icon -->
    <span style="display: flex; flex-direction: column; border-right: 1px solid white; padding-right: 3.5rem">
      <span>T2_TRA</span>
      <span style="display: flex">
        <span>03:33</span>
        <span><v-icon>mdi-arrow-up</v-icon></span>
      </span>
    </span>

    <span style="text-align: justify; padding-left: 1rem">
      <span style="display: flex; justify-content: start; flex-direction: column; width: 11.3rem">
        <span style="display: flex"> <span>Voxel</span><span>Tra</span> </span>
        <span style="text-align: justify">0.60 x 0.73 x 5.00</span>
      </span>
    </span>

    <v-btn width="15px" height="20px" style="min-width: 15px">
      <v-icon style="font-size: 14px">mdi-undo-variant</v-icon>
    </v-btn>
    <v-btn
      block
      outlined
      class="add-btn"
      style="background: #d5d7d7; width: 5rem; border-right: 1px solid white; margin-left: 2px"
    >
      Accept
    </v-btn>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      dropdownOptions: ['Option 1', 'Option 2', 'Option 3'],
    }
  },
  computed: {
    ...mapGetters('selectionConfig', ['dotScaleValues']),
  },
  methods: {
    handleIconClick(iconName) {
      // Implement functionality for each icon click
      console.log(`Clicked on icon: ${iconName}`)
    },
    handleDropdownOptionClick(option) {
      // Implement functionality for dropdown option click
      console.log(`Selected dropdown option: ${option}`)
    },
  },
}
</script>

<style scoped>
/* Add your styling for the toolbar, icons, and separators here */

.toolbar-cls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #676866;
  padding: 1.5rem 1rem 1.5rem 1rem;
  color: white;
  height: 39px;
  width: 100%;
}

.icon-btn {
  margin-right: 0.5rem;
}

.icon-size {
  height: 12px;
  font-size: 17px;
}

.separator {
  margin: 0 0.5rem;
  color: white;
}

.dropdown {
  width: 100px;
  /* Adjust the width as needed */
}

.add-btn {
  height: 17px !important;
  align-content: right !important;
  font-size: 9px !important;
  min-width: 25px !important;
  padding: 0 8px !important;
  background: white;
  margin-left: auto;
}
</style>
