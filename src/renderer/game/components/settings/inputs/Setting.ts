import { BaseSettingConfig } from "../types";

export class Setting<T extends BaseSettingConfig = BaseSettingConfig> {
  protected element: HTMLElement;
  protected currentValue: string;

  constructor(
    protected config: T,
    protected onUpdate: (value: string) => void
  ) {
    this.currentValue = config.defaultValue || "";
    this.element = document.createElement("div");
  }

  get key(): string {
    return this.config.key;
  }

  get label(): string {
    return this.config.label;
  }

  getValue(): string {
    return this.currentValue;
  }

  setValue(value: string): void {
    this.currentValue = value;
  }

  render(): HTMLElement {
    return this.element;
  }

  async initialize(): Promise<void> {}
}
