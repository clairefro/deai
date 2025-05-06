import {
  ChatAdapter,
  ChatResponse,
  Message,
  MessageWithMeta,
} from "./ChatAdapter";
import { MessageOptions } from "./types";

export class ChatManager {
  private messageHistory: Message[] = [];
  private systemPrompt: string;
  private initialHistory: MessageWithMeta[] = [];

  constructor(systemPrompt: string, initialHistory: Message[] = []) {
    this.systemPrompt = systemPrompt;
    this.initialHistory = initialHistory;
  }

  stripMetaFromMessages(messagesWithMeta: MessageWithMeta[]): Message[] {
    if (!messagesWithMeta.length) return [];
    return messagesWithMeta.map((msg) => {
      const { role, content } = msg;
      // Keep only 'role' and 'content' properties
      return { role, content };
    }) as Message[];
  }

  async sendMessage(
    message: string,
    options: MessageOptions = {}
  ): Promise<ChatResponse> {
    const userMessage: MessageWithMeta = {
      role: options.role || "user",
      content: message,
      ...(options.speaker ? { speaker: options.speaker } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    };

    try {
      const adapter = await ChatAdapter.getInstance();

      const response = await adapter.sendMessage([
        { role: "system", content: this.systemPrompt },
        ...this.stripMetaFromMessages(this.initialHistory),
        ...this.messageHistory,
        userMessage,
      ]);

      // Store message with full metadata
      const responseMessage: MessageWithMeta = {
        role: "assistant",
        content: response.content,
        ...(options.speaker ? { speaker: options.speaker } : {}),
        ...(options.metadata ? { metadata: options.metadata } : {}),
      };

      this.messageHistory.push(userMessage);
      this.messageHistory.push(responseMessage);

      // Keep last N messages
      const maxHistory = 10;
      if (this.messageHistory.length > maxHistory) {
        this.messageHistory = this.messageHistory.slice(-maxHistory);
      }

      return {
        ...response,
        metadata: options.metadata,
      };
    } catch (error) {
      console.error("Chat error:", error);
      // TODO: make this more clover
      return {
        content: "I apologize, I'm having trouble responding right now.",
        tokensUsed: 0,
      };
    }
  }

  clearHistory(): void {
    this.messageHistory = [];
  }

  setInitialHistory(history: MessageWithMeta[]): void {
    this.initialHistory = history;
  }

  getHistory(): MessageWithMeta[] {
    return [...this.initialHistory, ...this.messageHistory];
  }

  updateSystemPrompt(newPrompt: string): void {
    this.systemPrompt = newPrompt;
  }
}
