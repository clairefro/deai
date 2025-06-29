import {
  HexDirection,
  TraversalRecord,
  Location,
  RoomType,
  AllDirection,
} from "../../../types";

import {
  EVENTS,
  DIRECTION_OFFSETS,
  OPPOSITE_DIRECTIONS,
} from "../../constants";

export class NavigationManager {
  currentLocation: Location;
  prevLocation: Location | null = null;
  traversalHistory: TraversalRecord[] = [];
  private ready: boolean = false;

  constructor() {
    // Start with default location
    this.currentLocation = {
      type: "gallery",
      x: 0,
      y: 0,
      z: 0,
      cameFrom: "ww",
    };

    // wait for DOM and electronAPI to be ready
    this.init();
  }

  private async init() {
    await new Promise<void>((resolve) => {
      const check = () => {
        if (window.electronAPI) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });

    await this.initFromSavedState();
    this.ready = true;
  }

  private async initFromSavedState() {
    try {
      const lastLocation = await window.electronAPI.getLastLocation();
      if (lastLocation) {
        // default
        this.currentLocation = {
          type: lastLocation.type ?? "gallery",
          x: lastLocation.x ?? 0,
          y: lastLocation.y ?? 0,
          z: lastLocation.z ?? 0,
          cameFrom: lastLocation.cameFrom ?? "ww",
        };
      }
    } catch (err) {
      console.error("Failed to load last location:", err);
    }
  }

  async loadLastLocation(): Promise<void> {
    try {
      const lastLocation = await window.electronAPI.getLastLocation();
      if (lastLocation) {
        this.currentLocation = lastLocation;
      }
    } catch (err) {
      console.error("Failed to load last location:", err);
    }
  }

  async traverse(direction: AllDirection): Promise<Location> {
    if (!this.ready) {
      await new Promise<void>((resolve) => {
        const check = () => {
          if (this.ready) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    }

    this.currentLocation = this.getNextLocation(
      this.currentLocation,
      direction
    );

    const traversalRecord: TraversalRecord = {
      from: this.prevLocation
        ? { ...this.prevLocation }
        : { ...this.currentLocation },
      to: { ...this.currentLocation },
      direction,
    };

    this.traversalHistory.push(traversalRecord);

    try {
      await window.electronAPI.addTraversal(traversalRecord);
    } catch (err) {
      console.error("Failed to save traversal:", err);
    }

    return { ...this.currentLocation };
  }

  getNextLocation(current: Location, direction: AllDirection): Location {
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
    direction: AllDirection
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
    direction: AllDirection
  ): RoomType {
    if (
      currentType === "vestibule" &&
      (direction === "up" || direction === "dn")
    ) {
      // moving between floors in vestibule - maintain vestibule type
      return "vestibule";
    } else if (currentType === "vestibule") {
      // moving horizontally from vestibule - go to gallery
      return "gallery";
    } else {
      // moving from gallery - always go to vestibule
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
