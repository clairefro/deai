import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import * as fs from "node:fs/promises";

import { Config, ConfigSettingsUpdate } from "../shared/Config";
import { LibrariansStore } from "../shared/LibrarianStore";
import { TraversalStore } from "../shared/TraversalStore";
import { TraversalRecord } from "../renderer/types";

import { LibrarianData } from "../shared/types";

import { BACKGROUND_COLOR } from "./constants";

if (!app) {
  console.error("Electron app module not available");
  process.exit(1);
}

function createWindow(): void {
  console.log("MAIN, SKIP_SPLASH", process.env.SKIP_SPLASH);
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: app.isPackaged
      ? path.join(process.resourcesPath, "build/icons/deai.png")
      : path.join(__dirname, "../../build/icons/deai.png"),

    webPreferences: {
      nodeIntegration: true,
      //@ts-ignore
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      additionalArguments: [`--skip-splash=${process.env.SKIP_SPLASH}`],
    },
    useContentSize: true,
    backgroundColor: BACKGROUND_COLOR,
  });
  // @ts-ignore
  win.setAspectRatio(1.33);

  // was experiencing dev server errors occassionally on hot reload relating to gpu crash
  // sometimes vite process was hanging (ps aux | grep vite) (kill - 9 <pid of vite>)
  win.webContents.on("render-process-gone", (event, details) => {
    console.error("Renderer process crashed:", details);
    win.reload();
  });

  if (process.env.NODE_ENV === "development") {
    // in dev, load from Vite dev server
    win.loadURL("http://localhost:5173");

    // uncomment to open devtools by deafult - kinda buggy tbh
    // win.webContents.openDevTools();
  } else {
    // In production, load from built files
    win.loadFile(path.join(__dirname, "../renderer", "index.html"));
  }
}

app.whenReady().then(async () => {
  const config = new Config(app);
  await config.ensureConfigDirs();
  await config.loadConfig();

  const librariansStore = await LibrariansStore.create(app.getPath("userData"));
  const traversalStore = await TraversalStore.create(app.getPath("userData"));

  /** Config handlers */
  ipcMain.handle("get-config", async (event: any) => {
    return await config.getConfig();
  });

  ipcMain.handle("open-dir-select", async () => {
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

  ipcMain.handle(
    "update-config",
    async (_: any, updates: ConfigSettingsUpdate) => {
      return await config.setMany(updates);
    }
  );

  ipcMain.handle(
    "write-file",
    async (_event: any, filepath: string, content: string) => {
      try {
        await fs.writeFile(filepath, content, "utf-8");
        return { success: true };
      } catch (error: any) {
        console.error("Failed to write file:", error);
        return { success: false, error: error.message };
      }
    }
  );

  /** Librarian handlers */
  ipcMain.handle("get-librarians-data", async () => {
    return await librariansStore.getAll();
  });

  ipcMain.handle("get-librarians-ids", async () => {
    const librariansIds = await librariansStore.getAllIds();
    return librariansIds;
  });

  ipcMain.handle("get-librarian-by-id", async (_event, id: string) => {
    const librarian = await librariansStore.getById(id);
    return librarian;
  });

  ipcMain.handle(
    "upsert-librarian",
    async (_event, librarian: LibrarianData) => {
      try {
        await librariansStore.upsertLibrarian(librarian);
        return { success: true };
      } catch (error) {
        console.error("Failed to upsert librarian:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("get-encountered-librarians", async () => {
    console.log("Main process: Fetching encountered librarians");
    const librarians = await librariansStore.getEncountered();
    console.log("Main process: Found librarians:", librarians);
    return librarians;
  });

  /** Traversal handlers */
  ipcMain.handle("add-traversal", async (_event, record: TraversalRecord) => {
    await traversalStore.addTraversal(record);
  });

  ipcMain.handle("get-recent-traversals", async (_event, limit?: number) => {
    return await traversalStore.getRecentHistory(limit);
  });

  ipcMain.handle("get-unique-galleries-count", async () => {
    return await traversalStore.getUniqueGalleriesCount();
  });

  ipcMain.handle("get-last-location", async () => {
    return await traversalStore.getLastLocation();
  });

  createWindow();
});
