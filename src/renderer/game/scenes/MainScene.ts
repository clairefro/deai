import * as Phaser from "phaser";
import { AppConfig } from "../../../shared/Config";
import { Notebook } from "../components/Notebook";
import { SettingsMenu } from "../components/settings/SettingsMenu";
import { StatusBar } from "../components/StatusBar";
import playerImage from "../../assets/sprite.png";
import { Librarian } from "../models/Librarian";
import ghostImage from "../../assets/ghost.png";
import { DEPTHS } from "../constants";
import { rand } from "../../../shared/util/rand";

class MainScene extends Phaser.Scene {
  private config!: AppConfig;
  private notebook!: Notebook;
  private settingsMenu!: SettingsMenu;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private librarians: Librarian[] = [];

  preload() {
    this.load.image("player", playerImage);
    this.load.image("ghost", ghostImage);
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
      console.log("Notes directory changed to:", newDir);

      // reload notebook files
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

    const librariansData = await window.electronAPI.getLibrariansData();

    this.librarians = librariansData.map(
      (data) => new Librarian({ data, scene: this })
    );

    const gameContainer = document.getElementById("game");
    if (gameContainer) {
      StatusBar.initialize(gameContainer);
    }

    // TODO: TEMP
    // place librarians
    this.librarians.forEach((librarian) => {
      librarian.spawn(rand(100, 800), rand(200, 700));
    });

    console.log(this.librarians);
    const buber = new Librarian({ name: "Martin Buber", scene: this });
    buber.spawn(400, 300);
    // const borges = new Librarian({ name: "Jorge Luis Borges", scene: this });
    // borges.spawn(500, 400);

    // await window.electronAPI.upsertLibrarianData(borges.serialize());
    // await window.electronAPI.upsertLibrarianData(baldwin.serialize());
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
