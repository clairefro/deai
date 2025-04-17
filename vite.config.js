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
          server: {
            hmr: {
              overlay: false,
              protocol: "ws",
            },
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
    minify: "terser",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/renderer/index.html"), // Entry point for renderer
      },
      // this helps with tree shaking
      output: {
        manualChunks: {
          phaser: ["phaser"],
        },
      },
    },
  },
  // help with tree shaking
  optimizeDeps: {
    include: ["phaser"],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
