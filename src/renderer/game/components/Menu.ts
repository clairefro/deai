export class Menu {
  protected element: HTMLElement | null;
  protected fields: HTMLElement | null;
  private overlay: HTMLElement | null = null;

  constructor(menuId: string, fieldsId: string) {
    this.element = document.getElementById(menuId);
    this.fields = document.getElementById(fieldsId);

    if (this.element) {
      this.element.style.position = "relative";
      this.createOverlay();
    }
  }

  private createOverlay(): void {
    this.overlay = document.createElement("div");
    this.overlay.className = "menu-overlay";
    // insert overlay before menu, to stack it beneath
    this.element?.parentNode?.insertBefore(this.overlay, this.element);
  }

  protected toggle(): void {
    if (!this.element || !this.overlay) return;
    const isVisible = this.element.style.display !== "none";

    if (isVisible) {
      this.element.style.display = "none";
      this.overlay.style.display = "none";
    } else {
      this.element.style.display = "block";
      this.overlay.style.display = "block";
      this.overlay.addEventListener("click", () => this.toggle(), {
        once: true,
      });
    }
  }

  protected addCloseButton(onClose: () => void): void {
    if (!this.element) return;
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.className = "menu-close-button";
    closeButton.addEventListener("click", onClose);
    this.fields?.appendChild(closeButton);
  }
}
