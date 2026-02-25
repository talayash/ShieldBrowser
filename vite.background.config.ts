import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/background/index.ts"),
      name: "background",
      formats: ["iife"],
      fileName: () => "background.js",
    },
    rollupOptions: {
      output: {
        entryFileNames: "background.js",
        extend: true,
      },
    },
  },
});
