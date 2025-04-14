const { contextBridge, ipcRenderer } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");

// TODO - make notes dir dynamic and updateable
const NOTES_DIR = path.join(__dirname, "test");

contextBridge.exposeInMainWorld("electronAPI", {
  async getFiles() {
    const files = await fs.readdir(NOTES_DIR);
    return files;
  },
  async readFile(filename) {
    const content = await fs.readFile(path.join(NOTES_DIR, filename), "utf-8");
    return content;
  },
});
