<template>
  <v-app style="background-color: #6875a2; z-index: 3">
    <v-container fluid>
      <v-row class="mt-2">
        <v-col cols="3" style="background-color: #343579">
          <v-tabs v-model="activeTab" background-color="#0d1b47" dark vertical>
            <v-tab v-for="(item, index) in sidebarItems" :key="index" style="color: black">
              {{ item }}
            </v-tab>
          </v-tabs>
        </v-col>
        <v-col cols="9">
          <v-row v-if="activeTab === 0">
            <v-col cols="9" class="main-content">
              <v-card class="mx-auto" max-width="400">
                <v-card-title class="headline">Service Desktop Manager</v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="6">
                      <v-btn class="mb-2" color="primary" block>Lock Screen Switch User</v-btn>
                    </v-col>
                    <v-col cols="6">
                      <v-btn class="mb-2" color="primary" block>User Accounts</v-btn>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="6">
                      <v-btn class="mb-2" color="primary" block>TIP Virtual Assist</v-btn>
                    </v-col>
                    <v-col cols="6">
                      <v-btn class="mb-2" color="primary" block>Diagnostics</v-btn>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="6">
                      <v-btn class="mb-2" color="primary" block>Image Snap...</v-btn>
                    </v-col>
                    <v-col cols="6">
                      <v-btn class="mb-2" color="primary" block>Guided Install</v-btn>
                    </v-col>
                  </v-row>
                  <v-divider class="my-2"></v-divider>
                  <v-list dense>
                    <v-list-item>
                      <v-list-item-title>G1: FE mode</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>G1: HIS/RIS DICOM</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>G1: Star Share</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>G1: Star GXB</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>G1: Protocol Manager</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>G1: Anonymization Settings</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>G1: Mobility</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>View eTrickTrial Applications</v-list-item-title>
                    </v-list-item>
                  </v-list>
                  <v-btn class="my-2" color="primary" block>Start...</v-btn>
                  <v-btn class="my-2" color="primary" block>Service Browser</v-btn>
                  <v-divider class="my-2"></v-divider>
                  <v-row>
                    <v-col cols="6">
                      <v-btn class="my-2" color="primary" block>TPS Reset</v-btn>
                    </v-col>
                    <v-col cols="6">
                      <v-btn class="my-2" color="primary" block>System Restart</v-btn>
                    </v-col>
                  </v-row>
                  <v-divider class="my-2"></v-divider>
                  <v-row>
                    <v-col cols="6">
                      <v-btn class="my-2" color="primary" block>C Shell...</v-btn>
                    </v-col>
                    <v-col cols="6">
                      <v-btn class="my-2" color="primary" block>Munir Settings...</v-btn>
                    </v-col>
                  </v-row>
                  <v-textarea outlined background-color="white" placeholder="i" rows="2"></v-textarea>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-row v-else-if="activeTab === 1">
            <v-col cols="10" class="main-content">
              <v-card class="full-height-card">
                <v-card-text>
                  <div class="error-text">
                    Failed to restart CoolingTimeMgr. Burst Mode is not available. Please restart the system.
                  </div>
                  <v-spacer></v-spacer>
                  <v-row class="button-row" justify="space-between">
                    <v-col cols="2">
                      <v-btn class="mb-2" color="primary" block>Clear</v-btn>
                    </v-col>
                    <v-col cols="2">
                      <v-btn class="mb-2" color="primary" block>View Log</v-btn>
                    </v-col>
                    <v-col cols="2">
                      <v-btn class="mb-2" color="primary" block>Notepad</v-btn>
                    </v-col>
                    <v-col cols="2" class="update-button">
                      <v-btn class="mb-2" color="primary" block>Update</v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-row v-else-if="activeTab === 2">
            <!-- Gating, Fan, Light content here -->
          </v-row>
          <v-row v-else-if="activeTab === 3">
            <!-- iLinq content here -->
          </v-row>
          <v-row v-else-if="activeTab === 4">
            <v-row style="align-items: center">
              <h4 style="margin-left: 2.5%">Protocol Library:</h4>
              <v-radio-group style="margin: 20px 0px 0px 10px" v-model="selectedLibrary" row>
                <v-radio label="ScanLab" value="ScanLab"></v-radio>
                <v-radio label="GE" value="GE"></v-radio>
                <v-radio label="Service" value="Service"></v-radio>
              </v-radio-group>
            </v-row>
            <v-row>
              <v-col cols="4">
                <v-radio-group v-model="selectedPatientType" row>
                  <v-radio label="Adult" value="Adult"></v-radio>
                  <v-radio label="Pediatric" value="Pediatric"></v-radio>
                </v-radio-group>
                <v-card flat>
                  <v-card-text>
                    <div class="skeleton-container">
                      <img src="@/assets/svg/regions/skeleton.png" alt="Skeleton" class="skeleton-image" />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="8">
                <v-row>
                  <v-col cols="2">
                    <v-list>
                      <v-list-item v-for="section in sections" :key="section" @click="selectSection(section)">
                        <v-list-item-content>
                          <v-list-item-title>{{ section }}</v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-col>

                  <v-col cols="10">
                    <v-row>
                      <v-col>
                        <v-checkbox-group v-model="selectedFilters" row>
                          <div style="display: flex; flex-wrap: wrap">
                            <v-checkbox
                              v-for="filter in filters"
                              :key="filter"
                              :label="filter"
                              :value="filter"
                            ></v-checkbox>
                          </div>
                        </v-checkbox-group>
                      </v-col>
                    </v-row>

                    <v-row>
                      <v-col>
                        <div style="border: 1px solid #000; height: 300px">
                          <!-- Your content goes here, for example a list of items -->
                          <div v-for="item in filteredItems" :key="item">{{ item }}</div>
                        </div>
                      </v-col>
                    </v-row>

                    <v-row>
                      <v-col>
                        <div style="border: 1px solid #000; height: 100px">
                          <!-- Protocol Description or other content -->
                          Protocol Description
                        </div>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" class="d-flex justify-space-around">
                    <v-btn color="primary" @click="editProtocol">Edit Protocol</v-btn>
                    <v-btn color="primary" @click="deleteProtocol">Delete</v-btn>
                    <v-btn color="primary" @click="duplicateProtocol">Duplicate</v-btn>
                    <v-btn color="primary" @click="editProperties">Edit Properties</v-btn>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      selectedLibrary: '',
      selectedPatientType: '',
      selectedFilters: [],
      activeTab: 4,
      sidebarItems: ['Service Desktop Manager', 'Error Log', 'Gating, Fan, Light', 'iLinq', 'Protocol Management'],
      filters: ['Standard', 'Express', 'Advance', 'Quiet', 'Other', 'Vascular', 'Contrast'],
      tabs: [
        'Head',
        'Neck',
        'Upper Extremities',
        'Chest',
        'Abdomen',
        'Spine',
        'Pelvis',
        'Lower Extremities',
        'Whole Body',
        'Other',
        'Template',
      ],
      protocols: [
        'Ax DWI MUSE ALL b1000',
        'Cor FOCUS ALL b1000',
        'Ax PROBE 3STE Single Voxel',
        'Ax PROBE 14STE Single Voxel',
        'Ax PROBE 28STE Single Voxel',
        'Ax PROBE Multi Voxel 144TE',
        '3D Ax PROBE Multi Voxel',
        'Multishell DTI--',
        'Multishell DTI ABCD',
        'Multishell DTI UK Biobank',
        'Multishell DTI ADNI',
        'Multishell DTI AD',
        'Multishell DTI HCP',
        'Multishell DTI HHH',
        '-- CSF Flow--',
        'Ax Phase Contrast Flow Quantification',
        'Sag Phase Contrast Flow Visualization',
        '-- DSP GRE--',
        'Ax EPI GRE',
        'Ax EPI SE',
        '21.4--Brain Express 5 minute',
        '21.1B--Brain MAGIC',
        '21.1L--Brain Motion Reduction',
        '21.5--Brain Routine',
      ],
    }
  },
  methods: {
    editProtocol() {
      // Function to edit protocol
    },
    deleteProtocol() {
      // Function to delete protocol
    },
    duplicateProtocol() {
      // Function to duplicate protocol
    },
    editProperties() {
      // Function to edit properties
    },
  },
}
</script>

<style>
/* Custom styles for the skeleton image and layout */
.skeleton-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.skeleton-image {
  max-width: 100%;
  max-height: 100%;
}
::v-deep .v-tabs--vertical > .v-tabs-bar .v-tabs-bar__content {
  background-color: #343579 !important;
  color: #343579 !important;
}
.full-height-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.error-text {
  background-color: white;
  padding: 10px;
  color: black;
  font-weight: bold;
}
</style>
