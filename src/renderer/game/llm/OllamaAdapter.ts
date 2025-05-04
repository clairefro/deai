import { AppConfig } from "../../../shared/Config";
import { ChatResponse, Message, GenericChatAdapterI } from "./ChatAdapter";
import { Ollama } from "ollama";
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
    console.log("ollama baseUrl", this.baseUrl);

    const opts = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // model: config.llm.ollamaModel,
        // TODO: FIX MODEL SETTIGN CONFIG
        model: "gemma3:latest",
        messages,
        stream: false,
      }),
    };
    console.log({ opts });
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // model: config.llm.ollamaModel,
        // TODO: FIX MODEL SETTIGN CONFIG
        model: "gemma3:latest",
        messages,
        stream: false,
      }),
    });

    const data = await response.json();

    return {
      content: data.choices[0].message.content.trim(),
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }
}
