import { SettingDefinition } from "../SettingsSchema";

export class SettingsField {
  static create(setting: SettingDefinition, input: HTMLElement): HTMLElement {
    const container = document.createElement("div");
    container.className = "settings-field-container";

    const label = document.createElement("label");
    label.textContent = setting.label;
    label.className = "settings-label";

    container.appendChild(label);
    container.appendChild(input);

    return container;
  }
}
