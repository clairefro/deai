import * as Phaser from "phaser";
import { ConfigSettings } from "../../../shared/Config";
import { Notebook } from "../components/Notebook";
import { SettingsMenu } from "../components/SettingsMenu";

class MainScene extends Phaser.Scene {
  private config!: ConfigSettings;
  private notebook!: Notebook;
  private settingsMenu!: SettingsMenu;

  preload() {
    // Optional preload of assets
  }

  async create() {
    // Load configuration
    this.config = await window.electronAPI.getConfig();

    // Add welcome text
    this.add.text(100, 100, "Welcome to the Library of Babel...", {
      font: "24px monospace",
      // @ts-ignore
      fill: "#ffffff",
    });

    // Initialize components
    this.notebook = new Notebook(this);
    this.settingsMenu = new SettingsMenu(this, this.config, (newDir) => {
      // Handle directory change by reloading files
      this.notebook.loadFiles();
    });
  }

  update() {
    // Game loop logic
  }
}

export default MainScene;
