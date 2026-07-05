<template>
  <div
    class="game-field"
    :style="{ aspectRatio: `${store.getWidth()} / ${store.getHeight()}` }"
    >
    <AnimatedMapLayer />
    <ExplosionTile
      v-for="bomb in store.getBombs()"
      :key="`${bomb.i}-${bomb.j}`"
      :i="bomb.i"
      :j="bomb.j"
    />
    <TileGrid class="interaction-layer" />
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useAppStore } from "@/stores/app";
import AnimatedMapLayer from "@/components/AnimatedMapLayer.vue";
import ExplosionTile from "@/components/ExplosionTile.vue";

export default defineComponent({
  name: "GameField",
  components: {
    AnimatedMapLayer,
    ExplosionTile,
  },
  setup() {
    const store = useAppStore();
    return { store };
  },
});
</script>

<style scoped>
.game-field {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 48% 48%, rgba(210, 174, 109, 0.08), transparent 42%),
    #0f1117;
  box-shadow:
    inset 0 0 2.4rem rgba(0, 0, 0, 0.55),
    inset 0 0 0 1px rgba(242, 195, 117, 0.1);
}

.interaction-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
}
</style>
