import * as Phaser from "phaser";
import { ConfigSettings } from "../../../shared/Config";
import { debounce } from "../../../shared/util/debounce";
import { DotNotation } from "../../../shared/util/DotNotation";
import { mask } from "../../../shared/util/mask";

type SupportedInput = "text" | "directory";

type SettingKeys = DotNotation<ConfigSettings>;

interface SettingDefinition {
  key: SettingKeys;
  label: string;
  value: (config: ConfigSettings) => string;
  inputType: SupportedInput;
}

const SETTINGS_SCHEMA: SettingDefinition[] = [
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
      config.apiKeys.openai ? mask(config.apiKeys.openai) : "Not set",
    inputType: "text",
  },
];

export class SettingsMenu {
  private scene: Phaser.Scene;
  private config: ConfigSettings;
  private onDirectoryChange: (newDir: string) => void;
  private menuElement: HTMLElement | null;
  private settingsFields: HTMLElement | null;

  constructor(
    scene: Phaser.Scene,
    config: ConfigSettings,
    onDirectoryChange?: (newDir: string) => void
  ) {
    this.scene = scene;
    this.config = config;
    this.onDirectoryChange = onDirectoryChange || (() => {});
    this.menuElement = document.getElementById("settings-menu");
    this.settingsFields = document.getElementById("settings-fields");
    this.create();
  }

  create(): void {
    const gear = this.scene.add.text(
      this.scene.cameras.main.width - 50,
      this.scene.cameras.main.height - 50,
      "⚙️",
      {
        font: "24px monospace",
        //@ts-ignore
        fill: "#ffffff",
      }
    );
    gear.setInteractive({ useHandCursor: true });
    gear.setDepth(100);

    gear.on("pointerdown", () => {
      if (this.menuElement) {
        const isVisible = this.menuElement.style.display !== "none";
        this.menuElement.style.display = isVisible ? "none" : "block";

        // Refresh settings when opening the menu
        if (!isVisible) {
          this.populateSettingsMenu();
        }
      }
    });

    // Initial population
    this.populateSettingsMenu();
  }

  updateConfig(newConfig: ConfigSettings): void {
    this.config = newConfig;
    if (this.menuElement?.style.display !== "none") {
      this.populateSettingsMenu();
    }
  }

  private populateSettingsMenu(): void {
    if (!this.settingsFields) return;

    this.settingsFields.innerHTML = "";

    SETTINGS_SCHEMA.forEach((setting) => {
      const fieldContainer = document.createElement("div");
      fieldContainer.className = "settings-field-container";

      const label = document.createElement("label");
      label.textContent = setting.label;
      label.className = "settings-label";

      const input = this.createInputElement(setting);

      if (input) {
        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);
        this.settingsFields?.appendChild(fieldContainer);
      }
    });

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "settings-close-button";
    closeButton.addEventListener("click", () => {
      if (this.menuElement) {
        this.menuElement.style.display = "none";
      }
    });

    // Append close button after all settings
    this.settingsFields.appendChild(closeButton);
  }

  private createInputElement(setting: SettingDefinition): HTMLElement | null {
    if (setting.inputType === "text") {
      const textInput = document.createElement("input");
      textInput.type = "text";

      // Always use the formatter from schema for display
      textInput.value = setting.value(this.config);
      textInput.className = "settings-input-text";

      // Prevent all keyboard event propagation when focused
      textInput.addEventListener("keydown", (e: KeyboardEvent) => {
        e.stopPropagation();
        if (this.scene.input.keyboard) {
          this.scene.input.keyboard.enabled = false;
        }
      });

      textInput.addEventListener("focus", () => {
        if (this.scene.input.keyboard) {
          this.scene.input.keyboard.enabled = false;
        }
        // Also disable keyboard captures
        this.scene.input.keyboard?.clearCaptures();
      });

      textInput.addEventListener("blur", () => {
        if (this.scene.input.keyboard) {
          this.scene.input.keyboard.enabled = true;
        }
      });

      const debouncedChangeHandler = debounce(async (event: Event) => {
        const value = (event.target as HTMLInputElement).value;

        // Keep the raw value for display during the update
        const rawValue = value;

        await window.electronAPI.updateConfig({
          [setting.key]: value,
        });
        // Get fresh config and update local state
        const freshConfig = await window.electronAPI.getConfig();
        this.config = freshConfig;

        // Update display using schema formatter
        textInput.value = setting.value(this.config);
      }, 300);

      textInput.addEventListener("input", debouncedChangeHandler);
      return textInput;
    }

    if (setting.inputType === "directory") {
      const buttonInput = document.createElement("button");
      buttonInput.textContent = setting.value(this.config);
      buttonInput.className = "settings-input-button";

      buttonInput.addEventListener("click", async () => {
        const selectedDir = await window.electronAPI.selectDirectory();
        if (selectedDir) {
          const updates = { [setting.key]: selectedDir };
          const updatedConfig = await window.electronAPI.updateConfig(updates);
          this.updateConfig(updatedConfig);
          buttonInput.textContent = selectedDir;

          if (setting.key === "notesDir") {
            this.onDirectoryChange(selectedDir);
          }
        }
      });

      return buttonInput;
    }

    return null;
  }
}
