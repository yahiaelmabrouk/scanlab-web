<template>
  <div class="title-card" :class="borderColor">
    <v-row>
      <v-col class="pl-0" sm="2">
        <img class="card-img" :src="imgFile" :alt="title" />
      </v-col>
      <v-col class="card-copy" sm="10">
        <div class="titles">
          <h3 class="card-info-title">
            {{ title }}
          </h3>
        </div>
        <div class="card-line" :class="getGradient(borderColor)"></div>
        {{ body }}
        <slot v-if="!body" name="card-body"></slot>
      </v-col>
      <div class="card-line-border" :class="getGradient(borderColor)"></div>
    </v-row>
  </div>
</template>
<script>
export default {
  name: 'PageTitleCard',
  props: {
    imgFile: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: true,
    },
    borderColor: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      gradientColor: '',
    }
  },
  methods: {
    getGradient(borderColor) {
      let [color] = borderColor.split('-')
      return `gradient-${color}`
    },
  },
}
</script>
<style scoped lang="scss">
.title-card {
  position: relative;
  border-radius: 0 1rem;
  padding: 1rem 2rem;
  width: 100%;
  background-color: $white;
  box-shadow: 0 0 0.5rem $gray-two;
  margin-top: 1rem;
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
  left: 12px;
  width: 99%;
  margin: 0;
}
.card-img {
  height: 8rem;
  width: 8rem;
  border-radius: 50%;
  margin: auto;
}

.card-info-title {
  flex: 1;
  padding: 0;
}

.titles {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.test-title {
  flex-grow: 2;
  text-align: right;
  align-self: flex-end;
}
</style>
