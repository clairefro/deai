import { contextBridge, ipcRenderer } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { AppConfig, ConfigSettingsUpdate } from "../shared/Config";
import chokidar from "chokidar";
import { LibrarianData } from "../shared/types/LibrarianData";

interface FileObj {
  name: string;
  path: string;
}

const electronAPI = {
  async getMdFiles(): Promise<FileObj[]> {
    const config = await ipcRenderer.invoke("get-config");
    if (!config.notesDir) {
      console.warn("Notes directory not configured");
      return [];
    }

    const files = await fs.readdir(config.notesDir);
    return files
      .filter((file) => file.endsWith(".md"))
      .map((file) => ({
        path: path.join(config.notesDir, file),
        name: file,
      }));
  },

  async readFile(filepath: string) {
    try {
      const content = await fs.readFile(filepath, "utf-8");
      return content;
    } catch (err) {
      console.error(`Failed to read file at ${filepath}:`, err);
      throw err;
    }
  },

  async getConfig(): Promise<AppConfig> {
    return await ipcRenderer.invoke("get-config");
  },

  async openDirSelect() {
    return await ipcRenderer.invoke("open-dir-select");
  },

  async updateConfig(updates: ConfigSettingsUpdate): Promise<AppConfig> {
    return await ipcRenderer.invoke("update-config", updates);
  },

  async writeFile(filepath: string, content: string) {
    ipcRenderer.invoke("write-file", filepath, content);
  },

  watchFile: (filepath: string, callback: (content: string) => void) => {
    const watcher = chokidar.watch(filepath, { persistent: true });

    watcher.on("change", () => {
      console.log(`File changed: ${filepath}`);
      const fs = require("fs");
      fs.readFile(filepath, "utf-8", (err: any, data: string) => {
        if (err) {
          console.error(`Failed to read file: ${filepath}`, err);
          return;
        }
        callback(data); // Pass the updated content to the callback
      });
    });

    return () => {
      watcher.close();
      console.log(`Stopped watching file: ${filepath}`);
    };
  },

  /** Librarians */
  async getLibrariansData(): Promise<LibrarianData[]> {
    try {
      return await ipcRenderer.invoke("get-librarians-data");
    } catch (err) {
      console.error("Failed to get librarians data:", err);
      return [];
    }
  },
  async getLibrarianIds(): Promise<string[]> {
    try {
      const data = await ipcRenderer.invoke("get-librarians-ids");
      return data;
    } catch (err) {
      console.error("Failed to get librarian IDs:", err);
      return [];
    }
  },
  async getLibrarianDataById(id: string): Promise<LibrarianData | null> {
    try {
      return await ipcRenderer.invoke("get-librarian-by-id", id);
    } catch (err) {
      console.error(`Failed to get librarian with id ${id}:`, err);
      return null;
    }
  },
  async upsertLibrarianData(librarian: LibrarianData): Promise<void> {
    try {
      await ipcRenderer.invoke("upsert-librarian", librarian);
    } catch (err) {
      console.error(`Failed to upsert librarian ${librarian.id}:`, err);
      throw err;
    }
  },
  async getEncounteredLibrarians(): Promise<LibrarianData[]> {
    try {
      return await ipcRenderer.invoke("get-encountered-librarians");
    } catch (err) {
      console.error("Failed to get encountered librarians:", err);
      return [];
    }
  },
};

// infer interface from definition
type ElectronAPI = typeof electronAPI;

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
