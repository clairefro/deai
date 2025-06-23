import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "node:path";
import fs from "fs/promises";
import { LibrarianData } from "./types";

import defaultLibrarians from "../electron/defaultGameFiles/librarians.json";

interface LibrariansSchema {
  entities: LibrarianData[];
}

const LIBRARIANS_DATA_FILE = "librarians.json";

const TEMPLATE_FILE = path.join(
  __dirname,
  "../electron/defaultGameFiles/librarians.json"
);

export class LibrariansStore {
  private db: Low<LibrariansSchema>;
  private readonly filePath: string;
  private static instance: LibrariansStore | null = null;

  private constructor(userDataPath: string) {
    this.filePath = path.join(userDataPath, ".deai", LIBRARIANS_DATA_FILE);
    console.log(this.filePath);
    const adapter = new JSONFile<LibrariansSchema>(this.filePath);
    this.db = new Low(adapter, { entities: [] });
    typeof defaultLibrarians;
  }

  static async create(userDataPath: string): Promise<LibrariansStore> {
    if (!LibrariansStore.instance) {
      LibrariansStore.instance = new LibrariansStore(userDataPath);
      await LibrariansStore.instance.init();
    }
    return LibrariansStore.instance;
  }

  private async init(): Promise<void> {
    try {
      // 1. Create directory if it doesn't exist
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      console.log("Ensuring directory exists:", dir);

      // 2. Check if file exists
      const fileExists = await fs
        .access(this.filePath)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        console.log("Creating new librarians.json from template");
        const templateData = await fs.readFile(TEMPLATE_FILE, "utf8");
        // Write template data to new file
        await fs.writeFile(this.filePath, templateData, "utf8");
      }

      // 3. initialize lowdb
      await this.db.read();

      // 4. ensure valid data structure
      if (!this.db.data) {
        console.log("Database corrupted, reinitializing from template");
        const templateData = JSON.parse(
          await fs.readFile(TEMPLATE_FILE, "utf8")
        );
        this.db.data = templateData;
        await this.db.write();
      }

      console.log(
        "Database initialized with",
        this.db.data.entities.length,
        "librarians"
      );
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  async getAll(): Promise<LibrarianData[]> {
    await this.db.read();
    return this.db.data.entities;
  }

  async upsertLibrarian(librarianData: LibrarianData): Promise<void> {
    await this.db.read();
    console.log(this.db);
    const index = this.db.data.entities.findIndex(
      (lib) => lib.id === librarianData.id
    );

    if (index >= 0) {
      this.db.data.entities[index] = librarianData;
    } else {
      this.db.data.entities.push(librarianData);
    }

    await this.db.write();
  }

  async getAllIds(): Promise<string[]> {
    try {
      await this.db.read();
      return this.db.data.entities.map((lib) => lib.id);
    } catch (error) {
      console.error("Failed to get librarian IDs:", error);
      return [];
    }
  }

  async getById(id: string): Promise<LibrarianData | null> {
    try {
      await this.db.read();
      const librarian = this.db.data.entities.find((lib) => lib.id === id);
      return librarian || null;
    } catch (error) {
      console.error(`Failed to get librarian with id ${id}:`, error);
      return null;
    }
  }

  async getEncountered(): Promise<LibrarianData[]> {
    try {
      await this.db.read();
      return this.db.data.entities.filter((lib) => lib.encountered);
    } catch (error) {
      console.error("Failed to get encountered librarians:", error);
      return [];
    }
  }
}
