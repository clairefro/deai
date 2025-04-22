import * as Phaser from "phaser";
import { ConfigSettings } from "../../../shared/Config";

export class SettingsMenu {
  private scene: Phaser.Scene;
  private config: ConfigSettings;
  private settingsIcon!: Phaser.GameObjects.Container;
  private settingsMenu!: Phaser.GameObjects.Container;
  private onDirectoryChange: (newDir: string) => void;

  constructor(
    scene: Phaser.Scene,
    config: ConfigSettings,
    onDirectoryChange?: (newDir: string) => void
  ) {
    this.scene = scene;
    this.config = config;
    this.onDirectoryChange = onDirectoryChange || (() => {});
    this.create();
  }

  create(): void {
    // Create settings icon container
    this.settingsIcon = this.scene.add.container(
      this.scene.cameras.main.width - 50,
      this.scene.cameras.main.height - 50
    );
    this.settingsIcon.setDepth(100);

    // Create gear icon
    const gear = this.scene.add.graphics();
    gear.lineStyle(2, 0xffffff);
    gear.fillStyle(0x666666, 1);

    // Draw gear shape
    gear.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 15;
      const y = Math.sin(angle) * 15;
      if (i === 0) gear.moveTo(x, y);
      else gear.lineTo(x, y);
    }
    gear.closePath();
    gear.fill();
    gear.stroke();

    // Make gear interactive
    gear.setInteractive(
      new Phaser.Geom.Circle(0, 0, 15),
      Phaser.Geom.Circle.Contains
    );

    this.settingsIcon.add(gear);

    // Create settings menu container with correct positioning
    this.settingsMenu = this.scene.add.container(
      this.scene.cameras.main.width - 300,
      100 // Position from top instead of bottom
    );
    this.settingsMenu.setVisible(false);

    // Menu background
    const menuBg = this.scene.add.graphics();
    menuBg.fillStyle(0x333333, 0.95);
    menuBg.fillRoundedRect(0, 0, 250, 300, 8);

    // Menu title
    const title = this.scene.add.text(20, 20, "Settings", {
      font: "20px monospace",
      // @ts-ignore
      fill: "#ffffff",
    });

    // Settings options using actual config values
    const options = [
      {
        key: "notesDir",
        text: "Notes Directory",
        value: this.config.notesDir || "Not set",
      },
    ];

    const optionTexts = options.map((option, i) => {
      const y = 70 + i * 50;

      const label = this.scene.add.text(20, y, option.text, {
        font: "16px monospace",
        // @ts-ignore
        fill: "#ffffff",
      });

      const value = this.scene.add
        .text(20, y + 20, option.value, {
          font: "14px monospace",
          // @ts-ignore
          fill: "#aaaaaa",
        })
        .setInteractive({ useHandCursor: true });

      // Make value clickable to edit
      value.on("pointerdown", async () => {
        // Open native directory picker
        const selectedDir = await window.electronAPI.selectDirectory();

        if (selectedDir) {
          // Update config with selected directory
          const updates = { [option.key]: selectedDir };
          this.config = await window.electronAPI.updateConfig(updates);

          // Update display
          value.setText(selectedDir);

          // Notify parent about directory change
          if (option.key === "notesDir") {
            this.onDirectoryChange(selectedDir);
          }
        }
      });

      return [label, value];
    });

    // Add all elements to menu
    this.settingsMenu.add([menuBg, title, ...optionTexts.flat()]);

    gear.on("pointerdown", () => {
      this.settingsMenu.setVisible(!this.settingsMenu.visible);
    });
  }

  updateConfig(config: ConfigSettings): void {
    this.config = config;
  }
}
