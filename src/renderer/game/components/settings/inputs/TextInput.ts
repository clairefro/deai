import { SettingDefinition } from "../SettingsSchema";
import { ConfigSettings } from "../../../../../shared/Config";
import { debounce } from "../../../../../shared/util/debounce";

const DEFAULT_PLACEHOLDER = "Enter a value";

export class TextInput {
  static create(
    setting: SettingDefinition,
    config: ConfigSettings,
    scene: Phaser.Scene,
    onUpdate: (newConfig: ConfigSettings) => void
  ): HTMLElement {
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.placeholder = setting.placeholder || DEFAULT_PLACEHOLDER;
    textInput.value = setting.value(config);
    textInput.className = "settings-input-text";

    this.setupKeyboardHandling(textInput, scene);
    this.setupChangeHandler(textInput, setting, onUpdate);

    return textInput;
  }

  private static setupKeyboardHandling(
    input: HTMLInputElement,
    scene: Phaser.Scene
  ): void {
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (scene.input.keyboard) {
        scene.input.keyboard.enabled = false;
      }
    });

    input.addEventListener("focus", () => {
      if (scene.input.keyboard) {
        scene.input.keyboard.enabled = false;
        scene.input.keyboard.clearCaptures();
      }
    });

    input.addEventListener("blur", () => {
      if (scene.input.keyboard) {
        scene.input.keyboard.enabled = true;
      }
    });
  }

  private static setupChangeHandler(
    input: HTMLInputElement,
    setting: SettingDefinition,
    onUpdate: (newConfig: ConfigSettings) => void
  ): void {
    const debouncedChangeHandler = debounce(async (event: Event) => {
      const value = (event.target as HTMLInputElement).value;
      try {
        const updatedConfig = await window.electronAPI.updateConfig({
          [setting.key]: value,
        });
        onUpdate(updatedConfig);
      } catch (error) {
        console.error("Failed to save setting:", error);
      }
    }, 300);

    input.addEventListener("input", debouncedChangeHandler);
  }
}
