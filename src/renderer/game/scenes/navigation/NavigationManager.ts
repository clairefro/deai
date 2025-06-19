import { EventEmitter } from "events";
import {
  HexDirection,
  Coordinates,
  TraversalRecord,
  Location,
  RoomType,
} from "../../../types";

import { EVENTS } from "../../constants";

export class NavigationManager extends EventEmitter {
  private currentCoordinates: Coordinates;
  private prevCoordinates: Coordinates | null;
  private currentLocation: Location;
  private prevLocation: Location | null;
  private traversalHistory: TraversalRecord[] = [];

  constructor() {
    super();
    // TODO: LOAD CURRENT/PREV POSITION FROM TRAVERSAL HISTORY
    this.currentCoordinates = { x: 0, y: 0, z: 0 };
    this.currentLocation = { type: "gallery", ...this.currentCoordinates };
    this.prevLocation = null;
    this.prevCoordinates = null;
  }

  /** TODO: STORE TRAVERSAL HISTORY IN FILE */
  traverse(direction: HexDirection): {
    position: Coordinates;
    location: Location;
  } {
    const nextCoordinates = this.calculateNextCoordinates(
      this.currentCoordinates,
      direction
    );

    // Record movement
    this.traversalHistory.push({
      from: { ...this.currentCoordinates },
      to: { ...nextCoordinates },
      direction,
      timestamp: Date.now(),
    });

    // Update positions
    this.prevCoordinates = { ...this.currentCoordinates };
    this.currentCoordinates = nextCoordinates;

    // Update locations
    this.prevLocation = { ...this.currentLocation };
    this.currentLocation = {
      ...nextCoordinates,
      type: this.determineNextLocationType(this.currentLocation.type),
    };

    this.emit(EVENTS.LOCATION_CHANGED, {
      position: nextCoordinates,
      location: this.currentLocation,
    });
    return {
      position: { ...nextCoordinates },
      location: { ...this.currentLocation },
    };
  }

  private calculateNextCoordinates(
    current: Coordinates,
    direction: HexDirection
  ): Coordinates {
    const hexDirectionVectors = {
      ne: { x: 1, y: -1, z: 0 },
      ee: { x: 1, y: 0, z: -1 },
      se: { x: 0, y: 1, z: -1 },
      sw: { x: -1, y: 1, z: 0 },
      ww: { x: -1, y: 0, z: 1 },
      nw: { x: 0, y: -1, z: 1 },
      up: { x: 0, y: 0, z: 1 },
      dn: { x: 0, y: 0, z: -1 },
    };

    const vector = hexDirectionVectors[direction];
    return {
      x: current.x + vector.x,
      y: current.y + vector.y,
      z: current.z + vector.z,
    };
  }

  private determineNextLocationType(currentType: RoomType): RoomType {
    return currentType === "gallery" ? "vestibule" : "gallery";
  }

  getCurrentCoordinates(): Coordinates {
    return { ...this.currentCoordinates };
  }

  getPrevCoordinates(): Coordinates | null {
    return this.prevCoordinates ? { ...this.prevCoordinates } : null;
  }

  getCurrentLocation(): Location {
    return { ...this.currentLocation };
  }

  getPrevLocation(): Location | null {
    return this.prevLocation ? { ...this.prevLocation } : null;
  }

  getTraversalHistory(): TraversalRecord[] {
    return [...this.traversalHistory];
  }

  isValidMove(direction: HexDirection): boolean {
    const next = this.calculateNextCoordinates(this.currentLocation, direction);
    // Add any validation logic here (e.g., boundaries, blocked paths)
    return true;
  }
}
