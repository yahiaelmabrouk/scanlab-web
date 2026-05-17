<template>
  <div class="section">
    <h4 class="title" v-if="title">{{ title }}</h4>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'PageSection',
  props: {
    title: {
      type: String,
      required: false,
      default: null,
    },
  },
}
</script>

<style scoped lang="scss">
.section {
  background-color: #fff;
  border-bottom-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0px 0px 10px rgba(11, 49, 51, 0.25);
  margin: 40px 0 40px;
  padding: 24px 24px;
}

.title {
  border-bottom: 1px solid #000;
  text-align: left;
}
</style>
