import { NotificationBar } from "../components/NotificationBar";
import { ProximityAction } from "../../types";

export class ActionManager {
  private proximityActions: ProximityAction[] = [];
  private currentAction: ProximityAction | null = null;
  private readonly HIGHLIGHT_OPACITY: number = 0.8;
  private readonly DEFAULT_OPACITY: number = 1;

  addAction(action: ProximityAction): void {
    if (!action.target) {
      console.error("Cannot add action without target:", action);
      return;
    }
    this.proximityActions.push(action);
  }

  removeAction(actionKey: string): void {
    const index = this.proximityActions.findIndex((a) => a.key === actionKey);
    if (index !== -1) {
      this.proximityActions.splice(index, 1);
    }

    // clear label if this was the current action
    if (this.currentAction?.key === actionKey) {
      this.currentAction = null;
    }
  }

  checkProximity(playerPos: Phaser.Math.Vector2): void {
    let nearestAction: ProximityAction | null = null;
    let nearestDistance = Infinity;

    for (const action of this.proximityActions) {
      if (action.target?.alpha !== undefined) {
        action.target.alpha = this.DEFAULT_OPACITY;
      }

      const targetX = action.target.x ?? 0;
      const targetY = action.target.y ?? 0;

      const targetPos = new Phaser.Math.Vector2(targetX, targetY);
      const distance = Phaser.Math.Distance.BetweenPoints(playerPos, targetPos);

      if (distance <= action.range && distance < nearestDistance) {
        nearestAction = action;
        nearestDistance = distance;
      }
    }

    if (nearestAction?.target?.alpha !== undefined) {
      nearestAction.target.alpha = this.HIGHLIGHT_OPACITY;
    }

    // update notification if nearest action changed
    if (nearestAction !== this.currentAction) {
      this.currentAction = nearestAction;
      if (nearestAction) {
        NotificationBar.getInstance()?.show(nearestAction.getLabel());
      } else {
        NotificationBar.getInstance()?.clear();
      }
    }
  }

  getCurrentAction(): ProximityAction | null {
    return this.currentAction;
  }

  clearCurrentAction(): void {
    this.currentAction = null;
    NotificationBar.getInstance()?.clear();
  }

  handleAction(): void {
    if (this.currentAction) {
      this.currentAction.action();
      NotificationBar.getInstance()?.clear();
      this.currentAction = null;
    }
  }
}
