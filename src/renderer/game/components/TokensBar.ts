export class TokensBar {
  private static instance: TokensBar | null = null;
  private element: HTMLElement;
  private barFill: HTMLElement;
  private textElement: HTMLElement;
  private tokenCount: number = 0;
  private readonly maxTokens: number = 50000;

  private constructor(parent: HTMLElement) {
    // Create container
    this.element = document.createElement("div");
    this.element.className = "tokens-bar";

    // Create fill bar
    this.barFill = document.createElement("div");
    this.barFill.className = "tokens-bar-fill";

    // Create text display
    this.textElement = document.createElement("div");
    this.textElement.className = "tokens-bar-text";

    this.element.appendChild(this.barFill);
    this.element.appendChild(this.textElement);
    parent.appendChild(this.element);

    this.updateDisplay();
  }

  static initialize(parent: HTMLElement): TokensBar {
    if (!this.instance) {
      this.instance = new TokensBar(parent);
    }
    return this.instance;
  }

  static getInstance(): TokensBar | null {
    return this.instance;
  }

  addTokens(tokens: number): void {
    this.tokenCount = Math.min(this.tokenCount + tokens, this.maxTokens);
    this.updateDisplay();
  }

  private updateDisplay(): void {
    const percentage = (this.tokenCount / this.maxTokens) * 100;
    this.barFill.style.width = `${percentage}%`;
    this.textElement.textContent = `${this.tokenCount}/${this.maxTokens} tokens`;
  }

  reset(): void {
    this.tokenCount = 0;
    this.updateDisplay();
  }
}
