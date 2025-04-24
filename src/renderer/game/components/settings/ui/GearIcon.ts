import * as Phaser from "phaser";

export class GearIcon {
  private icon: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, onClick: () => void) {
    this.icon = scene.add.text(
      scene.cameras.main.width - 50,
      scene.cameras.main.height - 50,
      "⚙️",
      {
        font: "24px monospace",
        color: "#ffffff",
      }
    );

    this.icon.setInteractive({ useHandCursor: true });
    this.icon.setDepth(100);
    this.icon.on("pointerdown", onClick);
  }
}
