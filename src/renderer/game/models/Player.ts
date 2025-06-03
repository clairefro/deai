import { WalkableMask } from "../components/WalkableMask";
import { DEPTHS } from "../constants";

export class Player {
  private scene: Phaser.Scene;
  private walkableMask: WalkableMask;
  private speed: number = 200;
  private collisionOffset: number;

  private _sprite: Phaser.Physics.Arcade.Sprite;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    imgKey: string,
    walkableMask: WalkableMask,
    collisionOffset: number
  ) {
    this.scene = scene;
    this._sprite = scene.physics.add.sprite(x, y, imgKey);
    this.collisionOffset = collisionOffset;
    this.walkableMask = walkableMask;

    this._sprite.setDepth(DEPTHS.PLAYER);
  }

  get sprite(): Phaser.Physics.Arcade.Sprite {
    return this._sprite;
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys): boolean {
    if (!cursors) return false;

    let newX = this.sprite.x;
    let newY = this.sprite.y;
    const delta = this.scene.sys.game.loop.delta / 1000;

    if (cursors.left?.isDown) newX -= this.speed * delta;
    if (cursors.right?.isDown) newX += this.speed * delta;
    if (cursors.up?.isDown) newY -= this.speed * delta;
    if (cursors.down?.isDown) newY += this.speed * delta;

    if (cursors.left?.isDown && cursors.right?.isDown) {
    }

    // check conolissn based on bottom center pixel of sprite
    const bottomCenterX = newX;
    const bottomCenterY = newY + this.sprite.height / 2;

    if (this.walkableMask.isWalkable(bottomCenterX, bottomCenterY)) {
      this.sprite.setPosition(newX, newY);
      return true;
    }

    return false;
  }
}
