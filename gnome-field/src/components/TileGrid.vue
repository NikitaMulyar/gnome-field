<template>
  <div
    class="tile-grid"
    @mousemove="handleMouseMove"
    @mouseleave="clearHover"
  >
    <div v-for="i in width * height" :key="i" class="tile-slot">
      <SingleTile :i="Math.floor((i - 1) / width)" :j="(i - 1) % width" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useAppStore } from "@/stores/app";

export default defineComponent({
  name: "TileGrid",
  setup() {
    const store = useAppStore();
    return { store };
  },
  computed: {
    width() {
      return this.store.getWidth();
    },
    height() {
      return this.store.getHeight();
    },
  },
  data: () => ({
    hoverI: -1,
    hoverJ: -1,
  }),
  methods: {
    handleMouseMove(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const nextJ = Math.min(
        this.width - 1,
        Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * this.width))
      );
      const nextI = Math.min(
        this.height - 1,
        Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * this.height))
      );

      if (nextI == this.hoverI && nextJ == this.hoverJ) return;

      this.hoverI = nextI;
      this.hoverJ = nextJ;
      this.updateFrameHover(nextI, nextJ);
    },
    clearHover() {
      this.hoverI = -1;
      this.hoverJ = -1;

      const frame = this.$el.closest(".field-frame");
      if (!frame) return;
      frame.classList.remove("is-cell-hovered");
    },
    updateFrameHover(i, j) {
      const frame = this.$el.closest(".field-frame");
      if (!frame) return;

      frame.style.setProperty("--hover-frame-row", i + 1);
      frame.style.setProperty("--hover-frame-column", j + 1);
      frame.classList.add("is-cell-hovered");
    },
  },
});
</script>

<style scoped>
.tile-grid {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(v-bind("width"), calc(100% / v-bind("width")));
  grid-template-rows: repeat(v-bind("height"), calc(100% / v-bind("height")));
}

.tile-slot {
  position: relative;
  z-index: 2;
  min-width: 0;
  min-height: 0;
}

</style>
