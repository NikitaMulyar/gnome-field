<template>
  <div class="stats-column">
    <div class="journal-pin" />
    <v-btn
      class="stats-action-button fullscreen-button"
      :icon="fullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
      size="x-small"
      variant="text"
      density="compact"
      :aria-label="fullscreen ? 'Выйти из полноэкранного режима' : 'Открыть сайт на весь экран'"
      :title="fullscreen ? 'Выйти из полноэкранного режима' : 'Открыть сайт на весь экран'"
      @click.stop="toggleFullscreen"
    />
    <v-btn
      class="stats-action-button reset-progress-button"
      icon="mdi-refresh"
      size="x-small"
      variant="text"
      density="compact"
      aria-label="Сбросить прохождение"
      title="Сбросить прохождение"
      @click.stop="resetProgress"
    />
    <h1 @click="toggleFullscreen()">Подвалище</h1>
    <section class="rice-ledger">
      <div class="rice-row">
        <span>Открыть клетку</span>
        <strong class="rice-cost-control">
          <span class="rice-grain" />
          <input
            v-model="riceCostDraft"
            class="rice-cost-input"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            aria-label="Количество риса за открытие клетки"
            title="Количество риса за открытие клетки"
            @focus="selectRiceCost"
            @input="updateRiceCost"
            @blur="commitRiceCost"
            @keydown.enter.prevent="commitRiceCost"
          />
          <span class="rice-cost-unit">{{ riceCostUnit }}</span>
        </strong>
      </div>
      <div class="rice-row">
        <span>Прогрызено ходов</span>
        <strong>{{ store.getSteps() }}</strong>
      </div>
      <div class="rice-row">
        <span>Потрачено риса</span>
        <strong>{{ store.getCreditsSpent() }}</strong>
      </div>
    </section>
    <h3>Журнал живокрысика</h3>
    <div class="journal-list">
      <div
        v-for="record in journal"
        :key="recordKey(record)"
        class="journal-record"
      >
        <span class="journal-record-main">
          <span class="journal-time">{{ record.time }}</span>
          <span class="journal-coord">
            ({{ "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[record.tile.i] }}
            {{ record.tile.j + 1 }})
          </span>
          <span class="journal-type">{{ getTypeName(record.type) }}</span>
        </span>
        <span v-if="record.msg" class="journal-message">{{
          record.msg
        }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useAppStore, TileTypes } from "@/stores/app";

export default defineComponent({
  name: "StatsColumn",
  setup() {
    const store = useAppStore();
    store.initDrill();
    return { store };
  },
  data: () => ({
    fullscreen: false,
    riceCostDraft: "1",
  }),
  computed: {
    journal() {
      return [...this.store.getJournal()].reverse();
    },
    riceCostUnit() {
      const value = Number.parseInt(
        this.riceCostDraft || String(this.store.getRiceCost()),
        10
      );
      return this.getRiceUnit(value);
    },
  },
  mounted() {
    this.syncRiceCostDraft();
    document.addEventListener("fullscreenchange", this.syncFullscreenState);
    document.addEventListener(
      "webkitfullscreenchange",
      this.syncFullscreenState
    );
  },
  beforeUnmount() {
    document.removeEventListener("fullscreenchange", this.syncFullscreenState);
    document.removeEventListener(
      "webkitfullscreenchange",
      this.syncFullscreenState
    );
  },
  watch: {
    "store.riceCost"() {
      this.syncRiceCostDraft();
    },
  },
  methods: {
    syncRiceCostDraft() {
      this.riceCostDraft = String(this.store.getRiceCost());
    },
    sanitizeRiceCostInput(value) {
      return value.replace(/\D/g, "").slice(0, 3);
    },
    selectRiceCost(event) {
      event.target.select();
    },
    updateRiceCost() {
      const cleanValue = this.sanitizeRiceCostInput(this.riceCostDraft);
      this.riceCostDraft = cleanValue;
      if (cleanValue && Number.parseInt(cleanValue, 10) > 0)
        this.store.setRiceCost(cleanValue);
    },
    commitRiceCost(event) {
      if (!this.riceCostDraft) {
        this.syncRiceCostDraft();
      } else {
        const normalizedCost = this.store.normalizeRiceCost(
          this.riceCostDraft
        );
        this.riceCostDraft = String(normalizedCost);
        this.store.setRiceCost(normalizedCost);
      }
      event?.target?.blur?.();
    },
    getRiceUnit(value) {
      const normalizedValue = Math.abs(Number.isFinite(value) ? value : 1);
      const lastTwoDigits = normalizedValue % 100;
      const lastDigit = normalizedValue % 10;

      if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "рисов";
      if (lastDigit == 1) return "рис";
      if (lastDigit >= 2 && lastDigit <= 4) return "риса";
      return "рисов";
    },
    recordKey(record) {
      return `${record.time}-${record.tile.i}-${record.tile.j}-${record.type}`;
    },
    getTypeName(type) {
      switch (type) {
        case TileTypes.Water:
          return "вода";
        case TileTypes.Stone:
          return "листочки";
        case TileTypes.Entrance:
          return "дверь в подвал";
        case TileTypes.Cliff:
          return "химические колбы";
        case TileTypes.Bomb:
          return "банка краски";
        case TileTypes.Sand:
          return "картон";
        case TileTypes.Mole:
          return "сканер";
        case TileTypes.PortalEntrance:
          return "вход в вентиляцию";
        case TileTypes.Target:
          return "волшебная коробка";
        case TileTypes.PortalExit:
          return "выход из вентиляции";
        default:
          return "неизвестно";
      }
    },
    getFullscreenElement() {
      return document.fullscreenElement || document.webkitFullscreenElement;
    },
    syncFullscreenState() {
      this.fullscreen = this.getFullscreenElement() == document.documentElement;
    },
    async toggleFullscreen() {
      try {
        if (this.getFullscreenElement()) {
          const exitFullscreen =
            document.exitFullscreen || document.webkitExitFullscreen;
          await exitFullscreen?.call(document);
        } else {
          const elem = document.documentElement;
          const requestFullscreen =
            elem.requestFullscreen || elem.webkitRequestFullscreen;
          await requestFullscreen?.call(elem);
        }
      } catch {
        this.syncFullscreenState();
      }
    },
    resetProgress() {
      this.store.resetProgress();
    },
  },
});
</script>

<style scoped>
.stats-column {
  position: relative;
  height: 100%;
  padding: 1.1rem 1.05rem 1rem;
  overflow: hidden;
  border: 2px solid #6d4a2d;
  border-radius: 0.18rem;
  background:
    linear-gradient(90deg, rgba(232, 203, 137, 0.052) 1px, transparent 1px),
    linear-gradient(0deg, rgba(232, 203, 137, 0.04) 1px, transparent 1px),
    radial-gradient(circle at 18% 8%, rgba(226, 172, 91, 0.14), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.12)),
    #171821;
  background-size:
    1.35rem 1.35rem,
    1.35rem 1.35rem,
    auto,
    auto,
    auto;
  background-position:
    0.45rem 0.45rem,
    0.45rem 0.45rem,
    center,
    center,
    center;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 0 2rem rgba(0, 0, 0, 0.28),
    0 0.9rem 2.2rem rgba(0, 0, 0, 0.34);
  color: #f4e0b3;
  font-family: monospace;
}

.stats-column::before {
  content: "";
  position: absolute;
  inset: 0.45rem;
  pointer-events: none;
  border: 1px solid rgba(234, 191, 113, 0.14);
  box-shadow:
    inset 0 0 1rem rgba(0, 0, 0, 0.28),
    inset 0 0 0 0.35rem rgba(10, 10, 14, 0.16);
}

.journal-pin {
  position: absolute;
  top: 0.7rem;
  right: 3.45rem;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 35%, #fff2c6 0 16%, transparent 17%),
    #b94237;
  box-shadow:
    0 0.12rem 0.25rem rgba(0, 0, 0, 0.55),
    inset 0 -0.1rem 0 rgba(65, 23, 20, 0.35);
}

.stats-action-button {
  position: absolute;
  top: 0.62rem;
  z-index: 2;
  width: 1.18rem !important;
  height: 1.18rem !important;
  min-width: 1.18rem !important;
  border: 1px solid rgba(240, 191, 114, 0.22);
  border-radius: 0.12rem;
  color: rgba(244, 224, 179, 0.78);
  background: rgba(8, 9, 13, 0.36);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.035),
    0 0.1rem 0.22rem rgba(0, 0, 0, 0.28);
}

.fullscreen-button {
  right: 2.08rem;
}

.reset-progress-button {
  right: 0.72rem;
}

.stats-action-button:hover {
  color: #f0bf72;
  border-color: rgba(240, 191, 114, 0.5);
  background: rgba(35, 25, 20, 0.72);
}

.stats-action-button :deep(.v-icon) {
  font-size: 0.72rem;
}

.stats-column h1 {
  position: relative;
  margin: 0 3.25rem 1rem 0;
  color: #f0bf72;
  cursor: pointer;
  font-size: 1.8rem;
  line-height: 1.05;
  text-shadow: 0 0.15rem 0 rgba(0, 0, 0, 0.45);
}

.rice-ledger {
  position: relative;
  display: grid;
  gap: 0.45rem;
  margin: 0 0 1.25rem;
  padding: 0.85rem 0.8rem;
  border: 1px solid rgba(220, 169, 92, 0.36);
  background:
    linear-gradient(90deg, rgba(246, 219, 164, 0.08), transparent 62%),
    rgba(12, 13, 18, 0.58);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0.35rem 0.7rem rgba(0, 0, 0, 0.2);
}

.rice-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  min-height: 1.7rem;
  color: #d5c3a0;
  font-size: 0.95rem;
}

.rice-row strong {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #fff0bd;
  font-size: 1.05rem;
}

.rice-cost-control {
  padding: 0.05rem 0.2rem 0.05rem 0.1rem;
  border: 1px solid transparent;
  border-radius: 0.12rem;
  transition:
    border-color 140ms ease,
    background-color 140ms ease;
}

.rice-cost-control:focus-within {
  border-color: rgba(240, 191, 114, 0.55);
  background: rgba(240, 191, 114, 0.1);
}

.rice-cost-input {
  width: 2.2rem;
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  color: #fff0bd;
  background: transparent;
  font: inherit;
  font-weight: 700;
  line-height: 1;
  text-align: right;
}

.rice-cost-input::selection {
  color: #171821;
  background: #f0bf72;
}

.rice-grain {
  width: 0.7rem;
  height: 0.34rem;
  border-radius: 999rem;
  background: #ead9aa;
  rotate: -18deg;
  box-shadow:
    0.2rem 0.08rem 0 #f6e8bd,
    -0.2rem 0.06rem 0 #d7c18a;
}

.stats-column h3 {
  position: relative;
  margin: 0 0 0.7rem;
  color: #e9c47a;
  font-size: 1.08rem;
  letter-spacing: 0.02rem;
}

.journal-list {
  position: relative;
  display: grid;
  gap: 0.34rem;
  max-height: calc(100% - 12.5rem);
  padding: 0.08rem 0.2rem 0.2rem 0;
  overflow: hidden;
  mask-image: linear-gradient(180deg, #000 0 calc(100% - 1.4rem), transparent);
}

.journal-record {
  position: relative;
  display: grid;
  grid-template-columns: 0.4rem minmax(0, 1fr);
  column-gap: 0.55rem;
  align-items: start;
  padding: 0.4rem 0.55rem 0.42rem 0.45rem;
  border-radius: 0.12rem;
  background:
    linear-gradient(90deg, rgba(216, 187, 116, 0.08), transparent 42%),
    rgba(10, 11, 16, 0.42);
  box-shadow:
    inset 0 0 0 1px rgba(234, 191, 113, 0.075),
    0 0.12rem 0.35rem rgba(0, 0, 0, 0.12);
}

.journal-record::before {
  content: "";
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 0.32rem;
  height: 0.32rem;
  margin-top: 0.32rem;
  border-radius: 50%;
  background: #d8bb74;
  box-shadow: 0 0 0.34rem rgba(216, 187, 116, 0.48);
}

.journal-record-main {
  grid-column: 2;
  display: grid;
  grid-template-columns: 4.6rem 3.55rem minmax(0, 1fr);
  column-gap: 0.42rem;
  align-items: baseline;
  min-width: 0;
  color: #eadfca;
  font-size: 0.88rem;
  line-height: 1.25;
}

.journal-time,
.journal-coord {
  white-space: nowrap;
}

.journal-coord {
  color: #d7c39d;
}

.journal-type {
  min-width: 0;
  color: #f2dfb8;
  overflow-wrap: anywhere;
}

.journal-message {
  grid-column: 2;
  display: block;
  margin-top: 0.16rem;
  color: #ffd986;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.3;
}

.shutdown-msg {
  color: #bf2633;
  animation: blinker 1s linear infinite;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>
