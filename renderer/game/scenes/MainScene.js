class MainScene extends Phaser.Scene {
  preload() {
    // this.load.image("bg", "path/to/bg.png"); // Optional
  }
  create() {
    this.add.text(100, 100, "Welcome to the Library of Babel", {
      font: "24px monospace",
      fill: "#ffffff",
    });
    // this.createNotebook();
  }

  createNotebook() {
    // Create a container for the entire notebook UI
    this.notebook = this.add.container(0, 0);

    // Create the "closed" notebook tab at bottom
    const tab = this.add.graphics();
    tab.fillStyle(0x8b6b57, 1); // Warm brown color
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
    notebook.fillStyle(0x8b6b57, 0.95); // Slightly transparent
    notebook.fillRoundedRect(0, 0, 800, 600, 8);

    // File explorer section
    const explorer = this.add.graphics();
    explorer.fillStyle(0x6b4423, 1);
    explorer.fillRect(10, 10, 200, 580);

    // Note content area
    const contentArea = this.add.graphics();
    contentArea.fillStyle(0xfff8dc, 1); // Cream color
    contentArea.fillRect(220, 10, 570, 580);

    // Add text elements
    const fileList = this.add.text(20, 20, "", {
      font: "16px monospace",
      fill: "#ffffff",
      wordWrap: { width: 180 },
    });

    const noteContent = this.add.text(230, 20, "", {
      font: "16px monospace",
      fill: "#000000",
      wordWrap: { width: 550 },
    });

    // Add everything to the open notebook container
    this.notebookOpen.add([
      notebook,
      explorer,
      contentArea,
      fileList,
      noteContent,
    ]);

    // Position the open notebook
    this.notebookOpen.setPosition(
      (this.cameras.main.width - 800) / 2,
      (this.cameras.main.height - 600) / 2
    );

    // Handle clicking the tab
    tab.on("pointerdown", () => {
      this.notebookOpen.setVisible(!this.notebookOpen.visible);
    });

    // Handle window resize
    // this.scale.on("resize", () => this.handleResize());

    // Store references for later use
    this.notebookTab = tab;
    this.fileList = fileList;
    this.noteContent = noteContent;

    // Load initial file list
    this.loadFiles();
  }

  async loadFiles() {
    const files = await window.electronAPI.getFiles();
    this.fileList.setText(files.map((f) => `📄 ${f}`).join("\n"));
  }

  update() {
    // Game loop logic
  }
}

export default MainScene;
