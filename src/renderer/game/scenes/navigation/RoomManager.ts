import * as Phaser from "phaser";
import { HexDirection, Location, RoomType } from "../../../types";
import { EVENTS } from "../../constants";
import { ActionManager } from "../../actions/ActionManager";
import { NavigationManager } from "./NavigationManager";
import { WalkableMask } from "../../components/WalkableMask";
import { RoomAssetsManager } from "./components/RoomAssetsManager";
import { ExitsManager } from "./components/ExitsManager";
import { LibrarianManager } from "./components/LibrarianManager";
import { BookshelfManager } from "./components/BookshelfManager";

export class RoomManager {
  private currentBackground?: Phaser.GameObjects.Image;
  walkableMask?: WalkableMask;
  private currentLocation: Location;

  private readonly assetsManager: RoomAssetsManager;
  private readonly exitsManager: ExitsManager;
  private readonly librarianManager: LibrarianManager;
  private readonly bookshelfManager: BookshelfManager;

  constructor(
    private scene: Phaser.Scene,
    actionManager: ActionManager,
    navigationManager: NavigationManager
  ) {
    // Initialize component managers
    this.assetsManager = new RoomAssetsManager(scene);
    this.exitsManager = new ExitsManager(
      scene,
      actionManager,
      navigationManager,
      this.renderRoom.bind(this)
    );
    this.librarianManager = new LibrarianManager(scene, actionManager);
    this.bookshelfManager = new BookshelfManager(scene, actionManager);

    this.currentLocation = navigationManager.getCurrentLocation();
  }

  preloadRoomAssets(): void {
    this.assetsManager.preload();
  }

  async renderRoom(location?: Location): Promise<void> {
    await this.destroyCurrentRoom();

    if (location) {
      this.currentLocation = location;
      this.scene.events.emit(EVENTS.LOCATION_CHANGED, location);
    }
    this.scene.cameras.main.fadeIn(500);

    // Create room background and mask
    await this.createRoomBackground();

    // Create exits based on room type
    const exits = this.exitsManager.createExits(this.currentLocation);

    // Add room-specific features
    if (this.currentLocation.type === "gallery") {
      await this.createGalleryFeatures(exits);
    } else if (this.currentLocation.type === "vestibule") {
      await this.createVesitubleFeatures();
    }

    this.scene.events.emit(EVENTS.ROOM_READY, this.currentLocation);
  }

  private async createRoomBackground(): Promise<void> {
    const assets = this.assetsManager.getAssets(this.currentLocation.type);

    this.currentBackground = this.scene.add
      .image(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        assets.backgroundKey
      )
      .setOrigin(0.5, 0.5);

    this.walkableMask = new WalkableMask(
      this.scene,
      assets.walkableMaskKey,
      this.currentBackground
    );

    this.librarianManager.setWalkableMask(this.walkableMask);
    this.scene.events.emit(EVENTS.WALKABLE_MASK_CHANGED, this.walkableMask);
  }

  private async createGalleryFeatures(exits: HexDirection[]): Promise<void> {
    this.bookshelfManager.createBookshelves(exits);

    // chance
    if (Math.random() < 0.85) {
      await this.librarianManager.spawnRandom();
    }
  }

  private async createVesitubleFeatures(): Promise<void> {
    this.exitsManager.createStairs();

    //  chance
    if (Math.random() < 0.25) {
      await this.librarianManager.spawnRandom();
    }
  }

  private async destroyCurrentRoom(): Promise<void> {
    this.exitsManager.destroy();
    this.librarianManager.destroy();
    this.bookshelfManager.destroy();

    if (this.walkableMask) {
      this.scene.events.emit(EVENTS.WALKABLE_MASK_CHANGED, null);
      this.walkableMask.destroy();
      this.walkableMask = undefined;
    }

    if (this.currentBackground) {
      this.currentBackground.destroy(true);
      this.currentBackground = undefined;
    }
  }

  getCurrentLocation(): Location {
    return this.currentLocation;
  }

  getWalkableMask(): WalkableMask | undefined {
    return this.walkableMask;
  }
}
