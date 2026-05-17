<template>
  <div>
    <v-row>
      <v-col cols="12">
        <div
          class="upload-area"
          :class="{ 'drag-over': isDragOver }"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
        >
          <v-file-input
            v-model="newFileSelection"
            multiple
            accept=".nii,.nii.gz,.dcm,.dicom"
            :label="`Upload ${expectedFrameCount} volume files for ${getTissueTypeName(tissueType)}`"
            prepend-icon="mdi-cloud-upload"
            show-size
            counter
            outlined
            @change="onFileSelect"
          >
            <template #selection="{ index, text }">
              <v-chip v-if="index < 2" color="primary" small label>
                {{ text }}
              </v-chip>
              <span v-else-if="index === 2" class="text-overline grey--text text--darken-3 mx-2">
                +{{ newFileSelection.length - 2 }} {{ $t('global.files') }}
              </span>
            </template>
          </v-file-input>
        </div>
      </v-col>
    </v-row>

    <!-- Draggable Frame List -->
    <v-row v-if="allFrames.length > 0">
      <v-col cols="12">
        <v-card outlined>
          <v-card-title class="subtitle-2">
            {{ $t('global.frames_uploaded', { count: allFrames.length }) }} / {{ expectedFrameCount }}
            <v-spacer></v-spacer>
            <v-btn color="error" text small @click="clearFiles">Clear All</v-btn>
          </v-card-title>
          <v-card-text>
            <draggable v-model="allFrames" handle=".drag-handle" @end="onDragEnd" :disabled="allFrames.length <= 1">
              <v-card
                v-for="(frame, index) in allFrames"
                :key="frame.id || frame.tempId || frame.name"
                class="mb-2 frame-card"
                outlined
                :class="{ 'drag-disabled': allFrames.length <= 1 }"
              >
                <v-card-text class="py-2">
                  <v-row align="center" no-gutters>
                    <!-- Drag Handle -->
                    <v-col cols="auto" class="pr-3">
                      <v-icon class="drag-handle" :class="{ 'drag-disabled': allFrames.length <= 1 }" color="grey">
                        mdi-drag
                      </v-icon>
                    </v-col>

                    <!-- Frame Index -->
                    <v-col cols="auto" class="pr-3">
                      <v-chip small outlined color="primary">
                        <strong>Frame {{ index + 1 }}</strong>
                      </v-chip>
                    </v-col>

                    <!-- File Info -->
                    <v-col>
                      <div class="d-flex align-center">
                        <div class="flex-grow-1">
                          <v-tooltip bottom>
                            <template #activator="{ on, attrs }">
                              <div
                                v-bind="attrs"
                                v-on="on"
                                class="text-truncate font-weight-medium"
                                style="max-width: 250px"
                              >
                                {{ frame.name }}
                              </div>
                            </template>
                            <span>{{ frame.name }}</span>
                          </v-tooltip>
                          <div class="text-caption text--secondary">
                            {{ formatFileSize(frame.size) }} &bull; {{ getDisplayFileType(frame) }}
                          </div>
                        </div>
                      </div>
                    </v-col>

                    <!-- Status Chip -->
                    <v-col cols="auto" class="pr-3">
                      <v-chip :color="getStatusColor(getFileStatus(frame))" small text-color="white">
                        {{ getFileStatus(frame) }}
                      </v-chip>
                    </v-col>

                    <!-- Delete Action -->
                    <v-col cols="auto">
                      <v-btn color="error" icon small @click="removeFile(index)">
                        <v-icon small>mdi-delete</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </draggable>

            <!-- Helper Text -->
            <div v-if="allFrames.length > 1" class="text-caption text--secondary mt-2">
              <v-icon small color="grey">mdi-information</v-icon>
              Drag frames to reorder them. Frame indices will be automatically updated.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Validation Messages -->
    <v-row v-if="validationMessages.length > 0">
      <v-col cols="12">
        <v-alert v-for="(message, index) in validationMessages" :key="index" :type="message.type" dense class="mb-2">
          {{ message.text }}
        </v-alert>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'VolumeFrameUploader',
  components: {
    draggable,
  },
  props: {
    tissueType: {
      type: String,
      required: true,
    },
    expectedFrameCount: {
      type: Number,
      required: true,
    },
    existingFiles: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      allFrames: [], // Unified list of all frames (existing + new) with proper ordering
      existingFrames: [], // Original frames from API that already exist
      newFrames: [], // Newly selected files to upload
      removedFrameIds: [], // IDs of existing frames marked for deletion
      newFileSelection: [], // v-model for the file input
      isDragOver: false,
      validationMessages: [],
      nextTempId: 1, // For generating temporary IDs for new files
    }
  },
  computed: {
    isValidSelection() {
      return (
        this.allFrames.length === this.expectedFrameCount &&
        this.validationMessages.filter((m) => m.type === 'error').length === 0
      )
    },

    // For parent component - only return data that needs to be processed
    framesToUpload() {
      return this.newFrames
    },

    framesToDelete() {
      return this.removedFrameIds
    },
  },
  beforeDestroy() {
    // Clear file references to prevent memory leaks
    this.newFrames = []
    this.existingFrames = []
    this.removedFrameIds = []
  },
  mounted() {
    // Load existing files if provided - this will emit changes after loading
    this.loadExistingFiles()

    // Note: loadExistingFiles() now handles the initial emission,
    // so we don't need a separate emit here
  },
  watch: {
    existingFiles: {
      handler() {
        this.loadExistingFiles()
      },
      immediate: true,
    },
    expectedFrameCount() {
      this.validateFiles()
      this.emitChanges()
    },
    newFrames: {
      handler() {
        this.rebuildAllFrames()
        this.validateFiles()
        this.emitChanges()
      },
      deep: true,
    },
    removedFrameIds: {
      handler() {
        this.validateFiles()
        this.emitChanges()
      },
      deep: true,
    },
    allFrames: {
      handler() {
        this.validateFiles()
        this.emitChanges()
      },
      deep: true,
    },
  },
  methods: {
    // Handle drag end - update frame indices
    onDragEnd() {
      this.reindexFrames()
      this.validateFiles()
      this.emitChanges()
    },

    // Update frameIndex for all frames based on their position in the array
    reindexFrames() {
      this.allFrames.forEach((frame, index) => {
        frame.frameIndex = index
      })
    },

    // Rebuild the unified allFrames array from existing and new frames
    rebuildAllFrames() {
      // Get existing frames that aren't marked for deletion
      const existingActive = this.existingFrames
        .filter((frame) => !this.removedFrameIds.includes(frame.id))
        .sort((a, b) => (a.frameIndex || 0) - (b.frameIndex || 0))

      // Apply frame detection and ordering to new frames
      const newFramesOrdered = this.newFrames.length > 0 ? this.detectFrameOrder(this.newFrames) : []

      // Add temp IDs to new frames for Vue key tracking
      newFramesOrdered.forEach((frame) => {
        if (!frame.tempId) {
          frame.tempId = `temp_${this.nextTempId++}`
        }
      })

      // Combine all frames and reindex
      this.allFrames = [...existingActive, ...newFramesOrdered]
      this.reindexFrames()
    },

    emitChanges() {
      // Prevent emission during initialization to avoid loops
      if (!this._isInitialized) {
        this._isInitialized = true
      }

      // Extract new frames and existing frames from unified list
      const newFrames = this.allFrames.filter((frame) => !frame.id)
      const existingFrames = this.allFrames.filter((frame) => frame.id && !this.removedFrameIds.includes(frame.id))

      // Emit the current state to parent component
      this.$emit('files-changed', {
        tissueType: this.tissueType,
        newFrames: newFrames, // Files that need to be uploaded
        removedFrameIds: this.removedFrameIds, // IDs of existing frames to delete
        isValid: this.isValidSelection,
        allFrames: this.allFrames, // All frames with proper ordering
        existingFrames: existingFrames, // Existing frames with updated order
      })
    },

    loadExistingFiles() {
      // Handle undefined, null, or empty array
      if (Array.isArray(this.existingFiles) && this.existingFiles.length > 0) {
        // Store existing frames separately - they don't need conversion to File objects
        this.existingFrames = this.existingFiles.map((fileObj) => ({
          id: fileObj.id,
          name: fileObj.name,
          size: fileObj.size,
          type: fileObj.type,
          s3Url: fileObj.s3Url,
          uploadStatus: fileObj.uploadStatus,
          frameIndex: fileObj.frameIndex,
          isExisting: true,
        }))

        // Clear any removed frame IDs when reloading existing files
        this.removedFrameIds = []
      } else {
        // Clear existing frames if no files provided or undefined
        this.existingFrames = []
        this.removedFrameIds = []
      }

      // Rebuild the unified frames list
      this.rebuildAllFrames()

      // Validate and emit changes after loading (use nextTick to avoid watcher loops)
      this.$nextTick(() => {
        this.validateFiles()
        this.emitChanges()
      })
    },

    onFileSelect(files) {
      if (files) {
        // Add new files to newFrames array (not replacing existing ones)
        this.newFrames = [...files]
        this.rebuildAllFrames()
        this.validateFiles()
      }
    },

    onDragOver(e) {
      e.preventDefault()
      this.isDragOver = true
    },

    onDragLeave(e) {
      e.preventDefault()
      this.isDragOver = false
    },

    onDrop(e) {
      e.preventDefault()
      this.isDragOver = false
      const files = Array.from(e.dataTransfer.files)
      this.newFrames = [...this.newFrames, ...files]
      this.rebuildAllFrames()
      this.validateFiles()
    },

    validateFiles() {
      this.validationMessages = []

      const totalFrames = this.allFrames.length
      if (totalFrames === 0) {
        return
      }

      // Check file count
      if (totalFrames !== this.expectedFrameCount) {
        this.validationMessages.push({
          type: totalFrames > this.expectedFrameCount ? 'error' : 'warning',
          text: `Expected ${this.expectedFrameCount} files, but ${totalFrames} files available.`,
        })
      }

      // Check file types for new files only (ensure files have names before validation)
      const invalidNewFiles = this.newFrames.filter((file) => file && file.name && !this.isValidFileType(file))
      if (invalidNewFiles.length > 0) {
        this.validationMessages.push({
          type: 'error',
          text: `${invalidNewFiles.length} new file(s) have invalid format. Only .nii, .nii.gz, .dcm, and .dicom files are allowed.`,
        })
      }

      // Check for duplicates across all frames
      const fileNames = this.allFrames.map((f) => f.name)
      const duplicates = fileNames.filter((name, index) => fileNames.indexOf(name) !== index)
      if (duplicates.length > 0) {
        this.validationMessages.push({
          type: 'warning',
          text: `${duplicates.length} duplicate file name(s) detected.`,
        })
      }

      // Success message
      if (this.isValidSelection) {
        const newFileCount = this.newFrames.length
        const existingFileCount = this.existingFrames.length - this.removedFrameIds.length

        if (newFileCount > 0 && existingFileCount > 0) {
          this.validationMessages.push({
            type: 'success',
            text: `Ready: ${existingFileCount} existing files, ${newFileCount} new files to upload.`,
          })
        } else if (newFileCount > 0) {
          this.validationMessages.push({
            type: 'success',
            text: `Ready to upload ${newFileCount} new files.`,
          })
        } else if (existingFileCount > 0) {
          this.validationMessages.push({
            type: 'info',
            text: `${existingFileCount} existing files loaded.`,
          })
        }
      }
    },

    isValidFileType(file) {
      // Guard against undefined file or missing name
      if (!file || !file.name) {
        // For existing files with validation already done, assume valid
        if (file && file.isExisting) {
          return true
        }
        return false
      }

      const validExtensions = ['.nii', '.nii.gz', '.dcm', '.dicom']
      return validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    },

    getFileExtension(fileName) {
      if (!fileName || typeof fileName !== 'string') {
        return 'UNKNOWN'
      }
      return fileName.split('.').pop().toUpperCase()
    },

    getDisplayFileType(file) {
      // If we have a specific type that's not generic, use it
      if (file.type && file.type !== 'application/octet-stream') {
        return file.type
      }

      // Fall back to extension-based type for better display
      const extension = this.getFileExtension(file.name)
      if (extension && extension !== 'UNKNOWN') {
        return extension
      }

      // Last resort
      return file.type || 'Unknown'
    },

    getFileStatus(file) {
      // Check if this is a file marked for deletion
      if (file.id && this.removedFrameIds.includes(file.id)) {
        return 'To Delete'
      }

      if (file.isExisting || file.id) {
        return 'Existing'
      }

      if (!this.isValidFileType(file)) {
        return 'Invalid'
      }

      return 'New'
    },

    getStatusColor(status) {
      switch (status) {
        case 'New':
          return 'success' // Green for new files ready to upload
        case 'Existing':
          return 'primary' // Blue for existing files
        case 'To Delete':
          return 'error' // Red for files marked for deletion
        case 'Invalid':
          return 'error' // Red for invalid files
        case 'Uploading':
          return 'info' // Light blue for uploading
        case 'Ready':
          return 'success' // Green for ready files (backward compatibility)
        default:
          return 'grey'
      }
    },

    formatFileSize(bytes) {
      // Handle undefined or null
      if (bytes === undefined || bytes === null) {
        return 'Unknown Size'
      }

      // Convert string to number if needed
      let numBytes = bytes
      if (typeof bytes === 'string') {
        numBytes = parseInt(bytes, 10)
      }

      // Handle NaN or non-numeric values after conversion
      if (isNaN(numBytes) || typeof numBytes !== 'number') {
        return 'Unknown Size'
      }

      if (numBytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(numBytes) / Math.log(k))
      return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    removeFile(index) {
      const frameToRemove = this.allFrames[index]

      if (frameToRemove.id) {
        // This is an existing frame - mark for deletion
        this.removedFrameIds.push(frameToRemove.id)
        // Remove from existingFrames array
        const existingIndex = this.existingFrames.findIndex((f) => f.id === frameToRemove.id)
        if (existingIndex >= 0) {
          this.existingFrames.splice(existingIndex, 1)
        }
      } else {
        // This is a new frame - remove from newFrames array
        const newFrameIndex = this.newFrames.findIndex(
          (f) =>
            (f.tempId && f.tempId === frameToRemove.tempId) ||
            (f.name === frameToRemove.name && f.size === frameToRemove.size)
        )
        if (newFrameIndex >= 0) {
          this.newFrames.splice(newFrameIndex, 1)
          // Also update the file input selection
          if (this.newFileSelection[newFrameIndex]) {
            this.newFileSelection.splice(newFrameIndex, 1)
          }
        }
      }

      // Remove from unified list and reindex remaining frames
      this.allFrames.splice(index, 1)
      this.reindexFrames()
      this.validateFiles()
    },

    clearFiles() {
      // Clear new files
      this.newFrames = []
      this.newFileSelection = []

      // Mark all existing files for deletion
      this.removedFrameIds = this.existingFrames.map((frame) => frame.id)

      // Clear unified list
      this.allFrames = []

      this.validationMessages = []
    },

    // Smart frame detection methods
    detectFrameOrder(files) {
      const filesWithFrames = files.map((file) => ({
        // Explicitly preserve File object properties (spread doesn't work on File objects)
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        // Add frame detection properties
        frameIndex: this.extractFrameNumber(file.name),
        originalName: file.name,
        // Keep reference to original file object if needed
        originalFile: file,
        // Add any other properties that might exist
        ...file,
      }))

      // Sort by detected frame numbers, fall back to original order
      return filesWithFrames.sort((a, b) => {
        if (a.frameIndex !== null && b.frameIndex !== null) {
          return a.frameIndex - b.frameIndex
        }
        if (a.frameIndex !== null) return -1
        if (b.frameIndex !== null) return 1
        return 0 // Keep original order for files without detected frame numbers
      })
    },

    extractFrameNumber(filename) {
      const patterns = [
        /frame[_-]?(\d+)/i, // frame_001, frame-1, frame1
        /[_-](\d+)\.\w+$/, // file_001.nii, scan_050.dcm
        /\((\d+)\)/, // file(1).nii, scan(23).dcm
        /^(\d+)[_-]/, // 001_file.nii, 05-scan.dcm
        /(\d+)(?=\.\w+$)/, // file001.nii (number at end before extension)
      ]

      for (const pattern of patterns) {
        const match = filename.match(pattern)
        if (match) {
          return parseInt(match[1], 10)
        }
      }
      return null // No frame number detected
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
  },
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.upload-area.drag-over {
  border-color: #1976d2;
  background-color: #f3f7ff;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Frame card styling */
.frame-card {
  transition: all 0.2s ease;
  cursor: default;
}

.frame-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Drag handle styling */
.drag-handle {
  cursor: grab;
  transition: color 0.2s ease;
}

.drag-handle:hover {
  color: #1976d2 !important;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle.drag-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.frame-card.drag-disabled {
  opacity: 0.7;
}

/* Sortable ghost styling */
.sortable-ghost {
  opacity: 0.5;
  transform: rotate(2deg);
}

/* Sortable chosen styling */
.sortable-chosen {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Sortable drag styling */
.sortable-drag {
  opacity: 0.8;
  transform: rotate(-2deg);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}
</style>
