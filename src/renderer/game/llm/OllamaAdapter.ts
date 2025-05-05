import { AppConfig } from "../../../shared/Config";
import { ChatResponse, Message, GenericChatAdapterI } from "./ChatAdapter";
export class OllamaAdapter implements GenericChatAdapterI {
  private baseUrl: string;

  // TODO: USE OLLAMA JS SDK?
  // TODO: MAKE OLLAMA URL CONFIGURABLE
  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async sendMessage(
    messages: Message[],
    config: AppConfig
  ): Promise<ChatResponse> {
    const opts = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.llm.ollamaModel,
        messages,
        stream: false,
      }),
    };

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, opts);

    const data = await response.json();

    return {
      content: data.choices[0].message.content.trim(),
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }
}
