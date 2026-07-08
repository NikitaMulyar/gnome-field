<template>
  <v-container v-if="store.field" fluid fill-height class="field-page">
    <div class="basement-haze" />
    <div class="field-layout">
      <div
        class="field-frame"
        :style="fieldFrameStyle"
      >
        <div class="field-hover-band field-hover-row" />
        <div class="field-hover-band field-hover-column" />
        <div
          v-for="i in (store.getWidth() + 2) * (store.getHeight() + 2)"
          :key="i"
          :style="borderTileStyle(i - 1)"
        >
          <BorderTile :index="i - 1" />
        </div>
        <div class="map-slot" :style="mapSlotStyle">
          <GameField />
        </div>
      </div>
      <div class="stats-frame">
        <StatsColumn />
      </div>
    </div>
  </v-container>
  <v-container v-else fluid fill-height class="loading-page">
    <div class="loading-panel">
      <template v-if="store.getMapLoadError()">
        <div class="loading-title">Карта не загрузилась</div>
        <div class="loading-error">{{ store.getMapLoadError() }}</div>
        <v-btn
          class="loading-retry"
          color="#d49b2a"
          size="small"
          variant="tonal"
          @click="store.loadMap()"
        >
          Повторить
        </v-btn>
      </template>
      <template v-else>Загрузка карты...</template>
    </div>
  </v-container>
  <TargetDialog v-if="store.field" />
</template>

<script>
import { defineComponent } from "vue";
import { useAppStore } from "@/stores/app";

export default defineComponent({
  name: "FieldPage",
  setup() {
    const store = useAppStore();
    return { store };
  },
  computed: {
    frameColumns() {
      return this.store.getWidth() + 2;
    },
    frameRows() {
      return this.store.getHeight() + 2;
    },
    fieldFrameStyle() {
      return {
        "--field-frame-columns": this.frameColumns,
        "--field-frame-rows": this.frameRows,
        aspectRatio: `${this.frameColumns} / ${this.frameRows}`,
        display: "grid",
        gridTemplateColumns: `repeat(${this.frameColumns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${this.frameRows}, minmax(0, 1fr))`,
        width: `min(100%, calc((100vh - 2.6rem) * ${this.frameColumns} / ${this.frameRows}))`,
      };
    },
    mapSlotStyle() {
      return {
        gridColumn: `2 / span ${this.store.getWidth()}`,
        gridRow: `2 / span ${this.store.getHeight()}`,
      };
    },
  },
  methods: {
    borderTileStyle(index) {
      const columns = this.store.getWidth() + 2;
      const row = Math.floor(index / columns) + 1;
      const column = (index % columns) + 1;

      return {
        gridColumn: column,
        gridRow: row,
      };
    },
  },
});
</script>

<style scoped>
.field-page {
  position: relative;
  min-height: 100%;
  background:
    radial-gradient(circle at 74% 18%, rgba(209, 143, 61, 0.26), transparent 28%),
    radial-gradient(circle at 28% 76%, rgba(82, 91, 104, 0.32), transparent 33%),
    linear-gradient(90deg, rgba(255, 231, 174, 0.09) 1px, transparent 1px),
    linear-gradient(0deg, rgba(255, 255, 255, 0.065) 1px, transparent 1px),
    linear-gradient(135deg, #111217, #1a171c 52%, #101217);
  background-size:
    auto,
    auto,
    34px 34px,
    34px 34px,
    auto;
  isolation: isolate;
  overflow: hidden;
}

.basement-haze {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 48%, transparent 0 38%, rgba(0, 0, 0, 0.22) 70%),
    linear-gradient(180deg, rgba(255, 220, 150, 0.08), transparent 28%, rgba(0, 0, 0, 0.2));
  animation: basement-breath 9s ease-in-out infinite;
}

.field-layout {
  position: relative;
  display: grid;
  grid-template-columns: minmax(46rem, 1fr) 22rem;
  align-items: center;
  gap: 1.35rem;
  height: 100vh;
  padding: 1.3rem 1.55rem;
}

.field-frame {
  position: relative;
  margin: 0 auto;
  padding: 0;
  border: 0.35rem solid #3f2f24;
  border-radius: 0.35rem;
  box-shadow: 0 1rem 2.1rem rgba(0, 0, 0, 0.42);
  background: #7a5833;
}

.field-frame > div:not(.field-hover-band):not(.map-slot) {
  min-width: 0;
  min-height: 0;
}

.map-slot {
  position: relative;
  z-index: 2;
  min-width: 0;
  min-height: 0;
}

.field-hover-band {
  position: absolute;
  z-index: 11;
  pointer-events: none;
  opacity: 0;
  transition: opacity 90ms ease;
}

.field-hover-row {
  left: 0;
  top: calc(var(--hover-frame-row, -1) * 100% / var(--field-frame-rows));
  width: 100%;
  height: calc(100% / var(--field-frame-rows));
  background: rgba(240, 191, 114, 0.11);
}

.field-hover-column {
  left: calc(var(--hover-frame-column, -1) * 100% / var(--field-frame-columns));
  top: 0;
  width: calc(100% / var(--field-frame-columns));
  height: 100%;
  background: rgba(240, 191, 114, 0.09);
}

.field-frame.is-cell-hovered .field-hover-band {
  opacity: 1;
}

.stats-frame {
  width: 100%;
  height: min(93vh, calc(100vh - 2.6rem));
  padding: 0;
}

.loading-page {
  min-height: 100%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at center, rgba(180, 121, 54, 0.18), transparent 34%),
    #11131a;
}

.loading-panel {
  padding: 1rem 1.4rem;
  border: 2px solid #7e5731;
  color: #f5e4bf;
  background:
    linear-gradient(rgba(255, 255, 255, 0.055), rgba(0, 0, 0, 0.08)),
    #191720;
  font-family: monospace;
}

.loading-title {
  margin-bottom: 0.45rem;
  color: #f0bf72;
  font-size: 1.1rem;
  font-weight: 700;
}

.loading-error {
  max-width: 30rem;
  color: #d8c59d;
  font-size: 0.85rem;
  line-height: 1.35;
}

.loading-retry {
  margin-top: 0.8rem;
}

@keyframes basement-breath {
  0%,
  100% {
    opacity: 0.72;
  }
  50% {
    opacity: 0.98;
  }
}

</style>
