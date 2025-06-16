/** Target image and mask texture must be exact same size */
export class WalkableMask {
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private bounds!: Phaser.Geom.Rectangle;
  private targetImage: Phaser.GameObjects.Image;
  private maskLayer: Phaser.GameObjects.Image;
  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    maskKey: string,
    targetImage: Phaser.GameObjects.Image,
    debug: boolean = false
  ) {
    this.scene = scene;
    this.targetImage = targetImage;

    // Create mask layer that exactly matches target image
    this.maskLayer = scene.add
      .image(this.targetImage.x, this.targetImage.y, maskKey)
      .setOrigin(0.5, 0.5)
      .setScale(this.targetImage.scale)
      .setAlpha(debug ? 0.3 : 0)
      .setDepth(this.targetImage.depth + 1);

    // set bounds based on target
    this.bounds = new Phaser.Geom.Rectangle(
      this.targetImage.x,
      this.targetImage.y,
      this.targetImage.width * this.targetImage.scaleX,
      this.targetImage.height * this.targetImage.scaleY
    );
    if (debug) {
      this.debugGraphics = scene.add.graphics();
      this.drawDebugBox();
    }
  }

  isWalkable(x: number, y: number): boolean {
    const tx = Math.floor(x - (this.bounds.x - this.bounds.width / 2));
    const ty = Math.floor(y - (this.bounds.y - this.bounds.height / 2));

    // get pixel color from texture manager
    const pixel = this.maskLayer.scene.textures.getPixel(
      tx,
      ty,
      this.maskLayer.texture.key
    ) as { r: number; g: number; b: number; a: number } | null; // Phaser's types are't correct, so I shimmed here

    if (pixel === null) {
      return false;
    }
    if (this.debugGraphics) {
      console.log(`Checking position (${x},${y}) -> texture (${tx},${ty})`);
      console.log(`Pixel: rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.a})`);
    }

    return pixel.r > 0;
  }

  private getRandomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getRandomWalkablePosition(
    fallbackCoords = {
      x: this.targetImage.width / 2,
      y: this.targetImage.height / 2,
    },
    offset?: { x?: number; y?: number }
  ): {
    x: number;
    y: number;
  } {
    let x = fallbackCoords.x;
    let y = fallbackCoords.y;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      x = this.getRandomInRange(
        Math.floor(this.bounds.x - this.bounds.width / 2),
        Math.floor(this.bounds.x + this.bounds.width / 2)
      );
      y = this.getRandomInRange(
        Math.floor(this.bounds.y - this.bounds.height / 2),
        Math.floor(this.bounds.y + this.bounds.height / 2)
      );

      const checkX = x + (offset?.x || 0);
      const checkY = y + (offset?.y || 0);

      attempts++;
      if (this.isWalkable(checkX, checkY)) {
        return { x, y };
      }
    } while (attempts < maxAttempts);

    console.warn("Could not find walkable position, using fallback");
    return fallbackCoords;
  }

  setBounds(bounds: Phaser.Geom.Rectangle): void {
    this.bounds = bounds;
  }

  destroy(): void {
    if (this.maskLayer) {
      this.maskLayer.destroy();
    }
    if (this.debugGraphics) {
      this.debugGraphics.destroy();
    }
  }
  // ----- debugging  ------

  private drawDebugBox(): void {
    if (!this.debugGraphics) return;

    this.debugGraphics.clear();

    this.debugGraphics.lineStyle(2, 0x00ff00); // green

    const left = this.bounds.x - this.bounds.width / 2;
    const top = this.bounds.y - this.bounds.height / 2;

    this.debugGraphics.strokeRect(
      left,
      top,
      this.bounds.width,
      this.bounds.height
    );

    const markerSize = 10;
    this.debugGraphics.lineStyle(2, 0xff0000); // red

    // top-left
    this.debugGraphics.lineBetween(left, top, left + markerSize, top);
    this.debugGraphics.lineBetween(left, top, left, top + markerSize);

    // top-right
    this.debugGraphics.lineBetween(
      left + this.bounds.width,
      top,
      left + this.bounds.width - markerSize,
      top
    );
    this.debugGraphics.lineBetween(
      left + this.bounds.width,
      top,
      left + this.bounds.width,
      top + markerSize
    );

    // bottom-left
    this.debugGraphics.lineBetween(
      left,
      top + this.bounds.height,
      left + markerSize,
      top + this.bounds.height
    );
    this.debugGraphics.lineBetween(
      left,
      top + this.bounds.height,
      left,
      top + this.bounds.height - markerSize
    );

    // bottom-right
    this.debugGraphics.lineBetween(
      left + this.bounds.width,
      top + this.bounds.height,
      left + this.bounds.width - markerSize,
      top + this.bounds.height
    );
    this.debugGraphics.lineBetween(
      left + this.bounds.width,
      top + this.bounds.height,
      left + this.bounds.width,
      top + this.bounds.height - markerSize
    );
  }
}
