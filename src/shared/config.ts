import { App } from "electron";

import path from "node:path";
import fs from "node:fs/promises";

interface ConfigSettings {
  version: string;
  lastOpenedNote: string | null;
  notesDir: string | null;
}

type ConfigSettingsUpdate = Partial<ConfigSettings>;

class Config {
  defaultConfig: ConfigSettings;
  app: App;
  CONFIG_DIR: string;
  CONFIG_FILE: string;

  constructor(app: App) {
    this.app = app;
    this.CONFIG_DIR = path.join(app.getPath("userData"), ".deai");
    this.CONFIG_FILE = path.join(this.CONFIG_DIR, "config.json");

    this.defaultConfig = {
      version: "1.0.0",
      lastOpenedNote: null,
      notesDir: null,
    };
  }

  async ensureConfigDirs(): Promise<boolean> {
    try {
      await fs.mkdir(this.CONFIG_DIR, { recursive: true });

      try {
        await fs.access(this.CONFIG_FILE);
      } catch {
        await fs.writeFile(
          this.CONFIG_FILE,
          JSON.stringify(this.defaultConfig, null, 2)
        );
      }
      return true;
    } catch (err) {
      console.error("Failed to create config directory:", err);
      return false;
    }
  }

  async getConfig(): Promise<ConfigSettings> {
    try {
      const configData = await fs.readFile(this.CONFIG_FILE, "utf8");
      return JSON.parse(configData);
    } catch {
      return this.defaultConfig;
    }
  }

  async updateConfig(updates: ConfigSettingsUpdate): Promise<ConfigSettings> {
    const config = await this.getConfig();
    const newConfig = { ...config, ...updates };
    await fs.writeFile(this.CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    return newConfig;
  }
}

export { Config, ConfigSettings, ConfigSettingsUpdate };
