import path from "node:path";
import fs from "node:fs/promises";
import { App } from "electron";

import { transformProps } from "./util/transformProps";
import { encrypt, decrypt } from "./util/crypt";
import { DotNotationUpdate } from "./util/DotNotation";

interface ConfigSettings {
  version: string;
  lastOpenedNote: string | null;
  notesDir: string | null;
  llm: {
    platform: "openai" | "ollama";
    model: string;
  };
  apiKeys: {
    openai: string | null;
  };
}

const DEFAULT_CONFIG: ConfigSettings = {
  version: "1.0.0",
  lastOpenedNote: null,
  notesDir: null,
  llm: {
    platform: "openai",
    model: "gpt-4o-mini",
  },
  apiKeys: {
    openai: null,
  },
};

// Point to props in config object that should be automatically encrypted/decrypted on storage and retrieval
const SECRET_PROPS = ["apiKeys.openai"];

type ConfigSettingsUpdate = DotNotationUpdate<Partial<ConfigSettings>>;

class Config {
  app: App;
  CONFIG_DIR: string;
  CONFIG_FILE: string;
  defaultConfig: ConfigSettings;

  constructor(app: App) {
    this.app = app;
    this.CONFIG_DIR = path.join(app.getPath("userData"), ".deai");
    this.CONFIG_FILE = path.join(this.CONFIG_DIR, "config.json");
    console.log({ CONFIG_DIR: this.CONFIG_DIR });

    this.defaultConfig = DEFAULT_CONFIG;
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
      const config: ConfigSettings = JSON.parse(configData);

      console.log("GET BEFORE");
      console.log(config);

      // Decrypt sensitive properties before returning
      transformProps(config, SECRET_PROPS, decrypt);
      console.log("GET AFTER");
      console.log(config);

      return config;
    } catch (e: any) {
      console.error("Error when getting config: ", e.message);
      return this.defaultConfig;
    }
  }

  async updateConfig(updates: ConfigSettingsUpdate): Promise<ConfigSettings> {
    const config = await this.getConfig();
    const newConfig = { ...config };

    // Handle each update by properly setting nested properties
    Object.entries(updates).forEach(([path, value]) => {
      const keys = path.split(".");
      let current = newConfig as any;

      // Navigate to the correct nesting level
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      // Set the value at the final key
      current[keys[keys.length - 1]] = value;
    });

    // Encrypt sensitive properties before saving
    transformProps(newConfig, SECRET_PROPS, encrypt);

    await fs.writeFile(this.CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    return newConfig;
  }
}

export { Config, ConfigSettings, ConfigSettingsUpdate };
