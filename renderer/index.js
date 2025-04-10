class MainScene extends Phaser.Scene {
  preload() {
    this.load.image("bg", "path/to/bg.png"); // Optional
  }

  create() {
    this.add.text(100, 100, "Welcome to the Library of Babel.....", {
      font: "24px monospace",
      fill: "#ffffff",
    });
  }

  update() {
    // Game loop logic
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  scene: MainScene,
});
