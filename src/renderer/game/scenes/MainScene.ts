import * as Phaser from "phaser";
import { ConfigSettings } from "../../../shared/Config";
import { Notebook } from "../components/Notebook";
import { SettingsMenu } from "../components/settings/SettingsMenu";
import { StatusBar } from "../components/StatusBar";
import playerImage from "../../assets/sprite.png";
import { Librarian } from "../models/Librarian";
import ghostImage from "../../assets/ghost.png";
import { DEPTHS } from "../constants";

class MainScene extends Phaser.Scene {
  private config!: ConfigSettings;
  private notebook!: Notebook;
  private settingsMenu!: SettingsMenu;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  // TODO: TEMP
  private baldwin!: Librarian;
  private librarians: Librarian[] = [];

  preload() {
    this.load.image("player", playerImage);
    this.load.image("ghost", ghostImage);
  }

  async create() {
    console.log("Input plugin", this.input.keyboard);
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
    this.settingsMenu = new SettingsMenu(this, this.config, (_newDir) => {
      // Handle directory change in notebook by reloading files
      this.notebook.loadFiles();
    });

    this.player = this.physics.add.sprite(300, 400, "player");
    this.player.setCollideWorldBounds(true); // Prevent the sprite from leaving the screen
    this.player.setDepth(DEPTHS.PLAYER);

    // Create cursor keys for movement
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    } else {
      throw new Error(
        "Error when attempting to intiialize keyboard keys. Do you have a keyboard?"
      );
    }

    const gameContainer = document.getElementById("game");
    if (gameContainer) {
      StatusBar.initialize(gameContainer);
    }

    // TODO: TEMP
    this.baldwin = new Librarian({ name: "James Baldwin", scene: this });
    this.baldwin.spawn(400, 300);
    this.librarians.push(this.baldwin);

    console.log("Scene Depths:", {
      player: this.player.depth,
      baldwin: {
        container: this.baldwin.getContainer()?.depth,
        sprite: this.baldwin.getSprite()?.depth,
        nameText: this.baldwin.getNameText()?.depth,
      },
    });
  }

  update() {
    if (!this.cursors) return;
    // Game loop logic
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-200); // Move left
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(200); // Move right
    } else {
      this.player.setVelocityX(0); // Stop horizontal movement
    }

    if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-200); // Move up
    } else if (this.cursors.down?.isDown) {
      this.player.setVelocityY(200); // Move down
    } else {
      this.player.setVelocityY(0); // Stop vertical movement
    }
  }
}

export default MainScene;
