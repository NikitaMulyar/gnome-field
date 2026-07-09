<template>
  <div class="border-tile">
    {{ value }}
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useAppStore } from "@/stores/app";

export default defineComponent({
  name: "BorderTile",
  props: {
    index: Number,
  },
  setup() {
    const store = useAppStore();
    return { store };
  },
  computed: {
    value() {
      const i = Math.floor(this.index / (this.store.getWidth() + 2));
      const j = this.index % (this.store.getWidth() + 2);

      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      if (
        (i == 0 && j == 0) ||
        (i == 0 && j == this.store.getWidth() + 1) ||
        (i == this.store.getHeight() + 1 && j == 0) ||
        (i == this.store.getHeight() + 1 && j == this.store.getWidth() + 1)
      )
        return "";
      if (i == 0 || i == this.store.getHeight() + 1) return j;
      if (j == 0 || j == this.store.getWidth() + 1) return alphabet[i - 1];
      return "?";
    },
    color() {
      return "#181a22";
    },
  },
});
</script>

<style scoped>
.border-tile {
  background-color: v-bind("color");
  border: solid 1px rgba(173, 136, 77, 0.62);
  aspect-ratio: 1;
  width: 100%;
  text-align: center;
  align-content: center;
  font-family: monospace;
  color: #f1d99c;
  font-size: 0.92rem;
  text-shadow: 0 0.12rem 0 rgba(0, 0, 0, 0.45);
  background-image: none;
  box-shadow: none;
  transition:
    background-color 140ms ease,
    color 140ms ease;
}

.border-tile:hover {
  color: #fff0bd;
  box-shadow: none;
}
</style>
