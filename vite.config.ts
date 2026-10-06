import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In development, /api goes to the website's API (default: a local backend on :8000).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": process.env.DEV_API_TARGET ?? "http://localhost:8000" } },
});
