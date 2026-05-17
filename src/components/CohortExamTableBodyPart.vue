<template>
  <tr>
    <td v-if="!isShowOnFirtTableCell"></td>
    <td class="text-left">
      <TranslatedContent type="bodyPart" :record="bodyPart" :lookup="{ type: 'nestedKey', path: 'name' }" />
    </td>
    <td v-if="isShowOnFirtTableCell"></td>
    <td>
      <div v-if="isSandboxEnabledByAdmin" class="lock-container">
        <div class="lock-text">{{ $t('global.sandbox') }}</div>
        <v-switch
          :input-value="bodyPart.isSandbox"
          :disabled="bodyPart.locked || !isSandboxEnabledByAdmin || isUpdating"
          :loading="isUpdating"
          @change="toggleSandbox($event)"
        />
      </div>
    </td>
    <td>
      <div class="lock-container">
        <div>
          <div class="lock-text" v-if="bodyPart.locked">{{ $t('global.locked') }}</div>
          <div class="lock-text" v-else>{{ $t('global.unlocked') }}</div>
        </div>
        <v-switch
          :disabled="region.locked || isUpdating"
          :loading="isUpdating"
          :input-value="!bodyPart.locked"
          @change="$emit('toggle-bodypart-lock', bodyPart)"
        />
      </div>
    </td>
  </tr>
</template>

<script>
import TranslatedContent from '@/components/TranslatedContent'

export default {
  name: 'CohortExamTableBodyPart',
  components: {
    TranslatedContent,
  },
  props: {
    bodyPart: {
      type: Object,
      required: true,
    },
    region: {
      type: Object,
      required: true,
    },
    isSandboxEnabledByAdmin: {
      type: Boolean,
      required: false,
    },
    isShowOnFirtTableCell: {
      type: Boolean,
      required: false,
      default: false,
    },
    isUpdating: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  watch: {
    'bodyPart.locked': {
      handler: 'onBodyPartLockedChanged',
    },
  },
  methods: {
    toggleSandbox(newValue) {
      if (this.isSandboxEnabledByAdmin) {
        this.$emit('toggle-bodypart-sandbox', { ...this.bodyPart, targetSandboxState: newValue })
      }
    },
    onBodyPartLockedChanged() {
      if (this.bodyPart.locked && this.bodyPart.isSandbox) {
        this.toggleSandbox(false)
      }
    },
  },
}
</script>

<style scoped lang="scss">
.lock-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.lock-text {
  margin-right: 15px;
}
</style>
