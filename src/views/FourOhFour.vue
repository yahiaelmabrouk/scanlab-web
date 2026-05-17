<template>
  <div class="container">
    <div class="row justify-content-md-center">
      <div class="col-md-auto">
        <p>{{ $t('global.404', languageCode) }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'FourOhFour',
  computed: {
    ...mapGetters('user', ['languageCode']),
  },
}
</script>
