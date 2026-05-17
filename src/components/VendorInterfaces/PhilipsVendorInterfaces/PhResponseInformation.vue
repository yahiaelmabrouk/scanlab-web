<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="toolbar-cls">
    <!-- Any Icon -->
    <div class="sarPns">
      <span class="sarleft">
        <span><v-icon class="battery">mdi-battery-30</v-icon></span>
        <span style="display: flex; flex-direction: column">
          <span>SAR</span>
          <span class="rightRes">
            <span>
              <v-icon> mdi-code-less-than </v-icon>
            </span>
            <span>0.5</span>
            <span>W/kg <v-icon>mdi-arrow-down</v-icon></span>
          </span>
        </span>
      </span>
      <span class="rightInfo">
        <span><v-icon class="battery">mdi-battery-60</v-icon></span>
        <span style="display: flex; flex-direction: column; align-items: baseline">
          <span>PNS</span>
          <span class="rightRes">
            <span>55</span>
            <span>%<v-icon>mdi-arrow-down</v-icon></span>
          </span>
        </span>
      </span>
    </div>
    <!-- SNR Fields -->
    <!-- <div v-if="!isTakingTest" class="snr-section d-flex">
      <div class="snr-field mr-4">
        <label style="font-size: 10px; color: white">SNR Average</label>
        <div class="d-flex align-items-center">
          <input
            :value="selectionConfig && selectionConfig.snr !== null ? selectionConfig.snr.toFixed(2) : '---'"
            type="text"
            disabled
            class="snr-input"
            style="
              width: 50px;
              height: 20px;
              font-size: 10px;
              background: #333;
              color: white;
              border: 1px solid #555;
              text-align: right;
            "
          />
          <v-btn
            icon
            class="snr-icon-btn"
            @click="fetchSignalAverage"
            :disabled="isFetchingSignalAverage"
            title="Refresh SNR average"
            style="margin-left: 8px; min-width: 28px; width: 28px; height: 28px"
          >
            <v-icon small>{{ isFetchingSignalAverage ? 'mdi-loading mdi-spin' : 'mdi-refresh' }}</v-icon>
          </v-btn>
          <v-btn
            icon
            class="snr-icon-btn"
            @click="saveSNR"
            :disabled="!selectionConfig || selectionConfig.snr === null"
            title="Save current SNR for comparison"
            style="margin-left: 8px; min-width: 28px; width: 28px; height: 28px"
          >
            <v-icon small>mdi-content-save</v-icon>
          </v-btn>
        </div>
      </div>
      <div class="snr-field">
        <label style="font-size: 10px; color: white">Saved SNR</label>
        <input
          :value="savedSnr !== null ? savedSnr.toFixed(2) : '---'"
          type="text"
          disabled
          class="snr-input"
          style="
            width: 50px;
            height: 20px;
            font-size: 10px;
            background: #333;
            color: white;
            border: 1px solid #555;
            text-align: right;
          "
        />
      </div>
    </div> -->
    <span class="rightRes">
      <span style="text-align: justify; padding-left: 2%">
        <v-btn width="15px" height="20px" style="min-width: 15px">
          <v-icon style="font-size: 14px">mdi-undo-variant</v-icon>
        </v-btn>
      </span>
      <span>
        <v-btn
          block
          outlined
          class="add-btn"
          style="background: #d5d7d7; width: 5rem; border-right: 1px solid white; margin-left: 2px"
          @click="cancelChanges"
        >
          Cancel
        </v-btn>
      </span>
    </span>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'

export default {
  data() {
    return {
      dropdownOptions: ['Option 1', 'Option 2', 'Option 3'],
      savedSnr: null,
      isFetchingSignalAverage: false,
    }
  },
  computed: {
    ...mapGetters('selectionConfig', ['dotScaleValues']),
    ...mapState('selectionConfig', ['selectionConfigsByIdent', 'selectionConfigCurrentIdent']),
    ...mapGetters('testRunService', ['isTakingTest']),
    // ...mapState('scanTimeConfig', ['formData', 'isEditable']),
    selectionConfig() {
      return this.selectionConfigsByIdent && this.selectionConfigCurrentIdent
        ? this.selectionConfigsByIdent[this.selectionConfigCurrentIdent]
        : null
    },
  },
  methods: {
    ...mapActions('scanTimeConfig', ['cancelChanges']),
    // handleInput(key, value) {
    //   if (this.isEditable) {
    //     this.updateField({ key, value })
    //   }
    // },
    handleIconClick(iconName) {
      // Implement functionality for each icon click
      console.log(`Clicked on icon: ${iconName}`)
    },
    handleDropdownOptionClick(option) {
      // Implement functionality for dropdown option click
      console.log(`Selected dropdown option: ${option}`)
    },
    async fetchSignalAverage() {
      this.isFetchingSignalAverage = true
      try {
        const result = await this.$store.dispatch('dicomService/fetchSignalAverageOnly', {
          selectionConfig: this.selectionConfig,
        })

        if (this.selectionConfig.sequenceType === 'DIFF' && Array.isArray(result)) {
          // For DIFF sequences, store the array of signal averages
          this.$store.dispatch('selectionConfig/setBSignalAverages', {
            bSignalAverages: result,
            ident: this.selectionConfigCurrentIdent,
          })
          // Also set the first value as the main signalAverage for backward compatibility
          this.$store.dispatch('selectionConfig/setSignalAverage', {
            signalAverage: result[0]?.signalAverage || null,
            ident: this.selectionConfigCurrentIdent,
          })
          this.$store.dispatch('selectionConfig/setSignalAverageHalfTR', {
            signalAverageHalfTR: result[0]?.signalAverageHalfTR || null,
            ident: this.selectionConfigCurrentIdent,
          })
        } else {
          // For non-DIFF sequences, store as single value
          this.$store.dispatch('selectionConfig/setSignalAverage', {
            signalAverage: result?.signalAverage || result,
            ident: this.selectionConfigCurrentIdent,
          })
          this.$store.dispatch('selectionConfig/setSignalAverageHalfTR', {
            signalAverageHalfTR: result?.signalAverageHalfTR || null,
            ident: this.selectionConfigCurrentIdent,
          })
          // Clear bSignalAverages array
          this.$store.dispatch('selectionConfig/setBSignalAverages', {
            bSignalAverages: [],
            ident: this.selectionConfigCurrentIdent,
          })
        }
      } catch (error) {
        console.error('Error fetching signal average:', error)
      } finally {
        this.isFetchingSignalAverage = false
      }
    },
    saveSNR() {
      if (this.selectionConfig && this.selectionConfig.snr !== null) {
        this.$store.dispatch('selectionConfig/setSavedSnr', {
          savedSnr: this.selectionConfig.snr,
          ident: this.selectionConfigCurrentIdent,
        })
        this.savedSnr = this.selectionConfig.snr
        this.$notify({ type: 'success', text: 'SNR saved for comparison' })
      }
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
  height: 23px !important;
  align-content: right !important;
  font-size: 9px !important;
  min-width: 25px !important;
  padding: 0 8px !important;
  background: white;
  margin-left: auto;
}
.rightRes {
  display: flex;
  align-items: baseline;
}
.rightInfo {
  display: flex;
  padding-right: 5.5rem;
}
.sarleft {
  display: flex;
  border-left: 1px solid;
  margin-left: 25%;
}
.sarPns {
  display: flex;
  justify-content: flex-start;
  /* margin-left: 20%; */
  width: 21%;
}

.snr-section {
  display: flex;
  align-items: center;
  margin: 0 20px;
}

.snr-field {
  display: flex;
  flex-direction: column;
}

.snr-input {
  background: #333;
  color: white;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 2px 5px;
  text-align: right;
}

.snr-icon-btn {
  background: black !important;
  border: none !important;
  width: auto !important;
}

.snr-icon-btn .v-icon {
  color: white !important;
}

.snr-icon-btn:disabled .v-icon {
  color: #888 !important;
}
@media only screen and (max-width: 1240px) {
  .toolbar-cls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #676866;

    color: white;

    font-size: 10px;
    width: 100%;
    flex-direction: row;
  }
  .rightRes {
    display: flex;
    align-items: baseline;
    /* width: 6rem; */
  }
  .rightInfo {
    display: flex;
    padding-right: 0px;
    width: 5rem;
  }
}
@media only screen and (min-width: 1241px) {
  .toolbar-cls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #676866;
    height: 56px;
    color: white;

    font-size: 10px;
    width: 100%;
    flex-direction: row;
    font-size: 12px;
  }
  .rightRes {
    display: flex;
    align-items: baseline;
    /* width: 6rem; */
  }
  .rightInfo {
    display: flex;
    padding-right: 1rem;
  }
  .battery {
    font-size: 20px;
    margin-top: 1rem;
  }
}
@media (min-width: 1300px) and (max-width: 2490px) {
  .sarleft {
    margin-left: 0%;
  }
  .sarPns {
    width: 55%;
  }
}
/* @media (min-width: 1601px) and (max-width: 1800px) {
  .sarleft {
    margin-left: 0%;
  }
  .sarPns {
    width: 35%;
  }
} */
</style>
