import { ChatManager } from "../../llm/ChatManager";
import { ChatResponse } from "../../llm/ChatAdapter";
import { MessageWithMeta } from "../../llm/ChatAdapter";

export class ChatHistoryManager {
  private readonly chatManager: ChatManager;
  private hasResponded = false;

  constructor(
    systemPrompt: string,
    private readonly onFirstResponse?: () => void
  ) {
    this.chatManager = new ChatManager(systemPrompt);
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    const response = await this.chatManager.sendMessage(message);

    if (!this.hasResponded) {
      this.hasResponded = true;
      this.onFirstResponse?.();
    }

    return response;
  }

  addMumble(mumble: string): void {
    this.chatManager.setInitialHistory([
      {
        role: "assistant",
        content: `*${mumble}*`,
        hidden: true,
      },
    ]);
  }

  getHistory(): MessageWithMeta[] {
    return this.chatManager.getHistory();
  }

  updateSystemPrompt(prompt: string): void {
    this.chatManager.updateSystemPrompt(prompt);
  }
}
