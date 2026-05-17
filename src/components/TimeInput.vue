<template>
  <div class="timer-input-container">
    <img class="timer-input-icon" src="@/assets/icon-timer.png" />
    <input class="timer-input" type="number" v-model="value.minute" min="0" max="59" @change="onChangeMinute" />
    <span>:</span>
    <input class="timer-input" type="number" v-model="value.second" min="0" max="59" @change="onChangeSecond" />
  </div>
</template>

<script>
export default {
  name: 'TimerInput',
  props: {
    value: {
      type: Object,
      default: null,
      required: true,
    },
  },
  data() {
    return {}
  },
  async mounted() {},
  methods: {
    onChangeMinute(e) {
      this.$emit('input', { minute: e.target.value, second: this.value.second })
    },
    onChangeSecond(e) {
      this.$emit('input', { minute: this.value.minute, second: e.target.value })
    },
  },
}
</script>

<style scoped lang="scss">
.timer-input-container {
  display: flex;
  align-items: center;
  .timer-input-icon {
    margin-right: 5px;
  }
  .timer-input {
    border: 1px solid black;
    width: 50px;
  }
}
</style>
