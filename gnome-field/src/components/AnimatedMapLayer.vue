<template>
  <div
    class="animated-map-layer"
    :style="{
      gridTemplateColumns: `repeat(${width}, calc(100% / ${width}))`,
      gridTemplateRows: `repeat(${height}, calc(100% / ${height}))`,
    }"
  >
    <div
      v-for="index in width * height"
      :key="index"
      class="animated-map-tile"
    >
      <img
        :src="tileImage(index - 1)"
        class="tile-image"
        :class="{ 'tile-image-portal': isPortalTile(index - 1) }"
        :style="tileImageStyle(index - 1)"
        alt=""
        draggable="false"
      />
      <span
        v-for="direction in wallDirections(index - 1)"
        :key="direction"
        class="wall"
        :class="`wall-${direction}`"
        :style="{ backgroundImage: `url(${wallImage(direction)})` }"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useAppStore, WallDirections } from "@/stores/app";

import basementDoor from "@/assets/map-tiles/art-camp/basement-door.png";
import bun from "@/assets/map-tiles/art-camp/bun.png";
import cardboard from "@/assets/map-tiles/art-camp/cardboard.png";
import magicBox from "@/assets/map-tiles/art-camp/magic-box.gif";
import paintCan from "@/assets/map-tiles/art-camp/paint-can.png";
import papers from "@/assets/map-tiles/art-camp/papers.png";
import scanner from "@/assets/map-tiles/art-camp/scanner.gif";
import ventIn from "@/assets/map-tiles/art-camp/vent-in.png";
import ventOut from "@/assets/map-tiles/art-camp/vent-out.png";
import water from "@/assets/map-tiles/art-camp/water.gif";
import wallDown from "@/assets/map-tiles/art-camp/wall-down.png";
import wallLeft from "@/assets/map-tiles/art-camp/wall-left.png";
import wallRight from "@/assets/map-tiles/art-camp/wall-right.png";
import wallUp from "@/assets/map-tiles/art-camp/wall-up.png";

const TILE_IMAGES = {
  0: water,
  1: papers,
  2: basementDoor,
  3: bun,
  4: paintCan,
  5: cardboard,
  6: scanner,
  7: ventIn,
  8: magicBox,
  9: ventOut,
};

const WALL_IMAGES = {
  up: wallUp,
  right: wallRight,
  down: wallDown,
  left: wallLeft,
};

const WALL_CLASS_BY_DIRECTION = {
  [WallDirections.Up]: "up",
  [WallDirections.Right]: "right",
  [WallDirections.Down]: "down",
  [WallDirections.Left]: "left",
};

export default defineComponent({
  name: "AnimatedMapLayer",
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
  methods: {
    portalPart(index) {
      const [i, j] = this.store.field.index2d(index);
      const type = this.store.getTile(i, j).type;
      if (![7, 9].includes(type)) return null;

      const candidates = [
        [i, j],
        [i - 1, j],
        [i, j - 1],
        [i - 1, j - 1],
      ];

      for (const [top, left] of candidates) {
        if (top < 0 || left < 0) continue;
        if (top + 1 >= this.height || left + 1 >= this.width) continue;

        const isPortalBlock = [
          [top, left],
          [top, left + 1],
          [top + 1, left],
          [top + 1, left + 1],
        ].every(([row, column]) => this.store.getTile(row, column).type == type);

        if (isPortalBlock) {
          return {
            row: i - top,
            column: j - left,
          };
        }
      }

      return null;
    },
    isPortalTile(index) {
      return this.portalPart(index) !== null;
    },
    tileImage(index) {
      const [i, j] = this.store.field.index2d(index);
      return TILE_IMAGES[this.store.getTile(i, j).type] ?? papers;
    },
    tileImageStyle(index) {
      const part = this.portalPart(index);
      if (!part) return {};

      return {
        transform: `translate(${-part.column * 50}%, ${-part.row * 50}%)`,
      };
    },
    wallDirections(index) {
      const [i, j] = this.store.field.index2d(index);
      return this.store
        .getTile(i, j)
        .walls.map((hasWall, direction) =>
          hasWall ? WALL_CLASS_BY_DIRECTION[direction] : null
        )
        .filter(Boolean);
    },
    wallImage(direction) {
      return WALL_IMAGES[direction];
    },
  },
});
</script>

<style scoped>
.animated-map-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: grid;
  overflow: hidden;
  background:
    radial-gradient(circle at 48% 48%, rgba(199, 152, 79, 0.06), transparent 45%),
    #101218;
}

.animated-map-tile {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #101218;
}

.tile-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

.tile-image-portal {
  width: 200%;
  height: 200%;
  max-width: none;
  transform-origin: top left;
}

.wall {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-color: transparent;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}
</style>
