import ghost from "../../assets/ghost.png";
import { ChatDialog } from "../components/ChatDialog";

// TODO
const SYSTEM_PROMPT_PREAMBLE = `You are an AI Simulacra of a persona, wandering in the Library of Babel. Chat with the user as this persona. Your persona: `;

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
  private static readonly NAME_OFFSET_Y = -50;
  private imageKey: string;

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

    // Add name text above sprite
    this.nameText = this.scene.add.text(0, Librarian.NAME_OFFSET_Y, this.name, {
      fontSize: "16px",
      fontFamily: "monospace",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 8, y: 4 },
    });
    this.nameText.setOrigin(0.5);

    // Create container and add both elements
    this.container = this.scene.add.container(x, y, [
      this.sprite,
      this.nameText,
    ]);

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
    this.container?.destroy();
    // Container destruction will automatically cleanup child elements
  }

  async manifest() {
    this.updateSystemPrompt(this.persona);

    await this._generateMumblings();
  }

  mumble() {
    if (!this.mumblings.length) return;
    // TODO: speech bubble
    // TODO: mumble on intervals
    // TODO: remove mumbling after a time
  }

  async chat(): Promise<void> {
    if (!this.chatDialog) {
      this.chatDialog = new ChatDialog(this.systemPrompt, this.scene, () =>
        this.onConversationEnd()
      );
    }

    if (!this.encountered) {
      this.encountered = true;
    }

    this.chatDialog.show();
  }

  private onConversationEnd(): void {
    if (this.chatDialog) {
      this.chatDialog.hide();
    }
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
    this.mumblings.push("Where am I?", "Who am I");
  }
}
