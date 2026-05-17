<template>
  <tr>
    <td class="text-left">
      <TranslatedContent type="region" :record="region" :lookup="{ type: 'nestedKey', path: 'name' }" />
    </td>
    <td></td>
    <td></td>
    <td>
      <div class="lock-container">
        <div class="lock-text">
          <div class="lock-text" v-if="region.locked">{{ $t('global.locked') }}</div>
          <div class="lock-text" v-else>{{ $t('global.unlocked') }}</div>
        </div>
        <div class="lock-text">
          <v-switch :input-value="!region.locked" :disabled="isUpdating" :loading="isUpdating" @change="toggle" />
        </div>
      </div>
    </td>
  </tr>
</template>

<script>
import { mapState } from 'vuex'
import TranslatedContent from '@/components/TranslatedContent'

export default {
  name: 'CohortExamTableRegion',
  components: {
    TranslatedContent,
  },
  props: {
    region: {
      type: Object,
      required: true,
    },
    isUpdating: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {}
  },
  computed: {
    ...mapState('user', ['isAdmin']),
  },
  methods: {
    toggle() {
      this.$emit('toggleRegion', this.region)
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
