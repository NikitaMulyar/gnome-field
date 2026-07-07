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
        v-if="shouldRenderTileImage(index - 1)"
        :src="tileImage(index - 1)"
        class="tile-image"
        :class="{ 'tile-image-portal': isPortalTile(index - 1) }"
        :style="tileImageStyle(index - 1)"
        alt=""
        draggable="false"
      />
      <img
        v-for="direction in wallDirections(index - 1)"
        :key="direction"
        class="wall"
        :class="`wall-${direction}`"
        :src="wallImage(index - 1, direction)"
        alt=""
        draggable="false"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { TileVisibility, useAppStore, WallDirections } from "@/stores/app";

const MAP_TILE_ASSETS = import.meta.glob(
  "../assets/map-tiles/art-camp/*.{gif,png}",
  {
    eager: true,
    import: "default",
  }
);

const tileAsset = (filename) =>
  MAP_TILE_ASSETS[`../assets/map-tiles/art-camp/${filename}`];

const basementDoor = tileAsset("basement-door.png");
const chemicalFlasks = tileAsset("chemical-flasks.png");
const cardboard = tileAsset("cardboard.png");
const magicBox = tileAsset("magic-box.png");
const magicBoxAnimated = tileAsset("magic-box.gif") ?? magicBox;
const paintCan = tileAsset("paint-can.png");
const papers = tileAsset("papers.png");
const scanner = tileAsset("scanner.png");
const scannerAnimated = tileAsset("scanner.gif") ?? scanner;
const ventIn = tileAsset("vent-in.png");
const ventInAnimated = tileAsset("vent-in.gif") ?? ventIn;
const ventOut = tileAsset("vent-out.png");
const ventOutAnimated = tileAsset("vent-out.gif") ?? ventOut;
const water = tileAsset("water.png");
const waterAnimated = tileAsset("water.gif") ?? water;
const wallDown = tileAsset("wall-down.png");
const wallDownAnimated = tileAsset("wall-down.gif") ?? wallDown;
const wallLeft = tileAsset("wall-left.png");
const wallLeftAnimated = tileAsset("wall-left.gif") ?? wallLeft;
const wallRight = tileAsset("wall-right.png");
const wallRightAnimated = tileAsset("wall-right.gif") ?? wallRight;
const wallUp = tileAsset("wall-up.png");
const wallUpAnimated = tileAsset("wall-up.gif") ?? wallUp;

const TILE_IMAGES_STATIC = {
  0: water,
  1: papers,
  2: basementDoor,
  3: chemicalFlasks,
  4: paintCan,
  5: cardboard,
  6: scanner,
  7: ventIn,
  8: magicBox,
  9: ventOut,
};

const TILE_IMAGES_ANIMATED = {
  0: waterAnimated,
  6: scannerAnimated,
  7: ventInAnimated,
  8: magicBoxAnimated,
  9: ventOutAnimated,
};

const WALL_IMAGES_STATIC = {
  up: wallUp,
  right: wallRight,
  down: wallDown,
  left: wallLeft,
};

const WALL_IMAGES_ANIMATED = {
  up: wallUpAnimated,
  right: wallRightAnimated,
  down: wallDownAnimated,
  left: wallLeftAnimated,
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
    getTileByIndex(index) {
      const [i, j] = this.store.field.index2d(index);
      return this.store.getTile(i, j);
    },
    shouldAnimateTile(index) {
      return this.getTileByIndex(index).visibility == TileVisibility.Opened;
    },
    shouldRenderTileImage(index) {
      return this.getTileByIndex(index).visibility != TileVisibility.Closed;
    },
    tileImage(index) {
      const tile = this.getTileByIndex(index);
      const images = this.shouldAnimateTile(index)
        ? TILE_IMAGES_ANIMATED
        : TILE_IMAGES_STATIC;

      return images[tile.type] ?? TILE_IMAGES_STATIC[tile.type] ?? papers;
    },
    tileImageStyle(index) {
      const part = this.portalPart(index);
      if (!part) return {};

      return {
        transform: `translate(${-part.column * 50}%, ${-part.row * 50}%)`,
      };
    },
    wallDirections(index) {
      if (!this.shouldRenderTileImage(index)) return [];

      const [i, j] = this.store.field.index2d(index);
      return this.store
        .getTile(i, j)
        .walls.map((hasWall, direction) =>
          hasWall ? WALL_CLASS_BY_DIRECTION[direction] : null
        )
        .filter(Boolean);
    },
    wallImage(index, direction) {
      const images = this.shouldAnimateTile(index)
        ? WALL_IMAGES_ANIMATED
        : WALL_IMAGES_STATIC;
      return images[direction];
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
  object-fit: cover;
  user-select: none;
}
</style>
