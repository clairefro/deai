export class ChatLoadingIndicator {
  private element: HTMLElement;

  constructor() {
    this.element = this.create();
  }

  private create(): HTMLElement {
    const indicator = document.createElement("div");
    indicator.className = "chat-loading";
    indicator.textContent = "...";
    indicator.style.display = "none"; // hide by default
    return indicator;
  }

  show(): void {
    this.element.style.display = "block";
  }

  hide(): void {
    this.element.style.display = "none";
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
