import * as Phaser from "phaser";
import { AppConfig } from "../../../shared/Config";
import { Notebook } from "../components/Notebook";
import { SettingsMenu } from "../components/settings/SettingsMenu";
import { NotificationBar } from "../components/NotificationBar";
import { TokensBar } from "../components/TokensBar";
import playerImage from "../../assets/sprite.png";
import { Librarian } from "../models/Librarian";
import ghostImage from "../../assets/ghost.png";
import { DEPTHS } from "../constants";
import { rand } from "../../../shared/util/rand";
import { ChatDirectory } from "../components/ChatDirectory";
import { ProximityAction } from "../actions/types";

class MainScene extends Phaser.Scene {
  private config!: AppConfig;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  // Entities
  private player!: Phaser.Physics.Arcade.Sprite;
  private librarians: Librarian[] = [];
  private notebook!: Notebook;
  private settingsMenu!: SettingsMenu;
  private chatDirectory!: ChatDirectory;

  // Actions
  private proximityActions: ProximityAction[] = [];
  private currentAction: ProximityAction | null = null;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private hasMovedSinceAction = true;

  preload() {
    console.log("LIFECYCLE: MainScene preload started");

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
      this.enterKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER
      );
      this.enterKey.on(
        "down",
        (event: any) => {
          event.originalEvent.preventDefault(); // prevent propogation so that newlines aren't added in textarea of dialogs from action, etc
          this.handleActionKey();
        },
        this
      );
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
      NotificationBar.initialize(gameContainer);
      TokensBar.initialize(gameContainer);
    }

    // TODO: TEMP
    // place librarians
    this.spawnLibrarians();

    this.chatDirectory = new ChatDirectory(this);
  }

  private async spawnLibrarians() {
    // const guest = new Librarian({ name: "Chimamanda Adichie", scene: this });
    // this.librarians.push(guest);
    await Promise.all(
      this.librarians.map(async (librarian) => {
        await librarian.spawn(rand(100, 800), rand(200, 700));
      })
    );

    console.log(this.librarians);

    // add proximity actions to loaded librarians

    this.librarians.forEach((librarian) => {
      this.addProximityAction({
        target: librarian.getActionTarget(),
        range: 100,
        key: "chat",
        getLabel: () => `<Enter> to Chat with ${librarian.getDisplayName()}`,
        action: () => librarian.chat(),
      });
    });

    // console.log(JSON.stringify(guest.serialize(), null, 2));
    // const borges = new Librarian({ name: "Jorge Luis Borges", scene: this });
    // borges.spawn(500, 400);

    // await window.electronAPI.upsertLibrarianData(borges.serialize());
    // await window.electronAPI.upsertLibrarianData(baldwin.serialize());
  }
  private addProximityAction(action: ProximityAction): void {
    if (!action.target) {
      console.error("Cannot add action without target:", action);
      return;
    }
    this.proximityActions.push(action);
  }

  private checkProximityActions(): void {
    if (!this.player) return;

    const playerPos = new Phaser.Math.Vector2(this.player.x, this.player.y);
    let nearestAction: ProximityAction | null = null;
    let nearestDistance = Infinity;

    for (const action of this.proximityActions) {
      const targetX = action.target.x ?? 0;
      const targetY = action.target.y ?? 0;

      const targetPos = new Phaser.Math.Vector2(targetX, targetY);
      const distance = Phaser.Math.Distance.BetweenPoints(playerPos, targetPos);

      if (distance <= action.range && distance < nearestDistance) {
        nearestAction = action;
        nearestDistance = distance;
      }
    }

    // Update status bar if nearest action changed
    if (nearestAction !== this.currentAction) {
      this.currentAction = nearestAction;
      if (nearestAction) {
        NotificationBar.getInstance()?.show(nearestAction.getLabel());
      } else {
        NotificationBar.getInstance()?.clear();
      }
    }
  }

  private handleActionKey(): void {
    if (this.currentAction) {
      this.currentAction.action();
      NotificationBar.getInstance()?.clear();
      this.currentAction = null;
      this.hasMovedSinceAction = false;
    }
  }

  update() {
    if (!this.cursors) return;

    const isMoving =
      this.cursors.left?.isDown ||
      this.cursors.right?.isDown ||
      this.cursors.up?.isDown ||
      this.cursors.down?.isDown;

    if (isMoving) {
      this.hasMovedSinceAction = true;
    }

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

    if (this.hasMovedSinceAction) {
      this.checkProximityActions();
    }
  }

  shutdown() {
    // Clean up
    this.enterKey?.destroy();
    this.proximityActions = [];
    this.currentAction = null;
  }
}

export default MainScene;
