class MainScene extends Phaser.Scene {
  preload() {
    // Optional preload of assets
  }

  create() {
    this.add.text(100, 100, "Welcome to the Library of Babel", {
      font: "24px monospace",
      fill: "#ffffff",
    });
    this.createNotebook();
  }

  createNotebook() {
    // Create a container for the entire notebook UI
    this.notebook = this.add.container(0, 0);

    // Create the "closed" notebook tab at bottom
    const tab = this.add.graphics();
    tab.fillStyle(0x8b6b57, 1);
    tab.fillRoundedRect(0, 0, 800, 40, 8);
    tab.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 800, 40),
      Phaser.Geom.Rectangle.Contains
    );

    // Position the tab at bottom of screen
    tab.x = (this.cameras.main.width - 800) / 2;
    tab.y = this.cameras.main.height - 40;

    // Create the full notebook view (initially hidden)
    this.notebookOpen = this.add.container(0, 0);
    this.notebookOpen.setVisible(false);

    // Notebook background
    const notebook = this.add.graphics();
    notebook.fillStyle(0x8b6b57, 0.95);
    notebook.fillRoundedRect(0, 0, 800, 600, 8);

    // File explorer section
    const explorer = this.add.graphics();
    explorer.fillStyle(0x6b4423, 1);
    explorer.fillRect(10, 10, 200, 580);

    // Note content area
    const contentArea = this.add.graphics();
    contentArea.fillStyle(0xfff8dc, 1);
    contentArea.fillRect(220, 10, 570, 580);

    // Create note content area
    this.noteContent = this.add.text(
      230,
      20,
      "Select a file to view its contents",
      {
        font: "16px monospace",
        fill: "#000000",
        wordWrap: { width: 550 },
        lineSpacing: 8,
        backgroundColor: "#fff8dc",
        padding: { x: 15, y: 15 },
        maxLines: 30,
      }
    );

    // Create file list area
    this.fileList = this.add.text(20, 20, "", {
      font: "16px monospace",
      fill: "#ffffff",
      wordWrap: { width: 180 },
    });

    // Add everything to the open notebook container
    this.notebookOpen.add([
      notebook,
      explorer,
      contentArea,
      this.fileList,
      this.noteContent,
    ]);

    // Position the open notebook
    this.notebookOpen.setPosition(
      (this.cameras.main.width - 800) / 2,
      (this.cameras.main.height - 600) / 2
    );

    // Handle clicking the tab
    tab.on("pointerdown", () => {
      console.log("Tab clicked");
      this.notebookOpen.setVisible(!this.notebookOpen.visible);
    });

    // Store tab reference
    this.notebookTab = tab;

    // Load initial file list
    this.loadFiles();
  }

  async loadFiles() {
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
      files.forEach((filename, index) => {
        const fileEntry = this.add.text(20, 20 + index * 25, `📄 ${filename}`, {
          font: "16px monospace",
          fill: "#ffffff",
        });

        fileEntry.setInteractive({ useHandCursor: true });

        fileEntry.on("pointerdown", () => {
          console.log(`Clicked file: ${filename}`);
          this.loadFileContent(filename);
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

  async loadFileContent(filename) {
    console.log("Loading file:", filename);
    try {
      const content = await window.electronAPI.readFile(filename);
      console.log("Content loaded:", content);

      this.noteContent.setText(content);
      this.noteContent.setStyle({
        font: "16px monospace",
        fill: "#000000",
        wordWrap: { width: 550 },
        lineSpacing: 8,
        backgroundColor: "#fff8dc",
        padding: { x: 15, y: 15 },
        maxLines: 30,
      });
    } catch (err) {
      console.error("Failed to load file:", err);
      this.noteContent.setText("Error loading file content");
    }
  }

  update() {
    // Game loop logic
  }
}

export default MainScene;
