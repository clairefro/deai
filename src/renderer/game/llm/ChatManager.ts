import { ChatAdapter, Message, MessageWithMeta } from "./ChatAdapter";

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

  async sendMessage(message: string): Promise<string> {
    const userMessage: Message = {
      role: "user",
      content: message,
    };

    try {
      const adapter = await ChatAdapter.getInstance();

      const response = await adapter.sendMessage([
        { role: "system", content: this.systemPrompt },
        ...this.stripMetaFromMessages(this.initialHistory),
        ...this.messageHistory,
        userMessage,
      ]);
      // Update conversation history
      this.messageHistory.push(userMessage);
      this.messageHistory.push({
        role: "assistant",
        content: response.content,
      });

      // TODO: adjust
      // Keep last N messages
      const maxHistory = 10;
      if (this.messageHistory.length > maxHistory) {
        this.messageHistory = this.messageHistory.slice(-maxHistory);
      }

      return response.content;
    } catch (error) {
      console.error("Chat error:", error);
      // TODO: make this more clover
      return "I apologize, I'm having trouble responding right now.";
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
