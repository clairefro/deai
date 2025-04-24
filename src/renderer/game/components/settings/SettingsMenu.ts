import { Menu } from "../../components/Menu";
import { GearIcon } from "./ui/GearIcon";
import { SettingsField } from "./ui/SettingsField";
import { TextInput } from "./inputs/TextInput";
import { DirectoryInput } from "./inputs/DirectoryInput";
import { StatusBar } from "../StatusBar";
import { ConfigSettings } from "../../../../shared/Config";
import { SETTINGS_SCHEMA, SettingDefinition } from "./SettingsSchema";

export class SettingsMenu extends Menu {
  private scene: Phaser.Scene;
  private config: ConfigSettings;
  private onDirectoryChange: (newDir: string) => void;

  constructor(
    scene: Phaser.Scene,
    config: ConfigSettings,
    onDirectoryChange?: (newDir: string) => void
  ) {
    super("settings-menu", "settings-fields");

    this.scene = scene;
    this.config = config;
    this.onDirectoryChange = onDirectoryChange || (() => {});

    new GearIcon(scene, () => this.toggle());
    this.populate();
  }

  updateConfig(newConfig: ConfigSettings): void {
    this.config = newConfig;
    StatusBar.getInstance()?.show("Settings saved");
    if (this.element?.style.display !== "none") {
      this.populate();
    }
  }

  private populate(): void {
    if (!this.fields) return;

    this.fields.innerHTML = "";
    SETTINGS_SCHEMA.forEach((setting) => {
      const input = this.createInput(setting);
      if (input) {
        const field = SettingsField.create(setting, input);
        this.fields?.appendChild(field);
      }
    });

    this.addCloseButton(() => this.toggle());
  }

  private createInput(setting: SettingDefinition): HTMLElement | null {
    if (setting.inputType === "text") {
      return TextInput.create(
        setting,
        this.config,
        this.scene,
        this.updateConfig.bind(this)
      );
    }

    if (setting.inputType === "directory") {
      return DirectoryInput.create(
        setting,
        this.config,
        this.updateConfig.bind(this),
        this.onDirectoryChange
      );
    }

    return null;
  }
}
