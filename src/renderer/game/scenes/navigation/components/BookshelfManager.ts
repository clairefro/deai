import { ActionableObject } from "../../../actions/ActionableObject";
import { ActionManager } from "../../../actions/ActionManager";
import { ACTIONS } from "../../../constants";
import { HexDirection } from "../../../../types";
import { BookshelfMenu } from "../../../components/BookshelfMenu";

export class BookshelfManager {
  private bookshelves: ActionableObject[] = [];

  constructor(
    private scene: Phaser.Scene,
    private actionManager: ActionManager
  ) {
    BookshelfMenu.initialize();
  }

  createBookshelves(galleryExits: HexDirection[]): void {
    this.clearExisting();

    const positions = this.calculateBookshelfPositions();
    const availableWalls = Object.keys(positions).filter(
      (dir) => !galleryExits.includes(dir as HexDirection)
    ) as HexDirection[];

    availableWalls.forEach((direction) => {
      const position = positions[direction];
      if (!position) return;

      const bookshelf = new ActionableObject(
        this.scene,
        position.x,
        position.y,
        "bookshelf-wall",
        this.actionManager,
        {
          key: `${ACTIONS.PREFIX_BOOKSHELF}${direction}`,
          label: `<Enter> browse books on ${direction.toUpperCase()} wall`,
          rotation: position.rotation,
          range: ACTIONS.DOOR_RANGE,
          action: () => {
            console.log(`Browsing bookshelf on ${direction} wall`);
            BookshelfMenu.getInstance()?.show(direction);
          },
        }
      );
      this.bookshelves.push(bookshelf);
    });
  }

  private calculateBookshelfPositions() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const centerX = width / 2;
    const centerY = height / 2;
    // slightly larger radius than exits for visual depth
    const radius = Math.min(width, height) * 0.265;

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

  private clearExisting(): void {
    this.bookshelves.forEach((bookshelf) => {
      bookshelf.disable?.();
      this.actionManager.removeAction(bookshelf.getAction().key);
      bookshelf.destroy();
    });
    this.bookshelves = [];
  }

  destroy(): void {
    this.clearExisting();
  }
}
