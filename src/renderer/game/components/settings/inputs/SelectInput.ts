import { SettingDefinition } from "../SettingsSchema";
import { ConfigSettings } from "../../../../../shared/Config";
import { debounce } from "../../../../../shared/util/debounce";

export class SelectInput {
  static create(
    setting: SettingDefinition,
    config: ConfigSettings,
    scene: Phaser.Scene,
    onUpdate: (newConfig: ConfigSettings) => void
  ): HTMLElement {
    if (!setting.options) {
      throw new Error(`Select input ${setting.key} requires options`);
    }

    const select = document.createElement("select");
    select.className = "settings-input-select";

    setting.options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      select.appendChild(optionElement);
    });

    select.value = setting.value(config);

    this.setupKeyboardHandling(select, scene);
    this.setupChangeHandler(select, setting, onUpdate);

    return select;
  }

  private static setupKeyboardHandling(
    select: HTMLSelectElement,
    scene: Phaser.Scene
  ): void {
    select.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (scene.input.keyboard) {
        scene.input.keyboard.enabled = false;
      }
    });

    select.addEventListener("focus", () => {
      if (scene.input.keyboard) {
        scene.input.keyboard.enabled = false;
        scene.input.keyboard.clearCaptures();
      }
    });

    select.addEventListener("blur", () => {
      if (scene.input.keyboard) {
        scene.input.keyboard.enabled = true;
      }
    });
  }

  private static setupChangeHandler(
    select: HTMLSelectElement,
    setting: SettingDefinition,
    onUpdate: (newConfig: ConfigSettings) => void
  ): void {
    const debouncedChangeHandler = debounce(async (event: Event) => {
      const value = (event.target as HTMLSelectElement).value;
      try {
        const updatedConfig = await window.electronAPI.updateConfig({
          [setting.key]: value,
        });
        onUpdate(updatedConfig);
      } catch (error) {
        console.error("Failed to save setting:", error);
      }
    }, 300);

    select.addEventListener("change", debouncedChangeHandler);
  }
}
