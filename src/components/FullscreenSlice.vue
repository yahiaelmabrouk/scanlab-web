<template>
  <div id="fullscreen_slice" class="fullscreen-slice" :class="isFullscreen ? '' : 'hidden'">
    <div v-if="!isLoaded">{{ $t('global.loading_ellipsis') }}</div>
    <div class="fullscreen-slice-view-holder" v-else>
      <!-- TODO This needs to get unloaded when navigating away from MRIView / between Edit mode and not (because the stack-volome-selections will exist min/max/promised or just promised, and it won't switch back and forth -->
      <!-- TODO ... so if you go to View, and then Edit, and try to go full screen, you see no slice lines; vice versa: you see three sets of lines you can't change -->
      <SliceView view-orientation="z" :am-fullscreen="true" />
    </div>
  </div>
</template>

<script>
// @ is an alias to /src

import { mapState } from 'vuex'
import SliceView from '@/components/SliceView'

export default {
  name: 'FullscreenSlice',
  components: {
    SliceView,
  },
  data() {
    return {}
  },
  computed: {
    ...mapState('dicomService', ['isLoaded']),
    ...mapState('selectionConfig', ['isFullscreen']),
  },
  methods: {},
}
</script>

<style lang="scss">
.fullscreen-slice {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: #fff;
  background-size: cover;
  z-index: 1000;
  overflow: hidden;
}

#fullscreen_slice_render {
  width: 100%;
  height: 100%;
}

.fullscreen-exit-button {
  svg:hover {
    path {
      fill: white;
    }
  }
}

.fullscreen-slice-view-holder {
  width: 100%;
  height: 100%;
  .box {
    canvas {
      width: 100vw;
      // Fix: Can't get correct intersect point on full screen mode
      // min-height: calc(100vmin - 45px - 38px);
      object-fit: cover;
    }
  }
}
</style>
