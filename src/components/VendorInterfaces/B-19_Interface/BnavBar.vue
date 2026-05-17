<!-- eslint-disable vue-i18n/no-raw-text -->
<!-- eslint-disable no-unused-vars -->
<template>
  <v-card class="navbar flex justify-content-between">
    <v-toolbar density="compact" height="25px">
      <div v-for="(item, index) in menuItems" :key="index">
        <v-menu offset-y :close-on-content-click="false" v-model="item.open" @mouseleave="closeSubmenu(index)">
          <template #activator="{ props }">
            <v-btn v-bind="props" @mouseenter="openSubmenu(index)" @click="toggleSubmenu(index)" class="menu-button">
              <u>{{ item.titleFirstLetter }}</u
              >{{ item.titleRest }}
            </v-btn>
          </template>

          <v-list class="submenu">
            <v-list-item-group>
              <div
                v-for="(subItem, subIndex) in item.submenu"
                :key="subIndex"
                @mouseleave="maybeCloseSubmenu(index, item.submenu, subIndex)"
              >
                <template v-if="subItem.group">
                  <!-- Divider -->
                  <v-divider v-if="subItem.showDivider" class="item-with-divider"></v-divider>
                  <div class="grouped-items">
                    <v-list-item
                      v-for="(groupItem, groupIndex) in subItem.group"
                      :key="groupIndex"
                      @click="submenuAction(groupItem.action)"
                      class="item-with-divider"
                    >
                      <v-list-item-title class="mr-12">{{ groupItem.title }}</v-list-item-title>
                      <v-list-item-subtitle>{{ groupItem.shortcut }}</v-list-item-subtitle>
                    </v-list-item>
                  </div>
                </template>

                <v-list-item v-else-if="!subItem.submenu" @click="submenuAction(subItem.action)" class="submenu-item">
                  <v-list-item-title>{{ subItem.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ subItem.shortcut }}</v-list-item-subtitle>
                </v-list-item>

                <v-menu
                  v-else
                  offset-x
                  :close-on-content-click="false"
                  v-model="subItem.open"
                  @mouseleave="closeSubSubmenu(item, subIndex)"
                >
                  <template #activator="{ props }">
                    <v-list-item
                      v-bind="props"
                      @mouseenter="openSubSubmenu(item, subIndex)"
                      @click="toggleSubSubmenu(item, subIndex)"
                      class="submenu-item"
                    >
                      <v-list-item-title>{{ subItem.title }}</v-list-item-title>
                      <v-list-item-subtitle>{{ subItem.shortcut }}</v-list-item-subtitle>
                    </v-list-item>
                  </template>
                  <v-list class="sub-submenu">
                    <v-list-item
                      v-for="(subSubItem, subSubIndex) in subItem.submenu"
                      :key="subSubIndex"
                      @click="submenuAction(subSubItem.action)"
                      class="submenu-item"
                      @mouseleave="maybeClosesubSubmenu(item, item.submenu, subIndex, subItem.submenu, subSubIndex)"
                    >
                      <v-list-item-title>{{ subSubItem.title }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </v-list-item-group>
          </v-list>
        </v-menu>
      </div>
      <!-- Slider -->
    </v-toolbar>
    <div class="dot-size mr-8">
      <h6 class="mt-2 mx-1">Dot Size</h6>
      <v-slider v-model.number="dotScaleMultiplierIndex" :min="0" :max="dotScaleValues.length - 1" ticks />
    </div>
  </v-card>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { mapGetters, mapState, mapActions } from 'vuex'
import _ from 'lodash'
import EventBus from '../../../lib/event-bus'
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import { MriMixin } from '@/components/Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
export default {
  //mixins: [ScanButtonMixin, MriMixin, SelectionConfigMixin],
  data() {
    return {
      menuItems: [
        {
          titleFirstLetter: 'P',
          titleRest: 'atient',
          submenu: [
            { title: 'Browser...', action: 'browser', shortcut: 'Num', showDivider: false },
            { title: 'Register...', action: 'register', shortcut: 'Num 0', showDivider: false },
            { title: 'Schedule...', action: 'schedule', showDivider: false },
            { title: 'Close Patient', action: 'close_patient', showDivider: true },
            { title: 'Save As...', action: 'save_as', showDivider: false },
            { title: 'Copy Selection', action: 'copy_selection', showDivider: true },
            { title: 'Reset Table Position', action: 'reset_table_position', showDivider: false },
            { title: 'Voice Output Properties...', action: 'voice_output_properties', showDivider: true },
            { title: 'Filming Layout...', action: 'filming_layout', showDivider: false },
            { title: 'Film Task Status...', action: 'film_task_status', showDivider: false },
            { title: 'Film Preview...', action: 'film_preview', shortcut: 'Ctrl+P', showDivider: false },
            { title: 'Expose Film Task', action: 'expose_film_task', showDivider: true },
            { title: 'Copy to Film Sheet', action: 'copy_to_film_sheet', showDivider: false },
            { title: 'Search', action: 'search' },
            { title: 'Search Selected...', action: 'search_selected', showDivider: false },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'A',
          titleRest: 'pplications',
          submenu: [
            {
              title: '3D',
              submenu: [
                { title: 'Argus', action: 'open_argus' },
                { title: 'Composing', action: 'open_composing' },
                { title: 'Mean Curve', action: 'open_mean_curve' },
                { title: 'Spectroscopy', action: 'open_spectroscopy' },
                { title: 'Fusion', action: 'open_fusion' },
                { title: 'Desktop', action: 'open_desktop' },
              ],
              open: false,
            },
            { title: 'Argus', action: 'open_argus' },
            { title: 'Composing', action: 'open_composing' },
            { title: 'Mean Curve', action: 'open_mean_curve' },
            { title: 'Spectroscopy', action: 'open_spectroscopy' },
            { title: 'Desktop', action: 'open_desktop' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'T',
          titleRest: 'ransfer',
          submenu: [
            { title: 'Archive to DVD-R', action: 'archive_to_dvdr' },
            { title: 'Send to PACS', action: 'send_to_pacs' },
            { title: 'Export to...', action: 'export_to' },
            { title: 'Eject from DVD-R', action: 'eject_from_dvdr' },
            { title: 'Finalize Medium and Eject from DVD-R', action: 'finalize_and_eject_dvdr' },
            { title: 'Local Job Status...', action: 'local_job_status' },
            { title: 'Network Job Status...', action: 'network_job_status' },
            { title: 'Export to Offline...', action: 'export_to_offline' },
            { title: 'Record Offline Files', action: 'record_offline_files' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'E',
          titleRest: 'dit',
          submenu: [
            { title: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
            { title: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
            { title: 'Paste', action: 'paste', shortcut: 'Ctrl+V' },
            { title: 'Delete', action: 'delete', shortcut: 'Del' },
            { title: 'Select Series', action: 'select_series' },
            { title: 'Deselect All', action: 'deselect_all' },
            { title: 'Clear Graphic Segments', action: 'clear_graphic_segments' },
            { title: 'View Protocol', action: 'view_protocol', shortcut: 'Ctrl+P' },
            { title: 'Print Protocol', action: 'print_protocol' },
            { title: 'Properties', action: 'properties', shortcut: 'Alt+Enter' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'Q',
          titleRest: 'ueue',
          submenu: [
            { title: 'Stop', action: 'stop', shortcut: 'F3' },
            { title: 'Continue', action: 'continue', shortcut: 'F12' },
            { title: 'Return', action: 'return' },
            { title: 'Scan Opened Protocol', action: 'scan_opened_protocol', shortcut: 'Ctrl+Shift+F3' },
            { title: 'Voice Output', action: 'voice_output' },
            { title: 'Copy Parameter', action: 'copy_parameter' },
            { title: 'Update Copy Reference', action: 'update_copy_reference' },
            { title: 'Append', action: 'append' },
            { title: 'Change Body Part Examined', action: 'change_body_part_examined' },
            { title: 'Set Image Comment', action: 'set_image_comment' },
            { title: 'Assign Studies', action: 'assign_studies' },
            { title: 'Inherit Image Numbering', action: 'inherit_image_numbering' },
            { title: 'Coil Memory', action: 'coil_memory' },
            { title: 'Auto Cell Select', action: 'auto_cell_select' },
            { title: 'Table Move Notification', action: 'table_move_notification' },
            { title: 'Auto Align Info Dialog...', action: 'auto_align_info_dialog' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'P',
          titleRest: 'rotocol',
          submenu: [
            { title: 'Add Slice/Slab Group', action: 'add_slice_slab_group' },
            { title: 'Delete All Graphics', action: 'delete_all_graphics' },
            { title: 'Perpendicular', action: 'perpendicular', shortcut: 'Ctrl+1' },
            { title: 'Orthogonal', action: 'orthogonal', shortcut: 'Ctrl+2' },
            { title: 'Turn Group', action: 'turn_group' },
            { title: 'Shift to Image Plane', action: 'shift_to_image_plane' },
            { title: 'Shift to Segment Center', action: 'shift_to_segment_center' },
            { title: 'Swap Phase', action: 'swap_phase' },
            { title: 'Reset Inplane Rotation', action: 'reset_inplane_rotation' },
            { title: 'Stack', action: 'stack', shortcut: 'Ctrl+3' },
            { title: 'Stack +', action: 'stack_plus', shortcut: 'Ctrl+4' },
            { title: 'Gap Filling', action: 'gap_filling', shortcut: 'Ctrl+5' },
            { title: 'Gap Filling +', action: 'gap_filling_plus', shortcut: 'Ctrl+6' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'V',
          titleRest: 'iew',
          submenu: [
            { title: '2 Segments', action: 'view_2_segments' },
            { title: '3 Segments', action: 'view_3_segments' },
            { title: 'Maestro UI', action: 'maestro_ui' },
            { title: 'Image Text On', action: 'image_text_on' },
            { title: 'Reference Lines On', action: 'reference_lines_on' },
            { title: 'Adjust Volume On', action: 'adjust_volume_on' },
            { title: 'Graphics CSI Matrix', action: 'graphics_csi_matrix' },
            { title: 'Inline Display...', action: 'inline_display' },
            { title: 'Physiolog. Display...', action: 'physiolog_display' },
            { title: 'Exam Explorer...', action: 'exam_explorer' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'I',
          titleRest: 'mage',
          submenu: [
            { title: 'Windowing On Series', action: 'windowing_on_series' },
            { title: 'Zoom/Pan On Series', action: 'zoom_pan_on_series' },
            { title: 'Auto Windowing', action: 'auto_windowing', shortcut: 'Num+9' },
            { title: 'Fit to Segment Height', action: 'fit_to_segment_height' },
            { title: 'Flip Horizontally', action: 'flip_horizontally' },
            { title: 'Flip Vertically', action: 'flip_vertically' },
            { title: 'Rotate 90', action: 'rotate_90' },
            { title: 'Zoom', action: 'zoom' },
            { title: 'Modify Graphics', action: 'modify_graphics' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'T',
          titleRest: 'ools',
          submenu: [
            { title: 'Copy Image Position', action: 'copy_image_position' },
            { title: 'Paste Image Position', action: 'paste_image_position' },
            { title: 'Append to Queue', action: 'append_to_queue' },
            { title: 'Create Slice/Slab Group', action: 'create_slice_slab_group' },
            { title: 'Create Sat', action: 'create_sat' },
            { title: 'Create Slice/Slab Group 3 Points', action: 'create_slice_slab_group_3_points' },
            { title: 'Extent Mode', action: 'extent_mode' },
            { title: 'Coupled Graphics On', action: 'coupled_graphics_on' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'E',
          titleRest: 'valuation',
          submenu: [
            { title: 'Inverse Distortion 2D Correction', action: 'inverse_distortion_2d_correction' },
            { title: 'Distortion 2D Correction', action: 'distortion_2d_correction' },
            { title: 'Distortion 3D Correction', action: 'distortion_3d_correction' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'S',
          titleRest: 'croll',
          submenu: [
            { title: 'Display Order', action: 'display_order' },
            { title: 'Movie', action: 'movie' },
            { title: 'Series Next', action: 'series_next', shortcut: 'Num+5' },
            { title: 'Series Previous', action: 'series_previous', shortcut: 'Num+4' },
            { title: 'Image Next', action: 'image_next', shortcut: 'Num+2' },
            { title: 'Image Previous', action: 'image_previous', shortcut: 'Num+1' },
            { title: 'Nearest', action: 'nearest' },
            { title: 'Find Localizer', action: 'find_localizer' },
            { title: 'Stamp Segments', action: 'stamp_segments' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'S',
          titleRest: 'ystem',
          submenu: [
            { title: 'Control...', action: 'control' },
            { title: 'End Session', action: 'end_session' },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'A',
          titleRest: 'dd-On',
          submenu: [{ title: 'Create Radial Slices...', action: 'create_radial_slices' }],
          open: false,
        },
        {
          titleFirstLetter: 'O',
          titleRest: 'ptions',
          submenu: [
            { title: 'File Browser...', action: 'file_browser' },
            { title: 'Adjustments...', action: 'adjustments' },
            { title: 'SAR Information', action: 'sar_information' },
            { title: 'Stimulation Info...', action: 'stimulation_info' },
            { title: 'Auto Expose', action: 'auto_expose' },
            { title: 'Maintenance...', action: 'maintenance' },
            { title: 'Configuration...', action: 'configuration' },
            {
              title: 'Service',
              submenu: [
                { title: 'Local Service...', action: 'local_service' },
                { title: 'Remote Service...', action: 'remote_service' },
                { title: 'Event Log', action: 'event_log' },
                { title: 'Customer QA...', action: 'customer_qa' },
                { title: 'Problem Steps Recorder...', action: 'problem_steps_recorder' },
                { title: 'Remote Assistance', action: 'remote_assistance' },
              ],
              open: false,
            },
          ],
          open: false,
        },
        {
          titleFirstLetter: 'H',
          titleRest: 'elp',
          submenu: [
            { title: 'Help...', action: 'help' },
            { title: 'Info', action: 'info' },
          ],
          open: false,
        },
      ],
    }
  },
  mounted() {
    EventBus.$on('dataPassed', (isScanned) => {
      this.sharedData = isScanned // Listen to the event and update the data in ComponentB
      this.isCurrentQuestion = false
      console.log('this.getRepetitionTime', this.getRepetitionTime)
      console.log('this.getMinConcatAcqPackagefuture', this.getMinConcatAcqPackagefuture)
    })
  },
  computed: {
    ...mapGetters('questionService', [
      'stackQuestions',
      'stackQuestion',
      'selectedStackQuestionIndexVisual',
      'scanSubmittedByStackQuestionId',
      'scanSubmitted',
    ]),
    ...mapGetters('user', ['vendorStylePreferenceOptions', 'languageCode']),
    ...mapState('selectionConfig', ['isAddLocalizerMode']),
    ...mapGetters('selectionConfig', ['dotScaleValues']),
    ...mapGetters('scanTimeConfig', [
      'getRepetitionTime',
      'getMinConcatAcqPackage',
      'getSlices',
      'getMinSeqTRfuture',
      'getMinConcatAcqPackagefuture',
    ]),

    toggleReferenceLines: {
      get() {
        return this.$store.state.selectionConfig.showReferenceLines
      },
      set(toggleReferenceLines) {
        this.$store.dispatch('selectionConfig/setShowReferenceLines', toggleReferenceLines)
      },
    },
    isVolumeViewMode: {
      get() {
        return this.$store.state.selectionConfig.isVolumeViewMode
      },
      set(isVolumeViewMode) {
        this.$store.dispatch('selectionConfig/setIsVolumeViewMode', isVolumeViewMode)
      },
    },
    dotScaleMultiplierIndex: {
      get() {
        return _.indexOf(this.dotScaleValues, this.dotScaleMultiplier)
      },
      set(index) {
        this.dotScaleMultiplier = this.dotScaleValues[index]
        if (!this.dotScaleMultiplier) {
          throw Error('set dotScaleMultiplier out of bounds')
        }
      },
    },
    dotScaleMultiplier: {
      get() {
        return this.$store.state.selectionConfig.dotScaleMultiplier
      },
      set(dotScaleMultiplier) {
        this.$store.dispatch('selectionConfig/setDotScaleMultiplier', dotScaleMultiplier)
      },
    },
    isButtonDisabled() {
      return this.getRepetitionTime < this.getMinConcatAcqPackagefuture
    },
  },
  methods: {
    openSubmenu(index) {
      this.menuItems.forEach((item, i) => {
        if (i !== index) item.open = false
      })
      this.menuItems[index].open = true
    },
    toggleSubmenu(index) {
      this.menuItems[index].open = !this.menuItems[index].open
    },
    closeSubmenu(index) {
      this.menuItems[index].open = false
    },
    openSubSubmenu(item, subIndex) {
      item.submenu.forEach((subItem, i) => {
        if (i !== subIndex) subItem.open = false
      })
      item.submenu[subIndex].open = true
    },
    toggleSubSubmenu(item, subIndex) {
      item.submenu[subIndex].open = !item.submenu[subIndex].open
    },
    closeSubSubmenu(item, subIndex) {
      item.submenu[subIndex].open = false
    },
    isLastItem(submenu, index) {
      return index === submenu.length - 1
    },
    isLastsubSubItem(subSubmenu, subSubindex) {
      return subSubindex === subSubmenu.length - 1
    },
    isFirstIndex(index) {
      return index === 0
    },
    isFirstsubSubmenuIndex(index) {
      return index === 0
    },
    maybeCloseSubmenu(mainIndex, submenu, subIndex) {
      if (this.isLastItem(submenu, subIndex)) {
        this.closeSubmenu(mainIndex)
      }
    },
    maybeClosesubSubmenu(mainIndex, submenu, subIndex, subSubmenu, subSubIndex) {
      console.log('mainIndex====', mainIndex)
      console.log('submenu====', submenu)
      console.log('subIndex====', subIndex)
      console.log('subSubmenu====', subSubmenu)
      console.log('subSubIndex====', subSubIndex)

      if (this.isLastItem(submenu, subIndex) && this.isLastsubSubItem(subSubmenu, subSubIndex)) {
        this.closeSubmenu(mainIndex)
      } else if (this.isLastItem(submenu, subIndex) && this.isFirstsubSubmenuIndex(subSubIndex)) {
        this.closeSubmenu(mainIndex)
      } else if (this.isLastsubSubItem(subSubmenu, subSubIndex) && this.isFirstIndex(subIndex)) {
        this.closeSubmenu(mainIndex)
      }
    },
    submenuAction(action) {
      console.log(`${action} clicked`)
      this.menuItems.forEach((item) => {
        item.open = false
        if (item.submenu) {
          item.submenu.forEach((subItem) => {
            subItem.open = false
          })
        }
      })
    },
  },
}
</script>

<style scoped lang="scss">
.dot-size {
  background: black !important;
  color: white;
  height: 2rem;
  width: 30%;
  display: flex;
}
.navbar {
  display: flex;
  justify-content: space-between;
  background: black !important;
  padding: 0;
  border-radius: 0 !important;
}

.menu-button {
  padding: 0 3px !important;
  height: 20px !important;
  background: black !important;
  color: white !important;
  font-size: 10px !important;
  border-radius: 0 !important;
  text-transform: inherit !important;
}

.submenu,
.sub-submenu {
  background-color: black !important;
  color: white !important;
  border: 1px solid white;
  font-size: 10px !important;
  padding: 0;
  width: 260px;
  z-index: 5;
}

.submenu-item {
  color: white !important;
  // padding: 5px 10px !important;
  font-size: 10px !important;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.grouped-items {
  padding-top: 5px;
}
.item-with-divider {
  content: '';
  display: block;
  height: 1px;
  background-color: white;
  width: 100%;
  margin: 5px 0;
}

.v-toolbar {
  display: flex;
  justify-content: left;
  align-items: center;
}
::v-deep .theme--light.v-toolbar.v-sheet {
  background-color: #000000 !important;
}
::v-deep .theme--light.v-list-item-title {
  font-size: 10px !important;
  color: white !important;
  align-items: flex-start;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

::v-deep .theme--light.v-list-item .v-list-item__action-text,
.theme--light.v-list-item .v-list-item__subtitle {
  color: white;
}
::v-deep .v-list-item {
  align-items: center;
  display: flex;
  justify-content: space-between;
  flex: 1 1 100%;
  letter-spacing: normal;
  min-height: 23px;
  outline: none;
  padding: 0 8px;
  position: relative;
  text-decoration: none;
}
.v-list-item-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.v-menu__content,
.v-card {
  box-shadow: none !important;
}
::v-deep .v-list-item__title {
  flex: none !important;
  margin-right: 40% !important;
}
</style>
