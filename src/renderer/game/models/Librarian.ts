import { ChatDialog } from "../components/ChatDialog";
import { DEPTHS } from "../constants";

// TODO
const SYSTEM_PROMPT_PREAMBLE = `You are an AI Simulacra of a persona, wandering in the Library of Babel. Chat with the user as this persona, as if it were a spoken conversation. DO NOT BREAK PERSONA. YOU ARE NOT AN ASSISTANT. Your persona: `;

const DEFAULT_IMGKEY = "ghost";

export class Librarian {
  name: string;
  private scene: Phaser.Scene;
  persona: string;
  systemPrompt!: string;
  mumblings: string[] = [];
  friends: string[] = [];
  foes: string[] = [];
  image?: string;
  // + lastFiveMsgs?
  encountered = false;
  private chatDialog: ChatDialog | null = null;
  private container: Phaser.GameObjects.Container | null = null;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private nameText: Phaser.GameObjects.Text | null = null;
  private imageKey: string;
  private mumbleText: Phaser.GameObjects.Text | null = null;
  private mumbleTimer: Phaser.Time.TimerEvent | null = null;
  private isChatting: boolean = false;

  private static readonly NAME_OFFSET_Y = -50;
  private static readonly MUMBLE_OFFSET_Y = -80;
  private static readonly MUMBLE_DURATION = { MIN: 5000, MAX: 8000 };
  private static readonly MUMBLE_GAP = { MIN: 3000, MAX: 8000 };

  constructor(name: string, scene: Phaser.Scene, persona?: string) {
    this.scene = scene;
    this.name = name;
    this.persona = persona || this.name;
    // TODO: make dynamic
    this.imageKey = DEFAULT_IMGKEY;
    // TODO: generate other properties of Librarian on construction (mumblings, friends, foes)
    this.manifest();
  }

  spawn(x: number, y: number): void {
    // Create sprite
    this.sprite = this.scene.add.sprite(0, 0, this.imageKey);
    this.sprite.setInteractive({ useHandCursor: true, pixelPerfect: true });
    this.sprite.setDepth(DEPTHS.LIBRARIAN.SPRITE);

    // NAME TEXT
    this.nameText = this.scene.add.text(0, Librarian.NAME_OFFSET_Y, this.name, {
      fontSize: "16px",
      fontFamily: "monospace",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 8, y: 4 },
    });
    this.nameText.setOrigin(0.5);
    this.nameText.setDepth(DEPTHS.LIBRARIAN.NAME_TEXT);
    this.encountered
      ? this.nameText.setVisible(true)
      : this.nameText.setVisible(false); // Hide name initially if not encountered

    // MUMBLES
    this.mumbleText = this.scene.add.text(0, Librarian.MUMBLE_OFFSET_Y, "", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 6, y: 3 },
      align: "center",
      fixedWidth: 200,
      wordWrap: { width: 190 },
    });

    this.mumbleText.setOrigin(0.5);
    this.mumbleText.setDepth(DEPTHS.LIBRARIAN.NAME_TEXT + 1);

    const textHeight = this.mumbleText.height;
    const adjustedOffset = Librarian.MUMBLE_OFFSET_Y - textHeight / 2;
    this.mumbleText.setY(adjustedOffset);

    this.mumbleText.setVisible(false);

    // Create container and add both elements
    this.container = this.scene.add.container(x, y, [
      this.sprite,
      this.nameText,
      this.mumbleText,
    ]);

    this.container.setDepth(DEPTHS.LIBRARIAN.CONTAINER);
    // Handle interaction
    this.sprite.on("pointerdown", () => {
      this.chat();
    });
  }
  setPosition(x: number, y: number): void {
    if (this.container) {
      this.container.setPosition(x, y);
    }
  }

  destroy(): void {
    this.stopMumbling();
    this.container?.destroy();
    // Container destruction will automatically cleanup child elements
  }

  async manifest() {
    this.updateSystemPrompt(this.persona);

    await this._generateMumblings();
    this.startMumbling();
  }

  private startMumbling(): void {
    if (this.mumblings.length === 0) return;

    const mumbleCycle = () => {
      if (!this.mumbleText || this.mumblings.length === 0 || this.isChatting)
        return;

      // If text is visible, hide it and schedule next show
      if (this.mumbleText.visible) {
        this.mumbleText.setVisible(false);
        const gap = Phaser.Math.Between(
          Librarian.MUMBLE_GAP.MIN,
          Librarian.MUMBLE_GAP.MAX
        );
        this.mumbleTimer = this.scene.time.delayedCall(gap, mumbleCycle);
      }
      // If text is hidden, show new mumble and schedule next hide
      else {
        const randomIndex = Math.floor(Math.random() * this.mumblings.length);
        this.mumbleText.setText(this.mumblings[randomIndex]);
        this.mumbleText.setVisible(true);
        const duration = Phaser.Math.Between(
          Librarian.MUMBLE_DURATION.MIN,
          Librarian.MUMBLE_DURATION.MAX
        );
        this.mumbleTimer = this.scene.time.delayedCall(duration, mumbleCycle);
      }
    };

    // Start the cycle
    mumbleCycle();
  }

  private stopMumbling(): void {
    if (this.mumbleText) {
      this.mumbleText.setVisible(false);
    }
    if (this.mumbleTimer) {
      this.mumbleTimer.destroy();
      this.mumbleTimer = null;
    }
  }

  mumble() {
    if (!this.mumblings.length) return;
    this.startMumbling();
  }

  async chat(): Promise<void> {
    if (!this.chatDialog) {
      this.stopMumbling();
      this.isChatting = true;

      this.chatDialog = new ChatDialog(
        this.systemPrompt,
        this.scene,
        () => this.onConversationEnd(),
        () => {
          if (!this.encountered) {
            this.encountered = true;
          }
          this.revealNameText();
        }
      );
    }

    this.chatDialog.show();
  }

  private revealNameText() {
    if (this.nameText) {
      this.nameText.setVisible(true);
    }
  }

  private onConversationEnd(): void {
    if (this.chatDialog) {
      this.chatDialog.hide();
    }
    this.isChatting = false;
    this.scene.time.delayedCall(3000, () => this.startMumbling());
  }

  updateSystemPrompt(persona: string) {
    this.systemPrompt = SYSTEM_PROMPT_PREAMBLE + persona;
  }

  getImage() {
    return this.image || DEFAULT_IMGKEY;
  }

  export() {}
  import() {}

  //TODO: getter/setter convention for props

  private async _generateMumblings() {
    // TODO - generate with LLM
    this.mumblings.push(
      "Where am I?",
      "People are trapped in history and history is trapped in them.",
      "Love takes off the masks that we fear we cannot live without and know we cannot live within."
    );
  }

  getContainer() {
    return this.container;
  }
  getSprite() {
    return this.sprite;
  }
  getNameText() {
    return this.nameText;
  }
}
