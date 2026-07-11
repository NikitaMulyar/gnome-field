<template>
  <div
    class="prize-video-selector"
    role="radiogroup"
    aria-label="Выбор погоды"
  >
    <v-btn
      v-for="option in options"
      :key="option.value"
      class="prize-video-option"
      :class="{ 'prize-video-option--selected': selected == option.value }"
      :icon="option.icon"
      size="x-small"
      density="compact"
      variant="text"
      role="radio"
      :aria-checked="selected == option.value"
      :aria-label="option.label"
      :title="option.label"
      @click="store.setPrizeVideoVariant(option.value)"
    />
  </div>
</template>

<script>
import { computed, defineComponent } from "vue";
import {
  PrizeVideoVariants,
  useAppStore,
} from "@/stores/app";

export default defineComponent({
  name: "PrizeVideoSelector",
  setup() {
    const store = useAppStore();
    const selected = computed(() => store.getPrizeVideoVariant());
    const options = [
      {
        value: PrizeVideoVariants.Sun,
        icon: "mdi-weather-sunny",
        label: "Солнце",
      },
      {
        value: PrizeVideoVariants.Cloud,
        icon: "mdi-weather-cloudy",
        label: "Тучка",
      },
    ];

    return { options, selected, store };
  },
});
</script>

<style scoped>
.prize-video-selector {
  display: inline-grid;
  grid-template-columns: repeat(2, 1.18rem);
  gap: 0.18rem;
}

.prize-video-option {
  width: 1.18rem !important;
  height: 1.18rem !important;
  min-width: 1.18rem !important;
  border: 1px solid rgba(240, 191, 114, 0.22);
  border-radius: 0.12rem;
  color: rgba(244, 224, 179, 0.62);
  background: rgba(8, 9, 13, 0.36);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.035),
    0 0.1rem 0.22rem rgba(0, 0, 0, 0.28);
}

.prize-video-option:hover {
  color: #f0bf72;
  border-color: rgba(240, 191, 114, 0.5);
  background: rgba(35, 25, 20, 0.72);
}

.prize-video-option--selected {
  border-color: rgba(240, 191, 114, 0.46);
  color: #ffd986;
  background: rgba(83, 57, 28, 0.72);
}

.prize-video-option :deep(.v-icon) {
  font-size: 0.72rem;
}
</style>
