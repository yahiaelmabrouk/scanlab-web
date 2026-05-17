<template>
  <div class="header">
    <h2>{{ title }}</h2>
    <aside class="aside">
      <slot name="aside"></slot>
    </aside>
  </div>
</template>

<script>
export default {
  name: 'TitleAndAside',
  components: {},
  props: {
    title: {
      type: String,
      required: true,
    },
  },
}
</script>

<style scoped lang="scss">
.header {
  align-items: center;
  background-color: #fff;
  border-bottom: 2px solid $ocean;
  border-left: 2px solid $ocean;
  border-bottom-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0px 0px 10px rgba(11, 49, 51, 0.25);
  display: flex;
  justify-content: space-between;
  margin: 20px 0 40px;
  padding: 24px 30px;
}

h2 {
  margin: 0;
  padding: 0;
}
</style>
