// changeHandler.js
import { debounce } from 'lodash'

export const AsyncChangeHandlerMixin = {
  data() {
    return {
      showConfirmDialog: false,
      changeQueue: [],
      currentChangeGroup: null,
      pendingChanges: {},
      activeCollectionId: null,
      collectionTimeout: null,
      isProcessingChanges: false,
      changeFromLabel: '',
      changeFromOldValue: null,
      changeFromNewValue: null,
      changeToLabel: '',
      changeToOldValue: null,
      changeToNewValue: null,
      isChangeValueCanceled: false,
      isUndoingChange: false,
      isDialogKeyboardReady: false,
      keyboardActivationTimeout: null,
    }
  },

  computed: {
    groupedChanges() {
      if (!this.currentChangeGroup) return {}

      return this.currentChangeGroup.reduce((acc, change) => {
        const sourceKey = change.changeFromLabel

        if (!acc[sourceKey]) {
          // Initialize the group with the first change
          acc[sourceKey] = {
            sourceChange: {
              oldValue: change.changeFromOldValue,
              newValue: change.changeFromNewValue,
            },
            affectedChanges: [],
          }
        }

        // Only add to affected changes if there's a "to" change
        if (change.changeToLabel && change.changeToOldValue !== change.changeToNewValue) {
          acc[sourceKey].affectedChanges.push({
            label: change.changeToLabel,
            oldValue: change.changeToOldValue,
            newValue: change.changeToNewValue,
          })
        }

        return acc
      }, {})
    },
  },

  methods: {
    handleKeydown(event) {
      if (!this.showConfirmDialog || !this.isDialogKeyboardReady) return

      if (event.key === 'Enter') {
        event.preventDefault()
        this.confirmChange()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        this.cancelChange()
      }
    },

    queueChange(changeData) {
      const now = Date.now()

      // If there's an active collection within the last 100ms, add to it
      if (this.activeCollectionId && now - this.activeCollectionId < 1000) {
        if (!this.pendingChanges[this.activeCollectionId]) {
          this.pendingChanges[this.activeCollectionId] = []
        }
        this.pendingChanges[this.activeCollectionId].push(changeData)
      } else {
        // Start a new collection
        this.activeCollectionId = now
        this.pendingChanges[this.activeCollectionId] = [changeData]
      }

      // Clear any existing timeout
      if (this.collectionTimeout) {
        clearTimeout(this.collectionTimeout)
      }

      // Set timeout to process this collection
      this.collectionTimeout = setTimeout(() => {
        this.processCollection(this.activeCollectionId)
      }, 150)
      console.log('pending changes', this.pendingChanges)
    },

    processCollection(collectionId) {
      if (!this.pendingChanges[collectionId]) return

      const changes = this.pendingChanges[collectionId]
      delete this.pendingChanges[collectionId]

      if (changes.length > 0) {
        this.changeQueue.push(changes)
        if (!this.isProcessingChanges) {
          this.debouncedShowConfirmDialog()
        }
      }

      if (collectionId === this.activeCollectionId) {
        this.activeCollectionId = null
      }
    },

    debouncedShowConfirmDialog: debounce(function () {
      console.log('show confirm outside')
      if (this.changeQueue.length > 0 && !this.showConfirmDialog) {
        console.log('show confirm inside')
        this.isProcessingChanges = true
        this.currentChangeGroup = this.changeQueue.shift()
        this.showConfirmDialog = true
        console.log('show confirm dialog:', this.showConfirmDialog)

        // Set primary change for compatibility with existing code
        const primaryChange = this.currentChangeGroup[0]
        this.changeFromLabel = primaryChange.changeFromLabel
        this.changeFromOldValue = primaryChange.changeFromOldValue
        this.changeFromNewValue = primaryChange.changeFromNewValue
        this.changeToLabel = primaryChange.changeToLabel
        this.changeToOldValue = primaryChange.changeToOldValue
        this.changeToNewValue = primaryChange.changeToNewValue

        // Add keyboard listener
        window.addEventListener('keydown', this.handleKeydown)

        // Enable keyboard after 300ms delay to prevent accidental confirmations
        this.isDialogKeyboardReady = false
        this.keyboardActivationTimeout = setTimeout(() => {
          this.isDialogKeyboardReady = true
        }, 300)
      }
    }, 250),

    formatValue(value) {
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No'
      }
      return value
    },

    cancelChange() {
      if (!this.currentChangeGroup) return

      // Apply changes in reverse order
      for (let i = this.currentChangeGroup.length - 1; i >= 0; i--) {
        const change = this.currentChangeGroup[i]
        this.applyUndoChange(change)
      }

      this.isChangeValueCanceled = true
      this.showConfirmDialog = false
      this.currentChangeGroup = null
      this.isProcessingChanges = false

      // Clean up keyboard handling
      this.cleanupKeyboardHandling()

      this.$nextTick(() => {
        this.debouncedShowConfirmDialog()
      })
    },

    applyUndoChange(change) {
      this.isUndoingChange = true

      try {
        switch (change.changeFromLabel) {
          case this.$t('SelectionConfigForm.concatenations'):
            this.concatenations = change.changeFromOldValue
            this.repetitionTime = change.changeToOldValue
            break

          case this.$t('SelectionConfigForm.repetition_time'):
            this.repetitionTime = change.changeFromOldValue
            if (change.changeToLabel === this.$t('SelectionConfigForm.concatenations')) {
              this.concatenations = change.changeToOldValue
            }
            break

          case this.$t('global.number_of_slices'):
            this.repetitionTime = change.changeToOldValue
            this.numberOfSlices = change.changeFromOldValue
            this.submitNumberOfSlices()
            break

          case this.$t('SelectionConfigForm.inversion_recovery'):
            this.repetitionTime = change.changeToOldValue
            this.inversionTime = change.changeFromOldValue
            break

          case this.$t('SelectionConfigForm.fat_saturation'):
            this.repetitionTime = change.changeToOldValue
            this.fatSuppression = change.changeFromOldValue
            break

          case this.$t('SelectionConfigForm.sequence_type'):
            this.repetitionTime = change.changeToOldValue
            this.selectionConfig.sequenceType = change.changeFromOldValue
            this.changeSequenceType()
            break

          case this.$t('SelectionConfigForm.gradient_ramp'): {
            if (change.changeToLabel === this.$t('SelectionConfigForm.repetition_time')) {
              this.repetitionTime = change.changeToOldValue
            } else if (change.changeToLabel === this.$t('SelectionConfigForm.echo_time')) {
              this.echoTime = change.changeToOldValue
            }
            this.gradientRamp = this.convertGradientRampDisplayTextToInternal(change.changeFromOldValue)
            break
          }

          case this.$t('SelectionConfigForm.rf_pulsing'): {
            if (change.changeToLabel === this.$t('SelectionConfigForm.repetition_time')) {
              this.repetitionTime = change.changeToOldValue
            } else if (change.changeToLabel === this.$t('SelectionConfigForm.echo_time')) {
              this.echoTime = change.changeToOldValue
            }
            this.rfPulsing = this.convertRFPulsingDisplayTextToInternal(change.changeFromOldValue)
            break
          }

          case this.$t('SelectionConfigForm.echo_spacing'): {
            if (change.changeToLabel === this.$t('SelectionConfigForm.echo_time')) {
              this.echoTime = change.changeToOldValue
            } else if (change.changeToLabel === this.$t('SelectionConfigForm.repetition_time')) {
              this.repetitionTime = change.changeToOldValue
            }
            this.echoSpacing = change.changeFromOldValue
            break
          }

          case this.$t('SelectionConfigForm.echo_time'): {
            // Revert echo time to old value
            this.echoTime = change.changeFromOldValue
            // If TR was also changed, revert it too
            if (change.changeToLabel === this.$t('SelectionConfigForm.repetition_time')) {
              this.repetitionTime = change.changeToOldValue
            }
            break
          }

          case this.$t('SelectionConfigForm.receiver_bandwidth'): {
            if (change.changeToLabel === this.$t('SelectionConfigForm.repetition_time')) {
              this.repetitionTime = change.changeToOldValue
              this.receiverBandWidth = change.changeFromOldValue
            } else if (change.changeToLabel === this.$t('SelectionConfigForm.echo_time')) {
              this.echoTime = change.changeToOldValue
              this.receiverBandWidth = change.changeFromOldValue
            }
            break
          }

          case this.labels.echoTrainLabel[this.vendorStylePreferenceLocal]: {
            if (change.changeToLabel === this.$t('SelectionConfigForm.repetition_time')) {
              this.repetitionTime = change.changeToOldValue
              this.echoTrainLength = change.changeFromOldValue
            }
            break
          }
        }
      } finally {
        this.$nextTick(() => {
          this.isUndoingChange = false
        })
      }
    },

    confirmChange() {
      this.showConfirmDialog = false
      this.currentChangeGroup = null
      this.isProcessingChanges = false

      // Clean up keyboard handling
      this.cleanupKeyboardHandling()

      this.$nextTick(() => {
        this.debouncedShowConfirmDialog()
      })
    },

    cleanupKeyboardHandling() {
      // Clear timeout if still pending
      if (this.keyboardActivationTimeout) {
        clearTimeout(this.keyboardActivationTimeout)
        this.keyboardActivationTimeout = null
      }

      // Remove keyboard listener
      window.removeEventListener('keydown', this.handleKeydown)
      this.isDialogKeyboardReady = false
    },
  },

  beforeDestroy() {
    if (this.collectionTimeout) {
      clearTimeout(this.collectionTimeout)
    }
    // Clean up keyboard handling on component destroy
    this.cleanupKeyboardHandling()
  },
  watch: {
    showConfirmDialog(val) {
      console.log('show Confirm Dialog changed: ', val)
    },
  },
  mounted() {
    console.log('show confirm mounted')
  },
}
