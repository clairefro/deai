import { ChatAdapter, ChatResponse, Message } from "./ChatAdapter";

export class OpenAIAdapter implements ChatAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(messages: Message[]): Promise<ChatResponse> {
    // TODO:
    const config = await window.electronAPI.getConfig();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKeys.openai}`,
      },
      body: JSON.stringify({
        model: config.llm.model,
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
