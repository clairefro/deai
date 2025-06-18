import * as Phaser from "phaser";
import { WalkableMask } from "../../../components/WalkableMask";
import { ActionableObject } from "../../../actions/ActionableObject";
import { ActionManager } from "../../../actions/ActionManager";
import {
  ExitPositions,
  Location,
  HexDirection,
  HEX_DIRECTIONS_PLANAR,
  RoomAssets,
  RoomType,
} from "../../../../types";
import { ACTIONS, EVENTS } from "../../../constants";

import galleryRoomMap from "../../../../assets/world/rooms/gallery.png";
import galleryRoomMapMask from "../../../../assets/world/rooms/gallery-room-walkable-mask.png";

import hallwayRoomMap from "../../../../assets/world/rooms/vestibule.png";
import hallwayRoomMapMask from "../../../../assets/world/rooms/vestibule-walkable-mask.png";

import doorImg from "../../../../assets/world/objects/door.png";

const DIRECTION_DISPLAY_NAMES: Record<HexDirection, string> = {
  ww: "W",
  ee: "E",
  ne: "NE",
  nw: "NW",
  se: "SE",
  sw: "SW",
  up: "up",
  dn: "down",
};

export class RoomManager {
  private scene: Phaser.Scene;
  private currentRoomType: RoomType | undefined;
  private currentBackground?: Phaser.GameObjects.Image;
  walkableMask?: WalkableMask;
  private exits: ActionableObject[] = [];
  private actionManager: ActionManager;

  private readonly roomAssets: Record<RoomType, RoomAssets> = {
    gallery: {
      backgroundImg: galleryRoomMap,
      backgroundKey: "gallery-room",
      walkableMaskImg: galleryRoomMapMask,
      walkableMaskKey: "gallery-room-mask",
    },
    hallway: {
      backgroundImg: hallwayRoomMap,
      backgroundKey: "vestibule-room",
      walkableMaskImg: hallwayRoomMapMask,
      walkableMaskKey: "vestibule-room-mask",
    },
    // bathroom: { background: "TODO", WalkableMask: "TODO" },
  };

  constructor(scene: Phaser.Scene, actionManager: ActionManager) {
    this.scene = scene;
    this.actionManager = actionManager;
  }

  preloadRoomAssets(): void {
    Object.values(this.roomAssets).forEach((assets) => {
      this.scene.load.image(assets.backgroundKey, assets.backgroundImg);
      this.scene.load.image(assets.walkableMaskKey, assets.walkableMaskImg);
    });

    // Load door and stairs sprites
    this.scene.load.image("door", doorImg);
    // this.scene.load.image("stairs", "assets/objects/stairs.png");
  }

  async renderRoom(location: Location): Promise<void> {
    if (this.scene.cameras.main.fadeEffect.isRunning) {
      await new Promise((resolve) => {
        this.scene.cameras.main.once(
          Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
          resolve
        );
      });
    }
    // clear existing room, if any
    await this.destroyCurrentRoom();

    this.scene.cameras.main.fadeIn(500);

    const assets = this.roomAssets[location.type];
    if (!assets) {
      throw new Error(`No assets found for room type: ${location.type}`);
    }

    // Create room background
    this.currentBackground = this.scene.add
      .image(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        assets.backgroundKey
      )
      .setOrigin(0.5, 0.5);

    // wait for bg to load
    await new Promise((resolve) => {
      if (this.scene.textures.exists(assets.backgroundKey)) {
        resolve(null);
      } else {
        this.scene.load.once(Phaser.Loader.Events.COMPLETE, resolve);
      }
    });

    // create walkable mask
    this.walkableMask = new WalkableMask(
      this.scene,
      assets.walkableMaskKey,
      this.currentBackground
      // true // enable for debug
    );

    // ensure WalkableMask is initialized
    await new Promise((resolve) => {
      if (this.scene.textures.exists(assets.walkableMaskKey)) {
        this.scene.time.delayedCall(100, resolve); // Small delay to ensure mask is ready
      } else {
        this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
          this.scene.time.delayedCall(100, resolve);
        });
      }
    });

    this.scene.events.emit(EVENTS.WALKABLE_MASK_CHANGED, this.walkableMask);

    // Add exits if it's a gallery
    if (location.type === "gallery") {
      this.createGalleryExits(location);
    }

    // Add stairs if it's a hallway
    if (location.type === "hallway") {
      this.createStairs();
    }

    this.currentRoomType = location.type;
    this.scene.events.emit(EVENTS.ROOM_READY, location);
  }

  private generateRandomGalleryExits(): HexDirection[] {
    return HEX_DIRECTIONS_PLANAR.sort(() => Math.random() - 0.5).slice(0, 2);
  }

  private createGalleryExits(location: Location): void {
    const exitPositions = this.calculateGalleryExitPositions();

    const exits = this.generateRandomGalleryExits();

    exits.forEach((direction) => {
      // const position = exitPositions[direction];
      const position = exitPositions[direction];
      if (!position) return;

      // Use a string key for the ActionableObject (e.g., "door")
      const exit = new ActionableObject(
        this.scene,
        position.x,
        position.y,
        "door",
        this.actionManager,
        {
          key: `exit-${direction}`,
          label: `<Enter> to go ${DIRECTION_DISPLAY_NAMES[direction]}`,
          rotation: position.rotation,
          range: ACTIONS.DOOR_RANGE,
          action: async () => {
            // disable input
            this.exits.forEach((exit) => exit.disable?.());

            this.scene.cameras.main.fadeOut(500);

            // gallery => hallway
            const nextLocation: Location = {
              type: "hallway",
              x: location.x,
              y: location.y,
              z: location.z,
              cameFrom: direction,
            };

            await this.renderRoom(nextLocation);

            this.scene.events.emit(EVENTS.EXIT_SELECTED, direction, location);
          },
        }
      );

      //   exit.setRotation(position.rotation);
      this.exits.push(exit);
    });
  }

  private createStairs(): void {
    const stairs = new ActionableObject(
      this.scene,
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      "stairs",
      this.actionManager,
      {
        key: "stairs",
        label: "<Enter> to use stairs",
        action: () => {
          this.scene.events.emit(EVENTS.STAIRS_SELECTED);
        },
      }
    );
    this.exits.push(stairs);
  }

  private calculateGalleryExitPositions(): ExitPositions {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const centerX = width / 2;
    const centerY = height / 2;

    const radius = Math.min(width, height) * 0.25;

    return {
      // rotations are in radians
      ee: {
        x: centerX + radius,
        y: centerY,
        rotation: Math.PI / 2,
      },
      ne: {
        x: centerX + radius * Math.cos(Math.PI / 3),
        y: centerY - radius * Math.sin(Math.PI / 3),
        rotation: -Math.PI / 2 - Math.PI / 3 + Math.PI,
      },
      nw: {
        x: centerX - radius * Math.cos(Math.PI / 3),
        y: centerY - radius * Math.sin(Math.PI / 3),
        rotation: -Math.PI / 2 - (2 * Math.PI) / 3 + Math.PI,
      },
      ww: {
        x: centerX - radius,
        y: centerY,
        rotation: -Math.PI / 2,
      },
      sw: {
        x: centerX - radius * Math.cos(Math.PI / 3),
        y: centerY + radius * Math.sin(Math.PI / 3),
        rotation: -Math.PI / 2 - (4 * Math.PI) / 3 + Math.PI,
      },
      se: {
        x: centerX + radius * Math.cos(Math.PI / 3),
        y: centerY + radius * Math.sin(Math.PI / 3),
        rotation: -Math.PI / 2 - (5 * Math.PI) / 3 + Math.PI,
      },
    };
  }

  getWalkableMask(): WalkableMask | undefined {
    return this.walkableMask;
  }

  private async destroyCurrentRoom(): Promise<void> {
    // Disable all exits first
    this.exits.forEach((exit) => {
      exit.disable?.();
      this.actionManager.removeAction(exit.getAction());
      exit.destroy();
    });
    this.exits = [];

    // Destroy walkable mask
    if (this.walkableMask) {
      this.walkableMask.destroy();
      this.walkableMask = undefined;
    }

    // Destroy background
    if (this.currentBackground) {
      this.currentBackground.destroy(true);
      this.currentBackground = undefined;
    }
    this.currentRoomType = undefined;
  }
}
