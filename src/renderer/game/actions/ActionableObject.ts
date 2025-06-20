import * as Phaser from "phaser";
import { ActionManager } from "../actions/ActionManager";
import { ProximityAction } from "../../types";
import { ACTIONS } from "../constants";

export class ActionableObject {
  sprite: Phaser.GameObjects.Sprite;
  private action: ProximityAction;
  private isEnabled: boolean = true;

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

    this.sprite
      .setInteractive({ useHandCursor: true })
      // enable moues controls (in addition to proximity controls)
      .on("pointerdown", () => {
        if (this.isEnabled && config.action) {
          config.action();
        }
      })
      .on("pointerover", () => {
        if (this.isEnabled) {
          this.sprite.setTint(0x999999); // Hover effect
        }
      })
      .on("pointerout", () => {
        if (this.isEnabled) {
          this.sprite.clearTint();
        }
      });

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

  getAction(): ProximityAction {
    return this.action;
  }

  enable(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.sprite.setAlpha(1);
    this.sprite.setInteractive({ useHandCursor: true });
  }

  disable(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    this.sprite.setAlpha(0.5); // visual cue
    this.sprite.disableInteractive();
  }

  destroy(): void {
    this.disable();
    if (this.sprite) {
      this.sprite.removeAllListeners();
      this.sprite.destroy();
    }
    this.sprite.destroy();
  }
}
