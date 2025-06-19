import {
  HexDirection,
  TraversalRecord,
  Location,
  RoomType,
} from "../../../types";

import {
  EVENTS,
  DIRECTION_OFFSETS,
  OPPOSITE_DIRECTIONS,
} from "../../constants";

export class NavigationManager {
  currentLocation: Location;
  prevLocation: Location | null;
  traversalHistory: TraversalRecord[] = [];

  constructor() {
    // TODO: Load from saved history
    // Initialize with starting location
    this.currentLocation = {
      type: "gallery",
      x: 0,
      y: 0,
      z: 0,
      cameFrom: "ww",
    };
    this.prevLocation = null;
  }

  traverse(direction: HexDirection): Location {
    this.prevLocation = { ...this.currentLocation };

    this.currentLocation = this.getNextLocation(
      this.currentLocation,
      direction
    );

    this.traversalHistory.push({
      from: { ...this.prevLocation },
      to: { ...this.currentLocation },
      direction,
    });

    return { ...this.currentLocation };
  }

  getNextLocation(current: Location, direction: HexDirection): Location {
    const nextCoords = this.calculateNextCoordinates(current, direction);
    let nextType = this.determineNextLocationType(current.type, direction);

    return {
      type: nextType,
      x: nextCoords.x,
      y: nextCoords.y,
      z: nextCoords.z,
      cameFrom: OPPOSITE_DIRECTIONS[direction],
    };
  }

  calculateNextCoordinates(
    current: Location,
    direction: HexDirection
  ): { x: number; y: number; z: number } {
    if (current.type === "gallery") {
      const [dx, dy] = DIRECTION_OFFSETS[direction];
      return {
        x: current.x + dx,
        y: current.y + dy,
        z: current.z,
      };
    }

    if (current.type === "vestibule") {
      if (direction === "ee" || direction === "ww") {
        return { x: current.x, y: current.y, z: current.z };
      }

      if (direction === "up" || direction === "dn") {
        return {
          x: current.x,
          y: current.y,
          z: current.z + (direction === "up" ? 1 : -1),
        };
      }

      const exitOffset = OPPOSITE_DIRECTIONS[current.cameFrom || "ww"];
      const [dx, dy] = DIRECTION_OFFSETS[exitOffset];
      return {
        x: current.x + dx,
        y: current.y + dy,
        z: current.z,
      };
    }

    return { x: current.x, y: current.y, z: current.z };
  }

  private determineNextLocationType(
    currentType: RoomType,
    direction: HexDirection
  ): RoomType {
    if (
      currentType === "vestibule" &&
      (direction === "up" || direction === "dn")
    ) {
      // Moving between floors in vestibule - maintain vestibule type
      return "vestibule";
    } else if (currentType === "vestibule") {
      // Moving horizontally from vestibule - go to gallery
      return "gallery";
    } else {
      // Moving from gallery - always go to vestibule
      return "vestibule";
    }
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
