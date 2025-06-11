import splashLogoImg from "../../assets/splash/splash-logo.png";
import splashMusic from "../../assets/sound/music/clockwork.ogg";
import soundOnImg from "../../assets/volume-on.svg";
import soundOffImg from "../../assets/volume-off.svg";

const ltr =
  "011010010010000001110100011010000110111101110101.ΩεγώκαιεσύяитыIch-du나와너凸凹شकのಗಿದೆx☀Бi&thouאᄀ的ᚠを無有ကი∞߷စअहम्त्वम्ฉันและเธอእኔእናአንተმედაშენ我と汝ⴰⵏⴰⴷⵓⵔ";
const rtl = "منوتوאניואתה";

class SplashScene extends Phaser.Scene {
  //   private readonly LETTERS = "က";
  private muteButton!: Phaser.GameObjects.Image;

  private readonly LETTERS = (rtl + ltr).split("");

  private readonly INITIAL_LETTER_BURST_COUNT = 20;

  private themeMusic!:
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound;
  constructor() {
    super({ key: "SplashScene" });
  }
  private startText!: Phaser.GameObjects.Text;

  preload() {
    this.load.image("logo", splashLogoImg);
    this.load.audio("theme", splashMusic);

    this.load.image("sound-on", soundOnImg);
    this.load.image("sound-off", soundOffImg);
  }

  async create() {
    // skip Splash in dev mode
    const skipSplash = window.devConfig?.skipSplash;

    if (skipSplash) {
      console.log("Dev mode: skipping splash screen");
      this.scene.start("MainScene");
      return;
    }

    this.createFlyingLetters();

    // center logo
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    console.log();

    this.add.image(centerX, centerY, "logo");

    // Play music
    this.themeMusic = this.sound.add("theme", { loop: true });
    this.game.sound.pauseOnBlur = false;

    this.themeMusic.play();
    this.addMuteButton();

    // Add text to start
    this.startText = this.add
      .text(centerX, centerY + 200, "Press any key to start", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: this.startText,
      alpha: { from: 0, to: 1 },
      duration: 1500,
      ease: "Stepped",
      yoyo: false,
      repeat: -1,
      repeatDelay: 800,
    });

    // start game on key press
    if (this.input.keyboard) {
      this.input.keyboard.once("keydown", this.startGame, this);
    }
  }

  private createFlyingLetters() {
    for (let i = 0; i < this.INITIAL_LETTER_BURST_COUNT; i++) {
      this.spawnLetter();
    }

    // continuously spawn new letters
    this.time.addEvent({
      delay: 200,
      callback: () => this.spawnLetter(),
      loop: true,
    });
  }
  private addMuteButton() {
    const margin = 20;
    this.muteButton = this.add
      .image(this.cameras.main.width - margin, margin, "sound-on")
      .setOrigin(1, 0)
      .setScale(0.8)
      .setInteractive({ useHandCursor: true })
      .setDepth(1000)
      .setTint(0xffffff); // Set initial color to white

    // Toggle mute state on click
    this.muteButton.on("pointerdown", () => {
      const isMuted = !this.sound.mute;
      this.sound.setMute(isMuted);
      this.muteButton.setTexture(isMuted ? "sound-off" : "sound-on");
    });
  }
  private spawnLetter() {
    const startPosition = this.getRandomStartPosition();
    const letter =
      this.LETTERS[Phaser.Math.Between(0, this.LETTERS.length - 1)];

    const text = this.add.text(startPosition.x, startPosition.y, letter, {
      fontSize: Phaser.Math.Between(16, 32) + "px",
      color: "#ffffff",
    });

    const angle = Phaser.Math.Between(0, 360);
    const speed = Phaser.Math.Between(100, 250);
    const vx = Math.cos((angle * Math.PI) / 180) * speed;
    const vy = Math.sin((angle * Math.PI) / 180) * speed;

    this.tweens.add({
      targets: text,
      x: text.x + vx * 2,
      y: text.y + vy * 2,
      alpha: 0,
      duration: 4000,
      ease: "Linear",
      onComplete: () => text.destroy(),
    });
  }

  private getRandomStartPosition(): { x: number; y: number } {
    const { width, height } = this.cameras.main;
    const side = Phaser.Math.Between(0, 3);

    switch (side) {
      case 0: // top
        return { x: Phaser.Math.Between(0, width), y: -20 };
      case 1: // right
        return { x: width + 20, y: Phaser.Math.Between(0, height) };
      case 2: // bottom
        return { x: Phaser.Math.Between(0, width), y: height + 20 };
      default: // left
        return { x: -20, y: Phaser.Math.Between(0, height) };
    }
  }

  destroy() {
    this.time.removeAllEvents();
    this.time.removeAllEvents();
    this.muteButton?.destroy();
    this.themeMusic?.stop();
    this.tweens.killAll();
  }

  startGame() {
    this.destroy();
    this.scene.start("MainScene");
  }
}

export default SplashScene;
