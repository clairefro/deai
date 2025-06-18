import * as Phaser from "phaser";
import { ActionManager } from "../actions/ActionManager";
import { ProximityAction } from "../../types";
import { ACTIONS } from "../constants";

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
      rotation?: number;
      action: () => void;
    }
  ) {
    this.sprite = scene.add.sprite(x, y, texture);
    this.sprite.setInteractive({ useHandCursor: true });

    if (config.rotation !== undefined) {
      this.sprite.setRotation(config.rotation);
    }

    this.action = {
      target: this.sprite,
      range: config.range || ACTIONS.DEFAULT_RANGE,
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
