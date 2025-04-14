const { app, BrowserWindow } = require("electron");
const path = require("path");

const { BACKGROUND_COLOR } = require("./constants");

// --- HOT RELOAD FOR DEVELOPMENT ------

if (process.env.NODE_ENV === "development") {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  });

  console.log("Hot reload listening...");
}

// --------------------------------------

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    useContentSize: true,
    backgroundColor: BACKGROUND_COLOR,
  });
  win.setAspectRatio = 1.33;
  win.loadFile("renderer/index.html");
}

app.whenReady().then(() => {
  createWindow();
});
