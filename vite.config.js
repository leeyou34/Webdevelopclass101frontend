import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 하위 경로에 올릴 때(예: https://the9stones.com/app/) VITE_BASE=/app/ 로 빌드합니다.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
