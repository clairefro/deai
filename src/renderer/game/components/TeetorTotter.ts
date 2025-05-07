export class TeetorTotter {
  private static instance: TeetorTotter | null = null;
  private element: HTMLElement;
  private beam: HTMLElement;
  private fulcrum: HTMLElement;
  private balance: number = 0;
  private beamFill: HTMLElement;
  private balanceMarker: HTMLElement;
  private readonly maxTilt = 100;

  private constructor(parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "teetor-totter";

    // Create balance beam
    this.beam = document.createElement("div");
    this.beam.className = "teetor-totter-beam";

    // Beam fill
    const beamFill = document.createElement("div");
    beamFill.className = "teetor-totter-beam-fill";

    // Create balance marker
    const balanceMarker = document.createElement("div");
    balanceMarker.className = "teetor-totter-balance-marker";

    // Create fulcrum
    this.fulcrum = document.createElement("div");
    this.fulcrum.className = "teetor-totter-fulcrum";

    // Build hierarchy
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

  addIngestedTokens(tokens: number): void {
    console.log({ tokens });
    this.balance = Math.min(this.balance + tokens / 500, this.maxTilt);
    console.log(this.balance);

    // this.checkGameOver();
    this.updateDisplay();
  }

  addOutputTokens(charCount: number): void {
    console.log({ charCount });
    this.balance = Math.max(this.balance - charCount / 10, -this.maxTilt);
    console.log(this.balance);
    // this.checkGameOver();
    this.updateDisplay();
  }

  // private checkGameOver(): void {
  //   if (Math.abs(this.balance) >= this.maxTilt) {
  //     this.triggerGameOver();
  //   }
  // }

  // private triggerGameOver(): void {
  //   this.beam.classList.add("falling");
  //   // Emit game over event
  //   this.element.dispatchEvent(
  //     new CustomEvent("gameOver", {
  //       bubbles: true,
  //       detail: { direction: this.balance > 0 ? "right" : "left" },
  //     })
  //   );
  // }

  private updateDisplay(): void {
    this.updateBeamRotation();
    this.updateFillAndMarker();
  }

  private updateBeamRotation(): void {
    const rotation = (this.balance / this.maxTilt) * 45;
    this.beam.style.transform = `rotate(${rotation}deg)`;
  }

  private updateFillAndMarker(): void {
    // Calculate fill dimensions
    const fillPercentage = (Math.abs(this.balance) / this.maxTilt) * 50;
    const fillDirection = this.balance >= 0 ? "right" : "left";

    // Update fill position
    this.beamFill.style.width = `${fillPercentage}%`;
    this.beamFill.style.left =
      fillDirection === "right" ? "50%" : `${50 - fillPercentage}%`;

    // Update marker
    const markerPosition = 50 + (this.balance / this.maxTilt) * 50;
    this.balanceMarker.style.left = `${markerPosition}%`;
  }

  reset(): void {
    this.balance = 0;
    this.beam.classList.remove("falling");
    this.updateDisplay();
  }
}
