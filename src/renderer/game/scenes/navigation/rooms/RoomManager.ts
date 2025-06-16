import * as Phaser from "phaser";
import { WalkableMask } from "../../../components/WalkableMask";
import { ActionableObject } from "../../../actions/ActionableObject";
import { ActionManager } from "../../../actions/ActionManager";
import {
  RoomConfig,
  ExitPositions,
  Location,
  HexDirection
  HEX_DIRECTIONS_PLANAR,
} from "../../../../types";

export class RoomManager {
  private scene: Phaser.Scene;
  private currentRoom?: Phaser.GameObjects.Image;
  private walkableMask?: WalkableMask;
  private exits: ActionableObject[] = [];
  private actionManager: ActionManager;

  constructor(scene: Phaser.Scene, actionManager: ActionManager) {
    this.scene = scene;
    this.actionManager = actionManager;
  }

  async renderRoom(location: Location, config: RoomConfig): Promise<void> {
    // Clear existing room if any
    this.destroy();

    const { width, height } = config;

    // Create room background
    this.currentRoom = this.scene.add
      .image(width / 2, height / 2, config.assets.background)
      .setOrigin(0.5, 0.5);

    // Create walkable mask
    this.walkableMask = new WalkableMask(
      this.scene,
      config.assets.walkableMask,
      this.currentRoom
    );

    // Add exits if it's a gallery
    if (location.type === "gallery" && location.exits) {
      this.createExits(location);
    }

    // Add stairs if it's a hallway
    if (location.type === "hallway") {
      this.createStairs();
    }
  }

  private generateRandomExits(): HexDirection[] {
    return HEX_DIRECTIONS_PLANAR.sort(() => Math.random() - 0.5).slice(0, 2);
  }

  private createExits(location: Location): void {
    const exitPositions = this.calculateExitPositions();

    location.exits?.forEach((direction) => {
      const position = exitPositions[direction];
      if (!position) return;

      const exit = new ActionableObject(
        this.scene,
        position.x,
        position.y,
        "door",
        this.actionManager,
        {
          key: `exit-${direction}`,
          label: `<Enter> to go ${direction}`,
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

  private calculateExitPositions(): ExitPositions {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    return {
      ne: { x: width * 0.85, y: height * 0.25, rotation: Math.PI / 6 },
      nw: { x: width * 0.15, y: height * 0.25, rotation: -Math.PI / 6 },
      ee: { x: width * 0.95, y: height * 0.5, rotation: Math.PI / 2 },
      ww: { x: width * 0.05, y: height * 0.5, rotation: -Math.PI / 2 },
      se: { x: width * 0.85, y: height * 0.75, rotation: -Math.PI / 6 },
      sw: { x: width * 0.15, y: height * 0.75, rotation: Math.PI / 6 },
    };
  }

  getWalkableMask(): WalkableMask | undefined {
    return this.walkableMask;
  }

  destroy(): void {
    this.currentRoom?.destroy();
    this.walkableMask?.destroy();
    this.exits.forEach((exit) => exit.destroy());
    this.exits = [];
  }
}
