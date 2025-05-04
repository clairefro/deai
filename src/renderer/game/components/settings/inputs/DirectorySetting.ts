import { Setting } from "./Setting";
import { DirectorySettingConfig } from "../types";

export class DirectorySetting extends Setting<DirectorySettingConfig> {
  private button: HTMLButtonElement;

  constructor(
    config: DirectorySettingConfig,
    onUpdate: (value: string) => void
  ) {
    super(config, onUpdate);
    this.button = document.createElement("button");
    this.setupButton();
  }

  private setupButton(): void {
    this.button.textContent = this.getValue() || "Select Directory";
    this.button.className = "settings-input-button";

    this.button.addEventListener("click", this.handleClick.bind(this));
  }

  private async handleClick(): Promise<void> {
    const selectedDir = await window.electronAPI.openDirSelect();
    if (selectedDir) {
      this.setValue(selectedDir);
      this.onUpdate(selectedDir);

      // Call optional directory change handler
      if (this.config.onDirectoryChange) {
        this.config.onDirectoryChange(selectedDir);
      }
    }
  }

  render(): HTMLElement {
    return this.button;
  }

  setValue(value: string): void {
    super.setValue(value);
    if (this.button) {
      this.button.textContent = value || "Select Directory";
    }
  }
}
