<template>
  <div style="
      border: 2px solid #01ff12;
      height: 93vh;
      padding: 1em;
      font-family: monospace;
      overflow: hidden;
    ">
    <h1 @click="toggleFullscreen()">Данные сканера</h1>
    <!-- <div v-if="!store.drillInitialized" style="display: flex; justify-content: center; align-items: center">
      <v-btn @click="store.initDrill()" variant="outlined" style="margin: 1em">запустить бур!</v-btn>
      <br />
    </div> -->
    <span>Прогрызть клетку: <br /> 1 Drôle de blague</span>
    <br />
    <span>Проедено клеток: {{ store.getSteps() }}</span>
    <br />
    <span>Принято Drôle de blague: {{ store.getCreditsSpent() }}</span>
    <br />
    <br />
    <!-- <div v-if="store.getTimeToShutdown() == 0">
      <h2 class="shutdown-msg">САША ГОЛОДЕН!</h2>
      <span><b>Запуск: 1 энерго-юнит</b></span>
    </div>
    <div v-else>
      <span><b>До уплотнения среды:</b></span>
      <br />
      <h2>{{ shutdownTime }}</h2>
    </div> -->
    <br />
    <h3>Журнал:</h3>
    <div v-for="record in journal" :key="record">
      <span>{{ record.time }} ({{ "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[record.tile.i] }}
        {{ record.tile.j + 1 }}) {{ getTypeName(record.type) }}</span>
      <br />
      <span v-if="record.msg" style="font-size: 90%; font-weight: bold">{{
        record.msg
      }}</span>
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
  }),
  computed: {
    shutdownTime() {
      const time = this.store.getTimeToShutdown();
      const seconds = Math.floor(time / 1000) % 60;
      const minutes = Math.floor(time / 60000) % 60;
      return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""
        }${seconds}`;
    },
    journal() {
      return [...this.store.getJournal()].reverse();
    },
  },
  methods: {
    getTypeName(type) {
      switch (type) {
        case TileTypes.Water:
          return "молоко";
        case TileTypes.Stone:
          return "сыр";
        case TileTypes.Entrance:
          return "вход";
        case TileTypes.Cliff:
          return "леденец";
        case TileTypes.Bomb:
          return "агуша";
        case TileTypes.Sand:
          return "шоколад";
        case TileTypes.Mole:
          return "мышка";
        case TileTypes.PortalEntrance:
          return "водоворот";
        case TileTypes.Target:
          return "машина";
        case TileTypes.PortalExit:
          return "слив";
        default:
          return "неизвестно";
      }
    },
    toggleFullscreen() {
      this.fullscreen = !this.fullscreen;
      const elem = document.documentElement;
      if (this.fullscreen) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          /* Safari */
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          /* IE11 */
          elem.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          /* Safari */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          /* IE11 */
          document.msExitFullscreen();
        }
      }
    },
  },
});
</script>

<style scoped>
.shutdown-msg {
  color: red;
  animation: blinker 1s linear infinite;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>
