import { AppConfig } from "../../../../shared/Config";
import { Menu } from "../Menu";
import { GearIcon } from "./ui/GearIcon";
import { NotificationBar } from "../NotificationBar";
import { SETTINGS_SCHEMA, SettingDefinition } from "./SettingsSchema";
import { SelectSetting } from "./inputs/SelectSetting";
import { TextSetting } from "./inputs/TextSetting";
import { DirectorySetting } from "./inputs/DirectorySetting";
import { Setting } from "./inputs/Setting";

export class SettingsMenu extends Menu {
  private scene: Phaser.Scene;
  private config: AppConfig;
  private settings: Map<string, Setting> = new Map();
  private onDirectoryChange: (dir: string) => void;

  constructor(
    scene: Phaser.Scene,
    config: AppConfig,
    onDirectoryChange: (newDir: string) => void
  ) {
    super("settings-menu");
    this.scene = scene;
    this.config = config;
    this.onDirectoryChange = onDirectoryChange;

    new GearIcon(scene, () => this.toggle());
    this.populate();
  }

  private async populate(): Promise<void> {
    const content = document.createElement("div");
    content.className = "settings-content";

    const header = document.createElement("h2");
    header.textContent = "Settings";
    header.className = "settings-header";
    content.appendChild(header);

    // create settings in parallel
    await Promise.all(
      SETTINGS_SCHEMA.map(async (definition) => {
        const setting = await this.createSetting(definition);
        if (setting) {
          const field = this.createField(definition.label, setting.render());
          content.appendChild(field);
          this.settings.set(definition.key, setting);
        }
      })
    );

    this.setContent(content);
  }

  private async createSetting(
    definition: SettingDefinition
  ): Promise<Setting | null> {
    const baseConfig = {
      key: definition.key,
      label: definition.label,
      defaultValue: definition.value(this.config),
      placeholder: definition.placeholder,
    };

    let setting: Setting;

    switch (definition.type) {
      case "select":
        setting = new SelectSetting(
          {
            ...baseConfig,
            type: "select",
            options: definition.options,
            loadOptions: definition.loadOptions,
          },
          (value) => this.handleUpdate(definition.key, value)
        );
        break;

      case "text":
        setting = new TextSetting(
          {
            ...baseConfig,
            type: "text",
          },
          (value) => this.handleUpdate(definition.key, value),
          this.scene
        );
        break;

      case "directory":
        // special handling for notes dir change, needs to call notebook to reload via callback
        if (definition.key === "notesDir") {
          setting = new DirectorySetting(
            {
              ...baseConfig,
              type: "directory",
              onDirectoryChange: this.onDirectoryChange,
            },
            (value) => this.handleUpdate(definition.key, value)
          );
        } else {
          setting = new DirectorySetting(
            {
              ...baseConfig,
              type: "directory",
            },
            (value) => this.handleUpdate(definition.key, value)
          );
        }
        break;

      default:
        return null;
    }

    await setting.initialize();
    return setting;
  }

  private createField(label: string, input: HTMLElement): HTMLElement {
    const field = document.createElement("div");
    field.className = "settings-field";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;

    field.appendChild(labelEl);
    field.appendChild(input);

    return field;
  }

  private async handleUpdate(key: string, value: string): Promise<void> {
    await window.electronAPI.updateConfig({ [key]: value });
    NotificationBar.getInstance()?.showWithDuration("Settings saved");
  }

  updateConfig(newConfig: AppConfig): void {
    this.config = newConfig;

    // Update all setting values
    this.settings.forEach((setting, key) => {
      const definition = SETTINGS_SCHEMA.find((d) => d.key === key);
      if (definition) {
        setting.setValue(definition.value(newConfig));
      }
    });
  }
}
