const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  saveNote: (content) => ipcRenderer.send("save-note", content),
});
