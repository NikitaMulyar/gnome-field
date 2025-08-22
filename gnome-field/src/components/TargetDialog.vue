<template>
  <v-dialog v-model="targetReached" width="auto" opacity="0">
    <v-card style="
        font-family: monospace;
        background-color: background;
        border: solid 2px #00cc00;
      " elevation="24">
      <div v-if="!store.getShowPrizeVideo()">
        <v-card-title>
          <h1>Машина обнаружена</h1>
        </v-card-title>
        <v-card-text style="text-align: center">
          <h2>До уничтожения</h2>
          <h1 style="font-size: 3em">{{ ventOpenTime }}</h1>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="store.fastForwardVent()">
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </div>
      <div v-if="store.getShowPrizeVideo()">
        <div style="height: 80vh; width: 80vw">
          <PrizeVideoPlayer />
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="store.finishGame(false)" color="#00ff00">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { defineComponent } from "vue";
import { useAppStore } from "@/stores/app";

export default defineComponent({
  name: "TargetDialog",
  setup() {
    const store = useAppStore();
    return { store };
  },
  computed: {
    targetReached() {
      return this.store.targetReached() && !this.store.getFinished();
    },
    ventOpenTime() {
      const time = this.store.getTimeToVentOpen();
      const seconds = Math.floor(time / 1000) % 60;
      const minutes = Math.floor(time / 60000) % 60;
      return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""
        }${seconds}`;
    },
  },
});
</script>
