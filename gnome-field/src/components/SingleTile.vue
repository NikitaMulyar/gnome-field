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
          opacity = availability ? 0.7 : 0.46;
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
      const closedColor = "#151319";

      let color;
      if (visibility == TileVisibility.Scanned)
        color = availability ? "#6c3699" : "#181520";
      else color = availability ? "#956f32" : closedColor;

      return color;
    },
    borderColor() {
      return "#ba9752";
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
    linear-gradient(135deg, rgba(255, 236, 180, 0.012), rgba(0, 0, 0, 0.2)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.008), rgba(0, 0, 0, 0.12));
  background-size: 100% 100%;
  opacity: 0.5;
}

.tile::after {
  content: "";
  position: absolute;
  inset: 2px;
  z-index: 1;
  pointer-events: none;
  opacity: 0;
  transition:
    background-color 140ms ease,
    opacity 140ms ease,
    box-shadow 140ms ease;
}

.tile.available:not(.scanned)::after {
  background: rgba(176, 126, 46, 0.22);
  box-shadow:
    inset 0 0 0.45rem rgba(210, 160, 67, 0.12);
  opacity: 1;
}

.tile.opened {
  box-shadow: none;
}

.tile.scanned:not(.available)::after {
  background: rgba(63, 47, 98, 0.24);
  box-shadow:
    inset 0 0 0.6rem rgba(26, 18, 45, 0.28);
  opacity: 1;
}

.tile.scanned.available::after {
  background: rgba(170, 78, 255, 0.34);
  box-shadow:
    inset 0 0 0.85rem rgba(230, 198, 255, 0.24),
    0 0 0.35rem rgba(168, 86, 255, 0.16);
  opacity: 1;
}
</style>
