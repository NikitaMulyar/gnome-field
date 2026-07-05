<template>
  <div class="video-wrapper" style="width: 100%; height: 100%">
    <video ref="videoPlayer" class="video-js vjs-big-play-centered vjs-default-skin"
      style="width: 100%; height: 100%"></video>
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
          src: `${import.meta.env.BASE_URL}prize.mp4`,
          type: "video/mp4",
        },
      ],
    },
  }),
  mounted() {
    this.player = videojs(this.$refs.videoPlayer, this.options, () => {
      this.player.log("onPlayerReady", this);
      this.player.play(
        () => {
          this.player.log("Your video started");
        },
        () => {
          this.player.log("Your video is not playing");
        }
      );
    });
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
  border: solid 3px #00f704;
}
</style>

