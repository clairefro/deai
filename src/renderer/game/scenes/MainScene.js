import Phaser from "phaser";
class MainScene extends Phaser.Scene {
    constructor() {
        super(...arguments);
        this.fileEntries = [];
    }
    preload() {
        // Optional preload of assets
    }
    async create() {
        this.config = await window.electronAPI.getConfig();
        this.add.text(100, 100, "Welcome to the Library of Babel", {
            font: "24px monospace",
            // @ts-ignore
            fill: "#ffffff",
        });
        this.createNotebook();
        this.createSettings();
    }
    createNotebook() {
        // Create a container for the entire notebook UI
        this.notebook = this.add.container(0, 0);
        // Create the "closed" notebook tab at bottom
        const tab = this.add.graphics();
        tab.fillStyle(0x8b6b57, 1);
        tab.fillRoundedRect(0, 0, 800, 40, 8);
        tab.setInteractive(new Phaser.Geom.Rectangle(0, 0, 800, 40), Phaser.Geom.Rectangle.Contains);
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
        this.noteContent = this.add.text(230, 20, "Select a file to view its contents", {
            font: "16px monospace",
            // @ts-ignore
            fill: "#000000",
            wordWrap: { width: 550 },
            lineSpacing: 8,
            backgroundColor: "#fff8dc",
            padding: { x: 15, y: 15 },
            maxLines: 30,
        });
        // Create file list area
        this.fileList = this.add.text(20, 20, "", {
            font: "16px monospace",
            // @ts-ignore
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
        this.notebookOpen.setPosition((this.cameras.main.width - 800) / 2, (this.cameras.main.height - 600) / 2);
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
            files.forEach((file, index) => {
                console.log({ file });
                // Display just the filename but store the full path
                // const filename = path.basename(file);
                // TODO: FIX
                const filename = "foo.md";
                const fileEntry = this.add.text(20, 20 + index * 25, filename, {
                    font: "16px monospace",
                    // @ts-ignore
                    fill: "#ffffff",
                });
                fileEntry.setInteractive({ useHandCursor: true });
                fileEntry.on("pointerdown", () => {
                    console.log(`Clicked file: ${file}`); // Log full path
                    this.loadFileContent(file); // Pass full path to loadFileContent
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
        }
        catch (err) {
            console.error("Failed to load files:", err);
        }
    }
    async loadFileContent(filepath) {
        console.log("Loading file:", filepath);
        try {
            const content = await window.electronAPI.readFile(filepath);
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
        }
        catch (err) {
            console.error("Failed to load file:", err);
            this.noteContent.setText("Error loading file content");
        }
    }
    update() {
        // Game loop logic
    }
    createSettings() {
        // Create settings icon container
        this.settingsIcon = this.add.container(this.cameras.main.width - 50, this.cameras.main.height - 50);
        // Create gear icon
        const gear = this.add.graphics();
        gear.lineStyle(2, 0xffffff);
        gear.fillStyle(0x666666, 1);
        // Draw gear shape
        gear.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 15;
            const y = Math.sin(angle) * 15;
            if (i === 0)
                gear.moveTo(x, y);
            else
                gear.lineTo(x, y);
        }
        gear.closePath();
        gear.fill();
        gear.stroke();
        // Make gear interactive
        gear.setInteractive(new Phaser.Geom.Circle(0, 0, 15), Phaser.Geom.Circle.Contains);
        this.settingsIcon.add(gear);
        // Create settings menu container with correct positioning
        this.settingsMenu = this.add.container(this.cameras.main.width - 300, 100 // Position from top instead of bottom
        );
        this.settingsMenu.setVisible(false);
        // Menu background
        const menuBg = this.add.graphics();
        menuBg.fillStyle(0x333333, 0.95);
        menuBg.fillRoundedRect(0, 0, 250, 300, 8);
        // Menu title
        const title = this.add.text(20, 20, "Settings", {
            font: "20px monospace",
            //@ts-ignore
            fill: "#ffffff",
        });
        // Settings options using actual config values
        const options = [
            {
                key: "notesDir",
                text: "Notes Directory",
                value: this.config.notesDir || "Not set",
            },
        ];
        const optionTexts = options.map((option, i) => {
            const y = 70 + i * 50;
            const label = this.add.text(20, y, option.text, {
                font: "16px monospace",
                //@ts-ignore
                fill: "#ffffff",
            });
            const value = this.add
                .text(20, y + 20, option.value, {
                font: "14px monospace",
                //@ts-ignore
                fill: "#aaaaaa",
            })
                .setInteractive({ useHandCursor: true });
            // Make value clickable to edit
            value.on("pointerdown", async () => {
                // Open native directory picker
                const selectedDir = await window.electronAPI.selectDirectory();
                if (selectedDir) {
                    // Update config with selected directory
                    const updates = { [option.key]: selectedDir };
                    this.config = await window.electronAPI.updateConfig(updates);
                    // Update display
                    value.setText(selectedDir);
                    // Reload files with new directory
                    if (option.key === "notesDir") {
                        this.loadFiles();
                    }
                }
            });
            return [label, value];
        });
        // Add all elements to menu
        this.settingsMenu.add([menuBg, title, ...optionTexts.flat()]);
        gear.on("pointerdown", () => {
            this.settingsMenu.setVisible(!this.settingsMenu.visible);
        });
        // Add menu to main container
        this.add.existing(this.settingsMenu);
    }
}
export default MainScene;
//# sourceMappingURL=MainScene.js.map