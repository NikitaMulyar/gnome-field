<template>
  <v-dialog v-model="targetReached" width="auto" opacity="0">
    <v-card
      class="target-card"
      :class="{ 'target-card--video': store.getShowPrizeVideo() }"
      elevation="24"
    >
      <div v-if="!store.getShowPrizeVideo()">
        <v-card-title>
          <h1>Коробка найдена</h1>
        </v-card-title>
        <v-card-text style="text-align: center">
          <h2>Живокрысик обнюхивает замок</h2>
          <h1 class="target-timer">{{ ventOpenTime }}</h1>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="store.fastForwardVent()">
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </div>
      <div v-if="store.getShowPrizeVideo()" class="target-video-state">
        <div class="prize-video-shell">
          <PrizeVideoPlayer />
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="store.finishGame(false)" color="#d49b2a">
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

<style scoped>
.target-card {
  border: solid 2px #7e5731;
  border-radius: 0.22rem;
  background:
    linear-gradient(90deg, rgba(246, 219, 164, 0.07) 0 1px, transparent 1px),
    linear-gradient(0deg, rgba(0, 0, 0, 0.14) 0 1px, transparent 1px),
    radial-gradient(circle at 50% 0%, rgba(210, 149, 71, 0.18), transparent 42%),
    #171821;
  background-size: 1rem 1rem, 1rem 1rem, auto, auto;
  color: #f5e4bf;
  font-family: monospace;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.07),
    0 1.1rem 2.4rem rgba(0, 0, 0, 0.48);
}

.target-card--video {
  width: min(84vw, 74rem);
}

.target-video-state {
  padding: 0.8rem;
}

.prize-video-shell {
  height: min(78vh, 44rem);
  width: 100%;
}

.target-card h1 {
  color: #f0bf72;
  text-align: center;
}

.target-card h2 {
  color: #d8c59d;
  font-size: 1rem;
  font-weight: 600;
}

.target-timer {
  margin-top: 0.35rem;
  font-size: 3em;
  letter-spacing: 0.05rem;
  text-shadow: 0 0 0.75rem rgba(240, 191, 114, 0.36);
}
</style>
