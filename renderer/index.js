import MainScene from "./game/scenes/MainScene.js";

const BASE_WIDTH = 1024;
const BASE_HEIGHT = 768;

new Phaser.Game({
  type: Phaser.AUTO,
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  scene: MainScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game",
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    lockOrientation: true,
    autoRound: true,
    expandParent: false,
    // prevent canvas overflow
    max: {
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
    },
  },
});
