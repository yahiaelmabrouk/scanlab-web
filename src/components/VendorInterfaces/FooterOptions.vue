<template>
  <div style="height: 100%">
    <div class="toolbar">
      <div class="icon-group">
        <div class="icon-item">
          <img src="@/assets/siemens_img/1st.png" alt="Inroom Settings Icon" class="icon-image" />
          <p>Inroom Settings</p>
        </div>
        <div class="icon-item">
          <img src="@/assets/siemens_img/2nd.png" alt="Exam Settings Icon" class="icon-image" />
          <p>Exam Settings</p>
        </div>
        <div class="icon-item">
          <img src="@/assets/siemens_img/3rd.png" alt="Physio Display Icon" class="icon-image" />
          <p>Physio Display</p>
        </div>
        <div class="icon-item">
          <img src="@/assets/siemens_img/4th.png" alt="Inline Display Icon" class="icon-image" />
          <p>Inline Display</p>
        </div>
        <div class="icon-item">
          <img src="@/assets/siemens_img/5th.png" alt="myExam Cockpit Icon" class="icon-image" />
          <p>myExam Cockpit</p>
        </div>
      </div>
      <div class="status-group">
        <div class="status-item">
          <label>SAR</label>
          <div class="status-bar">
            <div class="status-indicator"></div>
          </div>
          <p @click="toggleSAR">{{ sarMode }} <v-icon>mdi-menu-down</v-icon></p>
          <p class="ml-4">Normal Mode</p>
        </div>
        <div class="status-item">
          <label>Stimu</label>
          <div class="status-bar">
            <div class="status-indicator"></div>
          </div>
          <p @click="toggleStimu">{{ stimuMode }} <v-icon>mdi-menu-down</v-icon></p>
          <p class="ml-4">Normal Mode</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState(['sarMode', 'stimuMode']),
  },
  methods: {
    ...mapActions(['toggleSARMode', 'toggleStimuMode']),
    toggleSAR() {
      this.toggleSARMode()
    },
    toggleStimu() {
      this.toggleStimuMode()
    },
  },
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #000;
  padding: 10px;
  color: white;
  width: 100%;
}

label {
  margin-bottom: 0;
}

.icon-group {
  display: flex;
  justify-content: space-between;
  flex-grow: 1; /* Adjust spacing between icons */
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 10px;
}

.icon-image {
  width: 24px;
  height: 24px;
  margin-bottom: 5px;
}

.v-icon.v-icon {
  color: white !important;
  font-size: 17px !important;
  height: 8px;
  margin-left: 40%;
}

.status-group {
  display: flex;
  align-items: center;
}

.status-item {
  margin-left: 20px;
  text-align: center;
}

.status-bar {
  width: 100px;
  height: 10px;
  background-color: #444;
  margin: 5px 0;
  position: relative;
}

.status-indicator {
  width: 50%;
  height: 100%;
  background-color: green;
}

p {
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 70%;
}

/* Responsive Design */

/* Extra Large Screens (1536px and above) */
@media (min-width: 1400px) and (max-width: 1920px) {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #000;
    padding: 2px;
    color: white;
  }

  .icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 0px;
  }

  .status-item {
    margin-left: 25px;
    text-align: center;
  }

  label {
    font-size: 75%;
  }

  .status-bar {
    width: 100%;
    height: 4px;
    margin: 0;
    position: relative;
  }
}

/* Large Screens (1920px to 2486px) */
@media (min-width: 1920px) and (max-width: 2490px) {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #000;
    padding: 2px;
    color: white;
  }

  .sidebar {
    height: 107% !important;
  }
}

/* Medium to Large Screens (1025px to 1919px) */
@media (min-width: 1024px) and (max-width: 1399px) {
  .icon-image {
    width: 20px;
    height: 20px;
  }

  .icon-item p {
    font-size: 12px; /* Adjust font size for smaller screens */
  }

  .v-icon.v-icon {
    font-size: 15px !important; /* Resize the dropdown icon */
  }

  .status-bar {
    width: 80px; /* Adjust status bar size */
  }

  .status-item p {
    font-size: 12px; /* Smaller font size for status items */
  }
  label {
    font-size: 75%;
  }
  .status-bar {
    width: 100%;
    height: 4px;
    margin: 0;
    position: relative;
  }
}

/* Tablets and Small Devices (769px to 1024px) */
@media (max-width: 768px) {
  .icon-image {
    width: 18px;
    height: 18px;
  }

  .icon-item p {
    font-size: 11px;
  }

  .v-icon.v-icon {
    font-size: 13px !important;
  }

  .status-bar {
    width: 70px;
  }

  .status-item p {
    font-size: 11px;
  }
}

/* Mobile Devices (Portrait and Landscape, up to 480px) */
@media (max-width: 480px) {
  .icon-image {
    width: 16px;
    height: 16px;
  }

  .icon-item p {
    font-size: 10px;
  }

  .v-icon.v-icon {
    font-size: 11px !important;
  }

  .status-bar {
    width: 60px;
  }

  .status-item p {
    font-size: 10px;
  }
}
</style>
