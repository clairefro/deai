import { contextBridge, ipcRenderer } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { ConfigSettings, ConfigSettingsUpdate } from "../shared/Config";

interface FileObj {
  name: string;
  path: string;
}

const electronAPI = {
  async getFiles(): Promise<FileObj[]> {
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

  async getConfig() {
    return await ipcRenderer.invoke("get-config");
  },

  async selectDirectory() {
    return await ipcRenderer.invoke("select-dir");
  },

  async updateConfig(updates: ConfigSettingsUpdate) {
    return await ipcRenderer.invoke("update-config", updates);
  },

  async writeFile(filepath: string, content: string) {
    ipcRenderer.invoke("write-file", filepath, content);
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
