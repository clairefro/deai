export class Menu {
  protected element: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private escHandler: ((e: KeyboardEvent) => void) | null = null;
  private inputHandler: ((e: Event) => void) | null = null;
  private closeButton: HTMLButtonElement;

  constructor(private menuId: string) {
    this.closeButton = this.createCloseButton();
    this.createMenuElement();
    this.setupMenu();
  }

  private createCloseButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = "×";
    button.className = "menu-close-button";
    button.setAttribute("tabindex", "0");
    button.setAttribute("aria-label", "Close menu");

    const closeMenu = () => this.toggle();
    button.addEventListener("click", closeMenu);
    button.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        closeMenu();
      }
    });

    return button;
  }

  protected createMenuElement(): void {
    const existing = document.getElementById(this.menuId);
    existing?.remove();

    const menuHtml = `
      <div id="${this.menuId}" class="menu" style="display: none;">
      </div>
    `;

    const gameContainer = document.getElementById("game");
    if (gameContainer) {
      gameContainer.insertAdjacentHTML("beforeend", menuHtml);
      this.element = document.getElementById(this.menuId);
      if (this.element) {
        const content = this.element.querySelector(".menu-content");
        content?.setAttribute("tabindex", "-1");
        this.element.appendChild(this.closeButton);
      }
    }
  }

  protected setContent(content: HTMLElement): void {
    if (!this.element) return;

    // Find or create content container
    let contentContainer = this.element.querySelector(".menu-content");
    if (!contentContainer) {
      contentContainer = document.createElement("div");
      contentContainer.className = "menu-content";
      this.element.appendChild(contentContainer);
    }

    // Update content
    contentContainer.innerHTML = "";
    contentContainer.appendChild(content);
  }

  protected setupMenu(): void {
    if (!this.element) return;
    this.createOverlay();
  }

  private createOverlay(): void {
    this.overlay = document.createElement("div");
    this.overlay.className = "menu-overlay";

    const stopAndToggle = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    };

    // Add event listeners to block all input
    this.overlay.addEventListener("mousedown", stopAndToggle, true);
    this.overlay.addEventListener("click", stopAndToggle, true);
    this.overlay.addEventListener("touchstart", stopAndToggle, true);
    this.overlay.addEventListener("touchend", stopAndToggle, true);

    this.element?.parentNode?.insertBefore(this.overlay, this.element);
  }

  private setupEscapeHandler(): void {
    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.toggle();
      }
    };
    document.addEventListener("keydown", this.escHandler);
  }

  private removeEscapeHandler(): void {
    if (this.escHandler) {
      document.removeEventListener("keydown", this.escHandler);
      this.escHandler = null;
    }
  }

  private blockAllInput(): void {
    if (this.inputHandler) return;

    this.inputHandler = (e: Event) => {
      // allow tabbing for accessibility and devtools
      if (e instanceof KeyboardEvent) {
        // always allow tab
        if (e.key === "Tab") {
          return;
        }
        // TODO: ENABLE DEVTOOLS
      }

      if (e.target instanceof Element) {
        if (
          this.element?.contains(e.target) ||
          e.target.classList.contains("menu-close-button")
        ) {
          return;
        }
      }
      e.preventDefault();
      e.stopPropagation();
    };

    const options = { passive: false, capture: true };
    const touchOptions = { passive: true, capture: true };

    // capture all input events at document level
    document.addEventListener("click", this.inputHandler, options);
    document.addEventListener("mousedown", this.inputHandler, options);
    document.addEventListener("mouseup", this.inputHandler, options);
    document.addEventListener("keydown", this.inputHandler, options);
    document.addEventListener("keyup", this.inputHandler, options);
    document.addEventListener("touchstart", this.inputHandler, touchOptions);
    document.addEventListener("touchend", this.inputHandler, touchOptions);

    // allow events within menu to propagate (make phaser objects ignore)
    this.element?.addEventListener("click", (e) => e.stopPropagation());
    this.element?.addEventListener("mousedown", (e) => e.stopPropagation());
    this.element?.addEventListener("mouseup", (e) => e.stopPropagation());
    this.element?.addEventListener("touchstart", (e) => e.stopPropagation(), {
      passive: true,
    });
    this.element?.addEventListener("touchend", (e) => e.stopPropagation(), {
      passive: true,
    });
  }

  private enableInput(): void {
    if (!this.inputHandler) return;
    const options = { capture: true };

    document.removeEventListener("click", this.inputHandler, options);
    document.removeEventListener("mousedown", this.inputHandler, options);
    document.removeEventListener("mouseup", this.inputHandler, options);
    document.removeEventListener("keydown", this.inputHandler, options);
    document.removeEventListener("keyup", this.inputHandler, options);
    document.removeEventListener("touchstart", this.inputHandler, options);
    document.removeEventListener("touchend", this.inputHandler, options);

    this.inputHandler = null;
  }

  protected toggle(): void {
    if (!this.element || !this.overlay) return;
    const isVisible = this.element.style.display !== "none";

    if (isVisible) {
      this.element.style.display = "none";
      this.overlay.style.display = "none";
      this.removeEscapeHandler();
      this.enableInput();
      document.body.focus();
    } else {
      this.element.style.display = "block";
      this.overlay.style.display = "block";
      this.setupEscapeHandler();
      this.blockAllInput();
    }
  }
}
