<template>
  <div class="video-wrapper">
    <video
      ref="videoPlayer"
      class="video-js vjs-big-play-centered vjs-default-skin"
    />
  </div>
</template>

<script>
import { defineComponent } from "vue";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export default defineComponent({
  name: "PrizeVideoPlayer",
  setup() {
    return {};
  },
  data: () => ({
    player: null,
    options: {
      autoplay: false,
      controls: true,
      preload: "auto",
      sources: [
        {
          src: "/gnome-field/prize.mp4",
          type: "video/mp4",
        },
      ],
    },
  }),
  mounted() {
    this.player = videojs(this.$refs.videoPlayer, this.options);
  },
  beforeUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  },
});
</script>

<style scoped>
.video-wrapper {
  width: 100%;
  height: 100%;
  padding: 0.45rem;
  border: solid 2px #7e5731;
  border-radius: 0.28rem;
  background:
    linear-gradient(90deg, rgba(246, 219, 164, 0.06) 0 1px, transparent 1px),
    linear-gradient(0deg, rgba(0, 0, 0, 0.22) 0 1px, transparent 1px),
    #0f1117;
  background-size: 1rem 1rem, 1rem 1rem, auto;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.06),
    inset 0 0 2rem rgba(0, 0, 0, 0.36);
}

:deep(.video-js) {
  width: 100%;
  height: 100%;
  border-radius: 0.18rem;
  overflow: hidden;
  background-color: #08090d;
  color: #f4e0b3;
}

:deep(.vjs-control-bar) {
  background:
    linear-gradient(180deg, rgba(31, 27, 25, 0.78), rgba(12, 12, 16, 0.94));
  border-top: 1px solid rgba(212, 155, 42, 0.28);
}

:deep(.vjs-big-play-button) {
  border-color: rgba(234, 217, 170, 0.8);
  background-color: rgba(20, 18, 18, 0.72);
  color: #f0bf72;
}
</style>
