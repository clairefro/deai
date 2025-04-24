import { ChatAdapter, ChatResponse, Message } from "./ChatAdapter";
import { Config } from "../../../shared/Config";

export class OllamaAdapter implements ChatAdapter {
  private baseUrl: string;

  // TODO: MAKE OLLAMA URL CONFIGURABLE
  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async sendMessage(messages: Message[]): Promise<ChatResponse> {
    const config = await window.electronAPI.getConfig();

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.llm.model,
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
