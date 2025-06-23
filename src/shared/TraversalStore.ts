import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "node:path";
import fs from "fs/promises";
import { TraversalRecord, Location } from "../renderer/types";

interface TraversalSchema {
  history: TraversalRecord[];
  uniqueGalleries: string[];
  lastLocation: Location | null;
}

const TRAVERSAL_DATA_FILE = "traversal.json";

// TODO - DO WE NEED TRAVERSAL HISTORY??
export class TraversalStore {
  private db: Low<TraversalSchema>;
  private readonly filePath: string;
  private static instance: TraversalStore | null = null;
  private uniqueGalleriesSet: Set<string>;

  private constructor(userDataPath: string) {
    this.filePath = path.join(userDataPath, ".deai", TRAVERSAL_DATA_FILE);
    const adapter = new JSONFile<TraversalSchema>(this.filePath);
    this.uniqueGalleriesSet = new Set();
    this.db = new Low(adapter, {
      history: [],
      uniqueGalleries: [],
      lastLocation: null,
    });
  }

  static async create(userDataPath: string): Promise<TraversalStore> {
    if (!TraversalStore.instance) {
      TraversalStore.instance = new TraversalStore(userDataPath);
      await TraversalStore.instance.init();
    }
    return TraversalStore.instance;
  }

  private async init(): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });

      const fileExists = await fs
        .access(this.filePath)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        await this.db.write();
      }

      await this.db.read();

      if (!this.db.data) {
        this.db.data = {
          history: [],
          uniqueGalleries: [],
          lastLocation: null,
        };
        await this.db.write();
      }
      if (this.db.data) {
        this.uniqueGalleriesSet = new Set(this.db.data.uniqueGalleries);
      }
    } catch (error) {
      console.error("Failed to initialize traversal store:", error);
      throw error;
    }
  }

  private getGalleryKey(location: Location): string {
    return `${location.x}:${location.y}:${location.z}`;
  }

  async addTraversal(record: TraversalRecord): Promise<void> {
    await this.db.read();

    this.db.data.history.push(record);

    // add unique gallery if present
    const galleryKey = this.getGalleryKey(record.to);
    if (!this.uniqueGalleriesSet.has(galleryKey)) {
      this.uniqueGalleriesSet.add(galleryKey);
      this.db.data.uniqueGalleries.push(galleryKey);
      console.log(`New gallery discovered at ${galleryKey}`);
    }

    this.db.data.lastLocation = record.to;
    await this.db.write();
  }

  async getRecentHistory(limit: number = 10): Promise<TraversalRecord[]> {
    await this.db.read();
    return [...this.db.data.history].reverse().slice(0, limit);
  }

  async getUniqueGalleriesCount(): Promise<number> {
    await this.db.read();
    return this.db.data.uniqueGalleries.length;
  }

  async getLastLocation(): Promise<Location | null> {
    await this.db.read();
    return this.db.data.lastLocation;
  }

  async clearHistory(): Promise<void> {
    this.db.data.history = [];
    this.db.data.uniqueGalleries = [];
    this.uniqueGalleriesSet.clear();
    await this.db.write();
  }
}
