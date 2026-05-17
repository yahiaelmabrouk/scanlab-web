<template>
  <div style="background-color: #6875a2; width: 75%; z-index: 3">
    <div style="background-color: #6875a2; height: 100%; overflow-y: scroll">
      <v-row class="mt-2">
        <v-col cols="3">
          <v-select label="Source" :items="sources" v-model="selectedSource"></v-select>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-row>
            <v-col cols="2" style="text-align: left">
              <h5># Exams: 5</h5>
            </v-col>
            <v-col cols="3">
              <v-select label="Select" :items="selectOptions" v-model="selectedExamOption"></v-select>
            </v-col>
            <v-col cols="3">
              <v-select label="Find" :items="findOptions" v-model="selectedFindOption"></v-select>
            </v-col>
            <v-col cols="3">
              <v-text-field></v-text-field>
            </v-col>
          </v-row>
          <v-data-table :headers="examHeaders" :items="examItems" class="elevation-1"></v-data-table>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-row>
            <v-col cols="2" style="text-align: left">
              <h5># Series: 0</h5>
            </v-col>
            <v-col cols="3">
              <v-select label="Select" :items="selectOptions" v-model="selectedSeriesOption"></v-select>
            </v-col>
          </v-row>
          <v-data-table :headers="seriesHeaders" :items="seriesItems" class="elevation-1"></v-data-table>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-row>
            <v-col cols="2">
              <h5># Images: 0</h5>
            </v-col>
            <v-col cols="3">
              <v-select label="Select" :items="selectOptions" v-model="selectedImageOption"></v-select>
            </v-col>
          </v-row>
          <v-data-table :headers="imageHeaders" :items="imageItems" class="elevation-1"></v-data-table>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <div class="black-screen"></div>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" class="d-flex align-center">
          <v-row>
            <v-col cols="3">
              <span class="mr-3">Destinations:</span>
              <v-btn @click="handleDestinationClick">Local DB</v-btn>
            </v-col>
            <v-col cols="3">
              <v-select label="Archive" :items="archiveOptions" v-model="selectedArchiveOption" class="mx-3"></v-select>
            </v-col>
            <v-col>
              <v-btn>VIT-PACS</v-btn>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sources: ['Local DB'],
      selectedSource: 'Local DB',
      selectOptions: ['Option 1', 'Option 2'],
      findOptions: ['Option 1', 'Option 2'],
      archiveOptions: ['Option 1', 'Option 2'],
      selectedExamOption: null,
      selectedFindOption: null,
      selectedSeriesOption: null,
      selectedImageOption: null,
      selectedArchiveOption: null,
      examHeaders: [
        { text: 'Exam', value: 'exam' },
        { text: 'Station name', value: 'stationName' },
        { text: 'Name', value: 'name' },
        { text: 'Date', value: 'date' },
        { text: 'Description', value: 'description' },
        { text: 'Modality', value: 'modality' },
        { text: 'Archived', value: 'archived' },
      ],
      examItems: [
        {
          exam: '24947',
          stationName: 'xxxxxxxx',
          name: 'Dyano, 20240184 766454',
          date: 'Apr 22 24',
          description: 'IRM MEMBRE INFERIEUR IV',
          modality: 'MR',
          archived: '',
        },
        {
          exam: '2',
          stationName: '123123',
          name: 'Hayes, Matthew L.',
          date: 'Apr 04 24',
          description: 'IRM CRANE APC',
          modality: 'MR',
          archived: '',
        },
        {
          exam: '18956',
          stationName: 'xxxxxxxx',
          name: 'Dyano, 20240320 419442',
          date: 'Mar 19 24',
          description: 'IRM CRANE APC',
          modality: 'MR',
          archived: '',
        },
        {
          exam: '1',
          stationName: '123123',
          name: 'fgasfgasfg, sfgasfgasfg',
          date: 'Nov 13 23',
          description: '789',
          modality: 'MR',
          archived: '',
        },
        {
          exam: '18956',
          stationName: 'xxxxx',
          name: 'ANON18956',
          date: 'Jan 01 70',
          description: 'IRM CRANE APC',
          modality: 'MR',
          archived: '',
        },
      ],
      seriesHeaders: [
        { text: 'Series', value: 'series' },
        { text: 'Type', value: 'type' },
        { text: 'Images', value: 'images' },
        { text: 'Description', value: 'description' },
        { text: 'Modality', value: 'modality' },
        { text: 'Manufacturer', value: 'manufacturer' },
        { text: 'Archived', value: 'archived' },
      ],
      seriesItems: [],
      imageHeaders: [
        { text: 'Image', value: 'image' },
        { text: 'Date', value: 'date' },
        { text: 'Image Size', value: 'imageSize' },
      ],
      imageItems: [],
    }
  },
  methods: {
    handleDestinationClick() {
      // Handle Local DB button click
    },
  },
}
</script>

<style scoped>
.black-screen {
  width: 100%;
  height: 100px;
  background-color: black;
  margin: 10px 0;
}

.row {
  margin: 0px;
}
</style>
