import Phaser from "phaser";
declare class MainScene extends Phaser.Scene {
    private config;
    private notebook;
    private notebookOpen;
    private noteContent;
    private fileList;
    private notebookTab;
    private settingsIcon;
    private settingsMenu;
    private fileEntries;
    preload(): void;
    create(): Promise<void>;
    createNotebook(): void;
    loadFiles(): Promise<void>;
    loadFileContent(filepath: string): Promise<void>;
    update(): void;
    createSettings(): void;
}
export default MainScene;
