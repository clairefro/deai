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
    openaiModel: string;
    ollamaModel: string | null;
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
    openaiModel: "gpt-4o-mini",
    ollamaModel: null,
  },
  apiKeys: {
    openai: null,
  },
};

// Point to props in config object that should be automatically encrypted/decrypted on storage and retrieval
const SECRET_PROPS = ["apiKeys.openai"];

type ConfigSettingsUpdate = DotNotationUpdate<Partial<ConfigSettings>>;

class Config {
  private app: App;
  private CONFIG_DIR: string;
  private CONFIG_FILE: string;
  private defaultConfig: ConfigSettings;
  private currentConfig: ConfigSettings | null = null;

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

  /** Set config to instance memory */
  async loadConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(this.CONFIG_FILE, "utf8");
      const config: ConfigSettings = JSON.parse(configData);

      // Decrypt sensitive properties
      transformProps(config, SECRET_PROPS, decrypt);

      this.currentConfig = config;
    } catch (e: any) {
      console.error("Error when loading config: ", e.message);
      this.currentConfig = this.defaultConfig;
    }
  }

  async getConfig(): Promise<ConfigSettings> {
    if (!this.currentConfig) {
      await this.loadConfig();
    }
    return this.currentConfig!;
  }

  async updateConfig(updates: ConfigSettingsUpdate): Promise<ConfigSettings> {
    const config = await this.getConfig();
    const newConfig = { ...config };

    // Handle each update
    Object.entries(updates).forEach(([path, value]) => {
      const keys = path.split(".");
      let current = newConfig as any;
      const lastKey = keys.pop();

      for (const key of keys) {
        if (!(key in current)) {
          current[key] = {};
        }
        current = current[key];
      }

      if (lastKey) {
        current[lastKey] = value;
      }
    });

    // Update memory
    this.currentConfig = newConfig;

    // Persist to disk
    // TODO : error handling
    const encryptedConfig = JSON.parse(JSON.stringify(newConfig));
    transformProps(encryptedConfig, SECRET_PROPS, encrypt);
    await fs.writeFile(
      this.CONFIG_FILE,
      JSON.stringify(encryptedConfig, null, 2)
    );

    return newConfig;
  }
}

export { Config, ConfigSettings, ConfigSettingsUpdate };
