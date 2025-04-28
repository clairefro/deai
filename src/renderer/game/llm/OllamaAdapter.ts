import { ConfigSettings } from "../../../shared/Config";
import { ChatResponse, Message, GenericChatAdapterI } from "./ChatAdapter";

export class OllamaAdapter implements GenericChatAdapterI {
  private baseUrl: string;

  // TODO: MAKE OLLAMA URL CONFIGURABLE
  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async sendMessage(
    messages: Message[],
    config: ConfigSettings
  ): Promise<ChatResponse> {
    // TODO: Check for Ollama model
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.llm.ollamaModel,
        messages,
      }),
    });

    const data = await response.json();

    return {
      content: data.choices[0].message.content.trim(),
      tokensUsed: data.usage?.total_tokens || 0, // TODO: check that Ollama tokens work
    };
  }
}
