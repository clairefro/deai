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

import galleryRoomMap from "../../../../assets/world/rooms/gallery.png";
import galleryRoomMapMask from "../../../../assets/world/rooms/gallery-room-walkable-mask.png";

import hallwayRoomMap from "../../../../assets/world/rooms/vestibule.png";
import hallwayRoomMapMask from "../../../../assets/world/rooms/vestibule-walkable-mask.png";

import doorImg from "../../../../assets/world/objects/door.png";

export class RoomManager {
  private scene: Phaser.Scene;
  private currentRoomType: RoomType | undefined;
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
    // Clear existing room if any
    this.destroy();

    const assets = this.roomAssets[location.type];

    // const texture = this.scene.textures.get(assets.backgroundKey);
    // const { width, height } = texture.source[0];

    this.currentRoomType = location.type;

    const texture = this.scene.textures.get(assets.backgroundKey);
    if (!texture) {
      throw new Error(
        `Texture not found for ${location.type}: ${assets.backgroundKey}`
      );
    }

    // Create room background
    const background = this.scene.add
      .image(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        assets.backgroundKey
      )
      .setOrigin(0.5, 0.5);

    // Create walkable mask
    this.walkableMask = new WalkableMask(
      this.scene,
      assets.walkableMaskKey,
      background
    );

    // Add exits if it's a gallery
    console.log({ location });
    if (location.type === "gallery") {
      this.createGalleryExits(location);
    }

    // Add stairs if it's a hallway
    if (location.type === "hallway") {
      this.createStairs();
    }
  }

  private generateRandomGalleryExits(): HexDirection[] {
    return HEX_DIRECTIONS_PLANAR.sort(() => Math.random() - 0.5).slice(0, 2);
  }

  private createGalleryExits(location: Location): void {
    const exitPositions = this.calculateGalleryExitPositions();
    console.log({ exitPositions });

    const exits = this.generateRandomGalleryExits();
    console.log({ exits });

    exits.forEach((direction) => {
      // const position = exitPositions[direction];
      const position = exitPositions["se"];
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
          label: `<Enter> to go ${direction}`,
          rotation: position.rotation,
          action: () => {
            this.scene.events.emit("exitSelected", direction);
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
          this.scene.events.emit("stairsSelected");
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

  destroy(): void {
    this.currentRoomType = undefined;
    this.walkableMask?.destroy();
    this.exits.forEach((exit) => exit.destroy());
    this.exits = [];
  }
}
