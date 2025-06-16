import { EventEmitter } from "events";
import {
  HexDirection,
  OPPOSITE_DIRECTIONS,
  HEX_DIRECTIONS,
} from "../../../types";
import { Location } from "../../../types";

export enum RoomType {
  GALLERY = "gallery",
  HALLWAY = "hallway",
}

// TODO RM
const fakeLocation: Location = {
  x: 1,
  y: 1,
  z: 1,
  type: RoomType.HALLWAY,
  exits: ["sw", "ne"],
  connections: {
    sw: "foo",
    ne: "bar",
  },
};

export class NavigationManager extends EventEmitter {
  private currentLocation!: Location;
  private rooms: Map<string, Location> = new Map();
  private traversalHistory: Array<{
    from: string;
    to: string;
    direction: HexDirection;
    timestamp: number;
  }> = [];

  constructor() {
    super();
    this.initializeFirstRoom();
  }

  private initializeFirstRoom() {
    const startingGallery: Location = {
      x: 0,
      y: 0,
      z: 0,
      type: RoomType.GALLERY,
      exits: this.generateRandomExits(),
      connections: {},
    };

    const roomId = this.generateRoomId(startingGallery);
    this.rooms.set(roomId, startingGallery);
    this.currentLocation = startingGallery;
  }

  private generateRandomExits(): HexDirection[] {
    // Get 2 random exits from the 6 possible horizontal directions
    const horizontalExits = HEX_DIRECTIONS.filter(
      (d) => d !== "up" && d !== "dn"
    );
    return horizontalExits.sort(() => Math.random() - 0.5).slice(0, 2);
  }

  async traverse(direction: HexDirection): Promise<Location> {
    const currentId = this.generateRoomId(this.currentLocation);
    let nextLocation: Location;

    if (this.currentLocation.type === RoomType.GALLERY) {
      nextLocation = this.generateHallway(this.currentLocation, direction);
    } else {
      nextLocation = this.generateGallery(this.currentLocation, direction);
    }

    const nextId = this.generateRoomId(nextLocation);

    // Record traversal
    this.traversalHistory.push({
      from: currentId,
      to: nextId,
      direction,
      timestamp: Date.now(),
    });

    // Update connections
    this.currentLocation.connections[direction] = nextId;
    nextLocation.connections[OPPOSITE_DIRECTIONS[direction]] = currentId;

    this.rooms.set(nextId, nextLocation);
    this.currentLocation = nextLocation;

    this.emit("locationChanged", nextLocation);
    return nextLocation;
  }

  private generateRoomId(location: Location): string {
    return `${location.type}-${location.x}-${location.y}-${location.z}`;
  }

  generateHallway(loc: Location, hd: HexDirection) {
    // TODO
    console.log("TODO - IMPL HALLWAY GENERATION");
    return fakeLocation;
  }

  generateGallery(loc: Location, hd: HexDirection) {
    console.log("TODO");
    // TODO
    console.log("TODO - IMPL GALLERY GENERATION");
    return fakeLocation;
  }

  getCurrentLocation(): Location {
    return { ...this.currentLocation };
  }
}
