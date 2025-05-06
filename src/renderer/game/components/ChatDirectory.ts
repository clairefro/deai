import { Librarian } from "../models/Librarian";
import { GroupChatDialog } from "./chat/GroupChatDialog";
import { ChatDialog } from "./chat/ChatDialog";
import { LibrarianData } from "../../../shared/types/LibrarianData";

export class ChatDirectory {
  private element: HTMLElement;
  private listContainer: HTMLElement;
  private chatButton: HTMLButtonElement;
  private activeChat: ChatDialog | GroupChatDialog | null = null;
  private encounterCache: Map<string, Librarian> = new Map();
  private tab: HTMLElement;

  constructor(private readonly scene: Phaser.Scene) {
    const elements = this.createDirectoryElement();
    this.element = elements.directory;
    this.listContainer = elements.listContainer;
    this.chatButton = elements.chatButton;
    this.tab = elements.tab;
    this.attachToGame();
    this.setupEventListeners();
  }

  private createDirectoryElement(): {
    directory: HTMLElement;
    listContainer: HTMLElement;
    chatButton: HTMLButtonElement;
    tab: HTMLElement;
  } {
    // Create elements
    const directory = document.createElement("div");
    const tab = document.createElement("div");
    const tabLabel = document.createElement("span");
    const content = document.createElement("div");
    const listContainer = document.createElement("div");
    const actions = document.createElement("div");
    const chatButton = document.createElement("button");

    // Set classes
    directory.className = "chat-directory";
    tab.className = "chat-directory-tab";
    tabLabel.className = "tab-label";
    content.className = "chat-directory-content";
    listContainer.className = "librarian-list";
    actions.className = "chat-directory-actions";
    chatButton.className = "chat-button";

    // Set content
    tabLabel.textContent = "Directory";
    chatButton.textContent = "Start Group Chat (NOT YET :) )";
    chatButton.disabled = true;

    // Build hierarchy
    tab.appendChild(tabLabel);
    actions.appendChild(chatButton);
    content.appendChild(listContainer);
    content.appendChild(actions);
    directory.appendChild(tab);
    directory.appendChild(content);

    return {
      directory,
      listContainer,
      chatButton,
      tab,
    };
  }

  private setupEventListeners(): void {
    // Use stored tab element from createDirectoryElement
    this.tab.addEventListener("click", () => {
      this.element.classList.toggle("open");
      if (this.element.classList.contains("open")) {
        this.refreshLibrarianList();
      }
    });

    // Use stored chatButton element
    this.chatButton.addEventListener("click", async () => {
      //   const selected = this.getSelectedLibrarians();
      // TEMP
      const selectedData = await window.electronAPI.getEncounteredLibrarians();
      const selected = selectedData.map(
        (data) => new Librarian({ data, scene: this.scene })
      );
      if (selected.length === 0) return;

      if (selected.length === 1) {
        this.startSingleChat(selected[0]);
      } else {
        this.startGroupChat(selected);
      }

      this.element.classList.remove("open");
    });

    // Add input event listener to listContainer for checkbox changes
    this.listContainer.addEventListener("change", (event) => {
      if ((event.target as HTMLElement).matches('input[type="checkbox"]')) {
        this.updateChatButtonState();
      }
    });
  }

  private updateChatButtonState(): void {
    // Now we can use the stored button directly
    const selected = this.getSelectedLibrarians();
  }

  private async refreshLibrarianList(): Promise<void> {
    try {
      console.log("Refreshing librarian list...");
      const encountered = await window.electronAPI.getEncounteredLibrarians();
      console.log("Encountered librarians:", encountered);

      // Clear and rebuild the cache
      this.encounterCache.clear();
      encountered.forEach((data) => {
        const librarian = new Librarian({
          ...data,
          scene: this.scene,
        });
        // Add to cache - this line was missing
        this.encounterCache.set(data.id, librarian);
        console.log(`Added to cache: ${data.id} -> ${librarian.getName()}`);
      });

      console.log("Cache contents:", this.encounterCache);

      // Update the UI
      this.updateLibrarianList(Array.from(this.encounterCache.values()));
    } catch (err) {
      console.error("Failed to load librarians:", err);
    }
  }

  private getSelectedLibrarians(): Librarian[] {
    const checkboxes = this.listContainer.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]:checked'
    );

    const selected = Array.from(checkboxes)
      .map((cb) => this.encounterCache.get(cb.value))
      .filter((lib): lib is Librarian => lib !== undefined);
    console.log({ selected });

    console.log("Selected librarians:", selected);
    return selected;
  }

  updateLibrarianList(librarians: Librarian[]): void {
    this.listContainer.innerHTML = "";

    if (librarians.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "librarian-empty-state";
      emptyMessage.textContent = "Librarians you encounter will show up here";
      this.listContainer.appendChild(emptyMessage);
      this.chatButton.disabled = true;
      return;
    }

    librarians.forEach((librarian) => {
      // Create elements
      const item = document.createElement("div");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      const span = document.createElement("span");

      // Set properties
      item.className = "librarian-item";
      checkbox.type = "checkbox";
      checkbox.value = librarian.getId();
      span.textContent = librarian.getName();

      // Add change listener directly to checkbox
      checkbox.addEventListener("change", () => {
        console.log("Checkbox changed"); // Debug log
        const selectedCount = this.listContainer.querySelectorAll(
          'input[type="checkbox"]:checked'
        ).length;
        console.log("Selected count:", selectedCount); // Debug log
        this.chatButton.disabled = true;
        // this.chatButton.disabled = selectedCount === 0;
        this.updateChatButtonState();
      });

      // Build hierarchy
      label.appendChild(checkbox);
      label.appendChild(span);
      item.appendChild(label);
      this.listContainer.appendChild(item);
    });

    // Initial button state
    this.chatButton.disabled = true;
  }

  private startSingleChat(librarian: Librarian): void {
    librarian.chat();
  }

  private startGroupChat(librarians: Librarian[]): void {
    this.activeChat = new GroupChatDialog(
      this.scene,
      "Player",
      () => (this.activeChat = null)
    );

    librarians.forEach((librarian) => {
      librarian.joinGroupChat(this.activeChat as GroupChatDialog);
    });

    this.activeChat.show();
  }

  private attachToGame(): void {
    const gameContainer = document.getElementById("game");
    if (gameContainer) {
      gameContainer.appendChild(this.element);
    }
  }
}
