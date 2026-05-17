<template>
  <TitleAndAside :title="user.legalName" />
</template>

<script>
import TitleAndAside from './TitleAndAside'

export default {
  name: 'StudentHeader',
  components: { TitleAndAside },
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
}
</script>

<style scoped lang="scss"></style>
