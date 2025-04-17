import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import path from "path";

export default defineConfig({
  root: "src/renderer",
  base: "/",
  plugins: [
    electron({
      main: {
        entry: "src/main.ts",
        vite: {
          build: {
            outDir: "dist",
          },
        },
      },
      preload: {
        input: "src/preload.ts",
        vite: {
          build: {
            outDir: "dist",
          },
        },
      },
    }),
    renderer(),
  ],
  build: {
    outDir: path.resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/renderer/index.html"), // Entry point for renderer
      },
    },
  },
  server: {
    port: 5173, // Ensure Vite dev server runs on this port
    strictPort: true, // Fail if the port is already in use
  },
});
