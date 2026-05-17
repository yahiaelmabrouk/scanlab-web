<template>
  <tr>
    <td class="text-left">
      {{
        $te(`CriticalThinkingCategory.${category.name}`)
          ? $t(`CriticalThinkingCategory.${category.name}`)
          : category.name
      }}
    </td>
    <td>
      <RangeSlider
        :value="difficulty"
        :min="1"
        :max="5"
        :disabled="!isUnlocked"
        @change="updateDifficulty"
      ></RangeSlider>
    </td>
    <td class="lock-container">
      <div class="lock-text" v-if="!isUnlocked">{{ $t('global.locked') }}</div>
      <div class="lock-text" v-else>{{ $t('global.unlocked') }}</div>
      <v-switch v-model="isUnlocked" @change="updateLocked" />
    </td>
  </tr>
</template>

<script>
import { mapGetters } from 'vuex'
import RangeSlider from './Controls/RangeSlider.vue'
export default {
  name: 'CohortExamTableCategory',
  components: {
    RangeSlider,
  },
  props: {
    category: {
      type: Object,
      required: true,
    },
  },
  data: function () {
    return {
      isUnlocked: !this.category.locked,
      difficulty: [this.category.minDifficulty, this.category.maxDifficulty],
    }
  },
  watch: {
    category: {
      deep: true,
      handler(category) {
        this.isUnlocked = !category.locked
        this.difficulty = [category.minDifficulty, category.maxDifficulty]
      },
    },
  },
  computed: {
    ...mapGetters('user', ['languageCode']),
  },
  methods: {
    update() {
      this.$emit('update', this.category)
    },
    updateDifficulty(difficulty) {
      this.category.minDifficulty = difficulty[0]
      this.category.maxDifficulty = difficulty[1]
      this.difficulty = difficulty
      this.update()
    },
    updateLocked(isUnlocked) {
      this.category.locked = !isUnlocked
      this.update()
    },
  },
}
</script>

<style scoped lang="scss">
.lock-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

.lock-text {
  margin-right: 15px;
}
</style>
