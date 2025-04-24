import { SettingDefinition } from "../SettingsSchema";
import { ConfigSettings } from "../../../../../shared/Config";

export class DirectoryInput {
  static create(
    setting: SettingDefinition,
    config: ConfigSettings,
    onUpdate: (newConfig: ConfigSettings) => void,
    onDirectoryChange?: (dir: string) => void
  ): HTMLElement {
    const button = document.createElement("button");
    button.textContent = setting.value(config);
    button.className = "settings-input-button";

    button.addEventListener("click", async () => {
      // Use Electron's dialog through the context bridge
      const selectedDir = await window.electronAPI.selectDirectory();
      if (selectedDir) {
        const updatedConfig = await window.electronAPI.updateConfig({
          [setting.key]: selectedDir,
        });
        onUpdate(updatedConfig);

        // Notify parent of directory change if callback provided
        if (setting.key === "notesDir" && onDirectoryChange) {
          onDirectoryChange(selectedDir);
        }
      }
    });

    return button;
  }
}
