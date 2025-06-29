import * as Phaser from "phaser";
import { AppConfig } from "../../../shared/Config";
import { Notebook } from "../components/Notebook";
import { SettingsMenu } from "../components/settings/SettingsMenu";
import { NotificationBar } from "../components/NotificationBar";
import { TeetorTotter } from "../components/TeetorTotter";
import playerImage from "../../assets/sprite.png";
import { WalkableMask } from "../components/WalkableMask";
import { Player } from "../models/Player";
import { ActionManager } from "../actions/ActionManager";
import { NavigationManager } from "./navigation/NavigationManager";
import { RoomManager } from "./navigation/RoomManager";
import { EVENTS, LIBRARIAN_CONFIG } from "../constants";
import { LocationDisplay } from "../components/LocationDisplay";
import ghostSpriteSheet from "../../assets/ghostSpritesheet.png";

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

  // Navigation
  private navigationManager!: NavigationManager;
  // Rooms
  roomManager!: RoomManager;

  // Other state
  private hasMovedSinceAction: boolean = false;

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    console.log("LIFECYCLE: MainScene preload started");

    // load assets
    this.load.image("player", playerImage);
    // this.load.image("ghost", ghostImage);

    // load ghost (Librarian) spritesheet
    this.load.spritesheet(
      LIBRARIAN_CONFIG.DEFAULTS.IMAGE_KEY,
      ghostSpriteSheet,
      {
        frameWidth: 50,
        frameHeight: 50,
      }
    );

    // setup managers
    this.actionManager = new ActionManager();
    this.navigationManager = new NavigationManager();
    this.roomManager = new RoomManager(
      this,
      this.actionManager,
      this.navigationManager
    );
    this.roomManager.preloadRoomAssets();

    // create animations once everything else complete
    this.load.on("complete", () => {
      this.anims.create({
        key: "ghost-idle",
        frames: this.anims.generateFrameNumbers("ghost", { start: 0, end: 2 }),
        frameRate: 5,
        repeat: -1,
      });
    });
  }

  async create() {
    // Load configuration
    this.config = await window.electronAPI.getConfig();
    await this.initializeScene();
  }

  private async initializeScene() {
    this.initComponents();

    this.setupEventListeners(); // IMPORTANT: do this before init play and room

    await this.initPlayer();
    await this.initRoom();
    this.setupControls();
    this.initUI();
  }

  /** UI components peripheral to game  */
  private initComponents() {
    this.notebook = new Notebook(this);
    this.settingsMenu = new SettingsMenu(this, this.config, (newDir) => {
      console.log("Notes directory changed to:", newDir);
      // reload notebook files
      this.notebook.loadFiles();
    });
  }

  private setupEventListeners(): void {
    console.log("LIFECYCLE: Setup event listeners");

    this.events.on(EVENTS.WALKABLE_MASK_CHANGED, (newMask: WalkableMask) => {
      this.walkableMask = newMask;
      this.player?.setWalkableMask(newMask);
    });

    this.events.on(EVENTS.ROOM_READY, () => {
      if (!this.player || !this.walkableMask) return;

      const pos = this.walkableMask.getRandomWalkablePosition({
        y: this.player.getYOffset(),
      });
      this.player.setPosition(pos.x, pos.y);
    });

    this.events.on(EVENTS.LOCATION_CHANGED, () => {
      const location = this.roomManager.getCurrentLocation();
      LocationDisplay.getInstance()?.updateLocation(
        location.type,
        location.x,
        location.y,
        location.z
      );
    });

    this.events.on(EVENTS.STAIRS_SELECTED, () => {
      const location = this.roomManager.getCurrentLocation();
      LocationDisplay.getInstance()?.updateLocation(
        location.type,
        location.x,
        location.y,
        location.z
      );
    });
  }

  private async initPlayer(): Promise<void> {
    console.log("LIFECYCLE: Init player");
    // initialize offscreen
    this.player = new Player(
      this,
      -100,
      -100,
      "player",
      this.roomManager.walkableMask!
    );
  }

  private async initRoom(): Promise<void> {
    console.log("LIFECYCLE: Init room ");
    await this.navigationManager.loadLastLocation();

    await this.roomManager.renderRoom(
      this.navigationManager.getCurrentLocation()
    );
  }

  private setupControls(): void {
    console.log("LIFECYCLE: Setup controls ");
    if (!this.input.keyboard) {
      throw new Error("Keyboard not available");
    }

    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );
    this.enterKey.on("down", this.handleEnterKey, this);
  }

  private checkProximityActions(): void {
    if (!this.player) return;

    const playerPos = new Phaser.Math.Vector2(
      this.player.sprite.x,
      this.player.sprite.y
    );
    this.actionManager.checkProximity(playerPos);
  }

  /** this event is a Phaser keydown event... can't find the event type though */
  private handleEnterKey(event: any): void {
    event.originalEvent.preventDefault();
    const currentAction = this.actionManager.getCurrentAction();
    if (currentAction) {
      currentAction.action();
      this.actionManager.clearCurrentAction();
      this.hasMovedSinceAction = false;
    }
  }

  private initUI(): void {
    const gameContainer = document.getElementById("game");
    if (!gameContainer) return;

    NotificationBar.initialize(gameContainer);
    TeetorTotter.initialize(gameContainer);
    LocationDisplay.initialize(gameContainer);

    const initialLocation = this.roomManager.getCurrentLocation();
    LocationDisplay.getInstance()?.updateLocation(
      initialLocation.type,
      initialLocation.x,
      initialLocation.y,
      initialLocation.z
    );
  }

  update(): void {
    if (!this.cursors || !this.player) return;

    if (this.player.update(this.cursors)) {
      this.checkProximityActions();
    }
  }

  shutdown() {
    this.enterKey?.destroy();
  }
}
export default MainScene;
