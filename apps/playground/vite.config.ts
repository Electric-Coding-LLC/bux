import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@bux/exporter/browser": fileURLToPath(
        new URL("../../packages/exporter/src/browser.ts", import.meta.url)
      )
    }
  }
});
