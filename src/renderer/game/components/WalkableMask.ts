/** Creates a "walkable" layer on a target image, where white areas in the mask are walkable. Target image and mask texture must be exact same size */
export class WalkableMask {
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private bounds!: Phaser.Geom.Rectangle;
  private targetImage: Phaser.GameObjects.Image;
  private maskLayer?: Phaser.GameObjects.Image;
  private maskKey: string;
  private scene: Phaser.Scene;
  private enabled: boolean = true;
  private textureManager: Phaser.Textures.TextureManager | undefined;

  constructor(
    scene: Phaser.Scene,
    maskKey: string,
    targetImage: Phaser.GameObjects.Image,
    debug: boolean = false
  ) {
    this.scene = scene;
    this.textureManager = scene.textures;
    this.maskKey = maskKey;
    this.targetImage = targetImage;

    // Create mask layer that exactly matches target image
    this.maskLayer = this.scene.add
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
      console.log(`DEBUG: Loaded walkable mask ${this.maskKey}`);
      this.debugGraphics = scene.add.graphics();
      this.drawDebugBox();
    }
  }

  isWalkable(x: number, y: number): boolean {
    if (!this.enabled || !this.textureManager) return true;
    const tx = Math.floor(x - (this.bounds.x - this.bounds.width / 2));
    const ty = Math.floor(y - (this.bounds.y - this.bounds.height / 2));

    // get pixel color from texture manager
    const pixel = this.textureManager.getPixel(tx, ty, this.maskKey) as {
      r: number;
      g: number;
      b: number;
      a: number;
    } | null; // Phaser's types are't correct, so I shimmed here

    if (!pixel) return false;

    if (this.debugGraphics) {
      console.log(`Checking position (${x},${y}) -> texture (${tx},${ty})`);
      console.log(`Pixel: rgba(${pixel.r},${pixel.g},${pixel.b},${pixel.a})`);
    }

    // check the red channel - if > 0, likely not black
    return pixel.r > 0;
  }

  private getRandomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getRandomWalkablePosition(offset?: { x?: number; y?: number }): {
    x: number;
    y: number;
  } {
    let x, y;
    let attempts = 0;
    const maxAttempts = 200;

    const safetyMargin = 10;

    const isValidPosition = (x: number, y: number): boolean => {
      const feetX = x + (offset?.x || 0);
      const feetY = y + (offset?.y || 0);

      // check feet position and small radius around feet
      return this.isWalkableWithMargin(feetX, feetY, safetyMargin);
    };

    while (attempts < maxAttempts) {
      x = this.getRandomInRange(
        Math.floor(this.bounds.x - this.bounds.width / 2),
        Math.floor(this.bounds.x + this.bounds.width / 2)
      );
      y = this.getRandomInRange(
        Math.floor(this.bounds.y - this.bounds.height / 2),
        Math.floor(this.bounds.y + this.bounds.height / 2)
      );

      if (isValidPosition(x, y)) {
        return { x, y };
      }
      attempts++;
    }

    console.warn(
      "Failed to find valid random foot position, starting scanning"
    );

    // ff random attempts fail, scan outward from center
    const centerX = this.bounds.x;
    const centerY = this.bounds.y;
    const scanRadius = Math.min(this.bounds.width, this.bounds.height) / 4;

    for (let r = 0; r <= scanRadius; r += 5) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        if (isValidPosition(x, y)) {
          return { x, y };
        }
      }
    }

    // default: center to appease type script - in reality we will never hit this...
    console.warn("No walkable position found, using center position");
    return {
      x: this.bounds.x + (offset?.x || 0),
      y: this.bounds.y + (offset?.y || 0),
    };
  }

  private isWalkableWithMargin(x: number, y: number, margin: number): boolean {
    // Check center first
    if (!this.isWalkable(x, y)) return false;

    // Check cardinal points
    const points = [
      [margin, 0], // right
      [-margin, 0], // left
      [0, margin], // down
      [0, -margin], // up
      [margin, margin], // bottom right
      [-margin, margin], // bottom left
      [margin, -margin], // top right
      [-margin, -margin], // top left
    ];

    return points.every(([dx, dy]) => this.isWalkable(x + dx, y + dy));
  }

  setBounds(bounds: Phaser.Geom.Rectangle): void {
    this.bounds = bounds;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  destroy(): void {
    if (this.maskLayer) {
      this.maskLayer.destroy(true);
      this.maskLayer = undefined;
    }
    if (this.debugGraphics) {
      if (this.debugGraphics) {
        this.debugGraphics.clear();
        this.debugGraphics.destroy(true);
        this.debugGraphics = undefined;
      }
    }
    this.textureManager = undefined;
    this.targetImage = undefined!;
    this.bounds = undefined!;
  }

  // ----- debugging  ------

  private drawDebugBox(): void {
    if (!this.debugGraphics) return;

    this.debugGraphics.clear();

    this.drawWalkableAreas();

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

  private drawWalkableAreas(): void {
    if (!this.debugGraphics || !this.textureManager) return;

    this.debugGraphics.fillStyle(0x00ff00, 0.2); // semi-transparent green

    const left = this.bounds.x - this.bounds.width / 2;
    const top = this.bounds.y - this.bounds.height / 2;

    // Check each pixel in the mask
    for (let y = 0; y < this.bounds.height; y++) {
      for (let x = 0; x < this.bounds.width; x++) {
        const pixel = this.textureManager.getPixel(x, y, this.maskKey) as {
          r: number;
          g: number;
          b: number;
          a: number;
        } | null;

        if (pixel && pixel.r > 0) {
          // Draw a 1x1 rectangle for each walkable pixel
          this.debugGraphics.fillRect(left + x, top + y, 1, 1);
        }
      }
    }
  }
}
