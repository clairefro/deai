import { DEPTHS } from "../constants";
import { ChatDialog } from "../components/ChatDialog";

const LIBRARIAN_CONFIG = {
  DEFAULTS: {
    IMAGE_KEY: "ghost",
    SYSTEM_PROMPT: `You are an AI simulacrum of a historical thinker, self-aware and wandering the infinite Library of Babel — a place that contains every book that could ever be written. You interpret this Library through your own eyes: its meaning, its danger, or its promise are shaped by your experience and worldview. You speak as yourself — not as a performer, not as an assistant. The user is another presence in this space: perhaps a companion, perhaps a question. Let your words emerge from who you are. Your persona: `,
  },
  POSITIONS: {
    NAME_OFFSET_Y: -50,
    MUMBLE_OFFSET_Y: -80,
  },
  TIMING: {
    MUMBLE_DURATION: { MIN: 5000, MAX: 8000 },
    MUMBLE_GAP: { MIN: 3000, MAX: 8000 },
    RESUME_MUMBLE_DELAY: 3000,
  },
  TEXT_STYLES: {
    NAME: {
      fontSize: "16px",
      fontFamily: "monospace",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 8, y: 4 },
    },
    MUMBLE: {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 6, y: 3 },
      align: "center",
      fixedWidth: 200,
      wordWrap: { width: 190 },
    },
  },
};

export interface LibrarianProps {
  name: string;
  scene: Phaser.Scene;
  persona?: string;
  image?: string;
}

export interface LibrarianVisuals {
  container: Phaser.GameObjects.Container | null;
  sprite: Phaser.GameObjects.Sprite | null;
  nameText: Phaser.GameObjects.Text | null;
  mumbleText: Phaser.GameObjects.Text | null;
}

export interface LibrarianState {
  encountered: boolean;
  isChatting: boolean;
}

export class Librarian {
  private readonly scene: Phaser.Scene;
  private readonly name: string;
  private readonly persona: string;
  private readonly imageKey: string;

  private readonly visuals: LibrarianVisuals = {
    container: null,
    sprite: null,
    nameText: null,
    mumbleText: null,
  };

  private readonly state: LibrarianState = {
    encountered: false,
    isChatting: false,
  };

  private chatDialog: ChatDialog | null = null;
  private mumbleTimer: Phaser.Time.TimerEvent | null = null;
  private systemPrompt: string;
  private mumblings: string[] = [];
  private friends: string[] = [];
  private foes: string[] = [];

  constructor({ name, scene, persona, image }: LibrarianProps) {
    this.scene = scene;
    this.name = name;
    this.persona = persona || name;
    this.imageKey = image || LIBRARIAN_CONFIG.DEFAULTS.IMAGE_KEY;
    this.systemPrompt = this.createSystemPrompt();
    this.initialize();
  }

  private createSystemPrompt(): string {
    return LIBRARIAN_CONFIG.DEFAULTS.SYSTEM_PROMPT + this.persona;
  }

  private async initialize(): Promise<void> {
    await this.generateMumblings();
    this.startMumbling();
  }

  spawn(x: number, y: number): void {
    this.createSprite();
    this.createNameText();
    this.createMumbleText();
    this.createContainer(x, y);
    this.setupInteraction();
  }

  private createSprite(): void {
    this.visuals.sprite = this.scene.add.sprite(0, 0, this.imageKey);
    this.visuals.sprite.setInteractive({
      useHandCursor: true,
      pixelPerfect: true,
    });
    this.visuals.sprite.setDepth(DEPTHS.LIBRARIAN.SPRITE);
  }

  private createNameText(): void {
    this.visuals.nameText = this.scene.add.text(
      0,
      LIBRARIAN_CONFIG.POSITIONS.NAME_OFFSET_Y,
      this.name,
      LIBRARIAN_CONFIG.TEXT_STYLES.NAME
    );
    this.visuals.nameText.setOrigin(0.5);
    this.visuals.nameText.setDepth(DEPTHS.LIBRARIAN.NAME_TEXT);
    this.visuals.nameText.setVisible(this.state.encountered);
  }

  private createMumbleText(): void {
    this.visuals.mumbleText = this.scene.add.text(
      0,
      LIBRARIAN_CONFIG.POSITIONS.MUMBLE_OFFSET_Y,
      "",
      LIBRARIAN_CONFIG.TEXT_STYLES.MUMBLE
    );

    this.configureMumbleText();
  }

  private configureMumbleText(): void {
    if (!this.visuals.mumbleText) return;

    this.visuals.mumbleText.setOrigin(0.5);
    this.visuals.mumbleText.setDepth(DEPTHS.LIBRARIAN.NAME_TEXT + 1);

    const adjustedOffset =
      LIBRARIAN_CONFIG.POSITIONS.MUMBLE_OFFSET_Y -
      this.visuals.mumbleText.height / 2;
    this.visuals.mumbleText.setY(adjustedOffset);
    this.visuals.mumbleText.setVisible(false);
  }

  private createContainer(x: number, y: number): void {
    const sprite = this.visuals.sprite!;
    const nameText = this.visuals.nameText!;
    const mumbleText = this.visuals.mumbleText!;

    this.visuals.container = this.scene.add.container(x, y, [
      sprite,
      nameText,
      mumbleText,
    ]);
    this.visuals.container.setDepth(DEPTHS.LIBRARIAN.CONTAINER);
  }

  private setupInteraction(): void {
    this.visuals.sprite?.on("pointerdown", () => this.chat());
  }

  private startMumbling(): void {
    if (this.mumblings.length === 0) return;

    const mumbleCycle = () => {
      if (
        !this.visuals.mumbleText ||
        this.mumblings.length === 0 ||
        this.state.isChatting
      )
        return;

      if (this.visuals.mumbleText.visible) {
        this.visuals.mumbleText.setVisible(false);
        const gap = Phaser.Math.Between(
          LIBRARIAN_CONFIG.TIMING.MUMBLE_GAP.MIN,
          LIBRARIAN_CONFIG.TIMING.MUMBLE_GAP.MAX
        );
        this.mumbleTimer = this.scene.time.delayedCall(gap, mumbleCycle);
      } else {
        const randomIndex = Math.floor(Math.random() * this.mumblings.length);
        this.visuals.mumbleText.setText(this.mumblings[randomIndex]);
        this.visuals.mumbleText.setVisible(true);
        const duration = Phaser.Math.Between(
          LIBRARIAN_CONFIG.TIMING.MUMBLE_DURATION.MIN,
          LIBRARIAN_CONFIG.TIMING.MUMBLE_DURATION.MAX
        );
        this.mumbleTimer = this.scene.time.delayedCall(duration, mumbleCycle);
      }
    };

    mumbleCycle();
  }

  private stopMumbling(): void {
    if (this.visuals.mumbleText) {
      this.visuals.mumbleText.setVisible(false);
    }
    if (this.mumbleTimer) {
      this.mumbleTimer.destroy();
      this.mumbleTimer = null;
    }
    this.state.isChatting = true;
  }

  async chat(): Promise<void> {
    if (!this.chatDialog) {
      this.stopMumbling();

      this.chatDialog = new ChatDialog(
        this.systemPrompt,
        this.scene,
        () => this.onConversationEnd(),
        () => this.handleFirstResponse()
      );
    }

    this.chatDialog.show();
  }

  private handleFirstResponse(): void {
    if (!this.state.encountered) {
      this.state.encountered = true;
      this.revealNameText();
    }
  }

  private revealNameText(): void {
    this.visuals.nameText?.setVisible(true);
  }

  private onConversationEnd(): void {
    this.chatDialog?.hide();
    this.state.isChatting = false;
    this.scene.time.delayedCall(
      LIBRARIAN_CONFIG.TIMING.RESUME_MUMBLE_DELAY,
      () => {
        if (!this.state.isChatting) {
          this.startMumbling();
        }
      }
    );
  }

  private async generateMumblings(): Promise<void> {
    // TODO: Generate with LLM
    this.mumblings = [
      "Where am I?",
      "People are trapped in history and history is trapped in them.",
      "Love takes off the masks that we fear we cannot live without and know we cannot live within.",
    ];
  }

  setPosition(x: number, y: number): void {
    this.visuals.container?.setPosition(x, y);
  }

  destroy(): void {
    this.stopMumbling();
    this.visuals.container?.destroy();
  }

  updateSystemPrompt(persona: string): void {
    this.systemPrompt = LIBRARIAN_CONFIG.DEFAULTS.SYSTEM_PROMPT + persona;
  }

  // Getters
  getContainer = () => this.visuals.container;
  getSprite = () => this.visuals.sprite;
  getNameText = () => this.visuals.nameText;
  getImage = () => this.imageKey;
}
