import { debounce } from "../../../shared/util/debounce";
import { TeetorTotter } from "./TeetorTotter";

export class Notebook {
  private element: HTMLElement;
  private overlay!: HTMLElement;

  private notebookContent: HTMLElement;
  private fileList: HTMLElement;
  private editor: HTMLTextAreaElement;
  private currentFilePath: string | null = null;
  private stopWatchingFile: (() => void) | null = null;
  private debouncedSave: null | (() => void) = null;

  constructor(private readonly scene: Phaser.Scene) {
    this.element = this.createNotebookElement();
    this.notebookContent = this.element.querySelector(".notebook-content")!;
    this.fileList = this.element.querySelector(".notebook-files")!;
    this.editor = this.element.querySelector("#notebook-editor")!;

    this.attachToGame();
    this.setupEventListeners();
    this.loadFiles();

    this.updateEditorState();
  }

  private createNotebookElement(): HTMLElement {
    const notebook = document.createElement("div");
    notebook.className = "notebook";

    this.overlay = document.createElement("div");
    this.overlay.className = "notebook-overlay";

    notebook.innerHTML = `
      <div class="notebook-tab">
        <span class="tab-label">Notes</span>
      </div>
      <div class="notebook-content">
        <div class="notebook-files"></div>
        <textarea id="notebook-editor"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          placeholder="Select a note to edit..."
        ></textarea>
      </div>
    `;
    return notebook;
  }

  private setupEventListeners(): void {
    const tab = this.element.querySelector(".notebook-tab");

    tab?.addEventListener("click", () => {
      this.toggleNotebook(true);
    });

    // Close notebook when clicking overlay
    this.overlay.addEventListener("click", () => {
      this.toggleNotebook(false);
    });

    // Handle editor focus/blur
    this.editor.addEventListener("focus", () => {
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = false;
      }
    });

    this.editor.addEventListener("blur", () => {
      if (this.scene.input.keyboard) {
        this.scene.input.keyboard.enabled = true;
      }
    });

    // Prevent game controls while typing
    this.editor.addEventListener("keydown", (e) => {
      e.stopPropagation();
    });

    let previousLength = 0;

    // Auto-save on typing
    this.editor.addEventListener("input", () => {
      const currentLength = this.editor.value.length;
      console.log({ currentLength, previousLength });
      const diff = currentLength - previousLength;

      // Only count added characters, not deletions
      if (diff > 0) {
        TeetorTotter.getInstance()?.addOutputTokens(diff);
      }

      previousLength = currentLength;

      // Debounce the save operation
      this.debouncedSave && this.debouncedSave();
    });

    // Move auto-save to separate debounced function
    this.debouncedSave = debounce(() => {
      if (this.currentFilePath) {
        this.saveFileContent(this.currentFilePath, this.editor.value);
      }
    }, 300);
  }

  private toggleNotebook(open: boolean): void {
    if (open) {
      this.element.classList.add("open");
      this.overlay.classList.add("visible");
    } else {
      this.element.classList.remove("open");
      this.overlay.classList.remove("visible");
      this.scene.input.keyboard!.enabled = true;
    }
  }

  private attachToGame(): void {
    const gameContainer = document.getElementById("game");
    if (gameContainer) {
      gameContainer.appendChild(this.overlay);

      gameContainer.appendChild(this.element);
    }
  }

  async loadFiles(): Promise<void> {
    try {
      const files = await window.electronAPI.getMdFiles();
      this.fileList.innerHTML = "";

      files.forEach((file) => {
        const entry = document.createElement("div");
        entry.className = "notebook-file";
        entry.textContent = file.name;
        entry.addEventListener("click", () => {
          this.loadFileContent(file.path);
          // Highlight selected file
          this.fileList
            .querySelectorAll(".notebook-file")
            .forEach((el) => el.classList.remove("selected"));
          entry.classList.add("selected");
        });
        this.fileList.appendChild(entry);
      });
    } catch (err) {
      console.error("Failed to load files:", err);
    }
  }

  async loadFileContent(filepath: string): Promise<void> {
    try {
      const content = await window.electronAPI.readFile(filepath);
      this.editor.value = content;
      this.currentFilePath = filepath;
      this.updateEditorState();

      if (this.stopWatchingFile) {
        this.stopWatchingFile();
      }

      this.stopWatchingFile = window.electronAPI.watchFile(
        filepath,
        (updatedContent: string) => {
          if (this.editor.value !== updatedContent) {
            this.editor.value = updatedContent;
          }
        }
      );
    } catch (err) {
      console.error("Failed to load file:", err);
    }
  }

  private async saveFileContent(
    filepath: string,
    content: string
  ): Promise<void> {
    try {
      await window.electronAPI.writeFile(filepath, content);
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }

  private updateEditorState(): void {
    if (this.currentFilePath) {
      this.editor.removeAttribute("readonly");
      this.editor.classList.remove("disabled");
    } else {
      this.editor.setAttribute("readonly", "true");
      this.editor.classList.add("disabled");
    }
  }

  destroy(): void {
    if (this.stopWatchingFile) {
      this.stopWatchingFile();
    }
    this.element.remove();
  }
}
