import { ActionableObject } from "../../../actions/ActionableObject";
import { ActionManager } from "../../../actions/ActionManager";
import { NavigationManager } from "../NavigationManager";
import { ACTIONS, DIRECTION_DISPLAY_NAMES } from "../../../constants";
import {
  Location,
  HexDirection,
  RoomType,
  VerticalDirection,
} from "../../../../types";

import { ExitPosition, ExitPositions } from "../../../../types";

export class ExitsManager {
  private exits: ActionableObject[] = [];
  private stairs: ActionableObject[] = [];

  constructor(
    private scene: Phaser.Scene,
    private actionManager: ActionManager,
    private navigationManager: NavigationManager,
    private onExit: (nextLocation: Location) => Promise<void>
  ) {}

  createExits(location: Location): HexDirection[] {
    const exitPositions = this.calculateExitPositions(location.type);
    const exits =
      location.type === "gallery"
        ? this.generateRandomGalleryExits()
        : (["ee", "ww"] as HexDirection[]);

    exits.forEach((direction) => {
      const position = exitPositions[direction];
      if (position) {
        this.createExit(direction, position);
      }
    });
    return exits;
  }

  createStairs(): void {
    const positions = this.calculateStairsPositions();
    ["up", "dn"].forEach((direction) => {
      this.createStair(
        direction as "up" | "dn",
        positions[direction as keyof typeof positions]
      );
    });
  }

  private createExit(direction: HexDirection, position: ExitPosition): void {
    const exit = new ActionableObject(
      this.scene,
      position.x,
      position.y,
      "door",
      this.actionManager,
      {
        key: `${ACTIONS.PREFIX_EXIT}${direction}`,
        label: `<Enter> go ${DIRECTION_DISPLAY_NAMES[direction]}`,
        rotation: position.rotation,
        range: ACTIONS.DOOR_RANGE,
        action: async () => {
          this.exits.forEach((exit) => exit.disable?.());
          this.scene.cameras.main.fadeOut(500);

          const nextLocation = await this.navigationManager.traverse(direction);
          await this.onExit(nextLocation);
        },
      }
    );
    this.exits.push(exit);
  }

  private createStair(
    direction: VerticalDirection,
    position: { x: number; y: number }
  ): void {
    const displayText = DIRECTION_DISPLAY_NAMES[direction];
    const stair = new ActionableObject(
      this.scene,
      position.x,
      position.y,
      "arrow",
      this.actionManager,
      {
        key: `${ACTIONS.PREFIX_STAIRS}${direction}`,
        label: `<Enter> go ${displayText}`,
        range: ACTIONS.STAIRS_RANGE,
        action: async () => {
          this.stairs.forEach((stair) => stair.disable?.());
          this.scene.cameras.main.fadeOut(500);

          const nextLocation = await this.navigationManager.traverse(direction);
          await this.onExit(nextLocation);
        },
      }
    );

    if (direction === "dn") {
      stair.sprite.setFlipY(true);
    }
    this.stairs.push(stair);
  }

  private calculateExitPositions(roomType: RoomType): ExitPositions {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const baseRadius = Math.min(width, height) * 0.2525;

    // slight offset for vestibule...
    const radius = roomType === "vestibule" ? baseRadius + 8 : baseRadius;

    return {
      ee: { x: centerX + radius, y: centerY, rotation: Math.PI / 2 },
      ww: { x: centerX - radius, y: centerY, rotation: -Math.PI / 2 },
      nw: {
        x: centerX - radius * 0.5,
        y: centerY - radius * 0.866,
        rotation: -Math.PI / 6,
      },
      ne: {
        x: centerX + radius * 0.5,
        y: centerY - radius * 0.866,
        rotation: Math.PI / 6,
      },
      sw: {
        x: centerX - radius * 0.5,
        y: centerY + radius * 0.866,
        rotation: (-5 * Math.PI) / 6,
      },
      se: {
        x: centerX + radius * 0.5,
        y: centerY + radius * 0.866,
        rotation: (5 * Math.PI) / 6,
      },
    };
  }

  private calculateStairsPositions() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const centerX = width / 2;
    const centerY = height / 2;

    return {
      up: { x: centerX, y: centerY - 20 }, // Above center
      dn: { x: centerX, y: centerY + 20 }, // Below center
    };
  }

  private generateRandomGalleryExits(): HexDirection[] {
    const HEX_DIRECTIONS_PLANAR: HexDirection[] = [
      "ee",
      "ww",
      "nw",
      "ne",
      "sw",
      "se",
    ];
    return HEX_DIRECTIONS_PLANAR.sort(() => Math.random() - 0.5).slice(0, 2);
  }

  destroy(): void {
    [...this.exits, ...this.stairs].forEach((exit) => {
      exit.disable?.();
      this.actionManager.removeAction(exit.getAction().key);
      exit.destroy();
    });
    this.exits = [];
    this.stairs = [];
  }

  getExits(): ActionableObject[] {
    return [...this.exits];
  }

  getStairs(): ActionableObject[] {
    return [...this.stairs];
  }
}
