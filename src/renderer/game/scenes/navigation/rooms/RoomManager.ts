import * as Phaser from "phaser";
import { WalkableMask } from "../../../components/WalkableMask";
import { ActionableObject } from "../../../actions/ActionableObject";
import { ActionManager } from "../../../actions/ActionManager";
import {
  ExitPositions,
  Location,
  HexDirection,
  RoomAssets,
  RoomType,
} from "../../../../types";
import {
  ACTIONS,
  EVENTS,
  HEX_DIRECTIONS_PLANAR,
  OPPOSITE_DIRECTIONS,
  DIRECTION_OFFSETS,
} from "../../../constants";
import { Librarian } from "../../../models/Librarian";

import { pluck } from "../../../../../shared/util/pluck";

import galleryRoomMap from "../../../../assets/world/rooms/gallery.png";
import galleryRoomMapMask from "../../../../assets/world/rooms/gallery-room-walkable-mask.png";

import vestibuleRoomMap from "../../../../assets/world/rooms/vestibule.png";
import vestibuleRoomMapMask from "../../../../assets/world/rooms/vestibule-walkable-mask.png";

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
  private currentBackground?: Phaser.GameObjects.Image;
  private currentLocation: Location;
  walkableMask?: WalkableMask;
  private exits: ActionableObject[] = [];
  private stairs: ActionableObject[] = [];
  private actionManager: ActionManager;
  private librarians: Librarian[] = [];

  private readonly roomAssets: Record<RoomType, RoomAssets> = {
    gallery: {
      backgroundImg: galleryRoomMap,
      backgroundKey: "gallery-room",
      walkableMaskImg: galleryRoomMapMask,
      walkableMaskKey: "gallery-room-mask",
    },
    vestibule: {
      backgroundImg: vestibuleRoomMap,
      backgroundKey: "vestibule-room",
      walkableMaskImg: vestibuleRoomMapMask,
      walkableMaskKey: "vestibule-room-mask",
    },
    // bathroom: { background: "TODO", WalkableMask: "TODO" },
  };

  constructor(scene: Phaser.Scene, actionManager: ActionManager) {
    this.scene = scene;
    this.actionManager = actionManager;

    // TODO: RETRIEVE LAST LOCATION ON INIT?
    const startLocation: Location = {
      type: "gallery",
      x: 0,
      y: 0,
      z: 0,
      cameFrom: "sw",
    };
    this.currentLocation = startLocation;
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

  async renderRoom(location?: Location): Promise<void> {
    await this.destroyCurrentRoom();

    if (location) this.currentLocation = location;
    console.log("LOCATION: ", this.currentLocation);
    // clear existing room, if any

    this.scene.cameras.main.fadeIn(500);

    const assets = this.roomAssets[this.currentLocation.type];
    if (!assets) {
      throw new Error(
        `No assets found for room type: ${this.currentLocation.type}`
      );
    }

    // Create room background
    this.currentBackground = this.scene.add
      .image(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        assets.backgroundKey
      )
      .setOrigin(0.5, 0.5);

    // create walkable mask
    this.walkableMask = new WalkableMask(
      this.scene,
      assets.walkableMaskKey,
      this.currentBackground
      // true // enable for debug
    );

    this.scene.events.emit(EVENTS.WALKABLE_MASK_CHANGED, this.walkableMask);

    this.createExits(this.currentLocation);

    // Add stairs if it's a vestibule
    if (this.currentLocation.type === "vestibule") {
      this.createStairs();
    }

    if (
      this.currentLocation.type === "gallery" ||
      this.currentLocation.type === "vestibule"
    ) {
      this.spawnRandomLibrarian();
    }
    this.scene.events.emit(EVENTS.ROOM_READY, location);
  }

  private createExits(location: Location): void {
    const exitPositions =
      location.type === "gallery"
        ? this.calculateGalleryExitPositions()
        : this.calculateVestibuleExitPositions();

    const exits =
      location.type === "gallery"
        ? this.generateRandomGalleryExits()
        : (["ee", "ww"] as HexDirection[]);

    exits.forEach((direction) => {
      const position = exitPositions[direction];
      if (!position) return;

      const nextLocationType =
        location.type === "gallery" ? "vestibule" : "gallery";

      const exit = new ActionableObject(
        this.scene,
        position.x,
        position.y,
        "door",
        this.actionManager,
        {
          key: `${ACTIONS.PREFIX_EXIT}${direction}`,
          label: `<Enter> to go ${DIRECTION_DISPLAY_NAMES[direction]}`,
          rotation: position.rotation,
          range: ACTIONS.DOOR_RANGE,
          action: async () => {
            this.exits.forEach((exit) => exit.disable?.());
            this.scene.cameras.main.fadeOut(500);

            const nextCoords = this.calculateNextCoordinates(
              location,
              direction
            );

            const nextLocation: Location = {
              type: nextLocationType,
              x: nextCoords.x,
              y: nextCoords.y,
              z: nextCoords.z,
              cameFrom: direction,
            };
            this.currentLocation = nextLocation;
            await this.renderRoom(nextLocation);
            this.scene.events.emit(EVENTS.EXIT_SELECTED, direction, location);
          },
        }
      );
      this.exits.push(exit);
    });
  }

  private generateRandomGalleryExits(): HexDirection[] {
    return HEX_DIRECTIONS_PLANAR.sort(() => Math.random() - 0.5).slice(0, 2);
  }

  private createStairs(): void {
    const positions = this.calculateStairsPositions();
    // clear existing stairs
    this.stairs.forEach((stair) => stair.destroy());
    this.stairs = [];

    // Create up and down stairs
    ["up", "dn"].forEach((direction) => {
      const stair = this.createStairAction(
        direction as "up" | "dn",
        positions[direction as keyof typeof positions]
      );
      this.stairs.push(stair);
    });
  }

  private createStairAction(
    direction: "up" | "dn",
    position: { x: number; y: number }
  ): ActionableObject {
    console.log("STAIR ACTION CUR LOC", this.currentLocation);
    const displayText = direction === "up" ? "upstairs" : "downstairs";

    return new ActionableObject(
      this.scene,
      position.x,
      position.y,
      "stairs",
      this.actionManager,
      {
        key: `${ACTIONS.PREFIX_STAIRS}${direction}`,
        label: `<Enter> to go ${displayText}`,
        range: ACTIONS.STAIRS_RANGE,
        action: async () => {
          // Disable both stairs
          this.stairs.forEach((stair) => stair.disable?.());
          this.scene.cameras.main.fadeOut(500);

          const nextLocation: Location = {
            type: "vestibule",
            x: this.currentLocation!.x,
            y: this.currentLocation!.y,
            z: this.currentLocation!.z + (direction === "up" ? 1 : -1),
            cameFrom: direction,
          };

          this.currentLocation = nextLocation;
          await this.renderRoom(nextLocation);
          this.scene.events.emit(
            EVENTS.STAIRS_SELECTED,
            direction,
            this.currentLocation
          );
        },
      }
    );
  }

  private calculateStairsPositions() {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    const separation = 40;

    return {
      up: { x: centerX, y: centerY - separation / 2 },
      down: { x: centerX, y: centerY + separation / 2 },
    };
  }

  private calculateVestibuleExitPositions(): ExitPositions {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const centerX = width / 2;
    const centerY = height / 2;

    const doorOffset = width * 0.2;

    return {
      ee: {
        x: centerX + doorOffset,
        y: centerY,
        rotation: Math.PI / 2,
      },
      ww: {
        x: centerX - doorOffset,
        y: centerY,
        rotation: -Math.PI / 2,
      },
    };
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

  private calculateNextCoordinates(
    current: Location,
    direction: HexDirection
  ): { x: number; y: number; z: number } {
    // if in gallery, calculate hex grid movement
    if (current.type === "gallery") {
      const [dx, dy] = DIRECTION_OFFSETS[direction];
      return {
        x: current.x + dx,
        y: current.y + dy,
        z: current.z,
      };
    }

    // if in vestibule, calculate movement based on entry direction
    if (current.type === "vestibule") {
      // if moving through vestibule (ee/ww), maintain same coordinates
      if (direction === "ee" || direction === "ww") {
        return { x: current.x, y: current.y, z: current.z };
      }

      // if using stairs, change z level
      if (direction === "up" || direction === "dn") {
        return {
          x: current.x,
          y: current.y,
          z: current.z + (direction === "up" ? 1 : -1),
        };
      }

      // if exiting vestibule to gallery, calculate opposite movement from entry
      const exitOffset = OPPOSITE_DIRECTIONS[current.cameFrom || "ww"];

      const [dx, dy] = DIRECTION_OFFSETS[exitOffset];
      return {
        x: current.x + dx,
        y: current.y + dy,
        z: current.z,
      };
    }

    return { x: current.x, y: current.y, z: current.z };
  }

  getWalkableMask(): WalkableMask | undefined {
    return this.walkableMask;
  }

  async spawnRandomLibrarian(): Promise<void> {
    // Clear previous librarians
    this.librarians.forEach((librarian) => {
      this.actionManager.removeAction(
        `${ACTIONS.PREFIX_LIBRIAN_CHAT}${librarian.getId()}`
      );
      librarian.destroy();
    });
    this.librarians = [];

    // Get random librarian
    const librarianIds = await window.electronAPI.getLibrarianIds();
    const randomId = pluck(librarianIds);

    const librarian = await Librarian.loadLibrarianById(this.scene, randomId);
    if (!librarian) return;

    // spawn in walkable area
    const pos = this.walkableMask?.getRandomWalkablePosition();
    if (pos) {
      await librarian.spawn(pos.x, pos.y);
      this.librarians.push(librarian);

      // add chat action
      this.actionManager.addAction({
        target: librarian.getActionTarget(),
        range: 100,
        key: `${ACTIONS.PREFIX_LIBRIAN_CHAT}${librarian.getId()}`,
        getLabel: () => `<Enter> to Chat with ${librarian.getDisplayName()}`,
        action: () => librarian.chat(),
      });
    }
  }

  private async destroyCurrentRoom(): Promise<void> {
    // destroy all exits
    this.exits.forEach((exit) => {
      exit.disable?.();
      this.actionManager.removeAction(exit.getAction().key);
      exit.destroy();
    });
    this.exits = [];

    // destroy all stairs
    this.stairs.forEach((stair) => {
      stair.disable?.();
      this.actionManager.removeAction(stair.getAction().key);
      stair.destroy();
    });

    // destroy librarians
    this.librarians.forEach((librarian) => {
      const chatActionKey = `${
        ACTIONS.PREFIX_LIBRIAN_CHAT
      }${librarian.getId()}`;
      this.actionManager.removeAction(chatActionKey);
      librarian.destroy();
    });
    this.librarians = [];

    // destroy walkable mask
    if (this.walkableMask) {
      this.walkableMask.destroy();
      this.walkableMask = undefined;
    }

    // destroy background
    if (this.currentBackground) {
      this.currentBackground.destroy(true);
      this.currentBackground = undefined;
    }
  }
}
