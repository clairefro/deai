export class Menu {
  protected element: HTMLElement | null;
  protected fields: HTMLElement | null;

  constructor(menuId: string, fieldsId: string) {
    this.element = document.getElementById(menuId);
    this.fields = document.getElementById(fieldsId);
  }

  protected toggle(): void {
    if (!this.element) return;
    const isVisible = this.element.style.display !== "none";
    this.element.style.display = isVisible ? "none" : "block";
  }

  protected addCloseButton(onClose: () => void): void {
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "menu-close-button";
    closeButton.addEventListener("click", onClose);
    this.fields?.appendChild(closeButton);
  }
}
