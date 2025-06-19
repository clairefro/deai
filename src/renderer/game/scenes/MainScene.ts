import * as Phaser from "phaser";
import { AppConfig } from "../../../shared/Config";
import { Notebook } from "../components/Notebook";
import { SettingsMenu } from "../components/settings/SettingsMenu";
import { NotificationBar } from "../components/NotificationBar";
import { TeetorTotter } from "../components/TeetorTotter";
import playerImage from "../../assets/sprite.png";
import ghostImage from "../../assets/ghost.png";
import { WalkableMask } from "../components/WalkableMask";
import { Player } from "../models/Player";
import { ActionManager } from "../actions/ActionManager";
import { RoomManager } from "./navigation/rooms/RoomManager";
import { Location } from "../../types";
import { EVENTS } from "../constants";

class MainScene extends Phaser.Scene {
  private config!: AppConfig;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  // Entities
  private player!: Player;
  // private librarians: Librarian[] = [];
  private notebook!: Notebook;
  private settingsMenu!: SettingsMenu;
  private walkableMask!: WalkableMask;

  // Actions
  private actionManager!: ActionManager;
  private enterKey!: Phaser.Input.Keyboard.Key;

  // Rooms
  private roomManager!: RoomManager;

  // Other state
  private hasMovedSinceAction: boolean = false;

  constructor() {
    super({ key: "MainScene" });
  }

  setupEventListeners() {
    this.events.on(EVENTS.WALKABLE_MASK_CHANGED, (newMask: WalkableMask) => {
      this.walkableMask = newMask;
      if (this.player) {
        this.player.setWalkableMask(newMask);
      }
    });

    this.events.on(EVENTS.ROOM_READY, () => {
      if (this.player) {
        console.log("PLAYER Y OFFFSET: ", this.player.getYOffset());
        const pos = this.walkableMask.getRandomWalkablePosition({
          y: this.player.getYOffset(),
        });
        this.player.setPosition(pos.x, pos.y);
      }
    });
  }

  initManagers() {
    this.actionManager = new ActionManager();
    this.roomManager = new RoomManager(this, this.actionManager);
  }

  preload() {
    console.log("LIFECYCLE: MainScene preload started");

    this.load.image("player", playerImage);
    this.load.image("ghost", ghostImage);

    this.initManagers();
    this.roomManager.preloadRoomAssets();
  }

  async create() {
    // Load configuration
    this.config = await window.electronAPI.getConfig();

    this.initializeComponents();

    // Add welcome text
    this.add
      .text(100, 50, "Welcome to the Library of Babel...", {
        font: "24px monospace",
        // @ts-ignore
        fill: "#ffffff",
      })
      .setDepth(9999);

    // IMPORTANT: SETUP AND PLAYER  LISTENERS BEFORE RENDERING ROOM
    this.setupEventListeners();

    this.player = new Player(
      this,
      -100, // temporary offscreen pos
      -100, // temporary offscreen pos
      "player",
      this.roomManager.walkableMask!
    );

    await this.roomManager.renderRoom();

    // create cursor keys for movement
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

    // const guest = new Librarian({
    //   name: "Friedrich Wilhelm Nietzsche",
    //   scene: this,
    // });
    // this.librarians.push(guest);

    // console.log({ librarians: this.librarians });

    const gameContainer = document.getElementById("game");
    if (gameContainer) {
      NotificationBar.initialize(gameContainer);
      TeetorTotter.initialize(gameContainer);
    }

    // place librarians
    // this.spawnLibrarians();
  }
  // end create()

  private initializeComponents() {
    // Initialize components
    this.notebook = new Notebook(this);
    this.settingsMenu = new SettingsMenu(this, this.config, (newDir) => {
      console.log("Notes directory changed to:", newDir);

      // reload notebook files
      this.notebook.loadFiles();
    });
  }

  private checkProximityActions(): void {
    if (!this.player) return;

    const playerPos = new Phaser.Math.Vector2(
      this.player.sprite.x,
      this.player.sprite.y
    );
    this.actionManager.checkProximity(playerPos);
  }

  private handleActionKey(): void {
    const currentAction = this.actionManager.getCurrentAction();
    if (currentAction) {
      currentAction.action();
      this.actionManager.clearCurrentAction();
      this.hasMovedSinceAction = false;
    }
  }

  update() {
    if (!this.cursors) return;

    if (this.player.update(this.cursors)) {
      this.checkProximityActions();
    }
  }

  shutdown() {
    // Clean up
    this.enterKey?.destroy();
  }
}
export default MainScene;
