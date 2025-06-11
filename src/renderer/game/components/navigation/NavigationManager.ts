import { EventEmitter } from "events";
import * as fs from "fs";
import {
  HexDirection,
  OPPOSITE_DIRECTIONS,
  HEX_DIRECTIONS,
} from "./HexDirection";

export interface Location {
  x: number;
  y: number;
  z: number;
  type: "gallery" | "hallway" | "bathroom";
  exits?: HexDirection[];
  connections: {
    [key in HexDirection]?: string; // roomId
  };
}

export interface TraversalRecord {
  timestamp: number;
  from: string; // roomId
  to: string; // roomId
  direction: HexDirection;
}

export class NavigationManager extends EventEmitter {
  private currentLocation!: Location;
  private rooms: Map<string, Location> = new Map();
  private traversalHistory: TraversalRecord[] = [];
  private readonly historyFile: string;
  private readonly SAVE_INTERVAL = 1000 * 60; // Save every minute

  constructor(historyPath: string = "traversal-history.json") {
    super();
    this.historyFile = historyPath;
    this.loadHistory();
    this.initializeFirstRoom();

    // Periodically save history
    setInterval(() => this.saveHistory(), this.SAVE_INTERVAL);
  }

  private initializeFirstRoom() {
    const startingRoom: Location = {
      x: 0,
      y: 0,
      z: 0,
      type: "gallery",
      connections: {},
    };

    // Generate random exits (2 out of 6)
    const possibleExits: HexDirection[] = [...HEX_DIRECTIONS];

    startingRoom.exits = this.getRandomExits(possibleExits, 2);

    const roomId = this.generateRoomId(startingRoom);
    this.rooms.set(roomId, startingRoom);
    this.currentLocation = startingRoom;
  }

  private generateRoomId(location: Location): string {
    return `${location.type}-${location.x}-${location.y}-${location.z}`;
  }

  private getRandomExits(
    directions: HexDirection[],
    count: number
  ): HexDirection[] {
    return [...directions].sort(() => Math.random() - 0.5).slice(0, count);
  }

  //   async traverse(direction: HexDirection): Promise<Location> {
  //     const currentId = this.generateRoomId(this.currentLocation);
  //     let nextLocation: Location;

  // if (this.currentLocation.type === "gallery") {
  //   // Gallery to Hallway transition
  //   nextLocation = this.generateHallway(this.currentLocation, direction);
  // } else if (this.currentLocation.type === "hallway") {
  //   if (direction === "up" || direction === "dn") {
  //     // Staircase transition
  //     nextLocation = this.generateHallway(this.currentLocation, direction);
  //   } else {
  //     // Hallway to Gallery transition
  //     nextLocation = this.generateGallery(this.currentLocation, direction);
  //   }
  // } else {
  //   throw new Error(`Invalid room type: ${this.currentLocation.type}`);
  // }

  // const nextId = this.generateRoomId(nextLocation);

  // Record traversal
  // const record: TraversalRecord = {
  //   timestamp: Date.now(),
  //   from: currentId,
  //   to: nextId,
  //   direction,
  // };

  // this.traversalHistory.push(record);
  // this.rooms.set(nextId, nextLocation);
  // this.currentLocation = nextLocation;

  // this.emit("locationChanged", nextLocation);
  // return nextLocation;
  //   }

  //   private generateHallway(from: Location, direction: HexDirection): Location {
  //     const { x, y, z } = this.calculateNextPosition(from, direction);

  //     return {
  //       x,
  //       y,
  //       z: direction === "up" ? z + 1 : direction === "dn" ? z - 1 : z,
  //       type: "hallway",
  //       connections: {
  //         [OPPOSITE_DIRECTIONS[direction]]: this.generateRoomId(from),
  //       },
  //     };
  //   }

  //   private generateGallery(from: Location, direction: HexDirection): Location {
  //     const { x, y, z } = this.calculateNextPosition(from, direction);
  //     const gallery: Location = {
  //       x,
  //       y,
  //       z,
  //       type: "gallery",
  //       connections: {
  //         [OPPOSITE_DIRECTIONS[direction]]: this.generateRoomId(from),
  //       },
  //     };

  //     // Generate new random exits, excluding the entrance
  //     const possibleExits = ["nn", "ne", "se", "ss", "sw", "nw"].filter(
  //       (d) => d !== OPPOSITE_DIRECTIONS[direction]
  //     ) as HexDirection[];

  //     gallery.exits = this.getRandomExits(possibleExits, 2);
  //     return gallery;
  //   }

  //   private calculateNextPosition(
  //     from: Location,
  //     direction: HexDirection
  //   ): Location {
  //     // const hexVectors: Record<HexDirection, [number, number]> = {
  //     //   nw: [1, -1],
  //     //   ne: [1, 1],
  //     //   //   southeast: [1, 0],
  //     //   //   south: [0, 1],
  //     //   //   southwest: [-1, 1],
  //     //   //   northwest: [-1, 0],
  //     //   //   up: [0, 0],
  //     //   //   down: [0, 0],
  //     // };
  //     // const [dx, dy] = hexVectors[direction];
  //     // return {
  //     //   x: from.x + dx,
  //     //   y: from.y + dy,
  //     //   z: from.z,
  //     //   type: from.type,
  //     //   connections: {},
  //     // };
  //   }

  getCurrentLocation(): Location {
    return { ...this.currentLocation };
  }

  private async saveHistory(): Promise<void> {
    try {
      await fs.promises.writeFile(
        this.historyFile,
        JSON.stringify(this.traversalHistory, null, 2)
      );
    } catch (error) {
      console.error("Failed to save traversal history:", error);
    }
  }

  private async loadHistory(): Promise<void> {
    try {
      const data = await fs.promises.readFile(this.historyFile, "utf8");
      this.traversalHistory = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, start with empty history
      this.traversalHistory = [];
    }
  }
}
