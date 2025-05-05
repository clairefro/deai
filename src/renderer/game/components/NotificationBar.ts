export class NotificationBar {
  private static instance: NotificationBar | null = null;
  private element: HTMLElement;

  private constructor(parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "status-bar";
    this.element.style.display = "none";
    parent.appendChild(this.element);
  }

  static initialize(parent: HTMLElement): NotificationBar {
    if (!this.instance) {
      this.instance = new NotificationBar(parent);
    }
    return this.instance;
  }

  static getInstance(): NotificationBar | null {
    return this.instance;
  }

  show(message: string): void {
    this.element.textContent = message;
    this.element.style.display = "block";
    this.element.classList.remove("fade-out");
    this.element.classList.add("fade-in");
  }

  clear(): void {
    this.element.textContent = "";
    this.element.style.display = "none";
    this.element.classList.remove("fade-out", "fade-in");
  }

  showWithDuration(message: string, duration: number = 2000): void {
    this.show(message);

    setTimeout(() => {
      this.element.classList.remove("fade-in");
      this.element.classList.add("fade-out");
      setTimeout(() => {
        this.clear();
      }, 300);
    }, duration);
  }
}
