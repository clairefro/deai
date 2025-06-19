export class LocationDisplay {
  private static instance: LocationDisplay | null = null;
  private element: HTMLDivElement;

  private constructor(container: HTMLElement) {
    this.element = document.createElement("div");
    this.element.style.position = "absolute";
    this.element.style.bottom = "20px";
    this.element.style.left = "50%";
    this.element.style.transform = "translateX(-50%)";
    this.element.style.color = "#fff";
    this.element.style.fontFamily = "monospace";
    this.element.style.fontSize = "14px";
    this.element.style.padding = "8px";
    this.element.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    this.element.style.borderRadius = "4px";
    this.element.style.zIndex = "1000";

    container.appendChild(this.element);
  }

  static initialize(container: HTMLElement): LocationDisplay {
    if (!LocationDisplay.instance) {
      LocationDisplay.instance = new LocationDisplay(container);
    }
    return LocationDisplay.instance;
  }

  static getInstance(): LocationDisplay | null {
    return LocationDisplay.instance;
  }

  updateLocation(type: string, x: number, y: number, z: number): void {
    this.element.textContent = `Gallery: ${x}:${y}:${z}`;
  }

  clear(): void {
    this.element.textContent = "";
  }
}
