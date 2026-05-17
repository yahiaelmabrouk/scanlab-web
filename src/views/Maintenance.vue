<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div class="container">
    <div class="icon">🔧</div>
    <h1>{{ $t('global.under_maintenance') }}</h1>
    <p>{{ $t('global.under_maintenance_message') }}</p>
    <p>{{ $t('global.under_maintenance_description') }}</p>
  </div>
</template>
<script>
export default {
  name: 'Maintenance',
}
</script>
<style lang="scss" scoped>
.container {
  max-width: 900px;
  padding: 20px;
  margin: auto;
}
h1 {
  font-size: 2.5em;
  margin-bottom: 20px;
}
p {
  font-size: 1.2em;
  line-height: 1.5;
}
.icon {
  font-size: 3em;
  margin-bottom: 20px;
}
</style>
