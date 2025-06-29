import * as Phaser from "phaser";
import MainScene from "./game/scenes/MainScene";
import SplashScene from "./game/scenes/SplashScene";

const BASE_WIDTH = 1024;
const BASE_HEIGHT = 768;

new Phaser.Game({
  type: Phaser.AUTO,
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  scene: [SplashScene, MainScene],
  physics: {
    default: "arcade", // use Arcade Physics
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false, // set to true to enable debug mode
    },
  },
  dom: {
    createContainer: true, // Enable DOM elements
  },
  input: {
    keyboard: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game",
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    autoRound: true,
    expandParent: false,
    // prevent canvas overflow
    max: {
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
    },
  },
  callbacks: {
    preBoot: (game) => {
      console.log("LIFECYCLE: Game preBoot");
    },
    postBoot: (game) => {
      console.log("LIFECYCLE: Game postBoot");
    },
  },
});
