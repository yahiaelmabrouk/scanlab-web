<template>
  <div>
    <div class="d-flex flex-column align-start title">
      <slot name="title"></slot>
    </div>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'StatisticsContainer',
}
</script>

<style scoped lang="scss">
.title {
  padding-top: 20px;
  margin-left: 12px;
}
</style>
