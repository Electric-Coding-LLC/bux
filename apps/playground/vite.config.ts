import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@bux/exporter/browser",
        replacement: fileURLToPath(
          new URL("../../packages/exporter/src/browser.ts", import.meta.url)
        )
      },
      {
        find: /^@bux\/(.+)$/,
        replacement: fileURLToPath(
          new URL("../../packages/$1/src/index.ts", import.meta.url)
        )
      }
    ]
  }
});
