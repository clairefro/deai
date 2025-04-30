import { Message } from "../llm/ChatAdapter";
import { ChatManager } from "../llm/ChatManager";
import { ChatLoadingIndicator } from "./ChatLoadingIndicator";

export class ChatDialog {
  private readonly element: HTMLElement;
  private readonly messagesContainer: HTMLElement;
  private readonly input: HTMLTextAreaElement;
  private readonly chatManager: ChatManager;
  private readonly loadingIndicator: ChatLoadingIndicator;
  private hasResponded = false;

  constructor(
    systemPrompt: string,
    private readonly scene: Phaser.Scene,
    private readonly onClose?: () => void,
    private readonly onFirstResponse?: () => void
  ) {
    this.chatManager = new ChatManager(systemPrompt);
    this.loadingIndicator = new ChatLoadingIndicator();

    const elements = this.createUIElements();
    this.element = elements.dialog;
    this.messagesContainer = elements.messages;
    this.input = elements.input;

    this.setupEventListeners();
    this.attachToDOM();
  }

  private createUIElements() {
    const dialog = document.createElement("div");
    dialog.className = "chat-dialog";

    const messagesContainer = document.createElement("div");
    messagesContainer.className = "chat-messages";
    messagesContainer.appendChild(this.loadingIndicator.getElement());

    const inputContainer = this.createInputContainer();
    const closeButton = this.createCloseButton();

    dialog.appendChild(closeButton);
    dialog.appendChild(messagesContainer);
    dialog.appendChild(inputContainer);

    return {
      dialog,
      messages: messagesContainer,
      input: inputContainer.querySelector("textarea")!,
    };
  }

  private createInputContainer(): HTMLElement {
    const container = document.createElement("div");
    container.className = "chat-input-container";

    const input = document.createElement("textarea");
    input.placeholder = "What's on your mind...";
    input.rows = 1;
    input.className = "chat-input";

    const sendButton = document.createElement("button");
    sendButton.textContent = "Send";
    sendButton.className = "chat-send-button";

    container.appendChild(input);
    container.appendChild(sendButton);

    return container;
  }

  private createCloseButton(): HTMLElement {
    const button = document.createElement("button");
    button.className = "chat-close-button";
    button.textContent = "×";
    button.onclick = () => {
      this.hide();
      this.onClose?.();
    };
    return button;
  }

  private setupEventListeners(): void {
    this.setupInputEvents();
    this.setupPhaserKeyboardHandling();
  }

  private setupInputEvents(): void {
    this.input.addEventListener("input", () => this.autoResizeTextarea());

    const sendButton =
      this.input.parentElement?.querySelector(".chat-send-button");
    sendButton?.addEventListener("click", () => this.handleSend());

    this.input.addEventListener("keydown", (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
  }

  private setupPhaserKeyboardHandling(): void {
    this.input.addEventListener("focus", () => {
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = false;
        this.scene.input.keyboard.clearCaptures();
      }
    });

    this.input.addEventListener("blur", () => {
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = true;
      }
    });
  }

  private async handleSend(): Promise<void> {
    const message = this.input.value.trim();
    if (!message) return;

    this.resetInput();
    await this.sendMessage(message);
  }

  private resetInput(): void {
    this.input.value = "";
    this.input.style.height = "auto";
  }

  private async sendMessage(message: string): Promise<void> {
    this.showUserMessage(message);
    this.loadingIndicator.show();
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    try {
      await this.handleAIResponse(message);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      this.loadingIndicator.hide();
    }
  }

  private showUserMessage(message: string): void {
    const currentHistory = this.chatManager.getHistory();
    this.updateMessages([
      ...currentHistory,
      { role: "user", content: message },
    ]);
  }

  private async handleAIResponse(message: string): Promise<void> {
    const response = await this.chatManager.sendMessage(message);

    if (!this.hasResponded) {
      this.handleFirstResponse();
    }

    this.updateMessages(this.chatManager.getHistory());
  }
  private handleFirstResponse() {
    this.hasResponded = true;
    this.onFirstResponse?.();
  }

  private updateMessages(messages: Message[]): void {
    const loadingElement = this.loadingIndicator.getElement();

    while (this.messagesContainer.firstChild !== loadingElement) {
      this.messagesContainer.firstChild?.remove();
    }

    messages.forEach((msg) => {
      const msgElement = document.createElement("div");
      msgElement.className = `chat-message ${msg.role}`;
      msgElement.innerText = msg.content;
      this.messagesContainer.insertBefore(msgElement, loadingElement);
    });

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private autoResizeTextarea(): void {
    this.input.style.height = "auto";
    this.input.style.height = `${Math.min(this.input.scrollHeight, 150)}px`;
  }

  private attachToDOM(): void {
    document.getElementById("game")?.appendChild(this.element);
  }

  show(): void {
    this.element.style.display = "flex";
    this.input.focus();
  }

  hide(): void {
    this.element.style.display = "none";
  }

  updateSystemPrompt(newPrompt: string): void {
    this.chatManager.updateSystemPrompt(newPrompt);
  }
}
