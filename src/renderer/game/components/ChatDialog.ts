import { Message } from "../llm/ChatAdapter";
import { ChatManager } from "../llm/ChatManager";

export class ChatDialog {
  private element: HTMLElement;
  private messagesContainer!: HTMLElement;
  private input!: HTMLTextAreaElement;
  private chatManager: ChatManager;
  private onClose?: () => void;
  private onFirstResponse?: () => void;
  private hasResponded = false;
  private scene: Phaser.Scene;
  private loadingIndicator: HTMLElement;

  constructor(
    systemPrompt: string,
    scene: Phaser.Scene,
    onClose?: () => void,
    onFirstResponse?: () => void
  ) {
    this.scene = scene;
    this.chatManager = new ChatManager(systemPrompt);
    this.onClose = onClose;
    this.onFirstResponse = onFirstResponse;
    this.element = this.createDialog();
    document.getElementById("game")?.appendChild(this.element);

    this.loadingIndicator = this.createLoadingIndicator();
    this.messagesContainer.appendChild(this.loadingIndicator);
    this.loadingIndicator.style.display = "none";
  }

  private createLoadingIndicator(): HTMLElement {
    const indicator = document.createElement("div");
    indicator.className = "chat-loading";
    indicator.textContent = "...";
    return indicator;
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

    this.input = document.createElement("textarea");
    this.input.placeholder = "What's on your mind...";
    this.input.rows = 1;
    this.input.addEventListener("input", this.autoResizeTextarea.bind(this));

    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";

    inputContainer.appendChild(this.input);
    inputContainer.appendChild(sendButton);

    dialog.appendChild(closeButton);
    dialog.appendChild(this.messagesContainer);
    dialog.appendChild(inputContainer);

    const handleSend = async () => {
      const message = this.input.value.trim();
      if (!message) return;

      // Clear input and show user message immediately
      this.input.value = "";
      this.input.style.height = "auto";
      const currentHistory = this.chatManager.getHistory();
      this.updateMessages([
        ...currentHistory,
        { role: "user", content: message },
      ]);

      // Show loading indicator
      this.loadingIndicator.style.display = "block";
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

      try {
        // Wait for AI response
        const response = await this.chatManager.sendMessage(message);

        // Handle first response
        if (!this.hasResponded) {
          this.hasResponded = true;
          this.onFirstResponse?.();
        }

        this.updateMessages(this.chatManager.getHistory());
      } catch (err) {
        console.error(err);
        // Optionally show error message to user
      } finally {
        // Hide loading indicator
        this.loadingIndicator.style.display = "none";
      }
    };

    sendButton.addEventListener("click", handleSend);
    this.input.addEventListener("keydown", (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
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

  private autoResizeTextarea(): void {
    const textarea = this.input;
    // Reset height to auto to get correct scrollHeight
    textarea.style.height = "auto";
    // Set new height based on content
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`; // Max height 150px
  }

  private updateMessages(messages: Message[]): void {
    // Clear messages but preserve loading indicator
    while (this.messagesContainer.firstChild !== this.loadingIndicator) {
      this.messagesContainer.firstChild?.remove();
    }

    // Add all messages before the loading indicator
    messages.forEach((msg) => {
      const msgElement = document.createElement("div");
      msgElement.className = `chat-message ${msg.role}`;
      msgElement.textContent = msg.content;
      this.messagesContainer.insertBefore(msgElement, this.loadingIndicator);
    });

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  updateSystemPrompt(newPrompt: string): void {
    this.chatManager.updateSystemPrompt(newPrompt);
  }
}
