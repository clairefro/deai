import splashLogoImg from "../../assets/splash/splash-logo.png";
import splashMusic from "../../assets/sound/music/clockwork.ogg";
import soundOnImg from "../../assets/volume-on.svg";
import soundOffImg from "../../assets/volume-off.svg";
import hexagonImg from "../../assets/deai.png";

const ltr =
  "011010010010000001110100011010000110111101110101.ΩεγώκαιεσύяитыIch-du나와너凸凹شकのಗಿದೆx☀Бi&thouאᄀ的ᚠを無有ကი∞߷စअहम्त्वम्ฉันและเธอእኔእናአንተმედაშენ我と汝ⴰⵏⴰⴷⵓⵔ";
const rtl = "منوتوאניואתה";

class SplashScene extends Phaser.Scene {
  private muteButton!: Phaser.GameObjects.Image;

  private hexGrid: Phaser.GameObjects.Image[] = [];

  private readonly BRICKS = (rtl + ltr).split("");

  private readonly INITIAL_BRICK_BURST_COUNT = 50;

  private readonly HEX_SIZE = 64;
  private readonly HEX_ALPHA_MIN = 0.01;
  private readonly HEX_ALPHA_MAX = 0.1;
  private readonly HEX_FADE = {
    MIN_DURATION: 3000,
    MAX_DURATION: 5000,
    CHANCE: 0.5,
  };

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

    this.load.image("hexagon", hexagonImg);
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
    this.createHexagonGrid();

    // center logo
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    console.log();

    this.add.image(centerX, centerY, "logo");

    //  music
    this.themeMusic = this.sound.add("theme", { loop: true });
    this.game.sound.pauseOnBlur = false;

    this.themeMusic.play();
    this.addMuteButton();

    // add text to start
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
    for (let i = 0; i < this.INITIAL_BRICK_BURST_COUNT; i++) {
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

    // toggle mute state on click
    this.muteButton.on("pointerdown", () => {
      const isMuted = !this.sound.mute;
      this.sound.setMute(isMuted);
      this.muteButton.setTexture(isMuted ? "sound-off" : "sound-on");
    });
  }
  private spawnLetter() {
    const startPosition = this.getRandomStartPosition();
    const letter = this.BRICKS[Phaser.Math.Between(0, this.BRICKS.length - 1)];

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

  private createHexagonGrid() {
    const { width, height } = this.cameras.main;
    const cols = Math.ceil(width / (this.HEX_SIZE * 0.75)) + 1;
    const rows = Math.ceil(height / (this.HEX_SIZE * 0.866)) + 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // offset every other row - (multiple by half od hex width)
        const offset = row % 2 ? this.HEX_SIZE * 0.445 : 0;
        const x = col * this.HEX_SIZE * 0.89 + offset;
        const y = row * this.HEX_SIZE * 0.78; // honestly, i eyeballed this

        const hex = this.add
          .image(x, y, "hexagon")
          .setOrigin(0.5)
          .setAlpha(this.HEX_ALPHA_MIN)
          .setDepth(-1);

        this.hexGrid.push(hex);

        // add random fade animation
        this.addHexagonFadeEffect(hex);
      }
    }
  }

  private addHexagonFadeEffect(hex: Phaser.GameObjects.Image) {
    if (Phaser.Math.FloatBetween(0, 1) > this.HEX_FADE.CHANCE) {
      return;
    }

    const duration = Phaser.Math.Between(
      this.HEX_FADE.MIN_DURATION,
      this.HEX_FADE.MAX_DURATION
    );
    const delay = Phaser.Math.Between(0, 2000);

    this.tweens.add({
      targets: hex,
      alpha: {
        from: this.HEX_ALPHA_MIN,
        to: this.HEX_ALPHA_MAX,
      },
      duration: duration,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
      delay: delay,
    });
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
