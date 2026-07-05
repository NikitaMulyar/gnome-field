<template>
  <v-container v-if="store.field" fluid fill-height class="field-page">
    <div class="basement-haze" />
    <div class="field-layout">
      <div
        class="field-frame"
        :style="{
          '--field-frame-columns': store.getWidth() + 2,
          '--field-frame-rows': store.getHeight() + 2,
          aspectRatio: (store.getWidth() + 2) / (store.getHeight() + 2),
          display: `grid`,
          gridTemplateColumns: `repeat(${store.getWidth() + 2}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${store.getHeight() + 2}, minmax(0, 1fr))`,
        }"
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
        <div class="map-slot">
          <GameField />
        </div>
      </div>
      <div class="stats-frame">
        <StatsColumn />
      </div>
    </div>
  </v-container>
  <v-container v-else fluid fill-height class="loading-page">
    <div class="loading-panel">Загрузка карты...</div>
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
  width: min(100%, calc((100vh - 2.6rem) * 34 / 26));
  margin: 0 auto;
  padding: 0;
  border: 0.45rem solid #3f2f24;
  border-radius: 0.35rem;
  box-shadow:
    0 1.2rem 2.8rem rgba(0, 0, 0, 0.52),
    0 0 0 1px rgba(229, 179, 100, 0.28),
    inset 0 0 0 0.18rem rgba(114, 72, 38, 0.6);
  background:
    linear-gradient(90deg, rgba(84, 55, 32, 0.32) 0 1px, transparent 1px 100%),
    linear-gradient(0deg, rgba(255, 231, 174, 0.1) 0 1px, transparent 1px 100%),
    linear-gradient(135deg, #7a5833, #be8e4f 48%, #6b482a);
  background-size: 1.1rem 1.1rem, 1.1rem 1.1rem, auto;
}

.field-frame > div:not(.field-hover-band):not(.map-slot) {
  min-width: 0;
  min-height: 0;
}

.map-slot {
  position: relative;
  z-index: 2;
  grid-column: 2 / span 32;
  grid-row: 2 / span 24;
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

.field-frame::before {
  content: "";
  position: absolute;
  pointer-events: none;
}

.field-frame::before {
  inset: -0.95rem -0.75rem;
  z-index: -1;
  border-radius: 0.45rem;
  background:
    linear-gradient(90deg, transparent 0 1.2rem, rgba(241, 204, 137, 0.22) 1.2rem 1.5rem, transparent 1.5rem),
    linear-gradient(0deg, transparent 0 1.2rem, rgba(55, 34, 24, 0.34) 1.2rem 1.5rem, transparent 1.5rem),
    #221a18;
  box-shadow: 0 0.35rem 1.1rem rgba(0, 0, 0, 0.52);
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
