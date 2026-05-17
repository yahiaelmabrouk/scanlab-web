<template>
  <div style="background: #c0c0bf">
    <v-row justify="center">
      <v-col cols="12" class="text-center pb-0" style="padding: 0px; margin-top: 1%">
        <img src="@/assets/siemens_img/b19systemCoil.png" class="body-image" />
      </v-col>
    </v-row>

    <!-- First Row of Buttons (HE2, HE4, NE2) -->
    <v-row class="button-row ml-10">
      <button
        v-for="(button, index) in row1Buttons"
        :key="index"
        class="retro-button"
        :class="{ active: isActiveButton(button) }"
        @click="toggleButton(button)"
      >
        {{ button }}
      </button>
    </v-row>

    <!-- Second Row of Buttons (SP1 - SP8) -->
    <v-row class="button-row ml-16 secRow">
      <button
        v-for="(button, index) in row2Buttons"
        :key="index"
        class="retro-button"
        :class="{ active: isActiveButton(button) }"
        @click="toggleButton(button)"
      >
        {{ button }}
      </button>
    </v-row>

    <!-- Body Button -->
    <v-row class="body-button-row ml-3">
      <button class="retro-button body-button">Body</button>
    </v-row>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      row1Buttons: ['HE2', 'HE4', 'NE2'],
      row2Buttons: ['SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SP6', 'SP7', 'SP8'],
    }
  },
  computed: {
    ...mapState('scanTimeConfig', ['activeButtons']),
  },
  methods: {
    ...mapActions('scanTimeConfig', ['updateActiveButtons']),

    toggleButton(button) {
      let updatedButtons = [...this.activeButtons]
      if (updatedButtons.includes(button)) {
        updatedButtons = updatedButtons.filter((b) => b !== button)
      } else {
        updatedButtons.push(button)
      }
      this.updateActiveButtons(updatedButtons)
    },

    isActiveButton(button) {
      return this.activeButtons.includes(button)
    },
  },
}
</script>

<style scoped>
.v-card-text {
  padding: 0;
  margin: 0;
}
.secRow {
  padding-left: 9%;
}
.v-card {
  background-color: #c0c0c0;
  border: 1px solid black;
  padding: 20px;
  box-shadow: none !important; /* Remove box-shadow completely */
  outline: none !important;
}

.no-shadow-card {
  box-shadow: none !important; /* Strongly ensures no shadow */
}

.body-image {
  max-width: 60%;
  margin-bottom: 0px;
}

.button-row {
  display: flex;
  justify-content: flex-start;
  gap: 0.9px;
  margin-bottom: 0px;
}

.retro-button {
  background-color: #d3d3d3;
  font-size: 12px;
  text-align: center;
  color: black;
  width: 50px;
  height: 25px;
  cursor: pointer;
  border: none;

  /* 3D Border Styling */
  border-top: 2px solid white;
  border-left: 2px solid white;
  border-bottom: 2px solid black;
  border-right: 2px solid black;

  transition: all 0.2s ease;
}

.retro-button.active {
  background-color: #ffffff;
  border-top: 2px solid black;
  border-left: 2px solid black;
  border-bottom: 2px solid white;
  border-right: 2px solid white;
}

.retro-button:active {
  background-color: #b0b0b0;
  border-top: 2px solid black;
  border-left: 2px solid black;
  border-bottom: 2px solid white;
  border-right: 2px solid white;
}

.body-button {
  width: 165px;
  color: red;
}

::v-deep .v-sheet.v-card:not(.v-sheet--outlined) {
  box-shadow: none !important; /* Completely disables any Vuetify box-shadow */
}
/* @media (min-width:2305px) and (max-width: 2490px) {
::v-deep .mt-8 {
    margin-top: 0px !important;
}
} */
@media (min-width: 1400px) and (max-width: 1536px) {
  .body-image {
    max-width: 80%;
    height: 60%;
    filter: grayscale(100%);
    margin: 0% 0% 0% 9%;
  }
}
@media (min-width: 1536px) and (max-width: 2490px) {
  .body-image {
    max-width: 56%;
    height: 80%;
    filter: grayscale(100%);
    margin: 0% 0% 0% 9%;
  }
}
</style>
