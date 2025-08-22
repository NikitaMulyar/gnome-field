<template>
  <div @click="tap" @mouseover="mouseOver" class="tile"></div>
</template>

<script>
import { defineComponent } from "vue";
import { useAppStore, TileVisibility } from "@/stores/app";

export default defineComponent({
  name: "SingleTile",
  props: {
    i: Number,
    j: Number,
  },
  setup() {
    const store = useAppStore();
    return { store };
  },
  computed: {
    opacity() {
      const visibility = this.store.getTile(this.i, this.j).visibility;
      let opacity;
      switch (visibility) {
        case TileVisibility.Closed:
          opacity = 1;
          break;
        case TileVisibility.Opened:
          opacity = 0;
          break;
        case TileVisibility.Revealed:
          opacity = 0.5;
          break;
        case TileVisibility.Scanned:
          opacity = 0.3;
          break;
        default:
          opacity = 0;
      }

      if (this.i == this.store.mouseI - 1 || this.j == this.store.mouseJ - 1)
        opacity = Math.max(0.3, opacity);

      return opacity;
    },
    color() {
      const visibility = this.store.getTile(this.i, this.j).visibility;
      const availability = this.store.isAvailable(this.i, this.j);

      const target = this.store.getTarget();
      let distToTarget = ((this.i - target.i) ** 2 + (this.j - target.j) ** 2) ** 0.5;
      if (distToTarget > 10) distToTarget = 10000;
      const normDistToTarget = Math.min(1 - (distToTarget / 10), 0.5);

      let closedColor = `rgb(${normDistToTarget * 200}, ${normDistToTarget * 255}, ${normDistToTarget * 200})`;

      let color;
      if (visibility == TileVisibility.Scanned)
        color = availability ? "#ff00ff" : "#2e002e";
      else color = availability ? "#277a33" : closedColor;

      // Highlight the tile if it is adjacent to the mouse with a same color but brighter
      if (this.i == this.store.mouseI - 1 || this.j == this.store.mouseJ - 1)
        color = this.brighten(color, 0.1);

      return color;
    },
    borderColor() {
      const visibility = this.store.getTile(this.i, this.j).visibility;
      const color =
        visibility == TileVisibility.Scanned ? "#ff00ff" : "#01ff12";
      if (
        (this.i == this.store.mouseI - 1 || this.j == this.store.mouseJ - 1) &&
        visibility == TileVisibility.Opened
      )
        return "transparent";
      return color;
    },
  },
  methods: {
    tap() {
      this.store.tapTile(this.i, this.j);
    },
    mouseOver() {
      this.store.mouseI = this.i + 1;
      this.store.mouseJ = this.j + 1;
    },
    brighten(color, amount) {
      const c = color.substring(1);
      const rgb = parseInt(c, 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;

      const newR = Math.min(255, r + 255 * amount);
      const newG = Math.min(255, g + 255 * amount);
      const newB = Math.min(255, b + 255 * amount);

      return `#${((newR << 16) | (newG << 8) | newB).toString(16)}`;
    },
  },
});
</script>

<style scoped>
.tile {
  background-color: v-bind("color");
  border: 1px solid v-bind("borderColor");
  aspect-ratio: 1;
  width: 100%;
  opacity: v-bind("opacity");
  cursor: url("@/assets/cross.cur"), auto;
}
</style>
