import path from "node:path";
import fs from "node:fs/promises";
import { App } from "electron";

import { transformProps } from "./util/transformProps";
import { encrypt, decrypt } from "./util/crypt";
import { DotNotationUpdate } from "./util/DotNotation";
import { accessByDotNotation } from "./util/accessByDotNotation";

interface AppConfig {
  version: string;
  lastOpenedNote: string | null;
  notesDir: string | null;
  llm: {
    platform: "openai" | "ollama";
    openaiModel: string;
    ollamaModel: string | null;
    ollamaHost: string;
  };
  apiKeys: {
    openai: string | null;
  };
  localMode: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  version: "1.0.0",
  lastOpenedNote: null,
  notesDir: null,
  llm: {
    platform: "openai",
    openaiModel: "gpt-4o-mini",
    ollamaModel: null,
    ollamaHost: "http://localhost:11434",
  },
  apiKeys: {
    openai: null,
  },
  localMode: false,
};

// Point to props in config object that should be automatically encrypted/decrypted on storage and retrieval
const SECRET_PROPS = ["apiKeys.openai"];

type ConfigSettingsUpdate = DotNotationUpdate<Partial<AppConfig>>;

class Config {
  private CONFIG_DIR: string;
  private CONFIG_FILE: string;
  private defaultConfig: AppConfig;
  private currentConfig: AppConfig | null = null;

  constructor(app: App) {
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
      const config: AppConfig = JSON.parse(configData);

      // Decrypt sensitive properties
      transformProps(config, SECRET_PROPS, decrypt);

      this.currentConfig = config;
    } catch (e: any) {
      console.error("Error when loading config: ", e.message);
      this.currentConfig = this.defaultConfig;
    }
  }

  async getConfig(): Promise<AppConfig> {
    if (!this.currentConfig) {
      await this.loadConfig();
    }
    return this.currentConfig!;
  }

  /**
   * Get a value from config using dot notation
   * Example: get('llm.platform') returns 'openai'
   */
  async get<T>(dotNotationPath: string): Promise<T | undefined> {
    const config = await this.getConfig();
    return accessByDotNotation<T>(config, dotNotationPath);
  }

  /**
   * Set a single value in config using dot notation
   * Example: set('llm.platform', 'ollama')
   */
  async set<T>(path: string, value: T): Promise<AppConfig> {
    return this.setMany({ [path]: value });
  }

  /**
   * Update multiple values using dot notation
   * Example: setMany({ 'llm.platform': 'ollama', 'llm.ollamaModel': 'mistral' })
   */
  async setMany(updates: ConfigSettingsUpdate): Promise<AppConfig> {
    const config = await this.getConfig();
    const newConfig = { ...config };

    // Apply updates using dot notation
    Object.entries(updates).forEach(([path, value]) => {
      accessByDotNotation(newConfig, path, value);
    });

    // Update memory
    this.currentConfig = newConfig;

    // Persist to disk with encryption
    const encryptedConfig = JSON.parse(JSON.stringify(newConfig));
    transformProps(encryptedConfig, SECRET_PROPS, encrypt);
    await fs.writeFile(
      this.CONFIG_FILE,
      JSON.stringify(encryptedConfig, null, 2)
    );

    return newConfig;
  }
}

export { Config, AppConfig, ConfigSettingsUpdate };
