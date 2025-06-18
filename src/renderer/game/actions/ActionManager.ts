import { NotificationBar } from "../components/NotificationBar";
import { ProximityAction } from "../../types";

export class ActionManager {
  private proximityActions: ProximityAction[] = [];
  private currentAction: ProximityAction | null = null;

  addAction(action: ProximityAction): void {
    if (!action.target) {
      console.error("Cannot add action without target:", action);
      return;
    }
    this.proximityActions.push(action);
  }

  removeAction(action: ProximityAction): void {
    const index = this.proximityActions.findIndex((a) => a.key === action.key);
    if (index !== -1) {
      this.proximityActions.splice(index, 1);
    }

    // clear label if this was the current action
    if (this.currentAction?.key === action.key) {
      this.currentAction = null;
    }
  }

  checkProximity(playerPos: Phaser.Math.Vector2): void {
    let nearestAction: ProximityAction | null = null;
    let nearestDistance = Infinity;

    for (const action of this.proximityActions) {
      const targetX = action.target.x ?? 0;
      const targetY = action.target.y ?? 0;

      const targetPos = new Phaser.Math.Vector2(targetX, targetY);
      const distance = Phaser.Math.Distance.BetweenPoints(playerPos, targetPos);

      if (distance <= action.range && distance < nearestDistance) {
        nearestAction = action;
        nearestDistance = distance;
      }
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
