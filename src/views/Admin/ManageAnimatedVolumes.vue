<template>
  <div style="padding: 10px; min-height: 78vh">
    <v-row>
      <v-col cols="12">
        <div class="mt-10 mb-10">
          <h2>{{ $t('global.manage_animated_volumes') }}</h2>
        </div>
      </v-col>
      <v-col cols="12" class="d-flex justify-end pt-0 mt-0">
        <v-btn color="primary" @click="showAddDialog">
          {{ $t('global.add_animated_volume') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <table class="table table-striped table-bordered">
        <thead>
          <tr>
            <th>{{ $t('global.name') }}</th>
            <th>{{ $t('global.description') }}</th>
            <th>{{ $t('global.select_body_part') }}</th>
            <th>{{ $t('global.frame_count') }}</th>
            <th>{{ $t('global.tissue_types') }}</th>
            <th>{{ $t('global.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="animatedVolumes.length === 0 && !loading">
            <td colspan="6">{{ $t('global.no_data') }}</td>
          </tr>
          <tr v-for="(volume, index) in animatedVolumes" :key="volume.id || `volume-${index}`" v-else>
            <td>{{ volume.name }}</td>
            <td>{{ volume.description }}</td>
            <td>{{ getBodyPartName(volume.bodyPartId) }}</td>
            <td>{{ volume.frameCount }}</td>
            <td>
              <v-chip v-if="volume.hasWm" class="ma-1" small color="primary" outlined>
                {{ getTissueTypeName('WM') }}
              </v-chip>
              <v-chip v-if="volume.hasSkin" class="ma-1" small color="primary" outlined>
                {{ getTissueTypeName('SKIN') }}
              </v-chip>
              <v-chip v-if="volume.hasPd" class="ma-1" small color="primary" outlined>
                {{ getTissueTypeName('PD') }}
              </v-chip>
              <v-chip v-if="volume.hasMuscles" class="ma-1" small color="primary" outlined>
                {{ getTissueTypeName('MUSCLES') }}
              </v-chip>
              <v-chip v-if="volume.hasMarrow" class="ma-1" small color="primary" outlined>
                {{ getTissueTypeName('MARROW') }}
              </v-chip>
              <v-chip v-if="volume.hasGm" class="ma-1" small color="primary" outlined>
                {{ getTissueTypeName('GM') }}
              </v-chip>
              <v-chip v-if="volume.hasFat2" class="ma-1" small color="primary" outlined>
                {{ getTissueTypeName('FAT2') }}
              </v-chip>
              <v-chip v-if="volume.hasFat" class="ma-1" small color="primary" outlined>
                {{ getTissueTypeName('FAT') }}
              </v-chip>
              <v-chip v-if="volume.hasDura" class="ma-1" small color="primary" outlined>
                {{ getTissueTypeName('DURA') }}
              </v-chip>
              <v-chip v-if="volume.hasCsf" class="ma-1" small color="primary" outlined>
                {{ getTissueTypeName('CSF') }}
              </v-chip>
              <span v-if="!hasAnyTissueType(volume)" class="text--secondary">{{ $t('global.no_data') }}</span>
            </td>
            <td>
              <v-btn color="primary" text @click="editAnimatedVolume(volume)">
                {{ $t('global.edit') }}
              </v-btn>
              <v-btn color="error" text @click="confirmDelete(volume.id)">
                {{ $t('global.delete') }}
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </v-row>

    <!-- Add/Edit Dialog -->
    <PopupAddEditAnimatedVolume
      :show="showDialog"
      :volume-id="selectedVolumeId"
      @close="showDialog = false"
      @refresh="loadAnimatedVolumes"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="headline">
          {{ $t('global.delete_animated_volume') }}
        </v-card-title>
        <v-card-text>
          {{ $t('global.are_you_sure_delete_resource') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">
            {{ $t('global.cancel') }}
          </v-btn>
          <v-btn color="error" text @click="deleteAnimatedVolume">
            {{ $t('global.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div class="loading-overlay" v-if="loading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'
import PopupAddEditAnimatedVolume from '../../components/AnimatedVolumes/PopupAddEditAnimatedVolume.vue'

export default {
  name: 'ManageAnimatedVolumes',
  components: {
    PopupAddEditAnimatedVolume,
  },
  data() {
    return {
      bodyParts: [],
      showDialog: false,
      selectedVolumeId: null,
      deleteDialog: false,
      volumeToDelete: null,
    }
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
    ...mapState('animatedVolumeService', ['loading']),
    animatedVolumes() {
      return this.$store.state.animatedVolumeService.animatedVolumes.filter((volume) => volume && volume.id)
    },
  },
  async mounted() {
    await this.loadAnimatedVolumes()
    await this.loadBodyParts()
  },
  methods: {
    ...mapActions('animatedVolumeService', ['loadAnimatedVolumes', 'deleteAnimatedVolume']),
    ...mapActions('bodyService', ['getBodyParts']),

    async loadBodyParts() {
      try {
        this.bodyParts = await this.getBodyParts()
      } catch (error) {
        console.error('Error loading body parts:', error)
        this.$notify({ type: 'error', text: 'Error loading body parts' })
      }
    },

    showAddDialog() {
      this.selectedVolumeId = null
      this.showDialog = true
    },

    editAnimatedVolume(volume) {
      this.selectedVolumeId = volume.id
      this.showDialog = true
    },

    confirmDelete(volumeId) {
      this.volumeToDelete = volumeId
      this.deleteDialog = true
    },

    async deleteAnimatedVolume() {
      try {
        await this.$store.dispatch('animatedVolumeService/deleteAnimatedVolume', this.volumeToDelete)
        this.$notify({ type: 'success', text: 'Animated volume deleted successfully' })
        this.deleteDialog = false
        this.volumeToDelete = null
      } catch (error) {
        console.error('Error deleting animated volume:', error)
        this.$notify({ type: 'error', text: 'Error deleting animated volume' })
      }
    },

    getBodyPartName(bodyPartId) {
      const bodyPart = this.bodyParts.find((bp) => bp.id === bodyPartId)
      return bodyPart ? bodyPart.name : 'Unknown'
    },

    getTissueTypeName(tissueType) {
      const typeMap = {
        WM: this.$t('global.tissue_type_wm'),
        SKIN: this.$t('global.tissue_type_skin'),
        PD: this.$t('global.tissue_type_pd'),
        MUSCLES: this.$t('global.tissue_type_muscles'),
        MARROW: this.$t('global.tissue_type_marrow'),
        GM: this.$t('global.tissue_type_gm'),
        FAT2: this.$t('global.tissue_type_fat2'),
        FAT: this.$t('global.tissue_type_fat'),
        DURA: this.$t('global.tissue_type_dura'),
        CSF: this.$t('global.tissue_type_csf'),
      }
      return typeMap[tissueType] || tissueType
    },

    hasAnyTissueType(volume) {
      return (
        volume.hasWm ||
        volume.hasSkin ||
        volume.hasPd ||
        volume.hasMuscles ||
        volume.hasMarrow ||
        volume.hasGm ||
        volume.hasFat2 ||
        volume.hasFat ||
        volume.hasDura ||
        volume.hasCsf
      )
    },
  },
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
</style>
