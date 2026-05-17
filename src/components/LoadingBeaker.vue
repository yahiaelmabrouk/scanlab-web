<template>
  <div id="loading-beaker">
    <div id="image">
      <img src="@/assets/gif/loading-beaker.gif" />
    </div>
    <span v-if="isShowPercent" id="text">{{ loadingPercentage | percentage }}</span>
    <span v-if="loadingText" id="text">{{ loadingText }}</span>
  </div>
</template>

<style lang="scss">
#loading-beaker {
  #image {
    width: 200px;
    margin: 10px auto;
  }

  #text {
    font-size: 1.5em;
  }
}
</style>

<script>
export default {
  props: {
    loadingPercentage: {
      type: Number,
      default: null,
    },
    isShowPercent: {
      type: Boolean,
      required: false,
      default: true,
    },
    loadingText: {
      type: String,
      required: false,
      default: '',
    },
  },
  filters: {
    percentage(value) {
      if (value == null || typeof value !== 'number') {
        return ''
      }

      // According to the DICOM loader, we cap the percentage at 99.
      const formattedNumber = Math.min(Math.floor(value), 99)
      return formattedNumber + '%'
    },
  },
}
</script>
