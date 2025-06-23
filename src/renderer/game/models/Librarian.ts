import { DEPTHS } from "../constants";
import { ChatDialog } from "../components/chat/ChatDialog";
import { v4 as uuidv4 } from "uuid";
import { LIBRARIAN_CONFIG } from "../constants";
import { LibrarianData } from "../../../shared/types";
import {
  generateChatSystemPrompt,
  generateMumblingsSystemPrompt,
  generateObsessionSystemPrompt,
} from "../llm/prompts/librarianPrompts";
import { ChatAdapter } from "../llm/ChatAdapter";
import { Message } from "../llm/ChatAdapter";

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
  lastMumble: string | null;
}

export class Librarian {
  private readonly id: string;
  private readonly scene: Phaser.Scene;
  private readonly name: string;
  private readonly persona: string;
  private readonly imageKey: string;
  private mumblings: string[] = [];
  private obsession: string = "";

  private readonly visuals: LibrarianVisuals = {
    container: null,
    sprite: null,
    nameText: null,
    mumbleText: null,
  };

  private readonly state: LibrarianState = {
    encountered: false,
    isChatting: false,
    lastMumble: null,
  };

  private chatDialog: ChatDialog | null = null;
  private mumbleTimer: Phaser.Time.TimerEvent | null = null;
  private systemPrompt: string | null = null;

  constructor({ name, scene, persona, data }: LibrarianProps) {
    if (data) {
      this.scene = scene;
      this.id = data.id;
      this.name = data.name;
      this.persona = data.persona;
      this.mumblings = data.mumblings;
      this.obsession = data.obsession ? data.obsession : "";
      this.state.encountered = data.encountered || false;
    } else {
      this.id = uuidv4();
      this.scene = scene;
      this.name = name;
      this.persona = persona || name;
      this.state.encountered = false;
    }
    // TODO: make dynamic
    this.imageKey = LIBRARIAN_CONFIG.DEFAULTS.IMAGE_KEY;
  }

  private createSystemPrompt(): string {
    return generateChatSystemPrompt(this.persona, this.obsession);
  }

  private async initialize(): Promise<void> {
    if (!this.mumblings || this.mumblings.length === 0) {
      console.log(`LIBRARIAN: Generating mumblings for ${this.name}`);
      await this.generateMumblings();
    }
    if (!this.obsession) {
      console.log(`LIBRARIAN: Generating obsessions for ${this.name}`);
      await this.generateObsession();
    }
    this.createSprite();
    this.createNameText();
    this.createMumbleText();

    this.systemPrompt = this.createSystemPrompt();
  }

  async spawn(x: number, y: number): Promise<void> {
    await this.initialize();

    this.createContainer(x, y);
    this.setupInteraction();

    this.revealNameText();

    this.startMumbling();
  }

  private createSprite(): void {
    this.visuals.sprite = this.scene.add
      .sprite(0, 0, this.imageKey)
      .play("ghost-idle");
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
      this.getDisplayName(),
      LIBRARIAN_CONFIG.TEXT_STYLES.NAME
    );
    this.visuals.nameText.setOrigin(0.5);
    this.visuals.nameText.setDepth(DEPTHS.LIBRARIAN.NAME_TEXT);
    this.visuals.nameText.setVisible(true);
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

  getActionTarget(): Phaser.GameObjects.Container {
    return this.visuals.container as Phaser.GameObjects.Container;
  }

  getDisplayName(): string {
    return this.state.encountered ? this.name : "?";
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
        const mumble = this.mumblings[randomIndex];
        this.state.lastMumble = mumble;
        this.visuals.mumbleText.setText(mumble);
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

      // shoehorn in last mumble if it exists
      const initialHistory: Message[] = this.state.lastMumble
        ? [{ role: "assistant", content: `*${this.state.lastMumble}*` }]
        : [];

      if (!this.systemPrompt) {
        await this.initialize();
      }

      this.chatDialog = new ChatDialog(
        this.systemPrompt as string,
        this.scene,
        () => this.onConversationEnd(),
        () => this.handleFirstResponse()
      );

      if (this.state.lastMumble) {
        this.chatDialog.addLastMumble(this.state.lastMumble);
      }
      if (this.state.encountered) {
        this.chatDialog.updateTitle(this.name);
      }
    }

    this.chatDialog.show();
  }

  private async handleFirstResponse(): Promise<void> {
    if (!this.state.encountered) {
      this.state.encountered = true;

      // update librarian enountered stae
      try {
        await window.electronAPI.upsertLibrarianData({
          ...this.serialize(),
          encountered: true,
        });
      } catch (err) {
        console.error("Failed to update librarian encountered state:", err);
      }

      this.revealNameText();
      this.chatDialog?.updateTitle(this.name);
    }
  }

  private revealNameText(): void {
    if (!this.visuals.nameText) return;

    this.visuals.nameText.setText(this.getDisplayName());
    this.visuals.nameText.setVisible(true);

    // re-center the text since width may have changed
    this.visuals.nameText.setOrigin(0.5);
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
      generateMumblingsSystemPrompt(this.persona)
    );

    this.mumblings = mumblingsRaw
      ? JSON.parse(mumblingsRaw)
      : '["Where am I?"]';
  }

  private async generateObsession(): Promise<void> {
    const adapter = await ChatAdapter.getInstance();
    const obsession = await adapter.getOneShot(
      generateObsessionSystemPrompt(this.persona)
    );

    this.obsession = obsession || "";
  }

  setPosition(x: number, y: number): void {
    this.visuals.container?.setPosition(x, y);
  }

  destroy(): void {
    this.stopMumbling();
    this.visuals.container?.destroy();
  }

  updateSystemPrompt(persona: string, obsession: string): void {
    this.systemPrompt = generateChatSystemPrompt(persona, obsession);
  }

  static async loadLibrarianDataById(
    id: string
  ): Promise<LibrarianData | null> {
    try {
      const data = await window.electronAPI.getLibrarianDataById(id);
      return data;
    } catch (error) {
      console.warn(
        `No saved librarians found for Librarian with id ${id}:`,
        error
      );
      return null;
    }
  }

  static async loadLibrarianById(
    scene: Phaser.Scene,
    id: string
  ): Promise<Librarian | null> {
    try {
      const data = await this.loadLibrarianDataById(id);
      if (!data) {
        console.warn(`No librarian found with id: ${id}`);
        return null;
      }
      return this.loadLibrarianFromData(scene, data);
    } catch (error) {
      console.error("Failed to load librarian by id:", error);
      return null;
    }
  }

  static loadLibrarianFromData(
    scene: Phaser.Scene,
    data: LibrarianData
  ): Librarian {
    return new Librarian({
      scene,
      data,
    });
  }

  serialize(): LibrarianData {
    return {
      id: this.id,
      name: this.name,
      persona: this.persona,
      mumblings: this.mumblings,
      encountered: this.state.encountered,
      imageKey: this.imageKey,
      obsession: this.obsession,
    };
  }

  // Getters
  getContainer = () => this.visuals.container;
  getSprite = () => this.visuals.sprite;
  getNameText = () => this.visuals.nameText;
  getImage = () => this.imageKey;

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }
}
