<template>
  <div class="expand">
    <!-- <GEExpansionBar />
    <GEExpansionBar /> -->
  </div>
</template>

<script>
import GEExpansionBar from './GEExpansionBar'
export default {
  components: {
    GEExpansionBar,
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
