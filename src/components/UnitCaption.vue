<template>
  <span>{{ unit }}</span>
</template>

<script>
export default {
  name: 'UnitCaption',
  props: {
    unit: {
      type: String,
      required: true,
    },
  },
}
</script>
<style scoped lang="scss">
span {
  align-self: center;
  font-size: 0.6rem;
  color: rgba(0, 0, 0, 0.6) !important;
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
}
</style>
