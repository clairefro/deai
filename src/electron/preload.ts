import { contextBridge, ipcRenderer } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { ConfigSettings, ConfigSettingsUpdate } from "../shared/config";

interface FileObj {
  name: string;
  path: string;
}

interface ElectronAPI {
  getFiles: () => Promise<FileObj[]>;
  readFile: (filepath: string) => Promise<string>;
  getConfig: () => Promise<ConfigSettings>;
  selectDirectory: () => Promise<string | null>;
  updateConfig: (updates: ConfigSettingsUpdate) => Promise<ConfigSettings>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const electronAPI: ElectronAPI = {
  async getFiles() {
    const config = await ipcRenderer.invoke("get-config");
    console.log({ config });
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

  async readFile(filepath) {
    try {
      const content = await fs.readFile(filepath, "utf-8");
      return content;
    } catch (err) {
      console.error(`Failed to read file at ${filepath}:`, err);
      throw err;
    }
  },

  async getConfig() {
    return await ipcRenderer.invoke("get-config");
  },

  async selectDirectory() {
    return await ipcRenderer.invoke("select-dir");
  },

  async updateConfig(updates) {
    return await ipcRenderer.invoke("update-config", updates);
  },
};
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
