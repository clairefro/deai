import { SelectOption } from "../components/settings/SettingsSchema";

let cachedOllamaModels: SelectOption[] | null = null;

export async function getAvailableOllamaModels(
  host: string
): Promise<SelectOption[]> {
  if (cachedOllamaModels) {
    return cachedOllamaModels;
  }

  try {
    const response = await fetch(`${host}/api/tags`);
    if (!response.ok) {
      throw new Error("Failed to fetch Ollama models");
    }

    const data = await response.json();
    cachedOllamaModels = (data.models || []).map((model: any) => ({
      value: model.name,
      label: model.name,
    }));

    return cachedOllamaModels as SelectOption[];
  } catch (error) {
    console.error("Failed to load Ollama models:", error);
    return [{ value: "", label: "No models found" }];
  }
}

export function clearOllamaModelsCache(): void {
  cachedOllamaModels = null;
}
