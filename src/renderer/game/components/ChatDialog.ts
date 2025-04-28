import { Message } from "../llm/ChatAdapter";
import { ChatManager } from "../llm/ChatManager";

export class ChatDialog {
  private element: HTMLElement;
  private messagesContainer!: HTMLElement;
  private input!: HTMLInputElement;
  private chatManager: ChatManager;
  private onClose?: () => void;
  private scene: Phaser.Scene;

  constructor(systemPrompt: string, scene: Phaser.Scene, onClose?: () => void) {
    this.scene = scene;
    this.chatManager = new ChatManager(systemPrompt);
    this.onClose = onClose;
    this.element = this.createDialog();
    document.getElementById("game")?.appendChild(this.element);
  }

  private createDialog(): HTMLElement {
    const dialog = document.createElement("div");
    dialog.className = "chat-dialog";

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.className = "chat-close-button";
    closeButton.textContent = "×";
    closeButton.onclick = () => {
      this.hide();
      this.onClose?.();
    };

    this.messagesContainer = document.createElement("div");
    this.messagesContainer.className = "chat-messages";

    const inputContainer = document.createElement("div");
    inputContainer.className = "chat-input-container";

    this.input = document.createElement("input");
    this.input.type = "text";
    this.input.placeholder = "Type your message...";

    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";

    inputContainer.appendChild(this.input);
    inputContainer.appendChild(sendButton);

    dialog.appendChild(closeButton);
    dialog.appendChild(this.messagesContainer);
    dialog.appendChild(inputContainer);

    const handleSend = async () => {
      const message = this.input.value.trim();
      if (message) {
        this.input.value = "";
        const response = await this.chatManager.sendMessage(message);
        this.updateMessages(this.chatManager.getHistory());
      }
    };

    sendButton.addEventListener("click", handleSend);
    this.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSend();
    });

    // Override phaser defaults to enable typing
    this.input.addEventListener("focus", () => {
      if (this.scene.input.keyboard) {
        // Disable Phaser's keyboard capture when chat is focused
        this.scene.input.keyboard.enabled = false;
        this.scene.input.keyboard.clearCaptures();
      }
    });

    this.input.addEventListener("blur", () => {
      if (this.scene.input.keyboard) {
        // Re-enable Phaser's keyboard when chat loses focus
        this.scene.input.keyboard.enabled = true;
      }
    });

    // Prevent game from handling these keys
    this.input.addEventListener("keydown", (e: KeyboardEvent) => {
      e.stopPropagation();
    });

    return dialog;
  }

  show(): void {
    this.element.style.display = "flex";
    this.input.focus();
  }

  hide(): void {
    this.element.style.display = "none";
  }

  private updateMessages(messages: Message[]): void {
    this.messagesContainer.innerHTML = "";
    messages.forEach((msg) => {
      const msgElement = document.createElement("div");
      msgElement.className = `chat-message ${msg.role}`;
      msgElement.textContent = msg.content;
      this.messagesContainer.appendChild(msgElement);
    });
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  updateSystemPrompt(newPrompt: string): void {
    this.chatManager.updateSystemPrompt(newPrompt);
  }
}
