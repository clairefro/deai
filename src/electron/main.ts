import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import * as fs from "node:fs/promises";

import { Config, ConfigSettingsUpdate } from "../shared/Config";

import { BACKGROUND_COLOR } from "./constants";

// --- HOT RELOAD FOR DEVELOPMENT ------

if (process.env.NODE_ENV === "development") {
  const electronReload = require("electron-reload");
  const projectRoot = path.join(__dirname, "..", "..");

  electronReload(__dirname, {
    electron: path.join(projectRoot, "node_modules", "electron"),
  });
  console.log("Hot reload listening...");
}

// --------------------------------------

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      //@ts-ignore
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    useContentSize: true,
    backgroundColor: BACKGROUND_COLOR,
  });
  // @ts-ignore
  win.setAspectRatio(1.33);

  if (process.env.NODE_ENV === "development") {
    // In development, load from Vite dev server
    win.loadURL("http://localhost:5173");
  } else {
    // In production, load from built files
    win.loadFile(path.join(__dirname, "../renderer", "index.html"));
  }
}

app.whenReady().then(async () => {
  const config = new Config(app);
  await config.ensureConfigDirs();

  // Add IPC handlers
  ipcMain.handle("get-config", async (event) => {
    return await config.getConfig();
  });

  // Add IPC handlers
  ipcMain.handle("select-dir", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select Notes Directory",
      buttonLabel: "Use This Folder",
    });

    if (!result.canceled) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle("update-config", async (_, updates: ConfigSettingsUpdate) => {
    return await config.updateConfig(updates);
  });

  ipcMain.handle(
    "write-file",
    async (_event, filepath: string, content: string) => {
      try {
        await fs.writeFile(filepath, content, "utf-8");
        return { success: true };
      } catch (error: any) {
        console.error("Failed to write file:", error);
        return { success: false, error: error.message };
      }
    }
  );

  createWindow();
});
