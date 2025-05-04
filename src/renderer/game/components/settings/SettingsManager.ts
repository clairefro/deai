import { SettingDefinition } from "./SettingsSchema";
import { SelectOption } from "./SettingsSchema";

export class SettingsManager {
  private static optionsCache: Map<string, SelectOption[]> = new Map();

  static async loadOptionsForSetting(
    setting: SettingDefinition
  ): Promise<SelectOption[]> {
    // Return cached options if available
    if (this.optionsCache.has(setting.key)) {
      return this.optionsCache.get(setting.key)!;
    }

    // Load options if async loading is required
    if (setting.loadOptions) {
      const options = await setting.loadOptions();
      this.optionsCache.set(setting.key, options);
      return options;
    }

    // Return static options
    return (setting.options as SelectOption[]) || [];
  }

  static clearCache(settingKey?: string): void {
    if (settingKey) {
      this.optionsCache.delete(settingKey);
    } else {
      this.optionsCache.clear();
    }
  }
}
