import * as Phaser from "phaser";
import { debounce } from "../../../shared/util/debounce";

export class Notebook {
  private scene: Phaser.Scene;
  private notebook!: Phaser.GameObjects.Container;
  private notebookOpen!: Phaser.GameObjects.Container;
  private noteContent!: Phaser.GameObjects.Text;
  private fileList!: Phaser.GameObjects.Text;
  private notebookTab!: Phaser.GameObjects.Graphics;
  private fileEntries: Phaser.GameObjects.Text[] = [];
  private editInput!: Phaser.GameObjects.DOMElement;
  private currentFilePath: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  create(): void {
    // Create a container for the entire notebook UI
    this.notebook = this.scene.add.container(0, 0);

    // Create the "closed" notebook tab at bottom
    const tab = this.scene.add.graphics();
    tab.fillStyle(0x8b6b57, 1);
    tab.fillRoundedRect(0, 0, 800, 40, 8);
    tab.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 800, 40),
      Phaser.Geom.Rectangle.Contains
    );

    // Position the tab at bottom of screen
    tab.x = (this.scene.cameras.main.width - 800) / 2;
    tab.y = this.scene.cameras.main.height - 40;

    // Create the full notebook view (initially hidden)
    this.notebookOpen = this.scene.add.container(0, 0);
    this.notebookOpen.setVisible(false);

    // Notebook background
    const notebook = this.scene.add.graphics();
    notebook.fillStyle(0x8b6b57, 0.95);
    notebook.fillRoundedRect(0, 0, 800, 600, 8);

    // File explorer section
    const explorer = this.scene.add.graphics();
    explorer.fillStyle(0x6b4423, 1);
    explorer.fillRect(10, 10, 200, 580);

    // Create file list area
    this.fileList = this.scene.add.text(20, 20, "", {
      font: "16px monospace",
      // @ts-ignore
      fill: "#ffffff",
      wordWrap: { width: 180 },
    });

    // Note content area
    // const contentArea = this.scene.add.graphics();
    // contentArea.fillStyle(0xfff8dc, 1);
    // contentArea.fillRect(220, 10, 570, 580);

    this.editInput = this.scene.add.dom(230, 20).createFromHTML(`
      <textarea id="editInput" style="
        width: 550px; 
        height: 550px; 
        font-family: monospace; 
        font-size: 16px; 
        padding: 15px; 
        border: 1px solid #ccc; 
        border-radius: 4px; 
        background-color: #fff8dc; 
        display: none;
      "></textarea>
    `);

    const textarea = document.getElementById(
      "editInput"
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.addEventListener(
        "input",
        debounce(() => {
          if (this.currentFilePath) {
            this.saveFileContent(this.currentFilePath, textarea.value);
          }
        }, 300) // Save after 300ms of inactivity
      );
    }

    this.notebookOpen.add([notebook, explorer, this.fileList, this.editInput]);

    // Position the open notebook
    this.notebookOpen.setPosition(
      (this.scene.cameras.main.width - 800) / 2,
      (this.scene.cameras.main.height - 600) / 2
    );

    // Handle clicking the tab
    tab.on("pointerdown", () => {
      this.notebookOpen.setVisible(!this.notebookOpen.visible);
    });

    // Store tab reference
    this.notebookTab = tab;

    // Load initial file list
    this.loadFiles();
  }

  async loadFiles(): Promise<void> {
    console.log("Loading files...");
    try {
      const files = await window.electronAPI.getFiles();
      console.log("Files received:", files);

      // Clear existing entries
      if (this.fileEntries) {
        this.fileEntries.forEach((entry) => entry.destroy());
      }
      this.fileEntries = [];

      // Create interactive file entries
      files.forEach((file, index) => {
        // Display just the filename but store the full path
        const fileEntry = this.scene.add.text(20, 20 + index * 25, file.name, {
          font: "16px monospace",
          // @ts-ignore
          fill: "#ffffff",
        });

        fileEntry.setInteractive({ useHandCursor: true });

        fileEntry.on("pointerdown", () => {
          console.log(`Clicked file: ${file.path}`); // Log full path
          this.loadFileContent(file.path); // Pass full path to loadFileContent
        });

        fileEntry.on("pointerover", () => {
          fileEntry.setStyle({ fill: "#ffff00" });
          fileEntry.setScale(1.05);
        });

        fileEntry.on("pointerout", () => {
          fileEntry.setStyle({ fill: "#ffffff" });
          fileEntry.setScale(1);
        });

        this.fileEntries.push(fileEntry);
        this.notebookOpen.add(fileEntry);
      });
    } catch (err) {
      console.error("Failed to load files:", err);
    }
  }

  async loadFileContent(filepath: string): Promise<void> {
    console.log("Loading file:", filepath);
    try {
      const content = await window.electronAPI.readFile(filepath);
      console.log("Content loaded:", content);

      const textarea = document.getElementById(
        "editInput"
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = content; // Populate the textarea with file content
        textarea.style.display = "block"; // Make the textarea visible
      }

      this.currentFilePath = filepath;
    } catch (err) {
      console.error("Failed to load file:", err);
      this.noteContent.setText("Error loading file content");
    }
  }

  async saveFileContent(filepath: string, content: string): Promise<void> {
    console.log("Saving file:", filepath);
    try {
      await window.electronAPI.writeFile(filepath, content);
      console.log("File saved successfully");
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }
}
