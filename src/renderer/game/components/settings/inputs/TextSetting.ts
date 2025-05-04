import { Setting } from "./Setting";
import { TextSettingConfig } from "../types";
import { debounce } from "../../../../../shared/util/debounce";

export class TextSetting extends Setting<TextSettingConfig> {
  private input: HTMLInputElement;
  private scene: Phaser.Scene;

  constructor(
    config: TextSettingConfig,
    onUpdate: (value: string) => void,
    scene: Phaser.Scene
  ) {
    super(config, onUpdate);
    this.scene = scene;
    this.input = document.createElement("input");
    this.setupInput();
  }

  private setupInput(): void {
    this.input.type = "text";
    this.input.className = "settings-input-text";
    this.input.placeholder = this.config.placeholder || "Enter a value";
    this.input.value = this.getValue();

    this.setupKeyboardHandling();
    this.setupChangeHandler();
  }

  private setupKeyboardHandling(): void {
    this.input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = false;
      }
    });

    this.input.addEventListener("focus", () => {
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = false;
        this.scene.input.keyboard.clearCaptures();
      }
    });

    this.input.addEventListener("blur", () => {
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = true;
      }
    });
  }

  private setupChangeHandler(): void {
    const debouncedChangeHandler = debounce((event: Event) => {
      const value = (event.target as HTMLInputElement).value;
      this.setValue(value);
      this.onUpdate(value);
    }, 300);

    this.input.addEventListener("input", debouncedChangeHandler);
  }

  render(): HTMLElement {
    return this.input;
  }

  setValue(value: string): void {
    super.setValue(value);
    if (this.input) {
      this.input.value = value;
    }
  }
}
