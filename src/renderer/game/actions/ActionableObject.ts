import * as Phaser from "phaser";
import { ActionManager } from "../actions/ActionManager";
import { ProximityAction } from "../actions/types";

export class ActionableObject {
  private sprite: Phaser.GameObjects.Sprite;
  private action: ProximityAction;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    actionManager: ActionManager,
    config: {
      range?: number;
      key: string;
      label: string;
      action: () => void;
    }
  ) {
    this.sprite = scene.add.sprite(x, y, texture);
    this.sprite.setInteractive({ useHandCursor: true });

    this.action = {
      target: this.sprite,
      range: config.range || 100,
      key: config.key,
      getLabel: () => config.label,
      action: config.action,
    };

    actionManager.addAction(this.action);
  }

  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
