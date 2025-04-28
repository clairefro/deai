import { ConfigSettings } from "../../../../shared/Config";
import { DotNotation } from "../../../../shared/util/DotNotation";
import { mask } from "../../../../shared/util/mask";

export type SupportedInput = "text" | "directory" | "select";

export type SettingKeys = DotNotation<ConfigSettings>;

export interface SelectOption {
  value: string;
  label: string;
}

export interface SettingDefinition {
  key: SettingKeys;
  label: string;
  value: (config: ConfigSettings) => string;
  inputType: SupportedInput;
  placeholder?: string;
  options?: SelectOption[];
}

export const SETTINGS_SCHEMA: SettingDefinition[] = [
  {
    key: "notesDir",
    label: "Notes Directory",
    value: (config: ConfigSettings) => config.notesDir || "Not set",
    inputType: "directory",
  },
  {
    key: "llm.platform",
    label: "LLM Platform",
    value: (config: ConfigSettings) => config.llm.platform,
    inputType: "select",
    options: [
      { value: "openai", label: "OpenAI" },
      { value: "ollama", label: "Ollama" },
    ],
  },
  {
    key: "llm.openaiModel",
    label: "OpenAI Model",
    value: (config: ConfigSettings) => config.llm.openaiModel || "gpt-4o-mini",
    inputType: "select",
    options: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-4-turbo-preview", label: "GPT-4 Turbo" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
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
