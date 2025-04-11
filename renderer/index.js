import MainScene from "./game/scenes/MainScene.js";

const BASE_WIDTH = 1024;
const BASE_HEIGHT = 768;
const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT;

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  scene: MainScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game",
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    min: {
      width: BASE_WIDTH / 2,
      height: BASE_HEIGHT / 2,
    },
    lockOrientation: true,

    zoom: 1,
    autoRound: true,
  },
});
