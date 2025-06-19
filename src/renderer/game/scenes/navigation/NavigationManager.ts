import {
  HexDirection,
  Coordinates,
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
  private currentCoordinates: Coordinates;
  private prevCoordinates: Coordinates | null;
  private currentLocation: Location;
  private prevLocation: Location | null;
  private traversalHistory: TraversalRecord[] = [];

  constructor() {
    // TODO: LOAD CURRENT/PREV POSITION FROM TRAVERSAL HISTORY
    this.currentCoordinates = { x: 0, y: 0, z: 0 };
    this.currentLocation = { type: "gallery", ...this.currentCoordinates };
    this.prevLocation = null;
    this.prevCoordinates = null;
  }

  /** TODO: STORE TRAVERSAL HISTORY IN FILE */
  // traverse(direction: HexDirection): {
  //   position: Coordinates;
  //   location: Location;
  // } {
  //   const nextCoordinates = this.calculateNextCoordinates(
  //     this.currentCoordinates,
  //     direction
  //   );

  //   // Record movement
  //   this.traversalHistory.push({
  //     from: { ...this.currentCoordinates },
  //     to: { ...nextCoordinates },
  //     direction,
  //     timestamp: Date.now(),
  //   });

  //   // Update positions
  //   this.prevCoordinates = { ...this.currentCoordinates };
  //   this.currentCoordinates = nextCoordinates;

  //   // Update locations
  //   this.prevLocation = { ...this.currentLocation };
  //   this.currentLocation = {
  //     ...nextCoordinates,
  //     type: this.determineNextLocationType(this.currentLocation.type),
  //   };

  //   this.emit(EVENTS.LOCATION_CHANGED, {
  //     position: nextCoordinates,
  //     location: this.currentLocation,
  //   });
  //   return {
  //     position: { ...nextCoordinates },
  //     location: { ...this.currentLocation },
  //   };
  // }

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

  getNextLocation(current: Location, direction: HexDirection): Location {
    const nextCoords = this.calculateNextCoordinates(current, direction);
    let nextType = this.determineNextLocationType(current.type, direction);

    return {
      type: nextType,
      x: nextCoords.x,
      y: nextCoords.y,
      z: nextCoords.z,
      cameFrom: direction,
    };
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
