<template>
  <img
    v-if="store.hasPaintStain(i, j)"
    :src="paintStain"
    :style="paintEffectStyle"
    class="paint-stain"
    alt=""
    decoding="async"
    draggable="false"
  />
  <img
    v-if="shouldRenderExplosion"
    :key="explosionVersion"
    :src="paintExplosion"
    :style="paintEffectStyle"
    class="paint-explosion"
    alt=""
    decoding="async"
    draggable="false"
  />
</template>

<script>
import { defineComponent } from "vue";
import { useAppStore } from "@/stores/app";
import paintExplosion from "@/assets/paint-explosion.gif";
import paintStain from "@/assets/paint-stain.png";

export default defineComponent({
  name: "ExplosionTile",
  props: {
    i: Number,
    j: Number,
  },
  setup() {
    const store = useAppStore();
    return { paintExplosion, paintStain, store };
  },
  computed: {
    explosionVersion() {
      return this.store.getPaintExplosionVersion(this.i, this.j);
    },
    shouldRenderExplosion() {
      return this.explosionVersion && !this.store.getShowPrizeVideo();
    },
    paintEffectStyle() {
      return {
        top: `calc((${this.i} - 1) * 100% / ${this.store.getHeight()})`,
        left: `calc((${this.j} - 1) * 100% / ${this.store.getWidth()})`,
        width: `calc(3 * 100% / ${this.store.getWidth()})`,
        height: `calc(3 * 100% / ${this.store.getHeight()})`,
      };
    },
  },
});
</script>

<style scoped>
.paint-stain,
.paint-explosion {
  position: absolute;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.paint-stain {
  z-index: 4;
}

.paint-explosion {
  z-index: 5;
}
</style>
