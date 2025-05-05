import { AppConfig } from "../../../../shared/Config";
import { DotNotation } from "../../../../shared/util/DotNotation";
import { mask } from "../../../../shared/util/mask";
import { getAvailableOllamaModels } from "../../llm/ollamaUtils";
import { SchemaSettingConfig } from "./types";

export type SupportedInput = "text" | "directory" | "select";

export type SettingKeys = DotNotation<AppConfig>;

export interface SelectOption {
  value: string;
  label: string;
}

export interface SettingDefinition {
  key: SettingKeys;
  label: string;
  value: (config: AppConfig) => string;
  type: SupportedInput;
  placeholder?: string;
  // below are for opoulating settings options either syncronously or async
  options?: SelectOption[];
  loadOptions?: () => Promise<SelectOption[]>;
}

export const SETTINGS_SCHEMA: SchemaSettingConfig[] = [
  {
    key: "notesDir",
    label: "Notes Directory",
    type: "directory",
    value: (config: AppConfig) => config.notesDir || "",
  },
  {
    key: "llm.platform",
    label: "LLM Platform",
    type: "select",
    value: (config: AppConfig) => config.llm.platform,
    options: [
      { value: "openai", label: "Cloud (OpenAI)" },
      { value: "ollama", label: "Local (Ollama)" },
    ],
  },
  {
    key: "llm.openaiModel",
    label: "OpenAI Model",
    type: "select",
    value: (config: AppConfig) => config.llm.openaiModel || "gpt-4o-mini",
    options: [
      { value: "gpt-4o-mini", label: "GPT-4o Mini (recommended)" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-4-turbo-preview", label: "GPT-4 Turbo" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
  },
  {
    key: "llm.ollamaModel",
    label: "Ollama Model",
    type: "select",
    value: (config: AppConfig) => config.llm.ollamaModel || "",
    loadOptions: async () => {
      try {
        const config = await window.electronAPI.getConfig();
        const availableModelOptions = await getAvailableOllamaModels(
          config.llm.ollamaHost
        );
        return availableModelOptions;
      } catch (error) {
        console.error("Failed to load Ollama models:", error);
        return [{ value: "", label: "No models found" }];
      }
    },
  },
  {
    key: "llm.ollamaHost",
    label: "Ollama Host",
    type: "text",
    value: (config: AppConfig) => config.llm.ollamaHost,
    placeholder: "Not set",
  },
  {
    key: "apiKeys.openai",
    label: "OpenAI API Key",
    type: "text",
    value: (config: AppConfig) =>
      config.apiKeys.openai ? mask(config.apiKeys.openai) : "",
    placeholder: "Not set",
  },
];
