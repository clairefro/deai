export interface ProximityAction {
  target: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite;
  range: number;
  key: string;
  getLabel: () => string;
  action: () => void;
}
