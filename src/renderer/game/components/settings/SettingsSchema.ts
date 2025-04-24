import { ConfigSettings } from "../../../../shared/Config";
import { DotNotation } from "../../../../shared/util/DotNotation";
import { mask } from "../../../../shared/util/mask";

export type SupportedInput = "text" | "directory";

export type SettingKeys = DotNotation<ConfigSettings>;

export interface SettingDefinition {
  key: SettingKeys;
  label: string;
  value: (config: ConfigSettings) => string;
  inputType: SupportedInput;
  placeholder?: string;
}

export const SETTINGS_SCHEMA: SettingDefinition[] = [
  {
    key: "notesDir",
    label: "Notes Directory",
    value: (config: ConfigSettings) => config.notesDir || "Not set",
    inputType: "directory",
  },
  {
    key: "apiKeys.openai",
    label: "OpenAI API Key",
    value: (config: ConfigSettings) =>
      config.apiKeys.openai ? mask(config.apiKeys.openai) : "",
    inputType: "text",
    placeholder: "Not set",
  },
];
