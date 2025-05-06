export class ChatLoadingIndicator {
  private element: HTMLElement;
  private readonly defaultText = "...";

  constructor() {
    this.element = this.create();
  }

  private create(): HTMLElement {
    const element = document.createElement("div");
    element.className = "chat-loading";
    element.style.display = "none"; // hide by default
    return element;
  }

  show(text?: string): void {
    this.element.textContent = text || this.defaultText;
    this.element.style.display = "block";
  }

  hide(): void {
    this.element.style.display = "none";
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
