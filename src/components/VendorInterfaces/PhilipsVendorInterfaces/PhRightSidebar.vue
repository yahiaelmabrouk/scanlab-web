<template>
  <div class="expand">
    <!-- <ExpansionBar />
    <ExpansionBar /> -->
  </div>
</template>

<script>
import ExpansionBar from './PhExpansionBar'
export default {
  components: {
    // eslint-disable-next-line vue/no-unused-components
    ExpansionBar,
  },
}
</script>
<style>
.expand {
  height: 100%;
  background: black !important;
  border: 1px solid #5a5252;
  border-width: thin;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
</style>
