<template>
  <div
    @click="tap"
    class="tile"
    :class="tileClasses"
  />
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
      const availability = this.store.isAvailable(this.i, this.j);
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
          opacity = availability ? 0.62 : 0.3;
          break;
        default:
          opacity = 0;
      }

      return opacity;
    },
    tileClasses() {
      const visibility = this.store.getTile(this.i, this.j).visibility;
      return {
        available: this.store.isAvailable(this.i, this.j),
        closed: visibility == TileVisibility.Closed,
        opened: visibility == TileVisibility.Opened,
        revealed: visibility == TileVisibility.Revealed,
        scanned: visibility == TileVisibility.Scanned,
      };
    },
    color() {
      const visibility = this.store.getTile(this.i, this.j).visibility;
      const availability = this.store.isAvailable(this.i, this.j);
      const closedColor = "#2a252a";

      let color;
      if (visibility == TileVisibility.Scanned)
        color = availability ? "#b05cff" : "#2c2a3e";
      else color = availability ? "#c79542" : closedColor;

      return color;
    },
    borderColor() {
      const visibility = this.store.getTile(this.i, this.j).visibility;
      const availability = this.store.isAvailable(this.i, this.j);
      const color = visibility == TileVisibility.Scanned
        ? (availability ? "#e0c2ff" : "#a997ff")
        : "#ba9752";
      return color;
    },
  },
  methods: {
    tap() {
      this.store.tapTile(this.i, this.j);
    },
  },
});
</script>

<style scoped>
.tile {
  position: relative;
  isolation: isolate;
  background-color: v-bind("color");
  border: 1px solid v-bind("borderColor");
  aspect-ratio: 1;
  width: 100%;
  opacity: v-bind("opacity");
  overflow: hidden;
  transition:
    background-color 140ms ease,
    opacity 260ms ease,
    border-color 140ms ease;
  cursor: url("@/assets/cross.cur"), auto;
}

.tile::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    linear-gradient(135deg, rgba(255, 236, 180, 0.035), rgba(0, 0, 0, 0.16)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(0, 0, 0, 0.1));
  background-size: 100% 100%;
  opacity: 0.64;
}

.tile.available {
  box-shadow:
    inset 0 0 0 1px rgba(255, 228, 158, 0.28),
    inset 0 0 0.6rem rgba(255, 198, 80, 0.16);
}

.tile.opened {
  box-shadow: none;
}

.tile.scanned {
  box-shadow:
    inset 0 0 0.75rem rgba(130, 111, 246, 0.18);
}

.tile.scanned.available {
  box-shadow:
    inset 0 0 0 1px rgba(234, 207, 255, 0.55),
    inset 0 0 1.1rem rgba(174, 94, 255, 0.52),
    0 0 0.5rem rgba(168, 86, 255, 0.32);
}
</style>
