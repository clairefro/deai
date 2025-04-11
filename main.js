const { app, BrowserWindow } = require("electron");
const path = require("path");

// --- HOT RELOAD FOR DEVELOPMENT ------

if (process.env.NODE_ENV === "development") {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "node_modules", ".bin", "electron"),
  });

  console.log("Hot reload listening...");

  // try {
  //   require("electron-reloader")(module, {
  //     // Watch the renderer directory specifically
  //     watchRenderer: true,
  //     ignore: ["node_modules", ".git", "dist"],
  //     debug: true,
  //   });
  // } catch (_) {}
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
  });

  win.loadFile("renderer/index.html");
}

app.whenReady().then(() => {
  createWindow();
});
