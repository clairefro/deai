import { OpenAIAdapter } from "./OpenAIAdapter";
import { OllamaAdapter } from "./OllamaAdapter";
import { AppConfig } from "../../../shared/Config";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface MessageWithMeta extends Message {
  hidden?: boolean;
}

export interface ChatResponse {
  content: string;
  tokensUsed: number;
}

export interface GenericChatAdapterI {
  sendMessage: (
    messages: Message[],
    config: AppConfig
  ) => Promise<ChatResponse>;
}

export class ChatAdapter {
  private static instance: ChatAdapter | null = null;
  private openaiAdapter: OpenAIAdapter;
  private ollamaAdapter: OllamaAdapter;

  constructor() {
    this.openaiAdapter = new OpenAIAdapter();
    this.ollamaAdapter = new OllamaAdapter();
  }

  static async getInstance(): Promise<ChatAdapter> {
    if (!this.instance) {
      this.instance = new ChatAdapter();
    }
    return this.instance;
  }

  async sendMessage(messages: Message[]): Promise<ChatResponse> {
    try {
      const config = await window.electronAPI.getConfig();

      switch (config.llm.platform) {
        case "openai":
          return this.openaiAdapter.sendMessage(messages, config);
        case "ollama":
          return this.ollamaAdapter.sendMessage(messages, config);
        default:
          throw new Error(`Unsupported LLM platform: ${config.llm.platform}`);
      }
    } catch (error) {
      // TODO: comprehensive error handling
      console.error("ChatAdapter error:", error);
      throw error;
    }
  }

  async getOneShot(
    systemPrompt: string,
    prompt: string,
    fallbackResponse: string
  ): Promise<string> {
    try {
      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ];

      const response = await this.sendMessage(messages);
      return response.content;
    } catch (error) {
      console.error("OneShot generation error:", error);
      return fallbackResponse;
    }
  }
}
