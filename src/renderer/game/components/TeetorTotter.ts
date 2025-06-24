export class TeetorTotter {
  private static instance: TeetorTotter | null = null;
  private element: HTMLElement;
  private beam: HTMLElement;
  private fulcrum: HTMLElement;
  private balance: number = 0;
  private beamFill: HTMLElement;
  private balanceMarker: HTMLElement;
  private readonly maxTilt = 1000;

  private constructor(parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "teetor-totter";

    // create balance beam
    this.beam = document.createElement("div");
    this.beam.className = "teetor-totter-beam";

    // beam fill
    const beamFill = document.createElement("div");
    beamFill.className = "teetor-totter-beam-fill";

    // create balance marker
    const balanceMarker = document.createElement("div");
    balanceMarker.className = "teetor-totter-balance-marker";

    // create fulcrum
    this.fulcrum = document.createElement("div");
    this.fulcrum.className = "teetor-totter-fulcrum";

    // build (hierarchy)
    this.beam.appendChild(beamFill);
    this.beam.appendChild(balanceMarker);
    this.element.appendChild(this.fulcrum);
    this.element.appendChild(this.beam);
    parent.appendChild(this.element);

    this.beamFill = beamFill;
    this.balanceMarker = balanceMarker;

    this.updateDisplay();
  }

  static initialize(parent: HTMLElement): TeetorTotter {
    if (!this.instance) {
      this.instance = new TeetorTotter(parent);
    }
    return this.instance;
  }

  static getInstance(): TeetorTotter | null {
    return this.instance;
  }

  addIngestedTokens(charCount: number): void {
    this.balance = Math.min(this.balance + charCount / 10, this.maxTilt);
    this.updateDisplay();
  }

  addOutputTokens(charCount: number): void {
    this.balance = Math.max(this.balance - charCount / 10, -this.maxTilt);
    this.updateDisplay();
  }

  private updateGlitchEffects(): void {
    // remove existing glitch classes
    const gameElement = document.getElementById("game");
    if (!gameElement) return;

    // Remove all glitch classes from both elements
    this.element.classList.remove(
      "glitch-mild",
      "glitch-medium",
      "glitch-severe"
    );
    gameElement.classList.remove(
      "glitch-mild",
      "glitch-medium",
      "glitch-severe"
    );

    // Calculate glitch intensity based on balance
    const imbalance = Math.abs(this.balance / this.maxTilt);

    // Add appropriate glitch class
    if (imbalance > 0.85) {
      document.getElementById("game")?.classList.add("glitch-severe");
    } else if (imbalance > 0.66) {
      document.getElementById("game")?.classList.add("glitch-medium");
      this.createMatrixRain();
    } else if (imbalance > 0.5) {
      document.getElementById("game")?.classList.add("glitch-mild");
    } else {
      document
        .getElementById("game")
        ?.classList.remove("glitch-mild", "glitch-medium", "glitch-severe");
    }
  }

  private updateDisplay(): void {
    this.updateBeamRotation();
    this.updateFillAndMarker();
    this.updateGlitchEffects();
  }

  private updateBeamRotation(): void {
    const rotation = (this.balance / this.maxTilt) * 45;
    this.beam.style.transform = `rotate(${rotation}deg)`;
  }

  private updateFillAndMarker(): void {
    const fillPercentage = (Math.abs(this.balance) / this.maxTilt) * 50;
    const fillDirection = this.balance >= 0 ? "right" : "left";

    this.beamFill.style.width = `${fillPercentage}%`;
    this.beamFill.style.left =
      fillDirection === "right" ? "50%" : `${50 - fillPercentage}%`;

    const markerPosition = 50 + (this.balance / this.maxTilt) * 50;
    this.balanceMarker.style.left = `${markerPosition}%`;
  }

  reset(): void {
    this.balance = 0;
    this.beam.classList.remove("falling");
    this.updateDisplay();
  }

  private createMatrixRain(): void {
    const game = document.getElementById("game");
    if (!game) return;

    // Clear existing columns
    const existing = document.querySelectorAll(".matrix-column");
    existing.forEach((el) => el.remove());

    // Create new columns
    const columns = 20;
    for (let i = 0; i < columns; i++) {
      const column = document.createElement("div");
      column.className = "matrix-column";

      // Generate random binary string
      const binaryString = Array(30)
        .fill(0)
        .map(() => Math.round(Math.random()))
        .join(" ");

      column.textContent = binaryString;

      // Random position and delay
      column.style.left = `${(100 / columns) * i}%`;
      column.style.animationDelay = `${Math.random() * 2}s`;

      game.appendChild(column);
    }
  }
}
