import splashLogoImg from "../../assets/splash/splash-logo.png";
import splashMusic from "../../assets/sound/music/clockwork.ogg";

class SplashScene extends Phaser.Scene {
  themeMusic!:
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound;
  constructor() {
    super({ key: "SplashScene" });
  }

  preload() {
    this.load.image("logo", splashLogoImg);
    this.load.audio("theme", splashMusic);
  }

  async create() {
    // skip Splash in dev mode
    console.log(window);
    const skipSplash = window.devConfig?.skipSplash;

    if (skipSplash) {
      console.log("Dev mode: skipping splash screen");
      this.scene.start("MainScene");
      return;
    }
    // Center logo
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add.image(centerX, centerY, "logo").setScale(0.5);

    // Play music
    this.themeMusic = this.sound.add("theme", { loop: true });
    this.themeMusic.play();

    // Add text to start
    this.add
      .text(centerX, centerY + 100, "Click to Start", {
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Start game on click or key press
    this.input.once("pointerdown", this.startGame, this);
    if (this.input.keyboard) {
      this.input.keyboard.once("keydown", this.startGame, this);
    }
  }

  startGame() {
    this.themeMusic.stop();
    this.scene.start("MainScene");
  }
}

export default SplashScene;
