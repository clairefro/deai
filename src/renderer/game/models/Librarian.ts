import { DEPTHS } from "../constants";
import { ChatDialog } from "../components/ChatDialog";
import { v4 as uuidv4 } from "uuid";
import { LIBRARIAN_CONFIG } from "../constants";
import { LibrarianData } from "../../../shared/types/LibrarianData";
import {
  generateChatSystemPrompt,
  generateMumblingsSystemPrompt,
} from "../llm/prompts/librarianPrompts";
import { ChatAdapter } from "../llm/ChatAdapter";

export type LibrarianProps =
  // new Librarian
  | {
      name: string;
      scene: Phaser.Scene;
      persona?: string;
      data?: never;
    }
  // load Librarian
  | {
      name?: never;
      scene: Phaser.Scene;
      persona?: never;
      data: LibrarianData;
    };

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
  private readonly id: string;
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

  constructor({ name, scene, persona, data }: LibrarianProps) {
    if (data) {
      this.scene = scene;
      this.id = data.id;
      this.name = data.name;
      this.persona = data.persona;
      this.mumblings = data.mumblings;
    } else {
      this.id = uuidv4();
      this.scene = scene;
      this.name = name;
      this.persona = persona || name;
    }
    // TODO: make dynamic
    this.imageKey = LIBRARIAN_CONFIG.DEFAULTS.IMAGE_KEY;
    this.systemPrompt = this.createSystemPrompt();
    this.initialize();
  }

  private createSystemPrompt(): string {
    return generateChatSystemPrompt(this.persona);
  }

  private async initialize(): Promise<void> {
    console.log({ persona: this.persona, mumblings: this.mumblings });
    if (!this.mumblings.length) {
      await this.generateMumblings();
    }
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
    const adapter = await ChatAdapter.getInstance();
    const mumblingsRaw = await adapter.getOneShot(
      "RESPOND WITH RAW JSON ARRAY OF STRINGS ONLY. NO CODE FENCES",
      generateMumblingsSystemPrompt(this.persona),
      "['Where am I?']"
    );
    this.mumblings = JSON.parse(mumblingsRaw);
  }

  setPosition(x: number, y: number): void {
    this.visuals.container?.setPosition(x, y);
  }

  destroy(): void {
    this.stopMumbling();
    this.visuals.container?.destroy();
  }

  updateSystemPrompt(persona: string): void {
    this.systemPrompt = generateChatSystemPrompt(persona);
  }

  static async loadData(id: string): Promise<LibrarianData | null> {
    try {
      const data = await window.electronAPI.getLibrarianDataById(id);
      return data;
    } catch (error) {
      console.warn("No saved librarians found:", error);
      return null;
    }
  }

  serialize(): LibrarianData {
    return {
      id: this.id,
      name: this.name,
      persona: this.persona,
      mumblings: this.mumblings,
      encountered: this.state.encountered,
      imageKey: this.imageKey,
    };
  }

  // Getters
  getContainer = () => this.visuals.container;
  getSprite = () => this.visuals.sprite;
  getNameText = () => this.visuals.nameText;
  getImage = () => this.imageKey;
}
