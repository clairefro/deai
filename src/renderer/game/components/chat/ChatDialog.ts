import { ChatManager } from "../../llm/ChatManager";
import { ChatDialogUiManager } from "./ChatDialogUiManager";
import { TokensBar } from "../TokensBar";

export class ChatDialog {
  protected ui!: ChatDialogUiManager;
  protected chatManager!: ChatManager;
  private hasResponded = false;

  constructor(
    systemPrompt: string,
    private readonly scene: Phaser.Scene,
    private readonly onClose?: () => void,
    private readonly onFirstResponse?: () => void
  ) {
    this.chatManager = new ChatManager(systemPrompt);
    this.ui = new ChatDialogUiManager(
      () => this.handleClose(),
      (message) => this.handleMessage(message),
      this.scene
    );
  }

  async handleMessage(message: string): Promise<void> {
    this.ui.showLoading();

    try {
      const response = await this.chatManager.sendMessage(message);

      // Handle first response
      if (!this.hasResponded) {
        this.hasResponded = true;
        this.onFirstResponse?.();
      }

      TokensBar.getInstance()?.addTokens(response.tokensUsed);
      this.ui.updateMessages(this.chatManager.getHistory());
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      this.ui.hideLoading();
    }
  }

  private handleClose(): void {
    this.hide();
    this.onClose?.();
  }

  show(): void {
    this.ui.show();
  }

  hide(): void {
    this.ui.hide();
  }

  updateTitle(name: string): void {
    this.ui.updateTitle(name);
  }

  updateSystemPrompt(prompt: string): void {
    this.chatManager.updateSystemPrompt(prompt);
  }

  addLastMumble(mumble: string): void {
    this.chatManager.setInitialHistory([
      {
        role: "assistant",
        content: `*${mumble}*`,
        hidden: true,
      },
    ]);
    this.ui.showMumble(mumble);
  }
}
