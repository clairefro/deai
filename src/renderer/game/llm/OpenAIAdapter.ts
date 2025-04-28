import { ConfigSettings } from "../../../shared/Config";
import { ChatResponse, GenericChatAdapterI, Message } from "./ChatAdapter";

export class OpenAIAdapter implements GenericChatAdapterI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "https://api.openai.com/v1";
  }

  async sendMessage(
    messages: Message[],
    config: ConfigSettings
  ): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKeys.openai}`,
      },
      body: JSON.stringify({
        model: config.llm.openaiModel,
        messages,
      }),
    });

    const data = await response.json();

    return {
      content: data.choices[0].message.content.trim(),
      tokensUsed: data.usage.total_tokens,
    };
  }
}
