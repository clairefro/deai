import * as Phaser from "phaser";
import { AppConfig } from "../../../shared/Config";
import { Notebook } from "../components/Notebook";
import { SettingsMenu } from "../components/settings/SettingsMenu";
import { NotificationBar } from "../components/NotificationBar";
import { TeetorTotter } from "../components/TeetorTotter";
import playerImage from "../../assets/sprite.png";
import galleryRoomImage from "../../assets/world/gallery-room-debug.png";
import galleryRoomWalkableMaskImage from "../../assets/world/gallery-room-walkable-mask.png";
import { Librarian } from "../models/Librarian";
import ghostImage from "../../assets/ghost.png";
import { rand } from "../../../shared/util/rand";
import { pluck } from "../../../shared/util/pluck";
import { WalkableMask } from "../components/WalkableMask";
import { Player } from "../models/Player";
import { ActionManager } from "../actions/ActionManager";

class MainScene extends Phaser.Scene {
  private config!: AppConfig;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  // Entities
  private player!: Player;
  private librarians: Librarian[] = [];
  private notebook!: Notebook;
  private settingsMenu!: SettingsMenu;
  private walkableMask!: WalkableMask;

  // Actions
  private actionManager!: ActionManager;
  private enterKey!: Phaser.Input.Keyboard.Key;

  // Other state
  private hasMovedSinceAction: boolean = false;

  preload() {
    console.log("LIFECYCLE: MainScene preload started");

    this.load.image("gallery-room-map", galleryRoomImage);
    this.load.image("gallery-room-map-mask", galleryRoomWalkableMaskImage);

    this.load.image("player", playerImage);
    this.load.image("ghost", ghostImage);
  }

  async create() {
    this.actionManager = new ActionManager();

    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    // Load configuration
    this.config = await window.electronAPI.getConfig();

    // Add welcome text
    this.add.text(100, 100, "Welcome to the Library of Babel...", {
      font: "24px monospace",
      // @ts-ignore
      fill: "#ffffff",
    });

    const galleryRoom = this.add
      .image(gameWidth / 2, gameHeight / 2, "gallery-room-map")
      .setOrigin(0.5, 0.5);

    this.walkableMask = new WalkableMask(this, "gallery-room-map-mask", true);
    this.walkableMask.setBounds(galleryRoom.getBounds());

    // Set camera bounds to match the image size
    this.cameras.main.setBounds(0, 0, galleryRoom.width, galleryRoom.height);

    // const startPos = this.getRandomWalkablePosition();
    const startPos = { x: 400, y: 300 };
    this.player = new Player(
      this,
      startPos.x,
      startPos.y,
      "player",
      this.walkableMask
    );

    // this.player.setCollideWorldBounds(true); // Prevent the sprite from leaving the screen

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

    const librarianIds = await window.electronAPI.getLibrarianIds();
    const randomLibrarian = pluck(librarianIds); // select one at random for now
    this.librarians = (
      await Promise.all(
        [randomLibrarian].map((id) => Librarian.loadLibrarianById(this, id))
      )
    ).filter((l) => !!l) as Librarian[];

    // const guest = new Librarian({
    //   name: "Friedrich Wilhelm Nietzsche",
    //   scene: this,
    // });
    // this.librarians.push(guest);

    console.log({ librarians: this.librarians });

    const gameContainer = document.getElementById("game");
    if (gameContainer) {
      NotificationBar.initialize(gameContainer);
      TeetorTotter.initialize(gameContainer);
    }

    // place librarians
    this.spawnLibrarians();
  } // end create()

  private initializeComponents() {
    // Initialize components
    this.notebook = new Notebook(this);
    this.settingsMenu = new SettingsMenu(this, this.config, (newDir) => {
      console.log("Notes directory changed to:", newDir);

      // reload notebook files
      this.notebook.loadFiles();
    });
  }

  private async spawnLibrarians() {
    await Promise.all(
      this.librarians.map(async (librarian) => {
        const pos = this.getRandomWalkablePosition();
        await librarian.spawn(pos.x, pos.y);
      })
    );

    console.log(this.librarians);

    // add proximity actions to loaded librarians
    this.librarians.forEach((librarian) => {
      this.actionManager.addAction({
        target: librarian.getActionTarget(),
        range: 100,
        key: "chat",
        getLabel: () => `<Enter> to Chat with ${librarian.getDisplayName()}`,
        action: () => librarian.chat(),
      });
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

  // -- helpers --
  private isPointWalkable(x: number, y: number): boolean {
    // TWO ISSUES
    // 1. coordinate calculation
    // 2. mask rendering location

    // const galleryRoom = this.children.list.find(
    //   (child) =>
    //     (child as Phaser.GameObjects.Image).texture?.key === "gallery-room-map"
    // ) as Phaser.GameObjects.Image;

    // if (!galleryRoom) return false;

    // const bounds = galleryRoom.getBounds();

    // // Convert world coordinates to mask coordinates, accounting for center origin
    // const tx = Math.floor(x - (bounds.x - bounds.width / 2));
    // const ty = Math.floor(y - (bounds.y - bounds.height / 2));

    // // console.log("DEBUGGING: ", { bounds, x, y });
    // // this.drawBoundingBox(bounds);
    // // Early false if outside mask bounds
    // if (
    //   tx < 0 ||
    //   ty < 0 ||
    //   tx >= this.walkableMaskTexture.width ||
    //   ty >= this.walkableMaskTexture.height
    // ) {
    //   return false;
    // }

    // const context = this.walkableMaskTexture.getContext();
    // const imageData = context.getImageData(x, y, 1, 1);
    // console.log({ imageData });
    // console.log("oh");
    // return imageData.data[0] > 0; // r
    return true;
  }

  private getRandomWalkablePosition(): { x: number; y: number } {
    const fallbackCoords = { x: 400, y: 250 };
    const galleryRoom = this.children.list.find(
      (child) =>
        (child as Phaser.GameObjects.Image).texture?.key === "gallery-room-map"
    ) as Phaser.GameObjects.Image;

    if (!galleryRoom) {
      return fallbackCoords;
    }

    const bounds = galleryRoom.getBounds();
    console.log("yo", { bounds });

    let x = fallbackCoords.x;
    let y = fallbackCoords.y;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      x = rand(bounds.x - bounds.width / 2, bounds.x + bounds.width / 2);
      y = rand(bounds.y - bounds.height / 2, bounds.y + bounds.height / 2);
      console.log(`attempt: ${x}, ${y}`);
      attempts++;
    } while (!this.isPointWalkable(x, y) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      console.warn("Could not find walkable position, using fallback");
      return fallbackCoords;
    }

    return { x, y };
  }
}
export default MainScene;
