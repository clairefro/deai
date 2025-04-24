export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  content: string;
  tokensUsed: number;
}

export interface ChatAdapter {
  sendMessage(messages: Message[]): Promise<ChatResponse>;
}
