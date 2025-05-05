export class StatusBar {
  private static instance: StatusBar | null = null;
  private element: HTMLElement;

  private constructor(parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "status-bar";
    this.element.style.display = "none";
    parent.appendChild(this.element);
  }

  static initialize(parent: HTMLElement): StatusBar {
    if (!this.instance) {
      this.instance = new StatusBar(parent);
    }
    return this.instance;
  }

  static getInstance(): StatusBar | null {
    return this.instance;
  }

  show(message: string): void {
    this.element.textContent = message;
    this.element.style.display = "block";
    this.element.classList.remove("fade-out");
  }

  clear(): void {
    this.element.textContent = "";
    this.element.style.display = "none";
    this.element.classList.remove("fade-out");
  }

  showWithDuration(message: string, duration: number = 2000): void {
    this.element.textContent = message;
    this.element.style.display = "block";
    this.element.classList.remove("fade-out");

    setTimeout(() => {
      this.element.classList.add("fade-out");
      setTimeout(() => {
        this.element.style.display = "none";
      }, 300);
    }, duration);
  }
}
