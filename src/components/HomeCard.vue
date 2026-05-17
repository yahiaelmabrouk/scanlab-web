<template>
  <div class="home-card" :class="borderColor">
    <v-row class="m-0">
      <v-col class="px-0" sm="12">
        <div class="d-flex align-start" v-if="imgFile">
          <img class="card-img" :src="imgFile" :alt="title" />
        </div>
        <div class="titles d-flex align-start">
          <h1 class="card-info-title">
            {{ title }}
          </h1>
        </div>
        <div class="card-line" :class="getGradient(borderColor)"></div>
        <div class="d-flex align-start">{{ body }}</div>
        <slot name="card-bottom"></slot>
      </v-col>
      <div class="card-line-border" :class="getGradient(borderColor)"></div>
    </v-row>
  </div>
</template>
<script>
export default {
  name: 'HomeCard',
  props: {
    imgFile: {
      type: String,
      required: false,
      default: '',
    },
    title: {
      type: String,
      required: true,
    },
    // TODO: require body and add copy when its ready
    body: {
      type: String,
      required: false,
      default: '',
    },
    borderColor: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      gradientColor: '',
    }
  },
  methods: {
    getGradient(borderColor) {
      switch (borderColor) {
        case 'blue-border':
          return (this.gradientColor = 'gradient-blue')
        case 'green-border':
          return (this.gradientColor = 'gradient-green')
        case 'pink-border':
          return (this.gradientColor = 'gradient-pink')
        case 'gray-border':
          return (this.gradientColor = 'gradient-gray')
      }
    },
  },
}
</script>
<style scoped lang="scss">
.home-card {
  position: relative;
  border-radius: 0 1rem;
  padding: 3rem 1.5rem;
  background-color: $white;
  box-shadow: 0 0 0.5rem $gray-two;
  margin: 1rem;
  text-align: left;
  width: 380px;
}

.card-copy {
  text-align: left;
}
.card-line {
  padding: 1px;
  margin: 1rem 0 1.5rem 0;
}
.card-line-border {
  padding: 1px;
  margin: 1rem 0 2rem 0;
  position: absolute;
  bottom: -2px;
  left: 2%;
  width: 98%;
  margin: 0;
}
.card-img {
  height: 7.5rem;
  width: auto;
  border-radius: 50%;
  margin-bottom: 2rem;
}

.card-info-title {
  flex: 1;
  font-size: 2rem;
}

.titles {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
</style>
