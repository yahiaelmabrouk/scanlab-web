<!-- CustomTable.vue -->
<template>
  <div class="table">
    <div class="table-header" v-for="header in headers" :key="header">{{ header }}</div>
    <div v-for="(row, index) in rows" :key="index" class="table-row">
      <div>{{ row[0] }}</div>
      <div>{{ row[1] }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    headers: {
      type: Array,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
  },
}
</script>

<style scoped>
.table {
  width: 100%;
  border: 1px solid gray;
  background-color: white;
  margin-bottom: 10px;
}
.table-header {
  font-weight: bold;
  padding: 5px;
  background-color: #e0e0e0;
  box-shadow: none;
  text-shadow: none;
}
.table-row {
  display: flex;
  justify-content: space-between;
  padding: 5px;
  font-size: 12px;
}
</style>
