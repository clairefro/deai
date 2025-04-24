import * as Phaser from "phaser";
import { ConfigSettings } from "../../../../shared/Config";
import { SETTINGS_SCHEMA, SettingDefinition } from "./SettingsSchema";
import { TextInput } from "./inputs/TextInput";
import { StatusBar } from "../StatusBar";

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
    this.createGearIcon();
    this.populateSettingsMenu();
  }

  private createGearIcon(): void {
    const gear = this.scene.add.text(
      this.scene.cameras.main.width - 50,
      this.scene.cameras.main.height - 50,
      "⚙️",
      {
        font: "24px monospace",
        color: "#ffffff",
      }
    );
    gear.setInteractive({ useHandCursor: true });
    gear.setDepth(100);
    gear.on("pointerdown", () => this.toggleMenu());
  }

  private toggleMenu(): void {
    if (!this.menuElement) return;
    const isVisible = this.menuElement.style.display !== "none";
    this.menuElement.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      this.populateSettingsMenu();
    }
  }

  updateConfig(newConfig: ConfigSettings): void {
    this.config = newConfig;
    StatusBar.getInstance()?.show("Settings saved");
    if (this.menuElement?.style.display !== "none") {
      this.populateSettingsMenu();
    }
  }

  private createInputElement(setting: SettingDefinition): HTMLElement | null {
    if (setting.inputType === "text") {
      return TextInput.create(
        setting,
        this.config,
        this.scene,
        this.updateConfig.bind(this)
      );
    }

    if (setting.inputType === "directory") {
      return this.createDirectoryButton(setting);
    }

    return null;
  }

  private createDirectoryButton(setting: SettingDefinition): HTMLElement {
    const button = document.createElement("button");
    button.textContent = setting.value(this.config);
    button.className = "settings-input-button";

    button.addEventListener("click", async () => {
      const selectedDir = await window.electronAPI.selectDirectory();
      if (selectedDir) {
        const updatedConfig = await window.electronAPI.updateConfig({
          [setting.key]: selectedDir,
        });
        this.updateConfig(updatedConfig);
        if (setting.key === "notesDir") {
          this.onDirectoryChange(selectedDir);
        }
      }
    });

    return button;
  }

  private populateSettingsMenu(): void {
    if (!this.settingsFields) return;

    this.settingsFields.innerHTML = ""; // clear settings
    SETTINGS_SCHEMA.forEach((setting) => this.addSettingField(setting));
    this.addCloseButton();
  }

  private addSettingField(setting: SettingDefinition): void {
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
  }

  private addCloseButton(): void {
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "settings-close-button";
    closeButton.addEventListener("click", () => this.toggleMenu());
    this.settingsFields?.appendChild(closeButton);
  }
}
