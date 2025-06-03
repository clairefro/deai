export class WalkableMask {
  private texture: Phaser.Textures.CanvasTexture;
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private bounds!: Phaser.Geom.Rectangle;

  constructor(
    scene: Phaser.Scene,
    maskKey: string,
    debugEnabled: boolean = false
  ) {
    const maskImage = scene.textures.get(maskKey).getSourceImage();
    this.texture = scene.textures.createCanvas(
      "walkable-mask-canvas",
      maskImage.width,
      maskImage.height
    ) as Phaser.Textures.CanvasTexture;

    const context = this.texture.getContext();
    context.drawImage(maskImage as HTMLImageElement, 0, 0);
    this.texture.refresh();

    if (debugEnabled) {
      this.debugGraphics = scene.add.graphics();
      this.debugGraphics.setDepth(999);
      scene.add
        .image(
          scene.cameras.main.width / 2,
          scene.cameras.main.height / 2,
          "walkable-mask-canvas"
        )
        .setAlpha(0.3)
        .setDepth(999);
    }
  }

  isWalkable(x: number, y: number): boolean {
    const tx = Math.floor(x - (this.bounds.x - this.bounds.width / 2));
    const ty = Math.floor(y - (this.bounds.y - this.bounds.height / 2));

    if (
      tx < 0 ||
      ty < 0 ||
      tx >= this.texture.width ||
      ty >= this.texture.height
    ) {
      return false;
    }

    const context = this.texture.getContext();
    const imageData = context.getImageData(tx, ty, 1, 1);
    return imageData.data[3] > 0;
  }

  setBounds(bounds: Phaser.Geom.Rectangle): void {
    this.bounds = bounds;
  }
}
