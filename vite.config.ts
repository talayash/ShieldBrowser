import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

function copyManifestPlugin() {
  return {
    name: "copy-manifest",
    closeBundle() {
      const distDir = resolve(__dirname, "dist");
      copyFileSync(
        resolve(__dirname, "manifest.json"),
        resolve(distDir, "manifest.json")
      );
      const iconsDir = resolve(distDir, "icons");
      if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
      for (const size of [16, 32, 48, 128]) {
        const name = `icon-${size}.png`;
        copyFileSync(
          resolve(__dirname, "public/icons", name),
          resolve(iconsDir, name)
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyManifestPlugin()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
      },
    },
  },
});
