import { Message } from "../llm/ChatAdapter";
import { ChatManager } from "../llm/ChatManager";
import { ChatLoadingIndicator } from "./ChatLoadingIndicator";

export class ChatDialog {
  private readonly chatManager: ChatManager;

  // state
  private hasResponded = false;

  // HTML Elements
  private readonly element: HTMLElement;
  private readonly messagesContainer: HTMLElement;
  private titleElement!: HTMLElement;
  private readonly input: HTMLTextAreaElement;
  private readonly loadingIndicator: ChatLoadingIndicator;

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

    const titleContainer = document.createElement("div");
    titleContainer.className = "chat-title";
    this.titleElement = document.createElement("h2");
    this.titleElement.textContent = "?";
    titleContainer.appendChild(this.titleElement);

    const messagesContainer = document.createElement("div");
    messagesContainer.className = "chat-messages";
    const mumbleContainer = document.createElement("div");
    mumbleContainer.className = "mumble-container";

    messagesContainer.appendChild(mumbleContainer);
    messagesContainer.appendChild(this.loadingIndicator.getElement());

    const inputContainer = this.createInputContainer();
    const closeButton = this.createCloseButton();

    dialog.appendChild(closeButton);
    dialog.appendChild(titleContainer);
    dialog.appendChild(messagesContainer);
    dialog.appendChild(inputContainer);

    return {
      dialog,
      messages: messagesContainer,
      input: inputContainer.querySelector("textarea")!,
    };
  }

  updateTitle(name: string): void {
    if (this.titleElement) {
      this.titleElement.textContent = name;
    }
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
    this.setupClickPrevention();
  }

  private setupClickPrevention(): void {
    this.element.addEventListener("mousedown", (e) => e.stopPropagation());
    this.element.addEventListener("click", (e) => e.stopPropagation());
    this.element.addEventListener("pointerdown", (e) => e.stopPropagation());
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
    this.scrollToBottom();
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

  private updateMessages(messages: MessageWithMeta[]): void {
    const loadingElement = this.loadingIndicator.getElement();
    const mumbleContainer =
      this.messagesContainer.querySelector(".mumble-container");

    // Remove existing messages
    const children = Array.from(this.messagesContainer.children);
    children.forEach((child) => {
      if (child !== mumbleContainer && child !== loadingElement) {
        child.remove();
      }
    });

    // Only display non-hidden messages
    const visibleMessages = messages.filter((msg) => !(msg as any).hidden);
    visibleMessages.forEach((msg) => {
      const msgElement = document.createElement("div");
      msgElement.className = `chat-message ${msg.role}`;
      msgElement.innerText = msg.content;
      this.messagesContainer.insertBefore(msgElement, loadingElement);
    });

    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    // Force a reflow to ensure new content is measured
    this.messagesContainer.offsetHeight;

    // Double RAF to ensure DOM is fully updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.messagesContainer.scrollTo({
          top: this.messagesContainer.scrollHeight,
          behavior: "smooth",
        });
      });
    });
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

  addLastMumble(mumble: string): void {
    // add mumble as initial chat history
    this.chatManager.setInitialHistory([
      {
        role: "assistant",
        content: `*${mumble}*`,
        hidden: true,
      },
    ]);

    const mumbleContainer =
      this.messagesContainer.querySelector(".mumble-container");
    if (!mumbleContainer) return;

    // Clear existing mumble if any
    mumbleContainer.innerHTML = "";

    const mumbleEl = document.createElement("div");
    mumbleEl.className = "last-mumble";
    mumbleEl.textContent = mumble;
    mumbleContainer.appendChild(mumbleEl);
  }
}
