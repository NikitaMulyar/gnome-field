<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import { defineComponent } from "vue";
import { useAppStore } from "@/stores/app";

export default defineComponent({
  name: "DefaultLayout",
  setup() {
    const store = useAppStore();
    store.loadMap();
    return { store };
  },
});
</script>

<style>
:root {
  --basement-bg: #111217;
  --basement-panel: #171821;
  --craft-gold: #d49b2a;
  --craft-rice: #ead9aa;
  --craft-ink: #f4e0b3;
}

html {
  overflow: hidden;
}

body {
  margin: 0;
  background: var(--basement-bg);
}

.v-application {
  background: var(--basement-bg) !important;
}

* {
  box-sizing: border-box;
}
</style>
