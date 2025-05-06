import { ChatLoadingIndicator } from "./ChatLoadingIndicator";
import { MessageWithMeta } from "../../llm/ChatAdapter";

const DEFAULT_TITLE = "?";

export class ChatDialogUiManager {
  private readonly dialog: HTMLElement;
  private readonly messagesContainer: HTMLElement;
  private readonly titleElement: HTMLElement;
  private readonly input: HTMLTextAreaElement;
  private readonly loadingIndicator: ChatLoadingIndicator;
  private readonly mumbleContainer: HTMLElement;

  constructor(
    private readonly onClose: () => void,
    private readonly onSend: (message: string) => void,
    private readonly scene: Phaser.Scene
  ) {
    const els = this.createUIElements();
    this.dialog = els.dialog;
    this.messagesContainer = els.messagesContainer;
    this.titleElement = els.titleElement;
    this.input = els.input;
    this.mumbleContainer = els.mumbleContainer;
    this.loadingIndicator = new ChatLoadingIndicator();

    this.messagesContainer.appendChild(this.loadingIndicator.getElement());

    this.setupEventListeners();
    this.attachToDOM();
  }

  private createUIElements() {
    const dialog = document.createElement("div");
    const titleContainer = document.createElement("div");
    const titleElement = document.createElement("h2");
    const messagesContainer = document.createElement("div");
    const mumbleContainer = document.createElement("div");
    const inputContainer = document.createElement("div");
    const input = document.createElement("textarea");
    const sendButton = document.createElement("button");
    const closeButton = document.createElement("button");

    // Set classes
    dialog.className = "chat-dialog";
    titleContainer.className = "chat-title";
    messagesContainer.className = "chat-messages";
    mumbleContainer.className = "mumble-container";
    inputContainer.className = "chat-input-container";
    input.className = "chat-input";
    sendButton.className = "chat-send-button";
    closeButton.className = "chat-close-button";

    // Configure elements
    input.placeholder = "What's on your mind...";
    input.rows = 1;
    titleElement.textContent = DEFAULT_TITLE;
    sendButton.textContent = "Send";
    closeButton.textContent = "×";
    closeButton.onclick = () => {
      this.hide();
      this.onClose?.();
    };

    // Build hierarchy
    titleContainer.appendChild(titleElement);
    messagesContainer.appendChild(mumbleContainer);
    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);

    dialog.appendChild(closeButton);
    dialog.appendChild(titleContainer);
    dialog.appendChild(messagesContainer);
    dialog.appendChild(inputContainer);

    return {
      dialog,
      messagesContainer,
      titleElement,
      input,
      mumbleContainer,
    };
  }

  private setupEventListeners(): void {
    this.setupInputEvents();
    this.setupPhaserKeyboardHandling();
    this.setupClickPrevention();
  }

  private setupClickPrevention(): void {
    this.dialog.addEventListener("mousedown", (e) => e.stopPropagation());
    this.dialog.addEventListener("click", (e) => e.stopPropagation());
    this.dialog.addEventListener("pointerdown", (e) => e.stopPropagation());
  }

  private setupInputEvents(): void {
    this.input.addEventListener("input", () => this.autoResizeTextarea());

    const sendButton = this.dialog.querySelector(".chat-send-button");
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

  private handleSend(): void {
    const message = this.input.value.trim();
    if (!message) return;

    // add user message immediately
    this.addMessage({
      role: "user",
      content: message,
    });

    // Clear input and resize
    this.input.value = "";
    this.autoResizeTextarea();

    // Send to chat handler
    this.onSend(message);
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
    this.input.style.height = `${this.input.scrollHeight}px`;
  }

  private attachToDOM(): void {
    document.getElementById("game")?.appendChild(this.dialog);
  }

  addMessage(message: MessageWithMeta): void {
    const msgElement = document.createElement("div");
    msgElement.className = `chat-message ${message.role}`;

    // Add speaker name if provided
    if (message.speaker) {
      const speakerEl = document.createElement("div");
      speakerEl.className = "chat-message-speaker";
      speakerEl.textContent = message.speaker;
      msgElement.appendChild(speakerEl);
    }

    const contentEl = document.createElement("div");
    contentEl.className = "chat-message-content";
    contentEl.innerText = message.content;
    msgElement.appendChild(contentEl);

    this.messagesContainer.insertBefore(
      msgElement,
      this.loadingIndicator.getElement()
    );

    this.scrollToBottom();
  }
  showMumble(mumble: string): void {
    this.mumbleContainer.innerHTML = "";

    const mumbleEl = document.createElement("div");
    mumbleEl.className = "last-mumble";
    mumbleEl.textContent = mumble;
    this.mumbleContainer.appendChild(mumbleEl);
  }

  clearMumble(): void {
    this.mumbleContainer.innerHTML = "";
  }

  updateTitle(name: string): void {
    this.titleElement.textContent = name;
  }

  updateMessages(messages: MessageWithMeta[]): void {
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

  showLoading(text?: string): void {
    this.loadingIndicator.show(text);
  }

  hideLoading(): void {
    this.loadingIndicator.hide();
  }

  show(): void {
    this.dialog.style.display = "flex";
    this.input.focus();
  }

  hide(): void {
    this.dialog.style.display = "none";
  }
}
