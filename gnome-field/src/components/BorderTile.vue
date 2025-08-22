<template>
  <div @mouseover="mouseOver()" class="border-tile">
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
      const i = Math.floor(this.index / (this.store.getWidth() + 2));
      const j = this.index % (this.store.getWidth() + 2);
      const mi = this.store.mouseI;
      const mj = this.store.mouseJ;
      if (
        mi == 0 ||
        mi == this.store.getHeight() + 1 ||
        mj == 0 ||
        mj == this.store.getWidth() + 1
      )
        return "transparent";
      if (this.store.mouseI == i || this.store.mouseJ == j) return "#018a0a";
      return "transparent";
    },
  },
  methods: {
    mouseOver() {
      const i = Math.floor(this.index / (this.store.getWidth() + 2));
      const j = this.index % (this.store.getWidth() + 2);
      this.store.mouseI = i;
      this.store.mouseJ = j;
    },
  },
});
</script>

<style scoped>
.border-tile {
  background-color: v-bind("color");
  border: solid 1px #018a0a;
  aspect-ratio: 1;
  width: 100%;
  text-align: center;
  align-content: center;
  font-family: monospace;
}
</style>
