import { WalkableMask } from "../components/WalkableMask";
import { DEPTHS } from "../constants";

export class Player {
  private scene: Phaser.Scene;
  private walkableMask: WalkableMask;
  private speed: number = 200;
  private yOffset: number;

  private _sprite: Phaser.Physics.Arcade.Sprite;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    imgKey: string,
    walkableMask: WalkableMask
  ) {
    this.scene = scene;
    this._sprite = scene.physics.add.sprite(x, y, imgKey);
    this.walkableMask = walkableMask;
    this.yOffset = this._sprite.height / 2;

    this._sprite.setDepth(DEPTHS.PLAYER);
  }

  get sprite(): Phaser.Physics.Arcade.Sprite {
    return this._sprite;
  }

  getHeight(): number {
    return this._sprite.height;
  }

  getYOffset(): number {
    return this.yOffset;
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

    // check collision based on bottom center pixel of sprite
    const bottomCenterX = newX;
    const bottomCenterY = newY + this.sprite.height / 2; // bottom of sprite

    if (this.walkableMask.isWalkable(bottomCenterX, bottomCenterY)) {
      this.sprite.setPosition(newX, newY);
      return true;
    }

    return false;
  }

  setPosition(x: number, y: number) {
    this._sprite.setPosition(x, y);
  }

  setWalkableMask(newMask: WalkableMask): void {
    this.walkableMask = newMask;
  }
}
