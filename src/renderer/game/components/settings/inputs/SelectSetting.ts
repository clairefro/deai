import { Setting } from "./Setting";
import { SelectOption } from "../SettingsSchema";
import { SelectSettingConfig } from "../types";

export class SelectSetting extends Setting<SelectSettingConfig> {
  private select: HTMLSelectElement;
  private options: SelectOption[] = [];

  constructor(config: SelectSettingConfig, onUpdate: (value: string) => void) {
    super(config, onUpdate);
    this.select = document.createElement("select");
    this.select.className = "settings-input-select";

    // Initialize with static options if available
    if (config.options) {
      this.options = config.options;
      this.populateOptions();
    }

    this.select.addEventListener("change", () => {
      this.setValue(this.select.value);
      this.onUpdate(this.getValue());
    });
  }

  async initialize(): Promise<void> {
    // Load dynamic options if configured
    if (this.config.loadOptions) {
      this.options = await this.config.loadOptions();
      this.populateOptions();
      this.select.value = this.getValue();
    }
  }

  render(): HTMLElement {
    return this.select;
  }

  setValue(value: string): void {
    super.setValue(value);
    if (this.select) {
      this.select.value = value;
    }
  }

  private populateOptions(): void {
    this.select.innerHTML = "";

    // Add placeholder if no options
    if (this.options.length === 0) {
      const optEl = document.createElement("option");
      optEl.value = "";
      optEl.textContent = "No options available";
      this.select.appendChild(optEl);
      return;
    }

    // Add all options
    this.options.forEach((option) => {
      const optEl = document.createElement("option");
      optEl.value = option.value;
      optEl.textContent = option.label;
      this.select.appendChild(optEl);
    });
  }
}
